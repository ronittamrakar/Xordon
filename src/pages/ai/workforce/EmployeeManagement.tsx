import React, { useState } from 'react';
import {
    Users, Plus, Search, Filter, MoreVertical,
    Edit, Trash2, Shield, Briefcase, UserCircle,
    ChevronRight, LayoutGrid, List as ListIcon,
    AlertCircle, CheckCircle2, Clock, Zap
} from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    useAiEmployees,
    useAiWorkforceHierarchy,
    useDeleteAiEmployee,
    useCreateAiEmployee,
    useUpdateAiEmployee
} from '@/hooks/useAiWorkforce';
import { useAiAgents } from '@/hooks/useAiAgents';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter
} from "@/components/ui/sheet";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const EmployeeManagement: React.FC = () => {
    const navigate = useNavigate();
    const { data: employees = [], isLoading } = useAiEmployees();
    const { data: agents = [] } = useAiAgents();
    const { data: hierarchy = [] } = useAiWorkforceHierarchy();
    const { mutate: deleteEmployee } = useDeleteAiEmployee();
    const { mutate: createEmployee } = useCreateAiEmployee();
    const { mutate: updateEmployee } = useUpdateAiEmployee();

    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'hierarchy'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [isHireModalOpen, setIsHireModalOpen] = useState(false);

    // Edit state
    const [editingEmployee, setEditingEmployee] = useState<any>(null);
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

    // Form state for hiring/editing
    const [selectedAgentId, setSelectedAgentId] = useState('');
    const [employeeRole, setEmployeeRole] = useState('sales');
    const [employeeType, setEmployeeType] = useState('specialized');
    const [autonomyLevel, setAutonomyLevel] = useState('assisted');
    const [supervisorId, setSupervisorId] = useState<string>('');
    const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);

    const handleHire = () => {
        if (!selectedAgentId) {
            toast.error("Please select an AI agent to promote");
            return;
        }

        createEmployee({
            data: {
                agent_id: selectedAgentId,
                role: employeeRole,
                employee_type: employeeType as any,
                autonomy_level: autonomyLevel as any,
                supervisor_id: supervisorId || null,
                capabilities: selectedCapabilities,
            },
            status: 'active',
            permissions: {},
        }, {
            onSuccess: () => {
                toast.success("AI Agent promoted successfully");
                setIsHireModalOpen(false);
                resetForm();
            },
            onError: (err: any) => {
                toast.error(err.message || "Failed to hire employee");
            }
        });
    };

    const handleUpdate = () => {
        if (!editingEmployee) return;

        updateEmployee({
            id: editingEmployee.id,
            data: {
                role: employeeRole,
                employee_type: employeeType as any,
                autonomy_level: autonomyLevel as any,
                supervisor_id: supervisorId || null,
                capabilities: selectedCapabilities,
            }
        }, {
            onSuccess: () => {
                toast.success("Employee records updated");
                setIsEditSheetOpen(false);
                resetForm();
            }
        });
    };

    const resetForm = () => {
        setSelectedAgentId('');
        setEmployeeRole('sales');
        setEmployeeType('specialized');
        setAutonomyLevel('assisted');
        setSupervisorId('');
        setSelectedCapabilities([]);
        setEditingEmployee(null);
    };

    const handleEditClick = (emp: any) => {
        setEditingEmployee(emp);
        setEmployeeRole(emp.role);
        setEmployeeType(emp.employee_type);
        setAutonomyLevel(emp.autonomy_level);
        setSupervisorId(emp.supervisor_id || '');
        setSelectedCapabilities(Array.isArray(emp.capabilities) ? emp.capabilities : []);
        setIsEditSheetOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to remove this agent from the AI workforce? They will still remain as a standard agent.")) {
            deleteEmployee(id, {
                onSuccess: () => toast.success("Employee removed"),
                onError: () => toast.error("Failed to remove employee")
            });
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.agent_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const availableAgents = agents.filter(agent =>
        !employees.some(emp => emp.agent_id === agent.id)
    );

    // Recursive component for Org Chart
    const HierarchyNode = ({ node }: { node: any }) => (
        <div className="flex flex-col items-center">
            <Card className="w-48 p-3 text-center shadow-sm border-primary/20 bg-primary/5">
                <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mb-2">
                    {node.role?.charAt(0).toUpperCase()}
                </div>
                <p className="font-bold text-sm truncate">{node.agent_name}</p>
                <Badge variant="outline" className="mt-1 text-[10px] uppercase">{node.role}</Badge>
            </Card>
            {node.subordinates && node.subordinates.length > 0 && (
                <div className="flex gap-4 mt-8 relative">
                    {/* Vertical line from parent */}
                    <div className="absolute top-[-32px] left-1/2 -translate-x-1/2 w-px h-8 bg-border" />
                    {/* Nodes */}
                    {node.subordinates.map((sub: any) => (
                        <HierarchyNode key={sub.id} node={sub} />
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-4 animate-in fade-in duration-700">
            <Breadcrumb items={[{ label: 'AI', href: '/ai/console' }, { label: 'Workforce', href: '/ai/workforce' }, { label: 'Employees' }]} />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">Employee Management</h1>
                    <p className="text-muted-foreground">Manage your digital AI staff and organizational structure</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-muted p-1 rounded-lg flex items-center mr-2">
                        <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')}>
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
                            <ListIcon className="h-4 w-4" />
                        </Button>
                        <Button variant={viewMode === 'hierarchy' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('hierarchy')}>
                            <Shield className="h-4 w-4" />
                        </Button>
                    </div>

                    <Dialog open={isHireModalOpen} onOpenChange={setIsHireModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="shadow-sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Promote Agent
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Promote AI Agent to Employee</DialogTitle>
                                <DialogDescription>
                                    Assign workforce responsibilities to an existing AI agent.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Select Agent</Label>
                                    <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an AI agent..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableAgents.map(agent => (
                                                <SelectItem key={agent.id} value={agent.id}>
                                                    {agent.name} ({agent.type})
                                                </SelectItem>
                                            ))}
                                            {availableAgents.length === 0 && (
                                                <SelectItem value="none" disabled>No available agents to promote</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Workforce Role</Label>
                                        <Select value={employeeRole} onValueChange={setEmployeeRole}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sales">Sales Specialist</SelectItem>
                                                <SelectItem value="marketing">Marketing Specialist</SelectItem>
                                                <SelectItem value="support">Customer Support</SelectItem>
                                                <SelectItem value="hr">HR Assistant</SelectItem>
                                                <SelectItem value="finance">Finance Agent</SelectItem>
                                                <SelectItem value="analytics">Data Analyst</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Employee Tier</Label>
                                        <Select value={employeeType} onValueChange={setEmployeeType}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="specialized">Specialized Worker</SelectItem>
                                                <SelectItem value="supervisory">Supervisor</SelectItem>
                                                <SelectItem value="cao">Chief AI Officer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Reporting To (Supervisor)</Label>
                                    <Select value={supervisorId} onValueChange={setSupervisorId}>
                                        <SelectTrigger><SelectValue placeholder="Select supervisor (optional)" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No Supervisor</SelectItem>
                                            {employees.filter(e => e.employee_type !== 'specialized').map(e => (
                                                <SelectItem key={e.id} value={e.id}>{e.agent_name} ({e.role})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Autonomy Level</Label>
                                    <Select value={autonomyLevel} onValueChange={setAutonomyLevel}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="human_led">Human Led (Approval only)</SelectItem>
                                            <SelectItem value="assisted">Assisted (Hybrid)</SelectItem>
                                            <SelectItem value="autonomous">Fully Autonomous</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-4">
                                    <Label>Employee Capabilities</Label>
                                    <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto border rounded-lg p-2">
                                        {AI_CAPABILITIES.map((cap) => (
                                            <div
                                                key={cap.id}
                                                className={`flex items-center gap-2 p-2 rounded transition-colors cursor-pointer ${selectedCapabilities.includes(cap.id)
                                                    ? 'bg-primary/5 border border-primary/20'
                                                    : 'hover:bg-muted border border-transparent'
                                                    }`}
                                                onClick={() => {
                                                    if (selectedCapabilities.includes(cap.id)) {
                                                        setSelectedCapabilities(selectedCapabilities.filter(id => id !== cap.id));
                                                    } else {
                                                        setSelectedCapabilities([...selectedCapabilities, cap.id]);
                                                    }
                                                }}
                                            >
                                                <cap.icon className={`h-3.5 w-3.5 ${selectedCapabilities.includes(cap.id) ? 'text-primary' : 'text-muted-foreground'}`} />
                                                <span className="text-[10px] font-medium leading-none">{cap.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button className="w-full mt-4" onClick={handleHire}>
                                    Confirm Promotion
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filters & Search - Hidden in hierarchy view */}
            {viewMode !== 'hierarchy' && (
                <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or role..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="shadow-sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                </div>
            )}

            {/* Content Area */}
            {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : viewMode === 'hierarchy' ? (
                <div className="p-8 overflow-x-auto min-h-[500px] flex justify-center bg-muted/10 rounded-2xl border border-dashed">
                    {hierarchy.length === 0 ? (
                        <div className="text-center py-20">
                            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-10" />
                            <p className="text-muted-foreground italic">No organizational hierarchy defined.</p>
                        </div>
                    ) : (
                        <div className="flex gap-16">
                            {hierarchy.map((node: any) => (
                                <HierarchyNode key={node.id} node={node} />
                            ))}
                        </div>
                    )}
                </div>
            ) : filteredEmployees.length === 0 ? (
                <Card className="border-dashed border-2 bg-transparent py-20">
                    <div className="text-center">
                        <UserCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-medium">No Employees Found</h3>
                        <p className="text-muted-foreground mb-6">Promote your first AI Agent to the workforce to get started.</p>
                        <Button onClick={() => setIsHireModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Hire AI Employee
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                    {filteredEmployees.map((emp) => (
                        <Card key={emp.id} className="relative group overflow-hidden">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                                            {emp.role.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{emp.agent_name}</CardTitle>
                                            <CardDescription className="flex items-center gap-1">
                                                <Briefcase className="h-3 w-3" />
                                                {emp.role.replace(/_/g, ' ')}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEditClick(emp)}>
                                                <Edit className="h-4 w-4 mr-2" /> Edit Records
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => navigate(`/ai/workforce/history?employee_id=${emp.id}`)}>
                                                <Clock className="h-4 w-4 mr-2" /> View History
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(emp.id)}>
                                                <Trash2 className="h-4 w-4 mr-2" /> Remove from Workforce
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2 rounded-lg bg-muted/50">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Autonomy</p>
                                        <p className="text-sm font-medium capitalize">{emp.autonomy_level}</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-muted/50">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Tier</p>
                                        <p className="text-sm font-medium capitalize">{emp.employee_type}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Capabilities</p>
                                    <div className="flex flex-wrap gap-1">
                                        {Array.isArray(emp.capabilities) && emp.capabilities.length > 0 ? (
                                            emp.capabilities.map((capId: string) => {
                                                const cap = AI_CAPABILITIES.find(c => c.id === capId);
                                                if (!cap) return null;
                                                return (
                                                    <div key={capId} title={cap.label} className="p-1 rounded bg-primary/5 text-primary">
                                                        <cap.icon className="h-3 w-3" />
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">None assigned</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-dashed">
                                    <Badge variant={emp.status === 'active' ? 'secondary' : 'outline'} className="shadow-none">
                                        {emp.status === 'active' ? (
                                            <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                                        ) : (
                                            <AlertCircle className="h-3 w-3 mr-1 text-amber-500" />
                                        )}
                                        {emp.status}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                        onClick={() => handleEditClick(emp)}
                                    >
                                        Configure <ChevronRight className="h-3 w-3 ml-1" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Employee Sheet */}
            <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
                <SheetContent side="right" className="sm:max-w-[400px]">
                    <SheetHeader>
                        <SheetTitle>Edit Employee Records</SheetTitle>
                        <SheetDescription>Update role, reporting, and autonomy for {editingEmployee?.agent_name}</SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6 py-6">
                        <div className="space-y-2">
                            <Label>Employee Role</Label>
                            <Select value={employeeRole} onValueChange={setEmployeeRole}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sales">Sales Specialist</SelectItem>
                                    <SelectItem value="marketing">Marketing Specialist</SelectItem>
                                    <SelectItem value="support">Customer Support</SelectItem>
                                    <SelectItem value="hr">HR Assistant</SelectItem>
                                    <SelectItem value="finance">Finance Agent</SelectItem>
                                    <SelectItem value="analytics">Data Analyst</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Tier & Responsibility</Label>
                            <Select value={employeeType} onValueChange={setEmployeeType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="specialized">Specialized Worker</SelectItem>
                                    <SelectItem value="supervisory">Supervisor</SelectItem>
                                    <SelectItem value="cao">Chief AI Officer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Reporting To</Label>
                            <Select value={supervisorId} onValueChange={setSupervisorId}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Supervisor</SelectItem>
                                    {employees
                                        .filter(e => e.id !== editingEmployee?.id && e.employee_type !== 'specialized')
                                        .map(e => (
                                            <SelectItem key={e.id} value={e.id}>{e.agent_name} ({e.role})</SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Autonomy Model</Label>
                            <Select value={autonomyLevel} onValueChange={setAutonomyLevel}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="human_led">Human Led</SelectItem>
                                    <SelectItem value="assisted">Assisted</SelectItem>
                                    <SelectItem value="autonomous">Fully Autonomous</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="p-4 rounded-xl bg-muted/30 border border-dashed text-xs text-muted-foreground">
                            <h4 className="font-bold mb-2 flex items-center gap-1 text-foreground">
                                <Zap className="h-3 w-3" /> Capabilities Insight
                            </h4>
                            This employee is currently authorized to access:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>CRM Read/Write</li>
                                <li>Automations Trigger</li>
                                <li>Communications Dispatch</li>
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <Label>Enabled Capabilities</Label>
                            <div className="grid grid-cols-1 gap-2 border rounded-lg p-3 max-h-[300px] overflow-y-auto">
                                {AI_CAPABILITIES.map((cap) => (
                                    <div
                                        key={cap.id}
                                        className={`flex items-start gap-3 p-2 rounded-md transition-colors cursor-pointer ${selectedCapabilities.includes(cap.id)
                                            ? 'bg-primary/5 border-primary/20'
                                            : 'hover:bg-muted'
                                            }`}
                                        onClick={() => {
                                            if (selectedCapabilities.includes(cap.id)) {
                                                setSelectedCapabilities(selectedCapabilities.filter(id => id !== cap.id));
                                            } else {
                                                setSelectedCapabilities([...selectedCapabilities, cap.id]);
                                            }
                                        }}
                                    >
                                        <div className={`p-1.5 rounded bg-background border ${selectedCapabilities.includes(cap.id) ? 'text-primary border-primary' : 'text-muted-foreground'}`}>
                                            <cap.icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold">{cap.label}</p>
                                            <p className="text-[10px] text-muted-foreground leading-tight">{cap.description}</p>
                                        </div>
                                        {cap.requiresApproval && (
                                            <Badge variant="outline" className="text-[8px] h-4 px-1 border-amber-200 text-amber-600 bg-amber-50">Locked</Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <SheetFooter>
                        <Button className="w-full" onClick={handleUpdate}>Save Employee Records</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default EmployeeManagement;
