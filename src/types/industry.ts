// Industry types and configurations for local business verticals

export type IndustrySlug = 
  | 'home_services' 
  | 'healthcare' 
  | 'real_estate' 
  | 'legal' 
  | 'transportation' 
  | 'beauty_wellness'
  | 'local_business'
  | 'professional_services';

export interface IndustryType {
  id: number;
  slug: IndustrySlug;
  name: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
}

export interface UserIndustrySettings {
  id: number;
  userId: number;
  industryTypeId: number;
  industryType?: IndustryType;
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  businessHours: BusinessHours;
  serviceArea: string;
  licenseNumber?: string;
  insuranceInfo?: string;
  customSettings: Record<string, any>;
}

export interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
  timezone: string;
}

export interface DayHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breaks?: { start: string; end: string }[];
}

// =====================================================
// SERVICES
// =====================================================

export interface ServiceCategory {
  id: number;
  userId: number;
  industryTypeId?: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  services?: Service[];
}

export interface Service {
  id: number;
  userId: number;
  categoryId?: number;
  category?: ServiceCategory;
  name: string;
  description?: string;
  durationMinutes: number;
  price?: number;
  priceType: 'fixed' | 'hourly' | 'estimate' | 'free';
  depositRequired: boolean;
  depositAmount?: number;
  depositPercentage?: number;
  bufferBefore: number;
  bufferAfter: number;
  maxBookingsPerDay?: number;
  requiresConfirmation: boolean;
  intakeFormId?: number;
  isActive: boolean;
}

// =====================================================
// JOBS & DISPATCH
// =====================================================

export type JobStatus = 
  | 'new' 
  | 'scheduled' 
  | 'dispatched' 
  | 'en_route' 
  | 'arrived' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'on_hold';

export type JobPriority = 'low' | 'normal' | 'high' | 'emergency';

export interface Job {
  id: number;
  userId: number;
  contactId: number;
  contact?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
  };
  serviceId?: number;
  service?: Service;
  assignedTo?: number;
  assignedStaff?: StaffMember;
  jobNumber: string;
  title: string;
  description?: string;
  status: JobStatus;
  priority: JobPriority;
  jobType?: string;
  
  // Location
  serviceAddress?: string;
  serviceCity?: string;
  serviceState?: string;
  serviceZip?: string;
  serviceLat?: number;
  serviceLng?: number;
  
  // Scheduling
  scheduledDate?: string;
  scheduledTimeStart?: string;
  scheduledTimeEnd?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  estimatedDuration?: number;
  
  // For towing/transport
  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffAddress?: string;
  dropoffLat?: number;
  dropoffLng?: number;
  vehicleInfo?: VehicleInfo;
  
  // Pricing
  estimatedCost?: number;
  actualCost?: number;
  depositPaid?: number;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  
  // Notes & attachments
  internalNotes?: string;
  customerNotes?: string;
  photos?: string[];
  documents?: string[];
  
  // Tracking
  source?: string;
  campaignId?: number;
  
  // Line items
  lineItems?: JobLineItem[];
  statusHistory?: JobStatusHistory[];
  
  createdAt: string;
  updatedAt: string;
}

export interface VehicleInfo {
  year?: string;
  make?: string;
  model?: string;
  color?: string;
  licensePlate?: string;
  vin?: string;
}

export interface JobStatusHistory {
  id: number;
  jobId: number;
  status: JobStatus;
  changedBy?: number;
  notes?: string;
  locationLat?: number;
  locationLng?: number;
  createdAt: string;
}

export interface JobLineItem {
  id: number;
  jobId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  itemType: 'service' | 'part' | 'labor' | 'fee' | 'discount';
}

// =====================================================
// STAFF MEMBERS
// =====================================================

export type StaffRole = 'technician' | 'driver' | 'stylist' | 'groomer' | 'agent' | 'provider' | 'staff';

export interface StaffMember {
  id: number;
  userId: number;
  name: string;
  email?: string;
  phone?: string;
  role: StaffRole;
  title?: string;
  photoUrl?: string;
  bio?: string;
  skills?: string[];
  certifications?: string[];
  serviceIds?: number[];
  availability?: StaffAvailability;
  color?: string;
  isActive: boolean;
}

export interface StaffAvailability {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

// =====================================================
// ESTIMATES & QUOTES
// =====================================================

export type EstimateStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'converted';

export interface Estimate {
  id: number;
  userId: number;
  contactId: number;
  contact?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
  };
  jobId?: number;
  estimateNumber: string;
  title?: string;
  description?: string;
  status: EstimateStatus;
  
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  discountAmount?: number;
  total: number;
  
  validUntil?: string;
  terms?: string;
  notes?: string;
  
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  signatureUrl?: string;
  
  lineItems?: EstimateLineItem[];
  
  createdAt: string;
  updatedAt: string;
}

export interface EstimateLineItem {
  id: number;
  estimateId: number;
  serviceId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  itemType: 'service' | 'part' | 'labor' | 'fee' | 'discount';
  sortOrder: number;
}

// =====================================================
// INTAKE FORMS
// =====================================================

export type IntakeFormType = 
  | 'lead_intake' 
  | 'service_request' 
  | 'consultation' 
  | 'patient_intake' 
  | 'buyer_intake' 
  | 'seller_intake' 
  | 'case_intake' 
  | 'booking_intake';

export interface IntakeFormTemplate {
  id: number;
  userId?: number;
  industryTypeId?: number;
  name: string;
  description?: string;
  formType: IntakeFormType;
  fields: IntakeFormField[];
  conditionalLogic?: ConditionalLogic[];
  settings?: IntakeFormSettings;
  isTemplate: boolean;
  isActive: boolean;
}

export interface IntakeFormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'date' | 'time' | 'file' | 'address' | 'signature';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  accept?: string;
  multiple?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface ConditionalLogic {
  fieldId: string;
  condition: 'equals' | 'not_equals' | 'contains' | 'not_empty';
  value: string;
  action: 'show' | 'hide' | 'require';
  targetFieldIds: string[];
}

export interface IntakeFormSettings {
  submitButtonText?: string;
  successMessage?: string;
  redirectUrl?: string;
  notifyEmail?: string;
  autoCreateLead?: boolean;
  autoAssignTo?: number;
  autoAddTags?: string[];
}

// =====================================================
// REFERRAL PROGRAM
// =====================================================

export interface ReferralProgram {
  id: number;
  userId: number;
  name: string;
  description?: string;
  referrerRewardType: 'fixed' | 'percentage' | 'credit' | 'gift';
  referrerRewardAmount: number;
  refereeRewardType: 'fixed' | 'percentage' | 'credit' | 'gift';
  refereeRewardAmount: number;
  terms?: string;
  isActive: boolean;
}

export type ReferralStatus = 'pending' | 'contacted' | 'converted' | 'rewarded' | 'expired' | 'invalid';

export interface Referral {
  id: number;
  userId: number;
  programId?: number;
  program?: ReferralProgram;
  referrerContactId: number;
  referrerContact?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  refereeContactId?: number;
  refereeName?: string;
  refereeEmail?: string;
  refereePhone?: string;
  status: ReferralStatus;
  referrerRewardStatus: 'pending' | 'approved' | 'paid';
  refereeRewardStatus: 'pending' | 'approved' | 'paid';
  conversionDate?: string;
  conversionValue?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// RECALL & FOLLOW-UP
// =====================================================

export interface RecallSchedule {
  id: number;
  userId: number;
  industryTypeId?: number;
  name: string;
  description?: string;
  serviceId?: number;
  recallType: 'time_based' | 'mileage_based' | 'usage_based' | 'custom';
  intervalDays?: number;
  intervalMonths?: number;
  customLogic?: Record<string, any>;
  messageTemplateEmail?: number;
  messageTemplateSms?: number;
  reminderDaysBefore?: number[];
  isActive: boolean;
}

export type ContactRecallStatus = 'upcoming' | 'due' | 'overdue' | 'completed' | 'cancelled' | 'snoozed';

export interface ContactRecall {
  id: number;
  userId: number;
  contactId: number;
  contact?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
  };
  recallScheduleId?: number;
  recallSchedule?: RecallSchedule;
  serviceId?: number;
  lastServiceDate?: string;
  nextRecallDate: string;
  status: ContactRecallStatus;
  reminderSentAt?: string;
  completedAt?: string;
  notes?: string;
}

// =====================================================
// SPEED-TO-LEAD SETTINGS
// =====================================================

export interface SpeedToLeadSettings {
  id: number;
  userId: number;
  isEnabled: boolean;
  
  // New lead response
  autoCallNewLeads: boolean;
  autoSmsNewLeads: boolean;
  newLeadSmsTemplateId?: number;
  newLeadDelaySeconds: number;
  
  // Missed call handling
  missedCallAutoSms: boolean;
  missedCallSmsTemplateId?: number;
  missedCallDelaySeconds: number;
  
  // Business hours
  respectBusinessHours: boolean;
  businessHours?: BusinessHours;
  afterHoursSmsTemplateId?: number;
  
  // Round robin
  roundRobinEnabled: boolean;
  assignedStaffIds?: number[];
}

// =====================================================
// PIPELINE TEMPLATES
// =====================================================

export interface PipelineStage {
  name: string;
  color: string;
  probability: number;
}

export interface IndustryPipelineTemplate {
  id: number;
  industryTypeId: number;
  name: string;
  stages: PipelineStage[];
  isDefault: boolean;
}

// =====================================================
// PLAYBOOK TEMPLATES
// =====================================================

export type PlaybookCategory = 
  | 'lead_nurture' 
  | 'appointment_reminder' 
  | 'review_request' 
  | 'recall' 
  | 'win_back' 
  | 'referral' 
  | 'onboarding' 
  | 'follow_up';

export type PlaybookType = 
  | 'automation' 
  | 'campaign' 
  | 'landing_page' 
  | 'form' 
  | 'email_sequence' 
  | 'sms_sequence';

export interface PlaybookTemplate {
  id: number;
  industryTypeId?: number;
  industryType?: IndustryType;
  name: string;
  description?: string;
  category: PlaybookCategory;
  templateType: PlaybookType;
  templateData: Record<string, any>;
  isFeatured: boolean;
  usageCount: number;
}

// =====================================================
// INDUSTRY-SPECIFIC CONSTANTS
// =====================================================

export const INDUSTRY_ICONS: Record<IndustrySlug, string> = {
  home_services: 'Wrench',
  healthcare: 'Stethoscope',
  real_estate: 'Home',
  legal: 'Scale',
  transportation: 'Car',
  beauty_wellness: 'Scissors',
};

export const INDUSTRY_COLORS: Record<IndustrySlug, string> = {
  home_services: '#3B82F6',
  healthcare: '#10B981',
  real_estate: '#8B5CF6',
  legal: '#6366F1',
  transportation: '#F59E0B',
  beauty_wellness: '#EC4899',
};

export const JOB_STATUS_CONFIG: Record<JobStatus, { label: string; color: string; icon: string }> = {
  new: { label: 'New', color: '#6B7280', icon: 'Plus' },
  scheduled: { label: 'Scheduled', color: '#3B82F6', icon: 'Calendar' },
  dispatched: { label: 'Dispatched', color: '#8B5CF6', icon: 'Send' },
  en_route: { label: 'En Route', color: '#F59E0B', icon: 'Navigation' },
  arrived: { label: 'Arrived', color: '#10B981', icon: 'MapPin' },
  in_progress: { label: 'In Progress', color: '#06B6D4', icon: 'Loader' },
  completed: { label: 'Completed', color: '#059669', icon: 'CheckCircle' },
  cancelled: { label: 'Cancelled', color: '#EF4444', icon: 'XCircle' },
  on_hold: { label: 'On Hold', color: '#F97316', icon: 'Pause' },
};

export const ESTIMATE_STATUS_CONFIG: Record<EstimateStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#6B7280' },
  sent: { label: 'Sent', color: '#3B82F6' },
  viewed: { label: 'Viewed', color: '#8B5CF6' },
  accepted: { label: 'Accepted', color: '#10B981' },
  declined: { label: 'Declined', color: '#EF4444' },
  expired: { label: 'Expired', color: '#F97316' },
  converted: { label: 'Converted', color: '#059669' },
};

export const RECALL_TEMPLATES: Record<IndustrySlug, { name: string; intervalMonths: number }[]> = {
  home_services: [
    { name: 'HVAC Tune-up', intervalMonths: 6 },
    { name: 'Plumbing Inspection', intervalMonths: 12 },
    { name: 'Electrical Safety Check', intervalMonths: 12 },
  ],
  healthcare: [
    { name: 'Dental Cleaning', intervalMonths: 6 },
    { name: 'Annual Checkup', intervalMonths: 12 },
    { name: 'Eye Exam', intervalMonths: 12 },
  ],
  real_estate: [
    { name: 'Home Value Update', intervalMonths: 6 },
    { name: 'Market Report', intervalMonths: 3 },
  ],
  legal: [
    { name: 'Annual Review', intervalMonths: 12 },
    { name: 'Estate Plan Review', intervalMonths: 24 },
  ],
  transportation: [
    { name: 'Vehicle Maintenance', intervalMonths: 3 },
    { name: 'Fleet Inspection', intervalMonths: 6 },
  ],
  beauty_wellness: [
    { name: 'Haircut', intervalMonths: 2 },
    { name: 'Color Touch-up', intervalMonths: 2 },
    { name: 'Pet Grooming', intervalMonths: 2 },
  ],
  local_business: [
    { name: 'General Service', intervalMonths: 6 },
    { name: 'Consultation', intervalMonths: 12 },
  ],
  professional_services: [
    { name: 'Annual Review', intervalMonths: 12 },
    { name: 'Quarterly Check-in', intervalMonths: 3 },
  ],
};

export const INDUSTRY_PIPELINE_STAGES: Record<IndustrySlug, PipelineStage[]> = {
  home_services: [
    { name: 'New Lead', color: '#6B7280', probability: 10 },
    { name: 'Estimate Requested', color: '#3B82F6', probability: 20 },
    { name: 'Estimate Sent', color: '#8B5CF6', probability: 40 },
    { name: 'Job Scheduled', color: '#F59E0B', probability: 70 },
    { name: 'Job Completed', color: '#10B981', probability: 90 },
    { name: 'Won', color: '#059669', probability: 100 },
    { name: 'Lost', color: '#EF4444', probability: 0 },
  ],
  local_business: [
    { name: 'New Inquiry', color: '#6B7280', probability: 10 },
    { name: 'Contacted', color: '#3B82F6', probability: 25 },
    { name: 'Proposal Sent', color: '#8B5CF6', probability: 50 },
    { name: 'Follow-up', color: '#F59E0B', probability: 65 },
    { name: 'Negotiation', color: '#10B981', probability: 80 },
    { name: 'Won', color: '#059669', probability: 100 },
    { name: 'Lost', color: '#EF4444', probability: 0 },
  ],
  professional_services: [
    { name: 'Initial Contact', color: '#6B7280', probability: 10 },
    { name: 'Consultation Scheduled', color: '#3B82F6', probability: 30 },
    { name: 'Proposal Submitted', color: '#8B5CF6', probability: 50 },
    { name: 'Under Review', color: '#F59E0B', probability: 70 },
    { name: 'Agreement Signed', color: '#10B981', probability: 95 },
    { name: 'Active Client', color: '#059669', probability: 100 },
    { name: 'Not Engaged', color: '#EF4444', probability: 0 },
  ],
  healthcare: [
    { name: 'New Patient Inquiry', color: '#6B7280', probability: 10 },
    { name: 'Intake Form Sent', color: '#3B82F6', probability: 25 },
    { name: 'Appointment Scheduled', color: '#8B5CF6', probability: 60 },
    { name: 'Appointment Completed', color: '#10B981', probability: 85 },
    { name: 'Active Patient', color: '#059669', probability: 100 },
    { name: 'Inactive', color: '#EF4444', probability: 0 },
  ],
  real_estate: [
    { name: 'New Lead', color: '#6B7280', probability: 10 },
    { name: 'Contacted', color: '#3B82F6', probability: 20 },
    { name: 'Showing Scheduled', color: '#8B5CF6', probability: 40 },
    { name: 'Offer Made', color: '#F59E0B', probability: 60 },
    { name: 'Under Contract', color: '#10B981', probability: 85 },
    { name: 'Closed', color: '#059669', probability: 100 },
    { name: 'Lost', color: '#EF4444', probability: 0 },
  ],
  legal: [
    { name: 'New Inquiry', color: '#6B7280', probability: 10 },
    { name: 'Consultation Scheduled', color: '#3B82F6', probability: 30 },
    { name: 'Consultation Completed', color: '#8B5CF6', probability: 50 },
    { name: 'Proposal Sent', color: '#F59E0B', probability: 65 },
    { name: 'Retained', color: '#10B981', probability: 90 },
    { name: 'Case Closed', color: '#059669', probability: 100 },
    { name: 'Not Retained', color: '#EF4444', probability: 0 },
  ],
  transportation: [
    { name: 'New Request', color: '#6B7280', probability: 15 },
    { name: 'Quote Sent', color: '#3B82F6', probability: 35 },
    { name: 'Booking Confirmed', color: '#8B5CF6', probability: 70 },
    { name: 'Service Completed', color: '#10B981', probability: 95 },
    { name: 'Paid', color: '#059669', probability: 100 },
    { name: 'Cancelled', color: '#EF4444', probability: 0 },
  ],
  beauty_wellness: [
    { name: 'New Client', color: '#6B7280', probability: 15 },
    { name: 'Consultation Booked', color: '#3B82F6', probability: 40 },
    { name: 'Appointment Scheduled', color: '#8B5CF6', probability: 70 },
    { name: 'Service Completed', color: '#10B981', probability: 90 },
    { name: 'Repeat Client', color: '#059669', probability: 100 },
    { name: 'Inactive', color: '#EF4444', probability: 0 },
  ],
};

export const INTAKE_FORM_TEMPLATES: Record<IndustrySlug, { name: string; fields: { label: string; type: string; required: boolean; options?: string[] }[] }[]> = {
  home_services: [
    {
      name: 'Service Request Form',
      fields: [
        { label: 'Service Type', type: 'select', required: true, options: ['HVAC', 'Plumbing', 'Electrical', 'Roofing', 'Other'] },
        { label: 'Problem Description', type: 'textarea', required: true },
        { label: 'Preferred Date', type: 'date', required: false },
        { label: 'Property Type', type: 'select', required: true, options: ['Residential', 'Commercial'] },
        { label: 'Address', type: 'text', required: true },
      ],
    },
  ],
  local_business: [
    {
      name: 'Service Inquiry Form',
      fields: [
        { label: 'Service Needed', type: 'select', required: true, options: ['Consultation', 'Quote', 'Service Call', 'Follow-up', 'Other'] },
        { label: 'Business Name', type: 'text', required: false },
        { label: 'Description', type: 'textarea', required: true },
        { label: 'Preferred Contact Method', type: 'select', required: true, options: ['Phone', 'Email', 'Text'] },
        { label: 'Timeline', type: 'select', required: false, options: ['ASAP', 'This Week', 'This Month', 'Flexible'] },
      ],
    },
  ],
  professional_services: [
    {
      name: 'Client Intake Form',
      fields: [
        { label: 'Service Type', type: 'select', required: true, options: ['Consulting', 'Advisory', 'Project-Based', 'Retainer', 'Other'] },
        { label: 'Company/Organization', type: 'text', required: true },
        { label: 'Project Description', type: 'textarea', required: true },
        { label: 'Budget Range', type: 'select', required: false, options: ['Under $5k', '$5k-$10k', '$10k-$25k', '$25k-$50k', '$50k+'] },
        { label: 'Start Date', type: 'date', required: false },
      ],
    },
  ],
  healthcare: [
    {
      name: 'New Patient Intake',
      fields: [
        { label: 'Date of Birth', type: 'date', required: true },
        { label: 'Insurance Provider', type: 'text', required: false },
        { label: 'Reason for Visit', type: 'textarea', required: true },
        { label: 'Current Medications', type: 'textarea', required: false },
        { label: 'Allergies', type: 'textarea', required: false },
      ],
    },
  ],
  real_estate: [
    {
      name: 'Buyer Inquiry',
      fields: [
        { label: 'Property Type', type: 'select', required: true, options: ['Single Family', 'Condo', 'Townhouse', 'Multi-Family'] },
        { label: 'Budget Range', type: 'select', required: true, options: ['Under $200k', '$200k-$400k', '$400k-$600k', '$600k+'] },
        { label: 'Preferred Areas', type: 'text', required: true },
        { label: 'Timeline', type: 'select', required: true, options: ['ASAP', '1-3 months', '3-6 months', '6+ months'] },
        { label: 'Pre-Approved?', type: 'radio', required: true, options: ['Yes', 'No', 'In Progress'] },
      ],
    },
  ],
  legal: [
    {
      name: 'Case Intake',
      fields: [
        { label: 'Case Type', type: 'select', required: true, options: ['Personal Injury', 'Family Law', 'Criminal Defense', 'Business', 'Estate Planning', 'Other'] },
        { label: 'Brief Description', type: 'textarea', required: true },
        { label: 'Urgency', type: 'select', required: true, options: ['Immediate', 'Within a week', 'Within a month', 'No rush'] },
        { label: 'Previous Attorney?', type: 'radio', required: true, options: ['Yes', 'No'] },
      ],
    },
  ],
  transportation: [
    {
      name: 'Service Request',
      fields: [
        { label: 'Service Type', type: 'select', required: true, options: ['Towing', 'Limo/Car Service', 'Moving', 'Delivery'] },
        { label: 'Pickup Location', type: 'text', required: true },
        { label: 'Destination', type: 'text', required: true },
        { label: 'Date/Time Needed', type: 'date', required: true },
        { label: 'Vehicle Type (if towing)', type: 'text', required: false },
      ],
    },
  ],
  beauty_wellness: [
    {
      name: 'New Client Form',
      fields: [
        { label: 'Service Interest', type: 'select', required: true, options: ['Haircut', 'Color', 'Styling', 'Spa', 'Nails', 'Pet Grooming'] },
        { label: 'Preferred Stylist/Tech', type: 'text', required: false },
        { label: 'Allergies or Sensitivities', type: 'textarea', required: false },
        { label: 'How did you hear about us?', type: 'select', required: false, options: ['Google', 'Referral', 'Social Media', 'Walk-in', 'Other'] },
      ],
    },
  ],
};
