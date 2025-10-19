-- Add purchased_products column to track which products each organization has access to
ALTER TABLE public.organizations 
ADD COLUMN purchased_products JSONB DEFAULT '[]'::jsonb;

-- Update Cal Farley's organization to only have mobile_app access
UPDATE public.organizations 
SET purchased_products = '["mobile_app"]'::jsonb
WHERE mobile_app_code = 'MA1MNQR8D';

-- Add a helpful comment
COMMENT ON COLUMN public.organizations.purchased_products IS 'Array of product IDs that this organization has purchased. Available products: mobile_app, chatbots, qr_codes, social_media, seo_audits, google_business, content_templates, tasks, analytics';
