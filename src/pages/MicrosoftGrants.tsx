import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";
import {
  Cloud,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Calendar,
  Sparkles,
  Wrench,
  LineChart,
  ShieldCheck,
  Cpu,
  GraduationCap,
  Building2,
} from "lucide-react";

export default function MicrosoftGrants() {
  return (
    <>
      <SEOHead
        title="Microsoft Grants for Nonprofits | CauseIO"
        description="Everything nonprofits need to know about Microsoft for Nonprofits — Microsoft 365, Azure credits, Copilot discounts, and the status of the Ads for Social Impact program."
        keywords="microsoft grants nonprofits, microsoft for nonprofits, microsoft ads for social impact, azure credits nonprofits, microsoft 365 nonprofit"
      />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4" variant="secondary">
                <Cloud className="w-3 h-3 mr-1" />
                Microsoft for Nonprofits
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Microsoft Grants for Nonprofits
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Free and deeply discounted Microsoft 365, Azure cloud credits, and AI tools to help
                your nonprofit run securely, scale faster, and serve your community better.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" asChild>
                  <a
                    href="https://www.microsoft.com/en-us/nonprofits"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Microsoft for Nonprofits <ExternalLink className="ml-2 w-4 h-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a
                    href="https://www.microsoft.com/en-us/nonprofits/eligibility"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Check Eligibility
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-6xl">
          {/* Critical announcement banner */}
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Heads up: Ads for Social Impact is ending</AlertTitle>
            <AlertDescription>
              Microsoft has announced that the <strong>Ads for Social Impact</strong> program (free
              monthly Bing/Microsoft search ad credits for nonprofits) will be discontinued in
              December 2025, with the <strong>final grants issued on November 30, 2025</strong>.
              Microsoft's broader nonprofit program (Microsoft 365, Azure, Copilot discounts) is{" "}
              <strong>not</strong> affected. If you're looking for ongoing free advertising, the{" "}
              <Link to="/resources/google-ad-grants" className="underline font-medium">
                Google Ad Grants program
              </Link>{" "}
              is still very much active at $10,000/month.
            </AlertDescription>
          </Alert>

          {/* Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                What is Microsoft for Nonprofits?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Microsoft for Nonprofits is a global initiative under{" "}
                <strong>Microsoft Elevate</strong> that gives mission-driven organizations access to
                affordable, secure, and scalable technology. Eligible nonprofits get free or
                heavily discounted access to productivity tools, cloud infrastructure, and AI
                capabilities normally reserved for paying enterprise customers.
              </p>
              <p className="text-muted-foreground">
                Eligibility is validated by trusted third-party providers (typically TechSoup or a
                regional equivalent) before grants and discounts are activated.
              </p>
            </CardContent>
          </Card>

          {/* What's included */}
          <h2 className="text-2xl font-bold mb-4">What's included</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <Sparkles className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Microsoft 365 Business Premium</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Up to <strong>10 free seats</strong> of Microsoft 365 Business Premium for
                  qualifying nonprofits, with deep discounts on additional licenses.
                </p>
                <p>Includes Outlook, Word, Excel, PowerPoint, Teams, SharePoint, and OneDrive.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Cloud className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Azure Cloud Credits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>$2,000 in annual Azure credits</strong> for hosting websites, databases,
                  AI workloads, and donor-facing applications.
                </p>
                <p>Discounted rates on additional Azure consumption beyond the grant.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Cpu className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Microsoft Copilot & AI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Discounted access to Microsoft Copilot for Microsoft 365 — AI-powered assistance
                  inside Word, Excel, Outlook, and Teams.
                </p>
                <p>Helps small nonprofit teams punch above their weight on writing and analysis.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <ShieldCheck className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Security & Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Microsoft Defender, Intune device management, and identity protection — critical
                  for protecting donor data and meeting compliance obligations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <GraduationCap className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Training & LinkedIn Learning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Free skills training, Microsoft certifications discounts, and access to LinkedIn
                  Learning courses for staff development.
                </p>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardHeader>
                <Calendar className="w-8 h-8 text-muted-foreground mb-2" />
                <CardTitle className="text-lg">Ads for Social Impact</CardTitle>
                <Badge variant="outline" className="w-fit">Ending Dec 2025</Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Previously offered $1,000/month in free Microsoft (Bing) search ads. Microsoft
                  has confirmed the program is being retired, with the final grants issued{" "}
                  <strong>November 30, 2025</strong>.
                </p>
                <p>
                  No replacement program has been announced.{" "}
                  <Link to="/resources/google-ad-grants" className="underline">
                    Google Ad Grants
                  </Link>{" "}
                  remains the strongest free search advertising option.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Eligibility */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Eligibility Requirements
              </CardTitle>
              <CardDescription>
                Microsoft validates eligibility through TechSoup (or regional equivalents) before
                activating any grant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>
                    Hold recognized legal status as a nonprofit or non-governmental organization in
                    your country (e.g., 501(c)(3) in the US).
                  </span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>
                    Operate on a not-for-profit basis with a mission to benefit the local community.
                  </span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>
                    Agree to Microsoft's anti-discrimination policy and code of conduct for
                    nonprofits.
                  </span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>
                    Complete validation through TechSoup or Microsoft's designated regional
                    partner.
                  </span>
                </li>
              </ul>
              <Alert className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Not eligible:</strong> Government entities, schools (eligible under a
                  separate Microsoft Education program), hospitals & medical groups, and political
                  or trade organizations are typically excluded.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* How to apply */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How to Apply</CardTitle>
              <CardDescription>The process typically takes 5-10 business days.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  {
                    title: "Register with TechSoup",
                    body:
                      "Create or sign in to your TechSoup account and complete nonprofit verification. This is the gateway for most Microsoft nonprofit grants.",
                  },
                  {
                    title: "Apply at Microsoft for Nonprofits",
                    body:
                      "Go to microsoft.com/nonprofits and start the registration. You'll be asked to link your TechSoup validation token.",
                  },
                  {
                    title: "Wait for validation",
                    body:
                      "Microsoft reviews your application. Most decisions arrive within 5-10 business days, though it can take longer during high-volume periods.",
                  },
                  {
                    title: "Activate your grants",
                    body:
                      "Once approved, claim your Microsoft 365 seats, Azure credits, and any other applicable benefits through the nonprofit admin portal.",
                  },
                  {
                    title: "Reapply annually",
                    body:
                      "Most grants (especially Azure credits) renew annually. Mark your calendar to reconfirm eligibility each year.",
                  },
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Done-for-you CTA */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
            <CardHeader>
              <Badge className="w-fit mb-2" variant="secondary">
                <Sparkles className="w-3 h-3 mr-1" />
                Done-For-You by CauseIO
              </Badge>
              <CardTitle className="text-2xl md:text-3xl">
                Let our team handle Microsoft setup for you
              </CardTitle>
              <CardDescription className="text-base">
                Most nonprofits never claim everything they're entitled to from Microsoft — the
                portals are confusing, validation can stall, and Azure especially requires technical
                know-how to deploy. Our team handles the whole thing so you actually use the value
                you've been granted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-2">
                  <CardHeader>
                    <Wrench className="w-8 h-8 text-primary mb-2" />
                    <CardTitle className="text-xl">Microsoft Grant Setup</CardTitle>
                    <CardDescription>One-time engagement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {[
                        "TechSoup validation & nonprofit registration",
                        "Microsoft 365 tenant setup with all 10 free seats provisioned",
                        "Email migration from existing provider (Google, GoDaddy, etc.)",
                        "Azure subscription created with $2,000 credit applied",
                        "Security baseline (Defender, MFA, conditional access)",
                        "Staff training on Teams, SharePoint, and Outlook",
                      ].map((item) => (
                        <li key={item} className="flex gap-2">
                          <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary relative">
                  <Badge className="absolute -top-3 right-4">Most Popular</Badge>
                  <CardHeader>
                    <LineChart className="w-8 h-8 text-primary mb-2" />
                    <CardTitle className="text-xl">Ongoing Microsoft Management</CardTitle>
                    <CardDescription>Flat monthly fee</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {[
                        "Tenant administration & user lifecycle management",
                        "Azure cost monitoring so you never exceed your free credits",
                        "Patch management, security updates, threat monitoring",
                        "Helpdesk support for your staff",
                        "Annual grant re-validation handled for you",
                        "Quarterly review of new Microsoft nonprofit offers",
                      ].map((item) => (
                        <li key={item} className="flex gap-2">
                          <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button size="lg" asChild>
                  <a
                    href="https://calendly.com/joe-bizooma/30min"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule a free consultation
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/pricing">View pricing</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Custom pricing based on org size and Azure usage. Most nonprofits see Microsoft
                grants pay for our management fees several times over.
              </p>
            </CardContent>
          </Card>

          {/* Resources */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Official Microsoft Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    href: "https://www.microsoft.com/en-us/nonprofits",
                    title: "Microsoft for Nonprofits Homepage",
                    desc: "Official program overview and registration",
                  },
                  {
                    href: "https://www.microsoft.com/en-us/nonprofits/eligibility",
                    title: "Eligibility Guidelines",
                    desc: "Detailed criteria and validation process",
                  },
                  {
                    href: "https://learn.microsoft.com/en-us/industry/nonprofit/microsoft-for-nonprofits/program-overview",
                    title: "Microsoft Learn: Program Overview",
                    desc: "Technical documentation for IT administrators",
                  },
                  {
                    href: "https://www.techsoup.org/",
                    title: "TechSoup",
                    desc: "Required validation partner for most Microsoft nonprofit grants",
                  },
                ].map((r) => (
                  <a
                    key={r.href}
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-primary" />
                    <div>
                      <div className="font-medium">{r.title}</div>
                      <div className="text-sm text-muted-foreground">{r.desc}</div>
                    </div>
                  </a>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Information sourced from Microsoft's official nonprofit program pages and recent
                program announcements. Last updated: April 2026.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
