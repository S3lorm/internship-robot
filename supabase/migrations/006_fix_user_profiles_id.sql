-- Fix user_profiles table to not require auth.users reference
-- Since we're using Express backend with JWT (not Supabase Auth),
-- we need to allow the backend to generate its own UUIDs

-- Drop the foreign key constraint to auth.users
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- Change the id column to generate UUIDs automatically
-- Remove the REFERENCES constraint and add default UUID generation
ALTER TABLE public.user_profiles
ALTER COLUMN id DROP DEFAULT,
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Note: We keep the PRIMARY KEY constraint, just remove the foreign key to auth.users
-- The backend will generate UUIDs using the uuid package, or we can use the database default

