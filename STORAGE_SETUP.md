# Supabase Storage Setup Guide

This guide will help you set up Supabase Storage buckets for avatar and CV uploads.

## Step 1: Create Storage Buckets

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"**

### Create `avatars` Bucket

- **Name**: `avatars`
- **Public**: ✅ Yes (so avatars can be accessed via public URLs)
- **File size limit**: 5 MB
- **Allowed MIME types**: 
  - `image/jpeg`
  - `image/png`
  - `image/webp`

Click **"Create bucket"**

### Create `cvs` Bucket

- **Name**: `cvs`
- **Public**: ❌ No (CVs should be private)
- **File size limit**: 10 MB
- **Allowed MIME types**:
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

Click **"Create bucket"**

## Step 2: Apply Storage Policies

After creating the buckets, run the storage policies migration:

```sql
-- This is in supabase/migrations/004_storage_policies.sql
```

Or apply it via the Supabase SQL Editor:

1. Go to **SQL Editor** in your Supabase Dashboard
2. Copy and paste the contents of `supabase/migrations/004_storage_policies.sql`
3. Click **"Run"**

## Step 3: Verify Setup

To verify your buckets are set up correctly:

1. Go to **Storage** → **avatars** bucket
2. Try uploading a test image
3. Check that the public URL is accessible

## Troubleshooting

### Error: "Bucket not found"
- Make sure you've created the `avatars` bucket in your Supabase Dashboard
- Verify the bucket name is exactly `avatars` (lowercase)

### Error: "Permission denied"
- Make sure you've run the storage policies migration (`004_storage_policies.sql`)
- Check that RLS is enabled on `storage.objects` table

### Error: "File size exceeds limit"
- Check the file size limit in your bucket settings
- Default is 5 MB for avatars, 10 MB for CVs

### Avatar URLs not loading
- Verify the `avatars` bucket is set to **Public**
- Check that the URL format matches: `https://[project].supabase.co/storage/v1/object/public/avatars/[filename]`

## Backend Configuration

The backend is now configured to:
- Upload avatars to Supabase Storage instead of local file system
- Automatically delete old avatars when uploading new ones
- Return public URLs for avatar access
- Clean up local temporary files after upload

No additional backend configuration is needed once the buckets are created.

