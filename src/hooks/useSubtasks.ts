import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface Subtask {
  id: string;
  parent_task_id: string;
  title: string;
  status: string;
  assignee_id: string | null;
  due_date: string | null;
  organization_id: string;
}

export const useSubtasks = (parentTaskId: string | null, organizationId: string) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSubtasks = async () => {
    if (!parentTaskId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, parent_task_id, title, status, assignee_id, due_date, organization_id')
        .eq('parent_task_id', parentTaskId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setSubtasks((data || []) as Subtask[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addSubtask = async (title: string) => {
    if (!parentTaskId || !title.trim()) return;
    try {
      const { error } = await supabase.from('tasks').insert({
        title: title.trim(),
        parent_task_id: parentTaskId,
        organization_id: organizationId,
        status: 'todo',
        priority: 1,
        source_module: 'manual',
      });
      if (error) throw error;
      await fetchSubtasks();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const toggleSubtask = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: completed ? 'completed' : 'todo',
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', id);
      if (error) throw error;
      setSubtasks((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: completed ? 'completed' : 'todo' } : s))
      );
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const deleteSubtask = async (id: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      setSubtasks((prev) => prev.filter((s) => s.id !== id));
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchSubtasks();
  }, [parentTaskId]);

  const completed = subtasks.filter((s) => s.status === 'completed').length;
  const total = subtasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { subtasks, loading, addSubtask, toggleSubtask, deleteSubtask, progress, completed, total, refetch: fetchSubtasks };
};
