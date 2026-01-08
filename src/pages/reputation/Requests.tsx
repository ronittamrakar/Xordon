import React, { useState, useEffect } from 'react';
import SEO from '@/components/SEO';
import { ModuleGuard } from '@/components/ModuleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Send,
    Search,
    MessageSquare,
    Mail,
    Phone,
    CheckCircle2,
    Clock,
    RotateCcw,
    Plus,
    ArrowUpRight,
    TrendingUp,
    RefreshCw,
    Trash2,
    Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import reputationApi, { ReviewRequest } from '@/services/reputationApi';
import { UnifiedContactSelector } from '@/components/UnifiedContactSelector';
import { Contact } from '@/types/contact';

export default function ReputationRequests() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<ReviewRequest[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Send Request Dialog
    const [showSendDialog, setShowSendDialog] = useState(false);
    const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
    const [requestType, setRequestType] = useState<'email' | 'sms' | 'whatsapp'>('email');
    const [templateId, setTemplateId] = useState('');

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await reputationApi.getRequests();
            setRequests(data.requests || []);
            setStats(data.stats || {
                total: 0,
                sent: 0,
                delivered: 0,
                opened: 0,
                clicked: 0
            });
        } catch (error) {
            console.error('Failed to load requests:', error);
            toast({
                title: 'Error',
                description: 'Failed to load review requests data',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSendRequest = async () => {
        if (selectedContacts.length === 0) {
            toast({
                title: 'No contacts selected',
                description: 'Please select at least one contact to send the request to.',
                variant: 'destructive'
            });
            return;
        }

        try {
            setSubmitting(true);
            let sentCount = 0;
            let failureCount = 0;

            for (const contact of selectedContacts) {
                try {
                    await reputationApi.sendRequest({
                        contact_id: parseInt(contact.id), // Ensure ID is number
                        contact_name: contact.name || `${contact.firstName} ${contact.lastName}`,
                        contact_email: contact.email,
                        contact_phone: contact.phone,
                        channel: requestType,
                        template_id: templateId ? parseInt(templateId) : undefined
                    });
                    sentCount++;
                } catch (err) {
                    console.error(`Failed to send to contact ${contact.id}`, err);
                    failureCount++;
                }
            }

            if (sentCount > 0) {
                toast({
                    title: 'Success',
                    description: `Successfully initiated ${sentCount} review requests.${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
                });
                setShowSendDialog(false);
                setSelectedContacts([]);
                loadData();
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to send requests. Please check your connection and try again.',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred while sending requests',
                variant: 'destructive'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteRequest = async (id: number) => {
        if (!confirm('Are you sure you want to delete this record?')) return;

        try {
            await reputationApi.deleteRequest(id);
            toast({
                title: 'Deleted',
                description: 'Request record removed'
            });
            loadData();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete record'
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'sent': return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Sent</Badge>;
            case 'delivered': return <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Delivered</Badge>;
            case 'opened': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Opened</Badge>;
            case 'clicked': return <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Clicked</Badge>;
            case 'failed': return <Badge variant="destructive">Failed</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getSourceIcon = (type: string) => {
        switch (type) {
            case 'email': return <Mail className="h-4 w-4" />;
            case 'sms': return <Phone className="h-4 w-4" />;
            case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
            default: return <Send className="h-4 w-4" />;
        }
    };

    const filteredRequests = requests.filter(r =>
    (r.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading && !stats) {
        return (
            <ModuleGuard moduleKey="reputation">
                <div className="flex items-center justify-center min-h-[400px]">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
            </ModuleGuard>
        );
    }

    return (
        <ModuleGuard moduleKey="reputation">
            <SEO title="Review Requests" description="Manage and send review invitations" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold font-heading">Review Requests</h1>
                        <p className="text-muted-foreground">Manage and track your review invitation campaigns</p>
                    </div>
                    <Button onClick={() => setShowSendDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Send Invitations
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Invites Sent</CardTitle>
                            <Send className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.sent || 0}</div>
                            <p className="text-xs text-muted-foreground">Total sent invitations</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.delivered || 0}</div>
                            <p className="text-xs text-muted-foreground">Successfully delivered</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats?.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0}%
                            </div>
                            <p className="text-xs text-muted-foreground">Invitations opened</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats?.sent > 0 ? Math.round((stats.clicked / stats.sent) * 100) : 0}%
                            </div>
                            <p className="text-xs text-muted-foreground">Click-through rate</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Requests Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Recent Requests</CardTitle>
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by contact..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredRequests.length === 0 ? (
                            <div className="text-center py-12">
                                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                <h3 className="text-lg font-medium">No requests found</h3>
                                <p className="text-muted-foreground">Start by sending your first review invitation</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Platform / Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Sent Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRequests.map((request) => (
                                        <TableRow key={request.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{request.contact_name || 'N/A'}</p>
                                                    <p className="text-xs text-muted-foreground">{request.contact_email || request.contact_phone || 'No contact details'}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getSourceIcon(request.channel)}
                                                    <span className="capitalize text-sm">{request.channel}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(request.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {/* 
                                                        // Retry button - uncomment if needed
                                                        <Button variant="ghost" size="icon" onClick={() => loadData()}>
                                                            <RotateCcw className="h-4 w-4" />
                                                        </Button> 
                                                    */}
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteRequest(request.id!)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Send Request Dialog */}
            <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Send Review Invitations</DialogTitle>
                        <DialogDescription>
                            Select contacts to invite. You can send emails or SMS messages.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-6 py-4 overflow-hidden">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Channel</label>
                                <Select
                                    value={requestType}
                                    onValueChange={(val: any) => setRequestType(val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="email">Email Invitation</SelectItem>
                                        <SelectItem value="sms">SMS Message</SelectItem>
                                        <SelectItem value="whatsapp">WhatsApp Message</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* Template selection could go here */}
                            <div className="flex items-center gap-2 pt-8">
                                <Badge variant="outline" className="h-8 px-3">
                                    {selectedContacts.length} Contacts Selected
                                </Badge>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto border rounded-lg bg-muted/10 p-1">
                            <UnifiedContactSelector
                                campaignType={requestType === 'whatsapp' ? 'sms' : requestType}
                                selectedContacts={selectedContacts}
                                onContactsChange={setSelectedContacts}
                                showUpload={true}
                                className="border-0 shadow-none"
                            />
                        </div>

                        <div className="bg-muted p-3 rounded-lg flex items-start gap-3">
                            <RotateCcw className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                                Note: This will send the default reputation template for the selected channel to all selected contacts.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSendDialog(false)}>Cancel</Button>
                        <Button onClick={handleSendRequest} disabled={submitting || selectedContacts.length === 0}>
                            {submitting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                            Send to {selectedContacts.length} Contact{selectedContacts.length !== 1 ? 's' : ''}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ModuleGuard>
    );
}
