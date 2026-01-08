import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  ShoppingCart, Store, Package, DollarSign, TrendingUp, RefreshCw,
  Plus, ExternalLink, AlertCircle, CheckCircle2, Clock, Mail, MessageSquare
} from 'lucide-react';

interface EcommerceStore {
  id: number;
  platform: 'shopify' | 'woocommerce' | 'magento' | 'bigcommerce' | 'custom';
  store_name: string;
  store_url: string;
  sync_status: 'pending' | 'syncing' | 'synced' | 'error';
  last_sync_at?: string;
  status: 'active' | 'paused' | 'disconnected';
  product_count?: number;
  order_count?: number;
  total_revenue?: number;
}

interface Order {
  id: number;
  order_number: string;
  email: string;
  status: string;
  total: number;
  order_date: string;
  store_name: string;
}

interface AbandonedCart {
  id: number;
  email: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  recovery_status: string;
  abandoned_at: string;
  store_name: string;
  contact_name?: string;
}

interface Dashboard {
  store_count: number;
  revenue_30d: number;
  pending_carts: number;
  recent_orders: Order[];
}

export default function Ecommerce() {
  const [stores, setStores] = useState<EcommerceStore[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [formData, setFormData] = useState({
    platform: 'shopify',
    store_name: '',
    store_url: '',
    api_key: '',
    api_secret: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, storesRes, cartsRes] = await Promise.all([
        api.get('/ecommerce/dashboard'),
        api.get('/ecommerce/stores'),
        api.get('/ecommerce/abandoned-carts'),
      ]);
      setDashboard(dashboardRes.data as Dashboard);
      const storesData = storesRes.data as { items?: EcommerceStore[] };
      const cartsData = cartsRes.data as { items?: AbandonedCart[] };
      setStores(storesData.items || []);
      setAbandonedCarts(cartsData.items || []);
    } catch (error) {
      console.error('Failed to load ecommerce data:', error);
      toast.error('Failed to load ecommerce data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStore = async () => {
    try {
      if (!BACKEND_ENABLED) {
        const nextId = Math.max(0, ...stores.map((s) => s.id)) + 1;
        const now = new Date().toISOString();
        const platform = formData.platform as EcommerceStore['platform'];
        const newStore: EcommerceStore = {
          id: nextId,
          platform,
          store_name: formData.store_name || `New ${platform} Store`,
          store_url: formData.store_url || 'https://example.com',
          sync_status: 'pending',
          last_sync_at: now,
          status: 'active',
          product_count: 0,
          order_count: 0,
          total_revenue: 0,
        };
        setStores((prev) => [newStore, ...prev]);
        setIsConnectOpen(false);
        setFormData({ platform: 'shopify', store_name: '', store_url: '', api_key: '', api_secret: '' });
        toast.success('Store connected (preview)');
        return;
      }
      await api.post('/ecommerce/stores', formData);
      toast.success('Store connected successfully');
      setIsConnectOpen(false);
      setFormData({ platform: 'shopify', store_name: '', store_url: '', api_key: '', api_secret: '' });
      loadData();
    } catch (error) {
      toast.error('Failed to connect store');
    }
  };

  const handleSyncStore = async (id: number) => {
    try {
      if (!BACKEND_ENABLED) {
        setStores((prev) => prev.map((s) => (s.id === id ? { ...s, sync_status: 'syncing' } : s)));
        toast.info('Sync started (preview)');
        window.setTimeout(() => {
          const now = new Date().toISOString();
          setStores((prev) => prev.map((s) => (s.id === id ? { ...s, sync_status: 'synced', last_sync_at: now } : s)));
        }, 900);
        return;
      }
      await api.post(`/ecommerce/stores/${id}/sync`);
      toast.success('Sync started');
      loadData();
    } catch (error) {
      toast.error('Failed to sync store');
    }
  };

  const handleSendRecovery = async (cartId: number, channel: 'email' | 'sms') => {
    try {
      if (!BACKEND_ENABLED) {
        const nextStatus = channel === 'email' ? 'email_sent' : 'sms_sent';
        setAbandonedCarts((prev) => prev.map((c) => (c.id === cartId ? { ...c, recovery_status: nextStatus } : c)));
        toast.success(`Recovery ${channel} sent (preview)`);
        return;
      }
      await api.post(`/ecommerce/abandoned-carts/${cartId}/recover`, { channel });
      toast.success(`Recovery ${channel} sent`);
      loadData();
    } catch (error) {
      toast.error('Failed to send recovery message');
    }
  };

  const getPlatformLogo = (platform: string) => {
    const logos: Record<string, string> = {
      shopify: '🛍️',
      woocommerce: '🔌',
      magento: '🧲',
      bigcommerce: '📦',
      custom: '⚙️'
    };
    return logos[platform] || '🏪';
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'synced': return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Synced</Badge>;
      case 'syncing': return <Badge className="bg-blue-100 text-blue-800"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Syncing</Badge>;
      case 'error': return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getRecoveryStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline">Pending</Badge>;
      case 'email_sent': return <Badge className="bg-blue-100 text-blue-800">Email Sent</Badge>;
      case 'sms_sent': return <Badge className="bg-purple-100 text-purple-800">SMS Sent</Badge>;
      case 'recovered': return <Badge className="bg-green-100 text-green-800">Recovered</Badge>;
      case 'expired': return <Badge variant="secondary">Expired</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-dashed border-primary/40 bg-primary/5">
        <CardContent className="py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">Beta Preview</p>
            <p className="text-sm text-muted-foreground max-w-xl">
              Store integrations and ecommerce automations are in beta. The dashboard uses sample data for now and
              actions like connecting stores or sending recovery messages are placeholders until the backend is live.
            </p>
          </div>
          <Badge variant="outline" className="mt-2 sm:mt-0">Coming Soon</Badge>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">E-commerce</h1>
          <p className="text-muted-foreground">Connect your stores and recover abandoned carts</p>
        </div>
        <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Connect Store
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect E-commerce Store</DialogTitle>
              <DialogDescription>Link your online store to sync products, orders, and customers</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Platform</Label>
                <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shopify">Shopify</SelectItem>
                    <SelectItem value="woocommerce">WooCommerce</SelectItem>
                    <SelectItem value="magento">Magento</SelectItem>
                    <SelectItem value="bigcommerce">BigCommerce</SelectItem>
                    <SelectItem value="custom">Custom / API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Store Name</Label>
                <Input
                  value={formData.store_name}
                  onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                  placeholder="My Store"
                />
              </div>
              <div>
                <Label>Store URL</Label>
                <Input
                  value={formData.store_url}
                  onChange={(e) => setFormData({ ...formData, store_url: e.target.value })}
                  placeholder="https://mystore.myshopify.com"
                />
              </div>
              <div>
                <Label>API Key</Label>
                <Input
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="Your API key"
                />
              </div>
              <div>
                <Label>API Secret</Label>
                <Input
                  type="password"
                  value={formData.api_secret}
                  onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                  placeholder="Your API secret"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConnectOpen(false)}>Cancel</Button>
              <Button onClick={handleConnectStore}>Connect Store</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connected Stores</p>
                <p className="text-2xl font-bold">{dashboard?.store_count || stores.length}</p>
              </div>
              <Store className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue (30 days)</p>
                <p className="text-2xl font-bold">${(dashboard?.revenue_30d || 0).toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Abandoned Carts</p>
                <p className="text-2xl font-bold">{dashboard?.pending_carts || abandonedCarts.filter(c => c.recovery_status === 'pending').length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recovery Rate</p>
                <p className="text-2xl font-bold text-green-600">18.5%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stores" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stores">
            <Store className="h-4 w-4 mr-2" />
            Stores
          </TabsTrigger>
          <TabsTrigger value="abandoned-carts">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Abandoned Carts
          </TabsTrigger>
          <TabsTrigger value="orders">
            <Package className="h-4 w-4 mr-2" />
            Recent Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stores.map((store) => (
              <Card key={store.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                        {getPlatformLogo(store.platform)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{store.store_name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          {store.store_url}
                        </CardDescription>
                      </div>
                    </div>
                    {getSyncStatusBadge(store.sync_status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-muted-foreground">Products</p>
                      <p className="font-semibold">{store.product_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Orders</p>
                      <p className="font-semibold">{store.order_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Revenue</p>
                      <p className="font-semibold">${((store.total_revenue || 0) / 1000).toFixed(1)}k</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Last synced: {store.last_sync_at ? new Date(store.last_sync_at).toLocaleString() : 'Never'}
                    </p>
                    <Button size="sm" variant="outline" onClick={() => handleSyncStore(store.id)}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Sync Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="abandoned-carts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Abandoned Carts</CardTitle>
              <CardDescription>Recover lost sales with automated follow-ups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {abandonedCarts.map((cart) => (
                  <div key={cart.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">{cart.contact_name || cart.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {cart.items.length} item(s) • ${cart.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">Abandoned</p>
                        <p>{new Date(cart.abandoned_at).toLocaleString()}</p>
                      </div>
                      {getRecoveryStatusBadge(cart.recovery_status)}
                      {cart.recovery_status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleSendRecovery(cart.id, 'email')}>
                            <Mail className="h-4 w-4 mr-1" />
                            Email
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleSendRecovery(cart.id, 'sms')}>
                            <MessageSquare className="h-4 w-4 mr-1" />
                            SMS
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders from all connected stores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">{order.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">${order.total.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{order.store_name}</p>
                      </div>
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
