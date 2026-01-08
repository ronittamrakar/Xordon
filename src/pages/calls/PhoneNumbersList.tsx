import React, { useState, useEffect } from 'react';
// Force reload: PhoneNumbersList

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Phone, Settings, Plus, Search, RefreshCw, Trash2, ArrowUpDown, LayoutList, LayoutGrid, Forward, Mic, Radio, Archive, Columns, Check, X, Edit2, MoreVertical, PhoneForwarded, CircleDot, ArrowRight, Bot, FileCode, Volume2, VolumeX, MessageSquare, MessageSquareX } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface PhoneNumber {
    id: number;
    phone_number: string;
    friendly_name: string;
    provider: string;
    country_code: string;
    capabilities: {
        voice: boolean;
        sms: boolean;
        mms: boolean;
    };
    type: string;
    status: string;
    monthly_cost: number;
    is_primary: boolean;
    voice_enabled: boolean;
    sms_enabled: boolean;
    purchased_at: string;
    // Configuration fields
    forwarding_number?: string;
    pass_call_id?: boolean;
    whisper_message?: string;
    call_recording?: boolean;
    tracking_campaign?: string;
    destination_type?: 'forward' | 'voice_bot' | 'application' | 'ivr_flow';
    voicemail_greeting?: string;
    call_flow_id?: number;
}

export default function PhoneNumbersList() {
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [sortField, setSortField] = useState<keyof PhoneNumber>('phone_number');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Column visibility with persistence
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
        const saved = localStorage.getItem('phone_numbers_columns_v1');
        return saved ? JSON.parse(saved) : {
            phone_number: true,
            friendly_name: true,
            provider: true,
            type: true,
            capabilities: true,
            status: true,
            monthly_cost: true,
            voice_enabled: true,
            sms_enabled: true,
            forwarding_number: true,
            destination_type: true,
            tracking_campaign: false,
            call_recording: true,
            pass_call_id: false,
            whisper_message: false,
            voicemail_greeting: false,
        };
    });

    // Save columns whenever they change
    useEffect(() => {
        localStorage.setItem('phone_numbers_columns_v1', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    const columns = [
        { id: 'phone_number', label: 'Number', editable: false },
        { id: 'friendly_name', label: 'Friendly Name', editable: true },
        { id: 'provider', label: 'Provider', editable: false },
        { id: 'type', label: 'Type', editable: false },
        { id: 'capabilities', label: 'Capabilities', editable: false },
        { id: 'status', label: 'Status', editable: false },
        { id: 'monthly_cost', label: 'Cost', editable: false },
        { id: 'voice_enabled', label: 'Voice Enabled', editable: true },
        { id: 'sms_enabled', label: 'SMS Enabled', editable: true },
        { id: 'forwarding_number', label: 'Forwarding To', editable: true },
        { id: 'destination_type', label: 'Destination', editable: true },
        { id: 'tracking_campaign', label: 'Campaign', editable: true },
        { id: 'call_recording', label: 'Recording', editable: true },
        { id: 'pass_call_id', label: 'Pass Caller ID', editable: true },
        { id: 'whisper_message', label: 'Whisper', editable: true },
        { id: 'voicemail_greeting', label: 'Voicemail', editable: true },
    ];

    // Inline editing state
    const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
    const [editValue, setEditValue] = useState<any>('');

    // Bulk actions
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
    const [bulkAction, setBulkAction] = useState<string>('');

    // Dialog states
    const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
    const [isConfigureDialogOpen, setIsConfigureDialogOpen] = useState(false);
    const [showSyncDialog, setShowSyncDialog] = useState(false);
    const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<PhoneNumber | null>(null);
    const [connections, setConnections] = useState<any[]>([]);
    const [selectedConnection, setSelectedConnection] = useState<string>('');
    const [syncing, setSyncing] = useState(false);

    // Purchase form
    const [purchaseForm, setPurchaseForm] = useState({
        area_code: '',
        country_code: 'US',
        type: 'local',
        pattern: '',
    });
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [searchStep, setSearchStep] = useState<'search' | 'results'>('search');

    const [callFlows, setCallFlows] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);


    useEffect(() => {
        loadData();
        loadConnections();
        loadCallFlows();
        loadAnalytics();
    }, []);


    const loadData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/phone-numbers');
            setPhoneNumbers((response as any)?.items || []);
        } catch (error) {
            console.error('Failed to load phone numbers:', error);
            toast.error('Failed to load phone numbers');
        } finally {
            setLoading(false);
        }
    };

    const loadConnections = async () => {
        try {
            const response = await api.get('/connections');
            const allConnections = Array.isArray(response) ? response : (response as any).data || [];

            const signalwireConnections = allConnections.filter(
                (c: any) => c.provider === 'signalwire' && c.status === 'active'
            );

            // Deduplicate by Project ID, preferring workspace-specific connections
            const uniqueConnections = Object.values(
                signalwireConnections.reduce((acc: Record<string, any>, conn: any) => {
                    const projectId = conn.config?.projectId;

                    // If no existing entry, or if current is workspace-specific and existing is not
                    if (projectId && (!acc[projectId] || (conn.workspace_id && !acc[projectId].workspace_id))) {
                        acc[projectId] = conn;
                    }
                    return acc;
                }, {})
            );

            setConnections(uniqueConnections);
        } catch (error) {
            console.error('Failed to load connections:', error);
        }
    };

    const loadCallFlows = async () => {
        try {
            const response = await api.get('/call-flows');
            setCallFlows((response as any)?.items || []);
        } catch (error) {
            console.error('Failed to load call flows:', error);
        }
    };

    const loadAnalytics = async () => {
        try {
            const response = await api.get('/analytics/calls?range=7d');
            setAnalytics(response);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    };


    const syncFromConnection = async () => {
        if (!selectedConnection) {
            toast.error('Please select a connection');
            return;
        }

        setSyncing(true);
        try {
            const response = await api.post('/phone-numbers/sync-from-connection', {
                connection_id: selectedConnection
            });
            toast.success(`Synced ${(response as any).synced || 0} phone numbers`);
            setShowSyncDialog(false);
            setSelectedConnection('');
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to sync numbers');
        } finally {
            setSyncing(false);
        }
    };

    const searchNumbers = async () => {
        try {
            setSearching(true);
            const queryParams = new URLSearchParams({
                country: purchaseForm.country_code,
                area_code: purchaseForm.area_code,
                type: purchaseForm.type,
                pattern: purchaseForm.pattern,
            }).toString();

            const response = await api.get(`/phone-numbers/search?${queryParams}`);
            const results = (response as any)?.items || [];
            setSearchResults(results);
            setSearchStep('results');

            if (results.length === 0) {
                toast.info('No numbers found for the given criteria');
            }
        } catch (error: any) {
            console.error('Failed to search numbers:', error);
            const errorMessage = error?.response?.data?.error || error?.message || '';

            if (errorMessage.includes('No provider configured')) {
                toast.error('Phone provider not configured', {
                    description: 'Please connect SignalWire or Twilio in Settings > Connections, or configure credentials in your .env file.',
                    duration: 6000,
                });
            } else if (errorMessage.includes('not configured') || errorMessage.includes('not properly configured')) {
                toast.error('Phone provider configuration incomplete', {
                    description: 'Please check your SignalWire/Twilio connection in Settings > Connections or verify your .env file.',
                    duration: 6000,
                });
            } else if (errorMessage.includes('Invalid credentials')) {
                toast.error('Invalid phone provider credentials', {
                    description: 'Please verify your SignalWire/Twilio credentials in Settings > Connections.',
                    duration: 6000,
                });
            } else {
                toast.error('Failed to search available phone numbers', {
                    description: errorMessage || 'Please try again or contact support.',
                    duration: 5000,
                });
            }
        } finally {
            setSearching(false);
        }
    };

    const purchaseNumber = async (phoneNumber: string) => {
        try {
            setPurchasing(phoneNumber);
            await api.post('/phone-numbers', {
                ...purchaseForm,
                phone_number: phoneNumber,
                friendly_name: `Line ${phoneNumber}`
            });
            toast.success('Phone number purchased successfully');
            setIsPurchaseDialogOpen(false);
            setSearchStep('search');
            setSearchResults([]);
            loadData();
        } catch (error) {
            console.error('Failed to purchase number:', error);
            toast.error('Failed to purchase phone number');
        } finally {
            setPurchasing(null);
        }
    };

    const releaseNumber = async (id: number) => {
        if (!confirm('Are you sure you want to release this phone number? This action cannot be undone.')) return;
        try {
            await api.delete(`/phone-numbers/${id}`);
            toast.success('Phone number released');
            loadData();
        } catch (error) {
            toast.error('Failed to release phone number');
        }
    };

    const configureNumber = async () => {
        if (!selectedPhoneNumber) return;
        try {
            await api.put(`/phone-numbers/${selectedPhoneNumber.id}`, {
                friendly_name: selectedPhoneNumber.friendly_name,
                forwarding_number: selectedPhoneNumber.forwarding_number,
                pass_call_id: selectedPhoneNumber.pass_call_id,
                whisper_message: selectedPhoneNumber.whisper_message,
                call_recording: selectedPhoneNumber.call_recording,
                tracking_campaign: selectedPhoneNumber.tracking_campaign,
                destination_type: selectedPhoneNumber.destination_type,
                voicemail_greeting: selectedPhoneNumber.voicemail_greeting,
                call_flow_id: selectedPhoneNumber.call_flow_id,
            });
            toast.success('Phone number configured');
            setIsConfigureDialogOpen(false);
            loadData();
        } catch (error) {
            toast.error('Failed to configure phone number');
        }
    };

    // Inline editing functions
    const startEdit = (id: number, field: string, currentValue: any) => {
        setEditingCell({ id, field });
        setEditValue(currentValue || '');
    };

    const cancelEdit = () => {
        setEditingCell(null);
        setEditValue('');
    };

    const saveEdit = async () => {
        if (!editingCell) return;

        const phoneNumber = phoneNumbers.find(p => p.id === editingCell.id);
        if (!phoneNumber) return;

        try {
            const result = await api.put(`/phone-numbers/${editingCell.id}`, {
                [editingCell.field]: editValue
            });

            // Update local state
            setPhoneNumbers(prev => prev.map(p =>
                p.id === editingCell.id ? { ...p, [editingCell.field]: editValue } : p
            ));

            if ((result as any)?.provider_error) {
                toast.warning('Updated in DB but provider sync failed: ' + (result as any).provider_error);
            } else {
                toast.success('Updated successfully');
            }

            setEditingCell(null);
            setEditValue('');
        } catch (error: any) {
            console.error('Update failed:', error);
            const msg = error.response?.data?.message || error.message || 'Unknown error';
            toast.error(`Failed to update: ${msg}`);
        }
    };

    // Bulk actions
    const toggleRowSelection = (id: number) => {
        setSelectedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const toggleAllRows = () => {
        if (selectedRows.size === filteredPhoneNumbers.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(filteredPhoneNumbers.map(p => p.id)));
        }
    };

    const executeBulkAction = async () => {
        if (selectedRows.size === 0) {
            toast.error('Please select at least one number');
            return;
        }

        const ids = Array.from(selectedRows);

        try {
            switch (bulkAction) {
                case 'delete':
                    if (!confirm(`Are you sure you want to release ${ids.length} phone number(s)?`)) return;
                    await Promise.all(ids.map(id => api.delete(`/phone-numbers/${id}`)));
                    toast.success(`Released ${ids.length} phone number(s)`);
                    break;
                case 'enable_recording':
                    await api.put('/phone-numbers/bulk', {
                        ids: ids,
                        updates: { call_recording: true }
                    });
                    toast.success(`Enabled recording for ${ids.length} number(s)`);
                    break;
                case 'disable_recording':
                    await api.put('/phone-numbers/bulk', {
                        ids: ids,
                        updates: { call_recording: false }
                    });
                    toast.success(`Disabled recording for ${ids.length} number(s)`);
                    break;
                case 'enable_caller_id':
                    await api.put('/phone-numbers/bulk', {
                        ids: ids,
                        updates: { pass_call_id: true }
                    });
                    toast.success(`Enabled caller ID passthrough for ${ids.length} number(s)`);
                    break;
                case 'disable_caller_id':
                    await api.put('/phone-numbers/bulk', {
                        ids: ids,
                        updates: { pass_call_id: false }
                    });
                    toast.success(`Disabled caller ID passthrough for ${ids.length} number(s)`);
                    break;
                case 'set_forward':
                    // Open a dialog to set forwarding number
                    setBulkForwardingDialogOpen(true);
                    return; // Don't clear selection yet
                case 'set_destination_forward':
                    await api.put('/phone-numbers/bulk', {
                        ids: ids,
                        updates: { destination_type: 'forward' }
                    });
                    toast.success(`Set destination to Forward for ${ids.length} number(s)`);
                    break;
                case 'set_destination_voicebot':
                    await api.put('/phone-numbers/bulk', {
                        ids: ids,
                        updates: { destination_type: 'voice_bot' }
                    });
                    toast.success(`Set destination to Voice Bot for ${ids.length} number(s)`);
                    break;
                case 'enable_voice':
                    await api.put('/phone-numbers/bulk', {
                        ids: ids,
                        updates: { voice_enabled: true }
                    });
                    toast.success(`Enabled voice for ${ids.length} number(s)`);
                    break;
                case 'disable_voice':
                    await api.put('/phone-numbers/bulk', {
                        ids: ids,
                        updates: { voice_enabled: false }
                    });
                    toast.success(`Disabled voice for ${ids.length} number(s)`);
                    break;
                case 'enable_sms':
                    await api.put('/phone-numbers/bulk', {
                        ids: ids,
                        updates: { sms_enabled: true }
                    });
                    toast.success(`Enabled SMS for ${ids.length} number(s)`);
                    break;
                case 'disable_sms':
                    await api.put('/phone-numbers/bulk', {
                        ids: ids,
                        updates: { sms_enabled: false }
                    });
                    toast.success(`Disabled SMS for ${ids.length} number(s)`);
                    break;
            }
            setSelectedRows(new Set());
            setIsBulkActionOpen(false);
        } catch (error: any) {
            console.error('Bulk action failed:', error);
            const msg = error.response?.data?.message || error.message || 'Unknown error';
            toast.error(`Bulk action failed: ${msg}`);
        }
    };

    // Bulk forwarding dialog
    const [bulkForwardingDialogOpen, setBulkForwardingDialogOpen] = useState(false);
    const [bulkForwardingNumber, setBulkForwardingNumber] = useState('');

    const applyBulkForwarding = async () => {
        const ids = Array.from(selectedRows);
        try {
            await api.put('/phone-numbers/bulk', {
                ids: ids,
                updates: {
                    forwarding_number: bulkForwardingNumber,
                    destination_type: 'forward'
                }
            });
            toast.success(`Set forwarding number for ${ids.length} number(s)`);
            setSelectedRows(new Set());
            setBulkForwardingDialogOpen(false);
            setBulkForwardingNumber('');
            loadData();
        } catch (error) {
            toast.error('Failed to set forwarding number');
        }
    };

    const handleSort = (field: keyof PhoneNumber) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const filteredPhoneNumbers = phoneNumbers
        .filter(p =>
            p.phone_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.friendly_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];
            if (aValue === bValue) return 0;
            const comparison = aValue > bValue ? 1 : -1;
            return sortDirection === 'asc' ? comparison : -comparison;
        });

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            active: 'bg-green-100 text-green-800 hover:bg-green-100',
            inactive: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
        };
        return <Badge className={colors[status] || 'bg-gray-100 text-gray-800 hover:bg-gray-100'}>{status}</Badge>;
    };

    const renderEditableCell = (phoneNumber: PhoneNumber, field: string, value: any) => {
        const isEditing = editingCell?.id === phoneNumber.id && editingCell?.field === field;

        if (isEditing) {
            if (field === 'call_recording' || field === 'pass_call_id' || field === 'voice_enabled' || field === 'sms_enabled') {
                return (
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={editValue}
                            onCheckedChange={setEditValue}
                        />
                        <Button size="sm" variant="ghost" onClick={saveEdit}><Check className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}><X className="h-3 w-3" /></Button>
                    </div>
                );
            } else if (field === 'destination_type') {
                return (
                    <div className="flex items-center gap-2">
                        <Select value={editValue} onValueChange={setEditValue}>
                            <SelectTrigger className="h-8 w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="forward">Forward</SelectItem>
                                <SelectItem value="ivr_flow">IVR Flow</SelectItem>
                                <SelectItem value="voice_bot">Voice Bot</SelectItem>
                                <SelectItem value="application">Application</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button size="sm" variant="ghost" onClick={saveEdit}><Check className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}><X className="h-3 w-3" /></Button>
                    </div>
                );
            } else {
                return (
                    <div className="flex items-center gap-2">
                        <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') cancelEdit();
                            }}
                        />
                        <Button size="sm" variant="ghost" onClick={saveEdit}><Check className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}><X className="h-3 w-3" /></Button>
                    </div>
                );
            }
        }

        // Display mode
        const column = columns.find(c => c.id === field);
        if (!column?.editable) {
            return renderCellValue(field, value, phoneNumber);
        }

        return (
            <div
                className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded group flex items-center gap-2"
                onClick={() => startEdit(phoneNumber.id, field, value)}
            >
                {renderCellValue(field, value, phoneNumber)}
                <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 text-muted-foreground" />
            </div>
        );
    };

    const renderCellValue = (field: string, value: any, phoneNumber: PhoneNumber) => {
        switch (field) {
            case 'forwarding_number':
                return value ? (
                    <div className="flex items-center gap-1">
                        <Forward className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{value}</span>
                    </div>
                ) : <span className="text-muted-foreground text-xs">-</span>;
            case 'destination_type':
                if (value === 'ivr_flow') {
                    const flow = callFlows.find(f => f.id === phoneNumber.call_flow_id);
                    return (
                        <div className="flex items-center gap-1">
                            <FileCode className="h-3 w-3 text-purple-600" />
                            <span className="text-sm font-medium text-purple-700">{flow?.name || 'Unassigned Flow'}</span>
                        </div>
                    );
                }
                return <span className="capitalize text-sm">{value?.replace('_', ' ') || '-'}</span>;
            case 'call_recording':
                return value ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">On</Badge> : <span className="text-muted-foreground text-xs">Off</span>;
            case 'pass_call_id':
                return value ? <span className="text-xs">Yes</span> : <span className="text-muted-foreground text-xs">No</span>;
            case 'voice_enabled':
            case 'sms_enabled':
                return value ? <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">Enabled</Badge> : <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-50">Disabled</Badge>;
            case 'tracking_campaign':
            case 'whisper_message':
            case 'voicemail_greeting':
                return value ? (
                    <span className="text-xs truncate max-w-[150px] inline-block" title={value}>
                        {value}
                    </span>
                ) : <span className="text-muted-foreground text-xs">-</span>;
            default:
                return value || '-';
        }
    };

    const totalCost = phoneNumbers.reduce((sum, n) => sum + (Number(n.monthly_cost) || 0), 0);
    const primaryNumber = phoneNumbers.find(n => n.is_primary);
    const activeCount = phoneNumbers.filter(n => n.status === 'active').length;

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="flex space-x-2">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16 mb-1" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-1 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Phone Numbers</h1>
                    <p className="text-muted-foreground text-sm">Manage your business phone lines and call routing</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {selectedRows.size > 0 && (
                        <DropdownMenu open={isBulkActionOpen} onOpenChange={setIsBulkActionOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-10 border-dashed">
                                    Bulk Actions ({selectedRows.size})
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[220px]">
                                <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1.5">Recording</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => { setBulkAction('enable_recording'); executeBulkAction(); }}>
                                    <CircleDot className="h-4 w-4 mr-2 text-green-500" />
                                    Enable Recording
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setBulkAction('disable_recording'); executeBulkAction(); }}>
                                    <CircleDot className="h-4 w-4 mr-2 text-gray-400" />
                                    Disable Recording
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1.5">Caller ID</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => { setBulkAction('enable_caller_id'); executeBulkAction(); }}>
                                    <PhoneForwarded className="h-4 w-4 mr-2 text-green-500" />
                                    Enable Caller ID Passthrough
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setBulkAction('disable_caller_id'); executeBulkAction(); }}>
                                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                    Disable Caller ID Passthrough
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1.5">Capabilities</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => { setBulkAction('enable_voice'); executeBulkAction(); }}>
                                    <Volume2 className="h-4 w-4 mr-2 text-green-500" />
                                    Enable Voice
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setBulkAction('disable_voice'); executeBulkAction(); }}>
                                    <VolumeX className="h-4 w-4 mr-2 text-gray-400" />
                                    Disable Voice
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setBulkAction('enable_sms'); executeBulkAction(); }}>
                                    <MessageSquare className="h-4 w-4 mr-2 text-green-500" />
                                    Enable SMS
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setBulkAction('disable_sms'); executeBulkAction(); }}>
                                    <MessageSquareX className="h-4 w-4 mr-2 text-gray-400" />
                                    Disable SMS
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1.5">Destination</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => { setBulkAction('set_destination_forward'); executeBulkAction(); }}>
                                    <ArrowRight className="h-4 w-4 mr-2" />
                                    Set to Forward
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setBulkAction('set_destination_voicebot'); executeBulkAction(); }}>
                                    <Bot className="h-4 w-4 mr-2" />
                                    Set to Voice Bot
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setBulkAction('set_forward'); executeBulkAction(); }}>
                                    <PhoneForwarded className="h-4 w-4 mr-2" />
                                    Set Forwarding Number...
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-600" onClick={() => { setBulkAction('delete'); executeBulkAction(); }}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Release Numbers
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    <Button variant="outline" className="h-10" onClick={() => setShowSyncDialog(true)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync From Provider
                    </Button>
                    <Button className="h-10 shadow-sm" onClick={() => setIsPurchaseDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Buy Number
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-background border-blue-100/50 dark:border-blue-900/50 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-blue-600 dark:text-blue-400 font-medium">Total Numbers</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{phoneNumbers.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">{activeCount} active lines</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50/50 to-white dark:from-green-950/20 dark:to-background border-green-100/50 dark:border-green-900/50 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-green-600 dark:text-green-400 font-medium">Monthly Investment</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total recurring cost</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/20 dark:to-background border-purple-100/50 dark:border-purple-900/50 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-purple-600 dark:text-purple-400 font-medium">Total Traffic (7d)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.totalCalls || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Inbound & Outbound</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-950/20 dark:to-background border-amber-100/50 dark:border-amber-900/50 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-amber-600 dark:text-amber-400 font-medium">Avg. Answer Rate</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {analytics?.totalCalls > 0
                                ? (((analytics.totalCalls - (analytics.missedCalls || 0)) / analytics.totalCalls) * 100).toFixed(1)
                                : '0.0'}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Call completion efficiency</p>
                    </CardContent>
                </Card>
            </div>


            {phoneNumbers.length === 0 ? (
                <Card className="border-dashed py-24 flex flex-col items-center justify-center text-center">
                    <div className="bg-muted p-4 rounded-full mb-4">
                        <Phone className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-xl">No Phone Numbers Found</CardTitle>
                    <CardDescription className="max-w-md mt-2 px-6">
                        You haven't added any business phone lines yet. Buy a new number or sync from your existing providers.
                    </CardDescription>
                    <div className="flex gap-4 mt-8">
                        <Button variant="outline" onClick={() => setShowSyncDialog(true)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Sync Existing
                        </Button>
                        <Button onClick={() => setIsPurchaseDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Buy New Number
                        </Button>
                    </div>
                </Card>
            ) : (
                <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-initial">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search numbers or names..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-10 w-full sm:w-80 shadow-sm"
                                />
                            </div>
                            <div className="border rounded-md flex p-1 bg-muted/30">
                                <Button
                                    variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => setViewMode('table')}
                                >
                                    <LayoutList className="h-4 w-4 mr-1" />
                                    Table
                                </Button>
                                <Button
                                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => setViewMode('grid')}
                                >
                                    <LayoutGrid className="h-4 w-4 mr-1" />
                                    Grid
                                </Button>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-10 hidden lg:flex">
                                        <Columns className="h-4 w-4 mr-2" />
                                        Columns
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px]">
                                    <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {columns.map((column) => (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            checked={visibleColumns[column.id]}
                                            onCheckedChange={(value) =>
                                                setVisibleColumns((prev) => ({ ...prev, [column.id]: value }))
                                            }
                                        >
                                            {column.label}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {viewMode === 'table' ? (
                        <Card className="shadow-sm border-muted/60 overflow-hidden">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-12">
                                                <Checkbox
                                                    checked={selectedRows.size === filteredPhoneNumbers.length && filteredPhoneNumbers.length > 0}
                                                    onCheckedChange={toggleAllRows}
                                                />
                                            </TableHead>
                                            {visibleColumns.phone_number && (
                                                <TableHead className="cursor-pointer transition-colors" onClick={() => handleSort('phone_number')}>
                                                    <div className="flex items-center gap-1">
                                                        Number
                                                        {sortField === 'phone_number' ? (
                                                            sortDirection === 'asc' ? <ArrowUpDown className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5 rotate-180" />
                                                        ) : (
                                                            <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                                                        )}
                                                    </div>
                                                </TableHead>
                                            )}
                                            {visibleColumns.friendly_name && (
                                                <TableHead className="cursor-pointer" onClick={() => handleSort('friendly_name')}>
                                                    <div className="flex items-center">
                                                        Friendly Name
                                                        {sortField === 'friendly_name' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                                    </div>
                                                </TableHead>
                                            )}
                                            {visibleColumns.provider && (
                                                <TableHead className="cursor-pointer" onClick={() => handleSort('provider')}>
                                                    <div className="flex items-center">
                                                        Provider
                                                        {sortField === 'provider' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                                    </div>
                                                </TableHead>
                                            )}
                                            {visibleColumns.type && <TableHead>Type</TableHead>}
                                            {visibleColumns.capabilities && <TableHead>Capabilities</TableHead>}
                                            {visibleColumns.status && (
                                                <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                                                    <div className="flex items-center">
                                                        Status
                                                        {sortField === 'status' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                                    </div>
                                                </TableHead>
                                            )}
                                            {visibleColumns.monthly_cost && (
                                                <TableHead className="cursor-pointer" onClick={() => handleSort('monthly_cost')}>
                                                    <div className="flex items-center">
                                                        Cost
                                                        {sortField === 'monthly_cost' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                                    </div>
                                                </TableHead>
                                            )}
                                            {visibleColumns.forwarding_number && <TableHead>Forwarding To</TableHead>}
                                            {visibleColumns.destination_type && <TableHead>Destination</TableHead>}
                                            {visibleColumns.tracking_campaign && <TableHead>Campaign</TableHead>}
                                            {visibleColumns.call_recording && <TableHead>Recording</TableHead>}
                                            {visibleColumns.pass_call_id && <TableHead>Pass Caller ID</TableHead>}
                                            {visibleColumns.whisper_message && <TableHead>Whisper</TableHead>}
                                            {visibleColumns.voicemail_greeting && <TableHead>Voicemail</TableHead>}
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredPhoneNumbers.map((phoneNumber) => (
                                            <TableRow key={phoneNumber.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedRows.has(phoneNumber.id)}
                                                        onCheckedChange={() => toggleRowSelection(phoneNumber.id)}
                                                    />
                                                </TableCell>
                                                {visibleColumns.phone_number && <TableCell className="font-medium">{phoneNumber.phone_number}</TableCell>}
                                                {visibleColumns.friendly_name && <TableCell>{renderEditableCell(phoneNumber, 'friendly_name', phoneNumber.friendly_name)}</TableCell>}
                                                {visibleColumns.provider && <TableCell className="capitalize">{phoneNumber.provider}</TableCell>}
                                                {visibleColumns.type && <TableCell className="capitalize">{phoneNumber.type}</TableCell>}
                                                {visibleColumns.capabilities && (
                                                    <TableCell>
                                                        <div className="flex space-x-1">
                                                            {phoneNumber.capabilities.voice && <Badge variant="outline" className="text-xs">Voice</Badge>}
                                                            {phoneNumber.capabilities.sms && <Badge variant="outline" className="text-xs">SMS</Badge>}
                                                            {phoneNumber.capabilities.mms && <Badge variant="outline" className="text-xs">MMS</Badge>}
                                                        </div>
                                                    </TableCell>
                                                )}
                                                {visibleColumns.status && <TableCell>{getStatusBadge(phoneNumber.status)}</TableCell>}
                                                {visibleColumns.monthly_cost && <TableCell>${phoneNumber.monthly_cost}</TableCell>}

                                                {visibleColumns.forwarding_number && <TableCell>{renderEditableCell(phoneNumber, 'forwarding_number', phoneNumber.forwarding_number)}</TableCell>}
                                                {visibleColumns.destination_type && <TableCell>{renderEditableCell(phoneNumber, 'destination_type', phoneNumber.destination_type)}</TableCell>}
                                                {visibleColumns.tracking_campaign && <TableCell>{renderEditableCell(phoneNumber, 'tracking_campaign', phoneNumber.tracking_campaign)}</TableCell>}
                                                {visibleColumns.call_recording && <TableCell>{renderEditableCell(phoneNumber, 'call_recording', phoneNumber.call_recording)}</TableCell>}
                                                {visibleColumns.pass_call_id && <TableCell>{renderEditableCell(phoneNumber, 'pass_call_id', phoneNumber.pass_call_id)}</TableCell>}
                                                {visibleColumns.whisper_message && <TableCell>{renderEditableCell(phoneNumber, 'whisper_message', phoneNumber.whisper_message)}</TableCell>}
                                                {visibleColumns.voicemail_greeting && <TableCell>{renderEditableCell(phoneNumber, 'voicemail_greeting', phoneNumber.voicemail_greeting)}</TableCell>}

                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Button variant="ghost" size="icon" onClick={() => { setSelectedPhoneNumber(phoneNumber); setIsConfigureDialogOpen(true); }}>
                                                            <Settings className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => releaseNumber(phoneNumber.id)}>
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPhoneNumbers.map((phoneNumber) => (
                                <Card key={phoneNumber.id}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Phone className="h-4 w-4" />
                                                {getStatusBadge(phoneNumber.status)}
                                            </div>
                                            {phoneNumber.is_primary && <Badge variant="outline">Primary</Badge>}
                                        </div>
                                        <CardTitle>{phoneNumber.friendly_name}</CardTitle>
                                        <CardDescription>{phoneNumber.phone_number}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Provider:</span>
                                                <span className="font-medium">{phoneNumber.provider}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Cost:</span>
                                                <span className="font-medium">${phoneNumber.monthly_cost}/mo</span>
                                            </div>
                                            <div className="flex space-x-2">
                                                {phoneNumber.capabilities.voice && <Badge variant="outline">Voice</Badge>}
                                                {phoneNumber.capabilities.sms && <Badge variant="outline">SMS</Badge>}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedPhoneNumber(phoneNumber); setIsConfigureDialogOpen(true); }}>Configure</Button>
                                                <Button variant="outline" size="sm" className="flex-1" onClick={() => releaseNumber(phoneNumber.id)}>Release</Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Sync Dialog */}
            <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Sync Numbers from Connection</DialogTitle>
                        <DialogDescription>Import phone numbers from your SignalWire connection</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {connections.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground text-sm">
                                No active SignalWire connections found.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Select Connection</Label>
                                <Select value={selectedConnection} onValueChange={setSelectedConnection}>
                                    <SelectTrigger><SelectValue placeholder="Choose a connection" /></SelectTrigger>
                                    <SelectContent>
                                        {connections.map((conn: any) => (
                                            <SelectItem key={conn.id} value={conn.id}>{conn.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSyncDialog(false)}>Cancel</Button>
                        <Button onClick={syncFromConnection} disabled={syncing || connections.length === 0}>
                            {syncing ? 'Syncing...' : 'Sync Numbers'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Purchase Dialog */}
            <Dialog open={isPurchaseDialogOpen} onOpenChange={(open) => {
                setIsPurchaseDialogOpen(open);
                if (!open) {
                    setSearchStep('search');
                    setSearchResults([]);
                }
            }}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Purchase Phone Number</DialogTitle>
                        <DialogDescription>
                            {searchStep === 'search'
                                ? 'Search for and purchase a new phone number'
                                : `Found ${searchResults.length} available numbers`}
                        </DialogDescription>
                    </DialogHeader>

                    {searchStep === 'search' ? (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Country</Label>
                                    <Select value={purchaseForm.country_code} onValueChange={v => setPurchaseForm({ ...purchaseForm, country_code: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="US">United States (+1)</SelectItem>
                                            <SelectItem value="CA">Canada (+1)</SelectItem>
                                            <SelectItem value="GB">United Kingdom (+44)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Area Code</Label>
                                    <Input value={purchaseForm.area_code} onChange={e => setPurchaseForm({ ...purchaseForm, area_code: e.target.value })} placeholder="e.g., 415" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Number Type</Label>
                                    <Select value={purchaseForm.type} onValueChange={v => setPurchaseForm({ ...purchaseForm, type: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="local">Local</SelectItem>
                                            <SelectItem value="tollFree">Toll-Free</SelectItem>
                                            <SelectItem value="mobile">Mobile</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Contains (Optional)</Label>
                                    <Input
                                        value={purchaseForm.pattern}
                                        onChange={e => setPurchaseForm({ ...purchaseForm, pattern: e.target.value })}
                                        placeholder="e.g., 2024"
                                    />
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Phone Number</TableHead>
                                        <TableHead>Capabilities</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {searchResults.map((num: any) => (
                                        <TableRow key={num.phone_number}>
                                            <TableCell className="font-medium">{num.phone_number}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    {num.capabilities?.voice && <Badge variant="outline" className="text-[12px] px-1">Voice</Badge>}
                                                    {num.capabilities?.sms && <Badge variant="outline" className="text-[12px] px-1">SMS</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    disabled={!!purchasing}
                                                    onClick={() => purchaseNumber(num.phone_number)}
                                                >
                                                    {purchasing === num.phone_number ? 'Purchasing...' : 'Purchase'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    <DialogFooter className="flex justify-between sm:justify-between items-center">
                        {searchStep === 'results' ? (
                            <Button variant="ghost" onClick={() => setSearchStep('search')} disabled={!!purchasing}>
                                Back to Search
                            </Button>
                        ) : (
                            <div />
                        )}
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsPurchaseDialogOpen(false)} disabled={!!purchasing}>
                                Cancel
                            </Button>
                            {searchStep === 'search' && (
                                <Button onClick={searchNumbers} disabled={searching}>
                                    {searching ? 'Searching...' : 'Search Numbers'}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Configure Dialog */}
            <Dialog open={isConfigureDialogOpen} onOpenChange={setIsConfigureDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Configure Phone Number</DialogTitle>
                        <DialogDescription>{selectedPhoneNumber?.phone_number}</DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="handling">Call Handling</TabsTrigger>
                            <TabsTrigger value="tracking">Tracking</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Friendly Name</Label>
                                <Input
                                    value={selectedPhoneNumber?.friendly_name || ''}
                                    onChange={(e) => setSelectedPhoneNumber(prev => prev ? { ...prev, friendly_name: e.target.value } : null)}
                                    placeholder="e.g., Main Line"
                                />
                                <p className="text-sm text-muted-foreground">A recognizable name for this number inside your dashboard.</p>
                            </div>
                            <div className="space-y-4">
                                <Label>Capabilities</Label>
                                <div className="flex items-center gap-2">
                                    <Switch checked={selectedPhoneNumber?.capabilities?.voice} disabled />
                                    <Label>Voice Calls</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch checked={selectedPhoneNumber?.capabilities?.sms} disabled />
                                    <Label>SMS</Label>
                                </div>
                                <p className="text-xs text-muted-foreground">Capabilities are determined by the provider and cannot be changed here.</p>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <Label>Feature Toggles</Label>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Enable Voice</Label>
                                        <p className="text-xs text-muted-foreground">Allow inbound and outbound voice calls.</p>
                                    </div>
                                    <Switch
                                        checked={selectedPhoneNumber?.voice_enabled}
                                        onCheckedChange={(c) => setSelectedPhoneNumber(prev => prev ? { ...prev, voice_enabled: c } : null)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Enable SMS</Label>
                                        <p className="text-xs text-muted-foreground">Allow sending and receiving SMS/MMS messages.</p>
                                    </div>
                                    <Switch
                                        checked={selectedPhoneNumber?.sms_enabled}
                                        onCheckedChange={(c) => setSelectedPhoneNumber(prev => prev ? { ...prev, sms_enabled: c } : null)}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="handling" className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Inbound Call Destination</Label>
                                <Select
                                    value={selectedPhoneNumber?.destination_type || 'forward'}
                                    onValueChange={(v: any) => setSelectedPhoneNumber(prev => prev ? { ...prev, destination_type: v } : null)}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="forward">Forward to Number</SelectItem>
                                        <SelectItem value="ivr_flow">IVR Call Flow</SelectItem>
                                        <SelectItem value="voice_bot">AI Voice Assistant</SelectItem>
                                        <SelectItem value="application">SIP Application / Softphone</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedPhoneNumber?.destination_type === 'forward' && (
                                <div className="space-y-2">
                                    <Label>Forwarding Number</Label>
                                    <div className="flex items-center gap-2">
                                        <Forward className="h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={selectedPhoneNumber?.forwarding_number || ''}
                                            onChange={(e) => setSelectedPhoneNumber(prev => prev ? { ...prev, forwarding_number: e.target.value } : null)}
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Switch
                                            checked={selectedPhoneNumber?.pass_call_id}
                                            onCheckedChange={(c) => setSelectedPhoneNumber(prev => prev ? { ...prev, pass_call_id: c } : null)}
                                        />
                                        <Label>Pass Caller ID</Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground">If enabled, the original caller's ID will be shown. If disabled, your Xordon number will be shown.</p>
                                </div>
                            )}

                            {selectedPhoneNumber?.destination_type === 'ivr_flow' && (
                                <div className="space-y-2">
                                    <Label>Select Call Flow</Label>
                                    <Select
                                        value={selectedPhoneNumber?.call_flow_id?.toString() || ''}
                                        onValueChange={(v) => setSelectedPhoneNumber(prev => prev ? { ...prev, call_flow_id: parseInt(v) } : null)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a call flow" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {callFlows.length === 0 ? (
                                                <div className="p-2 text-sm text-muted-foreground">No call flows found. Create one in Reach &gt; IVR.</div>
                                            ) : (
                                                callFlows.map(flow => (
                                                    <SelectItem key={flow.id} value={flow.id.toString()}>
                                                        {flow.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-1">Incoming calls will be handled by the selected visual IVR flow.</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Whisper Message</Label>
                                <Input
                                    value={selectedPhoneNumber?.whisper_message || ''}
                                    onChange={(e) => setSelectedPhoneNumber(prev => prev ? { ...prev, whisper_message: e.target.value } : null)}
                                    placeholder="e.g., Call from Facebook Ads"
                                />
                                <p className="text-sm text-muted-foreground">Text to speak to the agent before connecting the call.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Voicemail Greeting</Label>
                                <Input
                                    value={selectedPhoneNumber?.voicemail_greeting || ''}
                                    onChange={(e) => setSelectedPhoneNumber(prev => prev ? { ...prev, voicemail_greeting: e.target.value } : null)}
                                    placeholder="Please leave a message after the beep."
                                />
                                <p className="text-sm text-muted-foreground">Text to speak if the call goes to voicemail.</p>
                            </div>

                            <div className="flex items-center justify-between border p-3 rounded-lg">
                                <div className="space-y-0.5">
                                    <Label>Call Recording</Label>
                                    <p className="text-xs text-muted-foreground">Record all inbound calls for this number.</p>
                                </div>
                                <Switch
                                    checked={selectedPhoneNumber?.call_recording}
                                    onCheckedChange={(c) => setSelectedPhoneNumber(prev => prev ? { ...prev, call_recording: c } : null)}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="tracking" className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Tracking Source / Campaign Name</Label>
                                <Input
                                    value={selectedPhoneNumber?.tracking_campaign || ''}
                                    onChange={(e) => setSelectedPhoneNumber(prev => prev ? { ...prev, tracking_campaign: e.target.value } : null)}
                                    placeholder="e.g., Summer Sale 2024 - PPC"
                                />
                                <p className="text-sm text-muted-foreground">Use this to tag calls in your analytics and reports.</p>
                            </div>

                            <div className="bg-muted p-4 rounded-lg">
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <Archive className="h-4 w-4" />
                                    Dynamic Number Insertion (DNI)
                                </h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                    To track calls from your website visitors, install our tracking script.
                                </p>
                                <code className="block bg-black text-white p-2 text-xs rounded overflow-x-auto">
                                    {`<script src="https://cdn.xordon.com/dni.js" data-company-id="YOUR_ID"></script>`}
                                </code>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfigureDialogOpen(false)}>Cancel</Button>
                        <Button onClick={configureNumber}>Save Configuration</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Forwarding Dialog */}
            <Dialog open={bulkForwardingDialogOpen} onOpenChange={setBulkForwardingDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Set Forwarding Number</DialogTitle>
                        <DialogDescription>
                            Set forwarding number for {selectedRows.size} selected phone number(s).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Forwarding Number</Label>
                            <Input
                                value={bulkForwardingNumber}
                                onChange={(e) => setBulkForwardingNumber(e.target.value)}
                                placeholder="+1 (555) 000-0000"
                            />
                            <p className="text-sm text-muted-foreground">
                                Enter the phone number where calls should be forwarded.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBulkForwardingDialogOpen(false)}>Cancel</Button>
                        <Button onClick={applyBulkForwarding}>Apply Forwarding</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
