import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useTenantOptional } from '@/contexts/TenantContext';
import {
    CreditCard, Check, Zap, Users, Mail, MessageSquare, Layers,
    RefreshCw, Download, ExternalLink, AlertCircle, Crown, TrendingUp,
    ChevronRight, Building2, Receipt, History, Wallet, Sparkles,
    ShieldCheck, CalendarDays, Loader2, ArrowUpRight
} from 'lucide-react';
import SEO from '@/components/SEO';

interface Plan {
    key: string;
    name: string;
    price_monthly: number;
    price_yearly: number;
    max_subaccounts: number;
    max_team_members: number;
    max_contacts: number;
    max_emails_per_month: number;
    max_sms_per_month: number;
}

interface Subscription {
    id: number;
    plan_name: string;
    status: string;
    billing_cycle: string;
    base_price_cents: number;
    current_period_end?: string;
    trial_ends_at?: string;
    max_subaccounts: number;
    max_team_members: number;
    max_emails_per_month: number;
    max_sms_per_month: number;
}

interface Limits {
    emails?: { used: number; limit: number; percent: number };
    sms?: { used: number; limit: number; percent: number };
    subaccounts?: { used: number; limit: number; percent: number };
}

interface Invoice {
    id: number;
    invoice_number: string;
    status: string;
    total_cents: number;
    created_at: string;
    pdf_url?: string;
}

export default function AgencyBilling() {
    const { toast } = useToast();
    const tenant = useTenantOptional();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [limits, setLimits] = useState<Limits>({});
    const [plans, setPlans] = useState<Plan[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string>('');
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const agencyId = tenant?.currentAgency?.id;

    useEffect(() => {
        if (agencyId) {
            loadBillingData();
        }
    }, [agencyId]);

    async function loadBillingData() {
        if (!agencyId) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            const headers = { Authorization: `Bearer ${token}` };

            const [subRes, plansRes, invoicesRes] = await Promise.all([
                fetch(`/api/mt/agencies/${agencyId}/billing/subscription`, { headers }),
                fetch('/api/mt/billing/plans', { headers }),
                fetch(`/api/mt/agencies/${agencyId}/billing/invoices`, { headers }),
            ]);

            const subData = await subRes.json();
            const plansData = await plansRes.json();
            const invoicesData = await invoicesRes.json();

            setSubscription(subData.subscription);
            setLimits(subData.limits || {});
            setPlans(plansData.plans || []);
            setInvoices(invoicesData.items || []);
        } catch (err) {
            console.error('Failed to load billing:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpgrade(planKey: string) {
        if (!agencyId) return;
        try {
            const res = await fetch(`/api/mt/agencies/${agencyId}/billing/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ plan: planKey, billing_cycle: billingCycle })
            });
            const data = await res.json();

            if (data.demo_mode) {
                toast({ title: 'Demo Mode', description: 'Subscription upgraded in demo mode' });
                loadBillingData();
                setUpgradeDialogOpen(false);
            } else if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                toast({ title: 'Error', description: data.error || 'Failed to create checkout', variant: 'destructive' });
            }
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to upgrade', variant: 'destructive' });
        }
    }

    async function openPortal() {
        if (!agencyId) return;
        try {
            const res = await fetch(`/api/mt/agencies/${agencyId}/billing/portal`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });
            const data = await res.json();
            if (data.portal_url) {
                window.open(data.portal_url, '_blank');
            }
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to open portal', variant: 'destructive' });
        }
    }

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!tenant?.currentAgency) {
        return (
            <div className="p-6">
                <Card className="border-dashed">
                    <CardContent className="py-20 text-center">
                        <Building2 className="w-16 h-16 mx-auto text-muted-foreground opacity-20 mb-6" />
                        <h3 className="text-xl font-bold mb-2">Agency context required</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">Please select an agency from the organization switcher to manage its subscription and billing details.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`;
    const currentPlanKey = subscription?.plan_name?.toLowerCase() || 'starter';

    return (
        <>
            <SEO title="Billing & Subscription" description="Manage your agency subscription, usage limits, and billing history." />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[18px] font-bold tracking-tight">Billing & Subscription</h1>
                        <p className="text-sm text-muted-foreground">{tenant.currentAgency.name}</p>
                    </div>
                    {tenant.isAgencyOwner && (
                        <Button variant="outline" className="shadow-sm gap-2" onClick={openPortal}>
                            <CreditCard className="w-4 h-4" />
                            Stripe Billing Portal
                        </Button>
                    )}
                </div>

                <div className="space-y-10">
                    {/* Active Plan Section */}
                    <section id="plan" className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <Crown className="w-4 h-4 text-amber-500" />
                            <h3 className="text-base font-semibold">Active Subscription</h3>
                        </div>

                        <Card className="overflow-hidden border-none shadow-premium bg-gradient-to-br from-primary/5 via-background to-background">
                            <CardHeader className="pb-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <CardTitle className="text-2xl font-black">{subscription?.plan_name || 'Free'} Plan</CardTitle>
                                            <Badge className="bg-primary/20 text-primary border-none hover:bg-primary/30 uppercase text-[10px] tracking-widest font-black">
                                                {subscription?.status || 'inactive'}
                                            </Badge>
                                        </div>
                                        <CardDescription className="flex items-center gap-2">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                            {subscription?.billing_cycle === 'yearly' ? 'Annual Cycle' : 'Monthly Cycle'}
                                            {subscription?.current_period_end && (
                                                <span className="opacity-60">· Renews {new Date(subscription.current_period_end).toLocaleDateString()}</span>
                                            )}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-end gap-1.5 bg-background/50 backdrop-blur-md p-4 rounded-2xl border">
                                        <span className="text-3xl font-black tracking-tighter">{formatPrice(subscription?.base_price_cents || 0)}</span>
                                        <span className="text-xs text-muted-foreground font-bold uppercase pb-1.5">/ Month</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {subscription?.trial_ends_at && (
                                    <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                                        <div className="p-2 bg-amber-500 rounded-lg">
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-amber-700">Exploration Phase Active</p>
                                            <p className="text-xs text-amber-600/80">Your full-feature trial ends on {new Date(subscription.trial_ends_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Sub-Accounts', value: subscription?.max_subaccounts, icon: <Layers className="w-4 h-4" />, color: 'text-blue-500' },
                                        { label: 'Team Members', value: subscription?.max_team_members, icon: <Users className="w-4 h-4" />, color: 'text-purple-500' },
                                        { label: 'Emails/mo', value: subscription?.max_emails_per_month, icon: <Mail className="w-4 h-4" />, color: 'text-orange-500' },
                                        { label: 'SMS/mo', value: subscription?.max_sms_per_month, icon: <MessageSquare className="w-4 h-4" />, color: 'text-green-500' }
                                    ].map((feat) => (
                                        <div key={feat.label} className="group p-4 bg-muted/30 hover:bg-muted/50 transition-colors rounded-2xl border border-transparent hover:border-border">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`p-2 rounded-xl bg-background shadow-sm ${feat.color}`}>{feat.icon}</div>
                                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight">{feat.label}</span>
                                            </div>
                                            <div className="text-xl font-black">
                                                {feat.value === -1 ? 'Unlimited' : (feat.value || 0).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            {tenant.isAgencyOwner && (
                                <CardFooter className="bg-muted/10 border-t items-center justify-between py-4">
                                    <p className="text-xs text-muted-foreground font-medium">Looking for more horsepower? Explore our scalable expansion plans.</p>
                                    <Button onClick={() => setUpgradeDialogOpen(true)} className="rounded-xl shadow-lg shadow-primary/20">
                                        <Zap className="w-4 h-4 mr-2 fill-current" />
                                        Upgrade Capacity
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                    </section>

                    {/* Compare Section */}
                    <section id="compare" className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                            <h3 className="text-base font-semibold">Available Expansion Packs</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {plans.filter(p => p.key !== 'enterprise').map((plan) => {
                                const isCurrentPlan = plan.key === currentPlanKey;
                                const price = billingCycle === 'yearly' ? plan.price_yearly / 12 : plan.price_monthly;

                                return (
                                    <Card key={plan.key} className={`relative flex flex-col justify-between overflow-hidden transition-all duration-300 ${isCurrentPlan ? 'border-primary ring-4 ring-primary/5 bg-primary/[0.01]' : 'hover:shadow-xl hover:translate-y-[-4px]'}`}>
                                        {isCurrentPlan && (
                                            <div className="absolute top-0 right-0 p-2">
                                                <div className="bg-primary text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest shadow-lg">Current</div>
                                            </div>
                                        )}
                                        <CardHeader>
                                            <CardTitle className="text-xl font-black">{plan.name}</CardTitle>
                                            <div className="flex items-baseline gap-1 mt-2">
                                                <span className="text-3xl font-black">{formatPrice(price)}</span>
                                                <span className="text-sm text-muted-foreground">/mo</span>
                                            </div>
                                            {billingCycle === 'yearly' && (
                                                <Badge variant="secondary" className="w-fit text-[10px] font-black uppercase text-primary">Save 17% Annual</Badge>
                                            )}
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            <ul className="space-y-4 py-4 border-t">
                                                {[
                                                    { label: `${plan.max_subaccounts} Sub-accounts`, icon: <Check className="w-4 h-4 text-green-500" /> },
                                                    { label: `${plan.max_team_members} Team Seats`, icon: <Check className="w-4 h-4 text-green-500" /> },
                                                    { label: `${(plan.max_emails_per_month / 1000).toFixed(0)}k Monthly Emails`, icon: <Check className="w-4 h-4 text-green-500" /> },
                                                    { label: `${plan.max_sms_per_month.toLocaleString()} SMS Credits`, icon: <Check className="w-4 h-4 text-green-500" /> }
                                                ].map((feat, i) => (
                                                    <li key={i} className="flex items-center gap-3 font-medium text-sm">
                                                        <div className="p-1 rounded-full bg-green-500/10">{feat.icon}</div>
                                                        {feat.label}
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                        <CardFooter>
                                            {tenant.isAgencyOwner && !isCurrentPlan && (
                                                <Button
                                                    variant={plan.key === 'pro' ? 'default' : 'outline'}
                                                    className="w-full rounded-xl group"
                                                    onClick={() => {
                                                        setSelectedPlan(plan.key);
                                                        setUpgradeDialogOpen(true);
                                                    }}
                                                >
                                                    {plans.findIndex(p => p.key === plan.key) > plans.findIndex(p => p.key === currentPlanKey) ? 'Scale Up' : 'Downgrade'}
                                                    <ArrowUpRight className="ml-2 w-3.5 h-3.5 group-hover:translate-x-1 group-hover:translate-y-[-1px] transition-transform" />
                                                </Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    </section>

                    {/* Usage Insights */}
                    <section id="usage" className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                            <h3 className="text-base font-semibold">Consumption Analytics</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { key: 'subaccounts', label: 'Tenant Density', icon: <Layers className="w-4 h-4" /> },
                                { key: 'emails', label: 'E-mail Outbound', icon: <Mail className="w-4 h-4" /> },
                                { key: 'sms', label: 'SMS Traffic', icon: <MessageSquare className="w-4 h-4" /> }
                            ].map((item) => {
                                const data = (limits as any)[item.key];
                                if (!data) return null;
                                return (
                                    <Card key={item.key} className="border-none shadow-md bg-muted/10">
                                        <CardHeader className="pb-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-background rounded-lg shadow-sm">{item.icon}</div>
                                                    <CardTitle className="text-sm font-bold uppercase tracking-wider">{item.label}</CardTitle>
                                                </div>
                                                <Badge variant={data.percent > 90 ? 'destructive' : data.percent > 70 ? 'secondary' : 'outline'}>
                                                    {data.percent.toFixed(0)}%
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-end justify-between">
                                                <div className="text-2xl font-black">{data.used.toLocaleString()}</div>
                                                <div className="text-xs text-muted-foreground font-bold tracking-tight">/ {data.limit === -1 ? '∞' : data.limit.toLocaleString()}</div>
                                            </div>
                                            <Progress value={data.percent} className="h-2.5 rounded-full" />
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </section>

                    {/* Billing History */}
                    <section id="history" className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <History className="w-4 h-4 text-slate-500" />
                            <h3 className="text-base font-semibold">Invoicing History</h3>
                        </div>

                        <Card className="border-none shadow-premium">
                            <CardHeader>
                                <CardTitle className="text-base">Financial Records</CardTitle>
                                <CardDescription>Download officially verifiable PDF statements for your organizational accounting.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {invoices.length === 0 ? (
                                    <div className="text-center py-16 bg-muted/10 rounded-3xl border border-dashed">
                                        <Wallet className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No transaction history detected</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {invoices.map((invoice) => (
                                            <div key={invoice.id} className="group flex items-center justify-between p-5 border rounded-2xl hover:bg-muted/30 transition-all duration-300">
                                                <div className="flex items-center gap-5">
                                                    <div className="h-12 w-12 rounded-xl bg-background border flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                                        <Receipt className="w-6 h-6 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-sm">{invoice.invoice_number}</div>
                                                        <div className="text-xs text-muted-foreground font-medium">
                                                            Processed on {new Date(invoice.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    <div className="text-right">
                                                        <div className="font-black">{formatPrice(invoice.total_cents)}</div>
                                                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className={`text-[9px] uppercase font-black tracking-widest ${invoice.status === 'paid' ? 'bg-green-500/10 text-green-600 border-none' : ''}`}>
                                                            {invoice.status}
                                                        </Badge>
                                                    </div>
                                                    {invoice.pdf_url && (
                                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary" asChild>
                                                            <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
                                                                <Download className="w-4 h-4" />
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </div>

            {/* Upgrade Dialog */}
            <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
                <DialogContent className="max-w-md rounded-3xl p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tighter">Adjust Subscription</DialogTitle>
                        <DialogDescription className="text-base">
                            Optimize your platform resources and billing cycle.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-6">
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Billing Recurrence</Label>
                            <div className="flex p-1 bg-muted rounded-2xl">
                                <Button
                                    variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
                                    className={`flex-1 rounded-xl h-12 font-bold ${billingCycle === 'monthly' ? 'shadow-xl' : ''}`}
                                    onClick={() => setBillingCycle('monthly')}
                                >
                                    Monthly
                                </Button>
                                <Button
                                    variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
                                    className={`flex-1 rounded-xl h-12 font-bold relative ${billingCycle === 'yearly' ? 'shadow-xl' : ''}`}
                                    onClick={() => setBillingCycle('yearly')}
                                >
                                    Yearly
                                    <div className="absolute top-[-8px] right-[-4px] bg-green-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black">-17%</div>
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Select Performance Tier</Label>
                            <div className="grid gap-3">
                                {plans.filter(p => p.key !== 'enterprise').map((plan) => {
                                    const price = billingCycle === 'yearly' ? plan.price_yearly / 12 : plan.price_monthly;
                                    const isSelected = selectedPlan === plan.key;
                                    return (
                                        <button
                                            key={plan.key}
                                            onClick={() => setSelectedPlan(plan.key)}
                                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 text-left ${isSelected ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-border hover:border-primary/50'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                                    <Crown className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold">{plan.name}</span>
                                            </div>
                                            <div className="text-sm font-black">{formatPrice(price)}<span className="text-[10px] text-muted-foreground font-bold">/MO</span></div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-3">
                        <Button variant="ghost" className="flex-1 rounded-xl h-12 font-bold" onClick={() => setUpgradeDialogOpen(false)}>Continue with Current</Button>
                        <Button onClick={() => handleUpgrade(selectedPlan)} disabled={!selectedPlan} className="flex-1 rounded-xl h-12 font-black shadow-xl shadow-primary/20">
                            Apply Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
