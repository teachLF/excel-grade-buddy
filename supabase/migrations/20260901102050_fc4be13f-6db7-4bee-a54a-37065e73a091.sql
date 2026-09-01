ALTER FUNCTION public.event_points(text) SET search_path = public;

REVOKE ALL ON FUNCTION public.ensure_my_profile() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_approved(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_user_email() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.am_i_student() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_student_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.leaderboard() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.ensure_my_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.am_i_student() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_student_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.leaderboard() TO authenticated;