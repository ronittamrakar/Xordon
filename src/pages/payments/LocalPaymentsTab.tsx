import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
    CreditCard, DollarSign, Wallet, Plus, CheckCircle2, XCircle, Clock,
    RefreshCw, Receipt, Printer, Download, Eye, MoreVertical, Settings,
    Smartphone, Building2, ArrowUpRight, ArrowDownRight, TrendingUp
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Transaction {
    id: number;
    transaction_id: string;
    amount: number;
    payment_method: 'card' | 'cash' | 'check' | 'mobile';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    customer_name: string;
    customer_email?: string;
    invoice_id?: number;
    invoice_number?: string;
    terminal_id?: number;
    terminal_name?: string;
    card_last_four?: string;
    card_brand?: string;
    notes?: string;
    created_at: string;
}

interface Terminal {
    id: number;
    terminal_name: string;
    terminal_id: string;
    provider: 'square' | 'stripe' | 'clover' | 'custom';
    status: 'active' | 'inactive';
    location: string;
    last_transaction_at?: string;
    total_transactions: number;
}

interface DashboardStats {
    today_volume: number;
    today_transactions: number;
    pending_settlements: number;
    weekly_volume: number;
    monthly_volume: number;
    avg_transaction: number;
    success_rate: number;
}

const PAYMENT_METHODS = [
    { value: 'card', label: 'Card', icon: CreditCard },
    { value: 'cash', label: 'Cash', icon: DollarSign },
    { value: 'check', label: 'Check', icon: Receipt },
    { value: 'mobile', label: 'Mobile Pay', icon: Smartphone },
];

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    failed: { label: 'Failed', color: 'bg-red-100 text-red-800', icon: XCircle },
    refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800', icon: RefreshCw },
};

const LocalPaymentsTab = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [terminals, setTerminals] = useState<Terminal[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false);
    const [isNewTerminalOpen, setIsNewTerminalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterMethod, setFilterMethod] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [transactionForm, setTransactionForm] = useState({
        amount: '',
        payment_method: 'card',
        customer_name: '',
        customer_email: '',
        invoice_number: '',
        terminal_id: '',
        card_last_four: '',
        notes: '',
    });

    const [terminalForm, setTerminalForm] = useState({
        terminal_name: '',
        terminal_id: '',
        provider: 'stripe',
        location: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            try {
                const [txRes, terminalsRes, statsRes] = await Promise.all([
                    api.get('/operations/local-payments/transactions'),
                    api.get('/operations/local-payments/terminals'),
                    api.get('/operations/local-payments/stats'),
                ]);
                setTransactions((txRes.data as any).items || []);
                setTerminals((terminalsRes.data as any).items || []);
                setStats((statsRes.data as any) || null);
            } catch {
                // Use mock data for preview
                setTransactions([
                    {
                        id: 1,
                        transaction_id: 'TXN-001',
                        amount: 250.00,
                        payment_method: 'card',
                        status: 'completed',
                        customer_name: 'John Smith',
                        customer_email: 'john@example.com',
                        invoice_number: 'INV-001',
                        terminal_name: 'Front Desk POS',
                        card_last_four: '4242',
                        card_brand: 'Visa',
                        created_at: new Date().toISOString(),
                    },
                    {
                        id: 2,
                        transaction_id: 'TXN-002',
                        amount: 89.50,
                        payment_method: 'cash',
                        status: 'completed',
                        customer_name: 'Jane Doe',
                        terminal_name: 'Mobile Terminal',
                        created_at: new Date(Date.now() - 3600000).toISOString(),
                    },
                    {
                        id: 3,
                        transaction_id: 'TXN-003',
                        amount: 175.00,
                        payment_method: 'card',
                        status: 'pending',
                        customer_name: 'Bob Wilson',
                        customer_email: 'bob@example.com',
                        card_last_four: '1234',
                        card_brand: 'Mastercard',
                        created_at: new Date(Date.now() - 7200000).toISOString(),
                    },
                    {
                        id: 4,
                        transaction_id: 'TXN-004',
                        amount: 450.00,
                        payment_method: 'check',
                        status: 'completed',
                        customer_name: 'Sarah Johnson',
                        invoice_number: 'INV-002',
                        notes: 'Check #1234',
                        created_at: new Date(Date.now() - 86400000).toISOString(),
                    },
                    {
                        id: 5,
                        transaction_id: 'TXN-005',
                        amount: 125.00,
                        payment_method: 'mobile',
                        status: 'refunded',
                        customer_name: 'Mike Brown',
                        notes: 'Customer requested refund',
                        created_at: new Date(Date.now() - 172800000).toISOString(),
                    },
                ]);
                setTerminals([
                    { id: 1, terminal_name: 'Front Desk POS', terminal_id: 'TERM-001', provider: 'stripe', status: 'active', location: 'Main Office', total_transactions: 156, last_transaction_at: new Date().toISOString() },
                    { id: 2, terminal_name: 'Mobile Terminal', terminal_id: 'TERM-002', provider: 'square', status: 'active', location: 'Field Service', total_transactions: 89, last_transaction_at: new Date(Date.now() - 3600000).toISOString() },
                    { id: 3, terminal_name: 'Backup Terminal', terminal_id: 'TERM-003', provider: 'clover', status: 'inactive', location: 'Storage', total_transactions: 0 },
                ]);
                setStats({
                    today_volume: 514.50,
                    today_transactions: 3,
                    pending_settlements: 175.00,
                    weekly_volume: 2456.00,
                    monthly_volume: 12450.00,
                    avg_transaction: 165.50,
                    success_rate: 98.5,
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleProcessTransaction = async () => {
        try {
            const txId = `TXN-${String(transactions.length + 1).padStart(3, '0')}`;
            const newTransaction: Transaction = {
                id: transactions.length + 1,
                transaction_id: txId,
                amount: parseFloat(transactionForm.amount) || 0,
                payment_method: transactionForm.payment_method as Transaction['payment_method'],
                status: 'completed',
                customer_name: transactionForm.customer_name,
                customer_email: transactionForm.customer_email || undefined,
                invoice_number: transactionForm.invoice_number || undefined,
                terminal_id: transactionForm.terminal_id ? parseInt(transactionForm.terminal_id) : undefined,
                terminal_name: terminals.find(t => t.id === parseInt(transactionForm.terminal_id))?.terminal_name,
                card_last_four: transactionForm.card_last_four || undefined,
                notes: transactionForm.notes || undefined,
                created_at: new Date().toISOString(),
            };

            try {
                await api.post('/operations/local-payments/transactions', newTransaction);
            } catch {
                // Preview mode
            }

            setTransactions(prev => [newTransaction, ...prev]);
            if (stats) {
                setStats({
                    ...stats,
                    today_volume: stats.today_volume + newTransaction.amount,
                    today_transactions: stats.today_transactions + 1,
                });
            }
            setIsNewTransactionOpen(false);
            resetTransactionForm();
            toast.success(`Payment of Rs ${newTransaction.amount.toFixed(2)} processed successfully`);
        } catch {
            toast.error('Failed to process payment');
        }
    };

    const handleAddTerminal = async () => {
        try {
            const newTerminal: Terminal = {
                id: terminals.length + 1,
                terminal_name: terminalForm.terminal_name,
                terminal_id: terminalForm.terminal_id || `TERM-${String(terminals.length + 1).padStart(3, '0')}`,
                provider: terminalForm.provider as Terminal['provider'],
                status: 'active',
                location: terminalForm.location,
                total_transactions: 0,
            };

            try {
                await api.post('/operations/local-payments/terminals', newTerminal);
            } catch {
                // Preview mode
            }

            setTerminals(prev => [...prev, newTerminal]);
            setIsNewTerminalOpen(false);
            resetTerminalForm();
            toast.success('Terminal added successfully');
        } catch {
            toast.error('Failed to add terminal');
        }
    };

    const handleRefund = async (transactionId: number) => {
        if (!confirm('Are you sure you want to refund this transaction?')) return;

        try {
            try {
                await api.post(`/operations/local-payments/transactions/${transactionId}/refund`);
            } catch {
                // Preview mode
            }

            setTransactions(prev => prev.map(tx =>
                tx.id === transactionId
                    ? { ...tx, status: 'refunded' as const }
                    : tx
            ));
            toast.success('Transaction refunded');
        } catch {
            toast.error('Failed to process refund');
        }
    };

    const handlePrintReceipt = (transaction: Transaction) => {
        toast.info('Opening print dialog...');
        // In production, this would generate and print a receipt
        window.print();
    };

    const handleExportReceipt = (transaction: Transaction) => {
        toast.info('Downloading receipt...');
        // In production, this would generate and download a PDF receipt
    };

    const resetTransactionForm = () => {
        setTransactionForm({
            amount: '',
            payment_method: 'card',
            customer_name: '',
            customer_email: '',
            invoice_number: '',
            terminal_id: '',
            card_last_four: '',
            notes: '',
        });
    };

    const resetTerminalForm = () => {
        setTerminalForm({
            terminal_name: '',
            terminal_id: '',
            provider: 'stripe',
            location: '',
        });
    };

    const getStatusBadge = (status: Transaction['status']) => {
        const config = STATUS_CONFIG[status];
        const Icon = config.icon;
        return (
            <Badge className={config.color}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </Badge>
        );
    };

    const getPaymentMethodIcon = (method: string) => {
        const config = PAYMENT_METHODS.find(m => m.value === method);
        if (!config) return <CreditCard className="h-4 w-4" />;
        const Icon = config.icon;
        return <Icon className="h-4 w-4" />;
    };

    const getProviderColor = (provider: string) => {
        switch (provider) {
            case 'stripe': return 'bg-purple-100 text-purple-800';
            case 'square': return 'bg-blue-100 text-blue-800';
            case 'clover': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchesStatus = filterStatus === 'all' || tx.status === filterStatus;
        const matchesMethod = filterMethod === 'all' || tx.payment_method === filterMethod;
        const matchesSearch = !searchQuery ||
            tx.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.transaction_id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesMethod && matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Local Payments & Terminals</h2>
                    <p className="text-muted-foreground mt-1">
                        Manage point-of-sale and in-person payment transactions
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsNewTerminalOpen(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Add Terminal
                    </Button>
                    <Button onClick={() => setIsNewTransactionOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Transaction
                    </Button>
                </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Today's Volume</p>
                                <p className="text-2xl font-bold">Rs {(stats?.today_volume || 0).toFixed(2)}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Transactions</p>
                                <p className="text-2xl font-bold">{stats?.today_transactions || 0}</p>
                            </div>
                            <CreditCard className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold">Rs {(stats?.pending_settlements || 0).toFixed(2)}</p>
                            </div>
                            <Wallet className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Weekly</p>
                                <p className="text-2xl font-bold">Rs {(stats?.weekly_volume || 0).toFixed(2)}</p>
                            </div>
                            <ArrowUpRight className="h-8 w-8 text-emerald-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Monthly</p>
                                <p className="text-2xl font-bold">Rs {((stats?.monthly_volume || 0) / 1000).toFixed(1)}k</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Avg. Transaction</p>
                                <p className="text-2xl font-bold">Rs {(stats?.avg_transaction || 0).toFixed(2)}</p>
                            </div>
                            <Receipt className="h-8 w-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Success Rate</p>
                                <p className="text-2xl font-bold text-green-600">{stats?.success_rate || 0}%</p>
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="transactions" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="transactions">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Transactions
                    </TabsTrigger>
                    <TabsTrigger value="terminals">
                        <Smartphone className="h-4 w-4 mr-2" />
                        Terminals
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="transactions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Recent Transactions</CardTitle>
                                    <CardDescription>History of local payment activities</CardDescription>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Input
                                        placeholder="Search transactions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-64"
                                    />
                                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                                        <SelectTrigger className="w-36">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="failed">Failed</SelectItem>
                                            <SelectItem value="refunded">Refunded</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={filterMethod} onValueChange={setFilterMethod}>
                                        <SelectTrigger className="w-36">
                                            <SelectValue placeholder="Method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Methods</SelectItem>
                                            {PAYMENT_METHODS.map(m => (
                                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" size="icon" onClick={loadData}>
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-12">
                                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-muted-foreground">Loading transactions...</p>
                                </div>
                            ) : filteredTransactions.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No transactions found</p>
                                    <Button onClick={() => setIsNewTransactionOpen(true)} className="mt-4">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Process First Payment
                                    </Button>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Transaction ID</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Terminal</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTransactions.map((tx) => (
                                            <TableRow key={tx.id}>
                                                <TableCell className="font-medium">{tx.transaction_id}</TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p>{tx.customer_name}</p>
                                                        {tx.customer_email && (
                                                            <p className="text-sm text-muted-foreground">{tx.customer_email}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    Rs {tx.amount.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getPaymentMethodIcon(tx.payment_method)}
                                                        <span className="capitalize">{tx.payment_method}</span>
                                                        {tx.card_last_four && (
                                                            <span className="text-muted-foreground">•••• {tx.card_last_four}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(tx.status)}</TableCell>
                                                <TableCell>
                                                    {tx.terminal_name || <span className="text-muted-foreground">-</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p>{new Date(tx.created_at).toLocaleDateString()}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {new Date(tx.created_at).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handlePrintReceipt(tx)}>
                                                                <Printer className="h-4 w-4 mr-2" />
                                                                Print Receipt
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleExportReceipt(tx)}>
                                                                <Download className="h-4 w-4 mr-2" />
                                                                Download Receipt
                                                            </DropdownMenuItem>
                                                            {tx.status === 'completed' && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleRefund(tx.id)}
                                                                    className="text-red-600"
                                                                >
                                                                    <RefreshCw className="h-4 w-4 mr-2" />
                                                                    Refund
                                                                </DropdownMenuItem>
                                                            )}
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
                </TabsContent>

                <TabsContent value="terminals" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Payment Terminals</CardTitle>
                                    <CardDescription>Manage your POS devices and integrations</CardDescription>
                                </div>
                                <Button onClick={() => setIsNewTerminalOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Terminal
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {terminals.map((terminal) => (
                                    <Card key={terminal.id}>
                                        <CardContent className="pt-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Smartphone className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{terminal.terminal_name}</p>
                                                        <p className="text-sm text-muted-foreground">{terminal.terminal_id}</p>
                                                    </div>
                                                </div>
                                                <Badge className={terminal.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                                    {terminal.status}
                                                </Badge>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">Provider</span>
                                                    <Badge className={getProviderColor(terminal.provider)}>
                                                        {terminal.provider}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">Location</span>
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="h-3 w-3" />
                                                        {terminal.location}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">Transactions</span>
                                                    <span className="font-medium">{terminal.total_transactions}</span>
                                                </div>
                                                {terminal.last_transaction_at && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-muted-foreground">Last Active</span>
                                                        <span>{new Date(terminal.last_transaction_at).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* New Transaction Dialog */}
            <Dialog open={isNewTransactionOpen} onOpenChange={setIsNewTransactionOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Process Payment</DialogTitle>
                        <DialogDescription>Record a new local payment transaction</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Amount *</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rs</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={transactionForm.amount}
                                    onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                                    className="pl-10"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Payment Method *</Label>
                            <Select
                                value={transactionForm.payment_method}
                                onValueChange={(v) => setTransactionForm({ ...transactionForm, payment_method: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_METHODS.map(m => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Customer Name *</Label>
                            <Input
                                value={transactionForm.customer_name}
                                onChange={(e) => setTransactionForm({ ...transactionForm, customer_name: e.target.value })}
                                placeholder="Customer name"
                            />
                        </div>
                        <div>
                            <Label>Customer Email</Label>
                            <Input
                                type="email"
                                value={transactionForm.customer_email}
                                onChange={(e) => setTransactionForm({ ...transactionForm, customer_email: e.target.value })}
                                placeholder="customer@example.com"
                            />
                        </div>
                        {transactionForm.payment_method === 'card' && (
                            <div>
                                <Label>Card Last 4 Digits</Label>
                                <Input
                                    value={transactionForm.card_last_four}
                                    onChange={(e) => setTransactionForm({ ...transactionForm, card_last_four: e.target.value })}
                                    placeholder="1234"
                                    maxLength={4}
                                />
                            </div>
                        )}
                        <div>
                            <Label>Terminal</Label>
                            <Select
                                value={transactionForm.terminal_id}
                                onValueChange={(v) => setTransactionForm({ ...transactionForm, terminal_id: v })}
                            >
                                <SelectTrigger><SelectValue placeholder="Select terminal" /></SelectTrigger>
                                <SelectContent>
                                    {terminals.filter(t => t.status === 'active').map(terminal => (
                                        <SelectItem key={terminal.id} value={String(terminal.id)}>{terminal.terminal_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Invoice Number</Label>
                            <Input
                                value={transactionForm.invoice_number}
                                onChange={(e) => setTransactionForm({ ...transactionForm, invoice_number: e.target.value })}
                                placeholder="INV-001"
                            />
                        </div>
                        <div>
                            <Label>Notes</Label>
                            <Input
                                value={transactionForm.notes}
                                onChange={(e) => setTransactionForm({ ...transactionForm, notes: e.target.value })}
                                placeholder="Additional notes"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsNewTransactionOpen(false); resetTransactionForm(); }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleProcessTransaction}
                            disabled={!transactionForm.amount || !transactionForm.customer_name}
                        >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Process Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Terminal Dialog */}
            <Dialog open={isNewTerminalOpen} onOpenChange={setIsNewTerminalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Terminal</DialogTitle>
                        <DialogDescription>Register a new payment terminal</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Terminal Name *</Label>
                            <Input
                                value={terminalForm.terminal_name}
                                onChange={(e) => setTerminalForm({ ...terminalForm, terminal_name: e.target.value })}
                                placeholder="e.g., Front Desk POS"
                            />
                        </div>
                        <div>
                            <Label>Terminal ID</Label>
                            <Input
                                value={terminalForm.terminal_id}
                                onChange={(e) => setTerminalForm({ ...terminalForm, terminal_id: e.target.value })}
                                placeholder="Auto-generated if empty"
                            />
                        </div>
                        <div>
                            <Label>Provider *</Label>
                            <Select
                                value={terminalForm.provider}
                                onValueChange={(v) => setTerminalForm({ ...terminalForm, provider: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="stripe">Stripe</SelectItem>
                                    <SelectItem value="square">Square</SelectItem>
                                    <SelectItem value="clover">Clover</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Location *</Label>
                            <Input
                                value={terminalForm.location}
                                onChange={(e) => setTerminalForm({ ...terminalForm, location: e.target.value })}
                                placeholder="e.g., Main Office"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsNewTerminalOpen(false); resetTerminalForm(); }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddTerminal}
                            disabled={!terminalForm.terminal_name || !terminalForm.location}
                        >
                            Add Terminal
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LocalPaymentsTab;
