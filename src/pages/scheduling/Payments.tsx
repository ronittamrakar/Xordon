import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { Loader2, DollarSign, Calendar, RefreshCcw, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface SchedulingPaymentsProps {
    hideHeader?: boolean;
}

export default function SchedulingPayments({ hideHeader = false }: SchedulingPaymentsProps) {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [paymentsRes, statsRes] = await Promise.all([
                api.get('/finance/payments'),
                api.get('/finance/stats')
            ]);
            setPayments(paymentsRes.data.items || []);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to load payments:', error);
            toast.error('Failed to load payment data');
        } finally {
            setLoading(false);
        }
    };

    const filteredPayments = payments.filter(p => {
        const search = filter.toLowerCase();
        return (
            p.transaction_id?.toLowerCase().includes(search) ||
            p.contact_email?.toLowerCase().includes(search) ||
            p.first_name?.toLowerCase().includes(search) ||
            p.last_name?.toLowerCase().includes(search) ||
            (p.appointment_id && String(p.appointment_id).includes(search))
        );
    });

    // Filter for only Appointment payments if needed, or show all transactions
    // For scheduling view, we probably want to prioritize appointments
    const appointmentPayments = filteredPayments.filter(p => p.appointment_id);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className={hideHeader ? "space-y-8" : "p-8 space-y-8"}>
            {!hideHeader && (
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Payments & Transactions</h1>
                        <p className="text-muted-foreground mt-2">Manage your appointment payments and transaction history.</p>
                    </div>
                    <Button onClick={loadData} variant="outline" size="sm">
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats?.total_revenue?.toLocaleString() || '0.00'}</div>
                        <p className="text-xs text-muted-foreground">Lifetime earnings</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats?.this_month_revenue?.toLocaleString() || '0.00'}</div>
                        <p className="text-xs text-muted-foreground">Revenue current month</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Transactions</CardTitle>
                            <CardDescription>Recent payments from appointments and invoices</CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search transactions..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPayments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No transactions found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPayments.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell>{new Date(p.created_at).toLocaleDateString()} {new Date(p.created_at).toLocaleTimeString()}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {p.first_name ? `${p.first_name} ${p.last_name}` : p.guest_name || 'Unknown'}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {p.contact_email || p.appointment_email || '-'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {p.appointment_id ? (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                                                    Appt #{p.appointment_id}
                                                </Badge>
                                            ) : p.invoice_number ? (
                                                <Badge variant="outline">
                                                    {p.invoice_number}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                            {p.transaction_id && (
                                                <div className="text-xs text-muted-foreground mt-1 font-mono">
                                                    {p.transaction_id}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="capitalize">{p.payment_method}</TableCell>
                                        <TableCell className="font-medium">
                                            {p.currency} {parseFloat(p.amount).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={p.status === 'completed' ? 'default' : p.status === 'refunded' ? 'destructive' : 'secondary'}>
                                                {p.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
