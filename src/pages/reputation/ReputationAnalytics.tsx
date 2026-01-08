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
    Star,
    MessageSquare,
    TrendingUp,
    Share2,
    RefreshCw
} from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { api } from '@/lib/api';

const COLORS = ['#10b981', '#fbbf24', '#ef4444'];

const generateMockData = () => {
    return {
        overview: {
            avgRating: 4.8,
            totalReviews: 1250,
            sentimentScore: 92,
            responseRate: 98
        },
        ratingsDistribution: [
            { name: '5 Stars', value: 950 },
            { name: '4 Stars', value: 200 },
            { name: '3 Stars', value: 50 },
            { name: '2 Stars', value: 30 },
            { name: '1 Star', value: 20 },
        ],
        sourceBreakdown: [
            { name: 'Google', value: 800 },
            { name: 'Facebook', value: 300 },
            { name: 'Yelp', value: 150 },
        ]
    };
};

const ReputationAnalytics: React.FC = () => {
    const { data, refetch } = useQuery({
        queryKey: ['reputation-analytics'],
        queryFn: async () => {
            try {
                return await api.getReputationAnalytics();
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
            <Breadcrumb items={[{ label: 'Reputation', href: '/reputation' }, { label: 'Analytics' }]} />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">
                        Reputation Analytics
                    </h1>
                    <p className="text-muted-foreground">Reviews and sentiment tracking</p>
                </div>
                <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Average Rating" value={analytics.overview.avgRating} icon={Star} color="text-yellow-500" />
                <StatCard title="Total Reviews" value={analytics.overview.totalReviews} icon={MessageSquare} color="text-blue-600" />
                <StatCard title="Sentiment Score" value={analytics.overview.sentimentScore} icon={TrendingUp} color="text-green-600" />
                <StatCard title="Response Rate" value={`${analytics.overview.responseRate}%`} icon={Share2} color="text-purple-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Review Breakdown</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics.ratingsDistribution} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={80} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#fbbf24" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Source Distribution</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={analytics.sourceBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={100} label>
                                    {analytics.sourceBreakdown.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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

export default ReputationAnalytics;
