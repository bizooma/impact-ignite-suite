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
      setLoading(true);
      
      // Call edge function to perform audit synchronously
      const { data: auditData, error: invokeError } = await supabase.functions.invoke('seo-audit', {
        body: { domain }
      });

      if (invokeError) throw invokeError;
      
      if (!auditData.success) {
        throw new Error(auditData.error || 'Audit failed');
      }

      // Create audit record with completed status and results
      const { data: audit, error: insertError } = await supabase
        .from('seo_audits')
        .insert({
          organization_id: organizationId,
          domain,
          status: 'completed',
          pages_crawled: auditData.pages_crawled ?? 1,
          overall_score: auditData.overall_score ?? 0,
          technical_score: auditData.technical_score ?? null,
          content_score: auditData.content_score ?? null,
          schema_score: auditData.schema_score ?? null,
          voice_seo_score: auditData.voice_seo_score ?? null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Store audit issues
      if (auditData.issues && auditData.issues.length > 0) {
        const { error: issuesError } = await supabase
          .from('audit_issues')
          .insert(
            auditData.issues.map((issue: any) => ({
              audit_id: audit.id,
              page_url: issue.page_url || domain,
              category: issue.category || issue.issue_type,
              severity: issue.severity,
              issue: issue.description,
              recommendation: issue.recommendation
            }))
          );

        if (issuesError) {
          console.error('Error storing audit issues:', issuesError);
        }
      }

      setAudits(prev => [audit, ...prev]);
      
      toast({
        title: "Success",
        description: `SEO audit completed. Found ${auditData.issues.length} issues.`,
      });

      return audit;
    } catch (error) {
      console.error('Error creating SEO audit:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create audit",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
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
      setLoading(true);
      
      // Delete old audit issues
      await supabase
        .from('audit_issues')
        .delete()
        .eq('audit_id', auditId);

      // Call edge function to perform audit synchronously
      const { data: auditData, error: invokeError } = await supabase.functions.invoke('seo-audit', {
        body: { domain }
      });

      if (invokeError) throw invokeError;
      
      if (!auditData.success) {
        throw new Error(auditData.error || 'Audit failed');
      }

      // Update audit record with results
      const { error: updateError } = await supabase
        .from('seo_audits')
        .update({
          status: 'completed',
          pages_crawled: auditData.pages_crawled ?? 1,
          overall_score: auditData.overall_score ?? 0,
          technical_score: auditData.technical_score ?? null,
          content_score: auditData.content_score ?? null,
          schema_score: auditData.schema_score ?? null,
          voice_seo_score: auditData.voice_seo_score ?? null,
          updated_at: new Date().toISOString()
        })
        .eq('id', auditId);

      if (updateError) throw updateError;

      // Store new audit issues
      if (auditData.issues && auditData.issues.length > 0) {
        await supabase
          .from('audit_issues')
          .insert(
            auditData.issues.map((issue: any) => ({
              audit_id: auditId,
              page_url: issue.page_url || domain,
              category: issue.category || issue.issue_type,
              severity: issue.severity,
              issue: issue.description,
              recommendation: issue.recommendation
            }))
          );
      }

      // Refresh audits
      await fetchAudits();
      
      toast({
        title: "Success",
        description: `SEO audit completed. Found ${auditData.issues.length} issues.`,
      });
    } catch (error) {
      console.error('Error retrying audit:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to retry audit",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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