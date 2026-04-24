UPDATE public.organizations
SET purchased_products = '["qr_codes","seo_audits","accessibility","tasks","chatbots","social_media","crm","analytics","campaigns","google_business","mobile_app"]'::jsonb
WHERE subscription_tier = 'enterprise'
  AND COALESCE(is_beta_org, false) = false;