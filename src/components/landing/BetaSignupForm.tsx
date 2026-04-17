import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { Sparkles, Check } from "lucide-react";

const betaSignupSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }).max(255),
  name: z.string().trim().min(1, { message: "Name is required" }).max(100),
  organization: z.string().trim().max(200).optional(),
});

interface BetaSignupFormProps {
  compact?: boolean;
}

export const BetaSignupForm = ({ compact = false }: BetaSignupFormProps) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = betaSignupSchema.parse({
        email,
        name,
        organization: organization || undefined,
      });

      const { data: signupData, error } = await supabase.from("beta_signups").insert([
        {
          email: validatedData.email,
          name: validatedData.name,
          organization: validatedData.organization,
        },
      ]).select().single();

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already Registered",
            description: "This email is already on our beta list!",
            variant: "default",
          });
        } else {
          throw error;
        }
      } else {
        try {
          await supabase.functions.invoke('sync-beta-to-crm', {
            body: { betaSignup: signupData },
          });
        } catch (crmError) {
          console.error('CRM sync failed (non-critical):', crmError);
        }

        setSubmitted(true);
        toast({
          title: "Welcome to the Beta! 🎉",
          description: "Check your email for next steps and your exclusive discount code.",
        });
      }
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
          description: "Something went wrong. Please try again.",
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
          <h3 className="text-2xl font-bold mb-2">You're On The List! 🎉</h3>
          <p className="text-muted-foreground">
            Welcome to the Causeio beta. Watch your inbox for early access details and your discount code.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${compact ? '' : 'max-w-2xl mx-auto'} border-2 border-primary/20 bg-card shadow-lg`}>
      <CardHeader className={`text-center ${compact ? 'pb-2 pt-6' : 'pb-4'}`}>
        <CardTitle className={`${compact ? 'text-2xl' : 'text-3xl'} font-bold`}>Join Our Beta Testing Group</CardTitle>
        <CardDescription className={`${compact ? 'text-sm' : 'text-lg'} mt-1`}>
          Get early access and lock in your{" "}
          <span className="text-primary font-semibold">exclusive early bird discount</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className={`${compact ? 'space-y-3' : 'space-y-4'}`}>
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
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="beta-organization">Organization (Optional)</Label>
            <Input
              id="beta-organization"
              type="text"
              placeholder="Your nonprofit name"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              maxLength={200}
              disabled={loading}
            />
          </div>
          <div className="pt-1">
            <Button type="submit" className="w-full" size={compact ? "default" : "lg"} disabled={loading}>
              {loading ? "Joining..." : "Secure My Beta Access & Discount"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Free beta access. No credit card required.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
