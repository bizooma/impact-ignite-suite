-- Create CRM contacts table
CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL DEFAULT 'individual' CHECK (contact_type IN ('individual', 'organization', 'foundation')),
  first_name TEXT,
  last_name TEXT,
  organization_name TEXT,
  email TEXT,
  phone TEXT,
  address JSONB DEFAULT '{}'::jsonb,
  social_profiles JSONB DEFAULT '{}'::jsonb,
  source TEXT NOT NULL CHECK (source IN ('chatbot_volunteer', 'chatbot_lead', 'qr_scan', 'social_media', 'mobile_app', 'manual', 'import')),
  source_id UUID,
  lifecycle_stage TEXT NOT NULL DEFAULT 'lead' CHECK (lifecycle_stage IN ('lead', 'volunteer', 'donor', 'member', 'advocate', 'inactive')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  custom_fields JSONB DEFAULT '{}'::jsonb,
  avatar_url TEXT,
  opted_in_email BOOLEAN DEFAULT false,
  opted_in_sms BOOLEAN DEFAULT false,
  total_donations DECIMAL DEFAULT 0,
  total_volunteer_hours DECIMAL DEFAULT 0,
  last_interaction_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

-- Create index on email for faster lookups
CREATE INDEX idx_crm_contacts_email ON public.crm_contacts(organization_id, email);
CREATE INDEX idx_crm_contacts_lifecycle ON public.crm_contacts(organization_id, lifecycle_stage);
CREATE INDEX idx_crm_contacts_source ON public.crm_contacts(organization_id, source);

-- Create CRM lists table
CREATE TABLE IF NOT EXISTS public.crm_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  list_type TEXT NOT NULL DEFAULT 'static' CHECK (list_type IN ('static', 'dynamic')),
  filter_rules JSONB,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'users',
  contact_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Create CRM list memberships table
CREATE TABLE IF NOT EXISTS public.crm_list_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.crm_lists(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  added_by UUID REFERENCES auth.users(id),
  UNIQUE(list_id, contact_id)
);

-- Create CRM interactions table
CREATE TABLE IF NOT EXISTS public.crm_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('email_sent', 'email_opened', 'call', 'meeting', 'donation', 'volunteer_shift', 'event_attendance', 'form_submission', 'qr_scan', 'social_engagement', 'chat', 'note')),
  subject TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  source_module TEXT,
  source_id UUID,
  interaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_interactions_contact ON public.crm_interactions(contact_id, interaction_date DESC);
CREATE INDEX idx_crm_interactions_org ON public.crm_interactions(organization_id, interaction_date DESC);

-- Create CRM donations table
CREATE TABLE IF NOT EXISTS public.crm_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  donation_date DATE NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('check', 'cash', 'credit_card', 'paypal', 'stripe', 'other')),
  transaction_id TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_frequency TEXT CHECK (recurrence_frequency IN ('monthly', 'quarterly', 'annual')),
  acknowledgment_sent BOOLEAN DEFAULT false,
  acknowledgment_sent_at TIMESTAMP WITH TIME ZONE,
  tax_deductible BOOLEAN DEFAULT true,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_donations_contact ON public.crm_donations(contact_id, donation_date DESC);
CREATE INDEX idx_crm_donations_org ON public.crm_donations(organization_id, donation_date DESC);

-- Create CRM volunteer hours table
CREATE TABLE IF NOT EXISTS public.crm_volunteer_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  activity TEXT NOT NULL,
  hours DECIMAL NOT NULL,
  volunteer_date DATE NOT NULL,
  location TEXT,
  supervisor TEXT,
  notes TEXT,
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_volunteer_hours_contact ON public.crm_volunteer_hours(contact_id, volunteer_date DESC);
CREATE INDEX idx_crm_volunteer_hours_org ON public.crm_volunteer_hours(organization_id, volunteer_date DESC);

-- Create CRM relationships table
CREATE TABLE IF NOT EXISTS public.crm_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  related_contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('spouse', 'child', 'parent', 'sibling', 'colleague', 'employer', 'employee', 'board_member', 'volunteer_coordinator', 'other')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (contact_id != related_contact_id)
);

-- Create CRM notes table
CREATE TABLE IF NOT EXISTS public.crm_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_notes_contact ON public.crm_notes(contact_id, created_at DESC);

-- Create CRM tags table
CREATE TABLE IF NOT EXISTS public.crm_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Enable RLS on all CRM tables
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_list_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_volunteer_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_contacts
CREATE POLICY "Org members can view contacts"
ON public.crm_contacts FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org admins can manage contacts"
ON public.crm_contacts FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- RLS Policies for crm_lists
CREATE POLICY "Org members can view lists"
ON public.crm_lists FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org admins can manage lists"
ON public.crm_lists FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- RLS Policies for crm_list_memberships
CREATE POLICY "Org members can view list memberships"
ON public.crm_list_memberships FOR SELECT
USING (
  list_id IN (
    SELECT id FROM public.crm_lists 
    WHERE organization_id IN (
      SELECT organization_id FROM public.memberships 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Org admins can manage list memberships"
ON public.crm_list_memberships FOR ALL
USING (
  list_id IN (
    SELECT id FROM public.crm_lists 
    WHERE organization_id IN (
      SELECT organization_id FROM public.memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  )
);

-- RLS Policies for crm_interactions
CREATE POLICY "Org members can view interactions"
ON public.crm_interactions FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org admins can manage interactions"
ON public.crm_interactions FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- RLS Policies for crm_donations
CREATE POLICY "Org members can view donations"
ON public.crm_donations FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org admins can manage donations"
ON public.crm_donations FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- RLS Policies for crm_volunteer_hours
CREATE POLICY "Org members can view volunteer hours"
ON public.crm_volunteer_hours FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org admins can manage volunteer hours"
ON public.crm_volunteer_hours FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- RLS Policies for crm_relationships
CREATE POLICY "Org members can view relationships"
ON public.crm_relationships FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org admins can manage relationships"
ON public.crm_relationships FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- RLS Policies for crm_notes
CREATE POLICY "Org members can view notes"
ON public.crm_notes FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org members can create notes"
ON public.crm_notes FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.memberships 
    WHERE user_id = auth.uid()
  )
  AND author_id = auth.uid()
);

CREATE POLICY "Note authors can update their notes"
ON public.crm_notes FOR UPDATE
USING (author_id = auth.uid());

CREATE POLICY "Org admins can delete notes"
ON public.crm_notes FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- RLS Policies for crm_tags
CREATE POLICY "Org members can view tags"
ON public.crm_tags FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org admins can manage tags"
ON public.crm_tags FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_crm_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_crm_contacts_updated_at
BEFORE UPDATE ON public.crm_contacts
FOR EACH ROW
EXECUTE FUNCTION update_crm_updated_at_column();

CREATE TRIGGER update_crm_lists_updated_at
BEFORE UPDATE ON public.crm_lists
FOR EACH ROW
EXECUTE FUNCTION update_crm_updated_at_column();

CREATE TRIGGER update_crm_donations_updated_at
BEFORE UPDATE ON public.crm_donations
FOR EACH ROW
EXECUTE FUNCTION update_crm_updated_at_column();

CREATE TRIGGER update_crm_volunteer_hours_updated_at
BEFORE UPDATE ON public.crm_volunteer_hours
FOR EACH ROW
EXECUTE FUNCTION update_crm_updated_at_column();

CREATE TRIGGER update_crm_notes_updated_at
BEFORE UPDATE ON public.crm_notes
FOR EACH ROW
EXECUTE FUNCTION update_crm_updated_at_column();