-- Optional 6-digit OTP for email verification (alongside link token)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS email_verification_code TEXT;

COMMENT ON COLUMN public.user_profiles.email_verification_code IS
  'Six-digit verification code sent by email; cleared after successful verify.';
