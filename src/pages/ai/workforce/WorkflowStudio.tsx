import React, { useState } from 'react';
import {
    Zap, Play, Plus, Trash2, Search, Filter,
    ChevronRight, Brain, Clock, Shield, AlertTriangle,
    Mail, MessageSquare, Phone, Users, Briefcase, FileText
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAiWorkflows, useCreateAiWorkflow, useDeleteAiWorkflow, useExecuteAiWorkflow, useAiEmployees } from '@/hooks/useAiWorkforce';

const WorkflowStudio: React.FC = () => {
    const { data: workflows = [], isLoading } = useAiWorkflows();
    const { data: employees = [] } = useAiEmployees();
    const createWorkflow = useCreateAiWorkflow();
    const deleteWorkflow = useDeleteAiWorkflow();
    const executeWorkflow = useExecuteAiWorkflow();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // New Workflow Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [workflowType, setWorkflowType] = useState('customer_acquisition');
    const [triggerType, setTriggerType] = useState('manual');

    const handleCreate = () => {
        if (!name) return;

        createWorkflow.mutate({
            name,
            description,
            workflow_type: workflowType,
            trigger_type: triggerType as any,
            steps: [
                {
                    id: 'step-1',
                    employee_id: employees[0]?.id || '1',
                    action: 'analyze_intent',
                    config: {},
                    requires_approval: false
                }
            ],
            status: 'active'
        }, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetForm();
            }
        });
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setWorkflowType('customer_acquisition');
        setTriggerType('manual');
    };

    const getWorkflowTypeIcon = (type: string) => {
        switch (type) {
            case 'customer_acquisition': return <Users className="h-4 w-4" />;
            case 'project_delivery': return <Briefcase className="h-4 w-4" />;
            case 'content_generation': return <FileText className="h-4 w-4" />;
            default: return <Zap className="h-4 w-4" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'customer_acquisition': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
            case 'project_delivery': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
            case 'content_generation': return 'text-pink-600 bg-pink-100 dark:bg-pink-900/30';
            default: return 'text-slate-600 bg-slate-100 dark:bg-slate-900/30';
        }
    };

    const filteredWorkflows = workflows.filter(wf =>
        wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wf.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-4 animate-in fade-in duration-700">
            <Breadcrumb items={[{ label: 'AI', href: '/ai/console' }, { label: 'Workforce', href: '/ai/workforce' }, { label: 'Workflow Automation' }]} />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">Workflow Automation</h1>
                    <p className="text-muted-foreground">Chain digital employees together to automate complex business processes</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Workflow
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search workflows..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Trigger Type
                </Button>
                <Button variant="outline">
                    <Brain className="h-4 w-4 mr-2" />
                    Active Only
                </Button>
            </div>

            {/* Workflow Recipes */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">Automation Recipes</h2>
                    <Button variant="link" size="sm">Explore Library <ChevronRight className="h-4 w-4 ml-1" /></Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { title: 'Auto-Onboard Customer', description: 'Triggers on new deal won. Creates project, sends welcome email, and assigns tasks.', icon: Users, color: 'text-blue-600' },
                        { title: 'Abandoned Cart Recovery', description: 'Follows up with leads who started a checkout but didn\'t finish.', icon: Zap, color: 'text-amber-600' },
                        { title: 'Meeting Prep Assistant', description: 'Analyzes CRM history and LinkedIn profiles before a scheduled call.', icon: Brain, color: 'text-purple-600' }
                    ].map((recipe, i) => (
                        <Card key={i} className="bg-muted/30 border-dashed hover:border-primary/50 transition-colors cursor-pointer group">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className={`p-2 rounded-lg bg-background border ${recipe.color}`}>
                                        <recipe.icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold group-hover:text-primary transition-colors">{recipe.title}</h3>
                                        <p className="text-xs text-muted-foreground mt-1">{recipe.description}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Workflow List */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Card key={i} className="h-64 animate-pulse bg-muted/20" />)}
                </div>
            ) : filteredWorkflows.length === 0 ? (
                <Card className="border-dashed py-20 text-center">
                    <Zap className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-10" />
                    <h3 className="text-lg font-semibold">No workflows found</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto mb-6">
                        Start by creating a workflow to combine multiple AI agents into a powerful automated workforce.
                    </p>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Workflow
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWorkflows.map((wf) => (
                        <Card key={wf.id} className="group hover:shadow-md transition-all flex flex-col">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`p-2 rounded-lg ${getTypeColor(wf.workflow_type)}`}>
                                        {getWorkflowTypeIcon(wf.workflow_type)}
                                    </div>
                                    <Badge variant={wf.status === 'active' ? 'secondary' : 'outline'}>
                                        {wf.status}
                                    </Badge>
                                </div>
                                <CardTitle className="leading-tight">{wf.name}</CardTitle>
                                <CardDescription className="line-clamp-2 min-h-[40px]">
                                    {wf.description || 'No description provided.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="space-y-4 py-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5" /> Trigger
                                        </span>
                                        <span className="font-medium capitalize">{wf.trigger_type.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <Shield className="h-3.5 w-3.5" /> Steps
                                        </span>
                                        <span className="font-medium">{wf.steps?.length || 0} stages</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <Zap className="h-3.5 w-3.5" /> Executions
                                        </span>
                                        <span className="font-medium">{wf.total_executions || 0}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-4 border-t gap-2">
                                <Button
                                    className="flex-1"
                                    onClick={() => executeWorkflow.mutate(wf.id)}
                                    disabled={executeWorkflow.isPending}
                                >
                                    <Play className="h-4 w-4 mr-2" />
                                    Run Now
                                </Button>
                                <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => deleteWorkflow.mutate(wf.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Workflow Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>New AI Workflow</DialogTitle>
                        <DialogDescription>
                            Define a new automated process for your digital workforce.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Workflow Name</label>
                            <Input
                                placeholder="e.g. Sales Qualification Pipeline"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Input
                                placeholder="What does this workforce chain do?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Domain</label>
                                <Select value={workflowType} onValueChange={setWorkflowType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="customer_acquisition">Sales & Marketing</SelectItem>
                                        <SelectItem value="project_delivery">Operations</SelectItem>
                                        <SelectItem value="content_generation">Creative</SelectItem>
                                        <SelectItem value="general">General Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Trigger</label>
                                <Select value={triggerType} onValueChange={setTriggerType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select trigger" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manual">Manual Execution</SelectItem>
                                        <SelectItem value="scheduled">Scheduled (Cron)</SelectItem>
                                        <SelectItem value="event_based">Event (Hook)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30 flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                After creation, you'll be able to add specific steps using the **Workflow Step Builder**
                                where you can assign tasks to qualified AI Employees.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={createWorkflow.isPending}>
                            {createWorkflow.isPending ? 'Creating...' : 'Create Workflow'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WorkflowStudio;
