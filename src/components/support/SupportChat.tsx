import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_role: 'user' | 'support';
  content: string;
  created_at: string;
}

export function SupportChat() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load most recent thread for this org
  useEffect(() => {
    if (!organization?.id || !user) return;
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('support_threads')
        .select('id')
        .eq('organization_id', organization.id)
        .order('last_message_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      if (data) {
        setThreadId(data.id);
      } else {
        setThreadId(null);
        setMessages([]);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [organization?.id, user]);

  // Load messages + subscribe
  useEffect(() => {
    if (!threadId) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('support_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      if (active && data) setMessages(data as Message[]);
    })();

    const channel = supabase
      .channel(`support_messages:${threadId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `thread_id=eq.${threadId}`,
      }, (payload) => {
        setMessages(prev => {
          const m = payload.new as Message;
          if (prev.some(x => x.id === m.id)) return prev;
          return [...prev, m];
        });
      })
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [threadId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || !user || !organization?.id) return;
    setSending(true);
    try {
      let tid = threadId;
      if (!tid) {
        const { data, error } = await supabase
          .from('support_threads')
          .insert({
            organization_id: organization.id,
            created_by: user.id,
            subject: 'Support request',
          })
          .select('id')
          .single();
        if (error) throw error;
        tid = data.id;
        setThreadId(tid);
      }

      const { error: msgErr } = await supabase
        .from('support_messages')
        .insert({
          thread_id: tid,
          sender_id: user.id,
          sender_role: 'user',
          content,
        });
      if (msgErr) throw msgErr;
      setInput('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <CardTitle>Chat with Support</CardTitle>
        </div>
        <CardDescription>
          Send us a message and our team will reply here. Replies appear in real time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col h-[500px] border rounded-lg bg-muted/30">
          <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
            <div ref={scrollRef} className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No messages yet. Send your first message to start the conversation.
                </p>
              ) : (
                messages.map(m => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender_role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                        m.sender_role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <p className={`text-[10px] mt-1 ${m.sender_role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          <div className="border-t p-3 flex gap-2 bg-background rounded-b-lg">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type your message…"
              disabled={sending || !organization?.id}
            />
            <Button onClick={handleSend} disabled={sending || !input.trim() || !organization?.id}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
