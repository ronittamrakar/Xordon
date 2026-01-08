import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Save,
  Eye,
  Settings,
  Palette,
  Shield,
  Bell,
  BarChart3,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  FileTextIcon,
  Layout,
  Zap,
  Type,
  Mail,
  List,
  CheckSquare,
  Circle,
  File,
  Star,
  EyeOff,
  Lock,
  Calendar
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import FormBuilder from '@/components/forms/FormBuilder';
import VisualFormBuilder from '@/components/forms/VisualFormBuilder';
import { api, type Form, type FormField, type FormStep } from '@/lib/api';
import { toast } from 'sonner';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const FormBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { formId } = useParams();
  const location = useLocation();
  const isEditing = Boolean(formId && formId !== 'new');

  const templateFromState = (location.state as { template?: Partial<Form> } | null)?.template;

  // Form state
  const [form, setForm] = useState<Partial<Form>>({
    name: '',
    title: '',
    description: '',
    fields: [],
    status: 'draft',
    is_multi_step: false,
    steps: [],
    settings: {
      allow_submissions: true,
      require_authentication: false,
      save_drafts: true,
      limit_submissions: false,
      max_submissions: 100,
      send_notifications: true,
      notification_emails: [],
      confirmation_message: 'Thank you for your submission!',
      redirect_url: '',
      theme: {
        primary_color: '#3b82f6',
        background_color: '#ffffff',
        text_color: '#1f2937',
        button_style: 'rounded'
      },
      security: {
        enable_captcha: false,
        enable_rate_limit: true,
        rate_limit_per_hour: 10,
        block_ip_addresses: false,
        allowed_ips: []
      }
    }
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'fields';
  const setActiveTab = (tab: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    setSearchParams(newParams, { replace: true });
  };

  const previewMode = searchParams.get('preview') === 'true';
  const setPreviewMode = (isPreview: boolean) => {
    const newParams = new URLSearchParams(searchParams);
    if (isPreview) {
      newParams.set('preview', 'true');
    } else {
      newParams.delete('preview');
    }
    setSearchParams(newParams, { replace: true });
  };

  const [builderMode, setBuilderMode] = useState<'classic' | 'visual'>(() => {
    // Persist builder mode preference
    const saved = localStorage.getItem('formBuilderMode');
    return (saved === 'classic' || saved === 'visual') ? saved : 'visual';
  });

  const currentStep = searchParams.get('step') || 'step-1';
  const setCurrentStep = (stepId: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('step', stepId);
    setSearchParams(newParams, { replace: true });
  };
  const [dragOver, setDragOver] = useState(false);
  const dragStartTime = useRef(0);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Field type icons and labels
  const fieldTypeIcons = {
    text: Type,
    email: Mail,
    textarea: FileTextIcon,
    select: List,
    checkbox: CheckSquare,
    radio: Circle,
    file: File,
    range: Settings,
    rating: Star,
    signature: FileTextIcon,
    hidden: EyeOff,
    password: Lock,
    color: Palette,
    datetime: Calendar,
  };

  const fieldTypeLabels = {
    text: 'Text Input',
    email: 'Email Input',
    textarea: 'Text Area',
    select: 'Dropdown',
    checkbox: 'Checkbox',
    radio: 'Radio Button',
    file: 'File Upload',
    range: 'Range Slider',
    rating: 'Rating Field',
    signature: 'Signature Pad',
    hidden: 'Hidden Field',
    password: 'Password Input',
    color: 'Color Picker',
    datetime: 'Date & Time',
  };

  // Helper functions
  const fields = form.fields || [];
  const steps = form.steps || [];
  const isMultiStep = form.is_multi_step || false;

  const addField = (type: FormField['type']) => {
    // Generate a more reliable unique ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const uniqueId = `field-${timestamp}-${random}`;

    const newField: FormField = {
      id: uniqueId,
      name: `field_${fields.length + 1}`,
      type,
      label: `${fieldTypeLabels[type]} ${fields.length + 1}`,
      required: false,
    };

    // If multi-step, add to current step
    if (isMultiStep && steps.length > 0) {
      newField.step = parseInt(currentStep.replace('step-', '')) - 1;
    }

    setForm(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField]
    }));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields?.map(field =>
        field.id === id ? { ...field, ...updates } : field
      )
    }));
  };

  const removeField = (id: string) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields?.filter(field => field.id !== id)
    }));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex(field => field.id === active.id);
      const newIndex = fields.findIndex(field => field.id === over.id);

      const newFields = [...fields];
      const [reorderedField] = newFields.splice(oldIndex, 1);
      newFields.splice(newIndex, 0, reorderedField);

      setForm(prev => ({ ...prev, fields: newFields }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const fieldType = e.dataTransfer.getData('fieldType');
    if (fieldType) {
      // Clear the global drag flag immediately to prevent click events
      (window as any).isDraggingField = false;
      addField(fieldType as FormField['type']);
    }
  };

  const onStepChange = (stepId: string) => {
    setCurrentStep(stepId);
  };

  // Simple StepManager component
  const StepManager = ({
    steps,
    onStepsChange,
    fields,
    currentStep,
    onStepChange
  }: {
    steps: FormStep[];
    onStepsChange: (steps: FormStep[]) => void;
    fields: FormField[];
    currentStep: string;
    onStepChange: (stepId: string) => void;
  }) => {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Form Steps</Label>
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-2 p-2 border rounded">
            <span className="text-sm font-medium">{index + 1}. {step.title}</span>
          </div>
        ))}
      </div>
    );
  };

  // Load form data if editing
  useEffect(() => {
    if (isEditing && formId) {
      loadForm(formId);
    }
  }, [isEditing, formId]);

  // Apply template defaults when creating a new form
  useEffect(() => {
    if (!isEditing && templateFromState) {
      setForm(prev => ({
        ...prev,
        name: templateFromState.name ?? prev.name,
        title: templateFromState.title ?? prev.title,
        description: templateFromState.description ?? prev.description,
        fields: templateFromState.fields ?? prev.fields,
        is_multi_step: templateFromState.is_multi_step ?? prev.is_multi_step,
        steps: templateFromState.steps ?? prev.steps,
      }));
    }
  }, [isEditing, templateFromState]);

  const loadForm = async (id: string) => {
    try {
      setLoading(true);
      const formData = await api.getForm(id);
      setForm(formData);
    } catch (error) {
      console.error('Failed to load form:', error);
      toast.error('Failed to load form');
      navigate('/forms');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!form.name || !form.title) {
        toast.error('Please fill in all required fields');
        return;
      }

      const formPayload = {
        name: form.name,
        title: form.title,
        description: form.description,
        fields: form.fields || [],
        status: form.status || 'draft',
        group_id: form.group_id,
        is_multi_step: form.is_multi_step || false,
        steps: form.steps || []
      };

      let savedForm: Form;
      if (isEditing && formId) {
        savedForm = await api.updateForm(formId, { ...formPayload, settings: form.settings });
        toast.success('Form updated successfully');
      } else {
        savedForm = await api.createForm(formPayload);
        toast.success('Form created successfully');
        navigate(`/forms/builder/${savedForm.id}`, { replace: true });
      }

      setForm(savedForm);
    } catch (error) {
      console.error('Failed to save form:', error);
      toast.error('Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldsChange = useCallback((fields: FormField[]) => {
    setForm(prev => ({ ...prev, fields }));
  }, []);

  const handleStepsChange = useCallback((steps: FormStep[]) => {
    setForm(prev => ({ ...prev, steps }));
  }, []);

  const updateFormSettings = (category: string, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [category]: {
          ...((prev.settings?.[category as keyof typeof prev.settings] as Record<string, any>) || {}),
          [field]: value
        }
      }
    }));
  };

  const addNotificationEmail = (email: string) => {
    if (!email || !email.includes('@')) return;

    setForm(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        notification_emails: [...(prev.settings?.notification_emails || []), email]
      }
    }));
  };

  const removeNotificationEmail = (index: number) => {
    setForm(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        notification_emails: prev.settings?.notification_emails?.filter((_, i) => i !== index) || []
      }
    }));
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-full mx-auto p-4 space-y-4">
        {/* Compact Header */}
        <div className="bg-white border rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/forms')}
                className="flex items-center gap-2 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Opt-in Forms
              </Button>
              <Breadcrumb
                items={[
                  { label: 'Opt-in Forms', href: '/forms' },
                  { label: isEditing ? 'Edit Form' : 'Create Form', href: `/forms/builder/${formId || 'new'}` }
                ]}
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Builder Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <Button
                  variant={builderMode === 'visual' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setBuilderMode('visual');
                    localStorage.setItem('formBuilderMode', 'visual');
                  }}
                  className={`h-7 px-3 text-xs ${builderMode === 'visual' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Layout className="h-3.5 w-3.5 mr-1.5" />
                  Visual
                </Button>
                <Button
                  variant={builderMode === 'classic' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setBuilderMode('classic');
                    localStorage.setItem('formBuilderMode', 'classic');
                  }}
                  className={`h-7 px-3 text-xs ${builderMode === 'classic' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <FileTextIcon className="h-3.5 w-3.5 mr-1.5" />
                  Classic
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center gap-2 hover:bg-gray-50"
              >
                <Eye className="h-4 w-4" />
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Form'}
              </Button>
            </div>
          </div>

          {/* Form Title and Description - Compact */}
          <div className="text-center mt-4">
            <Input
              value={form.title || ''}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter Form Title"
              className="text-2xl font-bold text-center border-none shadow-none focus-visible:ring-0 px-0 text-gray-900 placeholder:text-gray-400 h-auto py-1"
            />
            <Input
              value={form.description || ''}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter form description"
              className="text-center text-gray-600 border-none shadow-none focus-visible:ring-0 px-0 text-sm placeholder:text-gray-400 h-auto py-1"
            />
          </div>
        </div>

        {/* Compact Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-4">
            <Badge variant={form.status === 'active' ? 'default' : 'secondary'} className="text-xs">
              {form.status || 'draft'}
            </Badge>
            <span className="text-xs text-gray-500">{form.fields?.length || 0} fields</span>
            {form.is_multi_step && (
              <span className="text-xs text-gray-500">{form.steps?.length || 0} steps</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="form-status" className="text-xs text-gray-600">Status:</Label>
            <Select
              value={form.status || 'draft'}
              onValueChange={(value) => setForm(prev => ({ ...prev, status: value as Form['status'] }))}
            >
              <SelectTrigger className="w-24 h-7 text-xs border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Visual Builder Mode - Full Width */}
        {builderMode === 'visual' ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 240px)' }}>
            <VisualFormBuilder
              fields={form.fields || []}
              onFieldsChange={handleFieldsChange}
              isMultiStep={form.is_multi_step || false}
              steps={form.steps || []}
              onStepsChange={handleStepsChange}
              formTitle={form.title}
              formDescription={form.description}
              theme={form.settings?.theme}
            />
          </div>
        ) : (
          /* Classic Three Column Layout */
          <div className="grid grid-cols-12 gap-4" style={{ height: 'calc(100vh - 240px)' }}>
            {/* Left Column - Field Types */}
            <div className="col-span-3 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-blue-600" />
                  Field Types
                </h3>
              </div>
              <div className="p-3 space-y-1 overflow-y-auto flex-1">
                {Object.entries(fieldTypeLabels).map(([type, label]) => {
                  const Icon = fieldTypeIcons[type as FormField['type']] || Type;
                  return (
                    <div
                      key={type}
                      className="relative cursor-move"
                    >
                      <div
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('fieldType', type);
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        className="absolute inset-0 z-10"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start h-10 px-3 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors relative"
                        onClick={() => addField(type as FormField['type'])}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        <div className="text-left">
                          <div className="font-medium text-sm">{label}</div>
                        </div>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Middle Column - Form Builder */}
            <div className="col-span-6 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                    <FileTextIcon className="h-4 w-4 text-blue-600" />
                    Form Builder
                  </h3>
                  {form.is_multi_step && steps.length > 0 && (
                    <Select value={currentStep} onValueChange={onStepChange}>
                      <SelectTrigger className="w-32 h-7 text-xs border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {steps.map((step) => (
                          <SelectItem key={step.id} value={step.id}>
                            {step.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div
                  className={`relative transition-all duration-200 ${dragOver ? 'ring-2 ring-blue-400 ring-opacity-50 bg-blue-50/30 rounded-lg' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <FormBuilder
                    fields={form.fields || []}
                    onFieldsChange={handleFieldsChange}
                    showPreview={previewMode}
                    isMultiStep={form.is_multi_step || false}
                    steps={form.steps || []}
                    onStepsChange={handleStepsChange}
                    hideFieldTypes={true}
                    hideHeader={true}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Settings */}
            <div className="col-span-3 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                  <Settings className="h-4 w-4 text-blue-600" />
                  Settings
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                  <TabsList className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-100 h-auto">
                    <TabsTrigger value="fields" className="text-xs px-2 py-1 h-7 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                      Fields
                    </TabsTrigger>
                    <TabsTrigger value="submissions" className="text-xs px-2 py-1 h-7 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                      Submissions
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="text-xs px-2 py-1 h-7 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                      Notifications
                    </TabsTrigger>
                    <TabsTrigger value="styling" className="text-xs px-2 py-1 h-7 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                      Styling
                    </TabsTrigger>
                    <TabsTrigger value="security" className="text-xs px-2 py-1 h-7 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                      Security
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="text-xs px-2 py-1 h-7 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                      Analytics
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex-1 overflow-y-auto p-3">
                    <TabsContent value="fields" className="space-y-4 mt-0">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="form-name" className="text-sm font-medium text-gray-700">Form Name</Label>
                          <Input
                            id="form-name"
                            value={form.name || ''}
                            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="contact-form"
                            className="mt-1"
                          />
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            id="multi-step-form"
                            checked={form.is_multi_step || false}
                            onChange={(e) => setForm(prev => ({ ...prev, is_multi_step: e.target.checked }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <Label htmlFor="multi-step-form" className="text-sm font-medium text-gray-700">Multi-step form</Label>
                            <p className="text-xs text-gray-500">Create a multi-step form experience</p>
                          </div>
                        </div>

                        {form.is_multi_step && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <StepManager
                              steps={form.steps || []}
                              onStepsChange={handleStepsChange}
                              fields={form.fields || []}
                              currentStep={currentStep}
                              onStepChange={onStepChange}
                            />
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="submissions" className="space-y-4 mt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <Label htmlFor="allow-submissions" className="text-sm font-medium text-gray-700">Allow Submissions</Label>
                            <p className="text-xs text-gray-500">Enable or disable form submissions</p>
                          </div>
                          <Switch
                            id="allow-submissions"
                            checked={form.settings?.allow_submissions ?? true}
                            onCheckedChange={(checked) => updateFormSettings('submissions', 'allow_submissions', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <Label htmlFor="require-auth" className="text-sm font-medium text-gray-700">Require Authentication</Label>
                            <p className="text-xs text-gray-500">Only allow authenticated users</p>
                          </div>
                          <Switch
                            id="require-auth"
                            checked={form.settings?.require_authentication ?? false}
                            onCheckedChange={(checked) => updateFormSettings('submissions', 'require_authentication', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <Label htmlFor="save-drafts" className="text-sm font-medium text-gray-700">Save Drafts</Label>
                            <p className="text-xs text-gray-500">Allow users to save incomplete forms</p>
                          </div>
                          <Switch
                            id="save-drafts"
                            checked={form.settings?.save_drafts ?? false}
                            onCheckedChange={(checked) => updateFormSettings('submissions', 'save_drafts', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <Label htmlFor="limit-submissions" className="text-sm font-medium text-gray-700">Limit Submissions</Label>
                            <p className="text-xs text-gray-500">Restrict total number of responses</p>
                          </div>
                          <Switch
                            id="limit-submissions"
                            checked={form.settings?.limit_submissions ?? false}
                            onCheckedChange={(checked) => updateFormSettings('submissions', 'limit_submissions', checked)}
                          />
                        </div>

                        {form.settings?.limit_submissions && (
                          <div>
                            <Label htmlFor="max-submissions" className="text-sm font-medium text-gray-700">Maximum Submissions</Label>
                            <Input
                              id="max-submissions"
                              type="number"
                              value={form.settings?.max_submissions || 100}
                              onChange={(e) => updateFormSettings('submissions', 'max_submissions', parseInt(e.target.value))}
                              className="mt-1"
                            />
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="notifications" className="space-y-4 mt-0">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <Label htmlFor="send-notifications" className="text-sm font-medium text-gray-700">Send Email Notifications</Label>
                            <p className="text-xs text-gray-500">Get notified of new submissions</p>
                          </div>
                          <Switch
                            id="send-notifications"
                            checked={form.settings?.send_notifications ?? false}
                            onCheckedChange={(checked) => updateFormSettings('notifications', 'send_notifications', checked)}
                          />
                        </div>

                        {form.settings?.send_notifications && (
                          <>
                            <div>
                              <Label htmlFor="notification-emails" className="text-sm font-medium text-gray-700">Notification Emails</Label>
                              <div className="space-y-2 mt-1">
                                {form.settings?.notification_emails?.map((email, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <Input value={email} readOnly className="flex-1" />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeNotificationEmail(index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                                <div className="flex items-center gap-2">
                                  <Input
                                    placeholder="admin@example.com"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        addNotificationEmail(e.currentTarget.value);
                                        e.currentTarget.value = '';
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      const input = e.currentTarget.parentElement?.querySelector('input');
                                      if (input) {
                                        addNotificationEmail(input.value);
                                        input.value = '';
                                      }
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="confirmation-message" className="text-sm font-medium text-gray-700">Confirmation Message</Label>
                              <Textarea
                                id="confirmation-message"
                                value={form.settings?.confirmation_message || 'Thank you for your submission!'}
                                onChange={(e) => updateFormSettings('notifications', 'confirmation_message', e.target.value)}
                                placeholder="Message shown after successful submission"
                                rows={3}
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <Label htmlFor="redirect-url" className="text-sm font-medium text-gray-700">Redirect URL</Label>
                              <Input
                                id="redirect-url"
                                value={form.settings?.redirect_url || ''}
                                onChange={(e) => updateFormSettings('notifications', 'redirect_url', e.target.value)}
                                placeholder="https://example.com/thank-you"
                                className="mt-1"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="styling" className="space-y-4 mt-0">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="primary-color" className="text-sm font-medium text-gray-700">Primary Color</Label>
                          <div className="flex items-center gap-3 mt-1">
                            <Input
                              id="primary-color"
                              type="color"
                              value={form.settings?.theme?.primary_color || '#3b82f6'}
                              onChange={(e) => updateFormSettings('theme', 'primary_color', e.target.value)}
                              className="w-16 h-10"
                            />
                            <Input
                              value={form.settings?.theme?.primary_color || '#3b82f6'}
                              onChange={(e) => updateFormSettings('theme', 'primary_color', e.target.value)}
                              placeholder="#3b82f6"
                              className="flex-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="background-color" className="text-sm font-medium text-gray-700">Background Color</Label>
                          <div className="flex items-center gap-3 mt-1">
                            <Input
                              id="background-color"
                              type="color"
                              value={form.settings?.theme?.background_color || '#ffffff'}
                              onChange={(e) => updateFormSettings('theme', 'background_color', e.target.value)}
                              className="w-16 h-10"
                            />
                            <Input
                              value={form.settings?.theme?.background_color || '#ffffff'}
                              onChange={(e) => updateFormSettings('theme', 'background_color', e.target.value)}
                              placeholder="#ffffff"
                              className="flex-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="text-color" className="text-sm font-medium text-gray-700">Text Color</Label>
                          <div className="flex items-center gap-3 mt-1">
                            <Input
                              id="text-color"
                              type="color"
                              value={form.settings?.theme?.text_color || '#000000'}
                              onChange={(e) => updateFormSettings('theme', 'text_color', e.target.value)}
                              className="w-16 h-10"
                            />
                            <Input
                              value={form.settings?.theme?.text_color || '#000000'}
                              onChange={(e) => updateFormSettings('theme', 'text_color', e.target.value)}
                              placeholder="#000000"
                              className="flex-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="button-style" className="text-sm font-medium text-gray-700">Button Style</Label>
                          <Select
                            value={form.settings?.theme?.button_style || 'rounded'}
                            onValueChange={(value) => updateFormSettings('theme', 'button_style', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="rounded">Rounded</SelectItem>
                              <SelectItem value="square">Square</SelectItem>
                              <SelectItem value="pill">Pill</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-4 mt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <Label htmlFor="enable-captcha" className="text-sm font-medium text-gray-700">Enable CAPTCHA</Label>
                            <p className="text-xs text-gray-500">Protect against spam submissions</p>
                          </div>
                          <Switch
                            id="enable-captcha"
                            checked={form.settings?.security?.enable_captcha ?? false}
                            onCheckedChange={(checked) => updateFormSettings('security', 'enable_captcha', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <Label htmlFor="rate-limit" className="text-sm font-medium text-gray-700">Enable Rate Limiting</Label>
                            <p className="text-xs text-gray-500">Limit submissions per IP address</p>
                          </div>
                          <Switch
                            id="rate-limit"
                            checked={form.settings?.security?.enable_rate_limit ?? false}
                            onCheckedChange={(checked) => updateFormSettings('security', 'enable_rate_limit', checked)}
                          />
                        </div>

                        {form.settings?.security?.enable_rate_limit && (
                          <div>
                            <Label htmlFor="rate-limit-count" className="text-sm font-medium text-gray-700">Submissions per Hour</Label>
                            <Input
                              id="rate-limit-count"
                              type="number"
                              value={form.settings?.security?.rate_limit_per_hour || 10}
                              onChange={(e) => updateFormSettings('security', 'rate_limit_per_hour', parseInt(e.target.value))}
                              className="mt-1"
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <Label htmlFor="block-ips" className="text-sm font-medium text-gray-700">Block IP Addresses</Label>
                            <p className="text-xs text-gray-500">Restrict specific IP addresses</p>
                          </div>
                          <Switch
                            id="block-ips"
                            checked={form.settings?.security?.block_ip_addresses ?? false}
                            onCheckedChange={(checked) => updateFormSettings('security', 'block_ip_addresses', checked)}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="analytics" className="mt-0">
                      <Card className="border-gray-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-gray-900">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                            Form Analytics
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-6 text-gray-500">
                            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Analytics will be available once your form receives submissions</p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default FormBuilderPage;

