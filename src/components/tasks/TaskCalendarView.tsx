import React, { useState, useMemo } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragEndEvent,
  closestCenter,
} from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, addMonths, subMonths, isSameDay } from 'date-fns';
import { getMonthDays } from '@/lib/calendarUtils';
import { cn } from '@/lib/utils';

interface TaskCalendarViewProps {
  tasks: any[];
  onUpdate: (taskId: string, updates: any) => Promise<any> | any;
  onTaskClick: (task: any) => void;
}

const priorityDot = (p: number) =>
  p >= 4 ? 'bg-destructive' : p >= 3 ? 'bg-warning' : p >= 2 ? 'bg-primary' : 'bg-muted-foreground';

const DraggableTask: React.FC<{ task: any; onClick: () => void }> = ({ task, onClick }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        if (!isDragging) onClick();
      }}
      className={cn(
        'flex items-center gap-1.5 px-1.5 py-1 rounded text-xs bg-card border hover:border-primary/50 cursor-grab active:cursor-grabbing truncate',
        task.status === 'completed' && 'opacity-60 line-through',
        isDragging && 'opacity-40'
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', priorityDot(task.priority ?? 1))} />
      <span className="truncate">{task.title}</span>
    </div>
  );
};

const DayCell: React.FC<{
  day: { date: Date; isCurrentMonth: boolean; isToday: boolean };
  tasks: any[];
  onTaskClick: (t: any) => void;
}> = ({ day, tasks, onTaskClick }) => {
  const id = format(day.date, 'yyyy-MM-dd');
  const { setNodeRef, isOver } = useDroppable({ id });
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? tasks : tasks.slice(0, 3);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[110px] border rounded-md p-1.5 flex flex-col gap-1 transition-colors',
        !day.isCurrentMonth && 'bg-muted/30 text-muted-foreground',
        day.isToday && 'ring-2 ring-primary/40',
        isOver && 'bg-primary/10 ring-2 ring-primary'
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn('text-xs font-medium', day.isToday && 'text-primary')}>
          {format(day.date, 'd')}
        </span>
        {tasks.length > 0 && (
          <Badge variant="secondary" className="h-4 px-1 text-[10px]">
            {tasks.length}
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-1 overflow-hidden">
        {visible.map((t) => (
          <DraggableTask key={t.id} task={t} onClick={() => onTaskClick(t)} />
        ))}
        {!expanded && tasks.length > 3 && (
          <button
            onClick={() => setExpanded(true)}
            className="text-[10px] text-muted-foreground hover:text-foreground text-left px-1"
          >
            +{tasks.length - 3} more
          </button>
        )}
      </div>
    </div>
  );
};

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({ tasks, onUpdate, onTaskClick }) => {
  const [cursor, setCursor] = useState(new Date());
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const days = useMemo(() => getMonthDays(cursor), [cursor]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    tasks.forEach((t) => {
      if (!t.due_date || t.parent_task_id) return;
      const key = format(new Date(t.due_date), 'yyyy-MM-dd');
      const arr = map.get(key) || [];
      arr.push(t);
      map.set(key, arr);
    });
    return map;
  }, [tasks]);

  const unscheduled = useMemo(
    () => tasks.filter((t) => !t.due_date && !t.parent_task_id && t.status !== 'completed'),
    [tasks]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const dateStr = String(over.id);
    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;
    const currentKey = task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : null;
    if (currentKey === dateStr) return;
    onUpdate(active.id as string, { due_date: dateStr });
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{format(cursor, 'MMMM yyyy')}</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setCursor(subMonths(cursor, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(addMonths(cursor, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-xs font-medium text-muted-foreground">
          {weekdays.map((d) => (
            <div key={d} className="px-2 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day.date, 'yyyy-MM-dd');
            return (
              <DayCell
                key={key}
                day={day}
                tasks={tasksByDay.get(key) || []}
                onTaskClick={onTaskClick}
              />
            );
          })}
        </div>

        {unscheduled.length > 0 && (
          <div className="border rounded-md p-3 bg-muted/30">
            <div className="text-sm font-medium mb-2">
              Unscheduled ({unscheduled.length}) — drag onto a day to schedule
            </div>
            <div className="flex flex-wrap gap-1.5">
              {unscheduled.map((t) => (
                <DraggableTask key={t.id} task={t} onClick={() => onTaskClick(t)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
};
