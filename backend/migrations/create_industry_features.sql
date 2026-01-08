-- Industry Features Migration
-- Supports: Home Services, Dentists/Healthcare, Realtors, Lawyers, Limo/Towing, Salons/Groomers

-- =====================================================
-- INDUSTRY CONFIGURATION
-- =====================================================

CREATE TABLE IF NOT EXISTS industry_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default industries
INSERT INTO industry_types (slug, name, description, icon, color) VALUES
('home_services', 'Home Services', 'Plumbing, HVAC, Electrical, Roofing, etc.', 'Wrench', '#3B82F6'),
('healthcare', 'Healthcare/Dental', 'Doctors, Dentists, Clinics, Medical Practices', 'Stethoscope', '#10B981'),
('real_estate', 'Real Estate', 'Realtors, Property Management, Real Estate Agents', 'Home', '#8B5CF6'),
('legal', 'Legal Services', 'Lawyers, Law Firms, Legal Consultants', 'Scale', '#6366F1'),
('transportation', 'Transportation', 'Limo Services, Towing, Trucking, Car Services', 'Car', '#F59E0B'),
('beauty_wellness', 'Beauty & Wellness', 'Salons, Spas, Groomers, Barbers', 'Scissors', '#EC4899')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- User industry settings
CREATE TABLE IF NOT EXISTS user_industry_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    industry_type_id INT NOT NULL,
    business_name VARCHAR(255),
    business_phone VARCHAR(50),
    business_email VARCHAR(255),
    business_address TEXT,
    business_hours JSON,
    service_area TEXT,
    license_number VARCHAR(100),
    insurance_info TEXT,
    custom_settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (industry_type_id) REFERENCES industry_types(id),
    UNIQUE KEY unique_user_industry (user_id, industry_type_id)
);

-- =====================================================
-- SERVICES & SERVICE CATEGORIES
-- =====================================================

CREATE TABLE IF NOT EXISTS service_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    industry_type_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INT DEFAULT 60,
    price DECIMAL(10,2),
    price_type ENUM('fixed', 'hourly', 'estimate', 'free') DEFAULT 'fixed',
    deposit_required BOOLEAN DEFAULT FALSE,
    deposit_amount DECIMAL(10,2),
    deposit_percentage INT,
    buffer_before INT DEFAULT 0,
    buffer_after INT DEFAULT 0,
    max_bookings_per_day INT,
    requires_confirmation BOOLEAN DEFAULT FALSE,
    intake_form_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE SET NULL
);

-- =====================================================
-- JOBS & DISPATCH (Home Services, Towing, Transport)
-- =====================================================

CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    contact_id INT NOT NULL,
    service_id INT,
    assigned_to INT,
    job_number VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('new', 'scheduled', 'dispatched', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled', 'on_hold') DEFAULT 'new',
    priority ENUM('low', 'normal', 'high', 'emergency') DEFAULT 'normal',
    job_type VARCHAR(50),
    
    -- Location
    service_address TEXT,
    service_city VARCHAR(100),
    service_state VARCHAR(50),
    service_zip VARCHAR(20),
    service_lat DECIMAL(10,8),
    service_lng DECIMAL(11,8),
    
    -- Scheduling
    scheduled_date DATE,
    scheduled_time_start TIME,
    scheduled_time_end TIME,
    actual_start_time DATETIME,
    actual_end_time DATETIME,
    estimated_duration INT,
    
    -- For towing/transport
    pickup_address TEXT,
    pickup_lat DECIMAL(10,8),
    pickup_lng DECIMAL(11,8),
    dropoff_address TEXT,
    dropoff_lat DECIMAL(10,8),
    dropoff_lng DECIMAL(11,8),
    vehicle_info JSON,
    
    -- Pricing
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    deposit_paid DECIMAL(10,2),
    payment_status ENUM('pending', 'partial', 'paid', 'refunded') DEFAULT 'pending',
    
    -- Notes & attachments
    internal_notes TEXT,
    customer_notes TEXT,
    photos JSON,
    documents JSON,
    
    -- Tracking
    source VARCHAR(50),
    campaign_id INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    changed_by INT,
    notes TEXT,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_line_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2),
    total DECIMAL(10,2),
    item_type ENUM('service', 'part', 'labor', 'fee', 'discount') DEFAULT 'service',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- =====================================================
-- TECHNICIANS / STAFF / DRIVERS
-- =====================================================

CREATE TABLE IF NOT EXISTS staff_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role ENUM('technician', 'driver', 'stylist', 'groomer', 'agent', 'provider', 'staff') DEFAULT 'staff',
    title VARCHAR(100),
    photo_url VARCHAR(500),
    bio TEXT,
    skills JSON,
    certifications JSON,
    service_ids JSON,
    availability JSON,
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- ESTIMATES & QUOTES
-- =====================================================

CREATE TABLE IF NOT EXISTS estimates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    contact_id INT NOT NULL,
    job_id INT,
    estimate_number VARCHAR(50),
    title VARCHAR(255),
    description TEXT,
    status ENUM('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'converted') DEFAULT 'draft',
    
    subtotal DECIMAL(10,2),
    tax_rate DECIMAL(5,2),
    tax_amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    total DECIMAL(10,2),
    
    valid_until DATE,
    terms TEXT,
    notes TEXT,
    
    sent_at DATETIME,
    viewed_at DATETIME,
    accepted_at DATETIME,
    signature_url VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS estimate_line_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estimate_id INT NOT NULL,
    service_id INT,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2),
    total DECIMAL(10,2),
    item_type ENUM('service', 'part', 'labor', 'fee', 'discount') DEFAULT 'service',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
);

-- =====================================================
-- INTAKE FORMS (Industry-Specific)
-- =====================================================

CREATE TABLE IF NOT EXISTS intake_form_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    industry_type_id INT,
    industry_slug VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    form_type ENUM('lead_intake', 'service_request', 'consultation', 'patient_intake', 'buyer_intake', 'seller_intake', 'case_intake', 'booking_intake') DEFAULT 'lead_intake',
    fields JSON NOT NULL,
    conditional_logic JSON,
    settings JSON,
    is_template BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert industry-specific intake form templates
INSERT INTO intake_form_templates (industry_type_id, name, description, form_type, fields, is_template) VALUES
-- Home Services
(1, 'Service Request Form', 'Capture service requests for home services', 'service_request', 
'[{"id":"service_type","type":"select","label":"Service Type","required":true,"options":["Plumbing","HVAC","Electrical","Roofing","General Repair"]},{"id":"urgency","type":"select","label":"Urgency","required":true,"options":["Emergency (ASAP)","Urgent (Today/Tomorrow)","This Week","Flexible"]},{"id":"issue_description","type":"textarea","label":"Describe the Issue","required":true},{"id":"service_address","type":"address","label":"Service Address","required":true},{"id":"photos","type":"file","label":"Upload Photos (optional)","accept":"image/*","multiple":true},{"id":"preferred_time","type":"select","label":"Preferred Time","options":["Morning (8am-12pm)","Afternoon (12pm-5pm)","Evening (5pm-8pm)","Anytime"]}]', TRUE),

-- Healthcare/Dental
(2, 'New Patient Intake', 'New patient registration form', 'patient_intake',
'[{"id":"patient_type","type":"select","label":"Patient Type","required":true,"options":["New Patient","Existing Patient"]},{"id":"insurance_provider","type":"text","label":"Insurance Provider"},{"id":"insurance_id","type":"text","label":"Insurance ID/Member Number"},{"id":"reason_for_visit","type":"textarea","label":"Reason for Visit","required":true},{"id":"symptoms","type":"checkbox","label":"Current Symptoms","options":["Pain","Sensitivity","Bleeding","Swelling","Other"]},{"id":"medical_conditions","type":"textarea","label":"Medical Conditions/Allergies"},{"id":"preferred_date","type":"date","label":"Preferred Appointment Date"},{"id":"preferred_time","type":"select","label":"Preferred Time","options":["Morning","Afternoon","No Preference"]}]', TRUE),

-- Real Estate
(3, 'Buyer Lead Intake', 'Qualify buyer leads', 'buyer_intake',
'[{"id":"buyer_type","type":"select","label":"I am looking to","required":true,"options":["Buy a Home","Rent","Invest"]},{"id":"timeline","type":"select","label":"Timeline","required":true,"options":["ASAP","1-3 Months","3-6 Months","6+ Months","Just Browsing"]},{"id":"budget_min","type":"number","label":"Budget Min ($)"},{"id":"budget_max","type":"number","label":"Budget Max ($)"},{"id":"preapproved","type":"select","label":"Pre-approved for Mortgage?","options":["Yes","No","Not Sure"]},{"id":"areas","type":"text","label":"Preferred Areas/Neighborhoods"},{"id":"bedrooms","type":"select","label":"Bedrooms","options":["1","2","3","4","5+"]},{"id":"property_type","type":"checkbox","label":"Property Type","options":["Single Family","Condo","Townhouse","Multi-Family"]},{"id":"must_haves","type":"textarea","label":"Must-Have Features"}]', TRUE),

(3, 'Seller Lead Intake', 'Qualify seller leads', 'seller_intake',
'[{"id":"property_address","type":"address","label":"Property Address","required":true},{"id":"timeline","type":"select","label":"When do you want to sell?","required":true,"options":["ASAP","1-3 Months","3-6 Months","6+ Months","Just Curious About Value"]},{"id":"property_type","type":"select","label":"Property Type","options":["Single Family","Condo","Townhouse","Multi-Family","Land"]},{"id":"bedrooms","type":"select","label":"Bedrooms","options":["1","2","3","4","5+"]},{"id":"bathrooms","type":"select","label":"Bathrooms","options":["1","1.5","2","2.5","3+"]},{"id":"condition","type":"select","label":"Property Condition","options":["Excellent","Good","Fair","Needs Work"]},{"id":"reason","type":"select","label":"Reason for Selling","options":["Upgrading","Downsizing","Relocating","Investment","Other"]},{"id":"mortgage_balance","type":"text","label":"Approximate Mortgage Balance"}]', TRUE),

-- Legal
(4, 'Case Intake Form', 'Initial case consultation intake', 'case_intake',
'[{"id":"case_type","type":"select","label":"Type of Legal Matter","required":true,"options":["Personal Injury","Family Law","Criminal Defense","Immigration","Business Law","Estate Planning","Real Estate","Employment","Other"]},{"id":"brief_description","type":"textarea","label":"Brief Description of Your Situation","required":true},{"id":"incident_date","type":"date","label":"Date of Incident (if applicable)"},{"id":"urgency","type":"select","label":"Urgency","options":["Emergency","Urgent","Standard","Just Exploring Options"]},{"id":"previous_attorney","type":"select","label":"Have you consulted another attorney?","options":["Yes","No"]},{"id":"how_heard","type":"select","label":"How did you hear about us?","options":["Google","Referral","Social Media","Advertisement","Other"]}]', TRUE),

-- Transportation (Limo/Towing)
(5, 'Towing Request', 'Emergency towing service request', 'service_request',
'[{"id":"service_type","type":"select","label":"Service Needed","required":true,"options":["Towing","Jump Start","Tire Change","Lockout","Fuel Delivery","Winch Out"]},{"id":"vehicle_year","type":"text","label":"Vehicle Year"},{"id":"vehicle_make","type":"text","label":"Vehicle Make"},{"id":"vehicle_model","type":"text","label":"Vehicle Model"},{"id":"vehicle_color","type":"text","label":"Vehicle Color"},{"id":"current_location","type":"address","label":"Current Location","required":true},{"id":"destination","type":"address","label":"Destination (for towing)"},{"id":"issue_description","type":"textarea","label":"Describe the Issue"},{"id":"blocking_traffic","type":"select","label":"Is vehicle blocking traffic?","options":["Yes","No"]}]', TRUE),

(5, 'Limo/Car Service Booking', 'Book transportation service', 'booking_intake',
'[{"id":"service_type","type":"select","label":"Service Type","required":true,"options":["Airport Transfer","Point to Point","Hourly Charter","Wedding","Prom","Corporate Event","Night Out"]},{"id":"pickup_date","type":"date","label":"Pickup Date","required":true},{"id":"pickup_time","type":"time","label":"Pickup Time","required":true},{"id":"pickup_address","type":"address","label":"Pickup Address","required":true},{"id":"dropoff_address","type":"address","label":"Drop-off Address"},{"id":"passengers","type":"number","label":"Number of Passengers","required":true},{"id":"vehicle_preference","type":"select","label":"Vehicle Preference","options":["Sedan","SUV","Stretch Limo","Party Bus","Van","No Preference"]},{"id":"special_requests","type":"textarea","label":"Special Requests"}]', TRUE),

-- Beauty & Wellness
(6, 'Salon Booking Form', 'Book salon/grooming appointment', 'booking_intake',
'[{"id":"service_category","type":"select","label":"Service Category","required":true,"options":["Haircut","Color","Styling","Nails","Facial","Massage","Grooming"]},{"id":"specific_service","type":"text","label":"Specific Service"},{"id":"preferred_stylist","type":"text","label":"Preferred Stylist/Groomer (optional)"},{"id":"pet_name","type":"text","label":"Pet Name (for grooming)"},{"id":"pet_breed","type":"text","label":"Pet Breed (for grooming)"},{"id":"pet_weight","type":"select","label":"Pet Weight (for grooming)","options":["Under 15 lbs","15-30 lbs","30-50 lbs","50-75 lbs","Over 75 lbs"]},{"id":"preferred_date","type":"date","label":"Preferred Date"},{"id":"preferred_time","type":"select","label":"Preferred Time","options":["Morning","Afternoon","Evening","No Preference"]},{"id":"special_notes","type":"textarea","label":"Special Notes/Requests"}]', TRUE);

-- =====================================================
-- REFERRAL PROGRAM
-- =====================================================

CREATE TABLE IF NOT EXISTS referral_programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    referrer_reward_type ENUM('fixed', 'percentage', 'credit', 'gift') DEFAULT 'fixed',
    referrer_reward_amount DECIMAL(10,2),
    referee_reward_type ENUM('fixed', 'percentage', 'credit', 'gift') DEFAULT 'fixed',
    referee_reward_amount DECIMAL(10,2),
    terms TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS referrals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    program_id INT,
    referrer_contact_id INT NOT NULL,
    referee_contact_id INT,
    referee_name VARCHAR(255),
    referee_email VARCHAR(255),
    referee_phone VARCHAR(50),
    status ENUM('pending', 'contacted', 'converted', 'rewarded', 'expired', 'invalid') DEFAULT 'pending',
    referrer_reward_status ENUM('pending', 'approved', 'paid') DEFAULT 'pending',
    referee_reward_status ENUM('pending', 'approved', 'paid') DEFAULT 'pending',
    conversion_date DATETIME,
    conversion_value DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES referral_programs(id) ON DELETE SET NULL
);

-- =====================================================
-- RECALL & FOLLOW-UP SCHEDULES
-- =====================================================

CREATE TABLE IF NOT EXISTS recall_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    industry_type_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    service_id INT,
    recall_type ENUM('time_based', 'mileage_based', 'usage_based', 'custom') DEFAULT 'time_based',
    interval_days INT,
    interval_months INT,
    custom_logic JSON,
    message_template_email INT,
    message_template_sms INT,
    reminder_days_before JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_recalls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    contact_id INT NOT NULL,
    recall_schedule_id INT,
    service_id INT,
    last_service_date DATE,
    next_recall_date DATE,
    status ENUM('upcoming', 'due', 'overdue', 'completed', 'cancelled', 'snoozed') DEFAULT 'upcoming',
    reminder_sent_at DATETIME,
    completed_at DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (recall_schedule_id) REFERENCES recall_schedules(id) ON DELETE SET NULL
);

-- =====================================================
-- SPEED-TO-LEAD & MISSED CALL HANDLING
-- =====================================================

CREATE TABLE IF NOT EXISTS speed_to_lead_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT TRUE,
    
    -- New lead response
    auto_call_new_leads BOOLEAN DEFAULT FALSE,
    auto_sms_new_leads BOOLEAN DEFAULT TRUE,
    new_lead_sms_template_id INT,
    new_lead_delay_seconds INT DEFAULT 30,
    
    -- Missed call handling
    missed_call_auto_sms BOOLEAN DEFAULT TRUE,
    missed_call_sms_template_id INT,
    missed_call_delay_seconds INT DEFAULT 60,
    
    -- Business hours
    respect_business_hours BOOLEAN DEFAULT TRUE,
    business_hours JSON,
    after_hours_sms_template_id INT,
    
    -- Round robin / routing
    round_robin_enabled BOOLEAN DEFAULT FALSE,
    assigned_staff_ids JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- INDUSTRY-SPECIFIC PIPELINE STAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS industry_pipeline_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    industry_type_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    stages JSON NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (industry_type_id) REFERENCES industry_types(id)
);

-- Insert default pipeline templates per industry
INSERT INTO industry_pipeline_templates (industry_type_id, name, stages, is_default) VALUES
(1, 'Home Services Pipeline', '[{"name":"New Lead","color":"#6B7280","probability":10},{"name":"Estimate Scheduled","color":"#3B82F6","probability":25},{"name":"Estimate Sent","color":"#8B5CF6","probability":40},{"name":"Job Scheduled","color":"#F59E0B","probability":70},{"name":"In Progress","color":"#10B981","probability":85},{"name":"Completed","color":"#059669","probability":100},{"name":"Lost","color":"#EF4444","probability":0}]', TRUE),

(2, 'Healthcare Pipeline', '[{"name":"New Inquiry","color":"#6B7280","probability":10},{"name":"Appointment Scheduled","color":"#3B82F6","probability":40},{"name":"Appointment Completed","color":"#10B981","probability":70},{"name":"Treatment Plan Presented","color":"#8B5CF6","probability":80},{"name":"Treatment Started","color":"#F59E0B","probability":90},{"name":"Active Patient","color":"#059669","probability":100},{"name":"Inactive","color":"#EF4444","probability":0}]', TRUE),

(3, 'Real Estate Buyer Pipeline', '[{"name":"New Lead","color":"#6B7280","probability":5},{"name":"Contacted","color":"#3B82F6","probability":15},{"name":"Qualified","color":"#8B5CF6","probability":25},{"name":"Showing Scheduled","color":"#F59E0B","probability":40},{"name":"Offer Submitted","color":"#10B981","probability":60},{"name":"Under Contract","color":"#059669","probability":85},{"name":"Closed","color":"#047857","probability":100},{"name":"Lost","color":"#EF4444","probability":0}]', TRUE),

(4, 'Legal Case Pipeline', '[{"name":"New Inquiry","color":"#6B7280","probability":10},{"name":"Consultation Scheduled","color":"#3B82F6","probability":25},{"name":"Consultation Completed","color":"#8B5CF6","probability":40},{"name":"Proposal Sent","color":"#F59E0B","probability":55},{"name":"Retained","color":"#10B981","probability":80},{"name":"Case Active","color":"#059669","probability":90},{"name":"Case Closed","color":"#047857","probability":100},{"name":"Not Retained","color":"#EF4444","probability":0}]', TRUE),

(5, 'Transportation Pipeline', '[{"name":"New Request","color":"#6B7280","probability":20},{"name":"Quote Sent","color":"#3B82F6","probability":40},{"name":"Booked","color":"#10B981","probability":80},{"name":"Dispatched","color":"#F59E0B","probability":90},{"name":"Completed","color":"#059669","probability":100},{"name":"Cancelled","color":"#EF4444","probability":0}]', TRUE),

(6, 'Salon/Grooming Pipeline', '[{"name":"New Lead","color":"#6B7280","probability":20},{"name":"Appointment Booked","color":"#3B82F6","probability":60},{"name":"Checked In","color":"#F59E0B","probability":85},{"name":"Service Complete","color":"#10B981","probability":95},{"name":"Follow-up Due","color":"#8B5CF6","probability":100},{"name":"No Show","color":"#EF4444","probability":0}]', TRUE);

-- =====================================================
-- INDUSTRY PLAYBOOK TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS playbook_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    industry_type_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('lead_nurture', 'appointment_reminder', 'review_request', 'recall', 'win_back', 'referral', 'onboarding', 'follow_up') NOT NULL,
    template_type ENUM('automation', 'campaign', 'landing_page', 'form', 'email_sequence', 'sms_sequence') NOT NULL,
    template_data JSON NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_jobs_user_status ON jobs(user_id, status);
CREATE INDEX idx_jobs_scheduled ON jobs(scheduled_date, status);
CREATE INDEX idx_jobs_assigned ON jobs(assigned_to, status);
CREATE INDEX idx_estimates_user_status ON estimates(user_id, status);
CREATE INDEX idx_referrals_user_status ON referrals(user_id, status);
CREATE INDEX idx_contact_recalls_next_date ON contact_recalls(next_recall_date, status);
CREATE INDEX idx_staff_members_user ON staff_members(user_id, is_active);
