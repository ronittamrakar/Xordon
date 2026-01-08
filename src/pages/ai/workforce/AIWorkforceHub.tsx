import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Briefcase, ClipboardCheck, History, BarChart3,
    ArrowRight, Plus, Shield, Zap, TrendingUp, AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    useAiEmployees,
    useAiApprovals,
    useAiWorkHistory,
    useAiWorkforceHierarchy,
    useAiPerformanceMetrics
} from '@/hooks/useAiWorkforce';

import { Breadcrumb } from '@/components/Breadcrumb';

const AIWorkforceHub: React.FC = () => {
    const navigate = useNavigate();
    const { data: employees = [], isLoading: employeesLoading } = useAiEmployees();
    const { data: approvals = [], isLoading: approvalsLoading } = useAiApprovals('pending');
    const { data: history = [] } = useAiWorkHistory({ limit: 5 });
    const { data: metrics = [] } = useAiPerformanceMetrics({ start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] });

    const totalTasks = metrics.reduce((acc, m) => acc + (Number(m.tasks_completed) || 0), 0);
    const avgEfficiency = metrics.length > 0
        ? Math.round(metrics.reduce((acc, m) => acc + (Number(m.efficiency_score) || 0), 0) / metrics.length)
        : 0;

    const stats = [
        {
            title: 'Active Employees',
            value: employees.length,
            description: 'AI agents with workforce roles',
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-100 dark:bg-blue-900/30'
        },
        {
            title: 'Pending Approvals',
            value: approvals.length,
            description: 'Actions requiring human review',
            icon: Shield,
            color: 'text-amber-600',
            bg: 'bg-amber-100 dark:bg-amber-900/30'
        },
        {
            title: 'Tasks (Last 24h)',
            value: totalTasks || history.length,
            description: 'Successful AI actions',
            icon: Zap,
            color: 'text-green-600',
            bg: 'bg-green-100 dark:bg-green-900/30'
        },
        {
            title: 'Efficiency Gain',
            value: avgEfficiency > 0 ? `+${avgEfficiency}%` : '--',
            description: 'Vs manual human labor',
            icon: TrendingUp,
            color: 'text-purple-600',
            bg: 'bg-purple-100 dark:bg-purple-900/30'
        }
    ];

    const sections = [
        {
            title: 'Employee Management',
            description: 'Assign roles, set autonomy levels, and define supervisors.',
            icon: Briefcase,
            route: '/ai/workforce/employees',
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20'
        },
        {
            title: 'Approvals Queue',
            description: 'Review and approve high-stakes decisions made by AI.',
            icon: ClipboardCheck,
            route: '/ai/workforce/approvals',
            color: 'text-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-900/20'
        },
        {
            title: 'Work History',
            description: 'Detailed audit trail of every action performed by the workforce.',
            icon: History,
            route: '/ai/workforce/history',
            color: 'text-slate-600',
            bg: 'bg-slate-50 dark:bg-slate-900/20'
        },
        {
            title: 'Performance & KPIs',
            description: 'Analyze ROI, token usage, and task success rates.',
            icon: BarChart3,
            route: '/ai/workforce/analytics',
            color: 'text-green-600',
            bg: 'bg-green-50 dark:bg-green-900/20'
        },
        {
            title: 'Workforce Automation',
            description: 'Create multi-step workflows for your digital employees.',
            icon: Zap,
            route: '/ai/workforce/workflows',
            color: 'text-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-900/20'
        }
    ];

    return (
        <div className="space-y-4 animate-in fade-in duration-700">
            <Breadcrumb items={[{ label: 'AI', href: '/ai/console' }, { label: 'Workforce Hub' }]} />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">AI Workforce Hub</h1>
                    <p className="text-muted-foreground">Transforming agents into autonomous digital employees</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => navigate('/ai/workforce/employees')} className="shadow-sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Hire AI Employee
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className={`p-2 rounded-lg ${stat.bg}`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                                {stat.title === 'Pending Approvals' && Number(stat.value) > 0 && (
                                    <Badge variant="destructive" className="animate-pulse">Action Required</Badge>
                                )}
                            </div>
                            <div className="mt-4">
                                <p className="text-2xl font-bold">{stat.value}</p>
                                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section, i) => (
                    <Card
                        key={i}
                        className="group hover:shadow-md transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-primary"
                        onClick={() => navigate(section.route)}
                    >
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className={`p-3 rounded-xl ${section.bg}`}>
                                <section.icon className={`h-6 w-6 ${section.color}`} />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-xl">{section.title}</CardTitle>
                                <CardDescription>{section.description}</CardDescription>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </CardHeader>
                    </Card>
                ))}
            </div>

            {/* Bottom Section: Recent Activity & Top Employees */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity Feed */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Workforce Activity</CardTitle>
                                <CardDescription>Live log of AI operations</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/ai/workforce/history')}>
                                View All
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {history.length === 0 ? (
                            <div className="text-center py-8">
                                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                <p className="text-muted-foreground">No recent activity detected.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {history.map((action, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="mt-1">
                                            {action.outcome === 'success' ? (
                                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                            ) : action.outcome === 'pending_approval' ? (
                                                <div className="h-2 w-2 rounded-full bg-amber-500 animate-slow-pulse" />
                                            ) : (
                                                <div className="h-2 w-2 rounded-full bg-red-500" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <p className="text-sm font-medium">
                                                    <span className="font-bold">{action.agent_name}</span> {action.action_type.replace(/_/g, ' ')}
                                                </p>
                                                <span className="text-xs text-muted-foreground">{new Date(action.created_at).toLocaleTimeString()}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Module: {action.module} • Entity: {action.entity_type} #{action.entity_id}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Performing AI Employees */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Employees</CardTitle>
                        <CardDescription>By task completion</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {employees.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                <p className="text-muted-foreground">Hire your first AI employee.</p>
                                <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/ai/workforce/employees')}>
                                    Get Started
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {employees.slice(0, 5).map((emp, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {emp.role.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{emp.agent_name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{emp.role}</p>
                                        </div>
                                        <Badge variant="outline" className="ml-auto">
                                            Active
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AIWorkforceHub;
