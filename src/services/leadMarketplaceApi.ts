import { api as baseApi } from '@/lib/api';

const api = baseApi as {
  get: <T>(url: string, config?: any) => Promise<T>;
  post: <T>(url: string, data?: any, config?: any) => Promise<T>;
  put: <T>(url: string, data?: any, config?: any) => Promise<T>;
  delete: <T>(url: string, config?: any) => Promise<T>;
};

// Types
export interface ServiceCategory {
  id: number;
  workspace_id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  attributes?: Record<string, any>;
  sort_order: number;
  is_active: boolean;
  subcategories?: ServiceCategory[];
  created_at: string;
  updated_at: string;
}

export interface ServicePro {
  id: number;
  workspace_id: number;
  company_id: number;
  user_id?: number;
  business_name?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  bio?: string;
  logo_url?: string;
  website_url?: string;
  years_in_business?: number;
  license_number?: string;
  insurance_verified: boolean;
  background_checked: boolean;
  avg_rating: number;
  total_reviews: number;
  total_leads_received: number;
  total_leads_accepted: number;
  total_leads_won: number;
  response_time_avg_minutes?: number;
  status: 'pending' | 'active' | 'paused' | 'suspended';
  offerings?: ServiceOffering[];
  service_areas?: ServiceArea[];
  preferences?: ProPreferences;
  wallet?: Wallet;
  created_at: string;
}

export interface ServiceOffering {
  id: number;
  service_id: number;
  service_name?: string;
  min_price?: number;
  max_price?: number;
  price_type: 'fixed' | 'hourly' | 'estimate' | 'free';
  experience_years?: number;
  is_active: boolean;
}

export interface ServiceArea {
  id: number;
  area_type: 'radius' | 'postal' | 'city' | 'region' | 'polygon';
  city?: string;
  region?: string;
  country: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  radius_km: number;
  is_primary: boolean;
}

export interface ProPreferences {
  id: number;
  min_budget: number;
  max_budget?: number;
  max_radius_km: number;
  max_leads_per_day: number;
  max_leads_per_week: number;
  notify_email: boolean;
  notify_sms: boolean;
  notify_push: boolean;
  auto_recharge_enabled: boolean;
  auto_recharge_threshold: number;
  auto_recharge_amount: number;
  pause_when_balance_zero: boolean;
}

export interface LeadRequest {
  id: number;
  workspace_id: number;
  source: 'form' | 'api' | 'import' | 'referral';
  consumer_name?: string;
  consumer_email?: string;
  consumer_phone?: string;
  city?: string;
  region?: string;
  country: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  budget_min?: number;
  budget_max?: number;
  timing: 'asap' | 'within_24h' | 'within_week' | 'flexible' | 'scheduled';
  title?: string;
  description?: string;
  property_type?: 'residential' | 'commercial' | 'industrial' | 'other';
  media?: any[];
  answers?: Record<string, any>;
  status: 'new' | 'routing' | 'routed' | 'partial' | 'closed' | 'expired' | 'spam' | 'duplicate';
  quality_score?: number;
  is_exclusive: boolean;
  max_sold_count: number;
  current_sold_count: number;
  lead_price_base?: number;
  lead_price_final?: number;
  expires_at?: string;
  services?: { service_id: number; service_name?: string; quantity: number }[];
  matches?: LeadMatch[];
  service_names?: string;
  created_at: string;
}

export interface LeadMatch {
  id: number;
  workspace_id: number;
  lead_request_id: number;
  company_id: number;
  pro_id?: number;
  business_name?: string;
  avg_rating?: number;
  distance_km?: number;
  lead_price: number;
  status: 'offered' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'won' | 'lost' | 'disputed' | 'refunded';
  offered_at: string;
  viewed_at?: string;
  accepted_at?: string;
  declined_at?: string;
  declined_reason?: string;
  won_at?: string;
  won_value?: number;
  lost_at?: string;
  lost_reason?: string;
  expires_at?: string;
  response_time_minutes?: number;
  quotes?: LeadQuote[];
  services?: { service_id: number; service_name?: string; quantity: number }[];
  consumer_name?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  timing?: string;
  budget_min?: number;
  budget_max?: number;
  title?: string;
  description?: string;
  quality_score?: number;
  service_names?: string;
  created_at: string;
}

export interface LeadQuote {
  id: number;
  lead_match_id: number;
  quote_type: 'message' | 'quote' | 'question' | 'update';
  message?: string;
  price_min?: number;
  price_max?: number;
  eta?: string;
  is_from_consumer: boolean;
  read_at?: string;
  created_at: string;
}

export interface Wallet {
  id: number;
  workspace_id: number;
  company_id: number;
  balance: number;
  lifetime_purchased: number;
  lifetime_spent: number;
  lifetime_refunded: number;
  last_purchase_at?: string;
  last_charge_at?: string;
  currency: string;
}

export interface CreditTransaction {
  id: number;
  wallet_id: number;
  lead_match_id?: number;
  lead_request_id?: number;
  lead_title?: string;
  type: 'purchase' | 'charge' | 'refund' | 'adjustment' | 'bonus' | 'promo';
  amount: number;
  balance_before: number;
  balance_after: number;
  description?: string;
  payment_provider?: 'stripe' | 'paypal' | 'manual';
  payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
  promo_code?: string;
  created_at: string;
}

export interface CreditPackage {
  id: number;
  name: string;
  description?: string;
  credits_amount: number;
  price: number;
  bonus_credits: number;
  discount_percent: number;
  is_popular: boolean;
  is_active: boolean;
}

export interface PricingRule {
  id: number;
  workspace_id: number;
  name?: string;
  service_id?: number;
  service_name?: string;
  region?: string;
  postal_code?: string;
  city?: string;
  timing?: string;
  budget_min?: number;
  budget_max?: number;
  property_type?: string;
  is_exclusive?: boolean;
  base_price: number;
  surge_multiplier: number;
  exclusive_multiplier: number;
  priority: number;
  is_active: boolean;
  created_at: string;
}

export interface PromoCode {
  id: number;
  code: string;
  description?: string;
  discount_type: 'percent' | 'fixed' | 'credits';
  discount_value: number;
  min_purchase?: number;
  max_uses?: number;
  max_uses_per_user: number;
  current_uses: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
}

export interface LeadStats {
  leads_by_status: { status: string; cnt: number }[];
  matches_by_status: { status: string; cnt: number }[];
  total_revenue: number;
  acceptance_rate: number;
}

// ==================== REVIEWS ====================
export interface MarketplaceReview {
  id: number;
  workspace_id: number;
  company_id: number;
  lead_request_id?: number;
  lead_match_id?: number;
  reviewer_name?: string;
  reviewer_email?: string;
  rating: number;
  title?: string;
  comment?: string;
  pros?: string;
  cons?: string;
  is_verified: boolean;
  is_featured: boolean;
  is_public: boolean;
  response?: string;
  response_at?: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  provider_name?: string;
  provider_logo?: string;
  lead_title?: string;
  created_at: string;
}

export interface ReviewStats {
  total_reviews: number;
  avg_rating: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
}

// ==================== PROVIDER DOCUMENTS ====================
export interface ProviderDocument {
  id: number;
  workspace_id: number;
  company_id: number;
  document_type: 'license' | 'insurance' | 'certification' | 'portfolio' | 'background_check' | 'identity' | 'other';
  name: string;
  description?: string;
  file_url: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  expires_at?: string;
  review_notes?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  uploaded_by?: number;
  created_at: string;
}

export interface VerificationStatus {
  provider_status: string;
  verified_at?: string;
  insurance_verified: boolean;
  background_checked: boolean;
  has_license: boolean;
  documents: Record<string, { pending: number; approved: number; rejected: number }>;
  verification_progress: number;
  required_documents: string[];
  missing_documents: string[];
}

// ==================== MESSAGING ====================
export interface MessageThread {
  match_id: number;
  match_status: string;
  consumer_name?: string;
  lead_title?: string;
  consumer_phone?: string;
  consumer_email?: string;
  provider_name?: string;
  provider_logo?: string;
  provider_rating?: number;
  message_count: number;
  unread_count: number;
  last_message_at?: string;
}

export interface MarketplaceMessage {
  id: number;
  workspace_id: number;
  lead_match_id: number;
  lead_request_id: number;
  sender_type: 'consumer' | 'provider' | 'system';
  sender_id?: number;
  message: string;
  attachments?: any[];
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

// ==================== BOOKING ====================
export interface BookingType {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  description?: string;
  duration_minutes: number;
  buffer_before: number;
  buffer_after: number;
  color: string;
  location_type: 'in_person' | 'phone' | 'video' | 'custom';
  location_details?: string;
  price?: number;
  currency: string;
  requires_payment: boolean;
  min_notice_hours: number;
  max_future_days: number;
  is_active: boolean;
}

export interface TimeSlot {
  start: string;
  end: string;
  start_time: string;
  end_time: string;
}

export interface Appointment {
  id: number;
  user_id: number;
  booking_type_id?: number;
  lead_match_id?: number;
  lead_request_id?: number;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  title?: string;
  notes?: string;
  start_time: string;
  end_time: string;
  location_type?: string;
  status: string;
  booking_type_name?: string;
  duration_minutes?: number;
}

// API Functions
export const getServices = (params?: { parent_id?: number | null; include_inactive?: boolean }) =>
  api.get<{ success: boolean; data: ServiceCategory[] }>('/lead-marketplace/services', { params });

export const getService = (id: number) =>
  api.get<{ success: boolean; data: ServiceCategory }>(`/lead-marketplace/services/${id}`);

export const createService = (data: Partial<ServiceCategory>) =>
  api.post<{ success: boolean; data: { id: number } }>('/lead-marketplace/services', data);

export const updateService = (id: number, data: Partial<ServiceCategory>) =>
  api.put<{ success: boolean }>(`/lead-marketplace/services/${id}`, data);

export const deleteService = (id: number) =>
  api.delete<{ success: boolean }>(`/lead-marketplace/services/${id}`);

export const getPros = (params?: { status?: string; service_id?: number }) =>
  api.get<{ success: boolean; data: ServicePro[] }>('/lead-marketplace/pros', { params });

export const getPro = (id: number) =>
  api.get<{ success: boolean; data: ServicePro }>(`/lead-marketplace/pros/${id}`);

export const getMyProProfile = () =>
  api.get<{ success: boolean; data: ServicePro | null; registered: boolean }>('/lead-marketplace/pros/me');

export const registerPro = (data: {
  business_name?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  bio?: string;
  service_ids?: number[];
  service_areas?: Partial<ServiceArea>[];
}) => api.post<{ success: boolean; data: { id: number } }>('/lead-marketplace/pros/register', data);

export const updatePro = (id: number, data: Partial<ServicePro>) =>
  api.put<{ success: boolean }>(`/lead-marketplace/pros/${id}`, data);

export const updatePreferences = (data: Partial<ProPreferences>) =>
  api.put<{ success: boolean }>('/lead-marketplace/preferences', data);

export const updateServiceOfferings = (service_ids: number[]) =>
  api.put<{ success: boolean }>('/lead-marketplace/offerings', { service_ids });

export const updateServiceAreas = (areas: Partial<ServiceArea>[]) =>
  api.put<{ success: boolean }>('/lead-marketplace/service-areas', { areas });

export const getLeadRequests = (params?: { status?: string; limit?: number; offset?: number }) =>
  api.get<{ success: boolean; data: LeadRequest[] }>('/lead-marketplace/leads', { params });

export const getLeadRequest = (id: number) =>
  api.get<{ success: boolean; data: LeadRequest }>(`/lead-marketplace/leads/${id}`);

export const createLeadRequest = (data: {
  source?: 'form' | 'api' | 'import' | 'referral';
  source_form_id?: number;
  consumer_name?: string;
  consumer_email?: string;
  consumer_phone?: string;
  city?: string;
  region?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  budget_min?: number;
  budget_max?: number;
  timing?: string;
  title?: string;
  description?: string;
  property_type?: string;
  media?: any[];
  answers?: Record<string, any>;
  services: { service_id: number; quantity?: number }[];
  is_exclusive?: boolean;
  max_sold_count?: number;
  consent_contact?: boolean;
}) => api.post<{ success: boolean; data: { id: number; lead_price: number } }>('/lead-marketplace/leads', data);

export const routeLeadRequest = (id: number) =>
  api.post<{ success: boolean; data: { matches_created: number; status: string } }>(`/lead-marketplace/leads/${id}/route`);

export const refundLead = (leadId: number, data: { lead_match_id: number; amount?: number; reason?: string }) =>
  api.post<{ success: boolean; data: { balance_after: number } }>(`/lead-marketplace/leads/${leadId}/refund`, data);

export const getLeadStats = () =>
  api.get<{ success: boolean; data: LeadStats }>('/lead-marketplace/leads/stats');

export const getLeadMatches = (params?: { status?: string; limit?: number }) =>
  api.get<{ success: boolean; data: LeadMatch[] }>('/lead-marketplace/matches', { params });

export const getLeadMatchesFiltered = (params?: { status?: string; limit?: number; service_id?: number; min_quality?: number; max_price?: number; max_distance_km?: number }) =>
  api.get<{ success: boolean; data: LeadMatch[] }>('/lead-marketplace/matches', { params });

export const exportLeadMatchesCsv = async (params?: { status?: string; limit?: number; service_id?: number; min_quality?: number; max_price?: number; max_distance_km?: number }): Promise<Blob> => {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    search.set(k, String(v));
  });

  const token = localStorage.getItem('auth_token');
  const activeCompanyId = localStorage.getItem('active_client_id');

  const res = await fetch(`/api/lead-marketplace/matches/export${search.toString() ? `?${search.toString()}` : ''}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(activeCompanyId ? { 'X-Company-Id': activeCompanyId } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Export failed: ${res.status}`);
  }

  return res.blob();
};

export const getProviderMatchStats = () =>
  api.get<{ success: boolean; data: { matches_by_status: { status: string; cnt: number }[]; total_matches: number; accepted_count: number; won_count: number; acceptance_rate: number; win_rate: number; avg_response_time_minutes: number | null } }>('/lead-marketplace/matches/stats');

export const getLeadMatch = (id: number) =>
  api.get<{ success: boolean; data: LeadMatch }>(`/lead-marketplace/matches/${id}`);

export const acceptLeadMatch = (id: number) =>
  api.post<{ success: boolean; data: { balance_after: number } }>(`/lead-marketplace/matches/${id}/accept`);

export const declineLeadMatch = (id: number, reason?: string) =>
  api.post<{ success: boolean }>(`/lead-marketplace/matches/${id}/decline`, { reason });

export const sendQuote = (matchId: number, data: { quote_type?: string; message?: string; price_min?: number; price_max?: number; eta?: string }) =>
  api.post<{ success: boolean; data: { id: number } }>(`/lead-marketplace/matches/${matchId}/quote`, data);

export const markOutcome = (matchId: number, data: { outcome: 'won' | 'lost'; value?: number; reason?: string }) =>
  api.post<{ success: boolean }>(`/lead-marketplace/matches/${matchId}/outcome`, data);

export const getWallet = () =>
  api.get<{ success: boolean; data: Wallet }>('/lead-marketplace/wallet');

export const getTransactions = (params?: { type?: string; limit?: number; offset?: number }) =>
  api.get<{ success: boolean; data: CreditTransaction[] }>('/lead-marketplace/wallet/transactions', { params });

export const getCreditPackages = () =>
  api.get<{ success: boolean; data: CreditPackage[] }>('/lead-marketplace/wallet/packages');

export const createCheckout = (data: { provider: 'stripe' | 'paypal'; package_id?: number; amount?: number; promo_code?: string }) =>
  api.post<{ success: boolean; data: { checkout_url: string; credits: number; price: number } }>('/lead-marketplace/wallet/checkout', data);

export const addManualCredits = (data: { company_id: number; amount: number; type?: string; description?: string }) =>
  api.post<{ success: boolean; data: { balance_after: number } }>('/lead-marketplace/wallet/add-credits', data);

export const getPricingRules = () =>
  api.get<{ success: boolean; data: PricingRule[] }>('/lead-marketplace/pricing-rules');

export const createPricingRule = (data: Partial<PricingRule>) =>
  api.post<{ success: boolean; data: { id: number } }>('/lead-marketplace/pricing-rules', data);

export const updatePricingRule = (id: number, data: Partial<PricingRule>) =>
  api.put<{ success: boolean }>(`/lead-marketplace/pricing-rules/${id}`, data);

export const deletePricingRule = (id: number) =>
  api.delete<{ success: boolean }>(`/lead-marketplace/pricing-rules/${id}`);

export const getPromoCodes = () =>
  api.get<{ success: boolean; data: PromoCode[] }>('/lead-marketplace/promo-codes');

export const createPromoCode = (data: Partial<PromoCode>) =>
  api.post<{ success: boolean; data: { id: number } }>('/lead-marketplace/promo-codes', data);

export const validatePromoCode = (code: string) =>
  api.get<{ success: boolean; data: { valid: boolean; discount_type?: string; discount_value?: number; min_purchase?: number } }>('/lead-marketplace/promo-codes/validate', { params: { code } });

// ==================== REVIEWS API ====================
export const getReviews = (params?: { company_id?: number; status?: string; min_rating?: number; limit?: number; offset?: number }) =>
  api.get<{ success: boolean; data: MarketplaceReview[] }>('/lead-marketplace/reviews', { params });

export const getReview = (id: number) =>
  api.get<{ success: boolean; data: MarketplaceReview }>(`/lead-marketplace/reviews/${id}`);

export const createReview = (data: { lead_match_id: number; rating: number; title?: string; comment?: string; pros?: string; cons?: string; reviewer_name?: string; reviewer_email?: string }) =>
  api.post<{ success: boolean; data: { id: number; status: string }; message: string }>('/lead-marketplace/reviews', data);

export const respondToReview = (id: number, response: string) =>
  api.post<{ success: boolean }>(`/lead-marketplace/reviews/${id}/respond`, { response });

export const getMyReviews = (params?: { status?: string; limit?: number; offset?: number }) =>
  api.get<{ success: boolean; data: MarketplaceReview[]; stats: any }>('/lead-marketplace/my-reviews', { params });

export const getProviderReviews = (proId: number, params?: { limit?: number; offset?: number }) =>
  api.get<{ success: boolean; data: MarketplaceReview[]; stats: ReviewStats }>(`/lead-marketplace/providers/${proId}/reviews`, { params });

export const getPendingReviewsForConsumer = (email: string) =>
  api.get<{ success: boolean; data: any[] }>('/lead-marketplace/reviews/pending-for-consumer', { params: { email } });

// ==================== TEMPLATES API ====================
export interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  category: 'automation' | 'funnel' | 'form' | 'email' | 'website' | 'chatbot' | 'workflow';
  type: 'official' | 'community' | 'premium';
  author: string;
  authorAvatar?: string;
  price: number;
  rating: number;
  downloads: number;
  likes: number;
  preview_url?: string;
  tags: string[];
  features: string[];
  created_at: string;
  updated_at: string;
  isPurchased?: boolean;
}

export const getTemplates = (params?: { category?: string; type?: string; search?: string }) =>
  api.get<{ success: boolean; data: MarketplaceTemplate[] }>('/lead-marketplace/templates', { params });

export const installTemplate = (id: string) =>
  api.post<{ success: boolean }>('/lead-marketplace/templates/' + id + '/install');

export const likeTemplate = (id: string) =>
  api.post<{ success: boolean }>('/lead-marketplace/templates/' + id + '/like');

export const uploadTemplate = (data: Partial<MarketplaceTemplate>) =>
  api.post<{ success: boolean; data: MarketplaceTemplate }>('/lead-marketplace/templates', data);



// Admin Reviews
export const adminGetReviews = (params?: { status?: string; limit?: number; offset?: number }) =>
  api.get<{ success: boolean; data: MarketplaceReview[]; counts: Record<string, number> }>('/lead-marketplace/admin/reviews', { params });

export const adminUpdateReview = (id: number, data: { status?: string; is_featured?: boolean; is_public?: boolean }) =>
  api.put<{ success: boolean }>(`/lead-marketplace/admin/reviews/${id}`, data);

export const adminDeleteReview = (id: number) =>
  api.delete<{ success: boolean }>(`/lead-marketplace/admin/reviews/${id}`);

// ==================== DOCUMENTS API ====================
export const getMyDocuments = (params?: { type?: string; status?: string }) =>
  api.get<{ success: boolean; data: ProviderDocument[]; summary: any[] }>('/lead-marketplace/documents', { params });

export const uploadDocument = (formData: FormData) =>
  api.post<{ success: boolean; data: { id: number; document_type: string; file_url: string; status: string }; message: string }>('/lead-marketplace/documents', formData);

export const deleteDocument = (id: number) =>
  api.delete<{ success: boolean }>(`/lead-marketplace/documents/${id}`);

export const getVerificationStatus = () =>
  api.get<{ success: boolean; data: VerificationStatus }>('/lead-marketplace/verification-status');

// Admin Documents
export const adminGetDocuments = (params?: { status?: string; type?: string; company_id?: number; limit?: number }) =>
  api.get<{ success: boolean; data: ProviderDocument[]; counts: Record<string, number> }>('/lead-marketplace/admin/documents', { params });

export const adminUpdateDocument = (id: number, data: { status: string; review_notes?: string }) =>
  api.put<{ success: boolean }>(`/lead-marketplace/admin/documents/${id}`, data);

export const adminGetPendingProviders = () =>
  api.get<{ success: boolean; data: any[] }>('/lead-marketplace/admin/providers/pending');

export const adminApproveProvider = (proId: number, data: { status: 'active' | 'suspended' | 'rejected'; notes?: string }) =>
  api.put<{ success: boolean }>(`/lead-marketplace/admin/providers/${proId}/approve`, data);

// ==================== MESSAGING API ====================
export const getMessageThreads = () =>
  api.get<{ success: boolean; data: MessageThread[]; unread_total: number }>('/lead-marketplace/messages');

export const getMessages = (matchId: number, params?: { limit?: number; before?: number }) =>
  api.get<{ success: boolean; data: MarketplaceMessage[]; match: any }>(`/lead-marketplace/messages/${matchId}`, { params });

export const sendMessage = (matchId: number, message: string, attachments?: any[]) =>
  api.post<{ success: boolean; data: MarketplaceMessage }>(`/lead-marketplace/messages/${matchId}`, { message, attachments });

export const markMessagesRead = (messageId: number) =>
  api.put<{ success: boolean }>(`/lead-marketplace/messages/${messageId}/read`);

export const getMessagePreferences = () =>
  api.get<{ success: boolean; data: any }>('/lead-marketplace/message-preferences');

export const updateMessagePreferences = (data: { notify_email?: boolean; notify_sms?: boolean; notify_push?: boolean; quiet_hours_start?: string; quiet_hours_end?: string }) =>
  api.put<{ success: boolean }>('/lead-marketplace/message-preferences', data);

// Consumer Messaging (Public)
export const consumerGetMessageThreads = (email: string) =>
  api.get<{ success: boolean; data: MessageThread[] }>('/lead-marketplace/consumer/messages', { params: { email } });

export const consumerSendMessage = (matchId: number, message: string, email: string) =>
  api.post<{ success: boolean; data: { id: number } }>(`/lead-marketplace/consumer/messages/${matchId}`, { message, email });

// ==================== BOOKING API ====================
export const getBookingTypes = () =>
  api.get<{ success: boolean; data: BookingType[] }>('/lead-marketplace/booking/types');

export const createBookingType = (data: Partial<BookingType>) =>
  api.post<{ success: boolean; data: { id: number; slug: string } }>('/lead-marketplace/booking/types', data);

export const getAvailability = () =>
  api.get<{ success: boolean; data: any }>('/lead-marketplace/booking/availability');

export const updateAvailability = (data: { timezone: string; slots: { day_of_week: number; start_time: string; end_time: string; is_available?: boolean }[] }) =>
  api.put<{ success: boolean }>('/lead-marketplace/booking/availability', data);

export const getAvailableSlots = (matchId: number, date: string, bookingTypeId?: number) =>
  api.get<{ success: boolean; data: TimeSlot[]; booking_types: BookingType[]; selected_type?: BookingType }>(`/lead-marketplace/booking/${matchId}/slots`, { params: { date, booking_type_id: bookingTypeId } });

export const createBooking = (matchId: number, data: { start_time: string; booking_type_id?: number; notes?: string; email?: string }) =>
  api.post<{ success: boolean; data: Appointment; message: string }>(`/lead-marketplace/booking/${matchId}`, data);

export const getMatchAppointment = (matchId: number) =>
  api.get<{ success: boolean; data: Appointment | null }>(`/lead-marketplace/booking/${matchId}/appointment`);

export const completeAppointment = (matchId: number, data: { outcome: 'completed' | 'no_show' | 'cancelled'; mark_won?: boolean; won_value?: number }) =>
  api.post<{ success: boolean }>(`/lead-marketplace/booking/${matchId}/complete`, data);

export const getUpcomingAppointments = (params?: { limit?: number; date_from?: string }) =>
  api.get<{ success: boolean; data: Appointment[] }>('/lead-marketplace/booking/upcoming', { params });

export const cancelAppointment = (id: number, reason?: string) =>
  api.post<{ success: boolean }>(`/lead-marketplace/booking/${id}/cancel`, { reason });

export default {
  getServices, getService, createService, updateService, deleteService,
  getPros, getPro, getMyProProfile, registerPro, updatePro, updatePreferences, updateServiceOfferings, updateServiceAreas,
  getLeadRequests, getLeadRequest, createLeadRequest, routeLeadRequest, refundLead, getLeadStats,
  getLeadMatches, getLeadMatchesFiltered, exportLeadMatchesCsv, getProviderMatchStats, getLeadMatch, acceptLeadMatch, declineLeadMatch, sendQuote, markOutcome,
  getWallet, getTransactions, getCreditPackages, createCheckout, addManualCredits,
  getPricingRules, createPricingRule, updatePricingRule, deletePricingRule,
  getPromoCodes, createPromoCode, validatePromoCode,
  // Reviews
  getReviews, getReview, createReview, respondToReview, getMyReviews, getProviderReviews, getPendingReviewsForConsumer,
  adminGetReviews, adminUpdateReview, adminDeleteReview,
  // Documents
  getMyDocuments, uploadDocument, deleteDocument, getVerificationStatus,
  adminGetDocuments, adminUpdateDocument, adminGetPendingProviders, adminApproveProvider,
  // Messaging
  getMessageThreads, getMessages, sendMessage, markMessagesRead, getMessagePreferences, updateMessagePreferences,
  consumerGetMessageThreads, consumerSendMessage,
  // Booking
  getBookingTypes, createBookingType, getAvailability, updateAvailability, getAvailableSlots, createBooking, getMatchAppointment, completeAppointment,
  getUpcomingAppointments, cancelAppointment,
  // Templates
  getTemplates, installTemplate, likeTemplate, uploadTemplate
};
