import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Breadcrumb } from '@/components/Breadcrumb';
import {
  Phone,
  PhoneCall,
  Clock,
  Calendar,
  TrendingUp,
  Target,
  Award,
  Play,
  Eye,
  Users,
  FileTextIcon,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  XCircle,
  Inbox
} from 'lucide-react';
import { api } from '@/lib/api';
import CallInbox from './CallInbox';
import LiveCallMonitor from './LiveCallMonitor';

interface TodaysCall {
  id: string;
  contactName: string;
  company: string;
  phone: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  disposition?: string;
  duration?: number;
  scheduledTime?: string;
  campaignName: string;
  scriptName?: string;
}

interface PerformanceMetric {
  label: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
}

const CallDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedScript, setSelectedScript] = useState<string>('');

  // Get active tab from URL or default to overview
  const activeTab = searchParams.get('tab') || 'overview';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Mock today's calls data - in real app, this would come from API
  const todaysCalls: TodaysCall[] = [
    {
      id: '1',
      contactName: 'John Smith',
      company: 'Tech Corp',
      phone: '+1 (555) 123-4567',
      status: 'pending',
      campaignName: 'Product Demo Campaign',
      scriptName: 'Discovery Call Script',
      scheduledTime: '09:00 AM'
    },
    {
      id: '2',
      contactName: 'Sarah Johnson',
      company: 'Marketing Inc',
      phone: '+1 (555) 987-6543',
      status: 'completed',
      disposition: 'Interested',
      duration: 180,
      campaignName: 'Product Demo Campaign',
      scriptName: 'Discovery Call Script'
    },
    {
      id: '3',
      contactName: 'Mike Wilson',
      company: 'Sales Solutions',
      phone: '+1 (555) 456-7890',
      status: 'completed',
      disposition: 'Callback Later',
      duration: 90,
      campaignName: 'Product Demo Campaign',
      scriptName: 'Follow-up Script'
    },
    {
      id: '4',
      contactName: 'Lisa Brown',
      company: 'Enterprise Ltd',
      phone: '+1 (555) 321-0987',
      status: 'failed',
      disposition: 'No Answer',
      campaignName: 'Product Demo Campaign',
      scriptName: 'Introduction Script'
    },
    {
      id: '5',
      contactName: 'David Lee',
      company: 'Startup Hub',
      phone: '+1 (555) 654-3210',
      status: 'pending',
      campaignName: 'Product Demo Campaign',
      scriptName: 'Discovery Call Script',
      scheduledTime: '02:30 PM'
    }
  ];

  // Mock performance metrics
  const performanceMetrics: PerformanceMetric[] = [
    {
      label: 'Calls Today',
      value: 12,
      change: 15,
      icon: <PhoneCall className="h-6 w-6 text-blue-600" />
    },
    {
      label: 'Success Rate',
      value: '68%',
      change: 8,
      icon: <Target className="h-6 w-6 text-green-600" />
    },
    {
      label: 'Avg Duration',
      value: '2:45',
      change: -5,
      icon: <Clock className="h-6 w-6 text-purple-600" />
    },
    {
      label: 'Conversion Rate',
      value: '25%',
      change: 12,
      icon: <TrendingUp className="h-6 w-6 text-orange-600" />
    }
  ];

  const { data: campaigns = [], isLoading: campaignsLoading, error: campaignsError } = useQuery({
    queryKey: ['call-campaigns'],
    queryFn: api.getCallCampaigns
  });

  const { data: scripts = [], isLoading: scriptsLoading, error: scriptsError } = useQuery({
    queryKey: ['call-scripts'],
    queryFn: api.getCallScripts
  });

  const activeCampaigns = Array.isArray(campaigns) ? campaigns.filter(c => c.status === 'active') : [];
  const activeScripts = Array.isArray(scripts) ? scripts : [];

  if (campaignsLoading || scriptsLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading call dashboard...</p>
          </div>
        </div>
      </div>

    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">Pending</Badge>;
      case 'in-progress':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">In Progress</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getDispositionBadge = (disposition?: string) => {
    if (!disposition) return null;

    const colors = {
      'Interested': 'bg-green-100 text-green-800 hover:bg-green-100',
      'Not Interested': 'bg-red-100 text-red-800 hover:bg-red-100',
      'Callback Later': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      'Wrong Number': 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      'No Answer': 'bg-muted text-muted-foreground hover:bg-muted',
      'Busy': 'bg-orange-100 text-orange-800 hover:bg-orange-100',
      'Voicemail': 'bg-blue-100 text-blue-800 hover:bg-blue-100'
    };

    return (
      <Badge className={colors[disposition as keyof typeof colors] || 'bg-muted text-muted-foreground hover:bg-muted'}>
        {disposition}
      </Badge>
    );
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartCall = (call: TodaysCall) => {
    if (call.status === 'pending') {
      // Navigate to campaigns to select which campaign to use
      navigate('/reach/outbound/calls/campaigns', {
        state: {
          mode: 'manual',
          contact: call.id,
          script: call.scriptName
        }
      });
    }
  };

  const handleRefresh = () => {
    toast({
      title: 'Refreshing',
      description: 'Updating call dashboard data...',
    });
    // In real app, would refetch queries
  };

  const handleViewCampaign = (campaignId: string) => {
    navigate(`/reach/outbound/calls/campaigns/${campaignId}`);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Call Outreach', href: '/reach/outbound/calls', icon: <Phone className="h-4 w-4" /> },
          { label: 'Overview' }
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Call Overview</h1>
          <p className="text-muted-foreground mt-1">
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="live" className="gap-2">
            <PhoneCall className="h-4 w-4" />
            Live Monitor
          </TabsTrigger>
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" />
            Inbox & Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="flex justify-end gap-2 mb-4">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => navigate('/reach/outbound/calls/campaigns')}>
              <Phone className="h-4 w-4 mr-2" />
              View Campaigns
            </Button>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceMetrics.map((metric, index) => (
              <Card key={index} className="border-analytics">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                      <p className={`text-sm ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metric.change >= 0 ? '+' : ''}{metric.change}% from yesterday
                      </p>
                    </div>
                    <div className="text-muted-foreground">
                      {metric.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Calls */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-analytics">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5" />
                        <span>Today's Calls</span>
                      </CardTitle>
                      <CardDescription>
                        {todaysCalls.filter(c => c.status === 'completed').length} completed, {todaysCalls.filter(c => c.status === 'pending').length} pending
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/reach/outbound/calls/campaigns')}>
                      View All
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {todaysCalls.map((call) => (
                      <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {call.status === 'in-progress' ? (
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                                <PhoneCall className="h-5 w-5 text-blue-600" />
                              </div>
                            ) : call.status === 'completed' ? (
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              </div>
                            ) : call.status === 'failed' ? (
                              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="h-5 w-5 text-red-600" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                <Clock className="h-5 w-5 text-yellow-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-sm font-medium truncate">{call.contactName}</h3>
                              {getStatusBadge(call.status)}
                              {getDispositionBadge(call.disposition)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">{call.company}</p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>{call.phone}</span>
                              <span>•</span>
                              <span>{call.campaignName}</span>
                              {call.duration && (
                                <>
                                  <span>•</span>
                                  <span>{formatDuration(call.duration)}</span>
                                </>
                              )}
                              {call.scheduledTime && (
                                <>
                                  <span>•</span>
                                  <span>{call.scheduledTime}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {call.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleStartCall(call)}
                              className="flex items-center space-x-1"
                            >
                              <Play className="h-3 w-3" />
                              <span>Start</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/reach/calls/logs/${call.id}`)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="border-analytics">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Play className="h-5 w-5" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button
                      className="w-full flex items-center justify-between"
                      onClick={() => navigate('/contacts')}
                    >
                      <span className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>View Contacts</span>
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    <Button
                      className="w-full flex items-center justify-between"
                      onClick={() => navigate('/reach/outbound/calls/campaigns')}
                    >
                      <span className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>Manage Campaigns</span>
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-between"
                      onClick={() => navigate('/reach/calls/scripts')}
                    >
                      <span className="flex items-center space-x-2">
                        <FileTextIcon className="h-4 w-4" />
                        <span>Call Scripts</span>
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Active Campaigns */}
              <Card className="border-analytics">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Active Campaigns</span>
                  </CardTitle>
                  <CardDescription>
                    {activeCampaigns.length} campaigns currently active
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeCampaigns.slice(0, 3).map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div>
                          <h4 className="text-sm font-medium">{campaign.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {campaign.recipient_count || 0} contacts • {campaign.status}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewCampaign(campaign.id)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {activeCampaigns.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No active campaigns
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Available Scripts */}
              <Card className="border-analytics">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileTextIcon className="h-5 w-5" />
                    <span>Available Scripts</span>
                  </CardTitle>
                  <CardDescription>
                    {activeScripts.length} scripts ready to use
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeScripts.slice(0, 3).map((script) => (
                      <div key={script.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div>
                          <h4 className="text-sm font-medium">{script.name}</h4>
                          <p className="text-xs text-muted-foreground capitalize">
                            {script.category} • 60s
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedScript(script.id)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {activeScripts.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No active scripts
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Daily Goals */}
              <Card className="border-analytics">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5" />
                    <span>Daily Goals</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Calls Completed</span>
                        <span>8 / 20</span>
                      </div>
                      <Progress value={40} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Talk Time</span>
                        <span>45 / 120 min</span>
                      </div>
                      <Progress value={37.5} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Positive Outcomes</span>
                        <span>3 / 5</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="live">
          <LiveCallMonitor embedded={true} />
        </TabsContent>

        <TabsContent value="inbox">
          <CallInbox embedded={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CallDashboard;
