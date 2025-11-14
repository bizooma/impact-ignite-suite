import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, MessageSquare, QrCode, Share2, BarChart3, Zap, Shield, Users, Check, Star, Building, FileText, CheckSquare, TrendingUp, Settings, Smartphone, Globe, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { SEOHead } from "@/components/seo/SEOHead";
import { BlogSection } from "@/components/landing/BlogSection";
import { BetaSignupForm } from "@/components/landing/BetaSignupForm";
import heroBackground from "@/assets/hero-background.jpg";
import causeioLogo from "@/assets/causeio-logo.png";
import communityBackground from "@/assets/community-background.jpg";
import chatbotBg from "@/assets/products/chatbot-bg.jpg";
import qrCodeBg from "@/assets/products/qr-code-bg.jpg";
import socialAutomationBg from "@/assets/products/social-automation-bg.jpg";
import seoAnalyticsBg from "@/assets/products/seo-analytics-bg.jpg";
import googleBusinessBg from "@/assets/products/google-business-bg.jpg";
import crmContactsBg from "@/assets/products/crm-contacts-bg.jpg";
import taskManagementBg from "@/assets/products/task-management-bg.jpg";
import analyticsDashboardBg from "@/assets/products/analytics-dashboard-bg.jpg";
import integrationsBg from "@/assets/products/integrations-bg.jpg";
import mobileAppBg from "@/assets/products/mobile-app-bg.jpg";

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

  // Comprehensive structured data schemas
  const schemas = [
    // Organization Schema
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Causeio",
      "description": "AI-powered marketing platform helping businesses grow with intelligent chatbots, dynamic QR codes, social media automation, and comprehensive SEO optimization.",
      "url": "https://yourdomain.com",
      "logo": "https://yourdomain.com/assets/causeio-logo.png",
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
    // LocalBusiness Schema
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Causeio",
      "image": "https://yourdomain.com/assets/causeio-logo.png",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "123 Main Street",
        "addressLocality": "San Francisco",
        "addressRegion": "CA",
        "postalCode": "94105",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 37.7749,
        "longitude": -122.4194
      },
      "priceRange": "$29-$299",
      "openingHours": "Mo-Fr 09:00-17:00",
      "telephone": "+1-800-CAUSEIO"
    },
    // Service Schemas
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "AI Chatbot Development",
      "provider": {
        "@type": "Organization",
        "name": "Causeio"
      },
      "description": "Intelligent customer support chatbots that learn from your business and provide 24/7 assistance.",
      "areaServed": "US",
      "availableChannel": {
        "@type": "ServiceChannel",
        "serviceUrl": "https://yourdomain.com"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "QR Code Generation",
      "provider": {
        "@type": "Organization",
        "name": "Causeio"
      },
      "description": "Dynamic QR codes with advanced tracking, analytics, and custom branding capabilities.",
      "areaServed": "Worldwide"
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "Social Media Management",
      "provider": {
        "@type": "Organization",
        "name": "Causeio"
      },
      "description": "Automated social media scheduling and management across multiple platforms.",
      "areaServed": "Worldwide"
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "SEO Optimization",
      "provider": {
        "@type": "Organization",
        "name": "Causeio"
      },
      "description": "Comprehensive SEO audits and optimization recommendations to improve search rankings.",
      "areaServed": "Worldwide"
    },
    // HowTo Schema
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "How to Create an AI Chatbot for Your Business",
      "description": "Step-by-step guide to building and deploying an AI chatbot using Causeio",
      "step": [
        {
          "@type": "HowToStep",
          "name": "Sign Up",
          "text": "Create a free Causeio account and choose your plan",
          "position": 1
        },
        {
          "@type": "HowToStep",
          "name": "Build Your Chatbot",
          "text": "Use our intuitive chatbot builder to create custom conversation flows",
          "position": 2
        },
        {
          "@type": "HowToStep",
          "name": "Train Your AI",
          "text": "Upload your knowledge base and train the AI on your business information",
          "position": 3
        },
        {
          "@type": "HowToStep",
          "name": "Deploy",
          "text": "Embed the chatbot on your website and start engaging customers 24/7",
          "position": 4
        }
      ]
    },
    // Expanded FAQ Schema
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
        },
        {
          "@type": "Question",
          "name": "How long does it take to set up Causeio for my business?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Most businesses can set up their first AI chatbot within 15 minutes, create QR codes instantly, and schedule their first social media posts within an hour. Our intuitive interface and pre-built templates make getting started fast and easy."
          }
        },
        {
          "@type": "Question",
          "name": "What platforms does Causeio integrate with?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Causeio integrates with Facebook, Instagram, LinkedIn, Twitter/X, Google Business Profile, and major website platforms. We also offer API access for custom integrations on Professional and Enterprise plans."
          }
        }
      ]
    },
    // SpeakableSpecification for Voice Search
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": [".hero-title", ".value-proposition", ".key-features"]
      }
    }
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
          <div className="flex items-center space-x-4">
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
            🚀 New: AI-Powered Tools for Nonprofits
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white hero-title">
            Amplify Your Mission with Smart Marketing Tools
          </h1>
          <p className="text-xl text-white/90 mb-8 leading-relaxed value-proposition">
            Empower your nonprofit with AI chatbots, dynamic QR codes, social media automation, and SEO optimization. 
            Everything you need to attract donors, recruit volunteers, and grow community support in one powerful platform.
          </p>
        </div>
      </section>

      {/* Beta Signup Section */}
      <section className="w-full py-20 px-6 bg-gradient-to-b from-background to-muted/20">
        <div className="w-full max-w-7xl mx-auto">
          <BetaSignupForm />
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full py-20 px-6 bg-muted/30">
        <div className="w-full max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything Your Nonprofit Needs to Thrive</h2>
            <p className="text-xl text-muted-foreground key-features">
              Powerful tools designed for nonprofits, charities, and foundations
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/20 transition-all duration-200 overflow-hidden relative group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundImage: `url(${chatbotBg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/80" />
              <div className="relative z-10">
                <CardHeader>
                  <MessageSquare className="w-12 h-12 text-primary mb-4" />
                  <CardTitle className="font-bold">AI Chatbots</CardTitle>
                  <CardDescription className="font-bold">
                    Intelligent donor support that learns from your mission and engages supporters 24/7
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground font-bold">
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />24/7 Support</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Custom Training</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Lead Generation</li>
                  </ul>
                </CardContent>
              </div>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-all duration-200 overflow-hidden relative group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundImage: `url(${qrCodeBg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/80" />
              <div className="relative z-10">
                <CardHeader>
                  <QrCode className="w-12 h-12 text-primary mb-4" />
                  <CardTitle className="font-bold">Smart QR Codes</CardTitle>
                  <CardDescription className="font-bold">
                    Dynamic QR codes with tracking and analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground font-bold">
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Real-time Analytics</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Custom Branding</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Dynamic Links</li>
                  </ul>
                </CardContent>
              </div>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-all duration-200 overflow-hidden relative group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundImage: `url(${socialAutomationBg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/80" />
              <div className="relative z-10">
                <CardHeader>
                  <Share2 className="w-12 h-12 text-primary mb-4" />
                  <CardTitle className="font-bold">Social Automation</CardTitle>
                  <CardDescription className="font-bold">
                    Schedule and manage all your social media from one place
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground font-bold">
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Multi-Platform</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Smart Scheduling</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Content Templates</li>
                  </ul>
                </CardContent>
              </div>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-all duration-200 overflow-hidden relative group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundImage: `url(${seoAnalyticsBg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/80" />
              <div className="relative z-10">
                <CardHeader>
                  <BarChart3 className="w-12 h-12 text-primary mb-4" />
                  <CardTitle className="font-bold">SEO Analytics</CardTitle>
                  <CardDescription className="font-bold">
                    Comprehensive SEO audits and optimization recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground font-bold">
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Site Audits</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Keyword Tracking</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Competitor Analysis</li>
                  </ul>
                </CardContent>
              </div>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-all duration-200 overflow-hidden relative group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundImage: `url(${googleBusinessBg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/80" />
              <div className="relative z-10">
                <CardHeader>
                  <Building className="w-12 h-12 text-primary mb-4" />
                  <CardTitle className="font-bold">Google Business</CardTitle>
                  <CardDescription className="font-bold">
                    Optimize your Google Business Profile for community visibility
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground font-bold">
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Profile Management</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Review Tracking</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Local SEO</li>
                  </ul>
                </CardContent>
              </div>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-all duration-200 overflow-hidden relative group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundImage: `url(${crmContactsBg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/80" />
              <div className="relative z-10">
                <CardHeader>
                  <Users className="w-12 h-12 text-primary mb-4" />
                  <CardTitle className="font-bold">CRM & Contacts</CardTitle>
                  <CardDescription className="font-bold">
                    Manage donors, volunteers, and supporters in one place
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground font-bold">
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Contact Management</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Segmentation</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Email Sync</li>
                  </ul>
                </CardContent>
              </div>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-all duration-200 overflow-hidden relative group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundImage: `url(${taskManagementBg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/80" />
              <div className="relative z-10">
                <CardHeader>
                  <CheckSquare className="w-12 h-12 text-primary mb-4" />
                  <CardTitle className="font-bold">Task Management</CardTitle>
                  <CardDescription className="font-bold">
                    Organize workflows and collaborate with your team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground font-bold">
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Team Collaboration</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Project Tracking</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Deadlines</li>
                  </ul>
                </CardContent>
              </div>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-all duration-200 overflow-hidden relative group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundImage: `url(${analyticsDashboardBg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/80" />
              <div className="relative z-10">
                <CardHeader>
                  <TrendingUp className="w-12 h-12 text-primary mb-4" />
                  <CardTitle className="font-bold">Analytics Dashboard</CardTitle>
                  <CardDescription className="font-bold">
                    Track performance across all your digital initiatives
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground font-bold">
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Cross-Platform Metrics</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Custom Reports</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Data Exports</li>
                  </ul>
                </CardContent>
              </div>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-all duration-200 overflow-hidden relative group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundImage: `url(${integrationsBg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/80" />
              <div className="relative z-10">
                <CardHeader>
                  <Settings className="w-12 h-12 text-primary mb-4" />
                  <CardTitle className="font-bold">Integrations</CardTitle>
                  <CardDescription className="font-bold">
                    Connect with external tools and services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground font-bold">
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />API Access</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Third-Party Apps</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Webhooks</li>
                  </ul>
                </CardContent>
              </div>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-all duration-200 overflow-hidden relative group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundImage: `url(${mobileAppBg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/80" />
              <div className="relative z-10">
                <CardHeader>
                  <Smartphone className="w-12 h-12 text-primary mb-4" />
                  <CardTitle className="font-bold">Mobile App</CardTitle>
                  <CardDescription className="font-bold">
                    Native mobile experience for on-the-go management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground font-bold">
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />iOS & Android</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Push Notifications</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Offline Access</li>
                  </ul>
                </CardContent>
              </div>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-all duration-200 overflow-hidden relative group">
              <Badge className="absolute top-4 right-4 z-20 bg-destructive text-destructive-foreground">Coming Soon</Badge>
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundImage: `url(${integrationsBg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/80" />
              <div className="relative z-10">
                <CardHeader>
                  <Globe className="w-12 h-12 text-primary mb-4" />
                  <CardTitle className="font-bold">Website Builder</CardTitle>
                  <CardDescription className="font-bold">
                    Create beautiful, mobile-responsive websites for your nonprofit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground font-bold">
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Drag & Drop Editor</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Custom Templates</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Mobile Optimized</li>
                  </ul>
                </CardContent>
              </div>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-all duration-200 overflow-hidden relative group">
              <Badge className="absolute top-4 right-4 z-20 bg-destructive text-destructive-foreground">Coming Soon</Badge>
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundImage: `url(${analyticsDashboardBg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/80" />
              <div className="relative z-10">
                <CardHeader>
                  <Target className="w-12 h-12 text-primary mb-4" />
                  <CardTitle className="font-bold">PPC Management</CardTitle>
                  <CardDescription className="font-bold">
                    Maximize your Google Ad Grants and paid advertising ROI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground font-bold">
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Campaign Optimization</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Keyword Research</li>
                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" />Budget Management</li>
                  </ul>
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="w-full py-20 px-6">
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trusted by Nonprofits Making a Difference</h2>
            <p className="text-xl text-muted-foreground">
              Join our beta testing group and receive a substantial discount on our platform when we "Go Live"
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
                  "Causeio transformed our donor engagement. Our chatbot answers questions and directs supporters to give 24/7."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold mr-3">
                    JS
                  </div>
                  <div>
                    <div className="font-semibold">Jane Smith</div>
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
                  "The QR code analytics helped us track which fundraising materials drive the most donations. Game changer!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold mr-3">
                    MD
                  </div>
                  <div>
                    <div className="font-semibold">Mike Davis</div>
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
                  </div>
                </div>
              </CardContent>
            </Card>
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

      {/* Blog Section */}
      <BlogSection />

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
          <a href="https://calendly.com/joe-bizooma/30min" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="text-lg px-8">
              Schedule a Call
            </Button>
          </a>
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