import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Zap, Plus, Search, Edit, Trash2, Play, Pause, Save, MoreHorizontal, Mail, MessageSquare,
    Phone, Clock, Tag, Users, Workflow, Settings, Eye, Copy, Download, Upload, RefreshCw,
    ArrowUpDown, Filter, X, ChevronUp, ChevronDown, GripVertical, AlertCircle, CheckCircle2,
    FileSpreadsheet, LayoutGrid, Grid3X3, ExternalLink, Undo, Redo, TableProperties,
    ArrowLeft, ArrowRight, Link2, Unlink, GitBranch, Timer, Split, Target, Sparkles
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface FlowNode {
    id: string;
    type: 'trigger' | 'action' | 'condition' | 'delay' | 'split';
    subType: string;
    position: { x: number; y: number };
    data: Record<string, any>;
    connections: string[];
}

interface Flow {
    id?: number;
    name: string;
    description: string;
    status: 'draft' | 'active' | 'paused';
    nodes: FlowNode[];
    campaign_id?: number;
    campaign_type?: 'email' | 'sms' | 'call' | 'multi-channel';
    trigger_type?: string;
    created_at?: string;
    updated_at?: string;
    stats?: {
        total_contacts: number;
        emails_sent: number;
        sms_sent: number;
        calls_made: number;
        conversions: number;
    };
}

interface SpreadsheetRow {
    id: string;
    flowId: number | null;
    stepOrder: number;
    nodeId: string;
    nodeType: 'trigger' | 'action' | 'condition' | 'delay' | 'split';
    subType: string;
    name: string;
    description: string;
    delayValue: number | null;
    delayUnit: 'minutes' | 'hours' | 'days' | null;
    templateId: number | null;
    templateName: string | null;
    tagName: string | null;
    condition: string | null;
    connectedTo: string[];
    status: 'enabled' | 'disabled';
    data: Record<string, any>;
    isNew?: boolean;
    isModified?: boolean;
}

interface SpreadsheetColumn {
    id: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'boolean' | 'readonly' | 'tags' | 'connection';
    width: number;
    minWidth?: number;
    resizable?: boolean;
    sortable?: boolean;
    filterable?: boolean;
    editable?: boolean;
    options?: { value: string; label: string }[];
    visible?: boolean;
}

interface AutomationSpreadsheetViewProps {
    flowId?: number;
    initialFlow?: Flow; // Flow data passed from parent (for embedded mode)
    onSave?: (flow: Flow) => void;
    onClose?: () => void;
    mode?: 'standalone' | 'embedded';
    syncEnabled?: boolean;
    onSyncChange?: (enabled: boolean) => void;
}

// ============================================
// NODE TYPE DEFINITIONS (mirrored from FlowBuilder)
// ============================================

const NODE_TYPES = {
    triggers: [
        { id: 'contact_added', name: 'Contact Added', category: 'contact' },
        { id: 'contact_updated', name: 'Contact Updated', category: 'contact' },
        { id: 'tag_added', name: 'Tag Added', category: 'contact' },
        { id: 'tag_removed', name: 'Tag Removed', category: 'contact' },
        { id: 'email_opened', name: 'Email Opened', category: 'email' },
        { id: 'email_clicked', name: 'Link Clicked', category: 'email' },
        { id: 'email_replied', name: 'Email Replied', category: 'email' },
        { id: 'sms_replied', name: 'SMS Replied', category: 'sms' },
        { id: 'call_completed', name: 'Call Completed', category: 'call' },
        { id: 'call_missed', name: 'Call Missed', category: 'call' },
        { id: 'form_submitted', name: 'Form Submitted', category: 'form' },
        { id: 'page_visited', name: 'Page Visited', category: 'form' },
        { id: 'purchase_made', name: 'Purchase Made', category: 'ecommerce' },
        { id: 'cart_abandoned', name: 'Cart Abandoned', category: 'ecommerce' },
        { id: 'date_trigger', name: 'Date/Time', category: 'time' },
        { id: 'birthday_trigger', name: 'Birthday', category: 'time' },
        { id: 'webhook_received', name: 'Webhook Received', category: 'integration' },
        { id: 'manual', name: 'Manual Start', category: 'manual' },
    ],
    actions: [
        { id: 'send_email', name: 'Send Email', category: 'email' },
        { id: 'send_email_sequence', name: 'Start Email Sequence', category: 'email' },
        { id: 'send_sms', name: 'Send SMS', category: 'sms' },
        { id: 'send_sms_sequence', name: 'Start SMS Sequence', category: 'sms' },
        { id: 'make_call', name: 'Make Call', category: 'call' },
        { id: 'schedule_call', name: 'Schedule Call', category: 'call' },
        { id: 'add_tag', name: 'Add Tag', category: 'contact' },
        { id: 'remove_tag', name: 'Remove Tag', category: 'contact' },
        { id: 'update_field', name: 'Update Field', category: 'contact' },
        { id: 'add_to_campaign', name: 'Add to Campaign', category: 'campaign' },
        { id: 'create_task', name: 'Create Task', category: 'crm' },
        { id: 'create_deal', name: 'Create Deal', category: 'crm' },
        { id: 'notify_team', name: 'Notify Team', category: 'notification' },
        // Advanced Automation (Zapier/n8n Style)
        { id: 'webhook', name: 'Webhook', category: 'integration' },
        { id: 'http_request', name: 'HTTP Request', category: 'integration' },
        { id: 'run_code', name: 'Run Code', category: 'integration' },
        { id: 'ai_assistant', name: 'AI Assistant', category: 'integration' },
        { id: 'data_transformer', name: 'Transform Data', category: 'integration' },
        { id: 'set_variable', name: 'Set Variable', category: 'integration' },
        { id: 'end_flow', name: 'End Flow', category: 'flow' },
        { id: 'start_subflow', name: 'Start Subflow', category: 'flow' },
    ],
    conditions: [
        { id: 'if_else', name: 'If/Else', category: 'logic' },
        { id: 'has_tag', name: 'Has Tag', category: 'contact' },
        { id: 'field_value', name: 'Field Value', category: 'contact' },
        { id: 'lead_score', name: 'Lead Score', category: 'contact' },
        { id: 'email_activity', name: 'Email Activity', category: 'email' },
        { id: 'in_campaign', name: 'In Campaign', category: 'campaign' },
        { id: 'purchase_history', name: 'Purchase History', category: 'ecommerce' },
        { id: 'random_split', name: 'Random Split', category: 'split' },
    ],
    timing: [
        { id: 'wait', name: 'Wait', category: 'delay' },
        { id: 'wait_until', name: 'Wait Until', category: 'delay' },
        { id: 'smart_delay', name: 'Smart Delay', category: 'delay' },
        { id: 'business_hours', name: 'Business Hours', category: 'delay' },
        { id: 'split_test', name: 'A/B Split', category: 'split' },
    ],
};

const getAllNodeTypes = () => [
    ...NODE_TYPES.triggers.map(t => ({ ...t, type: 'trigger' as const })),
    ...NODE_TYPES.actions.map(a => ({ ...a, type: 'action' as const })),
    ...NODE_TYPES.conditions.map(c => ({ ...c, type: 'condition' as const })),
    ...NODE_TYPES.timing.map(t => ({ ...t, type: t.category === 'delay' ? 'delay' as const : 'split' as const })),
];

const getNodeName = (subType: string): string => {
    const all = getAllNodeTypes();
    return all.find(n => n.id === subType)?.name || subType;
};

const getNodeCategory = (subType: string): string => {
    const all = getAllNodeTypes();
    return all.find(n => n.id === subType)?.category || 'other';
};

// ============================================
// SPREADSHEET COLUMN DEFINITIONS
// ============================================

const DEFAULT_COLUMNS: SpreadsheetColumn[] = [
    { id: 'stepOrder', label: 'Step', type: 'number', width: 60, editable: false, sortable: true },
    {
        id: 'nodeType', label: 'Type', type: 'select', width: 100, editable: true, sortable: true, filterable: true,
        options: [
            { value: 'trigger', label: 'Trigger' },
            { value: 'action', label: 'Action' },
            { value: 'condition', label: 'Condition' },
            { value: 'delay', label: 'Delay' },
            { value: 'split', label: 'Split' },
        ]
    },
    { id: 'subType', label: 'Node', type: 'select', width: 160, editable: true, sortable: true, filterable: true, options: [] },
    { id: 'name', label: 'Name/Label', type: 'text', width: 180, editable: true, sortable: true },
    { id: 'description', label: 'Description', type: 'text', width: 220, editable: true },
    { id: 'delayValue', label: 'Delay', type: 'number', width: 80, editable: true },
    {
        id: 'delayUnit', label: 'Unit', type: 'select', width: 100, editable: true,
        options: [
            { value: 'minutes', label: 'Minutes' },
            { value: 'hours', label: 'Hours' },
            { value: 'days', label: 'Days' },
        ]
    },
    { id: 'templateName', label: 'Template', type: 'text', width: 150, editable: false },
    { id: 'tagName', label: 'Tag', type: 'text', width: 120, editable: true },
    { id: 'condition', label: 'Condition', type: 'text', width: 180, editable: true },
    { id: 'connectedTo', label: 'Connected To', type: 'connection', width: 140, editable: false },
    { id: 'status', label: 'Status', type: 'boolean', width: 80, editable: true },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

const generateRowId = () => `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateNodeId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const flowNodesToRows = (nodes: FlowNode[], flowId: number | null): SpreadsheetRow[] => {
    return nodes.map((node, index) => ({
        id: generateRowId(),
        flowId,
        stepOrder: index + 1,
        nodeId: node.id,
        nodeType: node.type,
        subType: node.subType,
        name: node.data.label || getNodeName(node.subType),
        description: node.data.description || '',
        delayValue: node.data.delay || node.data.delayValue || null,
        delayUnit: node.data.delayUnit || null,
        templateId: node.data.templateId || null,
        templateName: node.data.templateName || null,
        tagName: node.data.tagName || node.data.tags?.join(', ') || null,
        condition: node.data.condition || node.data.conditionExpression || null,
        connectedTo: node.connections,
        status: node.data.disabled ? 'disabled' : 'enabled',
        data: node.data,
        isNew: false,
        isModified: false,
    }));
};

const rowsToFlowNodes = (rows: SpreadsheetRow[]): FlowNode[] => {
    const VERTICAL_SPACING = 120;
    const START_Y = 100;

    return rows.map((row, index) => ({
        id: row.nodeId,
        type: row.nodeType,
        subType: row.subType,
        position: { x: 250, y: START_Y + (index * VERTICAL_SPACING) },
        data: {
            ...row.data,
            label: row.name,
            description: row.description,
            delay: row.delayValue,
            delayValue: row.delayValue,
            delayUnit: row.delayUnit,
            templateId: row.templateId,
            templateName: row.templateName,
            tagName: row.tagName,
            tags: row.tagName ? row.tagName.split(',').map(t => t.trim()) : [],
            condition: row.condition,
            conditionExpression: row.condition,
            disabled: row.status === 'disabled',
        },
        connections: row.connectedTo,
    }));
};

// ============================================
// MAIN COMPONENT
// ============================================

const AutomationSpreadsheetView: React.FC<AutomationSpreadsheetViewProps> = ({
    flowId,
    initialFlow,
    onSave,
    onClose,
    mode = 'standalone',
    syncEnabled = true,
    onSyncChange,
}) => {
    const navigate = useNavigate();
    const { toast: toastHook } = useToast();

    // ==================== STATE ====================
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [flow, setFlow] = useState<Flow | null>(null);
    const [rows, setRows] = useState<SpreadsheetRow[]>([]);
    const [columns, setColumns] = useState<SpreadsheetColumn[]>(DEFAULT_COLUMNS);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [sortColumn, setSortColumn] = useState<string | null>('stepOrder');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [history, setHistory] = useState<SpreadsheetRow[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isAddNodeDialogOpen, setIsAddNodeDialogOpen] = useState(false);
    const [newNodeType, setNewNodeType] = useState<'trigger' | 'action' | 'condition' | 'delay' | 'split'>('action');
    const [newNodeSubType, setNewNodeSubType] = useState('');
    const [isRealTimeSync, setIsRealTimeSync] = useState(syncEnabled);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [importData, setImportData] = useState('');

    const tableRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // ==================== DATA LOADING ====================

    const loadFlow = useCallback(async () => {
        // If initialFlow is provided (embedded mode), use it instead of fetching
        if (initialFlow && mode === 'embedded') {
            setFlow(initialFlow);
            const nodesArray = Array.isArray(initialFlow.nodes)
                ? initialFlow.nodes
                : (typeof initialFlow.nodes === 'string' ? JSON.parse(initialFlow.nodes) : []);
            setRows(flowNodesToRows(nodesArray, initialFlow.id || null));
            saveToHistory(flowNodesToRows(nodesArray, initialFlow.id || null));
            setLoading(false);
            return;
        }

        if (!flowId) {
            // Create new flow
            const newFlow: Flow = {
                name: 'New Automation',
                description: '',
                status: 'draft',
                nodes: [],
            };
            setFlow(newFlow);
            setRows([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await api.get(`/flows/${flowId}`);
            const flowData = (response.data as any).flow || response.data as Flow;
            setFlow(flowData);

            const nodesArray = Array.isArray(flowData.nodes)
                ? flowData.nodes
                : (typeof flowData.nodes === 'string' ? JSON.parse(flowData.nodes) : []);

            setRows(flowNodesToRows(nodesArray, flowData.id || null));
            saveToHistory(flowNodesToRows(nodesArray, flowData.id || null));
        } catch (error) {
            console.error('Error loading flow:', error);
            toast.error('Failed to load automation');
        } finally {
            setLoading(false);
        }
    }, [flowId, initialFlow, mode]);

    useEffect(() => {
        loadFlow();
    }, [loadFlow]);

    // ==================== HISTORY MANAGEMENT ====================

    const saveToHistory = useCallback((newRows: SpreadsheetRow[]) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push([...newRows]);
            return newHistory.slice(-50); // Keep last 50 states
        });
        setHistoryIndex(prev => Math.min(prev + 1, 49));
    }, [historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            setRows(history[historyIndex - 1]);
            setHasUnsavedChanges(true);
        }
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prev => prev + 1);
            setRows(history[historyIndex + 1]);
            setHasUnsavedChanges(true);
        }
    }, [history, historyIndex]);

    // ==================== ROW OPERATIONS ====================

    const updateRow = useCallback((rowId: string, columnId: string, value: any) => {
        setRows(prev => {
            const newRows = prev.map(row => {
                if (row.id === rowId) {
                    return { ...row, [columnId]: value, isModified: true };
                }
                return row;
            });
            saveToHistory(newRows);
            setHasUnsavedChanges(true);

            // Real-time sync to parent in embedded mode
            if (isRealTimeSync && mode === 'embedded' && onSave && flow) {
                const nodes = rowsToFlowNodes(newRows);
                onSave({ ...flow, nodes });
            }

            return newRows;
        });

        // Real-time sync notification
        if (isRealTimeSync) {
            toast.info('Change synced to Flow Builder', { duration: 1000 });
        }
    }, [isRealTimeSync, saveToHistory, mode, onSave, flow]);

    const addRow = useCallback((afterRowId?: string) => {
        const nodeTypes = getAllNodeTypes().filter(n => n.type === newNodeType);
        const subType = newNodeSubType || (nodeTypes.length > 0 ? nodeTypes[0].id : 'send_email');

        const newRow: SpreadsheetRow = {
            id: generateRowId(),
            flowId: flow?.id || null,
            stepOrder: rows.length + 1,
            nodeId: generateNodeId(),
            nodeType: newNodeType,
            subType,
            name: getNodeName(subType),
            description: '',
            delayValue: newNodeType === 'delay' ? 1 : null,
            delayUnit: newNodeType === 'delay' ? 'hours' : null,
            templateId: null,
            templateName: null,
            tagName: null,
            condition: null,
            connectedTo: [],
            status: 'enabled',
            data: {},
            isNew: true,
            isModified: true,
        };

        setRows(prev => {
            let newRows: SpreadsheetRow[];
            if (afterRowId) {
                const index = prev.findIndex(r => r.id === afterRowId);
                newRows = [...prev.slice(0, index + 1), newRow, ...prev.slice(index + 1)];
            } else {
                newRows = [...prev, newRow];
            }
            // Reorder step numbers
            newRows = newRows.map((r, i) => ({ ...r, stepOrder: i + 1 }));
            saveToHistory(newRows);

            // Real-time sync to parent in embedded mode
            if (isRealTimeSync && mode === 'embedded' && onSave && flow) {
                const nodes = rowsToFlowNodes(newRows);
                onSave({ ...flow, nodes });
            }

            return newRows;
        });

        setHasUnsavedChanges(true);
        setIsAddNodeDialogOpen(false);
        setNewNodeSubType('');
        toast.success('Node added');
    }, [flow, rows.length, newNodeType, newNodeSubType, saveToHistory, isRealTimeSync, mode, onSave]);

    const deleteRows = useCallback((rowIds: string[]) => {
        setRows(prev => {
            const newRows = prev.filter(r => !rowIds.includes(r.id));
            // Reorder step numbers
            const reordered = newRows.map((r, i) => ({ ...r, stepOrder: i + 1 }));
            saveToHistory(reordered);

            // Real-time sync to parent in embedded mode
            if (isRealTimeSync && mode === 'embedded' && onSave && flow) {
                const nodes = rowsToFlowNodes(reordered);
                onSave({ ...flow, nodes });
            }

            return reordered;
        });
        setSelectedRows(new Set());
        setHasUnsavedChanges(true);
        toast.success(`${rowIds.length} node(s) deleted`);
    }, [saveToHistory, isRealTimeSync, mode, onSave, flow]);

    const duplicateRows = useCallback((rowIds: string[]) => {
        setRows(prev => {
            const newRows = [...prev];
            rowIds.forEach(id => {
                const row = prev.find(r => r.id === id);
                if (row) {
                    const duplicate: SpreadsheetRow = {
                        ...row,
                        id: generateRowId(),
                        nodeId: generateNodeId(),
                        name: `${row.name} (Copy)`,
                        isNew: true,
                        isModified: true,
                    };
                    const index = newRows.findIndex(r => r.id === id);
                    newRows.splice(index + 1, 0, duplicate);
                }
            });
            // Reorder step numbers
            const reordered = newRows.map((r, i) => ({ ...r, stepOrder: i + 1 }));
            saveToHistory(reordered);

            // Real-time sync to parent in embedded mode
            if (isRealTimeSync && mode === 'embedded' && onSave && flow) {
                const nodes = rowsToFlowNodes(reordered);
                onSave({ ...flow, nodes });
            }

            return reordered;
        });
        setHasUnsavedChanges(true);
        toast.success(`${rowIds.length} node(s) duplicated`);
    }, [saveToHistory, isRealTimeSync, mode, onSave, flow]);

    const moveRow = useCallback((rowId: string, direction: 'up' | 'down') => {
        setRows(prev => {
            const index = prev.findIndex(r => r.id === rowId);
            if ((direction === 'up' && index === 0) || (direction === 'down' && index === prev.length - 1)) {
                return prev;
            }

            const newRows = [...prev];
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            [newRows[index], newRows[newIndex]] = [newRows[newIndex], newRows[index]];

            // Reorder step numbers
            const reordered = newRows.map((r, i) => ({ ...r, stepOrder: i + 1, isModified: true }));
            saveToHistory(reordered);

            // Real-time sync to parent in embedded mode
            if (isRealTimeSync && mode === 'embedded' && onSave && flow) {
                const nodes = rowsToFlowNodes(reordered);
                onSave({ ...flow, nodes });
            }

            return reordered;
        });
        setHasUnsavedChanges(true);
    }, [saveToHistory, isRealTimeSync, mode, onSave, flow]);

    // ==================== SAVE OPERATIONS ====================

    const saveFlow = useCallback(async () => {
        if (!flow) return;

        try {
            setSaving(true);
            const nodes = rowsToFlowNodes(rows);

            const flowData = {
                ...flow,
                nodes,
            };

            if (flow.id) {
                await api.put(`/flows/${flow.id}`, flowData);
                toast.success('Automation saved successfully');
            } else {
                const response = await api.post('/flows', flowData);
                const newFlow = (response.data as any).flow || response.data;
                setFlow(newFlow);
                toast.success('Automation created successfully');

                // Navigate to the new flow if in standalone mode
                if (mode === 'standalone' && newFlow.id) {
                    navigate(`/automations/flows/${newFlow.id}?view=spreadsheet`, { replace: true });
                }
            }

            setHasUnsavedChanges(false);
            setRows(prev => prev.map(r => ({ ...r, isNew: false, isModified: false })));

            if (onSave) {
                onSave({ ...flow, nodes });
            }
        } catch (error) {
            console.error('Error saving flow:', error);
            toast.error('Failed to save automation');
        } finally {
            setSaving(false);
        }
    }, [flow, rows, mode, navigate, onSave]);

    // ==================== FILTERING & SORTING ====================

    const filteredAndSortedRows = useMemo(() => {
        let result = [...rows];

        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(row =>
                row.name.toLowerCase().includes(query) ||
                row.description.toLowerCase().includes(query) ||
                row.subType.toLowerCase().includes(query) ||
                getNodeName(row.subType).toLowerCase().includes(query)
            );
        }

        // Apply filters
        Object.entries(filters).forEach(([columnId, filterValue]) => {
            if (filterValue) {
                result = result.filter(row => {
                    const value = row[columnId as keyof SpreadsheetRow];
                    return String(value).toLowerCase().includes(filterValue.toLowerCase());
                });
            }
        });

        // Apply sorting
        if (sortColumn) {
            result.sort((a, b) => {
                const aValue = a[sortColumn as keyof SpreadsheetRow];
                const bValue = b[sortColumn as keyof SpreadsheetRow];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
                }

                const comparison = String(aValue).localeCompare(String(bValue));
                return sortDirection === 'asc' ? comparison : -comparison;
            });
        }

        return result;
    }, [rows, searchQuery, filters, sortColumn, sortDirection]);

    // ==================== CELL EDITING ====================

    const startEdit = useCallback((rowId: string, columnId: string) => {
        const column = columns.find(c => c.id === columnId);
        if (!column?.editable) return;

        const row = rows.find(r => r.id === rowId);
        if (!row) return;

        setEditingCell({ rowId, columnId });
        setEditValue(String(row[columnId as keyof SpreadsheetRow] || ''));
    }, [columns, rows]);

    const saveEdit = useCallback(() => {
        if (!editingCell) return;

        const { rowId, columnId } = editingCell;
        const column = columns.find(c => c.id === columnId);

        let value: any = editValue;
        if (column?.type === 'number') {
            value = editValue === '' ? null : Number(editValue);
        } else if (column?.type === 'boolean') {
            value = editValue === 'true' || editValue === 'enabled' ? 'enabled' : 'disabled';
        }

        updateRow(rowId, columnId, value);
        setEditingCell(null);
        setEditValue('');
    }, [editingCell, editValue, columns, updateRow]);

    const cancelEdit = useCallback(() => {
        setEditingCell(null);
        setEditValue('');
    }, []);

    useEffect(() => {
        if (editingCell && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingCell]);

    // ==================== KEYBOARD SHORTCUTS ====================

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (editingCell) {
                if (e.key === 'Enter') {
                    saveEdit();
                } else if (e.key === 'Escape') {
                    cancelEdit();
                }
                return;
            }

            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        saveFlow();
                        break;
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            redo();
                        } else {
                            undo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        redo();
                        break;
                    case 'a':
                        e.preventDefault();
                        setSelectedRows(new Set(rows.map(r => r.id)));
                        break;
                }
            }

            if (e.key === 'Delete' && selectedRows.size > 0) {
                deleteRows(Array.from(selectedRows));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editingCell, saveEdit, cancelEdit, saveFlow, undo, redo, rows, selectedRows, deleteRows]);

    // ==================== IMPORT/EXPORT ====================

    const exportToCSV = useCallback(() => {
        const headers = columns.map(c => c.label).join(',');
        const csvRows = filteredAndSortedRows.map(row =>
            columns.map(col => {
                const value = row[col.id as keyof SpreadsheetRow];
                if (Array.isArray(value)) return `"${value.join('; ')}"`;
                if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
                return value ?? '';
            }).join(',')
        );

        const csv = [headers, ...csvRows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${flow?.name || 'automation'}_spreadsheet.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success('Exported to CSV');
    }, [columns, filteredAndSortedRows, flow?.name]);

    const exportToJSON = useCallback(() => {
        const nodes = rowsToFlowNodes(rows);
        const exportData = {
            name: flow?.name || 'Automation',
            description: flow?.description || '',
            nodes,
            exportedAt: new Date().toISOString(),
        };

        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${flow?.name || 'automation'}.json`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success('Exported to JSON');
    }, [rows, flow]);

    const handleImport = useCallback(() => {
        try {
            const data = JSON.parse(importData);
            if (data.nodes && Array.isArray(data.nodes)) {
                const importedRows = flowNodesToRows(data.nodes, flow?.id || null);
                setRows(prev => [...prev, ...importedRows].map((r, i) => ({ ...r, stepOrder: i + 1 })));
                saveToHistory(rows);
                setHasUnsavedChanges(true);
                toast.success('Nodes imported successfully');
            } else {
                toast.error('Invalid import format');
            }
        } catch (error) {
            toast.error('Failed to parse import data');
        }
        setImportDialogOpen(false);
        setImportData('');
    }, [importData, flow?.id, rows, saveToHistory]);

    // ==================== RENDER HELPERS ====================

    const getNodeTypeIcon = (type: string) => {
        switch (type) {
            case 'trigger': return <Zap className="h-4 w-4 text-green-500" />;
            case 'action': return <Play className="h-4 w-4 text-blue-500" />;
            case 'condition': return <GitBranch className="h-4 w-4 text-yellow-500" />;
            case 'delay': return <Timer className="h-4 w-4 text-gray-500" />;
            case 'split': return <Split className="h-4 w-4 text-pink-500" />;
            default: return <Zap className="h-4 w-4" />;
        }
    };

    const getSubTypeOptions = (type: string) => {
        switch (type) {
            case 'trigger': return NODE_TYPES.triggers;
            case 'action': return NODE_TYPES.actions;
            case 'condition': return NODE_TYPES.conditions;
            case 'delay':
            case 'split': return NODE_TYPES.timing;
            default: return [];
        }
    };

    const renderCell = (row: SpreadsheetRow, column: SpreadsheetColumn) => {
        const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id;
        const value = row[column.id as keyof SpreadsheetRow];

        if (isEditing) {
            if (column.type === 'select' && column.options) {
                return (
                    <Select value={editValue} onValueChange={(v) => { setEditValue(v); }}>
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {column.id === 'subType'
                                ? getSubTypeOptions(row.nodeType).map(opt => (
                                    <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                                ))
                                : column.options.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))
                            }
                        </SelectContent>
                    </Select>
                );
            }

            return (
                <Input
                    ref={inputRef}
                    className="h-8"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                    }}
                />
            );
        }

        // Render based on column type
        switch (column.id) {
            case 'stepOrder':
                return <span className="font-mono text-muted-foreground">{value}</span>;

            case 'nodeType':
                return (
                    <div className="flex items-center gap-2">
                        {getNodeTypeIcon(String(value))}
                        <span className="capitalize">{value}</span>
                    </div>
                );

            case 'subType':
                return (
                    <Badge variant="outline" className="font-normal">
                        {getNodeName(String(value))}
                    </Badge>
                );

            case 'status':
                return (
                    <Switch
                        checked={value === 'enabled'}
                        onCheckedChange={(checked) => updateRow(row.id, 'status', checked ? 'enabled' : 'disabled')}
                    />
                );

            case 'connectedTo':
                const connections = value as string[];
                if (!connections || connections.length === 0) {
                    return <span className="text-muted-foreground text-xs">No connections</span>;
                }
                return (
                    <div className="flex gap-1 flex-wrap">
                        {connections.map((c, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                                Step {rows.findIndex(r => r.nodeId === c) + 1}
                            </Badge>
                        ))}
                    </div>
                );

            case 'delayValue':
                if (row.nodeType !== 'delay' && !['wait', 'wait_until', 'smart_delay'].includes(row.subType)) {
                    return <span className="text-muted-foreground">-</span>;
                }
                return value || '';

            case 'delayUnit':
                if (row.nodeType !== 'delay' && !['wait', 'wait_until', 'smart_delay'].includes(row.subType)) {
                    return <span className="text-muted-foreground">-</span>;
                }
                return value ? <Badge variant="outline">{value}</Badge> : '';

            default:
                return value ?? '';
        }
    };

    // ==================== LOADING STATE ====================

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading automation...</p>
                </div>
            </div>
        );
    }

    // ==================== MAIN RENDER ====================

    return (
        <div className="flex flex-col h-full">
            {/* Header - Only show in standalone mode, embedded mode uses parent header */}
            {mode === 'standalone' && (
                <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold">{flow?.name || 'New Automation'}</h2>
                            {hasUnsavedChanges && (
                                <Badge variant="outline" className="text-orange-500 border-orange-500">
                                    Unsaved
                                </Badge>
                            )}
                        </div>

                        <Separator orientation="vertical" className="h-6" />

                        <div className="flex items-center gap-2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex <= 0}>
                                            <Undo className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
                                            <Redo className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Real-time Sync Toggle */}
                        <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md">
                            <RefreshCw className={`h-4 w-4 ${isRealTimeSync ? 'text-green-500 animate-spin' : 'text-muted-foreground'}`} style={{ animationDuration: '3s' }} />
                            <span className="text-sm">Real-time Sync</span>
                            <Switch
                                checked={isRealTimeSync}
                                onCheckedChange={(checked) => {
                                    setIsRealTimeSync(checked);
                                    onSyncChange?.(checked);
                                }}
                            />
                        </div>

                        <Separator orientation="vertical" className="h-6" />

                        {/* Export/Import */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={exportToCSV}>
                                    <TableProperties className="h-4 w-4 mr-2" />
                                    Export as CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={exportToJSON}>
                                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                                    Export as JSON
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
                            <Upload className="h-4 w-4 mr-2" />
                            Import
                        </Button>

                        <Separator orientation="vertical" className="h-6" />

                        {/* View Toggle */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(flowId ? `/automations/flows/${flowId}` : '/automations/flows/new')}
                        >
                            <Workflow className="h-4 w-4 mr-2" />
                            Visual Builder
                        </Button>

                        {/* Save Button */}
                        <Button onClick={saveFlow} disabled={saving || !hasUnsavedChanges}>
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center gap-4 p-4 border-b">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search nodes..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Button onClick={() => setIsAddNodeDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Node
                </Button>

                {selectedRows.size > 0 && (
                    <>
                        <Separator orientation="vertical" className="h-6" />
                        <span className="text-sm text-muted-foreground">{selectedRows.size} selected</span>
                        <Button variant="outline" size="sm" onClick={() => duplicateRows(Array.from(selectedRows))}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteRows(Array.from(selectedRows))}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    </>
                )}
            </div>

            {/* Spreadsheet */}
            <ScrollArea className="flex-1" ref={tableRef}>
                <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                            <TableHead className="w-10">
                                <Checkbox
                                    checked={selectedRows.size === rows.length && rows.length > 0}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedRows(new Set(rows.map(r => r.id)));
                                        } else {
                                            setSelectedRows(new Set());
                                        }
                                    }}
                                />
                            </TableHead>
                            <TableHead className="w-20"></TableHead>
                            {columns.filter(c => c.visible !== false).map(column => (
                                <TableHead
                                    key={column.id}
                                    style={{ width: column.width, minWidth: column.minWidth }}
                                    className={column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''}
                                    onClick={() => {
                                        if (column.sortable) {
                                            if (sortColumn === column.id) {
                                                setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                                            } else {
                                                setSortColumn(column.id);
                                                setSortDirection('asc');
                                            }
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        {column.label}
                                        {column.sortable && sortColumn === column.id && (
                                            sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                                        )}
                                    </div>
                                </TableHead>
                            ))}
                            <TableHead className="w-20">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + 3} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center gap-4">
                                        <Grid3X3 className="h-12 w-12 text-muted-foreground" />
                                        <div>
                                            <p className="text-lg font-medium">No nodes yet</p>
                                            <p className="text-sm text-muted-foreground">Add your first node to get started</p>
                                        </div>
                                        <Button onClick={() => setIsAddNodeDialogOpen(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Node
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSortedRows.map((row, index) => (
                                <TableRow
                                    key={row.id}
                                    className={`
                    ${selectedRows.has(row.id) ? 'bg-primary/5' : ''}
                    ${row.isNew ? 'bg-green-50 dark:bg-green-900/10' : ''}
                    ${row.isModified ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}
                    hover:bg-muted/50
                  `}
                                >
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedRows.has(row.id)}
                                            onCheckedChange={(checked) => {
                                                const newSelected = new Set(selectedRows);
                                                if (checked) {
                                                    newSelected.add(row.id);
                                                } else {
                                                    newSelected.delete(row.id);
                                                }
                                                setSelectedRows(newSelected);
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => moveRow(row.id, 'up')}
                                                disabled={index === 0}
                                            >
                                                <ChevronUp className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => moveRow(row.id, 'down')}
                                                disabled={index === filteredAndSortedRows.length - 1}
                                            >
                                                <ChevronDown className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    {columns.filter(c => c.visible !== false).map(column => (
                                        <TableCell
                                            key={column.id}
                                            className={column.editable ? 'cursor-pointer hover:bg-muted/30' : ''}
                                            onClick={() => column.editable && startEdit(row.id, column.id)}
                                        >
                                            {renderCell(row, column)}
                                        </TableCell>
                                    ))}
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => {
                                                    const newRows = [...rows];
                                                    setNewNodeType('action');
                                                    setIsAddNodeDialogOpen(true);
                                                }}>
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Insert After
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => duplicateRows([row.id])}>
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    Duplicate
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => navigate(flowId ? `/automations/flows/${flowId}?node=${row.nodeId}` : '#')}
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Open in Flow Builder
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => deleteRows([row.id])}
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
                <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* Status Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                    <span>{rows.length} node(s)</span>
                    <span>•</span>
                    <span>{rows.filter(r => r.nodeType === 'trigger').length} trigger(s)</span>
                    <span>{rows.filter(r => r.nodeType === 'action').length} action(s)</span>
                    <span>{rows.filter(r => r.nodeType === 'condition').length} condition(s)</span>
                </div>
                <div className="flex items-center gap-2">
                    {isRealTimeSync && (
                        <Badge variant="outline" className="text-green-500 border-green-500">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Synced with Flow Builder
                        </Badge>
                    )}
                    {flow?.updated_at && (
                        <span>Last saved: {new Date(flow.updated_at).toLocaleString()}</span>
                    )}
                </div>
            </div>

            {/* Add Node Dialog */}
            <Dialog open={isAddNodeDialogOpen} onOpenChange={setIsAddNodeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Node</DialogTitle>
                        <DialogDescription>Select the type of node to add to your automation</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Node Type</Label>
                            <Select value={newNodeType} onValueChange={(v) => { setNewNodeType(v as any); setNewNodeSubType(''); }}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="trigger">
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-green-500" />
                                            Trigger
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="action">
                                        <div className="flex items-center gap-2">
                                            <Play className="h-4 w-4 text-blue-500" />
                                            Action
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="condition">
                                        <div className="flex items-center gap-2">
                                            <GitBranch className="h-4 w-4 text-yellow-500" />
                                            Condition
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="delay">
                                        <div className="flex items-center gap-2">
                                            <Timer className="h-4 w-4 text-gray-500" />
                                            Delay
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="split">
                                        <div className="flex items-center gap-2">
                                            <Split className="h-4 w-4 text-pink-500" />
                                            Split
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Specific Node</Label>
                            <Select value={newNodeSubType} onValueChange={setNewNodeSubType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a node..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {getSubTypeOptions(newNodeType).map(opt => (
                                        <SelectItem key={opt.id} value={opt.id}>
                                            {opt.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddNodeDialogOpen(false)}>Cancel</Button>
                        <Button onClick={() => addRow()}>Add Node</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Import Dialog */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Import Nodes</DialogTitle>
                        <DialogDescription>Paste JSON data to import nodes</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <Textarea
                            placeholder='{"nodes": [...]}'
                            rows={8}
                            value={importData}
                            onChange={(e) => setImportData(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleImport}>Import</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AutomationSpreadsheetView;
