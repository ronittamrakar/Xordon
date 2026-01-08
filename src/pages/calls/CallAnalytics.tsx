import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  Phone,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  MapPin,
  Target,
  PhoneIncoming,
  PhoneOutgoing,
  Activity,
  BarChart3,
  Timer
} from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AnalyticsFilters {
  dateRange: '24h' | '7d' | '30d' | '90d' | '1y' | 'custom';
  campaignId?: string;
  groupBy: 'day' | 'week' | 'month';
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CallAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: '30d',
    groupBy: 'day'
  });

  // Fetch Analytics
  const { data: analyticsData, refetch: refetchSummary, isLoading } = useQuery({
    queryKey: ['call-analytics', filters],
    queryFn: async () => {
      const res = await api.get(`/analytics/calls?range=${filters.dateRange}&campaign=${filters.campaignId || 'all'}`);
      return res.data;
    }
  });

  const { data: campaignsData } = useQuery<any[]>({
    queryKey: ['call-campaigns'],
    queryFn: async () => {
      const data = await api.getCallCampaigns();
      return Array.isArray(data) ? data : [];
    }
  });
  const campaigns = campaignsData || [];

  const { data: callLogsRes } = useQuery<any>({
    queryKey: ['call-logs', filters],
    queryFn: () => api.getCallLogs(filters.campaignId)
  });

  const callLogs = Array.isArray(callLogsRes) ? (callLogsRes as any[]) : ((callLogsRes?.logs || []) as any[]);

  // Process data for display
  const data = useMemo(() => {
    const raw = analyticsData || {};

    return {
      overview: {
        totalCalls: Number(raw.totalCalls || 0),
        inboundCalls: Number(raw.inboundCalls || 0),
        outboundCalls: Number(raw.outboundCalls || 0),
        answeredCalls: Number(raw.answeredCalls || 0),
        missedCalls: Number(raw.missedCalls || 0),
        avgCallDuration: Number(raw.averageDuration || 0),
        avgWaitTime: Number(raw.averageWaitTime || 0),
        totalDuration: Number(raw.totalDuration || 0),
        answerRate: raw.totalCalls > 0 ? ((raw.totalCalls - (raw.missedCalls || 0)) / raw.totalCalls * 100).toFixed(1) : '0',
        conversionRate: Number(raw.conversionRate || 0)
      },
      trends: (raw.dailyTrend || []).map((d: any) => ({
        date: d.date,
        calls: Number(d.total_calls || 0),
        inbound: Number(d.inbound || 0),
        outbound: Number(d.outbound || 0),
        answered: Number(d.answered_calls || 0),
        missed: Number(d.missed_calls || 0),
      })),
      hourlyDistribution: (raw.hourlyDistribution || []).map((h: any) => ({
        hour: `${h.hour}:00`,
        calls: Number(h.total_calls || 0),
        answered: Number(h.answered_calls || 0)
      })),
      callsByDay: (raw.callsByDay || []).map((d: any) => ({
        day: d.day,
        calls: Number(d.calls || 0)
      })),
      outcomeDistribution: (raw.outcomeDistribution || []).map((o: any, i: number) => ({
        ...o,
        color: COLORS[i % COLORS.length]
      })),
      campaignPerformance: (raw.campaigns || []).map((c: any) => ({
        campaign: c.name || 'Unknown',
        calls: Number(c.calls || 0),
        conversions: Number(c.conversions || 0),
        revenue: Number(c.revenue || 0)
      })),
      topAgents: (raw.topAgents || []).map((a: any) => ({
        name: a.name,
        calls: Number(a.calls || 0),
        avgDuration: Number(a.avg_duration || 0)
      })),
      sourceBreakdown: (raw.sourceBreakdown || []).map((s: any) => ({
        source: s.source,
        calls: Number(s.calls || 0),
        percentage: Number(s.percentage || 0)
      })),
      geographicData: (raw.geographicData || []).map((g: any) => ({
        location: g.location,
        calls: Number(g.calls || 0)
      }))
    };
  }, [analyticsData]);

  const handleExport = () => {
    const exportData = {
      analytics: data,
      filters,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Analytics exported successfully');
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const StatCard = ({ title, value, subtext, icon: Icon, trend, trendValue, colorClass }: {
    title: string;
    value: string | number;
    subtext?: string;
    icon: React.ElementType;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    colorClass?: string;
  }) => (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-2xl font-bold ${colorClass || 'text-foreground'}`}>{value}</p>
              {trend && (
                <span className={`text-xs font-medium flex items-center ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                  {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {trendValue}
                </span>
              )}
            </div>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
          </div>
          <div className="p-3 bg-muted/30 rounded-xl">
            <Icon className={`h-5 w-5 ${colorClass || 'text-primary'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-full flex-col space-y-4">
      <Breadcrumb
        items={[
          { label: 'Reach', href: '/reach/outbound/calls', icon: <Phone className="h-4 w-4" /> },
          { label: 'Calls', href: '/reach/calls/logs' },
          { label: 'Analytics' }
        ]}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight text-foreground">
            Call Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Real-time performance metrics and advanced insights</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.dateRange}
            onValueChange={(value: any) => setFilters(prev => ({ ...prev, dateRange: value }))}
          >
            <SelectTrigger className="w-[150px] bg-background">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.campaignId || 'all'}
            onValueChange={(value) => setFilters(prev => ({
              ...prev,
              campaignId: value === 'all' ? undefined : value
            }))}
          >
            <SelectTrigger className="w-[200px] bg-background">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Campaigns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns.map(campaign => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExport} className="bg-background">
            <Download className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Export JSON</span>
          </Button>
          <Button variant="outline" onClick={() => refetchSummary()} className="bg-background">
            <RefreshCw className={`h-4 w-4 md:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Traffic"
          value={data.overview.totalCalls.toLocaleString()}
          subtext={`${data.overview.inboundCalls} Inbound • ${data.overview.outboundCalls} Outbound`}
          icon={Phone}
          trend="up"
          trendValue="12.5%"
        />
        <StatCard
          title="Answer Rate"
          value={`${data.overview.answerRate}%`}
          subtext={`${data.overview.missedCalls} Missed calls`}
          icon={CheckCircle}
          trend="up"
          trendValue="5.2%"
          colorClass="text-green-600"
        />
        <StatCard
          title="Avg Call Duration"
          value={formatDuration(data.overview.avgCallDuration)}
          subtext={`${formatDuration(data.overview.totalDuration)} Total airtime`}
          icon={Clock}
          trend="down"
          trendValue="2.1%"
          colorClass="text-blue-600"
        />
        <StatCard
          title="Avg Wait Time"
          value={`${data.overview.avgWaitTime}s`}
          subtext="Inbound response time"
          icon={Timer}
          trend="up"
          trendValue="8.7%"
          colorClass="text-orange-600"
        />
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="trends" className="rounded-lg px-6">
            <TrendingUp className="h-4 w-4 mr-2" /> Trends
          </TabsTrigger>
          <TabsTrigger value="agents" className="rounded-lg px-6">
            <Users className="h-4 w-4 mr-2" /> Agents
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="rounded-lg px-6">
            <Target className="h-4 w-4 mr-2" /> Campaigns
          </TabsTrigger>
          <TabsTrigger value="insights" className="rounded-lg px-6">
            <BarChart3 className="h-4 w-4 mr-2" /> Detailed Insights
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-lg px-6">
            <BarChart className="h-4 w-4 mr-2" /> Call Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Call Volume Trend */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Continuous Traffic Volume</CardTitle>
                <CardDescription>Daily volume breakdown by direction</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.trends}>
                    <defs>
                      <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM dd')} />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="inbound" stroke="#3b82f6" fillOpacity={1} fill="url(#colorInbound)" name="Inbound" strokeWidth={2} />
                    <Area type="monotone" dataKey="outbound" stroke="#10b981" fillOpacity={1} fill="url(#colorOutbound)" name="Outbound" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Hourly Distribution */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Peak Operational Hours</CardTitle>
                <CardDescription>Average activity distribution throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.hourlyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="calls" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Traffic" />
                    <Bar dataKey="answered" fill="#10b981" radius={[4, 4, 0, 0]} name="Successful connections" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Calls by Day of Week */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Weekly Distribution</CardTitle>
                <CardDescription>Busiest days of the week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.callsByDay} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" />
                    <YAxis dataKey="day" type="category" width={100} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="calls" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Calls" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Outcome Pie */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Call Results Distribution</CardTitle>
                <CardDescription>Efficiency of call attempts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={data.outcomeDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {data.outcomeDistribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 min-w-[150px]">
                    {data.outcomeDistribution.map((entry: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-muted-foreground">{entry.name}</span>
                        </div>
                        <span className="font-bold">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Agent Performance Metrics</CardTitle>
              <CardDescription>Real-time activity by team member</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.topAgents.map((agent, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-xl bg-accent/5">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                        {agent.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold">{agent.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Avg: {formatDuration(agent.avgDuration)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="font-mono">{agent.calls} calls</Badge>
                    </div>
                  </div>
                ))}
                {data.topAgents.length === 0 && (
                  <div className="col-span-full py-12 text-center text-muted-foreground">
                    No agent activity recorded for this period.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Campaign Leaderboard</CardTitle>
              <CardDescription>Conversion metrics by outreach campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.campaignPerformance.map((campaign, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border rounded-xl hover:bg-accent/5 transition-all group">
                    <div className="flex-1 mb-2 sm:mb-0">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold">{index + 1}</span>
                        <h4 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{campaign.campaign}</h4>
                      </div>
                      <div className="flex gap-6 mt-2 text-sm text-muted-foreground ml-11">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {campaign.calls} attempts</span>
                        <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {campaign.conversions} conversions</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-10 ml-11 sm:ml-0">
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Conversion</span>
                        <span className="text-lg font-extrabold text-primary">
                          {campaign.calls > 0 ? ((campaign.conversions / campaign.calls) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Value Generated</span>
                        <span className="text-xl font-black text-foreground">
                          ${campaign.revenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {data.campaignPerformance.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground italic">
                    No active campaign data found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Traffic Attribution</CardTitle>
                <CardDescription>Inbound source channels</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.sourceBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="calls"
                    >
                      {data.sourceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {data.sourceBreakdown.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span>{source.source}</span>
                      </div>
                      <span className="font-bold">{source.calls}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Global Distribution</CardTitle>
                <CardDescription>Top geographic origins</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.geographicData.map((location, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 font-medium">
                          <MapPin className="h-3 w-3 text-red-500" />
                          {location.location}
                        </div>
                        <span className="font-bold">{location.calls}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-1000"
                          style={{
                            width: `${(location.calls / (data.overview.totalCalls || 1)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {data.geographicData.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      Geographic tracking initializing...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Real-Time Activity Stream</CardTitle>
                <CardDescription>Sequential history of recent communications</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/reach/calls/logs')}>View all logs</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {callLogs.slice(0, 10).map((log: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-muted-foreground/10">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ring-4 ring-background ${['answered', 'completed'].includes(log.status) ? 'bg-green-500' :
                        log.status === 'voicemail' ? 'bg-yellow-500' :
                          log.status === 'busy' ? 'bg-orange-500' : 'bg-red-500'
                        }`} />
                      <div>
                        <div className="font-bold text-foreground">
                          {log.recipient?.firstName || log.phone_number} {log.recipient?.lastName || ''}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {log.campaign?.name || 'Direct Call'} • {log.direction === 'inbound' ? 'Incoming' : 'Outgoing'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">
                        {log.duration ? formatDuration(log.duration) : 'No connection'}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                        {format(new Date(log.created_at || log.createdAt), 'MMM dd, h:mm:ss a')}
                      </div>
                    </div>
                  </div>
                ))}
                {callLogs.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No recent traffic detected.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CallAnalytics;
