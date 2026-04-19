import { useCampaignMilestones, type CampaignMilestone } from '@/hooks/useCampaignAssets';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Calendar } from 'lucide-react';

interface Props {
  campaignId: string;
}

const PHASE_LABELS: Record<string, string> = {
  awareness: 'Awareness (8 weeks out)',
  engagement: 'Engagement (4 weeks out)',
  push: 'Final Push (1 week out)',
  day_of: 'Day Of',
  stewardship: 'Stewardship (after)',
};

const PHASE_COLORS: Record<string, string> = {
  awareness: 'bg-blue-500',
  engagement: 'bg-purple-500',
  push: 'bg-orange-500',
  day_of: 'bg-red-500',
  stewardship: 'bg-green-500',
};

export function CampaignTimeline({ campaignId }: Props) {
  const { milestones, isLoading, updateMilestone } = useCampaignMilestones(campaignId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Group by phase
  const grouped = (milestones || []).reduce((acc, m) => {
    (acc[m.phase] = acc[m.phase] || []).push(m);
    return acc;
  }, {} as Record<string, CampaignMilestone[]>);

  const phaseOrder: CampaignMilestone['phase'][] = ['awareness', 'engagement', 'push', 'day_of', 'stewardship'];

  const toggleStatus = (m: CampaignMilestone) => {
    updateMilestone.mutate({
      id: m.id,
      updates: { status: m.status === 'completed' ? 'todo' : 'completed' },
    });
  };

  return (
    <div className="space-y-6">
      {phaseOrder.map((phase) => {
        const items = grouped[phase] || [];
        if (items.length === 0) return null;
        return (
          <div key={phase}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-8 rounded ${PHASE_COLORS[phase]}`} />
              <h3 className="font-semibold text-lg">{PHASE_LABELS[phase]}</h3>
              <Badge variant="outline" className="ml-2">
                {items.filter((i) => i.status === 'completed').length}/{items.length}
              </Badge>
            </div>
            <div className="space-y-2 ml-4">
              {items.map((m) => (
                <Card key={m.id} className="p-4 flex items-start gap-3">
                  <Checkbox
                    checked={m.status === 'completed'}
                    onCheckedChange={() => toggleStatus(m)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className={m.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                      <div className="font-medium">{m.title}</div>
                      {m.description && <div className="text-sm text-muted-foreground mt-1">{m.description}</div>}
                    </div>
                    {m.due_date && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(m.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
