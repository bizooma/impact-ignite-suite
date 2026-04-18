import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useCrm } from '@/hooks/useCrm';

interface Props {
  open: boolean;
  onClose: () => void;
  organizationId: string;
}

export function ListFormDialog({ open, onClose, organizationId }: Props) {
  const { createList } = useCrm(organizationId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createList.mutateAsync({ name, description, color, list_type: 'static' });
    setName(''); setDescription(''); setColor('#3b82f6');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create List</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
          </div>
          <div>
            <Label>Color</Label>
            <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createList.isPending}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
