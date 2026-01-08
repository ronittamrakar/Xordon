import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActiveCompany, companyQueryKey } from '@/hooks/useActiveCompany';
import { api } from '@/lib/api';
import { listingsApi } from '@/services/listingsApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, Key, Globe, Database, Plus, Trash2, Target } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function SeoSettingsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { activeCompanyId, hasCompany } = useActiveCompany();
    const [isAddCompetitorOpen, setIsAddCompetitorOpen] = useState(false);
    const [newCompetitor, setNewCompetitor] = useState({ name: '', domain: '' });

    const [settings, setSettings] = useState({
        target_country: 'us',
        currency: 'USD',
        ahrefs_api_key: '',
        semrush_api_key: '',
        moz_access_id: '',
        moz_secret_key: '',
        google_search_console_property: '',
        auto_audit_frequency: 'weekly',
        enable_daily_rank_tracking: true
    });

    // --- Queries ---

    const { data: fetchedSettings, isLoading: isLoadingSettings } = useQuery({
        queryKey: companyQueryKey('seo-settings', activeCompanyId),
        queryFn: async () => {
            const res = await api.get('/seo/settings');
            return res.data?.data || {};
        },
        enabled: hasCompany
    });

    const { data: competitors, isLoading: isLoadingCompetitors } = useQuery({
        queryKey: companyQueryKey('seo-competitors', activeCompanyId),
        queryFn: async () => {
            return await listingsApi.getCompetitors();
        },
        enabled: hasCompany
    });

    useEffect(() => {
        if (fetchedSettings) {
            setSettings(prev => ({
                ...prev,
                ...fetchedSettings
            }));
        }
    }, [fetchedSettings]);

    // --- Mutations ---

    const updateSettingsMutation = useMutation({
        mutationFn: async (newSettings: any) => {
            await api.post('/seo/settings', { settings: newSettings });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyQueryKey('seo-settings', activeCompanyId) });
            toast({ title: 'Settings saved successfully' });
        },
        onError: () => {
            toast({ title: 'Failed to save settings', variant: 'destructive' });
        }
    });

    const addCompetitorMutation = useMutation({
        mutationFn: async (data: { name: string; domain: string }) => {
            return await listingsApi.addCompetitor(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyQueryKey('seo-competitors', activeCompanyId) });
            toast({ title: 'Competitor added successfully' });
            setIsAddCompetitorOpen(false);
            setNewCompetitor({ name: '', domain: '' });
        },
        onError: () => {
            toast({ title: 'Failed to add competitor', variant: 'destructive' });
        }
    });

    const deleteCompetitorMutation = useMutation({
        mutationFn: async (id: number) => {
            await listingsApi.deleteCompetitor(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyQueryKey('seo-competitors', activeCompanyId) });
            toast({ title: 'Competitor removed' });
        },
        onError: () => {
            toast({ title: 'Failed to remove competitor', variant: 'destructive' });
        }
    });

    const handleSave = () => {
        updateSettingsMutation.mutate(settings);
    };

    const handleAddCompetitor = () => {
        if (!newCompetitor.name || !newCompetitor.domain) {
            toast({ title: 'Please fill in all fields', variant: 'destructive' });
            return;
        }
        addCompetitorMutation.mutate(newCompetitor);
    };

    if (isLoadingSettings) {
        return (
            <div className="container mx-auto py-6">
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">SEO Settings</h1>
                    <p className="text-muted-foreground">Configure your SEO tools, competitors, and preferences.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={updateSettingsMutation.isPending}>
                        {updateSettingsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="general">General & API Keys</TabsTrigger>
                    <TabsTrigger value="competitors">Competitors</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="h-5 w-5" />
                                    General Preferences
                                </CardTitle>
                                <CardDescription>
                                    Set defaults for keyword research and tracking.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="target_country">Target Country</Label>
                                    <Select
                                        value={settings.target_country}
                                        onValueChange={(val) => setSettings({ ...settings, target_country: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="us">United States</SelectItem>
                                            <SelectItem value="uk">United Kingdom</SelectItem>
                                            <SelectItem value="ca">Canada</SelectItem>
                                            <SelectItem value="au">Australia</SelectItem>
                                            <SelectItem value="de">Germany</SelectItem>
                                            <SelectItem value="fr">France</SelectItem>
                                            <SelectItem value="in">India</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency</Label>
                                    <Select
                                        value={settings.currency}
                                        onValueChange={(val) => setSettings({ ...settings, currency: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Currency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                            <SelectItem value="GBP">GBP (£)</SelectItem>
                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                            <SelectItem value="CAD">CAD ($)</SelectItem>
                                            <SelectItem value="AUD">AUD ($)</SelectItem>
                                            <SelectItem value="INR">INR (₹)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5" />
                                    Automation & Limits
                                </CardTitle>
                                <CardDescription>
                                    Configure automated tasks and frequency.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Daily Rank Tracking</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Automatically update keyword rankings every 24 hours.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.enable_daily_rank_tracking}
                                        onCheckedChange={(val) => setSettings({ ...settings, enable_daily_rank_tracking: val })}
                                    />
                                </div>
                                <div className="space-y-2 pt-4">
                                    <Label htmlFor="audit_freq">Auto-Audit Frequency</Label>
                                    <Select
                                        value={settings.auto_audit_frequency}
                                        onValueChange={(val) => setSettings({ ...settings, auto_audit_frequency: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="manual">Manual Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="h-5 w-5" />
                                    API Integrations
                                </CardTitle>
                                <CardDescription>
                                    Connect third-party tools for enhanced data accuracy (Optional).
                                    We use these keys to fetch real-time volume, difficulty, and backlink data.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="ahrefs_key">Ahrefs API Key</Label>
                                    <Input
                                        id="ahrefs_key"
                                        type="password"
                                        placeholder="Enter Ahrefs API Key"
                                        value={settings.ahrefs_api_key}
                                        onChange={(e) => setSettings({ ...settings, ahrefs_api_key: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="semrush_key">SEMRush API Key</Label>
                                    <Input
                                        id="semrush_key"
                                        type="password"
                                        placeholder="Enter SEMRush API Key"
                                        value={settings.semrush_api_key}
                                        onChange={(e) => setSettings({ ...settings, semrush_api_key: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="moz_id">Moz Access ID</Label>
                                    <Input
                                        id="moz_id"
                                        placeholder="moz-access-id-..."
                                        value={settings.moz_access_id}
                                        onChange={(e) => setSettings({ ...settings, moz_access_id: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="moz_secret">Moz Secret Key</Label>
                                    <Input
                                        id="moz_secret"
                                        type="password"
                                        placeholder="Enter Moz Secret Key"
                                        value={settings.moz_secret_key}
                                        onChange={(e) => setSettings({ ...settings, moz_secret_key: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="gsc_prop">Google Search Console Property URL</Label>
                                    <Input
                                        id="gsc_prop"
                                        placeholder="https://example.com/"
                                        value={settings.google_search_console_property}
                                        onChange={(e) => setSettings({ ...settings, google_search_console_property: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">Requires OAuth connection (Coming Soon). Enter manual property ID for now.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="competitors">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Tracked Competitors
                                </CardTitle>
                                <CardDescription>
                                    Add competitors to track their keywords and backlinks performance.
                                    These will appear in the "Gap Analysis" tools.
                                </CardDescription>
                            </div>
                            <Dialog open={isAddCompetitorOpen} onOpenChange={setIsAddCompetitorOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Competitor
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Competitor</DialogTitle>
                                        <DialogDescription>
                                            Enter the domain of the competitor you want to track.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Competitor Name</Label>
                                            <Input
                                                placeholder="e.g. Acme Corp"
                                                value={newCompetitor.name}
                                                onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Domain URL</Label>
                                            <Input
                                                placeholder="e.g. acme.com"
                                                value={newCompetitor.domain}
                                                onChange={(e) => setNewCompetitor({ ...newCompetitor, domain: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsAddCompetitorOpen(false)}>Cancel</Button>
                                        <Button onClick={handleAddCompetitor} disabled={addCompetitorMutation.isPending}>
                                            {addCompetitorMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Add Competitor
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Competitor Name</TableHead>
                                        <TableHead>Domain</TableHead>
                                        <TableHead>Backlinks</TableHead>
                                        <TableHead>Keywords</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingCompetitors ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ) : competitors?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No competitors tracked yet. Add one to get started.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        competitors?.map((comp: any) => (
                                            <TableRow key={comp.id}>
                                                <TableCell className="font-medium">{comp.name}</TableCell>
                                                <TableCell>
                                                    <a href={`https://${comp.domain}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                                        {comp.domain}
                                                        <Globe className="h-3 w-3" />
                                                    </a>
                                                </TableCell>
                                                <TableCell>{comp.backlinks_count?.toLocaleString() || '-'}</TableCell>
                                                <TableCell>{comp.keywords_count?.toLocaleString() || '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deleteCompetitorMutation.mutate(comp.id)}
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
