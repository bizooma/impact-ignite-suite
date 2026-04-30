
-- Sync purchased_products with subscription_tier across all orgs and keep them in sync going forward.

-- 1. Function that returns the merged product bundle for a tier + manual grants
CREATE OR REPLACE FUNCTION public.merge_tier_products(_tier text, _existing jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  bundle text[];
  managed text[] := ARRAY[
    'qr_codes','seo_audits','accessibility','tasks',
    'chatbots','social_media','crm','analytics',
    'campaigns','google_business','mobile_app'
  ];
  manual_grants text[];
  existing_arr text[];
  result text[];
BEGIN
  -- Pick bundle for tier
  bundle := CASE lower(coalesce(_tier, 'free'))
    WHEN 'starter' THEN ARRAY['qr_codes','seo_audits','accessibility','tasks','chatbots','social_media','crm']
    WHEN 'professional' THEN ARRAY['qr_codes','seo_audits','accessibility','tasks','chatbots','social_media','crm','analytics']
    WHEN 'enterprise' THEN ARRAY['qr_codes','seo_audits','accessibility','tasks','chatbots','social_media','crm','analytics','campaigns','google_business','mobile_app']
    ELSE ARRAY['qr_codes','seo_audits','accessibility','tasks']
  END;

  -- Convert existing jsonb array to text[]; preserve any non-managed entries (manual grants)
  IF _existing IS NULL OR jsonb_typeof(_existing) <> 'array' THEN
    existing_arr := ARRAY[]::text[];
  ELSE
    SELECT array_agg(value::text) INTO existing_arr
    FROM jsonb_array_elements_text(_existing) AS value;
  END IF;

  IF existing_arr IS NULL THEN existing_arr := ARRAY[]::text[]; END IF;

  -- Manual grants = existing entries that aren't in the managed set
  SELECT coalesce(array_agg(e), ARRAY[]::text[]) INTO manual_grants
  FROM unnest(existing_arr) e
  WHERE e <> ALL(managed);

  -- Combine and dedupe
  SELECT array_agg(DISTINCT p ORDER BY p) INTO result
  FROM unnest(bundle || manual_grants) p;

  RETURN to_jsonb(result);
END;
$$;

-- 2. Trigger function to keep purchased_products synced
CREATE OR REPLACE FUNCTION public.sync_org_products()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.purchased_products := public.merge_tier_products(NEW.subscription_tier, NEW.purchased_products);
  RETURN NEW;
END;
$$;

-- 3. Drop trigger if exists, recreate on INSERT and on UPDATE OF subscription_tier
DROP TRIGGER IF EXISTS sync_org_products_trigger ON public.organizations;

CREATE TRIGGER sync_org_products_trigger
BEFORE INSERT OR UPDATE OF subscription_tier
ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.sync_org_products();

-- 4. Backfill all existing orgs
UPDATE public.organizations
SET purchased_products = public.merge_tier_products(subscription_tier, purchased_products);
