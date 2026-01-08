import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Calendar, User, MoreVertical } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Task {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    due_date: string;
    assigned_to_name?: string;
}

interface TasksListProps {
    tasks: Task[];
    onTaskUpdate: () => void;
}

export const TasksList: React.FC<TasksListProps & { onTaskClick?: (task: Task) => void }> = ({ tasks, onTaskUpdate, onTaskClick }) => {
    const handleToggleComplete = async (e: React.MouseEvent, task: Task) => {
        e.stopPropagation(); // Prevent opening task details
        try {
            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
            await (api as any).tasks.update(Number(task.id), { status: newStatus });
            toast.success(`Task marked as ${newStatus === 'completed' ? 'complete' : 'incomplete'}`);
            onTaskUpdate();
        } catch (error) {
            console.error('Failed to update task:', error);
            toast.error('Failed to update task');
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'low': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Sort tasks: pending first, then completed
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        return 0;
    });

    if (tasks.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6 text-center py-10 text-muted-foreground">
                    No tasks found. Click "Add Task" to create one.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {sortedTasks.map((task) => (
                <div
                    key={task.id}
                    onClick={() => onTaskClick?.(task)}
                    className="group flex items-center justify-between p-4 bg-white dark:bg-slate-950 border rounded-lg hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
                >
                    <div className="flex items-center gap-4 flex-1">
                        <Checkbox
                            checked={task.status === 'completed'}
                            onClick={(e) => handleToggleComplete(e, task)}
                            className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={cn(
                                    "font-medium truncate",
                                    task.status === 'completed' && "line-through text-muted-foreground"
                                )}>
                                    {task.title}
                                </span>
                                <Badge variant="secondary" className={cn("text-[12px] px-1.5 py-0 h-5", getPriorityColor(task.priority))}>
                                    {task.priority}
                                </Badge>
                                {task.due_date && (
                                    <span className={cn(
                                        "text-xs flex items-center gap-1",
                                        new Date(task.due_date) < new Date() && task.status !== 'completed' ? "text-red-500" : "text-muted-foreground"
                                    )}>
                                        <Calendar className="h-3 w-3" />
                                        {new Date(task.due_date).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                                {task.description || "No description"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pl-4 border-l ml-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {task.assigned_to_name ? (
                                <div className="flex items-center gap-2" title={`Assigned to ${task.assigned_to_name}`}>
                                    <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[12px] font-bold">
                                        {task.assigned_to_name.charAt(0)}
                                    </div>
                                    <span className="hidden md:inline max-w-[100px] truncate">{task.assigned_to_name}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 opacity-50">
                                    <User className="h-4 w-4" />
                                    <span className="text-xs">Unassigned</span>
                                </div>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};
