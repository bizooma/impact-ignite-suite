-- Enable pgvector extension for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum types
CREATE TYPE public.chatbot_status AS ENUM ('draft', 'active', 'paused');
CREATE TYPE public.knowledge_source_type AS ENUM ('pdf', 'docx', 'url', 'text');
CREATE TYPE public.knowledge_source_status AS ENUM ('pending', 'processing', 'completed', 'error');
CREATE TYPE public.qr_code_type AS ENUM ('static', 'dynamic');
CREATE TYPE public.social_platform AS ENUM ('facebook', 'instagram', 'linkedin', 'twitter');
CREATE TYPE public.post_status AS ENUM ('draft', 'scheduled', 'published', 'failed');
CREATE TYPE public.audit_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.integration_provider AS ENUM ('facebook', 'instagram', 'linkedin', 'twitter', 'google_business', 'openai', 'postmark', 'twilio');

-- ================================
-- CHATBOT MODULE TABLES
-- ================================

-- Chatbots table
CREATE TABLE public.chatbots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  brand_settings JSONB DEFAULT '{}',
  web_widget_config JSONB DEFAULT '{}',
  status chatbot_status DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Knowledge sources table
CREATE TABLE public.knowledge_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  type knowledge_source_type NOT NULL,
  name TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  file_path TEXT,
  status knowledge_source_status DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Embeddings table for vector search
CREATE TABLE public.knowledge_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_source_id UUID NOT NULL REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,
  content_chunk TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 embedding size
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat sessions table
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  visitor_id TEXT,
  visitor_metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat leads table
CREATE TABLE public.chat_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  phone TEXT,
  interest_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ================================
-- QR CODE MODULE TABLES
-- ================================

-- QR codes table
CREATE TABLE public.qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type qr_code_type DEFAULT 'dynamic',
  destination_url TEXT NOT NULL,
  short_url TEXT,
  utm_params JSONB DEFAULT '{}',
  brand_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- QR scan analytics table
CREATE TABLE public.qr_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code_id UUID NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  location_data JSONB DEFAULT '{}',
  device_info JSONB DEFAULT '{}'
);

-- ================================
-- SOCIAL MEDIA MODULE TABLES
-- ================================

-- Campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  goals JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Social posts table
CREATE TABLE public.social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  platform social_platform NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[],
  status post_status DEFAULT 'draft',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  external_post_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Content templates table
CREATE TABLE public.content_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  template_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ================================
-- SEO/AUDIT MODULE TABLES
-- ================================

-- SEO audits table
CREATE TABLE public.seo_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  pages_crawled INTEGER DEFAULT 0,
  overall_score INTEGER,
  technical_score INTEGER,
  content_score INTEGER,
  schema_score INTEGER,
  aeo_score INTEGER,
  voice_seo_score INTEGER,
  status TEXT DEFAULT 'pending',
  results JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit issues table
CREATE TABLE public.audit_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID NOT NULL REFERENCES public.seo_audits(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  category TEXT NOT NULL,
  severity audit_severity NOT NULL,
  issue TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  code_snippet TEXT,
  is_fixed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ================================
-- GOOGLE BUSINESS PROFILE MODULE TABLES
-- ================================

-- GBP profiles table
CREATE TABLE public.gbp_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  categories TEXT[],
  description TEXT,
  profile_data JSONB DEFAULT '{}',
  completeness_score INTEGER DEFAULT 0,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- GBP tasks table
CREATE TABLE public.gbp_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  gbp_profile_id UUID REFERENCES public.gbp_profiles(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status task_status DEFAULT 'todo',
  priority INTEGER DEFAULT 1,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ================================
-- SHARED TABLES
-- ================================

-- Unified tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  source_module TEXT NOT NULL,
  source_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'todo',
  priority INTEGER DEFAULT 1,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Integrations table
CREATE TABLE public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider integration_provider NOT NULL,
  name TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  encrypted_tokens JSONB DEFAULT '{}',
  status TEXT DEFAULT 'inactive',
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, provider)
);

-- Webhooks table
CREATE TABLE public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ================================
-- CREATE INDEXES
-- ================================

-- Chatbot indexes
CREATE INDEX idx_chatbots_org_id ON public.chatbots(organization_id);
CREATE INDEX idx_knowledge_sources_chatbot_id ON public.knowledge_sources(chatbot_id);
CREATE INDEX idx_chat_sessions_chatbot_id ON public.chat_sessions(chatbot_id);
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);

-- Vector similarity search index
CREATE INDEX ON public.knowledge_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- QR code indexes
CREATE INDEX idx_qr_codes_org_id ON public.qr_codes(organization_id);
CREATE INDEX idx_qr_scans_qr_code_id ON public.qr_scans(qr_code_id);
CREATE INDEX idx_qr_scans_scanned_at ON public.qr_scans(scanned_at);

-- Social media indexes
CREATE INDEX idx_campaigns_org_id ON public.campaigns(organization_id);
CREATE INDEX idx_social_posts_org_id ON public.social_posts(organization_id);
CREATE INDEX idx_social_posts_scheduled_for ON public.social_posts(scheduled_for);
CREATE INDEX idx_social_posts_status ON public.social_posts(status);

-- SEO audit indexes
CREATE INDEX idx_seo_audits_org_id ON public.seo_audits(organization_id);
CREATE INDEX idx_audit_issues_audit_id ON public.audit_issues(audit_id);

-- GBP indexes
CREATE INDEX idx_gbp_profiles_org_id ON public.gbp_profiles(organization_id);
CREATE INDEX idx_gbp_tasks_org_id ON public.gbp_tasks(organization_id);

-- Shared indexes
CREATE INDEX idx_tasks_org_id ON public.tasks(organization_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_integrations_org_id ON public.integrations(organization_id);

-- ================================
-- ENABLE RLS
-- ================================

ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gbp_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gbp_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- ================================
-- CREATE RLS POLICIES
-- ================================

-- Chatbot module policies
CREATE POLICY "Users can view chatbots in their organizations" 
ON public.chatbots FOR SELECT 
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Organization admins can manage chatbots" 
ON public.chatbots FOR ALL 
USING (has_org_role(auth.uid(), organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), organization_id, 'owner'::app_role));

CREATE POLICY "Users can view knowledge sources in their org chatbots" 
ON public.knowledge_sources FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.chatbots 
  WHERE chatbots.id = knowledge_sources.chatbot_id 
  AND is_org_member(auth.uid(), chatbots.organization_id)
));

CREATE POLICY "Organization admins can manage knowledge sources" 
ON public.knowledge_sources FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.chatbots 
  WHERE chatbots.id = knowledge_sources.chatbot_id 
  AND (has_org_role(auth.uid(), chatbots.organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), chatbots.organization_id, 'owner'::app_role))
));

CREATE POLICY "Users can view embeddings for their org knowledge sources" 
ON public.knowledge_embeddings FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.knowledge_sources ks
  JOIN public.chatbots c ON c.id = ks.chatbot_id
  WHERE ks.id = knowledge_embeddings.knowledge_source_id 
  AND is_org_member(auth.uid(), c.organization_id)
));

CREATE POLICY "Users can view chat sessions for their org chatbots" 
ON public.chat_sessions FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.chatbots 
  WHERE chatbots.id = chat_sessions.chatbot_id 
  AND is_org_member(auth.uid(), chatbots.organization_id)
));

CREATE POLICY "Chat sessions can be created by anyone (for public chatbots)" 
ON public.chat_sessions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view chat messages in their org sessions" 
ON public.chat_messages FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.chat_sessions cs
  JOIN public.chatbots c ON c.id = cs.chatbot_id
  WHERE cs.id = chat_messages.session_id 
  AND is_org_member(auth.uid(), c.organization_id)
));

CREATE POLICY "Chat messages can be created by anyone (for public chatbots)" 
ON public.chat_messages FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view leads from their org chatbots" 
ON public.chat_leads FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.chat_sessions cs
  JOIN public.chatbots c ON c.id = cs.chatbot_id
  WHERE cs.id = chat_leads.session_id 
  AND is_org_member(auth.uid(), c.organization_id)
));

CREATE POLICY "Chat leads can be created by anyone (for public chatbots)" 
ON public.chat_leads FOR INSERT 
WITH CHECK (true);

-- QR Code module policies
CREATE POLICY "Users can view QR codes in their organizations" 
ON public.qr_codes FOR SELECT 
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Organization members can manage QR codes" 
ON public.qr_codes FOR ALL 
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can view QR scans for their org QR codes" 
ON public.qr_scans FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.qr_codes 
  WHERE qr_codes.id = qr_scans.qr_code_id 
  AND is_org_member(auth.uid(), qr_codes.organization_id)
));

CREATE POLICY "QR scans can be created by anyone (for public QR codes)" 
ON public.qr_scans FOR INSERT 
WITH CHECK (true);

-- Social Media module policies
CREATE POLICY "Users can view campaigns in their organizations" 
ON public.campaigns FOR SELECT 
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Organization members can manage campaigns" 
ON public.campaigns FOR ALL 
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can view social posts in their organizations" 
ON public.social_posts FOR SELECT 
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Organization members can manage social posts" 
ON public.social_posts FOR ALL 
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can view content templates in their organizations" 
ON public.content_templates FOR SELECT 
USING (is_org_member(auth.uid(), organization_id) OR is_public = true);

CREATE POLICY "Organization members can manage their content templates" 
ON public.content_templates FOR ALL 
USING (is_org_member(auth.uid(), organization_id));

-- SEO Audit module policies
CREATE POLICY "Users can view SEO audits in their organizations" 
ON public.seo_audits FOR SELECT 
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Organization members can manage SEO audits" 
ON public.seo_audits FOR ALL 
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can view audit issues for their org audits" 
ON public.audit_issues FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.seo_audits 
  WHERE seo_audits.id = audit_issues.audit_id 
  AND is_org_member(auth.uid(), seo_audits.organization_id)
));

CREATE POLICY "Organization members can manage audit issues" 
ON public.audit_issues FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.seo_audits 
  WHERE seo_audits.id = audit_issues.audit_id 
  AND is_org_member(auth.uid(), seo_audits.organization_id)
));

-- GBP module policies
CREATE POLICY "Users can view GBP profiles in their organizations" 
ON public.gbp_profiles FOR SELECT 
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Organization members can manage GBP profiles" 
ON public.gbp_profiles FOR ALL 
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can view GBP tasks in their organizations" 
ON public.gbp_tasks FOR SELECT 
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Organization members can manage GBP tasks" 
ON public.gbp_tasks FOR ALL 
USING (is_org_member(auth.uid(), organization_id));

-- Shared table policies
CREATE POLICY "Users can view tasks in their organizations" 
ON public.tasks FOR SELECT 
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Organization members can manage tasks" 
ON public.tasks FOR ALL 
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can view integrations in their organizations" 
ON public.integrations FOR SELECT 
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Organization admins can manage integrations" 
ON public.integrations FOR ALL 
USING (has_org_role(auth.uid(), organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), organization_id, 'owner'::app_role));

CREATE POLICY "Users can view webhooks in their organizations" 
ON public.webhooks FOR SELECT 
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Organization admins can manage webhooks" 
ON public.webhooks FOR ALL 
USING (has_org_role(auth.uid(), organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), organization_id, 'owner'::app_role));

-- ================================
-- CREATE UPDATE TRIGGERS
-- ================================

CREATE TRIGGER update_chatbots_updated_at
BEFORE UPDATE ON public.chatbots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_sources_updated_at
BEFORE UPDATE ON public.knowledge_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
BEFORE UPDATE ON public.chat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_qr_codes_updated_at
BEFORE UPDATE ON public.qr_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_posts_updated_at
BEFORE UPDATE ON public.social_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_templates_updated_at
BEFORE UPDATE ON public.content_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seo_audits_updated_at
BEFORE UPDATE ON public.seo_audits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gbp_profiles_updated_at
BEFORE UPDATE ON public.gbp_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gbp_tasks_updated_at
BEFORE UPDATE ON public.gbp_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
BEFORE UPDATE ON public.integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at
BEFORE UPDATE ON public.webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ================================
-- CREATE STORAGE BUCKETS
-- ================================

-- Knowledge sources bucket (PDFs, documents)
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-sources', 'knowledge-sources', false);

-- Media assets bucket (images, videos for social posts)
INSERT INTO storage.buckets (id, name, public) VALUES ('media-assets', 'media-assets', true);

-- Reports bucket (generated PDF reports)
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false);

-- Chatbot avatars and branding assets
INSERT INTO storage.buckets (id, name, public) VALUES ('chatbot-assets', 'chatbot-assets', true);

-- ================================
-- CREATE STORAGE POLICIES
-- ================================

-- Knowledge sources storage policies
CREATE POLICY "Organization members can view their knowledge sources" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'knowledge-sources' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Organization members can upload knowledge sources" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'knowledge-sources' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Organization members can update their knowledge sources" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'knowledge-sources' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Organization members can delete their knowledge sources" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'knowledge-sources' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Media assets storage policies (public bucket)
CREATE POLICY "Media assets are publicly viewable" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'media-assets');

CREATE POLICY "Organization members can upload media assets" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'media-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Organization members can update their media assets" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'media-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Organization members can delete their media assets" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'media-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Reports storage policies
CREATE POLICY "Organization members can view their reports" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Organization members can upload reports" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Organization members can delete their reports" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Chatbot assets storage policies (public bucket)
CREATE POLICY "Chatbot assets are publicly viewable" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'chatbot-assets');

CREATE POLICY "Organization members can upload chatbot assets" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'chatbot-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Organization members can update their chatbot assets" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'chatbot-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Organization members can delete their chatbot assets" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'chatbot-assets' AND auth.uid()::text = (storage.foldername(name))[1]);