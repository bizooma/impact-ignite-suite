import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCrm, CrmContact } from '@/hooks/useCrm';

interface Props {
  contact: CrmContact | null;
  open: boolean;
  onClose: () => void;
  organizationId: string;
}

export function DeleteContactDialog({ contact, open, onClose, organizationId }: Props) {
  const { deleteContact } = useCrm(organizationId);
  const handleDelete = async () => {
    if (!contact) return;
    await deleteContact.mutateAsync(contact.id);
    onClose();
  };
  const name = contact?.contact_type === 'organization'
    ? contact?.organization_name
    : `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim();

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete contact?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{name}</strong> and all associated donations,
            notes, interactions, and volunteer hours. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
