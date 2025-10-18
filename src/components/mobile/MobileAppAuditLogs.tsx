import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { format } from "date-fns";
import { Download, FileText, Shield } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";

interface MobileAppAuditLogsProps {
  organizationId: string;
}

interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string;
  action: string;
  table_name: string;
  operation_type: string;
  details: any;
  ip_address: unknown;
  user_agent: string;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  mobile_app_insert: "bg-green-500",
  mobile_app_update: "bg-blue-500",
  mobile_app_delete: "bg-red-500",
  mobile_app_select: "bg-gray-500",
  mobile_app_create_user_with_hash: "bg-purple-500",
};

export function MobileAppAuditLogs({ organizationId }: MobileAppAuditLogsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['mobile-app-audit-logs', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mobile_app_audit_logs')
        .select(`
          *,
          profiles:user_id (display_name)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data;
    },
  });

  const exportToCSV = () => {
    if (!auditLogs || auditLogs.length === 0) {
      toast.error('No logs to export');
      return;
    }

    const csvData = auditLogs.map((log: any) => ({
      Timestamp: format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      Admin: log.profiles?.display_name || 'Unknown',
      Action: log.action,
      Table: log.table_name || 'N/A',
      'Operation Type': log.operation_type || 'N/A',
      'IP Address': log.ip_address || 'N/A',
      Details: JSON.stringify(log.details || {}),
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast.success('Audit logs exported successfully');
  };

  const filteredLogs = auditLogs?.filter((log: any) => {
    const matchesSearch = searchTerm === "" || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.table_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  const uniqueActions = [...new Set(auditLogs?.map((log: any) => log.action) || [])];

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Actions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogs?.filter((log: AuditLog) => {
                const logDate = new Date(log.created_at);
                const today = new Date();
                return logDate.toDateString() === today.toDateString();
              }).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Action Types</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueActions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>View all mobile app data operations</CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          <div className="flex items-center gap-2 pt-4">
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action: string) => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Admin User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Records Affected</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs?.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(log.created_at), 'MMM d, yyyy')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'h:mm:ss a')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {log.profiles?.display_name || 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={ACTION_COLORS[log.action] || 'bg-gray-500'}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono">{log.table_name || 'N/A'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {log.details?.recordsAffected || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground font-mono">
                      {log.ip_address || 'N/A'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
