import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  chatbot_id: string;
  visitor_id?: string;
  status: string;
  created_at: string;
}

const sessionStorageKey = (chatbotId: string) => `chatbot:session:${chatbotId}`;

const readPersistedSession = (chatbotId: string): string | null => {
  if (typeof window === 'undefined' || !chatbotId) return null;
  try {
    return window.localStorage.getItem(sessionStorageKey(chatbotId));
  } catch {
    return null;
  }
};

const writePersistedSession = (chatbotId: string, sessionId: string | null) => {
  if (typeof window === 'undefined' || !chatbotId) return;
  try {
    if (sessionId) {
      window.localStorage.setItem(sessionStorageKey(chatbotId), sessionId);
    } else {
      window.localStorage.removeItem(sessionStorageKey(chatbotId));
    }
  } catch {
    /* storage unavailable (private mode, quota) — ignore */
  }
};

export function useChatbot(chatbotId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Lazy initializer reads localStorage so the session survives navigation/reload.
  const [sessionId, setSessionId] = useState<string | null>(() => readPersistedSession(chatbotId));
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // If chatbotId changes (different bot mounted), swap to its persisted session.
  useEffect(() => {
    setSessionId(readPersistedSession(chatbotId));
    setMessages([]);
  }, [chatbotId]);

  // Auto-load history whenever we have a persisted session but no messages yet.
  useEffect(() => {
    if (sessionId && messages.length === 0) {
      loadChatHistory(sessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    setLoading(true);
    
    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Call the chat handler edge function
      const { data, error } = await supabase.functions.invoke('chat-handler', {
        body: {
          message,
          sessionId,
          chatbotId
        }
      });

      // Cap-reached: edge function returns 200-shaped error in `data` for FunctionsHttpError
      const capError =
        (data && (data as any).error === 'cap_reached') ||
        (error as any)?.context?.body?.includes?.('cap_reached');

      if (capError || error) {
        // Try to read the friendly message
        let friendlyMessage =
          (data as any)?.message ||
          'This chatbot has reached its monthly message limit. Please contact the site owner.';
        try {
          const ctx = (error as any)?.context;
          if (ctx?.body) {
            const parsed = typeof ctx.body === 'string' ? JSON.parse(ctx.body) : ctx.body;
            if (parsed?.error === 'cap_reached') {
              friendlyMessage = parsed.message || friendlyMessage;
            }
          }
        } catch { /* ignore */ }

        if (capError || (error as any)?.context?.status === 429) {
          // Replace user message with a system note instead of error toast
          setMessages(prev => [
            ...prev.filter(m => m.id !== userMessage.id),
            userMessage,
            {
              id: `system-${Date.now()}`,
              role: 'assistant',
              content: friendlyMessage,
              created_at: new Date().toISOString(),
            },
          ]);
          return;
        }
        throw error || new Error('Chat failed');
      }

      // Update session ID if new — and persist so it survives navigation/reload.
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
        writePersistedSession(chatbotId, data.sessionId);
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const loadChatHistory = async (sessionId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading chat history:', error);
        return;
      }

      setMessages((messages || []).map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        created_at: msg.created_at
      })));
      setSessionId(sessionId);
      writePersistedSession(chatbotId, sessionId);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const startNewSession = () => {
    setMessages([]);
    setSessionId(null);
    writePersistedSession(chatbotId, null);
  };

  return {
    messages,
    sessionId,
    loading,
    sendMessage,
    loadChatHistory,
    startNewSession
  };
}