import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  MousePointerClick,
  Ban,
  UserX,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  DollarSign,
  Users,
  Zap
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';

import { Breadcrumb } from '@/components/Breadcrumb';

interface SMSMetrics {
  totalSent: number;
  delivered: number;
  failed: number;
  clicked: number;
  replied: number;
  unsubscribed: number;
  deliveryRate: number;
  clickRate: number;
  replyRate: number;
  unsubscribeRate: number;
  totalCost: number;
  avgCostPerSMS: number;
}

interface CampaignAnalytics {
  id: string;
  name: string;
  sent: number;
  delivered: number;
  clicked: number;
  replied: number;
  deliveryRate: number;
  clickRate: number;
  replyRate: number;
  cost: number;
  status: 'active' | 'completed' | 'paused';
}

interface TimeSeriesData {
  date: string;
  sent: number;
  delivered: number;
  clicked: number;
  replied: number;
}

const SMSAnalytics = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [metrics, setMetrics] = useState<SMSMetrics | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignAnalytics[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('sent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {

    if (!api.isAuthenticated()) {
      navigate('/login');
      return;
    }

    const campaignId = searchParams.get('campaign');
    if (campaignId) {
      setSelectedCampaign(campaignId);
    }

    (async () => {
      try {
        await loadAnalytics(campaignId || undefined);
      } catch (err) {
        console.error('Failed to load SMS analytics:', err);
        setError('Failed to load SMS analytics data');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, searchParams, selectedPeriod, selectedCampaign]);

  const loadAnalytics = async (campaignId?: string) => {
    try {
      setError(null);
      // Use actual API call instead of mock data
      const analyticsData = await api.getSMSAnalytics();

      // Transform API response to match component interface with proper type handling
      const transformedMetrics: SMSMetrics = {
        totalSent: Number(analyticsData.total_sent || analyticsData.stats?.total_sent || 0),
        delivered: Number(analyticsData.total_delivered || analyticsData.stats?.total_delivered || 0),
        failed: Number(analyticsData.total_failed || analyticsData.stats?.total_failed || 0),
        clicked: 0, // Not available in current API, keeping as 0
        replied: 0, // Not available in current API
        unsubscribed: 0, // Not available in current API
        deliveryRate: Number(analyticsData.avg_delivery_rate || analyticsData.stats?.delivery_rate || 0),
        clickRate: 0, // Not available in current API
        replyRate: 0, // Not available in current API
        unsubscribeRate: Number(analyticsData.stats?.unsubscribe_rate || 0),
        totalCost: 0, // Not available in current API
        avgCostPerSMS: 0 // Not available in current API
      };

      // Transform top campaigns data with proper type handling
      const transformedCampaigns: CampaignAnalytics[] = (analyticsData.top_campaigns || []).map((campaign: Record<string, unknown>) => ({
        id: String(campaign.id),
        name: String(campaign.name),
        sent: Number(campaign.sent || campaign.messages_sent || 0),
        delivered: Number(campaign.delivered || 0),
        clicked: 0, // Not available
        replied: 0, // Not available
        deliveryRate: Number(campaign.delivery_rate || 0),
        clickRate: 0, // Not available
        replyRate: 0, // Not available
        cost: 0, // Not available
        status: 'active' as const // Default status, could be enhanced
      }));

      // Transform daily volume data to time series
      const transformedTimeSeriesData: TimeSeriesData[] = (analyticsData.daily_volume || []).map((day: Record<string, unknown>) => ({
        date: String(day.date),
        sent: Number(day.sent || day.count || 0),
        delivered: Number(day.delivered || Math.round((Number(day.sent || day.count || 0)) * (transformedMetrics.deliveryRate / 100))), // Estimate
        clicked: 0, // Not available
        replied: 0 // Not available
      }));

      setMetrics(transformedMetrics);
      setCampaigns(transformedCampaigns);
      setTimeSeriesData(transformedTimeSeriesData);
    } catch (error) {
      console.error('Failed to load SMS analytics:', error);
      setError('Failed to load SMS analytics data');
      toast({
        title: 'Error',
        description: 'Failed to load SMS analytics',
        variant: 'destructive',
      });

      // Fallback to mock data if API fails
      const mockMetrics: SMSMetrics = {
        totalSent: 0,
        delivered: 0,
        failed: 0,
        clicked: 0,
        replied: 0,
        unsubscribed: 0,
        deliveryRate: 0,
        clickRate: 0,
        replyRate: 0,
        unsubscribeRate: 0,
        totalCost: 0,
        avgCostPerSMS: 0
      };

      setMetrics(mockMetrics);
      setCampaigns([]);
      setTimeSeriesData([]);
    }
  };

  const handleCampaignChange = (value: string) => {
    setSelectedCampaign(value);
    loadAnalytics(value === 'all' ? undefined : value);
  };

  const exportData = () => {
    // Mock export functionality
    toast({
      title: 'Export Started',
      description: 'Your analytics data is being prepared for download',
    });
  };

  const getStatusColor = (status: CampaignAnalytics['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const pieChartData = metrics ? [
    { name: 'Delivered', value: metrics.delivered, color: 'hsl(var(--chart-2))' },
    { name: 'Failed', value: metrics.failed, color: 'hsl(var(--destructive))' },
  ] : [];

  const engagementData = metrics ? [
    { name: 'Clicked', value: metrics.clicked, color: 'hsl(var(--chart-3))' },
    { name: 'Replied', value: metrics.replied, color: 'hsl(var(--chart-4))' },
    { name: 'Unsubscribed', value: metrics.unsubscribed, color: 'hsl(var(--chart-5))' },
  ] : [];

  if (loading) {
    return (
      <>
        <div className="space-y-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading SMS analytics...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="space-y-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!metrics) {
    return (
      <>
        <div className="space-y-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-muted-foreground">No SMS analytics data available</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Breadcrumb
          items={[
            { label: 'SMS Marketing', href: '/sms', icon: <MessageSquare className="h-4 w-4" /> },
            { label: 'Analytics' }
          ]}
        />

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-[18px] font-bold tracking-tight text-foreground">SMS Analytics</h1>
            <p className="text-muted-foreground mt-1">Track performance of your SMS campaigns and engagement metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportData} className="text-foreground">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-analytics" onClick={() => navigate(`/reach/outbound/sms/campaigns?tab=overview&filter=sent`)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">{metrics.totalSent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-green-600" />
                {formatCurrency(metrics.totalCost)} total cost
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow border-analytics" onClick={() => navigate(`/reach/outbound/sms/campaigns?tab=overview&filter=delivered`)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">{formatPercentage(metrics.deliveryRate)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-status-opened" />
                {metrics.delivered.toLocaleString()} delivered
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow border-analytics" onClick={() => navigate(`/reach/outbound/sms/campaigns?tab=overview&filter=clicked`)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">{formatPercentage(metrics.clickRate)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-status-clicked" />
                {metrics.clicked.toLocaleString()} clicks
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow border-analytics" onClick={() => navigate(`/reach/outbound/sms/campaigns?tab=overview&filter=replied`)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reply Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">{formatPercentage(metrics.replyRate)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-status-replied" />
                {metrics.replied.toLocaleString()} replies
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Time Series Chart */}
          <Card className="border-analytics">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>SMS Performance Over Time</CardTitle>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="clicked">Clicked</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Area
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke="hsl(var(--chart-3))"
                    fill="hsl(var(--chart-3))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Delivery Status Pie Chart */}
          <Card className="border-analytics">
            <CardHeader>
              <CardTitle>Delivery Status</CardTitle>
              <CardDescription>
                Distribution of message delivery outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Engagement Metrics */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Engagement Chart */}
          <Card className="border-analytics">
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
              <CardDescription>
                User interactions with your SMS campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--chart-4))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cost Analysis */}
          <Card className="border-analytics">
            <CardHeader>
              <CardTitle>Cost Analysis</CardTitle>
              <CardDescription>
                SMS campaign cost breakdown and efficiency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                  <p className="text-[18px] font-bold">{formatCurrency(metrics.totalCost)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Cost per SMS</p>
                  <p className="text-[18px] font-bold">{formatCurrency(metrics.avgCostPerSMS)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Cost per Click</p>
                  <p className="text-[18px] font-bold">
                    {formatCurrency(metrics.totalCost / metrics.clicked)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Cost per Reply</p>
                  <p className="text-[18px] font-bold">
                    {formatCurrency(metrics.totalCost / metrics.replied)}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4" />
                  <span>15% lower cost per engagement vs last month</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Performance Table */}
        <Card className="border-analytics">
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>
              Detailed metrics for individual SMS campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Campaign</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-right py-2">Sent</th>
                    <th className="text-right py-2">Delivered</th>
                    <th className="text-right py-2">Clicked</th>
                    <th className="text-right py-2">Replied</th>
                    <th className="text-right py-2">Delivery Rate</th>
                    <th className="text-right py-2">Click Rate</th>
                    <th className="text-right py-2">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 font-medium">{campaign.name}</td>
                      <td className="py-2">
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </td>
                      <td className="py-2 text-right">{campaign.sent.toLocaleString()}</td>
                      <td className="py-2 text-right">{campaign.delivered.toLocaleString()}</td>
                      <td className="py-2 text-right">{campaign.clicked.toLocaleString()}</td>
                      <td className="py-2 text-right">{campaign.replied.toLocaleString()}</td>
                      <td className="py-2 text-right">{formatPercentage(campaign.deliveryRate)}</td>
                      <td className="py-2 text-right">{formatPercentage(campaign.clickRate)}</td>
                      <td className="py-2 text-right">{formatCurrency(campaign.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Additional Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-analytics">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Messages</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">{metrics.failed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage((metrics.failed / metrics.totalSent) * 100)} failure rate
              </p>
            </CardContent>
          </Card>

          <Card className="border-analytics">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unsubscribes</CardTitle>
              <AlertCircle className="h-4 w-4 text-hunter-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">{metrics.unsubscribed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(metrics.unsubscribeRate)} unsubscribe rate
              </p>
            </CardContent>
          </Card>

          <Card className="border-analytics">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Zap className="h-4 w-4 text-status-sent" />
            </CardHeader>
            <CardContent>
              <div className="text-[18px] font-bold">
                {campaigns.filter(c => c.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {campaigns.filter(c => c.status === 'paused').length} paused
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default SMSAnalytics;
