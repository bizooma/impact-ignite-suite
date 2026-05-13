import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Plus } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface DashboardLayoutProps {
  children: (organizationId: string) => React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { organization, organizations, loading, createOrganization } = useOrganization();
  const { user } = useAuth();
  const pendingOrgName = (user as any)?.user_metadata?.organization_name as string | undefined;
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [mobileAppCode, setMobileAppCode] = useState('');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your organization...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to Causeio</CardTitle>
            <p className="text-muted-foreground">
              Create your first organization to get started with our mission-driven platform.
            </p>
          </CardHeader>
          <CardContent>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Organization
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={newOrgName}
                      onChange={(e) => {
                        setNewOrgName(e.target.value);
                        setNewOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                      }}
                      placeholder="My Nonprofit Organization"
                    />
                  </div>
                  <div>
                    <Label htmlFor="orgSlug">Organization Slug</Label>
                    <Input
                      id="orgSlug"
                      value={newOrgSlug}
                      onChange={(e) => setNewOrgSlug(e.target.value)}
                      placeholder="my-nonprofit-org"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobileAppCode">Mobile App Code (Optional)</Label>
                    <Input
                      id="mobileAppCode"
                      value={mobileAppCode}
                      onChange={(e) => setMobileAppCode(e.target.value.toUpperCase())}
                      placeholder="MA123ABC"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      If you have a mobile app, enter your organization code to enable mobile app management
                    </p>
                  </div>
                  <Button 
                    onClick={async () => {
                      await createOrganization(newOrgName, newOrgSlug, mobileAppCode || undefined);
                      setShowCreateDialog(false);
                      setNewOrgName('');
                      setNewOrgSlug('');
                      setMobileAppCode('');
                    }}
                    className="w-full"
                    disabled={!newOrgName || !newOrgSlug}
                  >
                    Create Organization
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children(organization.id);
}