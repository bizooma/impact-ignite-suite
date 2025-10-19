-- Add kale@charitablechat.com to Bizooma organization as admin
INSERT INTO public.memberships (user_id, organization_id, role)
VALUES (
  'ad0e8b7a-c4b0-4781-867e-dac15dfa618d',
  'e16eaa0d-a6c3-4ee1-ae47-e4ef53a850d0',
  'admin'::app_role
)
ON CONFLICT (user_id, organization_id) DO UPDATE
SET role = 'admin'::app_role, updated_at = now();