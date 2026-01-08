import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
    Phone,
    Play,
    Pause,
    Download,
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    Clock,
    User,
    BarChart3,
    Settings,
    Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface CallRecording {
    id: string;
    call_id: string;
    phone_number: string;
    duration: number;
    recording_url: string;
    created_at: string;
    contact_name?: string;
    direction: 'inbound' | 'outbound';
    status: 'completed' | 'failed';
}

export default function CallRecordings() {
    const [recordings, setRecordings] = useState<CallRecording[]>([]);
    const [playing, setPlaying] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

    useEffect(() => {
        loadRecordings();
    }, []);

    const loadRecordings = async () => {
        setLoading(true);
        try {
            // Mock data for UI testing
            const mockRecordings: CallRecording[] = [
                {
                    id: '1',
                    call_id: 'call_123',
                    phone_number: '+1 (555) 123-4567',
                    duration: 145,
                    recording_url: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
                    created_at: new Date().toISOString(),
                    contact_name: 'John Doe',
                    direction: 'inbound',
                    status: 'completed'
                },
                {
                    id: '2',
                    call_id: 'call_124',
                    phone_number: '+1 (555) 987-6543',
                    duration: 62,
                    recording_url: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    contact_name: 'Jane Smith',
                    direction: 'outbound',
                    status: 'completed'
                },
                {
                    id: '3',
                    call_id: 'call_125',
                    phone_number: '+1 (555) 456-7890',
                    duration: 0,
                    recording_url: '',
                    created_at: new Date(Date.now() - 172800000).toISOString(),
                    contact_name: 'Unknown Caller',
                    direction: 'inbound',
                    status: 'failed'
                }
            ];

            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network play
            console.log('Recordings loaded from mock data', mockRecordings);
            setRecordings(mockRecordings);
        } catch (error) {
            toast.error('Failed to load recordings');
        } finally {
            setLoading(false);
        }
    };

    const handlePlay = (recording: CallRecording) => {
        if (playing === recording.id) {
            audioElement?.pause();
            setPlaying(null);
        } else {
            if (audioElement) {
                audioElement.pause();
            }

            const audio = new Audio(recording.recording_url);
            audio.play();
            audio.onended = () => setPlaying(null);
            setAudioElement(audio);
            setPlaying(recording.id);
        }
    };

    const handleDownload = async (recording: CallRecording) => {
        try {
            const link = document.createElement('a');
            link.href = recording.recording_url;
            link.download = `call-${recording.phone_number}-${recording.created_at}.mp3`;
            link.click();
            toast.success('Download started');
        } catch (error) {
            toast.error('Failed to download recording');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this recording?')) return;

        try {
            // TODO: Implement actual API call when backend endpoint is ready
            setRecordings(prev => prev.filter(r => r.id !== id));
            toast.success('Recording deleted');
        } catch (error) {
            toast.error('Failed to delete recording');
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const stats = {
        total: recordings.length,
        inbound: recordings.filter(r => r.direction === 'inbound').length,
        outbound: recordings.filter(r => r.direction === 'outbound').length,
        totalDuration: recordings.reduce((sum, r) => sum + r.duration, 0)
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[18px] font-bold">
                        Call Recordings
                    </h1>
                    <p className="text-muted-foreground">
                        Listen to, download, and manage your call recordings
                    </p>
                </div>
                <Button onClick={loadRecordings} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Recordings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Inbound Calls</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.inbound}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Outbound Calls</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.outbound}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatDuration(stats.totalDuration)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Recordings List */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Recordings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {recordings.map(recording => (
                            <div key={recording.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4 flex-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePlay(recording)}
                                    >
                                        {playing === recording.id ? (
                                            <Pause className="h-4 w-4" />
                                        ) : (
                                            <Play className="h-4 w-4" />
                                        )}
                                    </Button>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-medium">{recording.contact_name || recording.phone_number}</span>
                                            <Badge variant={recording.direction === 'inbound' ? 'default' : 'secondary'}>
                                                {recording.direction}
                                            </Badge>
                                            <Badge variant={recording.status === 'completed' ? 'default' : 'destructive'}>
                                                {recording.status}
                                            </Badge>
                                        </div>
                                        <div className="flex gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDuration(recording.duration)}
                                            </span>
                                            <span>{new Date(recording.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownload(recording)}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete(recording.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {recordings.length === 0 && !loading && (
                            <div className="text-center py-12">
                                <Mic className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="font-semibold mb-2">No recordings found</h3>
                                <p className="text-muted-foreground">
                                    Call recordings will appear here once you enable recording in your call settings
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
