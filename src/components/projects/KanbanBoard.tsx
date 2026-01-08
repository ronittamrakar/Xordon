import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    User,
    MoreVertical,
    AlertCircle,
    Clock,
    CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Task {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date: string;
    assigned_to_name?: string;
    tags?: string[];
}

interface KanbanBoardProps {
    projectId: number;
    tasks: Task[];
    onTaskUpdate: () => void;
}

const columns = [
    { id: 'pending', title: 'To Do', color: 'bg-slate-100 dark:bg-slate-800' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/30' },
    { id: 'completed', title: 'Done', color: 'bg-green-100 dark:bg-green-900/30' },
];

export const KanbanBoard: React.FC<KanbanBoardProps & { onTaskClick?: (task: Task) => void }> = ({ projectId, tasks, onTaskUpdate, onTaskClick }) => {
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'low': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent':
            case 'high':
                return <AlertCircle className="h-3 w-3" />;
            case 'medium':
                return <Clock className="h-3 w-3" />;
            case 'low':
                return <CheckCircle2 className="h-3 w-3" />;
            default:
                return null;
        }
    };

    const handleDragStart = (task: Task) => {
        setDraggedTask(task);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (columnId: string) => {
        if (!draggedTask) return;

        try {
            await (api as any).tasks.update(Number(draggedTask.id), { status: columnId });
            toast.success('Task status updated');
            onTaskUpdate();
        } catch (error) {
            console.error('Failed to update task:', error);
            toast.error('Failed to update task');
        } finally {
            setDraggedTask(null);
        }
    };

    const getTasksByColumn = (columnId: string) => {
        return tasks.filter(task => task.status === columnId);
    };

    const isOverdue = (dueDate: string) => {
        return new Date(dueDate) < new Date();
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map((column) => {
                const columnTasks = getTasksByColumn(column.id);

                return (
                    <div
                        key={column.id}
                        className="flex flex-col gap-4"
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(column.id)}
                    >
                        {/* Column Header */}
                        <div className={cn("rounded-lg p-4", column.color)}>
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">{column.title}</h3>
                                <Badge variant="secondary" className="bg-white/50 dark:bg-black/20">
                                    {columnTasks.length}
                                </Badge>
                            </div>
                        </div>

                        {/* Tasks */}
                        <div className="space-y-3 min-h-[400px]">
                            {columnTasks.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    No tasks
                                </div>
                            ) : (
                                columnTasks.map((task) => (
                                    <Card
                                        key={task.id}
                                        onClick={() => onTaskClick?.(task)}
                                        draggable
                                        onDragStart={() => handleDragStart(task)}
                                        className="cursor-move hover:shadow-lg transition-all border-l-4"
                                        style={{ borderLeftColor: task.priority === 'urgent' ? '#ef4444' : task.priority === 'high' ? '#f97316' : '#3b82f6' }}
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <CardTitle className="text-sm font-semibold line-clamp-2">
                                                    {task.title}
                                                </CardTitle>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                                                    <MoreVertical className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            {task.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                    {task.description}
                                                </p>
                                            )}
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {/* Tags */}
                                            {task.tags && task.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {task.tags.map((tag, index) => (
                                                        <Badge key={index} variant="outline" className="text-xs">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Meta Info */}
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn("text-xs flex items-center gap-1", getPriorityColor(task.priority))}
                                                    >
                                                        {getPriorityIcon(task.priority)}
                                                        {task.priority}
                                                    </Badge>

                                                    {/* Subtasks Count */}
                                                    {(task as any).subtasks && (task as any).subtasks.length > 0 && (
                                                        <div className="flex items-center gap-1 text-muted-foreground" title="Subtasks">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            <span>
                                                                {(task as any).subtasks.filter((st: any) => st.completed).length}
                                                                /
                                                                {(task as any).subtasks.length}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {task.due_date && (
                                                    <div className={cn(
                                                        "flex items-center gap-1",
                                                        isOverdue(task.due_date) && task.status !== 'completed' ? "text-red-600 font-semibold" : "text-muted-foreground"
                                                    )}>
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Assignee */}
                                            {task.assigned_to_name && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                                                    <User className="h-3 w-3" />
                                                    <span>{task.assigned_to_name}</span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
