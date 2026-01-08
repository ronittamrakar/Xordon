import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { 
  Plus, 
  ArrowRight, 
  Play, 
  Pause, 
  Mail, 
  MessageSquare,
  Linkedin,
  Phone,
  Search,
  MoreHorizontal,
  Calendar,
  Edit, 
  Trash2,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MultiChannelSequenceBuilder, { 
  MultiChannelSequence, 
  ChannelType 
} from '@/components/crm/MultiChannelSequenceBuilder';
import { useAuth } from '@/contexts/AuthContext';

// API functions for multi-channel sequences
const sequenceApi = {
  async getSequences(): Promise<MultiChannelSequence[]> {
    const token = localStorage.getItem('auth_token');
    const tenantId = localStorage.getItem('tenant_id');
    const activeClientId = localStorage.getItem('active_client_id');
    const response = await fetch('/api/sequences', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(tenantId ? { 'X-Workspace-Id': tenantId } : {}),
        ...(activeClientId ? { 'X-Company-Id': activeClientId } : {}),
      }
    });
    if (!response.ok) throw new Error('Failed to fetch sequences');
    const data = await response.json();
    return data.data || [];
  },

  async createSequence(sequence: Omit<MultiChannelSequence, 'id'>): Promise<MultiChannelSequence> {
    const token = localStorage.getItem('auth_token');
    const tenantId = localStorage.getItem('tenant_id');
    const activeClientId = localStorage.getItem('active_client_id');
    const response = await fetch('/api/sequences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(tenantId ? { 'X-Workspace-Id': tenantId } : {}),
        ...(activeClientId ? { 'X-Company-Id': activeClientId } : {}),
      },
      body: JSON.stringify(sequence)
    });
    if (!response.ok) throw new Error('Failed to create sequence');
    const data = await response.json();
    return data.data;
  },

  async updateSequence(id: string, updates: Partial<MultiChannelSequence>): Promise<MultiChannelSequence> {
    const token = localStorage.getItem('auth_token');
    const tenantId = localStorage.getItem('tenant_id');
    const activeClientId = localStorage.getItem('active_client_id');
    const response = await fetch(`/api/sequences/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(tenantId ? { 'X-Workspace-Id': tenantId } : {}),
        ...(activeClientId ? { 'X-Company-Id': activeClientId } : {}),
      },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update sequence');
    const data = await response.json();
    return data.data;
  },

  async deleteSequence(id: string): Promise<void> {
    const token = localStorage.getItem('auth_token');
    const tenantId = localStorage.getItem('tenant_id');
    const activeClientId = localStorage.getItem('active_client_id');
    const response = await fetch(`/api/sequences/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(tenantId ? { 'X-Workspace-Id': tenantId } : {}),
        ...(activeClientId ? { 'X-Company-Id': activeClientId } : {}),
      }
    });
    if (!response.ok) throw new Error('Failed to delete sequence');
  }
};

const channelIcons: Record<ChannelType, React.ReactNode> = {
  email: <Mail className="h-3 w-3" />,
  sms: <MessageSquare className="h-3 w-3" />,
  linkedin_connect: <Linkedin className="h-3 w-3" />,
  linkedin_message: <Linkedin className="h-3 w-3" />,
  call: <Phone className="h-3 w-3" />,
};

const channelColors: Record<ChannelType, string> = {
  email: 'bg-blue-500',
  sms: 'bg-green-500',
  linkedin_connect: 'bg-sky-600',
  linkedin_message: 'bg-sky-500',
  call: 'bg-purple-500',
};

interface SequenceWithMeta extends MultiChannelSequence {
  status?: 'active' | 'paused' | 'archived';
  created_at?: string;
  updated_at?: string;
}

const MultiChannelSequences = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sequences, setSequences] = useState<SequenceWithMeta[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingSequence, setEditingSequence] = useState<SequenceWithMeta | null>(null);
  const [newSequence, setNewSequence] = useState<MultiChannelSequence>({ name: '', steps: [] });

  const loadSequences = async () => {
    try {
      setIsLoading(true);
      const items = await sequenceApi.getSequences();
      setSequences(items as SequenceWithMeta[]);
    } catch (error) {
      console.error('Failed to load sequences:', error);
      toast.error('Failed to load sequences');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSequences();
  }, []);

  const filteredSequences = sequences.filter(seq =>
    seq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (seq.description && seq.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateSequence = async () => {
    if (!newSequence.name.trim()) {
      toast.error('Please provide a sequence name');
      return;
    }
    if (newSequence.steps.length === 0) {
      toast.error('Please add at least one step');
      return;
    }

    try {
      await sequenceApi.createSequence(newSequence);
      toast.success('Sequence created successfully');
      setShowCreateDialog(false);
      setNewSequence({ name: '', steps: [] });
      loadSequences();
    } catch (error) {
      console.error('Failed to create sequence:', error);
      toast.error('Failed to create sequence');
    }
  };

  const handleUpdateSequence = async () => {
    if (!editingSequence?.id) return;

    try {
      await sequenceApi.updateSequence(editingSequence.id, editingSequence);
      toast.success('Sequence updated successfully');
      setShowEditDialog(false);
      setEditingSequence(null);
      loadSequences();
    } catch (error) {
      console.error('Failed to update sequence:', error);
      toast.error('Failed to update sequence');
    }
  };

  const handleDeleteSequence = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await sequenceApi.deleteSequence(id);
      toast.success('Sequence deleted');
      setSequences(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Failed to delete sequence:', error);
      toast.error('Failed to delete sequence');
    }
  };

  const handleToggleStatus = async (sequence: SequenceWithMeta) => {
    const newStatus = sequence.status === 'active' ? 'paused' : 'active';
    try {
      await sequenceApi.updateSequence(sequence.id!, { ...sequence, status: newStatus } as any);
      setSequences(prev => prev.map(s => 
        s.id === sequence.id ? { ...s, status: newStatus } : s
      ));
      toast.success(`Sequence ${newStatus === 'active' ? 'activated' : 'paused'}`);
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-700">Paused</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-700">Archived</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const getChannelBadges = (steps: MultiChannelSequence['steps']) => {
    const channels = new Set(steps.map(s => s.type));
    return Array.from(channels).map(channel => (
      <span 
        key={channel} 
        className={`inline-flex items-center justify-center w-5 h-5 rounded text-white ${channelColors[channel]}`}
        title={channel.replace('_', ' ')}
      >
        {channelIcons[channel]}
      </span>
    ));
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-8">
        <Breadcrumb 
          items={[
            { label: 'CRM', href: '/crm', icon: <ArrowRight className="h-4 w-4" /> },
            { label: 'Multi-Channel Sequences' }
          ]} 
          className="mb-6" 
        />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-[18px] font-bold tracking-tight">Multi-Channel Sequences</h1>
            <p className="text-muted-foreground">
              Create automated outreach sequences across email, SMS, LinkedIn, and calls
            </p>
          </div>
          <Button 
            className="shadow-lg"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Sequence
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search sequences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        ) : filteredSequences.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ArrowRight className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No sequences found' : 'No sequences yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try adjusting your search' 
                  : 'Create multi-channel sequences to automate your outreach'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Sequence
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead>Steps</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSequences.map((sequence) => (
                  <TableRow key={sequence.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sequence.name}</div>
                        {sequence.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {sequence.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {getChannelBadges(sequence.steps)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{sequence.steps.length} steps</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(sequence.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(sequence.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditingSequence(sequence);
                            setShowEditDialog(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(sequence)}>
                            {sequence.status === 'active' ? (
                              <>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteSequence(sequence.id!, sequence.name)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Create Sequence Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Multi-Channel Sequence</DialogTitle>
            <DialogDescription>
              Build an automated outreach sequence with multiple channels
            </DialogDescription>
          </DialogHeader>
          <MultiChannelSequenceBuilder
            initialSequence={newSequence}
            onSequenceChange={setNewSequence}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSequence}>
              Create Sequence
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Sequence Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Sequence</DialogTitle>
            <DialogDescription>
              Modify your multi-channel outreach sequence
            </DialogDescription>
          </DialogHeader>
          {editingSequence && (
            <MultiChannelSequenceBuilder
              initialSequence={editingSequence}
              onSequenceChange={(updated) => setEditingSequence({ ...editingSequence, ...updated })}
            />
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSequence}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default MultiChannelSequences;
