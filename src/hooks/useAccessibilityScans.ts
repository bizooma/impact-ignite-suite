import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AccessibilityScan {
  id: string;
  site_id: string;
  score: number;
  pages_scanned: number;
  summary: any;
  status: string;
  created_at: string;
}

export interface AccessibilityIssue {
  id: string;
  scan_id: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
  element_snippet: string | null;
  page_url: string | null;
}

export function useAccessibilityScans(siteId?: string) {
  const [latestScan, setLatestScan] = useState<AccessibilityScan | null>(null);
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const load = useCallback(async () => {
    if (!siteId) return;
    setLoading(true);
    const { data: scan } = await supabase
      .from('accessibility_scans' as any)
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (scan) {
      setLatestScan(scan as any);
      const { data: iss } = await supabase
        .from('accessibility_issues' as any)
        .select('*')
        .eq('scan_id', (scan as any).id);
      setIssues((iss as any[]) || []);
    } else {
      setLatestScan(null);
      setIssues([]);
    }
    setLoading(false);
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  const runScan = async () => {
    if (!siteId) return;
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('accessibility-scan', {
        body: { site_id: siteId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success('Scan complete');
      await load();
    } catch (e: any) {
      toast.error(e.message ?? 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  return { latestScan, issues, loading, scanning, runScan, refresh: load };
}
