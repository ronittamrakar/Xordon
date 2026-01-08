import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActiveCompany, companyQueryKey } from '@/hooks/useActiveCompany';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { listingsApi } from '@/services';
import { Search, TrendingUp, TrendingDown, Link2, BarChart3, Loader2, ExternalLink, AlertCircle, CheckCircle, XCircle, Target, Globe } from 'lucide-react';
import SEO from '@/components/SEO';
import { KeywordGapAnalyzer } from '@/components/seo/KeywordGapAnalyzer';
import { KeywordClusterTool } from '@/components/seo/KeywordClusterTool';
import { SerpAnalyzer } from '@/components/seo/SerpAnalyzer';
import { BacklinkGapAnalyzer } from '@/components/seo/BacklinkGapAnalyzer';
import { BacklinkAnalytics } from '@/components/seo/BacklinkAnalytics';
import { TechnicalAuditScanner } from '@/components/seo/TechnicalAuditScanner';
import { ContentOptimizer } from '@/components/seo/ContentOptimizer';
import { SeoReports } from '@/components/seo/SeoReports';

export default function SeoEnhanced({ initialTab = 'keywords' }: { initialTab?: string }) {
  console.log('SeoEnhanced component loaded');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeCompanyId, hasCompany } = useActiveCompany();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [keywordQuery, setKeywordQuery] = useState('');
  const [isKeywordExplorerOpen, setIsKeywordExplorerOpen] = useState(false);
  const [isAddBacklinkOpen, setIsAddBacklinkOpen] = useState(false);
  const [isCreateAuditOpen, setIsCreateAuditOpen] = useState(false);
  const [newBacklink, setNewBacklink] = useState({
    source_url: '',
    target_url: '',
    anchor_text: '',
    link_type: 'dofollow',
  });
  const [auditUrl, setAuditUrl] = useState('');

  // Keyword Explorer
  const [explorerQuery, setExplorerQuery] = useState('');
  const { data: keywordSuggestions = [], isLoading: suggestionsLoading, refetch: searchKeywords } = useQuery({
    queryKey: [...companyQueryKey('keyword-suggestions', activeCompanyId), explorerQuery],
    queryFn: () => listingsApi.exploreKeywords({ keyword: explorerQuery, limit: 50 }),
    enabled: false,
  });

  // Keywords Tracking
  const { data: keywords = [], isLoading: keywordsLoading } = useQuery({
    queryKey: companyQueryKey('seo-keywords', activeCompanyId),
    queryFn: () => listingsApi.getKeywords(),
    enabled: hasCompany,
  });

  const addKeywordMutation = useMutation({
    mutationFn: (data: { keyword: string; target_url?: string; location?: string }) => listingsApi.addKeyword(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('seo-keywords', activeCompanyId) });
      toast({ title: 'Keyword added to tracking' });
    },
  });

  // Backlinks
  const { data: backlinksData, isLoading: backlinksLoading } = useQuery({
    queryKey: companyQueryKey('seo-backlinks', activeCompanyId),
    queryFn: () => listingsApi.getBacklinks(),
    enabled: hasCompany && activeTab === 'backlinks',
  });

  const { data: backlinksByDomain = [], isLoading: domainLinksLoading } = useQuery({
    queryKey: companyQueryKey('backlinks-by-domain', activeCompanyId),
    queryFn: () => listingsApi.getBacklinksByDomain(),
    enabled: hasCompany && activeTab === 'backlinks',
  });

  const addBacklinkMutation = useMutation({
    mutationFn: (data: typeof newBacklink) => listingsApi.addBacklink(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('seo-backlinks', activeCompanyId) });
      setIsAddBacklinkOpen(false);
      setNewBacklink({ source_url: '', target_url: '', anchor_text: '', link_type: 'dofollow' });
      toast({ title: 'Backlink added successfully' });
    },
  });

  // Site Audits
  const { data: audits = [], isLoading: auditsLoading } = useQuery({
    queryKey: companyQueryKey('seo-audits', activeCompanyId),
    queryFn: () => listingsApi.getAudits(),
    enabled: hasCompany && activeTab === 'audits',
  });

  const createAuditMutation = useMutation({
    mutationFn: (data: { url: string }) => listingsApi.createAudit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('seo-audits', activeCompanyId) });
      setIsCreateAuditOpen(false);
      setAuditUrl('');
      toast({ title: 'Audit started successfully' });
    },
  });

  // Competitors
  const { data: competitors = [] } = useQuery({
    queryKey: companyQueryKey('seo-competitors', activeCompanyId),
    queryFn: () => listingsApi.getCompetitors(),
    enabled: hasCompany && activeTab === 'competitors',
  });

  const backlinks = backlinksData?.backlinks || [];
  const backlinksStats = backlinksData?.stats || { total: 0, dofollow: 0, nofollow: 0, avg_da: 0, avg_pa: 0 };

  const getPositionBadge = (position: number | null) => {
    if (!position) return <Badge variant="outline">Not ranked</Badge>;
    if (position <= 3) return <Badge className="bg-green-500">#{position}</Badge>;
    if (position <= 10) return <Badge className="bg-blue-500">#{position}</Badge>;
    if (position <= 20) return <Badge className="bg-yellow-500">#{position}</Badge>;
    return <Badge variant="outline">#{position}</Badge>;
  };

  const getPositionChange = (current: number | null, previous: number | null) => {
    if (!current || !previous) return null;
    const change = previous - current;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // SEO metadata for the page
  const canonicalUrl = typeof window !== 'undefined' ? `${window.location.origin}/marketing/seo` : 'https://xordon.com/marketing/seo';
  const ogImageUrl = typeof window !== 'undefined' ? `${window.location.origin}/og-seo-toolkit.png` : 'https://xordon.com/og-seo-toolkit.png';
  return (
    <div className="container mx-auto py-6 space-y-6">
      <SEO
        title="SEO Toolkit — Track Keywords, Backlinks & Site Audits"
        description="Comprehensive SEO toolkit for keyword research, rank tracking, backlink monitoring, and technical site audits. Improve your search rankings with Xordon's all-in-one SEO platform."
        canonical={canonicalUrl}
        ogTitle="SEO Toolkit — Xordon Business OS"
        ogDescription="Track keyword rankings, monitor backlinks, run technical audits, and analyze competitor SEO strategies in one powerful dashboard."
        ogImage={ogImageUrl}
        ogType="website"
        twitterCard="summary_large_image"
        twitterSite="@xordon"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "SEO Toolkit",
          "description": "Comprehensive SEO toolkit for keyword research, rank tracking, backlink monitoring, and technical site audits.",
          "url": canonicalUrl,
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Marketing",
                "item": typeof window !== 'undefined' ? `${window.location.origin}/marketing` : 'https://xordon.com/marketing'
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "SEO Toolkit",
                "item": canonicalUrl
              }
            ]
          },
          "publisher": {
            "@type": "Organization",
            "name": "Xordon",
            "logo": {
              "@type": "ImageObject",
              "url": typeof window !== 'undefined' ? `${window.location.origin}/favicon.png` : 'https://xordon.com/favicon.png'
            }
          }
        }}
        noindex={false}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SEO Toolkit</h1>
          <p className="text-muted-foreground">Keyword research, rank tracking, backlinks, and site audits</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="keyword-gap">Keyword Gap</TabsTrigger>
          <TabsTrigger value="clustering">Clustering</TabsTrigger>
          <TabsTrigger value="serp">SERP Analysis</TabsTrigger>
          <TabsTrigger value="backlinks">Backlinks</TabsTrigger>
          <TabsTrigger value="audits">Site Audits</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* KEYWORDS TAB */}
        <TabsContent value="keywords" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{keywords.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Top 3</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {keywords.filter((k: any) => k.current_position && k.current_position <= 3).length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Top 10</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">
                  {keywords.filter((k: any) => k.current_position && k.current_position <= 10).length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg. Position</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {keywords.length > 0
                    ? Math.round(
                      keywords
                        .filter((k: any) => k.current_position)
                        .reduce((sum: number, k: any) => sum + (k.current_position || 0), 0) /
                      keywords.filter((k: any) => k.current_position).length
                    )
                    : 0}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Keyword Explorer</CardTitle>
                  <CardDescription>Find new keyword opportunities</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a keyword to explore..."
                  value={explorerQuery}
                  onChange={(e) => setExplorerQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && explorerQuery) {
                      searchKeywords();
                    }
                  }}
                />
                <Button
                  onClick={() => searchKeywords()}
                  disabled={!explorerQuery || suggestionsLoading}
                >
                  {suggestionsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Search
                </Button>
              </div>

              {suggestionsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}

              {keywordSuggestions.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead>Volume</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>CPC</TableHead>
                      <TableHead>Competition</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keywordSuggestions.map((suggestion: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{suggestion.keyword}</TableCell>
                        <TableCell>{suggestion.search_volume?.toLocaleString() || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={suggestion.keyword_difficulty || 0} className="w-16 h-2" />
                            <span className="text-sm">{suggestion.keyword_difficulty || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>${suggestion.cpc?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          <Badge variant={suggestion.competition === 'high' ? 'destructive' : 'outline'}>
                            {suggestion.competition || 'low'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addKeywordMutation.mutate({ keyword: suggestion.keyword })}
                          >
                            Track
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tracked Keywords</CardTitle>
              <CardDescription>Monitor your keyword rankings</CardDescription>
            </CardHeader>
            <CardContent>
              {keywordsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : keywords.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No keywords tracked yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead>Volume</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Best Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keywords.map((keyword: any) => (
                      <TableRow key={keyword.id}>
                        <TableCell className="font-medium">{keyword.keyword}</TableCell>
                        <TableCell>{getPositionBadge(keyword.current_position)}</TableCell>
                        <TableCell>{getPositionChange(keyword.current_position, keyword.previous_position)}</TableCell>
                        <TableCell>{keyword.search_volume?.toLocaleString() || 'N/A'}</TableCell>
                        <TableCell>{keyword.difficulty || 'N/A'}</TableCell>
                        <TableCell>{keyword.best_position ? `#${keyword.best_position}` : 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* KEYWORD GAP TAB */}
        <TabsContent value="keyword-gap" className="space-y-6">
          <KeywordGapAnalyzer />
        </TabsContent>

        {/* CLUSTERING TAB */}
        <TabsContent value="clustering" className="space-y-6">
          <KeywordClusterTool />
        </TabsContent>

        {/* SERP TAB */}
        <TabsContent value="serp" className="space-y-6">
          <SerpAnalyzer />
        </TabsContent>

        {/* BACKLINKS TAB */}
        <TabsContent value="backlinks" className="space-y-6">

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2">Overview</TabsTrigger>
              <TabsTrigger value="gap" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2">Gap Analysis</TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2">Analytics & Toxicity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid gap-4 md:grid-cols-5">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Backlinks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{backlinksStats.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Dofollow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">{backlinksStats.dofollow}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Nofollow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-gray-600">{backlinksStats.nofollow}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg. DA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{backlinksStats.avg_da || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg. PA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{backlinksStats.avg_pa || 0}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Dialog open={isAddBacklinkOpen} onOpenChange={setIsAddBacklinkOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Link2 className="h-4 w-4 mr-2" />
                      Add Backlink
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Backlink</DialogTitle>
                      <DialogDescription>Track a backlink manually</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Source URL</Label>
                        <Input
                          value={newBacklink.source_url}
                          onChange={(e) => setNewBacklink({ ...newBacklink, source_url: e.target.value })}
                          placeholder="https://example.com/page"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Target URL</Label>
                        <Input
                          value={newBacklink.target_url}
                          onChange={(e) => setNewBacklink({ ...newBacklink, target_url: e.target.value })}
                          placeholder="https://yoursite.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Anchor Text</Label>
                        <Input
                          value={newBacklink.anchor_text}
                          onChange={(e) => setNewBacklink({ ...newBacklink, anchor_text: e.target.value })}
                          placeholder="Click here"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Link Type</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={newBacklink.link_type === 'dofollow' ? 'default' : 'outline'}
                            onClick={() => setNewBacklink({ ...newBacklink, link_type: 'dofollow' })}
                          >
                            Dofollow
                          </Button>
                          <Button
                            type="button"
                            variant={newBacklink.link_type === 'nofollow' ? 'default' : 'outline'}
                            onClick={() => setNewBacklink({ ...newBacklink, link_type: 'nofollow' })}
                          >
                            Nofollow
                          </Button>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddBacklinkOpen(false)}>Cancel</Button>
                      <Button
                        onClick={() => addBacklinkMutation.mutate(newBacklink)}
                        disabled={!newBacklink.source_url || !newBacklink.target_url}
                      >
                        Add Backlink
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Backlinks by Domain</CardTitle>
                  <CardDescription>Top referring domains</CardDescription>
                </CardHeader>
                <CardContent>
                  {domainLinksLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : backlinksByDomain.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No backlinks tracked yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Domain</TableHead>
                          <TableHead>Backlinks</TableHead>
                          <TableHead>DA</TableHead>
                          <TableHead>Dofollow</TableHead>
                          <TableHead>First Seen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {backlinksByDomain.map((domain: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              {domain.domain}
                            </TableCell>
                            <TableCell>{domain.count}</TableCell>
                            <TableCell>
                              <Badge variant={domain.avg_da >= 50 ? 'default' : 'outline'}>
                                {domain.avg_da}
                              </Badge>
                            </TableCell>
                            <TableCell>{domain.dofollow_count}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(domain.first_seen).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>All Backlinks</CardTitle>
                </CardHeader>
                <CardContent>
                  {backlinksLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : backlinks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No backlinks tracked yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Source</TableHead>
                          <TableHead>Anchor Text</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>DA</TableHead>
                          <TableHead>PA</TableHead>
                          <TableHead>Discovered</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {backlinks.map((link: any) => (
                          <TableRow key={link.id}>
                            <TableCell>
                              <a href={link.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                {new URL(link.source_url).hostname}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </TableCell>
                            <TableCell className="font-medium">{link.anchor_text || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={link.link_type === 'dofollow' ? 'default' : 'outline'}>
                                {link.link_type}
                              </Badge>
                            </TableCell>
                            <TableCell>{link.domain_authority || 'N/A'}</TableCell>
                            <TableCell>{link.page_authority || 'N/A'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(link.discovered_at || link.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gap" className="mt-6">
              <BacklinkGapAnalyzer />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <BacklinkAnalytics />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* SITE AUDITS TAB */}
        <TabsContent value="audits" className="space-y-6">
          <TechnicalAuditScanner />

          <div className="flex items-center justify-between mt-8">
            <h3 className="text-lg font-semibold">Audit History</h3>
          </div>

          {auditsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : audits.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center space-y-2">
                <p className="text-muted-foreground">No audits yet. Create your first site audit!</p>
                <p className="text-sm text-muted-foreground">Get comprehensive technical SEO analysis, performance metrics, and actionable recommendations.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {audits.map((audit: any) => (
                <Card key={audit.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{audit.url}</CardTitle>
                        <CardDescription>{new Date(audit.created_at).toLocaleDateString()}</CardDescription>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getScoreColor(audit.overall_score || 0)}`}>
                          {audit.overall_score || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Overall Score</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Technical</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={audit.technical_score || 0} className="h-2 flex-1" />
                          <span className={`text-sm font-medium ${getScoreColor(audit.technical_score || 0)}`}>
                            {audit.technical_score || 0}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Content</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={audit.content_score || 0} className="h-2 flex-1" />
                          <span className={`text-sm font-medium ${getScoreColor(audit.content_score || 0)}`}>
                            {audit.content_score || 0}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Performance</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={audit.performance_score || 0} className="h-2 flex-1" />
                          <span className={`text-sm font-medium ${getScoreColor(audit.performance_score || 0)}`}>
                            {audit.performance_score || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {audit.issues && audit.issues.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Key Issues</p>
                        {audit.issues.slice(0, 5).map((issue: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            {issue.severity === 'error' ? (
                              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                            ) : issue.severity === 'warning' ? (
                              <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            )}
                            <span>{issue.message}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={audit.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Site
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* CONTENT TAB */}
        <TabsContent value="content" className="space-y-6">
          <ContentOptimizer />
        </TabsContent>

        {/* COMPETITORS TAB */}
        <TabsContent value="competitors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Analysis</CardTitle>
              <CardDescription>Track and analyze your competitors' SEO performance</CardDescription>
            </CardHeader>
            <CardContent>
              {competitors.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No competitors added yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Competitor</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>DA</TableHead>
                      <TableHead>Organic Traffic</TableHead>
                      <TableHead>Keywords</TableHead>
                      <TableHead>Backlinks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competitors.map((competitor: any) => (
                      <TableRow key={competitor.id}>
                        <TableCell className="font-medium">{competitor.name}</TableCell>
                        <TableCell>{competitor.domain}</TableCell>
                        <TableCell>{competitor.domain_authority || 'N/A'}</TableCell>
                        <TableCell>{competitor.organic_traffic?.toLocaleString() || 'N/A'}</TableCell>
                        <TableCell>{competitor.keywords_count?.toLocaleString() || 'N/A'}</TableCell>
                        <TableCell>{competitor.backlinks_count?.toLocaleString() || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORTS TAB */}
        <TabsContent value="reports" className="space-y-6">
          <SeoReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}
