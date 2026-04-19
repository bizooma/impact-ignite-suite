UPDATE public.organizations
SET purchased_products = '["chatbots","qr_codes","social_media","seo_audits","analytics","crm","tasks","google_business","campaigns","mobile_app"]'::jsonb
WHERE is_beta_org = true;