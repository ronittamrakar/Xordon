import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, addDays, startOfToday, differenceInDays, isSameDay } from 'date-fns';

interface Task {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    start_date?: string;
    due_date: string;
    assigned_to_name?: string;
}

interface TasksTimelineProps {
    tasks: Task[];
}

export const TasksTimeline: React.FC<TasksTimelineProps> = ({ tasks }) => {
    const today = startOfToday();
    const daysToShow = 30;
    const timelineDays = useMemo(() => {
        return Array.from({ length: daysToShow }, (_, i) => addDays(today, i - 5));
    }, [today]);

    const cellWidth = 40;
    const rowHeight = 60;
    const headerHeight = 50;

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-yellow-500';
            case 'low': return 'bg-blue-500';
            default: return 'bg-slate-400';
        }
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Timeline
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">Today</Button>
                        <div className="flex items-center border rounded-md">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-r-none"><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-none"><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <div className="min-w-max relative" style={{ width: timelineDays.length * cellWidth + 250 }}>
                        {/* Header */}
                        <div className="flex sticky top-0 bg-white dark:bg-slate-950 z-20 border-b shadow-sm" style={{ height: headerHeight }}>
                            <div className="w-[250px] flex-shrink-0 border-r p-4 font-bold text-sm text-muted-foreground uppercase tracking-wider">
                                Task
                            </div>
                            <div className="flex flex-1">
                                {timelineDays.map((day, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex-shrink-0 border-r flex flex-col items-center justify-center text-[12px]",
                                            isSameDay(day, today) && "bg-primary/10"
                                        )}
                                        style={{ width: cellWidth }}
                                    >
                                        <span className="font-medium">{format(day, 'EEE')}</span>
                                        <span className="font-bold">{format(day, 'd')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="relative">
                            {tasks.map((task, rowIndex) => {
                                const startDate = task.start_date ? new Date(task.start_date) : new Date(task.due_date);
                                const dueDate = new Date(task.due_date);

                                // Calculate position
                                const startDiff = differenceInDays(startDate, timelineDays[0]);
                                const duration = Math.max(1, differenceInDays(dueDate, startDate) + 1);

                                const left = 250 + startDiff * cellWidth;
                                const width = duration * cellWidth;

                                return (
                                    <div
                                        key={task.id}
                                        className="flex hover:bg-muted/30 transition-colors group"
                                        style={{ height: rowHeight }}
                                    >
                                        <div className="w-[250px] flex-shrink-0 border-r p-3 overflow-hidden flex flex-col justify-center">
                                            <div className="font-medium text-sm truncate">{task.title}</div>
                                            <div className="text-[12px] text-muted-foreground flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {task.assigned_to_name || 'Unassigned'}
                                            </div>
                                        </div>
                                        <div className="flex-1 relative bg-grid-slate-200/50 dark:bg-grid-slate-800/10">
                                            {/* Task Bar */}
                                            <div
                                                className={cn(
                                                    "absolute top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-white text-[12px] font-bold shadow-sm flex items-center h-8 cursor-pointer hover:scale-[1.02] transition-transform z-10",
                                                    getPriorityColor(task.priority)
                                                )}
                                                style={{ left: startDiff * cellWidth + 5, width: width - 10 }}
                                                title={`${task.title} (${task.priority})`}
                                            >
                                                <span className="truncate">{task.title}</span>
                                            </div>

                                            {/* Background Grid Lines */}
                                            {timelineDays.map((_, i) => (
                                                <div key={i} className="absolute top-0 bottom-0 border-r border-slate-200/40 dark:border-slate-800" style={{ left: i * cellWidth, width: cellWidth }} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Today Marker */}
                            <div
                                className="absolute top-0 bottom-0 w-px bg-primary z-10 before:content-[''] before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-2 before:h-2 before:bg-primary before:rotate-45"
                                style={{ left: 250 + differenceInDays(today, timelineDays[0]) * cellWidth + cellWidth / 2 }}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
