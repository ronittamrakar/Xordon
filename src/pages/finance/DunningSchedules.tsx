import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BellRing, Plus, Trash2, Send, AlertCircle, Edit, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { format } from 'date-fns';

import SEO from '@/components/SEO';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DunningSchedule {
  id: number;
  workspace_id: number;
  name: string;
  days_after_due: number;
  email_template_id?: number;
  sms_template_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface OverdueInvoice {
  id: number;
  invoice_number: string;
  contact_first_name?: string;
  contact_last_name?: string;
  email?: string;
  phone?: string;
  total: number;
  amount_due: number;
  due_date: string;
  days_overdue: number;
  dunning_count: number;
  last_dunning_sent_at?: string;
}

const DunningSchedules: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DunningSchedule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    days_after_due: 7,
    email_template_id: '' as string | number,
    sms_template_id: '' as string | number,
    is_active: true,
  });

  const {
    data: schedules = [] as DunningSchedule[],
    isLoading,
    isError
  } = useQuery<DunningSchedule[]>({
    queryKey: ['dunning-schedules'],
    queryFn: async (): Promise<DunningSchedule[]> => {
      const response = await api.get('/dunning/schedules');
      return (response as any)?.data || response || [];
    },
  });

  const { data: overdueInvoices = [] as OverdueInvoice[] } = useQuery<OverdueInvoice[]>({
    queryKey: ['overdue-invoices'],
    queryFn: async (): Promise<OverdueInvoice[]> => {
      const response = await api.get('/dunning/overdue-invoices');
      return (response as any)?.data || response || [];
    },
  });

  const { data: emailTemplates = [] as any[] } = useQuery<any[]>({
    queryKey: ['email-templates'],
    queryFn: async (): Promise<any[]> => {
      const response = await api.get('/templates');
      return (response as any)?.data || response || [];
    },
  });

  const { data: smsTemplates = [] as any[] } = useQuery<any[]>({
    queryKey: ['sms-templates'],
    queryFn: async (): Promise<any[]> => {
      const response = await api.get('/sms-templates');
      return (response as any)?.data?.templates || (response as any)?.templates || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/dunning/schedules', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dunning-schedules'] });
      setIsCreateOpen(false);
      resetForm();
      toast.success('Schedule created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/dunning/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dunning-schedules'] });
      toast.success('Schedule deleted');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DunningSchedule> }) => {
      const response = await api.put(`/dunning/schedules/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dunning-schedules'] });
      toast.success('Schedule updated');
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: async ({ invoiceId, channel }: { invoiceId: number; channel: 'email' | 'sms' }) => {
      const response = await api.post(`/dunning/send/${invoiceId}`, {
        channel,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['overdue-invoices'] });
      toast.success(`${variables.channel === 'email' ? 'Email' : 'SMS'} reminder sent`);
    },
  });

  const processAllMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/dunning/process');
      return response.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['overdue-invoices'] });
      toast.success(`Sent ${data.reminders_sent || 0} reminders`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      days_after_due: 7,
      email_template_id: '',
      sms_template_id: '',
      is_active: true,
    });
    setEditingSchedule(null);
  };

  const handleEdit = (schedule: DunningSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      days_after_due: schedule.days_after_due,
      email_template_id: schedule.email_template_id || '',
      sms_template_id: schedule.sms_template_id || '',
      is_active: schedule.is_active,
    });
    setIsCreateOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || formData.days_after_due === undefined || formData.days_after_due === null) {
      toast.error('Please fill all required fields');
      return;
    }

    const payload: any = {
      ...formData,
      email_template_id: formData.email_template_id ? Number(formData.email_template_id) : null,
      sms_template_id: formData.sms_template_id ? Number(formData.sms_template_id) : null,
    };

    if (editingSchedule) {
      updateMutation.mutate({ id: editingSchedule.id, data: payload });
      setIsCreateOpen(false);
      resetForm();
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleActive = (schedule: DunningSchedule) => {
    // Send full object to be safe with PUT requests
    const updatedSchedule = {
      ...schedule,
      is_active: !schedule.is_active,
      email_template_id: schedule.email_template_id ? Number(schedule.email_template_id) : undefined,
      sms_template_id: schedule.sms_template_id ? Number(schedule.sms_template_id) : undefined,
    };
    updateMutation.mutate({
      id: schedule.id,
      data: updatedSchedule,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const deleteSchedule = (id: number) => {
    if (window.confirm('Are you sure you want to delete this dunning schedule?')) {
      deleteMutation.mutate(id);
    }
  };

  return (

    <><SEO title="Payment Reminders" description="Manage automated payment reminders and dunning schedules" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Payment Reminders</h1>
            <p className="text-muted-foreground">Automated dunning schedules for overdue invoices</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (window.confirm('Are you sure you want to process all overdue invoices? This will send reminders immediately.')) {
                  processAllMutation.mutate();
                }
              }}
              disabled={processAllMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Process All
            </Button>
            <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </div>
        </div>

        {/* Schedules */}
        <Card>
          <CardHeader>
            <CardTitle>Reminder Schedules</CardTitle>
            <CardDescription>Configure when to send payment reminders</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : isError ? (
              <div className="text-center py-8 text-red-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Failed to load schedules. Please try again later.</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No schedules configured</p>
                <Button onClick={() => setIsCreateOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Schedule
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {schedules.map((schedule: DunningSchedule) => {
                  const emailTemplate = emailTemplates.find((t: any) => String(t.id) === String(schedule.email_template_id));
                  const smsTemplate = smsTemplates.find((t: any) => String(t.id) === String(schedule.sms_template_id));

                  return (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{schedule.name}</p>
                          {!schedule.is_active && <Badge variant="secondary">Inactive</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Trigger: {schedule.days_after_due} days after due date
                        </p>
                        <div className="flex gap-4 mt-2">
                          {emailTemplate && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Send className="h-3 w-3 mr-1" />
                              Email: {emailTemplate.name}
                            </div>
                          )}
                          {smsTemplate && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Bell className="h-3 w-3 mr-1" />
                              SMS: {smsTemplate.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 mr-4">
                          <Label htmlFor={`active-${schedule.id}`} className="text-xs">Active</Label>
                          <Switch
                            id={`active-${schedule.id}`}
                            checked={schedule.is_active}
                            onCheckedChange={() => toggleActive(schedule)}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(schedule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteSchedule(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Invoices */}
        <Card>
          <CardHeader>
            <CardTitle>Overdue Invoices</CardTitle>
            <CardDescription>Invoices requiring payment reminders</CardDescription>
          </CardHeader>
          <CardContent>
            {overdueInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No overdue invoices
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount Due</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead>Reminders Sent</TableHead>
                    <TableHead>Last Reminder</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueInvoices.map((invoice: OverdueInvoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {invoice.contact_first_name || invoice.contact_last_name
                              ? `${invoice.contact_first_name || ''} ${invoice.contact_last_name || ''}`.trim()
                              : '-'}
                          </p>
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            {invoice.email && <p className="text-[12px] text-muted-foreground">{invoice.email}</p>}
                            {invoice.phone && <p className="text-[12px] text-muted-foreground">{invoice.phone}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-red-600">
                        {formatCurrency(invoice.amount_due)}
                        <p className="text-[12px] text-muted-foreground font-normal">of {formatCurrency(invoice.total)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="font-mono">
                          {invoice.days_overdue}d Overdue
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline">{invoice.dunning_count}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {invoice.last_dunning_sent_at
                          ? format(new Date(invoice.last_dunning_sent_at), 'MMM d, HH:mm')
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Send Email Reminder"
                            onClick={() => sendReminderMutation.mutate({ invoiceId: invoice.id, channel: 'email' })}
                            disabled={sendReminderMutation.isPending || !invoice.email}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Send SMS Reminder"
                            onClick={() => sendReminderMutation.mutate({ invoiceId: invoice.id, channel: 'sms' })}
                            disabled={sendReminderMutation.isPending || !invoice.phone}
                          >
                            <BellRing className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsCreateOpen(open); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSchedule ? 'Edit Reminder Schedule' : 'Create Reminder Schedule'}</DialogTitle>
              <DialogDescription>Configure when to send payment reminders</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label>Schedule Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., 7 Days Overdue"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Days After Due Date *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.days_after_due}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setFormData({ ...formData, days_after_due: isNaN(val) ? 0 : val });
                    }}
                  />
                </div>
                <div className="flex items-center justify-between pt-8">
                  <Label>Active Status</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email Template</Label>
                <Select
                  value={String(formData.email_template_id)}
                  onValueChange={(value) => setFormData({ ...formData, email_template_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select email template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (Don't send email)</SelectItem>
                    {emailTemplates.map((template: any) => (
                      <SelectItem key={template.id} value={String(template.id)}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>SMS Template</Label>
                <Select
                  value={String(formData.sms_template_id)}
                  onValueChange={(value) => setFormData({ ...formData, sms_template_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select SMS template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (Don't send SMS)</SelectItem>
                    {smsTemplates.map((template: any) => (
                      <SelectItem key={template.id} value={String(template.id)}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> Available Variables
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {['first_name', 'name', 'invoice_number', 'amount_due', 'total_amount', 'due_date', 'days_overdue', 'currency', 'payment_url'].map(v => (
                    <code key={v} className="text-[12px] bg-muted p-1 rounded">{"{{" + v + "}}"}</code>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingSchedule ? 'Save Changes' : 'Create Schedule'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div></>

  );
};

export default DunningSchedules;
