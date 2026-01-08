import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Users, Target, Share2, TrendingUp, DollarSign, BarChart3, Globe } from 'lucide-react';
import { affiliatesApi } from '@/services/affiliatesApi';
import leadMarketplaceApi from '@/services/leadMarketplaceApi';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const CustomerAcquisition = () => {
    const navigate = useNavigate();

    // Fetch Affiliate Data
    const { data: affiliateAnalytics, isLoading: affiliateLoading } = useQuery({
        queryKey: ['affiliate-analytics'],
        queryFn: () => affiliatesApi.getAnalytics(),
    });

    // Fetch Lead Data
    const { data: leadData, isLoading: leadsLoading } = useQuery({
        queryKey: ['lead-marketplace-combined-stats'],
        queryFn: async () => {
            try {
                const [wallet, stats] = await Promise.all([
                    leadMarketplaceApi.getWallet(),
                    leadMarketplaceApi.getLeadStats()
                ]);

                // Calculate total leads from status breakdown
                const totalLeads = stats.data.leads_by_status.reduce((acc, curr) => acc + curr.cnt, 0);

                return {
                    spent: wallet.data.lifetime_spent,
                    total_leads: totalLeads,
                    conversion_rate: stats.data.acceptance_rate || 0,
                    avg_cost_per_lead: totalLeads > 0 ? (wallet.data.lifetime_spent / totalLeads) : 0
                };
            } catch (e) {
                return { spent: 0, total_leads: 0, conversion_rate: 0, avg_cost_per_lead: 0 };
            }
        },
    });

    const isLoading = affiliateLoading || leadsLoading;

    if (isLoading) return (
        <div className="p-6 space-y-8">
            <div className="flex justify-between"><Skeleton className="h-10 w-48" /><Skeleton className="h-10 w-32" /></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
        </div>
    );

    // Calculations
    const affiliateLeads = affiliateAnalytics?.referrals?.total || 0;
    const affiliateConversions = affiliateAnalytics?.referrals?.converted || 0;
    const affiliateCost = affiliateAnalytics?.payouts?.total_paid || 0;
    const activeAffiliates = affiliateAnalytics?.affiliates?.active || 0;

    const marketplaceLeads = leadData?.total_leads || 0;
    const marketplaceCost = leadData?.spent || 0;
    // For marketplace, we use acceptance_rate as a proxy for "conversion" (getting a match)
    // In a real scenario, you'd track "won" leads.
    const marketplaceConversions = Math.round(marketplaceLeads * ((leadData?.conversion_rate || 0) / 100));

    const totalLeads = affiliateLeads + marketplaceLeads;
    const totalCost = affiliateCost + marketplaceCost;
    const avgCostPerLead = totalLeads > 0 ? totalCost / totalLeads : 0;

    // Average Conversion Rate (Weighted)
    const totalConversions = affiliateConversions + marketplaceConversions;
    const avgConversionRate = totalLeads > 0 ? (totalConversions / totalLeads) : 0; // Decimal

    const channels = [
        {
            name: 'Affiliate Program',
            leads: affiliateLeads,
            conversions: affiliateConversions,
            cost: affiliateCost,
            icon: Users,
            color: 'text-orange-600',
            bg: 'bg-orange-100 dark:bg-orange-900/20',
            link: '/affiliates'
        },
        {
            name: 'Lead Marketplace',
            leads: marketplaceLeads,
            conversions: marketplaceConversions, // Estimated
            cost: marketplaceCost,
            icon: Target,
            color: 'text-blue-600',
            bg: 'bg-blue-100 dark:bg-blue-900/20',
            link: '/lead-marketplace/leads'
        },
        {
            name: 'Social Media',
            leads: 0,
            conversions: 0,
            cost: 0,
            icon: Share2,
            color: 'text-pink-600',
            bg: 'bg-pink-100 dark:bg-pink-900/20',
            link: '/marketing/social'
        }
    ];

    return (
        <div className="p-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">Customer Acquisition</h1>
                    <p className="text-muted-foreground text-sm">Measure and optimize your marketing performance</p>
                </div>
                <Button onClick={() => navigate('/marketing/settings')} >
                    Configure Channels
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalLeads}</div>
                        <p className="text-xs text-muted-foreground">
                            Across all channels
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Acquisition Cost</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalCost.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Avg. ${avgCostPerLead.toFixed(2)} / lead
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Conversion</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(avgConversionRate * 100).toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">
                            Weighted average
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Sources</CardTitle>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeAffiliates + 1}</div>
                        <p className="text-xs text-muted-foreground">
                            {activeAffiliates} affiliates + Marketplace
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Channels Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                {channels.map((channel) => (
                    <Card key={channel.name} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(channel.link)}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className={`p-2 rounded-lg ${channel.bg}`}>
                                    <channel.icon className={`h-5 w-5 ${channel.color}`} />
                                </div>
                                <Badge variant="secondary">Active</Badge>
                            </div>
                            <CardTitle className="text-lg mt-4">{channel.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                    <p className="text-xs text-muted-foreground">Leads</p>
                                    <p className="text-xl font-bold">{channel.leads}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Cost</p>
                                    <p className="text-xl font-bold">${channel.cost.toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Placeholders for Trends and Attribution (as requested) */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Performance Trends</CardTitle>
                        <CardDescription>Lead volume over time (Last 30 days)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-60 flex items-center justify-center bg-accent/20 rounded-md">
                        <BarChart3 className="h-10 w-10 text-muted-foreground opacity-20" />
                        <span className="ml-2 text-muted-foreground">Chart placeholder</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Attribution</CardTitle>
                        <CardDescription>Source breakdown</CardDescription>
                    </CardHeader>
                    <CardContent className="h-60 flex items-center justify-center bg-accent/20 rounded-md">
                        <div className="text-center">
                            <Target className="h-10 w-10 text-muted-foreground opacity-20 mx-auto" />
                            <span className="text-muted-foreground block mt-2">Attribution data unavailable</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CustomerAcquisition;
