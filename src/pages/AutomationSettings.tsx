import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Clock, Shield, Mail, MessageSquare,
  Bell, Zap, RefreshCw, AlertTriangle, Settings2,
  CalendarClock, Timer, ShieldCheck, MailWarning,
  Loader2, Ban
} from 'lucide-react';
import SEO from '@/components/SEO';

interface AutomationSettingsData {
  // Sending limits
  email_hourly_limit: number;
  email_daily_limit: number;
  sms_hourly_limit: number;
  sms_daily_limit: number;

  // Quiet hours
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  quiet_hours_timezone: string;

  // Business hours
  business_hours_only: boolean;
  business_hours_start: string;
  business_hours_end: string;
  business_days: string[];

  // Compliance
  auto_unsubscribe_on_reply: boolean;
  stop_on_bounce: boolean;
  stop_on_complaint: boolean;
  include_unsubscribe_link: boolean;
  sms_stop_keywords: string[];

  // Retry settings
  retry_failed_actions: boolean;
  max_retries: number;
  retry_delay_minutes: number;

  // Notifications
  notify_on_failure: boolean;
  notify_on_completion: boolean;
  notification_email: string;
}

const defaultSettings: AutomationSettingsData = {
  email_hourly_limit: 100,
  email_daily_limit: 1000,
  sms_hourly_limit: 50,
  sms_daily_limit: 500,
  quiet_hours_enabled: true,
  quiet_hours_start: '21:00',
  quiet_hours_end: '08:00',
  quiet_hours_timezone: 'America/New_York',
  business_hours_only: false,
  business_hours_start: '09:00',
  business_hours_end: '17:00',
  business_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  auto_unsubscribe_on_reply: false,
  stop_on_bounce: true,
  stop_on_complaint: true,
  include_unsubscribe_link: true,
  sms_stop_keywords: ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'],
  retry_failed_actions: true,
  max_retries: 3,
  retry_delay_minutes: 30,
  notify_on_failure: true,
  notify_on_completion: false,
  notification_email: '',
};

export default function AutomationSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AutomationSettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setAccessDenied(false);
      const response = await api.get('/settings');
      const data = response.data as { settings?: Record<string, unknown> };
      if (data.settings?.automation_settings) {
        setSettings({ ...defaultSettings, ...(data.settings.automation_settings as Partial<AutomationSettingsData>) });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes('permission') || message.includes('(403)')) {
        setAccessDenied(true);
        return;
      }
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', { automation_settings: settings });
      toast({ title: 'Settings Saved', description: 'Automation settings have been updated' });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof AutomationSettingsData>(key: K, value: AutomationSettingsData[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const timezones = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Phoenix', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo',
    'Asia/Shanghai', 'Australia/Sydney',
  ];

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-3xl">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" /> Access Restricted
            </CardTitle>
            <CardDescription>You do not have permission to view or edit automation settings.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground mr-4">Ask an operations manager to grant access to settings.</p>
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO title="Automation Settings" description="Configure global settings for all automations and flows." />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-[18px] font-bold tracking-tight">Automation Settings</h1>
              <p className="text-sm text-muted-foreground">Global orchestration parameters for all workflow engines.</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="shadow-lg">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        <div className="space-y-8">
          {/* Sending Limits Section */}
          <section id="limits" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-base font-semibold">Throttle & Throughput</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email Velocity
                  </CardTitle>
                  <CardDescription>Frequency limits to maintain sender reputation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Hourly Limit</Label>
                      <Input
                        type="number"
                        value={settings.email_hourly_limit}
                        onChange={(e) => updateSetting('email_hourly_limit', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Daily Limit</Label>
                      <Input
                        type="number"
                        value={settings.email_daily_limit}
                        onChange={(e) => updateSetting('email_daily_limit', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> SMS Capacity
                  </CardTitle>
                  <CardDescription>Outgoing message limits per carrier standards.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Hourly Limit</Label>
                      <Input
                        type="number"
                        value={settings.sms_hourly_limit}
                        onChange={(e) => updateSetting('sms_hourly_limit', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Daily Limit</Label>
                      <Input
                        type="number"
                        value={settings.sms_daily_limit}
                        onChange={(e) => updateSetting('sms_daily_limit', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" /> Error Handling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto-Retry Exceptions</Label>
                    <p className="text-sm text-muted-foreground">Automatically attempt to re-run failed workflow steps.</p>
                  </div>
                  <Switch
                    checked={settings.retry_failed_actions}
                    onCheckedChange={(v) => updateSetting('retry_failed_actions', v)}
                  />
                </div>
                {settings.retry_failed_actions && (
                  <div className="pt-2 grid grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-muted-foreground uppercase">Retry Attempts</Label>
                      <Input
                        type="number"
                        value={settings.max_retries}
                        onChange={(e) => updateSetting('max_retries', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-muted-foreground uppercase">Backoff Delay (min)</Label>
                      <Input
                        type="number"
                        value={settings.retry_delay_minutes}
                        onChange={(e) => updateSetting('retry_delay_minutes', parseInt(e.target.value) || 5)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Timing Section */}
          <section id="timing" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <h3 className="text-base font-semibold">Timing & Scheduling</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Timer className="h-4 w-4" /> Quiet Hours
                  </CardTitle>
                  <CardDescription>Suppress outgoing triggers during non-disruptive times.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Active</Label>
                    <Switch
                      checked={settings.quiet_hours_enabled}
                      onCheckedChange={(v) => updateSetting('quiet_hours_enabled', v)}
                    />
                  </div>
                  {settings.quiet_hours_enabled && (
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px] uppercase text-muted-foreground font-bold">Start</Label>
                          <Input type="time" value={settings.quiet_hours_start} onChange={(e) => updateSetting('quiet_hours_start', e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-[10px] uppercase text-muted-foreground font-bold">End</Label>
                          <Input type="time" value={settings.quiet_hours_end} onChange={(e) => updateSetting('quiet_hours_end', e.target.value)} />
                        </div>
                      </div>
                      <Select value={settings.quiet_hours_timezone} onValueChange={(v) => updateSetting('quiet_hours_timezone', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {timezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" /> Operational Window
                  </CardTitle>
                  <CardDescription>Strictly adhere to business operating hours.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Restrict to Business Hours</Label>
                    <Switch
                      checked={settings.business_hours_only}
                      onCheckedChange={(v) => updateSetting('business_hours_only', v)}
                    />
                  </div>
                  {settings.business_hours_only && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div>
                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">Open</Label>
                        <Input type="time" value={settings.business_hours_start} onChange={(e) => updateSetting('business_hours_start', e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">Close</Label>
                        <Input type="time" value={settings.business_hours_end} onChange={(e) => updateSetting('business_hours_end', e.target.value)} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Compliance Section */}
          <section id="compliance" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <h3 className="text-base font-semibold">Regulatory Compliance</h3>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Anti-Spam Controls</CardTitle>
                <CardDescription>Global safety mechanisms for consumer protection.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {[
                    { key: 'include_unsubscribe_link', label: 'Global Unsubscribe Link', desc: 'Mandatory footer for all emails' },
                    { key: 'stop_on_bounce', label: 'Blacklist on Bounce', desc: 'Auto-remove invalid destinations' },
                    { key: 'stop_on_complaint', label: 'Blacklist on Complaint', desc: 'Auto-remove users marking spam' },
                    { key: 'auto_unsubscribe_on_reply', label: 'Keyword Unsubscribe', desc: 'Auto-process "unsub" replies' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-semibold">{item.label}</Label>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={(settings as any)[item.key]}
                        onCheckedChange={(v) => updateSetting(item.key as any, v)}
                      />
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Ban className="h-4 w-4 text-muted-foreground" />
                    <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">SMS Opt-Out Keywords</Label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {settings.sms_stop_keywords.map((keyword, i) => (
                      <Badge key={i} variant="secondary" className="px-3 py-1 font-mono">{keyword}</Badge>
                    ))}
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 italic">+ Edit List</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Notifications Section */}
          <section id="notifications" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Bell className="w-4 h-4 text-purple-500" />
              <h3 className="text-base font-semibold">Internal Notifications</h3>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Health & Status Alerts</CardTitle>
                <CardDescription>Monitor the operational health of your automations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Alert on Critical Failure</Label>
                        <p className="text-xs text-muted-foreground">Instant ping for stalled flows</p>
                      </div>
                      <Switch
                        checked={settings.notify_on_failure}
                        onCheckedChange={(v) => updateSetting('notify_on_failure', v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Alert on Flow Completion</Label>
                        <p className="text-xs text-muted-foreground">Weekly roll-up of successful runs</p>
                      </div>
                      <Switch
                        checked={settings.notify_on_completion}
                        onCheckedChange={(v) => updateSetting('notify_on_completion', v)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Operations Root Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        className="pl-9"
                        placeholder="ops@youragency.com"
                        value={settings.notification_email}
                        onChange={(e) => updateSetting('notification_email', e.target.value)}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">Central address for all automation-related system logs.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </>
  );
}

function Badge({ children, className, variant = "default" }: { children: React.ReactNode, className?: string, variant?: "default" | "secondary" }) {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  };
  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
