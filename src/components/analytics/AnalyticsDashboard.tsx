import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Users, MessageSquare, QrCode, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsDashboardProps {
  organizationId: string;
}

type RangeKey = '24h' | '7d' | '30d' | '90d';

const RANGE_DAYS: Record<RangeKey, number> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

interface AnalyticsState {
  loading: boolean;
  totalSessions: number;
  totalMessages: number;
  totalQrScans: number;
  avgSeoScore: number | null;
  activeChatbots: number;
  totalChatbots: number;
  qrCodesCount: number;
  seoAuditsCount: number;
  seoIssuesCount: number;
  gbpReviewsCount: number;
  avgRating: number | null;
  dailyChats: Array<{ date: string; sessions: number; messages: number }>;
  dailyScans: Array<{ date: string; scans: number }>;
  moduleUsage: Array<{ name: string; value: number; color: string }>;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--muted-foreground))', 'hsl(var(--destructive))'];

const formatDate = (d: Date) => d.toISOString().slice(0, 10);

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ organizationId }) => {
  const [timeRange, setTimeRange] = useState<RangeKey>('7d');
  const [state, setState] = useState<AnalyticsState>({
    loading: true,
    totalSessions: 0,
    totalMessages: 0,
    totalQrScans: 0,
    avgSeoScore: null,
    activeChatbots: 0,
    totalChatbots: 0,
    qrCodesCount: 0,
    seoAuditsCount: 0,
    seoIssuesCount: 0,
    gbpReviewsCount: 0,
    avgRating: null,
    dailyChats: [],
    dailyScans: [],
    moduleUsage: [],
  });

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;

    const fetchAnalytics = async () => {
      setState((s) => ({ ...s, loading: true }));

      const days = RANGE_DAYS[timeRange];
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceIso = since.toISOString();

      // Get chatbot ids for this org
      const { data: chatbots } = await supabase
        .from('chatbots')
        .select('id, status')
        .eq('organization_id', organizationId);

      const chatbotIds = (chatbots ?? []).map((c) => c.id);
      const activeChatbots = (chatbots ?? []).filter((c) => c.status === 'active').length;

      // Get qr code ids
      const { data: qrCodes } = await supabase
        .from('qr_codes')
        .select('id')
        .eq('organization_id', organizationId);
      const qrIds = (qrCodes ?? []).map((q) => q.id);

      // Parallel queries
      const [
        sessionsRes,
        messagesRes,
        scansRes,
        auditsRes,
        issuesRes,
        reviewsRes,
      ] = await Promise.all([
        chatbotIds.length
          ? supabase
              .from('chat_sessions')
              .select('id, created_at, chatbot_id')
              .in('chatbot_id', chatbotIds)
              .gte('created_at', sinceIso)
          : Promise.resolve({ data: [] as any[] }),
        chatbotIds.length
          ? supabase
              .from('chat_messages')
              .select('id, created_at, session_id, chat_sessions!inner(chatbot_id)')
              .in('chat_sessions.chatbot_id', chatbotIds)
              .gte('created_at', sinceIso)
          : Promise.resolve({ data: [] as any[] }),
        qrIds.length
          ? supabase
              .from('qr_scans')
              .select('id, scanned_at, qr_code_id')
              .in('qr_code_id', qrIds)
              .gte('scanned_at', sinceIso)
          : Promise.resolve({ data: [] as any[] }),
        supabase
          .from('seo_audits')
          .select('id, overall_score, created_at')
          .eq('organization_id', organizationId)
          .gte('created_at', sinceIso),
        supabase
          .from('seo_audits')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId),
        supabase
          .from('gbp_reviews')
          .select('id, rating, created_at')
          .eq('organization_id', organizationId)
          .gte('created_at', sinceIso),
      ]);

      if (cancelled) return;

      const sessions = (sessionsRes.data ?? []) as any[];
      const messages = (messagesRes.data ?? []) as any[];
      const scans = (scansRes.data ?? []) as any[];
      const audits = (auditsRes.data ?? []) as any[];
      const reviews = (reviewsRes.data ?? []) as any[];

      // Build daily buckets
      const buckets: Record<string, { sessions: number; messages: number; scans: number }> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        buckets[formatDate(d)] = { sessions: 0, messages: 0, scans: 0 };
      }
      sessions.forEach((s) => {
        const k = formatDate(new Date(s.created_at));
        if (buckets[k]) buckets[k].sessions += 1;
      });
      messages.forEach((m) => {
        const k = formatDate(new Date(m.created_at));
        if (buckets[k]) buckets[k].messages += 1;
      });
      scans.forEach((s) => {
        const k = formatDate(new Date(s.scanned_at));
        if (buckets[k]) buckets[k].scans += 1;
      });

      const dailyChats = Object.entries(buckets).map(([date, v]) => ({
        date,
        sessions: v.sessions,
        messages: v.messages,
      }));
      const dailyScans = Object.entries(buckets).map(([date, v]) => ({
        date,
        scans: v.scans,
      }));

      const avgSeoScore =
        audits.length > 0
          ? Math.round(
              audits.reduce((sum, a) => sum + (a.overall_score ?? 0), 0) / audits.length
            )
          : null;
      const avgRating =
        reviews.length > 0
          ? Number(
              (reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length).toFixed(1)
            )
          : null;

      // Module usage: relative activity counts
      const moduleUsage = [
        { name: 'Chatbots', value: sessions.length, color: COLORS[0] },
        { name: 'QR Scans', value: scans.length, color: COLORS[1] },
        { name: 'SEO Audits', value: audits.length, color: COLORS[2] },
        { name: 'GBP Reviews', value: reviews.length, color: COLORS[3] },
      ].filter((m) => m.value > 0);

      setState({
        loading: false,
        totalSessions: sessions.length,
        totalMessages: messages.length,
        totalQrScans: scans.length,
        avgSeoScore,
        activeChatbots,
        totalChatbots: chatbots?.length ?? 0,
        qrCodesCount: qrCodes?.length ?? 0,
        seoAuditsCount: issuesRes.count ?? audits.length,
        seoIssuesCount: 0,
        gbpReviewsCount: reviews.length,
        avgRating,
        dailyChats,
        dailyScans,
        moduleUsage,
      });
    };

    fetchAnalytics();
    return () => {
      cancelled = true;
    };
  }, [organizationId, timeRange]);

  const hasAnyData = useMemo(
    () =>
      state.totalSessions > 0 ||
      state.totalMessages > 0 ||
      state.totalQrScans > 0 ||
      state.avgSeoScore !== null ||
      state.gbpReviewsCount > 0,
    [state]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Live engagement and performance from your organization data
          </p>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as RangeKey)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {state.loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{state.totalSessions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">in selected period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chat Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{state.totalMessages.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">across {state.activeChatbots} active chatbot{state.activeChatbots === 1 ? '' : 's'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">QR Code Scans</CardTitle>
                <QrCode className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{state.totalQrScans.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{state.qrCodesCount} code{state.qrCodesCount === 1 ? '' : 's'} total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SEO Score Avg</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {state.avgSeoScore !== null ? state.avgSeoScore : '—'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {state.avgSeoScore !== null ? 'avg of recent audits' : 'no audits in period'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="modules">Modules</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Chat Activity</CardTitle>
                    <CardDescription>Sessions and messages over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={state.dailyChats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" strokeWidth={2} />
                        <Line type="monotone" dataKey="messages" stroke="hsl(var(--accent))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Module Activity</CardTitle>
                    <CardDescription>Where engagement is happening</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {state.moduleUsage.length === 0 ? (
                      <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                        No activity in selected period
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={state.moduleUsage}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {state.moduleUsage.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>QR Scans Over Time</CardTitle>
                  <CardDescription>Daily scan volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={state.dailyScans}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="scans" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engagement" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Summary</CardTitle>
                  <CardDescription>Period totals across channels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: 'Chat Sessions', value: state.totalSessions },
                      { label: 'Chat Messages', value: state.totalMessages },
                      { label: 'QR Scans', value: state.totalQrScans },
                      { label: 'SEO Audits Run', value: state.dailyChats.length ? null : null },
                      { label: 'GBP Reviews Received', value: state.gbpReviewsCount },
                    ]
                      .filter((r) => r.value !== null)
                      .map((row, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                          <span className="font-medium">{row.label}</span>
                          <span className="text-lg font-bold">{(row.value as number).toLocaleString()}</span>
                        </div>
                      ))}
                    {!hasAnyData && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No engagement data yet for this period.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="modules" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Chatbots
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Active Chatbots</span>
                        <span className="font-medium">{state.activeChatbots}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Chatbots</span>
                        <span className="font-medium">{state.totalChatbots}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Sessions (period)</span>
                        <span className="font-medium">{state.totalSessions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Messages (period)</span>
                        <span className="font-medium">{state.totalMessages}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      SEO Audits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Audits</span>
                        <span className="font-medium">{state.seoAuditsCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Avg. Score</span>
                        <span className="font-medium">
                          {state.avgSeoScore !== null ? `${state.avgSeoScore}/100` : '—'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      QR Codes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Active QR Codes</span>
                        <span className="font-medium">{state.qrCodesCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Scans (period)</span>
                        <span className="font-medium">{state.totalQrScans}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Avg. Scans/Code</span>
                        <span className="font-medium">
                          {state.qrCodesCount > 0
                            ? Math.round(state.totalQrScans / state.qrCodesCount)
                            : 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
