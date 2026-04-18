import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Send, Plus, Activity as ActivityIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTaskComments } from '@/hooks/useTaskComments';
import { useTaskActivity } from '@/hooks/useTaskActivity';
import { useSubtasks } from '@/hooks/useSubtasks';

interface TaskDetailDialogProps {
  task: any | null;
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({
  task,
  organizationId,
  open,
  onOpenChange,
}) => {
  const taskId = task?.id ?? null;
  const { comments, addComment, deleteComment } = useTaskComments(taskId, organizationId);
  const { activity } = useTaskActivity(taskId);
  const { subtasks, addSubtask, toggleSubtask, deleteSubtask, progress, completed, total } =
    useSubtasks(taskId, organizationId);

  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  if (!task) return null;

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addComment(newComment);
    setNewComment('');
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    await addSubtask(newSubtask);
    setNewSubtask('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-left">{task.title}</DialogTitle>
          {task.description && (
            <p className="text-sm text-muted-foreground text-left">{task.description}</p>
          )}
        </DialogHeader>

        <Tabs defaultValue="subtasks" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="subtasks">
              Subtasks {total > 0 && `(${completed}/${total})`}
            </TabsTrigger>
            <TabsTrigger value="comments">Comments {comments.length > 0 && `(${comments.length})`}</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Subtasks */}
          <TabsContent value="subtasks" className="flex-1 overflow-hidden flex flex-col gap-3 mt-4">
            {total > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            <ScrollArea className="flex-1 pr-3">
              <div className="space-y-1">
                {subtasks.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 group py-1">
                    <Checkbox
                      checked={s.status === 'completed'}
                      onCheckedChange={(c) => toggleSubtask(s.id, !!c)}
                    />
                    <span
                      className={`flex-1 text-sm ${
                        s.status === 'completed' ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {s.title}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteSubtask(s.id)}
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {subtasks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No subtasks yet. Add one below.
                  </p>
                )}
              </div>
            </ScrollArea>
            <div className="flex gap-2 pt-2 border-t">
              <Input
                placeholder="Add a subtask..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubtask();
                }}
              />
              <Button size="sm" onClick={handleAddSubtask}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Comments */}
          <TabsContent value="comments" className="flex-1 overflow-hidden flex flex-col gap-3 mt-4">
            <ScrollArea className="flex-1 pr-3">
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2 group">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={c.author?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {c.author?.display_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {c.author?.display_name || 'Unknown'}
                        </span>
                        <span>{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">{c.content}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteComment(c.id)}
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-destructive shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No comments yet. Start the discussion below.
                  </p>
                )}
              </div>
            </ScrollArea>
            <div className="flex gap-2 pt-2 border-t">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddComment();
                }}
                className="resize-none"
              />
              <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Activity */}
          <TabsContent value="activity" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full pr-3">
              <div className="space-y-3">
                {activity.map((a) => (
                  <div key={a.id} className="flex gap-2 text-sm">
                    <div className="mt-0.5">
                      <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p>
                        <span className="font-medium">{a.actor?.display_name || 'Someone'}</span>{' '}
                        <span className="text-muted-foreground">{formatActivity(a)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                {activity.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No activity yet.
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

function formatActivity(a: any): string {
  switch (a.action) {
    case 'commented':
      return `commented: "${a.details?.preview || ''}"`;
    case 'status_changed':
      return `changed status to ${a.details?.to}`;
    case 'assignee_changed':
      return `reassigned the task`;
    case 'created':
      return 'created this task';
    default:
      return a.action.replace(/_/g, ' ');
  }
}
