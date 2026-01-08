import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from '@/lib/api';
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ExternalLink, Link2, X, Plus, Download, Filter, Shield, Users, TrendingUp, Target, Star } from 'lucide-react';

interface BacklinkGap {
    domain: string;
    da: number;
    traffic: number;
    matches: string[];
}

export function BacklinkGapAnalyzer() {
    const [myDomain, setMyDomain] = useState('');
    const [competitors, setCompetitors] = useState<string[]>(['', '']);
    const [data, setData] = useState<BacklinkGap[]>([]);
    const [loading, setLoading] = useState(false);
    const [sortBy, setSortBy] = useState<string>('da');
    const [filterDA, setFilterDA] = useState<string>('all');
    const { toast } = useToast();

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
        if (validCompetitors.length === 0) {
            toast({
                title: "Missing Information",
                description: "Please enter at least one competitor domain.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/seo/backlinks/gap', {
                my_domain: myDomain,
                competitors: validCompetitors
            });
            // Handle both wrapped and unwrapped responses
            const responseData = response.data?.data || response.data || [];
            setData(responseData);
            toast({ title: "Analysis Complete", description: `Found ${responseData.length} backlink opportunities.` });
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to analyze backlink gap.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const getDAColor = (da: number) => {
        if (da >= 70) return 'bg-green-100 text-green-800 border-green-200';
        if (da >= 50) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (da >= 30) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getPriorityLevel = (da: number, matchCount: number) => {
        const score = (da * 0.6) + (matchCount * 20);
        if (score > 60) return { label: 'High', color: 'text-green-600' };
        if (score > 40) return { label: 'Medium', color: 'text-yellow-600' };
        return { label: 'Low', color: 'text-gray-600' };
    };

    // Apply filters and sorting
    let filteredData = [...data];

    if (filterDA !== 'all') {
        const minDA = parseInt(filterDA);
        filteredData = filteredData.filter(d => d.da >= minDA);
    }

    filteredData.sort((a, b) => {
        switch (sortBy) {
            case 'da': return b.da - a.da;
            case 'traffic': return b.traffic - a.traffic;
            case 'matches': return b.matches.length - a.matches.length;
            default: return 0;
        }
    });

    const stats = {
        total: data.length,
        highDA: data.filter(d => d.da >= 50).length,
        totalTraffic: data.reduce((acc, d) => acc + d.traffic, 0),
        avgDA: data.length > 0 ? Math.round(data.reduce((acc, d) => acc + d.da, 0) / data.length) : 0
    };

    const exportCSV = () => {
        let csv = "Domain,DA,Traffic,Competitors Linked\n";
        data.forEach(row => {
            csv += `"${row.domain}",${row.da},${row.traffic},"${row.matches.join(', ')}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'backlink-opportunities.csv';
        a.click();
        toast({ title: "Exported!", description: "CSV file downloaded." });
    };

    return (
        <div className="space-y-6">
            {/* Input Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5" />
                        Backlink Gap Analysis
                    </CardTitle>
                    <CardDescription>
                        Find domains that link to your competitors but don't link to you.
                        These are high-quality backlink opportunities you should pursue.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Your Domain (Optional)</label>
                            <Input
                                placeholder="yourdomain.com"
                                value={myDomain}
                                onChange={(e) => setMyDomain(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">We'll exclude domains already linking to you</p>
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
                                        <Button variant="outline" size="icon" onClick={() => removeCompetitor(index)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            {competitors.length < 5 && (
                                <Button variant="ghost" size="sm" onClick={addCompetitor} className="mt-2">
                                    <Plus className="h-4 w-4 mr-1" /> Add Competitor
                                </Button>
                            )}
                        </div>
                    </div>
                    <Button onClick={analyze} disabled={loading} className="mt-6 w-full md:w-auto">
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Finding Opportunities...
                            </>
                        ) : (
                            <>
                                <Target className="h-4 w-4 mr-2" />
                                Find Link Opportunities
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Stats Cards */}
            {data.length > 0 && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Link2 className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{stats.total}</div>
                                    <div className="text-xs text-muted-foreground">Opportunities Found</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Shield className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{stats.highDA}</div>
                                    <div className="text-xs text-muted-foreground">High DA (50+)</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Users className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{stats.totalTraffic.toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">Total Traffic</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{stats.avgDA}</div>
                                    <div className="text-xs text-muted-foreground">Avg. Domain Authority</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Results Table */}
            {data.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <CardTitle>Backlink Opportunities ({filteredData.length})</CardTitle>
                            <div className="flex gap-2 flex-wrap">
                                <Select value={filterDA} onValueChange={setFilterDA}>
                                    <SelectTrigger className="w-[140px]">
                                        <Filter className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Filter DA" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All DA</SelectItem>
                                        <SelectItem value="30">DA 30+</SelectItem>
                                        <SelectItem value="50">DA 50+</SelectItem>
                                        <SelectItem value="70">DA 70+</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="da">Highest DA</SelectItem>
                                        <SelectItem value="traffic">Most Traffic</SelectItem>
                                        <SelectItem value="matches">Most Matches</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" size="sm" onClick={exportCSV}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-semibold">Referring Domain</TableHead>
                                        <TableHead className="font-semibold text-center">DA</TableHead>
                                        <TableHead className="font-semibold text-right">Est. Traffic</TableHead>
                                        <TableHead className="font-semibold">Links To</TableHead>
                                        <TableHead className="font-semibold text-center">Priority</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.map((row, i) => {
                                        const priority = getPriorityLevel(row.da, row.matches.length);
                                        return (
                                            <TableRow key={i} className="hover:bg-muted/30">
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                                            {row.domain.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-medium">{row.domain}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={getDAColor(row.da)}>{row.da}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono">{row.traffic.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {row.matches.map((m, idx) => (
                                                            <Badge key={idx} variant="outline" className="text-xs">
                                                                {m}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Star className={`h-4 w-4 ${priority.color}`} />
                                                        <span className={`text-sm font-medium ${priority.color}`}>{priority.label}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <a href={`https://${row.domain}`} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                            💡 <strong>Tip:</strong> Focus on high-priority domains first. Reach out with personalized outreach emails or create content worth linking to.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {data.length === 0 && !loading && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Link2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Find Link Building Opportunities</h3>
                        <p className="text-muted-foreground text-center max-w-md">
                            Enter competitor domains to discover websites that link to them but not to you.
                            These are perfect targets for your link building outreach.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
