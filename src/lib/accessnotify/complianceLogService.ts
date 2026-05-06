import { supabase } from '@/integrations/supabase/client';

export interface ComplianceLogEntry {
  organization_id: string;
  campaign_id?: string | null;
  campaign_name?: string | null;
  message_id?: string | null;
  recipient_label: string;
  channel: 'email' | 'sms' | 'voice';
  delivery_status: 'pending' | 'sent' | 'delivered' | 'failed' | 'skipped';
  accessibility_score?: number | null;
  template_id?: string | null;
  sent_by?: string | null;
  accommodation_applied?: Record<string, unknown> | null;
  version_sent?: string | null;
}

export async function logSend(entry: ComplianceLogEntry) {
  const { error } = await supabase.from('accessnotify_compliance_logs').insert([entry as any]);
  if (error) throw error;
}
