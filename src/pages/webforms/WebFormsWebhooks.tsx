import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { webformsApi, WebFormsWebhook, WebForm } from '@/services/webformsApi';
import {
  Webhook,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Play,
  Pause,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  TestTube,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function WebFormsWebhooks() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebFormsWebhook | null>(null);

  // Form state for create/edit
  const [webhookName, setWebhookName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookMethod, setWebhookMethod] = useState<'POST' | 'GET' | 'PUT'>('POST');
  const [webhookFormId, setWebhookFormId] = useState<string>('');
  const [webhookHeaders, setWebhookHeaders] = useState('');

  // Fetch webhooks
  const { data: webhooksData, isLoading } = useQuery({
    queryKey: ['webforms', 'webhooks'],
    queryFn: () => webformsApi.getWebhooks(),
  });

  // Fetch forms for dropdown
  const { data: formsData } = useQuery({
    queryKey: ['webforms', 'forms'],
    queryFn: () => webformsApi.getForms(),
  });

  // Create webhook mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<WebFormsWebhook>) => webformsApi.createWebhook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webforms', 'webhooks'] });
      toast.success('Webhook created successfully');
      resetForm();
      setCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create webhook');
    },
  });

  // Update webhook mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<WebFormsWebhook> }) =>
      webformsApi.updateWebhook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webforms', 'webhooks'] });
      toast.success('Webhook updated');
      resetForm();
      setEditingWebhook(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update webhook');
    },
  });

  // Delete webhook mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => webformsApi.deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webforms', 'webhooks'] });
      toast.success('Webhook deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete webhook');
    },
  });

  // Test webhook mutation
  const testMutation = useMutation({
    mutationFn: (id: number) => webformsApi.testWebhook(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Webhook test successful');
      } else {
        toast.error('Webhook test failed');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to test webhook');
    },
  });

  const resetForm = () => {
    setWebhookName('');
    setWebhookUrl('');
    setWebhookMethod('POST');
    setWebhookFormId('');
    setWebhookHeaders('');
  };

  const openEditDialog = (webhook: WebFormsWebhook) => {
    setEditingWebhook(webhook);
    setWebhookName(webhook.name);
    setWebhookUrl(webhook.url);
    setWebhookMethod(webhook.method);
    setWebhookFormId(String(webhook.form_id));
    setWebhookHeaders(webhook.headers ? JSON.stringify(webhook.headers, null, 2) : '');
  };

  const handleSave = () => {
    if (!webhookName.trim() || !webhookUrl.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    let headers: Record<string, string> | undefined;
    if (webhookHeaders.trim()) {
      try {
        headers = JSON.parse(webhookHeaders);
      } catch {
        toast.error('Invalid JSON in headers field');
        return;
      }
    }

    const data: Partial<WebFormsWebhook> = {
      name: webhookName,
      url: webhookUrl,
      method: webhookMethod,
      form_id: webhookFormId ? parseInt(webhookFormId) : undefined,
      headers,
      enabled: true,
      events: ['submission.created'],
    };

    if (editingWebhook) {
      updateMutation.mutate({ id: editingWebhook.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleWebhook = (webhook: WebFormsWebhook) => {
    updateMutation.mutate({
      id: webhook.id,
      data: { enabled: !webhook.enabled },
    });
  };

  const webhooks = webhooksData?.data || [];
  const forms = formsData?.data || [];
  const filteredWebhooks = webhooks.filter(
    (webhook) =>
      webhook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      webhook.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (webhook: WebFormsWebhook) => {
    if (!webhook.enabled) {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          <Pause className="h-3 w-3 mr-1" />
          Disabled
        </Badge>
      );
    }
    if (webhook.last_status === 'success') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    if (webhook.last_status === 'failed') {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Webhooks</h1>
          <p className="text-muted-foreground">
            Send form submission data to external services
          </p>
        </div>
        <Dialog open={createDialogOpen || !!editingWebhook} onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditingWebhook(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingWebhook ? 'Edit Webhook' : 'Create Webhook'}</DialogTitle>
              <DialogDescription>
                Configure a webhook to receive form submission data.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="My Webhook"
                  value={webhookName}
                  onChange={(e) => setWebhookName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Endpoint URL *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://api.example.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="method">HTTP Method</Label>
                  <Select value={webhookMethod} onValueChange={(v: 'POST' | 'GET' | 'PUT') => setWebhookMethod(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form">Form (optional)</Label>
                  <Select value={webhookFormId} onValueChange={setWebhookFormId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All forms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All forms</SelectItem>
                      {forms.map((form) => (
                        <SelectItem key={form.id} value={String(form.id)}>
                          {form.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headers">Custom Headers (JSON)</Label>
                <Textarea
                  id="headers"
                  placeholder='{"Authorization": "Bearer token"}'
                  value={webhookHeaders}
                  onChange={(e) => setWebhookHeaders(e.target.value)}
                  rows={3}
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setCreateDialogOpen(false);
                setEditingWebhook(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingWebhook
                  ? 'Update'
                  : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search webhooks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Webhooks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Webhook className="h-5 w-5 mr-2" />
            Webhooks ({filteredWebhooks.length})
          </CardTitle>
          <CardDescription>
            Webhooks are triggered when forms receive submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredWebhooks.length > 0 ? (
            <div className="space-y-3">
              {filteredWebhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Webhook className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{webhook.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {webhook.method}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {webhook.url}
                      </p>
                      {webhook.last_triggered && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last triggered: {new Date(webhook.last_triggered).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(webhook)}
                    <Switch
                      checked={webhook.enabled}
                      onCheckedChange={() => toggleWebhook(webhook)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(webhook)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => testMutation.mutate(webhook.id)}
                          disabled={testMutation.isPending}
                        >
                          <TestTube className="h-4 w-4 mr-2" />
                          Test Webhook
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm(`Delete webhook "${webhook.name}"?`)) {
                              deleteMutation.mutate(webhook.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Webhook className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No webhooks configured</h3>
              <p className="text-muted-foreground mt-2">
                {searchTerm
                  ? 'Try a different search term'
                  : 'Create a webhook to send form data to external services'}
              </p>
              {!searchTerm && (
                <Button className="mt-6" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Webhook
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
