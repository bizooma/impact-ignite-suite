import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampaignAssets, type CampaignAsset } from '@/hooks/useCampaignAssets';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Edit2, Loader2, Save, X, Send, MessageSquare, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { AddFaqToChatbotDialog } from './AddFaqToChatbotDialog';
import { writePendingGbpDraft } from '@/components/gbp/GbpDraftBanner';

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
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [faqDialog, setFaqDialog] = useState<{ open: boolean; asset?: CampaignAsset }>({ open: false });

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

  const sendSocialToComposer = (a: CampaignAsset) => {
    // Hand the asset to Social Media → composer. SocialMediaDashboard reads ?compose=1&asset=<id>&campaign=<id>.
    const params = new URLSearchParams({ compose: '1', asset: a.id, campaign: campaignId });
    navigate(`/dashboard/social?${params.toString()}`);
  };

  const sendGbpToComposer = (a: CampaignAsset) => {
    writePendingGbpDraft({
      body: a.body || '',
      title: a.title,
      campaignId,
      assetId: a.id,
    });
    updateAsset.mutate({ id: a.id, updates: { status: 'scheduled' } });
    toast.success('Draft sent to Google Business — opening composer');
    navigate('/dashboard/gbp');
  };

  const renderActions = (a: CampaignAsset) => {
    const isEditing = editingId === a.id;
    if (isEditing) {
      return (
        <>
          <Button size="sm" variant="ghost" onClick={() => saveEdit(a)} title="Save"><Save className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} title="Cancel"><X className="h-4 w-4" /></Button>
        </>
      );
    }
    return (
      <>
        {a.asset_type === 'social_post' && (
          <Button size="sm" variant="ghost" onClick={() => sendSocialToComposer(a)} title="Send to Composer">
            <Send className="h-4 w-4" />
          </Button>
        )}
        {a.asset_type === 'chatbot_faq' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFaqDialog({ open: true, asset: a })}
            title="Add to a chatbot"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        )}
        {a.asset_type === 'gbp_post' && (
          <Button size="sm" variant="ghost" onClick={() => sendGbpToComposer(a)} title="Send to Google Business">
            <Send className="h-4 w-4" />
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => startEdit(a)} title="Edit"><Edit2 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => copy(a.body || '')} title="Copy"><Copy className="h-4 w-4" /></Button>
      </>
    );
  };

  const renderAsset = (a: CampaignAsset) => {
    const isEditing = editingId === a.id;
    const isPublished = a.status === 'published' || a.status === 'scheduled';
    return (
      <Card key={a.id} className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="font-medium flex items-center gap-2">
              {a.title}
              {isPublished && (
                <Badge variant="default" className="text-xs gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {a.status === 'scheduled' ? 'Scheduled' : 'Published'}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {a.metadata?.platform && (
                <Badge variant="outline" className="capitalize text-xs">{a.metadata.platform}</Badge>
              )}
              {a.metadata?.phase && (
                <Badge variant="secondary" className="capitalize text-xs">{a.metadata.phase.replace('_', ' ')}</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">{renderActions(a)}</div>
        </div>
        {isEditing ? (
          <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={6} className="text-sm" />
        ) : (
          <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground bg-muted/30 rounded p-3">{a.body}</pre>
        )}
        {a.asset_type === 'email_draft' && !isEditing && (
          <div className="text-xs text-muted-foreground mt-2 italic">
            Tip: copy this into your email tool (Mailchimp, etc.) when you're ready to send.
          </div>
        )}
        {a.asset_type === 'sms_draft' && !isEditing && (
          <div className="text-xs text-muted-foreground mt-2 italic">
            Tip: copy this into your SMS provider.
          </div>
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
    <>
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

      <AddFaqToChatbotDialog
        open={faqDialog.open}
        onOpenChange={(o) => setFaqDialog({ open: o, asset: o ? faqDialog.asset : undefined })}
        question={faqDialog.asset?.title || ''}
        answer={faqDialog.asset?.body || ''}
        onAdded={() => {
          if (faqDialog.asset) updateAsset.mutate({ id: faqDialog.asset.id, updates: { status: 'published' } });
        }}
      />
    </>
  );
}
