import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TaskGroupHeaderProps {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  color?: string;
}

export const TaskGroupHeader: React.FC<TaskGroupHeaderProps> = ({
  title,
  count,
  isExpanded,
  onToggle,
  color = 'bg-muted',
}) => {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 ${color} sticky top-0 z-10 border-b`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="h-6 w-6 p-0"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
      <span className="font-semibold text-sm">{title}</span>
      <Badge variant="secondary" className="ml-2 h-5 text-xs">
        {count}
      </Badge>
    </div>
  );
};
