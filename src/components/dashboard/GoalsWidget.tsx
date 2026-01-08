import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Goal {
    id: string;
    title: string;
    current: number;
    target: number;
    unit: string;
    period: string;
    trend?: number;
}

interface GoalsWidgetProps {
    goals: Goal[];
    className?: string;
}

export const GoalsWidget: React.FC<GoalsWidgetProps> = ({ goals, className }) => {
    return (
        <Card className={cn("bg-background/50 backdrop-blur-md border-none shadow-xl", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Performance Goals
                </CardTitle>
                <CardDescription>Track your key metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                {goals.length > 0 ? goals.map((goal) => {
                    const percentage = Math.min((goal.current / goal.target) * 100, 100);
                    const isOnTrack = percentage >= 70;
                    const remaining = goal.target - goal.current;

                    return (
                        <div key={goal.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold">{goal.title}</p>
                                    <p className="text-xs text-muted-foreground">{goal.period}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black">
                                        {goal.current.toLocaleString()}
                                        <span className="text-xs text-muted-foreground font-normal">
                                            /{goal.target.toLocaleString()} {goal.unit}
                                        </span>
                                    </p>
                                    {goal.trend !== undefined && (
                                        <div className={cn(
                                            "flex items-center justify-end gap-1 text-xs font-bold",
                                            goal.trend >= 0 ? "text-emerald-500" : "text-red-500"
                                        )}>
                                            {goal.trend >= 0 ? (
                                                <TrendingUp className="h-3 w-3" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3" />
                                            )}
                                            {Math.abs(goal.trend).toFixed(1)}%
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Progress
                                    value={percentage}
                                    className={cn(
                                        "h-2",
                                        isOnTrack ? "[&>div]:bg-emerald-500" : "[&>div]:bg-amber-500"
                                    )}
                                />
                                <div className="flex justify-between text-[12px] font-medium">
                                    <span className={cn(
                                        "uppercase tracking-widest",
                                        isOnTrack ? "text-emerald-500" : "text-amber-500"
                                    )}>
                                        {percentage.toFixed(0)}% Complete
                                    </span>
                                    <span className="text-muted-foreground">
                                        {remaining > 0 ? `${remaining.toLocaleString()} ${goal.unit} to go` : 'Goal Achieved! 🎉'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <Target className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No active goals</p>
                        <p className="text-xs opacity-60">Set goals to track your progress.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
