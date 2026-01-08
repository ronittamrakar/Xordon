import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Globe, Lock, Code, Cookie } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export default function WebsiteSettings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [settings, setSettings] = useState({
        // Global Scripts
        headScripts: '',
        bodyScripts: '',
        footerScripts: '',

        // Cookie Consent
        enableCookieBanner: true,
        cookiePolicyUrl: '',
        forceConsent: false,

        // Domain & Security
        defaultDomain: '',
        forceHttps: true,
        enableHsts: false,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.settings.get('website');
                if (response.settings) {
                    setSettings(prev => ({ ...prev, ...response.settings }));
                }
            } catch (error) {
                console.error('Failed to load website settings:', error);
                toast({
                    title: 'Error loading settings',
                    description: 'Could not fetch website settings. Please try again.',
                    variant: 'destructive',
                });
            } finally {
                setInitialLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.settings.update('website', settings);
            toast({
                title: 'Website settings saved',
                description: 'Your global website configuration has been updated.',
            });
        } catch (error) {
            console.error('Failed to save website settings:', error);
            toast({
                title: 'Error saving settings',
                description: 'Please try again later.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Globe className="h-6 w-6 text-cyan-500" />
                        Website Settings
                    </h2>
                    <p className="text-muted-foreground">
                        Configure global analytics, cookie consent, and domain defaults.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? (
                        <>Saving...</>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Code className="h-5 w-5" />
                            Global Scripts
                        </CardTitle>
                        <CardDescription>Scripts that will be injected into all websites</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Global Head Scripts</Label>
                            <Textarea
                                placeholder="<script>...</script>"
                                className="font-mono text-sm"
                                rows={4}
                                value={settings.headScripts}
                                onChange={(e) => setSettings({ ...settings, headScripts: e.target.value })}
                            />
                            <p className="text-sm text-muted-foreground">Injected in the &lt;head&gt; section</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Global Body Scripts</Label>
                            <Textarea
                                placeholder="<script>...</script>"
                                className="font-mono text-sm"
                                rows={4}
                                value={settings.bodyScripts}
                                onChange={(e) => setSettings({ ...settings, bodyScripts: e.target.value })}
                            />
                            <p className="text-sm text-muted-foreground">Injected at the start of the &lt;body&gt; tag</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Global Footer Scripts</Label>
                            <Textarea
                                placeholder="<script>...</script>"
                                className="font-mono text-sm"
                                rows={4}
                                value={settings.footerScripts}
                                onChange={(e) => setSettings({ ...settings, footerScripts: e.target.value })}
                            />
                            <p className="text-sm text-muted-foreground">Injected before the closing &lt;/body&gt; tag</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Cookie className="h-5 w-5" />
                            Cookie Consent
                        </CardTitle>
                        <CardDescription>GDPR-compliant cookie consent banner</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Enable Cookie Consent Banner</Label>
                                <p className="text-sm text-muted-foreground">Show cookie consent on all websites</p>
                            </div>
                            <Switch
                                checked={settings.enableCookieBanner}
                                onCheckedChange={(v) => setSettings({ ...settings, enableCookieBanner: v })}
                            />
                        </div>
                        {settings.enableCookieBanner && (
                            <>
                                <div className="space-y-2">
                                    <Label>Cookie Policy URL</Label>
                                    <Input
                                        placeholder="https://example.com/privacy-policy"
                                        value={settings.cookiePolicyUrl}
                                        onChange={(e) => setSettings({ ...settings, cookiePolicyUrl: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Force Consent</Label>
                                        <p className="text-sm text-muted-foreground">Block scripts until consent is given</p>
                                    </div>
                                    <Switch
                                        checked={settings.forceConsent}
                                        onCheckedChange={(v) => setSettings({ ...settings, forceConsent: v })}
                                    />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Domain & Security
                        </CardTitle>
                        <CardDescription>Default domain and SSL settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Default Domain</Label>
                            <Input
                                placeholder="yourdomain.com"
                                value={settings.defaultDomain}
                                onChange={(e) => setSettings({ ...settings, defaultDomain: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Force HTTPS</Label>
                                <p className="text-sm text-muted-foreground">Redirect all traffic to HTTPS</p>
                            </div>
                            <Switch
                                checked={settings.forceHttps}
                                onCheckedChange={(v) => setSettings({ ...settings, forceHttps: v })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Enable HSTS</Label>
                                <p className="text-sm text-muted-foreground">Enable HTTP Strict Transport Security</p>
                            </div>
                            <Switch
                                checked={settings.enableHsts}
                                onCheckedChange={(v) => setSettings({ ...settings, enableHsts: v })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
