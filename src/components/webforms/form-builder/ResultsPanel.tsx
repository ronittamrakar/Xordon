import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download, Search, Trash2, Eye, RefreshCw, FileSpreadsheet,
  SortAsc, SortDesc, X, CheckSquare, Square, ChevronLeft, ChevronRight,
  Users, TrendingUp, File, FileTextIcon, BarChart3, CheckCircle, Activity, PieChart
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ResultsPanelProps {
  form: Partial<Form>;
  fields: FormField[];
  activeSubItem?: 'insights' | 'submissions' | 'form-files' | 'reports';
  onSubItemChange?: (subItem: 'insights' | 'submissions' | 'form-files' | 'reports') => void;
  hideTabs?: boolean;
}

export default function ResultsPanel({
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

  const formId = form?.id ? String(form.id) : null;

  // Fetch submissions
  const { data: submissionsData, isLoading, refetch } = useQuery({
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

  // Sample data for preview when no real data
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

  const getFieldValue = (submission: Submission, fieldId: string | number, fieldLabel: string) => {
    const data = submission.submission_data || submission.data || {};
    // Try field ID first, then label (for backward compatibility or manually uploaded data)
    return data[fieldId] ?? data[fieldLabel] ?? '-';
  };

  // Get visible columns from form fields
  const visibleColumns = fields
    .filter(f => !['section', 'page_break', 'heading', 'paragraph', 'divider', 'spacer'].includes(f.field_type))
    .slice(0, 4);

  // Client-side filter/sort/pagination (keeps sample data usable; real data typically already paginated)
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
    ? sortedSubmissions // backend already paginated; keep order
    : sortedSubmissions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handleExport = () => {
    if (sortedSubmissions.length === 0) {
      toast.error('No submissions to export');
      return;
    }
    const dataStr = JSON.stringify(sortedSubmissions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `submissions-${formId || 'sample'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Export completed');
  };

  const renderInsights = () => (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-background rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCount}</p>
              <p className="text-sm text-muted-foreground">Total Submissions</p>
            </div>
          </div>
        </div>
        <div className="bg-background rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">87%</p>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
            </div>
          </div>
        </div>
        <div className="bg-background rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">3:45</p>
              <p className="text-sm text-muted-foreground">Avg. Time</p>
            </div>
          </div>
        </div>
        <div className="bg-background rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">+12%</p>
              <p className="text-sm text-muted-foreground">This Week</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-background rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Submission Trends</h3>
        <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Chart visualization coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFormFiles = () => (
    <div className="p-6">
      <div className="bg-background rounded-xl border p-6">
        <div className="border border-dashed rounded-lg p-12 text-center">
          <File className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <h4 className="text-base font-medium mb-1">No files uploaded yet</h4>
          <p className="text-sm text-muted-foreground">Files uploaded through your form will appear here</p>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-background rounded-xl border p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Summary Report</h4>
              <p className="text-sm text-muted-foreground mb-3">Overview of all form submissions</p>
              <Button variant="link" className="p-0 h-auto text-primary">Generate Report →</Button>
            </div>
          </div>
        </div>
        <div className="bg-background rounded-xl border p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <PieChart className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Field Analysis</h4>
              <p className="text-sm text-muted-foreground mb-3">Breakdown of responses by field</p>
              <Button variant="link" className="p-0 h-auto text-primary">Generate Report →</Button>
            </div>
          </div>
        </div>
        <div className="bg-background rounded-xl border p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Trend Report</h4>
              <p className="text-sm text-muted-foreground mb-3">Submission trends over time</p>
              <Button variant="link" className="p-0 h-auto text-primary">Generate Report →</Button>
            </div>
          </div>
        </div>
        <div className="bg-background rounded-xl border p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Download className="h-6 w-6 text-orange-600" />
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
  );

  const renderSubmissions = () => (
    <div className="flex flex-col h-full">
      {/* Sample Data Banner */}
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
        <div className="flex items-center gap-3">
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
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
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
                  <th key={field.id} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase truncate max-w-[150px]" title={field.label}>
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
                        title={String(getFieldValue(submission, field.id, field.label))}
                      >
                        {getFieldValue(submission, field.id, field.label)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submission #{selectedSubmission?.id}</DialogTitle>
            <DialogDescription>
              View detailed information about this form submission
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  selectedSubmission.status === 'completed' && 'bg-green-100 text-green-700',
                  selectedSubmission.status === 'partial' && 'bg-orange-100 text-orange-700',
                )}>
                  {selectedSubmission.status}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Submitted:</span>{' '}
                {formatDate(selectedSubmission.submitted_at || (selectedSubmission as any).created_at)}
              </div>
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium">Response Data</h4>
                {Object.entries(selectedSubmission.submission_data || selectedSubmission.data || {}).map(([key, value]) => {
                  const field = fields.find(f => String(f.id) === String(key) || f.label === key);
                  const label = field ? field.label : key;
                  return (
                    <div key={key} className="text-sm">
                      <span className="text-muted-foreground">{label}:</span>{' '}
                      <span>{String(value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
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
          <TabsContent value="insights" className="mt-0 h-full overflow-y-auto">
            {renderInsights()}
          </TabsContent>
          <TabsContent value="form-files" className="mt-0 h-full overflow-y-auto">
            {renderFormFiles()}
          </TabsContent>
          <TabsContent value="reports" className="mt-0 h-full overflow-y-auto">
            {renderReports()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

