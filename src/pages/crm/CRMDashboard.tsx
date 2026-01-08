import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Phone,
  Mail,
  Calendar,
  BarChart3,
  Target,
  Building2,
  ArrowRight,
  LayoutPanelLeft,
  Contact as ContactIcon,
  CheckCircle2,
  FileTextIcon,
  PieChart,
  Settings,
  CheckSquare,
  BookOpen,
  LineChart
} from 'lucide-react';
import { api } from '@/lib/api';
import { CRMDashboard as CRMDashboardType, ActivityType, LeadStage, LEAD_STAGES } from '@/types/crm';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const CRMDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<CRMDashboardType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await api.crm.getDashboard();

        // Defensive transformation with null checks
        const transformed: CRMDashboardType = {
          metrics: {
            totalLeads: data?.metrics?.total_leads || 0,
            newLeads: data?.metrics?.new_leads || 0,
            qualifiedLeads: data?.metrics?.qualified_leads || 0,
            wonDeals: data?.metrics?.won_deals || 0,
            lostDeals: data?.metrics?.lost_deals || 0,
            totalValue: data?.metrics?.total_value ? parseFloat(data.metrics.total_value) : 0,
            avgLeadScore: data?.metrics?.avg_lead_score ? parseFloat(data.metrics.avg_lead_score) : 0,
            totalActivities: data?.metrics?.total_activities || 0,
            activitiesThisWeek: data?.metrics?.activities_this_week || 0,
          },
          recentActivities: (data?.recentActivities || []).map((a) => ({
            id: a.id,
            activityType: a.activity_type as ActivityType,
            activityTitle: a.activity_title,
            activityDate: a.activity_date,
            contactName: `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Unknown',
            contactEmail: a.email || '',
            leadStage: a.lead_stage as LeadStage,
          })),
          pipelineData: (data?.pipelineData || []).map((p) => ({
            leadStage: p.lead_stage as LeadStage,
            count: p.count,
            totalValue: p.total_value ? parseFloat(p.total_value) : 0,
          })),
        };
        setDashboardData(transformed);
      } catch (error) {
        console.error('Failed to load CRM dashboard:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const getStageColor = (stage: LeadStage) => {
    const stageConfig = LEAD_STAGES.find((s) => s.value === stage);
    return stageConfig?.color || '#6c757d';
  };

  const getStageLabel = (stage: LeadStage) => {
    const stageConfig = LEAD_STAGES.find((s) => s.value === stage);
    return stageConfig?.label || stage;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Unable to load dashboard data</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const { metrics, recentActivities, pipelineData } = dashboardData;

  const quickLinks = [
    { label: 'Pipeline', icon: LayoutPanelLeft, path: '/crm/deals', color: 'bg-blue-100 text-blue-700' },
    { label: 'Forecast', icon: LineChart, path: '/crm/forecast', color: 'bg-indigo-100 text-indigo-700' },
    { label: 'Playbooks', icon: BookOpen, path: '/crm/playbooks', color: 'bg-amber-100 text-amber-700' },
    { label: 'Analytics', icon: BarChart3, path: '/crm/analytics', color: 'bg-purple-100 text-purple-700' },
    { label: 'Goals', icon: Target, path: '/crm/goals', color: 'bg-orange-100 text-orange-700' },
    { label: 'Tasks', icon: CheckSquare, path: '/crm/tasks', color: 'bg-red-100 text-red-700' },
    { label: 'Settings', icon: Settings, path: '/settings#crm', color: 'bg-gray-100 text-gray-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM Dashboard</h1>
          <p className="text-muted-foreground">Overview of your sales performance and activities</p>
        </div>
        <Button onClick={() => navigate('/crm/deals')}>
          <ArrowRight className="h-4 w-4 mr-2" />
          View Full Pipeline
        </Button>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {quickLinks.map((link) => (
          <Card
            key={link.label}
            className="hover:shadow-md transition-all cursor-pointer border-transparent hover:border-primary/20"
            onClick={() => navigate(link.path)}
          >
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <div className={cn("p-2 rounded-lg", link.color)}>
                <link.icon className="h-5 w-5" />
              </div>
              <span className="font-medium text-sm">{link.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all stages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.newLeads}</div>
            <p className="text-xs text-muted-foreground">{metrics.totalLeads} total leads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won Deals</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.wonDeals}</div>
            <p className="text-xs text-muted-foreground">From {metrics.totalLeads} opportunities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Lead Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgLeadScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Across all active leads</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Pipeline</CardTitle>
            <CardDescription>Opportunity distribution by stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pipelineData.length > 0 ? pipelineData.map((item) => (
                <div key={item.leadStage} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{getStageLabel(item.leadStage)}</span>
                    <span className="text-muted-foreground">
                      {item.count} leads • ${item.totalValue.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={metrics.totalLeads > 0 ? (item.count / metrics.totalLeads) * 100 : 0}
                    className="h-2"
                    style={{ backgroundColor: `${getStageColor(item.leadStage)}20` }}
                    // @ts-ignore
                    indicatorStyle={{ backgroundColor: getStageColor(item.leadStage) }}
                  />
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">No pipeline data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest interactions with your leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={cn("p-2 rounded-full", activity.activityType === 'call' ? 'bg-blue-100 text-blue-600' :
                    activity.activityType === 'email' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-gray-100 text-gray-600')}>
                    {activity.activityType === 'call' ? <Phone className="h-4 w-4" /> :
                      activity.activityType === 'email' ? <Mail className="h-4 w-4" /> :
                        <FileTextIcon className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.activityTitle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground truncate">{activity.contactName}</p>
                      <span className="text-xs text-muted-foreground opacity-50">•</span>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(activity.activityDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[12px] uppercase">
                    {getStageLabel(activity.leadStage)}
                  </Badge>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">No recent activities</div>
              )}
            </div>
            <Button variant="ghost" className="w-full mt-4" onClick={() => navigate('/crm/deals?view=list')}>
              View All Leads
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CRMDashboardPage;

