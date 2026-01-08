import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Webhook, Plus, Play, RefreshCw, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import webhooksApi, { WebhookEndpoint, WebhookDelivery } from '@/services/webhooksApi';
import { format } from 'date-fns';

const Webhooks: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<WebhookEndpoint | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    is_active: true,
    retry_failed: true,
    max_retries: 3,
  });

  const { data: endpoints = [], isLoading } = useQuery({
    queryKey: ['webhook-endpoints'],
    queryFn: webhooksApi.listEndpoints,
  });

  const { data: eventCatalog } = useQuery({
    queryKey: ['webhook-events'],
    queryFn: webhooksApi.getEventCatalog,
  });

  const { data: deliveries = [] } = useQuery({
    queryKey: ['webhook-deliveries'],
    queryFn: () => webhooksApi.listDeliveries(undefined, { limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: webhooksApi.createEndpoint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-endpoints'] });
      setIsCreateOpen(false);
      resetForm();
      toast.success('Webhook created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: webhooksApi.deleteEndpoint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-endpoints'] });
      toast.success('Webhook deleted');
    },
  });

  const testMutation = useMutation({
    mutationFn: webhooksApi.testEndpoint,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['webhook-deliveries'] });
      if (data.success) {
        toast.success('Test webhook sent successfully');
      } else {
        toast.error('Test webhook failed');
      }
    },
  });

  const retryMutation = useMutation({
    mutationFn: webhooksApi.retryDelivery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-deliveries'] });
      toast.success('Delivery retried');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      events: [],
      is_active: true,
      retry_failed: true,
      max_retries: 3,
    });
  };

  const handleCreate = () => {
    if (!formData.name || !formData.url || formData.events.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }
    createMutation.mutate(formData);
  };

  const toggleEvent = (eventName: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(eventName)
        ? prev.events.filter((e) => e !== eventName)
        : [...prev.events, eventName],
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">Manage webhook endpoints and event subscriptions</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Webhook
        </Button>
      </div>

      <Tabs defaultValue="endpoints">
        <TabsList>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="deliveries">Delivery Log</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="mt-4">
          {isLoading ? (
            <div className="text-center py-12">Loading...</div>
          ) : endpoints.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Webhook className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No webhooks yet</h3>
                <p className="text-muted-foreground mb-4">Create your first webhook endpoint</p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Webhook
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {endpoints.map((endpoint) => (
                <Card key={endpoint.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{endpoint.name}</CardTitle>
                        <CardDescription className="text-xs mt-1 font-mono">
                          {endpoint.url}
                        </CardDescription>
                      </div>
                      <Badge variant={endpoint.is_active ? 'default' : 'secondary'}>
                        {endpoint.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Subscribed Events:</p>
                      <div className="flex flex-wrap gap-1">
                        {endpoint.events.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testMutation.mutate(endpoint.id)}
                        disabled={testMutation.isPending}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(endpoint.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="deliveries" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>HTTP Status</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No deliveries yet
                    </TableCell>
                  </TableRow>
                ) : (
                  deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-mono text-xs">{delivery.event_type}</TableCell>
                      <TableCell className="text-xs">{delivery.endpoint_name}</TableCell>
                      <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                      <TableCell>{delivery.http_status || '-'}</TableCell>
                      <TableCell>{delivery.attempt_count}</TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(delivery.created_at), 'MMM d, HH:mm')}
                      </TableCell>
                      <TableCell>
                        {delivery.status === 'failed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => retryMutation.mutate(delivery.id)}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Webhook</DialogTitle>
            <DialogDescription>Subscribe to events and receive HTTP callbacks</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Zapier Integration"
              />
            </div>
            <div className="space-y-2">
              <Label>Webhook URL *</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://hooks.zapier.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Events to Subscribe *</Label>
              <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                {eventCatalog?.events.map((event) => (
                  <div key={event.name} className="flex items-start space-x-2">
                    <Checkbox
                      checked={formData.events.includes(event.name)}
                      onCheckedChange={() => toggleEvent(event.name)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.name}</p>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Retry Failed</Label>
                <Switch
                  checked={formData.retry_failed}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, retry_failed: checked })
                  }
                />
              </div>
            </div>
            {formData.retry_failed && (
              <div className="space-y-2">
                <Label>Max Retries</Label>
                <Input
                  type="number"
                  value={formData.max_retries}
                  onChange={(e) =>
                    setFormData({ ...formData, max_retries: parseInt(e.target.value) || 3 })
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              Create Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Webhooks;
