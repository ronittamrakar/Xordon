import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle2, Clock, Calendar, AlertCircle,
    Search, Filter, Kanban, List, LayoutGrid,
    MoreHorizontal, ArrowUpRight
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SEO from '@/components/SEO';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const MyTasksPage: React.FC = () => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [searchQuery, setSearchQuery] = useState('');

    const loadTasks = async () => {
        try {
            setLoading(true);
            const response = await (api as any).tasks.getAll();
            setTasks(response.items || []);
        } catch (error) {
            console.error('Failed to load tasks:', error);
            toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadTasks();
    }, []);

    const filteredTasks = tasks.filter(t =>
        (t.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (t.project_title?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'urgent': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'medium': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'low': return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const toggleTaskComplete = async (id: number, currentStatus: string) => {
        try {
            if (currentStatus === 'completed') {
                await api.tasks.update(id, { status: 'pending' });
                toast.success('Task marked as pending');
            } else {
                await api.tasks.complete(id);
                toast.success('Task completed!');
            }
            loadTasks();
        } catch (error) {
            console.error('Failed to update task:', error);
            toast.error('Failed to update task');
        }
    };

    const handleDeleteTask = async (id: number) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
            await api.tasks.delete(id);
            toast.success('Task deleted');
            loadTasks();
        } catch (error) {
            console.error('Failed to delete task:', error);
            toast.error('Failed to delete task');
        }
    };

    const renderTaskCard = (task: any) => (
        <Card key={task.id} className="group hover:shadow-md transition-all border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className={`h-1.5 w-full ${task.priority === 'urgent' ? 'bg-red-500' : task.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <Badge variant="outline" className="text-[12px] uppercase font-bold tracking-tight mb-2 text-primary">
                        {task.project_title || 'No Project'}
                    </Badge>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit Task</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleTaskComplete(task.id, task.status)}>
                                {task.status === 'completed' ? 'Mark Pending' : 'Mark Complete'}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteTask(task.id)}>
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <CardTitle className="text-base leading-snug group-hover:text-blue-600 transition-colors cursor-pointer">
                    {task.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}</span>
                    </div>
                    {task.effort && (
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{task.effort}</span>
                        </div>
                    )}
                </div>
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[12px] font-bold uppercase text-muted-foreground">
                        <span>Progress</span>
                        <span>{task.progress_percentage || 0}%</span>
                    </div>
                    <Progress value={task.progress_percentage || 0} className="h-1" />
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="p-6 space-y-8 bg-slate-50/30 dark:bg-slate-950/30 min-h-screen">
            <SEO title="My Tasks" description="Manage your cross-project task portfolio in one unified view." />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">My Tasks</h1>
                    <p className="text-muted-foreground text-lg">Your personal task backlog across all active projects</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-800' : ''}>
                        <List className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-800' : ''}>
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search tasks or projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="gap-2" onClick={() => loadTasks()}>
                                <Filter className="h-4 w-4" />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="bg-white dark:bg-slate-900 border self-start mb-6">
                    <TabsTrigger value="all">Total ({filteredTasks.length})</TabsTrigger>
                    <TabsTrigger value="pending">To Do</TabsTrigger>
                    <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>

                {loading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading tasks...</p>
                    </div>
                ) : (
                    ['all', 'pending', 'in_progress', 'completed'].map((status) => (
                        <TabsContent key={status} value={status}>
                            {(() => {
                                const statusTasks = status === 'all'
                                    ? filteredTasks
                                    : filteredTasks.filter(t => t.status === status);

                                if (statusTasks.length === 0) {
                                    return (
                                        <div className="py-20 text-center border-2 border-dashed rounded-xl">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full w-fit mx-auto mb-4">
                                                <CheckCircle2 className="h-6 w-6 text-slate-300" />
                                            </div>
                                            <p className="text-muted-foreground font-medium">No tasks found in this category</p>
                                        </div>
                                    );
                                }

                                return viewMode === 'grid' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {statusTasks.map(renderTaskCard)}
                                    </div>
                                ) : (
                                    <Card className="border-none shadow-md ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {statusTasks.map((task) => (
                                                <div key={task.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div className="flex-shrink-0">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => toggleTaskComplete(task.id, task.status)}
                                                                className={`h-6 w-6 rounded-full border-2 ${task.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'hover:border-emerald-500'}`}
                                                            >
                                                                {task.status === 'completed' && <CheckCircle2 className="h-4 w-4" />}
                                                            </Button>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className={`font-semibold truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                                                    {task.title}
                                                                </h3>
                                                                <Badge className={getPriorityColor(task.priority)}>
                                                                    {task.priority}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                                                <span className="font-medium text-slate-600 dark:text-slate-400">{task.project_title}</span>
                                                                <span>•</span>
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="hidden md:block w-32">
                                                            <Progress value={task.progress_percentage || 0} className="h-1.5" />
                                                        </div>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem>Edit Task</DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => toggleTaskComplete(task.id, task.status)}>
                                                                    {task.status === 'completed' ? 'Mark Pending' : 'Mark Complete'}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteTask(task.id)}>
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                );
                            })()}
                        </TabsContent>
                    ))
                )}
            </Tabs>
        </div>
    );
};

export default MyTasksPage;
