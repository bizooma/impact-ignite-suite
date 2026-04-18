import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Task } from '@/types/database';

// Extended type for tasks with profile data
interface TaskWithProfile extends Omit<Task, 'metadata'> {
  metadata: any;
  assignee_profile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const useTasks = (organizationId: string) => {
  const [tasks, setTasks] = useState<TaskWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee_profile:profiles!tasks_assignee_id_fkey(id, display_name, avatar_url)
        `)
        .eq('organization_id', organizationId)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data as TaskWithProfile[] || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select(`
          *,
          assignee_profile:profiles!tasks_assignee_id_fkey(id, display_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      setTasks(prev => [data as TaskWithProfile, ...prev]);
      toast({
        title: 'Success',
        description: 'Task created successfully',
      });
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      // Only touch completed_at when status is explicitly being changed
      const payload: Record<string, any> = { ...updates };
      if (updates.status !== undefined) {
        payload.completed_at = updates.status === 'completed' ? new Date().toISOString() : null;
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', id)
        .select(`
          *,
          assignee_profile:profiles!tasks_assignee_id_fkey(id, display_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      setTasks(prev => prev.map(t => t.id === id ? data as TaskWithProfile : t));
      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });
      return data;
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== id));
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchTasks();
    }
  }, [organizationId]);

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  };
};