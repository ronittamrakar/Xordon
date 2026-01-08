import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webformsApi, WebFormsUserSettings } from '@/services/webformsApi';
import {
  Settings,
  Globe,
  Bell,
  Shield,
  Palette,
  Code,
  Users,
  CreditCard,
  Save,
  Download,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const DEFAULT_SETTINGS: WebFormsUserSettings = {
  email_notifications: true,
  compact_mode: false,
  language: 'en',
  timezone: 'UTC',
  theme: 'auto',
  form_defaults: {
    default_status: 'draft',
    require_captcha: false,
    max_submissions_per_day: 1000,
    data_retention_days: 365,
  },
  notification_preferences: {
    instant_notifications: true,
    daily_digest: false,
    weekly_digest: false,
    webhook_failures: true,
    export_failures: true,
  },
  privacy_settings: {
    enable_geoip: true,
    anonymize_ip: false,
    data_retention_days: 365,
  },
  branding: {
    brand_color: '#6366f1',
    logo_url: '',
    custom_css: '',
  },
};

export default function WebFormsSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch settings from API
  const { data: settingsData, isLoading, error } = useQuery({
    queryKey: ['webforms', 'settings'],
    queryFn: () => webformsApi.getUserSettings(),
  });

  // Local state initialized from fetched settings
  const [settings, setSettings] = useState<WebFormsUserSettings>(DEFAULT_SETTINGS);

  // Update local state when data is fetched
  useEffect(() => {
    if (settingsData?.data) {
      setSettings({ ...DEFAULT_SETTINGS, ...settingsData.data });
    }
  }, [settingsData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (newSettings: Partial<WebFormsUserSettings>) =>
      webformsApi.updateUserSettings(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webforms', 'settings'] });
      toast.success('Settings saved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save settings');
    },
  });

  // Export data mutation
  const exportMutation = useMutation({
    mutationFn: () => webformsApi.exportUserData(),
    onSuccess: (response) => {
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `webforms-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to export data');
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const updateSetting = <K extends keyof WebFormsUserSettings>(
    key: K,
    value: WebFormsUserSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateNestedSetting = (
    parentKey: 'form_defaults' | 'notification_preferences' | 'privacy_settings' | 'branding',
    childKey: string,
    value: unknown
  ) => {
    setSettings((prev) => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] || {}),
        [childKey]: value,
      },
    }));
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
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground">Manage your Webforms workspace settings</p>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Code className="h-4 w-4" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Advanced</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure your workspace preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="language">Default Language</Label>
                <Select value={settings.language} onValueChange={(v) => updateSetting('language', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={settings.timezone} onValueChange={(v) => updateSetting('timezone', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={settings.theme} onValueChange={(v: 'light' | 'dark' | 'auto') => updateSetting('theme', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use a denser layout for smaller screens
                  </p>
                </div>
                <Switch
                  checked={settings.compact_mode}
                  onCheckedChange={(v) => updateSetting('compact_mode', v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={(v) => updateSetting('email_notifications', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Instant Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified immediately for new submissions
                  </p>
                </div>
                <Switch
                  checked={settings.notification_preferences?.instant_notifications ?? true}
                  onCheckedChange={(v) => updateNestedSetting('notification_preferences', 'instant_notifications', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Daily Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a daily summary of form activity
                  </p>
                </div>
                <Switch
                  checked={settings.notification_preferences?.daily_digest ?? false}
                  onCheckedChange={(v) => updateNestedSetting('notification_preferences', 'daily_digest', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly summary of form activity
                  </p>
                </div>
                <Switch
                  checked={settings.notification_preferences?.weekly_digest ?? false}
                  onCheckedChange={(v) => updateNestedSetting('notification_preferences', 'weekly_digest', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Webhook Failure Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when webhooks fail
                  </p>
                </div>
                <Switch
                  checked={settings.notification_preferences?.webhook_failures ?? true}
                  onCheckedChange={(v) => updateNestedSetting('notification_preferences', 'webhook_failures', v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Form Defaults & Security</CardTitle>
              <CardDescription>Configure default settings for new forms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Default Form Status</Label>
                <Select
                  value={settings.form_defaults?.default_status ?? 'draft'}
                  onValueChange={(v: 'draft' | 'published') => updateNestedSetting('form_defaults', 'default_status', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Require CAPTCHA by Default</Label>
                  <p className="text-sm text-muted-foreground">
                    Add spam protection to new forms
                  </p>
                </div>
                <Switch
                  checked={settings.form_defaults?.require_captcha ?? false}
                  onCheckedChange={(v) => updateNestedSetting('form_defaults', 'require_captcha', v)}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Submissions Per Day</Label>
                <Input
                  type="number"
                  min="1"
                  max="10000"
                  value={settings.form_defaults?.max_submissions_per_day ?? 1000}
                  onChange={(e) => updateNestedSetting('form_defaults', 'max_submissions_per_day', parseInt(e.target.value) || 1000)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>GeoIP Location Tracking</Label>
                  <p className="text-sm text-muted-foreground">
                    Collect geographic location data from submissions
                  </p>
                </div>
                <Switch
                  checked={settings.privacy_settings?.enable_geoip ?? true}
                  onCheckedChange={(v) => updateNestedSetting('privacy_settings', 'enable_geoip', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Anonymize IP Addresses</Label>
                  <p className="text-sm text-muted-foreground">
                    Remove last octet from IP addresses for privacy
                  </p>
                </div>
                <Switch
                  checked={settings.privacy_settings?.anonymize_ip ?? false}
                  onCheckedChange={(v) => updateNestedSetting('privacy_settings', 'anonymize_ip', v)}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Retention (days)</Label>
                <Select
                  value={String(settings.privacy_settings?.data_retention_days ?? 365)}
                  onValueChange={(v) => updateNestedSetting('privacy_settings', 'data_retention_days', parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="730">2 years</SelectItem>
                    <SelectItem value="0">Forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding Settings</CardTitle>
              <CardDescription>Customize the look and feel of your forms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="brand-color">Brand Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="brand-color"
                    type="color"
                    value={settings.branding?.brand_color ?? '#6366f1'}
                    onChange={(e) => updateNestedSetting('branding', 'brand_color', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={settings.branding?.brand_color ?? '#6366f1'}
                    onChange={(e) => updateNestedSetting('branding', 'brand_color', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo-url">Logo URL</Label>
                <Input
                  id="logo-url"
                  placeholder="https://example.com/logo.png"
                  value={settings.branding?.logo_url ?? ''}
                  onChange={(e) => updateNestedSetting('branding', 'logo_url', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-css">Custom CSS</Label>
                <Textarea
                  id="custom-css"
                  placeholder="/* Add custom CSS here */"
                  value={settings.branding?.custom_css ?? ''}
                  onChange={(e) => updateNestedSetting('branding', 'custom_css', e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  For advanced branding options including typography, layout, and color presets,
                  visit the global Brand Kit settings.
                </p>
                <Button variant="outline" asChild>
                  <Link to="/settings">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Global Settings
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>Connect your forms with external services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Webhooks</p>
                      <p className="text-sm text-muted-foreground">
                        Send form data to external URLs
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" asChild>
                    <Link to="/forms/webhooks">Configure</Link>
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">CRM Integration</p>
                      <p className="text-sm text-muted-foreground">
                        Sync submissions with your CRM
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" asChild>
                    <Link to="/crm">Configure</Link>
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Payment Integration</p>
                      <p className="text-sm text-muted-foreground">
                        Accept payments through forms
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data & Export */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Export your data and manage your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Export All Data</p>
                  <p className="text-sm text-muted-foreground">
                    Download all your forms, submissions, and settings as JSON
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => exportMutation.mutate()}
                  disabled={exportMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exportMutation.isPending ? 'Exporting...' : 'Export'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Access additional form management tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <ExternalLink className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium">Custom Domains</p>
                      <p className="text-sm text-muted-foreground">
                        Manage custom domains for your forms
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" asChild>
                    <Link to="/forms/domains">Manage</Link>
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium">User Management</p>
                      <p className="text-sm text-muted-foreground">
                        Manage form access and permissions
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" asChild>
                    <Link to="/forms/users">Manage</Link>
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <ExternalLink className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium">Archived Forms</p>
                      <p className="text-sm text-muted-foreground">
                        View and restore archived forms
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" asChild>
                    <Link to="/forms/archive">View</Link>
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <ExternalLink className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">Trash</p>
                      <p className="text-sm text-muted-foreground">
                        Recover or permanently delete forms
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" asChild>
                    <Link to="/forms/trash">View</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
