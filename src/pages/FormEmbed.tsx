import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { api, type Form, type FormField, type FormStep } from '@/lib/api';
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

export default function FormEmbed() {
  const { formId } = useParams<{ formId: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [formData, setFormData] = useState<Record<string, string | number | boolean | FileList>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const fetchForm = useCallback(async () => {
    try {
      const response = await api.getPublicForm(formId!);
      setForm(response);
      const initial: Record<string, string | number | boolean | FileList> = {};
      response.fields.forEach((f) => {
        if (f.type === 'checkbox') {
          initial[f.id] = false;
        } else if (f.type === 'file') {
          initial[f.id] = new DataTransfer().files; // Empty FileList
        } else {
          initial[f.id] = '';
        }
      });
      setFormData(initial);
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    if (formId) fetchForm();
  }, [formId, fetchForm]);

  const handleInputChange = (fieldId: string, value: string | number | boolean | FileList) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
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
      if (field.required) {
        const v = formData[field.id];
        if (!v || (typeof v === 'string' && v.trim() === '')) {
          return false;
        }
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep() && form && form.steps && currentStep < form.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else if (!form?.is_multi_step) {
      handleSubmit(new Event('submit') as Event);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    for (const f of form.fields) {
      if (f.required) {
        const v = formData[f.id];
        if (!v || (typeof v === 'string' && v.trim() === '')) {
          return;
        }
      }
    }
    setSubmitting(true);
    try {
      await api.submitFormResponse(formId!, formData);
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const v = formData[field.id];
    switch (field.type) {
      case 'text':
        return <Input value={String(v || '')} onChange={(e) => handleInputChange(field.id, e.target.value)} required={field.required} />;
      case 'email':
        return <Input type="email" value={String(v || '')} onChange={(e) => handleInputChange(field.id, e.target.value)} required={field.required} />;
      case 'number':
        return <Input type="number" value={String(v || '')} onChange={(e) => handleInputChange(field.id, e.target.value)} required={field.required} />;
      case 'date':
        return <Input type="date" value={String(v || '')} onChange={(e) => handleInputChange(field.id, e.target.value)} required={field.required} />;
      case 'time':
        return <Input type="time" value={String(v || '')} onChange={(e) => handleInputChange(field.id, e.target.value)} required={field.required} />;
      case 'url':
        return <Input type="url" value={String(v || '')} onChange={(e) => handleInputChange(field.id, e.target.value)} required={field.required} />;
      case 'tel':
        return <Input type="tel" value={String(v || '')} onChange={(e) => handleInputChange(field.id, e.target.value)} required={field.required} />;
      case 'textarea':
        return <Textarea value={String(v || '')} onChange={(e) => handleInputChange(field.id, e.target.value)} required={field.required} rows={4} />;
      case 'select':
        return (
          <Select value={String(v || '')} onValueChange={(val) => handleInputChange(field.id, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt, i) => (
                <SelectItem key={i} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox id={field.id} checked={Boolean(v)} onCheckedChange={(c) => handleInputChange(field.id, c === true)} />
            <Label htmlFor={field.id}>{field.label}</Label>
          </div>
        );
      case 'radio':
        return (
          <RadioGroup value={String(v || '')} onValueChange={(val) => handleInputChange(field.id, val)}>
            {field.options?.map((opt, i) => (
              <div key={i} className="flex items-center space-x-2">
                <RadioGroupItem value={opt} id={`${field.id}-${i}`} />
                <Label htmlFor={`${field.id}-${i}`}>{opt}</Label>
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
                Accepted: {field.accept}
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
    return <div className="p-4 text-sm">Loading...</div>;
  }

  if (!form || form.status !== 'active') {
    return <div className="p-4 text-sm">Form unavailable</div>;
  }

  if (submitted) {
    return (
      <div className="p-4">
        <Card className="shadow-none border">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
              <p className="text-sm text-gray-600">
                Your response has been submitted successfully.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-2">
      <Card className="shadow-none border">
        <CardHeader>
          <CardTitle className="text-base">{form.title}</CardTitle>
          {form.description && <CardDescription className="text-sm">{form.description}</CardDescription>}
          
          {form.is_multi_step && form.steps && form.steps.length > 0 && (
            <div className="flex items-center justify-center mt-3">
              <div className="flex space-x-1">
                {form.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      index <= currentStep 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index < currentStep ? <CheckCircle className="w-3 h-3" /> : index + 1}
                    </div>
                    {index < form.steps!.length - 1 && (
                      <div className={`w-6 h-0.5 mx-1 ${
                        index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {form.is_multi_step && form.steps && form.steps[currentStep] && (
            <div className="text-center mt-3">
              <h4 className="text-sm font-medium">{form.steps[currentStep].title}</h4>
              {form.steps[currentStep].description && (
                <p className="text-xs text-gray-600 mt-1">
                  {form.steps[currentStep].description}
                </p>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {getCurrentStepFields().map((f) => (
              <div key={f.id} className="space-y-2">
                {f.type !== 'checkbox' && (
                  <Label htmlFor={f.id} className="text-sm">
                    {f.label}
                    {f.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                )}
                {renderField(f)}
              </div>
            ))}
            
            <div className="flex gap-2">
              {form.is_multi_step && currentStep > 0 && (
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={handlePrevStep}
                  className="flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Prev
                </Button>
              )}
              
              <Button 
                type={form.is_multi_step && currentStep < (form.steps?.length || 1) - 1 ? "button" : "submit"} 
                size="sm"
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
                      <ArrowRight className="w-3 h-3 ml-1" />
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
  );
}
