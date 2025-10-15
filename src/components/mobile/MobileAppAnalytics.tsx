import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, BarChart3 } from 'lucide-react';

interface MobileAppAnalyticsProps {
  organizationId: string;
}

export function MobileAppAnalytics({ organizationId }: MobileAppAnalyticsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Usage Analytics
          </CardTitle>
          <CardDescription>
            View analytics and usage statistics for your mobile app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Analytics dashboard coming soon</p>
              <p className="text-sm mt-2">Track user activity, API calls, and data operations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
