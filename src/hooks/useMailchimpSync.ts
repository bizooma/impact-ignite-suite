import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MailchimpMapping {
  id: string;
  organization_id: string;
  crm_list_id: string;
  mailchimp_audience_id: string;
  field_mappings: any;
  sync_enabled: boolean;
  sync_frequency: 'manual' | 'hourly' | 'daily' | 'weekly';
  last_synced_at: string | null;
  last_sync_status: 'success' | 'error' | 'pending' | null;
  last_sync_error: string | null;
  sync_options: any;
  created_at: string;
  updated_at: string;
  crm_lists?: any;
}

export interface MailchimpSyncLog {
  id: string;
  mapping_id: string;
  sync_started_at: string;
  sync_completed_at: string | null;
  contacts_processed: number;
  contacts_added: number;
  contacts_updated: number;
  contacts_failed: number;
  error_details: any;
  status: 'running' | 'success' | 'partial' | 'failed';
  created_at: string;
}

export interface MailchimpAudience {
  id: string;
  name: string;
  member_count: number;
}

export const useMailchimpSync = (organizationId: string) => {
  const [mappings, setMappings] = useState<MailchimpMapping[]>([]);
  const [audiences, setAudiences] = useState<MailchimpAudience[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMappings = async () => {
    try {
      const { data, error } = await supabase
        .from('crm_mailchimp_mappings')
        .select('*, crm_lists(*)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMappings((data as any) || []);
    } catch (error: any) {
      console.error('Error fetching mappings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load Mailchimp mappings',
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        'test-mailchimp-connection',
        {
          // The API key is fetched server-side from Vault — never sent from the client.
          body: { organizationId },
        }
      );

      if (error) throw error;

      if (data.success) {
        setAudiences(data.audiences || []);
        toast({
          title: 'Success',
          description: `Connected to ${data.account?.name || 'Mailchimp'}`,
        });
        return { success: true, audiences: data.audiences };
      } else {
        throw new Error(data.error || 'Connection test failed');
      }
    } catch (error: any) {
      console.error('Connection test error:', error);
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: error.message,
      });
      return { success: false, error: error.message };
    }
  };

  const createMapping = async (mapping: Partial<MailchimpMapping>) => {
    try {
      const { data, error } = await supabase
        .from('crm_mailchimp_mappings')
        .insert({
          crm_list_id: mapping.crm_list_id!,
          mailchimp_audience_id: mapping.mailchimp_audience_id!,
          organization_id: organizationId,
          sync_enabled: mapping.sync_enabled || false,
          sync_frequency: mapping.sync_frequency || 'manual',
          field_mappings: mapping.field_mappings,
          sync_options: mapping.sync_options,
        })
        .select('*, crm_lists(*)')
        .single();

      if (error) throw error;

      // Refetch to ensure consistency
      await fetchMappings();
      toast({
        title: 'Success',
        description: 'Mailchimp mapping created',
      });
      return data;
    } catch (error: any) {
      console.error('Error creating mapping:', error);
      const isDuplicate = error.code === '23505' || error.message?.includes('duplicate');
      toast({
        variant: 'destructive',
        title: isDuplicate ? 'Mapping Already Exists' : 'Error',
        description: isDuplicate
          ? 'A mapping for this CRM list and Mailchimp audience already exists. Refresh the page to see it.'
          : error.message,
      });
      // Refetch so user sees the existing mapping
      if (isDuplicate) await fetchMappings();
      throw error;
    }
  };

  const updateMapping = async (id: string, updates: Partial<MailchimpMapping>) => {
    try {
      const cleanUpdates: any = {};
      // Use `!== undefined` everywhere so callers can intentionally clear a field
      // (e.g. set sync_options to null or sync_frequency to '') without it being dropped.
      if (updates.sync_enabled !== undefined) cleanUpdates.sync_enabled = updates.sync_enabled;
      if (updates.sync_frequency !== undefined) cleanUpdates.sync_frequency = updates.sync_frequency;
      if (updates.field_mappings !== undefined) cleanUpdates.field_mappings = updates.field_mappings;
      if (updates.sync_options !== undefined) cleanUpdates.sync_options = updates.sync_options;
      if (updates.mailchimp_audience_id !== undefined) cleanUpdates.mailchimp_audience_id = updates.mailchimp_audience_id;

      const { data, error } = await supabase
        .from('crm_mailchimp_mappings')
        .update(cleanUpdates)
        .eq('id', id)
        .select('*, crm_lists(*)')
        .single();

      if (error) throw error;

      setMappings(mappings.map(m => m.id === id ? (data as any) : m));
      toast({
        title: 'Success',
        description: 'Mapping updated',
      });
      return data;
    } catch (error: any) {
      console.error('Error updating mapping:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      throw error;
    }
  };

  const deleteMapping = async (id: string) => {
    try {
      const { error } = await supabase
        .from('crm_mailchimp_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMappings(mappings.filter(m => m.id !== id));
      toast({
        title: 'Success',
        description: 'Mapping deleted',
      });
    } catch (error: any) {
      console.error('Error deleting mapping:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      throw error;
    }
  };

  const syncNow = async (mappingId: string) => {
    setSyncing(mappingId);
    try {
      const { data, error } = await supabase.functions.invoke(
        'sync-crm-to-mailchimp',
        {
          body: { mapping_id: mappingId },
        }
      );

      if (error) throw error;

      toast({
        title: 'Sync Complete',
        description: `Processed ${data.contacts_processed} contacts`,
      });

      // Refresh mappings to get updated sync status
      await fetchMappings();
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: error.message,
      });
    } finally {
      setSyncing(null);
    }
  };

  const getSyncLogs = async (mappingId: string) => {
    try {
      const { data, error } = await supabase
        .from('crm_mailchimp_sync_logs')
        .select('*')
        .eq('mapping_id', mappingId)
        .order('sync_started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching sync logs:', error);
      return [];
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchMappings();
    }
  }, [organizationId]);

  return {
    mappings,
    audiences,
    loading,
    syncing,
    testConnection,
    createMapping,
    updateMapping,
    deleteMapping,
    syncNow,
    getSyncLogs,
    refetch: fetchMappings,
  };
};
