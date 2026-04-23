import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAccessibilitySettings, type AccessibilitySettings } from '@/hooks/useAccessibilitySettings';
import { Skeleton } from '@/components/ui/skeleton';

const TOGGLES: Array<{ key: keyof AccessibilitySettings; label: string; desc: string }> = [
  { key: 'high_contrast', label: 'High contrast mode', desc: 'Lets visitors switch to a high-contrast color scheme.' },
  { key: 'font_scaling', label: 'Font scaling', desc: 'Allows visitors to increase or decrease text size.' },
  { key: 'reduced_motion', label: 'Reduced motion', desc: 'Suppresses non-essential animations and transitions.' },
  { key: 'spacing', label: 'Increased spacing', desc: 'Adds extra spacing between letters, words, and lines.' },
  { key: 'highlight_links', label: 'Highlight links', desc: 'Makes all links visually prominent on the page.' },
];

interface Props {
  siteId: string;
}

export function SiteSettingsPanel({ siteId }: Props) {
  const { settings, loading, update } = useAccessibilitySettings(siteId);

  if (loading) return <Skeleton className="h-64" />;
  if (!settings) return null;

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div>
          <h3 className="font-semibold">Widget features</h3>
          <p className="text-xs text-muted-foreground">Toggle which accessibility tools appear in the floating menu on your site.</p>
        </div>
        <div className="space-y-3">
          {TOGGLES.map((t) => (
            <div key={t.key} className="flex items-start justify-between gap-4 py-2 border-t first:border-t-0">
              <div className="min-w-0">
                <Label className="font-medium">{t.label}</Label>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
              <Switch
                checked={Boolean(settings[t.key])}
                onCheckedChange={(v) => update({ [t.key]: v } as Partial<AccessibilitySettings>)}
              />
            </div>
          ))}
        </div>
        <div className="flex items-start justify-between gap-4 pt-3 border-t">
          <div>
            <Label className="font-medium">Widget active</Label>
            <p className="text-xs text-muted-foreground">When off, the widget will not display on your site even if the script is installed.</p>
          </div>
          <Switch checked={settings.widget_active} onCheckedChange={(v) => update({ widget_active: v })} />
        </div>
      </CardContent>
    </Card>
  );
}
