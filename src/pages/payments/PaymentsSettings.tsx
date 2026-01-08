import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Save, CreditCard, Shield, DollarSign, Percent } from 'lucide-react';

const PaymentsSettings = () => {
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        enablePayments: true,
        defaultCurrency: 'USD',
        enableStripe: true,
        stripePublishableKey: '',
        stripeSecretKey: '',
        enablePayPal: false,
        paypalClientId: '',
        paypalSecret: '',
        enableSquare: false,
        squareAccessToken: '',
        enableLocalPayments: true,
        enablePaymentLinks: true,
        enableRecurring: true,
        enableInvoicing: true,
        taxRate: 0,
        enableTax: false,
        taxLabel: 'Tax',
        processingFee: 2.9,
        processingFeeType: 'percentage', // 'percentage' | 'fixed'
        passProcessingFee: false,
        enableRefunds: true,
        autoRefundDays: 30,
        requireSignature: false,
        enableTips: false,
        tipSuggestions: [10, 15, 20],
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await api.getSettings();
            if (data?.payments) {
                setSettings(prev => ({ ...prev, ...data.payments }));
            }
        } catch (error) {
            console.error('Failed to load payment settings:', error);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.updateSettings({ payments: settings });
            toast({
                title: 'Settings saved',
                description: 'Payment settings have been updated successfully.',
            });
        } catch (error) {
            toast({
                title: 'Save failed',
                description: 'Could not save payment settings.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const updateSetting = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment Gateways
                    </CardTitle>
                    <CardDescription>Configure payment processing providers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Payments</Label>
                            <p className="text-sm text-muted-foreground">Accept payments from customers</p>
                        </div>
                        <Switch
                            checked={settings.enablePayments}
                            onCheckedChange={v => updateSetting('enablePayments', v)}
                        />
                    </div>

                    {settings.enablePayments && (
                        <>
                            <Separator />

                            <div className="space-y-2">
                                <Label htmlFor="defaultCurrency">Default Currency</Label>
                                <Select value={settings.defaultCurrency} onValueChange={v => updateSetting('defaultCurrency', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Stripe</Label>
                                        <p className="text-sm text-muted-foreground">Accept credit cards via Stripe</p>
                                    </div>
                                    <Switch
                                        checked={settings.enableStripe}
                                        onCheckedChange={v => updateSetting('enableStripe', v)}
                                    />
                                </div>

                                {settings.enableStripe && (
                                    <div className="space-y-4 pl-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="stripePublishableKey">Publishable Key</Label>
                                            <Input
                                                id="stripePublishableKey"
                                                type="password"
                                                placeholder="pk_..."
                                                value={settings.stripePublishableKey}
                                                onChange={e => updateSetting('stripePublishableKey', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="stripeSecretKey">Secret Key</Label>
                                            <Input
                                                id="stripeSecretKey"
                                                type="password"
                                                placeholder="sk_..."
                                                value={settings.stripeSecretKey}
                                                onChange={e => updateSetting('stripeSecretKey', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>PayPal</Label>
                                        <p className="text-sm text-muted-foreground">Accept PayPal payments</p>
                                    </div>
                                    <Switch
                                        checked={settings.enablePayPal}
                                        onCheckedChange={v => updateSetting('enablePayPal', v)}
                                    />
                                </div>

                                {settings.enablePayPal && (
                                    <div className="space-y-4 pl-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="paypalClientId">Client ID</Label>
                                            <Input
                                                id="paypalClientId"
                                                type="password"
                                                value={settings.paypalClientId}
                                                onChange={e => updateSetting('paypalClientId', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="paypalSecret">Secret</Label>
                                            <Input
                                                id="paypalSecret"
                                                type="password"
                                                value={settings.paypalSecret}
                                                onChange={e => updateSetting('paypalSecret', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Square</Label>
                                        <p className="text-sm text-muted-foreground">Accept payments via Square</p>
                                    </div>
                                    <Switch
                                        checked={settings.enableSquare}
                                        onCheckedChange={v => updateSetting('enableSquare', v)}
                                    />
                                </div>

                                {settings.enableSquare && (
                                    <div className="space-y-2 pl-4">
                                        <Label htmlFor="squareAccessToken">Access Token</Label>
                                        <Input
                                            id="squareAccessToken"
                                            type="password"
                                            value={settings.squareAccessToken}
                                            onChange={e => updateSetting('squareAccessToken', e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Payment Features
                    </CardTitle>
                    <CardDescription>Configure payment options and features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Local Payments</Label>
                            <p className="text-sm text-muted-foreground">Accept cash, check, and other local payment methods</p>
                        </div>
                        <Switch
                            checked={settings.enableLocalPayments}
                            onCheckedChange={v => updateSetting('enableLocalPayments', v)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Payment Links</Label>
                            <p className="text-sm text-muted-foreground">Generate shareable payment links</p>
                        </div>
                        <Switch
                            checked={settings.enablePaymentLinks}
                            onCheckedChange={v => updateSetting('enablePaymentLinks', v)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Recurring Payments</Label>
                            <p className="text-sm text-muted-foreground">Support subscription and recurring billing</p>
                        </div>
                        <Switch
                            checked={settings.enableRecurring}
                            onCheckedChange={v => updateSetting('enableRecurring', v)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Invoicing</Label>
                            <p className="text-sm text-muted-foreground">Create and send invoices to customers</p>
                        </div>
                        <Switch
                            checked={settings.enableInvoicing}
                            onCheckedChange={v => updateSetting('enableInvoicing', v)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Tips</Label>
                            <p className="text-sm text-muted-foreground">Allow customers to add tips</p>
                        </div>
                        <Switch
                            checked={settings.enableTips}
                            onCheckedChange={v => updateSetting('enableTips', v)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Percent className="h-5 w-5" />
                        Fees & Taxes
                    </CardTitle>
                    <CardDescription>Configure processing fees and tax settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Enable Tax</Label>
                                <p className="text-sm text-muted-foreground">Add tax to payments</p>
                            </div>
                            <Switch
                                checked={settings.enableTax}
                                onCheckedChange={v => updateSetting('enableTax', v)}
                            />
                        </div>

                        {settings.enableTax && (
                            <div className="grid gap-4 md:grid-cols-2 pl-4">
                                <div className="space-y-2">
                                    <Label htmlFor="taxLabel">Tax Label</Label>
                                    <Input
                                        id="taxLabel"
                                        value={settings.taxLabel}
                                        onChange={e => updateSetting('taxLabel', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                                    <Input
                                        id="taxRate"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={settings.taxRate}
                                        onChange={e => updateSetting('taxRate', parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="processingFeeType">Processing Fee Type</Label>
                                <Select value={settings.processingFeeType} onValueChange={v => updateSetting('processingFeeType', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage</SelectItem>
                                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="processingFee">
                                    Processing Fee {settings.processingFeeType === 'percentage' ? '(%)' : '($)'}
                                </Label>
                                <Input
                                    id="processingFee"
                                    type="number"
                                    min="0"
                                    step={settings.processingFeeType === 'percentage' ? '0.1' : '0.01'}
                                    value={settings.processingFee}
                                    onChange={e => updateSetting('processingFee', parseFloat(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Pass Processing Fee to Customer</Label>
                                <p className="text-sm text-muted-foreground">Add processing fee to customer's total</p>
                            </div>
                            <Switch
                                checked={settings.passProcessingFee}
                                onCheckedChange={v => updateSetting('passProcessingFee', v)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Refunds & Security
                    </CardTitle>
                    <CardDescription>Configure refund policies and security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Refunds</Label>
                            <p className="text-sm text-muted-foreground">Allow refund processing</p>
                        </div>
                        <Switch
                            checked={settings.enableRefunds}
                            onCheckedChange={v => updateSetting('enableRefunds', v)}
                        />
                    </div>

                    {settings.enableRefunds && (
                        <>
                            <Separator />
                            <div className="space-y-2 pl-4">
                                <Label htmlFor="autoRefundDays">Auto-Refund Window (days)</Label>
                                <Input
                                    id="autoRefundDays"
                                    type="number"
                                    min="0"
                                    max="365"
                                    value={settings.autoRefundDays}
                                    onChange={e => updateSetting('autoRefundDays', parseInt(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">Days within which refunds can be processed</p>
                            </div>
                        </>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Require Signature</Label>
                            <p className="text-sm text-muted-foreground">Require customer signature for payments</p>
                        </div>
                        <Switch
                            checked={settings.requireSignature}
                            onCheckedChange={v => updateSetting('requireSignature', v)}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                        <>Saving...</>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Settings
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default PaymentsSettings;
