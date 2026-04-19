
-- Quota check helper functions (SECURITY DEFINER so triggers can read tier reliably)

CREATE OR REPLACE FUNCTION public.get_org_tier(_org_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(subscription_tier, 'free') FROM public.organizations WHERE id = _org_id
$$;

-- Limit lookup: returns NULL for unlimited (enterprise)
CREATE OR REPLACE FUNCTION public.tier_limit(_tier text, _resource text)
RETURNS integer
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE _resource
    WHEN 'chatbots' THEN
      CASE _tier WHEN 'free' THEN 1 WHEN 'starter' THEN 3 WHEN 'professional' THEN 10 ELSE NULL END
    WHEN 'qr_codes' THEN
      CASE _tier WHEN 'free' THEN 5 WHEN 'starter' THEN 25 WHEN 'professional' THEN 100 ELSE NULL END
    WHEN 'social_accounts' THEN
      CASE _tier WHEN 'free' THEN 1 WHEN 'starter' THEN 3 WHEN 'professional' THEN 10 ELSE NULL END
  END
$$;

-- Trigger: enforce chatbot quota
CREATE OR REPLACE FUNCTION public.enforce_chatbot_quota()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _tier text;
  _cap integer;
  _count integer;
BEGIN
  _tier := get_org_tier(NEW.organization_id);
  _cap := tier_limit(_tier, 'chatbots');
  IF _cap IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO _count FROM public.chatbots WHERE organization_id = NEW.organization_id;
  IF _count >= _cap THEN
    RAISE EXCEPTION 'quota_exceeded: Your % plan allows up to % chatbot(s). Upgrade to add more.', _tier, _cap
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chatbots_quota_check ON public.chatbots;
CREATE TRIGGER chatbots_quota_check
  BEFORE INSERT ON public.chatbots
  FOR EACH ROW EXECUTE FUNCTION public.enforce_chatbot_quota();

-- Trigger: enforce QR code quota
CREATE OR REPLACE FUNCTION public.enforce_qr_quota()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _tier text;
  _cap integer;
  _count integer;
BEGIN
  _tier := get_org_tier(NEW.organization_id);
  _cap := tier_limit(_tier, 'qr_codes');
  IF _cap IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO _count FROM public.qr_codes WHERE organization_id = NEW.organization_id;
  IF _count >= _cap THEN
    RAISE EXCEPTION 'quota_exceeded: Your % plan allows up to % QR code(s). Upgrade to add more.', _tier, _cap
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS qr_codes_quota_check ON public.qr_codes;
CREATE TRIGGER qr_codes_quota_check
  BEFORE INSERT ON public.qr_codes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_qr_quota();

-- Trigger: enforce social integration quota (only counts social providers)
CREATE OR REPLACE FUNCTION public.enforce_integration_quota()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _tier text;
  _cap integer;
  _count integer;
  _social_providers text[] := ARRAY['facebook','instagram','linkedin','twitter','x'];
BEGIN
  -- Only enforce for social providers
  IF NOT (NEW.provider::text = ANY(_social_providers)) THEN
    RETURN NEW;
  END IF;

  _tier := get_org_tier(NEW.organization_id);
  _cap := tier_limit(_tier, 'social_accounts');
  IF _cap IS NULL THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO _count
  FROM public.integrations
  WHERE organization_id = NEW.organization_id
    AND provider::text = ANY(_social_providers);

  IF _count >= _cap THEN
    RAISE EXCEPTION 'quota_exceeded: Your % plan allows up to % social account(s). Upgrade to add more.', _tier, _cap
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS integrations_quota_check ON public.integrations;
CREATE TRIGGER integrations_quota_check
  BEFORE INSERT ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_integration_quota();
