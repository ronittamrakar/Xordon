import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockAuth } from '@/lib/mockAuth';
import { mockData, type AnalyticsData } from '@/lib/mockData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Send, MousePointerClick, Ban, UserX, Plus, LogOut, Settings, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [user, setUser] = useState(mockAuth.getCurrentUser());

  useEffect(() => {
    if (!mockAuth.isAuthenticated()) {
      navigate('/auth');
      return;
    }

    setAnalytics(mockData.getAnalytics());
  }, [navigate]);

  const handleLogout = () => {
    mockAuth.logout();
    navigate('/auth');
  };

  if (!analytics) return null;

  const stats = [
    {
      title: 'Total Sent',
      value: analytics.totalSent.toLocaleString(),
      icon: Send,
      color: 'text-primary',
    },
    {
      title: 'Opens',
      value: analytics.totalOpens.toLocaleString(),
      subtitle: `${analytics.openRate.toFixed(1)}% rate`,
      icon: Mail,
      color: 'text-blue-600',
    },
    {
      title: 'Clicks',
      value: analytics.totalClicks.toLocaleString(),
      subtitle: `${analytics.clickRate.toFixed(1)}% rate`,
      icon: MousePointerClick,
      color: 'text-green-600',
    },
    {
      title: 'Bounces',
      value: analytics.totalBounces.toLocaleString(),
      subtitle: `${analytics.bounceRate.toFixed(1)}% rate`,
      icon: Ban,
      color: 'text-orange-600',
    },
    {
      title: 'Unsubscribes',
      value: analytics.totalUnsubscribes.toLocaleString(),
      icon: UserX,
      color: 'text-red-600',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Cold Email Platform</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <Button variant="ghost" className="rounded-none border-b-2 border-primary" onClick={() => navigate('/')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button variant="ghost" className="rounded-none" onClick={() => navigate('/campaigns')}>
              <Mail className="h-4 w-4 mr-2" />
              Campaigns
            </Button>
            <Button variant="ghost" className="rounded-none" onClick={() => navigate('/sending-accounts')}>
              <Send className="h-4 w-4 mr-2" />
              Sending Accounts
            </Button>
            <Button variant="ghost" className="rounded-none" onClick={() => navigate('/analytics')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="flex gap-4 mb-8">
          <Button onClick={() => navigate('/campaigns/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
          <Button variant="outline" onClick={() => navigate('/sending-accounts')}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Accounts
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Email Activity (Last 7 Days)</CardTitle>
            <CardDescription>Track your email performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Line type="monotone" dataKey="sent" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="opens" stroke="hsl(200 98% 39%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="clicks" stroke="hsl(142 76% 36%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
