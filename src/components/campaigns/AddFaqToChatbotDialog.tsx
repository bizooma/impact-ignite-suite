import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useChatbots } from '@/hooks/useChatbots';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  question: string;
  answer: string;
  onAdded?: () => void;
}

/**
 * Lets users push a chatbot FAQ asset from a campaign into one of their actual chatbots.
 * Creates a chatbot_faqs row.
 */
export function AddFaqToChatbotDialog({ open, onOpenChange, question, answer, onAdded }: Props) {
  const { organization } = useOrganization();
  const { chatbots } = useChatbots(organization?.id);
  const [chatbotId, setChatbotId] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    if (!chatbotId) {
      toast.error('Pick a chatbot first');
      return;
    }
    setBusy(true);
    try {
      // Find current max order so the new FAQ lands at the bottom
      const { data: existing } = await supabase
        .from('chatbot_faqs')
        .select('order_index')
        .eq('chatbot_id', chatbotId)
        .order('order_index', { ascending: false })
        .limit(1);
      const nextIndex = (existing?.[0]?.order_index ?? -1) + 1;

      const { error } = await supabase.from('chatbot_faqs').insert({
        chatbot_id: chatbotId,
        question,
        answer,
        order_index: nextIndex,
      });
      if (error) throw error;
      toast.success('FAQ added to chatbot');
      onAdded?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add FAQ to a chatbot</DialogTitle>
          <DialogDescription>
            This adds the question and answer to the chatbot's FAQ list. You can edit it afterward in the Chatbots module.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Chatbot</Label>
            <Select value={chatbotId} onValueChange={setChatbotId}>
              <SelectTrigger><SelectValue placeholder="Select a chatbot" /></SelectTrigger>
              <SelectContent>
                {(chatbots || []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
                {(!chatbots || chatbots.length === 0) && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No chatbots yet — create one in the Chatbots module first.</div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Question</Label>
            <div className="text-sm font-medium mt-1">{question}</div>
          </div>
          <div>
            <Label>Answer</Label>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap mt-1 max-h-32 overflow-y-auto">{answer}</div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
            <Button onClick={handleAdd} disabled={busy || !chatbotId}>
              {busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Add FAQ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
