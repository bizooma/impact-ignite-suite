import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, Heart, HelpCircle, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Chatbot } from '@/types/database';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ChatbotAnalyticsProps {
  chatbot: Chatbot;
}

function getDays(range: '7d' | '30d' | '90d') {
  return range === '7d' ? 7 : range === '30d' ? 30 : 90;
}

export function ChatbotAnalytics({ chatbot }: ChatbotAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const days = getDays(timeRange);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startIso = startDate.toISOString();

  // Conversations (sessions)
  const { data: conversationStats } = useQuery({
    queryKey: ['chatbot-conversations', chatbot.id, timeRange],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('chatbot_id', chatbot.id)
        .gte('created_at', startIso);
      if (error) throw error;
      return count || 0;
    },
  });

  // Messages exchanged — count chat_messages for this chatbot's sessions
  const { data: messageCount } = useQuery({
    queryKey: ['chatbot-messages', chatbot.id, timeRange],
    queryFn: async () => {
      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('chatbot_id', chatbot.id)
        .gte('created_at', startIso);
      const sessionIds = (sessions || []).map((s) => s.id);
      if (sessionIds.length === 0) return 0;
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .in('session_id', sessionIds);
      if (error) throw error;
      return count || 0;
    },
  });

  // Volunteer submissions captured via this chatbot
  const { data: volunteerStats } = useQuery({
    queryKey: ['chatbot-volunteers', chatbot.id, timeRange],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('volunteers')
        .select('*', { count: 'exact', head: true })
        .eq('chatbot_id', chatbot.id)
        .gte('created_at', startIso);
      if (error) {
        console.error(error);
        return 0;
      }
      return count || 0;
    },
  });

  // Event aggregation
  const { data: eventStats } = useQuery({
    queryKey: ['chatbot-events', chatbot.id, timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chatbot_events')
        .select('event_type, created_at')
        .eq('chatbot_id', chatbot.id)
        .gte('created_at', startIso);
      if (error) throw error;
      const counts = (data || []).reduce((acc, e) => {
        acc[e.event_type] = (acc[e.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return counts;
    },
  });

  const stats = [
    { icon: MessageSquare, label: 'Total Conversations', value: conversationStats || 0 },
    { icon: Users, label: 'Volunteer Submissions', value: volunteerStats || 0 },
    { icon: Heart, label: 'Donation Clicks', value: eventStats?.donate_click || 0 },
    { icon: HelpCircle, label: 'FAQ Opens', value: eventStats?.faq_open || 0 },
  ];

  const handleExport = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_events')
        .select('event_type, event_data, created_at, session_id')
        .eq('chatbot_id', chatbot.id)
        .gte('created_at', startIso)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const rows = data || [];
      const header = ['created_at', 'event_type', 'session_id', 'event_data'];
      const csv = [
        header.join(','),
        ...rows.map((r) =>
          [
            r.created_at,
            r.event_type,
            r.session_id || '',
            `"${JSON.stringify(r.event_data || {}).replace(/"/g, '""')}"`,
          ].join(','),
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chatbot-${chatbot.id}-events-${timeRange}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${rows.length} events`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to export events');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Track your chatbot's performance and user engagement
          </p>
        </div>
        <div className="flex gap-2">
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <TabsList>
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="90d">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-1">{stat.value}</h3>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Overview</CardTitle>
              <CardDescription>
                Key metrics for chatbot performance over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Chat Sessions</span>
                  <span className="text-2xl font-bold text-primary">{conversationStats || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Messages Exchanged</span>
                  <span className="text-2xl font-bold text-primary">{messageCount || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Avg. Messages per Session</span>
                  <span className="text-2xl font-bold text-primary">
                    {conversationStats && conversationStats > 0
                      ? ((messageCount || 0) / conversationStats).toFixed(1)
                      : '0'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Breakdown</CardTitle>
              <CardDescription>Detailed view of all tracked events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(eventStats || {}).map(([eventType, count]) => (
                  <div key={eventType} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <span className="text-sm font-medium capitalize">{eventType.replace(/_/g, ' ')}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
                {(!eventStats || Object.keys(eventStats).length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No events tracked yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
