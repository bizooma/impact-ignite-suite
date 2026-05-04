/**
 * useQrBranding — resolves the foreground/background colors and logo a QR code
 * should render with at runtime, blending the org's Brand Kit with per-QR
 * overrides.
 *
 * Resolution order (highest priority first):
 *   1. Per-QR override in `brand_config` (when `use_brand_kit === false`,
 *      OR when the org has no brand kit yet)
 *   2. The org's Brand Kit primary/background/logo (when sync is on)
 *   3. Hardcoded fallback defaults (#000 on #FFF, no logo)
 *
 * Defaults to syncing with the brand kit unless `use_brand_kit` is explicitly
 * `false` in `brand_config`.
 */
import { useMemo } from 'react';
import { useBrandKit } from './useBrandKit';

const DEFAULT_FG = '#000000';
const DEFAULT_BG = '#FFFFFF';

export interface QrBrandConfig {
  use_brand_kit?: boolean;
  primaryColor?: string;
  backgroundColor?: string;
  logoUrl?: string;
  // Legacy field used by the create dialog
  logo?: string;
}

export interface QrBranding {
  foreground: string;
  background: string;
  logoUrl: string | null;
  fromBrandKit: boolean;
}

export function useQrBranding(
  organizationId: string | undefined,
  brandConfig?: QrBrandConfig | null,
): QrBranding {
  const { brandKit } = useBrandKit(organizationId);

  return useMemo(() => {
    const cfg = (brandConfig || {}) as QrBrandConfig;
    const useKit = cfg.use_brand_kit !== false && !!brandKit;

    // Brand Kit values: primary = QR foreground, background = QR background.
    // If background isn't set on the kit, default to white for printability.
    const kitFg = brandKit?.primary_color || null;
    const kitBg = brandKit?.background_color || (brandKit ? '#FFFFFF' : null);
    const kitLogo = brandKit?.logo_mark_url || brandKit?.logo_primary_url || null;

    const overrideLogo = cfg.logoUrl || cfg.logo || null;

    const foreground = useKit
      ? (kitFg || cfg.primaryColor || DEFAULT_FG)
      : (cfg.primaryColor || kitFg || DEFAULT_FG);

    const background = useKit
      ? (kitBg || cfg.backgroundColor || DEFAULT_BG)
      : (cfg.backgroundColor || kitBg || DEFAULT_BG);

    const logoUrl = useKit
      ? (kitLogo || overrideLogo)
      : (overrideLogo || kitLogo);

    return {
      foreground,
      background,
      logoUrl,
      fromBrandKit: useKit && !!(kitFg || kitBg || kitLogo),
    };
  }, [brandConfig, brandKit]);
}

/**
 * Pure helper for one-off QR rendering when you already have the brand kit
 * loaded (e.g. inside the dashboard list where colors might come from any of
 * dozens of QRs). Mirrors the hook's resolution order.
 */
export function resolveQrBranding(
  brandKit: {
    primary_color?: string | null;
    background_color?: string | null;
    logo_mark_url?: string | null;
    logo_primary_url?: string | null;
  } | null | undefined,
  brandConfig?: QrBrandConfig | null,
): QrBranding {
  const cfg = (brandConfig || {}) as QrBrandConfig;
  const useKit = cfg.use_brand_kit !== false && !!brandKit;

  const kitFg = brandKit?.primary_color || null;
  const kitBg = brandKit?.background_color || (brandKit ? '#FFFFFF' : null);
  const kitLogo = brandKit?.logo_mark_url || brandKit?.logo_primary_url || null;
  const overrideLogo = cfg.logoUrl || cfg.logo || null;

  return {
    foreground: useKit
      ? (kitFg || cfg.primaryColor || DEFAULT_FG)
      : (cfg.primaryColor || kitFg || DEFAULT_FG),
    background: useKit
      ? (kitBg || cfg.backgroundColor || DEFAULT_BG)
      : (cfg.backgroundColor || kitBg || DEFAULT_BG),
    logoUrl: useKit ? (kitLogo || overrideLogo) : (overrideLogo || kitLogo),
    fromBrandKit: useKit && !!(kitFg || kitBg || kitLogo),
  };
}
