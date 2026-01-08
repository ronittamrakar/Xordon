import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import {
    DollarSign,
    TrendingUp,
    CreditCard,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Download,
} from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { api } from '@/lib/api';
import { format } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const generateMockData = () => {
    return {
        overview: {
            revenue: 125000,
            expenses: 45000,
            profit: 80000,
            outstanding: 12000
        },
        cashflow: Array.from({ length: 12 }).map((_, i) => ({
            month: format(new Date(Date.now() - (11 - i) * 30 * 86400000), 'MMM'),
            income: Math.floor(Math.random() * 20000) + 10000,
            expenses: Math.floor(Math.random() * 10000) + 5000
        })),
        expensesByCategory: [
            { name: 'Software', value: 35 },
            { name: 'Marketing', value: 25 },
            { name: 'Personnel', value: 20 },
            { name: 'Office', value: 10 },
            { name: 'Other', value: 10 },
        ],
        recentTransactions: Array.from({ length: 5 }).map((_, i) => ({
            id: i,
            date: format(new Date(Date.now() - i * 86400000), 'MMM dd, yyyy'),
            description: `Transaction #${1000 + i}`,
            amount: (Math.random() * 1000).toFixed(2),
            type: Math.random() > 0.3 ? 'income' : 'expense'
        }))
    };
};

const FinanceAnalytics: React.FC = () => {
    const { data, refetch } = useQuery({
        queryKey: ['finance-analytics'],
        queryFn: async () => {
            try {
                return await api.getFinanceAnalytics();
            } catch (error) {
                console.error(error);
                return generateMockData();
            }
        }
    });

    const analytics = data || generateMockData();

    const StatCard = ({ title, value, icon: Icon, trend, color, subtext }: any) => (
        <Card>
            <CardContent className="p-6">
                <div className="flex justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <h3 className="text-2xl font-bold mt-2">{value}</h3>
                        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
                    </div>
                    <div className={`p-3 rounded-xl bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                </div>
                {trend && (
                    <div className={`mt-4 flex items-center text-xs font-medium ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {trend.startsWith('+') ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                        {trend} vs last month
                    </div>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-4">
            <Breadcrumb items={[{ label: 'Finance', href: '/finance' }, { label: 'Analytics' }]} />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">
                        Financial Performance
                    </h1>
                    <p className="text-muted-foreground">Revenue, expenses and cash flow analysis</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Download className="h-4 w-4 mr-2" /> Export</Button>
                    <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total Revenue" value={`$${analytics.overview.revenue.toLocaleString()}`} icon={DollarSign} trend="+12%" color="text-green-600" />
                <StatCard title="Total Expenses" value={`$${analytics.overview.expenses.toLocaleString()}`} icon={CreditCard} trend="+5%" color="text-red-600" />
                <StatCard title="Net Profit" value={`$${analytics.overview.profit.toLocaleString()}`} icon={Wallet} trend="+18%" color="text-blue-600" />
                <StatCard title="Outstanding" value={`$${analytics.overview.outstanding.toLocaleString()}`} icon={DollarSign} subtext="Pending payments" color="text-orange-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Cash Flow Forecast</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics.cashflow}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Expense Breakdown</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={analytics.expensesByCategory} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                    {analytics.expensesByCategory.map((e, i) => <Cell key={i} fill={COLORS[i]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default FinanceAnalytics;
