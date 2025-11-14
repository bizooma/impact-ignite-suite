-- Create beta_signups table
CREATE TABLE IF NOT EXISTS public.beta_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  organization TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  subscribed BOOLEAN NOT NULL DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.beta_signups ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (public signup)
CREATE POLICY "Anyone can sign up for beta" 
ON public.beta_signups 
FOR INSERT 
WITH CHECK (true);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_beta_signups_email ON public.beta_signups(email);
CREATE INDEX IF NOT EXISTS idx_beta_signups_created_at ON public.beta_signups(created_at DESC);