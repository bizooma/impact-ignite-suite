/**
 * LogosSection — Logo Library + Slot Manager
 *
 * Replaces the old fixed-slot uploader with a unified library:
 *   • Multi-file upload (drag a folder of variants in at once).
 *   • Each logo card shows current slot assignments and lets you toggle
 *     which slots it occupies (Primary / Mark / Light / Dark / Favicon).
 *   • In-browser crop dialog re-tightens AI-extracted bboxes or any image.
 *   • Detach a logo from all slots without deleting the source file.
 *
 * Storage model unchanged — slots are still individual columns on
 * `brand_kits` (logo_primary_url, logo_mark_url, etc.). The library is
 * derived from whichever URLs are currently assigned plus any newly
 * uploaded files held in component state until saved.
 */
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Crop, Trash2, Loader2, ImageIcon, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BrandKit } from '@/types/brandKit';
import { LogoCropDialog } from './LogoCropDialog';

interface LogosSectionProps {
  draft: Partial<BrandKit>;
  onChange: (patch: Partial<BrandKit>) => void;
  organizationId: string;
}

type SlotKey = 'logo_primary_url' | 'logo_mark_url' | 'logo_light_url' | 'logo_dark_url' | 'favicon_url';

interface SlotDef {
  key: SlotKey;
  label: string;
  short: string;
  bgClass: string;
}

const SLOTS: SlotDef[] = [
  { key: 'logo_primary_url', label: 'Primary', short: 'Primary', bgClass: 'bg-muted/30' },
  { key: 'logo_mark_url', label: 'Mark / icon', short: 'Mark', bgClass: 'bg-muted/30' },
  { key: 'logo_light_url', label: 'Light variant (for dark bg)', short: 'Light', bgClass: 'bg-slate-800' },
  { key: 'logo_dark_url', label: 'Dark variant (for light bg)', short: 'Dark', bgClass: 'bg-white' },
  { key: 'favicon_url', label: 'Favicon', short: 'Favicon', bgClass: 'bg-muted/30' },
];

export function LogosSection({ draft, onChange, organizationId }: LogosSectionProps) {
  const [uploading, setUploading] = useState(false);
  // Library = unique URLs that appear in any slot, plus any extras we've
  // added during this session (e.g. an uploaded file the user hasn't
  // assigned yet).
  const [extras, setExtras] = useState<string[]>([]);
  const [cropTarget, setCropTarget] = useState<string | null>(null);

  const library = useMemo(() => {
    const urls = new Set<string>();
    for (const s of SLOTS) {
      const u = (draft as any)[s.key] as string | null | undefined;
      if (u) urls.add(u);
    }
    for (const u of extras) urls.add(u);
    return Array.from(urls);
  }, [draft, extras]);

  // Drop extras that have been removed from every slot AND the user hasn't
  // explicitly kept them (i.e. once unassigned they fall off the library).
  // We keep them only between upload and first slot assignment.
  useEffect(() => {
    setExtras(prev => prev.filter(u => {
      // keep if not yet assigned to any slot
      return !SLOTS.some(s => (draft as any)[s.key] === u);
    }));
  }, [draft]);

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (arr.length === 0) return;
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of arr) {
        const ext = file.name.split('.').pop() || 'png';
        const path = `${organizationId}/logos/lib-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('brand-kits')
          .upload(path, file, { upsert: false, contentType: file.type });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('brand-kits').getPublicUrl(path);
        newUrls.push(pub.publicUrl);
      }
      setExtras(prev => [...prev, ...newUrls]);
      // Auto-assign first uploaded file to Primary if Primary is empty
      const patch: Partial<BrandKit> = {};
      if (!draft.logo_primary_url && newUrls[0]) patch.logo_primary_url = newUrls[0];
      if (!draft.logo_mark_url && newUrls[1]) patch.logo_mark_url = newUrls[1];
      if (Object.keys(patch).length) onChange(patch);
      toast.success(arr.length === 1 ? 'Logo added to library' : `${arr.length} logos added`);
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const slotsForUrl = (url: string): SlotKey[] =>
    SLOTS.filter(s => (draft as any)[s.key] === url).map(s => s.key);

  const toggleSlot = (url: string, slot: SlotKey) => {
    const current = (draft as any)[slot] as string | null;
    onChange({ [slot]: current === url ? null : url } as Partial<BrandKit>);
  };

  const removeFromLibrary = (url: string) => {
    // Clear from any slot that uses it AND drop from extras
    const patch: Partial<BrandKit> = {};
    for (const s of SLOTS) {
      if ((draft as any)[s.key] === url) (patch as any)[s.key] = null;
    }
    if (Object.keys(patch).length) onChange(patch);
    setExtras(prev => prev.filter(u => u !== url));
  };

  const handleCropped = async (sourceUrl: string, blob: Blob) => {
    try {
      const path = `${organizationId}/logos/crop-${Date.now()}.png`;
      const { error: upErr } = await supabase.storage
        .from('brand-kits')
        .upload(path, blob, { upsert: false, contentType: 'image/png' });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('brand-kits').getPublicUrl(path);
      const newUrl = pub.publicUrl;
      // Replace the original URL in any slot it currently occupies
      const patch: Partial<BrandKit> = {};
      let assigned = false;
      for (const s of SLOTS) {
        if ((draft as any)[s.key] === sourceUrl) {
          (patch as any)[s.key] = newUrl;
          assigned = true;
        }
      }
      if (Object.keys(patch).length) onChange(patch);
      // If the source was an unassigned extra, swap it
      setExtras(prev => {
        const next = prev.filter(u => u !== sourceUrl);
        if (!assigned) next.push(newUrl);
        return next;
      });
      toast.success('Cropped logo saved');
    } catch (e: any) {
      toast.error(e?.message || 'Could not save crop');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Logo library</CardTitle>
          <CardDescription>
            Upload all your logo variants once, then assign each one to the slots that need it. Re-crop AI-extracted logos in place.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop zone */}
          <label
            onDragOver={e => e.preventDefault()}
            onDrop={onDrop}
            className="block border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
          >
            <Upload className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Drop logos here or click to upload</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, SVG, JPG, or WebP — multiple files supported</p>
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={e => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
            {uploading && (
              <div className="mt-2 inline-flex items-center text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> Uploading…
              </div>
            )}
          </label>

          {/* Library grid */}
          {library.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No logos yet. Upload above, or use "Import from PDF" to extract them automatically.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {library.map(url => {
                const assignments = slotsForUrl(url);
                // Pick a preview background that flatters: if assigned to the
                // Light slot, show on dark; if Dark, show on white; else neutral.
                const previewBg = assignments.includes('logo_light_url')
                  ? 'bg-slate-800'
                  : assignments.includes('logo_dark_url')
                  ? 'bg-white'
                  : 'bg-muted/30';
                return (
                  <div key={url} className="border rounded-lg overflow-hidden flex flex-col">
                    <div className={`relative h-28 flex items-center justify-center ${previewBg}`}>
                      <img src={url} alt="Logo" className="max-h-full max-w-full object-contain p-3" />
                    </div>
                    <div className="p-3 space-y-3 flex-1 flex flex-col">
                      <div>
                        <Label className="text-xs text-muted-foreground">Used as</Label>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {SLOTS.map(s => {
                            const active = assignments.includes(s.key);
                            return (
                              <button
                                key={s.key}
                                type="button"
                                onClick={() => toggleSlot(url, s.key)}
                                className="focus:outline-none focus:ring-2 focus:ring-ring rounded-full"
                                title={active ? `Remove from ${s.label}` : `Set as ${s.label}`}
                              >
                                <Badge
                                  variant={active ? 'default' : 'outline'}
                                  className="text-[10px] cursor-pointer"
                                >
                                  {active && <Check className="h-2.5 w-2.5 mr-0.5" />}
                                  {s.short}
                                </Badge>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex gap-1.5 mt-auto">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setCropTarget(url)}>
                          <Crop className="h-3 w-3 mr-1.5" /> Crop
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromLibrary(url)}
                          aria-label="Remove logo"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Slot summary — quick visual of what each app surface will use */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Slot assignments</CardTitle>
          <CardDescription>How each logo slot will appear across your apps.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {SLOTS.map(s => {
              const url = (draft as any)[s.key] as string | null;
              return (
                <div key={s.key} className="text-center">
                  <div className={`relative h-20 rounded border border-border flex items-center justify-center ${s.bgClass}`}>
                    {url ? (
                      <img src={url} alt={s.label} className="max-h-full max-w-full object-contain p-2" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Empty</span>
                    )}
                  </div>
                  <div className="text-xs font-medium mt-1.5">{s.short}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {cropTarget && (
        <LogoCropDialog
          open={!!cropTarget}
          onOpenChange={o => { if (!o) setCropTarget(null); }}
          imageUrl={cropTarget}
          onCropped={blob => handleCropped(cropTarget, blob)}
        />
      )}
    </div>
  );
}
