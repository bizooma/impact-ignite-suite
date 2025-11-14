import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Search, Trash2, Mail, Building2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface BetaSignup {
  id: string;
  email: string;
  name: string | null;
  organization: string | null;
  subscribed: boolean;
  created_at: string;
}

export function BetaSignupsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [subscribedFilter, setSubscribedFilter] = useState<'all' | 'subscribed' | 'unsubscribed'>('all');

  const { data: signups, isLoading, refetch } = useQuery({
    queryKey: ['beta-signups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beta_signups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BetaSignup[];
    },
  });

  const filteredSignups = useMemo(() => {
    if (!signups) return [];

    return signups.filter((signup) => {
      const matchesSearch =
        searchTerm === '' ||
        signup.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        signup.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        signup.organization?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSubscribed =
        subscribedFilter === 'all' ||
        (subscribedFilter === 'subscribed' && signup.subscribed) ||
        (subscribedFilter === 'unsubscribed' && !signup.subscribed);

      return matchesSearch && matchesSubscribed;
    });
  }, [signups, searchTerm, subscribedFilter]);

  const handleExport = () => {
    if (!filteredSignups.length) {
      toast.error('No signups to export');
      return;
    }

    const csv = [
      ['Email', 'Name', 'Organization', 'Subscribed', 'Created At'],
      ...filteredSignups.map((signup) => [
        signup.email,
        signup.name || '',
        signup.organization || '',
        signup.subscribed ? 'Yes' : 'No',
        format(new Date(signup.created_at), 'yyyy-MM-dd HH:mm:ss'),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beta-signups-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Beta signups exported successfully');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this signup?')) return;

    const { error } = await supabase.from('beta_signups').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete signup');
      console.error(error);
      return;
    }

    toast.success('Signup deleted successfully');
    refetch();
  };

  const stats = useMemo(() => {
    if (!signups) return { total: 0, subscribed: 0, unsubscribed: 0 };

    return {
      total: signups.length,
      subscribed: signups.filter((s) => s.subscribed).length,
      unsubscribed: signups.filter((s) => !s.subscribed).length,
    };
  }, [signups]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Signups</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Beta testers registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribed</CardTitle>
            <Badge variant="default" className="h-4">
              ✓
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subscribed}</div>
            <p className="text-xs text-muted-foreground">Opted in for updates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
            <Badge variant="secondary" className="h-4">
              ✗
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unsubscribed}</div>
            <p className="text-xs text-muted-foreground">Opted out of updates</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Beta Signups</CardTitle>
          <CardDescription>Manage and export beta testing registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={subscribedFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setSubscribedFilter('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={subscribedFilter === 'subscribed' ? 'default' : 'outline'}
                onClick={() => setSubscribedFilter('subscribed')}
                size="sm"
              >
                Subscribed
              </Button>
              <Button
                variant={subscribedFilter === 'unsubscribed' ? 'default' : 'outline'}
                onClick={() => setSubscribedFilter('unsubscribed')}
                size="sm"
              >
                Unsubscribed
              </Button>
            </div>
            <Button onClick={handleExport} size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading signups...</div>
          ) : filteredSignups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || subscribedFilter !== 'all'
                ? 'No signups match your filters'
                : 'No beta signups yet'}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSignups.map((signup) => (
                    <TableRow key={signup.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {signup.email}
                        </div>
                      </TableCell>
                      <TableCell>{signup.name || '-'}</TableCell>
                      <TableCell>
                        {signup.organization ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {signup.organization}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={signup.subscribed ? 'default' : 'secondary'}>
                          {signup.subscribed ? 'Subscribed' : 'Unsubscribed'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(signup.created_at), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(signup.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
