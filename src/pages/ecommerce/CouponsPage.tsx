import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, Plus, Search, Calendar, Tag, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import ecommerceApi, { Coupon } from '@/services/ecommerceApi';
import { format } from 'date-fns';

const CouponsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'percentage' as 'percentage' | 'fixed' | 'free_shipping',
    value: '',
    min_purchase: '0',
    max_discount: '',
    usage_limit: '',
    valid_from: '',
    valid_until: '',
    is_active: true,
  });

  // Queries
  const { data: couponsData, isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const response = await ecommerceApi.getCoupons();
      return response.items || [];
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['coupon-stats'],
    queryFn: async () => {
      return await ecommerceApi.getCouponStats();
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Partial<Coupon>) => ecommerceApi.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupon-stats'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Coupon created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create coupon');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Coupon> }) =>
      ecommerceApi.updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupon-stats'] });
      setIsEditDialogOpen(false);
      setSelectedCoupon(null);
      resetForm();
      toast.success('Coupon updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update coupon');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ecommerceApi.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupon-stats'] });
      toast.success('Coupon deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete coupon');
    },
  });

  // Handlers
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      type: 'percentage',
      value: '',
      min_purchase: '0',
      max_discount: '',
      usage_limit: '',
      valid_from: '',
      valid_until: '',
      is_active: true,
    });
  };

  const handleCreate = () => {
    const data: Partial<Coupon> = {
      code: formData.code.toUpperCase(),
      name: formData.name,
      type: formData.type,
      value: parseFloat(formData.value),
      min_purchase: parseFloat(formData.min_purchase) || 0,
      max_discount: formData.max_discount ? parseFloat(formData.max_discount) : undefined,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : undefined,
      valid_from: formData.valid_from || undefined,
      valid_until: formData.valid_until || undefined,
      is_active: formData.is_active,
    };
    createMutation.mutate(data);
  };

  const handleUpdate = () => {
    if (!selectedCoupon) return;
    const data: Partial<Coupon> = {
      code: formData.code.toUpperCase(),
      name: formData.name,
      type: formData.type,
      value: parseFloat(formData.value),
      min_purchase: parseFloat(formData.min_purchase) || 0,
      max_discount: formData.max_discount ? parseFloat(formData.max_discount) : undefined,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : undefined,
      valid_from: formData.valid_from || undefined,
      valid_until: formData.valid_until || undefined,
      is_active: formData.is_active,
    };
    updateMutation.mutate({ id: selectedCoupon.id, data });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      deleteMutation.mutate(id);
    }
  };

  const openEditDialog = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      type: coupon.type,
      value: coupon.value.toString(),
      min_purchase: coupon.min_purchase.toString(),
      max_discount: coupon.max_discount?.toString() || '',
      usage_limit: coupon.usage_limit?.toString() || '',
      valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] : '',
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
      is_active: coupon.is_active,
    });
    setIsEditDialogOpen(true);
  };

  // Filtered data
  const filteredCoupons = (couponsData || []).filter((coupon) =>
    coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coupon.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'Percentage';
      case 'fixed':
        return 'Fixed Amount';
      case 'free_shipping':
        return 'Free Shipping';
      default:
        return type;
    }
  };

  const getValueDisplay = (coupon: Coupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}%`;
    } else if (coupon.type === 'fixed') {
      return `$${coupon.value.toFixed(2)}`;
    } else {
      return 'Free Shipping';
    }
  };

  const isExpired = (coupon: Coupon) => {
    if (!coupon.valid_until) return false;
    return new Date(coupon.valid_until) < new Date();
  };

  const isUsageLimitReached = (coupon: Coupon) => {
    if (!coupon.usage_limit) return false;
    return coupon.used_count >= coupon.usage_limit;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coupons & Discounts</h1>
          <p className="text-muted-foreground">Manage promotional codes, seasonal sales, and discount rules.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Coupon
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Active Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.active_coupons || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Redemptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.total_redemptions || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(statsData?.total_savings || 0).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Promotions</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search coupons..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading coupons...</div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground mb-2">No active coupons or discounts found.</p>
              <Button variant="link" onClick={() => setIsCreateDialogOpen(true)}>
                Create your first discount
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code / Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{coupon.code}</div>
                        <div className="text-sm text-muted-foreground">{coupon.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeLabel(coupon.type)}</TableCell>
                    <TableCell className="font-medium">{getValueDisplay(coupon)}</TableCell>
                    <TableCell>
                      {coupon.used_count}
                      {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ' / ∞'}
                    </TableCell>
                    <TableCell>
                      {coupon.valid_until
                        ? format(new Date(coupon.valid_until), 'MMM dd, yyyy')
                        : 'No expiry'}
                    </TableCell>
                    <TableCell>
                      {!coupon.is_active ? (
                        <Badge variant="secondary">Inactive</Badge>
                      ) : isExpired(coupon) ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : isUsageLimitReached(coupon) ? (
                        <Badge variant="secondary">Limit Reached</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
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
                          <DropdownMenuItem onClick={() => openEditDialog(coupon)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(coupon.id)}>
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
            <DialogTitle>Create Coupon</DialogTitle>
            <DialogDescription>Create a new promotional code or discount</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Coupon Code *</Label>
                <Input
                  placeholder="SUMMER2024"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <Label>Display Name *</Label>
                <Input
                  placeholder="Summer Sale 2024"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount Type *</Label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Off</SelectItem>
                    <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                    <SelectItem value="free_shipping">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  {formData.type === 'percentage' ? 'Percentage (%)' : formData.type === 'fixed' ? 'Amount ($)' : 'Value'}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={formData.type === 'percentage' ? '10' : '5.00'}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  disabled={formData.type === 'free_shipping'}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Minimum Purchase ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.min_purchase}
                  onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                />
              </div>
              <div>
                <Label>Maximum Discount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Optional"
                  value={formData.max_discount}
                  onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Usage Limit</Label>
              <Input
                type="number"
                placeholder="Unlimited"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valid From</Label>
                <Input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>
              <div>
                <Label>Valid Until</Label>
                <Input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Enable this coupon immediately</p>
              </div>
              <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formData.code || !formData.name || (!formData.value && formData.type !== 'free_shipping')}>
              Create Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>Update coupon details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Coupon Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <Label>Display Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount Type *</Label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Off</SelectItem>
                    <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                    <SelectItem value="free_shipping">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  {formData.type === 'percentage' ? 'Percentage (%)' : formData.type === 'fixed' ? 'Amount ($)' : 'Value'}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  disabled={formData.type === 'free_shipping'}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Minimum Purchase ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.min_purchase}
                  onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                />
              </div>
              <div>
                <Label>Maximum Discount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.max_discount}
                  onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Usage Limit</Label>
              <Input
                type="number"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valid From</Label>
                <Input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>
              <div>
                <Label>Valid Until</Label>
                <Input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Enable/disable this coupon</p>
              </div>
              <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Coupon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponsPage;
