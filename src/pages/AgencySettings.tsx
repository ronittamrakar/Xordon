import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
    Building2, Palette, Globe, Users, Upload, Check, X,
    RefreshCw, Trash2, Plus, Shield, ExternalLink, Copy, Settings,
    Type, Mail, Layout, Eye, Code, Globe2, UserPlus
} from 'lucide-react';
import multiTenantApi from '@/services/multiTenantApi';
import type { Agency, AgencyBranding } from '@/types/multiTenant';
import AgencyTeam from '@/components/agency/AgencyTeam';

interface AgencyDomain {
    id: number;
    domain: string;
    domain_type: 'primary' | 'alias' | 'funnel';
    ssl_status: 'pending' | 'provisioning' | 'active' | 'failed';
    dns_verified: boolean;
    dns_txt_record?: string;
    is_active: boolean;
}

export default function AgencySettings() {
    const { toast } = useToast();

    const [agency, setAgency] = useState<Agency | null>(null);
    const [branding, setBranding] = useState<AgencyBranding | null>(null);
    const [domains, setDomains] = useState<AgencyDomain[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newDomain, setNewDomain] = useState('');
    const [addingDomain, setAddingDomain] = useState(false);

    useEffect(() => {
        loadAgencyData();
    }, []);

    async function loadAgencyData() {
        try {
            setLoading(true);
            const agencyData = await multiTenantApi.getCurrentAgency();
            if (agencyData) {
                setAgency(agencyData);
                const brandingData = await multiTenantApi.getAgencyBranding(agencyData.id);
                setBranding(brandingData);
                // Load domains
                const res = await fetch(`/api/mt/agencies/${agencyData.id}/domains`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
                });
                const domainsData = await res.json();
                setDomains(domainsData.items || []);
            }
        } catch (err) {
            console.error('Failed to load agency data:', err);
        } finally {
            setLoading(false);
        }
    }

    async function saveBranding() {
        if (!agency || !branding) return;
        try {
            setSaving(true);
            await multiTenantApi.updateAgencyBranding(agency.id, branding);
            toast({ title: 'Branding saved', description: 'Your changes have been saved.' });
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to save branding.', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    }

    async function addDomain() {
        if (!agency || !newDomain.trim()) return;
        try {
            setAddingDomain(true);
            const res = await fetch(`/api/mt/agencies/${agency.id}/domains`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ domain: newDomain.trim(), domain_type: 'alias' })
            });
            const data = await res.json();
            if (res.ok) {
                setDomains([...domains, data]);
                setNewDomain('');
                toast({ title: 'Domain added', description: 'Follow the DNS instructions to verify.' });
            } else {
                toast({ title: 'Error', description: data.error || 'Failed to add domain.', variant: 'destructive' });
            }
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to add domain.', variant: 'destructive' });
        } finally {
            setAddingDomain(false);
        }
    }

    async function verifyDomain(domainId: number) {
        if (!agency) return;
        try {
            const res = await fetch(`/api/mt/agencies/${agency.id}/domains/${domainId}/verify`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });
            const data = await res.json();
            if (data.verified) {
                toast({ title: 'Domain verified!', description: 'SSL is now active.' });
                loadAgencyData();
            } else {
                toast({ title: 'Verification failed', description: data.message, variant: 'destructive' });
            }
        } catch (err) {
            toast({ title: 'Error', description: 'Verification failed.', variant: 'destructive' });
        }
    }

    async function deleteDomain(domainId: number) {
        if (!agency || !confirm('Are you sure you want to delete this domain?')) return;
        try {
            await fetch(`/api/mt/agencies/${agency.id}/domains/${domainId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });
            setDomains(domains.filter(d => d.id !== domainId));
            toast({ title: 'Domain deleted' });
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to delete domain.', variant: 'destructive' });
        }
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied to clipboard' });
    }

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!agency) {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="py-12 text-center">
                        <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Agency Found</h3>
                        <p className="text-muted-foreground">You are not part of any agency yet.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">
                        Agency Settings
                    </h1>
                    <p className="text-sm text-muted-foreground">{agency.name}</p>
                </div>
                <Badge variant={agency.status === 'active' ? 'default' : 'secondary'}>
                    {agency.status}
                </Badge>
            </div>

            {/* Main Content - Vertical Sections */}
            <div className="space-y-8">
                {/* General Settings Section */}
                <section id="general" className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <Settings className="w-4 h-4 text-blue-500" />
                        <h3 className="text-base font-semibold">General Settings</h3>
                    </div>

                    <Card className="overflow-hidden border-none shadow-premium bg-background/50 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                Organization Type
                            </CardTitle>
                            <CardDescription>
                                Set the default terminology used for your sub-accounts throughout the platform.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {[
                                    { value: 'marketing_agency', label: 'Marketing Agency', description: 'Clients', icon: '🏢' },
                                    { value: 'franchise', label: 'Multi-Location', description: 'Locations', icon: '📍' },
                                    { value: 'retail', label: 'Retail / Commerce', description: 'Stores', icon: '🛍️' },
                                    { value: 'healthcare', label: 'Healthcare', description: 'Practices', icon: '🏥' },
                                    { value: 'single_business', label: 'Project-Based', description: 'Workspaces', icon: '🏠' },
                                    { value: 'other', label: 'Custom Brand', description: 'Default Label', icon: '⚙️' },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={async () => {
                                            if (!agency) return;
                                            try {
                                                await multiTenantApi.updateAgency(agency.id, { organization_type: option.value as any });
                                                setAgency({ ...agency, organization_type: option.value as any });
                                                toast({ title: 'Organization type updated', description: `Your sub-accounts will now be called "${option.description}"` });
                                            } catch (err) {
                                                toast({ title: 'Error', description: 'Failed to update organization type', variant: 'destructive' });
                                            }
                                        }}
                                        className={`group relative flex flex-col p-5 rounded-2xl border text-left transition-all duration-300 hover:shadow-lg ${agency?.organization_type === option.value
                                            ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary'
                                            : 'border-border/60 hover:border-primary/40 hover:bg-primary/[0.02]'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={`p-2.5 rounded-xl transition-colors ${agency?.organization_type === option.value ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary animate-pulse-subtle'}`}>
                                                <span className="text-xl leading-none">{option.icon}</span>
                                            </div>
                                            {agency?.organization_type === option.value && (
                                                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{option.label}</div>
                                            <div className="text-xs text-muted-foreground mt-1 line-clamp-1">Sub-accounts labeled as: <b>{option.description}</b></div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-border/40">
                                <div className="space-y-4 max-w-md">
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="custom_label" className="font-semibold text-sm">Fine-tune Sub-account Label</Label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="custom_label"
                                                placeholder="e.g. Clients, Locations, Workspaces"
                                                value={agency?.custom_subaccount_label || ''}
                                                className="pl-9 h-10 rounded-xl"
                                                onChange={(e) => setAgency(a => a ? { ...a, custom_subaccount_label: e.target.value } : null)}
                                            />
                                        </div>
                                        <p className="text-[12px] text-muted-foreground">
                                            Overrides the default name based on organization type. Leave empty to use defaults.
                                        </p>
                                    </div>

                                    <Button
                                        onClick={async () => {
                                            if (!agency) return;
                                            try {
                                                setSaving(true);
                                                await multiTenantApi.updateAgency(agency.id, {
                                                    custom_subaccount_label: agency.custom_subaccount_label
                                                });
                                                toast({ title: 'Terminology updated', description: 'Terminology labels have been successfully applied.' });
                                            } catch (err) {
                                                toast({ title: 'Error', description: 'Failed to update custom label', variant: 'destructive' });
                                            } finally {
                                                setSaving(false);
                                            }
                                        }}
                                        disabled={saving}
                                        className="rounded-xl px-6"
                                    >
                                        {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                        Save Custom Label
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-premium bg-background/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-bold">Agency Profile</CardTitle>
                            <CardDescription>Update your agency basic information and contact details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="agency_name">Agency Name</Label>
                                    <Input
                                        id="agency_name"
                                        value={agency.name}
                                        onChange={(e) => setAgency({ ...agency, name: e.target.value })}
                                        className="rounded-xl h-10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="agency_slug">Agency Slug (for white-label URLs)</Label>
                                    <div className="flex gap-1 items-center">
                                        <span className="text-muted-foreground text-xs font-mono">app.xordon.com/</span>
                                        <Input
                                            id="agency_slug"
                                            value={agency.slug}
                                            onChange={(e) => setAgency({ ...agency, slug: e.target.value })}
                                            className="rounded-xl h-10 font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={async () => {
                                        try {
                                            setSaving(true);
                                            await multiTenantApi.updateAgency(agency.id, {
                                                name: agency.name,
                                                slug: agency.slug
                                            });
                                            toast({ title: 'Settings saved' });
                                        } catch (err) {
                                            toast({ title: 'Error', description: 'Failed to update agency settings', variant: 'destructive' });
                                        } finally {
                                            setSaving(false);
                                        }
                                    }}
                                    disabled={saving}
                                    className="rounded-xl"
                                >
                                    {saving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                                    Update Profile
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Branding Section */}
                <section id="branding" className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <Palette className="w-4 h-4 text-purple-500" />
                        <h3 className="text-base font-semibold">Branding & Identity</h3>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Visual Identity */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Visual Identity</CardTitle>
                                <CardDescription>Customize your agency's look and feel</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Logo URL</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="https://example.com/logo.png"
                                            value={branding?.logo_url || ''}
                                            onChange={(e) => setBranding(b => b ? { ...b, logo_url: e.target.value } : null)}
                                        />
                                        <Button variant="outline" size="icon">
                                            <Upload className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    {branding?.logo_url && (
                                        <img src={branding.logo_url} alt="Logo preview" className="h-12 object-contain mt-2 bg-muted rounded p-2" />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Favicon URL</Label>
                                    <Input
                                        placeholder="https://example.com/favicon.ico"
                                        value={branding?.favicon_url || ''}
                                        onChange={(e) => setBranding(b => b ? { ...b, favicon_url: e.target.value } : null)}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Primary Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                value={branding?.primary_color || '#3B82F6'}
                                                onChange={(e) => setBranding(b => b ? { ...b, primary_color: e.target.value } : null)}
                                                className="w-12 h-10 p-1"
                                            />
                                            <Input
                                                value={branding?.primary_color || '#3B82F6'}
                                                onChange={(e) => setBranding(b => b ? { ...b, primary_color: e.target.value } : null)}
                                                className="flex-1 text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Secondary</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                value={branding?.secondary_color || '#1E40AF'}
                                                onChange={(e) => setBranding(b => b ? { ...b, secondary_color: e.target.value } : null)}
                                                className="w-12 h-10 p-1"
                                            />
                                            <Input
                                                value={branding?.secondary_color || '#1E40AF'}
                                                onChange={(e) => setBranding(b => b ? { ...b, secondary_color: e.target.value } : null)}
                                                className="flex-1 text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Accent</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                value={branding?.accent_color || '#10B981'}
                                                onChange={(e) => setBranding(b => b ? { ...b, accent_color: e.target.value } : null)}
                                                className="w-12 h-10 p-1"
                                            />
                                            <Input
                                                value={branding?.accent_color || '#10B981'}
                                                onChange={(e) => setBranding(b => b ? { ...b, accent_color: e.target.value } : null)}
                                                className="flex-1 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Type className="h-4 w-4 text-primary" />
                                        <Label className="font-semibold text-sm">Typography</Label>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Global Font Family</Label>
                                        <Select
                                            value={branding?.font_family || 'Inter'}
                                            onValueChange={(val) => setBranding(b => b ? { ...b, font_family: val } : null)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Inter">Inter (System Default)</SelectItem>
                                                <SelectItem value="Roboto">Roboto</SelectItem>
                                                <SelectItem value="Outfit">Outfit</SelectItem>
                                                <SelectItem value="Poppins">Poppins</SelectItem>
                                                <SelectItem value="Montserrat">Montserrat</SelectItem>
                                                <SelectItem value="Open Sans">Open Sans</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            This font will be applied to your dashboard and all public pages.
                                        </p>
                                    </div>

                                    <div className="p-4 border rounded-xl bg-muted/30">
                                        <div style={{ fontFamily: branding?.font_family }}>
                                            <h4 className="font-bold text-lg mb-1">Typography Preview</h4>
                                            <p className="text-sm opacity-80">
                                                The quick brown fox jumps over the lazy dog. 1234567890
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Branding Preview */}
                        <Card className="overflow-hidden border-none shadow-premium bg-gradient-to-br from-background to-muted/30">
                            <CardHeader>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-primary" />
                                    Branding Preview
                                </CardTitle>
                                <CardDescription>See how your agency will look to your clients</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Mock Dashboard Sidebar */}
                                <div className="border rounded-xl overflow-hidden shadow-lg bg-background">
                                    <div className="flex h-40">
                                        {/* Sidebar Mock */}
                                        <div
                                            className="w-16 h-full flex flex-col items-center py-4 gap-4"
                                            style={{ backgroundColor: branding?.primary_color || '#3B82F6' }}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                                {branding?.logo_url ? (
                                                    <img src={branding.logo_url} alt="Logo" className="w-5 h-5 object-contain" />
                                                ) : (
                                                    <div className="w-4 h-4 bg-white rounded-sm" />
                                                )}
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-white/10" />
                                            <div className="w-8 h-8 rounded-full bg-white/10" />
                                            <div className="w-8 h-8 rounded-full bg-white/10" />
                                        </div>
                                        {/* Content Mock */}
                                        <div className="flex-1 p-4 space-y-3 bg-muted/20">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="h-4 w-24 bg-muted rounded-full animate-pulse" />
                                                <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
                                            </div>
                                            <div className="h-16 w-full bg-white rounded-xl shadow-sm border p-3 flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                    style={{ backgroundColor: (branding?.accent_color || '#10B981') + '20' }}
                                                >
                                                    <div
                                                        className="w-5 h-5 rounded-sm"
                                                        style={{ backgroundColor: branding?.accent_color || '#10B981' }}
                                                    />
                                                </div>
                                                <div className="space-y-2 flex-1">
                                                    <div className="h-3 w-3/4 bg-muted rounded-full" />
                                                    <div className="h-2 w-1/2 bg-muted/60 rounded-full" />
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                className="w-full h-8 rounded-lg text-[12px]"
                                                style={{
                                                    backgroundColor: branding?.primary_color || '#3B82F6',
                                                    color: '#ffffff'
                                                }}
                                            >
                                                Primary Action
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Mock Button States */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Buttons</Label>
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                style={{ backgroundColor: branding?.primary_color || '#3B82F6' }}
                                                className="h-9"
                                            >
                                                Primary
                                            </Button>
                                            <Button
                                                variant="outline"
                                                style={{ borderColor: branding?.secondary_color || '#1E40AF', color: branding?.secondary_color || '#1E40AF' }}
                                                className="h-9"
                                            >
                                                Secondary
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Accents</Label>
                                        <div className="flex flex-col gap-2">
                                            <Badge
                                                style={{ backgroundColor: branding?.accent_color || '#10B981', color: '#fff' }}
                                                className="w-fit"
                                            >
                                                Success Badge
                                            </Badge>
                                            <div className="flex gap-2">
                                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: branding?.primary_color }} />
                                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: branding?.secondary_color }} />
                                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: branding?.accent_color }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Company Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Company Information</CardTitle>
                                <CardDescription>Shown in emails and login pages</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Company Name</Label>
                                    <Input
                                        placeholder="Your Agency Name"
                                        value={branding?.company_name || ''}
                                        onChange={(e) => setBranding(b => b ? { ...b, company_name: e.target.value } : null)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Support Email</Label>
                                    <Input
                                        type="email"
                                        placeholder="support@youragency.com"
                                        value={branding?.support_email || ''}
                                        onChange={(e) => setBranding(b => b ? { ...b, support_email: e.target.value } : null)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Support Phone</Label>
                                    <Input
                                        placeholder="+1 (555) 123-4567"
                                        value={branding?.support_phone || ''}
                                        onChange={(e) => setBranding(b => b ? { ...b, support_phone: e.target.value } : null)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Email Branding */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Mail className="h-4 w-4" /> Email Branding
                                </CardTitle>
                                <CardDescription>Customize how emails appear to your clients</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>From Name</Label>
                                    <Input
                                        placeholder="Your Agency"
                                        value={branding?.email_from_name || ''}
                                        onChange={(e) => setBranding(b => b ? { ...b, email_from_name: e.target.value } : null)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>From Email</Label>
                                    <Input
                                        type="email"
                                        placeholder="noreply@youragency.com"
                                        value={branding?.email_from_address || ''}
                                        onChange={(e) => setBranding(b => b ? { ...b, email_from_address: e.target.value } : null)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email Footer Text</Label>
                                    <Textarea
                                        placeholder="Your agency address, unsubscribe text, etc."
                                        value={branding?.email_footer_text || ''}
                                        onChange={(e) => setBranding(b => b ? { ...b, email_footer_text: e.target.value } : null)}
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Login Page Customization */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Layout className="h-4 w-4" /> Login Customization
                                </CardTitle>
                                <CardDescription>White-label your login and public pages</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Login Page Title</Label>
                                    <Input
                                        placeholder="Welcome to Your Agency"
                                        value={branding?.login_page_title || ''}
                                        onChange={(e) => setBranding(b => b ? { ...b, login_page_title: e.target.value } : null)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Login Page Description</Label>
                                    <Textarea
                                        placeholder="Welcome back! Sign in to access your dashboard."
                                        value={branding?.login_page_description || ''}
                                        onChange={(e) => setBranding(b => b ? { ...b, login_page_description: e.target.value } : null)}
                                        rows={2}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Login Background Image URL</Label>
                                    <Input
                                        placeholder="https://example.com/background.jpg"
                                        value={branding?.login_background_url || ''}
                                        onChange={(e) => setBranding(b => b ? { ...b, login_background_url: e.target.value } : null)}
                                    />
                                    <p className="text-xs text-muted-foreground">Recommended: 1920x1080 or larger</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Custom CSS */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Code className="h-4 w-4" /> Custom CSS
                                </CardTitle>
                                <CardDescription>Advanced styling for complete brand control</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Custom Stylesheet</Label>
                                    <Textarea
                                        placeholder={`/* Example: Change font or add custom styles */
:root {
    --font-family: 'Inter', sans-serif;
}
.login-container {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}`}
                                        value={branding?.custom_css || ''}
                                        onChange={(e) => setBranding(b => b ? { ...b, custom_css: e.target.value } : null)}
                                        rows={8}
                                        className="font-mono text-sm"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        CSS will be applied to all white-labeled pages including login, public forms, and booking pages.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={saveBranding} disabled={saving}>
                            {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                            Save Branding
                        </Button>
                    </div>
                </section>

                {/* Domains Section */}
                <section id="domains" className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <Globe2 className="w-4 h-4 text-green-500" />
                        <h3 className="text-base font-semibold">Custom Domains</h3>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Domain Management</CardTitle>
                            <CardDescription>
                                Add your own domains to white-label the platform for your agency
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Add Domain */}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="app.youragency.com"
                                    value={newDomain}
                                    onChange={(e) => setNewDomain(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addDomain()}
                                />
                                <Button onClick={addDomain} disabled={addingDomain || !newDomain.trim()}>
                                    {addingDomain ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                    Add Domain
                                </Button>
                            </div>

                            {/* Domain List */}
                            <div className="space-y-3">
                                {domains.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No custom domains configured yet.</p>
                                        <p className="text-sm">Add a domain above to get started.</p>
                                    </div>
                                ) : (
                                    domains.map((domain) => (
                                        <div key={domain.id} className="flex items-center justify-between p-4 border rounded-xl bg-background/50">
                                            <div className="flex items-center gap-3">
                                                <Globe className="w-5 h-5 text-muted-foreground" />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{domain.domain}</span>
                                                        {domain.domain_type === 'primary' && (
                                                            <Badge variant="secondary" className="text-xs">Primary</Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {domain.dns_verified ? (
                                                            <Badge variant="outline" className="text-green-600 border-green-600 bg-green-500/5">
                                                                <Check className="w-3 h-3 mr-1" /> DNS Verified
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-500/5">
                                                                Pending Verification
                                                            </Badge>
                                                        )}
                                                        {domain.ssl_status === 'active' ? (
                                                            <Badge variant="outline" className="text-green-600 border-green-600 bg-green-500/5">
                                                                <Shield className="w-3 h-3 mr-1" /> SSL Active
                                                            </Badge>
                                                        ) : domain.ssl_status === 'provisioning' ? (
                                                            <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-500/5">
                                                                <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> SSL Provisioning
                                                            </Badge>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!domain.dns_verified && (
                                                    <Button variant="outline" size="sm" onClick={() => verifyDomain(domain.id)} className="h-8">
                                                        <RefreshCw className="w-4 h-4 mr-1" /> Verify
                                                    </Button>
                                                )}
                                                {domain.dns_verified && (
                                                    <Button variant="outline" size="sm" asChild className="h-8">
                                                        <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="w-4 h-4 mr-1" /> Visit
                                                        </a>
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" onClick={() => deleteDomain(domain.id)} className="h-8 w-8">
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* DNS Instructions */}
                            {domains.some(d => !d.dns_verified) && (
                                <Card className="bg-muted/30 border-dashed">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">DNS Configuration</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 text-sm">
                                        <p className="text-muted-foreground">To verify your domain, add one of the following DNS records to your domain provider (e.g., Cloudflare, GoDaddy):</p>

                                        <div className="space-y-3">
                                            <div className="p-3 bg-background rounded-xl border space-y-2">
                                                <p className="font-medium text-xs uppercase tracking-wider text-muted-foreground">Option 1: CNAME Record (Recommended)</p>
                                                <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto pb-1">
                                                    <Badge variant="secondary" className="font-mono">CNAME</Badge>
                                                    <span className="text-muted-foreground">Host:</span>
                                                    <span className="font-semibold px-1 py-0.5 bg-muted rounded">@ or subdomain</span>
                                                    <span className="text-muted-foreground">Target:</span>
                                                    <span className="font-semibold px-1 py-0.5 bg-muted rounded text-primary">proxy.xordon.com</span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto flex-shrink-0" onClick={() => copyToClipboard('proxy.xordon.com')}>
                                                        <Copy className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {domains.filter(d => !d.dns_verified && d.dns_txt_record).map(d => (
                                                <div key={d.id} className="p-3 bg-background rounded-xl border space-y-2">
                                                    <p className="font-medium text-xs uppercase tracking-wider text-muted-foreground">TXT Verification for {d.domain}:</p>
                                                    <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto pb-1">
                                                        <Badge variant="secondary" className="font-mono">TXT</Badge>
                                                        <span className="text-muted-foreground">Host:</span>
                                                        <span className="font-semibold px-1 py-0.5 bg-muted rounded truncate">_xordon-verify.{d.domain}</span>
                                                        <span className="text-muted-foreground">Value:</span>
                                                        <span className="font-semibold px-1 py-0.5 bg-muted rounded text-primary truncate max-w-[200px]">{d.dns_txt_record}</span>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto flex-shrink-0" onClick={() => copyToClipboard(d.dns_txt_record || '')}>
                                                            <Copy className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </CardContent>
                    </Card>
                </section>

                {/* Team Section */}
                <section id="team" className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <UserPlus className="w-4 h-4 text-orange-500" />
                        <h3 className="text-base font-semibold">Team Management</h3>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Agency Team</CardTitle>
                            <CardDescription>Manage your agency staff and their access levels.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AgencyTeam agencyId={agency.id} userRole={agency.user_role} />
                        </CardContent>
                    </Card>
                </section>
            </div>
        </div>
    );
}
