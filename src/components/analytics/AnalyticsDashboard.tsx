import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, MessageSquare, QrCode, Search, Share2, Calendar } from 'lucide-react';

interface AnalyticsDashboardProps {
  organizationId: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ organizationId }) => {
  const [timeRange, setTimeRange] = useState('7d');

  // Mock data - in real app, this would come from your analytics service
  const trafficData = [
    { date: '2024-09-19', visitors: 1200, pageViews: 3400, conversions: 45 },
    { date: '2024-09-20', visitors: 1350, pageViews: 3800, conversions: 52 },
    { date: '2024-09-21', visitors: 1100, pageViews: 3100, conversions: 38 },
    { date: '2024-09-22', visitors: 1580, pageViews: 4200, conversions: 67 },
    { date: '2024-09-23', visitors: 1420, pageViews: 3900, conversions: 58 },
    { date: '2024-09-24', visitors: 1650, pageViews: 4500, conversions: 72 },
    { date: '2024-09-25', visitors: 1820, pageViews: 4800, conversions: 85 },
  ];

  const moduleUsageData = [
    { name: 'Chatbots', value: 35, color: '#8b5cf6' },
    { name: 'SEO Audits', value: 25, color: '#06b6d4' },
    { name: 'Social Media', value: 20, color: '#10b981' },
    { name: 'QR Codes', value: 15, color: '#f59e0b' },
    { name: 'GBP Management', value: 5, color: '#ef4444' },
  ];

  const performanceMetrics = [
    { metric: 'Avg. Response Time', value: '1.2s', change: '-15%', trend: 'up' },
    { metric: 'Uptime', value: '99.9%', change: '+0.1%', trend: 'up' },
    { metric: 'Error Rate', value: '0.02%', change: '-50%', trend: 'up' },
    { metric: 'Cache Hit Rate', value: '94.5%', change: '+2.3%', trend: 'up' },
  ];

  const channelData = [
    { channel: 'Organic Search', sessions: 4200, conversion: 3.2 },
    { channel: 'Direct', sessions: 3100, conversion: 4.8 },
    { channel: 'Social Media', sessions: 2400, conversion: 2.1 },
    { channel: 'Email', sessions: 1800, conversion: 6.5 },
    { channel: 'Paid Search', sessions: 1200, conversion: 8.3 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor your platform performance and user engagement
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
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

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10,420</div>
            <p className="text-xs text-success">+12.5% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chatbot Interactions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-success">+8.2% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QR Code Scans</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,294</div>
            <p className="text-xs text-success">+23.1% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SEO Score Avg</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
            <p className="text-xs text-success">+5.3% from last period</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="modules">Module Usage</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Overview</CardTitle>
                <CardDescription>Visitors and page views over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="visitors" stroke="#8b5cf6" strokeWidth={2} />
                    <Line type="monotone" dataKey="pageViews" stroke="#06b6d4" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Module Usage Distribution</CardTitle>
                <CardDescription>Usage breakdown by module</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={moduleUsageData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {moduleUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Conversion Tracking</CardTitle>
              <CardDescription>Daily conversions and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="conversions" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>Sessions and conversion rates by channel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {channelData.map((channel, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Share2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{channel.channel}</div>
                        <div className="text-sm text-muted-foreground">{channel.sessions.toLocaleString()} sessions</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{channel.conversion}%</div>
                      <div className="text-sm text-muted-foreground">conversion rate</div>
                    </div>
                  </div>
                ))}
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
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Conversations</span>
                    <span className="font-medium">2,847</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg. Session Length</span>
                    <span className="font-medium">4m 32s</span>
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
                    <span className="text-sm">Audits Completed</span>
                    <span className="font-medium">45</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg. Score</span>
                    <span className="font-medium">87/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Issues Found</span>
                    <span className="font-medium">234</span>
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
                    <span className="font-medium">28</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Scans</span>
                    <span className="font-medium">1,294</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg. Scans/Code</span>
                    <span className="font-medium">46</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {performanceMetrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{metric.metric}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className={`text-xs flex items-center gap-1 ${metric.trend === 'up' ? 'text-success' : 'text-destructive'}`}>
                    <TrendingUp className="h-3 w-3" />
                    {metric.change}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Real-time system performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>API Response Time</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full">
                      <div className="w-3/4 h-2 bg-success rounded-full"></div>
                    </div>
                    <span className="text-sm">1.2s</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Database Performance</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full">
                      <div className="w-5/6 h-2 bg-success rounded-full"></div>
                    </div>
                    <span className="text-sm">98%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Server Load</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full">
                      <div className="w-1/2 h-2 bg-warning rounded-full"></div>
                    </div>
                    <span className="text-sm">52%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;