import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Mail, Smartphone, Users, Rocket, ExternalLink, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    icon: any;
    isCompleted: boolean;
    link: string;
}

interface OnboardingChecklistProps {
    steps: OnboardingStep[];
    className?: string;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({ steps, className }) => {
    const navigate = useNavigate();
    const completedCount = steps.filter(s => s.isCompleted).length;
    const progress = (completedCount / steps.length) * 100;

    if (progress === 100) return null;

    return (
        <Card className={cn("bg-gradient-to-br from-primary/5 via-background to-background border-primary/20 shadow-lg", className)}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-primary animate-pulse" />
                        <CardTitle className="text-xl">Launchpad</CardTitle>
                    </div>
                    <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                        {completedCount}/{steps.length} Steps
                    </span>
                </div>
                <CardDescription>
                    Complete these essential steps to get the most out of Xordon.
                </CardDescription>
                <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-xs font-medium mb-1">
                        <span>Overall Progress</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    {steps.map((step) => (
                        <div
                            key={step.id}
                            onClick={() => !step.isCompleted && navigate(step.link)}
                            className={cn(
                                "p-4 rounded-xl border transition-all cursor-pointer group hover:shadow-md",
                                step.isCompleted
                                    ? "bg-emerald-500/5 border-emerald-500/20 opacity-80"
                                    : "bg-background border-border hover:border-primary/50"
                            )}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    step.isCompleted ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                                )}>
                                    <step.icon className="h-5 w-5" />
                                </div>
                                {step.isCompleted ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                )}
                            </div>
                            <h4 className="font-semibold text-sm mb-1 line-clamp-1">{step.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                                {step.description}
                            </p>
                            {!step.isCompleted && (
                                <div className="flex items-center text-[12px] font-bold text-primary uppercase tracking-wider">
                                    Complete Now <ExternalLink className="h-2 w-2 ml-1" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
