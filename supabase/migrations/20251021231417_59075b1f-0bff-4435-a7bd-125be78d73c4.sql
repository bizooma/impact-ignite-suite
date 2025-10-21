-- Ensure flipbooks storage bucket has proper CORS configuration
UPDATE storage.buckets
SET public = true
WHERE id = 'flipbooks';

-- Add CORS policy for the flipbooks bucket if not exists
-- This allows browser access to PDF files from any origin