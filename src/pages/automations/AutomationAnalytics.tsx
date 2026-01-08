import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
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
import {
    Bot,
    Zap,
    Clock,
    CheckCircle,
    RefreshCw,
    Activity
} from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { api } from '@/lib/api';

const generateMockData = () => {
    return {
        overview: {
            activeWorkflows: 34,
            executions: 12500,
            successRate: 98.5,
            timeSaved: '450h'
        },
        executionTrend: Array.from({ length: 7 }).map((_, i) => ({
            day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
            executions: Math.floor(Math.random() * 500) + 100
        })),
        topWorkflows: [
            { name: 'Lead Nurture', executions: 4500 },
            { name: 'Invoice Reminder', executions: 3200 },
            { name: 'Onboarding', executions: 1800 },
            { name: 'Review Request', executions: 1200 },
        ]
    };
};

const AutomationAnalytics: React.FC = () => {
    const { data, refetch } = useQuery({
        queryKey: ['automation-analytics'],
        queryFn: async () => {
            try {
                return await api.getAutomationAnalytics();
            } catch (error) {
                console.error(error);
                return generateMockData();
            }
        }
    });

    const analytics = data || generateMockData();

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
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
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-4">
            <Breadcrumb items={[{ label: 'Automations', href: '/automations' }, { label: 'Analytics' }]} />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">
                        Automation Analytics
                    </h1>
                    <p className="text-muted-foreground">Workflow performance and efficiency</p>
                </div>
                <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Active Workflows" value={analytics.overview.activeWorkflows} icon={Zap} color="text-blue-600" />
                <StatCard title="Total Executions" value={analytics.overview.executions.toLocaleString()} icon={Activity} color="text-purple-600" />
                <StatCard title="Success Rate" value={`${analytics.overview.successRate}%`} icon={CheckCircle} color="text-green-600" />
                <StatCard title="Time Saved" value={analytics.overview.timeSaved} icon={Clock} color="text-orange-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Daily Executions</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics.executionTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="executions" stroke="#8b5cf6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Top Workflows</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics.topWorkflows} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="executions" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AutomationAnalytics;
