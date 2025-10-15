-- Make organization_id nullable to allow pre-seeding mobile app codes
ALTER TABLE public.mobile_app_databases 
ALTER COLUMN organization_id DROP NOT NULL;

-- Update the unique constraint to handle nullable organization_id
-- Drop the old constraint
ALTER TABLE public.mobile_app_databases 
DROP CONSTRAINT IF EXISTS mobile_app_databases_organization_id_organization_code_key;

-- The organization_code unique constraint is still in place, which is what we need for pre-seeding