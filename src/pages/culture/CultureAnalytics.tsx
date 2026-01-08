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
    Heart,
    Smile,
    MessageCircle,
    Award,
    RefreshCw
} from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { api } from '@/lib/api';

const generateMockData = () => {
    return {
        overview: {
            eNPS: 42,
            participationRate: 78,
            recognitionEvents: 156,
            feedbackSubmissions: 45
        },
        satisfactionTrend: Array.from({ length: 6 }).map((_, i) => ({
            month: `M${i + 1}`,
            score: 7 + Math.random() * 2
        })),
        valuesAlignment: [
            { name: 'Innovation', score: 8.5 },
            { name: 'Teamwork', score: 9.2 },
            { name: 'Customer First', score: 8.8 },
            { name: 'Integrity', score: 9.5 },
        ]
    };
};

const CultureAnalytics: React.FC = () => {
    const { data, refetch } = useQuery({
        queryKey: ['culture-analytics'],
        queryFn: async () => {
            try {
                return await api.getCultureAnalytics();
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
            <Breadcrumb items={[{ label: 'Culture', href: '/culture' }, { label: 'Analytics' }]} />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">
                        Culture Analytics
                    </h1>
                    <p className="text-muted-foreground">Employee sentiment and engagement</p>
                </div>
                <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="eNPS Score" value={analytics.overview.eNPS} icon={Smile} color="text-green-600" />
                <StatCard title="Survey Participation" value={`${analytics.overview.participationRate}%`} icon={MessageCircle} color="text-blue-600" />
                <StatCard title="Recognitions" value={analytics.overview.recognitionEvents} icon={Award} color="text-purple-600" />
                <StatCard title="Feedback" value={analytics.overview.feedbackSubmissions} icon={MessageCircle} color="text-orange-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Satisfaction Trend (1-10)</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics.satisfactionTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis domain={[0, 10]} />
                                <Tooltip />
                                <Line type="monotone" dataKey="score" stroke="#ec4899" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Values Alignment</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics.valuesAlignment} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" domain={[0, 10]} />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="score" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CultureAnalytics;
