import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    MarkerType,
    Panel,
    MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Zap,
    Plus,
    Save,
    Play,
    GitBranch,
    Clock,
    ArrowRight,
    Mail,
    MessageSquare,
    Bell,
    Database,
    Code,
    Workflow,
    Timer,
    Split,
    Repeat
} from 'lucide-react';
import { toast } from 'sonner';

// Node types for advanced automation
type NodeType =
    | 'trigger'
    | 'action'
    | 'condition'
    | 'goto'
    | 'wait'
    | 'wait_for_event'
    | 'if_else'
    | 'delay'
    | 'loop';

interface AutomationNodeData {
    label: string;
    type: NodeType;
    config: Record<string, any>;
    description?: string;
}

const nodeTypes = {
    trigger: {
        icon: <Zap className="h-4 w-4" />,
        color: 'bg-blue-500',
        label: 'Trigger'
    },
    action: {
        icon: <Play className="h-4 w-4" />,
        color: 'bg-green-500',
        label: 'Action'
    },
    condition: {
        icon: <GitBranch className="h-4 w-4" />,
        color: 'bg-purple-500',
        label: 'Condition'
    },
    if_else: {
        icon: <Split className="h-4 w-4" />,
        color: 'bg-purple-600',
        label: 'IF/ELSE'
    },
    goto: {
        icon: <ArrowRight className="h-4 w-4" />,
        color: 'bg-orange-500',
        label: 'Go To'
    },
    wait: {
        icon: <Clock className="h-4 w-4" />,
        color: 'bg-yellow-500',
        label: 'Wait'
    },
    wait_for_event: {
        icon: <Timer className="h-4 w-4" />,
        color: 'bg-pink-500',
        label: 'Wait for Event'
    },
    delay: {
        icon: <Clock className="h-4 w-4" />,
        color: 'bg-amber-500',
        label: 'Delay'
    },
    loop: {
        icon: <Repeat className="h-4 w-4" />,
        color: 'bg-indigo-500',
        label: 'Loop'
    }
};

const triggerOptions = [
    { value: 'contact_created', label: 'Contact Created', icon: <Database className="h-4 w-4" /> },
    { value: 'form_submitted', label: 'Form Submitted', icon: <Code className="h-4 w-4" /> },
    { value: 'email_opened', label: 'Email Opened', icon: <Mail className="h-4 w-4" /> },
    { value: 'email_clicked', label: 'Email Link Clicked', icon: <Mail className="h-4 w-4" /> },
    { value: 'tag_added', label: 'Tag Added', icon: <Badge className="h-4 w-4" /> },
    { value: 'stage_changed', label: 'Stage Changed', icon: <Workflow className="h-4 w-4" /> },
    { value: 'meeting_booked', label: 'Meeting Booked', icon: <Bell className="h-4 w-4" /> }
];

const actionOptions = [
    { value: 'send_email', label: 'Send Email', icon: <Mail className="h-4 w-4" /> },
    { value: 'send_sms', label: 'Send SMS', icon: <MessageSquare className="h-4 w-4" /> },
    { value: 'add_tag', label: 'Add Tag', icon: <Badge className="h-4 w-4" /> },
    { value: 'remove_tag', label: 'Remove Tag', icon: <Badge className="h-4 w-4" /> },
    { value: 'update_field', label: 'Update Field', icon: <Database className="h-4 w-4" /> },
    { value: 'create_task', label: 'Create Task', icon: <Bell className="h-4 w-4" /> },
    { value: 'send_notification', label: 'Send Notification', icon: <Bell className="h-4 w-4" /> },
    { value: 'webhook', label: 'Webhook', icon: <Code className="h-4 w-4" /> }
];

const eventOptions = [
    { value: 'email_reply', label: 'Email Reply' },
    { value: 'link_clicked', label: 'Link Clicked' },
    { value: 'form_submitted', label: 'Form Submitted' },
    { value: 'meeting_booked', label: 'Meeting Booked' },
    { value: 'payment_received', label: 'Payment Received' },
    { value: 'custom_event', label: 'Custom Event' }
];

// Custom node component
const CustomNode = ({ data }: { data: AutomationNodeData }) => {
    const nodeConfig = nodeTypes[data.type];

    return (
        <div className={`px-4 py-3 rounded-lg border-2 border-border bg-card shadow-lg min-w-[200px]`}>
            <div className="flex items-center gap-2 mb-1">
                <div className={`p-1.5 rounded ${nodeConfig.color} text-white`}>
                    {nodeConfig.icon}
                </div>
                <span className="font-semibold text-sm">{data.label}</span>
            </div>
            {data.description && (
                <p className="text-xs text-muted-foreground mt-1">{data.description}</p>
            )}
            <Badge variant="outline" className="mt-2 text-xs">
                {nodeConfig.label}
            </Badge>
        </div>
    );
};

const nodeTypesConfig = {
    custom: CustomNode
};

export default function AdvancedAutomationBuilder() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [showNodeDialog, setShowNodeDialog] = useState(false);
    const [nodeType, setNodeType] = useState<NodeType>('action');
    const [automationName, setAutomationName] = useState('New Automation');

    const [nodeConfig, setNodeConfig] = useState({
        label: '',
        description: '',
        actionType: '',
        triggerType: '',
        eventType: '',
        waitDuration: 1,
        waitUnit: 'hours',
        condition: {
            field: '',
            operator: 'equals',
            value: ''
        },
        gotoNodeId: '',
        ifCondition: {
            field: '',
            operator: 'equals',
            value: ''
        }
    });

    useEffect(() => {
        // Initialize with a trigger node
        if (nodes.length === 0) {
            const initialNode: Node = {
                id: '1',
                type: 'custom',
                position: { x: 250, y: 50 },
                data: {
                    label: 'Start Trigger',
                    type: 'trigger',
                    config: {},
                    description: 'Select a trigger to start'
                }
            };
            setNodes([initialNode]);
        }
    }, []);

    const onConnect = useCallback(
        (params: Connection) => {
            const edge = {
                ...params,
                type: 'smoothstep',
                animated: true,
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20
                }
            };
            setEdges((eds) => addEdge(edge, eds));
        },
        [setEdges]
    );

    const addNode = () => {
        const newNode: Node = {
            id: `${nodes.length + 1}`,
            type: 'custom',
            position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
            data: {
                label: nodeConfig.label || `New ${nodeType}`,
                type: nodeType,
                config: getNodeConfig(),
                description: nodeConfig.description
            }
        };

        setNodes((nds) => [...nds, newNode]);
        setShowNodeDialog(false);
        resetNodeConfig();
        toast.success('Node added successfully');
    };

    const getNodeConfig = () => {
        switch (nodeType) {
            case 'trigger':
                return { triggerType: nodeConfig.triggerType };
            case 'action':
                return { actionType: nodeConfig.actionType };
            case 'wait':
                return { duration: nodeConfig.waitDuration, unit: nodeConfig.waitUnit };
            case 'wait_for_event':
                return { eventType: nodeConfig.eventType, timeout: nodeConfig.waitDuration };
            case 'condition':
            case 'if_else':
                return { condition: nodeConfig.ifCondition };
            case 'goto':
                return { targetNodeId: nodeConfig.gotoNodeId };
            default:
                return {};
        }
    };

    const resetNodeConfig = () => {
        setNodeConfig({
            label: '',
            description: '',
            actionType: '',
            triggerType: '',
            eventType: '',
            waitDuration: 1,
            waitUnit: 'hours',
            condition: {
                field: '',
                operator: 'equals',
                value: ''
            },
            gotoNodeId: '',
            ifCondition: {
                field: '',
                operator: 'equals',
                value: ''
            }
        });
    };

    const saveAutomation = () => {
        const automation = {
            name: automationName,
            nodes: nodes,
            edges: edges
        };
        console.log('Saving automation:', automation);
        toast.success('Automation saved successfully');
    };

    const runAutomation = () => {
        toast.info('Running automation in test mode...');
        // Implement test run logic
    };

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="border-b bg-card p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <Input
                                value={automationName}
                                onChange={(e) => setAutomationName(e.target.value)}
                                className="font-semibold text-lg border-none shadow-none focus-visible:ring-0 px-0"
                            />
                            <p className="text-sm text-muted-foreground">Advanced automation with branching logic</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={runAutomation}>
                            <Play className="h-4 w-4 mr-2" />
                            Test Run
                        </Button>
                        <Button onClick={saveAutomation}>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                        </Button>
                    </div>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypesConfig}
                    fitView
                    className="bg-muted/20"
                >
                    <Background />
                    <Controls />
                    <MiniMap />

                    <Panel position="top-left" className="bg-card border rounded-lg p-4 shadow-lg">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Workflow className="h-4 w-4" />
                            Add Node
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setNodeType('action')}
                                        className="justify-start"
                                    >
                                        <Play className="h-3 w-3 mr-2" />
                                        Action
                                    </Button>
                                </DialogTrigger>
                            </Dialog>

                            <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setNodeType('if_else')}
                                        className="justify-start"
                                    >
                                        <Split className="h-3 w-3 mr-2" />
                                        IF/ELSE
                                    </Button>
                                </DialogTrigger>
                            </Dialog>

                            <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setNodeType('wait')}
                                        className="justify-start"
                                    >
                                        <Clock className="h-3 w-3 mr-2" />
                                        Wait
                                    </Button>
                                </DialogTrigger>
                            </Dialog>

                            <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setNodeType('wait_for_event')}
                                        className="justify-start"
                                    >
                                        <Timer className="h-3 w-3 mr-2" />
                                        Wait Event
                                    </Button>
                                </DialogTrigger>
                            </Dialog>

                            <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setNodeType('goto')}
                                        className="justify-start"
                                    >
                                        <ArrowRight className="h-3 w-3 mr-2" />
                                        Go To
                                    </Button>
                                </DialogTrigger>
                            </Dialog>

                            <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setNodeType('loop')}
                                        className="justify-start"
                                    >
                                        <Repeat className="h-3 w-3 mr-2" />
                                        Loop
                                    </Button>
                                </DialogTrigger>
                            </Dialog>
                        </div>
                    </Panel>

                    <Panel position="bottom-right" className="bg-card border rounded-lg p-3 shadow-lg">
                        <div className="text-sm space-y-1">
                            <p className="font-semibold">Stats</p>
                            <p className="text-muted-foreground">Nodes: {nodes.length}</p>
                            <p className="text-muted-foreground">Connections: {edges.length}</p>
                        </div>
                    </Panel>
                </ReactFlow>

                {/* Node Configuration Dialog */}
                <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                {nodeTypes[nodeType].icon}
                                Add {nodeTypes[nodeType].label} Node
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <Label>Node Label</Label>
                                <Input
                                    value={nodeConfig.label}
                                    onChange={(e) => setNodeConfig({ ...nodeConfig, label: e.target.value })}
                                    placeholder="Enter node label"
                                />
                            </div>

                            <div>
                                <Label>Description (Optional)</Label>
                                <Textarea
                                    value={nodeConfig.description}
                                    onChange={(e) => setNodeConfig({ ...nodeConfig, description: e.target.value })}
                                    placeholder="Describe what this node does"
                                    rows={2}
                                />
                            </div>

                            {/* Trigger Configuration */}
                            {nodeType === 'trigger' && (
                                <div>
                                    <Label>Trigger Type</Label>
                                    <Select
                                        value={nodeConfig.triggerType}
                                        onValueChange={(v) => setNodeConfig({ ...nodeConfig, triggerType: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select trigger..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {triggerOptions.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    <div className="flex items-center gap-2">
                                                        {opt.icon}
                                                        {opt.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Action Configuration */}
                            {nodeType === 'action' && (
                                <div>
                                    <Label>Action Type</Label>
                                    <Select
                                        value={nodeConfig.actionType}
                                        onValueChange={(v) => setNodeConfig({ ...nodeConfig, actionType: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select action..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {actionOptions.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    <div className="flex items-center gap-2">
                                                        {opt.icon}
                                                        {opt.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Wait Configuration */}
                            {nodeType === 'wait' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Duration</Label>
                                        <Input
                                            type="number"
                                            value={nodeConfig.waitDuration}
                                            onChange={(e) => setNodeConfig({ ...nodeConfig, waitDuration: parseInt(e.target.value) || 1 })}
                                            min={1}
                                        />
                                    </div>
                                    <div>
                                        <Label>Unit</Label>
                                        <Select
                                            value={nodeConfig.waitUnit}
                                            onValueChange={(v) => setNodeConfig({ ...nodeConfig, waitUnit: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="minutes">Minutes</SelectItem>
                                                <SelectItem value="hours">Hours</SelectItem>
                                                <SelectItem value="days">Days</SelectItem>
                                                <SelectItem value="weeks">Weeks</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {/* Wait for Event Configuration */}
                            {nodeType === 'wait_for_event' && (
                                <div className="space-y-4">
                                    <div>
                                        <Label>Event to Wait For</Label>
                                        <Select
                                            value={nodeConfig.eventType}
                                            onValueChange={(v) => setNodeConfig({ ...nodeConfig, eventType: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select event..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {eventOptions.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Timeout (hours)</Label>
                                        <Input
                                            type="number"
                                            value={nodeConfig.waitDuration}
                                            onChange={(e) => setNodeConfig({ ...nodeConfig, waitDuration: parseInt(e.target.value) || 24 })}
                                            placeholder="24"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Continue after this time even if event doesn't occur
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* IF/ELSE Configuration */}
                            {(nodeType === 'if_else' || nodeType === 'condition') && (
                                <Card>
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm">Condition</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <Label>Field</Label>
                                            <Input
                                                value={nodeConfig.ifCondition.field}
                                                onChange={(e) => setNodeConfig({
                                                    ...nodeConfig,
                                                    ifCondition: { ...nodeConfig.ifCondition, field: e.target.value }
                                                })}
                                                placeholder="e.g., contact.email"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label>Operator</Label>
                                                <Select
                                                    value={nodeConfig.ifCondition.operator}
                                                    onValueChange={(v) => setNodeConfig({
                                                        ...nodeConfig,
                                                        ifCondition: { ...nodeConfig.ifCondition, operator: v }
                                                    })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="equals">Equals</SelectItem>
                                                        <SelectItem value="not_equals">Not Equals</SelectItem>
                                                        <SelectItem value="contains">Contains</SelectItem>
                                                        <SelectItem value="greater_than">Greater Than</SelectItem>
                                                        <SelectItem value="less_than">Less Than</SelectItem>
                                                        <SelectItem value="is_empty">Is Empty</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>Value</Label>
                                                <Input
                                                    value={nodeConfig.ifCondition.value}
                                                    onChange={(e) => setNodeConfig({
                                                        ...nodeConfig,
                                                        ifCondition: { ...nodeConfig.ifCondition, value: e.target.value }
                                                    })}
                                                    placeholder="Comparison value"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Go To Configuration */}
                            {nodeType === 'goto' && (
                                <div>
                                    <Label>Target Node</Label>
                                    <Select
                                        value={nodeConfig.gotoNodeId}
                                        onValueChange={(v) => setNodeConfig({ ...nodeConfig, gotoNodeId: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select node to jump to..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {nodes.map(node => (
                                                <SelectItem key={node.id} value={node.id}>
                                                    {node.data.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setShowNodeDialog(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={addNode} disabled={!nodeConfig.label}>
                                    Add Node
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
