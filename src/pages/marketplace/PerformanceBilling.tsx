import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
    Phone,
    DollarSign,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Plus,
    Settings,
    RefreshCw,
    Filter,
    Wallet,
    Target,
    Zap,
    Timer,
    Scale,
    Trash2,
    Edit
} from 'lucide-react';
import {
    getBillingSettings,
    updateBillingSettings,
    getPricingRules,
    createPricingRule,
    updatePricingRule,
    deletePricingRule,
    getBillingSummary,
    getQualifiedCalls,
    getDisputes,
    createDispute,
    resolveDispute,
    type BillingSetting,
    type CallPricingRule,
    type QualifiedCall,
    type CallDispute,
    type BillingSummary
} from '@/services/performanceBillingApi';

const PerformanceBilling: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
    const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false);
    const [selectedCall, setSelectedCall] = useState<QualifiedCall | null>(null);
    const [editingRule, setEditingRule] = useState<CallPricingRule | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Queries
    const { data: settings } = useQuery({
        queryKey: ['billing-settings'],
        queryFn: getBillingSettings
    });

    const { data: pricingRules, isLoading: rulesLoading } = useQuery({
        queryKey: ['pricing-rules'],
        queryFn: getPricingRules
    });

    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ['billing-summary'],
        queryFn: () => getBillingSummary()
    });

    const { data: qualifiedCalls, isLoading: callsLoading } = useQuery({
        queryKey: ['qualified-calls', filterStatus],
        queryFn: () => getQualifiedCalls(filterStatus === 'all' ? undefined : filterStatus)
    });

    const { data: disputes } = useQuery({
        queryKey: ['disputes'],
        queryFn: () => getDisputes()
    });

    // Mutations
    const updateSettingsMutation = useMutation({
        mutationFn: updateBillingSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['billing-settings'] });
            toast.success('Settings updated successfully');
            setIsSettingsOpen(false);
        },
        onError: () => toast.error('Failed to update settings')
    });

    const createRuleMutation = useMutation({
        mutationFn: createPricingRule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
            toast.success('Pricing rule created');
            setIsRuleDialogOpen(false);
            setEditingRule(null);
        },
        onError: () => toast.error('Failed to create rule')
    });

    const updateRuleMutation = useMutation({
        mutationFn: (data: { id: number; rule: Partial<CallPricingRule> }) =>
            updatePricingRule(data.id, data.rule),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
            toast.success('Pricing rule updated');
            setIsRuleDialogOpen(false);
            setEditingRule(null);
        },
        onError: () => toast.error('Failed to update rule')
    });

    const deleteRuleMutation = useMutation({
        mutationFn: deletePricingRule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
            toast.success('Pricing rule deleted');
        },
        onError: () => toast.error('Failed to delete rule')
    });

    const createDisputeMutation = useMutation({
        mutationFn: (data: { callLogId: number; disputeType: string; description?: string }) =>
            createDispute(data.callLogId, data.disputeType, data.description),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['qualified-calls'] });
            queryClient.invalidateQueries({ queryKey: ['disputes'] });
            toast.success('Dispute submitted successfully');
            setIsDisputeDialogOpen(false);
            setSelectedCall(null);
        },
        onError: () => toast.error('Failed to submit dispute')
    });

    const resolveDisputeMutation = useMutation({
        mutationFn: (data: { disputeId: number; resolution: 'approved' | 'rejected' | 'partial_refund'; refundAmount?: number; notes?: string }) =>
            resolveDispute(data.disputeId, data.resolution, data.refundAmount, data.notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['disputes'] });
            queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
            toast.success('Dispute resolved');
        },
        onError: () => toast.error('Failed to resolve dispute')
    });

    const currentSettings = settings?.[0] || {
        min_duration_seconds: 90,
        base_price_per_call: 25,
        auto_bill_enabled: true,
        dispute_window_hours: 72
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const getBillingStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            billed: 'bg-green-100 text-green-800',
            disputed: 'bg-orange-100 text-orange-800',
            refunded: 'bg-blue-100 text-blue-800',
            waived: 'bg-gray-100 text-gray-800'
        };
        return <Badge className={colors[status] || 'bg-gray-100'}>{status}</Badge>;
    };

    const getDisputeStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            under_review: 'bg-blue-100 text-blue-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            partial_refund: 'bg-purple-100 text-purple-800'
        };
        return <Badge className={colors[status] || 'bg-gray-100'}>{status.replace('_', ' ')}</Badge>;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Performance Billing</h1>
                    <p className="text-muted-foreground mt-1">
                        LeadSmart-style Pay-Per-Call billing • Calls ≥ {currentSettings.min_duration_seconds}s are billable
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Billing Settings</DialogTitle>
                                <DialogDescription>
                                    Configure your pay-per-call billing parameters
                                </DialogDescription>
                            </DialogHeader>
                            <SettingsForm
                                settings={currentSettings as BillingSetting}
                                onSave={(data) => updateSettingsMutation.mutate(data)}
                                isLoading={updateSettingsMutation.isPending}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-green-500/20">
                                <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                    {formatCurrency(summary?.billing.net_revenue || 0)}
                                </p>
                                <p className="text-sm text-green-600/80">Net Revenue</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-blue-500/20">
                                <Phone className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{summary?.calls.qualified || 0}</p>
                                <p className="text-sm text-muted-foreground">Qualified Calls</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-purple-500/20">
                                <Target className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{summary?.calls.qualification_rate || 0}%</p>
                                <p className="text-sm text-muted-foreground">Qualification Rate</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-orange-500/20">
                                <Timer className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {formatDuration(summary?.duration.avg_qualified_seconds || 0)}
                                </p>
                                <p className="text-sm text-muted-foreground">Avg Duration</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-pink-500/20">
                                <Wallet className="h-6 w-6 text-pink-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(summary?.wallet_balance || 0)}</p>
                                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="calls">Qualified Calls</TabsTrigger>
                    <TabsTrigger value="pricing">Pricing Rules</TabsTrigger>
                    <TabsTrigger value="disputes">Disputes ({disputes?.length || 0})</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* How It Works */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-primary" />
                                    How Pay-Per-Call Works
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                                    <div>
                                        <p className="font-medium">Call Comes In</p>
                                        <p className="text-sm text-muted-foreground">Customer calls your tracking number</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                                    <div>
                                        <p className="font-medium">Duration Check</p>
                                        <p className="text-sm text-muted-foreground">If call lasts ≥ {currentSettings.min_duration_seconds} seconds, it's qualified</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
                                    <div>
                                        <p className="font-medium">Auto-Billing</p>
                                        <p className="text-sm text-muted-foreground">Credits deducted from wallet based on pricing rules</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">4</div>
                                    <div>
                                        <p className="font-medium">Dispute Window</p>
                                        <p className="text-sm text-muted-foreground">You have {currentSettings.dispute_window_hours}h to dispute any charge</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    This Period
                                </CardTitle>
                                <CardDescription>
                                    {summary?.period.start} - {summary?.period.end}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Total Calls</span>
                                    <span className="font-bold">{summary?.calls.total || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Billed Calls</span>
                                    <span className="font-bold">{summary?.calls.billed || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Total Billed</span>
                                    <span className="font-bold text-green-600">{formatCurrency(summary?.billing.total_billed || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Total Refunded</span>
                                    <span className="font-bold text-red-600">{formatCurrency(summary?.billing.total_refunded || 0)}</span>
                                </div>
                                <hr />
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Net Revenue</span>
                                    <span className="font-bold text-lg text-primary">{formatCurrency(summary?.billing.net_revenue || 0)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="calls" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Qualified Calls</CardTitle>
                                    <CardDescription>Calls that met the {currentSettings.min_duration_seconds}s minimum duration</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-muted-foreground" />
                                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder="Filter status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="billed">Billed</SelectItem>
                                            <SelectItem value="disputed">Disputed</SelectItem>
                                            <SelectItem value="refunded">Refunded</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {callsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : !qualifiedCalls?.length ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Phone className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p>No qualified calls to display</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="border-b">
                                        <tr className="text-left text-sm text-muted-foreground">
                                            <th className="py-2">Phone</th>
                                            <th className="py-2">Campaign</th>
                                            <th className="py-2">Duration</th>
                                            <th className="py-2">Price</th>
                                            <th className="py-2">Status</th>
                                            <th className="py-2">Date</th>
                                            <th className="py-2 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {qualifiedCalls.map((call) => (
                                            <tr key={call.id} className="border-b last:border-0 hover:bg-muted/50">
                                                <td className="py-2 font-medium">{call.phone_number}</td>
                                                <td className="py-2">{call.campaign_name}</td>
                                                <td className="py-2">{formatDuration(call.duration)}</td>
                                                <td className="py-2 font-medium">{formatCurrency(call.billing_price)}</td>
                                                <td className="py-2">{getBillingStatusBadge(call.billing_status)}</td>
                                                <td className="py-2 text-muted-foreground text-sm">
                                                    {new Date(call.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-2 text-right">
                                                    {call.billing_status === 'billed' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedCall(call);
                                                                setIsDisputeDialogOpen(true);
                                                            }}
                                                        >
                                                            <AlertTriangle className="h-4 w-4 mr-1" />
                                                            Dispute
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pricing" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Pricing Rules</CardTitle>
                                    <CardDescription>Define call prices based on zip code, service, time, and more</CardDescription>
                                </div>
                                <Button onClick={() => { setEditingRule(null); setIsRuleDialogOpen(true); }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Rule
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {rulesLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : !pricingRules?.length ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Scale className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p>No pricing rules configured</p>
                                    <Button variant="link" onClick={() => setIsRuleDialogOpen(true)}>
                                        Create your first rule
                                    </Button>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="border-b">
                                        <tr className="text-left text-sm text-muted-foreground">
                                            <th className="py-2">Rule Name</th>
                                            <th className="py-2">Service</th>
                                            <th className="py-2">Location</th>
                                            <th className="py-2">Base Price</th>
                                            <th className="py-2">Multiplier</th>
                                            <th className="py-2">Priority</th>
                                            <th className="py-2">Status</th>
                                            <th className="py-2 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pricingRules.map((rule) => (
                                            <tr key={rule.id} className="border-b last:border-0 hover:bg-muted/50">
                                                <td className="py-2 font-medium">{rule.name || 'Unnamed Rule'}</td>
                                                <td className="py-2">{rule.service_category || 'Any'}</td>
                                                <td className="py-2">{rule.postal_code || rule.city || rule.region || 'Any'}</td>
                                                <td className="py-2 font-medium">{formatCurrency(rule.base_price)}</td>
                                                <td className="py-2">{rule.multiplier}x</td>
                                                <td className="py-2">{rule.priority}</td>
                                                <td className="py-2">
                                                    <Badge className={rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100'}>
                                                        {rule.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td className="py-2 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => { setEditingRule(rule); setIsRuleDialogOpen(true); }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deleteRuleMutation.mutate(rule.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="disputes" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Billing Disputes</CardTitle>
                            <CardDescription>Review and resolve billing disputes from contractors</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!disputes?.length ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30 text-green-500" />
                                    <p>No active disputes</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="border-b">
                                        <tr className="text-left text-sm text-muted-foreground">
                                            <th className="py-2">Call</th>
                                            <th className="py-2">Type</th>
                                            <th className="py-2">Amount</th>
                                            <th className="py-2">Status</th>
                                            <th className="py-2">Created</th>
                                            <th className="py-2 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {disputes.map((dispute) => (
                                            <tr key={dispute.id} className="border-b last:border-0 hover:bg-muted/50">
                                                <td className="py-2">
                                                    <div>
                                                        <p className="font-medium">{dispute.phone_number || `Call #${dispute.call_log_id}`}</p>
                                                        {dispute.duration && (
                                                            <p className="text-sm text-muted-foreground">{formatDuration(dispute.duration)}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-2 capitalize">{dispute.dispute_type.replace('_', ' ')}</td>
                                                <td className="py-2 font-medium">{formatCurrency(dispute.billing_price || 0)}</td>
                                                <td className="py-2">{getDisputeStatusBadge(dispute.status)}</td>
                                                <td className="py-2 text-muted-foreground text-sm">
                                                    {new Date(dispute.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-2 text-right">
                                                    {dispute.status === 'pending' && (
                                                        <div className="flex gap-1 justify-end">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-green-600"
                                                                onClick={() => resolveDisputeMutation.mutate({
                                                                    disputeId: dispute.id,
                                                                    resolution: 'approved'
                                                                })}
                                                            >
                                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-600"
                                                                onClick={() => resolveDisputeMutation.mutate({
                                                                    disputeId: dispute.id,
                                                                    resolution: 'rejected'
                                                                })}
                                                            >
                                                                <XCircle className="h-4 w-4 mr-1" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Pricing Rule Dialog */}
            <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingRule ? 'Edit' : 'Create'} Pricing Rule</DialogTitle>
                        <DialogDescription>
                            Define pricing based on location, service type, or time
                        </DialogDescription>
                    </DialogHeader>
                    <PricingRuleForm
                        rule={editingRule}
                        onSave={(data) => {
                            if (editingRule) {
                                updateRuleMutation.mutate({ id: editingRule.id, rule: data });
                            } else {
                                createRuleMutation.mutate(data);
                            }
                        }}
                        isLoading={createRuleMutation.isPending || updateRuleMutation.isPending}
                    />
                </DialogContent>
            </Dialog>

            {/* Dispute Dialog */}
            <Dialog open={isDisputeDialogOpen} onOpenChange={setIsDisputeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Dispute Billing</DialogTitle>
                        <DialogDescription>
                            Submit a dispute for call #{selectedCall?.id}
                        </DialogDescription>
                    </DialogHeader>
                    <DisputeForm
                        call={selectedCall}
                        onSubmit={(disputeType, description) => {
                            if (selectedCall) {
                                createDisputeMutation.mutate({
                                    callLogId: selectedCall.id,
                                    disputeType,
                                    description
                                });
                            }
                        }}
                        isLoading={createDisputeMutation.isPending}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};

// Settings Form Component
const SettingsForm: React.FC<{
    settings: BillingSetting;
    onSave: (data: Partial<BillingSetting>) => void;
    isLoading: boolean;
}> = ({ settings, onSave, isLoading }) => {
    const [formData, setFormData] = useState({
        min_duration_seconds: settings.min_duration_seconds || 90,
        base_price_per_call: settings.base_price_per_call || 25,
        auto_bill_enabled: settings.auto_bill_enabled ?? true,
        dispute_window_hours: settings.dispute_window_hours || 72,
        min_price_per_call: settings.min_price_per_call || 25,
        max_price_per_call: settings.max_price_per_call || 120
    });

    return (
        <div className="space-y-4">
            <div>
                <Label>Minimum Call Duration (seconds)</Label>
                <Input
                    type="number"
                    value={formData.min_duration_seconds}
                    onChange={(e) => setFormData({ ...formData, min_duration_seconds: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground mt-1">Calls shorter than this won't be billed</p>
            </div>

            <div>
                <Label>Default Base Price ($)</Label>
                <Input
                    type="number"
                    step="0.01"
                    value={formData.base_price_per_call}
                    onChange={(e) => setFormData({ ...formData, base_price_per_call: parseFloat(e.target.value) })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Min Price ($)</Label>
                    <Input
                        type="number"
                        step="0.01"
                        value={formData.min_price_per_call}
                        onChange={(e) => setFormData({ ...formData, min_price_per_call: parseFloat(e.target.value) })}
                    />
                </div>
                <div>
                    <Label>Max Price ($)</Label>
                    <Input
                        type="number"
                        step="0.01"
                        value={formData.max_price_per_call}
                        onChange={(e) => setFormData({ ...formData, max_price_per_call: parseFloat(e.target.value) })}
                    />
                </div>
            </div>

            <div>
                <Label>Dispute Window (hours)</Label>
                <Input
                    type="number"
                    value={formData.dispute_window_hours}
                    onChange={(e) => setFormData({ ...formData, dispute_window_hours: parseInt(e.target.value) })}
                />
            </div>

            <div className="flex items-center justify-between pt-2">
                <div>
                    <Label>Auto-Bill Qualified Calls</Label>
                    <p className="text-xs text-muted-foreground">Automatically charge for 90+ second calls</p>
                </div>
                <Switch
                    checked={formData.auto_bill_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, auto_bill_enabled: checked })}
                />
            </div>

            <DialogFooter>
                <Button onClick={() => onSave(formData)} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Settings'}
                </Button>
            </DialogFooter>
        </div>
    );
};

// Pricing Rule Form Component
const PricingRuleForm: React.FC<{
    rule: CallPricingRule | null;
    onSave: (data: Partial<CallPricingRule>) => void;
    isLoading: boolean;
}> = ({ rule, onSave, isLoading }) => {
    const [formData, setFormData] = useState({
        name: rule?.name || '',
        service_category: rule?.service_category || '',
        postal_code: rule?.postal_code || '',
        city: rule?.city || '',
        base_price: rule?.base_price || 25,
        multiplier: rule?.multiplier || 1,
        priority: rule?.priority || 0,
        is_active: rule?.is_active ?? true,
        is_emergency: rule?.is_emergency || false,
        time_start: rule?.time_start || '',
        time_end: rule?.time_end || ''
    });

    return (
        <div className="space-y-4">
            <div>
                <Label>Rule Name</Label>
                <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Premium Zip Code Pricing"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Service Category</Label>
                    <Select
                        value={formData.service_category}
                        onValueChange={(value) => setFormData({ ...formData, service_category: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Any service" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Any</SelectItem>
                            <SelectItem value="plumbing">Plumbing</SelectItem>
                            <SelectItem value="hvac">HVAC</SelectItem>
                            <SelectItem value="electrical">Electrical</SelectItem>
                            <SelectItem value="roofing">Roofing</SelectItem>
                            <SelectItem value="landscaping">Landscaping</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Postal Code</Label>
                    <Input
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        placeholder="e.g., 90210"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Base Price ($)</Label>
                    <Input
                        type="number"
                        step="0.01"
                        value={formData.base_price}
                        onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                    />
                </div>
                <div>
                    <Label>Multiplier</Label>
                    <Input
                        type="number"
                        step="0.1"
                        value={formData.multiplier}
                        onChange={(e) => setFormData({ ...formData, multiplier: parseFloat(e.target.value) })}
                    />
                </div>
            </div>

            <div>
                <Label>Priority (higher = checked first)</Label>
                <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                />
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <Label>Active</Label>
                </div>
                <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
            </div>

            <DialogFooter>
                <Button onClick={() => onSave(formData)} disabled={isLoading}>
                    {isLoading ? 'Saving...' : (rule ? 'Update Rule' : 'Create Rule')}
                </Button>
            </DialogFooter>
        </div>
    );
};

// Dispute Form Component
const DisputeForm: React.FC<{
    call: QualifiedCall | null;
    onSubmit: (disputeType: string, description?: string) => void;
    isLoading: boolean;
}> = ({ call, onSubmit, isLoading }) => {
    const [disputeType, setDisputeType] = useState('');
    const [description, setDescription] = useState('');

    if (!call) return null;

    return (
        <div className="space-y-4">
            <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm"><strong>Phone:</strong> {call.phone_number}</p>
                <p className="text-sm"><strong>Duration:</strong> {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}</p>
                <p className="text-sm"><strong>Amount:</strong> ${call.billing_price}</p>
            </div>

            <div>
                <Label>Dispute Reason</Label>
                <Select value={disputeType} onValueChange={setDisputeType}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="wrong_number">Wrong Number</SelectItem>
                        <SelectItem value="not_interested">Not Interested / No Intent</SelectItem>
                        <SelectItem value="spam">Spam Call</SelectItem>
                        <SelectItem value="poor_quality">Poor Lead Quality</SelectItem>
                        <SelectItem value="duplicate">Duplicate Lead</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label>Description (optional)</Label>
                <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide additional details..."
                    rows={3}
                />
            </div>

            <DialogFooter>
                <Button
                    onClick={() => onSubmit(disputeType, description)}
                    disabled={isLoading || !disputeType}
                >
                    {isLoading ? 'Submitting...' : 'Submit Dispute'}
                </Button>
            </DialogFooter>
        </div>
    );
};

export default PerformanceBilling;
