import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus, Search, AlertTriangle, ArrowUpDown, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import ecommerceApi, { Inventory, Warehouse } from '@/services/ecommerceApi';
import invoicesApi from '@/services/invoicesApi';

const InventoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_id: '',
    quantity_on_hand: '0',
    quantity_available: '0',
    quantity_reserved: '0',
    reorder_point: '0',
    reorder_quantity: '0',
  });

  // Queries
  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await ecommerceApi.getInventory();
      return response.items || [];
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      return await ecommerceApi.getInventoryStats();
    },
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await ecommerceApi.getWarehouses();
      return response.items || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      return await invoicesApi.listProducts();
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Partial<Inventory>) => ecommerceApi.createInventory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast.success('Inventory added successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to add inventory');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Inventory> }) =>
      ecommerceApi.updateInventory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      setIsEditDialogOpen(false);
      setSelectedInventory(null);
      resetForm();
      toast.success('Inventory updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update inventory');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ecommerceApi.deleteInventory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast.success('Inventory deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete inventory');
    },
  });

  // Handlers
  const resetForm = () => {
    setFormData({
      product_id: '',
      warehouse_id: '',
      quantity_on_hand: '0',
      quantity_available: '0',
      quantity_reserved: '0',
      reorder_point: '0',
      reorder_quantity: '0',
    });
  };

  const handleAdd = () => {
    createMutation.mutate({
      product_id: parseInt(formData.product_id),
      warehouse_id: parseInt(formData.warehouse_id),
      quantity_on_hand: parseInt(formData.quantity_on_hand),
      quantity_available: parseInt(formData.quantity_available),
      quantity_reserved: parseInt(formData.quantity_reserved),
      reorder_point: parseInt(formData.reorder_point),
      reorder_quantity: parseInt(formData.reorder_quantity),
    });
  };

  const handleEdit = () => {
    if (!selectedInventory) return;
    updateMutation.mutate({
      id: selectedInventory.id,
      data: {
        quantity_on_hand: parseInt(formData.quantity_on_hand),
        quantity_available: parseInt(formData.quantity_available),
        quantity_reserved: parseInt(formData.quantity_reserved),
        reorder_point: parseInt(formData.reorder_point),
        reorder_quantity: parseInt(formData.reorder_quantity),
      },
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this inventory record?')) {
      deleteMutation.mutate(id);
    }
  };

  const openEditDialog = (inventory: Inventory) => {
    setSelectedInventory(inventory);
    setFormData({
      product_id: inventory.product_id.toString(),
      warehouse_id: inventory.warehouse_id.toString(),
      quantity_on_hand: inventory.quantity_on_hand.toString(),
      quantity_available: inventory.quantity_available.toString(),
      quantity_reserved: inventory.quantity_reserved.toString(),
      reorder_point: inventory.reorder_point.toString(),
      reorder_quantity: inventory.reorder_quantity.toString(),
    });
    setIsEditDialogOpen(true);
  };

  // Filtered data
  const filteredInventory = (inventoryData || []).filter((item) =>
    item.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product_sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.warehouse_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockStatus = (item: Inventory) => {
    if (item.quantity_available === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (item.quantity_available <= item.reorder_point) {
      return <Badge className="bg-amber-100 text-amber-800">Low Stock</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">In Stock</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">Track stock levels, warehouse locations, and low stock alerts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Stock
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.total_items || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400 uppercase">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{statsData?.out_of_stock || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400 uppercase">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{statsData?.low_stock || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(statsData?.total_value || 0).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Stock Levels</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingInventory ? (
            <div className="text-center py-12 text-muted-foreground">Loading inventory...</div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">No inventory data found.</p>
              <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Item
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>On Hand</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell>{item.product_sku || '-'}</TableCell>
                    <TableCell>{item.warehouse_name}</TableCell>
                    <TableCell>{item.quantity_on_hand}</TableCell>
                    <TableCell>{item.quantity_available}</TableCell>
                    <TableCell>{item.quantity_reserved}</TableCell>
                    <TableCell>{getStockStatus(item)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(item)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item.id)}>
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

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Inventory</DialogTitle>
            <DialogDescription>Add stock for a product in a warehouse</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product *</Label>
              <Select value={formData.product_id} onValueChange={(v) => setFormData({ ...formData, product_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name} {p.sku ? `(${p.sku})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Warehouse *</Label>
              <Select value={formData.warehouse_id} onValueChange={(v) => setFormData({ ...formData, warehouse_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id.toString()}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity On Hand</Label>
                <Input
                  type="number"
                  value={formData.quantity_on_hand}
                  onChange={(e) => setFormData({ ...formData, quantity_on_hand: e.target.value })}
                />
              </div>
              <div>
                <Label>Quantity Available</Label>
                <Input
                  type="number"
                  value={formData.quantity_available}
                  onChange={(e) => setFormData({ ...formData, quantity_available: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Reorder Point</Label>
                <Input
                  type="number"
                  value={formData.reorder_point}
                  onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
                />
              </div>
              <div>
                <Label>Reorder Quantity</Label>
                <Input
                  type="number"
                  value={formData.reorder_quantity}
                  onChange={(e) => setFormData({ ...formData, reorder_quantity: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!formData.product_id || !formData.warehouse_id}>
              Add Inventory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inventory</DialogTitle>
            <DialogDescription>Update stock levels for {selectedInventory?.product_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity On Hand</Label>
                <Input
                  type="number"
                  value={formData.quantity_on_hand}
                  onChange={(e) => setFormData({ ...formData, quantity_on_hand: e.target.value })}
                />
              </div>
              <div>
                <Label>Quantity Available</Label>
                <Input
                  type="number"
                  value={formData.quantity_available}
                  onChange={(e) => setFormData({ ...formData, quantity_available: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity Reserved</Label>
                <Input
                  type="number"
                  value={formData.quantity_reserved}
                  onChange={(e) => setFormData({ ...formData, quantity_reserved: e.target.value })}
                />
              </div>
              <div>
                <Label>Reorder Point</Label>
                <Input
                  type="number"
                  value={formData.reorder_point}
                  onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Reorder Quantity</Label>
              <Input
                type="number"
                value={formData.reorder_quantity}
                onChange={(e) => setFormData({ ...formData, reorder_quantity: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Update Inventory</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
