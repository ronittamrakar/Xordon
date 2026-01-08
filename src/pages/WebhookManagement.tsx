import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    Webhook,
    Plus,
    Play,
    Pause,
    Trash2,
    Copy,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    Code,
    Settings,
    Activity,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface WebhookEndpoint {
    id: string;
    name: string;
    url: string;
    secret: string;
    events: string[];
    is_active: boolean;
    retry_failed: boolean;
    max_retries: number;
    custom_headers: Record<string, string>;
    created_at: string;
}

interface WebhookDelivery {
    id: string;
    endpoint_id: string;
    endpoint_name: string;
    event_type: string;
    status: 'success' | 'failed' | 'pending';
    http_status?: number;
    attempt_count: number;
    created_at: string;
    delivered_at?: string;
}

const AVAILABLE_EVENTS = [
    { name: '*', description: 'All events' },
    { name: 'form.submitted', description: 'Form submission received' },
    { name: 'payment.received', description: 'Payment recorded' },
    { name: 'payment.succeeded', description: 'Payment succeeded' },
    { name: 'payment.failed', description: 'Payment failed' },
    { name: 'invoice.created', description: 'Invoice created' },
    { name: 'invoice.sent', description: 'Invoice sent' },
    { name: 'invoice.paid', description: 'Invoice paid' },
    { name: 'contact.created', description: 'Contact created' },
    { name: 'contact.updated', description: 'Contact updated' },
    { name: 'appointment.booked', description: 'Appointment booked' },
    { name: 'opportunity.won', description: 'Opportunity won' }
];

export default function WebhookManagement() {
    const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
    const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
    const [selectedEndpoint, setSelectedEndpoint] = useState<WebhookEndpoint | null>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        url: '',
        events: [] as string[],
        is_active: true,
        retry_failed: true,
        max_retries: 3,
        custom_headers: {} as Record<string, string>
    });

    useEffect(() => {
        loadEndpoints();
        loadDeliveries();
    }, []);

    const loadEndpoints = async () => {
        try {
            // TODO: Replace with actual API call when backend is ready
            console.log('Would load endpoints from /webhooks/endpoints');
            setEndpoints([]);
        } catch (error) {
            toast.error('Failed to load webhooks');
        }
    };

    const loadDeliveries = async () => {
        try {
            // TODO: Replace with actual API call when backend is ready
            console.log('Would load deliveries from /webhooks/deliveries');
            setDeliveries([]);
        } catch (error) {
            console.error('Failed to load deliveries');
        }
    };

    const handleCreate = async () => {
        setLoading(true);
        try {
            // TODO: Replace with actual API call when backend is ready
            toast.success('Webhook created successfully');
            setShowCreateDialog(false);
            resetForm();
            loadEndpoints();
        } catch (error) {
            toast.error('Failed to create webhook');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedEndpoint) return;

        setLoading(true);
        try {
            // TODO: Replace with actual API call when backend is ready
            console.log('Would update endpoint:', selectedEndpoint.id);
            toast.success('Webhook updated successfully');
            setShowEditDialog(false);
            setSelectedEndpoint(null);
            resetForm();
            loadEndpoints();
        } catch (error) {
            toast.error('Failed to update webhook');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this webhook?')) return;

        try {
            // TODO: Replace with actual API call when backend is ready
            console.log('Would delete endpoint:', id);
            toast.success('Webhook deleted');
            loadEndpoints();
        } catch (error) {
            toast.error('Failed to delete webhook');
        }
    };

    const handleTest = async (id: string) => {
        try {
            // TODO: Replace with actual API call when backend is ready
            console.log('Would test endpoint:', id);
            toast.success('Test webhook sent successfully');
            loadDeliveries();
        } catch (error) {
            toast.error('Failed to send test webhook');
        }
    };

    const handleToggleActive = async (endpoint: WebhookEndpoint) => {
        try {
            // TODO: Replace with actual API call when backend is ready
            console.log('Would toggle endpoint:', endpoint.id);
            toast.success(endpoint.is_active ? 'Webhook disabled' : 'Webhook enabled');
            loadEndpoints();
        } catch (error) {
            toast.error('Failed to update webhook');
        }
    };

    const handleRetryDelivery = async (deliveryId: string) => {
        try {
            // TODO: Replace with actual API call when backend is ready
            console.log('Would retry delivery:', deliveryId);
            toast.success('Delivery retry queued');
            loadDeliveries();
        } catch (error) {
            toast.error('Failed to retry delivery');
        }
    };

    const copySecret = (secret: string) => {
        navigator.clipboard.writeText(secret);
        toast.success('Secret copied to clipboard');
    };

    const resetForm = () => {
        setFormData({
            name: '',
            url: '',
            events: [],
            is_active: true,
            retry_failed: true,
            max_retries: 3,
            custom_headers: {}
        });
    };

    const startEdit = (endpoint: WebhookEndpoint) => {
        setFormData({
            name: endpoint.name,
            url: endpoint.url,
            events: endpoint.events,
            is_active: endpoint.is_active,
            retry_failed: endpoint.retry_failed,
            max_retries: endpoint.max_retries,
            custom_headers: endpoint.custom_headers || {}
        });
        setSelectedEndpoint(endpoint);
        setShowEditDialog(true);
    };

    const toggleEvent = (eventName: string) => {
        setFormData({
            ...formData,
            events: formData.events.includes(eventName)
                ? formData.events.filter(e => e !== eventName)
                : [...formData.events, eventName]
        });
    };

    const getStatusBadge = (status: string) => {
        const config = {
            success: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
            failed: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
            pending: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' }
        };

        const { variant, icon: Icon, color } = config[status as keyof typeof config] || config.pending;

        return (
            <Badge variant={variant} className="gap-1">
                <Icon className="h-3 w-3" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const WebhookForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
        <div className="space-y-4">
            <div>
                <Label>Webhook Name</Label>
                <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Slack Notifications"
                />
            </div>

            <div>
                <Label>Endpoint URL</Label>
                <Input
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://your-domain.com/webhook"
                />
            </div>

            <div>
                <Label className="mb-3 block">Events to Subscribe</Label>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                    {AVAILABLE_EVENTS.map(event => (
                        <div key={event.name} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.events.includes(event.name)}
                                onChange={() => toggleEvent(event.name)}
                                className="rounded"
                            />
                            <div>
                                <div className="text-sm font-medium">{event.name}</div>
                                <div className="text-xs text-muted-foreground">{event.description}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded">
                    <Label>Active</Label>
                    <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                    <Label>Retry Failed</Label>
                    <Switch
                        checked={formData.retry_failed}
                        onCheckedChange={(checked) => setFormData({ ...formData, retry_failed: checked })}
                    />
                </div>
            </div>

            <div>
                <Label>Max Retries</Label>
                <Input
                    type="number"
                    value={formData.max_retries}
                    onChange={(e) => setFormData({ ...formData, max_retries: parseInt(e.target.value) || 3 })}
                    min={0}
                    max={10}
                />
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button
                    variant="outline"
                    onClick={() => {
                        setShowCreateDialog(false);
                        setShowEditDialog(false);
                        resetForm();
                    }}
                >
                    Cancel
                </Button>
                <Button onClick={onSubmit} disabled={!formData.name || !formData.url || formData.events.length === 0 || loading}>
                    {submitLabel}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Webhook Management</h1>
                    <p className="text-muted-foreground">
                        Configure webhooks to receive real-time event notifications
                    </p>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Webhook
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Webhook Endpoint</DialogTitle>
                        </DialogHeader>
                        <WebhookForm onSubmit={handleCreate} submitLabel="Create Webhook" />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Endpoints</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{endpoints.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {endpoints.filter(e => e.is_active).length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{deliveries.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {deliveries.length > 0
                                ? ((deliveries.filter(d => d.status === 'success').length / deliveries.length) * 100).toFixed(1)
                                : '0'}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="endpoints" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="endpoints">
                        <Settings className="h-4 w-4 mr-2" />
                        Endpoints
                    </TabsTrigger>
                    <TabsTrigger value="deliveries">
                        <Activity className="h-4 w-4 mr-2" />
                        Delivery Logs
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="endpoints" className="space-y-4">
                    {endpoints.map(endpoint => (
                        <Card key={endpoint.id}>
                            <CardContent className="py-4">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold">{endpoint.name}</h3>
                                                <Badge variant={endpoint.is_active ? 'default' : 'secondary'}>
                                                    {endpoint.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Code className="h-3 w-3" />
                                                    <code className="text-xs bg-muted px-2 py-1 rounded">{endpoint.url}</code>
                                                </div>
                                                <div>Events: {endpoint.events.join(', ')}</div>
                                                <div className="flex items-center gap-2">
                                                    <span>Secret:</span>
                                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                                        {endpoint.secret.substring(0, 16)}...
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copySecret(endpoint.secret)}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleTest(endpoint.id)}
                                            >
                                                <Play className="h-4 w-4 mr-2" />
                                                Test
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleToggleActive(endpoint)}
                                            >
                                                {endpoint.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => startEdit(endpoint)}
                                            >
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(endpoint.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {endpoints.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="font-semibold mb-2">No webhooks configured</h3>
                                <p className="text-muted-foreground mb-4">
                                    Create your first webhook to start receiving event notifications
                                </p>
                                <Button onClick={() => setShowCreateDialog(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Webhook
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="deliveries" className="space-y-4">
                    {deliveries.slice(0, 50).map(delivery => (
                        <Card key={delivery.id}>
                            <CardContent className="py-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-medium">{delivery.endpoint_name}</span>
                                            {getStatusBadge(delivery.status)}
                                            <Badge variant="outline">{delivery.event_type}</Badge>
                                        </div>
                                        <div className="flex gap-4 text-sm text-muted-foreground">
                                            {delivery.http_status && <span>HTTP {delivery.http_status}</span>}
                                            <span>Attempts: {delivery.attempt_count}</span>
                                            <span>{new Date(delivery.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    {delivery.status === 'failed' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRetryDelivery(delivery.id)}
                                        >
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Retry
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>
            </Tabs>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Webhook Endpoint</DialogTitle>
                    </DialogHeader>
                    <WebhookForm onSubmit={handleUpdate} submitLabel="Update Webhook" />
                </DialogContent>
            </Dialog>
        </div>
    );
}
