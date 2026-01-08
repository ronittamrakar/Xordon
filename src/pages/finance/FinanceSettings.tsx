import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Landmark, DollarSign, FileTextIcon, Settings, Save, Loader2 } from 'lucide-react';
import SEO from '@/components/SEO';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';

interface PaymentSettings {
    default_currency: string;
    default_tax_rate: number;
    invoice_prefix: string;
    invoice_footer: string;
    payment_terms: string;
    stripe_publishable_key: string;
    paypal_client_id: string;
    auto_send_receipts: boolean;
}

export default function FinanceSettings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<PaymentSettings>({
        default_currency: 'USD',
        default_tax_rate: 0,
        invoice_prefix: 'INV-',
        invoice_footer: '',
        payment_terms: '',
        stripe_publishable_key: '',
        paypal_client_id: '',
        auto_send_receipts: true
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/payments/settings') as any;
            const data = response.data || response;

            if (data) {
                setSettings({
                    default_currency: data.default_currency || 'USD',
                    default_tax_rate: parseFloat(data.default_tax_rate) || 0,
                    invoice_prefix: data.invoice_prefix || 'INV-',
                    invoice_footer: data.invoice_footer || '',
                    payment_terms: data.payment_terms || '',
                    stripe_publishable_key: data.stripe_publishable_key || '',
                    paypal_client_id: data.paypal_client_id || '',
                    auto_send_receipts: data.auto_send_receipts === 1 || data.auto_send_receipts === true
                });
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await api.put('/payments/settings', settings);

            toast({
                title: 'Settings Saved',
                description: 'Your finance settings have been updated successfully.'
            });
        } catch (error) {
            console.error('Error saving settings:', error);
            toast({
                title: 'Error',
                description: 'Failed to save settings. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof PaymentSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            <SEO
                title="Finance Settings"
                description="Configure payment gateways, tax rates, and currency settings for your business."
            />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-[18px] font-bold tracking-tight">Finance Settings</h1>
                        <p className="text-sm text-muted-foreground">Manage your financial preferences, invoicing, and payment gateways.</p>
                    </div>
                    <Button onClick={handleSaveSettings} disabled={saving} className="min-w-[140px]">
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>

                {/* Main Content - Vertical Sections */}
                <div className="space-y-8">
                    {/* General Settings Section */}
                    <section id="general-settings" className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <DollarSign className="w-4 h-4 text-blue-500" />
                            <h3 className="text-base font-semibold">General Settings</h3>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    Currency & Tax
                                </CardTitle>
                                <CardDescription>Set your default currency and tax preferences.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="currency">Default Currency</Label>
                                        <select
                                            id="currency"
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={settings.default_currency}
                                            onChange={(e) => handleChange('default_currency', e.target.value)}
                                        >
                                            <option value="USD">USD - US Dollar</option>
                                            <option value="EUR">EUR - Euro</option>
                                            <option value="GBP">GBP - British Pound</option>
                                            <option value="CAD">CAD - Canadian Dollar</option>
                                            <option value="AUD">AUD - Australian Dollar</option>
                                            <option value="INR">INR - Indian Rupee</option>
                                        </select>
                                        <p className="text-xs text-muted-foreground">This currency will be used for all new invoices and products by default.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
                                        <Input
                                            id="tax-rate"
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={settings.default_tax_rate}
                                            onChange={(e) => handleChange('default_tax_rate', e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">Default tax rate applied to new products/services.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Invoicing Settings Section */}
                    <section id="invoicing-settings" className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <FileTextIcon className="w-4 h-4 text-indigo-500" />
                            <h3 className="text-base font-semibold">Invoicing Configuration</h3>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Invoice Details</CardTitle>
                                <CardDescription>Customize how your invoices look and behave.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="prefix">Invoice Prefix</Label>
                                        <Input
                                            id="prefix"
                                            value={settings.invoice_prefix}
                                            onChange={(e) => handleChange('invoice_prefix', e.target.value)}
                                            placeholder="INV-"
                                        />
                                        <p className="text-xs text-muted-foreground">Prefix for invoice numbers (e.g., INV-0001).</p>
                                    </div>
                                    <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Auto-send Receipts</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Automatically email receipts when payment is recorded.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={settings.auto_send_receipts}
                                            onCheckedChange={(checked) => handleChange('auto_send_receipts', checked)}
                                        />
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="terms">Default Payment Terms & Notes</Label>
                                        <Textarea
                                            id="terms"
                                            rows={4}
                                            value={settings.payment_terms}
                                            onChange={(e) => handleChange('payment_terms', e.target.value)}
                                            placeholder="e.g. Payment due within 30 days. Late fees may apply."
                                        />
                                        <p className="text-xs text-muted-foreground">These terms will appear on all new invoices.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="footer">Invoice Footer</Label>
                                        <Textarea
                                            id="footer"
                                            rows={2}
                                            value={settings.invoice_footer}
                                            onChange={(e) => handleChange('invoice_footer', e.target.value)}
                                            placeholder="Thank you for your business!"
                                        />
                                        <p className="text-xs text-muted-foreground">Text to display at the bottom of every invoice.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Payment Gateways Section */}
                    <section id="payment-gateways" className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <CreditCard className="w-4 h-4 text-green-500" />
                            <h3 className="text-base font-semibold">Payment Gateways</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        Stripe Integration
                                    </CardTitle>
                                    <CardDescription>Accept credit cards via Stripe.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="stripe-key">Stripe Publishable Key</Label>
                                        <Input
                                            id="stripe-key"
                                            type="password"
                                            value={settings.stripe_publishable_key}
                                            onChange={(e) => handleChange('stripe_publishable_key', e.target.value)}
                                            placeholder="pk_test_..."
                                            className="font-mono"
                                        />
                                        <p className="text-xs text-muted-foreground">Your Stripe Publishable Key found in Stripe Dashboard &gt; Developers &gt; API keys.</p>
                                    </div>
                                    {settings.stripe_publishable_key && (
                                        <div className="rounded-md bg-green-500/10 border border-green-500/20 p-3">
                                            <div className="flex gap-3">
                                                <div className="flex-shrink-0">
                                                    <CreditCard className="h-5 w-5 text-green-600" aria-hidden="true" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-green-800 dark:text-green-400">Stripe is connected</h3>
                                                    <p className="text-xs text-green-700 dark:text-green-500 mt-1">You can now accept credit card payments on invoices.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        PayPal Integration
                                    </CardTitle>
                                    <CardDescription>Accept payments via PayPal.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="paypal-id">PayPal Client ID</Label>
                                        <Input
                                            id="paypal-id"
                                            type="password"
                                            value={settings.paypal_client_id}
                                            onChange={(e) => handleChange('paypal_client_id', e.target.value)}
                                            placeholder="Live or Sandbox Client ID"
                                            className="font-mono"
                                        />
                                        <p className="text-xs text-muted-foreground">Your PayPal Client ID found in PayPal Developer Dashboard.</p>
                                    </div>
                                    {settings.paypal_client_id && (
                                        <div className="rounded-md bg-blue-500/10 border border-blue-500/20 p-3">
                                            <div className="flex gap-3">
                                                <div className="flex-shrink-0">
                                                    <Landmark className="h-5 w-5 text-blue-600" aria-hidden="true" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400">PayPal is connected</h3>
                                                    <p className="text-xs text-blue-700 dark:text-blue-500 mt-1">You can now accept PayPal payments on invoices.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
