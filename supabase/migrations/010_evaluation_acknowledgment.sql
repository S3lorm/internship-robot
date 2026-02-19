-- Add acknowledgment fields to evaluations table
ALTER TABLE public.evaluations
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS viewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS feedback_acknowledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS feedback_acknowledged_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS requires_acknowledgment BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS acknowledgment_deadline TIMESTAMPTZ;

-- Add acknowledgment fields to logbooks table (for feedback acknowledgment)
ALTER TABLE public.logbooks
  ADD COLUMN IF NOT EXISTS feedback_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS feedback_viewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS feedback_acknowledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS feedback_acknowledged_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS requires_feedback_acknowledgment BOOLEAN DEFAULT false;

-- Add acknowledgment fields to reports table (for feedback acknowledgment)
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS feedback_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS feedback_viewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS feedback_acknowledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS feedback_acknowledged_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS requires_feedback_acknowledgment BOOLEAN DEFAULT false;

-- Create indexes for acknowledgment tracking
CREATE INDEX IF NOT EXISTS idx_evaluations_viewed ON public.evaluations(viewed_at) WHERE viewed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_evaluations_acknowledged ON public.evaluations(feedback_acknowledged_at) WHERE feedback_acknowledged_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_evaluations_acknowledgment_deadline ON public.evaluations(acknowledgment_deadline) WHERE acknowledgment_deadline IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_logbooks_feedback_acknowledged ON public.logbooks(feedback_acknowledged_at) WHERE feedback_acknowledged_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_feedback_acknowledged ON public.reports(feedback_acknowledged_at) WHERE feedback_acknowledged_at IS NOT NULL;

-- Function to mark evaluation as viewed
CREATE OR REPLACE FUNCTION mark_evaluation_viewed()
RETURNS TRIGGER
LANGUAGE plpgsql
AS '
BEGIN
  -- This will be called from the application layer
  -- We''ll handle it in the backend code
  RETURN NEW;
END;
';

-- Function to check for unacknowledged evaluations (for reminders)
CREATE OR REPLACE FUNCTION get_unacknowledged_evaluations()
RETURNS TABLE (
  evaluation_id UUID,
  student_id UUID,
  title TEXT,
  deadline TIMESTAMPTZ,
  days_overdue INTEGER
)
LANGUAGE plpgsql
AS '
BEGIN
  RETURN QUERY
  SELECT 
    e.id AS evaluation_id,
    e.student_id,
    e.title,
    e.acknowledgment_deadline AS deadline,
    EXTRACT(DAY FROM (NOW() - e.acknowledgment_deadline))::INTEGER AS days_overdue
  FROM public.evaluations e
  WHERE e.requires_acknowledgment = true
    AND e.feedback_acknowledged_at IS NULL
    AND (e.acknowledgment_deadline IS NULL OR e.acknowledgment_deadline < NOW())
    AND e.is_available = true;
END;
';

-- Function to check for unacknowledged feedback (logbooks and reports)
CREATE OR REPLACE FUNCTION get_unacknowledged_feedback()
RETURNS TABLE (
  item_id UUID,
  item_type TEXT,
  student_id UUID,
  title TEXT,
  feedback_provided_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS '
BEGIN
  RETURN QUERY
  -- Unacknowledged logbook feedback
  SELECT 
    l.id AS item_id,
    ''logbook''::TEXT AS item_type,
    l.student_id,
    l.title,
    l.reviewed_at AS feedback_provided_at
  FROM public.logbooks l
  WHERE l.requires_feedback_acknowledgment = true
    AND l.feedback_acknowledged_at IS NULL
    AND l.feedback IS NOT NULL
    AND l.reviewed_at IS NOT NULL
  
  UNION ALL
  
  -- Unacknowledged report feedback
  SELECT 
    r.id AS item_id,
    ''report''::TEXT AS item_type,
    r.student_id,
    r.title,
    r.reviewed_at AS feedback_provided_at
  FROM public.reports r
  WHERE r.requires_feedback_acknowledgment = true
    AND r.feedback_acknowledged_at IS NULL
    AND r.feedback IS NOT NULL
    AND r.reviewed_at IS NOT NULL;
END;
';

