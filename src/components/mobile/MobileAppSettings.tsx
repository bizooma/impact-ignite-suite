import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, AlertCircle } from 'lucide-react';

interface MobileAppSettingsProps {
  organizationId: string;
  dbConfig: any;
}

export function MobileAppSettings({ organizationId, dbConfig }: MobileAppSettingsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Connection Settings
          </CardTitle>
          <CardDescription>
            Mobile app database connection configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Database Name</p>
                <p className="font-medium">{dbConfig?.database_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Organization Code</p>
                <p className="font-mono font-medium">{dbConfig?.organization_code}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Status</p>
                <Badge variant={dbConfig?.is_active ? 'default' : 'secondary'}>
                  {dbConfig?.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground mb-1 text-sm">Supabase URL</p>
              <p className="font-mono text-sm bg-muted p-2 rounded">{dbConfig?.supabase_url}</p>
            </div>

            <div>
              <p className="text-muted-foreground mb-1 text-sm">Created At</p>
              <p className="text-sm">{new Date(dbConfig?.created_at).toLocaleString()}</p>
            </div>

            <div>
              <p className="text-muted-foreground mb-1 text-sm">Last Updated</p>
              <p className="text-sm">{new Date(dbConfig?.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Important Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            <strong>Security:</strong> All data operations are securely proxied through edge functions. 
            Your database credentials are never exposed to the client.
          </p>
          <p className="text-muted-foreground">
            <strong>Access Control:</strong> Only organization admins and owners can access the mobile app management interface.
          </p>
          <p className="text-muted-foreground">
            <strong>Support:</strong> If you need to change your database connection or organization code, 
            please contact your platform administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
