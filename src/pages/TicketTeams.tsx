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
import { Textarea } from '@/components/ui/textarea';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useToast } from '@/hooks/use-toast';
import ticketsApi, { TicketTeam } from '@/services/ticketsApi';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Mail,
  Clock,
  Settings,
  UserPlus,
  Shield,
  Globe,
  Save,
  X
} from 'lucide-react';

const TicketTeams: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TicketTeam | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email_alias: '',
    is_active: true
  });

  // Fetch teams
  const { data: teams, isLoading } = useQuery({
    queryKey: ['ticket-teams'],
    queryFn: () => ticketsApi.listTeams(),
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (editingTeam) {
        return ticketsApi.updateTicketTeam(editingTeam.id, data);
      } else {
        return ticketsApi.createTicketTeam(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-teams'] });
      toast({
        title: editingTeam ? 'Team updated' : 'Team created',
        description: `Team ${editingTeam ? 'updated' : 'created'} successfully`
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: `Failed to ${editingTeam ? 'update' : 'create'} team`,
        variant: 'destructive'
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => ticketsApi.deleteTicketTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-teams'] });
      toast({ title: 'Team deleted' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete team', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      email_alias: '',
      is_active: true
    });
    setEditingTeam(null);
  };

  const handleEdit = (team: TicketTeam) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || '',
      email_alias: team.email_alias || '',
      is_active: team.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Team name is required', variant: 'destructive' });
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Helpdesk', href: '/helpdesk' },
          { label: 'Ticket Teams' },
        ]}
      />

      <div className="mx-auto max-w-7xl py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ticket Teams</h1>
            <p className="text-muted-foreground mt-1">
              Manage support teams and their responsibilities
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Team
          </Button>
        </div>

        {/* Teams Grid */}
        {isLoading ? (
          <div className="text-center py-12">Loading teams...</div>
        ) : teams?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No teams found. Create your first team to organize your support staff.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams?.map((team) => (
              <Card key={team.id} className="hover:shadow-md transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <CardDescription className="mt-1">{team.description || 'No description'}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(team)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(team.id)}
                        className="h-8 w-8 p-0 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {team.email_alias && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{team.email_alias}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant={team.is_active ? "default" : "secondary"}>
                        {team.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">Team</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{team.business_hours ? 'Business hours configured' : 'Standard hours'}</span>
                      <span>{team.created_at ? new Date(team.created_at).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Team Management Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Team Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Assign tickets to specific teams based on expertise and workload
              </p>
              <Button variant="outline" onClick={() => navigate('/helpdesk/tickets')}>
                Manage Assignments
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Configure team-specific permissions and access levels
              </p>
              <Button variant="outline">Configure Permissions</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Collaboration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Enable seamless collaboration between team members
              </p>
              <Button variant="outline">Setup Collaboration</Button>
            </CardContent>
          </Card>
        </div>

        {/* Best Practices */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Team Management Tips</CardTitle>
            <CardDescription>
              Best practices for organizing your support teams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Specialized Teams</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Create teams based on expertise (Billing, Technical, Sales)</li>
                  <li>• Use clear, descriptive team names</li>
                  <li>• Set up team-specific email aliases</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Team Efficiency</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Balance workload across teams</li>
                  <li>• Set up proper escalation paths</li>
                  <li>• Monitor team performance metrics</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTeam ? 'Edit Team' : 'Create New Team'}</DialogTitle>
            <DialogDescription>
              {editingTeam ? 'Update team information and settings' : 'Set up a new support team'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Billing Support"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this team handles..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_alias">Email Alias</Label>
              <Input
                id="email_alias"
                value={formData.email_alias}
                onChange={(e) => setFormData({ ...formData, email_alias: e.target.value })}
                placeholder="e.g., billing@company.com"
              />
              <p className="text-xs text-muted-foreground">
                Customers can email this address to create tickets for this team
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_active">Team is active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={mutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? 'Saving...' : 'Save Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TicketTeams;