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
      await supabase.functions.invoke('seo-audit', {
        body: { auditId: data.id, domain }
      });

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
    getAuditIssues,
    refetch: fetchAudits
  };
};