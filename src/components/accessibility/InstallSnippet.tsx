import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  siteId: string;
}

export function InstallSnippet({ siteId }: Props) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const snippet = `<script src="${origin}/accessibility.js?site=${siteId}" defer></script>`;

  const copy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md bg-muted p-3 font-mono text-xs break-all border">
        {snippet}
      </div>
      <Button onClick={copy} variant="outline" size="sm">
        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
        {copied ? 'Copied' : 'Copy install snippet'}
      </Button>
      <p className="text-xs text-muted-foreground">
        Paste this snippet just before the closing <code className="px-1 rounded bg-muted">&lt;/body&gt;</code> tag on every page of your site.
      </p>
    </div>
  );
}
