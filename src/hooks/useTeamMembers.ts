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
        const { data, error } = await supabase
          .from('memberships')
          .select(`
            user_id,
            profiles!memberships_user_id_fkey(id, display_name, avatar_url)
          `)
          .eq('organization_id', organizationId);

        if (error) throw error;

        const members = data
          .map((m: any) => ({
            id: m.profiles.id,
            display_name: m.profiles.display_name,
            avatar_url: m.profiles.avatar_url,
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
