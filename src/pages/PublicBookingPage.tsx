import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import bookingPagesApi, { BookingPage } from '../services/bookingPagesApi';
import { bookingApi } from '../services/bookingApi';

export default function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<BookingPage | null>(null);
  const [step, setStep] = useState<'service' | 'time' | 'details' | 'confirm'>('service');

  // Native booking state
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Form data
  const [formData, setFormData] = useState<any>({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);

  useEffect(() => {
    if (slug) {
      loadPage();
    }
  }, [slug]);

  useEffect(() => {
    if (selectedService && selectedDate && page?.source === 'native') {
      loadSlots();
    }
  }, [selectedService, selectedDate]);

  const loadPage = async () => {
    try {
      setLoading(true);
      const data = await bookingPagesApi.getPublicPage(slug!);
      setPage(data);

      // Auto-select service if only one
      if (data.source === 'native' && data.services?.length === 1) {
        setSelectedService(data.services[0]);
        setStep('time');
      }
    } catch (error) {
      toast.error('Booking page not found');
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    if (!selectedService || !selectedDate || !page) return;

    try {
      setLoadingSlots(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await bookingApi.getSlots({
        service_id: selectedService.id,
        date: dateStr,
        mode: page.native_config?.staff_mode || 'round_robin',
        workspace_id: page.workspace_id,
        buffer_before: page.native_config?.buffer_before,
        buffer_after: page.native_config?.buffer_after,
        min_notice_hours: page.native_config?.min_notice_hours,
        max_advance_days: page.native_config?.max_advance_days,
      });
      setAvailableSlots(response.slots || []);
    } catch (error) {
      toast.error('Failed to load available times');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleNativeBooking = async () => {
    if (!selectedService || !selectedSlot || !page) return;

    try {
      setSubmitting(true);
      await bookingApi.createBooking({
        workspace_id: page.workspace_id,
        service_id: selectedService.id,
        staff_id: selectedSlot.staff_id,
        start_time: selectedSlot.start,
        customer: {
          name: formData.guest_name,
          email: formData.guest_email,
          phone: formData.guest_phone,
          notes: formData.notes,
        },
        booking_page_id: page.id,
        answers: formData,
      });
      setBookingComplete(true);
      setStep('confirm');

      // Redirect if configured
      if (page.branding?.redirect_url) {
        setTimeout(() => {
          window.location.href = page.branding!.redirect_url!;
        }, 3000);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExternalLead = async () => {
    if (!page || !slug) return;

    try {
      setSubmitting(true);
      await bookingPagesApi.captureLead(slug, {
        guest_name: formData.guest_name,
        guest_email: formData.guest_email,
        guest_phone: formData.guest_phone,
        form_data: formData,
      });
      setBookingComplete(true);
      setStep('confirm');

      // Redirect if configured
      if (page.branding?.redirect_url) {
        setTimeout(() => {
          window.location.href = page.branding!.redirect_url!;
        }, 3000);
      }
    } catch (error) {
      toast.error('Failed to submit information');
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
    const minNotice = page?.native_config?.min_notice_hours || 1;
    const maxDays = page?.native_config?.max_advance_days || 60;

    const minDate = new Date(today.getTime() + minNotice * 60 * 60 * 1000);
    const maxDate = new Date(today.getTime() + maxDays * 24 * 60 * 60 * 1000);

    return date >= minDate && date <= maxDate;
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!page) {
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

  const primaryColor = page.branding?.primary_color || '#6366f1';

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <Check className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {page.source === 'native' ? 'Booking Confirmed!' : 'Information Received!'}
              </h2>
              <p className="text-gray-500 mb-6">
                {page.branding?.success_message ||
                  (page.source === 'native'
                    ? "Your appointment has been scheduled. You'll receive a confirmation email shortly."
                    : "Thank you! Please complete your booking using the scheduler below.")}
              </p>

              {page.source === 'native' && selectedService && selectedSlot && (
                <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{selectedService.name}</div>
                      <div className="text-sm text-gray-500">
                        {selectedDate?.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <span>{formatTime(selectedSlot.start)}</span>
                  </div>
                </div>
              )}

              {page.source !== 'native' && page.source_config?.embed_url && (
                <div className="mt-6">
                  <iframe
                    src={page.source_config.embed_url}
                    width="100%"
                    height="600"
                    frameBorder="0"
                    className="rounded-lg"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          {page.branding?.logo_url && (
            <img
              src={page.branding.logo_url}
              alt={page.title}
              className="h-16 mx-auto mb-4 object-contain"
            />
          )}
          <h1 className="text-2xl font-bold mb-2">{page.title}</h1>
          {page.description && (
            <p className="text-gray-600">{page.description}</p>
          )}
        </div>

        <Card>
          <CardContent className="p-6">
            {page.source === 'native' ? (
              <>
                {step === 'service' && page.services && page.services.length > 1 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Select a Service</h2>
                    <div className="grid gap-3">
                      {page.services.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => {
                            setSelectedService(service);
                            setStep('time');
                          }}
                          className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                        >
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {service.duration_minutes} min • ${service.price}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 'time' && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Select Date & Time</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <div className="font-medium">
                            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center text-sm">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="font-medium text-gray-500 py-2">
                              {day}
                            </div>
                          ))}
                          {getCalendarDays().map((date, i) => (
                            <button
                              key={i}
                              disabled={!date || !isDateAvailable(date)}
                              onClick={() => date && setSelectedDate(date)}
                              className={`
                                py-2 rounded
                                ${!date ? 'invisible' : ''}
                                ${date && !isDateAvailable(date) ? 'text-gray-300 cursor-not-allowed' : ''}
                                ${date && isDateAvailable(date) ? 'hover:bg-blue-100' : ''}
                                ${selectedDate?.toDateString() === date?.toDateString() ? 'bg-blue-500 text-white' : ''}
                              `}
                            >
                              {date?.getDate()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium mb-3">Available Times</h3>
                        {!selectedDate ? (
                          <p className="text-gray-500 text-sm">Select a date to see available times</p>
                        ) : loadingSlots ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                          </div>
                        ) : availableSlots.length === 0 ? (
                          <p className="text-gray-500 text-sm">No available times for this date</p>
                        ) : (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {availableSlots.map((slot, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  setSelectedSlot(slot);
                                  setStep('details');
                                }}
                                className="w-full p-3 border rounded hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                              >
                                <div className="font-medium">{formatTime(slot.start)}</div>
                                {slot.staff_name && (
                                  <div className="text-xs text-gray-500">{slot.staff_name}</div>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {page.services && page.services.length > 1 && (
                      <Button variant="outline" onClick={() => setStep('service')}>
                        Back to Services
                      </Button>
                    )}
                  </div>
                )}

                {step === 'details' && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Your Information</h2>

                    {(page.form_schema?.fields || []).map((field) => (
                      <div key={field.name} className="space-y-2">
                        <Label>
                          {field.label}
                          {field.required ? <span className="text-red-500 ml-1">*</span> : null}
                        </Label>
                        {field.type === 'textarea' ? (
                          <Textarea
                            value={formData[field.name] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                            required={field.required}
                          />
                        ) : (
                          <Input
                            type={field.type}
                            value={formData[field.name] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                            required={field.required}
                          />
                        )}
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setStep('time')}>
                        Back
                      </Button>
                      <Button
                        onClick={handleNativeBooking}
                        disabled={submitting}
                        style={{ backgroundColor: primaryColor }}
                        className="flex-1"
                      >
                        {submitting ? 'Booking...' : 'Confirm Booking'}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Your Information</h2>
                  {(page.form_schema?.fields || []).map((field) => (
                    <div key={field.name} className="space-y-2">
                      <Label>
                        {field.label}
                        {field.required ? <span className="text-red-500 ml-1">*</span> : null}
                      </Label>
                      {field.type === 'textarea' ? (
                        <Textarea
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          required={field.required}
                        />
                      ) : (
                        <Input
                          type={field.type}
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
                  <Button
                    onClick={handleExternalLead}
                    disabled={submitting}
                    style={{ backgroundColor: primaryColor }}
                    className="w-full"
                  >
                    {submitting ? 'Submitting...' : 'Continue to Scheduler'}
                  </Button>
                </div>

                {page.source_config?.embed_url && (
                  <div>
                    <h3 className="font-medium mb-3">Or schedule directly:</h3>
                    <iframe
                      src={page.source_config.embed_url}
                      width="100%"
                      height="600"
                      frameBorder="0"
                      className="rounded-lg border"
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
