import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DollarSign, ShoppingCart, Lock } from 'lucide-react';

interface PaymentLink {
    slug: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    collect_shipping: boolean;
    collect_billing: boolean;
    settings: Record<string, unknown>;
}

export default function CheckoutPage() {
    const { slug } = useParams<{ slug: string }>();
    const [link, setLink] = useState<PaymentLink | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_email: '',
        shipping_address: {
            line1: '',
            city: '',
            state: '',
            postal_code: '',
            country: 'US',
        },
    });

    useEffect(() => {
        loadPaymentLink();
    }, [slug]);

    const loadPaymentLink = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/checkout/${slug}`);

            if (!response.ok) {
                throw new Error('Payment link not found');
            }

            const data = await response.json();
            setLink(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load checkout page');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async () => {
        if (!link) return;

        if (!formData.customer_name || !formData.customer_email) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const response = await fetch('/api/checkout/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug,
                    customer_name: formData.customer_name,
                    customer_email: formData.customer_email,
                    shipping_address: link.collect_shipping ? formData.shipping_address : null,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create order');
            }

            const data = await response.json();
            toast.success('Order created! ' + data.message);
            // In production, redirect to Stripe/PayPal payment page
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Checkout failed');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !link) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Payment Link Not Found</h2>
                        <p className="text-muted-foreground">{error || 'This payment link is no longer available.'}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <Card className="shadow-xl">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl">{link.name}</CardTitle>
                                {link.description && (
                                    <CardDescription className="mt-2 text-base">{link.description}</CardDescription>
                                )}
                            </div>
                            <Badge variant="secondary" className="text-xl px-4 py-2">
                                <DollarSign className="h-5 w-5 mr-1" />
                                {link.price.toFixed(2)} {link.currency}
                            </Badge>
                        </div>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-6 space-y-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Customer Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.customer_name}
                                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.customer_email}
                                        onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            {link.collect_shipping && (
                                <>
                                    <Separator className="my-6" />
                                    <h3 className="font-semibold text-lg">Shipping Address</h3>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="address">Street Address</Label>
                                            <Input
                                                id="address"
                                                value={formData.shipping_address.line1}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        shipping_address: { ...formData.shipping_address, line1: e.target.value },
                                                    })
                                                }
                                                placeholder="123 Main St"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="city">City</Label>
                                                <Input
                                                    id="city"
                                                    value={formData.shipping_address.city}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            shipping_address: { ...formData.shipping_address, city: e.target.value },
                                                        })
                                                    }
                                                    placeholder="New York"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="state">State</Label>
                                                <Input
                                                    id="state"
                                                    value={formData.shipping_address.state}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            shipping_address: { ...formData.shipping_address, state: e.target.value },
                                                        })
                                                    }
                                                    placeholder="NY"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="postal">Postal Code</Label>
                                                <Input
                                                    id="postal"
                                                    value={formData.shipping_address.postal_code}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            shipping_address: { ...formData.shipping_address, postal_code: e.target.value },
                                                        })
                                                    }
                                                    placeholder="10001"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="country">Country</Label>
                                                <Input
                                                    id="country"
                                                    value={formData.shipping_address.country}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            shipping_address: { ...formData.shipping_address, country: e.target.value },
                                                        })
                                                    }
                                                    placeholder="US"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-lg">
                                <span className="font-semibold">Total:</span>
                                <span className="text-2xl font-bold">
                                    ${link.price.toFixed(2)} {link.currency}
                                </span>
                            </div>

                            <Button size="lg" className="w-full" onClick={handleCheckout}>
                                <Lock className="h-5 w-5 mr-2" />
                                Proceed to Payment
                            </Button>

                            <p className="text-sm text-center text-muted-foreground">
                                Secure checkout powered by Xordon
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-8 text-center text-sm text-muted-foreground">
                    <p>In production, you'll be redirected to a secure payment gateway (Stripe/PayPal)</p>
                </div>
            </div>
        </div>
    );
}
