import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMobileAppData } from '@/hooks/useMobileAppData';
import { Edit, Trash2, Plus, Download } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MobileAppDataTableProps {
  organizationId: string;
  tableName: string;
  data: any[];
  onRefresh: () => void;
}

export function MobileAppDataTable({ organizationId, tableName, data, onRefresh }: MobileAppDataTableProps) {
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  const { updateData, deleteData, insertData, isExecuting } = useMobileAppData(organizationId);

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  const handleEdit = (row: any) => {
    setSelectedRow(row);
    setFormData(row);
    setEditDialog(true);
  };

  const handleDelete = (row: any) => {
    setSelectedRow(row);
    setDeleteDialog(true);
  };

  const handleAdd = () => {
    const emptyForm = columns.reduce((acc, col) => ({ ...acc, [col]: '' }), {});
    setFormData(emptyForm);
    setAddDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      const idField = columns.find(col => col === 'id') || columns[0];
      await updateData(tableName, formData, { [idField]: selectedRow[idField] });
      setEditDialog(false);
      onRefresh();
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const idField = columns.find(col => col === 'id') || columns[0];
      await deleteData(tableName, { [idField]: selectedRow[idField] });
      setDeleteDialog(false);
      onRefresh();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleSaveAdd = async () => {
    try {
      await insertData(tableName, formData);
      setAddDialog(false);
      onRefresh();
    } catch (error) {
      console.error('Insert failed:', error);
    }
  };

  const handleExport = () => {
    const csv = [
      columns.join(','),
      ...data.map(row => columns.map(col => JSON.stringify(row[col] || '')).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}_${new Date().toISOString()}.csv`;
    a.click();
    
    toast.success('Data exported successfully');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Table: {tableName}</CardTitle>
              <CardDescription>{data.length} records</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button size="sm" onClick={handleAdd} className="bg-[#003D7A] hover:bg-[#002a54] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Row
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col} className="font-medium">
                      {col}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, idx) => (
                  <TableRow key={idx}>
                    {columns.map((col) => (
                      <TableCell key={col} className="max-w-xs truncate">
                        {typeof row[col] === 'object' 
                          ? JSON.stringify(row[col]) 
                          : String(row[col] ?? '')}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(row)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(row)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Row</DialogTitle>
            <DialogDescription>Update the values for this record</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {columns.map((col) => (
              <div key={col} className="grid gap-2">
                <Label htmlFor={col}>{col}</Label>
                <Input
                  id={col}
                  value={typeof formData[col] === 'object' 
                    ? JSON.stringify(formData[col]) 
                    : formData[col] || ''}
                  onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isExecuting}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Row</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isExecuting}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Row</DialogTitle>
            <DialogDescription>Enter values for the new record</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {columns.map((col) => (
              <div key={col} className="grid gap-2">
                <Label htmlFor={col}>{col}</Label>
                <Input
                  id={col}
                  value={formData[col] || ''}
                  onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                  placeholder={col === 'id' ? 'Leave empty for auto-generate' : ''}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAdd} disabled={isExecuting}>
              Add Row
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
