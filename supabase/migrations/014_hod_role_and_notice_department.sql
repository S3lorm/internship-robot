-- Allow Head of Department role on profiles
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('student', 'admin', 'hod'));

-- Optional: notices scoped to a department (HOD or admin broadcast to one dept)
ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS target_department TEXT;

-- HOD-created notices may not map to a real user row (JWT-only HOD sessions)
ALTER TABLE public.notices ALTER COLUMN created_by DROP NOT NULL;
