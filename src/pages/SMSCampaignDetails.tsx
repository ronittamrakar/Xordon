import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Play, Pause, Edit, Trash2, MessageSquare, Users, BarChart3, Clock, Workflow } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { smsAPI } from '@/lib/sms-api';

interface SMSCampaign {
  id: string;
  name: string;
  description?: string;
  message: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  clickCount?: number;
  reply_count: number;
  created_at: string;
  scheduled_at?: string;
  group_id?: string;
  sender_id?: string;
  stats?: {
    total_messages?: number;
    sent_count?: number;
    delivered_count?: number;
    failed_count?: number;
    total_cost?: number;
  };
}

interface SMSMetrics {
  deliveryRate: number;
  clickRate: number;
  replyRate: number;
  failureRate: number;
}

const SMSCampaignDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<SMSCampaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        if (!id || id === ':id' || id.trim() === '') {
          toast.error('Invalid campaign ID');
          navigate('/reach/outbound/sms/campaigns');
          setLoading(false);
          return;
        }
        const campaignData = await smsAPI.getSMSCampaign(id);
        setCampaign(campaignData);
      } catch (error) {
        console.error('Error loading campaign:', error);
        toast.error('Failed to load campaign details');
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateMetrics = (campaign: SMSCampaign): SMSMetrics => {
    const deliveryRate = campaign.sent_count > 0 ? (campaign.delivered_count / campaign.sent_count) * 100 : 0;
    const clickRate = campaign.delivered_count > 0 ? ((campaign.clickCount || 0) / campaign.delivered_count) * 100 : 0;
    const replyRate = campaign.delivered_count > 0 ? ((campaign.reply_count || 0) / campaign.delivered_count) * 100 : 0;
    const failureRate = campaign.sent_count > 0 ? (campaign.failed_count / campaign.sent_count) * 100 : 0;

    return { deliveryRate, clickRate, replyRate, failureRate };
  };

  const handleStatusChange = async (newStatus: 'active' | 'paused') => {
    if (!campaign || !id) return;
    try {
      if (newStatus === 'active') {
        await smsAPI.startSMSCampaign(id);
      } else {
        await smsAPI.pauseSMSCampaign(id);
      }
      setCampaign({ ...campaign, status: newStatus });
      toast.success(`Campaign ${newStatus === 'active' ? 'started' : 'paused'} successfully`);
    } catch (error) {
      console.error('Error changing campaign status:', error);
      toast.error('Failed to change campaign status');
    }
  };

  const handleDelete = async () => {
    const confirmation = prompt('Type DELETE to confirm deletion:');
    if (confirmation === 'DELETE') {
      try {
        await smsAPI.deleteSMSCampaign(id!);
        toast.success('Campaign deleted successfully');
        navigate('/reach/outbound/sms/campaigns');
      } catch (error) {
        console.error('Error deleting campaign:', error);
        toast.error('Failed to delete campaign');
      }
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading campaign details...</p>
          </div>
        </div>
      </>
    );
  }

  if (!campaign) {
    return (
      <>
        <div className="text-center py-12">
          <h2 className="text-[16px] font-bold text-gray-900 dark:text-gray-100">Campaign not found</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">The requested SMS campaign could not be found.</p>
          <Button onClick={() => navigate('/reach/outbound/sms/campaigns')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
        </div>
      </>
    );
  }

  const metrics = calculateMetrics(campaign);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/reach/outbound/sms/campaigns')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-[18px] font-bold tracking-tight">{campaign.name}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getStatusColor(campaign.status)}>
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </Badge>
                {campaign.group_id && (
                  <Badge variant="outline">Group ID: {campaign.group_id}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            {campaign.status === 'draft' || campaign.status === 'paused' ? (
              <Button onClick={() => handleStatusChange('active')}>
                <Play className="h-4 w-4 mr-2" />
                Start Campaign
              </Button>
            ) : (
              <Button variant="outline" onClick={() => handleStatusChange('paused')}>
                <Pause className="h-4 w-4 mr-2" />
                Pause Campaign
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(`/reach/outbound/sms/campaigns/edit/${id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => navigate(`/automations/builder/builder?campaign=${id}&type=sms`)}>
              <Workflow className="h-4 w-4 mr-2" />
              Flow Builder
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recipients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">{campaign.total_recipients}</div>
              <p className="text-xs text-muted-foreground">
                {campaign.sent_count} sent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">{metrics.deliveryRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {campaign.delivered_count} delivered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">{metrics.clickRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {campaign.clickCount || 0} clicks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Replies</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">{campaign.reply_count || 0}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.replyRate.toFixed(1)}% reply rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="message">Message</TabsTrigger>
            <TabsTrigger value="recipients">Recipients</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Progress</CardTitle>
                  <CardDescription>Current sending status and progress</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Sent Progress</span>
                      <span>{campaign.sent_count}/{campaign.total_recipients}</span>
                    </div>
                    <Progress value={(campaign.sent_count / campaign.total_recipients) * 100} />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Delivery Rate</span>
                      <span>{metrics.deliveryRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.deliveryRate} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                  <CardDescription>Basic information about this campaign</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Created:</span>
                    <span className="text-sm">{new Date(campaign.created_at).toLocaleDateString()}</span>
                  </div>
                  {campaign.scheduled_at && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Scheduled:</span>
                      <span className="text-sm">{new Date(campaign.scheduled_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </Badge>
                  </div>
                  {campaign.group_id && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Group ID:</span>
                      <span className="text-sm">{campaign.group_id}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="message">
            <Card>
              <CardHeader>
                <CardTitle>SMS Message</CardTitle>
                <CardDescription>The message content sent to recipients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{campaign.message}</p>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Message length: {campaign.message.length} characters</p>
                  <p>Estimated segments: {Math.ceil(campaign.message.length / 160)}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recipients">
            <Card>
              <CardHeader>
                <CardTitle>Recipients</CardTitle>
                <CardDescription>Manage campaign recipients and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Recipient management coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Analytics</CardTitle>
                <CardDescription>In-depth performance metrics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Detailed analytics coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default SMSCampaignDetails;
