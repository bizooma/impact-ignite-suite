import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TaskActivity {
  id: string;
  task_id: string;
  actor_id: string | null;
  action: string;
  details: any;
  created_at: string;
  actor?: { display_name: string | null; avatar_url: string | null } | null;
}

export const useTaskActivity = (taskId: string | null) => {
  const [activity, setActivity] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivity = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('task_activity')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;

      const actorIds = Array.from(new Set((data || []).map((a) => a.actor_id).filter(Boolean))) as string[];
      let profilesMap: Record<string, any> = {};
      if (actorIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', actorIds);
        profilesMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p]));
      }
      setActivity((data || []).map((a) => ({ ...a, actor: a.actor_id ? profilesMap[a.actor_id] : null })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [taskId]);

  return { activity, loading, refetch: fetchActivity };
};
