import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, Plus, Search, Settings, PackageCheck, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import ecommerceApi, { ShippingMethod } from '@/services/ecommerceApi';

const ShippingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<ShippingMethod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    carrier: '',
    rate_type: 'flat' as 'flat' | 'per_item' | 'per_weight' | 'calculated',
    base_rate: '0',
    per_item_rate: '0',
    per_weight_rate: '0',
    min_delivery_days: '0',
    max_delivery_days: '0',
    is_active: true,
  });

  // Queries
  const { data: methodsData, isLoading } = useQuery({
    queryKey: ['shipping-methods'],
    queryFn: async () => {
      const response = await ecommerceApi.getShippingMethods();
      return response.items || [];
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Partial<ShippingMethod>) => ecommerceApi.createShippingMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-methods'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Shipping method created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create shipping method');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ShippingMethod> }) =>
      ecommerceApi.updateShippingMethod(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-methods'] });
      setIsEditDialogOpen(false);
      setSelectedMethod(null);
      resetForm();
      toast.success('Shipping method updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update shipping method');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ecommerceApi.deleteShippingMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-methods'] });
      toast.success('Shipping method deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete shipping method');
    },
  });

  // Handlers
  const resetForm = () => {
    setFormData({
      name: '',
      carrier: '',
      rate_type: 'flat',
      base_rate: '0',
      per_item_rate: '0',
      per_weight_rate: '0',
      min_delivery_days: '0',
      max_delivery_days: '0',
      is_active: true,
    });
  };

  const handleCreate = () => {
    const data: Partial<ShippingMethod> = {
      name: formData.name,
      carrier: formData.carrier || undefined,
      rate_type: formData.rate_type,
      base_rate: parseFloat(formData.base_rate) || 0,
      per_item_rate: parseFloat(formData.per_item_rate) || 0,
      per_weight_rate: parseFloat(formData.per_weight_rate) || 0,
      min_delivery_days: parseInt(formData.min_delivery_days) || 0,
      max_delivery_days: parseInt(formData.max_delivery_days) || 0,
      is_active: formData.is_active,
    };
    createMutation.mutate(data);
  };

  const handleUpdate = () => {
    if (!selectedMethod) return;
    const data: Partial<ShippingMethod> = {
      name: formData.name,
      carrier: formData.carrier || undefined,
      rate_type: formData.rate_type,
      base_rate: parseFloat(formData.base_rate) || 0,
      per_item_rate: parseFloat(formData.per_item_rate) || 0,
      per_weight_rate: parseFloat(formData.per_weight_rate) || 0,
      min_delivery_days: parseInt(formData.min_delivery_days) || 0,
      max_delivery_days: parseInt(formData.max_delivery_days) || 0,
      is_active: formData.is_active,
    };
    updateMutation.mutate({ id: selectedMethod.id, data });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this shipping method?')) {
      deleteMutation.mutate(id);
    }
  };

  const openEditDialog = (method: ShippingMethod) => {
    setSelectedMethod(method);
    setFormData({
      name: method.name,
      carrier: method.carrier || '',
      rate_type: method.rate_type,
      base_rate: method.base_rate.toString(),
      per_item_rate: method.per_item_rate.toString(),
      per_weight_rate: method.per_weight_rate.toString(),
      min_delivery_days: method.min_delivery_days.toString(),
      max_delivery_days: method.max_delivery_days.toString(),
      is_active: method.is_active,
    });
    setIsEditDialogOpen(true);
  };

  // Filtered data
  const filteredMethods = (methodsData || []).filter((method) =>
    method.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    method.carrier?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRateTypeLabel = (type: string) => {
    switch (type) {
      case 'flat':
        return 'Flat Rate';
      case 'per_item':
        return 'Per Item';
      case 'per_weight':
        return 'Per Weight';
      case 'calculated':
        return 'Calculated';
      default:
        return type;
    }
  };

  const getDeliveryTime = (method: ShippingMethod) => {
    if (method.min_delivery_days === 0 && method.max_delivery_days === 0) {
      return 'Not specified';
    }
    if (method.min_delivery_days === method.max_delivery_days) {
      return `${method.min_delivery_days} days`;
    }
    return `${method.min_delivery_days}-${method.max_delivery_days} days`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shipping & Fulfillment</h1>
          <p className="text-muted-foreground">Manage carrier integrations, shipping zones, and order fulfillment.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Shipping Settings
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Method
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Active Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{methodsData?.filter(m => m.is_active).length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Shipping options available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{methodsData?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Configured methods</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Carriers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(methodsData?.filter(m => m.carrier).map(m => m.carrier)).size || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Integrated carriers</p>
          </CardContent>
        </Card>
      </div>

      {/* Shipping Methods Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Shipping Methods</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search methods..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading shipping methods...</div>
          ) : filteredMethods.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground mb-2">No shipping methods found.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Method
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Rate Type</TableHead>
                  <TableHead>Base Rate</TableHead>
                  <TableHead>Delivery Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMethods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">{method.name}</TableCell>
                    <TableCell>{method.carrier || '-'}</TableCell>
                    <TableCell>{getRateTypeLabel(method.rate_type)}</TableCell>
                    <TableCell>${method.base_rate.toFixed(2)}</TableCell>
                    <TableCell>{getDeliveryTime(method)}</TableCell>
                    <TableCell>
                      {method.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(method)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(method.id)}>
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
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Shipping Method</DialogTitle>
            <DialogDescription>Create a new shipping option for customers</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Method Name *</Label>
                <Input
                  placeholder="Standard Shipping"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Carrier</Label>
                <Input
                  placeholder="USPS, FedEx, UPS, etc."
                  value={formData.carrier}
                  onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Rate Type *</Label>
              <Select value={formData.rate_type} onValueChange={(v: any) => setFormData({ ...formData, rate_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat Rate</SelectItem>
                  <SelectItem value="per_item">Per Item</SelectItem>
                  <SelectItem value="per_weight">Per Weight</SelectItem>
                  <SelectItem value="calculated">Calculated (Real-time)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Base Rate ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.base_rate}
                  onChange={(e) => setFormData({ ...formData, base_rate: e.target.value })}
                />
              </div>
              <div>
                <Label>Per Item Rate ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.per_item_rate}
                  onChange={(e) => setFormData({ ...formData, per_item_rate: e.target.value })}
                />
              </div>
              <div>
                <Label>Per Weight Rate ($/lb)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.per_weight_rate}
                  onChange={(e) => setFormData({ ...formData, per_weight_rate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Delivery Days</Label>
                <Input
                  type="number"
                  value={formData.min_delivery_days}
                  onChange={(e) => setFormData({ ...formData, min_delivery_days: e.target.value })}
                />
              </div>
              <div>
                <Label>Max Delivery Days</Label>
                <Input
                  type="number"
                  value={formData.max_delivery_days}
                  onChange={(e) => setFormData({ ...formData, max_delivery_days: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Make this method available to customers</p>
              </div>
              <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name}>
              Create Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Shipping Method</DialogTitle>
            <DialogDescription>Update shipping method details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Method Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Carrier</Label>
                <Input
                  value={formData.carrier}
                  onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Rate Type *</Label>
              <Select value={formData.rate_type} onValueChange={(v: any) => setFormData({ ...formData, rate_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat Rate</SelectItem>
                  <SelectItem value="per_item">Per Item</SelectItem>
                  <SelectItem value="per_weight">Per Weight</SelectItem>
                  <SelectItem value="calculated">Calculated (Real-time)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Base Rate ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.base_rate}
                  onChange={(e) => setFormData({ ...formData, base_rate: e.target.value })}
                />
              </div>
              <div>
                <Label>Per Item Rate ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.per_item_rate}
                  onChange={(e) => setFormData({ ...formData, per_item_rate: e.target.value })}
                />
              </div>
              <div>
                <Label>Per Weight Rate ($/lb)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.per_weight_rate}
                  onChange={(e) => setFormData({ ...formData, per_weight_rate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Delivery Days</Label>
                <Input
                  type="number"
                  value={formData.min_delivery_days}
                  onChange={(e) => setFormData({ ...formData, min_delivery_days: e.target.value })}
                />
              </div>
              <div>
                <Label>Max Delivery Days</Label>
                <Input
                  type="number"
                  value={formData.max_delivery_days}
                  onChange={(e) => setFormData({ ...formData, max_delivery_days: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Make this method available to customers</p>
              </div>
              <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Method</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShippingPage;
