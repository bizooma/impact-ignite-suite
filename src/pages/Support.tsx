import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MessageCircle, BookOpen, LifeBuoy } from 'lucide-react';

const TAWK_SCRIPT_ID = 'tawk-to-support-script';
const TAWK_SRC = 'https://embed.tawk.to/69e7bf9e5977cf1c37318b05/1jmok919v';

export default function Support() {
  useEffect(() => {
    if (document.getElementById(TAWK_SCRIPT_ID)) return;

    const w = window as unknown as Record<string, unknown>;
    w.Tawk_API = w.Tawk_API || {};
    w.Tawk_LoadStart = new Date();

    const script = document.createElement('script');
    script.id = TAWK_SCRIPT_ID;
    script.src = TAWK_SRC;
    script.async = true;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    document.body.appendChild(script);

    return () => {
      document.getElementById(TAWK_SCRIPT_ID)?.remove();
      document
        .querySelectorAll(
          'iframe[src*="tawk.to"], iframe[title*="chat" i], div[class*="tawk-" i], #tawkchat-container, .widget-visible'
        )
        .forEach((el) => el.remove());
      const win = window as unknown as Record<string, unknown>;
      delete win.Tawk_API;
      delete win.Tawk_LoadStart;
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <LifeBuoy className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Support</h1>
          <p className="text-muted-foreground">We're here to help you succeed.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Mail className="w-6 h-6 text-primary mb-2" />
            <CardTitle>Email Support</CardTitle>
            <CardDescription>
              Reach our team directly. We typically respond within 1 business day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="mailto:support@causeio.com">support@causeio.com</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <MessageCircle className="w-6 h-6 text-primary mb-2" />
            <CardTitle>Live Chat</CardTitle>
            <CardDescription>
              Look for the chat launcher in the bottom-right corner of this page to start a conversation with our team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Available during business hours.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <BookOpen className="w-6 h-6 text-primary mb-2" />
            <CardTitle>Documentation</CardTitle>
            <CardDescription>
              Browse guides, tutorials, and product docs to learn faster.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline">View Docs</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <LifeBuoy className="w-6 h-6 text-primary mb-2" />
            <CardTitle>Submit a Request</CardTitle>
            <CardDescription>
              Report a bug or request a new feature. Our product team reviews every submission.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline">Submit Request</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">How do I invite team members?</p>
            <p className="text-sm text-muted-foreground">
              Go to Team Members in the Admin section of the sidebar to send invitations.
            </p>
          </div>
          <div>
            <p className="font-medium">How do I upgrade my plan?</p>
            <p className="text-sm text-muted-foreground">
              Visit the Pricing page to view available plans and upgrade your subscription.
            </p>
          </div>
          <div>
            <p className="font-medium">Where can I find my integrations?</p>
            <p className="text-sm text-muted-foreground">
              Open the Integrations page from the Admin section to connect external services.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
