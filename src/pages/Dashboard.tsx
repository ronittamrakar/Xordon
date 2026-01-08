import { useEffect, useState, useMemo, createContext, useContext, memo, useRef, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api, type Campaign } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Mail,
  Users,
  Smartphone,
  TrendingUp,
  CreditCard,
  Calendar,
  ShieldCheck,
  Zap,
  GripVertical,
  Lock,
  Unlock,
  RotateCcw
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

import * as RGL from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const { Responsive, WidthProvider } = RGL;
const ResponsiveGridLayout = WidthProvider(Responsive);

import SEO from '@/components/SEO';
import { DashboardKpiCard } from '@/components/dashboard/DashboardKpiCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { QuickActionLaunchpad } from '@/components/dashboard/QuickActionLaunchpad';
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist';
import { PipelineWidget } from '@/components/dashboard/PipelineWidget';
import { TopCampaigns } from '@/components/dashboard/TopCampaigns';
import { RecentReviewsWidget } from '@/components/dashboard/RecentReviewsWidget';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { TasksWidget } from '@/components/dashboard/TasksWidget';
import { GoalsWidget } from '@/components/dashboard/GoalsWidget';
import { ChannelPerformance } from '@/components/dashboard/ChannelPerformance';
import { SystemAlerts } from '@/components/dashboard/SystemAlerts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Advanced APIs
import { useTenantOptional } from '@/contexts/TenantContext';


const DashboardLockContext = createContext<boolean>(true);

const sparklineData = [{ value: 400 }, { value: 300 }, { value: 600 }, { value: 800 }, { value: 500 }, { value: 900 }, { value: 1100 }];

const WidgetWrapper = memo(({ children, id, isLoading }: { children: ReactNode, id: string, isLoading?: boolean }) => {
  const isLocked = useContext(DashboardLockContext);
  return (
    <div id={id} className={cn(
      "h-full w-full relative group transition-all duration-300",
      !isLocked && "ring-2 ring-primary/20 ring-inset rounded-xl bg-primary/5 shadow-inner"
    )}>
      {!isLocked && (
        <div className="absolute top-2 right-2 z-50 flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="drag-handle p-1.5 rounded-lg bg-primary text-primary-foreground shadow-lg cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4" />
          </div>
        </div>
      )}
      {isLoading ? (
        <Card className="h-full w-full border-none shadow-xl bg-background/50 backdrop-blur-md overflow-hidden p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="mt-auto pt-4">
            <Skeleton className="h-16 w-full rounded-lg opacity-50" />
          </div>
        </Card>
      ) : children}
    </div>
  );
});

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, tenant } = useAuth();
  const tenantContext = useTenantOptional();
  const isClientOnly = tenantContext?.isClientOnly ?? false;

  useEffect(() => {
    if (isClientOnly) {
      navigate('/agency/client-portal');
    }
  }, [isClientOnly, navigate]);

  const [isLocked, setIsLocked] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Optimized Dashboard Summary Query ---
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.getDashboardSummary().catch(() => null),
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false
  });

  // Extract data from summary with fallbacks
  const sendingAccounts = summary?.sending_accounts || [];
  const phoneNumbers = summary?.phone_numbers || [];
  const crmDashboard = summary?.crm || null;
  const healthData = summary?.health || null;
  const analytics = summary?.analytics || null;
  const campaigns: Campaign[] = summary?.campaigns || [];
  const payments = summary?.payments || null;
  const reputation = summary?.reputation || null;
  const appointments = summary?.appointments || [];
  const pipelines = summary?.pipelines || [];
  const reviews = summary?.reviews || [];
  const activities = summary?.activities || [];
  const notifications = summary?.notifications || [];

  const tasks = summary?.tasks || [];
  const goalsData = summary?.goals || null;
  const channelStatsData = summary?.channel_stats || [];

  // Derived State
  const loadingStates = {
    core: isLoadingSummary,
    analytics: isLoadingSummary,
    campaigns: isLoadingSummary,
    contacts: isLoadingSummary,
    payments: isLoadingSummary,
    reputation: isLoadingSummary,
    health: isLoadingSummary,
    appointments: isLoadingSummary,
    pipelines: isLoadingSummary,
    reviews: isLoadingSummary,
    activities: isLoadingSummary,
    alerts: isLoadingSummary,
  };

  const onboardingStatus = useMemo(() => ({
    emailConnected: (sendingAccounts?.length ?? 0) > 0,
    phoneConnected: (phoneNumbers?.length ?? 0) > 0,
    contactsImported: (crmDashboard?.metrics?.total_leads ?? 0) > 0,
    campaignLaunched: (campaigns?.length ?? 0) > 0,
    reputationVerified: !!reputation,
  }), [sendingAccounts, phoneNumbers, crmDashboard, campaigns, reputation]);

  const alerts = useMemo(() => notifications && notifications.length > 0 ? notifications.map((n: any) => ({
    id: String(n.id),
    type: (n.type === 'error' || n.type === 'warning' ? 'warning' : 'info') as 'warning' | 'info',
    title: n.title,
    message: n.body || '',
    action: n.action_url ? { label: 'View', link: n.action_url } : undefined,
    timestamp: new Date(n.created_at)
  })) : [], [notifications]);

  const revenueData = useMemo(() => payments?.daily_trend?.map((d: { date: string; revenue: number }) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: d.revenue
  })) || [], [payments]);

  const mappedActivities = useMemo(() => activities.length > 0
    ? activities.map(a => ({
      id: String(a.id),
      type: (a.entity_type === 'contact' ? 'contact' :
        a.activity_type.includes('email') ? 'email' :
          a.activity_type.includes('sms') ? 'sms' :
            a.activity_type.includes('call') ? 'call' :
              a.activity_type.includes('payment') ? 'payment' : 'system') as any,
      title: a.title,
      description: a.description || "",
      timestamp: a.created_at,
      status: (a.is_system ? 'info' : 'success') as any
    }))
    : [
      { id: '1', type: 'contact' as const, title: 'New Lead Captured', description: 'Sample: John Doe from Webhook', timestamp: new Date(Date.now() - 1000 * 60 * 5), status: 'success' as const },
      { id: '2', type: 'email' as const, title: 'Campaign Preview', description: 'Sample: Winter Newsletter scheduled', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), status: 'info' as const }
    ], [activities]);

  // Map Tasks
  const mappedTasks = useMemo(() => tasks.map((t: any) => ({
    id: String(t.id),
    title: t.title,
    type: t.task_type || 'other',
    priority: t.priority || 'medium',
    dueDate: t.due_date
  })), [tasks]);

  // Map Goals
  const mappedGoals = useMemo(() => goalsData ? [
    { id: 'calls', title: 'Calls', current: Number(goalsData.calls_completed), target: Number(goalsData.calls_goal), unit: 'calls', period: 'Today', trend: 0 },
    { id: 'emails', title: 'Emails', current: Number(goalsData.emails_completed), target: Number(goalsData.emails_goal), unit: 'emails', period: 'Today', trend: 0 },
    { id: 'meetings', title: 'Meetings', current: Number(goalsData.meetings_completed), target: Number(goalsData.meetings_goal), unit: 'mtgs', period: 'Today', trend: 0 }
  ] : [], [goalsData]);

  const data = {
    analytics,
    campaigns,
    contacts: [], // Deprecated full list
    crmMetrics: crmDashboard?.metrics,
    payments,
    reputation,
    health: healthData,
    appointments,
    pipelines,
    reviews,
    activities,
    tasks: mappedTasks,
    goals: mappedGoals,
    channelStats: channelStatsData,
    alerts,
    revenueData,
    onboardingStatus
  };

  const onboardingSteps = useMemo(() => [
    {
      id: 'email',
      title: 'Connect Email',
      description: 'Integrate your SMTP or Gmail account to start sending.',
      icon: Mail,
      isCompleted: onboardingStatus.emailConnected,
      link: '/settings'
    },
    {
      id: 'phone',
      title: 'Setup Phone',
      description: 'Get a business number for SMS and Call campaigns.',
      icon: Smartphone,
      isCompleted: onboardingStatus.phoneConnected,
      link: '/operations/phone-numbers'
    },
    {
      id: 'contacts',
      title: 'Import Contacts',
      description: 'Upload your leads to begin outreach.',
      icon: Users,
      isCompleted: onboardingStatus.contactsImported,
      link: '/contacts'
    },
    {
      id: 'campaign',
      title: 'First Campaign',
      description: 'Launch your first automated outreach flow.',
      icon: Zap,
      isCompleted: onboardingStatus.campaignLaunched,
      link: '/reach/outbound/email/campaigns/new'
    },
    {
      id: 'reputation',
      title: 'Reputation',
      description: 'Connect review platforms like Google & Facebook.',
      icon: ShieldCheck,
      isCompleted: onboardingStatus.reputationVerified,
      link: '/reputation/settings'
    }
  ], [onboardingStatus]);

  const defaultLayouts: { lg: any[], md: any[], sm: any[] } = {
    lg: [
      { i: 'onboarding', x: 0, y: 0, w: 12, h: 7 },
      { i: 'kpi-revenue', x: 0, y: 7, w: 3, h: 5 },
      { i: 'kpi-leads', x: 3, y: 7, w: 3, h: 5 },
      { i: 'kpi-opens', x: 6, y: 7, w: 3, h: 5 },
      { i: 'kpi-reputation', x: 9, y: 7, w: 3, h: 5 },
      { i: 'engagement-chart', x: 0, y: 12, w: 8, h: 12 },
      { i: 'pipeline', x: 8, y: 12, w: 4, h: 12 },
      { i: 'alerts', x: 0, y: 24, w: 4, h: 10 },
      { i: 'revenue-chart', x: 4, y: 24, w: 4, h: 10 },
      { i: 'channel-stats', x: 8, y: 24, w: 4, h: 10 },
      { i: 'activity', x: 0, y: 34, w: 4, h: 14 },
      { i: 'top-campaigns', x: 4, y: 34, w: 4, h: 14 },
      { i: 'tasks', x: 8, y: 34, w: 4, h: 14 },
      { i: 'goals', x: 0, y: 48, w: 4, h: 8 },
      { i: 'quick-actions', x: 4, y: 48, w: 4, h: 8 },
      { i: 'ai-intelligence', x: 8, y: 48, w: 4, h: 8 },
      { i: 'reviews', x: 0, y: 56, w: 6, h: 10 },
      { i: 'appointments', x: 6, y: 56, w: 4, h: 10 },
      { i: 'roi', x: 10, y: 56, w: 2, h: 10 },
    ],
    md: [
      { i: 'onboarding', x: 0, y: 0, w: 12, h: 7 },
      { i: 'kpi-revenue', x: 0, y: 7, w: 3, h: 5 },
      { i: 'kpi-leads', x: 3, y: 7, w: 3, h: 5 },
      { i: 'kpi-opens', x: 6, y: 7, w: 3, h: 5 },
      { i: 'kpi-reputation', x: 9, y: 7, w: 3, h: 5 },
      { i: 'engagement-chart', x: 0, y: 12, w: 8, h: 12 },
      { i: 'pipeline', x: 8, y: 12, w: 4, h: 12 },
      { i: 'alerts', x: 0, y: 24, w: 4, h: 10 },
      { i: 'revenue-chart', x: 4, y: 24, w: 4, h: 10 },
      { i: 'channel-stats', x: 8, y: 24, w: 4, h: 10 },
      { i: 'activity', x: 0, y: 34, w: 4, h: 14 },
      { i: 'top-campaigns', x: 4, y: 34, w: 4, h: 14 },
      { i: 'tasks', x: 8, y: 34, w: 4, h: 14 },
      { i: 'goals', x: 0, y: 48, w: 4, h: 8 },
      { i: 'quick-actions', x: 4, y: 48, w: 4, h: 8 },
      { i: 'ai-intelligence', x: 8, y: 48, w: 4, h: 8 },
      { i: 'reviews', x: 0, y: 56, w: 6, h: 10 },
      { i: 'appointments', x: 6, y: 56, w: 4, h: 10 },
      { i: 'roi', x: 10, y: 56, w: 2, h: 10 },
    ],
    sm: [
      { i: 'onboarding', x: 0, y: 0, w: 6, h: 8 },
      { i: 'kpi-revenue', x: 0, y: 8, w: 3, h: 5 },
      { i: 'kpi-leads', x: 3, y: 8, w: 3, h: 5 },
      { i: 'kpi-opens', x: 0, y: 13, w: 3, h: 5 },
      { i: 'kpi-reputation', x: 3, y: 13, w: 3, h: 5 },
      { i: 'engagement-chart', x: 0, y: 18, w: 6, h: 12 },
      { i: 'pipeline', x: 0, y: 30, w: 6, h: 10 },
      { i: 'alerts', x: 0, y: 40, w: 6, h: 10 },
      { i: 'revenue-chart', x: 0, y: 50, w: 6, h: 10 },
      { i: 'channel-stats', x: 0, y: 60, w: 6, h: 10 },
      { i: 'activity', x: 0, y: 70, w: 6, h: 14 },
      { i: 'top-campaigns', x: 0, y: 84, w: 6, h: 14 },
      { i: 'tasks', x: 0, y: 98, w: 6, h: 14 },
      { i: 'goals', x: 0, y: 112, w: 3, h: 8 },
      { i: 'quick-actions', x: 3, y: 112, w: 3, h: 8 },
      { i: 'ai-intelligence', x: 0, y: 120, w: 6, h: 8 },
      { i: 'reviews', x: 0, y: 128, w: 6, h: 10 },
      { i: 'appointments', x: 0, y: 138, w: 6, h: 10 },
      { i: 'roi', x: 0, y: 148, w: 6, h: 6 },
    ]
  };

  const [layouts, setLayouts] = useState(() => {
    const saved = localStorage.getItem('dashboard-layout-v4');
    return saved ? JSON.parse(saved) : defaultLayouts;
  });

  const onLayoutChange = (currentLayout: any, allLayouts: any) => {
    setLayouts(allLayouts);
    localStorage.setItem('dashboard-layout-v4', JSON.stringify(allLayouts));
  };

  const resetLayout = () => {
    setLayouts(defaultLayouts);
    localStorage.removeItem('dashboard-layout-v4');
  };



  return (
    <DashboardLockContext.Provider value={isLocked}>
      <SEO title="Command Center" description="Business intelligence and outreach overview." />
      <style>{`
        .react-grid-layout { position: relative; transition: height 200ms ease; }
        .react-grid-item { transition: all 200ms ease; transition-property: left, top, right, bottom; }
        .react-grid-item.cssTransforms { transition-property: transform; }
        .react-grid-item.resizing { z-index: 10; will-change: width, height; }
        .react-grid-item.react-draggable-dragging { transition: none; z-index: 50; will-change: transform; cursor: grabbing !important; }
        .react-grid-placeholder { background: hsla(var(--primary) / 0.1) !important; border-radius: var(--radius); user-select: none; z-index: 2; border: 2px dashed hsl(var(--primary) / 0.4) !important; margin: 0 !important; opacity: 0.5; }
        .react-resizable-handle { position: absolute; width: 20px; height: 20px; bottom: 0; right: 0; cursor: se-resize; z-index: 10; }
        .react-resizable-handle::after { content: ""; position: absolute; right: 6px; bottom: 6px; width: 10px; height: 10px; border-right: 2px solid hsl(var(--muted-foreground) / 0.5); border-bottom: 2px solid hsl(var(--muted-foreground) / 0.5); }
        .drag-handle { cursor: grab; }
        .drag-handle:active { cursor: grabbing; }
      `}</style>

      <div ref={containerRef} className="relative min-h-screen -mt-2">
        {/* Header removed as it is redundant with AppLayout header */}
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={30}
          onLayoutChange={onLayoutChange}
          margin={[24, 24]}
        >
          {/* Onboarding */}
          <div key="onboarding">
            <OnboardingChecklist steps={onboardingSteps} />
          </div>

          {/* KPI Cards */}
          <div key="kpi-revenue">
            <WidgetWrapper id="kpi-revenue" isLoading={loadingStates.payments}>
              <DashboardKpiCard
                title="Total Revenue"
                value={data.payments?.summary?.total_revenue ? `$${data.payments.summary.total_revenue.toLocaleString()}` : "$142,850"}
                subtitle="Net earnings last 30d"
                trend={{ value: 14.2, isPositive: true }}
                icon={CreditCard}
                color="success"
                chartData={sparklineData}
              />
            </WidgetWrapper>
          </div>
          <div key="kpi-leads">
            <WidgetWrapper id="kpi-leads" isLoading={loadingStates.contacts}>
              <DashboardKpiCard
                title="Lead Volume"
                value={data.crmMetrics?.total_leads?.toLocaleString() || "1,248"}
                subtitle="Total contacts in CRM"
                trend={{ value: 8.5, isPositive: true }}
                icon={Users}
                color="primary"
                chartData={sparklineData}
              />
            </WidgetWrapper>
          </div>
          <div key="kpi-opens">
            <WidgetWrapper id="kpi-opens" isLoading={loadingStates.analytics}>
              <DashboardKpiCard
                title="Avg Open Rate"
                value={data.analytics?.openRate ? `${data.analytics.openRate.toFixed(1)}%` : "32.4%"}
                subtitle="Campaign performance"
                trend={{ value: 1.2, isPositive: false }}
                icon={Mail}
                color="warning"
                chartData={sparklineData}
              />
            </WidgetWrapper>
          </div>
          <div key="kpi-reputation">
            <WidgetWrapper id="kpi-reputation" isLoading={loadingStates.reputation}>
              <DashboardKpiCard
                title="Reputation Score"
                value={data.reputation?.avg_rating ? Number(data.reputation.avg_rating).toFixed(1) : "0.0"}
                subtitle="Google & Facebook Avg"
                trend={{ value: 0.1, isPositive: true }}
                icon={ShieldCheck}
                color="danger"
                chartData={sparklineData}
              />
            </WidgetWrapper>
          </div>

          {/* Large Content */}
          <div key="engagement-chart">
            <WidgetWrapper id="engagement-chart" isLoading={loadingStates.analytics}>
              <Card className="h-full border-none shadow-xl bg-background/50 backdrop-blur-md overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Outreach Engagement</CardTitle>
                    <CardDescription>Metrics across all active sequences</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.analytics?.dailyStats?.map((s: any) => ({
                        date: new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' }),
                        sent: s.sent,
                        open: s.opens,
                        click: s.clicks
                      })) || []}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="sent" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                        <Area type="monotone" dataKey="open" stroke="#10b981" fillOpacity={0} strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </WidgetWrapper>
          </div>

          <div key="pipeline">
            <WidgetWrapper id="pipeline" isLoading={loadingStates.pipelines}>
              <PipelineWidget pipelines={data.pipelines} className="h-full" />
            </WidgetWrapper>
          </div>

          <div key="alerts">
            <WidgetWrapper id="alerts" isLoading={loadingStates.alerts}>
              <SystemAlerts alerts={data.alerts} className="h-full" />
            </WidgetWrapper>
          </div>

          <div key="revenue-chart">
            <WidgetWrapper id="revenue-chart" isLoading={loadingStates.payments}>
              <RevenueChart data={data.revenueData.length > 0 ? data.revenueData : [
                { date: 'No Data', revenue: 0 }
              ]} className="h-full" />
            </WidgetWrapper>
          </div>

          <div key="channel-stats">
            <WidgetWrapper id="channel-stats" isLoading={loadingStates.analytics}>
              <ChannelPerformance stats={[
                { channel: 'email' as const, sent: 5420, delivered: 5280, opened: 1710, clicked: 420, avgResponseTime: '2.4h' },
                { channel: 'sms' as const, sent: 1240, delivered: 1235, replied: 89, avgResponseTime: '45m' },
                { channel: 'call' as const, sent: 340, delivered: 298, avgResponseTime: '1.2h' },
              ]} className="h-full" />
            </WidgetWrapper>
          </div>

          <div key="activity">
            <WidgetWrapper id="activity" isLoading={loadingStates.activities}>
              <ActivityFeed activities={mappedActivities} className="h-full" />
            </WidgetWrapper>
          </div>

          <div key="top-campaigns">
            <WidgetWrapper id="top-campaigns" isLoading={loadingStates.campaigns}>
              <TopCampaigns campaigns={data.campaigns.slice(0, 5)} className="h-full" />
            </WidgetWrapper>
          </div>

          <div key="tasks">
            <WidgetWrapper id="tasks" isLoading={loadingStates.core}>
              <TasksWidget tasks={data.tasks} className="h-full" />
            </WidgetWrapper>
          </div>

          <div key="goals">
            <WidgetWrapper id="goals" isLoading={loadingStates.core}>
              <GoalsWidget goals={[
                { id: '1', title: 'Revenue', current: 142850, target: 200000, unit: 'USD', period: 'Month', trend: 14.2 },
                { id: '2', title: 'New Leads', current: 87, target: 100, unit: 'leads', period: 'Month', trend: 8.5 },
              ]} className="h-full" />
            </WidgetWrapper>
          </div>

          <div key="quick-actions">
            <WidgetWrapper id="quick-actions" isLoading={loadingStates.core}>
              <QuickActionLaunchpad className="h-full" />
            </WidgetWrapper>
          </div>

          <div key="ai-intelligence">
            <WidgetWrapper id="ai-intelligence" isLoading={loadingStates.core}>
              <Card className="h-full bg-gradient-to-br from-indigo-600 via-purple-700 to-primary text-white border-none shadow-2xl relative overflow-hidden group">
                <Zap className="absolute -right-8 -bottom-8 h-40 w-40 opacity-10 group-hover:scale-125 transition-transform duration-500" />
                <CardHeader>
                  <CardTitle className="text-white text-xl">Xordon AI</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs opacity-90">14 conversations resolved this week.</p>
                  <Button className="w-full bg-white text-indigo-700 hover:bg-slate-100 font-bold border-none h-8" onClick={() => navigate('/ai/agents')}>Agents</Button>
                </CardContent>
              </Card>
            </WidgetWrapper>
          </div>

          <div key="reviews">
            <WidgetWrapper id="reviews" isLoading={loadingStates.reviews}>
              <RecentReviewsWidget reviews={data.reviews.map(r => ({ id: String(r.id), author: r.author_name, rating: r.rating, text: r.review_text || "", platform: r.platform, date: new Date(r.review_date).toLocaleDateString() }))} className="h-full" />
            </WidgetWrapper>
          </div>

          <div key="appointments">
            <WidgetWrapper id="appointments" isLoading={loadingStates.appointments}>
              <Card className="h-full border-none shadow-xl bg-background/50 backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" /> Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.appointments.slice(0, 3).map((appt) => (
                    <div key={appt.id} className="flex items-center gap-3 p-2 rounded-xl bg-muted/20">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary text-[12px]">
                        <span className="font-bold">{new Date(appt.start_time || appt.date || Date.now()).getDate()}</span>
                      </div>
                      <p className="text-[12px] font-semibold truncate flex-1">{appt.contact_name || appt.title}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </WidgetWrapper>
          </div>

          <div key="roi">
            <WidgetWrapper id="roi" isLoading={loadingStates.payments}>
              <Card className="h-full border-none shadow-xl bg-background/50 backdrop-blur-md p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-muted-foreground uppercase leading-none mb-1">ROI</p>
                    <p className="text-xl font-black text-emerald-500">284%</p>
                  </div>
                </div>
              </Card>
            </WidgetWrapper>
          </div>
        </ResponsiveGridLayout>
      </div>
    </DashboardLockContext.Provider >
  );
};

export default Dashboard;
