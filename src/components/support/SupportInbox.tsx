import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Inbox, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const NOTIFY_PREF_KEY = 'support_inbox_desktop_notifications';

interface Thread {
  id: string;
  organization_id: string;
  subject: string | null;
  status: 'open' | 'closed';
  last_message_at: string;
  organizations?: { name: string; slug: string } | null;
}

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_role: 'user' | 'support';
  content: string;
  created_at: string;
}

export function SupportInbox() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(NOTIFY_PREF_KEY) === '1';
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const threadsRef = useRef<Thread[]>([]);
  const notifyEnabledRef = useRef(notifyEnabled);

  useEffect(() => { threadsRef.current = threads; }, [threads]);
  useEffect(() => { notifyEnabledRef.current = notifyEnabled; }, [notifyEnabled]);

  const loadThreads = async () => {
    const { data } = await supabase
      .from('support_threads')
      .select('id, organization_id, subject, status, last_message_at, organizations(name, slug)')
      .order('last_message_at', { ascending: false })
      .limit(100);
    if (data) setThreads(data as any);
  };

  useEffect(() => {
    loadThreads();
    const channel = supabase
      .channel('support_inbox_threads')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_threads',
      }, () => loadThreads())
      .subscribe();

    // Global subscription for desktop notifications on new user messages
    const msgChannel = supabase
      .channel('support_inbox_all_msgs')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
      }, (payload) => {
        const m = payload.new as Message;
        if (m.sender_role !== 'user') return;
        if (!notifyEnabledRef.current) return;
        if (typeof window === 'undefined' || !('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;

        const thread = threadsRef.current.find(t => t.id === m.thread_id);
        const orgName = thread?.organizations?.name || 'a user';
        const preview = m.content.length > 140 ? m.content.slice(0, 140) + '…' : m.content;

        try {
          const n = new Notification(`New support chat from ${orgName}`, {
            body: preview,
            icon: '/favicon.ico',
            tag: m.thread_id,
          });
          n.onclick = () => {
            window.focus();
            setSelectedId(m.thread_id);
            n.close();
          };
        } catch {
          // ignore notification errors
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(msgChannel);
    };
  }, []);

  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('support_messages')
        .select('*')
        .eq('thread_id', selectedId)
        .order('created_at', { ascending: true });
      if (active && data) setMessages(data as Message[]);
    })();
    const channel = supabase
      .channel(`support_inbox_msgs:${selectedId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `thread_id=eq.${selectedId}`,
      }, (payload) => {
        setMessages(prev => {
          const m = payload.new as Message;
          if (prev.some(x => x.id === m.id)) return prev;
          return [...prev, m];
        });
      })
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [selectedId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleReply = async () => {
    const content = reply.trim();
    if (!content || !selectedId || !user) return;
    setSending(true);
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          thread_id: selectedId,
          sender_id: user.id,
          sender_role: 'support',
          content,
        });
      if (error) throw error;
      setReply('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-primary" />
          <CardTitle>Support Inbox (Admin)</CardTitle>
        </div>
        <CardDescription>
          All support conversations across organizations. Reply to users in real time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border rounded-lg overflow-hidden h-[600px]">
          {/* Thread list */}
          <div className="border-r bg-muted/30 md:col-span-1 flex flex-col">
            <div className="p-3 border-b text-xs font-medium text-muted-foreground uppercase">
              {threads.length} thread{threads.length === 1 ? '' : 's'}
            </div>
            <ScrollArea className="flex-1">
              {threads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center p-4">No threads yet.</p>
              ) : (
                threads.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left p-3 border-b hover:bg-accent transition-colors ${
                      selectedId === t.id ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">
                        {t.organizations?.name || 'Unknown org'}
                      </p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        t.status === 'open' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {t.subject || 'Support request'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(t.last_message_at).toLocaleString()}
                    </p>
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Conversation */}
          <div className="md:col-span-2 flex flex-col bg-background">
            {!selectedId ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                Select a thread to view the conversation
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
                  <div ref={scrollRef} className="space-y-3">
                    {messages.map(m => (
                      <div
                        key={m.id}
                        className={`flex ${m.sender_role === 'support' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                            m.sender_role === 'support'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted border'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <p className={`text-[10px] mt-1 ${m.sender_role === 'support' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {m.sender_role === 'user' ? 'User' : 'Support'} · {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="border-t p-3 flex gap-2">
                  <Input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                    placeholder="Type your reply…"
                    disabled={sending}
                  />
                  <Button onClick={handleReply} disabled={sending || !reply.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
