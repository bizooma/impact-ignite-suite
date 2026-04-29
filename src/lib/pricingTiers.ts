/**
 * Single source of truth for pricing tier metadata used in the
 * self-serve upgrade flow (UpgradePrompt + Pricing pages).
 */
import { TIER_PRODUCT_BUNDLES, type ProductId, type SubscriptionTier } from './aiTierLimits';

export type { ProductId, SubscriptionTier };

export interface TierPricing {
  tier: SubscriptionTier;
  name: string;
  description: string;
  standardPrice: number; // monthly USD
  betaPrice: number;
  standardPriceId: string;
  betaPriceId: string;
  popular?: boolean;
  highlights: string[];
}

export const TIER_ORDER: SubscriptionTier[] = ['free', 'starter', 'professional', 'enterprise'];

export const TIER_CATALOG: Record<Exclude<SubscriptionTier, 'free'>, TierPricing> = {
  starter: {
    tier: 'starter',
    name: 'Starter',
    description: 'Perfect for small nonprofits getting started',
    standardPrice: 149,
    betaPrice: 59,
    standardPriceId: 'price_1TNyMZEV6sbsDlR8bYTs6kLz',
    betaPriceId: 'price_1TNzI6EV6sbsDlR8ZwzEiTHV',
    highlights: [
      '5 Team Members',
      'AI Chatbots (50 conversations/mo)',
      'CRM (up to 100 contacts)',
      '2 Social Media Accounts',
      'Email Support & SLA',
    ],
  },
  professional: {
    tier: 'professional',
    name: 'Professional',
    description: 'Advanced features for growing nonprofits',
    standardPrice: 349,
    betaPrice: 139,
    standardPriceId: 'price_1TNyNQEV6sbsDlR8l8rCOmOJ',
    betaPriceId: 'price_1TNzIREV6sbsDlR8ONhKHigi',
    popular: true,
    highlights: [
      'AI Chatbots (1,000 conversations/mo)',
      'Bring your own OpenAI key',
      'CRM (up to 1,000 contacts)',
      '10 Social Media Accounts',
      'Analytics',
    ],
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    description: 'Complete solution for large organizations',
    standardPrice: 549,
    betaPrice: 219,
    standardPriceId: 'price_1TNyNrEV6sbsDlR8lgWPM1AV',
    betaPriceId: 'price_1TNzJ0EV6sbsDlR8bT7hBiwc',
    highlights: [
      'AI Chatbots (5,000 conversations/mo)',
      'Unlimited CRM Contacts',
      'Unlimited QR & Social Accounts',
      'Campaigns & Google Business Profile',
      'Custom Mobile App',
    ],
  },
};

export function normalizeTier(raw: string | null | undefined): SubscriptionTier {
  const t = (raw ?? 'free').toLowerCase();
  if (t === 'starter' || t === 'professional' || t === 'enterprise' || t === 'free') return t;
  return 'free';
}

/**
 * Upgrade options strictly higher than current tier that include the requested product.
 */
export function getUpgradeOptionsFor(
  productId: ProductId,
  currentTier: SubscriptionTier
): TierPricing[] {
  const currentIdx = TIER_ORDER.indexOf(currentTier);
  const higher = TIER_ORDER.slice(currentIdx + 1).filter(
    (t): t is Exclude<SubscriptionTier, 'free'> => t !== 'free'
  );
  return higher
    .map((t) => TIER_CATALOG[t])
    .filter((t) => TIER_PRODUCT_BUNDLES[t.tier].includes(productId));
}
