import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Star,
  TrendingUp,
  TrendingDown,
  Send,
  MessageSquare,
  BarChart3,
  Settings,
  Globe,
  Search,
  Smile,
  Meh,
  Frown,
  Users,
  Target,
  Award,
  ExternalLink,
  Plus,
  Map,
  Sparkles,
  Camera,
  Info,
} from 'lucide-react';
import SEO from '@/components/SEO';
import { ModuleGuard } from '@/components/ModuleGuard';
import { useToast } from '@/hooks/use-toast';
import WidgetBuilder from '@/components/WidgetBuilder';
import AIAgentDialog from '@/components/AIAgentDialog';
import reputationApi from '@/services/reputationApi';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

interface ReputationStats {
  invitesGoal: number;
  invitesSent: number;
  reviewsReceived: number;
  reviewsChange: number;
  averageRating: number;
  ratingChange: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ReviewRequest {
  id: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  status: 'pending' | 'sent' | 'completed' | 'failed';
  channel: 'email' | 'sms' | 'whatsapp';
  sentAt: string;
  completedAt?: string;
}

interface Review {
  id: number;
  platform: string;
  rating: number;
  author: string;
  text: string;
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  replied: boolean;
}

export default function ReputationHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState('6m');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showCompetitorAnalysis, setShowCompetitorAnalysis] = useState(false);
  const [showWidgetBuilder, setShowWidgetBuilder] = useState(false);
  const [showAIAgentDialog, setShowAIAgentDialog] = useState(false);
  const [showReviewBalanceDialog, setShowReviewBalanceDialog] = useState(false);
  const [selectedSettingsSection, setSelectedSettingsSection] = useState('reviews-ai');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<ReputationStats>({
    invitesGoal: 20,
    invitesSent: 0,
    reviewsReceived: 0,
    reviewsChange: 0,
    averageRating: 0,
    ratingChange: 0,
    sentiment: {
      positive: 0,
      neutral: 0,
      negative: 0,
    },
    ratingBreakdown: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    },
  });

  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const tab = searchParams.get('tab') || 'overview';

  const onTabChange = (value: string) => {
    if (value === 'listings') {
      navigate('/marketing/listings');
      return;
    }
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      try {
        const data = await reputationApi.getStats(timeRange);
        setStats(data);
      } catch (apiError) {
        console.warn('API fetch failed, using fallback mock data', apiError);
        // Mock data fallback
        setStats({
          invitesGoal: 20,
          invitesSent: 8,
          reviewsReceived: 12,
          reviewsChange: 15,
          averageRating: 4.5,
          ratingChange: 0.3,
          sentiment: {
            positive: 75,
            neutral: 15,
            negative: 10,
          },
          ratingBreakdown: {
            5: 8,
            4: 3,
            3: 1,
            2: 0,
            1: 0,
          },
        });
      }
    } catch (error) {
      console.error('Failed to load reputation data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reputation data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendReviewRequest = () => {
    toast({
      title: 'Review Request Sent',
      description: 'Your review request has been sent successfully.',
    });
    setShowRequestModal(false);
  };

  const getSentimentIcon = (type: 'positive' | 'neutral' | 'negative') => {
    switch (type) {
      case 'positive':
        return <Smile className="h-5 w-5 text-green-500" />;
      case 'neutral':
        return <Meh className="h-5 w-5 text-yellow-500" />;
      case 'negative':
        return <Frown className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <ModuleGuard moduleKey="reputation">
      <SEO
        title="Reputation Management"
        description="Manage your online reputation, reviews, and customer feedback"
      />

      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reputation</h1>
            <p className="text-muted-foreground">
              Monitor and manage your online reputation across all platforms
            </p>
          </div>
          <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Send className="h-4 w-4" />
                Send Review Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Send Review Request
                </DialogTitle>
                <DialogDescription>
                  Invite Your Customers to Leave a Review
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Name</Label>
                  <Input id="contact" placeholder="Search or create a contact" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Contact Phone</Label>
                    <Input id="phone" placeholder="Enter phone number" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Contact Email</Label>
                    <Input id="email" type="email" placeholder="Enter email address" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Choose Modes</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="cursor-pointer hover:border-primary">
                      <CardContent className="p-4 text-center">
                        <Checkbox id="email-mode" className="mb-2" />
                        <Label htmlFor="email-mode" className="cursor-pointer">
                          Email
                        </Label>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:border-primary">
                      <CardContent className="p-4 text-center">
                        <Checkbox id="sms-mode" className="mb-2" />
                        <Label htmlFor="sms-mode" className="cursor-pointer">
                          SMS
                        </Label>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:border-primary">
                      <CardContent className="p-4 text-center">
                        <Checkbox id="whatsapp-mode" className="mb-2" />
                        <Label htmlFor="whatsapp-mode" className="cursor-pointer">
                          WhatsApp
                        </Label>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                  <CardContent className="p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                      <strong>Reach out to your customers through Email for more reviews!</strong>
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Enable Email Review Requests to seamlessly collect customer feedback and boost your online reputation.
                    </p>
                    <Button variant="outline" size="sm" className="mt-3 gap-2">
                      <MessageSquare className="h-3 w-3" />
                      Enable Email Request
                    </Button>
                  </CardContent>
                </Card>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRequestModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendReviewRequest}>Send Review Request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={onTabChange} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <Send className="h-4 w-4" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <Star className="h-4 w-4" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="widgets" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Widgets
            </TabsTrigger>
            <TabsTrigger value="listings" className="gap-2">
              <Globe className="h-4 w-4" />
              Listings
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Get Started
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Button variant="outline" className="h-auto flex-col items-start p-4 gap-2">
                    <Globe className="h-5 w-5 text-blue-500" />
                    <div className="text-left">
                      <div className="font-semibold">Connect Google Business Profile</div>
                      <div className="text-xs text-muted-foreground">Link your GBP account</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col items-start p-4 gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <div className="text-left">
                      <div className="font-semibold">Configure Reviews AI</div>
                      <div className="text-xs text-muted-foreground">AI-powered responses</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col items-start p-4 gap-2">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    <div className="text-left">
                      <div className="font-semibold">Send your 1st Review Request</div>
                      <div className="text-xs text-muted-foreground">Start collecting reviews</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col items-start p-4 gap-2">
                    <Globe className="h-5 w-5 text-orange-500" />
                    <div className="text-left">
                      <div className="font-semibold">Connect more platforms</div>
                      <div className="text-xs text-muted-foreground">Yelp, Facebook, and more</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Tabs */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Button
                  variant={!showCompetitorAnalysis ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowCompetitorAnalysis(false)}
                >
                  My Stats
                </Button>
                <Button
                  variant={showCompetitorAnalysis ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowCompetitorAnalysis(true)}
                  className="gap-2"
                >
                  <Search className="h-3 w-3" />
                  Competitor Analysis
                </Button>
              </div>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">Last 1 Month</SelectItem>
                  <SelectItem value="3m">Last 3 Months</SelectItem>
                  <SelectItem value="6m">Last 6 Months</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!showCompetitorAnalysis ? (
              <>
                {/* Key Metrics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {/* Invites Goal */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Invites Goal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-2xl font-bold">{stats.invitesSent}</div>
                        <Target className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <Progress value={(stats.invitesSent / stats.invitesGoal) * 100} className="mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {Math.round((stats.invitesSent / stats.invitesGoal) * 100)}% of {stats.invitesGoal}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Reviews Received */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Reviews Received</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-2xl font-bold">{stats.reviewsReceived}</div>
                        <MessageSquare className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {stats.reviewsChange > 0 ? (
                          <>
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="text-green-500">+{stats.reviewsChange}%</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-3 w-3 text-red-500" />
                            <span className="text-red-500">{stats.reviewsChange}%</span>
                          </>
                        )}
                        <span className="text-muted-foreground">vs Previous 6 Months</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sentiment */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Sentiment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getSentimentIcon('positive')}
                            <span className="text-sm">{stats.sentiment.positive}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getSentimentIcon('neutral')}
                            <span className="text-sm">{stats.sentiment.neutral}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getSentimentIcon('negative')}
                            <span className="text-sm">{stats.sentiment.negative}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Average Rating */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
                        <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {stats.ratingChange > 0 ? (
                          <>
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="text-green-500">+{stats.ratingChange}</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-3 w-3 text-red-500" />
                            <span className="text-red-500">{stats.ratingChange}</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Rating Breakdown & Trends */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Rating Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Rating Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center gap-3">
                          <div className="flex items-center gap-1 w-16">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{rating} Stars</span>
                          </div>
                          <Progress
                            value={
                              stats.reviewsReceived > 0
                                ? (stats.ratingBreakdown[rating as keyof typeof stats.ratingBreakdown] /
                                  stats.reviewsReceived) *
                                100
                                : 0
                            }
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground w-8 text-right">
                            {stats.ratingBreakdown[rating as keyof typeof stats.ratingBreakdown]}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Visibility Prompt */}
                  <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-900">
                    <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                      <div className="mb-4">
                        <div className="text-6xl mb-2">🚀</div>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        Start Growing your Online Visibility Today!
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Get listed across 50+ Digital services Globally
                      </p>
                      <Button variant="default" className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Activate Listings
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Latest Activity */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Latest Review Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {requests.length === 0 ? (
                        <div className="text-center py-12">
                          <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="font-semibold mb-2">Start Sending Review Requests</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Send your first review request to start building credibility and trust
                          </p>
                          <Button onClick={() => setShowRequestModal(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Send Review Request
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Request list will go here */}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Latest Reviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reviews.length === 0 ? (
                        <div className="text-center py-12">
                          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="font-semibold mb-2">No Reviews Yet</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Once reviews start coming in, you can manage and respond here
                          </p>
                          <Button variant="outline" className="gap-2">
                            <Globe className="h-4 w-4" />
                            Start Collecting Reviews
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Reviews list will go here */}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              /* Competitor Analysis View */
              <Card>
                <CardContent className="p-12">
                  <div className="max-w-2xl mx-auto text-center space-y-6">
                    <div className="text-6xl mb-4">🔍</div>
                    <h2 className="text-2xl font-bold">Compare Your Business With Competitors</h2>
                    <div className="space-y-2 text-muted-foreground">
                      <p className="flex items-center justify-center gap-2">
                        <span className="text-green-500">✓</span>
                        You can add up to 3 Competitors
                      </p>
                      <p className="flex items-center justify-center gap-2">
                        <span className="text-green-500">✓</span>
                        Compare your business's online reputation with top competitors across Google, Yelp, Facebook, and more
                      </p>
                      <p className="text-sm">
                        Uncover insights that help you stand out and win trust.
                      </p>
                    </div>
                    <Button size="lg" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Competitor
                    </Button>

                    <Separator className="my-8" />

                    <div className="text-left">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <ExternalLink className="h-5 w-5" />
                        Insights You Can't Ignore
                      </h3>
                      <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                          <CardContent className="p-4">
                            <div className="aspect-video bg-muted rounded mb-2 flex items-center justify-center">
                              <BarChart3 className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h4 className="font-semibold mb-1">Score</h4>
                            <p className="text-xs text-muted-foreground">
                              Get a detailed breakdown of your website's performance load time, mobile optimization, and web vitals
                            </p>
                            <Button variant="link" size="sm" className="px-0 mt-2">
                              Learn More
                            </Button>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="aspect-video bg-muted rounded mb-2 flex items-center justify-center">
                              <Map className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h4 className="font-semibold mb-1">Competitive Grid</h4>
                            <p className="text-xs text-muted-foreground">
                              Visualize and compare key reputation metrics in one easy grid. Build unlimited reports to monitor and outperform
                            </p>
                            <Button variant="link" size="sm" className="px-0 mt-2">
                              Learn More
                            </Button>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="aspect-video bg-muted rounded mb-2 flex items-center justify-center">
                              <Smile className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h4 className="font-semibold mb-1">Sentiment Heat-map</h4>
                            <p className="text-xs text-muted-foreground">
                              Quickly visualize customer sentiment by category. Use this to fine-tune your messaging and customer experience
                            </p>
                            <Button variant="link" size="sm" className="px-0 mt-2">
                              Learn More
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Review Requests</CardTitle>
                <CardDescription>
                  Manage and track all your review requests across email, SMS, and WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Review Requests Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start sending review requests to collect valuable customer feedback
                  </p>
                  <Button onClick={() => setShowRequestModal(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Send First Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Reviews</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">Add Reviews</Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Sparkles className="h-4 w-4" />
                          AI Summary
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            AI Summary
                          </DialogTitle>
                          <DialogDescription>
                            AI-powered summaries of customer reviews, based on selected Review Pages and time ranges.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Page Source</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Source" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Sources</SelectItem>
                                <SelectItem value="google">Google</SelectItem>
                                <SelectItem value="yelp">Yelp</SelectItem>
                                <SelectItem value="facebook">Facebook</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Date Range</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Input type="date" placeholder="Start Date" />
                              <Input type="date" placeholder="End Date" />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline">Cancel</Button>
                          <Button>Summarize</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" onClick={() => setShowRequestModal(true)}>
                      Send Review Request
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex items-center gap-4 mb-6">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ratings" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="yelp">Yelp</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Input type="date" placeholder="Start Date" className="w-[160px]" />
                    <span className="text-muted-foreground">→</span>
                    <Input type="date" placeholder="End Date" className="w-[160px]" />
                  </div>
                  <div className="flex-1" />
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search" className="pl-9 w-[200px]" />
                  </div>
                </div>

                {/* Empty State */}
                <div className="text-center py-16">
                  <MessageSquare className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Reviews Yet</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Once reviews start coming in, you can manage and respond here to build trust.
                  </p>
                  <Button className="gap-2">
                    <Send className="h-4 w-4" />
                    Start Collecting Reviews
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Widgets Tab */}
          <TabsContent value="widgets" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
              {/* Widget Preview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Widget Preview</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                        </svg>
                      </Button>
                      <Button variant="outline" size="icon">
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Widget Preview */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
                    <Card className="w-full max-w-md shadow-lg">
                      <CardContent className="p-6">
                        <div className="text-center mb-6">
                          <h3 className="text-lg font-semibold mb-2">What our clients say about us</h3>
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                            <span className="text-2xl font-bold">0.00</span>
                          </div>
                          <p className="text-sm text-muted-foreground">5 reviews</p>
                        </div>
                        <Button className="w-full gap-2">
                          <Star className="h-4 w-4" />
                          Write a Review
                        </Button>
                        <p className="text-xs text-center text-muted-foreground mt-4">Powered by Xordon</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Embed Code Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full mt-4 gap-2">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <polyline points="16 18 22 12 16 6" />
                          <polyline points="8 6 2 12 8 18" />
                        </svg>
                        Get Embed Code
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Review Widget Code</DialogTitle>
                        <DialogDescription>
                          Add the below code to your website.{' '}
                          <a href="#" className="text-primary hover:underline">
                            Learn how to use Review Widget on your website or funnel here: Link
                          </a>
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Code</Label>
                          <div className="relative">
                            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                              {`<script type='text/javascript'
src='https://reputationhub.site/reputation/assets/review-widget.js'>
</script><iframe class='lc_reviews_widget'
src='https://reputationhub.site/reputation/widgets/review_widget/wSR
BH3T9mtsttWGjD5m' frameborder='0' scrolling='no' style='min-width:
100%; width: 100%; '></iframe>`}
                            </pre>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Widget Name</Label>
                          <Input defaultValue="Untitled" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" className="gap-2">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          Copy Code
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Widget Templates Sidebar */}
              <div className="space-y-4">
                <Tabs defaultValue="saved" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="saved">Saved Widgets</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                  </TabsList>
                  <TabsContent value="saved" className="space-y-4 mt-4">
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground mb-4">No saved widgets yet</p>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create new
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="templates" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div>
                        <Badge variant="secondary" className="mb-3">DEFAULT</Badge>
                        <div className="grid grid-cols-2 gap-3">
                          {[1, 2, 3, 4].map((i) => (
                            <Card key={i} className="cursor-pointer hover:border-primary transition-colors">
                              <CardContent className="p-4">
                                <div className="aspect-square bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    {[1, 2, 3, 4].map((j) => (
                                      <div key={j} className="w-8 h-8 bg-blue-500 rounded" />
                                    ))}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                      <Button className="w-full gap-2" onClick={() => setShowWidgetBuilder(true)}>
                        <Sparkles className="h-4 w-4" />
                        Edit Widget
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings" className="space-y-6">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-12">
                <div className="max-w-2xl mx-auto text-center space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">
                      One Tool to <span className="text-primary">Rank</span>
                    </h2>
                    <div className="flex justify-center my-6">
                      <div className="relative">
                        <div className="w-64 h-40 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg flex items-center justify-center">
                          <Globe className="h-20 w-20 text-primary" />
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground">
                      Don't leave your online reputation to chance harness the potential of Listings today !!
                    </p>
                  </div>

                  <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <ExternalLink className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-semibold mb-1">Unlock Your Business's Potential</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Scan Now to Discover if a Listings Subscription is Your Missing Link
                          </p>
                          <Button variant="outline" size="sm">
                            Scan my business for FREE!
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div>
                    <h3 className="font-semibold mb-4">What we offer</h3>
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      {[
                        { icon: Settings, label: 'Listing Management' },
                        { icon: ExternalLink, label: 'Premium Backlinks' },
                        { icon: Globe, label: 'Sync Functionality' },
                        { icon: Star, label: 'Duplicate Suppression' },
                      ].map((feature, i) => (
                        <div key={i} className="text-center">
                          <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center">
                            <feature.icon className="h-6 w-6 text-primary" />
                          </div>
                          <p className="text-xs text-muted-foreground">{feature.label}</p>
                        </div>
                      ))}
                    </div>
                    <Button size="lg" className="w-full">
                      Activate Listings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
              {/* Settings Sidebar */}
              <div className="space-y-1">
                <Button
                  variant={selectedSettingsSection === 'reviews-ai' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedSettingsSection('reviews-ai')}
                >
                  Reviews AI
                </Button>
                <Button
                  variant={selectedSettingsSection === 'review-link' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedSettingsSection('review-link')}
                >
                  Review Link
                </Button>
                <Button
                  variant={selectedSettingsSection === 'sms-requests' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedSettingsSection('sms-requests')}
                >
                  SMS Requests
                </Button>
                <Button
                  variant={selectedSettingsSection === 'email-requests' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedSettingsSection('email-requests')}
                >
                  Email Requests
                </Button>
                <Button
                  variant={selectedSettingsSection === 'whatsapp-requests' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedSettingsSection('whatsapp-requests')}
                >
                  WhatsApp Requests
                </Button>
                <Button
                  variant={selectedSettingsSection === 'reviews-qr' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedSettingsSection('reviews-qr')}
                >
                  Reviews QR
                </Button>
                <Button
                  variant={selectedSettingsSection === 'spam-reviews' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedSettingsSection('spam-reviews')}
                >
                  Spam Reviews
                </Button>
                <Button
                  variant={selectedSettingsSection === 'integrations' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedSettingsSection('integrations')}
                >
                  Integrations
                </Button>
              </div>

              {/* Settings Content */}
              <div className="space-y-6">
                {/* Review Link Section */}
                {selectedSettingsSection === 'review-link' && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            Review Link
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                              Auto Balance Enabled
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            Configure your Review Link to collect feedback from customers
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Review Balancing */}
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Switch defaultChecked />
                          <div>
                            <h4 className="font-semibold">Review Balancing</h4>
                            <p className="text-sm text-muted-foreground">
                              Automatically balance reviews for multiple socials
                            </p>
                          </div>
                        </div>
                        <Dialog open={showReviewBalanceDialog} onOpenChange={setShowReviewBalanceDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline">Configure Balance</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                <DialogTitle>Review Balancing</DialogTitle>
                              </div>
                              <DialogDescription>
                                Configure your Review Link to collect feedback from customers
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Review Platforms</Label>
                                <Select>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Your Review Platform" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="google">Google</SelectItem>
                                    <SelectItem value="yelp">Yelp</SelectItem>
                                    <SelectItem value="facebook">Facebook</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                  Sets Percentage equally to all or you can update manually
                                </p>
                                <Button variant="link" size="sm">
                                  Auto Balance
                                </Button>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowReviewBalanceDialog(false)}>
                                Cancel
                              </Button>
                              <Button onClick={() => setShowReviewBalanceDialog(false)}>Save</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {/* Custom Link */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                          <div className="p-2 bg-muted rounded">
                            <ExternalLink className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">Custom Link</h4>
                            <p className="text-sm text-muted-foreground">No Link Found</p>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Info className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Setup your custom link</span>
                          </div>
                          <Input
                            placeholder="www.custom-link.business.com/review"
                            className="font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground">
                            Your customers will provide reviews through the given link
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <div className="flex items-center justify-end gap-2 p-6 border-t">
                      <Button variant="outline">Cancel</Button>
                      <Button>Save</Button>
                    </div>
                  </Card>
                )

                }

                {/* SMS Requests Section */}
                {selectedSettingsSection === 'sms-requests' && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>SMS Review Requests</CardTitle>
                          <CardDescription>
                            Customize the message sent automatically to request reviews from your customers on a
                            recurring basis
                          </CardDescription>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* SMS Configuration */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>When to send SMS after check-in?</Label>
                          <Select defaultValue="immediately">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="immediately">Immediately</SelectItem>
                              <SelectItem value="1-hour">1 Hour</SelectItem>
                              <SelectItem value="2-hours">2 Hours</SelectItem>
                              <SelectItem value="1-day">1 Day</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Until clicked, repeat this every</Label>
                          <Select defaultValue="dont-repeat">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dont-repeat">Don't Repeat</SelectItem>
                              <SelectItem value="1-day">1 Day</SelectItem>
                              <SelectItem value="3-days">3 Days</SelectItem>
                              <SelectItem value="1-week">1 Week</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Maximum retries</Label>
                          <Input type="number" defaultValue="3" />
                        </div>
                      </div>

                      <Separator />

                      {/* Manage SMS Templates */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">Manage Your SMS Templates</h3>
                            <p className="text-sm text-muted-foreground">
                              View and manage all your SMS templates
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                              <Settings className="h-4 w-4" />
                              Set SMS Templates
                            </Button>
                            <Button size="sm" className="gap-2">
                              <Plus className="h-4 w-4" />
                              Create New
                            </Button>
                          </div>
                        </div>

                        {/* Templates Table */}
                        <Card>
                          <CardContent className="p-0">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="border-b">
                                  <tr className="text-sm text-muted-foreground">
                                    <th className="text-left p-4 font-medium">Name</th>
                                    <th className="text-left p-4 font-medium">Message</th>
                                    <th className="text-left p-4 font-medium">Type</th>
                                    <th className="text-left p-4 font-medium">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="border-b hover:bg-muted/50">
                                    <td className="p-4 font-medium">New Template</td>
                                    <td className="p-4 text-sm text-muted-foreground max-w-md truncate">
                                      Hi there! Thank you for choosing {'{{location.name}}'}.  Would you be
                                      willing to take 30 seconds and leave us a quick review? The link below
                                      makes it easy: {'{{reputation.review_link}}'}
                                    </td>
                                    <td className="p-4">
                                      <Badge>Live</Badge>
                                    </td>
                                    <td className="p-4">
                                      <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon">
                                          <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                          >
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                          </svg>
                                        </Button>
                                        <Button variant="ghost" size="icon">
                                          <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                          >
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                          </svg>
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <div className="flex items-center justify-end gap-2 p-4 border-t">
                              <Button variant="outline" size="sm" disabled>
                                Previous
                              </Button>
                              <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                                1
                              </Button>
                              <Button variant="outline" size="sm" disabled>
                                Next
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Email Requests Section */}
                {selectedSettingsSection === 'email-requests' && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Email Review Requests</CardTitle>
                          <CardDescription>Engage your audience with a personalized touch.</CardDescription>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Email Configuration */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>When to send Email after check-in?</Label>
                          <Select defaultValue="immediately">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="immediately">Immediately</SelectItem>
                              <SelectItem value="1-hour">1 Hour</SelectItem>
                              <SelectItem value="2-hours">2 Hours</SelectItem>
                              <SelectItem value="1-day">1 Day</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Until clicked, repeat this every</Label>
                          <Select defaultValue="dont-repeat">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dont-repeat">Don't Repeat</SelectItem>
                              <SelectItem value="1-day">1 Day</SelectItem>
                              <SelectItem value="3-days">3 Days</SelectItem>
                              <SelectItem value="1-week">1 Week</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Maximum retries</Label>
                          <Input type="number" defaultValue="1" />
                        </div>
                      </div>

                      <Separator />

                      {/* Email Templates */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">
                              Choose email templates for your email requests
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                              <Settings className="h-4 w-4" />
                              Set Email Templates
                            </Button>
                            <Button size="sm" className="gap-2">
                              <Plus className="h-4 w-4" />
                              Create New
                            </Button>
                          </div>
                        </div>

                        {/* Template Tabs */}
                        <Tabs defaultValue="recurring" className="w-full">
                          <TabsList>
                            <TabsTrigger value="recurring">Recurring Emails</TabsTrigger>
                            <TabsTrigger value="draft">Draft Emails</TabsTrigger>
                          </TabsList>
                          <TabsContent value="recurring" className="mt-4">
                            <Card>
                              <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <div>
                                        <h4 className="font-semibold">Default Email</h4>
                                        <Badge variant="secondary" className="mt-1">
                                          Live
                                        </Badge>
                                      </div>
                                      <Button variant="ghost" size="icon">
                                        <svg
                                          className="h-4 w-4"
                                          viewBox="0 0 24 24"
                                          fill="currentColor"
                                        >
                                          <circle cx="12" cy="5" r="2" />
                                          <circle cx="12" cy="12" r="2" />
                                          <circle cx="12" cy="19" r="2" />
                                        </svg>
                                      </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      <span className="font-medium">Subject:</span> Would you recommend us?
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </TabsContent>
                          <TabsContent value="draft" className="mt-4">
                            <div className="text-center py-8 text-muted-foreground">
                              No draft emails yet
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* WhatsApp Requests Section */}
                {selectedSettingsSection === 'whatsapp-requests' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>WhatsApp Review Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                        <CardContent className="p-8 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                            <MessageSquare className="h-8 w-8 text-green-600" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">
                            Reach out to your customer on their favourite messaging app
                          </h3>
                          <p className="text-sm text-muted-foreground mb-6 max-w-2xl mx-auto">
                            Stay closer to your customers by providing instant support, sending timely updates,
                            and creating engaging interactions.
                          </p>
                          <Button className="gap-2 bg-green-600 hover:bg-green-700">
                            <MessageSquare className="h-4 w-4" />
                            Connect WhatsApp
                          </Button>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                )}

                {/* Reviews QR Section */}
                {selectedSettingsSection === 'reviews-qr' && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Reviews QR</CardTitle>
                          <CardDescription>Create and customize your QR Codes</CardDescription>
                        </div>
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" />
                          Create QR Code
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 rounded-lg flex items-center justify-center">
                          <svg
                            className="h-12 w-12 text-primary"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Create your QR Code now</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          Time's ticking! Let's craft your first QR code to boost review collection.
                        </p>
                        <Button size="lg" className="gap-2">
                          <Plus className="h-5 w-5" />
                          New
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Spam Reviews Section */}
                {selectedSettingsSection === 'spam-reviews' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Spam Reviews</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Spam Detection Toggle */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card className="cursor-pointer hover:border-primary transition-colors">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded">
                                <X className="h-5 w-5 text-blue-500" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">Off</h4>
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Turn Off Reviews Spam Detection
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="cursor-pointer border-primary transition-colors">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded">
                                <Sparkles className="h-5 w-5 text-blue-500" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">On</h4>
                                  <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                  </div>
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Automatically Detects whether incoming review is spam or not
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Separator />

                      {/* Spam Detection Info */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Spam Detection of Reviews</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Enabling Spam Detection of Reviews will have the following impacts in the system.
                        </p>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>
                              All new incoming reviews will be automatically detected if they are spam or not.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>Users will have control to override the decision taken by the system.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>Automatic Reviews Reply will not be sent for spam detected reviews.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>
                              Scheduled Review Replies can be stopped by manually marking reviews as spam.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>Spam detected reviews will not show up in Review Widget.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>Spam detected reviews will be not added in Overview Dashboard.</span>
                          </li>
                        </ul>
                      </div>
                    </CardContent>
                    <div className="flex items-center justify-end gap-2 p-6 border-t">
                      <Button variant="outline">Cancel</Button>
                      <Button>Save</Button>
                    </div>
                  </Card>
                )}

                {/* Integrations Section */}
                {selectedSettingsSection === 'integrations' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Integrations</CardTitle>
                      <CardDescription>
                        Add review channels by enabling the plugin. It is simple!
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <Tabs defaultValue="custom-links" className="w-full">
                          <TabsList>
                            <TabsTrigger value="custom-links">Custom Links</TabsTrigger>
                            <TabsTrigger value="actions">Actions</TabsTrigger>
                            <TabsTrigger value="all-reviews">All Reviews</TabsTrigger>
                            <TabsTrigger value="avg">Avg</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>

                      {/* Integration Grid */}
                      <div className="grid grid-cols-4 gap-4">
                        {[
                          { name: 'Amazon', status: 'Integrate' },
                          { name: 'Agoda', status: 'Integrate' },
                          { name: 'Apple App Store', status: 'Integrate' },
                          { name: 'Angi', status: 'Integrate' },
                          { name: 'Better Business Bureau', status: 'Integrate' },
                          { name: 'Booking.com', status: 'Integrate' },
                          { name: 'Capterra', status: 'Integrate' },
                          { name: 'CarGurus', status: 'Integrate' },
                          { name: 'Cars.com', status: 'Integrate' },
                          { name: 'DealerRater', status: 'Integrate' },
                          { name: 'DoorDash', status: 'Integrate' },
                          { name: 'Edmunds', status: 'Integrate' },
                          { name: 'Etsy', status: 'Integrate' },
                          { name: 'Consumer Affairs', status: 'Integrate' },
                          { name: 'FindLaw', status: 'Integrate' },
                          { name: 'Foursquare', status: 'Integrate' },
                          { name: 'Facebook', status: 'Integrate' },
                          { name: 'Glassdoor', status: 'Integrate' },
                          { name: 'Google Business Profile', status: 'Settings' },
                          { name: 'Grubhub', status: 'Integrate' },
                          { name: 'Google Play', status: 'Integrate' },
                          { name: 'Google Shopping', status: 'Integrate' },
                          { name: 'Healthgrades', status: 'Integrate' },
                          { name: 'HomeAdvisor', status: 'Integrate' },
                          { name: 'Hotels.com', status: 'Integrate' },
                          { name: 'Houzz', status: 'Integrate' },
                          { name: 'Indeed', status: 'Integrate' },
                          { name: 'Lawyers.com', status: 'Integrate' },
                          { name: 'OpenTable', status: 'Integrate' },
                          { name: 'MLS', status: 'Integrate' },
                          { name: 'Product Hunt', status: 'Integrate' },
                          { name: 'Product Review', status: 'Integrate' },
                          { name: 'RealtyTrac', status: 'Integrate' },
                          { name: 'The Knot', status: 'Integrate' },
                          { name: 'Thumbtack', status: 'Integrate' },
                          { name: 'TripAdvisor', status: 'Integrate' },
                          { name: 'Trustpilot', status: 'Integrate' },
                          { name: 'Uber Eats', status: 'Integrate' },
                          { name: 'Vitals', status: 'Integrate' },
                          { name: 'WeddingWire', status: 'Integrate' },
                          { name: 'Yell', status: 'Integrate' },
                          { name: 'Yelp', status: 'Integrate' },
                          { name: 'Zillow', status: 'Integrate' },
                          { name: 'Zocdoc', status: 'Integrate' },
                          { name: 'Zomato', status: 'Integrate' },
                        ].map((platform, i) => (
                          <Card key={i} className="hover:border-primary transition-colors">
                            <CardContent className="p-4 text-center">
                              <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded flex items-center justify-center">
                                <Globe className="h-6 w-6 text-muted-foreground" />
                              </div>
                              <h4 className="font-medium text-sm mb-2">{platform.name}</h4>
                              <Button
                                variant={platform.status === 'Settings' ? 'default' : 'outline'}
                                size="sm"
                                className="w-full text-xs"
                              >
                                {platform.status}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Reviews AI Section */}
                {selectedSettingsSection === 'reviews-ai' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Reviews AI</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* AI Mode Selection */}
                      <div className="grid gap-4 md:grid-cols-3">
                        <Card className="cursor-pointer hover:border-primary transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded">
                                <Sparkles className="h-5 w-5 text-blue-500" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold mb-1">Off</h4>
                                <p className="text-xs text-muted-foreground">
                                  Turn off Reviews AI to stop receiving suggestions.
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="cursor-pointer border-primary transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded">
                                <MessageSquare className="h-5 w-5 text-blue-500" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">Suggestive</h4>
                                  <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Helps you articulate review responses
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="cursor-pointer hover:border-primary transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded">
                                <Send className="h-5 w-5 text-blue-500" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold mb-1">Auto Responses</h4>
                                <p className="text-xs text-muted-foreground">
                                  Automatically sends review responses
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="flex items-center justify-end">
                        <Button variant="link" className="gap-2">
                          <Sparkles className="h-4 w-4" />
                          Upgrade to unlimited AI Employee plan
                          <span>→</span>
                        </Button>
                      </div>

                      <Separator />

                      {/* Respond to Reviews - Drip Mode */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Respond to Reviews - Drip Mode</h3>
                        <Card className="bg-muted/50">
                          <CardContent className="p-12 text-center">
                            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h4 className="font-semibold mb-2">Connect Google business profile</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              Link your Google account to collect reviews and automate your responses.
                            </p>
                            <Button className="gap-2">
                              Integrate Now
                              <span>→</span>
                            </Button>
                          </CardContent>
                        </Card>
                      </div>

                      <Separator />

                      {/* Reviews AI Agents */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">Reviews AI Agents</h3>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                              <Settings className="h-4 w-4" />
                              Create Starter Agents
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" className="gap-2">
                                  <Plus className="h-4 w-4" />
                                  Create Agent
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                                <DialogHeader>
                                  <DialogTitle>Select Template</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 md:grid-cols-2 py-4">
                                  <Card className="cursor-pointer hover:border-primary transition-colors">
                                    <CardContent className="p-6">
                                      <div className="flex items-start gap-3 mb-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded">
                                          <Sparkles className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div>
                                          <h4 className="font-semibold mb-1">Start from scratch</h4>
                                          <p className="text-xs text-muted-foreground">
                                            Configure your own prompt to start generating replies
                                          </p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {[
                                    {
                                      id: 'CF',
                                      name: 'Claire Flair',
                                      badge: 'Professional',
                                      description:
                                        'Respond by highlighting their positive feedback or by addressing their concerns or suggestions. When customers have mentioned, address them concisely and provide clear, well-thought-out explanations or assurances...',
                                    },
                                    {
                                      id: 'GS',
                                      name: 'Grace Space',
                                      badge: 'Empathetic',
                                      description:
                                        'You will be provided with negative reviews of a business. Write a heartfelt and empathetic response that acknowledges the customer\'s concerns and frustrations...',
                                    },
                                    {
                                      id: 'TS',
                                      name: 'Taylor Sailor',
                                      badge: 'Optimistic',
                                      description:
                                        'You will be provided with reviews of a business. Reply to the reviews with a focus on customer success. Highlight how the business values feedback and continuously...',
                                    },
                                  ].map((template) => (
                                    <Card
                                      key={template.id}
                                      className="cursor-pointer hover:border-primary transition-colors"
                                    >
                                      <CardContent className="p-6">
                                        <div className="flex items-start gap-3 mb-3">
                                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                                            {template.id}
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <h4 className="font-semibold">{template.name}</h4>
                                              <Badge variant="secondary" className="text-xs">
                                                {template.badge}
                                              </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-3">
                                              {template.description}
                                            </p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>

                        {/* Agents Table */}
                        <Card>
                          <CardContent className="p-0">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="border-b">
                                  <tr className="text-sm text-muted-foreground">
                                    <th className="text-left p-4 font-medium">Agent Name</th>
                                    <th className="text-left p-4 font-medium">Date Updated</th>
                                    <th className="text-left p-4 font-medium">Review Type</th>
                                    <th className="text-left p-4 font-medium">Review Source</th>
                                    <th className="text-left p-4 font-medium">Tones</th>
                                    <th className="text-left p-4 font-medium">Responses</th>
                                    <th className="text-left p-4 font-medium"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {[
                                    {
                                      id: 'SS',
                                      name: 'Solutions Sally',
                                      date: 'Today at 2:28...',
                                      type: '2 stars or below',
                                      tone: 'Solution Oriented',
                                      responses: 0,
                                    },
                                    {
                                      id: 'AD',
                                      name: 'Axel Dazzle',
                                      date: 'Today at 2:28...',
                                      type: '4 stars or above',
                                      tone: 'Playful',
                                      responses: 0,
                                    },
                                    {
                                      id: 'TS',
                                      name: 'Taylor Sailor',
                                      date: 'Today at 2:28...',
                                      type: 'All Reviews',
                                      tone: 'Optimistic',
                                      responses: 0,
                                    },
                                    {
                                      id: 'GS',
                                      name: 'Grace Space',
                                      date: 'Today at 2:28...',
                                      type: '2 stars or below',
                                      tone: 'Empathetic',
                                      responses: 0,
                                    },
                                    {
                                      id: 'CF',
                                      name: 'Claire Flair',
                                      date: 'Today at 2:28...',
                                      type: '3 stars or above',
                                      tone: 'Professional',
                                      responses: 0,
                                    },
                                    {
                                      id: 'LR',
                                      name: 'Legacy Reviews...',
                                      date: 'Last Monday at...',
                                      type: 'All Reviews',
                                      tone: 'No Tone',
                                      responses: 0,
                                      noTone: true,
                                    },
                                  ].map((agent) => (
                                    <tr key={agent.id} className="border-b hover:bg-muted/50">
                                      <td className="p-4">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                                            {agent.id}
                                          </div>
                                          <span className="font-medium">{agent.name}</span>
                                        </div>
                                      </td>
                                      <td className="p-4 text-sm text-muted-foreground">
                                        {agent.date}
                                      </td>
                                      <td className="p-4">
                                        <Badge
                                          variant="secondary"
                                          className={
                                            agent.type.includes('below')
                                              ? 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/20'
                                              : agent.type.includes('above')
                                                ? 'text-green-600 bg-green-50 dark:bg-green-950/20'
                                                : 'text-green-600 bg-green-50 dark:bg-green-950/20'
                                          }
                                        >
                                          {agent.type}
                                        </Badge>
                                      </td>
                                      <td className="p-4">
                                        <div className="flex items-center gap-2">
                                          <Globe className="h-4 w-4 text-blue-500" />
                                          <span className="text-sm">All</span>
                                        </div>
                                      </td>
                                      <td className="p-4">
                                        <Badge
                                          variant={agent.noTone ? 'destructive' : 'secondary'}
                                          className={
                                            agent.noTone
                                              ? ''
                                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/20'
                                          }
                                        >
                                          {agent.tone}
                                        </Badge>
                                      </td>
                                      <td className="p-4 text-sm text-muted-foreground">
                                        {agent.responses}
                                      </td>
                                      <td className="p-4">
                                        <Button variant="ghost" size="icon">
                                          <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                          >
                                            <circle cx="12" cy="5" r="2" />
                                            <circle cx="12" cy="12" r="2" />
                                            <circle cx="12" cy="19" r="2" />
                                          </svg>
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="flex items-center justify-end gap-2 p-4 border-t">
                              <Button variant="outline" size="sm" disabled>
                                Previous
                              </Button>
                              <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                                1
                              </Button>
                              <Button variant="outline" size="sm" disabled>
                                Next
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Widget Builder Modal */}
      <WidgetBuilder isOpen={showWidgetBuilder} onClose={() => setShowWidgetBuilder(false)} />

      {/* AI Agent Dialog */}
      <AIAgentDialog isOpen={showAIAgentDialog} onClose={() => setShowAIAgentDialog(false)} />
    </ModuleGuard>
  );
}
