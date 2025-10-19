import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { useCrm } from '@/hooks/useCrm';

interface ContactFormProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
}

export function ContactForm({ open, onClose, organizationId }: ContactFormProps) {
  const { createContact } = useCrm(organizationId);
  const [formData, setFormData] = useState({
    contact_type: 'individual' as 'individual' | 'organization' | 'foundation',
    first_name: '',
    last_name: '',
    organization_name: '',
    email: '',
    phone: '',
    source: 'manual',
    lifecycle_stage: 'lead' as 'lead' | 'volunteer' | 'donor' | 'member' | 'advocate' | 'inactive',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createContact.mutateAsync(formData);
    onClose();
    setFormData({
      contact_type: 'individual',
      first_name: '',
      last_name: '',
      organization_name: '',
      email: '',
      phone: '',
      source: 'manual',
      lifecycle_stage: 'lead',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="contact_type">Contact Type</Label>
            <Select
              value={formData.contact_type}
              onValueChange={(value: any) => setFormData({ ...formData, contact_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
                <SelectItem value="foundation">Foundation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.contact_type === 'individual' ? (
            <>
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
            </>
          ) : (
            <div>
              <Label htmlFor="organization_name">Organization Name</Label>
              <Input
                id="organization_name"
                value={formData.organization_name}
                onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="lifecycle_stage">Lifecycle Stage</Label>
            <Select
              value={formData.lifecycle_stage}
              onValueChange={(value: any) => setFormData({ ...formData, lifecycle_stage: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="volunteer">Volunteer</SelectItem>
                <SelectItem value="donor">Donor</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="advocate">Advocate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createContact.isPending}>
              {createContact.isPending ? 'Creating...' : 'Create Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
