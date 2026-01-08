import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Calendar, Phone, Mail, MessageSquare, Filter, RefreshCw, Building2, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { ActivityType, LeadStage } from '@/types/crm';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface BackendActivity {
  id: string;
  activity_type: ActivityType;
  activity_title: string;
  activity_description?: string;
  activity_date: string;
  duration_minutes?: number;
  outcome?: string;
  next_action?: string;
  next_action_date?: string;
  campaign_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  lead_stage: LeadStage;
  lead_value?: number;
  campaign_name?: string;
}

interface TypeCount {
  activity_type: string;
  count: number;
}

const ActivitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<BackendActivity[]>([]);
  const [typeCounts, setTypeCounts] = useState<TypeCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await api.crm.getActivities({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        search: search || undefined,
        page,
        limit: 25
      });
      setActivities(data.activities as unknown as BackendActivity[]);
      setTypeCounts(data.typeCounts);
      setPagination({ total: data.pagination.total, totalPages: data.pagination.totalPages });
    } catch (error) {
      console.error('Failed to load activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadActivities();
  }, [typeFilter, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        loadActivities();
      } else {
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const getActivityIcon = (type: ActivityType | string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStageColor = (stage: string) => {
    const colors: { [key: string]: string } = {
      new: 'bg-gray-500',
      contacted: 'bg-blue-500',
      qualified: 'bg-green-500',
      proposal: 'bg-yellow-500',
      negotiation: 'bg-orange-500',
      closed_won: 'bg-green-600',
      closed_lost: 'bg-red-500',
    };
    return colors[stage] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Activities</h1>
            <p className="text-gray-600">Review and filter all recent CRM activities</p>
          </div>
          <Button variant="outline" onClick={() => void loadActivities()} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-4 w-4 mr-2" /> Filters
            </CardTitle>
            <CardDescription>Filter activities by type or search by contact / subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="activityType">Activity Type</Label>
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="deal_change">Deal Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by contact, email, or activity title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              {activities.length} activity{activities.length === 1 ? '' : 'ies'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No activities found</p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">{activity.activity_title}</p>
                        <Badge variant="secondary" className="text-xs">
                          {activity.activity_type}
                        </Badge>
                        {activity.activity_type === 'email' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs h-6 px-2"
                            onClick={() => navigate(`/reach/inbound/email/replies?email=${activity.email}`)}
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            View Emails
                          </Button>
                        )}
                        {activity.activity_type === 'sms' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs h-6 px-2"
                            onClick={() => navigate(`/reach/inbound/sms/replies?email=${activity.email}`)}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            View SMS
                          </Button>
                        )}
                        {activity.activity_type === 'call' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs h-6 px-2"
                            onClick={() => navigate(`/reach/calls/logs?email=${activity.email}`)}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            View Call Logs
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {`${activity.first_name || ''} ${activity.last_name || ''}`.trim() || 'Unknown contact'} • {activity.email || 'No email'}
                      </p>
                      {activity.activity_description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{activity.activity_description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.activity_date).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right space-y-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(
                          activity.lead_stage
                        )} text-white`}
                      >
                        {activity.lead_stage.replace('_', ' ')}
                      </span>
                      {activity.outcome && (
                        <p className="text-xs text-gray-500">Outcome: {activity.outcome}</p>
                      )}
                      {activity.company && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {activity.company}
                        </p>
                      )}
                      {activity.lead_value && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${activity.lead_value.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {activities.length} of {pagination.total} activities
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Type Summary */}
        {typeCounts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
              <CardDescription>Breakdown by activity type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {typeCounts.map((tc) => (
                  <div 
                    key={tc.activity_type} 
                    className="text-center p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setTypeFilter(tc.activity_type)}
                  >
                    <div className="flex justify-center mb-2">
                      {getActivityIcon(tc.activity_type)}
                    </div>
                    <p className="text-2xl font-bold">{tc.count}</p>
                    <p className="text-xs text-muted-foreground capitalize">{tc.activity_type.replace('_', ' ')}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default ActivitiesPage;
