import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
    Globe, Code, Shield, Save, RefreshCw,
    Search, BarChart, Image as ImageIcon,
    CheckCircle2, AlertCircle
} from 'lucide-react';

export default function PublicAssetsSettings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [settings, setSettings] = useState({
        // Global SEO
        seo_title_template: '{{page_title}} | {{agency_name}}',
        seo_description_default: '',
        og_image_url: '',
        favicon_url: '',

        // Tracking & Scripts
        gtm_id: '',
        meta_pixel_id: '',
        google_analytics_id: '',
        header_scripts: '',
        footer_scripts: '',

        // Cookie Consent
        cookie_consent_enabled: false,
        cookie_consent_message: 'We use cookies to improve your experience on our site.',
        cookie_policy_url: '',
        primary_color: '#3B82F6',
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings/public-assets');
            if (response.data) {
                setSettings(prev => ({ ...prev, ...response.data }));
            }
        } catch (error) {
            console.error('Failed to load public asset settings:', error);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.post('/settings/public-assets', settings);
            toast({
                title: 'Settings saved',
                description: 'Global public asset configurations have been updated.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save settings. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Globe className="h-6 w-6 text-blue-500" />
                        Public Assets & SEO
                    </h2>
                    <p className="text-muted-foreground">
                        Manage global tracking scripts, SEO defaults, and compliance for all public-facing pages.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Global SEO */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5 text-primary" />
                            Global SEO defaults
                        </CardTitle>
                        <CardDescription>
                            Templates for meta tags that apply to proposals, booking pages, and forms.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Title Template</Label>
                            <Input
                                placeholder="{{page_title}} | My Agency"
                                value={settings.seo_title_template}
                                onChange={(e) => setSettings({ ...settings, seo_title_template: e.target.value })}
                            />
                            <p className="text-[10px] text-muted-foreground">Available variables: {'{{page_title}}'}, {'{{agency_name}}'}</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Default Meta Description</Label>
                            <Textarea
                                placeholder="High-performance business solutions..."
                                value={settings.seo_description_default}
                                onChange={(e) => setSettings({ ...settings, seo_description_default: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Default OpenGraph (Social) Image</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="https://example.com/og-image.jpg"
                                    value={settings.og_image_url}
                                    onChange={(e) => setSettings({ ...settings, og_image_url: e.target.value })}
                                />
                                <Button variant="outline" size="icon"><ImageIcon className="h-4 w-4" /></Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Recommended size: 1200x630px</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Tracking Codes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart className="h-5 w-5 text-primary" />
                            Tracking & Analytics
                        </CardTitle>
                        <CardDescription>
                            Integrate Google Tag Manager, Meta Pixel, and other tracking IDs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Google Tag Manager ID</Label>
                            <Input
                                placeholder="GTM-XXXXXXX"
                                value={settings.gtm_id}
                                onChange={(e) => setSettings({ ...settings, gtm_id: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Meta (Facebook) Pixel ID</Label>
                            <Input
                                placeholder="123456789012345"
                                value={settings.meta_pixel_id}
                                onChange={(e) => setSettings({ ...settings, meta_pixel_id: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Google Analytics (GA4) Measurement ID</Label>
                            <Input
                                placeholder="G-XXXXXXXXXX"
                                value={settings.google_analytics_id}
                                onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Custom Scripts */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Code className="h-5 w-5 text-primary" />
                            Custom Scripts
                        </CardTitle>
                        <CardDescription>
                            Inject custom HTML/JS into the header or footer of all public pages.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Header Scripts (Inside {'<head>'})</Label>
                            <Textarea
                                placeholder="<!-- Custom header script -->"
                                value={settings.header_scripts}
                                onChange={(e) => setSettings({ ...settings, header_scripts: e.target.value })}
                                className="font-mono text-xs"
                                rows={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Footer Scripts (Before {'</body>'})</Label>
                            <Textarea
                                placeholder="<!-- Custom footer script -->"
                                value={settings.footer_scripts}
                                onChange={(e) => setSettings({ ...settings, footer_scripts: e.target.value })}
                                className="font-mono text-xs"
                                rows={6}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Global Compliance */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Privacy & Compliance
                        </CardTitle>
                        <CardDescription>
                            Configure cookie consent banners and privacy policy links.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Enable Cookie Consent Banner</Label>
                                <p className="text-sm text-muted-foreground">Show a banner to users for GDPR/CCPA compliance.</p>
                            </div>
                            <Switch
                                checked={settings.cookie_consent_enabled}
                                onCheckedChange={(val) => setSettings({ ...settings, cookie_consent_enabled: val })}
                            />
                        </div>

                        {settings.cookie_consent_enabled && (
                            <div className="grid gap-6 md:grid-cols-2 pt-4 border-t">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Banner Message</Label>
                                        <Textarea
                                            value={settings.cookie_consent_message}
                                            onChange={(e) => setSettings({ ...settings, cookie_consent_message: e.target.value })}
                                            rows={3}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Privacy Policy URL</Label>
                                        <Input
                                            placeholder="https://youragency.com/privacy"
                                            value={settings.cookie_policy_url}
                                            onChange={(e) => setSettings({ ...settings, cookie_policy_url: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="p-6 border rounded-xl bg-muted/50 flex flex-col items-center justify-center text-center">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-4 tracking-wider">Preview</p>
                                    <div className="bg-white p-4 rounded-lg shadow-lg border border-primary/20 max-w-sm">
                                        <p className="text-xs mb-3">{settings.cookie_consent_message}</p>
                                        <div className="flex gap-2">
                                            <Button size="sm" className="h-8 text-[10px]" style={{ backgroundColor: settings.primary_color }}>Accept All</Button>
                                            <Button size="sm" variant="outline" className="h-8 text-[10px]">Decline</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
