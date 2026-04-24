-- 1. Update tier_limit() to add crm_contacts cap and adjust starter social_accounts to 2
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
      CASE _tier WHEN 'free' THEN 0 WHEN 'starter' THEN 100 WHEN 'professional' THEN 5000 ELSE NULL END
  END
$function$;

-- 2. Add CRM contact quota enforcement trigger
CREATE OR REPLACE FUNCTION public.enforce_crm_contact_quota()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _tier text;
  _cap integer;
  _count integer;
  _is_beta boolean;
BEGIN
  SELECT COALESCE(is_beta_org, false) INTO _is_beta FROM public.organizations WHERE id = NEW.organization_id;
  IF _is_beta THEN RETURN NEW; END IF;
  _tier := get_org_tier(NEW.organization_id);
  _cap := tier_limit(_tier, 'crm_contacts');
  IF _cap IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO _count FROM public.crm_contacts WHERE organization_id = NEW.organization_id;
  IF _count >= _cap THEN
    RAISE EXCEPTION 'quota_exceeded: Your % plan allows up to % CRM contact(s). Upgrade for more.', _tier, _cap
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_crm_contact_quota_trigger ON public.crm_contacts;
CREATE TRIGGER enforce_crm_contact_quota_trigger
  BEFORE INSERT ON public.crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_crm_contact_quota();

-- 3. Backfill existing non-beta starter orgs to include crm in purchased_products
UPDATE public.organizations
SET purchased_products = (
  SELECT jsonb_agg(DISTINCT p)
  FROM jsonb_array_elements_text(
    COALESCE(purchased_products, '[]'::jsonb)
    || '["chatbots","qr_codes","social_media","seo_audits","accessibility","tasks","crm"]'::jsonb
  ) AS t(p)
)
WHERE subscription_tier = 'starter'
  AND COALESCE(is_beta_org, false) = false;