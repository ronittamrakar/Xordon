import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Mail,
    Plus,
    Search,
    Filter,
    ExternalLink,
    AlertCircle,
    Server,
    CheckCircle,
    XCircle,
    Trash2,
    RefreshCcw,
    Loader2,
    ShieldCheck,
    AlertTriangle,
    PlayCircle,
    PauseCircle,
    MailCheck,
    Settings,
    Clock,
    Shield,
    Zap,
    BarChart3,
    Globe,
    CheckCircle2,
    HelpCircle
} from 'lucide-react';
import { api, type SendingAccount, type DeliverabilityAccount, type WarmupProfilePayload, type DnsCheckResult } from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';

const warmupStatusVariant = (status: string) => {
    switch (status) {
        case 'active':
        case 'scheduled':
        case 'pass':
        case 'healthy':
        case 'good':
        case 'ok':
            return 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-300';
        case 'paused':
        case 'idle':
        case 'warning':
        case 'missing':
        case 'checking':
            return 'bg-muted text-foreground dark:bg-muted dark:text-foreground';
        case 'error':
        case 'fail':
        case 'failed':
        case 'critical':
            return 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300';
        default:
            return 'bg-muted text-muted-foreground';
    }
};

const EmailSettings = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isSendingAccountDialogOpen, setIsSendingAccountDialogOpen] = useState(false);
    const [selectedEmailProvider, setSelectedEmailProvider] = useState<'gmail' | 'smtp'>('gmail');
    const sendingAccountFormRef = useRef<HTMLFormElement | null>(null);

    // Email Settings State
    const [emailSettings, setEmailSettings] = useState({
        trackOpens: true,
        trackClicks: true,
        sendingWindowStart: '09:00',
        sendingWindowEnd: '17:00',
        timezone: 'UTC',
        emailAccount: 'default',
        unsubscribeText: 'If you no longer wish to receive these emails, you can unsubscribe here.',
        footerText: 'This email was sent by {company_name}. You received this email because you signed up for our newsletter.',
        averageDelay: '30',
        sendingPriority: 'followups_first',
        emailDelay: '60',
        batchSize: '50',
        priority: 'normal',
        retryAttempts: '3',
        pauseBetweenBatches: '5',
        respectSendingWindow: true,
    });

    // Deliverability state
    const [selectedWarmupAccountId, setSelectedWarmupAccountId] = useState<number | ''>('');
    const [warmupProfileForm, setWarmupProfileForm] = useState({
        domain: '',
        start_volume: 20,
        ramp_increment: 5,
        ramp_interval_days: 3,
        target_volume: 120,
        maintenance_volume: 20,
        pause_on_issue: true,
        warmup_daily_limit: 120,
    });
    const [dnsDomain, setDnsDomain] = useState('');
    const [dkimSelector, setDkimSelector] = useState('default');
    const [dnsResult, setDnsResult] = useState<DnsCheckResult | null>(null);

    // Load settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settingsData = await api.getSettings();
                if (settingsData) {
                    setEmailSettings(prev => ({
                        ...prev,
                        trackOpens: settingsData.trackOpens ?? prev.trackOpens,
                        trackClicks: settingsData.trackClicks ?? prev.trackClicks,
                        sendingWindowStart: settingsData.sendingWindowStart ?? prev.sendingWindowStart,
                        sendingWindowEnd: settingsData.sendingWindowEnd ?? prev.sendingWindowEnd,
                        timezone: settingsData.timezone ?? prev.timezone,
                        emailAccount: settingsData.emailAccount ?? prev.emailAccount,
                        unsubscribeText: settingsData.unsubscribeText ?? prev.unsubscribeText,
                        footerText: settingsData.footerText ?? prev.footerText,
                        averageDelay: String(settingsData.averageDelay ?? prev.averageDelay),
                        sendingPriority: settingsData.sendingPriority ?? prev.sendingPriority,
                        emailDelay: String(settingsData.emailDelay ?? prev.emailDelay),
                        batchSize: String(settingsData.batchSize ?? prev.batchSize),
                        priority: settingsData.priority ?? prev.priority,
                        retryAttempts: String(settingsData.retryAttempts ?? prev.retryAttempts),
                        pauseBetweenBatches: String(settingsData.pauseBetweenBatches ?? prev.pauseBetweenBatches),
                        respectSendingWindow: settingsData.respectSendingWindow ?? prev.respectSendingWindow,
                    }));
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        };
        loadSettings();
    }, []);

    const updateEmailSetting = (key: string, value: any) => {
        setEmailSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveSettings = async () => {
        try {
            await api.updateSettings(emailSettings);
            toast({
                title: 'Settings saved',
                description: 'Your email settings have been updated successfully.',
            });
        } catch (err) {
            toast({
                title: 'Save failed',
                description: 'Could not save email settings. Please try again.',
                variant: 'destructive',
            });
        }
    };

    // Queries
    const { data: sendingAccounts = [], isLoading: isLoadingSendingAccounts } = useQuery({
        queryKey: ['sendingAccounts'],
        queryFn: api.getSendingAccounts
    });

    const {
        data: deliverabilityAccounts = [],
        isLoading: isLoadingDeliverability,
        isFetching: isFetchingDeliverability,
        refetch: refetchDeliverability,
    } = useQuery<DeliverabilityAccount[]>({
        queryKey: ['deliverabilityAccounts'],
        queryFn: () => api.getDeliverabilityAccounts(),
    });

    const invalidateDeliverabilityAccounts = () =>
        queryClient.invalidateQueries({ queryKey: ['deliverabilityAccounts'] });

    // Mutations
    const createWarmupProfileMutation = useMutation({
        mutationFn: (payload: WarmupProfilePayload) => api.createWarmupProfile(payload),
        onSuccess: () => {
            toast({ title: 'Warmup profile saved', description: 'Settings applied successfully.' });
            setWarmupProfileForm(prev => ({ ...prev, domain: '' }));
            setSelectedWarmupAccountId('');
            invalidateDeliverabilityAccounts();
        },
        onError: (error: Error) => toast({ title: 'Unable to save profile', description: error.message, variant: 'destructive' }),
    });

    const pauseWarmupProfileMutation = useMutation({
        mutationFn: ({ profileId, reason }: { profileId: number; reason?: string }) =>
            api.pauseWarmupProfile(profileId, reason),
        onSuccess: () => {
            toast({ title: 'Profile paused' });
            invalidateDeliverabilityAccounts();
        },
        onError: (error: Error) => toast({ title: 'Pause failed', description: error.message, variant: 'destructive' }),
    });

    const resumeWarmupProfileMutation = useMutation({
        mutationFn: (profileId: number) => api.resumeWarmupProfile(profileId),
        onSuccess: () => {
            toast({ title: 'Profile resumed' });
            invalidateDeliverabilityAccounts();
        },
        onError: (error: Error) => toast({ title: 'Resume failed', description: error.message, variant: 'destructive' }),
    });

    const scheduleWarmupRunsMutation = useMutation({
        mutationFn: (runDate?: string) => api.scheduleWarmupRuns(runDate),
        onSuccess: (res) => {
            toast({ title: 'Warmup queue scheduled', description: `${res.scheduled} account(s) queued for ${res.run_date}.` });
            invalidateDeliverabilityAccounts();
        },
        onError: (error: Error) => toast({ title: 'Schedule failed', description: error.message, variant: 'destructive' }),
    });

    const dnsCheckMutation = useMutation({
        mutationFn: ({ domain, selector }: { domain: string; selector?: string }) => api.checkDns(domain, selector),
        onSuccess: (result) => {
            setDnsResult(result);
            toast({ title: 'DNS check completed', description: 'Latest DNS records were captured.' });
            invalidateDeliverabilityAccounts();
        },
        onError: (error: Error) => toast({ title: 'DNS check failed', description: error.message, variant: 'destructive' }),
    });

    const createSendingAccountMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const provider = formData.get('provider') as 'gmail' | 'smtp';
            const accountName = formData.get('name') as string;
            const email = formData.get('email') as string;

            if (provider === 'gmail') {
                const data = await api.initiateGmailOAuth({
                    account_name: accountName,
                    email: email,
                    daily_limit: parseInt(formData.get('dailyLimit') as string) || 100
                });

                if (data && data.auth_url) {
                    localStorage.setItem('pendingOAuthAccount', JSON.stringify({
                        name: accountName,
                        email: email,
                        provider: 'gmail',
                        dailyLimit: parseInt(formData.get('dailyLimit') as string) || 100
                    }));
                    window.location.href = data.auth_url;
                    return null;
                }
            } else if (provider === 'smtp') {
                const smtpHost = formData.get('smtpHost') as string;
                const smtpPort = formData.get('smtpPort') as string;
                const smtpPassword = formData.get('smtpPassword') as string;

                return await api.addSendingAccount({
                    name: accountName,
                    email: email,
                    provider,
                    status: 'active',
                    dailyLimit: parseInt(formData.get('dailyLimit') as string) || 100,
                    smtpHost: smtpHost,
                    smtpPort: parseInt(smtpPort),
                    smtpUsername: email,
                    smtpPassword: smtpPassword,
                    smtpEncryption: 'tls'
                });
            }
            return null;
        },
        onSuccess: (data) => {
            if (data) {
                toast({ title: 'Sending account added', description: 'Your new email account is ready to use.' });
                setIsSendingAccountDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['sendingAccounts'] });
            }
        },
        onError: (err) => {
            toast({
                title: 'Failed to add account',
                description: err instanceof Error ? err.message : 'Something went wrong',
                variant: 'destructive'
            });
        }
    });

    const deleteSendingAccountMutation = useMutation({
        mutationFn: api.deleteSendingAccount,
        onSuccess: () => {
            toast({ title: 'Sending account deleted' });
            queryClient.invalidateQueries({ queryKey: ['sendingAccounts'] });
        },
        onError: (err) => {
            toast({
                title: 'Delete failed',
                description: err instanceof Error ? err.message : 'Something went wrong',
                variant: 'destructive'
            });
        }
    });

    const toggleSendingAccountStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) => api.updateSendingAccount(id, { status }),
        onSuccess: () => {
            toast({ title: 'Account status updated' });
            queryClient.invalidateQueries({ queryKey: ['sendingAccounts'] });
        },
        onError: (err) => {
            toast({
                title: 'Update failed',
                description: err instanceof Error ? err.message : 'Something went wrong',
                variant: 'destructive'
            });
        }
    });

    // Handlers
    const handleAddSendingAccount = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        createSendingAccountMutation.mutate(formData);
    };

    const handleDeleteSendingAccount = (id: number) => {
        deleteSendingAccountMutation.mutate(id);
    };

    const handleToggleSendingAccountStatus = (id: number, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'paused' : 'active';
        toggleSendingAccountStatusMutation.mutate({ id, status: newStatus });
    };

    const handleWarmupProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedWarmupAccountId) {
            toast({ title: 'Select an account first', variant: 'destructive' });
            return;
        }

        const payload: WarmupProfilePayload = {
            sending_account_id: Number(selectedWarmupAccountId),
            domain: warmupProfileForm.domain || undefined,
            start_volume: Number(warmupProfileForm.start_volume) || 1,
            ramp_increment: Number(warmupProfileForm.ramp_increment) || 1,
            ramp_interval_days: Number(warmupProfileForm.ramp_interval_days) || 1,
            target_volume: Number(warmupProfileForm.target_volume) || 10,
            maintenance_volume: Number(warmupProfileForm.maintenance_volume) || 5,
            pause_on_issue: warmupProfileForm.pause_on_issue,
            warmup_daily_limit: Number(warmupProfileForm.warmup_daily_limit) || undefined,
        };

        createWarmupProfileMutation.mutate(payload);
    };

    const handleDnsRun = () => {
        if (!dnsDomain) {
            toast({ title: 'Enter a domain first', variant: 'destructive' });
            return;
        }
        dnsCheckMutation.mutate({ domain: dnsDomain, selector: dkimSelector });
    };

    const prefillSMTPDefaults = (host: string, port: string) => {
        if (sendingAccountFormRef.current) {
            const hostInput = sendingAccountFormRef.current.querySelector('#smtpHost') as HTMLInputElement;
            const portInput = sendingAccountFormRef.current.querySelector('#smtpPort') as HTMLInputElement;
            if (hostInput) hostInput.value = host;
            if (portInput) portInput.value = port;
        }
    };

    const warmingAccounts = useMemo(() =>
        deliverabilityAccounts.filter(account => ['active', 'scheduled'].includes(account.warmup_status)),
        [deliverabilityAccounts]);

    const pausedAccounts = useMemo(() =>
        deliverabilityAccounts.filter(account => account.warmup_status === 'paused'),
        [deliverabilityAccounts]);

    const dnsIssueAccounts = useMemo(() =>
        deliverabilityAccounts.filter(account => {
            const statuses = [account.dns?.spf, account.dns?.dkim, account.dns?.dmarc];
            return statuses.some(status => status === 'missing' || status === 'warning');
        }),
        [deliverabilityAccounts]);

    const averageDeliverabilityScore = useMemo(() => {
        if (!deliverabilityAccounts.length) return 0;
        const total = deliverabilityAccounts.reduce((sum, account) => sum + (account.deliverability_score || 0), 0);
        return Math.round(total / deliverabilityAccounts.length);
    }, [deliverabilityAccounts]);

    const availableForWarmup = useMemo(() =>
        deliverabilityAccounts.filter(account => !account.profile),
        [deliverabilityAccounts]);

    const renderDnsBadge = (label: string, status: string | undefined) => {
        const value = status || 'unknown';
        return (
            <Badge key={`${label}-${value}`} className={warmupStatusVariant(value)}>
                {label}: {value}
            </Badge>
        );
    };

    return (
        <div className="container max-w-7xl py-6 space-y-8 animate-in fade-in duration-500">
            <SEO title="Email Settings | Xordon" description="Manage your email sending accounts, campaigns, and deliverability." />

            <div className="flex flex-col gap-1">
                <h1 className="text-[18px] font-bold tracking-tight">Email Infrastructure & Campaigns</h1>
                <p className="text-sm text-muted-foreground">
                    Manage sending accounts, monitor deliverability, and configure campaign defaults.
                </p>
            </div>

            {/* 1. Infrastructure: Sending Accounts */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 border-b pb-2">
                    <Server className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Sending Inboxes & Accounts</h2>
                </div>

                <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20 backdrop-blur-sm shadow-sm">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-sm">
                                <strong>Gmail OAuth Setup:</strong> Connect your Gmail accounts securely via OAuth2 for better deliverability and easier management.
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open('/GMAIL_OAUTH_SETUP.md', '_blank')}
                                className="h-8 text-xs font-medium border-blue-200 hover:bg-blue-100"
                            >
                                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                OAuth Setup Guide
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>

                <Card className="shadow-premium border-none bg-white/50 backdrop-blur-md">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6">
                        <div className="space-y-1">
                            <CardTitle className="text-base">Identity Management</CardTitle>
                            <CardDescription>Configure SMTP or Gmail accounts for your outreach campaigns.</CardDescription>
                        </div>
                        <Dialog open={isSendingAccountDialogOpen} onOpenChange={setIsSendingAccountDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-hunter-orange hover:bg-hunter-orange/90 text-white shadow-lg shadow-hunter-orange/20">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Connect New Account
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader className="pb-4">
                                    <DialogTitle>Add Sending Account</DialogTitle>
                                    <DialogDescription>
                                        Choose your provider and configure authentication.
                                    </DialogDescription>
                                </DialogHeader>
                                <form ref={sendingAccountFormRef} onSubmit={handleAddSendingAccount} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Account Display Name *</Label>
                                            <Input id="name" name="name" placeholder="Sales Primary - John" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address *</Label>
                                            <Input id="email" name="email" type="email" placeholder="john@company.com" required />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Provider Type</Label>
                                        <Select
                                            name="provider"
                                            value={selectedEmailProvider}
                                            onValueChange={(value) => setSelectedEmailProvider(value as 'gmail' | 'smtp')}
                                            required
                                        >
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Select provider" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="gmail">
                                                    <div className="flex items-center">
                                                        <Mail className="h-4 w-4 mr-2 text-red-500" />
                                                        Gmail / Google Workspace (OAuth2)
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="smtp">
                                                    <div className="flex items-center">
                                                        <Server className="h-4 w-4 mr-2 text-slate-500" />
                                                        Custom SMTP (Outlook, AWS SES, Zoho)
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {selectedEmailProvider === 'smtp' && (
                                        <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-500">SMTP Server Config</h4>
                                                <div className="flex gap-1.5 flex-wrap">
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="xs"
                                                        className="text-[10px] h-6 px-2"
                                                        onClick={() => prefillSMTPDefaults('smtp.gmail.com', '587')}
                                                    >
                                                        Gmail
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="xs"
                                                        className="text-[10px] h-6 px-2"
                                                        onClick={() => prefillSMTPDefaults('smtp-mail.outlook.com', '587')}
                                                    >
                                                        Outlook
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="xs"
                                                        className="text-[10px] h-6 px-2"
                                                        onClick={() => prefillSMTPDefaults('smtp.office365.com', '587')}
                                                    >
                                                        365
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="sm:col-span-2 space-y-1.5">
                                                    <Label htmlFor="smtpHost" className="text-xs">Host</Label>
                                                    <Input id="smtpHost" name="smtpHost" placeholder="smtp.provider.com" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="smtpPort" className="text-xs">Port</Label>
                                                    <Input id="smtpPort" name="smtpPort" type="number" defaultValue="587" />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="smtpPassword" className="text-xs">Password / App Key</Label>
                                                <Input id="smtpPassword" name="smtpPassword" type="password" />
                                                <p className="text-[10px] text-muted-foreground italic flex items-center gap-1 mt-1">
                                                    <ShieldCheck className="h-3 w-3" /> Encrypted at rest using AES-256.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="dailyLimit">Daily Sending Cap</Label>
                                            <span className="text-[10px] font-bold text-hunter-orange px-1.5 py-0.5 bg-hunter-orange/10 rounded">Max 2000</span>
                                        </div>
                                        <Input id="dailyLimit" name="dailyLimit" type="number" defaultValue="500" min="1" max="2000" />
                                        <p className="text-[10px] text-muted-foreground">
                                            Lower limits recommended for new accounts to prevent spam flagging.
                                        </p>
                                    </div>

                                    <DialogFooter className="pt-4 border-t gap-2">
                                        <Button type="button" variant="ghost" onClick={() => setIsSendingAccountDialogOpen(false)}>Cancel</Button>
                                        <Button type="submit" className="bg-hunter-orange text-white" disabled={createSendingAccountMutation.isPending}>
                                            {createSendingAccountMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                            Add Account
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {isLoadingSendingAccounts ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-hunter-orange" />
                            </div>
                        ) : sendingAccounts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 border-2 border-dashed rounded-2xl bg-slate-50/50">
                                <div className="p-4 bg-white rounded-full shadow-sm">
                                    <Mail className="h-10 w-10 text-slate-400" />
                                </div>
                                <div className="max-w-sm space-y-1">
                                    <h3 className="text-sm font-bold">No Sending Identities Found</h3>
                                    <p className="text-xs text-muted-foreground">
                                        You haven't connected any email accounts yet. Add one to start your outreach campaigns.
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setIsSendingAccountDialogOpen(true)}>
                                    Get Started →
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-[300px] text-xs font-bold uppercase tracking-wider py-4">Identity / Email</TableHead>
                                            <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Provider</TableHead>
                                            <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Status</TableHead>
                                            <TableHead className="text-xs font-bold uppercase tracking-wider py-4">Today's Volume</TableHead>
                                            <TableHead className="text-right py-4">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sendingAccounts.map((account) => (
                                            <TableRow key={account.id} className="group hover:bg-slate-50/30 transition-colors">
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-slate-700">{account.name}</span>
                                                        <span className="text-xs text-slate-500 font-medium">{account.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] px-2 py-0.5">
                                                        {account.provider === 'gmail' ? <><Mail className="h-2.5 w-2.5 mr-1" /> GMAIL</> : <><Server className="h-2.5 w-2.5 mr-1" /> SMTP</>}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`h-2 w-2 rounded-full ${account.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-300'}`} />
                                                        <span className={`text-xs font-bold capitalize ${account.status === 'active' ? 'text-green-600' : 'text-slate-500'}`}>
                                                            {account.status}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="space-y-1.5 w-32">
                                                        <div className="flex justify-between text-[10px] font-bold">
                                                            <span>{account.sentToday} sent</span>
                                                            <span>{Math.round((account.sentToday / account.dailyLimit) * 100)}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all duration-500 ${(account.sentToday / account.dailyLimit) > 0.8 ? 'bg-red-400' : 'bg-blue-400'}`}
                                                                style={{ width: `${Math.min((account.sentToday / account.dailyLimit) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 hover:bg-slate-100 text-slate-500"
                                                            onClick={() => handleToggleSendingAccountStatus(account.id, account.status)}
                                                        >
                                                            {account.status === 'active' ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500 text-slate-500">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Disconnect Account</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete the sending identity for <strong>{account.email}</strong>? This will stop all active campaigns using this account.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Keep it</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteSendingAccount(account.id)} className="bg-red-500 text-white">Disconnect</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>

            {/* 2. Intelligence: Deliverability & Warmup */}
            <section className="space-y-6">
                <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-green-500" />
                        <h2 className="text-lg font-semibold">Deliverability & Global Warmup</h2>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs font-bold" onClick={() => refetchDeliverability()} disabled={isFetchingDeliverability}>
                            <RefreshCcw className={`h-3 w-3 mr-1.5 ${isFetchingDeliverability ? 'animate-spin' : ''}`} />
                            Sync Health
                        </Button>
                        <Button variant="secondary" size="sm" className="h-8 text-xs font-bold" onClick={() => scheduleWarmupRunsMutation.mutate(undefined)}>
                            <Zap className="h-3 w-3 mr-1.5 text-amber-500" />
                            Force Daily Queue
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-none shadow-sm">
                        <CardContent className="pt-6">
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Active Warmups</div>
                            <div className="text-2xl font-bold">{warmingAccounts.length}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-none shadow-sm">
                        <CardContent className="pt-6">
                            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Paused/Idle</div>
                            <div className="text-2xl font-bold">{pausedAccounts.length}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border-none shadow-sm">
                        <CardContent className="pt-6">
                            <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">DNS Critical</div>
                            <div className="text-2xl font-bold">{dnsIssueAccounts.length}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-none shadow-sm">
                        <CardContent className="pt-6">
                            <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Global Health</div>
                            <div className="text-2xl font-bold">{averageDeliverabilityScore}%</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2 shadow-premium border-none">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-bold">Reputation Monitor</CardTitle>
                                <CardDescription className="text-xs">Individual account health metrics.</CardDescription>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-bold text-slate-500">Live Feedback</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent text-[10px] font-bold uppercase text-slate-500">
                                            <TableHead>Account</TableHead>
                                            <TableHead>Warmup Status</TableHead>
                                            <TableHead>Rep Score</TableHead>
                                            <TableHead>DNS Health</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {deliverabilityAccounts.map(account => (
                                            <TableRow key={account.id} className="hover:bg-slate-50/50">
                                                <TableCell className="py-4">
                                                    <div className="font-bold text-xs">{account.name}</div>
                                                    <div className="text-[10px] text-slate-500">{account.email}</div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Badge className={`${warmupStatusVariant(account.warmup_status)} text-[10px] border-none font-bold uppercase px-1.5 h-5`}>
                                                        {account.warmup_status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-sm font-bold ${account.deliverability_score > 90 ? 'text-green-600' : 'text-amber-600'}`}>
                                                            {account.deliverability_score}%
                                                        </span>
                                                        {account.deliverability_score < 80 && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 uppercase text-[9px] font-bold tracking-tighter">
                                                    <div className="flex gap-1">
                                                        {renderDnsBadge('S', account.dns?.spf)}
                                                        {renderDnsBadge('D', account.dns?.dkim)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="xs"
                                                            className="h-7 w-7 p-0"
                                                            onClick={() => {
                                                                const domainValue = account.domain || account.email.split('@')[1];
                                                                setDnsDomain(domainValue || '');
                                                                dnsCheckMutation.mutate({ domain: domainValue || '', selector: dkimSelector });
                                                            }}
                                                        >
                                                            <MailCheck className="h-3.5 w-3.5 text-blue-500" />
                                                        </Button>
                                                        {account.profile ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="xs"
                                                                className="h-7 w-7 p-0"
                                                                onClick={() => account.warmup_status === 'paused' ? resumeWarmupProfileMutation.mutate(account.profile!.id) : pauseWarmupProfileMutation.mutate({ profileId: account.profile!.id })}
                                                            >
                                                                {account.warmup_status === 'paused' ? <PlayCircle className="h-3.5 w-3.5 text-green-500" /> : <PauseCircle className="h-3.5 w-3.5 text-slate-500" />}
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="xs"
                                                                className="h-7 px-2 text-[10px] font-bold"
                                                                onClick={() => {
                                                                    setSelectedWarmupAccountId(account.id);
                                                                    setWarmupProfileForm(prev => ({ ...prev, domain: account.domain || account.email.split('@')[1] || '' }));
                                                                }}
                                                            >
                                                                Configure
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="shadow-premium border-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold">Smart Warmup Ramp</CardTitle>
                                <CardDescription className="text-xs">Scale your volume safely.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold">Target Account</Label>
                                    <Select
                                        value={selectedWarmupAccountId.toString()}
                                        onValueChange={(val) => {
                                            const id = Number(val);
                                            setSelectedWarmupAccountId(id);
                                            const acc = deliverabilityAccounts.find(a => a.id === id);
                                            if (acc) setWarmupProfileForm(prev => ({ ...prev, domain: acc.domain || acc.email.split('@')[1] || '' }));
                                        }}
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Select Inbox" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {deliverabilityAccounts.map(a => (
                                                <SelectItem key={a.id} value={a.id.toString()} className="text-xs">{a.email}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold">Start Vol</Label>
                                        <Input className="h-8 text-xs font-bold" type="number" value={warmupProfileForm.start_volume} onChange={(e) => setWarmupProfileForm(p => ({ ...p, start_volume: Number(e.target.value) }))} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold">Goal Vol</Label>
                                        <Input className="h-8 text-xs font-bold" type="number" value={warmupProfileForm.target_volume} onChange={(e) => setWarmupProfileForm(p => ({ ...p, target_volume: Number(e.target.value) }))} />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="space-y-0.5">
                                        <div className="text-[11px] font-bold">Auto-Throttle</div>
                                        <p className="text-[9px] text-muted-foreground">Pause on spam spikes</p>
                                    </div>
                                    <Switch checked={warmupProfileForm.pause_on_issue} onCheckedChange={(val) => setWarmupProfileForm(p => ({ ...p, pause_on_issue: val }))} />
                                </div>

                                <Button className="w-full bg-slate-900 text-white font-bold h-9 text-xs shadow-lg shadow-slate-200" onClick={(e) => handleWarmupProfileSubmit(e as any)}>
                                    Apply Warming Profile
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="shadow-premium border-none bg-hunter-orange/5 border border-hunter-orange/10">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold text-hunter-orange">DNS Compliance Checker</CardTitle>
                                <CardDescription className="text-xs">Check current live records.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold">Domain to Inspection</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            className="h-8 text-xs font-bold border-hunter-orange/20"
                                            placeholder="domain.com"
                                            value={dnsDomain}
                                            onChange={(e) => setDnsDomain(e.target.value)}
                                        />
                                        <Button variant="ghost" size="xs" className="h-8 w-8 p-0 bg-hunter-orange/10 text-hunter-orange" onClick={handleDnsRun}>
                                            <MailCheck className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                {dnsResult && (
                                    <div className="p-2.5 bg-white border border-hunter-orange/20 rounded-lg space-y-2">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                                            <span>Status: {dnsResult.issues.length === 0 ? 'Verified' : 'Issues Found'}</span>
                                            {dnsResult.issues.length === 0 ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
                                        </div>
                                        {dnsResult.issues.map(issue => (
                                            <div key={issue} className="text-[10px] text-red-600 font-medium flex items-center gap-1.5">
                                                <AlertTriangle className="h-3 w-3" /> {issue}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* 3. Logic: Campaign Defaults */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 border-b pb-2">
                    <Settings className="h-5 w-5 text-slate-700" />
                    <h2 className="text-lg font-semibold">Campaign Operations & Compliance</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="shadow-premium border-none overflow-hidden">
                        <CardHeader className="bg-slate-50/50 pb-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-slate-500" /> Sending Windows
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Active Start</Label>
                                    <Input type="time" value={emailSettings.sendingWindowStart} onChange={(e) => updateEmailSetting('sendingWindowStart', e.target.value)} className="font-medium" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Active End</Label>
                                    <Input type="time" value={emailSettings.sendingWindowEnd} onChange={(e) => updateEmailSetting('sendingWindowEnd', e.target.value)} className="font-medium" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Operation Timezone</Label>
                                <Select value={emailSettings.timezone} onValueChange={(v) => updateEmailSetting('timezone', v)}>
                                    <SelectTrigger className="font-medium text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UTC">UTC (Universal)</SelectItem>
                                        <SelectItem value="America/New_York">Eastern Time (US)</SelectItem>
                                        <SelectItem value="America/Los_Angeles">Pacific Time (US)</SelectItem>
                                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                                        <SelectItem value="Asia/Kolkata">IST (India)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-muted-foreground italic">
                                    Campaigns will only transmit during these hours in the selected timezone.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-premium border-none overflow-hidden">
                        <CardHeader className="bg-slate-50/50 pb-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Zap className="h-4 w-4 text-amber-500" /> Throttle & Logic
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold">Avg Delay Between Emails</Label>
                                    <span className="text-[10px] font-bold text-slate-500">{emailSettings.averageDelay}s</span>
                                </div>
                                <Input type="number" min="10" value={emailSettings.averageDelay} onChange={(e) => updateEmailSetting('averageDelay', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Queue Priority</Label>
                                <Select value={emailSettings.sendingPriority} onValueChange={(v) => updateEmailSetting('sendingPriority', v)}>
                                    <SelectTrigger className="font-medium text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="followups_first text-xs">Follow-ups First (Retain Momentum)</SelectItem>
                                        <SelectItem value="initial_first text-xs">New Leads First (Maximize Reach)</SelectItem>
                                        <SelectItem value="mixed text-xs">Round Robin (Balanced)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-premium border-none">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-500" /> Compliance & Tracking
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="space-y-1">
                                        <div className="text-sm font-bold">Open Rate Tracking</div>
                                        <p className="text-[10px] text-muted-foreground">Inject micro-pixel for open detection.</p>
                                    </div>
                                    <Switch checked={emailSettings.trackOpens} onCheckedChange={(v) => updateEmailSetting('trackOpens', v)} />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="space-y-1">
                                        <div className="text-sm font-bold">Click-Through Tracking</div>
                                        <p className="text-[10px] text-muted-foreground">Rewrite URLs via tracking proxy.</p>
                                    </div>
                                    <Switch checked={emailSettings.trackClicks} onCheckedChange={(v) => updateEmailSetting('trackClicks', v)} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Global Unsubscribe Footer</Label>
                                    <Textarea
                                        className="text-xs min-h-[80px] rounded-xl border-slate-200"
                                        value={emailSettings.unsubscribeText}
                                        onChange={(e) => updateEmailSetting('unsubscribeText', e.target.value)}
                                        placeholder="If you no longer wish to receive these emails, click here {{unsubscribeUrl}}"
                                    />
                                    <p className="text-[10px] text-muted-foreground italic flex gap-1">
                                        <AlertCircle className="h-3 w-3" /> Mandatory in most jurisdictions (CAN-SPAM/GDPR).
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label className="text-xs font-bold">Internal Mailing Footer (All Emails)</Label>
                            <Textarea
                                className="text-xs min-h-[60px] rounded-xl border-slate-200"
                                value={emailSettings.footerText}
                                onChange={(e) => updateEmailSetting('footerText', e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50/30 border-t py-4">
                        <Button onClick={handleSaveSettings} className="ml-auto bg-slate-900 text-white font-bold shadow-lg shadow-slate-200">
                            Commit Global Email Config
                        </Button>
                    </CardFooter>
                </Card>
            </section>
        </div>
    );
};

export default EmailSettings;
