import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSeoAudits } from '@/hooks/useSeoAudits';
import { Search, Globe, AlertTriangle, CheckCircle, Clock, Trash2, RotateCw, Eye, Loader2 } from 'lucide-react';
import { AuditIssuesDialog } from './AuditIssuesDialog';

interface SeoAuditDashboardProps {
  organizationId: string;
}

const SeoAuditDashboard: React.FC<SeoAuditDashboardProps> = ({ organizationId }) => {
  const [domain, setDomain] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [auditIssues, setAuditIssues] = useState<any[]>([]);
  const [showIssuesDialog, setShowIssuesDialog] = useState(false);
  const { audits, loading, createAudit, deleteAudit, retryAudit, getAuditIssues } = useSeoAudits(organizationId);

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setIsCreating(true);
    await createAudit(domain.trim());
    setDomain('');
    setIsCreating(false);
  };

  const handleViewIssues = async (auditId: string) => {
    const issues = await getAuditIssues(auditId);
    setAuditIssues(issues);
    setSelectedAuditId(auditId);
    setShowIssuesDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'running': return 'bg-warning text-warning-foreground';
      case 'error':
      case 'failed': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'running': return <Clock className="h-4 w-4 animate-spin" />;
      case 'error':
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading && audits.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted animate-pulse rounded" />
                  <div className="h-3 bg-muted animate-pulse rounded w-4/5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">SEO Audit Dashboard</h2>
        <p className="text-muted-foreground">
          Analyze your website's SEO performance and get actionable insights
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {audits.map((audit) => (
          <Card key={audit.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <CardTitle className="text-lg truncate">{audit.domain}</CardTitle>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={getStatusColor(audit.status || 'pending')}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(audit.status || 'pending')}
                      {audit.status || 'pending'}
                    </div>
                  </Badge>
                  {audit.status === 'error' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => retryAudit(audit.id, audit.domain)}
                      title="Retry audit"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteAudit(audit.id)}
                    title="Delete audit"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                Started {new Date(audit.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {audit.status === 'error' && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">
                    Audit failed. Please try again or contact support if the issue persists.
                  </p>
                </div>
              )}
              
              {audit.overall_score !== null && audit.overall_score !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Score</span>
                    <span className="font-medium">{audit.overall_score}/100</span>
                  </div>
                  <Progress value={audit.overall_score} className="h-2" />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                {audit.technical_score && (
                  <div>
                    <span className="text-muted-foreground">Technical</span>
                    <div className="font-medium">{audit.technical_score}/100</div>
                  </div>
                )}
                {audit.content_score && (
                  <div>
                    <span className="text-muted-foreground">Content</span>
                    <div className="font-medium">{audit.content_score}/100</div>
                  </div>
                )}
                {audit.schema_score && (
                  <div>
                    <span className="text-muted-foreground">Schema</span>
                    <div className="font-medium">{audit.schema_score}/100</div>
                  </div>
                )}
                {audit.voice_seo_score && (
                  <div>
                    <span className="text-muted-foreground">Voice SEO</span>
                    <div className="font-medium">{audit.voice_seo_score}/100</div>
                  </div>
                )}
              </div>
              
              {audit.pages_crawled > 0 && (
                <div className="text-sm text-muted-foreground">
                  {audit.pages_crawled} pages analyzed
                </div>
              )}

              {audit.status === 'completed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewIssues(audit.id)}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Issues
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {audits.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No audits yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start your first SEO audit to analyze your website's performance
            </p>
          </CardContent>
        </Card>
      )}

      <AuditIssuesDialog
        open={showIssuesDialog}
        onOpenChange={setShowIssuesDialog}
        issues={auditIssues}
        domain={audits.find(a => a.id === selectedAuditId)?.domain || ''}
      />
    </div>
  );
};

export default SeoAuditDashboard;
