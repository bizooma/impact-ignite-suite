import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const betaSignupSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }).max(255),
  name: z.string().trim().min(1, { message: "Name is required" }).max(100),
  organization: z.string().trim().min(1, { message: "Organization name is required" }).max(200),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).max(72),
});

interface BetaSignupFormProps {
  compact?: boolean;
}

export const BetaSignupForm = ({ compact = false }: BetaSignupFormProps) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = betaSignupSchema.parse({ email, name, organization, password });

      // 1. Create the auth account
      const redirectUrl = `${window.location.origin}/dashboard/pricing-beta`;
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: validated.name,
            organization_name: validated.organization,
            beta_signup: true,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message?.toLowerCase().includes("already")) {
          toast({
            title: "Account already exists",
            description: "Please sign in instead — we'll redirect you to your beta pricing page after login.",
            variant: "default",
          });
          navigate("/auth");
          return;
        }
        throw signUpError;
      }

      // 2. Record the beta signup (existing flow)
      let betaSignupId: string | null = null;
      const { data: signupData, error: signupErr } = await supabase
        .from("beta_signups")
        .insert([{
          email: validated.email,
          name: validated.name,
          organization: validated.organization,
        }])
        .select()
        .single();
      if (!signupErr && signupData) {
        betaSignupId = signupData.id;
      } else if (signupErr && signupErr.code !== "23505") {
        console.error("beta_signups insert failed:", signupErr);
      }

      // 3. Sync to CRM (non-blocking)
      if (signupData) {
        supabase.functions.invoke("sync-beta-to-crm", { body: { betaSignup: signupData } })
          .catch((err) => console.error("CRM sync failed (non-critical):", err));
      }

      // 4. Provision the beta organization. Requires an active session — only
      // works if email confirmation is disabled OR user is auto-signed-in.
      if (signUpData.session) {
        const { error: provisionErr } = await supabase.functions.invoke("provision-beta-org", {
          body: {
            betaSignupId,
            organizationName: validated.organization,
            displayName: validated.name,
          },
        });
        if (provisionErr) {
          console.error("provision-beta-org failed:", provisionErr);
          toast({
            title: "Account created — finishing setup",
            description: "We hit a snag setting up your org. Sign in and we'll finish it.",
            variant: "default",
          });
          navigate("/auth");
          return;
        }

        toast({
          title: "Welcome to the Beta! 🎉",
          description: "Your account is ready. Choose your plan with locked-in beta pricing.",
        });
        navigate("/dashboard/pricing-beta");
        return;
      }

      // Email-confirmation flow: account created but no session yet
      setSubmitted(true);
      toast({
        title: "Check your email 📧",
        description: "Confirm your email to access your dashboard and beta pricing.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.issues[0].message,
          variant: "destructive",
        });
      } else {
        console.error("Error signing up for beta:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className={`w-full ${compact ? '' : 'max-w-2xl mx-auto'} border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10`}>
        <CardContent className="pt-10 pb-10 text-center">
          <div className="mb-5 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-2">Check Your Email 📧</h3>
          <p className="text-muted-foreground">
            We sent a confirmation link. Once confirmed, you'll land on your beta-only pricing page with lifetime discounts locked in.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${compact ? '' : 'max-w-2xl mx-auto'} border-2 border-primary/20 bg-card shadow-lg`}>
      <CardHeader className={`text-center ${compact ? 'pb-2 pt-6' : 'pb-4'}`}>
        <CardTitle className={`${compact ? 'text-2xl' : 'text-3xl'} font-bold`}>Early Adopters - Become our VIP</CardTitle>
        <CardDescription className={`${compact ? 'text-sm' : 'text-lg'} mt-1`}>
          Create your account and lock in{" "}
          <span className="text-primary font-semibold">lifetime pricing</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className={`${compact ? 'space-y-3' : 'space-y-4'}`} autoComplete="off">
          <div className="space-y-1.5">
            <Label htmlFor="beta-name">Name *</Label>
            <Input
              id="beta-name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="beta-email">Email *</Label>
            <Input
              id="beta-email"
              type="email"
              placeholder="your.email@nonprofit.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              disabled={loading}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="beta-organization">Organization *</Label>
            <Input
              id="beta-organization"
              type="text"
              placeholder="Your nonprofit name"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              required
              maxLength={200}
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="beta-password">Password *</Label>
            <Input
              id="beta-password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={72}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>
          <div className="pt-1">
            <Button type="submit" className="w-full bg-[hsl(217_91%_35%)] hover:bg-[hsl(217_91%_28%)] text-white" size={compact ? "default" : "lg"} disabled={loading}>
              {loading ? "Creating your account..." : "Secure My Access & Discount"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Free account. No credit card required to start.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
