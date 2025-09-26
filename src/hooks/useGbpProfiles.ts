import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type GbpProfile = Database['public']['Tables']['gbp_profiles']['Row'];
type GbpTask = Database['public']['Tables']['gbp_tasks']['Row'];

export const useGbpProfiles = (organizationId?: string) => {
  const [profiles, setProfiles] = useState<GbpProfile[]>([]);
  const [tasks, setTasks] = useState<GbpTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfiles = async () => {
    if (!organizationId) return;
    
    try {
      const { data, error } = await supabase
        .from('gbp_profiles')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching GBP profiles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch GBP profiles",
        variant: "destructive",
      });
    }
  };

  const fetchTasks = async () => {
    if (!organizationId) return;
    
    try {
      const { data, error } = await supabase
        .from('gbp_tasks')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching GBP tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (profileData: {
    business_name: string;
    description?: string;
    categories?: string[];
  }) => {
    if (!organizationId) return null;

    try {
      const { data, error } = await supabase
        .from('gbp_profiles')
        .insert({
          organization_id: organizationId,
          ...profileData,
          completeness_score: 0
        })
        .select()
        .single();

      if (error) throw error;

      setProfiles(prev => [data, ...prev]);
      
      toast({
        title: "Success",
        description: "GBP profile created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating GBP profile:', error);
      toast({
        title: "Error",
        description: "Failed to create GBP profile",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateProfile = async (profileId: string, updates: Partial<GbpProfile>) => {
    try {
      const { data, error } = await supabase
        .from('gbp_profiles')
        .update(updates)
        .eq('id', profileId)
        .select()
        .single();

      if (error) throw error;

      setProfiles(prev => prev.map(profile => 
        profile.id === profileId ? { ...profile, ...data } : profile
      ));

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
      return null;
    }
  };

  const syncProfile = async (profileId: string) => {
    try {
      // Call edge function to sync with Google Business Profile
      const { data, error } = await supabase.functions.invoke('sync-gbp-profile', {
        body: { profileId }
      });

      if (error) throw error;

      await updateProfile(profileId, { 
        last_synced_at: new Date().toISOString(),
        profile_data: data?.profileData
      });

    } catch (error) {
      console.error('Error syncing profile:', error);
      toast({
        title: "Error",
        description: "Failed to sync profile",
        variant: "destructive",
      });
    }
  };

  const createTask = async (taskData: {
    title: string;
    description: string;
    task_type: string;
    gbp_profile_id?: string;
    priority?: number;
    due_date?: string;
  }) => {
    if (!organizationId) return null;

    try {
      const { data, error } = await supabase
        .from('gbp_tasks')
        .insert({
          organization_id: organizationId,
          ...taskData
        })
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => [data, ...prev]);
      
      toast({
        title: "Success",
        description: "Task created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<GbpTask>) => {
    try {
      const { data, error } = await supabase
        .from('gbp_tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...data } : task
      ));

      toast({
        title: "Success",
        description: "Task updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchProfiles();
      fetchTasks();
    }
  }, [organizationId]);

  return {
    profiles,
    tasks,
    loading,
    createProfile,
    updateProfile,
    syncProfile,
    createTask,
    updateTask,
    refetch: () => {
      fetchProfiles();
      fetchTasks();
    }
  };
};