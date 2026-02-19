-- Create letter_requests table
CREATE TABLE IF NOT EXISTS public.letter_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_email TEXT,
  company_phone TEXT,
  company_address TEXT,
  internship_duration TEXT NOT NULL,
  internship_start_date DATE,
  internship_end_date DATE,
  purpose TEXT NOT NULL,
  category TEXT,
  additional_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_letter_requests_student_id ON public.letter_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_letter_requests_status ON public.letter_requests(status);
CREATE INDEX IF NOT EXISTS idx_letter_requests_created_at ON public.letter_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.letter_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can view their own requests
CREATE POLICY "Students can view their own letter requests"
  ON public.letter_requests
  FOR SELECT
  USING (auth.uid() = student_id);

-- Students can create their own requests
CREATE POLICY "Students can create their own letter requests"
  ON public.letter_requests
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all letter requests"
  ON public.letter_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all requests
CREATE POLICY "Admins can update all letter requests"
  ON public.letter_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger to update updated_at
-- Using single quotes with escaping as alternative to dollar quoting
CREATE OR REPLACE FUNCTION update_letter_requests_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS '
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
';

CREATE TRIGGER update_letter_requests_updated_at
  BEFORE UPDATE ON public.letter_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_letter_requests_updated_at();

