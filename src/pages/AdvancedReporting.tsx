import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileTextIcon, Plus, Download, Calendar, Mail, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { format } from 'date-fns';

const AdvancedReporting: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    name: '',
    report_type: 'contacts',
    frequency: 'weekly',
    recipients: '',
    format: 'pdf',
  });

  const { data: scheduledReports = [] } = useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: async () => {
      const response = await api.get('/reports/scheduled');
      return response.data;
    },
  });

  const { data: exports = [] } = useQuery({
    queryKey: ['report-exports'],
    queryFn: async () => {
      const response = await api.get('/reports/exports', { params: { limit: 50 } });
      return response.data;
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/reports/scheduled', {
        ...data,
        recipients: data.recipients.split(',').map((e: string) => e.trim()),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      setIsCreateScheduleOpen(false);
      setScheduleData({ name: '', report_type: 'contacts', frequency: 'weekly', recipients: '', format: 'pdf' });
      toast.success('Scheduled report created');
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/reports/scheduled/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast.success('Scheduled report deleted');
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (data: { report_type: string; format: string }) => {
      const response = await api.post('/reports/export', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-exports'] });
      toast.success('Report export started');
    },
  });

  const handleCreateSchedule = () => {
    if (!scheduleData.name || !scheduleData.recipients) {
      toast.error('Please fill all required fields');
      return;
    }
    createScheduleMutation.mutate(scheduleData);
  };

  const handleExport = (reportType: string, format: string) => {
    exportMutation.mutate({ report_type: reportType, format });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight">
            Advanced Reporting
          </h1>
          <p className="text-muted-foreground">Schedule reports and export data</p>
        </div>
        <Button onClick={() => setIsCreateScheduleOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Report
        </Button>
      </div>

      <Tabs defaultValue="scheduled">
        <TabsList>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="exports">Export History</TabsTrigger>
          <TabsTrigger value="quick">Quick Export</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>Automatically generated and emailed reports</CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No scheduled reports</p>
                  <Button onClick={() => setIsCreateScheduleOpen(true)} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Schedule
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledReports.map((report: any) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{report.name}</h4>
                          <Badge variant="outline">{report.frequency}</Badge>
                          <Badge variant="outline">{report.format.toUpperCase()}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Report Type: {report.report_type} • Recipients: {report.recipients?.length || 0}
                        </p>
                        {report.last_sent_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last sent: {format(new Date(report.last_sent_at), 'MMM d, yyyy HH:mm')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={report.is_active ? 'default' : 'secondary'}>
                          {report.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteScheduleMutation.mutate(report.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exports" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Type</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>File Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No exports yet
                    </TableCell>
                  </TableRow>
                ) : (
                  exports.map((exp: any) => (
                    <TableRow key={exp.id}>
                      <TableCell className="font-medium">{exp.report_type}</TableCell>
                      <TableCell>{exp.format.toUpperCase()}</TableCell>
                      <TableCell>{formatFileSize(exp.file_size)}</TableCell>
                      <TableCell>{getStatusBadge(exp.status)}</TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(exp.created_at), 'MMM d, HH:mm')}
                      </TableCell>
                      <TableCell>
                        {exp.status === 'completed' && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="quick" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contacts Report</CardTitle>
                <CardDescription>Export all contacts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleExport('contacts', 'csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleExport('contacts', 'excel')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campaigns Report</CardTitle>
                <CardDescription>Export campaign data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleExport('campaigns', 'csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleExport('campaigns', 'pdf')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue Report</CardTitle>
                <CardDescription>Export revenue data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleExport('revenue', 'csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleExport('revenue', 'excel')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Schedule Dialog */}
      <Dialog open={isCreateScheduleOpen} onOpenChange={setIsCreateScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Report</DialogTitle>
            <DialogDescription>Set up automatic report generation and delivery</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Report Name *</Label>
              <Input
                value={scheduleData.name}
                onChange={(e) => setScheduleData({ ...scheduleData, name: e.target.value })}
                placeholder="e.g., Weekly Contacts Report"
              />
            </div>
            <div className="space-y-2">
              <Label>Report Type *</Label>
              <Select
                value={scheduleData.report_type}
                onValueChange={(v) => setScheduleData({ ...scheduleData, report_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contacts">Contacts</SelectItem>
                  <SelectItem value="campaigns">Campaigns</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frequency *</Label>
              <Select
                value={scheduleData.frequency}
                onValueChange={(v: any) => setScheduleData({ ...scheduleData, frequency: v })}
              >
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
              <Label>Format *</Label>
              <Select
                value={scheduleData.format}
                onValueChange={(v: any) => setScheduleData({ ...scheduleData, format: v })}
              >
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
              <Label>Recipients (comma-separated) *</Label>
              <Input
                value={scheduleData.recipients}
                onChange={(e) => setScheduleData({ ...scheduleData, recipients: e.target.value })}
                placeholder="email1@example.com, email2@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateScheduleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSchedule} disabled={createScheduleMutation.isPending}>
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancedReporting;

