-- SheEO Membership Portal - carry application details onto the applicant's profile.
-- The apply form stores business name and category on member_applications only,
-- so admin member lists showed "—" for them. Profiles now pick up any blank
-- business_name/category from the applicant's application: when the application
-- is submitted, when it is approved, and once for everyone who already applied.
-- Values a member has already set on their own profile are never overwritten.

create or replace function private.fill_profile_from_application(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles p
  set business_name = coalesce(nullif(trim(p.business_name), ''), a.business_name),
      category = coalesce(nullif(trim(p.category), ''), a.category),
      updated_at = now()
  from public.member_applications a
  join auth.users u on lower(u.email) = lower(a.email)
  where a.id = p_application_id
    and p.id = u.id
    and ((nullif(trim(p.business_name), '') is null and a.business_name is not null)
      or (nullif(trim(p.category), '') is null and a.category is not null));
end;
$$;

revoke execute on function private.fill_profile_from_application(uuid) from public, anon, authenticated;

create or replace function private.handle_new_member_application()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.fill_profile_from_application(new.id);
  return new;
end;
$$;

revoke execute on function private.handle_new_member_application() from public, anon, authenticated;

drop trigger if exists on_member_application_fill_profile on public.member_applications;
create trigger on_member_application_fill_profile
after insert or update of status on public.member_applications
for each row execute function private.handle_new_member_application();

-- Backfill: newest application wins when someone applied more than once.
do $$
declare
  v_application_id uuid;
begin
  for v_application_id in
    select id from public.member_applications order by created_at desc
  loop
    perform private.fill_profile_from_application(v_application_id);
  end loop;
end;
$$;
