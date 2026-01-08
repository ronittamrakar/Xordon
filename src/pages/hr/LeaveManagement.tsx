import React, { useState, useMemo } from 'react';
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
import { timeTrackingApi, LeaveRequest, LeaveBalance, staffApi, StaffMember, employeesApi } from '@/services';
import { Plus, Calendar, CheckCircle, XCircle, Clock, Loader2, BarChart3, CalendarDays, RefreshCw, Users, AlertTriangle } from 'lucide-react';
import { format, differenceInHours, parseISO } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';

const leaveTypeLabels: Record<string, string> = {
  vacation: 'Vacation',
  sick: 'Sick Leave',
  personal: 'Personal',
  bereavement: 'Bereavement',
  jury_duty: 'Jury Duty',
  military: 'Military',
  unpaid: 'Unpaid',
  other: 'Other',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  cancelled: 'bg-gray-500',
};

export default function LeaveManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('requests');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [newRequest, setNewRequest] = useState({
    leave_type: 'vacation',
    start_date: '',
    end_date: '',
    is_half_day: false,
    half_day_type: null as 'morning' | 'afternoon' | null,
    reason: '',
  });

  const [isAccrualOpen, setIsAccrualOpen] = useState(false);
  const [selectedStaffForAccrual, setSelectedStaffForAccrual] = useState<number[]>([]);
  const [isDryRun, setIsDryRun] = useState(false);

  // ==================== QUERIES ====================
  const { data: leaveRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: () => timeTrackingApi.getLeaveRequests(),
  });

  const { data: leaveBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ['leave-balance'],
    queryFn: () => timeTrackingApi.getLeaveBalances(),
  });

  const { data: staffMembers } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.list(),
  });

  const { data: myShiftsData } = useQuery({
    queryKey: ['my-shifts'],
    queryFn: () => employeesApi.getEmployeeShifts('me'),
  });

  const conflicts = useMemo(() => {
    if (!newRequest.start_date || !newRequest.end_date || !myShiftsData?.upcoming) return [];
    const start = new Date(newRequest.start_date);
    const end = new Date(newRequest.end_date);

    return myShiftsData.upcoming.filter((shift: any) => {
      const shiftStart = new Date(shift.start_time);
      const shiftEnd = new Date(shift.end_time);
      // Check if shift overlaps with leave range (inclusive)
      // Shift is on a day within the range [start, end]
      // Compare dates only for simpler logic or full overlap
      const shiftDate = new Date(shiftStart.getFullYear(), shiftStart.getMonth(), shiftStart.getDate());
      const dStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const dEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());

      return shiftDate >= dStart && shiftDate <= dEnd;
    });
  }, [newRequest.start_date, newRequest.end_date, myShiftsData]);

  // ==================== MUTATIONS ====================
  const createMutation = useMutation({
    mutationFn: (data: any) => timeTrackingApi.createLeaveRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] });
      toast({
        title: 'Leave request created',
        description: 'Your request has been submitted for approval.',
      });
      setIsCreateOpen(false);
      setNewRequest({
        leave_type: 'vacation',
        start_date: '',
        end_date: '',
        is_half_day: false,
        half_day_type: null,
        reason: '',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create leave request',
        variant: 'destructive',
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => timeTrackingApi.approveLeaveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] });
      toast({
        title: 'Request approved',
        description: 'Leave request has been approved.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve leave request',
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      timeTrackingApi.rejectLeaveRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast({
        title: 'Request rejected',
        description: 'Leave request has been rejected.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject leave request',
        variant: 'destructive',
      });
    },
  });

  const processAccrualsMutation = useMutation({
    mutationFn: (params: { user_ids?: number[]; dry_run?: boolean } = {}) =>
      timeTrackingApi.processAccruals(params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] });
      toast({
        title: isDryRun ? 'Dry Run Complete' : 'Accruals processed',
        description: data.message
      });
      setIsAccrualOpen(false);
      setSelectedStaffForAccrual([]);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to process accruals',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // ==================== HANDLERS ====================
  const handleProcessAccruals = () => {
    processAccrualsMutation.mutate({
      user_ids: selectedStaffForAccrual.length > 0 ? selectedStaffForAccrual : undefined,
      dry_run: isDryRun
    });
  };

  const toggleStaffSelection = (id: number) => {
    setSelectedStaffForAccrual(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCreateRequest = () => {
    if (!newRequest.start_date || !newRequest.end_date) {
      toast({
        title: 'Validation Error',
        description: 'Please provide start and end dates',
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate(newRequest);
  };

  const handleApprove = (id: number) => {
    if (confirm('Approve this leave request?')) {
      approveMutation.mutate(id);
    }
  };

  const handleReject = (id: number) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      rejectMutation.mutate({ id, reason });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">Track and manage employee time off requests</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAccrualOpen} onOpenChange={setIsAccrualOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Process Accruals
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Process Leave Accruals</DialogTitle>
                <DialogDescription>
                  Calculate and add leave balances for employees based on their accrual rates.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dry-run"
                    checked={isDryRun}
                    onCheckedChange={(checked) => setIsDryRun(!!checked)}
                  />
                  <Label htmlFor="dry-run" className="cursor-pointer">
                    Dry Run (Preview changes without saving)
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Select Employees (Optional)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Leave empty to process accruals for all active employees.
                  </p>
                  <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 space-y-1">
                    {staffMembers?.map((staff: StaffMember) => (
                      <div key={staff.id} className="flex items-center space-x-2 p-1 hover:bg-accent rounded-sm">
                        <Checkbox
                          id={`staff-${staff.id}`}
                          checked={selectedStaffForAccrual.includes(staff.id)}
                          onCheckedChange={() => toggleStaffSelection(staff.id)}
                        />
                        <Label htmlFor={`staff-${staff.id}`} className="flex-1 cursor-pointer text-sm">
                          {staff.first_name} {staff.last_name}
                          <span className="ml-2 text-xs text-muted-foreground">({(staff as any).role || (staff as any).job_title})</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsAccrualOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleProcessAccruals}
                  disabled={processAccrualsMutation.isPending}
                >
                  {processAccrualsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isDryRun ? 'Run Preview' : 'Process Now'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Leave Request</DialogTitle>
                <DialogDescription>Submit a new time off request</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Leave Type</Label>
                  <Select
                    value={newRequest.leave_type}
                    onValueChange={(value: any) => setNewRequest({ ...newRequest, leave_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(leaveTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newRequest.start_date}
                      onChange={(e) => setNewRequest({ ...newRequest, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={newRequest.end_date}
                      onChange={(e) => setNewRequest({ ...newRequest, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="half-day"
                    checked={newRequest.is_half_day}
                    onChange={(e) => setNewRequest({ ...newRequest, is_half_day: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="half-day">Half Day</Label>
                </div>
                {newRequest.is_half_day && (
                  <div>
                    <Label>Half Day Period</Label>
                    <Select
                      value={newRequest.half_day_type || ''}
                      onValueChange={(value: any) => setNewRequest({ ...newRequest, half_day_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="afternoon">Afternoon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label>Reason</Label>
                  <Textarea
                    value={newRequest.reason}
                    onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                    placeholder="Provide a reason for your request..."
                    rows={3}
                  />
                </div>
              </div>

              {conflicts.length > 0 && (
                <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                  <div className="flex items-center text-yellow-800 font-medium mb-2">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Warning: {conflicts.length} shift conflict(s)
                  </div>
                  <ul className="text-sm text-yellow-700 list-disc ml-5 max-h-[100px] overflow-y-auto">
                    {conflicts.map((c: any) => (
                      <li key={c.id}>
                        {c.shift_type_name} on {format(new Date(c.start_time), 'MMM d')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRequest} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>



      {/* Leave Balance Overview */}
      {
        !balanceLoading && leaveBalance && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Vacation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leaveBalance.vacation_balance}h</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {leaveBalance.vacation_used}h used · {leaveBalance.vacation_accrued}h accrued
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Sick Leave</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leaveBalance.sick_balance}h</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {leaveBalance.sick_used}h used · {leaveBalance.sick_accrued}h accrued
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Personal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leaveBalance.personal_balance}h</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {leaveBalance.personal_used}h used · {leaveBalance.carryover_hours}h carryover
                </p>
              </CardContent>
            </Card>
          </div>
        )
      }

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>View and manage time off requests</CardDescription>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !leaveRequests || leaveRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p>No leave requests found</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.user_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{leaveTypeLabels[request.leave_type]}</Badge>
                      </TableCell>
                      <TableCell>{format(parseISO(request.start_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{format(parseISO(request.end_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{request.total_hours}h</TableCell>
                      <TableCell>
                        <Badge className={statusColors[request.status]}>{request.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(parseISO(request.created_at), 'MMM d')}
                      </TableCell>
                      <TableCell className="text-right">
                        {request.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(request.id)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(request.id)}
                              disabled={rejectMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
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
    </div>

  );
}

