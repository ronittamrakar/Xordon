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
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    Bot,
    MessageSquare,
    Zap,
    TrendingUp,
    RefreshCw
} from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const generateMockData = () => {
    return {
        overview: {
            activeAgents: 8,
            conversations: 450,
            resolutionRate: 85,
            avgResponseTime: '2s'
        },
        agentPerformance: [
            { name: 'Support Bot', conversations: 200, rating: 4.5 },
            { name: 'Sales Agent', conversations: 150, rating: 4.2 },
            { name: 'Booking Asst', conversations: 80, rating: 4.8 },
            { name: 'FAQ Bot', conversations: 20, rating: 4.0 },
        ],
        intentBreakdown: [
            { name: 'Support', value: 45 },
            { name: 'Pricing', value: 25 },
            { name: 'Booking', value: 20 },
            { name: 'General', value: 10 },
        ]
    };
};

const AIAnalytics: React.FC = () => {
    const { data, refetch } = useQuery({
        queryKey: ['ai-analytics'],
        queryFn: async () => {
            await new Promise(r => setTimeout(r, 600));
            return generateMockData();
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
            <Breadcrumb items={[{ label: 'AI Agents', href: '/ai' }, { label: 'Analytics' }]} />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">
                        AI Analytics
                    </h1>
                    <p className="text-muted-foreground">Agent performance and conversation metrics</p>
                </div>
                <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Active Agents" value={analytics.overview.activeAgents} icon={Bot} color="text-blue-600" />
                <StatCard title="Conversations" value={analytics.overview.conversations} icon={MessageSquare} color="text-green-600" />
                <StatCard title="Resolution Rate" value={`${analytics.overview.resolutionRate}%`} icon={Zap} color="text-purple-600" />
                <StatCard title="Avg Response" value={analytics.overview.avgResponseTime} icon={TrendingUp} color="text-orange-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Agent Volume</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics.agentPerformance} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="conversations" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Intent Distribution</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={analytics.intentBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={100} label>
                                    {analytics.intentBreakdown.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AIAnalytics;
