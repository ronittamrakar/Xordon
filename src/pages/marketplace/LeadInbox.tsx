import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Inbox, Clock, CheckCircle, XCircle, DollarSign, MapPin, Calendar, ChevronRight, Wallet as WalletIcon, RefreshCw } from 'lucide-react';
import { exportLeadMatchesCsv, getLeadMatchesFiltered, getProviderMatchStats, getServices, LeadMatch, ServiceCategory, Wallet, getWallet } from '@/services/leadMarketplaceApi';
import { MarketplaceNav } from '@/components/marketplace/MarketplaceNav';

const statusColors: Record<string, string> = {
  offered: 'bg-blue-100 text-blue-800',
  viewed: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  declined: 'bg-gray-100 text-gray-800',
  expired: 'bg-red-100 text-red-800',
  won: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-orange-100 text-orange-800',
  refunded: 'bg-purple-100 text-purple-800',
};

const timingLabels: Record<string, string> = {
  asap: 'ASAP',
  within_24h: 'Within 24 hours',
  within_week: 'Within a week',
  flexible: 'Flexible',
  scheduled: 'Scheduled',
};

export default function LeadInbox() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<LeadMatch[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('new');
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [stats, setStats] = useState<{ acceptance_rate: number; win_rate: number; avg_response_time_minutes: number | null } | null>(null);

  const [filters, setFilters] = useState<{ service_id?: number; min_quality?: number; max_price?: number; max_distance_km?: number }>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const statusFilter = activeTab === 'new' ? 'offered,viewed' : activeTab === 'active' ? 'accepted' : activeTab === 'completed' ? 'won,lost' : undefined;
      const [matchesRes, walletRes] = await Promise.all([
        getLeadMatchesFiltered({ status: statusFilter, limit: 50, ...filters }),
        getWallet()
      ]);
      if (matchesRes.data.success) setMatches(matchesRes.data.data);
      if (walletRes.data.success) setWallet(walletRes.data.data);
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getProviderMatchStats();
      if (res.data.success) {
        setStats({
          acceptance_rate: res.data.data.acceptance_rate,
          win_rate: res.data.data.win_rate,
          avg_response_time_minutes: res.data.data.avg_response_time_minutes,
        });
      }
    } catch (e) {
      console.warn('Failed to fetch provider match stats', e)
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const res = await getServices({ parent_id: null });
      if (res.data.success) setServices(res.data.data);
    } catch (e) {
      console.warn('Failed to fetch services', e)
    }
  }, []);

  useEffect(() => {
    fetchServices();
    fetchStats();
  }, [fetchServices, fetchStats]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = async () => {
    try {
      const statusFilter = activeTab === 'new' ? 'offered,viewed' : activeTab === 'active' ? 'accepted' : activeTab === 'completed' ? 'won,lost' : undefined;
      const blob = await exportLeadMatchesCsv({ status: statusFilter, limit: 5000, ...filters });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lead_matches_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e?.message || 'Export failed');
    }
  };

  const newCount = matches.filter(m => ['offered', 'viewed'].includes(m.status)).length;
  const activeCount = matches.filter(m => m.status === 'accepted').length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <MarketplaceNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Inbox</h1>
          <p className="text-muted-foreground">Manage incoming leads and opportunities</p>
        </div>
        <div className="flex items-center gap-4">
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <WalletIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Balance:</span>
              <span className="font-bold text-lg">${wallet?.balance?.toFixed(2) || '0.00'}</span>
            </div>
          </Card>
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleExport}>
            Export CSV
          </Button>
          <Button onClick={() => navigate('/lead-marketplace/wallet')}>
            <DollarSign className="h-4 w-4 mr-2" />
            Add Credits
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter leads in your inbox</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Service</Label>
              <Select
                value={filters.service_id ? String(filters.service_id) : 'all'}
                onValueChange={(v) => setFilters(prev => ({ ...prev, service_id: v === 'all' ? undefined : parseInt(v, 10) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All services</SelectItem>
                  {services.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Min Quality</Label>
              <Input
                type="number"
                placeholder="0"
                value={filters.min_quality ?? ''}
                onChange={(e) => setFilters(prev => ({ ...prev, min_quality: e.target.value ? parseFloat(e.target.value) : undefined }))}
              />
            </div>
            <div>
              <Label>Max Price</Label>
              <Input
                type="number"
                placeholder="No limit"
                value={filters.max_price ?? ''}
                onChange={(e) => setFilters(prev => ({ ...prev, max_price: e.target.value ? parseFloat(e.target.value) : undefined }))}
              />
            </div>
            <div>
              <Label>Max Distance (km)</Label>
              <Input
                type="number"
                placeholder="No limit"
                value={filters.max_distance_km ?? ''}
                onChange={(e) => setFilters(prev => ({ ...prev, max_distance_km: e.target.value ? parseFloat(e.target.value) : undefined }))}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your Performance</CardTitle>
            <CardDescription>Based on your lead history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Acceptance rate</span>
              <span className="font-medium">{stats ? `${stats.acceptance_rate}%` : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Win rate</span>
              <span className="font-medium">{stats ? `${stats.win_rate}%` : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg response</span>
              <span className="font-medium">{stats?.avg_response_time_minutes != null ? `${stats.avg_response_time_minutes} min` : '-'}</span>
            </div>
            <Button variant="outline" className="w-full mt-2" onClick={fetchStats}>
              Refresh Stats
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="new" className="gap-2">
            <Inbox className="h-4 w-4" />
            New Leads
            {newCount > 0 && <Badge variant="secondary">{newCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <Clock className="h-4 w-4" />
            Active
            {activeCount > 0 && <Badge variant="secondary">{activeCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed
          </TabsTrigger>
          <TabsTrigger value="all">All Leads</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                      <Skeleton className="h-10 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : matches.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No leads found</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'new' ? 'New leads will appear here when they match your preferences' : 'No leads in this category'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {matches.map(match => (
                <Card key={match.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/lead-marketplace/matches/${match.id}`)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{match.title || match.service_names || 'Service Request'}</h3>
                          <Badge className={statusColors[match.status]}>{match.status}</Badge>
                          {match.status === 'offered' && match.expires_at && (
                            <Badge variant="outline" className="text-orange-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Expires {new Date(match.expires_at).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {match.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {match.city}{match.region ? `, ${match.region}` : ''}
                            </span>
                          )}
                          {match.timing && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {timingLabels[match.timing] || match.timing}
                            </span>
                          )}
                          {match.distance_km && (
                            <span>{match.distance_km.toFixed(1)} km away</span>
                          )}
                        </div>
                        {match.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{match.description}</p>
                        )}
                        {(match.budget_min || match.budget_max) && (
                          <p className="text-sm font-medium">
                            Budget: ${match.budget_min || 0} - ${match.budget_max || '∞'}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">${match.lead_price.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Lead cost</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          View Details <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

