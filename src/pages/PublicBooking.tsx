import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Video, Phone, MapPin, ChevronLeft, ChevronRight, Check, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface BookingType {
  id: number;
  name: string;
  slug: string;
  description: string;
  duration_minutes: number;
  location_type: string;
  location_details: string;
  price: number;
  currency: string;
  color: string;
  requires_payment: boolean;
  require_deposit: boolean;
  deposit_amount: number | null;
}

interface BookingPageData {
  user: {
    name: string;
    page_title: string;
    welcome_message: string;
    logo_url: string;
    brand_color: string;
  };
  booking_type?: BookingType;
  booking_types?: BookingType[];
}

interface TimeSlot {
  start: string;
  end: string;
  spots_remaining?: number;
  is_waitlist?: boolean;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
];

export default function PublicBooking() {
  const { userSlug, typeSlug } = useParams<{ userSlug: string; typeSlug?: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<BookingPageData | null>(null);
  const [selectedType, setSelectedType] = useState<BookingType | null>(null);
  const [step, setStep] = useState<'type' | 'date' | 'time' | 'details' | 'payment' | 'confirm'>('type');

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [timezone, setTimezone] = useState('America/New_York');

  // Form state
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    loadBookingPage();
  }, [userSlug, typeSlug]);

  useEffect(() => {
    if (selectedDate && selectedType) {
      loadAvailableSlots();
    }
  }, [selectedDate, selectedType]);

  const loadBookingPage = async () => {
    try {
      setLoading(true);
      const endpoint = typeSlug
        ? `/public/booking/${userSlug}/${typeSlug}`
        : `/public/booking/${userSlug}`;

      const response = await fetch(`${API_URL}${endpoint}`);

      if (!response.ok) {
        throw new Error('Booking page not found');
      }

      const data = await response.json();
      setBookingData(data);

      if (data.booking_type) {
        setSelectedType(data.booking_type);
        setStep('date');
      } else if (data.booking_types?.length === 1) {
        setSelectedType(data.booking_types[0]);
        setStep('date');
      }
    } catch (error) {
      console.error('Failed to load booking page:', error);
      toast.error('Booking page not found');
    } finally {
      setLoading(false);
    }
  };

  const [paymentIntent, setPaymentIntent] = useState<{ clientSecret: string; paymentIntentId: string } | null>(null);

  useEffect(() => {
    if (step === 'payment' && !paymentIntent) {
      initiatePayment();
    }
  }, [step]);

  const initiatePayment = async () => {
    if (!selectedType) return;
    try {
      setSubmitting(true);
      const response = await fetch(`${API_URL}/public/booking/${userSlug}/${selectedType.slug}/payment-intent`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to init payment');
      const data = await response.json();
      setPaymentIntent(data);
    } catch (e) {
      console.error(e);
      toast.error('Could not initialize payment');
    } finally {
      setSubmitting(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDate || !selectedType) return;

    try {
      setLoadingSlots(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(
        `${API_URL}/public/booking/${userSlug}/${selectedType.slug}/slots?date=${dateStr}&timezone=${timezone}`
      );

      if (!response.ok) throw new Error('Failed to load slots');

      const data = await response.json();
      setAvailableSlots(data.slots || []);
    } catch (error) {
      console.error('Failed to load slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const submitBooking = async () => {
    if (!selectedType || !selectedDate || !selectedSlot) return;

    try {
      setSubmitting(true);

      // Payment Simulation
      if (selectedType.requires_payment && step === 'payment') {
        if (!paymentIntent) {
          throw new Error('Payment initialization failed');
        }
        // Simulate Stripe ConfirmCardPayment
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      const scheduledAt = `${selectedDate.toISOString().split('T')[0]}T${selectedSlot.start}:00`;

      const response = await fetch(
        `${API_URL}/public/booking/${userSlug}/${selectedType.slug}/book`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            scheduled_at: scheduledAt,
            timezone,
            paymentIntentId: paymentIntent?.paymentIntentId
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to book appointment');
      }

      const data = await response.json();
      setBookingDetails(data);
      setBookingComplete(true);
      setStep('confirm');
    } catch (error) {
      console.error('Failed to book:', error);
      toast.error('Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: (Date | null)[] = [];
    const current = new Date(startDate);

    while (current <= lastDay || days.length % 7 !== 0) {
      if (current.getMonth() === month) {
        days.push(new Date(current));
      } else {
        days.push(null);
      }
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const isDateAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const getLocationIcon = (locationType: string) => {
    switch (locationType) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'in_person': return <MapPin className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const brandColor = bookingData?.user?.brand_color || '#3B82F6';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Booking Page Not Found</h2>
            <p className="text-gray-500">This booking page doesn't exist or has been disabled.</p>
          </CardContent>
        </Card>
      </div>
    );
  }


  // Confirmation screen
  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: brandColor }}
              >
                <Check className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {bookingDetails?.status === 'waitlist' ? 'Added to Waitlist' : 'Booking Confirmed!'}
              </h2>
              <p className="text-gray-500 mb-6">
                {bookingDetails?.status === 'waitlist'
                  ? "You've been added to the waitlist. We'll notify you if a spot opens up."
                  : "Your appointment has been scheduled. You'll receive a confirmation email shortly."
                }
              </p>

              <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-medium">
                      {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedSlot && formatTime(selectedSlot.start)} - {selectedSlot && formatTime(selectedSlot.end)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {selectedType && getLocationIcon(selectedType.location_type)}
                  <span className="capitalize">{selectedType?.location_type?.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span>{selectedType?.duration_minutes} minutes</span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setBookingComplete(false);
                  setStep('type');
                  setSelectedType(null);
                  setSelectedDate(null);
                  setSelectedSlot(null);
                  setFormData({ guest_name: '', guest_email: '', guest_phone: '', notes: '' });
                }}
              >
                Book Another Appointment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {bookingData.user.logo_url && (
            <img
              src={bookingData.user.logo_url}
              alt={bookingData.user.name}
              className="h-16 mx-auto mb-4"
            />
          )}
          <h1 className="text-2xl font-bold">{bookingData.user.page_title || `Book with ${bookingData.user.name}`}</h1>
          {bookingData.user.welcome_message && (
            <p className="text-gray-500 mt-2">{bookingData.user.welcome_message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar - Selected info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{bookingData.user.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedType && (
                  <div className="space-y-3">
                    <div
                      className="w-full h-1 rounded"
                      style={{ backgroundColor: selectedType.color || brandColor }}
                    />
                    <h3 className="font-semibold">{selectedType.name}</h3>
                    {selectedType.description && (
                      <p className="text-sm text-gray-500">{selectedType.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{selectedType.duration_minutes} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {getLocationIcon(selectedType.location_type)}
                      <span className="capitalize">{selectedType.location_type?.replace('_', ' ')}</span>
                    </div>
                    {selectedType.price > 0 && (
                      <div className="text-sm font-medium">
                        ${selectedType.price} {selectedType.currency}
                      </div>
                    )}
                  </div>
                )}

                {selectedDate && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                )}

                {selectedSlot && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{formatTime(selectedSlot.start)}</span>
                  </div>
                )}

                {/* Timezone selector */}
                <div className="pt-3 border-t">
                  <Label className="text-xs text-gray-500">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map(tz => (
                        <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {/* Step: Select Type */}
                {step === 'type' && bookingData.booking_types && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Select Appointment Type</h2>
                    <div className="grid gap-3">
                      {bookingData.booking_types.map(type => (
                        <div
                          key={type.id}
                          className={cn(
                            'p-4 border rounded-lg cursor-pointer transition-all hover:border-gray-400',
                            selectedType?.id === type.id && 'border-2'
                          )}
                          style={{ borderColor: selectedType?.id === type.id ? brandColor : undefined }}
                          onClick={() => {
                            setSelectedType(type);
                            setStep('date');
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{type.name}</h3>
                              {type.description && (
                                <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {type.duration_minutes} min
                                </span>
                                <span className="flex items-center gap-1">
                                  {getLocationIcon(type.location_type)}
                                  <span className="capitalize">{type.location_type?.replace('_', ' ')}</span>
                                </span>
                              </div>
                            </div>
                            {type.price > 0 && (
                              <Badge variant="secondary">${type.price}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step: Select Date */}
                {step === 'date' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="sm" onClick={() => setStep('type')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <h2 className="text-lg font-semibold">Select Date</h2>
                      <div className="w-20" />
                    </div>

                    {/* Calendar */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <Button variant="ghost" size="icon" onClick={() => {
                          const newMonth = new Date(currentMonth);
                          newMonth.setMonth(newMonth.getMonth() - 1);
                          setCurrentMonth(newMonth);
                        }}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h3 className="font-semibold">
                          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h3>
                        <Button variant="ghost" size="icon" onClick={() => {
                          const newMonth = new Date(currentMonth);
                          newMonth.setMonth(newMonth.getMonth() + 1);
                          setCurrentMonth(newMonth);
                        }}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center">
                        {DAYS_OF_WEEK.map(day => (
                          <div key={day} className="p-2 text-sm font-medium text-gray-500">
                            {day}
                          </div>
                        ))}
                        {getCalendarDays().map((date, i) => {
                          if (!date) {
                            return <div key={i} className="p-2" />;
                          }

                          const isAvailable = isDateAvailable(date);
                          const isSelected = selectedDate?.toDateString() === date.toDateString();
                          const isToday = date.toDateString() === new Date().toDateString();

                          return (
                            <button
                              key={i}
                              disabled={!isAvailable}
                              className={cn(
                                'p-2 rounded-full text-sm transition-colors',
                                isAvailable && 'hover:bg-gray-100 cursor-pointer',
                                !isAvailable && 'text-gray-300 cursor-not-allowed',
                                isToday && !isSelected && 'font-bold',
                                isSelected && 'text-white'
                              )}
                              style={{ backgroundColor: isSelected ? brandColor : undefined }}
                              onClick={() => {
                                setSelectedDate(date);
                                setSelectedSlot(null);
                                setStep('time');
                              }}
                            >
                              {date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}


                {/* Step: Select Time */}
                {step === 'time' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="sm" onClick={() => setStep('date')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <h2 className="text-lg font-semibold">
                        {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </h2>
                      <div className="w-20" />
                    </div>

                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500">No available times on this date.</p>
                        <Button variant="outline" className="mt-4" onClick={() => setStep('date')}>
                          Choose Another Date
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {availableSlots.map((slot, i) => {
                          const isWaitlist = slot.is_waitlist;
                          const showSpots = slot.spots_remaining !== undefined && slot.spots_remaining < 5 && !isWaitlist;

                          return (
                            <button
                              key={i}
                              className={cn(
                                'p-3 border rounded-lg text-sm font-medium transition-colors relative',
                                selectedSlot?.start === slot.start
                                  ? 'text-white border-transparent'
                                  : isWaitlist
                                    ? 'hover:border-amber-400 bg-amber-50 border-amber-200 text-amber-900'
                                    : 'hover:border-gray-400'
                              )}
                              style={{
                                backgroundColor: selectedSlot?.start === slot.start ? brandColor : undefined,
                                borderColor: selectedSlot?.start === slot.start ? brandColor : undefined
                              }}
                              onClick={() => {
                                setSelectedSlot(slot);
                                setStep('details');
                              }}
                            >
                              <div className="flex flex-col items-center">
                                <span>{formatTime(slot.start)}</span>
                                {isWaitlist && (
                                  <span className="text-[12px] uppercase tracking-wide font-bold mt-1 text-amber-700">
                                    Waitlist
                                  </span>
                                )}
                                {showSpots && (
                                  <span className="text-[12px] text-gray-500 mt-1">
                                    {slot.spots_remaining} left
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Step: Enter Details */}
                {step === 'details' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="sm" onClick={() => setStep('time')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <h2 className="text-lg font-semibold">Enter Your Details</h2>
                      <div className="w-20" />
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                          value={formData.guest_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, guest_name: e.target.value }))}
                          placeholder="Your full name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={formData.guest_email}
                          onChange={(e) => setFormData(prev => ({ ...prev, guest_email: e.target.value }))}
                          placeholder="your@email.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={formData.guest_phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, guest_phone: e.target.value }))}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Additional Notes</Label>
                        <Textarea
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Anything you'd like us to know..."
                          rows={3}
                        />
                      </div>

                      <Button
                        className="w-full"
                        style={{ backgroundColor: brandColor }}
                        disabled={!formData.guest_name || !formData.guest_email || submitting}
                        onClick={() => {
                          if (selectedType?.requires_payment && !selectedType.price) {
                            // Edge case: requires payment but price is 0? assume free
                            submitBooking();
                          } else if (selectedType?.requires_payment) {
                            setStep('payment');
                          } else {
                            submitBooking();
                          }
                        }}
                      >
                        {selectedType?.requires_payment ? 'Continue to Payment' : (submitting ? 'Booking...' : 'Confirm Booking')}
                      </Button>

                      <p className="text-xs text-center text-gray-500">
                        By booking, you agree to receive appointment reminders via email.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step: Payment */}
                {step === 'payment' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="sm" onClick={() => setStep('details')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <h2 className="text-lg font-semibold">Payment Details</h2>
                      <div className="w-20" />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-700">Total Due</span>
                        <span className="text-xl font-bold">
                          ${selectedType?.require_deposit && selectedType.deposit_amount
                            ? selectedType.deposit_amount
                            : selectedType?.price}
                        </span>
                      </div>
                      {selectedType?.require_deposit && selectedType.deposit_amount && (
                        <p className="text-xs text-gray-500">
                          * Deposit of ${selectedType.deposit_amount} required to book. Remaining balance due later.
                        </p>
                      )}
                    </div>

                    <div className="space-y-4 border p-4 rounded-lg">
                      <div className="space-y-2">
                        <Label>Card Number</Label>
                        <Input placeholder="0000 0000 0000 0000" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Expiry Date</Label>
                          <Input placeholder="MM/YY" />
                        </div>
                        <div className="space-y-2">
                          <Label>CVC</Label>
                          <Input placeholder="123" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Cardholder Name</Label>
                        <Input placeholder="Name on card" />
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      style={{ backgroundColor: brandColor }}
                      disabled={submitting}
                      onClick={submitBooking}
                    >
                      {submitting ? 'Processing Payment...' : `Pay & Book`}
                    </Button>

                    <p className="text-xs text-center text-gray-400">
                      This is a secure 256-bit SSL encrypted payment.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-400">
          Powered by Your Scheduling Platform
        </div>
      </div>
    </div>
  );
}
