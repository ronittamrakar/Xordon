
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/Breadcrumb';
import ticketsApi from '@/services/ticketsApi';
import {
    MessageSquare,
    BookOpen,
    Settings,
    BarChart3,
    TrendingUp,
    Clock,
    User,
    AlertCircle,
    ArrowRight,
    Plus,
    MessageCircle,
    Users,
    Globe,
    CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HelpdeskDashboard: React.FC = () => {
    const navigate = useNavigate();

    // Fetch stats using existing API
    const { data: stats, isLoading } = useQuery({
        queryKey: ['ticket-stats'],
        queryFn: () => ticketsApi.stats(),
    });

    const cards = [
        {
            title: 'Tickets',
            description: 'Manage support tickets',
            icon: MessageSquare,
            href: '/helpdesk/tickets',
            color: 'bg-blue-500',
            stat: stats?.total || 0,
            statLabel: 'Total Tickets'
        },
        {
            title: 'Knowledge Base',
            description: 'View and manage articles',
            icon: BookOpen,
            href: '/helpdesk/help-center',
            color: 'bg-purple-500',
            stat: 'Portal', // Placeholder as we don't have article count in stats yet
            statLabel: 'Access Portal'
        },
        {
            title: 'Reports',
            description: 'Analytics and insights',
            icon: BarChart3,
            href: '/helpdesk/reports',
            color: 'bg-green-500',
            stat: stats?.avg_csat ? stats.avg_csat.toFixed(1) : '–',
            statLabel: 'Avg CSAT'
        },
        {
            title: 'Settings',
            description: 'Configure helpdesk',
            icon: Settings,
            href: '/helpdesk/settings',
            color: 'bg-orange-500',
            stat: 'Config',
            statLabel: 'System'
        },
        {
            title: 'Canned Responses',
            description: 'Quick reply templates',
            icon: MessageCircle,
            href: '/helpdesk/canned-responses',
            color: 'bg-indigo-500',
            stat: 'Templates',
            statLabel: 'Quick Replies'
        },
        {
            title: 'Ticket Teams',
            description: 'Manage support teams',
            icon: Users,
            href: '/helpdesk/teams',
            color: 'bg-teal-500',
            stat: 'Teams',
            statLabel: 'Collaboration'
        },
        {
            title: 'SLA Policies',
            description: 'Response time rules',
            icon: Clock,
            href: '/helpdesk/sla-policies',
            color: 'bg-red-500',
            stat: 'Policies',
            statLabel: 'Service Level'
        },
        {
            title: 'Live Chat',
            description: 'Real-time conversations',
            icon: Globe,
            href: '/helpdesk/live-chat',
            color: 'bg-pink-500',
            stat: 'Active',
            statLabel: 'Conversations'
        }
    ];

    return (
        <>
            <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Helpdesk' }]} />

            <div className="mx-auto max-w-7xl py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Helpdesk Overview</h1>
                        <p className="text-muted-foreground mt-1">
                            Central hub for customer support and ticket management
                        </p>
                    </div>
                    <Button onClick={() => navigate('/helpdesk/tickets?create=true')}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Ticket
                    </Button>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.open || 0}</div>
                            <p className="text-xs text-muted-foreground">Requires attention</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Assigned to Me</CardTitle>
                            <User className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.assigned_to_me || 0}</div>
                            <p className="text-xs text-muted-foreground">Your active tickets</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">SLA Breaches</CardTitle>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">{stats?.sla_breached || 0}</div>
                            <p className="text-xs text-muted-foreground">Breached response time</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats?.avg_resolution_hours ? `${stats.avg_resolution_hours}h` : '0h'}
                            </div>
                            <p className="text-xs text-muted-foreground">Time to resolve</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/helpdesk/tickets?create=true')}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">Create New Ticket</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Quickly add a new support request</p>
                                    </div>
                                    <Plus className="w-8 h-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/helpdesk/help-center/manage')}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">Add Knowledge Article</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Create helpful documentation</p>
                                    </div>
                                    <BookOpen className="w-8 h-8 text-purple-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/helpdesk/canned-responses')}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">Manage Templates</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Set up quick response templates</p>
                                    </div>
                                    <MessageCircle className="w-8 h-8 text-indigo-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Analytics Overview */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.avg_resolution_hours || 0}h</div>
                                <p className="text-xs text-muted-foreground">Average first response</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats ? Math.round(((stats.total - stats.open) / stats.total) * 100) : 0}%
                                </div>
                                <p className="text-xs text-muted-foreground">Tickets resolved</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {stats ? Math.round(100 - (stats.sla_breached / stats.total) * 100) : 100}%
                                </div>
                                <p className="text-xs text-muted-foreground">Within response time</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Team Efficiency</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats?.assigned_to_me || 0}/{stats?.total || 0}
                                </div>
                                <p className="text-xs text-muted-foreground">Your workload</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Navigation Cards */}
                <h2 className="text-xl font-semibold mb-4">Modules</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cards.map((card) => (
                        <Card
                            key={card.title}
                            className="hover:shadow-md transition-all cursor-pointer border-l-4"
                            style={{ borderLeftColor: card.color.replace('bg-', 'text-') }} // Approximate logic for border color if using tailwind classes directly in style would be better but let's rely on class utility if possible or just border-l-primary
                            onClick={() => navigate(card.href)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`p-2 rounded-lg ${card.color} bg-opacity-10 text-white`}>
                                        <card.icon className={`h-6 w-6 text-foreground`} />
                                    </div>
                                </div>
                                <CardTitle className="text-lg">{card.title}</CardTitle>
                                <CardDescription>{card.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mt-4">
                                    <div>
                                        <p className="text-2xl font-bold">{card.stat}</p>
                                        <p className="text-xs text-muted-foreground">{card.statLabel}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Help & Resources */}
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Help & Resources</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-semibold mb-2">Helpdesk Guide</h3>
                                <p className="text-sm text-muted-foreground mb-4">Learn how to use all helpdesk features effectively</p>
                                <Button variant="outline" size="sm">View Guide</Button>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-semibold mb-2">Best Practices</h3>
                                <p className="text-sm text-muted-foreground mb-4">Tips for excellent customer support</p>
                                <Button variant="outline" size="sm">Read Tips</Button>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-semibold mb-2">API Documentation</h3>
                                <p className="text-sm text-muted-foreground mb-4">Integrate helpdesk with your systems</p>
                                <Button variant="outline" size="sm">API Docs</Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </div>
        </>
    );
};

export default HelpdeskDashboard;
