import { useState, useEffect } from 'react';
import {
  FileTextIcon,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Calendar,
  User,
  Activity,
  Shield,
  History,
  Zap,
  CheckCircle2,
  Clock,
  Download,
  RefreshCcw,
  X,
  Layers,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { AdminOnly } from '@/components/PermissionGuard';
import AccessDenied from './AccessDenied';
import type { RBACauditEntry } from '@/types/rbac';
import SEO from '@/components/SEO';
import { Skeleton } from '@/components/ui/skeleton';

interface AuditSummary {
  total: number;
  last_24_hours: number;
  by_action: Array<{ action: string; count: number }>;
  by_target_type: Array<{ target_type: string; count: number }>;
}

export default function AuditLog() {
  const [entries, setEntries] = useState<RBACauditEntry[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '__all__',
    target_type: '__all__',
    date_from: '',
    date_to: '',
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    has_more: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const apiFilters = {
        ...filters,
        action: filters.action === '__all__' ? '' : filters.action,
        target_type: filters.target_type === '__all__' ? '' : filters.target_type,
      };
      const [entriesData, summaryData, actionsData] = await Promise.all([
        api.getAuditLog(apiFilters, pagination.limit, pagination.offset),
        api.getAuditLogSummary(),
        api.getAuditLogActions(),
      ]);
      setEntries(entriesData.data || []);
      setPagination(entriesData.pagination || { ...pagination, total: 0, has_more: false });
      setSummary(summaryData);
      setActionTypes(actionsData || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load audit log', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, offset: 0 }));
    loadData();
  };

  const clearFilters = () => {
    setFilters({ action: '__all__', target_type: '__all__', date_from: '', date_to: '' });
    setPagination(prev => ({ ...prev, offset: 0 }));
    setTimeout(() => loadData(), 0);
  };

  const loadMore = () => {
    setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
    loadData();
  };

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
    loadData();
  };

  const getActionBadgeColor = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('created') || a.includes('create')) return 'bg-green-100 text-green-800 border-green-200';
    if (a.includes('deleted') || a.includes('delete')) return 'bg-red-100 text-red-800 border-red-200';
    if (a.includes('updated') || a.includes('update') || a.includes('assignment')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (a.includes('denied') || a.includes('forbidden')) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatValue = (value: Record<string, unknown> | null) => {
    if (!value) return '-';
    return JSON.stringify(value, null, 2);
  };

  const handleExport = () => {
    toast({ title: 'Export', description: 'Exporting audit log data...' });
    // Implementation for export would go here
  };

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SEO title="Audit Log" description="Monitor system activity and changes" />

      <AdminOnly fallback={<AccessDenied message="Only administrators can view audit logs" />}>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Track all activities and system changes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadData()}
                disabled={loading}
              >
                <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                <History className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading && !summary ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{summary?.total || 0}</div>
                    <p className="text-xs text-muted-foreground">Historical records</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Last 24 Hours</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading && !summary ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{summary?.last_24_hours || 0}</div>
                    <p className="text-xs text-muted-foreground">Recent activities</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Top Action</CardTitle>
                <Zap className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                {loading && !summary ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {summary?.by_action && summary.by_action.length > 0
                        ? summary.by_action.sort((a, b) => b.count - a.count)[0].action
                        : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">Most frequent event</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Healthy</div>
                <p className="text-xs text-muted-foreground">Logging active</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Content */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                  <CardTitle>Activity Log</CardTitle>
                  <CardDescription>Detailed history of RBAC and system changes</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={filters.action}
                    onValueChange={(v) => handleFilterChange('action', v)}
                  >
                    <SelectTrigger className="w-[160px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Actions</SelectItem>
                      {actionTypes.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.target_type}
                    onValueChange={(v) => handleFilterChange('target_type', v)}
                  >
                    <SelectTrigger className="w-[160px]">
                      <Layers className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Targets</SelectItem>
                      <SelectItem value="role">Role</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="permission">Permission</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>

                  {(filters.action !== '__all__' || filters.target_type !== '__all__' || filters.date_from || filters.date_to) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-9"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  )}
                  <Button size="sm" onClick={applyFilters}>Apply</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && entries.length === 0 ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <History className="mb-2 h-10 w-10 opacity-20" />
                          <p>No audit logs found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry) => (
                      <TableRow key={entry.id} className="group">
                        <TableCell className="text-sm font-mono text-muted-foreground whitespace-nowrap">
                          {formatDate(entry.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                              <span className="font-medium">{entry.actor_name || 'System'}</span>
                              {entry.actor_email && <span className="text-[12px] text-muted-foreground">{entry.actor_email}</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getActionBadgeColor(entry.action)}>
                            {entry.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm capitalize">
                            {entry.target_type}
                            {entry.target_id && <span className="text-xs text-muted-foreground ml-1">#{entry.target_id}</span>}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            {entry.new_value ? (
                              <pre className="text-[12px] bg-muted/50 p-2 rounded-md overflow-auto max-h-24">
                                {formatValue(entry.new_value)}
                              </pre>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No detailed changes</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            {pagination.total > pagination.limit && (
              <div className="flex items-center justify-end space-x-2 p-4 border-t">
                <div className="text-sm text-muted-foreground mr-auto">
                  Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.offset - pagination.limit)}
                  disabled={pagination.offset === 0 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                  disabled={pagination.offset + pagination.limit >= pagination.total || loading}
                >
                  Next
                </Button>
              </div>
            )}
          </Card>
        </div>
      </AdminOnly>
    </div>
  );
}

