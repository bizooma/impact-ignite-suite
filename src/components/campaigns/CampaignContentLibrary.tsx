import { useState } from 'react';
import { useCampaignAssets, type CampaignAsset } from '@/hooks/useCampaignAssets';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Edit2, Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  campaignId: string;
}

const TYPE_LABELS: Record<string, string> = {
  social_post: 'Social',
  email_draft: 'Email',
  sms_draft: 'SMS',
  chatbot_faq: 'Chatbot FAQ',
  gbp_post: 'Google Business',
};

export function CampaignContentLibrary({ campaignId }: Props) {
  const { assets, isLoading, updateAsset } = useCampaignAssets(campaignId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const grouped = (assets || []).reduce((acc, a) => {
    (acc[a.asset_type] = acc[a.asset_type] || []).push(a);
    return acc;
  }, {} as Record<string, CampaignAsset[]>);

  const types = ['social_post', 'email_draft', 'sms_draft', 'chatbot_faq', 'gbp_post'].filter(
    (t) => grouped[t]?.length > 0
  );

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const startEdit = (a: CampaignAsset) => {
    setEditingId(a.id);
    setEditBody(a.body || '');
  };

  const saveEdit = (a: CampaignAsset) => {
    updateAsset.mutate({ id: a.id, updates: { body: editBody } });
    setEditingId(null);
    toast.success('Saved');
  };

  const renderAsset = (a: CampaignAsset) => {
    const isEditing = editingId === a.id;
    return (
      <Card key={a.id} className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="font-medium">{a.title}</div>
            {a.metadata?.platform && (
              <Badge variant="outline" className="mt-1 capitalize text-xs">{a.metadata.platform}</Badge>
            )}
            {a.metadata?.phase && (
              <Badge variant="secondary" className="mt-1 ml-1 capitalize text-xs">{a.metadata.phase.replace('_', ' ')}</Badge>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            {isEditing ? (
              <>
                <Button size="sm" variant="ghost" onClick={() => saveEdit(a)}><Save className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="ghost" onClick={() => startEdit(a)}><Edit2 className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => copy(a.body || '')}><Copy className="h-4 w-4" /></Button>
              </>
            )}
          </div>
        </div>
        {isEditing ? (
          <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={6} className="text-sm" />
        ) : (
          <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground bg-muted/30 rounded p-3">{a.body}</pre>
        )}
      </Card>
    );
  };

  if (types.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        No content drafts yet. Use a template to seed pre-written content.
      </Card>
    );
  }

  return (
    <Tabs defaultValue={types[0]}>
      <TabsList>
        {types.map((t) => (
          <TabsTrigger key={t} value={t}>
            {TYPE_LABELS[t]} ({grouped[t].length})
          </TabsTrigger>
        ))}
      </TabsList>
      {types.map((t) => (
        <TabsContent key={t} value={t} className="space-y-3 mt-4">
          {grouped[t].map(renderAsset)}
        </TabsContent>
      ))}
    </Tabs>
  );
}
