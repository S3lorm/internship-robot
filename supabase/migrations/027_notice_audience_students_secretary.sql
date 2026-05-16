-- Allow combined students + secretary audience on notices

ALTER TABLE public.notices
  DROP CONSTRAINT IF EXISTS notices_target_audience_check;

ALTER TABLE public.notices
  ADD CONSTRAINT notices_target_audience_check
  CHECK (target_audience IN ('all', 'students', 'admins', 'hod', 'secutuary', 'students_and_secretary'));
