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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
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
          ip_address: unknown | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
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
            foreignKeyName: "crm_donations_organization_id_fkey"
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
      gbp_profiles: {
        Row: {
          business_name: string
          categories: string[] | null
          completeness_score: number | null
          created_at: string
          description: string | null
          id: string
          last_synced_at: string | null
          organization_id: string
          profile_data: Json | null
          updated_at: string
        }
        Insert: {
          business_name: string
          categories?: string[] | null
          completeness_score?: number | null
          created_at?: string
          description?: string | null
          id?: string
          last_synced_at?: string | null
          organization_id: string
          profile_data?: Json | null
          updated_at?: string
        }
        Update: {
          business_name?: string
          categories?: string[] | null
          completeness_score?: number | null
          created_at?: string
          description?: string | null
          id?: string
          last_synced_at?: string | null
          organization_id?: string
          profile_data?: Json | null
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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
          created_at: string
          description: string | null
          has_mobile_app: boolean | null
          id: string
          logo_url: string | null
          mobile_app_code: string | null
          name: string
          purchased_products: Json | null
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          has_mobile_app?: boolean | null
          id?: string
          logo_url?: string | null
          mobile_app_code?: string | null
          name: string
          purchased_products?: Json | null
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          has_mobile_app?: boolean | null
          id?: string
          logo_url?: string | null
          mobile_app_code?: string | null
          name?: string
          purchased_products?: Json | null
          slug?: string
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
          name?: string
          organization_id?: string
          short_url?: string | null
          type?: Database["public"]["Enums"]["qr_code_type"] | null
          updated_at?: string
          utm_params?: Json | null
        }
        Relationships: [
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
          ip_address: unknown | null
          location_data: Json | null
          qr_code_id: string
          referrer: string | null
          scanned_at: string
          user_agent: string | null
        }
        Insert: {
          device_info?: Json | null
          id?: string
          ip_address?: unknown | null
          location_data?: Json | null
          qr_code_id: string
          referrer?: string | null
          scanned_at?: string
          user_agent?: string | null
        }
        Update: {
          device_info?: Json | null
          id?: string
          ip_address?: unknown | null
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
            foreignKeyName: "social_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          metadata: Json | null
          organization_id: string
          priority: number | null
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
          metadata?: Json | null
          organization_id: string
          priority?: number | null
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
          metadata?: Json | null
          organization_id?: string
          priority?: number | null
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
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
      [_ in never]: never
    }
    Functions: {
      grant_platform_admin: {
        Args: { _email: string }
        Returns: boolean
      }
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
      is_platform_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "editor" | "viewer"
      audit_severity: "low" | "medium" | "high" | "critical"
      chatbot_status: "draft" | "active" | "paused"
      integration_provider:
        | "facebook"
        | "instagram"
        | "linkedin"
        | "twitter"
        | "google_business"
        | "openai"
        | "postmark"
        | "twilio"
      knowledge_source_status: "pending" | "processing" | "completed" | "error"
      knowledge_source_type: "pdf" | "docx" | "url" | "text"
      post_status: "draft" | "scheduled" | "published" | "failed"
      qr_code_type: "static" | "dynamic"
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
      audit_severity: ["low", "medium", "high", "critical"],
      chatbot_status: ["draft", "active", "paused"],
      integration_provider: [
        "facebook",
        "instagram",
        "linkedin",
        "twitter",
        "google_business",
        "openai",
        "postmark",
        "twilio",
      ],
      knowledge_source_status: ["pending", "processing", "completed", "error"],
      knowledge_source_type: ["pdf", "docx", "url", "text"],
      post_status: ["draft", "scheduled", "published", "failed"],
      qr_code_type: ["static", "dynamic"],
      social_platform: ["facebook", "instagram", "linkedin", "twitter"],
      task_status: ["todo", "in_progress", "completed", "cancelled"],
    },
  },
} as const
