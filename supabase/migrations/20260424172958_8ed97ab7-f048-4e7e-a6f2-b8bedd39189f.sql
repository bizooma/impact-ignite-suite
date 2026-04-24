
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
      CASE _tier WHEN 'free' THEN 1 WHEN 'starter' THEN 3 WHEN 'professional' THEN 10 ELSE NULL END
    WHEN 'accessibility_sites' THEN
      CASE _tier WHEN 'free' THEN 1 WHEN 'starter' THEN 3 WHEN 'professional' THEN 10 ELSE NULL END
    WHEN 'seo_audits_monthly' THEN
      CASE _tier WHEN 'free' THEN 2 WHEN 'starter' THEN 20 WHEN 'professional' THEN 100 ELSE NULL END
  END
$function$;

CREATE OR REPLACE FUNCTION public.enforce_accessibility_site_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tier text;
  _cap integer;
  _count integer;
  _is_beta boolean;
BEGIN
  SELECT COALESCE(is_beta_org, false) INTO _is_beta FROM public.organizations WHERE id = NEW.organization_id;
  IF _is_beta THEN RETURN NEW; END IF;
  _tier := get_org_tier(NEW.organization_id);
  _cap := tier_limit(_tier, 'accessibility_sites');
  IF _cap IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO _count FROM public.accessibility_sites WHERE organization_id = NEW.organization_id;
  IF _count >= _cap THEN
    RAISE EXCEPTION 'quota_exceeded: Your % plan allows up to % accessibility site(s). Upgrade to add more.', _tier, _cap
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_accessibility_site_quota_trg ON public.accessibility_sites;
CREATE TRIGGER enforce_accessibility_site_quota_trg
  BEFORE INSERT ON public.accessibility_sites
  FOR EACH ROW EXECUTE FUNCTION public.enforce_accessibility_site_quota();

CREATE OR REPLACE FUNCTION public.enforce_seo_audit_monthly_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tier text;
  _cap integer;
  _count integer;
  _is_beta boolean;
BEGIN
  SELECT COALESCE(is_beta_org, false) INTO _is_beta FROM public.organizations WHERE id = NEW.organization_id;
  IF _is_beta THEN RETURN NEW; END IF;
  _tier := get_org_tier(NEW.organization_id);
  _cap := tier_limit(_tier, 'seo_audits_monthly');
  IF _cap IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO _count
    FROM public.seo_audits
    WHERE organization_id = NEW.organization_id
      AND created_at >= date_trunc('month', now());
  IF _count >= _cap THEN
    RAISE EXCEPTION 'quota_exceeded: Your % plan allows up to % SEO audit(s) per month. Upgrade for more.', _tier, _cap
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_seo_audit_monthly_quota_trg ON public.seo_audits;
CREATE TRIGGER enforce_seo_audit_monthly_quota_trg
  BEFORE INSERT ON public.seo_audits
  FOR EACH ROW EXECUTE FUNCTION public.enforce_seo_audit_monthly_quota();

-- Backfill: expand free-tier orgs' purchased_products bundle (jsonb)
UPDATE public.organizations
SET purchased_products = '["chatbots","qr_codes","seo_audits","accessibility","tasks","analytics"]'::jsonb
WHERE COALESCE(subscription_tier, 'free') = 'free';
