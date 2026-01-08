import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from '@/lib/api';
import { useToast } from "@/components/ui/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { AlertTriangle, ShieldCheck, ShieldAlert, TrendingUp, TrendingDown, Link2, RefreshCw, Loader2, Download, ExternalLink, FileWarning, CheckCircle } from 'lucide-react';

export function BacklinkAnalytics() {
    const [anchors, setAnchors] = useState<any[]>([]);
    const [velocity, setVelocity] = useState<any[]>([]);
    const [toxic, setToxic] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [anchorsRes, velocityRes, toxicRes] = await Promise.all([
                api.get('/seo/backlinks/anchors'),
                api.get('/seo/backlinks/velocity'),
                api.get('/seo/backlinks/toxic')
            ]);
            // Handle both wrapped and unwrapped responses
            setAnchors(anchorsRes.data?.data || anchorsRes.data || []);
            setVelocity(velocityRes.data?.data || velocityRes.data || []);
            setToxic(toxicRes.data?.data || toxicRes.data || []);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to load backlink analytics.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const handleDisavow = (domain: string) => {
        toast({ title: "Added to Disavow List", description: `${domain} will be included in your disavow file.` });
    };

    const exportDisavowFile = () => {
        const content = toxic.map(t => `domain:${t.domain}`).join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'disavow.txt';
        a.click();
        toast({ title: "Exported!", description: "Disavow file downloaded. Upload to Google Search Console." });
    };

    // Calculate stats
    const totalNewLinks = velocity.reduce((acc, v) => acc + (v.new_links || 0), 0);
    const totalLostLinks = velocity.reduce((acc, v) => acc + (v.lost_links || 0), 0);
    const netGrowth = totalNewLinks - totalLostLinks;
    const toxicCount = toxic.length;
    const avgToxicity = toxic.length > 0 ? Math.round(toxic.reduce((acc, t) => acc + t.toxicity_score, 0) / toxic.length) : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading Analytics...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-green-600">+{totalNewLinks}</div>
                                <div className="text-xs text-muted-foreground">New Links (12mo)</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <TrendingDown className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-red-600">-{totalLostLinks}</div>
                                <div className="text-xs text-muted-foreground">Lost Links (12mo)</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Link2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <div className={`text-2xl font-bold ${netGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {netGrowth >= 0 ? '+' : ''}{netGrowth}
                                </div>
                                <div className="text-xs text-muted-foreground">Net Growth</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <FileWarning className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-orange-600">{toxicCount}</div>
                                <div className="text-xs text-muted-foreground">Toxic Links</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{anchors.length}</div>
                                <div className="text-xs text-muted-foreground">Anchor Types</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">Link Velocity</TabsTrigger>
                    <TabsTrigger value="anchors">Anchor Analysis</TabsTrigger>
                    <TabsTrigger value="toxic">Toxic Links ({toxicCount})</TabsTrigger>
                </TabsList>

                {/* Link Velocity Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Link Velocity Trend</CardTitle>
                                    <CardDescription>Track new and lost backlinks over the last 12 months</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={fetchData}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={velocity}>
                                        <defs>
                                            <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="month" fontSize={12} tickMargin={10} />
                                        <YAxis fontSize={12} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                        />
                                        <Legend />
                                        <Area type="monotone" dataKey="new_links" name="New Links" stroke="#10b981" fillOpacity={1} fill="url(#colorNew)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="lost_links" name="Lost Links" stroke="#ef4444" fillOpacity={1} fill="url(#colorLost)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                                <div className="text-center">
                                    <div className="text-sm text-muted-foreground">Best Month</div>
                                    <div className="font-semibold">{velocity.reduce((max, v) => v.new_links > max.new_links ? v : max, velocity[0])?.month || 'N/A'}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-sm text-muted-foreground">Avg. New/Month</div>
                                    <div className="font-semibold text-green-600">+{Math.round(totalNewLinks / velocity.length)}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-sm text-muted-foreground">Avg. Lost/Month</div>
                                    <div className="font-semibold text-red-600">-{Math.round(totalLostLinks / velocity.length)}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Anchor Text Tab */}
                <TabsContent value="anchors" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Anchor Text Distribution</CardTitle>
                                <CardDescription>Breakdown of anchor texts used to link to your site</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={anchors}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="count"
                                                nameKey="text"
                                                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                                labelLine={false}
                                            >
                                                {anchors.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Anchor Text Breakdown</CardTitle>
                                <CardDescription>Detailed view of your anchor text profile</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {anchors.map((anchor, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                    <span className="font-medium">{anchor.text}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground">{anchor.count} links</span>
                                                    <Badge variant="outline">{anchor.percent}%</Badge>
                                                </div>
                                            </div>
                                            <Progress value={anchor.percent} className="h-2" />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                                    <h4 className="font-medium mb-2">💡 Anchor Text Health</h4>
                                    <p className="text-sm text-muted-foreground">
                                        A healthy anchor text profile should have: ~40-50% branded, ~20-30% naked URLs,
                                        ~10-20% generic (click here), and ~10-15% exact match keywords.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Toxic Links Tab */}
                <TabsContent value="toxic" className="mt-6">
                    <Card className="border-l-4 border-l-red-500">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert className="h-5 w-5 text-red-500" />
                                    <div>
                                        <CardTitle>Toxic Backlink Detection</CardTitle>
                                        <CardDescription>Potentially harmful links that may impact your SEO</CardDescription>
                                    </div>
                                </div>
                                {toxic.length > 0 && (
                                    <Button variant="destructive" size="sm" onClick={exportDisavowFile}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Export Disavow File
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {toxic.length > 0 ? (
                                <>
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="h-5 w-5 text-red-500" />
                                            <span className="font-medium text-red-800">
                                                {toxic.length} toxic links detected with average toxicity of {avgToxicity}%
                                            </span>
                                        </div>
                                        <p className="text-sm text-red-700">
                                            These links may be harming your search rankings. Consider adding them to your Google disavow file.
                                        </p>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Domain</TableHead>
                                                <TableHead>Toxicity Score</TableHead>
                                                <TableHead>Reason</TableHead>
                                                <TableHead>Risk Level</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {toxic.map((link, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                                            <span className="font-medium">{link.domain}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Progress value={link.toxicity_score} className="w-20 h-2" />
                                                            <span className="font-mono text-sm">{link.toxicity_score}%</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">{link.reason}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={link.toxicity_score > 80 ? 'destructive' : link.toxicity_score > 60 ? 'secondary' : 'outline'}>
                                                            {link.toxicity_score > 80 ? 'Critical' : link.toxicity_score > 60 ? 'High' : 'Medium'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                                onClick={() => handleDisavow(link.domain)}
                                                            >
                                                                Disavow
                                                            </Button>
                                                            <Button variant="ghost" size="sm" asChild>
                                                                <a href={`https://${link.domain}`} target="_blank" rel="noopener noreferrer">
                                                                    <ExternalLink className="h-4 w-4" />
                                                                </a>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <ShieldCheck className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">No Toxic Links Detected</h3>
                                    <p className="text-muted-foreground max-w-md mx-auto">
                                        Your backlink profile looks healthy! We didn't find any potentially harmful links.
                                        Keep monitoring regularly to maintain a clean profile.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
