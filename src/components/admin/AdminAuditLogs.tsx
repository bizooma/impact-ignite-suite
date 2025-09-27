import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, FileText, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: any;
  created_at: string;
  admin_name: string;
}

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select(`
          id,
          admin_user_id,
          action,
          target_type,
          target_id,
          details,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get admin names for each log
      const logsWithNames = await Promise.all(
        data.map(async (log) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', log.admin_user_id)
            .single();

          return {
            ...log,
            admin_name: profile?.display_name || 'Unknown Admin'
          };
        })
      );

      setLogs(logsWithNames);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.admin_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionBadgeColor = (action: string) => {
    if (action.includes('create') || action.includes('grant')) return 'default';
    if (action.includes('delete') || action.includes('suspend')) return 'destructive';
    if (action.includes('update') || action.includes('modify')) return 'secondary';
    return 'outline';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span>Admin Audit Logs</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    Loading audit logs...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(log.created_at).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.admin_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeColor(log.action)}>
                      {log.action.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.target_type && (
                      <div className="text-sm">
                        <div className="font-medium">{log.target_type}</div>
                        {log.target_id && (
                          <div className="text-xs text-muted-foreground font-mono">
                            {log.target_id.substring(0, 8)}...
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="text-xs text-muted-foreground max-w-48">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(log.details, null, 2).substring(0, 100)}
                          {JSON.stringify(log.details, null, 2).length > 100 && '...'}
                        </pre>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}