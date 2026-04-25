import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { 
  DollarSign, 
  CheckCircle, 
  Target, 
  Users, 
  TrendingUp,
  AlertCircle,
  ExternalLink,
  FileText,
  Clock,
  Award,
  Sparkles,
  Wrench,
  LineChart,
  Calendar
} from "lucide-react";
import { Link } from "react-router-dom";

export default function GoogleAdGrants() {
  return (
    <>
      <SEOHead
        title="Google Ad Grants for Nonprofits"
        description="Learn how your nonprofit can get up to $10,000/month in free Google Ads through the Google Ad Grants program. Eligibility, benefits, and application guide."
        keywords="google ad grants, nonprofit advertising, free google ads, nonprofit marketing, google for nonprofits"
      />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4" variant="secondary">
                <DollarSign className="w-3 h-3 mr-1" />
                Free Advertising Program
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Google Ad Grants for Nonprofits
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Get up to <span className="text-primary font-semibold">$10,000/month</span> in free Google Ads to promote your mission and reach more supporters
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" asChild>
                  <a href="https://www.google.com/grants/" target="_blank" rel="noopener noreferrer">
                    Apply Now <ExternalLink className="ml-2 w-4 h-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="https://support.google.com/grants/" target="_blank" rel="noopener noreferrer">
                    View Documentation
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-6xl">
          {/* Overview Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                What is Google Ad Grants?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Google Ad Grants is a program that empowers eligible nonprofit organizations to promote their missions 
                and initiatives on Google Search through in-kind advertising. Organizations receive up to $10,000 per 
                month in free search ads to increase awareness, attract donors, and recruit volunteers.
              </p>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Annual Value:</strong> This program provides up to $120,000 per year in free advertising, 
                  helping nonprofits compete with larger organizations and reach their target audiences effectively.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <TrendingUp className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Increase Website Traffic</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Drive more visitors to your website when people search for causes related to your mission.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Reach More Supporters</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Connect with potential donors, volunteers, and advocates who are searching for ways to help.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Award className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Level the Playing Field</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Compete with larger organizations and gain visibility without a massive advertising budget.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Eligibility Requirements */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Eligibility Requirements
              </CardTitle>
              <CardDescription>
                To qualify for Google Ad Grants, your organization must meet these criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>Must be a registered 501(c)(3) nonprofit organization (or equivalent in your country)</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>Must have a live website with substantial content about your organization's mission and activities</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>Must acknowledge and agree to Google's required certifications regarding nondiscrimination and donation receipt</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>Must have a valid Google for Nonprofits account</span>
                </li>
              </ul>
              <Alert className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> Government entities, hospitals, medical groups, and schools are not eligible for Google Ad Grants.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Application Process */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                How to Apply
              </CardTitle>
              <CardDescription>
                Follow these steps to apply for Google Ad Grants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Register with Google for Nonprofits</h3>
                    <p className="text-sm text-muted-foreground">
                      Visit the Google for Nonprofits website and create an account. You'll need to verify your nonprofit status through TechSoup or your country's equivalent validation partner.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Complete Nonprofit Verification</h3>
                    <p className="text-sm text-muted-foreground">
                      Provide documentation to verify your organization's nonprofit status. This process typically takes 2-14 business days.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Activate Google Ad Grants</h3>
                    <p className="text-sm text-muted-foreground">
                      Once verified, activate Google Ad Grants from your Google for Nonprofits dashboard. Review and agree to the program policies.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Set Up Your Google Ads Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Create your Google Ads account linked to your Ad Grants access. Configure billing settings and link a valid payment method for account verification.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    5
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Create Your First Campaign</h3>
                    <p className="text-sm text-muted-foreground">
                      Build your first ad campaign following Google Ad Grants policies. Focus on relevant keywords, compelling ad copy, and optimized landing pages.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Program Requirements */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Ongoing Program Requirements
              </CardTitle>
              <CardDescription>
                To maintain your Google Ad Grants account in good standing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  <span><strong>Click-Through Rate (CTR):</strong> Maintain at least 5% CTR per month across your account</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  <span><strong>Account Activity:</strong> Log into your Google Ads account at least once per month</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  <span><strong>Keyword Requirements:</strong> Cannot use single-word keywords (with limited exceptions for branded terms)</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  <span><strong>Quality Score:</strong> Maintain Quality Score of at least 3 for all keywords</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  <span><strong>Website Quality:</strong> Website must have substantial content and clear calls-to-action</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  <span><strong>Conversion Tracking:</strong> Must set up conversion tracking within your Google Ads account</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  <span><strong>Annual Survey:</strong> Complete the required annual program survey to share your success stories</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Best Practices */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Best Practices for Success</CardTitle>
              <CardDescription>
                Tips to maximize your Google Ad Grants impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Keyword Strategy
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Use specific, relevant keywords (2-3 words)</li>
                    <li>• Focus on mission-related terms</li>
                    <li>• Include location-based keywords</li>
                    <li>• Regularly review and optimize keyword performance</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Ad Copy Tips
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Write clear, compelling headlines</li>
                    <li>• Include strong calls-to-action</li>
                    <li>• Highlight your unique value proposition</li>
                    <li>• Use all available ad extensions</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Landing Page Optimization
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Ensure fast page load times</li>
                    <li>• Make donation/action buttons prominent</li>
                    <li>• Keep messaging consistent with ads</li>
                    <li>• Optimize for mobile devices</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    Account Management
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Monitor performance metrics weekly</li>
                    <li>• Pause underperforming keywords</li>
                    <li>• Test different ad variations (A/B testing)</li>
                    <li>• Set up automated rules for efficiency</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Resources</CardTitle>
              <CardDescription>
                Helpful links and documentation to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <a 
                  href="https://www.google.com/grants/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-primary" />
                  <div>
                    <div className="font-medium">Google Ad Grants Homepage</div>
                    <div className="text-sm text-muted-foreground">Official program information and application</div>
                  </div>
                </a>

                <a 
                  href="https://www.google.com/nonprofits/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-primary" />
                  <div>
                    <div className="font-medium">Google for Nonprofits</div>
                    <div className="text-sm text-muted-foreground">Register and manage your nonprofit account</div>
                  </div>
                </a>

                <a 
                  href="https://support.google.com/grants/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-primary" />
                  <div>
                    <div className="font-medium">Google Ad Grants Help Center</div>
                    <div className="text-sm text-muted-foreground">Comprehensive documentation and troubleshooting</div>
                  </div>
                </a>

                <a 
                  href="https://skillshop.withgoogle.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-primary" />
                  <div>
                    <div className="font-medium">Google Skillshop</div>
                    <div className="text-sm text-muted-foreground">Free training courses on Google Ads</div>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Done-For-You Managed Services */}
          <Card className="mt-12 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
            <CardHeader>
              <Badge className="w-fit mb-2" variant="secondary">
                <Sparkles className="w-3 h-3 mr-1" />
                Done-For-You by CauseIO
              </Badge>
              <CardTitle className="text-2xl md:text-3xl">
                Don't have time to learn it all? Let our team do it for you.
              </CardTitle>
              <CardDescription className="text-base">
                Most nonprofits leave thousands of dollars on the table every month because the application
                process feels overwhelming and ongoing campaign management requires expertise they don't have
                in-house. CauseIO's certified Google Ads team handles the entire process — from application
                to optimization — so you can focus on your mission.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Two-tier offering */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Tier 1: Setup */}
                <Card className="border-2">
                  <CardHeader>
                    <Wrench className="w-8 h-8 text-primary mb-2" />
                    <CardTitle className="text-xl">Grant Setup & Approval</CardTitle>
                    <CardDescription>One-time engagement</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      We handle the entire application end-to-end so your nonprofit gets approved the
                      first time around.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>TechSoup verification & Google for Nonprofits enrollment</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>Google Ad Grants account activation</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>Conversion tracking installed on your website</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>Initial keyword research & ad group structure</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>First 3 launch campaigns built & approved</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>Landing page audit & recommendations</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Tier 2: Ongoing PPC */}
                <Card className="border-2 border-primary relative">
                  <Badge className="absolute -top-3 right-4">Most Popular</Badge>
                  <CardHeader>
                    <LineChart className="w-8 h-8 text-primary mb-2" />
                    <CardTitle className="text-xl">Ongoing PPC Management</CardTitle>
                    <CardDescription>Flat monthly fee</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Your $10,000/month grant only delivers results when someone is actively
                      managing it. We keep you compliant, optimized, and growing.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>Weekly campaign optimization & bid management</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>Keep CTR above 5% to avoid account suspension</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>Quality Score monitoring & keyword cleanup</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>New ad copy & A/B testing each month</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>Monthly performance report with ROI insights</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>Annual program survey & policy compliance</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>Dedicated Google Ads strategist</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Why it matters */}
              <div className="rounded-lg border bg-muted/30 p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Why ongoing management matters
                </h3>
                <p className="text-sm text-muted-foreground">
                  Google suspends inactive Ad Grants accounts. Without monthly attention, your account
                  can lose access to the full $10,000/month, drop below the 5% CTR threshold, or get
                  flagged for policy violations. Our team makes sure your grant keeps working — so
                  every month you're driving real donations, volunteers, and program awareness.
                </p>
              </div>

              {/* CTA */}
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
                Custom pricing based on grant size and campaign complexity. Most nonprofits start at a
                flat monthly rate well below what they'd pay an in-house specialist.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
