import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, BookOpen, Star } from 'lucide-react';
import { toast } from 'sonner';

interface Props { organizationId: string }

interface Story {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string | null;
  hero_image_url: string | null;
  video_url: string | null;
  category: string | null;
  tags: string[];
  author_name: string | null;
  is_featured: boolean;
  is_published: boolean;
  published_at: string | null;
}

const empty: Partial<Story> = {
  title: '', slug: '', summary: '', body: '', hero_image_url: '', video_url: '',
  category: '', tags: [], author_name: '', is_featured: false, is_published: false,
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

export function StoriesManager({ organizationId }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Story> | null>(null);
  const [tagInput, setTagInput] = useState('');

  const { data: stories, isLoading } = useQuery({
    queryKey: ['org-stories', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_success_stories')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Story[];
    },
  });

  const save = useMutation({
    mutationFn: async (s: Partial<Story>) => {
      const slug = s.slug?.trim() || slugify(s.title || '');
      const payload: any = {
        organization_id: organizationId,
        title: s.title,
        slug,
        summary: s.summary || null,
        body: s.body || null,
        hero_image_url: s.hero_image_url || null,
        video_url: s.video_url || null,
        category: s.category || null,
        tags: s.tags || [],
        author_name: s.author_name || null,
        is_featured: !!s.is_featured,
        is_published: !!s.is_published,
        published_at: s.is_published ? (s.published_at || new Date().toISOString()) : null,
      };
      if (s.id) {
        const { error } = await supabase.from('org_success_stories').update(payload).eq('id', s.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('org_success_stories').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-stories', organizationId] });
      toast.success('Story saved');
      setOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('org_success_stories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-stories', organizationId] });
      toast.success('Story deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || !editing) return;
    setEditing({ ...editing, tags: [...(editing.tags || []), t] });
    setTagInput('');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Success Stories</CardTitle>
        <Button onClick={() => { setEditing({ ...empty }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> New Story
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : stories && stories.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stories.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.title}</TableCell>
                  <TableCell>{s.category || '—'}</TableCell>
                  <TableCell>{s.is_featured && <Star className="h-4 w-4 text-primary fill-primary" />}</TableCell>
                  <TableCell>
                    <Badge variant={s.is_published ? 'default' : 'secondary'}>
                      {s.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this story?')) remove.mutate(s.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No stories yet.</div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Story' : 'New Story'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={editing.title || ''}
                  onChange={(e) => setEditing({
                    ...editing,
                    title: e.target.value,
                    slug: editing.id ? editing.slug : slugify(e.target.value),
                  })}
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={editing.slug || ''} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} />
              </div>
              <div>
                <Label>Summary</Label>
                <Textarea rows={2} value={editing.summary || ''} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} />
              </div>
              <div>
                <Label>Body (Markdown)</Label>
                <Textarea rows={10} value={editing.body || ''} onChange={(e) => setEditing({ ...editing, body: e.target.value })} className="font-mono text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hero Image URL</Label>
                  <Input value={editing.hero_image_url || ''} onChange={(e) => setEditing({ ...editing, hero_image_url: e.target.value })} />
                </div>
                <div>
                  <Label>Video URL</Label>
                  <Input value={editing.video_url || ''} onChange={(e) => setEditing({ ...editing, video_url: e.target.value })} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
                </div>
                <div>
                  <Label>Author</Label>
                  <Input value={editing.author_name || ''} onChange={(e) => setEditing({ ...editing, author_name: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="Type and press Enter"
                  />
                  <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(editing.tags || []).map((t, i) => (
                    <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setEditing({ ...editing, tags: editing.tags!.filter((_, j) => j !== i) })}>
                      {t} ×
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={!!editing.is_featured} onCheckedChange={(v) => setEditing({ ...editing, is_featured: v })} />
                  <Label>Featured</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={!!editing.is_published} onCheckedChange={(v) => setEditing({ ...editing, is_published: v })} />
                  <Label>Published</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => editing && save.mutate(editing)} disabled={!editing?.title || save.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
