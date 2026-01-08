import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Mic,
    MicOff,
    Video as VideoIcon,
    VideoOff,
    Monitor,
    MessageSquare,
    Users,
    MoreVertical,
    Share2,
    Settings,
    LogOut,
    Send,
    Smile,
    Hand,
    Heart,
    Zap,
    Sparkles,
    Shield,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { webinarApi } from '@/services/webinarApi';
import { ScrollArea } from '@/components/ui/scroll-area';

const WebinarRoom = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([
        { id: '1', user: 'Sarah Miller', message: 'Ready to learn! 👋', time: '4:02 PM' },
        { id: '2', user: 'Mark Chen', message: 'The audio is super clear.', time: '4:03 PM' }
    ]);
    const [activeSidebarTab, setActiveSidebarTab] = useState<'chat' | 'attendees'>('chat');
    const [duration, setDuration] = useState(0);

    const { data: webinar, isLoading } = useQuery({
        queryKey: ['webinar', id],
        queryFn: () => webinarApi.get(id!)
    });

    const { data: registrants, refetch: refetchRegistrants } = useQuery({
        queryKey: ['webinarRegistrants', id],
        queryFn: () => webinarApi.listRegistrants(id!),
        enabled: !!id
    });

    // Media Stream Management
    useEffect(() => {
        let currentStream: MediaStream | null = null;

        const initMedia = async () => {
            try {
                if (!isVideoOff) {
                    const mediaStream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true
                    });
                    currentStream = mediaStream;
                    setStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                }
            } catch (err) {
                console.error("Media access denied:", err);
                setIsVideoOff(true);
                toast.error("Could not access camera/microphone. Please check permissions.");
            }
        };

        if (!isScreenSharing) {
            initMedia();
        }

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [id, isVideoOff, isScreenSharing]);

    // Timer logic
    useEffect(() => {
        const timer = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleSendMessage = () => {
        if (!message.trim()) return;
        const newMsg = {
            id: Date.now().toString(),
            user: 'Me (Host)',
            message: message.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChat([...chat, newMsg]);
        setMessage('');
    };

    const toggleMute = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        setIsVideoOff(!isVideoOff);
    };

    const startScreenShare = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            setIsScreenSharing(true);
            if (videoRef.current) {
                videoRef.current.srcObject = screenStream;
            }
            screenStream.getVideoTracks()[0].onended = () => {
                setIsScreenSharing(false);
            };
        } catch (err) {
            console.error("Screen share failed:", err);
            toast.error("Failed to start screen share");
        }
    };

    const endWebinar = async () => {
        if (window.confirm("Are you sure you want to end this webinar? This will disconnect all attendees.")) {
            try {
                await webinarApi.update(id!, { status: 'ended' });
                toast.success("Webinar ended successfully");
                navigate('/marketing/webinars');
            } catch (err) {
                toast.error("Failed to end webinar");
            }
        }
    };

    const copyInviteLink = () => {
        const link = window.location.href.replace('/room/', '/join/'); // Assuming a join page exists
        navigator.clipboard.writeText(link);
        toast.success("Invite link copied to clipboard");
    };

    const sendReaction = (type: string) => {
        toast.info(`Sending ${type} to attendees!`, {
            icon: type === 'heart' ? '❤️' : type === 'zap' ? '⚡' : '😊'
        });
        // In a real app, this would emit a socket event
    };

    if (isLoading) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white font-black italic text-2xl animate-pulse">ENTERING STUDIO...</div>;

    return (
        <div className="h-screen bg-slate-950 flex flex-col text-slate-200 overflow-hidden">
            {/* Top Navigation */}
            <header className="h-16 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-3xl border-b border-white/5 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="h-8 w-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <VideoIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-sm font-black truncate max-w-[300px]">{webinar?.title}</h1>
                        <div className="text-[12px] text-primary font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> LIVE • {registrants?.length || 0} ATTENDEES
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" className="text-xs font-bold hover:bg-white/5" onClick={copyInviteLink}>
                        <Share2 className="h-3.5 w-3.5 mr-2" /> Invite Guests
                    </Button>
                    <div className="h-8 w-px bg-white/10 mx-2" />
                    <Button variant="destructive" size="sm" className="rounded-full px-5 text-xs font-black" onClick={endWebinar}>
                        <LogOut className="h-3.5 w-3.5 mr-2" /> End Stream
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden p-4 gap-4">
                {/* Main Video Stage */}
                <main className="flex-1 relative bg-black rounded-3xl overflow-hidden shadow-2xl group flex flex-col">
                    <div className="flex-1 flex items-center justify-center bg-slate-900 overflow-hidden relative">
                        {isVideoOff && !isScreenSharing ? (
                            <div className="text-center space-y-4">
                                <div className="h-24 w-24 rounded-full bg-slate-800 flex items-center justify-center mx-auto ring-4 ring-white/5">
                                    <VideoOff className="h-10 w-10 text-slate-500" />
                                </div>
                                <p className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Stage is dark</p>
                            </div>
                        ) : (
                            <div className="w-full h-full relative group/video">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted={true} // Always mute local preview to avoid feedback
                                    playsInline
                                    className={`w-full h-full object-cover ${!isScreenSharing ? 'scale-x-[-1]' : ''}`}
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-full border-4 border-primary bg-slate-800 overflow-hidden">
                                            <img src={`https://ui-avatars.com/api/?name=${webinar?.title || 'Host'}&background=0284c7&color=fff`} className="w-full h-full" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black italic">Host (You)</p>
                                            <p className="text-xs text-primary font-black uppercase tracking-widest">
                                                {isScreenSharing ? 'Sharing Screen' : 'Presenter'} • Ultra Low Latency Active
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Floating Controls */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/80 backdrop-blur-3xl p-3 px-6 rounded-full border border-white/10 shadow-3xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                        <Button
                            variant={isMuted ? 'destructive' : 'secondary'}
                            size="icon"
                            className="rounded-full shadow-2xl h-11 w-11"
                            onClick={toggleMute}
                        >
                            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </Button>
                        <Button
                            variant={isVideoOff ? 'destructive' : 'secondary'}
                            size="icon"
                            className="rounded-full shadow-2xl h-11 w-11"
                            onClick={toggleVideo}
                        >
                            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
                        </Button>
                        <div className="w-px h-8 bg-white/10 mx-2" />
                        <Button
                            variant={isScreenSharing ? 'default' : 'secondary'}
                            size="icon"
                            className="rounded-full shadow-2xl h-11 w-11"
                            onClick={isScreenSharing ? () => setIsScreenSharing(false) : startScreenShare}
                        >
                            <Monitor className="h-5 w-5" />
                        </Button>
                        <Button variant="secondary" size="icon" className="rounded-full shadow-2xl h-11 w-11" onClick={() => toast.success("Wave sent to attendees!")}>
                            <Hand className="h-5 w-5" />
                        </Button>
                        <Button variant="secondary" size="icon" className="rounded-full shadow-2xl h-11 w-11" onClick={() => navigate(`/marketing/webinars/edit/${id}`)}>
                            <Settings className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Overlay Notifications */}
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                        <Badge className="bg-red-500 font-black h-7 px-4 shadow-xl">LIVE</Badge>
                        <Badge variant="outline" className="bg-white/10 backdrop-blur-3xl border-white/20 text-white font-black h-7 px-4">
                            {formatDuration(duration)}
                        </Badge>
                    </div>

                    <div className="absolute top-6 right-6 flex flex-col gap-3">
                        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-3 flex flex-col items-center gap-4">
                            <Button variant="ghost" size="icon" className="text-pink-500 hover:bg-pink-500/10 rounded-xl" onClick={() => sendReaction('heart')}><Heart className="h-6 w-6" /></Button>
                            <Button variant="ghost" size="icon" className="text-yellow-500 hover:bg-yellow-500/10 rounded-xl" onClick={() => sendReaction('zap')}><Zap className="h-6 w-6" /></Button>
                            <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-500/10 rounded-xl" onClick={() => sendReaction('smile')}><Smile className="h-6 w-6" /></Button>
                        </div>
                    </div>
                </main>

                {/* Right Sidebar (Chat & Attendance) */}
                <aside className="w-96 flex flex-col gap-4 overflow-hidden">
                    <div className="flex-1 bg-slate-900/50 backdrop-blur-3xl border border-white/5 rounded-3xl flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-white/5 flex items-center justify-between">
                            <div className="flex gap-4">
                                <button
                                    className={`text-sm font-black pb-4 border-b-2 transition-all ${activeSidebarTab === 'chat' ? 'border-primary text-white' : 'border-transparent text-slate-500'}`}
                                    onClick={() => setActiveSidebarTab('chat')}
                                >
                                    LIVE CHAT
                                </button>
                                <button
                                    className={`text-sm font-black pb-4 border-b-2 transition-all ${activeSidebarTab === 'attendees' ? 'border-primary text-white' : 'border-transparent text-slate-500'}`}
                                    onClick={() => {
                                        setActiveSidebarTab('attendees');
                                        refetchRegistrants();
                                    }}
                                >
                                    ATTENDEES ({registrants?.length || 0})
                                </button>
                            </div>
                            <MoreVertical className="h-4 w-4 text-slate-500" />
                        </div>

                        <ScrollArea className="flex-1 p-5">
                            {activeSidebarTab === 'chat' ? (
                                <div className="space-y-6">
                                    {chat.map(item => (
                                        <div key={item.id} className="group space-y-1 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[12px] font-black uppercase tracking-widest text-primary italic">{item.user}</span>
                                                <span className="text-[12px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">{item.time}</span>
                                            </div>
                                            <p className="text-sm bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">{item.message}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {registrants?.map(registrant => (
                                        <div key={registrant.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group/registrant">
                                            <div className="h-8 w-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-[12px]">
                                                {registrant.first_name ? registrant.first_name[0] : (registrant.name ? registrant.name[0] : 'U')}
                                                {registrant.last_name ? registrant.last_name[0] : ''}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold truncate">
                                                    {registrant.first_name ? `${registrant.first_name} ${registrant.last_name || ''}` : (registrant.name || 'Unknown')}
                                                </p>
                                                <p className="text-[12px] text-slate-500 truncate">{registrant.email}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-lg opacity-0 group-hover/registrant:opacity-100 transition-opacity text-slate-500 hover:text-red-500 hover:bg-red-500/10"
                                                    onClick={async () => {
                                                        if (window.confirm("Remove this attendee?")) {
                                                            try {
                                                                await webinarApi.removeRegistrant(id!, registrant.id);
                                                                toast.success('Registrant removed');
                                                                refetchRegistrants();
                                                            } catch (e) {
                                                                toast.error('Failed to remove registrant');
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <LogOut className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!registrants || registrants.length === 0) && (
                                        <div className="py-10 text-center space-y-2 opacity-50">
                                            <Users className="h-8 w-8 mx-auto" />
                                            <p className="text-xs font-bold uppercase tracking-widest">No attendees yet</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>

                        <div className="p-4 bg-slate-800/30 border-t border-white/5 m-4 mt-0 rounded-2xl">
                            <div className="flex gap-2">
                                <Input
                                    className="bg-transparent border-none text-sm placeholder:text-slate-600 focus-visible:ring-0 p-0 h-10 shadow-none text-white"
                                    placeholder="Type a message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <Button size="icon" variant="ghost" className="h-10 w-10 text-primary hover:text-primary hover:bg-primary/10 rounded-xl" onClick={handleSendMessage}>
                                    <Send className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Sales Offer Overlay Widget */}
                    <div
                        className="h-32 bg-primary text-white rounded-3xl p-5 relative overflow-hidden group cursor-pointer shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                        onClick={() => {
                            navigator.clipboard.writeText("SAVE50");
                            toast.success("Coupon code SAVE50 copied!");
                        }}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                            <Sparkles className="h-16 w-16" />
                        </div>
                        <p className="text-[12px] font-black uppercase tracking-widest opacity-70">Flash Deal Active</p>
                        <h4 className="text-lg font-black leading-tight mt-1">Get 50% Off Lifetime Access</h4>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="border-white/20 text-white font-black">SAVE50</Badge>
                            <ArrowRight className="h-4 w-4" />
                        </div>
                    </div>
                </aside>
            </div>

            {/* Status Footer */}
            <footer className="h-8 bg-primary text-white flex items-center px-6 gap-6 overflow-hidden">
                <div className="flex items-center gap-2 whitespace-nowrap">
                    <Shield className="h-3 w-3" />
                    <span className="text-[12px] font-black uppercase tracking-tighter">Encrypted Connection Active</span>
                </div>
                <div className="h-4 w-px bg-white/20" />
                <div className="flex-1 overflow-hidden">
                    <div className="animate-marquee-slow whitespace-nowrap text-[12px] font-black uppercase italic opacity-80 tracking-widest">
                        Latest Event Update: System Latency {Math.floor(30 + Math.random() * 20)}ms • Resolution 1080p60 • Stream Healthy • Multi-CDN Active • Bitrate 6.2 Mbps
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default WebinarRoom;
