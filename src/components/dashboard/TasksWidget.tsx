import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Task {
    id: string;
    title: string;
    type?: 'lead' | 'deal' | 'support' | 'follow_up' | 'other';
    priority?: 'high' | 'medium' | 'low';
    dueDate: string;
    assignee?: string;
    relatedTo?: string;
}

interface TasksWidgetProps {
    tasks: Task[];
    className?: string;
}

const priorityConfig = {
    high: { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertCircle },
    medium: { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock },
    low: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: CheckCircle2 },
};

const typeConfig = {
    lead: { label: 'New Lead', color: 'bg-purple-500/10 text-purple-500' },
    deal: { label: 'Deal', color: 'bg-emerald-500/10 text-emerald-500' },
    support: { label: 'Support', color: 'bg-blue-500/10 text-blue-500' },
    follow_up: { label: 'Follow Up', color: 'bg-amber-500/10 text-amber-500' },
    other: { label: 'Task', color: 'bg-slate-500/10 text-slate-500' },
};

export const TasksWidget: React.FC<TasksWidgetProps> = ({ tasks, className }) => {
    const navigate = useNavigate();

    const isOverdue = (dueDate: string) => {
        return new Date(dueDate) < new Date();
    };

    const formatDueDate = (dueDate: string) => {
        const date = new Date(dueDate);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <Card className={cn("bg-background/50 backdrop-blur-md border-none shadow-xl", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        Today's Tasks
                    </CardTitle>
                    <CardDescription>{tasks.length} pending items</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/crm/tasks')}>
                    View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-3">
                {tasks.length > 0 ? tasks.slice(0, 5).map((task) => {
                    const priority = task.priority || 'medium';
                    const type = task.type || 'follow_up';
                    const priorityInfo = priorityConfig[priority] || priorityConfig.medium;
                    const typeInfo = typeConfig[type] || typeConfig.follow_up;
                    const PriorityIcon = priorityInfo.icon;
                    const overdue = isOverdue(task.dueDate);

                    return (
                        <div
                            key={task.id}
                            className="flex items-start gap-3 p-3 rounded-xl bg-muted/10 border border-border/30 hover:border-primary/30 transition-all group cursor-pointer"
                            onClick={() => navigate('/crm/tasks')}
                        >
                            <div className={cn(
                                "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
                                priorityInfo.color
                            )}>
                                <PriorityIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                                        {task.title}
                                    </p>
                                    <Badge variant="outline" className={cn("text-[12px] px-1.5 py-0 flex-shrink-0", typeInfo.color)}>
                                        {typeInfo.label}
                                    </Badge>
                                </div>
                                {task.relatedTo && (
                                    <p className="text-xs text-muted-foreground mb-1 truncate">
                                        Related: {task.relatedTo}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 text-[12px]">
                                    <span className={cn(
                                        "font-bold uppercase tracking-wider",
                                        overdue ? "text-red-500" : "text-muted-foreground"
                                    )}>
                                        {overdue ? '⚠ Overdue' : formatDueDate(task.dueDate)}
                                    </span>
                                    {task.assignee && (
                                        <>
                                            <span className="text-muted-foreground/50">•</span>
                                            <span className="text-muted-foreground">{task.assignee}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">All caught up!</p>
                        <p className="text-xs opacity-60">No pending tasks for today.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
