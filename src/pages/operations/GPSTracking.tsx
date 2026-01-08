import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Navigation, Clock, User, Phone, MessageCircle, RefreshCw, Send, Search, Battery, BatteryLow, CheckCircle, Circle, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import * as gpsApi from '@/services/gpsTrackingApi';

const MOCK_TECHNICIANS = [
    { id: 't1', name: 'John Smith', status: 'active', current_job: 'Plumbing repair at 123 Main St', battery_level: 85, last_seen_at: new Date().toISOString(), jobs_today: 5, jobs_completed: 2, eta_minutes: 15 },
    { id: 't2', name: 'Sarah Johnson', status: 'active', current_job: 'HVAC maintenance', battery_level: 62, last_seen_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), jobs_today: 4, jobs_completed: 3, eta_minutes: 8 },
    { id: 't3', name: 'Mike Brown', status: 'inactive', current_job: null, battery_level: 23, last_seen_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), jobs_today: 6, jobs_completed: 4 },
    { id: 't4', name: 'Emily Davis', status: 'offline', current_job: null, battery_level: null, last_seen_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), jobs_today: 3, jobs_completed: 3 },
];

export default function GPSTracking() {
    const queryClient = useQueryClient();
    const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifyDialog, setShowNotifyDialog] = useState(false);
    const [isLiveUpdating, setIsLiveUpdating] = useState(true);

    const { data: technicians, isLoading } = useQuery({
        queryKey: ['technician-locations'],
        queryFn: async () => MOCK_TECHNICIANS,
        refetchInterval: isLiveUpdating ? 10000 : false,
    });

    const sendNotificationMutation = useMutation({
        mutationFn: (jobId: string) => gpsApi.sendEnRouteNotification(jobId, { include_tracking_link: true }),
        onSuccess: () => { toast.success('Notification sent!'); setShowNotifyDialog(false); },
        onError: () => toast.error('Failed to send notification'),
    });

    const selectedTech = technicians?.find((t) => t.id === selectedTechnician);
    const filteredTechnicians = technicians?.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const activeCount = technicians?.filter((t) => t.status === 'active').length || 0;

    const getBatteryIcon = (level: number | null) => {
        if (level === null) return <Battery className="w-4 h-4 text-muted-foreground" />;
        if (level < 20) return <BatteryLow className="w-4 h-4 text-red-500" />;
        return <Battery className="w-4 h-4 text-green-500" />;
    };

    const getStatusBadge = (status: string) => {
        const cfg: Record<string, { v: 'default' | 'secondary' | 'outline'; l: string }> = { active: { v: 'default', l: 'Active' }, inactive: { v: 'secondary', l: 'Idle' }, offline: { v: 'outline', l: 'Offline' } };
        return <Badge variant={cfg[status]?.v || 'outline'}>{cfg[status]?.l || status}</Badge>;
    };

    const formatTimeAgo = (d: string) => { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`; };

    return (
        <div className="container py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold">GPS Tracking</h1><p className="text-muted-foreground">Real-time location tracking for field technicians</p></div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Live</span><Switch checked={isLiveUpdating} onCheckedChange={setIsLiveUpdating} /></div>
                    <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['technician-locations'] })}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card><CardHeader className="pb-2"><CardDescription>Active Technicians</CardDescription><CardTitle className="text-2xl flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />{activeCount}/{technicians?.length || 0}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Jobs Today</CardDescription><CardTitle className="text-2xl">{technicians?.reduce((a, t) => a + t.jobs_today, 0) || 0}</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Avg. Response Time</CardDescription><CardTitle className="text-2xl">12 min</CardTitle></CardHeader></Card>
                <Card><CardHeader className="pb-2"><CardDescription>Miles Today</CardDescription><CardTitle className="text-2xl">142 mi</CardTitle></CardHeader></Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-1"><CardHeader className="pb-2"><CardTitle className="text-lg">Technicians</CardTitle></CardHeader>
                    <CardContent className="p-2">
                        <div className="relative mb-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-9" /></div>
                        <ScrollArea className="h-[400px]">
                            {isLoading ? <div className="flex items-center justify-center py-8"><RefreshCw className="w-6 h-6 animate-spin" /></div> : filteredTechnicians?.map((tech) => (
                                <div key={tech.id} className={cn('p-3 rounded-lg cursor-pointer transition-colors', selectedTechnician === tech.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted')} onClick={() => setSelectedTechnician(tech.id)}>
                                    <div className="flex items-start gap-3">
                                        <Avatar className="w-10 h-10"><AvatarFallback>{tech.name.charAt(0)}</AvatarFallback></Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between"><p className="font-medium text-sm truncate">{tech.name}</p><div className="flex items-center gap-1">{getBatteryIcon(tech.battery_level)}<span className="text-xs text-muted-foreground">{tech.battery_level}%</span></div></div>
                                            <p className="text-xs text-muted-foreground truncate">{tech.current_job || 'No active job'}</p>
                                            <div className="flex items-center gap-2 mt-1"><span className="text-xs text-muted-foreground">{tech.jobs_completed}/{tech.jobs_today} jobs</span>{tech.eta_minutes && <Badge variant="outline" className="text-xs h-5"><Clock className="w-3 h-3 mr-1" />{tech.eta_minutes}m</Badge>}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </ScrollArea>
                    </CardContent>
                </Card>

                <div className="lg:col-span-3 space-y-4">
                    <Card className="h-[400px] flex items-center justify-center bg-muted/30"><div className="text-center"><MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Map Integration</p><p className="text-sm text-muted-foreground">Connect Google Maps, Mapbox, or Leaflet</p></div></Card>

                    {selectedTech && (
                        <Card><CardHeader className="pb-2"><div className="flex items-center justify-between">
                            <div className="flex items-center gap-3"><Avatar className="w-12 h-12"><AvatarFallback className="text-lg">{selectedTech.name.charAt(0)}</AvatarFallback></Avatar><div><CardTitle className="text-lg">{selectedTech.name}</CardTitle><div className="flex items-center gap-2 mt-1">{getStatusBadge(selectedTech.status)}<span className="text-sm text-muted-foreground">Last seen {formatTimeAgo(selectedTech.last_seen_at)}</span></div></div></div>
                            <div className="flex items-center gap-2"><Button variant="outline" size="sm"><Phone className="w-4 h-4 mr-2" />Call</Button><Button variant="outline" size="sm"><MessageCircle className="w-4 h-4 mr-2" />Message</Button><Button size="sm" onClick={() => setShowNotifyDialog(true)}><Send className="w-4 h-4 mr-2" />Notify Customer</Button></div>
                        </div></CardHeader>
                            <CardContent><div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-lg bg-muted/50"><p className="text-sm text-muted-foreground mb-1">Current Job</p><p className="font-medium">{selectedTech.current_job || 'No active job'}</p>{selectedTech.eta_minutes && <Badge variant="secondary" className="mt-2"><Clock className="w-3 h-3 mr-1" />ETA: {selectedTech.eta_minutes}m</Badge>}</div>
                                <div className="p-4 rounded-lg bg-muted/50"><p className="text-sm text-muted-foreground mb-1">Progress</p><Progress value={(selectedTech.jobs_completed / selectedTech.jobs_today) * 100} className="h-2" /><p className="text-xs text-muted-foreground mt-1">{selectedTech.jobs_completed}/{selectedTech.jobs_today} jobs</p></div>
                                <div className="p-4 rounded-lg bg-muted/50"><p className="text-sm text-muted-foreground mb-1">Battery</p><div className="flex items-center gap-2">{getBatteryIcon(selectedTech.battery_level)}<span className="font-medium">{selectedTech.battery_level || 0}%</span></div></div>
                            </div></CardContent></Card>
                    )}
                </div>
            </div>

            <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}><DialogContent><DialogHeader><DialogTitle>Send Customer Notification</DialogTitle><DialogDescription>Send "On My Way" notification</DialogDescription></DialogHeader>
                <div className="p-4 rounded-lg bg-muted"><p className="text-sm">Your technician is on their way! ETA: {selectedTech?.eta_minutes || 15} minutes.</p></div>
                <DialogFooter><Button variant="outline" onClick={() => setShowNotifyDialog(false)}>Cancel</Button><Button onClick={() => sendNotificationMutation.mutate('job-1')} disabled={sendNotificationMutation.isPending}>{sendNotificationMutation.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}Send</Button></DialogFooter>
            </DialogContent></Dialog>
        </div>
    );
}
