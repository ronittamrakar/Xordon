import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { api } from '@/lib/api';
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Layers, Copy, Download, TrendingUp, Target } from 'lucide-react';

interface Cluster {
    name: string;
    keywords: string[];
    totalVolume?: number;
    avgDifficulty?: number;
    intent?: string;
}

export function KeywordClusterTool() {
    const [inputKeywords, setInputKeywords] = useState('');
    const [clusters, setClusters] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(false);
    const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
    const { toast } = useToast();

    const handleCluster = async () => {
        const keywords = inputKeywords.split('\n').map(k => k.trim()).filter(k => k);
        if (keywords.length === 0) {
            toast({
                title: "No Keywords",
                description: "Please enter some keywords to cluster (one per line).",
                variant: "destructive",
            });
            return;
        }

        if (keywords.length < 3) {
            toast({
                title: "Need More Keywords",
                description: "Please enter at least 3 keywords for meaningful clustering.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/seo/keywords/cluster', { keywords });
            // Handle both wrapped and unwrapped response
            const responseData = response.data?.data || response.data || {};
            setClusters(responseData);
            toast({ title: "Clustering Complete", description: `Created ${Object.keys(responseData).length} clusters.` });
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to cluster keywords.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const copyCluster = (clusterName: string) => {
        const keywords = clusters[clusterName];
        navigator.clipboard.writeText(keywords.join('\n'));
        toast({ title: "Copied!", description: `${keywords.length} keywords copied to clipboard.` });
    };

    const copyAll = () => {
        const allKeywords = Object.values(clusters).flat().join('\n');
        navigator.clipboard.writeText(allKeywords);
        toast({ title: "Copied All!", description: "All keywords copied to clipboard." });
    };

    const exportCSV = () => {
        let csv = "Cluster,Keyword\n";
        Object.entries(clusters).forEach(([name, keywords]) => {
            keywords.forEach(kw => {
                csv += `"${name}","${kw}"\n`;
            });
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'keyword-clusters.csv';
        a.click();
        toast({ title: "Exported!", description: "CSV file downloaded." });
    };

    const getIntentColor = (intent: string) => {
        switch (intent.toLowerCase()) {
            case 'commercial intent': return 'bg-green-100 text-green-800';
            case 'informational': return 'bg-blue-100 text-blue-800';
            case 'local seo': return 'bg-purple-100 text-purple-800';
            case 'transactional': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const totalKeywords = Object.values(clusters).flat().length;
    const clusterCount = Object.keys(clusters).length;

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            {clusterCount > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <Layers className="h-5 w-5 text-primary" />
                                <div>
                                    <div className="text-2xl font-bold">{clusterCount}</div>
                                    <div className="text-xs text-muted-foreground">Clusters Created</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-primary" />
                                <div>
                                    <div className="text-2xl font-bold">{totalKeywords}</div>
                                    <div className="text-xs text-muted-foreground">Total Keywords</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                <div>
                                    <div className="text-2xl font-bold">{Math.round(totalKeywords / clusterCount)}</div>
                                    <div className="text-xs text-muted-foreground">Avg Keywords/Cluster</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 flex gap-2">
                            <Button variant="outline" size="sm" onClick={copyAll}>
                                <Copy className="h-4 w-4 mr-1" /> Copy All
                            </Button>
                            <Button variant="outline" size="sm" onClick={exportCSV}>
                                <Download className="h-4 w-4 mr-1" /> Export
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Panel */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Layers className="h-5 w-5" />
                            Keyword Input
                        </CardTitle>
                        <CardDescription>
                            Enter keywords (one per line) to group them by search intent and topic.
                            This helps you create focused content clusters for better SEO.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder={`Example keywords:\nseo services\nbuy seo tools\nhow to improve rankings\nlocal seo agency\nwhat is backlink building\nseo pricing\n...`}
                            rows={12}
                            value={inputKeywords}
                            onChange={(e) => setInputKeywords(e.target.value)}
                            className="font-mono text-sm"
                        />
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                                {inputKeywords.split('\n').filter(k => k.trim()).length} keywords entered
                            </span>
                            <Button onClick={handleCluster} disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Clustering...
                                    </>
                                ) : (
                                    <>
                                        <Layers className="h-4 w-4 mr-2" />
                                        Cluster Keywords
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Results Panel */}
                <Card>
                    <CardHeader>
                        <CardTitle>Keyword Clusters</CardTitle>
                        <CardDescription>
                            Keywords are grouped by semantic relevance and search intent.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[450px] w-full pr-4">
                            {Object.keys(clusters).length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <Layers className="h-16 w-16 text-muted-foreground/30 mb-4" />
                                    <h3 className="font-semibold text-lg mb-2">No Clusters Yet</h3>
                                    <p className="text-muted-foreground text-sm max-w-xs">
                                        Enter your keywords in the input area and click "Cluster Keywords" to group them by intent.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {Object.entries(clusters).map(([group, keywords]) => (
                                        <div
                                            key={group}
                                            className={`p-4 rounded-lg border transition-all ${selectedCluster === group ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                                            onClick={() => setSelectedCluster(selectedCluster === group ? null : group)}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-lg">{group}</h3>
                                                    <Badge className={getIntentColor(group)}>{keywords.length}</Badge>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => { e.stopPropagation(); copyCluster(group); }}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {keywords.map((k, i) => (
                                                    <Badge
                                                        key={i}
                                                        variant="outline"
                                                        className="text-sm py-1.5 px-3 bg-background hover:bg-muted cursor-pointer"
                                                    >
                                                        {k}
                                                    </Badge>
                                                ))}
                                            </div>
                                            {selectedCluster === group && (
                                                <div className="mt-4 pt-4 border-t">
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-muted-foreground">Keywords: </span>
                                                            <span className="font-medium">{keywords.length}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Intent: </span>
                                                            <span className="font-medium">{group}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        💡 Tip: Create a dedicated landing page or content piece targeting this cluster for better rankings.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
