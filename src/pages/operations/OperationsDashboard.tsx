import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Users, Phone, MapPin, Briefcase, ArrowUpRight, Download } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';


const OperationsDashboard = () => {
  const [dateRange, setDateRange] = useState('7-days');

  // Mock data - replace with actual API calls
  const overviewMetrics = {
    revenue: { value: 'Rs 0', change: 0, trend: 'neutral' },
    allContacts: { value: 0, change: 0, trend: 'neutral' },
    newContacts: { value: 0, change: 0, trend: 'neutral' },
    totalCalls: { value: 0, change: 0, trend: 'neutral' },
    averageCallDuration: { value: '0 min', change: 0, trend: 'neutral' },
    jobs: { value: 0, change: 0, trend: 'neutral' }
  };

  const revenueData = [
    { date: 'Mon', revenue: 0 },
    { date: 'Tue', revenue: 0 },
    { date: 'Wed', revenue: 0 },
    { date: 'Thu', revenue: 0 },
    { date: 'Fri', revenue: 0 },
    { date: 'Sat', revenue: 0 },
    { date: 'Sun', revenue: 0 }
  ];

  const leadSourceData = [
    { name: 'Website', value: 0 },
    { name: 'Referral', value: 0 },
    { name: 'Social Media', value: 0 },
    { name: 'Direct', value: 0 }
  ];

  const callFlowData = {
    incomingCalls: 0,
    outgoingCalls: 0,
    missedCalls: 0
  };

  const leadConversionData = {
    leadConversionRate: 0,
    averageLeadAge: '0 days',
    qualityConversionRate: 0,
    overallConversionRate: 0
  };

  const conversionBySourceData = [
    { source: 'Website', conversions: 0 },
    { source: 'Referral', conversions: 0 },
    { source: 'Social Media', conversions: 0 },
    { source: 'Direct', conversions: 0 }
  ];

  const jobsData = {
    totalJobs: 0,
    completedJobs: 0,
    pendingJobs: 0,
    revenue: 0
  };

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Operations Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive analytics and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="7-days">Last 7 days</SelectItem>
                <SelectItem value="30-days">Last 30 days</SelectItem>
                <SelectItem value="90-days">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Overview Metrics */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{overviewMetrics.revenue.value}</div>
                  {getTrendIcon(overviewMetrics.revenue.trend)}
                </div>
                {overviewMetrics.revenue.change !== 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {overviewMetrics.revenue.change > 0 ? '+' : ''}{overviewMetrics.revenue.change}% from last period
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  All contacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{overviewMetrics.allContacts.value}</div>
                  {getTrendIcon(overviewMetrics.allContacts.trend)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  New contacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{overviewMetrics.newContacts.value}</div>
                  {getTrendIcon(overviewMetrics.newContacts.trend)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total calls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{overviewMetrics.totalCalls.value}</div>
                  {getTrendIcon(overviewMetrics.totalCalls.trend)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average call duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{overviewMetrics.averageCallDuration.value}</div>
                  {getTrendIcon(overviewMetrics.averageCallDuration.trend)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{overviewMetrics.jobs.value}</div>
                  {getTrendIcon(overviewMetrics.jobs.trend)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>
              Revenue trend for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revenueData.every(d => d.revenue === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Start your first project to track your revenue
                </p>
                <Button className="mt-4">
                  Add first job
                </Button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue heatmap</CardTitle>
              <CardDescription>
                Geographic distribution of revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[300px] bg-muted/20 rounded-lg">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Map visualization will appear here
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Revenue data by location
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call Flow */}
          <Card>
            <CardHeader>
              <CardTitle>Call flow</CardTitle>
              <CardDescription>
                Call activity breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">Incoming calls</p>
                      <p className="text-sm text-muted-foreground">Received calls</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{callFlowData.incomingCalls}</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">Outgoing calls</p>
                      <p className="text-sm text-muted-foreground">Dialed calls</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{callFlowData.outgoingCalls}</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium">Missed calls</p>
                      <p className="text-sm text-muted-foreground">Unanswered calls</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{callFlowData.missedCalls}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Canceled callbacks */}
        <Card>
          <CardHeader>
            <CardTitle>Canceled callbacks</CardTitle>
            <CardDescription>
              Track canceled callback appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Phone className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Get back to your customers by creating a callback
              </p>
              <Button className="mt-4" variant="outline">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Learn more
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lead Conversion */}
        <Card>
          <CardHeader>
            <CardTitle>Lead conversion</CardTitle>
            <CardDescription>
              Track your lead conversion metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-muted/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Lead conversion rate</p>
                <p className="text-2xl font-bold">{leadConversionData.leadConversionRate}%</p>
              </div>
              <div className="p-4 bg-muted/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Average lead age</p>
                <p className="text-2xl font-bold">{leadConversionData.averageLeadAge}</p>
              </div>
              <div className="p-4 bg-muted/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Quality conversion rate</p>
                <p className="text-2xl font-bold">{leadConversionData.qualityConversionRate}%</p>
              </div>
              <div className="p-4 bg-muted/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Overall conversion rate</p>
                <p className="text-2xl font-bold">{leadConversionData.overallConversionRate}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-4">Conversion by source</h3>
                {conversionBySourceData.every(d => d.conversions === 0) ? (
                  <div className="flex items-center justify-center h-[200px] bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground text-sm">No conversion data yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={conversionBySourceData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="source" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="conversions" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium mb-4">Lead sources</h3>
                {leadSourceData.every(d => d.value === 0) ? (
                  <div className="flex items-center justify-center h-[200px] bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground text-sm">No lead source data yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={leadSourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {leadSourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trial subscription notice */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  See how you compare to other pros in your area
                </h3>
                <p className="text-sm text-muted-foreground">
                  Upgrade to unlock industry benchmarking and advanced analytics
                </p>
              </div>
              <Button>Upgrade now</Button>
            </div>
          </CardContent>
        </Card>

        {/* Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Jobs</CardTitle>
            <CardDescription>
              Job performance and revenue tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Total jobs</span>
                    </div>
                    <span className="text-2xl font-bold">{jobsData.totalJobs}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-green-500" />
                      <span className="font-medium">Completed jobs</span>
                    </div>
                    <span className="text-2xl font-bold">{jobsData.completedJobs}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-orange-500" />
                      <span className="font-medium">Pending jobs</span>
                    </div>
                    <span className="text-2xl font-bold">{jobsData.pendingJobs}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg text-white">
                  <p className="text-sm opacity-90 mb-2">Total revenue from jobs</p>
                  <p className="text-2xl font-bold mb-4">Rs {jobsData.revenue}</p>
                  <Button variant="secondary" size="sm">
                    View all jobs
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>

            {jobsData.totalJobs === 0 && (
              <div className="mt-6 flex flex-col items-center justify-center py-8 text-center border-t">
                <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-2">
                  Track your first job and start earning
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first job to see detailed analytics
                </p>
                <Button>Create first job</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default OperationsDashboard;
