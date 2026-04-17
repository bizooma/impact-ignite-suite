import QRCode from 'qrcode';

export type QrShapeName =
  | 'square'
  | 'circle'
  | 'rounded'
  | 'dots'
  | 'heart'
  | 'star'
  | 'hexagon'
  | 'triangle'
  | 'cloud'
  | 'sparkle';

interface RenderOptions {
  url: string;
  shape?: QrShapeName | string;
  primaryColor?: string;
  backgroundColor?: string;
  size?: number;
  margin?: number;
}

/**
 * Render a QR code as a PNG data URL with optional shape transformations.
 */
export async function renderShapedQrPng(opts: RenderOptions): Promise<string> {
  const svg = buildShapedSvg(opts);
  return svgToPngDataUrl(svg, opts.size ?? 512);
}

// Shapes that change the OVERALL silhouette of the QR artwork.
const SILHOUETTE_SHAPES = new Set([
  'circle',
  'heart',
  'star',
  'hexagon',
  'triangle',
  'cloud',
  'sparkle',
]);

// Shapes that only change individual MODULE rendering (canvas stays square).
const MODULE_STYLE_SHAPES = new Set(['dots', 'rounded', 'square']);

/**
 * Build a styled SVG string for a QR code.
 *
 * For silhouette shapes (heart, circle, etc.), the QR modules are placed in an
 * inscribed rectangle and the surrounding artwork takes the silhouette form.
 * For module-style shapes (dots, rounded, square), the canvas stays square.
 */
export function buildShapedSvg(opts: RenderOptions): string {
  const {
    url,
    shape = 'square',
    primaryColor = '#000000',
    backgroundColor = '#ffffff',
    margin = 2,
  } = opts;

  const qr = QRCode.create(url || ' ', { errorCorrectionLevel: 'H' });
  const moduleCount: number = qr.modules.size;
  const data: Uint8Array = qr.modules.data;

  const isSilhouette = SILHOUETTE_SHAPES.has(shape);
  const moduleStyle: 'square' | 'dots' | 'rounded' = isSilhouette
    ? 'square'
    : (MODULE_STYLE_SHAPES.has(shape) ? (shape as 'square' | 'dots' | 'rounded') : 'square');

  const px = opts.size ?? 512;

  if (!isSilhouette) {
    // ----- Square canvas (original behavior, simplified) -----
    const total = moduleCount + margin * 2;
    let modulesSvg = '';
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (data[row * moduleCount + col] !== 1) continue;
        const x = col + margin;
        const y = row + margin;
        modulesSvg += renderModule(moduleStyle, x, y, 1, primaryColor);
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${total} ${total}" shape-rendering="${
      moduleStyle === 'dots' ? 'geometricPrecision' : 'crispEdges'
    }"><rect width="${total}" height="${total}" fill="${backgroundColor}"/>${modulesSvg}</svg>`;
  }

  // ----- Silhouette canvas -----
  // viewBox is 100x100 for easy path math.
  const VB = 100;
  // Inscribed rect (centered) where the QR grid lives. Tuned per shape so all
  // dark modules fit inside the silhouette and remain scannable.
  const inscribed = getInscribedRect(shape, VB);
  const cell = inscribed.size / moduleCount;

  let modulesSvg = '';
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (data[row * moduleCount + col] !== 1) continue;
      const x = inscribed.x + col * cell;
      const y = inscribed.y + row * cell;
      modulesSvg += `<rect x="${x.toFixed(3)}" y="${y.toFixed(3)}" width="${cell.toFixed(3)}" height="${cell.toFixed(3)}" fill="${primaryColor}"/>`;
    }
  }

  const silhouettePath = getSilhouettePath(shape, VB);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${VB} ${VB}" shape-rendering="geometricPrecision">` +
    `<path d="${silhouettePath}" fill="${backgroundColor}"/>` +
    `<g>${modulesSvg}</g>` +
    `</svg>`;
}

function renderModule(
  style: 'square' | 'dots' | 'rounded',
  x: number,
  y: number,
  s: number,
  color: string
): string {
  switch (style) {
    case 'dots':
      return `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="${s * 0.45}" fill="${color}"/>`;
    case 'rounded':
      return `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.3}" ry="${s * 0.3}" fill="${color}"/>`;
    case 'square':
    default:
      return `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${color}"/>`;
  }
}

/**
 * Inscribed rectangle (centered) where the QR grid is placed for each
 * silhouette shape. Sized so modules fit comfortably inside the silhouette.
 */
function getInscribedRect(shape: string, vb: number): { x: number; y: number; size: number } {
  const center = vb / 2;
  let size: number;
  let cy = center;
  switch (shape) {
    case 'circle':
      // Largest square inscribed in circle of radius vb/2 → side = vb/√2
      size = vb / Math.SQRT2 * 0.95;
      break;
    case 'hexagon':
      size = vb * 0.7;
      break;
    case 'triangle':
      // QR sits in lower portion of triangle
      size = vb * 0.5;
      cy = vb * 0.62;
      break;
    case 'heart':
      size = vb * 0.55;
      cy = vb * 0.5;
      break;
    case 'star':
      size = vb * 0.45;
      break;
    case 'cloud':
      size = vb * 0.55;
      cy = vb * 0.5;
      break;
    case 'sparkle':
      size = vb * 0.6;
      break;
    default:
      size = vb * 0.8;
  }
  return { x: center - size / 2, y: cy - size / 2, size };
}

/**
 * SVG path 'd' attribute for the silhouette of each shape, sized to viewBox.
 */
function getSilhouettePath(shape: string, vb: number): string {
  const w = vb;
  const h = vb;
  const cx = w / 2;
  const cy = h / 2;

  switch (shape) {
    case 'circle': {
      const r = vb / 2;
      return `M ${cx} ${cy - r} a ${r} ${r} 0 1 0 0.001 0 Z`;
    }
    case 'hexagon': {
      const r = vb / 2;
      const pts = [
        [cx - r * 0.5, cy - r * 0.866],
        [cx + r * 0.5, cy - r * 0.866],
        [cx + r, cy],
        [cx + r * 0.5, cy + r * 0.866],
        [cx - r * 0.5, cy + r * 0.866],
        [cx - r, cy],
      ];
      return 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z';
    }
    case 'triangle': {
      // Equilateral-ish, point up
      return `M ${cx} 2 L ${w - 2} ${h - 2} L 2 ${h - 2} Z`;
    }
    case 'heart': {
      // Classic heart path scaled to viewBox
      return `M ${cx} ${h * 0.95}
        C ${cx} ${h * 0.95} ${w * 0.02} ${h * 0.55} ${w * 0.02} ${h * 0.32}
        C ${w * 0.02} ${h * 0.08} ${w * 0.28} ${-h * 0.05} ${cx} ${h * 0.22}
        C ${w * 0.72} ${-h * 0.05} ${w * 0.98} ${h * 0.08} ${w * 0.98} ${h * 0.32}
        C ${w * 0.98} ${h * 0.55} ${cx} ${h * 0.95} ${cx} ${h * 0.95} Z`;
    }
    case 'star': {
      const outer = Math.min(w, h) * 0.5;
      const inner = outer * 0.45;
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? outer : inner;
        pts.push(`${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`);
      }
      return 'M ' + pts.join(' L ') + ' Z';
    }
    case 'cloud': {
      // Puffy cloud silhouette
      return `M ${w * 0.2} ${h * 0.78}
        C ${w * 0.05} ${h * 0.78} ${w * 0.02} ${h * 0.55} ${w * 0.15} ${h * 0.5}
        C ${w * 0.1} ${h * 0.3} ${w * 0.32} ${h * 0.18} ${w * 0.42} ${h * 0.28}
        C ${w * 0.48} ${h * 0.1} ${w * 0.7} ${h * 0.12} ${w * 0.72} ${h * 0.32}
        C ${w * 0.92} ${h * 0.28} ${w * 0.98} ${h * 0.55} ${w * 0.82} ${h * 0.6}
        C ${w * 0.95} ${h * 0.78} ${w * 0.75} ${h * 0.85} ${w * 0.6} ${h * 0.78}
        L ${w * 0.2} ${h * 0.78} Z`;
    }
    case 'sparkle': {
      // 4-point sparkle / diamond burst
      const r = vb / 2;
      const t = r * 0.18; // waist thickness
      return `M ${cx} 0
        C ${cx + t} ${cy - t} ${cx + r - t} ${cy - t} ${w} ${cy}
        C ${cx + r - t} ${cy + t} ${cx + t} ${cy + t} ${cx} ${h}
        C ${cx - t} ${cy + t} ${cx - r + t} ${cy + t} 0 ${cy}
        C ${cx - r + t} ${cy - t} ${cx - t} ${cy - t} ${cx} 0 Z`;
    }
    default:
      return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
  }
}

function svgToPngDataUrl(svg: string, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}
