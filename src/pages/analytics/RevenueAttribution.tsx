import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DollarSign,
    TrendingUp,
    Target,
    Users,
    Mail,
    Phone,
    Globe,
    MessageSquare,
    BarChart3,
    PieChart,
    Calendar
} from 'lucide-react';
import { toast } from 'sonner';

interface AttributionData {
    totalRevenue: number;
    attributedRevenue: number;
    unattributedRevenue: number;
    byChannel: { channel: string; revenue: number; conversions: number }[];
    byCampaign: { campaign: string; revenue: number; conversions: number; roi: number }[];
    byTouchpoint: { touchpoint: string; revenue: number; weight: number }[];
    conversionPaths: { path: string[]; revenue: number; count: number }[];
}

const channelIcons: Record<string, any> = {
    email: Mail,
    sms: MessageSquare,
    phone: Phone,
    web: Globe,
    social: Users,
    paid: Target
};

export default function RevenueAttribution() {
    const [attribution, setAttribution] = useState<AttributionData>({
        totalRevenue: 125000,
        attributedRevenue: 98500,
        unattributedRevenue: 26500,
        byChannel: [
            { channel: 'email', revenue: 45000, conversions: 156 },
            { channel: 'phone', revenue: 28000, conversions: 89 },
            { channel: 'web', revenue: 15500, conversions: 67 },
            { channel: 'sms', revenue: 7000, conversions: 34 },
            { channel: 'social', revenue: 3000, conversions: 12 }
        ],
        byCampaign: [
            { campaign: 'Summer Sale 2024', revenue: 35000, conversions: 145, roi: 450 },
            { campaign: 'Product Launch', revenue: 28000, conversions: 98, roi: 380 },
            { campaign: 'Referral Program', revenue: 18500, conversions: 76, roi: 520 }
        ],
        byTouchpoint: [
            { touchpoint: 'First Touch', revenue: 42000, weight: 40 },
            { touchpoint: 'Last Touch', revenue: 35000, weight: 30 },
            { touchpoint: 'Linear', revenue: 21500, weight: 30 }
        ],
        conversionPaths: [
            { path: ['Email', 'Web', 'Phone'], revenue: 28000, count: 45 },
            { path: ['Social', 'Web', 'Email'], revenue: 18500, count: 32 },
            { path: ['Web', 'Phone'], revenue: 15000, count: 28 }
        ]
    });

    const [timeRange, setTimeRange] = useState('30d');
    const [attributionModel, setAttributionModel] = useState('linear');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadAttribution();
    }, [timeRange, attributionModel]);

    const loadAttribution = async () => {
        setLoading(true);
        try {
            // TODO: Implement actual API call when backend endpoint is ready
            // For now, using the mock data already in state
            console.log('Attribution would be loaded with timeRange:', timeRange, 'model:', attributionModel);
        } catch (error) {
            console.error('Failed to load attribution data');
        } finally {
            setLoading(false);
        }
    };

    const attributionRate = ((attribution.attributedRevenue / attribution.totalRevenue) * 100).toFixed(1);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">
                        Revenue Attribution
                    </h1>
                    <p className="text-muted-foreground">
                        Track revenue sources and optimize your marketing spend
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 90 days</SelectItem>
                            <SelectItem value="12m">Last 12 months</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={attributionModel} onValueChange={setAttributionModel}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="first_touch">First Touch</SelectItem>
                            <SelectItem value="last_touch">Last Touch</SelectItem>
                            <SelectItem value="linear">Linear</SelectItem>
                            <SelectItem value="time_decay">Time Decay</SelectItem>
                            <SelectItem value="u_shaped">U-Shaped</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${attribution.totalRevenue.toLocaleString()}</div>
                        <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>+18% from last period</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Attributed Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            ${attribution.attributedRevenue.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{attributionRate}% of total</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Unattributed Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            ${attribution.unattributedRevenue.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                            {(100 - parseFloat(attributionRate)).toFixed(1)}% of total
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Attribution Model</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold capitalize">{attributionModel.replace('_', ' ')}</div>
                        <div className="text-sm text-muted-foreground mt-1">Current model</div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Analytics */}
            <Tabs defaultValue="channels" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="channels">
                        <Target className="h-4 w-4 mr-2" />
                        By Channel
                    </TabsTrigger>
                    <TabsTrigger value="campaigns">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        By Campaign
                    </TabsTrigger>
                    <TabsTrigger value="touchpoints">
                        <PieChart className="h-4 w-4 mr-2" />
                        By Touchpoint
                    </TabsTrigger>
                    <TabsTrigger value="paths">
                        <Calendar className="h-4 w-4 mr-2" />
                        Conversion Paths
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="channels">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue by Channel</CardTitle>
                            <CardDescription>Performance across marketing channels</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {attribution.byChannel.map(channel => {
                                    const Icon = channelIcons[channel.channel] || Target;
                                    const percentage = ((channel.revenue / attribution.attributedRevenue) * 100).toFixed(1);

                                    return (
                                        <div key={channel.channel} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-full bg-primary/10">
                                                        <Icon className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium capitalize">{channel.channel}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {channel.conversions} conversions
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold">${channel.revenue.toLocaleString()}</div>
                                                    <div className="text-sm text-muted-foreground">{percentage}%</div>
                                                </div>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-primary h-2 rounded-full"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="campaigns">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue by Campaign</CardTitle>
                            <CardDescription>Top performing campaigns</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {attribution.byCampaign.map((campaign, index) => (
                                    <div key={campaign.campaign} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                                                #{index + 1}
                                            </div>
                                            <div>
                                                <div className="font-semibold">{campaign.campaign}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {campaign.conversions} conversions • ROI: {campaign.roi}%
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold">${campaign.revenue.toLocaleString()}</div>
                                            <Badge variant="default">{campaign.roi}% ROI</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="touchpoints">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue by Touchpoint</CardTitle>
                            <CardDescription>Attribution across customer journey</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {attribution.byTouchpoint.map(touchpoint => {
                                    const percentage = ((touchpoint.revenue / attribution.attributedRevenue) * 100).toFixed(1);

                                    return (
                                        <div key={touchpoint.touchpoint} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium">{touchpoint.touchpoint}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Weight: {touchpoint.weight}%
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold">${touchpoint.revenue.toLocaleString()}</div>
                                                    <div className="text-sm text-muted-foreground">{percentage}%</div>
                                                </div>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="paths">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Conversion Paths</CardTitle>
                            <CardDescription>Most common customer journeys</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {attribution.conversionPaths.map((path, index) => (
                                    <div key={index} className="p-4 border rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                {path.path.map((step, i) => (
                                                    <React.Fragment key={i}>
                                                        <Badge variant="outline">{step}</Badge>
                                                        {i < path.path.length - 1 && <span className="text-muted-foreground">→</span>}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold">${path.revenue.toLocaleString()}</div>
                                                <div className="text-sm text-muted-foreground">{path.count} conversions</div>
                                            </div>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-1.5">
                                            <div
                                                className="bg-green-600 h-1.5 rounded-full"
                                                style={{ width: `${(path.revenue / attribution.attributedRevenue) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
