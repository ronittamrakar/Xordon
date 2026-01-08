import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type CombinedAnalyticsData, type CampaignListResponse, type CampaignSpecificAnalytics, type EmailCampaignAnalytics, type SMSCampaignAnalytics, type CallCampaignAnalytics } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CampaignSelector } from '@/components/CampaignSelector';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Mail,
  MessageSquare,
  FileTextIcon,
  MousePointerClick,
  Ban,
  UserX,
  BarChart3,
  Calendar,
  Users,
  Send,
  CheckCircle,
  XCircle,
  DollarSign,
  Eye,
  Clock,
  Phone,
  Voicemail,
  Filter,
  Download,
  RefreshCw,
  Zap,
  Target,
  Activity,
  UserPlus,
  Bot,
  Sparkles
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart } from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

const EnhancedAnalytics = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<CombinedAnalyticsData | CampaignSpecificAnalytics | null>(null);
  const [timeframe, setTimeframe] = useState<string>('30');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Campaign selection state for filtering reports
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [campaignList, setCampaignList] = useState<CampaignListResponse>({ email: [], sms: [], call: [] });
  const [campaignListLoading, setCampaignListLoading] = useState(true);

  // Fetch campaign list on mount
  useEffect(() => {
    const fetchCampaignList = async () => {
      try {
        const campaigns = await api.getCampaignsList();
        setCampaignList(campaigns);
      } catch (err) {
        console.error('Failed to load campaign list:', err);
      } finally {
        setCampaignListLoading(false);
      }
    };

    if (api.isAuthenticated()) {
      fetchCampaignList();
    }
  }, []);

  useEffect(() => {
    if (!api.isAuthenticated()) {
      navigate('/login');
      return;
    }

    loadAnalytics();
  }, [navigate, timeframe, selectedCampaign]);

  const loadAnalytics = useCallback(async (showRefreshToast = false) => {
    try {
      setError(null);
      if (showRefreshToast) setRefreshing(true);

      // Parse campaign selection to extract campaign_id and channel
      let campaignId: string | undefined;
      let channel: 'email' | 'sms' | 'call' | undefined;

      if (selectedCampaign && selectedCampaign !== 'all') {
        const [ch, id] = selectedCampaign.split(':');
        channel = ch as 'email' | 'sms' | 'call';
        campaignId = id;
      }

      const data = await api.getCombinedAnalytics(timeframe, campaignId, channel);
      setAnalytics(data);
      setLastUpdated(new Date());
      if (showRefreshToast) {
        toast.success('Analytics refreshed successfully');
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(`Failed to load analytics data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      if (showRefreshToast) {
        toast.error('Failed to refresh analytics');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeframe, selectedCampaign]);

  const handleRefresh = () => {
    loadAnalytics(true);
  };

  const handleExport = () => {
    if (!analytics) return;

    // Check if viewing campaign-specific analytics
    const isCampaignData = 'campaign' in analytics && 'metrics' in analytics;

    let exportData: Record<string, unknown>;
    let filename: string;

    if (isCampaignData) {
      // Campaign-specific export
      const campaignData = analytics as CampaignSpecificAnalytics;
      exportData = {
        exportDate: new Date().toISOString(),
        timeframe: `Last ${timeframe} days`,
        campaign: {
          id: campaignData.campaign.id,
          name: campaignData.campaign.name,
          channel: campaignData.campaign.channel,
          status: campaignData.campaign.status
        },
        metrics: campaignData.metrics,
        dailyStats: campaignData.dailyStats,
        ...(('dispositions' in campaignData) && { dispositions: (campaignData as CallCampaignAnalytics).dispositions })
      };
      filename = `${campaignData.campaign.channel}-campaign-${campaignData.campaign.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    } else {
      // Combined analytics export
      const combinedData = analytics as CombinedAnalyticsData;
      exportData = {
        exportDate: new Date().toISOString(),
        timeframe: `Last ${timeframe} days`,
        overview: combinedData.overview,
        email: {
          totalSent: combinedData.email?.totalSent,
          openRate: combinedData.email?.openRate,
          clickRate: combinedData.email?.clickRate,
          bounceRate: combinedData.email?.bounceRate
        },
        sms: combinedData.sms?.stats,
        calls: {
          totalCalls: combinedData.calls?.totalCalls,
          answerRate: combinedData.calls?.answerRate,
          avgDuration: combinedData.calls?.avgDuration
        },
        forms: {
          totalForms: combinedData.forms?.totalForms,
          totalResponses: combinedData.forms?.totalResponses,
          conversionRate: combinedData.forms?.conversionRate
        }
      };
      filename = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!analytics) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-muted-foreground">No analytics data available</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Helper to check if viewing campaign-specific analytics
  const isCampaignSpecific = (data: CombinedAnalyticsData | CampaignSpecificAnalytics): data is CampaignSpecificAnalytics => {
    return 'campaign' in data && 'metrics' in data;
  };

  // Get channel from campaign-specific analytics
  const getCampaignChannel = (data: CampaignSpecificAnalytics): 'email' | 'sms' | 'call' => {
    return data.campaign.channel;
  };

  // Type guards for specific campaign types
  const isEmailCampaign = (data: CampaignSpecificAnalytics): data is EmailCampaignAnalytics => {
    return data.campaign.channel === 'email';
  };

  const isSMSCampaign = (data: CampaignSpecificAnalytics): data is SMSCampaignAnalytics => {
    return data.campaign.channel === 'sms';
  };

  const isCallCampaign = (data: CampaignSpecificAnalytics): data is CallCampaignAnalytics => {
    return data.campaign.channel === 'call';
  };

  // For combined analytics view
  const combinedData = !isCampaignSpecific(analytics) ? analytics : null;
  const { email, sms, forms, overview, calls } = combinedData || {} as CombinedAnalyticsData;

  // Email metrics
  const emailPieData = [
    { name: 'Opened', value: email?.totalOpens || 0, color: 'hsl(var(--chart-1))' },
    { name: 'Clicked', value: email?.totalClicks || 0, color: 'hsl(var(--chart-2))' },
    { name: 'Bounced', value: email?.totalBounces || 0, color: 'hsl(var(--chart-4))' },
    { name: 'Unsubscribed', value: email?.totalUnsubscribes || 0, color: 'hsl(var(--chart-5))' },
  ];

  // SMS metrics
  const smsPieData = [
    { name: 'Delivered', value: sms?.stats?.total_delivered || 0, color: 'hsl(var(--chart-1))' },
    { name: 'Failed', value: sms?.stats?.total_failed || 0, color: 'hsl(var(--chart-4))' },
    { name: 'Pending', value: (sms?.stats?.total_sent || 0) - (sms?.stats?.total_delivered || 0) - (sms?.stats?.total_failed || 0), color: 'hsl(var(--chart-3))' },
  ];

  // Form metrics
  const formPieData = [
    { name: 'Completed', value: forms?.totalResponses || 0, color: 'hsl(var(--chart-1))' },
    { name: 'Abandoned', value: (forms?.totalViews || 0) - (forms?.totalResponses || 0), color: 'hsl(var(--chart-4))' },
  ];

  return (
    <AppLayout>
      <SEO
        title="Reports & Analytics"
        description="Comprehensive reports on your campaign performance, engagement metrics, and channel effectiveness."
      />
      <div className="space-y-4">
        <Breadcrumb
          items={[
            { label: 'Reports', href: '/reports', icon: <BarChart3 className="h-4 w-4" /> }
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[18px] font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Track your email, SMS, calls, and form performance
              {lastUpdated && (
                <span className="ml-2 text-xs">
                  • Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CampaignSelector
              value={selectedCampaign}
              onChange={setSelectedCampaign}
              campaigns={campaignList}
              loading={campaignListLoading}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!analytics}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Campaign-Specific Views */}
        {isCampaignSpecific(analytics) && (
          <>
            {/* Campaign Header */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {analytics.campaign.channel === 'email' && <Mail className="h-6 w-6 text-blue-600" />}
                  {analytics.campaign.channel === 'sms' && <MessageSquare className="h-6 w-6 text-purple-600" />}
                  {analytics.campaign.channel === 'call' && <Phone className="h-6 w-6 text-orange-600" />}
                  <div>
                    <CardTitle>{analytics.campaign.name}</CardTitle>
                    <CardDescription className="capitalize">{analytics.campaign.channel} Campaign • {analytics.campaign.status}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Email Campaign Metrics */}
            {isEmailCampaign(analytics) && (
              <>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-8">
                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                      <Send className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{analytics.metrics.totalSent.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{analytics.metrics.openRate.toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">{analytics.metrics.totalOpens.toLocaleString()} opens</p>
                    </CardContent>
                  </Card>
                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                      <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{analytics.metrics.clickRate.toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">{analytics.metrics.totalClicks.toLocaleString()} clicks</p>
                    </CardContent>
                  </Card>
                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                      <Ban className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{analytics.metrics.bounceRate.toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">{analytics.metrics.totalBounces.toLocaleString()} bounces</p>
                    </CardContent>
                  </Card>
                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Unsubscribe Rate</CardTitle>
                      <UserX className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{analytics.metrics.unsubscribeRate.toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">{analytics.metrics.totalUnsubscribes.toLocaleString()} unsubs</p>
                    </CardContent>
                  </Card>
                </div>
                {/* Email Daily Stats Chart */}
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Daily Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analytics.dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="sent" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} name="Sent" />
                        <Area type="monotone" dataKey="opens" stackId="2" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.6} name="Opens" />
                        <Area type="monotone" dataKey="clicks" stackId="3" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.6} name="Clicks" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}

            {/* SMS Campaign Metrics */}
            {isSMSCampaign(analytics) && (
              <>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 mb-8">
                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                      <Send className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{analytics.metrics.totalSent.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{analytics.metrics.deliveryRate.toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">{analytics.metrics.totalDelivered.toLocaleString()} delivered</p>
                    </CardContent>
                  </Card>
                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Failure Rate</CardTitle>
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{analytics.metrics.failureRate.toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">{analytics.metrics.totalFailed.toLocaleString()} failed</p>
                    </CardContent>
                  </Card>
                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Reply Rate</CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{analytics.metrics.replyRate.toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">{analytics.metrics.totalReplies.toLocaleString()} replies</p>
                    </CardContent>
                  </Card>
                </div>
                {/* SMS Daily Stats Chart */}
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Daily Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analytics.dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="sent" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} name="Sent" />
                        <Area type="monotone" dataKey="delivered" stackId="2" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.6} name="Delivered" />
                        <Area type="monotone" dataKey="failed" stackId="3" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4))" fillOpacity={0.6} name="Failed" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Call Campaign Metrics */}
            {isCallCampaign(analytics) && (
              <>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 mb-8">
                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{analytics.metrics.totalCalls.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Answer Rate</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{analytics.metrics.answerRate.toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">{analytics.metrics.answeredCalls.toLocaleString()} answered</p>
                    </CardContent>
                  </Card>
                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{Math.floor(analytics.metrics.avgDuration / 60)}:{String(analytics.metrics.avgDuration % 60).padStart(2, '0')}</div>
                      <p className="text-xs text-muted-foreground">minutes:seconds</p>
                    </CardContent>
                  </Card>
                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Voicemails</CardTitle>
                      <Voicemail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{analytics.metrics.voicemails.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">{analytics.metrics.missedCalls.toLocaleString()} missed</p>
                    </CardContent>
                  </Card>
                </div>
                {/* Call Daily Stats Chart */}
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Daily Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="answered" stackId="a" fill="hsl(var(--chart-1))" name="Answered" />
                        <Bar dataKey="missed" stackId="a" fill="hsl(var(--chart-4))" name="Missed" />
                        <Bar dataKey="voicemail" stackId="a" fill="hsl(var(--chart-3))" name="Voicemail" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                {/* Disposition Breakdown */}
                {analytics.dispositions && analytics.dispositions.length > 0 && (
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Disposition Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.dispositions.map((disp, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-sm">{disp.name}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={(disp.count / analytics.metrics.totalCalls) * 100} className="w-24 h-2" />
                              <span className="text-sm font-medium w-12 text-right">{disp.count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}

        {/* Combined Analytics View (All Campaigns) */}
        {!isCampaignSpecific(analytics) && (
          <>
            {/* Overview Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 mb-8">
              <Card className="border-analytics">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-[18px] font-bold">{overview?.totalCampaigns || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Active across all channels
                  </p>
                </CardContent>
              </Card>

              <Card className="border-analytics">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-[18px] font-bold">{(overview?.totalRecipients || 0).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Across email & SMS
                  </p>
                </CardContent>
              </Card>

              <Card className="border-analytics">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-[18px] font-bold">{(overview?.totalMessages || 0).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Email + SMS sent
                  </p>
                </CardContent>
              </Card>

              <Card className="border-analytics">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-[18px] font-bold">{(calls?.totalCalls || 0).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Outbound calls made
                  </p>
                </CardContent>
              </Card>

              <Card className="border-analytics">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Answer Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-[18px] font-bold">{(calls?.answerRate || 0).toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    Calls answered
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats Row */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 mb-8">
              <Card className="border-analytics bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-muted-foreground">Emails</span>
                  </div>
                  <div className="text-lg font-bold mt-1">{(email?.totalSent || 0).toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card className="border-analytics bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-muted-foreground">Opens</span>
                  </div>
                  <div className="text-lg font-bold mt-1">{(email?.totalOpens || 0).toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card className="border-analytics bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-600" />
                    <span className="text-xs text-muted-foreground">SMS</span>
                  </div>
                  <div className="text-lg font-bold mt-1">{(sms?.stats?.total_sent || 0).toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card className="border-analytics bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-orange-600" />
                    <span className="text-xs text-muted-foreground">Calls</span>
                  </div>
                  <div className="text-lg font-bold mt-1">{(calls?.totalCalls || 0).toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card className="border-analytics bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/20 dark:to-background">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="h-4 w-4 text-cyan-600" />
                    <span className="text-xs text-muted-foreground">Forms</span>
                  </div>
                  <div className="text-lg font-bold mt-1">{(forms?.totalForms || 0).toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card className="border-analytics bg-gradient-to-br from-pink-50 to-white dark:from-pink-950/20 dark:to-background">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <MousePointerClick className="h-4 w-4 text-pink-600" />
                    <span className="text-xs text-muted-foreground">Clicks</span>
                  </div>
                  <div className="text-lg font-bold mt-1">{(email?.totalClicks || 0).toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card className="border-analytics bg-gradient-to-br from-muted/40 to-background dark:from-muted/10 dark:to-background">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-foreground" />
                    <span className="text-xs text-muted-foreground">Responses</span>
                  </div>
                  <div className="text-lg font-bold mt-1">{(forms?.totalResponses || 0).toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card className="border-analytics bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs text-muted-foreground">Engagement</span>
                  </div>
                  <div className="text-lg font-bold mt-1">{(overview?.engagementRate || 0).toFixed(1)}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Reports Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="flex-wrap">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="sms">SMS</TabsTrigger>
                <TabsTrigger value="calls">Calls</TabsTrigger>
                <TabsTrigger value="forms">Forms</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Performance Summary */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-8">
                  <Card className="border-analytics">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Channel Performance
                      </CardTitle>
                      <CardDescription>Engagement rates across all channels</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-blue-600" />
                              Email Open Rate
                            </span>
                            <span className="font-medium">{(email?.openRate || 0).toFixed(1)}%</span>
                          </div>
                          <Progress value={email?.openRate || 0} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-purple-600" />
                              SMS Delivery Rate
                            </span>
                            <span className="font-medium">{(sms?.stats?.delivery_rate || 0).toFixed(1)}%</span>
                          </div>
                          <Progress value={sms?.stats?.delivery_rate || 0} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-orange-600" />
                              Call Answer Rate
                            </span>
                            <span className="font-medium">{(calls?.answerRate || 0).toFixed(1)}%</span>
                          </div>
                          <Progress value={calls?.answerRate || 0} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <FileTextIcon className="h-4 w-4 text-cyan-600" />
                              Form Conversion Rate
                            </span>
                            <span className="font-medium">{(forms?.conversionRate || 0).toFixed(1)}%</span>
                          </div>
                          <Progress value={forms?.conversionRate || 0} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Key Insights
                      </CardTitle>
                      <CardDescription>AI-powered recommendations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(email?.openRate || 0) > 50 ? (
                          <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">Strong Email Performance</p>
                              <p className="text-xs text-green-600 dark:text-green-400">Your email open rate of {(email?.openRate || 0).toFixed(1)}% is above industry average</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                            <TrendingDown className="h-5 w-5 text-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-foreground">Improve Email Engagement</p>
                              <p className="text-xs text-muted-foreground">Consider A/B testing subject lines to boost open rates</p>
                            </div>
                          </div>
                        )}
                        {(calls?.answerRate || 0) < 30 && (calls?.totalCalls || 0) > 0 && (
                          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <Phone className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Optimize Call Timing</p>
                              <p className="text-xs text-blue-600 dark:text-blue-400">Try calling during different hours to improve answer rates</p>
                            </div>
                          </div>
                        )}
                        {(forms?.totalResponses || 0) > 0 && (
                          <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                            <FileTextIcon className="h-5 w-5 text-purple-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Form Engagement Active</p>
                              <p className="text-xs text-purple-600 dark:text-purple-400">{forms?.totalResponses} responses collected in the last {timeframe} days</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
                          <Activity className="h-5 w-5 text-gray-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Overall Engagement</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Combined engagement rate: {(overview?.engagementRate || 0).toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Channel Comparison Radar Chart */}
                <Card className="border-analytics">
                  <CardHeader>
                    <CardTitle>Multi-Channel Performance Radar</CardTitle>
                    <CardDescription>Compare performance metrics across all channels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={[
                          { metric: 'Email Open', value: email?.openRate || 0, fullMark: 100 },
                          { metric: 'Email Click', value: email?.clickRate || 0, fullMark: 100 },
                          { metric: 'SMS Delivery', value: sms?.stats?.delivery_rate || 0, fullMark: 100 },
                          { metric: 'Call Answer', value: calls?.answerRate || 0, fullMark: 100 },
                          { metric: 'Form Convert', value: forms?.conversionRate || 0, fullMark: 100 },
                        ]}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="metric" className="text-xs" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar name="Performance" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px',
                            }}
                            formatter={(value: number) => `${(value || 0).toFixed(1)}%`}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                {/* Email Metrics */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{(email?.openRate || 0).toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        {email?.totalOpens || 0} opens
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                      <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{(email?.clickRate || 0).toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        {email?.totalClicks || 0} clicks
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                      <Ban className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{(email?.bounceRate || 0).toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingDown className="h-3 w-3 text-red-600" />
                        {email?.totalBounces || 0} bounces
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Unsubscribe Rate</CardTitle>
                      <UserX className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{(email?.unsubscribeRate || 0).toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingDown className="h-3 w-3 text-red-600" />
                        {email?.totalUnsubscribes || 0} unsubscribes
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Email Charts */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-8">
                  <Card className="border-analytics">
                    <CardHeader>
                      <CardTitle>Email Engagement Over Time</CardTitle>
                      <CardDescription>Daily email performance metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={email?.dailyStats || []}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px',
                              }}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="sent" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} name="Sent" />
                            <Area type="monotone" dataKey="opens" stackId="2" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.6} name="Opens" />
                            <Area type="monotone" dataKey="clicks" stackId="3" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.6} name="Clicks" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardHeader>
                      <CardTitle>Email Performance Breakdown</CardTitle>
                      <CardDescription>Distribution of email actions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={emailPieData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {emailPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="calls" className="space-y-4">
                {/* Call Metrics */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{calls?.totalCalls?.toLocaleString() || '0'}</div>
                      <p className="text-xs text-muted-foreground">
                        All call campaigns
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Answer Rate</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{(calls?.answerRate || 0).toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        {calls?.answeredCalls?.toLocaleString() || '0'} answered
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{calls?.avgDuration ? `${Math.floor(calls.avgDuration / 60)}m ${calls.avgDuration % 60}s` : '0m 0s'}</div>
                      <p className="text-xs text-muted-foreground">
                        Average call length
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{(calls?.conversionRate || 0).toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">
                        Successful outcomes
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Call Charts */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-8">
                  <Card className="border-analytics">
                    <CardHeader>
                      <CardTitle>Call Volume Over Time</CardTitle>
                      <CardDescription>Daily call volume and answer rates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={calls?.dailyStats || []}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px',
                              }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="calls" stroke="hsl(var(--chart-1))" name="Total Calls" />
                            <Line type="monotone" dataKey="answered" stroke="hsl(var(--chart-2))" name="Answered" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardHeader>
                      <CardTitle>Call Outcomes</CardTitle>
                      <CardDescription>Distribution of call results</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Answered', value: calls?.answeredCalls || 0, color: 'hsl(var(--chart-1))' },
                                { name: 'Voicemail', value: calls?.voicemails || 0, color: 'hsl(var(--chart-2))' },
                                { name: 'Busy', value: calls?.busyCalls || 0, color: 'hsl(var(--chart-4))' },
                                { name: 'No Answer', value: calls?.missedCalls || 0, color: 'hsl(var(--chart-5))' }
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {[{ name: 'Answered', color: 'hsl(var(--chart-1))' }, { name: 'Voicemail', color: 'hsl(var(--chart-2))' }, { name: 'Busy', color: 'hsl(var(--chart-4))' }, { name: 'No Answer', color: 'hsl(var(--chart-5))' }].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Call Campaigns */}
                {calls?.topCampaigns && calls?.topCampaigns.length > 0 && (
                  <Card className="border-analytics">
                    <CardHeader>
                      <CardTitle>Top Performing Call Campaigns</CardTitle>
                      <CardDescription>Call campaigns with highest answer rates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {calls?.topCampaigns.map((campaign, index) => (
                          <div key={campaign.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-medium text-muted-foreground">#{index + 1}</div>
                              <div>
                                <div className="font-medium">{campaign.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {campaign.calls} calls • {campaign.answered} answered
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{campaign.conversionRate}%</div>
                              <div className="text-sm text-muted-foreground">conversion rate</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="sms" className="space-y-4">
                {/* SMS Metrics */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">SMS Campaigns</CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{sms.total_campaigns || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        Active campaigns
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{(sms.stats?.delivery_rate || 0).toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        {sms.stats?.total_delivered || 0} delivered
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Failure Rate</CardTitle>
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{(sms.stats?.failure_rate || 0).toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingDown className="h-3 w-3 text-red-600" />
                        {sms.stats?.total_failed || 0} failed
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Reply Rate</CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{(sms.stats?.reply_rate || 0).toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">
                        Customer engagement
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* SMS Charts */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-8">
                  <Card className="border-analytics">
                    <CardHeader>
                      <CardTitle>SMS Volume Over Time</CardTitle>
                      <CardDescription>Daily SMS message volume</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={sms.daily_volume}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px',
                              }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="sent" stroke="hsl(var(--chart-1))" name="Sent" />
                            <Line type="monotone" dataKey="delivered" stroke="hsl(var(--chart-2))" name="Delivered" />
                            <Line type="monotone" dataKey="failed" stroke="hsl(var(--chart-4))" name="Failed" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardHeader>
                      <CardTitle>SMS Delivery Status</CardTitle>
                      <CardDescription>Distribution of SMS delivery status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={smsPieData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {smsPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top SMS Campaigns */}
                {sms?.top_campaigns && sms?.top_campaigns.length > 0 && (
                  <Card className="border-analytics">
                    <CardHeader>
                      <CardTitle>Top Performing SMS Campaigns</CardTitle>
                      <CardDescription>Campaigns with highest delivery rates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {sms?.top_campaigns.map((campaign, index) => (
                          <div key={campaign.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-medium text-muted-foreground">#{index + 1}</div>
                              <div>
                                <div className="font-medium">{campaign.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {campaign.sent} sent • {campaign.delivered} delivered
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{campaign.delivery_rate}%</div>
                              <div className="text-sm text-muted-foreground">delivery rate</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="forms" className="space-y-4">
                {/* Form Metrics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
                      <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{forms?.totalForms || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        Active forms
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                      <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{(forms?.conversionRate || 0).toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        {forms?.totalResponses || 0} responses
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{(forms?.totalViews || 0).toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        Form impressions
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-[18px] font-bold">{(forms?.avgResponseTime || 0).toFixed(0)}s</div>
                      <p className="text-xs text-muted-foreground">
                        Time to complete
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Form Charts */}
                <div className="grid gap-6 md:grid-cols-2 mb-8">
                  <Card className="border-analytics">
                    <CardHeader>
                      <CardTitle>Form Responses Over Time</CardTitle>
                      <CardDescription>Daily form response trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={forms?.dailyResponses || []}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px',
                              }}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="views" stackId="1" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.3} name="Views" />
                            <Area type="monotone" dataKey="responses" stackId="2" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} name="Responses" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardHeader>
                      <CardTitle>Form Conversion Status</CardTitle>
                      <CardDescription>Views vs completions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={formPieData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {formPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Performing Forms */}
                {forms?.topForms && forms?.topForms.length > 0 && (
                  <Card className="border-analytics">
                    <CardHeader>
                      <CardTitle>Top Performing Forms</CardTitle>
                      <CardDescription>Forms with highest conversion rates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {forms?.topForms.map((form, index) => (
                          <div key={form.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-medium text-muted-foreground">#{index + 1}</div>
                              <div>
                                <div className="font-medium">{form.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {form.views} views • {form.responses} responses
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{(form.conversionRate || 0).toFixed(1)}%</div>
                              <div className="text-sm text-muted-foreground">conversion rate</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Response Sources */}
                {forms?.responseSources && forms?.responseSources.length > 0 && (
                  <Card className="border-analytics">
                    <CardHeader>
                      <CardTitle>Response Sources</CardTitle>
                      <CardDescription>Where form responses are coming from</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={forms?.responseSources || []}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="source" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px',
                              }}
                            />
                            <Bar dataKey="count" fill="hsl(var(--primary))" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="trends" className="space-y-4">
                {/* Combined Trends */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-8">
                  <Card className="border-analytics">
                    <CardHeader>
                      <CardTitle>Multi-Channel Engagement</CardTitle>
                      <CardDescription>Email, SMS, and Form trends over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px',
                              }}
                            />
                            <Legend />
                            <Line type="monotone" data={email?.dailyStats || []} dataKey="opens" stroke="hsl(var(--chart-1))" name="Email Opens" />
                            <Line type="monotone" data={sms?.daily_volume || []} dataKey="delivered" stroke="hsl(var(--chart-2))" name="SMS Delivered" />
                            <Line type="monotone" data={calls?.dailyStats || []} dataKey="answered" stroke="hsl(var(--chart-4))" name="Calls Answered" />
                            <Line type="monotone" data={forms?.dailyResponses || []} dataKey="responses" stroke="hsl(var(--chart-3))" name="Form Responses" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-analytics">
                    <CardHeader>
                      <CardTitle>Channel Performance Comparison</CardTitle>
                      <CardDescription>Email vs SMS vs Forms engagement rates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { channel: 'Email', rate: email?.openRate || 0, color: 'hsl(var(--chart-1))' },
                            { channel: 'SMS', rate: sms?.stats?.delivery_rate || 0, color: 'hsl(var(--chart-2))' },
                            { channel: 'Calls', rate: calls?.answerRate || 0, color: 'hsl(var(--chart-4))' },
                            { channel: 'Forms', rate: forms?.conversionRate || 0, color: 'hsl(var(--chart-3))' },
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="channel" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px',
                              }}
                              formatter={(value: number) => `${(value || 0).toFixed(1)}%`}
                            />
                            <Bar dataKey="rate" fill="hsl(var(--primary))" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default EnhancedAnalytics;

