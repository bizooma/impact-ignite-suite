// Enhanced database types for Causeio modules
import type { Json } from '@/integrations/supabase/types';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatbotBrandSettings {
  primary_color?: string;
  accent_color?: string;
  avatar_url?: string;
  welcome_message?: string;
  tone?: string;
  suggested_prompts?: string[];
}

export interface ChatbotWidgetConfig {
  position?: 'bottom-right' | 'bottom-left';
  size?: 'compact' | 'expanded';
  theme?: 'light' | 'dark';
  show_branding?: boolean;
}

export interface Chatbot {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  brand_settings: ChatbotBrandSettings;
  web_widget_config: ChatbotWidgetConfig;
  status: 'draft' | 'active' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface KnowledgeSourceMetadata {
  file_size?: number;
  processed_chunks?: number;
  error_message?: string;
}

export interface KnowledgeSource {
  id: string;
  chatbot_id: string;
  type: 'pdf' | 'docx' | 'url' | 'text';
  name: string;
  content?: string;
  file_url?: string;
  file_path?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  metadata: KnowledgeSourceMetadata;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: {
    timestamp?: string;
    typing_time?: number;
    sources?: string[];
  };
  created_at: string;
}

export interface ChatSession {
  id: string;
  chatbot_id: string;
  visitor_id?: string;
  visitor_metadata: {
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
  };
  status: string;
  created_at: string;
  updated_at: string;
}


export interface ChatLead {
  id: string;
  session_id: string;
  email?: string;
  name?: string;
  phone?: string;
  interest_type?: string;
  metadata: {
    source?: string;
    campaign?: string;
    notes?: string;
  };
  created_at: string;
}

export interface QRCode {
  id: string;
  organization_id: string;
  name: string;
  type: 'static' | 'dynamic';
  destination_url: string;
  short_url?: string;
  utm_params: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  brand_config: {
    logo_url?: string;
    color?: string;
    frame_style?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  goals: {
    target_reach?: number;
    target_engagement?: number;
    target_conversions?: number;
  };
  status: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SocialPost {
  id: string;
  organization_id: string;
  campaign_id?: string;
  platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter';
  content: string;
  media_urls: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_for?: string;
  published_at?: string;
  external_post_id?: string;
  metadata: {
    hashtags?: string[];
    mentions?: string[];
    location?: string;
    boost_budget?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface SEOAudit {
  id: string;
  organization_id: string;
  domain: string;
  pages_crawled: number;
  overall_score?: number;
  technical_score?: number;
  content_score?: number;
  schema_score?: number;
  aeo_score?: number;
  voice_seo_score?: number;
  status: string;
  results: {
    crawl_summary?: any;
    issues_summary?: any;
    recommendations?: any;
  };
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  organization_id: string;
  assignee_id?: string;
  source_module: string;
  source_id?: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: number;
  due_date?: string;
  completed_at?: string;
  metadata: {
    estimated_time?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    tags?: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface ContentTemplate {
  id: string;
  organization_id: string;
  name: string;
  category?: string;
  template_data: any;
  is_public?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Integration {
  id: string;
  organization_id: string;
  name: string;
  provider: string;
  config?: any;
  encrypted_tokens?: any;
  status?: string;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Volunteer {
  id: string;
  chatbot_id: string;
  name: string;
  email: string;
  phone?: string;
  days: string[];
  public_key?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface ChatbotFAQ {
  id: string;
  chatbot_id: string;
  question: string;
  answer: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface ChatbotEvent {
  id: string;
  chatbot_id: string;
  session_id?: string;
  event_type: string;
  event_data: {
    button_label?: string;
    url?: string;
    position?: string;
    [key: string]: any;
  };
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface EnhancedChatbotWidgetConfig extends ChatbotWidgetConfig {
  // Video Settings
  video_source?: string;
  video_type?: 'youtube' | 'vimeo' | 'direct';
  launcher_text?: string;
  video_cta_text?: string;
  
  // Position
  position?: 'bottom-right' | 'bottom-left' | 'middle-right' | 'middle-left';
  
  // Branding
  logo_url?: string;
  bot_name?: string;
  
  // Contact Info
  email_contact?: string;
  phone_contact?: string;
  
  // Donations
  show_donations?: boolean;
  donation_button_1?: { label: string; url: string };
  donation_button_2?: { label: string; url: string };
}