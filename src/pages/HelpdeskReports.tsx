import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import ticketsApi from '@/services/ticketsApi';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Clock,
    Users,
    Target,
    Download,
    Calendar as CalendarIcon,
    Filter,
    Star,
    CheckCircle2,
    AlertCircle,
    MessageSquare,
    Timer,
    Award
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
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
    Area,
    AreaChart
} from 'recharts';

interface DateRange {
    from: Date;
    to: Date;
}

const HelpdeskReports: React.FC = () => {
    const [dateRange, setDateRange] = useState<DateRange>({
        from: subDays(new Date(), 30),
        to: new Date()
    });
    const [selectedTeam, setSelectedTeam] = useState<string>('all');
    const [selectedAgent, setSelectedAgent] = useState<string>('all');
    const [timeGranularity, setTimeGranularity] = useState<'day' | 'week' | 'month'>('day');

    // Fetch reporting data
    const { data: reportData, isLoading } = useQuery({
        queryKey: ['helpdesk-reports', dateRange, selectedTeam, selectedAgent, timeGranularity],
        queryFn: async () => {
            // This will call the backend reporting API
            // For now, returning mock data structure
            return {
                overview: {
                    totalTickets: 1247,
                    avgResolutionTime: 4.2,
                    csatScore: 4.6,
                    slaCompliance: 94.5,
                    openTickets: 156,
                    resolvedTickets: 1091,
                    firstResponseTime: 2.1
                },
                trends: {
                    ticketsChange: 12.5,
                    resolutionTimeChange: -8.3,
                    csatChange: 5.2,
                    slaChange: 2.1
                },
                volumeData: [
                    { date: '2024-01-01', tickets: 42, resolved: 38, open: 4 },
                    { date: '2024-01-02', tickets: 38, resolved: 35, open: 3 },
                    { date: '2024-01-03', tickets: 45, resolved: 40, open: 5 },
                    { date: '2024-01-04', tickets: 52, resolved: 48, open: 4 },
                    { date: '2024-01-05', tickets: 48, resolved: 45, open: 3 },
                    { date: '2024-01-06', tickets: 35, resolved: 32, open: 3 },
                    { date: '2024-01-07', tickets: 28, resolved: 26, open: 2 }
                ],
                resolutionTimeData: [
                    { date: '2024-01-01', avgTime: 4.5 },
                    { date: '2024-01-02', avgTime: 4.2 },
                    { date: '2024-01-03', avgTime: 4.8 },
                    { date: '2024-01-04', avgTime: 3.9 },
                    { date: '2024-01-05', avgTime: 4.1 },
                    { date: '2024-01-06', avgTime: 3.8 },
                    { date: '2024-01-07', avgTime: 4.0 }
                ],
                csatData: [
                    { date: '2024-01-01', score: 4.5 },
                    { date: '2024-01-02', score: 4.6 },
                    { date: '2024-01-03', score: 4.4 },
                    { date: '2024-01-04', score: 4.7 },
                    { date: '2024-01-05', score: 4.6 },
                    { date: '2024-01-06', score: 4.8 },
                    { date: '2024-01-07', score: 4.6 }
                ],
                agentPerformance: [
                    { name: 'John Doe', tickets: 145, avgTime: 3.8, csat: 4.7, sla: 96 },
                    { name: 'Jane Smith', tickets: 132, avgTime: 4.1, csat: 4.6, sla: 95 },
                    { name: 'Mike Johnson', tickets: 128, avgTime: 4.5, csat: 4.5, sla: 93 },
                    { name: 'Sarah Williams', tickets: 118, avgTime: 3.9, csat: 4.8, sla: 97 },
                    { name: 'Tom Brown', tickets: 105, avgTime: 4.2, csat: 4.4, sla: 92 }
                ],
                categoryDistribution: [
                    { name: 'Technical', value: 425, color: '#3b82f6' },
                    { name: 'Billing', value: 312, color: '#10b981' },
                    { name: 'Sales', value: 245, color: '#f59e0b' },
                    { name: 'General', value: 265, color: '#8b5cf6' }
                ],
                priorityDistribution: [
                    { name: 'Critical', value: 45, color: '#ef4444' },
                    { name: 'High', value: 178, color: '#f97316' },
                    { name: 'Medium', value: 524, color: '#eab308' },
                    { name: 'Low', value: 500, color: '#22c55e' }
                ]
            };
        }
    });

    const handleExport = (format: 'csv' | 'pdf') => {
        // TODO: Implement export functionality
        console.log(`Exporting as ${format}`);
    };

    const setQuickDateRange = (range: 'today' | 'week' | 'month' | '30days' | '90days') => {
        const now = new Date();
        switch (range) {
            case 'today':
                setDateRange({ from: now, to: now });
                break;
            case 'week':
                setDateRange({ from: startOfWeek(now), to: endOfWeek(now) });
                break;
            case 'month':
                setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
                break;
            case '30days':
                setDateRange({ from: subDays(now, 30), to: now });
                break;
            case '90days':
                setDateRange({ from: subDays(now, 90), to: now });
                break;
        }
    };

    const MetricCard = ({
        title,
        value,
        change,
        icon: Icon,
        suffix = '',
        trend
    }: {
        title: string;
        value: number | string;
        change?: number;
        icon: any;
        suffix?: string;
        trend?: 'up' | 'down';
    }) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}{suffix}</div>
                {change !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        {trend === 'up' ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                            {Math.abs(change)}%
                        </span>
                        <span>vs last period</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    if (isLoading) {
        return <div className="flex items-center justify-center h-96">Loading reports...</div>;
    }

    return (
        <>
            <Breadcrumb
                items={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Helpdesk', href: '/helpdesk' },
                    { label: 'Reports' }
                ]}
            />

            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[18px] font-bold tracking-tight text-foreground">Helpdesk Analytics</h1>
                        <p className="text-muted-foreground mt-1">
                            Comprehensive insights into your support operations
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleExport('csv')}>
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('pdf')}>
                            <Download className="w-4 h-4 mr-2" />
                            Export PDF
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Quick Date Ranges */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Quick Range</label>
                                <div className="flex flex-wrap gap-2">
                                    <Button size="sm" variant="outline" onClick={() => setQuickDateRange('today')}>Today</Button>
                                    <Button size="sm" variant="outline" onClick={() => setQuickDateRange('week')}>This Week</Button>
                                    <Button size="sm" variant="outline" onClick={() => setQuickDateRange('month')}>This Month</Button>
                                    <Button size="sm" variant="outline" onClick={() => setQuickDateRange('30days')}>Last 30 Days</Button>
                                </div>
                            </div>

                            {/* Team Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Team</label>
                                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select team" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Teams</SelectItem>
                                        <SelectItem value="technical">Technical Support</SelectItem>
                                        <SelectItem value="billing">Billing</SelectItem>
                                        <SelectItem value="sales">Sales</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Agent Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Agent</label>
                                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select agent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Agents</SelectItem>
                                        <SelectItem value="1">John Doe</SelectItem>
                                        <SelectItem value="2">Jane Smith</SelectItem>
                                        <SelectItem value="3">Mike Johnson</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Granularity */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Granularity</label>
                                <Select value={timeGranularity} onValueChange={(v: any) => setTimeGranularity(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="day">Daily</SelectItem>
                                        <SelectItem value="week">Weekly</SelectItem>
                                        <SelectItem value="month">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Total Tickets"
                        value={reportData?.overview.totalTickets || 0}
                        change={reportData?.trends.ticketsChange}
                        icon={MessageSquare}
                        trend="up"
                    />
                    <MetricCard
                        title="Avg Resolution Time"
                        value={reportData?.overview.avgResolutionTime || 0}
                        change={reportData?.trends.resolutionTimeChange}
                        icon={Clock}
                        suffix="h"
                        trend="down"
                    />
                    <MetricCard
                        title="CSAT Score"
                        value={reportData?.overview.csatScore || 0}
                        change={reportData?.trends.csatChange}
                        icon={Star}
                        suffix="/5"
                        trend="up"
                    />
                    <MetricCard
                        title="SLA Compliance"
                        value={reportData?.overview.slaCompliance || 0}
                        change={reportData?.trends.slaChange}
                        icon={Target}
                        suffix="%"
                        trend="up"
                    />
                </div>

                {/* Charts */}
                <Tabs defaultValue="volume" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="volume">Ticket Volume</TabsTrigger>
                        <TabsTrigger value="resolution">Resolution Time</TabsTrigger>
                        <TabsTrigger value="csat">CSAT Trends</TabsTrigger>
                        <TabsTrigger value="distribution">Distribution</TabsTrigger>
                    </TabsList>

                    <TabsContent value="volume" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Ticket Volume Over Time</CardTitle>
                                <CardDescription>Daily ticket creation and resolution trends</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <AreaChart data={reportData?.volumeData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Area type="monotone" dataKey="tickets" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Created" />
                                        <Area type="monotone" dataKey="resolved" stackId="2" stroke="#10b981" fill="#10b981" name="Resolved" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="resolution" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Average Resolution Time</CardTitle>
                                <CardDescription>Time taken to resolve tickets (in hours)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <LineChart data={reportData?.resolutionTimeData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="avgTime" stroke="#f59e0b" strokeWidth={2} name="Avg Time (hours)" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="csat" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Customer Satisfaction Score</CardTitle>
                                <CardDescription>CSAT trends over time (out of 5)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <LineChart data={reportData?.csatData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis domain={[0, 5]} />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} name="CSAT Score" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="distribution" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tickets by Category</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={reportData?.categoryDistribution}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(entry) => entry.name}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {reportData?.categoryDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Tickets by Priority</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={reportData?.priorityDistribution}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(entry) => entry.name}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {reportData?.priorityDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Agent Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="w-5 h-5" />
                            Agent Performance
                        </CardTitle>
                        <CardDescription>Individual agent metrics and rankings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {reportData?.agentPerformance.map((agent, index) => (
                                <div key={agent.name} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{agent.name}</p>
                                            <p className="text-sm text-muted-foreground">{agent.tickets} tickets resolved</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6">
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground">Avg Time</p>
                                            <p className="font-semibold">{agent.avgTime}h</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground">CSAT</p>
                                            <p className="font-semibold">{agent.csat}/5</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground">SLA</p>
                                            <Badge variant={agent.sla >= 95 ? "default" : "secondary"}>
                                                {agent.sla}%
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default HelpdeskReports;
