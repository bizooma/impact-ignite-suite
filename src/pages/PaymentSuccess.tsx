import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Zap } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      toast.success("Payment successful! Welcome to Causeio!");
    }
  }, [sessionId]);

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