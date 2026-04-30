import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type WidgetPosition = 'left' | 'center' | 'right';

export interface AccessibilitySettings {
  id: string;
  site_id: string;
  // core toggles
  high_contrast: boolean;
  font_scaling: boolean;
  reduced_motion: boolean;
  spacing: boolean;
  highlight_links: boolean;
  // expanded toggles
  dyslexia_font: boolean;
  letter_spacing: boolean;
  line_height: boolean;
  font_weight_adj: boolean;
  saturation_adj: boolean;
  monochrome: boolean;
  color_pickers: boolean;
  reading_mask: boolean;
  reading_guide: boolean;
  big_cursor: boolean;
  stop_animations: boolean;
  page_structure: boolean;
  profiles_enabled: boolean;
  language_selector: boolean;
  report_issue: boolean;
  oversize_widget: boolean;
  // meta
  widget_active: boolean;
  widget_position: WidgetPosition;
  statement_text: string | null;
  statement_url: string | null;
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
