
-- Add lukebenton07@gmail.com to Bizooma organization as viewer
INSERT INTO memberships (user_id, organization_id, role)
VALUES (
  '508186ae-f2a4-4c52-89ac-0f6e67309959',
  'e16eaa0d-a6c3-4ee1-ae47-e4ef53a850d0',
  'viewer'
)
ON CONFLICT (user_id, organization_id) DO NOTHING;
