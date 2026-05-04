/**
 * Brand Kit utilities — color resolution, font helpers, and font-alternative matching
 * for PDF imports. Single source of truth for brand-related logic.
 */

import type { BrandKit, BrandKitColors } from '@/types/brandKit';

// Sensible defaults (match index.css design tokens roughly)
export const DEFAULT_BRAND_COLORS: BrandKitColors = {
  primary: '#1e40af',
  secondary: '#475569',
  accent: '#f59e0b',
  text: '#0f172a',
  background: '#ffffff',
};

/**
 * Resolve effective brand colors for a piece of UI.
 * Per-asset overrides win; otherwise pull from kit; otherwise defaults.
 */
export function resolveBrandColors(
  kit: BrandKit | null | undefined,
  override?: Partial<BrandKitColors>,
): BrandKitColors {
  return {
    primary: override?.primary || kit?.primary_color || DEFAULT_BRAND_COLORS.primary,
    secondary: override?.secondary || kit?.secondary_color || DEFAULT_BRAND_COLORS.secondary,
    accent: override?.accent || kit?.accent_color || DEFAULT_BRAND_COLORS.accent,
    text: override?.text || kit?.text_color || DEFAULT_BRAND_COLORS.text,
    background: override?.background || kit?.background_color || DEFAULT_BRAND_COLORS.background,
  };
}

/**
 * Inject brand colors as CSS variables on a root element so charts and
 * style="var(--brand-primary)" consumers pick them up automatically.
 */
export function applyBrandColorsToRoot(colors: BrandKitColors, root: HTMLElement = document.documentElement) {
  root.style.setProperty('--brand-primary', colors.primary);
  root.style.setProperty('--brand-secondary', colors.secondary);
  root.style.setProperty('--brand-accent', colors.accent);
  root.style.setProperty('--brand-text', colors.text);
  root.style.setProperty('--brand-background', colors.background);
}

/**
 * Inject a Google Fonts (or arbitrary) stylesheet link into <head>.
 * Returns a cleanup function.
 */
export function loadFontStylesheet(url: string | null | undefined): () => void {
  if (!url || typeof document === 'undefined') return () => {};
  const existing = document.head.querySelector(`link[data-brand-font="${url}"]`);
  if (existing) return () => {};
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  link.dataset.brandFont = url;
  document.head.appendChild(link);
  return () => {
    link.parentNode?.removeChild(link);
  };
}

/**
 * Build a Google Fonts URL from a family name (e.g. "Inter") and weights.
 */
export function googleFontUrl(family: string, weights: string[] = ['400', '600', '700']): string {
  const familyParam = family.trim().replace(/\s+/g, '+');
  const weightsParam = weights.join(';');
  return `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${weightsParam}&display=swap`;
}

/**
 * Curated mapping from common paid/proprietary fonts to free Google Font alternatives.
 * Used by the PDF importer to suggest substitutes when the brand guide names a font
 * that isn't freely available on the web.
 */
export const FONT_ALTERNATIVES: Record<string, string> = {
  'proxima nova': 'Montserrat',
  'gotham': 'Montserrat',
  'helvetica': 'Inter',
  'helvetica neue': 'Inter',
  'arial': 'Inter',
  'avenir': 'Nunito',
  'avenir next': 'Nunito',
  'futura': 'Jost',
  'din': 'Barlow',
  'din next': 'Barlow',
  'frutiger': 'Source Sans 3',
  'myriad': 'Source Sans 3',
  'myriad pro': 'Source Sans 3',
  'gill sans': 'Cabin',
  'optima': 'Spectral',
  'garamond': 'EB Garamond',
  'baskerville': 'Libre Baskerville',
  'bodoni': 'Playfair Display',
  'didot': 'Playfair Display',
  'caslon': 'Libre Caslon Text',
  'minion': 'Cormorant Garamond',
  'minion pro': 'Cormorant Garamond',
  'georgia': 'Lora',
  'times': 'Tinos',
  'times new roman': 'Tinos',
  'palatino': 'PT Serif',
  'trade gothic': 'Barlow Condensed',
  'univers': 'Roboto',
  'akzidenz grotesk': 'Roboto',
  'museo': 'Cabin',
  'museo sans': 'Cabin',
  'open sans': 'Open Sans', // already free
  'roboto': 'Roboto',
  'lato': 'Lato',
  'montserrat': 'Montserrat',
  'inter': 'Inter',
};

/**
 * Suggest a free Google Font alternative for a (possibly paid) font name.
 * Returns the name unchanged if it's already free/Google-hosted, or a sensible substitute.
 */
export function suggestFontAlternative(fontName: string): string {
  const key = fontName.trim().toLowerCase();
  return FONT_ALTERNATIVES[key] || fontName;
}

/**
 * Common Google Fonts shown in the picker (curated for nonprofit-friendly readability).
 */
export const POPULAR_GOOGLE_FONTS: string[] = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Nunito',
  'Poppins',
  'Source Sans 3',
  'Raleway',
  'Work Sans',
  'PT Sans',
  'Merriweather',
  'Lora',
  'Playfair Display',
  'EB Garamond',
  'Libre Baskerville',
  'Cormorant Garamond',
  'Spectral',
  'Crimson Text',
  'Bitter',
  'Cabin',
  'Barlow',
  'Jost',
  'DM Sans',
  'Manrope',
  'Karla',
];

/**
 * Validate a hex color string. Returns normalized 7-char form (#RRGGBB) or null.
 */
export function normalizeHex(input: string | null | undefined): string | null {
  if (!input) return null;
  const v = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(v)) {
    return '#' + v.split('').map(c => c + c).join('').toUpperCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(v)) {
    return '#' + v.toUpperCase();
  }
  return null;
}
