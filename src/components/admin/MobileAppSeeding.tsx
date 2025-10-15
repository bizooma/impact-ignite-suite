import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Smartphone, CheckCircle, XCircle, Link2 } from 'lucide-react';
import { toast } from 'sonner';

export function MobileAppSeeding() {
  const [addDialog, setAddDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedDb, setSelectedDb] = useState<any>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [formData, setFormData] = useState({
    orgCode: '',
    databaseName: '',
    supabaseUrl: '',
    anonKey: '',
    serviceKey: '',
  });

  const queryClient = useQueryClient();

  // Fetch all organizations
  const { data: organizations } = useQuery({
    queryKey: ['admin-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, mobile_app_code')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

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

  // Assign organization mutation
  const assignMutation = useMutation({
    mutationFn: async ({ dbId, orgId, orgCode }: { dbId: string; orgId: string; orgCode: string }) => {
      // Update mobile_app_databases
      const { error: dbError } = await supabase
        .from('mobile_app_databases')
        .update({ organization_id: orgId })
        .eq('id', dbId);

      if (dbError) throw dbError;

      // Update organization with mobile app code
      const { error: orgError } = await supabase
        .from('organizations')
        .update({ mobile_app_code: orgCode })
        .eq('id', orgId);

      if (orgError) throw orgError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mobile-app-databases'] });
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      setAssignDialog(false);
      setSelectedDb(null);
      setSelectedOrgId('');
      toast.success('Organization assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign organization');
    },
  });

  const handleAssignClick = (db: any) => {
    setSelectedDb(db);
    setAssignDialog(true);
  };

  const handleAssign = () => {
    if (!selectedOrgId) {
      toast.error('Please select an organization');
      return;
    }
    assignMutation.mutate({
      dbId: selectedDb.id,
      orgId: selectedOrgId,
      orgCode: selectedDb.organization_code,
    });
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
                  <TableHead>Actions</TableHead>
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
                    <TableCell>
                      {!db.organization_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignClick(db)}
                        >
                          <Link2 className="h-4 w-4 mr-2" />
                          Assign
                        </Button>
                      )}
                    </TableCell>
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

      {/* Assign Organization Dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Organization</DialogTitle>
            <DialogDescription>
              Link this mobile app database to an organization
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedDb && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Database Configuration</p>
                <p className="text-xs text-muted-foreground">Code: {selectedDb.organization_code}</p>
                <p className="text-xs text-muted-foreground">Name: {selectedDb.database_name}</p>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="organization">Select Organization</Label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations?.filter(org => !org.mobile_app_code).map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name} (@{org.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {organizations?.filter(org => !org.mobile_app_code).length === 0 && (
                <p className="text-xs text-muted-foreground">
                  All organizations already have mobile apps assigned
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={assignMutation.isPending || !selectedOrgId}>
              Assign Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
