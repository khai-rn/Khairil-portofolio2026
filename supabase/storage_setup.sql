-- ==============================================================================
-- SUPABASE STORAGE BUCKETS SETUP FOR JOURNAL SYSTEM
-- Run this in the Supabase SQL Editor if creating buckets via SQL
-- ==============================================================================

-- 1. Create public-blog-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'public-blog-images',
    'public-blog-images',
    true,
    10485760, -- 10MB limit
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Create private-blog-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'private-blog-images',
    'private-blog-images',
    false,
    10485760, -- 10MB limit
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 3. Storage Policies:
-- Allow anyone to read from public-blog-images
CREATE POLICY "Public blog images are readable by all"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-blog-images');

-- Allow authenticated users to upload to public-blog-images
CREATE POLICY "Authenticated users can upload public images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public-blog-images');

-- Allow authenticated users to update/delete their public images
CREATE POLICY "Authenticated users can manage public images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'public-blog-images');

-- Allow authenticated users to upload and manage private images
CREATE POLICY "Authenticated users can manage private images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'private-blog-images' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'private-blog-images' AND auth.uid()::text = (storage.foldername(name))[1]);

