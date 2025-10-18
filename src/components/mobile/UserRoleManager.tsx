import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMobileAppData } from '@/hooks/useMobileAppData';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, Plus } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = [
  'resident',
  'houseParent',
  'clsStaff',
  'successCoach',
  'teacher',
  'caseworker',
  'counselor',
  'staff',
  'admin',
] as const;

interface UserRoleManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  organizationId: string;
  onSuccess: () => void;
}

export function UserRoleManager({ 
  open, 
  onOpenChange, 
  user, 
  organizationId,
  onSuccess 
}: UserRoleManagerProps) {
  const { updateData, insertData, isExecuting } = useMobileAppData(organizationId);
  const [selectedRole, setSelectedRole] = useState<string>(user.role);

  const handleRoleChange = async () => {
    if (selectedRole === user.role) {
      toast.info('No changes made');
      return;
    }

    try {
      // Update user's role
      await updateData('users', { role: selectedRole }, { id: user.id });
      
      // Insert role change record for audit trail
      await insertData('user_roles', {
        user_id: user.id,
        role: selectedRole,
        granted_by: null, // Set by the proxy/backend based on current user
        granted_at: new Date().toISOString(),
      });

      toast.success('Role updated successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Role: {user.full_name}
          </DialogTitle>
          <DialogDescription>
            Change the user's role. This will affect their permissions in the mobile app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Role</label>
            <Badge variant="default" className="text-sm">
              {user.role}
            </Badge>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">New Role</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-2">Role Descriptions:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li><strong>admin</strong>: Full access to all features</li>
              <li><strong>staff</strong>: General staff member access</li>
              <li><strong>resident</strong>: Basic user access</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleRoleChange}
            disabled={isExecuting || selectedRole === user.role}
          >
            Update Role
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
