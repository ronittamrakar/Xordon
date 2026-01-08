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
import { expensesApi, CommissionPlan, Commission, staffApi, StaffMember } from '@/services';
import { Plus, DollarSign, TrendingUp, Users, BarChart3, Loader2, Percent, Target, Edit, Trash2, Check, X, Calendar, Filter, Download, Award, Trophy, Medal } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import SEO from '@/components/SEO';

const statusColors: Record<string, string> = {
  pending: 'bg-orange-500',
  approved: 'bg-green-500',
  paid: 'bg-blue-500',
  cancelled: 'bg-red-500',
};

const planTypeLabels: Record<string, string> = {
  percentage: 'Percentage',
  tiered: 'Tiered',
  flat: 'Flat Rate',
  custom: 'Custom',
};

export default function Commissions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('commissions');
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isCreateCommissionOpen, setIsCreateCommissionOpen] = useState(false);
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<CommissionPlan | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    plan_type: 'percentage',
    base_rate: '',
    flat_amount: '',
    applies_to: 'revenue',
    calculation_period: 'per_transaction',
  });

  const [newCommission, setNewCommission] = useState({
    user_id: '',
    commission_plan_id: '',
    source_description: '',
    base_amount: '',
    commission_rate: '',
    commission_amount: '',
    period_start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    period_end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    notes: '',
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['commission-plans'],
    queryFn: () => expensesApi.getCommissionPlans(),
  });

  const { data: commissions = [], isLoading: commissionsLoading } = useQuery({
    queryKey: ['commissions', statusFilter],
    queryFn: () => expensesApi.getCommissions(statusFilter !== 'all' ? { status: statusFilter } : {}),
  });

  const { data: analytics } = useQuery({
    queryKey: ['expenses-analytics', dateRange],
    queryFn: () => expensesApi.getAnalytics(dateRange),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.list(),
  });

  const createPlanMutation = useMutation({
    mutationFn: (data: any) => expensesApi.createCommissionPlan({
      ...data,
      base_rate: data.base_rate ? parseFloat(data.base_rate) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-plans'] });
      setIsCreatePlanOpen(false);
      setNewPlan({ name: '', description: '', plan_type: 'percentage', base_rate: '', flat_amount: '', applies_to: 'revenue', calculation_period: 'per_transaction' });
      toast({ title: 'Commission plan created successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create plan',
        description: error?.message || 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: (data: any) => expensesApi.updateCommissionPlan(selectedPlan!.id, {
      ...data,
      base_rate: data.base_rate ? parseFloat(data.base_rate) : undefined,
      flat_amount: data.flat_amount ? parseFloat(data.flat_amount) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-plans'] });
      setIsCreatePlanOpen(false);
      setNewPlan({ name: '', description: '', plan_type: 'percentage', base_rate: '', flat_amount: '', applies_to: 'revenue', calculation_period: 'per_transaction' });
      setSelectedPlan(null);
      toast({ title: 'Commission plan updated successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update plan',
        description: error?.message || 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  const createCommissionMutation = useMutation({
    mutationFn: (data: any) => expensesApi.createCommission({
      ...data,
      user_id: parseInt(data.user_id),
      commission_plan_id: data.commission_plan_id ? parseInt(data.commission_plan_id) : undefined,
      base_amount: parseFloat(data.base_amount),
      commission_rate: data.commission_rate ? parseFloat(data.commission_rate) : undefined,
      commission_amount: parseFloat(data.commission_amount),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-analytics'] });
      setIsCreateCommissionOpen(false);
      setNewCommission({
        user_id: '',
        commission_plan_id: '',
        source_description: '',
        base_amount: '',
        commission_rate: '',
        commission_amount: '',
        period_start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        period_end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        notes: '',
      });
      toast({ title: 'Commission created successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create commission',
        description: error?.message || 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  const approveCommissionMutation = useMutation({
    mutationFn: (id: number) => expensesApi.approveCommission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-analytics'] });
      toast({ title: 'Commission approved successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to approve commission', variant: 'destructive' });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: number) => expensesApi.deleteCommissionPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-plans'] });
      toast({ title: 'Commission plan deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete commission plan', variant: 'destructive' });
    },
  });

  const totalCommissions = analytics?.commissions?.total_amount || 0;
  const paidCommissions = analytics?.commissions?.paid_amount || 0;
  const pendingCommissions = totalCommissions - paidCommissions;
  const totalCount = analytics?.commissions?.total_commissions || 0;

  const filteredCommissions = commissions;

  const handleCalculateCommission = () => {
    if (newCommission.commission_plan_id && newCommission.base_amount) {
      const plan = plans.find((p: CommissionPlan) => p.id === parseInt(newCommission.commission_plan_id));
      if (plan && plan.base_rate) {
        const calculated = (parseFloat(newCommission.base_amount) * plan.base_rate) / 100;
        setNewCommission({
          ...newCommission,
          commission_rate: plan.base_rate.toString(),
          commission_amount: calculated.toFixed(2),
        });
      }
    }
  };

  return (

    <><SEO
      title="Commissions"
      description="Manage commission plans, track earnings, and view performance leaderboards for your team."
    />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Commissions</h1>
            <p className="text-muted-foreground">Manage commission plans and track earnings</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreateCommissionOpen} onOpenChange={setIsCreateCommissionOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Commission
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Record Commission</DialogTitle>
                  <DialogDescription>Manually record a commission payment</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Staff Member *</Label>
                      <Select
                        value={newCommission.user_id}
                        onValueChange={(v) => setNewCommission({ ...newCommission, user_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff" />
                        </SelectTrigger>
                        <SelectContent>
                          {staff.map((member: StaffMember) => (
                            <SelectItem key={member.id} value={member.user_id?.toString() || member.id.toString()}>
                              {member.first_name} {member.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Commission Plan (Optional)</Label>
                      <Select
                        value={newCommission.commission_plan_id}
                        onValueChange={(v) => {
                          setNewCommission({ ...newCommission, commission_plan_id: v });
                          setTimeout(handleCalculateCommission, 100);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {plans.filter((p: CommissionPlan) => p.is_active).map((plan: CommissionPlan) => (
                            <SelectItem key={plan.id} value={plan.id.toString()}>
                              {plan.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Input
                      value={newCommission.source_description}
                      onChange={(e) => setNewCommission({ ...newCommission, source_description: e.target.value })}
                      placeholder="e.g., Q4 Sales Commission"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Base Amount *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newCommission.base_amount}
                        onChange={(e) => {
                          setNewCommission({ ...newCommission, base_amount: e.target.value });
                          setTimeout(handleCalculateCommission, 100);
                        }}
                        placeholder="10000.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newCommission.commission_rate}
                        onChange={(e) => setNewCommission({ ...newCommission, commission_rate: e.target.value })}
                        placeholder="10.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Commission Amount *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newCommission.commission_amount}
                        onChange={(e) => setNewCommission({ ...newCommission, commission_amount: e.target.value })}
                        placeholder="1000.00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Period Start</Label>
                      <Input
                        type="date"
                        value={newCommission.period_start}
                        onChange={(e) => setNewCommission({ ...newCommission, period_start: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Period End</Label>
                      <Input
                        type="date"
                        value={newCommission.period_end}
                        onChange={(e) => setNewCommission({ ...newCommission, period_end: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={newCommission.notes}
                      onChange={(e) => setNewCommission({ ...newCommission, notes: e.target.value })}
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateCommissionOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => createCommissionMutation.mutate(newCommission)}
                    disabled={!newCommission.user_id || !newCommission.base_amount || !newCommission.commission_amount || createCommissionMutation.isPending}
                  >
                    {createCommissionMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Commission
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={isCreatePlanOpen} onOpenChange={(open) => {
              setIsCreatePlanOpen(open);
              if (!open) {
                setNewPlan({ name: '', description: '', plan_type: 'percentage', base_rate: '', flat_amount: '', applies_to: 'revenue', calculation_period: 'per_transaction' });
                setSelectedPlan(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{selectedPlan ? 'Edit Commission Plan' : 'Create Commission Plan'}</DialogTitle>
                  <DialogDescription>{selectedPlan ? 'Update existing commission structure' : 'Set up a new commission structure'}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Plan Name *</Label>
                    <Input
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                      placeholder="e.g., Sales Team Commission"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newPlan.description}
                      onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                      placeholder="Describe the commission plan..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Plan Type</Label>
                      <Select
                        value={newPlan.plan_type}
                        onValueChange={(v) => setNewPlan({ ...newPlan, plan_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="tiered">Tiered</SelectItem>
                          <SelectItem value="flat">Flat Rate</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      {newPlan.plan_type === 'flat' ? (
                        <>
                          <Label>Flat Amount ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newPlan.flat_amount}
                            onChange={(e) => setNewPlan({ ...newPlan, flat_amount: e.target.value })}
                            placeholder="100.00"
                          />
                        </>
                      ) : (
                        <>
                          <Label>Base Rate (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newPlan.base_rate}
                            onChange={(e) => setNewPlan({ ...newPlan, base_rate: e.target.value })}
                            placeholder="10.00"
                            disabled={newPlan.plan_type !== 'percentage'}
                          />
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Applies To</Label>
                      <Select
                        value={newPlan.applies_to}
                        onValueChange={(v) => setNewPlan({ ...newPlan, applies_to: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="revenue">Revenue</SelectItem>
                          <SelectItem value="profit">Profit</SelectItem>
                          <SelectItem value="deals_closed">Deals Closed</SelectItem>
                          <SelectItem value="appointments">Appointments</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Calculation Period</Label>
                      <Select
                        value={newPlan.calculation_period}
                        onValueChange={(v) => setNewPlan({ ...newPlan, calculation_period: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_transaction">Per Transaction</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreatePlanOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => {
                      if (selectedPlan) {
                        updatePlanMutation.mutate({ id: selectedPlan.id, ...newPlan });
                      } else {
                        createPlanMutation.mutate(newPlan);
                      }
                    }}
                    disabled={!newPlan.name || createPlanMutation.isPending || updatePlanMutation.isPending}
                  >
                    {(createPlanMutation.isPending || updatePlanMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {selectedPlan ? 'Update Plan' : 'Create Plan'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Total Commissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${totalCommissions.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">{totalCount} commissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Paid Out
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">${paidCommissions.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalCommissions > 0 ? ((paidCommissions / totalCommissions) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">${pendingCommissions.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Awaiting approval/payment</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                Active Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{plans.filter((p: CommissionPlan) => p.is_active).length}</p>
              <p className="text-xs text-muted-foreground mt-1">of {plans.length} total plans</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="commissions">
              <DollarSign className="h-4 w-4 mr-2" />
              Commissions
            </TabsTrigger>
            <TabsTrigger value="plans">
              <Target className="h-4 w-4 mr-2" />
              Plans
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              <TrendingUp className="h-4 w-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="commissions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Commission Records</CardTitle>
                    <CardDescription>View and manage all commission payments</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {commissionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredCommissions.length === 0 ? (
                  <div className="py-8 text-center">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No commissions recorded yet</p>
                    <Button variant="outline" className="mt-4" onClick={() => setIsCreateCommissionOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Record First Commission
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Base Amount</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCommissions.map((commission: Commission) => (
                        <TableRow key={commission.id}>
                          <TableCell className="font-medium">
                            {commission.source_description || 'Commission'}
                          </TableCell>
                          <TableCell>{commission.user_name || `User #${commission.user_id}`}</TableCell>
                          <TableCell>
                            {commission.plan_name ? (
                              <Badge variant="outline">{commission.plan_name}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">Manual</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(commission.period_start), 'MMM d')} - {format(new Date(commission.period_end), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">${commission.base_amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            {commission.commission_rate ? `${commission.commission_rate}%` : '-'}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            ${commission.commission_amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[commission.status]}>
                              {commission.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {commission.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => approveCommissionMutation.mutate(commission.id)}
                                disabled={approveCommissionMutation.isPending}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Commission Plans</CardTitle>
                <CardDescription>Manage commission structures and rates</CardDescription>
              </CardHeader>
              <CardContent>
                {plansLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : plans.length === 0 ? (
                  <div className="py-8 text-center">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No commission plans yet. Create your first plan!</p>
                    <Button variant="outline" className="mt-4" onClick={() => setIsCreatePlanOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Plan
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {plans.map((plan: CommissionPlan) => (
                      <Card key={plan.id} className="border-2">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                            <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                              {plan.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          {plan.description && (
                            <CardDescription>{plan.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Type</span>
                              <Badge variant="outline">{planTypeLabels[plan.plan_type] || plan.plan_type}</Badge>
                            </div>
                            {plan.base_rate && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Base Rate</span>
                                <span className="font-medium text-lg">{plan.base_rate}%</span>
                              </div>
                            )}
                            {plan.flat_amount && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Flat Amount</span>
                                <span className="font-medium">${plan.flat_amount.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Applies To</span>
                              <span className="capitalize">{plan.applies_to.replace('_', ' ')}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Period</span>
                              <span className="capitalize">{plan.calculation_period.replace('_', ' ')}</span>
                            </div>
                            {plan.tiers && plan.tiers.length > 0 && (
                              <div className="pt-2 border-t">
                                <p className="text-sm font-medium mb-2">Tiers</p>
                                <div className="space-y-1">
                                  {plan.tiers.map((tier, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                      <span>${tier.min.toLocaleString()} - {tier.max ? `$${tier.max.toLocaleString()}` : '∞'}</span>
                                      <span className="font-medium">{tier.rate}%</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="pt-3 border-t flex gap-2">
                              {/* Edit functionality implemented */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setSelectedPlan(plan);
                                  setNewPlan({
                                    name: plan.name,
                                    description: plan.description || '',
                                    plan_type: plan.plan_type,
                                    base_rate: plan.base_rate?.toString() || '',
                                    flat_amount: plan.flat_amount?.toString() || '',
                                    applies_to: plan.applies_to,
                                    calculation_period: plan.calculation_period,
                                  });
                                  setIsCreatePlanOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 hover:bg-red-50 hover:text-red-500"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this plan?')) {
                                    deletePlanMutation.mutate(plan.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    Top Earners
                  </CardTitle>
                  <CardDescription>Commission leaderboard for the current period</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics?.by_user && analytics.by_user.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.by_user.slice(0, 10).map((user: any, idx: number) => (
                        <div key={user.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg' :
                              idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md' :
                                idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md' :
                                  'bg-muted text-muted-foreground'
                              }`}>
                              {idx < 3 ? (
                                idx === 0 ? <Trophy className="h-5 w-5" /> :
                                  idx === 1 ? <Medal className="h-5 w-5" /> :
                                    <Award className="h-5 w-5" />
                              ) : (
                                idx + 1
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {user.count || 0} commission{(user.count || 0) !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">${user.amount.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No commission data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Insights</CardTitle>
                  <CardDescription>Commission statistics and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Average Commission</span>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-2xl font-bold">
                        ${totalCount > 0 ? (totalCommissions / totalCount).toFixed(2) : '0.00'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Per commission</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Highest Commission</span>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        ${commissions.length > 0 ? Math.max(...commissions.map((c: Commission) => c.commission_amount)).toFixed(2) : '0.00'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Single commission</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Total Recipients</span>
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {analytics?.by_user?.length || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Unique users</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Approval Rate</span>
                        <Percent className="h-4 w-4 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {totalCount > 0
                          ? ((commissions.filter((c: Commission) => c.status !== 'pending').length / totalCount) * 100).toFixed(1)
                          : '0.0'}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Processed commissions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div></>

  );
}
