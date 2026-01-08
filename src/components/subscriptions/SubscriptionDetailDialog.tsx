import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Calendar,
    CreditCard,
    DollarSign,
    User,
    Clock,
    FileText,
    Activity,
    AlertCircle,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { Subscription } from '@/services/subscriptionsApi';

interface SubscriptionDetailDialogProps {
    subscription: Subscription | null;
    open: boolean;
    onClose: () => void;
    onCancel?: (id: number) => void;
    onPause?: (id: number) => void;
    onResume?: (id: number) => void;
}

export const SubscriptionDetailDialog: React.FC<SubscriptionDetailDialogProps> = ({
    subscription,
    open,
    onClose,
    onCancel,
    onPause,
    onResume
}) => {
    const [activeTab, setActiveTab] = useState('overview');

    if (!subscription) return null;

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <CheckCircle2 className="h-5 w-5 text-green-600" />;
            case 'trialing':
                return <Clock className="h-5 w-5 text-blue-600" />;
            case 'past_due':
                return <AlertCircle className="h-5 w-5 text-orange-600" />;
            case 'cancelled':
                return <XCircle className="h-5 w-5 text-red-600" />;
            default:
                return <Activity className="h-5 w-5 text-gray-600" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                {getStatusIcon(subscription.status)}
                                {subscription.product_name}
                            </DialogTitle>
                            <DialogDescription className="mt-1">
                                {subscription.subscription_number}
                            </DialogDescription>
                        </div>
                        <Badge className="capitalize">
                            {subscription.status}
                        </Badge>
                    </div>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="billing">Billing</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4 mt-4">
                        {/* Customer Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Customer Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Name</span>
                                    <span className="text-sm font-medium">
                                        {subscription.contact_first_name} {subscription.contact_last_name}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Email</span>
                                    <span className="text-sm font-medium">{subscription.contact_email}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Subscription Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Subscription Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Plan</span>
                                    <span className="text-sm font-medium">{subscription.product_name}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Start Date</span>
                                    <span className="text-sm font-medium">
                                        {new Date(subscription.start_date).toLocaleDateString()}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Billing Cycle</span>
                                    <span className="text-sm font-medium capitalize">
                                        {subscription.billing_interval_count > 1
                                            ? `Every ${subscription.billing_interval_count} ${subscription.billing_interval}s`
                                            : subscription.billing_interval
                                        }
                                    </span>
                                </div>
                                {subscription.trial_end_date && (
                                    <>
                                        <Separator />
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Trial Ends</span>
                                            <span className="text-sm font-medium text-blue-600">
                                                {new Date(subscription.trial_end_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="billing" className="space-y-4 mt-4">
                        {/* Billing Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    Billing Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Billing Amount</span>
                                    <span className="text-lg font-bold text-primary">
                                        {formatCurrency(subscription.billing_amount, subscription.currency)}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Currency</span>
                                    <span className="text-sm font-medium">{subscription.currency}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Next Billing Date</span>
                                    <span className="text-sm font-medium">
                                        {subscription.next_billing_date
                                            ? new Date(subscription.next_billing_date).toLocaleDateString()
                                            : 'N/A'
                                        }
                                    </span>
                                </div>
                                {subscription.setup_fee > 0 && (
                                    <>
                                        <Separator />
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Setup Fee</span>
                                            <span className="text-sm font-medium">
                                                {formatCurrency(subscription.setup_fee, subscription.currency)}
                                                {subscription.setup_fee_paid && (
                                                    <Badge variant="outline" className="ml-2 text-xs">Paid</Badge>
                                                )}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payment Method */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    Payment Method
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {subscription.stripe_subscription_id ? (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Badge variant="outline">Stripe</Badge>
                                        <span className="text-muted-foreground">
                                            Connected via Stripe
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Manual billing - No payment method on file
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Activity className="h-4 w-4" />
                                    Billing History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No billing history available yet
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                    {(subscription.status === 'active' || subscription.status === 'trialing' || subscription.status === 'past_due') && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => onPause?.(subscription.id)}
                                className="flex-1"
                            >
                                Pause Subscription
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    onCancel?.(subscription.id);
                                    onClose();
                                }}
                            >
                                Cancel Subscription
                            </Button>
                        </>
                    )}
                    {subscription.status === 'paused' && (
                        <Button
                            onClick={() => onResume?.(subscription.id)}
                            className="flex-1"
                        >
                            Resume Subscription
                        </Button>
                    )}
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
