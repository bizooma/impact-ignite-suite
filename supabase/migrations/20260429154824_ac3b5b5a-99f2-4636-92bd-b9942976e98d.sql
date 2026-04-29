-- 1. Add vault_secret_id column to integrations
ALTER TABLE public.integrations
  ADD COLUMN IF NOT EXISTS vault_secret_id uuid;

-- 2. Helper: set (insert or update) a vault-encrypted secret tied to an integration
CREATE OR REPLACE FUNCTION public.set_integration_vault_secret(
  _org_id uuid,
  _provider text,
  _secret text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _existing_vault_id uuid;
  _new_vault_id uuid;
  _secret_name text;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  IF NOT (
    public.has_org_role(_user_id, _org_id, 'owner'::public.app_role)
    OR public.has_org_role(_user_id, _org_id, 'admin'::public.app_role)
    OR public.is_platform_admin(_user_id)
  ) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  IF _secret IS NULL OR length(_secret) = 0 THEN
    RAISE EXCEPTION 'secret_required' USING ERRCODE = '22023';
  END IF;

  SELECT vault_secret_id INTO _existing_vault_id
    FROM public.integrations
    WHERE organization_id = _org_id AND provider::text = _provider
    LIMIT 1;

  _secret_name := 'integration_' || _provider || '_' || _org_id::text;

  IF _existing_vault_id IS NOT NULL THEN
    -- Update existing vault secret in place
    PERFORM vault.update_secret(_existing_vault_id, _secret, _secret_name, 'Integration secret for ' || _provider);
    RETURN _existing_vault_id;
  ELSE
    _new_vault_id := vault.create_secret(_secret, _secret_name, 'Integration secret for ' || _provider);
    RETURN _new_vault_id;
  END IF;
END;
$$;

-- 3. Helper: read back the decrypted secret (admin/owner only)
CREATE OR REPLACE FUNCTION public.get_integration_vault_secret(
  _org_id uuid,
  _provider text
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _vault_id uuid;
  _plain text;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  IF NOT (
    public.has_org_role(_user_id, _org_id, 'owner'::public.app_role)
    OR public.has_org_role(_user_id, _org_id, 'admin'::public.app_role)
    OR public.is_platform_admin(_user_id)
  ) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

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
$$;

-- 4. Helper: delete the vault secret when disconnecting the integration
CREATE OR REPLACE FUNCTION public.delete_integration_vault_secret(
  _org_id uuid,
  _provider text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _vault_id uuid;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  IF NOT (
    public.has_org_role(_user_id, _org_id, 'owner'::public.app_role)
    OR public.has_org_role(_user_id, _org_id, 'admin'::public.app_role)
    OR public.is_platform_admin(_user_id)
  ) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  SELECT vault_secret_id INTO _vault_id
    FROM public.integrations
    WHERE organization_id = _org_id AND provider::text = _provider
    LIMIT 1;

  IF _vault_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = _vault_id;
  END IF;

  RETURN true;
END;
$$;

-- 5. Restrict execution to authenticated users (RPC-callable)
REVOKE ALL ON FUNCTION public.set_integration_vault_secret(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_integration_vault_secret(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_integration_vault_secret(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_integration_vault_secret(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_integration_vault_secret(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_integration_vault_secret(uuid, text) TO authenticated;