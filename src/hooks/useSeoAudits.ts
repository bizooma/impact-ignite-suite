import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type SeoAudit = Database['public']['Tables']['seo_audits']['Row'];
type AuditIssue = Database['public']['Tables']['audit_issues']['Row'];

export const useSeoAudits = (organizationId?: string) => {
  const [audits, setAudits] = useState<SeoAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAudits = async () => {
    if (!organizationId) return;
    
    try {
      const { data, error } = await supabase
        .from('seo_audits')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAudits(data || []);
    } catch (error) {
      console.error('Error fetching SEO audits:', error);
      toast({
        title: "Error",
        description: "Failed to fetch SEO audits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAudit = async (domain: string) => {
    if (!organizationId) return null;

    try {
      const { data, error } = await supabase
        .from('seo_audits')
        .insert({
          organization_id: organizationId,
          domain,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger audit process
      try {
        await supabase.functions.invoke('seo-audit', {
          body: { auditId: data.id, domain }
        });
      } catch (invokeError) {
        // If invocation fails, update status to error
        console.error('Failed to invoke seo-audit function:', invokeError);
        await supabase
          .from('seo_audits')
          .update({ status: 'error' })
          .eq('id', data.id);
        
        throw new Error('Failed to start audit process');
      }

      setAudits(prev => [data, ...prev]);
      
      toast({
        title: "Success",
        description: "SEO audit started successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating SEO audit:', error);
      toast({
        title: "Error",
        description: "Failed to start SEO audit",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteAudit = async (auditId: string) => {
    try {
      const { error } = await supabase
        .from('seo_audits')
        .delete()
        .eq('id', auditId);

      if (error) throw error;

      setAudits(prev => prev.filter(audit => audit.id !== auditId));
      
      toast({
        title: "Success",
        description: "Audit deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting audit:', error);
      toast({
        title: "Error",
        description: "Failed to delete audit",
        variant: "destructive",
      });
    }
  };

  const retryAudit = async (auditId: string, domain: string) => {
    try {
      // Update status to pending
      const { error: updateError } = await supabase
        .from('seo_audits')
        .update({ status: 'pending' })
        .eq('id', auditId);

      if (updateError) throw updateError;

      // Trigger audit process
      await supabase.functions.invoke('seo-audit', {
        body: { auditId, domain }
      });

      // Refresh audits
      await fetchAudits();
      
      toast({
        title: "Success",
        description: "Audit restarted successfully",
      });
    } catch (error) {
      console.error('Error retrying audit:', error);
      toast({
        title: "Error",
        description: "Failed to retry audit",
        variant: "destructive",
      });
    }
  };

  const getAuditIssues = async (auditId: string): Promise<AuditIssue[]> => {
    try {
      const { data, error } = await supabase
        .from('audit_issues')
        .select('*')
        .eq('audit_id', auditId)
        .order('severity', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching audit issues:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchAudits();
  }, [organizationId]);

  return {
    audits,
    loading,
    createAudit,
    deleteAudit,
    retryAudit,
    getAuditIssues,
    refetch: fetchAudits
  };
};