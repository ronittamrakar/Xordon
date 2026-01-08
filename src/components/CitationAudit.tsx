/**
 * Citation Audit Component
 * Comprehensive citation analysis with NAP consistency, duplicates, scoring, and recommendations
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { companyQueryKey } from '@/hooks/useActiveCompany';
import { listingsApi, BusinessListing, ListingAudit, ListingDuplicate, ListingSettings } from '@/services';
import {
    Search, Loader2, CheckCircle, AlertCircle, AlertTriangle, XCircle,
    Globe, MapPin, Phone, Building2, Link2, ExternalLink, RefreshCw,
    TrendingUp, TrendingDown, Minus, Shield, ShieldCheck, ShieldAlert,
    FileTextIcon, Download, Eye, Trash2, ChevronRight, Info, Pencil,
    BarChart3, PieChart, Target, Zap, Lightbulb, Settings2, History
} from 'lucide-react';

interface CitationAuditProps {
    activeCompanyId: number | string | null;
    listings: BusinessListing[];
    settings?: ListingSettings;
    onNavigateToListings?: () => void;
    onEditListing?: (listing: BusinessListing) => void;
}

interface NAPAnalysis {
    name: { value: string; matches: number; mismatches: number; variations: string[] };
    address: { value: string; matches: number; mismatches: number; variations: string[] };
    phone: { value: string; matches: number; mismatches: number; variations: string[] };
    overallScore: number;
}

interface CitationIssue {
    id: string;
    type: 'error' | 'warning' | 'info';
    category: 'nap' | 'duplicate' | 'missing' | 'outdated' | 'incomplete';
    title: string;
    description: string;
    affectedListings: number[];
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
}

interface AuditSettings {
    scanDepth: 'quick' | 'standard' | 'deep';
    checkDuplicates: boolean;
    checkNAP: boolean;
    checkCategories: boolean;
    checkHours: boolean;
    checkPhotos: boolean;
    autoFix: boolean;
}

const defaultAuditSettings: AuditSettings = {
    scanDepth: 'standard',
    checkDuplicates: true,
    checkNAP: true,
    checkCategories: true,
    checkHours: false,
    checkPhotos: false,
    autoFix: false,
};

export function CitationAudit({
    activeCompanyId,
    listings,
    settings,
    onNavigateToListings,
    onEditListing
}: CitationAuditProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeSubTab, setActiveSubTab] = useState('overview');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [auditSettings, setAuditSettings] = useState<AuditSettings>(defaultAuditSettings);
    const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
    const [viewingIssue, setViewingIssue] = useState<CitationIssue | null>(null);

    // Queries
    const { data: audits, isLoading: auditsLoading } = useQuery({
        queryKey: companyQueryKey('listing-audits', activeCompanyId),
        queryFn: () => listingsApi.getListingAudits(),
        enabled: !!activeCompanyId,
    });

    const { data: duplicates } = useQuery({
        queryKey: companyQueryKey('listing-duplicates', activeCompanyId),
        queryFn: () => listingsApi.getListingDuplicates(),
        enabled: !!activeCompanyId,
    });

    const latestAudit = audits?.[0];

    // Mutations
    const startAuditMutation = useMutation({
        mutationFn: () => listingsApi.startListingAudit(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyQueryKey('listing-audits', activeCompanyId) });
            toast({ title: 'Audit started', description: 'Scanning your citations for issues...' });
        },
    });

    const suppressDuplicateMutation = useMutation({
        mutationFn: (id: number) => listingsApi.suppressDuplicate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyQueryKey('listing-duplicates', activeCompanyId) });
            toast({ title: 'Duplicate suppressed' });
        },
    });

    // Analyze NAP consistency
    const napAnalysis = useMemo((): NAPAnalysis => {
        const masterName = settings?.business_name || '';
        const masterAddress = settings?.address || '';
        const masterPhone = settings?.phone || '';

        const nameVariations: string[] = [];
        const addressVariations: string[] = [];
        const phoneVariations: string[] = [];

        let nameMatches = 0, nameMismatches = 0;
        let addressMatches = 0, addressMismatches = 0;
        let phoneMatches = 0, phoneMismatches = 0;

        listings.forEach(listing => {
            // Name check
            if (listing.business_name) {
                if (listing.business_name.toLowerCase().trim() === masterName.toLowerCase().trim()) {
                    nameMatches++;
                } else {
                    nameMismatches++;
                    if (!nameVariations.includes(listing.business_name)) {
                        nameVariations.push(listing.business_name);
                    }
                }
            }

            // Address check (simplified)
            if (listing.address) {
                const normalizedListingAddr = listing.address.toLowerCase().replace(/[^a-z0-9]/g, '');
                const normalizedMasterAddr = masterAddress.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (normalizedListingAddr === normalizedMasterAddr) {
                    addressMatches++;
                } else {
                    addressMismatches++;
                    if (!addressVariations.includes(listing.address)) {
                        addressVariations.push(listing.address);
                    }
                }
            }

            // Phone check
            if (listing.phone) {
                const normalizedListingPhone = listing.phone.replace(/[^0-9]/g, '');
                const normalizedMasterPhone = masterPhone.replace(/[^0-9]/g, '');
                if (normalizedListingPhone === normalizedMasterPhone) {
                    phoneMatches++;
                } else {
                    phoneMismatches++;
                    if (!phoneVariations.includes(listing.phone)) {
                        phoneVariations.push(listing.phone);
                    }
                }
            }
        });

        const totalChecks = (nameMatches + nameMismatches) + (addressMatches + addressMismatches) + (phoneMatches + phoneMismatches);
        const totalMatches = nameMatches + addressMatches + phoneMatches;
        const overallScore = totalChecks > 0 ? Math.round((totalMatches / totalChecks) * 100) : 100;

        return {
            name: { value: masterName, matches: nameMatches, mismatches: nameMismatches, variations: nameVariations },
            address: { value: masterAddress, matches: addressMatches, mismatches: addressMismatches, variations: addressVariations },
            phone: { value: masterPhone, matches: phoneMatches, mismatches: phoneMismatches, variations: phoneVariations },
            overallScore,
        };
    }, [listings, settings]);

    // Generate issues and recommendations
    const issues = useMemo((): CitationIssue[] => {
        const generatedIssues: CitationIssue[] = [];
        let issueId = 0;

        // NAP Issues
        if (napAnalysis.name.mismatches > 0) {
            generatedIssues.push({
                id: `nap-name-${issueId++}`,
                type: 'error',
                category: 'nap',
                title: 'Business Name Inconsistencies',
                description: `Found ${napAnalysis.name.mismatches} listings with different business names.`,
                affectedListings: listings.filter(l =>
                    l.business_name && l.business_name.toLowerCase().trim() !== napAnalysis.name.value.toLowerCase().trim()
                ).map(l => l.id),
                priority: 'high',
                suggestion: 'Update all listings to use the exact business name from your settings.',
            });
        }

        if (napAnalysis.address.mismatches > 0) {
            generatedIssues.push({
                id: `nap-address-${issueId++}`,
                type: 'error',
                category: 'nap',
                title: 'Address Inconsistencies',
                description: `Found ${napAnalysis.address.mismatches} listings with different addresses.`,
                affectedListings: listings.filter(l => {
                    if (!l.address) return false;
                    const normalizedListingAddr = l.address.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const normalizedMasterAddr = napAnalysis.address.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                    return normalizedListingAddr !== normalizedMasterAddr;
                }).map(l => l.id),
                priority: 'high',
                suggestion: 'Ensure all listings have the exact same address format.',
            });
        }

        if (napAnalysis.phone.mismatches > 0) {
            generatedIssues.push({
                id: `nap-phone-${issueId++}`,
                type: 'warning',
                category: 'nap',
                title: 'Phone Number Inconsistencies',
                description: `Found ${napAnalysis.phone.mismatches} listings with different phone numbers.`,
                affectedListings: listings.filter(l => {
                    if (!l.phone) return false;
                    const normalizedListingPhone = l.phone.replace(/[^0-9]/g, '');
                    const normalizedMasterPhone = napAnalysis.phone.value.replace(/[^0-9]/g, '');
                    return normalizedListingPhone !== normalizedMasterPhone;
                }).map(l => l.id),
                priority: 'medium',
                suggestion: 'Update phone numbers to use consistent formatting.',
            });
        }

        // Duplicate Issues
        if (duplicates && duplicates.length > 0) {
            generatedIssues.push({
                id: `duplicate-${issueId++}`,
                type: 'error',
                category: 'duplicate',
                title: 'Duplicate Listings Detected',
                description: `Found ${duplicates.length} potential duplicate listings that may confuse search engines.`,
                affectedListings: duplicates.map(d => d.listing_id || 0).filter(id => id > 0),
                priority: 'high',
                suggestion: 'Suppress or remove duplicate listings to improve citation accuracy.',
            });
        }

        // Missing Information
        const missingWebsite = listings.filter(l => !l.website);
        if (missingWebsite.length > 0) {
            generatedIssues.push({
                id: `missing-website-${issueId++}`,
                type: 'warning',
                category: 'incomplete',
                title: 'Missing Website URLs',
                description: `${missingWebsite.length} listings don't have a website URL.`,
                affectedListings: missingWebsite.map(l => l.id),
                priority: 'medium',
                suggestion: 'Add your website URL to all listings for better SEO.',
            });
        }

        // Unverified listings
        const unverified = listings.filter(l => l.claim_status !== 'verified');
        if (unverified.length > 0) {
            generatedIssues.push({
                id: `unverified-${issueId++}`,
                type: 'info',
                category: 'incomplete',
                title: 'Unverified Listings',
                description: `${unverified.length} listings are not yet verified.`,
                affectedListings: unverified.map(l => l.id),
                priority: 'low',
                suggestion: 'Verify your listings to gain full control and improve trust signals.',
            });
        }

        // Needs update
        const needsUpdate = listings.filter(l => l.status === 'needs_update');
        if (needsUpdate.length > 0) {
            generatedIssues.push({
                id: `outdated-${issueId++}`,
                type: 'warning',
                category: 'outdated',
                title: 'Outdated Listings',
                description: `${needsUpdate.length} listings need to be updated.`,
                affectedListings: needsUpdate.map(l => l.id),
                priority: 'medium',
                suggestion: 'Sync these listings to update their information.',
            });
        }

        return generatedIssues.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }, [listings, napAnalysis, duplicates]);

    // Calculate scores
    const scores = useMemo(() => {
        const totalListings = listings.length;
        const verifiedListings = listings.filter(l => l.claim_status === 'verified').length;
        const claimedListings = listings.filter(l => l.claim_status === 'claimed' || l.claim_status === 'verified').length;
        const syncedListings = listings.filter(l => l.sync_status === 'synced' || l.sync_status === 'verified').length;
        const accurateListings = listings.filter(l => (l.accuracy_score || 0) >= 80).length;

        const verificationScore = totalListings > 0 ? Math.round((verifiedListings / totalListings) * 100) : 0;
        const claimScore = totalListings > 0 ? Math.round((claimedListings / totalListings) * 100) : 0;
        const syncScore = totalListings > 0 ? Math.round((syncedListings / totalListings) * 100) : 0;
        const accuracyScore = totalListings > 0 ? Math.round((accurateListings / totalListings) * 100) : 0;

        // Overall health score weighted average
        const healthScore = Math.round(
            (napAnalysis.overallScore * 0.35) +
            (claimScore * 0.25) +
            (accuracyScore * 0.25) +
            (syncScore * 0.15)
        );

        return {
            healthScore,
            napScore: napAnalysis.overallScore,
            verificationScore,
            claimScore,
            syncScore,
            accuracyScore,
            totalListings,
            verifiedListings,
            claimedListings,
            syncedListings,
            accurateListings,
            issueCount: issues.length,
            criticalIssues: issues.filter(i => i.priority === 'high').length,
        };
    }, [listings, napAnalysis, issues]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBadge = (score: number) => {
        if (score >= 80) return { label: 'Excellent', variant: 'default' as const, className: 'bg-green-500' };
        if (score >= 60) return { label: 'Good', variant: 'secondary' as const, className: 'bg-yellow-500 text-black' };
        if (score >= 40) return { label: 'Fair', variant: 'secondary' as const, className: 'bg-orange-500' };
        return { label: 'Poor', variant: 'destructive' as const, className: 'bg-red-500' };
    };

    const handleExportReport = () => {
        const report = {
            generatedAt: new Date().toISOString(),
            healthScore: scores.healthScore,
            napScore: scores.napScore,
            totalListings: scores.totalListings,
            issues: issues.map(i => ({
                title: i.title,
                description: i.description,
                priority: i.priority,
                suggestion: i.suggestion,
            })),
            napAnalysis: {
                nameVariations: napAnalysis.name.variations,
                addressVariations: napAnalysis.address.variations,
                phoneVariations: napAnalysis.phone.variations,
            },
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `citation_audit_report_${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        toast({ title: 'Report exported', description: 'Your audit report has been downloaded.' });
    };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Citation Audit</h2>
                    <p className="text-muted-foreground text-sm">
                        Analyze your business citations for consistency, duplicates, and optimization opportunities.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
                        <Settings2 className="h-4 w-4 mr-2" />
                        Settings
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportReport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button
                        onClick={() => startAuditMutation.mutate()}
                        disabled={startAuditMutation.isPending}
                    >
                        {startAuditMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4 mr-2" />
                        )}
                        Run Audit
                    </Button>
                </div>
            </div>

            {/* Score Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
                    <CardHeader className="pb-2 relative">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Overall Health
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-bold ${getScoreColor(scores.healthScore)}`}>
                                {scores.healthScore}
                            </span>
                            <span className="text-muted-foreground text-lg">/100</span>
                        </div>
                        <Badge className={`mt-2 ${getScoreBadge(scores.healthScore).className}`}>
                            {getScoreBadge(scores.healthScore).label}
                        </Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            NAP Consistency
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-bold ${getScoreColor(scores.napScore)}`}>
                                {scores.napScore}%
                            </span>
                        </div>
                        <Progress value={scores.napScore} className="h-2 mt-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                            {napAnalysis.name.mismatches + napAnalysis.address.mismatches + napAnalysis.phone.mismatches} inconsistencies
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Issues Found
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-bold ${scores.criticalIssues > 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                                {scores.issueCount}
                            </span>
                        </div>
                        <div className="flex gap-2 mt-2">
                            {scores.criticalIssues > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                    {scores.criticalIssues} Critical
                                </Badge>
                            )}
                            {issues.filter(i => i.priority === 'medium').length > 0 && (
                                <Badge variant="secondary" className="text-xs bg-yellow-500 text-black">
                                    {issues.filter(i => i.priority === 'medium').length} Warning
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Coverage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Verified</span>
                                <span className="font-medium">{scores.verifiedListings}/{scores.totalListings}</span>
                            </div>
                            <Progress value={scores.verificationScore} className="h-1.5" />
                            <div className="flex justify-between text-xs">
                                <span>Claimed</span>
                                <span className="font-medium">{scores.claimedListings}/{scores.totalListings}</span>
                            </div>
                            <Progress value={scores.claimScore} className="h-1.5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sub-tabs for detailed sections */}
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="nap">NAP Analysis</TabsTrigger>
                    <TabsTrigger value="issues">Issues ({issues.length})</TabsTrigger>
                    <TabsTrigger value="duplicates">Duplicates</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Quick Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Citation Performance</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="text-sm">Accuracy Score</span>
                                    </div>
                                    <span className="font-bold">{scores.accuracyScore}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <RefreshCw className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm">Sync Rate</span>
                                    </div>
                                    <span className="font-bold">{scores.syncScore}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-green-500" />
                                        <span className="text-sm">Verification Rate</span>
                                    </div>
                                    <span className="font-bold">{scores.verificationScore}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-primary" />
                                        <span className="text-sm">Total Listings</span>
                                    </div>
                                    <span className="font-bold">{scores.totalListings}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Recommendations */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                                    Top Recommendations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {issues.length === 0 ? (
                                    <div className="text-center py-6">
                                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">
                                            No issues found! Your citations are in great shape.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {issues.slice(0, 4).map(issue => (
                                            <div
                                                key={issue.id}
                                                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer"
                                                onClick={() => setActiveSubTab('issues')}
                                            >
                                                {issue.type === 'error' ? (
                                                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                                ) : issue.type === 'warning' ? (
                                                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                                                ) : (
                                                    <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{issue.title}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{issue.suggestion}</p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* NAP Analysis Tab */}
                <TabsContent value="nap" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>NAP Consistency Analysis</CardTitle>
                            <CardDescription>
                                Name, Address, and Phone consistency across all your business listings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Master Data */}
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Master Business Information
                                </h4>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Business Name</Label>
                                        <p className="text-sm font-medium">{napAnalysis.name.value || 'Not set'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Address</Label>
                                        <p className="text-sm font-medium">{napAnalysis.address.value || 'Not set'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Phone</Label>
                                        <p className="text-sm font-medium">{napAnalysis.phone.value || 'Not set'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* NAP Breakdown */}
                            <div className="grid gap-4 md:grid-cols-3">
                                {/* Name */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            Business Name
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="text-center">
                                                <span className="text-2xl font-bold text-green-600">{napAnalysis.name.matches}</span>
                                                <p className="text-xs text-muted-foreground">Match</p>
                                            </div>
                                            <div className="text-center">
                                                <span className="text-2xl font-bold text-red-600">{napAnalysis.name.mismatches}</span>
                                                <p className="text-xs text-muted-foreground">Mismatch</p>
                                            </div>
                                        </div>
                                        {napAnalysis.name.variations.length > 0 && (
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Variations Found:</Label>
                                                {napAnalysis.name.variations.slice(0, 3).map((v, i) => (
                                                    <Badge key={i} variant="outline" className="text-xs mr-1 mb-1">
                                                        {v}
                                                    </Badge>
                                                ))}
                                                {napAnalysis.name.variations.length > 3 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        +{napAnalysis.name.variations.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Address */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            Address
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="text-center">
                                                <span className="text-2xl font-bold text-green-600">{napAnalysis.address.matches}</span>
                                                <p className="text-xs text-muted-foreground">Match</p>
                                            </div>
                                            <div className="text-center">
                                                <span className="text-2xl font-bold text-red-600">{napAnalysis.address.mismatches}</span>
                                                <p className="text-xs text-muted-foreground">Mismatch</p>
                                            </div>
                                        </div>
                                        {napAnalysis.address.variations.length > 0 && (
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Variations Found:</Label>
                                                {napAnalysis.address.variations.slice(0, 2).map((v, i) => (
                                                    <p key={i} className="text-xs truncate text-muted-foreground">{v}</p>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Phone */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            Phone
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="text-center">
                                                <span className="text-2xl font-bold text-green-600">{napAnalysis.phone.matches}</span>
                                                <p className="text-xs text-muted-foreground">Match</p>
                                            </div>
                                            <div className="text-center">
                                                <span className="text-2xl font-bold text-red-600">{napAnalysis.phone.mismatches}</span>
                                                <p className="text-xs text-muted-foreground">Mismatch</p>
                                            </div>
                                        </div>
                                        {napAnalysis.phone.variations.length > 0 && (
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Variations Found:</Label>
                                                {napAnalysis.phone.variations.map((v, i) => (
                                                    <Badge key={i} variant="outline" className="text-xs mr-1 mb-1 font-mono">
                                                        {v}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Issues Tab */}
                <TabsContent value="issues" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>All Issues</CardTitle>
                                <CardDescription>
                                    Review and fix issues affecting your citation health.
                                </CardDescription>
                            </div>
                            {selectedIssues.length > 0 && (
                                <Button variant="outline" size="sm">
                                    <Zap className="h-4 w-4 mr-2" />
                                    Fix {selectedIssues.length} Selected
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {issues.length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
                                    <p className="text-muted-foreground">
                                        No issues were found with your citations. Great job!
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {issues.map(issue => (
                                        <div
                                            key={issue.id}
                                            className={`p-4 rounded-lg border ${issue.priority === 'high' ? 'border-red-200 bg-red-50/50' :
                                                issue.priority === 'medium' ? 'border-yellow-200 bg-yellow-50/50' :
                                                    'border-blue-200 bg-blue-50/50'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    checked={selectedIssues.includes(issue.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedIssues([...selectedIssues, issue.id]);
                                                        } else {
                                                            setSelectedIssues(selectedIssues.filter(id => id !== issue.id));
                                                        }
                                                    }}
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {issue.type === 'error' ? (
                                                            <XCircle className="h-4 w-4 text-red-500" />
                                                        ) : issue.type === 'warning' ? (
                                                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                                        ) : (
                                                            <Info className="h-4 w-4 text-blue-500" />
                                                        )}
                                                        <span className="font-medium">{issue.title}</span>
                                                        <Badge variant="outline" className="text-xs capitalize">
                                                            {issue.category}
                                                        </Badge>
                                                        <Badge
                                                            variant={issue.priority === 'high' ? 'destructive' : 'secondary'}
                                                            className="text-xs"
                                                        >
                                                            {issue.priority}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Lightbulb className="h-3 w-3 text-yellow-500" />
                                                        <span className="text-muted-foreground">{issue.suggestion}</span>
                                                    </div>
                                                    {issue.affectedListings.length > 0 && (
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            className="text-xs px-0 mt-2 h-auto"
                                                            onClick={() => {
                                                                setViewingIssue(issue);
                                                            }}
                                                        >
                                                            View {issue.affectedListings.length} affected listing(s)
                                                            <ChevronRight className="h-3 w-3 ml-1" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Duplicates Tab */}
                <TabsContent value="duplicates" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Duplicate Listings</CardTitle>
                            <CardDescription>
                                Multiple listings for the same business can confuse search engines and harm your SEO.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!duplicates || duplicates.length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Duplicates Found</h3>
                                    <p className="text-muted-foreground">
                                        Your listings are unique across all directories.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {duplicates.map(dup => (
                                        <div
                                            key={dup.id}
                                            className="flex items-center justify-between p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{dup.source}</p>
                                                    <a
                                                        href={dup.duplicate_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        {dup.duplicate_url}
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground">Confidence</p>
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={dup.confidence_score * 100} className="h-1.5 w-16" />
                                                        <span className="text-sm font-bold">{Math.round(dup.confidence_score * 100)}%</span>
                                                    </div>
                                                </div>
                                                {dup.status === 'suppressed' ? (
                                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Suppressed
                                                    </Badge>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => suppressDuplicateMutation.mutate(dup.id)}
                                                        disabled={suppressDuplicateMutation.isPending}
                                                    >
                                                        {suppressDuplicateMutation.isPending && suppressDuplicateMutation.variables === dup.id ? (
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                        )}
                                                        Suppress
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Audit History
                            </CardTitle>
                            <CardDescription>
                                View past audit results and track your citation health over time.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {auditsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : !audits || audits.length === 0 ? (
                                <div className="text-center py-12">
                                    <History className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Audit History</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Run your first audit to start tracking your citation health.
                                    </p>
                                    <Button onClick={() => startAuditMutation.mutate()}>
                                        <Search className="h-4 w-4 mr-2" />
                                        Run First Audit
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {audits.map((audit, idx) => (
                                        <div
                                            key={audit.id}
                                            className={`flex items-center justify-between p-4 border rounded-lg ${idx === 0 ? 'border-primary/30 bg-primary/5' : 'bg-muted/30'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${audit.score && audit.score >= 80 ? 'bg-green-100' :
                                                    audit.score && audit.score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                                                    }`}>
                                                    <span className={`text-sm font-bold ${audit.score && audit.score >= 80 ? 'text-green-600' :
                                                        audit.score && audit.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                                        }`}>
                                                        {audit.score || 0}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {idx === 0 ? 'Latest Audit' : `Audit #${audits.length - idx}`}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(audit.completed_at || audit.created_at).toLocaleDateString()} at{' '}
                                                        {new Date(audit.completed_at || audit.created_at).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-center">
                                                    <p className="text-lg font-bold">{audit.listings_found}</p>
                                                    <p className="text-xs text-muted-foreground">Found</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-lg font-bold text-green-600">{audit.accurate_listings}</p>
                                                    <p className="text-xs text-muted-foreground">Accurate</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-lg font-bold text-red-600">{audit.inaccurate_listings}</p>
                                                    <p className="text-xs text-muted-foreground">Errors</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-lg font-bold text-purple-600">{audit.duplicates_found}</p>
                                                    <p className="text-xs text-muted-foreground">Duplicates</p>
                                                </div>
                                                <Badge variant={audit.status === 'completed' ? 'default' : 'secondary'}>
                                                    {audit.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Settings Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Audit Settings</DialogTitle>
                        <DialogDescription>
                            Configure what to check during citation audits.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Scan Depth</Label>
                            <Select
                                value={auditSettings.scanDepth}
                                onValueChange={(v: any) => setAuditSettings({ ...auditSettings, scanDepth: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="quick">Quick (Major directories only)</SelectItem>
                                    <SelectItem value="standard">Standard (All tracked directories)</SelectItem>
                                    <SelectItem value="deep">Deep (Extended search)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label>Checks to Perform</Label>
                            {[
                                { key: 'checkNAP', label: 'NAP Consistency', desc: 'Name, Address, Phone matching' },
                                { key: 'checkDuplicates', label: 'Duplicate Detection', desc: 'Find duplicate listings' },
                                { key: 'checkCategories', label: 'Category Verification', desc: 'Check business categories' },
                                { key: 'checkHours', label: 'Business Hours', desc: 'Verify operating hours' },
                                { key: 'checkPhotos', label: 'Photos & Media', desc: 'Check for missing photos' },
                            ].map(check => (
                                <div key={check.key} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">{check.label}</p>
                                        <p className="text-xs text-muted-foreground">{check.desc}</p>
                                    </div>
                                    <Checkbox
                                        checked={auditSettings[check.key as keyof AuditSettings] as boolean}
                                        onCheckedChange={(checked) =>
                                            setAuditSettings({ ...auditSettings, [check.key]: !!checked })
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                        <Button onClick={() => setIsSettingsOpen(false)}>Save Settings</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Affected Listings Dialog */}
            <Dialog open={!!viewingIssue} onOpenChange={(open) => !open && setViewingIssue(null)}>
                <DialogContent className="max-w-7xl max-h-[85vh] w-full overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {viewingIssue?.type === 'error' ? (
                                <XCircle className="h-5 w-5 text-red-500" />
                            ) : viewingIssue?.type === 'warning' ? (
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            ) : (
                                <Info className="h-5 w-5 text-blue-500" />
                            )}
                            {viewingIssue?.title}
                        </DialogTitle>
                        <DialogDescription>
                            {viewingIssue?.description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Issue Details */}
                        <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="capitalize">
                                    {viewingIssue?.category}
                                </Badge>
                                <Badge variant={viewingIssue?.priority === 'high' ? 'destructive' : 'secondary'}>
                                    {viewingIssue?.priority} priority
                                </Badge>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                                <p className="text-muted-foreground">{viewingIssue?.suggestion}</p>
                            </div>
                        </div>

                        {/* Affected Listings */}
                        <div>
                            <h4 className="font-semibold mb-3">Affected Listings ({viewingIssue?.affectedListings.length || 0})</h4>
                            <div className="space-y-2">
                                {viewingIssue?.affectedListings.map(listingId => {
                                    const listing = listings.find(l => l.id === listingId);
                                    if (!listing) return null;

                                    return (
                                        <div
                                            key={listing.id}
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Globe className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{listing.directory_name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        {listing.business_name && (
                                                            <span className="flex items-center gap-1">
                                                                <Building2 className="h-3 w-3" />
                                                                {listing.business_name}
                                                            </span>
                                                        )}
                                                        {listing.address && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                {listing.address.substring(0, 30)}...
                                                            </span>
                                                        )}
                                                        {listing.phone && (
                                                            <span className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                {listing.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {listing.listing_url && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <a
                                                            href={listing.listing_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setViewingIssue(null);
                                                        onEditListing?.(listing);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewingIssue(null)}>
                            Close
                        </Button>
                        <Button onClick={() => {
                            setViewingIssue(null);
                            onNavigateToListings?.();
                        }}>
                            Go to Listings
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default CitationAudit;

