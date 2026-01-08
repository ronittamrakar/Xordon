import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Settings, Bell, MapPin, DollarSign, Save, Plus, Trash2 } from 'lucide-react';
import { getMyProProfile, getServices, updatePreferences, updateServiceOfferings, updateServiceAreas, ServicePro, ServiceCategory, ProPreferences, ServiceArea } from '@/services/leadMarketplaceApi';
import { MarketplaceNav } from '@/components/marketplace/MarketplaceNav';

export default function MarketplacePreferences() {
  const [profile, setProfile] = useState<ServicePro | null>(null);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [preferences, setPreferences] = useState<Partial<ProPreferences>>({
    min_budget: 0,
    max_budget: undefined,
    max_radius_km: 50,
    max_leads_per_day: 10,
    max_leads_per_week: 50,
    notify_email: true,
    notify_sms: true,
    notify_push: true,
    auto_recharge_enabled: false,
    auto_recharge_threshold: 50,
    auto_recharge_amount: 100,
    pause_when_balance_zero: true,
  });

  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [serviceAreas, setServiceAreas] = useState<Partial<ServiceArea>[]>([
    { area_type: 'radius', city: '', region: '', country: 'US', postal_code: '', latitude: undefined, longitude: undefined, radius_km: 25, is_primary: true }
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, servicesRes] = await Promise.all([
        getMyProProfile(),
        getServices()
      ]);
      if (servicesRes.data.success) setServices(servicesRes.data.data);
      if (profileRes.data.success && profileRes.data.data) {
        const pro = profileRes.data.data;
        setProfile(pro);
        if (pro.preferences) setPreferences(pro.preferences);
        if (pro.offerings) setSelectedServices(pro.offerings.map(o => o.service_id));
        if (pro.service_areas && pro.service_areas.length > 0) setServiceAreas(pro.service_areas);
      }
    } catch (error) {
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await updatePreferences(preferences);
      toast.success('Preferences saved');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveServices = async () => {
    setSaving(true);
    try {
      await updateServiceOfferings(selectedServices);
      toast.success('Service offerings saved');
    } catch (error) {
      toast.error('Failed to save services');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAreas = async () => {
    setSaving(true);
    try {
      await updateServiceAreas(serviceAreas);
      toast.success('Service areas saved');
    } catch (error) {
      toast.error('Failed to save service areas');
    } finally {
      setSaving(false);
    }
  };

  const addServiceArea = () => {
    setServiceAreas([...serviceAreas, { area_type: 'radius', city: '', region: '', country: 'US', postal_code: '', radius_km: 25, is_primary: false }]);
  };

  const removeServiceArea = (index: number) => {
    setServiceAreas(serviceAreas.filter((_, i) => i !== index));
  };

  const updateServiceArea = (index: number, field: string, value: any) => {
    const updated = [...serviceAreas];
    updated[index] = { ...updated[index], [field]: value };
    setServiceAreas(updated);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <MarketplaceNav />
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <MarketplaceNav />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lead Preferences</h1>
        <p className="text-muted-foreground">Configure your lead matching preferences and service areas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget & Limits
            </CardTitle>
            <CardDescription>Set your budget range and lead limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Minimum Budget ($)</Label>
                <Input type="number" min="0" value={preferences.min_budget || ''} onChange={e => setPreferences({ ...preferences, min_budget: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Maximum Budget ($)</Label>
                <Input type="number" min="0" placeholder="No limit" value={preferences.max_budget || ''} onChange={e => setPreferences({ ...preferences, max_budget: e.target.value ? parseFloat(e.target.value) : undefined })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Max Leads Per Day</Label>
                <Input type="number" min="1" value={preferences.max_leads_per_day || ''} onChange={e => setPreferences({ ...preferences, max_leads_per_day: parseInt(e.target.value) || 10 })} />
              </div>
              <div>
                <Label>Max Leads Per Week</Label>
                <Input type="number" min="1" value={preferences.max_leads_per_week || ''} onChange={e => setPreferences({ ...preferences, max_leads_per_week: parseInt(e.target.value) || 50 })} />
              </div>
            </div>
            <div>
              <Label>Maximum Service Radius (km)</Label>
              <Input type="number" min="1" value={preferences.max_radius_km || ''} onChange={e => setPreferences({ ...preferences, max_radius_km: parseInt(e.target.value) || 50 })} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Pause When Balance Zero</Label>
                <p className="text-sm text-muted-foreground">Stop receiving leads when credits run out</p>
              </div>
              <Switch checked={preferences.pause_when_balance_zero} onCheckedChange={v => setPreferences({ ...preferences, pause_when_balance_zero: v })} />
            </div>
            <Button onClick={handleSavePreferences} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Budget Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Choose how you want to be notified about new leads</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive lead alerts via email</p>
              </div>
              <Switch checked={preferences.notify_email} onCheckedChange={v => setPreferences({ ...preferences, notify_email: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive lead alerts via text message</p>
              </div>
              <Switch checked={preferences.notify_sms} onCheckedChange={v => setPreferences({ ...preferences, notify_sms: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive in-app push notifications</p>
              </div>
              <Switch checked={preferences.notify_push} onCheckedChange={v => setPreferences({ ...preferences, notify_push: v })} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Recharge</Label>
                <p className="text-sm text-muted-foreground">Automatically add credits when balance is low</p>
              </div>
              <Switch checked={preferences.auto_recharge_enabled} onCheckedChange={v => setPreferences({ ...preferences, auto_recharge_enabled: v })} />
            </div>
            {preferences.auto_recharge_enabled && (
              <div className="grid grid-cols-2 gap-4 pl-4 border-l-2">
                <div>
                  <Label>Threshold ($)</Label>
                  <Input type="number" min="0" value={preferences.auto_recharge_threshold || ''} onChange={e => setPreferences({ ...preferences, auto_recharge_threshold: parseFloat(e.target.value) || 50 })} />
                </div>
                <div>
                  <Label>Recharge Amount ($)</Label>
                  <Input type="number" min="10" value={preferences.auto_recharge_amount || ''} onChange={e => setPreferences({ ...preferences, auto_recharge_amount: parseFloat(e.target.value) || 100 })} />
                </div>
              </div>
            )}
            <Button onClick={handleSavePreferences} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Notification Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Services Offered
            </CardTitle>
            <CardDescription>Select the services you provide</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {services.map(service => (
                <div key={service.id} className="flex items-center space-x-2">
                  <Checkbox id={`service-${service.id}`} checked={selectedServices.includes(service.id)} onCheckedChange={checked => {
                    if (checked) {
                      setSelectedServices([...selectedServices, service.id]);
                    } else {
                      setSelectedServices(selectedServices.filter(id => id !== service.id));
                    }
                  }} />
                  <label htmlFor={`service-${service.id}`} className="text-sm cursor-pointer">{service.name}</label>
                </div>
              ))}
            </div>
            {services.length === 0 && (
              <p className="text-sm text-muted-foreground">No services available. Contact admin to add services.</p>
            )}
            <Button onClick={handleSaveServices} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Services ({selectedServices.length} selected)
            </Button>
            {selectedServices.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Select at least one service to receive leads
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Service Areas
            </CardTitle>
            <CardDescription>Define the areas where you provide services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {serviceAreas.map((area, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Area {index + 1} {area.is_primary && <span className="text-primary">(Primary)</span>}</Label>
                  {serviceAreas.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeServiceArea(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">City</Label>
                    <Input placeholder="City" value={area.city || ''} onChange={e => updateServiceArea(index, 'city', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">State/Region</Label>
                    <Input placeholder="State" value={area.region || ''} onChange={e => updateServiceArea(index, 'region', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Postal Code</Label>
                    <Input placeholder="ZIP" value={area.postal_code || ''} onChange={e => updateServiceArea(index, 'postal_code', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Radius (km)</Label>
                    <Input type="number" min="1" value={area.radius_km || ''} onChange={e => updateServiceArea(index, 'radius_km', parseInt(e.target.value) || 25)} />
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addServiceArea}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service Area
            </Button>
            <Button onClick={handleSaveAreas} disabled={saving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Service Areas
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
