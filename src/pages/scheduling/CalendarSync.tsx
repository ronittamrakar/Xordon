import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Calendar,
    RefreshCw,
    Link2,
    Check,
    X,
    AlertCircle,
    Settings,
    Plus,
    ExternalLink,
    Trash2,
    Cloud,
    CloudOff,
    ArrowRightLeft,
    ArrowRight,
    ArrowLeft,
    Clock,
    Globe,
    Mail,
    Video,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import * as calendarSyncApi from '@/services/calendarSyncApi';
import videoProvidersApi from '@/services/videoProvidersApi';

const PROVIDER_INFO: Record<calendarSyncApi.CalendarProvider, { name: string; icon: React.ReactNode; color: string }> = {
    google: {
        name: 'Google Calendar',
        icon: <Calendar className="w-5 h-5" />,
        color: 'bg-red-500',
    },
    outlook: {
        name: 'Outlook / Office 365',
        icon: <Mail className="w-5 h-5" />,
        color: 'bg-blue-500',
    },
    apple: {
        name: 'Apple iCloud',
        icon: <Cloud className="w-5 h-5" />,
        color: 'bg-gray-500',
    },
    ical: {
        name: 'iCal URL',
        icon: <Link2 className="w-5 h-5" />,
        color: 'bg-purple-500',
    },
};

const VIDEO_PROVIDER_INFO: Record<string, { name: string; icon: React.ReactNode; color: string; description: string }> = {
    zoom: {
        name: 'Zoom',
        icon: <Video className="w-5 h-5" />,
        color: 'bg-blue-600',
        description: 'Automatically create Zoom meetings for appointments'
    },
    google_meet: {
        name: 'Google Meet',
        icon: <Video className="w-5 h-5" />,
        color: 'bg-green-600',
        description: 'Generate Google Meet links via Calendar API'
    },
    microsoft_teams: {
        name: 'Microsoft Teams',
        icon: <Video className="w-5 h-5" />,
        color: 'bg-purple-600',
        description: 'Create Teams meetings for your appointments'
    },
};

interface CalendarSyncProps {
    hideHeader?: boolean;
}

export default function CalendarSync({ hideHeader = false }: CalendarSyncProps) {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('connections');
    const [showConnectDialog, setShowConnectDialog] = useState(false);
    const [showVideoConnectDialog, setShowVideoConnectDialog] = useState(false);
    const [showICalDialog, setShowICalDialog] = useState(false);
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
    const [selectedConnection, setSelectedConnection] = useState<calendarSyncApi.CalendarConnection | null>(null);
    const [icalUrl, setICalUrl] = useState('');
    const [icalName, setICalName] = useState('');

    // Queries
    const { data: connections, isLoading: loadingConnections } = useQuery({
        queryKey: ['calendar-connections'],
        queryFn: () => calendarSyncApi.listConnections(),
    });

    const { data: videoConnections, isLoading: loadingVideoConnections } = useQuery({
        queryKey: ['video-connections'],
        queryFn: () => videoProvidersApi.getConnections(),
    });

    const { data: settings } = useQuery({
        queryKey: ['calendar-sync-settings'],
        queryFn: () => calendarSyncApi.getGlobalSettings(),
    });

    // Mutations
    const connectMutation = useMutation({
        mutationFn: async (provider: calendarSyncApi.CalendarProvider) => {
            const { url } = await calendarSyncApi.getOAuthUrl(provider, window.location.href);
            window.location.href = url;
        },
        onError: () => toast.error('Failed to initiate connection'),
    });

    const connectVideoMutation = useMutation({
        mutationFn: async (provider: 'zoom' | 'google_meet' | 'microsoft_teams') => {
            const { auth_url } = await videoProvidersApi.getAuthUrl(provider);
            window.location.href = auth_url;
        },
        onError: () => toast.error('Failed to initiate video provider connection'),
    });

    const disconnectVideoMutation = useMutation({
        mutationFn: (id: number) => videoProvidersApi.disconnect(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['video-connections'] });
            toast.success('Video provider disconnected');
        },
        onError: () => toast.error('Failed to disconnect video provider'),
    });

    const connectICalMutation = useMutation({
        mutationFn: ({ url, name }: { url: string; name: string }) =>
            calendarSyncApi.connectICalUrl(url, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar-connections'] });
            setShowICalDialog(false);
            setICalUrl('');
            setICalName('');
            toast.success('iCal calendar connected!');
        },
        onError: () => toast.error('Failed to connect iCal URL'),
    });

    const syncMutation = useMutation({
        mutationFn: (id: string) => calendarSyncApi.triggerSync(id),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['calendar-connections'] });
            toast.success(
                `Synced! ${result.events_imported} imported, ${result.events_exported} exported`
            );
        },
        onError: () => toast.error('Sync failed'),
    });

    const syncAllMutation = useMutation({
        mutationFn: () => calendarSyncApi.triggerSyncAll(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar-connections'] });
            toast.success('All calendars synced!');
        },
        onError: () => toast.error('Sync failed'),
    });

    const disconnectMutation = useMutation({
        mutationFn: (id: string) => calendarSyncApi.deleteConnection(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar-connections'] });
            toast.success('Calendar disconnected');
        },
        onError: () => toast.error('Failed to disconnect'),
    });

    const updateConnectionMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Parameters<typeof calendarSyncApi.updateConnection>[1] }) =>
            calendarSyncApi.updateConnection(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar-connections'] });
            toast.success('Settings updated');
        },
        onError: () => toast.error('Failed to update settings'),
    });

    const updateSettingsMutation = useMutation({
        mutationFn: (data: Partial<calendarSyncApi.CalendarSyncGlobalSettings>) =>
            calendarSyncApi.updateGlobalSettings(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar-sync-settings'] });
            toast.success('Settings saved');
        },
        onError: () => toast.error('Failed to save settings'),
    });

    const getSyncDirectionIcon = (direction: string) => {
        switch (direction) {
            case 'two_way':
                return <ArrowRightLeft className="w-4 h-4" />;
            case 'one_way_to_local':
                return <ArrowLeft className="w-4 h-4" />;
            case 'one_way_to_external':
                return <ArrowRight className="w-4 h-4" />;
            default:
                return null;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="default" className="bg-green-500">Active</Badge>;
            case 'paused':
                return <Badge variant="secondary">Paused</Badge>;
            case 'error':
                return <Badge variant="destructive">Error</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loadingConnections) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className={hideHeader ? "space-y-6" : "container py-6 space-y-6"}>
            {/* Header */}
            {!hideHeader && (
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Calendar & Video Sync</h1>
                        <p className="text-muted-foreground">
                            Connect your calendars and video conferencing tools
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => syncAllMutation.mutate()}
                            disabled={syncAllMutation.isPending || !connections?.length}
                        >
                            {syncAllMutation.isPending ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Sync All
                        </Button>
                        <Button onClick={() => setShowConnectDialog(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Connect Calendar
                        </Button>
                    </div>
                </div>
            )}

            {/* Connection Status Alert */}
            {connections?.some(c => c.sync_status === 'error') && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Connection Issues</AlertTitle>
                    <AlertDescription>
                        One or more calendar connections have errors. Please check your connections below.
                    </AlertDescription>
                </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="connections">Calendar Sync</TabsTrigger>
                    <TabsTrigger value="video">Video Providers</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="connections" className="space-y-4">
                    {connections && connections.length > 0 ? (
                        <div className="grid gap-4">
                            {connections.map((connection) => (
                                <Card key={connection.id}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${PROVIDER_INFO[connection.provider].color
                                                        }`}
                                                >
                                                    {PROVIDER_INFO[connection.provider].icon}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-lg">
                                                            {connection.calendar_name || PROVIDER_INFO[connection.provider].name}
                                                        </h3>
                                                        {getStatusBadge(connection.sync_status)}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{connection.email}</p>
                                                    {connection.error_message && (
                                                        <p className="text-sm text-destructive mt-1">
                                                            {connection.error_message}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            {getSyncDirectionIcon(connection.sync_direction)}
                                                            {connection.sync_direction.replace(/_/g, ' ')}
                                                        </span>
                                                        {connection.last_synced_at && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                Last synced{' '}
                                                                {new Date(connection.last_synced_at).toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={connection.sync_enabled}
                                                    onCheckedChange={(checked) =>
                                                        updateConnectionMutation.mutate({
                                                            id: connection.id,
                                                            data: { sync_enabled: checked },
                                                        })
                                                    }
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => syncMutation.mutate(connection.id)}
                                                    disabled={syncMutation.isPending}
                                                >
                                                    {syncMutation.isPending ? (
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <RefreshCw className="w-4 h-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedConnection(connection);
                                                        setShowSettingsDialog(true);
                                                    }}
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => disconnectMutation.mutate(connection.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="border-2 border-dashed">
                            <CardContent className="py-12 text-center">
                                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-1">No calendars connected</h3>
                                <p className="text-muted-foreground mb-4">
                                    Connect your Google, Outlook, or iCal calendar to sync availability
                                </p>
                                <Button onClick={() => setShowConnectDialog(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Connect Calendar
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="video" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Video Conferencing</CardTitle>
                                    <CardDescription>
                                        Connect video providers to automatically generate meeting links
                                    </CardDescription>
                                </div>
                                <Button onClick={() => setShowVideoConnectDialog(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Connect Provider
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {videoConnections && videoConnections.length > 0 ? (
                                <div className="space-y-3">
                                    {videoConnections.map((connection) => (
                                        <div
                                            key={connection.id}
                                            className="flex items-center justify-between p-4 border rounded-lg"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${VIDEO_PROVIDER_INFO[connection.provider].color
                                                        }`}
                                                >
                                                    {VIDEO_PROVIDER_INFO[connection.provider].icon}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold">
                                                        {VIDEO_PROVIDER_INFO[connection.provider].name}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {connection.provider_email || 'Connected'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {VIDEO_PROVIDER_INFO[connection.provider].description}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {connection.is_active ? (
                                                    <Badge variant="default" className="bg-green-500">
                                                        Active
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">Inactive</Badge>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => disconnectVideoMutation.mutate(connection.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-1">No video providers connected</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Connect Zoom, Google Meet, or Microsoft Teams to auto-generate meeting links
                                    </p>
                                    <Button onClick={() => setShowVideoConnectDialog(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Connect Provider
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sync Settings</CardTitle>
                            <CardDescription>Configure global calendar sync behavior</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Auto-Sync Interval</Label>
                                    <p className="text-sm text-muted-foreground">
                                        How often to automatically sync calendars
                                    </p>
                                </div>
                                <Select
                                    defaultValue={settings?.auto_sync_interval_minutes?.toString() || '15'}
                                    onValueChange={(v) =>
                                        updateSettingsMutation.mutate({ auto_sync_interval_minutes: parseInt(v) })
                                    }
                                >
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5 minutes</SelectItem>
                                        <SelectItem value="15">15 minutes</SelectItem>
                                        <SelectItem value="30">30 minutes</SelectItem>
                                        <SelectItem value="60">1 hour</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Default Sync Direction</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Default direction for new connections
                                    </p>
                                </div>
                                <Select
                                    defaultValue={settings?.default_sync_direction || 'two_way'}
                                    onValueChange={(v: any) =>
                                        updateSettingsMutation.mutate({ default_sync_direction: v })
                                    }
                                >
                                    <SelectTrigger className="w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="two_way">Two-way sync</SelectItem>
                                        <SelectItem value="one_way_to_local">Import only</SelectItem>
                                        <SelectItem value="one_way_to_external">Export only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Block on External Events</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Block booking slots when external calendar has events
                                    </p>
                                </div>
                                <Switch
                                    checked={settings?.block_appointments_on_external_events}
                                    onCheckedChange={(checked) =>
                                        updateSettingsMutation.mutate({
                                            block_appointments_on_external_events: checked,
                                        })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Show External Events</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Display external events in the calendar view
                                    </p>
                                </div>
                                <Switch
                                    checked={settings?.show_external_events_in_calendar}
                                    onCheckedChange={(checked) =>
                                        updateSettingsMutation.mutate({
                                            show_external_events_in_calendar: checked,
                                        })
                                    }
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Sync Past Events (days)</Label>
                                    <Input
                                        type="number"
                                        defaultValue={settings?.sync_past_days || 7}
                                        onChange={(e) =>
                                            updateSettingsMutation.mutate({
                                                sync_past_days: parseInt(e.target.value),
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Sync Future Events (days)</Label>
                                    <Input
                                        type="number"
                                        defaultValue={settings?.sync_future_days || 90}
                                        onChange={(e) =>
                                            updateSettingsMutation.mutate({
                                                sync_future_days: parseInt(e.target.value),
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Connect Calendar Dialog */}
            <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Connect Calendar</DialogTitle>
                        <DialogDescription>
                            Choose a calendar provider to sync with
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                        <Button
                            variant="outline"
                            className="h-auto p-4 justify-start"
                            onClick={() => connectMutation.mutate('google')}
                            disabled={connectMutation.isPending}
                        >
                            <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center text-white mr-3">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium">Google Calendar</p>
                                <p className="text-sm text-muted-foreground">
                                    Personal or Google Workspace
                                </p>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto p-4 justify-start"
                            onClick={() => connectMutation.mutate('outlook')}
                            disabled={connectMutation.isPending}
                        >
                            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white mr-3">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium">Outlook / Office 365</p>
                                <p className="text-sm text-muted-foreground">
                                    Microsoft personal or work account
                                </p>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto p-4 justify-start"
                            onClick={() => {
                                setShowConnectDialog(false);
                                setShowICalDialog(true);
                            }}
                        >
                            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center text-white mr-3">
                                <Link2 className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium">iCal URL</p>
                                <p className="text-sm text-muted-foreground">
                                    Import from any calendar with iCal support
                                </p>
                            </div>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* iCal URL Dialog */}
            <Dialog open={showICalDialog} onOpenChange={setShowICalDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Connect iCal URL</DialogTitle>
                        <DialogDescription>
                            Enter an iCal URL to import events from another calendar
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Calendar Name</Label>
                            <Input
                                placeholder="e.g., Personal Calendar"
                                value={icalName}
                                onChange={(e) => setICalName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>iCal URL</Label>
                            <Input
                                placeholder="https://calendar.example.com/calendar.ics"
                                value={icalUrl}
                                onChange={(e) => setICalUrl(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                This URL usually ends in .ics and can be found in your calendar settings
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowICalDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => connectICalMutation.mutate({ url: icalUrl, name: icalName })}
                            disabled={connectICalMutation.isPending || !icalUrl || !icalName}
                        >
                            {connectICalMutation.isPending && (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            Connect
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Connection Settings Dialog */}
            {selectedConnection && (
                <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Calendar Settings</DialogTitle>
                            <DialogDescription>
                                Configure sync settings for {selectedConnection.calendar_name}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Sync Direction</Label>
                                <Select
                                    defaultValue={selectedConnection.sync_direction}
                                    onValueChange={(v: any) =>
                                        updateConnectionMutation.mutate({
                                            id: selectedConnection.id,
                                            data: { sync_direction: v } as any,
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="two_way">
                                            <div className="flex items-center gap-2">
                                                <ArrowRightLeft className="w-4 h-4" />
                                                Two-way sync
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="one_way_to_local">
                                            <div className="flex items-center gap-2">
                                                <ArrowLeft className="w-4 h-4" />
                                                Import only (to Xordon)
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="one_way_to_external">
                                            <div className="flex items-center gap-2">
                                                <ArrowRight className="w-4 h-4" />
                                                Export only (to external)
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Sync Appointments</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Include scheduled appointments
                                    </p>
                                </div>
                                <Switch
                                    checked={selectedConnection.settings.sync_appointments}
                                    onCheckedChange={(checked) =>
                                        updateConnectionMutation.mutate({
                                            id: selectedConnection.id,
                                            data: { sync_appointments: checked },
                                        })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Sync Availability Blocks</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Include busy/available time blocks
                                    </p>
                                </div>
                                <Switch
                                    checked={selectedConnection.settings.sync_blocks}
                                    onCheckedChange={(checked) =>
                                        updateConnectionMutation.mutate({
                                            id: selectedConnection.id,
                                            data: { sync_blocks: checked },
                                        })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>External Event Visibility</Label>
                                <Select
                                    defaultValue={selectedConnection.settings.external_event_visibility}
                                    onValueChange={(v: any) =>
                                        updateConnectionMutation.mutate({
                                            id: selectedConnection.id,
                                            data: { external_event_visibility: v },
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="busy">Show as "Busy" only</SelectItem>
                                        <SelectItem value="full_details">Show full event details</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Connect Video Provider Dialog */}
            <Dialog open={showVideoConnectDialog} onOpenChange={setShowVideoConnectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Connect Video Provider</DialogTitle>
                        <DialogDescription>
                            Choose a video conferencing provider to automatically generate meeting links
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                        <Button
                            variant="outline"
                            className="h-auto p-4 justify-start"
                            onClick={() => connectVideoMutation.mutate('zoom')}
                            disabled={connectVideoMutation.isPending}
                        >
                            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white mr-3">
                                <Video className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium">Zoom</p>
                                <p className="text-sm text-muted-foreground">
                                    Automatically create Zoom meetings
                                </p>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto p-4 justify-start"
                            onClick={() => connectVideoMutation.mutate('google_meet')}
                            disabled={connectVideoMutation.isPending}
                        >
                            <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center text-white mr-3">
                                <Video className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium">Google Meet</p>
                                <p className="text-sm text-muted-foreground">
                                    Generate Meet links via Calendar API
                                </p>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto p-4 justify-start"
                            onClick={() => connectVideoMutation.mutate('microsoft_teams')}
                            disabled={connectVideoMutation.isPending}
                        >
                            <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white mr-3">
                                <Video className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium">Microsoft Teams</p>
                                <p className="text-sm text-muted-foreground">
                                    Create Teams meetings automatically
                                </p>
                            </div>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
