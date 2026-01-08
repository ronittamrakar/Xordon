import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActiveCompany, companyQueryKey } from '@/hooks/useActiveCompany';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { listingsApi, BusinessListing, SeoKeyword, SeoPage } from '@/services';
import { Plus, Globe, Search, TrendingUp, MapPin, FileTextIcon, BarChart3, Loader2, ExternalLink, RefreshCw } from 'lucide-react';

const statusColors: Record<string, string> = {
  verified: 'bg-green-500',
  claimed: 'bg-blue-500',
  pending: 'bg-yellow-500',
  needs_update: 'bg-orange-500',
  not_listed: 'bg-gray-500',
  error: 'bg-red-500',
};

export default function ListingsSeo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeCompanyId, hasCompany } = useActiveCompany();
  const [activeTab, setActiveTab] = useState('listings');
  const [isAddListingOpen, setIsAddListingOpen] = useState(false);
  const [isAddKeywordOpen, setIsAddKeywordOpen] = useState(false);
  const [isAddPageOpen, setIsAddPageOpen] = useState(false);
  const [isAddCompetitorOpen, setIsAddCompetitorOpen] = useState(false);
  const [newListing, setNewListing] = useState({
    platform: 'google_business',
    listing_url: '',
    business_name: '',
    address: '',
    phone: '',
  });
  const [newKeyword, setNewKeyword] = useState({
    keyword: '',
    search_engine: 'google',
    location: '',
  });
  const [newPage, setNewPage] = useState({ url: '' });
  const [newCompetitor, setNewCompetitor] = useState({ name: '', domain: '' });

  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: companyQueryKey('business-listings', activeCompanyId),
    queryFn: () => listingsApi.getListings(),
    enabled: hasCompany,
  });

  const { data: keywords = [], isLoading: keywordsLoading } = useQuery({
    queryKey: companyQueryKey('seo-keywords', activeCompanyId),
    queryFn: () => listingsApi.getKeywords(),
    enabled: hasCompany,
  });

  const { data: pages = [] } = useQuery({
    queryKey: companyQueryKey('seo-pages', activeCompanyId),
    queryFn: () => listingsApi.getPages(),
    enabled: hasCompany,
  });

  const { data: competitors = [] } = useQuery({
    queryKey: companyQueryKey('seo-competitors', activeCompanyId),
    queryFn: () => listingsApi.getCompetitors(),
    enabled: hasCompany,
  });

  const { data: analytics } = useQuery({
    queryKey: companyQueryKey('listings-analytics', activeCompanyId),
    queryFn: () => listingsApi.getAnalytics(),
    enabled: hasCompany,
  });

  const createListingMutation = useMutation({
    mutationFn: (data: typeof newListing) => listingsApi.createListing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('business-listings', activeCompanyId) });
      setIsAddListingOpen(false);
      setNewListing({ platform: 'google_business', listing_url: '', business_name: '', address: '', phone: '' });
      toast({ title: 'Listing added successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to add listing', variant: 'destructive' });
    },
  });

  const createKeywordMutation = useMutation({
    mutationFn: (data: typeof newKeyword) => listingsApi.createKeyword(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('seo-keywords', activeCompanyId) });
      setIsAddKeywordOpen(false);
      setNewKeyword({ keyword: '', search_engine: 'google', location: '' });
      toast({ title: 'Keyword added successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to add keyword', variant: 'destructive' });
    },
  });

  const syncListingMutation = useMutation({
    mutationFn: (id: number) => listingsApi.syncListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('business-listings', activeCompanyId) });
      toast({ title: 'Listing synced successfully' });
    },
  });

  const scanPageMutation = useMutation({
    mutationFn: (id: number) => listingsApi.scanPage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('seo-pages', activeCompanyId) });
      toast({ title: 'Page scan initiated' });
    },
  });

  const addPageMutation = useMutation({
    mutationFn: (url: string) => listingsApi.addPage(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('seo-pages', activeCompanyId) });
      setIsAddPageOpen(false);
      setNewPage({ url: '' });
      toast({ title: 'Page added successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to add page', variant: 'destructive' });
    },
  });

  const addCompetitorMutation = useMutation({
    mutationFn: (data: { name: string; domain: string }) => listingsApi.addCompetitor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('seo-competitors', activeCompanyId) });
      setIsAddCompetitorOpen(false);
      setNewCompetitor({ name: '', domain: '' });
      toast({ title: 'Competitor added successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to add competitor', variant: 'destructive' });
    },
  });

  const deleteCompetitorMutation = useMutation({
    mutationFn: (id: number) => listingsApi.deleteCompetitor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('seo-competitors', activeCompanyId) });
      toast({ title: 'Competitor removed' });
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Listings & SEO</h1>
          <p className="text-muted-foreground">Manage your business listings and track SEO performance</p>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics?.listings?.total || listings.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Claimed Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics?.listings?.claimed || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Keywords Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics?.keywords?.total || keywords.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Position</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">-</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="listings">
            <MapPin className="h-4 w-4 mr-2" />
            Listings
          </TabsTrigger>
          <TabsTrigger value="keywords">
            <Search className="h-4 w-4 mr-2" />
            Keywords
          </TabsTrigger>
          <TabsTrigger value="pages">
            <FileTextIcon className="h-4 w-4 mr-2" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="competitors">
            <TrendingUp className="h-4 w-4 mr-2" />
            Competitors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddListingOpen} onOpenChange={setIsAddListingOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Listing
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Business Listing</DialogTitle>
                  <DialogDescription>Track a new business directory listing</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select value={newListing.platform} onValueChange={(v) => setNewListing({ ...newListing, platform: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google_business">Google Business Profile</SelectItem>
                        <SelectItem value="yelp">Yelp</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="bing_places">Bing Places</SelectItem>
                        <SelectItem value="apple_maps">Apple Maps</SelectItem>
                        <SelectItem value="tripadvisor">TripAdvisor</SelectItem>
                        <SelectItem value="yellowpages">Yellow Pages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Business Name</Label>
                    <Input
                      value={newListing.business_name}
                      onChange={(e) => setNewListing({ ...newListing, business_name: e.target.value })}
                      placeholder="Your Business Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Listing URL</Label>
                    <Input
                      value={newListing.listing_url}
                      onChange={(e) => setNewListing({ ...newListing, listing_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={newListing.address}
                      onChange={(e) => setNewListing({ ...newListing, address: e.target.value })}
                      placeholder="123 Main St, City, State"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={newListing.phone}
                      onChange={(e) => setNewListing({ ...newListing, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddListingOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => createListingMutation.mutate(newListing)}
                    disabled={!newListing.business_name || createListingMutation.isPending}
                  >
                    {createListingMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Listing
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {listingsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : listings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center space-y-2">
                <p className="text-muted-foreground">No listings yet. Add your first business listing!</p>
                <p className="text-sm text-muted-foreground">Track your business presence across directories like Google Business Profile, Yelp, and more.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {listings.map((listing: BusinessListing) => (
                <Card key={listing.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Globe className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{listing.business_name || listing.directory_name}</h4>
                          <p className="text-sm text-muted-foreground capitalize">{listing.directory_name}</p>
                          {listing.address && (
                            <p className="text-sm text-muted-foreground">{listing.address}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {listing.accuracy_score !== null && (
                          <div className="text-right">
                            <p className="text-sm font-medium">Accuracy</p>
                            <Progress value={listing.accuracy_score} className="w-20 h-2" />
                          </div>
                        )}
                        <Badge className={statusColors[listing.status]}>{listing.status.replace('_', ' ')}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncListingMutation.mutate(listing.id)}
                          disabled={syncListingMutation.isPending}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        {listing.listing_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={listing.listing_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddKeywordOpen} onOpenChange={setIsAddKeywordOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Track Keyword
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Track New Keyword</DialogTitle>
                  <DialogDescription>Add a keyword to track rankings</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Keyword</Label>
                    <Input
                      value={newKeyword.keyword}
                      onChange={(e) => setNewKeyword({ ...newKeyword, keyword: e.target.value })}
                      placeholder="e.g., plumber near me"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Search Engine</Label>
                    <Select value={newKeyword.search_engine} onValueChange={(v) => setNewKeyword({ ...newKeyword, search_engine: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="bing">Bing</SelectItem>
                        <SelectItem value="yahoo">Yahoo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Location (optional)</Label>
                    <Input
                      value={newKeyword.location}
                      onChange={(e) => setNewKeyword({ ...newKeyword, location: e.target.value })}
                      placeholder="e.g., New York, NY"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddKeywordOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => createKeywordMutation.mutate(newKeyword)}
                    disabled={!newKeyword.keyword || createKeywordMutation.isPending}
                  >
                    {createKeywordMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Track Keyword
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {keywordsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : keywords.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center space-y-2">
                <p className="text-muted-foreground">No keywords tracked yet. Start tracking your rankings!</p>
                <p className="text-sm text-muted-foreground">Monitor your search engine positions for important keywords and phrases.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {keywords.map((keyword: SeoKeyword) => (
                    <div key={keyword.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{keyword.keyword}</p>
                        <p className="text-sm text-muted-foreground">
                          Google {keyword.location && `• ${keyword.location}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold">{keyword.current_position || '-'}</p>
                          <p className="text-xs text-muted-foreground">Current Position</p>
                        </div>
                        {keyword.previous_position && (
                          <Badge variant={keyword.current_position < keyword.previous_position ? 'default' : 'destructive'}>
                            {keyword.current_position < keyword.previous_position ? '↑' : '↓'}
                            {Math.abs(keyword.current_position - keyword.previous_position)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddPageOpen} onOpenChange={setIsAddPageOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Page
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Page to Track</DialogTitle>
                  <DialogDescription>Monitor SEO performance for a page on your website</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Page URL</Label>
                    <Input
                      value={newPage.url}
                      onChange={(e) => setNewPage({ url: e.target.value })}
                      placeholder="https://example.com/page"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddPageOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => addPageMutation.mutate(newPage.url)}
                    disabled={!newPage.url || addPageMutation.isPending}
                  >
                    {addPageMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Page
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {pages.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center space-y-2">
                <p className="text-muted-foreground">No pages tracked yet</p>
                <p className="text-sm text-muted-foreground">Add pages from your website to monitor SEO health and performance.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pages.map((page: SeoPage) => (
                <Card key={page.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{page.title || page.url}</h4>
                        <p className="text-sm text-muted-foreground">{page.url}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        {page.seo_score !== null && (
                          <div className="text-right">
                            <p className="text-2xl font-bold">{page.seo_score}</p>
                            <p className="text-xs text-muted-foreground">SEO Score</p>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => scanPageMutation.mutate(page.id)}
                          disabled={scanPageMutation.isPending}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Scan
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddCompetitorOpen} onOpenChange={setIsAddCompetitorOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Competitor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Competitor</DialogTitle>
                  <DialogDescription>Track a competitor to benchmark your SEO performance</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Competitor Name</Label>
                    <Input
                      value={newCompetitor.name}
                      onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                      placeholder="Competitor Inc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Domain</Label>
                    <Input
                      value={newCompetitor.domain}
                      onChange={(e) => setNewCompetitor({ ...newCompetitor, domain: e.target.value })}
                      placeholder="competitor.com"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddCompetitorOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => addCompetitorMutation.mutate(newCompetitor)}
                    disabled={!newCompetitor.name || !newCompetitor.domain || addCompetitorMutation.isPending}
                  >
                    {addCompetitorMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Competitor
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {competitors.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center space-y-2">
                <p className="text-muted-foreground">No competitors tracked yet</p>
                <p className="text-sm text-muted-foreground">Track competitor domains to benchmark your SEO performance.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {competitors.map((competitor) => (
                <Card key={competitor.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{competitor.name}</h4>
                        <p className="text-sm text-muted-foreground">{competitor.domain}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={`https://${competitor.domain}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteCompetitorMutation.mutate(competitor.id)}
                          disabled={deleteCompetitorMutation.isPending}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

