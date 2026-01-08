import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Link2, Copy, ExternalLink, Plus, Trash2, MessageSquare, Send } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    price: number;
    currency: string;
}

interface PaymentLink {
    id: number;
    product_id: number;
    product_name: string;
    slug: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    active: boolean;
    collect_shipping: boolean;
    collect_billing: boolean;
    total_sales: number;
    total_orders: number;
    created_at: string;
}

export default function PaymentLinksTab() {
    const [links, setLinks] = useState<PaymentLink[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        product_id: '',
        name: '',
        description: '',
        price: '',
        currency: 'USD',
        active: true,
        collect_shipping: true,
        collect_billing: true,
    });

    const [isSmsDialogOpen, setIsSmsDialogOpen] = useState(false);
    const [selectedLink, setSelectedLink] = useState<PaymentLink | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [smsSubmitting, setSmsSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [linksRes, productsRes] = await Promise.all([
                (api as any).get('/operations/payment-links'),
                (api as any).get('/payments/products'),
            ]);

            setLinks(linksRes.data.items || []);
            setProducts(productsRes.data.items || []);
        } catch (error) {
            console.error('Failed to load payment links:', error);
            toast.error('Failed to load payment links');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.product_id) {
            toast.error('Please select a product');
            return;
        }

        try {
            await (api as any).post('/operations/payment-links', formData);
            toast.success('Payment link created');
            setIsDialogOpen(false);
            setFormData({
                product_id: '',
                name: '',
                description: '',
                price: '',
                currency: 'USD',
                active: true,
                collect_shipping: true,
                collect_billing: true,
            });
            loadData();
        } catch (error) {
            console.error('Failed to create payment link:', error);
            toast.error('Failed to create payment link');
        }
    };

    const handleToggleActive = async (link: PaymentLink) => {
        try {
            await (api as any).patch(`/operations/payment-links/${link.id}`, {
                active: !link.active,
            });
            toast.success(`Link ${!link.active ? 'activated' : 'deactivated'}`);
            loadData();
        } catch (error) {
            console.error('Failed to toggle link:', error);
            toast.error('Failed to update link');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this payment link?')) return;

        try {
            await (api as any).delete(`/operations/payment-links/${id}`);
            toast.success('Payment link deleted');
            loadData();
        } catch (error) {
            console.error('Failed to delete link:', error);
            toast.error('Failed to delete link');
        }
    };

    const copyLinkToClipboard = (slug: string) => {
        const url = `${window.location.origin}/checkout/${slug}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
    };

    const handleSendSms = async () => {
        if (!selectedLink || !phoneNumber) {
            toast.error('Please enter a phone number');
            return;
        }

        try {
            setSmsSubmitting(true);
            await (api as any).post(`/operations/payment-links/${selectedLink.id}/send-sms`, {
                phone_number: phoneNumber
            });
            toast.success('Payment link sent via SMS');
            setIsSmsDialogOpen(false);
            setPhoneNumber('');
        } catch (error: any) {
            console.error('Failed to send SMS:', error);
            toast.error(error.response?.data?.error || 'Failed to send SMS. Please check your integration settings.');
        } finally {
            setSmsSubmitting(false);
        }
    };

    const handleProductChange = (productId: string) => {
        const product = products.find((p) => p.id === Number(productId));
        if (product) {
            setFormData({
                ...formData,
                product_id: productId,
                name: product.name,
                price: String(product.price),
                currency: product.currency,
            });
        }
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
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Payment Links</h2>
                    <p className="text-muted-foreground">Create shareable checkout pages for your products</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Link
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Link</TableHead>
                                <TableHead>Sales</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {links.map((link) => (
                                <TableRow key={link.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{link.name}</div>
                                            {link.description && (
                                                <div className="text-sm text-muted-foreground">{link.description}</div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        ${link.price.toFixed(2)} {link.currency}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <code className="text-xs bg-muted px-2 py-1 rounded">/checkout/{link.slug}</code>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => copyLinkToClipboard(link.slug)}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => window.open(`/checkout/${link.slug}`, '_blank')}
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            <div>${link.total_sales.toFixed(2)}</div>
                                            <div className="text-muted-foreground">{link.total_orders} orders</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={link.active}
                                            onCheckedChange={() => handleToggleActive(link)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                title="Send via SMS"
                                                onClick={() => {
                                                    setSelectedLink(link);
                                                    setIsSmsDialogOpen(true);
                                                }}
                                            >
                                                <MessageSquare className="h-4 w-4 text-primary" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(link.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {links.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        No payment links yet. Create one to get started!
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Payment Link</DialogTitle>
                        <DialogDescription>Generate a shareable checkout page for a product</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="product">Product</Label>
                            <Select value={formData.product_id} onValueChange={handleProductChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a product" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((product) => (
                                        <SelectItem key={product.id} value={String(product.id)}>
                                            {product.name} - ${product.price.toFixed(2)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Link Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Premium Package"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Optional description for the checkout page"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency">Currency</Label>
                                <Select
                                    value={formData.currency}
                                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="GBP">GBP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="collect_shipping"
                                    checked={formData.collect_shipping}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, collect_shipping: checked })
                                    }
                                />
                                <Label htmlFor="collect_shipping">Collect shipping address</Label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="collect_billing"
                                    checked={formData.collect_billing}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, collect_billing: checked })
                                    }
                                />
                                <Label htmlFor="collect_billing">Collect billing address</Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate}>Create Link</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isSmsDialogOpen} onOpenChange={setIsSmsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" /> Send via Text2Pay
                        </DialogTitle>
                        <DialogDescription>
                            Send this payment link directly to your customer's phone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Payment Link</Label>
                            <div className="p-3 bg-slate-50 rounded-lg border text-sm font-medium">
                                {selectedLink?.name} - ${selectedLink?.price.toFixed(2)}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Customer Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+1 (555) 000-0000"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-700 text-[12px] rounded-lg border border-blue-100 italic">
                            The customer will receive a professional SMS containing the checkout URL. Carrier rates may apply.
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSmsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSendSms} disabled={smsSubmitting || !phoneNumber}>
                            {smsSubmitting ? 'Sending...' : 'Send SMS Now'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
