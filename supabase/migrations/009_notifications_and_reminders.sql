-- Extend notifications table to support new notification types
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS link TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS action_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Update notification type constraint to include new types
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'application_status', 
    'new_internship', 
    'notice', 
    'system',
    'letter_request',
    'evaluation_available',
    'deadline_reminder',
    'logbook_deadline',
    'report_deadline',
    'admin_action_required'
  ));

-- Create evaluations table
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  internship_id UUID REFERENCES public.internships(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('mid_term', 'final', 'supervisor', 'self')),
  is_available BOOLEAN DEFAULT false,
  available_from TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  submission_url TEXT,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create logbooks table
CREATE TABLE IF NOT EXISTS public.logbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  internship_id UUID REFERENCES public.internships(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  submission_deadline TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  submission_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'reviewed', 'overdue')),
  feedback TEXT,
  reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  internship_id UUID REFERENCES public.internships(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'final', 'reflection')),
  submission_deadline TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  submission_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'reviewed', 'overdue')),
  feedback TEXT,
  reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create administrative_actions table
CREATE TABLE IF NOT EXISTS public.administrative_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'profile_completion',
    'document_upload',
    'verification',
    'registration',
    'payment',
    'approval_request',
    'other'
  )),
  title TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  action_url TEXT,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_evaluations_student_id ON public.evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_available ON public.evaluations(is_available, available_from);
CREATE INDEX IF NOT EXISTS idx_evaluations_deadline ON public.evaluations(deadline) WHERE deadline IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_logbooks_student_id ON public.logbooks(student_id);
CREATE INDEX IF NOT EXISTS idx_logbooks_deadline ON public.logbooks(submission_deadline);
CREATE INDEX IF NOT EXISTS idx_logbooks_status ON public.logbooks(status);

CREATE INDEX IF NOT EXISTS idx_reports_student_id ON public.reports(student_id);
CREATE INDEX IF NOT EXISTS idx_reports_deadline ON public.reports(submission_deadline);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

CREATE INDEX IF NOT EXISTS idx_admin_actions_student_id ON public.administrative_actions(student_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_completed ON public.administrative_actions(is_completed);
CREATE INDEX IF NOT EXISTS idx_admin_actions_due_date ON public.administrative_actions(due_date) WHERE due_date IS NOT NULL;

-- Enable RLS
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrative_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for evaluations
CREATE POLICY "Students can view their own evaluations"
  ON public.evaluations FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all evaluations"
  ON public.evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage evaluations"
  ON public.evaluations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for logbooks
CREATE POLICY "Students can view their own logbooks"
  ON public.logbooks FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can update their own logbooks"
  ON public.logbooks FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all logbooks"
  ON public.logbooks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage logbooks"
  ON public.logbooks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for reports
CREATE POLICY "Students can view their own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can update their own reports"
  ON public.reports FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all reports"
  ON public.reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage reports"
  ON public.reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for administrative_actions
CREATE POLICY "Students can view their own administrative actions"
  ON public.administrative_actions FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can update their own administrative actions"
  ON public.administrative_actions FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all administrative actions"
  ON public.administrative_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage administrative actions"
  ON public.administrative_actions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_evaluations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS '
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
';

CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_evaluations_updated_at();

CREATE OR REPLACE FUNCTION update_logbooks_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS '
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
';

CREATE TRIGGER update_logbooks_updated_at
  BEFORE UPDATE ON public.logbooks
  FOR EACH ROW
  EXECUTE FUNCTION update_logbooks_updated_at();

CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS '
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
';

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION update_reports_updated_at();

CREATE OR REPLACE FUNCTION update_admin_actions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS '
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
';

CREATE TRIGGER update_admin_actions_updated_at
  BEFORE UPDATE ON public.administrative_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_actions_updated_at();

-- Function to check and update overdue status
CREATE OR REPLACE FUNCTION update_overdue_status()
RETURNS void
LANGUAGE plpgsql
AS '
BEGIN
  -- Update overdue logbooks
  UPDATE public.logbooks
  SET status = ''overdue''
  WHERE status = ''pending''
    AND submission_deadline < NOW()
    AND submitted_at IS NULL;
  
  -- Update overdue reports
  UPDATE public.reports
  SET status = ''overdue''
  WHERE status = ''pending''
    AND submission_deadline < NOW()
    AND submitted_at IS NULL;
END;
';

