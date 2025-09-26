import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type SocialPost = Database['public']['Tables']['social_posts']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];

export const useSocialPosts = (organizationId?: string) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPosts = async () => {
    if (!organizationId) return;
    
    try {
      const { data, error } = await supabase
        .from('social_posts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching social posts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch social posts",
        variant: "destructive",
      });
    }
  };

  const fetchCampaigns = async () => {
    if (!organizationId) return;
    
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData: {
    content: string;
    platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin';
    scheduled_for?: string;
    campaign_id?: string;
    media_urls?: string[];
  }) => {
    if (!organizationId) return null;

    try {
      const { data, error } = await supabase
        .from('social_posts')
        .insert({
          organization_id: organizationId,
          ...postData,
          status: postData.scheduled_for ? 'scheduled' : 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      setPosts(prev => [data, ...prev]);
      
      toast({
        title: "Success",
        description: "Social post created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating social post:', error);
      toast({
        title: "Error",
        description: "Failed to create social post",
        variant: "destructive",
      });
      return null;
    }
  };

  const updatePost = async (postId: string, updates: Partial<SocialPost>) => {
    try {
      const { data, error } = await supabase
        .from('social_posts')
        .update(updates)
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;

      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, ...data } : post
      ));

      toast({
        title: "Success",
        description: "Post updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      });
      return null;
    }
  };

  const publishPost = async (postId: string) => {
    try {
      // Call edge function to publish to platform
      const { data, error } = await supabase.functions.invoke('publish-social-post', {
        body: { postId }
      });

      if (error) throw error;

      await updatePost(postId, { 
        status: 'published',
        published_at: new Date().toISOString(),
        external_post_id: data?.externalId
      });

    } catch (error) {
      console.error('Error publishing post:', error);
      toast({
        title: "Error",
        description: "Failed to publish post",
        variant: "destructive",
      });
    }
  };

  const createCampaign = async (campaignData: {
    name: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    goals?: any;
  }) => {
    if (!organizationId) return null;

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          organization_id: organizationId,
          ...campaignData
        })
        .select()
        .single();

      if (error) throw error;

      setCampaigns(prev => [data, ...prev]);
      
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchPosts();
      fetchCampaigns();
    }
  }, [organizationId]);

  return {
    posts,
    campaigns,
    loading,
    createPost,
    updatePost,
    publishPost,
    createCampaign,
    refetch: () => {
      fetchPosts();
      fetchCampaigns();
    }
  };
};