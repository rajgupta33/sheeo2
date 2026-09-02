-- SheEO Membership Portal - one-click application review.
-- Applicants now create their Supabase Auth account and a member_applications
-- row at apply time (see /apply-directory/). These two functions let an admin
-- turn a pending application into an active membership (or a decline) in a
-- single atomic, audited action instead of a manual multi-step SQL/console
-- procedure.

create or replace function public.approve_application(p_application_id uuid, p_plan_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_application public.member_applications%rowtype;
  v_user_id uuid;
  v_plan_id uuid;
  v_membership_id uuid;
  v_referrer_user_id uuid;
  v_referral_id uuid;
begin
  if v_actor is null or not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select * into v_application from public.member_applications a where a.id = p_application_id for update;
  if not found then raise exception 'Application not found' using errcode = 'P0002'; end if;
  if v_application.status <> 'pending' then
    raise exception 'Only pending applications can be approved' using errcode = '22023';
  end if;

  select id into v_user_id from auth.users where lower(email) = lower(v_application.email) limit 1;
  if v_user_id is null then
    raise exception 'No portal account found for this email yet. Ask the applicant to finish creating their portal login, then try again.' using errcode = '22023';
  end if;

  v_plan_id := p_plan_id;
  if v_plan_id is null then
    select id into v_plan_id from public.membership_plans where active order by created_at limit 1;
  end if;
  if v_plan_id is null then
    raise exception 'No active membership plan is configured' using errcode = '22023';
  end if;

  -- Reuses the existing protected activation path (welcome points + notification + audit row).
  v_membership_id := public.activate_membership(v_user_id, v_plan_id);

  update public.member_applications
  set status = 'approved', reviewed_by = v_actor, reviewed_at = now()
  where id = v_application.id;

  -- Close the referral loop automatically: if this applicant used a referral code,
  -- create the referral row and pay it out now that they are an active member.
  if v_application.referral_code_used is not null then
    select id into v_referrer_user_id from public.profiles where lower(referral_code) = lower(v_application.referral_code_used) limit 1;
    if v_referrer_user_id is not null and v_referrer_user_id <> v_user_id then
      insert into public.referrals (referrer_user_id, referral_code, referred_email, referred_user_id, application_id, status)
      values (v_referrer_user_id, v_application.referral_code_used, v_application.email, v_user_id, v_application.id, 'captured')
      on conflict (referred_user_id) where referred_user_id is not null do nothing
      returning id into v_referral_id;
      if v_referral_id is not null then
        perform public.qualify_referral(v_referral_id);
      end if;
    end if;
  end if;

  insert into public.audit_log (actor_user_id, action, target_type, target_id, metadata_json)
  values (v_actor, 'approve_application', 'member_application', v_application.id, jsonb_build_object('user_id', v_user_id, 'membership_id', v_membership_id));

  return v_membership_id;
end;
$$;

create or replace function public.reject_application(p_application_id uuid, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_application public.member_applications%rowtype;
  v_user_id uuid;
begin
  if v_actor is null or not private.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  if nullif(trim(p_reason), '') is null then raise exception 'Rejection reason is required' using errcode = '22023'; end if;

  select * into v_application from public.member_applications a where a.id = p_application_id for update;
  if not found then raise exception 'Application not found' using errcode = 'P0002'; end if;
  if v_application.status <> 'pending' then raise exception 'Only pending applications can be rejected' using errcode = '22023'; end if;

  update public.member_applications
  set status = 'rejected', reviewed_by = v_actor, reviewed_at = now(), review_notes = trim(p_reason)
  where id = v_application.id;

  select id into v_user_id from auth.users where lower(email) = lower(v_application.email) limit 1;
  if v_user_id is not null then
    insert into public.notifications (user_id, type, title, message)
    values (v_user_id, 'application_rejected', 'Update on your SheEO application', 'Your application was not approved at this time. ' || trim(p_reason));
  end if;

  insert into public.audit_log (actor_user_id, action, target_type, target_id, metadata_json)
  values (v_actor, 'reject_application', 'member_application', v_application.id, jsonb_build_object('reason', trim(p_reason)));
  return true;
end;
$$;

revoke execute on function public.approve_application(uuid, uuid) from public, anon;
revoke execute on function public.reject_application(uuid, text) from public, anon;
grant execute on function public.approve_application(uuid, uuid) to authenticated;
grant execute on function public.reject_application(uuid, text) to authenticated;

comment on function public.approve_application(uuid, uuid) is 'Admin-only: activates membership for an applicant who already has a portal account, then auto-qualifies any referral used at apply time.';
comment on function public.reject_application(uuid, text) is 'Admin-only: declines a pending application and notifies the applicant if they already have a portal account.';
