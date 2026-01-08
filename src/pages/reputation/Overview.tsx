import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { ModuleGuard } from '@/components/ModuleGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Star,
    TrendingUp,
    Send,
    MessageSquare,
    BarChart3,
    Smile,
    Meh,
    Frown,
    Users,
    Target,
    Award,
    RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import reputationApi, { ReputationStats } from '@/services/reputationApi';

export default function ReputationOverview() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('6m');
    const [stats, setStats] = useState<ReputationStats | null>(null);

    useEffect(() => {
        loadStats();
    }, [timeRange]);

    const loadStats = async () => {
        try {
            setLoading(true);
            const data = await reputationApi.getStats(timeRange);
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
            toast({
                title: 'Error',
                description: 'Failed to load reputation statistics',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading && !stats) {
        return (
            <ModuleGuard moduleKey="reputation">
                <SEO title="Reputation Overview" description="Monitor and manage your online reputation" />
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-muted-foreground">Loading reputation data...</p>
                    </div>
                </div>
            </ModuleGuard>
        );
    }

    return (
        <ModuleGuard moduleKey="reputation">
            <SEO title="Reputation Overview" description="Monitor and manage your online reputation" />

            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[18px] font-bold tracking-tight">Reputation Overview</h1>
                        <p className="text-muted-foreground">Monitor your online reputation and reviews</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1w">Last Week</SelectItem>
                                <SelectItem value="1m">Last Month</SelectItem>
                                <SelectItem value="3m">Last 3 Months</SelectItem>
                                <SelectItem value="6m">Last 6 Months</SelectItem>
                                <SelectItem value="1y">Last Year</SelectItem>
                                <SelectItem value="all">All Time</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={() => navigate('/reputation/requests')}>
                            <Send className="h-4 w-4 mr-2" />
                            Send Review Request
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Invites Goal</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats?.invitesSent}/{stats?.invitesGoal}
                            </div>
                            <Progress
                                value={stats && stats.invitesGoal > 0 ? (stats.invitesSent / stats.invitesGoal) * 100 : 0}
                                className="mt-2"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Reviews Received</CardTitle>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.reviewsReceived || 0}</div>
                            <div className="flex items-center text-xs text-green-600 mt-1">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                +{stats?.reviewsChange || 0}% from last period
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                            <Star className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.averageRating.toFixed(1) || '0.0'}</div>
                            <div className="flex items-center text-xs text-green-600 mt-1">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                +{stats?.ratingChange || 0} from last period
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.responseRate || 0}%</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {Math.round(((stats?.responseRate || 0) / 100) * (stats?.reviewsReceived || 0))}/
                                {stats?.reviewsReceived || 0} reviews responded
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Sentiment Analysis */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sentiment Analysis</CardTitle>
                        <CardDescription>Overall sentiment breakdown of your reviews</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                <Smile className="h-8 w-8 text-green-500" />
                                <div>
                                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                                        {stats?.sentiment.positive || 0}%
                                    </div>
                                    <p className="text-sm text-muted-foreground">Positive</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                                <Meh className="h-8 w-8 text-yellow-500" />
                                <div>
                                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                                        {stats?.sentiment.neutral || 0}%
                                    </div>
                                    <p className="text-sm text-muted-foreground">Neutral</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                <Frown className="h-8 w-8 text-red-500" />
                                <div>
                                    <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                                        {stats?.sentiment.negative || 0}%
                                    </div>
                                    <p className="text-sm text-muted-foreground">Negative</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Rating Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Rating Breakdown</CardTitle>
                        <CardDescription>Distribution of star ratings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {[5, 4, 3, 2, 1].map((rating) => {
                            const count = stats?.ratingBreakdown[rating as keyof typeof stats.ratingBreakdown] || 0;
                            const total = stats?.reviewsReceived || 1;
                            const percentage = (count / total) * 100;

                            return (
                                <div key={rating} className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 w-20">
                                        <span className="text-sm font-medium">{rating}</span>
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    </div>
                                    <Progress value={percentage} className="flex-1" />
                                    <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => navigate('/reputation/requests')}
                    >
                        <CardContent className="p-6">
                            <Send className="h-8 w-8 text-primary mb-3" />
                            <h3 className="font-semibold mb-1">Send Review Request</h3>
                            <p className="text-sm text-muted-foreground">Request reviews from your customers</p>
                        </CardContent>
                    </Card>
                    <Card
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => navigate('/reputation/widgets')}
                    >
                        <CardContent className="p-6">
                            <Award className="h-8 w-8 text-primary mb-3" />
                            <h3 className="font-semibold mb-1">Create Widget</h3>
                            <p className="text-sm text-muted-foreground">Display reviews on your website</p>
                        </CardContent>
                    </Card>
                    <Card
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => navigate('/reputation/settings')}
                    >
                        <CardContent className="p-6">
                            <Users className="h-8 w-8 text-primary mb-3" />
                            <h3 className="font-semibold mb-1">Configure AI Agents</h3>
                            <p className="text-sm text-muted-foreground">Set up automated review responses</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ModuleGuard>
    );
}
