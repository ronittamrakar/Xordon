import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { webformsApi } from '@/services/webformsApi';
import {
  ArrowLeft,
  Edit3,
  Share2,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FieldRenderer } from '@/components/webforms/form-builder/FieldRenderer';

export default function WebFormPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: formData, isLoading, error } = useQuery({
    queryKey: ['webform', id],
    queryFn: () => webformsApi.getForm(id!),
    enabled: !!id,
  });

  const form = formData?.data;

  const shareUrl = `${window.location.origin}/f/${id}`;
  const [submissionData, setSubmissionData] = useState<Record<string, any>>({});

  // Ensure field list and derived memo are available regardless of loading state
  const fields = form?.fields || [];

  const requiredFieldIds = useMemo(
    () => new Set(fields.filter((f: any) => f.required).map((f: any) => f.id)),
    [fields]
  );

  const { mutateAsync: submitForm, isPending: isSubmitting } = useMutation({
    mutationFn: (data: Record<string, any>) => webformsApi.submitForm(id!, data),
    onSuccess: () => {
      toast.success('Form submitted successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to submit form');
    },
  });

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="p-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Form not found</h3>
            <p className="text-muted-foreground mb-4">
              The form you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={() => navigate('/forms/forms')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  const handleInputChange = (fieldId: string | number, value: any) => {
    setSubmissionData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const fillDummyData = () => {
    const dummy: Record<string, any> = {};
    fields.forEach((field: any, idx: number) => {
      const type = (field as any).type || (field as any).field_type;
      const fid = field.id;
      if (type === 'email') dummy[fid] = `jane.doe+${idx}@example.com`;
      else if (type === 'phone') dummy[fid] = '+1 555 123 4567';
      else if (type === 'number') dummy[fid] = 42;
      else if (type === 'textarea') dummy[fid] = 'This is a sample message for testing.';
      else if (type === 'select' || type === 'dropdown' || type === 'radio') {
        const first = field.options?.[0];
        dummy[fid] = typeof first === 'string' ? first : first?.value || 'Option 1';
      } else if (type === 'checkbox' || type === 'toggle' || type === 'yes_no') {
        dummy[fid] = true;
      } else {
        dummy[fid] = field.placeholder || `Sample ${field.label || fid}`;
      }
    });
    setSubmissionData(dummy);
    toast.info('Filled with dummy data');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const fid of requiredFieldIds) {
      const value = submissionData[fid];
      if (value === undefined || value === null || value === '') {
        const field = fields.find((f: any) => f.id === fid);
        toast.error(`Please fill in "${field?.label || 'Required field'}"`);
        return;
      }
    }
    await submitForm(submissionData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/forms/forms')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{form.title}</h1>
              <Badge variant={form.status === 'published' ? 'default' : 'secondary'}>
                {form.status}
              </Badge>
            </div>
            {form.description && (
              <p className="text-muted-foreground">{form.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={fillDummyData}>
            <Share2 className="h-4 w-4 mr-2" />
            Fill Dummy Data
          </Button>
          <Button variant="outline" onClick={copyShareLink}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          <Button variant="outline" asChild>
            <a href={`/f/${id}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open
            </a>
          </Button>
          <Button asChild>
            <Link to={`/forms/builder/${id}`}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Form Preview */}
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{form.title}</CardTitle>
            {form.description && <CardDescription>{form.description}</CardDescription>}
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  This form has no fields yet.
                </div>
              ) : (
                fields.map((field, index) => (
                  <FieldRenderer
                    key={field.id}
                    field={field as any}
                    value={submissionData[field.id]}
                    onChange={(value) => handleInputChange(field.id, value)}
                    allValues={submissionData}
                    onFieldChange={handleInputChange}
                    designSettings={form.settings?.design || {}}
                    showLabel={true}
                    showDescription={true}
                    fieldNumber={index + 1}
                  />
                ))
              )}

              {fields.length > 0 && (
                <Button className="w-full" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
