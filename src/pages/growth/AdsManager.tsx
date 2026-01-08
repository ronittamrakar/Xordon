import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActiveCompany, companyQueryKey } from '@/hooks/useActiveCompany';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { adsApi, AdAccount, AdCampaign, AdBudget, AdABTest } from '@/services';
import { Plus, BarChart3, DollarSign, Target, TrendingUp, Loader2, ExternalLink, RefreshCw, Megaphone, Calendar as CalendarIcon, Play, Pause, Edit, Trash2, Eye, MoreVertical, Copy, Settings, TestTube } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const platformColors: Record<string, string> = {
  google_ads: 'bg-blue-500',
  facebook_ads: 'bg-indigo-500',
  instagram_ads: 'bg-pink-500',
  linkedin_ads: 'bg-sky-500',
  tiktok_ads: 'bg-gray-800',
  microsoft_ads: 'bg-green-500',
};

const statusColors: Record<string, string> = {
  enabled: 'bg-green-500',
  active: 'bg-green-500',
  paused: 'bg-yellow-500',
  ended: 'bg-gray-500',
  removed: 'bg-red-500',
  draft: 'bg-blue-500',
};

function formatCurrency(value?: number | string | null): string {
  const num = value == null ? NaN : Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : '0.00';
}

function formatNumber(value?: number | string | null, decimals = 2): string {
  const num = value == null ? NaN : Number(value);
  return Number.isFinite(num) ? num.toFixed(decimals) : (0).toFixed(decimals);
}

interface CampaignFormData {
  name: string;
  platform: string;
  campaign_type: string;
  daily_budget: string;
  total_budget: string;
  start_date: string;
  end_date: string;
  targeting_summary: string;
  status: 'enabled' | 'paused' | 'draft';
}

interface ABTestFormData {
  name: string;
  campaign_id: string;
  variant_a_name: string;
  variant_b_name: string;
  variant_a_budget: string;
  variant_b_budget: string;
  test_duration_days: string;
  metric: 'ctr' | 'conversions' | 'cpa' | 'roas';
}

export default function AdsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeCompanyId, hasCompany } = useActiveCompany();
  const [activeTab, setActiveTab] = useState('campaigns');
  const [isConnectAccountOpen, setIsConnectAccountOpen] = useState(false);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isCreateBudgetOpen, setIsCreateBudgetOpen] = useState(false);
  const [isABTestOpen, setIsABTestOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null);
  const [editCampaignBudget, setEditCampaignBudget] = useState('');

  const [campaignForm, setCampaignForm] = useState<CampaignFormData>({
    name: '',
    platform: 'google_ads',
    campaign_type: 'search',
    daily_budget: '',
    total_budget: '',
    start_date: '',
    end_date: '',
    targeting_summary: '',
    status: 'draft',
  });

  const [abTestForm, setABTestForm] = useState<ABTestFormData>({
    name: '',
    campaign_id: '',
    variant_a_name: 'Variant A',
    variant_b_name: 'Variant B',
    variant_a_budget: '',
    variant_b_budget: '',
    test_duration_days: '14',
    metric: 'conversions',
  });

  const [newBudget, setNewBudget] = useState({
    period_type: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    period_start: '',
    period_end: '',
    total_budget: '',
    google_ads_budget: '',
    facebook_ads_budget: '',
    alert_threshold: '80',
  });

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [campaignStartDate, setCampaignStartDate] = useState<Date>();
  const [campaignEndDate, setCampaignEndDate] = useState<Date>();

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: companyQueryKey('ad-accounts', activeCompanyId),
    queryFn: () => adsApi.getAccounts(),
    enabled: hasCompany,
  });

  const { data: campaigns = [], isLoading: campaignsLoading, refetch: refetchCampaigns } = useQuery<AdCampaign[]>({
    queryKey: companyQueryKey('ad-campaigns', activeCompanyId),
    queryFn: () => adsApi.getCampaigns(),
    select: (res) => {
      if (!Array.isArray(res?.data)) {
        console.warn('adsApi.getCampaigns returned non-array response:', res);
        return [];
      }
      return res.data;
    },
    enabled: hasCompany,
  });

  const { data: budgets = [] } = useQuery({
    queryKey: companyQueryKey('ad-budgets', activeCompanyId),
    queryFn: () => adsApi.getBudgets(),
    enabled: hasCompany,
  });

  const { data: conversions = [] } = useQuery({
    queryKey: companyQueryKey('ad-conversions', activeCompanyId),
    queryFn: () => adsApi.getConversions(),
    select: (res) => {
      if (!Array.isArray(res?.data)) {
        console.warn('adsApi.getConversions returned non-array response:', res);
        return [];
      }
      return res.data;
    },
    enabled: hasCompany,
  });

  const { data: analytics } = useQuery({
    queryKey: companyQueryKey('ads-analytics', activeCompanyId),
    queryFn: () => adsApi.getAnalytics(),
    enabled: hasCompany,
  });

  const connectAccountMutation = useMutation({
    mutationFn: (platform: string) => adsApi.getOAuthUrl(platform),
    onSuccess: (data, platform) => {
      console.log('OAuth response:', data);
      if (data.auth_url) {
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          data.auth_url,
          `Connect ${platform}`,
          `width=${width},height=${height},left=${left},top=${top}`
        );

        const checkPopup = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkPopup);
            queryClient.invalidateQueries({ queryKey: companyQueryKey('ad-accounts', activeCompanyId) });
            setIsConnectAccountOpen(false);
            toast({ title: 'Account connected successfully!' });
          }
        }, 1000);
      } else if (data.error) {
        toast({
          title: 'Connection failed',
          description: data.error,
          variant: 'destructive'
        });
      }
    },
    onError: (error: Error) => {
      console.error('OAuth error:', error);
      toast({
        title: 'Connection failed',
        description: error.message || 'Unable to connect account. Please try again.',
        variant: 'destructive'
      });
    },
  });

  const toggleCampaignMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'enabled' | 'paused' }) =>
      adsApi.updateCampaign(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('ad-campaigns', activeCompanyId) });
      toast({ title: 'Campaign status updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update campaign', variant: 'destructive' });
    },
  });

  const updateCampaignBudgetMutation = useMutation({
    mutationFn: ({ id, daily_budget }: { id: string; daily_budget: number }) =>
      adsApi.updateCampaign(id, { daily_budget }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('ad-campaigns', activeCompanyId) });
      setEditingCampaign(null);
      setEditCampaignBudget('');
      toast({ title: 'Campaign budget updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update budget', variant: 'destructive' });
    },
  });

  const syncCampaignsMutation = useMutation({
    mutationFn: () => adsApi.syncCampaigns(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('ad-campaigns', activeCompanyId) });
      toast({ title: 'Campaigns synced successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to sync campaigns', variant: 'destructive' });
    },
  });

  const createBudgetMutation = useMutation({
    mutationFn: (data: {
      period_type: 'monthly' | 'quarterly' | 'yearly';
      period_start: string;
      period_end: string;
      total_budget: number;
      google_ads_budget?: number;
      facebook_ads_budget?: number;
      alert_threshold?: number;
    }) => adsApi.createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('ad-budgets', activeCompanyId) });
      setIsCreateBudgetOpen(false);
      setNewBudget({
        period_type: 'monthly',
        period_start: '',
        period_end: '',
        total_budget: '',
        google_ads_budget: '',
        facebook_ads_budget: '',
        alert_threshold: '80',
      });
      setStartDate(undefined);
      setEndDate(undefined);
      toast({ title: 'Budget created successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create budget',
        description: error?.message || 'An error occurred',
        variant: 'destructive'
      });
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: (id: string) => adsApi.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('ad-budgets', activeCompanyId) });
      toast({ title: 'Budget deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete budget', variant: 'destructive' });
    },
  });

  const { data: abTests = [], isLoading: abTestsLoading } = useQuery({
    queryKey: companyQueryKey('ad-ab-tests', activeCompanyId),
    queryFn: () => adsApi.getABTests(),
    enabled: hasCompany,
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data: Partial<AdCampaign>) => adsApi.createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('ad-campaigns', activeCompanyId) });
      setIsCreateCampaignOpen(false);
      setCampaignForm({
        name: '', platform: 'google_ads', campaign_type: 'search', daily_budget: '',
        total_budget: '', start_date: '', end_date: '', targeting_summary: '', status: 'draft'
      });
      setCampaignStartDate(undefined);
      setCampaignEndDate(undefined);
      toast({ title: 'Campaign created successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to create campaign', description: err.message, variant: 'destructive' });
    }
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (id: number) => adsApi.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('ad-campaigns', activeCompanyId) });
      toast({ title: 'Campaign deleted successfully' });
    },
    onError: () => toast({ title: 'Failed to delete campaign', variant: 'destructive' })
  });

  const createABTestMutation = useMutation({
    mutationFn: (data: any) => adsApi.createABTest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('ad-ab-tests', activeCompanyId) });
      setIsABTestOpen(false);
      setABTestForm({
        name: '', campaign_id: '', variant_a_name: 'Variant A', variant_b_name: 'Variant B',
        variant_a_budget: '', variant_b_budget: '', test_duration_days: '14', metric: 'conversions'
      });
      toast({ title: 'A/B Test created successfully' });
    },
    onError: (err: any) => toast({ title: 'Failed to create A/B test', description: err.message, variant: 'destructive' })
  });

  const deleteABTestMutation = useMutation({
    mutationFn: (id: number) => adsApi.deleteABTest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('ad-ab-tests', activeCompanyId) });
      toast({ title: 'A/B Test deleted' });
    },
    onError: () => toast({ title: 'Failed to delete A/B test', variant: 'destructive' })
  });

  const totalSpend = analytics?.overall?.total_spend || 0;
  const totalConversions = analytics?.overall?.total_conversions || 0;
  const avgCpa = totalConversions > 0 ? totalSpend / totalConversions : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ads Manager</h1>
          <p className="text-muted-foreground">Manage your advertising campaigns across platforms</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isConnectAccountOpen} onOpenChange={setIsConnectAccountOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Connect Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Ad Account</DialogTitle>
                <DialogDescription>Choose a platform to connect</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                {[
                  { id: 'google', name: 'Google Ads', color: 'bg-blue-500', icon: '🔍' },
                  { id: 'facebook', name: 'Facebook Ads', color: 'bg-indigo-500', icon: '📘' },
                  { id: 'instagram', name: 'Instagram Ads', color: 'bg-pink-500', icon: '📷' },
                  { id: 'linkedin', name: 'LinkedIn Ads', color: 'bg-sky-500', icon: '💼' },
                  { id: 'tiktok', name: 'TikTok Ads', color: 'bg-gray-800', icon: '🎵' },
                  { id: 'microsoft', name: 'Microsoft Ads', color: 'bg-green-500', icon: '🪟' },
                ].map((platform) => (
                  <Button
                    key={platform.id}
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => connectAccountMutation.mutate(platform.id)}
                    disabled={connectAccountMutation.isPending}
                  >
                    <span className="text-2xl">{platform.icon}</span>
                    <span>{platform.name}</span>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={() => setIsCreateCampaignOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalSpend.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(analytics?.overall?.total_impressions || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(analytics?.overall?.total_clicks || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalConversions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg CPA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${formatCurrency(avgCpa)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Ad Accounts</CardTitle>
          <CardDescription>Manage your advertising platform connections</CardDescription>
        </CardHeader>
        <CardContent>
          {accountsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No ad accounts connected yet</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {accounts.map((account: AdAccount) => (
                <div key={account.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Badge className={platformColors[account.platform]}>{account.platform.replace('_', ' ')}</Badge>
                  <div>
                    <p className="font-medium">{account.account_name}</p>
                    <p className="text-xs text-muted-foreground">ID: {account.platform_account_id}</p>
                  </div>
                  <Badge variant={account.status === 'connected' ? 'default' : 'secondary'}>
                    {account.status === 'connected' ? 'Active' : account.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="campaigns">
            <Megaphone className="h-4 w-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="budgets">
            <DollarSign className="h-4 w-4 mr-2" />
            Budgets
          </TabsTrigger>
          <TabsTrigger value="conversions">
            <Target className="h-4 w-4 mr-2" />
            Conversions
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="abtesting">
            <TestTube className="h-4 w-4 mr-2" />
            A/B Testing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => syncCampaignsMutation.mutate()}
              disabled={syncCampaignsMutation.isPending || campaigns.length === 0}
            >
              {syncCampaignsMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync Campaigns
            </Button>
          </div>
          {campaignsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : campaigns.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No campaigns yet. Connect an ad account or create a campaign.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {campaigns.map((campaign: AdCampaign) => (
                <Card key={campaign.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{campaign.name}</h4>
                            <Badge className={platformColors[campaign.platform || '']}>{(campaign.platform || '').replace('_', ' ')}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground capitalize">{campaign.campaign_type || 'Campaign'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-medium">Budget</p>
                          {editingCampaign?.id === campaign.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={editCampaignBudget}
                                onChange={(e) => setEditCampaignBudget(e.target.value)}
                                className="w-24 h-8"
                                placeholder="0.00"
                              />
                              <Button
                                size="sm"
                                onClick={() => {
                                  const budget = parseFloat(editCampaignBudget);
                                  if (budget > 0) {
                                    updateCampaignBudgetMutation.mutate({ id: String(campaign.id), daily_budget: budget });
                                  }
                                }}
                                disabled={!editCampaignBudget || parseFloat(editCampaignBudget) <= 0}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingCampaign(null);
                                  setEditCampaignBudget('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <p className="text-lg">${formatCurrency(campaign.daily_budget)}/day</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Spent</p>
                          <p className="text-lg">${formatCurrency((campaign as any).total_spend)}</p>
                        </div>
                        <Badge className={statusColors[campaign.status]}>{campaign.status}</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                toggleCampaignMutation.mutate({
                                  id: String(campaign.id),
                                  status: campaign.status === 'enabled' ? 'paused' : 'enabled',
                                });
                              }}
                            >
                              {campaign.status === 'enabled' ? (
                                <><Pause className="h-4 w-4 mr-2" /> Pause Campaign</>
                              ) : (
                                <><Play className="h-4 w-4 mr-2" /> Resume Campaign</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingCampaign(campaign);
                                setEditCampaignBudget(campaign.daily_budget?.toString() || '');
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" /> Edit Budget
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedCampaign(campaign);
                                toast({ title: `Viewing ${campaign.name} details` });
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                toast({ title: 'Duplicate campaign feature coming soon' });
                              }}
                            >
                              <Copy className="h-4 w-4 mr-2" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                window.open(`https://${campaign.platform}.com`, '_blank');
                              }}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" /> Open in {campaign.platform?.replace('_', ' ')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                if (confirm(`Delete campaign "${campaign.name}"?`)) {
                                  deleteCampaignMutation.mutate(campaign.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isCreateBudgetOpen} onOpenChange={setIsCreateBudgetOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Budget
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Ad Budget</DialogTitle>
                  <DialogDescription>Set up a budget to track spending</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Period Type</Label>
                    <Select value={newBudget.period_type} onValueChange={(v: 'monthly' | 'quarterly' | 'yearly') => setNewBudget({ ...newBudget, period_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Period Start</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {startDate ? format(startDate, 'PPP') : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={(date) => {
                              setStartDate(date);
                              if (date) {
                                setNewBudget({ ...newBudget, period_start: format(date, 'yyyy-MM-dd') });
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Period End</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {endDate ? format(endDate, 'PPP') : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={(date) => {
                              setEndDate(date);
                              if (date) {
                                setNewBudget({ ...newBudget, period_end: format(date, 'yyyy-MM-dd') });
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Total Budget ($)</Label>
                    <Input
                      type="number"
                      value={newBudget.total_budget}
                      onChange={(e) => setNewBudget({ ...newBudget, total_budget: e.target.value })}
                      placeholder="10000.00"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Google Ads Budget ($)</Label>
                      <Input
                        type="number"
                        value={newBudget.google_ads_budget}
                        onChange={(e) => setNewBudget({ ...newBudget, google_ads_budget: e.target.value })}
                        placeholder="5000.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Facebook Ads Budget ($)</Label>
                      <Input
                        type="number"
                        value={newBudget.facebook_ads_budget}
                        onChange={(e) => setNewBudget({ ...newBudget, facebook_ads_budget: e.target.value })}
                        placeholder="5000.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Alert Threshold (%)</Label>
                    <Input
                      type="number"
                      value={newBudget.alert_threshold}
                      onChange={(e) => setNewBudget({ ...newBudget, alert_threshold: e.target.value })}
                      placeholder="80"
                    />
                    <p className="text-xs text-muted-foreground">Get notified when spending reaches this percentage</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateBudgetOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => createBudgetMutation.mutate({
                      period_type: newBudget.period_type,
                      period_start: newBudget.period_start,
                      period_end: newBudget.period_end,
                      total_budget: parseFloat(newBudget.total_budget) || 0,
                      google_ads_budget: newBudget.google_ads_budget ? parseFloat(newBudget.google_ads_budget) : undefined,
                      facebook_ads_budget: newBudget.facebook_ads_budget ? parseFloat(newBudget.facebook_ads_budget) : undefined,
                      alert_threshold: newBudget.alert_threshold ? parseFloat(newBudget.alert_threshold) : undefined,
                    })}
                    disabled={!newBudget.period_start || !newBudget.period_end || !newBudget.total_budget || createBudgetMutation.isPending}
                  >
                    {createBudgetMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Budget
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {budgets.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No budgets set up yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {budgets.map((budget: AdBudget) => {
                const spentPercent = budget.total_budget > 0 ? (budget.spent / budget.total_budget) * 100 : 0;
                const isActive = new Date(budget.period_end) >= new Date();
                return (
                  <Card key={budget.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium capitalize">{budget.period_type} Budget</h4>
                            <p className="text-sm text-muted-foreground">{new Date(budget.period_start).toLocaleDateString()} - {new Date(budget.period_end).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={isActive ? 'default' : 'secondary'}>
                              {isActive ? 'Active' : 'Ended'}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    toast({ title: 'Edit budget feature coming soon' });
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" /> Edit Budget
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    if (confirm(`Delete ${budget.period_type} budget?`)) {
                                      deleteBudgetMutation.mutate(String(budget.id));
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete Budget
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>${formatCurrency(budget.spent)} spent</span>
                            <span>${formatCurrency(budget.total_budget)} budget</span>
                          </div>
                          <Progress value={Math.min(spentPercent, 100)} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="conversions" className="space-y-4">
          {conversions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No conversions tracked yet</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {conversions.slice(0, 20).map((conversion: any) => (
                    <div key={conversion.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium capitalize">{conversion.conversion_type?.replace('_', ' ') || 'Conversion'}</p>
                        <p className="text-sm text-muted-foreground">
                          {conversion.source} • {format(new Date(conversion.converted_at), 'PPp')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${formatCurrency(conversion.conversion_value)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Spend by Platform</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.by_platform?.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.by_platform.map((item: any) => (
                      <div key={item.platform} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={platformColors[item.platform]}>{item.platform.replace('_', ' ')}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${formatCurrency(item.spend)}</p>
                          <p className="text-xs text-muted-foreground">{item.clicks} clicks</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No data available</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CTR</span>
                    <span className="font-medium">{formatNumber(analytics?.performance?.avg_ctr, 2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CPC</span>
                    <span className="font-medium">${formatNumber(analytics?.performance?.avg_cpc, 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CPM</span>
                    <span className="font-medium">${formatNumber(analytics?.performance?.avg_cpm, 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conversion Rate</span>
                    <span className="font-medium">{formatNumber(analytics?.conversions?.conversion_rate, 2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ROAS</span>
                    <span className="font-medium">{formatNumber(analytics?.overall?.roas, 2)}x</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="abtesting" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isABTestOpen} onOpenChange={setIsABTestOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create A/B Test
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create A/B Test</DialogTitle>
                  <DialogDescription>Compare two variants of a campaign</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Test Name</Label>
                    <Input
                      value={abTestForm.name}
                      onChange={(e) => setABTestForm({ ...abTestForm, name: e.target.value })}
                      placeholder="Headline Test V1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Select Campaign</Label>
                    <Select value={abTestForm.campaign_id} onValueChange={(v) => setABTestForm({ ...abTestForm, campaign_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Variant A Name</Label>
                      <Input
                        value={abTestForm.variant_a_name}
                        onChange={(e) => setABTestForm({ ...abTestForm, variant_a_name: e.target.value })}
                        placeholder="Original Headline"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Variant B Name</Label>
                      <Input
                        value={abTestForm.variant_b_name}
                        onChange={(e) => setABTestForm({ ...abTestForm, variant_b_name: e.target.value })}
                        placeholder="New Headline"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Variant A Budget ($)</Label>
                      <Input
                        type="number"
                        value={abTestForm.variant_a_budget}
                        onChange={(e) => setABTestForm({ ...abTestForm, variant_a_budget: e.target.value })}
                        placeholder="50.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Variant B Budget ($)</Label>
                      <Input
                        type="number"
                        value={abTestForm.variant_b_budget}
                        onChange={(e) => setABTestForm({ ...abTestForm, variant_b_budget: e.target.value })}
                        placeholder="50.00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration (Days)</Label>
                      <Input
                        type="number"
                        value={abTestForm.test_duration_days}
                        onChange={(e) => setABTestForm({ ...abTestForm, test_duration_days: e.target.value })}
                        placeholder="14"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Winning Metric</Label>
                      <Select value={abTestForm.metric} onValueChange={(v: any) => setABTestForm({ ...abTestForm, metric: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conversions">Conversions</SelectItem>
                          <SelectItem value="ctr">Click Through Rate (CTR)</SelectItem>
                          <SelectItem value="cpa">Cost Per Acquisition (CPA)</SelectItem>
                          <SelectItem value="roas">ROAS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsABTestOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => createABTestMutation.mutate({
                      ...abTestForm,
                      campaign_id: parseInt(abTestForm.campaign_id),
                      variant_a_budget: parseFloat(abTestForm.variant_a_budget) || 0,
                      variant_b_budget: parseFloat(abTestForm.variant_b_budget) || 0,
                      test_duration_days: parseInt(abTestForm.test_duration_days) || 14
                    })}
                    disabled={createABTestMutation.isPending || !abTestForm.name || !abTestForm.campaign_id}
                  >
                    {createABTestMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Test
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {abTestsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : abTests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No A/B tests running. Create one to optimize your campaigns.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {abTests.map((test: AdABTest) => (
                <Card key={test.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{test.name}</CardTitle>
                      <Badge variant={test.status === 'active' ? 'default' : 'secondary'}>{test.status}</Badge>
                    </div>
                    <CardDescription>{test.campaign_name || 'Unknown Campaign'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm">
                        <span className="font-medium text-blue-600">{test.variant_a_name}</span> vs <span className="font-medium text-pink-600">{test.variant_b_name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Goal: {test.metric.toUpperCase()}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => toast({ title: "View details coming soon" })}>
                        <Eye className="h-4 w-4 mr-2" /> Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm('Delete this A/B test?')) deleteABTestMutation.mutate(test.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Campaign Dialog */}
      <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>Set up a new advertising campaign</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                placeholder="Summer Sale 2024"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={campaignForm.platform} onValueChange={(v) => setCampaignForm({ ...campaignForm, platform: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google_ads">Google Ads</SelectItem>
                    <SelectItem value="facebook_ads">Facebook Ads</SelectItem>
                    <SelectItem value="instagram_ads">Instagram Ads</SelectItem>
                    <SelectItem value="linkedin_ads">LinkedIn Ads</SelectItem>
                    <SelectItem value="tiktok_ads">TikTok Ads</SelectItem>
                    <SelectItem value="microsoft_ads">Microsoft Ads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Campaign Type</Label>
                <Select value={campaignForm.campaign_type} onValueChange={(v) => setCampaignForm({ ...campaignForm, campaign_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="search">Search</SelectItem>
                    <SelectItem value="display">Display</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="shopping">Shopping</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Daily Budget ($)</Label>
                <Input
                  type="number"
                  value={campaignForm.daily_budget}
                  onChange={(e) => setCampaignForm({ ...campaignForm, daily_budget: e.target.value })}
                  placeholder="100.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Total Budget ($)</Label>
                <Input
                  type="number"
                  value={campaignForm.total_budget}
                  onChange={(e) => setCampaignForm({ ...campaignForm, total_budget: e.target.value })}
                  placeholder="3000.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {campaignStartDate ? format(campaignStartDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={campaignStartDate}
                      onSelect={(date) => {
                        setCampaignStartDate(date);
                        if (date) {
                          setCampaignForm({ ...campaignForm, start_date: format(date, 'yyyy-MM-dd') });
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {campaignEndDate ? format(campaignEndDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={campaignEndDate}
                      onSelect={(date) => {
                        setCampaignEndDate(date);
                        if (date) {
                          setCampaignForm({ ...campaignForm, end_date: format(date, 'yyyy-MM-dd') });
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Targeting Summary</Label>
              <Textarea
                value={campaignForm.targeting_summary}
                onChange={(e) => setCampaignForm({ ...campaignForm, targeting_summary: e.target.value })}
                placeholder="Age: 25-45, Location: USA, Interests: Technology"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={campaignForm.status} onValueChange={(v: any) => setCampaignForm({ ...campaignForm, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateCampaignOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                createCampaignMutation.mutate({
                  name: campaignForm.name,
                  platform: campaignForm.platform,
                  campaign_type: campaignForm.campaign_type,
                  daily_budget: parseFloat(campaignForm.daily_budget),
                  total_budget: parseFloat(campaignForm.total_budget || '0'),
                  start_date: campaignForm.start_date,
                  end_date: campaignForm.end_date || undefined,
                  targeting_summary: campaignForm.targeting_summary,
                  status: campaignForm.status,
                });
              }}
              disabled={!campaignForm.name || !campaignForm.daily_budget}
            >
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
