import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, MessageSquare, Users, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChannelStat {
    channel: 'email' | 'sms' | 'call' | 'social';
    sent: number;
    delivered: number;
    opened?: number;
    clicked?: number;
    replied?: number;
    avgResponseTime?: string;
}

interface ChannelPerformanceProps {
    stats: ChannelStat[];
    className?: string;
}

const channelConfig = {
    email: { label: 'Email', icon: Mail, color: 'text-blue-500 bg-blue-500/10' },
    sms: { label: 'SMS', icon: MessageSquare, color: 'text-purple-500 bg-purple-500/10' },
    call: { label: 'Calls', icon: Phone, color: 'text-emerald-500 bg-emerald-500/10' },
    social: { label: 'Social', icon: Users, color: 'text-pink-500 bg-pink-500/10' },
};

export const ChannelPerformance: React.FC<ChannelPerformanceProps> = ({ stats, className }) => {
    return (
        <Card className={cn("bg-background/50 backdrop-blur-md border-none shadow-xl", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Channel Performance
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {stats.length > 0 ? stats.map((stat) => {
                    const config = channelConfig[stat.channel];
                    const Icon = config.icon;
                    const deliveryRate = stat.sent > 0 ? (stat.delivered / stat.sent) * 100 : 0;
                    const openRate = stat.opened && stat.delivered > 0 ? (stat.opened / stat.delivered) * 100 : 0;
                    const clickRate = stat.clicked && stat.opened ? (stat.clicked / stat.opened) * 100 : 0;

                    return (
                        <div key={stat.channel} className="p-4 rounded-xl bg-muted/10 border border-border/30 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", config.color)}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{config.label}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {stat.sent.toLocaleString()} sent
                                        </p>
                                    </div>
                                </div>
                                {stat.avgResponseTime && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {stat.avgResponseTime}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-2 rounded-lg bg-background/50">
                                    <p className="text-xs text-muted-foreground mb-1">Delivery</p>
                                    <p className="text-sm font-black text-emerald-500">{deliveryRate.toFixed(1)}%</p>
                                </div>
                                {stat.opened !== undefined && (
                                    <div className="text-center p-2 rounded-lg bg-background/50">
                                        <p className="text-xs text-muted-foreground mb-1">Open</p>
                                        <p className="text-sm font-black text-blue-500">{openRate.toFixed(1)}%</p>
                                    </div>
                                )}
                                {stat.clicked !== undefined && (
                                    <div className="text-center p-2 rounded-lg bg-background/50">
                                        <p className="text-xs text-muted-foreground mb-1">Click</p>
                                        <p className="text-sm font-black text-purple-500">{clickRate.toFixed(1)}%</p>
                                    </div>
                                )}
                                {stat.replied !== undefined && (
                                    <div className="text-center p-2 rounded-lg bg-background/50">
                                        <p className="text-xs text-muted-foreground mb-1">Reply</p>
                                        <p className="text-sm font-black text-amber-500">{stat.replied}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No channel data available</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
