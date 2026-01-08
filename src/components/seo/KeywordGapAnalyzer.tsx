import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { api } from '@/lib/api';
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Search, TrendingUp, TrendingDown, Minus, X, Plus, Download, Filter, Save, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useActiveCompany, companyQueryKey } from '@/hooks/useActiveCompany';

interface KeywordGap {
    keyword: string;
    volume: number;
    difficulty: number;
    my_rank: number | null;
    competitor_ranks: Record<string, number>;
    type: 'shared' | 'missing' | 'weak' | 'strong' | 'untapped';
}

export function KeywordGapAnalyzer() {
    const [myDomain, setMyDomain] = useState('');
    const [competitors, setCompetitors] = useState<string[]>(['', '']);
    const [data, setData] = useState<KeywordGap[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');
    const [activeTab, setActiveTab] = useState('missing');
    const { toast } = useToast();
    const { activeCompanyId } = useActiveCompany();

    const { data: savedCompetitors = [], refetch: refetchCompetitors } = useQuery({
        queryKey: companyQueryKey('seo-competitors', activeCompanyId),
        queryFn: async () => {
            const res = await api.get('/seo/competitors');
            return res.data?.data || [];
        },
        enabled: !!activeCompanyId
    });

    const saveCompetitor = async (domain: string) => {
        if (!domain) return;
        try {
            await api.post('/seo/competitors', { domain });
            toast({ title: "Competitor Saved", description: `${domain} added to your tracked competitors.` });
            refetchCompetitors();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save competitor.", variant: "destructive" });
        }
    };

    const handleCompetitorChange = (index: number, value: string) => {
        const newCompetitors = [...competitors];
        newCompetitors[index] = value;
        setCompetitors(newCompetitors);
    };

    const addCompetitor = () => {
        if (competitors.length < 5) {
            setCompetitors([...competitors, '']);
        }
    };

    const removeCompetitor = (index: number) => {
        if (competitors.length > 1) {
            setCompetitors(competitors.filter((_, i) => i !== index));
        }
    };

    const analyze = async () => {
        const validCompetitors = competitors.filter(c => c.trim() !== '');
        if (!myDomain || validCompetitors.length === 0) {
            toast({
                title: "Missing Information",
                description: "Please enter your domain and at least one competitor.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/seo/keyword-gap', {
                my_domain: myDomain,
                competitors: validCompetitors
            });
            // Handle both wrapped and unwrapped response
            const responseData = response.data?.data || response.data || [];
            setData(responseData);
            toast({ title: "Analysis Complete", description: `Found ${responseData.length} keyword opportunities.` });
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to analyze keyword gap.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'missing': return 'bg-red-100 text-red-800 border-red-200';
            case 'weak': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'strong': return 'bg-green-100 text-green-800 border-green-200';
            case 'shared': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'untapped': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'missing': return <X className="h-3 w-3" />;
            case 'weak': return <TrendingDown className="h-3 w-3" />;
            case 'strong': return <TrendingUp className="h-3 w-3" />;
            default: return <Minus className="h-3 w-3" />;
        }
    };

    const getDifficultyColor = (difficulty: number) => {
        if (difficulty < 30) return 'text-green-600';
        if (difficulty < 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const filteredData = data.filter(item => {
        if (filterType === 'all') return true;
        return item.type === filterType;
    });

    const stats = {
        missing: data.filter(d => d.type === 'missing').length,
        weak: data.filter(d => d.type === 'weak').length,
        strong: data.filter(d => d.type === 'strong').length,
        shared: data.filter(d => d.type === 'shared').length,
        totalVolume: data.reduce((acc, d) => acc + d.volume, 0),
        avgDifficulty: data.length > 0 ? Math.round(data.reduce((acc, d) => acc + d.difficulty, 0) / data.length) : 0
    };

    return (
        <div className="space-y-6">
            {/* Input Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Keyword Gap Analysis
                    </CardTitle>
                    <CardDescription>
                        Compare your keyword rankings against competitors to discover opportunities.
                        Find keywords they rank for but you don't (Missing), keywords where they outrank you (Weak),
                        and keywords where you're winning (Strong).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={(e) => { e.preventDefault(); analyze(); }}>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Your Domain</label>
                                <Input
                                    placeholder="yourdomain.com"
                                    value={myDomain}
                                    onChange={(e) => setMyDomain(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Enter your website domain without http://</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Competitor Domains</label>
                                {competitors.map((comp, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            placeholder={`competitor${index + 1}.com`}
                                            value={comp}
                                            onChange={(e) => handleCompetitorChange(index, e.target.value)}
                                        />
                                        {competitors.length > 1 && (
                                            <Button type="button" variant="outline" size="icon" onClick={() => removeCompetitor(index)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {comp && !savedCompetitors.some((sc: any) => sc.domain === comp) && (
                                            <Button type="button" variant="ghost" size="icon" onClick={() => saveCompetitor(comp)} title="Save Competitor">
                                                <Save className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                {competitors.length < 5 && (
                                    <Button type="button" variant="ghost" size="sm" onClick={addCompetitor} className="mt-2">
                                        <Plus className="h-4 w-4 mr-1" /> Add Competitor
                                    </Button>
                                )}

                                {/* Quick Select Saved Competitors */}
                                {savedCompetitors.length > 0 && (
                                    <div className="mt-4 pt-4 border-t">
                                        <label className="text-xs text-muted-foreground block mb-2">Saved Competitors</label>
                                        <div className="flex flex-wrap gap-2">
                                            {savedCompetitors.map((comp: any) => (
                                                <Badge
                                                    key={comp.id}
                                                    variant="outline"
                                                    className="cursor-pointer hover:bg-muted"
                                                    onClick={() => {
                                                        const emptyIndex = competitors.indexOf('');
                                                        if (emptyIndex !== -1) {
                                                            handleCompetitorChange(emptyIndex, comp.domain);
                                                        } else if (competitors.length < 5) {
                                                            setCompetitors([...competitors, comp.domain]);
                                                        }
                                                    }}
                                                >
                                                    {comp.domain}
                                                    <Plus className="h-3 w-3 ml-1 text-muted-foreground" />
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <Button type="submit" disabled={loading} className="mt-6 w-full md:w-auto">
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Analyzing Keywords...
                                </>
                            ) : (
                                <>
                                    <Search className="h-4 w-4 mr-2" />
                                    Find Keyword Gaps
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Stats Section */}
            {data.length > 0 && (
                <div className="grid gap-4 md:grid-cols-6">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilterType('missing')}>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-red-600">{stats.missing}</div>
                            <div className="text-xs text-muted-foreground">Missing Keywords</div>
                            <p className="text-xs mt-1">Opportunities to target</p>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilterType('weak')}>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-orange-600">{stats.weak}</div>
                            <div className="text-xs text-muted-foreground">Weak Keywords</div>
                            <p className="text-xs mt-1">Improve your rankings</p>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilterType('strong')}>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-green-600">{stats.strong}</div>
                            <div className="text-xs text-muted-foreground">Strong Keywords</div>
                            <p className="text-xs mt-1">Protect your wins</p>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilterType('shared')}>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-blue-600">{stats.shared}</div>
                            <div className="text-xs text-muted-foreground">Shared Keywords</div>
                            <p className="text-xs mt-1">Competitive landscape</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold">{stats.totalVolume.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Total Search Volume</div>
                            <p className="text-xs mt-1">Monthly searches</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className={`text-2xl font-bold ${getDifficultyColor(stats.avgDifficulty)}`}>{stats.avgDifficulty}</div>
                            <div className="text-xs text-muted-foreground">Avg. Difficulty</div>
                            <Progress value={stats.avgDifficulty} className="h-1 mt-2" />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Results Table */}
            {data.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Keyword Gap Results ({filteredData.length})</CardTitle>
                            <div className="flex gap-2">
                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger className="w-[150px]">
                                        <Filter className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Filter" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="missing">Missing</SelectItem>
                                        <SelectItem value="weak">Weak</SelectItem>
                                        <SelectItem value="strong">Strong</SelectItem>
                                        <SelectItem value="shared">Shared</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export CSV
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-semibold">Keyword</TableHead>
                                        <TableHead className="font-semibold">Type</TableHead>
                                        <TableHead className="font-semibold text-right">Volume</TableHead>
                                        <TableHead className="font-semibold text-center">KD</TableHead>
                                        <TableHead className="font-semibold text-center">Your Rank</TableHead>
                                        {competitors.filter(c => c).map(c => (
                                            <TableHead key={c} className="font-semibold text-center">{c}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.map((row, i) => (
                                        <TableRow key={i} className="hover:bg-muted/30">
                                            <TableCell className="font-medium">{row.keyword}</TableCell>
                                            <TableCell>
                                                <Badge className={`${getTypeColor(row.type)} flex items-center gap-1 w-fit`}>
                                                    {getTypeIcon(row.type)}
                                                    {row.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{row.volume.toLocaleString()}</TableCell>
                                            <TableCell className="text-center">
                                                <span className={`font-semibold ${getDifficultyColor(row.difficulty)}`}>
                                                    {row.difficulty}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {row.my_rank ? (
                                                    <Badge variant={row.my_rank <= 10 ? 'default' : 'secondary'}>
                                                        #{row.my_rank}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            {competitors.filter(c => c).map(c => (
                                                <TableCell key={c} className="text-center">
                                                    {row.competitor_ranks[c] ? (
                                                        <Badge variant={row.competitor_ranks[c] <= 10 ? 'default' : 'outline'}>
                                                            #{row.competitor_ranks[c]}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {data.length === 0 && !loading && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Search className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Analysis Yet</h3>
                        <p className="text-muted-foreground text-center max-w-md">
                            Enter your domain and competitor domains above to discover keyword opportunities.
                            We'll show you gaps where you can improve your SEO strategy.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
