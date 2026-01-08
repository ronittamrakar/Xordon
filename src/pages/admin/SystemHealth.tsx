import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Activity,
    Database,
    Server,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Search,
    FileTextIcon,
    History,
    Terminal,
    Cpu,
    Globe,
    Settings,
    ShieldAlert,
    Zap,
    ChevronRight,
    Monitor,
    Wrench,
    CheckCircle,
    BarChart as BarChartIcon,
    Download,
    Shield,
    Lock,
    Eye,
    HardDrive,
    Trash2,
    Settings2,
    Package,
    GitBranch,
    Layers,
    Clock,
    FileBox
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { systemApi, SystemHealthReport, ConnectivityNode, DiagnosticFinding, HealthTrend, SecurityEvent, SecurityStats, DatabaseInsight, SchedulerStatus, LogEntry, CacheKey, ServerResources } from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const SystemHealth = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const [report, setReport] = useState<SystemHealthReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [diagnosing, setDiagnosing] = useState(false);
    const [connectivity, setConnectivity] = useState<ConnectivityNode[]>([]);
    const [loadingConnectivity, setLoadingConnectivity] = useState(false);
    const [trends, setTrends] = useState<HealthTrend[]>([]);
    const [loadingTrends, setLoadingTrends] = useState(false);
    const [findings, setFindings] = useState<DiagnosticFinding[]>([]);
    const [showDiagnostics, setShowDiagnostics] = useState(false);
    const [fixingId, setFixingId] = useState<string | null>(null);
    const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
    const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null);
    const [performanceMetrics, setPerformanceMetrics] = useState<any | null>(null);
    const [externalServices, setExternalServices] = useState<Array<{ id: string; label: string; type: string; status: string; latency_ms: number; error?: string }>>([]);
    const [checkingConnectivity, setCheckingConnectivity] = useState(false);
    const [clearingCache, setClearingCache] = useState(false);
    const [optimizingDb, setOptimizingDb] = useState(false);

    // New Features State
    const [dbInsights, setDbInsights] = useState<DatabaseInsight | null>(null);
    const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
    const [loadingDb, setLoadingDb] = useState(false);
    const [loadingScheduler, setLoadingScheduler] = useState(false);

    // System Tools State
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [logLevel, setLogLevel] = useState<string>('');
    const [cacheKeys, setCacheKeys] = useState<CacheKey[]>([]);
    const [loadingCache, setLoadingCache] = useState(false);
    const [serverResources, setServerResources] = useState<ServerResources | null>(null);
    const [loadingResources, setLoadingResources] = useState(false);
    const [resourceHistory, setResourceHistory] = useState<ServerResources[]>([]);

    // Maintenance & Tools State
    const [maintenance, setMaintenance] = useState<{ enabled: boolean, timestamp?: number } | null>(null);
    const [testEmailOpen, setTestEmailOpen] = useState(false);
    const [testEmailAddress, setTestEmailAddress] = useState('');
    const [sendingTestEmail, setSendingTestEmail] = useState(false);
    const [togglingMaintenance, setTogglingMaintenance] = useState(false);

    // Comprehensive Health - Phase 2 State
    const [trafficData, setTrafficData] = useState<any>(null);
    const [loadingTraffic, setLoadingTraffic] = useState(false);
    const [businessHealth, setBusinessHealth] = useState<any>(null);
    const [loadingBusinessHealth, setLoadingBusinessHealth] = useState(false);
    const [dbInternals, setDbInternals] = useState<any>(null);
    const [loadingDbInternals, setLoadingDbInternals] = useState(false);
    const [healthAlerts, setHealthAlerts] = useState<any[]>([]);
    const [loadingAlerts, setLoadingAlerts] = useState(false);
    const [detailedTrends, setDetailedTrends] = useState<any[]>([]);
    const [trendsPeriod, setTrendsPeriod] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
    const [migratingTables, setMigratingTables] = useState(false);
    const [takingSnapshot, setTakingSnapshot] = useState(false);

    const onTabChange = (value: string) => {
        setSearchParams({ tab: value });
    };

    const fetchHealth = async (isRefreshing = false) => {
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);

        try {
            const response = await systemApi.getHealth();
            if (response.success && response.data) {
                setReport(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch health report:', error);
            toast.error('Failed to fetch system health report');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchSecurity = async () => {
        try {
            const [eventsRes, statsRes] = await Promise.all([
                systemApi.getSecurityEvents(),
                systemApi.getSecurityStats()
            ]);
            if (eventsRes.success) setSecurityEvents(eventsRes.data);
            if (statsRes.success) setSecurityStats(statsRes.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchPerformance = async () => {
        try {
            const response = await systemApi.getPerformanceMetrics();
            if (response.success) setPerformanceMetrics(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchTrends = async () => {
        setLoadingTrends(true);
        try {
            const response = await systemApi.getTrends();
            if (response.success) {
                setTrends(response.data || []);

                // Extract historical resource metrics for the Server tab
                const history: ServerResources[] = (response.data || [])
                    .filter((t: any) => t.metrics && t.metrics.cpu_usage !== undefined)
                    .map((t: any) => ({
                        cpu: { current: t.metrics.cpu_usage, cores: t.metrics.cpu_cores || 4 },
                        memory: { used: 0, total: 100, percent: t.metrics.mem_usage },
                        disk: { used: 0, total: 100, percent: t.metrics.disk_usage },
                        timestamp: new Date(t.timestamp).getTime() / 1000
                    }));

                if (history.length > 0) {
                    setResourceHistory(history);
                }
            }
        } catch (error) {
            console.error('Failed to fetch trends:', error);
        } finally {
            setLoadingTrends(false);
        }
    };

    const handleCheckExternalConnectivity = async () => {
        setCheckingConnectivity(true);
        try {
            const response = await systemApi.checkExternalConnectivity();
            if (response.success) {
                setExternalServices(response.services);
                toast.success('Connectivity check completed');
            }
        } catch (error) {
            toast.error('External connectivity check failed');
        } finally {
            setCheckingConnectivity(false);
        }
    };

    const fetchConnectivity = async () => {
        setLoadingConnectivity(true);
        try {
            const response = await systemApi.getConnectivity();
            if (response.success) {
                setConnectivity(response.nodes);
            }
        } catch (error) {
            console.error('Failed to fetch connectivity:', error);
        } finally {
            setLoadingConnectivity(false);
        }
    };

    const fetchDbInsights = async () => {
        setLoadingDb(true);
        try {
            const response = await systemApi.getDatabaseInsights();
            if (response.data) {
                setDbInsights(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch DB insights', error);
        } finally {
            setLoadingDb(false);
        }
    };

    const fetchSchedulerStatus = async () => {
        setLoadingScheduler(true);
        try {
            const response = await systemApi.getSchedulerStatus();
            if (response.data) {
                setSchedulerStatus(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch scheduler status', error);
        } finally {
            setLoadingScheduler(false);
        }
    };

    const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
            const response = await systemApi.getLogs(100, logLevel || undefined);
            if (response.success) {
                setLogs(response.logs);
            }
        } catch (error) {
            console.error('Failed to fetch logs', error);
        } finally {
            setLoadingLogs(false);
        }
    };

    const fetchCache = async () => {
        setLoadingCache(true);
        try {
            const response = await systemApi.getCacheKeys();
            if (response.success) {
                setCacheKeys(response.keys);
            }
        } catch (error) {
            console.error('Failed to fetch cache keys', error);
        } finally {
            setLoadingCache(false);
        }
    };

    const fetchServerResources = async () => {
        setLoadingResources(true);
        try {
            const response = await systemApi.getServerResources();
            if (response.success && response.data) {
                setServerResources(response.data);
                // Add to history (keep last 20 entries)
                setResourceHistory(prev => {
                    const newHistory = [...prev, response.data];
                    return newHistory.slice(-20);
                });
            }
        } catch (error) {
            console.error('Failed to fetch server resources', error);
        } finally {
            setLoadingResources(false);
        }
    };

    const fetchMaintenance = async () => {
        try {
            const response = await systemApi.getMaintenanceStatus();
            if (response.success) {
                setMaintenance({ enabled: response.enabled, timestamp: response.timestamp });
            }
        } catch (error) {
            console.error('Failed to fetch maintenance status', error);
        }
    };

    const handleToggleMaintenance = async () => {
        setTogglingMaintenance(true);
        try {
            const newState = !maintenance?.enabled;
            const response = await systemApi.setMaintenanceMode(newState);
            if (response.success) {
                setMaintenance({ enabled: newState });
                toast.success(newState ? 'Maintenance mode enabled' : 'Maintenance mode disabled');
            }
        } catch (error) {
            toast.error('Failed to toggle maintenance mode');
        } finally {
            setTogglingMaintenance(false);
        }
    };

    const handleSendTestEmail = async () => {
        if (!testEmailAddress || !testEmailAddress.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }
        setSendingTestEmail(true);
        try {
            const response = await systemApi.testEmail(testEmailAddress);
            if (response.success) {
                toast.success('Test email sent successfully');
                setTestEmailOpen(false);
                setTestEmailAddress('');
            } else {
                toast.error(response.message || 'Failed to send test email');
            }
        } catch (error) {
            toast.error('Failed to send test email');
        } finally {
            setSendingTestEmail(false);
        }
    };

    const handleDeleteCacheKey = async (key: string) => {
        try {
            const response = await systemApi.deleteCacheKey(key);
            if (response.success) {
                toast.success('Cache key deleted');
                fetchCache();
            } else {
                toast.error('Failed to delete cache key');
            }
        } catch (e) {
            toast.error('Failed to delete cache key');
        }
    };

    // Comprehensive Health - Phase 2 Fetch Functions
    const fetchTrafficData = async () => {
        setLoadingTraffic(true);
        try {
            const response = await systemApi.getTrafficAnalytics();
            if (response.success) setTrafficData(response.data);
        } catch (error) {
            console.error('Failed to fetch traffic data:', error);
        } finally {
            setLoadingTraffic(false);
        }
    };

    const fetchBusinessHealthData = async () => {
        setLoadingBusinessHealth(true);
        try {
            const response = await systemApi.getBusinessHealth();
            if (response.success) setBusinessHealth(response.data);
        } catch (error) {
            console.error('Failed to fetch business health:', error);
        } finally {
            setLoadingBusinessHealth(false);
        }
    };

    const fetchDbInternalsData = async () => {
        setLoadingDbInternals(true);
        try {
            const response = await systemApi.getDatabaseInternals();
            if (response.success) setDbInternals(response.data);
        } catch (error) {
            console.error('Failed to fetch DB internals:', error);
        } finally {
            setLoadingDbInternals(false);
        }
    };

    const fetchHealthAlerts = async () => {
        setLoadingAlerts(true);
        try {
            const response = await systemApi.getAlerts();
            if (response.success) setHealthAlerts(response.data || []);
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
        } finally {
            setLoadingAlerts(false);
        }
    };

    const fetchDetailedTrendsData = async () => {
        try {
            const response = await systemApi.getDetailedTrends(trendsPeriod);
            if (response.success) setDetailedTrends(response.data || []);
        } catch (error) {
            console.error('Failed to fetch detailed trends:', error);
        }
    };

    const handleRunMigration = async () => {
        setMigratingTables(true);
        try {
            const response = await systemApi.runMigration();
            if (response.success) {
                toast.success(`Migration completed: ${response.tables_created.join(', ')}`);
            } else {
                toast.error('Migration failed');
            }
        } catch (error) {
            toast.error('Migration failed');
        } finally {
            setMigratingTables(false);
        }
    };

    const handleTakeSnapshot = async () => {
        setTakingSnapshot(true);
        try {
            const response = await systemApi.takeSnapshot();
            if (response.success) {
                toast.success(`Snapshot taken: Score ${response.snapshot.score}%`);
                fetchDetailedTrendsData();
            }
        } catch (error) {
            toast.error('Failed to take snapshot');
        } finally {
            setTakingSnapshot(false);
        }
    };

    const handleAcknowledgeAlert = async (id: number) => {
        try {
            await systemApi.updateAlert(id, 'acknowledge');
            toast.success('Alert acknowledged');
            fetchHealthAlerts();
        } catch (error) {
            toast.error('Failed to acknowledge alert');
        }
    };

    const handleResolveAlert = async (id: number) => {
        try {
            await systemApi.updateAlert(id, 'resolve');
            toast.success('Alert resolved');
            fetchHealthAlerts();
        } catch (error) {
            toast.error('Failed to resolve alert');
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            await Promise.all([
                fetchHealth(),
                fetchConnectivity(),
                fetchTrends(),
                fetchSecurity(),
                fetchPerformance(),
                fetchDbInsights(),
                fetchSchedulerStatus(),
                fetchLogs(),
                fetchCache(),
                fetchServerResources(),
                fetchMaintenance(),
                handleCheckExternalConnectivity(), // Fire once
                // Comprehensive Health - Phase 2
                fetchTrafficData(),
                fetchBusinessHealthData(),
                fetchDbInternalsData(),
                fetchHealthAlerts(),
                fetchDetailedTrendsData()
            ]);
        };

        fetchInitialData();

        const interval = setInterval(() => {
            fetchHealth(true);
            fetchConnectivity();
            fetchTrends();
            fetchSecurity();
            fetchPerformance();
            fetchDbInsights();
            fetchSchedulerStatus();
            fetchServerResources();
            fetchMaintenance();
            fetchLogs();
            fetchCache();
            // Comprehensive Health - Phase 2 (less frequent)
            fetchTrafficData();
            fetchBusinessHealthData();
            fetchHealthAlerts();
        }, 10000);
        return () => clearInterval(interval);
    }, [logLevel, trendsPeriod]);

    const handleRunDiagnostics = async () => {
        setDiagnosing(true);
        try {
            const response = await systemApi.runDiagnostics();
            if (response.success) {
                setFindings(response.findings || []);
                setShowDiagnostics(true);
                toast.success(response.message || 'Diagnostics completed');
            } else {
                toast.error((response as any).error || 'Diagnostics failed');
            }
        } catch (error: any) {
            console.error('Diagnostics error:', error);
            const errorMessage = error?.response?.data?.error || error?.message || 'Diagnostics failed';
            toast.error(errorMessage);
        } finally {
            setDiagnosing(false);
        }
    };

    const handleApplyFix = async (finding: DiagnosticFinding) => {
        setFixingId(finding.id);
        try {
            const response = await systemApi.performFix(finding.fix_action!, finding.fix_params);
            if (response.success) {
                toast.success(response.message || 'Fix applied successfully');
                setFindings(prev => prev.filter(f => f.id !== finding.id));
                fetchHealth(true);
            } else {
                toast.error(response.message || 'Failed to apply fix');
            }
        } catch (error) {
            toast.error('Failed to apply fix');
        } finally {
            setFixingId(null);
        }
    };

    const handleClearCache = async () => {
        setClearingCache(true);
        try {
            const response = await systemApi.performFix('cleanup_temp_files', {});
            if (response.success) {
                toast.success('Cache & Temp files cleared');
                fetchCache();
            }
        } catch (error) { toast.error('Failed'); }
        finally { setClearingCache(false); }
    };

    const handleOptimizeDatabase = async () => {
        setOptimizingDb(true);
        try {
            const response = await systemApi.performFix('optimize_tables', {});
            if (response.success) toast.success('Database optimized');
        } catch (error) { toast.error('Failed'); }
        finally { setOptimizingDb(false); }
    };

    const getStatusIcon = (status: string) => {
        if (status === 'green' || status === 'healthy') return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
        if (status === 'yellow') return <AlertTriangle className="h-5 w-5 text-amber-500" />;
        return <XCircle className="h-5 w-5 text-rose-500" />;
    };

    const getBadgeStatusColor = (status: string) => {
        if (status === 'green' || status === 'healthy') return 'bg-emerald-500 text-white';
        if (status === 'yellow') return 'bg-amber-500 text-white';
        return 'bg-rose-500 text-white';
    };

    if (loading && !report) {
        return <div className="flex items-center justify-center min-h-screen"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-4">
                        <div className="relative h-12 w-12 flex items-center justify-center">
                            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                            <div className="relative bg-emerald-500 h-4 w-4 rounded-full border-2 border-white shadow-lg shadow-emerald-500/50" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">System Health</h1>
                            <p className="text-muted-foreground font-medium flex items-center gap-2">
                                Infrastructure Monitoring <span className="h-1 w-1 bg-slate-300 rounded-full" /> Live Updates Enabled
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => fetchHealth(true)} disabled={refreshing}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button onClick={handleRunDiagnostics} disabled={diagnosing}>
                        <Wrench className="h-4 w-4 mr-2" /> Run Diagnostics
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" value={activeTab} onValueChange={onTabChange} className="w-full">
                <TabsList className="flex flex-wrap h-auto gap-2 bg-slate-100/50 p-1.5 rounded-xl border border-slate-200/50 backdrop-blur-md mb-8">
                    {[
                        { v: 'overview', l: 'Summary' }, { v: 'traffic', l: 'Traffic' }, { v: 'app-health', l: 'App Health' },
                        { v: 'alerts', l: 'Alerts' }, { v: 'modules', l: 'Modules' }, { v: 'database', l: 'Database' },
                        { v: 'scheduler', l: 'Queue' }, { v: 'logs', l: 'Logs' }, { v: 'cache', l: 'Cache' },
                        { v: 'server', l: 'Server' }, { v: 'environment', l: 'Env' }, { v: 'security', l: 'Security' },
                        { v: 'performance', l: 'Perf' }, { v: 'connectivity', l: 'Network' }, { v: 'client-errors', l: 'Errors' }, { v: 'maintenance', l: 'Tools' }
                    ].map(t => (
                        <TabsTrigger key={t.v} value={t.v} className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-4 py-2 text-xs font-semibold transition-all">
                            {t.l}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="glass-card">
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Health Score</CardTitle></CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{report ? (report.status === 'healthy' ? 100 : 75) : 0}%</div>
                                <Progress value={report?.status === 'healthy' ? 100 : 75} className="mt-2" />
                            </CardContent>
                        </Card>
                        <Card className="glass-card">
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Active Modules</CardTitle></CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{report?.modules.length || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
                            </CardContent>
                        </Card>

                        <Card className="glass-card">
                            <CardHeader className="pb-2"><CardTitle className="text-sm">App Memory</CardTitle></CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{Math.round((performanceMetrics?.app?.memory_used || 0) / 1024 / 1024)} MB</div>
                                <p className="text-xs text-muted-foreground mt-1">PHP Process Usage</p>
                            </CardContent>
                        </Card>
                        <Card className="glass-card">
                            <CardHeader className="pb-2"><CardTitle className="text-sm">App Storage</CardTitle></CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{Math.round((performanceMetrics?.app?.storage_used || 0) / 1024 / 1024)} MB</div>
                                <p className="text-xs text-muted-foreground mt-1">Project Directory Size</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="glass-card">
                            <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> Health Pulse</CardTitle></CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <AreaChart data={trends}>
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="timestamp" hide />
                                        <YAxis domain={[0, 100]} hide />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                            itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                                        />
                                        <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card className="glass-card">
                            <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Activity Feed</CardTitle></CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[250px]">
                                    {report?.recent_activity.map((a, i) => (
                                        <div key={i} className="mb-3 border-l-2 pl-3 py-1">
                                            <p className="text-sm font-medium">{a.description}</p>
                                            <p className="text-[12px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="client-errors" className="space-y-4">
                    <ClientErrorsView />
                </TabsContent>

                <TabsContent value="modules" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {report?.modules?.map((m) => (
                            <Card key={m.id} className="glass-card group hover:scale-[1.02] transition-all hover:shadow-xl duration-300 border-slate-200/60 overflow-hidden relative">
                                <div className={`absolute top-0 left-0 w-1 h-full ${m.status === 'green' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-sm font-bold text-slate-700">{m.name}</CardTitle>
                                        <div className={`h-2 w-2 rounded-full ${m.status === 'green' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'} shadow-[0_0_8px_rgba(16,185,129,0.8)]`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="mt-2 text-xs font-semibold text-slate-500 flex items-center gap-2">
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${m.status === 'green' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                style={{ width: `${(m.tables_found / m.tables_count) * 100}%` }}
                                            />
                                        </div>
                                        <span className="whitespace-nowrap">{m.tables_found}/{m.tables_count}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="scheduler" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="glass-card">
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Failed</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-rose-500">{schedulerStatus?.recent_failed?.length || 0}</div></CardContent>
                        </Card>
                        <Card className="glass-card">
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Processed (24h)</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-emerald-500">{schedulerStatus?.throughput?.processed_24h || 0}</div></CardContent>
                        </Card>
                        <Card className="glass-card">
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Failed (24h)</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-rose-500">{schedulerStatus?.throughput?.failed_24h || 0}</div></CardContent>
                        </Card>
                        <Card className="glass-card">
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Health</CardTitle></CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {schedulerStatus ? Math.round(((schedulerStatus.throughput?.processed_24h || 0) / (schedulerStatus.throughput?.processed_24h + schedulerStatus.throughput?.failed_24h || 1)) * 100) : 0}%
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Layers className="h-5 w-5" /> Recent Failed Jobs
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Attempts</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Payload Preview</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {schedulerStatus?.recent_failed?.map((job: any) => (
                                        <TableRow key={job.id}>
                                            <TableCell className="font-mono text-xs">{job.id}</TableCell>
                                            <TableCell>{job.attempt}</TableCell>
                                            <TableCell>{new Date(job.created_at).toLocaleString()}</TableCell>
                                            <TableCell className="max-w-xs truncate text-xs font-mono">{job.payload}</TableCell>
                                        </TableRow>
                                    ))}
                                    {(!schedulerStatus?.recent_failed || schedulerStatus.recent_failed.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No failed jobs found</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="database" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2">
                            <CardHeader><CardTitle>Database Storage by Table</CardTitle></CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={dbInsights?.tables || []} layout="vertical">
                                        <XAxis type="number" unit="MB" />
                                        <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '10px' }} />
                                        <Tooltip />
                                        <Bar dataKey="size_mb" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <div className="space-y-4">
                            <Card><CardHeader><CardTitle className="text-sm">Total Size</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{dbInsights?.stats?.total_size_mb} MB</div></CardContent></Card>
                            <Card><CardHeader><CardTitle className="text-sm">Table Count</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{dbInsights?.stats?.table_count}</div></CardContent></Card>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" /> Active Processes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>DB</TableHead>
                                        <TableHead>Command</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>State</TableHead>
                                        <TableHead>Info</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dbInsights?.processes?.map((p: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-mono text-xs">{p.User}</TableCell>
                                            <TableCell className="font-mono text-xs">{p.db}</TableCell>
                                            <TableCell>{p.Command}</TableCell>
                                            <TableCell>{p.Time}s</TableCell>
                                            <TableCell>{p.State}</TableCell>
                                            <TableCell className="max-w-md truncate text-xs font-mono">{p.Info}</TableCell>
                                        </TableRow>
                                    ))}
                                    {(!dbInsights?.processes || dbInsights.processes.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">No active processes captured</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="logs" className="space-y-4">
                    <Card className="bg-black text-white">
                        <CardHeader className="border-b border-white/10 flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2"><Terminal className="h-5 w-5" /> Live Logs</CardTitle>
                            <select value={logLevel} onChange={(e) => setLogLevel(e.target.value)} className="bg-white/10 text-xs border-none rounded px-2 py-1">
                                <option value="">All Levels</option>
                                <option value="ERROR">ERROR</option>
                                <option value="WARNING">WARNING</option>
                            </select>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[500px] p-4 font-mono text-xs">
                                {logs.map((l, i) => (
                                    <div key={i} className="mb-1 flex gap-2">
                                        <span className="text-white/40">[{l.timestamp}]</span>
                                        <span className={l.level === 'ERROR' ? 'text-red-400' : 'text-blue-400'}>{l.level}:</span>
                                        <span className="text-white/80">{l.message}</span>
                                    </div>
                                ))}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cache" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2"><FileBox className="h-5 w-5" /> Cache Storage</CardTitle>
                            <Button variant="outline" size="sm" onClick={fetchCache} disabled={loadingCache}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${loadingCache ? 'animate-spin' : ''}`} /> Refresh
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Key / Filename</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Modified</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cacheKeys.map((k, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-mono">{k.key}</TableCell>
                                            <TableCell>{Math.round(k.size / 1024)} KB</TableCell>
                                            <TableCell>{k.modified}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteCacheKey(k.key)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {cacheKeys.length === 0 && (
                                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Cache is empty</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-blue-200">
                            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-blue-500" /> App Memory</CardTitle></CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{Math.round((performanceMetrics?.app?.memory_used || 0) / 1024 / 1024)} MB</div>
                                <p className="text-[12px] text-muted-foreground uppercase font-bold mt-1">Uptime: {performanceMetrics?.uptime || 'Calculating...'}</p>
                                <Progress value={Math.min(100, (performanceMetrics?.app?.memory_used / (256 * 1024 * 1024)) * 100)} className="mt-3" />
                            </CardContent>
                        </Card>
                        <Card className="border-purple-200">
                            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><HardDrive className="h-4 w-4 text-purple-500" /> App Storage</CardTitle></CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{Math.round((performanceMetrics?.app?.storage_used || 0) / 1024 / 1024)} MB</div>
                                <div className="grid grid-cols-2 gap-2 mt-4 text-[12px] uppercase font-bold text-muted-foreground">
                                    <div className="bg-slate-50 p-1 rounded">Logs: {Math.round(performanceMetrics?.app?.logs_size / 1024)}KB</div>
                                    <div className="bg-slate-50 p-1 rounded">Cache: {Math.round(performanceMetrics?.app?.cache_size / 1024)}KB</div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-emerald-200">
                            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Database className="h-4 w-4 text-emerald-500" /> DB Consumption</CardTitle></CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{Math.round((performanceMetrics?.app?.db_storage_used || 0) / 1024 / 1024)} MB</div>
                                <p className="text-[12px] text-muted-foreground uppercase mt-2">Total Database Size</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="mt-12 bg-slate-50 p-6 rounded-2xl">
                        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4">Infrastructure Resources (Total System)</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[12px] uppercase font-bold text-slate-500 flex justify-between">System CPU <span className="text-slate-700">{performanceMetrics?.cpu?.current}%</span></label>
                                <Progress value={performanceMetrics?.cpu?.current} className="h-1" />
                            </div>
                            <p className="text-[12px] text-muted-foreground">App CPU usage is transient per request.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[12px] uppercase font-bold text-slate-500 flex justify-between">System RAM <span className="text-slate-700">{performanceMetrics?.memory?.percent}%</span></label>
                                <Progress value={performanceMetrics?.memory?.percent} className="h-1" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] uppercase font-bold text-indigo-500 flex justify-between">App Memory <span className="text-indigo-700">{Math.round((performanceMetrics?.app?.memory_usage || 0) / 1024 / 1024)} MB</span></label>
                                <Progress value={(performanceMetrics?.app?.memory_usage / performanceMetrics?.memory?.total) * 100} className="h-1 bg-indigo-100" indicatorClassName="bg-indigo-500" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[12px] uppercase font-bold text-slate-500 flex justify-between">Total Disk <span className="text-slate-700">{Math.round((performanceMetrics?.disk?.used || 0) / 1024 / 1024 / 1024)} GB</span></label>
                                <Progress value={performanceMetrics?.disk?.percent} className="h-1" />
                                <div className="flex justify-between text-[12px] text-muted-foreground">
                                    <span>Total: {Math.round((performanceMetrics?.disk?.total || 0) / 1024 / 1024 / 1024)} GB</span>
                                    <span>Free: {Math.round(((performanceMetrics?.disk?.total || 0) - (performanceMetrics?.disk?.used || 0)) / 1024 / 1024 / 1024)} GB</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] uppercase font-bold text-purple-500 flex justify-between">App Storage (Xordon) <span className="text-purple-700">{Math.round((performanceMetrics?.app?.storage_used || 0) / 1024 / 1024)} MB</span></label>
                                <div className="h-1 w-full bg-purple-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${Math.max(1, ((performanceMetrics?.app?.storage_used || 0) / performanceMetrics?.disk?.total) * 100)}%` }}></div>
                                </div>
                                <p className="text-[12px] text-muted-foreground">Includes code, logs, cache, and uploads.</p>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="server" className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Server Resource History</CardTitle></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={resourceHistory.map((r, i) => ({ i, cpu: r.cpu.current, mem: r.memory.percent }))}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="i" hide />
                                    <YAxis hide />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="cpu" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} />
                                    <Area type="monotone" dataKey="mem" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="environment" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card><CardHeader><CardTitle>Environment Settings</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between border-b py-2"><span>PHP Version</span><span className="font-mono">{report?.environment?.php_version}</span></div>
                                <div className="flex justify-between border-b py-2"><span>Memory Limit</span><span className="font-mono">{report?.environment?.memory_limit}</span></div>
                                <div className="flex justify-between border-b py-2"><span>App Debug</span><Badge variant="outline">{report?.environment?.app_debug ? 'TRUE' : 'FALSE'}</Badge></div>
                                <div className="flex justify-between border-b py-2"><span>Timezone</span><span className="font-mono">{report?.environment?.timezone}</span></div>
                            </CardContent></Card>
                        <Card><CardHeader><CardTitle>Required Extensions</CardTitle></CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                {report?.environment?.extensions?.loaded?.map(ext => <Badge key={ext} variant="secondary" className="bg-emerald-50 text-emerald-700">{ext}</Badge>)}
                                {report?.environment?.extensions?.missing?.map(ext => <Badge key={ext} variant="destructive">{ext}</Badge>)}
                            </CardContent></Card>
                    </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-rose-50 border-rose-100">
                            <CardHeader><CardTitle className="text-rose-900 text-sm">Security Events (24h)</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-rose-600">{securityStats?.summary?.total_events || 0}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-sm">Blocked IPs</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">{securityStats?.summary?.unique_ips || 0}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-sm">Rate Limit Hits</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-amber-500">{securityStats?.summary?.rate_limit_blocks || 0}</div></CardContent>
                        </Card>
                    </div>
                    <Card className="border-slate-200/60 shadow-lg"><CardHeader className="border-b bg-slate-50/50"><CardTitle className="flex items-center gap-2 text-slate-800"><History className="h-5 w-5 text-rose-500" /> Security Audit Log</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>Event Type</TableHead>
                                        <TableHead>IP Address</TableHead>
                                        <TableHead>Severity</TableHead>
                                        <TableHead>Timestamp</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {securityEvents.map(e => (
                                        <TableRow key={e.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="font-bold text-slate-700">{e.type}</TableCell>
                                            <TableCell className="font-mono text-xs">{e.ip_address}</TableCell>
                                            <TableCell>
                                                <Badge className={`${e.severity === 'critical' ? 'bg-rose-500' :
                                                    e.severity === 'high' ? 'bg-orange-500' :
                                                        e.severity === 'medium' ? 'bg-amber-500' : 'bg-slate-500'
                                                    } text-white border-none shadow-sm`}>
                                                    {e.severity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-xs">{new Date(e.created_at).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                    {securityEvents.length === 0 && (
                                        <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground font-medium">No security incidents detected.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="connectivity" className="space-y-4">
                    <Card><CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Integration Status Map</CardTitle>
                        <Button variant="outline" size="sm" onClick={fetchConnectivity} disabled={loadingConnectivity}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loadingConnectivity ? 'animate-spin' : ''}`} /> Refresh Map
                        </Button>
                    </CardHeader>
                        <CardContent><div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {connectivity.map(n => <div key={n.id} className="p-4 border rounded-xl text-center bg-white/50 backdrop-blur-sm self-center h-full flex flex-col items-center justify-center">
                                {getStatusIcon(n.status)}
                                <p className="mt-2 text-sm font-bold">{n.label}</p>
                                {n.details && <p className="text-[12px] text-muted-foreground uppercase mt-1">{n.details}</p>}
                                {n.last_active && <p className="text-[12px] text-muted-foreground mt-1">Active: {new Date(n.last_active).toLocaleDateString()}</p>}
                            </div>)}
                            {connectivity.length === 0 && <div className="col-span-full p-8 text-center text-muted-foreground">No active connections or integrations found</div>}
                        </div></CardContent></Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>External Connectivity Latency (ms)</CardTitle>
                            <Button variant="outline" size="sm" onClick={handleCheckExternalConnectivity} disabled={checkingConnectivity}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${checkingConnectivity ? 'animate-spin' : ''}`} /> Check Latency
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {externalServices.map(s => (
                                    <div key={s.id} className="flex justify-between items-center p-3 border rounded-lg bg-white/30 backdrop-blur-sm">
                                        <div className="flex items-center gap-3">
                                            {getStatusIcon(s.status)}
                                            <div>
                                                <p className="text-sm font-bold">{s.label}</p>
                                                <p className="text-[12px] text-muted-foreground uppercase">{s.type}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant={s.status === 'green' ? 'outline' : 'destructive'} className="font-mono">{s.latency_ms}ms</Badge>
                                            {s.error && <p className="text-[12px] text-rose-500 mt-1 max-w-[150px] truncate">{s.error}</p>}
                                        </div>
                                    </div>
                                ))}
                                {externalServices.length === 0 && <div className="col-span-full py-4 text-center text-muted-foreground">Click 'Check Latency' to analyze external connectivity</div>}
                            </div>
                        </CardContent></Card>
                </TabsContent>

                <TabsContent value="maintenance" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="hover:border-primary transition-colors cursor-pointer" onClick={handleClearCache}>
                            <CardHeader className="text-center"><Trash2 className="h-8 w-8 mx-auto text-amber-500 mb-2" /><CardTitle>Flush Cache</CardTitle><CardDescription>Clear system temp files</CardDescription></CardHeader>
                        </Card>
                        <Card className="hover:border-primary transition-colors cursor-pointer" onClick={handleOptimizeDatabase}>
                            <CardHeader className="text-center"><Database className="h-8 w-8 mx-auto text-purple-500 mb-2" /><CardTitle>Optimize DB</CardTitle><CardDescription>Defragment tables</CardDescription></CardHeader>
                        </Card>
                        <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => setTestEmailOpen(true)}>
                            <CardHeader className="text-center"><Monitor className="h-8 w-8 mx-auto text-blue-500 mb-2" /><CardTitle>Test Email</CardTitle><CardDescription>Verify SMTP config</CardDescription></CardHeader>
                        </Card>
                        <Card className={`hover:border-primary transition-colors cursor-pointer ${maintenance?.enabled ? 'bg-rose-50 border-rose-200' : ''}`} onClick={handleToggleMaintenance}>
                            <CardHeader className="text-center">
                                {maintenance?.enabled ? <Lock className="h-8 w-8 mx-auto text-rose-500 mb-2" /> : <Wrench className="h-8 w-8 mx-auto text-emerald-500 mb-2" />}
                                <CardTitle>{maintenance?.enabled ? 'Disable Maintenance' : 'Enable Maintenance'}</CardTitle>
                                <CardDescription>System Access Control</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader><CardTitle>System Diagnostic Tools</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 border rounded-lg bg-slate-50 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold">Full System Diagnostics</h3>
                                    <p className="text-sm text-muted-foreground">Run a complete health check on all modules</p>
                                </div>
                                <Button onClick={handleRunDiagnostics} disabled={diagnosing}>
                                    {diagnosing ? 'Running...' : 'Run Analysis'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Traffic Analytics Tab */}
                <TabsContent value="traffic" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Traffic Analytics</h2>
                        <Button variant="outline" size="sm" onClick={handleRunMigration} disabled={migratingTables}>
                            {migratingTables ? 'Setting up...' : 'Setup Tables'}
                        </Button>
                    </div>

                    {trafficData?.summary ? (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Requests (1h)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{trafficData.summary.total_requests_1h}</div></CardContent></Card>
                                <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Avg Latency</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{trafficData.summary.avg_latency_ms}ms</div></CardContent></Card>
                                <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Max Latency</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600">{trafficData.summary.max_latency_ms}ms</div></CardContent></Card>
                                <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Server Errors</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-rose-600">{trafficData.summary.server_errors_1h}</div></CardContent></Card>
                                <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Error Rate</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{trafficData.summary.error_rate}%</div></CardContent></Card>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader><CardTitle>Requests Per Minute</CardTitle></CardHeader>
                                    <CardContent className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={trafficData.rpm}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="minute" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                                                <YAxis />
                                                <Tooltip />
                                                <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="#c4b5fd" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle>Avg Latency (ms)</CardTitle></CardHeader>
                                    <CardContent className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={trafficData.latency}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="minute" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                                                <YAxis />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="avg_ms" stroke="#10b981" strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </div>

                            {trafficData.slowest_routes?.length > 0 && (
                                <Card>
                                    <CardHeader><CardTitle>Slowest Routes</CardTitle></CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader><TableRow><TableHead>Path</TableHead><TableHead>Avg (ms)</TableHead><TableHead>Max (ms)</TableHead><TableHead>Hits</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {trafficData.slowest_routes.map((r: any, i: number) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="font-mono text-xs">{r.path}</TableCell>
                                                        <TableCell>{Math.round(r.avg_ms)}</TableCell>
                                                        <TableCell className="text-amber-600">{r.max_ms}</TableCell>
                                                        <TableCell>{r.hits}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <Card className="p-8 text-center text-muted-foreground">
                            <p>Traffic logging not enabled or no data yet.</p>
                            <p className="text-sm mt-2">Click "Setup Tables" to initialize traffic logging, then data will appear as requests come in.</p>
                        </Card>
                    )}
                </TabsContent>

                {/* App Health Tab */}
                <TabsContent value="app-health" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Application Health</h2>
                        <Button variant="outline" size="sm" onClick={fetchBusinessHealthData} disabled={loadingBusinessHealth}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loadingBusinessHealth ? 'animate-spin' : ''}`} /> Refresh
                        </Button>
                    </div>

                    {businessHealth ? (
                        <>
                            <div className="flex items-center gap-4 p-4 border rounded-lg bg-white">
                                <div className={`text-2xl font-bold ${businessHealth.overall_status === 'healthy' ? 'text-emerald-600' : businessHealth.overall_status === 'degraded' ? 'text-amber-600' : 'text-rose-600'}`}>{businessHealth.overall_score}%</div>
                                <div>
                                    <p className="text-lg font-semibold capitalize">{businessHealth.overall_status}</p>
                                    <p className="text-muted-foreground text-sm">Overall Application Health Score</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(businessHealth.checks || {}).map(([key, check]: [string, any]) => (
                                    <Card key={key} className={check.status === 'red' ? 'border-rose-200 bg-rose-50' : check.status === 'yellow' ? 'border-amber-200 bg-amber-50' : ''}>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(check.status)}
                                                <CardTitle className="text-sm capitalize">{key.replace(/_/g, ' ')}</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">{check.message}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    ) : (
                        <Card className="p-8 text-center text-muted-foreground">Loading business health checks...</Card>
                    )}
                </TabsContent>

                {/* Alerts Tab */}
                <TabsContent value="alerts" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Health Alerts</h2>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleTakeSnapshot} disabled={takingSnapshot}>
                                {takingSnapshot ? 'Taking...' : 'Take Snapshot'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={fetchHealthAlerts} disabled={loadingAlerts}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${loadingAlerts ? 'animate-spin' : ''}`} /> Refresh
                            </Button>
                        </div>
                    </div>

                    {healthAlerts.length > 0 ? (
                        <div className="space-y-3">
                            {healthAlerts.map((alert: any) => (
                                <Card key={alert.id} className={`${alert.severity === 'critical' ? 'border-rose-300 bg-rose-50' : alert.severity === 'warning' ? 'border-amber-300 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
                                    <CardContent className="flex justify-between items-center p-4">
                                        <div className="flex items-center gap-3">
                                            {alert.severity === 'critical' ? <XCircle className="h-5 w-5 text-rose-600" /> : alert.severity === 'warning' ? <AlertTriangle className="h-5 w-5 text-amber-600" /> : <Activity className="h-5 w-5 text-blue-600" />}
                                            <div>
                                                <p className="font-semibold">{alert.message}</p>
                                                <p className="text-xs text-muted-foreground">{alert.alert_type} • {new Date(alert.created_at).toLocaleString()}</p>
                                                {alert.metric_name && <p className="text-xs mt-1"><span className="font-mono">{alert.metric_name}: {alert.metric_value}</span> (threshold: {alert.threshold})</p>}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {!alert.acknowledged && <Button size="sm" variant="outline" onClick={() => handleAcknowledgeAlert(alert.id)}>Acknowledge</Button>}
                                            <Button size="sm" variant="destructive" onClick={() => handleResolveAlert(alert.id)}>Resolve</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="p-8 text-center">
                            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-emerald-700">No Active Alerts</p>
                            <p className="text-muted-foreground">System is operating normally</p>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            <Dialog open={testEmailOpen} onOpenChange={setTestEmailOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Send Test Email</DialogTitle><DialogDescription>Enter a recipient to verify email delivery.</DialogDescription></DialogHeader>
                    <div className="py-4">
                        <input type="email" placeholder="recipient@example.com" className="w-full p-2 border rounded" value={testEmailAddress} onChange={(e) => setTestEmailAddress(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTestEmailOpen(false)}>Cancel</Button>
                        <Button onClick={handleSendTestEmail} disabled={sendingTestEmail}>{sendingTestEmail ? 'Sending...' : 'Send Test'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showDiagnostics} onOpenChange={setShowDiagnostics}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Diagnostic Analysis</DialogTitle></DialogHeader>
                    <ScrollArea className="max-h-[400px] mt-4">
                        <div className="space-y-4">
                            {findings.map(f => (
                                <div key={f.id} className={`p-4 border rounded-lg flex justify-between items-center ${f.severity === 'high' ? 'bg-rose-50 border-rose-200' : 'bg-slate-50'}`}>
                                    <div><Badge className="mr-2">{f.severity}</Badge><span className="text-sm font-medium">{f.message}</span></div>
                                    {f.can_fix && <Button size="sm" onClick={() => handleApplyFix(f)} disabled={!!fixingId}>{fixingId === f.id ? 'Fixing...' : 'Auto-Fix'}</Button>}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <DialogFooter><Button onClick={() => setShowDiagnostics(false)}>Dismiss</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// Internal component for displaying client errors
const ClientErrorsView = () => {
    const [errors, setErrors] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchErrors();
    }, []);

    const fetchErrors = async () => {
        setLoading(true);
        try {
            // Using a simple fetch implementation wrapper or importing request helper if available
            // Assuming systemApi or axios logic here, but for consistency using fetch
            const res = await fetch('/api/system/tools/client-errors').then(r => r.json());
            if (res.success) setErrors(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium">Client-Side Errors</CardTitle>
                <Button variant="outline" size="sm" onClick={fetchErrors} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Time</TableHead>
                                <TableHead className="w-[100px]">Type</TableHead>
                                <TableHead>Message</TableHead>
                                <TableHead className="w-[200px]">URL</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {errors.map((error, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-mono text-xs">{new Date(error.created_at).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${error.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {error.type}
                                        </span>
                                    </TableCell>
                                    <TableCell className="max-w-md truncate text-sm" title={error.message}>{error.message}</TableCell>
                                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground" title={error.url}>{error.url}</TableCell>
                                </TableRow>
                            ))}
                            {errors.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No client errors recorded</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default SystemHealth;
