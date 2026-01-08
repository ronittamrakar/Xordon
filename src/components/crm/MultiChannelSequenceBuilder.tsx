import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Trash2, Clock, Mail, MessageSquare, Linkedin, Phone, 
  GripVertical, ChevronDown, ChevronUp, Settings2, ArrowRight
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Types
export type ChannelType = 'email' | 'sms' | 'linkedin_connect' | 'linkedin_message' | 'call';
export type ConditionType = 'no_reply' | 'opened' | 'clicked' | 'replied' | 'bounced';
export type ConditionOperator = 'and' | 'or';
export type DurationUnit = 'minutes' | 'hours' | 'days';

export interface Duration {
  value: number;
  unit: DurationUnit;
}

export interface SequenceCondition {
  type: ConditionType;
  duration?: Duration;
}

export interface CompoundCondition {
  operator: ConditionOperator;
  conditions: SequenceCondition[];
}

export interface SequenceStep {
  id: string;
  type: ChannelType;
  template?: string;
  message?: string;
  subject?: string;
  script?: string;
  delay?: Duration;
  conditions?: SequenceCondition | CompoundCondition;
}

export interface MultiChannelSequence {
  id?: string;
  name: string;
  description?: string;
  steps: SequenceStep[];
  conditions?: CompoundCondition;
}

interface MultiChannelSequenceBuilderProps {
  initialSequence?: MultiChannelSequence;
  onSequenceChange: (sequence: MultiChannelSequence) => void;
  className?: string;
}

const channelConfig: Record<ChannelType, { label: string; icon: React.ReactNode; color: string }> = {
  email: { label: 'Email', icon: <Mail className="h-4 w-4" />, color: 'bg-blue-500' },
  sms: { label: 'SMS', icon: <MessageSquare className="h-4 w-4" />, color: 'bg-green-500' },
  linkedin_connect: { label: 'LinkedIn Connect', icon: <Linkedin className="h-4 w-4" />, color: 'bg-sky-600' },
  linkedin_message: { label: 'LinkedIn Message', icon: <Linkedin className="h-4 w-4" />, color: 'bg-sky-500' },
  call: { label: 'Call', icon: <Phone className="h-4 w-4" />, color: 'bg-purple-500' },
};

const conditionLabels: Record<ConditionType, string> = {
  no_reply: 'No Reply',
  opened: 'Opened',
  clicked: 'Clicked',
  replied: 'Replied',
  bounced: 'Bounced',
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const MultiChannelSequenceBuilder = ({ 
  initialSequence, 
  onSequenceChange, 
  className 
}: MultiChannelSequenceBuilderProps) => {
  const [sequence, setSequence] = useState<MultiChannelSequence>(
    initialSequence || { name: '', steps: [] }
  );
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const updateSequence = useCallback((updates: Partial<MultiChannelSequence>) => {
    setSequence(prev => {
      const updated = { ...prev, ...updates };
      onSequenceChange(updated);
      return updated;
    });
  }, [onSequenceChange]);

  const addStep = (type: ChannelType) => {
    const newStep: SequenceStep = {
      id: generateId(),
      type,
      delay: { value: 1, unit: 'days' },
    };
    updateSequence({ steps: [...sequence.steps, newStep] });
    setExpandedSteps(prev => new Set([...prev, newStep.id]));
  };

  const removeStep = (index: number) => {
    const newSteps = sequence.steps.filter((_, i) => i !== index);
    updateSequence({ steps: newSteps });
  };

  const updateStep = (index: number, updates: Partial<SequenceStep>) => {
    const newSteps = [...sequence.steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    updateSequence({ steps: newSteps });
  };

  const toggleStepExpanded = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newSteps = [...sequence.steps];
    const draggedStep = newSteps[draggedIndex];
    newSteps.splice(draggedIndex, 1);
    newSteps.splice(index, 0, draggedStep);
    
    setDraggedIndex(index);
    updateSequence({ steps: newSteps });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const renderStepContent = (step: SequenceStep, index: number) => {
    switch (step.type) {
      case 'email':
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Subject Line</Label>
              <Input
                placeholder="Enter email subject..."
                value={step.subject || ''}
                onChange={(e) => updateStep(index, { subject: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Email Content</Label>
              <Textarea
                placeholder="Enter email content... Use {{firstName}}, {{lastName}}, {{company}} for personalization"
                value={step.template || ''}
                onChange={(e) => updateStep(index, { template: e.target.value })}
                rows={4}
              />
            </div>
          </div>
        );
      
      case 'sms':
        return (
          <div className="grid gap-2">
            <Label>SMS Message</Label>
            <Textarea
              placeholder="Enter SMS message... (160 characters recommended)"
              value={step.message || ''}
              onChange={(e) => updateStep(index, { message: e.target.value })}
              rows={3}
              maxLength={320}
            />
            <p className="text-xs text-muted-foreground">
              {(step.message || '').length}/320 characters
            </p>
          </div>
        );
      
      case 'linkedin_connect':
        return (
          <div className="grid gap-2">
            <Label>Connection Request Message</Label>
            <Textarea
              placeholder="Enter connection request message... (300 characters max)"
              value={step.message || ''}
              onChange={(e) => updateStep(index, { message: e.target.value })}
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground">
              {(step.message || '').length}/300 characters
            </p>
          </div>
        );
      
      case 'linkedin_message':
        return (
          <div className="grid gap-2">
            <Label>LinkedIn Message</Label>
            <Textarea
              placeholder="Enter LinkedIn message..."
              value={step.message || ''}
              onChange={(e) => updateStep(index, { message: e.target.value })}
              rows={4}
            />
          </div>
        );
      
      case 'call':
        return (
          <div className="grid gap-2">
            <Label>Call Script / Notes</Label>
            <Textarea
              placeholder="Enter call script or talking points..."
              value={step.script || ''}
              onChange={(e) => updateStep(index, { script: e.target.value })}
              rows={4}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderConditionEditor = (step: SequenceStep, index: number) => {
    const condition = step.conditions as SequenceCondition | undefined;
    const hasCondition = !!condition?.type;

    return (
      <div className="border-t pt-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <Label className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Conditional Logic
          </Label>
          <Switch
            checked={hasCondition}
            onCheckedChange={(checked) => {
              if (checked) {
                updateStep(index, { 
                  conditions: { type: 'no_reply', duration: { value: 3, unit: 'days' } } 
                });
              } else {
                updateStep(index, { conditions: undefined });
              }
            }}
          />
        </div>
        
        {hasCondition && condition && (
          <div className="grid gap-3 pl-4 border-l-2 border-muted">
            <div className="grid gap-2">
              <Label className="text-sm">Execute this step when</Label>
              <Select
                value={condition.type}
                onValueChange={(value: ConditionType) => 
                  updateStep(index, { 
                    conditions: { ...condition, type: value } 
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(conditionLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {condition.type === 'no_reply' && (
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">After</Label>
                <Input
                  type="number"
                  min="1"
                  className="w-20"
                  value={condition.duration?.value || 3}
                  onChange={(e) => updateStep(index, {
                    conditions: {
                      ...condition,
                      duration: { 
                        value: parseInt(e.target.value) || 1, 
                        unit: condition.duration?.unit || 'days' 
                      }
                    }
                  })}
                />
                <Select
                  value={condition.duration?.unit || 'days'}
                  onValueChange={(value: DurationUnit) => updateStep(index, {
                    conditions: {
                      ...condition,
                      duration: { 
                        value: condition.duration?.value || 3, 
                        unit: value 
                      }
                    }
                  })}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Multi-Channel Sequence Builder
          </CardTitle>
          <CardDescription>
            Create automated outreach sequences across email, SMS, LinkedIn, and calls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sequence Name & Description */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Sequence Name</Label>
              <Input
                placeholder="e.g., New Lead Outreach"
                value={sequence.name}
                onChange={(e) => updateSequence({ name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Description (Optional)</Label>
              <Input
                placeholder="Brief description of this sequence..."
                value={sequence.description || ''}
                onChange={(e) => updateSequence({ description: e.target.value })}
              />
            </div>
          </div>

          {/* Channel Type Selector */}
          <div className="grid gap-2">
            <Label>Add Step</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(channelConfig).map(([type, config]) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  onClick={() => addStep(type as ChannelType)}
                  className="gap-2"
                >
                  <span className={`p-1 rounded text-white ${config.color}`}>
                    {config.icon}
                  </span>
                  {config.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            {sequence.steps.map((step, index) => {
              const config = channelConfig[step.type];
              const isExpanded = expandedSteps.has(step.id);
              
              return (
                <div
                  key={step.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`border rounded-lg transition-all ${
                    draggedIndex === index ? 'opacity-50 border-dashed' : ''
                  }`}
                >
                  <Collapsible open={isExpanded} onOpenChange={() => toggleStepExpanded(step.id)}>
                    <div className="flex items-center gap-3 p-3">
                      <div className="cursor-grab hover:bg-muted rounded p-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                        {index + 1}
                      </div>
                      
                      <Badge variant="secondary" className={`gap-1 ${config.color} text-white`}>
                        {config.icon}
                        {config.label}
                      </Badge>
                      
                      {index > 0 && step.delay && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {step.delay.value} {step.delay.unit} after previous
                        </div>
                      )}
                      
                      {step.conditions && (
                        <Badge variant="outline" className="gap-1">
                          <Settings2 className="h-3 w-3" />
                          Conditional
                        </Badge>
                      )}
                      
                      <div className="flex-1" />
                      
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-4">
                        {/* Delay Configuration */}
                        {index > 0 && (
                          <div className="flex items-center gap-2">
                            <Label className="text-sm whitespace-nowrap">Wait</Label>
                            <Input
                              type="number"
                              min="0"
                              className="w-20"
                              value={step.delay?.value || 1}
                              onChange={(e) => updateStep(index, {
                                delay: { 
                                  value: parseInt(e.target.value) || 0, 
                                  unit: step.delay?.unit || 'days' 
                                }
                              })}
                            />
                            <Select
                              value={step.delay?.unit || 'days'}
                              onValueChange={(value: DurationUnit) => updateStep(index, {
                                delay: { 
                                  value: step.delay?.value || 1, 
                                  unit: value 
                                }
                              })}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="minutes">Minutes</SelectItem>
                                <SelectItem value="hours">Hours</SelectItem>
                                <SelectItem value="days">Days</SelectItem>
                              </SelectContent>
                            </Select>
                            <span className="text-sm text-muted-foreground">after previous step</span>
                          </div>
                        )}
                        
                        {/* Step-specific content */}
                        {renderStepContent(step, index)}
                        
                        {/* Condition Editor */}
                        {renderConditionEditor(step, index)}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {sequence.steps.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <ArrowRight className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">No steps added yet</p>
              <p className="text-sm text-muted-foreground">
                Click one of the channel buttons above to add your first step
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiChannelSequenceBuilder;
