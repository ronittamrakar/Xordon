import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

import {
    Plus, Globe, ShoppingCart, Briefcase, BookOpen, GraduationCap,
    Utensils, Home, Heart, Building, Sparkles, Layout, Eye, Edit, Trash2,
    MoreVertical, Copy, ExternalLink, Settings, Loader2, RefreshCw, AlertCircle,
    LayoutGrid, List, Wand2, FileText, Zap, Archive, LayoutTemplate,
    TrendingUp, BarChart3, Search
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { websitesApi, Website } from '@/lib/websitesApi';
import { formatDistanceToNow } from 'date-fns';
import { Breadcrumb } from '@/components/Breadcrumb';

const websiteTypes = [
    {
        type: 'landing-page',
        label: 'Landing Page',
        icon: Globe,
        description: 'High-converting landing pages for campaigns',
        color: 'bg-blue-500',
    },
    {
        type: 'business',
        label: 'Business Website',
        icon: Briefcase,
        description: 'Professional websites for businesses',
        color: 'bg-purple-500',
    },
    {
        type: 'ecommerce',
        label: 'E-Commerce',
        icon: ShoppingCart,
        description: 'Online stores with product catalogs',
        color: 'bg-green-500',
    },
    {
        type: 'portfolio',
        label: 'Portfolio',
        icon: Sparkles,
        description: 'Showcase your work and projects',
        color: 'bg-pink-500',
    },
    {
        type: 'blog',
        label: 'Blog',
        icon: BookOpen,
        description: 'Content-focused blog websites',
        color: 'bg-orange-500',
    },
    {
        type: 'saas',
        label: 'SaaS',
        icon: Layout,
        description: 'Software as a Service websites',
        color: 'bg-indigo-500',
    },
    {
        type: 'restaurant',
        label: 'Restaurant',
        icon: Utensils,
        description: 'Menus, reservations, and more',
        color: 'bg-red-500',
    },
    {
        type: 'real-estate',
        label: 'Real Estate',
        icon: Home,
        description: 'Property listings and tours',
        color: 'bg-teal-500',
    },
    {
        type: 'education',
        label: 'Education',
        icon: GraduationCap,
        description: 'Schools, courses, and learning',
        color: 'bg-yellow-500',
    },
    {
        type: 'healthcare',
        label: 'Healthcare',
        icon: Heart,
        description: 'Medical practices and clinics',
        color: 'bg-rose-500',
    },
];

const Websites: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [websites, setWebsites] = useState<Website[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [websiteToDelete, setWebsiteToDelete] = useState<Website | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived' | 'trashed'>('all');

    useEffect(() => {
        loadWebsites();
    }, []);

    const loadWebsites = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await websitesApi.getWebsites();
            setWebsites(data);
        } catch (err) {
            console.error('Failed to load websites:', err);
            setError('Failed to load websites. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const filteredWebsites = websites.filter(website => {
        const matchesSearch = website.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all'
            ? website.status !== 'archived' && (website.status as any) !== 'trashed'
            : website.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleCreateWebsite = (type: string) => {
        navigate(`/websites/builder?type=${type}`);
    };

    const handleEditWebsite = (id: string) => {
        navigate(`/websites/builder/${id}`);
    };

    const handlePreviewWebsite = (id: string) => {
        navigate(`/websites/preview/${id}`);
    };

    const handleDuplicateWebsite = async (website: Website) => {
        try {
            setActionLoading(website.id);
            const duplicated = await websitesApi.duplicateWebsite(website.id);
            toast({
                title: 'Website duplicated',
                description: `"${duplicated.name}" has been created.`,
            });
            loadWebsites();
        } catch (err) {
            toast({
                title: 'Duplication failed',
                description: 'Failed to duplicate the website. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleViewLive = (website: Website) => {
        if (website.status === 'published' && website.published_url) {
            window.open(website.published_url, '_blank');
        } else if (website.slug) {
            // Construct the URL for preview
            window.open(`/sites/${website.slug}`, '_blank');
        } else {
            toast({
                title: 'Not published',
                description: 'This website is not published yet. Publish it first to view it live.',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteClick = (website: Website) => {
        setWebsiteToDelete(website);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!websiteToDelete) return;

        try {
            setActionLoading(websiteToDelete.id);
            // Move to trash instead of hard delete
            await websitesApi.updateWebsite(websiteToDelete.id, { status: 'trashed' });
            toast({
                title: 'Moved to Trash',
                description: `"${websiteToDelete.name}" has been moved to trash.`,
            });
            setWebsites(websites.filter(w => w.id !== websiteToDelete.id));
        } catch (err) {
            toast({
                title: 'Delete failed',
                description: 'Failed to delete the website. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setActionLoading(null);
            setDeleteDialogOpen(false);
            setWebsiteToDelete(null);
        }
    };

    const handlePublishToggle = async (website: Website) => {
        try {
            setActionLoading(website.id);
            if (website.status === 'published') {
                await websitesApi.unpublishWebsite(website.id);
                toast({
                    title: 'Website unpublished',
                    description: `"${website.name}" is now in draft mode.`,
                });
            } else {
                await websitesApi.publishWebsite(website.id);
                toast({
                    title: 'Website published',
                    description: `"${website.name}" is now live!`,
                });
            }
            loadWebsites();
        } catch (err) {
            toast({
                title: 'Action failed',
                description: 'Failed to update website status. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleArchiveWebsite = async (website: Website) => {
        try {
            setActionLoading(website.id);
            await websitesApi.updateWebsite(website.id, { status: 'archived' });
            toast({
                title: 'Website archived',
                description: `"${website.name}" has been moved to archive.`,
            });
            setWebsites(websites.filter(w => w.id !== website.id));
        } catch (err) {
            toast({
                title: 'Archive failed',
                description: 'Failed to archive the website. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreateFromScratch = () => {
        setCreateDialogOpen(false);
        navigate('/websites/builder');
    };

    const handleChooseTemplate = () => {
        setCreateDialogOpen(false);
        navigate('/websites/templates');
    };

    const handleCreateLandingPage = () => {
        setCreateDialogOpen(false);
        navigate('/websites/builder?type=landing-page');
    };

    const formatLastUpdated = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch {
            return dateString;
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'published':
                return 'default';
            case 'draft':
                return 'secondary';
            case 'archived':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    return (
        <div className="space-y-4">
            <Breadcrumb
                items={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Websites' }
                ]}
            />
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[18px] font-bold tracking-tight">Websites</h1>
                        <p className="text-muted-foreground">
                            Create and manage full websites, businesses, e-commerce stores, and portfolios
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="mr-2">
                                    <LayoutTemplate className="h-4 w-4 mr-2" />
                                    Templates
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate('/websites/templates')}>
                                    <Layout className="h-4 w-4 mr-2" />
                                    Website Templates
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate('/websites/landing-pages/templates')}>
                                    <Zap className="h-4 w-4 mr-2" />
                                    Landing Page Templates
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="flex items-center border rounded-md mr-2 bg-background">
                            <Button
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                size="icon"
                                className="rounded-none rounded-l-md h-9 w-9"
                                onClick={() => setViewMode('grid')}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                                size="icon"
                                className="rounded-none rounded-r-md h-9 w-9"
                                onClick={() => setViewMode('table')}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button variant="outline" onClick={loadWebsites} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button onClick={() => setCreateDialogOpen(true)} size="lg">
                            <Plus className="h-5 w-5 mr-2" />
                            Create Website
                        </Button>
                    </div>
                </div>

                {/* Website Types Overview */}
                <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Need a Landing Page?</h3>
                                <p className="text-muted-foreground text-sm">
                                    Landing pages are optimized for conversions and campaigns. Manage them separately for better analytics.
                                </p>
                            </div>
                            <Button variant="outline" onClick={() => navigate('/websites/landing-pages')} className="border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-950/20">
                                <Zap className="h-4 w-4 mr-2" />
                                Go to Landing Pages
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Websites</p>
                                    <p className="text-2xl font-bold">
                                        {websites.filter(w => w.status !== 'archived' && (w.status as any) !== 'trashed').length}
                                    </p>
                                </div>
                                <Globe className="h-8 w-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Views</p>
                                    <p className="text-2xl font-bold">
                                        {websites.reduce((sum, site) => sum + (site.views || 0), 0).toLocaleString()}
                                    </p>
                                </div>
                                <Eye className="h-8 w-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Conversions</p>
                                    <p className="text-2xl font-bold">
                                        {websites.reduce((sum, site) => sum + (site.conversions || 0), 0).toLocaleString()}
                                    </p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Avg. Rate</p>
                                    <p className="text-2xl font-bold">
                                        {websites.length > 0 ?
                                            `${(websites.reduce((sum, site) => sum + ((site.views || 0) > 0 ? ((site.conversions || 0) / (site.views || 0)) * 100 : 0), 0) / websites.length).toFixed(1)}%` :
                                            '0%'
                                        }
                                    </p>
                                </div>
                                <BarChart3 className="h-8 w-8 text-orange-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="mt-6">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                            <div className="flex-1 w-full">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search websites..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 bg-muted/20 p-1 rounded-lg">
                                <Button
                                    variant={statusFilter === 'all' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setStatusFilter('all')}
                                >
                                    All
                                </Button>
                                <Button
                                    variant={statusFilter === 'published' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setStatusFilter('published')}
                                >
                                    Published
                                </Button>
                                <Button
                                    variant={statusFilter === 'draft' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setStatusFilter('draft')}
                                >
                                    Draft
                                </Button>
                                <Button
                                    variant={statusFilter === 'archived' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setStatusFilter('archived')}
                                >
                                    Archived
                                </Button>
                                <Button
                                    variant={statusFilter === 'trashed' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setStatusFilter('trashed')}
                                >
                                    Trash
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                            <p className="text-gray-500">Loading websites...</p>
                        </div>
                    ) : error ? (
                        <Card className="border-destructive/50 bg-destructive/5">
                            <CardContent className="flex flex-col items-center justify-center py-20">
                                <div className="p-4 rounded-full bg-destructive/10 mb-6">
                                    <AlertCircle className="h-16 w-16 text-destructive" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Error loading websites</h3>
                                <p className="text-muted-foreground mb-8 text-center max-w-md">{error}</p>
                                <Button onClick={loadWebsites} size="lg" className="shadow-md">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Try Again
                                </Button>
                            </CardContent>
                        </Card>
                    ) : filteredWebsites.length === 0 ? (
                        <Card className="border-dashed border-2 bg-muted/20">
                            <CardContent className="flex flex-col items-center justify-center py-20">
                                <div className="p-4 rounded-full bg-primary/10 mb-6">
                                    <Globe className="h-16 w-16 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">No websites found</h3>
                                <p className="text-muted-foreground mb-8 text-center max-w-md">
                                    {searchQuery || statusFilter !== 'all'
                                        ? 'Try adjusting your filters'
                                        : 'Get started by creating your first website'
                                    }
                                </p>
                                {!searchQuery && statusFilter === 'all' && (
                                    <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="shadow-md">
                                        <Plus className="h-5 w-5 mr-2" />
                                        Create Website
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredWebsites.map((website) => {
                                const typeInfo = websiteTypes.find((t) => t.type === website.type);
                                const TypeIcon = typeInfo?.icon || Globe;
                                const isActionLoading = actionLoading === website.id;

                                return (
                                    <Card key={website.id} className="group hover:shadow-xl hover:border-primary/20 transition-all duration-300 overflow-hidden">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className={`p-3 rounded-xl ${typeInfo?.color || 'bg-gradient-to-br from-gray-500 to-gray-600'} shadow-md`}>
                                                        <TypeIcon className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <CardTitle className="text-lg font-semibold truncate mb-1">{website.name}</CardTitle>
                                                        <CardDescription className="text-xs font-medium">{typeInfo?.label || website.type}</CardDescription>
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted" disabled={isActionLoading}>
                                                            {isActionLoading ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <MoreVertical className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEditWebsite(website.id)}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handlePreviewWebsite(website.id)}>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            Preview
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDuplicateWebsite(website)}>
                                                            <Copy className="h-4 w-4 mr-2" />
                                                            Duplicate
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleViewLive(website)}
                                                            disabled={website.status !== 'published'}
                                                        >
                                                            <ExternalLink className="h-4 w-4 mr-2" />
                                                            View Live
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handlePublishToggle(website)}>
                                                            {website.status === 'published' ? (
                                                                <>
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    Unpublish
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Globe className="h-4 w-4 mr-2" />
                                                                    Publish
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleArchiveWebsite(website)}>
                                                            <Archive className="h-4 w-4 mr-2" />
                                                            Archive
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDeleteClick(website)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Move to Trash
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="flex items-center justify-between mb-5 pb-4 border-b">
                                                <Badge
                                                    variant={getStatusVariant(website.status)}
                                                    className={`
                                                        ${website.status === 'published' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400' : ''}
                                                        ${website.status === 'draft' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400' : ''}
                                                        font-medium px-2.5 py-0.5
                                                    `}
                                                >
                                                    {website.status}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    {formatLastUpdated(website.updated_at)}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mb-5">
                                                <div className="bg-muted/50 rounded-lg p-3 hover:bg-muted/70 transition-colors">
                                                    <div className="text-xs text-muted-foreground font-medium mb-1">Views</div>
                                                    <div className="text-xl font-bold text-foreground">
                                                        {(website.views || 0).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="bg-muted/50 rounded-lg p-3 hover:bg-muted/70 transition-colors">
                                                    <div className="text-xs text-muted-foreground font-medium mb-1">Conversions</div>
                                                    <div className="text-xl font-bold text-foreground">
                                                        {(website.conversions || 0).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                className="w-full shadow-sm hover:shadow-md transition-all"
                                                variant="outline"
                                                onClick={() => handleEditWebsite(website.id)}
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit Website
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-md border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[300px]">Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Updated</TableHead>
                                        <TableHead>Views</TableHead>
                                        <TableHead>Conversions</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredWebsites.map((website) => {
                                        const typeInfo = websiteTypes.find((t) => t.type === website.type);
                                        const TypeIcon = typeInfo?.icon || Globe;
                                        const isActionLoading = actionLoading === website.id;

                                        return (
                                            <TableRow key={website.id} className="group hover:bg-muted/50 transition-colors">
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2.5 rounded-xl ${typeInfo?.color || 'bg-gradient-to-br from-gray-500 to-gray-600'} shadow-sm`}>
                                                            <TypeIcon className="h-5 w-5 text-white" />
                                                        </div>
                                                        <span className="font-semibold text-base">{website.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground font-medium">{typeInfo?.label || website.type}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={getStatusVariant(website.status)}
                                                        className={`
                                                            ${website.status === 'published' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400' : ''}
                                                            ${website.status === 'draft' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400' : ''}
                                                            font-medium
                                                        `}
                                                    >
                                                        {website.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {formatLastUpdated(website.updated_at)}
                                                </TableCell>
                                                <TableCell className="font-semibold">{(website.views || 0).toLocaleString()}</TableCell>
                                                <TableCell className="font-semibold">{(website.conversions || 0).toLocaleString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" disabled={isActionLoading}>
                                                                    {isActionLoading ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => handleEditWebsite(website.id)}>
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handlePreviewWebsite(website.id)}>
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    Preview
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleDuplicateWebsite(website)}>
                                                                    <Copy className="h-4 w-4 mr-2" />
                                                                    Duplicate
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleViewLive(website)}
                                                                    disabled={website.status !== 'published'}
                                                                >
                                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                                    View Live
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handlePublishToggle(website)}>
                                                                    {website.status === 'published' ? (
                                                                        <>
                                                                            <Eye className="h-4 w-4 mr-2" />
                                                                            Unpublish
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Globe className="h-4 w-4 mr-2" />
                                                                            Publish
                                                                        </>
                                                                    )}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handleArchiveWebsite(website)}>
                                                                    <Archive className="h-4 w-4 mr-2" />
                                                                    Archive
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => handleDeleteClick(website)}
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Move to Trash
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Website Modal */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Create New Website</DialogTitle>
                        <DialogDescription className="text-base">
                            Choose how you'd like to start building your website
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-6">
                        {/* Build from Scratch */}
                        <Card
                            className="group cursor-pointer border-2 hover:border-primary hover:shadow-lg transition-all duration-300"
                            onClick={handleCreateFromScratch}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md group-hover:shadow-lg transition-shadow">
                                        <Wand2 className="h-7 w-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                                            Build from Scratch
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Start with a blank canvas and build your website from the ground up using our powerful drag-and-drop builder. Perfect for custom designs.
                                        </p>
                                    </div>
                                    <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Choose Template */}
                        <Card
                            className="group cursor-pointer border-2 hover:border-primary hover:shadow-lg transition-all duration-300"
                            onClick={handleChooseTemplate}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md group-hover:shadow-lg transition-shadow">
                                        <Layout className="h-7 w-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                                                Choose from Template
                                            </h3>
                                            <Badge variant="secondary" className="text-xs">Popular</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Browse our collection of professionally designed templates for various industries. Customize colors, content, and layout to match your brand.
                                        </p>
                                    </div>
                                    <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Build Landing Page */}
                        <Card
                            className="group cursor-pointer border-2 hover:border-primary hover:shadow-lg transition-all duration-300"
                            onClick={handleCreateLandingPage}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md group-hover:shadow-lg transition-shadow">
                                        <Zap className="h-7 w-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                                            Build Landing Page
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Create a high-converting landing page optimized for campaigns, product launches, or lead generation. Fast and focused.
                                        </p>
                                    </div>
                                    <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Move to Trash</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to move "{websiteToDelete?.name}" to trash? You can restore it later from the Trash page.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Move to Trash
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Websites;
