import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Inbox, CheckCircle2, Trash2, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface FeedbackItem {
  id: string;
  site_id: string;
  name: string | null;
  email: string | null;
  message: string;
  page_url: string | null;
  user_agent: string | null;
  status: string;
  created_at: string;
}

interface Props {
  siteId: string;
}

export function SiteFeedbackPanel({ siteId }: Props) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('accessibility_feedback' as any)
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    else setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [siteId]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('accessibility_feedback' as any).update({ status }).eq('id', id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('accessibility_feedback' as any).delete().eq('id', id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  if (loading) return <Skeleton className="h-64" />;

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <Inbox className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">No feedback yet</h3>
          <p className="text-sm text-muted-foreground">Visitors who report issues through the widget will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((it) => (
        <Card key={it.id}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={it.status === 'resolved' ? 'secondary' : 'default'}>{it.status}</Badge>
                <span className="text-sm font-medium">{it.name || 'Anonymous'}</span>
                {it.email && <span className="text-xs text-muted-foreground">{it.email}</span>}
              </div>
              <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(it.created_at), { addSuffix: true })}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{it.message}</p>
            {it.page_url && (
              <a href={it.page_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <ExternalLink className="w-3 h-3" />
                {it.page_url}
              </a>
            )}
            <div className="flex gap-2 pt-2">
              {it.status !== 'resolved' && (
                <Button size="sm" variant="outline" onClick={() => setStatus(it.id, 'resolved')}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Mark resolved
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => remove(it.id)}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
