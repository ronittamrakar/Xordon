import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface RevenueChartProps {
    data: Array<{ date: string; revenue: number; target?: number }>;
    className?: string;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data, className }) => {
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const avgRevenue = totalRevenue / (data.length || 1);
    const trend = data.length > 1
        ? ((data[data.length - 1].revenue - data[0].revenue) / data[0].revenue) * 100
        : 0;

    return (
        <Card className={cn("bg-background/50 backdrop-blur-md border-none shadow-xl", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-emerald-500" />
                        Revenue Trend
                    </CardTitle>
                    <CardDescription>Last 30 days performance</CardDescription>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-emerald-500">${totalRevenue.toLocaleString()}</p>
                    <div className={cn(
                        "flex items-center gap-1 text-xs font-bold",
                        trend >= 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                        <TrendingUp className={cn("h-3 w-3", trend < 0 && "rotate-180")} />
                        {Math.abs(trend).toFixed(1)}% vs start
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                    backgroundColor: 'hsl(var(--background))'
                                }}
                                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                strokeWidth={3}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
