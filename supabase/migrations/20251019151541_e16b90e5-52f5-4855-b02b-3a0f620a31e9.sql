-- Create storage bucket for social media uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'social-media-uploads', 
  'social-media-uploads', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- RLS policy for uploads (organization members can upload)
CREATE POLICY "Organization members can upload social media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'social-media-uploads' AND
  EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
    AND organization_id::text = (storage.foldername(name))[1]
  )
);

-- RLS policy for public read access
CREATE POLICY "Anyone can view social media uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'social-media-uploads');

-- RLS policy for organization members to delete their uploads
CREATE POLICY "Organization members can delete their uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'social-media-uploads' AND
  EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
    AND organization_id::text = (storage.foldername(name))[1]
  )
);