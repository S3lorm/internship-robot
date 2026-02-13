# Database Setup - Run Migrations

The error `Could not find the table 'public.user_profiles'` means you need to create the database tables in Supabase.

## Quick Setup Steps

### 1. Open Supabase SQL Editor

1. Go to your Supabase project: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New query**

### 2. Run the Migration Files

Run these SQL files **in order**:

#### Step 1: Create Tables
1. Open `supabase/migrations/001_initial_schema.sql`
2. Copy **ALL** the contents
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. You should see: "Success. No rows returned"

#### Step 2: Set Up Security (RLS)
1. Open `supabase/migrations/002_rls_policies.sql`
2. Copy **ALL** the contents
3. Paste into Supabase SQL Editor
4. Click **Run**
5. You should see: "Success. No rows returned"

#### Step 3: Create Functions
1. Open `supabase/migrations/003_functions.sql`
2. Copy **ALL** the contents
3. Paste into Supabase SQL Editor
4. Click **Run**
5. You should see: "Success. No rows returned"

### 3. Verify Tables Were Created

In Supabase SQL Editor, run:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- `user_profiles`
- `internships`
- `applications`
- `notices`
- `notifications`

### 4. Restart Your Backend

After running the migrations:

```bash
# Stop the server (Ctrl+C)
npm run dev
```

You should now see:
```
✅ Supabase connection established
```

## Troubleshooting

### "relation already exists"
- Some tables might already exist
- This is usually fine - the migration will skip existing tables
- Continue with the next migration file

### "permission denied"
- Make sure you're using the SQL Editor (not the Table Editor)
- You need to be the project owner or have admin access

### "syntax error"
- Make sure you copied the entire file
- Check for any missing semicolons
- Try running the SQL in smaller chunks

### Still seeing "table not found"
1. Check the table exists:
   ```sql
   SELECT * FROM user_profiles LIMIT 1;
   ```
2. If it errors, the table wasn't created - re-run migration 001
3. Make sure you're in the correct Supabase project

## What Each Migration Does

- **001_initial_schema.sql**: Creates all the database tables
- **002_rls_policies.sql**: Sets up Row Level Security (who can access what)
- **003_functions.sql**: Creates database functions (like auto-creating user profiles)

## Next Steps

After migrations are complete:
1. ✅ Backend should connect successfully
2. ✅ You can register users
3. ✅ You can create internships, applications, etc.

## Optional: Storage Setup

If you want file uploads (avatars, CVs), also run:
- `supabase/migrations/004_storage_policies.sql`

But this requires creating storage buckets first (see `SUPABASE_SETUP.md`).

