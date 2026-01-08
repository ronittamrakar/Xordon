import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { Subscription } from '@/services/subscriptionsApi';

interface SubscriptionCardProps {
    subscription: Subscription;
    onCancel?: (id: number) => void;
    onViewDetails?: (id: number) => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
    subscription,
    onCancel,
    onViewDetails
}) => {
    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-500/10 text-green-600 border-green-500/20';
            case 'trialing':
                return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'past_due':
                return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
            case 'cancelled':
                return 'bg-red-500/10 text-red-600 border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
        }
    };

    const isTrialing = subscription.status === 'trialing';
    const isPastDue = subscription.status === 'past_due';

    return (
        <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-primary/10">
            {/* Status Indicator */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${subscription.status === 'active' ? 'bg-green-500' :
                    subscription.status === 'trialing' ? 'bg-blue-500' :
                        subscription.status === 'past_due' ? 'bg-orange-500' :
                            'bg-red-500'
                }`} />

            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            {subscription.product_name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {subscription.subscription_number}
                        </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(subscription.status)} capitalize px-3 py-1`}>
                        {subscription.status}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Customer Info */}
                <div className="flex items-center gap-2 text-sm">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {subscription.contact_first_name?.[0]}{subscription.contact_last_name?.[0]}
                    </div>
                    <div>
                        <div className="font-medium">
                            {subscription.contact_first_name} {subscription.contact_last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">{subscription.contact_email}</div>
                    </div>
                </div>

                {/* Billing Info */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <DollarSign className="h-3 w-3" />
                            <span>Amount</span>
                        </div>
                        <div className="text-lg font-bold text-primary">
                            {formatCurrency(subscription.billing_amount, subscription.currency)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            per {subscription.billing_interval}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Next Billing</span>
                        </div>
                        <div className="text-sm font-semibold">
                            {subscription.next_billing_date
                                ? new Date(subscription.next_billing_date).toLocaleDateString()
                                : 'N/A'
                            }
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Started {new Date(subscription.start_date).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                {/* Trial Banner */}
                {isTrialing && subscription.trial_end_date && (
                    <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <div className="flex-1 text-xs">
                            <span className="font-medium text-blue-600">Trial Period</span>
                            <span className="text-muted-foreground ml-1">
                                Ends {new Date(subscription.trial_end_date).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                )}

                {/* Past Due Warning */}
                {isPastDue && (
                    <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <div className="flex-1 text-xs">
                            <span className="font-medium text-orange-600">Payment Failed</span>
                            <span className="text-muted-foreground ml-1">
                                Action required
                            </span>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onViewDetails?.(subscription.id)}
                    >
                        View Details
                    </Button>
                    {subscription.status !== 'cancelled' && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onCancel?.(subscription.id)}
                        >
                            Cancel
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
