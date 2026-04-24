-- Update tier_limit() with Professional quota changes (crm_contacts: 1000)
CREATE OR REPLACE FUNCTION public.tier_limit(_tier text, _resource text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT CASE _resource
    WHEN 'chatbots' THEN
      CASE _tier WHEN 'free' THEN 1 WHEN 'starter' THEN 3 WHEN 'professional' THEN 10 ELSE NULL END
    WHEN 'qr_codes' THEN
      CASE _tier WHEN 'free' THEN 5 WHEN 'starter' THEN 25 WHEN 'professional' THEN 100 ELSE NULL END
    WHEN 'social_accounts' THEN
      CASE _tier WHEN 'free' THEN 1 WHEN 'starter' THEN 2 WHEN 'professional' THEN 10 ELSE NULL END
    WHEN 'accessibility_sites' THEN
      CASE _tier WHEN 'free' THEN 1 WHEN 'starter' THEN 3 WHEN 'professional' THEN 10 ELSE NULL END
    WHEN 'seo_audits_monthly' THEN
      CASE _tier WHEN 'free' THEN 2 WHEN 'starter' THEN 20 WHEN 'professional' THEN 100 ELSE NULL END
    WHEN 'crm_contacts' THEN
      CASE _tier WHEN 'free' THEN 0 WHEN 'starter' THEN 100 WHEN 'professional' THEN 1000 ELSE NULL END
  END
$function$;

-- Backfill existing non-beta professional orgs with the new bundle
UPDATE public.organizations
SET purchased_products = '["qr_codes","seo_audits","accessibility","tasks","chatbots","social_media","crm","analytics"]'::jsonb
WHERE subscription_tier = 'professional'
  AND COALESCE(is_beta_org, false) = false;