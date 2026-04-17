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
  size?: number; // pixel size of output PNG
  margin?: number;
}

/**
 * Render a QR code as a PNG data URL with optional shape transformations.
 * Works in the browser by generating SVG, transforming it, then rasterizing.
 */
export async function renderShapedQrPng(opts: RenderOptions): Promise<string> {
  const {
    url,
    shape = 'square',
    primaryColor = '#000000',
    backgroundColor = '#ffffff',
    size = 512,
    margin = 1,
  } = opts;

  // Generate SVG string from qrcode lib
  const svg = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin,
    color: { dark: primaryColor, light: backgroundColor },
  });

  const shaped = applyShapeToSvg(svg, shape, primaryColor);

  return svgToPngDataUrl(shaped, size);
}

function applyShapeToSvg(svgString: string, shape: string, color: string): string {
  switch (shape) {
    case 'circle':
      return svgString.replace(
        /<rect([^>]*?)width="([^"]*)"([^>]*?)height="([^"]*)"([^>]*?)\/>/g,
        (_m, before, width, middle, height, after) => {
          const xMatch = (before + middle + after).match(/x="([^"]+)"/);
          const yMatch = (before + middle + after).match(/y="([^"]+)"/);
          const x = xMatch ? parseFloat(xMatch[1]) : 0;
          const y = yMatch ? parseFloat(yMatch[1]) : 0;
          const w = parseFloat(width);
          const h = parseFloat(height);
          if (x === 0 && y === 0 && w > 20 && h > 20) {
            return `<rect${before}width="${width}"${middle}height="${height}"${after}/>`;
          }
          const r = Math.min(w, h) / 2;
          return `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${r}" fill="${color}"/>`;
        }
      );
    case 'rounded':
      return svgString.replace(/<rect /g, '<rect rx="0.3" ry="0.3" ');
    case 'dots':
      return svgString.replace(
        /<rect([^>]*?)width="([^"]*)"([^>]*?)height="([^"]*)"([^>]*?)\/>/g,
        (_m, before, width, middle, height, after) => {
          const xMatch = (before + middle + after).match(/x="([^"]+)"/);
          const yMatch = (before + middle + after).match(/y="([^"]+)"/);
          const x = xMatch ? parseFloat(xMatch[1]) : 0;
          const y = yMatch ? parseFloat(yMatch[1]) : 0;
          const w = parseFloat(width);
          const h = parseFloat(height);
          if (x === 0 && y === 0 && w > 20 && h > 20) {
            return `<rect${before}width="${width}"${middle}height="${height}"${after}/>`;
          }
          const r = Math.min(w, h) * 0.45;
          return `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${r}" fill="${color}"/>`;
        }
      );
    case 'hexagon':
      return svgString.replace(
        /<rect([^>]*?)width="([^"]*)"([^>]*?)height="([^"]*)"([^>]*?)\/>/g,
        (_m, before, width, middle, height, after) => {
          const xMatch = (before + middle + after).match(/x="([^"]+)"/);
          const yMatch = (before + middle + after).match(/y="([^"]+)"/);
          const x = xMatch ? parseFloat(xMatch[1]) : 0;
          const y = yMatch ? parseFloat(yMatch[1]) : 0;
          const w = parseFloat(width);
          const h = parseFloat(height);
          if (x === 0 && y === 0 && w > 20 && h > 20) {
            return `<rect${before}width="${width}"${middle}height="${height}"${after}/>`;
          }
          const pts = `${x + w * 0.25},${y} ${x + w * 0.75},${y} ${x + w},${y + h * 0.5} ${x + w * 0.75},${y + h} ${x + w * 0.25},${y + h} ${x},${y + h * 0.5}`;
          return `<polygon points="${pts}" fill="${color}"/>`;
        }
      );
    case 'triangle':
      return svgString.replace(
        /<rect([^>]*?)width="([^"]*)"([^>]*?)height="([^"]*)"([^>]*?)\/>/g,
        (_m, before, width, middle, height, after) => {
          const xMatch = (before + middle + after).match(/x="([^"]+)"/);
          const yMatch = (before + middle + after).match(/y="([^"]+)"/);
          const x = xMatch ? parseFloat(xMatch[1]) : 0;
          const y = yMatch ? parseFloat(yMatch[1]) : 0;
          const w = parseFloat(width);
          const h = parseFloat(height);
          if (x === 0 && y === 0 && w > 20 && h > 20) {
            return `<rect${before}width="${width}"${middle}height="${height}"${after}/>`;
          }
          const pts = `${x + w / 2},${y} ${x + w},${y + h} ${x},${y + h}`;
          return `<polygon points="${pts}" fill="${color}"/>`;
        }
      );
    case 'heart':
    case 'star':
    case 'cloud':
    case 'sparkle':
      return addDecorativeFrame(svgString, shape, color);
    case 'square':
    default:
      return svgString;
  }
}

function addDecorativeFrame(svg: string, shape: string, color: string): string {
  const vbMatch = svg.match(/viewBox="([^"]*)"/);
  if (!vbMatch) return svg;
  const [, , w, h] = vbMatch[1].split(/\s+/).map(Number);
  const cx = w / 2;
  const cy = h / 2;
  let overlay = '';
  if (shape === 'heart') {
    overlay = `<path d="M${cx},${h * 0.95} C${cx},${h * 0.95} ${w * 0.05},${h * 0.55} ${w * 0.05},${h * 0.3} C${w * 0.05},${h * 0.05} ${w * 0.3},${-h * 0.05} ${cx},${h * 0.18} C${w * 0.7},${-h * 0.05} ${w * 0.95},${h * 0.05} ${w * 0.95},${h * 0.3} C${w * 0.95},${h * 0.55} ${cx},${h * 0.95} ${cx},${h * 0.95} Z" fill="none" stroke="${color}" stroke-width="${Math.max(w, h) * 0.015}" opacity="0.4"/>`;
  } else if (shape === 'star') {
    const outer = Math.min(w, h) * 0.49;
    const inner = outer * 0.45;
    let pts = '';
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? outer : inner;
      pts += `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)} `;
    }
    overlay = `<polygon points="${pts.trim()}" fill="none" stroke="${color}" stroke-width="${Math.max(w, h) * 0.015}" opacity="0.4"/>`;
  } else if (shape === 'cloud') {
    overlay = `<path d="M${w * 0.2},${h * 0.75} Q${w * 0.05},${h * 0.75} ${w * 0.05},${h * 0.55} Q${w * 0.05},${h * 0.3} ${w * 0.28},${h * 0.25} Q${w * 0.3},${h * 0.1} ${w * 0.5},${h * 0.1} Q${w * 0.7},${h * 0.1} ${w * 0.72},${h * 0.25} Q${w * 0.95},${h * 0.3} ${w * 0.95},${h * 0.55} Q${w * 0.95},${h * 0.75} ${w * 0.8},${h * 0.75} Z" fill="none" stroke="${color}" stroke-width="${Math.max(w, h) * 0.015}" opacity="0.4"/>`;
  } else if (shape === 'sparkle') {
    const sparks = [
      [w * 0.08, h * 0.08, w * 0.04],
      [w * 0.92, h * 0.08, w * 0.035],
      [w * 0.08, h * 0.92, w * 0.035],
      [w * 0.92, h * 0.92, w * 0.04],
      [w * 0.5, h * 0.04, w * 0.025],
    ];
    overlay = sparks
      .map(
        ([x, y, s]) =>
          `<path d="M${x},${y - s} L${x},${y + s} M${x - s},${y} L${x + s},${y} M${x - s * 0.7},${y - s * 0.7} L${x + s * 0.7},${y + s * 0.7} M${x - s * 0.7},${y + s * 0.7} L${x + s * 0.7},${y - s * 0.7}" stroke="${color}" stroke-width="${Math.max(w, h) * 0.005}" opacity="0.5"/>`
      )
      .join('');
  }
  return svg.replace('</svg>', `${overlay}</svg>`);
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
