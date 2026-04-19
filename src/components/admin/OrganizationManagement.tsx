import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Building2, Users, Eye, Settings, UserPlus, LogIn } from 'lucide-react';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CreateOrganizationDialog } from './CreateOrganizationDialog';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string;
  website: string;
  created_at: string;
  member_count: number;
  owner_name: string;
}

export function OrganizationManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { logAdminAction } = usePlatformAdmin();
  const { user } = useAuth();
  const { organizations: myOrgs, switchOrganization } = useOrganization();
  const navigate = useNavigate();

  const isMember = (orgId: string) => myOrgs.some((o) => o.id === orgId);

  const handleAddSelfAsOwner = async (orgId: string) => {
    if (!user) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('memberships')
        .insert({ user_id: user.id, organization_id: orgId, role: 'owner' });
      if (error && !/(duplicate|unique)/i.test(error.message)) throw error;
      await logAdminAction('add_self_as_owner', 'organization', orgId);
      toast.success(error ? 'Already a member — reloading…' : 'Added you as owner. Reloading…');
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to add membership');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnterOrg = async (orgId: string) => {
    await logAdminAction('enter_organization', 'organization', orgId);
    switchOrganization(orgId);
    setDialogOpen(false);
    toast.success('Switched organization');
    navigate('/dashboard');
  };

  const handleManageMobileSettings = async (orgId: string) => {
    await logAdminAction('open_mobile_settings', 'organization', orgId);
    switchOrganization(orgId);
    setDialogOpen(false);
    navigate('/mobile-content');
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          slug,
          description,
          website,
          created_at
        `);

      if (error) throw error;

      // Get member counts and owner info for each organization
      const orgsWithDetails = await Promise.all(
        data.map(async (org) => {
          // Get member count
          const { count } = await supabase
            .from('memberships')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id);

          // Get owner info
          const { data: ownerMembership } = await supabase
            .from('memberships')
            .select(`
              user_id
            `)
            .eq('organization_id', org.id)
            .eq('role', 'owner')
            .single();

          let ownerName = 'Unknown';
          if (ownerMembership) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', ownerMembership.user_id)
              .single();
            
            ownerName = profile?.display_name || 'Unknown';
          }

          return {
            ...org,
            member_count: count || 0,
            owner_name: ownerName
          };
        })
      );

      setOrganizations(orgsWithDetails);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrganizations = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewOrganization = async (orgId: string) => {
    await logAdminAction('view_organization', 'organization', orgId);
    // In a real implementation, you might navigate to a detailed org view
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Organization Management</span>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <CreateOrganizationDialog onCreated={fetchOrganizations} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading organizations...
                </TableCell>
              </TableRow>
            ) : filteredOrganizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No organizations found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrganizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{org.name}</p>
                      {org.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-48">
                          {org.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{org.slug}</Badge>
                  </TableCell>
                  <TableCell>{org.owner_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {org.member_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    {org.website ? (
                      <a 
                        href={org.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {org.website}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(org.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Dialog open={dialogOpen && selectedOrg?.id === org.id} onOpenChange={(o) => { setDialogOpen(o); if (!o) setSelectedOrg(null); }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setSelectedOrg(org); setDialogOpen(true); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Organization Details</DialogTitle>
                          </DialogHeader>
                          {selectedOrg && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Organization Name</label>
                                  <p className="text-sm text-muted-foreground">{selectedOrg.name}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Slug</label>
                                  <p className="text-sm text-muted-foreground">{selectedOrg.slug}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Owner</label>
                                  <p className="text-sm text-muted-foreground">{selectedOrg.owner_name}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Members</label>
                                  <p className="text-sm text-muted-foreground">{selectedOrg.member_count}</p>
                                </div>
                              </div>
                              
                              {selectedOrg.description && (
                                <div>
                                  <label className="text-sm font-medium">Description</label>
                                  <p className="text-sm text-muted-foreground">{selectedOrg.description}</p>
                                </div>
                              )}

                              {selectedOrg.website && (
                                <div>
                                  <label className="text-sm font-medium">Website</label>
                                  <p className="text-sm text-muted-foreground">
                                    <a 
                                      href={selectedOrg.website} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      {selectedOrg.website}
                                    </a>
                                  </p>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2 pt-4">
                                {isMember(selectedOrg.id) ? (
                                  <>
                                    <Button onClick={() => handleEnterOrg(selectedOrg.id)}>
                                      <LogIn className="h-4 w-4 mr-2" />
                                      Enter Organization
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => handleManageMobileSettings(selectedOrg.id)}
                                    >
                                      <Settings className="h-4 w-4 mr-2" />
                                      Mobile API Settings
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    onClick={() => handleAddSelfAsOwner(selectedOrg.id)}
                                    disabled={actionLoading}
                                  >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    {actionLoading ? 'Adding…' : 'Add me as owner'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
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