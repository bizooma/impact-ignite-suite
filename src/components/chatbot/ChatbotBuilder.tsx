import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Bot, Upload, Settings, MessageSquare, BarChart3, Plus, ChevronDown, Video, Heart, Phone, HelpCircle, TrendingUp, Sparkles } from 'lucide-react';
import { useChatbots, useKnowledgeSources } from '@/hooks/useChatbots';
import { KnowledgeUpload } from './KnowledgeUpload';
import { ChatbotPreview } from './ChatbotPreview';
import { ChatbotSettings } from './ChatbotSettings';
import { ChatbotAnalytics } from './ChatbotAnalytics';
import { FAQManager } from './FAQManager';
import type { Chatbot } from '@/types/database';

interface ChatbotBuilderProps {
  organizationId: string;
}

export function ChatbotBuilder({ organizationId }: ChatbotBuilderProps) {
  const { chatbots, loading, createChatbot, updateChatbot } = useChatbots(organizationId);
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    welcome_message: '',
    tone: '',
    primary_color: '#0066CC',
    accent_color: '#00AA44',
  });

  const handleCreateChatbot = async () => {
    setIsCreating(true);
    const chatbot = await createChatbot({
      name: formData.name,
      description: formData.description,
      brand_settings: {
        welcome_message: formData.welcome_message,
        tone: formData.tone,
        primary_color: formData.primary_color,
        accent_color: formData.accent_color,
      },
      web_widget_config: {
        position: 'bottom-right',
        size: 'compact',
        theme: 'light',
        show_branding: true,
      },
      status: 'draft',
    });
    
    if (chatbot) {
      setSelectedChatbot(chatbot);
      setFormData({
        name: '',
        description: '',
        welcome_message: '',
        tone: '',
        primary_color: '#0066CC',
        accent_color: '#00AA44',
      });
    }
    setIsCreating(false);
  };

  const handleUpdateChatbot = async (updates: Partial<Chatbot>) => {
    if (!selectedChatbot) return;
    
    const updated = await updateChatbot(selectedChatbot.id, updates);
    if (updated) {
      setSelectedChatbot(updated);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chatbot Builder</h1>
          <p className="text-muted-foreground mt-2">
            Create AI-powered chatbots to engage with your supporters and capture leads
          </p>
        </div>
        <Button onClick={() => setSelectedChatbot(null)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Chatbot
        </Button>
      </div>

      {!selectedChatbot ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create New Chatbot */}
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="text-center">
              <Bot className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Create Your First Chatbot</CardTitle>
              <CardDescription>
                Build an AI assistant that understands your organization's mission and can help supporters find information, volunteer opportunities, and ways to donate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Chatbot Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Hope Helper, Mission Assistant"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what your chatbot will help with..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcome_message">Welcome Message</Label>
                <Textarea
                  id="welcome_message"
                  placeholder="Hi! I'm here to help you learn about our mission and find ways to get involved. How can I assist you today?"
                  value={formData.welcome_message}
                  onChange={(e) => setFormData(prev => ({ ...prev, welcome_message: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Conversation Tone</Label>
                <Input
                  id="tone"
                  placeholder="e.g., Warm, compassionate, professional"
                  value={formData.tone}
                  onChange={(e) => setFormData(prev => ({ ...prev, tone: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <Input
                    id="primary_color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accent_color">Accent Color</Label>
                  <Input
                    id="accent_color"
                    type="color"
                    value={formData.accent_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, accent_color: e.target.value }))}
                  />
                </div>
              </div>

              <Separator className="my-6" />

              <Collapsible open={showFeatures} onOpenChange={setShowFeatures}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between group hover:bg-primary/5">
                    <span className="flex items-center gap-2 text-base font-semibold">
                      <Sparkles className="h-5 w-5 text-primary" />
                      What can I configure after creation?
                    </span>
                    <ChevronDown className={`h-5 w-5 transition-transform ${showFeatures ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex gap-3 p-3 rounded-lg bg-accent/50 border border-border/50">
                      <Video className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">Video Launcher</h4>
                        <p className="text-xs text-muted-foreground">Add a video preview to your chatbot launcher (YouTube, Vimeo, or direct upload)</p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-3 rounded-lg bg-accent/50 border border-border/50">
                      <Heart className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">Donation Buttons</h4>
                        <p className="text-xs text-muted-foreground">Configure up to 2 donation buttons with custom labels and URLs</p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-3 rounded-lg bg-accent/50 border border-border/50">
                      <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">Contact Integration</h4>
                        <p className="text-xs text-muted-foreground">Add email and phone contact buttons for supporters to reach you</p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-3 rounded-lg bg-accent/50 border border-border/50">
                      <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">FAQ Management</h4>
                        <p className="text-xs text-muted-foreground">Create and manage frequently asked questions for quick supporter access</p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-3 rounded-lg bg-accent/50 border border-border/50">
                      <MessageSquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">Volunteer Form</h4>
                        <p className="text-xs text-muted-foreground">Capture volunteer interest with integrated signup forms and day preferences</p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-3 rounded-lg bg-accent/50 border border-border/50">
                      <TrendingUp className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">Analytics Dashboard</h4>
                        <p className="text-xs text-muted-foreground">Track conversations, volunteer submissions, donations, and user engagement</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground text-center">
                      💡 All these features will be available in the <strong>Settings</strong> and <strong>Knowledge</strong> tabs after you create your chatbot
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Button 
                onClick={handleCreateChatbot}
                disabled={!formData.name || isCreating}
                className="w-full mt-4"
              >
                {isCreating ? 'Creating...' : 'Create Chatbot'}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Chatbots */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Your Chatbots</h3>
            {chatbots.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No chatbots created yet</p>
                <p className="text-sm">Create your first chatbot to get started</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {chatbots.map((chatbot) => (
                  <Card key={chatbot.id} className="hover:bg-accent cursor-pointer transition-colors">
                    <CardContent className="p-4" onClick={() => setSelectedChatbot(chatbot)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{chatbot.name}</h4>
                            <p className="text-sm text-muted-foreground">{chatbot.description}</p>
                          </div>
                        </div>
                        <Badge variant={chatbot.status === 'active' ? 'success' : 'secondary'}>
                          {chatbot.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <ChatbotStudio 
          chatbot={selectedChatbot} 
          onUpdate={handleUpdateChatbot}
          onBack={() => setSelectedChatbot(null)}
        />
      )}
    </div>
  );
}

interface ChatbotStudioProps {
  chatbot: Chatbot;
  onUpdate: (updates: Partial<Chatbot>) => void;
  onBack: () => void;
}

function ChatbotStudio({ chatbot, onUpdate, onBack }: ChatbotStudioProps) {
  const { knowledgeSources } = useKnowledgeSources(chatbot.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            ← Back to Chatbots
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{chatbot.name}</h2>
            <p className="text-muted-foreground">{chatbot.description}</p>
          </div>
        </div>
        <Badge variant={chatbot.status === 'active' ? 'success' : 'secondary'} className="text-sm">
          {chatbot.status}
        </Badge>
      </div>

      <Tabs defaultValue="knowledge" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="knowledge" className="gap-2">
            <Upload className="h-4 w-4" />
            Knowledge
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge" className="space-y-6">
          <KnowledgeUpload chatbot={chatbot} />
          <FAQManager chatbotId={chatbot.id} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <ChatbotSettings chatbot={chatbot} onUpdate={onUpdate} />
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <ChatbotPreview chatbot={chatbot} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <ChatbotAnalytics chatbot={chatbot} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

