import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TrackEventParams {
  chatbotId: string;
  sessionId?: string;
  eventType: string;
  eventData?: Record<string, any>;
}

export function useAnalytics() {
  const trackEvent = useCallback(async ({
    chatbotId,
    sessionId,
    eventType,
    eventData = {},
  }: TrackEventParams) => {
    try {
      const { error } = await supabase.functions.invoke('track-event', {
        body: {
          chatbotId,
          sessionId,
          eventType,
          eventData,
        },
      });

      if (error) {
        console.error('Analytics tracking error:', error);
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, []);

  const trackChatOpened = useCallback((chatbotId: string, sessionId: string) => {
    return trackEvent({
      chatbotId,
      sessionId,
      eventType: 'chat_opened',
    });
  }, [trackEvent]);

  const trackMessageSent = useCallback((chatbotId: string, sessionId: string, messageLength: number) => {
    return trackEvent({
      chatbotId,
      sessionId,
      eventType: 'message_sent',
      eventData: { messageLength },
    });
  }, [trackEvent]);

  const trackVolunteerOpen = useCallback((chatbotId: string, sessionId: string) => {
    return trackEvent({
      chatbotId,
      sessionId,
      eventType: 'volunteer_open',
    });
  }, [trackEvent]);

  const trackVolunteerSubmit = useCallback((chatbotId: string, sessionId: string) => {
    return trackEvent({
      chatbotId,
      sessionId,
      eventType: 'volunteer_submitted',
    });
  }, [trackEvent]);

  const trackDonateClick = useCallback((chatbotId: string, sessionId: string, buttonLabel: string) => {
    return trackEvent({
      chatbotId,
      sessionId,
      eventType: 'donate_click',
      eventData: { buttonLabel },
    });
  }, [trackEvent]);

  const trackFaqOpen = useCallback((chatbotId: string, sessionId: string) => {
    return trackEvent({
      chatbotId,
      sessionId,
      eventType: 'faq_open',
    });
  }, [trackEvent]);

  const trackContactClick = useCallback((chatbotId: string, sessionId: string, contactType: 'email' | 'phone') => {
    return trackEvent({
      chatbotId,
      sessionId,
      eventType: 'contact_click',
      eventData: { contactType },
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackChatOpened,
    trackMessageSent,
    trackVolunteerOpen,
    trackVolunteerSubmit,
    trackDonateClick,
    trackFaqOpen,
    trackContactClick,
  };
}
