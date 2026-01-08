import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { analyticsApi } from '@/services/analyticsApi';
import { format } from 'date-fns';

const OverviewTab: React.FC = () => {
  const { data: events = [] } = useQuery({
    queryKey: ['analytics-events'],
    queryFn: () => analyticsApi.getEvents({ limit: 100 }),
    staleTime: 300000, // 5 minutes
  });

  const { data: funnelData = [] } = useQuery({
    queryKey: ['funnel-analytics'],
    queryFn: () => analyticsApi.getFunnelAnalytics({
      start_date: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
    }),
    staleTime: 300000,
  });

  const { data: cohortData = [] } = useQuery({
    queryKey: ['cohort-analysis'],
    queryFn: () => analyticsApi.getCohortAnalysis({
      cohort_type: 'signup',
      start_date: format(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
    }),
    staleTime: 300000,
  });

  const getEventTypeStats = () => {
    const stats: Record<string, number> = {};
    events.forEach((event: any) => {
      stats[event.event_type] = (stats[event.event_type] || 0) + 1;
    });
    return stats;
  };

  const eventStats = getEventTypeStats();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Types</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(eventStats).length}</div>
            <p className="text-xs text-muted-foreground">Unique types tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funnel Steps</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funnelData.length}</div>
            <p className="text-xs text-muted-foreground">Active funnel steps</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cohorts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cohortData.length}</div>
            <p className="text-xs text-muted-foreground">Cohort periods</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Distribution</CardTitle>
          <CardDescription>Events by type</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(eventStats).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No events tracked yet
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(eventStats).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{type}</span>
                  <Badge>{count}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default OverviewTab;