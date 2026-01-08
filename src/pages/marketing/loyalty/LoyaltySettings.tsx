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
import { Save, Star, Award, Clock } from 'lucide-react';

const LoyaltySettings = () => {
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        pointsPerDollar: 1,
        pointsValue: 0.01, // $0.01 per point
        enablePointExpiration: false,
        expirationMonths: 12,
        enableTiers: false,
        bronzeThreshold: 0,
        silverThreshold: 500,
        goldThreshold: 1000,
        platinumThreshold: 2500,
        bronzeMultiplier: 1,
        silverMultiplier: 1.25,
        goldMultiplier: 1.5,
        platinumMultiplier: 2,
        enableBirthdayBonus: true,
        birthdayBonusPoints: 100,
        enableReferralBonus: true,
        referralBonusPoints: 50,
        minRedemptionPoints: 100,
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await api.getSettings();
            if (data?.loyalty) {
                setSettings(prev => ({ ...prev, ...data.loyalty }));
            }
        } catch (error) {
            console.error('Failed to load loyalty settings:', error);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.updateSettings({ loyalty: settings });
            toast({
                title: 'Settings saved',
                description: 'Loyalty program settings have been updated successfully.',
            });
        } catch (error) {
            toast({
                title: 'Save failed',
                description: 'Could not save loyalty settings.',
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
                        <Star className="h-5 w-5" />
                        Points Configuration
                    </CardTitle>
                    <CardDescription>Configure how customers earn and redeem points</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="pointsPerDollar">Points Per Dollar Spent</Label>
                            <Input
                                id="pointsPerDollar"
                                type="number"
                                min="0"
                                step="0.1"
                                value={settings.pointsPerDollar}
                                onChange={e => updateSetting('pointsPerDollar', parseFloat(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground">How many points customers earn per $1 spent</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pointsValue">Point Value ($)</Label>
                            <Input
                                id="pointsValue"
                                type="number"
                                min="0"
                                step="0.001"
                                value={settings.pointsValue}
                                onChange={e => updateSetting('pointsValue', parseFloat(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground">Dollar value of each point when redeemed</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label htmlFor="minRedemptionPoints">Minimum Redemption Points</Label>
                        <Input
                            id="minRedemptionPoints"
                            type="number"
                            min="0"
                            value={settings.minRedemptionPoints}
                            onChange={e => updateSetting('minRedemptionPoints', parseInt(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">Minimum points required to redeem rewards</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Tier System
                    </CardTitle>
                    <CardDescription>Configure loyalty tiers and multipliers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Tier System</Label>
                            <p className="text-sm text-muted-foreground">Reward loyal customers with tier-based benefits</p>
                        </div>
                        <Switch
                            checked={settings.enableTiers}
                            onCheckedChange={v => updateSetting('enableTiers', v)}
                        />
                    </div>

                    {settings.enableTiers && (
                        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-amber-700 dark:text-amber-400">Bronze Tier</Label>
                                    <div className="grid gap-2">
                                        <div>
                                            <Label className="text-xs">Threshold (points)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={settings.bronzeThreshold}
                                                onChange={e => updateSetting('bronzeThreshold', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Points Multiplier</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                step="0.1"
                                                value={settings.bronzeMultiplier}
                                                onChange={e => updateSetting('bronzeMultiplier', parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-500 dark:text-gray-400">Silver Tier</Label>
                                    <div className="grid gap-2">
                                        <div>
                                            <Label className="text-xs">Threshold (points)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={settings.silverThreshold}
                                                onChange={e => updateSetting('silverThreshold', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Points Multiplier</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                step="0.1"
                                                value={settings.silverMultiplier}
                                                onChange={e => updateSetting('silverMultiplier', parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-yellow-600 dark:text-yellow-400">Gold Tier</Label>
                                    <div className="grid gap-2">
                                        <div>
                                            <Label className="text-xs">Threshold (points)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={settings.goldThreshold}
                                                onChange={e => updateSetting('goldThreshold', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Points Multiplier</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                step="0.1"
                                                value={settings.goldMultiplier}
                                                onChange={e => updateSetting('goldMultiplier', parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-purple-600 dark:text-purple-400">Platinum Tier</Label>
                                    <div className="grid gap-2">
                                        <div>
                                            <Label className="text-xs">Threshold (points)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={settings.platinumThreshold}
                                                onChange={e => updateSetting('platinumThreshold', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Points Multiplier</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                step="0.1"
                                                value={settings.platinumMultiplier}
                                                onChange={e => updateSetting('platinumMultiplier', parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Expiration & Bonuses
                    </CardTitle>
                    <CardDescription>Configure point expiration and bonus rewards</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Enable Point Expiration</Label>
                                <p className="text-sm text-muted-foreground">Points expire after a set period</p>
                            </div>
                            <Switch
                                checked={settings.enablePointExpiration}
                                onCheckedChange={v => updateSetting('enablePointExpiration', v)}
                            />
                        </div>

                        {settings.enablePointExpiration && (
                            <div className="space-y-2 pl-4">
                                <Label htmlFor="expirationMonths">Expiration Period (months)</Label>
                                <Input
                                    id="expirationMonths"
                                    type="number"
                                    min="1"
                                    max="60"
                                    value={settings.expirationMonths}
                                    onChange={e => updateSetting('expirationMonths', parseInt(e.target.value))}
                                />
                            </div>
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Birthday Bonus</Label>
                                <p className="text-sm text-muted-foreground">Award bonus points on customer birthdays</p>
                            </div>
                            <Switch
                                checked={settings.enableBirthdayBonus}
                                onCheckedChange={v => updateSetting('enableBirthdayBonus', v)}
                            />
                        </div>

                        {settings.enableBirthdayBonus && (
                            <div className="space-y-2 pl-4">
                                <Label htmlFor="birthdayBonusPoints">Birthday Bonus Points</Label>
                                <Input
                                    id="birthdayBonusPoints"
                                    type="number"
                                    min="0"
                                    value={settings.birthdayBonusPoints}
                                    onChange={e => updateSetting('birthdayBonusPoints', parseInt(e.target.value))}
                                />
                            </div>
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Referral Bonus</Label>
                                <p className="text-sm text-muted-foreground">Award points for successful referrals</p>
                            </div>
                            <Switch
                                checked={settings.enableReferralBonus}
                                onCheckedChange={v => updateSetting('enableReferralBonus', v)}
                            />
                        </div>

                        {settings.enableReferralBonus && (
                            <div className="space-y-2 pl-4">
                                <Label htmlFor="referralBonusPoints">Referral Bonus Points</Label>
                                <Input
                                    id="referralBonusPoints"
                                    type="number"
                                    min="0"
                                    value={settings.referralBonusPoints}
                                    onChange={e => updateSetting('referralBonusPoints', parseInt(e.target.value))}
                                />
                            </div>
                        )}
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

export default LoyaltySettings;
