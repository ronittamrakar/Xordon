/**
 * Integrations Settings Page
 * Connect and manage third-party integrations
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Mail,
  Phone,
  Share2,
  Calculator,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Settings,
  RefreshCw,
  Unplug,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { integrationsApi, Integration, IntegrationProvider } from '@/services/integrationsApi';
import { useToast } from '@/hooks/use-toast';

const categoryIcons: Record<string, React.ElementType> = {
  payments: CreditCard,
  productivity: Mail,
  communications: Phone,
  social: Share2,
  accounting: Calculator,
  automation: Zap,
};

const categoryLabels: Record<string, string> = {
  payments: 'Payments',
  productivity: 'Productivity',
  communications: 'Communications',
  social: 'Social Media',
  accounting: 'Accounting',
  automation: 'Automation',
};

function IntegrationCard({
  provider,
  integration,
  onConnect,
  onDisconnect,
  onTest,
  onSync,
}: {
  provider: IntegrationProvider;
  integration?: Integration;
  onConnect: (provider: IntegrationProvider) => void;
  onDisconnect: (provider: string) => void;
  onTest: (provider: string) => void;
  onSync: (provider: string) => void;
}) {
  const Icon = categoryIcons[provider.category] || Zap;
  const isConnected = integration?.status === 'connected';
  const hasError = integration?.status === 'error' || integration?.status === 'expired';

  return (
    <Card className={cn(hasError && 'border-red-200')}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isConnected ? 'bg-green-100' : hasError ? 'bg-red-100' : 'bg-gray-100'
            )}>
              <Icon className={cn(
                'w-5 h-5',
                isConnected ? 'text-green-600' : hasError ? 'text-red-600' : 'text-gray-600'
              )} />
            </div>
            <div>
              <CardTitle className="text-base">{provider.name}</CardTitle>
              <CardDescription className="text-xs">{provider.description}</CardDescription>
            </div>
          </div>
          {isConnected ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          ) : hasError ? (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <AlertCircle className="w-3 h-3 mr-1" />
              {integration?.status === 'expired' ? 'Expired' : 'Error'}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-500">
              Not connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Connected account info */}
        {isConnected && integration?.provider_account_name && (
          <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
            <span className="text-gray-500">Account:</span>{' '}
            <span className="font-medium">{integration.provider_account_name}</span>
          </div>
        )}

        {/* Error message */}
        {hasError && integration?.error_message && (
          <div className="mb-3 p-2 bg-red-50 rounded text-sm text-red-600">
            {integration.error_message}
          </div>
        )}

        {/* Features */}
        <div className="flex flex-wrap gap-1 mb-4">
          {provider.features.slice(0, 4).map((feature) => (
            <Badge key={feature} variant="secondary" className="text-xs">
              {feature.replace(/_/g, ' ')}
            </Badge>
          ))}
          {provider.features.length > 4 && (
            <Badge variant="secondary" className="text-xs">
              +{provider.features.length - 4} more
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Button variant="outline" size="sm" onClick={() => onTest(provider.id)}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Test
              </Button>
              <Button variant="outline" size="sm" onClick={() => onSync(provider.id)}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Sync
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => onDisconnect(provider.id)}
              >
                <Unplug className="w-4 h-4 mr-1" />
                Disconnect
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => onConnect(provider)}>
              {provider.oauth ? (
                <>
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Connect with {provider.name}
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-1" />
                  Add API Keys
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ApiKeyFormData {
  [key: string]: string;
}

export function IntegrationsSettings() {
  const [connectingProvider, setConnectingProvider] = useState<IntegrationProvider | null>(null);
  const [disconnectingProvider, setDisconnectingProvider] = useState<string | null>(null);
  const [apiKeyForm, setApiKeyForm] = useState<ApiKeyFormData>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: providers, isLoading: loadingProviders } = useQuery({
    queryKey: ['integration-providers'],
    queryFn: () => integrationsApi.getProviders(),
  });

  const { data: integrations, isLoading: loadingIntegrations } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationsApi.list(),
  });

  const connectOAuthMutation = useMutation({
    mutationFn: (provider: string) => integrationsApi.startOAuth(provider),
    onSuccess: (data) => {
      // Redirect to OAuth URL
      window.location.href = data.auth_url;
    },
    onError: (error: Error) => {
      toast({
        title: 'Connection failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const connectKeysMutation = useMutation({
    mutationFn: ({ provider, credentials }: { provider: string; credentials: Record<string, string> }) =>
      integrationsApi.connectWithKeys(provider, credentials),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setConnectingProvider(null);
      setApiKeyForm({});
      toast({
        title: 'Connected successfully',
        description: `${data.account_name || data.provider} is now connected`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Connection failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (provider: string) => integrationsApi.disconnect(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setDisconnectingProvider(null);
      toast({ title: 'Disconnected successfully' });
    },
  });

  const testMutation = useMutation({
    mutationFn: (provider: string) => integrationsApi.test(provider),
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: 'Connection test passed' });
      } else {
        toast({
          title: 'Connection test failed',
          description: data.error,
          variant: 'destructive',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: (provider: string) => integrationsApi.sync(provider),
    onSuccess: (data) => {
      toast({
        title: 'Sync started',
        description: `Job #${data.job_id} is now running`,
      });
    },
  });

  const handleConnect = (provider: IntegrationProvider) => {
    if (provider.oauth) {
      connectOAuthMutation.mutate(provider.id);
    } else {
      setConnectingProvider(provider);
      setApiKeyForm({});
    }
  };

  const handleSubmitApiKeys = () => {
    if (!connectingProvider) return;
    connectKeysMutation.mutate({
      provider: connectingProvider.id,
      credentials: apiKeyForm,
    });
  };

  const getApiKeyFields = (providerId: string): Array<{ key: string; label: string; type?: string }> => {
    switch (providerId) {
      case 'signalwire':
        return [
          { key: 'project_id', label: 'Project ID' },
          { key: 'api_token', label: 'API Token', type: 'password' },
          { key: 'space_url', label: 'Space URL (e.g., yourspace.signalwire.com)' },
        ];
      case 'twilio':
        return [
          { key: 'account_sid', label: 'Account SID' },
          { key: 'auth_token', label: 'Auth Token', type: 'password' },
        ];
      case 'zapier':
        return [{ key: 'api_key', label: 'API Key', type: 'password' }];
      default:
        return [{ key: 'api_key', label: 'API Key', type: 'password' }];
    }
  };

  // Group providers by category
  const providersByCategory = React.useMemo(() => {
    if (!Array.isArray(providers)) return {};
    return providers.reduce((acc, provider) => {
      if (!acc[provider.category]) {
        acc[provider.category] = [];
      }
      acc[provider.category].push(provider);
      return acc;
    }, {} as Record<string, IntegrationProvider[]>);
  }, [providers]);

  // Create integration lookup
  const integrationLookup = React.useMemo(() => {
    if (!Array.isArray(integrations)) return {};
    return integrations.reduce((acc, integration) => {
      acc[integration.provider] = integration;
      return acc;
    }, {} as Record<string, Integration>);
  }, [integrations]);

  const isLoading = loadingProviders || loadingIntegrations;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Integrations</h2>
        <p className="text-sm text-gray-500">
          Connect third-party services to extend your platform's capabilities
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-32 mt-2" />
                <Skeleton className="h-3 w-48 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        Object.entries(providersByCategory).map(([category, categoryProviders]) => (
          <div key={category} className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              {React.createElement(categoryIcons[category] || Zap, { className: 'w-4 h-4' })}
              {categoryLabels[category] || category}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {categoryProviders.map((provider) => (
                <IntegrationCard
                  key={provider.id}
                  provider={provider}
                  integration={integrationLookup[provider.id]}
                  onConnect={handleConnect}
                  onDisconnect={setDisconnectingProvider}
                  onTest={(p) => testMutation.mutate(p)}
                  onSync={(p) => syncMutation.mutate(p)}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {/* API Keys Dialog */}
      <Dialog open={!!connectingProvider && !connectingProvider.oauth} onOpenChange={() => setConnectingProvider(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {connectingProvider?.name}</DialogTitle>
            <DialogDescription>
              Enter your API credentials to connect {connectingProvider?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {connectingProvider &&
              getApiKeyFields(connectingProvider.id).map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    type={field.type || 'text'}
                    value={apiKeyForm[field.key] || ''}
                    onChange={(e) =>
                      setApiKeyForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={field.label}
                  />
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectingProvider(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitApiKeys}
              disabled={connectKeysMutation.isPending}
            >
              {connectKeysMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation */}
      <AlertDialog open={!!disconnectingProvider} onOpenChange={() => setDisconnectingProvider(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Integration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect this integration? This will remove all stored
              credentials and may affect related features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => disconnectingProvider && disconnectMutation.mutate(disconnectingProvider)}
            >
              {disconnectMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                'Disconnect'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default IntegrationsSettings;
