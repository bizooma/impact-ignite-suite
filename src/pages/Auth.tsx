import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Heart, Shield, Users } from 'lucide-react';

const signUpSchema = z.object({
  displayName: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
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

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      displayName: '',
      email: '',
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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Heart className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Causeio</h1>
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
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Join thousands of nonprofits making a difference' 
                : 'Sign in to continue your mission'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {isSignUp ? (
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full name</label>
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    autoComplete="email"
                    disabled={loading}
                    {...signUpForm.register('email')}
                  />
                  {signUpForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {signUpForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
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