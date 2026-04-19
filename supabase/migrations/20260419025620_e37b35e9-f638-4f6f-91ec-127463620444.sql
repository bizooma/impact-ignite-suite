CREATE OR REPLACE FUNCTION public.generate_mobile_api_key(_org_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_key text;
BEGIN
  -- Allow org admins/owners OR platform admins
  IF NOT (
    has_org_role(auth.uid(), _org_id, 'admin'::app_role)
    OR has_org_role(auth.uid(), _org_id, 'owner'::app_role)
    OR is_platform_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  new_key := 'mob_live_' || encode(gen_random_bytes(24), 'hex');

  UPDATE public.organizations
     SET mobile_api_key = new_key,
         mobile_api_enabled = true,
         updated_at = now()
   WHERE id = _org_id;

  RETURN new_key;
END;
$function$;