-- Helper RPC for trusted server contexts (edge functions using service role) to
-- read an integration secret from Vault without an end-user JWT. The function
-- itself performs no auth checks; access is gated by GRANT (service_role only,
-- never anon/authenticated).
CREATE OR REPLACE FUNCTION public.get_integration_vault_secret_internal(_org_id uuid, _provider text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'vault'
AS $function$
DECLARE
  _vault_id uuid;
  _plain text;
BEGIN
  SELECT vault_secret_id INTO _vault_id
    FROM public.integrations
    WHERE organization_id = _org_id AND provider::text = _provider
    LIMIT 1;

  IF _vault_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO _plain
    FROM vault.decrypted_secrets
    WHERE id = _vault_id
    LIMIT 1;

  RETURN _plain;
END;
$function$;

-- Lock down: only service role may invoke this. Revoke from PUBLIC (which
-- includes anon and authenticated) and grant explicitly to service_role.
REVOKE ALL ON FUNCTION public.get_integration_vault_secret_internal(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_integration_vault_secret_internal(uuid, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_integration_vault_secret_internal(uuid, text) TO service_role;