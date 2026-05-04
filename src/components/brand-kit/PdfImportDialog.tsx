/**
 * PDF Import Dialog
 *
 * 1. Upload step — pick a PDF.
 * 2. Processing — render pages client-side, send to edge function for AI
 *    extraction (colors, fonts, logos, voice).
 * 3. Review step — user curates what gets applied:
 *      • Toggle each detected color in/out and re-assign roles.
 *      • Crop / re-tag / discard each detected logo using LogoCropDialog.
 *      • Edit tagline + mission + voice descriptors before commit.
 * 4. Apply — emits a BrandKit patch onto the parent draft.
 */
import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Upload, Sparkles, Check, X, Crop as CropIcon, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BrandKit, ExtractedBrandData } from '@/types/brandKit';
import { suggestFontAlternative, googleFontUrl, normalizeHex } from '@/lib/brandKit';
import { renderPdfPagesToPngs } from '@/lib/pdfRenderer';
import { LogoCropDialog } from './LogoCropDialog';

type LogoSlot = '' | 'primary' | 'mark' | 'light' | 'dark' | 'favicon';

interface ColorReview {
  hex: string;
  role: string; // primary | secondary | accent | text | background | neutral | ''
  label: string;
  selected: boolean;
}

interface LogoReview {
  url: string;
  width?: number;
  height?: number;
  variant: LogoSlot;   // user-chosen target slot
  discarded: boolean;
}

interface PdfImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onApplied: (applied: Partial<BrandKit>) => void;
}

const ROLE_OPTIONS = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'accent', label: 'Accent' },
  { value: 'text', label: 'Text' },
  { value: 'background', label: 'Background' },
  { value: 'neutral', label: 'Neutral' },
  { value: '', label: 'Unassigned' },
];

const SLOT_OPTIONS: Array<{ value: LogoSlot; label: string }> = [
  { value: 'primary', label: 'Primary' },
  { value: 'mark', label: 'Mark / icon' },
  { value: 'light', label: 'Light variant' },
  { value: 'dark', label: 'Dark variant' },
  { value: 'favicon', label: 'Favicon' },
  { value: '', label: 'Skip (library only)' },
];

export function PdfImportDialog({ open, onOpenChange, organizationId, onApplied }: PdfImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progressLabel, setProgressLabel] = useState<string>('');
  const [extracted, setExtracted] = useState<ExtractedBrandData | null>(null);

  // Review state — populated when extraction completes
  const [colorReview, setColorReview] = useState<ColorReview[]>([]);
  const [logoReview, setLogoReview] = useState<LogoReview[]>([]);
  const [headingFontIdx, setHeadingFontIdx] = useState<number>(-1);
  const [bodyFontIdx, setBodyFontIdx] = useState<number>(-1);
  const [tagline, setTagline] = useState('');
  const [mission, setMission] = useState('');
  const [voiceText, setVoiceText] = useState('');

  const [cropTarget, setCropTarget] = useState<{ index: number; url: string } | null>(null);

  const reset = () => {
    setFile(null);
    setExtracted(null);
    setProcessing(false);
    setProgressLabel('');
    setColorReview([]);
    setLogoReview([]);
    setHeadingFontIdx(-1);
    setBodyFontIdx(-1);
    setTagline('');
    setMission('');
    setVoiceText('');
    setCropTarget(null);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  // Hydrate review state when extraction lands
  useEffect(() => {
    if (!extracted) return;
    const colors = (extracted.colors || []).map<ColorReview>((c, idx) => ({
      hex: normalizeHex(c.hex) || c.hex,
      role: (c.role || '').toLowerCase(),
      label: c.label || '',
      selected: idx < 6, // pre-select the first ~6 to keep things sane
    }));
    // Best-effort role auto-assign for the first selected color of each type
    const ensureRole = (role: string, fallbackIndex: number) => {
      if (colors.some(c => c.role === role && c.selected)) return;
      const next = colors.find(c => c.role === role);
      if (next) { next.selected = true; return; }
      if (colors[fallbackIndex] && !colors[fallbackIndex].role) {
        colors[fallbackIndex].role = role;
      }
    };
    ensureRole('primary', 0);
    ensureRole('secondary', 1);
    ensureRole('accent', 2);
    setColorReview(colors);

    const sortedLogos = [...(extracted.logos || [])]
      .sort((a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0));
    setLogoReview(sortedLogos.map<LogoReview>((l, idx) => ({
      url: l.url,
      width: l.width,
      height: l.height,
      variant: idx === 0 ? 'primary' : idx === 1 ? 'mark' : '',
      discarded: false,
    })));

    const fonts = extracted.fonts || [];
    const hIdx = fonts.findIndex(f => f.usage === 'heading');
    const bIdx = fonts.findIndex(f => f.usage === 'body');
    setHeadingFontIdx(hIdx >= 0 ? hIdx : (fonts.length ? 0 : -1));
    setBodyFontIdx(bIdx >= 0 ? bIdx : (fonts.length > 1 ? 1 : hIdx));

    setTagline(extracted.tagline || '');
    setMission(extracted.mission_statement || '');
    setVoiceText((extracted.voice_descriptors || []).join(', '));
  }, [extracted]);

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      setProgressLabel('Uploading PDF…');
      const path = `${organizationId}/imports/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from('brand-kits')
        .upload(path, file, { contentType: 'application/pdf' });
      if (upErr) throw upErr;

      setProgressLabel('Rendering pages…');
      const pages = await renderPdfPagesToPngs(file, { maxPages: 8, maxDimension: 1024 });

      setProgressLabel('Analyzing with AI…');
      const { data, error } = await supabase.functions.invoke('import-brand-kit-from-pdf', {
        body: {
          organization_id: organizationId,
          pdf_file_path: path,
          page_images: pages.map(p => ({
            page_number: p.pageNumber,
            data_url: p.dataUrl,
            width: p.width,
            height: p.height,
          })),
        },
      });
      if (error) throw error;

      const result = (data?.extracted_data || {}) as ExtractedBrandData;
      setExtracted(result);
    } catch (e: any) {
      toast.error(e?.message || 'PDF import failed. The import service may still be deploying — try again in a moment.');
    } finally {
      setProcessing(false);
      setProgressLabel('');
    }
  };

  const toggleColor = (i: number) => {
    setColorReview(prev => prev.map((c, idx) => idx === i ? { ...c, selected: !c.selected } : c));
  };
  const setColorRole = (i: number, role: string) => {
    setColorReview(prev => prev.map((c, idx) => idx === i ? { ...c, role } : c));
  };

  const setLogoVariant = (i: number, variant: LogoSlot) => {
    setLogoReview(prev => prev.map((l, idx) => idx === i ? { ...l, variant } : l));
  };
  const discardLogo = (i: number) => {
    setLogoReview(prev => prev.map((l, idx) => idx === i ? { ...l, discarded: true } : l));
  };

  const handleCropped = async (i: number, blob: Blob) => {
    try {
      const path = `${organizationId}/logos/crop-${Date.now()}.png`;
      const { error: upErr } = await supabase.storage
        .from('brand-kits')
        .upload(path, blob, { upsert: false, contentType: 'image/png' });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('brand-kits').getPublicUrl(path);
      // Get dimensions of the new crop so the apply step still picks the right slot
      const dims = await readImageDims(pub.publicUrl).catch(() => ({ width: undefined, height: undefined }));
      setLogoReview(prev => prev.map((l, idx) => idx === i ? {
        ...l,
        url: pub.publicUrl,
        width: dims.width,
        height: dims.height,
      } : l));
      toast.success('Crop saved');
    } catch (e: any) {
      toast.error(e?.message || 'Could not save crop');
    }
  };

  const fontList = extracted?.fonts || [];
  const activeColors = useMemo(() => colorReview.filter(c => c.selected), [colorReview]);
  const activeLogos = useMemo(() => logoReview.filter(l => !l.discarded), [logoReview]);

  const applyExtracted = () => {
    if (!extracted) return;
    const patch: Partial<BrandKit> = {};

    // Colors — only those the user kept; first one matching each role wins.
    const findHex = (role: string) => activeColors.find(c => c.role === role)?.hex;
    patch.primary_color = normalizeHex(findHex('primary') || activeColors[0]?.hex);
    patch.secondary_color = normalizeHex(findHex('secondary') || activeColors[1]?.hex);
    patch.accent_color = normalizeHex(findHex('accent') || activeColors[2]?.hex);
    patch.text_color = normalizeHex(findHex('text') || findHex('neutral'));
    patch.background_color = normalizeHex(findHex('background'));
    patch.extended_palette = activeColors
      .map(c => normalizeHex(c.hex))
      .filter((c): c is string => !!c)
      .slice(0, 12);

    // Fonts — use selected indices
    const headingFont = headingFontIdx >= 0 ? fontList[headingFontIdx] : undefined;
    const bodyFont = bodyFontIdx >= 0 ? fontList[bodyFontIdx] : headingFont;
    if (headingFont) {
      const alt = suggestFontAlternative(headingFont.name);
      patch.heading_font_family = alt;
      patch.heading_font_url = googleFontUrl(alt);
      patch.heading_font_weight = '700';
    }
    if (bodyFont) {
      const alt = suggestFontAlternative(bodyFont.name);
      patch.body_font_family = alt;
      patch.body_font_url = googleFontUrl(alt);
      patch.body_font_weight = '400';
    }

    // Logos — assign by user-chosen variant; first wins per slot.
    const slotMap: Record<Exclude<LogoSlot, ''>, keyof BrandKit> = {
      primary: 'logo_primary_url',
      mark: 'logo_mark_url',
      light: 'logo_light_url',
      dark: 'logo_dark_url',
      favicon: 'favicon_url',
    };
    for (const l of activeLogos) {
      if (!l.variant) continue;
      const key = slotMap[l.variant];
      if (!(patch as any)[key]) (patch as any)[key] = l.url;
    }

    // Voice
    if (tagline.trim()) patch.tagline = tagline.trim();
    if (mission.trim()) patch.mission_statement = mission.trim();
    const voice = voiceText.split(',').map(s => s.trim()).filter(Boolean);
    if (voice.length) patch.voice_descriptors = voice.slice(0, 8);

    patch.source = 'pdf_import';
    onApplied(patch);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {extracted ? 'Review extracted brand kit' : 'Import from PDF brand guide'}
          </DialogTitle>
          <DialogDescription>
            {extracted
              ? 'Curate what gets applied to your kit. Toggle colors, re-tag or crop logos, and tweak the messaging before saving.'
              : 'Upload your brand guide PDF and we\'ll extract colors, fonts, logos, and messaging for you to review.'}
          </DialogDescription>
        </DialogHeader>

        {!extracted ? (
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium mb-1">{file ? file.name : 'Choose a PDF'}</p>
              <p className="text-xs text-muted-foreground mb-3">Up to 20 MB</p>
              <Input
                type="file"
                accept="application/pdf"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="max-w-xs mx-auto"
              />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Colors are detected from swatches and dominant page colors (~85-90% accurate).</p>
              <p>• Font names are extracted when available; we'll suggest free Google Font alternatives.</p>
              <p>• Logos are auto-cropped from page images — you can re-tighten any of them in the next step.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4 overflow-y-auto pr-1">
            {/* ── Colors ──────────────────────────── */}
            <section>
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-sm font-semibold">Colors <span className="font-normal text-muted-foreground">· {activeColors.length} selected</span></p>
                <span className="text-xs text-muted-foreground">Click a swatch to toggle. Pick a role to assign it.</span>
              </div>
              {colorReview.length === 0 ? (
                <p className="text-xs text-muted-foreground">No colors detected.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {colorReview.map((c, i) => (
                    <div key={i} className={`border rounded-lg p-2 flex items-center gap-2 transition-opacity ${c.selected ? '' : 'opacity-50'}`}>
                      <button
                        type="button"
                        onClick={() => toggleColor(i)}
                        className="relative h-10 w-10 rounded border border-border flex-shrink-0 overflow-hidden"
                        style={{ backgroundColor: c.hex }}
                        aria-label={c.selected ? 'Exclude color' : 'Include color'}
                      >
                        {c.selected && (
                          <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-mono truncate">{c.hex}</div>
                        <Select value={c.role || 'unassigned'} onValueChange={v => setColorRole(i, v === 'unassigned' ? '' : v)}>
                          <SelectTrigger className="h-7 text-xs mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map(r => (
                              <SelectItem key={r.value || 'unassigned'} value={r.value || 'unassigned'} className="text-xs">
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Fonts ───────────────────────────── */}
            <section>
              <p className="text-sm font-semibold mb-2">Typography</p>
              {fontList.length === 0 ? (
                <p className="text-xs text-muted-foreground">No fonts detected.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FontPicker
                    label="Heading font"
                    fonts={fontList}
                    value={headingFontIdx}
                    onChange={setHeadingFontIdx}
                  />
                  <FontPicker
                    label="Body font"
                    fonts={fontList}
                    value={bodyFontIdx}
                    onChange={setBodyFontIdx}
                  />
                </div>
              )}
            </section>

            {/* ── Logos ───────────────────────────── */}
            <section>
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-sm font-semibold">Logos <span className="font-normal text-muted-foreground">· {activeLogos.length} keeping</span></p>
                <span className="text-xs text-muted-foreground">Crop to retighten, then assign each to a slot.</span>
              </div>
              {logoReview.length === 0 ? (
                <p className="text-xs text-muted-foreground">No logos extracted. Upload them manually on the Logos tab.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {logoReview.map((l, i) => l.discarded ? null : (
                    <div key={i} className="border rounded-lg overflow-hidden flex flex-col">
                      <div className={`relative h-24 flex items-center justify-center ${
                        l.variant === 'light' ? 'bg-slate-800' :
                        l.variant === 'dark' ? 'bg-white' : 'bg-muted/30'
                      }`}>
                        <img src={l.url} alt="" className="max-h-full max-w-full object-contain p-2" />
                      </div>
                      <div className="p-2 space-y-2">
                        <Select value={l.variant || 'none'} onValueChange={v => setLogoVariant(i, v === 'none' ? '' : v as LogoSlot)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Assign to slot" />
                          </SelectTrigger>
                          <SelectContent>
                            {SLOT_OPTIONS.map(s => (
                              <SelectItem key={s.value || 'none'} value={s.value || 'none'} className="text-xs">
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-1.5">
                          <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => setCropTarget({ index: i, url: l.url })}>
                            <CropIcon className="h-3 w-3 mr-1" /> Crop
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => discardLogo(i)} aria-label="Discard logo">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {logoReview.every(l => l.discarded) && (
                    <p className="text-xs text-muted-foreground col-span-2">All logos discarded — upload manually on the Logos tab if needed.</p>
                  )}
                </div>
              )}
            </section>

            {/* ── Messaging ───────────────────────── */}
            <section className="space-y-3">
              <p className="text-sm font-semibold">Messaging & voice</p>
              <div>
                <Label className="text-xs">Tagline</Label>
                <Input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="Optional" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Mission statement</Label>
                <Textarea value={mission} onChange={e => setMission(e.target.value)} placeholder="Optional" rows={2} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Voice descriptors <span className="text-muted-foreground">(comma separated)</span></Label>
                <Input value={voiceText} onChange={e => setVoiceText(e.target.value)} placeholder="warm, bold, mission-driven" className="mt-1" />
                {voiceText && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {voiceText.split(',').map(s => s.trim()).filter(Boolean).slice(0, 8).map((v, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{v}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          {!extracted ? (
            <Button onClick={handleProcess} disabled={!file || processing}>
              {processing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {progressLabel || 'Analyzing PDF…'}</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Extract brand</>
              )}
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => { setExtracted(null); }}>
                <X className="h-4 w-4 mr-2" /> Start over
              </Button>
              <Button onClick={applyExtracted}>
                Apply to brand kit
              </Button>
            </>
          )}
        </DialogFooter>

        {cropTarget && (
          <LogoCropDialog
            open={!!cropTarget}
            onOpenChange={o => { if (!o) setCropTarget(null); }}
            imageUrl={cropTarget.url}
            onCropped={async blob => {
              await handleCropped(cropTarget.index, blob);
              setCropTarget(null);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FontPicker({
  label, fonts, value, onChange,
}: {
  label: string;
  fonts: NonNullable<ExtractedBrandData['fonts']>;
  value: number;
  onChange: (idx: number) => void;
}) {
  return (
    <div className="border rounded-lg p-3">
      <Label className="text-xs">{label}</Label>
      <Select value={String(value)} onValueChange={v => onChange(Number(v))}>
        <SelectTrigger className="h-8 text-xs mt-1">
          <SelectValue placeholder="None" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="-1" className="text-xs">None</SelectItem>
          {fonts.map((f, i) => (
            <SelectItem key={i} value={String(i)} className="text-xs">
              {f.name}{f.usage && f.usage !== 'unknown' ? ` (${f.usage})` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value >= 0 && fonts[value] && (
        <p className="text-[11px] text-muted-foreground mt-1.5">
          → uses Google Font <span className="font-medium">{suggestFontAlternative(fonts[value].name)}</span>
        </p>
      )}
    </div>
  );
}

/** Read intrinsic dimensions of a remote image (used after crop upload). */
function readImageDims(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}
