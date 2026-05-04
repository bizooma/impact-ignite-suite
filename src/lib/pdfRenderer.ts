/**
 * Client-side PDF page rasterizer used by the brand-kit PDF importer.
 *
 * Rendering pages to PNGs in the browser (where pdfjs-dist is rock solid)
 * is far more reliable than attempting it inside a Deno edge function.
 * The edge function then receives ready-to-analyze page images.
 */
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface RenderedPage {
  /** 1-indexed page number */
  pageNumber: number;
  /** PNG data URL */
  dataUrl: string;
  /** Rendered pixel width (used to interpret bbox coords) */
  width: number;
  /** Rendered pixel height */
  height: number;
}

/**
 * Render up to `maxPages` pages of a PDF to PNG data URLs.
 * Pages are scaled to fit within `maxDimension` on the longer edge to keep
 * payloads small (Gemini multimodal calls don't need huge images for layout
 * analysis — ~1024px is plenty for logo detection).
 */
export async function renderPdfPagesToPngs(
  file: File,
  opts: { maxPages?: number; maxDimension?: number } = {},
): Promise<RenderedPage[]> {
  const maxPages = opts.maxPages ?? 8;
  const maxDimension = opts.maxDimension ?? 1024;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageCount = Math.min(pdf.numPages, maxPages);
  const pages: RenderedPage[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    // viewport at scale 1 gives PDF-point dimensions; we scale to fit maxDimension
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(
      maxDimension / Math.max(baseViewport.width, baseViewport.height),
      2, // never upscale beyond 2x
    );
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    pages.push({
      pageNumber: i,
      dataUrl: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height,
    });
  }

  return pages;
}
