import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from '@/lib/api';
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Search, ExternalLink, Globe, BarChart2, TrendingUp, Users, Link2, Shield, HelpCircle, Copy, ChevronDown, ChevronUp, Plus } from 'lucide-react';

interface SerpResult {
    position: number;
    title: string;
    url: string;
    domain_authority: number;
    referring_domains: number;
    traffic: number;
}

export function SerpAnalyzer() {
    const [keyword, setKeyword] = useState('');
    const [results, setResults] = useState<SerpResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<string[]>([]);
    const [expandedResult, setExpandedResult] = useState<number | null>(null);
    const { toast } = useToast();

    const analyze = async (targetKeyword: string = keyword) => {
        if (!targetKeyword.trim()) {
            toast({ title: "Enter a keyword", description: "Please enter a keyword to analyze.", variant: "destructive" });
            return;
        }
        setLoading(true);
        setResults([]);
        setQuestions([]);
        try {
            const [serpRes, questionsRes] = await Promise.all([
                api.get(`/seo/serp?keyword=${encodeURIComponent(targetKeyword)}`),
                api.get(`/seo/questions?keyword=${encodeURIComponent(targetKeyword)}`)
            ]);
            // Handle both wrapped and unwrapped response
            const serpData = serpRes.data?.data || serpRes.data || [];
            const questionsData = questionsRes.data?.data || questionsRes.data || [];
            setResults(serpData);
            setQuestions(questionsData);
            toast({ title: "Analysis Complete", description: `Found ${serpData.length} SERP results.` });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to analyze SERP.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const trackKeyword = async () => {
        if (!keyword) return;
        try {
            await api.post('/seo/keywords', { keyword });
            toast({ title: "Keyword Tracked", description: `${keyword} added to rank tracker.` });
        } catch (error) {
            toast({ title: "Error", description: "Failed to track keyword.", variant: "destructive" });
        }
    };

    const getDifficultyLevel = (avgDA: number) => {
        if (avgDA < 30) return { label: 'Easy', color: 'text-green-600', bg: 'bg-green-100' };
        if (avgDA < 50) return { label: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
        if (avgDA < 70) return { label: 'Hard', color: 'text-orange-600', bg: 'bg-orange-100' };
        return { label: 'Very Hard', color: 'text-red-600', bg: 'bg-red-100' };
    };

    const copyQuestion = (q: string) => {
        navigator.clipboard.writeText(q);
        toast({ title: "Copied!", description: "Question copied to clipboard." });
    };

    const avgDA = results.length > 0 ? Math.round(results.reduce((a, b) => a + b.domain_authority, 0) / results.length) : 0;
    const avgReferringDomains = results.length > 0 ? Math.round(results.reduce((a, b) => a + b.referring_domains, 0) / results.length) : 0;
    const totalTraffic = results.reduce((a, b) => a + (b.traffic || 0), 0);
    const difficulty = getDifficultyLevel(avgDA);

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        SERP Analysis
                    </CardTitle>
                    <CardDescription>
                        Analyze search engine results for any keyword. See who's ranking, their domain authority,
                        backlink profile, and estimate your chances of ranking.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Enter a keyword (e.g., 'best seo tools')"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && analyze()}
                                className="text-base"
                            />
                        </div>
                        <Button onClick={analyze} disabled={loading} size="lg">
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Search className="h-4 w-4 mr-2" />
                                    Analyze SERP
                                </>
                            )}
                        </Button>
                        <Button variant="outline" onClick={trackKeyword} disabled={!keyword || loading} title="Add to Rank Tracker">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results Section */}
            {results.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* SERP Results */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Top 10 Results for "{keyword}"</h2>
                            <Badge variant="outline" className={`${difficulty.bg} ${difficulty.color}`}>
                                {difficulty.label} to Rank
                            </Badge>
                        </div>

                        {results.map((res) => (
                            <Card
                                key={res.position}
                                className={`hover:shadow-md transition-all cursor-pointer ${expandedResult === res.position ? 'ring-2 ring-primary' : ''}`}
                                onClick={() => setExpandedResult(expandedResult === res.position ? null : res.position)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold rounded-lg text-lg">
                                            {res.position}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-lg text-blue-600 hover:underline truncate">
                                                <a href={res.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                    {res.title}
                                                </a>
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-green-700 mb-3 truncate">
                                                <Globe className="h-3 w-3 flex-shrink-0" />
                                                <span className="truncate">{res.url}</span>
                                                <a href={res.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                    <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                                </a>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm">
                                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
                                                    <Shield className="h-4 w-4 text-blue-500" />
                                                    <span className="font-semibold">{res.domain_authority}</span>
                                                    <span className="text-muted-foreground">DA</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
                                                    <Link2 className="h-4 w-4 text-purple-500" />
                                                    <span className="font-semibold">{res.referring_domains.toLocaleString()}</span>
                                                    <span className="text-muted-foreground">Backlinks</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
                                                    <Users className="h-4 w-4 text-green-500" />
                                                    <span className="font-semibold">{res.traffic?.toLocaleString()}</span>
                                                    <span className="text-muted-foreground">Traffic</span>
                                                </div>
                                            </div>

                                            {expandedResult === res.position && (
                                                <div className="mt-4 pt-4 border-t space-y-3">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <h4 className="text-sm font-medium mb-2">Domain Metrics</h4>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-muted-foreground">Domain Authority</span>
                                                                    <span className="font-medium">{res.domain_authority}/100</span>
                                                                </div>
                                                                <Progress value={res.domain_authority} className="h-2" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-medium mb-2">Link Profile</h4>
                                                            <div className="text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">Referring Domains</span>
                                                                    <span className="font-medium">{res.referring_domains.toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        💡 To outrank this result, you'll need a DA of at least {res.domain_authority} and approximately {res.referring_domains} quality backlinks.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0 self-center">
                                            {expandedResult === res.position ? (
                                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* SERP Overview */}
                        <Card className="border-l-4 border-l-primary">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <BarChart2 className="h-5 w-5" />
                                    SERP Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm text-muted-foreground">Ranking Difficulty</span>
                                        <span className={`text-2xl font-bold ${difficulty.color}`}>{avgDA}</span>
                                    </div>
                                    <Progress value={avgDA} className="h-3" />
                                    <p className="text-xs text-muted-foreground mt-1">Based on average Domain Authority</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                                        <div className="text-xl font-bold">{avgReferringDomains.toLocaleString()}</div>
                                        <div className="text-xs text-muted-foreground">Avg. Backlinks</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                                        <div className="text-xl font-bold">{totalTraffic.toLocaleString()}</div>
                                        <div className="text-xs text-muted-foreground">Total Traffic</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Ranking Requirements */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    To Rank Top 10
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">✓</span>
                                        <span>Domain Authority of at least <strong>{Math.max(20, avgDA - 10)}</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">✓</span>
                                        <span>Approximately <strong>{Math.round(avgReferringDomains * 0.7).toLocaleString()}</strong>+ backlinks</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">✓</span>
                                        <span>Comprehensive content (2000+ words)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">✓</span>
                                        <span>Optimized meta tags and headers</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* People Also Ask */}
                        {questions.length > 0 && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <HelpCircle className="h-5 w-5" />
                                        People Also Ask
                                    </CardTitle>
                                    <CardDescription>Related questions to target</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {questions.map((q, i) => (
                                            <li
                                                key={i}
                                                className="group text-sm p-3 bg-muted/30 hover:bg-muted/50 rounded-lg border flex justify-between items-start cursor-pointer transition-colors"
                                                onClick={() => copyQuestion(q)}
                                            >
                                                <div className="flex gap-2">
                                                    <span className="text-primary font-medium">?</span>
                                                    <span>{q}</span>
                                                </div>
                                                <Copy className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-xs text-muted-foreground mt-3">
                                        💡 Answer these questions in your content to win Featured Snippets
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {results.length === 0 && !loading && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Search className="h-16 w-16 text-muted-foreground/30 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Analyze Any Keyword</h3>
                        <p className="text-muted-foreground text-center max-w-md mb-6">
                            Enter a keyword above to see who's currently ranking, their domain metrics,
                            and what it takes to compete in the top 10.
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {['seo tools', 'digital marketing', 'content writing', 'email marketing'].map(kw => (
                                <Button
                                    key={kw}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setKeyword(kw);
                                        analyze(kw);
                                    }}
                                >
                                    {kw}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
