-- ============================================================
-- Migration: Internship Management Workflow
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add evaluation tracking columns to internship_placements
ALTER TABLE internship_placements
  ADD COLUMN IF NOT EXISTS evaluation_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS evaluation_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS evaluation_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS midpoint_date DATE,
  ADD COLUMN IF NOT EXISTS supervisor_email TEXT;

-- 2. Add expiry to evaluation_tokens
ALTER TABLE evaluation_tokens
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 3. Add supervisor evaluation fields to evaluations
ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS placement_id UUID REFERENCES internship_placements(id),
  ADD COLUMN IF NOT EXISTS supervisor_name TEXT,
  ADD COLUMN IF NOT EXISTS supervisor_position TEXT,
  ADD COLUMN IF NOT EXISTS supervisor_department TEXT,
  ADD COLUMN IF NOT EXISTS work_ethic_rating INT,
  ADD COLUMN IF NOT EXISTS communication_rating INT,
  ADD COLUMN IF NOT EXISTS technical_skills_rating INT,
  ADD COLUMN IF NOT EXISTS teamwork_rating INT,
  ADD COLUMN IF NOT EXISTS punctuality_rating INT,
  ADD COLUMN IF NOT EXISTS problem_solving_rating INT,
  ADD COLUMN IF NOT EXISTS supervisor_comments TEXT,
  ADD COLUMN IF NOT EXISTS final_recommendation TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_by_token UUID REFERENCES evaluation_tokens(id);

-- Done!
SELECT 'Migration completed successfully!' AS status;
