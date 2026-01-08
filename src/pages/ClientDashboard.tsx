import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    Users,
    Mail,
    TrendingUp,
    Calendar,
    FileTextIcon,
    CheckCircle,
    Clock,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccountSettings } from '@/contexts/UnifiedAppContext';

interface MetricCard {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: string;
    description?: string;
}

interface RecentActivity {
    id: string;
    type: string;
    title: string;
    status: string;
    date: string;
}

interface CampaignSummary {
    name: string;
    sent: number;
    opened: number;
    clicked: number;
    status: string;
}

const iconMap: Record<string, React.ElementType> = {
    Users,
    Mail,
    TrendingUp,
    BarChart3,
    FileTextIcon,
    Calendar,
    Clock,
    CheckCircle
};

export default function ClientDashboard() {
    const [data, setData] = useState<{
        metrics: MetricCard[];
        activities: RecentActivity[];
        campaigns: CampaignSummary[];
        summary: {
            forms_submitted: number;
            new_contacts: number;
            delivery_rate: string;
            tasks_pending: number;
        };
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('/api/mt/subaccount/stats');
                if (response.data.success) {
                    setData(response.data.data);
                } else {
                    toast({
                        title: 'Error',
                        description: 'Failed to fetch dashboard data',
                        variant: 'destructive',
                    });
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
                // Fallback to mock data on error for development if needed, 
                // but for now just show error toast
                toast({
                    title: 'Connection Error',
                    description: 'Could not connect to the statistics service',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [toast]);

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
            completed: 'default',
            in_progress: 'secondary',
            pending: 'outline',
            active: 'default',
            scheduled: 'secondary',
            sending: 'secondary',
            draft: 'outline'
        };
        return <Badge variant={variants[status] || 'outline'}>{status.replace('_', ' ')}</Badge>;
    };

    const getActivityIcon = (type: string) => {
        const icons: Record<string, React.ElementType> = {
            email: Mail,
            campaign: BarChart3,
            form: FileTextIcon,
            call: Calendar,
            task: CheckCircle
        };
        const Icon = icons[type] || FileTextIcon;
        return <Icon className="h-4 w-4 text-muted-foreground" />;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-24 mb-2" />
                                <Skeleton className="h-3 w-48" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div></CardContent></Card>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { metrics, activities, campaigns, summary } = data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Your Dashboard</h1>
                <p className="text-muted-foreground">
                    Overview of your marketing performance and recent activity
                </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {metrics
                    .filter(m => {
                        if (m.icon === 'Mail' && !isFeatureEnabled('email')) return false;
                        if (m.icon === 'Users' && !isFeatureEnabled('crm')) return false;
                        return true;
                    })
                    .map((metric, index) => {
                        const Icon = iconMap[metric.icon] || BarChart3;
                        return (
                            <Card key={index}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{metric.value}</div>
                                    {metric.change !== undefined && metric.change !== 0 && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                            {metric.change > 0 ? (
                                                <ArrowUpRight className="h-3 w-3 text-green-500" />
                                            ) : (
                                                <ArrowDownRight className="h-3 w-3 text-red-500" />
                                            )}
                                            <span className={metric.change > 0 ? 'text-green-500' : 'text-red-500'}>
                                                {metric.change > 0 ? '+' : ''}{metric.change}%
                                            </span>
                                            {metric.changeLabel}
                                        </p>
                                    )}
                                    {metric.description && (
                                        <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Activity */}
                <Card className={!isFeatureEnabled('email') ? 'md:col-span-2' : ''}>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest actions on your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activities.map((activity) => (
                                <div key={activity.id} className="flex items-center gap-4">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{activity.title}</p>
                                        <p className="text-xs text-muted-foreground">{activity.date}</p>
                                    </div>
                                    {getStatusBadge(activity.status)}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Campaign Performance */}
                {isFeatureEnabled('email') && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign Performance</CardTitle>
                            <CardDescription>Your recent marketing campaigns</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {campaigns.map((campaign, index) => {
                                    const openRate = campaign.sent > 0 ? (campaign.opened / campaign.sent) * 100 : 0;
                                    const clickRate = campaign.opened > 0 ? (campaign.clicked / campaign.opened) * 100 : 0;

                                    return (
                                        <div key={index} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">{campaign.name}</span>
                                                {getStatusBadge(campaign.status)}
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                                                <div>Sent: {campaign.sent.toLocaleString()}</div>
                                                <div>Opens: {openRate.toFixed(1)}%</div>
                                                <div>Clicks: {clickRate.toFixed(1)}%</div>
                                            </div>
                                            <Progress value={openRate} className="h-1.5" />
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Quick Stats */}
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Summary</CardTitle>
                    <CardDescription>Key performance indicators for this month</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{summary.forms_submitted}</p>
                                <p className="text-xs text-muted-foreground">Forms Submitted</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{summary.new_contacts}</p>
                                <p className="text-xs text-muted-foreground">New Contacts</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                                <Mail className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{summary.delivery_rate}</p>
                                <p className="text-xs text-muted-foreground">Delivery Rate</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{summary.tasks_pending}</p>
                                <p className="text-xs text-muted-foreground">Tasks Pending</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

