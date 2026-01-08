import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Package, Truck, CheckCircle2, Clock } from 'lucide-react';

interface UnfulfilledOrder {
    id: number;
    invoice_number: string;
    total: number;
    currency: string;
    customer_name: string;
    customer_email: string;
    created_at: string;
    items: Array<{ description: string; quantity: number }>;
}

interface Fulfillment {
    id: number;
    invoice_id: number;
    status: string;
    tracking_number: string | null;
    courier: string | null;
    tracking_url: string | null;
    shipped_at: string | null;
    delivered_at: string | null;
    notes: string | null;
    created_at: string;
}

export default function FulfillmentTab() {
    const [unfulfilledOrders, setUnfulfilledOrders] = useState<UnfulfilledOrder[]>([]);
    const [fulfillments, setFulfillments] = useState<Fulfillment[]>([]);
    const [stats, setStats] = useState({ unfulfilled_orders: 0, shipped_this_month: 0, delivered_this_month: 0 });
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<UnfulfilledOrder | null>(null);
    const [formData, setFormData] = useState({
        invoice_id: '',
        tracking_number: '',
        courier: 'USPS',
        tracking_url: '',
        notes: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [unfulfilledRes, fulfillmentsRes, statsRes] = await Promise.all([
                api.get<{ items: UnfulfilledOrder[] }>('/operations/fulfillment/unfulfilled'),
                api.get<{ items: Fulfillment[] }>('/operations/fulfillment'),
                api.get('/operations/fulfillment/stats'),
            ]);

            setUnfulfilledOrders(unfulfilledRes.data.items || []);
            setFulfillments(fulfillmentsRes.data.items || []);
            setStats(statsRes.data || { unfulfilled_orders: 0, shipped_this_month: 0, delivered_this_month: 0 });
        } catch (error) {
            console.error('Failed to load fulfillment data:', error);
            toast.error('Failed to load fulfillment data');
        } finally {
            setLoading(false);
        }
    };

    const openFulfillDialog = (order: UnfulfilledOrder) => {
        setSelectedOrder(order);
        setFormData({
            invoice_id: String(order.id),
            tracking_number: '',
            courier: 'USPS',
            tracking_url: '',
            notes: '',
        });
        setIsDialogOpen(true);
    };

    const handleFulfill = async () => {
        if (!formData.tracking_number) {
            toast.error('Tracking number is required');
            return;
        }

        try {
            await api.post('/operations/fulfillment', {
                ...formData,
                status: 'shipped',
            });
            toast.success('Order fulfilled');
            setIsDialogOpen(false);
            setSelectedOrder(null);
            loadData();
        } catch (error) {
            console.error('Failed to create fulfillment:', error);
            toast.error('Failed to fulfill order');
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { color: string; icon: JSX.Element }> = {
            unfulfilled: { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3" /> },
            processing: { color: 'bg-blue-100 text-blue-800', icon: <Package className="h-3 w-3" /> },
            shipped: { color: 'bg-purple-100 text-purple-800', icon: <Truck className="h-3 w-3" /> },
            delivered: { color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-3 w-3" /> },
        };
        const variant = variants[status] || variants.unfulfilled;

        return (
            <Badge className={variant.color}>
                {variant.icon}
                <span className="ml-1">{status}</span>
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Awaiting Fulfillment</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.unfulfilled_orders}</div>
                        <p className="text-xs text-muted-foreground">Orders to ship</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Shipped This Month</CardTitle>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.shipped_this_month}</div>
                        <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Delivered This Month</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.delivered_this_month}</div>
                        <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="unfulfilled">
                <TabsList>
                    <TabsTrigger value="unfulfilled">Unfulfilled ({unfulfilledOrders.length})</TabsTrigger>
                    <TabsTrigger value="history">Fulfillment History</TabsTrigger>
                </TabsList>

                <TabsContent value="unfulfilled" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Orders Ready to Ship</CardTitle>
                            <CardDescription>Paid invoices awaiting fulfillment</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {unfulfilledOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">{order.invoice_number}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <div>{order.customer_name}</div>
                                                    <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {order.items.map((item, index) => (
                                                    <div key={index} className="text-sm">
                                                        {item.quantity}x {item.description}
                                                    </div>
                                                ))}
                                            </TableCell>
                                            <TableCell>
                                                ${order.total.toFixed(2)} {order.currency}
                                            </TableCell>
                                            <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Button size="sm" onClick={() => openFulfillDialog(order)}>
                                                    <Truck className="h-4 w-4 mr-1" />
                                                    Fulfill
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {unfulfilledOrders.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                                                No orders awaiting fulfillment
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Fulfillment History</CardTitle>
                            <CardDescription>All shipped and delivered orders</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Courier</TableHead>
                                        <TableHead>Tracking</TableHead>
                                        <TableHead>Shipped</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fulfillments.map((fulfillment) => (
                                        <TableRow key={fulfillment.id}>
                                            <TableCell>#{fulfillment.invoice_id}</TableCell>
                                            <TableCell>{getStatusBadge(fulfillment.status)}</TableCell>
                                            <TableCell>{fulfillment.courier || '-'}</TableCell>
                                            <TableCell>
                                                {fulfillment.tracking_number ? (
                                                    <div>
                                                        <code className="text-xs">{fulfillment.tracking_number}</code>
                                                        {fulfillment.tracking_url && (
                                                            <a
                                                                href={fulfillment.tracking_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:underline ml-2 text-xs"
                                                            >
                                                                Track
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {fulfillment.shipped_at
                                                    ? new Date(fulfillment.shipped_at).toLocaleDateString()
                                                    : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {fulfillments.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                No fulfillment history
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Fulfill Order</DialogTitle>
                        <DialogDescription>
                            Enter shipping details for {selectedOrder?.invoice_number}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="courier">Courier</Label>
                            <Select value={formData.courier} onValueChange={(value) => setFormData({ ...formData, courier: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USPS">USPS</SelectItem>
                                    <SelectItem value="FedEx">FedEx</SelectItem>
                                    <SelectItem value="UPS">UPS</SelectItem>
                                    <SelectItem value="DHL">DHL</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tracking">Tracking Number</Label>
                            <Input
                                id="tracking"
                                value={formData.tracking_number}
                                onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                                placeholder="e.g., 1Z999AA10123456784"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tracking_url">Tracking URL (Optional)</Label>
                            <Input
                                id="tracking_url"
                                value={formData.tracking_url}
                                onChange={(e) => setFormData({ ...formData, tracking_url: e.target.value })}
                                placeholder="https://tools.usps.com/go/TrackConfirmAction..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Any additional notes about this shipment"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleFulfill}>
                            <Truck className="h-4 w-4 mr-2" />
                            Ship Order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
