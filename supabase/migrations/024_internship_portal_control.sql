-- Admin-controlled open/close gate for student internship letter & placement requests
-- Run in Supabase SQL Editor, then reload API schema if needed (see end of file).

CREATE TABLE IF NOT EXISTS public.internship_portal_control (
  id BIGINT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

INSERT INTO public.internship_portal_control (id, status)
VALUES (1, 'open')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.internship_portal_control IS 'Single-row control: when closed, students cannot submit letter/placement requests.';

-- Allow API access (service role + PostgREST)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internship_portal_control TO service_role;
GRANT SELECT ON public.internship_portal_control TO authenticated;
GRANT SELECT ON public.internship_portal_control TO anon;

ALTER TABLE public.internship_portal_control ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_control_read_authenticated" ON public.internship_portal_control;
CREATE POLICY "portal_control_read_authenticated"
  ON public.internship_portal_control FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "portal_control_service_role_all" ON public.internship_portal_control;
CREATE POLICY "portal_control_service_role_all"
  ON public.internship_portal_control FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Refresh PostgREST schema cache (fixes PGRST205 after creating the table)
NOTIFY pgrst, 'reload schema';
