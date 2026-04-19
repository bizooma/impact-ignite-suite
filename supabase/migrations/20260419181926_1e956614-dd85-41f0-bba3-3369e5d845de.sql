UPDATE public.organizations
SET purchased_products = '["chatbots","qr_codes"]'::jsonb
WHERE is_beta_org = true
  AND (purchased_products IS NULL OR jsonb_array_length(COALESCE(purchased_products,'[]'::jsonb)) = 0);