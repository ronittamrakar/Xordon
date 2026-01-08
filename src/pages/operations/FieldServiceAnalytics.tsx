import React, { useMemo } from 'react';
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
    Cell,
    LineChart,
    Line
} from 'recharts';
import {
    Wrench,
    Truck,
    Clock,
    CheckCircle,
    AlertTriangle,
    RefreshCw,
    Users
} from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { api } from '@/lib/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const generateMockData = () => {
    return {
        overview: {
            jobsCompleted: 156,
            onTimeRate: 94.2,
            avgJobTime: '1h 45m',
            activeTechs: 12
        },
        jobsByStatus: [
            { name: 'Completed', value: 156 },
            { name: 'Scheduled', value: 45 },
            { name: 'In Progress', value: 12 },
            { name: 'Cancelled', value: 5 },
        ],
        techPerformance: [
            { name: 'John Doe', jobs: 45, rating: 4.8 },
            { name: 'Jane Smith', jobs: 42, rating: 4.9 },
            { name: 'Bob Wilson', jobs: 38, rating: 4.7 },
            { name: 'Alice Brown', jobs: 31, rating: 4.9 },
        ]
    };
};

const FieldServiceAnalytics: React.FC = () => {
    const { data, refetch } = useQuery({
        queryKey: ['field-service-analytics'],
        queryFn: async () => {
            try {
                return await api.getFieldServiceAnalytics();
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
            <Breadcrumb items={[{ label: 'Operations', href: '/operations' }, { label: 'Field Service', href: '/operations/field-service' }, { label: 'Analytics' }]} />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">
                        Field Service Analytics
                    </h1>
                    <p className="text-muted-foreground">Technician performance and job efficiency</p>
                </div>
                <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Jobs Completed" value={analytics.overview.jobsCompleted} icon={CheckCircle} color="text-green-600" />
                <StatCard title="On-Time Rate" value={`${analytics.overview.onTimeRate}%`} icon={Clock} color="text-blue-600" />
                <StatCard title="Avg Job Time" value={analytics.overview.avgJobTime} icon={Wrench} color="text-purple-600" />
                <StatCard title="Active Techs" value={analytics.overview.activeTechs} icon={Users} color="text-orange-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Job Status Distribution</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={analytics.jobsByStatus} dataKey="value" cx="50%" cy="50%" outerRadius={100} label>
                                    {analytics.jobsByStatus.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Technician Performance</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics.techPerformance} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="jobs" fill="#3b82f6" name="Jobs Completed" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default FieldServiceAnalytics;
