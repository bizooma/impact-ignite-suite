import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { InstallSnippet } from './InstallSnippet';

interface Props {
  onCreate: (domain: string, businessName?: string) => Promise<{ id: string; site_id: string } | null>;
}

export function AddSiteDialog({ onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ id: string; site_id: string } | null>(null);

  const submit = async () => {
    if (!domain.trim()) return;
    setSubmitting(true);
    const result = await onCreate(domain, businessName || undefined);
    setSubmitting(false);
    if (result) setCreated(result);
  };

  const reset = () => {
    setDomain('');
    setBusinessName('');
    setCreated(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Website
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{created ? 'Website added' : 'Add a new website'}</DialogTitle>
        </DialogHeader>

        {!created ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain *</Label>
              <Input
                id="domain"
                placeholder="example.org"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="biz">Business name (optional)</Label>
              <Input
                id="biz"
                placeholder="Acme Nonprofit"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={!domain.trim() || submitting}>
                {submitting ? 'Adding…' : 'Add Website'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Install the Accessibility Layer on your site by pasting this snippet before the closing <code className="px-1 bg-muted rounded">&lt;/body&gt;</code> tag.
            </p>
            <InstallSnippet siteId={created.site_id} />
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
