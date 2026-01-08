import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { api } from '@/lib/api';

import {
  Plus, Search, Filter, Calendar, Clock, MapPin, User, Phone,
  Navigation, CheckCircle, XCircle, Pause, Loader, Send, AlertTriangle,
  Truck, Wrench, DollarSign, FileTextIcon, MoreHorizontal, RefreshCw, Trash2,
  CalendarIcon, Info, HelpCircle
} from 'lucide-react';
import { Job, JobStatus, JobPriority, JOB_STATUS_CONFIG } from '@/types/industry';

const MOBILE_SETTINGS_KEY = 'xordon_mobile_settings_v1';

const STATUS_OPTIONS: { value: JobStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'en_route', label: 'En Route' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'on_hold', label: 'On Hold' },
];

const PRIORITY_OPTIONS: { value: JobPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'emergency', label: 'Emergency', color: 'bg-red-100 text-red-800' },
];

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [compactLists, setCompactLists] = useState(false);
  const [oneTapActions, setOneTapActions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState('board');

  const [jobType, setJobType] = useState<'one-off' | 'recurring'>('one-off');
  const [scheduleType, setScheduleType] = useState<'anytime' | 'specific'>('anytime');
  const [lineItems, setLineItems] = useState<Array<{
    id: string;
    name: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>>([]);

  const [formData, setFormData] = useState({
    contact_id: '',
    service_id: '',
    assigned_to: '',
    title: '',
    description: '',
    priority: 'normal' as JobPriority,
    job_type: '',
    service_address: '',
    service_city: '',
    service_state: '',
    service_zip: '',
    scheduled_date: '',
    scheduled_time_start: '',
    scheduled_time_end: '',
    estimated_duration: 60,
    estimated_cost: 0,
    internal_notes: '',
    customer_notes: '',
    recurring_pattern: '',
    send_invoice_on_completion: false,
    // For towing/transport
    pickup_address: '',
    dropoff_address: '',
    vehicle_year: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_color: '',
  });

  useEffect(() => {
    loadData();
  }, [statusFilter, priorityFilter, assignedFilter]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MOBILE_SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { compactLists?: boolean; oneTapActions?: boolean };
      if (typeof parsed.compactLists === 'boolean') setCompactLists(parsed.compactLists);
      if (typeof parsed.oneTapActions === 'boolean') setOneTapActions(parsed.oneTapActions);
    } catch {
      // ignore
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (assignedFilter !== 'all') params.assigned_to = assignedFilter;

      const [jobsRes, staffRes, contactsRes, servicesRes] = await Promise.all([
        api.get('/operations/jobs', { params }),
        api.get('/operations/staff'),
        api.get('/contacts'),
        api.get('/operations/services'),
      ]);

      setJobs((jobsRes.data as any)?.items || []);
      setStaff((staffRes.data as any)?.items || []);
      setContacts((contactsRes.data as any)?.items || (contactsRes.data as any)?.contacts || []);
      setServices((servicesRes.data as any)?.items || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const createJob = async () => {
    try {
      const payload = {
        ...formData,
        vehicle_info: formData.vehicle_year ? {
          year: formData.vehicle_year,
          make: formData.vehicle_make,
          model: formData.vehicle_model,
          color: formData.vehicle_color,
        } : undefined,
      };

      await api.post('/operations/jobs', payload);
      toast.success('Job created successfully');
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to create job:', error);
      toast.error('Failed to create job');
    }
  };

  const updateJobStatus = async (jobId: number, newStatus: JobStatus, notes?: string) => {
    try {
      await api.put(`/operations/jobs/${jobId}`, { status: newStatus, status_notes: notes });
      toast.success(`Job status updated to ${newStatus}`);
      loadData();
    } catch (error) {
      console.error('Failed to update job:', error);
      toast.error('Failed to update job status');
    }
  };

  const addLineItem = () => {
    const newItem = {
      id: Date.now().toString(),
      name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (id: string, field: string, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updated.total = updated.quantity * updated.unit_price;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.total, 0);
  };

  const resetForm = () => {
    setFormData({
      contact_id: '',
      service_id: '',
      assigned_to: '',
      title: '',
      description: '',
      priority: 'normal',
      job_type: '',
      service_address: '',
      service_city: '',
      service_state: '',
      service_zip: '',
      scheduled_date: '',
      scheduled_time_start: '',
      scheduled_time_end: '',
      estimated_duration: 60,
      estimated_cost: 0,
      internal_notes: '',
      customer_notes: '',
      recurring_pattern: '',
      send_invoice_on_completion: false,
      pickup_address: '',
      dropoff_address: '',
      vehicle_year: '',
      vehicle_make: '',
      vehicle_model: '',
      vehicle_color: '',
    });
    setJobType('one-off');
    setScheduleType('anytime');
    setLineItems([]);
  };

  const getStatusBadge = (status: JobStatus) => {
    const config = JOB_STATUS_CONFIG[status];
    return (
      <Badge style={{ backgroundColor: config.color + '20', color: config.color, borderColor: config.color }}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: JobPriority) => {
    const config = PRIORITY_OPTIONS.find(p => p.value === priority);
    return <Badge className={config?.color}>{config?.label}</Badge>;
  };

  const filteredJobs = jobs.filter(job => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        job.title.toLowerCase().includes(search) ||
        job.jobNumber?.toLowerCase().includes(search) ||
        job.contact?.firstName?.toLowerCase().includes(search) ||
        job.contact?.lastName?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Group jobs by status for board view
  const jobsByStatus = STATUS_OPTIONS.reduce((acc, status) => {
    acc[status.value] = filteredJobs.filter(j => j.status === status.value);
    return acc;
  }, {} as Record<JobStatus, Job[]>);

  const stats = {
    total: jobs.length,
    new: jobs.filter(j => j.status === 'new').length,
    inProgress: jobs.filter(j => ['dispatched', 'en_route', 'arrived', 'in_progress'].includes(j.status)).length,
    completed: jobs.filter(j => j.status === 'completed').length,
    emergency: jobs.filter(j => j.priority === 'emergency').length,
  };

  return (

    <div className={compactLists ? 'space-y-4' : 'space-y-6'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobs & Dispatch</h1>
          <p className="text-muted-foreground">Manage service jobs, dispatch technicians, and track progress</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Job
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">Total Jobs</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-muted-foreground">New</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.new}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Loader className="h-5 w-5 text-orange-600" />
              <span className="text-sm text-muted-foreground">In Progress</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">Completed</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-muted-foreground">Emergency</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.emergency}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {PRIORITY_OPTIONS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assignedFilter} onValueChange={setAssignedFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Assigned To" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {staff.map(s => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="board">Board View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {['new', 'scheduled', 'en_route', 'in_progress', 'completed'].map(status => (
              <div key={status} className="rounded-lg border bg-card p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: JOB_STATUS_CONFIG[status as JobStatus].color }}
                    />
                    <span className="font-medium">{JOB_STATUS_CONFIG[status as JobStatus].label}</span>
                  </div>
                  <Badge variant="secondary">{jobsByStatus[status as JobStatus]?.length || 0}</Badge>
                </div>
                <div className="space-y-3">
                  {jobsByStatus[status as JobStatus]?.map(job => (
                    <Card
                      key={job.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedJob(job)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs text-muted-foreground">{job.jobNumber}</span>
                          {getPriorityBadge(job.priority)}
                        </div>
                        <h4 className="font-medium text-sm mb-1 line-clamp-1">{job.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {job.contact?.firstName} {job.contact?.lastName}
                        </p>
                        {job.scheduledDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(job.scheduledDate).toLocaleDateString()}
                            {job.scheduledTimeStart && ` at ${job.scheduledTimeStart}`}
                          </div>
                        )}
                        {job.assignedStaff && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <User className="h-3 w-3" />
                            {job.assignedStaff.name}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {(!jobsByStatus[status as JobStatus] || jobsByStatus[status as JobStatus].length === 0) && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No jobs
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map(job => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-sm">{job.jobNumber}</TableCell>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>
                        {job.contact?.firstName} {job.contact?.lastName}
                      </TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>{getPriorityBadge(job.priority)}</TableCell>
                      <TableCell>{job.assignedStaff?.name || '-'}</TableCell>
                      <TableCell>
                        {job.scheduledDate ? (
                          <span className="text-sm">
                            {new Date(job.scheduledDate).toLocaleDateString()}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {oneTapActions && Boolean(job.contact?.phone) && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.location.href = `tel:${job.contact?.phone}`;
                                }}
                                title="Call"
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.location.href = `sms:${job.contact?.phone}`;
                                }}
                                title="Send SMS"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          <Button variant="ghost" size="sm" type="button" onClick={() => setSelectedJob(job)}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredJobs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No jobs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Calendar Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Jobs Calendar</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Today
                    </Button>
                    <Button variant="outline" size="sm">Previous</Button>
                    <Button variant="outline" size="sm">Next</Button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Day Headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-semibold text-sm p-2 border-b">
                      {day}
                    </div>
                  ))}

                  {/* Calendar Days */}
                  {Array.from({ length: 35 }, (_, i) => {
                    const today = new Date();
                    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    const dayOffset = startOfMonth.getDay();
                    const dayNumber = i - dayOffset + 1;
                    const currentDate = new Date(today.getFullYear(), today.getMonth(), dayNumber);
                    const dateStr = currentDate.toISOString().split('T')[0];

                    const dayJobs = jobs.filter(j => j.scheduledDate === dateStr);
                    const isCurrentMonth = dayNumber > 0 && dayNumber <= new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                    const isToday = dateStr === today.toISOString().split('T')[0];

                    return (
                      <div
                        key={i}
                        className={`min-h-[100px] p-2 border rounded-lg ${!isCurrentMonth ? 'bg-muted/20' : 'bg-background'
                          } ${isToday ? 'border-primary border-2' : ''}`}
                      >
                        {isCurrentMonth && (
                          <>
                            <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                              {dayNumber}
                            </div>
                            <div className="space-y-1">
                              {dayJobs.slice(0, 3).map(job => (
                                <div
                                  key={job.id}
                                  className="text-xs p-1 rounded cursor-pointer hover:opacity-80"
                                  style={{ backgroundColor: JOB_STATUS_CONFIG[job.status].color + '20' }}
                                  onClick={() => setSelectedJob(job)}
                                >
                                  <div className="font-medium truncate">{job.title}</div>
                                  {job.scheduledTimeStart && (
                                    <div className="text-muted-foreground">{job.scheduledTimeStart}</div>
                                  )}
                                </div>
                              ))}
                              {dayJobs.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                  +{dayJobs.length - 3} more
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <span className="text-sm font-medium">Status:</span>
                  {Object.entries(JOB_STATUS_CONFIG).slice(0, 5).map(([key, config]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-sm">{config.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Map Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Jobs Map View</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Navigation className="h-4 w-4 mr-2" />
                      Optimize Routes
                    </Button>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Show" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Jobs</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Map Placeholder with Job Markers */}
                <div className="relative h-[600px] bg-muted/20 rounded-lg border-2 border-dashed overflow-hidden">
                  {/* Map Background */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground mb-2">Interactive Map Integration</p>
                      <p className="text-sm text-muted-foreground">
                        Connect Google Maps or Mapbox API to enable interactive mapping
                      </p>
                    </div>
                  </div>

                  {/* Job Markers Simulation */}
                  <div className="absolute inset-0 p-8">
                    <div className="grid grid-cols-3 gap-4 h-full">
                      {filteredJobs.filter(j => j.serviceAddress).slice(0, 9).map((job, index) => (
                        <div
                          key={job.id}
                          className="relative"
                          style={{ 
                            gridColumn: (index % 3) + 1,
                            gridRow: Math.floor(index / 3) + 1
                          }}
                        >
                          <div
                            className="absolute cursor-pointer hover:scale-110 transition-transform"
                            style={{
                              left: `${20 + (index % 3) * 30}%`,
                              top: `${20 + Math.floor(index / 3) * 30}%`
                            }}
                            onClick={() => setSelectedJob(job)}
                          >
                            <div className="relative">
                              <MapPin
                                className="h-8 w-8"
                                style={{ color: JOB_STATUS_CONFIG[job.status].color }}
                                fill={JOB_STATUS_CONFIG[job.status].color}
                              />
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-background border rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg opacity-0 hover:opacity-100 transition-opacity">
                                {job.title}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Jobs List Below Map */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredJobs.filter(j => j.serviceAddress).slice(0, 6).map(job => (
                    <Card key={job.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedJob(job)}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <MapPin
                            className="h-5 w-5 flex-shrink-0 mt-0.5"
                            style={{ color: JOB_STATUS_CONFIG[job.status].color }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{job.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {job.serviceAddress}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {getStatusBadge(job.status)}
                              {job.scheduledDate && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(job.scheduledDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Map Legend */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <span className="text-sm font-medium">Job Status:</span>
                  {Object.entries(JOB_STATUS_CONFIG).slice(0, 5).map(([key, config]) => (
                    <div key={key} className="flex items-center gap-2">
                      <MapPin
                        className="h-4 w-4"
                        style={{ color: config.color }}
                        fill={config.color}
                      />
                      <span className="text-sm">{config.label}</span>
                    </div>
                  ))}
                </div>

                {/* Integration Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm text-blue-900">Map Integration Available</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        To enable full interactive mapping with route optimization, connect your Google Maps or Mapbox API key in Settings → Integrations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Job Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              New Job
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter job title"
              />
            </div>

            {/* Client and Job # */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select a client</Label>
                <Select value={formData.contact_id} onValueChange={(v) => setFormData({ ...formData, contact_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.firstName || c.first_name} {c.lastName || c.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Job #</Label>
                <Input placeholder="Auto-generated" disabled />
              </div>
            </div>

            {/* Salesperson and Field Reps */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Salesperson</Label>
                <Select value={formData.assigned_to} onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Want to customize?</Label>
                <Button variant="outline" className="w-full justify-start text-muted-foreground">
                  Add Field
                </Button>
              </div>
            </div>

            <Separator />

            {/* Job Type */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Job type</Label>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={jobType === 'one-off' ? 'default' : 'outline'}
                  onClick={() => setJobType('one-off')}
                  className="flex-1"
                >
                  One-off
                </Button>
                <Button
                  type="button"
                  variant={jobType === 'recurring' ? 'default' : 'outline'}
                  onClick={() => setJobType('recurring')}
                  className="flex-1"
                >
                  Recurring
                </Button>
              </div>
            </div>

            <Separator />

            {/* Schedule */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Schedule</Label>
                <Button variant="link" className="text-sm text-primary">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Show Calendar
                </Button>
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">Total visits</Label>
                <Input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  placeholder="Dec 19, 2025"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm">Scheduled date</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Start time</Label>
                    <Input
                      type="time"
                      value={formData.scheduled_time_start}
                      onChange={(e) => setFormData({ ...formData, scheduled_time_start: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">End time</Label>
                    <Input
                      type="time"
                      value={formData.scheduled_time_end}
                      onChange={(e) => setFormData({ ...formData, scheduled_time_end: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-1" />
                  Anytime
                </Button>
                <Button variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-1" />
                  AM
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Assign team members</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Enter first name or last name" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Add a job form</Label>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    Assign custom job forms to your jobs so that they can be filled out by your team members.
                  </p>
                  <Button variant="link" className="text-sm text-primary px-0 mt-2">
                    Create a job form in Settings
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Visit instructions</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter any special instructions for this visit"
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Billing */}
            <div className="space-y-4">
              <Label className="text-base">Billing</Label>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="send-invoice"
                  checked={formData.send_invoice_on_completion}
                  onCheckedChange={(checked) => setFormData({ ...formData, send_invoice_on_completion: checked as boolean })}
                />
                <label
                  htmlFor="send-invoice"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Send invoice on job completion - RECOMMENDED
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="split-invoice" />
                <label
                  htmlFor="split-invoice"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Split the invoice across visits with a payment schedule
                </label>
              </div>
            </div>

            <Separator />

            {/* Product / Service */}
            <div className="space-y-4">
              <Label className="text-base">Product / Service</Label>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Name</TableHead>
                      <TableHead className="w-[250px]">Description</TableHead>
                      <TableHead className="w-[100px]">Quantity</TableHead>
                      <TableHead className="w-[120px]">Unit price</TableHead>
                      <TableHead className="w-[120px]">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Input
                            value={item.name}
                            onChange={(e) => updateLineItem(item.id, 'name', e.target.value)}
                            placeholder="Name"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                            placeholder="Description"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                            placeholder="Rs 0.00"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">Rs {item.total.toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {lineItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No items added yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <Button variant="outline" onClick={addLineItem} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Line Item
              </Button>

              <div className="flex justify-end items-center gap-8 pt-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total cost</p>
                  <p className="text-2xl font-bold">Rs {calculateTotal().toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total price</p>
                  <p className="text-2xl font-bold">Rs {calculateTotal().toFixed(2)}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-4">
              <Label className="text-base">Notes</Label>
              <Textarea
                value={formData.internal_notes}
                onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                placeholder="Leave an internal note for yourself or a team member"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={createJob} disabled={!formData.contact_id || !formData.title} className="bg-green-600 hover:bg-green-700">
              Save Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Details Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selectedJob?.jobNumber}</span>
              {selectedJob && getStatusBadge(selectedJob.status)}
            </DialogTitle>
            <DialogDescription>{selectedJob?.title}</DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Customer</Label>
                  <p className="font-medium">
                    {selectedJob.contact?.firstName} {selectedJob.contact?.lastName}
                  </p>
                  {selectedJob.contact?.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {selectedJob.contact.phone}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Assigned To</Label>
                  <p className="font-medium">{selectedJob.assignedStaff?.name || 'Unassigned'}</p>
                </div>
              </div>

              {selectedJob.serviceAddress && (
                <div>
                  <Label className="text-muted-foreground">Service Location</Label>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedJob.serviceAddress}, {selectedJob.serviceCity}, {selectedJob.serviceState} {selectedJob.serviceZip}
                  </p>
                </div>
              )}

              {selectedJob.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p>{selectedJob.description}</p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Update Status</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {STATUS_OPTIONS.filter(s => s.value !== selectedJob.status).map(status => (
                    <Button
                      key={status.value}
                      variant="outline"
                      size="sm"
                      onClick={() => updateJobStatus(selectedJob.id, status.value)}
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>

  );
}

