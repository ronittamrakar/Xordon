import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, MessageSquare, Phone, Search, RefreshCw, Inbox as InboxIcon, Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const EmailRepliesContent = lazy(() => import('./EmailReplies'));
const SMSRepliesContent = lazy(() => import('./SMSReplies'));
const CallInboxContent = lazy(() => import('./calls/CallInbox'));

interface InboxStats {
  email: number;
  sms: number;
  calls: number;
  total: number;
}

function LoadingFallback() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function Inbox() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'email';
  const [activeTab, setActiveTab] = useState<'email' | 'sms' | 'calls'>(initialTab as any);
  const [stats, setStats] = useState<InboxStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/inbox/stats');
      setStats(res.data as InboxStats);
    } catch (error) {
      console.error('Failed to load inbox stats:', error);
      setStats({ email: 0, sms: 0, calls: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, [loadStats]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as 'email' | 'sms' | 'calls');
    setSearchParams({ tab });
  };

  const handleRefresh = () => {
    setLoading(true);
    loadStats();
    toast.success('Inbox refreshed');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <InboxIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Unified Inbox</h1>
            <p className="text-sm text-muted-foreground">
              All your communications in one place
              {stats && stats.total > 0 && (
                <span className="ml-2">
                  <Badge variant="secondary" className="text-xs">
                    <Bell className="h-3 w-3 mr-1" />
                    {stats.total} unread
                  </Badge>
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'email' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleTabChange('email')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email</CardTitle>
            <Mail className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-12" /> : (stats?.email || 0)}
              </span>
              {!loading && stats && stats.email > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.email} unread
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Email replies & threads</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'sms' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleTabChange('sms')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-12" /> : (stats?.sms || 0)}
              </span>
              {!loading && stats && stats.sms > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.sms} unread
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Text message replies</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'calls' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleTabChange('calls')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls</CardTitle>
            <Phone className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-12" /> : (stats?.calls || 0)}
              </span>
              {!loading && stats && stats.calls > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.calls} missed
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Voicemail & missed calls</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
            {stats && stats.email > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{stats.email}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            SMS
            {stats && stats.sms > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{stats.sms}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="calls" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Calls
            {stats && stats.calls > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{stats.calls}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-4">
          <Suspense fallback={<LoadingFallback />}>
            <EmailRepliesContent embedded />
          </Suspense>
        </TabsContent>

        <TabsContent value="sms" className="mt-4">
          <Suspense fallback={<LoadingFallback />}>
            <SMSRepliesContent embedded />
          </Suspense>
        </TabsContent>

        <TabsContent value="calls" className="mt-4">
          <Suspense fallback={<LoadingFallback />}>
            <CallInboxContent embedded />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
