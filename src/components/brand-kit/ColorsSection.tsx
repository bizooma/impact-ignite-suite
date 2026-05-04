import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { normalizeHex } from '@/lib/brandKit';
import { toast } from 'sonner';
import type { BrandKit } from '@/types/brandKit';

interface ColorsSectionProps {
  draft: Partial<BrandKit>;
  onChange: (patch: Partial<BrandKit>) => void;
}

const COLOR_FIELDS: Array<{
  key: 'primary_color' | 'secondary_color' | 'accent_color' | 'text_color' | 'background_color';
  label: string;
  description: string;
}> = [
  { key: 'primary_color', label: 'Primary', description: 'Main brand color used for buttons, links, and highlights.' },
  { key: 'secondary_color', label: 'Secondary', description: 'Supporting color for surfaces and secondary actions.' },
  { key: 'accent_color', label: 'Accent', description: 'Used for callouts, donate buttons, and emphasis.' },
  { key: 'text_color', label: 'Text', description: 'Default body text color.' },
  { key: 'background_color', label: 'Background', description: 'Default page/canvas background.' },
];

export function ColorsSection({ draft, onChange }: ColorsSectionProps) {
  const [newSwatch, setNewSwatch] = useState('');

  const setColor = (key: ColorsSectionProps extends never ? never : typeof COLOR_FIELDS[number]['key'], value: string) => {
    onChange({ [key]: value || null });
  };

  const palette = draft.extended_palette || [];

  const addToPalette = () => {
    const hex = normalizeHex(newSwatch);
    if (!hex) {
      toast.error('Enter a valid hex color (e.g. #1E40AF)');
      return;
    }
    if (palette.includes(hex)) {
      toast.error('That color is already in your palette');
      return;
    }
    onChange({ extended_palette: [...palette, hex] });
    setNewSwatch('');
  };

  const removeFromPalette = (hex: string) => {
    onChange({ extended_palette: palette.filter(c => c !== hex) });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Colors</CardTitle>
        <CardDescription>
          Define your brand palette. These colors flow into your chatbot, QR codes, social posts, and campaign pages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {COLOR_FIELDS.map(field => {
          const value = (draft as any)[field.key] || '';
          return (
            <div key={field.key} className="grid grid-cols-1 md:grid-cols-[120px_1fr_140px] gap-3 items-center">
              <Label className="text-sm font-medium">{field.label}</Label>
              <div>
                <p className="text-xs text-muted-foreground">{field.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={value || '#000000'}
                  onChange={e => setColor(field.key, e.target.value.toUpperCase())}
                  className="h-10 w-12 rounded border border-input cursor-pointer"
                  aria-label={`${field.label} color picker`}
                />
                <Input
                  value={value}
                  placeholder="#000000"
                  onChange={e => setColor(field.key, e.target.value)}
                  onBlur={e => {
                    const norm = normalizeHex(e.target.value);
                    if (norm) setColor(field.key, norm);
                  }}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          );
        })}

        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <Label className="text-sm font-medium">Extended palette</Label>
              <p className="text-xs text-muted-foreground">Optional supporting colors for charts and accents.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {palette.map(hex => (
              <div
                key={hex}
                className="group relative h-10 w-10 rounded border border-border"
                style={{ backgroundColor: hex }}
                title={hex}
              >
                <button
                  type="button"
                  onClick={() => removeFromPalette(hex)}
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-background border border-border opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  aria-label={`Remove ${hex}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {palette.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No additional swatches yet.</p>
            )}
          </div>
          <div className="flex items-center gap-2 max-w-sm">
            <input
              type="color"
              value={normalizeHex(newSwatch) || '#000000'}
              onChange={e => setNewSwatch(e.target.value.toUpperCase())}
              className="h-10 w-12 rounded border border-input cursor-pointer"
              aria-label="Pick swatch color"
            />
            <Input
              value={newSwatch}
              onChange={e => setNewSwatch(e.target.value)}
              placeholder="#1E40AF"
              className="font-mono text-sm"
            />
            <Button type="button" size="sm" variant="outline" onClick={addToPalette}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
