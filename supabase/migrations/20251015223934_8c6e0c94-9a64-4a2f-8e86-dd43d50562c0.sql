-- Link Bizooma organization to the mobile app database
UPDATE mobile_app_databases 
SET organization_id = 'e16eaa0d-a6c3-4ee1-ae47-e4ef53a850d0'
WHERE organization_code = 'MA1MNQR8D';

-- Store the code on the organization
UPDATE organizations
SET mobile_app_code = 'MA1MNQR8D'
WHERE id = 'e16eaa0d-a6c3-4ee1-ae47-e4ef53a850d0';