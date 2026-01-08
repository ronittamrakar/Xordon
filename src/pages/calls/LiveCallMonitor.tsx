import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Phone, PhoneOff, Users, Clock, Activity,
    AlertCircle, CheckCircle2, Pause, Play,
    RefreshCw, Headphones, Volume2, VolumeX,
    UserCheck, UserMinus, Timer, TrendingUp,
    Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface LiveCall {
    id: string;
    call_sid: string;
    from_number: string;
    to_number: string;
    direction: 'inbound' | 'outbound';
    status: 'ringing' | 'in-progress' | 'queued';
    started_at: string;
    duration_seconds: number;
    agent_id?: string;
    agent_name?: string;
    agent_status?: string;
    first_name?: string;
    last_name?: string;
    company?: string;
}

interface Agent {
    id: string;
    name: string;
    email: string;
    status: 'available' | 'busy' | 'away' | 'offline' | 'on-call' | 'wrap-up';
    last_active_at?: string;
    current_call_id?: string;
    active_calls: number;
    calls_today: number;
}

interface QueueStats {
    totalQueued: number;
    avgWaitTime: number;
    maxWaitTime: number;
}

interface LiveCallMonitorProps {
    embedded?: boolean;
}

const LiveCallMonitor: React.FC<LiveCallMonitorProps> = ({ embedded = false }) => {
    const [liveCalls, setLiveCalls] = useState<LiveCall[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [queueStats, setQueueStats] = useState<QueueStats>({ totalQueued: 0, avgWaitTime: 0, maxWaitTime: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('calls');
    const [monitoringCall, setMonitoringCall] = useState<string | null>(null);

    const fetchLiveData = useCallback(async () => {
        try {
            const [callsResponse, agentsResponse] = await Promise.all([
                api.get('/calls/live') as Promise<{ calls: LiveCall[]; queue: QueueStats }>,
                api.get('/calls/agent-presence') as Promise<{ agents: Agent[] }>
            ]);

            setLiveCalls(callsResponse.calls || []);
            setQueueStats(callsResponse.queue || { totalQueued: 0, avgWaitTime: 0, maxWaitTime: 0 });
            setAgents(agentsResponse.agents || []);
        } catch (err) {
            console.error('Failed to fetch live data:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLiveData();

        // Real-time polling every 5 seconds
        const interval = setInterval(fetchLiveData, 5000);
        return () => clearInterval(interval);
    }, [fetchLiveData]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'available': 'bg-green-500',
            'busy': 'bg-yellow-500',
            'away': 'bg-gray-400',
            'offline': 'bg-gray-300',
            'on-call': 'bg-blue-500',
            'wrap-up': 'bg-purple-500',
            'ringing': 'bg-yellow-500 animate-pulse',
            'in-progress': 'bg-green-500',
            'queued': 'bg-orange-500'
        };
        return colors[status] || 'bg-gray-400';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'available': 'Available',
            'busy': 'Busy',
            'away': 'Away',
            'offline': 'Offline',
            'on-call': 'On Call',
            'wrap-up': 'Wrap-up',
            'ringing': 'Ringing',
            'in-progress': 'In Progress',
            'queued': 'Queued'
        };
        return labels[status] || status;
    };

    const activeAgents = agents.filter(a => a.status !== 'offline');
    const availableAgents = agents.filter(a => a.status === 'available');
    const onCallAgents = agents.filter(a => a.status === 'on-call');
    const totalCallsToday = agents.reduce((sum, a) => sum + (a.calls_today || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            {!embedded && (
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Live Call Monitor</h1>
                        <p className="text-muted-foreground">Real-time view of calls and agent activity</p>
                    </div>
                    <Button variant="outline" onClick={fetchLiveData} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Live Calls</p>
                                <p className="text-3xl font-bold">{liveCalls.length}</p>
                            </div>
                            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center",
                                liveCalls.length > 0 ? "bg-green-100" : "bg-gray-100")}>
                                <Phone className={cn("h-6 w-6", liveCalls.length > 0 ? "text-green-600" : "text-gray-400")} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">In Queue</p>
                                <p className="text-3xl font-bold">{queueStats.totalQueued}</p>
                            </div>
                            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center",
                                queueStats.totalQueued > 5 ? "bg-red-100" : queueStats.totalQueued > 0 ? "bg-yellow-100" : "bg-gray-100")}>
                                <Clock className={cn("h-6 w-6",
                                    queueStats.totalQueued > 5 ? "text-red-600" : queueStats.totalQueued > 0 ? "text-yellow-600" : "text-gray-400")} />
                            </div>
                        </div>
                        {queueStats.avgWaitTime > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Avg wait: {formatDuration(queueStats.avgWaitTime)}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Available Agents</p>
                                <p className="text-3xl font-bold text-green-600">{availableAgents.length}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                <UserCheck className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <Progress
                            value={(availableAgents.length / Math.max(activeAgents.length, 1)) * 100}
                            className="h-2 mt-2"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">On Call</p>
                                <p className="text-3xl font-bold text-blue-600">{onCallAgents.length}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <Headphones className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Calls Today</p>
                                <p className="text-3xl font-bold">{totalCallsToday}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="calls" className="gap-2">
                        <Phone className="h-4 w-4" />
                        Live Calls
                        {liveCalls.length > 0 && (
                            <Badge variant="secondary" className="ml-1">{liveCalls.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="agents" className="gap-2">
                        <Users className="h-4 w-4" />
                        Agents
                        <Badge variant="secondary" className="ml-1">{activeAgents.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="queue" className="gap-2">
                        <Clock className="h-4 w-4" />
                        Queue
                        {queueStats.totalQueued > 0 && (
                            <Badge variant="destructive" className="ml-1">{queueStats.totalQueued}</Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="calls" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Calls</CardTitle>
                            <CardDescription>Calls currently in progress or ringing</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : liveCalls.length === 0 ? (
                                <div className="text-center py-12">
                                    <PhoneOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No Active Calls</h3>
                                    <p className="text-muted-foreground">There are no calls in progress right now</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Caller</TableHead>
                                            <TableHead>Agent</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Direction</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {liveCalls.map((call) => (
                                            <TableRow key={call.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn("h-2 w-2 rounded-full", getStatusColor(call.status))} />
                                                        <span className="text-sm font-medium">{getStatusLabel(call.status)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">
                                                            {call.first_name && call.last_name
                                                                ? `${call.first_name} ${call.last_name}`
                                                                : call.from_number}
                                                        </p>
                                                        {call.company && (
                                                            <p className="text-sm text-muted-foreground">{call.company}</p>
                                                        )}
                                                        <p className="text-xs text-muted-foreground">{call.from_number}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {call.agent_name ? (
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarFallback>{call.agent_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                            <span>{call.agent_name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">Unassigned</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Timer className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-mono">{formatDuration(call.duration_seconds)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={call.direction === 'inbound' ? 'default' : 'outline'}>
                                                        {call.direction === 'inbound' ? 'Inbound' : 'Outbound'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setMonitoringCall(monitoringCall === call.id ? null : call.id)}
                                                            title="Listen to call"
                                                        >
                                                            {monitoringCall === call.id ? (
                                                                <VolumeX className="h-4 w-4 text-red-500" />
                                                            ) : (
                                                                <Volume2 className="h-4 w-4" />
                                                            )}
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

                <TabsContent value="agents" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Agent Status</CardTitle>
                            <CardDescription>Real-time agent availability and activity</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {agents.map((agent) => (
                                    <Card key={agent.id} className={cn(
                                        "border-l-4",
                                        agent.status === 'available' && "border-l-green-500",
                                        agent.status === 'on-call' && "border-l-blue-500",
                                        agent.status === 'busy' && "border-l-yellow-500",
                                        agent.status === 'away' && "border-l-gray-400",
                                        agent.status === 'offline' && "border-l-gray-200",
                                        agent.status === 'wrap-up' && "border-l-purple-500"
                                    )}>
                                        <CardContent className="pt-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarFallback>{agent.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{agent.name}</p>
                                                        <p className="text-sm text-muted-foreground">{agent.email}</p>
                                                    </div>
                                                </div>
                                                <Badge className={cn(
                                                    "text-white",
                                                    getStatusColor(agent.status)
                                                )}>
                                                    {getStatusLabel(agent.status)}
                                                </Badge>
                                            </div>

                                            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">Calls Today</p>
                                                    <p className="font-semibold">{agent.calls_today}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Active Now</p>
                                                    <p className="font-semibold">{agent.active_calls}</p>
                                                </div>
                                            </div>

                                            {agent.last_active_at && (
                                                <p className="text-xs text-muted-foreground mt-3">
                                                    Last active: {formatDistanceToNow(new Date(agent.last_active_at), { addSuffix: true })}
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {agents.length === 0 && (
                                <div className="text-center py-12">
                                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No Agents Found</h3>
                                    <p className="text-muted-foreground">No agents are configured yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="queue" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Queue Overview</CardTitle>
                            <CardDescription>Callers waiting to be connected</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground">Callers Waiting</p>
                                    <p className="text-3xl font-bold">{queueStats.totalQueued}</p>
                                </div>
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground">Average Wait</p>
                                    <p className="text-3xl font-bold">{formatDuration(queueStats.avgWaitTime)}</p>
                                </div>
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground">Longest Wait</p>
                                    <p className="text-3xl font-bold text-red-600">{formatDuration(queueStats.maxWaitTime)}</p>
                                </div>
                            </div>

                            {queueStats.totalQueued === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium mb-2">Queue is Clear</h3>
                                    <p className="text-muted-foreground">No callers are waiting in the queue</p>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium mb-2">{queueStats.totalQueued} Callers Waiting</h3>
                                    <p className="text-muted-foreground">
                                        Consider enabling more agents to reduce wait times
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default LiveCallMonitor;
