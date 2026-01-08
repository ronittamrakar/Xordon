import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useToast } from '@/hooks/use-toast';
import {
  MessageCircle,
  Users,
  Globe,
  Eye,
  EyeOff,
  Settings,
  Plus,
  Search,
  Filter,
  Clock,
  User,
  MessageSquare,
  Phone,
  Mail,
  Tag,
  Star,
  Shield,
  Wifi,
  WifiOff
} from 'lucide-react';

interface LiveChatSession {
  id: string;
  visitor_name: string;
  visitor_email?: string;
  visitor_ip: string;
  page_url: string;
  referrer: string;
  start_time: string;
  last_activity: string;
  status: 'active' | 'waiting' | 'ended';
  assigned_agent?: string;
  messages_count: number;
  rating?: number;
  tags: string[];
}

const LiveChat: React.FC = () => {
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [isWidgetEnabled, setIsWidgetEnabled] = useState(true);

  // Mock live chat sessions
  const [sessions, setSessions] = useState<LiveChatSession[]>([
    {
      id: 'session_001',
      visitor_name: 'Sarah Johnson',
      visitor_email: 'sarah@example.com',
      visitor_ip: '192.168.1.100',
      page_url: '/pricing',
      referrer: 'google.com',
      start_time: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      last_activity: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      status: 'active',
      assigned_agent: 'John Smith',
      messages_count: 8,
      rating: 5,
      tags: ['sales', 'pricing']
    },
    {
      id: 'session_002',
      visitor_name: 'Mike Chen',
      visitor_email: 'mike@startup.io',
      visitor_ip: '10.0.0.50',
      page_url: '/features',
      referrer: '/demo',
      start_time: new Date(Date.now() - 1200000).toISOString(), // 20 minutes ago
      last_activity: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      status: 'waiting',
      messages_count: 3,
      tags: ['demo', 'technical']
    },
    {
      id: 'session_003',
      visitor_name: 'Emma Davis',
      visitor_email: 'emma@business.com',
      visitor_ip: '172.16.0.25',
      page_url: '/contact',
      referrer: 'direct',
      start_time: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      last_activity: new Date(Date.now() - 1800000).toISOString(),
      status: 'ended',
      assigned_agent: 'Sarah Wilson',
      messages_count: 12,
      rating: 4,
      tags: ['support', 'billing']
    }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSessions(prev => prev.map(session => ({
        ...session,
        last_activity: new Date().toISOString()
      })));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.visitor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.visitor_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.page_url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    const matchesAgent = agentFilter === 'all' || session.assigned_agent === agentFilter;
    return matchesSearch && matchesStatus && matchesAgent;
  });

  const getAgentOptions = () => {
    const agents = Array.from(new Set(sessions.map(s => s.assigned_agent).filter(Boolean)));
    return ['all', ...agents];
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { icon: Wifi, className: 'bg-green-500', text: 'Active' },
      waiting: { icon: Clock, className: 'bg-yellow-500', text: 'Waiting' },
      ended: { icon: EyeOff, className: 'bg-gray-500', text: 'Ended' }
    };
    const Icon = config[status as keyof typeof config]?.icon || Wifi;
    const { className, text } = config[status as keyof typeof config] || config.ended;
    return (
      <Badge className={`${className} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {text}
      </Badge>
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Helpdesk', href: '/helpdesk' },
          { label: 'Live Chat' },
        ]}
      />

      <div className="mx-auto max-w-7xl py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Live Chat</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and manage real-time conversations with website visitors
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="widget-toggle"
                checked={isWidgetEnabled}
                onChange={(e) => {
                  setIsWidgetEnabled(e.target.checked);
                  toast({
                    title: e.target.checked ? 'Widget Enabled' : 'Widget Disabled',
                    description: `Live chat widget is now ${e.target.checked ? 'active' : 'inactive'}`
                  });
                }}
                className="h-4 w-4"
              />
              <Label htmlFor="widget-toggle" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Widget Active
              </Label>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Start Chat
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Chats</p>
                  <p className="text-2xl font-bold">{sessions.filter(s => s.status === 'active').length}</p>
                </div>
                <Wifi className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Waiting</p>
                  <p className="text-2xl font-bold">{sessions.filter(s => s.status === 'waiting').length}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  <p className="text-2xl font-bold">2.3m</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Satisfaction</p>
                  <p className="text-2xl font-bold">4.6</p>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search visitors, pages, or emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-[180px]">
                  <Users className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by agent" />
                </SelectTrigger>
                <SelectContent>
                  {getAgentOptions().map(agent => (
                    <SelectItem key={agent} value={agent}>
                      {agent === 'all' ? 'All Agents' : agent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Chat Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Currently active and waiting chat sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active chat sessions found
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => toast({ title: 'Chat Details', description: `Opening chat with ${session.visitor_name}` })}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getStatusBadge(session.status)}
                          <div>
                            <h4 className="font-semibold">{session.visitor_name}</h4>
                            {session.visitor_email && (
                              <p className="text-sm text-muted-foreground">{session.visitor_email}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Last activity</p>
                          <p className="text-sm font-medium">{formatTime(session.last_activity)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{session.visitor_ip}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>{session.messages_count} messages</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{session.status}</span>
                        </div>
                        {session.rating && (
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{session.rating}/5</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-xs">{session.page_url}</span>
                        </div>
                        {session.assigned_agent && (
                          <Badge variant="outline">
                            <Shield className="w-3 h-3 mr-1" />
                            {session.assigned_agent}
                          </Badge>
                        )}
                      </div>

                      {session.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {session.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Widget Configuration</CardTitle>
              <CardDescription>Configure your live chat widget settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Widget Position</Label>
                <Select defaultValue="bottom-right">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="top-left">Top Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Widget Color</Label>
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white shadow-sm"></button>
                    <button className="w-8 h-8 rounded-full bg-green-500 border-2 border-white shadow-sm"></button>
                    <button className="w-8 h-8 rounded-full bg-purple-500 border-2 border-white shadow-sm"></button>
                    <button className="w-8 h-8 rounded-full bg-red-500 border-2 border-white shadow-sm"></button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Availability Hours</Label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Mon-Fri: 9AM - 6PM</div>
                  <div>Sat: 10AM - 4PM</div>
                  <div>Sun: Closed</div>
                  <div>Timezone: EST</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Auto-Response</Label>
                <Input placeholder="Hello! How can we help you today?" />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="font-semibold">Widget Preview</p>
                  <p className="text-sm text-muted-foreground">See how your widget will appear</p>
                </div>
                <Button variant="outline" onClick={() => toast({ title: 'Preview', description: 'Widget preview would open here' })}>
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Analytics */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Chat Analytics</CardTitle>
            <CardDescription>Performance metrics and insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">89%</div>
                <p className="text-sm text-muted-foreground">Chat Acceptance Rate</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">4.2m</div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">94%</div>
                <p className="text-sm text-muted-foreground">Visitor Satisfaction</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default LiveChat;