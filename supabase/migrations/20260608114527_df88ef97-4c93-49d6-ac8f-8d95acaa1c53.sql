CREATE TABLE public.student_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  user_id uuid not null,
  body text not null,
  kind text not null default 'general',
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_notes TO authenticated;
GRANT ALL ON public.student_notes TO service_role;

ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approved own notes select" ON public.student_notes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND public.is_approved(auth.uid()));

CREATE POLICY "approved own notes insert" ON public.student_notes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_approved(auth.uid()));

CREATE POLICY "approved own notes update" ON public.student_notes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.is_approved(auth.uid()));

CREATE POLICY "approved own notes delete" ON public.student_notes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND public.is_approved(auth.uid()));

CREATE INDEX idx_student_notes_student ON public.student_notes(student_id, created_at DESC);