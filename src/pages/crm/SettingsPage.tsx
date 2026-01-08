import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Settings,
    Save,
    GitBranch,
    Layout,
    Database,
    GripVertical,
    Trash2,
    Plus,
    Palette
} from 'lucide-react';
import { LEAD_STAGES } from '@/types/crm';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const CRMSettingsPage: React.FC = () => {
    const [stages, setStages] = useState(LEAD_STAGES);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<Record<string, any>>({});

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);
                const response = await api.crm.getSettings();
                if (response && response.settings) {
                    setSettings(response.settings);
                    if (response.settings.pipeline_stages) {
                        setStages(response.settings.pipeline_stages);
                    }
                }
            } catch (error) {
                console.error('Failed to load CRM settings:', error);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = {
                ...settings,
                pipeline_stages: stages
            };
            await api.crm.updateSettings(payload);
            toast.success('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">CRM Settings</h1>
                    <p className="text-muted-foreground">Configure your sales pipeline, custom fields, and lead scoring rules.</p>
                </div>
                <Button
                    className="gap-2 shadow-lg shadow-blue-500/20"
                    onClick={handleSave}
                    disabled={saving}
                >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <Tabs defaultValue="pipeline" className="space-y-4">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="pipeline" className="gap-2">
                        <GitBranch className="h-4 w-4" />
                        Pipeline Settings
                    </TabsTrigger>
                    <TabsTrigger value="fields" className="gap-2">
                        <Layout className="h-4 w-4" />
                        Custom Fields
                    </TabsTrigger>
                    <TabsTrigger value="scoring" className="gap-2">
                        <Database className="h-4 w-4" />
                        Lead Scoring
                    </TabsTrigger>
                    <TabsTrigger value="general" className="gap-2">
                        <Settings className="h-4 w-4" />
                        General
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pipeline" className="space-y-4">
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Sales Pipeline Stages</CardTitle>
                                    <CardDescription>Define the steps of your sales process. Drag to reorder.</CardDescription>
                                </div>
                                <Button variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Stage
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {stages.map((stage, index) => (
                                    <div
                                        key={stage.value}
                                        className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl group hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-move"
                                    >
                                        <GripVertical className="h-5 w-5 text-slate-400" />
                                        <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex-shrink-0" style={{ backgroundColor: stage.color }} />
                                        <div className="flex-1">
                                            <Input
                                                defaultValue={stage.label}
                                                className="bg-transparent border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:bg-white dark:focus:bg-slate-950 px-0 h-8 font-medium text-base"
                                            />
                                        </div>
                                        <Badge variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            {stage.value}
                                        </Badge>
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardHeader>
                            <CardTitle>Pipeline Visuals</CardTitle>
                            <CardDescription>Customize how your pipeline appears in board view.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="space-y-0.5">
                                    <Label>Show Deal Value in Columns</Label>
                                    <p className="text-xs text-muted-foreground">Display cumulative deal value at the top of each stage.</p>
                                </div>
                                <div className="flex h-6 w-11 items-center rounded-full bg-blue-600 p-1">
                                    <div className="h-4 w-4 translate-x-5 rounded-full bg-white transition-transform" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="space-y-0.5">
                                    <Label>Card Color Coding</Label>
                                    <p className="text-xs text-muted-foreground">Color cards based on priority or stage color.</p>
                                </div>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Palette className="h-4 w-4" />
                                    priority
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="fields">
                    <Card>
                        <CardHeader>
                            <CardTitle>Custom Lead Fields</CardTitle>
                            <CardDescription>Add specialized data points you want to track for every lead.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                            <div className="p-3 bg-muted rounded-full">
                                <Layout className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium">No Custom Fields</h3>
                                <p className="text-muted-foreground">You are currently using only system-defined fields.</p>
                            </div>
                            <Button>Add Custom Field</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="scoring">
                    <Card>
                        <CardHeader>
                            <CardTitle>Scoring Rules</CardTitle>
                            <CardDescription>Assign points based on lead behavior and profile data.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium">Email Opened</p>
                                        <p className="text-sm text-muted-foreground">Points awarded when a lead opens a marketing email.</p>
                                    </div>
                                    <Input type="number" className="w-20 text-center" defaultValue="5" />
                                </div>
                                <div className="flex items-center gap-4 p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium">Website Visited</p>
                                        <p className="text-sm text-muted-foreground">Points awarded for visiting the main website.</p>
                                    </div>
                                    <Input type="number" className="w-20 text-center" defaultValue="10" />
                                </div>
                                <div className="flex items-center gap-4 p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium">Form Submitted</p>
                                        <p className="text-sm text-muted-foreground">Points awarded for completing any intake form.</p>
                                    </div>
                                    <Input type="number" className="w-20 text-center" defaultValue="25" />
                                </div>
                            </div>
                            <Button className="w-full" variant="outline">Add New Rule</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default CRMSettingsPage;
