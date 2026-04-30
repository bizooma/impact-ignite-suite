import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Returns the current user's role within an organization (e.g. 'owner', 'admin', 'editor', 'viewer').
 * Returns null while loading or if the user has no membership in that org.
 */
export function useOrgRole(organizationId?: string) {
  const { user } = useAuth();

  const { data: role, isLoading } = useQuery({
    queryKey: ['org-role', organizationId, user?.id],
    queryFn: async () => {
      if (!user?.id || !organizationId) return null;
      const { data, error } = await supabase
        .from('memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .maybeSingle();
      if (error) throw error;
      return (data?.role as string) ?? null;
    },
    enabled: !!user?.id && !!organizationId,
  });

  const isAdminOrOwner = role === 'admin' || role === 'owner';
  return { role, isAdminOrOwner, isLoading };
}
