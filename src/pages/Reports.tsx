import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart as BarChartIcon, LineChart, PieChart, TrendingUp, Plus, Search, Filter, Download, Calendar, Users, DollarSign, Mail, Phone } from 'lucide-react';
import { api } from '@/lib/api';

import { Link } from 'react-router-dom';

interface Report {
  id: number;
  name: string;
  description: string;
  report_type: string;
  chart_type: string;
  is_scheduled: boolean;
  last_run_at: string;
  created_at: string;
}

interface Dashboard {
  id: number;
  name: string;
  description: string;
  is_default: boolean;
  created_at: string;
}

interface Goal {
  id: number;
  name: string;
  metric_type: string;
  target_value: number;
  period_type: string;
  start_date: string;
  end_date: string;
}

interface OverviewStats {
  monthly_revenue: number;
  total_contacts: number;
  weekly_appointments: number;
  emails_sent: number;
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState('overview');
  const [reports, setReports] = useState<Report[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reportsRes, dashboardsRes, goalsRes, statsRes] = await Promise.all([
        api.get('/reports'),
        api.get('/dashboards'),
        api.get('/goals'),
        api.get('/reports/overview-stats')
      ]);

      setReports((reportsRes.data as any)?.items || []);
      setDashboards((dashboardsRes.data as any)?.items || []);
      setGoals((goalsRes.data as any)?.items || []);
      setStats(statsRes.data as any);
    } catch (error) {
      console.error('Failed to load reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Phone className="h-4 w-4" />;
      case 'calls': return <Phone className="h-4 w-4" />;
      case 'revenue': return <DollarSign className="h-4 w-4" />;
      case 'contacts': return <Users className="h-4 w-4" />;
      case 'appointments': return <Calendar className="h-4 w-4" />;
      default: return <BarChartIcon className="h-4 w-4" />;
    }
  };

  const getChartTypeIcon = (type: string) => {
    switch (type) {
      case 'line': return <LineChart className="h-4 w-4" />;
      case 'bar': return <BarChartIcon className="h-4 w-4" />;
      case 'pie': return <PieChart className="h-4 w-4" />;
      default: return <BarChartIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (

      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-gray-600">Create custom reports, dashboards, and track business metrics</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.monthly_revenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_contacts}</div>
                  <p className="text-xs text-muted-foreground">In database</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Weekly Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.weekly_appointments}</div>
                  <p className="text-xs text-muted-foreground">This week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.emails_sent}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Last Run</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.slice(0, 5).map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getReportTypeIcon(report.report_type)}
                            <span className="capitalize">{report.report_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {report.last_run_at
                            ? new Date(report.last_run_at).toLocaleDateString()
                            : 'Never'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {goals.slice(0, 5).map((goal) => (
                    <div key={goal.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{goal.name}</div>
                        <div className="text-sm text-gray-500 capitalize">{goal.metric_type}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{goal.target_value}</div>
                        <div className="text-sm text-gray-500 capitalize">{goal.period_type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>Track your email, SMS, calls, and form performance</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link to="/reports/analytics">Open Analytics</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Data</CardTitle>
                <CardDescription>Explore raw metrics across modules</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <Link to="/reports/all-data">View All Data</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="calls">Calls</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="contacts">Contacts</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getReportTypeIcon(report.report_type)}
                      {getChartTypeIcon(report.chart_type)}
                    </div>
                    {report.is_scheduled && (
                      <Badge variant="outline">Scheduled</Badge>
                    )}
                  </div>
                  <CardTitle>{report.name}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Type:</span>
                      <span className="font-medium capitalize">{report.report_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Chart:</span>
                      <span className="font-medium capitalize">{report.chart_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Last Run:</span>
                      <span className="font-medium">
                        {report.last_run_at
                          ? new Date(report.last_run_at).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">Run</Button>
                    <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                    <Button variant="outline" size="sm" className="flex-1">Export</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dashboards" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search dashboards..."
                  className="pl-8 w-64"
                />
              </div>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Dashboard
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboards.map((dashboard) => (
              <Card key={dashboard.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BarChartIcon className="h-4 w-4" />
                      {dashboard.is_default && (
                        <Badge variant="outline">Default</Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle>{dashboard.name}</CardTitle>
                  <CardDescription>{dashboard.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Created:</span>
                      <span className="font-medium">
                        {new Date(dashboard.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">View</Button>
                    <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                    <Button variant="outline" size="sm" className="flex-1">Duplicate</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search goals..."
                  className="pl-8 w-64"
                />
              </div>
              <Select>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Set Goal
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Goal</TableHead>
                    <TableHead>Metric</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goals.map((goal) => (
                    <TableRow key={goal.id}>
                      <TableCell className="font-medium">{goal.name}</TableCell>
                      <TableCell className="capitalize">{goal.metric_type}</TableCell>
                      <TableCell>{goal.target_value}</TableCell>
                      <TableCell className="capitalize">{goal.period_type}</TableCell>
                      <TableCell>{new Date(goal.end_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                          </div>
                          <span className="text-sm">65%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
