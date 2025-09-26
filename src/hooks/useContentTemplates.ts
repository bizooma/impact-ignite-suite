import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { ContentTemplate } from '@/types/database';

export const useContentTemplates = (organizationId: string) => {
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('content_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching content templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch content templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (template: Omit<ContentTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('content_templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Content template created successfully',
      });
      return data;
    } catch (error) {
      console.error('Error creating content template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create content template',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<ContentTemplate>) => {
    try {
      const { data, error } = await supabase
        .from('content_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => prev.map(t => t.id === id ? data : t));
      toast({
        title: 'Success',
        description: 'Content template updated successfully',
      });
      return data;
    } catch (error) {
      console.error('Error updating content template:', error);
      toast({
        title: 'Error',
        description: 'Failed to update content template',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== id));
      toast({
        title: 'Success',
        description: 'Content template deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting content template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete content template',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchTemplates();
    }
  }, [organizationId]);

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: fetchTemplates,
  };
};