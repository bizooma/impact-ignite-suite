import React, { useState, useEffect } from 'react';
import { ChatbotLauncher } from './ChatbotLauncher';
import { ChatbotWidget } from './ChatbotWidget';
import type { Chatbot } from '@/types/database';

interface StandaloneWidgetProps {
  chatbotId: string;
  primaryColor?: string;
  accentColor?: string;
}

interface ChatbotConfig {
  chatbot: Chatbot;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
    order_index: number;
  }>;
}

export function StandaloneWidget({ 
  chatbotId, 
  primaryColor, 
  accentColor 
}: StandaloneWidgetProps) {
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, [chatbotId]);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://svuxuhrsrawdqqkepeye.supabase.co/functions/v1/get-widget-config?chatbot_id=${chatbotId}`
      );

      if (!response.ok) {
        throw new Error('Failed to load chatbot configuration');
      }

      const data = await response.json();
      
      // Override colors if provided
      if (primaryColor || accentColor) {
        data.chatbot.brand_settings = {
          ...data.chatbot.brand_settings,
          ...(primaryColor && { primary_color: primaryColor }),
          ...(accentColor && { accent_color: accentColor }),
        };
      }

      setConfig(data);
      setError(null);
    } catch (err) {
      console.error('Error loading chatbot config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chatbot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    
    // Track widget opened event
    trackEvent('widget_opened');
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const trackEvent = async (eventType: string) => {
    try {
      await fetch(
        `https://svuxuhrsrawdqqkepeye.supabase.co/functions/v1/track-event`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatbotId: chatbotId,
            eventType: eventType,
          }),
        }
      );
    } catch (err) {
      console.error('Error tracking event:', err);
    }
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (error || !config) {
    console.error('Chatbot widget error:', error);
    return null;
  }

  // Don't render if chatbot is not active
  if (config.chatbot.status !== 'active') {
    console.warn('Chatbot is not active');
    return null;
  }

  const handleVolunteerClick = () => {
    trackEvent('volunteer_clicked');
  };

  const handleFaqClick = () => {
    trackEvent('faq_clicked');
  };

  return (
    <>
      <ChatbotLauncher
        config={config.chatbot.web_widget_config}
        onClick={handleOpen}
      />
      
      <ChatbotWidget
        chatbot={config.chatbot}
        isOpen={isOpen}
        onClose={handleClose}
        onVolunteerClick={handleVolunteerClick}
        onFaqClick={handleFaqClick}
        onTrackEvent={trackEvent}
      />
    </>
  );
}
