create or replace function public.ensure_my_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  uemail text;
  is_owner boolean;
  result public.profiles;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select email into uemail from auth.users where id = uid;
  is_owner := lower(coalesce(uemail, '')) = lower('S3904844@mkhb.moe.gov.sa');

  insert into public.profiles (id, email, approved)
  values (uid, uemail, is_owner)
  on conflict (id) do update
    set email = coalesce(excluded.email, public.profiles.email),
        approved = public.profiles.approved or is_owner
  returning * into result;

  insert into public.user_roles (user_id, role)
  values (uid, 'user')
  on conflict (user_id, role) do nothing;

  if is_owner then
    insert into public.user_roles (user_id, role)
    values (uid, 'admin')
    on conflict (user_id, role) do nothing;
  end if;

  return result;
end;
$$;

revoke all on function public.ensure_my_profile() from public;
grant execute on function public.ensure_my_profile() to authenticated;

drop policy if exists "admins delete profiles" on public.profiles;
create policy "admins delete profiles" on public.profiles
for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));
