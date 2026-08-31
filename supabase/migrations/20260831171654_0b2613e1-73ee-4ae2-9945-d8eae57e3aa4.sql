revoke all on function public.has_role(uuid, public.app_role) from public;
revoke all on function public.is_approved(uuid) from public;
revoke all on function public.ensure_my_profile() from public;

grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_approved(uuid) to authenticated;
grant execute on function public.ensure_my_profile() to authenticated;