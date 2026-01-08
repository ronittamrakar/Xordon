import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { staffApi, employeesApi, StaffMember, EmployeeDocument } from '@/services';
import {
  Search,
  UserPlus,
  FileTextIcon,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Download,
  Upload,
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  ShieldCheck,
  Plus,
  CalendarClock,
  Banknote,
  Plane
} from 'lucide-react';
import { format } from 'date-fns';

export default function Employees() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<StaffMember | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [newDocument, setNewDocument] = useState({
    document_type: 'contract' as const,
    title: '',
    expiry_date: '',
    notes: '',
  });

  // ==================== QUERIES ====================
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.list(),
  });

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ['employee-documents', selectedEmployee?.user_id],
    queryFn: () => employeesApi.getDocuments(selectedEmployee?.user_id || undefined),
    enabled: !!selectedEmployee?.user_id || !selectedEmployee,
  });

  const { data: onboarding, isLoading: onboardingLoading } = useQuery({
    queryKey: ['employee-onboarding', selectedEmployee?.user_id],
    queryFn: () => employeesApi.getEmployeeOnboarding(selectedEmployee!.user_id!),
    enabled: !!selectedEmployee?.user_id,
  });

  const { data: performanceReviews } = useQuery({
    queryKey: ['performance-reviews', selectedEmployee?.user_id],
    queryFn: () => employeesApi.getPerformanceReviews(selectedEmployee?.user_id || undefined),
    enabled: !!selectedEmployee?.user_id || !selectedEmployee,
  });

  const { data: assets } = useQuery({
    queryKey: ['employee-assets', selectedEmployee?.user_id],
    queryFn: () => employeesApi.getAssets(selectedEmployee?.user_id || undefined),
    enabled: !!selectedEmployee?.user_id || !selectedEmployee,
  });

  const { data: timeData } = useQuery({
    queryKey: ['employee-time', selectedEmployee?.user_id],
    queryFn: () => employeesApi.getEmployeeTimeEntries(selectedEmployee!.user_id!),
    enabled: !!selectedEmployee?.user_id,
  });

  const { data: shiftData } = useQuery({
    queryKey: ['employee-shifts', selectedEmployee?.user_id],
    queryFn: () => employeesApi.getEmployeeShifts(selectedEmployee!.user_id!),
    enabled: !!selectedEmployee?.user_id,
  });

  const { data: leaveData } = useQuery({
    queryKey: ['employee-leave', selectedEmployee?.user_id],
    queryFn: () => employeesApi.getEmployeeLeaveSummary(selectedEmployee!.user_id!),
    enabled: !!selectedEmployee?.user_id,
  });

  const { data: payrollData } = useQuery({
    queryKey: ['employee-payroll', selectedEmployee?.user_id],
    queryFn: () => employeesApi.getEmployeePayrollSummary(selectedEmployee!.user_id!),
    enabled: !!selectedEmployee?.user_id,
  });

  // ==================== MUTATIONS ====================
  const uploadDocMutation = useMutation({
    mutationFn: (data: any) => employeesApi.uploadDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents'] });
      toast({ title: 'Document uploaded successfully' });
      setIsUploadDialogOpen(false);
    },
  });

  const updateOnboardingMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      employeesApi.updateOnboardingTask(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-onboarding'] });
      toast({ title: 'Task updated' });
    },
  });

  // ==================== HANDLERS ====================
  const filteredEmployees = employees?.filter(emp =>
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUploadDoc = () => {
    if (!selectedEmployee?.user_id) return;
    // In a real app, we'd handle file upload to storage first
    // For now, we'll simulate with a dummy file_id
    uploadDocMutation.mutate({
      ...newDocument,
      user_id: selectedEmployee.user_id,
      file_id: 1, // Dummy
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight">Employee Directory</h1>
          <p className="text-muted-foreground">Manage employee profiles, documents, and onboarding</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Employee List */}
        <Card className="col-span-4">
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[600px] overflow-y-auto">
              {employeesLoading ? (
                <div className="p-4 text-center">Loading...</div>
              ) : (
                filteredEmployees?.map((emp) => (
                  <div
                    key={emp.id}
                    className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${selectedEmployee?.id === emp.id ? 'bg-accent' : ''
                      }`}
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {emp.first_name[0]}{emp.last_name[0]}
                      </div>
                      <div>
                        <div className="font-medium">{emp.first_name} {emp.last_name}</div>
                        <div className="text-xs text-muted-foreground">{emp.title || 'No Title'}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employee Details */}
        <div className="col-span-8 space-y-6">
          {selectedEmployee ? (
            <>
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                        {selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}
                      </div>
                      <div>
                        <CardTitle className="text-2xl">
                          {selectedEmployee.first_name} {selectedEmployee.last_name}
                        </CardTitle>
                        <CardDescription>{selectedEmployee.title}</CardDescription>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Active
                          </Badge>
                          <Badge variant="secondary">Full-time</Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Edit Profile</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedEmployee.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedEmployee.phone || 'No phone'}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>Engineering Department</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Joined {format(new Date(selectedEmployee.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="documents">
                <TabsList>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="assets">Assets</TabsTrigger>
                  <TabsTrigger value="time-tracking">Time</TabsTrigger>
                  <TabsTrigger value="shifts">Shifts</TabsTrigger>
                  <TabsTrigger value="leave">Leave</TabsTrigger>
                  <TabsTrigger value="payroll">Payroll</TabsTrigger>
                </TabsList>

                <TabsContent value="documents" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Employee Documents</CardTitle>
                        <CardDescription>Contracts, IDs, and other records</CardDescription>
                      </div>
                      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Upload Document</DialogTitle>
                            <DialogDescription>Add a new document to this employee's record</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Document Type</Label>
                              <Select
                                value={newDocument.document_type}
                                onValueChange={(v: any) => setNewDocument({ ...newDocument, document_type: v })}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="contract">Contract</SelectItem>
                                  <SelectItem value="id_proof">ID Proof</SelectItem>
                                  <SelectItem value="tax_form">Tax Form</SelectItem>
                                  <SelectItem value="certification">Certification</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Title</Label>
                              <Input
                                value={newDocument.title}
                                onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                                placeholder="e.g., Employment Agreement 2024"
                              />
                            </div>
                            <div>
                              <Label>Expiry Date (Optional)</Label>
                              <Input
                                type="date"
                                value={newDocument.expiry_date}
                                onChange={(e) => setNewDocument({ ...newDocument, expiry_date: e.target.value })}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleUploadDoc}>Upload Document</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Document</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Uploaded</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {documents?.map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <FileTextIcon className="h-4 w-4 text-blue-500" />
                                  {doc.title}
                                </div>
                              </TableCell>
                              <TableCell className="capitalize">{doc.document_type.replace('_', ' ')}</TableCell>
                              <TableCell>
                                <Badge variant={doc.status === 'verified' ? 'default' : 'secondary'}>
                                  {doc.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{format(new Date(doc.created_at), 'MMM d, yyyy')}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {documents?.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                No documents found for this employee.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="onboarding" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Onboarding Progress</CardTitle>
                      <CardDescription>Track completion of onboarding tasks</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {onboarding?.map((task) => (
                          <div key={task.id} className="flex items-start gap-4 p-3 border rounded-lg">
                            <div className="mt-1">
                              {task.status === 'completed' ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <Clock className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{task.title}</div>
                              <div className="text-sm text-muted-foreground">{task.description}</div>
                              {task.completed_at && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Completed on {format(new Date(task.completed_at), 'MMM d, yyyy')}
                                </div>
                              )}
                            </div>
                            {task.status !== 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateOnboardingMutation.mutate({ id: task.id, status: 'completed' })}
                              >
                                Mark Complete
                              </Button>
                            )}
                          </div>
                        ))}
                        {onboarding?.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No onboarding tasks assigned to this employee.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Performance Reviews</CardTitle>
                        <CardDescription>History of performance evaluations</CardDescription>
                      </div>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        New Review
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {performanceReviews?.map((review) => (
                          <div key={review.id} className="p-4 border rounded-lg space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">Review by {review.reviewer_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(review.review_date), 'MMM d, yyyy')}
                                </div>
                              </div>
                              <Badge>{review.rating} / 5</Badge>
                            </div>
                            <p className="text-sm line-clamp-2">{review.summary}</p>
                            <Button variant="link" size="sm" className="p-0 h-auto">View Full Review</Button>
                          </div>
                        ))}
                        {performanceReviews?.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No performance reviews found.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="assets" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Assigned Assets</CardTitle>
                      <CardDescription>Company equipment assigned to this employee</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Asset</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Serial Number</TableHead>
                            <TableHead>Condition</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assets?.map((asset) => (
                            <TableRow key={asset.id}>
                              <TableCell className="font-medium">{asset.asset_name}</TableCell>
                              <TableCell className="capitalize">{asset.asset_type}</TableCell>
                              <TableCell>{asset.serial_number || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{asset.condition_status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                          {assets?.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                No assets assigned to this employee.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="time-tracking" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Time Tracking</CardTitle>
                      <CardDescription>Recent time entries and hours</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="p-4 border rounded-lg bg-slate-50">
                          <div className="text-sm text-muted-foreground">Total Hours (30 Days)</div>
                          <div className="text-2xl font-bold">{timeData?.summary?.total_hours || 0}</div>
                        </div>
                        <div className="p-4 border rounded-lg bg-slate-50">
                          <div className="text-sm text-muted-foreground">Entries</div>
                          <div className="text-2xl font-bold">{timeData?.summary?.entry_count || 0}</div>
                        </div>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Start</TableHead>
                            <TableHead>End</TableHead>
                            <TableHead>Duration</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {timeData?.entries?.map((entry: any) => (
                            <TableRow key={entry.id}>
                              <TableCell>{format(new Date(entry.start_time), 'MMM d, yyyy')}</TableCell>
                              <TableCell>{format(new Date(entry.start_time), 'h:mm a')}</TableCell>
                              <TableCell>{entry.end_time ? format(new Date(entry.end_time), 'h:mm a') : 'Running'}</TableCell>
                              <TableCell>{entry.duration_minutes ? (entry.duration_minutes / 60).toFixed(1) + ' hrs' : '-'}</TableCell>
                            </TableRow>
                          ))}
                          {(!timeData?.entries || timeData.entries.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No recent time entries</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="shifts" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Shift Schedule</CardTitle>
                      <CardDescription>Upcoming and recent shifts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <CalendarClock className="h-4 w-4" /> Upcoming Shifts
                          </h4>
                          <div className="space-y-3">
                            {shiftData?.upcoming?.map((shift: any) => (
                              <div key={shift.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <div className="font-medium">{format(new Date(shift.start_time), 'EEEE, MMM d')}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {format(new Date(shift.start_time), 'h:mm a')} - {format(new Date(shift.end_time), 'h:mm a')}
                                  </div>
                                </div>
                                <Badge variant="outline" style={{ borderColor: shift.shift_type_color, color: shift.shift_type_color }}>
                                  {shift.shift_type_name || 'Shift'}
                                </Badge>
                              </div>
                            ))}
                            {(!shiftData?.upcoming || shiftData.upcoming.length === 0) && (
                              <div className="text-sm text-muted-foreground">No upcoming shifts scheduled</div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-3 text-muted-foreground">Recent History</h4>
                          <Table>
                            <TableBody>
                              {shiftData?.recent?.map((shift: any) => (
                                <TableRow key={shift.id}>
                                  <TableCell>{format(new Date(shift.start_time), 'MMM d, yyyy')}</TableCell>
                                  <TableCell>{format(new Date(shift.start_time), 'h:mm a')} - {format(new Date(shift.end_time), 'h:mm a')}</TableCell>
                                  <TableCell>{shift.shift_type_name}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="leave" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader><CardTitle>Leave & Time Off</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        {leaveData?.balances?.map((bal: any) => (
                          <div key={bal.type} className="p-4 border rounded-lg">
                            <div className="text-sm text-muted-foreground capitalize">{bal.type.replace('_', ' ')}</div>
                            <div className="text-2xl font-bold">{bal.remaining} <span className="text-sm font-normal text-muted-foreground">days</span></div>
                            <div className="text-xs text-muted-foreground mt-1">Used: {bal.used} | Allowance: {bal.allowance}</div>
                          </div>
                        ))}
                      </div>
                      <h4 className="font-medium mb-3">Recent Requests</h4>
                      <Table>
                        <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Dates</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {leaveData?.requests?.map((req: any) => (
                            <TableRow key={req.id}>
                              <TableCell className="capitalize">{req.leave_type.replace('_', ' ')}</TableCell>
                              <TableCell>{format(new Date(req.start_date), 'MMM d')} - {format(new Date(req.end_date), 'MMM d, yyyy')}</TableCell>
                              <TableCell><Badge>{req.status}</Badge></TableCell>
                            </TableRow>
                          ))}
                          {(!leaveData?.requests || leaveData.requests.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No leave requests found</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="payroll" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader><CardTitle>Payroll & Compensation</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                          <h4 className="font-medium flex items-center gap-2"><Banknote className="h-4 w-4" /> Compensation</h4>
                          <div className="p-4 border rounded-lg bg-slate-50">
                            <div className="text-sm text-muted-foreground">Base Salary</div>
                            <div className="text-2xl font-bold">${Number(payrollData?.compensation?.base_salary || 0).toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground capitalize">{payrollData?.compensation?.pay_frequency || 'Monthly'}</div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-medium flex items-center gap-2"><Clock className="h-4 w-4" /> Recent Payslips</h4>
                          <div className="space-y-2">
                            {payrollData?.recent_payroll?.map((rec: any) => (
                              <div key={rec.id} className="flex justify-between items-center p-3 border rounded-lg">
                                <div>
                                  <div className="font-medium">{format(new Date(rec.pay_period_end), 'MMM d, yyyy')}</div>
                                  <div className="text-xs text-muted-foreground">Net Pay: ${Number(rec.net_pay).toLocaleString()}</div>
                                </div>
                                <Badge variant="outline">{rec.status}</Badge>
                              </div>
                            ))}
                            {(!payrollData?.recent_payroll || payrollData.recent_payroll.length === 0) && (
                              <div className="text-sm text-muted-foreground">No recent payroll records</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
              <User className="h-12 w-12 mb-4 opacity-20" />
              <p>Select an employee from the list to view their details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

