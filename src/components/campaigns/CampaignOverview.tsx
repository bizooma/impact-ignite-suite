import { GoalThermometer } from './GoalThermometer';
import { CountdownClock } from './CountdownClock';
import { useCampaignMetrics } from '@/hooks/useCampaignMetrics';
import { useCampaignMilestones } from '@/hooks/useCampaignAssets';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MarketingCampaign } from '@/hooks/useCampaigns';
import { Calendar } from 'lucide-react';

interface Props {
  campaign: MarketingCampaign;
  organizationId: string;
}

const PHASE_LABELS: Record<string, string> = {
  awareness: 'Awareness',
  engagement: 'Engagement',
  push: 'Final Push',
  day_of: 'Day Of',
  stewardship: 'Stewardship',
};

export function CampaignOverview({ campaign, organizationId }: Props) {
  const { data: metrics } = useCampaignMetrics(campaign.id, organizationId);
  const { milestones } = useCampaignMilestones(campaign.id);

  const upcoming = (milestones || [])
    .filter((m) => m.status !== 'completed')
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
    .slice(0, 5);

  // phase progress
  const phases = ['awareness', 'engagement', 'push', 'day_of', 'stewardship'];
  const phaseProgress = phases.map((p) => {
    const items = (milestones || []).filter((m) => m.phase === p);
    const done = items.filter((m) => m.status === 'completed').length;
    return { phase: p, done, total: items.length };
  });

  return (
    <div className="space-y-6">
      {campaign.tagline && (
        <p className="text-lg italic text-muted-foreground">"{campaign.tagline}"</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GoalThermometer
          raised={metrics?.donations_amount || 0}
          goal={campaign.goal_amount}
          themeColor={campaign.theme_color}
        />
        <CountdownClock targetDate={campaign.event_date} label="Until event" themeColor={campaign.theme_color} />
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">Phase progress</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {phaseProgress.map((p) => (
            <div key={p.phase} className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{PHASE_LABELS[p.phase]}</div>
              <div className="text-2xl font-bold">{p.done}/{p.total}</div>
              <div className="h-1 bg-muted rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: p.total ? `${(p.done / p.total) * 100}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">Next 5 milestones</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">All milestones completed 🎉</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((m) => (
              <div key={m.id} className="flex items-start gap-3 border-b pb-2 last:border-0">
                <Badge variant="outline" className="capitalize shrink-0">{PHASE_LABELS[m.phase]}</Badge>
                <div className="flex-1">
                  <div className="font-medium text-sm">{m.title}</div>
                  {m.due_date && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(m.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
