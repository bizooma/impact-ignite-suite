import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VideoPlayer } from './VideoPlayer';
import { ChatbotFooter } from './ChatbotFooter';
import { VolunteerDialog } from './VolunteerDialog';
import { FaqDialog } from './FaqDialog';
import { Chatbot, ChatbotWidgetConfig } from '@/types/database';
import { useChatbot } from '@/hooks/useChatbot';
import { useChatbotBranding } from '@/hooks/useChatbotBranding';

interface ChatbotWidgetProps {
  chatbot: Chatbot;
  isOpen: boolean;
  onClose: () => void;
  onVolunteerClick: () => void;
  onFaqClick: () => void;
  onTrackEvent: (eventType: string, eventData?: any) => void;
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  chatbot,
  isOpen,
  onClose,
  onVolunteerClick,
  onFaqClick,
  onTrackEvent,
}) => {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState('');
  const [showVideo, setShowVideo] = useState(true);
  const [showVolunteerDialog, setShowVolunteerDialog] = useState(false);
  const [showFaqDialog, setShowFaqDialog] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const config = chatbot.web_widget_config as ChatbotWidgetConfig || {};
  const { messages, sessionId, loading, sendMessage } = useChatbot(chatbot.id);

  const branding = useChatbotBranding(chatbot);
  const welcomeMessage = branding.welcomeMessage;
  const showWelcome = !!welcomeMessage && messages.length === 0 && !loading;

  const brandColors = {
    primary: branding.primary,
    accent: branding.accent,
  };
  // Per-widget logo override wins, otherwise fall back to brand kit logo
  const botLogo = config.logo_url || branding.logoUrl || undefined;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Wrap onTrackEvent to always include the current sessionId for correlation
  const trackEvent = React.useCallback(
    (eventType: string, eventData?: any) => {
      onTrackEvent(eventType, { ...(eventData || {}), sessionId: sessionId || null });
    },
    [onTrackEvent, sessionId],
  );

  useEffect(() => {
    if (isOpen) {
      trackEvent('chat_opened');
      // Auto-focus input when opened
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      trackEvent('chat_closed');
    }
  }, [isOpen, trackEvent]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const messageText = input.trim();
    setInput('');
    
    await sendMessage(messageText);
  };

  const handleContinueToChat = () => {
    setShowVideo(false);
    inputRef.current?.focus();
  };

  const handleVolunteerClick = () => {
    setShowVolunteerDialog(true);
    trackEvent('volunteer_opened');
  };

  const handleFaqClick = () => {
    setShowFaqDialog(true);
    trackEvent('faq_opened');
  };

  if (!mounted || !isOpen) return null;

  const widget = (
    <div className="fixed bottom-20 right-6 z-[9999] w-[400px] h-[600px] animate-slide-in-right">
      <div className="w-full h-full bg-background 
        rounded-lg shadow-elevated flex flex-col overflow-hidden border">
        
        {/* Header */}
        <div 
          className="text-white p-4 flex items-center justify-between"
          style={{ backgroundColor: brandColors.primary }}
        >
          <div className="flex items-center gap-3">
            {config.logo_url && (
              <Avatar className="w-10 h-10">
                <AvatarImage src={config.logo_url} alt={config.bot_name} />
                <AvatarFallback>{config.bot_name?.[0] || 'A'}</AvatarFallback>
              </Avatar>
            )}
            <div>
              <h3 className="font-semibold">{config.bot_name || chatbot.name}</h3>
              <p className="text-xs opacity-90">Online now</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Video Player */}
        {showVideo && config.video_source && (
          <div className="p-4 border-b">
            <VideoPlayer
              videoSource={config.video_source}
              videoType={config.video_type}
              ctaText={config.video_cta_text}
              onContinue={handleContinueToChat}
            />
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          <div className="space-y-4">
            {showWelcome && (
              <div className="flex gap-3 justify-start">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={config.logo_url} alt={config.bot_name} />
                  <AvatarFallback>{config.bot_name?.[0] || 'A'}</AvatarFallback>
                </Avatar>
                <div className="max-w-[80%]">
                  <p className="text-xs text-muted-foreground mb-1">{config.bot_name || 'Assistant'}</p>
                  <div className="rounded-lg p-3 bg-muted text-foreground">
                    <p className="text-sm whitespace-pre-wrap">{welcomeMessage}</p>
                  </div>
                </div>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={config.logo_url} alt={config.bot_name} />
                    <AvatarFallback>{config.bot_name?.[0] || 'A'}</AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                  {msg.role === 'assistant' && (
                    <p className="text-xs text-muted-foreground mb-1">{config.bot_name || 'Assistant'}</p>
                  )}
                  <div
                    className={`rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'text-white ml-auto'
                        : 'bg-muted text-foreground'
                    }`}
                    style={msg.role === 'user' ? { backgroundColor: brandColors.accent } : undefined}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={config.logo_url} alt={config.bot_name} />
                  <AvatarFallback>{config.bot_name?.[0] || 'A'}</AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={loading || !input.trim()}
              style={{ backgroundColor: brandColors.accent, color: 'white' }}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>

        {/* Footer with action buttons */}
        <ChatbotFooter
          config={config}
          brandColors={brandColors}
          onVolunteerClick={handleVolunteerClick}
          onFaqClick={handleFaqClick}
          onTrackEvent={trackEvent}
        />
      </div>

      {/* Volunteer Dialog */}
      <VolunteerDialog
        isOpen={showVolunteerDialog}
        onClose={() => setShowVolunteerDialog(false)}
        chatbotId={chatbot.id}
        onTrackEvent={trackEvent}
      />

      {/* FAQ Dialog */}
      <FaqDialog
        isOpen={showFaqDialog}
        onClose={() => setShowFaqDialog(false)}
        chatbotId={chatbot.id}
        onTrackEvent={trackEvent}
      />
    </div>
  );

  return createPortal(widget, document.body);
};
