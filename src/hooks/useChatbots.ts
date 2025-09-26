import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Chatbot, KnowledgeSource, ChatbotBrandSettings, ChatbotWidgetConfig, KnowledgeSourceMetadata } from '@/types/database';
import type { Json } from '@/integrations/supabase/types';

export function useChatbots(organizationId?: string) {
  const { user } = useAuth();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organizationId) {
      fetchChatbots();
    }
  }, [organizationId]);

  const fetchChatbots = async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our types
      const transformedData = (data || []).map(item => ({
        ...item,
        brand_settings: item.brand_settings as ChatbotBrandSettings,
        web_widget_config: item.web_widget_config as ChatbotWidgetConfig,
      }));
      
      setChatbots(transformedData);
    } catch (error: any) {
      console.error('Error fetching chatbots:', error);
      toast.error('Failed to load chatbots');
    } finally {
      setLoading(false);
    }
  };

  const createChatbot = async (chatbotData: Partial<Chatbot>) => {
    if (!organizationId || !user) return null;

    try {
      const { data, error } = await supabase
        .from('chatbots')
        .insert({
          name: chatbotData.name || '',
          description: chatbotData.description,
          organization_id: organizationId,
          brand_settings: chatbotData.brand_settings as Json,
          web_widget_config: chatbotData.web_widget_config as Json,
          status: chatbotData.status || 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      
      const transformedData = {
        ...data,
        brand_settings: data.brand_settings as ChatbotBrandSettings,
        web_widget_config: data.web_widget_config as ChatbotWidgetConfig,
      };
      
      setChatbots(prev => [transformedData, ...prev]);
      toast.success('Chatbot created successfully');
      return transformedData;
    } catch (error: any) {
      console.error('Error creating chatbot:', error);
      toast.error('Failed to create chatbot');
      return null;
    }
  };

  const updateChatbot = async (id: string, updates: Partial<Chatbot>) => {
    try {
      const updateData: any = { ...updates };
      if (updates.brand_settings) {
        updateData.brand_settings = updates.brand_settings as Json;
      }
      if (updates.web_widget_config) {
        updateData.web_widget_config = updates.web_widget_config as Json;
      }
      
      const { data, error } = await supabase
        .from('chatbots')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const transformedData = {
        ...data,
        brand_settings: data.brand_settings as ChatbotBrandSettings,
        web_widget_config: data.web_widget_config as ChatbotWidgetConfig,
      };
      
      setChatbots(prev => 
        prev.map(chatbot => 
          chatbot.id === id ? { ...chatbot, ...transformedData } : chatbot
        )
      );
      toast.success('Chatbot updated successfully');
      return transformedData;
    } catch (error: any) {
      console.error('Error updating chatbot:', error);
      toast.error('Failed to update chatbot');
      return null;
    }
  };

  const deleteChatbot = async (id: string) => {
    try {
      const { error } = await supabase
        .from('chatbots')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setChatbots(prev => prev.filter(chatbot => chatbot.id !== id));
      toast.success('Chatbot deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error deleting chatbot:', error);
      toast.error('Failed to delete chatbot');
      return false;
    }
  };

  return {
    chatbots,
    loading,
    fetchChatbots,
    createChatbot,
    updateChatbot,
    deleteChatbot,
  };
}

export function useKnowledgeSources(chatbotId?: string) {
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (chatbotId) {
      fetchKnowledgeSources();
    }
  }, [chatbotId]);

  const fetchKnowledgeSources = async () => {
    if (!chatbotId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('knowledge_sources')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our types
      const transformedData = (data || []).map(item => ({
        ...item,
        metadata: item.metadata as KnowledgeSourceMetadata,
      }));
      
      setKnowledgeSources(transformedData);
    } catch (error: any) {
      console.error('Error fetching knowledge sources:', error);
      toast.error('Failed to load knowledge sources');
    } finally {
      setLoading(false);
    }
  };

  const addKnowledgeSource = async (sourceData: Partial<KnowledgeSource>) => {
    if (!chatbotId) return null;

    try {
      const { data, error } = await supabase
        .from('knowledge_sources')
        .insert({
          chatbot_id: chatbotId,
          type: sourceData.type || 'text',
          name: sourceData.name || '',
          content: sourceData.content,
          file_url: sourceData.file_url,
          file_path: sourceData.file_path,
          status: sourceData.status || 'pending',
          metadata: sourceData.metadata as Json || {},
        })
        .select()
        .single();

      if (error) throw error;
      
      const transformedData = {
        ...data,
        metadata: data.metadata as KnowledgeSourceMetadata,
      };
      
      setKnowledgeSources(prev => [transformedData, ...prev]);
      toast.success('Knowledge source added successfully');
      return transformedData;
    } catch (error: any) {
      console.error('Error adding knowledge source:', error);
      toast.error('Failed to add knowledge source');
      return null;
    }
  };

  const updateKnowledgeSource = async (id: string, updates: Partial<KnowledgeSource>) => {
    try {
      const updateData: any = { ...updates };
      if (updates.metadata) {
        updateData.metadata = updates.metadata as Json;
      }
      
      const { data, error } = await supabase
        .from('knowledge_sources')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const transformedData = {
        ...data,
        metadata: data.metadata as KnowledgeSourceMetadata,
      };
      
      setKnowledgeSources(prev => 
        prev.map(source => 
          source.id === id ? { ...source, ...transformedData } : source
        )
      );
      return transformedData;
    } catch (error: any) {
      console.error('Error updating knowledge source:', error);
      toast.error('Failed to update knowledge source');
      return null;
    }
  };

  const deleteKnowledgeSource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setKnowledgeSources(prev => prev.filter(source => source.id !== id));
      toast.success('Knowledge source removed successfully');
      return true;
    } catch (error: any) {
      console.error('Error deleting knowledge source:', error);
      toast.error('Failed to remove knowledge source');
      return false;
    }
  };

  return {
    knowledgeSources,
    loading,
    fetchKnowledgeSources,
    addKnowledgeSource,
    updateKnowledgeSource,
    deleteKnowledgeSource,
  };
}