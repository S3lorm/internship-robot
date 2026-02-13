# Fix "null value in column id" Error

The error `null value in column "id" of relation "user_profiles" violates not-null constraint` happens because the database schema expects the `id` to come from Supabase's `auth.users` table, but your Express backend creates users directly.

## Quick Fix

### Run This Migration in Supabase SQL Editor

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click **SQL Editor** → **New query**
3. Copy and paste this SQL:

```sql
-- Fix user_profiles table to not require auth.users reference
-- Drop the foreign key constraint to auth.users
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- Change the id column to generate UUIDs automatically
ALTER TABLE public.user_profiles
ALTER COLUMN id DROP DEFAULT,
ALTER COLUMN id SET DEFAULT uuid_generate_v4();
```

4. Click **Run**
5. You should see: "Success. No rows returned"

### Or Use the Migration File

- Open `supabase/migrations/006_fix_user_profiles_id.sql`
- Copy all contents
- Paste into Supabase SQL Editor and run

### Restart Backend

After running the migration:

```bash
# Stop the server (Ctrl+C)
npm run dev
```

The registration should now work!

## What This Does

- **Removes the foreign key** to `auth.users` (since we're not using Supabase Auth)
- **Allows UUID generation** - the backend can now create users with its own UUIDs
- **Keeps the primary key** - the `id` column is still the primary key

## Why This Happened

The original schema was designed for Supabase Auth, where users are created in `auth.users` first, then a profile is created in `user_profiles` that references the auth user. Since you're using Express backend with JWT, you create users directly in `user_profiles` with your own UUIDs.

