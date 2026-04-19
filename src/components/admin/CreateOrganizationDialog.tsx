import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Props {
  onCreated: () => void;
}

export function CreateOrganizationDialog({ onCreated }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [addSelfAsOwner, setAddSelfAsOwner] = useState(true);

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleNameChange = (v: string) => {
    setName(v);
    if (!slug || slug === slugify(name)) setSlug(slugify(v));
  };

  const reset = () => {
    setName(''); setSlug(''); setDescription(''); setWebsite(''); setAddSelfAsOwner(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }
    setSubmitting(true);
    try {
      const { data: org, error } = await supabase
        .from('organizations')
        .insert({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          website: website.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;

      if (addSelfAsOwner && user) {
        const { error: memErr } = await supabase
          .from('memberships')
          .insert({ user_id: user.id, organization_id: org.id, role: 'owner' });
        if (memErr) throw memErr;
      }

      toast.success(`Organization "${org.name}" created`);
      reset();
      setOpen(false);
      onCreated();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to create organization');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" /> New Organization
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Set up a new tenant. Optionally add yourself as owner so you can access it immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="org-name">Name *</Label>
            <Input id="org-name" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="BridgeTRUST, PLLC" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-slug">Slug *</Label>
            <Input id="org-slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="bridgetrust" />
            <p className="text-xs text-muted-foreground">URL-safe identifier. Lowercase, dashes only.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-website">Website</Label>
            <Input id="org-website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://bridgetrust.org" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-desc">Description</Label>
            <Textarea id="org-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm">Add me as owner</Label>
              <p className="text-xs text-muted-foreground">Required to switch into this org and manage it from the dashboard.</p>
            </div>
            <Switch checked={addSelfAsOwner} onCheckedChange={setAddSelfAsOwner} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Organization'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
