-- Create storage bucket for mobile app avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('mobile-app-avatars', 'mobile-app-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for avatar uploads (admins only can upload)
CREATE POLICY "Org admins can upload mobile app avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'mobile-app-avatars' AND
  EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
    AND (role = 'admin' OR role = 'owner')
  )
);

CREATE POLICY "Org admins can update mobile app avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'mobile-app-avatars' AND
  EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
    AND (role = 'admin' OR role = 'owner')
  )
);

CREATE POLICY "Org admins can delete mobile app avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'mobile-app-avatars' AND
  EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
    AND (role = 'admin' OR role = 'owner')
  )
);

CREATE POLICY "Anyone can view mobile app avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'mobile-app-avatars');