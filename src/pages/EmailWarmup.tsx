import React, { useState, useEffect } from 'react';
import {
    Flame,
    ShieldCheck,
    Activity,
    Inbox,
    AlertCircle,
    ArrowUpRight,
    TrendingUp,
    Mail,
    ShieldAlert,
    Settings as SettingsIcon,
    RefreshCw,
    Search
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { api, type DeliverabilityAccount } from '@/lib/api';

const warmupData = [
    { day: 'Mon', sent: 5, land: 4, spam: 1 },
    { day: 'Tue', sent: 12, land: 11, spam: 1 },
    { day: 'Wed', sent: 20, land: 19, spam: 1 },
    { day: 'Thu', sent: 35, land: 34, spam: 1 },
    { day: 'Fri', sent: 50, land: 48, spam: 2 },
    { day: 'Sat', sent: 75, land: 73, spam: 2 },
    { day: 'Sun', sent: 100, land: 98, spam: 2 },
];

const EmailWarmup: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [sendingAccounts, setSendingAccounts] = useState<DeliverabilityAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const accounts = await api.getDeliverabilityAccounts();
                setSendingAccounts(accounts);
            } catch (error) {
                console.error('Failed to fetch accounts:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAccounts();
    }, []);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-slate-50/50 dark:bg-slate-950/50 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0 pb-6 border-b border-indigo-100 dark:border-indigo-900/40">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-indigo-900 dark:text-indigo-100 flex items-center gap-3">
                        <Flame className="h-8 w-8 text-orange-600 animate-pulse" />
                        Email WarmUp Center
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Increase your sender reputation and ensure 100% inbox delivery.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" className="h-10 hover:bg-white dark:hover:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800">
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        Warmup Settings
                    </Button>
                    <Button className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-95">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Run Manual Sync
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Total Reachability</CardTitle>
                        <ShieldCheck className="h-5 w-5 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">98.4%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-emerald-500 font-medium flex items-center gap-1">
                                <ArrowUpRight className="h-3 w-3" /> +2.1%
                            </span>
                            since last week
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">Warmup Sent</CardTitle>
                        <Flame className="h-5 w-5 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">1,280</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-emerald-500 font-medium flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> 245 today
                            </span>
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Inbox Placement</CardTitle>
                        <Inbox className="h-5 w-5 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">96%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Targeted reputation achieved
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Health Score</CardTitle>
                        <Activity className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">92/100</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Excellent sender profile
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-full lg:col-span-4 border-none shadow-sm bg-white dark:bg-slate-900">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-indigo-600" />
                            WarmUp Trajectory
                        </CardTitle>
                        <CardDescription>Daily volume growth and placement tracking</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={warmupData}>
                                <defs>
                                    <linearGradient id="colorLand" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="land"
                                    stroke="#4f46e5"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorLand)"
                                    name="In Inbox"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="spam"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    fillOpacity={0}
                                    strokeDasharray="5 5"
                                    name="In Spam"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-full lg:col-span-3 border-none shadow-sm bg-white dark:bg-slate-900">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-amber-500" />
                            Deliverability Issues
                        </CardTitle>
                        <CardDescription>Detected problems requiring attention</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">DKIM Authentication Warning</h4>
                                <p className="text-xs text-amber-800 dark:text-amber-200 mt-1 opacity-80">
                                    marketing@domain.com has partial DKIM alignment. This may cause issues with Outlook.
                                </p>
                                <Button variant="link" className="h-auto p-0 text-xs text-amber-600 mt-1 font-semibold underline-offset-4">
                                    View Fix Instructions
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40">
                            <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
                                <ShieldAlert className="h-4 w-4 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-100">Low Positive Engagement</h4>
                                <p className="text-xs text-orange-800 dark:text-orange-200 mt-1 opacity-80">
                                    Reply rate for "Sales Account" dropped by 15%. Consider increasing warmup intensity.
                                </p>
                            </div>
                        </div>

                        <div className="pt-2">
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Health Checklist</h5>
                            <div className="space-y-2">
                                {[
                                    { label: "SPF Records Active", status: true },
                                    { label: "DMARC Policy Configured", status: true },
                                    { label: "Custom Tracking Domain", status: false },
                                    { label: "Reverse DNS Setup", status: true }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
                                        <Badge variant={item.status ? "outline" : "secondary"} className={item.status ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"}>
                                            {item.status ? "Healthy" : "Incomplete"}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Mail className="h-5 w-5 text-indigo-600" />
                                Sending Account Health
                            </CardTitle>
                            <CardDescription>Status of your connected email accounts</CardDescription>
                        </div>
                        <div className="relative w-64 group">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                placeholder="Search accounts..."
                                className="pl-9 h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-4 py-2 font-bold">Account</th>
                                    <th className="px-4 py-2 font-bold">Warmup Progress</th>
                                    <th className="px-4 py-2 font-bold text-center">Daily Volume</th>
                                    <th className="px-4 py-2 font-bold text-center">Health Score</th>
                                    <th className="px-4 py-2 font-bold text-center">Status</th>
                                    <th className="px-4 py-2 font-bold text-right text-xs">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {sendingAccounts.map((account) => (
                                    <tr key={account.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm transition-transform group-hover:scale-110 ${account.email.includes('gmail') ? 'bg-indigo-500' : 'bg-orange-500'
                                                    }`}>
                                                    {account.email[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900 dark:text-slate-100">{account.name}</div>
                                                    <div className="text-xs text-muted-foreground">{account.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 w-64">
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-[12px] font-medium text-slate-500">
                                                    <span>{account.profile?.target_volume ? Math.round(((account.last_run?.sent_volume || 0) / account.profile.target_volume) * 100) : 0}% Warmup</span>
                                                    <span>Phase {account.warmup_status === 'active' ? 'Active' : 'Paused'}</span>
                                                </div>
                                                <Progress value={account.profile?.target_volume ? Math.round(((account.last_run?.sent_volume || 0) / account.profile.target_volume) * 100) : 0} className="h-1.5 bg-slate-100 dark:bg-slate-800" />
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-center font-medium">
                                            <div className="flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-300">
                                                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                                                {account.last_run?.sent_volume || 0} / {account.warmup_daily_limit}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${account.deliverability_score >= 90
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40'
                                                : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/40'
                                                }`}>
                                                <div className={`h-1.5 w-1.5 rounded-full ${account.deliverability_score >= 90 ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                                                {account.deliverability_score}/100
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <Badge className={`${account.warmup_status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'} dark:bg-emerald-950/20 dark:border-emerald-900/40 capitalize`}>{account.warmup_status}</Badge>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600">
                                                View Details
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {isLoading && (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-3">
                                                <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 opacity-20" />
                                                <span className="text-sm font-medium">Checking deliverability metrics...</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="p-6 rounded-3xl bg-slate-900 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500">
                        <ShieldCheck className="h-24 w-24" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Deliverability Mastery</h3>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        Our AI-powered engine automatically detects spam filters and moves your emails to the inbox, simulating human behavior.
                    </p>
                    <Button variant="outline" className="rounded-full border-slate-700 hover:bg-white hover:text-slate-900 transition-all">
                        Read Best Practices
                    </Button>
                </div>

                <div className="p-6 rounded-3xl bg-indigo-600 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-500">
                        <Flame className="h-24 w-24" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Smart Warmup Boost</h3>
                    <p className="text-slate-100/70 text-sm mb-6 leading-relaxed">
                        Automatically scales your daily sending limits based on positive feedback from top-tier providers like Gmail and Outlook.
                    </p>
                    <Button variant="outline" className="rounded-full border-indigo-400/50 hover:bg-white hover:text-indigo-600 transition-all">
                        Upgrade Capacity
                    </Button>
                </div>

                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-center items-center text-center">
                    <div className="h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center mb-4">
                        <Activity className="h-8 w-8 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-bold mb-1">Help & Support</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                        Need help with your domain reputation?
                    </p>
                    <Button variant="ghost" className="text-indigo-600 hover:bg-indigo-50 font-semibold underline-offset-4 decoration-2 underline">
                        Chat with an Expert
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default EmailWarmup;
