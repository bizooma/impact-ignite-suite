import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface TaskComment {
  id: string;
  task_id: string;
  organization_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: { display_name: string | null; avatar_url: string | null } | null;
}

export const useTaskComments = (taskId: string | null, organizationId: string) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchComments = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const authorIds = Array.from(new Set((data || []).map((c) => c.author_id)));
      let profilesMap: Record<string, any> = {};
      if (authorIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', authorIds);
        profilesMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p]));
      }
      setComments((data || []).map((c) => ({ ...c, author: profilesMap[c.author_id] || null })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (content: string) => {
    if (!taskId || !content.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      const { error } = await supabase.from('task_comments').insert({
        task_id: taskId,
        organization_id: organizationId,
        author_id: user.id,
        content: content.trim(),
      });
      if (error) throw error;
      await supabase.from('task_activity').insert({
        task_id: taskId,
        organization_id: organizationId,
        actor_id: user.id,
        action: 'commented',
        details: { preview: content.trim().slice(0, 80) },
      });
      await fetchComments();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const deleteComment = async (id: string) => {
    try {
      const { error } = await supabase.from('task_comments').delete().eq('id', id);
      if (error) throw error;
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  return { comments, loading, addComment, deleteComment, refetch: fetchComments };
};
