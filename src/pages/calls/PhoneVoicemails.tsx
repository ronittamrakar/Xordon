import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Voicemail, RefreshCw, Play, Pause, Download, Trash2, Phone, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useCallSession } from '@/contexts/CallSessionContext';

interface VoicemailType {
    id: number;
    phone_number_id: number;
    from_number: string;
    transcription: string;
    audio_url: string;
    duration_seconds: number;
    status: string;
    received_at: string;
    phone_number?: {
        friendly_name: string;
        phone_number: string;
    };
}

export default function PhoneVoicemails() {
    const { requestSoftphoneCall } = useCallSession();

    const [voicemails, setVoicemails] = useState<VoicemailType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [playingId, setPlayingId] = useState<number | null>(null);
    const [selectedVoicemail, setSelectedVoicemail] = useState<VoicemailType | null>(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/phone/voicemails');
            setVoicemails((response.data as any)?.items || []);
        } catch (error) {
            console.error('Failed to load voicemails:', error);
            toast.error('Failed to load voicemails');
        } finally {
            setLoading(false);
        }
    };

    const filteredVoicemails = useMemo(() => {
        return voicemails.filter(vm => {
            // Status filter
            if (statusFilter !== 'all' && vm.status !== statusFilter) return false;

            // Search filter
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return (
                    vm.from_number.toLowerCase().includes(term) ||
                    vm.transcription?.toLowerCase().includes(term) ||
                    vm.phone_number?.friendly_name?.toLowerCase().includes(term)
                );
            }

            return true;
        });
    }, [voicemails, statusFilter, searchTerm]);

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            read: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
            archived: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        };
        return <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
    };

    const togglePlay = (vm: VoicemailType) => {
        if (playingId === vm.id) {
            audioRef.current?.pause();
            setPlayingId(null);
        } else {
            if (audioRef.current) {
                audioRef.current.src = vm.audio_url;
                audioRef.current.play();
                setPlayingId(vm.id);

                // Auto-mark as read when played
                if (vm.status === 'new') {
                    markRead(vm.id);
                }
            }
        }
    };

    const markRead = async (id: number) => {
        try {
            await api.put(`/phone/voicemails/${id}`, { status: 'read' });
            setVoicemails(prev => prev.map(vm => vm.id === id ? { ...vm, status: 'read' } : vm));
        } catch (error) {
            toast.error('Failed to update voicemail');
        }
    };

    const archiveVoicemail = async (id: number) => {
        try {
            await api.put(`/phone/voicemails/${id}`, { status: 'archived' });
            toast.success('Voicemail archived');
            setVoicemails(prev => prev.map(vm => vm.id === id ? { ...vm, status: 'archived' } : vm));
        } catch (error) {
            toast.error('Failed to archive voicemail');
        }
    };

    const deleteVoicemail = async (id: number) => {
        if (!confirm('Are you sure you want to delete this voicemail?')) return;

        try {
            await api.delete(`/phone/voicemails/${id}`);
            toast.success('Voicemail deleted');
            setVoicemails(prev => prev.filter(vm => vm.id !== id));
        } catch (error) {
            toast.error('Failed to delete voicemail');
        }
    };

    const downloadVoicemail = (vm: VoicemailType) => {
        const link = document.createElement('a');
        link.href = vm.audio_url;
        link.download = `voicemail-${vm.from_number}-${new Date(vm.received_at).toISOString()}.mp3`;
        link.click();
    };

    const callBack = (phoneNumber: string) => {
        requestSoftphoneCall({
            number: phoneNumber,
            source: 'softphone',
            recipientName: 'Voicemail Caller',
            metadata: {
                source: 'voicemail'
            }
        });
        toast.info(`Initiating call to ${phoneNumber}...`);
    };

    const viewDetails = (vm: VoicemailType) => {
        setSelectedVoicemail(vm);
        setShowDetailsDialog(true);
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                onEnded={() => setPlayingId(null)}
                onError={() => {
                    toast.error('Failed to play voicemail');
                    setPlayingId(null);
                }}
            />

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Voicemails</h1>
                    <p className="text-muted-foreground">Listen to and manage your voicemails</p>
                </div>
                <Button variant="outline" onClick={loadData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search voicemails..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Voicemails</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Voicemail List */}
            <div className="space-y-4">
                {filteredVoicemails.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Voicemail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No voicemails found</h3>
                            <p className="text-sm text-muted-foreground">
                                {searchTerm || statusFilter !== 'all'
                                    ? 'Try adjusting your filters'
                                    : 'Voicemails will appear here when callers leave messages'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredVoicemails.map((vm) => (
                        <Card key={vm.id} className={vm.status === 'new' ? 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20' : ''}>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    {/* Play Button */}
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="flex-shrink-0 mt-1"
                                        onClick={() => togglePlay(vm)}
                                    >
                                        {playingId === vm.id ? (
                                            <Pause className="h-4 w-4" />
                                        ) : (
                                            <Play className="h-4 w-4" />
                                        )}
                                    </Button>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className="font-semibold">{vm.from_number}</span>
                                            {getStatusBadge(vm.status)}
                                            <span className="text-sm text-muted-foreground">
                                                {new Date(vm.received_at).toLocaleString()}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                • {formatDuration(vm.duration_seconds)}
                                            </span>
                                        </div>

                                        {vm.phone_number && (
                                            <p className="text-sm text-muted-foreground mb-2">
                                                To: {vm.phone_number.friendly_name}
                                            </p>
                                        )}

                                        {vm.transcription && (
                                            <div className="bg-muted p-3 rounded-md mb-2">
                                                <p className="text-sm italic">{vm.transcription}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 flex-shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => callBack(vm.from_number)}
                                            title="Call back"
                                        >
                                            <Phone className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => downloadVoicemail(vm)}
                                            title="Download"
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        {vm.status !== 'archived' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => archiveVoicemail(vm.id)}
                                                title="Archive"
                                            >
                                                <Archive className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteVoicemail(vm.id)}
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Details Dialog */}
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Voicemail Details</DialogTitle>
                        <DialogDescription>
                            From {selectedVoicemail?.from_number}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedVoicemail && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Received</p>
                                <p className="font-medium">{new Date(selectedVoicemail.received_at).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Duration</p>
                                <p className="font-medium">{formatDuration(selectedVoicemail.duration_seconds)}</p>
                            </div>
                            {selectedVoicemail.transcription && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Transcription</p>
                                    <div className="bg-muted p-3 rounded-md">
                                        <p className="text-sm">{selectedVoicemail.transcription}</p>
                                    </div>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">Audio</p>
                                <audio controls className="w-full">
                                    <source src={selectedVoicemail.audio_url} type="audio/mpeg" />
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                            Close
                        </Button>
                        {selectedVoicemail && (
                            <Button onClick={() => {
                                callBack(selectedVoicemail.from_number);
                                setShowDetailsDialog(false);
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
