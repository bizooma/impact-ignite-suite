import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Globe, 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Plus
} from 'lucide-react';
import { useKnowledgeSources } from '@/hooks/useChatbots';
import type { Chatbot } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface KnowledgeUploadProps {
  chatbot: Chatbot;
}

export function KnowledgeUpload({ chatbot }: KnowledgeUploadProps) {
  const { knowledgeSources, addKnowledgeSource, deleteKnowledgeSource, fetchKnowledgeSources } = useKnowledgeSources(chatbot.id);
  const [activeTab, setActiveTab] = useState<'text' | 'file' | 'url'>('text');
  const [isUploading, setIsUploading] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [nameContent, setNameContent] = useState('');

  const handleAddTextSource = async () => {
    if (!textContent.trim() || !nameContent.trim()) return;
    
    setIsUploading(true);
    await addKnowledgeSource({
      type: 'text',
      name: nameContent,
      content: textContent,
      status: 'completed',
      metadata: {},
    });
    
    setTextContent('');
    setNameContent('');
    setIsUploading(false);
  };

  const handleAddUrlSource = async () => {
    if (!urlContent.trim() || !nameContent.trim()) return;
    
    setIsUploading(true);
    
    const newSource = await addKnowledgeSource({
      type: 'url',
      name: nameContent,
      file_url: urlContent,
      status: 'pending',
      metadata: {},
    });
    
    if (newSource) {
      try {
        const { error } = await supabase.functions.invoke('process-knowledge', {
          body: {
            knowledgeSourceId: newSource.id,
            type: 'url',
            content: urlContent,
            name: nameContent
          }
        });
        
        if (error) {
          console.error('Error processing knowledge source:', error);
          toast.error('URL added but processing failed. Please try re-adding it.');
        } else {
          toast.success('URL is being processed. This may take a minute...');
        }
      } catch (error) {
        console.error('Error invoking process-knowledge:', error);
        toast.error('Failed to start processing');
      }
    }
    
    setUrlContent('');
    setNameContent('');
    setIsUploading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'processing':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'error':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Knowledge Base
          </CardTitle>
          <CardDescription>
            Upload content to train your chatbot. The more relevant information you provide, 
            the better your chatbot will be at helping your supporters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Button
              variant={activeTab === 'text' ? 'default' : 'outline'}
              onClick={() => setActiveTab('text')}
              className="justify-start gap-2"
            >
              <FileText className="h-4 w-4" />
              Add Text
            </Button>
            <Button
              variant={activeTab === 'file' ? 'default' : 'outline'}
              onClick={() => setActiveTab('file')}
              className="justify-start gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Files
            </Button>
            <Button
              variant={activeTab === 'url' ? 'default' : 'outline'}
              onClick={() => setActiveTab('url')}
              className="justify-start gap-2"
            >
              <Globe className="h-4 w-4" />
              Import URL
            </Button>
          </div>

          {/* Text Content Tab */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-name">Content Name</Label>
                <Input
                  id="text-name"
                  placeholder="e.g., About Us, Volunteer Guidelines, Donation Information"
                  value={nameContent}
                  onChange={(e) => setNameContent(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="text-content">Content</Label>
                <Textarea
                  id="text-content"
                  placeholder="Paste your content here. This could be information about your mission, programs, how to volunteer, donation processes, or any other information supporters might need..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={8}
                />
              </div>
              <Button 
                onClick={handleAddTextSource}
                disabled={!textContent.trim() || !nameContent.trim() || isUploading}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {isUploading ? 'Adding...' : 'Add Content'}
              </Button>
            </div>
          )}

          {/* File Upload Tab */}
          {activeTab === 'file' && (
            <FileUploadSection chatbotId={chatbot.id} onUploaded={fetchKnowledgeSources} />
          )}

          {/* URL Import Tab */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url-name">Source Name</Label>
                <Input
                  id="url-name"
                  placeholder="e.g., Website Homepage, Blog Post, FAQ Page"
                  value={nameContent}
                  onChange={(e) => setNameContent(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url-content">Website URL</Label>
                <Input
                  id="url-content"
                  type="url"
                  placeholder="https://example.org/about"
                  value={urlContent}
                  onChange={(e) => setUrlContent(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleAddUrlSource}
                disabled={!urlContent.trim() || !nameContent.trim() || isUploading}
                className="gap-2"
              >
                <Globe className="h-4 w-4" />
                {isUploading ? 'Importing...' : 'Import URL'}
              </Button>
              <p className="text-sm text-muted-foreground">
                We'll crawl the webpage and extract the main content for your chatbot to learn from.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Knowledge Sources List */}
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Sources ({knowledgeSources.length})</CardTitle>
          <CardDescription>
            Content that your chatbot has learned from
          </CardDescription>
        </CardHeader>
        <CardContent>
          {knowledgeSources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No knowledge sources added yet</p>
              <p className="text-sm">Add some content above to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {knowledgeSources.map((source) => (
                <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {source.type === 'text' && <FileText className="h-4 w-4 text-primary" />}
                      {source.type === 'url' && <Globe className="h-4 w-4 text-primary" />}
                      {source.type === 'pdf' && <FileText className="h-4 w-4 text-primary" />}
                      {getStatusIcon(source.status)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{source.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {source.type === 'text' && `${source.content?.length || 0} characters`}
                        {source.type === 'url' && source.file_url}
                        {source.type === 'pdf' && 'PDF Document'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(source.status)}>
                      {source.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteKnowledgeSource(source.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface FileUploadSectionProps {
  chatbotId: string;
  onUploaded: () => void;
}

function FileUploadSection({ chatbotId, onUploaded }: FileUploadSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File is larger than 20MB');
      return;
    }

    const lower = file.name.toLowerCase();
    const isPdf = lower.endsWith('.pdf') || file.type === 'application/pdf';
    const isDocx = lower.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const isText = /\.(txt|md|markdown|csv)$/i.test(file.name) || file.type.startsWith('text/');

    if (!isPdf && !isDocx && !isText) {
      toast.error('Supported formats: PDF, DOCX, TXT, MD, CSV');
      return;
    }

    setIsUploading(true);
    setFileName(file.name);

    try {
      // Upload to storage (required for PDF/DOCX so the edge function can fetch bytes)
      const path = `${chatbotId}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('knowledge-sources')
        .upload(path, file, { upsert: false });
      if (uploadErr) throw uploadErr;

      // Read text content for plain-text files; PDF/DOCX get parsed server-side
      const textContent = isText ? await file.text() : null;
      const sourceType = isPdf ? 'pdf' : isDocx ? 'docx' : 'text';

      const { data: inserted, error: insertErr } = await supabase
        .from('knowledge_sources')
        .insert({
          chatbot_id: chatbotId,
          type: sourceType,
          name: file.name,
          content: textContent,
          file_path: path,
          status: 'pending',
          metadata: { size: file.size, mime: file.type },
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      const { error: procErr } = await supabase.functions.invoke('process-knowledge', {
        body: {
          knowledgeSourceId: inserted.id,
          type: sourceType,
          content: textContent,
          filePath: path,
          name: file.name,
        },
      });

      if (procErr) {
        console.error('Processing error:', procErr);
        toast.error('File uploaded but processing failed.');
      } else {
        toast.success(
          isPdf || isDocx
            ? `${isPdf ? 'PDF' : 'DOCX'} uploaded — parsing in the background.`
            : 'File uploaded and processed.'
        );
      }

      onUploaded();
    } catch (e) {
      console.error('Upload error:', e);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      setFileName(null);
    }
  };

  return (
    <div className="space-y-4">
      <label
        htmlFor="kb-file-input"
        className="border-2 border-dashed border-muted hover:border-primary/50 transition-colors rounded-lg p-8 text-center cursor-pointer block"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">
          {isUploading ? `Uploading ${fileName}...` : 'Drag and drop a file here'}
        </p>
        <p className="text-muted-foreground mb-4">
          Supports PDF, DOCX, TXT, MD, and CSV files up to 20MB
        </p>
        <Button type="button" variant="outline" disabled={isUploading} asChild>
          <span>{isUploading ? 'Processing...' : 'Choose File'}</span>
        </Button>
        <input
          id="kb-file-input"
          type="file"
          accept=".txt,.md,.markdown,.csv,.pdf,.docx,text/plain,text/markdown,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          disabled={isUploading}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>
    </div>
  );
}
