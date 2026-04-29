ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_user_profiles_must_change_password
  ON public.user_profiles (must_change_password)
  WHERE must_change_password = true;
