import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AccessibilitySite {
  id: string;
  organization_id: string;
  domain: string;
  business_name: string | null;
  site_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  latest_score?: number | null;
  latest_scan_at?: string | null;
  open_issues?: number;
}

export function useAccessibilitySites(organizationId?: string) {
  const [sites, setSites] = useState<AccessibilitySite[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    const { data: siteRows, error } = await supabase
      .from('accessibility_sites' as any)
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load sites');
      setLoading(false);
      return;
    }
    const sitesData = (siteRows as any[]) || [];

    // Fetch latest scan per site
    const enriched = await Promise.all(
      sitesData.map(async (s) => {
        const { data: scan } = await supabase
          .from('accessibility_scans' as any)
          .select('id, score, created_at')
          .eq('site_id', s.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        let issueCount = 0;
        if (scan) {
          const { count } = await supabase
            .from('accessibility_issues' as any)
            .select('id', { count: 'exact', head: true })
            .eq('scan_id', (scan as any).id);
          issueCount = count || 0;
        }
        return {
          ...s,
          latest_score: (scan as any)?.score ?? null,
          latest_scan_at: (scan as any)?.created_at ?? null,
          open_issues: issueCount,
        } as AccessibilitySite;
      })
    );
    setSites(enriched);
    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  const createSite = async (domain: string, business_name?: string) => {
    if (!organizationId) return null;
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
    const { data, error } = await supabase
      .from('accessibility_sites' as any)
      .insert({
        organization_id: organizationId,
        domain: cleanDomain,
        business_name: business_name || null,
      })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return null;
    }
    toast.success('Website added');
    await load();
    return data as any;
  };

  const deleteSite = async (id: string) => {
    const { error } = await supabase.from('accessibility_sites' as any).delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Site deleted');
    await load();
  };

  const getSite = async (id: string) => {
    const { data, error } = await supabase
      .from('accessibility_sites' as any)
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      toast.error(error.message);
      return null;
    }
    return data as any as AccessibilitySite;
  };

  return { sites, loading, createSite, deleteSite, getSite, refresh: load };
}
