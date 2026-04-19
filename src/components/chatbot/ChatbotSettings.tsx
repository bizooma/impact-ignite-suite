import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Video, MapPin, Palette, MessageCircle, Phone, Mail, Heart, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { Chatbot } from '@/types/database';

interface ChatbotSettingsProps {
  chatbot: Chatbot;
  onUpdate: (updates: Partial<Chatbot>) => void;
}

export function ChatbotSettings({ chatbot, onUpdate }: ChatbotSettingsProps) {
  const [config, setConfig] = useState({
    // About / basics
    name: chatbot.name || '',
    description: chatbot.description || '',

    // Video settings
    video_source: chatbot.web_widget_config?.video_source || '',
    video_type: chatbot.web_widget_config?.video_type || 'youtube',
    launcher_text: chatbot.web_widget_config?.launcher_text || 'Chat with us',
    video_cta_text: chatbot.web_widget_config?.video_cta_text || 'Continue to chat',
    
    // Position & branding
    position: chatbot.web_widget_config?.position || 'bottom-right',
    logo_url: chatbot.web_widget_config?.logo_url || '',
    bot_name: chatbot.web_widget_config?.bot_name || chatbot.name,
    
    // Contact info
    email_contact: chatbot.web_widget_config?.email_contact || '',
    phone_contact: chatbot.web_widget_config?.phone_contact || '',
    
    // Donations
    show_donations: chatbot.web_widget_config?.show_donations || false,
    donation_button_1_label: chatbot.web_widget_config?.donation_button_1?.label || '',
    donation_button_1_url: chatbot.web_widget_config?.donation_button_1?.url || '',
    donation_button_2_label: chatbot.web_widget_config?.donation_button_2?.label || '',
    donation_button_2_url: chatbot.web_widget_config?.donation_button_2?.url || '',
    
    // Appearance
    size: chatbot.web_widget_config?.size || 'compact',
    theme: chatbot.web_widget_config?.theme || 'light',
    show_branding: chatbot.web_widget_config?.show_branding !== false,
    
    // Brand colors
    primary_color: chatbot.brand_settings?.primary_color || '#0066CC',
    accent_color: chatbot.brand_settings?.accent_color || '#00AA44',
    welcome_message: chatbot.brand_settings?.welcome_message || '',
    tone: chatbot.brand_settings?.tone || '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const detectVideoType = (url: string): 'youtube' | 'vimeo' | 'direct' => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    return 'direct';
  };

  const handleVideoSourceChange = (url: string) => {
    const videoType = detectVideoType(url);
    setConfig(prev => ({ ...prev, video_source: url, video_type: videoType }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const updates: Partial<Chatbot> = {
      name: config.name,
      description: config.description,
      brand_settings: {
        ...chatbot.brand_settings,
        primary_color: config.primary_color,
        accent_color: config.accent_color,
        welcome_message: config.welcome_message,
        tone: config.tone,
      },
      web_widget_config: {
        ...chatbot.web_widget_config,
        video_source: config.video_source,
        video_type: config.video_type,
        launcher_text: config.launcher_text,
        video_cta_text: config.video_cta_text,
        position: config.position,
        logo_url: config.logo_url,
        bot_name: config.bot_name,
        email_contact: config.email_contact,
        phone_contact: config.phone_contact,
        show_donations: config.show_donations,
        donation_button_1: {
          label: config.donation_button_1_label,
          url: config.donation_button_1_url,
        },
        donation_button_2: {
          label: config.donation_button_2_label,
          url: config.donation_button_2_url,
        },
        size: config.size,
        theme: config.theme,
        show_branding: config.show_branding,
      },
    };

    await onUpdate(updates);
    setIsSaving(false);
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6">
      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            About
          </CardTitle>
          <CardDescription>Edit your chatbot's name and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cb_name">Chatbot Name</Label>
            <Input
              id="cb_name"
              placeholder="e.g., Hope Helper"
              value={config.name}
              onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cb_description">Description</Label>
            <Textarea
              id="cb_description"
              placeholder="Describe what this chatbot helps with — also used as the system prompt."
              value={config.description}
              onChange={(e) => setConfig((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Video Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Video Settings
          </CardTitle>
          <CardDescription>
            Configure the video launcher for your chatbot widget
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video_source">Video URL</Label>
            <Input
              id="video_source"
              placeholder="YouTube, Vimeo, or direct video URL"
              value={config.video_source}
              onChange={(e) => handleVideoSourceChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Detected type: <span className="font-medium">{config.video_type}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="launcher_text">Launcher Text</Label>
              <Input
                id="launcher_text"
                placeholder="Chat with us"
                value={config.launcher_text}
                onChange={(e) => setConfig(prev => ({ ...prev, launcher_text: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video_cta_text">Video CTA Text</Label>
              <Input
                id="video_cta_text"
                placeholder="Continue to chat"
                value={config.video_cta_text}
                onChange={(e) => setConfig(prev => ({ ...prev, video_cta_text: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Position & Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Position & Branding
          </CardTitle>
          <CardDescription>
            Customize where and how your chatbot appears
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="position">Widget Position</Label>
            <Select value={config.position} onValueChange={(value: any) => setConfig(prev => ({ ...prev, position: value }))}>
              <SelectTrigger id="position">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="middle-right">Middle Right</SelectItem>
                <SelectItem value="middle-left">Middle Left</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              placeholder="https://example.com/logo.png"
              value={config.logo_url}
              onChange={(e) => setConfig(prev => ({ ...prev, logo_url: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot_name">Bot Display Name</Label>
            <Input
              id="bot_name"
              placeholder="Assistant Name"
              value={config.bot_name}
              onChange={(e) => setConfig(prev => ({ ...prev, bot_name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Widget Size</Label>
              <Select value={config.size} onValueChange={(value: any) => setConfig(prev => ({ ...prev, size: value }))}>
                <SelectTrigger id="size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="expanded">Expanded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={config.theme} onValueChange={(value: any) => setConfig(prev => ({ ...prev, theme: value }))}>
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show_branding">Show Powered by Causeio</Label>
            <Switch
              id="show_branding"
              checked={config.show_branding}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, show_branding: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Contact Information
          </CardTitle>
          <CardDescription>
            Add contact methods for your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email_contact" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email_contact"
              type="email"
              placeholder="contact@example.org"
              value={config.email_contact}
              onChange={(e) => setConfig(prev => ({ ...prev, email_contact: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_contact" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <Input
              id="phone_contact"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={config.phone_contact}
              onChange={(e) => setConfig(prev => ({ ...prev, phone_contact: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Donation Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Donation Buttons
          </CardTitle>
          <CardDescription>
            Configure donation button links in the chatbot footer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="show_donations">Show Donation Buttons</Label>
            <Switch
              id="show_donations"
              checked={config.show_donations}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, show_donations: checked }))}
            />
          </div>

          {config.show_donations && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="donation_button_1_label">Button 1 Label</Label>
                    <Input
                      id="donation_button_1_label"
                      placeholder="Donate $25"
                      value={config.donation_button_1_label}
                      onChange={(e) => setConfig(prev => ({ ...prev, donation_button_1_label: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="donation_button_1_url">Button 1 URL</Label>
                    <Input
                      id="donation_button_1_url"
                      placeholder="https://donate.example.org/25"
                      value={config.donation_button_1_url}
                      onChange={(e) => setConfig(prev => ({ ...prev, donation_button_1_url: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="donation_button_2_label">Button 2 Label</Label>
                    <Input
                      id="donation_button_2_label"
                      placeholder="Donate $50"
                      value={config.donation_button_2_label}
                      onChange={(e) => setConfig(prev => ({ ...prev, donation_button_2_label: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="donation_button_2_url">Button 2 URL</Label>
                    <Input
                      id="donation_button_2_url"
                      placeholder="https://donate.example.org/50"
                      value={config.donation_button_2_url}
                      onChange={(e) => setConfig(prev => ({ ...prev, donation_button_2_url: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Brand Colors & Messaging */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Brand Colors & Messaging
          </CardTitle>
          <CardDescription>
            Customize colors and conversation style
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={config.primary_color}
                  onChange={(e) => setConfig(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="w-20"
                />
                <Input
                  value={config.primary_color}
                  onChange={(e) => setConfig(prev => ({ ...prev, primary_color: e.target.value }))}
                  placeholder="#0066CC"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accent_color">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accent_color"
                  type="color"
                  value={config.accent_color}
                  onChange={(e) => setConfig(prev => ({ ...prev, accent_color: e.target.value }))}
                  className="w-20"
                />
                <Input
                  value={config.accent_color}
                  onChange={(e) => setConfig(prev => ({ ...prev, accent_color: e.target.value }))}
                  placeholder="#00AA44"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcome_message" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Welcome Message
            </Label>
            <Textarea
              id="welcome_message"
              placeholder="Hi! How can I help you today?"
              value={config.welcome_message}
              onChange={(e) => setConfig(prev => ({ ...prev, welcome_message: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Conversation Tone</Label>
            <Input
              id="tone"
              placeholder="Warm, professional, compassionate"
              value={config.tone}
              onChange={(e) => setConfig(prev => ({ ...prev, tone: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
