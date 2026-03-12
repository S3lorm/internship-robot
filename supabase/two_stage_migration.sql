-- ============================================
-- Two-Stage Internship Letter Request System
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Migrate existing letter_requests request_type values
UPDATE letter_requests SET request_type = 'general' WHERE request_type = 'admin' OR request_type IS NULL;
UPDATE letter_requests SET request_type = 'official' WHERE request_type = 'company';

-- 2. Add contact_info column for general requests
ALTER TABLE letter_requests ADD COLUMN IF NOT EXISTS contact_info text;

-- 3. Create internship_placements table
CREATE TABLE IF NOT EXISTS internship_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id),
  general_request_id uuid NOT NULL REFERENCES letter_requests(id),
  organization_name text NOT NULL,
  organization_address text,
  organization_email text NOT NULL,
  supervisor_name text NOT NULL,
  supervisor_position text,
  supervisor_contact text,
  internship_start_date date,
  internship_end_date date,
  department_role text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','modification_requested')),
  admin_notes text,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  official_letter_url text,
  official_letter_generated_at timestamptz,
  reference_number text,
  verification_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Create evaluation_tokens table
CREATE TABLE IF NOT EXISTS evaluation_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id uuid NOT NULL REFERENCES internship_placements(id),
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  used_at timestamptz,
  used_status text DEFAULT 'unused' CHECK (used_status IN ('unused','used','expired'))
);

-- 5. Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id uuid NOT NULL REFERENCES internship_placements(id),
  student_id uuid NOT NULL REFERENCES users(id),
  recipient_email text NOT NULL,
  subject text,
  sent_date timestamptz DEFAULT now(),
  delivery_status text DEFAULT 'sent' CHECK (delivery_status IN ('sent','delivered','failed','bounced')),
  token_id uuid REFERENCES evaluation_tokens(id),
  attachments jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- 6. Enable RLS (Row Level Security) on new tables
ALTER TABLE internship_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for internship_placements
CREATE POLICY "Allow all access to internship_placements" ON internship_placements
  FOR ALL USING (true) WITH CHECK (true);

-- 8. Create RLS policies for evaluation_tokens
CREATE POLICY "Allow all access to evaluation_tokens" ON evaluation_tokens
  FOR ALL USING (true) WITH CHECK (true);

-- 9. Create RLS policies for email_logs
CREATE POLICY "Allow all access to email_logs" ON email_logs
  FOR ALL USING (true) WITH CHECK (true);
