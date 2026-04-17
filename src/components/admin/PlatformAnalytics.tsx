import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, TrendingDown, Users, Building2, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface PlatformStats {
  totalUsers: number;
  userGrowthPct: number;
  totalOrganizations: number;
  orgGrowthPct: number;
  activeSessions: number;
}

interface FeatureRow { name: string; count: number; percentage: number }
interface GrowthPoint { month: string; users: number }
interface ActivityRow {
  id: string;
  action: string;
  target_type: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const invoke = async <T,>(action: string): Promise<T | null> => {
  const { data, error } = await supabase.functions.invoke('admin-actions', { body: { action } });
  if (error) {
    console.error(`admin-actions ${action} failed`, error);
    return null;
  }
  return (data?.data as T) ?? null;
};

const formatPct = (n: number) => `${n >= 0 ? '+' : ''}${n}%`;
const humanizeAction = (a: string) =>
  a.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function PlatformAnalytics() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [growth, setGrowth] = useState<GrowthPoint[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, f, g, a] = await Promise.all([
        invoke<PlatformStats>('platform_stats'),
        invoke<{ features: FeatureRow[] }>('feature_usage'),
        invoke<GrowthPoint[]>('user_growth'),
        invoke<ActivityRow[]>('recent_activity'),
      ]);
      if (s) setStats(s);
      if (f) setFeatures(f.features);
      if (g) setGrowth(g);
      if (a) setActivity(a);
      setLoading(false);
    })();
  }, []);

  const monthlyActivity = activity.length; // simple proxy; can be expanded

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Platform Analytics Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Users</span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {loading ? '—' : (stats?.totalUsers ?? 0).toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-sm">
                {(stats?.userGrowthPct ?? 0) >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span className={(stats?.userGrowthPct ?? 0) >= 0 ? 'text-green-600' : 'text-destructive'}>
                  {formatPct(stats?.userGrowthPct ?? 0)}
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Organizations</span>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {loading ? '—' : (stats?.totalOrganizations ?? 0).toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-sm">
                {(stats?.orgGrowthPct ?? 0) >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span className={(stats?.orgGrowthPct ?? 0) >= 0 ? 'text-green-600' : 'text-destructive'}>
                  {formatPct(stats?.orgGrowthPct ?? 0)}
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Recent Admin Actions</span>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {loading ? '—' : monthlyActivity.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">From audit log</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Growth (last 6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {loading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Loading…
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis allowDecimals={false} className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : features.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet</p>
              ) : (
                features.map((f) => (
                  <div key={f.name} className="flex items-center justify-between">
                    <span className="text-sm">{f.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${f.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-10 text-right">{f.count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent admin activity</p>
            ) : (
              activity.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{humanizeAction(a.action)}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.target_type ? `Target: ${a.target_type}` : 'System action'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
