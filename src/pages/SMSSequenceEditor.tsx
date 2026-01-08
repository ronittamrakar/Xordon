import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, GripVertical, Save, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { api, type SMSSequence as ApiSMSSequence } from '@/lib/api';
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SMSStep {
  id: string;
  message: string;
  delayDays: number;
  delayHours: number;
  order: number;
}

interface SMSSequence {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'inactive' | 'draft';
  steps: SMSStep[];
  createdAt: string;
  updatedAt: string;
  subscriberCount: number;
  completionRate: number;
  group?: string;
}

// Sortable Step Component
const SortableStep = ({ step, index, onUpdate, onRemove }: {
  step: SMSStep;
  index: number;
  onUpdate: (stepId: string, field: keyof SMSStep, value: string | number) => void;
  onRemove: (stepId: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg p-4 bg-card">
      <div className="flex items-start space-x-4">
        <div
          {...attributes}
          {...listeners}
          className="mt-2 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline">Step {step.order}</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(step.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <Label>Message</Label>
            <Textarea
              value={step.message}
              onChange={(e) => onUpdate(step.id, 'message', e.target.value)}
              placeholder="Enter your SMS message"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {step.message.length}/160 characters
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Delay (Days)</Label>
              <Input
                type="number"
                min="0"
                value={step.delayDays}
                onChange={(e) => onUpdate(step.id, 'delayDays', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Delay (Hours)</Label>
              <Input
                type="number"
                min="0"
                max="23"
                value={step.delayHours}
                onChange={(e) => onUpdate(step.id, 'delayHours', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SMSSequenceEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;
  const [sequence, setSequence] = useState<SMSSequence>({
    id: '',
    name: '',
    description: '',
    status: 'draft',
    steps: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subscriberCount: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (id) {
      loadSequence();
    }
  }, [id]);

  const loadSequence = async () => {
    setLoading(true);
    try {
      if (!id) return;

      const apiSequence = await api.getSMSSequence(id);
      const mapped: SMSSequence = {
        id: apiSequence.id,
        name: apiSequence.name,
        description: apiSequence.description || '',
        status: apiSequence.status,
        steps: (apiSequence.steps || [])
          .slice()
          .sort((a, b) => a.step_order - b.step_order)
          .map((step) => {
            const delayHours = step.delay_hours || 0;
            const delayDays = Math.floor(delayHours / 24);
            const remainderHours = delayHours % 24;

            return {
              id: step.id,
              message: step.message,
              delayDays,
              delayHours: remainderHours,
              order: step.step_order,
            };
          }),
        createdAt: apiSequence.created_at,
        updatedAt: apiSequence.updated_at,
        subscriberCount: apiSequence.subscriber_count || 0,
        completionRate: apiSequence.completion_rate || 0,
        group: apiSequence.group_id,
      };

      setSequence(mapped);
    } catch (error) {
      console.error('Error loading sequence:', error);
      toast.error('Failed to load sequence');
    } finally {
      setLoading(false);
    }
  };

  const addStep = () => {
    const newStep: SMSStep = {
      id: `step-${Date.now()}`,
      message: '',
      delayDays: 0,
      delayHours: 0,
      order: sequence.steps.length + 1
    };

    setSequence(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  const removeStep = (stepId: string) => {
    setSequence(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId)
        .map((step, index) => ({ ...step, order: index + 1 }))
    }));
  };

  const updateStep = (stepId: string, field: keyof SMSStep, value: string | number) => {
    setSequence(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.id === stepId ? { ...step, [field]: value } : step
      )
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId !== overId) {
      const oldIndex = sequence.steps.findIndex((step) => step.id === activeId);
      const newIndex = sequence.steps.findIndex((step) => step.id === overId);

      if (oldIndex === -1 || newIndex === -1) return;

      const updatedSteps = arrayMove(sequence.steps, oldIndex, newIndex).map((step, index) => ({
        ...step,
        order: index + 1
      }));

      setSequence(prev => ({
        ...prev,
        steps: updatedSteps
      }));
    }
  };

  const saveSequence = async () => {
    if (!sequence.name.trim()) {
      toast.error('Please enter a sequence name');
      return;
    }

    if (sequence.steps.length === 0) {
      toast.error('Please add at least one step');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<ApiSMSSequence> = {
        name: sequence.name,
        description: sequence.description,
        status: sequence.status,
        steps: sequence.steps.map((step, index) => ({
          message: step.message,
          delay_hours: step.delayDays * 24 + step.delayHours,
          step_order: index + 1,
        })) as unknown as ApiSMSSequence['steps'],
      };

      const saved = isNew
        ? await api.createSMSSequence(payload)
        : await api.updateSMSSequence(id, payload);

      toast.success('Sequence saved successfully');
      if (isNew) {
        navigate(`/reach/outbound/sms/sequences/edit/${saved.id}`);
      } else {
        setSequence((prev) => ({
          ...prev,
          updatedAt: saved.updated_at || prev.updatedAt,
        }));
      }
    } catch (error) {
      console.error('Error saving sequence:', error);
      toast.error('Failed to save sequence');
    } finally {
      setSaving(false);
    }
  };

  const previewSequence = () => {
    toast.info('Preview functionality coming soon');
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading sequence...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/reach/outbound/sms/sequences')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-[18px] font-bold tracking-tight">
                {isNew ? 'Create SMS Sequence' : 'Edit SMS Sequence'}
              </h1>
              <p className="text-muted-foreground">
                Build automated SMS sequences to engage your audience
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={previewSequence}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={saveSequence} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Sequence'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sequence Settings */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Sequence Settings</CardTitle>
                <CardDescription>Configure your SMS sequence details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Sequence Name</Label>
                  <Input
                    id="name"
                    value={sequence.name}
                    onChange={(e) => setSequence(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter sequence name"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={sequence.description}
                    onChange={(e) => setSequence(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this sequence"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={sequence.status}
                    onValueChange={(value: 'active' | 'paused' | 'draft') =>
                      setSequence(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!isNew && (
                  <div className="pt-4 border-t">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subscribers:</span>
                        <span>{sequence.subscriberCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Completion Rate:</span>
                        <span>{sequence.completionRate}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sequence Steps */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Sequence Steps</CardTitle>
                    <CardDescription>Create and arrange your SMS messages</CardDescription>
                  </div>
                  <Button onClick={addStep}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sequence.steps.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No steps added yet</p>
                    <Button onClick={addStep}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Step
                    </Button>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={sequence.steps.map(step => step.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4">
                        {sequence.steps.map((step, index) => (
                          <SortableStep
                            key={step.id}
                            step={step}
                            index={index}
                            onUpdate={updateStep}
                            onRemove={removeStep}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default SMSSequenceEditor;
