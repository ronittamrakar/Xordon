import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar, Clock, Users, Settings, Trash2, Edit, Eye, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import calendarsApi, { Calendar as CalendarType } from '@/services/calendarsApi';
import CalendarSyncSettings from '@/components/CalendarSyncSettings';

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Kathmandu',
  'Australia/Sydney',
  'UTC',
];

interface CalendarFormData {
  name: string;
  description: string;
  timezone: string;
  min_notice_hours: number;
  max_advance_days: number;
  slot_interval_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  is_public: boolean;
  color: string;
}

interface CalendarFormProps {
  onSubmit: () => void;
  submitLabel: string;
  formData: CalendarFormData;
  setFormData: (data: CalendarFormData) => void;
}

const CalendarForm = ({ onSubmit, submitLabel, formData, setFormData }: CalendarFormProps) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">Calendar Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Main Calendar"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select value={formData.timezone} onValueChange={(v) => setFormData({ ...formData, timezone: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>{tz}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="description">Description</Label>
      <Input
        id="description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Optional description"
      />
    </div>

    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label>Min Notice (hours)</Label>
        <Input
          type="number"
          value={formData.min_notice_hours}
          onChange={(e) => setFormData({ ...formData, min_notice_hours: parseInt(e.target.value) || 0 })}
        />
      </div>
      <div className="space-y-2">
        <Label>Max Advance (days)</Label>
        <Input
          type="number"
          value={formData.max_advance_days}
          onChange={(e) => setFormData({ ...formData, max_advance_days: parseInt(e.target.value) || 0 })}
        />
      </div>
      <div className="space-y-2">
        <Label>Slot Interval (min)</Label>
        <Select
          value={String(formData.slot_interval_minutes)}
          onValueChange={(v) => setFormData({ ...formData, slot_interval_minutes: parseInt(v) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15 min</SelectItem>
            <SelectItem value="30">30 min</SelectItem>
            <SelectItem value="60">60 min</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Buffer Before (min)</Label>
        <Input
          type="number"
          value={formData.buffer_before_minutes}
          onChange={(e) => setFormData({ ...formData, buffer_before_minutes: parseInt(e.target.value) || 0 })}
        />
      </div>
      <div className="space-y-2">
        <Label>Buffer After (min)</Label>
        <Input
          type="number"
          value={formData.buffer_after_minutes}
          onChange={(e) => setFormData({ ...formData, buffer_after_minutes: parseInt(e.target.value) || 0 })}
        />
      </div>
    </div>

    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.is_public}
          onCheckedChange={(v) => setFormData({ ...formData, is_public: v })}
        />
        <Label>Public Calendar</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Label>Color</Label>
        <input
          type="color"
          value={formData.color}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          className="w-10 h-10 rounded cursor-pointer"
        />
      </div>
    </div>

    <DialogFooter>
      <Button onClick={onSubmit}>{submitLabel}</Button>
    </DialogFooter>
  </div>
);

interface CalendarsProps {
  hideHeader?: boolean;
}

export default function Calendars({ hideHeader = false }: CalendarsProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<CalendarType | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [syncCalendar, setSyncCalendar] = useState<CalendarType | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<CalendarFormData>({
    name: '',
    description: '',
    timezone: 'America/New_York',
    min_notice_hours: 1,
    max_advance_days: 60,
    slot_interval_minutes: 30,
    buffer_before_minutes: 0,
    buffer_after_minutes: 0,
    is_public: true,
    color: '#6366f1',
  });
  const queryClient = useQueryClient();

  // 1. Fetch Calendars
  const {
    data: calendars = [],
    isLoading: loading,
    refetch: loadCalendars
  } = useQuery({
    queryKey: ['calendars'],
    queryFn: async () => {
      const response = await calendarsApi.list(true) as any;
      return response.data || [];
    }
  });

  const handleCreate = async () => {
    try {
      await calendarsApi.create(formData);
      toast({ title: 'Success', description: 'Calendar created successfully' });
      setIsCreateOpen(false);
      resetForm();
      loadCalendars();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create calendar', variant: 'destructive' });
    }
  };

  const handleUpdate = async () => {
    if (!selectedCalendar) return;
    try {
      await calendarsApi.update(selectedCalendar.id, formData);
      toast({ title: 'Success', description: 'Calendar updated successfully' });
      setIsEditOpen(false);
      setSelectedCalendar(null);
      resetForm();
      loadCalendars();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update calendar', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this calendar?')) return;
    try {
      await calendarsApi.delete(id);
      toast({ title: 'Success', description: 'Calendar deleted successfully' });
      loadCalendars();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete calendar', variant: 'destructive' });
    }
  };

  const openEdit = async (calendar: CalendarType) => {
    try {
      const response = await calendarsApi.get(calendar.id) as any;
      const cal = response.data;
      setSelectedCalendar(cal);
      setFormData({
        name: cal.name,
        description: cal.description || '',
        timezone: cal.timezone,
        min_notice_hours: cal.min_notice_hours,
        max_advance_days: cal.max_advance_days,
        slot_interval_minutes: cal.slot_interval_minutes,
        buffer_before_minutes: cal.buffer_before_minutes,
        buffer_after_minutes: cal.buffer_after_minutes,
        is_public: cal.is_public,
        color: cal.color,
      });
      setIsEditOpen(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load calendar details', variant: 'destructive' });
    }
  };

  const openSyncSettings = (calendar: CalendarType) => {
    setSyncCalendar(calendar);
    setIsSyncOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      timezone: 'America/New_York',
      min_notice_hours: 1,
      max_advance_days: 60,
      slot_interval_minutes: 30,
      buffer_before_minutes: 0,
      buffer_after_minutes: 0,
      is_public: true,
      color: '#6366f1',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={hideHeader ? "space-y-6" : "space-y-6 p-6"}>
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Calendars</h1>
            <p className="text-muted-foreground">Manage your booking calendars and availability</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Calendar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create Calendar</DialogTitle>
                <DialogDescription>Set up a new booking calendar</DialogDescription>
              </DialogHeader>
              <CalendarForm onSubmit={handleCreate} submitLabel="Create Calendar" formData={formData} setFormData={setFormData} />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {calendars.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No calendars yet</h3>
            <p className="text-muted-foreground mb-4">Create your first calendar to start accepting bookings</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Calendar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calendars.map((calendar) => (
            <Card key={calendar.id} className="relative">
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
                style={{ backgroundColor: calendar.color }}
              />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{calendar.name}</CardTitle>
                    <CardDescription>{calendar.timezone}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(calendar)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openSyncSettings(calendar)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Sync Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(calendar.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {calendar.description && (
                    <p className="text-sm text-muted-foreground">{calendar.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      {calendar.slot_interval_minutes}min slots
                    </Badge>
                    <Badge variant="outline">
                      <Users className="w-3 h-3 mr-1" />
                      {calendar.staff_count || 0} staff
                    </Badge>
                    {calendar.is_public ? (
                      <Badge variant="secondary">
                        <Eye className="w-3 h-3 mr-1" />
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="outline">Private</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {calendar.appointment_count || 0} appointments
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Calendar</DialogTitle>
            <DialogDescription>Update calendar settings</DialogDescription>
          </DialogHeader>
          <CalendarForm onSubmit={handleUpdate} submitLabel="Save Changes" formData={formData} setFormData={setFormData} />
        </DialogContent>
      </Dialog>

      {/* Sync Settings Dialog */}
      <Dialog open={isSyncOpen} onOpenChange={setIsSyncOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Calendar Sync Settings</DialogTitle>
            <DialogDescription>
              Connect and sync external calendars for {syncCalendar?.name ?? 'this calendar'}
            </DialogDescription>
          </DialogHeader>
          {syncCalendar ? (
            <CalendarSyncSettings
              calendarId={syncCalendar.id}
              calendarName={syncCalendar.name}
              googleCalendarId={syncCalendar.google_calendar_id}
              outlookCalendarId={syncCalendar.outlook_calendar_id}
              lastSyncedAt={syncCalendar.last_synced_at}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
