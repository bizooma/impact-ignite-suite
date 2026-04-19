import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Send,
  Copy,
  Code,
  Maximize2,
  Bot,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Chatbot } from '@/types/database';
import { useChatbots } from '@/hooks/useChatbots';
import { supabase } from '@/integrations/supabase/client';

interface ChatbotPreviewProps {
  chatbot: Chatbot;
}

interface PreviewMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

const POSITION_LABELS: Record<string, string> = {
  'bottom-right': 'Bottom Right',
  'bottom-left': 'Bottom Left',
  'middle-right': 'Middle Right',
  'middle-left': 'Middle Left',
};

const THEME_LABELS: Record<string, string> = {
  light: 'Light',
  dark: 'Dark',
};

const SIZE_LABELS: Record<string, string> = {
  compact: 'Compact',
  expanded: 'Expanded',
};

export function ChatbotPreview({ chatbot }: ChatbotPreviewProps) {
  const { updateChatbot } = useChatbots(chatbot.organization_id);
  const [messages, setMessages] = useState<PreviewMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        chatbot.brand_settings.welcome_message ||
        "Hello! I'm here to help you learn about our mission and find ways to get involved. How can I assist you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage: PreviewMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    const messageText = inputMessage;
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-handler', {
        body: {
          message: messageText,
          sessionId,
          chatbotId: chatbot.id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.sessionId && !sessionId) setSessionId(data.sessionId);

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data?.message || 'No response',
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Preview chat error:', error);
      toast.error('Failed to get a response. Check that the chatbot is configured correctly.');
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsTyping(false);
    }
  };

  const handleToggleStatus = async () => {
    setIsUpdatingStatus(true);
    try {
      const newStatus = chatbot.status === 'active' ? 'draft' : 'active';
      await updateChatbot(chatbot.id, { status: newStatus });
      toast.success(`Chatbot ${newStatus === 'active' ? 'activated' : 'paused'} successfully`);
    } catch (error) {
      console.error('Error updating chatbot status:', error);
      toast.error('Failed to update chatbot status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const appUrl = window.location.origin;

  const embedCode = `<!-- Causeio Chatbot Widget -->
<script
  src="${appUrl}/embed.js"
  data-chatbot-id="${chatbot.id}"
  data-primary-color="${chatbot.brand_settings.primary_color || '#0066CC'}"
  data-accent-color="${chatbot.brand_settings.accent_color || '#00AA44'}"
></script>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    toast.success('Embed code copied to clipboard');
  };

  const widgetConfig = chatbot.web_widget_config || {};
  const positionLabel = POSITION_LABELS[widgetConfig.position as string] || widgetConfig.position || 'Bottom Right';
  const themeLabel = THEME_LABELS[widgetConfig.theme as string] || widgetConfig.theme || 'Light';
  const sizeLabel = SIZE_LABELS[widgetConfig.size as string] || widgetConfig.size || 'Compact';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle>Live Preview</CardTitle>
            </div>
            <Badge variant="outline">Preview Mode</Badge>
          </div>
          <CardDescription>Test how your chatbot will interact with visitors</CardDescription>
        </CardHeader>

        <Separator />

        <CardContent className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted text-foreground p-3 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <Separator />

        <div className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isTyping}
            />
            <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isTyping} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              Widget Integration
            </CardTitle>
            <CardDescription>Add this chatbot to your website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Embed Code</label>
              <div className="relative">
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                  <code>{embedCode}</code>
                </pre>
                <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={copyEmbedCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Widget Position</span>
                <Badge variant="outline">{positionLabel}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Theme</span>
                <Badge variant="outline">{themeLabel}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Size</span>
                <Badge variant="outline">{sizeLabel}</Badge>
              </div>
            </div>

            <Button
              className="w-full gap-2"
              variant="outline"
              onClick={() => window.open(`${appUrl}/embed.js?preview=${chatbot.id}`, '_blank')}
              title="Opens the embed script in a new tab for inspection"
            >
              <Maximize2 className="h-4 w-4" />
              View Embed Script
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chatbot Status</CardTitle>
            <CardDescription>Manage your chatbot's availability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Current Status</span>
              <Badge variant={chatbot.status === 'active' ? 'success' : 'secondary'}>
                {chatbot.status}
              </Badge>
            </div>

            {chatbot.status === 'draft' && (
              <div className="p-3 bg-warning/10 text-warning-foreground rounded border border-warning/20">
                <p className="text-sm">
                  Your chatbot is in draft mode. Activate it to start receiving conversations.
                </p>
              </div>
            )}

            <Button
              className="w-full"
              variant={chatbot.status === 'active' ? 'outline' : 'default'}
              onClick={handleToggleStatus}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus
                ? 'Updating...'
                : chatbot.status === 'active'
                ? 'Pause Chatbot'
                : 'Activate Chatbot'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
