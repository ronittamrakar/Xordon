import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Download, Search, Trash2, Eye, RefreshCw, FileSpreadsheet,
  SortAsc, SortDesc, CheckSquare, Square, ChevronLeft, ChevronRight,
  Users, TrendingUp, File, FileTextIcon, BarChart3, CheckCircle, PieChart,
  Calendar, Filter, Clock, Play, Edit, Plus, FileDown, Image,
  FileType, Video, Music, Archive, X, MoreHorizontal,
  Mail, AlertCircle, Info, ArrowUpRight, ArrowDownRight, Zap, Monitor
} from 'lucide-react';
import { toast } from 'sonner';
import { Form, FormField, Submission } from './types';
import { webformsApi } from '@/services/webformsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart as RePieChart,
  Pie,
  AreaChart,
  Area,
} from 'recharts';
import { format } from 'date-fns';

interface ResultsPanelProps {
  form: Partial<Form>;
  fields: FormField[];
  activeSubItem?: 'insights' | 'submissions' | 'form-files' | 'reports';
  onSubItemChange?: (subItem: 'insights' | 'submissions' | 'form-files' | 'reports') => void;
  hideTabs?: boolean;
}

// Helper Component: MetricCard
function MetricCard({ title, value, icon: Icon, color, trend, isUp, description }: {
  title: string;
  value: string;
  icon: any;
  color: string;
  trend?: string;
  isUp?: boolean;
  description?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  };

  return (
    <div className="bg-background rounded-xl border border-border shadow-sm p-4 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className={cn("p-2 rounded-lg transition-colors", colorMap[color] || 'bg-muted text-foreground')}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-lg",
            isUp ? "bg-green-100 text-green-700 dark:bg-green-900/30" : "bg-red-100 text-red-700 dark:bg-red-900/30"
          )}>
            {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground group-hover:text-primary transition-colors">{title}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-2xl font-black text-foreground">{value}</p>
        </div>
        {description && <p className="text-[9px] text-muted-foreground mt-1 italic">{description}</p>}
      </div>
    </div>
  );
}

export default function ResultsPanelEnhanced({
  form,
  fields,
  activeSubItem = 'submissions',
  onSubItemChange,
  hideTabs
}: ResultsPanelProps) {
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<string>('submitted_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [dateRange, setDateRange] = useState<string>('7d');
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    type: 'summary' as 'summary' | 'detail' | 'field_insights' | 'trends',
    format: 'pdf' as 'pdf' | 'csv' | 'excel',
    recipients: '',
  });

  const formId = form?.id ? String(form.id) : null;

  // Fetch submissions
  const { data: submissionsData, isLoading: submissionsLoading, refetch: refetchSubmissions } = useQuery({
    queryKey: ['webforms-submissions', formId, currentPage, pageSize, filterStatus, searchQuery],
    queryFn: async () => {
      if (!formId) return { items: [], total: 0 };
      const params: Record<string, string> = {
        page: String(currentPage),
        limit: String(pageSize),
      };
      if (filterStatus !== 'all') params.status = filterStatus;
      if (searchQuery) params.search = searchQuery;
      return webformsApi.getSubmissions(formId, params);
    },
    enabled: !!formId,
  });

  // Fetch insights
  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['webforms-insights', formId, dateRange],
    queryFn: () => webformsApi.getFormInsights(formId!, { range: dateRange }),
    enabled: !!formId && activeSubItem === 'insights',
  });

  // Fetch files
  const { data: filesData, isLoading: filesLoading, refetch: refetchFiles } = useQuery({
    queryKey: ['webforms-files', formId],
    queryFn: () => webformsApi.getFormFiles(formId!),
    enabled: !!formId && activeSubItem === 'form-files',
  });

  // Fetch reports
  const { data: reportsData, refetch: refetchReports } = useQuery({
    queryKey: ['webforms-reports', formId],
    queryFn: () => webformsApi.getFormReports(formId!),
    enabled: !!formId && activeSubItem === 'reports',
  });

  // Fetch scheduled reports
  const { data: scheduledReportsData, refetch: refetchScheduled } = useQuery({
    queryKey: ['webforms-scheduled-reports', formId],
    queryFn: () => webformsApi.getScheduledReports(formId!),
    enabled: !!formId && activeSubItem === 'reports',
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: (action: 'mark_reviewed' | 'mark_spam' | 'delete') =>
      webformsApi.bulkUpdateSubmissions(formId!, {
        submission_ids: Array.from(selectedSubmissions),
        action,
      }),
    onSuccess: (data) => {
      toast.success(`Updated ${data.updated} submissions`);
      setSelectedSubmissions(new Set());
      refetchSubmissions();
    },
    onError: () => toast.error('Failed to update submissions'),
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: (fileId: number) => webformsApi.deleteFormFile(formId!, fileId),
    onSuccess: () => {
      toast.success('File deleted');
      refetchFiles();
    },
    onError: () => toast.error('Failed to delete file'),
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: () => webformsApi.generateReport(formId!, {
      type: reportConfig.type,
      format: reportConfig.format,
      date_range: dateRange,
      recipients: reportConfig.recipients ? reportConfig.recipients.split(',').map(e => e.trim()) : undefined,
    }),
    onSuccess: (data) => {
      toast.success('Report generated');
      setShowReportDialog(false);
      refetchReports();
      if (data.data.download_url) {
        window.open(data.data.download_url, '_blank');
      }
    },
    onError: () => toast.error('Failed to generate report'),
  });

  // Sample data for preview
  const sampleSubmissions: Submission[] = [
    {
      id: 1,
      form_id: Number(formId) || 0,
      data: { 'Name': 'John Smith', 'Email': 'john@example.com', 'Message': 'Hello!' },
      status: 'completed',
      submitted_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      form_id: Number(formId) || 0,
      data: { 'Name': 'Sarah Johnson', 'Email': 'sarah@example.com', 'Message': 'Interested!' },
      status: 'completed',
      submitted_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      form_id: Number(formId) || 0,
      data: { 'Name': 'Mike Chen', 'Email': 'mike@example.com' },
      status: 'partial',
      submitted_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const rawSubmissions = (submissionsData as any)?.items || (submissionsData as any)?.data || [];
  const hasRealData = rawSubmissions.length > 0;
  const submissions: Submission[] = hasRealData ? rawSubmissions : sampleSubmissions;
  const totalFromApi = hasRealData ? (submissionsData as any)?.total : undefined;

  const handleSelectAll = () => {
    if (selectedSubmissions.size === submissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(submissions.map(s => s.id)));
    }
  };

  const handleSelectSubmission = (id: number) => {
    const newSelected = new Set(selectedSubmissions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSubmissions(newSelected);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFieldValue = (submission: Submission, fieldLabel: string) => {
    const data = submission.submission_data || submission.data || {};
    return data[fieldLabel] || '-';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.includes('pdf')) return FileType;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return Archive;
    return File;
  };

  const visibleColumns = fields
    .filter(f => !['section', 'page_break', 'heading', 'paragraph', 'divider', 'spacer'].includes(f.field_type))
    .slice(0, 4);

  const filteredSubmissions = submissions.filter((s) => {
    const matchesStatus = filterStatus === 'all' ? true : s.status === filterStatus;
    const data = s.submission_data || s.data || {};
    const matchesSearch = searchQuery
      ? Object.values(data).some((val) =>
        String(val).toLowerCase().includes(searchQuery.toLowerCase()),
      )
      : true;
    return matchesStatus && matchesSearch;
  });

  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    const dir = sortOrder === 'asc' ? 1 : -1;
    if (sortField === 'id') {
      return (a.id - b.id) * dir;
    }
    if (sortField === 'submitted_at') {
      return (
        (new Date(a.submitted_at || a.created_at || '').getTime() -
          new Date(b.submitted_at || b.created_at || '').getTime()) * dir
      );
    }
    return 0;
  });

  const totalCount = hasRealData
    ? (typeof totalFromApi === 'number' ? totalFromApi : sortedSubmissions.length)
    : sortedSubmissions.length;

  const paginatedSubmissions = hasRealData
    ? sortedSubmissions
    : sortedSubmissions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handleExport = async () => {
    if (!formId) return;
    try {
      const result = await webformsApi.exportSubmissions(formId, {
        format: 'csv',
        date_range: dateRange,
        status: filterStatus !== 'all' ? filterStatus : undefined,
      });
      if (result.download_url) {
        window.open(result.download_url, '_blank');
        toast.success('Export started');
      }
    } catch (error) {
      toast.error('Export failed');
    }
  };

  // INSIGHTS SECTION
  const renderInsights = () => {
    const metrics = insightsData?.metrics || {
      views: 1248,
      starts: 942,
      submissions: hasRealData ? totalCount : 72,
      completion_rate: 87.4,
      avg_time: 215, // seconds
      drop_off_rate: 12.6,
    };

    const trends = insightsData?.trends || [
      { date: format(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), 'MMM dd'), views: 120, submissions: 42 },
      { date: format(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), 'MMM dd'), views: 150, submissions: 58 },
      { date: format(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), 'MMM dd'), views: 180, submissions: 65 },
      { date: format(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), 'MMM dd'), views: 140, submissions: 48 },
      { date: format(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), 'MMM dd'), views: 210, submissions: 82 },
      { date: format(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), 'MMM dd'), views: 190, submissions: 74 },
      { date: format(new Date(), 'MMM dd'), views: 160, submissions: 68 },
    ];

    const deviceData = [
      { name: 'Desktop', value: 65, color: '#3b82f6' },
      { name: 'Mobile', value: 30, color: '#10b981' },
      { name: 'Tablet', value: 5, color: '#f59e0b' },
    ];

    const trafficSources = [
      { name: 'Direct', value: 45, color: '#3b82f6' },
      { name: 'Referral', value: 25, color: '#8b5cf6' },
      { name: 'Social', value: 20, color: '#ec4899' },
      { name: 'Email', value: 10, color: '#f59e0b' },
    ];

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
      <div className="p-6 space-y-8 overflow-y-auto h-full">
        {/* Date Range Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Form Performance</h3>
            <p className="text-sm text-muted-foreground">Detailed analytics and insights for your form</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" title="Refresh data">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Total Views"
            value={metrics.views.toLocaleString()}
            icon={Eye}
            color="blue"
            trend="+12.5%"
            isUp={true}
          />
          <MetricCard
            title="Starts"
            value={metrics.starts.toLocaleString()}
            icon={Play}
            color="purple"
            trend="+8.2%"
            isUp={true}
          />
          <MetricCard
            title="Submissions"
            value={metrics.submissions.toLocaleString()}
            icon={Users}
            color="green"
            trend="+15.4%"
            isUp={true}
          />
          <MetricCard
            title="Completion"
            value={`${metrics.completion_rate}%`}
            icon={CheckCircle}
            color="emerald"
            trend="+2.1%"
            isUp={true}
          />
          <MetricCard
            title="Avg. Time"
            value={`${Math.floor(metrics.avg_time / 60)}: ${(metrics.avg_time % 60).toString().padStart(2, '0')}`}
            icon={Clock}
            color="orange"
            trend="-14s"
            isUp={true}
            description="Lesser is better"
          />
          <MetricCard
            title="Drop-off"
            value={`${metrics.drop_off_rate}%`}
            icon={TrendingUp}
            color="red"
            trend="+0.5%"
            isUp={false}
            description="Higher is worse"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Trends Chart */}
          <div className="lg:col-span-2 bg-background rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Submission Trends
              </h4>
              <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Views
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" /> Submissions
                </div>
              </div>
            </div>
            <div className="p-6 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSubmits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                  <Area type="monotone" dataKey="submissions" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSubmits)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Device Mix */}
          <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" />
                Device Distribution
              </h4>
            </div>
            <div className="p-6 h-[320px] flex flex-col">
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {deviceData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-medium">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Traffic Sources & Field Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-primary" />
                Top Traffic Sources
              </h4>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={trafficSources} layout="vertical" margin={{ left: -10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} width={80} />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                    {trafficSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Field Drop-off Points
              </h4>
            </div>
            <div className="p-0">
              <div className="divide-y">
                {(insightsData?.field_insights || [
                  { field_id: '1', field_label: 'Professional Email', drop_off_rate: 24.5, avg_time: 12 },
                  { field_id: '2', field_label: 'Company Name', drop_off_rate: 18.2, avg_time: 8 },
                  { field_id: '3', field_label: 'Project Budget', drop_off_rate: 15.4, avg_time: 15 },
                  { field_id: '4', field_label: 'Technical Requirements', drop_off_rate: 12.1, avg_time: 45 },
                ]).slice(0, 5).map((field, idx) => (
                  <div key={field.field_id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{field.field_label}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">avg. {field.avg_time}s to complete</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">{field.drop_off_rate}%</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">drop-off</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // FILES SECTION
  const renderFormFiles = () => {
    const files = filesData?.data || [];
    const hasFiles = files.length > 0;

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-background border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Uploaded Files</h3>
            <Button variant="outline" size="sm" onClick={() => refetchFiles()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-auto p-6">
          {filesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !hasFiles ? (
            <div className="border border-dashed rounded-lg p-12 text-center">
              <File className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <h4 className="text-base font-medium mb-1">No files uploaded yet</h4>
              <p className="text-sm text-muted-foreground">Files uploaded through your form will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => {
                const FileIcon = getFileIcon(file.mime_type);
                return (
                  <div key={file.id} className="bg-background rounded-xl border p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate" title={file.filename}>
                          {file.filename}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Field: {file.field_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Size: {formatFileSize(file.file_size)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(file.uploaded_at)}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            <Download className="h-3 w-3 mr-1" /> Download
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive"
                            onClick={() => {
                              if (confirm('Delete this file?')) {
                                deleteFileMutation.mutate(file.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // REPORTS SECTION
  const renderReports = () => {
    const reports = reportsData?.data || [];
    const scheduledReports = scheduledReportsData?.data || [];

    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Generate Report Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Generate Report</h3>
              <Button onClick={() => setShowReportDialog(true)}>
                <Plus className="h-4 w-4 mr-2" /> New Report
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-background rounded-xl border p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setReportConfig({ ...reportConfig, type: 'summary' });
                  setShowReportDialog(true);
                }}>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Summary Report</h4>
                    <p className="text-sm text-muted-foreground mb-3">Overview of all form submissions</p>
                    <Button variant="link" className="p-0 h-auto text-primary">Generate →</Button>
                  </div>
                </div>
              </div>
              <div className="bg-background rounded-xl border p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setReportConfig({ ...reportConfig, type: 'field_insights' });
                  setShowReportDialog(true);
                }}>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <PieChart className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Field Analysis</h4>
                    <p className="text-sm text-muted-foreground mb-3">Breakdown of responses by field</p>
                    <Button variant="link" className="p-0 h-auto text-primary">Generate →</Button>
                  </div>
                </div>
              </div>
              <div className="bg-background rounded-xl border p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setReportConfig({ ...reportConfig, type: 'trends' });
                  setShowReportDialog(true);
                }}>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Trend Report</h4>
                    <p className="text-sm text-muted-foreground mb-3">Submission trends over time</p>
                    <Button variant="link" className="p-0 h-auto text-primary">Generate →</Button>
                  </div>
                </div>
              </div>
              <div className="bg-background rounded-xl border p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={handleExport}>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <FileDown className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Export Data</h4>
                    <p className="text-sm text-muted-foreground mb-3">Download in CSV, Excel, or JSON</p>
                    <Button variant="link" className="p-0 h-auto text-primary">Export Now →</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Reports */}
          {reports.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Reports</h3>
              <div className="space-y-2">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 bg-background rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileTextIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{report.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {report.type} • {formatDate(report.created_at)}
                        </p>
                      </div>
                    </div>
                    {report.download_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(report.download_url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" /> Download
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduled Reports */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Scheduled Reports</h3>
              <Button variant="outline" onClick={() => setShowScheduleDialog(true)}>
                <Calendar className="h-4 w-4 mr-2" /> Schedule Report
              </Button>
            </div>
            {scheduledReports.length === 0 ? (
              <div className="border border-dashed rounded-lg p-8 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No scheduled reports yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {scheduledReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 bg-background rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{report.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {report.frequency} • Next: {formatDate(report.next_run)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        report.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      )}>
                        {report.enabled ? 'Active' : 'Paused'}
                      </span>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // SUBMISSIONS SECTION
  const renderSubmissions = () => (
    <div className="flex flex-col h-full">
      {!hasRealData && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900 px-4 py-2">
          <p className="text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <span className="bg-amber-200 dark:bg-amber-800 px-2 py-0.5 rounded-full text-xs font-medium">Sample Data</span>
            Showing preview data. Real submissions will appear once your form receives responses.
          </p>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search submissions..."
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
            </SelectContent>
          </Select>
          {selectedSubmissions.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" /> Bulk Actions ({selectedSubmissions.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => bulkUpdateMutation.mutate('mark_reviewed')}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Mark as Reviewed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkUpdateMutation.mutate('mark_spam')}>
                  <X className="h-4 w-4 mr-2" /> Mark as Spam
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => {
                    if (confirm(`Delete ${selectedSubmissions.size} submissions?`)) {
                      bulkUpdateMutation.mutate('delete');
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="outline" size="icon" onClick={() => refetchSubmissions()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {submissionsLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr className="border-b">
                <th className="px-3 py-2 text-left w-10">
                  <button onClick={handleSelectAll} className="text-muted-foreground hover:text-foreground">
                    {selectedSubmissions.size === submissions.length && submissions.length > 0
                      ? <CheckSquare className="h-4 w-4 text-primary" />
                      : <Square className="h-4 w-4" />
                    }
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                  <button onClick={() => handleSort('id')} className="flex items-center gap-1 hover:text-foreground">
                    ID {sortField === 'id' && (sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />)}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                  <button onClick={() => handleSort('submitted_at')} className="flex items-center gap-1 hover:text-foreground">
                    Submitted {sortField === 'submitted_at' && (sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />)}
                  </button>
                </th>
                {visibleColumns.map((field) => (
                  <th key={field.id} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase truncate max-w-[150px]">
                    {field.label}
                  </th>
                ))}
                <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={5 + visibleColumns.length} className="px-3 py-16 text-center">
                    <FileSpreadsheet className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                    <h3 className="text-base font-semibold mb-1">No submissions yet</h3>
                    <p className="text-sm text-muted-foreground">Submissions will appear here once users fill out your form</p>
                  </td>
                </tr>
              ) : (
                paginatedSubmissions.map((submission) => (
                  <tr key={submission.id} className={cn('hover:bg-muted/50', selectedSubmissions.has(submission.id) && 'bg-primary/5')}>
                    <td className="px-3 py-2">
                      <button onClick={() => handleSelectSubmission(submission.id)} className="text-muted-foreground hover:text-foreground">
                        {selectedSubmissions.has(submission.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-3 py-2 font-medium">#{submission.id}</td>
                    <td className="px-3 py-2">
                      <span className={cn(
                        'px-2 py-0.5 text-xs font-medium rounded-full',
                        submission.status === 'completed' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                        submission.status === 'partial' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                        submission.status === 'spam' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                        submission.status === 'pending' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                      )}>
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">
                      {formatDate(submission.submitted_at || (submission as any).created_at)}
                    </td>
                    {visibleColumns.map((field) => (
                      <td
                        key={field.id}
                        className="px-3 py-2 truncate max-w-[150px]"
                        title={String(getFieldValue(submission, field.label))}
                      >
                        {getFieldValue(submission, field.label)}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedSubmission(submission)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="bg-background border-t px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Show:</span>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(parseInt(v)); setCurrentPage(1); }}>
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs px-2">{currentPage} / {totalPages}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Submission Detail Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0">
          <DialogHeader className="p-6 bg-muted/30 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5 text-primary" />
                  Submission #{selectedSubmission?.id}
                </DialogTitle>
                <DialogDescription className="text-xs mt-1">
                  Submitted on {selectedSubmission && formatDate(selectedSubmission.submitted_at || (selectedSubmission as any).created_at)}
                </DialogDescription>
              </div>
              <div className={cn(
                'px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5',
                selectedSubmission?.status === 'completed'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30'
              )}>
                <div className={cn('w-1.5 h-1.5 rounded-full', selectedSubmission?.status === 'completed' ? 'bg-green-500' : 'bg-orange-500')} />
                {selectedSubmission?.status}
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Main Participant Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Meta Data */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Info className="h-3 w-3" /> Metadata
                  </h4>
                  <div className="space-y-3 bg-muted/20 p-4 rounded-xl border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Source URL</span>
                      <span className="font-medium truncate max-w-[150px]">{form.settings?.domain || 'xordon.app/f/' + form.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Device</span>
                      <span className="font-medium">Desktop (Chrome)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IP Address</span>
                      <span className="font-medium">192.168.1.***</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions in detail */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Zap className="h-3 w-3" /> Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="sm" className="h-10 text-xs font-bold">
                      <Mail className="h-4 w-4 mr-2" /> Reply
                    </Button>
                    <Button variant="outline" size="sm" className="h-10 text-xs font-bold">
                      <Download className="h-4 w-4 mr-2" /> PDF
                    </Button>
                    <Button variant="outline" size="sm" className="h-10 text-xs font-bold">
                      <Archive className="h-4 w-4 mr-2" /> Archive
                    </Button>
                    <Button variant="outline" size="sm" className="h-10 text-xs font-bold text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  </div>
                </div>
              </div>

              {/* Form Response Data */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <CheckSquare className="h-3 w-3" /> Response Data
                </h4>
                <div className="divide-y bg-background rounded-xl border overflow-hidden">
                  {selectedSubmission && (() => {
                    const data = selectedSubmission.submission_data || selectedSubmission.data || {};
                    // Group data by field label if possible
                    return Object.entries(data).map(([key, value]) => {
                      // Try to find field definition by ID or label
                      const fieldDef = fields.find(f => f.id === key || f.label === key);
                      const displayLabel = fieldDef?.label || key;

                      return (
                        <div key={key} className="p-4 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6 hover:bg-muted/30 transition-colors">
                          <div className="sm:w-1/3 min-w-0">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{displayLabel}</Label>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold break-words leading-relaxed">
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 bg-muted/30 border-t flex items-center justify-between sm:justify-between px-6">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">End of submission data</span>
            <Button variant="default" className="font-bold" onClick={() => setSelectedSubmission(null)}>
              Close Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Generate Report Dialog
  const ReportDialog = () => (
    <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogDescription>Create a custom report for your form submissions</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={reportConfig.type} onValueChange={(v: any) => setReportConfig({ ...reportConfig, type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary Report</SelectItem>
                <SelectItem value="detail">Detailed Submissions</SelectItem>
                <SelectItem value="field_insights">Field Insights</SelectItem>
                <SelectItem value="trends">Trend Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={reportConfig.format} onValueChange={(v: any) => setReportConfig({ ...reportConfig, format: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Email Recipients (optional)</Label>
            <Input
              placeholder="email1@example.com, email2@example.com"
              value={reportConfig.recipients}
              onChange={(e) => setReportConfig({ ...reportConfig, recipients: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowReportDialog(false)}>Cancel</Button>
          <Button onClick={() => generateReportMutation.mutate()} disabled={generateReportMutation.isPending}>
            {generateReportMutation.isPending ? 'Generating...' : 'Generate Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Schedule Report Dialog
  const ScheduleReportDialog = () => (
    <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Automated Report</DialogTitle>
          <DialogDescription>Setup a recurring report to be sent automatically</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Report Name</Label>
            <Input placeholder="Weekly Submission Summary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select defaultValue="weekly">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select defaultValue="summary">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="detail">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Recipients</Label>
            <Input placeholder="team@example.com" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
          <Button className="font-bold">Save Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeSubItem} onValueChange={(v) => onSubItemChange?.(v as any)} className="flex-1 flex flex-col">
        {!hideTabs && (
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
            <TabsTrigger
              value="submissions"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <Users className="h-4 w-4 mr-2" /> Submissions
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <TrendingUp className="h-4 w-4 mr-2" /> Insights
            </TabsTrigger>
            <TabsTrigger
              value="form-files"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <File className="h-4 w-4 mr-2" /> Files
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <FileTextIcon className="h-4 w-4 mr-2" /> Reports
            </TabsTrigger>
          </TabsList>
        )}

        <div className="flex-1 overflow-hidden">
          <TabsContent value="submissions" className="mt-0 h-full">
            {renderSubmissions()}
          </TabsContent>
          <TabsContent value="insights" className="mt-0 h-full">
            {renderInsights()}
          </TabsContent>
          <TabsContent value="form-files" className="mt-0 h-full">
            {renderFormFiles()}
          </TabsContent>
          <TabsContent value="reports" className="mt-0 h-full">
            {renderReports()}
          </TabsContent>
        </div>
      </Tabs>

      <ReportDialog />
      <ScheduleReportDialog />
    </div>
  );
}

