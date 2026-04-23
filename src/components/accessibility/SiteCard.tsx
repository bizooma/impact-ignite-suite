import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, ArrowRight, AlertCircle } from 'lucide-react';
import { ScoreBadge } from './ScoreBadge';
import { formatDistanceToNow } from 'date-fns';
import type { AccessibilitySite } from '@/hooks/useAccessibilitySites';
import { useNavigate } from 'react-router-dom';

interface Props {
  site: AccessibilitySite;
}

export function SiteCard({ site }: Props) {
  const navigate = useNavigate();
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="rounded-lg bg-primary/10 p-2 shrink-0">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">{site.business_name || site.domain}</h3>
              <p className="text-xs text-muted-foreground truncate">{site.domain}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {site.open_issues ?? 0} issues
                </span>
                <span>
                  {site.latest_scan_at
                    ? `Scanned ${formatDistanceToNow(new Date(site.latest_scan_at), { addSuffix: true })}`
                    : 'Never scanned'}
                </span>
              </div>
            </div>
          </div>
          <ScoreBadge score={site.latest_score} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-4 w-full justify-between"
          onClick={() => navigate(`/dashboard/accessibility/${site.id}`)}
        >
          View site
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
