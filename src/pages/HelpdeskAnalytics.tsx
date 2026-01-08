
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb } from '@/components/Breadcrumb';
import { api } from '@/lib/api';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Star,
  Download,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface ReportingMetrics {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  slaCompliance: number;
  avgCSAT: number;
  ticketsByPriority: { priority: string; count: number }[];
  ticketsByStatus: { status: string; count: number }[];
  ticketsByChannel: { channel: string; count: number }[];
  ticketsByTeam: { team: string; count: number }[];
  agentPerformance: { agent: string; tickets: number; avgTime: number; csat: number }[];
  dailyVolume: { date: string; created: number; closed: number }[];
  topTags: { tag: string; count: number }[];
}

const HelpdeskAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('30');
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  const { data: metrics, isLoading } = useQuery<ReportingMetrics>({
    queryKey: ['helpdesk-metrics', dateRange],
    queryFn: async () => {
      const response = await api.get(`/helpdesk/reports/metrics?days=${dateRange}`);
      return response.data as ReportingMetrics;
    },
  });

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${baseUrl}/helpdesk/reports/export?days=${dateRange}&format=${exportFormat}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `helpdesk-report-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Helpdesk', href: '/helpdesk' },
          { label: 'Reports & Analytics' },
        ]}
      />

      <div className="space-y-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-bold tracking-tight text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive helpdesk performance insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={exportFormat} onValueChange={(v: any) => setExportFormat(v)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading metrics...</div>
        ) : (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.totalTickets || 0}</div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3" />
                    <span>Last {dateRange} days</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg Response Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics?.avgResponseTime ? `${Math.round(metrics.avgResponseTime / 60)} h` : '0h'}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>Time to first response</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    SLA Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics?.slaCompliance ? `${Math.round(metrics.slaCompliance)}% ` : '0%'}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Target className="w-3 h-3" />
                    <span>Tickets meeting SLA</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg CSAT Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics?.avgCSAT ? metrics.avgCSAT.toFixed(1) : '0.0'}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>Customer satisfaction</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Tickets by Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Tickets by Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics?.ticketsByStatus?.map((item) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{item.status.replace('_', ' ')}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${(item.count / (metrics?.totalTickets || 1)) * 100}% `,
                              }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-12 text-right">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tickets by Priority */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Tickets by Priority
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics?.ticketsByPriority?.map((item) => {
                      const colors = {
                        urgent: 'bg-red-500',
                        high: 'bg-orange-500',
                        normal: 'bg-blue-500',
                        low: 'bg-gray-400',
                      };
                      return (
                        <div key={item.priority} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{item.priority}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-muted rounded-full h-2">
                              <div
                                className={`${colors[item.priority as keyof typeof colors] || 'bg-primary'} h - 2 rounded - full`}
                                style={{
                                  width: `${(item.count / (metrics?.totalTickets || 1)) * 100}% `,
                                }}
                              />
                            </div>
                            <span className="text-sm font-semibold w-12 text-right">{item.count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Tickets by Channel */}
              <Card>
                <CardHeader>
                  <CardTitle>Tickets by Channel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics?.ticketsByChannel?.map((item) => (
                      <div key={item.channel} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{item.channel}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{
                                width: `${(item.count / (metrics?.totalTickets || 1)) * 100}% `,
                              }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-12 text-right">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tickets by Team */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Tickets by Team
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics?.ticketsByTeam?.map((item) => (
                      <div key={item.team} className="flex items-center justify-between">
                        <span className="text-sm">{item.team || 'Unassigned'}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full"
                              style={{
                                width: `${(item.count / (metrics?.totalTickets || 1)) * 100}% `,
                              }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-12 text-right">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Agent Performance */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Agent Performance
                </CardTitle>
                <CardDescription>Individual agent metrics and productivity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Agent</th>
                        <th className="text-right py-3 px-4">Tickets Handled</th>
                        <th className="text-right py-3 px-4">Avg Resolution Time</th>
                        <th className="text-right py-3 px-4">CSAT Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics?.agentPerformance?.map((agent, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{agent.agent}</td>
                          <td className="py-3 px-4 text-right">{agent.tickets}</td>
                          <td className="py-3 px-4 text-right">
                            {agent.avgTime ? `${Math.round(agent.avgTime / 60)} h` : '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center gap-1">
                              {agent.csat ? agent.csat.toFixed(1) : '-'}
                              {agent.csat && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Daily Volume Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Ticket Volume</CardTitle>
                <CardDescription>Created vs Closed tickets over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-1">
                  {metrics?.dailyVolume?.map((day, idx) => {
                    const maxVal = Math.max(...(metrics.dailyVolume?.map(d => Math.max(d.created, d.closed)) || [1]));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col-reverse gap-1">
                          <div
                            className="bg-blue-500 rounded-t"
                            style={{ height: `${(day.created / maxVal) * 200} px` }}
                            title={`Created: ${day.created} `}
                          />
                          <div
                            className="bg-green-500 rounded-t"
                            style={{ height: `${(day.closed / maxVal) * 200} px` }}
                            title={`Closed: ${day.closed} `}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground rotate-45 origin-top-left">
                          {format(new Date(day.date), 'MM/dd')}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded" />
                    <span className="text-sm">Created</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span className="text-sm">Closed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
};

export default HelpdeskAnalytics;
