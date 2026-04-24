import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Lock, Sparkles, Star, ArrowRight, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';
import {
  getUpgradeOptionsFor,
  normalizeTier,
  TIER_CATALOG,
  type ProductId,
  type TierPricing,
} from '@/lib/pricingTiers';

interface UpgradePromptProps {
  productId: ProductId;
  productName: string;
  description: string;
  features: string[];
}

export function UpgradePrompt({ productId, productName, description, features }: UpgradePromptProps) {
  const { organization } = useOrganization();
  const [loading, setLoading] = useState<string | null>(null);

  const currentTier = normalizeTier((organization as any)?.subscription_tier);
  const isBeta = !!(organization as any)?.is_beta_org;
  const upgradeOptions = getUpgradeOptionsFor(productId, currentTier);
  const isEnterprise = currentTier === 'enterprise';

  const handleSubscribe = async (tier: TierPricing) => {
    const priceId = isBeta ? tier.betaPriceId : tier.standardPriceId;
    setLoading(priceId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, tierName: isBeta ? `${tier.name} (Beta)` : tier.name },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  const handleManage = async () => {
    setLoading('portal');
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL received');
      }
    } catch (err) {
      console.error('Portal error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to open billing portal');
    } finally {
      setLoading(null);
    }
  };

  // Enterprise users: shouldn't normally hit this (they have everything), but if they do,
  // direct them to manage subscription (downgrade/cancel).
  if (isEnterprise || upgradeOptions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="max-w-xl w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Manage Your Subscription</CardTitle>
            <p className="text-muted-foreground">
              You're on our highest plan. To change products, downgrade, or cancel, use the billing portal.
            </p>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              size="lg"
              onClick={handleManage}
              disabled={loading === 'portal'}
            >
              {loading === 'portal' ? 'Opening…' : 'Open Billing Portal'}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <Badge variant="secondary" className="mb-3">Upgrade required</Badge>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          Unlock {productName}
        </h1>
        <p className="text-muted-foreground">{description}</p>

        {features.length > 0 && (
          <div className="mt-6 text-left inline-block">
            <h4 className="font-semibold mb-2 flex items-center gap-2 justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>What you'll get</span>
            </h4>
            <ul className="space-y-1.5">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {isBeta && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-center text-sm">
          <span className="font-semibold text-destructive">Beta lifetime pricing</span>
          <span className="text-muted-foreground"> — your discount stays locked in for as long as your subscription is active.</span>
        </div>
      )}

      {/* Upgrade tier cards */}
      <div className={`grid gap-6 ${upgradeOptions.length === 1 ? 'max-w-md mx-auto' : upgradeOptions.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : 'md:grid-cols-3'}`}>
        {upgradeOptions.map((tier) => {
          const price = isBeta ? tier.betaPrice : tier.standardPrice;
          const priceId = isBeta ? tier.betaPriceId : tier.standardPriceId;
          return (
            <Card
              key={tier.tier}
              className={`relative ${tier.popular ? 'border-primary shadow-lg' : 'hover:border-primary/30'} transition-all`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Star className="w-3.5 h-3.5 mr-1" />
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
                <div className="mt-3">
                  <div className="flex items-baseline justify-center gap-1.5">
                    <span className="text-3xl font-bold text-primary">${price}</span>
                    <span className="text-muted-foreground text-sm">/month</span>
                  </div>
                  {isBeta && (
                    <div className="mt-1 flex items-center justify-center gap-2">
                      <span className="text-xs text-muted-foreground line-through">${tier.standardPrice}/mo</span>
                      <Badge variant="secondary" className="text-[10px]">Beta lifetime</Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {tier.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={tier.popular ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(tier)}
                  disabled={loading === priceId}
                >
                  {loading === priceId ? 'Starting…' : `Upgrade to ${tier.name}`}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Manage existing subscription (paid users only) */}
      {currentTier !== 'free' && (
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={handleManage} disabled={loading === 'portal'}>
            <Settings className="w-4 h-4 mr-2" />
            {loading === 'portal' ? 'Opening…' : 'Manage current subscription'}
          </Button>
        </div>
      )}
    </div>
  );
}
