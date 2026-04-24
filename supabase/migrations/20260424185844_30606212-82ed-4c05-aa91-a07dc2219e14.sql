UPDATE public.organizations
SET purchased_products = '["qr_codes","seo_audits","accessibility","tasks"]'::jsonb
WHERE subscription_tier = 'free' OR subscription_tier IS NULL;