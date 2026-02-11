# Supabase Backend Setup Guide

This project uses Supabase as the backend instead of the Express.js server. Follow these steps to set up your Supabase backend.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js and npm/pnpm installed

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in your project details:
   - **Name**: Your project name
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose the closest region to your users
4. Wait for the project to be created (takes ~2 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")
   - **service_role key** (under "Project API keys" - keep this secret!)

## Step 3: Set Up Environment Variables

1. Create a `.env.local` file in the root of your project (if it doesn't exist)
2. Add the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important**: 
- Never commit `.env.local` to version control
- The `SUPABASE_SERVICE_ROLE_KEY` should only be used server-side
- The `NEXT_PUBLIC_*` variables are safe to expose in the browser

## Step 4: Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Run the migrations in order:
   - Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
   - Click "Run" to execute
   - Repeat for `supabase/migrations/002_rls_policies.sql`
   - Repeat for `supabase/migrations/003_functions.sql`

Alternatively, if you have the Supabase CLI installed:

```bash
supabase db push
```

## Step 5: Set Up Storage Buckets

1. In your Supabase dashboard, go to **Storage**
2. Create the following buckets:

### Avatar Bucket
- **Name**: `avatars`
- **Public**: Yes (so avatars can be accessed via URL)
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

### CV Bucket
- **Name**: `cvs`
- **Public**: No (CVs should be private)
- **File size limit**: 10 MB
- **Allowed MIME types**: `application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### Storage Policies

After creating the buckets, set up Row Level Security policies:

#### For `avatars` bucket:
```sql
-- Users can upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

#### For `cvs` bucket:
```sql
-- Users can upload their own CVs
CREATE POLICY "Users can upload own CV"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cvs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own CVs
CREATE POLICY "Users can view own CV"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'cvs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all CVs
CREATE POLICY "Admins can view all CVs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'cvs' AND
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

## Step 6: Configure Email Authentication

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider
3. **Important**: Set the **Site URL** and **Redirect URLs**:
   - Go to **Authentication** → **URL Configuration**
   - **Site URL**: `http://localhost:3000` (for development) or your production URL
   - **Redirect URLs**: Add these URLs:
     - `http://localhost:3000/auth/callback` (for development)
     - `http://localhost:3000/**` (for development - allows any path)
     - Your production callback URL: `https://yourdomain.com/auth/callback`
4. Configure email templates (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize the confirmation email template if needed

## Step 7: Create Your First Admin User

After setting up the database, you can create an admin user:

1. Sign up a new user through your app's registration page
2. In Supabase dashboard, go to **Authentication** → **Users**
3. Find the user you just created
4. In the SQL Editor, run:

```sql
UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

## Step 8: Install Dependencies

```bash
npm install
# or
pnpm install
```

## Step 9: Test Your Setup

1. Start your development server:
```bash
npm run dev
# or
pnpm dev
```

2. Try registering a new user
3. Check your Supabase dashboard to verify:
   - User appears in **Authentication** → **Users**
   - Profile appears in **Table Editor** → **user_profiles**

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure your `.env.local` file exists and has the correct variables
- Restart your development server after adding environment variables

### "Row Level Security policy violation"
- Check that you've run all migration files
- Verify RLS policies are enabled on your tables
- Check that the user is authenticated (check Supabase auth session)

### "Storage bucket not found"
- Make sure you've created the storage buckets in Supabase dashboard
- Verify bucket names match exactly: `avatars` and `cvs`

### Email verification not working
- Check your Supabase project's email settings
- For development, you can disable email confirmation in **Authentication** → **Providers** → **Email** → **Confirm email** (toggle off)

## Next Steps

- Set up custom email templates
- Configure additional authentication providers (Google, GitHub, etc.)
- Set up database backups
- Configure rate limiting if needed
- Set up monitoring and alerts

## Migration from Express Backend

If you're migrating from the Express backend:

1. The old `backend/` folder can be kept for reference but is no longer needed
2. Update any direct API calls to use the new Supabase API functions
3. The API interface remains the same, so most frontend code should work without changes
4. Remove the old Express server dependencies if you're not using them

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

