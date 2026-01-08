import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { api } from '@/lib/api';
import { useToast } from "@/components/ui/use-toast";
import { FileText, Download, Calendar, Loader2, Plus, Clock, Mail, TrendingUp, BarChart2, Target, Link2, Search, Eye, Trash2, RefreshCw, CheckCircle } from 'lucide-react';

interface Report {
    id: number;
    title: string;
    created_at: string;
    status: 'ready' | 'processing' | 'scheduled';
    modules: string[];
    download_url?: string;
}

export function SeoReports() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);

    // Generate Form
    const [reportTitle, setReportTitle] = useState('');
    const [selectedModules, setSelectedModules] = useState<string[]>(['Keywords', 'Backlinks']);
    const [generating, setGenerating] = useState(false);
    const [generateProgress, setGenerateProgress] = useState(0);

    // Schedule Form
    const [scheduleFreq, setScheduleFreq] = useState('monthly');
    const [scheduleEmail, setScheduleEmail] = useState('');
    const [scheduleModules, setScheduleModules] = useState<string[]>(['Keywords', 'Backlinks', 'Technical Audit']);
    const [isScheduled, setIsScheduled] = useState(false);

    const { toast } = useToast();

    const MODULES = [
        { id: 'Keywords', label: 'Keyword Rankings', icon: Search, description: 'Track keyword positions and changes' },
        { id: 'Backlinks', label: 'Backlink Profile', icon: Link2, description: 'Monitor link building progress' },
        { id: 'Technical Audit', label: 'Technical Health', icon: Target, description: 'Site issues and Core Web Vitals' },
        { id: 'Content Analysis', label: 'Content Performance', icon: FileText, description: 'Content optimization scores' },
        { id: 'Competitors', label: 'Competitor Tracking', icon: TrendingUp, description: 'Competitive gap analysis' }
    ];

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await api.get('/seo/reports');
            const data = res.data?.data || res.data || [];
            setReports(data);
        } catch (error) {
            console.error(error);
            toast({ title: "Failed to load reports", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!reportTitle.trim()) {
            toast({ title: "Title Required", description: "Please enter a report title.", variant: "destructive" });
            return;
        }
        if (selectedModules.length === 0) {
            toast({ title: "Modules Required", description: "Please select at least one module.", variant: "destructive" });
            return;
        }

        setGenerating(true);
        setGenerateProgress(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
            setGenerateProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        try {
            await api.post('/seo/reports', {
                title: reportTitle,
                modules: selectedModules
            });

            clearInterval(progressInterval);
            setGenerateProgress(100);

            setTimeout(() => {
                toast({ title: "Report Generated!", description: "Your report is ready for download." });
                setIsGenerateOpen(false);
                setReportTitle('');
                setGenerateProgress(0);
                fetchReports();
            }, 500);
        } catch (error) {
            clearInterval(progressInterval);
            toast({ title: "Generation Failed", variant: "destructive" });
            setGenerateProgress(0);
        } finally {
            setGenerating(false);
        }
    };

    const handleSchedule = async () => {
        if (!scheduleEmail.trim()) {
            toast({ title: "Email Required", description: "Please enter an email address.", variant: "destructive" });
            return;
        }
        try {
            await api.post('/seo/reports/schedule', {
                frequency: scheduleFreq,
                email: scheduleEmail,
                modules: scheduleModules
            });
            setIsScheduled(true);
            toast({ title: "Schedule Saved!", description: `Reports will be sent ${scheduleFreq} to ${scheduleEmail}.` });
            setIsScheduleOpen(false);
        } catch (error) {
            toast({ title: "Failed to schedule", variant: "destructive" });
        }
    };

    const toggleModule = (mod: string, list: string[], setList: (v: string[]) => void) => {
        if (list.includes(mod)) {
            setList(list.filter(m => m !== mod));
        } else {
            setList([...list, mod]);
        }
    };

    const handleDownload = (report: Report) => {
        toast({ title: "Downloading...", description: `${report.title} will download shortly.` });
        // Mock download
    };

    const handleDelete = (report: Report) => {
        setReports(reports.filter(r => r.id !== report.id));
        toast({ title: "Report Deleted", description: `${report.title} has been removed.` });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ready': return 'bg-green-100 text-green-800';
            case 'processing': return 'bg-yellow-100 text-yellow-800';
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getModuleIcon = (moduleId: string) => {
        const module = MODULES.find(m => m.id === moduleId);
        return module?.icon || FileText;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <BarChart2 className="h-6 w-6" />
                        Reports & Analytics
                    </h2>
                    <p className="text-muted-foreground">Generate custom SEO reports or schedule automated delivery.</p>
                </div>
                <div className="flex gap-2">
                    {/* Schedule Dialog */}
                    <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Calendar className="mr-2 h-4 w-4" />
                                {isScheduled ? 'Edit Schedule' : 'Schedule Reports'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Schedule Automated Reports
                                </DialogTitle>
                                <DialogDescription>Receive SEO performance updates directly to your inbox.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <Label>Delivery Frequency</Label>
                                    <Select value={scheduleFreq} onValueChange={setScheduleFreq}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="weekly">Weekly (Every Monday)</SelectItem>
                                            <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly (1st of month)</SelectItem>
                                            <SelectItem value="quarterly">Quarterly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Recipient Email</Label>
                                    <div className="flex gap-2">
                                        <Mail className="h-4 w-4 mt-3 text-muted-foreground" />
                                        <Input
                                            value={scheduleEmail}
                                            onChange={e => setScheduleEmail(e.target.value)}
                                            placeholder="you@company.com"
                                            type="email"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label>Include Modules</Label>
                                    <div className="space-y-2">
                                        {MODULES.map(mod => (
                                            <div
                                                key={mod.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${scheduleModules.includes(mod.id) ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'}`}
                                                onClick={() => toggleModule(mod.id, scheduleModules, setScheduleModules)}
                                            >
                                                <Checkbox
                                                    id={`sched-${mod.id}`}
                                                    checked={scheduleModules.includes(mod.id)}
                                                />
                                                <mod.icon className="h-4 w-4 text-muted-foreground" />
                                                <div className="flex-1">
                                                    <Label htmlFor={`sched-${mod.id}`} className="cursor-pointer font-medium">{mod.label}</Label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
                                <Button onClick={handleSchedule}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Save Schedule
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Generate Dialog */}
                    <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                New Report
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Generate Custom Report
                                </DialogTitle>
                                <DialogDescription>Create a comprehensive SEO report with selected modules.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <Label>Report Title</Label>
                                    <Input
                                        value={reportTitle}
                                        onChange={e => setReportTitle(e.target.value)}
                                        placeholder="e.g., Q1 2026 SEO Performance"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label>Select Modules to Include</Label>
                                    <div className="space-y-2">
                                        {MODULES.map(mod => (
                                            <div
                                                key={mod.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedModules.includes(mod.id) ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'}`}
                                                onClick={() => toggleModule(mod.id, selectedModules, setSelectedModules)}
                                            >
                                                <Checkbox
                                                    id={`gen-${mod.id}`}
                                                    checked={selectedModules.includes(mod.id)}
                                                />
                                                <mod.icon className="h-4 w-4 text-muted-foreground" />
                                                <div className="flex-1">
                                                    <Label htmlFor={`gen-${mod.id}`} className="cursor-pointer font-medium">{mod.label}</Label>
                                                    <p className="text-xs text-muted-foreground">{mod.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {generating && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Generating report...</span>
                                            <span>{generateProgress}%</span>
                                        </div>
                                        <Progress value={generateProgress} className="h-2" />
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsGenerateOpen(false)} disabled={generating}>Cancel</Button>
                                <Button onClick={handleGenerate} disabled={generating || !reportTitle.trim()}>
                                    {generating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="mr-2 h-4 w-4" />
                                            Generate PDF
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Schedule Status Card */}
            {isScheduled && (
                <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="font-medium">Automated Reports Active</p>
                                    <p className="text-sm text-muted-foreground">
                                        Sending {scheduleFreq} reports to {scheduleEmail}
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setIsScheduleOpen(true)}>
                                Edit Schedule
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Reports Table */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Generated Reports</CardTitle>
                        <Button variant="ghost" size="sm" onClick={fetchReports}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-semibold">Report Name</TableHead>
                                    <TableHead className="font-semibold">Date Created</TableHead>
                                    <TableHead className="font-semibold">Included Modules</TableHead>
                                    <TableHead className="font-semibold text-center">Status</TableHead>
                                    <TableHead className="font-semibold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                            Loading reports...
                                        </TableCell>
                                    </TableRow>
                                ) : reports.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12">
                                            <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                            <h3 className="font-semibold mb-1">No Reports Yet</h3>
                                            <p className="text-muted-foreground text-sm">
                                                Click "New Report" to generate your first SEO report.
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reports.map((report) => (
                                        <TableRow key={report.id} className="hover:bg-muted/30">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                        <FileText className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <span className="font-medium">{report.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(report.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {report.modules?.map((m: string, i: number) => {
                                                        const ModIcon = getModuleIcon(m);
                                                        return (
                                                            <Badge key={i} variant="outline" className="text-xs flex items-center gap-1">
                                                                <ModIcon className="h-3 w-3" />
                                                                {m}
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={getStatusColor(report.status)}>
                                                    {report.status === 'ready' && <CheckCircle className="h-3 w-3 mr-1" />}
                                                    {report.status === 'processing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => toast({ title: "Opening preview..." })}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDownload(report)}
                                                        disabled={report.status !== 'ready'}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(report)}
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
