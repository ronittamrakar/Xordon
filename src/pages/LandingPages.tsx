import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Archive,
  ExternalLink,
  TrendingUp,
  Users,
  BarChart3,
  LayoutGrid,
  Rows,
  Layout,
  MoreVertical,
  AlertCircle,
  LayoutTemplate,
  Zap,
  Globe,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { landingPagesApi } from '@/lib/landingPagesApi';
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
import { useToast } from '@/hooks/use-toast';

interface LandingPage {
  id: string;
  name: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived' | 'trashed';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  views: number;
  conversions: number;
  template?: string;
}

const LandingPages: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // -- State --
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived' | 'trashed'>('all');
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pageToTrash, setPageToTrash] = useState<LandingPage | null>(null);

  // -- Data Loading --
  const loadPages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const apiPages = await landingPagesApi.getLandingPages();
      const mapped: LandingPage[] = apiPages.map((page) => ({
        id: String(page.id),
        name: page.name,
        title: page.title,
        description: page.description || '',
        status: page.status,
        createdAt: page.created_at,
        updatedAt: page.updated_at,
        publishedAt: page.published_at,
        views: page.views,
        conversions: page.conversions,
        template: page.template_id ? 'Template' : 'Custom',
      }));
      setPages(mapped);
    } catch (err) {
      console.error('Failed to load landing pages', err);
      setError('Failed to load landing pages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  // -- Handlers --
  const handleArchive = async (e: React.MouseEvent, page: LandingPage) => {
    e.stopPropagation();
    try {
      setActionLoading(page.id);
      await landingPagesApi.updateLandingPage(page.id, { status: 'archived' });
      setPages(prev => prev.map(p => p.id === page.id ? { ...p, status: 'archived' } : p));
      toast({
        title: 'Page archived',
        description: `"${page.name}" has been moved to archive.`,
      });
    } catch (err) {
      console.error('Failed to archive landing page', err);
      toast({
        title: 'Action failed',
        description: 'Failed to archive landing page. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublishToggle = async (e: React.MouseEvent, page: LandingPage) => {
    e.stopPropagation();
    try {
      setActionLoading(page.id);
      if (page.status === 'published') {
        await landingPagesApi.updateLandingPage(page.id, { status: 'draft' });
        toast({
          title: 'Page unpublished',
          description: `"${page.name}" has been unpublished.`,
        });
      } else {
        await landingPagesApi.publishLandingPage(page.id);
        toast({
          title: 'Page published',
          description: `"${page.name}" is now live!`,
        });
      }
      loadPages();
    } catch (err) {
      console.error('Failed to update page status', err);
      toast({
        title: 'Action failed',
        description: 'Failed to update page status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMoveToTrash = async () => {
    if (!pageToTrash) return;
    try {
      setActionLoading(pageToTrash.id);
      await landingPagesApi.updateLandingPage(pageToTrash.id, { status: 'trashed' });
      setPages(prev => prev.map(p => p.id === pageToTrash.id ? { ...p, status: 'trashed' } : p));
      toast({
        title: 'Moved to Trash',
        description: `"${pageToTrash.name}" has been moved to trash.`,
      });
      setPageToTrash(null);
    } catch (err) {
      console.error('Failed to move landing page to trash', err);
      toast({
        title: 'Action failed',
        description: 'Failed to move landing page to trash. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // -- Memoized values --
  const filteredPages = useMemo(() => {
    return pages.filter(page => {
      const matchesSearch = page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all'
        ? page.status !== 'archived' && page.status !== 'trashed'
        : page.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [pages, searchQuery, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-500/10 dark:text-gray-400 border-gray-200';
      case 'trashed': return 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConversionRate = (views: number, conversions: number) => {
    if (views === 0) return '0%';
    return `${((conversions / views) * 100).toFixed(1)}%`;
  };

  // -- Render --
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Websites', href: '/websites' },
          { label: 'Landing Pages' }
        ]}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Landing Pages</h1>
          <p className="text-muted-foreground">Create and manage high-converting landing pages</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <LayoutTemplate className="h-4 w-4 mr-2" />
                Templates
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/websites/landing-pages/templates')}>
                <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                Landing Page Templates
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/websites/templates')}>
                <Layout className="h-4 w-4 mr-2 text-blue-500" />
                Website Templates
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" className="h-9" onClick={loadPages} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" className="h-9 shadow-md" onClick={() => navigate('/websites/landing-pages/builder')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Page
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pages by name or title..."
            className="pl-9 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            className="h-10 w-full sm:w-[160px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
            <option value="trashed">Trashed</option>
          </select>
          <div className="flex items-center border rounded-md p-1 bg-muted/20 h-10">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('table')}
            >
              <Rows className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading && pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-medium">Fetching your landing pages...</p>
        </div>
      ) : error ? (
        <Card className="border-destructive/20 bg-destructive/5 py-12">
          <CardContent className="flex flex-col items-center justify-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4 opacity-50" />
            <p className="text-destructive font-medium mb-4">{error}</p>
            <Button variant="outline" onClick={loadPages}>Try Again</Button>
          </CardContent>
        </Card>
      ) : filteredPages.length === 0 ? (
        <Card className="border-dashed py-20">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Layout className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-xl font-semibold mb-1">No landing pages found</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mb-6">
              {searchQuery || statusFilter !== 'all'
                ? "We couldn't find any pages matching your current filters."
                : "You haven't created any landing pages yet. Start by creating one from a template or scratch."}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button onClick={() => navigate('/websites/landing-pages/builder')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Page
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPages.map((page) => (
            <Card key={page.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-border/50">
              <div
                className="aspect-video bg-muted relative overflow-hidden bg-gradient-to-br from-muted to-muted/50 cursor-pointer"
                onClick={() => navigate(`/websites/landing-pages/builder/${page.id}`)}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-105 group-hover:scale-100">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/websites/landing-pages/builder/${page.id}`); }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    {page.status === 'published' && (
                      <Button variant="default" size="sm" onClick={(e) => { e.stopPropagation(); window.open(`/l/${page.id}`, '_blank'); }}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    )}
                  </div>
                </div>
                <div className="absolute top-3 right-3 z-10">
                  <Badge className={getStatusColor(page.status)}>
                    {page.status.charAt(0).toUpperCase() + page.status.slice(1)}
                  </Badge>
                </div>
              </div>
              <CardHeader className="p-5 pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">{page.name}</CardTitle>
                    <CardDescription className="text-xs line-clamp-1">{page.title}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 -mr-2">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => navigate(`/websites/landing-pages/builder/${page.id}`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Designer
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handlePublishToggle(e, page)}>
                        <Globe className="h-4 w-4 mr-2" />
                        {page.status === 'published' ? 'Unpublish Page' : 'Publish Page'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/websites/landing-pages/stats/${page.id}`)}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics Desk
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => handleArchive(e, page)}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive Page
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPageToTrash(page);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Move to Trash
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="flex items-center justify-between mt-4 py-3 border-t bg-muted/5 rounded-b-lg">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Total Views</span>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-sm font-bold">{page.views.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Conversions</span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 text-[11px] font-bold">
                        <TrendingUp className="h-3 w-3" />
                        {getConversionRate(page.views, page.conversions)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold">
                <TableRow>
                  <TableHead className="py-3">Page Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                  <TableHead className="text-right">Conv. Rate</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPages.map((page) => (
                  <TableRow key={page.id} className="cursor-pointer hover:bg-muted/30 transition-colors group" onClick={() => navigate(`/websites/landing-pages/builder/${page.id}`)}>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground group-hover:text-primary transition-colors">{page.name}</span>
                        <span className="text-xs text-muted-foreground">{page.template || 'Custom Design'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(page.status)} shadow-none`}>
                        {page.status.charAt(0).toUpperCase() + page.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{page.views.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium">{page.conversions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5 text-green-600 font-bold">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {getConversionRate(page.views, page.conversions)}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(page.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => navigate(`/websites/landing-pages/builder/${page.id}`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => navigate(`/websites/landing-pages/builder/${page.id}`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Page
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handlePublishToggle(e, page)}>
                              <Globe className="h-4 w-4 mr-2" />
                              {page.status === 'published' ? 'Unpublish' : 'Publish'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => handleArchive(e, page)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPageToTrash(page);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Move to Trash
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialogs */}
      <AlertDialog open={!!pageToTrash} onOpenChange={(open) => !open && setPageToTrash(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Trash</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move "{pageToTrash?.name}" to trash?
              You can restore it later from the Trash page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMoveToTrash} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
              Move to Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LandingPages;
