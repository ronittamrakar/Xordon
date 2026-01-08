import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Calendar, Clock, Users, Plus, Search, Video, Phone, MapPin, Edit, Trash2,
  RefreshCw, ChevronLeft, ChevronRight, Copy, ExternalLink, Settings, Bell,
  Globe, Link2, Mail, MessageSquare, DollarSign, CalendarDays,
  Building2, Briefcase, Stethoscope, Scale, Home, Wrench, MoreHorizontal,
  CheckCircle2, XCircle, AlertCircle, Eye, FileTextIcon, Zap, Package, User, Laptop, Car, Scissors, Camera
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { AdvancedAvailabilityEditor, AdvancedAvailabilitySettings } from '@/components/scheduling/AdvancedAvailabilityEditor';
import { GroupEventSettings, GroupEventConfig } from '@/components/scheduling/GroupEventSettings';
import { SmartBufferSettings, SmartSchedulingConfig } from '@/components/scheduling/SmartBufferSettings';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

const MOBILE_SETTINGS_KEY = 'xordon_mobile_settings_v1';

// Types
interface BookingType {
  id: number;
  name: string;
  slug: string;
  description: string;
  duration_minutes: number;
  buffer_before: number;
  buffer_after: number;
  location_type: string;
  location_details: string;
  price: number;
  currency: string;
  color: string;
  is_active: boolean;
  max_bookings_per_day: number | null;
  min_notice_hours: number;
  max_future_days: number;
  requires_payment: boolean;
  allow_staff_selection: boolean;
  require_deposit: boolean;
  deposit_amount: number | null;
  intake_form_id: number | null;

  assigned_staff_ids: number[];
  // Smart Scheduling Fields
  smart_buffer_mode: 'dynamic' | 'fixed';
  overlap_prevention: 'strict' | 'allow_partial' | 'none';
  travel_time_minutes: number;
  // Group Event Fields
  is_group_event: boolean;
  max_participants: number;
  min_participants: number;
  waitlist_enabled: boolean;
  participant_confirmation: boolean;
}

interface Appointment {
  id: number;
  booking_type_id: number;
  booking_type_name?: string;
  contact_id: number;
  staff_id?: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  title: string;
  description: string;
  scheduled_at: string;
  duration_minutes: number;
  end_at: string;
  timezone: string;
  location_type: string;
  location: string;
  meeting_link?: string;
  status: string;
  notes: string;
  internal_notes: string;
  first_name?: string;
  last_name?: string;
  contact_email?: string;
  color?: string;
  payment_status?: string;
  created_at: string;
}

interface DashboardStats {
  upcoming: number;
  today: number;
  this_week: number;
  completed_this_month: number;
  cancellation_rate: number;
  total_revenue?: number;
  avg_booking_value?: number;
}

interface AvailabilitySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface AvailabilitySchedule {
  id: number;
  name: string;
  timezone: string;
  is_default: boolean;
  slots: AvailabilitySlot[];
}

interface BookingPageSettings {
  page_slug: string;
  page_title: string;
  welcome_message: string;
  logo_url: string;
  brand_color: string;
  show_branding: boolean;
  require_phone: boolean;
  custom_questions: any[];
  confirmation_message: string;
  redirect_url: string;
}

interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  color?: string;
  is_active?: boolean;
}

interface Service {
  id: number;
  name: string;
  description?: string;
  price?: number;
  duration_minutes?: number;
  category_name?: string;
  is_active?: boolean;
}

interface FormItem {
  id: string;
  name: string;
  title: string;
  status: string;
}

// Comprehensive industry presets with detailed booking types
const industryPresets: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  description: string;
  types: Array<{
    name: string;
    duration: number;
    location: string;
    description: string;
    price?: number;
  }>;
}> = {
  agency: {
    icon: Building2,
    name: 'Agency / Marketing',
    description: 'Digital agencies, marketing firms, creative studios',
    types: [
      { name: 'Discovery Call', duration: 30, location: 'video', description: 'Initial consultation to understand your needs' },
      { name: 'Strategy Session', duration: 60, location: 'video', description: 'Deep dive into your marketing strategy' },
      { name: 'Project Kickoff', duration: 90, location: 'video', description: 'Launch meeting for new projects' },
      { name: 'Creative Review', duration: 45, location: 'video', description: 'Review designs and creative assets' },
      { name: 'Monthly Retainer Check-in', duration: 30, location: 'video', description: 'Regular progress update meeting' },
    ]
  },
  home_services: {
    icon: Home,
    name: 'Home Services / Painters',
    description: 'Painters, cleaners, handymen, HVAC, plumbers',
    types: [
      { name: 'Free Estimate', duration: 60, location: 'in_person', description: 'On-site estimate for your project', price: 0 },
      { name: 'Service Appointment', duration: 120, location: 'in_person', description: 'Scheduled service visit' },
      { name: 'Follow-up Inspection', duration: 30, location: 'in_person', description: 'Quality check after service completion' },
      { name: 'Emergency Service', duration: 60, location: 'in_person', description: 'Urgent service request' },
      { name: 'Consultation Call', duration: 15, location: 'phone', description: 'Quick phone consultation' },
    ]
  },
  realtor: {
    icon: Building2,
    name: 'Real Estate',
    description: 'Realtors, property managers, real estate agents',
    types: [
      { name: 'Property Showing', duration: 30, location: 'in_person', description: 'Tour a property with an agent' },
      { name: 'Buyer Consultation', duration: 60, location: 'video', description: 'Discuss your home buying needs' },
      { name: 'Listing Presentation', duration: 90, location: 'in_person', description: 'Learn how we can sell your home' },
      { name: 'Open House RSVP', duration: 30, location: 'in_person', description: 'Reserve your spot at an open house' },
      { name: 'Market Analysis Review', duration: 45, location: 'video', description: 'Review comparable properties and pricing' },
    ]
  },
  lawyer: {
    icon: Scale,
    name: 'Legal Services',
    description: 'Law firms, attorneys, legal consultants',
    types: [
      { name: 'Initial Consultation', duration: 60, location: 'in_person', description: 'Discuss your legal matter', price: 150 },
      { name: 'Case Review', duration: 45, location: 'video', description: 'Review case progress and strategy' },
      { name: 'Document Signing', duration: 30, location: 'in_person', description: 'Sign legal documents' },
      { name: 'Deposition Prep', duration: 90, location: 'in_person', description: 'Prepare for upcoming deposition' },
      { name: 'Phone Consultation', duration: 30, location: 'phone', description: 'Quick legal advice call', price: 75 },
    ]
  },
  doctor: {
    icon: Stethoscope,
    name: 'Healthcare / Medical',
    description: 'Doctors, dentists, therapists, clinics',
    types: [
      { name: 'New Patient Visit', duration: 60, location: 'in_person', description: 'First-time patient appointment' },
      { name: 'Follow-up Visit', duration: 30, location: 'in_person', description: 'Follow-up on treatment progress' },
      { name: 'Annual Checkup', duration: 45, location: 'in_person', description: 'Yearly wellness examination' },
      { name: 'Telehealth Visit', duration: 30, location: 'video', description: 'Virtual consultation' },
      { name: 'Lab Results Review', duration: 15, location: 'phone', description: 'Discuss test results' },
    ]
  },
  consultant: {
    icon: Briefcase,
    name: 'Consulting / Coaching',
    description: 'Business consultants, coaches, advisors',
    types: [
      { name: 'Discovery Call', duration: 30, location: 'video', description: 'Learn about your challenges and goals' },
      { name: 'Strategy Session', duration: 90, location: 'video', description: 'Deep strategic planning session', price: 250 },
      { name: 'Coaching Call', duration: 60, location: 'video', description: 'One-on-one coaching session', price: 150 },
      { name: 'Workshop', duration: 180, location: 'video', description: 'Group training workshop', price: 500 },
      { name: 'Quick Check-in', duration: 15, location: 'phone', description: 'Brief progress check' },
    ]
  },
  contractor: {
    icon: Wrench,
    name: 'Contractor / Construction',
    description: 'General contractors, builders, renovators',
    types: [
      { name: 'Site Visit', duration: 60, location: 'in_person', description: 'On-site project assessment' },
      { name: 'Project Estimate', duration: 90, location: 'in_person', description: 'Detailed project quote' },
      { name: 'Progress Review', duration: 45, location: 'in_person', description: 'Review construction progress' },
      { name: 'Final Walkthrough', duration: 60, location: 'in_person', description: 'Final inspection before completion' },
      { name: 'Design Consultation', duration: 60, location: 'video', description: 'Discuss design options' },
    ]
  },
  web_developer: {
    icon: Laptop,
    name: 'Web Development / IT',
    description: 'Web developers, IT consultants, tech services',
    types: [
      { name: 'Project Discovery', duration: 45, location: 'video', description: 'Understand your project requirements' },
      { name: 'Technical Consultation', duration: 60, location: 'video', description: 'Technical advice and planning', price: 100 },
      { name: 'Code Review', duration: 60, location: 'video', description: 'Review and improve your code' },
      { name: 'Support Call', duration: 30, location: 'video', description: 'Technical support session' },
      { name: 'Training Session', duration: 90, location: 'video', description: 'Learn to use your new system', price: 150 },
    ]
  },
  auto_services: {
    icon: Car,
    name: 'Auto Services',
    description: 'Auto repair, detailing, mechanics',
    types: [
      { name: 'Vehicle Inspection', duration: 30, location: 'in_person', description: 'Comprehensive vehicle check' },
      { name: 'Service Appointment', duration: 120, location: 'in_person', description: 'Scheduled maintenance or repair' },
      { name: 'Detailing Service', duration: 180, location: 'in_person', description: 'Full vehicle detailing' },
      { name: 'Quick Estimate', duration: 15, location: 'in_person', description: 'Quick repair estimate' },
      { name: 'Test Drive', duration: 30, location: 'in_person', description: 'Test drive after service' },
    ]
  },
  salon_spa: {
    icon: Scissors,
    name: 'Salon / Spa / Beauty',
    description: 'Hair salons, spas, beauty services',
    types: [
      { name: 'Haircut', duration: 45, location: 'in_person', description: 'Professional haircut service' },
      { name: 'Color Service', duration: 120, location: 'in_person', description: 'Hair coloring treatment' },
      { name: 'Spa Treatment', duration: 90, location: 'in_person', description: 'Relaxing spa service' },
      { name: 'Consultation', duration: 15, location: 'in_person', description: 'Style consultation' },
      { name: 'Bridal Package', duration: 180, location: 'in_person', description: 'Complete bridal beauty package' },
    ]
  },
  photography: {
    icon: Camera,
    name: 'Photography / Creative',
    description: 'Photographers, videographers, creatives',
    types: [
      { name: 'Consultation', duration: 30, location: 'video', description: 'Discuss your project vision' },
      { name: 'Portrait Session', duration: 60, location: 'in_person', description: 'Professional portrait photography' },
      { name: 'Event Coverage', duration: 240, location: 'in_person', description: 'Full event photography' },
      { name: 'Photo Review', duration: 45, location: 'video', description: 'Review and select photos' },
      { name: 'Mini Session', duration: 30, location: 'in_person', description: 'Quick photo session' },
    ]
  },
};

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu', 'UTC',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
  'Australia/Sydney', 'Pacific/Auckland'
];

interface AppointmentsProps {
  hideHeader?: boolean;
}

const Appointments: React.FC<AppointmentsProps> = ({ hideHeader = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<string>('appointments');
  const [bookingTypes, setBookingTypes] = useState<BookingType[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [forms, setForms] = useState<FormItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ upcoming: 0, today: 0, this_week: 0, completed_this_month: 0, cancellation_rate: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('upcoming');
  const [bookingPageSettings, setBookingPageSettings] = useState<BookingPageSettings | null>(null);
  const [availabilitySchedules, setAvailabilitySchedules] = useState<AvailabilitySchedule[]>([]);
  const [isIndustryPresetsDialogOpen, setIsIndustryPresetsDialogOpen] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [compactLists, setCompactLists] = useState(false);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('week');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Dialog states
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [isBookingTypeDialogOpen, setIsBookingTypeDialogOpen] = useState(false);
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false);
  const [isBookingPageDialogOpen, setIsBookingPageDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [isQuickBookDialogOpen, setIsQuickBookDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editingBookingType, setEditingBookingType] = useState<BookingType | null>(null);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);

  // Form states
  const [appointmentForm, setAppointmentForm] = useState({
    booking_type_id: '',
    contact_id: '',
    staff_id: '',
    service_id: '',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    title: '',
    scheduled_at: '',
    duration_minutes: 30,
    timezone: 'America/New_York',
    location_type: 'video',
    location: '',
    meeting_link: '',
    status: 'scheduled',
    notes: '',
    internal_notes: '',
  });

  const [bookingTypeForm, setBookingTypeForm] = useState({
    name: '',
    slug: '',
    description: '',
    duration_minutes: 30,
    buffer_before: 0,
    buffer_after: 15,
    location_type: 'video',
    location_details: '',
    price: 0,
    currency: 'USD',
    color: '#3B82F6',
    is_active: true,
    max_bookings_per_day: null as number | null,
    min_notice_hours: 24,
    max_future_days: 60,
    requires_payment: false,
    allow_staff_selection: false,
    require_deposit: false,
    deposit_amount: null as number | null,
    intake_form_id: null as string | null,
    assigned_staff_ids: [] as number[],
    service_id: null as number | null,
    // Smart Scheduling Fields
    smart_buffer_mode: 'fixed' as 'dynamic' | 'fixed',
    overlap_prevention: 'strict' as 'strict' | 'allow_partial' | 'none',
    travel_time_minutes: 0,
    // Group Event Fields
    is_group_event: false,
    max_participants: 1,
    min_participants: 1,
    waitlist_enabled: false,
    participant_confirmation: false,
  });

  const [availabilityForm, setAvailabilityForm] = useState<{
    schedule_name: string;
    timezone: string;
    slots: AvailabilitySlot[];
    advanced_settings: AdvancedAvailabilitySettings;
  }>({
    schedule_name: 'Default Schedule',
    timezone: 'America/New_York',
    slots: DAYS_OF_WEEK.map((_, i) => ({
      day_of_week: i,
      start_time: '09:00',
      end_time: '17:00',
      is_available: i >= 1 && i <= 5, // Mon-Fri
    })),
    advanced_settings: {
      recurring_pattern: 'weekly',
      blackout_dates: [],
      working_hours_exceptions: [],
      max_bookings_per_time_slot: 1,
      minimum_notice_minutes: 60
    } as AdvancedAvailabilitySettings
  });

  const [bookingPageForm, setBookingPageForm] = useState<BookingPageSettings>({
    page_slug: '',
    page_title: '',
    welcome_message: '',
    logo_url: '',
    brand_color: '#3B82F6',
    show_branding: true,
    require_phone: false,
    custom_questions: [],
    confirmation_message: '',
    redirect_url: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  // Handle navigation state from Pipeline or other pages
  useEffect(() => {
    const state = location.state as {
      contactId?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      create?: boolean;
    } | null;

    if (state?.contactId || state?.contactName || state?.contactEmail || state?.create) {
      setAppointmentForm(prev => ({
        ...prev,
        contact_id: state.contactId || prev.contact_id,
        guest_name: state.contactName || prev.guest_name,
        guest_email: state.contactEmail || prev.guest_email,
        guest_phone: state.contactPhone || prev.guest_phone,
        title: state.contactName ? `Meeting with ${state.contactName}` : prev.title,
      }));
      setIsAppointmentDialogOpen(true);
      // Clear state to prevent re-opening
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MOBILE_SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { compactLists?: boolean };
      if (typeof parsed.compactLists === 'boolean') setCompactLists(parsed.compactLists);
    } catch {
      // ignore
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingTypesRes, appointmentsRes, statsRes, contactsRes, settingsRes, availabilityRes, staffRes, servicesRes, formsRes] = await Promise.all([
        api.get('/booking-types').catch(() => ({ data: { items: [] } })),
        api.get('/appointments').catch(() => ({ data: { items: [] } })),
        api.get('/appointments/dashboard-stats').catch(() => ({ data: { upcoming: 0, today: 0, this_week: 0, completed_this_month: 0, cancellation_rate: 0 } })),
        api.get('/contacts').catch(() => ({ data: { items: [] } })),
        api.get('/appointments/booking-page-settings').catch(() => ({ data: null })),
        api.get('/appointments/availability').catch(() => ({ data: { schedules: [], overrides: [] } })),
        api.get('/operations/staff').catch(() => ({ data: { items: [] } })),
        api.get('/operations/services').catch(() => ({ data: { items: [] } })),
        api.get('/forms').catch(() => ({ data: [] })),
      ]);

      setBookingTypes((bookingTypesRes.data as any)?.items || []);
      setAppointments((appointmentsRes.data as any)?.items || []);
      setStats(statsRes.data as DashboardStats || { upcoming: 0, today: 0, this_week: 0, completed_this_month: 0, cancellation_rate: 0 });
      setContacts((contactsRes.data as any)?.items || (contactsRes.data as any)?.contacts || []);
      if (settingsRes.data) {
        setBookingPageSettings(settingsRes.data as BookingPageSettings);
        setBookingPageForm(settingsRes.data as BookingPageSettings);
      }
      setAvailabilitySchedules((availabilityRes.data as any)?.schedules || []);
      setStaffMembers((staffRes.data as any)?.items || []);
      setServices((servicesRes.data as any)?.items || []);
      // Forms API returns array directly or wrapped in data
      const formsData = Array.isArray(formsRes.data) ? formsRes.data : (formsRes.data as any)?.items || [];
      setForms(formsData.filter((f: any) => f.status === 'active'));
    } catch (error) {
      console.error('Failed to load appointments data:', error);
      // Set default values on error
      setStats({ upcoming: 0, today: 0, this_week: 0, completed_this_month: 0, cancellation_rate: 0 });
    } finally {
      setLoading(false);
    }
  };

  const resetAppointmentForm = () => {
    setEditingAppointment(null);
    setAppointmentForm({
      booking_type_id: '',
      contact_id: '',
      staff_id: '',
      service_id: '',
      guest_name: '',
      guest_email: '',
      guest_phone: '',
      title: '',
      scheduled_at: '',
      duration_minutes: 30,
      timezone: 'America/New_York',
      location_type: 'video',
      location: '',
      meeting_link: '',
      status: 'scheduled',
      notes: '',
      internal_notes: '',
    });
  };

  const resetBookingTypeForm = () => {
    setEditingBookingType(null);
    setBookingTypeForm({
      name: '',
      slug: '',
      description: '',
      duration_minutes: 30,
      buffer_before: 0,
      buffer_after: 15,
      location_type: 'video',
      location_details: '',
      price: 0,
      currency: 'USD',
      color: '#3B82F6',
      is_active: true,
      max_bookings_per_day: null,
      min_notice_hours: 24,
      max_future_days: 60,
      requires_payment: false,
      allow_staff_selection: false,
      require_deposit: false,
      deposit_amount: null,
      intake_form_id: null,
      assigned_staff_ids: [],
      service_id: null,
      smart_buffer_mode: 'fixed',
      overlap_prevention: 'strict',
      travel_time_minutes: 0,
      is_group_event: false,
      max_participants: 1,
      min_participants: 1,
      waitlist_enabled: false,
      participant_confirmation: false,
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString();
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleString();
  };

  const getContactName = (apt: Appointment) => {
    if (apt.first_name || apt.last_name) return `${apt.first_name || ''} ${apt.last_name || ''}`.trim();
    if (apt.guest_name) return apt.guest_name;
    const c = contacts.find((x: any) => String(x.id) === String(apt.contact_id));
    if (c) return `${c.firstName || c.first_name || ''} ${c.lastName || c.last_name || ''}`.trim() || c.email || c.phone || 'Contact';
    return 'Contact';
  };

  const getLocationIcon = (locationType: string) => {
    if (locationType === 'video') return <Video className="h-4 w-4" />;
    if (locationType === 'phone') return <Phone className="h-4 w-4" />;
    return <MapPin className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3" /> },
      confirmed: { color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-3 w-3" /> },
      completed: { color: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle2 className="h-3 w-3" /> },
      cancelled: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
      no_show: { color: 'bg-orange-100 text-orange-800', icon: <AlertCircle className="h-3 w-3" /> },
      rescheduled: { color: 'bg-purple-100 text-purple-800', icon: <RefreshCw className="h-3 w-3" /> },
    };
    const { color, icon } = config[status] || config.scheduled;
    return (
      <Badge className={cn(color, 'flex items-center gap-1')}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (statusFilter !== 'all' && apt.status !== statusFilter) return false;
      const aptDate = new Date(apt.scheduled_at);
      const now = new Date();
      if (dateFilter === 'today') {
        if (aptDate.toDateString() !== now.toDateString()) return false;
      }
      if (dateFilter === 'upcoming') {
        if (aptDate.getTime() < now.getTime()) return false;
      }
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          apt.title?.toLowerCase().includes(search) ||
          apt.guest_name?.toLowerCase().includes(search) ||
          apt.guest_email?.toLowerCase().includes(search) ||
          getContactName(apt).toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [appointments, dateFilter, searchTerm, statusFilter, contacts]);

  const timeSlots = useMemo(() => {
    return Array.from({ length: 24 }, (_, h) => `${h}:00`);
  }, []);

  const getAppointmentsForDate = (date: Date) => {
    return filteredAppointments.filter((apt) => {
      const d = new Date(apt.scheduled_at);
      return d.toDateString() === date.toDateString();
    });
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const days: Date[] = [];
    const start = new Date(first);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(last);
    end.setDate(end.getDate() + (6 - end.getDay()));
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  };

  const getWeekDays = () => {
    const base = new Date(currentDate);
    const day = base.getDay();
    const start = new Date(base);
    start.setDate(base.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const goToToday = () => setCurrentDate(new Date());

  const navigateCalendar = (dir: 'prev' | 'next') => {
    const next = new Date(currentDate);
    if (calendarView === 'month') next.setMonth(next.getMonth() + (dir === 'next' ? 1 : -1));
    else next.setDate(next.getDate() + (dir === 'next' ? 7 : -7));
    setCurrentDate(next);
  };

  const openQuickBook = (date: Date, time?: string) => {
    resetAppointmentForm();
    const d = new Date(date);
    if (time) {
      const hour = parseInt(time, 10);
      if (!Number.isNaN(hour)) d.setHours(hour, 0, 0, 0);
    }
    setAppointmentForm((prev) => ({ ...prev, scheduled_at: d.toISOString() }));
    setIsQuickBookDialogOpen(true);
  };

  const openEditAppointment = (apt: Appointment) => {
    setEditingAppointment(apt);
    setAppointmentForm((prev) => ({
      ...prev,
      booking_type_id: String(apt.booking_type_id || ''),
      contact_id: String(apt.contact_id || ''),
      staff_id: String(apt.staff_id || ''),
      guest_name: apt.guest_name || '',
      guest_email: apt.guest_email || '',
      guest_phone: apt.guest_phone || '',
      title: apt.title || '',
      description: apt.description || '',
      scheduled_at: apt.scheduled_at || '',
      duration_minutes: apt.duration_minutes || 30,
      timezone: apt.timezone || 'America/New_York',
      location_type: apt.location_type || 'video',
      location: apt.location || '',
      meeting_link: apt.meeting_link || '',
      status: apt.status || 'scheduled',
      notes: apt.notes || '',
      internal_notes: apt.internal_notes || '',
    }));
    setIsAppointmentDialogOpen(true);
  };

  const confirmAppointment = async (id?: number) => {
    if (!id) return;
    try {
      await api.put(`/appointments/${id}`, { status: 'confirmed' });
      toast.success('Appointment confirmed');
      loadData();
    } catch (e) {
      toast.error('Failed to confirm appointment');
    }
  };

  const completeAppointment = async (id?: number) => {
    if (!id) return;
    try {
      await api.put(`/appointments/${id}`, { status: 'completed' });
      toast.success('Appointment completed');
      loadData();
    } catch (e) {
      toast.error('Failed to complete appointment');
    }
  };

  const markNoShow = async (id?: number) => {
    if (!id) return;
    try {
      await api.put(`/appointments/${id}`, { status: 'no_show' });
      toast.success('Marked as no-show');
      loadData();
    } catch (e) {
      toast.error('Failed to mark no-show');
    }
  };

  const cancelAppointment = async (id?: number) => {
    if (!id) return;
    try {
      await api.post(`/appointments/${id}/cancel`, { reason: 'Cancelled by user' });
      toast.success('Appointment cancelled');
      loadData();
    } catch (e) {
      toast.error('Failed to cancel appointment');
    }
  };

  const deleteAppointment = async (id?: number) => {
    if (!id) return;
    try {
      await api.delete(`/appointments/${id}`);
      toast.success('Appointment deleted');
      loadData();
    } catch (e) {
      toast.error('Failed to delete appointment');
    }
  };

  const openEditBookingType = (bt: BookingType) => {
    setEditingBookingType(bt);
    setBookingTypeForm((prev) => ({
      ...prev,
      ...bt,
      intake_form_id: bt.intake_form_id ? String(bt.intake_form_id) : null,
    } as any));
    setIsBookingTypeDialogOpen(true);
  };

  const duplicateBookingType = async (bt?: BookingType) => {
    if (!bt) return;
    try {
      const { id, ...rest } = bt;
      await api.post('/booking-types', { ...rest, name: `${bt.name} (Copy)`, slug: `${bt.slug}-copy-${Date.now()}` });
      toast.success('Booking type duplicated');
      loadData();
    } catch (e) {
      toast.error('Failed to duplicate booking type');
    }
  };

  const copyBookingLink = async (bt?: BookingType) => {
    if (!bt || !bookingPageSettings?.page_slug) return;
    const url = `${window.location.origin}/book/${bookingPageSettings.page_slug}/${bt.slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const deleteBookingType = async (id?: number) => {
    if (!id) return;
    try {
      await api.delete(`/booking-types/${id}`);
      toast.success('Booking type deleted');
      loadData();
    } catch (e) {
      toast.error('Failed to delete booking type');
    }
  };

  const saveAvailability = async () => {
    try {
      await api.post('/availability/save', availabilityForm);
      toast.success('Availability saved');
      setIsAvailabilityDialogOpen(false);
      loadData();
    } catch (e) {
      toast.error('Failed to save availability');
    }
  };

  const saveBookingPageSettings = async () => {
    try {
      await api.post('/appointments/booking-page-settings', bookingPageForm);
      toast.success('Booking page settings saved');
      loadData();
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };

  const saveAppointment = async () => {
    try {
      if (editingAppointment) {
        await api.put(`/appointments/${editingAppointment.id}`, appointmentForm);
      } else {
        await api.post('/appointments', appointmentForm);
      }
      toast.success('Appointment saved');
      setIsAppointmentDialogOpen(false);
      loadData();
    } catch (e) {
      toast.error('Failed to save appointment');
    }
  };

  const saveBookingType = async () => {
    try {
      if (editingBookingType) {
        await api.put(`/booking-types/${editingBookingType.id}`, bookingTypeForm);
      } else {
        await api.post('/booking-types', bookingTypeForm);
      }
      toast.success('Booking type saved');
      setIsBookingTypeDialogOpen(false);
      loadData();
    } catch (e) {
      toast.error('Failed to save booking type');
    }
  };

  const createFromIndustryPreset = async (industryKey?: string) => {
    if (!industryKey) return;
    const preset = industryPresets[industryKey];
    if (!preset) return;

    try {
      for (const type of preset.types) {
        await api.post('/booking-types', type);
      }
      toast.success(`${preset.name} types created`);
      loadData();
    } catch (e) {
      toast.error('Failed to create preset types');
    }
  };


  return (
    <div className={cn(hideHeader ? 'space-y-4' : (compactLists ? 'space-y-4 p-6' : 'space-y-6 p-6'))}>
      {/* Header */}
      {!hideHeader && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Appointments & Scheduling</h1>
            <p className="text-gray-600">Manage your calendar, booking types, and availability</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => setIsBookingPageDialogOpen(true)}>
              <Globe className="h-4 w-4 mr-2" />
              Booking Page
            </Button>
            <Button onClick={() => { resetAppointmentForm(); setIsAppointmentDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {(
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">{stats.today}</p>
                </div>
                <CalendarDays className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">{stats.this_week}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-bold">{stats.upcoming}</p>
                </div>
                <Clock className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed_this_month}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cancel Rate</p>
                  <p className="text-2xl font-bold">{stats.cancellation_rate}%</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Booking Types</p>
                  <p className="text-2xl font-bold">{bookingTypes.length}</p>
                </div>
                <FileTextIcon className="h-8 w-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="appointments">
            <Clock className="h-4 w-4 mr-2" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="booking-types">
            <FileTextIcon className="h-4 w-4 mr-2" />
            Booking Types
          </TabsTrigger>
          <TabsTrigger value="availability">
            <CalendarDays className="h-4 w-4 mr-2" />
            Availability
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => navigateCalendar('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={goToToday}>Today</Button>
                  <Button variant="outline" size="icon" onClick={() => navigateCalendar('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <h2 className="text-xl font-semibold ml-2">
                    {currentDate.toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                      ...(calendarView === 'day' ? { day: 'numeric', weekday: 'long' } : {})
                    })}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={calendarView} onValueChange={(v: 'month' | 'week' | 'day') => setCalendarView(v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="day">Day</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => openQuickBook(currentDate)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Quick Book
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Month View */}
              {calendarView === 'month' && (
                <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-600">
                      {day.slice(0, 3)}
                    </div>
                  ))}
                  {getCalendarDays().map((date, i) => {
                    const dayAppointments = getAppointmentsForDate(date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth();

                    return (
                      <div
                        key={i}
                        className={cn(
                          'bg-white min-h-[100px] p-1 cursor-pointer hover:bg-gray-50 transition-colors',
                          !isCurrentMonth && 'bg-gray-50 text-gray-400'
                        )}
                        onClick={() => {
                          setSelectedDate(date);
                          setCalendarView('day');
                          setCurrentDate(date);
                        }}
                      >
                        <div className={cn(
                          'text-sm font-medium p-1 rounded-full w-7 h-7 flex items-center justify-center',
                          isToday && 'bg-blue-600 text-white'
                        )}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1 mt-1">
                          {dayAppointments.slice(0, 3).map(apt => (
                            <div
                              key={apt.id}
                              className="text-xs p-1 rounded truncate"
                              style={{ backgroundColor: apt.color || '#3B82F6', color: 'white' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingAppointment(apt);
                              }}
                            >
                              {formatTime(apt.scheduled_at)} {apt.title || apt.booking_type_name}
                            </div>
                          ))}
                          {dayAppointments.length > 3 && (
                            <div className="text-xs text-gray-500 pl-1">
                              +{dayAppointments.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Week View */}
              {calendarView === 'week' && (
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-8 border-b">
                      <div className="p-2 text-sm font-medium text-gray-500"></div>
                      {getWeekDays().map((date, i) => {
                        const isToday = date.toDateString() === new Date().toDateString();
                        return (
                          <div key={i} className={cn(
                            'p-2 text-center border-l',
                            isToday && 'bg-blue-50'
                          )}>
                            <div className="text-sm text-gray-500">{DAYS_OF_WEEK[date.getDay()].slice(0, 3)}</div>
                            <div className={cn(
                              'text-lg font-semibold',
                              isToday && 'text-blue-600'
                            )}>{date.getDate()}</div>
                          </div>
                        );
                      })}
                    </div>
                    <ScrollArea className="h-[600px]">
                      <div className="grid grid-cols-8">
                        <div className="border-r">
                          {timeSlots.slice(6, 22).map(time => (
                            <div key={time} className="h-16 border-b p-1 text-xs text-gray-500">
                              {time}
                            </div>
                          ))}
                        </div>
                        {getWeekDays().map((date, dayIndex) => (
                          <div key={dayIndex} className="border-r relative">
                            {timeSlots.slice(6, 22).map(time => (
                              <div
                                key={time}
                                className="h-16 border-b hover:bg-gray-50 cursor-pointer"
                                onClick={() => openQuickBook(date, time)}
                              />
                            ))}
                            {getAppointmentsForDate(date).map(apt => {
                              const startHour = new Date(apt.scheduled_at).getHours();
                              const startMinute = new Date(apt.scheduled_at).getMinutes();
                              const top = ((startHour - 6) * 64) + (startMinute / 60 * 64);
                              const height = (apt.duration_minutes / 60) * 64;

                              if (startHour < 6 || startHour >= 22) return null;

                              return (
                                <div
                                  key={apt.id}
                                  className="absolute left-0 right-0 mx-1 rounded p-1 text-xs text-white cursor-pointer overflow-hidden"
                                  style={{
                                    top: `${top}px`,
                                    height: `${Math.max(height, 20)}px`,
                                    backgroundColor: apt.color || '#3B82F6',
                                  }}
                                  onClick={() => setViewingAppointment(apt)}
                                >
                                  <div className="font-medium truncate">{formatTime(apt.scheduled_at)}</div>
                                  <div className="truncate">{getContactName(apt)}</div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}

              {/* Day View */}
              {calendarView === 'day' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <ScrollArea className="h-[600px]">
                      <div className="relative">
                        {timeSlots.slice(6, 22).map(time => (
                          <div
                            key={time}
                            className="h-20 border-b flex hover:bg-gray-50 cursor-pointer"
                            onClick={() => openQuickBook(currentDate, time)}
                          >
                            <div className="w-16 p-2 text-sm text-gray-500 border-r">{time}</div>
                            <div className="flex-1 relative">
                              {getAppointmentsForDate(currentDate)
                                .filter(apt => {
                                  const hour = new Date(apt.scheduled_at).getHours();
                                  return hour === parseInt(time);
                                })
                                .map(apt => (
                                  <div
                                    key={apt.id}
                                    className="absolute inset-x-2 rounded p-2 text-white cursor-pointer"
                                    style={{
                                      backgroundColor: apt.color || '#3B82F6',
                                      top: `${(new Date(apt.scheduled_at).getMinutes() / 60) * 80}px`,
                                      height: `${Math.max((apt.duration_minutes / 60) * 80, 30)}px`,
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingAppointment(apt);
                                    }}
                                  >
                                    <div className="font-medium">{formatTime(apt.scheduled_at)} - {apt.title || apt.booking_type_name}</div>
                                    <div className="text-sm opacity-90">{getContactName(apt)}</div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Today's Schedule</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {getAppointmentsForDate(currentDate).length === 0 ? (
                            <p className="text-sm text-gray-500">No appointments scheduled</p>
                          ) : (
                            getAppointmentsForDate(currentDate).map(apt => (
                              <div
                                key={apt.id}
                                className="p-2 rounded border cursor-pointer hover:bg-gray-50"
                                onClick={() => setViewingAppointment(apt)}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: apt.color || '#3B82F6' }}
                                  />
                                  <span className="font-medium text-sm">{formatTime(apt.scheduled_at)}</span>
                                </div>
                                <div className="text-sm">{apt.title || apt.booking_type_name}</div>
                                <div className="text-xs text-gray-500">{getContactName(apt)}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        {/* Appointments List Tab */}
        <TabsContent value="appointments" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => { resetAppointmentForm(); setIsAppointmentDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Appointment
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No appointments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAppointments.map((appointment) => {
                      const bookingType = bookingTypes.find(bt => bt.id === appointment.booking_type_id);
                      const assignedStaff = appointment.staff_id ? staffMembers.find(s => s.id === appointment.staff_id) : null;
                      return (
                        <TableRow key={appointment.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setViewingAppointment(appointment)}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-1 h-10 rounded"
                                style={{ backgroundColor: appointment.color || bookingType?.color || '#3B82F6' }}
                              />
                              <div>
                                <div className="font-medium">{formatDate(appointment.scheduled_at)}</div>
                                <div className="text-sm text-gray-500">{formatTime(appointment.scheduled_at)}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{getContactName(appointment)}</div>
                              <div className="text-sm text-gray-500">{appointment.guest_email || appointment.contact_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{appointment.booking_type_name || bookingType?.name || 'Custom'}</TableCell>
                          <TableCell>
                            {assignedStaff || (appointment as any).staff_name ? (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                                  style={{ backgroundColor: assignedStaff?.color || (appointment as any).staff_color || '#3B82F6' }}
                                >
                                  {(assignedStaff?.name || (appointment as any).staff_name)?.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm">{assignedStaff?.name || (appointment as any).staff_name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getLocationIcon(appointment.location_type)}
                              <span className="capitalize">{appointment.location_type?.replace('_', ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell>{appointment.duration_minutes} min</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {getStatusBadge(appointment.status)}
                              {appointment.payment_status && appointment.payment_status !== 'unpaid' && (
                                <Badge variant="outline" className={cn("text-xs w-fit",
                                  appointment.payment_status === 'paid' ? "text-green-600 border-green-200 bg-green-50" :
                                    appointment.payment_status === 'deposit_paid' ? "text-amber-600 border-amber-200 bg-amber-50" :
                                      "text-gray-600"
                                )}>
                                  {appointment.payment_status === 'paid' ? 'Paid' : 'Deposit'}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setViewingAppointment(appointment); }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditAppointment(appointment); }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                {appointment.status === 'scheduled' && (
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); confirmAppointment(appointment.id); }}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Confirm
                                  </DropdownMenuItem>
                                )}
                                {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                                  <>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); completeAppointment(appointment.id); }}>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Mark Complete
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); markNoShow(appointment.id); }}>
                                      <AlertCircle className="h-4 w-4 mr-2" />
                                      Mark No-Show
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuSeparator />
                                {appointment.meeting_link && (
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(appointment.meeting_link, '_blank'); }}>
                                    <Video className="h-4 w-4 mr-2" />
                                    Join Meeting
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={(e) => { e.stopPropagation(); cancelAppointment(appointment.id); }}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={(e) => { e.stopPropagation(); deleteAppointment(appointment.id); }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Types Tab */}
        <TabsContent value="booking-types" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search booking types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsIndustryPresetsDialogOpen(true)}>
                <Zap className="h-4 w-4 mr-2" />
                Industry Presets
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Quick Add
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {Object.entries(industryPresets).slice(0, 6).map(([key, preset]) => (
                    <DropdownMenuItem key={key} onClick={() => {
                      const firstType = preset.types[0];
                      setBookingTypeForm(prev => ({
                        ...prev,
                        name: firstType.name,
                        description: firstType.description,
                        duration_minutes: firstType.duration,
                        location_type: firstType.location,
                        price: firstType.price || 0,
                      }));
                      setIsBookingTypeDialogOpen(true);
                    }}>
                      <preset.icon className="h-4 w-4 mr-2" />
                      {preset.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsIndustryPresetsDialogOpen(true)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View All Industries...
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => { resetBookingTypeForm(); setIsBookingTypeDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Booking Type
              </Button>
            </div>
          </div>

          {bookingTypes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No booking types yet</h3>
                <p className="text-gray-500 mb-4">Create your first booking type to start accepting appointments</p>
                <Button onClick={() => { resetBookingTypeForm(); setIsBookingTypeDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Booking Type
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookingTypes.map((bookingType) => (
                <Card key={bookingType.id} className="relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: bookingType.color }}
                  />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getLocationIcon(bookingType.location_type)}
                        <Badge variant={bookingType.is_active ? 'default' : 'secondary'}>
                          {bookingType.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditBookingType(bookingType)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateBookingType(bookingType)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyBookingLink(bookingType)}>
                            <Link2 className="h-4 w-4 mr-2" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deleteBookingType(bookingType.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="text-lg">{bookingType.name}</CardTitle>
                    {bookingType.description && (
                      <CardDescription className="line-clamp-2">{bookingType.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Duration
                        </span>
                        <span className="font-medium">{bookingType.duration_minutes} min</span>
                      </div>
                      {bookingType.price > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            Price
                          </span>
                          <span className="font-medium">${bookingType.price} {bookingType.currency}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Buffer</span>
                        <span className="font-medium">
                          {bookingType.buffer_before > 0 && `${bookingType.buffer_before}m before`}
                          {bookingType.buffer_before > 0 && bookingType.buffer_after > 0 && ' / '}
                          {bookingType.buffer_after > 0 && `${bookingType.buffer_after}m after`}
                          {!bookingType.buffer_before && !bookingType.buffer_after && 'None'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Notice</span>
                        <span className="font-medium">{bookingType.min_notice_hours}h minimum</span>
                      </div>
                      {/* Show linked service */}
                      {(bookingType as any).service_id && services.find(s => s.id === (bookingType as any).service_id) && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            Service
                          </span>
                          <span className="font-medium">{services.find(s => s.id === (bookingType as any).service_id)?.name}</span>
                        </div>
                      )}
                      {/* Show assigned staff count */}
                      {bookingType.assigned_staff_ids && bookingType.assigned_staff_ids.length > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Staff
                          </span>
                          <span className="font-medium">{bookingType.assigned_staff_ids.length} assigned</span>
                        </div>
                      )}
                      {/* Show intake form */}
                      {bookingType.intake_form_id && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1">
                            <FileTextIcon className="h-4 w-4" />
                            Form
                          </span>
                          <Badge variant="outline" className="text-xs">Intake form linked</Badge>
                        </div>
                      )}
                      <Separator />
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => copyBookingLink(bookingType)}>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Link
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditBookingType(bookingType)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>


        {/* Availability Tab */}
        <TabsContent value="availability" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Weekly Availability</CardTitle>
                      <CardDescription>Set your regular working hours</CardDescription>
                    </div>
                    <Button onClick={() => setIsAvailabilityDialogOpen(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Schedule
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {DAYS_OF_WEEK.map((day, index) => {
                      const slot = availabilityForm.slots.find(s => s.day_of_week === index);
                      return (
                        <div key={day} className="flex items-center justify-between py-3 border-b last:border-0">
                          <div className="flex items-center gap-4">
                            <Switch
                              checked={slot?.is_available || false}
                              onCheckedChange={(checked) => {
                                setAvailabilityForm(prev => ({
                                  ...prev,
                                  slots: prev.slots.map(s =>
                                    s.day_of_week === index ? { ...s, is_available: checked } : s
                                  ),
                                }));
                              }}
                            />
                            <span className={cn(
                              'font-medium w-24',
                              !slot?.is_available && 'text-gray-400'
                            )}>
                              {day}
                            </span>
                          </div>
                          {slot?.is_available ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={slot.start_time}
                                onChange={(e) => {
                                  setAvailabilityForm(prev => ({
                                    ...prev,
                                    slots: prev.slots.map(s =>
                                      s.day_of_week === index ? { ...s, start_time: e.target.value } : s
                                    ),
                                  }));
                                }}
                                className="w-32"
                              />
                              <span className="text-gray-500">to</span>
                              <Input
                                type="time"
                                value={slot.end_time}
                                onChange={(e) => {
                                  setAvailabilityForm(prev => ({
                                    ...prev,
                                    slots: prev.slots.map(s =>
                                      s.day_of_week === index ? { ...s, end_time: e.target.value } : s
                                    ),
                                  }));
                                }}
                                className="w-32"
                              />
                            </div>
                          ) : (
                            <span className="text-gray-400">Unavailable</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button onClick={saveAvailability}>Save Availability</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Timezone</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={availabilityForm.timezone}
                    onValueChange={(v) => setAvailabilityForm(prev => ({ ...prev, timezone: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map(tz => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setAvailabilityForm(prev => ({
                        ...prev,
                        slots: prev.slots.map(s => ({
                          ...s,
                          is_available: s.day_of_week >= 1 && s.day_of_week <= 5,
                          start_time: '09:00',
                          end_time: '17:00',
                        })),
                      }));
                    }}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Set 9-5 Weekdays
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setAvailabilityForm(prev => ({
                        ...prev,
                        slots: prev.slots.map(s => ({
                          ...s,
                          is_available: true,
                          start_time: '08:00',
                          end_time: '20:00',
                        })),
                      }));
                    }}
                  >
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Set Extended Hours
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setAvailabilityForm(prev => ({
                        ...prev,
                        slots: prev.slots.map(s => ({ ...s, is_available: false })),
                      }));
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Block All Days
                  </Button>
                </CardContent>
              </Card>



              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Advanced Rules</CardTitle>
                  <CardDescription>Configure recurrence, exceptions, and capacity</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdvancedAvailabilityEditor
                    value={availabilityForm.advanced_settings}
                    onChange={(newSettings) => setAvailabilityForm(prev => ({ ...prev, advanced_settings: newSettings }))}
                  />
                </CardContent>
              </Card>

            </div>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Booking Page Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Booking Page
                </CardTitle>
                <CardDescription>Customize your public booking page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Page URL</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center bg-gray-100 rounded-md px-3 text-sm text-gray-600">
                      {window.location.origin}/book/
                    </div>
                    <Input
                      value={bookingPageForm.page_slug}
                      onChange={(e) => setBookingPageForm(prev => ({ ...prev, page_slug: e.target.value }))}
                      placeholder="your-name"
                      className="w-40"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Page Title</Label>
                  <Input
                    value={bookingPageForm.page_title}
                    onChange={(e) => setBookingPageForm(prev => ({ ...prev, page_title: e.target.value }))}
                    placeholder="Schedule a meeting with me"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Welcome Message</Label>
                  <Textarea
                    value={bookingPageForm.welcome_message}
                    onChange={(e) => setBookingPageForm(prev => ({ ...prev, welcome_message: e.target.value }))}
                    placeholder="Welcome! Please select a time that works for you."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Brand Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={bookingPageForm.brand_color}
                      onChange={(e) => setBookingPageForm(prev => ({ ...prev, brand_color: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={bookingPageForm.brand_color}
                      onChange={(e) => setBookingPageForm(prev => ({ ...prev, brand_color: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Require Phone Number</Label>
                  <Switch
                    checked={bookingPageForm.require_phone}
                    onCheckedChange={(v) => setBookingPageForm(prev => ({ ...prev, require_phone: v }))}
                  />
                </div>
                <Button onClick={saveBookingPageSettings} className="w-full">
                  Save Booking Page Settings
                </Button>
                {bookingPageSettings?.page_slug && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(`/book/${bookingPageSettings.page_slug}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview Booking Page
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Reminders & Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Reminders & Notifications
                </CardTitle>
                <CardDescription>Configure appointment reminders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium">Email Confirmation</div>
                        <div className="text-sm text-gray-500">Send when appointment is booked</div>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium">Email Reminder (24h)</div>
                        <div className="text-sm text-gray-500">Send 24 hours before</div>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium">Email Reminder (1h)</div>
                        <div className="text-sm text-gray-500">Send 1 hour before</div>
                      </div>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">SMS Reminder</div>
                        <div className="text-sm text-gray-500">Send 1 hour before</div>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setIsReminderDialogOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Reminders
                </Button>
              </CardContent>
            </Card>

            {/* Calendar Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Calendar Integration
                </CardTitle>
                <CardDescription>Sync with external calendars</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">Google Calendar</div>
                        <div className="text-sm text-gray-500">Not connected</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">Outlook Calendar</div>
                        <div className="text-sm text-gray-500">Not connected</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">Apple Calendar</div>
                        <div className="text-sm text-gray-500">Not connected</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Conferencing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Video Conferencing
                </CardTitle>
                <CardDescription>Auto-generate meeting links</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <Video className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">Zoom</div>
                        <div className="text-sm text-gray-500">Not connected</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                        <Video className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">Google Meet</div>
                        <div className="text-sm text-gray-500">Not connected</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                        <Video className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium">Microsoft Teams</div>
                        <div className="text-sm text-gray-500">Not connected</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>


      {/* Appointment Dialog */}
      <Dialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAppointment ? 'Edit Appointment' : 'New Appointment'}</DialogTitle>
            <DialogDescription>Schedule an appointment with a client</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Booking Type</Label>
                <Select
                  value={appointmentForm.booking_type_id}
                  onValueChange={(v) => {
                    const bt = bookingTypes.find(b => b.id === parseInt(v));
                    setAppointmentForm(prev => ({
                      ...prev,
                      booking_type_id: v,
                      duration_minutes: bt?.duration_minutes || prev.duration_minutes,
                      location_type: bt?.location_type || prev.location_type,
                      title: bt?.name || prev.title,
                    }));
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom Appointment</SelectItem>
                    {bookingTypes.map(bt => (
                      <SelectItem key={bt.id} value={String(bt.id)}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: bt.color }} />
                          {bt.name} ({bt.duration_minutes}min)
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contact</Label>
                <Select
                  value={appointmentForm.contact_id}
                  onValueChange={(v) => {
                    const contact = contacts.find(c => c.id === parseInt(v));
                    setAppointmentForm(prev => ({
                      ...prev,
                      contact_id: v,
                      guest_name: contact ? `${contact.firstName || contact.first_name || ''} ${contact.lastName || contact.last_name || ''}`.trim() : prev.guest_name,
                      guest_email: contact?.email || prev.guest_email,
                      guest_phone: contact?.phone || prev.guest_phone,
                    }));
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select or add new" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New Guest</SelectItem>
                    {contacts.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.firstName || c.first_name} {c.lastName || c.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Staff Selection */}
            {staffMembers.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assigned Staff
                </Label>
                <Select
                  value={appointmentForm.staff_id || 'none'}
                  onValueChange={(v) => setAppointmentForm(prev => ({ ...prev, staff_id: v === 'none' ? '' : v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific staff</SelectItem>
                    {staffMembers.filter(s => s.is_active !== false).map(staff => (
                      <SelectItem key={staff.id} value={String(staff.id)}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                            style={{ backgroundColor: staff.color || '#3B82F6' }}
                          >
                            {staff.name?.charAt(0).toUpperCase()}
                          </div>
                          {staff.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(!appointmentForm.contact_id || appointmentForm.contact_id === 'new') && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Guest Name *</Label>
                  <Input
                    value={appointmentForm.guest_name}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, guest_name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Guest Email *</Label>
                  <Input
                    type="email"
                    value={appointmentForm.guest_email}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, guest_email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Guest Phone</Label>
                  <Input
                    value={appointmentForm.guest_phone}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, guest_phone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={appointmentForm.title}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Meeting title"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={appointmentForm.scheduled_at}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, scheduled_at: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Select
                  value={String(appointmentForm.duration_minutes)}
                  onValueChange={(v) => setAppointmentForm(prev => ({ ...prev, duration_minutes: parseInt(v) }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Label>Timezone</Label>
                <Select
                  value={appointmentForm.timezone}
                  onValueChange={(v) => setAppointmentForm(prev => ({ ...prev, timezone: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location Type</Label>
                <Select
                  value={appointmentForm.location_type}
                  onValueChange={(v) => setAppointmentForm(prev => ({ ...prev, location_type: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video Call</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="in_person">In Person</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={appointmentForm.status}
                  onValueChange={(v) => setAppointmentForm(prev => ({ ...prev, status: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                    <SelectItem value="waitlist">Waitlist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {appointmentForm.location_type === 'in_person' && (
              <div className="space-y-2">
                <Label>Location Address</Label>
                <Input
                  value={appointmentForm.location}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="123 Main St, City, State"
                />
              </div>
            )}

            {appointmentForm.location_type === 'video' && (
              <div className="space-y-2">
                <Label>Meeting Link</Label>
                <Input
                  value={appointmentForm.meeting_link}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, meeting_link: e.target.value }))}
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes (visible to client)</Label>
              <Textarea
                value={appointmentForm.notes}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                placeholder="Any notes for the client..."
              />
            </div>

            <div className="space-y-2">
              <Label>Internal Notes (private)</Label>
              <Textarea
                value={appointmentForm.internal_notes}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, internal_notes: e.target.value }))}
                rows={2}
                placeholder="Internal notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAppointmentDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={saveAppointment}
              disabled={!appointmentForm.scheduled_at || ((!appointmentForm.contact_id || appointmentForm.contact_id === 'new') && !appointmentForm.guest_name)}
            >
              {editingAppointment ? 'Update' : 'Create'} Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Booking Type Dialog */}
      <Dialog open={isBookingTypeDialogOpen} onOpenChange={setIsBookingTypeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBookingType ? 'Edit Booking Type' : 'New Booking Type'}</DialogTitle>
            <DialogDescription>Configure your appointment type settings</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={bookingTypeForm.name}
                    onChange={(e) => setBookingTypeForm(prev => ({
                      ...prev,
                      name: e.target.value,
                      slug: prev.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    }))}
                    placeholder="e.g., Discovery Call"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL Slug</Label>
                  <Input
                    value={bookingTypeForm.slug}
                    onChange={(e) => setBookingTypeForm(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="discovery-call"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={bookingTypeForm.description}
                  onChange={(e) => setBookingTypeForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Describe what this appointment is for..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select
                    value={String(bookingTypeForm.duration_minutes)}
                    onValueChange={(v) => setBookingTypeForm(prev => ({ ...prev, duration_minutes: parseInt(v) }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="180">3 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select
                    value={bookingTypeForm.location_type}
                    onValueChange={(v) => setBookingTypeForm(prev => ({ ...prev, location_type: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Call</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="in_person">In Person</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={bookingTypeForm.color}
                      onChange={(e) => setBookingTypeForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={bookingTypeForm.color}
                      onChange={(e) => setBookingTypeForm(prev => ({ ...prev, color: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {bookingTypeForm.location_type === 'in_person' && (
                <div className="space-y-2">
                  <Label>Location Details</Label>
                  <Input
                    value={bookingTypeForm.location_details}
                    onChange={(e) => setBookingTypeForm(prev => ({ ...prev, location_details: e.target.value }))}
                    placeholder="123 Main St, City, State"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={bookingTypeForm.is_active}
                  onCheckedChange={(v) => setBookingTypeForm(prev => ({ ...prev, is_active: v }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="scheduling" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Buffer Before (minutes)</Label>
                  <Input
                    type="number"
                    value={bookingTypeForm.buffer_before}
                    onChange={(e) => setBookingTypeForm(prev => ({ ...prev, buffer_before: parseInt(e.target.value) || 0 }))}
                    min={0}
                  />
                  <p className="text-xs text-gray-500">Time blocked before each appointment</p>
                </div>
                <div className="space-y-2">
                  <Label>Buffer After (minutes)</Label>
                  <Input
                    type="number"
                    value={bookingTypeForm.buffer_after}
                    onChange={(e) => setBookingTypeForm(prev => ({ ...prev, buffer_after: parseInt(e.target.value) || 0 }))}
                    min={0}
                  />
                  <p className="text-xs text-gray-500">Time blocked after each appointment</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Notice (hours)</Label>
                  <Input
                    type="number"
                    value={bookingTypeForm.min_notice_hours}
                    onChange={(e) => setBookingTypeForm(prev => ({ ...prev, min_notice_hours: parseInt(e.target.value) || 0 }))}
                    min={0}
                  />
                  <p className="text-xs text-gray-500">How far in advance must bookings be made</p>
                </div>
                <div className="space-y-2">
                  <Label>Max Future Days</Label>
                  <Input
                    type="number"
                    value={bookingTypeForm.max_future_days}
                    onChange={(e) => setBookingTypeForm(prev => ({ ...prev, max_future_days: parseInt(e.target.value) || 60 }))}
                    min={1}
                  />
                  <p className="text-xs text-gray-500">How far in the future can bookings be made</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Max Bookings Per Day</Label>
                <Input
                  type="number"
                  value={bookingTypeForm.max_bookings_per_day || ''}
                  onChange={(e) => setBookingTypeForm(prev => ({ ...prev, max_bookings_per_day: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="Unlimited"
                  min={1}
                />
                <p className="text-xs text-gray-500">Leave empty for unlimited</p>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <SmartBufferSettings
                  value={{
                    smart_buffer: bookingTypeForm.smart_buffer_mode,
                    overlap_prevention: bookingTypeForm.overlap_prevention,
                    travel_time_between_appointments: bookingTypeForm.travel_time_minutes
                  }}
                  onChange={(newSettings) => setBookingTypeForm(prev => ({
                    ...prev,
                    smart_buffer_mode: newSettings.smart_buffer,
                    overlap_prevention: newSettings.overlap_prevention,
                    travel_time_minutes: newSettings.travel_time_between_appointments
                  }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={bookingTypeForm.price}
                    onChange={(e) => setBookingTypeForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={bookingTypeForm.currency}
                    onValueChange={(v) => setBookingTypeForm(prev => ({ ...prev, currency: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                      <SelectItem value="AUD">AUD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Payment</Label>
                  <p className="text-xs text-gray-500">Collect payment when booking</p>
                </div>
                <Switch
                  checked={bookingTypeForm.requires_payment}
                  onCheckedChange={(v) => setBookingTypeForm(prev => ({ ...prev, requires_payment: v }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Deposit</Label>
                  <p className="text-xs text-gray-500">Collect a deposit instead of full payment</p>
                </div>
                <Switch
                  checked={bookingTypeForm.require_deposit}
                  onCheckedChange={(v) => setBookingTypeForm(prev => ({ ...prev, require_deposit: v }))}
                />
              </div>

              {bookingTypeForm.require_deposit && (
                <div className="space-y-2">
                  <Label>Deposit Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={bookingTypeForm.deposit_amount || ''}
                    onChange={(e) => setBookingTypeForm(prev => ({ ...prev, deposit_amount: e.target.value ? parseFloat(e.target.value) : null }))}
                    min={0}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-4">
              {/* Service Integration */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Link to Service
                </Label>
                <Select
                  value={String(bookingTypeForm.service_id || 'none')}
                  onValueChange={(v) => {
                    const serviceId = v && v !== 'none' ? parseInt(v) : null;
                    const service = services.find(s => s.id === serviceId);
                    setBookingTypeForm(prev => ({
                      ...prev,
                      service_id: serviceId,
                      // Auto-fill from service if selected
                      ...(service ? {
                        price: service.price || prev.price,
                        duration_minutes: service.duration_minutes || prev.duration_minutes,
                      } : {})
                    }));
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No linked service</SelectItem>
                    {services.filter(s => s.is_active !== false).map(service => (
                      <SelectItem key={service.id} value={String(service.id)}>
                        <div className="flex items-center justify-between gap-4">
                          <span>{service.name}</span>
                          {service.price && <span className="text-gray-500">${service.price}</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Link to a service for pricing and duration</p>
              </div>

              {/* Staff Assignment */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assigned Staff Members
                </Label>
                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {staffMembers.filter(s => s.is_active !== false).length === 0 ? (
                    <p className="text-sm text-gray-500">No staff members available. Add staff in Staff Members page.</p>
                  ) : (
                    staffMembers.filter(s => s.is_active !== false).map(staff => (
                      <div key={staff.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`staff-${staff.id}`}
                          checked={bookingTypeForm.assigned_staff_ids.includes(staff.id)}
                          onCheckedChange={(checked) => {
                            setBookingTypeForm(prev => ({
                              ...prev,
                              assigned_staff_ids: checked
                                ? [...prev.assigned_staff_ids, staff.id]
                                : prev.assigned_staff_ids.filter(id => id !== staff.id)
                            }));
                          }}
                        />
                        <label htmlFor={`staff-${staff.id}`} className="flex items-center gap-2 text-sm cursor-pointer">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                            style={{ backgroundColor: staff.color || '#3B82F6' }}
                          >
                            {staff.name?.charAt(0).toUpperCase()}
                          </div>
                          <span>{staff.name}</span>
                          <Badge variant="outline" className="text-xs">{staff.role}</Badge>
                        </label>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-500">Select staff who can handle this booking type</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Staff Selection</Label>
                  <p className="text-xs text-gray-500">Let clients choose their preferred staff member</p>
                </div>
                <Switch
                  checked={bookingTypeForm.allow_staff_selection}
                  onCheckedChange={(v) => setBookingTypeForm(prev => ({ ...prev, allow_staff_selection: v }))}
                />
              </div>

              {/* Intake Form Integration */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileTextIcon className="h-4 w-4" />
                  Intake Form
                </Label>
                <Select
                  value={bookingTypeForm.intake_form_id || 'none'}
                  onValueChange={(v) => setBookingTypeForm(prev => ({ ...prev, intake_form_id: v && v !== 'none' ? v : null }))}
                >
                  <SelectTrigger><SelectValue placeholder="No intake form" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No intake form</SelectItem>
                    {forms
                      .filter((form) => String(form.id ?? '').trim() !== '')
                      .map(form => (
                        <SelectItem key={form.id} value={form.id}>
                          {form.title || form.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Collect additional information when booking</p>
              </div>

              {/* Group Event Settings */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Group Event</Label>
                    <p className="text-xs text-gray-500">Enable group bookings for classes or workshops</p>
                  </div>
                  <Switch
                    checked={bookingTypeForm.is_group_event}
                    onCheckedChange={(v) => setBookingTypeForm(prev => ({ ...prev, is_group_event: v }))}
                  />
                </div>

                {bookingTypeForm.is_group_event && (
                  <GroupEventSettings
                    value={{
                      max_participants: bookingTypeForm.max_participants,
                      min_participants: bookingTypeForm.min_participants,
                      waitlist_enabled: bookingTypeForm.waitlist_enabled,
                      participant_confirmation: bookingTypeForm.participant_confirmation
                    }}
                    onChange={(newSettings) => setBookingTypeForm(prev => ({ ...prev, ...newSettings }))}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsBookingTypeDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveBookingType} disabled={!bookingTypeForm.name}>
              {editingBookingType ? 'Update' : 'Create'} Booking Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* View Appointment Dialog */}
      <Dialog open={!!viewingAppointment} onOpenChange={() => setViewingAppointment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {viewingAppointment && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div
                  className="w-1 h-full min-h-[100px] rounded"
                  style={{ backgroundColor: viewingAppointment.color || '#3B82F6' }}
                />
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold">{viewingAppointment.title || viewingAppointment.booking_type_name}</h3>
                    <p className="text-gray-500">{viewingAppointment.booking_type_name}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{formatDateTime(viewingAppointment.scheduled_at)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{viewingAppointment.duration_minutes} minutes</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    {getLocationIcon(viewingAppointment.location_type)}
                    <span className="capitalize">{viewingAppointment.location_type?.replace('_', ' ')}</span>
                    {viewingAppointment.location && <span>- {viewingAppointment.location}</span>}
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-xs text-gray-500">Client</Label>
                    <p className="font-medium">{getContactName(viewingAppointment)}</p>
                    {(viewingAppointment.guest_email || viewingAppointment.contact_email) && (
                      <p className="text-sm text-gray-500">{viewingAppointment.guest_email || viewingAppointment.contact_email}</p>
                    )}
                    {viewingAppointment.guest_phone && (
                      <p className="text-sm text-gray-500">{viewingAppointment.guest_phone}</p>
                    )}
                  </div>

                  {/* Staff Member */}
                  {(viewingAppointment.staff_id || (viewingAppointment as any).staff_name) && (
                    <div>
                      <Label className="text-xs text-gray-500">Assigned Staff</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {(() => {
                          const staff = viewingAppointment.staff_id ? staffMembers.find(s => s.id === viewingAppointment.staff_id) : null;
                          const staffName = staff?.name || (viewingAppointment as any).staff_name;
                          const staffColor = staff?.color || (viewingAppointment as any).staff_color || '#3B82F6';
                          return (
                            <>
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                                style={{ backgroundColor: staffColor }}
                              >
                                {staffName?.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium">{staffName}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs text-gray-500">Status</Label>
                    <div className="mt-1">{getStatusBadge(viewingAppointment.status)}</div>
                  </div>

                  {viewingAppointment.notes && (
                    <div>
                      <Label className="text-xs text-gray-500">Notes</Label>
                      <p className="text-sm">{viewingAppointment.notes}</p>
                    </div>
                  )}

                  {viewingAppointment.internal_notes && (
                    <div>
                      <Label className="text-xs text-gray-500">Internal Notes</Label>
                      <p className="text-sm">{viewingAppointment.internal_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                {viewingAppointment.meeting_link && (
                  <Button onClick={() => window.open(viewingAppointment.meeting_link, '_blank')}>
                    <Video className="h-4 w-4 mr-2" />
                    Join Meeting
                  </Button>
                )}
                <Button variant="outline" onClick={() => {
                  setViewingAppointment(null);
                  openEditAppointment(viewingAppointment);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                {viewingAppointment.status === 'scheduled' && (
                  <Button variant="outline" onClick={() => {
                    confirmAppointment(viewingAppointment.id);
                    setViewingAppointment(null);
                  }}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm
                  </Button>
                )}
                {(viewingAppointment.status === 'scheduled' || viewingAppointment.status === 'confirmed') && (
                  <>
                    <Button variant="outline" onClick={() => {
                      completeAppointment(viewingAppointment.id);
                      setViewingAppointment(null);
                    }}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                    <Button variant="outline" className="text-red-600" onClick={() => {
                      cancelAppointment(viewingAppointment.id);
                      setViewingAppointment(null);
                    }}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Book Dialog */}
      <Dialog open={isQuickBookDialogOpen} onOpenChange={setIsQuickBookDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Book</DialogTitle>
            <DialogDescription>Quickly schedule an appointment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Booking Type *</Label>
              <Select
                value={appointmentForm.booking_type_id}
                onValueChange={(v) => {
                  const bt = bookingTypes.find(b => b.id === parseInt(v));
                  setAppointmentForm(prev => ({
                    ...prev,
                    booking_type_id: v,
                    duration_minutes: bt?.duration_minutes || prev.duration_minutes,
                    title: bt?.name || prev.title,
                  }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {bookingTypes.map(bt => (
                    <SelectItem key={bt.id} value={String(bt.id)}>{bt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Contact *</Label>
              <Select
                value={appointmentForm.contact_id}
                onValueChange={(v) => setAppointmentForm(prev => ({ ...prev, contact_id: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
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
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={appointmentForm.scheduled_at}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, scheduled_at: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuickBookDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setIsQuickBookDialogOpen(false);
                setIsAppointmentDialogOpen(true);
              }}
              variant="outline"
            >
              More Options
            </Button>
            <Button
              onClick={() => {
                saveAppointment();
                setIsQuickBookDialogOpen(false);
              }}
              disabled={!appointmentForm.booking_type_id || appointmentForm.booking_type_id === 'custom' || !appointmentForm.contact_id || appointmentForm.contact_id === 'new' || !appointmentForm.scheduled_at}
            >
              Book
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Industry Presets Dialog */}
      <Dialog open={isIndustryPresetsDialogOpen} onOpenChange={setIsIndustryPresetsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Industry Booking Type Presets</DialogTitle>
            <DialogDescription>
              Choose your industry to automatically create booking types tailored to your business
            </DialogDescription>
          </DialogHeader>

          {!selectedIndustry ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
              {Object.entries(industryPresets).map(([key, preset]) => (
                <Card
                  key={key}
                  className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
                  onClick={() => setSelectedIndustry(key)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <preset.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{preset.name}</h3>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{preset.description}</p>
                    <Badge variant="outline" className="text-xs">
                      {preset.types.length} booking types
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIndustry(null)}
                className="mb-4"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Industries
              </Button>

              <div className="flex items-center gap-3 mb-4">
                {(() => {
                  const preset = industryPresets[selectedIndustry];
                  const IconComponent = preset.icon;
                  return (
                    <>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <IconComponent className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{preset.name}</h3>
                        <p className="text-sm text-gray-500">{preset.description}</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="space-y-3 mb-6">
                <h4 className="font-medium text-sm text-gray-700">Booking types that will be created:</h4>
                {industryPresets[selectedIndustry].types.map((type, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {type.location === 'video' && <Video className="h-4 w-4 text-blue-500" />}
                      {type.location === 'phone' && <Phone className="h-4 w-4 text-green-500" />}
                      {type.location === 'in_person' && <MapPin className="h-4 w-4 text-orange-500" />}
                      <div>
                        <p className="font-medium">{type.name}</p>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {type.duration}min
                      </span>
                      {type.price !== undefined && type.price > 0 && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${type.price}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This will create {industryPresets[selectedIndustry].types.length} new booking types.
                  You can customize them after creation.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsIndustryPresetsDialogOpen(false); setSelectedIndustry(null); }}>
              Cancel
            </Button>
            {selectedIndustry && (
              <Button onClick={() => createFromIndustryPreset(selectedIndustry)}>
                <Plus className="h-4 w-4 mr-2" />
                Create {industryPresets[selectedIndustry].types.length} Booking Types
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}

export default Appointments;
