import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SEO from '@/components/SEO';
import { ModuleGuard } from '@/components/ModuleGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Star,
    Search,
    MessageSquare,
    AlertCircle,
    RefreshCw,
    Trash2,
    Zap,
    ThumbsUp,
    ThumbsDown,
    Minus,
    Sparkles,
    Eye,
    Flag,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import reputationApi, { Review } from '@/services/reputationApi';
import { cn } from '@/lib/utils';

// Platform configuration for icons
const PLATFORM_CONFIG: Record<string, { color: string; icon: string }> = {
    google: { color: 'bg-blue-500', icon: 'G' },
    facebook: { color: 'bg-blue-600', icon: 'f' },
    yelp: { color: 'bg-red-500', icon: 'Y' },
    tripadvisor: { color: 'bg-green-500', icon: 'T' },
};

// Mock AI suggestions
const MOCK_AI_SUGGESTIONS = [
    { id: '1', content: 'Thank you so much for the wonderful review! We\'re thrilled to hear you had a great experience with our team. We look forward to serving you again!', tone: 'grateful' as const, confidence: 0.95 },
    { id: '2', content: 'We appreciate you taking the time to share your feedback. It\'s customers like you who make our work rewarding. Thank you!', tone: 'professional' as const, confidence: 0.88 },
];

export default function ReputationReviews() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(20);

    // Tabs for filtering
    const [activeTab, setActiveTab] = useState('all');

    // Original filters (kept for compatibility)
    const [platform, setPlatform] = useState('');
    const [rating, setRating] = useState('');
    const [sentiment, setSentiment] = useState('');
    const [search, setSearch] = useState('');

    // Reply dialog
    const [showReplyDialog, setShowReplyDialog] = useState(false);
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [generatingAi, setGeneratingAi] = useState(false);

    // Stats from API
    const [stats, setStats] = useState<any>(null);

    // Fetch reviews using react-query
    const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
        queryKey: ['reviews', page, platform, rating, sentiment, search, activeTab],
        queryFn: async () => {
            const params: any = { page, limit };
            if (platform) params.platform = platform;
            if (rating) params.rating = parseInt(rating);
            if (sentiment) params.sentiment = sentiment;
            if (search) params.search = search;
            return reputationApi.getReviews(params);
        },
    });

    // Fetch stats
    const { data: statsData } = useQuery({
        queryKey: ['review-stats'],
        queryFn: () => reputationApi.getStats('6m'),
    });

    // Update state when data changes
    useEffect(() => {
        if (reviewsData) {
            setReviews(reviewsData.reviews || []);
            setTotal(reviewsData.total || 0);
            setLoading(false);
        }
    }, [reviewsData]);

    useEffect(() => {
        if (statsData) {
            setStats(statsData);
        }
    }, [statsData]);

    // Mutations
    const publishMutation = useMutation({
        mutationFn: ({ id, content }: { id: number; content: string }) => 
            reputationApi.replyToReview(id, content),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
            setShowReplyDialog(false);
            setReplyText('');
            toast({
                title: 'Success',
                description: 'Reply posted successfully',
            });
        },
        onError: () => {
            toast({
                title: 'Error',
                description: 'Failed to post reply',
                variant: 'destructive',
            });
        },
    });

    const markReadMutation = useMutation({
        mutationFn: (id: number) => reputationApi.markAsRead(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews'] }),
    });

    const toggleFlagMutation = useMutation({
        mutationFn: (id: number) => reputationApi.toggleFlag(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews'] }),
    });

    const generateAiResponse = async () => {
        if (!selectedReview) return;
        try {
            setGeneratingAi(true);
            const response = await fetch('/api/ai/reviews/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({
                    review_id: selectedReview.id,
                    review_text: selectedReview.review_text
                })
            });
            const data = await response.json();
            if (data.generated_reply) {
                setReplyText(data.generated_reply);
                toast({
                    title: 'AI Response Generated',
                    description: 'The AI has drafted a professional response based on the review content.',
                });
            }
        } catch (error) {
            // Fallback to mock suggestions
            if (MOCK_AI_SUGGESTIONS.length > 0) {
                setReplyText(MOCK_AI_SUGGESTIONS[0].content);
                toast({
                    title: 'AI Response Generated',
                    description: 'Using template response.',
                });
            }
        } finally {
            setGeneratingAi(false);
        }
    };

    const handleReply = (review: Review) => {
        setSelectedReview(review);
        setReplyText(review.reply_text || '');
        setShowReplyDialog(true);
    };

    const submitReply = async () => {
        if (!selectedReview || !replyText.trim()) return;
        setSubmitting(true);
        publishMutation.mutate({ id: selectedReview.id, content: replyText });
        setSubmitting(false);
    };

    const handleMarkSpam = async (review: Review) => {
        try {
            await reputationApi.markAsSpam(review.id, !review.is_spam);
            toast({
                title: 'Success',
                description: review.is_spam ? 'Unmarked as spam' : 'Marked as spam',
            });
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update review',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (review: Review) => {
        if (!confirm('Are you sure you want to delete this review?')) return;

        try {
            await reputationApi.deleteReview(review.id);
            toast({
                title: 'Success',
                description: 'Review deleted successfully',
            });
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete review',
                variant: 'destructive',
            });
        }
    };

    // Helper functions
    const renderStars = (rating: number) => (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={cn('w-4 h-4', star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300')}
                />
            ))}
        </div>
    );

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'positive':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'negative':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        }
    };

    // Filter reviews based on active tab
    const filteredReviews = reviews.filter(r => {
        if (activeTab === 'unread') return !r.is_read;
        if (activeTab === 'flagged') return r.is_flagged;
        if (activeTab === 'needs_response') return !r.replied;
        if (activeTab === 'negative') return r.sentiment === 'negative';
        return true;
    });

    // Calculate stats
    const avgRating = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
    const unreadCount = reviews.filter(r => !r.is_read).length;
    const needsResponseCount = reviews.filter(r => !r.replied).length;

    if (loading && reviews.length === 0) {
        return (
            <ModuleGuard moduleKey="reputation">
                <SEO title="Reviews" description="View and manage reviews" />
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-muted-foreground">Loading reviews...</p>
                    </div>
                </div>
            </ModuleGuard>
        );
    }

    return (
        <ModuleGuard moduleKey="reputation">
            <SEO title="Reviews" description="View and manage reviews" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Reviews</h1>
                        <p className="text-muted-foreground">View and respond to customer reviews</p>
                    </div>
                    <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['reviews'] })}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Reviews
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Average Rating</CardDescription>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                {avgRating.toFixed(1)}
                                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Reviews</CardDescription>
                            <CardTitle className="text-2xl">{total}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Unread</CardDescription>
                            <CardTitle className="text-2xl text-blue-600">{unreadCount}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Needs Response</CardDescription>
                            <CardTitle className="text-2xl text-orange-600">{needsResponseCount}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Filters Card */}
                <Card>
                    <CardContent className="p-6">
                        <div className="grid gap-4 md:grid-cols-5">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search reviews..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            <Select value={platform} onValueChange={setPlatform}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Platforms" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Platforms</SelectItem>
                                    <SelectItem value="Google">Google</SelectItem>
                                    <SelectItem value="Facebook">Facebook</SelectItem>
                                    <SelectItem value="Yelp">Yelp</SelectItem>
                                    <SelectItem value="TripAdvisor">TripAdvisor</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={rating} onValueChange={setRating}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Ratings" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Ratings</SelectItem>
                                    <SelectItem value="5">5 Stars</SelectItem>
                                    <SelectItem value="4">4 Stars</SelectItem>
                                    <SelectItem value="3">3 Stars</SelectItem>
                                    <SelectItem value="2">2 Stars</SelectItem>
                                    <SelectItem value="1">1 Star</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sentiment} onValueChange={setSentiment}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Sentiments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Sentiments</SelectItem>
                                    <SelectItem value="positive">Positive</SelectItem>
                                    <SelectItem value="neutral">Neutral</SelectItem>
                                    <SelectItem value="negative">Negative</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                onClick={() => {
                                    setPlatform('');
                                    setRating('');
                                    setSentiment('');
                                    setSearch('');
                                }}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="unread">
                            Unread {unreadCount > 0 && <Badge variant="secondary" className="ml-1">{unreadCount}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="needs_response">Needs Response</TabsTrigger>
                        <TabsTrigger value="negative">Negative</TabsTrigger>
                        <TabsTrigger value="flagged">Flagged</TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="space-y-4 mt-4">
                        {/* Reviews List */}
                        <div className="space-y-4">
                            {filteredReviews.length === 0 ? (
                                <Card>
                                    <CardContent className="p-12 text-center">
                                        <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                        <h3 className="text-xl font-semibold mb-2">No reviews found</h3>
                                        <p className="text-muted-foreground">
                                            {search || platform || rating || sentiment
                                                ? 'Try adjusting your filters'
                                                : 'Start collecting reviews from your customers'}
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                filteredReviews.map((review) => (
                                    <Card key={review.id} className={cn(!review.is_read && 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20', review.is_spam && 'opacity-60')}>
                                        <CardContent className="p-6">
                                            <div className="flex gap-4">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarFallback className={PLATFORM_CONFIG[review.platform?.toLowerCase()]?.color + ' text-white'}>
                                                        {PLATFORM_CONFIG[review.platform?.toLowerCase()]?.icon || review.platform?.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-semibold">{review.author_name}</span>
                                                                {renderStars(review.rating)}
                                                                <Badge variant="outline">{review.platform}</Badge>
                                                                <Badge className={getSentimentColor(review.sentiment || 'neutral')}>
                                                                    {review.sentiment || 'neutral'}
                                                                </Badge>
                                                                {review.is_spam && <Badge variant="destructive">Spam</Badge>}
                                                                {review.is_flagged && <Badge variant="outline" className="text-red-500"><Flag className="w-3 h-3" /></Badge>}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                {review.platform} • {new Date(review.review_date).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button variant="ghost" size="icon" onClick={() => markReadMutation.mutate(review.id)} title="Mark Read">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => toggleFlagMutation.mutate(review.id)} title="Flag">
                                                                <Flag className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    
                                                    {review.review_text && (
                                                        <p className="text-sm mt-3">{review.review_text}</p>
                                                    )}

                                                    {review.replied && review.reply_text && (
                                                        <div className="mt-4 p-4 bg-muted rounded-lg">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <MessageSquare className="h-4 w-4" />
                                                                <span className="text-sm font-medium">Your Reply</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {review.reply_date && new Date(review.reply_date).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm">{review.reply_text}</p>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 mt-4">
                                                        <Button
                                                            size="sm"
                                                            variant={review.replied ? 'outline' : 'default'}
                                                            onClick={() => handleReply(review)}
                                                        >
                                                            <MessageSquare className="h-4 w-4 mr-2" />
                                                            {review.replied ? 'Edit Reply' : 'Reply'}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleMarkSpam(review)}
                                                        >
                                                            <AlertCircle className="h-4 w-4 mr-2" />
                                                            {review.is_spam ? 'Not Spam' : 'Mark as Spam'}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(review)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Pagination */}
                {total > limit && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} reviews
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page * limit >= total}
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Reply Dialog */}
            <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Reply to Review</DialogTitle>
                        <DialogDescription>
                            Write a response to {selectedReview?.author_name}'s review
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {selectedReview && (
                            <div className="p-4 bg-muted rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    {renderStars(selectedReview.rating)}
                                </div>
                                <p className="text-sm">{selectedReview.review_text}</p>
                            </div>
                        )}

                        {/* AI Suggestions */}
                        <div>
                            <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />AI Suggestions
                            </p>
                            <ScrollArea className="h-32">
                                <div className="space-y-2">
                                    {MOCK_AI_SUGGESTIONS.map((s) => (
                                        <div
                                            key={s.id}
                                            className="p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                                            onClick={() => setReplyText(s.content)}
                                        >
                                            <p className="text-sm">{s.content}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="outline" className="text-xs">{s.tone}</Badge>
                                                <span className="text-xs text-muted-foreground">{Math.round(s.confidence * 100)}% match</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        <Textarea
                            placeholder="Write your reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={5}
                        />
                    </div>

                    <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
                        <Button
                            variant="outline"
                            className="mr-auto gap-2 text-primary border-primary/20 hover:bg-primary/5"
                            onClick={generateAiResponse}
                            disabled={generatingAi}
                        >
                            <Zap className={`h-4 w-4 ${generatingAi ? 'animate-spin' : ''}`} />
                            {generatingAi ? 'Thinking...' : 'Generate AI Response'}
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowReplyDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={submitReply} disabled={submitting || !replyText.trim()}>
                                {submitting ? 'Posting...' : 'Post Reply'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ModuleGuard>
    );
}
