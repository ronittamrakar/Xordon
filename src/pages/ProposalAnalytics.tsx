import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  FileTextIcon,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Send,
} from 'lucide-react';
import { proposalApi, type Proposal, type ProposalStats } from '@/lib/api';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

const ProposalAnalytics: React.FC = () => {
  const [stats, setStats] = useState<ProposalStats | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [timeframe, setTimeframe] = useState('month');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('all');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, timeframe, selectedTemplate]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [statsResponse, proposalsResponse] = await Promise.all([
        proposalApi.getStats(),
        proposalApi.getProposals({
          start_date: dateRange?.from?.toISOString(),
          end_date: dateRange?.to?.toISOString(),
          template_id: selectedTemplate === 'all' ? undefined : selectedTemplate,
        }),
      ]);
      setStats(statsResponse);
      setProposals(proposalsResponse.items || []);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Prepare data for charts
  const statusDistribution = [
    { name: 'Draft', value: proposals.filter(p => p.status === 'draft').length, color: '#9ca3af' },
    { name: 'Sent', value: proposals.filter(p => p.status === 'sent').length, color: '#3b82f6' },
    { name: 'Viewed', value: proposals.filter(p => p.status === 'viewed').length, color: '#8b5cf6' },
    { name: 'Accepted', value: proposals.filter(p => p.status === 'accepted').length, color: '#22c55e' },
    { name: 'Declined', value: proposals.filter(p => p.status === 'declined').length, color: '#ef4444' },
    { name: 'Expired', value: proposals.filter(p => p.status === 'expired').length, color: '#f59e0b' },
  ];

  const monthlyData = () => {
    const data: any[] = [];
    const start = dateRange?.from || new Date();
    const end = dateRange?.to || new Date();

    for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
      const monthStr = format(d, 'MMM yyyy');
      const monthProposals = proposals.filter(p =>
        format(new Date(p.created_at), 'MMM yyyy') === monthStr
      );

      data.push({
        name: monthStr,
        total: monthProposals.length,
        accepted: monthProposals.filter(p => p.status === 'accepted').length,
        sent: monthProposals.filter(p => p.status === 'sent').length,
        viewed: monthProposals.filter(p => p.status === 'viewed').length,
      });
    }
    return data;
  };

  const templatePerformance = () => {
    const templates = Array.from(new Set(proposals.map(p => p.template_name).filter(Boolean)));
    return templates.map(template => {
      const templateProposals = proposals.filter(p => p.template_name === template);
      const accepted = templateProposals.filter(p => p.status === 'accepted').length;
      const total = templateProposals.length;
      return {
        name: template,
        total,
        accepted,
        conversionRate: total > 0 ? (accepted / total) * 100 : 0,
        revenue: templateProposals.reduce((sum, p) => sum + (p.status === 'accepted' ? p.total_amount : 0), 0),
      };
    }).sort((a, b) => b.conversionRate - a.conversionRate);
  };

  const topClients = () => {
    const clients = Array.from(new Set(proposals.map(p => p.client_name).filter(Boolean)));
    return clients.map(client => {
      const clientProposals = proposals.filter(p => p.client_name === client);
      const accepted = clientProposals.filter(p => p.status === 'accepted').length;
      const totalValue = clientProposals.reduce((sum, p) => sum + p.total_amount, 0);
      const acceptedValue = clientProposals.filter(p => p.status === 'accepted').reduce((sum, p) => sum + p.total_amount, 0);
      return {
        name: client,
        proposals: clientProposals.length,
        accepted,
        totalValue,
        acceptedValue,
        conversionRate: clientProposals.length > 0 ? (accepted / clientProposals.length) * 100 : 0,
      };
    }).sort((a, b) => b.acceptedValue - a.acceptedValue);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight">Proposal Analytics</h1>
          <p className="text-muted-foreground">Detailed insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Report</Button>
          <Button>Generate PDF</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Time Range</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={timeframe === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe('week')}
                >
                  Week
                </Button>
                <Button
                  variant={timeframe === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe('month')}
                >
                  Month
                </Button>
                <Button
                  variant={timeframe === 'quarter' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe('quarter')}
                >
                  Quarter
                </Button>
              </div>
            </div>
            <div>
              <Label>Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="All Templates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Templates</SelectItem>
                  {Array.from(new Set(proposals.map(p => p.template_name).filter(Boolean))).map(template => (
                    <SelectItem key={template} value={template}>{template}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date Range</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="date"
                  value={dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: new Date(e.target.value) }))}
                />
                <Input
                  type="date"
                  value={dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: new Date(e.target.value) }))}
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={loadAnalytics}>Apply Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
              <FileTextIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.acceptance_rate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.accepted} accepted out of {stats.sent} sent
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.total_accepted_value)}</div>
              <p className="text-xs text-muted-foreground">From accepted proposals</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.total_accepted_value / (stats.accepted || 1))}
              </div>
              <p className="text-xs text-muted-foreground">Average accepted proposal value</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Breakdown of proposal statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Timeline Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
                <CardDescription>Proposals over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="accepted" stackId="1" stroke="#22c55e" fill="#22c55e" />
                    <Area type="monotone" dataKey="sent" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                    <Area type="monotone" dataKey="viewed" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Proposal journey from creation to acceptance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">{proposals.length}</div>
                  <div className="text-sm text-gray-600">Created</div>
                  <Clock className="h-8 w-8 mx-auto mt-2 text-gray-400" />
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold">{proposals.filter(p => p.status !== 'draft').length}</div>
                  <div className="text-sm text-blue-600">Sent</div>
                  <Send className="h-8 w-8 mx-auto mt-2 text-blue-400" />
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold">{proposals.filter(p => p.status === 'viewed').length}</div>
                  <div className="text-sm text-purple-600">Viewed</div>
                  <Eye className="h-8 w-8 mx-auto mt-2 text-purple-400" />
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold">{proposals.filter(p => p.status === 'accepted').length}</div>
                  <div className="text-sm text-green-600">Accepted</div>
                  <CheckCircle className="h-8 w-8 mx-auto mt-2 text-green-400" />
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold">{proposals.filter(p => p.status === 'declined').length}</div>
                  <div className="text-sm text-red-600">Declined</div>
                  <XCircle className="h-8 w-8 mx-auto mt-2 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue from accepted proposals</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          {/* Template Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Template Performance</CardTitle>
              <CardDescription>Which templates convert best</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templatePerformance().map((template, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-semibold">{template.name}</div>
                      <div className="text-sm text-gray-600">
                        {template.total} proposals • {template.accepted} accepted
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{template.conversionRate.toFixed(1)}% conversion</div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(template.revenue)} revenue
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          {/* Top Clients */}
          <Card>
            <CardHeader>
              <CardTitle>Top Clients</CardTitle>
              <CardDescription>Best performing clients by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topClients().slice(0, 10).map((client, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-semibold">{client.name}</div>
                      <div className="text-sm text-gray-600">
                        {client.proposals} proposals • {client.accepted} accepted
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{client.conversionRate.toFixed(1)}% conversion</div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(client.acceptedValue)} accepted
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProposalAnalytics;
