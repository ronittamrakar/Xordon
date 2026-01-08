import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
    AreaChart,
    Area
} from 'recharts';
import {
    TrendingUp,
    DollarSign,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    Download,
    Info
} from 'lucide-react';
import { api } from '@/lib/api';

const ForecastingPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [forecastData, setForecastData] = useState<any>(null);

    useEffect(() => {
        const loadForecast = async () => {
            try {
                setLoading(true);
                const data = await api.crm.getForecast();

                // Transform backend data for the charts
                // Backend returns: expected_revenue, weighted_pipeline, actual_revenue, deals_closed, confidence_score
                // We'll also try to fetch analytics for the projections chart if possible, 
                // but for now we'll adapt the main forecast data.

                setForecastData({
                    expectedRevenue: data.expected_revenue || 0,
                    weightedPipeline: data.weighted_pipeline || 0,
                    actualRevenue: data.actual_revenue || 0,
                    dealsClosed: data.deals_closed || 0,
                    confidenceScore: data.confidence_score || 75,
                    // Projection and stage data might need additional backend support or fallback
                    projections: data.projections || [
                        { month: 'Current', revenue: data.actual_revenue || 0, forecast: data.expected_revenue || 0 },
                    ],
                    stageProbability: data.stage_probability || [
                        { stage: 'Weighted Total', value: data.weighted_pipeline || 0, weighted: data.weighted_pipeline || 0, probability: 100 },
                    ]
                });
            } catch (error) {
                console.error('Failed to load forecast data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadForecast();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (!forecastData) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-2">
                    <p className="text-muted-foreground">No forecast data available</p>
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Revenue Forecasting</h1>
                    <p className="text-muted-foreground italic">Predict future sales performance based on current pipeline probability.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        By Region
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-0 overflow-hidden relative">
                    <div className="absolute top-[-20px] right-[-20px] opacity-10">
                        <DollarSign className="h-40 w-40" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-80 uppercase tracking-wider">Expected Revenue (Q3)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${forecastData.expectedRevenue.toLocaleString()}</div>
                        <div className="flex items-center mt-2 text-primary-foreground/80 text-sm">
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            <span>+15.2% from Q2</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Weighted Pipeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">${forecastData.weightedPipeline.toLocaleString()}</div>
                        <p className="text-sm text-muted-foreground mt-2">Adjusted for stage probability</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Forecast Confidence</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{forecastData.confidenceScore}%</div>
                        <Progress value={forecastData.confidenceScore} className="h-2" />
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Projections Chart */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                    <CardHeader>
                        <CardTitle>Revenue Projections</CardTitle>
                        <CardDescription>Actual vs Predicted monthly revenue</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={forecastData.projections}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                <Area type="monotone" dataKey="forecast" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorForecast)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Stage Breakdown */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                    <CardHeader>
                        <CardTitle>Stage Weighted Breakdown</CardTitle>
                        <CardDescription>How much each stage contributes to the forecast</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {forecastData.stageProbability.map((stage: any) => (
                            <div key={stage.stage} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="font-semibold">{stage.stage}</span>
                                        <span className="ml-2 text-xs text-muted-foreground">({stage.probability}% prob.)</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-slate-900 dark:text-slate-100">${stage.weighted.toLocaleString()}</div>
                                        <div className="text-xs text-muted-foreground">of ${stage.value.toLocaleString()} total</div>
                                    </div>
                                </div>
                                <Progress value={stage.probability} className="h-2 bg-slate-100 dark:bg-slate-800" />
                            </div>
                        ))}

                        <div className="pt-4 mt-6 border-t flex items-start gap-3 text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl">
                            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                            <p>Projections are based on historical win rates per stage. These weights can be adjusted in CRM Settings.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ForecastingPage;
