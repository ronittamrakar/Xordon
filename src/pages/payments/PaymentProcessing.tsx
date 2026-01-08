import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    CreditCard,
    Link2,
    DollarSign,
    Building2,
    CheckCircle,
    AlertCircle,
    ExternalLink,
    Copy,
    Send,
    Smartphone,
    Mail,
    RefreshCw,
    Settings,
    Wallet,
    TrendingUp,
    ArrowRight,
    Plus,
    Clock,
    Eye,
    MoreVertical,
    Search,
    Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import * as stripeApi from '@/services/stripeApi';

export default function PaymentProcessing() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');
    const [showConnectDialog, setShowConnectDialog] = useState(false);
    const [showPaymentLinkDialog, setShowPaymentLinkDialog] = useState(false);
    const [showTextToPayDialog, setShowTextToPayDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Form states
    const [paymentLinkForm, setPaymentLinkForm] = useState({
        amount: '',
        currency: 'usd',
        description: '',
        expires_in_hours: 72,
    });

    const [textToPayForm, setTextToPayForm] = useState({
        contact_id: '',
        amount: '',
        description: '',
        send_via: 'sms' as 'sms' | 'email' | 'both',
        message: '',
    });

    // Queries
    const { data: connectAccount, isLoading: loadingAccount } = useQuery({
        queryKey: ['stripe-connect-account'],
        queryFn: () => stripeApi.getConnectAccount(),
    });

    const { data: balance } = useQuery({
        queryKey: ['stripe-balance'],
        queryFn: () => stripeApi.getAccountBalance(),
        enabled: !!connectAccount?.charges_enabled,
    });

    const { data: paymentLinks } = useQuery({
        queryKey: ['payment-links'],
        queryFn: () => stripeApi.listPaymentLinks(),
    });

    const { data: settings } = useQuery({
        queryKey: ['stripe-settings'],
        queryFn: () => stripeApi.getStripeSettings(),
    });

    // Mutations
    const createAccountMutation = useMutation({
        mutationFn: () => stripeApi.createConnectAccount('express'),
        onSuccess: async () => {
            const onboarding = await stripeApi.getOnboardingUrl(
                window.location.href,
                window.location.href
            );
            window.location.href = onboarding.url;
        },
        onError: () => toast.error('Failed to create Stripe account'),
    });

    const createPaymentLinkMutation = useMutation({
        mutationFn: (data: Parameters<typeof stripeApi.createPaymentLink>[0]) =>
            stripeApi.createPaymentLink(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-links'] });
            setShowPaymentLinkDialog(false);
            toast.success('Payment link created!');
        },
        onError: () => toast.error('Failed to create payment link'),
    });

    const sendTextToPayMutation = useMutation({
        mutationFn: (data: stripeApi.TextToPayRequest) => stripeApi.sendTextToPay(data),
        onSuccess: () => {
            setShowTextToPayDialog(false);
            toast.success('Payment request sent!');
        },
        onError: () => toast.error('Failed to send payment request'),
    });

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    const formatCurrency = (amount: number, currency: string = 'usd') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(amount / 100);
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            active: 'default',
            completed: 'secondary',
            inactive: 'outline',
        };
        return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
    };

    if (loadingAccount) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Show onboarding if no account or not fully set up
    if (!connectAccount || !connectAccount.charges_enabled) {
        return (
            <div className="container max-w-4xl py-8">
                <Card className="border-2 border-dashed">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                            <CreditCard className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl">Set Up Payment Processing</CardTitle>
                        <CardDescription className="text-lg max-w-md mx-auto">
                            Connect your Stripe account to start accepting payments, send payment links, and use text-to-pay.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                            <div className="p-4 rounded-lg bg-muted/50">
                                <CreditCard className="w-6 h-6 mx-auto mb-2 text-primary" />
                                <p className="text-sm font-medium">Accept Cards</p>
                                <p className="text-xs text-muted-foreground">Visa, Mastercard, Amex</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                                <Smartphone className="w-6 h-6 mx-auto mb-2 text-primary" />
                                <p className="text-sm font-medium">Text-to-Pay</p>
                                <p className="text-xs text-muted-foreground">Send payment links via SMS</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                                <Link2 className="w-6 h-6 mx-auto mb-2 text-primary" />
                                <p className="text-sm font-medium">Payment Links</p>
                                <p className="text-xs text-muted-foreground">Shareable checkout links</p>
                            </div>
                        </div>

                        {connectAccount && !connectAccount.details_submitted ? (
                            <div className="space-y-4">
                                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                    <div className="flex items-center gap-2 text-amber-600">
                                        <AlertCircle className="w-5 h-5" />
                                        <span className="font-medium">Account setup incomplete</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Continue setting up your Stripe account to start accepting payments.
                                    </p>
                                </div>
                                <Button
                                    size="lg"
                                    onClick={async () => {
                                        const onboarding = await stripeApi.getOnboardingUrl(
                                            window.location.href,
                                            window.location.href
                                        );
                                        window.location.href = onboarding.url;
                                    }}
                                >
                                    Continue Setup <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        ) : (
                            <Button
                                size="lg"
                                onClick={() => createAccountMutation.mutate()}
                                disabled={createAccountMutation.isPending}
                            >
                                {createAccountMutation.isPending ? (
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <CreditCard className="w-4 h-4 mr-2" />
                                )}
                                Connect with Stripe
                            </Button>
                        )}

                        <p className="text-xs text-muted-foreground">
                            Powered by Stripe. PCI compliant and secure.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Payment Processing</h1>
                    <p className="text-muted-foreground">
                        Manage payments, links, and text-to-pay
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowTextToPayDialog(true)}>
                        <Smartphone className="w-4 h-4 mr-2" />
                        Text-to-Pay
                    </Button>
                    <Button onClick={() => setShowPaymentLinkDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Payment Link
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Available Balance</CardDescription>
                        <CardTitle className="text-2xl text-green-600">
                            {balance?.available?.[0]
                                ? formatCurrency(balance.available[0].amount, balance.available[0].currency)
                                : '$0.00'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Ready for payout</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Pending Balance</CardDescription>
                        <CardTitle className="text-2xl">
                            {balance?.pending?.[0]
                                ? formatCurrency(balance.pending[0].amount, balance.pending[0].currency)
                                : '$0.00'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Processing</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Active Links</CardDescription>
                        <CardTitle className="text-2xl">
                            {paymentLinks?.data?.filter(l => l.status === 'active').length || 0}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Payment links</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Account Status</CardDescription>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Active
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button variant="link" className="p-0 h-auto text-xs" asChild>
                            <a
                                href="#"
                                onClick={async (e) => {
                                    e.preventDefault();
                                    const link = await stripeApi.getDashboardLoginLink();
                                    window.open(link.url, '_blank');
                                }}
                            >
                                Open Stripe Dashboard <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="payment-links">Payment Links</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => setShowPaymentLinkDialog(true)}
                                >
                                    <Link2 className="w-4 h-4 mr-3" />
                                    Create Payment Link
                                    <ArrowRight className="w-4 h-4 ml-auto" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => setShowTextToPayDialog(true)}
                                >
                                    <Smartphone className="w-4 h-4 mr-3" />
                                    Send Text-to-Pay Request
                                    <ArrowRight className="w-4 h-4 ml-auto" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => window.open('/finance/invoices', '_self')}
                                >
                                    <DollarSign className="w-4 h-4 mr-3" />
                                    View Invoices
                                    <ArrowRight className="w-4 h-4 ml-auto" />
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Recent Payment Links */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Payment Links</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {paymentLinks?.data?.slice(0, 5).map((link) => (
                                    <div
                                        key={link.id}
                                        className="flex items-center justify-between py-3 border-b last:border-0"
                                    >
                                        <div>
                                            <p className="font-medium">{link.description}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatCurrency(link.amount, link.currency)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(link.status)}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => copyToClipboard(link.url)}
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {(!paymentLinks?.data || paymentLinks.data.length === 0) && (
                                    <p className="text-center text-muted-foreground py-8">
                                        No payment links yet
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="payment-links" className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search payment links..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button variant="outline" size="icon">
                            <Filter className="w-4 h-4" />
                        </Button>
                    </div>

                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Link</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paymentLinks?.data?.map((link) => (
                                    <TableRow key={link.id}>
                                        <TableCell className="font-medium">{link.description}</TableCell>
                                        <TableCell>{formatCurrency(link.amount, link.currency)}</TableCell>
                                        <TableCell>{getStatusBadge(link.status)}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(link.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(link.url)}
                                            >
                                                <Copy className="w-4 h-4 mr-1" />
                                                Copy
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => window.open(link.url, '_blank')}>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Preview
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => copyToClipboard(link.url)}>
                                                        <Copy className="w-4 h-4 mr-2" />
                                                        Copy Link
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => {
                                                            stripeApi.deactivatePaymentLink(link.id).then(() => {
                                                                queryClient.invalidateQueries({ queryKey: ['payment-links'] });
                                                                toast.success('Payment link deactivated');
                                                            });
                                                        }}
                                                    >
                                                        Deactivate
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="transactions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Transactions</CardTitle>
                            <CardDescription>
                                View all transactions in your Stripe Dashboard
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center py-12">
                            <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-4">
                                Transaction history is available in your Stripe Dashboard
                            </p>
                            <Button
                                onClick={async () => {
                                    const link = await stripeApi.getDashboardLoginLink();
                                    window.open(link.url, '_blank');
                                }}
                            >
                                Open Stripe Dashboard <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Settings</CardTitle>
                            <CardDescription>Configure your payment processing preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Default Currency</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Currency used for new payment links
                                    </p>
                                </div>
                                <Select defaultValue={settings?.default_currency || 'usd'}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="usd">USD</SelectItem>
                                        <SelectItem value="eur">EUR</SelectItem>
                                        <SelectItem value="gbp">GBP</SelectItem>
                                        <SelectItem value="cad">CAD</SelectItem>
                                        <SelectItem value="aud">AUD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Test Mode</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Use test credentials for development
                                    </p>
                                </div>
                                <Switch checked={settings?.test_mode} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Automatic Tax</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Automatically calculate and collect taxes
                                    </p>
                                </div>
                                <Switch checked={settings?.automatic_tax} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Text-to-Pay Template</CardTitle>
                            <CardDescription>Customize the message sent with payment requests</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Hi {customer_name}, here's your payment link for {amount}: {link}"
                                defaultValue={settings?.text_to_pay_template}
                                rows={4}
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Available variables: {'{customer_name}'}, {'{amount}'}, {'{description}'}, {'{link}'}
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create Payment Link Dialog */}
            <Dialog open={showPaymentLinkDialog} onOpenChange={setShowPaymentLinkDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Payment Link</DialogTitle>
                        <DialogDescription>
                            Generate a shareable link for customers to pay
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Amount</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        $
                                    </span>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        className="pl-7"
                                        value={paymentLinkForm.amount}
                                        onChange={(e) =>
                                            setPaymentLinkForm({ ...paymentLinkForm, amount: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Currency</Label>
                                <Select
                                    value={paymentLinkForm.currency}
                                    onValueChange={(v) =>
                                        setPaymentLinkForm({ ...paymentLinkForm, currency: v })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="usd">USD</SelectItem>
                                        <SelectItem value="eur">EUR</SelectItem>
                                        <SelectItem value="gbp">GBP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                placeholder="e.g., Invoice #1234"
                                value={paymentLinkForm.description}
                                onChange={(e) =>
                                    setPaymentLinkForm({ ...paymentLinkForm, description: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Link Expires In</Label>
                            <Select
                                value={paymentLinkForm.expires_in_hours.toString()}
                                onValueChange={(v) =>
                                    setPaymentLinkForm({ ...paymentLinkForm, expires_in_hours: parseInt(v) })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="24">24 hours</SelectItem>
                                    <SelectItem value="72">3 days</SelectItem>
                                    <SelectItem value="168">7 days</SelectItem>
                                    <SelectItem value="720">30 days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPaymentLinkDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() =>
                                createPaymentLinkMutation.mutate({
                                    amount: parseFloat(paymentLinkForm.amount) * 100,
                                    currency: paymentLinkForm.currency,
                                    description: paymentLinkForm.description,
                                    expires_in_hours: paymentLinkForm.expires_in_hours,
                                })
                            }
                            disabled={createPaymentLinkMutation.isPending}
                        >
                            {createPaymentLinkMutation.isPending && (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            Create Link
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Text-to-Pay Dialog */}
            <Dialog open={showTextToPayDialog} onOpenChange={setShowTextToPayDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send Payment Request</DialogTitle>
                        <DialogDescription>
                            Send a payment link directly to a customer via SMS or email
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Contact</Label>
                            <Input
                                placeholder="Search contacts..."
                                value={textToPayForm.contact_id}
                                onChange={(e) =>
                                    setTextToPayForm({ ...textToPayForm, contact_id: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    $
                                </span>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    className="pl-7"
                                    value={textToPayForm.amount}
                                    onChange={(e) =>
                                        setTextToPayForm({ ...textToPayForm, amount: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                placeholder="What is this payment for?"
                                value={textToPayForm.description}
                                onChange={(e) =>
                                    setTextToPayForm({ ...textToPayForm, description: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Send Via</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={textToPayForm.send_via === 'sms' ? 'default' : 'outline'}
                                    onClick={() => setTextToPayForm({ ...textToPayForm, send_via: 'sms' })}
                                    className="flex-1"
                                >
                                    <Smartphone className="w-4 h-4 mr-2" />
                                    SMS
                                </Button>
                                <Button
                                    type="button"
                                    variant={textToPayForm.send_via === 'email' ? 'default' : 'outline'}
                                    onClick={() => setTextToPayForm({ ...textToPayForm, send_via: 'email' })}
                                    className="flex-1"
                                >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Email
                                </Button>
                                <Button
                                    type="button"
                                    variant={textToPayForm.send_via === 'both' ? 'default' : 'outline'}
                                    onClick={() => setTextToPayForm({ ...textToPayForm, send_via: 'both' })}
                                    className="flex-1"
                                >
                                    Both
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Custom Message (Optional)</Label>
                            <Textarea
                                placeholder="Add a personal message..."
                                value={textToPayForm.message}
                                onChange={(e) =>
                                    setTextToPayForm({ ...textToPayForm, message: e.target.value })
                                }
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTextToPayDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() =>
                                sendTextToPayMutation.mutate({
                                    contact_id: textToPayForm.contact_id,
                                    amount: parseFloat(textToPayForm.amount) * 100,
                                    description: textToPayForm.description,
                                    send_via: textToPayForm.send_via,
                                    message: textToPayForm.message || undefined,
                                })
                            }
                            disabled={sendTextToPayMutation.isPending}
                        >
                            {sendTextToPayMutation.isPending ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4 mr-2" />
                            )}
                            Send Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
