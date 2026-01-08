import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
import {
  Plus,
  Search,
  MoreHorizontal,
  FileText as FileTextIcon,
  Eye,
  Copy,
  Trash2,
  Edit,
  Layout,
  ArrowLeft,
  Star,
  Briefcase,
  Code,
  Megaphone,
  Building,
  Table,
  Grid,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  User,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Activity,
  MessageSquare,
} from 'lucide-react';
import { proposalApi, type ProposalTemplate } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { SafeHTML } from '@/components/SafeHTML';

const categoryIcons: Record<string, React.ReactNode> = {
  general: <FileTextIcon className="h-4 w-4" />,
  services: <Briefcase className="h-4 w-4" />,
  technology: <Code className="h-4 w-4" />,
  marketing: <Megaphone className="h-4 w-4" />,
  consulting: <Building className="h-4 w-4" />,
};

// --- Components for Preview ---

const MiniProposalPreview: React.FC<{ template: ProposalTemplate }> = ({ template }) => {
  // If we have a cover image, use it
  if (template.cover_image && template.cover_image !== 'null' && template.cover_image.length > 5) {
    return (
      <div className="w-full h-40 overflow-hidden bg-gray-100 border-b relative group">
        <img
          src={template.cover_image}
          alt={template.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  }

  // Otherwise, use a scaled-down CSS preview
  // Use template styling if available
  const primaryColor = template.styling?.primary_color || '#4f46e5'; // Indigo-600 default
  const fontFamily = template.styling?.font_family || 'Inter, sans-serif';

  const sections = template.sections || [];
  const firstSection = sections[0];

  return (
    <div className="w-full h-44 overflow-hidden bg-slate-100 dark:bg-slate-900 border-b relative group cursor-pointer">
      <div
        className="absolute top-0 left-0 p-8 origin-top-left transform scale-[0.35] w-[285.7%] pointer-events-none select-none"
        style={{ fontFamily }}
      >
        <div className="w-full max-w-4xl space-y-10 bg-white dark:bg-slate-800 p-16 shadow-2xl border border-slate-200 dark:border-slate-700 min-h-[900px] flex flex-col">
          {/* Header Simulation */}
          <div className="flex justify-between items-start pb-10 border-b-2 border-slate-100">
            <div
              className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: primaryColor }}
            >
              {template.name ? template.name.charAt(0) : 'P'}
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 min-w-[150px]">
              <div className="text-[12px] uppercase tracking-wider font-bold text-slate-400 mb-2">Prepared for</div>
              <div className="h-3 bg-slate-200 rounded w-24 mb-1"></div>
              <div className="h-2 bg-slate-100 rounded w-16"></div>
            </div>
          </div>

          {/* Title Area */}
          <div className="space-y-6 py-10">
            <h1 className="text-4xl font-bold text-slate-900 leading-tight">
              {template.name}
            </h1>
            <div
              className="h-1 w-32 rounded-full"
              style={{ backgroundColor: primaryColor }}
            ></div>
            <p className="text-2xl text-slate-500 max-w-2xl leading-relaxed">
              {template.description || 'A comprehensive proposal template designed for professional service delivery and clear communication.'}
            </p>
          </div>

          {/* Content Simulation */}
          <div className="space-y-8 flex-grow">
            {firstSection ? (
              <div className="space-y-6">
                <h2
                  className="text-2xl font-bold text-slate-800 border-l-4 pl-6"
                  style={{ borderColor: primaryColor }}
                >
                  {firstSection.title}
                </h2>
                <SafeHTML html={firstSection.content || '...'} className="prose prose-xl text-slate-600 line-clamp-[12]" />
              </div>
            ) : (
              <div className="space-y-6">
                <div
                  className="h-6 rounded w-1/3 mb-10"
                  style={{ backgroundColor: `${primaryColor}20` }}
                ></div>
                <div className="space-y-4">
                  <div className="h-4 bg-slate-100 rounded w-full"></div>
                  <div className="h-4 bg-slate-100 rounded w-full"></div>
                  <div className="h-4 bg-slate-100 rounded w-full"></div>
                  <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                  <div className="h-4 bg-slate-100 rounded w-4/6"></div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Simulation */}
          <div className="mt-auto pt-10 border-t border-slate-100 flex justify-between items-center text-slate-400 text-xl">
            <span>© 2026 Professional Services</span>
            <div className="flex gap-4">
              <div className="w-12 h-3 bg-slate-100 rounded"></div>
              <div className="w-12 h-3 bg-slate-100 rounded"></div>
              <span className="font-bold">Page 1 of 12</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Overlays */}
      <div className="absolute inset-x-0 bottom-0 h-1" style={{ backgroundColor: primaryColor }} />
      <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
      <div className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none" />
    </div>
  );
};

const TemplateFullPreview: React.FC<{ template: ProposalTemplate; onClose: () => void; onUse: () => void }> = ({ template, onClose, onUse }) => {
  const [activeTab, setActiveTab] = useState('content');
  const sections = template.sections || [];
  const primaryColor = template.styling?.primary_color || '#4f46e5';
  const fontFamily = template.styling?.font_family || 'Inter, sans-serif';

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ fontFamily }}>
      <ScrollArea className="flex-1 bg-gray-50/50 dark:bg-gray-950/50">
        <div className="p-6 md:p-10">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Template Header Card */}
            <div
              className="relative overflow-hidden rounded-2xl shadow-xl bg-white dark:bg-gray-900 border"
            >
              <div
                className="absolute top-0 left-0 right-0 h-2"
                style={{ backgroundColor: primaryColor }}
              />

              <div className="p-8 md:p-12 flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="capitalize px-3 py-1 text-xs font-semibold"
                      style={{ color: primaryColor, borderColor: `${primaryColor}40` }}
                    >
                      {template.category}
                    </Badge>
                    {template.is_default && <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-none">System Default</Badge>}
                  </div>

                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                    {template.name}
                  </h1>

                  <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
                    {template.description}
                  </p>
                </div>

                <div className="w-full md:w-auto flex flex-col gap-4">
                  <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-3">Target Audience</div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                        <User className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{`{{client_name}}`}</div>
                        <div className="text-sm text-slate-500">{`{{client_company}}`}</div>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full h-12 text-base font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ backgroundColor: primaryColor }}
                    onClick={onUse}
                  >
                    Start Project with this Template
                  </Button>
                </div>
              </div>
            </div>

            {/* Template Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-between items-center border-b mb-8">
                <TabsList className="bg-transparent border-none p-0 h-auto gap-8">
                  <TabsTrigger
                    value="content"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-4 text-sm font-bold uppercase tracking-widest transition-all"
                    style={{ '--primary': primaryColor } as any}
                  >
                    Proposal Content
                  </TabsTrigger>
                  <TabsTrigger
                    value="pricing"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-4 text-sm font-bold uppercase tracking-widest transition-all"
                    style={{ '--primary': primaryColor } as any}
                  >
                    Investment Structure
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="content" className="mt-0 space-y-12">
                {template.content && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border overflow-hidden">
                    <div className="p-8 md:p-12">
                      <SafeHTML
                        html={template.content}
                        className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-extrabold prose-p:text-gray-600 dark:prose-p:text-gray-400"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-8">
                  {sections.map((section, idx) => (
                    <div key={idx} className="group relative">
                      <div className="flex items-center gap-6 mb-4">
                        <div
                          className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent"
                        />
                        <h3
                          className="text-xs font-bold uppercase tracking-[0.3em] whitespace-nowrap"
                          style={{ color: primaryColor }}
                        >
                          Section {idx + 1}: {section.title}
                        </h3>
                        <div
                          className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent"
                        />
                      </div>

                      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border p-8 md:p-10 transition-all hover:shadow-md">
                        <SafeHTML
                          html={section.content || '<p class="italic text-gray-400 underline decoration-dotted">This section will be populated with specific project details.</p>'}
                          className="prose prose-lg dark:prose-invert max-w-none prose-p:text-gray-600 dark:prose-p:text-gray-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {!template.content && sections.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
                      <FileTextIcon className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No Preview Available</h3>
                    <p className="text-gray-500 max-w-md">This template does not contain any preview content or sections. You can still use it to start a new proposal.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pricing" className="mt-0">
                <Card className="border-none shadow-xl overflow-hidden rounded-2xl">
                  <CardHeader
                    className="pb-8 border-b"
                    style={{ backgroundColor: `${primaryColor}05` }}
                  >
                    <div className="flex justify-between items-end">
                      <div>
                        <CardTitle className="text-xl font-bold tracking-tight">Financial Investment</CardTitle>
                        <CardDescription className="text-lg mt-1">Estimated cost structure for project delivery</CardDescription>
                      </div>
                      <Badge variant="outline" className="text-lg font-bold px-4 py-1" style={{ borderColor: primaryColor, color: primaryColor }}>
                        Est. Total: $1,500.00
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                            <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-gray-500">Service Line Item</th>
                            <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-gray-500 text-right">Unit Price</th>
                            <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-gray-500 text-right">Quantity</th>
                            <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-gray-500 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="px-8 py-6">
                              <div className="font-bold text-gray-900 dark:text-gray-100">Implementation & Strategy</div>
                              <div className="text-xs text-gray-500 mt-1 italic">Professional design and project planning phase.</div>
                            </td>
                            <td className="px-8 py-6 text-right font-medium">$1,000.00</td>
                            <td className="px-8 py-6 text-right">1</td>
                            <td className="px-8 py-6 text-right font-bold">$1,000.00</td>
                          </tr>
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="px-8 py-6">
                              <div className="font-bold text-gray-900 dark:text-gray-100">Project Management</div>
                              <div className="text-xs text-gray-500 mt-1 italic">Ongoing coordination and quality assurance.</div>
                            </td>
                            <td className="px-8 py-6 text-right font-medium">$500.00</td>
                            <td className="px-8 py-6 text-right">1</td>
                            <td className="px-8 py-6 text-right font-bold">$500.00</td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-900 text-white">
                            <td colSpan={3} className="px-8 py-6 text-sm font-bold uppercase tracking-[0.2em] text-right">Grand Total Investment</td>
                            <td className="px-8 py-6 text-right text-xl font-bold">$1,500.00</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <div className="p-8 bg-amber-50 dark:bg-amber-900/10 border-t flex gap-4 items-start">
                      <div className="h-6 w-6 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-800 font-bold text-xs">!</span>
                      </div>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>Notice:</strong> This is a structural preview. Actual pricing will be calculated based on the specific requirements defined during the initial discovery session.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

// --- Main Component ---

const ProposalTemplates: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [categories, setCategories] = useState<Array<{ category: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ProposalTemplate | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [templateToPreview, setTemplateToPreview] = useState<ProposalTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'usage_count'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, [activeCategory, searchQuery, statusFilter, sortBy, sortOrder]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await proposalApi.getTemplates({
        category: activeCategory === 'all' ? undefined : activeCategory,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      let filtered = response.items || [];

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.name.toLowerCase().includes(query) ||
            t.description?.toLowerCase().includes(query)
        );
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'usage_count':
            aValue = a.usage_count || 0;
            bValue = b.usage_count || 0;
            break;
          case 'created_at':
          default:
            aValue = new Date(a.created_at || 0);
            bValue = new Date(b.created_at || 0);
            break;
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      setTemplates(filtered);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await proposalApi.getTemplateCategories();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  const handleDuplicate = async (template: ProposalTemplate) => {
    try {
      const response = await proposalApi.duplicateTemplate(template.id);
      toast.success('Template duplicated successfully');
      navigate(`/proposals/templates/${response.id}/edit`);
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    try {
      await proposalApi.deleteTemplate(templateToDelete.id);
      toast.success('Template deleted successfully');
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
      loadTemplates();
      loadCategories();
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleUseTemplate = (template: ProposalTemplate) => {
    navigate(`/proposals/new?template=${template.id}`);
  };

  const handlePreviewTemplate = (template: ProposalTemplate) => {
    setTemplateToPreview(template);
    setPreviewDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Proposals', href: '/proposals' },
            { label: 'Templates' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/proposals')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Proposal Templates</h1>
              <p className="text-muted-foreground">
                Create and manage reusable proposal templates
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode('table')}
              >
                <Table className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => navigate('/proposals/templates/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at">Created Date</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="usage_count">Usage Count</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sort Order</Label>
                    <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Descending</SelectItem>
                        <SelectItem value="asc">Ascending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Actions</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setStatusFilter('all');
                        setSortBy('created_at');
                        setSortOrder('desc');
                        setSearchQuery('');
                      }}>
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat.category} value={cat.category}>
                <span className="flex items-center gap-1">
                  {categoryIcons[cat.category] || <FileTextIcon className="h-3 w-3" />}
                  <span className="capitalize">{cat.category}</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {cat.count}
                  </Badge>
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : templates.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <Layout className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-sm">
                    {searchQuery
                      ? 'No templates matched your search criteria. Try adjusting your filters.'
                      : 'Get started by creating your first reusable proposal template.'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => navigate('/proposals/templates/new')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : viewMode === 'table' ? (
              <Card>
                <CardContent className="p-0">
                  <UITable>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {template.is_default && (
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              )}
                              <div>
                                <div className="font-medium">{template.name}</div>
                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">{template.description}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {categoryIcons[template.category] || <FileTextIcon className="h-3 w-3" />}
                              <span className="ml-1">{template.category}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={template.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                              {template.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {template.usage_count !== undefined ? (
                              <span className="text-sm">{template.usage_count}x</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {template.created_at ? format(new Date(template.created_at), 'MMM d, yyyy') : '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreviewTemplate(template)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUseTemplate(template)}
                              >
                                <FileTextIcon className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handlePreviewTemplate(template)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUseTemplate(template)}>
                                    <FileTextIcon className="h-4 w-4 mr-2" />
                                    Use Template
                                  </DropdownMenuItem>
                                  {!template.is_default && (
                                    <DropdownMenuItem
                                      onClick={() => navigate(`/proposals/templates/${template.id}/edit`)}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  {!template.is_default && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => {
                                          setTemplateToDelete(template);
                                          setDeleteDialogOpen(true);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </UITable>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="group hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col"
                  >
                    {/* Mini Preview Component */}
                    <div onClick={() => handlePreviewTemplate(template)}>
                      <MiniProposalPreview template={template} />
                    </div>

                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors cursor-pointer" onClick={() => handlePreviewTemplate(template)}>
                              {template.name}
                            </h3>
                            {template.is_default && (
                              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs font-normal capitalize">
                            {categoryIcons[template.category] || <FileTextIcon className="h-3 w-3 mr-1" />}
                            {template.category}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePreviewTemplate(template)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUseTemplate(template)}>
                              <FileTextIcon className="h-4 w-4 mr-2" />
                              Use Template
                            </DropdownMenuItem>
                            {!template.is_default && (
                              <DropdownMenuItem
                                onClick={() => navigate(`/proposals/templates/${template.id}/edit`)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            {!template.is_default && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setTemplateToDelete(template);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-2 flex-grow">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.description || 'No description available for this template.'}
                      </p>
                    </CardContent>

                    <CardFooter className="p-4 pt-0 border-t bg-gray-50/50 dark:bg-gray-900/10 mt-auto">
                      <div className="flex items-center justify-between w-full mt-3">
                        <span className="text-xs text-muted-foreground">
                          {template.usage_count ? `Used ${template.usage_count}x` : 'Used 0x'}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreviewTemplate(template)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUseTemplate(template)}
                          >
                            Use Template
                          </Button>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="block max-w-6xl w-[95vw] h-[90vh] md:h-[85vh] p-0 overflow-hidden border-none shadow-2xl bg-background">
          <div className="flex flex-col h-full relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-50 bg-white/50 hover:bg-white"
              onClick={() => setPreviewDialogOpen(false)}
            >
              <XCircle className="h-6 w-6" />
            </Button>
            {templateToPreview && (
              <TemplateFullPreview
                template={templateToPreview}
                onClose={() => setPreviewDialogOpen(false)}
                onUse={() => {
                  handleUseTemplate(templateToPreview);
                  setPreviewDialogOpen(false);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProposalTemplates;
