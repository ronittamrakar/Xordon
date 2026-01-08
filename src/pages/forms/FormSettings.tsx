import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webformsApi, WebFormsUserSettings } from '@/services/webformsApi';
import { api } from '@/lib/api';
import {
    Settings,
    Globe,
    Bell,
    Shield,
    Palette,
    Code,
    Save,
    Download,
    Loader2,
    Mail,
    Lock,
    FileText,
    Database,
    Wrench,
    LayoutPanelTop,
    ShieldAlert
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

const DEFAULT_WEBFORMS_SETTINGS: WebFormsUserSettings = {
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

const DEFAULT_MAIN_FORM_SETTINGS = {
    enableNotifications: true,
    notificationEmail: '',
    autoReplyEnabled: true,
    autoReplySubject: 'Thank you for your submission',
    autoReplyMessage: 'Thank you for your submission. We will get back to you soon.',
    enableSpamProtection: true,
    spamKeywords: 'spam, viagra, casino',
    enableFileUploads: false,
    maxFileSize: 10,
    allowedFileTypes: 'pdf,doc,docx,jpg,png'
};

export default function FormSettings() {
    const queryClient = useQueryClient();

    // Fetch settings from Webforms API
    const { data: webformsData, isLoading: isLoadingWebforms } = useQuery({
        queryKey: ['webforms', 'settings'],
        queryFn: () => webformsApi.getUserSettings(),
    });

    // Fetch settings from Main API
    const { data: mainFormData, isLoading: isLoadingMain } = useQuery({
        queryKey: ['main', 'form-settings'],
        queryFn: () => api.getFormSettings(),
    });

    // Local state
    const [webSettings, setWebSettings] = useState<WebFormsUserSettings>(DEFAULT_WEBFORMS_SETTINGS);
    const [mainSettings, setMainSettings] = useState(DEFAULT_MAIN_FORM_SETTINGS);

    // Sync state
    useEffect(() => {
        if (webformsData?.data) {
            setWebSettings({ ...DEFAULT_WEBFORMS_SETTINGS, ...webformsData.data });
        }
    }, [webformsData]);

    useEffect(() => {
        if (mainFormData) {
            setMainSettings({ ...DEFAULT_MAIN_FORM_SETTINGS, ...mainFormData });
        }
    }, [mainFormData]);

    // Mutations
    const saveWebMutation = useMutation({
        mutationFn: (newSettings: Partial<WebFormsUserSettings>) =>
            webformsApi.updateUserSettings(newSettings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webforms', 'settings'] });
        },
    });

    const saveMainMutation = useMutation({
        mutationFn: (newSettings: any) =>
            api.updateFormSettings(newSettings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['main', 'form-settings'] });
        },
    });

    const handleSaveAll = async () => {
        try {
            await Promise.all([
                saveWebMutation.mutateAsync(webSettings),
                saveMainMutation.mutateAsync(mainSettings)
            ]);
            toast.success('Form settings saved successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to save settings');
        }
    };

    const updateWebSetting = (key: keyof WebFormsUserSettings, value: any) => {
        setWebSettings(prev => ({ ...prev, [key]: value }));
    };

    const updateWebNestedSetting = (
        parentKey: 'form_defaults' | 'notification_preferences' | 'privacy_settings' | 'branding',
        childKey: string,
        value: any
    ) => {
        setWebSettings((prev: any) => ({
            ...prev,
            [parentKey]: {
                ...(prev[parentKey] || {}),
                [childKey]: value,
            },
        }));
    };

    const updateMainSetting = (key: keyof typeof DEFAULT_MAIN_FORM_SETTINGS, value: any) => {
        setMainSettings(prev => ({ ...prev, [key]: value }));
    };

    if (isLoadingWebforms || isLoadingMain) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            <SEO title="Form Settings" description="Manage global configuration for all web forms and submissions." />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[18px] font-bold tracking-tight">Form Settings</h1>
                        <p className="text-sm text-muted-foreground">Manage global configuration for all web forms and submissions</p>
                    </div>
                    <Button onClick={handleSaveAll} disabled={saveWebMutation.isPending || saveMainMutation.isPending}>
                        {saveWebMutation.isPending || saveMainMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        {saveWebMutation.isPending || saveMainMutation.isPending ? 'Saving...' : 'Save All Changes'}
                    </Button>
                </div>

                <div className="space-y-8">
                    {/* General Section */}
                    <section id="general" className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <Settings className="w-4 h-4 text-blue-500" />
                            <h3 className="text-base font-semibold">General Configuration</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Globe className="h-4 w-4" /> Workspace Preferences
                                    </CardTitle>
                                    <CardDescription>Default environment for your form builder.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Language & Localisation</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Select value={webSettings.language} onValueChange={(v) => updateWebSetting('language', v)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Language" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="en">English (US)</SelectItem>
                                                    <SelectItem value="es">Spanish</SelectItem>
                                                    <SelectItem value="fr">French</SelectItem>
                                                    <SelectItem value="de">German</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select value={webSettings.timezone} onValueChange={(v) => updateWebSetting('timezone', v)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Timezone" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="UTC">UTC (Standard)</SelectItem>
                                                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                                    <SelectItem value="Asia/Tokyo">Tokyo (+9)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Application Theme</Label>
                                            <p className="text-xs text-muted-foreground">Override system theme</p>
                                        </div>
                                        <Select value={webSettings.theme} onValueChange={(v: any) => updateWebSetting('theme', v)}>
                                            <SelectTrigger className="w-[100px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="auto">Auto</SelectItem>
                                                <SelectItem value="light">Light</SelectItem>
                                                <SelectItem value="dark">Dark</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> Form Engine Defaults
                                    </CardTitle>
                                    <CardDescription>Internal behavior for submission handling.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Compact Interface</Label>
                                            <p className="text-xs text-muted-foreground">High-density data view</p>
                                        </div>
                                        <Switch
                                            checked={webSettings.compact_mode}
                                            onCheckedChange={(v) => updateWebSetting('compact_mode', v)}
                                        />
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>File Uploads</Label>
                                            <p className="text-xs text-muted-foreground">Allow binary submission data</p>
                                        </div>
                                        <Switch
                                            checked={mainSettings.enableFileUploads}
                                            onCheckedChange={(v) => updateMainSetting('enableFileUploads', v)}
                                        />
                                    </div>
                                    {mainSettings.enableFileUploads && (
                                        <div className="pt-2 grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Max (MB)</span>
                                                <Input
                                                    type="number"
                                                    value={mainSettings.maxFileSize}
                                                    onChange={(e) => updateMainSetting('maxFileSize', parseInt(e.target.value) || 10)}
                                                    className="h-8"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Extensions</span>
                                                <Input
                                                    value={mainSettings.allowedFileTypes}
                                                    onChange={(e) => updateMainSetting('allowedFileTypes', e.target.value)}
                                                    className="h-8 font-mono text-[10px]"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Communication Section */}
                    <section id="communication" className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <Bell className="w-4 h-4 text-orange-500" />
                            <h3 className="text-base font-semibold">Alerts & Messaging</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Bell className="h-4 w-4" /> Notifications
                                    </CardTitle>
                                    <CardDescription>Stay updated on every submission.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Master Toggle</Label>
                                            <p className="text-xs text-muted-foreground">Receive email for new leads</p>
                                        </div>
                                        <Switch
                                            checked={mainSettings.enableNotifications}
                                            onCheckedChange={(v) => updateMainSetting('enableNotifications', v)}
                                        />
                                    </div>
                                    {mainSettings.enableNotifications && (
                                        <div className="pt-2 space-y-2">
                                            <Label>Destination Address</Label>
                                            <Input
                                                placeholder="leads@xordon.com"
                                                value={mainSettings.notificationEmail}
                                                onChange={(e) => updateMainSetting('notificationEmail', e.target.value)}
                                            />
                                        </div>
                                    )}
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-y-3">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={webSettings.notification_preferences?.instant_notifications ?? true}
                                                onCheckedChange={(v) => updateWebNestedSetting('notification_preferences', 'instant_notifications', v)}
                                                className="scale-75"
                                            />
                                            <span className="text-xs">Instant Alerts</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={webSettings.notification_preferences?.daily_digest ?? false}
                                                onCheckedChange={(v) => updateWebNestedSetting('notification_preferences', 'daily_digest', v)}
                                                className="scale-75"
                                            />
                                            <span className="text-xs">Daily Digest</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={webSettings.notification_preferences?.webhook_failures ?? true}
                                                onCheckedChange={(v) => updateWebNestedSetting('notification_preferences', 'webhook_failures', v)}
                                                className="scale-75"
                                            />
                                            <span className="text-xs">Webhook Errors</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Mail className="h-4 w-4" /> Auto-Reply Emails
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Automated Feedback</Label>
                                            <p className="text-xs text-muted-foreground">Send receipt to respondent</p>
                                        </div>
                                        <Switch
                                            checked={mainSettings.autoReplyEnabled}
                                            onCheckedChange={(v) => updateMainSetting('autoReplyEnabled', v)}
                                        />
                                    </div>
                                    {mainSettings.autoReplyEnabled && (
                                        <div className="space-y-3 pt-2">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Email Subject</Label>
                                                <Input
                                                    value={mainSettings.autoReplySubject}
                                                    onChange={(e) => updateMainSetting('autoReplySubject', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Body Template</Label>
                                                <Textarea
                                                    rows={4}
                                                    value={mainSettings.autoReplyMessage}
                                                    onChange={(e) => updateMainSetting('autoReplyMessage', e.target.value)}
                                                    className="text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Security & Compliance Section */}
                    <section id="security" className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <Shield className="w-4 h-4 text-red-500" />
                            <h3 className="text-base font-semibold">Security & Compliance</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Anti-Spam Shield</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Keyword Filtering</Label>
                                            <p className="text-xs text-muted-foreground">Block specific terminology</p>
                                        </div>
                                        <Switch
                                            checked={mainSettings.enableSpamProtection}
                                            onCheckedChange={(v) => updateMainSetting('enableSpamProtection', v)}
                                        />
                                    </div>
                                    {mainSettings.enableSpamProtection && (
                                        <div className="space-y-2">
                                            <Label className="text-xs">Blacklisted Terms</Label>
                                            <Textarea
                                                placeholder="viagra, casino, crypto..."
                                                value={mainSettings.spamKeywords}
                                                onChange={(e) => updateMainSetting('spamKeywords', e.target.value)}
                                                className="h-20"
                                            />
                                        </div>
                                    )}
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Mandatory CAPTCHA</Label>
                                            <p className="text-xs text-muted-foreground">Require for all forms</p>
                                        </div>
                                        <Switch
                                            checked={webSettings.form_defaults?.require_captcha ?? false}
                                            onCheckedChange={(v) => updateWebNestedSetting('form_defaults', 'require_captcha', v)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Privacy & Retention</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>IP Anonymization</Label>
                                            <p className="text-xs text-muted-foreground">GDPR/CCPA compliance</p>
                                        </div>
                                        <Switch
                                            checked={webSettings.privacy_settings?.anonymize_ip ?? false}
                                            onCheckedChange={(v) => updateWebNestedSetting('privacy_settings', 'anonymize_ip', v)}
                                        />
                                    </div>
                                    <Separator />
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Global Rate Limit</Label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    value={webSettings.form_defaults?.max_submissions_per_day ?? 1000}
                                                    onChange={(e) => updateWebNestedSetting('form_defaults', 'max_submissions_per_day', parseInt(e.target.value) || 1000)}
                                                    className="w-24"
                                                />
                                                <span className="text-xs text-muted-foreground">Entries / 24hrs</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Data Retention Policy</Label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    value={webSettings.privacy_settings?.data_retention_days ?? 365}
                                                    onChange={(e) => updateWebNestedSetting('privacy_settings', 'data_retention_days', parseInt(e.target.value) || 365)}
                                                    className="w-24"
                                                />
                                                <span className="text-xs text-muted-foreground">Days until deletion</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Branding Section */}
                    <section id="branding" className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <Palette className="w-4 h-4 text-pink-500" />
                            <h3 className="text-base font-semibold">Branding Defaults</h3>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Global Form Styling</CardTitle>
                                <CardDescription>These styles apply to all newly created forms by default.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label>Primary Identity Color</Label>
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    type="color"
                                                    value={webSettings.branding?.brand_color ?? '#6366f1'}
                                                    onChange={(e) => updateWebNestedSetting('branding', 'brand_color', e.target.value)}
                                                    className="w-12 h-10 p-1 cursor-pointer rounded-lg"
                                                />
                                                <Input
                                                    value={webSettings.branding?.brand_color ?? '#6366f1'}
                                                    onChange={(e) => updateWebNestedSetting('branding', 'brand_color', e.target.value)}
                                                    className="font-mono text-sm uppercase"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Global Logo Resource (URL)</Label>
                                            <Input
                                                placeholder="https://cdn.xordon.com/logo.png"
                                                value={webSettings.branding?.logo_url ?? ''}
                                                onChange={(e) => updateWebNestedSetting('branding', 'logo_url', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Global Override CSS</Label>
                                        <Textarea
                                            placeholder="/* Custom CSS applied to all forms */"
                                            rows={6}
                                            value={webSettings.branding?.custom_css ?? ''}
                                            onChange={(e) => updateWebNestedSetting('branding', 'custom_css', e.target.value)}
                                            className="font-mono text-[11px] bg-muted/20"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Advanced Section */}
                    <section id="advanced" className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <Code className="w-4 h-4 text-slate-500" />
                            <h3 className="text-base font-semibold">Integrations & Data</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Wrench className="h-4 w-4" /> Developer Interface
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-muted/10 border rounded-xl hover:bg-muted/20 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 group-hover:bg-blue-500/20">
                                                <Code className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">Webhook Engine</p>
                                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Event-driven Lead Routing</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-7 text-[10px]">&gt;</Button>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-muted/10 border rounded-xl hover:bg-muted/20 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600 group-hover:bg-indigo-500/20">
                                                <Database className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">API Access Tokens</p>
                                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Direct Server Connection</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-7 text-[10px]">&gt;</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Download className="h-4 w-4" /> Portability
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button variant="outline" className="w-full justify-start h-12 bg-background/50 border-dashed">
                                        <Download className="h-4 w-4 mr-3 text-muted-foreground" />
                                        <div className="text-left">
                                            <p className="text-sm font-bold">Mass Workspace Export</p>
                                            <p className="text-[10px] text-muted-foreground">Download all responses (CSV/JSON)</p>
                                        </div>
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start h-12 border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive">
                                        <ShieldAlert className="h-4 w-4 mr-3" />
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-destructive">Wipe Workspace Data</p>
                                            <p className="text-[10px] text-destructive/60 uppercase font-black">Permanent Deletion</p>
                                        </div>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
