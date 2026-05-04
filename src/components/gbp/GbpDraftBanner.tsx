import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, X, ExternalLink, Send } from 'lucide-react';
import { toast } from 'sonner';

export interface PendingGbpDraft {
  body: string;
  title?: string;
  campaignId?: string;
  assetId?: string;
  createdAt: string;
}

const STORAGE_KEY = 'gbp.pendingDraft';

export function readPendingGbpDraft(): PendingGbpDraft | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingGbpDraft) : null;
  } catch {
    return null;
  }
}

export function writePendingGbpDraft(draft: Omit<PendingGbpDraft, 'createdAt'>) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, createdAt: new Date().toISOString() }));
}

export function clearPendingGbpDraft() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function GbpDraftBanner() {
  const [draft, setDraft] = useState<PendingGbpDraft | null>(null);

  useEffect(() => {
    setDraft(readPendingGbpDraft());
  }, []);

  if (!draft) return null;

  const dismiss = () => {
    clearPendingGbpDraft();
    setDraft(null);
  };

  const copy = () => {
    navigator.clipboard.writeText(draft.body || '');
    toast.success('Post body copied — paste it into Google Business → Add update');
  };

  return (
    <Card className="p-4 border-primary/40 bg-primary/5">
      <div className="flex items-start gap-3">
        <Send className="h-5 w-5 mt-0.5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold">Draft from a campaign</span>
            <Badge variant="outline" className="text-xs">Ready to post</Badge>
          </div>
          {draft.title && <div className="text-sm text-muted-foreground mb-2">{draft.title}</div>}
          <pre className="text-sm whitespace-pre-wrap font-sans bg-background rounded p-3 border max-h-48 overflow-y-auto">
            {draft.body}
          </pre>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button size="sm" onClick={copy}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copy body
            </Button>
            <Button
              size="sm"
              variant="outline"
              asChild
            >
              <a href="https://business.google.com/posts" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Open Google Business → Posts
              </a>
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              <X className="h-3.5 w-3.5 mr-1.5" />
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
