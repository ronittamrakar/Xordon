import { useState, useEffect } from 'react';
import { Plus, Star, Send, BarChart3, Settings, Trash2, MoreVertical, ExternalLink, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import reviewRequestsApi, { ReviewRequest, ReviewStats, ReviewPlatformConfig } from '@/services/reviewRequestsApi';
import ReviewPlatformConnection from '@/components/ReviewPlatformConnection';

export default function ReviewRequests() {
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [platforms, setPlatforms] = useState<ReviewPlatformConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isPlatformOpen, setIsPlatformOpen] = useState(false);
  const { toast } = useToast();

  const [sendForm, setSendForm] = useState({
    email: '',
    phone: '',
    channel: 'email' as 'email' | 'sms' | 'both',
  });

  const [platformForm, setPlatformForm] = useState({
    platform: 'google' as 'google' | 'facebook' | 'yelp' | 'trustpilot' | 'custom',
    platform_name: '',
    review_url: '',
    priority: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsRes, statsRes, platformsRes] = await Promise.all([
        reviewRequestsApi.list(),
        reviewRequestsApi.getStats(),
        reviewRequestsApi.getPlatforms(),
      ]);
      setRequests(requestsRes.data || []);
      setStats(statsRes);
      setPlatforms(platformsRes.data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!sendForm.email && !sendForm.phone) {
      toast({ title: 'Error', description: 'Email or phone is required', variant: 'destructive' });
      return;
    }
    try {
      await reviewRequestsApi.send(sendForm);
      toast({ title: 'Success', description: 'Review request sent successfully' });
      setIsSendOpen(false);
      setSendForm({ email: '', phone: '', channel: 'email' });
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send review request', variant: 'destructive' });
    }
  };

  const handleSavePlatform = async () => {
    if (!platformForm.review_url) {
      toast({ title: 'Error', description: 'Review URL is required', variant: 'destructive' });
      return;
    }
    try {
      await reviewRequestsApi.savePlatform(platformForm);
      toast({ title: 'Success', description: 'Platform saved successfully' });
      setIsPlatformOpen(false);
      setPlatformForm({ platform: 'google', platform_name: '', review_url: '', priority: 0 });
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save platform', variant: 'destructive' });
    }
  };

  const handleDeletePlatform = async (id: number) => {
    if (!confirm('Are you sure you want to delete this platform?')) return;
    try {
      await reviewRequestsApi.deletePlatform(id);
      toast({ title: 'Success', description: 'Platform deleted successfully' });
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete platform', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reviewed': return <Badge className="bg-green-500">Reviewed</Badge>;
      case 'clicked': return <Badge className="bg-blue-500">Clicked</Badge>;
      case 'sent': return <Badge className="bg-yellow-500">Sent</Badge>;
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      case 'declined': return <Badge variant="destructive">Declined</Badge>;
      case 'expired': return <Badge variant="outline">Expired</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'google': return '🔍';
      case 'facebook': return '📘';
      case 'yelp': return '⭐';
      case 'trustpilot': return '🌟';
      default: return '🔗';
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Review Requests</h1>
          <p className="text-muted-foreground">Manage your reputation and collect reviews</p>
        </div>
        <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
          <DialogTrigger asChild>
            <Button>
              <Send className="w-4 h-4 mr-2" />
              Send Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Review Request</DialogTitle>
              <DialogDescription>Request a review from a customer</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={sendForm.channel} onValueChange={(v: any) => setSendForm({ ...sendForm, channel: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(sendForm.channel === 'email' || sendForm.channel === 'both') && (
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={sendForm.email}
                    onChange={(e) => setSendForm({ ...sendForm, email: e.target.value })}
                    placeholder="customer@example.com"
                  />
                </div>
              )}
              {(sendForm.channel === 'sms' || sendForm.channel === 'both') && (
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={sendForm.phone}
                    onChange={(e) => setSendForm({ ...sendForm, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
              )}
              <DialogFooter>
                <Button onClick={handleSendRequest}>Send Request</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total Sent</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.clicked}</div>
              <div className="text-xs text-muted-foreground">Clicked</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.reviewed}</div>
              <div className="text-xs text-muted-foreground">Reviewed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold">{stats.click_rate}%</div>
              <div className="text-xs text-muted-foreground">Click Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold">{stats.review_rate}%</div>
              <div className="text-xs text-muted-foreground">Review Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-yellow-500 flex items-center justify-center gap-1">
                {stats.avg_rating || '-'}
                <Star className="w-4 h-4 fill-current" />
              </div>
              <div className="text-xs text-muted-foreground">Avg Rating</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Star className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No review requests yet</h3>
                <p className="text-muted-foreground mb-4">Send your first review request to start collecting reviews</p>
                <Button onClick={() => setIsSendOpen(true)}>
                  <Send className="w-4 h-4 mr-2" />
                  Send Request
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {requests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {request.channel === 'email' ? (
                            <Mail className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <MessageSquare className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {request.first_name} {request.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {request.email || request.phone}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {request.review_rating && (
                          <div className="flex items-center gap-1 text-yellow-500">
                            {request.review_rating}
                            <Star className="w-4 h-4 fill-current" />
                          </div>
                        )}
                        {getStatusBadge(request.status)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isPlatformOpen} onOpenChange={setIsPlatformOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Platform
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Review Platform</DialogTitle>
                  <DialogDescription>Configure where customers can leave reviews</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select value={platformForm.platform} onValueChange={(v: any) => setPlatformForm({ ...platformForm, platform: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="yelp">Yelp</SelectItem>
                        <SelectItem value="trustpilot">Trustpilot</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {platformForm.platform === 'custom' && (
                    <div className="space-y-2">
                      <Label>Platform Name</Label>
                      <Input
                        value={platformForm.platform_name}
                        onChange={(e) => setPlatformForm({ ...platformForm, platform_name: e.target.value })}
                        placeholder="My Review Site"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Review URL</Label>
                    <Input
                      value={platformForm.review_url}
                      onChange={(e) => setPlatformForm({ ...platformForm, review_url: e.target.value })}
                      placeholder="https://g.page/r/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority (higher = shown first)</Label>
                    <Input
                      type="number"
                      value={platformForm.priority}
                      onChange={(e) => setPlatformForm({ ...platformForm, priority: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSavePlatform}>Save Platform</Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {platforms.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Settings className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No platforms configured</h3>
                <p className="text-muted-foreground mb-4">Add your review platforms to start collecting reviews</p>
                <Button onClick={() => setIsPlatformOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Platform
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {platforms.map((platform) => (
                <Card key={platform.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getPlatformIcon(platform.platform)}</span>
                        <CardTitle className="text-lg capitalize">
                          {platform.platform_name || platform.platform}
                        </CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(platform.review_url, '_blank')}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeletePlatform(platform.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground truncate">
                        {platform.review_url}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={platform.is_active ? 'default' : 'secondary'}>
                          {platform.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">Priority: {platform.priority}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <ReviewPlatformConnection onRefresh={loadData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
