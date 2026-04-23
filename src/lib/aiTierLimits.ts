/**
 * Single source of truth for AI usage caps per subscription tier.
 * Edit these numbers to tune monthly chat-message limits.
 *
 * BYO OpenAI key holders are NEVER capped — usage is metered only.
 */

export type SubscriptionTier = "free" | "starter" | "professional" | "enterprise";

export interface TierLimits {
  /** Hard ceiling on chat messages per calendar month. */
  monthlyMessageCap: number;
  /** Display label for UI. */
  label: string;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: { monthlyMessageCap: 50, label: "Free" },
  starter: { monthlyMessageCap: 1_000, label: "Starter" },
  professional: { monthlyMessageCap: 5_000, label: "Professional" },
  enterprise: { monthlyMessageCap: 25_000, label: "Enterprise" },
};

/**
 * Product bundles included with each subscription tier.
 * Applied automatically by `check-subscription` edge function on subscription change.
 * NOTE: Manual platform-admin overrides to `purchased_products` will be reset on next sync.
 */
export type ProductId =
  | 'mobile_app' | 'chatbots' | 'qr_codes' | 'social_media' | 'seo_audits'
  | 'google_business' | 'tasks' | 'analytics' | 'crm' | 'campaigns' | 'accessibility';

export const TIER_PRODUCT_BUNDLES: Record<SubscriptionTier, ProductId[]> = {
  free: ['chatbots', 'qr_codes'],
  starter: ['chatbots', 'qr_codes', 'social_media', 'seo_audits', 'analytics', 'accessibility'],
  professional: [
    'chatbots', 'qr_codes', 'social_media', 'seo_audits', 'analytics',
    'crm', 'tasks', 'google_business', 'campaigns', 'accessibility',
  ],
  enterprise: [
    'chatbots', 'qr_codes', 'social_media', 'seo_audits', 'analytics',
    'crm', 'tasks', 'google_business', 'campaigns', 'mobile_app', 'accessibility',
  ],
};

/**
 * Quantity caps per tier. `null` = unlimited.
 * Mirrored in DB tier_limit() function — keep in sync.
 */
export interface QuantityLimits {
  chatbots: number | null;
  qrCodes: number | null;
  socialAccounts: number | null;
}

export const TIER_QUANTITY_LIMITS: Record<SubscriptionTier, QuantityLimits> = {
  free: { chatbots: 1, qrCodes: 5, socialAccounts: 1 },
  starter: { chatbots: 3, qrCodes: 25, socialAccounts: 3 },
  professional: { chatbots: 10, qrCodes: 100, socialAccounts: 10 },
  enterprise: { chatbots: null, qrCodes: null, socialAccounts: null },
};

export function getQuantityLimits(tier: string | null | undefined): QuantityLimits {
  return TIER_QUANTITY_LIMITS[normalizeTier(tier)];
}

export function formatCap(cap: number | null): string {
  return cap === null ? 'Unlimited' : cap.toLocaleString();
}

export function normalizeTier(raw: string | null | undefined): SubscriptionTier {
  const t = (raw ?? "free").toLowerCase();
  if (t === "starter" || t === "professional" || t === "enterprise" || t === "free") {
    return t;
  }
  // Map any unexpected value to free for safety
  return "free";
}

export function getTierLimits(tier: string | null | undefined): TierLimits {
  return TIER_LIMITS[normalizeTier(tier)];
}

/** Returns 0..1 representing usage / cap. */
export function usagePct(used: number, cap: number): number {
  if (cap <= 0) return 1;
  return Math.min(1, used / cap);
}

export function usageBucket(pct: number): "ok" | "warn" | "critical" | "blocked" {
  if (pct >= 1) return "blocked";
  if (pct >= 0.95) return "critical";
  if (pct >= 0.8) return "warn";
  return "ok";
}
