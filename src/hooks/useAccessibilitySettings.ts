import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AccessibilitySettings {
  id: string;
  site_id: string;
  high_contrast: boolean;
  font_scaling: boolean;
  reduced_motion: boolean;
  spacing: boolean;
  highlight_links: boolean;
  widget_active: boolean;
  statement_text: string | null;
  updated_at: string;
}

export function useAccessibilitySettings(siteId?: string) {
  const [settings, setSettings] = useState<AccessibilitySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!siteId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('accessibility_settings' as any)
      .select('*')
      .eq('site_id', siteId)
      .maybeSingle();
    if (error) {
      toast.error('Failed to load settings');
    } else {
      setSettings(data as any);
    }
    setLoading(false);
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  const update = async (patch: Partial<AccessibilitySettings>) => {
    if (!siteId) return;
    const { data, error } = await supabase
      .from('accessibility_settings' as any)
      .update(patch)
      .eq('site_id', siteId)
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setSettings(data as any);
    toast.success('Saved');
  };

  return { settings, loading, update };
}
