import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileTextIcon,
  Reply,
  Trash2,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  User,
  Mail,
  Globe,
  MoreHorizontal,
  Star,
  StarOff,
  CheckCircle,
  Circle,
  Inbox,
  Archive,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MailOpen,
  Clock,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AppLayout } from '@/components/layout/AppLayout';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { api, Form, FormResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FormResponseWithForm extends FormResponse {
  form_name: string;
  form_title: string;
  form_group_id?: string;
  is_read?: boolean;
  is_starred?: boolean;
}

export default function FormReplies() {
  const [responses, setResponses] = useState<FormResponseWithForm[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<FormResponseWithForm | null>(null);
  const [selectedForm, setSelectedForm] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Enhanced state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [filterReadStatus, setFilterReadStatus] = useState<'all' | 'read' | 'unread'>('all');
  const [filterStarred, setFilterStarred] = useState<boolean | null>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Reply composition state
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');

  const fetchForms = useCallback(async () => {
    try {
      const forms = await api.getForms();
      setForms(forms);
      return forms;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch forms',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  const fetchAllResponses = useCallback(async () => {
    setLoading(true);
    try {
      const params: Parameters<typeof api.getAllFormResponses>[0] = {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      };

      if (selectedForm !== 'all') params.form_id = selectedForm;
      if (searchTerm) params.q = searchTerm;
      if (filterReadStatus === 'read') params.is_read = true;
      if (filterReadStatus === 'unread') params.is_read = false;
      if (filterStarred !== null) params.is_starred = filterStarred;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const result = await api.getAllFormResponses(params);
      setResponses(result.items as FormResponseWithForm[]);
      setTotalCount(result.total);
    } catch (error) {
      console.error('Failed to fetch responses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch responses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedForm, searchTerm, filterReadStatus, filterStarred, dateFrom, dateTo, currentPage, pageSize, toast]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  useEffect(() => {
    fetchAllResponses();
  }, [fetchAllResponses]);

  const handleFormChange = (formId: string) => {
    setSelectedForm(formId);
    setCurrentPage(1);
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === responses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(responses.map(r => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Bulk action handlers
  const handleBulkAction = async (action: 'mark_read' | 'mark_unread' | 'star' | 'unstar' | 'delete') => {
    if (selectedIds.size === 0) return;

    try {
      await api.bulkUpdateFormResponses(Array.from(selectedIds), action);
      toast({
        title: 'Success',
        description: `${selectedIds.size} response(s) updated`,
      });
      setSelectedIds(new Set());
      fetchAllResponses();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update responses',
        variant: 'destructive',
      });
    }
  };

  // Single response actions
  const toggleStar = async (response: FormResponseWithForm, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.updateFormResponse(response.id, { is_starred: !response.is_starred });
      setResponses(prev => prev.map(r =>
        r.id === response.id ? { ...r, is_starred: !r.is_starred } : r
      ));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update response',
        variant: 'destructive',
      });
    }
  };

  const markAsRead = async (response: FormResponseWithForm) => {
    if (response.is_read) return;
    try {
      await api.updateFormResponse(response.id, { is_read: true });
      setResponses(prev => prev.map(r =>
        r.id === response.id ? { ...r, is_read: true } : r
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const deleteResponse = async (response: FormResponseWithForm) => {
    try {
      await api.deleteFormResponse(response.id);
      toast({
        title: 'Success',
        description: 'Response deleted',
      });
      fetchAllResponses();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete response',
        variant: 'destructive',
      });
    }
  };

  const viewResponse = (response: FormResponseWithForm) => {
    setSelectedResponse(response);
    setIsViewDialogOpen(true);
    markAsRead(response);
  };

  const clearFilters = () => {
    setFilterReadStatus('all');
    setFilterStarred(null);
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
    setSelectedForm('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = filterReadStatus !== 'all' || filterStarred !== null || dateFrom || dateTo;

  const replyToResponse = (response: FormResponseWithForm) => {
    setSelectedResponse(response);
    setReplySubject(`Re: ${response.form_title || 'Form Submission'}`);
    setReplyBody('');
    setIsReplyDialogOpen(true);
  };

  const sendReply = async () => {
    if (!selectedResponse || !replySubject || !replyBody) {
      toast({
        title: 'Error',
        description: 'Please fill in subject and message',
        variant: 'destructive',
      });
      return;
    }

    try {
      const recipientEmail = selectedResponse.response_data.email ||
        Object.values(selectedResponse.response_data).find(val =>
          typeof val === 'string' && val.includes('@')
        );

      if (!recipientEmail) {
        toast({
          title: 'Error',
          description: 'No email address found in the response',
          variant: 'destructive',
        });
        return;
      }

      await api.post('/email-replies/send', {
        to_email: recipientEmail,
        subject: replySubject,
        body: replyBody,
      });

      toast({
        title: 'Success',
        description: 'Reply sent successfully',
      });

      setIsReplyDialogOpen(false);
      setReplySubject('');
      setReplyBody('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send reply',
        variant: 'destructive',
      });
    }
  };

  const exportResponses = () => {
    if (!responses.length) {
      toast({
        title: 'No Data',
        description: 'No responses to export',
        variant: 'destructive',
      });
      return;
    }

    const csvContent = generateCSV(responses);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `form_responses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSV = (responses: FormResponseWithForm[]) => {
    const headers = ['Form Name', 'Submitted At', 'Response Data', 'IP Address'];
    const rows = responses.map(response => [
      response.form_name,
      new Date(response.created_at).toLocaleString(),
      JSON.stringify(response.response_data),
      response.ip_address || ''
    ]);

    return [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const getEmailFromResponse = (responseData: Record<string, string | number | boolean>) => {
    return responseData.email ||
      Object.values(responseData).find(val =>
        typeof val === 'string' && val.includes('@')
      );
  };

  const getResponsePreview = (responseData: Record<string, string | number | boolean>) => {
    const entries = Object.entries(responseData);
    if (entries.length === 0) return 'No data';

    const preview = entries
      .slice(0, 2)
      .map(([key, value]) => `${key}: ${String(value).substring(0, 30)}${String(value).length > 30 ? '...' : ''}`)
      .join(', ');

    return entries.length > 2 ? `${preview}...` : preview;
  };

  // Pagination
  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading && responses.length === 0) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Form Replies</h1>
            <p className="text-muted-foreground">
              {totalCount} total response{totalCount !== 1 ? 's' : ''} across your forms
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchAllResponses} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button onClick={exportResponses} disabled={!responses.length}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search responses..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>

          <Select value={selectedForm} onValueChange={handleFormChange}>
            <SelectTrigger className="w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Forms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Forms</SelectItem>
              {forms.map((form) => (
                <SelectItem key={form.id} value={form.id.toString()}>
                  {form.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterReadStatus} onValueChange={(v) => { setFilterReadStatus(v as typeof filterReadStatus); setCurrentPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>

          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn(hasActiveFilters && "border-blue-500 bg-blue-50")}>
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                More Filters
                {hasActiveFilters && <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">!</Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="font-medium">Advanced Filters</div>

                <div className="space-y-2">
                  <Label>Starred</Label>
                  <Select
                    value={filterStarred === null ? 'all' : filterStarred ? 'starred' : 'unstarred'}
                    onValueChange={(v) => {
                      setFilterStarred(v === 'all' ? null : v === 'starred');
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="starred">Starred Only</SelectItem>
                      <SelectItem value="unstarred">Unstarred Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedIds.size} selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('mark_read')}>
                <MailOpen className="h-4 w-4 mr-1" />
                Mark Read
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('mark_unread')}>
                <Mail className="h-4 w-4 mr-1" />
                Mark Unread
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('star')}>
                <Star className="h-4 w-4 mr-1" />
                Star
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('delete')} className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="ml-auto">
              Clear Selection
            </Button>
          </div>
        )}

        {/* Responses Table */}
        {responses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Inbox className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No form responses</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {hasActiveFilters
                  ? 'No responses match your current filters. Try adjusting or clearing them.'
                  : selectedForm === 'all'
                    ? 'No responses have been submitted to any of your forms yet'
                    : 'No responses have been submitted to this form yet'
                }
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.size === responses.length && responses.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Response Preview</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.map((response) => (
                  <TableRow
                    key={response.id}
                    className={cn(
                      "cursor-pointer transition-colors",
                      !response.is_read && "bg-blue-50/50 dark:bg-blue-900/10 font-medium",
                      selectedIds.has(response.id) && "bg-blue-100 dark:bg-blue-900/30"
                    )}
                  >
                    <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(response.id)}
                        onCheckedChange={() => toggleSelect(response.id)}
                      />
                    </TableCell>
                    <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => toggleStar(response, e)} className="hover:scale-110 transition-transform">
                        {response.is_starred ? (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <Star className="h-4 w-4 text-gray-300 hover:text-yellow-500" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell onClick={() => viewResponse(response)} className="py-2">
                      <div className="flex items-center gap-2">
                        {!response.is_read && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                        <div>
                          <div className={cn("text-sm", !response.is_read && "font-semibold")}>{response.form_name}</div>
                          <div className="text-xs text-muted-foreground">{response.form_title}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => viewResponse(response)} className="py-2">
                      <div className="max-w-xs">
                        <div className="text-sm text-muted-foreground truncate">
                          {getResponsePreview(response.response_data)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Object.keys(response.response_data).length} fields
                        </span>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => viewResponse(response)} className="py-2">
                      {getEmailFromResponse(response.response_data) ? (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-green-500" />
                          <span className="text-sm truncate max-w-[150px]">{String(getEmailFromResponse(response.response_data))}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No email</span>
                      )}
                    </TableCell>
                    <TableCell onClick={() => viewResponse(response)} className="py-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{formatDate(response.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => viewResponse(response)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => replyToResponse(response)}
                            disabled={!getEmailFromResponse(response.response_data)}
                          >
                            <Reply className="mr-2 h-4 w-4" />
                            Reply
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleStar(response, { stopPropagation: () => { } } as React.MouseEvent)}>
                            {response.is_starred ? (
                              <>
                                <StarOff className="mr-2 h-4 w-4" />
                                Unstar
                              </>
                            ) : (
                              <>
                                <Star className="mr-2 h-4 w-4" />
                                Star
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteResponse(response)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* View Response Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedResponse?.form_title}</DialogTitle>
              <DialogDescription>
                Form: {selectedResponse?.form_name} • Submitted: {selectedResponse && formatDate(selectedResponse.created_at)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                {selectedResponse?.response_data && Object.entries(selectedResponse.response_data).map(([key, value]) => (
                  <div key={key} className="border-b border-gray-200 dark:border-gray-600 pb-2 last:border-b-0">
                    <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">{key}</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{String(value)}</div>
                  </div>
                ))}
              </div>

              {selectedResponse?.ip_address && (
                <div className="text-sm text-gray-600">
                  <strong>IP Address:</strong> {selectedResponse.ip_address}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => selectedResponse && replyToResponse(selectedResponse)}
                  disabled={!selectedResponse || !getEmailFromResponse(selectedResponse.response_data)}
                >
                  <Reply className="mr-2 h-4 w-4" />
                  Reply
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reply Dialog */}
        <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reply to Form Submission</DialogTitle>
              <DialogDescription>
                Send a reply to the person who submitted this form
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="reply-subject">Subject</Label>
                <Input
                  id="reply-subject"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  placeholder="Enter email subject"
                />
              </div>
              <div>
                <Label htmlFor="reply-body">Message</Label>
                <Textarea
                  id="reply-body"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Enter your reply message"
                  rows={6}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={sendReply}>
                  <Reply className="mr-2 h-4 w-4" />
                  Send Reply
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

