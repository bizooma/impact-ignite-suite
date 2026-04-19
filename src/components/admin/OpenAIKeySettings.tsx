import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Key, CheckCircle2, AlertCircle, Trash2, Loader2 } from 'lucide-react';

interface OpenAIKeySettingsProps {
  organizationId: string;
}

interface KeyStatus {
  configured: boolean;
  status: string;
  masked: string | null;
  updated_at: string | null;
}

export function OpenAIKeySettings({ organizationId }: OpenAIKeySettingsProps) {
  const queryClient = useQueryClient();
  const [keyInput, setKeyInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ['openai-key-status', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('org-openai-key-settings', {
        body: { action: 'status', organizationId },
      });
      if (error) throw error;
      return data as KeyStatus;
    },
  });

  useEffect(() => {
    if (status?.configured) setShowInput(false);
  }, [status?.configured]);

  const saveMutation = useMutation({
    mutationFn: async (apiKey: string) => {
      const { data, error } = await supabase.functions.invoke('org-openai-key-settings', {
        body: { action: 'save', organizationId, apiKey },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('OpenAI key saved — your usage will now be billed to your OpenAI account.');
      setKeyInput('');
      setShowInput(false);
      queryClient.invalidateQueries({ queryKey: ['openai-key-status', organizationId] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to save key'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('org-openai-key-settings', {
        body: { action: 'delete', organizationId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast.success('OpenAI key removed. Usage will resume billing to the platform.');
      queryClient.invalidateQueries({ queryKey: ['openai-key-status', organizationId] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to remove key'),
  });

  const testMutation = useMutation({
    mutationFn: async (apiKey: string) => {
      const { data, error } = await supabase.functions.invoke('org-openai-key-settings', {
        body: { action: 'test', organizationId, apiKey },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => toast.success('Key works ✓'),
    onError: (err: any) => toast.error(err.message || 'Key test failed'),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          OpenAI API Key (Bring Your Own)
        </CardTitle>
        <CardDescription>
          Optionally use your own OpenAI API key. When configured, AI usage is billed directly to
          your OpenAI account and is <strong>not subject to monthly message caps</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : status?.configured ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Active</span>
                  <Badge variant="secondary" className="font-mono">{status.masked}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Updated {status.updated_at ? new Date(status.updated_at).toLocaleString() : 'recently'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowInput(true)}>
                  Replace
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No key configured. Your chatbot is using the platform's OpenAI account and is subject
              to your subscription tier's monthly message cap.
            </AlertDescription>
          </Alert>
        )}

        {(showInput || !status?.configured) && (
          <div className="space-y-2">
            <Label htmlFor="openai-key">OpenAI API Key</Label>
            <div className="flex gap-2">
              <Input
                id="openai-key"
                type="password"
                placeholder="sk-..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="font-mono"
              />
              <Button
                variant="outline"
                onClick={() => testMutation.mutate(keyInput)}
                disabled={!keyInput || testMutation.isPending}
              >
                {testMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
              </Button>
              <Button
                onClick={() => saveMutation.mutate(keyInput)}
                disabled={!keyInput || saveMutation.isPending}
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your key at{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                platform.openai.com/api-keys
              </a>
              . Stored encrypted; only used by your chatbot's edge functions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
