import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  RefreshCw, 
  User, 
  Video, 
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || '/api';

async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  
  return (await res.json()) as T;
}

interface Meeting {
  id: number;
  contact_id: number;
  user_id: number;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  location?: string;
  meeting_link?: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'rescheduled' | 'completed' | 'no_show';
  contact_name?: string;
  contact_email?: string;
  created_at: string;
}

interface Contact {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
}

interface MeetingSchedulerProps {
  contactId?: number;
  onMeetingBooked?: (meeting: Meeting) => void;
  onMeetingUpdated?: (meeting: Meeting) => void;
}


export const MeetingScheduler: React.FC<MeetingSchedulerProps> = ({
  contactId,
  onMeetingBooked,
  onMeetingUpdated
}) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [activeTab, setActiveTab] = useState('calendar');
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    contact_id: contactId?.toString() || '',
    title: '',
    description: '',
    scheduled_date: format(new Date(), 'yyyy-MM-dd'),
    scheduled_time: '10:00',
    duration: '30',
    location: '',
    meeting_link: ''
  });

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (contactId) params.append('contact_id', contactId.toString());
      
      const response = await apiRequest<{ success: boolean; data: Meeting[] }>('GET', `/meetings?${params}`);
      if (response.success) {
        setMeetings(response.data);
      }
    } catch (err) {
      setError('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: Contact[] }>('GET', '/contacts?limit=100');
      if (response.success) {
        setContacts(response.data);
      }
    } catch (err) {
      console.error('Failed to load contacts', err);
    }
  };

  useEffect(() => {
    fetchMeetings();
    if (!contactId) {
      fetchContacts();
    }
  }, [contactId]);

  const handleBookMeeting = async () => {
    try {
      const scheduledAt = `${bookingForm.scheduled_date} ${bookingForm.scheduled_time}:00`;
      
      const response = await apiRequest<{ success: boolean; data: Meeting }>('POST', '/meetings', {
        contact_id: parseInt(bookingForm.contact_id),
        title: bookingForm.title,
        description: bookingForm.description || undefined,
        scheduled_at: scheduledAt,
        duration_minutes: parseInt(bookingForm.duration),
        location: bookingForm.location || undefined,
        meeting_link: bookingForm.meeting_link || undefined
      });

      if (response.success) {
        setMeetings([...meetings, response.data]);
        setIsBookingOpen(false);
        resetBookingForm();
        onMeetingBooked?.(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to book meeting');
    }
  };

  const handleUpdateStatus = async (meetingId: number, status: string, options?: Record<string, unknown>) => {
    try {
      const response = await apiRequest<{ success: boolean; data: Meeting }>(
        'PUT',
        `/meetings/${meetingId}/status`,
        { status, ...options }
      );

      if (response.success) {
        setMeetings(meetings.map(m => 
          m.id === meetingId ? { ...m, status: status as Meeting['status'] } : m
        ));
        setIsStatusDialogOpen(false);
        setSelectedMeeting(null);
        onMeetingUpdated?.(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update meeting status');
    }
  };

  const resetBookingForm = () => {
    setBookingForm({
      contact_id: contactId?.toString() || '',
      title: '',
      description: '',
      scheduled_date: format(new Date(), 'yyyy-MM-dd'),
      scheduled_time: '10:00',
      duration: '30',
      location: '',
      meeting_link: ''
    });
  };

  const getStatusBadge = (status: Meeting['status']) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-500', icon: CalendarIcon, label: 'Scheduled' },
      confirmed: { color: 'bg-green-500', icon: CheckCircle, label: 'Confirmed' },
      cancelled: { color: 'bg-red-500', icon: XCircle, label: 'Cancelled' },
      rescheduled: { color: 'bg-yellow-500', icon: AlertCircle, label: 'Rescheduled' },
      completed: { color: 'bg-gray-500', icon: CheckCircle, label: 'Completed' },
      no_show: { color: 'bg-orange-500', icon: XCircle, label: 'No Show' }
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getMeetingsForDate = (date: Date) => {
    return meetings.filter(m => isSameDay(new Date(m.scheduled_at), date));
  };

  const getContactName = (contact: Contact) => {
    if (contact.name) return contact.name;
    if (contact.first_name || contact.last_name) {
      return `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    }
    return contact.email || 'Unknown';
  };


  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00'
  ];

  const durations = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
    { value: '120', label: '2 hours' }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Meeting Scheduler
          </CardTitle>
          <CardDescription>
            Schedule and manage meetings with contacts
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchMeetings}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Book Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Book New Meeting</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {!contactId && (
                  <div className="space-y-2">
                    <Label>Contact</Label>
                    <Select 
                      value={bookingForm.contact_id} 
                      onValueChange={(v) => setBookingForm({...bookingForm, contact_id: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map(contact => (
                          <SelectItem key={contact.id} value={contact.id.toString()}>
                            {getContactName(contact)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Meeting Title</Label>
                  <Input
                    value={bookingForm.title}
                    onChange={(e) => setBookingForm({...bookingForm, title: e.target.value})}
                    placeholder="e.g., Discovery Call"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={bookingForm.scheduled_date}
                      onChange={(e) => setBookingForm({...bookingForm, scheduled_date: e.target.value})}
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Select 
                      value={bookingForm.scheduled_time} 
                      onValueChange={(v) => setBookingForm({...bookingForm, scheduled_time: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select 
                    value={bookingForm.duration} 
                    onValueChange={(v) => setBookingForm({...bookingForm, duration: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durations.map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Location (optional)</Label>
                  <Input
                    value={bookingForm.location}
                    onChange={(e) => setBookingForm({...bookingForm, location: e.target.value})}
                    placeholder="e.g., Conference Room A"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Meeting Link (optional)</Label>
                  <Input
                    value={bookingForm.meeting_link}
                    onChange={(e) => setBookingForm({...bookingForm, meeting_link: e.target.value})}
                    placeholder="e.g., https://zoom.us/j/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={bookingForm.description}
                    onChange={(e) => setBookingForm({...bookingForm, description: e.target.value})}
                    placeholder="Meeting agenda or notes..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBookingOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleBookMeeting}
                  disabled={!bookingForm.contact_id || !bookingForm.title}
                >
                  Book Meeting
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>


      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
            {error}
            <Button variant="link" className="ml-2 p-0 h-auto" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                  modifiers={{
                    hasMeeting: meetings.map(m => new Date(m.scheduled_at))
                  }}
                  modifiersStyles={{
                    hasMeeting: { fontWeight: 'bold', textDecoration: 'underline' }
                  }}
                />
              </div>
              <div>
                <h3 className="font-semibold mb-3">
                  Meetings on {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
                <div className="space-y-3">
                  {getMeetingsForDate(selectedDate).length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No meetings scheduled for this date.
                    </p>
                  ) : (
                    getMeetingsForDate(selectedDate).map(meeting => (
                      <div 
                        key={meeting.id} 
                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          setSelectedMeeting(meeting);
                          setIsStatusDialogOpen(true);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{meeting.title}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(meeting.scheduled_at), 'h:mm a')}
                              <span>({meeting.duration_minutes} min)</span>
                            </div>
                            {meeting.contact_name && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <User className="h-3 w-3" />
                                {meeting.contact_name}
                              </div>
                            )}
                          </div>
                          {getStatusBadge(meeting.status)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list">
            <div className="space-y-3">
              {meetings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No meetings scheduled. Click "Book Meeting" to schedule one.
                </p>
              ) : (
                meetings
                  .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                  .map(meeting => (
                    <div 
                      key={meeting.id} 
                      className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setSelectedMeeting(meeting);
                        setIsStatusDialogOpen(true);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <p className="font-medium">{meeting.title}</p>
                            {getStatusBadge(meeting.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              {format(new Date(meeting.scheduled_at), 'MMM d, yyyy')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(meeting.scheduled_at), 'h:mm a')}
                              <span>({meeting.duration_minutes} min)</span>
                            </div>
                            {meeting.contact_name && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {meeting.contact_name}
                              </div>
                            )}
                            {meeting.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {meeting.location}
                              </div>
                            )}
                            {meeting.meeting_link && (
                              <div className="flex items-center gap-1">
                                <Video className="h-3 w-3" />
                                <a 
                                  href={meeting.meeting_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Join Meeting
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </TabsContent>
        </Tabs>


        {/* Status Update Dialog */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Meeting Details</DialogTitle>
            </DialogHeader>
            {selectedMeeting && (
              <div className="space-y-4 py-4">
                <div>
                  <h4 className="font-semibold text-lg">{selectedMeeting.title}</h4>
                  <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {format(new Date(selectedMeeting.scheduled_at), 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {format(new Date(selectedMeeting.scheduled_at), 'h:mm a')} ({selectedMeeting.duration_minutes} minutes)
                    </div>
                    {selectedMeeting.contact_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {selectedMeeting.contact_name}
                        {selectedMeeting.contact_email && ` (${selectedMeeting.contact_email})`}
                      </div>
                    )}
                    {selectedMeeting.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {selectedMeeting.location}
                      </div>
                    )}
                    {selectedMeeting.meeting_link && (
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        <a 
                          href={selectedMeeting.meeting_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {selectedMeeting.meeting_link}
                        </a>
                      </div>
                    )}
                  </div>
                  {selectedMeeting.description && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm">{selectedMeeting.description}</p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <Label className="mb-2 block">Update Status</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedMeeting.status !== 'confirmed' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-green-500 text-green-600 hover:bg-green-50"
                        onClick={() => handleUpdateStatus(selectedMeeting.id, 'confirmed')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirm
                      </Button>
                    )}
                    {selectedMeeting.status !== 'completed' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateStatus(selectedMeeting.id, 'completed')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Completed
                      </Button>
                    )}
                    {selectedMeeting.status !== 'cancelled' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-red-500 text-red-600 hover:bg-red-50"
                        onClick={() => handleUpdateStatus(selectedMeeting.id, 'cancelled')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                    {selectedMeeting.status !== 'no_show' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-orange-500 text-orange-600 hover:bg-orange-50"
                        onClick={() => handleUpdateStatus(selectedMeeting.id, 'no_show')}
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        No Show
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-muted-foreground">
                    Current Status: {getStatusBadge(selectedMeeting.status)}
                  </span>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default MeetingScheduler;
