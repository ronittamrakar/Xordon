import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { LEAD_STAGES } from '@/types/crm';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    Target,
    Clock,
    BarChart3,
    PieChart,
    ArrowRight,
    Building2,
    RefreshCw
} from 'lucide-react';

interface AnalyticsData {
    pipeline: Array<{ lead_stage: string; count: number; total_value: number; avg_score: number }>;
    funnel: {
        total_leads: number;
        contacted: number;
        qualified: number;
        proposal: number;
        negotiation: number;
        closed_won: number;
        closed_lost: number;
    };
    activityTrends: Array<{ date: string; activity_type: string; count: number }>;
    sources: Array<{ source: string; count: number; total_value: number; won_count: number }>;
    topLeads: Array<{
        id: string;
        lead_value: number;
        lead_score: number;
        lead_stage: string;
        source: string;
        first_name: string;
        last_name: string;
        email: string;
        company?: string;
    }>;
    winLoss: Array<{ month: string; won: number; lost: number; won_value: number }>;
    stageTime: Array<{ lead_stage: string; avg_days: number }>;
}

const SalesAnalytics: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');

    const loadData = async () => {
        try {
            setLoading(true);
            const analytics = await api.crm.getAnalytics(parseInt(period));
            setData(analytics);
        } catch (error) {
            console.error('Failed to load Sales analytics:', error);
            toast.error('Failed to load Sales analytics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [period]);

    const getStageColor = (stage: string) => {
        const stageConfig = LEAD_STAGES.find(s => s.value === stage);
        return stageConfig?.color || '#6c757d';
    };

    const getStageLabel = (stage: string) => {
        const stageConfig = LEAD_STAGES.find(s => s.value === stage);
        return stageConfig?.label || stage;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Unable to load analytics data</p>
                <Button onClick={loadData} className="mt-4">Retry</Button>
            </div>
        );
    }

    const { pipeline, funnel, sources, topLeads, winLoss, stageTime } = data;

    // Calculate totals
    const totalLeads = pipeline.reduce((sum, p) => sum + p.count, 0);
    const totalValue = pipeline.reduce((sum, p) => sum + parseFloat(String(p.total_value)), 0);
    const wonDeals = funnel.closed_won;
    const lostDeals = funnel.closed_lost;
    const winRate = wonDeals + lostDeals > 0 ? Math.round((wonDeals / (wonDeals + lostDeals)) * 100) : 0;

    // Calculate recent win/loss trend
    const recentWinLoss = winLoss.slice(-3);
    const recentWon = recentWinLoss.reduce((sum, w) => sum + w.won, 0);
    const recentLost = recentWinLoss.reduce((sum, w) => sum + w.lost, 0);
    const recentWinRate = recentWon + recentLost > 0 ? Math.round((recentWon / (recentWon + recentLost)) * 100) : 0;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">Sales Analytics</h1>
                    <p className="text-gray-600">Performance metrics and revenue insights</p>
                </div>
                <div className="flex items-center gap-4">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                            <SelectItem value="365">Last year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={loadData} disabled={loading}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalLeads}</div>
                        <p className="text-xs text-muted-foreground">
                            {funnel.total_leads - funnel.contacted} not yet contacted
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Across all stages
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{winRate}%</div>
                        <div className="flex items-center text-xs">
                            {recentWinRate > winRate ? (
                                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                            ) : (
                                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                            )}
                            <span className={recentWinRate > winRate ? 'text-green-500' : 'text-red-500'}>
                                {recentWinRate}% recent
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Deals Won</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{wonDeals}</div>
                        <p className="text-xs text-muted-foreground">
                            {lostDeals} deals lost
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Pipeline & Funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pipeline Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Pipeline Breakdown
                        </CardTitle>
                        <CardDescription>Value by stage</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {pipeline.map((stage) => (
                                <div key={stage.lead_stage} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: getStageColor(stage.lead_stage) }}
                                            />
                                            <span className="text-sm font-medium">{getStageLabel(stage.lead_stage)}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-medium">{stage.count} deals</span>
                                            <span className="text-xs text-muted-foreground ml-2">
                                                ${parseFloat(String(stage.total_value)).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <Progress
                                        value={totalValue > 0 ? (stage.total_value / totalValue) * 100 : 0}
                                        className="h-2"
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Conversion Funnel */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" />
                            Sales Funnel
                        </CardTitle>
                        <CardDescription>Deal progression</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[
                                { label: 'Total Leads', value: funnel.total_leads, color: '#6c757d' },
                                { label: 'Contacted', value: funnel.contacted, color: '#17a2b8' },
                                { label: 'Qualified', value: funnel.qualified, color: '#28a745' },
                                { label: 'Proposal', value: funnel.proposal, color: '#ffc107' },
                                { label: 'Negotiation', value: funnel.negotiation, color: '#fd7e14' },
                                { label: 'Won', value: funnel.closed_won, color: '#28a745' },
                            ].map((step, index, arr) => {
                                const prevValue = index > 0 ? arr[index - 1].value : step.value;
                                const conversionRate = prevValue > 0 ? Math.round((step.value / prevValue) * 100) : 0;
                                const width = funnel.total_leads > 0 ? (step.value / funnel.total_leads) * 100 : 0;

                                return (
                                    <div key={step.label} className="flex items-center gap-3">
                                        <div className="w-24 text-sm">{step.label}</div>
                                        <div className="flex-1 relative">
                                            <div
                                                className="h-8 rounded flex items-center justify-center text-white text-sm font-medium transition-all"
                                                style={{
                                                    width: `${Math.max(width, 10)}%`,
                                                    backgroundColor: step.color
                                                }}
                                            >
                                                {step.value}
                                            </div>
                                        </div>
                                        {index > 0 && (
                                            <div className="w-16 text-right text-xs text-muted-foreground">
                                                {conversionRate}%
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Win/Loss Trend */}
            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Trend</CardTitle>
                        <CardDescription>Monthly closed revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {winLoss.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">No revenue data available</p>
                        ) : (
                            <div className="h-[300px] w-full flex items-end justify-between gap-2 px-4">
                                {winLoss.slice(-12).map((wl) => {
                                    const maxVal = Math.max(...winLoss.slice(-12).map(i => i.won_value));
                                    const height = maxVal > 0 ? (wl.won_value / maxVal) * 100 : 0;
                                    return (
                                        <div key={wl.month} className="flex flex-col items-center flex-1 group">
                                            <div className="w-full bg-blue-100 rounded-t-sm relative transition-all group-hover:bg-blue-200" style={{ height: `${Math.max(height, 5)}%` }}>
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded">
                                                    ${wl.won_value.toLocaleString()}
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground mt-2">{wl.month}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SalesAnalytics;
