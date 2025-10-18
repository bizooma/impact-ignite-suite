import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Search, MessageSquare, Calendar, AlertTriangle, UserX } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

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
  role?: string;
  is_active?: boolean;
}

export function MobileAppChatsViewer({ organizationId }: MobileAppChatsViewerProps) {
  const { fetchTableData, updateData } = useMobileAppData(organizationId);
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);
  const [deactivateAll, setDeactivateAll] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['mobile-app-conversations', organizationId],
    queryFn: async () => {
      const result = await fetchTableData('conversations', {
        columns: '*',
        orderBy: { column: 'last_message_timestamp', ascending: false },
        limit: 100
      });
      return result.data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ['mobile-app-users-for-chats', organizationId],
    queryFn: async () => {
      const result = await fetchTableData('users', {
        columns: 'id,full_name,username,role,is_active'
      });
      return result.data;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ['mobile-app-messages', organizationId, selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const result = await fetchTableData('messages', {
        filters: { conversation_id: selectedConversation },
        orderBy: { column: 'timestamp', ascending: true },
        limit: 500
      });
      return result.data;
    },
    enabled: !!selectedConversation,
  });

  const conversationsArray = Array.isArray(conversations) ? (conversations as Conversation[]) : [];
  const usersArray = Array.isArray(users) ? (users as User[]) : [];
  const messagesArray = Array.isArray(messages) ? (messages as Message[]) : [];

  const getUserById = (userId: string): User | undefined => {
    return usersArray.find((u: User) => u.id === userId);
  };

  const getParticipantNames = (participantIds: string[]): string => {
    return participantIds
      .map(id => getUserById(id)?.full_name || 'Unknown')
      .join(', ');
  };

  const filteredConversations = conversationsArray.filter((conv: Conversation) => {
    if (!searchTerm) return true;
    const participantNames = getParticipantNames(conv.participant_ids).toLowerCase();
    const preview = conv.last_message_preview?.toLowerCase() || '';
    return participantNames.includes(searchTerm.toLowerCase()) || 
           preview.includes(searchTerm.toLowerCase());
  });

  const handleDeactivateUser = async (user: User) => {
    setIsDeactivating(true);
    try {
      await updateData('users', { is_active: false }, { id: user.id });
      toast.success(`${user.full_name} has been deactivated`);
      queryClient.invalidateQueries({ queryKey: ['mobile-app-users-for-chats', organizationId] });
      setDeactivateUser(null);
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      toast.error('Failed to deactivate user');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleDeactivateAllParticipants = async () => {
    if (!selectedConversation) return;
    
    const conversation = conversationsArray.find(c => c.id === selectedConversation);
    if (!conversation) return;

    setIsDeactivating(true);
    try {
      const activeParticipants = conversation.participant_ids
        .map(id => getUserById(id))
        .filter((user): user is User => user !== undefined && user.is_active !== false);

      for (const user of activeParticipants) {
        await updateData('users', { is_active: false }, { id: user.id });
      }

      toast.success(`Deactivated ${activeParticipants.length} user(s)`);
      queryClient.invalidateQueries({ queryKey: ['mobile-app-users-for-chats', organizationId] });
      setDeactivateAll(false);
    } catch (error) {
      console.error('Failed to deactivate users:', error);
      toast.error('Failed to deactivate all users');
    } finally {
      setIsDeactivating(false);
    }
  };

  const getConversationParticipants = (): User[] => {
    if (!selectedConversation) return [];
    const conversation = conversationsArray.find(c => c.id === selectedConversation);
    if (!conversation) return [];
    return conversation.participant_ids
      .map(id => getUserById(id))
      .filter((user): user is User => user !== undefined);
  };

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
            <div className="text-2xl font-bold">{conversationsArray.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversationsArray.filter((c: Conversation) => {
                const lastMsg = c.last_message_timestamp ? new Date(c.last_message_timestamp) : null;
                const today = new Date();
                return lastMsg && lastMsg.toDateString() === today.toDateString();
              }).length}
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
              {filteredConversations.map((conversation: Conversation) => {
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

          {/* Participants Section */}
          <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Participants</h4>
              {getConversationParticipants().some(p => p.is_active !== false) && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeactivateAll(true)}
                  disabled={isDeactivating}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Deactivate All
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {getConversationParticipants().map(participant => (
                <div key={participant.id} className="flex items-center justify-between bg-background p-2 rounded">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={participant.avatar_url} />
                      <AvatarFallback>
                        {participant.full_name?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{participant.full_name}</span>
                        {participant.role && (
                          <Badge variant="outline" className="text-xs">
                            {participant.role}
                          </Badge>
                        )}
                        {participant.is_active === false && (
                          <Badge variant="secondary" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{participant.username}</span>
                    </div>
                  </div>
                  {participant.is_active !== false && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeactivateUser(participant)}
                      disabled={isDeactivating}
                    >
                      Deactivate
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-4 pt-4">
            {messagesArray.map((message: Message) => {
              const sender = getUserById(message.sender_id);
              const isInactive = sender?.is_active === false;
              return (
                <div key={message.id} className={`flex items-start gap-3 ${isInactive ? 'opacity-60' : ''}`}>
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
                      {isInactive && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm mt-1">{message.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Single User Deactivation Confirmation */}
      <AlertDialog open={!!deactivateUser} onOpenChange={() => setDeactivateUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <strong>{deactivateUser?.full_name}</strong> ({deactivateUser?.role || 'unknown role'})?
              <br /><br />
              <span className="text-destructive font-medium">This will immediately prevent them from accessing the mobile app.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deactivateUser && handleDeactivateUser(deactivateUser)}
              disabled={isDeactivating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeactivating ? 'Deactivating...' : 'Deactivate User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Deactivation Confirmation */}
      <AlertDialog open={deactivateAll} onOpenChange={setDeactivateAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate All Participants</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate all active participants in this conversation?
              <br /><br />
              <span className="text-destructive font-medium">
                This will deactivate {getConversationParticipants().filter(p => p.is_active !== false).length} user(s) and immediately prevent them from accessing the mobile app.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateAllParticipants}
              disabled={isDeactivating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeactivating ? 'Deactivating...' : 'Deactivate All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
