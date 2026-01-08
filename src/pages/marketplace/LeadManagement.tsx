import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Upload, Plus, Route } from 'lucide-react';
import {
  createLeadRequest,
  getLeadRequests,
  getServices,
  routeLeadRequest,
  LeadRequest,
  ServiceCategory,
} from '@/services/leadMarketplaceApi';
import { MarketplaceNav } from '@/components/marketplace/MarketplaceNav';

function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map(h => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const row: Record<string, string> = {};
    header.forEach((h, idx) => {
      row[h] = (cols[idx] ?? '').trim();
    });
    rows.push(row);
  }

  return rows;
}

export default function LeadManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [routing, setRouting] = useState<number | null>(null);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [leads, setLeads] = useState<LeadRequest[]>([]);

  const [formData, setFormData] = useState({
    consumer_name: '',
    consumer_email: '',
    consumer_phone: '',
    city: '',
    region: '',
    postal_code: '',
    timing: 'flexible',
    budget_min: '',
    budget_max: '',
    title: '',
    description: '',
    service_id: '',
    is_exclusive: false,
    max_sold_count: '3',
    auto_route: true,
  });

  const [csvText, setCsvText] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [svcRes, leadsRes] = await Promise.all([
        getServices({ parent_id: null }),
        getLeadRequests({ limit: 50 }),
      ]);
      if (svcRes.data.success) setServices(svcRes.data.data);
      if (leadsRes.data.success) setLeads(leadsRes.data.data);
    } catch {
      toast.error('Failed to load lead management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const serviceOptions = useMemo(() => {
    const flat: { id: number; name: string }[] = [];
    const walk = (items: ServiceCategory[], prefix = '') => {
      for (const s of items) {
        flat.push({ id: s.id, name: prefix ? `${prefix} / ${s.name}` : s.name });
        if (s.subcategories?.length) walk(s.subcategories, prefix ? `${prefix} / ${s.name}` : s.name);
      }
    };
    walk(services);
    return flat;
  }, [services]);

  const handleCreateLead = async () => {
    if (!formData.service_id || formData.service_id === 'none') {
      toast.error('Please select a service');
      return;
    }

    setSaving(true);
    try {
      const maxSold = formData.is_exclusive ? 1 : Math.max(1, parseInt(formData.max_sold_count || '3', 10) || 3);

      const res = await createLeadRequest({
        source: 'import',
        consumer_name: formData.consumer_name || undefined,
        consumer_email: formData.consumer_email || undefined,
        consumer_phone: formData.consumer_phone || undefined,
        city: formData.city || undefined,
        region: formData.region || undefined,
        postal_code: formData.postal_code || undefined,
        timing: formData.timing,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : undefined,
        title: formData.title || undefined,
        description: formData.description || undefined,
        is_exclusive: formData.is_exclusive,
        max_sold_count: maxSold,
        services: [{ service_id: parseInt(formData.service_id, 10) }],
        consent_contact: true,
      });

      if (res.data.success) {
        toast.success('Lead created');
        if (formData.auto_route) {
          await routeLeadRequest(res.data.data.id);
        }
        await fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create lead');
    } finally {
      setSaving(false);
    }
  };

  const handleRouteNow = async (leadId: number) => {
    setRouting(leadId);
    try {
      const res = await routeLeadRequest(leadId);
      if (res.data.success) {
        toast.success(`Routed lead: ${res.data.data.matches_created} matches`);
        await fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to route lead');
    } finally {
      setRouting(null);
    }
  };

  const handleImportCsv = async () => {
    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      toast.error('CSV must have a header row and at least one data row');
      return;
    }

    const serviceIdCol = 'service_id';
    const serviceSlugCol = 'service_slug';

    setSaving(true);
    try {
      let created = 0;
      for (const row of rows) {
        const serviceIdRaw = row[serviceIdCol];
        const serviceSlugRaw = row[serviceSlugCol];

        let serviceId: number | null = null;
        if (serviceIdRaw) {
          const n = parseInt(serviceIdRaw, 10);
          if (!Number.isNaN(n)) serviceId = n;
        }

        if (!serviceId && serviceSlugRaw) {
          const match = services.find(s => s.slug === serviceSlugRaw);
          if (match) serviceId = match.id;
        }

        if (!serviceId) continue;

        const isExclusive = (row['is_exclusive'] || '').toLowerCase() === 'true' || row['is_exclusive'] === '1';
        const maxSold = isExclusive ? 1 : Math.max(1, parseInt(row['max_sold_count'] || '3', 10) || 3);

        const res = await createLeadRequest({
          source: 'import',
          consumer_name: row['consumer_name'] || undefined,
          consumer_email: row['consumer_email'] || undefined,
          consumer_phone: row['consumer_phone'] || undefined,
          city: row['city'] || undefined,
          region: row['region'] || undefined,
          postal_code: row['postal_code'] || undefined,
          timing: row['timing'] || 'flexible',
          budget_min: row['budget_min'] ? parseFloat(row['budget_min']) : undefined,
          budget_max: row['budget_max'] ? parseFloat(row['budget_max']) : undefined,
          title: row['title'] || undefined,
          description: row['description'] || undefined,
          is_exclusive: isExclusive,
          max_sold_count: maxSold,
          services: [{ service_id: serviceId }],
          consent_contact: true,
        });

        if (res.data.success) {
          created++;
          if ((row['auto_route'] || '').toLowerCase() !== 'false') {
            await routeLeadRequest(res.data.data.id);
          }
        }
      }

      toast.success(`Imported ${created} leads`);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to import CSV');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <MarketplaceNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Management</h1>
          <p className="text-muted-foreground">Create, import, and route leads into the marketplace</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Manual Lead Entry
            </CardTitle>
            <CardDescription>Create a lead and optionally auto-route it to providers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Consumer Name</Label>
                <Input value={formData.consumer_name} onChange={e => setFormData({ ...formData, consumer_name: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={formData.consumer_phone} onChange={e => setFormData({ ...formData, consumer_phone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input value={formData.consumer_email} onChange={e => setFormData({ ...formData, consumer_email: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
              </div>
              <div>
                <Label>Region/State</Label>
                <Input value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Postal Code</Label>
              <Input value={formData.postal_code} onChange={e => setFormData({ ...formData, postal_code: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Timing</Label>
                <Select value={formData.timing} onValueChange={v => setFormData({ ...formData, timing: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asap">ASAP</SelectItem>
                    <SelectItem value="within_24h">Within 24 hours</SelectItem>
                    <SelectItem value="within_week">Within a week</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Service</Label>
                <Select value={formData.service_id} onValueChange={v => setFormData({ ...formData, service_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select a service...</SelectItem>
                    {serviceOptions.map(opt => (
                      <SelectItem key={opt.id} value={String(opt.id)}>
                        {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Budget Min</Label>
                <Input type="number" value={formData.budget_min} onChange={e => setFormData({ ...formData, budget_min: e.target.value })} />
              </div>
              <div>
                <Label>Budget Max</Label>
                <Input type="number" value={formData.budget_max} onChange={e => setFormData({ ...formData, budget_max: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Title</Label>
              <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <div className="font-medium">Exclusive</div>
                <div className="text-sm text-muted-foreground">Exclusive means only 1 provider can buy</div>
              </div>
              <Switch checked={formData.is_exclusive} onCheckedChange={v => setFormData({ ...formData, is_exclusive: v })} />
            </div>

            {!formData.is_exclusive && (
              <div>
                <Label>Max Sold Count</Label>
                <Input type="number" value={formData.max_sold_count} onChange={e => setFormData({ ...formData, max_sold_count: e.target.value })} />
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <div className="font-medium">Auto-route</div>
                <div className="text-sm text-muted-foreground">Create matches immediately after creation</div>
              </div>
              <Switch checked={formData.auto_route} onCheckedChange={v => setFormData({ ...formData, auto_route: v })} />
            </div>

            <Button onClick={handleCreateLead} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Lead
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              CSV Import
            </CardTitle>
            <CardDescription>
              CSV headers supported: consumer_name, consumer_email, consumer_phone, city, region, postal_code, timing, budget_min, budget_max, title, description, service_id (or service_slug), is_exclusive, max_sold_count, auto_route
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={12}
              placeholder="Paste CSV here..."
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
            />
            <Button onClick={handleImportCsv} disabled={saving} className="w-full" variant="secondary">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
          <CardDescription>Latest 50 leads (operator view)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Sold</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono">{l.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{l.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {typeof l.quality_score === 'number' ? (
                        <Badge variant="outline">{Math.round(l.quality_score)}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{l.service_names || '-'}</TableCell>
                    <TableCell>
                      {(l.city || '-') + (l.region ? `, ${l.region}` : '')}
                    </TableCell>
                    <TableCell>${(l.lead_price_final ?? l.lead_price_base ?? 0).toFixed(2)}</TableCell>
                    <TableCell>
                      {l.current_sold_count}/{l.max_sold_count}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/lead-marketplace/leads/${l.id}`)}>
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRouteNow(l.id)}
                          disabled={routing === l.id}
                        >
                          {routing === l.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Route className="h-4 w-4 mr-2" />
                              Route
                            </>
                          )}
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
