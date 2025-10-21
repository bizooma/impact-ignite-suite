import { useState } from 'react';
import { useFlipbooks, useFlipbookEmbeds } from '@/hooks/useFlipbooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, Trash2, Edit, Eye, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FlipbookViewer } from '@/components/flipbook/FlipbookViewer';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFPageProxy } from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const FlipbookManager = () => {
  const { flipbooks, isLoading, uploadPDF, createFlipbook, deleteFlipbook, updateFlipbook } = useFlipbooks();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [editingFlipbook, setEditingFlipbook] = useState<any>(null);
  const [viewingFlipbook, setViewingFlipbook] = useState<any>(null);
  const [selectedFlipbookForEmbed, setSelectedFlipbookForEmbed] = useState<string | null>(null);
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);

  const { data: organizations } = useQuery({
    queryKey: ['all-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { assignFlipbook, unassignFlipbook } = useFlipbookEmbeds();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      toast.error('Please select a valid PDF file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title) {
      toast.error('Please provide a title and select a PDF file');
      return;
    }

    setIsUploading(true);
    setUploadProgress('Processing PDF...');
    
    try {
      // Extract PDF metadata
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pageCount = pdf.numPages;
      
      setUploadProgress(`Generating thumbnail from ${pageCount} pages...`);
      
      // Generate thumbnail from first page
      let thumbnailUrl: string | undefined;
      try {
        const page: PDFPageProxy = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas,
          }).promise;

          // Convert canvas to blob and upload
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
          });
          
          const thumbnailFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
          const thumbPath = `thumbnails/${Math.random().toString(36).substring(2)}.jpg`;
          
          const { error: thumbError } = await supabase.storage
            .from('flipbooks')
            .upload(thumbPath, thumbnailFile);

          if (!thumbError) {
            const { data: { publicUrl } } = supabase.storage
              .from('flipbooks')
              .getPublicUrl(thumbPath);
            thumbnailUrl = publicUrl;
          }
        }
      } catch (thumbError) {
        console.error('Failed to generate thumbnail:', thumbError);
        // Continue without thumbnail
      }

      setUploadProgress('Uploading PDF...');
      const uploadResult = await uploadPDF.mutateAsync(selectedFile);
      
      setUploadProgress('Creating flipbook...');
      await createFlipbook.mutateAsync({
        title,
        description,
        pdf_url: uploadResult.publicUrl,
        file_size: selectedFile.size,
        page_count: pageCount,
        thumbnail_url: thumbnailUrl,
      });

      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setUploadProgress('');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to process PDF. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this flipbook?')) {
      await deleteFlipbook.mutateAsync(id);
    }
  };

  const handleToggleActive = async (flipbook: any) => {
    await updateFlipbook.mutateAsync({
      id: flipbook.id,
      is_active: !flipbook.is_active,
    });
  };

  const handleAssignToOrgs = async () => {
    if (!selectedFlipbookForEmbed || selectedOrgs.length === 0) {
      toast.error('Please select organizations');
      return;
    }

    await assignFlipbook.mutateAsync({
      flipbookId: selectedFlipbookForEmbed,
      organizationIds: selectedOrgs,
    });

    setSelectedFlipbookForEmbed(null);
    setSelectedOrgs([]);
  };

  if (isLoading) {
    return <div>Loading flipbooks...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload New Flipbook</CardTitle>
          <CardDescription>Upload a PDF to create a new flipbook</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter flipbook title"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description (optional)"
            />
          </div>
          <div>
            <Label htmlFor="pdf">PDF File</Label>
            <Input
              id="pdf"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
            />
          </div>
          {uploadProgress && (
            <p className="text-sm text-muted-foreground">{uploadProgress}</p>
          )}
          <Button onClick={handleUpload} disabled={isUploading || !selectedFile || !title}>
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? uploadProgress || 'Uploading...' : 'Upload Flipbook'}
          </Button>
        </CardContent>
      </Card>

      {/* Flipbooks List */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Flipbooks</CardTitle>
          <CardDescription>View and manage all flipbooks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {flipbooks?.map((flipbook) => (
              <Card key={flipbook.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <BookOpen className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">{flipbook.title}</h3>
                      <p className="text-sm text-muted-foreground">{flipbook.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={flipbook.is_active ? 'default' : 'secondary'}>
                          {flipbook.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setViewingFlipbook(flipbook)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleToggleActive(flipbook)}
                    >
                      {flipbook.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setSelectedFlipbookForEmbed(flipbook.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign to Organizations</DialogTitle>
                          <DialogDescription>
                            Select which organizations can view this flipbook
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Select
                            onValueChange={(value) => {
                              if (!selectedOrgs.includes(value)) {
                                setSelectedOrgs([...selectedOrgs, value]);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select organizations" />
                            </SelectTrigger>
                            <SelectContent>
                              {organizations?.map((org) => (
                                <SelectItem key={org.id} value={org.id}>
                                  {org.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex flex-wrap gap-2">
                            {selectedOrgs.map((orgId) => {
                              const org = organizations?.find((o) => o.id === orgId);
                              return (
                                <Badge key={orgId} variant="secondary">
                                  {org?.name}
                                  <button
                                    onClick={() => setSelectedOrgs(selectedOrgs.filter((id) => id !== orgId))}
                                    className="ml-2"
                                  >
                                    ×
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                          <Button onClick={handleAssignToOrgs}>Assign</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(flipbook.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Viewer Dialog */}
      {viewingFlipbook && (
        <Dialog open={!!viewingFlipbook} onOpenChange={() => setViewingFlipbook(null)}>
          <DialogContent className="max-w-[95vw] h-[95vh]">
            <FlipbookViewer
              pdfUrl={viewingFlipbook.pdf_url}
              title={viewingFlipbook.title}
              onClose={() => setViewingFlipbook(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
