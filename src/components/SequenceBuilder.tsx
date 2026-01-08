import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Clock, Mail, FileTextIcon } from 'lucide-react';
import RichTextEditor from '@/components/editors/RichTextEditor';

interface SequenceStep {
  id?: string;
  subject: string;
  content: string;
  delay_days: number;
  order: number;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
}

interface SequenceBuilderProps {
  initialSteps?: SequenceStep[];
  onStepsChange: (steps: SequenceStep[]) => void;
  templates?: Template[];
  className?: string;
}

const SequenceBuilder = ({ initialSteps, onStepsChange, templates = [], className }: SequenceBuilderProps) => {
  const [steps, setSteps] = useState<SequenceStep[]>(
    initialSteps || [{ subject: '', content: '', delay_days: 0, order: 1 }]
  );

  const addStep = () => {
    const newStep: SequenceStep = {
      subject: '',
      content: '',
      delay_days: 1,
      order: steps.length + 1
    };
    const newSteps = [...steps, newStep];
    setSteps(newSteps);
    onStepsChange(newSteps);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== index);
      // Reorder the remaining steps
      const reorderedSteps = newSteps.map((step, i) => ({ ...step, order: i + 1 }));
      setSteps(reorderedSteps);
      onStepsChange(reorderedSteps);
    }
  };

  const updateStep = useCallback((index: number, field: keyof SequenceStep, value: string | number) => {
    setSteps(prevSteps => {
      const newSteps = [...prevSteps];
      const currentStep = newSteps[index];
      
      // Only update if the value actually changed
      if (currentStep[field] !== value) {
        newSteps[index] = { ...currentStep, [field]: value };
        onStepsChange(newSteps);
        return newSteps;
      }
      
      return prevSteps; // Return the same reference if no change
    });
  }, [onStepsChange]);

  const applyTemplate = (index: number, templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const newSteps = [...steps];
      newSteps[index] = { 
        ...newSteps[index], 
        subject: template.subject,
        content: template.htmlContent 
      };
      setSteps(newSteps);
      onStepsChange(newSteps);
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Custom Email Sequence
          </CardTitle>
          <Button onClick={addStep} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Step
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 bg-hunter-orange text-white rounded-full text-sm font-medium">
                    {step.order}
                  </div>
                  <span className="font-medium">Email {step.order}</span>
                  {index > 0 && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {step.delay_days} day{step.delay_days !== 1 ? 's' : ''} after previous
                    </div>
                  )}
                </div>
                {steps.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeStep(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid gap-4">
                {index > 0 && (
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Delay (days after previous email)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="365"
                      value={step.delay_days}
                      onChange={(e) => updateStep(index, 'delay_days', parseInt(e.target.value) || 0)}
                      className="w-32"
                    />
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Subject Line</Label>
                  <Input
                    placeholder="Enter email subject..."
                    value={step.subject}
                    onChange={(e) => updateStep(index, 'subject', e.target.value)}
                  />
                </div>
                
                {templates.length > 0 && (
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Use Template (Optional)</Label>
                    <Select onValueChange={(templateId) => applyTemplate(index, templateId)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              <FileTextIcon className="h-4 w-4" />
                              {template.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Email Content</Label>
                  <RichTextEditor
                    value={step.content}
                    onChange={(value) => updateStep(index, 'content', value)}
                    placeholder="<p>Hi {{firstName}},</p><p>Your email content here...</p><p><a href='{{unsubscribeUrl}}'>Unsubscribe</a></p>"
                    showVariables={true}
                  />
                </div>
              </div>
            </div>
          ))}
          
          {steps.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No email steps added yet</p>
              <Button onClick={addStep} variant="outline" className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add First Step
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SequenceBuilder;

