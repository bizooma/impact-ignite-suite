-- Add brand_color column to organizations table for custom theming
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS brand_color TEXT;

-- Set Cal Farley's Boys Ranch brand color to their signature gold
UPDATE organizations 
SET brand_color = '#F4B540' 
WHERE id = '5ce8a087-4d0f-4db7-b012-13afc2db770d';

COMMENT ON COLUMN organizations.brand_color IS 'Organization brand color in hex format for dashboard theming';