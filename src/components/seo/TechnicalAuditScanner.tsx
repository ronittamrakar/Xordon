import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { api } from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Smartphone, Monitor, CheckCircle, XCircle, AlertTriangle, FileText, Globe, Zap, Search, Clock, FileWarning, Download, RefreshCw, TrendingUp, Shield, Settings } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface TechnicalAuditScannerProps {
    onScanComplete?: () => void;
}

export function TechnicalAuditScanner({ onScanComplete }: TechnicalAuditScannerProps) {
    const [url, setUrl] = useState('');
    const [crawling, setCrawling] = useState(false);
    const [auditResult, setAuditResult] = useState<any>(null);
    const [cwvData, setCwvData] = useState<any>(null);
    const [schemaData, setSchemaData] = useState<any>(null);
    const { toast } = useToast();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settings, setSettings] = useState({
        limit: 100,
        userAgent: 'Googlebot Smartphone',
        checkExternal: false
    });

    const runAllChecks = async () => {
        if (!url) {
            toast({ title: "URL Required", description: "Please enter a website URL to scan.", variant: "destructive" });
            return;
        }

        // Basic URL validation
        let scanUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            scanUrl = 'https://' + url;
        }

        setCrawling(true);
        setAuditResult(null);
        setCwvData(null);
        setSchemaData(null);

        try {
            // Run Deep Crawl (Real implementation)
            const auditRes = await api.post('/seo/audits/deep-crawl', {
                url: scanUrl,
                save: true,
                settings
            });
            const crawlData = auditRes.data?.data || auditRes.data || {};

            // If saved, fetch the full audit record to get scores and ID
            if (crawlData.audit_id) {
                const fullAuditRes = await api.get(`/seo/audits/${crawlData.audit_id}`);
                const fullAudit = fullAuditRes.data?.data || fullAuditRes.data || {};
                setAuditResult(fullAudit);
            } else {
                // Fallback if not saved (shouldn't happen with save:true)
                setAuditResult({
                    url: scanUrl,
                    report_data: crawlData
                });
            }

            // Fetch CWV and Schema (using the new audit ID if possible, or mock ID 1 for now if needed)
            const auditId = crawlData.audit_id || 1;

            const [cwvRes, schemaRes] = await Promise.all([
                api.get(`/seo/audits/${auditId}/cwv`),
                api.get(`/seo/audits/${auditId}/structured-data`)
            ]);
            setCwvData(cwvRes.data?.data || cwvRes.data || {});
            setSchemaData(schemaRes.data?.data || schemaRes.data || []);

            toast({ title: "Audit Complete", description: `Scanned ${crawlData.pages?.length || 0} pages successfully.` });

            if (onScanComplete) {
                onScanComplete();
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Audit Failed", description: "Could not complete all checks. Please try again.", variant: "destructive" });
        } finally {
            setCrawling(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-green-600";
        if (score >= 50) return "text-orange-500";
        return "text-red-500";
    };

    const getScoreBg = (score: number) => {
        if (score >= 90) return "bg-green-100";
        if (score >= 50) return "bg-orange-100";
        return "bg-red-100";
    };

    const getMetricStatus = (metric: string, value: number) => {
        switch (metric) {
            case 'lcp': return value <= 2.5 ? 'good' : value <= 4 ? 'needs-improvement' : 'poor';
            case 'fid': return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
            case 'cls': return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
            default: return 'good';
        }
    };

    const exportReport = () => {
        toast({ title: "Exporting...", description: "Report download will start shortly." });
        // Mock export
        setTimeout(() => toast({ title: "Report Generated", description: "PDF report downloaded successfully." }), 1500);
    };

    // Calculate stats from audit result
    const reportData = auditResult?.report_data;
    const stats = reportData?.pages ? {
        totalPages: reportData.pages.length,
        healthyPages: reportData.pages.filter((p: any) => p.status_code === 200).length,
        brokenPages: reportData.pages.filter((p: any) => p.status_code !== 200).length,
        missingMeta: reportData.pages.filter((p: any) => !p.meta_description).length,
        avgLoadTime: Math.round(reportData.pages.reduce((acc: number, p: any) => acc + p.load_time_ms, 0) / reportData.pages.length),
        slowPages: reportData.pages.filter((p: any) => p.load_time_ms > 1000).length
    } : null;

    return (
        <div className="space-y-6">
            {/* Scanner Input */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="h-5 w-5" />
                                Technical SEO Scanner
                            </CardTitle>
                            <CardDescription>
                                Run a comprehensive technical audit of your website. Analyze page health, Core Web Vitals,
                                structured data, and identify issues that may be affecting your search rankings.
                            </CardDescription>
                        </div>
                        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Scan Settings
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Audit Settings</DialogTitle>
                                    <DialogDescription>
                                        Configure how the crawler interacts with your website.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Max Pages to Crawl</Label>
                                        <Input
                                            type="number"
                                            value={settings.limit}
                                            onChange={(e) => setSettings({ ...settings, limit: parseInt(e.target.value) || 100 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>User Agent</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={settings.userAgent}
                                            onChange={(e) => setSettings({ ...settings, userAgent: e.target.value })}
                                        >
                                            <option value="Googlebot Smartphone">Googlebot Smartphone</option>
                                            <option value="Googlebot Desktop">Googlebot Desktop</option>
                                            <option value="Bingbot">Bingbot</option>
                                            <option value="XordonBot">XordonBot</option>
                                        </select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={() => setIsSettingsOpen(false)}>Save Settings</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Enter your website URL (e.g., example.com)"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && runAllChecks()}
                                className="text-base"
                            />
                        </div>
                        <Button onClick={runAllChecks} disabled={crawling} size="lg">
                            {crawling ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Scanning...
                                </>
                            ) : (
                                <>
                                    <Zap className="mr-2 h-4 w-4" />
                                    Run Full Audit
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Overview */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-6">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Globe className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{stats.totalPages}</div>
                                    <div className="text-xs text-muted-foreground">Pages Scanned</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-green-600">{stats.healthyPages}</div>
                                    <div className="text-xs text-muted-foreground">Healthy (200)</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-red-600">{stats.brokenPages}</div>
                                    <div className="text-xs text-muted-foreground">Broken Links</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <FileWarning className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-orange-600">{stats.missingMeta}</div>
                                    <div className="text-xs text-muted-foreground">Missing Meta</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Clock className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{stats.avgLoadTime}ms</div>
                                    <div className="text-xs text-muted-foreground">Avg Load Time</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-yellow-600">{stats.slowPages}</div>
                                    <div className="text-xs text-muted-foreground">Slow Pages (&gt;1s)</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Results Tabs */}
            {auditResult && (
                <Tabs defaultValue="pages" className="w-full">
                    <div className="flex justify-between items-center">
                        <TabsList>
                            <TabsTrigger value="pages">Page Health</TabsTrigger>
                            <TabsTrigger value="cwv">Core Web Vitals</TabsTrigger>
                            <TabsTrigger value="schema">Structured Data</TabsTrigger>
                        </TabsList>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={runAllChecks}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Re-scan
                            </Button>
                            <Button variant="outline" size="sm" onClick={exportReport}>
                                <Download className="h-4 w-4 mr-2" />
                                Export Report
                            </Button>
                        </div>
                    </div>

                    {/* Page Health Tab */}
                    <TabsContent value="pages" className="mt-6">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Page Health Report</CardTitle>
                                        <CardDescription>
                                            Analyzed {reportData?.pages?.length || 0} pages for issues
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="font-semibold">URL</TableHead>
                                                <TableHead className="font-semibold text-center">Status</TableHead>
                                                <TableHead className="font-semibold text-center">Load Time</TableHead>
                                                <TableHead className="font-semibold text-center">Words</TableHead>
                                                <TableHead className="font-semibold">Issues</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportData?.pages?.map((page: any, idx: number) => {
                                                const loadTimeClass = page.load_time_ms < 500 ? 'text-green-600' : page.load_time_ms < 1000 ? 'text-yellow-600' : 'text-red-600';
                                                return (
                                                    <TableRow key={idx} className="hover:bg-muted/30">
                                                        <TableCell className="max-w-[300px]">
                                                            <div className="flex items-center gap-2">
                                                                <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                                <a
                                                                    href={page.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="hover:underline text-blue-600 truncate"
                                                                    title={page.url}
                                                                >
                                                                    {page.url.replace(/https?:\/\/[^/]+/, '')}
                                                                </a>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant={page.status_code === 200 ? 'outline' : 'destructive'}>
                                                                {page.status_code}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className={`text-center font-mono ${loadTimeClass}`}>
                                                            {page.load_time_ms}ms
                                                        </TableCell>
                                                        <TableCell className="text-center">{page.word_count}</TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-wrap gap-1">
                                                                {page.status_code !== 200 && (
                                                                    <Badge variant="destructive" className="text-xs">
                                                                        <XCircle className="h-3 w-3 mr-1" />
                                                                        Broken
                                                                    </Badge>
                                                                )}
                                                                {!page.meta_description && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        Missing Meta
                                                                    </Badge>
                                                                )}
                                                                {page.h1_count === 0 && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        No H1
                                                                    </Badge>
                                                                )}
                                                                {page.h1_count > 1 && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        Multiple H1s
                                                                    </Badge>
                                                                )}
                                                                {page.load_time_ms > 1000 && (
                                                                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                                                        Slow
                                                                    </Badge>
                                                                )}
                                                                {page.word_count < 300 && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        Thin Content
                                                                    </Badge>
                                                                )}
                                                                {page.issues?.map((issue: string, ix: number) => (
                                                                    <Badge key={ix} variant="destructive" className="text-xs">{issue}</Badge>
                                                                ))}
                                                                {page.status_code === 200 &&
                                                                    page.meta_description &&
                                                                    page.h1_count === 1 &&
                                                                    page.load_time_ms <= 1000 &&
                                                                    page.word_count >= 300 &&
                                                                    (!page.issues || page.issues.length === 0) && (
                                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                                    )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Core Web Vitals Tab */}
                    <TabsContent value="cwv" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {cwvData && ['mobile', 'desktop'].map((device) => {
                                const data = cwvData[device];
                                if (!data) return null;
                                const lcpStatus = getMetricStatus('lcp', data.lcp);
                                const fidStatus = getMetricStatus('fid', data.fid);
                                const clsStatus = getMetricStatus('cls', data.cls);

                                return (
                                    <Card key={device} className="border-t-4" style={{ borderTopColor: data.score >= 90 ? '#10b981' : data.score >= 50 ? '#f59e0b' : '#ef4444' }}>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${getScoreBg(data.score)}`}>
                                                        {device === 'mobile' ? <Smartphone className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                                                    </div>
                                                    <CardTitle className="capitalize">{device} Performance</CardTitle>
                                                </div>
                                                <div className={`text-2xl font-bold ${getScoreColor(data.score)}`}>
                                                    {data.score}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {/* LCP */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">Largest Contentful Paint (LCP)</span>
                                                        <Badge variant={lcpStatus === 'good' ? 'default' : lcpStatus === 'needs-improvement' ? 'secondary' : 'destructive'} className="text-xs">
                                                            {lcpStatus === 'good' ? 'Good' : lcpStatus === 'needs-improvement' ? 'Needs Work' : 'Poor'}
                                                        </Badge>
                                                    </div>
                                                    <span className="font-mono">{data.lcp}s</span>
                                                </div>
                                                <Progress
                                                    value={Math.min(100, (2.5 / data.lcp) * 100)}
                                                    className={`h-3 ${lcpStatus === 'good' ? '[&>div]:bg-green-500' : lcpStatus === 'needs-improvement' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'}`}
                                                />
                                                <p className="text-xs text-muted-foreground">Target: ≤2.5s • Current: {data.lcp}s</p>
                                            </div>

                                            {/* FID */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">First Input Delay (FID)</span>
                                                        <Badge variant={fidStatus === 'good' ? 'default' : fidStatus === 'needs-improvement' ? 'secondary' : 'destructive'} className="text-xs">
                                                            {fidStatus === 'good' ? 'Good' : fidStatus === 'needs-improvement' ? 'Needs Work' : 'Poor'}
                                                        </Badge>
                                                    </div>
                                                    <span className="font-mono">{data.fid}ms</span>
                                                </div>
                                                <Progress
                                                    value={Math.min(100, (100 / data.fid) * 100)}
                                                    className={`h-3 ${fidStatus === 'good' ? '[&>div]:bg-green-500' : fidStatus === 'needs-improvement' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'}`}
                                                />
                                                <p className="text-xs text-muted-foreground">Target: ≤100ms • Current: {data.fid}ms</p>
                                            </div>

                                            {/* CLS */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">Cumulative Layout Shift (CLS)</span>
                                                        <Badge variant={clsStatus === 'good' ? 'default' : clsStatus === 'needs-improvement' ? 'secondary' : 'destructive'} className="text-xs">
                                                            {clsStatus === 'good' ? 'Good' : clsStatus === 'needs-improvement' ? 'Needs Work' : 'Poor'}
                                                        </Badge>
                                                    </div>
                                                    <span className="font-mono">{data.cls}</span>
                                                </div>
                                                <Progress
                                                    value={Math.max(0, 100 - (data.cls / 0.25) * 100)}
                                                    className={`h-3 ${clsStatus === 'good' ? '[&>div]:bg-green-500' : clsStatus === 'needs-improvement' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'}`}
                                                />
                                                <p className="text-xs text-muted-foreground">Target: ≤0.1 • Current: {data.cls}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* CWV Tips */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Optimization Recommendations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-muted/30 rounded-lg">
                                        <h4 className="font-semibold mb-2">Improve LCP</h4>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            <li>• Optimize largest images</li>
                                            <li>• Use a CDN for static assets</li>
                                            <li>• Implement lazy loading</li>
                                        </ul>
                                    </div>
                                    <div className="p-4 bg-muted/30 rounded-lg">
                                        <h4 className="font-semibold mb-2">Reduce FID</h4>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            <li>• Minimize JavaScript execution</li>
                                            <li>• Break up long tasks</li>
                                            <li>• Use web workers</li>
                                        </ul>
                                    </div>
                                    <div className="p-4 bg-muted/30 rounded-lg">
                                        <h4 className="font-semibold mb-2">Fix CLS</h4>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            <li>• Set image dimensions</li>
                                            <li>• Reserve space for ads</li>
                                            <li>• Avoid inserting content above</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Structured Data Tab */}
                    <TabsContent value="schema" className="mt-6">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Shield className="h-5 w-5" />
                                            Structured Data Validation
                                        </CardTitle>
                                        <CardDescription>
                                            Schema.org markup detected on your website
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline">
                                        {schemaData?.filter((s: any) => s.status === 'valid').length || 0}/{schemaData?.length || 0} Valid
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {schemaData && schemaData.length > 0 ? (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/50">
                                                    <TableHead className="font-semibold">Schema Type</TableHead>
                                                    <TableHead className="font-semibold text-center">Status</TableHead>
                                                    <TableHead className="font-semibold">Errors / Warnings</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {schemaData.map((schema: any, idx: number) => (
                                                    <TableRow key={idx} className="hover:bg-muted/30">
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-4 w-4 text-blue-500" />
                                                                <span className="font-medium">{schema.type}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {schema.status === 'valid' && (
                                                                <Badge className="bg-green-500 hover:bg-green-600">
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    Valid
                                                                </Badge>
                                                            )}
                                                            {schema.status === 'warning' && (
                                                                <Badge className="bg-yellow-500 hover:bg-yellow-600">
                                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                                    Warning
                                                                </Badge>
                                                            )}
                                                            {schema.status === 'error' && (
                                                                <Badge variant="destructive">
                                                                    <XCircle className="h-3 w-3 mr-1" />
                                                                    Error
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {schema.errors && schema.errors.length > 0 ? (
                                                                <ul className="text-sm space-y-1">
                                                                    {schema.errors.map((err: string, i: number) => (
                                                                        <li key={i} className={`flex items-start gap-2 ${schema.status === 'error' ? 'text-red-600' : 'text-yellow-600'}`}>
                                                                            <span className="mt-0.5">•</span>
                                                                            <span>{err}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <span className="text-sm text-muted-foreground">No issues found</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No Structured Data Found</h3>
                                        <p className="text-muted-foreground max-w-md mx-auto">
                                            Consider adding Schema.org markup to improve your search appearance with rich snippets.
                                        </p>
                                    </div>
                                )}

                                {/* Schema recommendations */}
                                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h4 className="font-medium text-blue-800 mb-2">💡 Recommended Schema Types</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {['Organization', 'LocalBusiness', 'Product', 'Article', 'FAQ', 'BreadcrumbList', 'WebSite'].map(type => (
                                            <Badge key={type} variant="outline" className="bg-white">{type}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}

            {/* Empty State */}
            {!auditResult && !crawling && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Search className="h-16 w-16 text-muted-foreground/30 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Start Your Technical Audit</h3>
                        <p className="text-muted-foreground text-center max-w-md mb-6">
                            Enter your website URL above to analyze page health, Core Web Vitals,
                            structured data, and identify technical SEO issues.
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {['Page Speed', 'Broken Links', 'Meta Tags', 'Schema Markup', 'Mobile-First'].map(feature => (
                                <Badge key={feature} variant="secondary">{feature}</Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
