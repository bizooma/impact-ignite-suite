import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users } from 'lucide-react';
import { CrmList } from '@/hooks/useCrm';
import { ListMembersDialog } from './ListMembersDialog';
import { ListFormDialog } from './ListFormDialog';

interface ListsManagerProps {
  lists: CrmList[];
  loading: boolean;
  organizationId: string;
}

export function ListsManager({ lists, loading, organizationId }: ListsManagerProps) {
  const [selectedList, setSelectedList] = useState<CrmList | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  if (loading) {
    return <div className="text-center p-8">Loading lists...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Contact Lists</h2>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create List
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {lists.length === 0 ? (
          <Card className="col-span-3">
            <CardContent className="pt-6 text-center text-muted-foreground">
              No lists found. Create your first list to organize contacts.
            </CardContent>
          </Card>
        ) : (
          lists.map((list) => (
            <Card 
              key={list.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedList(list)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{list.name}</CardTitle>
                  <Badge 
                    variant={list.list_type === 'dynamic' ? 'default' : 'secondary'}
                  >
                    {list.list_type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {list.description || 'No description'}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{list.contact_count || 0} contacts</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ListMembersDialog
        list={selectedList}
        open={!!selectedList}
        onOpenChange={(open) => !open && setSelectedList(null)}
        organizationId={organizationId}
      />

      <ListFormDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        organizationId={organizationId}
      />
    </div>
  );
}
