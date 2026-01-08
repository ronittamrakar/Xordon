import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, RefreshCw, PhoneIncoming, PhoneOutgoing, Phone, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useCallSession } from '@/contexts/CallSessionContext';

interface CallLog {
    id: number;
    phone_number_id: number;
    from_number: string;
    to_number: string;
    direction: string;
    status: string;
    duration_seconds: number;
    started_at: string;
    phone_number?: {
        id: number;
        phone_number: string;
        friendly_name: string;
    };
    recording_url?: string;
    tracking_campaign?: string;
}

interface PhoneNumber {
    id: string;
    phone_number: string;
    friendly_name: string;
}

export default function PhoneCallLogs() {
    const { requestSoftphoneCall } = useCallSession();
    const navigate = useNavigate();

    const [callLogs, setCallLogs] = useState<CallLog[]>([]);
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCallDetailsDialogOpen, setIsCallDetailsDialogOpen] = useState(false);
    const [selectedCallLog, setSelectedCallLog] = useState<CallLog | null>(null);

    // Filters
    const [activeTab, setActiveTab] = useState<'all' | 'inbound' | 'outbound'>('all');
    const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
        loadPhoneNumbers();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/phone/call-logs');
            setCallLogs((response.data as any)?.items || []);
        } catch (error) {
            console.error('Failed to load call logs:', error);
            toast.error('Failed to load call logs');
        } finally {
            setLoading(false);
        }
    };

    const loadPhoneNumbers = async () => {
        try {
            const response = await api.get('/phone-numbers/active');
            setPhoneNumbers((response.data as any)?.items || []);
        } catch (error) {
            console.error('Failed to load phone numbers:', error);
        }
    };

    const filteredCalls = useMemo(() => {
        return callLogs.filter(call => {
            // Filter by direction tab
            if (activeTab === 'inbound' && call.direction !== 'inbound') return false;
            if (activeTab === 'outbound' && call.direction !== 'outbound') return false;

            // Filter by phone number
            if (selectedPhoneNumber !== 'all' && call.phone_number_id.toString() !== selectedPhoneNumber) {
                return false;
            }

            // Filter by search term
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return (
                    call.from_number.toLowerCase().includes(term) ||
                    call.to_number.toLowerCase().includes(term) ||
                    call.phone_number?.friendly_name?.toLowerCase().includes(term) ||
                    call.tracking_campaign?.toLowerCase().includes(term)
                );
            }

            return true;
        });
    }, [callLogs, activeTab, selectedPhoneNumber, searchTerm]);

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            completed: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-900',
            answered: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-900',
            missed: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-900',
            failed: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-900',
            busy: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-900',
            'no-answer': 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-800'
        };
        return <Badge className={colors[status] || 'bg-gray-100 text-gray-800 hover:bg-gray-100'}>{status}</Badge>;
    };

    const getDirectionBadge = (direction: string) => {
        if (direction === 'inbound') {
            return (
                <Badge variant="secondary" className="gap-1">
                    <PhoneIncoming className="h-3 w-3" />
                    Inbound
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="gap-1">
                <PhoneOutgoing className="h-3 w-3" />
                Outbound
            </Badge>
        );
    };

    const formatDuration = (seconds: number) => {
        if (seconds === 0) return '-';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    const openCallDetails = (call: CallLog) => {
        setSelectedCallLog(call);
        setIsCallDetailsDialogOpen(true);
    };

    const callBack = (call: CallLog) => {
        const numberToCall = call.direction === 'inbound' ? call.from_number : call.to_number;
        requestSoftphoneCall({
            number: numberToCall,
            source: 'softphone',
            recipientName: 'Previous Caller',
            metadata: {
                previousCallId: call.id,
                direction: 'outbound'
            }
        });
        toast.info(`Initiating call to ${numberToCall}...`);
    };

    const inboundCount = callLogs.filter(c => c.direction === 'inbound').length;
    const outboundCount = callLogs.filter(c => c.direction === 'outbound').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Call Logs</h1>
                    <p className="text-muted-foreground">History of your calls and campaigns</p>
                </div>
                <Button variant="outline" onClick={loadData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="all" className="gap-2">
                        <Phone className="h-4 w-4" />
                        All ({callLogs.length})
                    </TabsTrigger>
                    <TabsTrigger value="inbound" className="gap-2">
                        <PhoneIncoming className="h-4 w-4" />
                        Inbound ({inboundCount})
                    </TabsTrigger>
                    <TabsTrigger value="outbound" className="gap-2">
                        <PhoneOutgoing className="h-4 w-4" />
                        Outbound ({outboundCount})
                    </TabsTrigger>
                </TabsList>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by phone number..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={selectedPhoneNumber} onValueChange={setSelectedPhoneNumber}>
                        <SelectTrigger className="w-full sm:w-[250px]">
                            <SelectValue placeholder="Filter by phone number" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Phone Numbers</SelectItem>
                            {phoneNumbers.map((num) => (
                                <SelectItem key={num.id} value={num.id}>
                                    {num.friendly_name} ({num.phone_number})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Call Logs Table */}
                <TabsContent value={activeTab} className="space-y-4">
                    <Card>
                        <CardContent className="p-0">
                            {filteredCalls.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Phone className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No calls found</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {searchTerm || selectedPhoneNumber !== 'all'
                                            ? 'Try adjusting your filters'
                                            : 'Call logs will appear here once you make or receive calls'}
                                    </p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4" />
                                                    Date & Time
                                                </div>
                                            </TableHead>
                                            <TableHead>From / To</TableHead>
                                            <TableHead>Line / Campaign</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredCalls.map((call) => (
                                            <TableRow key={call.id}>
                                                <TableCell className="font-medium">
                                                    {new Date(call.started_at).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{call.direction === 'inbound' ? call.from_number : call.to_number}</span>
                                                        <span className="text-xs text-muted-foreground capitalize">{call.direction}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span>{call.phone_number?.friendly_name || 'Unknown'}</span>
                                                        {call.tracking_campaign && (
                                                            <span className="text-xs text-blue-600 dark:text-blue-400">{call.tracking_campaign}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{formatDuration(call.duration_seconds)}</TableCell>
                                                <TableCell>{getStatusBadge(call.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openCallDetails(call)}
                                                        >
                                                            Details
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => callBack(call)}
                                                        >
                                                            <Phone className="h-3 w-3 mr-1" />
                                                            Call
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
                </TabsContent>
            </Tabs>

            {/* Call Details Dialog */}
            <Dialog open={isCallDetailsDialogOpen} onOpenChange={setIsCallDetailsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Call Details</DialogTitle>
                        <DialogDescription>Detailed information for this call</DialogDescription>
                    </DialogHeader>
                    {selectedCallLog && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">Direction</p>
                                    <p className="font-medium capitalize">{selectedCallLog.direction}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">Status</p>
                                    <p>{getStatusBadge(selectedCallLog.status)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">From</p>
                                    <p className="font-medium">{selectedCallLog.from_number}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">To</p>
                                    <p className="font-medium">{selectedCallLog.to_number}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">Duration</p>
                                    <p className="font-medium">{formatDuration(selectedCallLog.duration_seconds)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs">Date</p>
                                    <p className="font-medium">{new Date(selectedCallLog.started_at).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <p className="text-muted-foreground text-xs mb-1">Assigned Line</p>
                                <p className="font-medium">{selectedCallLog.phone_number?.friendly_name}</p>
                                {selectedCallLog.tracking_campaign && (
                                    <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-200">
                                        Campaign: {selectedCallLog.tracking_campaign}
                                    </Badge>
                                )}
                            </div>

                            {selectedCallLog.recording_url && (
                                <div className="border-t pt-4">
                                    <p className="text-muted-foreground text-xs mb-2">Call Recording</p>
                                    <audio controls className="w-full h-8">
                                        <source src={selectedCallLog.recording_url} type="audio/mpeg" />
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCallDetailsDialogOpen(false)}>
                            Close
                        </Button>
                        {selectedCallLog && (
                            <Button onClick={() => {
                                callBack(selectedCallLog);
                                setIsCallDetailsDialogOpen(false);
                            }}>
                                <Phone className="h-4 w-4 mr-2" />
                                Call Back
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
