import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { ChatbotFAQ } from '@/types/database';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FaqDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chatbotId: string;
  onTrackEvent: (eventType: string, eventData?: any) => void;
}

export const FaqDialog: React.FC<FaqDialogProps> = ({
  isOpen,
  onClose,
  chatbotId,
  onTrackEvent,
}) => {
  const [faqs, setFaqs] = useState<ChatbotFAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadFaqs();
      onTrackEvent('faq_opened');
    }
  }, [isOpen]);

  const loadFaqs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chatbot_faqs')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('order_index');

      if (error) throw error;

      setFaqs(data || []);
    } catch (error) {
      console.error('Error loading FAQs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load FAQs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFaqClick = (faqId: string, question: string) => {
    onTrackEvent('faq_clicked', { faqId, question });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Frequently Asked Questions</DialogTitle>
          <DialogDescription>
            Find answers to common questions below.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No FAQs available at the moment.</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={faq.id} value={`item-${index}`}>
                  <AccordionTrigger
                    onClick={() => handleFaqClick(faq.id, faq.question)}
                    className="text-left"
                  >
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground whitespace-pre-wrap">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
