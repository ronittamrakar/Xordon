/**
 * Google Business Profile Management Component
 * Comprehensive GMB/GBP management UI
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { gmbApi, GMBLocation, GMBPost, GMBReview, GMBQuestion, GMBSettings } from '@/services';
import {
    Plus, Globe, MapPin, Loader2, ExternalLink, RefreshCw, CheckCircle, AlertCircle,
    Clock, Star, Search, Edit, Trash2, Phone, Settings, Image, MessageSquare,
    HelpCircle, BarChart3, Link2, Calendar, Upload, Eye, ThumbsUp, Reply,
    Building2, Wifi, WifiOff, ShieldCheck, AlertTriangle, Send
} from 'lucide-react';

interface GMBManagementProps {
    activeCompanyId: number | null;
}

export function GMBManagement({ activeCompanyId }: GMBManagementProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
    const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
    const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
    const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState<GMBReview | null>(null);
    const [replyText, setReplyText] = useState('');
    const [newPost, setNewPost] = useState({
        post_type: 'standard' as const,
        summary: '',
        action_type: '',
        action_url: '',
    });

    // Queries
    const { data: connection, isLoading: connectionLoading } = useQuery({
        queryKey: ['gmb-connection', activeCompanyId],
        queryFn: () => gmbApi.getConnection(),
        enabled: !!activeCompanyId,
    });

    const { data: locations, isLoading: locationsLoading } = useQuery({
        queryKey: ['gmb-locations', activeCompanyId],
        queryFn: () => gmbApi.getLocations(),
        enabled: !!activeCompanyId && connection?.status === 'connected',
    });

    const { data: dashboardStats } = useQuery({
        queryKey: ['gmb-dashboard', activeCompanyId],
        queryFn: () => gmbApi.getDashboardStats(),
        enabled: !!activeCompanyId && connection?.status === 'connected',
    });

    const { data: posts } = useQuery({
        queryKey: ['gmb-posts', activeCompanyId, selectedLocation],
        queryFn: () => gmbApi.getPosts(selectedLocation || undefined),
        enabled: !!activeCompanyId && connection?.status === 'connected',
    });

    const { data: reviews } = useQuery({
        queryKey: ['gmb-reviews', activeCompanyId, selectedLocation],
        queryFn: () => gmbApi.getReviews(selectedLocation || undefined),
        enabled: !!activeCompanyId && connection?.status === 'connected',
    });

    const { data: questions } = useQuery({
        queryKey: ['gmb-questions', activeCompanyId, selectedLocation],
        queryFn: () => gmbApi.getQuestions(selectedLocation || undefined),
        enabled: !!activeCompanyId && connection?.status === 'connected',
    });

    const { data: settings } = useQuery({
        queryKey: ['gmb-settings', activeCompanyId],
        queryFn: () => gmbApi.getSettings(),
        enabled: !!activeCompanyId && connection?.status === 'connected',
    });

    // Mutations
    const connectMutation = useMutation({
        mutationFn: async () => {
            // Get OAuth URL from backend
            const { url } = await gmbApi.getOAuthUrl();

            // Open OAuth URL in a new window
            const width = 600;
            const height = 700;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;

            const authWindow = window.open(
                url,
                'Google Authorization',
                `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
            );

            if (!authWindow) {
                throw new Error('Popup blocked. Please allow popups for this site.');
            }

            // Listen for OAuth callback via postMessage
            return new Promise((resolve, reject) => {
                const messageHandler = (event: MessageEvent) => {
                    if (event.data?.type === 'gmb-oauth-success') {
                        window.removeEventListener('message', messageHandler);
                        clearInterval(checkWindow);
                        queryClient.invalidateQueries({ queryKey: ['gmb-connection'] });
                        queryClient.invalidateQueries({ queryKey: ['gmb-dashboard'] });
                        resolve({ success: true });
                    } else if (event.data?.type === 'gmb-oauth-error') {
                        window.removeEventListener('message', messageHandler);
                        clearInterval(checkWindow);
                        reject(new Error(event.data.error || 'Authorization failed'));
                    }
                };

                window.addEventListener('message', messageHandler);

                const checkWindow = setInterval(() => {
                    if (authWindow?.closed) {
                        clearInterval(checkWindow);
                        window.removeEventListener('message', messageHandler);
                        queryClient.invalidateQueries({ queryKey: ['gmb-connection'] });
                        queryClient.invalidateQueries({ queryKey: ['gmb-dashboard'] });
                        resolve({ success: true });
                    }
                }, 500);

                setTimeout(() => {
                    clearInterval(checkWindow);
                    window.removeEventListener('message', messageHandler);
                    if (authWindow && !authWindow.closed) {
                        authWindow.close();
                    }
                    reject(new Error('Authorization timeout'));
                }, 300000);
            });
        },
        onSuccess: () => {
            toast({ title: 'Successfully connected to Google Business Profile!' });
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to connect account',
                description: error?.message || 'Please try again',
                variant: 'destructive'
            });
        },
    });

    const disconnectMutation = useMutation({
        mutationFn: () => gmbApi.disconnectAccount(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gmb-connection'] });
            toast({ title: 'Account disconnected' });
        },
    });

    const syncLocationsMutation = useMutation({
        mutationFn: () => gmbApi.syncLocations(),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['gmb-locations'] });
            toast({ title: 'Locations synced', description: `Found ${data.count} locations` });
        },
    });

    const createPostMutation = useMutation({
        mutationFn: (data: typeof newPost & { location_id: number }) => gmbApi.createPost(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gmb-posts'] });
            setIsPostDialogOpen(false);
            setNewPost({ post_type: 'standard', summary: '', action_type: '', action_url: '' });
            toast({ title: 'Post created successfully' });
        },
    });

    const replyToReviewMutation = useMutation({
        mutationFn: ({ id, reply }: { id: number; reply: string }) => gmbApi.replyToReview(id, reply),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gmb-reviews'] });
            setIsReplyDialogOpen(false);
            setSelectedReview(null);
            setReplyText('');
            toast({ title: 'Reply posted successfully' });
        },
    });

    const updateSettingsMutation = useMutation({
        mutationFn: (data: Partial<GMBSettings>) => gmbApi.updateSettings(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gmb-settings'] });
            toast({ title: 'Settings updated' });
        },
    });

    const syncReviewsMutation = useMutation({
        mutationFn: () => gmbApi.syncReviews(selectedLocation || undefined),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['gmb-reviews'] });
            toast({ title: 'Reviews synced', description: `Found ${data.count} reviews` });
        },
    });

    const syncPostsMutation = useMutation({
        mutationFn: () => gmbApi.syncPosts(selectedLocation || undefined),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['gmb-posts'] });
            toast({ title: 'Posts synced', description: `Found ${data.count} posts` });
        },
    });

    const isConnected = connection?.status === 'connected';

    // Not connected state
    if (!isConnected && !connectionLoading) {
        return (
            <div className="space-y-6">
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center mb-6">
                            <Building2 className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Connect Google Business Profile</h3>
                        <p className="text-muted-foreground text-center max-w-md mb-6">
                            Connect your Google Business Profile to manage your listings, respond to reviews,
                            create posts, and track insights all from one place.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                size="lg"
                                onClick={() => connectMutation.mutate()}
                                disabled={connectMutation.isPending}
                            >
                                {connectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4 mr-2" />
                                Connect with Google
                            </Button>
                        </div>
                        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            {[
                                { icon: Building2, label: 'Manage Locations' },
                                { icon: Star, label: 'Review Management' },
                                { icon: MessageSquare, label: 'Create Posts' },
                                { icon: BarChart3, label: 'View Insights' },
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
                                    <item.icon className="h-5 w-5 text-muted-foreground" />
                                    <span className="text-xs font-medium">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Connection Status Bar */}
            <Card className="bg-gradient-to-r from-blue-500/10 to-green-500/10 border-blue-200">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-white shadow flex items-center justify-center">
                                <img src="https://www.google.com/favicon.ico" alt="" className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-medium flex items-center gap-2">
                                    {connection?.google_email}
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        <Wifi className="h-3 w-3 mr-1" /> Connected
                                    </Badge>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Last synced: {connection?.last_sync_at ? new Date(connection.last_sync_at).toLocaleString() : 'Never'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => syncLocationsMutation.mutate()} disabled={syncLocationsMutation.isPending}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${syncLocationsMutation.isPending ? 'animate-spin' : ''}`} />
                                Sync
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setIsConnectDialogOpen(true)}>
                                <Settings className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Overview */}
            {dashboardStats && (
                <div className="grid gap-4 md:grid-cols-5">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Locations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{dashboardStats.locations_count}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{dashboardStats.total_reviews}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <p className="text-2xl font-bold">{dashboardStats.average_rating != null ? Number(dashboardStats.average_rating).toFixed(1) : 'N/A'}</p>
                                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-orange-600">{dashboardStats.pending_reviews}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Unanswered Q&A</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-blue-600">{dashboardStats.unanswered_questions}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-muted/60 p-1">
                    <TabsTrigger value="overview"><Building2 className="h-4 w-4 mr-2" />Locations</TabsTrigger>
                    <TabsTrigger value="posts"><MessageSquare className="h-4 w-4 mr-2" />Posts</TabsTrigger>
                    <TabsTrigger value="reviews"><Star className="h-4 w-4 mr-2" />Reviews</TabsTrigger>
                    <TabsTrigger value="qa"><HelpCircle className="h-4 w-4 mr-2" />Q&A</TabsTrigger>
                    <TabsTrigger value="photos"><Image className="h-4 w-4 mr-2" />Photos</TabsTrigger>
                    <TabsTrigger value="insights"><BarChart3 className="h-4 w-4 mr-2" />Insights</TabsTrigger>
                    <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-2" />Settings</TabsTrigger>
                </TabsList>

                {/* Locations Tab */}
                <TabsContent value="overview" className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Your Business Locations</h3>
                        <Button variant="outline" size="sm" onClick={() => syncLocationsMutation.mutate()}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Refresh Locations
                        </Button>
                    </div>

                    {locationsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : locations?.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-12 text-center">
                                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h4 className="font-medium mb-2">No locations found</h4>
                                <p className="text-sm text-muted-foreground">
                                    Click "Refresh Locations" to sync your Google Business Profile locations.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {locations?.map((location) => (
                                <Card key={location.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-base">{location.business_name}</CardTitle>
                                                <CardDescription className="flex items-center gap-1 mt-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {[location.address_line_1, location.city, location.state].filter(Boolean).join(', ')}
                                                </CardDescription>
                                            </div>
                                            <Badge variant={location.verification_status === 'verified' ? 'default' : 'secondary'}>
                                                {location.verification_status === 'verified' && <ShieldCheck className="h-3 w-3 mr-1" />}
                                                {location.verification_status}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-3 gap-4 text-center mb-4">
                                            <div>
                                                <p className="text-lg font-bold">{location.total_reviews}</p>
                                                <p className="text-xs text-muted-foreground">Reviews</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold flex items-center justify-center gap-1">
                                                    {location.average_rating != null ? Number(location.average_rating).toFixed(1) : 'N/A'}
                                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                </p>
                                                <p className="text-xs text-muted-foreground">Rating</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold">{location.total_photos}</p>
                                                <p className="text-xs text-muted-foreground">Photos</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedLocation(location.id)}>
                                                <Edit className="h-3 w-3 mr-1" /> Manage
                                            </Button>
                                            {location.maps_url && (
                                                <Button variant="ghost" size="sm" asChild>
                                                    <a href={location.maps_url} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Posts Tab */}
                <TabsContent value="posts" className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Google Posts</h3>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => syncPostsMutation.mutate()} disabled={syncPostsMutation.isPending}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${syncPostsMutation.isPending ? 'animate-spin' : ''}`} />
                                Sync Posts
                            </Button>
                            <Button onClick={() => setIsPostDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" /> Create Post
                            </Button>
                        </div>
                    </div>

                    {posts?.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-12 text-center">
                                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h4 className="font-medium mb-2">No posts yet</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Create posts to engage with your customers and promote your business.
                                </p>
                                <Button onClick={() => setIsPostDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" /> Create Your First Post
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {posts?.map((post) => (
                                <Card key={post.id}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant="outline">{post.post_type}</Badge>
                                                    <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>{post.status}</Badge>
                                                </div>
                                                <p className="text-sm">{post.summary}</p>
                                                {post.media_url && (
                                                    <img src={post.media_url} alt="" className="mt-3 rounded-lg max-w-xs" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {post.views}</span>
                                                <span className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" /> {post.clicks}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Reviews Tab */}
                <TabsContent value="reviews" className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Customer Reviews</h3>
                        <Button variant="outline" size="sm" onClick={() => syncReviewsMutation.mutate()} disabled={syncReviewsMutation.isPending}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${syncReviewsMutation.isPending ? 'animate-spin' : ''}`} /> Sync Reviews
                        </Button>
                    </div>

                    {reviews?.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-12 text-center">
                                <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h4 className="font-medium mb-2">No reviews yet</h4>
                                <p className="text-sm text-muted-foreground">
                                    Reviews from your Google Business Profile will appear here.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {reviews?.map((review) => (
                                <Card key={review.id}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                                {review.reviewer_profile_photo_url ? (
                                                    <img src={review.reviewer_profile_photo_url} alt="" className="rounded-full" />
                                                ) : (
                                                    <span className="text-lg font-bold">{review.reviewer_display_name?.[0] || '?'}</span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">{review.reviewer_display_name || 'Anonymous'}</p>
                                                        <div className="flex items-center gap-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className={`h-4 w-4 ${i < review.star_rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                                                            ))}
                                                            <span className="text-xs text-muted-foreground ml-2">
                                                                {new Date(review.review_date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Badge variant={review.status === 'responded' ? 'default' : 'secondary'}>{review.status}</Badge>
                                                </div>
                                                {review.comment && <p className="mt-2 text-sm">{review.comment}</p>}
                                                {review.reply_text && (
                                                    <div className="mt-3 pl-4 border-l-2 border-primary/20">
                                                        <p className="text-xs font-medium text-primary">Your Reply:</p>
                                                        <p className="text-sm text-muted-foreground">{review.reply_text}</p>
                                                    </div>
                                                )}
                                                {!review.reply_text && (
                                                    <Button variant="outline" size="sm" className="mt-3" onClick={() => { setSelectedReview(review); setIsReplyDialogOpen(true); }}>
                                                        <Reply className="h-3 w-3 mr-1" /> Reply
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Q&A Tab */}
                <TabsContent value="qa" className="space-y-4 mt-6">
                    <h3 className="text-lg font-semibold">Questions & Answers</h3>
                    {questions?.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-12 text-center">
                                <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h4 className="font-medium mb-2">No questions yet</h4>
                                <p className="text-sm text-muted-foreground">
                                    Customer questions about your business will appear here.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {questions?.map((q) => (
                                <Card key={q.id}>
                                    <CardContent className="pt-6">
                                        <p className="font-medium">{q.question_text}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Asked by {q.author_display_name} • {new Date(q.question_date).toLocaleDateString()}
                                        </p>
                                        <Badge variant={q.status === 'answered' ? 'default' : 'secondary'} className="mt-2">{q.status}</Badge>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Photos Tab */}
                <TabsContent value="photos" className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Business Photos</h3>
                        <Button><Upload className="h-4 w-4 mr-2" /> Upload Photo</Button>
                    </div>
                    <Card className="border-dashed">
                        <CardContent className="py-12 text-center">
                            <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h4 className="font-medium mb-2">Manage your business photos</h4>
                            <p className="text-sm text-muted-foreground">
                                Upload and organize photos to showcase your business.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Insights Tab */}
                <TabsContent value="insights" className="space-y-4 mt-6">
                    <h3 className="text-lg font-semibold">Performance Insights</h3>
                    <Card className="border-dashed">
                        <CardContent className="py-12 text-center">
                            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h4 className="font-medium mb-2">View your business performance</h4>
                            <p className="text-sm text-muted-foreground">
                                Analytics and insights from your Google Business Profile will appear here.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4 mt-6">
                    <h3 className="text-lg font-semibold">GMB Settings</h3>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Sync Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Auto-sync enabled</Label>
                                    <p className="text-sm text-muted-foreground">Automatically sync data from Google</p>
                                </div>
                                <Switch checked={settings?.auto_sync_enabled ?? true} onCheckedChange={(v) => updateSettingsMutation.mutate({ auto_sync_enabled: v })} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Review notifications</Label>
                                    <p className="text-sm text-muted-foreground">Get notified about new reviews</p>
                                </div>
                                <Switch checked={settings?.notify_new_reviews ?? true} onCheckedChange={(v) => updateSettingsMutation.mutate({ notify_new_reviews: v })} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>AI suggested responses</Label>
                                    <p className="text-sm text-muted-foreground">Get AI-powered reply suggestions</p>
                                </div>
                                <Switch checked={settings?.ai_suggested_responses ?? true} onCheckedChange={(v) => updateSettingsMutation.mutate({ ai_suggested_responses: v })} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-red-200 bg-red-50/50">
                        <CardHeader>
                            <CardTitle className="text-base text-red-700">Danger Zone</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button variant="destructive" onClick={() => disconnectMutation.mutate()}>
                                <WifiOff className="h-4 w-4 mr-2" /> Disconnect Account
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create Post Dialog */}
            <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Google Post</DialogTitle>
                        <DialogDescription>Create a new post for your Google Business Profile</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Post Type</Label>
                            <Select value={newPost.post_type} onValueChange={(v: any) => setNewPost({ ...newPost, post_type: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="standard">Update</SelectItem>
                                    <SelectItem value="event">Event</SelectItem>
                                    <SelectItem value="offer">Offer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Content</Label>
                            <Textarea value={newPost.summary} onChange={(e) => setNewPost({ ...newPost, summary: e.target.value })} placeholder="What's new with your business?" rows={4} />
                        </div>
                        <div className="space-y-2">
                            <Label>Call to Action (Optional)</Label>
                            <Select value={newPost.action_type} onValueChange={(v) => setNewPost({ ...newPost, action_type: v })}>
                                <SelectTrigger><SelectValue placeholder="Select action" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    <SelectItem value="learn_more">Learn More</SelectItem>
                                    <SelectItem value="book">Book</SelectItem>
                                    <SelectItem value="order">Order</SelectItem>
                                    <SelectItem value="call">Call</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {newPost.action_type && (
                            <div className="space-y-2">
                                <Label>Action URL</Label>
                                <Input value={newPost.action_url} onChange={(e) => setNewPost({ ...newPost, action_url: e.target.value })} placeholder="https://..." />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPostDialogOpen(false)}>Cancel</Button>
                        <Button onClick={() => selectedLocation && createPostMutation.mutate({ ...newPost, location_id: selectedLocation })} disabled={!newPost.summary || createPostMutation.isPending}>
                            {createPostMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            <Send className="h-4 w-4 mr-2" /> Publish
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reply to Review Dialog */}
            <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reply to Review</DialogTitle>
                        <DialogDescription>Respond to {selectedReview?.reviewer_display_name}'s review</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {selectedReview && (
                            <div className="bg-muted p-3 rounded-lg mb-4">
                                <div className="flex items-center gap-1 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`h-4 w-4 ${i < selectedReview.star_rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                                    ))}
                                </div>
                                <p className="text-sm">{selectedReview.comment}</p>
                            </div>
                        )}
                        <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write your reply..." rows={4} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>Cancel</Button>
                        <Button onClick={() => selectedReview && replyToReviewMutation.mutate({ id: selectedReview.id, reply: replyText })} disabled={!replyText || replyToReviewMutation.isPending}>
                            {replyToReviewMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Post Reply
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default GMBManagement;
