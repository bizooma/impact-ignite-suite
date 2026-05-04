import { useCampaignMetrics } from '@/hooks/useCampaignMetrics';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, Users, TrendingUp, Megaphone, Eye, Heart } from 'lucide-react';

interface Props {
  campaignId: string;
  organizationId: string;
}

export function CampaignAnalytics({ campaignId, organizationId }: Props) {
  const { data: metrics, isLoading } = useCampaignMetrics(campaignId, organizationId);

  if (isLoading || !metrics) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <DollarSign className="h-4 w-4" /> Raised
          </div>
          <div className="text-2xl font-bold">{fmt(metrics.donations_amount)}</div>
          {metrics.goal_amount && (
            <div className="text-xs text-muted-foreground mt-1">
              {metrics.percent_to_goal.toFixed(0)}% of {fmt(metrics.goal_amount)}
            </div>
          )}
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Users className="h-4 w-4" /> Donors
          </div>
          <div className="text-2xl font-bold">{metrics.unique_donors}</div>
          {metrics.goal_donors && (
            <div className="text-xs text-muted-foreground mt-1">Goal: {metrics.goal_donors}</div>
          )}
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <TrendingUp className="h-4 w-4" /> Donations
          </div>
          <div className="text-2xl font-bold">{metrics.donations_count}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Megaphone className="h-4 w-4" /> Social posts
          </div>
          <div className="text-2xl font-bold">{metrics.social_posts_published}<span className="text-base font-normal text-muted-foreground">/{metrics.social_posts_total}</span></div>
          {metrics.social_by_platform.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {metrics.social_by_platform.map((p) => (
                <Badge key={p.platform} variant="outline" className="text-xs capitalize">{p.platform} · {p.count}</Badge>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Eye className="h-4 w-4" /> Reach
          </div>
          <div className="text-2xl font-bold">{metrics.social_reach.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">Across linked social posts</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Heart className="h-4 w-4" /> Engagement
          </div>
          <div className="text-2xl font-bold">{metrics.social_engagement.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">Likes + comments + shares</div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">Recent donations</h3>
        {metrics.recent_donations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No donations attributed yet. Tag donations with this campaign in the CRM to track them here.</p>
        ) : (
          <div className="space-y-2">
            {metrics.recent_donations.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <span>{new Date(d.donation_date).toLocaleDateString()}</span>
                <span className="font-semibold">{fmt(d.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
