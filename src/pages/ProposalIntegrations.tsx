import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Settings,
  Zap,
  Database,
  Mail,
  CreditCard,
  Globe,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  Copy,
} from 'lucide-react';
import { proposalApi, type Integration, type IntegrationStatus } from '@/lib/api';

interface IntegrationWithStatus extends Integration {
  status: IntegrationStatus;
  last_sync?: string;
  error_message?: string;
}

const ProposalIntegrations: React.FC = () => {
  // Main integrations component
  const [integrations, setIntegrations] = useState<IntegrationWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationWithStatus | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await proposalApi.getIntegrations();
      setIntegrations(response.items || []);
    } catch (error) {
      console.error('Failed to load integrations:', error);
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleIntegration = async (integrationId: string, enabled: boolean) => {
    try {
      await proposalApi.updateIntegration(integrationId, { enabled });
      toast.success(`Integration ${enabled ? 'enabled' : 'disabled'} successfully`);
      loadIntegrations();
    } catch (error) {
      console.error('Failed to update integration:', error);
      toast.error('Failed to update integration');
    }
  };

  const handleTestConnection = async (integrationId: string) => {
    try {
      await proposalApi.testIntegration(integrationId);
      toast.success('Connection test successful');
      loadIntegrations();
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error('Connection test failed');
    }
  };

  const handleSyncData = async (integrationId: string) => {
    try {
      await proposalApi.syncIntegrationData(integrationId);
      toast.success('Data sync initiated');
      loadIntegrations();
    } catch (error) {
      console.error('Failed to sync data:', error);
      toast.error('Failed to sync data');
    }
  };

  const handleCreateIntegration = async () => {
    try {
      await proposalApi.createIntegration(editingConfig);
      toast.success('Integration created successfully');
      setIsCreating(false);
      setEditingConfig({});
      loadIntegrations();
    } catch (error) {
      console.error('Failed to create integration:', error);
      toast.error('Failed to create integration');
    }
  };

  const handleUpdateIntegration = async () => {
    if (!selectedIntegration) return;
    try {
      await proposalApi.updateIntegration(selectedIntegration.id, editingConfig);
      toast.success('Integration updated successfully');
      setIsEditing(false);
      setSelectedIntegration(null);
      setEditingConfig({});
      loadIntegrations();
    } catch (error) {
      console.error('Failed to update integration:', error);
      toast.error('Failed to update integration');
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    try {
      await proposalApi.deleteIntegration(integrationId);
      toast.success('Integration deleted successfully');
      loadIntegrations();
    } catch (error) {
      console.error('Failed to delete integration:', error);
      toast.error('Failed to delete integration');
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'crm': return <Database className="h-5 w-5" />;
      case 'email': return <Mail className="h-5 w-5" />;
      case 'payment': return <CreditCard className="h-5 w-5" />;
      case 'accounting': return <Database className="h-5 w-5" />;
      default: return <Globe className="h-5 w-5" />;
    }
  };

  const getIntegrationColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-red-100 text-red-800';
      case 'syncing': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIntegrationStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'disconnected': return <XCircle className="h-4 w-4" />;
      case 'syncing': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proposal Integrations</h1>
          <p className="text-muted-foreground">Connect your proposal system with external services</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Integration</DialogTitle>
                <DialogDescription>
                  Configure connection to external service
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <Label>Integration Type</Label>
                  <Select
                    value={editingConfig.type || ''}
                    onValueChange={(value) => setEditingConfig({ ...editingConfig, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select integration type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crm">CRM System</SelectItem>
                      <SelectItem value="email">Email Service</SelectItem>
                      <SelectItem value="payment">Payment Processor</SelectItem>
                      <SelectItem value="accounting">Accounting Software</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Service Name</Label>
                  <Input
                    value={editingConfig.service_name || ''}
                    onChange={(e) => setEditingConfig({ ...editingConfig, service_name: e.target.value })}
                    placeholder="e.g., Salesforce, HubSpot, Stripe"
                  />
                </div>

                <div>
                  <Label>API Key / Token</Label>
                  <Input
                    type="password"
                    value={editingConfig.api_key || ''}
                    onChange={(e) => setEditingConfig({ ...editingConfig, api_key: e.target.value })}
                    placeholder="Enter API key or token"
                  />
                </div>

                <div>
                  <Label>API Endpoint</Label>
                  <Input
                    value={editingConfig.api_endpoint || ''}
                    onChange={(e) => setEditingConfig({ ...editingConfig, api_endpoint: e.target.value })}
                    placeholder="https://api.example.com"
                  />
                </div>

                <div>
                  <Label>Configuration</Label>
                  <Textarea
                    value={editingConfig.config || ''}
                    onChange={(e) => setEditingConfig({ ...editingConfig, config: e.target.value })}
                    placeholder='{"sync_proposals": true, "sync_clients": false}'
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingConfig.enabled || false}
                    onCheckedChange={(checked) => setEditingConfig({ ...editingConfig, enabled: checked })}
                  />
                  <Label>Enable Integration</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                <Button onClick={handleCreateIntegration}>Create Integration</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Integration Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Total Integrations</div>
                <div className="text-2xl font-bold">{integrations.length}</div>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Connected</div>
                <div className="text-2xl font-bold text-green-600">
                  {integrations.filter(i => i.status === 'connected').length}
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Sync Errors</div>
                <div className="text-2xl font-bold text-orange-600">
                  {integrations.filter(i => i.status === 'error').length}
                </div>
              </div>
              <XCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Last Sync</div>
                <div className="text-2xl font-bold">
                  {integrations.length > 0
                    ? new Date(Math.max(...integrations.map(i => new Date(i.last_sync).getTime()))).toLocaleDateString()
                    : 'Never'
                  }
                </div>
              </div>
              <RefreshCw className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Integrations</CardTitle>
          <CardDescription>
            Manage connections to external services and sync settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrations.map((integration) => (
                  <TableRow key={integration.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getIntegrationIcon(integration.type)}
                        </div>
                        <div>
                          <div className="font-semibold">{integration.service_name}</div>
                          <div className="text-sm text-muted-foreground">{integration.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {integration.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={getIntegrationColor(integration.status)}>
                          <span className="flex items-center gap-1">
                            {getIntegrationStatusIcon(integration.status)}
                            {integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
                          </span>
                        </Badge>
                        {integration.error_message && (
                          <span className="text-xs text-red-600" title={integration.error_message}>
                            Error details available
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {integration.last_sync
                          ? new Date(integration.last_sync).toLocaleString()
                          : 'Never'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={integration.enabled}
                          onCheckedChange={(checked) => handleToggleIntegration(integration.id, checked)}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedIntegration(integration);
                                setEditingConfig(integration.config || {});
                                setIsEditing(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Configuration
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTestConnection(integration.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Test Connection
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSyncData(integration.id)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Sync Data
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteIntegration(integration.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Integration
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Integration Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Integration</DialogTitle>
            <DialogDescription>
              Update configuration for {selectedIntegration?.service_name}
            </DialogDescription>
          </DialogHeader>
          {selectedIntegration && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label>Service Name</Label>
                <Input
                  value={editingConfig.service_name || selectedIntegration.service_name}
                  onChange={(e) => setEditingConfig({ ...editingConfig, service_name: e.target.value })}
                />
              </div>

              <div>
                <Label>API Key / Token</Label>
                <Input
                  type="password"
                  value={editingConfig.api_key || ''}
                  onChange={(e) => setEditingConfig({ ...editingConfig, api_key: e.target.value })}
                  placeholder="Enter new API key (leave blank to keep current)"
                />
              </div>

              <div>
                <Label>API Endpoint</Label>
                <Input
                  value={editingConfig.api_endpoint || selectedIntegration.api_endpoint}
                  onChange={(e) => setEditingConfig({ ...editingConfig, api_endpoint: e.target.value })}
                />
              </div>

              <div>
                <Label>Configuration</Label>
                <Textarea
                  value={JSON.stringify(editingConfig.config || selectedIntegration.config, null, 2)}
                  onChange={(e) => setEditingConfig({ ...editingConfig, config: JSON.parse(e.target.value || '{}') })}
                  rows={6}
                  placeholder='{"sync_proposals": true, "sync_clients": false}'
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingConfig.description || selectedIntegration.description}
                  onChange={(e) => setEditingConfig({ ...editingConfig, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingConfig.enabled ?? selectedIntegration.enabled}
                  onCheckedChange={(checked) => setEditingConfig({ ...editingConfig, enabled: checked })}
                />
                <Label>Enable Integration</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleUpdateIntegration}>Update Integration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProposalIntegrations;