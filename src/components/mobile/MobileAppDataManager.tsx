import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMobileAppData } from '@/hooks/useMobileAppData';
import { Search, Database, RefreshCw } from 'lucide-react';
import { MobileAppDataTable } from './MobileAppDataTable';
import { toast } from 'sonner';

interface MobileAppDataManagerProps {
  organizationId: string;
}

export function MobileAppDataManager({ organizationId }: MobileAppDataManagerProps) {
  const [tableName, setTableName] = useState('');
  const [currentTable, setCurrentTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { fetchTableData, isActive } = useMobileAppData(organizationId);

  const handleLoadTable = async () => {
    if (!tableName.trim()) {
      toast.error('Please enter a table name');
      return;
    }

    setLoading(true);
    try {
      const result = await fetchTableData(tableName.trim(), {
        limit: 100,
      });
      
      setTableData(result.data || []);
      setCurrentTable(tableName.trim());
      
      if (!result.data || result.data.length === 0) {
        toast.info('Table is empty or does not exist');
      } else {
        toast.success(`Loaded ${result.data.length} records from ${tableName}`);
      }
    } catch (error: any) {
      console.error('Error loading table:', error);
      toast.error(error.message || 'Failed to load table data');
      setTableData([]);
      setCurrentTable(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (currentTable) {
      const temp = currentTable;
      setTableName(temp);
      handleLoadTable();
    }
  };

  if (!isActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mobile App Database Inactive</CardTitle>
          <CardDescription>
            The mobile app database connection is currently inactive. Please contact support.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Manager
          </CardTitle>
          <CardDescription>
            Query and manage data from your mobile app database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter table name (e.g., users, posts, comments)"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLoadTable()}
              />
            </div>
            <Button onClick={handleLoadTable} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Load Table
                </>
              )}
            </Button>
            {currentTable && (
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>

          {currentTable && (
            <div className="mt-4 text-sm text-muted-foreground">
              Viewing table: <span className="font-mono font-medium">{currentTable}</span>
              {tableData.length > 0 && ` (${tableData.length} records)`}
            </div>
          )}
        </CardContent>
      </Card>

      {currentTable && tableData.length > 0 && (
        <MobileAppDataTable
          organizationId={organizationId}
          tableName={currentTable}
          data={tableData}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
