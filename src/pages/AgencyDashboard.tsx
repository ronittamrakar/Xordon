/**
 * Agency Dashboard
 * Overview of agency health, sub-accounts, and team activity
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Building2, Users, Layers, TrendingUp, Activity, ArrowUpRight,
    Plus, Settings, RefreshCw, Mail, MessageSquare, Phone,
    Clock, CheckCircle, AlertCircle, ChevronRight, Crown, Shield
} from 'lucide-react';
import { useTenantOptional } from '@/contexts/TenantContext';

interface DashboardStats {
    subaccounts: { total: number; active: number; };
    teamMembers: { total: number; active: number; pending: number; };
    usage: {
        emails_sent: number;
        sms_sent: number;
        calls_made: number;
        contacts: number;
    };
    recentActivity: Array<{
        id: number;
        action: string;
        actor_name: string;
        details: string;
        created_at: string;
    }>;
}

export default function AgencyDashboard() {
    const tenant = useTenantOptional();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, [tenant?.currentAgency?.id]);

    async function loadDashboardData() {
        if (!tenant?.currentAgency) return;

        try {
            setLoading(true);
            const agencyId = tenant.currentAgency.id;
            const token = localStorage.getItem('auth_token');
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch multiple endpoints in parallel
            const [subaccountsRes, teamRes, auditRes] = await Promise.all([
                fetch(`/api/mt/agencies/${agencyId}/subaccounts`, { headers }),
                fetch(`/api/mt/agencies/${agencyId}/team`, { headers }),
                fetch(`/api/mt/agencies/${agencyId}/audit?limit=5`, { headers }),
            ]);

            const subaccounts = await subaccountsRes.json();
            const team = await teamRes.json();
            const audit = await auditRes.json();

            setStats({
                subaccounts: {
                    total: subaccounts.items?.length || 0,
                    active: subaccounts.items?.filter((s: any) => s.status === 'active').length || 0,
                },
                teamMembers: {
                    total: team.total || 0,
                    active: (team.items || []).filter((m: any) => m.status === 'active').length,
                    pending: team.pending_invites || 0,
                },
                usage: {
                    emails_sent: 12450,
                    sms_sent: 3200,
                    calls_made: 890,
                    contacts: 45600,
                },
                recentActivity: audit.items || [],
            });
        } catch (err) {
            console.error('Failed to load dashboard:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!tenant?.currentAgency) {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="py-12 text-center">
                        <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Agency Selected</h3>
                        <p className="text-muted-foreground">Select an agency from the sidebar to view the dashboard.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { currentAgency, isAgencyOwner, isAgencyAdmin, subaccountLabel, subaccountLabelPlural } = tenant;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">
                            {currentAgency.name}
                            <Badge variant="outline" className="ml-2 text-xs">
                                {currentAgency.role}
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground">Agency Dashboard</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isAgencyAdmin && (
                        <Button asChild>
                            <Link to="/agency/sub-accounts">
                                <Plus className="w-4 h-4 mr-2" />
                                New {subaccountLabel}
                            </Link>
                        </Button>
                    )}
                    <Button variant="outline" asChild>
                        <Link to="/agency/settings">
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{subaccountLabelPlural}</CardTitle>
                        <Layers className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.subaccounts.total || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-green-500">{stats?.subaccounts.active}</span> active
                        </p>
                        <Link to="/agency/sub-accounts" className="text-xs text-primary flex items-center mt-2 hover:underline">
                            Manage <ChevronRight className="w-3 h-3 ml-1" />
                        </Link>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.teamMembers.total || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.teamMembers.pending ? (
                                <span className="text-yellow-500">{stats.teamMembers.pending} pending</span>
                            ) : (
                                <span className="text-green-500">All active</span>
                            )}
                        </p>
                        <Link to="/agency/settings" className="text-xs text-primary flex items-center mt-2 hover:underline">
                            Team tab <ChevronRight className="w-3 h-3 ml-1" />
                        </Link>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.usage.contacts.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Across all sub-accounts</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Activity</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {((stats?.usage.emails_sent || 0) + (stats?.usage.sms_sent || 0)).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Messages sent</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Usage Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Channel Usage</CardTitle>
                        <CardDescription>Monthly activity by channel</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm">Email</span>
                                </div>
                                <span className="text-sm font-medium">{stats?.usage.emails_sent.toLocaleString()}</span>
                            </div>
                            <Progress value={75} className="h-2" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-green-500" />
                                    <span className="text-sm">SMS</span>
                                </div>
                                <span className="text-sm font-medium">{stats?.usage.sms_sent.toLocaleString()}</span>
                            </div>
                            <Progress value={35} className="h-2" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-purple-500" />
                                    <span className="text-sm">Calls</span>
                                </div>
                                <span className="text-sm font-medium">{stats?.usage.calls_made.toLocaleString()}</span>
                            </div>
                            <Progress value={15} className="h-2" />
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest actions in your agency</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats?.recentActivity.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground">
                                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No recent activity</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {stats?.recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                            {activity.action.includes('invite') && <Users className="h-4 w-4" />}
                                            {activity.action.includes('create') && <Plus className="h-4 w-4" />}
                                            {!activity.action.includes('invite') && !activity.action.includes('create') && (
                                                <Activity className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{activity.actor_name}</p>
                                            <p className="text-xs text-muted-foreground">{activity.action.replace(/_/g, ' ')}</p>
                                        </div>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(activity.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isAgencyAdmin && (
                            <Link
                                to="/agency/settings?tab=audit"
                                className="flex items-center justify-center gap-1 text-sm text-primary mt-4 hover:underline"
                            >
                                View full audit log <ArrowUpRight className="w-3 h-3" />
                            </Link>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Sub-accounts Quick View */}
            {(stats?.subaccounts.total || 0) > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{subaccountLabelPlural}</CardTitle>
                            <CardDescription>Quick access to {subaccountLabelPlural.toLowerCase()}</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link to="/agency/sub-accounts">
                                View All <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {tenant.subaccounts.slice(0, 6).map((sub) => (
                                <Card
                                    key={sub.id}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => tenant.switchToSubaccount(sub.id)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                                                    <span className="text-lg font-semibold text-primary">
                                                        {sub.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">{sub.name}</p>
                                                    <p className="text-xs text-muted-foreground">{sub.industry || 'No industry'}</p>
                                                </div>
                                            </div>
                                            <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                                                {sub.status}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {(stats?.subaccounts.total || 0) === 0 && (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                        <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No {subaccountLabelPlural} Yet</h3>
                        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                            Create your first {subaccountLabel.toLowerCase()} to start managing client businesses
                        </p>
                        {isAgencyAdmin && (
                            <Button asChild>
                                <Link to="/agency/sub-accounts">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create {subaccountLabel}
                                </Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
