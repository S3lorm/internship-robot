-- Weekly Log Sheet Book module
-- Separate from supervisor evaluation/grading.

ALTER TABLE public.internship_placements
  ADD COLUMN IF NOT EXISTS supervisor_email TEXT;

CREATE TABLE IF NOT EXISTS public.weekly_logbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  placement_id UUID NOT NULL REFERENCES public.internship_placements(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ongoing' CHECK (
    status IN ('draft', 'ongoing', 'submitted_final', 'supervisor_reviewed', 'hod_approved', 'rejected')
  ),
  finalized_at TIMESTAMPTZ,
  supervisor_reviewed_at TIMESTAMPTZ,
  hod_reviewed_at TIMESTAMPTZ,
  hod_reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  hod_decision_note TEXT,
  archive_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, placement_id)
);

CREATE TABLE IF NOT EXISTS public.weekly_log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logbook_id UUID NOT NULL REFERENCES public.weekly_logbooks(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number > 0),
  week_beginning DATE NOT NULL,
  week_ending DATE NOT NULL,
  activities JSONB NOT NULL DEFAULT '[]'::jsonb,
  student_remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(logbook_id, week_number)
);

CREATE TABLE IF NOT EXISTS public.weekly_log_supervisor_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logbook_id UUID NOT NULL REFERENCES public.weekly_logbooks(id) ON DELETE CASCADE,
  placement_id UUID NOT NULL REFERENCES public.internship_placements(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.weekly_log_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logbook_id UUID NOT NULL UNIQUE REFERENCES public.weekly_logbooks(id) ON DELETE CASCADE,
  supervisor_full_name TEXT NOT NULL,
  supervisor_remark TEXT NOT NULL,
  supervisor_recommendation TEXT,
  supervisor_ip TEXT,
  hod_decision TEXT CHECK (hod_decision IN ('approved', 'rejected')),
  hod_remark TEXT,
  hod_reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.weekly_log_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logbook_id UUID REFERENCES public.weekly_logbooks(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_logbooks_student ON public.weekly_logbooks(student_id);
CREATE INDEX IF NOT EXISTS idx_weekly_logbooks_placement ON public.weekly_logbooks(placement_id);
CREATE INDEX IF NOT EXISTS idx_weekly_logbooks_status ON public.weekly_logbooks(status);
CREATE INDEX IF NOT EXISTS idx_weekly_log_entries_logbook ON public.weekly_log_entries(logbook_id);
CREATE INDEX IF NOT EXISTS idx_weekly_log_tokens_lookup ON public.weekly_log_supervisor_tokens(token_hash, used_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_weekly_log_audit_logbook ON public.weekly_log_audit_logs(logbook_id);

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
    'evaluation',
    'deadline_reminder',
    'logbook_deadline',
    'weekly_logbook',
    'report_deadline',
    'admin_action_required'
  ));

ALTER TABLE public.weekly_logbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_log_supervisor_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_log_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_log_audit_logs ENABLE ROW LEVEL SECURITY;

-- The Express backend uses the Supabase service role and performs ownership/role checks server-side.
