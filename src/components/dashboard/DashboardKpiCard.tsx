import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardKpiCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    icon: LucideIcon;
    color?: string;
    chartData?: any[];
    className?: string;
}

export const DashboardKpiCard: React.FC<DashboardKpiCardProps> = ({
    title,
    value,
    subtitle,
    trend,
    icon: Icon,
    color = "primary",
    chartData,
    className
}) => {
    return (
        <Card className={cn(
            "relative overflow-hidden border-none bg-background/50 backdrop-blur-md shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl group",
            className
        )}>
            {/* Background Gradient Glow */}
            <div className={cn(
                "absolute -right-4 -top-4 h-24 w-24 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-30",
                color === "primary" ? "bg-primary" :
                    color === "success" ? "bg-emerald-500" :
                        color === "warning" ? "bg-amber-500" :
                            color === "danger" ? "bg-rose-500" :
                                `bg-${color}`
            )} />

            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                        "p-2.5 rounded-xl bg-opacity-10",
                        color === "primary" ? "bg-primary text-primary" :
                            color === "success" ? "bg-emerald-500 text-emerald-500" :
                                color === "warning" ? "bg-amber-500 text-amber-500" :
                                    color === "danger" ? "bg-rose-500 text-rose-500" :
                                        `bg-${color} text-${color}`
                    )}>
                        <Icon className="h-5 w-5" />
                    </div>
                    {trend && (
                        <div className={cn(
                            "text-xs font-semibold px-2 py-1 rounded-full",
                            trend.isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                        )}>
                            {trend.isPositive ? '+' : ''}{trend.value}%
                        </div>
                    )}
                </div>

                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                    <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                    )}
                </div>

                {chartData && (
                    <div className="h-16 mt-4 -mx-6 -mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id={`gradient-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={
                                            color === "primary" ? "hsl(var(--primary))" :
                                                color === "success" ? "#10b981" :
                                                    color === "warning" ? "#f59e0b" :
                                                        color === "danger" ? "#f43f5e" :
                                                            "currentColor"
                                        } stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={
                                            color === "primary" ? "hsl(var(--primary))" :
                                                color === "success" ? "#10b981" :
                                                    color === "warning" ? "#f59e0b" :
                                                        color === "danger" ? "#f43f5e" :
                                                            "currentColor"
                                        } stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={
                                        color === "primary" ? "hsl(var(--primary))" :
                                            color === "success" ? "#10b981" :
                                                color === "warning" ? "#f59e0b" :
                                                    color === "danger" ? "#f43f5e" :
                                                        "currentColor"
                                    }
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill={`url(#gradient-${title.replace(/\s+/g, '')})`}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
