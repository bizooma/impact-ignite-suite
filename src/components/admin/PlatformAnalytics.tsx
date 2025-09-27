import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Building2, Activity } from 'lucide-react';

export function PlatformAnalytics() {
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
              <div className="text-2xl font-bold">1,234</div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+12.5%</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Organizations</span>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">89</div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+8.2%</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monthly Activity</span>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">45.2K</div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+25.1%</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              User growth chart would be implemented here
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Chatbots</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">85%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">QR Codes</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '72%' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">72%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Social Media</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">68%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">SEO Audits</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">45%</span>
                </div>
              </div>
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
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="text-sm font-medium">New organization created</p>
                <p className="text-xs text-muted-foreground">Acme Corp registered 2 hours ago</p>
              </div>
              <span className="text-xs text-muted-foreground">2h ago</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="text-sm font-medium">User upgrade to Pro plan</p>
                <p className="text-xs text-muted-foreground">john@example.com upgraded their subscription</p>
              </div>
              <span className="text-xs text-muted-foreground">4h ago</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="text-sm font-medium">High API usage detected</p>
                <p className="text-xs text-muted-foreground">TechStart Inc. exceeded 80% of their API quota</p>
              </div>
              <span className="text-xs text-muted-foreground">6h ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}