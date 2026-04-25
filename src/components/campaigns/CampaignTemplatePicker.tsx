import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Heart, Calendar, Plus } from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  organizationId: string;
}

export function CampaignTemplatePicker({ open, onOpenChange, organizationId }: Props) {
  const { createFromGivingTuesday, createCampaign } = useCampaigns(organizationId);
  const navigate = useNavigate();

  const handleGivingTuesday = async () => {
    const c = await createFromGivingTuesday.mutateAsync({});
    onOpenChange(false);
    navigate(`/dashboard/campaigns/${c.id}`);
  };

  const handleBlank = async () => {
    const slug = `campaign-${Date.now().toString(36)}`;
    const c = await createCampaign.mutateAsync({
      name: 'Untitled Campaign',
      slug,
      status: 'draft',
    });
    onOpenChange(false);
    navigate(`/dashboard/campaigns/${c.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose a campaign template</DialogTitle>
          <DialogDescription>
            Start with a fully built plan or create a blank campaign.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card
            onClick={handleGivingTuesday}
            className="p-5 cursor-pointer hover:border-primary transition-all hover:shadow-md"
          >
            <Heart className="h-8 w-8 mb-3 text-red-600" />
            <h3 className="font-semibold mb-1">Giving Tuesday</h3>
            <p className="text-sm text-muted-foreground">
              Complete 8-week plan with timeline, social posts, emails, SMS, chatbot FAQs, and tasks.
            </p>
            <div className="text-xs text-primary mt-3">Recommended ⭐</div>
          </Card>

          <Card
            onClick={handleBlank}
            className="p-5 cursor-pointer hover:border-primary transition-all hover:shadow-md"
          >
            <Plus className="h-8 w-8 mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-1">Blank Campaign</h3>
            <p className="text-sm text-muted-foreground">
              Start from scratch and build your own plan.
            </p>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
