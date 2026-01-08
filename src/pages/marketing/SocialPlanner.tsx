import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Calendar as CalendarIcon,
    LayoutGrid,
    List,
    Plus,
    Search,
    Filter,
    Facebook,
    Instagram,
    Linkedin,
    Twitter,
    Share2,
    CalendarDays,
    BarChart3,
    Image as ImageIcon,
    Video,
    MessageSquare,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Send,
    Eye,
    Zap,
    History,
    Archive,
    Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { socialMediaApi, SocialPost, SocialAccount, CalendarEvent } from '@/services/socialMediaApi';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const SocialPlanner = () => {
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('calendar');

    // Queries
    const { data: accounts, isLoading: accountsLoading } = useQuery({
        queryKey: ['socialAccounts'],
        queryFn: socialMediaApi.getAccounts
    });

    const { data: posts, isLoading: postsLoading } = useQuery({
        queryKey: ['socialPosts'],
        queryFn: async () => {
            const allPosts = await socialMediaApi.getPosts();
            return allPosts.filter(p => p.status !== 'archived' && p.status !== 'trashed');
        }
    });

    const { data: calendarEvents } = useQuery({
        queryKey: ['socialCalendar'],
        queryFn: socialMediaApi.getCalendar
    });

    const { data: analytics } = useQuery({
        queryKey: ['socialAnalytics'],
        queryFn: socialMediaApi.getAnalytics,
        enabled: activeTab === 'analytics'
    });

    // Mutations
    const createPostMutation = useMutation({
        mutationFn: socialMediaApi.createPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
            queryClient.invalidateQueries({ queryKey: ['socialCalendar'] });
            setIsCreateModalOpen(false);
            toast.success('Post scheduled successfully');
        }
    });

    const [postContent, setPostContent] = useState('');

    const aiRefineMutation = useMutation({
        mutationFn: async (content: string) => {
            const response = await fetch('/api/growth/social/ai-refine', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ content })
            });
            if (!response.ok) throw new Error('AI refinement failed');
            return response.json();
        },
        onSuccess: (data) => {
            setPostContent(data.refined_content);
            toast.success('Content refined by AI');
        },
        onError: () => {
            toast.error('Could not refine content. Please try again.');
        }
    });



    const updatePostStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number | string, status: 'archived' | 'trashed' }) =>
            socialMediaApi.updatePost(id, { status }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
            queryClient.invalidateQueries({ queryKey: ['socialCalendar'] });
            toast.success(`Post moved to ${variables.status === 'trashed' ? 'trash' : 'archive'}`);
        },
        onError: () => {
            toast.error('Failed to update post status');
        }
    });

    const handleAiRefine = () => {
        if (!postContent) {
            toast.error('Please enter some content first');
            return;
        }
        aiRefineMutation.mutate(postContent);
    };

    // Calendar state
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Mock platforms for now if accounts empty
    const platforms = [
        { id: 'fb', name: 'Facebook', icon: <Facebook className="h-4 w-4" />, color: 'bg-blue-600' },
        { id: 'ig', name: 'Instagram', icon: <Instagram className="h-4 w-4" />, color: 'bg-pink-600' },
        { id: 'li', name: 'LinkedIn', icon: <Linkedin className="h-4 w-4" />, color: 'bg-blue-700' },
        { id: 'tw', name: 'Twitter', icon: <Twitter className="h-4 w-4" />, color: 'bg-sky-500' }
    ];

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Social Posting Engine</h1>
                    <p className="text-muted-foreground">Schedule cross-platform content and track engagement analytics</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="hidden md:flex">
                        <Zap className="h-4 w-4 mr-2 text-yellow-500" /> AI Content Generator
                    </Button>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Create Post
                    </Button>
                </div>
            </div>

            {/* Platform Shortcuts */}
            <div className="flex flex-wrap gap-4">
                {platforms.map(p => (
                    <Card key={p.id} className="flex-1 min-w-[150px] cursor-pointer hover:border-primary transition-all">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`p-2 rounded-lg text-white ${p.color}`}>
                                {p.icon}
                            </div>
                            <div>
                                <p className="text-sm font-bold">{p.name}</p>
                                <p className="text-[12px] text-muted-foreground">Connect Account</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Tabs defaultValue="calendar" className="w-full" onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                    <TabsList className="bg-slate-100/80 p-1">
                        <TabsTrigger value="calendar" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <CalendarDays className="h-4 w-4 mr-2" /> Calendar
                        </TabsTrigger>
                        <TabsTrigger value="queue" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <History className="h-4 w-4 mr-2" /> Queue
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <BarChart3 className="h-4 w-4 mr-2" /> Analytics
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                        {activeTab === 'calendar' && (
                            <div className="flex items-center border rounded-lg bg-card shadow-sm p-1 gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-bold px-3 min-w-[120px] text-center">
                                    {format(currentDate, 'MMMM yyyy')}
                                </span>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setCurrentDate(new Date())}>
                                    Today
                                </Button>
                            </div>
                        )}
                        <Button variant="outline" size="sm" className="h-9"><Filter className="h-3.5 w-3.5 mr-2" /> Filter</Button>
                    </div>
                </div>

                <TabsContent value="calendar" className="mt-0">
                    <Card className="border-0 shadow-xl overflow-hidden rounded-2xl">
                        <CardContent className="p-0">
                            {/* Calendar Day Headers */}
                            <div className="grid grid-cols-7 border-b bg-slate-50/50">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                    <div key={d} className="py-3 text-center text-[12px] font-bold uppercase text-muted-foreground tracking-widest border-r last:border-r-0">
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 min-h-[700px]">
                                {days.map((day, idx) => {
                                    const dayEvents = calendarEvents?.filter(e => isSameDay(new Date(e.planned_date), day));
                                    const dayPosts = posts?.filter(p => p.status === 'scheduled' && p.published_at && isSameDay(new Date(p.published_at), day));

                                    return (
                                        <div
                                            key={day.toString()}
                                            className={`min-h-[140px] border-r border-b p-2 group hover:bg-slate-50/80 transition-colors ${idx % 7 === 6 ? 'border-r-0' : ''}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-sm font-bold h-7 w-7 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? 'bg-primary text-white ring-4 ring-primary/10' : 'text-slate-500'}`}>
                                                    {format(day, 'd')}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => setIsCreateModalOpen(true)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            <div className="space-y-1.5 h-[100px] overflow-y-auto scrollbar-hide">
                                                {dayEvents?.map(event => (
                                                    <div key={event.id} className="text-[12px] font-bold p-1.5 rounded-lg border bg-white shadow-sm flex items-center gap-1.5 border-l-4" style={{ borderLeftColor: event.color }}>
                                                        <Zap className="h-2.5 w-2.5 text-yellow-500" />
                                                        <span className="truncate">{event.title}</span>
                                                    </div>
                                                ))}
                                                {dayPosts?.map(post => (
                                                    <div key={post.id} className="text-[12px] font-bold p-1.5 rounded-lg border bg-blue-50 text-blue-700 shadow-sm flex items-center justify-between gap-1 group/post">
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <Share2 className="h-2.5 w-2.5" />
                                                            <span className="truncate">{post.content.substring(0, 20)}...</span>
                                                        </div>
                                                        <div className="flex gap-0.5">
                                                            <Facebook className="h-2 w-2 opacity-60" />
                                                            <Instagram className="h-2 w-2 opacity-60" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="queue">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming & Recent Posts</CardTitle>
                            <CardDescription>Monitor your pending multi-channel distribution queue</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {postsLoading ? (
                                    [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)
                                ) : posts?.length === 0 ? (
                                    <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed">
                                        <Share2 className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                                        <h3 className="text-lg font-bold">No posts in queue</h3>
                                        <p className="text-muted-foreground">Your scheduled contents will appear here.</p>
                                        <Button className="mt-6" onClick={() => setIsCreateModalOpen(true)}>Create Your First Post</Button>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {posts?.map(post => (
                                            <div key={post.id} className="flex items-center justify-between p-4 border rounded-2xl hover:bg-slate-50/50 transition-all group">
                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className="h-14 w-14 rounded-xl bg-slate-100 flex items-center justify-center border overflow-hidden">
                                                        {post.media_urls?.[0] ? (
                                                            <img src={post.media_urls[0]} alt="Post" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <ImageIcon className="h-6 w-6 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold line-clamp-1">{post.content}</p>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <Badge variant="outline" className="text-[12px] h-5 bg-white shadow-sm font-bold uppercase tracking-tighter">
                                                                {post.status}
                                                            </Badge>
                                                            <span className="text-[12px] text-muted-foreground flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {post.published_at ? format(new Date(post.published_at), 'MMM d, h:mm a') : 'Not scheduled'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="flex -space-x-2">
                                                        <div className="h-8 w-8 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-white scale-90">
                                                            <Facebook className="h-3.5 w-3.5" />
                                                        </div>
                                                        <div className="h-8 w-8 rounded-full border-2 border-white bg-pink-600 flex items-center justify-center text-white scale-90">
                                                            <Instagram className="h-3.5 w-3.5" />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" title="View"><Eye className="h-4 w-4" /></Button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" title="Options"><MoreHorizontal className="h-4 w-4" /></Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => updatePostStatusMutation.mutate({ id: post.id, status: 'archived' })}>
                                                                    <Archive className="h-4 w-4 mr-2" />
                                                                    Archive
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        if (confirm('Are you sure you want to move this post to trash?')) {
                                                                            updatePostStatusMutation.mutate({ id: post.id, status: 'trashed' });
                                                                        }
                                                                    }}
                                                                    className="text-red-600"
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Move to Trash
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="md:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-lg">Aggregate Reach</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="text-center p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg">
                                    <p className="text-xs opacity-80 font-bold uppercase">Total Impressions</p>
                                    <p className="text-2xl font-bold">24.8K</p>
                                    <div className="mt-2 text-[12px] bg-white/20 px-2 py-0.5 rounded-full inline-block">
                                        +12% vs last month
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <div className="flex items-center gap-2"><Facebook className="h-4 w-4 text-blue-600" /> Facebook</div>
                                        <span>45%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div className="bg-blue-600 h-full w-[45%]" />
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <div className="flex items-center gap-2"><Instagram className="h-4 w-4 text-pink-600" /> Instagram</div>
                                        <span>38%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div className="bg-pink-600 h-full w-[38%]" />
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <div className="flex items-center gap-2"><Linkedin className="h-4 w-4 text-blue-700" /> LinkedIn</div>
                                        <span>17%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div className="bg-blue-700 h-full w-[17%]" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-3">
                            <CardHeader>
                                <CardTitle>Performance Metrics</CardTitle>
                                <CardDescription>Engagement trends across all connected platforms</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[400px] flex items-center justify-center bg-slate-50/50 border-t rounded-b-xl border-dashed">
                                <div className="text-center">
                                    <BarChart3 className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                                    <p className="text-muted-foreground">Interactive performance charts will load here after sync</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Post Creation Dialog */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-2xl overflow-hidden p-0 rounded-2xl border-0 shadow-2xl">
                    <DialogHeader className="p-6 bg-slate-50 border-b">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Share2 className="h-5 w-5 text-primary" /> Create Cross-Platform Post
                        </DialogTitle>
                        <DialogDescription>Craft once, publish everywhere with channel-specific optimizations</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Content Area */}
                        <div className="p-6 space-y-6">
                            <div className="space-y-3">
                                <Label className="font-bold flex items-center justify-between">
                                    Post Content
                                    <span className="text-[12px] text-muted-foreground uppercase">280 Characters remaining</span>
                                </Label>
                                <Textarea
                                    className="h-40 bg-slate-50/50 resize-none font-medium border-slate-200"
                                    placeholder="What would you like to share?"
                                    value={postContent}
                                    onChange={(e) => setPostContent(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-[12px] border-slate-200 hover:bg-slate-100 shadow-sm font-bold"
                                        onClick={handleAiRefine}
                                        disabled={aiRefineMutation.isPending}
                                    >
                                        <Zap className={`h-3 w-3 mr-1 ${aiRefineMutation.isPending ? 'animate-spin' : 'text-yellow-500'}`} />
                                        {aiRefineMutation.isPending ? 'Refining...' : 'AI Refine'}
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 text-[12px] border-slate-200 hover:bg-slate-100 shadow-sm font-bold">
                                        # Hashtags
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="font-bold">Media</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 border-slate-200 transition-colors group">
                                        <Plus className="h-6 w-6 text-slate-300 group-hover:text-primary transition-colors" />
                                        <span className="text-[12px] mt-1 font-bold text-slate-400">Add Image</span>
                                    </div>
                                    <div className="aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 border-slate-200 transition-colors group">
                                        <Video className="h-6 w-6 text-slate-300 group-hover:text-primary transition-colors" />
                                        <span className="text-[12px] mt-1 font-bold text-slate-400">Add Video</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Settings Area */}
                        <div className="p-6 bg-slate-50 border-l space-y-6">
                            <div className="space-y-3">
                                <Label className="font-bold">Select Platforms</Label>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 rounded-xl border bg-white shadow-sm ring-1 ring-primary/20">
                                        <div className="flex items-center gap-3">
                                            <Facebook className="h-5 w-5 text-blue-600" />
                                            <span className="text-sm font-bold">Xordon FB Page</span>
                                        </div>
                                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center"><CheckCircle2 className="h-3 w-3 text-white" /></div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl border bg-white shadow-sm ring-1 ring-primary/20">
                                        <div className="flex items-center gap-3">
                                            <Instagram className="h-5 w-5 text-pink-600" />
                                            <span className="text-sm font-bold">xordon_official</span>
                                        </div>
                                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center"><CheckCircle2 className="h-3 w-3 text-white" /></div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="font-bold">Publishing Schedule</Label>
                                <div className="space-y-3">
                                    <div className="p-3 rounded-xl border bg-white shadow-sm flex items-center gap-3">
                                        <CalendarIcon className="h-4 w-4 text-slate-400" />
                                        <span className="text-sm font-medium">Tomorrow, 9:00 AM</span>
                                    </div>
                                    <p className="text-[12px] text-muted-foreground flex items-center gap-1.5 px-1 font-bold italic">
                                        <Zap className="h-3 w-3 text-yellow-500" /> Best time to post based on history
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-white border-t sm:justify-between items-center">
                        <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Save to Ideas</Button>
                        <div className="flex gap-2">
                            <Button variant="outline">Preview Post</Button>
                            <Button className="px-8 shadow-lg shadow-primary/20"><Send className="h-4 w-4 mr-2" /> Schedule Content</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SocialPlanner;
