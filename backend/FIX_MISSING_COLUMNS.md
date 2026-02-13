# Fix Missing Columns Error

The error `Could not find the 'email_verification_expires' column` means your database is missing some columns that the backend code expects.

## Quick Fix

### Run This Migration in Supabase SQL Editor

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click **SQL Editor** → **New query**
3. Copy and paste this SQL:

```sql
-- Add missing columns to user_profiles table
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
```

4. Click **Run**
5. You should see: "Success. No rows returned"

### Or Use the Migration File

You can also use the migration file:
- Open `supabase/migrations/005_add_user_profile_columns.sql`
- Copy all contents
- Paste into Supabase SQL Editor and run

### Verify Columns Were Added

Run this query to check:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY column_name;
```

You should see:
- `password`
- `is_email_verified`
- `email_verification_token`
- `email_verification_expires`
- `password_reset_token`
- `password_reset_expires`

### Restart Backend

After adding the columns:

```bash
# Stop the server (Ctrl+C)
npm run dev
```

The error should be gone!

## What These Columns Are For

- **password**: Stores hashed passwords for authentication
- **is_email_verified**: Tracks if user has verified their email
- **email_verification_token**: Token sent in verification email
- **email_verification_expires**: When the verification token expires
- **password_reset_token**: Token for password reset emails
- **password_reset_expires**: When the reset token expires

