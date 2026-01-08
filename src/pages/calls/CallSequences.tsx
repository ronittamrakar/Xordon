import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  Phone,
  Plus,
  Edit,
  Trash2,
  Play,
  Copy,
  MoreVertical,
  Clock,
  Users,
  FileTextIcon,
  Settings,
  Save,
  X,
  Archive
} from 'lucide-react';
import { api } from '@/lib/api';
import { CallSequence, CallSequenceStep } from '@/types';

interface SequenceFormData {
  name: string;
  description: string;
  steps: CallSequenceStep[];
  isActive: boolean;
}

const CallSequences: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<CallSequence | null>(null);
  const [formData, setFormData] = useState<SequenceFormData>({
    name: '',
    description: '',
    steps: [],
    isActive: true
  });

  const { data: sequences = [], isLoading } = useQuery({
    queryKey: ['call-sequences'],
    queryKey: ['call-sequences'],
    queryFn: async () => {
      const allSequences = await api.getCallSequences();
      return allSequences.filter(s => s.status !== 'archived' && s.status !== 'trashed');
    }
  });

  const createSequenceMutation = useMutation({
    mutationFn: api.createCallSequence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-sequences'] });
      toast({
        title: 'Success',
        description: 'Call sequence created successfully',
      });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create call sequence',
        variant: 'destructive',
      });
    }
  });

  const updateSequenceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SequenceFormData }) => api.updateCallSequence(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-sequences'] });
      toast({
        title: 'Success',
        description: 'Call sequence updated successfully',
      });
      setIsEditModalOpen(false);
      setSelectedSequence(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update call sequence',
        variant: 'destructive',
      });
    }
  });

  const deleteSequenceMutation = useMutation({
    mutationFn: (id: string) => api.updateCallSequence(id, { status: 'trashed' } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-sequences'] });
      toast({
        title: 'Success',
        description: 'Call sequence moved to trash',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to move call sequence to trash',
        variant: 'destructive',
      });
    }
  });

  const archiveSequenceMutation = useMutation({
    mutationFn: (id: string) => api.updateCallSequence(id, { status: 'archived' } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-sequences'] });
      toast({
        title: 'Success',
        description: 'Call sequence archived successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to archive call sequence',
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      steps: [],
      isActive: true
    });
  };

  const handleCreateSequence = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Sequence name is required',
        variant: 'destructive',
      });
      return;
    }
    createSequenceMutation.mutate(formData);
  };

  const handleEditSequence = (sequence: CallSequence) => {
    setSelectedSequence(sequence);
    setFormData({
      name: sequence.name,
      description: sequence.description || '',
      steps: sequence.steps || [],
      isActive: sequence.isActive
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSequence = () => {
    if (!selectedSequence || !formData.name.trim()) return;
    updateSequenceMutation.mutate({ id: selectedSequence.id, data: formData });
  };

  const handleDeleteSequence = (id: string) => {
    if (confirm('Are you sure you want to move this call sequence to trash?')) {
      deleteSequenceMutation.mutate(id);
    }
  };

  const handleArchiveSequence = (id: string) => {
    if (confirm('Are you sure you want to archive this call sequence?')) {
      archiveSequenceMutation.mutate(id);
    }
  };

  const handleDuplicateSequence = (sequence: CallSequence) => {
    const duplicatedData = {
      name: `${sequence.name} (Copy)`,
      description: sequence.description,
      steps: sequence.steps || [],
      isActive: false
    };
    createSequenceMutation.mutate(duplicatedData);
  };

  const addStep = () => {
    const newStep: CallSequenceStep = {
      id: `step-${Date.now()}`,
      name: '',
      script: '',
      delay: 0,
      duration: 60,
      type: 'call',
      order: formData.steps.length + 1
    };
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  const updateStep = (index: number, field: keyof CallSequenceStep, value: string | number | boolean) => {
    const updatedSteps = [...formData.steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setFormData(prev => ({ ...prev, steps: updatedSteps }));
  };

  const removeStep = (index: number) => {
    const updatedSteps = formData.steps.filter((_, i) => i !== index);
    // Reorder steps
    const reorderedSteps = updatedSteps.map((step, i) => ({ ...step, order: i + 1 }));
    setFormData(prev => ({ ...prev, steps: reorderedSteps }));
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex h-full">
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="space-y-4">
            <Breadcrumb
              items={[
                { label: 'Call Outreach', href: '/reach/outbound/calls', icon: <Phone className="h-4 w-4" /> },
                { label: 'Sequences' }
              ]}
            />

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Call Sequences</h1>
                <p className="text-muted-foreground mt-1">Create and manage your automated calling sequences</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Sequence
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Sequences</p>
                      <p className="text-2xl font-bold text-gray-900">{sequences.length}</p>
                    </div>
                    <Phone className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Sequences</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {sequences.filter(s => s.isActive).length}
                      </p>
                    </div>
                    <Play className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Steps</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {sequences.length > 0
                          ? Math.round(sequences.reduce((acc, s) => acc + (s.steps?.length || 0), 0) / sequences.length)
                          : 0
                        }
                      </p>
                    </div>
                    <FileTextIcon className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Most Used</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {sequences.length > 0
                          ? sequences.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))[0]?.name || 'None'
                          : 'None'
                        }
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sequences List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Call Sequences</CardTitle>
                <CardDescription>
                  Manage your calling sequences and their settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sequences.length === 0 ? (
                  <div className="text-center py-12">
                    <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No call sequences yet</h3>
                    <p className="text-gray-600 mb-4">Create your first call sequence to get started</p>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Sequence
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sequences.map((sequence) => (
                      <div key={sequence.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Phone className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{sequence.name}</h4>
                            <p className="text-sm text-gray-600">{sequence.description}</p>
                            <div className="flex items-center space-x-3 mt-1">
                              {getStatusBadge(sequence.isActive)}
                              <Badge variant="outline">
                                <Clock className="h-3 w-3 mr-1" />
                                {sequence.steps?.length || 0} steps
                              </Badge>
                              <Badge variant="outline">
                                <Users className="h-3 w-3 mr-1" />
                                {sequence.usageCount || 0} campaigns
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSequence(sequence)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicateSequence(sequence)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditSequence(sequence)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateSequence(sequence)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteSequence(sequence.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Move to Trash
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleArchiveSequence(sequence.id)}
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Create/Edit Modal */}
            <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
              if (!open) {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                setSelectedSequence(null);
                resetForm();
              }
            }}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {isEditModalOpen ? 'Edit Call Sequence' : 'Create Call Sequence'}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditModalOpen
                      ? 'Update your call sequence settings and steps'
                      : 'Create a new call sequence with multiple steps and settings'
                    }
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sequenceName">Sequence Name *</Label>
                      <Input
                        id="sequenceName"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Sales Discovery Call"
                      />
                    </div>

                    <div>
                      <Label htmlFor="sequenceStatus">Status</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="sequenceStatus"
                          checked={formData.isActive}
                          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="sequenceStatus" className="mb-0">
                          {formData.isActive ? 'Active' : 'Inactive'}
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sequenceDescription">Description</Label>
                    <Textarea
                      id="sequenceDescription"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the purpose and flow of this call sequence"
                      rows={3}
                    />
                  </div>

                  {/* Steps Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <Label>Call Steps</Label>
                      <Button onClick={addStep} size="sm" className="flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>Add Step</span>
                      </Button>
                    </div>

                    {formData.steps.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No steps yet</h4>
                        <p className="text-gray-600 mb-4">Add steps to build your call sequence</p>
                        <Button onClick={addStep} size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Step
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.steps.map((step, index) => (
                          <Card key={step.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                  <Badge variant="outline">Step {index + 1}</Badge>
                                  <div className="text-sm text-gray-600">
                                    <Clock className="h-3 w-3 inline mr-1" />
                                    {step.delay}min delay • {step.duration}s duration
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeStep(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                  <Label htmlFor={`stepName-${index}`}>Step Name *</Label>
                                  <Input
                                    id={`stepName-${index}`}
                                    value={step.name}
                                    onChange={(e) => updateStep(index, 'name', e.target.value)}
                                    placeholder="e.g., Introduction"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor={`stepType-${index}`}>Step Type</Label>
                                  <select
                                    id={`stepType-${index}`}
                                    value={step.type}
                                    onChange={(e) => updateStep(index, 'type', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                  >
                                    <option value="call">Call</option>
                                    <option value="voicemail">Voicemail</option>
                                    <option value="followup">Follow-up</option>
                                    <option value="break">Break</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                  <Label htmlFor={`stepDelay-${index}`}>Delay (minutes)</Label>
                                  <Input
                                    id={`stepDelay-${index}`}
                                    type="number"
                                    min="0"
                                    max="10080" // 7 days in minutes
                                    value={step.delay}
                                    onChange={(e) => updateStep(index, 'delay', parseInt(e.target.value) || 0)}
                                  />
                                </div>

                                <div>
                                  <Label htmlFor={`stepDuration-${index}`}>Duration (seconds)</Label>
                                  <Input
                                    id={`stepDuration-${index}`}
                                    type="number"
                                    min="10"
                                    max="3600"
                                    value={step.duration}
                                    onChange={(e) => updateStep(index, 'duration', parseInt(e.target.value) || 60)}
                                  />
                                </div>
                              </div>

                              <div className="mt-4">
                                <Label htmlFor={`stepScript-${index}`}>Script Template</Label>
                                <Textarea
                                  id={`stepScript-${index}`}
                                  value={step.script}
                                  onChange={(e) => updateStep(index, 'script', e.target.value)}
                                  placeholder="Enter the script template for this step. Use {{firstName}}, {{company}} for personalization."
                                  rows={4}
                                  className="font-mono text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Available variables: {{ firstName }}, {{ lastName }}, {{ company }}, {{ title }}, {{ unsubscribeUrl }}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setIsEditModalOpen(false);
                      setSelectedSequence(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={isEditModalOpen ? handleUpdateSequence : handleCreateSequence}
                    disabled={
                      (isEditModalOpen ? updateSequenceMutation.isPending : createSequenceMutation.isPending) ||
                      !formData.name.trim() ||
                      formData.steps.some(step => !step.name.trim())
                    }
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isEditModalOpen ? 'Update Sequence' : 'Create Sequence'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </>
  );
};

export default CallSequences;

