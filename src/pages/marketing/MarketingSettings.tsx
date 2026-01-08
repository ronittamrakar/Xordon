import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, TrendingUp, Globe, MessageCircle, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { api } from '@/lib/api';

export default function MarketingSettings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [settings, setSettings] = useState({
        // Social Media
        defaultSocialAccount: '',
        autoPostToSocial: false,
        socialScheduleBuffer: 15,

        // SEO
        defaultMetaTitle: '',
        defaultMetaDescription: '',
        enableSEOTracking: true,

        // Ads
        defaultAdAccount: '',
        enableConversionTracking: true,

        // Affiliates
        defaultCommissionRate: 10,
        enableAffiliateProgram: false,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.settings.get('marketing');
                console.log('Marketing settings response:', response);
                if (response.data?.settings) {
                    setSettings(prev => ({ ...prev, ...response.data.settings }));
                }
            } catch (error) {
                console.error('Failed to load marketing settings:', error);
                // Don't show error toast on 404/empty, just use defaults
            } finally {
                setInitialLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.settings.update('marketing', settings);
            toast({
                title: 'Marketing settings saved',
                description: 'Your marketing preferences have been updated successfully.',
            });
        } catch (error) {
            console.error('Failed to save marketing settings:', error);
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
                        <TrendingUp className="h-6 w-6 text-purple-500" />
                        Marketing Settings
                    </h2>
                    <p className="text-muted-foreground">
                        Configure global marketing preferences for social media, SEO, ads, and affiliates.
                    </p>
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

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            Social Media
                        </CardTitle>
                        <CardDescription>Default settings for social media management</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Default Social Account</Label>
                            <Input
                                placeholder="@yourbrand"
                                value={settings.defaultSocialAccount}
                                onChange={(e) => setSettings({ ...settings, defaultSocialAccount: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Auto-Post to Social</Label>
                                <p className="text-sm text-muted-foreground">Automatically publish scheduled posts</p>
                            </div>
                            <Switch
                                checked={settings.autoPostToSocial}
                                onCheckedChange={(v) => setSettings({ ...settings, autoPostToSocial: v })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Schedule Buffer (minutes)</Label>
                            <Input
                                type="number"
                                min="0"
                                value={settings.socialScheduleBuffer}
                                onChange={(e) => setSettings({ ...settings, socialScheduleBuffer: parseInt(e.target.value) })}
                            />
                            <p className="text-sm text-muted-foreground">Time buffer between scheduled posts</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            SEO Defaults
                        </CardTitle>
                        <CardDescription>Default meta tags and SEO settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Default Meta Title Template</Label>
                            <Input
                                placeholder="{{page_title}} | Your Brand"
                                value={settings.defaultMetaTitle}
                                onChange={(e) => setSettings({ ...settings, defaultMetaTitle: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Default Meta Description</Label>
                            <Input
                                placeholder="Your default meta description..."
                                value={settings.defaultMetaDescription}
                                onChange={(e) => setSettings({ ...settings, defaultMetaDescription: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Enable SEO Tracking</Label>
                                <p className="text-sm text-muted-foreground">Track keyword rankings and competitor analysis</p>
                            </div>
                            <Switch
                                checked={settings.enableSEOTracking}
                                onCheckedChange={(v) => setSettings({ ...settings, enableSEOTracking: v })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Advertising & Affiliates
                        </CardTitle>
                        <CardDescription>Ad account and affiliate program settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Default Ad Account ID</Label>
                            <Input
                                placeholder="Enter your ad account ID"
                                value={settings.defaultAdAccount}
                                onChange={(e) => setSettings({ ...settings, defaultAdAccount: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Conversion Tracking</Label>
                                <p className="text-sm text-muted-foreground">Enable conversion pixel tracking</p>
                            </div>
                            <Switch
                                checked={settings.enableConversionTracking}
                                onCheckedChange={(v) => setSettings({ ...settings, enableConversionTracking: v })}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Affiliate Program</Label>
                                <p className="text-sm text-muted-foreground">Enable affiliate partner tracking</p>
                            </div>
                            <Switch
                                checked={settings.enableAffiliateProgram}
                                onCheckedChange={(v) => setSettings({ ...settings, enableAffiliateProgram: v })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Default Commission Rate (%)</Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={settings.defaultCommissionRate}
                                onChange={(e) => setSettings({ ...settings, defaultCommissionRate: parseFloat(e.target.value) })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
