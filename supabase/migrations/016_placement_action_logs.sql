-- Audit trail for official placement (Stage 2) decisions: who acted, when, and outcome.

CREATE TABLE IF NOT EXISTS public.placement_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id uuid NOT NULL REFERENCES public.internship_placements(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  actor_role text NOT NULL CHECK (actor_role IN ('admin', 'hod')),
  action text NOT NULL,
  previous_status text,
  new_status text NOT NULL,
  notes text,
  organization_email_sent boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_placement_action_logs_placement_id
  ON public.placement_action_logs(placement_id);

CREATE INDEX IF NOT EXISTS idx_placement_action_logs_created_at
  ON public.placement_action_logs(created_at DESC);

ALTER TABLE public.placement_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to placement_action_logs" ON public.placement_action_logs
  FOR ALL USING (true) WITH CHECK (true);
