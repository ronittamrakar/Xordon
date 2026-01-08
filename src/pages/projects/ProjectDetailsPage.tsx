import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft,
    Calendar,
    Users,
    Settings,
    MoreVertical,
    Plus,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { KanbanBoard } from '@/components/projects/KanbanBoard';
import { TasksList } from '@/components/projects/TasksList';
import { TasksTable } from '@/components/projects/TasksTable';
import { TasksTimeline } from '@/components/projects/TasksTimeline';

import { CreateTaskDialog } from '@/components/projects/CreateTaskDialog';
import { TaskDetailsDialog } from '@/components/projects/TaskDetailsDialog';

interface Project {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    start_date: string;
    due_date: string;
    progress_percentage: number;
    task_count: number;
    completed_tasks: number;
    color: string;
    members?: any[];
}

const ProjectDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('board');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [taskDetailsOpen, setTaskDetailsOpen] = useState(false);

    const loadProject = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const [projectData, tasksData] = await Promise.all([
                (api as any).projects.getOne(Number(id)),
                (api as any).projects.getTasks(Number(id)),
            ]);

            setProject(projectData);
            setTasks(tasksData.items || []);
        } catch (error) {
            console.error('Failed to load project:', error);
            toast.error('Failed to load project');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProject();
    }, [id]);

    const handleTaskUpdate = async () => {
        if (!id) return;
        const tasksData = await (api as any).projects.getTasks(Number(id));
        setTasks(tasksData.items || []);

        // Reload project to update progress
        const projectData = await (api as any).projects.getOne(Number(id));
        setProject(projectData);
    };

    const handleCreateSuccess = () => {
        handleTaskUpdate();
        setCreateDialogOpen(false);
    };

    const handleTaskClick = (task: any) => {
        setSelectedTask(task);
        setTaskDetailsOpen(true);
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center py-12 text-muted-foreground">
                    Loading project...
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="p-6">
                <div className="text-center py-12 text-muted-foreground">
                    Project not found
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/projects')}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {project.title}
                        </h1>
                        <p className="text-muted-foreground">{project.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                        <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Project Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="secondary" className="capitalize">
                            {project.status.replace('_', ' ')}
                        </Badge>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{project.progress_percentage}%</div>
                        <p className="text-xs text-muted-foreground">
                            {project.completed_tasks} / {project.task_count} tasks
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Due Date</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                                {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'No due date'}
                            </span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Team</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{project.members?.length || 0} members</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="flex items-center justify-between">
                    <TabsList className="grid w-full grid-cols-4 md:w-auto">
                        <TabsTrigger value="board">Kanban</TabsTrigger>
                        <TabsTrigger value="list">List</TabsTrigger>
                        <TabsTrigger value="table">Table</TabsTrigger>
                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    </TabsList>
                    <div className="hidden md:block">
                        <Button onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Task
                        </Button>
                    </div>
                </div>

                <TabsContent value="board" className="mt-6">
                    <KanbanBoard
                        projectId={Number(id)}
                        tasks={tasks}
                        onTaskUpdate={handleTaskUpdate}
                        onTaskClick={handleTaskClick}
                    />
                </TabsContent>

                <TabsContent value="list" className="mt-6">
                    <TasksList
                        tasks={tasks}
                        onTaskUpdate={handleTaskUpdate}
                        onTaskClick={handleTaskClick}
                    />
                </TabsContent>

                <TabsContent value="table" className="mt-6">
                    <TasksTable
                        tasks={tasks}
                        onTaskUpdate={handleTaskUpdate}
                        onTaskClick={handleTaskClick}
                    />
                </TabsContent>

                <TabsContent value="timeline" className="mt-6">
                    <TasksTimeline
                        tasks={tasks}
                    />
                </TabsContent>
            </Tabs>

            <CreateTaskDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                projectId={Number(id)}
                onSuccess={handleCreateSuccess}
            />

            <TaskDetailsDialog
                open={taskDetailsOpen}
                onOpenChange={setTaskDetailsOpen}
                task={selectedTask}
                onUpdate={handleTaskUpdate}
            />
        </div>
    );
};

export default ProjectDetailsPage;
