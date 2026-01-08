import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Link2, Unlink, RefreshCw, CheckCircle, XCircle, FileTextIcon, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import quickbooksApi from '@/services/quickbooksApi';
import { format } from 'date-fns';

const QuickBooksIntegration: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: connection, isLoading } = useQuery({
    queryKey: ['quickbooks-connection'],
    queryFn: quickbooksApi.getConnection,
  });

  const { data: syncStatus } = useQuery({
    queryKey: ['quickbooks-sync-status'],
    queryFn: quickbooksApi.getSyncStatus,
    enabled: connection?.connected,
  });

  const disconnectMutation = useMutation({
    mutationFn: quickbooksApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quickbooks-connection'] });
      toast.success('QuickBooks disconnected');
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: quickbooksApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quickbooks-connection'] });
      toast.success('Settings updated');
    },
  });

  const syncAllMutation = useMutation({
    mutationFn: quickbooksApi.syncAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quickbooks-sync-status'] });
      toast.success('Sync initiated');
    },
  });

  const handleConnect = () => {
    // In production, this would redirect to QuickBooks OAuth
    toast.info('QuickBooks OAuth flow would start here');
  };

  const toggleSetting = (setting: string, value: boolean) => {
    updateSettingsMutation.mutate({ [setting]: value });
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">QuickBooks Integration</h1>
          <p className="text-muted-foreground">Sync invoices and payments with QuickBooks</p>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>Manage your QuickBooks connection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connection?.connected ? (
            <>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium">Connected to QuickBooks</p>
                    <p className="text-sm text-muted-foreground">
                      {connection.company_name || 'QuickBooks Company'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
              {connection.last_sync_at && (
                <p className="text-sm text-muted-foreground">
                  Last synced: {format(new Date(connection.last_sync_at), 'MMM d, yyyy HH:mm')}
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="font-medium">Not Connected</p>
                  <p className="text-sm text-muted-foreground">
                    Connect your QuickBooks account to sync data
                  </p>
                </div>
              </div>
              <Button onClick={handleConnect}>
                <Link2 className="h-4 w-4 mr-2" />
                Connect QuickBooks
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {connection?.connected && (
        <>
          {/* Sync Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Sync Settings</CardTitle>
              <CardDescription>Configure what data to sync automatically</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Master switch for all syncing
                  </p>
                </div>
                <Switch
                  checked={connection.sync_enabled}
                  onCheckedChange={(checked) => toggleSetting('sync_enabled', checked)}
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
                  checked={connection.auto_sync_invoices}
                  onCheckedChange={(checked) => toggleSetting('auto_sync_invoices', checked)}
                  disabled={!connection.sync_enabled}
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
                  checked={connection.auto_sync_payments}
                  onCheckedChange={(checked) => toggleSetting('auto_sync_payments', checked)}
                  disabled={!connection.sync_enabled}
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
                  checked={connection.auto_sync_customers}
                  onCheckedChange={(checked) => toggleSetting('auto_sync_customers', checked)}
                  disabled={!connection.sync_enabled}
                />
              </div>
              <div className="pt-4 border-t">
                <Button
                  onClick={() => syncAllMutation.mutate()}
                  disabled={syncAllMutation.isPending || !connection.sync_enabled}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync All Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sync Status */}
          <Card>
            <CardHeader>
              <CardTitle>Sync Status</CardTitle>
              <CardDescription>View sync statistics and recent activity</CardDescription>
            </CardHeader>
            <CardContent>
              {syncStatus?.stats && syncStatus.stats.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {syncStatus.stats.map((stat) => (
                      <div key={`${stat.entity_type}-${stat.sync_status}`} className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground capitalize">{stat.entity_type}</p>
                        <p className="text-2xl font-bold">{stat.count}</p>
                        <Badge variant={stat.sync_status === 'synced' ? 'default' : 'secondary'}>
                          {stat.sync_status}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {syncStatus.recent_syncs && syncStatus.recent_syncs.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Recent Syncs</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Local ID</TableHead>
                            <TableHead>QuickBooks ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Synced</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {syncStatus.recent_syncs.map((sync) => (
                            <TableRow key={sync.id}>
                              <TableCell className="capitalize">{sync.entity_type}</TableCell>
                              <TableCell>{sync.local_id}</TableCell>
                              <TableCell className="font-mono text-xs">{sync.quickbooks_id}</TableCell>
                              <TableCell>
                                <Badge variant={sync.sync_status === 'synced' ? 'default' : 'secondary'}>
                                  {sync.sync_status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs">
                                {format(new Date(sync.last_synced_at), 'MMM d, HH:mm')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No sync activity yet
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default QuickBooksIntegration;

