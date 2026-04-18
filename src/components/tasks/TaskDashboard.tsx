import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTasks } from '@/hooks/useTasks';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { TaskToolbar } from './TaskToolbar';
import { TaskTableView } from './TaskTableView';
import { KanbanBoardView } from './KanbanBoardView';
import { TaskDetailDialog } from './TaskDetailDialog';
import { CheckSquare, Clock, AlertCircle, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TaskDashboardProps {
  organizationId: string;
}

const TaskDashboard: React.FC<TaskDashboardProps> = ({ organizationId }) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState('status');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [detailTask, setDetailTask] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    source_module: 'manual',
    priority: 1,
    due_date: '',
    assignee_id: 'unassigned',
  });

  const { tasks, loading, createTask, updateTask: updateTaskRaw, deleteTask } = useTasks(organizationId);
  const { teamMembers, loading: loadingMembers } = useTeamMembers(organizationId);

  // Wrap updateTask to log status/assignee changes to activity feed
  const updateTask = async (id: string, updates: any) => {
    const before = tasks.find((t) => t.id === id);
    const result = await updateTaskRaw(id, updates);
    if (before) {
      const { data: { user } } = await supabase.auth.getUser();
      const entries: any[] = [];
      if (updates.status !== undefined && updates.status !== before.status) {
        entries.push({
          task_id: id,
          organization_id: organizationId,
          actor_id: user?.id ?? null,
          action: 'status_changed',
          details: { from: before.status, to: updates.status },
        });
      }
      if (updates.assignee_id !== undefined && updates.assignee_id !== before.assignee_id) {
        entries.push({
          task_id: id,
          organization_id: organizationId,
          actor_id: user?.id ?? null,
          action: 'assignee_changed',
          details: { from: before.assignee_id, to: updates.assignee_id },
        });
      }
      if (entries.length) await supabase.from('task_activity').insert(entries);
    }
    return result;
  };

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }
      
      // Priority filter
      if (priorityFilter !== 'all' && (task.priority ?? 1).toString() !== priorityFilter) {
        return false;
      }
      
      // Assignee filter
      if (assigneeFilter !== 'all' && task.assignee_id !== assigneeFilter) {
        return false;
      }
      
      return true;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, assigneeFilter]);

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');
  const overdueTasks = filteredTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask({
        ...formData,
        organization_id: organizationId,
        priority: Number(formData.priority),
        due_date: formData.due_date || null,
        assignee_id: formData.assignee_id === 'unassigned' ? null : formData.assignee_id,
        status: 'todo' as const,
        metadata: {},
      });
      setShowCreateDialog(false);
      setFormData({
        title: '',
        description: '',
        source_module: 'manual',
        priority: 1,
        due_date: '',
        assignee_id: 'unassigned',
      });
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'in_progress': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-destructive';
    if (priority >= 3) return 'text-warning';
    return 'text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-8 bg-muted animate-pulse rounded w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }



  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Task Management</h2>
          <p className="text-muted-foreground">
            Manage tasks across all your modules and projects
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 px-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckSquare className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{completedTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueTasks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <TaskToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        onCreateTask={() => setShowCreateDialog(true)}
        teamMembers={teamMembers}
      />

      {/* Table or Board View */}
      <div className="px-4 pb-4">
        {viewMode === 'table' ? (
          <TaskTableView
            tasks={filteredTasks}
            teamMembers={teamMembers}
            groupBy={groupBy}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onTaskClick={setDetailTask}
          />
        ) : (
          <KanbanBoardView
            tasks={filteredTasks}
            onUpdate={updateTask}
            onTaskClick={setDetailTask}
          />
        )}

      </div>

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogTrigger asChild>
          <Button className="hidden">
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Create a new task for your team
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Complete SEO audit"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the task..."
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority.toString()} onValueChange={(value) => setFormData({ ...formData, priority: Number(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Low</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">High</SelectItem>
                      <SelectItem value="4">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignee">Assign to</Label>
                <Select
                  value={formData.assignee_id}
                  onValueChange={(value) => setFormData({ ...formData, assignee_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.display_name || 'Unnamed'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Task
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      <TaskDetailDialog
        task={detailTask}
        organizationId={organizationId}
        open={!!detailTask}
        onOpenChange={(o) => !o && setDetailTask(null)}
      />
    </div>
  );
};

export default TaskDashboard;