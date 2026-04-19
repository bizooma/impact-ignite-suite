import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface AuditIssue {
  id: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  issue: string;
  recommendation: string;
}

interface AuditIssuesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issues: AuditIssue[];
  domain: string;
}

export function AuditIssuesDialog({ open, onOpenChange, issues, domain }: AuditIssuesDialogProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Info className="h-4 w-4 text-info" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const groupedIssues = issues.reduce((acc, issue) => {
    if (!acc[issue.severity]) {
      acc[issue.severity] = [];
    }
    acc[issue.severity].push(issue);
    return acc;
  }, {} as Record<string, AuditIssue[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0 bg-background flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-background sticky top-0 z-10">
          <DialogTitle>SEO Audit Results for {domain}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto px-6 pb-6 pt-4">
        
        <div className="space-y-6 bg-background">
          {/* High Severity Issues */}
          {groupedIssues.high && groupedIssues.high.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <h3 className="text-lg font-semibold">High Priority Issues ({groupedIssues.high.length})</h3>
              </div>
              {groupedIssues.high.map((issue) => (
                <Card key={issue.id} className="border-destructive/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{issue.issue}</CardTitle>
                      <Badge variant={getSeverityColor(issue.severity) as any}>
                        {issue.severity}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">{issue.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{issue.recommendation}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Medium Severity Issues */}
          {groupedIssues.medium && groupedIssues.medium.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <h3 className="text-lg font-semibold">Medium Priority Issues ({groupedIssues.medium.length})</h3>
              </div>
              {groupedIssues.medium.map((issue) => (
                <Card key={issue.id} className="border-warning/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{issue.issue}</CardTitle>
                      <Badge variant={getSeverityColor(issue.severity) as any}>
                        {issue.severity}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">{issue.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{issue.recommendation}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Low Severity Issues */}
          {groupedIssues.low && groupedIssues.low.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-info" />
                <h3 className="text-lg font-semibold">Low Priority Issues ({groupedIssues.low.length})</h3>
              </div>
              {groupedIssues.low.map((issue) => (
                <Card key={issue.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{issue.issue}</CardTitle>
                      <Badge variant={getSeverityColor(issue.severity) as any}>
                        {issue.severity}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">{issue.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{issue.recommendation}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {issues.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No issues found! Your site looks great.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
