import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Clock, Mail, MessageSquare, FileTextIcon } from 'lucide-react';
import RichTextEditor from '@/components/editors/RichTextEditor';
import { useToast } from '@/hooks/use-toast';

export interface CombinedFollowUpStep {
  id?: string;
  type: 'email' | 'sms';
  subject?: string; // Only for email
  content: string;
  delayDays: number;
  delayHours?: number; // Only for SMS
  order: number;
}

interface Template {
  id: string;
  name: string;
  subject?: string;
  content: string;
  type: 'email' | 'sms';
}

interface CombinedFollowUpBuilderProps {
  initialSteps?: CombinedFollowUpStep[];
  onStepsChange: (steps: CombinedFollowUpStep[]) => void;
  emailTemplates?: Template[];
  smsTemplates?: Template[];
  className?: string;
  maxFollowUps?: number;
}

const CombinedFollowUpBuilder = ({ 
  initialSteps, 
  onStepsChange, 
  emailTemplates = [], 
  smsTemplates = [],
  className,
  maxFollowUps = 10 
}: CombinedFollowUpBuilderProps) => {
  const [steps, setSteps] = useState<CombinedFollowUpStep[]>(
    initialSteps || []
  );
  const { toast } = useToast();

  const addFollowUp = (type: 'email' | 'sms') => {
    if (steps.length >= maxFollowUps) {
      toast({
        title: 'Limit Reached',
        description: `Maximum ${maxFollowUps} follow-ups allowed`,
        variant: 'destructive',
      });
      return;
    }
    
    const newStep: CombinedFollowUpStep = {
      type,
      subject: type === 'email' ? '' : undefined,
      content: '',
      delayDays: steps.length === 0 ? 1 : 3,
      delayHours: type === 'sms' ? 0 : undefined,
      order: steps.length + 1
    };
    const newSteps = [...steps, newStep];
    setSteps(newSteps);
    onStepsChange(newSteps);
  };

  const removeFollowUp = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Reorder the remaining steps
    const reorderedSteps = newSteps.map((step, i) => ({ ...step, order: i + 1 }));
    setSteps(reorderedSteps);
    onStepsChange(reorderedSteps);
  };

  const updateStep = useCallback((index: number, field: keyof CombinedFollowUpStep, value: string | number) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
    onStepsChange(newSteps);
  }, [steps, onStepsChange]);

  const applyTemplate = (index: number, templateId: string) => {
    const step = steps[index];
    const templates = step.type === 'email' ? emailTemplates : smsTemplates;
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      updateStep(index, 'content', template.content);
      if (step.type === 'email' && template.subject) {
        updateStep(index, 'subject', template.subject);
      }
    }
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return;
    }

    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap the steps
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    
    // Update order numbers
    newSteps[index].order = index + 1;
    newSteps[targetIndex].order = targetIndex + 1;
    
    setSteps(newSteps);
    onStepsChange(newSteps);
  };

  const getStepIcon = (type: 'email' | 'sms') => {
    return type === 'email' ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />;
  };

  const getStepColor = (type: 'email' | 'sms') => {
    return type === 'email' ? 'bg-blue-500' : 'bg-green-500';
  };

  const formatDelay = (step: CombinedFollowUpStep, index: number) => {
    if (index === 0) return 'Immediate';
    
    const { delayDays, delayHours = 0 } = step;
    if (delayDays === 0 && delayHours === 0) return 'Immediate';
    if (delayDays === 0) return `${delayHours}h`;
    if (delayHours === 0) return `${delayDays}d`;
    return `${delayDays}d ${delayHours}h`;
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Mail className="h-5 w-5" />
              <MessageSquare className="h-5 w-5" />
            </div>
            Combined Email & SMS Follow-ups
            <span className="text-sm font-normal text-muted-foreground">
              ({steps.length}/{maxFollowUps} follow-ups)
            </span>
          </CardTitle>
          <div className="flex gap-2">
            {steps.length < maxFollowUps && (
              <>
                <Button onClick={() => addFollowUp('email')} size="sm" variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Add Email
                </Button>
                <Button onClick={() => addFollowUp('sms')} size="sm" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add SMS
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {steps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Mail className="h-12 w-12 opacity-50" />
                <MessageSquare className="h-12 w-12 opacity-50" />
              </div>
              <p className="mb-2">No follow-ups added yet</p>
              <p className="text-sm mb-4">Create a mixed sequence of email and SMS follow-ups</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => addFollowUp('email')} variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Add Email Follow-up
                </Button>
                <Button onClick={() => addFollowUp('sms')} variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add SMS Follow-up
                </Button>
              </div>
            </div>
          ) : (
            steps.map((step, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center justify-center w-8 h-8 ${getStepColor(step.type)} text-white rounded-full text-sm font-medium`}>
                      {step.order}
                    </div>
                    <Badge variant={step.type === 'email' ? 'default' : 'secondary'} className="flex items-center gap-1">
                      {getStepIcon(step.type)}
                      {step.type.toUpperCase()}
                    </Badge>
                    <span className="font-medium">
                      {step.type === 'email' ? 'Email' : 'SMS'} Follow-up {step.order}
                    </span>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDelay(step, index)} after {index === 0 ? 'initial contact' : 'previous step'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStep(index, 'up')}
                        title="Move up"
                      >
                        ↑
                      </Button>
                    )}
                    {index < steps.length - 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStep(index, 'down')}
                        title="Move down"
                      >
                        ↓
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFollowUp(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid gap-4">
                  {/* Delay Configuration */}
                  {index > 0 && (
                    <div className="grid gap-2">
                      <Label className="text-sm font-medium">
                        Delay after {index === 0 ? 'initial contact' : 'previous step'}
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">Days</Label>
                          <Select 
                            value={step.delayDays.toString()} 
                            onValueChange={(value) => updateStep(index, 'delayDays', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 30 }, (_, i) => i).map((day) => (
                                <SelectItem key={day} value={day.toString()}>
                                  {day} day{day !== 1 ? 's' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {step.type === 'sms' && (
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">Hours</Label>
                            <Select 
                              value={(step.delayHours || 0).toString()} 
                              onValueChange={(value) => updateStep(index, 'delayHours', parseInt(value))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                  <SelectItem key={hour} value={hour.toString()}>
                                    {hour} hour{hour !== 1 ? 's' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Email Subject (only for email steps) */}
                  {step.type === 'email' && (
                    <div className="grid gap-2">
                      <Label className="text-sm font-medium">Subject Line</Label>
                      <Input
                        placeholder="Enter email subject..."
                        value={step.subject || ''}
                        onChange={(e) => updateStep(index, 'subject', e.target.value)}
                      />
                    </div>
                  )}
                  
                  {/* Template Selection */}
                  {((step.type === 'email' && emailTemplates.length > 0) || 
                    (step.type === 'sms' && smsTemplates.length > 0)) && (
                    <div className="grid gap-2">
                      <Label className="text-sm font-medium">Use Template (Optional)</Label>
                      <Select onValueChange={(value) => applyTemplate(index, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${step.type} template...`} />
                        </SelectTrigger>
                        <SelectContent>
                          {(step.type === 'email' ? emailTemplates : smsTemplates).map((template) => (
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
                  
                  {/* Content */}
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">
                      {step.type === 'email' ? 'Email Content' : 'SMS Message'}
                    </Label>
                    {step.type === 'email' ? (
                      <RichTextEditor
                        value={step.content}
                        onChange={(value) => updateStep(index, 'content', value)}
                        placeholder="<p>Hi {{firstName}},</p><p>Following up on my previous message...</p><p><a href='{{unsubscribeUrl}}'>Unsubscribe</a></p>"
                        showVariables={true}
                      />
                    ) : (
                      <div className="space-y-2">
                        <Textarea
                          value={step.content}
                          onChange={(e) => updateStep(index, 'content', e.target.value)}
                          placeholder="Hi {{firstName}}, following up on my previous message..."
                          rows={3}
                          maxLength={160}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Available variables: {'{firstName}'}, {'{lastName}'}, {'{company}'}</span>
                          <span>{step.content.length}/160 characters</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {steps.length > 0 && steps.length < maxFollowUps && (
            <div className="text-center pt-4 border-t">
              <div className="flex gap-2 justify-center">
                <Button onClick={() => addFollowUp('email')} variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Add Email ({steps.filter(s => s.type === 'email').length})
                </Button>
                <Button onClick={() => addFollowUp('sms')} variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add SMS ({steps.filter(s => s.type === 'sms').length})
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {steps.length}/{maxFollowUps} follow-ups used
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CombinedFollowUpBuilder;

