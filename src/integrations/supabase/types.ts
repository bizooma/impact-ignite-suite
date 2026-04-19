export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      ai_usage_events: {
        Row: {
          chatbot_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          model: string | null
          organization_id: string
          tokens_input: number
          tokens_output: number
          used_byo_key: boolean
        }
        Insert: {
          chatbot_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          model?: string | null
          organization_id: string
          tokens_input?: number
          tokens_output?: number
          used_byo_key?: boolean
        }
        Update: {
          chatbot_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          model?: string | null
          organization_id?: string
          tokens_input?: number
          tokens_output?: number
          used_byo_key?: boolean
        }
        Relationships: []
      }
      audit_issues: {
        Row: {
          audit_id: string
          category: string
          code_snippet: string | null
          created_at: string
          id: string
          is_fixed: boolean | null
          issue: string
          page_url: string
          recommendation: string
          severity: Database["public"]["Enums"]["audit_severity"]
        }
        Insert: {
          audit_id: string
          category: string
          code_snippet?: string | null
          created_at?: string
          id?: string
          is_fixed?: boolean | null
          issue: string
          page_url: string
          recommendation: string
          severity: Database["public"]["Enums"]["audit_severity"]
        }
        Update: {
          audit_id?: string
          category?: string
          code_snippet?: string | null
          created_at?: string
          id?: string
          is_fixed?: boolean | null
          issue?: string
          page_url?: string
          recommendation?: string
          severity?: Database["public"]["Enums"]["audit_severity"]
        }
        Relationships: [
          {
            foreignKeyName: "audit_issues_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "seo_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          organization: string | null
          subscribed: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          organization?: string | null
          subscribed?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          organization?: string | null
          subscribed?: boolean
        }
        Relationships: []
      }
      campaign_assets: {
        Row: {
          asset_id: string | null
          asset_type: Database["public"]["Enums"]["campaign_asset_type"]
          body: string | null
          campaign_id: string
          created_at: string
          id: string
          metadata: Json | null
          scheduled_for: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          asset_id?: string | null
          asset_type: Database["public"]["Enums"]["campaign_asset_type"]
          body?: string | null
          campaign_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          scheduled_for?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          asset_id?: string | null
          asset_type?: Database["public"]["Enums"]["campaign_asset_type"]
          body?: string | null
          campaign_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          scheduled_for?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_metrics_snapshots: {
        Row: {
          campaign_id: string
          chat_sessions: number | null
          created_at: string
          donations_amount: number | null
          donations_count: number | null
          emails_drafted: number | null
          id: string
          new_donors: number | null
          qr_scans: number | null
          snapshot_date: string
          social_engagement: number | null
          social_reach: number | null
        }
        Insert: {
          campaign_id: string
          chat_sessions?: number | null
          created_at?: string
          donations_amount?: number | null
          donations_count?: number | null
          emails_drafted?: number | null
          id?: string
          new_donors?: number | null
          qr_scans?: number | null
          snapshot_date: string
          social_engagement?: number | null
          social_reach?: number | null
        }
        Update: {
          campaign_id?: string
          chat_sessions?: number | null
          created_at?: string
          donations_amount?: number | null
          donations_count?: number | null
          emails_drafted?: number | null
          id?: string
          new_donors?: number | null
          qr_scans?: number | null
          snapshot_date?: string
          social_engagement?: number | null
          social_reach?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_metrics_snapshots_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_milestones: {
        Row: {
          campaign_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          order_index: number | null
          owner_id: string | null
          phase: Database["public"]["Enums"]["campaign_phase"]
          status: Database["public"]["Enums"]["campaign_milestone_status"]
          title: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          order_index?: number | null
          owner_id?: string | null
          phase: Database["public"]["Enums"]["campaign_phase"]
          status?: Database["public"]["Enums"]["campaign_milestone_status"]
          title: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          order_index?: number | null
          owner_id?: string | null
          phase?: Database["public"]["Enums"]["campaign_phase"]
          status?: Database["public"]["Enums"]["campaign_milestone_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_milestones_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          goals: Json | null
          id: string
          name: string
          organization_id: string
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          goals?: Json | null
          id?: string
          name: string
          organization_id: string
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          goals?: Json | null
          id?: string
          name?: string
          organization_id?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          interest_type: string | null
          metadata: Json | null
          name: string | null
          phone: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          interest_type?: string | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          interest_type?: string | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_leads_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          chatbot_id: string
          created_at: string
          id: string
          status: string | null
          updated_at: string
          visitor_id: string | null
          visitor_metadata: Json | null
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          id?: string
          status?: string | null
          updated_at?: string
          visitor_id?: string | null
          visitor_metadata?: Json | null
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          id?: string
          status?: string | null
          updated_at?: string
          visitor_id?: string | null
          visitor_metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_events: {
        Row: {
          chatbot_id: string
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_events_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_faqs: {
        Row: {
          answer: string
          chatbot_id: string
          created_at: string
          id: string
          order_index: number | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          chatbot_id: string
          created_at?: string
          id?: string
          order_index?: number | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          chatbot_id?: string
          created_at?: string
          id?: string
          order_index?: number | null
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_faqs_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbots: {
        Row: {
          brand_settings: Json | null
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          status: Database["public"]["Enums"]["chatbot_status"] | null
          updated_at: string
          web_widget_config: Json | null
        }
        Insert: {
          brand_settings?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          status?: Database["public"]["Enums"]["chatbot_status"] | null
          updated_at?: string
          web_widget_config?: Json | null
        }
        Update: {
          brand_settings?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["chatbot_status"] | null
          updated_at?: string
          web_widget_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_templates: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_public: boolean | null
          name: string
          organization_id: string
          template_data: Json
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          name: string
          organization_id: string
          template_data: Json
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          name?: string
          organization_id?: string
          template_data?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          address: Json | null
          avatar_url: string | null
          contact_type: string
          created_at: string
          custom_fields: Json | null
          email: string | null
          first_name: string | null
          id: string
          last_interaction_at: string | null
          last_name: string | null
          lifecycle_stage: string
          opted_in_email: boolean | null
          opted_in_sms: boolean | null
          organization_id: string
          organization_name: string | null
          phone: string | null
          rating: number | null
          social_profiles: Json | null
          source: string
          source_id: string | null
          tags: string[] | null
          total_donations: number | null
          total_volunteer_hours: number | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          avatar_url?: string | null
          contact_type?: string
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_interaction_at?: string | null
          last_name?: string | null
          lifecycle_stage?: string
          opted_in_email?: boolean | null
          opted_in_sms?: boolean | null
          organization_id: string
          organization_name?: string | null
          phone?: string | null
          rating?: number | null
          social_profiles?: Json | null
          source: string
          source_id?: string | null
          tags?: string[] | null
          total_donations?: number | null
          total_volunteer_hours?: number | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          avatar_url?: string | null
          contact_type?: string
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_interaction_at?: string | null
          last_name?: string | null
          lifecycle_stage?: string
          opted_in_email?: boolean | null
          opted_in_sms?: boolean | null
          organization_id?: string
          organization_name?: string | null
          phone?: string | null
          rating?: number | null
          social_profiles?: Json | null
          source?: string
          source_id?: string | null
          tags?: string[] | null
          total_donations?: number | null
          total_volunteer_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_donations: {
        Row: {
          acknowledgment_sent: boolean | null
          acknowledgment_sent_at: string | null
          amount: number
          campaign_id: string | null
          contact_id: string
          created_at: string
          currency: string | null
          donation_date: string
          id: string
          is_recurring: boolean | null
          marketing_campaign_id: string | null
          metadata: Json | null
          notes: string | null
          organization_id: string
          payment_method: string | null
          recurrence_frequency: string | null
          tax_deductible: boolean | null
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          acknowledgment_sent?: boolean | null
          acknowledgment_sent_at?: string | null
          amount: number
          campaign_id?: string | null
          contact_id: string
          created_at?: string
          currency?: string | null
          donation_date: string
          id?: string
          is_recurring?: boolean | null
          marketing_campaign_id?: string | null
          metadata?: Json | null
          notes?: string | null
          organization_id: string
          payment_method?: string | null
          recurrence_frequency?: string | null
          tax_deductible?: boolean | null
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          acknowledgment_sent?: boolean | null
          acknowledgment_sent_at?: string | null
          amount?: number
          campaign_id?: string | null
          contact_id?: string
          created_at?: string
          currency?: string | null
          donation_date?: string
          id?: string
          is_recurring?: boolean | null
          marketing_campaign_id?: string | null
          metadata?: Json | null
          notes?: string | null
          organization_id?: string
          payment_method?: string | null
          recurrence_frequency?: string | null
          tax_deductible?: boolean | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_donations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_donations_marketing_campaign_id_fkey"
            columns: ["marketing_campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_donations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_grants: {
        Row: {
          amount_awarded: number | null
          amount_requested: number | null
          contact_id: string | null
          created_at: string
          deadline: string | null
          decision_date: string | null
          foundation_name: string
          grant_name: string
          id: string
          notes: string | null
          organization_id: string
          owner_id: string | null
          stage: Database["public"]["Enums"]["grant_stage"]
          submitted_date: string | null
          updated_at: string
        }
        Insert: {
          amount_awarded?: number | null
          amount_requested?: number | null
          contact_id?: string | null
          created_at?: string
          deadline?: string | null
          decision_date?: string | null
          foundation_name: string
          grant_name: string
          id?: string
          notes?: string | null
          organization_id: string
          owner_id?: string | null
          stage?: Database["public"]["Enums"]["grant_stage"]
          submitted_date?: string | null
          updated_at?: string
        }
        Update: {
          amount_awarded?: number | null
          amount_requested?: number | null
          contact_id?: string | null
          created_at?: string
          deadline?: string | null
          decision_date?: string | null
          foundation_name?: string
          grant_name?: string
          id?: string
          notes?: string | null
          organization_id?: string
          owner_id?: string | null
          stage?: Database["public"]["Enums"]["grant_stage"]
          submitted_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_grants_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_grants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_interactions: {
        Row: {
          contact_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          interaction_date: string
          interaction_type: string
          marketing_campaign_id: string | null
          metadata: Json | null
          organization_id: string
          source_id: string | null
          source_module: string | null
          subject: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          interaction_date?: string
          interaction_type: string
          marketing_campaign_id?: string | null
          metadata?: Json | null
          organization_id: string
          source_id?: string | null
          source_module?: string | null
          subject?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          interaction_date?: string
          interaction_type?: string
          marketing_campaign_id?: string | null
          metadata?: Json | null
          organization_id?: string
          source_id?: string | null
          source_module?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_interactions_marketing_campaign_id_fkey"
            columns: ["marketing_campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_list_memberships: {
        Row: {
          added_at: string
          added_by: string | null
          contact_id: string
          id: string
          list_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          contact_id: string
          id?: string
          list_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          contact_id?: string
          id?: string
          list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_list_memberships_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_list_memberships_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "crm_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lists: {
        Row: {
          color: string | null
          contact_count: number | null
          created_at: string
          description: string | null
          filter_rules: Json | null
          icon: string | null
          id: string
          list_type: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          contact_count?: number | null
          created_at?: string
          description?: string | null
          filter_rules?: Json | null
          icon?: string | null
          id?: string
          list_type?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          contact_count?: number | null
          created_at?: string
          description?: string | null
          filter_rules?: Json | null
          icon?: string | null
          id?: string
          list_type?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_lists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_mailchimp_mappings: {
        Row: {
          created_at: string
          crm_list_id: string
          field_mappings: Json | null
          id: string
          last_sync_error: string | null
          last_sync_status: string | null
          last_synced_at: string | null
          mailchimp_audience_id: string
          organization_id: string
          sync_enabled: boolean | null
          sync_frequency: string | null
          sync_options: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          crm_list_id: string
          field_mappings?: Json | null
          id?: string
          last_sync_error?: string | null
          last_sync_status?: string | null
          last_synced_at?: string | null
          mailchimp_audience_id: string
          organization_id: string
          sync_enabled?: boolean | null
          sync_frequency?: string | null
          sync_options?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          crm_list_id?: string
          field_mappings?: Json | null
          id?: string
          last_sync_error?: string | null
          last_sync_status?: string | null
          last_synced_at?: string | null
          mailchimp_audience_id?: string
          organization_id?: string
          sync_enabled?: boolean | null
          sync_frequency?: string | null
          sync_options?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_mailchimp_mappings_crm_list_id_fkey"
            columns: ["crm_list_id"]
            isOneToOne: false
            referencedRelation: "crm_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_mailchimp_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_mailchimp_sync_logs: {
        Row: {
          contacts_added: number | null
          contacts_failed: number | null
          contacts_processed: number | null
          contacts_updated: number | null
          created_at: string
          error_details: Json | null
          id: string
          mapping_id: string
          status: string
          sync_completed_at: string | null
          sync_started_at: string
        }
        Insert: {
          contacts_added?: number | null
          contacts_failed?: number | null
          contacts_processed?: number | null
          contacts_updated?: number | null
          created_at?: string
          error_details?: Json | null
          id?: string
          mapping_id: string
          status: string
          sync_completed_at?: string | null
          sync_started_at?: string
        }
        Update: {
          contacts_added?: number | null
          contacts_failed?: number | null
          contacts_processed?: number | null
          contacts_updated?: number | null
          created_at?: string
          error_details?: Json | null
          id?: string
          mapping_id?: string
          status?: string
          sync_completed_at?: string | null
          sync_started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_mailchimp_sync_logs_mapping_id_fkey"
            columns: ["mapping_id"]
            isOneToOne: false
            referencedRelation: "crm_mailchimp_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_notes: {
        Row: {
          author_id: string
          contact_id: string
          content: string
          created_at: string
          id: string
          is_pinned: boolean | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          contact_id: string
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          contact_id?: string
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_relationships: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          related_contact_id: string
          relationship_type: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          related_contact_id: string
          relationship_type: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          related_contact_id?: string
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_relationships_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_relationships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_relationships_related_contact_id_fkey"
            columns: ["related_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          usage_count: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          usage_count?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_volunteer_hours: {
        Row: {
          activity: string
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          contact_id: string
          created_at: string
          hours: number
          id: string
          location: string | null
          notes: string | null
          organization_id: string
          supervisor: string | null
          updated_at: string
          volunteer_date: string
        }
        Insert: {
          activity: string
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          contact_id: string
          created_at?: string
          hours: number
          id?: string
          location?: string | null
          notes?: string | null
          organization_id: string
          supervisor?: string | null
          updated_at?: string
          volunteer_date: string
        }
        Update: {
          activity?: string
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          contact_id?: string
          created_at?: string
          hours?: number
          id?: string
          location?: string | null
          notes?: string | null
          organization_id?: string
          supervisor?: string | null
          updated_at?: string
          volunteer_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_volunteer_hours_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_volunteer_hours_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      flipbook_embeds: {
        Row: {
          created_at: string
          flipbook_id: string
          id: string
          organization_id: string
          position: number | null
        }
        Insert: {
          created_at?: string
          flipbook_id: string
          id?: string
          organization_id: string
          position?: number | null
        }
        Update: {
          created_at?: string
          flipbook_id?: string
          id?: string
          organization_id?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "flipbook_embeds_flipbook_id_fkey"
            columns: ["flipbook_id"]
            isOneToOne: false
            referencedRelation: "flipbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flipbook_embeds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      flipbooks: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          file_size: number | null
          id: string
          is_active: boolean | null
          organization_id: string
          page_count: number | null
          pdf_url: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          page_count?: number | null
          pdf_url: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          page_count?: number | null
          pdf_url?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flipbooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gbp_profiles: {
        Row: {
          auto_response_enabled: boolean | null
          business_name: string
          categories: string[] | null
          completeness_score: number | null
          created_at: string
          description: string | null
          id: string
          last_synced_at: string | null
          notification_preferences: Json | null
          organization_id: string
          profile_data: Json | null
          response_settings: Json | null
          updated_at: string
        }
        Insert: {
          auto_response_enabled?: boolean | null
          business_name: string
          categories?: string[] | null
          completeness_score?: number | null
          created_at?: string
          description?: string | null
          id?: string
          last_synced_at?: string | null
          notification_preferences?: Json | null
          organization_id: string
          profile_data?: Json | null
          response_settings?: Json | null
          updated_at?: string
        }
        Update: {
          auto_response_enabled?: boolean | null
          business_name?: string
          categories?: string[] | null
          completeness_score?: number | null
          created_at?: string
          description?: string | null
          id?: string
          last_synced_at?: string | null
          notification_preferences?: Json | null
          organization_id?: string
          profile_data?: Json | null
          response_settings?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gbp_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gbp_review_approvals: {
        Row: {
          action: Database["public"]["Enums"]["approval_action"]
          approved_by: string
          created_at: string
          id: string
          notes: string | null
          review_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["approval_action"]
          approved_by: string
          created_at?: string
          id?: string
          notes?: string | null
          review_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["approval_action"]
          approved_by?: string
          created_at?: string
          id?: string
          notes?: string | null
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gbp_review_approvals_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "gbp_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      gbp_reviews: {
        Row: {
          ai_generated_response: string | null
          created_at: string
          edited_response: string | null
          final_response: string | null
          gbp_profile_id: string
          google_reply_id: string | null
          google_review_id: string
          id: string
          metadata: Json | null
          organization_id: string
          posted_at: string | null
          rating: number
          reply_status:
            | Database["public"]["Enums"]["review_reply_status"]
            | null
          review_date: string
          review_text: string | null
          reviewer_name: string
          reviewer_photo_url: string | null
          updated_at: string
        }
        Insert: {
          ai_generated_response?: string | null
          created_at?: string
          edited_response?: string | null
          final_response?: string | null
          gbp_profile_id: string
          google_reply_id?: string | null
          google_review_id: string
          id?: string
          metadata?: Json | null
          organization_id: string
          posted_at?: string | null
          rating: number
          reply_status?:
            | Database["public"]["Enums"]["review_reply_status"]
            | null
          review_date: string
          review_text?: string | null
          reviewer_name: string
          reviewer_photo_url?: string | null
          updated_at?: string
        }
        Update: {
          ai_generated_response?: string | null
          created_at?: string
          edited_response?: string | null
          final_response?: string | null
          gbp_profile_id?: string
          google_reply_id?: string | null
          google_review_id?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          posted_at?: string | null
          rating?: number
          reply_status?:
            | Database["public"]["Enums"]["review_reply_status"]
            | null
          review_date?: string
          review_text?: string | null
          reviewer_name?: string
          reviewer_photo_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gbp_reviews_gbp_profile_id_fkey"
            columns: ["gbp_profile_id"]
            isOneToOne: false
            referencedRelation: "gbp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gbp_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gbp_tasks: {
        Row: {
          created_at: string
          description: string
          due_date: string | null
          gbp_profile_id: string | null
          id: string
          organization_id: string
          priority: number | null
          status: Database["public"]["Enums"]["task_status"] | null
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          due_date?: string | null
          gbp_profile_id?: string | null
          id?: string
          organization_id: string
          priority?: number | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          due_date?: string | null
          gbp_profile_id?: string | null
          id?: string
          organization_id?: string
          priority?: number | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gbp_tasks_gbp_profile_id_fkey"
            columns: ["gbp_profile_id"]
            isOneToOne: false
            referencedRelation: "gbp_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gbp_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json | null
          created_at: string
          encrypted_tokens: Json | null
          id: string
          last_synced_at: string | null
          name: string
          organization_id: string
          provider: Database["public"]["Enums"]["integration_provider"]
          status: string | null
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          encrypted_tokens?: Json | null
          id?: string
          last_synced_at?: string | null
          name: string
          organization_id: string
          provider: Database["public"]["Enums"]["integration_provider"]
          status?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          encrypted_tokens?: Json | null
          id?: string
          last_synced_at?: string | null
          name?: string
          organization_id?: string
          provider?: Database["public"]["Enums"]["integration_provider"]
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_embeddings: {
        Row: {
          content_chunk: string
          created_at: string
          embedding: string | null
          id: string
          knowledge_source_id: string
          metadata: Json | null
        }
        Insert: {
          content_chunk: string
          created_at?: string
          embedding?: string | null
          id?: string
          knowledge_source_id: string
          metadata?: Json | null
        }
        Update: {
          content_chunk?: string
          created_at?: string
          embedding?: string | null
          id?: string
          knowledge_source_id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_embeddings_knowledge_source_id_fkey"
            columns: ["knowledge_source_id"]
            isOneToOne: false
            referencedRelation: "knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sources: {
        Row: {
          chatbot_id: string
          content: string | null
          created_at: string
          file_path: string | null
          file_url: string | null
          id: string
          metadata: Json | null
          name: string
          status: Database["public"]["Enums"]["knowledge_source_status"] | null
          type: Database["public"]["Enums"]["knowledge_source_type"]
          updated_at: string
        }
        Insert: {
          chatbot_id: string
          content?: string | null
          created_at?: string
          file_path?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          name: string
          status?: Database["public"]["Enums"]["knowledge_source_status"] | null
          type: Database["public"]["Enums"]["knowledge_source_type"]
          updated_at?: string
        }
        Update: {
          chatbot_id?: string
          content?: string | null
          created_at?: string
          file_path?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          status?: Database["public"]["Enums"]["knowledge_source_status"] | null
          type?: Database["public"]["Enums"]["knowledge_source_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_sources_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          audience_segments: Json | null
          channels: Json | null
          created_at: string
          created_by: string | null
          end_date: string | null
          event_date: string | null
          goal_amount: number | null
          goal_currency: string | null
          goal_donors: number | null
          hero_image_url: string | null
          id: string
          name: string
          organization_id: string
          slug: string
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          story: string | null
          tagline: string | null
          template_key: string | null
          theme_color: string | null
          updated_at: string
        }
        Insert: {
          audience_segments?: Json | null
          channels?: Json | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          event_date?: string | null
          goal_amount?: number | null
          goal_currency?: string | null
          goal_donors?: number | null
          hero_image_url?: string | null
          id?: string
          name: string
          organization_id: string
          slug: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          story?: string | null
          tagline?: string | null
          template_key?: string | null
          theme_color?: string | null
          updated_at?: string
        }
        Update: {
          audience_segments?: Json | null
          channels?: Json | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          event_date?: string | null
          goal_amount?: number | null
          goal_currency?: string | null
          goal_donors?: number | null
          hero_image_url?: string | null
          id?: string
          name?: string
          organization_id?: string
          slug?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          story?: string | null
          tagline?: string | null
          template_key?: string | null
          theme_color?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_app_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          operation_type: string | null
          organization_id: string
          table_name: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          operation_type?: string | null
          organization_id: string
          table_name?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          operation_type?: string | null
          organization_id?: string
          table_name?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mobile_app_audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_app_databases: {
        Row: {
          created_at: string | null
          database_name: string
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          metadata: Json | null
          organization_code: string
          organization_id: string | null
          supabase_url: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          database_name: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          organization_code: string
          organization_id?: string | null
          supabase_url: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          database_name?: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          organization_code?: string
          organization_id?: string | null
          supabase_url?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mobile_app_databases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_ai_usage_overrides: {
        Row: {
          created_at: string
          monthly_message_cap: number
          organization_id: string
          override_reason: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          monthly_message_cap: number
          organization_id: string
          override_reason?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          monthly_message_cap?: number
          organization_id?: string
          override_reason?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      org_event_rsvps: {
        Row: {
          created_at: string
          email: string
          event_id: string
          guests: number
          id: string
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          event_id: string
          guests?: number
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          event_id?: string
          guests?: number
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "org_events"
            referencedColumns: ["id"]
          },
        ]
      }
      org_events: {
        Row: {
          capacity: number | null
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_published: boolean
          location: string | null
          organization_id: string
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          location?: string | null
          organization_id: string
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          location?: string | null
          organization_id?: string
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_success_stories: {
        Row: {
          author_name: string | null
          body: string | null
          category: string | null
          created_at: string
          gallery: Json
          hero_image_url: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          organization_id: string
          published_at: string | null
          slug: string
          summary: string | null
          tags: string[]
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          author_name?: string | null
          body?: string | null
          category?: string | null
          created_at?: string
          gallery?: Json
          hero_image_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          organization_id: string
          published_at?: string | null
          slug: string
          summary?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          author_name?: string | null
          body?: string | null
          category?: string | null
          created_at?: string
          gallery?: Json
          hero_image_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          organization_id?: string
          published_at?: string | null
          slug?: string
          summary?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_success_stories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          brand_color: string | null
          created_at: string
          description: string | null
          has_mobile_app: boolean | null
          id: string
          logo_url: string | null
          mobile_api_enabled: boolean
          mobile_api_key: string | null
          mobile_app_code: string | null
          name: string
          purchased_products: Json | null
          slug: string
          subscription_tier: string
          updated_at: string
          website: string | null
        }
        Insert: {
          brand_color?: string | null
          created_at?: string
          description?: string | null
          has_mobile_app?: boolean | null
          id?: string
          logo_url?: string | null
          mobile_api_enabled?: boolean
          mobile_api_key?: string | null
          mobile_app_code?: string | null
          name: string
          purchased_products?: Json | null
          slug: string
          subscription_tier?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          brand_color?: string | null
          created_at?: string
          description?: string | null
          has_mobile_app?: boolean | null
          id?: string
          logo_url?: string | null
          mobile_api_enabled?: boolean
          mobile_api_key?: string | null
          mobile_app_code?: string | null
          name?: string
          purchased_products?: Json | null
          slug?: string
          subscription_tier?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      platform_roles: {
        Row: {
          created_at: string
          granted_at: string
          granted_by: string | null
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          is_platform_admin: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_platform_admin?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_platform_admin?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      qr_codes: {
        Row: {
          brand_config: Json | null
          created_at: string
          destination_url: string
          id: string
          is_active: boolean | null
          marketing_campaign_id: string | null
          name: string
          organization_id: string
          short_url: string | null
          type: Database["public"]["Enums"]["qr_code_type"] | null
          updated_at: string
          utm_params: Json | null
        }
        Insert: {
          brand_config?: Json | null
          created_at?: string
          destination_url: string
          id?: string
          is_active?: boolean | null
          marketing_campaign_id?: string | null
          name: string
          organization_id: string
          short_url?: string | null
          type?: Database["public"]["Enums"]["qr_code_type"] | null
          updated_at?: string
          utm_params?: Json | null
        }
        Update: {
          brand_config?: Json | null
          created_at?: string
          destination_url?: string
          id?: string
          is_active?: boolean | null
          marketing_campaign_id?: string | null
          name?: string
          organization_id?: string
          short_url?: string | null
          type?: Database["public"]["Enums"]["qr_code_type"] | null
          updated_at?: string
          utm_params?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_marketing_campaign_id_fkey"
            columns: ["marketing_campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_scans: {
        Row: {
          device_info: Json | null
          id: string
          ip_address: unknown
          location_data: Json | null
          qr_code_id: string
          referrer: string | null
          scanned_at: string
          user_agent: string | null
        }
        Insert: {
          device_info?: Json | null
          id?: string
          ip_address?: unknown
          location_data?: Json | null
          qr_code_id: string
          referrer?: string | null
          scanned_at?: string
          user_agent?: string | null
        }
        Update: {
          device_info?: Json | null
          id?: string
          ip_address?: unknown
          location_data?: Json | null
          qr_code_id?: string
          referrer?: string | null
          scanned_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_scans_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_audits: {
        Row: {
          aeo_score: number | null
          content_score: number | null
          created_at: string
          domain: string
          id: string
          organization_id: string
          overall_score: number | null
          pages_crawled: number | null
          results: Json | null
          schema_score: number | null
          status: string | null
          technical_score: number | null
          updated_at: string
          voice_seo_score: number | null
        }
        Insert: {
          aeo_score?: number | null
          content_score?: number | null
          created_at?: string
          domain: string
          id?: string
          organization_id: string
          overall_score?: number | null
          pages_crawled?: number | null
          results?: Json | null
          schema_score?: number | null
          status?: string | null
          technical_score?: number | null
          updated_at?: string
          voice_seo_score?: number | null
        }
        Update: {
          aeo_score?: number | null
          content_score?: number | null
          created_at?: string
          domain?: string
          id?: string
          organization_id?: string
          overall_score?: number | null
          pages_crawled?: number | null
          results?: Json | null
          schema_score?: number | null
          status?: string | null
          technical_score?: number | null
          updated_at?: string
          voice_seo_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_audits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          campaign_id: string | null
          content: string
          created_at: string
          external_post_id: string | null
          id: string
          marketing_campaign_id: string | null
          media_urls: string[] | null
          metadata: Json | null
          organization_id: string
          platform: Database["public"]["Enums"]["social_platform"]
          published_at: string | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["post_status"] | null
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          content: string
          created_at?: string
          external_post_id?: string | null
          id?: string
          marketing_campaign_id?: string | null
          media_urls?: string[] | null
          metadata?: Json | null
          organization_id: string
          platform: Database["public"]["Enums"]["social_platform"]
          published_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          content?: string
          created_at?: string
          external_post_id?: string | null
          id?: string
          marketing_campaign_id?: string | null
          media_urls?: string[] | null
          metadata?: Json | null
          organization_id?: string
          platform?: Database["public"]["Enums"]["social_platform"]
          published_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_marketing_campaign_id_fkey"
            columns: ["marketing_campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      task_activity: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          id: string
          organization_id: string
          task_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          organization_id: string
          task_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          organization_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_activity_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_activity_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          organization_id: string
          task_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          organization_id: string
          task_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          organization_id?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          marketing_campaign_id: string | null
          metadata: Json | null
          organization_id: string
          parent_task_id: string | null
          priority: number | null
          sort_order: number | null
          source_id: string | null
          source_module: string
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          marketing_campaign_id?: string | null
          metadata?: Json | null
          organization_id: string
          parent_task_id?: string | null
          priority?: number | null
          sort_order?: number | null
          source_id?: string | null
          source_module: string
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          marketing_campaign_id?: string | null
          metadata?: Json | null
          organization_id?: string
          parent_task_id?: string | null
          priority?: number | null
          sort_order?: number | null
          source_id?: string | null
          source_module?: string
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_marketing_campaign_id_fkey"
            columns: ["marketing_campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteers: {
        Row: {
          chatbot_id: string
          created_at: string
          days: string[] | null
          email: string
          id: string
          ip_address: unknown
          name: string
          phone: string | null
          public_key: string | null
          user_agent: string | null
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          days?: string[] | null
          email: string
          id?: string
          ip_address?: unknown
          name: string
          phone?: string | null
          public_key?: string | null
          user_agent?: string | null
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          days?: string[] | null
          email?: string
          id?: string
          ip_address?: unknown
          name?: string
          phone?: string | null
          public_key?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteers_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          events: string[]
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          organization_id: string
          secret: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          events: string[]
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          organization_id: string
          secret?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          organization_id?: string
          secret?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      org_ai_usage_current_period: {
        Row: {
          embeddings_count: number | null
          messages_count: number | null
          messages_count_byo: number | null
          messages_count_platform: number | null
          organization_id: string | null
          period_start: string | null
          tokens_input_total: number | null
          tokens_output_total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_mobile_api_key: { Args: { _org_id: string }; Returns: string }
      get_org_tier: { Args: { _org_id: string }; Returns: string }
      grant_platform_admin: { Args: { _email: string }; Returns: boolean }
      has_org_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      match_knowledge_chunks: {
        Args: {
          match_chatbot_id: string
          match_count?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          content_chunk: string
          id: string
          knowledge_source_id: string
          similarity: number
          source_name: string
        }[]
      }
      recalculate_crm_list_contact_count: {
        Args: { list_id: string }
        Returns: undefined
      }
      tier_limit: {
        Args: { _resource: string; _tier: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "editor" | "viewer"
      approval_action: "approved" | "rejected" | "edited" | "posted"
      audit_severity: "low" | "medium" | "high" | "critical"
      campaign_asset_type:
        | "social_post"
        | "email_draft"
        | "sms_draft"
        | "task"
        | "qr_code"
        | "chatbot_faq"
        | "landing_section"
        | "gbp_post"
      campaign_milestone_status:
        | "todo"
        | "in_progress"
        | "completed"
        | "skipped"
      campaign_phase:
        | "awareness"
        | "engagement"
        | "push"
        | "day_of"
        | "stewardship"
      campaign_status: "draft" | "active" | "completed" | "archived"
      chatbot_status: "draft" | "active" | "paused"
      grant_stage:
        | "researching"
        | "loi"
        | "proposal_drafting"
        | "submitted"
        | "awarded"
        | "declined"
        | "reporting"
        | "closed"
      integration_provider:
        | "facebook"
        | "instagram"
        | "linkedin"
        | "twitter"
        | "google_business"
        | "openai"
        | "postmark"
        | "twilio"
        | "mailchimp"
        | "stripe"
      knowledge_source_status: "pending" | "processing" | "completed" | "error"
      knowledge_source_type: "pdf" | "docx" | "url" | "text"
      post_status: "draft" | "scheduled" | "published" | "failed"
      qr_code_type: "static" | "dynamic"
      review_reply_status:
        | "pending_ai"
        | "awaiting_approval"
        | "approved"
        | "posted"
        | "rejected"
      social_platform: "facebook" | "instagram" | "linkedin" | "twitter"
      task_status: "todo" | "in_progress" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "admin", "editor", "viewer"],
      approval_action: ["approved", "rejected", "edited", "posted"],
      audit_severity: ["low", "medium", "high", "critical"],
      campaign_asset_type: [
        "social_post",
        "email_draft",
        "sms_draft",
        "task",
        "qr_code",
        "chatbot_faq",
        "landing_section",
        "gbp_post",
      ],
      campaign_milestone_status: [
        "todo",
        "in_progress",
        "completed",
        "skipped",
      ],
      campaign_phase: [
        "awareness",
        "engagement",
        "push",
        "day_of",
        "stewardship",
      ],
      campaign_status: ["draft", "active", "completed", "archived"],
      chatbot_status: ["draft", "active", "paused"],
      grant_stage: [
        "researching",
        "loi",
        "proposal_drafting",
        "submitted",
        "awarded",
        "declined",
        "reporting",
        "closed",
      ],
      integration_provider: [
        "facebook",
        "instagram",
        "linkedin",
        "twitter",
        "google_business",
        "openai",
        "postmark",
        "twilio",
        "mailchimp",
        "stripe",
      ],
      knowledge_source_status: ["pending", "processing", "completed", "error"],
      knowledge_source_type: ["pdf", "docx", "url", "text"],
      post_status: ["draft", "scheduled", "published", "failed"],
      qr_code_type: ["static", "dynamic"],
      review_reply_status: [
        "pending_ai",
        "awaiting_approval",
        "approved",
        "posted",
        "rejected",
      ],
      social_platform: ["facebook", "instagram", "linkedin", "twitter"],
      task_status: ["todo", "in_progress", "completed", "cancelled"],
    },
  },
} as const
