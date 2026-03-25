-- Add supervisor evaluation fields to evaluations table
ALTER TABLE public.evaluations
  ADD COLUMN IF NOT EXISTS placement_id UUID,
  ADD COLUMN IF NOT EXISTS supervisor_name TEXT,
  ADD COLUMN IF NOT EXISTS supervisor_position TEXT,
  ADD COLUMN IF NOT EXISTS supervisor_department TEXT,
  ADD COLUMN IF NOT EXISTS work_ethic_rating INTEGER CHECK (work_ethic_rating >= 1 AND work_ethic_rating <= 5),
  ADD COLUMN IF NOT EXISTS communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  ADD COLUMN IF NOT EXISTS technical_skills_rating INTEGER CHECK (technical_skills_rating >= 1 AND technical_skills_rating <= 5),
  ADD COLUMN IF NOT EXISTS teamwork_rating INTEGER CHECK (teamwork_rating >= 1 AND teamwork_rating <= 5),
  ADD COLUMN IF NOT EXISTS punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  ADD COLUMN IF NOT EXISTS problem_solving_rating INTEGER CHECK (problem_solving_rating >= 1 AND problem_solving_rating <= 5),
  ADD COLUMN IF NOT EXISTS supervisor_comments TEXT,
  ADD COLUMN IF NOT EXISTS final_recommendation TEXT CHECK (final_recommendation IN ('Excellent', 'Good', 'Average', 'Needs Improvement')),
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_by_token UUID;

-- Optional: Create index on placement_id
CREATE INDEX IF NOT EXISTS idx_evaluations_placement_id ON public.evaluations(placement_id);
