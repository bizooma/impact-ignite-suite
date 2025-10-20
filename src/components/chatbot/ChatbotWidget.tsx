import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VideoPlayer } from './VideoPlayer';
import { ChatbotFooter } from './ChatbotFooter';
import { Chatbot, ChatbotWidgetConfig } from '@/types/database';
import { useChatbot } from '@/hooks/useChatbot';

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const config = chatbot.web_widget_config as ChatbotWidgetConfig || {};
  const { messages, sessionId, loading, sendMessage } = useChatbot(chatbot.id);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      onTrackEvent('chat_opened');
      // Auto-focus input when opened
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      onTrackEvent('chat_closed');
    }
  }, [isOpen, onTrackEvent]);

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

  if (!mounted || !isOpen) return null;

  const widget = (
    <div className="fixed bottom-20 right-6 z-[200] w-[400px] h-[600px] animate-slide-in-right">
      <div className="w-full h-full bg-background/95 backdrop-blur-md 
        rounded-lg shadow-elevated flex flex-col overflow-hidden border">
        
        {/* Header */}
        <div className="bg-gradient-primary text-primary-foreground p-4 flex items-center justify-between">
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
            className="text-primary-foreground hover:bg-primary-foreground/20"
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
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted text-foreground'
                    }`}
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
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>

        {/* Footer with action buttons */}
        <ChatbotFooter
          config={config}
          onVolunteerClick={onVolunteerClick}
          onFaqClick={onFaqClick}
          onTrackEvent={onTrackEvent}
        />
      </div>
    </div>
  );

  return createPortal(widget, document.body);
};
