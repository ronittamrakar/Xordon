import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, TrendingUp, Target, BookOpen, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export default function SalesSettings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [settings, setSettings] = useState({
        // Pipeline
        defaultPipeline: 'main',
        autoAssignLeads: true,
        leadRotationEnabled: false,

        // Goals
        defaultGoalPeriod: 'monthly',
        enableTeamGoals: true,
        enableIndividualGoals: true,

        // Playbooks
        playbookVisibility: 'team',
        enablePlaybookTracking: true,

        // Enablement
        enableContentTracking: true,
        requireTrainingCompletion: false,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.settings.get('sales');
                if (response.settings) {
                    setSettings(prev => ({ ...prev, ...response.settings }));
                }
            } catch (error) {
                console.error('Failed to load sales settings:', error);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.settings.update('sales', settings);
            toast({
                title: 'Sales settings saved',
                description: 'Your sales configuration has been updated successfully.',
            });
        } catch (error) {
            console.error('Failed to save sales settings:', error);
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
                        <TrendingUp className="h-6 w-6 text-green-500" />
                        Sales Settings
                    </h2>
                    <p className="text-muted-foreground">
                        Configure sales pipelines, goals, playbooks, and enablement.
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
                            <TrendingUp className="h-5 w-5" />
                            Pipeline & Lead Management
                        </CardTitle>
                        <CardDescription>Configure default pipeline and lead assignment</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Default Pipeline</Label>
                            <Select
                                value={settings.defaultPipeline}
                                onValueChange={(v) => setSettings({ ...settings, defaultPipeline: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="main">Main Pipeline</SelectItem>
                                    <SelectItem value="enterprise">Enterprise Pipeline</SelectItem>
                                    <SelectItem value="smb">SMB Pipeline</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Auto-Assign Leads</Label>
                                <p className="text-sm text-muted-foreground">Automatically assign new leads to sales reps</p>
                            </div>
                            <Switch
                                checked={settings.autoAssignLeads}
                                onCheckedChange={(v) => setSettings({ ...settings, autoAssignLeads: v })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Lead Rotation</Label>
                                <p className="text-sm text-muted-foreground">Distribute leads evenly across team</p>
                            </div>
                            <Switch
                                checked={settings.leadRotationEnabled}
                                onCheckedChange={(v) => setSettings({ ...settings, leadRotationEnabled: v })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Sales Goals
                        </CardTitle>
                        <CardDescription>Configure goal tracking and periods</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Default Goal Period</Label>
                            <Select
                                value={settings.defaultGoalPeriod}
                                onValueChange={(v) => setSettings({ ...settings, defaultGoalPeriod: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Team Goals</Label>
                                <p className="text-sm text-muted-foreground">Enable team-level goal tracking</p>
                            </div>
                            <Switch
                                checked={settings.enableTeamGoals}
                                onCheckedChange={(v) => setSettings({ ...settings, enableTeamGoals: v })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Individual Goals</Label>
                                <p className="text-sm text-muted-foreground">Enable individual rep goal tracking</p>
                            </div>
                            <Switch
                                checked={settings.enableIndividualGoals}
                                onCheckedChange={(v) => setSettings({ ...settings, enableIndividualGoals: v })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Playbooks & Enablement
                        </CardTitle>
                        <CardDescription>Sales playbook and training settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Playbook Visibility</Label>
                            <Select
                                value={settings.playbookVisibility}
                                onValueChange={(v) => setSettings({ ...settings, playbookVisibility: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="team">Team Only</SelectItem>
                                    <SelectItem value="company">Company Wide</SelectItem>
                                    <SelectItem value="private">Private (Creator Only)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Playbook Usage Tracking</Label>
                                <p className="text-sm text-muted-foreground">Track which playbooks are being used</p>
                            </div>
                            <Switch
                                checked={settings.enablePlaybookTracking}
                                onCheckedChange={(v) => setSettings({ ...settings, enablePlaybookTracking: v })}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Content Engagement Tracking</Label>
                                <p className="text-sm text-muted-foreground">Track sales content views and downloads</p>
                            </div>
                            <Switch
                                checked={settings.enableContentTracking}
                                onCheckedChange={(v) => setSettings({ ...settings, enableContentTracking: v })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Require Training Completion</Label>
                                <p className="text-sm text-muted-foreground">Require training before accessing features</p>
                            </div>
                            <Switch
                                checked={settings.requireTrainingCompletion}
                                onCheckedChange={(v) => setSettings({ ...settings, requireTrainingCompletion: v })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
