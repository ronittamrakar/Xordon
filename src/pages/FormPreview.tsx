import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ExternalLink, Copy, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { api, Form, FormField } from '@/lib/api';

const FormPreview = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, string | number | boolean>>({});

  useEffect(() => {
    if (formId) {
      fetchForm();
    }
  }, [formId]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const response = await api.getForm(formId!);
      setForm(response);
    } catch (error) {
      console.error('Failed to fetch form:', error);
      toast.error('Failed to load form');
      navigate('/forms');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const copyFormUrl = () => {
    const url = `${window.location.origin}/forms/${formId}/submit`;
    navigator.clipboard.writeText(url);
    toast.success('Form URL copied to clipboard');
  };

  const openFormInNewTab = () => {
    window.open(`/forms/${formId}/submit`, '_blank');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading form...</div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Form not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/forms')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Opt-in Forms</span>
          </Button>
          <div>
            <h1 className="text-[18px] font-bold">{form.title}</h1>
            <p className="text-gray-600">{form.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyFormUrl}
            className="flex items-center space-x-2"
          >
            <Copy className="h-4 w-4" />
            <span>Copy URL</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openFormInNewTab}
            className="flex items-center space-x-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open Form</span>
          </Button>
        </div>
      </div>

      {/* Form Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Form Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Form Name</Label>
              <p className="text-sm text-gray-900">{form.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Status</Label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                form.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {form.status}
              </span>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Created</Label>
              <p className="text-sm text-gray-900">
                {new Date(form.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Public URL</Label>
              <p className="text-sm text-blue-600 break-all">
                {window.location.origin}/forms/{formId}/submit
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardHeader>
            <CardTitle>{form.title}</CardTitle>
            {form.description && (
              <p className="text-sm text-gray-600">{form.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {form.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label className="flex items-center">
                    {field.label}
                    {field.required ? <span className="text-red-500 ml-1">*</span> : null}
                  </Label>
                  
                  {field.type === 'text' && (
                    <Input
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      value={String(formData[field.name] || '')}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                    />
                  )}
                  
                  {field.type === 'email' && (
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={String(formData[field.name] || '')}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                    />
                  )}
                  
              {field.type === 'number' && (
                <Input
                  type="number"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  value={String(formData[field.name] || '')}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                />
              )}

              {field.type === 'date' && (
                <Input
                  type="date"
                  value={String(formData[field.name] || '')}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                />
              )}

              {field.type === 'time' && (
                <Input
                  type="time"
                  value={String(formData[field.name] || '')}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                />
              )}

              {field.type === 'url' && (
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={String(formData[field.name] || '')}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                />
              )}

              {field.type === 'tel' && (
                <Input
                  type="tel"
                  placeholder="+1 555-555-5555"
                  value={String(formData[field.name] || '')}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                />
              )}

              {field.type === 'textarea' && (
                <Textarea
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  value={String(formData[field.name] || '')}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  rows={3}
                />
              )}
                  
                  {field.type === 'select' && (
                    <Select
                      value={String(formData[field.name] || '')}
                      onValueChange={(value) => handleInputChange(field.name, value)}
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
                  )}
                  
                  {field.type === 'checkbox' && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`preview-${field.name}`}
                        checked={Boolean(formData[field.name])}
                        onChange={(e) => handleInputChange(field.name, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`preview-${field.name}`}>
                        Check this box
                      </Label>
                    </div>
                  )}
                  
                  {field.type === 'radio' && (
                    <div className="space-y-2">
                      {field.options?.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`preview-${field.name}-${index}`}
                            name={`preview-${field.name}`}
                            value={option}
                            checked={String(formData[field.name]) === option}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            className="border-gray-300"
                          />
                          <Label htmlFor={`preview-${field.name}-${index}`}>{option}</Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {form.fields.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No fields configured for this form</p>
                </div>
              )}
              
              {form.fields.length > 0 && (
                <Button className="w-full" disabled>
                  Submit (Preview Mode)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormPreview;
