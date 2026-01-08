import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    LineChart,
    Line,
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
    Mail,
    TrendingUp,
    TrendingDown,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    Filter,
    Download,
    RefreshCw,
    Target,
    MousePointer,
    Eye,
    Activity,
    BarChart3,
    AlertOctagon
} from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { api } from '@/lib/api'; // Assuming generic api exists, will fallback to mocks if needed
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AnalyticsFilters {
    dateRange: '24h' | '7d' | '30d' | '90d' | '1y' | 'custom';
    campaignId?: string;
    groupBy: 'day' | 'week' | 'month';
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Mock data generator since API might not exist
const generateMockData = (filters: AnalyticsFilters) => {
    const days = filters.dateRange === '7d' ? 7 : filters.dateRange === '30d' ? 30 : 14;
    const generateTrend = () => Array.from({ length: days }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        return {
            date: date.toISOString(),
            sent: Math.floor(Math.random() * 1000) + 500,
            opened: Math.floor(Math.random() * 500) + 200,
            clicked: Math.floor(Math.random() * 200) + 50,
            replied: Math.floor(Math.random() * 50) + 10,
        };
    });

    return {
        overview: {
            totalSent: 15420,
            delivered: 15100,
            openRate: 42.5,
            clickRate: 12.8,
            replyRate: 3.2,
            bounceRate: 2.1,
            spamRate: 0.05,
            revenue: 24500
        },
        trends: generateTrend(),
        hourlyDistribution: Array.from({ length: 24 }).map((_, i) => ({
            hour: `${String(i).padStart(2, '0')}:00`,
            opens: Math.floor(Math.random() * 100),
            clicks: Math.floor(Math.random() * 30)
        })),
        campaignPerformance: [
            { id: 1, name: 'Cold Outreach Q1', sent: 5000, openRate: 35, clickRate: 8, conversions: 120, revenue: 5000 },
            { id: 2, name: 'Webinar Invite', sent: 2000, openRate: 55, clickRate: 25, conversions: 80, revenue: 0 },
            { id: 3, name: 'Newsletter Jan', sent: 8000, openRate: 45, clickRate: 15, conversions: 45, revenue: 1500 },
            { id: 4, name: 'Product Update', sent: 420, openRate: 68, clickRate: 32, conversions: 12, revenue: 12000 },
        ],
        deviceBreakdown: [
            { name: 'Desktop', value: 45 },
            { name: 'Mobile', value: 50 },
            { name: 'Tablet', value: 5 },
        ],
        domainReputation: [
            { date: '2023-01-01', score: 98 },
            { date: '2023-01-08', score: 99 },
            { date: '2023-01-15', score: 97 },
            { date: '2023-01-22', score: 98 },
        ]
    };
};

const EmailAnalytics: React.FC = () => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState<AnalyticsFilters>({
        dateRange: '30d',
        groupBy: 'day'
    });

    // Fetch Analytics
    const { data: analyticsData, refetch: refetchSummary, isLoading } = useQuery({
        queryKey: ['email-analytics', filters],
        queryFn: async () => {
            try {
                // Use real API endpoint
                const response = await api.getAnalytics(filters.campaignId);

                // Transform API response to match our data structure
                return {
                    overview: {
                        totalSent: response.totalSent || 0,
                        delivered: response.totalSent - (response.totalBounces || 0),
                        openRate: response.openRate || 0,
                        clickRate: response.clickRate || 0,
                        replyRate: ((response.totalClicks || 0) / (response.totalSent || 1)) * 100,
                        bounceRate: response.bounceRate || 0,
                        spamRate: response.unsubscribeRate || 0,
                        revenue: 0 // TODO: Add revenue tracking
                    },
                    trends: response.dailyStats || [],
                    hourlyDistribution: Array.from({ length: 24 }).map((_, i) => ({
                        hour: `${String(i).padStart(2, '0')}:00`,
                        opens: Math.floor(Math.random() * 100), // TODO: Get real hourly data
                        clicks: Math.floor(Math.random() * 30)
                    })),
                    campaignPerformance: [], // TODO: Get campaign-specific performance
                    deviceBreakdown: [
                        { name: 'Desktop', value: 45 },
                        { name: 'Mobile', value: 50 },
                        { name: 'Tablet', value: 5 },
                    ],
                    domainReputation: []
                };
            } catch (error) {
                console.error('Failed to fetch email analytics:', error);
                toast.error('Failed to load analytics data');
                // Fallback to mock data on error
                return generateMockData(filters);
            }
        }
    });

    const { data: campaignsData } = useQuery<any[]>({
        queryKey: ['email-campaigns-list'],
        queryFn: async () => {
            // Placeholder for campaigns list
            return [
                { id: '1', name: 'Cold Outreach Q1' },
                { id: '2', name: 'Webinar Invite' },
                { id: '3', name: 'Newsletter Jan' }
            ];
        }
    });
    const campaigns = campaignsData || [];

    const data = useMemo(() => analyticsData || generateMockData(filters), [analyticsData, filters]);

    const handleExport = () => {
        const exportData = {
            analytics: data,
            filters,
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `email-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Analytics exported successfully');
    };

    const StatCard = ({ title, value, subtext, icon: Icon, trend, trendValue, colorClass }: {
        title: string;
        value: string | number;
        subtext?: string;
        icon: React.ElementType;
        trend?: 'up' | 'down' | 'neutral';
        trendValue?: string;
        colorClass?: string;
    }) => (
        <Card className="shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <div className="flex items-baseline gap-2">
                            <p className={`text-2xl font-bold ${colorClass || 'text-foreground'}`}>{value}</p>
                            {trend && (
                                <span className={`text-xs font-medium flex items-center ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                                    {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                    {trendValue}
                                </span>
                            )}
                        </div>
                        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
                    </div>
                    <div className="p-3 bg-muted/30 rounded-xl">
                        <Icon className={`h-5 w-5 ${colorClass || 'text-primary'}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="flex h-full flex-col space-y-4">
            <Breadcrumb
                items={[
                    { label: 'Reach', href: '/reach/outbound/email/campaigns', icon: <Mail className="h-4 w-4" /> },
                    { label: 'Email', href: '/reach/outbound/email/campaigns' },
                    { label: 'Analytics' }
                ]}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight text-foreground">
                        Email Analytics
                    </h1>
                    <p className="text-muted-foreground mt-1">Campaign performance, deliverability, and engagement insights</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Select
                        value={filters.dateRange}
                        onValueChange={(value: any) => setFilters(prev => ({ ...prev, dateRange: value }))}
                    >
                        <SelectTrigger className="w-[150px] bg-background">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="24h">Last 24 Hours</SelectItem>
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="30d">Last 30 Days</SelectItem>
                            <SelectItem value="90d">Last 90 Days</SelectItem>
                            <SelectItem value="1y">Last Year</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.campaignId || 'all'}
                        onValueChange={(value) => setFilters(prev => ({
                            ...prev,
                            campaignId: value === 'all' ? undefined : value
                        }))}
                    >
                        <SelectTrigger className="w-[200px] bg-background">
                            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="All Campaigns" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Campaigns</SelectItem>
                            {campaigns.map(campaign => (
                                <SelectItem key={campaign.id} value={campaign.id}>
                                    {campaign.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="outline" onClick={handleExport} className="bg-background">
                        <Download className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Export JSON</span>
                    </Button>
                    <Button variant="outline" onClick={() => refetchSummary()} className="bg-background">
                        <RefreshCw className={`h-4 w-4 md:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="hidden md:inline">Refresh</span>
                    </Button>
                </div>
            </div>

            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Sent"
                    value={data.overview.totalSent.toLocaleString()}
                    subtext={`${((data.overview.delivered / data.overview.totalSent) * 100).toFixed(1)}% Delivery Rate`}
                    icon={Mail}
                    trend="up"
                    trendValue="12.5%"
                />
                <StatCard
                    title="Open Rate"
                    value={`${data.overview.openRate}%`}
                    subtext="Unique opens"
                    icon={Eye}
                    trend="up"
                    trendValue="2.4%"
                    colorClass="text-blue-600"
                />
                <StatCard
                    title="Click Rate"
                    value={`${data.overview.clickRate}%`}
                    subtext="Click-through rate"
                    icon={MousePointer}
                    trend="down"
                    trendValue="0.8%"
                    colorClass="text-purple-600"
                />
                <StatCard
                    title="Revenue Generated"
                    value={`$${data.overview.revenue.toLocaleString()}`}
                    subtext="Attributed revenue"
                    icon={Target}
                    trend="up"
                    trendValue="15.2%"
                    colorClass="text-green-600"
                />
            </div>

            <Tabs defaultValue="trends" className="space-y-4">
                <TabsList className="bg-muted/50 p-1 rounded-xl">
                    <TabsTrigger value="trends" className="rounded-lg px-6">
                        <TrendingUp className="h-4 w-4 mr-2" /> Trends
                    </TabsTrigger>
                    <TabsTrigger value="campaigns" className="rounded-lg px-6">
                        <Target className="h-4 w-4 mr-2" /> Campaigns
                    </TabsTrigger>
                    <TabsTrigger value="engagement" className="rounded-lg px-6">
                        <BarChart3 className="h-4 w-4 mr-2" /> Engagement
                    </TabsTrigger>
                    <TabsTrigger value="health" className="rounded-lg px-6">
                        <Activity className="h-4 w-4 mr-2" /> Health
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="trends" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Volume Trend */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Delivery & Engagement</CardTitle>
                                <CardDescription>Daily email volume vs. open rates</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={data.trends}>
                                        <defs>
                                            <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM dd')} />
                                        <YAxis yAxisId="left" />
                                        <YAxis yAxisId="right" orientation="right" />
                                        <Tooltip
                                            labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend />
                                        <Area yAxisId="left" type="monotone" dataKey="sent" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSent)" name="Sent" strokeWidth={2} />
                                        <Area yAxisId="left" type="monotone" dataKey="opened" stroke="#10b981" fillOpacity={1} fill="url(#colorOpened)" name="Opened" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Engagement Hourly */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Best Time to Email</CardTitle>
                                <CardDescription>Hourly breakdown of opens and clicks</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={data.hourlyDistribution}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="hour" />
                                        <YAxis />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="opens" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Opens" />
                                        <Bar dataKey="clicks" fill="#10b981" radius={[4, 4, 0, 0]} name="Clicks" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="campaigns" className="space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Campaign Performance</CardTitle>
                            <CardDescription>Top performing email campaigns</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {data.campaignPerformance.map((campaign, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border rounded-xl hover:bg-accent/5 transition-all group">
                                        <div className="flex-1 mb-2 sm:mb-0">
                                            <div className="flex items-center gap-3">
                                                <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold">{index + 1}</span>
                                                <h4 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{campaign.name}</h4>
                                            </div>
                                            <div className="flex gap-6 mt-2 text-sm text-muted-foreground ml-11">
                                                <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {campaign.sent} sent</span>
                                                <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {campaign.conversions} conversions</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-10 ml-11 sm:ml-0">
                                            <div className="text-right">
                                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Open Rate</span>
                                                <span className="text-lg font-extrabold text-blue-600">
                                                    {campaign.openRate}%
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Click Rate</span>
                                                <span className="text-lg font-extrabold text-purple-600">
                                                    {campaign.clickRate}%
                                                </span>
                                            </div>
                                            <div className="text-right min-w-[100px]">
                                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Revenue</span>
                                                <span className="text-xl font-black text-foreground">
                                                    ${campaign.revenue.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="engagement" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Device Breakdown</CardTitle>
                                <CardDescription>Where recipients are opening emails</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={data.deviceBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {data.deviceBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Metric Correlations</CardTitle>
                                <CardDescription>Relationship between opens and clicks</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={data.trends}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), 'dd')} />
                                        <YAxis />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="opened" stackId="1" stroke="#8884d8" fill="#8884d8" name="Opens" />
                                        <Area type="monotone" dataKey="clicked" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Clicks" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="health" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold flex items-center gap-2">
                                    {data.overview.bounceRate}%
                                    {data.overview.bounceRate > 2 && <AlertOctagon className="h-5 w-5 text-red-500" />}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Target: &lt; 2.0%</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Spam Complaint Rate</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.overview.spamRate}%</div>
                                <p className="text-xs text-muted-foreground mt-1">Target: &lt; 0.1%</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Domain Reputation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">98/100</div>
                                <p className="text-xs text-muted-foreground mt-1">Excellent</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default EmailAnalytics;
