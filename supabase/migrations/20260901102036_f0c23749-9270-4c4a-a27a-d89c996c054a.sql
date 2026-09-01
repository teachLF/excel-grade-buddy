-- 1) student email link
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS student_email text;
CREATE INDEX IF NOT EXISTS students_student_email_idx ON public.students (lower(student_email));
CREATE INDEX IF NOT EXISTS student_events_student_id_idx ON public.student_events (student_id);

-- 2) helper: caller email
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(coalesce((auth.jwt() ->> 'email'), (SELECT email FROM auth.users WHERE id = auth.uid())))
$$;

-- 3) points helper
CREATE OR REPLACE FUNCTION public.event_points(_event_type text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE _event_type
    WHEN 'star' THEN 5
    WHEN 'present' THEN 1
    WHEN 'absent' THEN 0
    WHEN 'sleeping' THEN -1
    WHEN 'talking' THEN -1
    WHEN 'escaped' THEN -2
    WHEN 'misbehaving' THEN -2
    ELSE 0
  END
$$;

-- 4) is the signed-in email registered as a student?
CREATE OR REPLACE FUNCTION public.am_i_student()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.student_email IS NOT NULL
      AND lower(s.student_email) = public.current_user_email()
  )
$$;

-- 5) private stats for the signed-in student only
CREATE OR REPLACE FUNCTION public.my_student_stats()
RETURNS TABLE (
  student_name text,
  present_count bigint,
  absent_count bigint,
  star_count bigint,
  sleeping_count bigint,
  escaped_count bigint,
  talking_count bigint,
  misbehaving_count bigint,
  total_points bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT s.id, s.name
    FROM public.students s
    WHERE s.student_email IS NOT NULL
      AND lower(s.student_email) = public.current_user_email()
  )
  SELECT
    (SELECT string_agg(DISTINCT name, ' / ') FROM me),
    count(*) FILTER (WHERE e.event_type = 'present'),
    count(*) FILTER (WHERE e.event_type = 'absent'),
    count(*) FILTER (WHERE e.event_type = 'star'),
    count(*) FILTER (WHERE e.event_type = 'sleeping'),
    count(*) FILTER (WHERE e.event_type = 'escaped'),
    count(*) FILTER (WHERE e.event_type = 'talking'),
    count(*) FILTER (WHERE e.event_type = 'misbehaving'),
    coalesce(sum(public.event_points(e.event_type)), 0)
  FROM public.student_events e
  WHERE e.student_id IN (SELECT id FROM me)
$$;

-- 6) leaderboard: masked name + points only
CREATE OR REPLACE FUNCTION public.leaderboard()
RETURNS TABLE (rank bigint, display_name text, total_points bigint, is_me boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH scored AS (
    SELECT
      s.id,
      split_part(btrim(s.name), ' ', 1) ||
        CASE WHEN split_part(btrim(s.name), ' ', 2) <> ''
          THEN ' ' || left(split_part(btrim(s.name), ' ', 2), 1) || '.'
          ELSE '' END AS display_name,
      coalesce(sum(public.event_points(e.event_type)), 0) AS pts,
      bool_or(s.student_email IS NOT NULL AND lower(s.student_email) = public.current_user_email()) AS mine
    FROM public.students s
    LEFT JOIN public.student_events e ON e.student_id = s.id
    GROUP BY s.id, s.name
  )
  SELECT row_number() OVER (ORDER BY pts DESC, display_name ASC),
         display_name, pts, mine
  FROM scored
  ORDER BY pts DESC, display_name ASC
$$;

REVOKE ALL ON FUNCTION public.my_student_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.leaderboard() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.am_i_student() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_user_email() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_student_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.am_i_student() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.event_points(text) TO authenticated, service_role;