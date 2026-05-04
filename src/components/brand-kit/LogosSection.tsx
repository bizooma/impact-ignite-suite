import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BrandKit } from '@/types/brandKit';

interface LogosSectionProps {
  draft: Partial<BrandKit>;
  onChange: (patch: Partial<BrandKit>) => void;
  organizationId: string;
}

const LOGO_SLOTS: Array<{
  key: 'logo_primary_url' | 'logo_mark_url' | 'logo_light_url' | 'logo_dark_url' | 'favicon_url';
  label: string;
  description: string;
  bgClass: string;
}> = [
  { key: 'logo_primary_url', label: 'Primary logo', description: 'Your main full-color logo (used in most contexts).', bgClass: 'bg-muted/30' },
  { key: 'logo_mark_url', label: 'Mark / icon', description: 'Square or icon-only version for avatars and small spaces.', bgClass: 'bg-muted/30' },
  { key: 'logo_light_url', label: 'Light variant', description: 'For dark backgrounds (white/light logo).', bgClass: 'bg-slate-800' },
  { key: 'logo_dark_url', label: 'Dark variant', description: 'For light backgrounds (dark/black logo).', bgClass: 'bg-white' },
  { key: 'favicon_url', label: 'Favicon', description: 'Tiny square icon for browser tabs (32x32 ideal).', bgClass: 'bg-muted/30' },
];

export function LogosSection({ draft, onChange, organizationId }: LogosSectionProps) {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const upload = async (key: string, file: File) => {
    if (!file) return;
    setUploadingKey(key);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${organizationId}/logos/${key}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('brand-kits')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('brand-kits').getPublicUrl(path);
      onChange({ [key]: pub.publicUrl });
      toast.success('Logo uploaded');
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploadingKey(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logos</CardTitle>
        <CardDescription>
          Upload PNG or SVG files. Transparent backgrounds work best.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LOGO_SLOTS.map(slot => {
            const url = (draft as any)[slot.key] as string | null;
            const isUploading = uploadingKey === slot.key;
            return (
              <div key={slot.key} className="border rounded-lg p-4 space-y-3">
                <div>
                  <Label className="text-sm font-medium">{slot.label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{slot.description}</p>
                </div>
                <div
                  className={`relative h-32 rounded border-2 border-dashed border-border flex items-center justify-center overflow-hidden ${slot.bgClass}`}
                >
                  {url ? (
                    <>
                      <img src={url} alt={slot.label} className="max-h-full max-w-full object-contain p-2" />
                      <button
                        type="button"
                        onClick={() => onChange({ [slot.key]: null })}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/90 border border-border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground"
                        aria-label="Remove logo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <span className="text-xs text-muted-foreground">No file</span>
                  )}
                </div>
                <label className="block">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) upload(slot.key, f);
                      e.target.value = '';
                    }}
                  />
                  <Button asChild variant="outline" size="sm" className="w-full" disabled={isUploading}>
                    <span className="cursor-pointer">
                      <Upload className="h-3 w-3 mr-2" />
                      {url ? 'Replace' : 'Upload'}
                    </span>
                  </Button>
                </label>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
