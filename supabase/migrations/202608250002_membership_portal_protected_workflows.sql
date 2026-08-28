-- SheEO Membership Portal - protected, atomic workflow functions.
-- Every SECURITY DEFINER function pins search_path and verifies the caller.

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, business_name, referral_code)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'SheEO Member'),
    nullif(new.raw_user_meta_data ->> 'business_name', ''),
    'SHEEO' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function private.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_sheeo_profile on auth.users;
create trigger on_auth_user_created_sheeo_profile
after insert on auth.users
for each row execute function private.handle_new_auth_user();

insert into public.profiles (id, full_name, business_name, referral_code)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), nullif(split_part(coalesce(u.email, ''), '@', 1), ''), 'SheEO Member'),
  nullif(u.raw_user_meta_data ->> 'business_name', ''),
  'SHEEO' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
from auth.users u
on conflict (id) do nothing;

insert into public.membership_plans (name, billing_type, currency, benefits_json)
values (
  'SheEO Annual Membership',
  'annual',
  'AED',
  '["Curated founder community", "SheEO Points and rewards", "Founder visibility", "Member experiences"]'::jsonb
)
on conflict (lower(name)) do nothing;

insert into public.rewards (name, points_cost, reward_type, fulfillment_instructions)
values
  ('50% Event Access', 100, 'event_discount', 'Admin confirms an eligible SheEO event and records the discount or code.'),
  ('Instagram Reel Feature', 100, 'instagram_reel', 'Admin schedules and fulfills a dedicated founder Reel feature.')
on conflict (reward_type) do update set
  name = excluded.name,
  points_cost = excluded.points_cost,
  fulfillment_instructions = excluded.fulfillment_instructions,
  active = true;

create or replace function public.activate_membership(
  p_user_id uuid,
  p_plan_id uuid,
  p_start_date date default current_date,
  p_end_date date default null,
  p_payment_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_membership_id uuid;
  v_end_date date;
begin
  if v_actor is null or not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_user_id is null or not exists (select 1 from auth.users u where u.id = p_user_id) then
    raise exception 'Member account not found' using errcode = '22023';
  end if;
  if not exists (select 1 from public.membership_plans mp where mp.id = p_plan_id and mp.active) then
    raise exception 'Active membership plan not found' using errcode = '22023';
  end if;
  if exists (select 1 from public.memberships m where m.user_id = p_user_id and m.status = 'active') then
    raise exception 'Member already has an active membership' using errcode = '23505';
  end if;

  v_end_date := coalesce(p_end_date, (p_start_date + interval '1 year' - interval '1 day')::date);
  if v_end_date < p_start_date then
    raise exception 'Membership end date must be on or after start date' using errcode = '22023';
  end if;

  insert into public.memberships (
    user_id, plan_id, status, start_date, end_date, payment_status, payment_reference, activated_by
  ) values (
    p_user_id, p_plan_id, 'active', p_start_date, v_end_date, 'paid', nullif(trim(p_payment_reference), ''), v_actor
  ) returning id into v_membership_id;

  insert into public.point_transactions (
    user_id, membership_id, points, transaction_type, description, idempotency_key, created_by
  ) values (
    p_user_id, v_membership_id, 50, 'welcome', 'Membership Activated', 'welcome:' || v_membership_id::text, v_actor
  );

  insert into public.notifications (user_id, type, title, message)
  values (p_user_id, 'membership_activated', 'Welcome to SheEO', 'Your membership is active and 50 SheEO Points have been added.');

  insert into public.audit_log (actor_user_id, action, target_type, target_id, metadata_json)
  values (v_actor, 'activate_membership', 'membership', v_membership_id, jsonb_build_object('user_id', p_user_id, 'welcome_points', 50));

  return v_membership_id;
end;
$$;

create or replace function public.approve_point_claim(p_claim_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_claim public.point_claims%rowtype;
  v_points integer;
begin
  if v_actor is null or not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select * into v_claim from public.point_claims pc where pc.id = p_claim_id for update;
  if not found then raise exception 'Claim not found' using errcode = 'P0002'; end if;
  if v_claim.status = 'approved' then return false; end if;
  if v_claim.status <> 'pending' then raise exception 'Only pending claims can be approved' using errcode = '22023'; end if;
  if not exists (
    select 1 from public.memberships m
    where m.id = v_claim.membership_id and m.user_id = v_claim.user_id and m.status = 'active'
  ) then raise exception 'Claim membership is not active' using errcode = '22023'; end if;

  v_points := case v_claim.claim_type when 'collaboration' then 10 when 'meetup' then 5 end;

  insert into public.point_transactions (
    user_id, membership_id, points, transaction_type, source_id, description, idempotency_key, created_by
  ) values (
    v_claim.user_id,
    v_claim.membership_id,
    v_points,
    v_claim.claim_type::text::public.point_transaction_type,
    v_claim.id,
    case v_claim.claim_type when 'collaboration' then 'Approved Member Collaboration' else 'Approved 1-on-1 Member Meetup' end,
    'claim:' || v_claim.id::text,
    v_actor
  ) on conflict (idempotency_key) where idempotency_key is not null do nothing;

  update public.point_claims set status = 'approved', reviewed_by = v_actor, reviewed_at = now(), rejection_reason = null where id = v_claim.id;
  insert into public.notifications (user_id, type, title, message)
  values (v_claim.user_id, 'claim_approved', 'Your claim was approved', 'Your ' || v_claim.claim_type::text || ' was approved. +' || v_points || ' SheEO Points.');
  insert into public.audit_log (actor_user_id, action, target_type, target_id, metadata_json)
  values (v_actor, 'approve_point_claim', 'point_claim', v_claim.id, jsonb_build_object('user_id', v_claim.user_id, 'points', v_points));
  return true;
end;
$$;

create or replace function public.reject_point_claim(p_claim_id uuid, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_claim public.point_claims%rowtype;
begin
  if v_actor is null or not private.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  if nullif(trim(p_reason), '') is null then raise exception 'Rejection reason is required' using errcode = '22023'; end if;
  select * into v_claim from public.point_claims pc where pc.id = p_claim_id for update;
  if not found then raise exception 'Claim not found' using errcode = 'P0002'; end if;
  if v_claim.status = 'rejected' then return false; end if;
  if v_claim.status <> 'pending' then raise exception 'Only pending claims can be rejected' using errcode = '22023'; end if;

  update public.point_claims set status = 'rejected', reviewed_by = v_actor, reviewed_at = now(), rejection_reason = trim(p_reason) where id = v_claim.id;
  insert into public.notifications (user_id, type, title, message)
  values (v_claim.user_id, 'claim_rejected', 'Your claim needs attention', 'Your claim was not approved. Open the portal to review the reason.');
  insert into public.audit_log (actor_user_id, action, target_type, target_id, metadata_json)
  values (v_actor, 'reject_point_claim', 'point_claim', v_claim.id, jsonb_build_object('user_id', v_claim.user_id, 'reason', trim(p_reason)));
  return true;
end;
$$;

create or replace function public.qualify_referral(p_referral_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_referral public.referrals%rowtype;
  v_membership_id uuid;
begin
  if v_actor is null or not private.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  select * into v_referral from public.referrals r where r.id = p_referral_id for update;
  if not found then raise exception 'Referral not found' using errcode = 'P0002'; end if;
  if v_referral.status = 'rewarded' then return false; end if;
  if v_referral.status = 'invalid' then raise exception 'Invalid referral cannot be qualified' using errcode = '22023'; end if;
  if v_referral.referred_user_id is null or v_referral.referred_user_id = v_referral.referrer_user_id then
    raise exception 'Referral is missing a valid referred member' using errcode = '22023';
  end if;
  if not private.has_active_membership(v_referral.referred_user_id) then
    raise exception 'Referred founder is not an active member' using errcode = '22023';
  end if;
  select m.id into v_membership_id from public.memberships m
  where m.user_id = v_referral.referrer_user_id and m.status = 'active' for update;
  if v_membership_id is null then raise exception 'Referrer does not have an active membership' using errcode = '22023'; end if;

  insert into public.point_transactions (
    user_id, membership_id, points, transaction_type, source_id, description, idempotency_key, created_by
  ) values (
    v_referral.referrer_user_id, v_membership_id, 20, 'referral', v_referral.id,
    'Successful Founder Referral', 'referral:' || v_referral.id::text, v_actor
  ) on conflict (idempotency_key) where idempotency_key is not null do nothing;

  update public.referrals set status = 'rewarded', qualified_at = coalesce(qualified_at, now()), rewarded_at = now() where id = v_referral.id;
  insert into public.promotional_entitlements (user_id, type, source_id, status)
  values (v_referral.referrer_user_id, 'instagram_story_week', v_referral.id, 'pending')
  on conflict (type, source_id) do nothing;
  insert into public.notifications (user_id, type, title, message)
  values (v_referral.referrer_user_id, 'referral_qualified', 'Your referral joined SheEO', '20 SheEO Points were added and your Story feature is pending scheduling.');
  insert into public.audit_log (actor_user_id, action, target_type, target_id, metadata_json)
  values (v_actor, 'qualify_referral', 'referral', v_referral.id, jsonb_build_object('referrer_user_id', v_referral.referrer_user_id, 'points', 20));
  return true;
end;
$$;

create or replace function public.event_checkin(p_event_id uuid, p_checkin_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_event public.events%rowtype;
  v_membership_id uuid;
  v_attendance_id uuid;
begin
  if v_user_id is null or not private.has_active_membership(v_user_id) then raise exception 'Active membership required' using errcode = '42501'; end if;
  select * into v_event from public.events e where e.id = p_event_id;
  if not found or v_event.status <> 'published' then raise exception 'Event is not available for check-in' using errcode = '22023'; end if;
  if v_event.checkin_open_at is null or v_event.checkin_closes_at is null or now() not between v_event.checkin_open_at and v_event.checkin_closes_at then
    raise exception 'Event check-in is closed' using errcode = '22023';
  end if;
  if v_event.checkin_token_hash is null or p_checkin_token is null or extensions.crypt(p_checkin_token, v_event.checkin_token_hash) <> v_event.checkin_token_hash then
    raise exception 'Invalid check-in token' using errcode = '22023';
  end if;
  select m.id into v_membership_id from public.memberships m where m.user_id = v_user_id and m.status = 'active' for update;

  insert into public.event_attendance (event_id, user_id, method)
  values (v_event.id, v_user_id, 'qr')
  on conflict (event_id, user_id) do nothing
  returning id into v_attendance_id;
  if v_attendance_id is null then
    select ea.id into v_attendance_id from public.event_attendance ea where ea.event_id = v_event.id and ea.user_id = v_user_id;
    return v_attendance_id;
  end if;

  if v_event.points_enabled and v_event.attendance_points > 0 then
    insert into public.point_transactions (
      user_id, membership_id, points, transaction_type, source_id, description, idempotency_key
    ) values (
      v_user_id, v_membership_id, v_event.attendance_points, 'event', v_event.id,
      v_event.title || ' Attendance', 'event:' || v_event.id::text || ':' || v_user_id::text
    ) on conflict (idempotency_key) where idempotency_key is not null do nothing;
  end if;
  insert into public.notifications (user_id, type, title, message)
  values (v_user_id, 'event_checkin', 'Event check-in confirmed', 'Your attendance at ' || v_event.title || ' has been recorded.');
  return v_attendance_id;
end;
$$;

create or replace function public.redeem_reward(p_reward_id uuid, p_request_key text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_membership_id uuid;
  v_reward public.rewards%rowtype;
  v_balance integer;
  v_redemption_id uuid;
  v_existing_user uuid;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if nullif(trim(p_request_key), '') is null or char_length(p_request_key) > 120 then raise exception 'Valid request key required' using errcode = '22023'; end if;

  select rr.id, rr.user_id into v_redemption_id, v_existing_user
  from public.reward_redemptions rr where rr.request_key = p_request_key;
  if v_redemption_id is not null then
    if v_existing_user <> v_user_id then raise exception 'Request key is already in use' using errcode = '23505'; end if;
    return v_redemption_id;
  end if;

  select m.id into v_membership_id from public.memberships m
  where m.user_id = v_user_id and m.status = 'active'
    and (m.start_date is null or m.start_date <= current_date)
    and (m.end_date is null or m.end_date >= current_date)
  for update;
  if v_membership_id is null then raise exception 'Active membership required' using errcode = '42501'; end if;
  select * into v_reward from public.rewards r where r.id = p_reward_id and r.active;
  if not found then raise exception 'Reward is not available' using errcode = '22023'; end if;
  select coalesce(sum(pt.points), 0)::integer into v_balance from public.point_transactions pt
  where pt.user_id = v_user_id and pt.membership_id = v_membership_id;
  if v_balance < v_reward.points_cost then raise exception 'Insufficient points' using errcode = '22023'; end if;

  insert into public.reward_redemptions (user_id, membership_id, reward_id, points_cost, request_key)
  values (v_user_id, v_membership_id, v_reward.id, v_reward.points_cost, p_request_key)
  returning id into v_redemption_id;
  insert into public.point_transactions (
    user_id, membership_id, points, transaction_type, source_id, description, idempotency_key
  ) values (
    v_user_id, v_membership_id, -v_reward.points_cost, 'redemption', v_redemption_id,
    'Reward: ' || v_reward.name, 'redemption:' || v_redemption_id::text
  );
  insert into public.notifications (user_id, type, title, message)
  values (v_user_id, 'reward_requested', 'Reward request received', 'Your ' || v_reward.name || ' request has been received.');
  insert into public.audit_log (actor_user_id, action, target_type, target_id, metadata_json)
  values (v_user_id, 'redeem_reward', 'reward_redemption', v_redemption_id, jsonb_build_object('points', v_reward.points_cost, 'reward_id', v_reward.id));
  return v_redemption_id;
end;
$$;

create or replace function public.update_redemption_status(p_redemption_id uuid, p_status public.reward_status, p_admin_notes text default null)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_redemption public.reward_redemptions%rowtype;
begin
  if v_actor is null or not private.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  if p_status not in ('approved', 'scheduled', 'fulfilled') then raise exception 'Use the cancellation function for rejected or cancelled redemptions' using errcode = '22023'; end if;
  select * into v_redemption from public.reward_redemptions rr where rr.id = p_redemption_id for update;
  if not found then raise exception 'Redemption not found' using errcode = 'P0002'; end if;
  if v_redemption.status in ('rejected', 'cancelled') then raise exception 'Cancelled redemption cannot be advanced' using errcode = '22023'; end if;
  update public.reward_redemptions
  set status = p_status, admin_notes = p_admin_notes,
      fulfilled_at = case when p_status = 'fulfilled' then coalesce(fulfilled_at, now()) else fulfilled_at end
  where id = v_redemption.id;
  insert into public.audit_log (actor_user_id, action, target_type, target_id, metadata_json)
  values (v_actor, 'update_redemption_status', 'reward_redemption', v_redemption.id, jsonb_build_object('status', p_status, 'notes', p_admin_notes));
  if p_status = 'fulfilled' then
    insert into public.notifications (user_id, type, title, message)
    values (v_redemption.user_id, 'reward_fulfilled', 'Your SheEO reward is fulfilled', 'Open the portal for your reward details.');
  end if;
  return true;
end;
$$;

create or replace function public.cancel_redemption(p_redemption_id uuid, p_reason text, p_rejected boolean default false)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_redemption public.reward_redemptions%rowtype;
begin
  if v_actor is null or not private.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  if nullif(trim(p_reason), '') is null then raise exception 'Cancellation reason is required' using errcode = '22023'; end if;
  select * into v_redemption from public.reward_redemptions rr where rr.id = p_redemption_id for update;
  if not found then raise exception 'Redemption not found' using errcode = 'P0002'; end if;
  if v_redemption.status in ('rejected', 'cancelled') then return false; end if;
  if v_redemption.status = 'fulfilled' then raise exception 'Fulfilled redemption cannot be cancelled' using errcode = '22023'; end if;

  insert into public.point_transactions (
    user_id, membership_id, points, transaction_type, source_id, description, idempotency_key, created_by
  ) values (
    v_redemption.user_id, v_redemption.membership_id, v_redemption.points_cost, 'refund', v_redemption.id,
    'Refund for cancelled reward', 'redemption-refund:' || v_redemption.id::text, v_actor
  ) on conflict (idempotency_key) where idempotency_key is not null do nothing;
  update public.reward_redemptions
  set status = case when p_rejected then 'rejected'::public.reward_status else 'cancelled'::public.reward_status end,
      admin_notes = trim(p_reason)
  where id = v_redemption.id;
  insert into public.notifications (user_id, type, title, message)
  values (v_redemption.user_id, 'reward_cancelled', 'Reward points refunded', 'Your reward request was cancelled and ' || v_redemption.points_cost || ' points were refunded.');
  insert into public.audit_log (actor_user_id, action, target_type, target_id, metadata_json)
  values (v_actor, 'cancel_redemption', 'reward_redemption', v_redemption.id, jsonb_build_object('reason', trim(p_reason), 'refunded_points', v_redemption.points_cost));
  return true;
end;
$$;

create or replace function public.admin_adjust_points(p_user_id uuid, p_membership_id uuid, p_points integer, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_transaction_id uuid;
begin
  if v_actor is null or not private.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  if p_points = 0 or p_points is null then raise exception 'Adjustment must be non-zero' using errcode = '22023'; end if;
  if nullif(trim(p_reason), '') is null then raise exception 'Adjustment reason is required' using errcode = '22023'; end if;
  if not exists (select 1 from public.memberships m where m.id = p_membership_id and m.user_id = p_user_id) then
    raise exception 'Membership does not belong to member' using errcode = '22023';
  end if;
  insert into public.point_transactions (
    user_id, membership_id, points, transaction_type, description, idempotency_key, created_by
  ) values (
    p_user_id, p_membership_id, p_points, 'admin_adjustment', trim(p_reason), 'admin-adjustment:' || gen_random_uuid()::text, v_actor
  ) returning id into v_transaction_id;
  insert into public.audit_log (actor_user_id, action, target_type, target_id, metadata_json)
  values (v_actor, 'admin_adjust_points', 'point_transaction', v_transaction_id, jsonb_build_object('user_id', p_user_id, 'points', p_points, 'reason', trim(p_reason)));
  return v_transaction_id;
end;
$$;

create or replace function public.change_membership_status(p_membership_id uuid, p_status public.membership_status, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_membership public.memberships%rowtype;
begin
  if v_actor is null or not private.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  if nullif(trim(p_reason), '') is null then raise exception 'Status-change reason is required' using errcode = '22023'; end if;
  select * into v_membership from public.memberships m where m.id = p_membership_id for update;
  if not found then raise exception 'Membership not found' using errcode = 'P0002'; end if;
  if v_membership.status = p_status then return false; end if;
  if v_membership.status = 'approved_unpaid' and p_status = 'active' then
    raise exception 'Use activate_membership to activate and award welcome points safely' using errcode = '22023';
  end if;
  update public.memberships set status = p_status where id = v_membership.id;
  insert into public.audit_log (actor_user_id, action, target_type, target_id, metadata_json)
  values (v_actor, 'change_membership_status', 'membership', v_membership.id, jsonb_build_object('from', v_membership.status, 'to', p_status, 'reason', trim(p_reason)));
  return true;
end;
$$;

create or replace function public.admin_portal_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null or not private.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  select jsonb_build_object(
    'activeMembers', (select count(*) from public.memberships m where m.status = 'active'),
    'pendingApplications', (select count(*) from public.member_applications a where a.status = 'pending'),
    'pendingClaims', (select count(*) from public.point_claims c where c.status = 'pending'),
    'pendingReferrals', (select count(*) from public.referrals r where r.status in ('captured', 'pending', 'qualified')),
    'pendingRedemptions', (select count(*) from public.reward_redemptions rr where rr.status in ('requested', 'approved', 'scheduled')),
    'upcomingEvents', (select count(*) from public.events e where e.event_date >= now() and e.status in ('draft', 'published')),
    'applications', coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at desc) from (select * from public.member_applications order by created_at desc limit 8) a), '[]'::jsonb),
    'auditLog', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', al.id,
        'actor', coalesce(p.full_name, 'System'),
        'action', al.action,
        'target', al.target_type || case when al.target_id is null then '' else ' #' || left(al.target_id::text, 8) end,
        'created_at', al.created_at
      ) order by al.created_at desc)
      from (select * from public.audit_log order by created_at desc limit 8) al
      left join public.profiles p on p.id = al.actor_user_id
    ), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

revoke execute on function public.activate_membership(uuid, uuid, date, date, text) from public, anon;
revoke execute on function public.approve_point_claim(uuid) from public, anon;
revoke execute on function public.reject_point_claim(uuid, text) from public, anon;
revoke execute on function public.qualify_referral(uuid) from public, anon;
revoke execute on function public.event_checkin(uuid, text) from public, anon;
revoke execute on function public.redeem_reward(uuid, text) from public, anon;
revoke execute on function public.update_redemption_status(uuid, public.reward_status, text) from public, anon;
revoke execute on function public.cancel_redemption(uuid, text, boolean) from public, anon;
revoke execute on function public.admin_adjust_points(uuid, uuid, integer, text) from public, anon;
revoke execute on function public.change_membership_status(uuid, public.membership_status, text) from public, anon;
revoke execute on function public.admin_portal_overview() from public, anon;

grant execute on function public.activate_membership(uuid, uuid, date, date, text) to authenticated;
grant execute on function public.approve_point_claim(uuid) to authenticated;
grant execute on function public.reject_point_claim(uuid, text) to authenticated;
grant execute on function public.qualify_referral(uuid) to authenticated;
grant execute on function public.event_checkin(uuid, text) to authenticated;
grant execute on function public.redeem_reward(uuid, text) to authenticated;
grant execute on function public.update_redemption_status(uuid, public.reward_status, text) to authenticated;
grant execute on function public.cancel_redemption(uuid, text, boolean) to authenticated;
grant execute on function public.admin_adjust_points(uuid, uuid, integer, text) to authenticated;
grant execute on function public.change_membership_status(uuid, public.membership_status, text) to authenticated;
grant execute on function public.admin_portal_overview() to authenticated;

comment on function public.redeem_reward(uuid, text) is 'Atomically checks current-period balance, inserts a redemption and deducts its cost. Request key makes browser retries idempotent.';
comment on function public.approve_point_claim(uuid) is 'Admin-only atomic claim approval and point award.';
comment on function public.qualify_referral(uuid) is 'Admin-only idempotent referral qualification, +20 award and Story entitlement creation.';
