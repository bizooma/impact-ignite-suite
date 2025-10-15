import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Smartphone, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export function MobileAppSeeding() {
  const [addDialog, setAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    orgCode: '',
    databaseName: '',
    supabaseUrl: '',
    anonKey: '',
    serviceKey: '',
  });

  const queryClient = useQueryClient();

  // Fetch all mobile app databases
  const { data: databases, isLoading } = useQuery({
    queryKey: ['admin-mobile-app-databases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mobile_app_databases')
        .select(`
          *,
          organizations (
            id,
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Add new mobile app database
  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Create the database configuration record
      const { error } = await supabase
        .from('mobile_app_databases')
        .insert([{
          organization_code: data.orgCode,
          database_name: data.databaseName,
          supabase_url: data.supabaseUrl,
          is_active: true,
          organization_id: null as any,
          metadata: {
            configured_at: new Date().toISOString(),
          }
        }]);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mobile-app-databases'] });
      setAddDialog(false);
      setFormData({
        orgCode: '',
        databaseName: '',
        supabaseUrl: '',
        anonKey: '',
        serviceKey: '',
      });
      toast.success('Mobile app database configuration created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create configuration');
    },
  });

  const generateCode = () => {
    const code = `MA${Date.now().toString(36).toUpperCase()}`;
    setFormData({ ...formData, orgCode: code });
  };

  const handleSubmit = () => {
    if (!formData.orgCode || !formData.databaseName || !formData.supabaseUrl) {
      toast.error('Please fill in all required fields');
      return;
    }
    addMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            Mobile App Database Seeding
          </h2>
          <p className="text-muted-foreground">
            Configure mobile app database connections for organizations
          </p>
        </div>
        <Button onClick={() => setAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Configuration
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Mobile App Databases</CardTitle>
          <CardDescription>
            Manage all mobile app database connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : databases && databases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Org Code</TableHead>
                  <TableHead>Database Name</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Synced</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {databases.map((db: any) => (
                  <TableRow key={db.id}>
                    <TableCell className="font-mono font-medium">{db.organization_code}</TableCell>
                    <TableCell>{db.database_name}</TableCell>
                    <TableCell>
                      {db.organizations ? (
                        <div>
                          <p className="font-medium">{db.organizations.name}</p>
                          <p className="text-xs text-muted-foreground">@{db.organizations.slug}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={db.is_active ? 'default' : 'secondary'}>
                        {db.is_active ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {db.last_synced_at 
                        ? new Date(db.last_synced_at).toLocaleString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>{new Date(db.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No mobile app databases configured yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Configuration Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Mobile App Database Configuration</DialogTitle>
            <DialogDescription>
              Create a new mobile app database configuration with an organization code
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="orgCode">Organization Code *</Label>
              <div className="flex gap-2">
                <Input
                  id="orgCode"
                  value={formData.orgCode}
                  onChange={(e) => setFormData({ ...formData, orgCode: e.target.value })}
                  placeholder="e.g., MA123ABC"
                  className="font-mono"
                />
                <Button variant="outline" onClick={generateCode}>
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This code will be used to link organizations to this database
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="databaseName">Database Name *</Label>
              <Input
                id="databaseName"
                value={formData.databaseName}
                onChange={(e) => setFormData({ ...formData, databaseName: e.target.value })}
                placeholder="e.g., Client Mobile App Production"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="supabaseUrl">Supabase URL *</Label>
              <Input
                id="supabaseUrl"
                value={formData.supabaseUrl}
                onChange={(e) => setFormData({ ...formData, supabaseUrl: e.target.value })}
                placeholder="https://xxxxx.supabase.co"
                className="font-mono"
              />
            </div>

            <div className="border-t pt-4 mt-2">
              <p className="text-sm font-medium mb-2">After creating this configuration:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Add the database credentials as Supabase Secrets</li>
                <li>Activate the configuration by setting is_active to true</li>
                <li>Share the organization code with the client</li>
              </ol>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={addMutation.isPending}>
              Create Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
