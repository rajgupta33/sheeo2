-- SheEO Membership Portal - foundation schema, grants, RLS and private Storage.
-- Protected award/redemption/admin functions are intentionally added separately.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
do $$
begin
  if exists (
    select 1
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'pgcrypto' and n.nspname <> 'extensions'
  ) then
    alter extension pgcrypto set schema extensions;
  end if;
end;
$$;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create type public.application_status as enum ('pending', 'approved', 'rejected', 'withdrawn');
create type public.membership_status as enum ('approved_unpaid', 'active', 'suspended', 'expired', 'cancelled');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'waived');
create type public.claim_type as enum ('meetup', 'collaboration');
create type public.claim_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type public.referral_status as enum ('captured', 'pending', 'qualified', 'rewarded', 'invalid');
create type public.point_transaction_type as enum ('welcome', 'referral', 'collaboration', 'event', 'meetup', 'redemption', 'refund', 'admin_adjustment');
create type public.reward_status as enum ('requested', 'approved', 'scheduled', 'fulfilled', 'rejected', 'cancelled');
create type public.event_status as enum ('draft', 'published', 'completed', 'cancelled');
create type public.admin_role_type as enum ('admin', 'super_admin');
create type public.entitlement_status as enum ('pending', 'scheduled', 'fulfilled', 'cancelled');

create table public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  billing_type text not null default 'annual',
  price numeric(12, 2),
  currency text not null default 'AED' check (char_length(currency) = 3),
  active boolean not null default true,
  benefits_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index membership_plans_name_idx on public.membership_plans(lower(name));

create table public.member_applications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  business_name text not null,
  category text,
  message text,
  referral_code_used text,
  status public.application_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  check (char_length(email) between 3 and 320),
  check (char_length(full_name) between 2 and 160),
  check (char_length(business_name) between 2 and 200),
  check (message is null or char_length(message) <= 3000)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  business_name text,
  title text,
  category text,
  services text[] not null default '{}'::text[],
  bio text,
  city text,
  website text,
  instagram text,
  phone text,
  profile_photo_path text,
  directory_visible boolean not null default true,
  referral_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(full_name) between 2 and 160),
  check (cardinality(services) <= 12),
  check (bio is null or char_length(bio) <= 3000)
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.membership_plans(id) on delete restrict,
  status public.membership_status not null default 'approved_unpaid',
  start_date date,
  end_date date,
  payment_status public.payment_status not null default 'pending',
  payment_reference text,
  activated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create unique index memberships_one_active_per_user_idx
  on public.memberships(user_id) where status = 'active';
create index memberships_user_id_idx on public.memberships(user_id);

create table public.point_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete restrict,
  claim_type public.claim_type not null,
  activity_date date not null,
  related_member_id uuid references auth.users(id) on delete set null,
  description text not null,
  evidence_path text not null,
  status public.claim_status not null default 'pending',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  check (char_length(description) between 10 and 2000),
  check ((status = 'rejected' and rejection_reason is not null) or status <> 'rejected')
);
create index point_claims_user_id_idx on public.point_claims(user_id);
create index point_claims_status_idx on public.point_claims(status);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referral_code text not null,
  referred_email text,
  referred_user_id uuid references auth.users(id) on delete set null,
  application_id uuid references public.member_applications(id) on delete set null,
  status public.referral_status not null default 'captured',
  qualified_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz not null default now(),
  check (referred_user_id is null or referred_user_id <> referrer_user_id)
);
create index referrals_referrer_user_id_idx on public.referrals(referrer_user_id);
create unique index referrals_referred_user_once_idx on public.referrals(referred_user_id) where referred_user_id is not null;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date timestamptz not null,
  venue text,
  status public.event_status not null default 'draft',
  points_enabled boolean not null default true,
  attendance_points integer not null default 5 check (attendance_points between 0 and 100),
  checkin_token_hash text,
  checkin_open_at timestamptz,
  checkin_closes_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (checkin_closes_at is null or checkin_open_at is null or checkin_closes_at >= checkin_open_at)
);

create table public.event_attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  method text not null check (method in ('admin', 'qr', 'import')),
  approved_by uuid references auth.users(id) on delete set null,
  unique (event_id, user_id)
);
create index event_attendance_user_id_idx on public.event_attendance(user_id);

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  points_cost integer not null default 100 check (points_cost > 0),
  reward_type text not null check (reward_type in ('event_discount', 'instagram_reel')),
  active boolean not null default true,
  fulfillment_instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index rewards_type_idx on public.rewards(reward_type);

create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete restrict,
  reward_id uuid not null references public.rewards(id) on delete restrict,
  points_cost integer not null check (points_cost > 0),
  request_key text not null unique,
  status public.reward_status not null default 'requested',
  requested_at timestamptz not null default now(),
  fulfilled_at timestamptz,
  admin_notes text
);
create index reward_redemptions_user_id_idx on public.reward_redemptions(user_id);
create index reward_redemptions_status_idx on public.reward_redemptions(status);

create table public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  membership_id uuid not null references public.memberships(id) on delete restrict,
  points integer not null check (points <> 0),
  transaction_type public.point_transaction_type not null,
  source_id uuid,
  description text not null,
  idempotency_key text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (char_length(description) between 2 and 500)
);
create unique index point_transactions_idempotency_key_idx on public.point_transactions(idempotency_key) where idempotency_key is not null;
create index point_transactions_user_membership_idx on public.point_transactions(user_id, membership_id);
create index point_transactions_membership_id_idx on public.point_transactions(membership_id);

create table public.promotional_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('instagram_story_week')),
  source_id uuid not null,
  status public.entitlement_status not null default 'pending',
  starts_at timestamptz,
  ends_at timestamptz,
  fulfilled_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique (type, source_id)
);
create index promotional_entitlements_user_id_idx on public.promotional_entitlements(user_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);

create table public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.admin_role_type not null,
  active boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_created_at_idx on public.audit_log(created_at desc);
create index audit_log_target_idx on public.audit_log(target_type, target_id);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_roles ar
    where ar.user_id = (select auth.uid()) and ar.active
  );
$$;

create or replace function private.has_active_membership(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id is not null and exists (
    select 1 from public.memberships m
    where m.user_id = p_user_id
      and m.status = 'active'
      and (m.start_date is null or m.start_date <= current_date)
      and (m.end_date is null or m.end_date >= current_date)
  );
$$;

revoke execute on function private.is_admin() from public, anon;
revoke execute on function private.has_active_membership(uuid) from public, anon;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.has_active_membership(uuid) to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger membership_plans_set_updated_at before update on public.membership_plans for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger memberships_set_updated_at before update on public.memberships for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events for each row execute function public.set_updated_at();
create trigger rewards_set_updated_at before update on public.rewards for each row execute function public.set_updated_at();

create view public.member_point_balances
with (security_invoker = true)
as
select m.user_id, m.id as membership_id, coalesce(sum(pt.points), 0)::integer as balance
from public.memberships m
left join public.point_transactions pt on pt.membership_id = m.id and pt.user_id = m.user_id
where m.status = 'active'
group by m.user_id, m.id;

create view public.member_directory
with (security_barrier = true)
as
select p.id, p.full_name, p.business_name, p.title, p.category, p.services, p.bio, p.city, p.website, p.instagram, p.profile_photo_path
from public.profiles p
where p.directory_visible
  and private.has_active_membership(p.id)
  and private.has_active_membership(auth.uid());

alter table public.membership_plans enable row level security;
alter table public.member_applications enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.point_claims enable row level security;
alter table public.referrals enable row level security;
alter table public.events enable row level security;
alter table public.event_attendance enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.point_transactions enable row level security;
alter table public.promotional_entitlements enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_roles enable row level security;
alter table public.audit_log enable row level security;

revoke all on public.membership_plans, public.member_applications, public.profiles, public.memberships,
  public.point_claims, public.referrals, public.events, public.event_attendance, public.rewards,
  public.reward_redemptions, public.point_transactions, public.promotional_entitlements,
  public.notifications, public.admin_roles, public.audit_log, public.member_point_balances,
  public.member_directory from public, anon, authenticated;
grant insert on public.member_applications to anon, authenticated;
grant select on public.member_applications to authenticated;
grant select on public.membership_plans, public.profiles, public.memberships, public.point_claims, public.referrals, public.events, public.event_attendance, public.rewards, public.reward_redemptions, public.point_transactions, public.promotional_entitlements, public.notifications, public.admin_roles, public.audit_log to authenticated;
grant insert on public.point_claims to authenticated;
grant update (full_name, business_name, title, category, services, bio, city, website, instagram, phone, profile_photo_path, directory_visible, updated_at) on public.profiles to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant select on public.member_point_balances, public.member_directory to authenticated;

create policy member_applications_public_insert on public.member_applications
for insert to anon, authenticated
with check (
  status = 'pending' and reviewed_by is null and reviewed_at is null and review_notes is null
);
create policy member_applications_admin_select on public.member_applications for select to authenticated using ((select private.is_admin()));

create policy membership_plans_member_select on public.membership_plans for select to authenticated using (active or (select private.is_admin()));
create policy profiles_own_select on public.profiles for select to authenticated using ((select auth.uid()) = id or (select private.is_admin()));
create policy profiles_own_update on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy memberships_own_select on public.memberships for select to authenticated using ((select auth.uid()) = user_id or (select private.is_admin()));
create policy point_transactions_own_select on public.point_transactions for select to authenticated using ((select auth.uid()) = user_id or (select private.is_admin()));

create policy point_claims_own_select on public.point_claims for select to authenticated using ((select auth.uid()) = user_id or (select private.is_admin()));
create policy point_claims_own_insert on public.point_claims for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
  and rejection_reason is null
  and evidence_path like ((select auth.uid())::text || '/%')
  and exists (
    select 1 from public.memberships m
    where m.id = membership_id and m.user_id = (select auth.uid()) and m.status = 'active'
  )
);

create policy referrals_own_select on public.referrals for select to authenticated using ((select auth.uid()) = referrer_user_id or (select private.is_admin()));
create policy events_active_member_select on public.events for select to authenticated using ((status = 'published' and (select private.has_active_membership(auth.uid()))) or (select private.is_admin()));
create policy event_attendance_own_select on public.event_attendance for select to authenticated using ((select auth.uid()) = user_id or (select private.is_admin()));
create policy rewards_active_member_select on public.rewards for select to authenticated using ((active and (select private.has_active_membership(auth.uid()))) or (select private.is_admin()));
create policy reward_redemptions_own_select on public.reward_redemptions for select to authenticated using ((select auth.uid()) = user_id or (select private.is_admin()));
create policy promotional_entitlements_own_select on public.promotional_entitlements for select to authenticated using ((select auth.uid()) = user_id or (select private.is_admin()));
create policy notifications_own_select on public.notifications for select to authenticated using ((select auth.uid()) = user_id);
create policy notifications_own_update on public.notifications for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy admin_roles_own_select on public.admin_roles for select to authenticated using ((select auth.uid()) = user_id or (select private.is_admin()));
create policy audit_log_admin_select on public.audit_log for select to authenticated using ((select private.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('claim-evidence', 'claim-evidence', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('profile-photos', 'profile-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy claim_evidence_owner_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'claim-evidence'
  and owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (select private.has_active_membership(auth.uid()))
);
create policy claim_evidence_owner_or_admin_select on storage.objects for select to authenticated
using (bucket_id = 'claim-evidence' and (owner_id = (select auth.uid()::text) or (select private.is_admin())));

create policy profile_photos_owner_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-photos'
  and owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
create policy profile_photos_member_select on storage.objects for select to authenticated
using (
  bucket_id = 'profile-photos'
  and (
    owner_id = (select auth.uid()::text)
    or (select private.is_admin())
    or (
      (select private.has_active_membership(auth.uid()))
      and exists (
        select 1 from public.profiles p
        where p.id::text = owner_id and p.directory_visible and private.has_active_membership(p.id)
      )
    )
  )
);
create policy profile_photos_owner_update on storage.objects for update to authenticated
using (bucket_id = 'profile-photos' and owner_id = (select auth.uid()::text))
with check (bucket_id = 'profile-photos' and owner_id = (select auth.uid()::text));
create policy profile_photos_owner_delete on storage.objects for delete to authenticated
using (bucket_id = 'profile-photos' and owner_id = (select auth.uid()::text));

comment on view public.member_directory is 'Deliberately security-definer: exposes only directory-approved columns and only when both viewer and listed member have active memberships.';
comment on table public.point_transactions is 'Immutable source of truth for point balances. No member INSERT/UPDATE/DELETE grants.';
