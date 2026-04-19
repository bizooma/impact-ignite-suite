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
