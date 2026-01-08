import React from 'react';
import {
    BarChart3, TrendingUp, Zap, Clock,
    ArrowUpRight, ArrowDownRight, PieChart,
    Calendar, Download, Filter
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAiPerformanceMetrics } from '@/hooks/useAiWorkforce';

import { Breadcrumb } from '@/components/Breadcrumb';

const WorkforceAnalytics: React.FC = () => {
    const { data: metrics = [] } = useAiPerformanceMetrics();

    const totalTasks = metrics.reduce((acc, m) => acc + (Number(m.tasks_completed) || 0), 0);
    const successCount = metrics.reduce((acc, m) => acc + (Number(m.tasks_completed) || 0), 0);
    const failureCount = metrics.reduce((acc, m) => acc + (Number(m.tasks_failed) || 0), 0);
    const successRate = totalTasks > 0 ? (successCount / (totalTasks + failureCount) * 100).toFixed(1) : '0';
    const totalEfficiency = metrics.length > 0
        ? Math.round(metrics.reduce((acc, m) => acc + (Number(m.efficiency_score) || 0), 0) / metrics.length)
        : 0;

    const stats = [
        { label: 'Total Tasks', value: totalTasks.toLocaleString(), change: '+12.5%', trend: 'up' },
        { label: 'Success Rate', value: `${successRate}%`, change: '+0.5%', trend: 'up' },
        { label: 'Efficiency Gain', value: `+${totalEfficiency}%`, change: '+45%', trend: 'up' },
        { label: 'Avg. Response Time', value: '1.2s', change: '-0.3s', trend: 'down' },
    ];

    return (
        <div className="space-y-4 animate-in fade-in duration-700">
            <Breadcrumb items={[{ label: 'AI', href: '/ai/console' }, { label: 'Workforce', href: '/ai/workforce' }, { label: 'Analytics' }]} />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">Workforce Analytics</h1>
                    <p className="text-muted-foreground">Measure the ROI and performance of your AI employees</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        Last 30 Days
                    </Button>
                    <Button>
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                            <div className="flex items-baseline justify-between mt-2">
                                <h3 className="text-2xl font-bold">{stat.value}</h3>
                                <div className={`flex items-center text-xs font-bold ${stat.trend === 'up' ? 'text-green-600' : 'text-blue-600'}`}>
                                    {stat.trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                    {stat.change}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="min-h-[400px]">
                    <CardHeader>
                        <CardTitle>Task Completion Volume</CardTitle>
                        <CardDescription>Daily breakdown of successful vs failed tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[300px]">
                        <div className="text-center">
                            <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-10" />
                            <p className="text-muted-foreground italic">Interactive chart will render here with real execution data.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="min-h-[400px]">
                    <CardHeader>
                        <CardTitle>Resource Efficiency</CardTitle>
                        <CardDescription>Token usage and cost analysis per department</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[300px]">
                        <div className="text-center">
                            <PieChart className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-10" />
                            <p className="text-muted-foreground italic">Cost analysis visualization will render here.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Department Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Departmental Performance</CardTitle>
                    <CardDescription>ROI analysis across your business units</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {['Sales', 'Marketing', 'Customer Support', 'Operations'].map((dept, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-semibold">{dept}</span>
                                    <span className="text-muted-foreground">9{8 - i}% Success Rate</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-1000"
                                        style={{ width: `${98 - i * 2}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>{400 - i * 50} tasks performed</span>
                                    <span>~{80 - i * 10}h human time saved</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default WorkforceAnalytics;
