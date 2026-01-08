import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { DollarSign, Plus, Pencil, Trash2, Save, RefreshCw } from 'lucide-react';
import { getPricingRules, createPricingRule, updatePricingRule, deletePricingRule, getServices, PricingRule, ServiceCategory } from '@/services/leadMarketplaceApi';
import { MarketplaceNav } from '@/components/marketplace/MarketplaceNav';

export default function PricingRulesPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    service_id: 'any',
    region: '',
    city: '',
    postal_code: '',
    timing: 'any',
    budget_min: '',
    budget_max: '',
    property_type: 'any',
    is_exclusive: false,
    base_price: '25',
    surge_multiplier: '1.0',
    exclusive_multiplier: '3.0',
    priority: '0',
    is_active: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, servicesRes] = await Promise.all([
        getPricingRules(),
        getServices()
      ]);
      if (rulesRes.data.success) setRules(rulesRes.data.data);
      if (servicesRes.data.success) setServices(servicesRes.data.data);
    } catch (error) {
      toast.error('Failed to load pricing rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      service_id: 'any',
      region: '',
      city: '',
      postal_code: '',
      timing: 'any',
      budget_min: '',
      budget_max: '',
      property_type: 'any',
      is_exclusive: false,
      base_price: '25',
      surge_multiplier: '1.0',
      exclusive_multiplier: '3.0',
      priority: '0',
      is_active: true,
    });
    setEditingRule(null);
  };

  const openEditDialog = (rule: PricingRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name || '',
      service_id: rule.service_id?.toString() || 'any',
      region: rule.region || '',
      city: rule.city || '',
      postal_code: rule.postal_code || '',
      timing: rule.timing || 'any',
      budget_min: rule.budget_min?.toString() || '',
      budget_max: rule.budget_max?.toString() || '',
      property_type: rule.property_type || 'any',
      is_exclusive: rule.is_exclusive || false,
      base_price: rule.base_price.toString(),
      surge_multiplier: rule.surge_multiplier.toString(),
      exclusive_multiplier: rule.exclusive_multiplier.toString(),
      priority: rule.priority.toString(),
      is_active: rule.is_active,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: Partial<PricingRule> = {
        name: formData.name || undefined,
        service_id: formData.service_id && formData.service_id !== 'any' ? parseInt(formData.service_id) : undefined,
        region: formData.region || undefined,
        city: formData.city || undefined,
        postal_code: formData.postal_code || undefined,
        timing: formData.timing && formData.timing !== 'any' ? formData.timing : undefined,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : undefined,
        property_type: formData.property_type && formData.property_type !== 'any' ? formData.property_type : undefined,
        is_exclusive: formData.is_exclusive,
        base_price: parseFloat(formData.base_price) || 25,
        surge_multiplier: parseFloat(formData.surge_multiplier) || 1.0,
        exclusive_multiplier: parseFloat(formData.exclusive_multiplier) || 3.0,
        priority: parseInt(formData.priority) || 0,
        is_active: formData.is_active,
      };

      if (editingRule) {
        await updatePricingRule(editingRule.id, data);
        toast.success('Pricing rule updated');
      } else {
        await createPricingRule(data);
        toast.success('Pricing rule created');
      }
      setShowDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to save pricing rule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) return;
    try {
      await deletePricingRule(id);
      toast.success('Pricing rule deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete pricing rule');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <MarketplaceNav />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <MarketplaceNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pricing Rules</h1>
          <p className="text-muted-foreground">Configure lead pricing based on service, location, and other factors</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingRule ? 'Edit Pricing Rule' : 'Create Pricing Rule'}</DialogTitle>
                <DialogDescription>Define conditions and pricing for lead matching</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2">
                  <Label>Rule Name</Label>
                  <Input placeholder="e.g., Premium Plumbing Leads" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <Label>Service Category</Label>
                  <Select value={formData.service_id} onValueChange={v => setFormData({ ...formData, service_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Any service" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any service</SelectItem>
                      {services.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Timing</Label>
                  <Select value={formData.timing} onValueChange={v => setFormData({ ...formData, timing: v })}>
                    <SelectTrigger><SelectValue placeholder="Any timing" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any timing</SelectItem>
                      <SelectItem value="asap">ASAP</SelectItem>
                      <SelectItem value="within_24h">Within 24 hours</SelectItem>
                      <SelectItem value="within_week">Within a week</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Region/State</Label>
                  <Input placeholder="e.g., CA, NY" value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input placeholder="e.g., Los Angeles" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <Input placeholder="e.g., 90210" value={formData.postal_code} onChange={e => setFormData({ ...formData, postal_code: e.target.value })} />
                </div>
                <div>
                  <Label>Property Type</Label>
                  <Select value={formData.property_type} onValueChange={v => setFormData({ ...formData, property_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Any type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any type</SelectItem>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Min Budget ($)</Label>
                  <Input type="number" min="0" placeholder="0" value={formData.budget_min} onChange={e => setFormData({ ...formData, budget_min: e.target.value })} />
                </div>
                <div>
                  <Label>Max Budget ($)</Label>
                  <Input type="number" min="0" placeholder="No limit" value={formData.budget_max} onChange={e => setFormData({ ...formData, budget_max: e.target.value })} />
                </div>
                <div className="col-span-2 border-t pt-4">
                  <h4 className="font-medium mb-3">Pricing</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Base Price ($)</Label>
                      <Input type="number" min="0" step="0.01" value={formData.base_price} onChange={e => setFormData({ ...formData, base_price: e.target.value })} />
                    </div>
                    <div>
                      <Label>Surge Multiplier</Label>
                      <Input type="number" min="1" step="0.1" value={formData.surge_multiplier} onChange={e => setFormData({ ...formData, surge_multiplier: e.target.value })} />
                      <p className="text-xs text-muted-foreground mt-1">Applied for ASAP/urgent leads</p>
                    </div>
                    <div>
                      <Label>Exclusive Multiplier</Label>
                      <Input type="number" min="1" step="0.1" value={formData.exclusive_multiplier} onChange={e => setFormData({ ...formData, exclusive_multiplier: e.target.value })} />
                      <p className="text-xs text-muted-foreground mt-1">Applied for exclusive leads</p>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Input type="number" min="0" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} />
                  <p className="text-xs text-muted-foreground mt-1">Higher priority rules are checked first</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.is_active} onCheckedChange={v => setFormData({ ...formData, is_active: v })} />
                    <Label>Active</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.is_exclusive} onCheckedChange={v => setFormData({ ...formData, is_exclusive: v })} />
                    <Label>Exclusive Only</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Pricing Rules</CardTitle>
          <CardDescription>Rules are evaluated in priority order (highest first). First matching rule determines the lead price.</CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pricing rules configured</p>
              <p className="text-sm">Default pricing of $25 per lead will be used</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Multipliers</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map(rule => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name || `Rule #${rule.id}`}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {rule.service_name && <Badge variant="outline">{rule.service_name}</Badge>}
                        {rule.region && <Badge variant="outline">{rule.region}</Badge>}
                        {rule.city && <Badge variant="outline">{rule.city}</Badge>}
                        {rule.timing && <Badge variant="outline">{rule.timing}</Badge>}
                        {rule.property_type && <Badge variant="outline">{rule.property_type}</Badge>}
                        {!rule.service_name && !rule.region && !rule.city && !rule.timing && !rule.property_type && <span className="text-muted-foreground">All leads</span>}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">${rule.base_price.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span>Surge: {rule.surge_multiplier}x</span>
                        <br />
                        <span>Excl: {rule.exclusive_multiplier}x</span>
                      </div>
                    </TableCell>
                    <TableCell>{rule.priority}</TableCell>
                    <TableCell>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(rule)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
