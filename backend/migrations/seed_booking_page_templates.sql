-- Seed booking page templates for local businesses and home services
-- This provides quick-start templates for common local business scenarios

-- Note: These are example configurations. Actual workspace_id should be updated during seeding.
-- The slug will need to be unique per workspace.

-- Home Services - HVAC Company Template
INSERT INTO booking_pages (workspace_id, slug, title, description, source, native_config, branding, payment_config, is_active, created_at, updated_at)
SELECT 
  1, -- Replace with actual workspace_id
  'hvac-service-booking',
  'Schedule HVAC Service',
  'Book your heating, cooling, or HVAC maintenance appointment online. Fast, easy, and convenient.',
  'native',
  JSON_OBJECT(
    'service_ids', JSON_ARRAY(),
    'staff_mode', 'round_robin',
    'duration_override', 60,
    'buffer_before', 15,
    'buffer_after', 15,
    'min_notice_hours', 24,
    'max_advance_days', 90
  ),
  JSON_OBJECT(
    'logo_url', '',
    'primary_color', '#EF4444',
    'hero_text', 'Keep your home comfortable year-round',
    'success_message', 'Your appointment has been scheduled! We\'ll send you a confirmation email shortly.',
    'redirect_url', ''
  ),
  JSON_OBJECT(
    'requires_payment', false
  ),
  1,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM booking_pages WHERE slug = 'hvac-service-booking' AND workspace_id = 1);

-- Home Services - Plumbing Company Template
INSERT INTO booking_pages (workspace_id, slug, title, description, source, native_config, branding, payment_config, is_active, created_at, updated_at)
SELECT 
  1,
  'plumbing-service-request',
  'Request Plumbing Service',
  'Get expert plumbing service for repairs, installations, and emergencies.',
  'native',
  JSON_OBJECT(
    'service_ids', JSON_ARRAY(),
    'staff_mode', 'round_robin',
    'duration_override', 90,
    'buffer_before', 15,
    'buffer_after', 30,
    'min_notice_hours', 4,
    'max_advance_days', 60
  ),
  JSON_OBJECT(
    'logo_url', '',
    'primary_color', '#3B82F6',
    'hero_text', 'Professional plumbing service you can trust',
    'success_message', 'Thank you! A plumber will contact you shortly to confirm your appointment.',
    'redirect_url', ''
  ),
  JSON_OBJECT(
    'requires_payment', false
  ),
  1,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM booking_pages WHERE slug = 'plumbing-service-request' AND workspace_id = 1);

-- Home Services - Lawn Care / Landscaping
INSERT INTO booking_pages (workspace_id, slug, title, description, source, native_config, branding, payment_config, is_active, created_at, updated_at)
SELECT 
  1,
  'lawn-care-estimate',
  'Get a Free Lawn Care Estimate',
  'Schedule a free on-site estimate for lawn mowing, landscaping, and yard maintenance.',
  'native',
  JSON_OBJECT(
    'service_ids', JSON_ARRAY(),
    'staff_mode', 'per_staff',
    'duration_override', 30,
    'buffer_before', 0,
    'buffer_after', 15,
    'min_notice_hours', 48,
    'max_advance_days', 30
  ),
  JSON_OBJECT(
    'logo_url', '',
    'primary_color', '#10B981',
    'hero_text', 'Beautiful lawns, hassle-free maintenance',
    'success_message', 'Your estimate is scheduled! We\'ll visit your property and provide a detailed quote.',
    'redirect_url', ''
  ),
  JSON_OBJECT(
    'requires_payment', false
  ),
  1,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM booking_pages WHERE slug = 'lawn-care-estimate' AND workspace_id = 1);

-- Local Business - General Consultation
INSERT INTO booking_pages (workspace_id, slug, title, description, source, native_config, branding, payment_config, is_active, created_at, updated_at)
SELECT 
  1,
  'free-consultation',
  'Book a Free Consultation',
  'Schedule a complimentary consultation to discuss your needs and how we can help.',
  'native',
  JSON_OBJECT(
    'service_ids', JSON_ARRAY(),
    'staff_mode', 'per_staff',
    'duration_override', 45,
    'buffer_before', 10,
    'buffer_after', 10,
    'min_notice_hours', 24,
    'max_advance_days', 60
  ),
  JSON_OBJECT(
    'logo_url', '',
    'primary_color', '#8B5CF6',
    'hero_text', 'Let\'s discuss how we can help you succeed',
    'success_message', 'Your consultation is booked! We look forward to speaking with you.',
    'redirect_url', ''
  ),
  JSON_OBJECT(
    'requires_payment', false
  ),
  1,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM booking_pages WHERE slug = 'free-consultation' AND workspace_id = 1);

-- Local Business - Paid Service Appointment
INSERT INTO booking_pages (workspace_id, slug, title, description, source, native_config, branding, payment_config, is_active, created_at, updated_at)
SELECT 
  1,
  'book-paid-service',
  'Book Service Appointment',
  'Reserve your service appointment online. Payment required at booking to secure your time slot.',
  'native',
  JSON_OBJECT(
    'service_ids', JSON_ARRAY(),
    'staff_mode', 'round_robin',
    'duration_override', 60,
    'buffer_before', 15,
    'buffer_after', 15,
    'min_notice_hours', 48,
    'max_advance_days', 90
  ),
  JSON_OBJECT(
    'logo_url', '',
    'primary_color', '#F59E0B',
    'hero_text', 'Secure your appointment with instant booking',
    'success_message', 'Payment received and appointment confirmed! Check your email for details.',
    'redirect_url', ''
  ),
  JSON_OBJECT(
    'requires_payment', true,
    'provider', 'stripe',
    'amount_type', 'service_price',
    'terms', 'Payment is required to secure your booking. Cancellations must be made 24 hours in advance for a full refund.'
  ),
  1,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM booking_pages WHERE slug = 'book-paid-service' AND workspace_id = 1);

-- Home Services - Cleaning Services
INSERT INTO booking_pages (workspace_id, slug, title, description, source, native_config, branding, payment_config, is_active, created_at, updated_at)
SELECT 
  1,
  'cleaning-service-booking',
  'Book Cleaning Service',
  'Schedule your home or office cleaning online. Choose your preferred date and time.',
  'native',
  JSON_OBJECT(
    'service_ids', JSON_ARRAY(),
    'staff_mode', 'round_robin',
    'duration_override', 120,
    'buffer_before', 30,
    'buffer_after', 30,
    'min_notice_hours', 24,
    'max_advance_days', 60
  ),
  JSON_OBJECT(
    'logo_url', '',
    'primary_color', '#06B6D4',
    'hero_text', 'Sparkling clean spaces, booked in minutes',
    'success_message', 'Your cleaning is scheduled! We\'ll arrive on time and leave your space spotless.',
    'redirect_url', ''
  ),
  JSON_OBJECT(
    'requires_payment', false
  ),
  1,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM booking_pages WHERE slug = 'cleaning-service-booking' AND workspace_id = 1);
