import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Save, Eye, Copy, Smartphone, Bot, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { smsAPI } from '@/lib/sms-api';
import { useToast } from '@/hooks/use-toast';

interface SMSTemplate {
  id: string;
  name: string;
  description: string;
  message: string;
  category: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

const categories = [
  'Welcome',
  'Promotional',
  'Reminder',
  'Notification',
  'Follow-up',
  'Abandoned Cart',
  'Event',
  'Survey',
  'Other'
];

const SMSTemplateEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<SMSTemplate>({
    id: '',
    name: '',
    description: '',
    message: '',
    category: 'Welcome',
    tags: [],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const { toast: uiToast } = useToast();

  useEffect(() => {
    if (id && id !== 'new') {
      loadTemplate();
    }
  }, [id]);

  const loadTemplate = async () => {
    setLoading(true);
    try {
      const templates = await smsAPI.getSMSTemplates();
      const foundTemplate = templates.find(t => t.id === id);

      if (foundTemplate) {
        setTemplate({
          id: foundTemplate.id,
          name: foundTemplate.name,
          description: foundTemplate.description || '',
          message: foundTemplate.message,
          category: foundTemplate.category || 'Other',
          tags: foundTemplate.variables || [],
          isActive: true,
          createdAt: foundTemplate.created_at,
          updatedAt: foundTemplate.updated_at,
          usageCount: 0
        });
      } else {
        toast.error('Template not found');
        navigate('/reach/sms-templates');
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!template.name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (!template.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        name: template.name,
        message: template.message,
        category: template.category,
        description: template.description,
        variables: template.tags
      };

      if (id && id !== 'new') {
        await smsAPI.updateSMSTemplate(id, templateData);
        toast.success('Template updated successfully');
      } else {
        await smsAPI.createSMSTemplate(templateData);
        toast.success('Template created successfully');
        navigate('/reach/sms-templates');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save template';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const previewTemplate = () => {
    // Replace variables with sample data for preview
    const previewMessage = template.message
      .replace(/\{\{company\}\}/g, 'Your Company')
      .replace(/\{\{firstName\}\}/g, 'John')
      .replace(/\{\{lastName\}\}/g, 'Doe')
      .replace(/\{\{name\}\}/g, 'John Doe');

    toast.info(`Preview: ${previewMessage}`);
  };

  const copyTemplate = () => {
    navigator.clipboard.writeText(template.message);
    toast.success('Template copied to clipboard');
  };

  const addTag = () => {
    if (newTag.trim() && !template.tags.includes(newTag.trim())) {
      setTemplate(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTemplate(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('message') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = template.message.substring(0, start) +
        `{{${variable}}}` +
        template.message.substring(end);

      setTemplate(prev => ({ ...prev, message: newMessage }));

      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
      }, 0);
    }
  };

  const handleAIGeneration = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a description of what you want to generate.');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await api.generateAiContent({
        channel: 'sms',
        prompt: aiPrompt,
        action: 'draft',
        context: {
          templateName: template.name,
          category: template.category,
          existingMessage: template.message
        }
      });

      const generated = response.output.trim();

      setTemplate(prev => ({
        ...prev,
        message: generated
      }));

      setAiDialogOpen(false);
      setAiPrompt('');

      uiToast({
        title: 'AI Generation Complete',
        description: 'Your SMS message has been generated successfully.'
      });
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate content. Please check your AI settings.');
      uiToast({
        title: 'AI Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate content. Please check your AI settings.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const variables = [
    { name: 'firstName', description: 'Recipient\'s first name' },
    { name: 'lastName', description: 'Recipient\'s last name' },
    { name: 'name', description: 'Recipient\'s full name' },
    { name: 'company', description: 'Company name' },
    { name: 'phone', description: 'Recipient\'s phone number' },
    { name: 'unsubscribeUrl', description: 'SMS unsubscribe link' }
  ];

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading template...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/reach/sms-templates')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-[18px] font-bold tracking-tight">
                {id === 'new' ? 'Create SMS Template' : 'Edit SMS Template'}
              </h1>
              <p className="text-muted-foreground">
                Create reusable SMS message templates
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate with AI
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    AI SMS Generation
                  </DialogTitle>
                  <DialogDescription>
                    Describe your SMS campaign goal and AI will create a compelling, compliant SMS message for you.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ai-prompt">Campaign Description</Label>
                    <Textarea
                      id="ai-prompt"
                      placeholder="Describe your SMS campaign goal, target audience, key message, and desired tone..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Example: "Create a promotional SMS for a weekend sale offering 20% off all items. Keep it under 160 characters and include urgency."
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAIGeneration}
                    disabled={isGeneratingAI || !aiPrompt.trim()}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
                  >
                    {isGeneratingAI ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={copyTemplate}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" onClick={previewTemplate}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={saveTemplate} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Settings */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Settings</CardTitle>
                <CardDescription>Configure your SMS template details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={template.name}
                    onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter template name"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={template.description}
                    onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this template"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={template.category}
                    onValueChange={(value) => setTemplate(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex space-x-2 mb-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button onClick={addTag} size="sm">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {template.tags.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {id !== 'new' && (
                  <div className="pt-4 border-t">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Usage Count:</span>
                        <span>{template.usageCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Created:</span>
                        <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Variables */}
            <Card>
              <CardHeader>
                <CardTitle>Variables</CardTitle>
                <CardDescription>Click to insert into your message</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {variables.map(variable => (
                    <Button
                      key={variable.name}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => insertVariable(variable.name)}
                    >
                      <span className="font-mono">{'{{' + variable.name + '}}'}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Message Editor */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Message Content</CardTitle>
                <CardDescription>Write your SMS message template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="message">SMS Message</Label>
                  <Textarea
                    id="message"
                    value={template.message}
                    onChange={(e) => setTemplate(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Enter your SMS message template..."
                    rows={8}
                    className="font-mono"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>{template.message.length}/160 characters</span>
                    <span>
                      {Math.ceil(template.message.length / 160)} segment{Math.ceil(template.message.length / 160) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Preview */}
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center space-x-2 mb-3">
                    <Smartphone className="h-4 w-4" />
                    <span className="text-sm font-medium">Preview</span>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border max-w-sm">
                    <p className="text-sm whitespace-pre-wrap">
                      {template.message
                        .replace(/\{\{company\}\}/g, 'Your Company')
                        .replace(/\{\{firstName\}\}/g, 'John')
                        .replace(/\{\{lastName\}\}/g, 'Doe')
                        .replace(/\{\{name\}\}/g, 'John Doe')
                        .replace(/\{\{phone\}\}/g, '+1234567890')
                        .replace(/\{\{unsubscribeUrl\}\}/g, 'https://example.com/unsubscribe')
                      }
                    </p>
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">SMS Best Practices</h4>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Keep messages under 160 characters when possible</li>
                    <li>• Include clear call-to-action</li>
                    <li>• Always provide opt-out instructions</li>
                    <li>• Use personalization variables for better engagement</li>
                    <li>• Test your message before sending to large audiences</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default SMSTemplateEditor;
