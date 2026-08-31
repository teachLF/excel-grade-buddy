grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_approved(uuid) to authenticated;

create or replace function public.sync_profiles_for_admin()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  synced_count integer;
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin') then
    raise exception 'admin access required';
  end if;

  insert into public.profiles (id, email, approved)
  select
    users.id,
    users.email,
    lower(coalesce(users.email, '')) = lower('s3904844@mkhb.moe.gov.sa')
  from auth.users as users
  on conflict (id) do update
    set email = coalesce(excluded.email, public.profiles.email),
        approved = public.profiles.approved or excluded.approved;

  get diagnostics synced_count = row_count;

  insert into public.user_roles (user_id, role)
  select users.id, 'user'::public.app_role
  from auth.users as users
  on conflict (user_id, role) do nothing;

  insert into public.user_roles (user_id, role)
  select users.id, 'admin'::public.app_role
  from auth.users as users
  where lower(coalesce(users.email, '')) = lower('s3904844@mkhb.moe.gov.sa')
  on conflict (user_id, role) do nothing;

  return synced_count;
end;
$$;

revoke all on function public.sync_profiles_for_admin() from public;
grant execute on function public.sync_profiles_for_admin() to authenticated;

insert into public.profiles (id, email, approved)
select
  users.id,
  users.email,
  lower(coalesce(users.email, '')) = lower('s3904844@mkhb.moe.gov.sa')
from auth.users as users
on conflict (id) do update
  set email = coalesce(excluded.email, public.profiles.email),
      approved = public.profiles.approved or excluded.approved;

insert into public.user_roles (user_id, role)
select users.id, 'user'::public.app_role
from auth.users as users
on conflict (user_id, role) do nothing;

insert into public.user_roles (user_id, role)
select users.id, 'admin'::public.app_role
from auth.users as users
where lower(coalesce(users.email, '')) = lower('s3904844@mkhb.moe.gov.sa')
on conflict (user_id, role) do nothing;