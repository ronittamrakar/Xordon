import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calendar, Share2, Save, Clock, Plus, Trash2, Facebook, Linkedin, Instagram, Twitter, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function SocialPlannerSettings() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
    const [newAccount, setNewAccount] = useState({ platform: 'facebook', account_name: '' });

    // Module Settings
    const { data: settingsData, isLoading: isLoadingSettings } = useQuery<any>({
        queryKey: ['module-settings', 'social_planner'],
        queryFn: () => api.modules.getSettings('social_planner')
    });

    const [localSettings, setLocalSettings] = useState({
        defaultTimezone: 'UTC',
        enableAutoSchedule: true,
        scheduleBufferMinutes: 15,
        maxPostsPerDay: 10,
        enableApprovalWorkflow: false,
    });

    useEffect(() => {
        if (settingsData) {
            setLocalSettings(prev => ({ ...prev, ...settingsData }));
        }
    }, [settingsData]);

    const saveSettingsMutation = useMutation<any, Error, any>({
        mutationFn: (data: any) => api.modules.updateSettings('social_planner', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['module-settings', 'social_planner'] });
            toast({ title: 'Settings Saved', description: 'Social Planner configuration updated.' });
        },
        onError: () => toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' })
    });

    const handleSaveSettings = () => {
        saveSettingsMutation.mutate(localSettings);
    };

    // Fetch Accounts
    const { data: accounts, isLoading: isLoadingAccounts } = useQuery<any[]>({
        queryKey: ['social-accounts'],
        queryFn: api.socialPlanner.getAccounts
    });

    // Connect Account Mutation
    const connectMutation = useMutation<any, Error, any>({
        mutationFn: (data: any) => api.socialPlanner.connectAccount(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
            setIsConnectDialogOpen(false);
            setNewAccount({ platform: 'facebook', account_name: '' });
            toast({
                title: 'Account Connected',
                description: 'Social media account has been successfully connected.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Connection Failed',
                description: error.message || 'Failed to connect account',
                variant: 'destructive',
            });
        }
    });

    // Disconnect Account Mutation
    const disconnectMutation = useMutation({
        mutationFn: api.socialPlanner.disconnectAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
            toast({
                title: 'Account Disconnected',
                description: 'Social media account has been removed.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to disconnect account',
                variant: 'destructive',
            });
        }
    });

    const handleConnect = () => {
        if (!newAccount.account_name) {
            toast({ title: 'Error', description: 'Account name is required', variant: 'destructive' });
            return;
        }
        connectMutation.mutate(newAccount);
    };

    // Old handleSaveSettings block removed
    // New handler is defined above in the mutation section

    const getPlatformIcon = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'facebook': return <Facebook className="h-5 w-5 text-blue-600" />;
            case 'linkedin': return <Linkedin className="h-5 w-5 text-blue-700" />;
            case 'instagram': return <Instagram className="h-5 w-5 text-pink-600" />;
            case 'twitter': return <Twitter className="h-5 w-5 text-blue-400" />;
            default: return <Share2 className="h-5 w-5 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Social Planner</h2>
                    <p className="text-sm text-muted-foreground">Manage connected accounts and scheduling preferences</p>
                </div>
                <Button onClick={handleSaveSettings} disabled={loading}>
                    {loading ? 'Saving...' : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            {/* Connected Accounts Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Share2 className="h-5 w-5 text-blue-500" />
                                Connected Accounts
                            </CardTitle>
                            <CardDescription>Manage your social media integrations</CardDescription>
                        </div>
                        <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Connect Account
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Connect Social Account</DialogTitle>
                                    <DialogDescription>
                                        Select a platform and authorize connection.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Platform</Label>
                                        <Select
                                            value={newAccount.platform}
                                            onValueChange={(v) => setNewAccount(prev => ({ ...prev, platform: v }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="facebook">Facebook</SelectItem>
                                                <SelectItem value="instagram">Instagram</SelectItem>
                                                <SelectItem value="linkedin">LinkedIn</SelectItem>
                                                <SelectItem value="twitter">X (Twitter)</SelectItem>
                                                <SelectItem value="tiktok">TikTok</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Account Name (Profile/Page)</Label>
                                        <Input
                                            placeholder="e.g. My Business Page"
                                            value={newAccount.account_name}
                                            onChange={(e) => setNewAccount(prev => ({ ...prev, account_name: e.target.value }))}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            In a real scenario, this would redirect to OAuth provider.
                                        </p>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsConnectDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleConnect} disabled={connectMutation.isPending}>
                                        {connectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Connect
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingAccounts ? (
                        <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : accounts && accounts.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {accounts.map((account: any) => (
                                <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-muted rounded-full">
                                            {getPlatformIcon(account.platform)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{account.account_name}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{account.platform}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={() => disconnectMutation.mutate(account.id)}
                                        disabled={disconnectMutation.isPending}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                            <Share2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p>No accounts connected yet</p>
                            <p className="text-sm mt-1">Connect a social media account to start scheduling posts</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-500" />
                            Scheduling Defaults
                        </CardTitle>
                        <CardDescription>Default settings for new posts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Timezone</Label>
                            <Select
                                value={localSettings.defaultTimezone}
                                onValueChange={v => setLocalSettings(prev => ({ ...prev, defaultTimezone: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UTC">UTC</SelectItem>
                                    <SelectItem value="America/New_York">Eastern Time (US)</SelectItem>
                                    <SelectItem value="America/Los_Angeles">Pacific Time (US)</SelectItem>
                                    <SelectItem value="Europe/London">London</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Schedule Buffer (Minutes)</Label>
                            <Input
                                type="number"
                                value={localSettings.scheduleBufferMinutes}
                                onChange={e => setLocalSettings(prev => ({ ...prev, scheduleBufferMinutes: parseInt(e.target.value) }))}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-purple-500" />
                            Workflow Limits
                        </CardTitle>
                        <CardDescription>Safety and approval settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Require Approval</Label>
                                <p className="text-xs text-muted-foreground">Manager must approve posts</p>
                            </div>
                            <Switch
                                checked={localSettings.enableApprovalWorkflow}
                                onCheckedChange={v => setLocalSettings(prev => ({ ...prev, enableApprovalWorkflow: v }))}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Auto-Schedule</Label>
                                <p className="text-xs text-muted-foreground">AI picks best times</p>
                            </div>
                            <Switch
                                checked={localSettings.enableAutoSchedule}
                                onCheckedChange={v => setLocalSettings(prev => ({ ...prev, enableAutoSchedule: v }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Max Posts Per Day</Label>
                            <Input
                                type="number"
                                value={localSettings.maxPostsPerDay}
                                onChange={e => setLocalSettings(prev => ({ ...prev, maxPostsPerDay: parseInt(e.target.value) }))}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
