import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone } from 'lucide-react';
import { CrmList } from '@/hooks/useCrm';

interface ListMembersDialogProps {
  list: CrmList | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

interface ListMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  organization_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  lifecycle_stage: string;
  contact_type: string;
}

export function ListMembersDialog({
  list,
  open,
  onOpenChange,
  organizationId,
}: ListMembersDialogProps) {
  const [members, setMembers] = useState<ListMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && list) {
      fetchMembers();
    }
  }, [open, list]);

  const fetchMembers = async () => {
    if (!list) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crm_list_memberships')
        .select(`
          contact_id,
          crm_contacts (
            id,
            first_name,
            last_name,
            organization_name,
            email,
            phone,
            avatar_url,
            lifecycle_stage,
            contact_type
          )
        `)
        .eq('list_id', list.id);

      if (error) throw error;

      const contacts = data
        ?.map((m: any) => m.crm_contacts)
        .filter(Boolean) || [];
      
      setMembers(contacts);
    } catch (error) {
      console.error('Error fetching list members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (member: ListMember) => {
    if (member.contact_type === 'organization') {
      return member.organization_name?.charAt(0).toUpperCase() || 'O';
    }
    const first = member.first_name?.charAt(0) || '';
    const last = member.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || 'C';
  };

  const getDisplayName = (member: ListMember) => {
    if (member.contact_type === 'organization') {
      return member.organization_name || 'Unnamed Organization';
    }
    return `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unnamed Contact';
  };

  const getLifecycleColor = (stage: string) => {
    const colors: Record<string, string> = {
      lead: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      prospect: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      volunteer: 'bg-green-500/10 text-green-600 dark:text-green-400',
      donor: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      advocate: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      inactive: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
    };
    return colors[stage] || colors.lead;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {list?.name} ({list?.contact_count || 0} contacts)
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No contacts in this list</div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar_url || ''} />
                    <AvatarFallback>{getInitials(member)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{getDisplayName(member)}</h4>
                      <Badge
                        variant="secondary"
                        className={getLifecycleColor(member.lifecycle_stage)}
                      >
                        {member.lifecycle_stage}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      {member.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      )}
                      {member.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
