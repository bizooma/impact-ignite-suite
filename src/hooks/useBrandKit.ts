import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BrandKit, BrandKitInsert } from '@/types/brandKit';
import {
  resolveBrandColors,
  applyBrandColorsToRoot,
  loadFontStylesheet,
} from '@/lib/brandKit';
import { toast } from 'sonner';

/**
 * Fetch the brand kit for an organization. Returns null if none exists yet.
 * Also injects brand CSS variables and font stylesheets on load.
 */
export function useBrandKit(organizationId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['brand-kit', organizationId],
    enabled: !!organizationId,
    queryFn: async (): Promise<BrandKit | null> => {
      if (!organizationId) return null;
      const { data, error } = await supabase
        .from('brand_kits')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        extended_palette: Array.isArray(data.extended_palette)
          ? (data.extended_palette as string[])
          : [],
        voice_descriptors: Array.isArray(data.voice_descriptors)
          ? (data.voice_descriptors as string[])
          : [],
      } as BrandKit;
    },
  });

  // Apply CSS variables + font stylesheets globally whenever the kit loads/changes
  useEffect(() => {
    const kit = query.data;
    const colors = resolveBrandColors(kit);
    applyBrandColorsToRoot(colors);
    const cleanups: Array<() => void> = [];
    if (kit?.heading_font_url) cleanups.push(loadFontStylesheet(kit.heading_font_url));
    if (kit?.body_font_url && kit.body_font_url !== kit.heading_font_url) {
      cleanups.push(loadFontStylesheet(kit.body_font_url));
    }
    return () => cleanups.forEach(fn => fn());
  }, [query.data]);

  const upsert = useMutation({
    mutationFn: async (patch: BrandKitInsert) => {
      const payload = { ...patch };
      // Use `onConflict: organization_id` so repeated saves update in place
      const { data, error } = await supabase
        .from('brand_kits')
        .upsert(payload as any, { onConflict: 'organization_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-kit', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-state', organizationId] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to save brand kit');
    },
  });

  const markCompleted = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error('No organization');
      const { error: kitErr } = await supabase
        .from('brand_kits')
        .update({ setup_completed_at: new Date().toISOString() })
        .eq('organization_id', organizationId);
      if (kitErr) throw kitErr;
      // Also flip the onboarding-state flag (insert if missing).
      const { error: stateErr } = await supabase
        .from('org_onboarding_state')
        .upsert(
          { organization_id: organizationId, brand_kit_done: true },
          { onConflict: 'organization_id' },
        );
      if (stateErr) throw stateErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-kit', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-state', organizationId] });
    },
  });

  return {
    brandKit: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    upsert: upsert.mutateAsync,
    isSaving: upsert.isPending,
    markCompleted: markCompleted.mutateAsync,
    colors: resolveBrandColors(query.data),
  };
}
