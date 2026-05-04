/**
 * PDF Import Dialog — shell with placeholder until edge function is wired.
 * For now lets users upload a PDF and shows a "coming soon" notice. The
 * full import flow is implemented in a follow-up step.
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BrandKit, ExtractedBrandData } from '@/types/brandKit';
import { suggestFontAlternative, googleFontUrl, normalizeHex } from '@/lib/brandKit';
import { renderPdfPagesToPngs } from '@/lib/pdfRenderer';

interface PdfImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onApplied: (applied: Partial<BrandKit>) => void;
}

export function PdfImportDialog({ open, onOpenChange, organizationId, onApplied }: PdfImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progressLabel, setProgressLabel] = useState<string>('');
  const [extracted, setExtracted] = useState<ExtractedBrandData | null>(null);

  const reset = () => {
    setFile(null);
    setExtracted(null);
    setProcessing(false);
    setProgressLabel('');
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      // 1. Upload PDF to storage (kept for audit trail / re-runs)
      setProgressLabel('Uploading PDF…');
      const path = `${organizationId}/imports/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from('brand-kits')
        .upload(path, file, { contentType: 'application/pdf' });
      if (upErr) throw upErr;

      // 2. Render pages to PNGs in the browser (pdfjs is reliable here;
      //    Deno edge function would be far more fragile).
      setProgressLabel('Rendering pages…');
      const pages = await renderPdfPagesToPngs(file, { maxPages: 8, maxDimension: 1024 });

      // 3. Hand off to the edge function for AI extraction + logo cropping.
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

  const applyExtracted = () => {
    if (!extracted) return;
    const patch: Partial<BrandKit> = {};

    // Map colors by role (best-effort)
    const colors = extracted.colors || [];
    const findByRole = (role: string) =>
      colors.find(c => c.role?.toLowerCase().includes(role))?.hex;
    patch.primary_color = normalizeHex(findByRole('primary') || colors[0]?.hex);
    patch.secondary_color = normalizeHex(findByRole('secondary') || colors[1]?.hex);
    patch.accent_color = normalizeHex(findByRole('accent') || colors[2]?.hex);
    patch.text_color = normalizeHex(findByRole('text') || colors.find(c => c.role?.includes('neutral'))?.hex);
    patch.background_color = normalizeHex(findByRole('background'));
    patch.extended_palette = colors
      .map(c => normalizeHex(c.hex))
      .filter((c): c is string => !!c)
      .slice(0, 12);

    // Fonts — match to Google alternatives
    const headingFont = extracted.fonts?.find(f => f.usage === 'heading') || extracted.fonts?.[0];
    const bodyFont = extracted.fonts?.find(f => f.usage === 'body') || extracted.fonts?.[1] || headingFont;
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

    // Logos — pick the largest extracted image as primary
    const sortedLogos = [...(extracted.logos || [])].sort(
      (a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0),
    );
    if (sortedLogos[0]) patch.logo_primary_url = sortedLogos[0].url;
    if (sortedLogos[1]) patch.logo_mark_url = sortedLogos[1].url;

    // Voice
    if (extracted.tagline) patch.tagline = extracted.tagline;
    if (extracted.mission_statement) patch.mission_statement = extracted.mission_statement;
    if (extracted.voice_descriptors?.length) patch.voice_descriptors = extracted.voice_descriptors;

    patch.source = 'pdf_import';
    onApplied(patch);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Import from PDF brand guide
          </DialogTitle>
          <DialogDescription>
            Upload your brand guide PDF and we'll extract colors, fonts, logos, and messaging.
            Treat it as a starting point — review and adjust everything before saving.
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
              <p>• Embedded logos and images are pulled out for you to label.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            <div>
              <p className="text-sm font-medium mb-2">Detected colors</p>
              <div className="flex flex-wrap gap-2">
                {(extracted.colors || []).map((c, i) => (
                  <div
                    key={i}
                    className="h-12 w-12 rounded border border-border flex items-end justify-center"
                    style={{ backgroundColor: c.hex }}
                    title={`${c.hex}${c.role ? ' · ' + c.role : ''}`}
                  >
                    <span className="text-[10px] bg-background/90 px-1 rounded-t">{c.hex}</span>
                  </div>
                ))}
                {(!extracted.colors || extracted.colors.length === 0) && (
                  <p className="text-xs text-muted-foreground">No colors detected.</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Detected fonts</p>
              <div className="flex flex-wrap gap-2 text-sm">
                {(extracted.fonts || []).map((f, i) => (
                  <div key={i} className="px-2 py-1 rounded border border-border">
                    {f.name} {f.usage && f.usage !== 'unknown' && <span className="text-muted-foreground text-xs">({f.usage})</span>}
                    {' → '}
                    <span className="font-medium">{suggestFontAlternative(f.name)}</span>
                  </div>
                ))}
                {(!extracted.fonts || extracted.fonts.length === 0) && (
                  <p className="text-xs text-muted-foreground">No fonts detected.</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Detected logos</p>
              <div className="grid grid-cols-4 gap-2">
                {(extracted.logos || []).map((l, i) => (
                  <div key={i} className="h-20 border border-border rounded flex items-center justify-center bg-muted/30">
                    <img src={l.url} alt="" className="max-h-full max-w-full object-contain p-1" />
                  </div>
                ))}
                {(!extracted.logos || extracted.logos.length === 0) && (
                  <p className="text-xs text-muted-foreground col-span-4">No logo images extracted.</p>
                )}
              </div>
            </div>
            {(extracted.tagline || extracted.mission_statement) && (
              <div>
                <p className="text-sm font-medium mb-2">Messaging</p>
                {extracted.tagline && (
                  <p className="text-sm"><strong>Tagline:</strong> {extracted.tagline}</p>
                )}
                {extracted.mission_statement && (
                  <p className="text-sm"><strong>Mission:</strong> {extracted.mission_statement}</p>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          {!extracted ? (
            <Button onClick={handleProcess} disabled={!file || processing}>
              {processing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing PDF…</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Extract brand</>
              )}
            </Button>
          ) : (
            <Button onClick={applyExtracted}>
              Apply to brand kit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
