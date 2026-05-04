import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OnboardingState {
  id: string;
  organization_id: string;
  brand_kit_done: boolean;
  integration_connected: boolean;
  first_asset_created: boolean;
  team_member_invited: boolean;
  dismissed_banners: Record<string, boolean>;
}

export function useOnboardingState(organizationId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['onboarding-state', organizationId],
    enabled: !!organizationId,
    queryFn: async (): Promise<OnboardingState | null> => {
      if (!organizationId) return null;
      const { data, error } = await supabase
        .from('org_onboarding_state')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        dismissed_banners:
          (data.dismissed_banners as Record<string, boolean>) || {},
      } as OnboardingState;
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<Omit<OnboardingState, 'id' | 'organization_id'>>) => {
      if (!organizationId) throw new Error('No organization');
      const { error } = await supabase
        .from('org_onboarding_state')
        .upsert(
          { organization_id: organizationId, ...patch },
          { onConflict: 'organization_id' },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-state', organizationId] });
    },
  });

  const dismissBanner = (bannerKey: string) => {
    const current = query.data?.dismissed_banners || {};
    return update.mutateAsync({
      dismissed_banners: { ...current, [bannerKey]: true },
    });
  };

  return {
    state: query.data ?? null,
    isLoading: query.isLoading,
    update: update.mutateAsync,
    dismissBanner,
  };
}
