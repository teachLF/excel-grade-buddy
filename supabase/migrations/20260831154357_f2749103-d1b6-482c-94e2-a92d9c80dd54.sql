drop function if exists public.handle_new_user() cascade;

revoke execute on function public.ensure_my_profile() from anon;
revoke execute on function public.has_role(uuid, public.app_role) from anon;
revoke execute on function public.is_approved(uuid) from anon;
revoke execute on function public.has_role(uuid, public.app_role) from authenticated;
revoke execute on function public.is_approved(uuid) from authenticated;
