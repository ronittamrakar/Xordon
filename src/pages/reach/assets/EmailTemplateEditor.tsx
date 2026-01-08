import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, EyeOff, Send, Bot, Loader2, Sparkles } from 'lucide-react';
import RichTextEditor from '@/components/editors/RichTextEditor';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { api, Template } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface PreviewData {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
}

const TemplateEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id && id !== 'new';

  const [template, setTemplate] = useState<Template>({
    id: '',
    name: '',
    subject: '',
    htmlContent: '',
    created_at: '',
    updated_at: ''
  });

  const [previewData] = useState<PreviewData>({
    firstName: 'John',
    lastName: 'Doe',
    company: 'Acme Corp',
    email: 'john.doe@example.com'
  });

  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTarget, setAiTarget] = useState<'subject' | 'content' | 'both'>('both');
  const { toast } = useToast();

  const loadTemplate = useCallback(async () => {
    try {
      const data = await api.getTemplate(String(id));
      setTemplate({
        id: data.id,
        name: data.name,
        subject: data.subject,
        htmlContent: data.htmlContent,
        created_at: data.created_at,
        updated_at: data.updated_at
      });
    } catch (error) {
      console.error('Error loading template:', error);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      loadTemplate();
    }
  }, [id, isEditing, loadTemplate]);

  const validateTemplate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!template.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (!template.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!template.htmlContent.trim()) {
      newErrors.htmlContent = 'Content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateTemplate()) {
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        await api.updateTemplate(String(id), {
          name: template.name,
          subject: template.subject,
          htmlContent: template.htmlContent,
        });
      } else {
        await api.createTemplate({
          name: template.name,
          subject: template.subject,
          htmlContent: template.htmlContent,
        });
      }
      navigate('/reach/email-templates');
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAIGeneration = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a description of what you want to generate.',
        variant: 'destructive'
      });
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await api.generateAiContent({
        channel: 'email',
        prompt: aiPrompt,
        action: 'draft',
        context: {
          templateName: template.name,
          existingSubject: template.subject,
          existingContent: template.htmlContent
        }
      });

      const generated = response.output;

      // Try to parse subject and content from generated text
      let newSubject = template.subject;
      let newContent = template.htmlContent;

      if (aiTarget === 'subject' || aiTarget === 'both') {
        // Look for subject line in generated content
        const subjectMatch = generated.match(/subject[:\s]*([^\n]+)/i);
        if (subjectMatch) {
          newSubject = subjectMatch[1].trim();
        } else if (aiTarget === 'subject') {
          // If generating only subject, use the whole output as subject
          newSubject = generated.trim();
        }
      }

      if (aiTarget === 'content' || aiTarget === 'both') {
        // Look for content after subject line or use whole content
        let content = generated;
        if (aiTarget === 'both') {
          const subjectMatch = generated.match(/subject[:\s]*([^\n]+)/i);
          if (subjectMatch) {
            content = generated.substring(subjectMatch[0].length).trim();
          }
        }
        // Remove any remaining subject lines
        content = content.replace(/^subject[:\s]*[^\n]*\n*/gi, '');
        newContent = content.trim();
      }

      setTemplate({
        ...template,
        subject: newSubject,
        htmlContent: newContent
      });

      setAiDialogOpen(false);
      setAiPrompt('');

      toast({
        title: 'AI Generation Complete',
        description: 'Your email content has been generated successfully.'
      });
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: 'AI Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate content. Please check your AI settings.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const renderPreview = (text: string): string => {
    let result = text;

    // Replace placeholders with preview data - comprehensive set matching backend
    const replacements: { [key: string]: string } = {
      // Recipient variables (new format)
      '{{recipient_name}}': `${previewData.firstName} ${previewData.lastName}`,
      '{{recipient_email}}': previewData.email,
      '{{recipient_company}}': previewData.company,

      // Legacy recipient variables (for backward compatibility)
      '{{firstName}}': previewData.firstName,
      '{{lastName}}': previewData.lastName,
      '{{name}}': `${previewData.firstName} ${previewData.lastName}`,
      '{{email}}': previewData.email,
      '{{company}}': previewData.company,

      // Company/Sender variables
      '{{company_name}}': 'Your Company',
      '{{company_email}}': 'contact@yourcompany.com',
      '{{sender_name}}': 'Your Team',
      '{{sender_email}}': 'noreply@example.com',

      // Campaign variables
      '{{campaign_name}}': 'Sample Campaign',
      '{{campaign_subject}}': 'Sample Subject',
      '{{campaign_id}}': '123',

      // Date/Time variables
      '{{current_date}}': new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      '{{current_year}}': new Date().getFullYear().toString(),
      '{{current_month}}': new Date().toLocaleDateString('en-US', { month: 'long' }),
      '{{current_day}}': new Date().getDate().toString(),

      // Tracking variables (new format)
      '{{unsubscribe_url}}': 'https://example.com/unsubscribe',
      '{{recipient_id}}': '456',

      // Legacy tracking variables (for backward compatibility)
      '{{unsubscribeUrl}}': 'https://example.com/unsubscribe'
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return result;
  };

  const renderSubjectPreview = (): string => {
    return renderPreview(template.subject);
  };

  const renderContentPreview = (): string => {
    return renderPreview(template.htmlContent);
  };

  return (
    <>
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/reach/email-templates')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-[18px] font-bold tracking-tight">
              {isEditing ? 'Edit Template' : 'Create Template'}
            </h1>
            <p className="text-muted-foreground mt-1">Design and customize your email template</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
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
                  AI Content Generation
                </DialogTitle>
                <DialogDescription>
                  Describe what you want to generate and AI will create compelling email content for you.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ai-target">Generate</Label>
                  <Select value={aiTarget} onValueChange={(value: 'subject' | 'content' | 'both') => setAiTarget(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select what to generate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subject">Subject Line Only</SelectItem>
                      <SelectItem value="content">Email Content Only</SelectItem>
                      <SelectItem value="both">Subject & Content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ai-prompt">Description</Label>
                  <Textarea
                    id="ai-prompt"
                    placeholder="Describe your email campaign goal, target audience, key points, and desired tone..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Example: "Write a follow-up email to prospects who haven't responded to our initial outreach about our new CRM software. Focus on the benefits of improved team collaboration and offer a 15-minute demo."
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

          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>

        <div className={`grid gap-8 ${showPreview ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {/* Editor Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={template.name}
                    onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                    placeholder="Enter template name"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={template.subject}
                    onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                    placeholder="Enter subject line"
                    className={errors.subject ? 'border-red-500' : ''}
                  />
                  {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`border rounded-md ${errors.htmlContent ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}>
                  <RichTextEditor
                    value={template.htmlContent}
                    onChange={(htmlContent) => setTemplate({ ...template, htmlContent })}
                  />
                </div>
                {errors.htmlContent && <p className="mt-1 text-sm text-red-600">{errors.htmlContent}</p>}
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Preview</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subject:
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border text-sm">
                      {renderSubjectPreview() || 'No subject'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Content:
                    </label>
                    <div
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded border min-h-[200px] text-sm text-gray-900 [&_*]:text-gray-900 [&_p]:text-gray-900 [&_div]:text-gray-900 [&_span]:text-gray-900 [&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_h3]:text-gray-900 [&_h4]:text-gray-900 [&_h5]:text-gray-900 [&_h6]:text-gray-900 [&_a]:text-blue-600 [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: renderContentPreview() || 'No content' }}
                    />
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Preview uses sample data: John Doe from Acme Corp (john.doe@example.com)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TemplateEditor;
