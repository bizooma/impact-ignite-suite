import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, RefreshCw, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface IntegrationStatusBannerProps {
  integration: {
    id: string;
    status?: string;
    updated_at: string;
  } | null;
  onRefresh?: () => void;
}

export function IntegrationStatusBanner({ integration, onRefresh }: IntegrationStatusBannerProps) {
  const navigate = useNavigate();

  if (!integration) return null;

  const isActive = integration.status === 'active';
  const isError = integration.status === 'error' || integration.status === 'inactive';

  return (
    <Card className={`${
      isActive 
        ? 'border-green-500/20 bg-green-500/5' 
        : 'border-red-500/20 bg-red-500/5'
    }`}>
      <CardContent className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          {isActive ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <div>
            <p className="text-sm font-medium">
              {isActive ? 'Connected: Google Business Profile' : 'Connection Error'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isActive 
                ? `Last synced ${formatDistanceToNow(new Date(integration.updated_at), { addSuffix: true })}`
                : 'Your Google credentials may have expired or been revoked'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isActive && onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/dashboard/integrations')}
          >
            <Settings className="mr-2 h-4 w-4" />
            {isActive ? 'Manage' : 'Reconnect'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
