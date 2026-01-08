import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  User,
  Users,
  PhoneCall,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
} from 'lucide-react';
import { api } from '@/lib/api';

interface CallAgent {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  extension?: string;
  status: 'active' | 'inactive' | 'busy';
  max_concurrent_calls?: number;
  skills?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface AgentFormData {
  name: string;
  email: string;
  phone: string;
  extension: string;
  status: 'active' | 'inactive' | 'busy';
  max_concurrent_calls: number;
  skills: string[];
  notes: string;
}

const CallAgents: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<CallAgent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    email: '',
    phone: '',
    extension: '',
    status: 'active' as const,
    max_concurrent_calls: 1,
    skills: [],
    notes: ''
  });

  useEffect(() => {
  }, []);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['call-agents'],
    queryFn: () => api.getCallAgents()
  });

  const createAgentMutation = useMutation({
    mutationFn: (data: AgentFormData) => api.createCallAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-agents'] });
      toast({
        title: 'Success',
        description: 'Agent created successfully',
      });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create agent',
        variant: 'destructive',
      });
    }
  });

  const updateAgentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AgentFormData> }) =>
      api.updateCallAgent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-agents'] });
      toast({
        title: 'Success',
        description: 'Agent updated successfully',
      });
      setIsEditModalOpen(false);
      setSelectedAgent(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update agent',
        variant: 'destructive',
      });
    }
  });

  const deleteAgentMutation = useMutation({
    mutationFn: (id: string) => api.deleteCallAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-agents'] });
      toast({
        title: 'Success',
        description: 'Agent deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete agent',
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      extension: '',
      status: 'active',
      max_concurrent_calls: 1,
      skills: [],
      notes: ''
    });
    setSkillInput('');
  };

  const handleCreateAgent = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Agent name is required',
        variant: 'destructive',
      });
      return;
    }
    createAgentMutation.mutate(formData);
  };

  const handleEditAgent = (agent: CallAgent) => {
    setSelectedAgent(agent);
    setFormData({
      name: agent.name,
      email: agent.email || '',
      phone: agent.phone || '',
      extension: agent.extension || '',
      status: agent.status,
      max_concurrent_calls: agent.max_concurrent_calls,
      skills: agent.skills || [],
      notes: agent.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateAgent = () => {
    if (!selectedAgent || !formData.name.trim()) return;
    updateAgentMutation.mutate({ id: selectedAgent.id, data: formData });
  };

  const handleDeleteAgent = (id: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      deleteAgentMutation.mutate(id);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(skill => skill !== skillToRemove) }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 hover:bg-green-100', icon: CheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-800 hover:bg-gray-100', icon: XCircle },
      busy: { color: 'bg-red-100 text-red-800 hover:bg-red-100', icon: PhoneCall }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredAgents = agents.filter((agent: CallAgent) =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.phone?.includes(searchTerm)
  );

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
      <div className="space-y-4">
        <Breadcrumb
          items={[
            { label: 'Call Outreach', href: '/reach/outbound/calls', icon: <Phone className="h-4 w-4" /> },
            { label: 'Agents' }
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-bold tracking-tight">Call Team</h1>
            <p className="text-muted-foreground">Manage your call center team members and callers</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Agent
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-analytics">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Agents</p>
                  <p className="text-2xl font-bold text-foreground">{agents.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-analytics">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-foreground">
                    {agents.filter((a: CallAgent) => a.status === 'active').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-analytics">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Busy</p>
                  <p className="text-2xl font-bold text-foreground">
                    {agents.filter((a: CallAgent) => a.status === 'busy').length}
                  </p>
                </div>
                <PhoneCall className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-analytics">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                  <p className="text-2xl font-bold text-foreground">
                    {agents.filter((a: CallAgent) => a.status === 'inactive').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-analytics">
          <CardContent className="p-6">
            <Input
              placeholder="Search agents by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Agents Table */}
        {filteredAgents.length === 0 ? (
          <Card className="border-analytics">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No agents found</h3>
              <p className="text-muted-foreground mb-4">
                {agents.length === 0
                  ? "Add your first agent to get started"
                  : "Try adjusting your search"
                }
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Agent
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-analytics">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Contact</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Extension</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Max Calls</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Skills</th>
                      <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgents.map((agent: CallAgent) => (
                      <tr key={agent.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{agent.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {agent.email && (
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span>{agent.email}</span>
                              </div>
                            )}
                            {agent.phone && (
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{agent.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm">{agent.extension || '-'}</span>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(agent.status)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm">{agent.max_concurrent_calls}</span>
                        </td>
                        <td className="py-3 px-4">
                          {agent.skills && agent.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {agent.skills.slice(0, 2).map(skill => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {agent.skills.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{agent.skills.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No skills</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAgent(agent)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAgent(agent.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Modal */}
        <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
          if (!open) {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedAgent(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditModalOpen ? 'Edit Agent' : 'Add New Agent'}
              </DialogTitle>
              <DialogDescription>
                {isEditModalOpen
                  ? 'Update agent information and settings'
                  : 'Add a new agent to your call center team'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Agent name"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="agent@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="extension">Extension</Label>
                  <Input
                    id="extension"
                    value={formData.extension}
                    onChange={(e) => setFormData(prev => ({ ...prev, extension: e.target.value }))}
                    placeholder="101"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'active' | 'inactive' | 'busy') =>
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maxCalls">Max Concurrent Calls</Label>
                  <Input
                    id="maxCalls"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.max_concurrent_calls}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_concurrent_calls: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="skills">Skills</Label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    id="skills"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="Add a skill and press Enter"
                  />
                  <Button type="button" onClick={addSkill} variant="outline">
                    Add
                  </Button>
                </div>
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map(skill => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="ml-2 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this agent..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                  setSelectedAgent(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={isEditModalOpen ? handleUpdateAgent : handleCreateAgent}
                disabled={
                  (isEditModalOpen ? updateAgentMutation.isPending : createAgentMutation.isPending) ||
                  !formData.name.trim()
                }
              >
                {isEditModalOpen ? 'Update Agent' : 'Add Agent'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default CallAgents;
