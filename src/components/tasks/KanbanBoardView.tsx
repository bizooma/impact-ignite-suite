import React from 'react';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MessageSquare } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'completed', title: 'Done' },
] as const;

interface KanbanBoardViewProps {
  tasks: any[];
  onUpdate: (taskId: string, updates: any) => void;
  onTaskClick: (task: any) => void;
}

const KanbanCard: React.FC<{ task: any; onClick: () => void }> = ({ task, onClick }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  const overdue =
    task.due_date && differenceInDays(new Date(task.due_date), new Date()) < 0 && task.status !== 'completed';

  const priorityLabel = (p: number) => (p >= 4 ? 'Critical' : p >= 3 ? 'High' : p >= 2 ? 'Medium' : 'Low');
  const priorityColor = (p: number) =>
    p >= 4 ? 'border-destructive/30 text-destructive' : p >= 3 ? 'border-warning/30 text-warning' : 'border-border text-muted-foreground';

  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Only trigger click if not dragging
        if (!isDragging) onClick();
      }}
      className={cn(
        'p-3 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors space-y-2',
        isDragging && 'opacity-50'
      )}
    >
      <div className="text-sm font-medium leading-tight">{task.title}</div>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Badge variant="outline" className={cn('text-xs', priorityColor(task.priority ?? 1))}>
          {priorityLabel(task.priority ?? 1)}
        </Badge>
        {task.due_date && (
          <div className={cn('flex items-center gap-1 text-xs', overdue ? 'text-destructive' : 'text-muted-foreground')}>
            <Calendar className="h-3 w-3" />
            {format(new Date(task.due_date), 'MMM d')}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        {task.assignee_profile ? (
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              <AvatarImage src={task.assignee_profile.avatar_url} />
              <AvatarFallback className="text-[10px]">
                {task.assignee_profile.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
              {task.assignee_profile.display_name}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        )}
        <Badge variant="secondary" className="text-[10px] h-5">
          {task.source_module}
        </Badge>
      </div>
    </Card>
  );
};

const KanbanColumn: React.FC<{ id: string; title: string; tasks: any[]; onTaskClick: (t: any) => void }> = ({
  id,
  title,
  tasks,
  onTaskClick,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex-1 min-w-[280px] flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 mb-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-2 p-2 rounded-lg bg-muted/30 min-h-[200px] transition-colors',
          isOver && 'bg-primary/10 ring-2 ring-primary/30'
        )}
      >
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
      </div>
    </div>
  );
};

export const KanbanBoardView: React.FC<KanbanBoardViewProps> = ({ tasks, onUpdate, onTaskClick }) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Only top-level (non-subtask) tasks
  const topLevel = tasks.filter((t) => !t.parent_task_id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const newStatus = String(over.id);
    const task = topLevel.find((t) => t.id === active.id);
    if (!task || task.status === newStatus) return;
    if (!['todo', 'in_progress', 'completed'].includes(newStatus)) return;
    onUpdate(active.id as string, { status: newStatus });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            tasks={topLevel.filter((t) => t.status === col.id)}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </DndContext>
  );
};
