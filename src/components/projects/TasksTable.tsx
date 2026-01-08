import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Calendar, User, MoreVertical, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Task {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    due_date: string;
    assigned_to_name?: string;
    tags?: string[];
}

interface TasksTableProps {
    tasks: Task[];
    onTaskUpdate: () => void;
}

export const TasksTable: React.FC<TasksTableProps & { onTaskClick?: (task: Task) => void }> = ({ tasks, onTaskUpdate, onTaskClick }) => {
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'low': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'pending': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search tasks..." className="pl-9" />
                </div>
                <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                </Button>
            </div>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Assignee</TableHead>
                                <TableHead>Tags</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                        No tasks found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tasks.map((task) => (
                                    <TableRow
                                        key={task.id}
                                        className="hover:bg-muted/50 cursor-pointer"
                                        onClick={() => onTaskClick?.(task)}
                                    >
                                        <TableCell className="pl-6">
                                            <div className="font-medium">{task.title}</div>
                                            <div className="text-xs text-muted-foreground line-clamp-1">{task.description}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={getStatusColor(task.status)}>
                                                {task.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                                                {task.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {task.due_date && (
                                                <div className="flex items-center gap-2 text-sm whitespace-nowrap">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {new Date(task.due_date).toLocaleDateString()}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[12px] font-bold">
                                                    {task.assigned_to_name ? task.assigned_to_name.charAt(0) : <User className="h-3 w-3" />}
                                                </div>
                                                <span className="text-sm whitespace-nowrap">{task.assigned_to_name || 'Unassigned'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                {task.tags?.map((tag, i) => (
                                                    <Badge key={i} variant="outline" className="text-[12px] px-1 py-0 h-4">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
