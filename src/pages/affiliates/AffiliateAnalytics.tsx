import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { affiliatesApi } from '@/services/affiliatesApi';
import { Loader2, TrendingUp, Users, DollarSign, Award, Calendar, Download } from 'lucide-react';
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
    PieChart,
    Pie,
    Cell
} from 'recharts';

const AffiliateAnalytics = () => {
    const [dateRange, setDateRange] = useState('30_days');

    const { data: analytics, isLoading } = useQuery({
        queryKey: ['affiliate-analytics', dateRange],
        queryFn: () => affiliatesApi.getAnalytics(), // In real app, pass dateRange
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Mock chart data if API doesn't provide it yet
    const referralTrend = [
        { date: 'Mon', referrals: 12, conversions: 4 },
        { date: 'Tue', referrals: 19, conversions: 6 },
        { date: 'Wed', referrals: 15, conversions: 5 },
        { date: 'Thu', referrals: 22, conversions: 8 },
        { date: 'Fri', referrals: 30, conversions: 12 },
        { date: 'Sat', referrals: 18, conversions: 7 },
        { date: 'Sun', referrals: 10, conversions: 3 },
    ];

    const distributionData = [
        { name: 'Social Media', value: 45 },
        { name: 'Blog/Content', value: 30 },
        { name: 'Email', value: 15 },
        { name: 'Direct', value: 10 },
    ];

    const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">Affiliate Analytics</h1>
                    <p className="text-muted-foreground">Detailed insights into your partner program performance</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[180px]">
                            <Calendar className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Select Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7_days">Last 7 Days</SelectItem>
                            <SelectItem value="30_days">Last 30 Days</SelectItem>
                            <SelectItem value="90_days">Last Quarter</SelectItem>
                            <SelectItem value="year">Last Year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$12,450.00</div>
                        <p className="text-xs text-muted-foreground">+15% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Affiliates</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.affiliates?.active || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {analytics?.affiliates?.total || 0} total registered
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4.2%</div>
                        <p className="text-xs text-muted-foreground">+0.5% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Commissions Paid</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${analytics?.payouts?.total_paid?.toLocaleString() || '0.00'}</div>
                        <p className="text-xs text-muted-foreground">
                            ${analytics?.payouts?.pending_amount?.toLocaleString() || '0.00'} pending
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Referral Trends</CardTitle>
                        <CardDescription>Traffic vs Conversions over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={referralTrend}>
                                    <defs>
                                        <linearGradient id="colorReferrals" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="date" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip />
                                    <Area
                                        type="monotone"
                                        dataKey="referrals"
                                        stroke="#8b5cf6"
                                        fillOpacity={1}
                                        fill="url(#colorReferrals)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="conversions"
                                        stroke="#10b981"
                                        fillOpacity={1}
                                        fill="url(#colorConversions)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Traffic Sources</CardTitle>
                        <CardDescription>Where referrals are coming from</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distributionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {distributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex justify-center gap-4 mt-4">
                                {distributionData.map((entry, index) => (
                                    <div key={entry.name} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-sm text-muted-foreground">{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AffiliateAnalytics;
