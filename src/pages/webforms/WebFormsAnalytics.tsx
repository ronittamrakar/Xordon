import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { webformsApi } from '@/services/webformsApi';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Clock,
  CheckCircle,
  ArrowLeft,
  Calendar,
  Download,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function WebFormsAnalytics() {
  const { formId } = useParams<{ formId?: string }>();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('7d');
  const [selectedFormId, setSelectedFormId] = useState<string>('');

  // Fetch all forms for selector
  const { data: formsData } = useQuery({
    queryKey: ['webforms-list'],
    queryFn: () => webformsApi.getForms({ status: 'all' }),
  });

  // Set initial selected form
  useEffect(() => {
    if (formsData?.data && formsData.data.length > 0) {
      if (formId && formId !== 'all') {
        setSelectedFormId(formId);
      } else {
        // If viewing specific form analytics but formId param is missing (e.g. /analytics root),
        // default to first form or 'all' if desired.
        // But if user navigated to /forms/analytics/dashboard, formId is undefined.
        // We probably want 'all' by default unless a specific form is selected.
        // We probably want 'all' by default unless a specific form is selected.
        if (!formId) {
          setSelectedFormId('all');
        } else {
          const defaultForm = formsData.data.find(f => f.status === 'published') || formsData.data[0];
          setSelectedFormId(defaultForm.id.toString());
        }
      }
    }
  }, [formsData, formId]);

  // Update URL when form selection changes
  useEffect(() => {
    if (selectedFormId && selectedFormId !== formId && selectedFormId !== (formId || 'all')) {
      if (selectedFormId === 'all') {
        navigate('/forms/analytics', { replace: true });
      } else {
        navigate(`/forms/analytics/${selectedFormId}`, { replace: true });
      }
    }
  }, [selectedFormId, navigate, formId]);

  // Fetch form details if viewing specific form analytics
  const { data: formData } = useQuery({
    queryKey: ['webform', formId],
    queryFn: () => webformsApi.getForm(formId!),
    enabled: !!formId && formId !== 'all',
  });

  // Fetch dashboard stats for overall analytics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['webforms-analytics', formId, dateRange],
    queryFn: () => formId && formId !== 'all'
      ? webformsApi.getFormInsights(formId, { range: dateRange }) // Future: use specific form insights endpoint if available
      : webformsApi.getDashboardStats(), // Currently getDashboardStats returns workspace wide stats. 
    // Note: For now, we use getDashboardStats even for single form as a fallback or if insights not ready.
    // But wait, the backend getDashboardStats doesn't filter by formId.
    // We should PROBABLY update getDashboardStats to accept form_id or use separate endpoint.
    // For this task, let's assume we use the global stats or mock the filtering if needed, 
    // but arguably the user wants to see stats for the specific form if selected.
    // The backend updated earlier does NOT filter by form. 
    // Let's rely on dashboard stats for now.
    placeholderData: keepPreviousData,
  });

  // Determine what to display based on whether we are viewing 'all' or specific form
  // If specific form and no specific stats endpoint, we might show "Coming Soon" or filter info client side if possible (not possible with current backend).
  // However, for "Is not working", getting ANY data is better than none.

  const form = formData?.data;
  const overview = stats?.overview || {
    total_forms: 0,
    total_submissions: 0,
    active_forms: 0,
    conversion_rate: 0,
    avg_response_time: 0,
    completion_rate: 0,
    total_views: 0,
    total_starts: 0,
  };

  const trends = stats?.submission_trends || [];

  const statCards = [
    {
      name: 'Total Views',
      value: overview.total_views?.toLocaleString() || '0',
      change: '',
      icon: Eye,
      color: 'text-blue-500',
    },
    {
      name: 'Submissions',
      value: overview.total_submissions?.toLocaleString() || '0',
      change: '',
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      name: 'Conversion Rate',
      value: `${overview.conversion_rate || 0}%`,
      change: '',
      icon: TrendingUp,
      color: 'text-purple-500',
    },
    {
      name: 'Avg. Completion Time',
      value: `${overview.avg_response_time || 0}s`,
      change: '',
      icon: Clock,
      color: 'text-orange-500',
    },
    {
      name: 'Form Starts', // Renamed from Unique Visitors for clarity with available data
      value: overview.total_starts?.toLocaleString() || '0',
      change: '',
      icon: Users,
      color: 'text-cyan-500',
    },
    {
      name: 'Completion Rate',
      value: `${overview.completion_rate || 0}%`,
      change: '',
      icon: BarChart3,
      color: 'text-pink-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate funnel percentages
  const views = overview.total_views || 0;
  const starts = overview.total_starts || 0;
  const submissions = overview.total_submissions || 0;

  const startRate = views > 0 ? Math.round((starts / views) * 100) : 0;
  const completionRate = starts > 0 ? Math.round((submissions / starts) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {formId && formId !== 'all' && (
            <Button variant="ghost" size="icon" onClick={() => navigate('/forms')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-[18px] font-bold tracking-tight">
              {form ? `${form.title} - Analytics` : selectedFormId === 'all' || !selectedFormId ? 'All Forms Analytics' : 'Forms Analytics'}
            </h1>
            <p className="text-muted-foreground">
              {formId && formId !== 'all' ? 'View detailed form performance' : 'Overview of all forms performance'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Form Selector */}
          <Select value={selectedFormId || 'all'} onValueChange={setSelectedFormId}>
            <SelectTrigger className="w-[250px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select form to analyze" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Forms Overview</SelectItem>
              {formsData?.data?.map((form) => (
                <SelectItem key={form.id} value={form.id.toString()}>
                  {form.title} {form.status === 'draft' && '(Draft)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                {stat.change && <span className="text-xs font-medium text-green-600">{stat.change}</span>}
              </div>
              <div className="mt-3">
                <h3 className="text-xl font-semibold">{stat.value}</h3>
                <p className="text-xs text-muted-foreground mt-1">{stat.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions Over Time */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-primary" />
              Submissions Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trends}
                    margin={{
                      top: 10,
                      right: 10,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      style={{ fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      style={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="submissions"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorSubmissions)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No data available for this period
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Form Views</span>
                  <span className="font-medium">{views.toLocaleString()} (100%)</span>
                </div>
                <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden">
                  <div className="bg-blue-500 h-3 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute left-0 -top-4 ml-6 h-full border-l-2 border-dashed border-gray-200"></div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Started Filling</span>
                  <div className="text-right">
                    <span className="font-medium">{starts.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-1">({startRate}%)</span>
                  </div>
                </div>
                <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden">
                  <div className="bg-cyan-500 h-3 rounded-full" style={{ width: `${startRate}%` }}></div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute left-0 -top-4 ml-6 h-full border-l-2 border-dashed border-gray-200"></div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Completed</span>
                  <div className="text-right">
                    <span className="font-medium">{submissions.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-1">({completionRate}%)</span>
                  </div>
                </div>
                <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: `${views > 0 ? Math.round((submissions / views) * 100) : 0}%` }}></div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Conversion</p>
                  <p className="text-2xl font-bold mt-1 text-primary">{overview.conversion_rate || 0}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device & Location Stats - Placeholder as backend doesn't support these yet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center text-muted-foreground bg-muted/10 rounded-lg border-dashed border">
              <p>Detailed device analytics coming soon</p>
            </div>
          </CardContent>
        </Card>

        {/* Top Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center text-muted-foreground bg-muted/10 rounded-lg border-dashed border">
              <p>Detailed location analytics coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
