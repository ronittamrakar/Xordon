import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { affiliatesApi, Affiliate, AffiliateReferral, AffiliatePayout } from '@/services/affiliatesApi';
import {
    Gift,
    Users,
    DollarSign,
    Link,
    Copy,
    TrendingUp,
    Plus,
    MoreVertical,
    Mail,
    Award,
    BarChart3,
    Settings,
    Loader2,
    Download,
    CheckCircle2,
    XCircle,
    Info,
} from 'lucide-react';

const AffiliatePage: React.FC = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isPayoutOpen, setIsPayoutOpen] = useState(false);
    const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
    const [activeTab, setActiveTab] = useState('affiliates');

    const [newAffiliate, setNewAffiliate] = useState({
        name: '',
        email: '',
        commission_rate: '20',
        welcome_message: '',
    });

    const [payoutData, setPayoutData] = useState({
        amount: '',
        method: 'paypal',
        reference: '',
        notes: '',
    });

    // Queries
    const { data: affiliates = [], isLoading: affiliatesLoading } = useQuery({
        queryKey: ['affiliates'],
        queryFn: () => affiliatesApi.getAffiliates(),
    });

    const { data: referrals = [] } = useQuery({
        queryKey: ['affiliate-referrals'],
        queryFn: () => affiliatesApi.getReferrals().then(r => r.data),
    });

    const { data: payouts = [] } = useQuery({
        queryKey: ['affiliate-payouts'],
        queryFn: () => affiliatesApi.getPayouts(),
    });

    const { data: analytics } = useQuery({
        queryKey: ['affiliate-analytics'],
        queryFn: () => affiliatesApi.getAnalytics(),
    });

    const { data: dbSettings } = useQuery({
        queryKey: ['affiliate-settings'],
        queryFn: () => affiliatesApi.getSettings(),
    });

    const [settings, setSettings] = useState({
        default_commission_rate: '20',
        cookie_duration_days: '30',
        min_payout_amount: '50',
    });

    useEffect(() => {
        if (dbSettings) {
            setSettings({
                default_commission_rate: String(dbSettings.default_commission_rate),
                cookie_duration_days: String(dbSettings.cookie_duration_days),
                min_payout_amount: String(dbSettings.min_payout_amount),
            });
        }
    }, [dbSettings]);

    // Mutations
    const createAffiliateMutation = useMutation({
        mutationFn: (data: typeof newAffiliate) => affiliatesApi.createAffiliate({
            name: data.name,
            email: data.email,
            commission_rate: parseFloat(data.commission_rate),
            welcome_message: data.welcome_message || undefined,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['affiliates'] });
            queryClient.invalidateQueries({ queryKey: ['affiliate-analytics'] });
            setIsAddOpen(false);
            setNewAffiliate({ name: '', email: '', commission_rate: '20', welcome_message: '' });
            toast({ title: 'Affiliate invited successfully' });
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to invite affiliate',
                description: error?.message || 'An error occurred',
                variant: 'destructive'
            });
        },
    });

    const updateSettingsMutation = useMutation({
        mutationFn: (data: typeof settings) => affiliatesApi.updateSettings({
            default_commission_rate: parseFloat(data.default_commission_rate),
            cookie_duration_days: parseInt(data.cookie_duration_days),
            min_payout_amount: parseFloat(data.min_payout_amount),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['affiliate-settings'] });
            setIsSettingsOpen(false);
            toast({ title: 'Settings saved successfully' });
        },
    });

    const createPayoutMutation = useMutation({
        mutationFn: (data: any) => affiliatesApi.createPayout(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['affiliates'] });
            queryClient.invalidateQueries({ queryKey: ['affiliate-payouts'] });
            queryClient.invalidateQueries({ queryKey: ['affiliate-analytics'] });
            setIsPayoutOpen(false);
            setPayoutData({ amount: '', method: 'paypal', reference: '', notes: '' });
            toast({ title: 'Payout processed successfully' });
        },
        onError: (error: any) => {
            toast({
                title: 'Payout failed',
                description: error?.message || 'An error occurred',
                variant: 'destructive'
            });
        },
    });

    const totalAffiliates = analytics?.affiliates?.total || affiliates.length;
    const activeAffiliates = analytics?.affiliates?.active || affiliates.filter(a => a.status === 'active').length;
    const totalReferrals = analytics?.referrals?.total || 0;
    const totalEarnings = analytics?.payouts?.total_paid || 0;
    const pendingPayouts = analytics?.payouts?.pending_amount || affiliates.reduce((sum, a) => sum + a.unpaid_balance, 0);

    const getStatusBadge = (status: Affiliate['status']) => {
        const colors: Record<string, string> = {
            active: 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400 border-green-200',
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400 border-yellow-200',
            inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-500/10 dark:text-gray-400 border-gray-200',
            suspended: 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400 border-red-200',
        };
        return <Badge variant="outline" className={`${colors[status] || 'bg-gray-100 text-gray-800'} border`}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
    };

    const handleCopyLink = (code: string) => {
        const url = `${window.location.origin}/ref/${code}`;
        navigator.clipboard.writeText(url);
        toast({ title: 'Referral link copied!' });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Affiliate Program</h1>
                    <p className="text-muted-foreground">Manage your affiliate partners and track referrals</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="gap-2" onClick={() => affiliatesApi.exportPayouts()}>
                        <Download className="h-4 w-4" />
                        Export Payouts
                    </Button>
                    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Settings className="h-4 w-4" />
                                Settings
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Affiliate Program Settings</DialogTitle>
                                <DialogDescription>Configure default settings for your affiliate program</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label>Default Commission Rate (%)</Label>
                                    <Input
                                        type="number"
                                        value={settings.default_commission_rate}
                                        onChange={(e) => setSettings({ ...settings, default_commission_rate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Cookie Duration (days)</Label>
                                    <Input
                                        type="number"
                                        value={settings.cookie_duration_days}
                                        onChange={(e) => setSettings({ ...settings, cookie_duration_days: e.target.value })}
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">How long referral cookies remain active</p>
                                </div>
                                <div>
                                    <Label>Minimum Payout Amount ($)</Label>
                                    <Input
                                        type="number"
                                        value={settings.min_payout_amount}
                                        onChange={(e) => setSettings({ ...settings, min_payout_amount: e.target.value })}
                                    />
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={() => updateSettingsMutation.mutate(settings)}
                                    disabled={updateSettingsMutation.isPending}
                                >
                                    {updateSettingsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Save Settings
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Affiliate
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Affiliate</DialogTitle>
                                <DialogDescription>
                                    Invite a new affiliate partner to your program
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label>Name</Label>
                                    <Input
                                        placeholder="Full name"
                                        value={newAffiliate.name}
                                        onChange={(e) => setNewAffiliate({ ...newAffiliate, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        placeholder="affiliate@example.com"
                                        value={newAffiliate.email}
                                        onChange={(e) => setNewAffiliate({ ...newAffiliate, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Commission Rate (%)</Label>
                                    <Input
                                        type="number"
                                        placeholder="20"
                                        value={newAffiliate.commission_rate}
                                        onChange={(e) => setNewAffiliate({ ...newAffiliate, commission_rate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Welcome Message</Label>
                                    <Textarea
                                        placeholder="Optional welcome message..."
                                        value={newAffiliate.welcome_message}
                                        onChange={(e) => setNewAffiliate({ ...newAffiliate, welcome_message: e.target.value })}
                                    />
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={() => createAffiliateMutation.mutate(newAffiliate)}
                                    disabled={!newAffiliate.name || !newAffiliate.email || createAffiliateMutation.isPending}
                                >
                                    {createAffiliateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    <Mail className="h-4 w-4 mr-2" />
                                    Send Invitation
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold uppercase tracking-tight">{totalAffiliates}</p>
                                <p className="text-xs text-muted-foreground font-medium uppercase">Total Affiliates</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow uppercase">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                                <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold uppercase tracking-tight">{activeAffiliates}</p>
                                <p className="text-xs text-muted-foreground font-medium uppercase">Active Partners</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow uppercase">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold uppercase tracking-tight">{totalReferrals}</p>
                                <p className="text-xs text-muted-foreground font-medium uppercase">Total Referrals</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow uppercase">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <DollarSign className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xl font-bold uppercase tracking-tight">${totalEarnings.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground font-medium uppercase">Total Paid Out</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow border-primary/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Gift className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xl font-bold uppercase tracking-tight text-primary">${pendingPayouts.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground font-medium uppercase">Pending Payments</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-card rounded-xl border shadow-sm p-1">
                <TabsList className="bg-transparent border-b rounded-none px-4 w-full justify-start gap-4">
                    <TabsTrigger value="affiliates" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-2 py-3">Affiliates</TabsTrigger>
                    <TabsTrigger value="referrals" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-2 py-3">Referrals</TabsTrigger>
                    <TabsTrigger value="payouts" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-2 py-3">Payouts</TabsTrigger>
                    <TabsTrigger value="links" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-2 py-3">Referral Links</TabsTrigger>
                </TabsList>

                <TabsContent value="affiliates" className="p-0">
                    <div className="overflow-x-auto">
                        {affiliatesLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : affiliates.length === 0 ? (
                            <div className="text-center py-20 bg-muted/30">
                                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <Users className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium">No affiliates yet</h3>
                                <p className="text-muted-foreground max-w-xs mx-auto mt-1">Invite your first partner to start growing your revenue with affiliates.</p>
                                <Button className="mt-6" onClick={() => setIsAddOpen(true)}>Invite Partner</Button>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b">
                                    <tr className="text-left text-muted-foreground font-medium uppercase tracking-wider">
                                        <th className="p-4 px-6 font-semibold">Affiliate</th>
                                        <th className="p-4 font-semibold text-center">Status</th>
                                        <th className="p-4 font-semibold text-center">Referrals</th>
                                        <th className="p-4 font-semibold text-right">Total Earnings</th>
                                        <th className="p-4 font-semibold text-right text-primary">Unpaid Balance</th>
                                        <th className="p-4 font-semibold">Joined</th>
                                        <th className="p-4 px-6 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {affiliates.map(affiliate => (
                                        <tr key={affiliate.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                            <td className="p-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {affiliate.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-foreground">{affiliate.name}</p>
                                                        <p className="text-xs text-muted-foreground">{affiliate.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">{getStatusBadge(affiliate.status)}</td>
                                            <td className="p-4 text-center font-bold">{affiliate.total_referrals}</td>
                                            <td className="p-4 text-right font-semibold">${Number(affiliate.total_earnings).toLocaleString()}</td>
                                            <td className="p-4 text-right font-bold text-primary">${Number(affiliate.unpaid_balance).toLocaleString()}</td>
                                            <td className="p-4 text-muted-foreground whitespace-nowrap">{new Date(affiliate.created_at).toLocaleDateString()}</td>
                                            <td className="p-4 px-6 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuItem onClick={() => handleCopyLink(affiliate.unique_code)}>
                                                            <Link className="h-4 w-4 mr-2" /> Copy Link
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => {
                                                            navigator.clipboard.writeText(affiliate.unique_code);
                                                            toast({ title: 'Referral code copied!' });
                                                        }}>
                                                            <Copy className="h-4 w-4 mr-2" /> Copy Code
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => toast({ title: 'Analytics for ' + affiliate.name + ' coming soon' })}>
                                                            <BarChart3 className="h-4 w-4 mr-2" /> View Analytics
                                                        </DropdownMenuItem>
                                                        {affiliate.unpaid_balance > 0 && (
                                                            <DropdownMenuItem
                                                                className="text-primary focus:text-primary font-semibold"
                                                                onClick={() => {
                                                                    setSelectedAffiliate(affiliate);
                                                                    setPayoutData({
                                                                        ...payoutData,
                                                                        amount: String(affiliate.unpaid_balance)
                                                                    });
                                                                    setIsPayoutOpen(true);
                                                                }}
                                                            >
                                                                <DollarSign className="h-4 w-4 mr-2" /> Create Payout
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="referrals" className="p-0">
                    <Card className="border-0 shadow-none">
                        <CardHeader className="px-6 py-6 border-b">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl">All Referrals</CardTitle>
                                    <CardDescription>Comprehensive list of all affiliate tracked conversions</CardDescription>
                                </div>
                                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase">
                                    {referrals.length} Total Tracking Events
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {referrals.length === 0 ? (
                                <div className="text-center py-20">
                                    <Info className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No referrals recorded yet</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {referrals.map((referral: AffiliateReferral) => (
                                        <div key={referral.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 px-6 hover:bg-muted/30 transition-colors">
                                            <div className="flex gap-4">
                                                <div className={`mt-1 h-3 w-3 rounded-full ${referral.status === 'converted' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]'}`} />
                                                <div>
                                                    <p className="font-bold text-base leading-tight">
                                                        {referral.customer_name || referral.customer_email || 'Anonymous Visitor'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                        <span className="font-medium text-primary underline decoration-primary/20">{referral.affiliate_name}</span>
                                                        <span>•</span>
                                                        <span>{new Date(referral.referred_at).toLocaleDateString()} at {new Date(referral.referred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 md:mt-0 flex items-center gap-6 justify-between md:justify-end">
                                                <div className="text-right">
                                                    <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-1">Commission</p>
                                                    <p className="text-lg font-bold text-foreground">
                                                        {(() => {
                                                            const amt = Number(referral.commission_amount);
                                                            return Number.isFinite(amt) ? `$${amt.toFixed(2)}` : '$0.00';
                                                        })()}
                                                    </p>
                                                </div>
                                                <Badge className={`uppercase text-[12px] font-bold tracking-widest px-2 py-0.5 ${referral.status === 'converted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {referral.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payouts" className="p-0">
                    <Card className="border-0 shadow-none">
                        <CardHeader className="px-6 py-6 border-b flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">Payout History</CardTitle>
                                <CardDescription>Track payments made to your partners</CardDescription>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Amount Due</p>
                                <p className="text-xl font-bold text-primary">${pendingPayouts.toLocaleString()}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {payouts.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground">
                                    <DollarSign className="h-8 w-8 mx-auto mb-4 opacity-20" />
                                    No payout history yet
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/30 border-b">
                                            <tr className="text-left text-muted-foreground uppercase tracking-wider text-xs font-bold">
                                                <th className="p-4 px-6">Affiliate</th>
                                                <th className="p-4">Process Date</th>
                                                <th className="p-4">Method</th>
                                                <th className="p-4">Reference</th>
                                                <th className="p-4 text-right">Amount Paid</th>
                                                <th className="p-4 text-center px-6">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payouts.map((payout: AffiliatePayout) => (
                                                <tr key={payout.id} className="border-b last:border-0 hover:bg-muted/20">
                                                    <td className="p-4 px-6 font-bold uppercase tracking-tight">{payout.affiliate_name}</td>
                                                    <td className="p-4 text-muted-foreground">{new Date(payout.created_at).toLocaleDateString()}</td>
                                                    <td className="p-4 font-medium uppercase text-xs tracking-widest bg-muted/30 inline-block px-2 py-0.5 rounded mt-3 mb-3 mx-4 outline outline-1 outline-border select-none">
                                                        {payout.payment_method || 'Manual'}
                                                    </td>
                                                    <td className="p-4 text-xs font-mono text-muted-foreground">{payout.payment_reference || '-'}</td>
                                                    <td className="p-4 text-right font-black text-foreground">${Number(payout.amount).toFixed(2)}</td>
                                                    <td className="p-4 text-center px-6">
                                                        <Badge className={`uppercase text-[12px] font-bold px-2 py-0.5 ${payout_status === 'completed' ? 'bg-green-500' :
                                                            payout_status === 'processing' ? 'bg-blue-500' :
                                                                payout_status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                                                            }`}>
                                                            {payout_status}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="links" className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {affiliates.length === 0 ? (
                            <p className="text-muted-foreground col-span-full text-center py-20">No active affiliates to generate links for.</p>
                        ) : (
                            affiliates.map((affiliate) => (
                                <Card key={affiliate.id} className="overflow-hidden border-border hover:border-primary/40 transition-all group">
                                    <CardHeader className="p-4 bg-muted/30 group-hover:bg-accent transition-colors">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold uppercase tracking-tight text-xs">{affiliate.name}</p>
                                            <Badge variant="outline" className="text-[12px] font-bold uppercase text-primary border-primary/20">
                                                {affiliate.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-3">
                                        <div className="bg-muted p-3 rounded-lg border border-dashed border-muted-foreground/30 relative overflow-hidden">
                                            <p className="text-[12px] font-bold uppercase text-muted-foreground tracking-widest mb-2">Tracking URL</p>
                                            <code className="text-[12px] block break-all font-mono text-primary bg-primary/5 p-2 rounded border border-border">
                                                {window.location.origin}/ref/{affiliate.unique_code}
                                            </code>
                                            <Button
                                                className="mt-4 w-full gap-2 text-xs font-bold bg-foreground hover:bg-foreground/90 py-1"
                                                onClick={() => handleCopyLink(affiliate.unique_code)}
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                                Copy Tracking URL
                                            </Button>
                                        </div>
                                        <div className="flex items-center justify-between text-[12px] font-bold uppercase tracking-widest text-muted-foreground">
                                            <span>Partner Code: {affiliate.unique_code}</span>
                                            <span>Rate: {affiliate.commission_rate}%</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Payout Dialog */}
            <Dialog open={isPayoutOpen} onOpenChange={setIsPayoutOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            < DollarSign className="h-5 w-5 text-primary" />
                            Process Affiliate Payment
                        </DialogTitle>
                        <DialogDescription>
                            Confirm payment for <strong>{selectedAffiliate?.name}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-muted p-4 rounded-xl border border-border text-center">
                            <p className="text-xl font-bold text-primary">${selectedAffiliate?.unpaid_balance.toLocaleString()}</p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="amount" className="font-bold uppercase text-[12px] tracking-widest">Payout Amount ($)</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={payoutData.amount}
                                onChange={(e) => setPayoutData({ ...payoutData, amount: e.target.value })}
                                className="font-bold"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="method" className="font-bold uppercase text-[12px] tracking-widest">Payment Method</Label>
                            <select
                                id="method"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={payoutData.method}
                                onChange={(e) => setPayoutData({ ...payoutData, method: e.target.value })}
                            >
                                <option value="paypal">PayPal</option>
                                <option value="stripe">Stripe Connect</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="check">Physical Check</option>
                                <option value="other">Other / Manual</option>
                            </select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="reference" className="font-bold uppercase text-[12px] tracking-widest">Transaction Reference</Label>
                            <Input
                                id="reference"
                                placeholder="TXN-123456789"
                                value={payoutData.reference}
                                onChange={(e) => setPayoutData({ ...payoutData, reference: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="notes" className="font-bold uppercase text-[12px] tracking-widest">Notes (Internal)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Payment for October referrals..."
                                value={payoutData.notes}
                                onChange={(e) => setPayoutData({ ...payoutData, notes: e.target.value })}
                                className="resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPayoutOpen(false)} disabled={createPayoutMutation.isPending}>Cancel</Button>
                        <Button
                            className="font-bold"
                            onClick={() => {
                                if (!selectedAffiliate) return;
                                createPayoutMutation.mutate({
                                    affiliate_id: selectedAffiliate.id,
                                    amount: parseFloat(payoutData.amount),
                                    payment_method: payoutData.method,
                                    payment_reference: payoutData.reference,
                                    notes: payoutData.notes,
                                    status: 'completed'
                                });
                            }}
                            disabled={createPayoutMutation.isPending || !payoutData.amount || Number(payoutData.amount) <= 0}
                        >
                            {createPayoutMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Mark as Paid
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AffiliatePage;
