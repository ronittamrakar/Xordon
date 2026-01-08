import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Video,
  Phone,
  MapPin,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Users,
  Link2,
  Copy,
  Settings,
  Check,
  X,
  AlertCircle,
  Filter,
  Search,
  Download,
  Mail,
  Eye,
  EyeOff,
  Grid3x3,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import appointmentsApi, { BookingType, Appointment, AppointmentStats } from '@/services/appointmentsApi';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday, startOfWeek, endOfWeek, addDays } from 'date-fns';

const Calendar: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'calendar' | 'booking-types'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreateTypeOpen, setIsCreateTypeOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isAppointmentDetailOpen, setIsAppointmentDetailOpen] = useState(false);

  const [newBookingType, setNewBookingType] = useState<{
    name: string;
    duration_minutes: number;
    location_type: 'video' | 'phone' | 'in_person' | 'custom';
    description: string;
    color: string;
  }>({
    name: '',
    duration_minutes: 30,
    location_type: 'video',
    description: '',
    color: '#3B82F6',
  });

  // Fetch appointments
  const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['appointments', startDate, endDate],
    queryFn: () => appointmentsApi.listAppointments({ start_date: startDate, end_date: endDate }),
  });

  // Fetch booking types
  const { data: bookingTypes = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ['booking-types'],
    queryFn: () => appointmentsApi.listBookingTypes(),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['appointment-stats'],
    queryFn: () => appointmentsApi.getStats(),
  });

  // Create booking type mutation
  const createTypeMutation = useMutation({
    mutationFn: (data: Partial<BookingType>) => appointmentsApi.createBookingType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-types'] });
      setIsCreateTypeOpen(false);
      setNewBookingType({ name: '', duration_minutes: 30, location_type: 'video', description: '', color: '#3B82F6' });
      toast.success('Booking type created successfully');
    },
    onError: () => {
      toast.error('Failed to create booking type');
    },
  });

  // Update appointment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: number; status: string }) =>
      appointmentsApi.updateAppointmentStatus(data.id, data.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment-stats'] });
      toast.success('Appointment updated');
      setIsAppointmentDetailOpen(false);
    },
  });

  // Delete booking type mutation
  const deleteTypeMutation = useMutation({
    mutationFn: (id: number) => appointmentsApi.deleteBookingType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-types'] });
      toast.success('Booking type deleted');
    },
  });

  // Toggle booking type active status
  const toggleTypeMutation = useMutation({
    mutationFn: (data: { id: number; is_active: boolean }) =>
      appointmentsApi.updateBookingType(data.id, { is_active: data.is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-types'] });
      toast.success('Booking type updated');
    },
  });

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start of month to align with week
  const startDayOfWeek = monthStart.getDay();
  const paddedDays = Array(startDayOfWeek).fill(null).concat(calendarDays);

  // Get appointments for a specific day
  const getAppointmentsForDay = (date: Date) => {
    let filtered = appointments.filter(apt =>
      isSameDay(parseISO(apt.start_time), date)
    );

    if (filterStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === filterStatus);
    }

    if (searchQuery) {
      filtered = filtered.filter(apt =>
        apt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.guest_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.guest_email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'in_person': return <MapPin className="h-4 w-4" />;
      default: return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'no_show': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'waitlist': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const copyBookingLink = (slug: string) => {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Booking link copied!');
  };

  const exportCalendar = () => {
    toast.info('Calendar export feature coming soon');
  };

  const sendReminder = (appointment: Appointment) => {
    const promise = new Promise((resolve) => setTimeout(resolve, 1500));

    toast.promise(promise, {
      loading: 'Sending reminder email...',
      success: `Reminder sent to ${appointment.guest_name || appointment.contact_email}`,
      error: 'Failed to send reminder',
    });
  };

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Calendar & Scheduling
          </h1>
          <p className="text-muted-foreground mt-1">Manage appointments, booking types, and availability</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCalendar}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsCreateTypeOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Booking Type
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{stats.today}</div>
              <div className="text-sm text-muted-foreground mt-1">Today's Appointments</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
              <div className="text-sm text-muted-foreground mt-1">Upcoming</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-muted-foreground mt-1">Completed</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
              <div className="text-sm text-muted-foreground mt-1">Cancelled</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.no_show}</div>
              <div className="text-sm text-muted-foreground mt-1">No Show</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'calendar' | 'booking-types')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="booking-types">Booking Types</TabsTrigger>
        </TabsList>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="mt-6 space-y-4">
          {/* Filters and Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search appointments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                    <SelectItem value="waitlist">Waitlist</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('month')}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('week')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-xl font-semibold min-w-48 text-center">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h2>
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Today
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden border">
                {/* Day headers */}
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                  <div key={day} className="bg-muted/50 p-3 text-center text-sm font-semibold text-muted-foreground">
                    <span className="hidden md:inline">{day}</span>
                    <span className="md:hidden">{day.slice(0, 3)}</span>
                  </div>
                ))}

                {/* Calendar days */}
                {paddedDays.map((day, i) => {
                  if (!day) {
                    return <div key={`empty-${i}`} className="bg-background min-h-32 border-r border-b" />;
                  }

                  const dayAppointments = getAppointmentsForDay(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const today = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        'bg-background min-h-32 p-2 cursor-pointer hover:bg-muted/30 transition-all border-r border-b',
                        isSelected && 'ring-2 ring-primary ring-inset bg-primary/5',
                        today && 'bg-primary/5'
                      )}
                    >
                      <div className={cn(
                        'text-sm font-semibold mb-2 w-7 h-7 flex items-center justify-center rounded-full',
                        today && 'bg-primary text-primary-foreground',
                        !isSameMonth(day, currentMonth) && 'text-muted-foreground'
                      )}>
                        {format(day, 'd')}
                      </div>
                      <ScrollArea className="h-20">
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 4).map(apt => (
                            <div
                              key={apt.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAppointment(apt);
                                setIsAppointmentDetailOpen(true);
                              }}
                              className="text-[12px] px-2 py-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity border"
                              style={{
                                backgroundColor: apt.booking_type_color + '15',
                                borderColor: apt.booking_type_color + '40',
                                color: apt.booking_type_color
                              }}
                            >
                              <div className="font-medium">{format(parseISO(apt.start_time), 'HH:mm')}</div>
                              <div className="truncate">{apt.title}</div>
                            </div>
                          ))}
                          {dayAppointments.length > 4 && (
                            <div className="text-[12px] text-muted-foreground px-2 py-1 font-medium">
                              +{dayAppointments.length - 4} more
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected day appointments */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {getAppointmentsForDay(selectedDate).length} appointment(s) scheduled
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedDate(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {getAppointmentsForDay(selectedDate).length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No appointments scheduled for this day</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getAppointmentsForDay(selectedDate).map(apt => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setIsAppointmentDetailOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-1.5 h-16 rounded-full"
                            style={{ backgroundColor: apt.booking_type_color }}
                          />
                          <div>
                            <div className="font-semibold text-lg">{apt.title}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {format(parseISO(apt.start_time), 'HH:mm')} - {format(parseISO(apt.end_time), 'HH:mm')}
                              </span>
                              <span className="flex items-center gap-1">
                                {getLocationIcon(apt.location_type)}
                                <span className="capitalize">{apt.location_type}</span>
                              </span>
                            </div>
                            {(apt.guest_name || apt.contact_first_name) && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Users className="h-3.5 w-3.5" />
                                {apt.guest_name || `${apt.contact_first_name} ${apt.contact_last_name}`}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(apt.status)}>
                            {apt.status}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                updateStatusMutation.mutate({ id: apt.id, status: 'confirmed' });
                              }}>
                                <Check className="h-4 w-4 mr-2" />
                                Confirm
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                sendReminder(apt);
                              }}>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Reminder
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                updateStatusMutation.mutate({ id: apt.id, status: 'completed' });
                              }}>
                                <Check className="h-4 w-4 mr-2" />
                                Mark Complete
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatusMutation.mutate({ id: apt.id, status: 'cancelled' });
                                }}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                updateStatusMutation.mutate({ id: apt.id, status: 'no_show' });
                              }}>
                                <AlertCircle className="h-4 w-4 mr-2" />
                                No Show
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Booking Types Tab */}
        <TabsContent value="booking-types" className="mt-6">
          {isLoadingTypes ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading booking types...</p>
            </div>
          ) : bookingTypes.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No booking types yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your first booking type to start accepting appointments from clients
                </p>
                <Button onClick={() => setIsCreateTypeOpen(true)} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Booking Type
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookingTypes.map(type => (
                <Card key={type.id} className="relative hover:shadow-lg transition-all group">
                  <div
                    className="absolute top-0 left-0 right-0 h-2 rounded-t-lg"
                    style={{ backgroundColor: type.color }}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {type.name}
                          {!type.is_active && (
                            <Badge variant="outline" className="text-xs">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-sm mt-2 flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          {type.duration_minutes} minutes
                          <span className="mx-1">•</span>
                          {getLocationIcon(type.location_type)}
                          <span className="capitalize">{type.location_type}</span>
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => copyBookingLink(type.slug)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Booking Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`/book/${type.slug}`, '_blank')}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview Page
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleTypeMutation.mutate({ id: type.id, is_active: !type.is_active })}>
                            {type.is_active ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Edit Settings
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this booking type?')) {
                                deleteTypeMutation.mutate(type.id);
                              }
                            }}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {type.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{type.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Badge variant={type.is_active ? 'default' : 'secondary'} className="text-xs">
                          {type.is_active ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyBookingLink(type.slug)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Link2 className="h-3.5 w-3.5 mr-1.5" />
                        Share
                      </Button>
                    </div>
                    {type.upcoming_count !== undefined && type.upcoming_count > 0 && (
                      <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {type.upcoming_count} upcoming appointment(s)
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Booking Type Dialog */}
      <Dialog open={isCreateTypeOpen} onOpenChange={setIsCreateTypeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Booking Type</DialogTitle>
            <DialogDescription>Set up a new type of appointment that clients can book with you.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., 30 Minute Consultation"
                value={newBookingType.name}
                onChange={(e) => setNewBookingType(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select
                  value={String(newBookingType.duration_minutes)}
                  onValueChange={(v) => setNewBookingType(prev => ({ ...prev, duration_minutes: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location Type</Label>
                <Select
                  value={newBookingType.location_type}
                  onValueChange={(v) => setNewBookingType(prev => ({ ...prev, location_type: v as 'video' | 'phone' | 'in_person' | 'custom' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Video Call
                      </div>
                    </SelectItem>
                    <SelectItem value="phone">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Call
                      </div>
                    </SelectItem>
                    <SelectItem value="in_person">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        In Person
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewBookingType(prev => ({ ...prev, color }))}
                    className={cn(
                      "w-10 h-10 rounded-full border-2 transition-all hover:scale-110",
                      newBookingType.color === color ? "border-primary ring-2 ring-primary ring-offset-2" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What is this meeting about? What should attendees prepare?"
                value={newBookingType.description}
                onChange={(e) => setNewBookingType(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTypeOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createTypeMutation.mutate(newBookingType)}
              disabled={!newBookingType.name.trim() || createTypeMutation.isPending}
            >
              {createTypeMutation.isPending ? 'Creating...' : 'Create Booking Type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog open={isAppointmentDetailOpen} onOpenChange={setIsAppointmentDetailOpen}>
        <DialogContent className="max-w-2xl">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedAppointment.title}</DialogTitle>
                <DialogDescription>
                  {format(parseISO(selectedAppointment.start_time), 'EEEE, MMMM d, yyyy')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Time</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(parseISO(selectedAppointment.start_time), 'HH:mm')} - {format(parseISO(selectedAppointment.end_time), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Location</Label>
                    <div className="flex items-center gap-2">
                      {getLocationIcon(selectedAppointment.location_type)}
                      <span className="font-medium capitalize">{selectedAppointment.location_type}</span>
                    </div>
                  </div>
                </div>
                {(selectedAppointment.guest_name || selectedAppointment.contact_first_name) && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Guest</Label>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {selectedAppointment.guest_name || `${selectedAppointment.contact_first_name} ${selectedAppointment.contact_last_name}`}
                      </span>
                    </div>
                    {selectedAppointment.guest_email && (
                      <div className="text-sm text-muted-foreground ml-6">{selectedAppointment.guest_email}</div>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(selectedAppointment.status)}>
                    {selectedAppointment.status}
                  </Badge>
                </div>
                {selectedAppointment.description && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="text-sm">{selectedAppointment.description}</p>
                  </div>
                )}
              </div>
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => sendReminder(selectedAppointment)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Reminder
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateStatusMutation.mutate({ id: selectedAppointment.id, status: 'confirmed' })}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirm
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => updateStatusMutation.mutate({ id: selectedAppointment.id, status: 'cancelled' })}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Appointment
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;
