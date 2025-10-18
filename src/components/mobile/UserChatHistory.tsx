import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMobileAppData } from '@/hooks/useMobileAppData';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Conversation {
  id: string;
  participant_ids: string[];
  last_message: string;
  last_message_timestamp: string;
  unread_count: number;
  created_at: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
  is_read: boolean;
  conversation_id: string;
}

interface UserChatHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  organizationId: string;
}

export function UserChatHistory({ open, onOpenChange, user, organizationId }: UserChatHistoryProps) {
  const { fetchTableData } = useMobileAppData(organizationId);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch conversations for this user
  const { data: conversationsData, isLoading: loadingConversations } = useQuery({
    queryKey: ['user-conversations', organizationId, user.id],
    queryFn: async () => {
      const result = await fetchTableData('conversations', {
        columns: '*',
        orderBy: { column: 'last_message_timestamp', ascending: false },
      });
      // Filter conversations that include this user
      const allConversations = result.data as Conversation[];
      return allConversations.filter(c => c.participant_ids.includes(user.id));
    },
    enabled: open,
  });

  // Fetch messages for selected conversation
  const { data: messagesData, isLoading: loadingMessages } = useQuery({
    queryKey: ['conversation-messages', organizationId, selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const result = await fetchTableData('messages', {
        filters: { conversation_id: selectedConversation },
        orderBy: { column: 'timestamp', ascending: true },
      });
      return result.data as Message[];
    },
    enabled: !!selectedConversation,
  });

  // Fetch all users to display names
  const { data: usersData } = useQuery({
    queryKey: ['all-users', organizationId],
    queryFn: async () => {
      const result = await fetchTableData('users', {
        columns: 'id,full_name,avatar_url,username',
      });
      return result.data as any[];
    },
    enabled: open,
  });

  const users = usersData || [];
  const conversations = conversationsData || [];
  const messages = messagesData || [];

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const getOtherParticipants = (conversation: Conversation) => {
    return conversation.participant_ids
      .filter(id => id !== user.id)
      .map(id => getUserById(id))
      .filter(Boolean);
  };

  const filteredConversations = conversations.filter(conv => {
    const otherUsers = getOtherParticipants(conv);
    const searchLower = searchTerm.toLowerCase();
    return (
      conv.last_message.toLowerCase().includes(searchLower) ||
      otherUsers.some(u => u.full_name.toLowerCase().includes(searchLower))
    );
  });

  if (loadingConversations) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading chat history...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat History: {user.full_name}
          </DialogTitle>
          <DialogDescription>
            View all conversations and messages for this user
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-full overflow-hidden">
          {/* Conversations List */}
          <div className="w-1/3 border-r flex flex-col">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No conversations found
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conversation) => {
                    const otherUsers = getOtherParticipants(conversation);
                    const isSelected = selectedConversation === conversation.id;

                    return (
                      <button
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation.id)}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                          isSelected ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex -space-x-2">
                            {otherUsers.slice(0, 2).map((u, i) => (
                              <Avatar key={i} className="h-8 w-8 border-2 border-background">
                                <AvatarImage src={u.avatar_url} />
                                <AvatarFallback>
                                  {u.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm truncate">
                                {otherUsers.map(u => u.full_name).join(', ')}
                              </p>
                              {conversation.unread_count > 0 && (
                                <Badge variant="default" className="text-xs">
                                  {conversation.unread_count}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {conversation.last_message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(conversation.last_message_timestamp), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Messages View */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                <ScrollArea className="flex-1 p-6">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground">
                      No messages in this conversation
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const sender = getUserById(message.sender_id);
                        const isCurrentUser = message.sender_id === user.id;

                        return (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={sender?.avatar_url} />
                              <AvatarFallback>
                                {sender?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`flex-1 max-w-[70%] ${isCurrentUser ? 'items-end' : ''}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  {sender?.full_name || 'Unknown'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(message.timestamp), 'MMM d, h:mm a')}
                                </span>
                              </div>
                              <div
                                className={`rounded-lg p-3 ${
                                  isCurrentUser
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-6">
                <div className="max-w-sm">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Select a Conversation</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a conversation from the list to view messages
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
