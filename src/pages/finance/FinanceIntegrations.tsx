import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SEO from '@/components/SEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
    Link2,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
    Settings,
    DollarSign,
    FileTextIcon,
    TrendingUp,
    Zap,
    RefreshCw,
    Unlink,
    Loader2,
} from 'lucide-react';

// Import API services
import integrationsApi, { Integration as IntegrationData } from '@/services/integrationsApi';
import quickbooksApi, { QuickBooksConnection } from '@/services/quickbooksApi';
import stripeApi, { StripeAccount } from '@/services/stripeApi';
import paypalApi, { PayPalStatus } from '@/services/paypalApi';

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    status: 'connected' | 'available' | 'coming_soon';
    path?: string;
    category: 'accounting' | 'payment' | 'analytics' | 'automation';
    provider?: string;
    requiresOAuth?: boolean;
    requiresApiKey?: boolean;
}

const FinanceIntegrations: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // State for modals
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showConnectModal, setShowConnectModal] = useState(false);

    // QuickBooks state
    const [qbSettings, setQbSettings] = useState({
        sync_enabled: true,
        auto_sync_invoices: true,
        auto_sync_payments: true,
        auto_sync_customers: true,
    });

    // Stripe state
    const [stripeSettings, setStripeSettings] = useState({
        enabled: true,
        test_mode: false,
        publishable_key: '',
        secret_key: '',
    });

    // PayPal state
    const [paypalSettings, setPaypalSettings] = useState({
        client_id: '',
        client_secret: '',
        mode: 'sandbox' as 'sandbox' | 'live',
    });

    // Fetch all integrations status
    const { data: integrationsList, isLoading: integrationsLoading } = useQuery({
        queryKey: ['integrations-list'],
        queryFn: () => integrationsApi.list(),
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    // Fetch QuickBooks connection
    const { data: qbConnection, isLoading: qbLoading } = useQuery({
        queryKey: ['quickbooks-connection'],
        queryFn: () => quickbooksApi.getConnection(),
        retry: false,
    });

    // Fetch Stripe account
    const { data: stripeAccount, isLoading: stripeLoading } = useQuery({
        queryKey: ['stripe-account'],
        queryFn: () => stripeApi.getConnectAccount(),
        retry: false,
    });

    // Fetch PayPal status
    const { data: paypalStatus, isLoading: paypalLoading } = useQuery({
        queryKey: ['paypal-status'],
        queryFn: () => paypalApi.getStatus(),
        retry: false,
    });

    // Mutations
    const disconnectMutation = useMutation({
        mutationFn: async (provider: string) => {
            return await integrationsApi.disconnect(provider);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['integrations-list'] });
            queryClient.invalidateQueries({ queryKey: ['quickbooks-connection'] });
            queryClient.invalidateQueries({ queryKey: ['stripe-account'] });
            queryClient.invalidateQueries({ queryKey: ['paypal-status'] });
            toast.success('Integration disconnected successfully');
            setShowSettingsModal(false);
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to disconnect integration');
        },
    });

    const testConnectionMutation = useMutation({
        mutationFn: async (provider: string) => {
            return await integrationsApi.test(provider);
        },
        onSuccess: (data) => {
            if (data.success) {
                toast.success('Connection test successful!');
            } else {
                toast.error(data.error || 'Connection test failed');
            }
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Connection test failed');
        },
    });

    const syncMutation = useMutation({
        mutationFn: async (provider: string) => {
            return await integrationsApi.sync(provider);
        },
        onSuccess: () => {
            toast.success('Sync started successfully');
            queryClient.invalidateQueries({ queryKey: ['integrations-list'] });
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to start sync');
        },
    });

    const updateQbSettingsMutation = useMutation({
        mutationFn: async (settings: any) => {
            return await quickbooksApi.updateSettings(settings);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quickbooks-connection'] });
            toast.success('QuickBooks settings updated');
        },
    });

    const connectStripeMutation = useMutation({
        mutationFn: async () => {
            return await stripeApi.createConnectAccount('express');
        },
        onSuccess: async (account) => {
            // Get onboarding URL
            const onboarding = await stripeApi.getOnboardingUrl(
                `${window.location.origin}/finance/integrations?stripe=success`,
                `${window.location.origin}/finance/integrations?stripe=refresh`
            );
            window.location.href = onboarding.url;
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to connect Stripe');
        },
    });

    const connectPayPalMutation = useMutation({
        mutationFn: async (data: { client_id: string; client_secret: string; mode: 'sandbox' | 'live' }) => {
            return await paypalApi.connect(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['paypal-status'] });
            toast.success('PayPal connected successfully');
            setShowConnectModal(false);
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to connect PayPal');
        },
    });

    // Helper function to get integration status
    const getIntegrationStatus = (integrationId: string): 'connected' | 'available' | 'coming_soon' => {
        if (integrationId === 'quickbooks') {
            return qbConnection?.connected ? 'connected' : 'available';
        }
        if (integrationId === 'stripe') {
            return stripeAccount?.charges_enabled ? 'connected' : 'available';
        }
        if (integrationId === 'paypal') {
            return paypalStatus?.status === 'connected' ? 'connected' : 'available';
        }

        // Check from integrations list
        const integration = integrationsList?.find(i => i.provider === integrationId);
        if (integration?.status === 'connected') {
            return 'connected';
        }

        // Default statuses
        if (['freshbooks', 'xero', 'square', 'zapier'].includes(integrationId)) {
            return 'coming_soon';
        }

        return 'available';
    };

    const integrations: Integration[] = [
        {
            id: 'quickbooks',
            name: 'QuickBooks',
            description: 'Sync invoices, expenses, and financial data with QuickBooks Online',
            icon: <FileTextIcon className="h-8 w-8 text-green-600" />,
            status: getIntegrationStatus('quickbooks'),
            category: 'accounting',
            provider: 'quickbooks',
            requiresOAuth: true,
        },
        {
            id: 'freshbooks',
            name: 'FreshBooks',
            description: 'Connect with FreshBooks for seamless accounting and invoicing',
            icon: <FileTextIcon className="h-8 w-8 text-blue-600" />,
            status: 'coming_soon',
            category: 'accounting',
        },
        {
            id: 'xero',
            name: 'Xero',
            description: 'Integrate with Xero for comprehensive financial management',
            icon: <FileTextIcon className="h-8 w-8 text-cyan-600" />,
            status: 'coming_soon',
            category: 'accounting',
        },
        {
            id: 'stripe',
            name: 'Stripe',
            description: 'Process payments and manage subscriptions with Stripe',
            icon: <DollarSign className="h-8 w-8 text-purple-600" />,
            status: getIntegrationStatus('stripe'),
            category: 'payment',
            provider: 'stripe',
            requiresOAuth: true,
        },
        {
            id: 'paypal',
            name: 'PayPal',
            description: 'Accept payments through PayPal Business',
            icon: <DollarSign className="h-8 w-8 text-blue-700" />,
            status: getIntegrationStatus('paypal'),
            category: 'payment',
            provider: 'paypal',
            requiresApiKey: true,
        },
        {
            id: 'square',
            name: 'Square',
            description: 'Integrate Square for in-person and online payments',
            icon: <DollarSign className="h-8 w-8 text-gray-800" />,
            status: 'coming_soon',
            category: 'payment',
        },
        {
            id: 'analytics',
            name: 'Financial Analytics',
            description: 'Advanced financial reporting and analytics dashboard',
            icon: <TrendingUp className="h-8 w-8 text-orange-600" />,
            status: 'available',
            path: '/finance/overview',
            category: 'analytics',
        },
        {
            id: 'zapier',
            name: 'Zapier',
            description: 'Automate workflows with 5,000+ apps via Zapier',
            icon: <Zap className="h-8 w-8 text-orange-500" />,
            status: 'coming_soon',
            category: 'automation',
        },
    ];

    const getStatusBadge = (status: Integration['status']) => {
        switch (status) {
            case 'connected':
                return (
                    <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Connected
                    </Badge>
                );
            case 'available':
                return (
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                        Available
                    </Badge>
                );
            case 'coming_soon':
                return (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                        Coming Soon
                    </Badge>
                );
        }
    };

    const getCategoryTitle = (category: Integration['category']) => {
        switch (category) {
            case 'accounting':
                return 'Accounting Software';
            case 'payment':
                return 'Payment Processors';
            case 'analytics':
                return 'Analytics & Reporting';
            case 'automation':
                return 'Automation & Workflows';
        }
    };

    const groupedIntegrations = integrations.reduce((acc, integration) => {
        if (!acc[integration.category]) {
            acc[integration.category] = [];
        }
        acc[integration.category].push(integration);
        return acc;
    }, {} as Record<Integration['category'], Integration[]>);

    const handleConnect = async (integration: Integration) => {
        if (integration.status === 'coming_soon') {
            toast.info('This integration is coming soon!');
            return;
        }

        if (integration.path) {
            navigate(integration.path);
            return;
        }

        if (integration.id === 'quickbooks') {
            // Start QuickBooks OAuth
            toast.info('Starting QuickBooks OAuth flow...');
            // In production, redirect to QuickBooks OAuth
            window.location.href = '/api/quickbooks/oauth/authorize';
        } else if (integration.id === 'stripe') {
            connectStripeMutation.mutate();
        } else if (integration.id === 'paypal') {
            setSelectedIntegration(integration);
            setShowConnectModal(true);
        }
    };

    const handleManage = (integration: Integration) => {
        setSelectedIntegration(integration);
        setShowSettingsModal(true);
    };

    const handleDisconnect = () => {
        if (!selectedIntegration?.provider) return;
        disconnectMutation.mutate(selectedIntegration.provider);
    };

    const handleTestConnection = () => {
        if (!selectedIntegration?.provider) return;
        testConnectionMutation.mutate(selectedIntegration.provider);
    };

    const handleSync = () => {
        if (!selectedIntegration?.provider) return;
        syncMutation.mutate(selectedIntegration.provider);
    };

    const renderSettingsModal = () => {
        if (!selectedIntegration) return null;

        return (
            <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            {selectedIntegration.icon}
                            {selectedIntegration.name} Settings
                        </DialogTitle>
                        <DialogDescription>
                            Manage your {selectedIntegration.name} integration settings
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* QuickBooks Settings */}
                        {selectedIntegration.id === 'quickbooks' && qbConnection?.connected && (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        <div>
                                            <p className="font-medium text-green-900">Connected</p>
                                            <p className="text-sm text-green-700">
                                                {qbConnection.company_name || 'QuickBooks Company'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Enable Sync</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Master switch for all syncing
                                            </p>
                                        </div>
                                        <Switch
                                            checked={qbConnection.sync_enabled}
                                            onCheckedChange={(checked) => {
                                                updateQbSettingsMutation.mutate({ sync_enabled: checked });
                                            }}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Auto-sync Invoices</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Automatically export new invoices
                                            </p>
                                        </div>
                                        <Switch
                                            checked={qbConnection.auto_sync_invoices}
                                            onCheckedChange={(checked) => {
                                                updateQbSettingsMutation.mutate({ auto_sync_invoices: checked });
                                            }}
                                            disabled={!qbConnection.sync_enabled}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Auto-sync Payments</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Automatically export payment transactions
                                            </p>
                                        </div>
                                        <Switch
                                            checked={qbConnection.auto_sync_payments}
                                            onCheckedChange={(checked) => {
                                                updateQbSettingsMutation.mutate({ auto_sync_payments: checked });
                                            }}
                                            disabled={!qbConnection.sync_enabled}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Auto-sync Customers</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Automatically export new contacts
                                            </p>
                                        </div>
                                        <Switch
                                            checked={qbConnection.auto_sync_customers}
                                            onCheckedChange={(checked) => {
                                                updateQbSettingsMutation.mutate({ auto_sync_customers: checked });
                                            }}
                                            disabled={!qbConnection.sync_enabled}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Stripe Settings */}
                        {selectedIntegration.id === 'stripe' && stripeAccount && (
                            <div className="space-y-4">
                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-purple-600" />
                                        <div>
                                            <p className="font-medium text-purple-900">Connected</p>
                                            <p className="text-sm text-purple-700">
                                                {stripeAccount.business_profile?.name || 'Stripe Account'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 border rounded-lg">
                                        <p className="text-sm text-muted-foreground">Charges</p>
                                        <p className="font-medium">
                                            {stripeAccount.charges_enabled ? 'Enabled' : 'Disabled'}
                                        </p>
                                    </div>
                                    <div className="p-3 border rounded-lg">
                                        <p className="text-sm text-muted-foreground">Payouts</p>
                                        <p className="font-medium">
                                            {stripeAccount.payouts_enabled ? 'Enabled' : 'Disabled'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PayPal Settings */}
                        {selectedIntegration.id === 'paypal' && paypalStatus?.status === 'connected' && (
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <p className="font-medium text-blue-900">Connected</p>
                                            <p className="text-sm text-blue-700">
                                                Mode: {paypalStatus.mode || 'sandbox'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={handleTestConnection}
                            disabled={testConnectionMutation.isPending}
                        >
                            {testConnectionMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Testing...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Test Connection
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleSync}
                            disabled={syncMutation.isPending}
                        >
                            {syncMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Syncing...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Sync Now
                                </>
                            )}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDisconnect}
                            disabled={disconnectMutation.isPending}
                        >
                            {disconnectMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Disconnecting...
                                </>
                            ) : (
                                <>
                                    <Unlink className="h-4 w-4 mr-2" />
                                    Disconnect
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    const renderConnectModal = () => {
        if (!selectedIntegration) return null;

        return (
            <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            {selectedIntegration.icon}
                            Connect {selectedIntegration.name}
                        </DialogTitle>
                        <DialogDescription>
                            Enter your {selectedIntegration.name} credentials to connect
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {selectedIntegration.id === 'paypal' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="paypal-client-id">Client ID</Label>
                                    <Input
                                        id="paypal-client-id"
                                        value={paypalSettings.client_id}
                                        onChange={(e) => setPaypalSettings({ ...paypalSettings, client_id: e.target.value })}
                                        placeholder="Enter PayPal Client ID"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="paypal-client-secret">Client Secret</Label>
                                    <Input
                                        id="paypal-client-secret"
                                        type="password"
                                        value={paypalSettings.client_secret}
                                        onChange={(e) => setPaypalSettings({ ...paypalSettings, client_secret: e.target.value })}
                                        placeholder="Enter PayPal Client Secret"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mode</Label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                checked={paypalSettings.mode === 'sandbox'}
                                                onChange={() => setPaypalSettings({ ...paypalSettings, mode: 'sandbox' })}
                                            />
                                            Sandbox
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                checked={paypalSettings.mode === 'live'}
                                                onChange={() => setPaypalSettings({ ...paypalSettings, mode: 'live' })}
                                            />
                                            Live
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConnectModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (selectedIntegration.id === 'paypal') {
                                    connectPayPalMutation.mutate(paypalSettings);
                                }
                            }}
                            disabled={connectPayPalMutation.isPending}
                        >
                            {connectPayPalMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                'Connect'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    return (
        <>
            <SEO
                title="Finance Integrations"
                description="Connect your finance module with popular accounting software, payment processors, and analytics tools"
                noindex
            />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Finance Integrations
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Connect your finance module with third-party tools and services
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/finance/settings')}
                        className="gap-2"
                    >
                        <Settings className="h-4 w-4" />
                        Finance Settings
                    </Button>
                </div>

                {/* Integration Categories */}
                {Object.entries(groupedIntegrations).map(([category, items]) => (
                    <div key={category} className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {getCategoryTitle(category as Integration['category'])}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map((integration) => (
                                <Card
                                    key={integration.id}
                                    className="hover:shadow-lg transition-shadow"
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    {integration.icon}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                                                </div>
                                            </div>
                                            {getStatusBadge(integration.status)}
                                        </div>
                                        <CardDescription className="mt-2">
                                            {integration.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {integration.status === 'connected' && (
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="w-full gap-2"
                                                onClick={() => handleManage(integration)}
                                            >
                                                <Settings className="h-4 w-4" />
                                                Manage
                                            </Button>
                                        )}
                                        {integration.status === 'available' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full gap-2"
                                                onClick={() => handleConnect(integration)}
                                            >
                                                <Link2 className="h-4 w-4" />
                                                Connect
                                            </Button>
                                        )}
                                        {integration.status === 'coming_soon' && (
                                            <Button variant="ghost" size="sm" className="w-full" disabled>
                                                Coming Soon
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Help Section */}
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                            <AlertCircle className="h-5 w-5" />
                            Need Help?
                        </CardTitle>
                        <CardDescription className="text-blue-700 dark:text-blue-300">
                            Connect your accounting software and payment processors to streamline your financial
                            operations. Each integration syncs data automatically to keep your records up to date.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>

            {/* Modals */}
            {renderSettingsModal()}
            {renderConnectModal()}
        </>
    );
};

export default FinanceIntegrations;
