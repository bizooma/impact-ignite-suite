/**
 * useChatbotBranding — single source of truth for the colors, logo, and voice
 * a chatbot should render with at runtime.
 *
 * Resolution order for colors/logo (highest priority first):
 *   1. Per-chatbot override in `brand_settings` (when `use_brand_kit === false`,
 *      OR when the org has no brand kit yet)
 *   2. The org's Brand Kit (when `use_brand_kit !== false` and a kit exists)
 *   3. Hardcoded fallback defaults
 *
 * Welcome message and tone are always per-chatbot (they're conversational, not
 * visual brand). Logo: brand kit `logo_mark_url` is preferred for chat avatars,
 * with `logo_primary_url` as a fallback, then per-chatbot logo.
 */
import { useMemo } from 'react';
import { useBrandKit } from './useBrandKit';
import type { Chatbot } from '@/types/database';

const DEFAULT_PRIMARY = '#0066CC';
const DEFAULT_ACCENT = '#00AA44';

export interface ChatbotBranding {
  primary: string;
  accent: string;
  /** URL of an image to use as the bot avatar / launcher logo, or null. */
  logoUrl: string | null;
  welcomeMessage: string;
  tone: string;
  /** True if at least one branding value was sourced from the org's Brand Kit. */
  fromBrandKit: boolean;
}

export function useChatbotBranding(chatbot: Pick<Chatbot, 'organization_id' | 'brand_settings' | 'web_widget_config'> | null | undefined): ChatbotBranding {
  const { brandKit } = useBrandKit(chatbot?.organization_id);

  return useMemo(() => {
    const settings = chatbot?.brand_settings || {};
    const widget = chatbot?.web_widget_config || {};
    const useKit = settings.use_brand_kit !== false && !!brandKit;

    const kitPrimary = brandKit?.primary_color || null;
    const kitAccent = brandKit?.accent_color || null;
    const kitLogo = brandKit?.logo_mark_url || brandKit?.logo_primary_url || null;

    // When sync is on, kit values win; when off, per-chatbot wins.
    const primary = useKit
      ? (kitPrimary || settings.primary_color || DEFAULT_PRIMARY)
      : (settings.primary_color || kitPrimary || DEFAULT_PRIMARY);

    const accent = useKit
      ? (kitAccent || settings.accent_color || DEFAULT_ACCENT)
      : (settings.accent_color || kitAccent || DEFAULT_ACCENT);

    const logoUrl = useKit
      ? (kitLogo || widget.logo_url || settings.avatar_url || null)
      : (widget.logo_url || settings.avatar_url || kitLogo || null);

    const fromBrandKit =
      useKit && !!(kitPrimary || kitAccent || kitLogo);

    return {
      primary,
      accent,
      logoUrl,
      welcomeMessage: settings.welcome_message?.trim() || '',
      tone: settings.tone || '',
      fromBrandKit,
    };
  }, [chatbot, brandKit]);
}
