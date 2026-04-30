import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageSquare, QrCode, Share2, BarChart3, Users, Star, Building, CheckSquare, TrendingUp, Settings, Smartphone, Globe, Target, Heart, Clock, DollarSign, Sparkles, ArrowRight, UserPlus, Wrench, Megaphone, Accessibility } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SEOHead } from "@/components/seo/SEOHead";
import { BlogSection } from "@/components/landing/BlogSection";
import { BetaSignupForm } from "@/components/landing/BetaSignupForm";
import causeioLogo from "@/assets/causeio-logo.png";
import heroBackground from "@/assets/hero-volunteers.jpg";
import bizoomaLogo from "@/assets/bizooma-logo.png";

const Landing = () => {
  const { user, loading } = useAuth();

  // Comprehensive structured data schemas
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Causeio",
      "description": "AI-powered marketing platform helping businesses grow with intelligent chatbots, dynamic QR codes, social media automation, and comprehensive SEO optimization.",
      "url": "https://causeio.com",
      "logo": "https://causeio.com/assets/causeio-logo.png",
      "sameAs": [
        "https://twitter.com/causeio",
        "https://linkedin.com/company/causeio",
        "https://facebook.com/causeio"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+1-800-CAUSEIO",
        "contactType": "Customer Service",
        "availableLanguage": ["English"],
        "areaServed": "US"
      }
    },
    {
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
            "text": "The chatbot builder enables warm, mission-aligned conversations that answer questions, share impact stories, capture contact info, and route visitors to donation or volunteer forms."
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
          "name": "Does the platform support nonprofit discounts and accessibility standards?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Nonprofit pricing is available, and the product follows WCAG 2.2 AA accessibility guidelines to ensure inclusive, equitable experiences for diverse communities."
          }
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": [".hero-title", ".value-proposition", ".key-features"]
      }
    }
  ];

  const featureCategories = [
    {
      title: "Engage Your Community",
      description: "Build meaningful connections with donors, volunteers, and supporters",
      icon: Heart,
      color: "bg-rose-50 text-rose-600",
      features: [
        { icon: MessageSquare, name: "AI Chatbots", desc: "24/7 donor support & volunteer recruitment" },
        { icon: Users, name: "CRM & Contacts", desc: "Manage all your relationships in one place" },
        { icon: Smartphone, name: "Mobile App", desc: "On-the-go management for your team" },
      ]
    },
    {
      title: "Promote Your Mission",
      description: "Get discovered by the people who care about your cause",
      icon: Megaphone,
      color: "bg-amber-50 text-amber-600",
      features: [
        { icon: Share2, name: "Social Media", desc: "Schedule Facebook posts (more platforms coming)" },
        { icon: QrCode, name: "QR Codes", desc: "Trackable codes for events & campaigns" },
        { icon: BarChart3, name: "SEO Analytics", desc: "Rank higher in search & voice results" },
        { icon: Building, name: "Google Business", desc: "Monitor & reply to your Google reviews" },
        { icon: Heart, name: "Campaigns", desc: "Run Giving Tuesday & year-round appeals" },
        { icon: Target, name: "PPC Management", desc: "Maximize Google Ad Grants ROI", comingSoon: true },
      ]
    },
    {
      title: "Operate With Ease",
      description: "Streamline your day-to-day so you can focus on impact",
      icon: Wrench,
      color: "bg-sky-50 text-sky-600",
      features: [
        { icon: CheckSquare, name: "Task Management", desc: "Organize workflows & collaborate" },
        { icon: TrendingUp, name: "Analytics", desc: "Track performance across all tools" },
        { icon: Settings, name: "Integrations", desc: "Connect with tools you already use" },
        { icon: Accessibility, name: "Accessibility Widget", desc: "One-line install for WCAG 2.2 AA compliance" },
        { icon: Globe, name: "Website Builder", desc: "Beautiful sites for your nonprofit", comingSoon: true },
      ]
    }
  ];

  const steps = [
    { num: "1", icon: UserPlus, title: "Sign Up for Free", desc: "Create your account in under a minute. No credit card required." },
    { num: "2", icon: Wrench, title: "Build Your Tools", desc: "Set up chatbots, QR codes, social media, and more with guided templates." },
    { num: "3", icon: Sparkles, title: "Amplify Your Mission", desc: "Watch your donor engagement, volunteer sign-ups, and community support grow." },
  ];

  return (
    <div className="min-h-screen w-full bg-background">
      <SEOHead
        title="Causeio - Marketing Platform for Nonprofits & Charities"
        description="Empower your nonprofit with AI chatbots, dynamic QR codes, social media automation, and SEO optimization. Attract donors, recruit volunteers, and grow community support with tools designed for charities and foundations."
        canonical="/"
        keywords="nonprofit marketing, charity marketing, donor engagement, volunteer recruitment, fundraising tools, nonprofit social media, charity automation, nonprofit SEO, voice SEO for nonprofits"
        schema={schemas}
      />

      {/* Navigation */}
      <nav className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="w-full max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img src={causeioLogo} alt="Causeio - Where Purpose Meets Performance" className="h-12" />
          </div>
          <div className="flex items-center space-x-3">
            {loading ? (
              <Button variant="outline" disabled size="sm">Loading...</Button>
            ) : user ? (
              <Link to="/dashboard">
                <Button variant="default" size="sm">Go to Dashboard</Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section -- warm gradient with side-by-side layout */}
      <section className="relative w-full py-16 md:py-24 px-6 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBackground})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#57cc99]/70 via-[#57cc99]/40 to-background/90" aria-hidden="true" />
        <div className="relative w-full max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white hero-title"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}
            >
              AI-Powered Marketing for Nonprofits That Want to Grow
            </h1>
            <p
              className="text-lg md:text-xl text-white leading-relaxed"
              style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
            >
              Causeio is a nationwide digital marketing platform helping nonprofit organizations increase donations, recruit volunteers, and improve engagement through websites, mobile apps, automation, and intelligent chatbots.
            </p>
          </div>
          <div>
            <BetaSignupForm compact />
            <p className="mt-4 text-sm font-medium text-muted-foreground text-center">
              Offices: Jacksonville, FL & Amarillo, TX
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full py-16 px-6 border-b border-border/50">
        <div className="w-full max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Get Started in Minutes</h2>
            <p className="text-base md:text-lg text-foreground max-w-3xl mx-auto leading-relaxed mb-4 value-proposition">
              Causeio brings AI chatbots, social media management, donor CRM, QR codes, SEO, and more into one
              platform built specifically for nonprofits, charities, and foundations.
            </p>
            <p className="text-muted-foreground text-lg">Three simple steps to amplify your impact</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="text-sm font-semibold text-primary mb-1">Step {step.num}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features -- Grouped by Category */}
      <section className="w-full py-20 px-6" style={{ backgroundColor: "#1f5f7e" }}>
        <div className="w-full max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 key-features text-white">Everything Your Nonprofit Needs</h2>
            <p className="text-lg text-white/80">
              Powerful, purpose-built tools so your team can focus on what matters most
            </p>
          </div>

          <div className="space-y-16">
            {featureCategories.map((category) => (
              <div key={category.title}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.color}`}>
                    <category.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{category.title}</h3>
                  </div>
                </div>
                <p className="text-white/70 mb-6 ml-[52px]">{category.description}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ml-0 md:ml-[52px]">
                  {category.features.map((feature) => (
                    <Card key={feature.name} className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all group relative shadow-lg">
                      {feature.comingSoon && (
                        <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5">
                          Coming Soon
                        </Badge>
                      )}
                      <CardContent className="p-5">
                        <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 group-hover:bg-white/30 transition-colors">
                          <feature.icon className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="font-semibold mb-1 text-white">{feature.name}</h4>
                        <p className="text-sm text-white/70">{feature.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Causeio -- Mission-Aligned */}
      <section className="w-full py-20 px-6 bg-muted/30">
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Why Nonprofits Choose Causeio</h2>
            <p className="text-lg text-muted-foreground">We've worked for years at several different nonprofits and so we have first hand knowledge of the unique challenges they face.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/70 backdrop-blur-md border border-white/40 shadow-lg">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Save Staff Time</h3>
                <p className="text-muted-foreground text-sm">
                  Automate repetitive tasks so your small team can focus on the mission, not the marketing.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/70 backdrop-blur-md border border-white/40 shadow-lg">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Nonprofit-Friendly Pricing</h3>
                <p className="text-muted-foreground text-sm">
                  Designed for organizations that stretch every dollar. Free beta access with early bird discounts.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/70 backdrop-blur-md border border-white/40 shadow-lg">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Built for Your Mission</h3>
                <p className="text-muted-foreground text-sm">
                  Every feature was designed with nonprofits in mind — from donor engagement to volunteer management.
                </p>
              </CardContent>
            </Card>
          </div>
          {/* Bizooma story */}
          <div className="mt-16 max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-8 md:p-10">
                <div className="grid md:grid-cols-[auto,1fr] gap-8 items-center">
                  <div className="flex justify-center md:justify-start">
                    <a
                      href="https://bizooma.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Visit Bizooma Creative Agency website"
                      className="inline-block transition-transform hover:scale-105"
                    >
                      <img
                        src={bizoomaLogo}
                        alt="Bizooma Creative Agency"
                        className="w-44 h-auto"
                      />
                    </a>
                  </div>
                  <div>
                    <Badge variant="secondary" className="mb-3">Our Story</Badge>
                    <h3 className="text-2xl font-bold mb-3">Built by Bizooma Creative Agency</h3>
                    <p className="text-muted-foreground mb-3">
                      Causeio was created by <span className="font-semibold text-foreground">Bizooma, LLC</span>, a creative agency that has spent years building marketing platforms for law firms. Along the way, we noticed something powerful: so many of the firms we work with launch their own foundations and nonprofits — pouring their success back into the causes they care about.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      That insight became Causeio. The same engine that drives our law firm marketing platform now powers a tool built specifically for nonprofits — so mission-driven teams get the technology, automation, and reach typically reserved for high-budget firms.
                    </p>
                    <div className="border-l-4 border-primary pl-4 py-1 my-4 bg-primary/5 rounded-r-md">
                      <p className="text-foreground leading-relaxed">
                        <span className="font-semibold">Where Purpose Meets Performance.</span> That tagline isn't just words on our logo — it's the bridge between the two worlds we live in. <span className="font-semibold">Purpose</span> is the mission driving every nonprofit we serve: the donors moved, the volunteers mobilized, the lives changed. <span className="font-semibold">Performance</span> is the marketing horsepower we built for high-budget law firms — automation, AI, analytics, and reach. Causeio fuses them, so mission-driven teams never have to choose between doing good and doing it well.
                      </p>
                    </div>
                    <p className="text-sm font-medium text-foreground pt-2">
                      Offices: Jacksonville, FL & Amarillo, TX
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        className="w-full py-20 px-6"
        style={{ background: "linear-gradient(135deg, hsl(185 62% 45%), hsl(185 62% 35%))" }}
      >
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">What Our Beta Testers Say</h2>
            <p className="text-lg text-white/80">
              Join our beta testing group and receive a substantial discount when we "Go Live"
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { initials: "JS", name: "Jane Smith", quote: "Causeio transformed our donor engagement. Our chatbot answers questions and directs supporters to give 24/7." },
              { initials: "MD", name: "Mike Davis", quote: "The QR code analytics helped us track which fundraising materials drive the most donations. Game changer!" },
              { initials: "AL", name: "Anna Lee", quote: "Managing all our social media from one dashboard saved us 20 hours per week." },
            ].map((t) => (
              <Card key={t.initials} className="bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
                <CardContent className="pt-6 pb-6">
                  <div className="text-3xl text-white/40 mb-2">"</div>
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-white/90 mb-4 text-sm leading-relaxed">{t.quote}</p>
                  <div className="flex items-center">
                    <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-xs font-semibold mr-3">
                      {t.initials}
                    </div>
                    <div className="font-semibold text-sm text-white">{t.name}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <BlogSection />

      {/* FAQ Section */}
      <section className="w-full py-20 px-6">
        <div className="w-full max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about Causeio
            </p>
          </div>
          
          <Card className="border shadow-sm">
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="px-6">
                  <AccordionTrigger>What is Causeio and how can it help my nonprofit?</AccordionTrigger>
                  <AccordionContent>
                    Causeio is an all-in-one marketing platform for charities, foundations, and community organizations. It includes chatbots, QR codes, social media scheduling, SEO analysis, Google Business Profile optimization, CRM, and more — everything to attract donors, volunteers, and community support.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="px-6">
                  <AccordionTrigger>How can a chatbot increase donations and volunteer sign-ups?</AccordionTrigger>
                  <AccordionContent>
                    Our chatbot builder creates warm, mission-driven conversations that answer questions, share stories, collect contact info, and direct users to donation or volunteer forms — available 24/7.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="px-6">
                  <AccordionTrigger>Is the platform beginner-friendly for small teams?</AccordionTrigger>
                  <AccordionContent>
                    Absolutely. The interface features plain-language guidance, tooltips, and pre-built templates. Staff and volunteers can manage marketing tools without advanced technical knowledge.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="px-6">
                  <AccordionTrigger>How does the social media calendar work?</AccordionTrigger>
                  <AccordionContent>
                    Drag-and-drop scheduling across Facebook, Instagram, LinkedIn, and X with AI-generated content ideas for Giving Tuesday, year-end appeals, and volunteer drives.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5" className="px-6">
                  <AccordionTrigger>What about SEO and voice search optimization?</AccordionTrigger>
                  <AccordionContent>
                    Our analyzer reviews metadata, schema markup, FAQ coverage, and voice-search readiness so your nonprofit ranks higher in Google, Siri, Alexa, and AI-powered search results.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6" className="px-6">
                  <AccordionTrigger>Does Causeio offer nonprofit pricing?</AccordionTrigger>
                  <AccordionContent>
                    Yes. We offer nonprofit-friendly pricing, WCAG 2.2 AA accessibility compliance, and free beta access with a substantial early bird discount when we launch.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section -- warm primary gradient */}
      <section className="w-full py-20 px-6 bg-gradient-to-br from-primary to-primary-hover text-primary-foreground"
        style={{ background: "linear-gradient(135deg, hsl(185 62% 45%), hsl(185 62% 35%))" }}>
        <div className="w-full max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Amplify Your Impact?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Schedule a call to learn how Causeio can help your nonprofit save time, engage supporters, and grow your mission.
          </p>
          <a href="https://calendly.com/joe-bizooma/30min" target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="secondary" className="text-lg px-8 font-semibold">
              Schedule a Call <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </a>
        </div>
      </section>

      {/* Google Maps */}
      <section className="w-full py-0 px-0">
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3443.794538479383!2d-81.6591862!3d30.3283615!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88e5b7ba8c79c7b7%3A0x29d0d337ce7701c4!2sBizooma%20Digital%20Marketing%20Agency!5e0!3m2!1sen!2sus!4v1758978178589!5m2!1sen!2sus" 
          width="100%" 
          height="400" 
          className="border-0" 
          allowFullScreen 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>

      {/* Footer */}
      <footer className="w-full border-t bg-muted/50 py-12 px-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img src={causeioLogo} alt="Causeio - Where Purpose Meets Performance" className="h-10 mb-4" />
              <p className="text-muted-foreground text-sm">
                Empowering nonprofits with intelligent tools to amplify their mission and grow community support.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link to="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/blog/volunteer-recruitment" className="hover:text-primary transition-colors">Volunteer Recruitment</Link></li>
                <li><Link to="/resources/google-ad-grants" className="hover:text-primary transition-colors">Google Grants Guide</Link></li>
                <li><Link to="/resources/microsoft-grants" className="hover:text-primary transition-colors">Microsoft Grants</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://calendly.com/joe-bizooma/30min" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Schedule a Call</a></li>
                <li><a href="https://bizooma.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Bizooma Agency</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground text-sm">
            <p>&copy; 2026 Causeio, A <a href="https://bizooma.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary underline">Bizooma, LLC</a> Company | All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
