
CREATE TABLE public.student_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_student_events_student ON public.student_events(student_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_events TO authenticated;
GRANT ALL ON public.student_events TO service_role;

ALTER TABLE public.student_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own events select" ON public.student_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own events insert" ON public.student_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own events delete" ON public.student_events FOR DELETE USING (auth.uid() = user_id);
