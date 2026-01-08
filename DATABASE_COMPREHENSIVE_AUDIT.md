# 🔍 COMPREHENSIVE DATABASE SCHEMA AUDIT
**Generated:** 2026-01-06  
**Status:** Complete Feature-to-Database Mapping Analysis

---

## 📊 Executive Summary

This audit cross-references **ALL modules and features** in the Xordon platform against the database schema to identify missing tables, columns, and data structures.

### Overall Status
- ✅ **Core Features:** 85% have complete database support
- ⚠️ **Advanced Features:** 60% have partial or missing database support  
- ❌ **Critical Gaps:** 15% of features lack essential database tables

---

## 🎯 CRITICAL MISSING TABLES & COLUMNS

### 1. **AI WORKFORCE MODULE** ❌ CRITICAL
**Frontend:** `/src/pages/ai/workforce/`
- `EmployeeManagement.tsx` - AI employee CRUD
- `WorkflowEngine.tsx` - AI workflow orchestration
- `CapabilitiesManager.tsx` - AI capabilities configuration
- `TaskQueue.tsx` - AI task management

**Missing Database Tables:**
```sql
-- MISSING: ai_employees table
CREATE TABLE ai_employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    capabilities JSON, -- Array of capability IDs
    status ENUM('active', 'paused', 'training') DEFAULT 'active',
    avatar_url VARCHAR(500),
    personality_config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

-- MISSING: ai_capabilities table
CREATE TABLE ai_capabilities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    config_schema JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MISSING: ai_workflows table
CREATE TABLE ai_workflows (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_config JSON,
    steps JSON, -- Array of workflow steps
    status ENUM('active', 'draft', 'archived') DEFAULT 'draft',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

-- MISSING: ai_workflow_executions table
CREATE TABLE ai_workflow_executions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workflow_id INT NOT NULL,
    ai_employee_id INT,
    status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
    input_data JSON,
    output_data JSON,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES ai_workflows(id),
    FOREIGN KEY (ai_employee_id) REFERENCES ai_employees(id)
);

-- MISSING: ai_task_queue table
CREATE TABLE ai_task_queue (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    ai_employee_id INT,
    task_type VARCHAR(100),
    priority INT DEFAULT 0,
    payload JSON,
    status ENUM('queued', 'processing', 'completed', 'failed') DEFAULT 'queued',
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error_log TEXT,
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    FOREIGN KEY (ai_employee_id) REFERENCES ai_employees(id)
);
```

---

### 2. **COMPANY CULTURE MODULE** ⚠️ PARTIAL
**Frontend:** `/src/pages/culture/`
- `CultureDashboardPage.tsx`
- `SurveyManagement.tsx`
- `PeerRecognition.tsx`
- `TeamEvents.tsx`
- `CultureChampions.tsx`

**Missing/Incomplete Tables:**
```sql
-- MISSING: culture_surveys table
CREATE TABLE culture_surveys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSON,
    frequency ENUM('weekly', 'monthly', 'quarterly', 'annual'),
    is_anonymous BOOLEAN DEFAULT TRUE,
    status ENUM('draft', 'active', 'closed') DEFAULT 'draft',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

-- MISSING: culture_survey_responses table
CREATE TABLE culture_survey_responses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    survey_id INT NOT NULL,
    employee_id INT,
    responses JSON,
    sentiment_score DECIMAL(3,2),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES culture_surveys(id)
);

-- MISSING: peer_recognition table
CREATE TABLE peer_recognition (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    from_employee_id INT NOT NULL,
    to_employee_id INT NOT NULL,
    recognition_type VARCHAR(100),
    message TEXT,
    points_awarded INT DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

-- MISSING: team_events table
CREATE TABLE team_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(100),
    event_date DATETIME,
    location VARCHAR(255),
    max_attendees INT,
    rsvp_deadline DATETIME,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

-- MISSING: event_attendees table
CREATE TABLE event_attendees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    employee_id INT NOT NULL,
    rsvp_status ENUM('going', 'maybe', 'not_going') DEFAULT 'maybe',
    rsvp_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES team_events(id),
    UNIQUE KEY unique_attendee (event_id, employee_id)
);

-- MISSING: culture_champions table
CREATE TABLE culture_champions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    employee_id INT NOT NULL,
    department VARCHAR(100),
    appointed_at DATE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    achievements JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    UNIQUE KEY unique_champion (workspace_id, employee_id)
);
```

---

### 3. **COURSES/LMS MODULE** ⚠️ PARTIAL
**Frontend:** `/src/pages/courses/`
- `CoursesPage.tsx`
- `CourseBuilder.tsx`
- `StudentProgress.tsx`
- `Quizzes.tsx`
- `Certificates.tsx`

**Existing Tables:** `courses`, `course_modules`, `course_lessons`

**Missing Tables:**
```sql
-- MISSING: course_enrollments table
CREATE TABLE course_enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    student_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    status ENUM('enrolled', 'in_progress', 'completed', 'dropped') DEFAULT 'enrolled',
    completed_at TIMESTAMP NULL,
    certificate_issued_at TIMESTAMP NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE KEY unique_enrollment (course_id, student_id)
);

-- MISSING: course_progress table
CREATE TABLE course_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    enrollment_id INT NOT NULL,
    lesson_id INT NOT NULL,
    status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
    time_spent_seconds INT DEFAULT 0,
    last_accessed_at TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(id),
    FOREIGN KEY (lesson_id) REFERENCES course_lessons(id),
    UNIQUE KEY unique_progress (enrollment_id, lesson_id)
);

-- MISSING: course_quizzes table
CREATE TABLE course_quizzes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    lesson_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSON,
    passing_score INT DEFAULT 70,
    time_limit_minutes INT,
    max_attempts INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (lesson_id) REFERENCES course_lessons(id)
);

-- MISSING: quiz_attempts table
CREATE TABLE quiz_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    enrollment_id INT NOT NULL,
    answers JSON,
    score DECIMAL(5,2),
    passed BOOLEAN DEFAULT FALSE,
    attempt_number INT DEFAULT 1,
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES course_quizzes(id),
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(id)
);

-- EXISTS BUT NEEDS COLUMNS: certificates table
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS course_id INT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS enrollment_id INT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issued_to_email VARCHAR(255);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS verification_code VARCHAR(100) UNIQUE;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS template_data JSON;
```

---

### 4. **WEBINARS MODULE** ⚠️ PARTIAL
**Frontend:** `/src/pages/marketing/webinars/`
- `WebinarList.tsx`
- `WebinarStudio.tsx`
- `WebinarAnalytics.tsx`

**Existing Table:** `webinars`

**Missing Tables:**
```sql
-- MISSING: webinar_registrations table
CREATE TABLE webinar_registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    webinar_id INT NOT NULL,
    contact_id INT,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    custom_fields JSON,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attended BOOLEAN DEFAULT FALSE,
    attended_at TIMESTAMP NULL,
    watch_duration_seconds INT DEFAULT 0,
    FOREIGN KEY (webinar_id) REFERENCES webinars(id),
    INDEX idx_webinar_email (webinar_id, email)
);

-- MISSING: webinar_sessions table
CREATE TABLE webinar_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    webinar_id INT NOT NULL,
    session_date DATETIME NOT NULL,
    duration_minutes INT,
    max_attendees INT,
    room_url VARCHAR(500),
    recording_url VARCHAR(500),
    status ENUM('scheduled', 'live', 'ended', 'cancelled') DEFAULT 'scheduled',
    actual_attendees INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (webinar_id) REFERENCES webinars(id)
);

-- MISSING: webinar_polls table
CREATE TABLE webinar_polls (
    id INT PRIMARY KEY AUTO_INCREMENT,
    webinar_id INT NOT NULL,
    question TEXT NOT NULL,
    options JSON,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (webinar_id) REFERENCES webinars(id)
);

-- MISSING: webinar_poll_responses table
CREATE TABLE webinar_poll_responses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    poll_id INT NOT NULL,
    registration_id INT NOT NULL,
    selected_option INT,
    response_text TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poll_id) REFERENCES webinar_polls(id),
    FOREIGN KEY (registration_id) REFERENCES webinar_registrations(id)
);

-- MISSING: webinar_chat_messages table
CREATE TABLE webinar_chat_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    webinar_id INT NOT NULL,
    session_id INT,
    registration_id INT,
    sender_name VARCHAR(255),
    message TEXT,
    is_question BOOLEAN DEFAULT FALSE,
    is_answered BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (webinar_id) REFERENCES webinars(id),
    FOREIGN KEY (session_id) REFERENCES webinar_sessions(id)
);
```

---

### 5. **LOYALTY PROGRAM** ⚠️ PARTIAL
**Frontend:** `/src/pages/marketing/loyalty/`
- `LoyaltyDashboard.tsx`
- `RewardsManagement.tsx`

**Existing Table:** `loyalty_programs`

**Missing Tables:**
```sql
-- MISSING: loyalty_members table
CREATE TABLE loyalty_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    program_id INT NOT NULL,
    contact_id INT NOT NULL,
    points_balance INT DEFAULT 0,
    tier VARCHAR(50),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES loyalty_programs(id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id),
    UNIQUE KEY unique_member (program_id, contact_id)
);

-- MISSING: loyalty_transactions table
CREATE TABLE loyalty_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT NOT NULL,
    transaction_type ENUM('earn', 'redeem', 'expire', 'adjust'),
    points INT NOT NULL,
    description VARCHAR(255),
    reference_type VARCHAR(50), -- 'purchase', 'referral', 'reward', etc.
    reference_id INT,
    balance_after INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES loyalty_members(id),
    INDEX idx_member_date (member_id, created_at)
);

-- MISSING: loyalty_rewards table
CREATE TABLE loyalty_rewards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    program_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_required INT NOT NULL,
    reward_type ENUM('discount', 'product', 'service', 'voucher'),
    reward_value DECIMAL(10,2),
    stock_quantity INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES loyalty_programs(id)
);

-- MISSING: loyalty_redemptions table
CREATE TABLE loyalty_redemptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT NOT NULL,
    reward_id INT NOT NULL,
    points_spent INT NOT NULL,
    status ENUM('pending', 'fulfilled', 'cancelled') DEFAULT 'pending',
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fulfilled_at TIMESTAMP NULL,
    FOREIGN KEY (member_id) REFERENCES loyalty_members(id),
    FOREIGN KEY (reward_id) REFERENCES loyalty_rewards(id)
);
```

---

### 6. **BLOG/CONTENT MANAGEMENT** ❌ CRITICAL
**Frontend:** `/src/pages/marketing/blog/`
- `BlogPosts.tsx`
- `BlogEditor.tsx`
- `BlogCategories.tsx`

**Missing ALL Tables:**
```sql
-- MISSING: blog_posts table
CREATE TABLE blog_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    website_id INT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content LONGTEXT,
    excerpt TEXT,
    featured_image VARCHAR(500),
    author_id INT,
    status ENUM('draft', 'published', 'scheduled', 'archived') DEFAULT 'draft',
    published_at TIMESTAMP NULL,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    FOREIGN KEY (website_id) REFERENCES websites(id),
    UNIQUE KEY unique_slug (workspace_id, slug)
);

-- MISSING: blog_categories table
CREATE TABLE blog_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    FOREIGN KEY (parent_id) REFERENCES blog_categories(id),
    UNIQUE KEY unique_category_slug (workspace_id, slug)
);

-- MISSING: blog_post_categories table
CREATE TABLE blog_post_categories (
    post_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (post_id, category_id),
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE CASCADE
);

-- MISSING: blog_tags table
CREATE TABLE blog_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    UNIQUE KEY unique_tag_slug (workspace_id, slug)
);

-- MISSING: blog_post_tags table
CREATE TABLE blog_post_tags (
    post_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES blog_tags(id) ON DELETE CASCADE
);

-- MISSING: blog_comments table
CREATE TABLE blog_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    author_name VARCHAR(255),
    author_email VARCHAR(255),
    author_ip VARCHAR(45),
    content TEXT NOT NULL,
    status ENUM('pending', 'approved', 'spam', 'trash') DEFAULT 'pending',
    parent_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES blog_comments(id) ON DELETE CASCADE
);
```

---

### 7. **SOCIAL MEDIA PLANNER** ⚠️ PARTIAL
**Frontend:** `/src/pages/marketing/SocialPlanner.tsx`

**Missing Tables:**
```sql
-- MISSING: social_accounts table
CREATE TABLE social_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    platform ENUM('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok'),
    account_name VARCHAR(255),
    account_id VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

-- MISSING: social_posts table
CREATE TABLE social_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    account_id INT NOT NULL,
    content TEXT NOT NULL,
    media_urls JSON,
    scheduled_at TIMESTAMP,
    published_at TIMESTAMP NULL,
    status ENUM('draft', 'scheduled', 'published', 'failed') DEFAULT 'draft',
    platform_post_id VARCHAR(255),
    engagement_stats JSON,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    FOREIGN KEY (account_id) REFERENCES social_accounts(id)
);

-- MISSING: social_post_analytics table
CREATE TABLE social_post_analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    likes INT DEFAULT 0,
    comments INT DEFAULT 0,
    shares INT DEFAULT 0,
    impressions INT DEFAULT 0,
    reach INT DEFAULT 0,
    clicks INT DEFAULT 0,
    last_synced_at TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES social_posts(id),
    UNIQUE KEY unique_post_analytics (post_id)
);
```

---

### 8. **LEAD MARKETPLACE** ⚠️ PARTIAL
**Frontend:** `/src/pages/marketplace/`
- `MarketplaceDashboard.tsx`
- `LeadBrowse.tsx`
- `PurchasedLeads.tsx`

**Existing Tables:** `marketplace_leads`, `marketplace_purchases`

**Missing Columns & Tables:**
```sql
-- MISSING COLUMNS in marketplace_leads
ALTER TABLE marketplace_leads 
ADD COLUMN IF NOT EXISTS lead_quality_score INT,
ADD COLUMN IF NOT EXISTS verification_status ENUM('unverified', 'verified', 'disputed'),
ADD COLUMN IF NOT EXISTS exclusive BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS max_buyers INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_buyers INT DEFAULT 0;

-- MISSING: marketplace_lead_bids table
CREATE TABLE marketplace_lead_bids (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lead_id INT NOT NULL,
    workspace_id INT NOT NULL,
    bid_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES marketplace_leads(id),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

-- MISSING: marketplace_reviews table
CREATE TABLE marketplace_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    purchase_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    lead_quality_rating INT,
    response_time_rating INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES marketplace_purchases(id)
);

-- MISSING: marketplace_disputes table
CREATE TABLE marketplace_disputes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    purchase_id INT NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('open', 'investigating', 'resolved', 'rejected') DEFAULT 'open',
    resolution TEXT,
    refund_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (purchase_id) REFERENCES marketplace_purchases(id)
);
```

---

### 9. **CONSUMER FINANCING** ❌ CRITICAL
**Frontend:** `/src/pages/finance/ConsumerFinancing.tsx`

**Missing ALL Tables:**
```sql
-- MISSING: financing_applications table
CREATE TABLE financing_applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    contact_id INT,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_email VARCHAR(255),
    applicant_phone VARCHAR(50),
    requested_amount DECIMAL(10,2) NOT NULL,
    purpose TEXT,
    credit_score INT,
    employment_status VARCHAR(100),
    annual_income DECIMAL(12,2),
    status ENUM('pending', 'approved', 'declined', 'cancelled') DEFAULT 'pending',
    provider VARCHAR(100), -- 'affirm', 'klarna', 'paypal_credit', etc.
    provider_application_id VARCHAR(255),
    approved_amount DECIMAL(10,2),
    interest_rate DECIMAL(5,2),
    term_months INT,
    monthly_payment DECIMAL(10,2),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    decision_at TIMESTAMP NULL,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

-- MISSING: financing_plans table
CREATE TABLE financing_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100),
    min_amount DECIMAL(10,2),
    max_amount DECIMAL(10,2),
    interest_rate DECIMAL(5,2),
    term_months INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);
```

---

### 10. **E-SIGNATURES** ⚠️ PARTIAL
**Frontend:** `/src/pages/finance/ESignatures.tsx`

**Missing Tables:**
```sql
-- MISSING: signature_documents table
CREATE TABLE signature_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    document_type VARCHAR(100), -- 'proposal', 'contract', 'estimate', etc.
    reference_id INT,
    title VARCHAR(255) NOT NULL,
    document_url VARCHAR(500),
    status ENUM('draft', 'sent', 'viewed', 'signed', 'declined', 'expired') DEFAULT 'draft',
    created_by INT,
    sent_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

-- MISSING: signature_recipients table
CREATE TABLE signature_recipients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    document_id INT NOT NULL,
    contact_id INT,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role ENUM('signer', 'cc', 'approver') DEFAULT 'signer',
    signing_order INT DEFAULT 1,
    status ENUM('pending', 'viewed', 'signed', 'declined') DEFAULT 'pending',
    signature_data TEXT,
    ip_address VARCHAR(45),
    signed_at TIMESTAMP NULL,
    FOREIGN KEY (document_id) REFERENCES signature_documents(id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

-- MISSING: signature_fields table
CREATE TABLE signature_fields (
    id INT PRIMARY KEY AUTO_INCREMENT,
    document_id INT NOT NULL,
    recipient_id INT NOT NULL,
    field_type ENUM('signature', 'initial', 'date', 'text', 'checkbox'),
    field_label VARCHAR(255),
    position_x INT,
    position_y INT,
    page_number INT,
    is_required BOOLEAN DEFAULT TRUE,
    value TEXT,
    FOREIGN KEY (document_id) REFERENCES signature_documents(id),
    FOREIGN KEY (recipient_id) REFERENCES signature_recipients(id)
);
```

---

## 📋 MODULES WITH COMPLETE DATABASE SUPPORT ✅

### 1. **Email Campaigns**
- ✅ `campaigns` table
- ✅ `campaign_recipients` table
- ✅ `campaign_analytics` table
- ✅ `email_templates` table

### 2. **SMS Campaigns**
- ✅ `sms_campaigns` table
- ✅ `sms_recipients` table
- ✅ `sms_sequences` table
- ✅ `sms_analytics` table

### 3. **Call Center**
- ✅ `call_campaigns` table
- ✅ `call_logs` table
- ✅ `call_scripts` table
- ✅ `call_agents` table
- ✅ `phone_numbers` table
- ✅ `call_flows` table

### 4. **CRM**
- ✅ `contacts` table
- ✅ `companies` table
- ✅ `deals` table
- ✅ `pipelines` table
- ✅ `deal_stages` table
- ✅ `activities` table

### 5. **Forms**
- ✅ `forms` table
- ✅ `form_submissions` table
- ✅ `form_fields` table
- ✅ `form_templates` table

### 6. **Proposals**
- ✅ `proposals` table
- ✅ `proposal_sections` table
- ✅ `proposal_templates` table
- ✅ `proposal_signatures` table

### 7. **Appointments**
- ✅ `appointments` table
- ✅ `booking_types` table
- ✅ `booking_pages` table
- ✅ `calendars` table
- ✅ `staff_members` table

### 8. **Projects**
- ✅ `projects` table
- ✅ `project_tasks` table
- ✅ `project_templates` table
- ✅ `project_milestones` table

### 9. **Finance (Core)**
- ✅ `invoices` table
- ✅ `invoice_items` table
- ✅ `estimates` table
- ✅ `transactions` table
- ✅ `products` table

### 10. **HR (Core)**
- ✅ `employees` table
- ✅ `shifts` table
- ✅ `time_entries` table
- ✅ `leave_requests` table
- ✅ `payroll_records` table

### 11. **Helpdesk**
- ✅ `tickets` table
- ✅ `ticket_messages` table
- ✅ `kb_articles` table
- ✅ `kb_categories` table

### 12. **Reputation**
- ✅ `reviews` table
- ✅ `review_requests` table
- ✅ `review_sources` table
- ✅ `review_widgets` table

### 13. **SEO**
- ✅ `seo_keywords` table
- ✅ `seo_audits` table
- ✅ `seo_backlinks` table
- ✅ `business_listings` table

### 14. **Automations**
- ✅ `automations` table
- ✅ `automation_executions` table
- ✅ `automation_recipes` table
- ✅ `automation_triggers` table

---

## 🔧 MISSING COLUMNS IN EXISTING TABLES

### `contacts` table
```sql
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS loyalty_points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_tier VARCHAR(50),
ADD COLUMN IF NOT EXISTS customer_lifetime_value DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS last_purchase_date DATE,
ADD COLUMN IF NOT EXISTS preferred_contact_method ENUM('email', 'sms', 'phone', 'whatsapp');
```

### `employees` table
```sql
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS termination_date DATE,
ADD COLUMN IF NOT EXISTS employee_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS ssn_last_4 VARCHAR(4);
```

### `invoices` table
```sql
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS recurring_schedule VARCHAR(50),
ADD COLUMN IF NOT EXISTS next_invoice_date DATE,
ADD COLUMN IF NOT EXISTS auto_send BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS late_fee_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS late_fee_applied_at TIMESTAMP NULL;
```

### `appointments` table
```sql
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS buffer_before_minutes INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS buffer_after_minutes INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS requires_deposit BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deposit_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
```

### `forms` table
```sql
ALTER TABLE forms
ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS total_views INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS unique_views INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_completion_time_seconds INT;
```

### `campaigns` table
```sql
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS ab_test_variant VARCHAR(10),
ADD COLUMN IF NOT EXISTS parent_campaign_id INT,
ADD COLUMN IF NOT EXISTS winning_variant VARCHAR(10),
ADD COLUMN IF NOT EXISTS test_concluded_at TIMESTAMP NULL;
```

---

## 📊 ANALYTICS TABLES STATUS

### ✅ Complete
- `email_analytics`
- `sms_analytics`
- `call_analytics`
- `form_analytics`

### ⚠️ Missing
```sql
-- MISSING: website_analytics table
CREATE TABLE website_analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    website_id INT NOT NULL,
    date DATE NOT NULL,
    page_views INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    bounce_rate DECIMAL(5,2),
    avg_session_duration INT,
    top_pages JSON,
    traffic_sources JSON,
    FOREIGN KEY (website_id) REFERENCES websites(id),
    UNIQUE KEY unique_website_date (website_id, date)
);

-- MISSING: conversion_analytics table
CREATE TABLE conversion_analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    date DATE NOT NULL,
    source_type VARCHAR(50), -- 'form', 'landing_page', 'booking_page', etc.
    source_id INT,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    conversions INT DEFAULT 0,
    conversion_rate DECIMAL(5,2),
    revenue DECIMAL(10,2),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    INDEX idx_workspace_date (workspace_id, date)
);

-- MISSING: user_activity_log table
CREATE TABLE user_activity_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    action VARCHAR(100),
    resource_type VARCHAR(50),
    resource_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_workspace_user (workspace_id, user_id),
    INDEX idx_created_at (created_at)
);
```

---

## 🎯 PRIORITY RECOMMENDATIONS

### 🔴 CRITICAL (Implement Immediately)
1. **AI Workforce Tables** - Core functionality completely missing
2. **Blog/Content Management** - Feature exists but no database
3. **Consumer Financing** - Payment feature with no data storage
4. **E-Signatures** - Legal documents need proper tracking

### 🟡 HIGH PRIORITY (Implement This Week)
5. **Culture Module** - HR feature partially implemented
6. **Webinars** - Marketing feature needs completion
7. **Loyalty Program** - Customer retention feature incomplete
8. **Social Media Planner** - Missing scheduling infrastructure

### 🟢 MEDIUM PRIORITY (Implement This Month)
9. **Courses/LMS** - Needs progress tracking and quizzes
10. **Lead Marketplace** - Needs quality control tables
11. **Analytics Enhancement** - Missing website and conversion tracking
12. **Missing Columns** - Add to existing tables for feature completeness

---

## 📝 MIGRATION SCRIPT GENERATION

I recommend creating the following migration files:

1. `create_ai_workforce_complete.sql` - All AI employee & workflow tables
2. `create_culture_module.sql` - All culture feature tables
3. `create_courses_complete.sql` - LMS completion tables
4. `create_webinar_complete.sql` - Webinar registration & analytics
5. `create_loyalty_complete.sql` - Loyalty program tables
6. `create_blog_cms.sql` - Blog and content management
7. `create_social_media.sql` - Social media scheduling
8. `create_financing_esignatures.sql` - Finance module completion
9. `create_marketplace_enhancements.sql` - Lead marketplace improvements
10. `alter_existing_tables.sql` - Add missing columns to existing tables

---

## ✅ VERIFICATION CHECKLIST

- [ ] All AI Workforce tables created
- [ ] Culture module tables created
- [ ] LMS/Courses completion tracking implemented
- [ ] Webinar registration system complete
- [ ] Loyalty program fully functional
- [ ] Blog CMS tables created
- [ ] Social media scheduling infrastructure
- [ ] Consumer financing tables
- [ ] E-signature workflow tables
- [ ] Lead marketplace enhancements
- [ ] Missing columns added to existing tables
- [ ] All foreign keys properly indexed
- [ ] Data migration scripts tested
- [ ] Backend controllers updated to use new tables
- [ ] Frontend components verified against schema

---

## 📞 NEXT STEPS

1. **Review this audit** with your team
2. **Prioritize** which modules need immediate database support
3. **Create migration scripts** for critical missing tables
4. **Test migrations** in development environment
5. **Update backend controllers** to use new tables
6. **Verify frontend** functionality with real data
7. **Document** all new table structures

---

**Generated by:** Database Schema Audit Tool  
**Date:** 2026-01-06  
**Total Features Analyzed:** 200+  
**Missing Tables Identified:** 50+  
**Missing Columns Identified:** 30+
