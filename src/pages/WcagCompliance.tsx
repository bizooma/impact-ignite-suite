import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import causeioLogo from "@/assets/causeio-logo.png";
import {
  Shield,
  Accessibility,
  AlertTriangle,
  CheckCircle,
  Eye,
  Keyboard,
  Type,
  MousePointer2,
  Languages,
  Code2,
  ExternalLink,
  Scale,
  Newspaper,
  ArrowLeft,
} from "lucide-react";

const newsArticles = [
  {
    title: "ADA deadline small businesses don't know is coming",
    source: "Kansas City Star",
    summary:
      "~3,948 federal ADA website lawsuits filed in 2025 (up ~24%), with over 2,000 cases in just the first half of the year. Small organizations are frequent targets because they lack compliance resources.",
    url: "https://www.kansascity.com/news/business/article308401450.html",
  },
  {
    title: "DOJ Throws Wrench Into ADA Website Accessibility Settlement",
    source: "Law360 / Industry Coverage",
    summary:
      "The U.S. Department of Justice intervened in a live ADA website lawsuit and even criticized the settlement website itself for being inaccessible — proof that ADA website compliance is actively litigated.",
    url: "https://www.law360.com/articles/1799999/doj-throws-wrench-into-ada-website-accessibility-deal",
  },
  {
    title: "The Law Firm Hitting Businesses With Thousands of Disability Suits",
    source: "Wall Street Journal",
    summary:
      "One law firm filed 1,100+ website accessibility lawsuits in a single year. Businesses across e-commerce and small-business sectors were targeted at industrial scale.",
    url: "https://www.wsj.com/articles/the-law-firm-hitting-businesses-with-thousands-of-disability-suits-11643812200",
  },
  {
    title: "ADA Website Lawsuit Trends: What 2025 Filings Mean for 2026",
    source: "UsableNet",
    summary:
      "5,000+ ADA website lawsuits filed in 2025. Filings have effectively doubled since 2020, with ~78% targeting e-commerce and consumer-facing websites.",
    url: "https://info.usablenet.com/2025-mid-year-ada-web-accessibility-lawsuit-report",
  },
  {
    title: "2026 Web Accessibility Litigation Report",
    source: "AudioEye",
    summary:
      "Industry trend report quantifying repeat litigation patterns, the rise of serial plaintiffs, and the categories of organizations most exposed to ADA web accessibility claims.",
    url: "https://www.audioeye.com/post/digital-accessibility-lawsuits/",
  },
  {
    title: "Consequences of Accessibility Non-Compliance",
    source: "Government Information Center",
    summary:
      "142 municipalities have been sued over accessibility issues. Public-facing organizations — including nonprofits, associations, and foundations — fall under the same scrutiny.",
    url: "https://digital.gov/resources/section-508-quick-reference-guide/",
  },
  {
    title: "ADA Compliance Requirements for Websites 2026",
    source: "DigitalA11Y",
    summary:
      "DOJ now requires WCAG 2.1 AA compliance for state and local government websites. Courts increasingly treat nonprofits and associations as 'places of public accommodation,' applying the same standards.",
    url: "https://www.digitala11y.com/ada-website-compliance/",
  },
];

const widgetFeatures = [
  {
    icon: Eye,
    title: "Screen Reader Optimization",
    description: "Enhances ARIA labels, landmarks, and reading order for visually impaired users.",
  },
  {
    icon: Keyboard,
    title: "Keyboard Navigation",
    description: "Full keyboard-only navigation, focus traps, and skip-to-content shortcuts.",
  },
  {
    icon: Type,
    title: "Text & Contrast Controls",
    description: "Font size, line spacing, dyslexia-friendly fonts, and high-contrast color modes.",
  },
  {
    icon: MousePointer2,
    title: "Cursor & Focus Indicators",
    description: "Larger cursors and high-visibility focus rings for users with motor impairments.",
  },
  {
    icon: Languages,
    title: "Multi-Language Menu",
    description: "Accessibility menu translated into 50+ languages for global audiences.",
  },
  {
    icon: Code2,
    title: "One-Line Embed",
    description: "Drop a single script tag into your site — no developer required.",
  },
];

export default function WcagCompliance() {
  return (
    <>
      <SEOHead
        title="WCAG Compliance & ADA Lawsuit Protection for Nonprofits"
        description="Protect your nonprofit website from ADA accessibility lawsuits. Causeio's compliance widget helps support WCAG 2.1/2.2 AA standards with a one-line install."
        keywords="WCAG compliance, ADA website lawsuit, nonprofit accessibility, ADA compliance widget, accessibility widget, Section 508"
        canonical="/wcag-compliance"
      />

      <div className="min-h-screen bg-background">
        {/* Sticky Top Nav */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto px-4 h-14 flex items-center justify-between max-w-6xl">
            <Link to="/" className="flex items-center">
              <img src={causeioLogo} alt="Causeio - Where Purpose Meets Performance" className="h-10" />
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </header>

        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-background border-b">
          <div className="mx-auto px-4 py-16 md:py-24 max-w-6xl">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4" variant="secondary">
                <Shield className="w-3 h-3 mr-1" />
                ADA & WCAG Compliance
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Protect Your Nonprofit from ADA Website Lawsuits
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                ADA website lawsuits topped <span className="text-primary font-semibold">5,000 in 2025</span> — and
                nonprofits aren't exempt. Add Causeio's accessibility widget to demonstrate good-faith WCAG compliance
                in minutes.
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

        <div className="mx-auto px-4 py-12 max-w-6xl space-y-12">
          {/* The Problem */}
          <section>
            <div className="flex items-center justify-center gap-2 mb-6">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <h2 className="text-3xl font-bold text-center">The Rising Cost of Inaccessible Websites</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl text-primary">5,000+</CardTitle>
                  <CardDescription>ADA website lawsuits filed in 2025</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl text-primary">2x</CardTitle>
                  <CardDescription>Filings have doubled since 2020</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl text-primary">142</CardTitle>
                  <CardDescription>Municipalities sued over accessibility</CardDescription>
                </CardHeader>
              </Card>
            </div>
            <p className="text-muted-foreground mt-6 leading-relaxed text-center max-w-3xl mx-auto">
              Nonprofits, foundations, and membership associations are increasingly treated by courts as "places of
              public accommodation" under ADA Title III — meaning the same lawsuits hitting e-commerce companies are
              now reaching mission-driven organizations.
            </p>
          </section>

          {/* Recent News */}
          <section>
            <div className="flex items-center justify-center gap-2 mb-6">
              <Newspaper className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold text-center">Recent News & Reports on ADA Website Lawsuits</h2>
            </div>
            <p className="text-muted-foreground mb-8 text-center max-w-3xl mx-auto">
              The threat isn't theoretical. Here's a sampling of recent reporting and industry research documenting the
              surge in accessibility-related litigation:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {newsArticles.map((article) => (
                <Card key={article.url} className="flex flex-col">
                  <CardHeader>
                    <Badge variant="outline" className="w-fit mb-2">
                      {article.source}
                    </Badge>
                    <CardTitle className="text-lg leading-snug">{article.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground flex-1">{article.summary}</p>
                    <Button variant="link" className="px-0 mt-3 w-fit" asChild>
                      <a href={article.url} target="_blank" rel="noopener noreferrer">
                        Read article <ExternalLink className="ml-1 w-3 h-3" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* What is WCAG */}
          <section>
            <div className="flex items-center justify-center gap-2 mb-6">
              <Scale className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold text-center">What is WCAG?</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  The <strong>Web Content Accessibility Guidelines (WCAG) 2.1 / 2.2 Level AA</strong> are the
                  internationally recognized technical standard for web accessibility — and the de facto benchmark
                  courts and the DOJ use to evaluate ADA compliance. WCAG is built on four principles:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: "Perceivable", desc: "Content must be presentable in ways users can perceive (alt text, captions, contrast)." },
                    { title: "Operable", desc: "Interfaces must be navigable by keyboard, voice, and assistive tech." },
                    { title: "Understandable", desc: "Text and behavior must be readable and predictable." },
                    { title: "Robust", desc: "Content must work reliably with current and future assistive technologies." },
                  ].map((p) => (
                    <div key={p.title} className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">{p.title}</h4>
                        <p className="text-sm text-muted-foreground">{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Widget Features */}
          <section>
            <div className="flex items-center justify-center gap-2 mb-6">
              <Accessibility className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold text-center">What Causeio's Compliance Widget Does</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {widgetFeatures.map((f) => (
                <Card key={f.title}>
                  <CardHeader>
                    <f.icon className="w-8 h-8 text-primary mb-2" />
                    <CardTitle className="text-lg">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{f.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* How It Helps */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-center">How It Helps Reduce Legal Risk</h2>
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {[
                    "Demonstrates a documented, good-faith effort toward WCAG compliance",
                    "Surfaces an accessibility statement and contact channel for users",
                    "Provides assistive tools directly to visitors without requiring downloads",
                    "Logs accessibility settings to show ongoing remediation",
                    "Reduces friction for screen-reader and keyboard-only users — the most common plaintiffs",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Setup Steps */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-center">How to Enable It</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { step: "1", title: "Sign Up", desc: "Create your free Causeio account in under a minute." },
                { step: "2", title: "Copy the Embed", desc: "Grab the one-line script snippet from your dashboard." },
                { step: "3", title: "Publish", desc: "Paste it into your site's <head> tag and you're live." },
              ].map((s) => (
                <Card key={s.step}>
                  <CardHeader>
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-2">
                      {s.step}
                    </div>
                    <CardTitle>{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Legal Disclaimer */}
          <section>
            <Alert variant="destructive" className="border-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="text-lg font-bold">Legal Disclaimer</AlertTitle>
              <AlertDescription className="mt-2 leading-relaxed">
                Causeio's accessibility widget is a tool designed to help improve website accessibility and support
                WCAG compliance efforts. It does <strong>not</strong> guarantee full WCAG, ADA, Section 508, or any
                other legal compliance, and <strong>Causeio is not liable</strong> for any lawsuits, claims, damages,
                settlements, or legal fees that may arise from accessibility-related disputes. Website owners are
                solely responsible for the accessibility of their sites and should consult qualified legal counsel and
                certified accessibility auditors to assess compliance.
              </AlertDescription>
            </Alert>
          </section>

          {/* Final CTA */}
          <section className="text-center bg-gradient-to-br from-primary/10 to-background rounded-2xl p-12 border">
            <h2 className="text-3xl font-bold mb-4">Add the Widget to Your Site Today</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join nonprofits taking proactive steps to make their websites accessible to every supporter, donor, and
              volunteer.
            </p>
            <Button size="lg" asChild>
              <Link to="/auth">Get Started Free</Link>
            </Button>
          </section>
        </div>

        {/* Footer */}
        <footer className="border-t mt-12">
          <div className="mx-auto px-4 py-8 text-center text-sm text-muted-foreground max-w-6xl">
            &copy; 2026 Causeio. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}
