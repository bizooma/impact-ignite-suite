import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { usePlatformAdmin } from './usePlatformAdmin';
import {
  getQuantityLimits,
  normalizeTier,
  type SubscriptionTier,
  type QuantityLimits,
} from '@/lib/aiTierLimits';

const SOCIAL_PROVIDERS = ['facebook', 'instagram', 'linkedin', 'twitter', 'x'];

interface Counts {
  chatbots: number;
  qrCodes: number;
  socialAccounts: number;
}

interface CanCreate {
  chatbot: boolean;
  qrCode: boolean;
  socialAccount: boolean;
}

export function useTierLimits(organizationId?: string) {
  const { organization } = useOrganization();
  const { isPlatformAdmin } = usePlatformAdmin();
  const [counts, setCounts] = useState<Counts>({ chatbots: 0, qrCodes: 0, socialAccounts: 0 });
  const [loading, setLoading] = useState(true);

  const tier: SubscriptionTier = normalizeTier((organization as any)?.subscription_tier);
  const limits: QuantityLimits = getQuantityLimits(tier);

  const fetchCounts = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const [chatbotRes, qrRes, intRes] = await Promise.all([
        supabase.from('chatbots').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
        supabase.from('qr_codes').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
        supabase.from('integrations').select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .in('provider', SOCIAL_PROVIDERS as any),
      ]);
      setCounts({
        chatbots: chatbotRes.count ?? 0,
        qrCodes: qrRes.count ?? 0,
        socialAccounts: intRes.count ?? 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const under = (count: number, cap: number | null) => cap === null || count < cap;

  // Platform admins bypass limits
  const canCreate: CanCreate = {
    chatbot: isPlatformAdmin || under(counts.chatbots, limits.chatbots),
    qrCode: isPlatformAdmin || under(counts.qrCodes, limits.qrCodes),
    socialAccount: isPlatformAdmin || under(counts.socialAccounts, limits.socialAccounts),
  };

  return { tier, limits, counts, canCreate, loading, refetch: fetchCounts };
}

/** Friendly error message extractor for quota_exceeded DB errors. */
export function isQuotaError(error: any): string | null {
  const msg = error?.message ?? '';
  if (typeof msg === 'string' && msg.includes('quota_exceeded')) {
    // Strip "quota_exceeded: " prefix
    return msg.replace(/^.*quota_exceeded:\s*/, '').trim();
  }
  return null;
}
