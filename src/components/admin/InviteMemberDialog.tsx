import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInvitations } from '@/hooks/useInvitations';
import { Mail } from 'lucide-react';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  currentMemberCount: number;
}

export function InviteMemberDialog({ open, onOpenChange, organizationId, currentMemberCount }: InviteMemberDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const { sendInvitation } = useInvitations(organizationId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) return;

    try {
      await sendInvitation.mutateAsync({ email: email.trim(), role });
      setEmail('');
      setRole('viewer');
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const atLimit = currentMemberCount >= 5;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            {atLimit 
              ? 'You have reached the maximum of 5 team members for your organization.'
              : `Invite someone to join your organization. (${currentMemberCount}/5 slots used)`
            }
          </DialogDescription>
        </DialogHeader>

        {!atLimit && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={sendInvitation.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value: any) => setRole(value)} disabled={sendInvitation.isPending}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex flex-col">
                      <span className="font-medium">Admin</span>
                      <span className="text-xs text-muted-foreground">Full access including platform admin features</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex flex-col">
                      <span className="font-medium">Team Member</span>
                      <span className="text-xs text-muted-foreground">Access to all features except platform admin</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={sendInvitation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={sendInvitation.isPending}>
                <Mail className="h-4 w-4 mr-2" />
                {sendInvitation.isPending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
