import React, { useState, Suspense, lazy } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Plus, Trash2, Edit, Share2, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { analyticsApi } from '@/services/analyticsApi';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy tab components
const OverviewTab = lazy(() => import('./analytics-tabs/OverviewTab'));
const DashboardsTab = lazy(() => import('./analytics-tabs/DashboardsTab'));
const EventsTab = lazy(() => import('./analytics-tabs/EventsTab'));
const FunnelTab = lazy(() => import('./analytics-tabs/FunnelTab'));
const CohortTab = lazy(() => import('./analytics-tabs/CohortTab'));

const OptimizedAnalyticsDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    name: '',
    description: '',
    is_shared: false,
  });

  // Only load essential data for the main dashboard
  const { data: dashboards = [] } = useQuery({
    queryKey: ['analytics-dashboards'],
    queryFn: analyticsApi.listDashboards,
    staleTime: 300000, // 5 minutes
  });

  // Track active tab to optimize memory
  const [activeTab, setActiveTab] = useState('overview');

  const createMutation = useMutation({
    mutationFn: analyticsApi.createDashboard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics-dashboards'] });
      setIsCreateOpen(false);
      setDashboardData({ name: '', description: '', is_shared: false });
      toast.success('Dashboard created');
    },
  });

  const handleCreate = () => {
    if (!dashboardData.name) {
      toast.error('Please enter a dashboard name');
      return;
    }
    createMutation.mutate({
      ...dashboardData,
      layout: {},
      widgets: [],
    });
  };

  // Memory usage indicator
  const MemoryIndicator = () => {
    if (typeof window !== 'undefined' && performance.memory) {
      const memory = performance.memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
      const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
      const percent = Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100);

      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Memory: {usedMB}MB / {totalMB}MB ({percent}%)</span>
          {percent > 80 && <span className="text-red-500 font-bold">HIGH</span>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Custom dashboards and advanced analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <MemoryIndicator />
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Dashboard
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dashboards">My Dashboards</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="funnel">Funnel Analysis</TabsTrigger>
          <TabsTrigger value="cohort">Cohort Analysis</TabsTrigger>
        </TabsList>

        {/* Only load tab content when tab is active */}
        <Suspense fallback={
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        }>
          <TabsContent value="overview" className="mt-4">
            {activeTab === 'overview' && <OverviewTab />}
          </TabsContent>

          <TabsContent value="dashboards" className="mt-4">
            {activeTab === 'dashboards' && <DashboardsTab dashboards={dashboards} />}
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            {activeTab === 'events' && <EventsTab />}
          </TabsContent>

          <TabsContent value="funnel" className="mt-4">
            {activeTab === 'funnel' && <FunnelTab />}
          </TabsContent>

          <TabsContent value="cohort" className="mt-4">
            {activeTab === 'cohort' && <CohortTab />}
          </TabsContent>
        </Suspense>
      </Tabs>

      {/* Create Dashboard Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Dashboard</DialogTitle>
            <DialogDescription>Create a custom analytics dashboard</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Dashboard Name *</Label>
              <Input
                value={dashboardData.name}
                onChange={(e) => setDashboardData({ ...dashboardData, name: e.target.value })}
                placeholder="e.g., Sales Performance"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={dashboardData.description}
                onChange={(e) => setDashboardData({ ...dashboardData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="shared"
                checked={dashboardData.is_shared}
                onChange={(e) => setDashboardData({ ...dashboardData, is_shared: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="shared">Share with team</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              Create Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OptimizedAnalyticsDashboard;