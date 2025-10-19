import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Edit2, Check, X, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface FAQManagerProps {
  chatbotId: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order_index: number;
}

export function FAQManager({ chatbotId }: FAQManagerProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [editForm, setEditForm] = useState({ question: '', answer: '' });

  // Fetch FAQs
  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['chatbot-faqs', chatbotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chatbot_faqs')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as FAQ[];
    },
  });

  // Create FAQ
  const createMutation = useMutation({
    mutationFn: async (faq: { question: string; answer: string }) => {
      const { data, error } = await supabase
        .from('chatbot_faqs')
        .insert({
          chatbot_id: chatbotId,
          question: faq.question,
          answer: faq.answer,
          order_index: faqs.length,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-faqs', chatbotId] });
      setNewFaq({ question: '', answer: '' });
      toast.success('FAQ added successfully');
    },
    onError: () => {
      toast.error('Failed to add FAQ');
    },
  });

  // Update FAQ
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FAQ> }) => {
      const { data, error } = await supabase
        .from('chatbot_faqs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-faqs', chatbotId] });
      setEditingId(null);
      toast.success('FAQ updated successfully');
    },
    onError: () => {
      toast.error('Failed to update FAQ');
    },
  });

  // Delete FAQ
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('chatbot_faqs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-faqs', chatbotId] });
      toast.success('FAQ deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete FAQ');
    },
  });

  const handleCreate = () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      toast.error('Please fill in both question and answer');
      return;
    }
    createMutation.mutate(newFaq);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setEditForm({ question: faq.question, answer: faq.answer });
  };

  const handleUpdate = (id: string) => {
    if (!editForm.question.trim() || !editForm.answer.trim()) {
      toast.error('Please fill in both question and answer');
      return;
    }
    updateMutation.mutate({ id, updates: editForm });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this FAQ?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add New FAQ
          </CardTitle>
          <CardDescription>
            Create frequently asked questions to help visitors quickly find answers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new_question">Question</Label>
            <Input
              id="new_question"
              placeholder="What are your hours of operation?"
              value={newFaq.question}
              onChange={(e) => setNewFaq(prev => ({ ...prev, question: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_answer">Answer</Label>
            <Textarea
              id="new_answer"
              placeholder="We are open Monday through Friday, 9 AM to 5 PM..."
              value={newFaq.answer}
              onChange={(e) => setNewFaq(prev => ({ ...prev, answer: e.target.value }))}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleCreate}
            disabled={createMutation.isPending || !newFaq.question || !newFaq.answer}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Add FAQ
          </Button>
        </CardContent>
      </Card>

      {/* FAQ List */}
      <Card>
        <CardHeader>
          <CardTitle>Existing FAQs ({faqs.length})</CardTitle>
          <CardDescription>
            Manage your frequently asked questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {faqs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No FAQs yet. Add your first FAQ above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={faq.id}>
                  {index > 0 && <Separator className="my-4" />}
                  
                  {editingId === faq.id ? (
                    // Edit Mode
                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-2">
                        <Label>Question</Label>
                        <Input
                          value={editForm.question}
                          onChange={(e) => setEditForm(prev => ({ ...prev, question: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Answer</Label>
                        <Textarea
                          value={editForm.answer}
                          onChange={(e) => setEditForm(prev => ({ ...prev, answer: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(faq.id)}
                          disabled={updateMutation.isPending}
                          className="gap-2"
                        >
                          <Check className="h-4 w-4" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex gap-4">
                      <div className="flex items-start pt-2">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="font-medium text-foreground">{faq.question}</h4>
                        <p className="text-sm text-muted-foreground">{faq.answer}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(faq)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(faq.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
