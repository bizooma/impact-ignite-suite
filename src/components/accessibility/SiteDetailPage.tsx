import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Globe, RefreshCw, Printer, CheckCircle2 } from 'lucide-react';
import { useAccessibilitySites, type AccessibilitySite } from '@/hooks/useAccessibilitySites';
import { useAccessibilityScans } from '@/hooks/useAccessibilityScans';
import { ScoreBadge } from './ScoreBadge';
import { InstallSnippet } from './InstallSnippet';
import { SiteIssuesList } from './SiteIssuesList';
import { SiteSettingsPanel } from './SiteSettingsPanel';
import { SiteStatementPanel } from './SiteStatementPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  organizationId: string;
}

export function SiteDetailPage({ organizationId }: Props) {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { getSite } = useAccessibilitySites(organizationId);
  const { latestScan, issues, loading, scanning, runScan } = useAccessibilityScans(siteId);
  const [site, setSite] = useState<AccessibilitySite | null>(null);

  useEffect(() => {
    if (siteId) getSite(siteId).then(setSite);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  if (!site) return <Skeleton className="h-96" />;

  const summary = (latestScan?.summary || {}) as Record<string, number>;
  const summaryItems = [
    { label: 'images missing alt text', key: 'image' },
    { label: 'form fields missing labels', key: 'form' },
    { label: 'heading structure issues', key: 'heading' },
    { label: 'page structure issues', key: 'structure' },
    { label: 'empty links or buttons', key: 'link' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/accessibility')} className="mb-2 -ml-3">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to sites
          </Button>
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{site.business_name || site.domain}</h1>
              <p className="text-sm text-muted-foreground">{site.domain}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Report
          </Button>
          <Button onClick={runScan} disabled={scanning}>
            <RefreshCw className={`w-4 h-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scanning…' : 'Scan Site'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">Issues {issues.length > 0 && <Badge variant="secondary" className="ml-2">{issues.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="statement">Statement</TabsTrigger>
          <TabsTrigger value="install">Install</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-6">
              {loading ? (
                <Skeleton className="h-32" />
              ) : (
                <div className="flex items-start gap-6 flex-wrap">
                  <div className="flex flex-col items-center gap-2">
                    <ScoreBadge score={latestScan?.score ?? null} size="lg" />
                    <p className="text-xs text-muted-foreground">Accessibility score</p>
                  </div>
                  <div className="flex-1 min-w-[200px] space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Issues found</span>
                      <span className="font-medium">{issues.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pages scanned</span>
                      <span className="font-medium">{latestScan?.pages_scanned ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last scan</span>
                      <span className="font-medium">
                        {latestScan ? formatDistanceToNow(new Date(latestScan.created_at), { addSuffix: true }) : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {latestScan && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-3">Quick summary</h3>
                <ul className="space-y-1.5 text-sm">
                  {summaryItems.map((s) => {
                    const count = summary[s.key] || 0;
                    return (
                      <li key={s.key} className="flex justify-between">
                        <span className="text-muted-foreground">{s.label}</span>
                        <span className={`font-medium ${count > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{count}</span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {!latestScan && !loading && (
            <Card>
              <CardContent className="p-10 text-center">
                <RefreshCw className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">No scans yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Run your first scan to see the current accessibility status of {site.domain}.</p>
                <Button onClick={runScan} disabled={scanning}>
                  {scanning ? 'Scanning…' : 'Scan Site'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="issues" className="mt-4">
          {loading ? <Skeleton className="h-64" /> : <SiteIssuesList issues={issues} />}
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <SiteSettingsPanel siteId={site.id} />
        </TabsContent>

        <TabsContent value="statement" className="mt-4">
          <SiteStatementPanel siteId={site.id} domain={site.domain} businessName={site.business_name} />
        </TabsContent>

        <TabsContent value="install" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium">Accessibility Layer ready</span>
              </div>
              <InstallSnippet siteId={site.site_id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
