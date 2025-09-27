import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

const PaymentCancel = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          <CardDescription>
            Your payment was cancelled. No charges were made to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold">What happened?</span>
            </div>
            <p className="text-sm text-muted-foreground">
              You cancelled the payment process or closed the payment window. 
              You can try again anytime - no worries!
            </p>
          </div>
          
          <div className="space-y-3">
            <Link to="/pricing" className="w-full">
              <Button className="w-full">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Pricing
              </Button>
            </Link>
            <Link to="/" className="w-full">
              <Button variant="outline" className="w-full">
                Go to Home
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            Need help? Contact our support team if you're experiencing issues.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancel;