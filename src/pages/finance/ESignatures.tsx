import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Pen,
    FileText,
    Send,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    Download,
    RefreshCw,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Mail,
    AlertCircle,
    History,
    FileSignature,
    Users,
    Copy,
    ExternalLink,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as eSignatureApi from '@/services/eSignatureApi';
import { api } from '@/lib/api';

export default function ESignatures() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('requests');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<eSignatureApi.SignatureRequest | null>(null);
    const [showAuditDialog, setShowAuditDialog] = useState(false);

    // Create form state
    const [createForm, setCreateForm] = useState({
        document_type: 'estimate' as eSignatureApi.DocumentType,
        document_id: '',
        signers: [{ email: '', name: '', role: 'Client' }],
        message: '',
        expires_in_days: 7,
    });

    // Queries
    const { data: estimates } = useQuery({
        queryKey: ['estimates-list'],
        queryFn: async () => {
            const res = await api.get('/operations/estimates');
            return (res.data as any)?.items || [];
        },
        enabled: showCreateDialog && createForm.document_type === 'estimate'
    });

    const { data: requests, isLoading } = useQuery({
        queryKey: ['signature-requests', statusFilter],
        queryFn: () =>
            eSignatureApi.listSignatureRequests({
                status: statusFilter !== 'all' ? (statusFilter as eSignatureApi.SignatureStatus) : undefined,
            }),
    });

    const { data: templates } = useQuery({
        queryKey: ['signature-templates'],
        queryFn: () => eSignatureApi.listTemplates(),
    });

    const { data: settings } = useQuery({
        queryKey: ['e-signature-settings'],
        queryFn: () => eSignatureApi.getSettings(),
    });

    const { data: auditTrail } = useQuery({
        queryKey: ['audit-trail', selectedRequest?.id],
        queryFn: () => eSignatureApi.getAuditTrail(selectedRequest!.id),
        enabled: !!selectedRequest && showAuditDialog,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: Parameters<typeof eSignatureApi.createSignatureRequest>[0]) =>
            eSignatureApi.createSignatureRequest(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['signature-requests'] });
            setShowCreateDialog(false);
            toast.success('Signature request created!');
        },
        onError: () => toast.error('Failed to create signature request'),
    });

    const sendMutation = useMutation({
        mutationFn: (id: string) => eSignatureApi.sendSignatureRequest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['signature-requests'] });
            toast.success('Signature request sent!');
        },
        onError: () => toast.error('Failed to send request'),
    });

    const remindMutation = useMutation({
        mutationFn: (id: string) => eSignatureApi.sendReminder(id),
        onSuccess: () => toast.success('Reminder sent!'),
        onError: () => toast.error('Failed to send reminder'),
    });

    const voidMutation = useMutation({
        mutationFn: (id: string) => eSignatureApi.voidSignatureRequest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['signature-requests'] });
            toast.success('Signature request voided');
        },
        onError: () => toast.error('Failed to void request'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => eSignatureApi.deleteSignatureRequest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['signature-requests'] });
            toast.success('Request deleted');
        },
        onError: () => toast.error('Failed to delete request'),
    });

    const getStatusBadge = (status: eSignatureApi.SignatureStatus) => {
        const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
            pending: { variant: 'outline', icon: <Clock className="w-3 h-3" /> },
            viewed: { variant: 'secondary', icon: <Eye className="w-3 h-3" /> },
            signed: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
            declined: { variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
            expired: { variant: 'outline', icon: <AlertCircle className="w-3 h-3" /> },
            voided: { variant: 'outline', icon: <XCircle className="w-3 h-3" /> },
        };
        const { variant, icon } = config[status] || { variant: 'outline', icon: null };
        return (
            <Badge variant={variant} className="flex items-center gap-1">
                {icon}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const getSignerStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            pending: 'outline',
            sent: 'secondary',
            viewed: 'secondary',
            signed: 'default',
            declined: 'destructive',
        };
        return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
    };

    const getCompletionProgress = (signers: eSignatureApi.Signer[]) => {
        const signed = signers.filter((s) => s.status === 'signed').length;
        return (signed / signers.length) * 100;
    };

    const addSigner = () => {
        setCreateForm({
            ...createForm,
            signers: [...createForm.signers, { email: '', name: '', role: '' }],
        });
    };

    const removeSigner = (index: number) => {
        setCreateForm({
            ...createForm,
            signers: createForm.signers.filter((_, i) => i !== index),
        });
    };

    const updateSigner = (index: number, field: string, value: string) => {
        const updated = [...createForm.signers];
        updated[index] = { ...updated[index], [field]: value };
        setCreateForm({ ...createForm, signers: updated });
    };

    const filteredRequests = requests?.data?.filter((req) => {
        if (searchQuery) {
            return (
                req.document_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                req.signers.some((s) =>
                    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.email.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        }
        return true;
    });

    return (
        <div className="container py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">E-Signatures</h1>
                    <p className="text-muted-foreground">
                        Send documents for digital signature
                    </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Signature Request
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Pending</CardDescription>
                        <CardTitle className="text-2xl">
                            {requests?.data?.filter((r) => r.status === 'pending').length || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Viewed</CardDescription>
                        <CardTitle className="text-2xl">
                            {requests?.data?.filter((r) => r.status === 'viewed').length || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Signed</CardDescription>
                        <CardTitle className="text-2xl text-green-600">
                            {requests?.data?.filter((r) => r.status === 'signed').length || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Declined/Expired</CardDescription>
                        <CardTitle className="text-2xl text-red-600">
                            {requests?.data?.filter((r) => ['declined', 'expired'].includes(r.status)).length || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="requests">Signature Requests</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="requests" className="space-y-4">
                    {/* Filters */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search requests..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="viewed">Viewed</SelectItem>
                                <SelectItem value="signed">Signed</SelectItem>
                                <SelectItem value="declined">Declined</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table */}
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Document</TableHead>
                                    <TableHead>Signers</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredRequests?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No signature requests found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRequests?.map((request) => (
                                        <TableRow key={request.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <FileSignature className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{request.document_title}</p>
                                                        <p className="text-sm text-muted-foreground capitalize">
                                                            {request.document_type}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex -space-x-2">
                                                    {request.signers.slice(0, 3).map((signer, i) => (
                                                        <Avatar key={i} className="w-8 h-8 border-2 border-background">
                                                            <AvatarFallback className="text-xs">
                                                                {signer.name.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    ))}
                                                    {request.signers.length > 3 && (
                                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                                                            +{request.signers.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                                            <TableCell>
                                                <div className="w-24">
                                                    <Progress value={getCompletionProgress(request.signers)} className="h-2" />
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {request.signers.filter((s) => s.status === 'signed').length}/{request.signers.length} signed
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(request.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedRequest(request);
                                                                setShowDetailsDialog(true);
                                                            }}
                                                        >
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        {request.status === 'pending' && (
                                                            <DropdownMenuItem onClick={() => sendMutation.mutate(request.id)}>
                                                                <Send className="w-4 h-4 mr-2" />
                                                                Send / Resend
                                                            </DropdownMenuItem>
                                                        )}
                                                        {['pending', 'viewed'].includes(request.status) && (
                                                            <DropdownMenuItem onClick={() => remindMutation.mutate(request.id)}>
                                                                <Mail className="w-4 h-4 mr-2" />
                                                                Send Reminder
                                                            </DropdownMenuItem>
                                                        )}
                                                        {request.status === 'signed' && (
                                                            <DropdownMenuItem
                                                                onClick={async () => {
                                                                    const { download_url } = await eSignatureApi.downloadSignedDocument(request.id);
                                                                    window.open(download_url, '_blank');
                                                                }}
                                                            >
                                                                <Download className="w-4 h-4 mr-2" />
                                                                Download Signed
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedRequest(request);
                                                                setShowAuditDialog(true);
                                                            }}
                                                        >
                                                            <History className="w-4 h-4 mr-2" />
                                                            Audit Trail
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {['pending', 'viewed'].includes(request.status) && (
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => voidMutation.mutate(request.id)}
                                                            >
                                                                <XCircle className="w-4 h-4 mr-2" />
                                                                Void Request
                                                            </DropdownMenuItem>
                                                        )}
                                                        {request.status === 'pending' && (
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => deleteMutation.mutate(request.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="templates">
                    <Card>
                        <CardHeader>
                            <CardTitle>Signature Templates</CardTitle>
                            <CardDescription>Reusable templates for common documents</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {templates?.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">No templates yet</p>
                                    <Button className="mt-4">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Template
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {templates?.map((template) => (
                                        <Card key={template.id}>
                                            <CardHeader>
                                                <CardTitle className="text-base">{template.name}</CardTitle>
                                                <CardDescription>{template.description}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Users className="w-4 h-4" />
                                                    {template.default_signers.length} signer{template.default_signers.length !== 1 ? 's' : ''}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings">
                    <Card>
                        <CardHeader>
                            <CardTitle>E-Signature Settings</CardTitle>
                            <CardDescription>Configure your signature request preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Default Expiration (days)</Label>
                                    <Input
                                        type="number"
                                        defaultValue={settings?.default_expiration_days || 7}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Default Reminder Frequency</Label>
                                    <Select defaultValue={settings?.default_reminder_frequency || 'weekly'}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No reminders</SelectItem>
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Terms Text (shown before signing)</Label>
                                <Textarea
                                    placeholder="By signing this document, you agree to..."
                                    defaultValue={settings?.terms_text}
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Redirect URL After Signing</Label>
                                <Input
                                    placeholder="https://yoursite.com/thank-you"
                                    defaultValue={settings?.redirect_url_after_signing}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>New Signature Request</DialogTitle>
                        <DialogDescription>Send a document for digital signature</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Document Type</Label>
                                <Select
                                    value={createForm.document_type}
                                    onValueChange={(v: eSignatureApi.DocumentType) =>
                                        setCreateForm({ ...createForm, document_type: v, document_id: '' })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="estimate">Estimate</SelectItem>
                                        <SelectItem value="proposal">Proposal</SelectItem>
                                        <SelectItem value="contract">Contract</SelectItem>
                                        <SelectItem value="agreement">Agreement</SelectItem>
                                        <SelectItem value="invoice">Invoice</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Document</Label>
                                {createForm.document_type === 'estimate' ? (
                                    <Select
                                        value={createForm.document_id}
                                        onValueChange={(v) => {
                                            const est = estimates?.find((e: any) => String(e.id) === v);
                                            setCreateForm({
                                                ...createForm,
                                                document_id: v,
                                                // Pre-fill signer if contact email exists
                                                signers: est?.contact_email ? [{
                                                    email: est.contact_email,
                                                    name: (est.contact_first_name || '') + ' ' + (est.contact_last_name || ''),
                                                    role: 'Client'
                                                }] : createForm.signers
                                            });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select estimate..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {estimates?.map((est: any) => (
                                                <SelectItem key={est.id} value={String(est.id)}>
                                                    {est.estimate_number || est.estimateNumber} - {est.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        placeholder="Document ID/Name"
                                        value={createForm.document_id}
                                        onChange={(e) => setCreateForm({ ...createForm, document_id: e.target.value })}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Signers</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addSigner}>
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Signer
                                </Button>
                            </div>
                            {createForm.signers.map((signer, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        placeholder="Email"
                                        value={signer.email}
                                        onChange={(e) => updateSigner(index, 'email', e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input
                                        placeholder="Name"
                                        value={signer.name}
                                        onChange={(e) => updateSigner(index, 'name', e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input
                                        placeholder="Role"
                                        value={signer.role}
                                        onChange={(e) => updateSigner(index, 'role', e.target.value)}
                                        className="w-32"
                                    />
                                    {createForm.signers.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeSigner(index)}
                                        >
                                            <XCircle className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <Label>Message to Signers (Optional)</Label>
                            <Textarea
                                placeholder="Add a personal message..."
                                value={createForm.message}
                                onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Expires In</Label>
                            <Select
                                value={createForm.expires_in_days.toString()}
                                onValueChange={(v) => setCreateForm({ ...createForm, expires_in_days: parseInt(v) })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="3">3 days</SelectItem>
                                    <SelectItem value="7">7 days</SelectItem>
                                    <SelectItem value="14">14 days</SelectItem>
                                    <SelectItem value="30">30 days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() =>
                                createMutation.mutate({
                                    document_type: createForm.document_type,
                                    document_id: createForm.document_id,
                                    signers: createForm.signers,
                                    message: createForm.message || undefined,
                                    expires_in_days: createForm.expires_in_days,
                                    send_immediately: true,
                                })
                            }
                            disabled={
                                createMutation.isPending ||
                                !createForm.document_id ||
                                createForm.signers.some((s) => !s.email || !s.name)
                            }
                        >
                            {createMutation.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                            Create & Send
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Details Dialog */}
            {selectedRequest && (
                <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{selectedRequest.document_title}</DialogTitle>
                            <DialogDescription>
                                {selectedRequest.document_type.charAt(0).toUpperCase() + selectedRequest.document_type.slice(1)} •{' '}
                                Created {new Date(selectedRequest.created_at).toLocaleDateString()}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Status</span>
                                {getStatusBadge(selectedRequest.status)}
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-2">Signers</p>
                                <div className="space-y-2">
                                    {selectedRequest.signers.map((signer) => (
                                        <div
                                            key={signer.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-8 h-8">
                                                    <AvatarFallback>{signer.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-sm">{signer.name}</p>
                                                    <p className="text-xs text-muted-foreground">{signer.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {getSignerStatusBadge(signer.status)}
                                                {signer.signed_at && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {new Date(signer.signed_at).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Audit Trail Dialog */}
            <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Audit Trail</DialogTitle>
                        <DialogDescription>Complete history of this signature request</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[400px]">
                        <div className="space-y-4">
                            {auditTrail?.map((entry) => (
                                <div key={entry.id} className="flex gap-3 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                                    <div>
                                        <p className="font-medium">{entry.action}</p>
                                        <p className="text-muted-foreground">{entry.actor}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(entry.timestamp).toLocaleString()}
                                            {entry.ip_address && ` • IP: ${entry.ip_address}`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
