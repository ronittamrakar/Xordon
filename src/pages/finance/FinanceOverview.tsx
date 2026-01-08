import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    DollarSign,
    CreditCard,
    FileTextIcon,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Users,
    Receipt,
    Wallet,
    AlertCircle,
    CheckCircle2,
    Clock,
    BarChart3
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface DashboardStats {
    total_revenue: number;
    outstanding_amount: number;
    this_month_revenue: number;
    overdue_invoices: number;
}

interface Invoice {
    id: number;
    invoice_number: string;
    total: number;
    status: string;
    due_date: string;
    issue_date: string;
    contact_first_name?: string;
    contact_last_name?: string;
    contact_email?: string;
    amount_due?: number;
    currency: string;
}

interface Payment {
    id: number;
    amount: number;
    currency: string;
    paid_at: string;
    payment_method: string;
    invoice_id?: number;
    status: string;
}

interface ExtendedStats {
    total_invoices: number;
    paid_invoices: number;
    pending_invoices: number;
    total_payments: number;
    avg_invoice_value: number;
    last_month_revenue: number;
    revenue_growth: number;
}

export default function FinanceOverview() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [extendedStats, setExtendedStats] = useState<ExtendedStats | null>(null);
    const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
    const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [statsRes, invoicesRes, paymentsRes] = await Promise.all([
                api.get<DashboardStats>('/payments/dashboard-stats'),
                api.get<{ items: Invoice[] }>('/payments/invoices?limit=10'),
                api.get<{ items: Payment[] }>('/payments/payments?limit=10'),
            ]);

            setStats(statsRes.data ?? null);
            const invoices = invoicesRes.data.items || [];
            const payments = paymentsRes.data.items || [];

            setRecentInvoices(invoices.slice(0, 5));
            setRecentPayments(payments.slice(0, 5));

            // Calculate extended stats
            const totalInvoices = invoices.length;
            const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
            const pendingInvoices = invoices.filter(inv => ['sent', 'viewed', 'partially_paid'].includes(inv.status)).length;
            const avgInvoiceValue = totalInvoices > 0 ? invoices.reduce((sum, inv) => sum + inv.total, 0) / totalInvoices : 0;

            // Calculate last month revenue for growth comparison
            const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
            const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));
            const lastMonthPayments = payments.filter(p => {
                const paidDate = new Date(p.paid_at);
                return paidDate >= lastMonthStart && paidDate <= lastMonthEnd && p.status === 'completed';
            });
            const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + p.amount, 0);
            const revenueGrowth = lastMonthRevenue > 0
                ? ((statsRes.data.this_month_revenue - lastMonthRevenue) / lastMonthRevenue) * 100
                : 0;

            setExtendedStats({
                total_invoices: totalInvoices,
                paid_invoices: paidInvoices,
                pending_invoices: pendingInvoices,
                total_payments: payments.length,
                avg_invoice_value: avgInvoiceValue,
                last_month_revenue: lastMonthRevenue,
                revenue_growth: revenueGrowth
            });

        } catch (error) {
            console.error('Failed to load finance overview:', error);
            const message = error instanceof Error ? error.message : 'Something went wrong while loading finance data.';
            toast({ title: 'Failed to load finance data', description: message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { className: string; icon?: React.ReactNode }> = {
            paid: { className: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
            pending: { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="h-3 w-3 mr-1" /> },
            overdue: { className: 'bg-red-100 text-red-800 border-red-200', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
            draft: { className: 'bg-gray-100 text-gray-800 border-gray-200' },
            sent: { className: 'bg-blue-100 text-blue-800 border-blue-200' },
            viewed: { className: 'bg-purple-100 text-purple-800 border-purple-200' },
            partially_paid: { className: 'bg-orange-100 text-orange-800 border-orange-200' },
            completed: { className: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
        };
        const style = styles[status] || { className: 'bg-gray-100 text-gray-800 border-gray-200' };
        return (
            <Badge className={`${style.className} border flex items-center w-fit`}>
                {style.icon}
                {status.replace('_', ' ')}
            </Badge>
        );
    };

    const formatCurrency = (amount: number, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground">Loading financial data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SEO
                title="Finance Overview"
                description="Track your revenue, invoices, and financial health at a glance"
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Finance Overview</h1>
                    <p className="text-muted-foreground">Track your revenue and financial health</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={loadData} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => navigate('/finance/invoices')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Invoice
                    </Button>
                </div>
            </div>

            {/* Primary Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                <DollarSign className="h-4 w-4 text-green-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.total_revenue || 0)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Lifetime revenue</p>
                            {extendedStats && extendedStats.revenue_growth !== 0 && (
                                <div className="flex items-center mt-2 text-xs">
                                    {extendedStats.revenue_growth > 0 ? (
                                        <>
                                            <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                                            <span className="text-green-600 font-medium">+{extendedStats.revenue_growth.toFixed(1)}%</span>
                                        </>
                                    ) : (
                                        <>
                                            <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                                            <span className="text-red-600 font-medium">{extendedStats.revenue_growth.toFixed(1)}%</span>
                                        </>
                                    )}
                                    <span className="text-muted-foreground ml-1">vs last month</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                            <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                <CreditCard className="h-4 w-4 text-yellow-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.outstanding_amount || 0)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
                            {extendedStats && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    {extendedStats.pending_invoices} pending invoice{extendedStats.pending_invoices !== 1 ? 's' : ''}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">This Month</CardTitle>
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.this_month_revenue || 0)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Current month revenue</p>
                            {extendedStats && extendedStats.last_month_revenue > 0 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    Last month: {formatCurrency(extendedStats.last_month_revenue)}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.overdue_invoices}</div>
                            <p className="text-xs text-muted-foreground mt-1">Invoices past due</p>
                            {stats.overdue_invoices > 0 && (
                                <Button
                                    variant="link"
                                    className="text-xs p-0 h-auto mt-2 text-red-600"
                                    onClick={() => navigate('/finance/invoices?status=overdue')}
                                >
                                    View overdue invoices →
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Secondary Stats */}
            {extendedStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Invoices</p>
                                    <p className="text-2xl font-bold">{extendedStats.total_invoices}</p>
                                </div>
                                <FileTextIcon className="h-8 w-8 text-muted-foreground opacity-50" />
                            </div>
                            <div className="mt-3 flex gap-4 text-xs">
                                <div className="flex items-center gap-1">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <span>{extendedStats.paid_invoices} paid</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                                    <span>{extendedStats.pending_invoices} pending</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Avg Invoice Value</p>
                                    <p className="text-2xl font-bold">{formatCurrency(extendedStats.avg_invoice_value)}</p>
                                </div>
                                <BarChart3 className="h-8 w-8 text-muted-foreground opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Payments</p>
                                    <p className="text-2xl font-bold">{extendedStats.total_payments}</p>
                                </div>
                                <Receipt className="h-8 w-8 text-muted-foreground opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                    <CardDescription>Common financial tasks</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/finance/invoices')}>
                            <FileTextIcon className="h-5 w-5" />
                            <span className="text-sm">View Invoices</span>
                        </Button>
                        <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/finance/transactions')}>
                            <Wallet className="h-5 w-5" />
                            <span className="text-sm">Transactions</span>
                        </Button>
                        <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/finance/products')}>
                            <Receipt className="h-5 w-5" />
                            <span className="text-sm">Products</span>
                        </Button>
                        <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/finance/subscriptions')}>
                            <Calendar className="h-5 w-5" />
                            <span className="text-sm">Subscriptions</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Invoices</CardTitle>
                            <CardDescription>Latest invoice activity</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/finance/invoices')}>
                            View All →
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {recentInvoices.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentInvoices.map((invoice) => (
                                        <TableRow
                                            key={invoice.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => navigate(`/finance/invoices`)}
                                        >
                                            <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                                            <TableCell className="text-sm">
                                                {invoice.contact_first_name || invoice.contact_last_name
                                                    ? `${invoice.contact_first_name || ''} ${invoice.contact_last_name || ''}`.trim()
                                                    : invoice.contact_email || '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(invoice.total, invoice.currency)}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileTextIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No recent invoices</p>
                                <Button variant="link" size="sm" onClick={() => navigate('/finance/invoices')} className="mt-2">
                                    Create your first invoice
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Payments</CardTitle>
                            <CardDescription>Latest payment activity</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/finance/transactions')}>
                            View All →
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {recentPayments.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentPayments.map((payment) => (
                                        <TableRow
                                            key={payment.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => navigate('/finance/transactions')}
                                        >
                                            <TableCell className="text-sm">
                                                {format(parseISO(payment.paid_at), 'MMM d, yyyy')}
                                                <div className="text-xs text-muted-foreground">
                                                    {format(parseISO(payment.paid_at), 'h:mm a')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(payment.amount, payment.currency)}
                                            </TableCell>
                                            <TableCell className="capitalize text-sm">
                                                {payment.payment_method.replace('_', ' ')}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No recent payments</p>
                                <Button variant="link" size="sm" onClick={() => navigate('/finance/transactions')} className="mt-2">
                                    Record a payment
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

