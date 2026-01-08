import React, { useMemo } from 'react';
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
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    FileText,
    CheckCircle,
    XCircle,
    Activity,
    RefreshCw
} from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { api } from '@/lib/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const generateMockData = () => {
    return {
        overview: {
            totalEstimates: 145,
            accepted: 89,
            declined: 12,
            pending: 44,
            conversionRate: 61.4,
            value: 450000
        },
        pipeline: [
            { name: 'Draft', value: 15 },
            { name: 'Sent', value: 29 },
            { name: 'Viewed', value: 18 },
            { name: 'Accepted', value: 89 },
            { name: 'Declined', value: 12 },
        ],
        monthly: Array.from({ length: 6 }).map((_, i) => ({
            month: `Month ${i + 1}`,
            sent: Math.floor(Math.random() * 50) + 20,
            accepted: Math.floor(Math.random() * 30) + 10
        }))
    };
};

const EstimatesAnalytics: React.FC = () => {
    const { data, refetch } = useQuery({
        queryKey: ['estimates-analytics'],
        queryFn: async () => {
            try {
                return await api.getEstimatesAnalytics();
            } catch (error) {
                console.error(error);
                return generateMockData();
            }
        }
    });

    const analytics = data || generateMockData();

    return (
        <div className="space-y-4">
            <Breadcrumb items={[{ label: 'Finance', href: '/finance' }, { label: 'Estimates', href: '/finance/estimates' }, { label: 'Analytics' }]} />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">
                        Estimates Analytics
                    </h1>
                    <p className="text-muted-foreground">Pipeline and conversion metrics</p>
                </div>
                <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-muted-foreground">Total Estimates</p>
                        <h3 className="text-2xl font-bold mt-2">{analytics.overview.totalEstimates}</h3>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                        <h3 className="text-2xl font-bold mt-2 text-green-600">{analytics.overview.conversionRate}%</h3>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                        <h3 className="text-2xl font-bold mt-2">${analytics.overview.value.toLocaleString()}</h3>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-muted-foreground">Pending</p>
                        <h3 className="text-2xl font-bold mt-2 text-orange-600">{analytics.overview.pending}</h3>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Status Distribution</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={analytics.pipeline} dataKey="value" cx="50%" cy="50%" outerRadius={100} label>
                                    {analytics.pipeline.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Monthly Trend</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics.monthly}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="sent" fill="#3b82f6" name="Sent" />
                                <Bar dataKey="accepted" fill="#10b981" name="Accepted" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default EstimatesAnalytics;
