-- One-time migration: move every Mailchimp integration's plaintext api_key
-- from `encrypted_tokens` JSON into Supabase Vault, then strip the plaintext
-- value out of the JSON column.
DO $$
DECLARE
  _row record;
  _key text;
  _vault_id uuid;
  _secret_name text;
BEGIN
  FOR _row IN
    SELECT id, organization_id, encrypted_tokens, vault_secret_id
      FROM public.integrations
      WHERE provider = 'mailchimp'
        AND (encrypted_tokens ? 'api_key')
  LOOP
    _key := _row.encrypted_tokens->>'api_key';
    IF _key IS NULL OR length(_key) = 0 THEN
      CONTINUE;
    END IF;

    _secret_name := 'integration_mailchimp_' || _row.organization_id::text;

    IF _row.vault_secret_id IS NOT NULL THEN
      -- Already has a Vault entry — update it in place.
      PERFORM vault.update_secret(
        _row.vault_secret_id,
        _key,
        _secret_name,
        'Integration secret for mailchimp'
      );
      _vault_id := _row.vault_secret_id;
    ELSE
      _vault_id := vault.create_secret(_key, _secret_name, 'Integration secret for mailchimp');
    END IF;

    UPDATE public.integrations
       SET vault_secret_id = _vault_id,
           encrypted_tokens = (encrypted_tokens - 'api_key'),
           updated_at = now()
     WHERE id = _row.id;
  END LOOP;
END
$$;