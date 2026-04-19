import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
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

  const createIntegration = async (integration: any) => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .insert([integration])
        .select()
        .single();

      if (error) throw error;

      setIntegrations(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Integration created successfully',
      });
      return data;
    } catch (error) {
      console.error('Error creating integration:', error);
      toast({
        title: 'Error',
        description: 'Failed to create integration',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateIntegration = async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

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