
UPDATE public.organizations
SET purchased_products = '["qr_codes","seo_audits","accessibility","tasks"]'::jsonb
WHERE COALESCE(subscription_tier, 'free') = 'free'
  AND COALESCE(is_beta_org, false) = false;
