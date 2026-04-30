import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { isQuotaError } from '@/hooks/useTierLimits';
import type { Integration } from '@/types/database';

export const useIntegrations = (organizationId: string) => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch integrations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Provider-specific list of fields inside `encrypted_tokens` that are sensitive
  // and must be stored in Supabase Vault rather than the JSONB column.
  const SECRET_FIELDS: Record<string, string[]> = {
    google_business: ['client_secret', 'access_token', 'refresh_token'],
  };

  // Splits a tokens object into a non-sensitive metadata copy (kept in
  // `encrypted_tokens`) and the secret payload that should be stored in the Vault.
  const splitSecrets = (provider: string, tokens: any) => {
    const fields = SECRET_FIELDS[provider];
    if (!fields || !tokens || typeof tokens !== 'object') {
      return { meta: tokens, secrets: null as Record<string, unknown> | null };
    }
    const meta: Record<string, unknown> = { ...tokens };
    const secrets: Record<string, unknown> = {};
    let hasSecret = false;
    for (const key of fields) {
      if (meta[key] !== undefined && meta[key] !== null && meta[key] !== '') {
        secrets[key] = meta[key];
        hasSecret = true;
      }
      delete meta[key];
    }
    return { meta, secrets: hasSecret ? secrets : null };
  };

  const persistSecretsToVault = async (
    orgId: string,
    provider: string,
    secrets: Record<string, unknown> | null
  ) => {
    if (!secrets) return;
    const { error } = await supabase.rpc('set_integration_vault_secret', {
      _org_id: orgId,
      _provider: provider,
      _secret: JSON.stringify(secrets),
    });
    if (error) throw error;
  };

  const createIntegration = async (integration: any) => {
    try {
      const { meta, secrets } = splitSecrets(integration.provider, integration.encrypted_tokens);
      const { data, error } = await supabase
        .from('integrations')
        .insert([{ ...integration, encrypted_tokens: meta }])
        .select()
        .single();

      if (error) throw error;

      // Push secrets to Vault after the integration row exists so the RPC
      // can locate it by (organization_id, provider).
      await persistSecretsToVault(integration.organization_id, integration.provider, secrets);

      setIntegrations(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Integration created successfully',
      });
      return data;
    } catch (error: any) {
      console.error('Error creating integration:', error);
      const quotaMsg = isQuotaError(error);
      toast({
        title: quotaMsg ? 'Plan limit reached' : 'Error',
        description: quotaMsg ?? 'Failed to create integration',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateIntegration = async (id: string, updates: any) => {
    try {
      let payload = updates;
      let pendingSecrets: { provider: string; orgId: string; secrets: Record<string, unknown> | null } | null = null;

      if (updates?.encrypted_tokens && typeof updates.encrypted_tokens === 'object') {
        const existing = integrations.find(i => i.id === id);
        const provider = updates.provider || existing?.provider;
        const orgId = updates.organization_id || existing?.organization_id || organizationId;
        if (provider && SECRET_FIELDS[provider]) {
          const { meta, secrets } = splitSecrets(provider, updates.encrypted_tokens);
          payload = { ...updates, encrypted_tokens: meta };
          pendingSecrets = { provider, orgId, secrets };
        }
      }

      const { data, error } = await supabase
        .from('integrations')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (pendingSecrets) {
        await persistSecretsToVault(pendingSecrets.orgId, pendingSecrets.provider, pendingSecrets.secrets);
      }

      setIntegrations(prev => prev.map(i => i.id === id ? data : i));
      toast({
        title: 'Success',
        description: 'Integration updated successfully',
      });
      return data;
    } catch (error) {
      console.error('Error updating integration:', error);
      toast({
        title: 'Error',
        description: 'Failed to update integration',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteIntegration = async (id: string) => {
    try {
      const existing = integrations.find(i => i.id === id);

      // Best-effort cleanup of any vault-stored secrets for this provider/org.
      // For Facebook the vault holds a per-page-id map shared across all
      // Page integrations of the org, so we strip just this Page and only
      // delete the whole secret when no other rows remain.
      if (existing?.provider === 'facebook') {
        const pageId = (existing.config as any)?.page_id as string | undefined;
        const otherFbRows = integrations.filter(
          i => i.id !== id && i.provider === 'facebook'
        );
        if (otherFbRows.length === 0) {
          await supabase.rpc('delete_integration_vault_secret', {
            _org_id: existing.organization_id,
            _provider: 'facebook',
          });
        } else if (pageId) {
          const { data: vaultJson } = await supabase.rpc(
            'get_integration_vault_secret',
            { _org_id: existing.organization_id, _provider: 'facebook' }
          );
          let map: Record<string, unknown> = {};
          try { map = vaultJson ? JSON.parse(vaultJson as string) : {}; } catch {}
          if (map[pageId]) {
            delete map[pageId];
            await supabase.rpc('set_integration_vault_secret', {
              _org_id: existing.organization_id,
              _provider: 'facebook',
              _secret: JSON.stringify(map),
            });
          }
        }
      } else if (existing?.provider && SECRET_FIELDS[existing.provider]) {
        await supabase.rpc('delete_integration_vault_secret', {
          _org_id: existing.organization_id,
          _provider: existing.provider,
        });
      }

      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setIntegrations(prev => prev.filter(i => i.id !== id));
      toast({
        title: 'Success',
        description: 'Integration deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting integration:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete integration',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const testIntegration = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('test-integration', {
        body: { integrationId: id }
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || 'Integration test failed');
      }

      toast({
        title: 'Connection successful',
        description: data.account?.name
          ? `Connected to ${data.account.name}`
          : 'Integration test completed successfully',
      });
      return data;
    } catch (error: any) {
      console.error('Error testing integration:', error);
      toast({
        title: 'Test failed',
        description: error?.message || 'Integration test failed',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchIntegrations();
    }
  }, [organizationId]);

  return {
    integrations,
    loading,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testIntegration,
    refetch: fetchIntegrations,
  };
};