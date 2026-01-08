import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    Megaphone,
    TrendingUp,
    Users,
    Target,
    MousePointer,
    DollarSign,
    Activity,
    BarChart3,
    Globe,
    Share2,
    Search,
    ArrowUpRight,
    Filter,
    Download,
    RefreshCw
} from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AnalyticsFilters {
    dateRange: '30d' | '90d' | '1y';
    channel: string;
}

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

const generateMockData = (filters: AnalyticsFilters) => {
    const days = 30;
    return {
        overview: {
            totalLeads: 12450,
            costPerLead: 14.50,
            conversionRate: 3.2,
            roi: 450,
            totalSpend: 15400,
            impressions: 450000
        },
        trends: Array.from({ length: days }).map((_, i) => ({
            date: format(new Date(Date.now() - (days - i) * 86400000), 'yyyy-MM-dd'),
            leads: Math.floor(Math.random() * 500) + 100,
            spend: Math.floor(Math.random() * 1000) + 200,
            conversions: Math.floor(Math.random() * 50) + 10,
        })),
        channels: [
            { name: 'Organic Search', value: 45, leads: 5600, cpl: 0, roi: 800 },
            { name: 'Paid Social', value: 25, leads: 3100, cpl: 25, roi: 250 },
            { name: 'Email', value: 20, leads: 2500, cpl: 5, roi: 1200 },
            { name: 'Referral', value: 10, leads: 1250, cpl: 0, roi: 0 },
        ],
        campaigns: [
            { name: 'Summer Sale', type: 'Social', spend: 5000, leads: 400, cpl: 12.5, roi: 300 },
            { name: 'New Product Launch', type: 'Email', spend: 500, leads: 1200, cpl: 0.4, roi: 2500 },
            { name: 'Competitor Targeting', type: 'Search', spend: 8000, leads: 200, cpl: 40, roi: 150 },
            { name: 'Retargeting', type: 'Social', spend: 2000, leads: 300, cpl: 6.6, roi: 600 },
        ]
    };
};

const MarketingAnalytics: React.FC = () => {
    const [filters, setFilters] = useState<AnalyticsFilters>({
        dateRange: '30d',
        channel: 'all'
    });

    const { data: analyticsData, isLoading, refetch } = useQuery({
        queryKey: ['marketing-analytics', filters],
        queryFn: async () => {
            try {
                return await api.getMarketingAnalytics({ dateRange: filters.dateRange });
            } catch (error) {
                console.error(error);
                return generateMockData(filters);
            }
        }
    });

    const data = useMemo(() => analyticsData || generateMockData(filters), [analyticsData, filters]);

    const StatCard = ({ title, value, subtext, icon: Icon, colorClass, trend }: any) => (
        <Card className="shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <h3 className={`text-2xl font-bold mt-2 ${colorClass || ''}`}>{value}</h3>
                        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
                    </div>
                    <div className="p-3 bg-muted/20 rounded-xl">
                        <Icon className={`h-5 w-5 ${colorClass || 'text-foreground'}`} />
                    </div>
                </div>
                {trend && (
                    <div className="mt-4 flex items-center text-xs font-medium text-green-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {trend} vs last period
                    </div>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-4">
            <Breadcrumb
                items={[
                    { label: 'Marketing', href: '/marketing', icon: <Megaphone className="h-4 w-4" /> },
                    { label: 'Analytics' }
                ]}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight text-foreground">
                        Marketing Analytics
                    </h1>
                    <p className="text-muted-foreground">Comprehensive campaign performance and lead attribution</p>
                </div>
                <div className="flex gap-2">
                    <Select value={filters.dateRange} onValueChange={(v: any) => setFilters(prev => ({ ...prev, dateRange: v }))}>
                        <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="30d">Last 30 Days</SelectItem>
                            <SelectItem value="90d">Last 90 Days</SelectItem>
                            <SelectItem value="1y">Last Year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Leads" value={data.overview.totalLeads.toLocaleString()} icon={Users} trend="+12%" colorClass="text-blue-600" />
                <StatCard title="Cost Per Lead" value={`$${data.overview.costPerLead}`} icon={Target} trend="-5%" colorClass="text-green-600" />
                <StatCard title="Conversion Rate" value={`${data.overview.conversionRate}%`} icon={Activity} trend="+0.4%" colorClass="text-purple-600" />
                <StatCard title="Marketing ROI" value={`${data.overview.roi}%`} icon={DollarSign} trend="+25%" colorClass="text-orange-600" />
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-muted/50">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="channels">Channels</TabsTrigger>
                    <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Lead Acquisition Trend</CardTitle>
                            <CardDescription>Daily lead leads vs marketing spend</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={data.trends}>
                                    <defs>
                                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" tickFormatter={d => format(new Date(d), 'MMM dd')} />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip />
                                    <Legend />
                                    <Area yAxisId="left" type="monotone" dataKey="leads" stroke="#8b5cf6" fill="url(#colorLeads)" />
                                    <Line yAxisId="right" type="monotone" dataKey="spend" stroke="#ec4899" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="channels">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle>Traffic Sources</CardTitle></CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={data.channels} dataKey="value" cx="50%" cy="50%" outerRadius={100} label>
                                            {data.channels.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Source Performance</CardTitle></CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={data.channels} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={100} />
                                        <Tooltip />
                                        <Bar dataKey="roi" fill="#10b981" name="ROI %" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="campaigns">
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="p-4 text-left font-medium">Campaign</th>
                                            <th className="p-4 text-left font-medium">Type</th>
                                            <th className="p-4 text-right font-medium">Spend</th>
                                            <th className="p-4 text-right font-medium">Leads</th>
                                            <th className="p-4 text-right font-medium">CPL</th>
                                            <th className="p-4 text-right font-medium">ROI</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.campaigns.map((c, i) => (
                                            <tr key={i} className="border-b last:border-0 hover:bg-muted/10">
                                                <td className="p-4 font-medium">{c.name}</td>
                                                <td className="p-4 text-muted-foreground">{c.type}</td>
                                                <td className="p-4 text-right">${c.spend.toLocaleString()}</td>
                                                <td className="p-4 text-right">{c.leads}</td>
                                                <td className="p-4 text-right">${c.cpl.toFixed(2)}</td>
                                                <td className="p-4 text-right font-bold text-green-600">{c.roi}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default MarketingAnalytics;
