import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Plus, Trash2, Clock, Mail } from 'lucide-react';

import RichTextEditor from '@/components/editors/RichTextEditor';

interface SequenceStep {
  id?: string;
  subject: string;
  content: string;
  delay_days: number;
  order: number;
}

const SequenceEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('draft');
  const [steps, setSteps] = useState<SequenceStep[]>([
    { subject: '', content: '', delay_days: 0, order: 1 }
  ]);

  const loadSequence = useCallback(async () => {
    try {
      // For now, we'll use placeholder data since the backend doesn't have sequence steps
      setName('Sample Sequence');
      setStatus('draft');
      setSteps([
        { subject: 'Welcome to our service!', content: 'Thank you for signing up...', delay_days: 0, order: 1 },
        { subject: 'Getting started guide', content: 'Here are some tips...', delay_days: 3, order: 2 }
      ]);
    } catch (error) {
      console.error('Failed to load sequence:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sequence. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    if (id) {
      loadSequence();
    }
  }, [id, loadSequence]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a sequence name.',
        variant: 'destructive',
      });
      return;
    }

    if (steps.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one step to the sequence.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      if (id) {
        await api.updateSequence(id, { name, status, steps });
      } else {
        await api.createSequence({ name, status, steps });
      }

      toast({
        title: 'Success',
        description: `Sequence ${id ? 'updated' : 'created'} successfully.`,
      });

      navigate('/sequences');
    } catch (error) {
      console.error('Failed to save sequence:', error);
      toast({
        title: 'Error',
        description: 'Failed to save sequence. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addStep = () => {
    const newStep: SequenceStep = {
      subject: '',
      content: '',
      delay_days: 1,
      order: steps.length + 1
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== index);
      // Reorder the remaining steps
      const reorderedSteps = newSteps.map((step, i) => ({ ...step, order: i + 1 }));
      setSteps(reorderedSteps);
    }
  };

  const updateStep = useCallback((index: number, field: keyof SequenceStep, value: string | number) => {
    setSteps(prevSteps => {
      const newSteps = [...prevSteps];
      const currentStep = newSteps[index];

      // Only update if the value actually changed
      if (currentStep[field] !== value) {
        newSteps[index] = { ...currentStep, [field]: value };
        return newSteps;
      }

      return prevSteps; // Return the same reference if no change
    });
  }, []);

  return (

    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/sequences')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sequences
          </Button>
          <div>
            <h1 className="text-[18px] font-bold tracking-tight">
              {id ? 'Edit Sequence' : 'Create Sequence'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Build automated email sequences to nurture your leads
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Sequence'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Sequence Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Sequence Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="sequence-name">Sequence Name</Label>
              <Input
                id="sequence-name"
                placeholder="e.g., Welcome Series"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sequence-status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sequence Steps */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Email Steps</CardTitle>
            <Button onClick={addStep} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Step {step.order}</span>
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
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-4">
                  {index > 0 && (
                    <div className="grid gap-2">
                      <Label>Delay (days after previous email)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={step.delay_days}
                        onChange={(e) => updateStep(index, 'delay_days', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label>Subject Line</Label>
                    <Input
                      placeholder="Enter email subject..."
                      value={step.subject}
                      onChange={(e) => updateStep(index, 'subject', e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Email Content</Label>
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
          </CardContent>
        </Card>
      </div>
    </div>

  );
};

export default SequenceEditor;
