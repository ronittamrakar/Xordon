import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { payrollApi, staffApi, PayPeriod, PayrollRecord, EmployeeCompensation, PayrollAnalytics } from '@/services';
import { Plus, DollarSign, Calendar, CheckCircle, XCircle, Loader2, BarChart3, Download, Users, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  processing: 'bg-blue-500',
  approved: 'bg-green-500',
  paid: 'bg-emerald-500',
  cancelled: 'bg-red-500',
  pending: 'bg-yellow-500',
  failed: 'bg-red-600',
};

const periodTypeLabels: Record<string, string> = {
  weekly: 'Weekly',
  'bi-weekly': 'Bi-Weekly',
  'semi-monthly': 'Semi-Monthly',
  monthly: 'Monthly',
};

export default function Payroll() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('periods');
  const [isCreatePeriodOpen, setIsCreatePeriodOpen] = useState(false);
  const [isCompensationOpen, setIsCompensationOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PayPeriod | null>(null);
  const [newPeriod, setNewPeriod] = useState({
    period_type: 'bi-weekly',
    period_start: '',
    period_end: '',
    pay_date: '',
    notes: '',
  });
  const [newCompensation, setNewCompensation] = useState({
    user_id: '',
    employment_type: 'full-time',
    pay_type: 'hourly',
    hourly_rate: '',
    salary_amount: '',
    pay_frequency: 'bi-weekly',
    overtime_eligible: true,
    overtime_rate_multiplier: '1.5',
    effective_date: '',
  });

  // ==================== QUERIES ====================
  const { data: payPeriods, isLoading: periodsLoading } = useQuery({
    queryKey: ['payroll-periods'],
    queryFn: () => payrollApi.getPayPeriods(),
  });

  const { data: payrollRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ['payroll-records', selectedPeriod?.id],
    queryFn: () => payrollApi.getPayrollRecords(selectedPeriod ? { pay_period_id: selectedPeriod.id } : {}),
    enabled: !!selectedPeriod,
  });

  const { data: compensations, isLoading: compensationsLoading } = useQuery({
    queryKey: ['payroll-compensation'],
    queryFn: () => payrollApi.getEmployeeCompensation(),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['payroll-analytics'],
    queryFn: () => payrollApi.getPayrollAnalytics(),
  });

  const { data: staffMembers } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.list(),
  });

  // ==================== MUTATIONS ====================
  const createPeriodMutation = useMutation({
    mutationFn: (data: any) => payrollApi.createPayPeriod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      toast({
        title: 'Pay period created',
        description: 'New pay period has been created successfully.',
      });
      setIsCreatePeriodOpen(false);
      setNewPeriod({
        period_type: 'bi-weekly',
        period_start: '',
        period_end: '',
        pay_date: '',
        notes: '',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create pay period',
        variant: 'destructive',
      });
    },
  });

  const processPeriodMutation = useMutation({
    mutationFn: (id: number) => payrollApi.processPayPeriod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
      toast({
        title: 'Pay period processed',
        description: 'Payroll has been calculated for all employees.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process pay period',
        variant: 'destructive',
      });
    },
  });

  const approvePeriodMutation = useMutation({
    mutationFn: (id: number) => payrollApi.approvePayPeriod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      toast({
        title: 'Pay period approved',
        description: 'Payroll has been approved and is ready for payment.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve pay period',
        variant: 'destructive',
      });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: number) => payrollApi.markPayrollRecordPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
      toast({
        title: 'Payment recorded',
        description: 'Payroll record marked as paid.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark as paid',
        variant: 'destructive',
      });
    },
  });

  const createCompensationMutation = useMutation({
    mutationFn: (data: any) => payrollApi.createEmployeeCompensation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-compensation'] });
      toast({
        title: 'Compensation created',
        description: 'Employee compensation has been configured.',
      });
      setIsCompensationOpen(false);
      setNewCompensation({
        user_id: '',
        employment_type: 'full-time',
        pay_type: 'hourly',
        hourly_rate: '',
        salary_amount: '',
        pay_frequency: 'bi-weekly',
        overtime_eligible: true,
        overtime_rate_multiplier: '1.5',
        effective_date: '',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create compensation',
        variant: 'destructive',
      });
    },
  });

  // ==================== HANDLERS ====================
  const handleCreatePeriod = () => {
    if (!newPeriod.period_start || !newPeriod.period_end || !newPeriod.pay_date) {
      toast({
        title: 'Validation Error',
        description: 'Please provide all required dates',
        variant: 'destructive',
      });
      return;
    }
    createPeriodMutation.mutate(newPeriod);
  };

  const handleProcessPeriod = (id: number) => {
    if (confirm('Process payroll for this period? This will calculate pay for all employees.')) {
      processPeriodMutation.mutate(id);
    }
  };

  const handleApprovePeriod = (id: number) => {
    if (confirm('Approve this pay period? Once approved, it will be ready for payment.')) {
      approvePeriodMutation.mutate(id);
    }
  };

  const handleCreateCompensation = () => {
    const data = {
      ...newCompensation,
      user_id: parseInt(newCompensation.user_id),
      hourly_rate: newCompensation.hourly_rate ? parseFloat(newCompensation.hourly_rate) : null,
      salary_amount: newCompensation.salary_amount ? parseFloat(newCompensation.salary_amount) : null,
      overtime_rate_multiplier: parseFloat(newCompensation.overtime_rate_multiplier),
    };
    createCompensationMutation.mutate(data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground">Process payroll and manage employee compensation</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCompensationOpen} onOpenChange={setIsCompensationOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Add Compensation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Employee Compensation</DialogTitle>
                <DialogDescription>Configure employee pay structure</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Employee</Label>
                  <Select
                    value={newCompensation.user_id}
                    onValueChange={(value) => setNewCompensation({ ...newCompensation, user_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers?.filter(s => s.user_id).map((staff) => (
                        <SelectItem key={staff.id} value={String(staff.user_id)}>
                          {staff.first_name} {staff.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Employment Type</Label>
                    <Select
                      value={newCompensation.employment_type}
                      onValueChange={(value: any) => setNewCompensation({ ...newCompensation, employment_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-Time</SelectItem>
                        <SelectItem value="part-time">Part-Time</SelectItem>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Pay Type</Label>
                    <Select
                      value={newCompensation.pay_type}
                      onValueChange={(value: any) => setNewCompensation({ ...newCompensation, pay_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="salary">Salary</SelectItem>
                        <SelectItem value="commission">Commission</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {newCompensation.pay_type === 'hourly' && (
                  <div>
                    <Label>Hourly Rate</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newCompensation.hourly_rate}
                      onChange={(e) => setNewCompensation({ ...newCompensation, hourly_rate: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                )}
                {(newCompensation.pay_type === 'salary' || newCompensation.pay_type === 'commission') && (
                  <div>
                    <Label>Annual Salary</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newCompensation.salary_amount}
                      onChange={(e) => setNewCompensation({ ...newCompensation, salary_amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                )}
                <div>
                  <Label>Pay Frequency</Label>
                  <Select
                    value={newCompensation.pay_frequency}
                    onValueChange={(value: any) => setNewCompensation({ ...newCompensation, pay_frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                      <SelectItem value="semi-monthly">Semi-Monthly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Effective Date</Label>
                  <Input
                    type="date"
                    value={newCompensation.effective_date}
                    onChange={(e) => setNewCompensation({ ...newCompensation, effective_date: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCompensationOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCompensation} disabled={createCompensationMutation.isPending}>
                  {createCompensationMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreatePeriodOpen} onOpenChange={setIsCreatePeriodOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Pay Period
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Pay Period</DialogTitle>
                <DialogDescription>Set up a new payroll period</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Period Type</Label>
                  <Select
                    value={newPeriod.period_type}
                    onValueChange={(value: any) => setNewPeriod({ ...newPeriod, period_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(periodTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Period Start</Label>
                    <Input
                      type="date"
                      value={newPeriod.period_start}
                      onChange={(e) => setNewPeriod({ ...newPeriod, period_start: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Period End</Label>
                    <Input
                      type="date"
                      value={newPeriod.period_end}
                      onChange={(e) => setNewPeriod({ ...newPeriod, period_end: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Pay Date</Label>
                  <Input
                    type="date"
                    value={newPeriod.pay_date}
                    onChange={(e) => setNewPeriod({ ...newPeriod, pay_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={newPeriod.notes}
                    onChange={(e) => setNewPeriod({ ...newPeriod, notes: e.target.value })}
                    placeholder="Optional notes..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreatePeriodOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePeriod} disabled={createPeriodMutation.isPending}>
                  {createPeriodMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Period
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Analytics Cards */}
      {!analyticsLoading && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.ytd.total_gross_pay)}</div>
              <p className="text-xs text-muted-foreground mt-1">Gross pay this period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Net Pay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.ytd.total_net_pay)}</div>
              <p className="text-xs text-muted-foreground mt-1">After deductions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.ytd.total_deductions)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total withholdings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.ytd.total_employees}</div>
              <p className="text-xs text-muted-foreground mt-1">Active employees</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="periods">Pay Periods</TabsTrigger>
          <TabsTrigger value="records">Payroll Records</TabsTrigger>
          <TabsTrigger value="compensation">Compensation</TabsTrigger>
        </TabsList>

        {/* Pay Periods Tab */}
        <TabsContent value="periods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pay Periods</CardTitle>
              <CardDescription>Manage payroll periods and processing</CardDescription>
            </CardHeader>
            <CardContent>
              {periodsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !payPeriods?.data || payPeriods.data.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>No pay periods found</p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Pay Date</TableHead>
                        <TableHead>Employees</TableHead>
                        <TableHead>Gross Pay</TableHead>
                        <TableHead>Net Pay</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payPeriods.data.map((period) => (
                        <TableRow key={period.id} onClick={() => setSelectedPeriod(period)} className="cursor-pointer">
                          <TableCell className="font-medium">
                            {format(parseISO(period.period_start), 'MMM d')} - {format(parseISO(period.period_end), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{periodTypeLabels[period.period_type]}</Badge>
                          </TableCell>
                          <TableCell>{format(parseISO(period.pay_date), 'MMM d, yyyy')}</TableCell>
                          <TableCell>{period.employee_count || 0}</TableCell>
                          <TableCell>{formatCurrency(period.total_gross_pay)}</TableCell>
                          <TableCell>{formatCurrency(period.total_net_pay)}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[period.status]}>{period.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {period.status === 'draft' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleProcessPeriod(period.id);
                                  }}
                                  disabled={processPeriodMutation.isPending}
                                >
                                  Process
                                </Button>
                              )}
                              {period.status === 'processing' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprovePeriod(period.id);
                                  }}
                                  disabled={approvePeriodMutation.isPending}
                                >
                                  Approve
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Records Tab */}
        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Records</CardTitle>
              <CardDescription>
                {selectedPeriod
                  ? `Records for ${format(parseISO(selectedPeriod.period_start), 'MMM d')} - ${format(parseISO(selectedPeriod.period_end), 'MMM d, yyyy')}`
                  : 'Select a pay period to view records'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedPeriod ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>Select a pay period from the Pay Periods tab</p>
                </div>
              ) : recordsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !payrollRecords || payrollRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No payroll records found for this period</p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Gross Pay</TableHead>
                        <TableHead>Deductions</TableHead>
                        <TableHead>Net Pay</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrollRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.user_name}</TableCell>
                          <TableCell>
                            {(record.regular_hours + record.overtime_hours + record.double_time_hours).toFixed(2)}h
                          </TableCell>
                          <TableCell>{formatCurrency(record.gross_pay)}</TableCell>
                          <TableCell>{formatCurrency(record.total_deductions)}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(record.net_pay)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{record.payment_method.replace('_', ' ')}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[record.payment_status]}>{record.payment_status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {record.payment_status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markPaidMutation.mutate(record.id)}
                                disabled={markPaidMutation.isPending}
                              >
                                Mark Paid
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compensation Tab */}
        <TabsContent value="compensation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Compensation</CardTitle>
              <CardDescription>Manage employee pay structures and rates</CardDescription>
            </CardHeader>
            <CardContent>
              {compensationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !compensations || compensations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>No compensation records found</p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Employment Type</TableHead>
                        <TableHead>Pay Type</TableHead>
                        <TableHead>Rate/Salary</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Overtime Eligible</TableHead>
                        <TableHead>Effective Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {compensations.map((comp) => (
                        <TableRow key={comp.id}>
                          <TableCell className="font-medium">{comp.user_name || `ID: ${comp.user_id}`}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{comp.employment_type.replace('-', ' ')}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{comp.pay_type}</Badge>
                          </TableCell>
                          <TableCell>
                            {comp.pay_type === 'hourly'
                              ? `${formatCurrency(comp.hourly_rate || 0)}/hr`
                              : formatCurrency(comp.salary_amount || 0)}
                          </TableCell>
                          <TableCell>{comp.pay_frequency?.replace('-', ' ')}</TableCell>
                          <TableCell>
                            {comp.overtime_eligible ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </TableCell>
                          <TableCell>{format(parseISO(comp.effective_date), 'MMM d, yyyy')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
