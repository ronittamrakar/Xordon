import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Calendar,
  ExternalLink,
  Copy,
  Edit,
  Trash2,
  Globe,
  MoreVertical,
  Search,
  Filter,
  Eye,
  EyeOff,
  BarChart3,
  Settings,
  Link2,
  Users,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import bookingPagesApi, { BookingPage } from '../services/bookingPagesApi';
import { cn } from '@/lib/utils';

interface BookingPagesProps {
  hideHeader?: boolean;
}

export default function BookingPages({ hideHeader = false }: BookingPagesProps) {
  const navigate = useNavigate();
  const [pages, setPages] = useState<BookingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      const data = await bookingPagesApi.list();
      setPages(data);
    } catch (error) {
      toast.error('Failed to load booking pages');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (slug: string) => {
    const url = bookingPagesApi.getPublicUrl(slug);
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const togglePageStatus = async (id: number, currentStatus: boolean) => {
    try {
      await bookingPagesApi.update(id, { is_active: !currentStatus });
      toast.success(`Booking page ${!currentStatus ? 'activated' : 'deactivated'}`);
      loadPages();
    } catch (error) {
      toast.error('Failed to update booking page');
    }
  };

  const deletePage = async (id: number) => {
    if (!confirm('Are you sure you want to delete this booking page?')) return;
    try {
      await bookingPagesApi.delete(id);
      toast.success('Booking page deleted successfully');
      loadPages();
    } catch (error) {
      toast.error('Failed to delete booking page');
    }
  };

  const getSourceBadge = (source: string) => {
    const colors = {
      native: 'bg-blue-100 text-blue-800 border-blue-200',
      calendly: 'bg-green-100 text-green-800 border-green-200',
      acuity: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[source as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = filterSource === 'all' || page.source === filterSource;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && page.is_active) ||
      (filterStatus === 'inactive' && !page.is_active);
    return matchesSearch && matchesSource && matchesStatus;
  });

  const stats = {
    total: pages.length,
    active: pages.filter(p => p.is_active).length,
    totalBookings: pages.reduce((sum, p) => sum + (p.total_bookings || 0), 0),
    pendingLeads: pages.reduce((sum, p) => sum + (p.pending_leads || 0), 0),
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(hideHeader ? "space-y-6" : "p-8 space-y-6")}>
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Booking Pages
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage shareable scheduling pages for your services
            </p>
          </div>
          <Button onClick={() => navigate('/scheduling/booking-pages/new')} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Create Booking Page
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">{stats.total}</div>
                <div className="text-sm text-muted-foreground mt-1">Total Pages</div>
              </div>
              <Globe className="h-10 w-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <div className="text-sm text-muted-foreground mt-1">Active Pages</div>
              </div>
              <Eye className="h-10 w-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalBookings}</div>
                <div className="text-sm text-muted-foreground mt-1">Total Bookings</div>
              </div>
              <Calendar className="h-10 w-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.pendingLeads}</div>
                <div className="text-sm text-muted-foreground mt-1">Pending Leads</div>
              </div>
              <Users className="h-10 w-10 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search booking pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="native">Native</SelectItem>
                <SelectItem value="calendly">Calendly</SelectItem>
                <SelectItem value="acuity">Acuity</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Booking Pages */}
      {filteredPages.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground opacity-50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery || filterSource !== 'all' || filterStatus !== 'all'
                ? 'No booking pages found'
                : 'No booking pages yet'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery || filterSource !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Create your first booking page to start accepting appointments from clients'}
            </p>
            {!searchQuery && filterSource === 'all' && filterStatus === 'all' && (
              <Button onClick={() => navigate('/scheduling/booking-pages/new')} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Booking Page
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPages.map((page) => (
            <Card
              key={page.id}
              className={cn(
                "hover:shadow-xl transition-all duration-200 group relative overflow-hidden",
                !page.is_active && "opacity-75"
              )}
            >
              {/* Status Indicator Bar */}
              <div
                className={cn(
                  "absolute top-0 left-0 right-0 h-1",
                  page.is_active ? "bg-green-500" : "bg-gray-300"
                )}
              />

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {page.title}
                      {!page.is_active && (
                        <Badge variant="outline" className="text-xs">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getSourceBadge(page.source)}>
                        {page.source}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => navigate(`/scheduling/booking-pages/${page.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Page
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyLink(page.slug)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => window.open(bookingPagesApi.getPublicUrl(page.slug), '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Page
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => togglePageStatus(page.id, page.is_active)}>
                        {page.is_active ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deletePage(page.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {page.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {page.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                    /{page.slug}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyLink(page.slug)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-lg font-semibold">{page.total_bookings || 0}</div>
                      <div className="text-xs text-muted-foreground">Bookings</div>
                    </div>
                  </div>
                  {page.pending_leads && page.pending_leads > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-orange-600" />
                      <div>
                        <div className="text-lg font-semibold text-orange-600">{page.pending_leads}</div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(bookingPagesApi.getPublicUrl(page.slug), '_blank')}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => copyLink(page.slug)}
                  >
                    <Link2 className="h-3.5 w-3.5 mr-1.5" />
                    Share
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Tips */}
      {pages.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Pro Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Share your booking page link on social media to increase bookings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Customize your booking page description to clearly explain your services</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Monitor pending leads regularly to convert them into confirmed appointments</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
