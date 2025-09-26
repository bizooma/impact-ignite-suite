import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContentTemplates } from '@/hooks/useContentTemplates';
import { FileText, Plus, Copy, Edit, Trash2, Globe, Lock } from 'lucide-react';

interface ContentTemplatesDashboardProps {
  organizationId: string;
}

const ContentTemplatesDashboard: React.FC<ContentTemplatesDashboardProps> = ({ organizationId }) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    template_data: {},
    is_public: false,
  });

  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = useContentTemplates(organizationId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const templateData = {
        ...formData,
        organization_id: organizationId,
        template_data: typeof formData.template_data === 'string' 
          ? JSON.parse(formData.template_data) 
          : formData.template_data,
      };

      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, templateData);
        setEditingTemplate(null);
      } else {
        await createTemplate(templateData);
        setShowCreateDialog(false);
      }

      setFormData({ name: '', category: '', template_data: {}, is_public: false });
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category || '',
      template_data: JSON.stringify(template.template_data, null, 2),
      is_public: template.is_public,
    });
  };

  const copyTemplate = async (template: any) => {
    try {
      await createTemplate({
        ...template,
        name: `${template.name} (Copy)`,
        organization_id: organizationId,
      });
    } catch (error) {
      console.error('Error copying template:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted animate-pulse rounded" />
                  <div className="h-3 bg-muted animate-pulse rounded w-4/5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Content Templates</h2>
          <p className="text-muted-foreground">
            Create and manage reusable content templates
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Content Template</DialogTitle>
              <DialogDescription>
                Create a reusable content template for your team
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Social media post template"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social_media">Social Media</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="blog">Blog</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template_data">Template Data (JSON)</Label>
                <Textarea
                  id="template_data"
                  value={typeof formData.template_data === 'string' ? formData.template_data : JSON.stringify(formData.template_data, null, 2)}
                  onChange={(e) => setFormData({ ...formData, template_data: e.target.value })}
                  placeholder='{"title": "{{title}}", "content": "{{content}}"}'
                  className="min-h-[200px] font-mono"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_public">Make this template public</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Template
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  {template.is_public ? (
                    <Globe className="h-4 w-4 text-success" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  {template.category && (
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription>
                Created {new Date(template.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                {JSON.stringify(template.template_data, null, 2)}
              </pre>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => copyTemplate(template)}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(template)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => deleteTemplate(template.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No content templates yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first content template to streamline your content creation
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Content Template</DialogTitle>
            <DialogDescription>
              Update your content template
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Template Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-template_data">Template Data (JSON)</Label>
              <Textarea
                id="edit-template_data"
                value={typeof formData.template_data === 'string' ? formData.template_data : JSON.stringify(formData.template_data, null, 2)}
                onChange={(e) => setFormData({ ...formData, template_data: e.target.value })}
                className="min-h-[200px] font-mono"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-is_public"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="edit-is_public">Make this template public</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setEditingTemplate(null)}>
                Cancel
              </Button>
              <Button type="submit">
                Update Template
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentTemplatesDashboard;