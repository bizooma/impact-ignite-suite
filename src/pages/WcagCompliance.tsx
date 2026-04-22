import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  Shield,
  Accessibility,
  AlertTriangle,
  CheckCircle,
  Eye,
  Keyboard,
  Type,
  MousePointer,
  Languages,
  Code2,
  Scale,
  FileWarning,
} from "lucide-react";

export default function WcagCompliance() {
  const features = [
    { icon: Eye, title: "Screen Reader Optimization", desc: "Improves compatibility with assistive screen reader technology." },
    { icon: Keyboard, title: "Keyboard Navigation", desc: "Full site navigation without a mouse, including skip links and focus traps." },
    { icon: Type, title: "Font & Contrast Controls", desc: "Adjust text size, spacing, and high-contrast color modes on demand." },
    { icon: Accessibility, title: "Dyslexia-Friendly Fonts", desc: "Switch to readable fonts and content scaling for cognitive accessibility." },
    { icon: MousePointer, title: "Cursor & Focus Indicators", desc: "Larger cursors and visible focus rings for low-vision and motor-impaired users." },
    { icon: Languages, title: "Multi-Language Menu", desc: "Accessibility menu translated into multiple languages for global supporters." },
    { icon: Code2, title: "One-Line Embed", desc: "Drop a single script tag into your site — no developer rebuild required." },
    { icon: Shield, title: "Accessibility Statement", desc: "Auto-generated public statement showing your good-faith compliance effort." },
  ];

  return (
    <>
      <SEOHead
        title="WCAG Compliance & ADA Lawsuit Protection for Nonprofits"
        description="Protect your nonprofit website from ADA lawsuits with Causeio's accessibility widget. Support WCAG 2.1/2.2 AA compliance, screen readers, keyboard navigation, and more."
        canonical="/wcag-compliance"
        keywords="WCAG compliance, ADA website lawsuit, nonprofit accessibility, accessibility widget, WCAG 2.1 AA, ADA Title III"
      />

      <div className="min-h-screen bg-background">
        {/* Sticky Nav */}
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <Link to="/" className="font-bold text-lg">Causeio</Link>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </header>

        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-background border-b">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4" variant="secondary">
                <Shield className="w-3 h-3 mr-1" />
                Accessibility & Legal Risk
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Protect Your Nonprofit from ADA Website Lawsuits
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                ADA-related website lawsuits are at an all-time high. Causeio's accessibility widget helps your site support WCAG 2.1/2.2 AA standards and demonstrates a good-faith effort toward inclusive design.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/auth">Get Started Free</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/pricing">View Pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12 max-w-6xl space-y-16">
          {/* The Problem */}
          <section>
            <div className="max-w-3xl mx-auto text-center mb-10">
              <Badge variant="outline" className="mb-3">
                <AlertTriangle className="w-3 h-3 mr-1" /> The Problem
              </Badge>
              <h2 className="text-3xl font-bold mb-4">Nonprofits Are Not Exempt from ADA Lawsuits</h2>
              <p className="text-muted-foreground">
                More than 4,000 federal ADA Title III website lawsuits were filed in 2024 alone — and demand letters number in the tens of thousands. Nonprofits, churches, and small organizations are increasingly targeted.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <Scale className="w-8 h-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Rising Litigation</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Plaintiff firms file thousands of ADA web-accessibility cases every year, often against organizations with no in-house legal team.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <FileWarning className="w-8 h-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Costly Settlements</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Average settlements range from $5,000 to $25,000 — plus remediation costs that can climb much higher for unprepared organizations.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Accessibility className="w-8 h-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Underserved Supporters</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Roughly 1 in 4 U.S. adults lives with a disability. Inaccessible sites lose donations, volunteers, and trust.
                </CardContent>
              </Card>
            </div>
          </section>

          {/* What is WCAG */}
          <section>
            <div className="max-w-3xl mx-auto text-center mb-10">
              <Badge variant="outline" className="mb-3">The Standard</Badge>
              <h2 className="text-3xl font-bold mb-4">What Is WCAG?</h2>
              <p className="text-muted-foreground">
                The Web Content Accessibility Guidelines (WCAG 2.1 / 2.2) — published by the W3C — are the global benchmark courts and regulators reference. The "AA" conformance level is the practical target for most websites and is built around four principles:
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {[
                ["Perceivable", "Information must be presentable in ways users can perceive (alt text, captions, contrast)."],
                ["Operable", "Interfaces must work via keyboard and assistive devices, not just mouse and touch."],
                ["Understandable", "Content and navigation must be predictable and easy to comprehend."],
                ["Robust", "Content must work reliably with current and future assistive technologies."],
              ].map(([title, desc]) => (
                <div key={title} className="flex gap-3 p-4 rounded-lg border bg-card">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">{title}</div>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Our Compliance Widget */}
          <section>
            <div className="max-w-3xl mx-auto text-center mb-10">
              <Badge variant="outline" className="mb-3">The Solution</Badge>
              <h2 className="text-3xl font-bold mb-4">Our Accessibility Compliance Widget</h2>
              <p className="text-muted-foreground">
                One embed gives every visitor a personalized accessibility menu — and gives your organization a visible, documented commitment to inclusion.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map(({ icon: Icon, title, desc }) => (
                <Card key={title}>
                  <CardHeader>
                    <Icon className="w-7 h-7 text-primary mb-2" />
                    <CardTitle className="text-base">{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{desc}</CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Reduce Legal Risk */}
          <section className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <Badge variant="outline" className="mb-3">Why It Matters</Badge>
              <h2 className="text-3xl font-bold mb-4">How the Widget Helps Reduce Legal Risk</h2>
            </div>
            <div className="space-y-3">
              {[
                "Demonstrates a documented, good-faith effort toward WCAG conformance.",
                "Publishes an accessibility statement so visitors and attorneys can see your commitment.",
                "Provides every visitor with assistive tools — even if your site templates have gaps.",
                "Logs accessibility settings so you have a record of remediation activity.",
                "Shows courts and demand letters that you are actively investing in inclusion.",
              ].map((point) => (
                <div key={point} className="flex gap-3 items-start">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">{point}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Setup */}
          <section className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-3">Get Started</Badge>
              <h2 className="text-3xl font-bold mb-4">Enable in 3 Steps</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                ["1. Sign up", "Create your free Causeio account in under a minute."],
                ["2. Copy the embed", "Grab the one-line snippet from your dashboard."],
                ["3. Publish", "Paste it into your site template — the widget appears instantly."],
              ].map(([title, desc]) => (
                <Card key={title}>
                  <CardHeader>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription>{desc}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>

          {/* Legal Disclaimer */}
          <section className="max-w-4xl mx-auto">
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>Legal Disclaimer</AlertTitle>
              <AlertDescription className="mt-2 space-y-2 text-sm leading-relaxed">
                <p>
                  Causeio's accessibility widget is a tool designed to help improve website accessibility and support WCAG compliance efforts. It does <strong>not</strong> guarantee full WCAG, ADA, Section 508, or any other legal compliance.
                </p>
                <p>
                  <strong>Causeio is not liable</strong> for any lawsuits, claims, demand letters, damages, settlements, judgments, attorneys' fees, or any other costs that may arise from accessibility-related disputes involving your website. No automated tool — including ours — can replace a manual accessibility audit by a qualified expert.
                </p>
                <p>
                  Website owners are solely responsible for the accessibility of their sites and should consult qualified legal counsel and certified accessibility auditors to assess their specific compliance obligations.
                </p>
              </AlertDescription>
            </Alert>
          </section>

          {/* Final CTA */}
          <section className="text-center bg-gradient-to-br from-primary/10 to-background rounded-2xl p-10 border">
            <h2 className="text-3xl font-bold mb-3">Add the Widget to Your Site Today</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Make your nonprofit's website more inclusive — and more defensible — in minutes.
            </p>
            <Button size="lg" asChild>
              <Link to="/auth">Get Started Free</Link>
            </Button>
          </section>
        </div>

        {/* Footer */}
        <footer className="border-t mt-12">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
            &copy; 2026 Causeio. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}
