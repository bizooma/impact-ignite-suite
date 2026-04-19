import { useState } from 'react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { CampaignTemplatePicker } from './CampaignTemplatePicker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Target, Users, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  organizationId: string;
}

export function CampaignDashboard({ organizationId }: Props) {
  const { campaigns, isLoading } = useCampaigns(organizationId);
  const [picker, setPicker] = useState(false);
  const navigate = useNavigate();

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const daysUntil = (date: string | null) => {
    if (!date) return null;
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
    return diff;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">Plan, execute, and track your marketing campaigns end-to-end.</p>
        </div>
        <Button onClick={() => setPicker(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (!campaigns || campaigns.length === 0) && (
        <Card className="p-12 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-1">No campaigns yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started with a Giving Tuesday template — full multi-channel plan ready to go.
          </p>
          <Button onClick={() => setPicker(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create your first campaign
          </Button>
        </Card>
      )}

      {!isLoading && campaigns && campaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => {
            const days = daysUntil(c.event_date);
            return (
              <Card
                key={c.id}
                onClick={() => navigate(`/dashboard/campaigns/${c.id}`)}
                className="p-5 cursor-pointer hover:shadow-md transition-shadow"
                style={{ borderTop: `4px solid ${c.theme_color}` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg leading-tight">{c.name}</h3>
                  <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                    {c.status}
                  </Badge>
                </div>
                {c.tagline && <p className="text-sm text-muted-foreground italic mb-3">{c.tagline}</p>}
                <div className="space-y-2 text-sm">
                  {c.event_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(c.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      {days !== null && days > 0 && <Badge variant="outline" className="ml-auto">{days}d left</Badge>}
                      {days !== null && days <= 0 && <Badge variant="outline" className="ml-auto">Past</Badge>}
                    </div>
                  )}
                  {c.goal_amount && (
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>Goal: {fmt(c.goal_amount)}</span>
                    </div>
                  )}
                  {c.goal_donors && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Target: {c.goal_donors} donors</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CampaignTemplatePicker open={picker} onOpenChange={setPicker} organizationId={organizationId} />
    </div>
  );
}
