import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Phone, Voicemail, PhoneCall, MessageSquare, DollarSign, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface DashboardStats {
    active_numbers: number;
    new_voicemails: number;
    calls_today: number;
    unread_sms: number;
    call_minutes_this_month: number;
}

interface CallLog {
    id: number;
    phone_number_id: number;
    from_number: string;
    to_number: string;
    direction: string;
    status: string;
    duration_seconds: number;
    started_at: string;
}

interface SMSConversation {
    id: number;
    phone_number_id: number;
    contact_number: string;
    contact_id: number;
    last_message_at: string;
    last_message_preview: string;
    unread_count: number;
    status: string;
}

export default function PhoneOverview() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [callLogs, setCallLogs] = useState<CallLog[]>([]);
    const [smsConversations, setSmsConversations] = useState<SMSConversation[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            setLoading(true);
            const [statsRes, callsRes, smsRes] = await Promise.all([
                api.get('/phone/dashboard-stats'),
                api.get('/phone/call-logs'),
                api.get('/phone/sms-conversations')
            ]);

            setStats(statsRes.data as any);
            setCallLogs(((callsRes.data as any)?.items || []).slice(0, 5));
            setSmsConversations(((smsRes.data as any)?.items || []).slice(0, 5));
        } catch (error) {
            console.error('Failed to load overview data:', error);
            toast.error('Failed to load overview data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-gray-100 text-gray-800',
            new: 'bg-blue-100 text-blue-800',
            read: 'bg-gray-100 text-gray-800',
            completed: 'bg-green-100 text-green-800',
            missed: 'bg-red-100 text-red-800',
            inbound: 'bg-blue-100 text-blue-800',
            outbound: 'bg-green-100 text-green-800'
        };
        return <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Calls Overview</h1>
                    <p className="text-gray-600">Quick view of your business communications</p>
                </div>
                <Button variant="outline" onClick={loadData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Numbers</CardTitle>
                            <Phone className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active_numbers}</div>
                            <p className="text-xs text-muted-foreground">Phone lines</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">New Voicemails</CardTitle>
                            <Voicemail className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.new_voicemails}</div>
                            <p className="text-xs text-muted-foreground">Unheard</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Calls Today</CardTitle>
                            <PhoneCall className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.calls_today}</div>
                            <p className="text-xs text-muted-foreground">Today</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Unread SMS</CardTitle>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.unread_sms}</div>
                            <p className="text-xs text-muted-foreground">Messages</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Call Minutes</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.call_minutes_this_month}</div>
                            <p className="text-xs text-muted-foreground">This month</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Calls</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Number</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {callLogs.map((call) => (
                                    <TableRow key={call.id}>
                                        <TableCell className="font-medium">
                                            {new Date(call.started_at).toLocaleTimeString()}
                                        </TableCell>
                                        <TableCell>{call.from_number}</TableCell>
                                        <TableCell>{Math.floor(call.duration_seconds / 60)}m {call.duration_seconds % 60}s</TableCell>
                                        <TableCell>{getStatusBadge(call.status)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent SMS Conversations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Last Message</TableHead>
                                    <TableHead>Unread</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {smsConversations.map((conversation) => (
                                    <TableRow key={conversation.id}>
                                        <TableCell className="font-medium">{conversation.contact_number}</TableCell>
                                        <TableCell className="max-w-xs truncate">{conversation.last_message_preview}</TableCell>
                                        <TableCell>
                                            {conversation.unread_count > 0 && (
                                                <Badge variant="secondary">{conversation.unread_count}</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
