import React, { useState, useEffect } from 'react';
import SEO from '@/components/SEO';
import { ModuleGuard } from '@/components/ModuleGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Settings,
    Sparkles,
    MessageSquare,
    Mail,
    Phone,
    Globe,
    Shield,
    RefreshCw,
    Save,
    Plus,
    Trash2,
    AlertCircle,
    Copy,
    ExternalLink,
    Bot,
    Zap,
    Star,
    Layers,
    Info,
    CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import reputationApi, { AIAgent, ReviewTemplate } from '@/services/reputationApi';
import AIAgentDialog from '@/components/AIAgentDialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function ReputationSettings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<any>({
        google_review_link: '',
        facebook_review_link: '',
        custom_review_link: '',
        auto_reply_enabled: false,
        min_rating_to_reply: 4,
        platforms: [],
        review_links: []
    });
    const [agents, setAgents] = useState<AIAgent[]>([]);
    const [templates, setTemplates] = useState<ReviewTemplate[]>([]);

    // States for sub-components
    const [showAgentDialog, setShowAgentDialog] = useState(false);
    const [editingAgent, setEditingAgent] = useState<AIAgent | undefined>(undefined);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await reputationApi.getSettings();
            setSettings(data.settings);
            setAgents(data.ai_agents || []);
            setTemplates(data.templates || []);
        } catch (error) {
            console.error('Failed to load settings:', error);
            toast({
                title: 'Error',
                description: 'Failed to load reputation configuration',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            setSubmitting(true);
            await reputationApi.updateSettings(settings);
            toast({
                title: 'Saved',
                description: 'Settings updated successfully',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save settings',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateAgent = () => {
        setEditingAgent(undefined);
        setShowAgentDialog(true);
    };

    const handleEditAgent = (agent: AIAgent) => {
        setEditingAgent(agent);
        setShowAgentDialog(true);
    };

    const handleDeleteAgent = async (id: number) => {
        if (!confirm('Are you sure you want to remove this AI agent?')) return;
        try {
            await reputationApi.deleteAgent(id);
            toast({ title: 'Deleted', description: 'AI Agent removed' });
            loadData();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete agent', variant: 'destructive' });
        }
    };

    const handleCopyLink = (link: string) => {
        if (!link) return;
        navigator.clipboard.writeText(link);
        toast({ title: 'Link copied', description: 'URL added to clipboard' });
    };

    if (loading && !settings) {
        return (
            <ModuleGuard moduleKey="reputation">
                <div className="flex items-center justify-center min-h-[400px]">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
            </ModuleGuard>
        );
    }

    return (
        <ModuleGuard moduleKey="reputation">
            <SEO title="Reputation Settings" description="Configure AI agents and review links" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold font-heading">Settings</h1>
                        <p className="text-muted-foreground">Manage AI automation, review platforms, and templates</p>
                    </div>
                    <Button onClick={handleSaveSettings} disabled={submitting}>
                        {submitting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>

                <Tabs defaultValue="links" className="w-full">
                    <TabsList className="grid grid-cols-4 w-full md:w-[600px] mb-8">
                        <TabsTrigger value="links">Review Links</TabsTrigger>
                        <TabsTrigger value="ai">AI Automation</TabsTrigger>
                        <TabsTrigger value="templates">Templates</TabsTrigger>
                        <TabsTrigger value="general">Integrations</TabsTrigger>
                    </TabsList>

                    {/* Review Links Content */}
                    <TabsContent value="links" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Platform Links</CardTitle>
                                <CardDescription>Configure where your review requests point to</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            Google Review URL
                                        </label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="https://g.page/r/your-id/review"
                                                value={settings.google_review_link}
                                                onChange={(e) => setSettings({ ...settings, google_review_link: e.target.value })}
                                            />
                                            <Button variant="outline" size="icon" onClick={() => handleCopyLink(settings.google_review_link)}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Facebook Review URL</label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="https://facebook.com/your-page/reviews"
                                                value={settings.facebook_review_link}
                                                onChange={(e) => setSettings({ ...settings, facebook_review_link: e.target.value })}
                                            />
                                            <Button variant="outline" size="icon" onClick={() => handleCopyLink(settings.facebook_review_link)}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium">Custom Review URL (Short Link)</label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="https://your-domain.com/review"
                                                value={settings.custom_review_link}
                                                onChange={(e) => setSettings({ ...settings, custom_review_link: e.target.value })}
                                            />
                                            <Button variant="outline" size="icon" onClick={() => handleCopyLink(settings.custom_review_link)}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            We recommend using your custom short link in all communication to track analytics.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader>
                                <div className="flex items-center gap-2 text-primary">
                                    <Zap className="h-5 w-5" />
                                    <CardTitle>Review Link Balancing</CardTitle>
                                </div>
                                <CardDescription>Distribute traffic between platforms to build a balanced reputation</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                                    <div>
                                        <p className="font-medium">Multi-platform Redirector</p>
                                        <p className="text-sm text-muted-foreground">Automatically rotate links based on your priorities</p>
                                    </div>
                                    <Button variant="outline">Configure Rotation</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* AI Automation Content */}
                    <TabsContent value="ai" className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>AI Auto-Reply Agents</CardTitle>
                                    <CardDescription>Automate responses to your incoming reviews using GPT-4</CardDescription>
                                </div>
                                <Button onClick={handleCreateAgent} variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-2" /> New Agent
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${settings.auto_reply_enabled ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                                            <Bot className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">Master AI Toggle</p>
                                            <p className="text-sm text-muted-foreground">Enable or disable all automated replies</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={settings.auto_reply_enabled}
                                        onCheckedChange={(checked) => setSettings({ ...settings, auto_reply_enabled: checked })}
                                    />
                                </div>

                                <div className="grid gap-4">
                                    {agents.length === 0 ? (
                                        <div className="text-center py-10 border rounded-xl border-dashed">
                                            <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                                            <p className="text-muted-foreground">No custom AI agents configured</p>
                                            <Button variant="link" onClick={handleCreateAgent}>Create your first agent</Button>
                                        </div>
                                    ) : (
                                        agents.map((agent) => (
                                            <div key={agent.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/10 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Badge className="bg-primary/10 text-primary capitalize">{agent.tone}</Badge>
                                                    <div>
                                                        <p className="font-medium">{agent.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate max-w-md">{agent.instructions}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditAgent(agent)}>
                                                        <Settings className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteAgent(agent.id!)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Reply Rules</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Minimum Rating for Auto-Reply</label>
                                    <Select
                                        value={settings.min_rating_to_reply?.toString() || ""}
                                        onValueChange={(val) => setSettings({ ...settings, min_rating_to_reply: parseInt(val) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1 Star & above (Reply to everything)</SelectItem>
                                            <SelectItem value="2">2 Stars & above</SelectItem>
                                            <SelectItem value="3">3 Stars & above</SelectItem>
                                            <SelectItem value="4">4 Stars & above (Reply to positive only)</SelectItem>
                                            <SelectItem value="5">5 Stars only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Templates Content */}
                    <TabsContent value="templates" className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-5 w-5 text-blue-500" />
                                        <CardTitle>Email Templates</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {templates.filter(t => t.type === 'email').map(t => (
                                        <div key={t.id} className="p-3 border rounded-lg flex items-center justify-between">
                                            <p className="font-medium text-sm">{t.name}</p>
                                            <Badge variant="outline">Default</Badge>
                                        </div>
                                    ))}
                                    <Button variant="outline" className="w-full" size="sm">
                                        <Plus className="h-4 w-4 mr-2" /> Build Email Template
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-5 w-5 text-green-500" />
                                        <CardTitle>SMS Templates</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {templates.filter(t => t.type === 'sms').map(t => (
                                        <div key={t.id} className="p-3 border rounded-lg flex items-center justify-between">
                                            <p className="font-medium text-sm">{t.name}</p>
                                            <Badge variant="outline">Default</Badge>
                                        </div>
                                    ))}
                                    <Button variant="outline" className="w-full" size="sm">
                                        <Plus className="h-4 w-4 mr-2" /> Build SMS Template
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="general" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Platform Integrations</CardTitle>
                                <CardDescription>Connect your accounts to fetch reviews and post replies automatically</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <div className="p-4 border rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 flex items-center justify-center bg-muted rounded-full">
                                            <Globe className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">Google Business Profile</p>
                                            <p className="text-xs text-green-500 flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Connected
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">Modify</Button>
                                </div>
                                <div className="p-4 border rounded-xl flex items-center justify-between opacity-50 grayscale">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 flex items-center justify-center bg-muted rounded-full">
                                            <MessageSquare className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">Facebook Pages</p>
                                            <p className="text-xs text-muted-foreground">Not connected</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">Connect</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <AIAgentDialog
                isOpen={showAgentDialog}
                onClose={() => setShowAgentDialog(false)}
                template={editingAgent as any}
            />
        </ModuleGuard>
    );
}
