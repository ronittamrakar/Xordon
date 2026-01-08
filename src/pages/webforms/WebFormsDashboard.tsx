import { useQuery } from '@tanstack/react-query';
import { webformsApi } from '@/services/webformsApi';
import { Link } from 'react-router-dom';
import {
  FileTextIcon,
  Inbox,
  Users,
  TrendingUp,
  Eye,
  Plus,
  Activity,
  BarChart3,
  Award,
  Target,
  Clock,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function WebFormsDashboard() {
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['webforms-dashboard'],
    queryFn: () => webformsApi.getDashboardStats(),
    refetchInterval: 30000,
  });

  const { data: recentSubmissions } = useQuery({
    queryKey: ['webforms-recent-submissions'],
    queryFn: async () => {
      const forms = await webformsApi.getForms({ status: 'published' });
      if (forms?.data?.length > 0) {
        const firstForm = forms.data[0];
        return webformsApi.getSubmissions(firstForm.id, { limit: '5' });
      }
      return { data: [] };
    },
  });

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Web Forms Dashboard</h1>
            <p className="text-muted-foreground">Manage your forms and view analytics</p>
          </div>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <div className="bg-destructive/10 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-destructive mb-2">Unable to Load Dashboard</h3>
                <p className="text-muted-foreground mb-4">
                  {(error as Error)?.message || 'Failed to connect to the server. Please check your connection.'}
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => refetch()} variant="destructive">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/forms/forms">View Forms</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const dashboardData = stats?.overview || {
    total_forms: 0,
    total_submissions: 0,
    active_forms: 0,
    conversion_rate: 0,
    avg_response_time: 0,
    completion_rate: 0,
  };
  const topForms = stats?.top_forms || [];

  const statCards = [
    {
      name: 'Total Forms',
      value: dashboardData.total_forms || 0,
      icon: FileTextIcon,
      change: '+12%',
      trend: 'up' as const,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      name: 'Total Submissions',
      value: dashboardData.total_submissions || 0,
      icon: Inbox,
      change: '+23%',
      trend: 'up' as const,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100/70 dark:bg-emerald-500/10',
    },
    {
      name: 'Active Forms',
      value: dashboardData.active_forms || 0,
      icon: CheckCircle,
      change: '+5%',
      trend: 'up' as const,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100/70 dark:bg-indigo-500/10',
    },
    {
      name: 'Conversion Rate',
      value: `${dashboardData.conversion_rate || 0}%`,
      icon: TrendingUp,
      change: '+2.4%',
      trend: 'up' as const,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100/70 dark:bg-amber-500/10',
    },
    {
      name: 'Avg. Response Time',
      value: `${dashboardData.avg_response_time || 0}s`,
      icon: Clock,
      change: '-15%',
      trend: 'down' as const,
      color: 'text-sky-600',
      bgColor: 'bg-sky-100/70 dark:bg-sky-500/10',
    },
    {
      name: 'Completion Rate',
      value: `${dashboardData.completion_rate || 0}%`,
      icon: BarChart3,
      change: '+3.1%',
      trend: 'up' as const,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100/70 dark:bg-pink-500/10',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Web Forms Dashboard</h1>
          <p className="text-muted-foreground">Manage your forms and view analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link to="/forms/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.name} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className={`flex items-center text-xs font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-0.5" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                <p className="text-xs text-muted-foreground mt-1">{stat.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Performing Forms */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <Award className="h-4 w-4 mr-2 text-yellow-500" />
            Top Performing Forms
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/forms/forms">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topForms.length > 0 ? (
              topForms.map((form, index) => (
                <div
                  key={form.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${index === 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : index === 1
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                    >
                      {index + 1}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{form.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {form.submission_count || 0} submissions • {form.conversion_rate || 0}% conversion
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/forms/preview/${form.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Target className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-2 text-sm font-medium">No forms yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first form to start tracking performance.
                </p>
                <div className="mt-6">
                  <Button asChild>
                    <Link to="/forms/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Form
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      {recentSubmissions?.data && recentSubmissions.data.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Inbox className="h-4 w-4 mr-2 text-blue-500" />
              Recent Submissions
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/forms/submissions">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSubmissions.data.slice(0, 5).map((submission: any) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Inbox className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Submission #{submission.id}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(submission.created_at || submission.submitted_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/forms/submissions">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <Link to="/forms/new">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Create Form</p>
                    <p className="text-xs text-muted-foreground">Build a new form</p>
                  </div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <Link to="/forms/forms">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <FileTextIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">View Forms</p>
                    <p className="text-xs text-muted-foreground">Manage all forms</p>
                  </div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <Link to="/forms/submissions">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Inbox className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Submissions</p>
                    <p className="text-xs text-muted-foreground">View responses</p>
                  </div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <Link to="/forms/analytics">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Analytics</p>
                    <p className="text-xs text-muted-foreground">View insights</p>
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

