import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCrm, CrmContact } from '@/hooks/useCrm';
import { Check } from 'lucide-react';

interface Props {
  contact: CrmContact | null;
  open: boolean;
  onClose: () => void;
  organizationId: string;
}

export function AddToListDialog({ contact, open, onClose, organizationId }: Props) {
  const { lists, addContactToList } = useCrm(organizationId);

  const handleAdd = async (listId: string) => {
    if (!contact) return;
    await addContactToList.mutateAsync({ listId, contactId: contact.id });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add to list</DialogTitle></DialogHeader>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {!lists || lists.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No lists yet. Create one first.</p>
          ) : (
            lists.filter(l => l.list_type === 'static').map((list) => (
              <Button
                key={list.id}
                variant="outline"
                className="w-full justify-between"
                onClick={() => handleAdd(list.id)}
                disabled={addContactToList.isPending}
              >
                <span>{list.name}</span>
                <Check className="h-4 w-4 opacity-0" />
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
