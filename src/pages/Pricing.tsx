import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Zap, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { SEOHead } from "@/components/seo/SEOHead";

const tiers = {
  starter: {
    name: "Starter",
    price: "$49.95",
    description: "Perfect for small businesses getting started",
    priceId: "price_1SBmQSEV6sbsDlR8ntj0hADS",
    popular: false,
    features: [
      "1 AI Chatbot",
      "50 QR Codes",
      "5 Social Media Accounts", 
      "Monthly SEO Reports",
      "Email Support",
      "Basic Analytics",
      "Custom Branding"
    ]
  },
  professional: {
    name: "Professional", 
    price: "$99.95",
    description: "Advanced features for growing businesses",
    priceId: "price_1SBmQkEV6sbsDlR8lNv4aa7A",
    popular: true,
    features: [
      "5 AI Chatbots",
      "500 QR Codes", 
      "Unlimited Social Accounts",
      "Weekly SEO Reports",
      "Priority Support",
      "Advanced Analytics",
      "API Access",
      "Team Collaboration",
      "Custom Integrations"
    ]
  },
  enterprise: {
    name: "Enterprise",
    price: "$199", 
    description: "Complete solution for large organizations",
    priceId: "price_1SBmR3EV6sbsDlR8sjx3YczW",
    popular: false,
    features: [
      "Unlimited AI Chatbots",
      "Unlimited QR Codes",
      "Unlimited Social Accounts",
      "Real-time SEO Monitoring", 
      "Dedicated Support Manager",
      "Custom Analytics Dashboard",
      "Full API Access",
      "White-label Options",
      "On-premise Deployment",
      "SLA Guarantee"
    ]
  }
};

const Pricing = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { user } = useAuth();

  // Product and Offer Schemas for each pricing tier
  const pricingSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Causeio Starter Plan",
      "description": "Perfect for small businesses getting started with AI chatbots, QR codes, and basic marketing automation",
      "brand": {
        "@type": "Brand",
        "name": "Causeio"
      },
      "offers": {
        "@type": "Offer",
        "url": "https://yourdomain.com/pricing",
        "priceCurrency": "USD",
        "price": "49.95",
        "priceValidUntil": "2025-12-31",
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition",
        "eligibleRegion": {
          "@type": "Place",
          "name": "United States"
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "127"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Causeio Professional Plan",
      "description": "Advanced features for growing businesses including social media automation, SEO tools, and priority support",
      "brand": {
        "@type": "Brand",
        "name": "Causeio"
      },
      "offers": {
        "@type": "Offer",
        "url": "https://yourdomain.com/pricing",
        "priceCurrency": "USD",
        "price": "79",
        "priceValidUntil": "2025-12-31",
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition",
        "eligibleRegion": {
          "@type": "Place",
          "name": "United States"
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "243"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Causeio Enterprise Plan",
      "description": "Complete solution for large organizations with unlimited features, white-label options, and dedicated support",
      "brand": {
        "@type": "Brand",
        "name": "Causeio"
      },
      "offers": {
        "@type": "Offer",
        "url": "https://yourdomain.com/pricing",
        "priceCurrency": "USD",
        "price": "199",
        "priceValidUntil": "2025-12-31",
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition",
        "eligibleRegion": {
          "@type": "Place",
          "name": "United States"
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5.0",
        "reviewCount": "89"
      }
    },
    // Pricing FAQ Schema
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Can I switch plans anytime?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and you'll be charged or credited prorated amounts based on your billing cycle."
          }
        },
        {
          "@type": "Question",
          "name": "Is there a free trial?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Absolutely! All plans come with a 14-day free trial. No credit card required to start. You can explore all features risk-free before committing."
          }
        },
        {
          "@type": "Question",
          "name": "What happens if I cancel?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "You can cancel anytime. Your account remains active until the end of your current billing period. All your data is safely stored and you can reactivate at any time."
          }
        },
        {
          "@type": "Question",
          "name": "Do you offer discounts?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! We offer annual billing discounts (save 20%), special rates for non-profits and educational institutions, and volume discounts for enterprise customers. Contact our sales team for custom pricing."
          }
        },
        {
          "@type": "Question",
          "name": "What payment methods do you accept?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We accept all major credit cards (Visa, MasterCard, American Express, Discover), ACH bank transfers for annual plans, and can arrange invoicing for Enterprise customers."
          }
        },
        {
          "@type": "Question",
          "name": "Is my data secure?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. We use bank-level encryption, are SOC 2 compliant, and follow GDPR and CCPA regulations. Your data is encrypted at rest and in transit, with regular security audits."
          }
        }
      ]
    }
  ];

  const handleSubscribe = async (priceId: string, tierName: string) => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      return;
    }

    setLoading(priceId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, tierName }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to start subscription. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Pricing Plans for Nonprofits - Causeio"
        description="Choose the perfect plan for your nonprofit. Start with a 14-day free trial. Plans start at $29/month with AI chatbots, QR codes, social media automation, and SEO tools. Nonprofit discounts available."
        canonical="/pricing"
        keywords="nonprofit pricing, charity marketing pricing, nonprofit software cost, fundraising tools pricing, donor engagement platform cost"
        ogType="product"
        schema={pricingSchemas}
      />
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">Causeio</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost">Back to Home</Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-4">
            💎 Simple, Transparent Pricing
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Choose Your Growth Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Start with a 14-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8">
            {Object.entries(tiers).map(([key, tier]) => (
              <Card 
                key={key} 
                className={`relative ${
                  tier.popular 
                    ? 'border-primary shadow-lg scale-105' 
                    : 'hover:border-primary/20'
                } transition-all duration-200`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                  <CardDescription className="text-base">{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
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
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                    ) : null}
                    Start Free Trial
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-2">Can I switch plans anytime?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground">
                Absolutely! All plans come with a 14-day free trial. No credit card required to start.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">What happens if I cancel?</h3>
              <p className="text-muted-foreground">
                You can cancel anytime. Your account remains active until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Do you offer discounts?</h3>
              <p className="text-muted-foreground">
                Yes! We offer annual billing discounts and special rates for non-profits and educational institutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Our team is here to help you choose the right plan for your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8">
              Schedule Demo
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-8 px-6">
        <div className="container mx-auto max-w-6xl text-center text-muted-foreground">
          <p>&copy; 2024 Causeio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;