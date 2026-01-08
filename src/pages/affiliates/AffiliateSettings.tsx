import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Save, Percent, DollarSign, Calendar } from 'lucide-react';

const AffiliateSettings = () => {
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        defaultCommissionRate: 10,
        commissionType: 'percentage', // 'percentage' | 'fixed'
        payoutThreshold: 100,
        payoutFrequency: 'monthly', // 'weekly' | 'monthly' | 'quarterly'
        cookieDuration: 30, // days
        enableAutoApproval: false,
        enableRecurringCommissions: true,
        tierEnabled: false,
        tier1Rate: 10,
        tier2Rate: 15,
        tier3Rate: 20,
        tier2Threshold: 1000,
        tier3Threshold: 5000,
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await api.getSettings();
            if (data?.affiliate) {
                setSettings(prev => ({ ...prev, ...data.affiliate }));
            }
        } catch (error) {
            console.error('Failed to load affiliate settings:', error);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.updateSettings({ affiliate: settings });
            toast({
                title: 'Settings saved',
                description: 'Affiliate settings have been updated successfully.',
            });
        } catch (error) {
            toast({
                title: 'Save failed',
                description: 'Could not save affiliate settings.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const updateSetting = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Percent className="h-5 w-5" />
                        Commission Settings
                    </CardTitle>
                    <CardDescription>Configure default commission rates and structure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="commissionType">Commission Type</Label>
                            <Select value={settings.commissionType} onValueChange={v => updateSetting('commissionType', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Percentage</SelectItem>
                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="defaultCommissionRate">
                                Default Rate {settings.commissionType === 'percentage' ? '(%)' : '($)'}
                            </Label>
                            <Input
                                id="defaultCommissionRate"
                                type="number"
                                min="0"
                                step={settings.commissionType === 'percentage' ? '0.1' : '1'}
                                value={settings.defaultCommissionRate}
                                onChange={e => updateSetting('defaultCommissionRate', parseFloat(e.target.value))}
                            />
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Enable Tiered Commissions</Label>
                                <p className="text-sm text-muted-foreground">Reward high-performing affiliates with higher rates</p>
                            </div>
                            <Switch
                                checked={settings.tierEnabled}
                                onCheckedChange={v => updateSetting('tierEnabled', v)}
                            />
                        </div>

                        {settings.tierEnabled && (
                            <div className="grid gap-4 md:grid-cols-3 p-4 bg-muted/50 rounded-lg">
                                <div className="space-y-2">
                                    <Label>Tier 1 Rate (%)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={settings.tier1Rate}
                                        onChange={e => updateSetting('tier1Rate', parseFloat(e.target.value))}
                                    />
                                    <p className="text-xs text-muted-foreground">Default tier</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Tier 2 Rate (%)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={settings.tier2Rate}
                                        onChange={e => updateSetting('tier2Rate', parseFloat(e.target.value))}
                                    />
                                    <p className="text-xs text-muted-foreground">After ${settings.tier2Threshold}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Tier 3 Rate (%)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={settings.tier3Rate}
                                        onChange={e => updateSetting('tier3Rate', parseFloat(e.target.value))}
                                    />
                                    <p className="text-xs text-muted-foreground">After ${settings.tier3Threshold}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Tier 2 Threshold ($)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={settings.tier2Threshold}
                                        onChange={e => updateSetting('tier2Threshold', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tier 3 Threshold ($)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={settings.tier3Threshold}
                                        onChange={e => updateSetting('tier3Threshold', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Recurring Commissions</Label>
                            <p className="text-sm text-muted-foreground">Pay commissions on subscription renewals</p>
                        </div>
                        <Switch
                            checked={settings.enableRecurringCommissions}
                            onCheckedChange={v => updateSetting('enableRecurringCommissions', v)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Payout Settings
                    </CardTitle>
                    <CardDescription>Configure payout terms and thresholds</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="payoutThreshold">Minimum Payout Threshold ($)</Label>
                            <Input
                                id="payoutThreshold"
                                type="number"
                                min="0"
                                value={settings.payoutThreshold}
                                onChange={e => updateSetting('payoutThreshold', parseFloat(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground">Minimum balance required before payout</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payoutFrequency">Payout Frequency</Label>
                            <Select value={settings.payoutFrequency} onValueChange={v => updateSetting('payoutFrequency', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Tracking Settings
                    </CardTitle>
                    <CardDescription>Configure referral tracking and attribution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="cookieDuration">Cookie Duration (days)</Label>
                        <Input
                            id="cookieDuration"
                            type="number"
                            min="1"
                            max="365"
                            value={settings.cookieDuration}
                            onChange={e => updateSetting('cookieDuration', parseInt(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">How long to track referrals after initial click</p>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Auto-Approve New Affiliates</Label>
                            <p className="text-sm text-muted-foreground">Automatically approve affiliate applications</p>
                        </div>
                        <Switch
                            checked={settings.enableAutoApproval}
                            onCheckedChange={v => updateSetting('enableAutoApproval', v)}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                        <>Saving...</>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Settings
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default AffiliateSettings;
