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
    MessageSquare,
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
    MessageCircle,
    Phone,
    Activity,
    BarChart3,
    DollarSign
} from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AnalyticsFilters {
    dateRange: '24h' | '7d' | '30d' | '90d' | '1y' | 'custom';
    campaignId?: string;
    groupBy: 'day' | 'week' | 'month';
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Mock data generator for SMS
const generateMockData = (filters: AnalyticsFilters) => {
    const days = filters.dateRange === '7d' ? 7 : filters.dateRange === '30d' ? 30 : 14;
    const generateTrend = () => Array.from({ length: days }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        return {
            date: date.toISOString(),
            sent: Math.floor(Math.random() * 500) + 100,
            delivered: Math.floor(Math.random() * 480) + 90,
            failed: Math.floor(Math.random() * 20) + 5,
            replied: Math.floor(Math.random() * 80) + 20,
        };
    });

    return {
        overview: {
            totalSent: 5430,
            deliveryRate: 98.2,
            replyRate: 15.8,
            optOutRate: 0.4,
            cost: 452.50,
            totalCredits: 10860
        },
        trends: generateTrend(),
        hourlyDistribution: Array.from({ length: 24 }).map((_, i) => ({
            hour: `${String(i).padStart(2, '0')}:00`,
            replies: Math.floor(Math.random() * 50),
            sent: Math.floor(Math.random() * 200)
        })),
        campaignPerformance: [
            { id: 1, name: 'Flash Sale Alert', sent: 2000, delivered: 1980, replyRate: 12, conversions: 150, cost: 160 },
            { id: 2, name: 'Appointment Reminder', sent: 500, delivered: 495, replyRate: 45, conversions: 400, cost: 40 },
            { id: 3, name: 'Review Request', sent: 800, delivered: 790, replyRate: 8, conversions: 60, cost: 64 },
        ],
        failureReasons: [
            { name: 'Invalid Number', value: 45 },
            { name: 'Carrier Block', value: 30 },
            { name: 'Unreachable', value: 15 },
            { name: 'Other', value: 10 },
        ]
    };
};

const SMSAnalytics: React.FC = () => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState<AnalyticsFilters>({
        dateRange: '30d',
        groupBy: 'day'
    });

    // Fetch Analytics
    const { data: analyticsData, refetch: refetchSummary, isLoading } = useQuery({
        queryKey: ['sms-analytics', filters],
        queryFn: async () => {
            try {
                // Use real API endpoint
                const response = filters.campaignId
                    ? await api.getSMSCampaignAnalytics(filters.campaignId)
                    : await api.getSMSAnalytics();

                // Transform API response to match our data structure
                const stats = response.stats || response;
                return {
                    overview: {
                        totalSent: stats.total_sent || 0,
                        delivered: stats.total_delivered || 0,
                        deliveryRate: stats.delivery_rate || stats.avg_delivery_rate || 0,
                        replyRate: stats.reply_rate || 0,
                        failureRate: stats.failure_rate || 0,
                        optOutRate: stats.unsubscribe_rate || 0.4,
                        cost: (stats.total_sent || 0) * 0.05,
                        totalCredits: (stats.total_sent || 0) * 2
                    },
                    trends: response.daily_volume || [],
                    hourlyDistribution: Array.from({ length: 24 }).map((_, i) => ({
                        hour: `${String(i).padStart(2, '0')}:00`,
                        replies: Math.floor(Math.random() * 50), // TODO: Get real hourly data
                        sent: Math.floor(Math.random() * 200)
                    })),
                    campaignPerformance: [], // TODO: Get campaign-specific performance
                    failureReasons: [
                        { name: 'Invalid Number', value: 45 },
                        { name: 'Carrier Block', value: 30 },
                        { name: 'Unreachable', value: 15 },
                        { name: 'Other', value: 10 },
                    ],
                    carrierBreakdown: [
                        { name: 'AT&T', value: 35 },
                        { name: 'Verizon', value: 30 },
                        { name: 'T-Mobile', value: 25 },
                        { name: 'Other', value: 10 },
                    ],
                    messageTypes: [
                        { name: 'Promotional', value: 60 },
                        { name: 'Transactional', value: 30 },
                        { name: 'Alerts', value: 10 },
                    ]
                };
            } catch (error) {
                console.error('Failed to fetch SMS analytics:', error);
                toast.error('Failed to load analytics data');
                // Fallback to mock data on error
                return generateMockData(filters);
            }
        }
    });

    const { data: campaignsData } = useQuery<any[]>({
        queryKey: ['sms-campaigns-list'],
        queryFn: async () => {
            // Placeholder for campaigns list
            return [
                { id: '1', name: 'Flash Sale Alert' },
                { id: '2', name: 'Appointment Reminder' },
                { id: '3', name: 'Review Request' }
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
        a.download = `sms-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
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
                    { label: 'Reach', href: '/reach/outbound/sms/campaigns', icon: <MessageSquare className="h-4 w-4" /> },
                    { label: 'SMS', href: '/reach/outbound/sms/campaigns' },
                    { label: 'Analytics' }
                ]}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight text-foreground">
                        SMS Analytics
                    </h1>
                    <p className="text-muted-foreground mt-1">Message delivery, costs, and response metrics</p>
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
                    subtext={`${data.overview.deliveryRate}% Delivery Rate`}
                    icon={MessageSquare}
                    trend="up"
                    trendValue="8.2%"
                />
                <StatCard
                    title="Reply Rate"
                    value={`${data.overview.replyRate}%`}
                    subtext="Response engagement"
                    icon={MessageCircle}
                    trend="up"
                    trendValue="4.1%"
                    colorClass="text-green-600"
                />
                <StatCard
                    title="Opt-Out Rate"
                    value={`${data.overview.optOutRate}%`}
                    subtext="Unsubscribes"
                    icon={XCircle}
                    trend="down"
                    trendValue="0.1%"
                    colorClass="text-orange-600"
                />
                <StatCard
                    title="Total Cost"
                    value={`$${data.overview.cost.toFixed(2)}`}
                    subtext={`${data.overview.totalCredits.toLocaleString()} Credits used`}
                    icon={DollarSign}
                    trend="up"
                    trendValue="5.5%"
                    colorClass="text-blue-600"
                />
            </div>

            <Tabs defaultValue="trends" className="space-y-4">
                <TabsList className="bg-muted/50 p-1 rounded-xl">
                    <TabsTrigger value="trends" className="rounded-lg px-6">
                        <TrendingUp className="h-4 w-4 mr-2" /> Activity
                    </TabsTrigger>
                    <TabsTrigger value="campaigns" className="rounded-lg px-6">
                        <Target className="h-4 w-4 mr-2" /> Campaigns
                    </TabsTrigger>
                    <TabsTrigger value="delivery" className="rounded-lg px-6">
                        <CheckCircle className="h-4 w-4 mr-2" /> Delivery
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="trends" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Volume Trend */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Message Volume</CardTitle>
                                <CardDescription>Daily SMS activity</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={data.trends}>
                                        <defs>
                                            <linearGradient id="colorSmsSent" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorSmsReplies" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM dd')} />
                                        <YAxis />
                                        <Tooltip
                                            labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend />
                                        <Area type="monotone" dataKey="sent" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSmsSent)" name="Sent" strokeWidth={2} />
                                        <Area type="monotone" dataKey="replied" stroke="#10b981" fillOpacity={1} fill="url(#colorSmsReplies)" name="Replies" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Hourly Distribution */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Activity by Hour</CardTitle>
                                <CardDescription>When messages are sent and replied to</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={data.hourlyDistribution}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="hour" />
                                        <YAxis />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="sent" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Sent" />
                                        <Bar dataKey="replies" fill="#10b981" radius={[4, 4, 0, 0]} name="Replies" />
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
                            <CardDescription>SMS Campaign Effectiveness</CardDescription>
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
                                                <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {campaign.sent} sent</span>
                                                <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {campaign.delivered} delivered</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-10 ml-11 sm:ml-0">
                                            <div className="text-right">
                                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Reply Rate</span>
                                                <span className="text-lg font-extrabold text-green-600">
                                                    {campaign.replyRate}%
                                                </span>
                                            </div>
                                            <div className="text-right min-w-[100px]">
                                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Cost</span>
                                                <span className="text-xl font-black text-foreground">
                                                    ${campaign.cost}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="delivery" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Delivery Failure Reasons</CardTitle>
                                <CardDescription>Why messages failed to deliver</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={data.failureReasons}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {data.failureReasons.map((entry, index) => (
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
                                <CardTitle>Carrier Breakdown</CardTitle>
                                <CardDescription>Delivery by top carriers</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {['AT&T', 'Verizon', 'T-Mobile', 'Sprint', 'Other'].map((carrier, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 border-b last:border-0">
                                            <span className="font-medium">{carrier}</span>
                                            <span className="text-green-600 font-bold">98.{Math.floor(Math.random() * 9)}% Delivered</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    );
};

export default SMSAnalytics;
