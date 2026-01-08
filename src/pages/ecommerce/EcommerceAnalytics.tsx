import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area
} from 'recharts';
import {
    ShoppingCart,
    DollarSign,
    Package,
    Users,
    RefreshCw,
    TrendingUp
} from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { api } from '@/lib/api';

const generateMockData = () => {
    return {
        overview: {
            totalSales: 45200.50,
            orders: 342,
            aov: 132.16,
            conversionRate: 2.4
        },
        salesTrend: Array.from({ length: 12 }).map((_, i) => ({
            month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
            sales: Math.floor(Math.random() * 5000) + 2000
        })),
        topProducts: [
            { name: 'Product A', sales: 12000 },
            { name: 'Product B', sales: 8500 },
            { name: 'Product C', sales: 6200 },
            { name: 'Product D', sales: 4100 },
        ]
    };
};

const EcommerceAnalytics: React.FC = () => {
    const { data, refetch } = useQuery({
        queryKey: ['ecommerce-analytics'],
        queryFn: async () => {
            try {
                return await api.getEcommerceAnalytics();
            } catch (error) {
                console.error(error);
                return generateMockData();
            }
        }
    });

    const analytics = data || generateMockData();

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <Card>
            <CardContent className="p-6">
                <div className="flex justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <h3 className="text-2xl font-bold mt-2">{value}</h3>
                    </div>
                    <div className={`p-3 rounded-xl bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-4">
            <Breadcrumb items={[{ label: 'Ecommerce', href: '/ecommerce' }, { label: 'Analytics' }]} />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">
                        Ecommerce Analytics
                    </h1>
                    <p className="text-muted-foreground">Store performance and sales insights</p>
                </div>
                <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total Sales" value={`$${analytics.overview.totalSales.toLocaleString()}`} icon={DollarSign} color="text-green-600" />
                <StatCard title="Total Orders" value={analytics.overview.orders} icon={Package} color="text-blue-600" />
                <StatCard title="Avg Order Value" value={`$${analytics.overview.aov}`} icon={TrendingUp} color="text-purple-600" />
                <StatCard title="Store Convention" value={`${analytics.overview.conversionRate}%`} icon={Users} color="text-orange-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Sales Trend</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={analytics.salesTrend}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Area type="monotone" dataKey="sales" stroke="#10b981" fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Top Products</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics.topProducts} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="sales" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default EcommerceAnalytics;
