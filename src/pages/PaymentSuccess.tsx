import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Zap, Loader2, AlertCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Status = "verifying" | "confirmed" | "timeout";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<Status>(sessionId ? "verifying" : "timeout");

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    const maxAttempts = 10;
    const pollInterval = 2000;

    const poll = async () => {
      for (let i = 0; i < maxAttempts; i++) {
        if (cancelled) return;
        try {
          const { data, error } = await supabase.functions.invoke('check-subscription');
          if (!error && data?.subscribed) {
            if (!cancelled) {
              setStatus("confirmed");
              toast.success("Payment successful! Welcome to Causeio!");
            }
            return;
          }
        } catch (e) {
          console.error('check-subscription error', e);
        }
        await new Promise(r => setTimeout(r, pollInterval));
      }
      if (!cancelled) setStatus("timeout");
    };

    poll();
    return () => { cancelled = true; };
  }, [sessionId]);

  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl">Verifying your payment…</CardTitle>
            <CardDescription>
              This usually takes a few seconds. Please don't close this window.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === "timeout") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Verification taking longer than expected</CardTitle>
            <CardDescription>
              If you completed checkout, please check your email for a confirmation. Your subscription will activate as soon as Stripe confirms the payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/" className="w-full">
              <Button className="w-full">Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" /></Button>
            </Link>
            <Link to="/support" className="w-full">
              <Button variant="outline" className="w-full">Contact Support</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Welcome to Causeio! Your subscription is now active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="font-semibold">Getting Started</span>
            </div>
            <p className="text-sm text-muted-foreground">
              You can now access all premium features of your Causeio plan.
              Start by creating your first AI chatbot or QR code!
            </p>
          </div>

          <div className="space-y-3">
            <Link to="/" className="w-full">
              <Button className="w-full">
                Go to Dashboard
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/pricing" className="w-full">
              <Button variant="outline" className="w-full">
                View Plans
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            Questions? Contact our support team for help getting started.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
