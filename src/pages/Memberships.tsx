import { useState, useEffect } from 'react';
import { Plus, GraduationCap, Users, Trash2, Edit, MoreVertical, DollarSign, BookOpen, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import membershipsApi, { Membership } from '@/services/membershipsApi';

interface MembershipFormData {
  name: string;
  description: string;
  access_type: 'free' | 'paid' | 'subscription';
  price: string;
  currency: string;
  billing_interval: 'one_time' | 'monthly' | 'yearly';
  trial_days: number;
  welcome_message: string;
}

interface MembershipFormProps {
  onSubmit: () => void;
  submitLabel: string;
  formData: MembershipFormData;
  setFormData: (data: MembershipFormData) => void;
}

const MembershipForm = ({ onSubmit, submitLabel, formData, setFormData }: MembershipFormProps) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="name">Membership Name</Label>
      <Input
        id="name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Premium Membership"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Describe what members get..."
        rows={3}
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Access Type</Label>
        <Select value={formData.access_type} onValueChange={(v: any) => setFormData({ ...formData, access_type: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="paid">Paid (One-time)</SelectItem>
            <SelectItem value="subscription">Subscription</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Billing Interval</Label>
        <Select
          value={formData.billing_interval}
          onValueChange={(v: any) => setFormData({ ...formData, billing_interval: v })}
          disabled={formData.access_type === 'free'}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one_time">One-time</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Price</Label>
        <Input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          placeholder="99.00"
          disabled={formData.access_type === 'free'}
        />
      </div>
      <div className="space-y-2">
        <Label>Trial Days</Label>
        <Input
          type="number"
          value={formData.trial_days}
          onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) || 0 })}
          disabled={formData.access_type === 'free'}
        />
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="welcome">Welcome Message</Label>
      <Textarea
        id="welcome"
        value={formData.welcome_message}
        onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
        placeholder="Welcome to the membership!"
        rows={2}
      />
    </div>

    <DialogFooter>
      <Button onClick={onSubmit}>{submitLabel}</Button>
    </DialogFooter>
  </div>
);

export default function Memberships() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<MembershipFormData>({
    name: '',
    description: '',
    access_type: 'paid',
    price: '',
    currency: 'USD',
    billing_interval: 'one_time',
    trial_days: 0,
    welcome_message: '',
  });

  useEffect(() => {
    loadMemberships();
  }, []);

  const loadMemberships = async () => {
    try {
      setLoading(true);
      const response = await membershipsApi.list();
      setMemberships(response.data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load memberships', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
      return;
    }
    try {
      await membershipsApi.create({
        ...formData,
        price: formData.price ? parseFloat(formData.price) : undefined,
      });
      toast({ title: 'Success', description: 'Membership created successfully' });
      setIsCreateOpen(false);
      resetForm();
      loadMemberships();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create membership', variant: 'destructive' });
    }
  };

  const handleUpdate = async () => {
    if (!selectedMembership) return;
    try {
      await membershipsApi.update(selectedMembership.id, {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : undefined,
      });
      toast({ title: 'Success', description: 'Membership updated successfully' });
      setIsEditOpen(false);
      setSelectedMembership(null);
      resetForm();
      loadMemberships();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update membership', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this membership?')) return;
    try {
      await membershipsApi.delete(id);
      toast({ title: 'Success', description: 'Membership deleted successfully' });
      loadMemberships();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete membership', variant: 'destructive' });
    }
  };

  const openEdit = async (membership: Membership) => {
    try {
      const response = await membershipsApi.get(membership.id);
      const m = response.data;
      setSelectedMembership(m);
      setFormData({
        name: m.name,
        description: m.description || '',
        access_type: m.access_type,
        price: m.price?.toString() || '',
        currency: m.currency,
        billing_interval: m.billing_interval,
        trial_days: m.trial_days,
        welcome_message: m.welcome_message || '',
      });
      setIsEditOpen(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load membership details', variant: 'destructive' });
    }
  };

  const openView = async (membership: Membership) => {
    try {
      const response = await membershipsApi.get(membership.id);
      setSelectedMembership(response.data);
      setIsViewOpen(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load membership details', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      access_type: 'paid',
      price: '',
      currency: 'USD',
      billing_interval: 'one_time',
      trial_days: 0,
      welcome_message: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'draft': return 'bg-yellow-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatPrice = (membership: Membership) => {
    if (membership.access_type === 'free') return 'Free';
    if (!membership.price) return 'Free';
    const price = `$${membership.price}`;
    if (membership.billing_interval === 'monthly') return `${price}/mo`;
    if (membership.billing_interval === 'yearly') return `${price}/yr`;
    return price;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Memberships</h1>
          <p className="text-muted-foreground">Create courses and gated content for your members</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Membership
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Membership</DialogTitle>
              <DialogDescription>Set up a new membership or course</DialogDescription>
            </DialogHeader>
            <MembershipForm onSubmit={handleCreate} submitLabel="Create Membership" formData={formData} setFormData={setFormData} />
          </DialogContent>
        </Dialog>
      </div>

      {memberships.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No memberships yet</h3>
            <p className="text-muted-foreground mb-4">Create your first membership to start offering courses</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Membership
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberships.map((membership) => (
            <Card key={membership.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(membership.status)}`} />
                    <CardTitle className="text-lg">{membership.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openView(membership)}>
                        <BookOpen className="w-4 h-4 mr-2" />
                        View Content
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(membership)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(membership.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>{membership.description || 'No description'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={membership.status === 'active' ? 'default' : 'secondary'}>
                      {membership.status}
                    </Badge>
                    <Badge variant="outline">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {formatPrice(membership)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-muted rounded p-2">
                      <div className="font-semibold">{membership.content_count || 0}</div>
                      <div className="text-muted-foreground">Lessons</div>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <div className="font-semibold text-green-600">{membership.active_members || 0}</div>
                      <div className="text-muted-foreground">Members</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Membership</DialogTitle>
            <DialogDescription>Update membership settings</DialogDescription>
          </DialogHeader>
          <MembershipForm onSubmit={handleUpdate} submitLabel="Save Changes" formData={formData} setFormData={setFormData} />
        </DialogContent>
      </Dialog>

      {/* View Content Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMembership?.name}</DialogTitle>
            <DialogDescription>{selectedMembership?.description}</DialogDescription>
          </DialogHeader>
          {selectedMembership && (
            <div className="space-y-4">
              {selectedMembership.stats && (
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-muted rounded p-3 text-center">
                    <div className="text-xl font-bold">{selectedMembership.stats.total_members}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="bg-muted rounded p-3 text-center">
                    <div className="text-xl font-bold text-green-600">{selectedMembership.stats.active}</div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                  <div className="bg-muted rounded p-3 text-center">
                    <div className="text-xl font-bold text-gray-600">{selectedMembership.stats.expired}</div>
                    <div className="text-xs text-muted-foreground">Expired</div>
                  </div>
                  <div className="bg-muted rounded p-3 text-center">
                    <div className="text-xl font-bold text-blue-600">{Math.round(selectedMembership.stats.avg_progress || 0)}%</div>
                    <div className="text-xs text-muted-foreground">Avg Progress</div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-3">Content ({selectedMembership.content?.length || 0} items)</h4>
                {selectedMembership.content && selectedMembership.content.length > 0 ? (
                  <div className="space-y-2">
                    {selectedMembership.content.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium">{item.title}</span>
                          <Badge variant="outline" className="ml-2 text-xs">{item.content_type}</Badge>
                        </div>
                        {item.is_published ? (
                          <Badge variant="default" className="text-xs">Published</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Draft</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No content added yet</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
