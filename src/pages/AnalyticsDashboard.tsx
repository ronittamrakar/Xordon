import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { analyticsApi } from '@/services/analyticsApi';

// Import Tab Components
import OverviewTab from './analytics-tabs/OverviewTab';
import DashboardsTab from './analytics-tabs/DashboardsTab';
import EventsTab from './analytics-tabs/EventsTab';
import FunnelTab from './analytics-tabs/FunnelTab';
import CohortTab from './analytics-tabs/CohortTab';

const AnalyticsDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    name: '',
    description: '',
    is_shared: false,
  });

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Custom dashboards and advanced analytics</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Dashboard
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dashboards">My Dashboards</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="funnel">Funnel Analysis</TabsTrigger>
          <TabsTrigger value="cohort">Cohort Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="dashboards" className="mt-4">
          <DashboardsTab onCreate={() => setIsCreateOpen(true)} />
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          <EventsTab />
        </TabsContent>

        <TabsContent value="funnel" className="mt-4">
          <FunnelTab />
        </TabsContent>

        <TabsContent value="cohort" className="mt-4">
          <CohortTab />
        </TabsContent>
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

export default AnalyticsDashboard;
