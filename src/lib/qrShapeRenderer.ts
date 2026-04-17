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

/**
 * Build a styled SVG string for a QR code by getting the raw module matrix
 * and rendering each "dark" module as the chosen shape.
 */
export function buildShapedSvg(opts: RenderOptions): string {
  const {
    url,
    shape = 'square',
    primaryColor = '#000000',
    backgroundColor = '#ffffff',
    margin = 2,
  } = opts;

  // Use the qrcode library's create() to get the raw matrix
  const qr = QRCode.create(url || ' ', { errorCorrectionLevel: 'H' });
  const moduleCount: number = qr.modules.size;
  const data: Uint8Array = qr.modules.data;

  const total = moduleCount + margin * 2;
  const cell = 1; // each module is 1 unit; viewBox handles scaling

  let modulesSvg = '';
  const isDecorative =
    shape === 'heart' || shape === 'star' || shape === 'cloud' || shape === 'sparkle';

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      const isDark = data[row * moduleCount + col] === 1;
      if (!isDark) continue;
      const x = col + margin;
      const y = row + margin;
      modulesSvg += renderModule(shape, x, y, cell, primaryColor, isDecorative);
    }
  }

  const overlay = isDecorative
    ? buildDecorativeOverlay(shape, total, primaryColor)
    : '';

  const px = opts.size ?? 512;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${total} ${total}" shape-rendering="${
    shape === 'square' || shape === 'rounded' ? 'crispEdges' : 'geometricPrecision'
  }"><rect width="${total}" height="${total}" fill="${backgroundColor}"/>${modulesSvg}${overlay}</svg>`;
}

function renderModule(
  shape: string,
  x: number,
  y: number,
  s: number,
  color: string,
  decorativeUsesSquare: boolean
): string {
  if (decorativeUsesSquare) {
    return `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${color}"/>`;
  }
  switch (shape) {
    case 'circle':
    case 'dots': {
      const r = shape === 'dots' ? s * 0.45 : s * 0.5;
      return `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="${r}" fill="${color}"/>`;
    }
    case 'rounded':
      return `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.3}" ry="${s * 0.3}" fill="${color}"/>`;
    case 'hexagon': {
      const pts = `${x + s * 0.25},${y} ${x + s * 0.75},${y} ${x + s},${y + s * 0.5} ${x + s * 0.75},${y + s} ${x + s * 0.25},${y + s} ${x},${y + s * 0.5}`;
      return `<polygon points="${pts}" fill="${color}"/>`;
    }
    case 'triangle': {
      const pts = `${x + s / 2},${y} ${x + s},${y + s} ${x},${y + s}`;
      return `<polygon points="${pts}" fill="${color}"/>`;
    }
    case 'square':
    default:
      return `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${color}"/>`;
  }
}

function buildDecorativeOverlay(shape: string, total: number, color: string): string {
  const w = total;
  const h = total;
  const cx = w / 2;
  const cy = h / 2;
  const sw = Math.max(w, h) * 0.04;

  if (shape === 'heart') {
    return `<path d="M${cx},${h * 0.95} C${cx},${h * 0.95} ${w * 0.05},${h * 0.55} ${w * 0.05},${h * 0.3} C${w * 0.05},${h * 0.05} ${w * 0.3},${-h * 0.05} ${cx},${h * 0.18} C${w * 0.7},${-h * 0.05} ${w * 0.95},${h * 0.05} ${w * 0.95},${h * 0.3} C${w * 0.95},${h * 0.55} ${cx},${h * 0.95} ${cx},${h * 0.95} Z" fill="none" stroke="${color}" stroke-width="${sw}" opacity="0.9"/>`;
  }
  if (shape === 'star') {
    const outer = Math.min(w, h) * 0.49;
    const inner = outer * 0.45;
    let pts = '';
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? outer : inner;
      pts += `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)} `;
    }
    return `<polygon points="${pts.trim()}" fill="none" stroke="${color}" stroke-width="${sw}" opacity="0.9"/>`;
  }
  if (shape === 'cloud') {
    return `<path d="M${w * 0.2},${h * 0.78} Q${w * 0.05},${h * 0.78} ${w * 0.05},${h * 0.55} Q${w * 0.05},${h * 0.3} ${w * 0.28},${h * 0.25} Q${w * 0.3},${h * 0.08} ${w * 0.5},${h * 0.08} Q${w * 0.7},${h * 0.08} ${w * 0.72},${h * 0.25} Q${w * 0.95},${h * 0.3} ${w * 0.95},${h * 0.55} Q${w * 0.95},${h * 0.78} ${w * 0.8},${h * 0.78} Z" fill="none" stroke="${color}" stroke-width="${sw}" opacity="0.9"/>`;
  }
  if (shape === 'sparkle') {
    const sparks: [number, number, number][] = [
      [w * 0.08, h * 0.08, w * 0.04],
      [w * 0.92, h * 0.08, w * 0.035],
      [w * 0.08, h * 0.92, w * 0.035],
      [w * 0.92, h * 0.92, w * 0.04],
      [w * 0.5, h * 0.04, w * 0.025],
    ];
    return sparks
      .map(
        ([x, y, sz]) =>
          `<path d="M${x},${y - sz} L${x},${y + sz} M${x - sz},${y} L${x + sz},${y} M${x - sz * 0.7},${y - sz * 0.7} L${x + sz * 0.7},${y + sz * 0.7} M${x - sz * 0.7},${y + sz * 0.7} L${x + sz * 0.7},${y - sz * 0.7}" stroke="${color}" stroke-width="${sw * 0.5}" opacity="0.6"/>`
      )
      .join('');
  }
  return '';
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
