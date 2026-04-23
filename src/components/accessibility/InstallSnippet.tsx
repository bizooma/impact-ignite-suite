import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccessibilitySettings, type WidgetPosition } from '@/hooks/useAccessibilitySettings';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  siteId: string;
  /** DB row id for the site (used to load/save settings) */
  siteRowId: string;
}

export function InstallSnippet({ siteId, siteRowId }: Props) {
  const [copied, setCopied] = useState(false);
  const { settings, loading, update } = useAccessibilitySettings(siteRowId);
  const position: WidgetPosition = settings?.widget_position ?? 'right';

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
      <div className="flex items-center gap-3">
        <Label htmlFor="a11y-pos" className="text-sm">Widget position</Label>
        {loading ? (
          <Skeleton className="h-9 w-40" />
        ) : (
          <Select
            value={position}
            onValueChange={(v) => update({ widget_position: v as WidgetPosition })}
          >
            <SelectTrigger id="a11y-pos" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Bottom left</SelectItem>
              <SelectItem value="center">Bottom center</SelectItem>
              <SelectItem value="right">Bottom right</SelectItem>
            </SelectContent>
          </Select>
        )}
        <p className="text-xs text-muted-foreground">Saved automatically — no need to reinstall.</p>
      </div>
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
