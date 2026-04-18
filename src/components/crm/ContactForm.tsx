import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { useCrm, CrmContact } from '@/hooks/useCrm';

interface ContactFormProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  contact?: CrmContact | null; // edit mode if provided
}

export function ContactForm({ open, onClose, organizationId, contact }: ContactFormProps) {
  const { createContact, updateContact } = useCrm(organizationId);
  const isEdit = !!contact;
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

  useEffect(() => {
    if (contact) {
      setFormData({
        contact_type: contact.contact_type,
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        organization_name: contact.organization_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        source: contact.source || 'manual',
        lifecycle_stage: contact.lifecycle_stage,
      });
    } else {
      setFormData({
        contact_type: 'individual', first_name: '', last_name: '',
        organization_name: '', email: '', phone: '', source: 'manual', lifecycle_stage: 'lead',
      });
    }
  }, [contact, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && contact) {
      await updateContact.mutateAsync({ id: contact.id, updates: formData });
    } else {
      await createContact.mutateAsync(formData);
    }
    onClose();
  };

  const pending = createContact.isPending || updateContact.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="contact_type">Contact Type</Label>
            <Select
              value={formData.contact_type}
              onValueChange={(value: any) => setFormData({ ...formData, contact_type: value })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Input id="first_name" value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required maxLength={100} />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input id="last_name" value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required maxLength={100} />
              </div>
            </>
          ) : (
            <div>
              <Label htmlFor="organization_name">Organization Name</Label>
              <Input id="organization_name" value={formData.organization_name}
                onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })} required maxLength={200} />
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} required maxLength={255} />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })} maxLength={50} />
          </div>

          <div>
            <Label htmlFor="lifecycle_stage">Lifecycle Stage</Label>
            <Select value={formData.lifecycle_stage}
              onValueChange={(value: any) => setFormData({ ...formData, lifecycle_stage: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="volunteer">Volunteer</SelectItem>
                <SelectItem value="donor">Donor</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="advocate">Advocate</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
