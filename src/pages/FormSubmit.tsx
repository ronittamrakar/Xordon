import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { api, type Form, type FormField, type FormStep } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useCampaignSettings } from '@/hooks/useCampaignSettings';
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

export default function FormSubmit() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [formData, setFormData] = useState<Record<string, string | number | boolean | FileList>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();
  const { settings: campaignSettings } = useCampaignSettings();

  const fetchForm = useCallback(async () => {
    try {
      const response = await api.get(`/forms/${formId}/public`) as { data: Form };
      setForm(response.data);
      
      // Initialize form data with default values
      const initialData: Record<string, string | number | boolean | FileList> = {};
      response.data.fields.forEach((field: FormField) => {
        if (field.type === 'checkbox') {
          initialData[field.id] = false;
        } else if (field.type === 'file') {
          initialData[field.id] = new DataTransfer().files; // Empty FileList
        } else {
          initialData[field.id] = '';
        }
      });
      setFormData(initialData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Form not found or is no longer available',
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [formId, toast, navigate]);

  useEffect(() => {
    if (formId) {
      fetchForm();
    }
  }, [formId, fetchForm]);

  const handleInputChange = (fieldId: string, value: string | number | boolean | FileList) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const getCurrentStepFields = () => {
    if (!form?.is_multi_step || !form.steps || form.steps.length === 0) {
      return form?.fields || [];
    }
    
    const currentStepData = form.steps[currentStep];
    if (!currentStepData) return [];
    
    return form.fields.filter(field => 
      currentStepData.fields.includes(field.id)
    );
  };

  const validateCurrentStep = () => {
    const currentFields = getCurrentStepFields();
    for (const field of currentFields) {
      if (field.required && !formData[field.id]) {
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep() && form && form.steps && currentStep < form.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else if (!form?.is_multi_step) {
      handleSubmit();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const validateForm = () => {
    if (!form) return false;

    for (const field of form.fields) {
      if (field.required) {
        const value = formData[field.id];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          toast({
            title: 'Validation Error',
            description: `${field.label} is required`,
            variant: 'destructive',
          });
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Submit form response with centralized settings
      const submissionData = {
        ...formData,
        settings: {
          enableNotifications: campaignSettings.forms.enableNotifications,
          notificationEmail: campaignSettings.forms.notificationEmail,
          autoReplyEnabled: campaignSettings.forms.autoReplyEnabled,
          autoReplySubject: campaignSettings.forms.autoReplySubject,
          autoReplyMessage: campaignSettings.forms.autoReplyMessage,
          enableSpamProtection: campaignSettings.forms.enableSpamProtection,
          spamKeywords: campaignSettings.forms.spamKeywords,
        }
      };
      
      await api.submitFormResponse(formId!, submissionData);

      setSubmitted(true);
      toast({
        title: 'Success',
        description: campaignSettings.forms.autoReplyEnabled 
          ? 'Your response has been submitted successfully! You will receive a confirmation email shortly.'
          : 'Your response has been submitted successfully!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit form. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id];

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={String(value || '')}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            value={String(value || '')}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={String(value || '')}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={String(value || '')}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
          />
        );

      case 'time':
        return (
          <Input
            type="time"
            value={String(value || '')}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            value={String(value || '')}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
          />
        );

      case 'tel':
        return (
          <Input
            type="tel"
            value={String(value || '')}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={String(value || '')}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            rows={4}
          />
        );

      case 'select':
        return (
          <Select
            value={String(value || '')}
            onValueChange={(val) => handleInputChange(field.id, val)}
            required={field.required}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleInputChange(field.id, checked === true)}
            />
            <Label htmlFor={field.id}>{field.label}</Label>
          </div>
        );

      case 'radio':
        return (
          <RadioGroup
            value={String(value || '')}
            onValueChange={(val) => handleInputChange(field.id, val)}
          >
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <Input
              type="file"
              accept={field.accept}
              multiple={field.multiple}
              onChange={(e) => handleInputChange(field.id, e.target.files)}
              required={field.required}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {field.accept && (
              <p className="text-sm text-gray-500">
                Accepted file types: {field.accept}
              </p>
            )}
            {field.multiple && (
              <p className="text-sm text-gray-500">
                Multiple files allowed
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-[16px] font-semibold mb-2">Form Not Found</h2>
              <p className="text-muted-foreground">
                The form you're looking for doesn't exist or is no longer available.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-[16px] font-semibold mb-2">Thank You!</h2>
              <p className="text-muted-foreground">
                Your response has been submitted successfully.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-[18px]">{form.title}</CardTitle>
            {form.description && (
              <CardDescription className="text-base">
                {form.description}
              </CardDescription>
            )}
            {form.is_multi_step && form.steps && form.steps.length > 0 && (
              <div className="flex items-center justify-center mt-4">
                <div className="flex space-x-2">
                  {form.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        index <= currentStep 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index < currentStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
                      </div>
                      {index < form.steps!.length - 1 && (
                        <div className={`w-12 h-1 mx-2 ${
                          index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {form.is_multi_step && form.steps && form.steps[currentStep] && (
              <div className="text-center mt-4">
                <h3 className="text-lg font-medium">{form.steps[currentStep].title}</h3>
                {form.steps[currentStep].description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {form.steps[currentStep].description}
                  </p>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {getCurrentStepFields().map((field) => (
                <div key={field.id} className="space-y-2">
                  {field.type !== 'checkbox' && (
                    <Label htmlFor={field.id}>
                      {field.label}
                      {field.required ? <span className="text-red-500 ml-1">*</span> : null}
                    </Label>
                  )}
                  {renderField(field)}
                </div>
              ))}
              
              <div className="pt-4 flex gap-3">
                {form.is_multi_step && currentStep > 0 && (
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={handlePrevStep}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Button>
                )}
                
                <Button 
                  type={form.is_multi_step && currentStep < (form.steps?.length || 1) - 1 ? "button" : "submit"} 
                  className="flex-1" 
                  disabled={submitting}
                  onClick={form.is_multi_step && currentStep < (form.steps?.length || 1) - 1 ? handleNextStep : undefined}
                >
                  {submitting ? (
                    'Submitting...'
                  ) : form.is_multi_step ? (
                    currentStep < (form.steps?.length || 1) - 1 ? (
                      <>
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      'Submit'
                    )
                  ) : (
                    'Submit'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
