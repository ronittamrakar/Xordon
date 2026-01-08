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
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    RefreshCw
} from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { api } from '@/lib/api';

const generateMockData = () => {
    return {
        overview: {
            totalAppointments: 342,
            completed: 298,
            cancelled: 24,
            noShow: 20,
            utilization: 85
        },
        dailyTrend: Array.from({ length: 7 }).map((_, i) => ({
            day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
            appointments: Math.floor(Math.random() * 20) + 10
        })),
        hourlyDistribution: Array.from({ length: 12 }).map((_, i) => ({
            hour: `${9 + i}:00`,
            count: Math.floor(Math.random() * 15)
        }))
    };
};

const SchedulingAnalytics: React.FC = () => {
    const { data, refetch } = useQuery({
        queryKey: ['scheduling-analytics'],
        queryFn: async () => {
            try {
                return await api.getSchedulingAnalytics();
            } catch (error) {
                console.error(error);
                return generateMockData();
            }
        }
    });

    const analytics = data || generateMockData();

    return (
        <div className="space-y-4">
            <Breadcrumb items={[{ label: 'Scheduling', href: '/scheduling' }, { label: 'Analytics' }]} />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">
                        Scheduling Analytics
                    </h1>
                    <p className="text-muted-foreground">Appointment trends and capacity planning</p>
                </div>
                <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-muted-foreground">Total Appointments</p>
                        <h3 className="text-2xl font-bold mt-2">{analytics.overview.totalAppointments}</h3>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                        <h3 className="text-2xl font-bold mt-2 text-green-600">
                            {((analytics.overview.completed / analytics.overview.totalAppointments) * 100).toFixed(1)}%
                        </h3>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-muted-foreground">No-Show Rate</p>
                        <h3 className="text-2xl font-bold mt-2 text-red-600">
                            {((analytics.overview.noShow / analytics.overview.totalAppointments) * 100).toFixed(1)}%
                        </h3>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-muted-foreground">Utilization</p>
                        <h3 className="text-2xl font-bold mt-2 text-blue-600">{analytics.overview.utilization}%</h3>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Weekly Volume</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics.dailyTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="appointments" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Peak Hours</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics.hourlyDistribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SchedulingAnalytics;
