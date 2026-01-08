import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, RefreshCw, Settings, MoreHorizontal } from 'lucide-react';
import { api } from '@/lib/api';

import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Payment {
    id: number;
    invoice_id: number | null;
    amount: number;
    currency: string;
    status: string;
    paid_at: string;
    created_at?: string;
    payment_method: string;
    notes?: string;
}

interface Invoice {
    id: number;
    invoice_number: string;
    total: number;
    amount_due: number;
    contact_first_name: string;
    contact_last_name: string;
    contact_id?: number;
    status: string;
}

export default function Transactions() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [methodFilter, setMethodFilter] = useState('all');

    // Dialog states
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [paymentType, setPaymentType] = useState<'invoice' | 'custom'>('invoice');

    const [paymentForm, setPaymentForm] = useState({
        invoice_id: '',
        contact_id: '',
        amount: '',
        currency: 'USD',
        payment_method: 'credit_card',
        notes: '',
        paid_at: new Date().toISOString().slice(0, 16),
    });

    // Settings state
    const [settings, setSettings] = useState({
        default_currency: 'USD',
        invoice_prefix: 'INV-',
        default_tax_rate: 0,
        auto_send_receipts: true
    });

    const [savingPayment, setSavingPayment] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const { toast } = useToast();

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [paymentsRes, invoicesRes, settingsRes] = await Promise.all([
                api.get<{ items: Payment[] } | Payment[]>('/payments/payments'),
                api.get<{ items: Invoice[] } | { data: Invoice[] }>('/payments/invoices'),
                api.get<any>('/payments/settings')
            ]);

            // Handle payments
            const loadedPayments = (paymentsRes.data as any).items || paymentsRes.data || [];
            setPayments(Array.isArray(loadedPayments) ? loadedPayments : []);

            // Handle invoices
            // Invoices might be wrapped in items or data, ensuring array
            let loadedInvoices = [];
            if ((invoicesRes.data as any).items) {
                loadedInvoices = (invoicesRes.data as any).items;
            } else if ((invoicesRes.data as any).data) { // Laravel style pagination sometimes
                loadedInvoices = (invoicesRes.data as any).data;
            } else if (Array.isArray(invoicesRes.data)) {
                loadedInvoices = invoicesRes.data;
            }

            setInvoices(loadedInvoices.filter((inv: any) => inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'draft'));

            // Handle Settings
            if (settingsRes.data) {
                setSettings({
                    default_currency: settingsRes.data.default_currency || 'USD',
                    invoice_prefix: settingsRes.data.invoice_prefix || 'INV-',
                    default_tax_rate: Number(settingsRes.data.default_tax_rate) || 0,
                    auto_send_receipts: !!settingsRes.data.auto_send_receipts
                });

                // Set default currency for form
                setPaymentForm(prev => ({
                    ...prev,
                    currency: settingsRes.data.default_currency || 'USD'
                }));
            }

        } catch (error) {
            console.error('Failed to load data:', error);
            toast({ title: 'Failed to load data', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSaveSettings = async () => {
        try {
            setSavingSettings(true);
            await api.post('/payments/settings', settings);
            toast({ title: 'Settings saved' });
            setIsSettingsOpen(false);
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
        } finally {
            setSavingSettings(false);
        }
    };

    const handleRefund = async (paymentId: number) => {
        if (!confirm('Are you sure you want to refund this payment? This will update the invoice status.')) return;
        try {
            await api.post(`/payments/payments/${paymentId}/refund`);
            toast({ title: 'Payment refunded' });
            loadData();
        } catch (error) {
            console.error('Failed to refund:', error);
            toast({ title: 'Error', description: 'Failed to process refund.', variant: 'destructive' });
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            completed: 'bg-green-100 text-green-800 border-green-200',
            active: 'bg-green-100 text-green-800 border-green-200',
            paid: 'bg-green-100 text-green-800 border-green-200',
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            failed: 'bg-red-100 text-red-800 border-red-200',
            refunded: 'bg-purple-100 text-purple-800 border-purple-200',
        };
        return <Badge className={`${colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'} border`}>{status}</Badge>;
    };

    const openNewPaymentDialog = () => {
        setPaymentForm({
            invoice_id: '',
            contact_id: '',
            amount: '',
            currency: settings.default_currency,
            payment_method: 'credit_card',
            notes: '',
            paid_at: new Date().toISOString().slice(0, 16),
        });
        setPaymentType('invoice');
        setIsPaymentDialogOpen(true);
    };

    const handleSavePayment = async () => {
        const amount = parseFloat(paymentForm.amount || '0');
        if (Number.isNaN(amount) || amount <= 0) {
            toast({ title: 'Invalid amount', description: 'Amount must be a positive number.', variant: 'destructive' });
            return;
        }

        let invoiceId = null;
        if (paymentType === 'invoice') {
            invoiceId = paymentForm.invoice_id ? Number(paymentForm.invoice_id) : null;
            if (!invoiceId) {
                toast({ title: 'Invoice required', description: 'Please select an invoice.', variant: 'destructive' });
                return;
            }
        }

        const paidAtValue = paymentForm.paid_at ? `${paymentForm.paid_at.replace('T', ' ')}:00` : undefined;

        try {
            setSavingPayment(true);
            const payload = {
                invoice_id: invoiceId, // Can be null if custom
                contact_id: paymentForm.contact_id ? Number(paymentForm.contact_id) : null,
                amount,
                currency: paymentForm.currency,
                payment_method: paymentForm.payment_method,
                notes: paymentForm.notes.trim() || null,
                paid_at: paidAtValue,
                payment_type: paymentType === 'invoice' ? 'invoice_payment' : 'custom_payment'
            };

            await api.post('/payments/payments', payload);
            toast({ title: 'Payment recorded' });
            setIsPaymentDialogOpen(false);
            await loadData(); // Reload data
        } catch (error) {
            console.error('Failed to record payment:', error);
            toast({ title: 'Error', description: 'Failed to record payment.', variant: 'destructive' });
        } finally {
            setSavingPayment(false);
        }
    };

    const onInvoiceSelect = (invoiceIdStr: string) => {
        const inv = invoices.find(i => i.id.toString() === invoiceIdStr);
        if (inv) {
            setPaymentForm({
                ...paymentForm,
                invoice_id: invoiceIdStr,
                amount: inv.amount_due > 0 ? inv.amount_due.toString() : '',
                contact_id: inv.contact_id ? inv.contact_id.toString() : ''
            });
        } else {
            setPaymentForm({ ...paymentForm, invoice_id: invoiceIdStr });
        }
    };

    const filteredPayments = payments.filter(p => {
        // Method filter
        if (methodFilter !== 'all' && p.payment_method !== methodFilter) {
            return false;
        }

        // Search filter
        if (!searchTerm) return true;
        const lowerSearch = searchTerm.toLowerCase();
        return (
            (p.invoice_id?.toString() || '').includes(searchTerm) ||
            p.amount.toString().includes(searchTerm) ||
            (p.payment_method || '').toLowerCase().includes(lowerSearch) ||
            (p.notes || '').toLowerCase().includes(lowerSearch)
        );
    });

    return (

        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
                    <p className="text-muted-foreground">View and manage all received payments</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </Button>
                    <Button variant="outline" onClick={loadData} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={openNewPaymentDialog}>
                        <Plus className="h-4 w-4 mr-2" />
                        Record Transaction
                    </Button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center bg-card p-4 rounded-lg border shadow-sm gap-4">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search transactions..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={methodFilter} onValueChange={setMethodFilter}>
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Method" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Methods</SelectItem>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && payments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <RefreshCw className="h-8 w-8 animate-spin mb-2" />
                                            <p>Loading transactions...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredPayments.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell className="font-medium text-nowrap">
                                        {new Date(payment.paid_at || payment.created_at || Date.now()).toLocaleDateString()}
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(payment.paid_at || payment.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {payment.invoice_id ? (
                                            <div className="flex flex-col">
                                                <Badge variant="outline" className="w-fit mb-1 border-blue-200 bg-blue-50 text-blue-700">
                                                    Inv #{payment.invoice_id}
                                                </Badge>
                                                {(payment as any).first_name && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {(payment as any).first_name} {(payment as any).last_name}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground italic text-sm">Custom Entry</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-semibold text-base">
                                        {payment.currency || 'USD'} {Number(payment.amount).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="capitalize">
                                        <div className="flex items-center gap-2">
                                            {payment.payment_method?.replace('_', ' ') || 'Unknown'}
                                        </div>
                                        {payment.notes && (
                                            <div title={payment.notes} className="text-xs text-muted-foreground max-w-[150px] truncate mt-1 border-l-2 pl-2 border-gray-200">
                                                {payment.notes}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(payment.status || 'completed')}</TableCell>
                                    <TableCell className="text-right">
                                        {payment.status !== 'refunded' && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleRefund(payment.id)} className="text-red-600 cursor-pointer">
                                                        Refund Payment
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && filteredPayments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-gray-100 p-3 rounded-full mb-3">
                                                <Search className="h-6 w-6 text-gray-400" />
                                            </div>
                                            <p className="font-medium">No transactions found</p>
                                            <p className="text-sm">Try adjusting your filters or record a new payment.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Payment Dialog */}
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                            Record a payment manually. Link to an invoice or create a custom transaction.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                        <Tabs value={paymentType} onValueChange={(v: any) => setPaymentType(v)} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="invoice">Pay Invoice</TabsTrigger>
                                <TabsTrigger value="custom">Custom amount</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="space-y-4 py-2">
                        {paymentType === 'invoice' && (
                            <div className="space-y-2">
                                <Label>Select Invoice</Label>
                                <Select
                                    value={paymentForm.invoice_id}
                                    onValueChange={onInvoiceSelect}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an invoice..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {invoices.length === 0 ? (
                                            <div className="p-2 text-sm text-center text-muted-foreground">No unpaid invoices found</div>
                                        ) : (
                                            invoices.map((inv) => (
                                                <SelectItem key={inv.id} value={inv.id.toString()}>
                                                    {inv.invoice_number} - {inv.contact_first_name} {inv.contact_last_name} (${Number(inv.amount_due || 0).toFixed(2)} due)
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="payment-amount">Amount</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                    <Input
                                        id="payment-amount"
                                        className="pl-7"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={paymentForm.amount}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="payment-method">Method</Label>
                                <Select
                                    value={paymentForm.payment_method}
                                    onValueChange={(value) => setPaymentForm({ ...paymentForm, payment_method: value })}
                                >
                                    <SelectTrigger id="payment-method">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="credit_card">Card</SelectItem>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="check">Check</SelectItem>
                                        <SelectItem value="paypal">PayPal</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="payment-date">Date Received</Label>
                            <Input
                                id="payment-date"
                                type="datetime-local"
                                value={paymentForm.paid_at}
                                onChange={(e) => setPaymentForm({ ...paymentForm, paid_at: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="payment-notes">Notes (Optional)</Label>
                            <Textarea
                                id="payment-notes"
                                value={paymentForm.notes}
                                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                placeholder="Reference number, internal notes..."
                                className="resize-none"
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsPaymentDialogOpen(false)}
                            disabled={savingPayment}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSavePayment} disabled={savingPayment}>
                            {savingPayment ? 'Saving...' : 'Record Payment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Settings Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Payment Settings</DialogTitle>
                        <DialogDescription>
                            Configure default payment settings and preferences.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="currency" className="text-right">
                                Currency
                            </Label>
                            <Input
                                id="currency"
                                value={settings.default_currency}
                                onChange={(e) => setSettings({ ...settings, default_currency: e.target.value })}
                                className="col-span-3 uppercase"
                                placeholder="USD"
                                maxLength={3}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="prefix" className="text-right">
                                Inv. Prefix
                            </Label>
                            <Input
                                id="prefix"
                                value={settings.invoice_prefix}
                                onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })}
                                className="col-span-3"
                                placeholder="INV-"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="tax" className="text-right">
                                Tax Rate %
                            </Label>
                            <Input
                                id="tax"
                                type="number"
                                value={settings.default_tax_rate}
                                onChange={(e) => setSettings({ ...settings, default_tax_rate: parseFloat(e.target.value) })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="flex items-center justify-between col-span-4 px-4 bg-muted/50 p-3 rounded-md">
                            <Label htmlFor="receipts" className="cursor-pointer font-medium">Auto-send Receipts</Label>
                            <input
                                type="checkbox"
                                id="receipts"
                                checked={settings.auto_send_receipts}
                                onChange={(e) => setSettings({ ...settings, auto_send_receipts: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 accent-primary"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSettings} disabled={savingSettings}>
                            {savingSettings ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

    );
}
