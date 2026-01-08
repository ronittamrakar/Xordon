import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ticketsApi, { KBArticle, KBCategory } from '@/services/ticketsApi';
import {
  Search,
  Book,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Home,
  ArrowLeft,
  Plus,
  MessageSquare,
  Filter,
  Download,
  Clock,
  Sparkles,
  Edit,
  Bot,
  Link2,
  Trash2,
  ExternalLink,
  Save,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SafeHTML } from '@/components/SafeHTML';

const KnowledgeBasePortal: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KBArticle | null>(null);

  // View states: 'portal', 'manage-articles', 'manage-categories'
  const [currentView, setCurrentView] = useState<'portal' | 'manage-articles' | 'manage-categories'>('portal');

  const [newArticle, setNewArticle] = useState({
    title: '',
    summary: '',
    content: '',
    category_id: '',
    is_published: true,
    sync_to_ai: false
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<KBCategory | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: 'book',
    is_published: true
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => ticketsApi.createKBCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-categories'] });
      toast({ title: 'Success', description: 'Category created successfully' });
      setShowCategoryModal(false);
      setNewCategory({ name: '', description: '', icon: 'book', is_published: true });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => ticketsApi.updateKBCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-categories'] });
      toast({ title: 'Success', description: 'Category updated successfully' });
      setEditingCategory(null);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => ticketsApi.deleteKBCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-categories'] });
      toast({ title: 'Success', description: 'Category deleted successfully' });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to delete category';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  });

  const handleCreateCategory = () => createCategoryMutation.mutate(newCategory);
  const handleUpdateCategory = () => {
    if (!editingCategory) return;
    updateCategoryMutation.mutate({ id: editingCategory.id, data: editingCategory });
  };

  // Handle routing for management
  useEffect(() => {
    if (location.pathname.includes('/manage/articles')) {
      setCurrentView('manage-articles');
    } else if (location.pathname.includes('/manage/categories')) {
      setCurrentView('manage-categories');
    } else if (location.pathname.includes('/manage')) {
      setCurrentView('manage-articles'); // Default manage view
    } else {
      setCurrentView('portal');
    }
  }, [location.pathname]);

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['kb-categories'],
    queryFn: () => ticketsApi.listKBCategories(),
  });

  // Fetch articles
  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ['kb-articles', selectedCategory, searchQuery, currentView],
    queryFn: () => ticketsApi.listKBArticles({
      category_id: selectedCategory || undefined,
      search: searchQuery || undefined,
      published_only: currentView === 'portal' && !searchQuery && !selectedCategory,
    }),
  });

  // Fetch single article if slug provided
  const { data: article, isLoading: articleLoading } = useQuery({
    queryKey: ['kb-article', slug],
    queryFn: () => slug ? ticketsApi.getKBArticle(slug) : Promise.resolve(null),
    enabled: !!slug && currentView === 'portal',
  });

  // Mutations
  const createArticleMutation = useMutation({
    mutationFn: (data: any) => ticketsApi.createKBArticle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-articles'] });
      toast({ title: 'Success', description: 'Article created successfully' });
      setShowCreateModal(false);
      resetNewArticle();
    },
    onError: () => toast({ title: 'Error', description: 'Failed to create article', variant: 'destructive' }),
  });

  const updateArticleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => ticketsApi.updateKBArticle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-articles'] });
      queryClient.invalidateQueries({ queryKey: ['kb-article'] });
      toast({ title: 'Success', description: 'Article updated successfully' });
      setEditingArticle(null);
    },
    onError: () => toast({ title: 'Error', description: 'Failed to update article', variant: 'destructive' }),
  });

  const deleteArticleMutation = useMutation({
    mutationFn: (id: number) => ticketsApi.deleteKBArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-articles'] });
      toast({ title: 'Success', description: 'Article deleted successfully' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to delete article', variant: 'destructive' }),
  });

  const resetNewArticle = () => {
    setNewArticle({
      title: '',
      summary: '',
      content: '',
      category_id: '',
      is_published: true,
      sync_to_ai: false
    });
  };

  const handleArticleClick = (articleSlug: string) => {
    navigate(`/helpdesk/help-center/${articleSlug}`);
  };

  const handleFeedback = async (articleId: number, helpful: boolean) => {
    console.log('Feedback:', articleId, helpful);
    toast({ title: 'Thank you!', description: 'Your feedback has been recorded.' });
  };

  const handleGoBack = () => {
    if (slug) {
      navigate('/helpdesk/help-center');
    } else {
      navigate('/helpdesk');
    }
  };

  const handleCreateArticle = () => {
    const payload = {
      ...newArticle,
      body: newArticle.content,
      category_id: newArticle.category_id ? parseInt(newArticle.category_id) : undefined
    };
    createArticleMutation.mutate(payload);
  };

  const handleUpdateArticle = () => {
    if (!editingArticle) return;
    updateArticleMutation.mutate({
      id: editingArticle.id,
      data: {
        ...editingArticle,
        body: editingArticle.content,
        category_id: editingArticle.category_id
      }
    });
  };

  // Article view
  if (slug && article && currentView === 'portal') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Help Center
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/helpdesk/tickets/new')}
              className="gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Contact Support
            </Button>
          </div>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
                <Home className="w-4 h-4" />
                <span>/</span>
                <span className="font-medium">{article.category_name}</span>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-4">{article.title}</CardTitle>
              <CardDescription className="text-lg text-gray-600">{article.summary}</CardDescription>
              <div className="flex items-center gap-4 mt-6">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  {article.category_name}
                </Badge>
                <span className="text-sm text-gray-500">
                  {article.view_count || 0} views
                </span>
                {article.helpful_count > 0 && (
                  <span className="flex items-center gap-2 text-sm text-gray-500">
                    <ThumbsUp className="w-4 h-4 text-green-600" />
                    {article.helpful_count} found helpful
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-lg max-w-none mb-12">
                <SafeHTML html={(article.content || article.body || '').replace(/\n/g, '<br />')} />
              </div>

              {/* Helpful Section */}
              <div className="mt-12 pt-8 border-t border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Was this article helpful?</h3>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="gap-3 border-gray-200 hover:border-green-300 text-gray-700 hover:text-green-700"
                    onClick={() => handleFeedback(article.id, true)}
                  >
                    <ThumbsUp className="w-5 h-5" />
                    Yes, this helped me
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-3 border-gray-200 hover:border-red-300 text-gray-700 hover:text-red-700"
                    onClick={() => handleFeedback(article.id, false)}
                  >
                    <ThumbsDown className="w-5 h-5" />
                    No, still need help
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Help Center</h1>
            <p className="text-muted-foreground">Find answers and get help with our platform</p>
          </div>
          <div className="flex gap-4">
            {currentView === 'portal' ? (
              <>
                <Button onClick={() => navigate('/helpdesk/tickets/new')}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
                <Button variant="outline" onClick={() => navigate('/helpdesk/tickets')}>
                  <Book className="w-4 h-4 mr-2" />
                  View Tickets
                </Button>
                <Button variant="outline" onClick={() => navigate('/ai/knowledge-hub')}>
                  <Bot className="w-4 h-4 mr-2" />
                  AI Knowledge Hub
                </Button>
                <Button variant="outline" onClick={() => navigate('/helpdesk/help-center/manage')}>
                  <Edit className="w-4 h-4 mr-2" />
                  Manage Content
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate('/helpdesk/help-center')}>
                  <Home className="w-4 h-4 mr-2" />
                  Public View
                </Button>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Article
                </Button>
              </>
            )}
          </div>
        </div>

        {currentView === 'portal' ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Articles" value={articles?.length?.toString() || '0'} icon={<Book className="h-4 w-4" />} />
              <StatCard label="Categories" value={categories?.length?.toString() || '0'} icon={<Book className="h-4 w-4" />} />
              <StatCard label="Active Users" value="24/7" icon={<Sparkles className="h-4 w-4" />} />
              <StatCard label="Avg Response" value="2 min" icon={<Clock className="h-4 w-4" />} />
            </div>

            {/* Search and Filters */}
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search knowledge base..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Categories Grid */}
            {!selectedCategory && !searchQuery && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {categories?.map((category: KBCategory) => (
                  <Card
                    key={category.id}
                    className="group cursor-pointer hover:shadow-lg transition-all border-0 bg-white hover:bg-slate-50"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Book className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <div className="font-semibold">{category.name}</div>
                          <div className="text-sm text-muted-foreground">{category.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{category.article_count || 0} articles</Badge>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}

            {/* Results Table/Grid */}
            {(selectedCategory || searchQuery) && (
              <div className="space-y-6 mb-12">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedCategory
                        ? categories?.find(c => c.id === selectedCategory)?.name
                        : 'Search Results'}
                    </h2>
                    <p className="text-muted-foreground">
                      {articles?.length || 0} article{articles?.length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                  <Button variant="ghost" onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}>
                    Clear Filters
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {articles?.map((article: KBArticle) => (
                    <Card
                      key={article.id}
                      className="group cursor-pointer hover:shadow-md transition-all border-0 bg-white"
                      onClick={() => handleArticleClick(article.slug)}
                    >
                      <CardHeader className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline">{article.category_name}</Badge>
                              <span className="text-sm text-slate-500">{article.view_count || 0} views</span>
                            </div>
                            <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                              {article.title}
                            </CardTitle>
                            <CardDescription className="line-clamp-2">
                              {article.summary}
                            </CardDescription>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary mt-1" />
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                  {articles && articles.length === 0 && (
                    <div className="text-center py-12">
                      <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No articles found</h3>
                      <p className="text-muted-foreground">Try a different search term or category</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Popular Articles */}
            {!selectedCategory && !searchQuery && (
              <div className="space-y-6 mb-12">
                <h2 className="text-2xl font-bold">Popular Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {articles?.slice(0, 4).map((article: KBArticle) => (
                    <Card
                      key={article.id}
                      className="group cursor-pointer hover:shadow-md transition-all border-0 bg-white"
                      onClick={() => handleArticleClick(article.slug)}
                    >
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {article.category_name}
                          </Badge>
                          <span className="text-sm text-slate-500">{article.view_count || 0} views</span>
                        </div>
                        <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors">{article.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{article.summary}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Content Management Cards */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Content Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ManagementCard
                  title="Add New Article"
                  description="Create a new help article or Q&A"
                  icon={<Plus className="w-5 h-5 text-green-600" />}
                  badge="Content"
                  badgeVariant="success"
                  onClick={() => setShowCreateModal(true)}
                />
                <ManagementCard
                  title="Edit Existing"
                  description="Modify current articles and answers"
                  icon={<Edit className="w-5 h-5 text-blue-600" />}
                  badge="Manage"
                  badgeVariant="info"
                  onClick={() => navigate('/helpdesk/help-center/manage/articles')}
                />
                <ManagementCard
                  title="Manage Categories"
                  description="Organize content by categories"
                  icon={<Book className="w-5 h-5 text-purple-600" />}
                  badge="Structure"
                  badgeVariant="secondary"
                  onClick={() => navigate('/helpdesk/help-center/manage/categories')}
                />
                <ManagementCard
                  title="AI Knowledge Hub"
                  description="Sync with AI agents and knowledge base"
                  icon={<Bot className="w-5 h-5 text-blue-600" />}
                  badge="AI Integration"
                  badgeVariant="info"
                  onClick={() => navigate('/ai/knowledge-hub')}
                />
              </div>
            </div>
          </>
        ) : (
          <Tabs value={currentView} onValueChange={(v) => navigate(`/helpdesk/help-center/manage/${v === 'manage-articles' ? 'articles' : 'categories'}`)} className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="manage-articles">Articles</TabsTrigger>
              <TabsTrigger value="manage-categories">Categories</TabsTrigger>
            </TabsList>

            <TabsContent value="manage-articles" className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search articles to manage..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Article
                </Button>
              </div>

              <div className="bg-white rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articlesLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                        </TableCell>
                      </TableRow>
                    ) : articles?.map((art: KBArticle) => (
                      <TableRow key={art.id}>
                        <TableCell>
                          <div className="font-medium">{art.title}</div>
                          <div className="text-xs text-muted-foreground">{art.slug}</div>
                        </TableCell>
                        <TableCell>{art.category_name}</TableCell>
                        <TableCell>
                          <Badge variant={art.is_published ? 'default' : 'secondary'}>
                            {art.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell>{art.view_count || 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setEditingArticle(art)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => {
                              if (confirm('Are you sure you want to delete this article?')) {
                                deleteArticleMutation.mutate(art.id);
                              }
                            }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => window.open(`/helpdesk/help-center/${art.slug}`, '_blank')}>
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {articles?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No articles found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="manage-categories" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">KB Categories</h2>
                <Button onClick={() => setShowCategoryModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Category
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categories?.map((cat: KBCategory) => (
                  <Card key={cat.id}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <Book className="w-5 h-5 text-slate-600" />
                        </div>
                        <CardTitle className="text-lg">{cat.name}</CardTitle>
                      </div>
                      <Badge variant="outline">{cat.article_count || 0} articles</Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{cat.description || 'No description provided.'}</p>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingCategory(cat)}>Edit</Button>
                        <Button variant="outline" size="sm" className="text-red-500" onClick={() => {
                          if (confirm('Are you sure you want to delete this category? All articles must be removed first.')) {
                            deleteCategoryMutation.mutate(cat.id);
                          }
                        }}>Delete</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Create/Edit Article Modal */}
        <Dialog open={showCreateModal || !!editingArticle} onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false);
            setEditingArticle(null);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingArticle ? 'Edit Article' : 'Add New Article'}</DialogTitle>
              <DialogDescription>
                {editingArticle ? 'Update the content of your help article.' : 'Create a new help center article or Q&A entry.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4 col-span-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title / Question</Label>
                  <Input
                    id="title"
                    placeholder="Enter the article title or frequently asked question"
                    value={editingArticle ? editingArticle.title : newArticle.title}
                    onChange={(e) => editingArticle
                      ? setEditingArticle({ ...editingArticle, title: e.target.value })
                      : setNewArticle({ ...newArticle, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary">Brief Summary</Label>
                  <Input
                    id="summary"
                    placeholder="A short snippet for search results"
                    value={editingArticle ? editingArticle.summary : newArticle.summary}
                    onChange={(e) => editingArticle
                      ? setEditingArticle({ ...editingArticle, summary: e.target.value })
                      : setNewArticle({ ...newArticle, summary: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={editingArticle ? editingArticle.category_id : newArticle.category_id}
                  onChange={(e) => editingArticle
                    ? setEditingArticle({ ...editingArticle, category_id: parseInt(e.target.value) })
                    : setNewArticle({ ...newArticle, category_id: e.target.value })
                  }
                >
                  <option value="">Select a category</option>
                  {categories?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                <div className="space-y-0.5">
                  <Label>Published Status</Label>
                  <p className="text-xs text-muted-foreground">Make this visible to users</p>
                </div>
                <Switch
                  checked={editingArticle ? editingArticle.is_published : newArticle.is_published}
                  onCheckedChange={(checked) => editingArticle
                    ? setEditingArticle({ ...editingArticle, is_published: checked })
                    : setNewArticle({ ...newArticle, is_published: checked })
                  }
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="content">Article Content / Answer</Label>
                <Textarea
                  id="content"
                  placeholder="The full detailed content of the article..."
                  value={editingArticle ? (editingArticle.content || editingArticle.body || '') : newArticle.content}
                  onChange={(e) => editingArticle
                    ? setEditingArticle({ ...editingArticle, content: e.target.value })
                    : setNewArticle({ ...newArticle, content: e.target.value })
                  }
                  className="min-h-[250px] font-sans"
                />
                <p className="text-xs text-muted-foreground italic">Tip: You can use HTML for rich formatting.</p>
              </div>

              <div className="flex items-center justify-between col-span-2 p-3 border rounded-lg bg-blue-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <Label>AI Knowledge Sync</Label>
                    <p className="text-xs text-muted-foreground">Feed this article to your AI agents for better automated support</p>
                  </div>
                </div>
                <Switch
                  checked={editingArticle ? editingArticle.sync_to_ai : newArticle.sync_to_ai}
                  onCheckedChange={(checked) => editingArticle
                    ? setEditingArticle({ ...editingArticle, sync_to_ai: checked })
                    : setNewArticle({ ...newArticle, sync_to_ai: checked })
                  }
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => {
                setShowCreateModal(false);
                setEditingArticle(null);
              }}>
                Cancel
              </Button>
              <Button
                onClick={editingArticle ? handleUpdateArticle : handleCreateArticle}
                disabled={createArticleMutation.isPending || updateArticleMutation.isPending}
                className="gap-2"
              >
                {(createArticleMutation.isPending || updateArticleMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                {editingArticle ? 'Update Article' : 'Create Article'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Category Modal */}
        <Dialog open={showCategoryModal || !!editingCategory} onOpenChange={(open) => {
          if (!open) {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
              <DialogDescription>
                Organize your articles with categories.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Category Name</Label>
                <Input
                  id="cat-name"
                  placeholder="e.g. Getting Started"
                  value={editingCategory ? editingCategory.name : newCategory.name}
                  onChange={(e) => editingCategory
                    ? setEditingCategory({ ...editingCategory, name: e.target.value })
                    : setNewCategory({ ...newCategory, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-desc">Description</Label>
                <Textarea
                  id="cat-desc"
                  placeholder="Brief description of what this category covers"
                  value={editingCategory ? editingCategory.description : newCategory.description}
                  onChange={(e) => editingCategory
                    ? setEditingCategory({ ...editingCategory, description: e.target.value })
                    : setNewCategory({ ...newCategory, description: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowCategoryModal(false);
                setEditingCategory(null);
              }}>Cancel</Button>
              <Button onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}>
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
};

const ManagementCard = ({ title, description, icon, badge, badgeVariant, onClick }: any) => {
  const badgeClass = {
    success: 'bg-green-50 text-green-700 border-green-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    secondary: 'bg-purple-50 text-purple-700 border-purple-200',
    default: 'bg-slate-50 text-slate-700 border-slate-200'
  }[badgeVariant as 'success' | 'info' | 'secondary' | 'default'] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <Card
      className="group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border-0 bg-white"
      onClick={onClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
            {icon}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-slate-900">{title}</div>
            <div className="text-xs text-slate-500 line-clamp-1">{description}</div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={badgeClass}>{badge}</Badge>
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary" />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default KnowledgeBasePortal;
