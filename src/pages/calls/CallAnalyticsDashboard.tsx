import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Phone,
    PhoneIncoming,
    PhoneOutgoing,
    Clock,
    TrendingUp,
    TrendingDown,
    Target,
    MapPin,
    Calendar,
    RefreshCw,
    Download
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CallAnalytics {
    totalCalls: number;
    inboundCalls: number;
    outboundCalls: number;
    missedCalls: number;
    averageDuration: number;
    totalDuration: number;
    conversionRate: number;
    campaigns: Array<{
        name: string;
        calls: number;
        conversions: number;
        revenue: number;
    }>;
    hourlyDistribution: Array<{
        hour: number;
        calls: number;
    }>;
    dailyTrend: Array<{
        date: string;
        inbound: number;
        outbound: number;
    }>;
    sourceBreakdown: Array<{
        source: string;
        calls: number;
        percentage: number;
    }>;
    geographicData: Array<{
        location: string;
        calls: number;
    }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function CallAnalyticsDashboard() {
    const [analytics, setAnalytics] = useState<CallAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('7d');
    const [selectedCampaign, setSelectedCampaign] = useState('all');

    useEffect(() => {
        loadAnalytics();
    }, [dateRange, selectedCampaign]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/analytics/calls?range=${dateRange}&campaign=${selectedCampaign}`);
            setAnalytics(response.data as CallAnalytics);
        } catch (error) {
            console.error('Failed to load analytics:', error);
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const exportData = () => {
        if (!analytics) return;

        const headers = ['Date', 'Inbound', 'Outbound'];
        const rows = analytics.dailyTrend.map(day => [day.date, day.inbound.toString(), day.outbound.toString()]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `call-analytics-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Analytics data exported successfully');
    };

    if (loading || !analytics) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const answerRate = analytics.totalCalls > 0
        ? ((analytics.totalCalls - analytics.missedCalls) / analytics.totalCalls * 100).toFixed(1)
        : '0';

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">Call Analytics</h1>
                    <p className="text-muted-foreground">Track performance and optimize your campaigns</p>
                </div>
                <div className="flex gap-2">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="24h">Last 24 Hours</SelectItem>
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="30d">Last 30 Days</SelectItem>
                            <SelectItem value="90d">Last 90 Days</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={loadAnalytics}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button variant="outline" onClick={exportData}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.totalCalls}</div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.inboundCalls} inbound, {analytics.outboundCalls} outbound
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Answer Rate</CardTitle>
                        <PhoneIncoming className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{answerRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.missedCalls} missed calls
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Math.floor(analytics.averageDuration / 60)}:{(analytics.averageDuration % 60).toString().padStart(2, '0')}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {Math.floor(analytics.totalDuration / 3600)}h total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
                        <p className="text-xs text-green-600 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +2.5% from last period
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="trends" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="trends">Call Trends</TabsTrigger>
                    <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                    <TabsTrigger value="sources">Sources</TabsTrigger>
                    <TabsTrigger value="geography">Geography</TabsTrigger>
                </TabsList>

                <TabsContent value="trends" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Call Volume</CardTitle>
                            <CardDescription>Inbound vs Outbound calls over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analytics.dailyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="inbound" stroke="#3b82f6" strokeWidth={2} />
                                    <Line type="monotone" dataKey="outbound" stroke="#10b981" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Hourly Distribution</CardTitle>
                            <CardDescription>Call volume by hour of day</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analytics.hourlyDistribution}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="hour" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="calls" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="campaigns" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign Performance</CardTitle>
                            <CardDescription>Calls and conversions by campaign</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {analytics.campaigns.map((campaign, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex-1">
                                            <h4 className="font-semibold">{campaign.name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {campaign.calls} calls • {campaign.conversions} conversions
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold">${campaign.revenue}</p>
                                            <p className="text-sm text-muted-foreground">Revenue</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sources" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Call Sources</CardTitle>
                            <CardDescription>Where your calls are coming from</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={analytics.sourceBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry) => `${entry.source}: ${entry.percentage}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="calls"
                                        >
                                            {analytics.sourceBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>

                                <div className="space-y-2">
                                    {analytics.sourceBreakdown.map((source, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                />
                                                <span className="font-medium">{source.source}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">{source.calls}</p>
                                                <p className="text-xs text-muted-foreground">{source.percentage}%</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="geography" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Geographic Distribution</CardTitle>
                            <CardDescription>Calls by location</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {analytics.geographicData.map((location, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{location.location}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-32 bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-primary h-2 rounded-full"
                                                    style={{
                                                        width: `${(location.calls / analytics.totalCalls) * 100}%`
                                                    }}
                                                />
                                            </div>
                                            <span className="font-semibold w-12 text-right">{location.calls}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
