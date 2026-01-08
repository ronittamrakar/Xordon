import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Eye, Plus, Trash2, GripVertical, Bot, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { api, FormTemplate, FormField, FormStep } from '@/lib/api';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'url', label: 'URL' },
  { value: 'tel', label: 'Phone' },
  { value: 'time', label: 'Time' },
  { value: 'file', label: 'File Upload' }
];

const categories = [
  { value: 'contact', label: 'Contact Form' },
  { value: 'lead', label: 'Lead Generation' },
  { value: 'survey', label: 'Survey' },
  { value: 'registration', label: 'Registration' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'other', label: 'Other' }
];

const FormTemplateEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = id && id !== 'new';
  
  const [template, setTemplate] = useState<Partial<FormTemplate>>({
    name: '',
    description: '',
    fields: [],
    is_multi_step: false,
    steps: [],
    category: 'other'
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // AI generation state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTarget, setAiTarget] = useState<'fields' | 'description' | 'both'>('both');
  const { toast: uiToast } = useToast();

  useEffect(() => {
    if (isEditing) {
      loadTemplate();
    }
  }, [id]);

  const loadTemplate = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await api.getFormTemplate(id);
      setTemplate(data);
    } catch (error) {
      console.error('Error loading form template:', error);
      toast.error('Failed to load form template');
      navigate('/forms/templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!template.name?.trim()) {
      toast.error('Template name is required');
      return;
    }

    if (template.fields?.length === 0) {
      toast.error('At least one field is required');
      return;
    }

    try {
      setSaving(true);
      if (isEditing && id) {
        await api.updateFormTemplate(id, template);
        toast.success('Form template updated successfully');
      } else {
        await api.createFormTemplate(template);
        toast.success('Form template created successfully');
      }
      navigate('/forms/templates');
    } catch (error) {
      console.error('Error saving form template:', error);
      toast.error('Failed to save form template');
    } finally {
      setSaving(false);
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
        channel: 'form',
        prompt: aiPrompt,
        action: 'draft',
        context: {
          templateName: template.name,
          category: template.category,
          existingDescription: template.description,
          existingFields: template.fields
        }
      });

      const generated = response.output.trim();
      
      let newDescription = template.description || '';
      let newFields = template.fields || [];
      
      if (aiTarget === 'description' || aiTarget === 'both') {
        // Try to extract description from generated content
        const descriptionMatch = generated.match(/(?:description|summary|overview):\s*([^\n]+)/i);
        if (descriptionMatch) {
          newDescription = descriptionMatch[1].trim();
        } else if (aiTarget === 'description') {
          // If generating only description, use the whole output as description
          newDescription = generated;
        }
      }
      
      if (aiTarget === 'fields' || aiTarget === 'both') {
        // Try to extract field suggestions from generated content
        const fieldsSection = generated.match(/(?:fields|form fields):\s*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
        if (fieldsSection) {
          const fieldText = fieldsSection[1];
          // Parse field suggestions (basic implementation)
          const fieldLines = fieldText.split('\n').filter(line => line.trim());
          const suggestedFields = fieldLines.map((line, index) => ({
            id: `field_${Date.now()}_${index}`,
            name: `field_${index + 1}`,
            type: 'text' as const,
            label: line.replace(/^[-*•]\s*/, '').trim(),
            required: false,
            placeholder: ''
          }));
          newFields = [...newFields, ...suggestedFields];
        }
      }
      
      setTemplate(prev => ({
        ...prev,
        description: newDescription,
        fields: newFields
      }));
      
      setAiDialogOpen(false);
      setAiPrompt('');
      
      uiToast({
        title: 'AI Generation Complete',
        description: 'Your form content has been generated successfully.'
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

  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      name: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false,
      options: [],
      step: template.is_multi_step ? 0 : undefined
    };
    
    setTemplate(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField]
    }));
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields?.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      ) || []
    }));
  };

  const removeField = (fieldId: string) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields?.filter(field => field.id !== fieldId) || []
    }));
  };

  const addStep = () => {
    const newStep: FormStep = {
      id: `step-${Date.now()}`,
      title: `Step ${(template.steps?.length || 0) + 1}`,
      order: template.steps?.length || 0,
      fields: []
    };
    
    setTemplate(prev => ({
      ...prev,
      steps: [...(prev.steps || []), newStep]
    }));
  };

  const updateStep = (stepId: string, updates: Partial<FormStep>) => {
    setTemplate(prev => ({
      ...prev,
      steps: prev.steps?.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      ) || []
    }));
  };

  const removeStep = (stepId: string) => {
    setTemplate(prev => ({
      ...prev,
      steps: prev.steps?.filter(step => step.id !== stepId) || []
    }));
  };

  const toggleMultiStep = (enabled: boolean) => {
    if (enabled && !template.steps?.length) {
      setTemplate(prev => ({
        ...prev,
        is_multi_step: true,
        steps: [{
          id: 'step-1',
          title: 'Step 1',
          order: 0,
          fields: []
        }]
      }));
    } else {
      setTemplate(prev => ({
        ...prev,
        is_multi_step: enabled,
        steps: enabled ? prev.steps : []
      }));
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading template...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/forms/templates')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-[18px] font-bold text-gray-900 dark:text-white">
                  {isEditing ? 'Edit Form Template' : 'Create Form Template'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {isEditing ? 'Update your form template' : 'Create a reusable form template'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
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
                      AI Form Generation
                    </DialogTitle>
                    <DialogDescription>
                      Describe your form requirements and AI will suggest form fields and descriptions.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="ai-target">Generate</Label>
                      <select
                        id="ai-target"
                        value={aiTarget}
                        onChange={(e) => setAiTarget(e.target.value as 'fields' | 'description' | 'both')}
                        className="w-full border border-input rounded-md px-3 py-2"
                      >
                        <option value="both">Form Fields & Description</option>
                        <option value="fields">Form Fields Only</option>
                        <option value="description">Description Only</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="ai-prompt">Form Requirements</Label>
                      <Textarea
                        id="ai-prompt"
                        placeholder="Describe your form purpose, target audience, and information you need to collect..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Example: "Create a contact form for a B2B SaaS company. Need name, email, company, phone, and message fields. Include validation for email format."
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
              
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </div>

          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Template Settings</CardTitle>
              <CardDescription>
                Configure the basic settings for your form template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={template.name || ''}
                    onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Contact Form Template"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={template.category || 'other'} onValueChange={(value) => setTemplate(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={template.description || ''}
                  onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of what this template is for"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="multi-step"
                  checked={template.is_multi_step || false}
                  onChange={(e) => toggleMultiStep(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="multi-step" className="text-sm font-medium">
                  Multi-step form (wizard)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Multi-step Configuration */}
          {template.is_multi_step && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Form Steps</CardTitle>
                    <CardDescription>
                      Configure the steps for your multi-step form
                    </CardDescription>
                  </div>
                  <Button onClick={addStep} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Step
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {template.steps?.map((step, index) => (
                    <div key={step.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Step {index + 1}</Badge>
                          <Input
                            value={step.title}
                            onChange={(e) => updateStep(step.id, { title: e.target.value })}
                            className="font-medium"
                            placeholder="Step title"
                          />
                        </div>
                        {template.steps!.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStep(step.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Textarea
                        value={step.description || ''}
                        onChange={(e) => updateStep(step.id, { description: e.target.value })}
                        placeholder="Step description (optional)"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fields Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Form Fields</CardTitle>
                  <CardDescription>
                    Add and configure the fields for your form template
                  </CardDescription>
                </div>
                <Button onClick={addField} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {template.fields?.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <Badge variant="outline">Field {index + 1}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeField(field.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`field-${field.id}-label`}>Field Label *</Label>
                          <Input
                            id={`field-${field.id}-label`}
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            placeholder="e.g., Full Name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`field-${field.id}-name`}>Field Name *</Label>
                          <Input
                            id={`field-${field.id}-name`}
                            value={field.name}
                            onChange={(e) => updateField(field.id, { name: e.target.value })}
                            placeholder="e.g., fullName"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`field-${field.id}-type`}>Field Type *</Label>
                          <Select 
                            value={field.type} 
                            onValueChange={(value) => updateField(field.id, { type: value as FormField['type'] })}
                          >
                            <SelectTrigger id={`field-${field.id}-type`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {template.is_multi_step && (
                          <div className="space-y-2">
                            <Label htmlFor={`field-${field.id}-step`}>Step</Label>
                            <Select 
                              value={String(field.step || 0)} 
                              onValueChange={(value) => updateField(field.id, { step: parseInt(value) })}
                            >
                              <SelectTrigger id={`field-${field.id}-step`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {template.steps?.map((step, idx) => (
                                  <SelectItem key={step.id} value={String(idx)}>
                                    Step {idx + 1}: {step.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`field-${field.id}-required`}
                            checked={field.required}
                            onChange={(e) => updateField(field.id, { required: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={`field-${field.id}-required`} className="text-sm">
                            Required field
                          </Label>
                        </div>
                      </div>

                      {(field.type === 'select' || field.type === 'radio') && (
                        <div className="space-y-2">
                          <Label>Options (one per line)</Label>
                          <Textarea
                            value={field.options?.join('\n') || ''}
                            onChange={(e) => updateField(field.id, { options: e.target.value.split('\n').filter(Boolean) })}
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                            rows={3}
                          />
                        </div>
                      )}

                      {field.type === 'file' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`field-${field.id}-accept`}>Accepted File Types</Label>
                            <Input
                              id={`field-${field.id}-accept`}
                              value={field.accept || ''}
                              onChange={(e) => updateField(field.id, { accept: e.target.value })}
                              placeholder="e.g., image/*,.pdf"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`field-${field.id}-multiple`}
                              checked={field.multiple || false}
                              onChange={(e) => updateField(field.id, { multiple: e.target.checked })}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor={`field-${field.id}-multiple`} className="text-sm">
                              Allow multiple files
                            </Label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {template.fields?.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No fields added yet. Click "Add Field" to get started.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this form template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (id) {
                api.deleteFormTemplate(id).then(() => {
                  navigate('/forms/templates');
                }).catch(error => {
                  console.error('Error deleting template:', error);
                  toast.error('Failed to delete template');
                });
              }
            }} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default FormTemplateEditor;
