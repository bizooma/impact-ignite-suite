import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const volunteerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  phone: z.string().trim().optional(),
  days: z.array(z.string()).min(1, 'Select at least one day'),
});

interface VolunteerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chatbotId: string;
  onTrackEvent: (eventType: string, eventData?: any) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const VolunteerDialog: React.FC<VolunteerDialogProps> = ({
  isOpen,
  onClose,
  chatbotId,
  onTrackEvent,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    days: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data
      volunteerSchema.parse(formData);
      
      setLoading(true);

      const { error } = await supabase.functions.invoke('submit-volunteer', {
        body: {
          ...formData,
          chatbotId,
        },
      });

      if (error) throw error;

      toast({
        title: 'Thank you!',
        description: 'Your volunteer application has been submitted successfully.',
      });

      onTrackEvent('volunteer_submitted', { days: formData.days });
      
      // Reset form and close
      setFormData({ name: '', email: '', phone: '', days: [] });
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodError = error as z.ZodError;
        toast({
          title: 'Validation Error',
          description: zodError.issues[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to submit volunteer form. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Volunteer With Us</DialogTitle>
          <DialogDescription>
            Fill out the form below and we'll get in touch with you about volunteer opportunities.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label>Available Days *</Label>
            <div className="grid grid-cols-2 gap-3">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={formData.days.includes(day)}
                    onCheckedChange={() => handleDayToggle(day)}
                  />
                  <Label htmlFor={day} className="cursor-pointer text-sm font-normal">
                    {day}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
