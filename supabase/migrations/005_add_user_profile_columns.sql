-- Add missing columns to user_profiles table
-- These columns are needed for email verification and password reset functionality

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verification_token 
  ON public.user_profiles(email_verification_token) 
  WHERE email_verification_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_password_reset_token 
  ON public.user_profiles(password_reset_token) 
  WHERE password_reset_token IS NOT NULL;

