import { useState } from 'react';
import { useConstituent360, type TimelineEventType } from '@/hooks/useConstituent360';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Clock, MessageSquare, StickyNote } from 'lucide-react';
import { format } from 'date-fns';

const TYPE_META: Record<TimelineEventType, { label: string; icon: any; color: string }> = {
  donation:    { label: 'Donations',    icon: DollarSign,     color: 'bg-emerald-500' },
  volunteer:   { label: 'Hours',        icon: Clock,          color: 'bg-blue-500' },
  interaction: { label: 'Interactions', icon: MessageSquare,  color: 'bg-purple-500' },
  note:        { label: 'Notes',        icon: StickyNote,     color: 'bg-amber-500' },
};

interface Props {
  contactId: string;
  organizationId: string;
}

export function ConstituentTimeline({ contactId, organizationId }: Props) {
  const { data: events, isLoading } = useConstituent360(contactId, organizationId);
  const [filter, setFilter] = useState<TimelineEventType | 'all'>('all');

  const filtered = !events ? [] : filter === 'all' ? events : events.filter((e) => e.type === filter);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All ({events?.length ?? 0})
          </Button>
          {(Object.keys(TYPE_META) as TimelineEventType[]).map((t) => {
            const count = events?.filter((e) => e.type === t).length ?? 0;
            const Icon = TYPE_META[t].icon;
            return (
              <Button
                key={t}
                size="sm"
                variant={filter === t ? 'default' : 'outline'}
                onClick={() => setFilter(t)}
              >
                <Icon className="h-3 w-3 mr-1" />
                {TYPE_META[t].label} ({count})
              </Button>
            );
          })}
        </div>

        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground text-sm">Loading timeline...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">
            No activity yet. Donations, volunteer hours, interactions, and notes will appear here.
          </p>
        ) : (
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
            {filtered.map((e) => {
              const meta = TYPE_META[e.type];
              const Icon = meta.icon;
              return (
                <div key={e.id} className="relative">
                  <div className={`absolute -left-6 top-1 h-4 w-4 rounded-full ${meta.color} flex items-center justify-center ring-2 ring-background`}>
                    <Icon className="h-2.5 w-2.5 text-white" />
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="capitalize text-xs">{e.type}</Badge>
                        <span className="font-medium text-sm">{e.title}</span>
                      </div>
                      {e.description && (
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{e.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {format(new Date(e.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
