import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, BarChart3, Mail, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ReportingSettings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        defaultDateRange: '30d',
        enableWeeklyDigest: true,
        enableMonthlyReport: true,
        digestRecipients: '',
        includeCharts: true,
        includeTables: true,
    });

    const handleSave = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
        toast({
            title: 'Reporting settings saved',
            description: 'Your analytics preferences have been updated.',
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-[18px] font-bold tracking-tight">
                        Reporting Settings
                    </h2>
                    <p className="text-muted-foreground">
                        Configure default views and automated email reports.
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
                        <CardTitle>Defaults</CardTitle>
                        <CardDescription>Default settings for analytics dashboards</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Default Date Range</Label>
                            <Select
                                value={settings.defaultDateRange}
                                onValueChange={(v) => setSettings({ ...settings, defaultDateRange: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7d">Last 7 Days</SelectItem>
                                    <SelectItem value="30d">Last 30 Days</SelectItem>
                                    <SelectItem value="90d">Last 90 Days</SelectItem>
                                    <SelectItem value="mtd">Month to Date</SelectItem>
                                    <SelectItem value="ytd">Year to Date</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Automated Reports</CardTitle>
                        <CardDescription>Schedule email reports for your team</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Weekly Digest</Label>
                                <p className="text-sm text-muted-foreground">Send a summary of key metrics every Monday</p>
                            </div>
                            <Switch
                                checked={settings.enableWeeklyDigest}
                                onCheckedChange={(v) => setSettings({ ...settings, enableWeeklyDigest: v })}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Monthly Report</Label>
                                <p className="text-sm text-muted-foreground">Send a detailed PDF report on the 1st of each month</p>
                            </div>
                            <Switch
                                checked={settings.enableMonthlyReport}
                                onCheckedChange={(v) => setSettings({ ...settings, enableMonthlyReport: v })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Report Content</CardTitle>
                        <CardDescription>Customize what appears in your reports</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Include Charts</Label>
                                <p className="text-sm text-muted-foreground">Visualize trends with graphs</p>
                            </div>
                            <Switch
                                checked={settings.includeCharts}
                                onCheckedChange={(v) => setSettings({ ...settings, includeCharts: v })}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Include Data Tables</Label>
                                <p className="text-sm text-muted-foreground">Show detailed data in tabular format</p>
                            </div>
                            <Switch
                                checked={settings.includeTables}
                                onCheckedChange={(v) => setSettings({ ...settings, includeTables: v })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
