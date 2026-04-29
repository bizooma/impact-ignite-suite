-- Extend tier_limit() to support 'members' resource
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
    WHEN 'members' THEN
      CASE _tier WHEN 'free' THEN 2 WHEN 'starter' THEN 5 WHEN 'professional' THEN 20 ELSE NULL END
  END
$function$;

-- Helper RPC: returns member cap and current usage for an org. NULL cap = unlimited.
-- Beta orgs get unlimited (NULL) to match existing quota-bypass pattern.
CREATE OR REPLACE FUNCTION public.get_org_member_limit(_org_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _tier text;
  _is_beta boolean;
  _cap integer;
  _members integer;
  _pending integer;
BEGIN
  IF NOT public.is_org_member(auth.uid(), _org_id) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(is_beta_org, false) INTO _is_beta FROM public.organizations WHERE id = _org_id;
  _tier := public.get_org_tier(_org_id);

  IF _is_beta THEN
    _cap := NULL;
  ELSE
    _cap := public.tier_limit(_tier, 'members');
  END IF;

  SELECT COUNT(*) INTO _members FROM public.memberships WHERE organization_id = _org_id;
  SELECT COUNT(*) INTO _pending FROM public.organization_invitations
    WHERE organization_id = _org_id AND status = 'pending';

  RETURN jsonb_build_object(
    'tier', _tier,
    'is_beta', _is_beta,
    'cap', _cap,
    'member_count', _members,
    'pending_count', _pending,
    'total_count', _members + _pending,
    'at_limit', CASE WHEN _cap IS NULL THEN false ELSE (_members + _pending) >= _cap END
  );
END;
$function$;