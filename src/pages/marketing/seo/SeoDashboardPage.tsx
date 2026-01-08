import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useActiveCompany, companyQueryKey } from '@/hooks/useActiveCompany';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    LayoutDashboard,
    TrendingUp,
    Search,
    Link2,
    Globe,
    Zap,
    ShieldAlert,
    FileText,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Download
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie
} from 'recharts';

export default function SeoDashboardPage() {
    const { activeCompanyId, hasCompany } = useActiveCompany();

    const { data: dashboardData, isLoading, refetch } = useQuery({
        queryKey: companyQueryKey('seo-dashboard', activeCompanyId),
        queryFn: async () => {
            const res = await api.get('/seo/dashboard');
            return res.data?.data || res.data || {};
        },
        enabled: hasCompany
    });

    if (isLoading) {
        return (
            <div className="container mx-auto py-6 space-y-6">
                <div className="flex items-center justify-center h-[60vh]">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    const stats = dashboardData?.stats || {
        visibility: 0,
        keywords_top3: 0,
        keywords_top10: 0,
        backlinks: 0,
        health_score: 0,
        visibility_change: 0,
        keywords_change: 0,
        backlinks_change: 0,
        health_change: 0
    };

    const visibilityChart = dashboardData?.visibility_trend || [];
    const keywordDistribution = dashboardData?.keyword_distribution || [];
    const backlinkGrowth = dashboardData?.backlink_growth || [];
    const topIssues = dashboardData?.top_issues || [];

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className="container mx-auto py-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">SEO Dashboard</h1>
                    <p className="text-muted-foreground">Comprehensive search performance overview for your domain.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh Data
                    </Button>
                    <Button size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export PDF
                    </Button>
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Organic Visibility</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-bold">{stats.visibility}%</div>
                            <div className={`flex items-center text-xs font-semibold ${stats.visibility_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {stats.visibility_change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                {Math.abs(stats.visibility_change)}%
                            </div>
                        </div>
                        <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${stats.visibility}%` }} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Tracked Keywords</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-bold">{stats.keywords_top10 + stats.keywords_top3}</div>
                            <div className={`flex items-center text-xs font-semibold ${stats.keywords_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {stats.keywords_change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                {Math.abs(stats.keywords_change)}
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-none">Top 3: {stats.keywords_top3}</Badge>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-none">Top 10: {stats.keywords_top10}</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Backlink Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-bold">{stats.backlinks.toLocaleString()}</div>
                            <div className={`flex items-center text-xs font-semibold ${stats.backlinks_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {stats.backlinks_change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                {Math.abs(stats.backlinks_change)}
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground">
                            Referring Domains: <strong>{(stats.backlinks * 0.4).toFixed(0)}</strong>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Site Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-bold">{stats.health_score}</div>
                            <div className={`flex items-center text-xs font-semibold ${stats.health_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {stats.health_change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                {Math.abs(stats.health_change)}
                            </div>
                        </div>
                        <Progress value={stats.health_score} className="mt-4 h-1" />
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Organic Visibility Trend */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Organic Visibility Trend</CardTitle>
                        <CardDescription>Search visibility percentage over the last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={visibilityChart}>
                                <defs>
                                    <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVis)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Keyword Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ranking Distribution</CardTitle>
                        <CardDescription>Keywords grouped by rank position</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={keywordDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="count"
                                >
                                    {keywordDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground font-bold text-lg">
                                    {keywordDistribution.reduce((acc, curr) => acc + curr.count, 0)}
                                </text>
                                <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-xs">
                                    Total Keywords
                                </text>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2 ml-4">
                            {keywordDistribution.map((entry, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="text-xs text-muted-foreground">{entry.range}: <strong>{entry.count}</strong></span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Lower Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Backlink Growth Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Backlink Growth</CardTitle>
                        <CardDescription>New vs Lost backlinks per month</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={backlinkGrowth}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Bar dataKey="new" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="lost" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Technical Issues */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Technical Audit Highlights</CardTitle>
                            <CardDescription>Most critical issues found in last scan</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary">
                            View Full Audit
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topIssues.map((issue, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                                    <div className={`p-2 rounded-full ${issue.severity === 'critical' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                        <ShieldAlert className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold">{issue.title}</h4>
                                            <Badge variant="outline" className="text-[12px] uppercase font-bold px-1.5 py-0">
                                                {issue.count} Pages
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{issue.description}</p>
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                            {topIssues.length === 0 && (
                                <div className="text-center py-12">
                                    <Zap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                    <h3 className="font-semibold mb-1">No Scans Yet</h3>
                                    <p className="text-muted-foreground text-sm">
                                        Run a deep crawl to identify technical SEO bottlenecks.
                                    </p>
                                    <Button className="mt-4" size="sm">Start First Scan</Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
