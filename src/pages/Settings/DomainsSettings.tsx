/**
 * Domains Settings Component
 * Manage custom domains and subdomains for white-labeling the platform
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Globe,
    Plus,
    Trash2,
    RefreshCw,
    Check,
    X,
    Shield,
    Copy,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    Clock,
    Zap,
    Settings,
    Info,
    Loader2
} from 'lucide-react';
import multiTenantApi from '@/services/multiTenantApi';
import type { Agency } from '@/types/multiTenant';

interface CustomDomain {
    id: number;
    domain: string;
    domain_type: 'primary' | 'alias' | 'funnel' | 'subdomain';
    ssl_status: 'pending' | 'provisioning' | 'active' | 'failed';
    ssl_expires_at?: string;
    dns_verified: boolean;
    dns_verified_at?: string;
    dns_txt_record?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

export default function DomainsSettings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [agency, setAgency] = useState<Agency | null>(null);
    const [domains, setDomains] = useState<CustomDomain[]>([]);
    const [newDomain, setNewDomain] = useState('');
    const [newDomainType, setNewDomainType] = useState<'primary' | 'alias' | 'funnel'>('alias');
    const [addingDomain, setAddingDomain] = useState(false);
    const [verifyingDomain, setVerifyingDomain] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState('domains');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const agencyData = await multiTenantApi.getCurrentAgency();
            if (agencyData) {
                setAgency(agencyData);
                const res = await fetch(`/api/mt/agencies/${agencyData.id}/domains`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setDomains(data.items || []);
                }
            }
        } catch (err) {
            console.error('Failed to load domain data:', err);
            toast({
                title: 'Error',
                description: 'Failed to load domain settings.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    }

    async function addDomain() {
        if (!agency || !newDomain.trim()) return;

        // Validate domain format
        const domainRegex = /^[a-z0-9][a-z0-9\-\.]*[a-z0-9]\.[a-z]{2,}$/i;
        if (!domainRegex.test(newDomain.trim())) {
            toast({
                title: 'Invalid domain',
                description: 'Please enter a valid domain name (e.g., app.yourcompany.com)',
                variant: 'destructive'
            });
            return;
        }

        try {
            setAddingDomain(true);
            const res = await fetch(`/api/mt/agencies/${agency.id}/domains`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({
                    domain: newDomain.trim().toLowerCase(),
                    domain_type: newDomainType
                })
            });
            const data = await res.json();

            if (res.ok) {
                setDomains([...domains, data]);
                setNewDomain('');
                toast({
                    title: 'Domain added',
                    description: 'Follow the DNS instructions below to verify your domain.'
                });
            } else {
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to add domain.',
                    variant: 'destructive'
                });
            }
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to add domain.',
                variant: 'destructive'
            });
        } finally {
            setAddingDomain(false);
        }
    }

    async function verifyDomain(domainId: number) {
        if (!agency) return;

        try {
            setVerifyingDomain(domainId);
            const res = await fetch(`/api/mt/agencies/${agency.id}/domains/${domainId}/verify`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });
            const data = await res.json();

            if (data.verified) {
                toast({
                    title: 'Domain verified!',
                    description: 'SSL certificate is now active. Your domain is ready to use.'
                });
                loadData();
            } else {
                toast({
                    title: 'Verification failed',
                    description: data.message || 'Please check your DNS configuration.',
                    variant: 'destructive'
                });
            }
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Verification failed.',
                variant: 'destructive'
            });
        } finally {
            setVerifyingDomain(null);
        }
    }

    async function setAsPrimary(domainId: number) {
        if (!agency) return;

        try {
            const res = await fetch(`/api/mt/agencies/${agency.id}/domains/${domainId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ domain_type: 'primary' })
            });

            if (res.ok) {
                toast({ title: 'Primary domain updated' });
                loadData();
            }
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to update domain.',
                variant: 'destructive'
            });
        }
    }

    async function toggleDomain(domainId: number, isActive: boolean) {
        if (!agency) return;

        try {
            const res = await fetch(`/api/mt/agencies/${agency.id}/domains/${domainId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ is_active: isActive })
            });

            if (res.ok) {
                toast({ title: isActive ? 'Domain enabled' : 'Domain disabled' });
                loadData();
            }
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to update domain.',
                variant: 'destructive'
            });
        }
    }

    async function deleteDomain(domainId: number) {
        if (!agency || !confirm('Are you sure you want to delete this domain?')) return;

        try {
            const res = await fetch(`/api/mt/agencies/${agency.id}/domains/${domainId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });

            if (res.ok) {
                setDomains(domains.filter(d => d.id !== domainId));
                toast({ title: 'Domain deleted' });
            } else {
                const data = await res.json();
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to delete domain.',
                    variant: 'destructive'
                });
            }
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to delete domain.',
                variant: 'destructive'
            });
        }
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied to clipboard' });
    }

    const getDomainStatusBadge = (domain: CustomDomain) => {
        if (!domain.dns_verified) {
            return (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-50">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending Verification
                </Badge>
            );
        }

        switch (domain.ssl_status) {
            case 'active':
                return (
                    <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                    </Badge>
                );
            case 'provisioning':
                return (
                    <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        SSL Provisioning
                    </Badge>
                );
            case 'failed':
                return (
                    <Badge variant="outline" className="text-red-600 border-red-600 bg-red-50">
                        <X className="w-3 h-3 mr-1" />
                        SSL Failed
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="text-gray-600 border-gray-600 bg-gray-50">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                    </Badge>
                );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!agency) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Agency Found</AlertTitle>
                <AlertDescription>
                    Custom domain management requires an agency account. Please set up your agency first.
                </AlertDescription>
            </Alert>
        );
    }

    const primaryDomain = domains.find(d => d.domain_type === 'primary' && d.dns_verified);
    const pendingDomains = domains.filter(d => !d.dns_verified);
    const verifiedDomains = domains.filter(d => d.dns_verified);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Globe className="w-6 h-6" />
                    Custom Domains
                </h2>
                <p className="text-muted-foreground mt-1">
                    Connect your own domains to access this platform. Perfect for white-labeling and branding.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="domains">
                        <Globe className="w-4 h-4 mr-2" />
                        All Domains
                    </TabsTrigger>
                    <TabsTrigger value="setup">
                        <Settings className="w-4 h-4 mr-2" />
                        DNS Setup
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="domains" className="space-y-6">
                    {/* Overview Stats */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/20">
                                        <Globe className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{domains.length}</p>
                                        <p className="text-sm text-muted-foreground">Total Domains</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-500/20">
                                        <Shield className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{verifiedDomains.length}</p>
                                        <p className="text-sm text-muted-foreground">Active & Verified</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-amber-500/20">
                                        <Clock className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{pendingDomains.length}</p>
                                        <p className="text-sm text-muted-foreground">Pending Verification</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Add Domain Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Domain</CardTitle>
                            <CardDescription>
                                Connect a custom domain or subdomain for your team to access this platform
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1">
                                    <Label htmlFor="domain" className="sr-only">Domain</Label>
                                    <Input
                                        id="domain"
                                        placeholder="app.yourcompany.com"
                                        value={newDomain}
                                        onChange={(e) => setNewDomain(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addDomain()}
                                        className="h-10"
                                    />
                                </div>
                                <Select value={newDomainType} onValueChange={(v) => setNewDomainType(v as any)}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="primary">Primary</SelectItem>
                                        <SelectItem value="alias">Alias</SelectItem>
                                        <SelectItem value="funnel">Funnel/Landing</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button onClick={addDomain} disabled={addingDomain || !newDomain.trim()}>
                                    {addingDomain ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Plus className="w-4 h-4 mr-2" />
                                    )}
                                    Add Domain
                                </Button>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                <strong>Primary:</strong> Main domain for your brand •
                                <strong> Alias:</strong> Additional access point •
                                <strong> Funnel:</strong> For landing pages and funnels
                            </p>
                        </CardContent>
                    </Card>

                    {/* Domain List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Domains</CardTitle>
                            <CardDescription>
                                Manage your connected domains and their SSL status
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {domains.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Globe className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <h3 className="text-lg font-medium mb-2">No domains configured</h3>
                                    <p className="text-sm">Add your first custom domain above to get started.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {domains.map((domain) => (
                                        <div
                                            key={domain.id}
                                            className={`flex items-center justify-between p-4 border rounded-xl transition-all hover:border-primary/30 ${!domain.is_active ? 'opacity-60 bg-muted/30' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg ${domain.dns_verified && domain.ssl_status === 'active'
                                                        ? 'bg-green-100 dark:bg-green-900/30'
                                                        : 'bg-muted'
                                                    }`}>
                                                    <Globe className={`w-5 h-5 ${domain.dns_verified && domain.ssl_status === 'active'
                                                            ? 'text-green-600'
                                                            : 'text-muted-foreground'
                                                        }`} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{domain.domain}</span>
                                                        {domain.domain_type === 'primary' && (
                                                            <Badge variant="default" className="text-xs">Primary</Badge>
                                                        )}
                                                        {domain.domain_type === 'funnel' && (
                                                            <Badge variant="secondary" className="text-xs">Funnel</Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {getDomainStatusBadge(domain)}
                                                        {domain.ssl_status === 'active' && domain.ssl_expires_at && (
                                                            <span className="text-xs text-muted-foreground">
                                                                SSL expires: {new Date(domain.ssl_expires_at).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {!domain.dns_verified && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => verifyDomain(domain.id)}
                                                        disabled={verifyingDomain === domain.id}
                                                    >
                                                        {verifyingDomain === domain.id ? (
                                                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                        ) : (
                                                            <RefreshCw className="w-4 h-4 mr-1" />
                                                        )}
                                                        Verify DNS
                                                    </Button>
                                                )}

                                                {domain.dns_verified && domain.domain_type !== 'primary' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setAsPrimary(domain.id)}
                                                    >
                                                        Set Primary
                                                    </Button>
                                                )}

                                                {domain.dns_verified && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        asChild
                                                    >
                                                        <a
                                                            href={`https://${domain.domain}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    </Button>
                                                )}

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteDomain(domain.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* DNS Verification Instructions for Pending Domains */}
                    {pendingDomains.length > 0 && (
                        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Info className="w-5 h-5 text-amber-600" />
                                    DNS Configuration Required
                                </CardTitle>
                                <CardDescription>
                                    Complete the DNS setup for your pending domains
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Add the following DNS records to verify your domain ownership. DNS changes can take up to 48 hours to propagate.
                                    </AlertDescription>
                                </Alert>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="font-semibold">Option 1: CNAME Record (Recommended)</Label>
                                        <div className="flex items-center gap-2 bg-background p-3 rounded-lg border font-mono text-sm">
                                            <span className="text-muted-foreground">Type:</span>
                                            <span className="font-semibold">CNAME</span>
                                            <span className="text-muted-foreground mx-2">|</span>
                                            <span className="text-muted-foreground">Host:</span>
                                            <span className="font-semibold">[your-subdomain]</span>
                                            <span className="text-muted-foreground mx-2">|</span>
                                            <span className="text-muted-foreground">Points to:</span>
                                            <span className="font-semibold text-primary">proxy.xordon.com</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 ml-auto"
                                                onClick={() => copyToClipboard('proxy.xordon.com')}
                                            >
                                                <Copy className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    {pendingDomains.filter(d => d.dns_txt_record).map(domain => (
                                        <div key={domain.id} className="space-y-2">
                                            <Label className="font-semibold">TXT Verification for {domain.domain}</Label>
                                            <div className="flex items-center gap-2 bg-background p-3 rounded-lg border font-mono text-xs">
                                                <span className="text-muted-foreground">Host:</span>
                                                <span className="font-semibold">_xordon-verify.{domain.domain}</span>
                                                <span className="text-muted-foreground mx-2">|</span>
                                                <span className="text-muted-foreground">Value:</span>
                                                <span className="font-semibold truncate flex-1">{domain.dns_txt_record}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => copyToClipboard(domain.dns_txt_record || '')}
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="setup" className="space-y-6">
                    {/* DNS Setup Guide */}
                    <Card>
                        <CardHeader>
                            <CardTitle>DNS Configuration Guide</CardTitle>
                            <CardDescription>
                                Step-by-step instructions for setting up your custom domain
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm">1</span>
                                        Choose Your Domain Type
                                    </h3>
                                    <div className="pl-8 space-y-3 text-sm text-muted-foreground">
                                        <div className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                            <p><strong>Subdomain (recommended):</strong> app.yourcompany.com - Easy to set up with a CNAME record</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                            <p><strong>Root domain:</strong> yourcompany.com - Requires A record pointing to our servers</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm">2</span>
                                        Add DNS Records
                                    </h3>
                                    <div className="pl-8 space-y-3 text-sm text-muted-foreground">
                                        <div className="flex items-start gap-2">
                                            <Zap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                            <p>Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Zap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                            <p>Add the CNAME or A record as shown in your domain configuration</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm">3</span>
                                        Verify Domain
                                    </h3>
                                    <div className="pl-8 space-y-3 text-sm text-muted-foreground">
                                        <div className="flex items-start gap-2">
                                            <RefreshCw className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                            <p>Click "Verify DNS" to check if your records are propagated</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Clock className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                            <p>DNS propagation can take 5 minutes to 48 hours</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm">4</span>
                                        SSL Certificate
                                    </h3>
                                    <div className="pl-8 space-y-3 text-sm text-muted-foreground">
                                        <div className="flex items-start gap-2">
                                            <Shield className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                            <p>Once verified, SSL is automatically provisioned via Let's Encrypt</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                            <p>Your domain will be accessible via HTTPS within minutes</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Provider-specific guides */}
                            <div className="pt-6 border-t">
                                <h3 className="font-semibold mb-4">Popular DNS Provider Guides</h3>
                                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                                    {[
                                        { name: 'Cloudflare', url: 'https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/' },
                                        { name: 'GoDaddy', url: 'https://www.godaddy.com/help/add-a-cname-record-19236' },
                                        { name: 'Namecheap', url: 'https://www.namecheap.com/support/knowledgebase/article.aspx/9646/2237/how-to-create-a-cname-record-for-your-domain/' },
                                        { name: 'Google Domains', url: 'https://support.google.com/domains/answer/9211383' }
                                    ].map(provider => (
                                        <Button
                                            key={provider.name}
                                            variant="outline"
                                            className="justify-start"
                                            asChild
                                        >
                                            <a href={provider.url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                {provider.name}
                                            </a>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* FAQ */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Frequently Asked Questions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <h4 className="font-medium">How long does DNS propagation take?</h4>
                                <p className="text-sm text-muted-foreground">
                                    DNS changes typically propagate within 5-30 minutes, but can take up to 48 hours in some cases.
                                    You can use tools like <a href="https://dnschecker.org" target="_blank" className="text-primary underline">dnschecker.org</a> to check propagation status.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-medium">Can I use a root domain (e.g., yourcompany.com)?</h4>
                                <p className="text-sm text-muted-foreground">
                                    Yes, but it requires an A record instead of a CNAME. Some DNS providers support CNAME flattening for root domains.
                                    We recommend using a subdomain like app.yourcompany.com for easier setup.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-medium">Is SSL included?</h4>
                                <p className="text-sm text-muted-foreground">
                                    Yes! Once your domain is verified, we automatically provision a free SSL certificate via Let's Encrypt.
                                    Your domain will be accessible via HTTPS with automatic renewal.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-medium">Can I have multiple custom domains?</h4>
                                <p className="text-sm text-muted-foreground">
                                    Absolutely! You can add as many custom domains as needed. One can be set as your primary domain,
                                    and others can serve as aliases or for specific purposes like landing pages.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
