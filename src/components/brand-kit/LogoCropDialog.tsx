/**
 * Lightweight in-browser logo cropper.
 *
 * Renders the source image into a canvas with a draggable / resizable
 * crop rectangle overlay. On Save, exports the cropped region as a PNG
 * blob (preserving transparency) for upload to storage.
 *
 * No external dependencies — keeps the bundle small and avoids pulling in
 * a heavyweight crop library for a single use case.
 */
import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Crop as CropIcon, RotateCcw } from 'lucide-react';

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface LogoCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Source image URL (must be CORS-readable to allow canvas export). */
  imageUrl: string;
  /** Called with the cropped PNG blob when the user confirms. */
  onCropped: (blob: Blob) => Promise<void> | void;
}

export function LogoCropDialog({ open, onOpenChange, imageUrl, onCropped }: LogoCropDialogProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  // Crop is stored in NORMALIZED coords (0..1) so it survives container resizes
  const [crop, setCrop] = useState<CropRect>({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
  const [saving, setSaving] = useState(false);
  const [drag, setDrag] = useState<null | { mode: 'move' | 'nw' | 'ne' | 'sw' | 'se'; startX: number; startY: number; orig: CropRect }>(null);

  useEffect(() => {
    if (!open) {
      setCrop({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
      setImgSize(null);
      setSaving(false);
    }
  }, [open]);

  const onImgLoad = () => {
    const el = imgRef.current;
    if (!el) return;
    setImgSize({ w: el.naturalWidth, h: el.naturalHeight });
  };

  const startDrag = (e: React.PointerEvent, mode: 'move' | 'nw' | 'ne' | 'sw' | 'se') => {
    e.stopPropagation();
    e.preventDefault();
    const c = containerRef.current;
    if (!c) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    setDrag({ mode, startX: e.clientX, startY: e.clientY, orig: { ...crop } });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = (e.clientX - drag.startX) / rect.width;
    const dy = (e.clientY - drag.startY) / rect.height;
    let { x, y, w, h } = drag.orig;
    if (drag.mode === 'move') {
      x = clamp01(x + dx, w);
      y = clamp01(y + dy, h);
    } else {
      // Resize from the chosen corner; opposite corner stays fixed.
      const right = x + w;
      const bottom = y + h;
      if (drag.mode === 'nw') { x = Math.min(right - 0.05, Math.max(0, x + dx)); y = Math.min(bottom - 0.05, Math.max(0, y + dy)); w = right - x; h = bottom - y; }
      if (drag.mode === 'ne') { y = Math.min(bottom - 0.05, Math.max(0, y + dy)); w = Math.max(0.05, Math.min(1 - x, w + dx)); h = bottom - y; }
      if (drag.mode === 'sw') { x = Math.min(right - 0.05, Math.max(0, x + dx)); w = right - x; h = Math.max(0.05, Math.min(1 - y, h + dy)); }
      if (drag.mode === 'se') { w = Math.max(0.05, Math.min(1 - x, w + dx)); h = Math.max(0.05, Math.min(1 - y, h + dy)); }
    }
    setCrop({ x, y, w, h });
  };

  const endDrag = () => setDrag(null);

  const reset = () => setCrop({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });

  const save = async () => {
    if (!imgSize) return;
    setSaving(true);
    try {
      const canvas = document.createElement('canvas');
      const sx = Math.max(0, Math.floor(crop.x * imgSize.w));
      const sy = Math.max(0, Math.floor(crop.y * imgSize.h));
      const sw = Math.min(imgSize.w - sx, Math.ceil(crop.w * imgSize.w));
      const sh = Math.min(imgSize.h - sy, Math.ceil(crop.h * imgSize.h));
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext('2d');
      if (!ctx || !imgRef.current) throw new Error('Canvas unavailable');
      ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, sw, sh);
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
      if (!blob) throw new Error('Could not produce PNG');
      await onCropped(blob);
      onOpenChange(false);
    } catch (e: any) {
      console.error('Crop failed', e);
    } finally {
      setSaving(false);
    }
  };

  // Pixel positions for overlay rectangle
  const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="h-5 w-5 text-primary" />
            Crop logo
          </DialogTitle>
          <DialogDescription>
            Drag the corners to tighten the crop. The result is saved as a transparent PNG.
          </DialogDescription>
        </DialogHeader>

        <div
          ref={containerRef}
          className="relative bg-[conic-gradient(at_top_left,_#eee_25%,_#fff_25%_50%,_#eee_50%_75%,_#fff_75%)] [background-size:16px_16px] rounded border border-border overflow-hidden select-none touch-none"
          style={{ aspectRatio: imgSize ? `${imgSize.w} / ${imgSize.h}` : '4 / 3' }}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Logo source"
            crossOrigin="anonymous"
            onLoad={onImgLoad}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
          {imgSize && (
            <>
              {/* Dimming overlay (4 strips around the crop) */}
              <div className="absolute inset-x-0 top-0 bg-background/60" style={{ height: pct(crop.y) }} />
              <div className="absolute inset-x-0 bottom-0 bg-background/60" style={{ height: pct(1 - crop.y - crop.h) }} />
              <div className="absolute bg-background/60" style={{ top: pct(crop.y), height: pct(crop.h), left: 0, width: pct(crop.x) }} />
              <div className="absolute bg-background/60" style={{ top: pct(crop.y), height: pct(crop.h), right: 0, width: pct(1 - crop.x - crop.w) }} />
              {/* Crop rectangle */}
              <div
                className="absolute border-2 border-primary cursor-move"
                style={{ left: pct(crop.x), top: pct(crop.y), width: pct(crop.w), height: pct(crop.h) }}
                onPointerDown={e => startDrag(e, 'move')}
              >
                {(['nw', 'ne', 'sw', 'se'] as const).map(corner => (
                  <div
                    key={corner}
                    onPointerDown={e => startDrag(e, corner)}
                    className={`absolute h-3 w-3 bg-primary border border-background ${
                      corner === 'nw' ? '-top-1.5 -left-1.5 cursor-nwse-resize' :
                      corner === 'ne' ? '-top-1.5 -right-1.5 cursor-nesw-resize' :
                      corner === 'sw' ? '-bottom-1.5 -left-1.5 cursor-nesw-resize' :
                                        '-bottom-1.5 -right-1.5 cursor-nwse-resize'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
          {!imgSize && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        <DialogFooter className="flex sm:justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={reset} disabled={saving}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving || !imgSize}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : 'Save crop'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function clamp01(v: number, span: number): number {
  return Math.max(0, Math.min(1 - span, v));
}
