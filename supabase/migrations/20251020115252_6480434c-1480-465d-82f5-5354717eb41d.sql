-- Create public storage bucket for widget hosting
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'widget-hosting',
  'widget-hosting',
  true,
  10485760, -- 10MB limit
  ARRAY['application/javascript', 'text/javascript', 'text/css']
);

-- Create storage policy to allow public read access
CREATE POLICY "Public widget files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'widget-hosting');

-- Create storage policy to allow authenticated admins to upload
CREATE POLICY "Platform admins can upload widget files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'widget-hosting' 
  AND auth.uid() IS NOT NULL
  AND is_platform_admin(auth.uid())
);