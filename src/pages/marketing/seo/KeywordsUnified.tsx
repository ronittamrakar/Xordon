import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActiveCompany, companyQueryKey } from '@/hooks/useActiveCompany';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { listingsApi } from '@/services';
import { Search, Loader2, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { KeywordGapAnalyzer } from '@/components/seo/KeywordGapAnalyzer';
import { KeywordClusterTool } from '@/components/seo/KeywordClusterTool';
import { useSearchParams } from 'react-router-dom';

export default function KeywordsUnifiedPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { activeCompanyId, hasCompany } = useActiveCompany();
    const [explorerQuery, setExplorerQuery] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const currentTab = searchParams.get('tab') || 'research';

    const handleTabChange = (value: string) => {
        setSearchParams({ tab: value });
    };

    // Keyword Explorer Data
    const { data: keywordSuggestions = [], isLoading: suggestionsLoading, refetch: searchKeywords } = useQuery({
        queryKey: [...companyQueryKey('keyword-suggestions', activeCompanyId), explorerQuery],
        queryFn: () => listingsApi.exploreKeywords({ keyword: explorerQuery, limit: 50 }),
        enabled: false,
    });

    // Tracked Keywords Data
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

    const deleteKeywordMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/seo/keywords/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyQueryKey('seo-keywords', activeCompanyId) });
            toast({ title: 'Keyword deleted' });
        },
        onError: () => {
            toast({ title: 'Failed to delete keyword', variant: 'destructive' });
        }
    });

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

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Keyword Management</h1>
                    <p className="text-muted-foreground">Comprehensive keyword research, tracking, and analysis</p>
                </div>
            </div>

            <Tabs defaultValue="research" value={currentTab} onValueChange={handleTabChange} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="research">Keywords & Tracking</TabsTrigger>
                    <TabsTrigger value="gap">Keyword Gap</TabsTrigger>
                    <TabsTrigger value="clustering">Clustering</TabsTrigger>
                </TabsList>

                <TabsContent value="research" className="space-y-6">
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
                                            <TableHead className="w-[50px]"></TableHead>
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
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                        onClick={() => deleteKeywordMutation.mutate(keyword.id)}
                                                        disabled={deleteKeywordMutation.isPending}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="gap">
                    <KeywordGapAnalyzer />
                </TabsContent>

                <TabsContent value="clustering">
                    <KeywordClusterTool />
                </TabsContent>
            </Tabs>
        </div>
    );
}
