import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle, Users, Clock, TrendingUp, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useChatbots } from '@/hooks/useChatbots';
import { useTierLimits } from '@/hooks/useTierLimits';
import { formatCap } from '@/lib/aiTierLimits';
import { ChatbotBuilder } from './ChatbotBuilder';
import { ChatInterface } from './ChatInterface';
import { supabase } from '@/integrations/supabase/client';

interface ChatbotDashboardProps {
  organizationId: string;
}

export default function ChatbotDashboard({ organizationId }: ChatbotDashboardProps) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [editChatbotId, setEditChatbotId] = useState<string | null>(null);
  const [selectedChatbot, setSelectedChatbot] = useState<string | null>(null);
  const { chatbots, loading } = useChatbots(organizationId);
  const { canCreate, limits, counts, tier } = useTierLimits(organizationId);

  const chatbotIds = chatbots.map((c) => c.id);
  const { data: totalConversations } = useQuery({
    queryKey: ['org-total-conversations', organizationId, chatbotIds.join(',')],
    enabled: chatbotIds.length > 0,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .in('chatbot_id', chatbotIds);
      if (error) {
        console.error(error);
        return 0;
      }
      return count || 0;
    },
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (showBuilder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Chatbot Builder</h1>
            <p className="text-muted-foreground">Create and configure your chatbot</p>
          </div>
          <Button variant="outline" onClick={() => { setShowBuilder(false); setEditChatbotId(null); }}>
            Back to Dashboard
          </Button>
        </div>
        <ChatbotBuilder organizationId={organizationId} initialChatbotId={editChatbotId ?? undefined} />
      </div>
    );
  }

  if (selectedChatbot) {
    const chatbot = chatbots.find(c => c.id === selectedChatbot);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Chat with {chatbot?.name}</h1>
            <p className="text-muted-foreground">Test your chatbot</p>
          </div>
          <Button variant="outline" onClick={() => setSelectedChatbot(null)}>
            Back to Dashboard
          </Button>
        </div>
        
        <ChatInterface 
          chatbotId={selectedChatbot}
          title={chatbot?.name || 'Chatbot'}
        />
      </div>
    );
  }

  const totalChatbots = chatbots.length;
  const activeChatbots = chatbots.filter(c => c.status === 'active').length;
  const draftChatbots = chatbots.filter(c => c.status === 'draft').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chatbots</h1>
          <p className="text-muted-foreground">
            Manage your AI-powered chatbots
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button onClick={() => setShowBuilder(true)} disabled={!canCreate.chatbot}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Chatbot
                </Button>
              </span>
            </TooltipTrigger>
            {!canCreate.chatbot && (
              <TooltipContent>
                <p>You've used {counts.chatbots}/{formatCap(limits.chatbots)} chatbots on the {tier} plan.</p>
                <Link to="/pricing" className="underline">Upgrade to add more</Link>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Chatbots</p>
                <p className="text-2xl font-bold">{totalChatbots}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeChatbots}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold">{draftChatbots}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Conversations</p>
                <p className="text-2xl font-bold">{totalConversations ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chatbots List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Chatbots</CardTitle>
        </CardHeader>
        <CardContent>
          {chatbots.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No chatbots yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first AI-powered chatbot to get started.
              </p>
              <Button onClick={() => setShowBuilder(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Chatbot
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {chatbots.map((chatbot) => (
                <div
                  key={chatbot.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{chatbot.name}</h4>
                      <Badge variant={chatbot.status === 'active' ? 'success' : 'secondary'}>
                        {chatbot.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {chatbot.description || 'No description'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(chatbot.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedChatbot(chatbot.id)}
                    >
                      Test Chat
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditChatbotId(chatbot.id);
                        setShowBuilder(true);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}