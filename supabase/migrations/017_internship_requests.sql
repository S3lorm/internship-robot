-- Internship placement requests submitted by students (Supabase + backend dashboard)
CREATE TABLE IF NOT EXISTS public.internship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_contact TEXT NOT NULL,
  internship_period TEXT NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_internship_requests_student_id
  ON public.internship_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_internship_requests_created_at
  ON public.internship_requests(created_at DESC);

ALTER TABLE public.internship_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own internship requests"
  ON public.internship_requests FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own internship requests"
  ON public.internship_requests FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can view all internship requests"
  ON public.internship_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update internship requests"
  ON public.internship_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
