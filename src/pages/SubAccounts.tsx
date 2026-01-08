import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
    Building, Plus, Search, Users, Mail, Phone, Globe,
    MoreVertical, ArrowRightLeft, Trash2, Edit, RefreshCw,
    Calendar, MapPin, Zap, CheckCircle, Activity
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import multiTenantApi from '@/services/multiTenantApi';
import type { Agency, Subaccount, SubaccountMember, CreateSubaccountRequest, SubaccountSettings } from '@/types/multiTenant';
import { useTenantOptional } from '@/contexts/TenantContext';

const INDUSTRIES = [
    'Marketing Agency',
    'Real Estate',
    'Healthcare',
    'Legal Services',
    'Financial Services',
    'E-commerce',
    'SaaS',
    'Consulting',
    'Construction',
    'Education',
    'Other'
];

const TIMEZONES = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney',
    'UTC'
];

export default function SubAccounts() {
    const { toast } = useToast();
    const tenantContext = useTenantOptional();
    const subaccountLabel = tenantContext?.subaccountLabel ?? 'Sub-Account';
    const subaccountLabelPlural = tenantContext?.subaccountLabelPlural ?? 'Sub-Accounts';

    const [agency, setAgency] = useState<Agency | null>(null);
    const [subaccounts, setSubaccounts] = useState<Subaccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newSubaccount, setNewSubaccount] = useState<CreateSubaccountRequest>({
        name: '',
        industry: '',
        timezone: 'America/New_York',
        email: '',
        phone: '',
        website: ''
    });

    // Team management state
    const [teamDialogOpen, setTeamDialogOpen] = useState(false);
    const [selectedSubaccount, setSelectedSubaccount] = useState<Subaccount | null>(null);
    const [members, setMembers] = useState<SubaccountMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'user' | 'readonly'>('user');
    const [inviting, setInviting] = useState(false);

    // Settings management state
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
    const [settings, setSettings] = useState<SubaccountSettings | null>(null);
    const [loadingSettings, setLoadingSettings] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const agencyData = await multiTenantApi.getCurrentAgency();
            if (agencyData) {
                setAgency(agencyData);
                const result = await multiTenantApi.listSubaccounts(agencyData.id);
                setSubaccounts(result.items || []);
            }
        } catch (err) {
            console.error('Failed to load data:', err);
            toast({ title: 'Error', description: 'Failed to load sub-accounts.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }

    async function createSubaccount() {
        if (!agency || !newSubaccount.name.trim()) return;
        try {
            setCreating(true);
            const result = await multiTenantApi.createSubaccount(agency.id, newSubaccount);
            setSubaccounts([...subaccounts, result as Subaccount]);
            setCreateDialogOpen(false);
            setNewSubaccount({ name: '', industry: '', timezone: 'America/New_York', email: '', phone: '', website: '' });
            toast({ title: 'Sub-account created', description: `${result.name} has been created successfully.` });
        } catch (err: any) {
            toast({ title: 'Error', description: err.message || 'Failed to create sub-account.', variant: 'destructive' });
        } finally {
            setCreating(false);
        }
    }

    async function deleteSubaccount(sub: Subaccount) {
        if (!confirm(`Are you sure you want to delete ${sub.name}?`)) return;

        try {
            await multiTenantApi.deleteSubaccount(sub.id);
            toast({ title: 'Deleted', description: `${subaccountLabel} removed successfully` });
            loadData();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    }

    async function handleManageTeam(sub: Subaccount) {
        setSelectedSubaccount(sub);
        setTeamDialogOpen(true);
        setLoadingMembers(true);
        try {
            const data = await multiTenantApi.getSubaccountMembers(sub.id);
            setMembers(data.items);
        } catch (error: any) {
            toast({ title: 'Error', description: 'Failed to load team members', variant: 'destructive' });
        } finally {
            setLoadingMembers(false);
        }
    }

    async function handleInviteMember() {
        if (!selectedSubaccount || !inviteEmail) return;

        setInviting(true);
        try {
            await multiTenantApi.inviteSubaccountMember(selectedSubaccount.id, {
                email: inviteEmail,
                role: inviteRole
            });
            toast({ title: 'Success', description: 'Invitation sent' });
            setInviteEmail('');
            // Refresh list
            const data = await multiTenantApi.getSubaccountMembers(selectedSubaccount.id);
            setMembers(data.items);
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setInviting(false);
        }
    }

    async function handleManageSettings(sub: Subaccount) {
        setSelectedSubaccount(sub);
        setSettingsDialogOpen(true);
        setLoadingSettings(true);
        try {
            const data = await multiTenantApi.getSubaccountSettings(sub.id);
            setSettings(data);
        } catch (error: any) {
            toast({ title: 'Error', description: 'Failed to load settings', variant: 'destructive' });
        } finally {
            setLoadingSettings(false);
        }
    }

    async function handleSaveSettings() {
        if (!selectedSubaccount || !settings) return;
        setSavingSettings(true);
        try {
            await multiTenantApi.updateSubaccountSettings(selectedSubaccount.id, settings);
            toast({ title: 'Success', description: 'Settings updated successfully' });
            setSettingsDialogOpen(false);
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setSavingSettings(false);
        }
    }

    async function switchToSubaccount(subaccountId: number) {
        try {
            await multiTenantApi.switchSubaccount(subaccountId);
            toast({ title: 'Switched', description: 'Now viewing sub-account context.' });
            // Optionally redirect or refresh page
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to switch context.', variant: 'destructive' });
        }
    }

    const filteredSubaccounts = subaccounts.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.industry?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!agency) {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="py-12 text-center">
                        <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Agency Found</h3>
                        <p className="text-muted-foreground">You need to be part of an agency to manage sub-accounts.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">{subaccountLabelPlural}</h1>
                    <p className="text-muted-foreground">
                        Manage your {subaccountLabelPlural.toLowerCase()} ({subaccounts.length} / {agency.max_subaccounts === -1 ? '∞' : agency.max_subaccounts})
                    </p>
                </div>

                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Create {subaccountLabel}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create {subaccountLabel}</DialogTitle>
                            <DialogDescription>
                                Add a new client business to your agency
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Business Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="Acme Corporation"
                                    value={newSubaccount.name}
                                    onChange={(e) => setNewSubaccount({ ...newSubaccount, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="industry">Industry</Label>
                                    <Select
                                        value={newSubaccount.industry}
                                        onValueChange={(v) => setNewSubaccount({ ...newSubaccount, industry: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select industry" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {INDUSTRIES.map(i => (
                                                <SelectItem key={i} value={i}>{i}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <Select
                                        value={newSubaccount.timezone}
                                        onValueChange={(v) => setNewSubaccount({ ...newSubaccount, timezone: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIMEZONES.map(tz => (
                                                <SelectItem key={tz} value={tz}>{tz.replace('_', ' ')}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Contact Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="contact@client.com"
                                    value={newSubaccount.email}
                                    onChange={(e) => setNewSubaccount({ ...newSubaccount, email: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        placeholder="+1 (555) 123-4567"
                                        value={newSubaccount.phone}
                                        onChange={(e) => setNewSubaccount({ ...newSubaccount, phone: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="website">Website</Label>
                                    <Input
                                        id="website"
                                        placeholder="https://client.com"
                                        value={newSubaccount.website}
                                        onChange={(e) => setNewSubaccount({ ...newSubaccount, website: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                            <Button onClick={createSubaccount} disabled={creating || !newSubaccount.name.trim()}>
                                {creating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                Create
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search & Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, or industry..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" onClick={loadData}>
                    <RefreshCw className="w-4 h-4" />
                </Button>
            </div>

            {/* Sub-account List */}
            {filteredSubaccounts.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">
                            {searchQuery ? `No matching ${subaccountLabelPlural.toLowerCase()}` : `No ${subaccountLabelPlural.toLowerCase()} yet`}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {searchQuery
                                ? 'Try adjusting your search query'
                                : `Create your first ${subaccountLabel.toLowerCase()} to start managing client businesses`}
                        </p>
                        {!searchQuery && (
                            <Button onClick={() => setCreateDialogOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create {subaccountLabel}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredSubaccounts.map((subaccount) => (
                        <Card key={subaccount.id} className="group hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                            {subaccount.logo_url ? (
                                                <img src={subaccount.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                subaccount.name.charAt(0).toUpperCase()
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold">{subaccount.name}</h3>
                                                <Badge variant={subaccount.status === 'active' ? 'default' : 'secondary'}>
                                                    {subaccount.status}
                                                </Badge>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                {subaccount.industry && (
                                                    <span className="flex items-center gap-1">
                                                        <Building className="w-3 h-3" />
                                                        {subaccount.industry}
                                                    </span>
                                                )}
                                                {subaccount.email && (
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {subaccount.email}
                                                    </span>
                                                )}
                                                {subaccount.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        {subaccount.phone}
                                                    </span>
                                                )}
                                                {subaccount.website && (
                                                    <a href={subaccount.website} target="_blank" rel="noopener noreferrer"
                                                        className="flex items-center gap-1 hover:text-primary">
                                                        <Globe className="w-3 h-3" />
                                                        {subaccount.website.replace(/^https?:\/\//, '')}
                                                    </a>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {subaccount.member_count || 0} members
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Added {new Date(subaccount.created_at).toLocaleDateString()}
                                                </span>
                                                {subaccount.city && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {subaccount.city}{subaccount.state ? `, ${subaccount.state}` : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => switchToSubaccount(subaccount.id)}
                                            className="gap-1"
                                        >
                                            <ArrowRightLeft className="w-4 h-4" />
                                            Switch
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Edit Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleManageTeam(subaccount)}>
                                                    <Users className="w-4 h-4 mr-2" />
                                                    Manage Team
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleManageSettings(subaccount)}>
                                                    <Zap className="w-4 h-4 mr-2" />
                                                    Manage Features
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => deleteSubaccount(subaccount)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Manage Team Dialog */}
            <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Manage Team - {selectedSubaccount?.name}</DialogTitle>
                        <DialogDescription>
                            Invite members to this {subaccountLabel.toLowerCase()} and manage their access roles.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 pt-4">
                        {/* Invite Section */}
                        <div className="flex items-end gap-3 p-4 bg-muted/50 rounded-lg">
                            <div className="grid gap-2 flex-1">
                                <Label htmlFor="invite-email">Invite New Member</Label>
                                <Input
                                    id="invite-email"
                                    placeholder="email@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2 w-32">
                                <Label>Role</Label>
                                <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="readonly">Readonly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleInviteMember} disabled={inviting || !inviteEmail}>
                                {inviting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                Invite
                            </Button>
                        </div>

                        {/* Members List */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-sm">Active & Invited Members</h4>
                            <div className="border rounded-md">
                                {loadingMembers ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading members...
                                    </div>
                                ) : members.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        No members found.
                                    </div>
                                ) : (
                                    <div className="divide-y text-sm">
                                        {members.map((member) => (
                                            <div key={member.id} className="p-3 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                        {(member.name || member.email).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{member.name || 'Invited User'}</div>
                                                        <div className="text-xs text-muted-foreground">{member.email}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                                                        {member.status}
                                                    </Badge>
                                                    <Badge variant="outline" className="capitalize">
                                                        {member.role.replace('subaccount_', '')}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Feature Management Dialog */}
            <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Manage Features: {selectedSubaccount?.name}</DialogTitle>
                        <DialogDescription>
                            Enable or disable specific modules and set resource limits for this {subaccountLabel.toLowerCase()}.
                        </DialogDescription>
                    </DialogHeader>

                    {loadingSettings ? (
                        <div className="py-20 text-center">
                            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">Loading settings...</p>
                        </div>
                    ) : (
                        <div className="space-y-6 py-4">
                            {/* Features Toggle */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-primary" />
                                    Active Modules
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: 'crm', label: 'CRM & Deals', description: 'Pipelines, deals, and lead tracking' },
                                        { id: 'email', label: 'Email Marketing', description: 'Campaigns, sequences and templates' },
                                        { id: 'sms', label: 'SMS Outreach', description: 'Text message campaigns and replies' },
                                        { id: 'calls', label: 'Cold Calling', description: 'Dialer, agents and call scripts' },
                                        { id: 'automations', label: 'Automations', description: 'Workflows and trigger-based actions' },
                                        { id: 'reporting', label: 'Advanced Reporting', description: 'Deep analytics and custom reports' },
                                        { id: 'ai', label: 'AI Features', description: 'AI agents, sentiment and content Gen' },
                                    ].map((f) => (
                                        <div key={f.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-medium">{f.label}</Label>
                                                <p className="text-[12px] text-muted-foreground">{f.description}</p>
                                            </div>
                                            <Switch
                                                checked={settings?.features?.[f.id] || false}
                                                onCheckedChange={(checked) => setSettings(s => s ? {
                                                    ...s,
                                                    features: { ...s.features, [f.id]: checked }
                                                } : null)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Limits */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-primary" />
                                    Resource Limits
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Max Contacts</Label>
                                        <Input
                                            type="number"
                                            value={settings?.limits?.contacts || 0}
                                            onChange={(e) => setSettings(s => s ? {
                                                ...s,
                                                limits: { ...s.limits, contacts: parseInt(e.target.value) }
                                            } : null)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Monthly Emails</Label>
                                        <Input
                                            type="number"
                                            value={settings?.limits?.emails_per_month || 0}
                                            onChange={(e) => setSettings(s => s ? {
                                                ...s,
                                                limits: { ...s.limits, emails_per_month: parseInt(e.target.value) }
                                            } : null)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSettings} disabled={savingSettings || loadingSettings}>
                            {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            Save Settings
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
