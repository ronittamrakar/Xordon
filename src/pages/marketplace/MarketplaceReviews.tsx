import { useState, useEffect } from 'react';
import { MarketplaceNav } from '@/components/marketplace/MarketplaceNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Send, Flag, Check, X, Eye } from 'lucide-react';
import {
  getMyReviews,
  respondToReview,
  adminGetReviews,
  adminUpdateReview,
  MarketplaceReview
} from '@/services/leadMarketplaceApi';

// Star Rating Component
const StarRating = ({ rating, size = 'md', interactive = false, onChange }: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizes[size]} ${star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer' : ''}`}
          onClick={() => interactive && onChange?.(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
        />
      ))}
    </div>
  );
};

// Review Card Component
const ReviewCard = ({
  review,
  isProvider = false,
  isAdmin = false,
  onRespond,
  onModerate
}: {
  review: MarketplaceReview;
  isProvider?: boolean;
  isAdmin?: boolean;
  onRespond?: (id: number, response: string) => void;
  onModerate?: (id: number, status: string) => void;
}) => {
  const [showResponseInput, setShowResponseInput] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) return;
    setSubmitting(true);
    try {
      await onRespond?.(review.id, responseText);
      setShowResponseInput(false);
      setResponseText('');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    flagged: 'bg-orange-100 text-orange-800'
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-sm text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
              {review.is_verified && (
                <Badge variant="outline" className="text-xs">
                  <Check className="w-3 h-3 mr-1" /> Verified
                </Badge>
              )}
              {isAdmin && (
                <Badge className={statusColors[review.status]}>{review.status}</Badge>
              )}
            </div>
            <p className="font-medium">{review.reviewer_name || 'Anonymous'}</p>
            {review.lead_title && (
              <p className="text-sm text-muted-foreground">Lead: {review.lead_title}</p>
            )}
          </div>
          {review.is_featured && (
            <Badge variant="secondary">Featured</Badge>
          )}
        </div>

        {review.title && (
          <h4 className="font-semibold mb-2">{review.title}</h4>
        )}

        {review.comment && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{review.comment}</p>
        )}

        {(review.pros || review.cons) && (
          <div className="grid grid-cols-2 gap-4 mb-3">
            {review.pros && (
              <div className="flex items-start gap-2">
                <ThumbsUp className="w-4 h-4 text-green-500 mt-0.5" />
                <p className="text-sm">{review.pros}</p>
              </div>
            )}
            {review.cons && (
              <div className="flex items-start gap-2">
                <ThumbsDown className="w-4 h-4 text-red-500 mt-0.5" />
                <p className="text-sm">{review.cons}</p>
              </div>
            )}
          </div>
        )}

        {/* Provider Response */}
        {review.response && (
          <div className="mt-4 pl-4 border-l-2 border-blue-200 bg-blue-50 dark:bg-blue-950 p-3 rounded-r">
            <p className="text-sm font-medium mb-1">Provider Response</p>
            <p className="text-sm">{review.response}</p>
            {review.response_at && (
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(review.response_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Response Input */}
        {isProvider && !review.response && (
          <div className="mt-3">
            {showResponseInput ? (
              <div className="space-y-2">
                <Textarea
                  placeholder="Write your response..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSubmitResponse} disabled={submitting}>
                    <Send className="w-4 h-4 mr-1" /> Submit Response
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowResponseInput(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setShowResponseInput(true)}>
                <MessageSquare className="w-4 h-4 mr-1" /> Respond
              </Button>
            )}
          </div>
        )}

        {/* Admin Actions */}
        {isAdmin && review.status === 'pending' && (
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="default" onClick={() => onModerate?.(review.id, 'approved')}>
              <Check className="w-4 h-4 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onModerate?.(review.id, 'rejected')}>
              <X className="w-4 h-4 mr-1" /> Reject
            </Button>
            <Button size="sm" variant="outline" onClick={() => onModerate?.(review.id, 'flagged')}>
              <Flag className="w-4 h-4 mr-1" /> Flag
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Provider Reviews Page
export function ProviderReviews() {
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      const res = await getMyReviews({ status: filter !== 'all' ? filter : undefined });
      if (res.data.success) {
        setReviews(res.data.data);
        setStats(res.data.stats);
      }
    } catch (error) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (id: number, response: string) => {
    try {
      await respondToReview(id, response);
      toast.success('Response submitted');
      fetchReviews();
    } catch (error) {
      toast.error('Failed to submit response');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MarketplaceNav />
      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>My Reviews</CardTitle>
          <CardDescription>Manage reviews from your customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stats?.avg_rating ? Number(stats.avg_rating).toFixed(1) : 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">Avg Rating</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.responded || 0}</p>
              <p className="text-sm text-muted-foreground">Responded</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex gap-4 items-center">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reviews</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Star className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No reviews yet</p>
            <p className="text-sm">Reviews will appear here when customers rate your service</p>
          </CardContent>
        </Card>
      ) : (
        reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            isProvider={true}
            onRespond={handleRespond}
          />
        ))
      )}
    </div>
  );
}

// Admin Reviews Moderation Page
export function AdminReviewsModeration() {
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchReviews();
  }, [activeTab]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await adminGetReviews({ status: activeTab !== 'all' ? activeTab : undefined });
      if (res.data.success) {
        setReviews(res.data.data);
        setCounts(res.data.counts);
      }
    } catch (error) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (id: number, status: string) => {
    try {
      await adminUpdateReview(id, { status });
      toast.success(`Review ${status}`);
      fetchReviews();
    } catch (error) {
      toast.error('Failed to update review');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Moderation</CardTitle>
          <CardDescription>Approve or reject customer reviews</CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending {counts.pending ? `(${counts.pending})` : ''}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved {counts.approved ? `(${counts.approved})` : ''}
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected {counts.rejected ? `(${counts.rejected})` : ''}
          </TabsTrigger>
          <TabsTrigger value="flagged">
            Flagged {counts.flagged ? `(${counts.flagged})` : ''}
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No {activeTab} reviews</p>
              </CardContent>
            </Card>
          ) : (
            reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                isAdmin={true}
                onModerate={handleModerate}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProviderReviews;
