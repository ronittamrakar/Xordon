import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, ShoppingBag, Truck, CreditCard, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EcommerceSettings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        storeName: 'My Store',
        currency: 'USD',
        enableGuestCheckout: true,
        requirePhone: false,
        enableReviews: true,
        enableWishlist: true,
        taxRate: 0,
        shippingFlatRate: 0,
        freeShippingThreshold: 100,
    });

    const handleSave = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
        toast({
            title: 'Store settings saved',
            description: 'Your e-commerce configuration has been updated.',
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <ShoppingBag className="h-6 w-6 text-pink-500" />
                        E-commerce Settings
                    </h2>
                    <p className="text-muted-foreground">
                        Manage your store preferences, checkout, and shipping.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>General Store Info</CardTitle>
                        <CardDescription>Basic store configuration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Store Name</Label>
                            <Input
                                value={settings.storeName}
                                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Store Currency</Label>
                            <Select
                                value={settings.currency}
                                onValueChange={(v) => setSettings({ ...settings, currency: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                    <SelectItem value="GBP">GBP (£)</SelectItem>
                                    <SelectItem value="CAD">CAD ($)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Checkout & Customers</CardTitle>
                        <CardDescription>Configure the checkout experience</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Guest Checkout</Label>
                                <p className="text-sm text-muted-foreground">Allow customers to purchase without an account</p>
                            </div>
                            <Switch
                                checked={settings.enableGuestCheckout}
                                onCheckedChange={(v) => setSettings({ ...settings, enableGuestCheckout: v })}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Require Phone Number</Label>
                                <p className="text-sm text-muted-foreground">Ask for phone number at checkout</p>
                            </div>
                            <Switch
                                checked={settings.requirePhone}
                                onCheckedChange={(v) => setSettings({ ...settings, requirePhone: v })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Features</CardTitle>
                        <CardDescription>Enable optional store features</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Product Reviews</Label>
                                <p className="text-sm text-muted-foreground">Allow customers to leave reviews</p>
                            </div>
                            <Switch
                                checked={settings.enableReviews}
                                onCheckedChange={(v) => setSettings({ ...settings, enableReviews: v })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Wishlists</Label>
                                <p className="text-sm text-muted-foreground">Allow customers to save products for later</p>
                            </div>
                            <Switch
                                checked={settings.enableWishlist}
                                onCheckedChange={(v) => setSettings({ ...settings, enableWishlist: v })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Shipping & Taxes</CardTitle>
                        <CardDescription>Simple tax and shipping rules</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Default Tax Rate (%)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={settings.taxRate}
                                    onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Flat Shipping Rate</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={settings.shippingFlatRate}
                                    onChange={(e) => setSettings({ ...settings, shippingFlatRate: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Free Shipping Threshold</Label>
                            <Input
                                type="number"
                                min="0"
                                value={settings.freeShippingThreshold}
                                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) })}
                            />
                            <p className="text-sm text-muted-foreground">Cart subtotal required for free shipping</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
