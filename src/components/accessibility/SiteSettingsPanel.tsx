import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAccessibilitySettings, type AccessibilitySettings } from '@/hooks/useAccessibilitySettings';
import { Skeleton } from '@/components/ui/skeleton';

type ToggleKey = keyof AccessibilitySettings;

const GROUPS: Array<{ title: string; items: Array<{ key: ToggleKey; label: string; desc: string }> }> = [
  {
    title: 'Profiles & Utilities',
    items: [
      { key: 'profiles_enabled', label: 'Accessibility profiles', desc: 'One-click bundles like Vision Impaired, ADHD, Seizure Safe, etc.' },
      { key: 'language_selector', label: 'Language translator', desc: 'Lets visitors translate the page using Google Translate.' },
      { key: 'report_issue', label: 'Report-an-issue button', desc: 'Allows visitors to send accessibility feedback to your team.' },
      { key: 'oversize_widget', label: 'Oversize widget toggle', desc: 'Lets visitors enlarge the widget panel itself.' },
    ],
  },
  {
    title: 'Content adjustments',
    items: [
      { key: 'font_scaling', label: 'Font size slider', desc: 'Scale text up to 180%.' },
      { key: 'highlight_links', label: 'Highlight links', desc: 'Makes links visually prominent.' },
      { key: 'dyslexia_font', label: 'Dyslexia-friendly font', desc: 'Switches body text to OpenDyslexic.' },
      { key: 'letter_spacing', label: 'Letter spacing', desc: 'Increases spacing between characters.' },
      { key: 'line_height', label: 'Line height', desc: 'Increases vertical spacing between lines.' },
      { key: 'font_weight_adj', label: 'Bolder text', desc: 'Forces all text to bold.' },
      { key: 'spacing', label: 'Reading spacing bundle', desc: 'Combined letter, word, and line spacing.' },
    ],
  },
  {
    title: 'Color adjustments',
    items: [
      { key: 'high_contrast', label: 'Contrast modes', desc: 'Cycles dark / light / high-contrast.' },
      { key: 'saturation_adj', label: 'Saturation control', desc: 'Reduce or boost color saturation.' },
      { key: 'monochrome', label: 'Monochrome', desc: 'Removes all color from the page.' },
    ],
  },
  {
    title: 'Orientation & navigation',
    items: [
      { key: 'reading_mask', label: 'Reading mask', desc: 'Dark band that follows the cursor.' },
      { key: 'reading_guide', label: 'Reading guide', desc: 'Highlighted line under the cursor.' },
      { key: 'big_cursor', label: 'Big cursor', desc: 'Large black or white cursor.' },
      { key: 'stop_animations', label: 'Stop animations', desc: 'Pauses GIFs, video, CSS animations.' },
      { key: 'reduced_motion', label: 'Reduced motion', desc: 'Suppresses transitions.' },
    ],
  },
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
      <CardContent className="p-5 space-y-5">
        <div>
          <h3 className="font-semibold">Widget features</h3>
          <p className="text-xs text-muted-foreground">Toggle which accessibility tools appear in the floating menu on your site.</p>
        </div>

        {GROUPS.map((g) => (
          <div key={g.title} className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{g.title}</h4>
            <div className="space-y-1">
              {g.items.map((t) => (
                <div key={String(t.key)} className="flex items-start justify-between gap-4 py-2 border-t first:border-t-0">
                  <div className="min-w-0">
                    <Label className="font-medium">{t.label}</Label>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                  <Switch
                    checked={Boolean((settings as any)[t.key])}
                    onCheckedChange={(v) => update({ [t.key]: v } as Partial<AccessibilitySettings>)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="space-y-2 pt-3 border-t">
          <Label className="font-medium">Custom statement URL (optional)</Label>
          <p className="text-xs text-muted-foreground">Override the auto-generated accessibility statement link shown in the widget footer.</p>
          <Input
            placeholder="https://example.com/accessibility"
            defaultValue={settings.statement_url || ''}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v !== (settings.statement_url || '')) update({ statement_url: v || null });
            }}
          />
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
