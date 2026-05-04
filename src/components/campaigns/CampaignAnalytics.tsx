import { useCampaignMetrics, type DailyPoint } from '@/hooks/useCampaignMetrics';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  DollarSign,
  Users,
  TrendingUp,
  Megaphone,
  Eye,
  Heart,
  QrCode,
  MessageCircle,
  CheckSquare,
  AlertTriangle,
} from 'lucide-react';

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

  const hasAnyData =
    metrics.donations_count > 0 ||
    metrics.social_posts_total > 0 ||
    metrics.qr_codes_count > 0 ||
    metrics.interactions_count > 0 ||
    metrics.tasks_total > 0;

  return (
    <div className="space-y-4">
      {/* ── Fundraising row ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <DollarSign className="h-4 w-4" /> Raised
          </div>
          <div className="text-2xl font-bold">{fmt(metrics.donations_amount)}</div>
          {metrics.goal_amount ? (
            <>
              <div className="text-xs text-muted-foreground mt-1">
                {metrics.percent_to_goal.toFixed(0)}% of {fmt(metrics.goal_amount)}
              </div>
              <div className="h-1.5 mt-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${metrics.percent_to_goal}%` }} />
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground mt-1">No goal set</div>
          )}
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Users className="h-4 w-4" /> Donors
          </div>
          <div className="text-2xl font-bold">{metrics.unique_donors}</div>
          {metrics.goal_donors ? (
            <>
              <div className="text-xs text-muted-foreground mt-1">
                {metrics.percent_to_donor_goal.toFixed(0)}% of {metrics.goal_donors}
              </div>
              <div className="h-1.5 mt-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${metrics.percent_to_donor_goal}%` }} />
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground mt-1">No goal set</div>
          )}
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <TrendingUp className="h-4 w-4" /> Donations
          </div>
          <div className="text-2xl font-bold">{metrics.donations_count}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Avg gift {metrics.avg_gift > 0 ? fmt(metrics.avg_gift) : '—'}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <CheckSquare className="h-4 w-4" /> Tasks
          </div>
          <div className="text-2xl font-bold">
            {metrics.tasks_completed}
            <span className="text-base font-normal text-muted-foreground">/{metrics.tasks_total}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {metrics.task_completion_pct}% done
            {metrics.tasks_overdue > 0 && (
              <span className="text-amber-600 dark:text-amber-400 inline-flex items-center gap-0.5 ml-1">
                · <AlertTriangle className="h-3 w-3" /> {metrics.tasks_overdue} overdue
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* ── Daily donations sparkline ─────────────────────────── */}
      {metrics.daily_donations.length > 1 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Donations by day</h3>
            <span className="text-xs text-muted-foreground">
              {metrics.daily_donations.length} day{metrics.daily_donations.length === 1 ? '' : 's'} with activity
            </span>
          </div>
          <DonationsBars points={metrics.daily_donations} fmt={fmt} />
        </Card>
      )}

      {/* ── Reach row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Megaphone className="h-4 w-4" /> Social posts
          </div>
          <div className="text-2xl font-bold">
            {metrics.social_posts_published}
            <span className="text-base font-normal text-muted-foreground">/{metrics.social_posts_total}</span>
          </div>
          {metrics.social_by_platform.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {metrics.social_by_platform.map((p) => (
                <Badge key={p.platform} variant="outline" className="text-xs capitalize">
                  {p.platform} · {p.count}
                </Badge>
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

      {/* ── Channels row ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <QrCode className="h-4 w-4" /> QR scans
          </div>
          <div className="text-2xl font-bold">{metrics.qr_scans_total.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {metrics.qr_codes_count > 0
              ? `${metrics.qr_codes_count} QR code${metrics.qr_codes_count === 1 ? '' : 's'} attached · ${metrics.qr_scans_last_30} in last 30 days`
              : 'Tag a QR code with this campaign in the QR Codes app to track scans here.'}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <MessageCircle className="h-4 w-4" /> CRM interactions
          </div>
          <div className="text-2xl font-bold">{metrics.interactions_count}</div>
          {metrics.interactions_by_type.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-2">
              {metrics.interactions_by_type.map((i) => (
                <Badge key={i.type} variant="outline" className="text-xs capitalize">
                  {i.type.replace('_', ' ')} · {i.count}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground mt-1">
              Log calls, meetings, or notes against this campaign in the CRM.
            </div>
          )}
        </Card>
      </div>

      {/* ── Recent donations ──────────────────────────────────── */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3">Recent donations</h3>
        {metrics.recent_donations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No donations attributed yet. Tag donations with this campaign in the CRM to track them here.
          </p>
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

      {!hasAnyData && (
        <Card className="p-6 border-dashed text-center text-sm text-muted-foreground">
          No activity has been attributed to this campaign yet. As you log donations, schedule social posts, attach QR
          codes, and complete tasks tagged with this campaign, they'll roll up here automatically.
        </Card>
      )}
    </div>
  );
}

function DonationsBars({ points, fmt }: { points: DailyPoint[]; fmt: (n: number) => string }) {
  const max = Math.max(...points.map((p) => p.amount), 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {points.map((p) => {
        const h = Math.max(4, Math.round((p.amount / max) * 100));
        const date = new Date(p.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return (
          <div key={p.date} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
            <div
              className="w-full bg-primary/70 hover:bg-primary rounded-sm transition-colors"
              style={{ height: `${h}%` }}
              title={`${date}: ${fmt(p.amount)} (${p.count})`}
            />
            <div className="text-[10px] text-muted-foreground truncate w-full text-center hidden group-hover:block">
              {date}
            </div>
          </div>
        );
      })}
    </div>
  );
}
