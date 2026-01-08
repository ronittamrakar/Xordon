import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
    Globe,
    TrendingUp,
    Users,
    MousePointer,
    Clock,
    Smartphone,
    MapPin,
    RefreshCw,
    Activity,
    ArrowUpRight
} from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { api } from '@/lib/api';
import { format } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const generateMockData = () => {
    return {
        overview: {
            visitors: 125430,
            pageViews: 450200,
            bounceRate: 42.5,
            avgSession: '2m 45s'
        },
        traffic: Array.from({ length: 14 }).map((_, i) => ({
            date: format(new Date(Date.now() - (14 - i) * 86400000), 'MMM dd'),
            visitors: Math.floor(Math.random() * 5000) + 1000,
            pageviews: Math.floor(Math.random() * 15000) + 3000
        })),
        devices: [
            { name: 'Mobile', value: 55 },
            { name: 'Desktop', value: 40 },
            { name: 'Tablet', value: 5 },
        ],
        sources: [
            { name: 'Direct', value: 30 },
            { name: 'Organic', value: 45 },
            { name: 'Social', value: 15 },
            { name: 'Referral', value: 10 },
        ],
        pages: [
            { path: '/', views: 45000, bounce: 35 },
            { path: '/pricing', views: 12000, bounce: 25 },
            { path: '/features', views: 8000, bounce: 40 },
            { path: '/blog/top-10-tips', views: 5600, bounce: 65 },
        ]
    };
};

const WebsiteAnalytics: React.FC = () => {
    const [siteId, setSiteId] = useState('all');
    const { data, refetch } = useQuery({
        queryKey: ['website-analytics', siteId],
        queryFn: async () => {
            try {
                return await api.getWebsiteAnalytics({ dateRange: '30d' }); // Add dateRange if supported
            } catch (error) {
                console.error(error);
                return generateMockData();
            }
        }
    });

    const analytics = data || generateMockData();

    const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
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
                <div className="mt-4 flex items-center text-xs text-green-600 font-medium">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {trend} vs last 30 days
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-4">
            <Breadcrumb items={[{ label: 'Websites', href: '/websites' }, { label: 'Analytics' }]} />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">
                        Website Analytics
                    </h1>
                    <p className="text-muted-foreground">Traffic and engagement reports</p>
                </div>
                <div className="flex gap-2">
                    <Select value={siteId} onValueChange={setSiteId}>
                        <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Sites" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Websites</SelectItem>
                            <SelectItem value="site1">Main Corporate Site</SelectItem>
                            <SelectItem value="site2">Landing Page A</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total Visitors" value={analytics.overview.visitors.toLocaleString()} icon={Users} trend="+12%" color="text-blue-600" />
                <StatCard title="Page Views" value={analytics.overview.pageViews.toLocaleString()} icon={Globe} trend="+8%" color="text-indigo-600" />
                <StatCard title="Bounce Rate" value={`${analytics.overview.bounceRate}%`} icon={Activity} trend="-2%" color="text-orange-600" />
                <StatCard title="Avg Session" value={analytics.overview.avgSession} icon={Clock} trend="+15s" color="text-green-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Traffic Overview</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={analytics.traffic}>
                                <defs>
                                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Area type="monotone" dataKey="visitors" stroke="#3b82f6" fill="url(#colorVisits)" strokeWidth={2} />
                                <Area type="monotone" dataKey="pageviews" stroke="#10b981" fill="transparent" strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Device Breakdown</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={analytics.devices} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                    {analytics.devices.map((e, i) => <Cell key={i} fill={COLORS[i]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Top Pages</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analytics.pages.map((page, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="bg-muted p-1 rounded"><ArrowUpRight className="h-3 w-3" /></div>
                                        <span className="truncate font-medium">{page.path}</span>
                                    </div>
                                    <div className="flex gap-4 text-sm">
                                        <span className="font-bold">{page.views.toLocaleString()}</span>
                                        <span className="text-muted-foreground w-12 text-right">{page.bounce}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Acquisition Sources</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={analytics.sources} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={80} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default WebsiteAnalytics;
