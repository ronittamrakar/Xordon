import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Plus,
    Search,
    Filter,
    FolderKanban,
    Calendar,
    Users,
    CheckCircle2,
    Clock,
    AlertCircle,
    LayoutGrid,
    List as ListIcon,
    Table as TableIcon,
    Folder,
    FolderPlus,
    ChevronDown,
    ChevronRight,
    MoreHorizontal
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate, useLocation } from 'react-router-dom';
import { api, Folder as FolderType } from '@/lib/api';
import { toast } from 'sonner';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Project {
    id: string;
    title: string;
    description: string;
    status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    start_date: string;
    due_date: string;
    progress_percentage: number;
    task_count: number;
    completed_tasks: number;
    member_count: number;
    color: string;
    folder_id?: string;
    settings?: any;
    members?: any[];
}

const ProjectsPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [projects, setProjects] = useState<Project[]>([]);
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

    // State for initial project values from navigation (e.g., from Pipeline)
    const [initialProjectTitle, setInitialProjectTitle] = useState('');
    const [initialProjectDescription, setInitialProjectDescription] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const statusFilters = statusFilter !== 'all' ? { status: statusFilter } : undefined;

            const [projectsRes, foldersRes] = await Promise.all([
                api.projects.getAll(statusFilters),
                api.folders.getAll()
            ]);

            const mappedProjects = (projectsRes.items || []).map((p: any) => ({
                ...p,
                folder_id: p.settings?.folder_id || null // Map folder_id from settings
            }));

            setProjects(mappedProjects);
            setFolders(foldersRes || []);

            // Expand all folders by default
            const initialExpanded: Record<string, boolean> = {};
            (foldersRes || []).forEach(f => initialExpanded[f.id] = true);
            setExpandedFolders(initialExpanded);

        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [statusFilter]);

    // Handle navigation state from Pipeline or other pages
    useEffect(() => {
        const state = location.state as { fromLead?: boolean; title?: string; description?: string; contactId?: string } | null;
        // Accept fromLead OR just having a title (e.g. from Conversations)
        if (state?.fromLead || state?.title) {
            setInitialProjectTitle(state.title || '');
            setInitialProjectDescription(state.description || '');
            setShowCreateDialog(true);
            // Clear the state to prevent re-opening on navigation
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.state]);

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            await api.folders.create({ name: newFolderName });
            toast.success('Folder created');
            setNewFolderName('');
            setShowCreateFolderDialog(false);
            loadData();
        } catch (error) {
            toast.error('Failed to create folder');
        }
    };

    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'planning': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'on_hold': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'completed': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
            case 'archived': return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent': return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'high': return <AlertCircle className="h-4 w-4 text-orange-500" />;
            case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'low': return <Clock className="h-4 w-4 text-blue-500" />;
            default: return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const filteredProjects = projects.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group projects by folder
    const groupedProjects = React.useMemo(() => {
        const groups: Record<string, Project[]> = {
            'uncategorized': []
        };

        folders.forEach(folder => {
            groups[folder.id] = [];
        });

        filteredProjects.forEach(project => {
            if (project.folder_id && groups[project.folder_id]) {
                groups[project.folder_id].push(project);
            } else {
                groups['uncategorized'].push(project);
            }
        });

        return groups;
    }, [filteredProjects, folders]);

    const stats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        onHold: projects.filter(p => p.status === 'on_hold').length,
    };

    const renderProjectCard = (project: Project) => (
        <Card
            key={project.id}
            className="hover:shadow-lg transition-all cursor-pointer border-l-4 group"
            style={{ borderLeftColor: project.color }}
            onClick={() => navigate(`/projects/${project.id}`)}
        >
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {project.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {project.description}
                        </p>
                    </div>
                    {getPriorityIcon(project.priority)}
                </div>
                <div className="flex items-center gap-2 mt-3">
                    <Badge variant="secondary" className={getStatusColor(project.status)}>
                        {project.status.replace('_', ' ')}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{project.progress_percentage}%</span>
                    </div>
                    <Progress value={project.progress_percentage} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{project.completed_tasks} / {project.task_count} tasks</span>
                    </div>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{project.due_date ? new Date(project.due_date).toLocaleDateString() : 'No due date'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{project.member_count}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const renderProjectListItem = (project: Project) => (
        <div
            key={project.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border rounded-lg hover:shadow-md transition-all cursor-pointer group"
            onClick={() => navigate(`/projects/${project.id}`)}
        >
            <div className="flex items-center gap-4 flex-1">
                <div className="w-2 h-12 rounded-full" style={{ backgroundColor: project.color }}></div>
                <div>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{project.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                    <Badge variant="secondary" className={getStatusColor(project.status)}>
                        {project.status.replace('_', ' ')}
                    </Badge>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        {getPriorityIcon(project.priority)}
                        <span className="capitalize">{project.priority}</span>
                    </div>
                </div>
                <div className="w-32 hidden md:block">
                    <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{project.progress_percentage}%</span>
                    </div>
                    <Progress value={project.progress_percentage} className="h-1.5" />
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span className="hidden sm:inline">{project.due_date ? new Date(project.due_date).toLocaleDateString() : '-'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{project.member_count}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderProjectTableRow = (project: Project) => (
        <TableRow
            key={project.id}
            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
            onClick={() => navigate(`/projects/${project.id}`)}
        >
            <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-8 rounded-full" style={{ backgroundColor: project.color }}></div>
                    {project.title}
                </div>
            </TableCell>
            <TableCell>
                <Badge variant="secondary" className={getStatusColor(project.status)}>
                    {project.status.replace('_', ' ')}
                </Badge>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1">
                    {getPriorityIcon(project.priority)}
                    <span className="capitalize">{project.priority}</span>
                </div>
            </TableCell>
            <TableCell>
                <div className="w-[100px]">
                    <Progress value={project.progress_percentage} className="h-2" />
                    <span className="text-xs text-muted-foreground">{project.progress_percentage}%</span>
                </div>
            </TableCell>
            <TableCell>{project.due_date ? new Date(project.due_date).toLocaleDateString() : '-'}</TableCell>
            <TableCell>
                <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{project.member_count}</span>
                </div>
            </TableCell>
            <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); /* Add menu/actions here */ }}>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    );

    const renderContent = () => {
        if (loading) {
            return (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                    Loading projects...
                </div>
            );
        }

        if (filteredProjects.length === 0) {
            return (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                    <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No projects found</p>
                    <p className="text-sm">Create your first project to get started</p>
                </div>
            );
        }

        // Render grouped content
        return (
            <div className="space-y-8">
                {Object.entries(groupedProjects).map(([folderId, folderProjects]) => {
                    if (folderProjects.length === 0) return null;

                    const folder = folders.find(f => f.id === folderId);
                    const isUncategorized = folderId === 'uncategorized';
                    const isExpanded = expandedFolders[folderId] ?? true;

                    if (isUncategorized && folderProjects.length === 0) return null;

                    return (
                        <div key={folderId} className="space-y-4">
                            {!isUncategorized && (
                                <div
                                    className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => toggleFolder(folderId)}
                                >
                                    {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                    <Folder className="h-5 w-5 text-blue-500" />
                                    <h2 className="text-xl font-semibold">{folder?.name}</h2>
                                    <Badge variant="outline" className="ml-2">{folderProjects.length}</Badge>
                                </div>
                            )}

                            {(isExpanded || isUncategorized) && (
                                <div className={isUncategorized ? '' : 'pl-6 border-l-2 border-slate-100 dark:border-slate-800 ml-2'}>
                                    {viewMode === 'grid' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {folderProjects.map(renderProjectCard)}
                                        </div>
                                    )}
                                    {viewMode === 'list' && (
                                        <div className="space-y-3">
                                            {folderProjects.map(renderProjectListItem)}
                                        </div>
                                    )}
                                    {viewMode === 'table' && (
                                        <div className="border rounded-md">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Project</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Priority</TableHead>
                                                        <TableHead>Progress</TableHead>
                                                        <TableHead>Due Date</TableHead>
                                                        <TableHead>Members</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {folderProjects.map(renderProjectTableRow)}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Projects</h1>
                    <p className="text-muted-foreground text-lg">Manage and track your project portfolio</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <FolderPlus className="h-5 w-5 mr-2" />
                                New Folder
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Folder</DialogTitle>
                                <DialogDescription>Organize your projects into folders.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Folder Name</Label>
                                    <Input
                                        id="name"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        placeholder="e.g. Marketing, Development"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowCreateFolderDialog(false)}>Cancel</Button>
                                <Button onClick={handleCreateFolder}>Create Folder</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button
                        size="lg"
                        className="shadow-lg shadow-blue-500/20"
                        onClick={() => setShowCreateDialog(true)}
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        New Project
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* ... Stats cards (simplified for brevity if needed, but keeping original style) ... */}
                {/* I will keep the original stats cards implementation */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider">Total Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400 uppercase tracking-wider">Active</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.active}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400 uppercase tracking-wider">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.completed}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400 uppercase tracking-wider">On Hold</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.onHold}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and View Toggles */}
            <Card className="border-slate-200 dark:border-slate-800">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                            <Button
                                variant={statusFilter === 'all' ? 'default' : 'outline'}
                                onClick={() => setStatusFilter('all')}
                                size="sm"
                            >
                                All
                            </Button>
                            <Button
                                variant={statusFilter === 'active' ? 'default' : 'outline'}
                                onClick={() => setStatusFilter('active')}
                                size="sm"
                            >
                                Active
                            </Button>
                            <Button
                                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                                onClick={() => setStatusFilter('completed')}
                                size="sm"
                            >
                                Completed
                            </Button>
                        </div>
                        <div className="border-l pl-4 flex gap-2">
                            <Button
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                size="icon"
                                onClick={() => setViewMode('grid')}
                                title="Grid View"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                size="icon"
                                onClick={() => setViewMode('list')}
                                title="List View"
                            >
                                <ListIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                                size="icon"
                                onClick={() => setViewMode('table')}
                                title="Table View"
                            >
                                <TableIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Content */}
            {renderContent()}

            {/* Create Project Dialog */}
            <CreateProjectDialog
                open={showCreateDialog}
                onOpenChange={(open) => {
                    setShowCreateDialog(open);
                    // Clear initial values when dialog is closed
                    if (!open) {
                        setInitialProjectTitle('');
                        setInitialProjectDescription('');
                    }
                }}
                onSuccess={() => {
                    loadData();
                    setShowCreateDialog(false);
                    setInitialProjectTitle('');
                    setInitialProjectDescription('');
                }}
                initialTitle={initialProjectTitle}
                initialDescription={initialProjectDescription}
            />
        </div>
    );
};

export default ProjectsPage;
