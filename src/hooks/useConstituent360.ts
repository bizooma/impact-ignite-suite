import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type TimelineEventType = 'donation' | 'volunteer' | 'interaction' | 'note';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: string; // ISO
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

export function useConstituent360(contactId: string, organizationId: string, enabled = true) {
  return useQuery({
    queryKey: ['constituent-360', contactId],
    enabled: enabled && !!contactId && !!organizationId,
    queryFn: async (): Promise<TimelineEvent[]> => {
      const [donRes, volRes, intRes, noteRes] = await Promise.all([
        supabase.from('crm_donations').select('id,amount,donation_date,payment_method,is_recurring,notes,currency')
          .eq('contact_id', contactId).eq('organization_id', organizationId),
        supabase.from('crm_volunteer_hours').select('id,activity,hours,volunteer_date,location,notes,approved')
          .eq('contact_id', contactId).eq('organization_id', organizationId),
        supabase.from('crm_interactions').select('id,interaction_type,subject,description,interaction_date')
          .eq('contact_id', contactId).eq('organization_id', organizationId),
        supabase.from('crm_notes').select('id,content,is_pinned,created_at')
          .eq('contact_id', contactId).eq('organization_id', organizationId),
      ]);

      const events: TimelineEvent[] = [];

      donRes.data?.forEach((d: any) => events.push({
        id: `don-${d.id}`,
        type: 'donation',
        date: d.donation_date,
        title: `${d.currency || 'USD'} $${Number(d.amount).toLocaleString()}${d.is_recurring ? ' • Recurring' : ''}`,
        description: d.notes || (d.payment_method ? `Paid via ${String(d.payment_method).replace(/_/g, ' ')}` : undefined),
        metadata: d,
      }));

      volRes.data?.forEach((v: any) => events.push({
        id: `vol-${v.id}`,
        type: 'volunteer',
        date: v.volunteer_date,
        title: `${v.hours} hrs — ${v.activity}`,
        description: [v.location, v.notes].filter(Boolean).join(' • ') || undefined,
        metadata: v,
      }));

      intRes.data?.forEach((i: any) => events.push({
        id: `int-${i.id}`,
        type: 'interaction',
        date: i.interaction_date,
        title: `${String(i.interaction_type).replace(/_/g, ' ')}${i.subject ? `: ${i.subject}` : ''}`,
        description: i.description || undefined,
        metadata: i,
      }));

      noteRes.data?.forEach((n: any) => events.push({
        id: `note-${n.id}`,
        type: 'note',
        date: n.created_at,
        title: n.is_pinned ? '📌 Note' : 'Note',
        description: n.content,
        metadata: n,
      }));

      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return events;
    },
  });
}
