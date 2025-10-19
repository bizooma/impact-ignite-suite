import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Users, 
  Heart, 
  HelpCircle,
  TrendingUp,
  Calendar,
  Download
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Chatbot } from '@/types/database';
import { Button } from '@/components/ui/button';

interface ChatbotAnalyticsProps {
  chatbot: Chatbot;
}

export function ChatbotAnalytics({ chatbot }: ChatbotAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Fetch conversation stats
  const { data: conversationStats } = useQuery({
    queryKey: ['chatbot-conversations', chatbot.id, timeRange],
    queryFn: async () => {
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { count, error } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('chatbot_id', chatbot.id)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch volunteer submissions
  const { data: volunteerStats } = useQuery({
    queryKey: ['chatbot-volunteers', chatbot.id, timeRange],
    queryFn: async () => {
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { count, error } = await supabase
        .from('volunteers')
        .select('*', { count: 'exact', head: true })
        .eq('chatbot_id', chatbot.id)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch event analytics
  const { data: eventStats } = useQuery({
    queryKey: ['chatbot-events', chatbot.id, timeRange],
    queryFn: async () => {
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('chatbot_events')
        .select('event_type')
        .eq('chatbot_id', chatbot.id)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Count events by type
      const eventCounts = data.reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return eventCounts;
    },
  });

  const stats = [
    {
      icon: MessageSquare,
      label: 'Total Conversations',
      value: conversationStats || 0,
      change: '+12%',
      trend: 'up' as const,
    },
    {
      icon: Users,
      label: 'Volunteer Submissions',
      value: volunteerStats || 0,
      change: '+8%',
      trend: 'up' as const,
    },
    {
      icon: Heart,
      label: 'Donation Clicks',
      value: eventStats?.donate_click || 0,
      change: '+15%',
      trend: 'up' as const,
    },
    {
      icon: HelpCircle,
      label: 'FAQ Opens',
      value: eventStats?.faq_open || 0,
      change: '+5%',
      trend: 'up' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <Badge variant={stat.trend === 'up' ? 'success' : 'secondary'} className="gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </Badge>
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-1">{stat.value}</h3>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
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
                  <span className="text-2xl font-bold text-primary">
                    {(eventStats?.message_sent || 0) * 2}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Avg. Session Duration</span>
                  <span className="text-2xl font-bold text-primary">3.2 min</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Breakdown</CardTitle>
              <CardDescription>
                Detailed view of all tracked events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(eventStats || {}).map(([eventType, count]) => (
                  <div key={eventType} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <span className="text-sm font-medium capitalize">
                      {eventType.replace(/_/g, ' ')}
                    </span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
                {(!eventStats || Object.keys(eventStats).length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No events tracked yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volunteers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Volunteer Submissions</CardTitle>
              <CardDescription>
                Recent volunteer form submissions from your chatbot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {volunteerStats || 0} Volunteers
                </h3>
                <p className="text-muted-foreground">
                  View detailed volunteer list in the Volunteers section
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
