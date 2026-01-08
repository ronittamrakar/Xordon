import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FormTemplate } from '@/data/formTemplates';
import { FormRenderer } from '@/components/forms/FormRenderer';

interface TemplatePreviewModalProps {
  template: FormTemplate | null;
  open: boolean;
  onClose: () => void;
  onUseTemplate: (template: FormTemplate) => void;
}

export default function TemplatePreviewModal({
  template,
  open,
  onClose,
  onUseTemplate,
}: TemplatePreviewModalProps) {
  const [viewAllSteps, setViewAllSteps] = useState(false);
  const [previewStyle, setPreviewStyle] = useState<'pagination' | 'accordion' | 'all'>('pagination');

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) {
        setViewAllSteps(false);
        setPreviewStyle('pagination');
      }
      onClose();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{template.name}</DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1">{template.description}</DialogDescription>
            </div>
            <Button onClick={() => onUseTemplate(template)} size="lg">
              Use This Template
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Template Info */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {template.fields} {template.fields === 1 ? 'field' : 'fields'}
              </Badge>
              <Badge variant="secondary">
                {template.type === 'single_page' && 'Single Page'}
                {template.type === 'multi_step' && 'Multi-Step'}
                {template.type === 'accordion' && 'Accordion Style'}
                {template.type === 'multi_page' && 'Multi-Page'}
              </Badge>
              {template.industry && (
                <Badge variant="secondary" className="capitalize">
                  {template.industry.replace('-', ' ')}
                </Badge>
              )}
              {template.comprehensive && (
                <Badge variant="default">Comprehensive</Badge>
              )}
            </div>

            {/* View Style Selection for Multi-Step Forms */}
            {template.type === 'multi_step' && (
              <div className="flex items-center gap-4">
                <Label htmlFor="preview-style" className="text-sm font-medium">Preview Style:</Label>
                <div className="flex bg-muted p-1 rounded-md border">
                  <Button
                    variant={previewStyle === 'pagination' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => {
                      setPreviewStyle('pagination');
                      setViewAllSteps(false);
                    }}
                  >
                    Pagination
                  </Button>
                  <Button
                    variant={previewStyle === 'accordion' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => {
                      setPreviewStyle('accordion');
                      setViewAllSteps(false);
                    }}
                  >
                    Accordion
                  </Button>
                  <Button
                    variant={viewAllSteps ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => {
                      setViewAllSteps(true);
                      setPreviewStyle('all');
                    }}
                  >
                    View All Steps
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Form Preview */}
          <div className="border rounded-lg p-6 bg-muted/30">
            <FormRenderer
              formData={template.formData}
              previewMode={true}
              viewAllSteps={viewAllSteps}
              previewStyle={previewStyle}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
