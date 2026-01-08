import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { FileSignature, Save, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProposalSettings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [settings, setSettings] = useState({
        // Branding
        companyName: '',
        companyLogo: '',
        brandColor: '#FF6B35',
        accentColor: '#1E3A5F',
        // Default Content
        defaultIntroduction: '',
        defaultTerms: '',
        defaultSignatureText: 'By signing below, you agree to the terms outlined in this proposal.',
        // Pricing
        defaultCurrency: 'USD',
        showTaxes: true,
        defaultTaxRate: 0,
        enableDiscounts: true,
        // Expiration
        defaultExpirationDays: 30,
        enableExpirationReminders: true,
        reminderDaysBefore: [7, 3, 1],
        // Signatures
        requireSignature: true,
        enableESignature: true,
        signatureProvider: 'internal', // 'internal' | 'docusign' | 'hellosign'
        // Notifications
        notifyOnView: true,
        notifyOnSign: true,
        notifyOnExpire: true,
        // Templates
        defaultTemplate: '',
        enableVersionHistory: true
    });

    const handleSave = async () => {
        setLoading(true);
        try {
            // Mock save
            await new Promise(resolve => setTimeout(resolve, 800));
            toast({
                title: 'Settings saved',
                description: 'Proposal settings have been updated.',
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
                    <h2 className="text-2xl font-bold tracking-tight">Proposals & Estimates</h2>
                    <p className="text-sm text-muted-foreground">Configure default settings for your proposals</p>
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
                        <FileSignature className="h-5 w-5 text-indigo-500" />
                        General Defaults
                    </CardTitle>
                    <CardDescription>Set default values for new proposals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="propExpires">Default Expiration (Days)</Label>
                            <Input
                                id="propExpires"
                                type="number"
                                min="1"
                                value={settings.defaultExpirationDays}
                                onChange={e => setSettings(prev => ({ ...prev, defaultExpirationDays: parseInt(e.target.value) }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="propCurrency">Default Currency</Label>
                            <Select
                                value={settings.defaultCurrency}
                                onValueChange={v => setSettings(prev => ({ ...prev, defaultCurrency: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                    <SelectItem value="GBP">GBP (£)</SelectItem>
                                    <SelectItem value="CAD">CAD ($)</SelectItem>
                                    <SelectItem value="AUD">AUD ($)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label htmlFor="propTerms">Default Terms & Conditions</Label>
                        <Textarea
                            id="propTerms"
                            className="min-h-[100px]"
                            placeholder="Enter your standard terms here..."
                            value={settings.defaultTerms}
                            onChange={e => setSettings(prev => ({ ...prev, defaultTerms: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="propSig">Signature Legal Text</Label>
                        <Input
                            id="propSig"
                            value={settings.defaultSignatureText}
                            onChange={e => setSettings(prev => ({ ...prev, defaultSignatureText: e.target.value }))}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        Pricing & Taxes
                    </CardTitle>
                    <CardDescription>Configure how pricing is displayed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Show Taxes</Label>
                            <p className="text-sm text-muted-foreground">Display tax line items on proposals</p>
                        </div>
                        <Switch
                            checked={settings.showTaxes}
                            onCheckedChange={v => setSettings(prev => ({ ...prev, showTaxes: v }))}
                        />
                    </div>

                    {settings.showTaxes && (
                        <div className="space-y-2">
                            <Label htmlFor="propTaxRate">Default Tax Rate (%)</Label>
                            <Input
                                id="propTaxRate"
                                type="number"
                                min="0"
                                step="0.1"
                                value={settings.defaultTaxRate}
                                onChange={e => setSettings(prev => ({ ...prev, defaultTaxRate: parseFloat(e.target.value) }))}
                            />
                        </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Enable Discounts</Label>
                            <p className="text-sm text-muted-foreground">Allow applying discounts to line items or totals</p>
                        </div>
                        <Switch
                            checked={settings.enableDiscounts}
                            onCheckedChange={v => setSettings(prev => ({ ...prev, enableDiscounts: v }))}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Save className="h-5 w-5 text-orange-500" />
                        Automation
                    </CardTitle>
                    <CardDescription>Action triggers when proposals are interacted with</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Notify on View</Label>
                            <p className="text-sm text-muted-foreground">Get an email when a client views the proposal</p>
                        </div>
                        <Switch
                            checked={settings.notifyOnView}
                            onCheckedChange={v => setSettings(prev => ({ ...prev, notifyOnView: v }))}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Notify on Sign</Label>
                            <p className="text-sm text-muted-foreground">Get an email when a proposal is signed</p>
                        </div>
                        <Switch
                            checked={settings.notifyOnSign}
                            onCheckedChange={v => setSettings(prev => ({ ...prev, notifyOnSign: v }))}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Auto-Reminders</Label>
                            <p className="text-sm text-muted-foreground">Send reminder emails before expiration</p>
                        </div>
                        <Switch
                            checked={settings.enableExpirationReminders}
                            onCheckedChange={v => setSettings(prev => ({ ...prev, enableExpirationReminders: v }))}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
