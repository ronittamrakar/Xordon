import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, Users, DollarSign, MousePointer, ArrowRight } from 'lucide-react';
import { map } from 'lodash';
import { toast } from 'sonner';
import funnelsApi from '@/services/funnelsApi';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';

const FunnelAnalytics = () => {
    const [period, setPeriod] = useState('30');
    const [selectedFunnel, setSelectedFunnel] = useState('all');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        metrics: {
            totalVisitors: number;
            totalSales: number;
            conversionRate: number;
            revenue: number;
        };
        funnelSteps: Array<{ step: string; visitors: number; conversion: number }>;
        trafficData: Array<{ date: string; visitors: number; sales: number }>;
    } | null>(null);

    useEffect(() => {
        loadData();
    }, [period, selectedFunnel]);

    const loadData = async () => {
        try {
            setLoading(true);
            const result = await funnelsApi.getDashboardAnalytics(period, selectedFunnel);
            setData(result);
        } catch (error) {
            console.error('Failed to load funnel analytics:', error);
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const metrics = data?.metrics || {
        totalVisitors: 0,
        totalSales: 0,
        conversionRate: 0,
        revenue: 0
    };

    const funnelSteps = data?.funnelSteps || [];
    const trafficData = data?.trafficData || [];

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">Funnel Analytics</h1>
                    <p className="text-muted-foreground">Traffic and conversion performance across your funnels</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedFunnel} onValueChange={setSelectedFunnel}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select Funnel" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Funnels</SelectItem>
                            <SelectItem value="webinar">Webinar Launch</SelectItem>
                            <SelectItem value="ebook">Ebook Lead Magnet</SelectItem>
                            <SelectItem value="consultation">Consultation Booking</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 Days</SelectItem>
                            <SelectItem value="30">Last 30 Days</SelectItem>
                            <SelectItem value="90">Last 90 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalVisitors.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">vs last period</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                        <MousePointer className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalSales}</div>
                        <p className="text-xs text-muted-foreground">vs last period</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
                        <p className="text-xs text-muted-foreground">vs last period</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${metrics.revenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">vs last period</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Traffic vs Sales */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Performance Overview</CardTitle>
                        <CardDescription>Visitors vs Sales over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trafficData}>
                                    <defs>
                                        <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="date" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip />
                                    <Area
                                        type="monotone"
                                        dataKey="visitors"
                                        stroke="#8b5cf6"
                                        fill="url(#colorVisitors)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="sales"
                                        stroke="#10b981"
                                        fill="url(#colorSales)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Conversion Funnel */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Conversion Funnel</CardTitle>
                        <CardDescription>Drop-off rate between steps</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {funnelSteps.map((step, index) => (
                                <div key={step.step} className="relative">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="font-medium">{step.step}</span>
                                        <span className="text-muted-foreground">{step.visitors.toLocaleString()} visitors</span>
                                    </div>
                                    <div className="h-8 bg-muted rounded-r-md relative overflow-hidden">
                                        <div
                                            className="h-full bg-primary/20 absolute top-0 left-0 border-r-2 border-primary"
                                            style={{ width: `${metrics.totalVisitors > 0 ? (step.visitors / metrics.totalVisitors) * 100 : 0}%` }}
                                        />
                                        <div className="absolute inset-0 flex items-center px-2">
                                            <span className="text-xs font-bold">
                                                {metrics.totalVisitors > 0 ? ((step.visitors / metrics.totalVisitors) * 100).toFixed(1) : 0}%
                                            </span>
                                        </div>
                                    </div>
                                    {index < funnelSteps.length - 1 && (
                                        <div className="flex justify-center -my-1 relative z-10">
                                            <div className="bg-background border rounded-full px-2 py-0.5 text-[10px] text-muted-foreground">
                                                {step.conversion}% conversion
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default FunnelAnalytics;
