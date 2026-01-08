import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    RefreshCw,
    Plus,
    MoreVertical,
    Pencil,
    Trash2,
    Search,
    DollarSign,
    Calendar,
    Settings2,
    CheckCircle2,
    XCircle,
    CreditCard,
    BarChart3 as BarChartIcon,
    ArrowUpRight,
    LayoutGrid,
    List,
    Clock,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import SEO from '@/components/SEO';
import { invoicesApi, Product } from '@/services/invoicesApi';
import { subscriptionsApi, Subscription } from '@/services/subscriptionsApi';
import { toast } from 'sonner';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { SubscriptionDetailDialog } from '@/components/subscriptions/SubscriptionDetailDialog';

const Subscriptions: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

    // Dialog State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Product | null>(null);
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        currency: 'USD',
        recurring_interval: 'monthly',
        recurring_interval_count: '1',
        trial_days: '0',
        setup_fee: '0',
        is_active: true
    });

    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().getFullYear(), 0, 1),
        to: new Date()
    });

    // ==================== QUERIES ====================

    const { data: allProducts = [], isLoading, refetch, isFetching } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: invoicesApi.listProducts,
    });

    // Filter only recurring products for this view
    const products = allProducts.filter(p => p.is_recurring);

    const { data: customerSubsData, isLoading: isSubsLoading } = useQuery({
        queryKey: ['customer-subscriptions'],
        queryFn: () => subscriptionsApi.listSubscriptions(),
    });

    const customerSubscriptions = customerSubsData?.data || [];

    const { data: stats } = useQuery({
        queryKey: ['subscription-stats'],
        queryFn: subscriptionsApi.getStats,
    });

    const { data: analytics } = useQuery({
        queryKey: ['subscription-analytics', dateRange.from, dateRange.to],
        queryFn: () => subscriptionsApi.getAnalytics({
            from: format(dateRange.from, 'yyyy-MM-dd'),
            to: format(dateRange.to, 'yyyy-MM-dd')
        }),
    });

    // ==================== MUTATIONS ====================

    const createMutation = useMutation({
        mutationFn: (data: any) => invoicesApi.createProduct(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
            setIsCreateOpen(false);
            resetForm();
            toast.success('Subscription plan created');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to create plan');
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: number; body: any }) => invoicesApi.updateProduct(data.id, data.body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
            setIsEditOpen(false);
            setSelectedPlan(null);
            resetForm();
            toast.success('Subscription plan updated');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to update plan');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => invoicesApi.deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
            toast.success('Subscription plan deleted');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to delete plan');
        },
    });

    const pauseMutation = useMutation({
        mutationFn: (id: number) => subscriptionsApi.pauseSubscription(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-subscriptions'] });
            queryClient.invalidateQueries({ queryKey: ['subscription-stats'] });
            toast.success('Subscription paused');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to pause subscription');
        },
    });

    const resumeMutation = useMutation({
        mutationFn: (id: number) => subscriptionsApi.resumeSubscription(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-subscriptions'] });
            queryClient.invalidateQueries({ queryKey: ['subscription-stats'] });
            toast.success('Subscription resumed');
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to resume subscription');
        },
    });

    // ==================== HELPERS ====================

    const resetForm = () => {
        setFormData({
            name: '',
            price: '',
            description: '',
            currency: 'USD',
            recurring_interval: 'monthly',
            recurring_interval_count: '1',
            trial_days: '0',
            setup_fee: '0',
            is_active: true
        });
    };

    const handleCreate = () => {
        createMutation.mutate({
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price) || 0,
            currency: formData.currency,
            recurring_interval: formData.recurring_interval,
            recurring_interval_count: parseInt(formData.recurring_interval_count) || 1,
            trial_days: parseInt(formData.trial_days) || 0,
            setup_fee: parseFloat(formData.setup_fee) || 0,
            is_recurring: true,
            is_active: formData.is_active,
            unit: 'plan'
        });
    };

    const handleUpdate = () => {
        if (!selectedPlan) return;
        updateMutation.mutate({
            id: selectedPlan.id,
            body: {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price) || 0,
                currency: formData.currency,
                recurring_interval: formData.recurring_interval,
                recurring_interval_count: parseInt(formData.recurring_interval_count) || 1,
                trial_days: parseInt(formData.trial_days) || 0,
                setup_fee: parseFloat(formData.setup_fee) || 0,
                is_recurring: true,
                is_active: formData.is_active
            }
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this plan?')) {
            deleteMutation.mutate(id);
        }
    };

    const openEdit = (plan: Product) => {
        setSelectedPlan(plan);
        setFormData({
            name: plan.name,
            price: plan.price.toString(),
            description: plan.description || '',
            currency: plan.currency,
            recurring_interval: plan.recurring_interval || 'monthly',
            recurring_interval_count: plan.recurring_interval_count?.toString() || '1',
            trial_days: plan.trial_days?.toString() || '0',
            setup_fee: plan.setup_fee?.toString() || '0',
            is_active: plan.is_active
        });
        setIsEditOpen(true);
    };

    const formatCurrency = (amount: number, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const formatInterval = (interval: string | null, count?: number) => {
        if (!interval) return 'month';
        const intervalMap: Record<string, string> = {
            'daily': 'day',
            'weekly': 'week',
            'monthly': 'month',
            'quarterly': 'quarter',
            'yearly': 'year'
        };
        const base = intervalMap[interval] || interval;
        return count && count > 1 ? `${count} ${base}s` : base;
    };

    const filteredPlans = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            <SEO title="Subscriptions Management" />

            {/* Header section with Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">
                        Subscription Management
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Manage your subscription plans and customer recurring billing.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => refetch()}
                        className="h-11 w-11 rounded-full hover:bg-primary/10 transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw className={cn("h-5 w-5", isFetching && "animate-spin")} />
                    </Button>
                    <div className="h-8 w-[1px] bg-border mx-2 hidden md:block" />
                    <Button
                        onClick={() => { resetForm(); setIsCreateOpen(true); }}
                        className="h-11 px-6 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center gap-2 group"
                    >
                        <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                        New Plan
                    </Button>
                </div>
            </div>
            <Tabs defaultValue="plans" className="space-y-8">
                <TabsList className="bg-muted/50 p-1 rounded-full inline-flex">
                    <TabsTrigger value="plans" className="rounded-full px-8 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        Subscription Plans
                    </TabsTrigger>
                    <TabsTrigger value="active" className="rounded-full px-8 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        Active Subscriptions
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="rounded-full px-8 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        Analytics
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="plans" className="space-y-8 outline-none">
                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-gradient-to-br from-primary/5 via-background to-background border-primary/10 shadow-sm overflow-hidden group">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                    Total Plans
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold tracking-tight">{products.length}</div>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                                    Templates configured
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-primary/5 via-background to-background border-primary/10 shadow-sm overflow-hidden group">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    Active Plans
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold tracking-tight text-green-600">
                                    {products.filter(p => p.is_active).length}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    Ready for customers
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-primary/5 via-background to-background border-primary/10 shadow-sm overflow-hidden group">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                                    Monthly Potential Value
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold tracking-tight text-purple-600">
                                    {formatCurrency(products.reduce((acc, p) => acc + (p.is_active ? p.price : 0), 0))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    Sum of all active plan prices
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Search and View Toggle */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search plans by name or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-12 rounded-xl border-muted bg-muted/20 focus:bg-background transition-all"
                            />
                        </div>
                        <div className="flex bg-muted/50 p-1 rounded-xl">
                            <Button
                                variant={viewMode === 'grid' ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                className={cn("rounded-lg px-4", viewMode === 'grid' && "bg-background shadow-sm")}
                            >
                                <LayoutGrid className="h-4 w-4 mr-2" />
                                Grid
                            </Button>
                            <Button
                                variant={viewMode === 'table' ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode('table')}
                                className={cn("rounded-lg px-4", viewMode === 'table' && "bg-background shadow-sm")}
                            >
                                <List className="h-4 w-4 mr-2" />
                                Table
                            </Button>
                        </div>
                    </div>

                    {/* Data Display */}
                    {
                        isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <RefreshCw className="h-8 w-8 animate-spin text-primary opacity-50" />
                            </div>
                        ) : filteredPlans.length === 0 ? (
                            <Card className="border-dashed py-20">
                                <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <CreditCard className="h-8 w-8" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-semibold">No subscription plans found</h3>
                                        <p className="text-muted-foreground max-w-xs mx-auto">
                                            Create recurring billing plans to start automating your revenue collection.
                                        </p>
                                    </div>
                                    <Button onClick={() => setIsCreateOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" /> Create First Plan
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredPlans.map((plan) => (
                                    <Card key={plan.id} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-primary/10 hover:border-primary/30">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div className="bg-primary/10 p-2 rounded-lg mb-2">
                                                    <CreditCard className="h-5 w-5 text-primary" />
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEdit(plan)}>
                                                            <Pencil className="h-4 w-4 mr-2" /> Edit Plan
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(plan.id)}>
                                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <CardTitle className="text-xl group-hover:text-primary transition-colors">{plan.name}</CardTitle>
                                            <CardDescription className="line-clamp-2 min-h-[40px]">{plan.description || 'No description provided'}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-col space-y-4">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-bold text-foreground">
                                                        {formatCurrency(plan.price, plan.currency)}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground font-medium">
                                                        / {formatInterval(plan.recurring_interval, plan.recurring_interval_count)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between pt-4 border-t border-muted">
                                                    <Badge variant={plan.is_active ? 'default' : 'secondary'} className="capitalize">
                                                        {plan.is_active ? (
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        ) : (
                                                            <XCircle className="h-3 w-3 mr-1" />
                                                        )}
                                                        {plan.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Updated {new Date(plan.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="overflow-hidden border-muted shadow-sm">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="font-semibold">Plan Name</TableHead>
                                            <TableHead className="font-semibold">Description</TableHead>
                                            <TableHead className="font-semibold">Price</TableHead>
                                            <TableHead className="font-semibold">Interval</TableHead>
                                            <TableHead className="font-semibold">Status</TableHead>
                                            <TableHead className="text-right font-semibold">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredPlans.map((plan) => (
                                            <TableRow key={plan.id} className="hover:bg-muted/30 transition-colors">
                                                <TableCell className="font-medium text-foreground">{plan.name}</TableCell>
                                                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                                                    {plan.description || '-'}
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    {formatCurrency(plan.price, plan.currency)}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="flex items-center gap-1.5 capitalize text-sm">
                                                        <RefreshCw className="h-3.5 w-3.5 text-primary opacity-70" />
                                                        Every {formatInterval(plan.recurring_interval, plan.recurring_interval_count)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={plan.is_active ? 'default' : 'secondary'} className="capitalize bg-opacity-10 border-none">
                                                        {plan.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40">
                                                            <DropdownMenuItem onClick={() => openEdit(plan)}>
                                                                <Pencil className="h-4 w-4 mr-2" /> Edit Plan
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive font-medium" onClick={() => handleDelete(plan.id)}>
                                                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        )
                    }

                    {/* CREATE DIALOG */}
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl flex items-center gap-2">
                                    <Plus className="h-6 w-6 text-primary" />
                                    Create Subscription Plan
                                </DialogTitle>
                                <DialogDescription>
                                    Define a new recurring billing plan for your services.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="text-sm font-semibold">Plan Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Premium Monthly Pro"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="price" className="text-sm font-semibold">Price *</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="price"
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                className="pl-9"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="currency" className="text-sm font-semibold">Currency</Label>
                                        <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                                            <SelectTrigger id="currency">
                                                <SelectValue placeholder="Select Currency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="USD">USD - US Dollar</SelectItem>
                                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                                                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="interval" className="text-sm font-semibold">Interval</Label>
                                        <Select value={formData.recurring_interval} onValueChange={(v) => setFormData({ ...formData, recurring_interval: v })}>
                                            <SelectTrigger id="interval">
                                                <SelectValue placeholder="Select Interval" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="daily">Daily</SelectItem>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                                <SelectItem value="yearly">Yearly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="interval_count" className="text-sm font-semibold">Every (Frequency)</Label>
                                        <Input
                                            id="interval_count"
                                            type="number"
                                            min="1"
                                            value={formData.recurring_interval_count}
                                            onChange={(e) => setFormData({ ...formData, recurring_interval_count: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="trial_days" className="text-sm font-semibold">Trial Days</Label>
                                        <Input
                                            id="trial_days"
                                            type="number"
                                            min="0"
                                            value={formData.trial_days}
                                            onChange={(e) => setFormData({ ...formData, trial_days: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="setup_fee" className="text-sm font-semibold">Setup Fee</Label>
                                        <Input
                                            id="setup_fee"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.setup_fee}
                                            onChange={(e) => setFormData({ ...formData, setup_fee: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe what's included in this plan..."
                                        className="min-h-[100px] resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter className="bg-muted/30 px-6 py-4 -mx-6 -mb-6 rounded-b-lg">
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={handleCreate}
                                    disabled={!formData.name || !formData.price || createMutation.isPending}
                                    className="px-8"
                                >
                                    {createMutation.isPending ? 'Creating...' : 'Create Plan'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* EDIT DIALOG */}
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl flex items-center gap-2">
                                    <Settings2 className="h-6 w-6 text-primary" />
                                    Edit Subscription Plan
                                </DialogTitle>
                                <DialogDescription>
                                    Update the details of your recurring billing plan.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="grid gap-2">
                                    <Label className="text-sm font-semibold">Plan Name *</Label>
                                    <Input
                                        placeholder="e.g., Premium Monthly Pro"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-semibold">Price *</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                step="0.01"
                                                className="pl-9"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-semibold">Status</Label>
                                        <Select value={formData.is_active ? 'active' : 'inactive'} onValueChange={(v) => setFormData({ ...formData, is_active: v === 'active' })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-semibold">Interval</Label>
                                        <Select value={formData.recurring_interval} onValueChange={(v) => setFormData({ ...formData, recurring_interval: v })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="daily">Daily</SelectItem>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                                <SelectItem value="yearly">Yearly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-semibold">Every (Frequency)</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={formData.recurring_interval_count}
                                            onChange={(e) => setFormData({ ...formData, recurring_interval_count: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-semibold">Trial Days</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={formData.trial_days}
                                            onChange={(e) => setFormData({ ...formData, trial_days: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-semibold">Setup Fee</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.setup_fee}
                                            onChange={(e) => setFormData({ ...formData, setup_fee: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-sm font-semibold">Description</Label>
                                    <Textarea
                                        className="min-h-[100px] resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter className="bg-muted/30 px-6 py-4 -mx-6 -mb-6 rounded-b-lg">
                                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={handleUpdate}
                                    disabled={!formData.name || !formData.price || updateMutation.isPending}
                                    className="px-8"
                                >
                                    {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                <TabsContent value="active" className="space-y-8 outline-none">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-green-500/10 to-background border-green-500/20">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Active</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {customerSubscriptions.filter(s => s.status === 'active').length}
                                        </p>
                                    </div>
                                    <CheckCircle2 className="h-8 w-8 text-green-600 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-blue-500/10 to-background border-blue-500/20">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Trialing</p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {customerSubscriptions.filter(s => s.status === 'trialing').length}
                                        </p>
                                    </div>
                                    <Clock className="h-8 w-8 text-blue-600 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-orange-500/10 to-background border-orange-500/20">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Past Due</p>
                                        <p className="text-2xl font-bold text-orange-600">
                                            {customerSubscriptions.filter(s => s.status === 'past_due').length}
                                        </p>
                                    </div>
                                    <AlertCircle className="h-8 w-8 text-orange-600 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total</p>
                                        <p className="text-2xl font-bold text-primary">
                                            {customerSubscriptions.length}
                                        </p>
                                    </div>
                                    <CreditCard className="h-8 w-8 text-primary opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {isSubsLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <RefreshCw className="h-8 w-8 animate-spin text-primary opacity-50" />
                        </div>
                    ) : customerSubscriptions.length === 0 ? (
                        <Card className="border-dashed py-20">
                            <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <CreditCard className="h-8 w-8" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-semibold">No active subscriptions found</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto">
                                        Once customers subscribe to your plans, they will appear here.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-none shadow-xl shadow-primary/5 overflow-hidden rounded-2xl">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="font-semibold py-4">Subscription</TableHead>
                                        <TableHead className="font-semibold py-4">Customer</TableHead>
                                        <TableHead className="font-semibold py-4">Plan</TableHead>
                                        <TableHead className="font-semibold py-4">Status</TableHead>
                                        <TableHead className="font-semibold py-4 text-right">Amount</TableHead>
                                        <TableHead className="py-4"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customerSubscriptions.map((sub: Subscription) => (
                                        <TableRow key={sub.id} className="group hover:bg-muted/20 transition-colors border-b border-muted/50 last:border-none">
                                            <TableCell className="py-4">
                                                <div className="font-medium text-foreground">{sub.subscription_number}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Since {new Date(sub.start_date).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="font-medium text-foreground">
                                                    {sub.contact_first_name} {sub.contact_last_name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{sub.contact_email}</div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="font-medium text-foreground">{sub.product_name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Billed every {sub.billing_interval_count > 1 ? `${sub.billing_interval_count} ` : ''}{sub.billing_interval}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge
                                                    variant={
                                                        sub.status === 'active' ? 'default' :
                                                            sub.status === 'trialing' ? 'secondary' :
                                                                sub.status === 'cancelled' ? 'destructive' : 'outline'
                                                    }
                                                    className="capitalize px-3 py-0.5 rounded-full font-medium"
                                                >
                                                    {sub.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4 text-right">
                                                <div className="font-bold text-foreground">
                                                    {formatCurrency(sub.billing_amount, sub.currency)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Next: {sub.next_billing_date ? new Date(sub.next_billing_date).toLocaleDateString() : 'N/A'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-2xl border-muted">
                                                        <DropdownMenuItem
                                                            className="rounded-lg py-2 cursor-pointer"
                                                            onClick={() => {
                                                                setSelectedSubscription(sub);
                                                                setIsDetailOpen(true);
                                                            }}
                                                        >
                                                            <Pencil className="h-4 w-4 mr-2 text-primary" /> View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="my-1 bg-muted" />
                                                        <DropdownMenuItem
                                                            className="text-destructive rounded-lg py-2 cursor-pointer"
                                                            onClick={async () => {
                                                                if (confirm('Cancel this subscription?')) {
                                                                    try {
                                                                        await subscriptionsApi.cancelSubscription(sub.id, { cancel_at_period_end: true });
                                                                        toast.success('Subscription cancelled');
                                                                        queryClient.invalidateQueries({ queryKey: ['customer-subscriptions'] });
                                                                    } catch (err: any) {
                                                                        toast.error(err.message || 'Failed to cancel');
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" /> Cancel Subscription
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="analytics" className="space-y-8 outline-none">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                        <h3 className="text-lg font-medium">Performance Overview</h3>
                        <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">From</span>
                                <Input
                                    type="date"
                                    value={format(dateRange.from, 'yyyy-MM-dd')}
                                    onChange={(e) => e.target.value && setDateRange({ ...dateRange, from: new Date(e.target.value) })}
                                    className="w-auto h-9 bg-background"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">To</span>
                                <Input
                                    type="date"
                                    value={format(dateRange.to, 'yyyy-MM-dd')}
                                    onChange={(e) => e.target.value && setDateRange({ ...dateRange, to: new Date(e.target.value) })}
                                    className="w-auto h-9 bg-background"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="bg-gradient-to-br from-blue-500/10 to-background border-blue-500/20 shadow-sm overflow-hidden group">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold tracking-tight text-blue-600">{formatCurrency(stats?.mrr || 0)}</div>
                                <p className="text-xs text-muted-foreground mt-1">Current MRR</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-500/10 to-background border-green-500/20 shadow-sm overflow-hidden group">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Annual Recurring Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold tracking-tight text-green-600">{formatCurrency(stats?.arr || 0)}</div>
                                <p className="text-xs text-muted-foreground mt-1">Projected Yearly</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-500/10 to-background border-purple-500/20 shadow-sm overflow-hidden group">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscribers</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold tracking-tight text-purple-600">{stats?.active_count || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">Current active customers</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-orange-500/10 to-background border-orange-500/20 shadow-sm overflow-hidden group">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Trialing</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold tracking-tight text-orange-600">{stats?.trialing_count || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">Potential conversions</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="p-6 rounded-2xl shadow-xl shadow-primary/5">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold">Subscription Growth</CardTitle>
                                <CardDescription>Number of new subscriptions over time</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] pt-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={analytics?.growth || []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                borderRadius: '12px',
                                                border: '1px solid #e2e8f0',
                                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card className="p-6 rounded-2xl shadow-xl shadow-primary/5">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold">Subscription Status</CardTitle>
                                <CardDescription>Distribution of subscription states</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] pt-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analytics?.distribution || []}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="count"
                                            nameKey="status"
                                        >
                                            {(analytics?.distribution || []).map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                borderRadius: '12px',
                                                border: '1px solid #e2e8f0'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Subscription Detail Dialog */}
            <SubscriptionDetailDialog
                subscription={selectedSubscription}
                open={isDetailOpen}
                onClose={() => {
                    setIsDetailOpen(false);
                    setSelectedSubscription(null);
                }}
                onCancel={async (id) => {
                    if (confirm('Are you sure you want to cancel this subscription?')) {
                        try {
                            await subscriptionsApi.cancelSubscription(id, { cancel_at_period_end: true });
                            toast.success('Subscription will be cancelled at the end of the billing period');
                            queryClient.invalidateQueries({ queryKey: ['customer-subscriptions'] });
                        } catch (err: any) {
                            toast.error(err.message || 'Failed to cancel subscription');
                        }
                    }
                }}
                onPause={async (id) => {
                    if (confirm('Are you sure you want to pause this subscription? Collection will be stopped.')) {
                        pauseMutation.mutate(id);
                    }
                }}
                onResume={async (id) => {
                    if (confirm('Are you sure you want to resume this subscription?')) {
                        resumeMutation.mutate(id);
                    }
                }}
            />
        </div>
    );
};

export default Subscriptions;
