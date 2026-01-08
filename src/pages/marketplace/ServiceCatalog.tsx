import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { FolderTree, Plus, Pencil, Trash2, Save, RefreshCw, ChevronRight } from 'lucide-react';
import { getServices, createService, updateService, deleteService, ServiceCategory } from '@/services/leadMarketplaceApi';
import { MarketplaceNav } from '@/components/marketplace/MarketplaceNav';

export default function ServiceCatalog() {
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCategory | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    parent_id: 'none',
    sort_order: '0',
    is_active: true,
  });

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await getServices({ include_inactive: true });
      if (res.data.success) setServices(res.data.data);
    } catch (error) {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '',
      parent_id: 'none',
      sort_order: '0',
      is_active: true,
    });
    setEditingService(null);
  };

  const openEditDialog = (service: ServiceCategory) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      slug: service.slug,
      description: service.description || '',
      icon: service.icon || '',
      parent_id: service.parent_id?.toString() || 'none',
      sort_order: service.sort_order.toString(),
      is_active: service.is_active,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      const data: Partial<ServiceCategory> = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: formData.description || undefined,
        icon: formData.icon || undefined,
        parent_id: formData.parent_id && formData.parent_id !== 'none' ? parseInt(formData.parent_id) : null,
        sort_order: parseInt(formData.sort_order) || 0,
        is_active: formData.is_active,
      };

      if (editingService) {
        await updateService(editingService.id, data);
        toast.success('Service updated');
      } else {
        await createService(data);
        toast.success('Service created');
      }
      setShowDialog(false);
      resetForm();
      fetchServices();
    } catch (error) {
      toast.error('Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await deleteService(id);
      toast.success('Service deleted');
      fetchServices();
    } catch (error) {
      toast.error('Failed to delete service');
    }
  };

  // Build tree structure
  const rootServices = services.filter(s => !s.parent_id);
  const getChildren = (parentId: number) => services.filter(s => s.parent_id === parentId);

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <MarketplaceNav />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <MarketplaceNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Service Catalog</h1>
          <p className="text-muted-foreground">Manage service categories for the lead marketplace</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchServices}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingService ? 'Edit Service' : 'Create Service'}</DialogTitle>
                <DialogDescription>Add a new service category to the marketplace</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Name *</Label>
                  <Input placeholder="e.g., Plumbing" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input placeholder="Auto-generated from name" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea placeholder="Brief description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div>
                  <Label>Icon (emoji or icon name)</Label>
                  <Input placeholder="🔧 or wrench" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} />
                </div>
                <div>
                  <Label>Parent Category</Label>
                  <Select value={formData.parent_id} onValueChange={v => setFormData({ ...formData, parent_id: v })}>
                    <SelectTrigger><SelectValue placeholder="None (top-level)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (top-level)</SelectItem>
                      {rootServices.filter(s => s.id !== editingService?.id).map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input type="number" value={formData.sort_order} onChange={e => setFormData({ ...formData, sort_order: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.is_active} onCheckedChange={v => setFormData({ ...formData, is_active: v })} />
                  <Label>Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingService ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Services ({services.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No services configured</p>
              <p className="text-sm">Add service categories to start receiving leads</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rootServices.map(service => (
                  <>
                    <TableRow key={service.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {service.icon && <span>{service.icon}</span>}
                          <span className="font-medium">{service.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{service.slug}</TableCell>
                      <TableCell>{service.sort_order}</TableCell>
                      <TableCell>
                        <Badge variant={service.is_active ? 'default' : 'secondary'}>
                          {service.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(service)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {getChildren(service.id).map(child => (
                      <TableRow key={child.id} className="bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-2 pl-6">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            {child.icon && <span>{child.icon}</span>}
                            <span>{child.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{child.slug}</TableCell>
                        <TableCell>{child.sort_order}</TableCell>
                        <TableCell>
                          <Badge variant={child.is_active ? 'default' : 'secondary'}>
                            {child.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(child)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(child.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
