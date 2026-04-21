import { useState, useEffect } from 'react';
import causeioLogo from '@/assets/causeio-logo-full.png';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Shield, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const signUpSchema = z.object({
  displayName: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  organizationName: z.string().trim().min(2, 'Organization name must be at least 2 characters').max(100, 'Organization name must be less than 100 characters'),
  email: z.string().trim().email('Please enter a valid email address').max(255, 'Email must be less than 255 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password must be less than 128 characters'),
});

const signInSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').max(255, 'Email must be less than 255 characters'),
  password: z.string().min(1, 'Password is required'),
});

type SignUpFormData = z.infer<typeof signUpSchema>;
type SignInFormData = z.infer<typeof signInSchema>;

export default function Auth() {
  const { user, signUp, signIn, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);
  const [processingInvite, setProcessingInvite] = useState(false);

  useEffect(() => {
    const handleInvitation = async () => {
      if (!inviteToken || processingInvite) return;

      setProcessingInvite(true);

      try {
        // Try to accept the invitation
        const { data, error } = await supabase.functions.invoke('accept-invitation', {
          body: { token: inviteToken },
        });

        if (error) throw error;

        if (data.error) {
          toast.error(data.error);
          setSearchParams({});
          setProcessingInvite(false);
          return;
        }

        if (data.requiresAuth) {
          // User needs to sign up or sign in
          setInviteEmail(data.email);
          setIsSignUp(true);
          toast.info(`Please sign up or sign in with ${data.email} to accept the invitation`);
          setProcessingInvite(false);
        } else if (data.success) {
          // Invitation accepted successfully
          toast.success('Successfully joined the organization!');
          setSearchParams({});
          window.location.href = '/dashboard';
        }
      } catch (error: any) {
        console.error('Error processing invitation:', error);
        toast.error('Failed to process invitation');
        setSearchParams({});
        setProcessingInvite(false);
      }
    };

    handleInvitation();
  }, [inviteToken, user, processingInvite]);

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      displayName: '',
      email: inviteEmail || '',
      password: '',
    },
  });

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redirect to dashboard if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignUp = async (data: SignUpFormData) => {
    const { error } = await signUp(data.email, data.password, data.displayName);
    
    if (error) {
      if (error.message.includes('User already registered')) {
        toast.error('An account with this email already exists. Please sign in instead.');
        setIsSignUp(false);
      } else {
        toast.error(error.message || 'Failed to create account');
      }
    } else {
      toast.success('Welcome to Causeio! Please check your email to verify your account.');
      
      // If there's an invitation, try to accept it after signup
      if (inviteToken) {
        setTimeout(async () => {
          const { data: inviteData } = await supabase.functions.invoke('accept-invitation', {
            body: { token: inviteToken },
          });
          
          if (inviteData?.success) {
            setSearchParams({});
          }
        }, 2000);
      }
    }
  };

  const handleSignIn = async (data: SignInFormData) => {
    const { error } = await signIn(data.email, data.password);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please try again.');
      } else {
        toast.error(error.message || 'Failed to sign in');
      }
    } else {
      toast.success('Welcome back to Causeio!');
      
      // If there's an invitation, try to accept it after signin
      if (inviteToken) {
        const { data: inviteData } = await supabase.functions.invoke('accept-invitation', {
          body: { token: inviteToken },
        });
        
        if (inviteData?.success) {
          setSearchParams({});
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen w-full bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center p-4 overflow-auto">
      <div className="w-full max-w-md mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <img 
              src={causeioLogo} 
              alt="Causeio" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <div>
            <p className="text-muted-foreground mt-2 text-lg">
              Empowering nonprofits with compassionate technology
            </p>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="flex justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Mission-driven</span>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="border-2 border-border/50 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold">
              {inviteEmail 
                ? 'Accept your invitation'
                : isSignUp ? 'Create your account' : 'Welcome back'
              }
            </CardTitle>
            <CardDescription>
              {inviteEmail 
                ? `Sign up with ${inviteEmail} to join the organization`
                : isSignUp 
                  ? 'Join thousands of nonprofits making a difference' 
                  : 'Sign in to continue your mission'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {isSignUp ? (
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                <div className="space-y-2 text-center">
                  <label className="text-sm font-medium block">Full name</label>
                  <Input
                    placeholder="Enter your full name"
                    autoComplete="name"
                    disabled={loading}
                    {...signUpForm.register('displayName')}
                  />
                  {signUpForm.formState.errors.displayName && (
                    <p className="text-sm text-destructive">
                      {signUpForm.formState.errors.displayName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-center">
                  <label className="text-sm font-medium block">Email</label>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    autoComplete="email"
                    disabled={loading || !!inviteEmail}
                    {...signUpForm.register('email')}
                  />
                  {signUpForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {signUpForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-center">
                  <label className="text-sm font-medium block">Password</label>
                  <Input
                    type="password"
                    placeholder="Create a secure password"
                    autoComplete="new-password"
                    disabled={loading}
                    {...signUpForm.register('password')}
                  />
                  {signUpForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {signUpForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create account'}
                </Button>
              </form>
            ) : (
              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                <div className="space-y-2 text-center">
                  <label className="text-sm font-medium block">Email</label>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    autoComplete="email"
                    disabled={loading}
                    {...signInForm.register('email')}
                  />
                  {signInForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {signInForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-center">
                  <label className="text-sm font-medium block">Password</label>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    {...signInForm.register('password')}
                  />
                  {signInForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {signInForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            )}

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => setIsSignUp(!isSignUp)}
                disabled={loading}
                className="text-primary hover:text-primary-hover"
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Create one"
                }
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer message */}
        <p className="text-center text-sm text-muted-foreground">
          By continuing, you agree to our compassionate approach to data privacy and security.
        </p>
      </div>
    </div>
  );
}