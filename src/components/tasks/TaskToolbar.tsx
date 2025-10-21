import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Table, LayoutGrid } from 'lucide-react';

interface TaskToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  groupBy: string;
  onGroupByChange: (value: string) => void;
  viewMode: 'table' | 'board';
  onViewModeChange: (value: 'table' | 'board') => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  onCreateTask: () => void;
  teamMembers: any[];
  assigneeFilter: string;
  onAssigneeFilterChange: (value: string) => void;
}

export const TaskToolbar: React.FC<TaskToolbarProps> = ({
  searchQuery,
  onSearchChange,
  groupBy,
  onGroupByChange,
  viewMode,
  onViewModeChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  onCreateTask,
  teamMembers,
  assigneeFilter,
  onAssigneeFilterChange,
}) => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-card border-b">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Button onClick={onCreateTask} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New task
          </Button>
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={assigneeFilter} onValueChange={onAssigneeFilterChange}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="All people" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All people</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.display_name || 'Unnamed'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="h-9 w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
            <SelectTrigger className="h-9 w-[120px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priority</SelectItem>
              <SelectItem value="1">Low</SelectItem>
              <SelectItem value="2">Medium</SelectItem>
              <SelectItem value="3">High</SelectItem>
              <SelectItem value="4">Critical</SelectItem>
            </SelectContent>
          </Select>

          <Select value={groupBy} onValueChange={onGroupByChange}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">Group by Status</SelectItem>
              <SelectItem value="assignee">Group by Assignee</SelectItem>
              <SelectItem value="priority">Group by Priority</SelectItem>
              <SelectItem value="source">Group by Source</SelectItem>
              <SelectItem value="none">No grouping</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 border rounded-md">
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              onClick={() => onViewModeChange('table')}
              className="h-9 rounded-r-none"
            >
              <Table className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'board' ? 'secondary' : 'ghost'}
              onClick={() => onViewModeChange('board')}
              className="h-9 rounded-l-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
