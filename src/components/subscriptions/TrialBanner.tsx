import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles, ArrowRight } from 'lucide-react';

interface TrialBannerProps {
    trialEndDate: string;
    planName: string;
    onUpgrade?: () => void;
    daysRemaining?: number;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({
    trialEndDate,
    planName,
    onUpgrade,
    daysRemaining
}) => {
    const endDate = new Date(trialEndDate);
    const today = new Date();
    const daysLeft = daysRemaining ?? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const isExpiringSoon = daysLeft <= 3;
    const isExpired = daysLeft < 0;

    if (isExpired) {
        return (
            <Alert className="border-red-500/50 bg-red-500/10">
                <Clock className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-600 font-semibold">Trial Expired</AlertTitle>
                <AlertDescription className="text-sm text-muted-foreground">
                    Your trial for <span className="font-medium text-foreground">{planName}</span> has ended.
                    Upgrade now to continue enjoying all features.
                </AlertDescription>
                {onUpgrade && (
                    <Button
                        onClick={onUpgrade}
                        className="mt-3 bg-red-600 hover:bg-red-700"
                        size="sm"
                    >
                        Upgrade Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </Alert>
        );
    }

    return (
        <Alert className={`border-blue-500/50 ${isExpiringSoon ? 'bg-orange-500/10' : 'bg-blue-500/10'}`}>
            <Sparkles className={`h-4 w-4 ${isExpiringSoon ? 'text-orange-600' : 'text-blue-600'}`} />
            <AlertTitle className={`${isExpiringSoon ? 'text-orange-600' : 'text-blue-600'} font-semibold`}>
                {isExpiringSoon ? '⚠️ Trial Ending Soon' : '🎉 Trial Active'}
            </AlertTitle>
            <AlertDescription className="text-sm text-muted-foreground">
                You have <span className="font-bold text-foreground">{daysLeft} day{daysLeft !== 1 ? 's' : ''}</span> remaining
                in your trial for <span className="font-medium text-foreground">{planName}</span>.
                {isExpiringSoon && ' Upgrade now to avoid service interruption.'}
            </AlertDescription>
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Trial ends on {endDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                })}</span>
            </div>
            {onUpgrade && (
                <Button
                    onClick={onUpgrade}
                    variant={isExpiringSoon ? "default" : "outline"}
                    className="mt-3"
                    size="sm"
                >
                    {isExpiringSoon ? 'Upgrade Now' : 'Upgrade to Premium'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            )}
        </Alert>
    );
};
