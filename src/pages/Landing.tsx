import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, MessageSquare, QrCode, Share2, BarChart3, Zap, Shield, Users, Check, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import heroBackground from "@/assets/hero-background.jpg";
import causeioLogo from "@/assets/causeio-logo.png";
import communityBackground from "@/assets/community-background.jpg";

const Landing = () => {
  const { user, loading } = useAuth();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Add FAQ structured data
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is a nonprofit marketing platform and how can it help my organization?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A nonprofit marketing platform is an all-in-one system for charities, foundations, and community groups. It combines custom chatbots, QR codes, a social media calendar, an SEO/AEO/VoiceSEO analyzer, and a Google Business Profile optimizer to attract donors, recruit volunteers, and grow community support."
          }
        },
        {
          "@type": "Question",
          "name": "How can a custom chatbot increase donations and volunteer sign-ups?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The chatbot builder enables warm, mission-aligned conversations that answer questions, share impact stories, capture contact info, and route visitors to donation or volunteer forms. Optimized for voice and AI search, it engages supporters 24/7 and improves conversions."
          }
        },
        {
          "@type": "Question",
          "name": "What makes the QR code generator useful for nonprofit campaigns?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "You can create branded, trackable QR codes for events, fundraising, and outreach. Each code supports UTM parameters and scan analytics (time, device, approximate location), so you can see which flyers, posters, or mailers drive the most engagement and donations."
          }
        },
        {
          "@type": "Question",
          "name": "How does the social media marketing calendar work for nonprofits?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The calendar offers drag-and-drop scheduling across Facebook, Instagram, LinkedIn, and X, with AI ideas for Giving Tuesday, year-end appeals, and volunteer drives. Approval workflows and a content library help teams stay consistent and grow awareness."
          }
        },
        {
          "@type": "Question",
          "name": "What is an SEO/AEO/VoiceSEO analyzer and why does my nonprofit need it?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The analyzer reviews technical SEO, structured data, and question–answer coverage to prepare your site for search engines, AI overviews, and voice assistants. It checks metadata, schema (FAQPage, Organization, Event), and speakable summaries to win rich and voice results."
          }
        },
        {
          "@type": "Question",
          "name": "How does the Google Business Profile optimizer improve local visibility?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "It audits name, address, phone (NAP), categories, hours, links, photos, reviews, and Q&A. The tool suggests compliant categories, donor-friendly descriptions, review prompts, and fixes for NAP mismatches—helping your nonprofit appear in the local map pack and AI overviews."
          }
        },
        {
          "@type": "Question",
          "name": "Can the platform generate AI-ready FAQs and schema for my nonprofit's website?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. It generates natural-language Q&As and JSON-LD FAQ schema so your answers are eligible for rich results and voice responses, increasing visibility to donors and volunteers searching by question."
          }
        },
        {
          "@type": "Question",
          "name": "Is the platform beginner-friendly for nonprofits with small teams?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. The UI is technical yet compassionate, with plain-language guidance, templates, and tooltips. Staff and volunteers can manage chatbots, social posts, QR codes, and audits without advanced technical skills."
          }
        },
        {
          "@type": "Question",
          "name": "How can nonprofits measure the success of campaigns inside the platform?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A dashboard tracks chatbot conversions, QR scans, social engagement, SEO/AEO scores, and GBP completeness. You can export PDFs/CSVs or share embeddable widgets with boards and stakeholders to show impact."
          }
        },
        {
          "@type": "Question",
          "name": "Does the platform support nonprofit discounts and accessibility standards?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Nonprofit pricing is available, and the product follows WCAG 2.2 AA accessibility guidelines to ensure inclusive, equitable experiences for diverse communities."
          }
        }
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Navigation */}
      <nav className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="w-full max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img src={causeioLogo} alt="Causeio - Where Purpose Meets Performance" className="h-12" />
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            {loading ? (
              <Button variant="outline" disabled>
                Loading...
              </Button>
            ) : user ? (
              <Link to="/dashboard">
                <Button variant="default">Go to Dashboard</Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="outline">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="w-full py-20 px-6 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
          style={{ 
            backgroundImage: `url(${heroBackground})`,
            transform: `translateY(${scrollY * 0.5}px) scale(1.1)`
          }}
        ></div>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="w-full max-w-5xl mx-auto text-center relative z-10">
          <Badge variant="secondary" className="mb-4">
            🚀 New: AI-Powered Marketing Tools
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            Ignite Your Impact with Smart Business Tools
          </h1>
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            Transform your business with AI chatbots, dynamic QR codes, social media automation, and SEO optimization. 
            Everything you need to grow your digital presence in one powerful platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full py-20 px-6 bg-muted/30">
        <div className="w-full max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Scale</h2>
            <p className="text-xl text-muted-foreground">
              Powerful tools designed for modern businesses
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-2 hover:border-primary/20 transition-all duration-200">
              <CardHeader>
                <MessageSquare className="w-12 h-12 text-primary mb-4" />
                <CardTitle>AI Chatbots</CardTitle>
                <CardDescription>
                  Intelligent customer support that learns from your business
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />24/7 Support</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Custom Training</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Lead Generation</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-all duration-200">
              <CardHeader>
                <QrCode className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Smart QR Codes</CardTitle>
                <CardDescription>
                  Dynamic QR codes with tracking and analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Real-time Analytics</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Custom Branding</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Dynamic Links</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-all duration-200">
              <CardHeader>
                <Share2 className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Social Automation</CardTitle>
                <CardDescription>
                  Schedule and manage all your social media from one place
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Multi-Platform</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Smart Scheduling</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Content Templates</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-all duration-200">
              <CardHeader>
                <BarChart3 className="w-12 h-12 text-primary mb-4" />
                <CardTitle>SEO Analytics</CardTitle>
                <CardDescription>
                  Comprehensive SEO audits and optimization recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Site Audits</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Keyword Tracking</li>
                  <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Competitor Analysis</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="w-full py-20 px-6">
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trusted by Growing Businesses</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of companies using Causeio to scale their impact
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Causeio transformed our customer service. Our chatbot handles 80% of inquiries automatically."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold mr-3">
                    JS
                  </div>
                  <div>
                    <div className="font-semibold">Jane Smith</div>
                    <div className="text-sm text-muted-foreground">CEO, TechCorp</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "The QR code analytics helped us increase our offline-to-online conversion by 300%."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold mr-3">
                    MD
                  </div>
                  <div>
                    <div className="font-semibold">Mike Davis</div>
                    <div className="text-sm text-muted-foreground">Marketing Dir, RetailPlus</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Managing all our social media from one dashboard saved us 20 hours per week."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold mr-3">
                    AL
                  </div>
                  <div>
                    <div className="font-semibold">Anna Lee</div>
                    <div className="text-sm text-muted-foreground">Founder, Creative Agency</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section 
        className="w-full py-20 px-6 relative overflow-hidden bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: `url(${communityBackground})` }}
      >
        {/* Background overlay */}
        <div className="absolute inset-0 bg-slate-900/80"></div>
        <div className="w-full max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-white">Choose Your Plan</h2>
            <p className="text-xl text-slate-200 max-w-3xl mx-auto">
              Flexible pricing designed to fit the needs of any organization. Start free and scale as you grow.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Starter Plan */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-background/40 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">Starter</h3>
                  <p className="text-muted-foreground mb-4">Essential tools for small teams</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">$29</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                    <span className="text-sm">AI Chatbot Builder</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                    <span className="text-sm">QR Code Generator</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                    <span className="text-sm">Basic Analytics</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                    <span className="text-sm">Email Support</span>
                  </li>
                </ul>
                
                <Button className="w-full" variant="outline">
                  Get Started
                </Button>
              </div>
            </div>

            {/* Professional Plan */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-background/40 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">Professional</h3>
                  <p className="text-muted-foreground mb-4">Enhanced tools with automation</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">$79</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                    <span className="text-sm">Everything in Starter</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                    <span className="text-sm">Social Media Calendar</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                    <span className="text-sm">SEO Analysis Tools</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                    <span className="text-sm">Priority Support</span>
                  </li>
                </ul>
                
                <Button className="w-full" variant="outline">
                  Get Started
                </Button>
              </div>
            </div>

            {/* Growth Plan - Most Popular */}
            <div className="relative group">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20 bg-primary text-primary-foreground">
                Most Popular
              </Badge>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-background/50 backdrop-blur-xl border border-primary/30 rounded-2xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 ring-2 ring-primary/20">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">Growth</h3>
                  <p className="text-muted-foreground mb-4">Advanced tools with voice optimization</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">$149</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                    <span className="text-sm">Everything in Professional</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                    <span className="text-sm">Voice SEO Optimization</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                    <span className="text-sm">Google Business Profile Manager</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                    <span className="text-sm">24/7 Support</span>
                  </li>
                </ul>
                
                <Button className="w-full">
                  Get Started
                </Button>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-background/40 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                  <p className="text-muted-foreground mb-4">Complete solution with dedicated support</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">$299</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                    <span className="text-sm">Everything in Growth</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                    <span className="text-sm">White-label Solutions</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                    <span className="text-sm">Custom Integrations</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                    <span className="text-sm">Dedicated Account Manager</span>
                  </li>
                </ul>
                
                <Button className="w-full" variant="outline">
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground">
              Need something custom? <a href="#" className="text-primary hover:underline">Contact our sales team</a>
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="w-full py-20 px-6 bg-muted/30">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Why Choose Causeio?</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Shield className="w-8 h-8 text-primary mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
                    <p className="text-muted-foreground">
                      Bank-level security with SOC 2 compliance and end-to-end encryption.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Users className="w-8 h-8 text-primary mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Expert Support</h3>
                    <p className="text-muted-foreground">
                      Dedicated customer success team to help you maximize your ROI.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Zap className="w-8 h-8 text-primary mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
                    <p className="text-muted-foreground">
                      Built for speed with 99.9% uptime guarantee and global CDN.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-2">10x</div>
                <p className="text-xl font-semibold mb-4">Faster Growth</p>
                <p className="text-muted-foreground">
                  Companies using Causeio see 10x faster growth in their digital engagement metrics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full py-20 px-6">
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about our nonprofit marketing platform
            </p>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>What is a nonprofit marketing platform and how can it help my organization?</AccordionTrigger>
              <AccordionContent>
                A nonprofit marketing platform is an all-in-one system that helps charities, foundations, and community organizations manage their digital presence. Our platform includes tools for custom chatbots, QR codes, social media scheduling, SEO/AEO/VoiceSEO analysis, and Google Business Profile optimization — everything your nonprofit needs to attract donors, volunteers, and community support.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>How can a custom chatbot increase donations and volunteer sign-ups?</AccordionTrigger>
              <AccordionContent>
                Our chatbot builder allows nonprofits to create warm, mission-driven conversations that answer questions, share stories, collect contact information, and even direct users to donation or volunteer forms. Optimized for voice and AI search, these bots improve engagement 24/7 and turn website visitors into active supporters.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>What makes the QR code generator useful for nonprofit campaigns?</AccordionTrigger>
              <AccordionContent>
                The built-in QR code generator lets you create branded, trackable QR codes for fundraising flyers, event posters, and volunteer sign-ups. Each code includes scan analytics and UTM tracking so you know exactly which campaigns are driving the most engagement and donations.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>How does the social media marketing calendar work for nonprofits?</AccordionTrigger>
              <AccordionContent>
                The social media calendar provides drag-and-drop scheduling across platforms like Facebook, Instagram, LinkedIn, and X. It includes AI-generated content ideas tailored to Giving Tuesday, year-end appeals, and volunteer drives, making it easier to stay consistent and maximize awareness for your nonprofit.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger>What is an SEO/AEO/VoiceSEO analyzer and why does my nonprofit need it?</AccordionTrigger>
              <AccordionContent>
                Our analyzer reviews your website for search engine optimization (SEO), ask engine optimization (AEO), and voice search readiness (VoiceSEO). It checks metadata, schema markup, FAQ coverage, and "speakable" answers so your nonprofit can rank higher in Google, Siri, Alexa, and AI-powered search results.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6">
              <AccordionTrigger>How does the Google Business Profile optimizer improve local visibility?</AccordionTrigger>
              <AccordionContent>
                The GBP optimizer checks your organization's name, address, phone number (NAP), categories, services, reviews, and photos for accuracy and completeness. It suggests compliant category choices, creates donor-friendly descriptions, and generates review prompts — boosting your nonprofit's chances of appearing in the local map pack and AI overviews.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-7">
              <AccordionTrigger>Can the platform generate AI-ready FAQs and schema for my nonprofit's website?</AccordionTrigger>
              <AccordionContent>
                Yes. The platform automatically creates JSON-LD FAQ schema and natural-language Q&A that improve your nonprofit's chances of being featured in Google's AI Overviews, rich snippets, and voice assistant results. This means more donors and volunteers can find answers directly from your site.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-8">
              <AccordionTrigger>Is the platform beginner-friendly for nonprofits with small teams?</AccordionTrigger>
              <AccordionContent>
                Absolutely. The interface is built with a technical yet compassionate design — plain-language guidance, tooltips, and pre-built templates make it easy for staff and volunteers to manage digital marketing without advanced technical knowledge.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-9">
              <AccordionTrigger>How can nonprofits measure the success of campaigns inside the platform?</AccordionTrigger>
              <AccordionContent>
                The dashboard shows key performance indicators like chatbot conversions, QR code scans, social media engagement, SEO/AEO scores, and GBP completeness. Nonprofits can download reports or share embeddable widgets with their board or donors to demonstrate impact.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-10">
              <AccordionTrigger>Does the platform support nonprofit discounts and accessibility standards?</AccordionTrigger>
              <AccordionContent>
                Yes. The system offers nonprofit pricing and follows WCAG 2.2 AA accessibility guidelines, ensuring that all digital tools are inclusive for diverse communities. This helps nonprofits serve broader audiences while saving on costs.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 px-6 bg-slate-900">
        <div className="w-full max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 text-white">Ready to Ignite Your Impact?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of businesses already using Causeio to transform their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing">
              <Button size="lg" className="text-lg px-8">
                Start Your Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 border-white text-white bg-transparent hover:bg-white hover:text-slate-900">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Google Maps Section */}
      <section className="w-full py-12 px-0 bg-muted/30">
        <div className="w-full">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3443.794538479383!2d-81.6591862!3d30.3283615!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88e5b7ba8c79c7b7%3A0x29d0d337ce7701c4!2sBizooma%20Digital%20Marketing%20Agency!5e0!3m2!1sen!2sus!4v1758978178589!5m2!1sen!2sus" 
            width="100%" 
            height="450" 
            className="border-0" 
            allowFullScreen 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t bg-muted/50 py-12 px-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img src={causeioLogo} alt="Causeio - Where Purpose Meets Performance" className="h-10" />
              </div>
              <p className="text-muted-foreground">
                Empowering businesses with intelligent automation and growth tools.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/pricing" className="hover:text-primary">Pricing</Link></li>
                <li><a href="#" className="hover:text-primary">Features</a></li>
                <li><a href="#" className="hover:text-primary">API Docs</a></li>
                <li><a href="#" className="hover:text-primary">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary">About</a></li>
                <li><a href="#" className="hover:text-primary">Blog</a></li>
                <li><a href="#" className="hover:text-primary">Careers</a></li>
                <li><a href="#" className="hover:text-primary">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Help Center</a></li>
                <li><a href="#" className="hover:text-primary">Community</a></li>
                <li><a href="#" className="hover:text-primary">Status</a></li>
                <li><a href="#" className="hover:text-primary">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 Causeio, A <a href="https://bizooma.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary underline">Bizooma, LLC</a> Company | All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;