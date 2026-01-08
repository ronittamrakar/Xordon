import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Copy,
    Play,
    Pause,
    Workflow,
    Phone,
    PhoneCall,
} from 'lucide-react';
import { api } from '@/lib/api';

interface CallFlow {
    id: number;
    name: string;
    description: string;
    phone_number_id?: number;
    phone_number?: string;
    status: 'draft' | 'active' | 'paused';
    created_at: string;
    updated_at: string;
    call_count?: number;
    assigned_numbers_count?: number;
    assigned_numbers?: string;
}

export default function CallFlows() {
    const navigate = useNavigate();
    const [flows, setFlows] = useState<CallFlow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newFlowName, setNewFlowName] = useState('');
    const [newFlowDescription, setNewFlowDescription] = useState('');

    useEffect(() => {
        loadFlows();
    }, []);

    const loadFlows = async () => {
        try {
            const response = await api.get('/call-flows');
            setFlows((response.data as any)?.items || []);
        } catch (error) {
            console.error('Failed to load call flows:', error);
            // Mock data for development
            setFlows([
                {
                    id: 1,
                    name: 'Main IVR Menu',
                    description: 'Primary greeting and menu routing',
                    status: 'active',
                    phone_number: '+1 555 123 4567',
                    created_at: '2024-01-15T10:00:00Z',
                    updated_at: '2024-01-20T14:30:00Z',
                    call_count: 1234,
                },
                {
                    id: 2,
                    name: 'After Hours Flow',
                    description: 'Voicemail and emergency routing',
                    status: 'active',
                    phone_number: '+1 555 123 4567',
                    created_at: '2024-01-10T08:00:00Z',
                    updated_at: '2024-01-18T16:45:00Z',
                    call_count: 567,
                },
                {
                    id: 3,
                    name: 'Sales Queue',
                    description: 'Sales team call distribution',
                    status: 'draft',
                    created_at: '2024-01-22T09:15:00Z',
                    updated_at: '2024-01-22T09:15:00Z',
                    call_count: 0,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const createFlow = async () => {
        if (!newFlowName.trim()) {
            toast.error('Please enter a flow name');
            return;
        }

        try {
            const response = await api.post('/call-flows', {
                name: newFlowName,
                description: newFlowDescription,
                status: 'draft',
                nodes: [],
                edges: [],
            });
            toast.success('Call flow created');
            setIsCreateDialogOpen(false);
            navigate(`/reach/calls/ivr/${(response.data as any).id}`);
        } catch (error) {
            // Navigate to builder anyway for demo
            navigate(`/reach/calls/ivr/new`);
        }
    };

    const deleteFlow = async (id: number) => {
        if (!confirm('Are you sure you want to delete this call flow?')) return;
        try {
            await api.delete(`/call-flows/${id}`);
            toast.success('Call flow deleted');
            loadFlows();
        } catch (error) {
            toast.error('Failed to delete call flow');
        }
    };

    const toggleFlowStatus = async (flow: CallFlow) => {
        const newStatus = flow.status === 'active' ? 'paused' : 'active';
        try {
            await api.put(`/call-flows/${flow.id}`, { status: newStatus });
            toast.success(`Call flow ${newStatus === 'active' ? 'activated' : 'paused'}`);
            loadFlows();
        } catch (error) {
            toast.error('Failed to update call flow status');
        }
    };

    const duplicateFlow = async (flow: CallFlow) => {
        try {
            await api.post('/call-flows', {
                name: `${flow.name} (Copy)`,
                description: flow.description,
                status: 'draft',
            });
            toast.success('Call flow duplicated');
            loadFlows();
        } catch (error) {
            toast.error('Failed to duplicate call flow');
        }
    };

    const filteredFlows = flows.filter(
        (flow) =>
            flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            flow.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-500">Active</Badge>;
            case 'paused':
                return <Badge variant="secondary">Paused</Badge>;
            default:
                return <Badge variant="outline">Draft</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Call Routing (IVR)</h1>
                    <p className="text-muted-foreground">
                        Build visual IVR menus and call routing logic
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Flow
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Call Routing</DialogTitle>
                            <DialogDescription>
                                Set up a new IVR or call routing flow
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Flow Name</Label>
                                <Input
                                    value={newFlowName}
                                    onChange={(e) => setNewFlowName(e.target.value)}
                                    placeholder="e.g., Main IVR Menu"
                                />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={newFlowDescription}
                                    onChange={(e) => setNewFlowDescription(e.target.value)}
                                    placeholder="Describe what this flow does..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={createFlow}>Create Flow</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search flows..."
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Flows Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Flow Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Assigned Numbers</TableHead>
                                <TableHead>Calls</TableHead>
                                <TableHead>Last Modified</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : filteredFlows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <div className="flex flex-col items-center gap-2">
                                            <Workflow className="h-8 w-8 text-muted-foreground" />
                                            <p className="text-muted-foreground">No call routing configured yet</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsCreateDialogOpen(true)}
                                            >
                                                Create your first flow
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredFlows.map((flow) => (
                                    <TableRow
                                        key={flow.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => navigate(`/reach/calls/ivr/${flow.id}`)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-md bg-primary/10">
                                                    <Workflow className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{flow.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {flow.description || 'No description'}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(flow.status)}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1 font-medium">
                                                    <Phone className="h-3 w-3" />
                                                    {flow.assigned_numbers_count || 0} Lines
                                                </div>
                                                {flow.assigned_numbers && (
                                                    <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                                        {flow.assigned_numbers}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <PhoneCall className="h-3 w-3" />
                                                {flow.call_count?.toLocaleString() || 0}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(flow.updated_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/reach/calls/ivr/${flow.id}`);
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleFlowStatus(flow);
                                                        }}
                                                    >
                                                        {flow.status === 'active' ? (
                                                            <>
                                                                <Pause className="h-4 w-4 mr-2" />
                                                                Pause
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Play className="h-4 w-4 mr-2" />
                                                                Activate
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            duplicateFlow(flow);
                                                        }}
                                                    >
                                                        <Copy className="h-4 w-4 mr-2" />
                                                        Duplicate
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteFlow(flow.id);
                                                        }}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
}
