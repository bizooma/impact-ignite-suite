import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { GripVertical, Calendar as CalendarIcon, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskRowProps {
  task: any;
  teamMembers: any[];
  isSelected: boolean;
  onToggleSelect: () => void;
  onUpdate: (taskId: string, updates: any) => void;
  onDelete: (taskId: string) => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  teamMembers,
  isSelected,
  onToggleSelect,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = (field: string) => {
    if (editValue !== task[field]) {
      onUpdate(task.id, { [field]: editValue });
    }
    setIsEditing(null);
  };

  const startEdit = (field: string, value: string) => {
    setIsEditing(field);
    setEditValue(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success hover:bg-success/20 border-success/20';
      case 'in_progress':
        return 'bg-warning/10 text-warning hover:bg-warning/20 border-warning/20';
      default:
        return 'bg-muted text-muted-foreground hover:bg-muted/80 border-border';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 4: return 'Critical';
      case 3: return 'High';
      case 2: return 'Medium';
      default: return 'Low';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-destructive';
    if (priority >= 3) return 'text-warning';
    return 'text-muted-foreground';
  };

  const getDueDateColor = () => {
    if (!task.due_date) return '';
    const daysUntilDue = differenceInDays(new Date(task.due_date), new Date());
    
    if (task.status === 'completed') return 'bg-success/10 text-success border-success/20';
    if (daysUntilDue < 0) return 'bg-destructive/10 text-destructive border-destructive/20';
    if (daysUntilDue <= 3) return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-muted text-muted-foreground border-border';
  };

  const getDuration = () => {
    if (!task.due_date) return '-';
    const days = differenceInDays(new Date(task.due_date), new Date(task.created_at));
    return `${Math.max(0, days)} days`;
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="group flex items-center gap-2 px-4 py-2 border-b hover:bg-accent/50 transition-colors bg-card"
      >
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        
        {/* Checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          className="shrink-0"
        />

        {/* Expand/Collapse */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 w-6 p-0 shrink-0"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>

        {/* Task Name - 30% */}
        <div className="flex-[0_0_30%] min-w-0">
          {isEditing === 'title' ? (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleSave('title')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave('title');
                if (e.key === 'Escape') setIsEditing(null);
              }}
              autoFocus
              className="h-8"
            />
          ) : (
            <div
              onClick={() => startEdit('title', task.title)}
              className="truncate cursor-text hover:bg-accent/50 px-2 py-1 rounded text-sm"
            >
              {task.title}
            </div>
          )}
        </div>

        {/* Owner - 15% */}
        <div className="flex-[0_0_15%] min-w-0">
          <Select
            value={task.assignee_id || 'unassigned'}
            onValueChange={(value) =>
              onUpdate(task.id, { assignee_id: value === 'unassigned' ? null : value })
            }
          >
            <SelectTrigger className="h-8 border-0 shadow-none hover:bg-accent/50">
              <SelectValue>
                {task.assignee_profile ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={task.assignee_profile.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {task.assignee_profile.display_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs truncate">
                      {task.assignee_profile.display_name || 'Unnamed'}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Unassigned</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {member.display_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{member.display_name || 'Unnamed'}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status - 12% */}
        <div className="flex-[0_0_12%] min-w-0">
          <Select
            value={task.status}
            onValueChange={(value) => onUpdate(task.id, { status: value })}
          >
            <SelectTrigger className="h-8 border-0 shadow-none">
              <Badge variant="outline" className={cn('text-xs font-medium', getStatusColor(task.status))}>
                {task.status === 'in_progress' ? 'In Progress' : task.status === 'completed' ? 'Done' : 'To Do'}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority - 10% */}
        <div className="flex-[0_0_10%] min-w-0">
          <Select
            value={(task.priority ?? 1).toString()}
            onValueChange={(value) => onUpdate(task.id, { priority: Number(value) })}
          >
            <SelectTrigger className="h-8 border-0 shadow-none hover:bg-accent/50">
              <span className={cn('text-xs font-medium', getPriorityColor(task.priority))}>
                {getPriorityLabel(task.priority)}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Low</SelectItem>
              <SelectItem value="2">Medium</SelectItem>
              <SelectItem value="3">High</SelectItem>
              <SelectItem value="4">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Due Date - 15% */}
        <div className="flex-[0_0_15%] min-w-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'h-8 justify-start text-left font-normal border-0 shadow-none w-full',
                  !task.due_date && 'text-muted-foreground'
                )}
              >
                {task.due_date ? (
                  <Badge variant="outline" className={cn('text-xs', getDueDateColor())}>
                    {format(new Date(task.due_date), 'MMM d')}
                  </Badge>
                ) : (
                  <span className="text-xs">Set date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={task.due_date ? new Date(task.due_date) : undefined}
                onSelect={(date) =>
                  onUpdate(task.id, { due_date: date ? format(date, 'yyyy-MM-dd') : null })
                }
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Duration - 10% */}
        <div className="flex-[0_0_10%] min-w-0">
          <span className="text-xs text-muted-foreground">{getDuration()}</span>
        </div>

        {/* Source - 10% */}
        <div className="flex-[0_0_10%] min-w-0">
          <Badge variant="outline" className="text-xs">
            {task.source_module}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex-[0_0_8%] min-w-0 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(task.id)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expanded Description */}
      {isExpanded && task.description && (
        <div className="px-16 py-3 bg-muted/30 border-b text-sm text-muted-foreground">
          {task.description}
        </div>
      )}
    </>
  );
};
