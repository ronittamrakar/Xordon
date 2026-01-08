import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from '@/lib/api';
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Lightbulb, PenTool, CheckCircle, AlertTriangle, Search, BookOpen, Target, TrendingUp, Hash, Copy, Zap, FileText, Brain, Plus } from 'lucide-react';

export function ContentOptimizer() {
    const [content, setContent] = useState('');
    const [keyword, setKeyword] = useState('');
    const [analysis, setAnalysis] = useState<any>(null);
    const [topics, setTopics] = useState<any[]>([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [researching, setResearching] = useState(false);
    const { toast } = useToast();

    // Real-time word count
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const charCount = content.length;
    const readingTime = Math.ceil(wordCount / 200); // Average 200 wpm

    const analyze = async () => {
        if (!content.trim()) {
            toast({ title: "Content Required", description: "Please enter some text to analyze.", variant: "destructive" });
            return;
        }
        setAnalyzing(true);
        try {
            const response = await api.post('/seo/content/analyze', { content, keyword });
            const result = response.data?.data || response.data || {};
            setAnalysis(result);
            toast({ title: "Analysis Complete" });
        } catch (error) {
            console.error(error);
            toast({ title: "Analysis Failed", variant: "destructive" });
        } finally {
            setAnalyzing(false);
        }
    };

    const researchTopics = async () => {
        if (!keyword.trim()) {
            toast({ title: "Keyword Required", description: "Enter a keyword for topic research.", variant: "destructive" });
            return;
        }
        setResearching(true);
        try {
            const response = await api.get(`/seo/content/topics?keyword=${encodeURIComponent(keyword)}`);
            const result = response.data?.data || response.data || [];
            setTopics(result);
            toast({ title: "Research Complete", description: `Found ${result.length} topic clusters.` });
        } catch (error) {
            console.error(error);
            toast({ title: "Research Failed", variant: "destructive" });
        } finally {
            setResearching(false);
        }
    };

    const copyTopic = (topic: string) => {
        navigator.clipboard.writeText(topic);
        toast({ title: "Copied!", description: "Topic copied to clipboard." });
    };

    const trackTopic = async (topic: string) => {
        try {
            await api.post('/seo/keywords', { keyword: topic });
            toast({ title: "Topic Tracked", description: `${topic} added to keyword tracking.` });
        } catch (error) {
            toast({ title: "Error", description: "Failed to track topic.", variant: "destructive" });
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-green-100';
        if (score >= 60) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    const getDifficultyColor = (difficulty: number) => {
        if (difficulty < 30) return 'text-green-600';
        if (difficulty < 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue="optimizer">
                <TabsList>
                    <TabsTrigger value="optimizer" className="flex items-center gap-2">
                        <PenTool className="h-4 w-4" />
                        Content Optimizer
                    </TabsTrigger>
                    <TabsTrigger value="topics" className="flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Topic Research
                    </TabsTrigger>
                </TabsList>

                {/* Content Optimizer Tab */}
                <TabsContent value="optimizer" className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Editor Panel */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Content Editor
                                </CardTitle>
                                <CardDescription>
                                    Write or paste your content to analyze SEO readiness, keyword optimization, and get improvement suggestions.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="Target Keyword (e.g., 'seo best practices')"
                                            value={keyword}
                                            onChange={(e) => setKeyword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <Textarea
                                        placeholder="Start writing your content here...

Tips for better SEO content:
• Use your target keyword naturally
• Write at least 600+ words for in-depth coverage
• Include relevant headings (H2, H3)
• Add internal and external links
• Write for humans first, search engines second"
                                        className="min-h-[450px] font-sans text-base resize-none"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                    />
                                </div>

                                {/* Real-time Stats Bar */}
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex gap-6 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Hash className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{wordCount}</span>
                                            <span className="text-muted-foreground">words</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{charCount}</span>
                                            <span className="text-muted-foreground">characters</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{readingTime}</span>
                                            <span className="text-muted-foreground">min read</span>
                                        </div>
                                    </div>
                                    <Button onClick={analyze} disabled={analyzing}>
                                        {analyzing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="mr-2 h-4 w-4" />
                                                Analyze Content
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Analysis Panel */}
                        <div className="space-y-4">
                            {analysis ? (
                                <>
                                    {/* Overall Score */}
                                    <Card className="border-l-4" style={{ borderLeftColor: analysis.score >= 80 ? '#10b981' : analysis.score >= 60 ? '#f59e0b' : '#ef4444' }}>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-lg font-semibold">SEO Score</span>
                                                <div className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
                                                    {analysis.score}
                                                </div>
                                            </div>
                                            <Progress
                                                value={analysis.score}
                                                className={`h-3 ${analysis.score >= 80 ? '[&>div]:bg-green-500' : analysis.score >= 60 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'}`}
                                            />
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {analysis.score >= 80 ? 'Excellent! Your content is well-optimized.' : analysis.score >= 60 ? 'Good, but there\'s room for improvement.' : 'Needs work. Check the suggestions below.'}
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {/* Metrics */}
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base">Content Metrics</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>Readability</span>
                                                    <span className={getScoreColor(analysis.readability)}>{analysis.readability}/100</span>
                                                </div>
                                                <Progress value={analysis.readability} className="h-2" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-muted/50 rounded-lg text-center">
                                                    <div className="text-xl font-bold">{analysis.word_count}</div>
                                                    <div className="text-xs text-muted-foreground">Words</div>
                                                </div>
                                                <div className="p-3 bg-muted/50 rounded-lg text-center">
                                                    <div className="text-xl font-bold">{analysis.keyword_density}%</div>
                                                    <div className="text-xs text-muted-foreground">Keyword Density</div>
                                                </div>
                                            </div>
                                            {analysis.sentiment && (
                                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                                    <span className="text-sm">Sentiment</span>
                                                    <Badge variant={analysis.sentiment === 'Positive' ? 'default' : analysis.sentiment === 'Negative' ? 'destructive' : 'secondary'}>
                                                        {analysis.sentiment}
                                                    </Badge>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Suggestions */}
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <Lightbulb className="h-4 w-4 text-yellow-500" />
                                                Optimization Suggestions
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ScrollArea className="h-[200px]">
                                                {analysis.suggestions && analysis.suggestions.length > 0 ? (
                                                    <ul className="space-y-3">
                                                        {analysis.suggestions.map((s: string, i: number) => (
                                                            <li key={i} className="flex gap-3 p-2 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                                                                <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                                                                <span className="text-orange-800">{s}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-green-600 p-3 bg-green-50 rounded-lg">
                                                        <CheckCircle className="h-5 w-5" />
                                                        <span>Great job! No major issues found.</span>
                                                    </div>
                                                )}
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                </>
                            ) : (
                                <Card className="h-full flex flex-col items-center justify-center p-8 text-center border-dashed">
                                    <PenTool className="h-16 w-16 text-muted-foreground/30 mb-4" />
                                    <h3 className="font-semibold mb-2">Ready to Analyze</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs">
                                        Enter your content and target keyword, then click "Analyze Content" to get SEO recommendations.
                                    </p>
                                </Card>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* Topic Research Tab */}
                <TabsContent value="topics" className="space-y-6 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Brain className="h-5 w-5" />
                                Topic Research & Content Ideas
                            </CardTitle>
                            <CardDescription>
                                Discover related topics, subtopics, and content ideas based on your target keyword.
                                Use these to plan your content strategy and cover comprehensive topic clusters.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Enter a topic or keyword (e.g., 'content marketing')"
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && researchTopics()}
                                    />
                                </div>
                                <Button onClick={researchTopics} disabled={researching}>
                                    {researching ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Researching...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="mr-2 h-4 w-4" />
                                            Find Topics
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Topic Results */}
                            {topics.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {topics.map((topic, i) => (
                                        <Card key={i} className="hover:shadow-lg transition-all hover:border-primary/50 group">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <CardTitle className="text-base leading-tight">{topic.topic}</CardTitle>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-2"
                                                        onClick={() => copyTopic(topic.topic)}
                                                        title="Copy Topic"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-2"
                                                        onClick={() => trackTopic(topic.topic)}
                                                        title="Track Topic"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="flex gap-3 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <TrendingUp className="h-3 w-3 text-blue-500" />
                                                        <span className="font-medium">{topic.volume?.toLocaleString()}</span>
                                                        <span className="text-muted-foreground">vol</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Target className="h-3 w-3 text-orange-500" />
                                                        <span className={`font-medium ${getDifficultyColor(topic.difficulty)}`}>{topic.difficulty}</span>
                                                        <span className="text-muted-foreground">diff</span>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <h4 className="text-xs font-medium text-muted-foreground mb-2">Related Subtopics:</h4>
                                                <ul className="space-y-1.5">
                                                    {topic.subtopics?.map((sub: string, j: number) => (
                                                        <li
                                                            key={j}
                                                            className="text-sm p-2 bg-muted/30 rounded hover:bg-muted/50 cursor-pointer flex items-center gap-2 truncate"
                                                            onClick={() => copyTopic(sub)}
                                                        >
                                                            <span className="text-primary">•</span>
                                                            {sub}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : !researching ? (
                                <div className="text-center py-16">
                                    <Brain className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Discover Content Ideas</h3>
                                    <p className="text-muted-foreground max-w-md mx-auto">
                                        Enter a keyword above to find related topics, questions, and content ideas
                                        that your audience is searching for.
                                    </p>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
