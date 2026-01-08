import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { AppLayout } from '@/components/layout/AppLayout';
import { Wrench, Stethoscope, Home, Scale, Car, Scissors, Save, RefreshCw, Zap, Briefcase, Building2 } from 'lucide-react';
import { INDUSTRY_COLORS, IndustrySlug } from '@/types/industry';

const INDUSTRIES: { value: IndustrySlug; label: string; icon: React.ReactNode }[] = [
  { value: 'home_services', label: 'Home Services', icon: <Wrench className="h-5 w-5" /> },
  { value: 'local_business', label: 'Local Business', icon: <Building2 className="h-5 w-5" /> },
  { value: 'professional_services', label: 'Professional Services', icon: <Briefcase className="h-5 w-5" /> },
  { value: 'healthcare', label: 'Healthcare', icon: <Stethoscope className="h-5 w-5" /> },
  { value: 'real_estate', label: 'Real Estate', icon: <Home className="h-5 w-5" /> },
  { value: 'legal', label: 'Legal', icon: <Scale className="h-5 w-5" /> },
  { value: 'transportation', label: 'Transportation', icon: <Car className="h-5 w-5" /> },
  { value: 'beauty_wellness', label: 'Beauty & Wellness', icon: <Scissors className="h-5 w-5" /> },
];

export default function IndustrySettings() {
  const [industryTypes, setIndustryTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustrySlug | ''>('');
  const [businessForm, setBusinessForm] = useState({ business_name: '', business_phone: '', business_email: '', service_area: '' });
  const [speedForm, setSpeedForm] = useState({ is_enabled: true, auto_sms_new_leads: true, new_lead_delay_seconds: 30, missed_call_auto_sms: true });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [typesRes, settingsRes, speedRes] = await Promise.all([
        api.get('/operations/types'),
        api.get('/operations/settings'),
        api.get('/operations/speed-to-lead'),
      ]);
      const typesData = (typesRes as any).data || typesRes;
      setIndustryTypes((typesData as any)?.items || []);

      const settingsData = (settingsRes as any).data || settingsRes;
      const settings = (settingsData as any)?.items?.[0];

      if (settings) {
        setSelectedIndustry(settings.slug);
        setBusinessForm({ business_name: settings.business_name || '', business_phone: settings.business_phone || '', business_email: settings.business_email || '', service_area: settings.service_area || '' });
      }

      const speed = (speedRes as any).data || speedRes;
      if (speed) setSpeedForm({ is_enabled: speed.is_enabled ?? true, auto_sms_new_leads: speed.auto_sms_new_leads ?? true, new_lead_delay_seconds: speed.new_lead_delay_seconds ?? 30, missed_call_auto_sms: speed.missed_call_auto_sms ?? true });
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const industryType = industryTypes.find(t => t.slug === selectedIndustry);
      await api.post('/operations/settings', { industry_type_id: industryType?.id, ...businessForm });
      await api.post('/operations/speed-to-lead', speedForm);
      toast.success('Settings saved');
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Industry Settings</h1><p className="text-muted-foreground">Configure your business type</p></div>
        <Button variant="outline" onClick={loadData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      <Tabs defaultValue="industry">
        <TabsList><TabsTrigger value="industry">Industry</TabsTrigger><TabsTrigger value="business">Business</TabsTrigger><TabsTrigger value="speed">Speed-to-Lead</TabsTrigger></TabsList>

        <TabsContent value="industry" className="mt-4">
          <Card><CardHeader><CardTitle>Select Industry</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {INDUSTRIES.map(ind => (
                  <Card key={ind.value} className={`cursor-pointer ${selectedIndustry === ind.value ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedIndustry(ind.value)}>
                    <CardContent className="pt-4 flex items-center gap-3">
                      <div className="p-2 rounded" style={{ backgroundColor: INDUSTRY_COLORS[ind.value] + '20', color: INDUSTRY_COLORS[ind.value] }}>{ind.icon}</div>
                      <span className="font-medium">{ind.label}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="mt-4">
          <Card><CardHeader><CardTitle>Business Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Business Name</Label><Input value={businessForm.business_name} onChange={e => setBusinessForm({ ...businessForm, business_name: e.target.value })} /></div>
                <div><Label>Phone</Label><Input value={businessForm.business_phone} onChange={e => setBusinessForm({ ...businessForm, business_phone: e.target.value })} /></div>
              </div>
              <div><Label>Email</Label><Input value={businessForm.business_email} onChange={e => setBusinessForm({ ...businessForm, business_email: e.target.value })} /></div>
              <div><Label>Service Area</Label><Input value={businessForm.service_area} onChange={e => setBusinessForm({ ...businessForm, service_area: e.target.value })} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="speed" className="mt-4">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-500" />Speed-to-Lead</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><Label>Enable Speed-to-Lead</Label><Switch checked={speedForm.is_enabled} onCheckedChange={v => setSpeedForm({ ...speedForm, is_enabled: v })} /></div>
              <div className="flex items-center justify-between"><Label>Auto-SMS New Leads</Label><Switch checked={speedForm.auto_sms_new_leads} onCheckedChange={v => setSpeedForm({ ...speedForm, auto_sms_new_leads: v })} /></div>
              <div className="flex items-center justify-between"><Label>Missed Call Text-Back</Label><Switch checked={speedForm.missed_call_auto_sms} onCheckedChange={v => setSpeedForm({ ...speedForm, missed_call_auto_sms: v })} /></div>
              <div><Label>Response Delay (seconds)</Label><Input type="number" value={speedForm.new_lead_delay_seconds} onChange={e => setSpeedForm({ ...speedForm, new_lead_delay_seconds: parseInt(e.target.value) || 30 })} className="w-32" /></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button onClick={saveSettings} disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save All Settings'}</Button>
    </div>
  );
}
