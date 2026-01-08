import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Video,
    Plus,
    Calendar,
    Users,
    Clock,
    MoreHorizontal,
    Play,
    Settings,
    Trash2,
    Copy,
    Share2,
    Search,
    Filter,
    ArrowRight,
    Monitor,
    Mic,
    MessageSquare,
    Sparkles,
    Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { webinarApi, Webinar } from '@/services/webinarApi';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { WebinarInviteModal } from '@/components/webinars/WebinarInviteModal';

const WebinarList = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null);

    const { data: webinars, isLoading } = useQuery({
        queryKey: ['webinars'],
        queryFn: webinarApi.list
    });

    const deleteMutation = useMutation({
        mutationFn: webinarApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webinars'] });
            toast.success('Webinar deleted');
        }
    });

    const getStatusBadge = (status: Webinar['status']) => {
        switch (status) {
            case 'live':
                return <Badge className="bg-red-500 hover:bg-red-600 animate-pulse"><div className="h-2 w-2 rounded-full bg-white mr-2" /> LIVE NOW</Badge>;
            case 'scheduled':
                return <Badge className="bg-blue-500 hover:bg-blue-600"><Calendar className="h-3 w-3 mr-1" /> Scheduled</Badge>;
            case 'ended':
                return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Ended</Badge>;
            default:
                return <Badge variant="outline">Draft</Badge>;
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Webinar Studio</h1>
                    <p className="text-muted-foreground font-medium">Host live events, masterclasses, and evergreen webinars with 0ms latency</p>
                </div>
                <Button className="rounded-full shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 px-8" onClick={() => navigate('/marketing/webinars/create')}>
                    <Plus className="h-4 w-4 mr-2" /> Schedule Event
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-xl bg-slate-900 text-white p-1 relative overflow-hidden group">
                    {/* Glass effect card */}
                    <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6 flex items-center gap-6">
                        <div className="h-16 w-16 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
                            <Monitor className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-blue-400">Next Event</p>
                            <p className="text-lg font-bold leading-tight mt-1">SaaS Sales Accelerator Masterclass</p>
                            <div className="flex items-center gap-3 mt-2">
                                <Badge variant="outline" className="text-[12px] border-primary/30 text-primary">TODAY @ 4:00 PM</Badge>
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => <div key={i} className="h-5 w-5 rounded-full border-2 border-slate-900 bg-slate-700" />)}
                                    <div className="h-5 w-5 rounded-full border-2 border-slate-900 bg-slate-800 text-[8px] flex items-center justify-center font-bold">+142</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl p-1 bg-gradient-to-br from-indigo-500 to-purple-600 text-white group overflow-hidden">
                    <CardContent className="p-6 flex items-center gap-6">
                        <div className="h-16 w-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                            <Users className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-indigo-100">Total Reach</p>
                            <p className="text-2xl font-black mt-1">12,402</p>
                            <p className="text-[12px] font-bold opacity-70">Across 24 hosted webinars</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl p-1 bg-white border border-slate-100 group">
                    <CardContent className="p-6 flex items-center gap-6 text-slate-900">
                        <div className="h-16 w-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400">
                            <Sparkles className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Evergreen Funnels</p>
                            <p className="text-2xl font-black mt-1">08</p>
                            <p className="text-[12px] font-bold text-slate-400">Passive revenue generating</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-between gap-4 pt-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search webinars..."
                        className="pl-10 h-11 border-none bg-slate-100/50 shadow-inner rounded-2xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl border-slate-200 h-11"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isLoading ? (
                    [1, 2, 3].map(i => <Card key={i} className="h-[400px] animate-pulse bg-slate-50 rounded-3xl" />)
                ) : webinars?.length === 0 ? (
                    <div className="col-span-full py-24 text-center bg-slate-50 border-2 border-dashed rounded-[40px] space-y-6">
                        <div className="h-24 w-24 bg-white rounded-[32px] shadow-2xl flex items-center justify-center mx-auto text-blue-500">
                            <Video className="h-12 w-12" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black">Ready for your first event?</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mt-2">Xordon Webinar Studio gives you ultra-low latency streaming, interactive chats, and automated funnel triggers.</p>
                        </div>
                        <Button className="rounded-full shadow-xl bg-primary hover:bg-primary/90 px-10 h-12" onClick={() => navigate('/marketing/webinars/create')}>
                            <Plus className="h-4 w-4 mr-2" /> Create First Webinar
                        </Button>
                    </div>
                ) : (
                    webinars?.map(webinar => (
                        <Card key={webinar.id} className="overflow-hidden group hover:shadow-2xl transition-all duration-500 border-none ring-1 ring-slate-100 rounded-[32px]">
                            <div className="aspect-video relative overflow-hidden bg-slate-100">
                                {webinar.thumbnail ? (
                                    <img src={webinar.thumbnail} alt={webinar.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-gradient-to-br from-slate-50 to-slate-200">
                                        <Video className="h-16 w-16 opacity-30" />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">
                                    {getStatusBadge(webinar.status)}
                                </div>
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                                    <div className="flex gap-2 w-full">
                                        <Button className="flex-1 bg-white text-slate-900 hover:bg-slate-100 rounded-full font-bold shadow-2xl" onClick={() => navigate(`/marketing/webinars/room/${webinar.id}`)}>
                                            <Play className="h-3 w-3 mr-2 fill-current" /> Join Room
                                        </Button>
                                        <Button variant="secondary" className="bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/20 rounded-full h-9 w-9 p-0">
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <CardHeader className="p-6 space-y-1">
                                <CardTitle className="text-xl font-black line-clamp-1 group-hover:text-primary transition-colors">{webinar.title}</CardTitle>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span className="font-bold">{webinar.scheduled_at ? format(new Date(webinar.scheduled_at), 'MMM d, h:mm a') : 'Not Scheduled'}</span>
                                    <span className="mx-1">•</span>
                                    <span className="font-bold">{webinar.duration_minutes} min</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 pt-0 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Users className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="text-xs font-black">214 registered</span>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-none ring-1 ring-slate-100">
                                        <DropdownMenuItem className="rounded-xl gap-2 cursor-pointer py-2.5 font-bold" onClick={() => navigate(`/marketing/webinars/edit/${webinar.id}`)}>
                                            <Settings className="h-4 w-4" /> Edit Settings
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="rounded-xl gap-2 cursor-pointer py-2.5 font-bold"
                                            onClick={() => {
                                                const link = `${window.location.origin}/marketing/webinars/join/${webinar.id}`;
                                                navigator.clipboard.writeText(link);
                                                toast.success('Promotional link copied to clipboard');
                                            }}
                                        >
                                            <Share2 className="h-4 w-4" /> Promotional Link
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="rounded-xl gap-2 cursor-pointer py-2.5 font-bold"
                                            onClick={() => {
                                                setSelectedWebinar(webinar);
                                                setInviteModalOpen(true);
                                            }}
                                        >
                                            <Send className="h-4 w-4" /> Send Invitations
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="rounded-xl gap-2 cursor-pointer py-2.5 font-bold"
                                            onClick={async () => {
                                                try {
                                                    const { id: newId } = await webinarApi.create({
                                                        title: `${webinar.title} (Copy)`,
                                                        description: webinar.description,
                                                        duration_minutes: webinar.duration_minutes,
                                                        status: 'draft',
                                                        is_evergreen: webinar.is_evergreen,
                                                        max_registrants: webinar.max_registrants,
                                                        thumbnail: webinar.thumbnail
                                                    });
                                                    toast.success('Webinar cloned as draft');
                                                    queryClient.invalidateQueries({ queryKey: ['webinars'] });
                                                    navigate(`/marketing/webinars/edit/${newId}`);
                                                } catch (e) {
                                                    toast.error('Failed to clone webinar');
                                                }
                                            }}
                                        >
                                            <Copy className="h-4 w-4" /> Clone Event
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="rounded-xl gap-2 cursor-pointer py-2.5 font-bold text-red-500 focus:bg-red-50 focus:text-red-500"
                                            onClick={() => {
                                                if (window.confirm("Are you sure you want to cancel this webinar?")) {
                                                    deleteMutation.mutate(webinar.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" /> Cancel Webinar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
            {selectedWebinar && (
                <WebinarInviteModal
                    webinarId={selectedWebinar.id}
                    webinarTitle={selectedWebinar.title}
                    open={inviteModalOpen}
                    onOpenChange={setInviteModalOpen}
                />
            )}
        </div>
    );
};

export default WebinarList;
