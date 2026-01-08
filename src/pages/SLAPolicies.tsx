import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useToast } from '@/hooks/use-toast';
import ticketsApi from '@/services/ticketsApi';
import {
  Clock,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  TrendingUp,
  Users,
  Target,
  Shield,
  Save,
  X,
  Calendar,
  Timer
} from 'lucide-react';

interface SLAPolicy {
  id: number;
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  response_time_hours: number;
  resolution_time_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const SLAPolicies: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SLAPolicy | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    response_time_hours: 24,
    resolution_time_hours: 72,
    is_active: true
  });

  // Fetch SLA policies (using mock data since API might not exist)
  const { data: policies, isLoading } = useQuery({
    queryKey: ['sla-policies'],
    queryFn: async () => {
      // Mock data for SLA policies
      return [
        {
          id: 1,
          name: 'Standard Support',
          description: 'Standard response and resolution times for medium priority tickets',
          priority: 'medium' as const,
          response_time_hours: 24,
          resolution_time_hours: 72,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Priority Support',
          description: 'Faster response times for high priority tickets',
          priority: 'high' as const,
          response_time_hours: 4,
          resolution_time_hours: 24,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 3,
          name: 'Critical Support',
          description: 'Immediate response for urgent tickets',
          priority: 'urgent' as const,
          response_time_hours: 1,
          resolution_time_hours: 8,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Mock API call
      return new Promise((resolve) => {
        setTimeout(() => resolve({ message: 'SLA policy saved' }), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
      toast({
        title: editingPolicy ? 'SLA Policy updated' : 'SLA Policy created',
        description: `SLA policy ${editingPolicy ? 'updated' : 'created'} successfully`
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: `Failed to ${editingPolicy ? 'update' : 'create'} SLA policy`,
        variant: 'destructive'
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ message: 'SLA policy deleted' }), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
      toast({ title: 'SLA Policy deleted' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete SLA policy', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      priority: 'medium',
      response_time_hours: 24,
      resolution_time_hours: 72,
      is_active: true
    });
    setEditingPolicy(null);
  };

  const handleEdit = (policy: SLAPolicy) => {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      description: policy.description,
      priority: policy.priority,
      response_time_hours: policy.response_time_hours,
      resolution_time_hours: policy.resolution_time_hours,
      is_active: policy.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Policy name is required', variant: 'destructive' });
      return;
    }
    if (formData.response_time_hours <= 0 || formData.resolution_time_hours <= 0) {
      toast({ title: 'Error', description: 'Response and resolution times must be greater than 0', variant: 'destructive' });
      return;
    }
    mutation.mutate(formData);
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-500';
  };

  const formatTime = (hours: number) => {
    if (hours < 24) return `${hours} hours`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} days`;
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Helpdesk', href: '/helpdesk' },
          { label: 'SLA Policies' },
        ]}
      />

      <div className="mx-auto max-w-7xl py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">SLA Policies</h1>
            <p className="text-muted-foreground mt-1">
              Define response and resolution time targets for different ticket priorities
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Policy
          </Button>
        </div>

        {/* SLA Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                Compliance Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87%</div>
              <p className="text-sm text-muted-foreground mt-1">Tickets meeting SLA targets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-blue-500" />
                Avg Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">6.2h</div>
              <p className="text-sm text-muted-foreground mt-1">Across all priorities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+12%</div>
              <p className="text-sm text-muted-foreground mt-1">vs last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Policies Grid */}
        {isLoading ? (
          <div className="text-center py-12">Loading policies...</div>
        ) : policies?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No SLA policies found. Create your first policy to set response time targets.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {policies?.map((policy) => (
              <Card key={policy.id} className="hover:shadow-md transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{policy.name}</CardTitle>
                        <Badge variant="outline" className={`${getPriorityColor(policy.priority)} text-white`}>
                          {policy.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <CardDescription>{policy.description}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(policy)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(policy.id)}
                        className="h-8 w-8 p-0 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Response Time</span>
                      </div>
                      <span className="text-sm font-semibold">{formatTime(policy.response_time_hours)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Resolution Time</span>
                      </div>
                      <span className="text-sm font-semibold">{formatTime(policy.resolution_time_hours)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <Badge variant={policy.is_active ? "default" : "secondary"}>
                        {policy.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <span>Created {new Date(policy.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* SLA Management Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                SLA Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Monitor SLA compliance and get alerts when tickets are at risk of breaching
              </p>
              <Button variant="outline" onClick={() => navigate('/helpdesk/reports')}>
                View SLA Reports
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Track team performance against SLA targets and identify improvement areas
              </p>
              <Button variant="outline" onClick={() => navigate('/helpdesk/reports')}>
                Performance Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Best Practices */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>SLA Best Practices</CardTitle>
            <CardDescription>
              Guidelines for setting effective SLA policies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Response Time Targets</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Urgent: 1-2 hours</li>
                  <li>• High: 4-8 hours</li>
                  <li>• Medium: 24 hours</li>
                  <li>• Low: 48-72 hours</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Resolution Time Targets</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Urgent: 4-8 hours</li>
                  <li>• High: 1-2 days</li>
                  <li>• Medium: 3-5 days</li>
                  <li>• Low: 1-2 weeks</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> Set realistic SLA targets based on your team's capacity and gradually improve them over time.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? 'Edit SLA Policy' : 'Create New SLA Policy'}</DialogTitle>
            <DialogDescription>
              {editingPolicy ? 'Update SLA policy settings and time targets' : 'Define response and resolution time targets'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Policy Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Standard Support"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this policy covers..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority Level</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="response_time">Response Time (hours)</Label>
                <Input
                  id="response_time"
                  type="number"
                  min="1"
                  value={formData.response_time_hours}
                  onChange={(e) => setFormData({ ...formData, response_time_hours: parseInt(e.target.value) })}
                  placeholder="24"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resolution_time">Resolution Time (hours)</Label>
                <Input
                  id="resolution_time"
                  type="number"
                  min="1"
                  value={formData.resolution_time_hours}
                  onChange={(e) => setFormData({ ...formData, resolution_time_hours: parseInt(e.target.value) })}
                  placeholder="72"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_active">Policy is active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={mutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? 'Saving...' : 'Save Policy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SLAPolicies;