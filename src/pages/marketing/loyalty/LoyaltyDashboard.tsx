import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Gift,
    Award,
    Star,
    TrendingUp,
    Users,
    Settings,
    Plus,
    History,
    Zap,
    Heart,
    DollarSign,
    Percent,
    Coffee,
    ArrowRight,
    Search,
    Save,
    Edit2,
    Trash2,
    X,
    Loader2,
    BarChart3,
    LayoutGrid,
    List,
    RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { loyaltyApi, LoyaltyProgram, LoyaltyReward, LoyaltyTransaction } from '@/services/loyaltyApi';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const chartConfig = {
    points: {
        label: "Points",
        color: "hsl(var(--primary))",
    },
} satisfies ChartConfig;

const chartData = [
    { name: "Jan", points: 400 },
    { name: "Feb", points: 700 },
    { name: "Mar", points: 450 },
    { name: "Apr", points: 900 },
    { name: "May", points: 650 },
    { name: "Jun", points: 800 },
    { name: "Jul", points: 500 },
];

const LoyaltyDashboard = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['loyaltyStats'],
        queryFn: loyaltyApi.getStats
    });

    const { data: program, isLoading: programLoading } = useQuery({
        queryKey: ['loyaltyProgram'],
        queryFn: loyaltyApi.getProgram
    });

    const { data: rewards, isLoading: rewardsLoading } = useQuery({
        queryKey: ['loyaltyRewards'],
        queryFn: loyaltyApi.getRewards
    });

    const { data: transactions, isLoading: transactionsLoading } = useQuery({
        queryKey: ['loyaltyTransactions'],
        queryFn: () => loyaltyApi.getTransactions()
    });

    const updateProgramMutation = useMutation({
        mutationFn: loyaltyApi.updateProgram,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyaltyProgram'] });
            toast.success('Loyalty program updated');
        }
    });

    const [programForm, setProgramForm] = useState<Partial<LoyaltyProgram>>({});

    React.useEffect(() => {
        if (program) setProgramForm(program);
    }, [program]);

    // Reward Mutation
    const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
    const [selectedReward, setSelectedReward] = useState<Partial<LoyaltyReward> | null>(null);
    const rewardMutation = useMutation({
        mutationFn: async (data: Partial<LoyaltyReward>) => {
            if (data.id) return loyaltyApi.updateReward(data.id, data);
            return loyaltyApi.createReward(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyaltyRewards'] });
            setIsRewardModalOpen(false);
            toast.success(selectedReward?.id ? 'Reward updated' : 'Reward created');
        }
    });

    const deleteRewardMutation = useMutation({
        mutationFn: loyaltyApi.deleteReward,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyaltyRewards'] });
            toast.success('Reward removed');
        }
    });

    const handleDeleteReward = (id: number) => {
        if (window.confirm('Are you sure you want to remove this reward?')) {
            deleteRewardMutation.mutate(id);
        }
    };

    // Quick Adjustment
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [adjustType, setAdjustType] = useState<'earn' | 'redeem'>('earn');
    const [adjustPoints, setAdjustPoints] = useState('');
    const [selectedContact, setSelectedContact] = useState<{ id: string, name: string } | null>(null);

    const adjustMutation = useMutation({
        mutationFn: loyaltyApi.adjustPoints,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyaltyStats'] });
            queryClient.invalidateQueries({ queryKey: ['loyaltyRewards'] });
            toast.success('Points adjusted successfully');
            setAdjustPoints('');
            setSelectedContact(null);
        }
    });

    const handleAdjustPoints = () => {
        if (!selectedContact || !adjustPoints) {
            toast.error('Please select a customer and enter points');
            return;
        }
        adjustMutation.mutate({
            contact_id: selectedContact.id,
            points: adjustType === 'earn' ? parseInt(adjustPoints) : -Math.abs(parseInt(adjustPoints)),
            type: adjustType === 'earn' ? 'earn' : 'redeem',
            description: `Manual ${adjustType} by staff`
        });
    };

    const handleExportCSV = () => {
        if (!transactions || transactions.length === 0) return;
        const headers = ['Date', 'Contact ID', 'Type', 'Description', 'Points'];
        const rows = transactions.map(tx => [
            new Date(tx.created_at).toLocaleString(),
            tx.contact_id,
            tx.type,
            tx.description,
            tx.points
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `loyalty_transactions_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Transactions exported successfully');
    };

    // Filtered data for overview
    const recentRedemptions = transactions?.filter(tx => tx.type === 'redeem').slice(0, 5) || [];

    return (
        <div className="space-y-4">
            <Breadcrumb
                items={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Marketing', href: '/marketing/content' },
                    { label: 'Loyalty & Rewards' }
                ]}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">Loyalty & Rewards</h1>
                    <p className="text-muted-foreground text-sm">Boost retention and LTV with an automated points system</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handleExportCSV}>
                        <History className="h-4 w-4 mr-2" />
                        Export History
                    </Button>
                    <Button
                        onClick={() => {
                            setSelectedReward({ name: '', description: '', points_cost: 0, reward_type: 'discount_fixed', reward_value: 0, is_active: true });
                            setIsRewardModalOpen(true);
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Reward
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="overflow-hidden border-none shadow-sm ring-1 ring-border/50 bg-gradient-to-br from-background to-muted/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.1em]">Total Points Issued</p>
                                <div className="flex items-baseline gap-2">
                                    {statsLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold tracking-tight">{stats?.total_earned.toLocaleString() || 0}</p>}
                                    <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full flex items-center">
                                        <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> 12%
                                    </span>
                                </div>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                <Star className="h-5 w-5 fill-current" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-none shadow-sm ring-1 ring-border/50 bg-gradient-to-br from-background to-muted/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.1em]">Total Redeemed</p>
                                {statsLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold tracking-tight">{stats?.total_redeemed.toLocaleString() || 0}</p>}
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Gift className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-none shadow-sm ring-1 ring-border/50 bg-gradient-to-br from-background to-muted/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.1em]">Enrolled Customers</p>
                                {statsLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold tracking-tight">{stats?.enrolled_customers.toLocaleString() || 0}</p>}
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <Users className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`overflow-hidden border-none shadow-sm ring-1 ${program?.is_active ? 'ring-primary/30 bg-primary/5' : 'ring-border/50 bg-muted/20'}`}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.1em]">Program Status</p>
                                {programLoading ? <Skeleton className="h-8 w-24" /> : (
                                    <Badge variant={program?.is_active ? 'default' : 'secondary'} className="rounded-full px-3 py-0">
                                        {program?.is_active ? 'Active' : 'Idle'}
                                    </Badge>
                                )}
                            </div>
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${program?.is_active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                <Award className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-lg">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="rewards">Rewards Library</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="settings">Rules</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 border-none shadow-sm ring-1 ring-border/50">
                            <CardHeader className="pb-0">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 text-primary" />
                                            Growth & Engagement
                                        </CardTitle>
                                        <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">Points circulation over time</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 pt-6">
                                <div className="h-[280px] w-full px-4">
                                    <ChartContainer config={chartConfig} className="h-full w-full">
                                        <AreaChart data={chartData} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--color-points)" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="var(--color-points)" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor', opacity: 0.4 }}
                                                dy={10}
                                            />
                                            <YAxis hide />
                                            <Tooltip content={<ChartTooltipContent hideLabel />} />
                                            <Area
                                                type="monotone"
                                                dataKey="points"
                                                stroke="var(--color-points)"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorPoints)"
                                            />
                                        </AreaChart>
                                    </ChartContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm ring-1 ring-border/50 bg-gradient-to-br from-background to-accent/5">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 opacity-60">
                                    <Zap className="h-4 w-4 text-yellow-500 fill-current" />
                                    Quick Adjustments
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2 text-xs">
                                    <Label className="font-bold text-[10px] uppercase tracking-widest opacity-60">Search Customer</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            className="pl-9 h-9 text-xs"
                                            placeholder="Find customer..."
                                            value={searchQuery}
                                            onChange={async (e) => {
                                                setSearchQuery(e.target.value);
                                                if (e.target.value.length > 2) {
                                                    const results = await loyaltyApi.searchContacts(e.target.value);
                                                    setSearchResults(results);
                                                } else {
                                                    setSearchResults([]);
                                                }
                                            }}
                                        />
                                        {searchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border/50 rounded-lg overflow-hidden shadow-2xl z-50 divide-y divide-border/20 backdrop-blur-xl">
                                                {searchResults.map((contact) => (
                                                    <button
                                                        key={contact.id}
                                                        className="w-full px-4 py-3 text-left hover:bg-muted/50 flex flex-col transition-colors"
                                                        onClick={() => {
                                                            setSelectedContact({ id: contact.id.toString(), name: contact.name || `${contact.firstName} ${contact.lastName}` });
                                                            setSearchResults([]);
                                                            setSearchQuery('');
                                                        }}
                                                    >
                                                        <span className="text-xs font-bold leading-tight">{contact.name || `${contact.firstName} ${contact.lastName}`}</span>
                                                        <span className="text-[10px] text-muted-foreground font-medium opacity-60">{contact.email}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {selectedContact && (
                                        <div className="flex items-center justify-between bg-primary/10 p-2.5 rounded-lg text-[10px] font-black text-primary border border-primary/20 shadow-sm animate-in fade-in slide-in-from-top-1">
                                            <span className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                                ACTIVE: {selectedContact.name}
                                            </span>
                                            <X className="h-3.5 w-3.5 cursor-pointer hover:scale-110 transition-transform" onClick={() => setSelectedContact(null)} />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-[10px] uppercase tracking-widest opacity-60">Points Amount</Label>
                                    <Input
                                        className="h-9 text-xs font-bold"
                                        type="number"
                                        placeholder="Enter amount..."
                                        value={adjustPoints}
                                        onChange={(e) => setAdjustPoints(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant={adjustType === 'earn' ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-8 text-[10px] font-black uppercase tracking-widest"
                                        onClick={() => setAdjustType('earn')}
                                    >
                                        <Plus className="h-3 w-3 mr-1.5" /> Award
                                    </Button>
                                    <Button
                                        variant={adjustType === 'redeem' ? 'destructive' : 'outline'}
                                        size="sm"
                                        className="h-8 text-[10px] font-black uppercase tracking-widest"
                                        onClick={() => setAdjustType('redeem')}
                                    >
                                        <History className="h-3 w-3 mr-1.5" /> Deduct
                                    </Button>
                                </div>
                                <Button
                                    className="w-full h-10 mt-2 font-black uppercase tracking-[0.1em] text-[10px]"
                                    onClick={handleAdjustPoints}
                                    disabled={adjustMutation.isPending || !selectedContact}
                                >
                                    {adjustMutation.isPending ? <Loader2 className="animate-spin h-3 w-3" /> : 'Process Transaction'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-none shadow-sm ring-1 ring-border/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground">
                                    <Heart className="h-3.5 w-3.5 text-pink-500" />
                                    Top Earners
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/30">
                                    {statsLoading ? (
                                        [1, 2, 3].map(i => (
                                            <div key={i} className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Skeleton className="h-10 w-10 rounded-full" />
                                                    <div className="space-y-1">
                                                        <Skeleton className="h-4 w-24" />
                                                        <Skeleton className="h-3 w-16" />
                                                    </div>
                                                </div>
                                                <Skeleton className="h-6 w-16" />
                                            </div>
                                        ))
                                    ) : (
                                        [1, 2, 3].map(i => (
                                            <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group cursor-default">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-[10px] text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                                        {i === 1 ? '🥇' : i === 2 ? '🥈' : '🥉'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold">Customer #{i + 10}42</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Member</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-primary">{(5000 - i * 500).toLocaleString()} <span className="text-[10px] font-medium opacity-70">pts</span></p>
                                                    <p className="text-[10px] font-bold text-muted-foreground/50">${((5000 - i * 500) * 0.01).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm ring-1 ring-border/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground">
                                    <Gift className="h-3.5 w-3.5 text-primary" />
                                    Recent Redemptions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/30">
                                    {transactionsLoading ? (
                                        [1, 2, 3].map(i => (
                                            <div key={i} className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Skeleton className="h-10 w-10 rounded-full" />
                                                    <div className="space-y-1">
                                                        <Skeleton className="h-4 w-32" />
                                                        <Skeleton className="h-3 w-20" />
                                                    </div>
                                                </div>
                                                <Skeleton className="h-6 w-16 rounded-full" />
                                            </div>
                                        ))
                                    ) : recentRedemptions.length > 0 ? recentRedemptions.map(tx => (
                                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-default">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                                    <Zap className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate max-w-[180px]">{tx.description}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{new Date(tx.created_at).toLocaleDateString()} • {tx.contact_id}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-primary font-bold border-primary/20 bg-primary/5 rounded-full px-2.5">-{tx.points} pts</Badge>
                                        </div>
                                    )) : (
                                        <div className="p-12 flex flex-col items-center justify-center text-center opacity-40">
                                            <History className="h-8 w-8 mb-2" />
                                            <p className="text-xs font-bold uppercase tracking-widest">No Recent Redemptions</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="rewards" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rewardsLoading ? (
                            [1, 2, 3].map(i => <Card key={i} className="h-[250px] animate-pulse bg-muted/20" />)
                        ) : rewards?.length === 0 ? (
                            <Card className="col-span-full border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-20">
                                    <div className="p-4 rounded-full bg-primary/10 mb-6">
                                        <Gift className="h-16 w-16 text-primary" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3">No rewards defined yet</h3>
                                    <p className="text-muted-foreground mb-8 text-center max-w-md">Add items or discounts that customers can redeem with their points.</p>
                                    <Button
                                        onClick={() => {
                                            setSelectedReward({ name: '', description: '', points_cost: 0, reward_type: 'discount_fixed', reward_value: 0, is_active: true });
                                            setIsRewardModalOpen(true);
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add Your First Reward
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            rewards?.map(reward => (
                                <Card key={reward.id} className="group relative overflow-hidden border-none shadow-sm ring-1 ring-border/50 hover:ring-primary/50 transition-all duration-500 bg-gradient-to-br from-background to-muted/10">
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex gap-1.5 bg-background/80 backdrop-blur-md rounded-lg p-1 border shadow-sm">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-md"
                                                onClick={() => {
                                                    setSelectedReward(reward);
                                                    setIsRewardModalOpen(true);
                                                }}
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-md text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDeleteReward(reward.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <CardHeader className="pb-3 pt-6 px-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner ${reward.reward_type === 'discount_fixed' ? 'bg-green-500/10 text-green-600' :
                                                reward.reward_type === 'discount_percent' ? 'bg-blue-500/10 text-blue-600' :
                                                    'bg-purple-500/10 text-purple-600'
                                                }`}>
                                                {reward.reward_type === 'discount_fixed' ? <DollarSign className="h-5 w-5" /> :
                                                    reward.reward_type === 'discount_percent' ? <Percent className="h-5 w-5" /> :
                                                        <Coffee className="h-5 w-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <Badge variant={reward.is_active ? 'default' : 'secondary'} className="rounded-full text-[9px] font-black uppercase px-2 py-0 mb-1 leading-none h-4">
                                                    {reward.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                                <h3 className="text-sm font-black truncate">{reward.name}</h3>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-6 pb-6">
                                        <p className="text-[11px] text-muted-foreground line-clamp-2 mb-6 min-h-[32px] leading-relaxed font-medium opacity-80">{reward.description}</p>

                                        <div className="pt-4 border-t border-border/30 flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest mb-0.5 opacity-50">Points Required</p>
                                                <p className="text-xl font-black text-primary tracking-tighter">{reward.points_cost.toLocaleString()} <span className="text-[10px] opacity-40">pts</span></p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest mb-0.5 opacity-50">Value</p>
                                                <p className="text-sm font-bold opacity-80">
                                                    {reward.reward_type === 'discount_percent' ? `${reward.reward_value}% OFF` :
                                                        reward.reward_type === 'discount_fixed' ? `$${reward.reward_value} OFF` :
                                                            'COMPLIMENTARY'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${reward.is_active ? 'bg-primary' : 'bg-muted'}`} />
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-6">
                    <Card className="border-none shadow-sm ring-1 ring-border/50 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 pb-4">
                            <div>
                                <CardTitle className="text-lg font-bold">Transaction History</CardTitle>
                                <CardDescription className="text-xs">All point earnings and redemptions</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-8 text-xs">
                                <History className="h-3.5 w-3.5 mr-2" /> Export CSV
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[180px] uppercase text-[10px] font-bold tracking-wider">Date</TableHead>
                                        <TableHead className="uppercase text-[10px] font-bold tracking-wider">Customer</TableHead>
                                        <TableHead className="uppercase text-[10px] font-bold tracking-wider">Operation</TableHead>
                                        <TableHead className="uppercase text-[10px] font-bold tracking-wider">Description</TableHead>
                                        <TableHead className="text-right uppercase text-[10px] font-bold tracking-wider">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactionsLoading ? (
                                        [1, 2, 3, 4, 5].map(i => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                                <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : transactions?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                                    <List className="h-8 w-8 mb-2" />
                                                    <p className="text-xs font-bold uppercase tracking-widest">No activities recorded</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transactions?.map((tx) => (
                                            <TableRow key={tx.id} className="hover:bg-muted/20 transition-colors">
                                                <TableCell className="text-muted-foreground font-medium">{new Date(tx.created_at).toLocaleString()}</TableCell>
                                                <TableCell className="font-bold">USR-{tx.contact_id.toString().slice(-4)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className={`uppercase text-[9px] font-black px-2 py-0 rounded-full ${tx.type === 'earn' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                                        tx.type === 'redeem' ? 'bg-primary/10 text-primary border-primary/20' :
                                                            'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                                        }`}>
                                                        {tx.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground italic truncate max-w-[250px]">{tx.description}</TableCell>
                                                <TableCell className={`text-sm font-black text-right ${tx.points > 0 ? 'text-green-600' : 'text-primary'}`}>
                                                    {tx.points > 0 ? '+' : ''}{tx.points.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                    <Card className="border-none shadow-sm ring-1 ring-border/50 overflow-hidden">
                        <CardHeader className="bg-muted/20 border-b pb-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Settings className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-black tracking-tight">Program Configuration</CardTitle>
                                    <CardDescription className="text-xs font-medium">Control the mechanics and branding of your loyalty system</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-8">
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Brand Identity</h4>
                                        <div className="space-y-4 pt-2">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold opacity-70">Program Name</Label>
                                                <Input
                                                    className="h-10 text-xs font-medium"
                                                    value={programForm.name || ''}
                                                    onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                                                    placeholder="e.g. Platinum Rewards"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold opacity-70">Program Description</Label>
                                                <Textarea
                                                    value={programForm.description || ''}
                                                    onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                                                    className="min-h-[140px] text-xs leading-relaxed"
                                                    placeholder="Explain how customers earn and spend points..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Point Ecosystem</h4>
                                        <div className="space-y-4 pt-2 bg-muted/30 p-6 rounded-2xl border border-border/50">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <Label className="text-xs font-bold">Points Multiplier</Label>
                                                    <p className="text-[10px] text-muted-foreground font-medium">Value of 1 point (e.g. 0.01 = $0.01)</p>
                                                </div>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                                    <Input
                                                        type="number"
                                                        step="0.001"
                                                        className="w-24 text-right h-9 text-xs font-bold pl-6"
                                                        value={programForm.points_to_currency_ratio || 0.01}
                                                        onChange={(e) => setProgramForm({ ...programForm, points_to_currency_ratio: parseFloat(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <Label className="text-xs font-bold">Sign-up Bonus</Label>
                                                    <p className="text-[10px] text-muted-foreground font-medium">Points awarded upon enrollment</p>
                                                </div>
                                                <Input
                                                    type="number"
                                                    className="w-24 text-right h-9 text-xs font-bold"
                                                    value={programForm.signup_bonus || 0}
                                                    onChange={(e) => setProgramForm({ ...programForm, signup_bonus: parseInt(e.target.value) })}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <Label className="text-xs font-bold">Birthday Bonus</Label>
                                                    <p className="text-[10px] text-muted-foreground font-medium">Annual birthday reward points</p>
                                                </div>
                                                <Input
                                                    type="number"
                                                    className="w-24 text-right h-9 text-xs font-bold"
                                                    value={programForm.birthday_bonus || 0}
                                                    onChange={(e) => setProgramForm({ ...programForm, birthday_bonus: parseInt(e.target.value) })}
                                                />
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label className="text-xs font-bold">System Status</Label>
                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Master Switch</p>
                                                </div>
                                                <Switch
                                                    checked={programForm.is_active}
                                                    onCheckedChange={(val) => setProgramForm({ ...programForm, is_active: val })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 border-t border-border/20">
                                <Button className="px-10 h-11 font-black uppercase tracking-[0.15em] text-[10px]" onClick={() => updateProgramMutation.mutate(programForm)}>
                                    <Save className="h-4 w-4 mr-2" /> Commit Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isRewardModalOpen} onOpenChange={setIsRewardModalOpen}>
                <DialogContent className="max-w-md border-none shadow-2xl ring-1 ring-border/50">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-xl font-black tracking-tight">{selectedReward?.id ? 'Edit Reward' : 'Create New Reward'}</DialogTitle>
                        <DialogDescription className="text-xs font-medium uppercase tracking-widest opacity-60">Define customer redemption rules</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Reward Name</Label>
                            <Input
                                className="h-10 text-xs font-bold"
                                value={selectedReward?.name || ''}
                                onChange={(e) => setSelectedReward({ ...selectedReward, name: e.target.value })}
                                placeholder="e.g. VIP Gift Card"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Internal Description</Label>
                            <Textarea
                                className="text-xs min-h-[100px] leading-relaxed"
                                value={selectedReward?.description || ''}
                                onChange={(e) => setSelectedReward({ ...selectedReward, description: e.target.value })}
                                placeholder="Public description of the reward..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Points Cost</Label>
                                <Input
                                    className="h-10 text-xs font-bold"
                                    type="number"
                                    value={selectedReward?.points_cost || ''}
                                    onChange={(e) => setSelectedReward({ ...selectedReward, points_cost: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Reward Type</Label>
                                <Select
                                    value={selectedReward?.reward_type || 'discount_fixed'}
                                    onValueChange={(val) => setSelectedReward({ ...selectedReward, reward_type: val as any })}
                                >
                                    <SelectTrigger className="h-10 text-xs font-bold uppercase tracking-wider">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="discount_fixed" className="text-xs font-bold">Fixed Discount ($)</SelectItem>
                                        <SelectItem value="discount_percent" className="text-xs font-bold">Percentage (%)</SelectItem>
                                        <SelectItem value="free_product" className="text-xs font-bold">Free Product</SelectItem>
                                        <SelectItem value="gift_card" className="text-xs font-bold">Gift Card</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Reward Value</Label>
                            <div className="relative">
                                {selectedReward?.reward_type === 'discount_fixed' && <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />}
                                <Input
                                    className={`h-10 text-xs font-bold ${selectedReward?.reward_type === 'discount_fixed' ? 'pl-9' : ''}`}
                                    type="number"
                                    value={selectedReward?.reward_value || ''}
                                    onChange={(e) => setSelectedReward({ ...selectedReward, reward_value: parseFloat(e.target.value) })}
                                />
                                {selectedReward?.reward_type === 'discount_percent' && <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                            <div className="space-y-0.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none">Visibility</Label>
                                <p className="text-[10px] font-medium text-muted-foreground">Make this reward available for redemption</p>
                            </div>
                            <Switch
                                checked={selectedReward?.is_active}
                                onCheckedChange={(val) => setSelectedReward({ ...selectedReward, is_active: val })}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button variant="ghost" onClick={() => setIsRewardModalOpen(false)} className="text-[10px] font-black uppercase tracking-widest">Discard</Button>
                        <Button onClick={() => rewardMutation.mutate(selectedReward || {})} className="px-8 font-black uppercase tracking-[0.1em] text-[10px]">
                            {rewardMutation.isPending ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : 'Save Reward'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LoyaltyDashboard;
