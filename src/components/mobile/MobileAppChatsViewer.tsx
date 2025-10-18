import { useQuery } from "@tanstack/react-query";
import { useMobileAppData } from "@/hooks/useMobileAppData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { format } from "date-fns";
import { Search, MessageSquare, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MobileAppChatsViewerProps {
  organizationId: string;
}

interface Conversation {
  id: string;
  participant_ids: string[];
  last_message_preview?: string;
  last_message_timestamp?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  timestamp: string;
  is_read: boolean;
}

interface User {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
}

export function MobileAppChatsViewer({ organizationId }: MobileAppChatsViewerProps) {
  const { fetchTableData } = useMobileAppData(organizationId);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['mobile-app-conversations', organizationId],
    queryFn: () => fetchTableData('conversations', {
      columns: '*',
      orderBy: { column: 'last_message_timestamp', ascending: false },
      limit: 100
    }),
  });

  const { data: users } = useQuery({
    queryKey: ['mobile-app-users-for-chats', organizationId],
    queryFn: () => fetchTableData('users', {
      columns: 'id,full_name,username,avatar_url'
    }),
  });

  const { data: messages } = useQuery({
    queryKey: ['mobile-app-messages', organizationId, selectedConversation],
    queryFn: () => selectedConversation ? fetchTableData('messages', {
      filters: { conversation_id: selectedConversation },
      orderBy: { column: 'timestamp', ascending: true },
      limit: 500
    }) : Promise.resolve([]),
    enabled: !!selectedConversation,
  });

  const getUserById = (userId: string): User | undefined => {
    return users?.find((u: User) => u.id === userId);
  };

  const getParticipantNames = (participantIds: string[]): string => {
    return participantIds
      .map(id => getUserById(id)?.full_name || 'Unknown')
      .join(', ');
  };

  const filteredConversations = conversations?.filter((conv: Conversation) => {
    if (!searchTerm) return true;
    const participantNames = getParticipantNames(conv.participant_ids).toLowerCase();
    const preview = conv.last_message_preview?.toLowerCase() || '';
    return participantNames.includes(searchTerm.toLowerCase()) || 
           preview.includes(searchTerm.toLowerCase());
  });

  if (conversationsLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversations?.filter((c: Conversation) => {
                const lastMsg = c.last_message_timestamp ? new Date(c.last_message_timestamp) : null;
                const today = new Date();
                return lastMsg && lastMsg.toDateString() === today.toDateString();
              }).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Conversations</CardTitle>
              <CardDescription>View and search all chat conversations</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by participant or message content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participants</TableHead>
                <TableHead>Last Message</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Unread</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConversations?.map((conversation: Conversation) => {
                const participantIds = conversation.participant_ids || [];
                const firstParticipant = getUserById(participantIds[0]);

                return (
                  <TableRow key={conversation.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={firstParticipant?.avatar_url} />
                          <AvatarFallback>
                            {firstParticipant?.full_name?.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                          {getParticipantNames(participantIds)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-xs truncate">
                        {conversation.last_message_preview || 'No messages yet'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {conversation.last_message_timestamp 
                          ? format(new Date(conversation.last_message_timestamp), 'MMM d, h:mm a')
                          : 'Never'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {conversation.unread_count ? (
                        <Badge variant="destructive">{conversation.unread_count}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedConversation(conversation.id)}
                      >
                        View Chat
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Messages Dialog */}
      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conversation Messages</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {messages?.map((message: Message) => {
              const sender = getUserById(message.sender_id);
              return (
                <div key={message.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={sender?.avatar_url} />
                    <AvatarFallback>
                      {sender?.full_name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{sender?.full_name || 'Unknown'}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.timestamp), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{message.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
