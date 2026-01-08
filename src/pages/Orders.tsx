import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Package, Truck, CheckCircle, XCircle, Eye, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import checkoutApi, { Order } from '@/services/checkoutApi';
import { format } from 'date-fns';

const Orders: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => checkoutApi.listOrders({
      status: statusFilter === 'all' ? undefined : statusFilter,
      limit: 100
    }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Order> }) =>
      checkoutApi.updateOrderStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order updated');
    },
  });

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'refunded':
        return <Badge variant="outline">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getShippingStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Delivered</Badge>;
      case 'shipped':
        return <Badge className="bg-blue-100 text-blue-800"><Truck className="h-3 w-3 mr-1" />Shipped</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800"><Package className="h-3 w-3 mr-1" />Processing</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (order.customer_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.payment_status === 'paid').length,
    pending: orders.filter(o => o.payment_status === 'pending').length,
    revenue: orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders and fulfillment</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Orders</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Paid Orders</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.paid}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(stats.revenue)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Shipping</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customer_name || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(order.total)}</TableCell>
                  <TableCell>{getPaymentStatusBadge(order.payment_status)}</TableCell>
                  <TableCell>{getShippingStatusBadge(order.shipping_status)}</TableCell>
                  <TableCell className="text-xs">
                    {format(new Date(order.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewOrderDetails(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Customer</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customer_email}</p>
                  {selectedOrder.customer_phone && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.customer_phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <div className="space-y-2 mt-1">
                    {getPaymentStatusBadge(selectedOrder.payment_status)}
                    {getShippingStatusBadge(selectedOrder.shipping_status)}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Order Items</p>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="p-3 flex justify-between">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.total_price)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.tax_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>{formatCurrency(selectedOrder.tax_amount)}</span>
                    </div>
                  )}
                  {selectedOrder.shipping_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>{formatCurrency(selectedOrder.shipping_amount)}</span>
                    </div>
                  )}
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(selectedOrder.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.tracking_number && (
                <div>
                  <p className="text-sm font-medium">Tracking Number</p>
                  <p className="text-sm text-muted-foreground font-mono">{selectedOrder.tracking_number}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
