import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Copy, ExternalLink, AlertCircle, PlayCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface GbpSetupGuideProps {
  organizationId: string;
}

export function GbpSetupGuide({ organizationId }: GbpSetupGuideProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  const redirectUri = `https://svuxuhrsrawdqqkepeye.supabase.co/functions/v1/gbp-oauth-callback`;

  const copyToClipboard = (text: string, stepId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepId);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const handleGoToIntegrations = () => {
    navigate('/dashboard/integrations?provider=google_business&action=add');
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Get Started with Google Business Profile</CardTitle>
              <CardDescription className="mt-2 text-base">
                Connect your Google Business Profile to unlock powerful review management features
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Monitor customer reviews automatically</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Get AI-generated response suggestions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Manage multiple business locations</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Track optimization tasks</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>Follow these steps to connect your Google Business Profile (5-10 minutes)</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible defaultValue="step-1" className="w-full">
            <AccordionItem value="step-1">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">1</div>
                  <span>Create Google Cloud Project</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pl-11">
                <p className="text-muted-foreground">Go to Google Cloud Console and create a new project</p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Google Cloud Console
                  </a>
                </Button>
                <p className="text-sm text-muted-foreground">Suggested project name: "[Your Organization] - GBP Integration"</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-2">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">2</div>
                  <span>Enable Google My Business API</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pl-11">
                <p className="text-muted-foreground">Navigate to APIs & Services → Library and enable the API</p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://console.cloud.google.com/apis/library/mybusinessaccountmanagement.googleapis.com" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Enable Google My Business API
                  </a>
                </Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-3">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">3</div>
                  <span>Create OAuth 2.0 Credentials</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pl-11">
                <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                  <li>Go to APIs & Services → Credentials</li>
                  <li>Click "Create Credentials" → OAuth Client ID</li>
                  <li>Application type: <strong>Web application</strong></li>
                  <li>Name: "Causeio GBP Integration"</li>
                </ol>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Credentials Page
                  </a>
                </Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-4">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">4</div>
                  <span>Configure OAuth Consent Screen</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pl-11">
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  <li>User type: External</li>
                  <li>Add required scopes for Google My Business</li>
                  <li>Add test users if needed</li>
                </ul>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Configure Consent Screen
                  </a>
                </Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-5">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">5</div>
                  <span>Set Authorized Redirect URI</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pl-11">
                <p className="text-muted-foreground">Add this exact URI to your OAuth client:</p>
                <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
                  <code className="flex-1 text-xs break-all">{redirectUri}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(redirectUri, 'redirect-uri')}
                  >
                    {copiedStep === 'redirect-uri' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">⚠️ Make sure to copy this exactly, including https://</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-6">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">6</div>
                  <span>Get Your Credentials</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pl-11">
                <p className="text-muted-foreground">After creating the OAuth client, you'll receive:</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>Client ID</li>
                  <li>Client Secret</li>
                </ul>
                <p className="text-sm text-muted-foreground">Keep these handy for the next step!</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-7">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">7</div>
                  <span>Add to Causeio</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pl-11">
                <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                  <li>Click the button below to go to Integrations</li>
                  <li>Click "Add Integration"</li>
                  <li>Select "Google Business Profile"</li>
                  <li>Paste your Client ID and Client Secret</li>
                  <li>Click "Connect"</li>
                </ol>
                <Button onClick={handleGoToIntegrations} className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Go to Integrations
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base">Common Issues</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Make sure Google My Business API is enabled in your project</p>
          <p>• Redirect URI must match exactly (including https://)</p>
          <p>• OAuth consent screen must be configured before creating credentials</p>
          <p>• If you see permission errors, check that you've added the required scopes</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" asChild>
          <a href="https://docs.lovable.dev" target="_blank" rel="noopener noreferrer">
            View Documentation
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="mailto:support@causeio.com">
            Contact Support
          </a>
        </Button>
      </div>
    </div>
  );
}
