-- Storage Bucket Setup Instructions
-- ===================================
-- IMPORTANT: Storage buckets cannot be created via SQL migrations.
-- You must create them via the Supabase Dashboard or REST API.
--
-- To create the buckets:
-- 1. Go to your Supabase Dashboard → Storage
-- 2. Click "New bucket"
-- 3. Create the following buckets:

-- Bucket 1: avatars
-- - Name: avatars
-- - Public: Yes (so avatars can be accessed via URL)
-- - File size limit: 5 MB
-- - Allowed MIME types: image/jpeg, image/png, image/webp

-- Bucket 2: cvs
-- - Name: cvs
-- - Public: No (CVs should be private)
-- - File size limit: 10 MB
-- - Allowed MIME types: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- After creating the buckets, the storage policies in migration 004_storage_policies.sql will apply.
-- Make sure to run that migration after creating the buckets.

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

