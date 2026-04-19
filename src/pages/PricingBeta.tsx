import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Sparkles, Star, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { TIER_LIMITS } from "@/lib/aiTierLimits";

const BETA_TIERS = {
  starter: {
    name: "Starter",
    betaPrice: "$59",
    standardPrice: "$149",
    description: "Perfect for small nonprofits getting started",
    priceId: "price_1TNzI6EV6sbsDlR8ZwzEiTHV",
    popular: false,
    features: [
      `${TIER_LIMITS.starter.monthlyMessageCap.toLocaleString()} AI chat messages/month`,
      "Bring your own OpenAI key (unlimited)",
      "3 AI Chatbots",
      "25 QR Codes",
      "3 Social Media Accounts",
      "SEO Audits & Analytics",
      "Email Support",
      "Custom Branding",
    ],
  },
  professional: {
    name: "Professional",
    betaPrice: "$139",
    standardPrice: "$349",
    description: "Advanced features for growing nonprofits",
    priceId: "price_1TNzIREV6sbsDlR8ONhKHigi",
    popular: true,
    features: [
      `${TIER_LIMITS.professional.monthlyMessageCap.toLocaleString()} AI chat messages/month`,
      "Bring your own OpenAI key (unlimited)",
      "10 AI Chatbots",
      "100 QR Codes",
      "10 Social Media Accounts",
      "CRM, Tasks, Campaigns & Google Business",
      "SEO Audits & Analytics",
      "Custom Branding",
      "Priority Support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    betaPrice: "$219",
    standardPrice: "$549",
    description: "Complete solution for large organizations",
    priceId: "price_1TNzJ0EV6sbsDlR8bT7hBiwc",
    popular: false,
    features: [
      `${TIER_LIMITS.enterprise.monthlyMessageCap.toLocaleString()} AI chat messages/month`,
      "Bring your own OpenAI key (unlimited)",
      "Unlimited AI Chatbots",
      "Unlimited QR Codes",
      "Unlimited Social Accounts",
      "All CRM, Campaigns, SEO & Analytics tools",
      "Custom Branding",
      "SLA Guarantee",
    ],
  },
} as const;

const PricingBeta = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { organization, organizations, loading: orgLoading } = useOrganization();
  const [graceDone, setGraceDone] = useState(false);

  // Give the org provider a brief grace period right after signup so a freshly
  // provisioned beta org has time to load before we redirect away.
  useEffect(() => {
    const t = setTimeout(() => setGraceDone(true), 2500);
    return () => clearTimeout(t);
  }, []);

  if (authLoading || orgLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If we have any beta org in the user's memberships, surface it (handles the
  // case where another non-beta org was selected as the default).
  const betaOrg = organizations.find((o) => (o as any).is_beta_org);
  const activeOrg = (organization as any)?.is_beta_org ? organization : betaOrg;

  if (!activeOrg) {
    if (!graceDone) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    return <Navigate to="/pricing" replace />;
  }

  const handleSubscribe = async (priceId: string, tierName: string) => {
    setLoading(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, tierName: `${tierName} (Beta)` },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start subscription. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Red beta banner — high-contrast to grab attention */}
      <div className="rounded-xl border-2 border-red-500/50 bg-gradient-to-r from-red-500/15 via-red-500/10 to-red-500/15 px-6 py-5 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-red-700 dark:text-red-400">🎉 Beta Lifetime Pricing — Locked In Forever</h2>
          <p className="text-muted-foreground text-sm">
            As a beta member, you get up to <span className="font-semibold text-foreground">60% off</span> standard pricing — for as long as your subscription is active. Pricing never increases.
          </p>
        </div>
      </div>

      <div className="text-center max-w-3xl mx-auto">
        <Badge variant="secondary" className="mb-3">Exclusive Beta Pricing</Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Choose Your Plan
        </h1>
        <p className="text-lg text-muted-foreground">
          Lifetime discount. Cancel anytime. Standard prices shown for reference.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {Object.entries(BETA_TIERS).map(([key, tier]) => (
          <Card
            key={key}
            className={`relative ${tier.popular ? "border-primary shadow-lg scale-[1.02]" : "hover:border-primary/30"} transition-all`}
          >
            {tier.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Star className="w-4 h-4 mr-1" />
                Most Popular
              </Badge>
            )}

            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
              <CardDescription className="text-base">{tier.description}</CardDescription>
              <div className="mt-4">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-primary">{tier.betaPrice}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className="text-sm text-muted-foreground line-through">{tier.standardPrice}/mo</span>
                  <Badge variant="secondary" className="text-xs">Beta lifetime</Badge>
                </div>
              </div>
              <div className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>
                  {TIER_LIMITS[key as keyof typeof TIER_LIMITS].monthlyMessageCap.toLocaleString()} AI messages/mo
                </span>
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant={tier.popular ? "default" : "outline"}
                onClick={() => handleSubscribe(tier.priceId, tier.name)}
                disabled={loading === tier.priceId}
              >
                {loading === tier.priceId ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                Subscribe with Beta Pricing
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Beta pricing is exclusive to your organization and cannot be transferred. Cancel anytime — your discount returns if you re-subscribe.
      </p>
    </div>
  );
};

export default PricingBeta;
