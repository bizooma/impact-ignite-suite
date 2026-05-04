import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lightbulb, Send } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackCardProps {
  organizationId: string;
}

type FeedbackType = 'feature_request' | 'feedback' | 'bug';

export function FeedbackForm({ organizationId, fieldClassName = 'bg-background' }: { organizationId: string; fieldClassName?: string }) {
  const { user } = useAuth();
  const [type, setType] = useState<FeedbackType>('feature_request');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be signed in to submit feedback.');
      return;
    }
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in both a title and details.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('product_feedback').insert({
      organization_id: organizationId,
      user_id: user.id,
      type,
      title: title.trim(),
      description: description.trim(),
    });
    setSubmitting(false);

    if (error) {
      console.error('Feedback submit error', error);
      toast.error('Could not submit feedback. Please try again.');
      return;
    }

    toast.success("Thanks! Your feedback has been sent to the Bizooma team.");
    setTitle('');
    setDescription('');
    setType('feature_request');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[200px_1fr]">
        <div className="space-y-2">
          <Label htmlFor="feedback-type">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as FeedbackType)}>
            <SelectTrigger id="feedback-type" className={fieldClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feature_request">Feature Request</SelectItem>
              <SelectItem value="feedback">General Feedback</SelectItem>
              <SelectItem value="bug">Bug Report</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="feedback-title">Title</Label>
          <Input
            id="feedback-title"
            placeholder="Short summary of your idea or issue"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            className={fieldClassName}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="feedback-description">Details</Label>
        <Textarea
          id="feedback-description"
          placeholder="Tell us more — what problem would this solve, or what did you experience?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={fieldClassName}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          <Send className="w-4 h-4 mr-2" />
          {submitting ? 'Submitting…' : 'Submit Feedback'}
        </Button>
      </div>
    </form>
  );
}

export function FeedbackCard({ organizationId }: FeedbackCardProps) {
  return (
    <Card className="bg-accent border-2 border-accent-foreground/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-accent-foreground">
          <Lightbulb className="w-5 h-5" />
          Wishlist & Feedback — Help Shape What's Next
        </CardTitle>
        <p className="text-sm text-accent-foreground/80">
          Have an idea for a new feature, a suggestion to improve something, or found a bug?
          We read every submission. Let us know what would make this platform even more valuable for your mission.
        </p>
      </CardHeader>
      <CardContent>
        <FeedbackForm organizationId={organizationId} />
      </CardContent>
    </Card>
  );
}
