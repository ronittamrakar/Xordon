import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
    TrendingUp, Users, CheckCircle2, Clock,
    AlertCircle, Kanban, Target, Calendar
} from 'lucide-react';
import SEO from '@/components/SEO';

const statusData = [
    { name: 'Planning', value: 15, color: '#3b82f6' },
    { name: 'Active', value: 35, color: '#10b981' },
    { name: 'On Hold', value: 10, color: '#f59e0b' },
    { name: 'Completed', value: 40, color: '#6366f1' },
];

const velocityData = [
    { name: 'Week 1', completed: 12, target: 15 },
    { name: 'Week 2', completed: 18, target: 15 },
    { name: 'Week 3', completed: 15, target: 20 },
    { name: 'Week 4', completed: 22, target: 20 },
    { name: 'Week 5', completed: 25, target: 25 },
    { name: 'Week 6', completed: 21, target: 25 },
];

const resourceData = [
    { name: 'John D.', tasks: 12, load: 85 },
    { name: 'Sarah M.', tasks: 8, load: 60 },
    { name: 'Mike R.', tasks: 15, load: 95 },
    { name: 'Lisa K.', tasks: 10, load: 75 },
];

import { api } from '@/lib/api';
import { toast } from 'sonner';

const ProjectAnalytics: React.FC = () => {
    const [analytics, setAnalytics] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const data = await (api as any).projects.getAnalytics();
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
            toast.error('Failed to load project analytics');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadAnalytics();
    }, []);

    const summary = analytics?.summary || { total_projects: 0, avg_progress: 0, active_tasks: 0 };
    const velocityData = (analytics?.velocity || []).map((v: any) => ({
        name: new Date(v.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        completed: v.count,
        target: 10 // Placeholder target
    }));

    const statusMap: Record<string, string> = {
        'planning': '#3b82f6',
        'active': '#10b981',
        'on_hold': '#f59e0b',
        'completed': '#6366f1',
        'archived': '#94a3b8'
    };

    const statusData = (analytics?.statusDistribution || []).map((s: any) => ({
        name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
        value: s.count,
        color: statusMap[s.status] || '#cbd5e1'
    }));

    return (
        <div className="space-y-4 bg-slate-50/30 dark:bg-slate-950/30 min-h-screen">
            <SEO title="Project Analytics" description="Detailed insights into project performance and team velocity." />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight text-slate-900 dark:text-white">Project Analytics</h1>
                    <p className="text-muted-foreground text-lg">Performance insights and delivery metrics</p>
                </div>
                <Button variant="outline" onClick={loadAnalytics} disabled={loading}>
                    {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
            </div>

            {loading && !analytics ? (
                <div className="py-20 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Calculating analytics...</p>
                </div>
            ) : (
                <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="bg-white dark:bg-slate-900 shadow-sm border-none ring-1 ring-slate-200 dark:ring-slate-800">
                            <CardHeader className="pb-2">
                                <CardDescription className="uppercase text-xs font-bold tracking-wider">Overall Progress</CardDescription>
                                <CardTitle className="text-2xl font-bold text-blue-600">{Math.round(summary.avg_progress || 0)}%</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>Across all projects</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white dark:bg-slate-900 shadow-sm border-none ring-1 ring-slate-200 dark:ring-slate-800">
                            <CardHeader className="pb-2">
                                <CardDescription className="uppercase text-xs font-bold tracking-wider">Active Tasks</CardDescription>
                                <CardTitle className="text-2xl font-bold text-emerald-600">{summary.active_tasks || 0}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-muted-foreground">Pending or In Progress</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white dark:bg-slate-900 shadow-sm border-none ring-1 ring-slate-200 dark:ring-slate-800">
                            <CardHeader className="pb-2">
                                <CardDescription className="uppercase text-xs font-bold tracking-wider">Total Projects</CardDescription>
                                <CardTitle className="text-2xl font-bold text-amber-600">{summary.total_projects || 0}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-muted-foreground">In current workspace</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white dark:bg-slate-900 shadow-sm border-none ring-1 ring-slate-200 dark:ring-slate-800">
                            <CardHeader className="pb-2">
                                <CardDescription className="uppercase text-xs font-bold tracking-wider">On-Time Rate</CardDescription>
                                <CardTitle className="text-2xl font-bold text-indigo-600">94%</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-green-600 font-medium">Internal target</div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Velocity Chart */}
                <Card className="bg-white dark:bg-slate-900 shadow-xl border-none ring-1 ring-slate-200 dark:ring-slate-800 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            Delivery Velocity
                        </CardTitle>
                        <CardDescription>Comparison of completed tasks vs weekly targets</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={velocityData}>
                                <defs>
                                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
                                <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Status Distribution */}
                <Card className="bg-white dark:bg-slate-900 shadow-xl border-none ring-1 ring-slate-200 dark:ring-slate-800 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Kanban className="h-5 w-5 text-emerald-500" />
                            Status Distribution
                        </CardTitle>
                        <CardDescription>Current project lifecycle distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="w-1/3 space-y-3 pr-4">
                            {statusData.map((s, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></div>
                                        <span className="text-muted-foreground">{s.name}</span>
                                    </div>
                                    <span className="font-semibold">{s.value}%</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Resource Load */}
                <Card className="bg-white dark:bg-slate-900 shadow-xl border-none ring-1 ring-slate-200 dark:ring-slate-800 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-500" />
                            Team Capacity & Load
                        </CardTitle>
                        <CardDescription>Current task burden across project members</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={resourceData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="load" radius={[0, 4, 4, 0]} barSize={20}>
                                    {resourceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.load > 90 ? '#ef4444' : entry.load > 75 ? '#f59e0b' : '#6366f1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Upcoming Milestones */}
                <Card className="bg-white dark:bg-slate-900 shadow-xl border-none ring-1 ring-slate-200 dark:ring-slate-800">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Target className="h-5 w-5 text-orange-500" />
                            Critical Milestones
                        </CardTitle>
                        <CardDescription>Upcoming 2 weeks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { name: 'Beta Launch', date: 'Jan 15', project: 'Mobile App', status: 'on-track' },
                            { name: 'API Docs Completion', date: 'Jan 18', project: 'Internal API', status: 'at-risk' },
                            { name: 'User Testing', date: 'Jan 22', project: 'Store Redesign', status: 'on-track' },
                            { name: 'Final SEO Audit', date: 'Jan 25', project: 'Landing Pages', status: 'planned' },
                        ].map((m, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className={`mt-1 h-3 w-3 rounded-full ${m.status === 'at-risk' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : m.status === 'on-track' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{m.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="font-medium text-slate-600 dark:text-slate-400">{m.project}</span>
                                        <span>•</span>
                                        <span>{m.date}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ProjectAnalytics;
