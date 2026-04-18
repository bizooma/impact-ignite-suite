import React, { useState, useMemo } from 'react';
import { TaskRow } from './TaskRow';
import { TaskGroupHeader } from './TaskGroupHeader';
import { CheckSquare } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface TaskTableViewProps {
  tasks: any[];
  teamMembers: any[];
  groupBy: string;
  onUpdate: (taskId: string, updates: any) => void;
  onDelete: (taskId: string) => void;
  onTaskClick?: (task: any) => void;
}

export const TaskTableView: React.FC<TaskTableViewProps> = ({
  tasks,
  teamMembers,
  groupBy,
  onUpdate,
  onDelete,
  onTaskClick,
}) => {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['all']));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const toggleGroupExpansion = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return { all: tasks };
    }

    const groups: Record<string, any[]> = {};

    tasks.forEach((task) => {
      let groupKey = '';

      switch (groupBy) {
        case 'status':
          groupKey = task.status;
          break;
        case 'assignee':
          groupKey = task.assignee_id || 'unassigned';
          break;
        case 'priority':
          groupKey = `priority_${task.priority ?? 1}`;
          break;
        case 'source':
          groupKey = task.source_module;
          break;
        default:
          groupKey = 'all';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });

    return groups;
  }, [tasks, groupBy]);

  const getGroupTitle = (groupKey: string) => {
    if (groupBy === 'none') return 'All Tasks';

    switch (groupBy) {
      case 'status':
        if (groupKey === 'todo') return 'To Do';
        if (groupKey === 'in_progress') return 'In Progress';
        if (groupKey === 'completed') return 'Completed';
        return groupKey;
      case 'assignee':
        if (groupKey === 'unassigned') return 'Unassigned';
        const member = teamMembers.find((m) => m.id === groupKey);
        return member?.display_name || 'Unknown';
      case 'priority':
        const priority = groupKey.replace('priority_', '');
        if (priority === '4') return 'Critical';
        if (priority === '3') return 'High';
        if (priority === '2') return 'Medium';
        return 'Low';
      case 'source':
        return groupKey.replace('_', ' ').toUpperCase();
      default:
        return groupKey;
    }
  };

  const getGroupColor = (groupKey: string) => {
    if (groupBy === 'status') {
      if (groupKey === 'completed') return 'bg-success/5';
      if (groupKey === 'in_progress') return 'bg-warning/5';
      return 'bg-muted/50';
    }
    return 'bg-muted/50';
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find the group containing both tasks
    for (const [, groupTasks] of Object.entries(groupedTasks)) {
      const oldIndex = groupTasks.findIndex((t) => t.id === active.id);
      const newIndex = groupTasks.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1) continue;

      // Compute new sort_order: midpoint between neighbors
      const reordered = [...groupTasks];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      const prev = reordered[newIndex - 1];
      const next = reordered[newIndex + 1];
      const prevOrder = prev?.sort_order ?? (next?.sort_order ?? 1) - 2;
      const nextOrder = next?.sort_order ?? prevOrder + 2;
      const newOrder = (prevOrder + nextOrder) / 2;

      onUpdate(active.id as string, { sort_order: newOrder });
      return;
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
        <p className="text-muted-foreground">
          Create your first task or adjust your filters
        </p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="border rounded-lg overflow-hidden bg-card">
        {/* Table Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b font-medium text-sm">
          <div className="w-4"></div>
          <div className="w-4"></div>
          <div className="w-6"></div>
          <div className="flex-[0_0_30%]">Task name</div>
          <div className="flex-[0_0_15%]">Owner</div>
          <div className="flex-[0_0_12%]">Status</div>
          <div className="flex-[0_0_10%]">Priority</div>
          <div className="flex-[0_0_15%]">Due date</div>
          <div className="flex-[0_0_10%]">Duration</div>
          <div className="flex-[0_0_10%]">Source</div>
          <div className="flex-[0_0_8%]"></div>
        </div>

        {/* Table Body with Groups */}
        <div className="divide-y">
          {Object.entries(groupedTasks).map(([groupKey, groupTasks]) => (
            <div key={groupKey}>
              {groupBy !== 'none' && (
                <TaskGroupHeader
                  title={getGroupTitle(groupKey)}
                  count={groupTasks.length}
                  isExpanded={expandedGroups.has(groupKey)}
                  onToggle={() => toggleGroupExpansion(groupKey)}
                  color={getGroupColor(groupKey)}
                />
              )}

              {(groupBy === 'none' || expandedGroups.has(groupKey)) && (
                <SortableContext
                  items={groupTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div>
                    {groupTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        teamMembers={teamMembers}
                        isSelected={selectedTasks.has(task.id)}
                        onToggleSelect={() => toggleTaskSelection(task.id)}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        onOpen={onTaskClick ? () => onTaskClick(task) : undefined}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </div>
          ))}
        </div>
      </div>
    </DndContext>
  );
};
