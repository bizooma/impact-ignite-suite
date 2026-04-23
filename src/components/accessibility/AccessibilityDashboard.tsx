import { useAccessibilitySites } from '@/hooks/useAccessibilitySites';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, TrendingUp, AlertTriangle, Clock, Info, Accessibility } from 'lucide-react';
import { AddSiteDialog } from './AddSiteDialog';
import { SiteCard } from './SiteCard';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  organizationId: string;
}

export function AccessibilityDashboard({ organizationId }: Props) {
  const { sites, loading, createSite } = useAccessibilitySites(organizationId);

  const totalSites = sites.length;
  const scoredSites = sites.filter((s) => s.latest_score !== null && s.latest_score !== undefined);
  const avgScore = scoredSites.length
    ? Math.round(scoredSites.reduce((acc, s) => acc + (s.latest_score || 0), 0) / scoredSites.length)
    : null;
  const totalIssues = sites.reduce((acc, s) => acc + (s.open_issues || 0), 0);
  const lastScan = sites
    .map((s) => s.latest_scan_at)
    .filter(Boolean)
    .sort()
    .pop();

  const handleCreate = async (domain: string, businessName?: string) => {
    const site = await createSite(domain, businessName);
    return site ? { id: site.id, site_id: site.site_id } : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Accessibility className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-bold">Accessibility</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Accessibility Enhancement System — ongoing monitoring and usability improvements for your websites.
          </p>
        </div>
        <AddSiteDialog onCreate={handleCreate} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Globe} label="Connected Sites" value={String(totalSites)} />
        <MetricCard icon={TrendingUp} label="Avg. Accessibility Score" value={avgScore !== null ? String(avgScore) : '—'} />
        <MetricCard icon={AlertTriangle} label="Total Open Issues" value={String(totalIssues)} />
        <MetricCard
          icon={Clock}
          label="Last Scan"
          value={lastScan ? formatDistanceToNow(new Date(lastScan), { addSuffix: true }) : 'Never'}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Your Websites</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : sites.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <Globe className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-1">No websites yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first website to start monitoring accessibility.
              </p>
              <AddSiteDialog onCreate={handleCreate} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sites.map((s) => <SiteCard key={s.id} site={s} />)}
          </div>
        )}
      </div>

      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription className="text-xs">
          The Accessibility Layer is a usability and risk-reduction tool that helps you identify and address common accessibility issues. It is not a guarantee of legal compliance with any specific accessibility standard or regulation.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold truncate">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
