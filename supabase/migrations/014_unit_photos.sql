-- Migration 014: Add photos column to units + create property_media storage bucket

-- Add photos array to units table
ALTER TABLE units ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';

-- Create public storage bucket for unit photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('property_media', 'property_media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow landlords to upload to property_media
CREATE POLICY IF NOT EXISTS "landlords_upload_unit_media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property_media');

-- Allow landlords to delete their unit media
CREATE POLICY IF NOT EXISTS "landlords_delete_unit_media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property_media');

-- Allow public read access
CREATE POLICY IF NOT EXISTS "public_read_unit_media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property_media');
