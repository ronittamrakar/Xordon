import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  BookOpen, Play, Search, Star, Clock, Users, Mail, MessageSquare,
  ShoppingCart, Gift, RefreshCw, Calendar, Sparkles, Download, ChevronRight,
  LayoutGrid, List, SlidersHorizontal, ArrowUpDown, ExternalLink, Trash2,
  MoreHorizontal, Pause, Zap, Filter, X, Phone, Wrench, Home, Building2, Archive
} from 'lucide-react';

interface Recipe {
  id: number;
  name: string;
  description?: string;
  category: string;
  industry?: string;
  target_audience: string;
  channels: string[];
  trigger_type?: string;
  steps: Array<{ type: string; delay: number; subject?: string; message?: string }>;
  estimated_duration?: string;
  tags?: string[];
  usage_count: number;
  rating: number;
  is_system: boolean;
  type?: 'trigger' | 'rule' | 'workflow';
}

interface AutomationInstance {
  id: number;
  recipe_id?: number;
  flow_id?: number;
  automation_id?: number;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived' | 'trashed';
  recipe_name?: string;
  category?: string;
  channels?: string[];
  last_triggered_at?: string;
  created_at?: string;
}

type ViewMode = 'grid' | 'table';
type SortOption = 'popular' | 'rating' | 'newest' | 'name';

const categoryIcons: Record<string, React.ReactNode> = {
  welcome: <Gift className="h-5 w-5" />,
  nurture: <Users className="h-5 w-5" />,
  reengagement: <RefreshCw className="h-5 w-5" />,
  abandoned_cart: <ShoppingCart className="h-5 w-5" />,
  post_purchase: <Mail className="h-5 w-5" />,
  birthday: <Gift className="h-5 w-5" />,
  review_request: <Star className="h-5 w-5" />,
  appointment: <Calendar className="h-5 w-5" />,
  custom: <Sparkles className="h-5 w-5" />
};

const categoryLabels: Record<string, string> = {
  welcome: 'Welcome Series',
  nurture: 'Lead Nurture',
  reengagement: 'Re-engagement',
  abandoned_cart: 'Abandoned Cart',
  post_purchase: 'Post-Purchase',
  birthday: 'Birthday/Anniversary',
  review_request: 'Review Request',
  appointment: 'Appointment',
  custom: 'Custom'
};

export default function Workflows() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [instances, setInstances] = useState<AutomationInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null);

  // selectedDifficulty removed
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // View and sort
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  // Dialog
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recipesRes, instancesRes] = await Promise.all([
        api.get('/automation-recipes'),
        api.get('/automation-recipes/instances')
      ]);
      const recipesData = recipesRes.data as { items?: Recipe[] };
      const instancesData = instancesRes.data as { items?: AutomationInstance[] };
      setRecipes(recipesData.items || []);
      setInstances(instancesData.items || []);
    } catch (error: any) {
      console.error('Failed to load recipes:', error);
      // If unauthorized in dev, try to fetch a dev token and retry once
      if (import.meta.env.DEV && error?.message && error.message.toLowerCase().includes('unauthorized')) {
        try {
          const tokenRes = await fetch((import.meta.env.VITE_API_URL || '') + '/auth/dev-token');
          if (tokenRes.ok) {
            const data = await tokenRes.json();
            if (data?.token) {
              localStorage.setItem('auth_token', data.token);
              // Retry
              const [recipesRes2, instancesRes2] = await Promise.all([
                api.get('/automation-recipes'),
                api.get('/automation-recipes/instances')
              ]);
              const recipesData2 = recipesRes2.data as { items?: Recipe[] };
              const instancesData2 = instancesRes2.data as { items?: AutomationInstance[] };
              setRecipes(recipesData2.items || []);
              setInstances(instancesData2.items || []);
              return;
            }
          }
        } catch (innerErr) {
          console.error('Dev token fetch failed:', innerErr);
        }
      }
      toast.error('Failed to load automation recipes');
      setRecipes([]);
      setInstances([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInstallRecipe = async (recipe: Recipe) => {
    try {
      setInstalling(true);
      const response = await api.post(`/automation-recipes/${recipe.id}/install`, {
        name: recipe.name
      });
      const data = response.data as { flow_id?: number; id?: number };
      toast.success('Recipe installed! Opening Flow Builder...');
      setIsPreviewOpen(false);

      // Navigate to FlowBuilder with the created flow
      if (data.flow_id) {
        navigate(`/automations/builder/${data.flow_id}`);
      } else {
        // Fallback: reload and show in My Automations
        loadData();
      }
    } catch (error) {
      toast.error('Failed to install recipe');
    } finally {
      setInstalling(false);
    }
  };

  const handleToggleInstance = async (instance: AutomationInstance) => {
    try {
      const newStatus = instance.status === 'active' ? 'paused' : 'active';
      await api.put(`/automation-recipes/instances/${instance.id}`, { status: newStatus });
      toast.success(`Automation ${newStatus === 'active' ? 'activated' : 'paused'}`);
      loadData();
    } catch (error) {
      toast.error('Failed to update automation');
    }
  };

  const handleOpenFlow = (instance: AutomationInstance) => {
    if (instance.flow_id) {
      navigate(`/automations/builder/${instance.flow_id}`);
    } else {
      toast.error('No flow associated with this automation');
    }
  };

  const handleMoveToTrash = async (instance: AutomationInstance) => {
    try {
      await api.put(`/automation-recipes/instances/${instance.id}`, { status: 'trashed' });
      toast.success('Moved to trash');
      loadData();
    } catch (error) {
      toast.error('Failed to move to trash');
    }
  };

  const handleArchive = async (instance: AutomationInstance) => {
    try {
      await api.put(`/automation-recipes/instances/${instance.id}`, { status: 'archived' });
      toast.success('Archived successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to archive');
    }
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedAudience(null);
    // setSelectedDifficulty(null);
    setSelectedChannel(null);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCategory || selectedAudience || selectedChannel || searchQuery;

  // Filter and sort recipes
  const filteredRecipes = useMemo(() => {
    const result = recipes.filter(recipe => {
      const matchesSearch = !searchQuery ||
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = !selectedCategory || recipe.category === selectedCategory;
      const matchesAudience = !selectedAudience || recipe.target_audience === selectedAudience;

      // matchesDifficulty removed
      const matchesChannel = !selectedChannel || recipe.channels.includes(selectedChannel);
      return matchesSearch && matchesCategory && matchesAudience && matchesChannel;
    });

    // Sort
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.usage_count - a.usage_count);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        result.sort((a, b) => b.id - a.id);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [recipes, searchQuery, selectedCategory, selectedAudience, selectedChannel, sortBy]);

  // getDifficultyColor removed

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-3 w-3" />;
      case 'sms': return <MessageSquare className="h-3 w-3" />;
      default: return null;
    }
  };

  return (

    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">Pre-built workflows to get you started quickly</p>
        </div>
      </div>

      <Tabs defaultValue="library" className="space-y-4">
        <TabsList>
          <TabsTrigger value="library">
            <BookOpen className="h-4 w-4 mr-2" />
            Workflows Library
          </TabsTrigger>
          <TabsTrigger value="my-automations">
            <Play className="h-4 w-4 mr-2" />
            My Workflows ({instances.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4">
          {/* Search, Filters, Sort, View Toggle */}
          <div className="space-y-4">
            {/* Top toolbar */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recipes..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={selectedCategory || '__all'} onValueChange={(v) => setSelectedCategory(v === '__all' ? null : v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">All ({recipes.length})</SelectItem>
                    {Object.entries(categoryLabels).map(([key, label]) => {
                      const count = recipes.filter(r => r.category === key).length;
                      if (count === 0) return null;
                      return (
                        <SelectItem key={key} value={key}>
                          {label} ({count})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? 'bg-primary/10' : ''}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {hasActiveFilters && <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">!</Badge>}
                </Button>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-[140px]">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="rounded-r-none"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="rounded-l-none"
                    onClick={() => setViewMode('table')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Filter panel */}
            {showFilters && (
              <Card className="p-4">
                <CardHeader className="py-2 px-0 flex items-center justify-between">
                  <CardTitle className="text-lg">Filters</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Category</div>
                      <Select value={selectedCategory || '__all'} onValueChange={(v) => setSelectedCategory(v === '__all' ? null : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all">All ({recipes.length})</SelectItem>
                          {Object.entries(categoryLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Audience</div>
                      <Select value={selectedAudience || '__all'} onValueChange={(v) => setSelectedAudience(v === '__all' ? null : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All audiences" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all">All</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="consumers">Consumers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Difficulty filter removed */}

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Channel</div>
                      <Select value={selectedChannel || '__all'} onValueChange={(v) => setSelectedChannel(v === '__all' ? null : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all">Any</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {loading ? (
              <div>Loading...</div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRecipes.map((recipe) => (
                      <Card key={recipe.id} className="p-4">
                        <CardHeader>
                          <CardTitle className="text-sm font-semibold">{recipe.name}</CardTitle>
                          <CardDescription className="text-xs">{recipe.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-muted-foreground text-sm">{categoryIcons[recipe.category]} {categoryLabels[recipe.category]}</div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => { setSelectedRecipe(recipe); setIsPreviewOpen(true); }}>Preview</Button>
                              <Button size="sm" variant="secondary" onClick={() => handleInstallRecipe(recipe)}>Install</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        {/* Difficulty Header Removed */}
                        <TableHead>Channels</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecipes.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.name}</TableCell>
                          <TableCell>{categoryLabels[r.category]}</TableCell>
                          {/* Difficulty Cell Removed */}
                          <TableCell>{r.channels.map((c, i) => <span key={i} className="mr-2">{getChannelIcon(c)}</span>)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => { setSelectedRecipe(r); setIsPreviewOpen(true); }}>Preview</Button>
                              <Button size="sm" variant="secondary" onClick={() => handleInstallRecipe(r)}>Install</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </>
            )}

            {/* Preview dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedRecipe?.name}</DialogTitle>
                  <DialogDescription>{selectedRecipe?.description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <div><strong>Category:</strong> {selectedRecipe ? categoryLabels[selectedRecipe.category] : ''}</div>
                  <div><strong>Channels:</strong> {selectedRecipe?.channels.join(', ')}</div>
                </div>
                <DialogFooter>
                  <Button onClick={() => { if (selectedRecipe) handleInstallRecipe(selectedRecipe); }}>Install</Button>
                  <Button variant="ghost" onClick={() => setIsPreviewOpen(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </div>
        </TabsContent>

        <TabsContent value="my-automations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Recipe</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Triggered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instances.filter(i => i.status !== 'archived' && i.status !== 'trashed').map((inst) => (
                    <TableRow key={inst.id}>
                      <TableCell>{inst.name}</TableCell>
                      <TableCell>{inst.recipe_name}</TableCell>
                      <TableCell>{inst.status}</TableCell>
                      <TableCell>{inst.last_triggered_at}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleOpenFlow(inst)}>Open</Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleToggleInstance(inst)}>
                                {inst.status === 'active' ? (
                                  <>
                                    <Pause className="mr-2 h-4 w-4" />
                                    Pause
                                  </>
                                ) : (
                                  <>
                                    <Play className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleArchive(inst)}>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMoveToTrash(inst)} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
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
        </TabsContent>
      </Tabs>
    </>

  );
}
