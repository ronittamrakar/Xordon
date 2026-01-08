import { useState, useEffect, useCallback } from 'react';
import { MarketplaceNav } from '@/components/marketplace/MarketplaceNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
// Select removed as unused
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Calendar, Clock, X, ChevronLeft,
  ChevronRight, Loader2, CalendarDays, CheckCircle
} from 'lucide-react';
import {
  getBookingTypes,
  getAvailableSlots,
  createBooking,
  getUpcomingAppointments,
  cancelAppointment,
  completeAppointment,
  BookingType,
  TimeSlot,
  Appointment
} from '@/services/leadMarketplaceApi';

// Format date for display
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

// Format time
const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Time Slot Button
const TimeSlotButton = ({ slot, selected, onClick }: {
  slot: TimeSlot;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    disabled={!slot.available}
    className={`
      px-4 py-2 rounded-lg border text-sm font-medium transition-colors
      ${selected
        ? 'bg-primary text-primary-foreground border-primary'
        : slot.available
          ? 'bg-card hover:bg-muted border-border'
          : 'bg-muted text-muted-foreground cursor-not-allowed border-transparent'
      }
    `}
  >
    {formatTime(slot.start_time)}
  </button>
);

// Date Picker (Simple Week View)
const DatePicker = ({ selectedDate, onDateChange }: {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}) => {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay()); // Start of week (Sunday)
    return d;
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevWeek}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-medium">
          {weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <Button variant="ghost" size="icon" onClick={nextWeek}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs text-muted-foreground font-medium">
            {day}
          </div>
        ))}
        {weekDays.map((date) => (
          <button
            key={date.toISOString()}
            onClick={() => !isPast(date) && onDateChange(date)}
            disabled={isPast(date)}
            className={`
              aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors
              ${isPast(date) ? 'text-muted-foreground cursor-not-allowed' : 'hover:bg-muted'}
              ${isSelected(date) ? 'bg-primary text-primary-foreground' : ''}
              ${isToday(date) && !isSelected(date) ? 'ring-2 ring-primary' : ''}
            `}
          >
            {date.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
};

// Booking Flow Component
export function BookingFlow({ leadMatchId, providerId, onComplete }: {
  leadMatchId: number;
  providerId: number;
  onComplete?: () => void;
}) {
  const [step, setStep] = useState(1);
  const [bookingTypes, setBookingTypes] = useState<BookingType[]>([]);
  const [selectedType, setSelectedType] = useState<BookingType | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  const fetchBookingTypes = useCallback(async () => {
    try {
      const res = await getBookingTypes(providerId);
      if (res.data.success) {
        setBookingTypes(res.data.data);
        if (res.data.data.length === 1) {
          setSelectedType(res.data.data[0]);
        }
      }
    } catch {
      toast.error('Failed to load booking types');
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  const fetchSlots = useCallback(async () => {
    if (!selectedType) return;
    setSlotsLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await getAvailableSlots(providerId, selectedType.id, dateStr);
      if (res.data.success) {
        setTimeSlots(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load slots');
    } finally {
      setSlotsLoading(false);
    }
  }, [providerId, selectedType, selectedDate]);

  useEffect(() => {
    fetchBookingTypes();
  }, [fetchBookingTypes]);

  useEffect(() => {
    if (selectedType && selectedDate) {
      fetchSlots();
    }
  }, [fetchSlots, selectedType, selectedDate]);

  const handleBook = async () => {
    if (!selectedSlot || !selectedType) return;

    setBooking(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await createBooking(leadMatchId, {
        booking_type_id: selectedType.id,
        date: dateStr,
        start_time: selectedSlot.start_time,
        notes
      });

      if (res.data.success) {
        toast.success('Appointment booked successfully!');
        onComplete?.();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Select Booking Type */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-medium">Select Service Type</h3>
          {bookingTypes.length === 0 ? (
            <p className="text-muted-foreground">No booking types available</p>
          ) : (
            <div className="grid gap-3">
              {bookingTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type);
                    setStep(2);
                  }}
                  className={`
                    p-4 rounded-lg border text-left transition-colors hover:bg-muted
                    ${selectedType?.id === type.id ? 'border-primary bg-primary/5' : ''}
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{type.name}</h4>
                      {type.description && (
                        <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {type.price > 0 && (
                        <span className="font-semibold">${type.price}</span>
                      )}
                      <p className="text-sm text-muted-foreground">{type.duration_minutes} min</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Date & Time */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <span className="font-medium">{selectedType?.name}</span>
          </div>

          <div>
            <h4 className="font-medium mb-3">Select Date</h4>
            <DatePicker
              selectedDate={selectedDate}
              onDateChange={(date) => {
                setSelectedDate(date);
                setSelectedSlot(null);
              }}
            />
          </div>

          <div>
            <h4 className="font-medium mb-3">Available Times</h4>
            {slotsLoading ? (
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : timeSlots.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No available slots for this date
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((slot) => (
                  <TimeSlotButton
                    key={slot.start_time}
                    slot={slot}
                    selected={selectedSlot?.start_time === slot.start_time}
                    onClick={() => setSelectedSlot(slot)}
                  />
                ))}
              </div>
            )}
          </div>

          {selectedSlot && (
            <Button className="w-full" onClick={() => setStep(3)}>
              Continue
            </Button>
          )}
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <span className="font-medium">Confirm Booking</span>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <span>{formatDate(selectedDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{formatTime(selectedSlot!.start_time)} - {selectedType?.duration_minutes} min</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{selectedType?.name}</span>
            </div>
            {selectedType && selectedType.price > 0 && (
              <div className="pt-2 border-t flex justify-between">
                <span className="font-medium">Total</span>
                <span className="font-semibold">${selectedType.price}</span>
              </div>
            )}
          </div>

          <div>
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requirements or information..."
              className="mt-2"
            />
          </div>

          <Button className="w-full" onClick={handleBook} disabled={booking}>
            {booking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirm Booking
          </Button>
        </div>
      )}
    </div>
  );
}

// Booking Dialog Wrapper
export function BookingDialog({ open, onOpenChange, leadMatchId, providerId, onComplete }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadMatchId: number;
  providerId: number;
  onComplete?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book an Appointment</DialogTitle>
          <DialogDescription>
            Schedule a time with the service provider
          </DialogDescription>
        </DialogHeader>
        <BookingFlow
          leadMatchId={leadMatchId}
          providerId={providerId}
          onComplete={() => {
            onOpenChange(false);
            onComplete?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

// Appointment Card Component
const AppointmentCard = ({ appointment, isProvider, onCancel, onComplete }: {
  appointment: Appointment;
  isProvider: boolean;
  onCancel: (id: number) => void;
  onComplete?: (id: number) => void;
}) => {
  const appointmentDate = new Date(appointment.scheduled_at);
  const isPast = appointmentDate < new Date();
  const canComplete = isProvider && appointment.status === 'confirmed' && isPast;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{appointment.booking_type_name || 'Appointment'}</h4>
              <Badge
                className={
                  appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          ''
                }
              >
                {appointment.status}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="w-4 h-4" />
                {formatDate(appointmentDate)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {appointmentDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
            </div>

            {appointment.lead_type && (
              <Badge variant="outline">{appointment.lead_type}</Badge>
            )}

            {appointment.notes && (
              <p className="text-sm text-muted-foreground">{appointment.notes}</p>
            )}
          </div>

          <div className="flex gap-2">
            {appointment.status === 'pending' || appointment.status === 'confirmed' ? (
              <>
                {canComplete && (
                  <Button size="sm" onClick={() => onComplete?.(appointment.id)}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Complete
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => onCancel(appointment.id)}>
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Upcoming Appointments List
export function UpcomingAppointments({ isProvider = true }: { isProvider?: boolean }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await getUpcomingAppointments();
      if (res.data.success) {
        setAppointments(res.data.data);
      }
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await cancelAppointment(id);
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch {
      toast.error('Failed to cancel appointment');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await completeAppointment(id);
      toast.success('Appointment marked as completed');
      fetchAppointments();
    } catch {
      toast.error('Failed to complete appointment');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No upcoming appointments</p>
          <p className="text-sm">
            {isProvider
              ? 'Appointments will appear here when customers book with you'
              : 'Book an appointment with a provider to get started'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((apt) => (
        <AppointmentCard
          key={apt.id}
          appointment={apt}
          isProvider={isProvider}
          onCancel={handleCancel}
          onComplete={isProvider ? handleComplete : undefined}
        />
      ))}
    </div>
  );
}

// Full Booking Page
export function MarketplaceBooking() {
  return (
    <div className="space-y-6">
      <MarketplaceNav />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Appointments
          </CardTitle>
          <CardDescription>
            Manage your marketplace appointments
          </CardDescription>
        </CardHeader>
      </Card>

      <h2 className="text-lg font-semibold">Upcoming Appointments</h2>
      <UpcomingAppointments isProvider={true} />
    </div>
  );
}

export default MarketplaceBooking;
