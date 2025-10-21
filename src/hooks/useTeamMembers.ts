import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface TeamMember {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const useTeamMembers = (organizationId: string) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        // First get all user_ids from memberships
        const { data: memberships, error: membershipsError } = await supabase
          .from('memberships')
          .select('user_id')
          .eq('organization_id', organizationId);

        if (membershipsError) throw membershipsError;

        if (!memberships || memberships.length === 0) {
          setTeamMembers([]);
          setLoading(false);
          return;
        }

        // Then fetch profiles for those user_ids
        const userIds = memberships.map((m) => m.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, user_id')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const members = (profiles || [])
          .map((p) => ({
            id: p.user_id,
            display_name: p.display_name,
            avatar_url: p.avatar_url,
          }))
          .filter((m) => m.id);

        setTeamMembers(members);
      } catch (error) {
        console.error('Error fetching team members:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch team members',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (organizationId) {
      fetchTeamMembers();
    }
  }, [organizationId, toast]);

  return { teamMembers, loading };
};
