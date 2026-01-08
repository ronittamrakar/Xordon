import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Globe, Palette, TrendingUp, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LandingPageSettings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [settings, setSettings] = useState({
        defaultDomain: '',
        customDomain: '',
        enableAnalytics: true,
        trackPageViews: true,
        trackFormSubmissions: true,
        defaultTheme: 'light',
        brandColor: '#FF6B35',
        defaultFont: 'Inter',
        enableSocialSharing: true,
        defaultMetaDescription: '',
        faviconUrl: '',
        enableCookieConsent: false,
        cookieConsentMessage: 'This website uses cookies to ensure you get the best experience.',
        enableGoogleAnalytics: false,
        googleAnalyticsId: '',
        enableFacebookPixel: false,
        facebookPixelId: '',
        defaultThankYouPage: 'message', // 'message' | 'redirect' | 'custom'
        thankYouMessage: 'Thank you for your submission!',
        thankYouRedirectUrl: ''
    });

    const handleSave = async () => {
        setLoading(true);
        try {
            // Mock save for now, similar to how UnifiedSettings likely did it (it was just local state in the previous file!)
            // In a real app we'd call api.settings.update('landing-pages', settings)
            await new Promise(resolve => setTimeout(resolve, 800));
            toast({
                title: 'Settings saved',
                description: 'Landing page settings have been updated.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save settings.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Landing Pages</h2>
                    <p className="text-sm text-muted-foreground">Configure your landing page domains and publishing settings</p>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-blue-500" />
                        Domain & Publishing
                    </CardTitle>
                    <CardDescription>Configure your landing page domains and publishing settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="lpDefaultDomain">Default Domain</Label>
                            <Input
                                id="lpDefaultDomain"
                                placeholder="pages.yourcompany.com"
                                value={settings.defaultDomain}
                                onChange={e => setSettings(prev => ({ ...prev, defaultDomain: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground">
                                Your default subdomain for published landing pages
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lpCustomDomain">Custom Domain</Label>
                            <Input
                                id="lpCustomDomain"
                                placeholder="landing.yourcompany.com"
                                value={settings.customDomain}
                                onChange={e => setSettings(prev => ({ ...prev, customDomain: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground">
                                Optional custom domain (requires DNS configuration)
                            </p>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <Label className="text-base font-medium">SEO & Meta</Label>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="lpMetaDescription">Default Meta Description</Label>
                                <Textarea
                                    id="lpMetaDescription"
                                    placeholder="A brief description of your landing pages for search engines..."
                                    value={settings.defaultMetaDescription}
                                    onChange={e => setSettings(prev => ({ ...prev, defaultMetaDescription: e.target.value }))}
                                    rows={2}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lpFavicon">Favicon URL</Label>
                                <Input
                                    id="lpFavicon"
                                    placeholder="https://yourcompany.com/favicon.ico"
                                    value={settings.faviconUrl}
                                    onChange={e => setSettings(prev => ({ ...prev, faviconUrl: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-purple-500" />
                        Branding & Appearance
                    </CardTitle>
                    <CardDescription>Set default styling for your landing pages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="lpBrandColor">Brand Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="lpBrandColor"
                                    type="color"
                                    value={settings.brandColor}
                                    onChange={e => setSettings(prev => ({ ...prev, brandColor: e.target.value }))}
                                    className="w-14 h-10 p-1"
                                />
                                <Input
                                    value={settings.brandColor}
                                    onChange={e => setSettings(prev => ({ ...prev, brandColor: e.target.value }))}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lpDefaultTheme">Default Theme</Label>
                            <Select
                                value={settings.defaultTheme}
                                onValueChange={v => setSettings(prev => ({ ...prev, defaultTheme: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="auto">Auto (System)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lpDefaultFont">Default Font</Label>
                            <Select
                                value={settings.defaultFont}
                                onValueChange={v => setSettings(prev => ({ ...prev, defaultFont: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Inter">Inter</SelectItem>
                                    <SelectItem value="Roboto">Roboto</SelectItem>
                                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                                    <SelectItem value="Lato">Lato</SelectItem>
                                    <SelectItem value="Poppins">Poppins</SelectItem>
                                    <SelectItem value="Montserrat">Montserrat</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Enable Social Sharing</Label>
                            <p className="text-sm text-muted-foreground">
                                Show social sharing buttons on landing pages
                            </p>
                        </div>
                        <Switch
                            checked={settings.enableSocialSharing}
                            onCheckedChange={v => setSettings(prev => ({ ...prev, enableSocialSharing: v }))}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        Analytics & Tracking
                    </CardTitle>
                    <CardDescription>Configure analytics and tracking for your landing pages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Enable Built-in Analytics</Label>
                                <p className="text-sm text-muted-foreground">
                                    Track page views, conversions, and visitor behavior
                                </p>
                            </div>
                            <Switch
                                checked={settings.enableAnalytics}
                                onCheckedChange={v => setSettings(prev => ({ ...prev, enableAnalytics: v }))}
                            />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Google Analytics</Label>
                                <p className="text-sm text-muted-foreground">
                                    Connect Google Analytics for detailed insights
                                </p>
                            </div>
                            <Switch
                                checked={settings.enableGoogleAnalytics}
                                onCheckedChange={v => setSettings(prev => ({ ...prev, enableGoogleAnalytics: v }))}
                            />
                        </div>

                        {settings.enableGoogleAnalytics && (
                            <div className="space-y-2 ml-4">
                                <Label htmlFor="lpGaId">Google Analytics ID</Label>
                                <Input
                                    id="lpGaId"
                                    placeholder="G-XXXXXXXXXX or UA-XXXXXXXX-X"
                                    value={settings.googleAnalyticsId}
                                    onChange={e => setSettings(prev => ({ ...prev, googleAnalyticsId: e.target.value }))}
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Facebook Pixel</Label>
                                <p className="text-sm text-muted-foreground">
                                    Track conversions for Facebook Ads
                                </p>
                            </div>
                            <Switch
                                checked={settings.enableFacebookPixel}
                                onCheckedChange={v => setSettings(prev => ({ ...prev, enableFacebookPixel: v }))}
                            />
                        </div>

                        {settings.enableFacebookPixel && (
                            <div className="space-y-2 ml-4">
                                <Label htmlFor="lpFbPixel">Facebook Pixel ID</Label>
                                <Input
                                    id="lpFbPixel"
                                    placeholder="123456789012345"
                                    value={settings.facebookPixelId}
                                    onChange={e => setSettings(prev => ({ ...prev, facebookPixelId: e.target.value }))}
                                />
                            </div>
                        )}

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Cookie Consent Banner</Label>
                                <p className="text-sm text-muted-foreground">
                                    Show a cookie consent banner to visitors
                                </p>
                            </div>
                            <Switch
                                checked={settings.enableCookieConsent}
                                onCheckedChange={v => setSettings(prev => ({ ...prev, enableCookieConsent: v }))}
                            />
                        </div>

                        {settings.enableCookieConsent && (
                            <div className="space-y-2 ml-4">
                                <Label htmlFor="lpCookieMsg">Consent Message</Label>
                                <Input
                                    id="lpCookieMsg"
                                    value={settings.cookieConsentMessage}
                                    onChange={e => setSettings(prev => ({ ...prev, cookieConsentMessage: e.target.value }))}
                                />
                            </div>
                        )}

                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
