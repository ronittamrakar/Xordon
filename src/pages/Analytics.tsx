import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, type AnalyticsData, type Campaign } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Mail, MousePointerClick, Ban, UserX, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import { Breadcrumb } from '@/components/Breadcrumb';

const Analytics = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api.isAuthenticated()) {
      navigate('/auth');
      return;
    }

    const campaignId = searchParams.get('campaign');
    if (campaignId) {
      setSelectedCampaign(campaignId);
    }

    (async () => {
      try {
        const cs = await api.getCampaigns();
        setCampaigns(cs);
        await loadAnalytics(campaignId || undefined);
      } catch (err) {
        console.error('Failed to load analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, searchParams]);

  const loadAnalytics = async (campaignId?: string) => {
    try {
      setError(null);
      const data = await api.getAnalytics(campaignId);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load analytics data');
    }
  };

  const handleCampaignChange = (value: string) => {
    setSelectedCampaign(value);
    loadAnalytics(value === 'all' ? undefined : value);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">No analytics data available</p>
          </div>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: 'Opened', value: analytics.totalOpens, color: 'hsl(var(--chart-1))' },
    { name: 'Clicked', value: analytics.totalClicks, color: 'hsl(var(--chart-2))' },
    { name: 'Bounced', value: analytics.totalBounces, color: 'hsl(var(--chart-4))' },
    { name: 'Unsubscribed', value: analytics.totalUnsubscribes, color: 'hsl(var(--chart-5))' },
  ];

  const rateData = [
    { name: 'Open Rate', rate: analytics.openRate ?? 0 },
    { name: 'Click Rate', rate: analytics.clickRate ?? 0 },
    { name: 'Bounce Rate', rate: analytics.bounceRate ?? 0 },
    { name: 'Unsubscribe Rate', rate: analytics.unsubscribeRate ?? 0 },
  ];

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: 'Reports', href: '/reports', icon: <BarChart3 className="h-4 w-4" /> },
          { label: 'Analytics' }
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your campaign performance</p>
        </div>
        <Select value={selectedCampaign} onValueChange={handleCampaignChange}>
          <SelectTrigger className="w-[250px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            {campaigns.map((campaign) => (
              <SelectItem key={campaign.id} value={campaign.id}>
                {campaign.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stats-grid-spacing">
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-analytics" onClick={() => navigate(`/email/campaigns?tab=overview&filter=opened`)}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-[18px] font-bold">{(analytics.openRate ?? 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              {analytics.totalOpens} opens
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-analytics" onClick={() => navigate(`/email/campaigns?tab=overview&filter=clicked`)}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics.clickRate ?? 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              {analytics.totalClicks} clicks
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-analytics" onClick={() => navigate(`/email/campaigns?tab=overview&filter=bounced`)}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics.bounceRate ?? 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-600" />
              {analytics.totalBounces} bounces
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-analytics" onClick={() => navigate(`/email/campaigns?tab=overview&filter=unsubscribed`)}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unsubscribe Rate</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics.unsubscribeRate ?? 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-600" />
              {analytics.totalUnsubscribes} unsubscribes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-analytics">
          <CardHeader>
            <CardTitle>Engagement Over Time</CardTitle>
            <CardDescription>Daily email performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.dailyStats}>
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
                  <Line type="monotone" dataKey="opens" stroke="hsl(var(--chart-2))" name="Opens" />
                  <Line type="monotone" dataKey="clicks" stroke="hsl(var(--chart-3))" name="Clicks" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-analytics">
          <CardHeader>
            <CardTitle>Performance Breakdown</CardTitle>
            <CardDescription>Distribution of email actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
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

      <Card className="border-analytics">
        <CardHeader>
          <CardTitle>Rate Comparison</CardTitle>
          <CardDescription>Compare key performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rateData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  formatter={(value: number) => `${(value ?? 0).toFixed(1)}%`}
                />
                <Bar dataKey="rate" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
