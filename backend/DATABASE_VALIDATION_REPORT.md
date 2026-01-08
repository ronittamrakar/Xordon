# Database Schema Validation Report
Generated on: 2026-01-04 09:37:34

## Summary
- **Expected Tables (from migrations):** 657
- **Actual Tables (in database):** 793
- **Missing Tables:** 1
- **Extra/Unnecessary Tables:** 137

## ⚠️ Missing Tables
The following tables are defined in migrations but missing from the database:
- `and`

### Suggested Actions
Check the `migrations/` folder for files creating these tables and run them manually if needed.

## ❓ Extra Tables
The following tables are in the database but NOT found in any `CREATE TABLE` statement in `migrations/`:
- `_fb_user_map`
- `ad_ab_tests`
- `appointment_analytics`
- `appointment_automation_logs`
- `automations`
- `blog_posts`
- `blog_settings`
- `booking_page_analytics`
- `calendar_sync_settings`
- `calls`
- `client_errors`
- `connections`
- `contact_tags`
- `contacts`
- `course_discussions`
- `crm_dashboard`
- `email_campaigns`
- `email_logs`
- `employee_hr_summary`
- `esign_audit_log`
- `esign_documents`
- `esign_envelopes`
- `esign_signers`
- `fb_activity_logs`
- `fb_field_interactions`
- `fb_field_options`
- `fb_field_responses`
- `fb_folders`
- `fb_form_analytics`
- `fb_form_fields`
- `fb_form_starts`
- `fb_form_submissions`
- `fb_form_templates`
- `fb_form_views`
- `fb_forms`
- `fb_spam_rules`
- `fb_user_settings`
- `fb_users`
- `fb_webhook_deliveries`
- `fb_webhooks`
- `field_dispatch_jobs`
- `form_submissions`
- `fsm_appointments`
- `fsm_availability_schedules`
- `fsm_booking_page_settings`
- `fsm_booking_types`
- `fsm_contact_recalls`
- `fsm_estimate_line_items`
- `fsm_estimates`
- `fsm_industry_settings`
- `fsm_intake_submissions`
- `fsm_intake_templates`
- `fsm_playbooks`
- `fsm_recall_schedules`
- `fsm_referral_programs`
- `fsm_referrals`
- `fsm_service_categories`
- `fsm_services`
- `fsm_staff`
- `geofence_events`
- `geofences`
- `gps_devices`
- `gps_location_logs`
- `gps_logs`
- `instagram_conversations`
- `instagram_messages`
- `inventory_locations`
- `inventory_movements`
- `inventory_stock`
- `inventory_warehouses`
- `lesson_attachments`
- `listings`
- `loyalty_points`
- `loyalty_programs`
- `loyalty_rewards`
- `loyalty_transactions`
- `migration_log`
- `migrations`
- `onboarding_template_tasks`
- `onboarding_templates`
- `project_custom_fields`
- `project_tasks`
- `qr_code_scans`
- `qr_codes`
- `quiz_attempt_answers`
- `quiz_question_options`
- `recurring_tasks`
- `saved_filters`
- `seo_reports`
- `seo_settings`
- `service_zones`
- `shift_leave_conflicts`
- `sms_accounts`
- `sms_logs`
- `social_content_calendar`
- `social_post_metrics`
- `social_post_queue`
- `student_notes`
- `sub_accounts`
- `task_activity`
- `task_attachments`
- `task_comments`
- `task_custom_field_values`
- `task_dependencies`
- `task_subtasks`
- `task_time_entries`
- `task_watchers`
- `tasks`
- `technician_status`
- `tiktok_accounts`
- `tiktok_conversations`
- `tiktok_messages`
- `user_roles`
- `video_meetings_log`
- `video_provider_connections`
- `webforms`
- `webforms_activity_logs`
- `webforms_field_interactions`
- `webforms_field_options`
- `webforms_field_responses`
- `webforms_folders`
- `webforms_form_analytics`
- `webforms_form_fields`
- `webforms_form_starts`
- `webforms_form_submissions`
- `webforms_form_templates`
- `webforms_form_views`
- `webforms_forms`
- `webforms_spam_rules`
- `webforms_user_settings`
- `webforms_users`
- `webforms_webhook_deliveries`
- `webforms_webhooks`
- `webhooks`
- `webinar_registrants`
- `webinars`
- `z_legacy_forms`

> Note: These might be created dynamicall, legacy tables, or seed data tables.

## 📋 Detailed Schema Inspection
### Table: `_fb_user_map`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `fb_user_id` | `int(11)` | NO | `NULL` | PRI |  |
| `main_user_id` | `int(11)` | NO | `NULL` |  |  |
| `main_workspace_id` | `int(11)` | NO | `NULL` |  |  |
| `email` | `varchar(255)` | YES | `NULL` |  |  |

**Indexes:**
- `UNIQUE` `PRIMARY`: `fb_user_id`

---
### Table: `_webforms_user_map`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `webforms_user_id` | `int(11)` | NO | `NULL` | PRI |  |
| `main_user_id` | `int(11)` | NO | `NULL` |  |  |
| `main_workspace_id` | `int(11)` | NO | `NULL` |  |  |
| `email` | `varchar(255)` | YES | `NULL` |  |  |

**Indexes:**
- `UNIQUE` `PRIMARY`: `webforms_user_id`

---
### Table: `ab_test_results`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `test_id` | `int(11)` | NO | `NULL` | MUL |  |
| `variant_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` |  |  |
| `sent_at` | `datetime` | YES | `NULL` |  |  |
| `opened_at` | `datetime` | YES | `NULL` |  |  |
| `clicked_at` | `datetime` | YES | `NULL` |  |  |
| `replied_at` | `datetime` | YES | `NULL` |  |  |
| `converted_at` | `datetime` | YES | `NULL` |  |  |
| `conversion_value` | `decimal(10,2)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Foreign Keys:**
- `test_id` -> `ab_tests.id` (Constraint: `ab_test_results_ibfk_1`)
- `variant_id` -> `ab_test_variants.id` (Constraint: `ab_test_results_ibfk_2`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `test_id`: `test_id`
- `INDEX` `variant_id`: `variant_id`

---
### Table: `ab_test_variants`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `test_id` | `int(11)` | NO | `NULL` | MUL |  |
| `variant_name` | `varchar(50)` | NO | `NULL` |  |  |
| `variant_label` | `varchar(100)` | YES | `NULL` |  |  |
| `content` | `longtext` | NO | `NULL` |  |  |
| `traffic_percentage` | `decimal(5,2)` | YES | `50.00` |  |  |
| `is_control` | `tinyint(1)` | YES | `0` |  |  |
| `is_winner` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Foreign Keys:**
- `test_id` -> `ab_tests.id` (Constraint: `ab_test_variants_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `test_id`: `test_id`

---
### Table: `ab_tests`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `client_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `test_type` | `enum('email_subject','email_content','sms_content','landing_page','form')` | NO | `NULL` |  |  |
| `entity_type` | `varchar(50)` | NO | `NULL` |  |  |
| `entity_id` | `int(11)` | NO | `NULL` |  |  |
| `status` | `enum('draft','running','paused','completed','winner_selected')` | YES | `'draft'` | MUL |  |
| `winner_criteria` | `enum('open_rate','click_rate','reply_rate','conversion_rate','manual')` | YES | `'open_rate'` |  |  |
| `auto_select_winner` | `tinyint(1)` | YES | `1` |  |  |
| `min_sample_size` | `int(11)` | YES | `100` |  |  |
| `test_duration_hours` | `int(11)` | YES | `24` |  |  |
| `winner_variant_id` | `int(11)` | YES | `NULL` |  |  |
| `started_at` | `datetime` | YES | `NULL` |  |  |
| `ended_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `ab_tests_ibfk_1`)

**Indexes:**
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `abandoned_carts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `store_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `external_id` | `varchar(100)` | YES | `NULL` |  |  |
| `email` | `varchar(255)` | YES | `NULL` |  |  |
| `phone` | `varchar(50)` | YES | `NULL` |  |  |
| `items` | `longtext` | YES | `NULL` |  |  |
| `subtotal` | `decimal(10,2)` | YES | `NULL` |  |  |
| `total` | `decimal(10,2)` | YES | `NULL` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `checkout_url` | `varchar(500)` | YES | `NULL` |  |  |
| `recovery_status` | `enum('pending','email_sent','sms_sent','recovered','expired')` | YES | `'pending'` |  |  |
| `recovery_emails_sent` | `int(11)` | YES | `0` |  |  |
| `recovery_sms_sent` | `int(11)` | YES | `0` |  |  |
| `recovered_at` | `datetime` | YES | `NULL` |  |  |
| `abandoned_at` | `datetime` | YES | `NULL` |  |  |
| `expires_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Foreign Keys:**
- `store_id` -> `ecommerce_stores.id` (Constraint: `abandoned_carts_ibfk_1`)
- `contact_id` -> `contacts.id` (Constraint: `abandoned_carts_ibfk_2`)

**Indexes:**
- `INDEX` `contact_id`: `contact_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `store_id`: `store_id`

---
### Table: `activities`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `user_id` | `int(11)` | YES | `NULL` |  |  |
| `user_name` | `varchar(100)` | YES | `NULL` |  |  |
| `entity_type` | `varchar(50)` | NO | `NULL` |  |  |
| `entity_id` | `int(11)` | NO | `NULL` |  |  |
| `related_entity_type` | `varchar(50)` | YES | `NULL` |  |  |
| `related_entity_id` | `int(11)` | YES | `NULL` |  |  |
| `activity_type` | `varchar(50)` | NO | `NULL` |  |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `changes` | `longtext` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `is_system` | `tinyint(1)` | YES | `0` |  |  |
| `is_pinned` | `tinyint(1)` | YES | `0` |  |  |
| `is_internal` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_activities_entity`: `workspace_id`, `entity_type`, `entity_id`, `created_at`
- `INDEX` `idx_activities_type`: `workspace_id`, `activity_type`, `created_at`
- `INDEX` `idx_activities_user`: `workspace_id`, `user_id`, `created_at`
- `INDEX` `idx_activities_workspace`: `workspace_id`, `created_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `activity_comments`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `activity_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `user_name` | `varchar(100)` | YES | `NULL` |  |  |
| `body` | `text` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `activity_id` -> `activities.id` (Constraint: `activity_comments_ibfk_1`)

**Indexes:**
- `INDEX` `idx_activity_comments`: `activity_id`, `created_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ad_ab_tests`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `campaign_id` | `int(11)` | YES | `NULL` |  |  |
| `variant_a_name` | `varchar(100)` | YES | `'Variant A'` |  |  |
| `variant_b_name` | `varchar(100)` | YES | `'Variant B'` |  |  |
| `variant_a_budget` | `decimal(12,2)` | YES | `NULL` |  |  |
| `variant_b_budget` | `decimal(12,2)` | YES | `NULL` |  |  |
| `test_duration_days` | `int(11)` | YES | `14` |  |  |
| `metric` | `enum('ctr','conversions','cpa','roas')` | YES | `'conversions'` |  |  |
| `status` | `enum('active','completed','paused')` | YES | `'active'` |  |  |
| `winner` | `varchar(100)` | YES | `NULL` |  |  |
| `started_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `ended_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `workspace_id`: `workspace_id`, `company_id`

---
### Table: `ad_accounts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `platform` | `enum('google_ads','facebook_ads','microsoft_ads','linkedin_ads','tiktok_ads')` | NO | `NULL` |  |  |
| `platform_account_id` | `varchar(255)` | NO | `NULL` |  |  |
| `account_name` | `varchar(255)` | YES | `NULL` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `timezone` | `varchar(50)` | YES | `NULL` |  |  |
| `access_token_encrypted` | `text` | YES | `NULL` |  |  |
| `refresh_token_encrypted` | `text` | YES | `NULL` |  |  |
| `token_expires_at` | `timestamp` | YES | `NULL` |  |  |
| `status` | `enum('connected','expired','error','disconnected')` | YES | `'connected'` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `sync_campaigns` | `tinyint(1)` | YES | `1` |  |  |
| `sync_conversions` | `tinyint(1)` | YES | `1` |  |  |
| `last_sync_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_ad_accounts_company`: `workspace_id`, `company_id`, `status`
- `INDEX` `idx_ad_accounts_workspace`: `workspace_id`, `status`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_platform_account`: `workspace_id`, `platform`, `platform_account_id`

---
### Table: `ad_budgets`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `period_type` | `enum('monthly','quarterly','yearly')` | YES | `'monthly'` |  |  |
| `period_start` | `date` | NO | `NULL` |  |  |
| `period_end` | `date` | NO | `NULL` |  |  |
| `total_budget` | `decimal(12,2)` | NO | `NULL` |  |  |
| `spent` | `decimal(12,2)` | YES | `0.00` |  |  |
| `remaining` | `decimal(12,2)` | YES | `NULL` |  | STORED GENERATED |
| `google_ads_budget` | `decimal(12,2)` | YES | `NULL` |  |  |
| `facebook_ads_budget` | `decimal(12,2)` | YES | `NULL` |  |  |
| `other_budget` | `decimal(12,2)` | YES | `NULL` |  |  |
| `alert_threshold` | `int(11)` | YES | `80` |  |  |
| `alert_sent` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_ad_budgets_company`: `workspace_id`, `company_id`
- `INDEX` `idx_budgets_workspace`: `workspace_id`, `period_start`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ad_campaign_metrics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `campaign_id` | `int(11)` | NO | `NULL` | MUL |  |
| `metric_date` | `date` | NO | `NULL` | MUL |  |
| `spend` | `decimal(12,2)` | YES | `0.00` |  |  |
| `impressions` | `int(11)` | YES | `0` |  |  |
| `clicks` | `int(11)` | YES | `0` |  |  |
| `ctr` | `decimal(5,2)` | YES | `NULL` |  |  |
| `conversions` | `int(11)` | YES | `0` |  |  |
| `conversion_value` | `decimal(12,2)` | YES | `0.00` |  |  |
| `cost_per_conversion` | `decimal(12,2)` | YES | `NULL` |  |  |
| `reach` | `int(11)` | YES | `NULL` |  |  |
| `frequency` | `decimal(5,2)` | YES | `NULL` |  |  |
| `engagement` | `int(11)` | YES | `NULL` |  |  |
| `video_views` | `int(11)` | YES | `NULL` |  |  |
| `video_view_rate` | `decimal(5,2)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `campaign_id` -> `ad_campaigns.id` (Constraint: `ad_campaign_metrics_ibfk_1`)

**Indexes:**
- `INDEX` `idx_metrics_date`: `metric_date`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_campaign_date`: `campaign_id`, `metric_date`

---
### Table: `ad_campaigns`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `ad_account_id` | `int(11)` | NO | `NULL` | MUL |  |
| `platform` | `varchar(50)` | YES | `NULL` |  |  |
| `platform_campaign_id` | `varchar(255)` | NO | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `status` | `enum('enabled','paused','removed','ended')` | YES | `'enabled'` |  |  |
| `campaign_type` | `varchar(50)` | YES | `NULL` |  |  |
| `daily_budget` | `decimal(12,2)` | YES | `NULL` |  |  |
| `total_budget` | `decimal(12,2)` | YES | `NULL` |  |  |
| `start_date` | `date` | YES | `NULL` |  |  |
| `end_date` | `date` | YES | `NULL` |  |  |
| `targeting_summary` | `text` | YES | `NULL` |  |  |
| `last_sync_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `ad_account_id` -> `ad_accounts.id` (Constraint: `ad_campaigns_ibfk_1`)

**Indexes:**
- `INDEX` `idx_ad_campaigns_company`: `workspace_id`, `company_id`, `status`
- `INDEX` `idx_campaigns_workspace`: `workspace_id`, `status`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_account_campaign`: `ad_account_id`, `platform_campaign_id`

---
### Table: `ad_campaigns_schedule`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `campaign_id` | `int(11)` | NO | `NULL` | MUL |  |
| `day_of_week` | `tinyint(4)` | NO | `NULL` |  |  |
| `start_time` | `time` | NO | `NULL` |  |  |
| `end_time` | `time` | NO | `NULL` |  |  |
| `bid_modifier` | `decimal(4,2)` | YES | `1.00` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `campaign_id` -> `ad_campaigns.id` (Constraint: `ad_campaigns_schedule_ibfk_1`)

**Indexes:**
- `INDEX` `idx_schedule_campaign`: `campaign_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ad_campaigns_targeting`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `campaign_id` | `int(11)` | NO | `NULL` | MUL |  |
| `targeting_type` | `enum('location','demographic','interest','keyword','audience','device','placement')` | NO | `NULL` |  |  |
| `operator` | `enum('include','exclude')` | YES | `'include'` |  |  |
| `value` | `longtext` | NO | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `campaign_id` -> `ad_campaigns.id` (Constraint: `ad_campaigns_targeting_ibfk_1`)

**Indexes:**
- `INDEX` `idx_targeting_campaign`: `campaign_id`, `targeting_type`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ad_conversions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `ad_account_id` | `int(11)` | YES | `NULL` |  |  |
| `campaign_id` | `int(11)` | YES | `NULL` | MUL |  |
| `conversion_name` | `varchar(255)` | NO | `NULL` |  |  |
| `conversion_type` | `varchar(50)` | YES | `NULL` |  |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `click_id` | `varchar(255)` | YES | `NULL` |  |  |
| `conversion_value` | `decimal(12,2)` | YES | `NULL` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `source` | `varchar(50)` | YES | `NULL` |  |  |
| `medium` | `varchar(50)` | YES | `NULL` |  |  |
| `campaign` | `varchar(255)` | YES | `NULL` |  |  |
| `converted_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_ad_conversions_company`: `workspace_id`, `company_id`
- `INDEX` `idx_conversions_campaign`: `campaign_id`
- `INDEX` `idx_conversions_contact`: `contact_id`
- `INDEX` `idx_conversions_workspace`: `workspace_id`, `converted_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ad_creatives`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `campaign_id` | `int(11)` | YES | `NULL` | MUL |  |
| `ad_group_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `creative_type` | `enum('image','video','text','carousel','responsive','html5')` | YES | `'image'` |  |  |
| `status` | `enum('draft','pending','approved','rejected','active','paused')` | YES | `'draft'` |  |  |
| `headline` | `varchar(255)` | YES | `NULL` |  |  |
| `headline_2` | `varchar(255)` | YES | `NULL` |  |  |
| `headline_3` | `varchar(255)` | YES | `NULL` |  |  |
| `description` | `varchar(500)` | YES | `NULL` |  |  |
| `description_2` | `varchar(500)` | YES | `NULL` |  |  |
| `display_url` | `varchar(255)` | YES | `NULL` |  |  |
| `final_url` | `varchar(500)` | YES | `NULL` |  |  |
| `image_url` | `varchar(500)` | YES | `NULL` |  |  |
| `video_url` | `varchar(500)` | YES | `NULL` |  |  |
| `thumbnail_url` | `varchar(500)` | YES | `NULL` |  |  |
| `cta_text` | `varchar(50)` | YES | `NULL` |  |  |
| `cta_url` | `varchar(500)` | YES | `NULL` |  |  |
| `tracking_template` | `varchar(1000)` | YES | `NULL` |  |  |
| `utm_params` | `longtext` | YES | `NULL` |  |  |
| `impressions` | `int(11)` | YES | `0` |  |  |
| `clicks` | `int(11)` | YES | `0` |  |  |
| `conversions` | `int(11)` | YES | `0` |  |  |
| `spend` | `decimal(10,2)` | YES | `0.00` |  |  |
| `review_status` | `enum('pending','approved','rejected')` | YES | `'pending'` |  |  |
| `rejection_reason` | `text` | YES | `NULL` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `campaign_id` -> `ad_campaigns.id` (Constraint: `ad_creatives_ibfk_1`)

**Indexes:**
- `INDEX` `idx_creatives_campaign`: `campaign_id`
- `INDEX` `idx_creatives_workspace`: `workspace_id`, `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ad_integrations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `platform` | `enum('google_ads','facebook','instagram','linkedin','twitter','tiktok','microsoft')` | NO | `NULL` |  |  |
| `account_id` | `varchar(255)` | YES | `NULL` |  |  |
| `account_name` | `varchar(255)` | YES | `NULL` |  |  |
| `status` | `enum('disconnected','pending','connected','error')` | YES | `'disconnected'` |  |  |
| `access_token` | `text` | YES | `NULL` |  |  |
| `refresh_token` | `text` | YES | `NULL` |  |  |
| `token_expires_at` | `timestamp` | YES | `NULL` |  |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `last_sync_at` | `timestamp` | YES | `NULL` |  |  |
| `sync_error` | `text` | YES | `NULL` |  |  |
| `connected_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_ad_integrations_status`: `workspace_id`, `status`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_ad_integration`: `workspace_id`, `platform`

---
### Table: `ad_performance_metrics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `campaign_id` | `int(11)` | NO | `NULL` | MUL |  |
| `date` | `date` | NO | `NULL` |  |  |
| `impressions` | `int(11)` | YES | `0` |  |  |
| `clicks` | `int(11)` | YES | `0` |  |  |
| `spent` | `decimal(10,2)` | YES | `0.00` |  |  |
| `conversions` | `int(11)` | YES | `0` |  |  |
| `conversion_value` | `decimal(10,2)` | YES | `0.00` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `campaign_id` -> `ad_campaigns.id` (Constraint: `ad_performance_metrics_ibfk_1`)

**Indexes:**
- `INDEX` `campaign_id`: `campaign_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ad_tracking_numbers`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `tracking_number` | `varchar(20)` | NO | `NULL` | UNI |  |
| `forward_to` | `varchar(20)` | NO | `NULL` |  |  |
| `source` | `varchar(50)` | YES | `NULL` |  |  |
| `campaign_id` | `int(11)` | YES | `NULL` |  |  |
| `total_calls` | `int(11)` | YES | `0` |  |  |
| `total_duration_seconds` | `int(11)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_ad_tracking_numbers_company`: `workspace_id`, `company_id`
- `INDEX` `idx_tracking_workspace`: `workspace_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_tracking_number`: `tracking_number`

---
### Table: `affiliate_clicks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `affiliate_id` | `int(11)` | NO | `NULL` | MUL |  |
| `referral_url` | `varchar(500)` | YES | `NULL` |  |  |
| `landing_page` | `varchar(500)` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `utm_source` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_medium` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_campaign` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_content` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_term` | `varchar(255)` | YES | `NULL` |  |  |
| `cookie_set` | `tinyint(1)` | YES | `0` |  |  |
| `cookie_expires_at` | `timestamp` | YES | `NULL` |  |  |
| `converted` | `tinyint(1)` | YES | `0` | MUL |  |
| `referral_id` | `int(11)` | YES | `NULL` |  |  |
| `clicked_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `affiliate_clicks_ibfk_1`)
- `affiliate_id` -> `affiliates.id` (Constraint: `affiliate_clicks_ibfk_2`)

**Indexes:**
- `INDEX` `idx_affiliate`: `affiliate_id`
- `INDEX` `idx_clicked_at`: `clicked_at`
- `INDEX` `idx_converted`: `converted`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `affiliate_links`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `affiliate_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `code` | `varchar(50)` | NO | `NULL` |  |  |
| `destination_url` | `varchar(500)` | NO | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `expires_at` | `timestamp` | YES | `NULL` |  |  |
| `clicks` | `int(11)` | YES | `0` |  |  |
| `unique_clicks` | `int(11)` | YES | `0` |  |  |
| `conversions` | `int(11)` | YES | `0` |  |  |
| `revenue_generated` | `decimal(10,2)` | YES | `0.00` |  |  |
| `last_clicked_at` | `timestamp` | YES | `NULL` |  |  |
| `last_converted_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `affiliate_id` -> `affiliates.id` (Constraint: `affiliate_links_ibfk_1`)

**Indexes:**
- `INDEX` `idx_affiliate_links_affiliate`: `affiliate_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_affiliate_link_code`: `workspace_id`, `code`

---
### Table: `affiliate_payouts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `affiliate_id` | `int(11)` | NO | `NULL` | MUL |  |
| `amount` | `decimal(10,2)` | NO | `NULL` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `payment_method` | `varchar(50)` | YES | `NULL` |  |  |
| `payment_reference` | `varchar(255)` | YES | `NULL` |  |  |
| `status` | `enum('pending','processing','completed','failed','cancelled')` | YES | `'pending'` | MUL |  |
| `period_start` | `date` | YES | `NULL` |  |  |
| `period_end` | `date` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `processed_by` | `int(11)` | YES | `NULL` |  |  |
| `processed_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `affiliate_payouts_ibfk_1`)
- `affiliate_id` -> `affiliates.id` (Constraint: `affiliate_payouts_ibfk_2`)

**Indexes:**
- `INDEX` `idx_affiliate`: `affiliate_id`
- `INDEX` `idx_created`: `created_at`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `affiliate_referrals`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `affiliate_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `customer_email` | `varchar(255)` | YES | `NULL` |  |  |
| `customer_name` | `varchar(255)` | YES | `NULL` |  |  |
| `status` | `enum('pending','converted','cancelled','rejected')` | YES | `'pending'` | MUL |  |
| `conversion_type` | `varchar(50)` | YES | `NULL` |  |  |
| `conversion_value` | `decimal(10,2)` | YES | `0.00` |  |  |
| `commission_amount` | `decimal(10,2)` | YES | `0.00` |  |  |
| `referral_source` | `varchar(255)` | YES | `NULL` |  |  |
| `landing_page` | `varchar(500)` | YES | `NULL` |  |  |
| `utm_source` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_medium` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_campaign` | `varchar(255)` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `referred_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `converted_at` | `timestamp` | YES | `NULL` |  |  |
| `payout_id` | `int(11)` | YES | `NULL` |  |  |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `affiliate_referrals_ibfk_1`)
- `affiliate_id` -> `affiliates.id` (Constraint: `affiliate_referrals_ibfk_2`)
- `contact_id` -> `contacts.id` (Constraint: `affiliate_referrals_ibfk_3`)

**Indexes:**
- `INDEX` `idx_affiliate`: `affiliate_id`
- `INDEX` `idx_contact`: `contact_id`
- `INDEX` `idx_referred_at`: `referred_at`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `affiliate_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `workspace_id` | `int(11)` | NO | `NULL` | PRI |  |
| `default_commission_rate` | `decimal(5,2)` | YES | `20.00` |  |  |
| `cookie_duration_days` | `int(11)` | YES | `30` |  |  |
| `min_payout_amount` | `decimal(10,2)` | YES | `50.00` |  |  |
| `payout_methods` | `longtext` | YES | `NULL` |  |  |
| `allow_self_referral` | `tinyint(1)` | YES | `0` |  |  |
| `auto_approve_affiliates` | `tinyint(1)` | YES | `0` |  |  |
| `terms_and_conditions` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `affiliate_settings_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `workspace_id`

---
### Table: `affiliates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `email` | `varchar(255)` | NO | `NULL` | MUL |  |
| `status` | `enum('active','pending','inactive','suspended')` | YES | `'pending'` | MUL |  |
| `commission_rate` | `decimal(5,2)` | YES | `20.00` |  |  |
| `unique_code` | `varchar(50)` | NO | `NULL` | UNI |  |
| `referral_url` | `varchar(500)` | YES | `NULL` |  |  |
| `total_referrals` | `int(11)` | YES | `0` |  |  |
| `total_earnings` | `decimal(10,2)` | YES | `0.00` |  |  |
| `unpaid_balance` | `decimal(10,2)` | YES | `0.00` |  |  |
| `phone` | `varchar(50)` | YES | `NULL` |  |  |
| `company_name` | `varchar(255)` | YES | `NULL` |  |  |
| `payment_method` | `varchar(50)` | YES | `NULL` |  |  |
| `payment_email` | `varchar(255)` | YES | `NULL` |  |  |
| `cookie_duration_days` | `int(11)` | YES | `30` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `welcome_message` | `text` | YES | `NULL` |  |  |
| `invited_by` | `int(11)` | YES | `NULL` |  |  |
| `approved_by` | `int(11)` | YES | `NULL` |  |  |
| `approved_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `affiliates_ibfk_1`)

**Indexes:**
- `INDEX` `idx_code`: `unique_code`
- `INDEX` `idx_email`: `email`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_code`: `unique_code`

---
### Table: `agencies`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `slug` | `varchar(100)` | NO | `NULL` | UNI |  |
| `owner_user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `subscription_plan_id` | `int(11)` | YES | `NULL` |  |  |
| `trial_ends_at` | `datetime` | YES | `NULL` |  |  |
| `status` | `enum('trial','active','suspended','canceled')` | YES | `'trial'` | MUL |  |
| `organization_type` | `enum('marketing_agency','franchise','retail','healthcare','single_business','other')` | NO | `'marketing_agency'` |  |  |
| `custom_subaccount_label` | `varchar(50)` | YES | `NULL` |  |  |
| `max_subaccounts` | `int(11)` | YES | `5` |  |  |
| `max_users` | `int(11)` | YES | `10` |  |  |
| `max_contacts_per_subaccount` | `int(11)` | YES | `10000` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_agencies_owner`: `owner_user_id`
- `INDEX` `idx_agencies_status`: `status`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_agencies_slug`: `slug`

---
### Table: `agency_branding`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `agency_id` | `int(11)` | NO | `NULL` | UNI |  |
| `logo_url` | `varchar(512)` | YES | `NULL` |  |  |
| `favicon_url` | `varchar(512)` | YES | `NULL` |  |  |
| `primary_color` | `varchar(7)` | YES | `'#3B82F6'` |  |  |
| `secondary_color` | `varchar(7)` | YES | `'#1E40AF'` |  |  |
| `accent_color` | `varchar(7)` | YES | `'#10B981'` |  |  |
| `company_name` | `varchar(255)` | YES | `NULL` |  |  |
| `support_email` | `varchar(255)` | YES | `NULL` |  |  |
| `support_phone` | `varchar(50)` | YES | `NULL` |  |  |
| `login_page_title` | `varchar(255)` | YES | `NULL` |  |  |
| `login_page_description` | `text` | YES | `NULL` |  |  |
| `login_background_url` | `varchar(512)` | YES | `NULL` |  |  |
| `email_from_name` | `varchar(255)` | YES | `NULL` |  |  |
| `email_from_address` | `varchar(255)` | YES | `NULL` |  |  |
| `email_footer_text` | `text` | YES | `NULL` |  |  |
| `custom_css` | `text` | YES | `NULL` |  |  |
| `custom_head_scripts` | `text` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `agency_id` -> `agencies.id` (Constraint: `agency_branding_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_agency_branding`: `agency_id`

---
### Table: `agency_domains`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `agency_id` | `int(11)` | NO | `NULL` | MUL |  |
| `domain` | `varchar(255)` | NO | `NULL` | UNI |  |
| `domain_type` | `enum('primary','alias','funnel')` | YES | `'primary'` |  |  |
| `ssl_status` | `enum('pending','provisioning','active','failed')` | YES | `'pending'` |  |  |
| `ssl_expires_at` | `datetime` | YES | `NULL` |  |  |
| `ssl_certificate` | `text` | YES | `NULL` |  |  |
| `ssl_private_key` | `text` | YES | `NULL` |  |  |
| `dns_verified` | `tinyint(1)` | YES | `0` |  |  |
| `dns_verified_at` | `datetime` | YES | `NULL` |  |  |
| `dns_txt_record` | `varchar(255)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `agency_id` -> `agencies.id` (Constraint: `agency_domains_ibfk_1`)

**Indexes:**
- `INDEX` `idx_agency_domains_agency`: `agency_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_agency_domain`: `domain`

---
### Table: `agency_members`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `agency_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `role` | `enum('owner','admin','member')` | NO | `'member'` |  |  |
| `status` | `enum('invited','active','suspended')` | YES | `'invited'` | MUL |  |
| `invited_by` | `int(11)` | YES | `NULL` |  |  |
| `invited_at` | `datetime` | YES | `NULL` |  |  |
| `joined_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `agency_id` -> `agencies.id` (Constraint: `agency_members_ibfk_1`)

**Indexes:**
- `INDEX` `idx_agency_members_status`: `status`
- `INDEX` `idx_agency_members_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_agency_member`: `agency_id`, `user_id`

---
### Table: `agency_reports`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `agency_user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `report_type` | `enum('overview','campaigns','contacts','revenue','custom')` | YES | `'overview'` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `filters` | `longtext` | YES | `NULL` |  |  |
| `columns` | `longtext` | YES | `NULL` |  |  |
| `schedule` | `enum('none','daily','weekly','monthly')` | YES | `'none'` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Foreign Keys:**
- `agency_user_id` -> `users.id` (Constraint: `agency_reports_ibfk_1`)

**Indexes:**
- `INDEX` `agency_user_id`: `agency_user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `agency_reseller_pricing`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `agency_id` | `int(11)` | NO | `NULL` | MUL |  |
| `feature_key` | `varchar(100)` | NO | `NULL` |  |  |
| `cost_price` | `decimal(10,4)` | NO | `0.0000` |  |  |
| `resell_price` | `decimal(10,4)` | NO | `0.0000` |  |  |
| `is_enabled` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `agency_id` -> `agencies.id` (Constraint: `agency_reseller_pricing_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_agency_feature`: `agency_id`, `feature_key`

---
### Table: `agency_subscription_plans`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `slug` | `varchar(50)` | NO | `NULL` | UNI |  |
| `description` | `text` | YES | `NULL` |  |  |
| `price_monthly` | `decimal(10,2)` | NO | `0.00` |  |  |
| `price_yearly` | `decimal(10,2)` | YES | `NULL` |  |  |
| `max_subaccounts` | `int(11)` | YES | `10` |  |  |
| `max_users` | `int(11)` | YES | `25` |  |  |
| `max_contacts` | `int(11)` | YES | `50000` |  |  |
| `max_emails_per_month` | `int(11)` | YES | `100000` |  |  |
| `max_sms_per_month` | `int(11)` | YES | `10000` |  |  |
| `features` | `longtext` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `is_public` | `tinyint(1)` | YES | `1` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_plan_slug`: `slug`

---
### Table: `agency_subscriptions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `agency_id` | `int(11)` | NO | `NULL` | MUL |  |
| `stripe_customer_id` | `varchar(100)` | YES | `NULL` | MUL |  |
| `stripe_subscription_id` | `varchar(100)` | YES | `NULL` |  |  |
| `stripe_price_id` | `varchar(100)` | YES | `NULL` |  |  |
| `plan_id` | `int(11)` | YES | `NULL` |  |  |
| `plan_name` | `varchar(100)` | NO | `NULL` |  |  |
| `status` | `enum('trialing','active','past_due','canceled','unpaid','incomplete')` | YES | `'trialing'` | MUL |  |
| `billing_cycle` | `enum('monthly','yearly')` | YES | `'monthly'` |  |  |
| `current_period_start` | `datetime` | YES | `NULL` |  |  |
| `current_period_end` | `datetime` | YES | `NULL` |  |  |
| `trial_ends_at` | `datetime` | YES | `NULL` |  |  |
| `canceled_at` | `datetime` | YES | `NULL` |  |  |
| `base_price_cents` | `int(11)` | YES | `0` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `max_subaccounts` | `int(11)` | YES | `5` |  |  |
| `max_team_members` | `int(11)` | YES | `10` |  |  |
| `max_contacts` | `int(11)` | YES | `10000` |  |  |
| `max_emails_per_month` | `int(11)` | YES | `50000` |  |  |
| `max_sms_per_month` | `int(11)` | YES | `1000` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_sub_agency`: `agency_id`
- `INDEX` `idx_sub_status`: `status`
- `INDEX` `idx_sub_stripe_customer`: `stripe_customer_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ai_agent_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `category` | `varchar(100)` | NO | `NULL` | MUL |  |
| `author` | `varchar(255)` | YES | `NULL` |  |  |
| `type` | `enum('voice','chat','hybrid')` | YES | `'chat'` | MUL |  |
| `config` | `longtext` | YES | `NULL` |  |  |
| `prompt_template` | `text` | YES | `NULL` |  |  |
| `business_niches` | `longtext` | YES | `NULL` |  |  |
| `use_cases` | `longtext` | YES | `NULL` |  |  |
| `downloads` | `int(10) unsigned` | YES | `0` | MUL |  |
| `rating` | `decimal(2,1)` | YES | `0.0` |  |  |
| `reviews_count` | `int(10) unsigned` | YES | `0` |  |  |
| `price` | `enum('Free','Premium','Enterprise')` | YES | `'Free'` | MUL |  |
| `image_url` | `varchar(500)` | YES | `NULL` |  |  |
| `is_official` | `tinyint(1)` | YES | `0` |  |  |
| `is_verified` | `tinyint(1)` | YES | `0` |  |  |
| `is_published` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_category`: `category`
- `INDEX` `idx_downloads`: `downloads`
- `INDEX` `idx_price`: `price`
- `INDEX` `idx_type`: `type`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ai_agents`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `type` | `varchar(50)` | NO | `'chat'` |  |  |
| `config` | `longtext` | YES | `NULL` |  |  |
| `status` | `varchar(20)` | NO | `'active'` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `status`: `status`
- `INDEX` `user_id`: `user_id`

---
### Table: `ai_analytics_insights`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `insight_type` | `enum('trend','anomaly','prediction','recommendation','alert')` | NO | `NULL` | MUL |  |
| `category` | `varchar(100)` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | NO | `NULL` |  |  |
| `data` | `longtext` | YES | `NULL` |  |  |
| `confidence_score` | `decimal(3,2)` | YES | `NULL` |  |  |
| `priority` | `enum('low','medium','high','critical')` | YES | `'medium'` | MUL |  |
| `status` | `enum('new','viewed','actioned','dismissed')` | YES | `'new'` | MUL |  |
| `valid_from` | `timestamp` | NO | `current_timestamp()` |  |  |
| `valid_until` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_category`: `category`
- `INDEX` `idx_priority`: `priority`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_type`: `insight_type`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ai_call_answering`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `call_id` | `int(10) unsigned` | YES | `NULL` | MUL |  |
| `contact_id` | `int(10) unsigned` | YES | `NULL` | MUL |  |
| `phone_number` | `varchar(20)` | NO | `NULL` | MUL |  |
| `direction` | `enum('inbound','outbound')` | YES | `'inbound'` |  |  |
| `status` | `enum('answered','voicemail','transferred','failed')` | NO | `NULL` | MUL |  |
| `duration` | `int(10) unsigned` | YES | `0` |  |  |
| `transcript` | `text` | YES | `NULL` |  |  |
| `summary` | `text` | YES | `NULL` |  |  |
| `intent` | `varchar(255)` | YES | `NULL` |  |  |
| `action_taken` | `varchar(255)` | YES | `NULL` |  |  |
| `booking_created` | `tinyint(1)` | YES | `0` |  |  |
| `recording_url` | `varchar(500)` | YES | `NULL` |  |  |
| `started_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `ended_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_call`: `call_id`
- `INDEX` `idx_contact`: `contact_id`
- `INDEX` `idx_phone`: `phone_number`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ai_chatbot_conversations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `contact_id` | `int(10) unsigned` | YES | `NULL` | MUL |  |
| `session_id` | `varchar(255)` | NO | `NULL` | MUL |  |
| `channel` | `enum('website','facebook','whatsapp','sms')` | YES | `'website'` |  |  |
| `status` | `enum('active','resolved','transferred','abandoned')` | YES | `'active'` | MUL |  |
| `sentiment` | `enum('positive','neutral','negative')` | YES | `NULL` |  |  |
| `intent` | `varchar(255)` | YES | `NULL` |  |  |
| `started_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `ended_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_contact`: `contact_id`
- `INDEX` `idx_session`: `session_id`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ai_chatbot_messages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `conversation_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `role` | `enum('user','assistant','system')` | NO | `NULL` | MUL |  |
| `content` | `text` | NO | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `confidence_score` | `decimal(3,2)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_conversation`: `conversation_id`
- `INDEX` `idx_role`: `role`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ai_content_generations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | YES | `NULL` | MUL |  |
| `content_type` | `enum('email','sms','social','blog','ad_copy','subject_line')` | NO | `NULL` | MUL |  |
| `prompt` | `text` | NO | `NULL` |  |  |
| `generated_content` | `text` | NO | `NULL` |  |  |
| `model` | `varchar(50)` | YES | `'gpt-4'` |  |  |
| `tokens_used` | `int(11)` | YES | `0` |  |  |
| `quality_rating` | `int(11)` | YES | `NULL` |  |  |
| `was_used` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_ai_content_workspace_type`: `workspace_id`, `content_type`, `created_at`
- `INDEX` `idx_created`: `created_at`
- `INDEX` `idx_type`: `content_type`
- `INDEX` `idx_user`: `user_id`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ai_content_history`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `user_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `channel` | `varchar(50)` | NO | `NULL` | MUL |  |
| `action` | `varchar(50)` | NO | `NULL` |  |  |
| `prompt` | `text` | YES | `NULL` |  |  |
| `output` | `text` | NO | `NULL` |  |  |
| `provider` | `varchar(50)` | NO | `NULL` |  |  |
| `model` | `varchar(100)` | NO | `NULL` |  |  |
| `tokens_used` | `int(10) unsigned` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_channel`: `channel`
- `INDEX` `idx_created`: `created_at`
- `INDEX` `idx_user`: `user_id`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ai_conversation_bookings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `conversation_id` | `int(10) unsigned` | YES | `NULL` | MUL |  |
| `contact_id` | `int(10) unsigned` | YES | `NULL` | MUL |  |
| `appointment_id` | `int(10) unsigned` | YES | `NULL` | MUL |  |
| `channel` | `enum('sms','chat','facebook','whatsapp')` | NO | `NULL` |  |  |
| `status` | `enum('initiated','confirmed','cancelled','rescheduled')` | YES | `'initiated'` | MUL |  |
| `service_type` | `varchar(255)` | YES | `NULL` |  |  |
| `preferred_date` | `date` | YES | `NULL` |  |  |
| `preferred_time` | `time` | YES | `NULL` |  |  |
| `confirmed_date` | `date` | YES | `NULL` |  |  |
| `confirmed_time` | `time` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_appointment`: `appointment_id`
- `INDEX` `idx_contact`: `contact_id`
- `INDEX` `idx_conversation`: `conversation_id`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ai_knowledge_bases`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `type` | `enum('Documents','URLs','Text','Mixed')` | YES | `'Documents'` |  |  |
| `status` | `enum('active','inactive','processing')` | YES | `'active'` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ai_knowledge_sources`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `knowledge_base_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `source_type` | `enum('document','url','text')` | NO | `NULL` | MUL |  |
| `source_name` | `varchar(255)` | NO | `NULL` |  |  |
| `source_url` | `varchar(2048)` | YES | `NULL` |  |  |
| `content` | `longtext` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `file_size` | `int(10) unsigned` | YES | `NULL` |  |  |
| `file_type` | `varchar(50)` | YES | `NULL` |  |  |
| `status` | `enum('processing','indexed','failed')` | YES | `'processing'` | MUL |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `chunks_count` | `int(10) unsigned` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_knowledge_base`: `knowledge_base_id`
- `INDEX` `idx_source_type`: `source_type`
- `INDEX` `idx_status`: `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ai_recommendations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `recommendation_type` | `enum('campaign','content','timing','audience','product')` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | NO | `NULL` |  |  |
| `confidence_score` | `decimal(3,2)` | NO | `NULL` |  |  |
| `data` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('pending','accepted','rejected','implemented')` | YES | `'pending'` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_type`: `recommendation_type`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ai_sentiment_analysis`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `entity_type` | `enum('review','email','sms','chat','social')` | NO | `NULL` | MUL |  |
| `entity_id` | `int(11)` | NO | `NULL` |  |  |
| `content` | `text` | NO | `NULL` |  |  |
| `sentiment` | `enum('positive','neutral','negative')` | NO | `NULL` | MUL |  |
| `sentiment_score` | `decimal(3,2)` | NO | `NULL` |  |  |
| `emotions` | `longtext` | YES | `NULL` |  |  |
| `keywords` | `longtext` | YES | `NULL` |  |  |
| `analyzed_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_entity`: `entity_type`, `entity_id`
- `INDEX` `idx_sentiment`: `sentiment`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ai_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(10) unsigned` | NO | `NULL` | UNI |  |
| `chatbot_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `chatbot_name` | `varchar(100)` | YES | `'AI Assistant'` |  |  |
| `chatbot_greeting` | `text` | YES | `NULL` |  |  |
| `chatbot_model` | `varchar(50)` | YES | `'gpt-4'` |  |  |
| `call_answering_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `call_answering_hours` | `longtext` | YES | `NULL` |  |  |
| `conversation_booking_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `analytics_insights_enabled` | `tinyint(1)` | YES | `1` |  |  |
| `facebook_messenger_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `auto_response_delay` | `int(11)` | YES | `2` |  |  |
| `escalation_keywords` | `longtext` | YES | `NULL` |  |  |
| `business_context` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_workspace`: `workspace_id`

---
### Table: `ai_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `category` | `varchar(100)` | YES | `NULL` | MUL |  |
| `author` | `varchar(100)` | YES | `NULL` |  |  |
| `type` | `varchar(50)` | YES | `'chat'` | MUL |  |
| `business_niches` | `longtext` | YES | `NULL` |  |  |
| `use_cases` | `longtext` | YES | `NULL` |  |  |
| `downloads` | `int(11)` | YES | `0` |  |  |
| `rating` | `decimal(3,2)` | YES | `0.00` |  |  |
| `reviews_count` | `int(11)` | YES | `0` |  |  |
| `price` | `varchar(50)` | YES | `'Free'` |  |  |
| `image_url` | `varchar(255)` | YES | `NULL` |  |  |
| `is_official` | `tinyint(1)` | YES | `0` | MUL |  |
| `is_verified` | `tinyint(1)` | YES | `0` |  |  |
| `config` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `category`: `category`
- `INDEX` `is_official`: `is_official`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `type`: `type`

---
### Table: `analytics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `event_type` | `varchar(100)` | NO | `'email_sent'` |  |  |
| `event_data` | `longtext` | YES | `NULL` |  |  |
| `campaign_id` | `int(11)` | NO | `NULL` | MUL |  |
| `sequence_id` | `int(11)` | YES | `NULL` | MUL |  |
| `metric_type` | `varchar(50)` | NO | `NULL` | MUL |  |
| `metric_value` | `int(11)` | NO | `0` |  |  |
| `date_recorded` | `date` | NO | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Indexes:**
- `INDEX` `idx_analytics_campaign_id`: `campaign_id`
- `INDEX` `idx_analytics_date`: `date_recorded`
- `INDEX` `idx_analytics_metric_type`: `metric_type`
- `INDEX` `idx_analytics_sequence_id`: `sequence_id`
- `INDEX` `idx_analytics_user_date`: `user_id`, `date_recorded`
- `INDEX` `idx_analytics_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`

---
### Table: `analytics_events`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `event_type` | `varchar(100)` | NO | `NULL` | MUL |  |
| `event_name` | `varchar(255)` | NO | `NULL` | MUL |  |
| `properties` | `longtext` | YES | `NULL` |  |  |
| `user_id` | `int(11)` | YES | `NULL` |  |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `session_id` | `varchar(64)` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_analytics_events_workspace_date`: `workspace_id`, `created_at`
- `INDEX` `idx_contact`: `contact_id`
- `INDEX` `idx_created`: `created_at`
- `INDEX` `idx_event_name`: `event_name`
- `INDEX` `idx_event_type`: `event_type`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `api_keys`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `key_hash` | `varchar(255)` | NO | `NULL` | UNI |  |
| `key_prefix` | `varchar(10)` | NO | `NULL` | MUL |  |
| `permissions` | `longtext` | YES | `NULL` |  |  |
| `scopes` | `longtext` | YES | `NULL` |  |  |
| `rate_limit` | `int(11)` | YES | `1000` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` | MUL |  |
| `last_used_at` | `timestamp` | YES | `NULL` |  |  |
| `expires_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_api_keys_active`: `is_active`
- `INDEX` `idx_api_keys_prefix`: `key_prefix`
- `INDEX` `idx_api_keys_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_key_hash`: `key_hash`

---
### Table: `application_stage_history`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `application_id` | `int(11)` | NO | `NULL` | MUL |  |
| `stage` | `varchar(50)` | NO | `NULL` |  |  |
| `changed_by` | `int(11)` | YES | `NULL` | MUL |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `application_id` -> `job_applications.id` (Constraint: `application_stage_history_ibfk_1`)
- `changed_by` -> `users.id` (Constraint: `application_stage_history_ibfk_2`)

**Indexes:**
- `INDEX` `changed_by`: `changed_by`
- `INDEX` `idx_application`: `application_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `appointment_analytics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `date` | `date` | NO | `NULL` | MUL |  |
| `booking_type_id` | `int(11)` | YES | `NULL` | MUL |  |
| `staff_id` | `int(11)` | YES | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `total_bookings` | `int(11)` | YES | `0` |  |  |
| `completed_bookings` | `int(11)` | YES | `0` |  |  |
| `cancelled_bookings` | `int(11)` | YES | `0` |  |  |
| `no_show_bookings` | `int(11)` | YES | `0` |  |  |
| `rescheduled_bookings` | `int(11)` | YES | `0` |  |  |
| `total_revenue` | `decimal(10,2)` | YES | `0.00` |  |  |
| `average_booking_value` | `decimal(10,2)` | YES | `0.00` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_booking_type`: `booking_type_id`
- `INDEX` `idx_date`: `date`
- `INDEX` `idx_staff`: `staff_id`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_daily_stats`: `date`, `booking_type_id`, `staff_id`, `workspace_id`

---
### Table: `appointment_automation_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `appointment_id` | `int(11)` | NO | `NULL` | MUL |  |
| `trigger_event` | `enum('booked','cancelled','rescheduled','no_show','completed','reminder')` | NO | `NULL` | MUL |  |
| `automation_id` | `int(11)` | YES | `NULL` |  |  |
| `workflow_id` | `int(11)` | YES | `NULL` |  |  |
| `action_taken` | `varchar(255)` | NO | `NULL` |  |  |
| `success` | `tinyint(1)` | YES | `1` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Foreign Keys:**
- `appointment_id` -> `appointments.id` (Constraint: `appointment_automation_logs_ibfk_1`)

**Indexes:**
- `INDEX` `idx_appointment`: `appointment_id`
- `INDEX` `idx_created`: `created_at`
- `INDEX` `idx_trigger`: `trigger_event`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `appointment_feedback`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `appointment_id` | `int(11)` | NO | `NULL` | UNI |  |
| `rating` | `int(11)` | YES | `NULL` |  |  |
| `feedback_text` | `text` | YES | `NULL` |  |  |
| `would_recommend` | `tinyint(1)` | YES | `NULL` |  |  |
| `submitted_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `appointment_id` -> `appointments.id` (Constraint: `appointment_feedback_ibfk_1`)

**Indexes:**
- `UNIQUE` `appointment_id`: `appointment_id`
- `INDEX` `idx_feedback_appointment`: `appointment_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `appointment_notifications`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `appointment_id` | `int(11)` | NO | `NULL` | MUL |  |
| `notification_type` | `enum('confirmation','reminder','cancellation','reschedule','follow_up')` | NO | `NULL` | MUL |  |
| `channel` | `enum('email','sms','both')` | NO | `NULL` |  |  |
| `sent_at` | `datetime` | NO | `NULL` |  |  |
| `status` | `enum('sent','delivered','failed','bounced')` | YES | `'sent'` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `appointment_id` -> `appointments.id` (Constraint: `appointment_notifications_ibfk_1`)

**Indexes:**
- `INDEX` `idx_notification_appointment`: `appointment_id`
- `INDEX` `idx_notification_type`: `notification_type`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `appointment_reminder_queue`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `appointment_id` | `int(11)` | NO | `NULL` | MUL |  |
| `reminder_id` | `int(11)` | NO | `NULL` | MUL |  |
| `scheduled_for` | `datetime` | NO | `NULL` | MUL |  |
| `sent_at` | `datetime` | YES | `NULL` |  |  |
| `status` | `enum('pending','sent','failed','cancelled')` | NO | `'pending'` | MUL |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `appointment_id`: `appointment_id`
- `INDEX` `idx_reminder_queue_scheduled`: `scheduled_for`
- `INDEX` `idx_reminder_queue_status`: `status`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `reminder_id`: `reminder_id`

---
### Table: `appointment_reminders`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `booking_type_id` | `int(11)` | YES | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `reminder_type` | `enum('email','sms','both')` | NO | `'email'` |  |  |
| `time_before_minutes` | `int(11)` | NO | `60` |  |  |
| `is_active` | `tinyint(1)` | NO | `1` |  |  |
| `email_template_id` | `int(11)` | YES | `NULL` |  |  |
| `sms_template_id` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_reminders_booking_type`: `booking_type_id`
- `INDEX` `idx_reminders_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `appointment_staff`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `appointment_id` | `int(11)` | NO | `NULL` | MUL |  |
| `staff_id` | `int(11)` | NO | `NULL` |  |  |
| `role` | `varchar(50)` | YES | `'assigned'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_appt_staff`: `appointment_id`, `staff_id`

---
### Table: `appointment_waitlist`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `booking_type_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` |  |  |
| `guest_name` | `varchar(255)` | NO | `NULL` |  |  |
| `guest_email` | `varchar(255)` | NO | `NULL` |  |  |
| `guest_phone` | `varchar(50)` | YES | `NULL` |  |  |
| `preferred_dates` | `longtext` | YES | `NULL` |  |  |
| `preferred_times` | `longtext` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `status` | `enum('waiting','notified','booked','expired','cancelled')` | YES | `'waiting'` | MUL |  |
| `notified_at` | `datetime` | YES | `NULL` |  |  |
| `expires_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `appointment_waitlist_ibfk_1`)
- `booking_type_id` -> `booking_types.id` (Constraint: `appointment_waitlist_ibfk_2`)

**Indexes:**
- `INDEX` `booking_type_id`: `booking_type_id`
- `INDEX` `idx_waitlist_status`: `status`
- `INDEX` `idx_waitlist_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `appointments`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `booking_type_id` | `int(11)` | YES | `NULL` | MUL |  |
| `lead_match_id` | `int(11)` | YES | `NULL` | MUL |  |
| `lead_request_id` | `int(11)` | YES | `NULL` |  |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `staff_id` | `int(11)` | YES | `NULL` | MUL |  |
| `service_id` | `int(11)` | YES | `NULL` | MUL |  |
| `guest_name` | `varchar(255)` | YES | `NULL` |  |  |
| `guest_email` | `varchar(255)` | YES | `NULL` |  |  |
| `guest_phone` | `varchar(50)` | YES | `NULL` |  |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `scheduled_at` | `datetime` | NO | `NULL` | MUL |  |
| `duration_minutes` | `int(11)` | NO | `30` |  |  |
| `end_at` | `datetime` | NO | `NULL` |  |  |
| `timezone` | `varchar(100)` | NO | `'UTC'` |  |  |
| `location_type` | `enum('in_person','phone','video','custom')` | NO | `'video'` |  |  |
| `location_address` | `text` | YES | `NULL` |  |  |
| `video_link` | `varchar(500)` | YES | `NULL` |  |  |
| `price` | `decimal(10,2)` | YES | `NULL` |  |  |
| `location` | `varchar(500)` | YES | `NULL` |  |  |
| `meeting_link` | `varchar(500)` | YES | `NULL` |  |  |
| `status` | `enum('scheduled','confirmed','completed','cancelled','no_show','rescheduled')` | NO | `'scheduled'` | MUL |  |
| `cancellation_reason` | `text` | YES | `NULL` |  |  |
| `no_show` | `tinyint(1)` | YES | `0` |  |  |
| `cancelled_by` | `enum('host','guest')` | YES | `NULL` |  |  |
| `rescheduled_from` | `int(11)` | YES | `NULL` | MUL |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `internal_notes` | `text` | YES | `NULL` |  |  |
| `google_event_id` | `varchar(255)` | YES | `NULL` |  |  |
| `outlook_event_id` | `varchar(255)` | YES | `NULL` |  |  |
| `external_calendar_event_id` | `varchar(255)` | YES | `NULL` |  |  |
| `sync_status` | `enum('pending','synced','failed','conflict')` | YES | `'pending'` | MUL |  |
| `confirmation_sent_at` | `datetime` | YES | `NULL` |  |  |
| `reminder_sent_at` | `datetime` | YES | `NULL` |  |  |
| `payment_id` | `int(11)` | YES | `NULL` |  |  |
| `booking_source` | `enum('manual','online','phone','walk_in','api')` | YES | `'manual'` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` | MUL |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `intake_submission_id` | `int(11)` | YES | `NULL` |  |  |
| `deposit_paid` | `tinyint(1)` | YES | `0` |  |  |
| `reminder_sent` | `tinyint(1)` | YES | `0` |  |  |
| `confirmation_sent` | `tinyint(1)` | YES | `0` |  |  |
| `deposit_amount` | `decimal(10,2)` | YES | `NULL` |  |  |
| `confirmed_at` | `datetime` | YES | `NULL` |  |  |
| `checked_in_at` | `datetime` | YES | `NULL` |  |  |
| `completed_at` | `datetime` | YES | `NULL` |  |  |
| `cancelled_at` | `datetime` | YES | `NULL` |  |  |
| `reminder_24h_sent` | `tinyint(1)` | YES | `0` |  |  |
| `reminder_1h_sent` | `tinyint(1)` | YES | `0` |  |  |
| `followup_sent` | `tinyint(1)` | YES | `0` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `calendar_id` | `int(11)` | YES | `NULL` | MUL |  |
| `source` | `enum('manual','booking_page','api','import')` | YES | `'manual'` |  |  |
| `booking_page_id` | `int(11)` | YES | `NULL` | MUL |  |
| `utm_source` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_medium` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_campaign` | `varchar(255)` | YES | `NULL` |  |  |
| `referrer_url` | `varchar(500)` | YES | `NULL` |  |  |
| `custom_answers` | `longtext` | YES | `NULL` |  |  |
| `payment_status` | `enum('pending','paid','refunded','failed')` | YES | `NULL` |  |  |
| `payment_intent_id` | `varchar(255)` | YES | `NULL` |  |  |
| `payment_amount` | `decimal(10,2)` | YES | `NULL` |  |  |
| `stripe_payment_id` | `varchar(255)` | YES | `NULL` |  |  |
| `follow_up_scheduled` | `tinyint(1)` | YES | `0` |  |  |
| `follow_up_sent_at` | `datetime` | YES | `NULL` |  |  |
| `automation_triggered` | `tinyint(1)` | YES | `0` |  |  |

**Foreign Keys:**
- `booking_page_id` -> `booking_pages.id` (Constraint: `appointments_ibfk_1`)

**Indexes:**
- `INDEX` `booking_type_id`: `booking_type_id`
- `INDEX` `idx_appointments_calendar`: `calendar_id`
- `INDEX` `idx_appointments_contact`: `contact_id`
- `INDEX` `idx_appointments_created`: `created_at`
- `INDEX` `idx_appointments_lead`: `lead_match_id`
- `INDEX` `idx_appointments_reminder_status`: `status`, `scheduled_at`, `reminder_24h_sent`, `reminder_1h_sent`
- `INDEX` `idx_appointments_scheduled`: `scheduled_at`
- `INDEX` `idx_appointments_service`: `service_id`
- `INDEX` `idx_appointments_staff`: `staff_id`
- `INDEX` `idx_appointments_status`: `status`
- `INDEX` `idx_appointments_status_date`: `status`, `scheduled_at`
- `INDEX` `idx_appointments_sync_status`: `sync_status`
- `INDEX` `idx_appointments_user`: `user_id`
- `INDEX` `idx_appointments_user_date`: `user_id`, `scheduled_at`
- `INDEX` `idx_appointments_workspace`: `workspace_id`
- `INDEX` `idx_appointments_workspace_id`: `workspace_id`
- `INDEX` `idx_appt_service`: `service_id`
- `INDEX` `idx_appt_staff`: `staff_id`
- `INDEX` `idx_booking_page`: `booking_page_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `rescheduled_from`: `rescheduled_from`

---
### Table: `appointments_v2`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `booking_type_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `assigned_user_id` | `int(11)` | YES | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `start_time` | `datetime` | NO | `NULL` |  |  |
| `end_time` | `datetime` | NO | `NULL` |  |  |
| `timezone` | `varchar(50)` | YES | `'UTC'` |  |  |
| `status` | `enum('scheduled','confirmed','completed','cancelled','no_show')` | YES | `'scheduled'` |  |  |
| `location_type` | `enum('in_person','phone','video','custom')` | YES | `'video'` |  |  |
| `location_details` | `text` | YES | `NULL` |  |  |
| `meeting_url` | `varchar(500)` | YES | `NULL` |  |  |
| `guest_name` | `varchar(255)` | YES | `NULL` |  |  |
| `guest_email` | `varchar(255)` | YES | `NULL` |  |  |
| `guest_phone` | `varchar(50)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `answers` | `longtext` | YES | `NULL` |  |  |
| `cancellation_reason` | `text` | YES | `NULL` |  |  |
| `cancelled_at` | `datetime` | YES | `NULL` |  |  |
| `cancelled_by` | `enum('guest','host','system')` | YES | `NULL` |  |  |
| `reminder_sent_at` | `datetime` | YES | `NULL` |  |  |
| `confirmation_sent_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `appointments_v2_ibfk_1`)
- `booking_type_id` -> `booking_types.id` (Constraint: `appointments_v2_ibfk_2`)

**Indexes:**
- `INDEX` `idx_appointments_booking_type`: `booking_type_id`
- `INDEX` `idx_appointments_company`: `workspace_id`, `company_id`
- `INDEX` `idx_appointments_contact`: `contact_id`
- `INDEX` `idx_appointments_start`: `workspace_id`, `start_time`
- `INDEX` `idx_appointments_status`: `workspace_id`, `status`
- `INDEX` `idx_appointments_upcoming`: `workspace_id`, `status`, `start_time`
- `INDEX` `idx_appointments_user`: `assigned_user_id`
- `INDEX` `idx_appointments_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `atomic_counters`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `counter_key` | `varchar(255)` | NO | `NULL` | UNI |  |
| `value` | `bigint(20)` | NO | `0` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `counter_key`: `counter_key`
- `INDEX` `idx_counter_key`: `counter_key`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `attribution_events`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `event_type` | `enum('first_touch','lead_created','opportunity_created','deal_won','revenue')` | NO | `NULL` | MUL |  |
| `source_type` | `enum('email_campaign','sms_campaign','call_campaign','form','landing_page','direct','referral','organic','paid','other')` | NO | `NULL` | MUL |  |
| `source_id` | `int(11)` | YES | `NULL` |  |  |
| `source_name` | `varchar(255)` | YES | `NULL` |  |  |
| `channel` | `varchar(50)` | YES | `NULL` |  |  |
| `utm_source` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_medium` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_campaign` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_content` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_term` | `varchar(255)` | YES | `NULL` |  |  |
| `value` | `decimal(15,2)` | YES | `NULL` |  |  |
| `event_at` | `datetime` | NO | `NULL` | MUL |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_attribution_contact`: `contact_id`
- `INDEX` `idx_attribution_date`: `event_at`
- `INDEX` `idx_attribution_event_type`: `event_type`
- `INDEX` `idx_attribution_source`: `source_type`
- `INDEX` `idx_attribution_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `audit_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | YES | `NULL` | MUL |  |
| `action` | `varchar(100)` | NO | `NULL` | MUL |  |
| `resource_type` | `varchar(100)` | NO | `NULL` | MUL |  |
| `resource_id` | `varchar(255)` | YES | `NULL` |  |  |
| `old_values` | `longtext` | YES | `NULL` |  |  |
| `new_values` | `longtext` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | NO | `NULL` | MUL |  |
| `user_agent` | `text` | NO | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` | MUL |  |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `audit_logs_ibfk_1`)

**Indexes:**
- `INDEX` `idx_action`: `action`
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_ip_address`: `ip_address`
- `INDEX` `idx_resource_type`: `resource_type`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `auth_tokens`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `token` | `varchar(255)` | NO | `NULL` | UNI |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `expires_at` | `timestamp` | YES | `NULL` |  |  |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `token`: `token`
- `INDEX` `user_id`: `user_id`

---
### Table: `automation_action_queue`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `execution_id` | `int(11)` | NO | `NULL` | MUL |  |
| `action_index` | `int(11)` | NO | `NULL` |  |  |
| `action_type` | `varchar(50)` | NO | `NULL` |  |  |
| `action_config` | `longtext` | NO | `NULL` |  |  |
| `status` | `enum('pending','processing','completed','failed')` | YES | `'pending'` | MUL |  |
| `attempts` | `int(11)` | YES | `0` |  |  |
| `max_attempts` | `int(11)` | YES | `3` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `scheduled_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `started_at` | `timestamp` | YES | `NULL` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `execution_id`: `execution_id`
- `INDEX` `idx_action_queue_scheduled`: `scheduled_at`
- `INDEX` `idx_action_queue_status`: `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `automation_actions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workflow_id` | `int(11)` | NO | `NULL` | MUL |  |
| `action_type` | `varchar(100)` | NO | `NULL` |  |  |
| `name` | `varchar(255)` | YES | `NULL` |  |  |
| `config` | `longtext` | NO | `NULL` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `parent_action_id` | `int(11)` | YES | `NULL` | MUL |  |
| `branch_type` | `enum('main','yes','no')` | YES | `'main'` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `execution_count` | `int(11)` | YES | `0` |  |  |
| `success_count` | `int(11)` | YES | `0` |  |  |
| `failure_count` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workflow_id` -> `automation_workflows.id` (Constraint: `automation_actions_ibfk_1`)
- `parent_action_id` -> `automation_actions.id` (Constraint: `automation_actions_ibfk_2`)

**Indexes:**
- `INDEX` `idx_automation_actions_parent`: `parent_action_id`
- `INDEX` `idx_automation_actions_workflow`: `workflow_id`, `sort_order`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `automation_channel_config`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `channel` | `varchar(50)` | NO | `NULL` | UNI |  |
| `trigger_types` | `longtext` | NO | `NULL` |  |  |
| `action_types` | `longtext` | NO | `NULL` |  |  |
| `settings_schema` | `longtext` | YES | `NULL` |  |  |
| `display_name` | `varchar(100)` | NO | `NULL` |  |  |
| `icon` | `varchar(50)` | YES | `NULL` |  |  |
| `color` | `varchar(20)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `idx_channel_config_channel`: `channel`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `automation_executions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `automation_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `trigger_event` | `varchar(100)` | NO | `NULL` |  |  |
| `trigger_data` | `longtext` | YES | `NULL` |  |  |
| `action_result` | `longtext` | YES | `NULL` |  |  |
| `status` | `varchar(50)` | YES | `'pending'` | MUL |  |
| `scheduled_at` | `datetime` | YES | `NULL` | MUL |  |
| `executed_at` | `datetime` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `trigger_reason` | `longtext` | YES | `NULL` |  |  |
| `skip_reason` | `text` | YES | `NULL` |  |  |
| `matched_confidence` | `int(11)` | YES | `NULL` |  |  |
| `success` | `tinyint(1)` | YES | `0` |  |  |

**Indexes:**
- `INDEX` `idx_automation_executions_automation`: `automation_id`
- `INDEX` `idx_automation_executions_contact`: `contact_id`
- `INDEX` `idx_automation_executions_scheduled`: `scheduled_at`
- `INDEX` `idx_automation_executions_status`: `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `automation_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `automation_id` | `int(11)` | YES | `NULL` | MUL |  |
| `flow_id` | `int(11)` | YES | `NULL` | MUL |  |
| `queue_id` | `int(11)` | YES | `NULL` |  |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `event_type` | `varchar(100)` | NO | `NULL` | MUL |  |
| `event_data` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('success','failed','skipped')` | YES | `'success'` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `execution_time_ms` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_logs_automation`: `automation_id`
- `INDEX` `idx_logs_contact`: `contact_id`
- `INDEX` `idx_logs_created`: `created_at`
- `INDEX` `idx_logs_event`: `event_type`
- `INDEX` `idx_logs_flow`: `flow_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `automation_metrics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `automation_id` | `int(11)` | NO | `NULL` | MUL |  |
| `date` | `date` | NO | `NULL` | MUL |  |
| `contacts_entered` | `int(11)` | YES | `0` |  |  |
| `contacts_completed` | `int(11)` | YES | `0` |  |  |
| `contacts_exited` | `int(11)` | YES | `0` |  |  |
| `emails_sent` | `int(11)` | YES | `0` |  |  |
| `emails_opened` | `int(11)` | YES | `0` |  |  |
| `emails_clicked` | `int(11)` | YES | `0` |  |  |
| `conversions` | `int(11)` | YES | `0` |  |  |
| `revenue` | `decimal(10,2)` | YES | `0.00` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_automation`: `automation_id`
- `INDEX` `idx_date`: `date`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_automation_date`: `automation_id`, `date`

---
### Table: `automation_queue`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `automation_id` | `int(11)` | YES | `NULL` | MUL |  |
| `flow_id` | `int(11)` | YES | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `action_type` | `varchar(100)` | NO | `NULL` |  |  |
| `action_config` | `longtext` | NO | `NULL` |  |  |
| `priority` | `int(11)` | YES | `0` |  |  |
| `status` | `enum('pending','processing','completed','failed','cancelled')` | YES | `'pending'` | MUL |  |
| `scheduled_for` | `datetime` | NO | `NULL` |  |  |
| `attempts` | `int(11)` | YES | `0` |  |  |
| `max_attempts` | `int(11)` | YES | `3` |  |  |
| `last_attempt_at` | `datetime` | YES | `NULL` |  |  |
| `completed_at` | `datetime` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `result` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_queue_automation`: `automation_id`
- `INDEX` `idx_queue_contact`: `contact_id`
- `INDEX` `idx_queue_flow`: `flow_id`
- `INDEX` `idx_queue_status`: `status`, `scheduled_for`
- `INDEX` `idx_queue_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `automation_rate_limits`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `channel` | `varchar(50)` | NO | `NULL` |  |  |
| `period_start` | `datetime` | NO | `NULL` |  |  |
| `period_type` | `enum('hour','day')` | NO | `NULL` |  |  |
| `count` | `int(11)` | YES | `0` |  |  |

**Indexes:**
- `INDEX` `idx_rate_user_channel`: `user_id`, `channel`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_rate_limit`: `user_id`, `channel`, `period_start`, `period_type`

---
### Table: `automation_recipes`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | YES | `NULL` |  |  |
| `is_system` | `tinyint(1)` | YES | `0` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `category` | `enum('welcome','nurture','reengagement','abandoned_cart','post_purchase','birthday','review_request','appointment','custom')` | NO | `NULL` | MUL |  |
| `type` | `enum('trigger','rule','workflow')` | YES | `NULL` |  |  |
| `industry` | `varchar(100)` | YES | `NULL` |  |  |
| `target_audience` | `enum('local_business','home_services','agency','ecommerce','saas','general')` | YES | `'general'` | MUL |  |
| `channels` | `longtext` | YES | `NULL` |  |  |
| `trigger_type` | `varchar(100)` | YES | `NULL` |  |  |
| `trigger_config` | `longtext` | YES | `NULL` |  |  |
| `steps` | `longtext` | NO | `NULL` |  |  |
| `estimated_duration` | `varchar(50)` | YES | `NULL` |  |  |
| `difficulty` | `enum('beginner','intermediate','advanced')` | YES | `'beginner'` |  |  |
| `tags` | `longtext` | YES | `NULL` |  |  |
| `preview_image` | `varchar(500)` | YES | `NULL` |  |  |
| `usage_count` | `int(11)` | YES | `0` |  |  |
| `rating` | `decimal(3,2)` | YES | `0.00` |  |  |
| `status` | `enum('draft','published','archived')` | YES | `'published'` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_category`: `category`
- `INDEX` `idx_target_audience`: `target_audience`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `automation_split_tests`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `automation_id` | `int(11)` | NO | `NULL` | MUL |  |
| `test_name` | `varchar(255)` | NO | `NULL` |  |  |
| `variant_a_config` | `longtext` | NO | `NULL` |  |  |
| `variant_b_config` | `longtext` | NO | `NULL` |  |  |
| `traffic_split` | `int(11)` | YES | `50` |  |  |
| `winner_variant` | `char(1)` | YES | `NULL` |  |  |
| `status` | `enum('draft','running','completed','paused')` | YES | `'draft'` | MUL |  |
| `started_at` | `timestamp` | YES | `NULL` |  |  |
| `ended_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_automation`: `automation_id`
- `INDEX` `idx_status`: `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `automation_workflows`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `recipe_id` | `int(11)` | YES | `NULL` | MUL |  |
| `workflow_type` | `enum('trigger','scheduled','manual')` | YES | `'trigger'` |  |  |
| `trigger_type` | `varchar(100)` | YES | `NULL` |  |  |
| `trigger_config` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('draft','active','paused','archived')` | YES | `'draft'` |  |  |
| `version` | `int(11)` | YES | `1` |  |  |
| `nodes_config` | `longtext` | YES | `NULL` |  |  |
| `stats` | `longtext` | YES | `NULL` |  |  |
| `total_executions` | `int(11)` | YES | `0` |  |  |
| `successful_executions` | `int(11)` | YES | `0` |  |  |
| `failed_executions` | `int(11)` | YES | `0` |  |  |
| `last_executed_at` | `timestamp` | YES | `NULL` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_automation_workflows_trigger`: `workspace_id`, `trigger_type`
- `INDEX` `idx_automation_workflows_workspace`: `workspace_id`, `status`
- `INDEX` `idx_recipe`: `recipe_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `automations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `trigger_type` | `varchar(50)` | NO | `NULL` |  |  |
| `trigger_config` | `longtext` | NO | `NULL` |  |  |
| `actions` | `longtext` | NO | `NULL` |  |  |
| `status` | `varchar(32)` | NO | `'active'` | MUL |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `status`: `status`
- `INDEX` `user_id`: `user_id`

---
### Table: `availability_overrides`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `override_date` | `date` | NO | `NULL` |  |  |
| `is_available` | `tinyint(1)` | NO | `0` |  |  |
| `start_time` | `time` | YES | `NULL` |  |  |
| `end_time` | `time` | YES | `NULL` |  |  |
| `reason` | `varchar(255)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_availability_overrides_workspace`: `workspace_id`
- `INDEX` `idx_overrides_user_date`: `user_id`, `override_date`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `availability_schedules`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `'Default Schedule'` |  |  |
| `timezone` | `varchar(100)` | NO | `'UTC'` |  |  |
| `is_default` | `tinyint(1)` | NO | `0` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `advanced_settings` | `longtext` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_availability_schedules_workspace`: `workspace_id`
- `INDEX` `idx_availability_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `availability_slots`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `schedule_id` | `int(11)` | NO | `NULL` | MUL |  |
| `day_of_week` | `tinyint(4)` | NO | `NULL` |  |  |
| `start_time` | `time` | NO | `NULL` |  |  |
| `end_time` | `time` | NO | `NULL` |  |  |
| `is_available` | `tinyint(1)` | NO | `1` |  |  |

**Indexes:**
- `INDEX` `idx_slots_schedule`: `schedule_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `battle_cards`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `competitor_name` | `varchar(255)` | NO | `NULL` | MUL |  |
| `competitor_logo` | `varchar(500)` | YES | `NULL` |  |  |
| `competitor_website` | `varchar(500)` | YES | `NULL` |  |  |
| `overview` | `text` | YES | `NULL` |  |  |
| `strengths` | `longtext` | YES | `NULL` |  |  |
| `weaknesses` | `longtext` | YES | `NULL` |  |  |
| `pricing_info` | `text` | YES | `NULL` |  |  |
| `feature_comparison` | `longtext` | YES | `NULL` |  |  |
| `objection_handlers` | `longtext` | YES | `NULL` |  |  |
| `win_strategies` | `text` | YES | `NULL` |  |  |
| `tags` | `longtext` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` | MUL |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_active`: `is_active`
- `INDEX` `idx_competitor`: `competitor_name`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `billing_plans`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `price_monthly` | `decimal(10,2)` | NO | `NULL` |  |  |
| `price_yearly` | `decimal(10,2)` | YES | `NULL` |  |  |
| `contacts_limit` | `int(11)` | YES | `NULL` |  |  |
| `emails_limit` | `int(11)` | YES | `NULL` |  |  |
| `sms_limit` | `int(11)` | YES | `NULL` |  |  |
| `storage_limit_mb` | `int(11)` | YES | `NULL` |  |  |
| `users_limit` | `int(11)` | YES | `NULL` |  |  |
| `features` | `longtext` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` | MUL |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_active`: `is_active`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `blog_posts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `slug` | `varchar(255)` | NO | `NULL` | MUL |  |
| `content` | `longtext` | YES | `NULL` |  |  |
| `summary` | `text` | YES | `NULL` |  |  |
| `featured_image` | `varchar(512)` | YES | `NULL` |  |  |
| `author_name` | `varchar(100)` | YES | `NULL` |  |  |
| `category` | `varchar(100)` | YES | `NULL` |  |  |
| `tags` | `text` | YES | `NULL` |  |  |
| `status` | `enum('draft','published','scheduled','archived')` | YES | `'draft'` | MUL |  |
| `published_at` | `timestamp` | YES | `NULL` |  |  |
| `seo_title` | `varchar(255)` | YES | `NULL` |  |  |
| `seo_description` | `varchar(512)` | YES | `NULL` |  |  |
| `view_count` | `int(11)` | YES | `0` |  |  |
| `is_featured` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `slug`: `slug`
- `INDEX` `status`: `status`
- `INDEX` `user_id`: `user_id`
- `INDEX` `workspace_id`: `workspace_id`

---
### Table: `blog_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `blog_name` | `varchar(255)` | NO | `NULL` |  |  |
| `blog_description` | `text` | YES | `NULL` |  |  |
| `domain_id` | `int(11)` | YES | `NULL` |  |  |
| `path_prefix` | `varchar(100)` | YES | `'blog'` |  |  |
| `social_sharing_image` | `varchar(512)` | YES | `NULL` |  |  |
| `custom_css` | `text` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`
- `INDEX` `workspace_id`: `workspace_id`

---
### Table: `booking_leads`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `booking_page_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `guest_name` | `varchar(255)` | YES | `NULL` |  |  |
| `guest_email` | `varchar(255)` | YES | `NULL` |  |  |
| `guest_phone` | `varchar(50)` | YES | `NULL` |  |  |
| `form_data` | `longtext` | YES | `NULL` |  |  |
| `external_source` | `varchar(50)` | YES | `NULL` |  |  |
| `external_booking_id` | `varchar(255)` | YES | `NULL` | MUL |  |
| `external_event_url` | `text` | YES | `NULL` |  |  |
| `status` | `enum('pending','confirmed','cancelled')` | YES | `'pending'` | MUL |  |
| `appointment_id` | `int(11)` | YES | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `booking_leads_ibfk_1`)
- `company_id` -> `companies.id` (Constraint: `booking_leads_ibfk_2`)
- `booking_page_id` -> `booking_pages.id` (Constraint: `booking_leads_ibfk_3`)
- `contact_id` -> `contacts.id` (Constraint: `booking_leads_ibfk_4`)
- `appointment_id` -> `appointments.id` (Constraint: `booking_leads_ibfk_5`)

**Indexes:**
- `INDEX` `appointment_id`: `appointment_id`
- `INDEX` `company_id`: `company_id`
- `INDEX` `idx_booking_page`: `booking_page_id`
- `INDEX` `idx_contact`: `contact_id`
- `INDEX` `idx_external_booking`: `external_booking_id`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `booking_page_analytics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `booking_page_id` | `int(11)` | NO | `NULL` | MUL |  |
| `session_id` | `varchar(255)` | NO | `NULL` | MUL |  |
| `step` | `enum('page_view','service_selected','time_selected','form_started','form_completed','booking_confirmed')` | NO | `NULL` | MUL |  |
| `service_id` | `int(11)` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_booking_page`: `booking_page_id`
- `INDEX` `idx_created`: `created_at`
- `INDEX` `idx_session`: `session_id`
- `INDEX` `idx_step`: `step`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `booking_page_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | UNI |  |
| `page_slug` | `varchar(100)` | NO | `NULL` | MUL |  |
| `page_title` | `varchar(255)` | YES | `NULL` |  |  |
| `welcome_message` | `text` | YES | `NULL` |  |  |
| `logo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `brand_color` | `varchar(7)` | YES | `'#3B82F6'` |  |  |
| `show_branding` | `tinyint(1)` | NO | `1` |  |  |
| `require_phone` | `tinyint(1)` | NO | `0` |  |  |
| `custom_questions` | `longtext` | YES | `NULL` |  |  |
| `confirmation_message` | `text` | YES | `NULL` |  |  |
| `redirect_url` | `varchar(500)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `timezone` | `varchar(100)` | YES | `'America/New_York'` |  |  |
| `date_format` | `varchar(20)` | YES | `'MM/DD/YYYY'` |  |  |
| `time_format` | `enum('12h','24h')` | YES | `'12h'` |  |  |
| `cancellation_policy` | `text` | YES | `NULL` |  |  |
| `privacy_policy_url` | `varchar(500)` | YES | `NULL` |  |  |
| `terms_url` | `varchar(500)` | YES | `NULL` |  |  |
| `google_analytics_id` | `varchar(50)` | YES | `NULL` |  |  |
| `facebook_pixel_id` | `varchar(50)` | YES | `NULL` |  |  |
| `custom_css` | `text` | YES | `NULL` |  |  |
| `custom_js` | `text` | YES | `NULL` |  |  |
| `seo_title` | `varchar(255)` | YES | `NULL` |  |  |
| `seo_description` | `text` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_booking_page_slug`: `page_slug`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `user_id`: `user_id`

---
### Table: `booking_pages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `slug` | `varchar(255)` | NO | `NULL` |  |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `source` | `enum('native','calendly','acuity')` | NO | `'native'` | MUL |  |
| `source_config` | `longtext` | YES | `NULL` |  |  |
| `native_config` | `longtext` | YES | `NULL` |  |  |
| `form_schema` | `longtext` | YES | `NULL` |  |  |
| `branding` | `longtext` | YES | `NULL` |  |  |
| `payment_config` | `longtext` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `booking_pages_ibfk_1`)
- `company_id` -> `companies.id` (Constraint: `booking_pages_ibfk_2`)

**Indexes:**
- `INDEX` `idx_active`: `is_active`
- `INDEX` `idx_company`: `company_id`
- `INDEX` `idx_source`: `source`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_workspace_slug`: `workspace_id`, `slug`

---
### Table: `booking_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | UNI |  |
| `page_title` | `varchar(100)` | YES | `NULL` |  |  |
| `page_description` | `text` | YES | `NULL` |  |  |
| `logo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `cover_image_url` | `varchar(500)` | YES | `NULL` |  |  |
| `primary_color` | `varchar(7)` | YES | `'#6366f1'` |  |  |
| `min_notice_hours` | `int(11)` | YES | `1` |  |  |
| `max_advance_days` | `int(11)` | YES | `60` |  |  |
| `slot_interval_minutes` | `int(11)` | YES | `30` |  |  |
| `allow_cancellation` | `tinyint(1)` | YES | `1` |  |  |
| `cancellation_notice_hours` | `int(11)` | YES | `24` |  |  |
| `cancellation_policy` | `text` | YES | `NULL` |  |  |
| `require_payment` | `tinyint(1)` | YES | `0` |  |  |
| `require_deposit` | `tinyint(1)` | YES | `0` |  |  |
| `deposit_percentage` | `int(11)` | YES | `50` |  |  |
| `auto_confirm` | `tinyint(1)` | YES | `1` |  |  |
| `confirmation_message` | `text` | YES | `NULL` |  |  |
| `meta_title` | `varchar(100)` | YES | `NULL` |  |  |
| `meta_description` | `varchar(255)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace`: `workspace_id`

---
### Table: `booking_type_staff`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `booking_type_id` | `int(11)` | NO | `NULL` | MUL |  |
| `staff_id` | `int(11)` | NO | `NULL` |  |  |
| `is_primary` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_booking_staff`: `booking_type_id`, `staff_id`

---
### Table: `booking_types`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `service_id` | `int(11)` | YES | `NULL` | MUL |  |
| `assigned_staff_ids` | `longtext` | YES | `NULL` |  |  |
| `intake_form_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `slug` | `varchar(100)` | NO | `NULL` | MUL |  |
| `description` | `text` | YES | `NULL` |  |  |
| `duration_minutes` | `int(11)` | NO | `30` |  |  |
| `buffer_before` | `int(11)` | NO | `0` |  |  |
| `buffer_after` | `int(11)` | NO | `15` |  |  |
| `color` | `varchar(7)` | YES | `'#3B82F6'` |  |  |
| `location_type` | `enum('in_person','phone','video','custom')` | NO | `'video'` |  |  |
| `location_details` | `text` | YES | `NULL` |  |  |
| `meeting_link_template` | `varchar(500)` | YES | `NULL` |  |  |
| `price` | `decimal(10,2)` | YES | `NULL` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `requires_payment` | `tinyint(1)` | NO | `0` |  |  |
| `max_bookings_per_day` | `int(11)` | YES | `NULL` |  |  |
| `min_notice_hours` | `int(11)` | NO | `24` |  |  |
| `max_future_days` | `int(11)` | NO | `60` |  |  |
| `is_active` | `tinyint(1)` | NO | `1` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `confirmation_email_template_id` | `int(11)` | YES | `NULL` |  |  |
| `reminder_sms_template_id` | `int(11)` | YES | `NULL` |  |  |
| `followup_automation_id` | `int(11)` | YES | `NULL` |  |  |
| `allow_staff_selection` | `tinyint(1)` | YES | `0` |  |  |
| `require_deposit` | `tinyint(1)` | YES | `0` |  |  |
| `deposit_amount` | `decimal(10,2)` | YES | `NULL` |  |  |
| `cancellation_policy` | `text` | YES | `NULL` |  |  |
| `workspace_id` | `int(11)` | NO | `1` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `reminder_email_template_id` | `int(11)` | YES | `NULL` |  |  |
| `custom_questions` | `longtext` | YES | `NULL` |  |  |
| `booking_limit_type` | `enum('daily','weekly','monthly')` | YES | `'daily'` |  |  |
| `booking_limit_count` | `int(11)` | YES | `NULL` |  |  |
| `auto_confirm` | `tinyint(1)` | YES | `0` |  |  |
| `collect_payment_on_booking` | `tinyint(1)` | YES | `0` |  |  |
| `payment_provider` | `varchar(50)` | YES | `NULL` |  |  |
| `stripe_price_id` | `varchar(255)` | YES | `NULL` |  |  |
| `is_group_event` | `tinyint(1)` | YES | `0` |  |  |
| `max_participants` | `int(11)` | YES | `1` |  |  |
| `min_participants` | `int(11)` | YES | `1` |  |  |
| `waitlist_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `participant_confirmation` | `tinyint(1)` | YES | `0` |  |  |
| `smart_buffer_mode` | `varchar(20)` | YES | `'fixed'` |  |  |
| `overlap_prevention` | `varchar(20)` | YES | `'strict'` |  |  |
| `travel_time_minutes` | `int(11)` | YES | `0` |  |  |

**Indexes:**
- `INDEX` `idx_booking_service`: `service_id`
- `INDEX` `idx_booking_types_company_id`: `company_id`
- `INDEX` `idx_booking_types_slug`: `slug`
- `INDEX` `idx_booking_types_user`: `user_id`
- `INDEX` `idx_booking_types_user_active`: `user_id`, `is_active`
- `INDEX` `idx_booking_types_workspace`: `workspace_id`
- `INDEX` `idx_booking_types_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_user_slug`: `user_id`, `slug`

---
### Table: `brand_configurations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `brand_name` | `varchar(255)` | NO | `NULL` |  |  |
| `logo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `favicon_url` | `varchar(500)` | YES | `NULL` |  |  |
| `primary_color` | `varchar(7)` | NO | `NULL` |  |  |
| `secondary_color` | `varchar(7)` | YES | `NULL` |  |  |
| `accent_color` | `varchar(7)` | YES | `NULL` |  |  |
| `font_family` | `varchar(100)` | YES | `NULL` |  |  |
| `custom_css` | `text` | YES | `NULL` |  |  |
| `custom_domain` | `varchar(255)` | YES | `NULL` | MUL |  |
| `email_from_name` | `varchar(255)` | YES | `NULL` |  |  |
| `email_from_address` | `varchar(255)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_company`: `company_id`
- `INDEX` `idx_domain`: `custom_domain`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `business_events`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `1` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `event_type` | `varchar(100)` | NO | `NULL` | MUL |  |
| `entity_type` | `varchar(50)` | NO | `NULL` |  |  |
| `entity_id` | `int(11)` | YES | `NULL` |  |  |
| `actor_type` | `enum('user','system','contact','automation')` | YES | `'system'` |  |  |
| `actor_id` | `int(11)` | YES | `NULL` |  |  |
| `payload` | `longtext` | YES | `NULL` |  |  |
| `processed` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_events_type`: `event_type`
- `INDEX` `idx_events_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `business_listings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `directory_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `directory` | `varchar(50)` | NO | `NULL` |  |  |
| `directory_name` | `varchar(100)` | NO | `NULL` |  |  |
| `listing_url` | `varchar(500)` | YES | `NULL` |  |  |
| `status` | `enum('not_listed','pending','claimed','verified','needs_update','error')` | YES | `'not_listed'` |  |  |
| `submission_status` | `enum('not_started','in_progress','submitted','failed','verified')` | YES | `'not_started'` |  |  |
| `submission_log` | `longtext` | YES | `NULL` |  |  |
| `last_submission_attempt` | `timestamp` | YES | `NULL` |  |  |
| `external_id` | `varchar(255)` | YES | `NULL` | MUL |  |
| `external_listing_id` | `varchar(255)` | YES | `NULL` |  |  |
| `claim_url` | `varchar(500)` | YES | `NULL` |  |  |
| `business_name` | `varchar(255)` | YES | `NULL` |  |  |
| `address` | `varchar(500)` | YES | `NULL` |  |  |
| `phone` | `varchar(20)` | YES | `NULL` |  |  |
| `website` | `varchar(500)` | YES | `NULL` |  |  |
| `categories` | `longtext` | YES | `NULL` |  |  |
| `submission_data` | `longtext` | YES | `NULL` |  |  |
| `name_accurate` | `tinyint(1)` | YES | `NULL` |  |  |
| `address_accurate` | `tinyint(1)` | YES | `NULL` |  |  |
| `phone_accurate` | `tinyint(1)` | YES | `NULL` |  |  |
| `website_accurate` | `tinyint(1)` | YES | `NULL` |  |  |
| `hours_accurate` | `tinyint(1)` | YES | `NULL` |  |  |
| `accuracy_score` | `int(11)` | YES | `NULL` |  |  |
| `nap_consistency_score` | `int(11)` | YES | `100` |  |  |
| `is_duplicate` | `tinyint(1)` | YES | `0` |  |  |
| `duplicate_of_id` | `int(11)` | YES | `NULL` |  |  |
| `last_checked_at` | `timestamp` | YES | `NULL` |  |  |
| `last_updated_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `submission_type` | `enum('manual','automated')` | YES | `'manual'` |  |  |
| `country` | `varchar(10)` | YES | `'US'` |  |  |
| `claim_status` | `enum('unclaimed','claimed','verified')` | YES | `'unclaimed'` | MUL |  |
| `sync_provider` | `varchar(50)` | YES | `NULL` | MUL |  |
| `sync_status` | `varchar(50)` | YES | `'pending'` | MUL |  |
| `review_count` | `int(11)` | YES | `0` |  |  |
| `rating_avg` | `decimal(3,2)` | YES | `NULL` |  |  |
| `last_synced_at` | `timestamp` | YES | `NULL` |  |  |
| `sync_error` | `text` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_business_listings_company`: `workspace_id`, `company_id`, `status`
- `INDEX` `idx_claim_status`: `claim_status`
- `INDEX` `idx_company_directory`: `company_id`, `directory`
- `INDEX` `idx_directory_id`: `directory_id`
- `INDEX` `idx_external_id`: `external_id`
- `INDEX` `idx_listings_workspace`: `workspace_id`, `status`
- `INDEX` `idx_sync_provider`: `sync_provider`
- `INDEX` `idx_sync_status`: `sync_status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `calendar_availability`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `calendar_id` | `int(11)` | NO | `NULL` | MUL |  |
| `day_of_week` | `tinyint(4)` | NO | `NULL` |  |  |
| `start_time` | `time` | NO | `NULL` |  |  |
| `end_time` | `time` | NO | `NULL` |  |  |
| `is_available` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `calendar_id` -> `calendars.id` (Constraint: `calendar_availability_ibfk_1`)

**Indexes:**
- `INDEX` `idx_calendar_availability`: `calendar_id`, `day_of_week`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `calendar_blocks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `calendar_id` | `int(11)` | NO | `NULL` | MUL |  |
| `title` | `varchar(100)` | YES | `NULL` |  |  |
| `start_datetime` | `datetime` | NO | `NULL` |  |  |
| `end_datetime` | `datetime` | NO | `NULL` |  |  |
| `is_all_day` | `tinyint(1)` | YES | `0` |  |  |
| `block_type` | `enum('busy','tentative','out_of_office','external')` | YES | `'busy'` |  |  |
| `source` | `enum('manual','google','outlook','ical')` | YES | `'manual'` |  |  |
| `external_event_id` | `varchar(255)` | YES | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `external_id` | `varchar(255)` | YES | `NULL` |  |  |
| `external_source` | `enum('google','outlook')` | YES | `NULL` |  |  |

**Foreign Keys:**
- `calendar_id` -> `calendars.id` (Constraint: `calendar_blocks_ibfk_1`)

**Indexes:**
- `INDEX` `idx_calendar_blocks`: `calendar_id`, `start_datetime`, `end_datetime`
- `INDEX` `idx_calendar_blocks_external`: `external_event_id`
- `UNIQUE` `idx_external`: `calendar_id`, `external_source`, `external_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `calendar_connections`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `provider` | `enum('google','outlook')` | NO | `NULL` |  |  |
| `access_token` | `text` | NO | `NULL` |  |  |
| `refresh_token` | `text` | YES | `NULL` |  |  |
| `token_expires_at` | `timestamp` | YES | `NULL` |  |  |
| `calendar_id` | `varchar(255)` | YES | `NULL` |  |  |
| `status` | `enum('active','expired','revoked')` | YES | `'active'` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_calendar_connections_status`: `status`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_user_provider`: `user_id`, `provider`

---
### Table: `calendar_services`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `calendar_id` | `int(11)` | NO | `NULL` | MUL |  |
| `service_id` | `int(11)` | NO | `NULL` |  |  |
| `custom_duration_minutes` | `int(11)` | YES | `NULL` |  |  |
| `custom_price` | `decimal(10,2)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `calendar_id` -> `calendars.id` (Constraint: `calendar_services_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_calendar_service`: `calendar_id`, `service_id`

---
### Table: `calendar_staff`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `calendar_id` | `int(11)` | NO | `NULL` | MUL |  |
| `staff_id` | `int(11)` | NO | `NULL` |  |  |
| `is_primary` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `calendar_id` -> `calendars.id` (Constraint: `calendar_staff_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_calendar_staff`: `calendar_id`, `staff_id`

---
### Table: `calendar_sync_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `calendar_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `provider` | `enum('google','outlook')` | NO | `NULL` |  |  |
| `direction` | `enum('import','export','disconnect')` | NO | `NULL` |  |  |
| `status` | `enum('success','failed','partial')` | NO | `NULL` | MUL |  |
| `details` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_calendar_provider`: `calendar_id`, `provider`
- `INDEX` `idx_created`: `created_at`
- `INDEX` `idx_status`: `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `calendar_sync_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `workspace_id` | `int(11)` | NO | `NULL` | PRI |  |
| `auto_sync_interval_minutes` | `int(11)` | YES | `30` |  |  |
| `default_sync_direction` | `enum('one_way_to_local','one_way_to_external','two_way')` | YES | `'two_way'` |  |  |
| `default_conflict_resolution` | `enum('local_wins','external_wins','most_recent')` | YES | `'most_recent'` |  |  |
| `block_appointments_on_external_events` | `tinyint(1)` | YES | `1` |  |  |
| `show_external_events_in_calendar` | `tinyint(1)` | YES | `1` |  |  |
| `sync_past_days` | `int(11)` | YES | `30` |  |  |
| `sync_future_days` | `int(11)` | YES | `90` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `workspace_id`

---
### Table: `calendars`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `slug` | `varchar(100)` | YES | `NULL` |  |  |
| `owner_type` | `enum('user','staff','team','location')` | YES | `'user'` | MUL |  |
| `owner_id` | `int(11)` | YES | `NULL` |  |  |
| `timezone` | `varchar(50)` | YES | `'UTC'` |  |  |
| `location_id` | `int(11)` | YES | `NULL` |  |  |
| `min_notice_hours` | `int(11)` | YES | `1` |  |  |
| `max_advance_days` | `int(11)` | YES | `60` |  |  |
| `slot_interval_minutes` | `int(11)` | YES | `30` |  |  |
| `buffer_before_minutes` | `int(11)` | YES | `0` |  |  |
| `buffer_after_minutes` | `int(11)` | YES | `0` |  |  |
| `availability_mode` | `enum('custom','staff_based','always')` | YES | `'custom'` |  |  |
| `color` | `varchar(7)` | YES | `'#6366f1'` |  |  |
| `is_public` | `tinyint(1)` | YES | `1` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `google_calendar_id` | `varchar(255)` | YES | `NULL` |  |  |
| `google_sync_token` | `text` | YES | `NULL` |  |  |
| `google_channel_id` | `varchar(255)` | YES | `NULL` |  |  |
| `google_channel_expiry` | `datetime` | YES | `NULL` |  |  |
| `outlook_calendar_id` | `varchar(255)` | YES | `NULL` |  |  |
| `outlook_sync_token` | `text` | YES | `NULL` |  |  |
| `last_synced_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_calendars_owner`: `owner_type`, `owner_id`
- `INDEX` `idx_calendars_workspace`: `workspace_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_calendar_slug`: `workspace_id`, `slug`

---
### Table: `call_agents`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `email` | `varchar(255)` | YES | `NULL` |  |  |
| `phone` | `varchar(50)` | YES | `NULL` |  |  |
| `extension` | `varchar(20)` | YES | `NULL` |  |  |
| `status` | `enum('active','inactive','busy','away')` | YES | `'active'` |  |  |
| `max_concurrent_calls` | `int(11)` | YES | `1` |  |  |
| `skills` | `text` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Indexes:**
- `INDEX` `idx_call_agents_workspace`: `workspace_id`
- `INDEX` `idx_call_agents_workspace_id`: `workspace_id`
- `INDEX` `idx_user_status`: `user_id`, `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `call_analyses`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `transcription_id` | `int(11)` | NO | `NULL` | MUL |  |
| `sentiment_score` | `decimal(4,3)` | YES | `NULL` | MUL |  |
| `intent_score` | `int(11)` | YES | `NULL` | MUL |  |
| `key_phrases` | `longtext` | YES | `NULL` |  |  |
| `objections` | `longtext` | YES | `NULL` |  |  |
| `buying_signals` | `longtext` | YES | `NULL` |  |  |
| `topics` | `longtext` | YES | `NULL` |  |  |
| `talk_ratio` | `decimal(5,2)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_analyses_intent`: `intent_score`
- `INDEX` `idx_analyses_sentiment`: `sentiment_score`
- `INDEX` `idx_analyses_transcription`: `transcription_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `call_analytics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `call_sid` | `varchar(100)` | YES | `NULL` |  |  |
| `status` | `varchar(50)` | YES | `'completed'` |  |  |
| `duration` | `int(11)` | YES | `0` |  |  |
| `campaign_id` | `int(11)` | YES | `NULL` | MUL |  |
| `date` | `date` | NO | `NULL` | MUL |  |
| `total_calls` | `int(11)` | YES | `0` |  |  |
| `successful_calls` | `int(11)` | YES | `0` |  |  |
| `failed_calls` | `int(11)` | YES | `0` |  |  |
| `answered_calls` | `int(11)` | YES | `0` |  |  |
| `voicemail_calls` | `int(11)` | YES | `0` |  |  |
| `busy_calls` | `int(11)` | YES | `0` |  |  |
| `no_answer_calls` | `int(11)` | YES | `0` |  |  |
| `avg_call_duration` | `int(11)` | YES | `0` |  |  |
| `total_cost` | `decimal(10,4)` | YES | `0.0000` |  |  |
| `success_rate` | `decimal(5,2)` | YES | `0.00` |  |  |
| `answer_rate` | `decimal(5,2)` | YES | `0.00` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `campaign_id`: `campaign_id`
- `INDEX` `idx_call_analytics_date`: `date`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_analytics`: `user_id`, `campaign_id`, `date`

---
### Table: `call_billing_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `min_duration_seconds` | `int(11)` | YES | `90` |  |  |
| `base_price_per_call` | `decimal(10,2)` | YES | `25.00` |  |  |
| `surge_multiplier` | `decimal(4,2)` | YES | `1.50` |  |  |
| `exclusive_multiplier` | `decimal(4,2)` | YES | `3.00` |  |  |
| `auto_bill_enabled` | `tinyint(1)` | YES | `1` |  |  |
| `dispute_window_hours` | `int(11)` | YES | `72` |  |  |
| `max_price_per_call` | `decimal(10,2)` | YES | `120.00` |  |  |
| `min_price_per_call` | `decimal(10,2)` | YES | `25.00` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uq_call_billing_settings`: `workspace_id`, `company_id`

---
### Table: `call_campaigns`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `agent_id` | `int(11)` | YES | `NULL` | MUL |  |
| `agent_name` | `varchar(255)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `caller_id` | `varchar(50)` | YES | `NULL` |  |  |
| `call_script` | `text` | YES | `NULL` |  |  |
| `status` | `varchar(50)` | NO | `'draft'` |  |  |
| `call_provider` | `varchar(50)` | NO | `'signalwire'` |  |  |
| `sequence_id` | `int(11)` | YES | `NULL` |  |  |
| `group_id` | `int(11)` | YES | `NULL` |  |  |
| `group_name` | `varchar(255)` | YES | `NULL` |  |  |
| `scheduled_at` | `datetime` | YES | `NULL` | MUL |  |
| `total_recipients` | `int(11)` | YES | `0` |  |  |
| `completed_calls` | `int(11)` | YES | `0` |  |  |
| `successful_calls` | `int(11)` | YES | `0` |  |  |
| `failed_calls` | `int(11)` | YES | `0` |  |  |
| `answered_calls` | `int(11)` | YES | `0` |  |  |
| `voicemail_calls` | `int(11)` | YES | `0` |  |  |
| `busy_calls` | `int(11)` | YES | `0` |  |  |
| `no_answer_calls` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |

**Foreign Keys:**
- `agent_id` -> `call_agents.id` (Constraint: `call_campaigns_ibfk_1`)
- `agent_id` -> `call_agents.id` (Constraint: `call_campaigns_ibfk_2`)

**Indexes:**
- `INDEX` `agent_id`: `agent_id`
- `INDEX` `idx_call_campaigns_company`: `workspace_id`, `company_id`
- `INDEX` `idx_call_campaigns_scheduled`: `scheduled_at`
- `INDEX` `idx_call_campaigns_user_status`: `user_id`, `status`
- `INDEX` `idx_call_campaigns_workspace`: `workspace_id`
- `INDEX` `idx_call_campaigns_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `call_disposition_types`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `category` | `varchar(50)` | NO | `NULL` |  |  |
| `color` | `varchar(7)` | YES | `'#6B7280'` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `is_system` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Indexes:**
- `INDEX` `idx_call_disposition_types_workspace`: `workspace_id`
- `INDEX` `idx_call_disposition_types_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`

---
### Table: `call_dispositions_types`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `category` | `varchar(50)` | YES | `NULL` |  |  |
| `color` | `varchar(20)` | YES | `'#6B7280'` |  |  |
| `icon` | `varchar(50)` | YES | `NULL` |  |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `requires_callback` | `tinyint(1)` | YES | `0` |  |  |
| `requires_notes` | `tinyint(1)` | YES | `0` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `semantic_category` | `varchar(50)` | YES | `NULL` |  |  |
| `semantic_confidence` | `int(11)` | YES | `NULL` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Indexes:**
- `INDEX` `idx_call_dispositions_types_workspace`: `workspace_id`
- `INDEX` `idx_call_dispositions_types_workspace_id`: `workspace_id`
- `INDEX` `idx_call_dispositions_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `call_disputes`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `call_log_id` | `int(11)` | NO | `NULL` |  |  |
| `credit_transaction_id` | `int(11)` | YES | `NULL` |  |  |
| `dispute_type` | `enum('wrong_number','not_interested','spam','poor_quality','duplicate','other')` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `status` | `enum('pending','under_review','approved','rejected','partial_refund')` | YES | `'pending'` |  |  |
| `refund_amount` | `decimal(10,2)` | YES | `NULL` |  |  |
| `resolution_notes` | `text` | YES | `NULL` |  |  |
| `resolved_by` | `int(11)` | YES | `NULL` |  |  |
| `resolved_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_call_disputes_company`: `workspace_id`, `company_id`
- `INDEX` `idx_call_disputes_status`: `workspace_id`, `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `call_flows`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `phone_number_id` | `int(11)` | YES | `NULL` | MUL |  |
| `status` | `enum('draft','active','paused')` | YES | `'draft'` | MUL |  |
| `nodes` | `longtext` | YES | `NULL` |  |  |
| `edges` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `call_flows_ibfk_1`)
- `workspace_id` -> `workspaces.id` (Constraint: `call_flows_ibfk_2`)
- `phone_number_id` -> `phone_numbers.id` (Constraint: `call_flows_ibfk_3`)

**Indexes:**
- `INDEX` `idx_phone_number_id`: `phone_number_id`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_user_id`: `user_id`
- `INDEX` `idx_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `call_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `campaign_id` | `int(11)` | YES | `NULL` | MUL |  |
| `agent_id` | `int(11)` | YES | `NULL` | MUL |  |
| `phone_number` | `varchar(50)` | NO | `NULL` |  |  |
| `direction` | `varchar(20)` | NO | `'outbound'` | MUL |  |
| `status` | `varchar(32)` | NO | `'pending'` | MUL |  |
| `duration` | `int(11)` | NO | `0` |  |  |
| `disposition` | `varchar(100)` | YES | `NULL` |  |  |
| `call_outcome` | `varchar(50)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `recording_url` | `varchar(500)` | YES | `NULL` |  |  |
| `started_at` | `datetime` | YES | `NULL` |  |  |
| `ended_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` | MUL |  |
| `call_duration` | `int(11)` | YES | `0` |  |  |
| `call_cost` | `decimal(10,4)` | YES | `0.0000` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `is_handled` | `tinyint(1)` | NO | `0` | MUL |  |
| `is_qualified` | `tinyint(1)` | YES | `0` |  |  |
| `is_billed` | `tinyint(1)` | YES | `0` |  |  |
| `billed_at` | `datetime` | YES | `NULL` |  |  |
| `credit_transaction_id` | `int(11)` | YES | `NULL` |  |  |
| `billing_price` | `decimal(10,2)` | YES | `NULL` |  |  |
| `billing_status` | `enum('pending','billed','disputed','refunded','waived')` | YES | `'pending'` |  |  |
| `dispute_reason` | `text` | YES | `NULL` |  |  |
| `disputed_at` | `datetime` | YES | `NULL` |  |  |
| `refunded_at` | `datetime` | YES | `NULL` |  |  |

**Foreign Keys:**
- `agent_id` -> `call_agents.id` (Constraint: `call_logs_ibfk_1`)
- `agent_id` -> `call_agents.id` (Constraint: `call_logs_ibfk_2`)

**Indexes:**
- `INDEX` `agent_id`: `agent_id`
- `INDEX` `campaign_id`: `campaign_id`
- `INDEX` `idx_call_logs_billing`: `workspace_id`, `billing_status`
- `INDEX` `idx_call_logs_campaign`: `campaign_id`
- `INDEX` `idx_call_logs_created`: `created_at`
- `INDEX` `idx_call_logs_direction`: `direction`
- `INDEX` `idx_call_logs_is_handled`: `is_handled`
- `INDEX` `idx_call_logs_qualified`: `workspace_id`, `is_qualified`, `is_billed`
- `INDEX` `idx_call_logs_status`: `status`
- `INDEX` `idx_call_logs_workspace`: `workspace_id`
- `INDEX` `idx_call_logs_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `status`: `status`
- `INDEX` `user_id`: `user_id`

---
### Table: `call_performance_summary`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `summary_date` | `date` | NO | `NULL` |  |  |
| `total_calls` | `int(11)` | YES | `0` |  |  |
| `qualified_calls` | `int(11)` | YES | `0` |  |  |
| `total_duration_seconds` | `int(11)` | YES | `0` |  |  |
| `total_billed` | `decimal(10,2)` | YES | `0.00` |  |  |
| `total_refunded` | `decimal(10,2)` | YES | `0.00` |  |  |
| `avg_call_duration_seconds` | `decimal(10,2)` | YES | `NULL` |  |  |
| `qualification_rate` | `decimal(5,2)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uq_performance_summary`: `workspace_id`, `company_id`, `summary_date`

---
### Table: `call_pricing_rules`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(191)` | YES | `NULL` |  |  |
| `service_category` | `varchar(100)` | YES | `NULL` |  |  |
| `region` | `varchar(100)` | YES | `NULL` |  |  |
| `postal_code` | `varchar(32)` | YES | `NULL` |  |  |
| `city` | `varchar(191)` | YES | `NULL` |  |  |
| `day_of_week` | `set('mon','tue','wed','thu','fri','sat','sun')` | YES | `NULL` |  |  |
| `time_start` | `time` | YES | `NULL` |  |  |
| `time_end` | `time` | YES | `NULL` |  |  |
| `is_emergency` | `tinyint(1)` | YES | `NULL` |  |  |
| `base_price` | `decimal(10,2)` | NO | `25.00` |  |  |
| `multiplier` | `decimal(4,2)` | YES | `1.00` |  |  |
| `priority` | `int(11)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_call_pricing_workspace`: `workspace_id`, `is_active`, `priority`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `call_recipients`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `campaign_id` | `int(11)` | YES | `NULL` | MUL |  |
| `phone_number` | `varchar(20)` | NO | `NULL` | MUL |  |
| `first_name` | `varchar(255)` | YES | `NULL` |  |  |
| `last_name` | `varchar(255)` | YES | `NULL` |  |  |
| `email` | `varchar(255)` | YES | `NULL` |  |  |
| `company` | `varchar(255)` | YES | `NULL` |  |  |
| `tags` | `text` | YES | `NULL` |  |  |
| `status` | `varchar(50)` | NO | `'pending'` |  |  |
| `priority` | `varchar(50)` | YES | `'normal'` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `disposition_id` | `varchar(100)` | YES | `NULL` |  |  |
| `last_called_at` | `datetime` | YES | `NULL` |  |  |
| `call_count` | `int(11)` | YES | `0` |  |  |
| `last_call_at` | `timestamp` | YES | `NULL` |  |  |
| `successful_calls` | `int(11)` | YES | `0` |  |  |
| `last_disposition` | `varchar(255)` | YES | `NULL` |  |  |
| `dnc_status` | `tinyint(1)` | YES | `0` |  |  |
| `consent_status` | `varchar(50)` | YES | `'unknown'` |  |  |
| `consent_date` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Indexes:**
- `INDEX` `idx_call_recipients_campaign`: `campaign_id`
- `INDEX` `idx_call_recipients_campaign_id`: `campaign_id`
- `INDEX` `idx_call_recipients_phone`: `phone_number`
- `INDEX` `idx_call_recipients_user_id`: `user_id`
- `INDEX` `idx_call_recipients_user_status`: `user_id`, `status`
- `INDEX` `idx_call_recipients_workspace`: `workspace_id`
- `INDEX` `idx_call_recipients_workspace_id`: `workspace_id`
- `INDEX` `idx_campaign_status`: `campaign_id`, `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `call_recordings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `call_id` | `int(11)` | NO | `NULL` | MUL |  |
| `recording_sid` | `varchar(255)` | NO | `NULL` | MUL |  |
| `recording_url` | `text` | YES | `NULL` |  |  |
| `status` | `varchar(50)` | YES | `'completed'` |  |  |
| `duration` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_call_id`: `call_id`
- `INDEX` `idx_recording_sid`: `recording_sid`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `call_routing_rules`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `phone_number_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `priority` | `int(11)` | NO | `0` |  |  |
| `is_active` | `tinyint(1)` | NO | `1` |  |  |
| `condition_type` | `enum('always','time_based','caller_id','ivr_selection')` | NO | `'always'` |  |  |
| `condition_data` | `longtext` | YES | `NULL` |  |  |
| `action_type` | `enum('forward','voicemail','ivr','queue','hangup','play_message')` | NO | `'forward'` |  |  |
| `forward_to` | `varchar(50)` | YES | `NULL` |  |  |
| `voicemail_greeting_url` | `varchar(500)` | YES | `NULL` |  |  |
| `ivr_menu_id` | `int(11)` | YES | `NULL` |  |  |
| `play_message_url` | `varchar(500)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_routing_phone`: `phone_number_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `call_scripts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `script` | `text` | NO | `NULL` |  |  |
| `category` | `varchar(100)` | YES | `NULL` |  |  |
| `variables` | `text` | YES | `NULL` |  |  |
| `is_favorite` | `tinyint(1)` | YES | `0` |  |  |
| `usage_count` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `tags` | `text` | YES | `NULL` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_call_scripts_company`: `workspace_id`, `company_id`
- `INDEX` `idx_call_scripts_user_category`: `user_id`, `category`
- `INDEX` `idx_call_scripts_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `call_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | UNI |  |
| `data` | `text` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_user_settings`: `user_id`

---
### Table: `call_speed_dials`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `label` | `varchar(100)` | NO | `NULL` |  |  |
| `phone_number` | `varchar(32)` | NO | `NULL` |  |  |
| `notes` | `varchar(255)` | YES | `NULL` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `metadata` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_speed_dial_user_order`: `user_id`, `sort_order`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_speed_dial_per_user`: `user_id`, `label`

---
### Table: `call_transcriptions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `call_id` | `int(11)` | NO | `NULL` | MUL |  |
| `text` | `longtext` | YES | `NULL` |  |  |
| `speakers` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('pending','processing','completed','failed')` | YES | `'pending'` | MUL |  |
| `failure_reason` | `text` | YES | `NULL` |  |  |
| `duration_seconds` | `int(11)` | YES | `NULL` |  |  |
| `word_count` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_transcriptions_call`: `call_id`
- `INDEX` `idx_transcriptions_status`: `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `calls`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `to_number` | `varchar(50)` | NO | `NULL` |  |  |
| `from_number` | `varchar(50)` | YES | `NULL` |  |  |
| `call_sid` | `varchar(255)` | YES | `NULL` |  |  |
| `status` | `varchar(50)` | YES | `'initiated'` | MUL |  |
| `duration` | `int(11)` | YES | `0` |  |  |
| `outcome` | `varchar(255)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `contact_id` | `int(11)` | YES | `NULL` |  |  |
| `answered_at` | `datetime` | YES | `NULL` |  |  |
| `ended_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` | MUL |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `campaign_flows`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `status` | `enum('draft','active','paused')` | YES | `'draft'` | MUL |  |
| `nodes` | `longtext` | YES | `NULL` |  |  |
| `automation_id` | `varchar(100)` | YES | `NULL` | MUL |  |
| `recipe_id` | `int(11)` | YES | `NULL` | MUL |  |
| `flow_type` | `enum('campaign','automation')` | YES | `'campaign'` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `user_id` | `int(11)` | YES | `1` | MUL |  |

**Indexes:**
- `INDEX` `idx_automation`: `automation_id`
- `INDEX` `idx_flows_automation`: `automation_id`
- `INDEX` `idx_flow_type`: `flow_type`
- `INDEX` `idx_recipe`: `recipe_id`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `campaign_send_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `campaign_id` | `int(11)` | NO | `NULL` | MUL |  |
| `campaign_type` | `enum('email','sms')` | NO | `NULL` |  |  |
| `send_mode` | `enum('immediate','scheduled','timezone_optimized','ai_optimized')` | YES | `'immediate'` |  |  |
| `scheduled_time` | `datetime` | YES | `NULL` |  |  |
| `timezone_mode` | `enum('sender','recipient','specific')` | YES | `'sender'` |  |  |
| `specific_timezone` | `varchar(50)` | YES | `NULL` |  |  |
| `send_window_start` | `time` | YES | `'09:00:00'` |  |  |
| `send_window_end` | `time` | YES | `'18:00:00'` |  |  |
| `exclude_weekends` | `tinyint(1)` | YES | `0` |  |  |
| `throttle_per_hour` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_campaign`: `campaign_id`, `campaign_type`

---
### Table: `campaigns`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `group_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `type` | `varchar(50)` | YES | `'email'` |  |  |
| `subject` | `varchar(500)` | NO | `NULL` |  |  |
| `html_content` | `text` | NO | `NULL` |  |  |
| `status` | `varchar(50)` | NO | `NULL` | MUL |  |
| `sending_account_id` | `int(11)` | YES | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `scheduled_at` | `timestamp` | YES | `NULL` |  |  |
| `total_recipients` | `int(11)` | NO | `0` |  |  |
| `sent` | `int(11)` | NO | `0` |  |  |
| `opens` | `int(11)` | NO | `0` |  |  |
| `clicks` | `int(11)` | NO | `0` |  |  |
| `bounces` | `int(11)` | NO | `0` |  |  |
| `unsubscribes` | `int(11)` | NO | `0` |  |  |
| `folder_id` | `int(11)` | YES | `NULL` | MUL |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `sequence_id` | `int(11)` | YES | `NULL` | MUL |  |
| `sequence_mode` | `varchar(32)` | YES | `'existing'` |  |  |
| `client_id` | `int(11)` | YES | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `campaign_type` | `enum('cold','warm')` | YES | `'warm'` |  |  |
| `stop_on_reply` | `tinyint(1)` | YES | `0` |  |  |
| `ab_test_id` | `int(11)` | YES | `NULL` | MUL |  |

**Foreign Keys:**
- `group_id` -> `groups.id` (Constraint: `campaigns_ibfk_1`)

**Indexes:**
- `INDEX` `folder_id`: `folder_id`
- `INDEX` `group_id`: `group_id`
- `INDEX` `group_id_2`: `group_id`
- `INDEX` `idx_campaigns_ab_test_id`: `ab_test_id`
- `INDEX` `idx_campaigns_client_id`: `client_id`
- `INDEX` `idx_campaigns_company`: `workspace_id`, `company_id`
- `INDEX` `idx_campaigns_company_id`: `company_id`
- `INDEX` `idx_campaigns_created`: `created_at`
- `INDEX` `idx_campaigns_sequence_id`: `sequence_id`
- `INDEX` `idx_campaigns_status`: `status`
- `INDEX` `idx_campaigns_user`: `user_id`
- `INDEX` `idx_campaigns_workspace`: `workspace_id`
- `INDEX` `idx_campaigns_workspace_company`: `workspace_id`, `company_id`
- `INDEX` `idx_campaigns_workspace_created`: `workspace_id`, `created_at`
- `INDEX` `idx_campaigns_workspace_id`: `workspace_id`
- `INDEX` `idx_campaigns_workspace_status`: `workspace_id`, `company_id`, `status`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `sending_account_id`: `sending_account_id`
- `INDEX` `user_id`: `user_id`

---
### Table: `candidates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `first_name` | `varchar(100)` | YES | `NULL` |  |  |
| `last_name` | `varchar(100)` | YES | `NULL` |  |  |
| `email` | `varchar(255)` | NO | `NULL` | MUL |  |
| `phone` | `varchar(50)` | YES | `NULL` |  |  |
| `linkedin_url` | `varchar(500)` | YES | `NULL` |  |  |
| `portfolio_url` | `varchar(500)` | YES | `NULL` |  |  |
| `current_company` | `varchar(255)` | YES | `NULL` |  |  |
| `current_title` | `varchar(255)` | YES | `NULL` |  |  |
| `years_of_experience` | `int(11)` | YES | `NULL` |  |  |
| `skills` | `text` | YES | `NULL` |  |  |
| `education` | `text` | YES | `NULL` |  |  |
| `source` | `enum('direct','referral','linkedin','indeed','glassdoor','agency','other')` | YES | `'direct'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `candidates_ibfk_1`)

**Indexes:**
- `INDEX` `idx_email`: `email`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_candidate_email`: `workspace_id`, `email`

---
### Table: `canned_responses`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `team_id` | `int(11)` | YES | `NULL` |  |  |
| `user_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `shortcut` | `varchar(50)` | YES | `NULL` |  |  |
| `subject` | `varchar(255)` | YES | `NULL` |  |  |
| `content` | `text` | NO | `NULL` |  |  |
| `content_html` | `text` | YES | `NULL` |  |  |
| `usage_count` | `int(11)` | YES | `0` |  |  |
| `last_used_at` | `timestamp` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_canned_responses_shortcut`: `workspace_id`, `shortcut`
- `INDEX` `idx_canned_responses_workspace`: `workspace_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `channel_accounts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `channel` | `varchar(50)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `status` | `enum('active','inactive','pending','error','disconnected')` | YES | `'pending'` | MUL |  |
| `status_message` | `text` | YES | `NULL` |  |  |
| `provider` | `varchar(50)` | YES | `'meta'` |  |  |
| `credentials` | `longtext` | YES | `NULL` |  |  |
| `external_id` | `varchar(255)` | YES | `NULL` |  |  |
| `external_name` | `varchar(255)` | YES | `NULL` |  |  |
| `webhook_verify_token` | `varchar(255)` | YES | `NULL` |  |  |
| `webhook_secret` | `varchar(255)` | YES | `NULL` |  |  |
| `webhook_url` | `varchar(500)` | YES | `NULL` |  |  |
| `last_webhook_at` | `datetime` | YES | `NULL` |  |  |
| `daily_limit` | `int(11)` | YES | `1000` |  |  |
| `hourly_limit` | `int(11)` | YES | `100` |  |  |
| `sent_today` | `int(11)` | YES | `0` |  |  |
| `sent_this_hour` | `int(11)` | YES | `0` |  |  |
| `last_reset_date` | `date` | YES | `NULL` |  |  |
| `last_reset_hour` | `datetime` | YES | `NULL` |  |  |
| `quality_rating` | `varchar(50)` | YES | `NULL` |  |  |
| `messaging_tier` | `varchar(50)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_channel_accounts_channel`: `channel`
- `UNIQUE` `idx_channel_accounts_external`: `channel`, `external_id`
- `INDEX` `idx_channel_accounts_status`: `status`
- `INDEX` `idx_channel_accounts_user`: `user_id`
- `INDEX` `idx_channel_accounts_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `channel_conversations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `channel_account_id` | `int(11)` | NO | `NULL` | MUL |  |
| `channel` | `varchar(50)` | NO | `NULL` |  |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `participant_address` | `varchar(255)` | NO | `NULL` |  |  |
| `participant_name` | `varchar(255)` | YES | `NULL` |  |  |
| `status` | `enum('open','closed','pending','snoozed')` | YES | `'open'` | MUL |  |
| `unread_count` | `int(11)` | YES | `0` |  |  |
| `last_message_preview` | `text` | YES | `NULL` |  |  |
| `last_message_at` | `datetime` | YES | `NULL` | MUL |  |
| `last_message_direction` | `enum('outbound','inbound')` | YES | `NULL` |  |  |
| `window_expires_at` | `datetime` | YES | `NULL` |  |  |
| `can_send_template_only` | `tinyint(1)` | YES | `1` |  |  |
| `assigned_user_id` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `channel_account_id` -> `channel_accounts.id` (Constraint: `channel_conversations_ibfk_1`)

**Indexes:**
- `INDEX` `idx_channel_convos_account`: `channel_account_id`
- `INDEX` `idx_channel_convos_contact`: `contact_id`
- `INDEX` `idx_channel_convos_last_msg`: `last_message_at`
- `INDEX` `idx_channel_convos_status`: `status`
- `UNIQUE` `idx_channel_convos_unique`: `channel_account_id`, `participant_address`
- `INDEX` `idx_channel_convos_user`: `user_id`
- `INDEX` `idx_channel_convos_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `channel_messages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `channel_account_id` | `int(11)` | NO | `NULL` | MUL |  |
| `channel` | `varchar(50)` | NO | `NULL` | MUL |  |
| `direction` | `enum('outbound','inbound')` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `recipient_address` | `varchar(255)` | NO | `NULL` |  |  |
| `recipient_name` | `varchar(255)` | YES | `NULL` |  |  |
| `message_type` | `varchar(50)` | YES | `'text'` |  |  |
| `content` | `text` | YES | `NULL` |  |  |
| `template_id` | `int(11)` | YES | `NULL` |  |  |
| `template_name` | `varchar(255)` | YES | `NULL` |  |  |
| `template_variables` | `longtext` | YES | `NULL` |  |  |
| `media_url` | `varchar(500)` | YES | `NULL` |  |  |
| `media_type` | `varchar(50)` | YES | `NULL` |  |  |
| `media_id` | `varchar(255)` | YES | `NULL` |  |  |
| `status` | `enum('queued','sent','delivered','read','failed','received')` | YES | `'queued'` | MUL |  |
| `status_updated_at` | `datetime` | YES | `NULL` |  |  |
| `provider_message_id` | `varchar(255)` | YES | `NULL` | MUL |  |
| `provider_conversation_id` | `varchar(255)` | YES | `NULL` |  |  |
| `error_code` | `varchar(50)` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `retry_count` | `int(11)` | YES | `0` |  |  |
| `max_retries` | `int(11)` | YES | `3` |  |  |
| `next_retry_at` | `datetime` | YES | `NULL` |  |  |
| `automation_id` | `int(11)` | YES | `NULL` |  |  |
| `automation_execution_id` | `int(11)` | YES | `NULL` |  |  |
| `campaign_id` | `int(11)` | YES | `NULL` |  |  |
| `scheduled_at` | `datetime` | YES | `NULL` |  |  |
| `sent_at` | `datetime` | YES | `NULL` |  |  |
| `delivered_at` | `datetime` | YES | `NULL` |  |  |
| `read_at` | `datetime` | YES | `NULL` |  |  |
| `received_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` | MUL |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `channel_account_id` -> `channel_accounts.id` (Constraint: `channel_messages_ibfk_1`)

**Indexes:**
- `INDEX` `idx_channel_messages_account`: `channel_account_id`
- `INDEX` `idx_channel_messages_channel`: `channel`
- `INDEX` `idx_channel_messages_contact`: `contact_id`
- `INDEX` `idx_channel_messages_created`: `created_at`
- `INDEX` `idx_channel_messages_direction`: `direction`
- `INDEX` `idx_channel_messages_provider_id`: `provider_message_id`
- `INDEX` `idx_channel_messages_status`: `status`
- `INDEX` `idx_channel_messages_user`: `user_id`
- `INDEX` `idx_channel_messages_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `channel_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `channel` | `varchar(50)` | NO | `NULL` |  |  |
| `settings` | `longtext` | NO | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `idx_channel_settings_unique`: `workspace_id`, `channel`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `checkout_forms`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `form_type` | `enum('one-step','two-step','multi-step')` | YES | `'one-step'` |  |  |
| `products` | `longtext` | NO | `NULL` |  |  |
| `upsells` | `longtext` | YES | `NULL` |  |  |
| `downsells` | `longtext` | YES | `NULL` |  |  |
| `thank_you_page_url` | `varchar(500)` | YES | `NULL` |  |  |
| `redirect_url` | `varchar(500)` | YES | `NULL` |  |  |
| `custom_fields` | `longtext` | YES | `NULL` |  |  |
| `payment_methods` | `longtext` | YES | `NULL` |  |  |
| `shipping_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `tax_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `tax_rate` | `decimal(5,2)` | YES | `0.00` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_company`: `company_id`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `citation_sources`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `domain` | `varchar(255)` | NO | `NULL` | UNI |  |
| `category` | `enum('aggregator','local','industry','social','general')` | YES | `'general'` | MUL |  |
| `description` | `text` | YES | `NULL` |  |  |
| `domain_authority` | `int(11)` | YES | `NULL` |  |  |
| `monthly_traffic` | `int(11)` | YES | `NULL` |  |  |
| `is_free` | `tinyint(1)` | YES | `0` |  |  |
| `submission_type` | `enum('api','manual','aggregator')` | YES | `'manual'` |  |  |
| `submission_url` | `varchar(500)` | YES | `NULL` |  |  |
| `avg_approval_days` | `int(11)` | YES | `NULL` |  |  |
| `countries` | `longtext` | YES | `NULL` |  |  |
| `industries` | `longtext` | YES | `NULL` |  |  |
| `priority` | `int(11)` | YES | `0` | MUL |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_citation_sources_category`: `category`, `is_active`
- `INDEX` `idx_citation_sources_priority`: `priority`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_citation_source_domain`: `domain`

---
### Table: `client_accounts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `agency_user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `slug` | `varchar(100)` | NO | `NULL` |  |  |
| `logo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `primary_color` | `varchar(7)` | YES | `'#FF6B00'` |  |  |
| `domain` | `varchar(255)` | YES | `NULL` |  |  |
| `industry` | `varchar(100)` | YES | `NULL` |  |  |
| `website` | `varchar(500)` | YES | `NULL` |  |  |
| `contact_email` | `varchar(255)` | YES | `NULL` |  |  |
| `contact_phone` | `varchar(50)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `status` | `enum('active','paused','archived')` | YES | `'active'` |  |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `agency_user_id` -> `users.id` (Constraint: `client_accounts_ibfk_1`)

**Indexes:**
- `INDEX` `idx_agency_user`: `agency_user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_agency_slug`: `agency_user_id`, `slug`

---
### Table: `client_communications`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `communication_type` | `enum('email','sms','call','meeting','note','system')` | NO | `NULL` | MUL |  |
| `direction` | `enum('inbound','outbound','internal')` | YES | `'outbound'` |  |  |
| `subject` | `varchar(255)` | YES | `NULL` |  |  |
| `content` | `text` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Foreign Keys:**
- `company_id` -> `companies.id` (Constraint: `client_communications_ibfk_1`)
- `contact_id` -> `recipients.id` (Constraint: `client_communications_ibfk_2`)

**Indexes:**
- `INDEX` `company_id`: `company_id`
- `INDEX` `idx_contact`: `contact_id`
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_type`: `communication_type`
- `INDEX` `idx_workspace_company`: `workspace_id`, `company_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `client_errors`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `type` | `varchar(50)` | NO | `NULL` |  |  |
| `message` | `text` | NO | `NULL` |  |  |
| `stack` | `text` | YES | `NULL` |  |  |
| `url` | `varchar(2048)` | YES | `NULL` |  |  |
| `user_id` | `int(11)` | YES | `NULL` | MUL |  |
| `user_agent` | `varchar(255)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `client_files`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` | MUL |  |
| `property_id` | `int(11)` | YES | `NULL` | MUL |  |
| `file_name` | `varchar(255)` | NO | `NULL` |  |  |
| `file_path` | `varchar(500)` | NO | `NULL` |  |  |
| `file_size` | `int(11)` | YES | `NULL` |  |  |
| `file_type` | `varchar(100)` | YES | `NULL` |  |  |
| `mime_type` | `varchar(100)` | YES | `NULL` |  |  |
| `uploaded_by` | `int(11)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `company_id` -> `companies.id` (Constraint: `client_files_ibfk_1`)
- `property_id` -> `client_properties.id` (Constraint: `client_files_ibfk_2`)

**Indexes:**
- `INDEX` `company_id`: `company_id`
- `INDEX` `idx_property`: `property_id`
- `INDEX` `idx_workspace_company`: `workspace_id`, `company_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `client_portal_access`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `company_id` | `int(11)` | NO | `NULL` | MUL |  |
| `email` | `varchar(255)` | NO | `NULL` |  |  |
| `name` | `varchar(255)` | YES | `NULL` |  |  |
| `password_hash` | `varchar(255)` | YES | `NULL` |  |  |
| `magic_link_token` | `varchar(100)` | YES | `NULL` | MUL |  |
| `magic_link_expires_at` | `datetime` | YES | `NULL` |  |  |
| `last_login_at` | `datetime` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | NO | `1` |  |  |
| `permissions` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `company_id` -> `companies.id` (Constraint: `client_portal_access_ibfk_1`)

**Indexes:**
- `INDEX` `idx_client_portal_company`: `company_id`
- `INDEX` `idx_client_portal_token`: `magic_link_token`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_client_portal_email`: `company_id`, `email`

---
### Table: `client_portal_sessions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |
| `company_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` |  |  |
| `session_token` | `varchar(255)` | NO | `NULL` | UNI |  |
| `admin_user_id` | `int(11)` | NO | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `expires_at` | `datetime` | NO | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `company_id` -> `companies.id` (Constraint: `client_portal_sessions_ibfk_1`)

**Indexes:**
- `INDEX` `idx_company`: `company_id`
- `INDEX` `idx_expires`: `expires_at`
- `INDEX` `idx_token`: `session_token`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `session_token`: `session_token`

---
### Table: `client_properties`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` | MUL |  |
| `property_type` | `enum('residential','commercial','industrial','other')` | YES | `'residential'` |  |  |
| `street1` | `varchar(255)` | YES | `NULL` |  |  |
| `street2` | `varchar(255)` | YES | `NULL` |  |  |
| `city` | `varchar(100)` | YES | `NULL` |  |  |
| `state` | `varchar(100)` | YES | `NULL` |  |  |
| `postal_code` | `varchar(20)` | YES | `NULL` |  |  |
| `country` | `varchar(100)` | YES | `'United States'` |  |  |
| `tax_rate` | `decimal(5,2)` | YES | `0.00` |  |  |
| `is_primary` | `tinyint(1)` | YES | `0` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `custom_fields` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `company_id` -> `companies.id` (Constraint: `client_properties_ibfk_1`)

**Indexes:**
- `INDEX` `idx_company`: `company_id`
- `INDEX` `idx_workspace_company`: `workspace_id`, `company_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `client_user_access`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `client_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `role` | `enum('owner','admin','member','viewer')` | YES | `'member'` |  |  |
| `permissions` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Foreign Keys:**
- `client_id` -> `client_accounts.id` (Constraint: `client_user_access_ibfk_1`)
- `user_id` -> `users.id` (Constraint: `client_user_access_ibfk_2`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_client_user`: `client_id`, `user_id`
- `INDEX` `user_id`: `user_id`

---
### Table: `clock_records`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `clock_type` | `enum('clock_in','clock_out','break_start','break_end')` | NO | `NULL` |  |  |
| `clock_time` | `datetime` | NO | `NULL` |  |  |
| `latitude` | `decimal(10,8)` | YES | `NULL` |  |  |
| `longitude` | `decimal(11,8)` | YES | `NULL` |  |  |
| `location_name` | `varchar(255)` | YES | `NULL` |  |  |
| `device_type` | `varchar(50)` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `photo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_clock_records_user`: `user_id`, `clock_time`
- `INDEX` `idx_clock_records_workspace`: `workspace_id`, `clock_time`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `cohort_analysis`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `cohort_date` | `date` | NO | `NULL` | MUL |  |
| `cohort_type` | `enum('signup','first_purchase','campaign')` | NO | `NULL` | MUL |  |
| `cohort_size` | `int(11)` | NO | `NULL` |  |  |
| `period_number` | `int(11)` | NO | `NULL` |  |  |
| `retained_count` | `int(11)` | NO | `NULL` |  |  |
| `retention_rate` | `decimal(5,2)` | NO | `NULL` |  |  |
| `revenue` | `decimal(10,2)` | YES | `0.00` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_cohort_date`: `cohort_date`
- `INDEX` `idx_type`: `cohort_type`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_cohort`: `workspace_id`, `cohort_date`, `cohort_type`, `period_number`

---
### Table: `commission_plans`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `plan_type` | `enum('percentage','tiered','flat','custom')` | YES | `'percentage'` |  |  |
| `base_rate` | `decimal(5,2)` | YES | `NULL` |  |  |
| `tiers` | `longtext` | YES | `NULL` |  |  |
| `flat_amount` | `decimal(10,2)` | YES | `NULL` |  |  |
| `applies_to` | `enum('revenue','profit','deals_closed','appointments','custom')` | YES | `'revenue'` |  |  |
| `calculation_period` | `enum('per_transaction','weekly','biweekly','monthly','quarterly')` | YES | `'monthly'` |  |  |
| `minimum_threshold` | `decimal(12,2)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_commission_plans`: `workspace_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `commission_summaries`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `period_type` | `enum('weekly','biweekly','monthly','quarterly','yearly')` | NO | `NULL` |  |  |
| `period_start` | `date` | NO | `NULL` |  |  |
| `period_end` | `date` | NO | `NULL` |  |  |
| `total_base_amount` | `decimal(12,2)` | YES | `0.00` |  |  |
| `total_commission` | `decimal(12,2)` | YES | `0.00` |  |  |
| `transactions_count` | `int(11)` | YES | `0` |  |  |
| `status` | `enum('calculated','approved','paid')` | YES | `'calculated'` |  |  |
| `calculated_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_commission_summaries`: `workspace_id`, `period_start`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_user_period`: `user_id`, `period_type`, `period_start`

---
### Table: `commissions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `commission_plan_id` | `int(11)` | YES | `NULL` |  |  |
| `period_start` | `date` | NO | `NULL` |  |  |
| `period_end` | `date` | NO | `NULL` |  |  |
| `source_type` | `varchar(50)` | YES | `NULL` | MUL |  |
| `source_id` | `int(11)` | YES | `NULL` |  |  |
| `source_description` | `varchar(255)` | YES | `NULL` |  |  |
| `base_amount` | `decimal(12,2)` | NO | `NULL` |  |  |
| `commission_rate` | `decimal(5,2)` | YES | `NULL` |  |  |
| `commission_amount` | `decimal(12,2)` | NO | `NULL` |  |  |
| `status` | `enum('pending','approved','paid','cancelled')` | YES | `'pending'` |  |  |
| `approved_by` | `int(11)` | YES | `NULL` |  |  |
| `approved_at` | `timestamp` | YES | `NULL` |  |  |
| `paid_at` | `timestamp` | YES | `NULL` |  |  |
| `payroll_id` | `int(11)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_commissions_source`: `source_type`, `source_id`
- `INDEX` `idx_commissions_user`: `user_id`, `period_start`
- `INDEX` `idx_commissions_workspace`: `workspace_id`, `status`, `period_start`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `companies`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` | MUL |  |
| `domain` | `varchar(255)` | YES | `NULL` | MUL |  |
| `industry` | `varchar(100)` | YES | `NULL` | MUL |  |
| `size` | `varchar(50)` | YES | `NULL` |  |  |
| `annual_revenue` | `varchar(50)` | YES | `NULL` |  |  |
| `phone` | `varchar(50)` | YES | `NULL` |  |  |
| `email` | `varchar(255)` | YES | `NULL` |  |  |
| `lead_source` | `varchar(100)` | YES | `NULL` |  |  |
| `website` | `varchar(255)` | YES | `NULL` |  |  |
| `address` | `varchar(255)` | YES | `NULL` |  |  |
| `city` | `varchar(100)` | YES | `NULL` |  |  |
| `state` | `varchar(100)` | YES | `NULL` |  |  |
| `country` | `varchar(100)` | YES | `NULL` |  |  |
| `postal_code` | `varchar(20)` | YES | `NULL` |  |  |
| `linkedin` | `varchar(255)` | YES | `NULL` |  |  |
| `twitter` | `varchar(255)` | YES | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `logo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `status` | `enum('active','inactive','prospect','customer','churned')` | YES | `'active'` | MUL |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `is_client` | `tinyint(1)` | NO | `1` |  |  |
| `client_since` | `date` | YES | `NULL` |  |  |
| `monthly_retainer` | `decimal(10,2)` | YES | `NULL` |  |  |
| `billing_email` | `varchar(255)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `archived_at` | `datetime` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_companies_archived`: `workspace_id`, `archived_at`
- `INDEX` `idx_companies_domain`: `domain`
- `INDEX` `idx_companies_industry`: `industry`
- `INDEX` `idx_companies_is_client`: `workspace_id`, `is_client`
- `INDEX` `idx_companies_name`: `name`
- `INDEX` `idx_companies_status`: `status`
- `INDEX` `idx_companies_user`: `user_id`
- `INDEX` `idx_companies_workspace`: `workspace_id`
- `INDEX` `idx_companies_workspace_client`: `workspace_id`, `is_client`
- `INDEX` `idx_companies_workspace_created`: `workspace_id`, `created_at`
- `INDEX` `idx_companies_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `company_activities`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `company_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `activity_type` | `enum('note','email','call','meeting','task','deal','status_change')` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_ca_company`: `company_id`
- `INDEX` `idx_ca_created`: `created_at`
- `INDEX` `idx_ca_type`: `activity_type`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`

---
### Table: `company_assets`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `asset_name` | `varchar(255)` | NO | `NULL` |  |  |
| `asset_type` | `enum('laptop','phone','tablet','monitor','peripheral','other')` | NO | `NULL` |  |  |
| `serial_number` | `varchar(100)` | YES | `NULL` |  |  |
| `purchase_date` | `date` | YES | `NULL` |  |  |
| `purchase_price` | `decimal(15,2)` | YES | `NULL` |  |  |
| `assigned_to` | `int(11)` | YES | `NULL` |  |  |
| `assigned_date` | `date` | YES | `NULL` |  |  |
| `condition_status` | `enum('new','good','fair','poor','broken')` | YES | `'new'` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `workspace_id`: `workspace_id`, `assigned_to`

---
### Table: `company_notes`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `company_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `content` | `text` | NO | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_cn_company`: `company_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`

---
### Table: `company_tags`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `company_id` | `int(11)` | NO | `NULL` | MUL |  |
| `tag_id` | `int(11)` | NO | `NULL` | MUL |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_ct_company`: `company_id`
- `INDEX` `idx_ct_tag`: `tag_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_company_tag`: `company_id`, `tag_id`

---
### Table: `competitor_citations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `competitor_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `directory_name` | `varchar(100)` | NO | `NULL` |  |  |
| `directory_url` | `varchar(500)` | YES | `NULL` |  |  |
| `listing_url` | `varchar(500)` | YES | `NULL` |  |  |
| `business_name` | `varchar(255)` | YES | `NULL` |  |  |
| `address` | `varchar(500)` | YES | `NULL` |  |  |
| `phone` | `varchar(20)` | YES | `NULL` |  |  |
| `website` | `varchar(500)` | YES | `NULL` |  |  |
| `is_verified` | `tinyint(1)` | YES | `0` |  |  |
| `has_our_listing` | `tinyint(1)` | YES | `0` |  |  |
| `our_listing_id` | `int(11)` | YES | `NULL` |  |  |
| `priority` | `int(11)` | YES | `0` |  |  |
| `domain_authority` | `int(11)` | YES | `NULL` |  |  |
| `discovered_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `last_checked_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `competitor_id` -> `competitors.id` (Constraint: `competitor_citations_ibfk_1`)

**Indexes:**
- `INDEX` `idx_competitor_citations_competitor`: `competitor_id`
- `INDEX` `idx_competitor_citations_directory`: `workspace_id`, `directory_name`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `competitors`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `website` | `varchar(500)` | YES | `NULL` |  |  |
| `phone` | `varchar(20)` | YES | `NULL` |  |  |
| `address` | `varchar(500)` | YES | `NULL` |  |  |
| `city` | `varchar(100)` | YES | `NULL` |  |  |
| `state` | `varchar(100)` | YES | `NULL` |  |  |
| `postal_code` | `varchar(20)` | YES | `NULL` |  |  |
| `country` | `varchar(2)` | YES | `'US'` |  |  |
| `category` | `varchar(100)` | YES | `NULL` |  |  |
| `google_place_id` | `varchar(255)` | YES | `NULL` |  |  |
| `google_rating` | `decimal(2,1)` | YES | `NULL` |  |  |
| `google_reviews_count` | `int(11)` | YES | `0` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `status` | `enum('active','archived')` | YES | `'active'` |  |  |
| `last_analyzed_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_competitors_status`: `workspace_id`, `status`
- `INDEX` `idx_competitors_workspace`: `workspace_id`, `company_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `connections`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `varchar(36)` | NO | `NULL` | PRI |  |
| `user_id` | `varchar(36)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `provider` | `enum('signalwire','twilio','vonage')` | NO | `NULL` | MUL |  |
| `status` | `enum('active','inactive','error','testing')` | YES | `'inactive'` | MUL |  |
| `config` | `longtext` | NO | `NULL` |  |  |
| `phone_numbers` | `longtext` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `last_sync_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Indexes:**
- `INDEX` `idx_connections_workspace`: `workspace_id`
- `INDEX` `idx_connections_workspace_id`: `workspace_id`
- `INDEX` `idx_provider`: `provider`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `consent_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `recipient_id` | `int(11)` | YES | `NULL` | MUL |  |
| `phone_number` | `varchar(20)` | NO | `NULL` | MUL |  |
| `consent_type` | `varchar(50)` | NO | `NULL` |  |  |
| `action` | `varchar(50)` | NO | `NULL` |  |  |
| `source` | `varchar(255)` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_consent_logs_phone`: `phone_number`
- `INDEX` `idx_phone_consent`: `phone_number`, `consent_type`, `action`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `recipient_id`: `recipient_id`
- `INDEX` `user_id`: `user_id`

---
### Table: `consumer_financing_applications`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `contact_id` | `int(10) unsigned` | YES | `NULL` | MUL |  |
| `invoice_id` | `int(10) unsigned` | YES | `NULL` | MUL |  |
| `provider` | `enum('affirm','klarna','paypal_credit','other')` | NO | `NULL` | MUL |  |
| `application_id` | `varchar(255)` | YES | `NULL` |  |  |
| `amount` | `decimal(10,2)` | NO | `NULL` |  |  |
| `status` | `enum('pending','approved','declined','cancelled','completed')` | YES | `'pending'` | MUL |  |
| `approval_amount` | `decimal(10,2)` | YES | `NULL` |  |  |
| `term_months` | `int(11)` | YES | `NULL` |  |  |
| `interest_rate` | `decimal(5,2)` | YES | `NULL` |  |  |
| `monthly_payment` | `decimal(10,2)` | YES | `NULL` |  |  |
| `application_data` | `longtext` | YES | `NULL` |  |  |
| `applied_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `approved_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_contact`: `contact_id`
- `INDEX` `idx_invoice`: `invoice_id`
- `INDEX` `idx_provider`: `provider`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `contact_channel_optins`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `channel` | `varchar(50)` | NO | `NULL` | MUL |  |
| `channel_address` | `varchar(255)` | NO | `NULL` |  |  |
| `status` | `enum('opted_in','opted_out','pending','unknown')` | YES | `'unknown'` | MUL |  |
| `consent_source` | `varchar(100)` | YES | `NULL` |  |  |
| `consent_text` | `text` | YES | `NULL` |  |  |
| `consent_ip` | `varchar(50)` | YES | `NULL` |  |  |
| `opted_in_at` | `datetime` | YES | `NULL` |  |  |
| `opted_out_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_optins_channel`: `channel`
- `INDEX` `idx_optins_contact`: `contact_id`
- `INDEX` `idx_optins_status`: `status`
- `UNIQUE` `idx_optins_unique`: `contact_id`, `channel`, `channel_address`
- `INDEX` `idx_optins_user`: `user_id`
- `INDEX` `idx_optins_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `contact_list_members`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `list_id` | `int(11)` | NO | `NULL` | MUL |  |
| `added_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `added_by` | `varchar(50)` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_clm_contact`: `contact_id`
- `INDEX` `idx_clm_list`: `list_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_contact_list`: `contact_id`, `list_id`

---
### Table: `contact_lists`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` | MUL |  |
| `description` | `text` | YES | `NULL` |  |  |
| `color` | `varchar(7)` | YES | `'#3b82f6'` |  |  |
| `icon` | `varchar(50)` | YES | `'users'` |  |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `contact_count` | `int(11)` | YES | `0` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_lists_name`: `name`
- `INDEX` `idx_lists_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_user_list_name`: `user_id`, `name`

---
### Table: `contact_notes`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | YES | `NULL` |  |  |
| `content` | `text` | NO | `NULL` |  |  |
| `is_pinned` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_notes_contact`: `contact_id`, `created_at`
- `INDEX` `idx_notes_pinned`: `contact_id`, `is_pinned`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `contact_outcomes`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `channel` | `varchar(50)` | NO | `NULL` | MUL |  |
| `campaign_id` | `int(11)` | YES | `NULL` |  |  |
| `outcome_type` | `varchar(100)` | NO | `NULL` | MUL |  |
| `outcome_data` | `longtext` | YES | `NULL` |  |  |
| `sentiment` | `varchar(50)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `recorded_by` | `varchar(50)` | YES | `'system'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `sentiment_score` | `int(11)` | YES | `NULL` |  |  |
| `sentiment_confidence` | `int(11)` | YES | `NULL` |  |  |
| `detected_intent` | `varchar(100)` | YES | `NULL` |  |  |
| `intent_confidence` | `int(11)` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_contact_outcomes_channel`: `channel`
- `INDEX` `idx_contact_outcomes_contact`: `contact_id`
- `INDEX` `idx_contact_outcomes_type`: `outcome_type`
- `INDEX` `idx_contact_outcomes_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `contact_recalls`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `contact_id` | `int(11)` | NO | `NULL` |  |  |
| `recall_schedule_id` | `int(11)` | YES | `NULL` | MUL |  |
| `service_id` | `int(11)` | YES | `NULL` |  |  |
| `last_service_date` | `date` | YES | `NULL` |  |  |
| `next_recall_date` | `date` | YES | `NULL` | MUL |  |
| `status` | `enum('upcoming','due','overdue','completed','cancelled','snoozed')` | YES | `'upcoming'` |  |  |
| `reminder_sent_at` | `datetime` | YES | `NULL` |  |  |
| `completed_at` | `datetime` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_contact_recalls_next_date`: `next_recall_date`, `status`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `recall_schedule_id`: `recall_schedule_id`

---
### Table: `contact_relationships`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `related_contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `relationship_type` | `varchar(50)` | NO | `NULL` |  |  |
| `is_bidirectional` | `tinyint(1)` | YES | `1` |  |  |
| `reverse_relationship_type` | `varchar(50)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_relationships_contact`: `contact_id`
- `INDEX` `idx_relationships_related`: `related_contact_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_relationship`: `contact_id`, `related_contact_id`, `relationship_type`

---
### Table: `contact_segment_members`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `segment_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `added_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `added_by` | `int(11)` | YES | `NULL` |  |  |

**Foreign Keys:**
- `segment_id` -> `contact_segments.id` (Constraint: `contact_segment_members_ibfk_1`)

**Indexes:**
- `INDEX` `idx_members_contact`: `contact_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_segment_contact`: `segment_id`, `contact_id`

---
### Table: `contact_segments`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `filters` | `longtext` | NO | `NULL` |  |  |
| `contact_count` | `int(11)` | YES | `0` |  |  |
| `last_calculated_at` | `timestamp` | YES | `NULL` |  |  |
| `color` | `varchar(7)` | YES | `'#6366f1'` |  |  |
| `icon` | `varchar(50)` | YES | `NULL` |  |  |
| `is_dynamic` | `tinyint(1)` | YES | `1` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_segments_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `contact_sentiment_tracking`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `contact_id` | `int(11)` | NO | `NULL` | UNI |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `overall_sentiment_score` | `int(11)` | YES | `NULL` |  |  |
| `sentiment_trend` | `varchar(20)` | YES | `NULL` | MUL |  |
| `last_sentiment` | `varchar(20)` | YES | `NULL` |  |  |
| `sentiment_change_flag` | `tinyint(1)` | YES | `0` | MUL |  |
| `interaction_count` | `int(11)` | YES | `0` |  |  |
| `last_analyzed_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `idx_contact_sentiment`: `contact_id`
- `INDEX` `idx_sentiment_flag`: `sentiment_change_flag`
- `INDEX` `idx_sentiment_trend`: `sentiment_trend`
- `INDEX` `idx_sentiment_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `contact_stages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(50)` | NO | `NULL` |  |  |
| `description` | `varchar(255)` | YES | `NULL` |  |  |
| `color` | `varchar(7)` | YES | `'#6366f1'` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `is_system` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_stages_workspace`: `workspace_id`, `sort_order`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_name`: `workspace_id`, `name`

---
### Table: `contact_tags`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `tag` | `varchar(100)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_contact_id`: `contact_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `contacts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `first_name` | `varchar(100)` | YES | `NULL` |  |  |
| `last_name` | `varchar(100)` | YES | `NULL` |  |  |
| `email` | `varchar(255)` | YES | `NULL` | MUL |  |
| `phone` | `varchar(50)` | YES | `NULL` | MUL |  |
| `whatsapp_number` | `varchar(50)` | YES | `NULL` | MUL |  |
| `whatsapp_opted_in` | `tinyint(1)` | YES | `0` |  |  |
| `messenger_psid` | `varchar(255)` | YES | `NULL` | MUL |  |
| `messenger_opted_in` | `tinyint(1)` | YES | `0` |  |  |
| `instagram_id` | `varchar(255)` | YES | `NULL` |  |  |
| `instagram_opted_in` | `tinyint(1)` | YES | `0` |  |  |
| `linkedin_url` | `varchar(500)` | YES | `NULL` | MUL |  |
| `linkedin_member_id` | `varchar(255)` | YES | `NULL` |  |  |
| `company` | `varchar(255)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` | MUL | on update current_timestamp() |
| `name` | `varchar(255)` | YES | `NULL` |  |  |
| `status` | `varchar(255)` | YES | `NULL` | MUL |  |
| `stage_id` | `int(11)` | YES | `NULL` | MUL |  |
| `lead_source_id` | `int(11)` | YES | `NULL` | MUL |  |
| `assigned_to` | `int(11)` | YES | `NULL` | MUL |  |
| `lifetime_value` | `decimal(12,2)` | YES | `0.00` |  |  |
| `last_contacted_at` | `timestamp` | YES | `NULL` |  |  |
| `next_followup_at` | `timestamp` | YES | `NULL` |  |  |
| `birthday` | `date` | YES | `NULL` |  |  |
| `anniversary` | `date` | YES | `NULL` |  |  |
| `preferred_contact_method` | `enum('email','phone','sms','any')` | YES | `'any'` |  |  |
| `do_not_contact` | `tinyint(1)` | YES | `0` |  |  |
| `rating` | `tinyint(4)` | YES | `NULL` |  |  |
| `score` | `int(11)` | YES | `0` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `client_id` | `int(11)` | YES | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Indexes:**
- `INDEX` `idx_contacts_assigned`: `assigned_to`
- `INDEX` `idx_contacts_client_id`: `client_id`
- `INDEX` `idx_contacts_created`: `created_at`
- `INDEX` `idx_contacts_email`: `email`
- `INDEX` `idx_contacts_followup`: `workspace_id`, `next_followup_at`
- `INDEX` `idx_contacts_linkedin`: `linkedin_url`
- `INDEX` `idx_contacts_messenger`: `messenger_psid`
- `INDEX` `idx_contacts_source`: `lead_source_id`
- `INDEX` `idx_contacts_stage`: `stage_id`
- `INDEX` `idx_contacts_status`: `status`
- `INDEX` `idx_contacts_updated`: `updated_at`
- `INDEX` `idx_contacts_whatsapp`: `whatsapp_number`
- `INDEX` `idx_contacts_workspace_id`: `workspace_id`
- `INDEX` `idx_email`: `email`
- `INDEX` `idx_phone`: `phone`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `conversation_messages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `1` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `conversation_id` | `int(11)` | NO | `NULL` | MUL |  |
| `channel` | `enum('sms','email','call','note','system','form','whatsapp')` | NO | `NULL` |  |  |
| `direction` | `enum('inbound','outbound','system')` | NO | `NULL` |  |  |
| `sender_type` | `enum('contact','user','system')` | NO | `NULL` |  |  |
| `sender_id` | `int(11)` | YES | `NULL` |  |  |
| `subject` | `varchar(500)` | YES | `NULL` |  |  |
| `body` | `text` | YES | `NULL` |  |  |
| `body_html` | `text` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `provider_message_id` | `varchar(255)` | YES | `NULL` |  |  |
| `status` | `enum('pending','sent','delivered','read','failed')` | YES | `'sent'` |  |  |
| `read_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `media_urls` | `longtext` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_messages_conversation`: `conversation_id`
- `INDEX` `idx_messages_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `conversations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `1` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `assigned_user_id` | `int(11)` | YES | `NULL` |  |  |
| `status` | `enum('open','pending','closed')` | YES | `'open'` |  |  |
| `unread_count` | `int(11)` | YES | `0` |  |  |
| `last_message_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |
| `channel` | `enum('email','sms','call','webchat','whatsapp','facebook','instagram','gmb','note')` | YES | `'email'` |  |  |
| `channel_identifier` | `varchar(255)` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_conversations_contact`: `contact_id`
- `INDEX` `idx_conversations_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `course_certificates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `course_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `enrollment_id` | `int(10) unsigned` | NO | `NULL` | UNI |  |
| `user_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `certificate_number` | `varchar(100)` | NO | `NULL` |  |  |
| `issued_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `pdf_url` | `varchar(500)` | YES | `NULL` |  |  |
| `verification_code` | `varchar(50)` | NO | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_course`: `course_id`
- `INDEX` `idx_enrollment`: `enrollment_id`
- `INDEX` `idx_user`: `user_id`
- `INDEX` `idx_verification`: `verification_code`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_certificate`: `enrollment_id`

---
### Table: `course_discussions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `course_id` | `int(11)` | NO | `NULL` | MUL |  |
| `lesson_id` | `int(11)` | YES | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `parent_id` | `int(11)` | YES | `NULL` | MUL |  |
| `title` | `varchar(255)` | YES | `NULL` |  |  |
| `content` | `text` | NO | `NULL` |  |  |
| `is_pinned` | `tinyint(1)` | YES | `0` |  |  |
| `is_resolved` | `tinyint(1)` | YES | `0` |  |  |
| `reply_count` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_discussion_course`: `course_id`
- `INDEX` `idx_discussion_lesson`: `lesson_id`
- `INDEX` `idx_discussion_parent`: `parent_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `course_enrollments`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `course_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `user_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `contact_id` | `int(10) unsigned` | YES | `NULL` | MUL |  |
| `workspace_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `status` | `enum('active','completed','cancelled','expired')` | YES | `'active'` | MUL |  |
| `progress_percentage` | `decimal(5,2)` | YES | `0.00` |  |  |
| `completed_lessons` | `int(11)` | YES | `0` |  |  |
| `total_lessons` | `int(11)` | YES | `0` |  |  |
| `last_accessed_at` | `timestamp` | YES | `NULL` |  |  |
| `started_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |
| `expires_at` | `timestamp` | YES | `NULL` |  |  |
| `payment_id` | `int(10) unsigned` | YES | `NULL` |  |  |
| `amount_paid` | `decimal(10,2)` | YES | `0.00` |  |  |
| `certificate_issued` | `tinyint(1)` | YES | `0` |  |  |
| `certificate_issued_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_contact`: `contact_id`
- `INDEX` `idx_course`: `course_id`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_user`: `user_id`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_enrollment`: `course_id`, `user_id`

---
### Table: `course_lessons`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `module_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `course_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `slug` | `varchar(255)` | NO | `NULL` |  |  |
| `content_type` | `enum('video','text','quiz','assignment','download','live_session')` | NO | `NULL` | MUL |  |
| `content` | `longtext` | YES | `NULL` |  |  |
| `video_url` | `varchar(500)` | YES | `NULL` |  |  |
| `video_duration` | `int(11)` | YES | `NULL` |  |  |
| `video_provider` | `enum('youtube','vimeo','wistia','self_hosted')` | YES | `NULL` |  |  |
| `attachments` | `longtext` | YES | `NULL` |  |  |
| `is_preview` | `tinyint(1)` | YES | `0` |  |  |
| `is_published` | `tinyint(1)` | YES | `1` |  |  |
| `order_index` | `int(11)` | YES | `0` | MUL |  |
| `estimated_duration` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_course`: `course_id`
- `INDEX` `idx_module`: `module_id`
- `INDEX` `idx_order`: `order_index`
- `INDEX` `idx_type`: `content_type`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `course_modules`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `course_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `order_index` | `int(11)` | YES | `0` | MUL |  |
| `is_published` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_course`: `course_id`
- `INDEX` `idx_order`: `order_index`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `course_quizzes`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `lesson_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `course_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `passing_score` | `int(11)` | YES | `70` |  |  |
| `time_limit` | `int(11)` | YES | `NULL` |  |  |
| `attempts_allowed` | `int(11)` | YES | `0` |  |  |
| `randomize_questions` | `tinyint(1)` | YES | `0` |  |  |
| `show_correct_answers` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_course`: `course_id`
- `INDEX` `idx_lesson`: `lesson_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `course_reviews`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `course_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `user_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `enrollment_id` | `int(10) unsigned` | NO | `NULL` |  |  |
| `rating` | `int(11)` | NO | `NULL` | MUL |  |
| `review_text` | `text` | YES | `NULL` |  |  |
| `is_published` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_course`: `course_id`
- `INDEX` `idx_rating`: `rating`
- `INDEX` `idx_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_review`: `course_id`, `user_id`

---
### Table: `courses`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `slug` | `varchar(255)` | NO | `NULL` | MUL |  |
| `description` | `text` | YES | `NULL` |  |  |
| `short_description` | `varchar(500)` | YES | `NULL` |  |  |
| `thumbnail_url` | `varchar(500)` | YES | `NULL` |  |  |
| `category` | `varchar(100)` | YES | `NULL` | MUL |  |
| `level` | `enum('beginner','intermediate','advanced','all_levels')` | YES | `'all_levels'` |  |  |
| `language` | `varchar(10)` | YES | `'en'` |  |  |
| `status` | `enum('draft','published','archived')` | YES | `'draft'` | MUL |  |
| `price` | `decimal(10,2)` | YES | `0.00` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `is_free` | `tinyint(1)` | YES | `0` |  |  |
| `duration_hours` | `decimal(5,2)` | YES | `NULL` |  |  |
| `total_lessons` | `int(11)` | YES | `0` |  |  |
| `total_students` | `int(11)` | YES | `0` |  |  |
| `rating_average` | `decimal(3,2)` | YES | `0.00` |  |  |
| `rating_count` | `int(11)` | YES | `0` |  |  |
| `certificate_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `drip_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `drip_days` | `int(11)` | YES | `NULL` |  |  |
| `prerequisites` | `text` | YES | `NULL` |  |  |
| `learning_outcomes` | `longtext` | YES | `NULL` |  |  |
| `instructor_id` | `int(10) unsigned` | YES | `NULL` | MUL |  |
| `published_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_category`: `category`
- `INDEX` `idx_instructor`: `instructor_id`
- `INDEX` `idx_slug`: `slug`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_slug`: `workspace_id`, `slug`

---
### Table: `credit_packages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(191)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `credits_amount` | `decimal(10,2)` | NO | `NULL` |  |  |
| `price` | `decimal(10,2)` | NO | `NULL` |  |  |
| `bonus_credits` | `decimal(10,2)` | YES | `0.00` |  |  |
| `discount_percent` | `decimal(5,2)` | YES | `0.00` |  |  |
| `is_popular` | `tinyint(1)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `stripe_price_id` | `varchar(100)` | YES | `NULL` |  |  |
| `paypal_plan_id` | `varchar(100)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_credit_packages`: `workspace_id`, `is_active`, `sort_order`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `credit_transactions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `wallet_id` | `int(11)` | NO | `NULL` |  |  |
| `lead_match_id` | `int(11)` | YES | `NULL` |  |  |
| `lead_request_id` | `int(11)` | YES | `NULL` |  |  |
| `type` | `enum('purchase','charge','refund','adjustment','bonus','promo')` | NO | `NULL` |  |  |
| `amount` | `decimal(10,2)` | NO | `NULL` |  |  |
| `balance_before` | `decimal(10,2)` | NO | `NULL` |  |  |
| `balance_after` | `decimal(10,2)` | NO | `NULL` |  |  |
| `description` | `varchar(255)` | YES | `NULL` |  |  |
| `payment_provider` | `enum('stripe','paypal','manual')` | YES | `NULL` | MUL |  |
| `payment_id` | `varchar(100)` | YES | `NULL` |  |  |
| `payment_status` | `enum('pending','completed','failed','refunded')` | YES | `NULL` |  |  |
| `invoice_id` | `varchar(100)` | YES | `NULL` |  |  |
| `promo_code` | `varchar(50)` | YES | `NULL` |  |  |
| `meta` | `longtext` | YES | `NULL` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_credit_transactions_company`: `workspace_id`, `company_id`, `created_at`
- `INDEX` `idx_credit_transactions_lead`: `workspace_id`, `lead_match_id`
- `INDEX` `idx_credit_transactions_payment`: `payment_provider`, `payment_id`
- `INDEX` `idx_credit_transactions_wallet`: `workspace_id`, `wallet_id`, `created_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `credits_wallets`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `balance` | `decimal(10,2)` | YES | `0.00` |  |  |
| `lifetime_purchased` | `decimal(10,2)` | YES | `0.00` |  |  |
| `lifetime_spent` | `decimal(10,2)` | YES | `0.00` |  |  |
| `lifetime_refunded` | `decimal(10,2)` | YES | `0.00` |  |  |
| `last_purchase_at` | `datetime` | YES | `NULL` |  |  |
| `last_charge_at` | `datetime` | YES | `NULL` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uq_credits_wallets`: `workspace_id`, `company_id`

---
### Table: `crm_automations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `trigger_type` | `varchar(50)` | NO | `NULL` | MUL |  |
| `trigger_config` | `longtext` | NO | `NULL` |  |  |
| `conditions` | `longtext` | YES | `NULL` |  |  |
| `actions` | `longtext` | NO | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` | MUL |  |
| `execution_count` | `int(11)` | YES | `0` |  |  |
| `last_executed_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_crm_automations_active`: `is_active`
- `INDEX` `idx_crm_automations_trigger`: `trigger_type`
- `INDEX` `idx_crm_automations_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `crm_dashboard`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `user_id` | `int(11)` | YES | `NULL` |  |  |
| `user_name` | `varchar(255)` | YES | `NULL` |  |  |
| `total_leads` | `bigint(21)` | YES | `NULL` |  |  |
| `new_leads` | `bigint(21)` | YES | `NULL` |  |  |
| `qualified_leads` | `bigint(21)` | YES | `NULL` |  |  |
| `won_deals` | `bigint(21)` | YES | `NULL` |  |  |
| `lost_deals` | `bigint(21)` | YES | `NULL` |  |  |
| `total_value` | `decimal(34,2)` | YES | `NULL` |  |  |
| `avg_lead_score` | `decimal(14,4)` | YES | `NULL` |  |  |
| `total_activities` | `bigint(21)` | YES | `NULL` |  |  |
| `activities_this_week` | `bigint(21)` | YES | `NULL` |  |  |

---
### Table: `crm_deal_products`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `deal_id` | `int(11)` | NO | `NULL` | MUL |  |
| `product_id` | `int(11)` | NO | `NULL` | MUL |  |
| `quantity` | `decimal(10,2)` | YES | `1.00` |  |  |
| `unit_price` | `decimal(15,2)` | NO | `NULL` |  |  |
| `discount_percent` | `decimal(5,2)` | YES | `0.00` |  |  |
| `discount_amount` | `decimal(15,2)` | YES | `0.00` |  |  |
| `tax_percent` | `decimal(5,2)` | YES | `0.00` |  |  |
| `tax_amount` | `decimal(15,2)` | YES | `0.00` |  |  |
| `total_amount` | `decimal(15,2)` | NO | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `deal_id` -> `deals.id` (Constraint: `crm_deal_products_ibfk_1`)
- `product_id` -> `crm_products.id` (Constraint: `crm_deal_products_ibfk_2`)

**Indexes:**
- `INDEX` `idx_deal_id`: `deal_id`
- `INDEX` `idx_product_id`: `product_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `crm_forecast_snapshots`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `forecast_id` | `int(11)` | NO | `NULL` | MUL |  |
| `snapshot_date` | `date` | NO | `NULL` | MUL |  |
| `expected_revenue` | `decimal(15,2)` | YES | `0.00` |  |  |
| `weighted_pipeline` | `decimal(15,2)` | YES | `0.00` |  |  |
| `confidence_score` | `decimal(5,2)` | YES | `0.00` |  |  |
| `pipeline_data` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `forecast_id` -> `crm_forecasts.id` (Constraint: `crm_forecast_snapshots_ibfk_1`)

**Indexes:**
- `INDEX` `idx_forecast_id`: `forecast_id`
- `INDEX` `idx_snapshot_date`: `snapshot_date`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `crm_forecasts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `forecast_period` | `enum('monthly','quarterly','yearly')` | NO | `'monthly'` |  |  |
| `period_start` | `date` | NO | `NULL` | MUL |  |
| `period_end` | `date` | NO | `NULL` |  |  |
| `expected_revenue` | `decimal(15,2)` | YES | `0.00` |  |  |
| `weighted_pipeline` | `decimal(15,2)` | YES | `0.00` |  |  |
| `best_case` | `decimal(15,2)` | YES | `0.00` |  |  |
| `worst_case` | `decimal(15,2)` | YES | `0.00` |  |  |
| `confidence_score` | `decimal(5,2)` | YES | `0.00` |  |  |
| `pipeline_data` | `longtext` | YES | `NULL` |  |  |
| `actual_revenue` | `decimal(15,2)` | YES | `0.00` |  |  |
| `deals_closed` | `int(11)` | YES | `0` |  |  |
| `calculation_method` | `enum('probability_weighted','historical_average','manual')` | YES | `'probability_weighted'` |  |  |
| `calculated_at` | `timestamp` | YES | `NULL` |  |  |
| `calculated_by` | `int(11)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_company_id`: `company_id`
- `INDEX` `idx_period`: `period_start`, `period_end`
- `INDEX` `idx_user_id`: `user_id`
- `INDEX` `idx_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `crm_goal_history`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `goal_id` | `int(11)` | NO | `NULL` | MUL |  |
| `field_name` | `varchar(100)` | NO | `NULL` |  |  |
| `old_value` | `varchar(255)` | YES | `NULL` |  |  |
| `new_value` | `varchar(255)` | YES | `NULL` |  |  |
| `changed_by` | `int(11)` | NO | `NULL` |  |  |
| `changed_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Foreign Keys:**
- `goal_id` -> `crm_goals.id` (Constraint: `crm_goal_history_ibfk_1`)

**Indexes:**
- `INDEX` `idx_changed_at`: `changed_at`
- `INDEX` `idx_goal_id`: `goal_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `crm_goals`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `goal_type` | `enum('daily','weekly','monthly','quarterly','yearly')` | NO | `'daily'` | MUL |  |
| `period_start` | `date` | NO | `NULL` | MUL |  |
| `period_end` | `date` | NO | `NULL` |  |  |
| `calls_goal` | `int(11)` | YES | `0` |  |  |
| `calls_completed` | `int(11)` | YES | `0` |  |  |
| `emails_goal` | `int(11)` | YES | `0` |  |  |
| `emails_completed` | `int(11)` | YES | `0` |  |  |
| `meetings_goal` | `int(11)` | YES | `0` |  |  |
| `meetings_completed` | `int(11)` | YES | `0` |  |  |
| `tasks_goal` | `int(11)` | YES | `0` |  |  |
| `tasks_completed` | `int(11)` | YES | `0` |  |  |
| `revenue_goal` | `decimal(15,2)` | YES | `0.00` |  |  |
| `revenue_achieved` | `decimal(15,2)` | YES | `0.00` |  |  |
| `deals_goal` | `int(11)` | YES | `0` |  |  |
| `deals_closed` | `int(11)` | YES | `0` |  |  |
| `leads_goal` | `int(11)` | YES | `0` |  |  |
| `leads_created` | `int(11)` | YES | `0` |  |  |
| `qualified_leads_goal` | `int(11)` | YES | `0` |  |  |
| `qualified_leads_achieved` | `int(11)` | YES | `0` |  |  |
| `status` | `enum('active','completed','failed','archived')` | YES | `'active'` | MUL |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_company_id`: `company_id`
- `INDEX` `idx_goal_type`: `goal_type`
- `INDEX` `idx_period`: `period_start`, `period_end`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_user_id`: `user_id`
- `INDEX` `idx_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `crm_playbook_usage`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `playbook_id` | `int(11)` | NO | `NULL` | MUL |  |
| `lead_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `started_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |
| `outcome` | `enum('won','lost','ongoing','abandoned')` | YES | `'ongoing'` | MUL |  |
| `deal_value` | `decimal(15,2)` | YES | `NULL` |  |  |
| `time_to_close` | `int(11)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |

**Foreign Keys:**
- `playbook_id` -> `crm_playbooks.id` (Constraint: `crm_playbook_usage_ibfk_1`)
- `lead_id` -> `leads.id` (Constraint: `crm_playbook_usage_ibfk_2`)

**Indexes:**
- `INDEX` `idx_lead_id`: `lead_id`
- `INDEX` `idx_outcome`: `outcome`
- `INDEX` `idx_playbook_id`: `playbook_id`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `crm_playbooks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `playbook_type` | `enum('prospecting','qualification','demo','negotiation','closing','custom')` | YES | `'custom'` | MUL |  |
| `target_persona` | `varchar(255)` | YES | `NULL` |  |  |
| `target_industry` | `varchar(255)` | YES | `NULL` |  |  |
| `deal_size_min` | `decimal(15,2)` | YES | `NULL` |  |  |
| `deal_size_max` | `decimal(15,2)` | YES | `NULL` |  |  |
| `steps` | `longtext` | YES | `NULL` |  |  |
| `email_templates` | `longtext` | YES | `NULL` |  |  |
| `call_scripts` | `longtext` | YES | `NULL` |  |  |
| `objection_handlers` | `longtext` | YES | `NULL` |  |  |
| `times_used` | `int(11)` | YES | `0` |  |  |
| `success_rate` | `decimal(5,2)` | YES | `0.00` |  |  |
| `avg_deal_size` | `decimal(15,2)` | YES | `0.00` |  |  |
| `avg_time_to_close` | `int(11)` | YES | `0` |  |  |
| `status` | `enum('draft','active','archived')` | YES | `'draft'` | MUL |  |
| `is_shared` | `tinyint(1)` | YES | `0` |  |  |
| `shared_with` | `longtext` | YES | `NULL` |  |  |
| `created_by` | `int(11)` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_company_id`: `company_id`
- `INDEX` `idx_playbook_type`: `playbook_type`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_user_id`: `user_id`
- `INDEX` `idx_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `crm_products`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `sku` | `varchar(100)` | YES | `NULL` |  |  |
| `category` | `varchar(100)` | YES | `NULL` | MUL |  |
| `unit_price` | `decimal(15,2)` | YES | `0.00` |  |  |
| `cost_price` | `decimal(15,2)` | YES | `0.00` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_category`: `category`
- `INDEX` `idx_company_id`: `company_id`
- `INDEX` `idx_is_active`: `is_active`
- `INDEX` `idx_user_id`: `user_id`
- `INDEX` `idx_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `crm_scoring_rules`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `rule_name` | `varchar(255)` | NO | `NULL` |  |  |
| `rule_type` | `enum('demographic','firmographic','behavioral','engagement')` | NO | `NULL` | MUL |  |
| `conditions` | `longtext` | NO | `NULL` |  |  |
| `score_value` | `int(11)` | NO | `NULL` |  |  |
| `score_operation` | `enum('add','subtract','set')` | YES | `'add'` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` | MUL |  |
| `priority` | `int(11)` | YES | `0` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_is_active`: `is_active`
- `INDEX` `idx_priority`: `priority`
- `INDEX` `idx_rule_type`: `rule_type`
- `INDEX` `idx_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `crm_sequence_enrollments`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `sequence_id` | `int(11)` | NO | `NULL` | MUL |  |
| `lead_id` | `int(11)` | NO | `NULL` | MUL |  |
| `current_step` | `int(11)` | YES | `0` |  |  |
| `status` | `enum('active','completed','paused','opted_out')` | YES | `'active'` | MUL |  |
| `enrolled_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |
| `last_step_at` | `timestamp` | YES | `NULL` |  |  |
| `next_step_at` | `timestamp` | YES | `NULL` | MUL |  |

**Foreign Keys:**
- `sequence_id` -> `crm_sequences.id` (Constraint: `crm_sequence_enrollments_ibfk_1`)
- `lead_id` -> `leads.id` (Constraint: `crm_sequence_enrollments_ibfk_2`)

**Indexes:**
- `INDEX` `idx_lead_id`: `lead_id`
- `INDEX` `idx_next_step_at`: `next_step_at`
- `INDEX` `idx_sequence_id`: `sequence_id`
- `INDEX` `idx_status`: `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `crm_sequences`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `sequence_type` | `enum('prospecting','nurture','follow_up','re_engagement')` | YES | `'prospecting'` |  |  |
| `trigger_type` | `enum('manual','stage_change','tag_added','score_threshold')` | YES | `'manual'` |  |  |
| `trigger_config` | `longtext` | YES | `NULL` |  |  |
| `steps` | `longtext` | YES | `NULL` |  |  |
| `enrollments` | `int(11)` | YES | `0` |  |  |
| `completions` | `int(11)` | YES | `0` |  |  |
| `opt_outs` | `int(11)` | YES | `0` |  |  |
| `status` | `enum('draft','active','paused','archived')` | YES | `'draft'` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_user_id`: `user_id`
- `INDEX` `idx_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `crm_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | YES | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `setting_key` | `varchar(100)` | NO | `NULL` |  |  |
| `setting_value` | `text` | YES | `NULL` |  |  |
| `setting_type` | `enum('user','workspace','company','system')` | YES | `'user'` | MUL |  |
| `data_type` | `enum('string','number','boolean','json')` | YES | `'string'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_company_id`: `company_id`
- `INDEX` `idx_setting_type`: `setting_type`
- `INDEX` `idx_user_id`: `user_id`
- `INDEX` `idx_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_setting`: `user_id`, `workspace_id`, `company_id`, `setting_key`

---
### Table: `crm_tasks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `lead_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `assigned_to` | `int(11)` | NO | `NULL` | MUL |  |
| `created_by` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `task_type` | `enum('call','email','meeting','follow_up','custom')` | NO | `'follow_up'` |  |  |
| `status` | `enum('pending','in_progress','completed','cancelled')` | NO | `'pending'` | MUL |  |
| `priority` | `enum('low','medium','high','urgent')` | NO | `'medium'` | MUL |  |
| `due_date` | `datetime` | YES | `NULL` | MUL |  |
| `completed_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_assigned_to`: `assigned_to`
- `INDEX` `idx_contact_id`: `contact_id`
- `INDEX` `idx_created_by`: `created_by`
- `INDEX` `idx_crm_tasks_workspace`: `workspace_id`
- `INDEX` `idx_due_date`: `due_date`
- `INDEX` `idx_lead_id`: `lead_id`
- `INDEX` `idx_priority`: `priority`
- `INDEX` `idx_status`: `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `crm_territories`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `territory_type` | `enum('geographic','industry','account_size','custom')` | YES | `'geographic'` | MUL |  |
| `countries` | `longtext` | YES | `NULL` |  |  |
| `states` | `longtext` | YES | `NULL` |  |  |
| `cities` | `longtext` | YES | `NULL` |  |  |
| `zip_codes` | `longtext` | YES | `NULL` |  |  |
| `industries` | `longtext` | YES | `NULL` |  |  |
| `revenue_min` | `decimal(15,2)` | YES | `NULL` |  |  |
| `revenue_max` | `decimal(15,2)` | YES | `NULL` |  |  |
| `employee_count_min` | `int(11)` | YES | `NULL` |  |  |
| `employee_count_max` | `int(11)` | YES | `NULL` |  |  |
| `assigned_users` | `longtext` | YES | `NULL` |  |  |
| `quota` | `decimal(15,2)` | YES | `0.00` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_is_active`: `is_active`
- `INDEX` `idx_territory_type`: `territory_type`
- `INDEX` `idx_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `custom_dashboards`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `layout` | `longtext` | NO | `NULL` |  |  |
| `widgets` | `longtext` | NO | `NULL` |  |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `is_shared` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_user`: `user_id`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `custom_field_definitions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `entity_type` | `varchar(50)` | NO | `NULL` |  |  |
| `field_key` | `varchar(50)` | NO | `NULL` |  |  |
| `field_label` | `varchar(100)` | NO | `NULL` |  |  |
| `field_type` | `enum('text','textarea','number','decimal','date','datetime','boolean','select','multiselect','url','email','phone','currency','file','user','contact','company')` | NO | `'text'` |  |  |
| `options` | `longtext` | YES | `NULL` |  |  |
| `is_required` | `tinyint(1)` | YES | `0` |  |  |
| `default_value` | `varchar(500)` | YES | `NULL` |  |  |
| `placeholder` | `varchar(255)` | YES | `NULL` |  |  |
| `help_text` | `varchar(500)` | YES | `NULL` |  |  |
| `validation_regex` | `varchar(255)` | YES | `NULL` |  |  |
| `min_value` | `decimal(15,2)` | YES | `NULL` |  |  |
| `max_value` | `decimal(15,2)` | YES | `NULL` |  |  |
| `max_length` | `int(11)` | YES | `NULL` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `field_group` | `varchar(50)` | YES | `NULL` |  |  |
| `show_in_list` | `tinyint(1)` | YES | `0` |  |  |
| `show_in_filters` | `tinyint(1)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `is_system` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_custom_fields_entity`: `workspace_id`, `entity_type`, `is_active`, `sort_order`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_entity_key`: `workspace_id`, `entity_type`, `field_key`

---
### Table: `custom_field_values`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `field_id` | `int(11)` | NO | `NULL` | MUL |  |
| `entity_type` | `varchar(50)` | NO | `NULL` |  |  |
| `entity_id` | `int(11)` | NO | `NULL` |  |  |
| `value_text` | `text` | YES | `NULL` |  |  |
| `value_number` | `decimal(15,4)` | YES | `NULL` |  |  |
| `value_date` | `date` | YES | `NULL` |  |  |
| `value_datetime` | `datetime` | YES | `NULL` |  |  |
| `value_boolean` | `tinyint(1)` | YES | `NULL` |  |  |
| `value_json` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `field_id` -> `custom_field_definitions.id` (Constraint: `custom_field_values_ibfk_1`)

**Indexes:**
- `INDEX` `idx_cfv_entity`: `workspace_id`, `entity_type`, `entity_id`
- `INDEX` `idx_cfv_field`: `field_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_field_entity`: `field_id`, `entity_type`, `entity_id`

---
### Table: `custom_variables`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `name` | `varchar(255)` | NO | `NULL` | UNI |  |
| `description` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_custom_variables_name`: `name`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_name`: `name`

---
### Table: `daily_goals`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `date` | `date` | NO | `NULL` |  |  |
| `calls_goal` | `int(11)` | YES | `0` |  |  |
| `calls_completed` | `int(11)` | YES | `0` |  |  |
| `emails_goal` | `int(11)` | YES | `0` |  |  |
| `emails_completed` | `int(11)` | YES | `0` |  |  |
| `meetings_goal` | `int(11)` | YES | `0` |  |  |
| `meetings_completed` | `int(11)` | YES | `0` |  |  |
| `tasks_goal` | `int(11)` | YES | `0` |  |  |
| `tasks_completed` | `int(11)` | YES | `0` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_user_date`: `user_id`, `date`

---
### Table: `dashboard_widgets`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `dashboard_id` | `int(11)` | NO | `NULL` | MUL |  |
| `report_id` | `int(11)` | YES | `NULL` | MUL |  |
| `widget_type` | `enum('metric','chart','table','list','funnel','goal','leaderboard','activity_feed')` | NO | `NULL` |  |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `position_x` | `int(11)` | NO | `0` |  |  |
| `position_y` | `int(11)` | NO | `0` |  |  |
| `width` | `int(11)` | NO | `4` |  |  |
| `height` | `int(11)` | NO | `3` |  |  |
| `config` | `longtext` | YES | `NULL` |  |  |
| `data_source` | `varchar(100)` | YES | `NULL` |  |  |
| `metric` | `varchar(100)` | YES | `NULL` |  |  |
| `filters` | `longtext` | YES | `NULL` |  |  |
| `comparison_enabled` | `tinyint(1)` | NO | `0` |  |  |
| `comparison_period` | `varchar(50)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_widgets_dashboard`: `dashboard_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `report_id`: `report_id`

---
### Table: `dashboards`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `is_default` | `tinyint(1)` | NO | `0` |  |  |
| `layout` | `longtext` | YES | `NULL` |  |  |
| `theme` | `varchar(50)` | YES | `'default'` |  |  |
| `refresh_interval` | `int(11)` | YES | `NULL` |  |  |
| `is_public` | `tinyint(1)` | NO | `0` |  |  |
| `share_token` | `varchar(64)` | YES | `NULL` | UNI |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_dashboards_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `share_token`: `share_token`

---
### Table: `deal_room_analytics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `deal_room_id` | `int(11)` | NO | `NULL` | MUL |  |
| `visitor_email` | `varchar(255)` | YES | `NULL` | MUL |  |
| `visitor_name` | `varchar(255)` | YES | `NULL` |  |  |
| `content_id` | `int(11)` | YES | `NULL` |  |  |
| `action` | `enum('page_view','content_view','content_download','link_click')` | NO | `NULL` |  |  |
| `time_spent_seconds` | `int(11)` | YES | `NULL` |  |  |
| `action_date` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `ip_address` | `varchar(50)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |

**Foreign Keys:**
- `deal_room_id` -> `deal_rooms.id` (Constraint: `deal_room_analytics_ibfk_1`)

**Indexes:**
- `INDEX` `idx_date`: `action_date`
- `INDEX` `idx_room`: `deal_room_id`
- `INDEX` `idx_visitor`: `visitor_email`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `deal_room_content`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `deal_room_id` | `int(11)` | NO | `NULL` | MUL |  |
| `content_id` | `int(11)` | YES | `NULL` |  |  |
| `custom_title` | `varchar(255)` | YES | `NULL` |  |  |
| `custom_description` | `text` | YES | `NULL` |  |  |
| `order_index` | `int(11)` | YES | `0` |  |  |
| `is_visible` | `tinyint(1)` | YES | `1` |  |  |

**Foreign Keys:**
- `deal_room_id` -> `deal_rooms.id` (Constraint: `deal_room_content_ibfk_1`)

**Indexes:**
- `INDEX` `idx_room`: `deal_room_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `deal_rooms`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `lead_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `slug` | `varchar(100)` | YES | `NULL` | UNI |  |
| `description` | `text` | YES | `NULL` |  |  |
| `buyer_name` | `varchar(255)` | YES | `NULL` |  |  |
| `buyer_email` | `varchar(255)` | YES | `NULL` |  |  |
| `buyer_company` | `varchar(255)` | YES | `NULL` |  |  |
| `welcome_message` | `text` | YES | `NULL` |  |  |
| `branding` | `longtext` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` | MUL |  |
| `expires_at` | `timestamp` | YES | `NULL` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_active`: `is_active`
- `INDEX` `idx_lead`: `lead_id`
- `INDEX` `idx_slug`: `slug`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `slug`: `slug`

---
### Table: `deal_stage_history`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `deal_id` | `int(11)` | NO | `NULL` | MUL |  |
| `from_stage` | `varchar(50)` | YES | `NULL` |  |  |
| `to_stage` | `varchar(50)` | NO | `NULL` |  |  |
| `changed_by` | `int(11)` | YES | `NULL` | MUL |  |
| `changed_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `days_in_previous_stage` | `int(11)` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `changed_by`: `changed_by`
- `INDEX` `idx_deal_history_changed`: `changed_at`
- `INDEX` `idx_deal_history_deal`: `deal_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `deal_stages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `stage_order` | `int(11)` | NO | `0` | MUL |  |
| `probability` | `decimal(5,2)` | YES | `0.00` |  |  |
| `color` | `varchar(7)` | YES | `'#3B82F6'` |  |  |
| `is_won` | `tinyint(1)` | YES | `0` |  |  |
| `is_lost` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_stage_order`: `stage_order`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `deals`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `value` | `decimal(15,2)` | YES | `0.00` | MUL |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `stage` | `varchar(50)` | NO | `NULL` | MUL |  |
| `probability` | `int(11)` | YES | `0` |  |  |
| `expected_close_date` | `date` | YES | `NULL` | MUL |  |
| `actual_close_date` | `date` | YES | `NULL` |  |  |
| `won` | `tinyint(1)` | YES | `NULL` |  |  |
| `loss_reason` | `varchar(255)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_deals_contact`: `contact_id`
- `INDEX` `idx_deals_created`: `created_at`
- `INDEX` `idx_deals_expected_close`: `expected_close_date`
- `INDEX` `idx_deals_stage`: `stage`
- `INDEX` `idx_deals_user`: `user_id`
- `INDEX` `idx_deals_value`: `value`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `directories`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `code` | `varchar(50)` | NO | `NULL` | UNI |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `category` | `varchar(50)` | YES | `'general'` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `website_url` | `varchar(500)` | YES | `NULL` |  |  |
| `logo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `form_schema` | `longtext` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `submission_method` | `enum('manual','api','worker')` | YES | `'manual'` |  |  |
| `automation_config` | `longtext` | YES | `NULL` |  |  |
| `submission_url` | `varchar(500)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `country` | `varchar(10)` | YES | `'US'` |  |  |
| `type` | `enum('general','niche','location','social','aggregator')` | YES | `'general'` |  |  |

**Indexes:**
- `UNIQUE` `code`: `code`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `directory_catalog`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `domain` | `varchar(255)` | NO | `NULL` | UNI |  |
| `category` | `varchar(50)` | YES | `'general'` | MUL |  |
| `description` | `text` | YES | `NULL` |  |  |
| `logo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `submission_url` | `varchar(500)` | YES | `NULL` |  |  |
| `api_supported` | `tinyint(1)` | YES | `0` |  |  |
| `manual_submission` | `tinyint(1)` | YES | `1` |  |  |
| `priority` | `int(11)` | YES | `0` | MUL |  |
| `domain_authority` | `int(11)` | YES | `NULL` |  |  |
| `monthly_visitors` | `int(11)` | YES | `NULL` |  |  |
| `is_free` | `tinyint(1)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `countries` | `longtext` | YES | `NULL` |  |  |
| `industries` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_directory_category`: `category`, `is_active`
- `INDEX` `idx_directory_priority`: `priority`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_directory_domain`: `domain`

---
### Table: `dispatch_route_stops`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `route_id` | `int(11)` | NO | `NULL` | MUL |  |
| `job_id` | `int(11)` | NO | `NULL` |  |  |
| `stop_order` | `int(11)` | NO | `NULL` |  |  |
| `estimated_arrival` | `datetime` | YES | `NULL` |  |  |
| `estimated_departure` | `datetime` | YES | `NULL` |  |  |
| `actual_arrival` | `datetime` | YES | `NULL` |  |  |
| `actual_departure` | `datetime` | YES | `NULL` |  |  |
| `distance_miles` | `decimal(10,2)` | YES | `NULL` |  |  |
| `duration_minutes` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `route_id` -> `dispatch_routes.id` (Constraint: `dispatch_route_stops_ibfk_1`)

**Indexes:**
- `INDEX` `idx_route_stops`: `route_id`, `stop_order`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `dispatch_routes`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `route_date` | `date` | NO | `NULL` |  |  |
| `staff_id` | `int(11)` | NO | `NULL` |  |  |
| `name` | `varchar(100)` | YES | `NULL` |  |  |
| `start_location` | `varchar(500)` | YES | `NULL` |  |  |
| `end_location` | `varchar(500)` | YES | `NULL` |  |  |
| `total_distance_miles` | `decimal(10,2)` | YES | `NULL` |  |  |
| `total_duration_minutes` | `int(11)` | YES | `NULL` |  |  |
| `optimized_at` | `timestamp` | YES | `NULL` |  |  |
| `status` | `enum('planned','in_progress','completed')` | YES | `'planned'` |  |  |
| `started_at` | `timestamp` | YES | `NULL` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_routes_workspace`: `workspace_id`, `route_date`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_date_staff`: `workspace_id`, `route_date`, `staff_id`

---
### Table: `distributed_locks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `lock_key` | `varchar(255)` | NO | `NULL` | UNI |  |
| `lock_value` | `varchar(255)` | NO | `NULL` |  |  |
| `expires_at` | `datetime` | NO | `NULL` | MUL |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_expires_at`: `expires_at`
- `INDEX` `idx_lock_key`: `lock_key`
- `UNIQUE` `lock_key`: `lock_key`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `dnc_lists`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `phone_number` | `varchar(20)` | NO | `NULL` | MUL |  |
| `reason` | `varchar(255)` | YES | `NULL` |  |  |
| `source` | `varchar(255)` | YES | `NULL` |  |  |
| `expires_at` | `datetime` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_dnc_lists_phone`: `phone_number`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_dnc`: `user_id`, `phone_number`

---
### Table: `dns_checks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `domain` | `varchar(255)` | NO | `NULL` |  |  |
| `spf_record` | `text` | YES | `NULL` |  |  |
| `spf_status` | `varchar(32)` | NO | `'unknown'` |  |  |
| `dkim_selector` | `varchar(64)` | YES | `NULL` |  |  |
| `dkim_record` | `text` | YES | `NULL` |  |  |
| `dkim_status` | `varchar(32)` | NO | `'unknown'` |  |  |
| `dmarc_record` | `text` | YES | `NULL` |  |  |
| `dmarc_policy` | `varchar(32)` | YES | `NULL` |  |  |
| `dmarc_status` | `varchar(32)` | NO | `'unknown'` |  |  |
| `issues` | `text` | YES | `NULL` |  |  |
| `checked_at` | `datetime` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_dns_checks_checked_at`: `checked_at`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_dns_domain`: `user_id`, `domain`

---
### Table: `dunning_schedules`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `days_after_due` | `int(11)` | NO | `NULL` |  |  |
| `email_template_id` | `int(11)` | YES | `NULL` |  |  |
| `sms_template_id` | `int(11)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ecommerce_orders`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `store_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `external_id` | `varchar(100)` | NO | `NULL` |  |  |
| `order_number` | `varchar(50)` | YES | `NULL` |  |  |
| `email` | `varchar(255)` | YES | `NULL` |  |  |
| `phone` | `varchar(50)` | YES | `NULL` |  |  |
| `status` | `enum('pending','processing','completed','cancelled','refunded')` | YES | `'pending'` |  |  |
| `subtotal` | `decimal(10,2)` | YES | `NULL` |  |  |
| `shipping_total` | `decimal(10,2)` | YES | `NULL` |  |  |
| `tax_total` | `decimal(10,2)` | YES | `NULL` |  |  |
| `discount_total` | `decimal(10,2)` | YES | `NULL` |  |  |
| `total` | `decimal(10,2)` | YES | `NULL` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `items` | `longtext` | YES | `NULL` |  |  |
| `shipping_address` | `longtext` | YES | `NULL` |  |  |
| `billing_address` | `longtext` | YES | `NULL` |  |  |
| `order_date` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Foreign Keys:**
- `store_id` -> `ecommerce_stores.id` (Constraint: `ecommerce_orders_ibfk_1`)
- `contact_id` -> `contacts.id` (Constraint: `ecommerce_orders_ibfk_2`)

**Indexes:**
- `INDEX` `contact_id`: `contact_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_store_order`: `store_id`, `external_id`

---
### Table: `ecommerce_products`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `store_id` | `int(11)` | NO | `NULL` | MUL |  |
| `external_id` | `varchar(100)` | NO | `NULL` |  |  |
| `name` | `varchar(500)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `sku` | `varchar(100)` | YES | `NULL` |  |  |
| `price` | `decimal(10,2)` | YES | `NULL` |  |  |
| `compare_at_price` | `decimal(10,2)` | YES | `NULL` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `image_url` | `varchar(500)` | YES | `NULL` |  |  |
| `product_url` | `varchar(500)` | YES | `NULL` |  |  |
| `category` | `varchar(255)` | YES | `NULL` |  |  |
| `tags` | `longtext` | YES | `NULL` |  |  |
| `inventory_quantity` | `int(11)` | YES | `0` |  |  |
| `status` | `enum('active','draft','archived')` | YES | `'active'` |  |  |
| `synced_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Foreign Keys:**
- `store_id` -> `ecommerce_stores.id` (Constraint: `ecommerce_products_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_store_product`: `store_id`, `external_id`

---
### Table: `ecommerce_stores`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `client_id` | `int(11)` | YES | `NULL` |  |  |
| `platform` | `enum('shopify','woocommerce','magento','bigcommerce','custom')` | NO | `NULL` |  |  |
| `store_name` | `varchar(255)` | NO | `NULL` |  |  |
| `store_url` | `varchar(500)` | NO | `NULL` |  |  |
| `api_key` | `varchar(500)` | YES | `NULL` |  |  |
| `api_secret` | `varchar(500)` | YES | `NULL` |  |  |
| `access_token` | `text` | YES | `NULL` |  |  |
| `webhook_secret` | `varchar(255)` | YES | `NULL` |  |  |
| `sync_status` | `enum('pending','syncing','synced','error')` | YES | `'pending'` |  |  |
| `last_sync_at` | `datetime` | YES | `NULL` |  |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('active','paused','disconnected')` | YES | `'active'` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `ecommerce_stores_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`

---
### Table: `email_campaigns`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `subject` | `varchar(500)` | YES | `NULL` |  |  |
| `from_name` | `varchar(255)` | YES | `NULL` |  |  |
| `from_email` | `varchar(255)` | YES | `NULL` |  |  |
| `reply_to` | `varchar(255)` | YES | `NULL` |  |  |
| `content` | `text` | YES | `NULL` |  |  |
| `html_content` | `longtext` | YES | `NULL` |  |  |
| `template_id` | `int(11)` | YES | `NULL` |  |  |
| `status` | `enum('draft','scheduled','sending','sent','paused','cancelled')` | YES | `'draft'` | MUL |  |
| `type` | `enum('regular','automated','ab_test','rss')` | YES | `'regular'` |  |  |
| `scheduled_at` | `timestamp` | YES | `NULL` | MUL |  |
| `sent_at` | `timestamp` | YES | `NULL` |  |  |
| `total_recipients` | `int(11)` | YES | `0` |  |  |
| `sent_count` | `int(11)` | YES | `0` |  |  |
| `delivered_count` | `int(11)` | YES | `0` |  |  |
| `open_count` | `int(11)` | YES | `0` |  |  |
| `click_count` | `int(11)` | YES | `0` |  |  |
| `bounce_count` | `int(11)` | YES | `0` |  |  |
| `unsubscribe_count` | `int(11)` | YES | `0` |  |  |
| `complaint_count` | `int(11)` | YES | `0` |  |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `tracking_settings` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_email_campaigns_scheduled`: `scheduled_at`
- `INDEX` `idx_email_campaigns_status`: `status`
- `INDEX` `idx_email_campaigns_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `email_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `user_id` | `int(11)` | YES | `NULL` | MUL |  |
| `to_email` | `varchar(255)` | YES | `NULL` |  |  |
| `subject` | `varchar(500)` | YES | `NULL` |  |  |
| `content` | `text` | YES | `NULL` |  |  |
| `type` | `varchar(50)` | YES | `NULL` |  |  |
| `status` | `varchar(50)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_contact_id`: `contact_id`
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `email_replies`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `campaign_id` | `int(11)` | YES | `NULL` | MUL |  |
| `recipient_id` | `int(11)` | YES | `NULL` | MUL |  |
| `from_email` | `varchar(255)` | NO | `NULL` |  |  |
| `to_email` | `varchar(255)` | NO | `NULL` |  |  |
| `subject` | `varchar(500)` | NO | `NULL` |  |  |
| `body` | `text` | NO | `NULL` |  |  |
| `is_read` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `is_starred` | `tinyint(1)` | YES | `0` |  |  |
| `is_archived` | `tinyint(1)` | YES | `0` |  |  |
| `thread_id` | `varchar(255)` | YES | `NULL` |  |  |
| `parent_id` | `int(11)` | YES | `NULL` |  |  |
| `message_id` | `varchar(255)` | YES | `NULL` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Indexes:**
- `INDEX` `campaign_id`: `campaign_id`
- `INDEX` `idx_email_replies_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `recipient_id`: `recipient_id`
- `INDEX` `user_id`: `user_id`

---
### Table: `email_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `subject` | `varchar(500)` | YES | `NULL` |  |  |
| `content` | `text` | NO | `NULL` |  |  |
| `content_html` | `text` | YES | `NULL` |  |  |
| `template_type` | `enum('marketing','transactional','notification','system')` | YES | `'marketing'` |  |  |
| `category` | `varchar(100)` | YES | `NULL` |  |  |
| `thumbnail_url` | `varchar(500)` | YES | `NULL` |  |  |
| `variables` | `longtext` | YES | `NULL` |  |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `usage_count` | `int(11)` | YES | `0` |  |  |
| `last_used_at` | `timestamp` | YES | `NULL` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_email_templates_category`: `workspace_id`, `category`
- `INDEX` `idx_email_templates_workspace`: `workspace_id`, `template_type`, `is_active`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `employee_availability`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `day_of_week` | `tinyint(4)` | NO | `NULL` | MUL |  |
| `start_time` | `time` | NO | `NULL` |  |  |
| `end_time` | `time` | NO | `NULL` |  |  |
| `is_available` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `employee_availability_ibfk_1`)
- `user_id` -> `users.id` (Constraint: `employee_availability_ibfk_2`)

**Indexes:**
- `INDEX` `idx_day`: `day_of_week`
- `INDEX` `idx_user`: `user_id`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_availability`: `workspace_id`, `user_id`, `day_of_week`

---
### Table: `employee_compensation`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `employment_type` | `enum('full-time','part-time','contractor','intern')` | YES | `'full-time'` |  |  |
| `pay_type` | `enum('hourly','salary','commission')` | YES | `'hourly'` |  |  |
| `hourly_rate` | `decimal(10,2)` | YES | `NULL` |  |  |
| `salary_amount` | `decimal(12,2)` | YES | `NULL` |  |  |
| `pay_frequency` | `enum('weekly','bi-weekly','semi-monthly','monthly')` | YES | `NULL` |  |  |
| `overtime_eligible` | `tinyint(1)` | YES | `1` |  |  |
| `overtime_rate_multiplier` | `decimal(4,2)` | YES | `1.50` |  |  |
| `double_time_rate_multiplier` | `decimal(4,2)` | YES | `2.00` |  |  |
| `health_insurance_deduction` | `decimal(10,2)` | YES | `0.00` |  |  |
| `dental_insurance_deduction` | `decimal(10,2)` | YES | `0.00` |  |  |
| `vision_insurance_deduction` | `decimal(10,2)` | YES | `0.00` |  |  |
| `retirement_401k_percent` | `decimal(5,2)` | YES | `0.00` |  |  |
| `retirement_401k_employer_match` | `decimal(5,2)` | YES | `0.00` |  |  |
| `federal_withholding_allowances` | `int(11)` | YES | `0` |  |  |
| `state_withholding_allowances` | `int(11)` | YES | `0` |  |  |
| `additional_withholding` | `decimal(10,2)` | YES | `0.00` |  |  |
| `tax_filing_status` | `enum('single','married','head_of_household')` | YES | `'single'` |  |  |
| `payment_method` | `enum('direct_deposit','check','cash','paycard')` | YES | `'direct_deposit'` |  |  |
| `bank_name` | `varchar(255)` | YES | `NULL` |  |  |
| `account_type` | `enum('checking','savings')` | YES | `NULL` |  |  |
| `routing_number` | `varchar(20)` | YES | `NULL` |  |  |
| `account_number_last4` | `varchar(4)` | YES | `NULL` |  |  |
| `effective_date` | `date` | NO | `NULL` |  |  |
| `end_date` | `date` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_employee_compensation_active`: `workspace_id`, `is_active`, `effective_date`
- `INDEX` `idx_employee_compensation_workspace`: `workspace_id`, `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `employee_documents`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `file_id` | `int(11)` | NO | `NULL` |  |  |
| `document_type` | `enum('contract','id_proof','tax_form','certification','other')` | NO | `NULL` |  |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `expiry_date` | `date` | YES | `NULL` |  |  |
| `status` | `enum('pending','verified','expired','rejected')` | YES | `'pending'` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `workspace_id`: `workspace_id`, `user_id`

---
### Table: `employee_hr_summary`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | UNI |  |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `total_hours_worked` | `decimal(10,2)` | YES | `0.00` |  |  |
| `leave_balance_annual` | `int(11)` | YES | `0` |  |  |
| `leave_balance_sick` | `int(11)` | YES | `0` |  |  |
| `leave_balance_personal` | `int(11)` | YES | `0` |  |  |
| `upcoming_shifts_count` | `int(11)` | YES | `0` |  |  |
| `pending_leave_requests` | `int(11)` | YES | `0` |  |  |
| `last_clock_in` | `datetime` | YES | `NULL` |  |  |
| `last_clock_out` | `datetime` | YES | `NULL` |  |  |
| `current_status` | `enum('working','on_leave','off_duty','on_break')` | YES | `'off_duty'` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_hr_summary_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_user`: `user_id`

---
### Table: `employee_onboarding_status`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `checklist_id` | `int(11)` | NO | `NULL` |  |  |
| `task_id` | `int(11)` | NO | `NULL` |  |  |
| `status` | `enum('pending','completed','skipped')` | YES | `'pending'` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |
| `completed_by` | `int(11)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `user_id`: `user_id`, `task_id`
- `INDEX` `workspace_id`: `workspace_id`, `user_id`

---
### Table: `entity_tags`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `tag_id` | `int(11)` | NO | `NULL` | MUL |  |
| `entity_type` | `varchar(50)` | NO | `NULL` |  |  |
| `entity_id` | `int(11)` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |

**Foreign Keys:**
- `tag_id` -> `tags.id` (Constraint: `entity_tags_ibfk_1`)

**Indexes:**
- `INDEX` `idx_entity_tags`: `workspace_id`, `entity_type`, `entity_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_tag_entity`: `tag_id`, `entity_type`, `entity_id`

---
### Table: `esign_audit_log`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `envelope_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | YES | `NULL` |  |  |
| `signer_email` | `varchar(255)` | YES | `NULL` |  |  |
| `action` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `timestamp` | `datetime` | YES | `current_timestamp()` |  |  |

**Foreign Keys:**
- `envelope_id` -> `esign_envelopes.id` (Constraint: `esign_audit_log_ibfk_1`)

**Indexes:**
- `INDEX` `envelope_id`: `envelope_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `esign_documents`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `envelope_id` | `int(11)` | NO | `NULL` | MUL |  |
| `file_name` | `varchar(255)` | NO | `NULL` |  |  |
| `file_path` | `varchar(255)` | NO | `NULL` |  |  |
| `mime_type` | `varchar(100)` | YES | `'application/pdf'` |  |  |
| `file_size` | `int(11)` | YES | `NULL` |  |  |
| `document_order` | `int(11)` | YES | `0` |  |  |
| `original_checksum` | `varchar(64)` | YES | `NULL` |  |  |
| `signed_checksum` | `varchar(64)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `envelope_id` -> `esign_envelopes.id` (Constraint: `esign_documents_ibfk_1`)

**Indexes:**
- `INDEX` `envelope_id`: `envelope_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `esign_envelopes`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |
| `company_id` | `int(11)` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `email_subject` | `varchar(255)` | YES | `NULL` |  |  |
| `email_body` | `text` | YES | `NULL` |  |  |
| `status` | `enum('draft','sent','completed','declined','voided','expired')` | YES | `'draft'` | MUL |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `sent_at` | `datetime` | YES | `NULL` |  |  |
| `completed_at` | `datetime` | YES | `NULL` |  |  |
| `expires_at` | `datetime` | YES | `NULL` |  |  |
| `metadata` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_company`: `company_id`
- `INDEX` `idx_status`: `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `esign_signers`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `envelope_id` | `int(11)` | NO | `NULL` | MUL |  |
| `recipient_email` | `varchar(255)` | NO | `NULL` |  |  |
| `recipient_name` | `varchar(255)` | NO | `NULL` |  |  |
| `routing_order` | `int(11)` | YES | `1` |  |  |
| `role_name` | `varchar(50)` | YES | `'Signer 1'` |  |  |
| `status` | `enum('created','sent','viewed','signed','declined')` | YES | `'created'` |  |  |
| `access_code` | `varchar(50)` | YES | `NULL` |  |  |
| `signing_url_token` | `varchar(255)` | YES | `NULL` | UNI |  |
| `viewed_at` | `datetime` | YES | `NULL` |  |  |
| `signed_at` | `datetime` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `signature_image_path` | `varchar(255)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `envelope_id` -> `esign_envelopes.id` (Constraint: `esign_signers_ibfk_1`)

**Indexes:**
- `INDEX` `envelope_id`: `envelope_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `signing_url_token`: `signing_url_token`

---
### Table: `estimate_items`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `estimate_id` | `int(11)` | NO | `NULL` | MUL |  |
| `product_id` | `int(11)` | YES | `NULL` |  |  |
| `service_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `quantity` | `decimal(10,2)` | YES | `1.00` |  |  |
| `unit_price` | `decimal(12,2)` | NO | `NULL` |  |  |
| `discount_type` | `enum('percentage','fixed')` | YES | `NULL` |  |  |
| `discount_value` | `decimal(10,2)` | YES | `NULL` |  |  |
| `tax_rate` | `decimal(5,2)` | YES | `NULL` |  |  |
| `subtotal` | `decimal(12,2)` | NO | `NULL` |  |  |
| `discount_amount` | `decimal(12,2)` | YES | `0.00` |  |  |
| `tax_amount` | `decimal(12,2)` | YES | `0.00` |  |  |
| `total` | `decimal(12,2)` | NO | `NULL` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `estimate_id` -> `estimates.id` (Constraint: `estimate_items_ibfk_1`)

**Indexes:**
- `INDEX` `idx_estimate_items`: `estimate_id`, `sort_order`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `estimate_line_items`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `estimate_id` | `int(11)` | NO | `NULL` | MUL |  |
| `service_id` | `int(11)` | YES | `NULL` |  |  |
| `description` | `varchar(255)` | NO | `NULL` |  |  |
| `quantity` | `decimal(10,2)` | YES | `1.00` |  |  |
| `unit_price` | `decimal(10,2)` | YES | `NULL` |  |  |
| `total` | `decimal(10,2)` | YES | `NULL` |  |  |
| `item_type` | `enum('service','part','labor','fee','discount')` | YES | `'service'` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `estimate_id`: `estimate_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `estimates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` |  |  |
| `job_id` | `int(11)` | YES | `NULL` |  |  |
| `estimate_number` | `varchar(50)` | YES | `NULL` |  |  |
| `title` | `varchar(255)` | YES | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `status` | `enum('draft','sent','viewed','accepted','declined','expired','converted')` | YES | `'draft'` |  |  |
| `subtotal` | `decimal(10,2)` | YES | `NULL` |  |  |
| `tax_rate` | `decimal(5,2)` | YES | `NULL` |  |  |
| `tax_amount` | `decimal(10,2)` | YES | `NULL` |  |  |
| `discount_amount` | `decimal(10,2)` | YES | `NULL` |  |  |
| `total` | `decimal(10,2)` | YES | `NULL` |  |  |
| `valid_until` | `date` | YES | `NULL` |  |  |
| `terms` | `text` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `sent_at` | `datetime` | YES | `NULL` |  |  |
| `viewed_at` | `datetime` | YES | `NULL` |  |  |
| `accepted_at` | `datetime` | YES | `NULL` |  |  |
| `signature_url` | `varchar(500)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_estimates_user_status`: `user_id`, `status`
- `INDEX` `idx_estimates_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `expense_categories`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `requires_receipt` | `tinyint(1)` | YES | `1` |  |  |
| `max_amount` | `decimal(10,2)` | YES | `NULL` |  |  |
| `requires_approval` | `tinyint(1)` | YES | `1` |  |  |
| `gl_code` | `varchar(50)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_expense_categories`: `workspace_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_name`: `workspace_id`, `name`

---
### Table: `expense_reports`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `report_number` | `varchar(50)` | NO | `NULL` |  |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `period_start` | `date` | YES | `NULL` |  |  |
| `period_end` | `date` | YES | `NULL` |  |  |
| `total_amount` | `decimal(12,2)` | YES | `0.00` |  |  |
| `approved_amount` | `decimal(12,2)` | YES | `0.00` |  |  |
| `reimbursed_amount` | `decimal(12,2)` | YES | `0.00` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `status` | `enum('draft','submitted','under_review','approved','rejected','reimbursed','partially_reimbursed')` | YES | `'draft'` |  |  |
| `submitted_at` | `timestamp` | YES | `NULL` |  |  |
| `approved_by` | `int(11)` | YES | `NULL` |  |  |
| `approved_at` | `timestamp` | YES | `NULL` |  |  |
| `rejection_reason` | `text` | YES | `NULL` |  |  |
| `reimbursed_at` | `timestamp` | YES | `NULL` |  |  |
| `reimbursement_method` | `varchar(50)` | YES | `NULL` |  |  |
| `reimbursement_reference` | `varchar(255)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_expense_reports_status`: `workspace_id`, `status`
- `INDEX` `idx_expense_reports_user`: `user_id`, `created_at`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_number`: `workspace_id`, `report_number`

---
### Table: `expenses`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `expense_report_id` | `int(11)` | YES | `NULL` | MUL |  |
| `category_id` | `int(11)` | YES | `NULL` |  |  |
| `category_name` | `varchar(100)` | YES | `NULL` |  |  |
| `description` | `varchar(255)` | NO | `NULL` |  |  |
| `merchant` | `varchar(255)` | YES | `NULL` |  |  |
| `expense_date` | `date` | NO | `NULL` |  |  |
| `amount` | `decimal(10,2)` | NO | `NULL` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `receipt_url` | `varchar(500)` | YES | `NULL` |  |  |
| `receipt_file_id` | `int(11)` | YES | `NULL` |  |  |
| `job_id` | `int(11)` | YES | `NULL` |  |  |
| `contact_id` | `int(11)` | YES | `NULL` |  |  |
| `is_mileage` | `tinyint(1)` | YES | `0` |  |  |
| `miles` | `decimal(10,2)` | YES | `NULL` |  |  |
| `mileage_rate` | `decimal(5,3)` | YES | `NULL` |  |  |
| `status` | `enum('pending','approved','rejected','reimbursed')` | YES | `'pending'` |  |  |
| `approved_by` | `int(11)` | YES | `NULL` |  |  |
| `approved_at` | `timestamp` | YES | `NULL` |  |  |
| `rejection_reason` | `text` | YES | `NULL` |  |  |
| `is_billable` | `tinyint(1)` | YES | `0` |  |  |
| `billed_to_contact_id` | `int(11)` | YES | `NULL` |  |  |
| `invoice_id` | `int(11)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_expenses_report`: `expense_report_id`
- `INDEX` `idx_expenses_user`: `user_id`, `expense_date`
- `INDEX` `idx_expenses_workspace`: `workspace_id`, `status`, `expense_date`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `external_reviews`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `connection_id` | `int(11)` | NO | `NULL` | MUL |  |
| `external_id` | `varchar(255)` | NO | `NULL` |  |  |
| `platform` | `varchar(50)` | NO | `NULL` | MUL |  |
| `reviewer_name` | `varchar(255)` | YES | `NULL` |  |  |
| `reviewer_avatar` | `varchar(500)` | YES | `NULL` |  |  |
| `reviewer_profile_url` | `varchar(500)` | YES | `NULL` |  |  |
| `rating` | `int(11)` | NO | `NULL` |  |  |
| `title` | `text` | YES | `NULL` |  |  |
| `content` | `text` | NO | `NULL` |  |  |
| `review_url` | `varchar(500)` | YES | `NULL` |  |  |
| `review_date` | `timestamp` | NO | `current_timestamp()` | MUL | on update current_timestamp() |
| `has_response` | `tinyint(1)` | YES | `0` |  |  |
| `response_text` | `text` | YES | `NULL` |  |  |
| `response_date` | `timestamp` | YES | `NULL` |  |  |
| `responded_by` | `int(11)` | YES | `NULL` |  |  |
| `sentiment` | `enum('positive','neutral','negative')` | YES | `NULL` | MUL |  |
| `status` | `enum('new','read','responded','flagged','archived')` | YES | `'new'` | MUL |  |
| `internal_notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `connection_id` -> `review_platform_connections.id` (Constraint: `external_reviews_ibfk_1`)

**Indexes:**
- `INDEX` `idx_company`: `company_id`
- `INDEX` `idx_connection`: `connection_id`
- `INDEX` `idx_platform`: `platform`
- `INDEX` `idx_review_date`: `review_date`
- `INDEX` `idx_sentiment`: `sentiment`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_external_review`: `connection_id`, `external_id`

---
### Table: `facebook_messenger_accounts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `page_id` | `varchar(255)` | NO | `NULL` | MUL |  |
| `page_name` | `varchar(255)` | NO | `NULL` |  |  |
| `access_token` | `text` | NO | `NULL` |  |  |
| `status` | `enum('active','inactive','error')` | YES | `'active'` |  |  |
| `webhook_verified` | `tinyint(1)` | YES | `0` |  |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_page`: `page_id`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_page`: `workspace_id`, `page_id`

---
### Table: `facebook_messenger_conversations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `account_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `contact_id` | `int(10) unsigned` | YES | `NULL` | MUL |  |
| `messenger_user_id` | `varchar(255)` | NO | `NULL` | MUL |  |
| `thread_id` | `varchar(255)` | NO | `NULL` | MUL |  |
| `status` | `enum('open','closed','archived')` | YES | `'open'` |  |  |
| `last_message_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_account`: `account_id`
- `INDEX` `idx_contact`: `contact_id`
- `INDEX` `idx_messenger_user`: `messenger_user_id`
- `INDEX` `idx_thread`: `thread_id`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `facebook_messenger_messages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `conversation_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `message_id` | `varchar(255)` | NO | `NULL` | MUL |  |
| `direction` | `enum('inbound','outbound')` | NO | `NULL` | MUL |  |
| `message_type` | `enum('text','image','video','file','template')` | YES | `'text'` |  |  |
| `content` | `text` | YES | `NULL` |  |  |
| `attachments` | `longtext` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('sent','delivered','read','failed')` | YES | `'sent'` | MUL |  |
| `sent_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `delivered_at` | `timestamp` | YES | `NULL` |  |  |
| `read_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_conversation`: `conversation_id`
- `INDEX` `idx_direction`: `direction`
- `INDEX` `idx_message`: `message_id`
- `INDEX` `idx_status`: `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `facebook_pages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `page_id` | `varchar(255)` | NO | `NULL` |  |  |
| `page_name` | `varchar(255)` | NO | `NULL` |  |  |
| `page_access_token` | `text` | NO | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `last_sync_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_page`: `workspace_id`, `page_id`

---
### Table: `fb_activity_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `0` |  |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `action` | `varchar(100)` | NO | `NULL` |  |  |
| `resource_type` | `varchar(50)` | NO | `NULL` |  |  |
| `resource_id` | `int(11)` | NO | `NULL` |  |  |
| `details` | `longtext` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |

---
### Table: `fb_field_interactions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `0` |  |  |
| `form_id` | `int(11)` | NO | `NULL` |  |  |
| `field_id` | `int(11)` | NO | `NULL` |  |  |
| `session_id` | `varchar(64)` | NO | `NULL` |  |  |
| `interaction_type` | `varchar(50)` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` |  |  |

---
### Table: `fb_field_options`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `0` |  |  |
| `field_id` | `int(11)` | NO | `NULL` |  |  |
| `label` | `varchar(500)` | NO | `NULL` |  |  |
| `value` | `varchar(500)` | NO | `NULL` |  |  |
| `position` | `int(11)` | NO | `NULL` |  |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `conditional_logic` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` |  |  |

---
### Table: `fb_field_responses`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `0` |  |  |
| `submission_id` | `int(11)` | NO | `NULL` |  |  |
| `field_id` | `int(11)` | NO | `NULL` |  |  |
| `field_name` | `varchar(500)` | YES | `NULL` |  |  |
| `field_type` | `varchar(50)` | YES | `NULL` |  |  |
| `response_value` | `text` | YES | `NULL` |  |  |
| `response_text` | `text` | YES | `NULL` |  |  |
| `file_name` | `varchar(500)` | YES | `NULL` |  |  |
| `file_path` | `varchar(1000)` | YES | `NULL` |  |  |
| `file_size` | `int(11)` | YES | `NULL` |  |  |
| `file_type` | `varchar(100)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` |  |  |

---
### Table: `fb_folders`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `0` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `parent_id` | `int(11)` | YES | `NULL` |  |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `color` | `varchar(7)` | YES | `'#3B82F6'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |

---
### Table: `fb_form_analytics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `0` |  |  |
| `form_id` | `int(11)` | NO | `NULL` |  |  |
| `date` | `date` | NO | `NULL` |  |  |
| `views` | `int(11)` | YES | `0` |  |  |
| `starts` | `int(11)` | YES | `0` |  |  |
| `completions` | `int(11)` | YES | `0` |  |  |
| `unique_visitors` | `int(11)` | YES | `0` |  |  |
| `conversion_rate` | `decimal(5,2)` | YES | `0.00` |  |  |
| `avg_completion_time` | `int(11)` | YES | `0` |  |  |
| `device_desktop` | `int(11)` | YES | `0` |  |  |
| `device_mobile` | `int(11)` | YES | `0` |  |  |
| `device_tablet` | `int(11)` | YES | `0` |  |  |
| `top_countries` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` |  |  |

---
### Table: `fb_form_fields`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `0` |  |  |
| `form_id` | `int(11)` | NO | `NULL` |  |  |
| `field_type` | `enum('text','textarea','email','number','phone','url','date','time','datetime','select','multiselect','radio','checkbox','file','rating','scale','matrix','yes_no','signature','html','section','page_break')` | NO | `NULL` |  |  |
| `label` | `varchar(500)` | NO | `NULL` |  |  |
| `placeholder` | `varchar(500)` | YES | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `required` | `tinyint(1)` | YES | `0` |  |  |
| `position` | `int(11)` | NO | `NULL` |  |  |
| `properties` | `longtext` | YES | `NULL` |  |  |
| `validation` | `longtext` | YES | `NULL` |  |  |
| `conditional_logic` | `longtext` | YES | `NULL` |  |  |
| `styling` | `longtext` | YES | `NULL` |  |  |
| `depends_on_field_id` | `int(11)` | YES | `NULL` |  |  |
| `depends_on_value` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` |  |  |

---
### Table: `fb_form_starts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `0` |  |  |
| `form_id` | `int(11)` | NO | `NULL` |  |  |
| `session_id` | `varchar(64)` | NO | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` |  |  |

---
### Table: `fb_form_submissions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `0` |  |  |
| `form_id` | `int(11)` | NO | `NULL` |  |  |
| `submission_token` | `varchar(100)` | NO | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `country` | `varchar(2)` | YES | `NULL` |  |  |
| `city` | `varchar(100)` | YES | `NULL` |  |  |
| `latitude` | `decimal(10,8)` | YES | `NULL` |  |  |
| `longitude` | `decimal(11,8)` | YES | `NULL` |  |  |
| `submission_data` | `longtext` | NO | `NULL` |  |  |
| `completion_time` | `int(11)` | YES | `NULL` |  |  |
| `spam_score` | `int(11)` | YES | `0` |  |  |
| `spam_reasons` | `longtext` | YES | `NULL` |  |  |
| `is_spam` | `tinyint(1)` | YES | `0` |  |  |
| `status` | `enum('new','read','starred','archived','deleted')` | YES | `'new'` |  |  |
| `tags` | `longtext` | YES | `NULL` |  |  |
| `respondent_email` | `varchar(255)` | YES | `NULL` |  |  |
| `respondent_phone` | `varchar(50)` | YES | `NULL` |  |  |
| `started_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` |  |  |

---
### Table: `fb_form_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `0` |  |  |
| `name` | `varchar(500)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `category` | `varchar(100)` | YES | `NULL` |  |  |
| `thumbnail_url` | `varchar(1000)` | YES | `NULL` |  |  |
| `template_data` | `longtext` | NO | `NULL` |  |  |
| `preview_data` | `longtext` | YES | `NULL` |  |  |
| `usage_count` | `int(11)` | YES | `0` |  |  |
| `rating` | `decimal(3,2)` | YES | `0.00` |  |  |
| `tags` | `longtext` | YES | `NULL` |  |  |
| `language` | `varchar(10)` | YES | `'en'` |  |  |
| `is_featured` | `tinyint(1)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` |  |  |

---
### Table: `fb_form_views`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `0` |  |  |
| `form_id` | `int(11)` | NO | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `referrer` | `text` | YES | `NULL` |  |  |
| `session_id` | `varchar(64)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` |  |  |

---
### Table: `fb_forms`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `0` |  |  |
| `title` | `varchar(500)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `folder_id` | `int(11)` | YES | `NULL` |  |  |
| `status` | `enum('draft','published','archived')` | YES | `'draft'` |  |  |
| `type` | `enum('single_step','multi_step','popup')` | YES | `'single_step'` |  |  |
| `welcome_screen` | `longtext` | YES | `NULL` |  |  |
| `thank_you_screen` | `longtext` | YES | `NULL` |  |  |
| `theme` | `longtext` | YES | `NULL` |  |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `spam_protection` | `longtext` | YES | `NULL` |  |  |
| `publish_at` | `timestamp` | YES | `NULL` |  |  |
| `expire_at` | `timestamp` | YES | `NULL` |  |  |
| `max_submissions` | `int(11)` | YES | `NULL` |  |  |
| `version` | `int(11)` | YES | `1` |  |  |
| `parent_version_id` | `int(11)` | YES | `NULL` |  |  |
| `language` | `varchar(10)` | YES | `'en'` |  |  |
| `tags` | `longtext` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |

---
### Table: `fb_spam_rules`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `0` |  |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `rule_type` | `enum('ip_block','ip_allow','country_block','country_allow','email_domain_block','user_agent_block','rate_limit')` | NO | `NULL` |  |  |
| `rule_value` | `varchar(500)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |

---
### Table: `fb_user_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `0` |  |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `settings` | `longtext` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |

---
### Table: `fb_users`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `0` |  |  |
| `username` | `varchar(100)` | NO | `NULL` |  |  |
| `email` | `varchar(255)` | NO | `NULL` |  |  |
| `password_hash` | `varchar(255)` | NO | `NULL` |  |  |
| `first_name` | `varchar(100)` | YES | `NULL` |  |  |
| `last_name` | `varchar(100)` | YES | `NULL` |  |  |
| `role` | `enum('admin','user','viewer')` | YES | `'user'` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `last_login` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `email_notifications` | `tinyint(1)` | YES | `1` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` |  |  |

---
### Table: `fb_webhook_deliveries`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `0` |  |  |
| `webhook_id` | `int(11)` | NO | `NULL` |  |  |
| `event_name` | `varchar(100)` | NO | `NULL` |  |  |
| `payload` | `longtext` | NO | `NULL` |  |  |
| `response_status` | `int(11)` | YES | `NULL` |  |  |
| `response_body` | `text` | YES | `NULL` |  |  |
| `attempt_number` | `int(11)` | YES | `1` |  |  |
| `delivered_at` | `timestamp` | YES | `NULL` |  |  |
| `status` | `enum('pending','success','failed','retrying')` | YES | `'pending'` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` |  |  |

---
### Table: `fb_webhooks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `0` |  |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `form_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `url` | `varchar(1000)` | NO | `NULL` |  |  |
| `secret` | `varchar(255)` | YES | `NULL` |  |  |
| `events` | `longtext` | NO | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `retry_count` | `int(11)` | YES | `3` |  |  |
| `timeout` | `int(11)` | YES | `30` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |

---
### Table: `field_dispatch_jobs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `job_id` | `int(11)` | YES | `NULL` |  |  |
| `appointment_id` | `int(11)` | YES | `NULL` |  |  |
| `assigned_technician_id` | `int(11)` | YES | `NULL` | MUL |  |
| `status` | `enum('pending','dispatched','en_route','on_site','completed','cancelled')` | YES | `'pending'` | MUL |  |
| `priority` | `enum('low','normal','high','emergency')` | YES | `'normal'` |  |  |
| `scheduled_start` | `datetime` | YES | `NULL` | MUL |  |
| `scheduled_end` | `datetime` | YES | `NULL` |  |  |
| `actual_start` | `datetime` | YES | `NULL` |  |  |
| `actual_end` | `datetime` | YES | `NULL` |  |  |
| `customer_name` | `varchar(255)` | YES | `NULL` |  |  |
| `customer_phone` | `varchar(50)` | YES | `NULL` |  |  |
| `service_address` | `text` | YES | `NULL` |  |  |
| `service_lat` | `decimal(10,8)` | YES | `NULL` |  |  |
| `service_lng` | `decimal(11,8)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_dispatch_scheduled`: `scheduled_start`
- `INDEX` `idx_dispatch_status`: `status`
- `INDEX` `idx_dispatch_technician`: `assigned_technician_id`
- `INDEX` `idx_dispatch_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `file_activities`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `file_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | YES | `NULL` | MUL |  |
| `activity_type` | `enum('upload','download','share','move','rename','delete','restore','star','unstar','view')` | NO | `NULL` | MUL |  |
| `description` | `text` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `varchar(255)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Foreign Keys:**
- `file_id` -> `files.id` (Constraint: `file_activities_ibfk_1`)

**Indexes:**
- `INDEX` `idx_created`: `created_at`
- `INDEX` `idx_file`: `file_id`
- `INDEX` `idx_type`: `activity_type`
- `INDEX` `idx_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `file_shares`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `file_id` | `int(11)` | NO | `NULL` | MUL |  |
| `shared_with_email` | `varchar(255)` | NO | `NULL` | MUL |  |
| `shared_with_user_id` | `int(11)` | YES | `NULL` |  |  |
| `permission` | `enum('view','edit')` | YES | `'view'` |  |  |
| `shared_by_user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `expires_at` | `timestamp` | YES | `NULL` | MUL |  |
| `accessed_at` | `timestamp` | YES | `NULL` |  |  |
| `access_count` | `int(11)` | YES | `0` |  |  |

**Foreign Keys:**
- `file_id` -> `files.id` (Constraint: `file_shares_ibfk_1`)

**Indexes:**
- `INDEX` `idx_email`: `shared_with_email`
- `INDEX` `idx_expires`: `expires_at`
- `INDEX` `idx_file`: `file_id`
- `INDEX` `idx_shared_by`: `shared_by_user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `file_tags`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `file_id` | `int(11)` | NO | `NULL` | MUL |  |
| `tag` | `varchar(50)` | NO | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_file_tags_tag`: `tag`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_file_tag`: `file_id`, `tag`

---
### Table: `files`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `1` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `user_id` | `int(11)` | YES | `NULL` |  |  |
| `filename` | `varchar(255)` | NO | `NULL` |  |  |
| `filepath` | `varchar(1000)` | YES | `NULL` |  |  |
| `original_filename` | `varchar(255)` | NO | `NULL` |  |  |
| `mime_type` | `varchar(100)` | NO | `NULL` |  |  |
| `file_size` | `int(11)` | NO | `NULL` |  |  |
| `storage_path` | `varchar(500)` | NO | `NULL` |  |  |
| `storage_provider` | `enum('local','s3','cloudinary')` | YES | `'local'` |  |  |
| `public_url` | `varchar(500)` | YES | `NULL` |  |  |
| `folder` | `varchar(100)` | YES | `NULL` | MUL |  |
| `category` | `enum('attachment','image','document','receipt','photo','video','audio','other')` | YES | `'attachment'` |  |  |
| `entity_type` | `varchar(50)` | YES | `NULL` |  |  |
| `entity_id` | `int(11)` | YES | `NULL` |  |  |
| `folder_id` | `int(11)` | YES | `NULL` | MUL |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `alt_text` | `varchar(255)` | YES | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `is_public` | `tinyint(1)` | YES | `0` |  |  |
| `is_archived` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `deleted_at` | `timestamp` | YES | `NULL` |  |  |
| `starred` | `tinyint(1)` | YES | `0` | MUL |  |
| `shared_with` | `longtext` | YES | `NULL` |  |  |
| `owner_id` | `int(11)` | YES | `NULL` | MUL |  |
| `last_accessed_at` | `timestamp` | YES | `NULL` |  |  |
| `download_count` | `int(11)` | YES | `0` |  |  |

**Indexes:**
- `INDEX` `idx_created`: `created_at`
- `INDEX` `idx_files_entity`: `workspace_id`, `entity_type`, `entity_id`
- `INDEX` `idx_files_folder_id`: `folder_id`
- `INDEX` `idx_files_workspace`: `workspace_id`
- `INDEX` `idx_folder`: `folder`
- `INDEX` `idx_owner`: `owner_id`
- `INDEX` `idx_starred`: `starred`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `flow_contacts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `flow_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` |  |  |
| `current_node_id` | `varchar(100)` | YES | `NULL` |  |  |
| `status` | `enum('active','completed','paused','exited')` | YES | `'active'` | MUL |  |
| `entered_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_flow_contact`: `flow_id`, `contact_id`
- `INDEX` `idx_status`: `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `flow_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `flow_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` |  |  |
| `node_id` | `varchar(100)` | YES | `NULL` |  |  |
| `action_type` | `varchar(50)` | YES | `NULL` |  |  |
| `status` | `enum('success','failed','skipped')` | YES | `'success'` |  |  |
| `details` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_created`: `created_at`
- `INDEX` `idx_flow`: `flow_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `flow_scheduled_actions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `flow_id` | `int(11)` | NO | `NULL` | MUL |  |
| `flow_contact_id` | `int(11)` | NO | `NULL` |  |  |
| `node_id` | `varchar(100)` | NO | `NULL` |  |  |
| `scheduled_for` | `timestamp` | NO | `current_timestamp()` | MUL | on update current_timestamp() |
| `status` | `enum('pending','executed','cancelled')` | YES | `'pending'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `executed_at` | `timestamp` | YES | `NULL` |  |  |

**Foreign Keys:**
- `flow_id` -> `campaign_flows.id` (Constraint: `flow_scheduled_actions_ibfk_1`)

**Indexes:**
- `INDEX` `idx_flow`: `flow_id`
- `INDEX` `idx_scheduled`: `scheduled_for`, `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `flow_stats`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `flow_id` | `int(11)` | NO | `NULL` | UNI |  |
| `total_contacts` | `int(11)` | YES | `0` |  |  |
| `emails_sent` | `int(11)` | YES | `0` |  |  |
| `sms_sent` | `int(11)` | YES | `0` |  |  |
| `conversions` | `int(11)` | YES | `0` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_flow`: `flow_id`

---
### Table: `folders`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `parent_id` | `int(11)` | YES | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `deleted_at` | `timestamp` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_folders_workspace`: `workspace_id`
- `INDEX` `parent_id`: `parent_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`

---
### Table: `follow_up_emails`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `campaign_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `subject` | `text` | NO | `NULL` |  |  |
| `content` | `text` | NO | `NULL` |  |  |
| `delay_days` | `int(11)` | NO | `1` |  |  |
| `email_order` | `int(11)` | NO | `1` |  |  |
| `is_active` | `tinyint(4)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Indexes:**
- `INDEX` `idx_follow_up_emails_campaign_id`: `campaign_id`
- `INDEX` `idx_follow_up_emails_order`: `campaign_id`, `email_order`
- `INDEX` `idx_follow_up_emails_user_id`: `user_id`
- `INDEX` `idx_follow_up_emails_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `followup_automations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `recipe_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `channel` | `varchar(50)` | NO | `NULL` | MUL |  |
| `trigger_type` | `varchar(100)` | NO | `NULL` | MUL |  |
| `trigger_conditions` | `longtext` | YES | `NULL` |  |  |
| `action_type` | `varchar(100)` | NO | `NULL` |  |  |
| `action_config` | `longtext` | NO | `NULL` |  |  |
| `delay_amount` | `int(11)` | YES | `0` |  |  |
| `delay_unit` | `varchar(20)` | YES | `'minutes'` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` | MUL |  |
| `priority` | `int(11)` | YES | `0` |  |  |
| `campaign_id` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_followup_automations_active`: `is_active`
- `INDEX` `idx_followup_automations_channel`: `channel`
- `INDEX` `idx_followup_automations_trigger`: `trigger_type`
- `INDEX` `idx_followup_automations_user`: `user_id`
- `INDEX` `idx_recipe`: `recipe_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `form_analytics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `form_id` | `int(11)` | NO | `NULL` | MUL |  |
| `submission_data` | `longtext` | YES | `NULL` |  |  |
| `event_type` | `varchar(50)` | NO | `NULL` | MUL |  |
| `source` | `varchar(100)` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `session_id` | `varchar(255)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_form_analytics_created_at`: `created_at`
- `INDEX` `idx_form_analytics_event_type`: `event_type`
- `INDEX` `idx_form_analytics_form_id`: `form_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `form_responses`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `form_id` | `int(11)` | NO | `NULL` | MUL |  |
| `response_data` | `longtext` | NO | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `is_read` | `tinyint(1)` | YES | `0` | MUL |  |
| `is_starred` | `tinyint(1)` | YES | `0` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `response_time` | `int(11)` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `form_id`: `form_id`
- `INDEX` `idx_form_responses_is_read`: `is_read`
- `INDEX` `idx_form_responses_is_starred`: `is_starred`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `form_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | UNI |  |
| `data` | `longtext` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_user_form_settings`: `user_id`

---
### Table: `form_submissions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `form_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `data` | `longtext` | NO | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `referrer` | `text` | YES | `NULL` |  |  |
| `utm_source` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_medium` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_campaign` | `varchar(255)` | YES | `NULL` |  |  |
| `status` | `enum('new','read','replied','archived','spam')` | YES | `'new'` | MUL |  |
| `is_spam` | `tinyint(1)` | YES | `0` |  |  |
| `spam_score` | `decimal(5,2)` | YES | `0.00` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_form_submissions_contact`: `contact_id`
- `INDEX` `idx_form_submissions_created`: `created_at`
- `INDEX` `idx_form_submissions_form`: `form_id`
- `INDEX` `idx_form_submissions_status`: `status`
- `INDEX` `idx_form_submissions_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `form_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `varchar(36)` | NO | `NULL` | PRI |  |
| `user_id` | `varchar(36)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `fields` | `longtext` | NO | `NULL` |  |  |
| `is_multi_step` | `tinyint(1)` | YES | `0` |  |  |
| `steps` | `longtext` | YES | `NULL` |  |  |
| `category` | `varchar(50)` | NO | `'other'` | MUL |  |
| `niche` | `varchar(100)` | YES | `NULL` | MUL |  |
| `preview_image` | `varchar(500)` | YES | `NULL` |  |  |
| `is_system` | `tinyint(1)` | YES | `0` | MUL |  |
| `usage_count` | `int(11)` | YES | `0` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_category`: `category`
- `INDEX` `idx_form_templates_category`: `category`
- `INDEX` `idx_form_templates_is_system`: `is_system`
- `INDEX` `idx_form_templates_niche`: `niche`
- `INDEX` `idx_usage_count`: `usage_count`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `forms`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `fields` | `longtext` | YES | `NULL` |  |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `style` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('draft','published','archived')` | YES | `'draft'` | MUL |  |
| `folder_id` | `int(11)` | YES | `NULL` |  |  |
| `is_template` | `tinyint(1)` | YES | `0` |  |  |
| `views` | `int(11)` | YES | `0` |  |  |
| `submissions_count` | `int(11)` | YES | `0` |  |  |
| `conversion_rate` | `decimal(5,2)` | YES | `0.00` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_webforms_status`: `status`
- `INDEX` `idx_webforms_user`: `user_id`
- `INDEX` `idx_webforms_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `fsm_appointments`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `staff_id` | `int(11)` | YES | `NULL` | MUL |  |
| `service_id` | `int(11)` | YES | `NULL` |  |  |
| `job_id` | `int(11)` | YES | `NULL` |  |  |
| `booking_type_id` | `int(11)` | YES | `NULL` |  |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `guest_name` | `varchar(255)` | YES | `NULL` |  |  |
| `guest_email` | `varchar(255)` | YES | `NULL` |  |  |
| `guest_phone` | `varchar(50)` | YES | `NULL` |  |  |
| `scheduled_at` | `datetime` | NO | `NULL` |  |  |
| `duration_minutes` | `int(11)` | YES | `30` |  |  |
| `end_at` | `datetime` | YES | `NULL` |  |  |
| `timezone` | `varchar(50)` | YES | `'America/New_York'` |  |  |
| `location_type` | `enum('in_person','video','phone')` | YES | `'in_person'` |  |  |
| `location` | `varchar(500)` | YES | `NULL` |  |  |
| `meeting_link` | `varchar(500)` | YES | `NULL` |  |  |
| `status` | `enum('scheduled','confirmed','in_progress','completed','cancelled','no_show','rescheduled')` | YES | `'scheduled'` | MUL |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `internal_notes` | `text` | YES | `NULL` |  |  |
| `reminder_sent_at` | `datetime` | YES | `NULL` |  |  |
| `confirmation_sent_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_fsm_appointments_contact`: `contact_id`
- `INDEX` `idx_fsm_appointments_staff`: `staff_id`
- `INDEX` `idx_fsm_appointments_status`: `status`
- `INDEX` `idx_fsm_appointments_workspace`: `workspace_id`
- `INDEX` `idx_fsm_appointments_workspace_date`: `workspace_id`, `scheduled_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `fsm_availability_schedules`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `staff_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `timezone` | `varchar(50)` | YES | `'America/New_York'` |  |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `slots` | `longtext` | NO | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_fsm_availability_staff`: `staff_id`
- `INDEX` `idx_fsm_availability_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `fsm_booking_page_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | UNI |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `page_slug` | `varchar(100)` | YES | `NULL` |  |  |
| `page_title` | `varchar(255)` | YES | `NULL` |  |  |
| `welcome_message` | `text` | YES | `NULL` |  |  |
| `logo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `brand_color` | `varchar(20)` | YES | `'#3B82F6'` |  |  |
| `show_branding` | `tinyint(1)` | YES | `1` |  |  |
| `require_phone` | `tinyint(1)` | YES | `0` |  |  |
| `custom_questions` | `longtext` | YES | `NULL` |  |  |
| `confirmation_message` | `text` | YES | `NULL` |  |  |
| `redirect_url` | `varchar(500)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_fsm_booking_page_workspace`: `workspace_id`

---
### Table: `fsm_booking_types`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `service_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `slug` | `varchar(255)` | YES | `NULL` | MUL |  |
| `description` | `text` | YES | `NULL` |  |  |
| `duration_minutes` | `int(11)` | YES | `30` |  |  |
| `buffer_before` | `int(11)` | YES | `0` |  |  |
| `buffer_after` | `int(11)` | YES | `15` |  |  |
| `location_type` | `enum('in_person','video','phone')` | YES | `'video'` |  |  |
| `location_details` | `varchar(500)` | YES | `NULL` |  |  |
| `price` | `decimal(10,2)` | YES | `0.00` |  |  |
| `currency` | `varchar(10)` | YES | `'USD'` |  |  |
| `requires_payment` | `tinyint(1)` | YES | `0` |  |  |
| `require_deposit` | `tinyint(1)` | YES | `0` |  |  |
| `deposit_amount` | `decimal(10,2)` | YES | `NULL` |  |  |
| `color` | `varchar(20)` | YES | `'#3B82F6'` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `max_bookings_per_day` | `int(11)` | YES | `NULL` |  |  |
| `min_notice_hours` | `int(11)` | YES | `24` |  |  |
| `max_future_days` | `int(11)` | YES | `60` |  |  |
| `allow_staff_selection` | `tinyint(1)` | YES | `0` |  |  |
| `assigned_staff_ids` | `longtext` | YES | `NULL` |  |  |
| `intake_form_id` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_fsm_booking_types_active`: `workspace_id`, `is_active`
- `INDEX` `idx_fsm_booking_types_slug`: `slug`
- `INDEX` `idx_fsm_booking_types_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `fsm_contact_recalls`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `schedule_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `job_id` | `int(11)` | YES | `NULL` |  |  |
| `last_service_date` | `date` | YES | `NULL` |  |  |
| `next_recall_date` | `date` | YES | `NULL` | MUL |  |
| `status` | `enum('pending','notified','scheduled','completed','skipped')` | YES | `'pending'` |  |  |
| `notified_at` | `datetime` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `schedule_id` -> `fsm_recall_schedules.id` (Constraint: `fsm_contact_recalls_ibfk_1`)

**Indexes:**
- `INDEX` `idx_fsm_contact_recalls_contact`: `contact_id`
- `INDEX` `idx_fsm_contact_recalls_next_date`: `next_recall_date`
- `INDEX` `idx_fsm_contact_recalls_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `schedule_id`: `schedule_id`

---
### Table: `fsm_estimate_line_items`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `estimate_id` | `int(11)` | NO | `NULL` | MUL |  |
| `service_id` | `int(11)` | YES | `NULL` |  |  |
| `description` | `varchar(500)` | NO | `NULL` |  |  |
| `quantity` | `decimal(10,2)` | YES | `1.00` |  |  |
| `unit_price` | `decimal(10,2)` | YES | `0.00` |  |  |
| `total` | `decimal(10,2)` | YES | `0.00` |  |  |
| `item_type` | `enum('service','part','labor','fee','discount')` | YES | `'service'` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `estimate_id` -> `fsm_estimates.id` (Constraint: `fsm_estimate_line_items_ibfk_1`)

**Indexes:**
- `INDEX` `idx_fsm_estimate_line_items_estimate`: `estimate_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `fsm_estimates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `job_id` | `int(11)` | YES | `NULL` | MUL |  |
| `estimate_number` | `varchar(50)` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | YES | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `status` | `enum('draft','sent','viewed','accepted','declined','expired','converted')` | YES | `'draft'` |  |  |
| `subtotal` | `decimal(10,2)` | YES | `0.00` |  |  |
| `tax_rate` | `decimal(5,2)` | YES | `0.00` |  |  |
| `tax_amount` | `decimal(10,2)` | YES | `0.00` |  |  |
| `discount_amount` | `decimal(10,2)` | YES | `0.00` |  |  |
| `total` | `decimal(10,2)` | YES | `0.00` |  |  |
| `valid_until` | `date` | YES | `NULL` |  |  |
| `terms` | `text` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `sent_at` | `datetime` | YES | `NULL` |  |  |
| `viewed_at` | `datetime` | YES | `NULL` |  |  |
| `accepted_at` | `datetime` | YES | `NULL` |  |  |
| `signature_url` | `varchar(500)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_fsm_estimates_contact`: `contact_id`
- `INDEX` `idx_fsm_estimates_job`: `job_id`
- `INDEX` `idx_fsm_estimates_number`: `estimate_number`
- `INDEX` `idx_fsm_estimates_workspace`: `workspace_id`
- `INDEX` `idx_fsm_estimates_workspace_status`: `workspace_id`, `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `fsm_industry_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | UNI |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `industry_type` | `varchar(100)` | YES | `NULL` |  |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_fsm_industry_workspace`: `workspace_id`

---
### Table: `fsm_intake_submissions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `template_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `job_id` | `int(11)` | YES | `NULL` |  |  |
| `appointment_id` | `int(11)` | YES | `NULL` |  |  |
| `response_data` | `longtext` | NO | `NULL` |  |  |
| `submitted_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `ip_address` | `varchar(50)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |

**Foreign Keys:**
- `template_id` -> `fsm_intake_templates.id` (Constraint: `fsm_intake_submissions_ibfk_1`)

**Indexes:**
- `INDEX` `idx_fsm_intake_submissions_contact`: `contact_id`
- `INDEX` `idx_fsm_intake_submissions_template`: `template_id`
- `INDEX` `idx_fsm_intake_submissions_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `fsm_intake_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `fields` | `longtext` | NO | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_fsm_intake_templates_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `fsm_playbooks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `category` | `varchar(100)` | YES | `NULL` |  |  |
| `content` | `longtext` | NO | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_fsm_playbooks_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `fsm_recall_schedules`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `service_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `interval_days` | `int(11)` | YES | `365` |  |  |
| `reminder_days_before` | `int(11)` | YES | `30` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `email_template_id` | `int(11)` | YES | `NULL` |  |  |
| `sms_template_id` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_fsm_recall_schedules_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `fsm_referral_programs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `reward_type` | `enum('fixed','percentage','credit')` | YES | `'fixed'` |  |  |
| `reward_value` | `decimal(10,2)` | YES | `0.00` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `terms` | `text` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_fsm_referral_programs_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `fsm_referrals`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `program_id` | `int(11)` | YES | `NULL` |  |  |
| `referrer_contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `referred_contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `job_id` | `int(11)` | YES | `NULL` |  |  |
| `status` | `enum('pending','qualified','converted','paid','expired')` | YES | `'pending'` |  |  |
| `reward_amount` | `decimal(10,2)` | YES | `0.00` |  |  |
| `reward_paid_at` | `datetime` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_fsm_referrals_referred`: `referred_contact_id`
- `INDEX` `idx_fsm_referrals_referrer`: `referrer_contact_id`
- `INDEX` `idx_fsm_referrals_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `fsm_service_categories`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `color` | `varchar(20)` | YES | `'#3B82F6'` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_fsm_service_categories_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `fsm_services`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `category_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `price` | `decimal(10,2)` | YES | `0.00` |  |  |
| `duration_minutes` | `int(11)` | YES | `60` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_fsm_services_category`: `category_id`
- `INDEX` `idx_fsm_services_workspace`: `workspace_id`
- `INDEX` `idx_fsm_services_workspace_active`: `workspace_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `fsm_staff`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `email` | `varchar(255)` | YES | `NULL` | MUL |  |
| `phone` | `varchar(50)` | YES | `NULL` |  |  |
| `role` | `varchar(100)` | YES | `'technician'` |  |  |
| `avatar_url` | `varchar(500)` | YES | `NULL` |  |  |
| `color` | `varchar(20)` | YES | `'#3B82F6'` |  |  |
| `hourly_rate` | `decimal(10,2)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `skills` | `longtext` | YES | `NULL` |  |  |
| `availability` | `longtext` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_fsm_staff_email`: `email`
- `INDEX` `idx_fsm_staff_workspace`: `workspace_id`
- `INDEX` `idx_fsm_staff_workspace_active`: `workspace_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `fulfillments`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `invoice_id` | `int(11)` | YES | `NULL` | MUL |  |
| `order_id` | `int(11)` | YES | `NULL` |  |  |
| `order_type` | `enum('invoice','ecommerce_order','payment_link_order')` | YES | `'invoice'` |  |  |
| `status` | `enum('unfulfilled','processing','partially_shipped','shipped','delivered','cancelled')` | YES | `'unfulfilled'` |  |  |
| `tracking_number` | `varchar(255)` | YES | `NULL` | MUL |  |
| `courier` | `varchar(100)` | YES | `NULL` |  |  |
| `tracking_url` | `varchar(500)` | YES | `NULL` |  |  |
| `shipping_address` | `longtext` | YES | `NULL` |  |  |
| `line_items` | `longtext` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `shipped_at` | `datetime` | YES | `NULL` |  |  |
| `delivered_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `fulfillments_ibfk_1`)
- `invoice_id` -> `invoices.id` (Constraint: `fulfillments_ibfk_2`)

**Indexes:**
- `INDEX` `idx_invoice`: `invoice_id`
- `INDEX` `idx_tracking`: `tracking_number`
- `INDEX` `idx_user_status`: `user_id`, `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `funnel_analytics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `funnel_id` | `int(11)` | YES | `NULL` | MUL |  |
| `date` | `date` | NO | `NULL` | MUL |  |
| `step_name` | `varchar(255)` | NO | `NULL` |  |  |
| `step_order` | `int(11)` | NO | `NULL` |  |  |
| `visitors` | `int(11)` | YES | `0` |  |  |
| `conversions` | `int(11)` | YES | `0` |  |  |
| `conversion_rate` | `decimal(5,2)` | YES | `0.00` |  |  |
| `avg_time_on_step` | `int(11)` | YES | `0` |  |  |
| `drop_off_count` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_date`: `date`
- `INDEX` `idx_funnel`: `funnel_id`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_funnel_step`: `workspace_id`, `funnel_id`, `date`, `step_name`

---
### Table: `funnel_steps`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `funnel_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `slug` | `varchar(100)` | YES | `NULL` |  |  |
| `step_type` | `enum('landing','optin','sales','checkout','upsell','downsell','thankyou','webinar','custom')` | YES | `'landing'` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `landing_page_id` | `int(11)` | YES | `NULL` |  |  |
| `page_content` | `longtext` | YES | `NULL` |  |  |
| `conversion_goal` | `enum('pageview','form_submit','button_click','purchase','custom')` | YES | `'pageview'` |  |  |
| `conversion_value` | `decimal(10,2)` | YES | `NULL` |  |  |
| `views` | `int(11)` | YES | `0` |  |  |
| `conversions` | `int(11)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `funnel_id` -> `funnels.id` (Constraint: `funnel_steps_ibfk_1`)

**Indexes:**
- `INDEX` `idx_funnel_steps`: `funnel_id`, `sort_order`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `funnels`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `slug` | `varchar(100)` | YES | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `domain` | `varchar(255)` | YES | `NULL` |  |  |
| `favicon_url` | `varchar(500)` | YES | `NULL` |  |  |
| `total_views` | `int(11)` | YES | `0` |  |  |
| `total_conversions` | `int(11)` | YES | `0` |  |  |
| `conversion_rate` | `decimal(5,2)` | YES | `0.00` |  |  |
| `status` | `enum('draft','published','archived')` | YES | `'draft'` |  |  |
| `published_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_funnels_workspace`: `workspace_id`, `status`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_funnel_slug`: `workspace_id`, `slug`

---
### Table: `gbp_accounts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | UNI |  |
| `google_account_id` | `varchar(255)` | YES | `NULL` |  |  |
| `google_email` | `varchar(255)` | YES | `NULL` |  |  |
| `location_id` | `varchar(255)` | YES | `NULL` | MUL |  |
| `location_name` | `varchar(255)` | YES | `NULL` |  |  |
| `business_name` | `varchar(255)` | YES | `NULL` |  |  |
| `address` | `varchar(500)` | YES | `NULL` |  |  |
| `phone` | `varchar(20)` | YES | `NULL` |  |  |
| `website` | `varchar(500)` | YES | `NULL` |  |  |
| `primary_category` | `varchar(255)` | YES | `NULL` |  |  |
| `additional_categories` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('pending','connected','error','disconnected')` | YES | `'pending'` |  |  |
| `verification_status` | `varchar(50)` | YES | `NULL` |  |  |
| `last_sync_at` | `timestamp` | YES | `NULL` |  |  |
| `sync_error` | `text` | YES | `NULL` |  |  |
| `access_token_encrypted` | `text` | YES | `NULL` |  |  |
| `refresh_token_encrypted` | `text` | YES | `NULL` |  |  |
| `token_expires_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_gbp_location`: `location_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace`: `workspace_id`

---
### Table: `gbp_posts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `gbp_account_id` | `int(11)` | NO | `NULL` | MUL |  |
| `google_post_id` | `varchar(255)` | YES | `NULL` |  |  |
| `post_type` | `enum('standard','event','offer','product')` | YES | `'standard'` |  |  |
| `summary` | `text` | NO | `NULL` |  |  |
| `media_url` | `varchar(500)` | YES | `NULL` |  |  |
| `media_type` | `enum('photo','video')` | YES | `NULL` |  |  |
| `cta_type` | `enum('book','order','shop','learn_more','sign_up','call')` | YES | `NULL` |  |  |
| `cta_url` | `varchar(500)` | YES | `NULL` |  |  |
| `event_title` | `varchar(255)` | YES | `NULL` |  |  |
| `event_start` | `datetime` | YES | `NULL` |  |  |
| `event_end` | `datetime` | YES | `NULL` |  |  |
| `offer_code` | `varchar(50)` | YES | `NULL` |  |  |
| `offer_terms` | `text` | YES | `NULL` |  |  |
| `offer_start` | `date` | YES | `NULL` |  |  |
| `offer_end` | `date` | YES | `NULL` |  |  |
| `status` | `enum('draft','scheduled','published','failed','deleted')` | YES | `'draft'` | MUL |  |
| `scheduled_at` | `timestamp` | YES | `NULL` |  |  |
| `published_at` | `timestamp` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `views` | `int(11)` | YES | `0` |  |  |
| `clicks` | `int(11)` | YES | `0` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `gbp_account_id` -> `gbp_accounts.id` (Constraint: `gbp_posts_ibfk_1`)

**Indexes:**
- `INDEX` `gbp_account_id`: `gbp_account_id`
- `INDEX` `idx_gbp_posts_scheduled`: `status`, `scheduled_at`
- `INDEX` `idx_gbp_posts_workspace`: `workspace_id`, `status`, `created_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `geofence_events`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `geofence_id` | `int(11)` | NO | `NULL` | MUL |  |
| `device_id` | `int(11)` | NO | `NULL` |  |  |
| `user_id` | `int(11)` | YES | `NULL` |  |  |
| `event_type` | `enum('enter','exit','dwell')` | NO | `NULL` |  |  |
| `timestamp` | `datetime` | NO | `NULL` |  |  |
| `duration_seconds` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `geofence_id` -> `geofences.id` (Constraint: `geofence_events_ibfk_1`)

**Indexes:**
- `INDEX` `idx_geofence`: `geofence_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `geofences`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `geometry_type` | `enum('circle','polygon')` | YES | `'circle'` |  |  |
| `center_lat` | `decimal(10,8)` | YES | `NULL` |  |  |
| `center_lng` | `decimal(11,8)` | YES | `NULL` |  |  |
| `radius_meters` | `int(11)` | YES | `NULL` |  |  |
| `polygon_coords` | `text` | YES | `NULL` |  |  |
| `color` | `varchar(50)` | YES | `'#3B82F6'` |  |  |
| `trigger_enter` | `tinyint(1)` | YES | `1` |  |  |
| `trigger_exit` | `tinyint(1)` | YES | `1` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `gmb_answers`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `question_id` | `int(11)` | NO | `NULL` | MUL |  |
| `google_answer_id` | `varchar(255)` | NO | `NULL` |  |  |
| `answer_text` | `text` | NO | `NULL` |  |  |
| `author_display_name` | `varchar(255)` | YES | `NULL` |  |  |
| `author_profile_photo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `author_type` | `enum('customer','merchant','local_guide')` | YES | `'customer'` |  |  |
| `is_owner_answer` | `tinyint(1)` | YES | `0` |  |  |
| `upvote_count` | `int(11)` | YES | `0` |  |  |
| `answer_date` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `question_id` -> `gmb_questions.id` (Constraint: `gmb_answers_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_google_answer`: `question_id`, `google_answer_id`

---
### Table: `gmb_attributes`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `location_id` | `int(11)` | NO | `NULL` | MUL |  |
| `attribute_id` | `varchar(100)` | NO | `NULL` |  |  |
| `attribute_name` | `varchar(255)` | NO | `NULL` |  |  |
| `attribute_group` | `varchar(100)` | YES | `NULL` |  |  |
| `value_type` | `enum('boolean','enum','repeated_enum','url')` | YES | `'boolean'` |  |  |
| `value_boolean` | `tinyint(1)` | YES | `NULL` |  |  |
| `value_enum` | `varchar(255)` | YES | `NULL` |  |  |
| `value_repeated_enum` | `longtext` | YES | `NULL` |  |  |
| `value_url` | `varchar(500)` | YES | `NULL` |  |  |
| `is_editable` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `location_id` -> `gmb_locations.id` (Constraint: `gmb_attributes_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_location_attribute`: `location_id`, `attribute_id`

---
### Table: `gmb_business_hours`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `location_id` | `int(11)` | NO | `NULL` | MUL |  |
| `hours_type` | `enum('regular','special','holiday')` | YES | `'regular'` |  |  |
| `day_of_week` | `tinyint(4)` | YES | `NULL` |  |  |
| `open_time` | `time` | YES | `NULL` |  |  |
| `close_time` | `time` | YES | `NULL` |  |  |
| `is_closed` | `tinyint(1)` | YES | `0` |  |  |
| `is_24_hours` | `tinyint(1)` | YES | `0` |  |  |
| `special_date` | `date` | YES | `NULL` |  |  |
| `special_name` | `varchar(255)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `location_id` -> `gmb_locations.id` (Constraint: `gmb_business_hours_ibfk_1`)

**Indexes:**
- `INDEX` `idx_gmb_hours_location`: `location_id`, `hours_type`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `gmb_categories`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `category_id` | `varchar(100)` | NO | `NULL` | UNI |  |
| `display_name` | `varchar(255)` | NO | `NULL` |  |  |
| `parent_category_id` | `varchar(100)` | YES | `NULL` | MUL |  |
| `service_types` | `longtext` | YES | `NULL` |  |  |
| `more_hours_types` | `longtext` | YES | `NULL` |  |  |
| `is_gbp_category` | `tinyint(1)` | YES | `1` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |

**Indexes:**
- `INDEX` `idx_gmb_categories_parent`: `parent_category_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_category_id`: `category_id`

---
### Table: `gmb_connections`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `access_token` | `text` | YES | `NULL` |  |  |
| `refresh_token` | `text` | YES | `NULL` |  |  |
| `token_expires_at` | `timestamp` | YES | `NULL` |  |  |
| `google_account_id` | `varchar(255)` | YES | `NULL` |  |  |
| `google_email` | `varchar(255)` | YES | `NULL` |  |  |
| `google_name` | `varchar(255)` | YES | `NULL` |  |  |
| `google_avatar_url` | `varchar(500)` | YES | `NULL` |  |  |
| `status` | `enum('pending','connected','expired','revoked','error')` | YES | `'pending'` | MUL |  |
| `connection_error` | `text` | YES | `NULL` |  |  |
| `scopes` | `longtext` | YES | `NULL` |  |  |
| `connected_at` | `timestamp` | YES | `NULL` |  |  |
| `last_sync_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_gmb_conn_status`: `status`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_company`: `workspace_id`, `company_id`

---
### Table: `gmb_insights`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `location_id` | `int(11)` | NO | `NULL` | MUL |  |
| `date` | `date` | NO | `NULL` |  |  |
| `period_type` | `enum('day','week','month')` | YES | `'day'` |  |  |
| `queries_direct` | `int(11)` | YES | `0` |  |  |
| `queries_indirect` | `int(11)` | YES | `0` |  |  |
| `queries_chain` | `int(11)` | YES | `0` |  |  |
| `views_maps` | `int(11)` | YES | `0` |  |  |
| `views_search` | `int(11)` | YES | `0` |  |  |
| `actions_website` | `int(11)` | YES | `0` |  |  |
| `actions_phone` | `int(11)` | YES | `0` |  |  |
| `actions_driving_directions` | `int(11)` | YES | `0` |  |  |
| `actions_menu` | `int(11)` | YES | `0` |  |  |
| `actions_booking` | `int(11)` | YES | `0` |  |  |
| `actions_orders` | `int(11)` | YES | `0` |  |  |
| `photo_views_merchant` | `int(11)` | YES | `0` |  |  |
| `photo_views_customer` | `int(11)` | YES | `0` |  |  |
| `direction_requests` | `longtext` | YES | `NULL` |  |  |
| `search_keywords` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `location_id` -> `gmb_locations.id` (Constraint: `gmb_insights_ibfk_1`)

**Indexes:**
- `INDEX` `idx_gmb_insights_location`: `location_id`, `date`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_location_date`: `location_id`, `date`, `period_type`

---
### Table: `gmb_locations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `connection_id` | `int(11)` | NO | `NULL` | MUL |  |
| `google_location_id` | `varchar(255)` | NO | `NULL` |  |  |
| `google_place_id` | `varchar(255)` | YES | `NULL` |  |  |
| `maps_url` | `varchar(500)` | YES | `NULL` |  |  |
| `business_name` | `varchar(255)` | NO | `NULL` |  |  |
| `store_code` | `varchar(100)` | YES | `NULL` |  |  |
| `address_line_1` | `varchar(255)` | YES | `NULL` |  |  |
| `address_line_2` | `varchar(255)` | YES | `NULL` |  |  |
| `city` | `varchar(100)` | YES | `NULL` |  |  |
| `state` | `varchar(100)` | YES | `NULL` |  |  |
| `postal_code` | `varchar(20)` | YES | `NULL` |  |  |
| `country` | `varchar(2)` | YES | `'US'` |  |  |
| `latitude` | `decimal(10,7)` | YES | `NULL` |  |  |
| `longitude` | `decimal(10,7)` | YES | `NULL` |  |  |
| `primary_phone` | `varchar(20)` | YES | `NULL` |  |  |
| `additional_phones` | `longtext` | YES | `NULL` |  |  |
| `website_url` | `varchar(500)` | YES | `NULL` |  |  |
| `primary_category_id` | `varchar(100)` | YES | `NULL` |  |  |
| `primary_category_name` | `varchar(255)` | YES | `NULL` |  |  |
| `additional_categories` | `longtext` | YES | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `opening_date` | `date` | YES | `NULL` |  |  |
| `verification_status` | `enum('unverified','pending','verified','suspended')` | YES | `'unverified'` | MUL |  |
| `verification_method` | `varchar(50)` | YES | `NULL` |  |  |
| `is_published` | `tinyint(1)` | YES | `1` |  |  |
| `is_suspended` | `tinyint(1)` | YES | `0` |  |  |
| `suspension_reason` | `text` | YES | `NULL` |  |  |
| `labels` | `longtext` | YES | `NULL` |  |  |
| `total_reviews` | `int(11)` | YES | `0` |  |  |
| `average_rating` | `decimal(2,1)` | YES | `NULL` |  |  |
| `total_photos` | `int(11)` | YES | `0` |  |  |
| `last_sync_at` | `timestamp` | YES | `NULL` |  |  |
| `sync_status` | `enum('synced','syncing','error','pending')` | YES | `'pending'` |  |  |
| `sync_error` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `connection_id` -> `gmb_connections.id` (Constraint: `gmb_locations_ibfk_1`)

**Indexes:**
- `INDEX` `connection_id`: `connection_id`
- `INDEX` `idx_gmb_loc_status`: `verification_status`
- `INDEX` `idx_gmb_loc_workspace`: `workspace_id`, `company_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_google_location`: `workspace_id`, `google_location_id`

---
### Table: `gmb_photos`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `location_id` | `int(11)` | NO | `NULL` | MUL |  |
| `google_photo_id` | `varchar(255)` | YES | `NULL` |  |  |
| `google_photo_url` | `varchar(1000)` | YES | `NULL` |  |  |
| `local_file_path` | `varchar(500)` | YES | `NULL` |  |  |
| `category` | `enum('profile','cover','logo','exterior','interior','product','at_work','food_drink','menu','common_area','rooms','teams','additional')` | YES | `'additional'` |  |  |
| `description` | `varchar(500)` | YES | `NULL` |  |  |
| `width` | `int(11)` | YES | `NULL` |  |  |
| `height` | `int(11)` | YES | `NULL` |  |  |
| `status` | `enum('pending','uploaded','live','rejected','deleted')` | YES | `'pending'` |  |  |
| `rejection_reason` | `text` | YES | `NULL` |  |  |
| `view_count` | `int(11)` | YES | `0` |  |  |
| `uploaded_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `location_id` -> `gmb_locations.id` (Constraint: `gmb_photos_ibfk_1`)

**Indexes:**
- `INDEX` `idx_gmb_photos_location`: `location_id`, `category`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `gmb_posts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |
| `location_id` | `int(11)` | NO | `NULL` | MUL |  |
| `google_post_id` | `varchar(255)` | YES | `NULL` |  |  |
| `post_type` | `enum('standard','event','offer','product','alert','covid')` | YES | `'standard'` |  |  |
| `topic_type` | `enum('standard','event','offer','product','alert')` | YES | `'standard'` |  |  |
| `summary` | `text` | NO | `NULL` |  |  |
| `media_type` | `enum('photo','video')` | YES | `NULL` |  |  |
| `media_url` | `varchar(500)` | YES | `NULL` |  |  |
| `media_source_url` | `varchar(500)` | YES | `NULL` |  |  |
| `action_type` | `enum('action_type_unspecified','book','order','shop','learn_more','sign_up','call','get_offer')` | YES | `NULL` |  |  |
| `action_url` | `varchar(500)` | YES | `NULL` |  |  |
| `event_title` | `varchar(255)` | YES | `NULL` |  |  |
| `event_start_date` | `date` | YES | `NULL` |  |  |
| `event_start_time` | `time` | YES | `NULL` |  |  |
| `event_end_date` | `date` | YES | `NULL` |  |  |
| `event_end_time` | `time` | YES | `NULL` |  |  |
| `offer_coupon_code` | `varchar(50)` | YES | `NULL` |  |  |
| `offer_redeem_url` | `varchar(500)` | YES | `NULL` |  |  |
| `offer_terms` | `text` | YES | `NULL` |  |  |
| `status` | `enum('draft','scheduled','publishing','published','failed','expired','deleted')` | YES | `'draft'` | MUL |  |
| `scheduled_at` | `timestamp` | YES | `NULL` |  |  |
| `published_at` | `timestamp` | YES | `NULL` |  |  |
| `expires_at` | `timestamp` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `views` | `int(11)` | YES | `0` |  |  |
| `clicks` | `int(11)` | YES | `0` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `location_id` -> `gmb_locations.id` (Constraint: `gmb_posts_ibfk_1`)

**Indexes:**
- `INDEX` `idx_gmb_posts_location`: `location_id`, `status`
- `INDEX` `idx_gmb_posts_scheduled`: `status`, `scheduled_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `gmb_products`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `location_id` | `int(11)` | NO | `NULL` | MUL |  |
| `google_product_id` | `varchar(255)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `price` | `decimal(10,2)` | YES | `NULL` |  |  |
| `currency_code` | `varchar(3)` | YES | `'USD'` |  |  |
| `category_id` | `varchar(100)` | YES | `NULL` |  |  |
| `category_name` | `varchar(255)` | YES | `NULL` |  |  |
| `photo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `display_order` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `location_id` -> `gmb_locations.id` (Constraint: `gmb_products_ibfk_1`)

**Indexes:**
- `INDEX` `idx_gmb_products_location`: `location_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `gmb_questions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `location_id` | `int(11)` | NO | `NULL` | MUL |  |
| `google_question_id` | `varchar(255)` | NO | `NULL` |  |  |
| `question_text` | `text` | NO | `NULL` |  |  |
| `author_display_name` | `varchar(255)` | YES | `NULL` |  |  |
| `author_profile_photo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `author_type` | `enum('customer','merchant','local_guide')` | YES | `'customer'` |  |  |
| `status` | `enum('unanswered','answered','flagged')` | YES | `'unanswered'` |  |  |
| `total_answers` | `int(11)` | YES | `0` |  |  |
| `upvote_count` | `int(11)` | YES | `0` |  |  |
| `question_date` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `location_id` -> `gmb_locations.id` (Constraint: `gmb_questions_ibfk_1`)

**Indexes:**
- `INDEX` `idx_gmb_questions_location`: `location_id`, `status`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_google_question`: `location_id`, `google_question_id`

---
### Table: `gmb_reviews`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |
| `location_id` | `int(11)` | NO | `NULL` | MUL |  |
| `google_review_id` | `varchar(255)` | NO | `NULL` |  |  |
| `reviewer_display_name` | `varchar(255)` | YES | `NULL` |  |  |
| `reviewer_profile_photo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `reviewer_is_anonymous` | `tinyint(1)` | YES | `0` |  |  |
| `star_rating` | `tinyint(4)` | NO | `NULL` |  |  |
| `comment` | `text` | YES | `NULL` |  |  |
| `reply_text` | `text` | YES | `NULL` |  |  |
| `replied_at` | `timestamp` | YES | `NULL` |  |  |
| `replied_by` | `int(11)` | YES | `NULL` |  |  |
| `status` | `enum('new','read','responded','flagged')` | YES | `'new'` |  |  |
| `is_flagged` | `tinyint(1)` | YES | `0` |  |  |
| `flag_reason` | `text` | YES | `NULL` |  |  |
| `sentiment` | `enum('positive','neutral','negative')` | YES | `NULL` |  |  |
| `sentiment_score` | `decimal(3,2)` | YES | `NULL` |  |  |
| `key_topics` | `longtext` | YES | `NULL` |  |  |
| `suggested_response` | `text` | YES | `NULL` |  |  |
| `review_date` | `datetime` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `location_id` -> `gmb_locations.id` (Constraint: `gmb_reviews_ibfk_1`)

**Indexes:**
- `INDEX` `idx_gmb_reviews_location`: `location_id`, `status`
- `INDEX` `idx_gmb_reviews_rating`: `location_id`, `star_rating`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_google_review`: `location_id`, `google_review_id`

---
### Table: `gmb_services`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `location_id` | `int(11)` | NO | `NULL` | MUL |  |
| `service_type_id` | `varchar(100)` | YES | `NULL` |  |  |
| `service_name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `price_type` | `enum('free','fixed','from','range','no_price')` | YES | `'no_price'` |  |  |
| `price_min` | `decimal(10,2)` | YES | `NULL` |  |  |
| `price_max` | `decimal(10,2)` | YES | `NULL` |  |  |
| `currency_code` | `varchar(3)` | YES | `'USD'` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `display_order` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `location_id` -> `gmb_locations.id` (Constraint: `gmb_services_ibfk_1`)

**Indexes:**
- `INDEX` `idx_gmb_services_location`: `location_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `gmb_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | UNI |  |
| `auto_sync_enabled` | `tinyint(1)` | YES | `1` |  |  |
| `sync_interval_minutes` | `int(11)` | YES | `60` |  |  |
| `auto_reply_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `auto_reply_min_rating` | `tinyint(4)` | YES | `4` |  |  |
| `auto_reply_templates` | `longtext` | YES | `NULL` |  |  |
| `notify_new_reviews` | `tinyint(1)` | YES | `1` |  |  |
| `notify_new_questions` | `tinyint(1)` | YES | `1` |  |  |
| `notify_low_ratings` | `tinyint(1)` | YES | `1` |  |  |
| `low_rating_threshold` | `tinyint(4)` | YES | `3` |  |  |
| `notification_email` | `varchar(255)` | YES | `NULL` |  |  |
| `default_post_timezone` | `varchar(50)` | YES | `'America/New_York'` |  |  |
| `auto_expire_posts` | `tinyint(1)` | YES | `1` |  |  |
| `default_post_expiry_days` | `int(11)` | YES | `7` |  |  |
| `ai_suggested_responses` | `tinyint(1)` | YES | `1` |  |  |
| `ai_sentiment_analysis` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace`: `workspace_id`

---
### Table: `gmb_sync_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `location_id` | `int(11)` | YES | `NULL` |  |  |
| `sync_type` | `enum('full','incremental','reviews','posts','insights','photos','qa')` | NO | `NULL` |  |  |
| `status` | `enum('started','completed','failed','partial')` | YES | `'started'` |  |  |
| `items_synced` | `int(11)` | YES | `0` |  |  |
| `items_created` | `int(11)` | YES | `0` |  |  |
| `items_updated` | `int(11)` | YES | `0` |  |  |
| `items_deleted` | `int(11)` | YES | `0` |  |  |
| `errors` | `longtext` | YES | `NULL` |  |  |
| `started_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |
| `duration_seconds` | `int(11)` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_gmb_sync_workspace`: `workspace_id`, `sync_type`, `started_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `gmb_verifications`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `location_id` | `int(11)` | NO | `NULL` | MUL |  |
| `method` | `enum('postcard','phone','email','video','live_video')` | NO | `NULL` |  |  |
| `phone_number` | `varchar(20)` | YES | `NULL` |  |  |
| `email_address` | `varchar(255)` | YES | `NULL` |  |  |
| `address_data` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('requested','pending','verified','failed','expired')` | YES | `'requested'` |  |  |
| `verification_code` | `varchar(10)` | YES | `NULL` |  |  |
| `expires_at` | `timestamp` | YES | `NULL` |  |  |
| `requested_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |

**Foreign Keys:**
- `location_id` -> `gmb_locations.id` (Constraint: `gmb_verifications_ibfk_1`)

**Indexes:**
- `INDEX` `idx_gmb_verifications_location`: `location_id`, `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `goal_progress`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `goal_id` | `int(11)` | NO | `NULL` | MUL |  |
| `recorded_at` | `date` | NO | `NULL` | MUL |  |
| `value` | `decimal(15,2)` | NO | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_progress_date`: `recorded_at`
- `INDEX` `idx_progress_goal`: `goal_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `goals`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `metric_type` | `enum('revenue','contacts','deals','emails_sent','calls_made','appointments','form_submissions','custom')` | NO | `NULL` |  |  |
| `target_value` | `decimal(15,2)` | NO | `NULL` |  |  |
| `current_value` | `decimal(15,2)` | NO | `0.00` |  |  |
| `period_type` | `enum('daily','weekly','monthly','quarterly','yearly','custom')` | NO | `'monthly'` |  |  |
| `start_date` | `date` | NO | `NULL` |  |  |
| `end_date` | `date` | NO | `NULL` |  |  |
| `status` | `enum('on_track','at_risk','behind','achieved','not_started')` | NO | `'not_started'` | MUL |  |
| `notify_at_percent` | `int(11)` | YES | `NULL` |  |  |
| `notification_sent` | `tinyint(1)` | NO | `0` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_goals_status`: `status`
- `INDEX` `idx_goals_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `google_calendar_tokens`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `email` | `varchar(255)` | NO | `NULL` |  |  |
| `access_token` | `text` | NO | `NULL` |  |  |
| `refresh_token` | `text` | YES | `NULL` |  |  |
| `token_type` | `varchar(50)` | YES | `'Bearer'` |  |  |
| `expires_at` | `datetime` | NO | `NULL` |  |  |
| `scope` | `text` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `last_used_at` | `datetime` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_google_tokens_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_google_token_user`: `workspace_id`, `user_id`

---
### Table: `google_sheets_connections`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `access_token` | `text` | YES | `NULL` |  |  |
| `refresh_token` | `text` | YES | `NULL` |  |  |
| `token_expires_at` | `timestamp` | YES | `NULL` |  |  |
| `google_account_id` | `varchar(255)` | YES | `NULL` |  |  |
| `google_email` | `varchar(255)` | YES | `NULL` |  |  |
| `google_name` | `varchar(255)` | YES | `NULL` |  |  |
| `google_avatar_url` | `varchar(500)` | YES | `NULL` |  |  |
| `status` | `enum('connected','disconnected','error')` | YES | `'connected'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_company`: `workspace_id`, `company_id`

---
### Table: `gps_devices`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |
| `company_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `device_identifier` | `varchar(255)` | NO | `NULL` | UNI |  |
| `type` | `enum('mobile_app','vehicle_tracker','asset_tracker')` | YES | `'mobile_app'` |  |  |
| `assigned_user_id` | `int(11)` | YES | `NULL` | MUL |  |
| `assigned_vehicle_id` | `int(11)` | YES | `NULL` |  |  |
| `battery_level` | `int(11)` | YES | `NULL` |  |  |
| `last_location_lat` | `decimal(10,8)` | YES | `NULL` |  |  |
| `last_location_lng` | `decimal(11,8)` | YES | `NULL` |  |  |
| `last_seen_at` | `datetime` | YES | `NULL` |  |  |
| `status` | `varchar(50)` | YES | `'active'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `device_identifier`: `device_identifier`
- `INDEX` `idx_company`: `company_id`
- `INDEX` `idx_user`: `assigned_user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `gps_location_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `latitude` | `decimal(10,8)` | NO | `NULL` |  |  |
| `longitude` | `decimal(11,8)` | NO | `NULL` |  |  |
| `accuracy` | `decimal(10,2)` | YES | `NULL` |  |  |
| `altitude` | `decimal(10,2)` | YES | `NULL` |  |  |
| `speed` | `decimal(10,2)` | YES | `NULL` |  |  |
| `heading` | `decimal(5,2)` | YES | `NULL` |  |  |
| `recorded_at` | `datetime` | NO | `NULL` |  |  |
| `source` | `enum('mobile','web','device')` | YES | `'mobile'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_gps_user_time`: `user_id`, `recorded_at`
- `INDEX` `idx_gps_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `gps_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20)` | NO | `NULL` | PRI | auto_increment |
| `device_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | YES | `NULL` |  |  |
| `latitude` | `decimal(10,8)` | NO | `NULL` |  |  |
| `longitude` | `decimal(11,8)` | NO | `NULL` |  |  |
| `speed` | `decimal(8,2)` | YES | `NULL` |  |  |
| `heading` | `decimal(5,2)` | YES | `NULL` |  |  |
| `altitude` | `decimal(8,2)` | YES | `NULL` |  |  |
| `accuracy` | `decimal(8,2)` | YES | `NULL` |  |  |
| `captured_at` | `datetime` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `device_id` -> `gps_devices.id` (Constraint: `gps_logs_ibfk_1`)

**Indexes:**
- `INDEX` `idx_device_time`: `device_id`, `captured_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `group_booking_participants`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `group_booking_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` |  |  |
| `guest_name` | `varchar(255)` | NO | `NULL` |  |  |
| `guest_email` | `varchar(255)` | NO | `NULL` |  |  |
| `guest_phone` | `varchar(50)` | YES | `NULL` |  |  |
| `status` | `enum('registered','confirmed','attended','no_show','cancelled')` | YES | `'registered'` |  |  |
| `payment_status` | `enum('pending','paid','refunded')` | YES | `NULL` |  |  |
| `registered_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `group_booking_id` -> `group_bookings.id` (Constraint: `group_booking_participants_ibfk_1`)

**Indexes:**
- `INDEX` `idx_participant_group`: `group_booking_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `group_bookings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `booking_type_id` | `int(11)` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `scheduled_at` | `datetime` | NO | `NULL` | MUL |  |
| `duration_minutes` | `int(11)` | NO | `60` |  |  |
| `max_participants` | `int(11)` | NO | `10` |  |  |
| `current_participants` | `int(11)` | YES | `0` |  |  |
| `location_type` | `enum('in_person','video','hybrid')` | YES | `'video'` |  |  |
| `location` | `varchar(500)` | YES | `NULL` |  |  |
| `meeting_link` | `varchar(500)` | YES | `NULL` |  |  |
| `price_per_person` | `decimal(10,2)` | YES | `NULL` |  |  |
| `status` | `enum('scheduled','in_progress','completed','cancelled')` | YES | `'scheduled'` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `group_bookings_ibfk_1`)
- `booking_type_id` -> `booking_types.id` (Constraint: `group_bookings_ibfk_2`)

**Indexes:**
- `INDEX` `booking_type_id`: `booking_type_id`
- `INDEX` `idx_group_scheduled`: `scheduled_at`
- `INDEX` `idx_group_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `groups`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `parent_id` | `int(11)` | YES | `NULL` | MUL |  |
| `created_at` | `datetime` | NO | `NULL` |  |  |
| `updated_at` | `datetime` | NO | `NULL` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Indexes:**
- `INDEX` `idx_groups_workspace_id`: `workspace_id`
- `INDEX` `parent_id`: `parent_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_user_group_name`: `user_id`, `name`
- `INDEX` `user_id`: `user_id`

---
### Table: `hashtag_groups`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `hashtags` | `longtext` | NO | `NULL` |  |  |
| `platforms` | `longtext` | YES | `NULL` |  |  |
| `use_count` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_hashtags_workspace`: `workspace_id`
- `INDEX` `idx_hashtag_groups_company`: `workspace_id`, `company_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_name`: `workspace_id`, `name`

---
### Table: `hosted_videos`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `file_name` | `varchar(255)` | NO | `NULL` |  |  |
| `file_size` | `bigint(20) unsigned` | NO | `NULL` |  |  |
| `duration` | `int(11)` | YES | `NULL` |  |  |
| `thumbnail_url` | `varchar(500)` | YES | `NULL` |  |  |
| `video_url` | `varchar(500)` | NO | `NULL` |  |  |
| `streaming_url` | `varchar(500)` | YES | `NULL` |  |  |
| `status` | `enum('uploading','processing','ready','failed')` | YES | `'uploading'` | MUL |  |
| `views` | `int(11)` | YES | `0` |  |  |
| `used_in_courses` | `int(11)` | YES | `0` |  |  |
| `tags` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `hybrid_campaign_contacts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `varchar(36)` | NO | `NULL` | PRI |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `campaign_id` | `varchar(36)` | NO | `NULL` | MUL |  |
| `first_name` | `varchar(255)` | YES | `NULL` |  |  |
| `last_name` | `varchar(255)` | YES | `NULL` |  |  |
| `email` | `varchar(255)` | YES | `NULL` |  |  |
| `phone` | `varchar(64)` | YES | `NULL` |  |  |
| `company` | `varchar(255)` | YES | `NULL` |  |  |
| `status` | `enum('pending','in_progress','completed','paused','opted_out','failed')` | YES | `'pending'` | MUL |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `last_step_order` | `int(11)` | YES | `0` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `campaign_id` -> `hybrid_campaigns.id` (Constraint: `fk_hybrid_contacts_campaign`)
- `user_id` -> `users.id` (Constraint: `fk_hybrid_contacts_user`)

**Indexes:**
- `INDEX` `idx_hybrid_contacts_campaign`: `campaign_id`
- `INDEX` `idx_hybrid_contacts_status`: `status`
- `INDEX` `idx_hybrid_contacts_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `hybrid_campaign_step_runs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `varchar(36)` | NO | `NULL` | PRI |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `campaign_id` | `varchar(36)` | NO | `NULL` | MUL |  |
| `contact_id` | `varchar(36)` | NO | `NULL` | MUL |  |
| `step_id` | `varchar(36)` | NO | `NULL` | MUL |  |
| `step_order` | `int(11)` | NO | `NULL` |  |  |
| `status` | `enum('pending','queued','processing','sent','skipped','failed','cancelled')` | YES | `'pending'` | MUL |  |
| `scheduled_at` | `datetime` | NO | `NULL` |  |  |
| `processed_at` | `datetime` | YES | `NULL` |  |  |
| `channel_payload` | `longtext` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `campaign_id` -> `hybrid_campaigns.id` (Constraint: `fk_hybrid_step_runs_campaign`)
- `contact_id` -> `hybrid_campaign_contacts.id` (Constraint: `fk_hybrid_step_runs_contact`)
- `step_id` -> `hybrid_campaign_steps.id` (Constraint: `fk_hybrid_step_runs_step`)
- `user_id` -> `users.id` (Constraint: `fk_hybrid_step_runs_user`)

**Indexes:**
- `INDEX` `fk_hybrid_step_runs_step`: `step_id`
- `INDEX` `fk_hybrid_step_runs_user`: `user_id`
- `INDEX` `idx_hybrid_step_runs_campaign`: `campaign_id`
- `INDEX` `idx_hybrid_step_runs_contact`: `contact_id`
- `INDEX` `idx_hybrid_step_runs_schedule`: `status`, `scheduled_at`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uq_hybrid_step_run`: `campaign_id`, `contact_id`, `step_id`

---
### Table: `hybrid_campaign_steps`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `varchar(36)` | NO | `NULL` | PRI |  |
| `campaign_id` | `varchar(36)` | NO | `NULL` | MUL |  |
| `step_order` | `int(11)` | NO | `NULL` |  |  |
| `channel` | `enum('email','sms','call')` | NO | `NULL` |  |  |
| `subject` | `varchar(255)` | YES | `NULL` |  |  |
| `content` | `mediumtext` | YES | `NULL` |  |  |
| `delay_days` | `int(11)` | YES | `0` |  |  |
| `delay_hours` | `int(11)` | YES | `0` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `campaign_id` -> `hybrid_campaigns.id` (Constraint: `fk_hybrid_steps_campaign`)

**Indexes:**
- `INDEX` `idx_hybrid_steps_campaign`: `campaign_id`
- `INDEX` `idx_hybrid_steps_order`: `campaign_id`, `step_order`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `hybrid_campaigns`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `varchar(36)` | NO | `NULL` | PRI |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `status` | `enum('draft','active','paused','completed','archived')` | YES | `'draft'` |  |  |
| `entry_channel` | `enum('email','sms','call')` | YES | `'email'` |  |  |
| `follow_up_mode` | `enum('single','hybrid')` | YES | `'hybrid'` |  |  |
| `audience_source` | `enum('contacts','csv','manual')` | YES | `'contacts'` |  |  |
| `audience_payload` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `fk_hybrid_campaigns_user`)

**Indexes:**
- `INDEX` `idx_hybrid_campaigns_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `incoming_webhooks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `token` | `varchar(64)` | NO | `NULL` | UNI |  |
| `description` | `text` | YES | `NULL` |  |  |
| `action_type` | `enum('create_contact','update_contact','add_tag','trigger_automation','custom')` | NO | `NULL` |  |  |
| `action_config` | `longtext` | YES | `NULL` |  |  |
| `field_mapping` | `longtext` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | NO | `1` |  |  |
| `last_received_at` | `datetime` | YES | `NULL` |  |  |
| `receive_count` | `int(11)` | NO | `0` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `incoming_webhooks_ibfk_1`)

**Indexes:**
- `INDEX` `idx_incoming_token`: `token`
- `INDEX` `idx_incoming_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `token`: `token`

---
### Table: `industry_pipeline_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `industry_type_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `stages` | `longtext` | NO | `NULL` |  |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `industry_type_id`: `industry_type_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `industry_types`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `slug` | `varchar(50)` | NO | `NULL` | UNI |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `icon` | `varchar(50)` | YES | `NULL` |  |  |
| `color` | `varchar(20)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `slug`: `slug`

---
### Table: `instagram_accounts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |
| `company_id` | `int(11)` | NO | `NULL` | MUL |  |
| `instagram_user_id` | `varchar(255)` | NO | `NULL` | MUL |  |
| `username` | `varchar(255)` | NO | `NULL` |  |  |
| `full_name` | `varchar(255)` | YES | `NULL` |  |  |
| `profile_picture_url` | `text` | YES | `NULL` |  |  |
| `access_token` | `text` | YES | `NULL` |  |  |
| `token_expires_at` | `datetime` | YES | `NULL` |  |  |
| `is_business_account` | `tinyint(1)` | YES | `0` |  |  |
| `connected_facebook_page_id` | `varchar(255)` | YES | `NULL` |  |  |
| `status` | `varchar(50)` | YES | `'connected'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_company`: `company_id`
- `INDEX` `idx_instagram_user`: `instagram_user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `instagram_conversations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `instagram_account_id` | `int(11)` | NO | `NULL` | MUL |  |
| `remote_thread_id` | `varchar(255)` | NO | `NULL` |  |  |
| `contact_id` | `int(11)` | YES | `NULL` |  |  |
| `participant_username` | `varchar(255)` | YES | `NULL` |  |  |
| `participant_full_name` | `varchar(255)` | YES | `NULL` |  |  |
| `participant_profile_pic` | `text` | YES | `NULL` |  |  |
| `last_message_content` | `text` | YES | `NULL` |  |  |
| `last_message_at` | `datetime` | YES | `NULL` |  |  |
| `unread_count` | `int(11)` | YES | `0` |  |  |
| `status` | `varchar(50)` | YES | `'active'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `instagram_account_id` -> `instagram_accounts.id` (Constraint: `instagram_conversations_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_thread`: `instagram_account_id`, `remote_thread_id`

---
### Table: `instagram_messages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `conversation_id` | `int(11)` | NO | `NULL` | MUL |  |
| `remote_message_id` | `varchar(255)` | NO | `NULL` |  |  |
| `direction` | `enum('inbound','outbound')` | NO | `NULL` |  |  |
| `content` | `text` | YES | `NULL` |  |  |
| `media_url` | `text` | YES | `NULL` |  |  |
| `media_type` | `varchar(50)` | YES | `'text'` |  |  |
| `status` | `varchar(50)` | YES | `'sent'` |  |  |
| `sent_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `conversation_id` -> `instagram_conversations.id` (Constraint: `instagram_messages_ibfk_1`)

**Indexes:**
- `INDEX` `idx_conversation`: `conversation_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `intake_form_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | YES | `NULL` |  |  |
| `industry_type_id` | `int(11)` | YES | `NULL` |  |  |
| `industry_slug` | `varchar(50)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `form_type` | `enum('lead_intake','service_request','consultation','patient_intake','buyer_intake','seller_intake','case_intake','booking_intake')` | YES | `'lead_intake'` |  |  |
| `fields` | `longtext` | NO | `NULL` |  |  |
| `conditional_logic` | `longtext` | YES | `NULL` |  |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `is_template` | `tinyint(1)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `integration_connections`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `provider_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `status` | `enum('active','inactive','error','expired')` | NO | `'active'` | MUL |  |
| `access_token_encrypted` | `text` | YES | `NULL` |  |  |
| `refresh_token_encrypted` | `text` | YES | `NULL` |  |  |
| `api_key_encrypted` | `text` | YES | `NULL` |  |  |
| `token_expires_at` | `datetime` | YES | `NULL` |  |  |
| `config` | `longtext` | YES | `NULL` |  |  |
| `sync_settings` | `longtext` | YES | `NULL` |  |  |
| `external_account_id` | `varchar(255)` | YES | `NULL` |  |  |
| `external_account_name` | `varchar(255)` | YES | `NULL` |  |  |
| `last_sync_at` | `datetime` | YES | `NULL` |  |  |
| `last_error` | `text` | YES | `NULL` |  |  |
| `error_count` | `int(11)` | NO | `0` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `integration_connections_ibfk_1`)
- `provider_id` -> `integration_providers.id` (Constraint: `integration_connections_ibfk_2`)

**Indexes:**
- `INDEX` `idx_connections_provider`: `provider_id`
- `INDEX` `idx_connections_status`: `status`
- `INDEX` `idx_connections_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `integration_field_mappings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `connection_id` | `int(11)` | NO | `NULL` | MUL |  |
| `local_field` | `varchar(100)` | NO | `NULL` |  |  |
| `remote_field` | `varchar(100)` | NO | `NULL` |  |  |
| `direction` | `enum('import','export','bidirectional')` | NO | `'bidirectional'` |  |  |
| `transform_type` | `enum('none','lowercase','uppercase','date_format','custom')` | NO | `'none'` |  |  |
| `transform_config` | `longtext` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | NO | `1` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `connection_id` -> `integration_connections.id` (Constraint: `integration_field_mappings_ibfk_1`)

**Indexes:**
- `INDEX` `idx_mappings_connection`: `connection_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `integration_providers`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `slug` | `varchar(50)` | NO | `NULL` | UNI |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `category` | `enum('crm','email','calendar','payment','analytics','automation','communication','storage','other')` | NO | `NULL` |  |  |
| `logo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `auth_type` | `enum('oauth2','api_key','basic','webhook','none')` | NO | `'api_key'` |  |  |
| `oauth_authorize_url` | `varchar(500)` | YES | `NULL` |  |  |
| `oauth_token_url` | `varchar(500)` | YES | `NULL` |  |  |
| `oauth_scopes` | `text` | YES | `NULL` |  |  |
| `documentation_url` | `varchar(500)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | NO | `1` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `slug`: `slug`

---
### Table: `integration_sync_jobs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `integration_id` | `int(11)` | NO | `NULL` |  |  |
| `job_type` | `varchar(50)` | NO | `NULL` |  |  |
| `entity_type` | `varchar(50)` | YES | `NULL` |  |  |
| `status` | `enum('pending','running','completed','failed','cancelled')` | YES | `'pending'` | MUL |  |
| `progress` | `int(11)` | YES | `0` |  |  |
| `items_processed` | `int(11)` | YES | `0` |  |  |
| `items_created` | `int(11)` | YES | `0` |  |  |
| `items_updated` | `int(11)` | YES | `0` |  |  |
| `items_failed` | `int(11)` | YES | `0` |  |  |
| `error_log` | `longtext` | YES | `NULL` |  |  |
| `started_at` | `timestamp` | YES | `NULL` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |
| `attempts` | `int(11)` | YES | `0` |  |  |
| `max_attempts` | `int(11)` | YES | `3` |  |  |
| `next_retry_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_sync_jobs_pending`: `status`, `next_retry_at`
- `INDEX` `idx_sync_jobs_workspace`: `workspace_id`, `status`, `created_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `integration_sync_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `connection_id` | `int(11)` | NO | `NULL` | MUL |  |
| `sync_type` | `enum('full','incremental','manual')` | NO | `'incremental'` |  |  |
| `direction` | `enum('import','export','bidirectional')` | NO | `'bidirectional'` |  |  |
| `status` | `enum('running','completed','failed','cancelled')` | NO | `'running'` | MUL |  |
| `records_processed` | `int(11)` | NO | `0` |  |  |
| `records_created` | `int(11)` | NO | `0` |  |  |
| `records_updated` | `int(11)` | NO | `0` |  |  |
| `records_failed` | `int(11)` | NO | `0` |  |  |
| `error_details` | `longtext` | YES | `NULL` |  |  |
| `started_at` | `datetime` | NO | `NULL` |  |  |
| `completed_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `connection_id` -> `integration_connections.id` (Constraint: `integration_sync_logs_ibfk_1`)

**Indexes:**
- `INDEX` `idx_sync_logs_connection`: `connection_id`
- `INDEX` `idx_sync_logs_status`: `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `integration_webhook_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `webhook_id` | `int(11)` | YES | `NULL` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` |  |  |
| `provider` | `varchar(50)` | NO | `NULL` | MUL |  |
| `event_type` | `varchar(100)` | YES | `NULL` |  |  |
| `event_id` | `varchar(255)` | YES | `NULL` | MUL |  |
| `headers` | `longtext` | YES | `NULL` |  |  |
| `payload` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('received','processing','processed','failed','ignored')` | YES | `'received'` | MUL |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `processed_at` | `timestamp` | YES | `NULL` |  |  |
| `response_code` | `int(11)` | YES | `NULL` |  |  |
| `response_body` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_webhook_logs_event`: `event_id`
- `INDEX` `idx_webhook_logs_provider`: `provider`, `created_at`
- `INDEX` `idx_webhook_logs_status`: `status`, `created_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `integration_webhooks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | YES | `NULL` |  |  |
| `integration_id` | `int(11)` | YES | `NULL` |  |  |
| `provider` | `varchar(50)` | NO | `NULL` | MUL |  |
| `webhook_id` | `varchar(255)` | YES | `NULL` |  |  |
| `endpoint_path` | `varchar(255)` | NO | `NULL` | MUL |  |
| `secret` | `varchar(255)` | YES | `NULL` |  |  |
| `events` | `longtext` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `last_received_at` | `timestamp` | YES | `NULL` |  |  |
| `last_status` | `enum('success','failed','invalid_signature')` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_webhooks_path`: `endpoint_path`
- `INDEX` `idx_webhooks_provider`: `provider`, `is_active`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `integrations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `varchar(64)` | NO | `NULL` | PRI |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `type` | `varchar(50)` | NO | `NULL` | MUL |  |
| `config` | `longtext` | YES | `NULL` |  |  |
| `status` | `varchar(20)` | YES | `'inactive'` | MUL |  |
| `last_tested` | `timestamp` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_integrations_status`: `status`
- `INDEX` `idx_integrations_type`: `type`
- `INDEX` `idx_integrations_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `intent_analysis`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `channel` | `varchar(50)` | NO | `NULL` |  |  |
| `source_type` | `varchar(50)` | NO | `NULL` | MUL |  |
| `source_id` | `int(11)` | YES | `NULL` |  |  |
| `primary_intent` | `varchar(100)` | NO | `NULL` | MUL |  |
| `primary_confidence` | `int(11)` | NO | `NULL` | MUL |  |
| `secondary_intents` | `longtext` | YES | `NULL` |  |  |
| `has_conflict` | `tinyint(1)` | YES | `0` |  |  |
| `conflict_reason` | `text` | YES | `NULL` |  |  |
| `analyzed_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_intent_confidence`: `primary_confidence`
- `INDEX` `idx_intent_contact`: `contact_id`
- `INDEX` `idx_intent_primary`: `primary_intent`
- `INDEX` `idx_intent_source`: `source_type`, `source_id`
- `INDEX` `idx_intent_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `intent_providers`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `provider_name` | `varchar(100)` | NO | `NULL` |  |  |
| `api_key` | `text` | YES | `NULL` |  |  |
| `api_endpoint` | `varchar(500)` | YES | `NULL` |  |  |
| `status` | `enum('active','inactive','error')` | YES | `'active'` | MUL |  |
| `last_sync_at` | `timestamp` | YES | `NULL` |  |  |
| `sync_frequency_hours` | `int(11)` | YES | `24` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_intent_providers_status`: `status`
- `INDEX` `idx_intent_providers_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `intent_signals`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `topic` | `varchar(255)` | NO | `NULL` |  |  |
| `strength` | `enum('low','medium','high')` | NO | `NULL` | MUL |  |
| `source` | `varchar(100)` | NO | `NULL` |  |  |
| `source_url` | `varchar(500)` | YES | `NULL` |  |  |
| `detected_at` | `timestamp` | NO | `current_timestamp()` | MUL | on update current_timestamp() |
| `is_stale` | `tinyint(1)` | YES | `0` | MUL |  |
| `match_type` | `enum('email_domain','company_name','manual')` | YES | `NULL` |  |  |
| `match_confidence` | `decimal(3,2)` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_intent_signals_contact`: `contact_id`
- `INDEX` `idx_intent_signals_detected`: `detected_at`
- `INDEX` `idx_intent_signals_stale`: `is_stale`
- `INDEX` `idx_intent_signals_strength`: `strength`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `interviews`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `application_id` | `int(11)` | NO | `NULL` | MUL |  |
| `interview_type` | `enum('phone_screen','video','in_person','technical','panel','final')` | YES | `'phone_screen'` |  |  |
| `scheduled_at` | `datetime` | NO | `NULL` | MUL |  |
| `duration_minutes` | `int(11)` | YES | `60` |  |  |
| `location` | `varchar(255)` | YES | `NULL` |  |  |
| `meeting_link` | `varchar(500)` | YES | `NULL` |  |  |
| `interviewer_id` | `int(11)` | YES | `NULL` | MUL |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `feedback` | `text` | YES | `NULL` |  |  |
| `rating` | `int(11)` | YES | `NULL` |  |  |
| `recommendation` | `enum('strong_yes','yes','maybe','no','strong_no')` | YES | `NULL` |  |  |
| `status` | `enum('scheduled','completed','cancelled','no_show')` | YES | `'scheduled'` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `interviews_ibfk_1`)
- `application_id` -> `job_applications.id` (Constraint: `interviews_ibfk_2`)
- `interviewer_id` -> `users.id` (Constraint: `interviews_ibfk_3`)

**Indexes:**
- `INDEX` `idx_application`: `application_id`
- `INDEX` `idx_interviewer`: `interviewer_id`
- `INDEX` `idx_scheduled`: `scheduled_at`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `inventory_locations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `warehouse_id` | `int(11)` | NO | `NULL` | MUL |  |
| `zone` | `varchar(50)` | YES | `NULL` |  |  |
| `aisle` | `varchar(50)` | YES | `NULL` |  |  |
| `rack` | `varchar(50)` | YES | `NULL` |  |  |
| `shelf` | `varchar(50)` | YES | `NULL` |  |  |
| `bin` | `varchar(50)` | YES | `NULL` |  |  |
| `barcode` | `varchar(255)` | YES | `NULL` | UNI |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `warehouse_id` -> `inventory_warehouses.id` (Constraint: `inventory_locations_ibfk_1`)

**Indexes:**
- `UNIQUE` `barcode`: `barcode`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `warehouse_id`: `warehouse_id`

---
### Table: `inventory_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `product_id` | `int(11)` | NO | `NULL` | MUL |  |
| `change_type` | `enum('adjustment','sale','return','restock')` | NO | `NULL` |  |  |
| `quantity_before` | `int(11)` | NO | `NULL` |  |  |
| `quantity_change` | `int(11)` | NO | `NULL` |  |  |
| `quantity_after` | `int(11)` | NO | `NULL` |  |  |
| `reference_type` | `varchar(50)` | YES | `NULL` | MUL |  |
| `reference_id` | `int(11)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_by` | `int(11)` | YES | `NULL` | MUL |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Foreign Keys:**
- `product_id` -> `products.id` (Constraint: `inventory_logs_ibfk_1`)
- `created_by` -> `users.id` (Constraint: `inventory_logs_ibfk_2`)

**Indexes:**
- `INDEX` `created_by`: `created_by`
- `INDEX` `idx_product`: `product_id`
- `INDEX` `idx_reference`: `reference_type`, `reference_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `inventory_movements`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `product_id` | `int(11)` | NO | `NULL` | MUL |  |
| `from_warehouse_id` | `int(11)` | YES | `NULL` |  |  |
| `from_location_id` | `int(11)` | YES | `NULL` |  |  |
| `to_warehouse_id` | `int(11)` | YES | `NULL` |  |  |
| `to_location_id` | `int(11)` | YES | `NULL` |  |  |
| `quantity` | `decimal(12,4)` | NO | `NULL` |  |  |
| `reference_type` | `varchar(50)` | YES | `NULL` |  |  |
| `reference_id` | `varchar(100)` | YES | `NULL` |  |  |
| `reason` | `varchar(255)` | YES | `NULL` |  |  |
| `performed_by` | `int(11)` | YES | `NULL` |  |  |
| `performed_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_date`: `performed_at`
- `INDEX` `idx_product`: `product_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `inventory_stock`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `warehouse_id` | `int(11)` | NO | `NULL` | MUL |  |
| `location_id` | `int(11)` | YES | `NULL` | MUL |  |
| `product_id` | `int(11)` | NO | `NULL` |  |  |
| `sku` | `varchar(100)` | YES | `NULL` |  |  |
| `quantity_on_hand` | `decimal(12,4)` | YES | `0.0000` |  |  |
| `quantity_reserved` | `decimal(12,4)` | YES | `0.0000` |  |  |
| `quantity_available` | `decimal(12,4)` | YES | `NULL` |  | STORED GENERATED |
| `reorder_point` | `decimal(12,4)` | YES | `0.0000` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `warehouse_id` -> `inventory_warehouses.id` (Constraint: `inventory_stock_ibfk_1`)
- `location_id` -> `inventory_locations.id` (Constraint: `inventory_stock_ibfk_2`)

**Indexes:**
- `INDEX` `location_id`: `location_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_stock`: `warehouse_id`, `location_id`, `product_id`

---
### Table: `inventory_warehouses`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |
| `company_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `code` | `varchar(50)` | YES | `NULL` | UNI |  |
| `address_line1` | `varchar(255)` | YES | `NULL` |  |  |
| `address_line2` | `varchar(255)` | YES | `NULL` |  |  |
| `city` | `varchar(100)` | YES | `NULL` |  |  |
| `state` | `varchar(100)` | YES | `NULL` |  |  |
| `zip_code` | `varchar(20)` | YES | `NULL` |  |  |
| `country` | `varchar(100)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `code`: `code`
- `INDEX` `idx_company`: `company_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `invite_tokens`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `agency_id` | `int(11)` | YES | `NULL` | MUL |  |
| `subaccount_id` | `int(11)` | YES | `NULL` |  |  |
| `token` | `varchar(64)` | NO | `NULL` | UNI |  |
| `expires_at` | `datetime` | NO | `NULL` | MUL |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_invite_agency`: `agency_id`
- `INDEX` `idx_invite_expires`: `expires_at`
- `INDEX` `idx_invite_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_invite_token`: `token`

---
### Table: `invoice_items`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `invoice_id` | `int(11)` | NO | `NULL` | MUL |  |
| `product_id` | `int(11)` | YES | `NULL` | MUL |  |
| `description` | `varchar(500)` | NO | `NULL` |  |  |
| `quantity` | `decimal(10,2)` | NO | `1.00` |  |  |
| `unit_price` | `decimal(10,2)` | NO | `0.00` |  |  |
| `amount` | `decimal(10,2)` | NO | `0.00` |  |  |
| `sort_order` | `int(11)` | NO | `0` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_invoice_items_invoice`: `invoice_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `product_id`: `product_id`

---
### Table: `invoice_line_items`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `invoice_id` | `int(11)` | NO | `NULL` | MUL |  |
| `description` | `varchar(255)` | NO | `NULL` |  |  |
| `quantity` | `int(11)` | YES | `1` |  |  |
| `unit_price_cents` | `int(11)` | YES | `0` |  |  |
| `amount_cents` | `int(11)` | YES | `0` |  |  |
| `subaccount_id` | `int(11)` | YES | `NULL` |  |  |
| `usage_type` | `varchar(50)` | YES | `NULL` |  |  |

**Foreign Keys:**
- `invoice_id` -> `invoices.id` (Constraint: `invoice_line_items_ibfk_1`)

**Indexes:**
- `INDEX` `idx_line_invoice`: `invoice_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `invoice_payments`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `invoice_id` | `int(11)` | NO | `NULL` | MUL |  |
| `payment_id` | `int(11)` | YES | `NULL` |  |  |
| `amount` | `decimal(12,2)` | NO | `NULL` |  |  |
| `payment_method` | `varchar(50)` | YES | `NULL` |  |  |
| `reference` | `varchar(255)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `paid_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `recorded_by` | `int(11)` | YES | `NULL` |  |  |

**Foreign Keys:**
- `invoice_id` -> `invoices.id` (Constraint: `invoice_payments_ibfk_1`)

**Indexes:**
- `INDEX` `idx_invoice_payments`: `invoice_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `invoice_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `invoice_prefix` | `varchar(20)` | YES | `'INV-'` |  |  |
| `next_invoice_number` | `int(11)` | YES | `1001` |  |  |
| `default_due_days` | `int(11)` | YES | `30` |  |  |
| `default_notes` | `text` | YES | `NULL` |  |  |
| `default_terms` | `text` | YES | `NULL` |  |  |
| `company_name` | `varchar(255)` | YES | `NULL` |  |  |
| `company_address` | `text` | YES | `NULL` |  |  |
| `company_phone` | `varchar(50)` | YES | `NULL` |  |  |
| `company_email` | `varchar(255)` | YES | `NULL` |  |  |
| `company_logo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `tax_id` | `varchar(100)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `invoice_settings_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_workspace_settings`: `workspace_id`, `company_id`

---
### Table: `invoice_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `logo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `primary_color` | `varchar(7)` | YES | `'#6366f1'` |  |  |
| `accent_color` | `varchar(7)` | YES | `'#f97316'` |  |  |
| `show_logo` | `tinyint(1)` | YES | `1` |  |  |
| `show_company_address` | `tinyint(1)` | YES | `1` |  |  |
| `show_payment_instructions` | `tinyint(1)` | YES | `1` |  |  |
| `default_notes` | `text` | YES | `NULL` |  |  |
| `default_terms` | `text` | YES | `NULL` |  |  |
| `default_footer` | `text` | YES | `NULL` |  |  |
| `payment_instructions` | `text` | YES | `NULL` |  |  |
| `custom_css` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_templates_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `invoices`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `estimate_id` | `int(11)` | YES | `NULL` | MUL |  |
| `invoice_number` | `varchar(50)` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | YES | `NULL` |  |  |
| `status` | `enum('draft','sent','viewed','paid','partially_paid','overdue','cancelled','refunded')` | NO | `'draft'` | MUL |  |
| `issue_date` | `date` | NO | `NULL` |  |  |
| `due_date` | `date` | NO | `NULL` | MUL |  |
| `subtotal` | `decimal(10,2)` | NO | `0.00` |  |  |
| `discount_type` | `enum('percentage','fixed')` | YES | `NULL` |  |  |
| `discount_value` | `decimal(10,2)` | YES | `NULL` |  |  |
| `tax_rate` | `decimal(5,2)` | NO | `0.00` |  |  |
| `tax_amount` | `decimal(10,2)` | NO | `0.00` |  |  |
| `discount_amount` | `decimal(10,2)` | NO | `0.00` |  |  |
| `total` | `decimal(10,2)` | NO | `0.00` |  |  |
| `amount_paid` | `decimal(10,2)` | NO | `0.00` |  |  |
| `currency` | `varchar(3)` | NO | `'USD'` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `terms` | `text` | YES | `NULL` |  |  |
| `footer` | `text` | YES | `NULL` |  |  |
| `stripe_invoice_id` | `varchar(255)` | YES | `NULL` |  |  |
| `payment_link_url` | `varchar(500)` | YES | `NULL` |  |  |
| `payment_link` | `varchar(500)` | YES | `NULL` |  |  |
| `sent_at` | `datetime` | YES | `NULL` |  |  |
| `viewed_at` | `datetime` | YES | `NULL` |  |  |
| `reminder_sent_at` | `timestamp` | YES | `NULL` |  |  |
| `reminder_count` | `int(11)` | YES | `0` |  |  |
| `assigned_to` | `int(11)` | YES | `NULL` |  |  |
| `paid_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` | MUL |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `amount_due` | `decimal(15,2)` | YES | `0.00` |  |  |
| `deposit_amount` | `decimal(10,2)` | YES | `0.00` |  |  |
| `deposit_paid` | `decimal(10,2)` | YES | `0.00` |  |  |
| `deposit_required` | `tinyint(1)` | YES | `0` |  |  |
| `tip_amount` | `decimal(10,2)` | YES | `0.00` |  |  |
| `tip_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `allow_partial_payments` | `tinyint(1)` | YES | `1` |  |  |
| `payment_terms` | `text` | YES | `NULL` |  |  |
| `late_fee_percentage` | `decimal(5,2)` | YES | `0.00` |  |  |
| `late_fee_amount` | `decimal(10,2)` | YES | `0.00` |  |  |
| `dunning_enabled` | `tinyint(1)` | YES | `1` |  |  |
| `last_dunning_sent_at` | `timestamp` | YES | `NULL` |  |  |
| `dunning_count` | `int(11)` | YES | `0` |  |  |

**Indexes:**
- `INDEX` `idx_invoices_company`: `company_id`
- `INDEX` `idx_invoices_contact`: `contact_id`
- `INDEX` `idx_invoices_created`: `created_at`
- `INDEX` `idx_invoices_due_date`: `due_date`
- `INDEX` `idx_invoices_estimate`: `estimate_id`
- `INDEX` `idx_invoices_number`: `invoice_number`
- `INDEX` `idx_invoices_status`: `status`
- `INDEX` `idx_invoices_user`: `user_id`
- `INDEX` `idx_invoices_workspace`: `workspace_id`, `company_id`
- `INDEX` `idx_invoices_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ivr_menu_options`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `ivr_menu_id` | `int(11)` | NO | `NULL` | MUL |  |
| `digit` | `char(1)` | NO | `NULL` |  |  |
| `description` | `varchar(255)` | NO | `NULL` |  |  |
| `action_type` | `enum('forward','voicemail','submenu','queue','hangup','repeat')` | NO | `NULL` |  |  |
| `forward_to` | `varchar(50)` | YES | `NULL` |  |  |
| `submenu_id` | `int(11)` | YES | `NULL` | MUL |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_ivr_options_menu`: `ivr_menu_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `submenu_id`: `submenu_id`

---
### Table: `ivr_menus`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `greeting_text` | `text` | YES | `NULL` |  |  |
| `greeting_audio_url` | `varchar(500)` | YES | `NULL` |  |  |
| `timeout_seconds` | `int(11)` | NO | `10` |  |  |
| `max_retries` | `int(11)` | NO | `3` |  |  |
| `invalid_input_message` | `text` | YES | `NULL` |  |  |
| `timeout_action` | `enum('repeat','voicemail','forward','hangup')` | NO | `'repeat'` |  |  |
| `timeout_forward_to` | `varchar(50)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_ivr_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `job_applications`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `job_id` | `int(11)` | NO | `NULL` | MUL |  |
| `candidate_id` | `int(11)` | NO | `NULL` | MUL |  |
| `cover_letter` | `text` | YES | `NULL` |  |  |
| `resume_file_id` | `int(11)` | YES | `NULL` | MUL |  |
| `current_stage` | `enum('applied','screening','phone_screen','interview','technical','final_round','offer','hired','rejected')` | YES | `'applied'` | MUL |  |
| `status` | `enum('new','in_progress','on_hold','hired','rejected')` | YES | `'new'` | MUL |  |
| `source` | `enum('direct','referral','linkedin','indeed','glassdoor','agency','other')` | YES | `'direct'` |  |  |
| `rating` | `int(11)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `applied_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `job_applications_ibfk_1`)
- `job_id` -> `job_openings.id` (Constraint: `job_applications_ibfk_2`)
- `candidate_id` -> `candidates.id` (Constraint: `job_applications_ibfk_3`)
- `resume_file_id` -> `files.id` (Constraint: `job_applications_ibfk_4`)

**Indexes:**
- `INDEX` `idx_candidate`: `candidate_id`
- `INDEX` `idx_job`: `job_id`
- `INDEX` `idx_stage`: `current_stage`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `resume_file_id`: `resume_file_id`
- `UNIQUE` `unique_application`: `workspace_id`, `job_id`, `candidate_id`

---
### Table: `job_checklist`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `job_id` | `int(11)` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `is_required` | `tinyint(1)` | YES | `0` |  |  |
| `is_completed` | `tinyint(1)` | YES | `0` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |
| `completed_by` | `int(11)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `job_id` -> `jobs.id` (Constraint: `job_checklist_ibfk_1`)

**Indexes:**
- `INDEX` `idx_job_checklist`: `job_id`, `sort_order`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `job_items`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `job_id` | `int(11)` | NO | `NULL` | MUL |  |
| `product_id` | `int(11)` | YES | `NULL` |  |  |
| `service_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `quantity` | `decimal(10,2)` | YES | `1.00` |  |  |
| `unit_price` | `decimal(12,2)` | NO | `NULL` |  |  |
| `discount_amount` | `decimal(12,2)` | YES | `0.00` |  |  |
| `tax_amount` | `decimal(12,2)` | YES | `0.00` |  |  |
| `total` | `decimal(12,2)` | NO | `NULL` |  |  |
| `is_completed` | `tinyint(1)` | YES | `0` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |
| `completed_by` | `int(11)` | YES | `NULL` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `job_id` -> `jobs.id` (Constraint: `job_items_ibfk_1`)

**Indexes:**
- `INDEX` `idx_job_items`: `job_id`, `sort_order`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `job_line_items`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `job_id` | `int(11)` | NO | `NULL` | MUL |  |
| `description` | `varchar(255)` | NO | `NULL` |  |  |
| `quantity` | `decimal(10,2)` | YES | `1.00` |  |  |
| `unit_price` | `decimal(10,2)` | YES | `NULL` |  |  |
| `total` | `decimal(10,2)` | YES | `NULL` |  |  |
| `item_type` | `enum('service','part','labor','fee','discount')` | YES | `'service'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `job_id`: `job_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `job_notes`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `job_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | YES | `NULL` |  |  |
| `content` | `text` | NO | `NULL` |  |  |
| `is_internal` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `job_id` -> `jobs.id` (Constraint: `job_notes_ibfk_1`)

**Indexes:**
- `INDEX` `idx_job_notes`: `job_id`, `created_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `job_openings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `department` | `varchar(100)` | NO | `NULL` | MUL |  |
| `location` | `varchar(255)` | YES | `NULL` |  |  |
| `employment_type` | `enum('full-time','part-time','contract','intern','temporary')` | YES | `'full-time'` |  |  |
| `experience_level` | `enum('entry-level','mid-level','senior','lead','executive')` | YES | `'mid-level'` |  |  |
| `salary_min` | `decimal(12,2)` | YES | `NULL` |  |  |
| `salary_max` | `decimal(12,2)` | YES | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `requirements` | `text` | YES | `NULL` |  |  |
| `responsibilities` | `text` | YES | `NULL` |  |  |
| `benefits` | `text` | YES | `NULL` |  |  |
| `positions_available` | `int(11)` | YES | `1` |  |  |
| `status` | `enum('draft','published','closed','on-hold')` | YES | `'draft'` | MUL |  |
| `created_by` | `int(11)` | YES | `NULL` | MUL |  |
| `application_deadline` | `date` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `job_openings_ibfk_1`)
- `created_by` -> `users.id` (Constraint: `job_openings_ibfk_2`)

**Indexes:**
- `INDEX` `created_by`: `created_by`
- `INDEX` `idx_department`: `department`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `job_parts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `job_id` | `int(11)` | NO | `NULL` | MUL |  |
| `product_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `sku` | `varchar(100)` | YES | `NULL` |  |  |
| `quantity` | `decimal(10,2)` | YES | `1.00` |  |  |
| `unit_cost` | `decimal(10,2)` | YES | `0.00` |  |  |
| `unit_price` | `decimal(10,2)` | YES | `0.00` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_job_parts_job`: `job_id`
- `INDEX` `idx_job_parts_product`: `product_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `job_photos`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `job_id` | `int(11)` | NO | `NULL` | MUL |  |
| `file_id` | `int(11)` | YES | `NULL` |  |  |
| `photo_type` | `enum('before','during','after','issue','other')` | YES | `'other'` |  |  |
| `caption` | `varchar(255)` | YES | `NULL` |  |  |
| `url` | `varchar(500)` | NO | `NULL` |  |  |
| `thumbnail_url` | `varchar(500)` | YES | `NULL` |  |  |
| `taken_at` | `timestamp` | YES | `NULL` |  |  |
| `taken_by` | `int(11)` | YES | `NULL` |  |  |
| `latitude` | `decimal(10,8)` | YES | `NULL` |  |  |
| `longitude` | `decimal(11,8)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `job_id` -> `jobs.id` (Constraint: `job_photos_ibfk_1`)

**Indexes:**
- `INDEX` `idx_job_photos`: `job_id`, `photo_type`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `job_status_history`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `job_id` | `int(11)` | NO | `NULL` | MUL |  |
| `status` | `varchar(50)` | NO | `NULL` |  |  |
| `changed_by` | `int(11)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `location_lat` | `decimal(10,8)` | YES | `NULL` |  |  |
| `location_lng` | `decimal(11,8)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `job_id`: `job_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `job_tasks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `job_id` | `int(11)` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `completed` | `tinyint(1)` | YES | `0` |  |  |
| `completed_at` | `datetime` | YES | `NULL` |  |  |
| `completed_by` | `int(11)` | YES | `NULL` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `job_id` -> `jobs.id` (Constraint: `job_tasks_ibfk_1`)

**Indexes:**
- `INDEX` `idx_job`: `job_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `job_types`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `color` | `varchar(7)` | YES | `'#6366f1'` |  |  |
| `default_duration_minutes` | `int(11)` | YES | `60` |  |  |
| `default_price` | `decimal(10,2)` | YES | `NULL` |  |  |
| `requires_signature` | `tinyint(1)` | YES | `0` |  |  |
| `requires_photos` | `tinyint(1)` | YES | `0` |  |  |
| `checklist_template` | `longtext` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_job_types_workspace`: `workspace_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_name`: `workspace_id`, `name`

---
### Table: `jobs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` |  |  |
| `service_id` | `int(11)` | YES | `NULL` |  |  |
| `assigned_to` | `int(11)` | YES | `NULL` | MUL |  |
| `job_number` | `varchar(50)` | YES | `NULL` |  |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `status` | `enum('new','scheduled','dispatched','en_route','arrived','in_progress','completed','cancelled','on_hold')` | YES | `'new'` |  |  |
| `dispatch_status` | `enum('unassigned','assigned','dispatched','en_route','on_site','completed')` | YES | `'unassigned'` | MUL |  |
| `dispatched_at` | `datetime` | YES | `NULL` |  |  |
| `arrival_time` | `datetime` | YES | `NULL` |  |  |
| `completion_time` | `datetime` | YES | `NULL` |  |  |
| `labor_hours` | `decimal(5,2)` | YES | `NULL` |  |  |
| `labor_cost` | `decimal(10,2)` | YES | `NULL` |  |  |
| `parts_cost` | `decimal(10,2)` | YES | `NULL` |  |  |
| `total_cost` | `decimal(10,2)` | YES | `NULL` |  |  |
| `profit` | `decimal(10,2)` | YES | `NULL` |  |  |
| `priority` | `enum('low','normal','high','emergency')` | YES | `'normal'` |  |  |
| `job_type` | `varchar(50)` | YES | `NULL` |  |  |
| `service_address` | `text` | YES | `NULL` |  |  |
| `service_city` | `varchar(100)` | YES | `NULL` |  |  |
| `service_state` | `varchar(50)` | YES | `NULL` |  |  |
| `service_zip` | `varchar(20)` | YES | `NULL` |  |  |
| `service_lat` | `decimal(10,8)` | YES | `NULL` |  |  |
| `service_lng` | `decimal(11,8)` | YES | `NULL` |  |  |
| `scheduled_date` | `date` | YES | `NULL` | MUL |  |
| `scheduled_time_start` | `time` | YES | `NULL` |  |  |
| `scheduled_time_end` | `time` | YES | `NULL` |  |  |
| `actual_start_time` | `datetime` | YES | `NULL` |  |  |
| `actual_end_time` | `datetime` | YES | `NULL` |  |  |
| `estimated_duration` | `int(11)` | YES | `NULL` |  |  |
| `pickup_address` | `text` | YES | `NULL` |  |  |
| `pickup_lat` | `decimal(10,8)` | YES | `NULL` |  |  |
| `pickup_lng` | `decimal(11,8)` | YES | `NULL` |  |  |
| `dropoff_address` | `text` | YES | `NULL` |  |  |
| `dropoff_lat` | `decimal(10,8)` | YES | `NULL` |  |  |
| `dropoff_lng` | `decimal(11,8)` | YES | `NULL` |  |  |
| `vehicle_info` | `longtext` | YES | `NULL` |  |  |
| `estimated_cost` | `decimal(10,2)` | YES | `NULL` |  |  |
| `actual_cost` | `decimal(10,2)` | YES | `NULL` |  |  |
| `deposit_paid` | `decimal(10,2)` | YES | `NULL` |  |  |
| `payment_status` | `enum('pending','partial','paid','refunded')` | YES | `'pending'` |  |  |
| `internal_notes` | `text` | YES | `NULL` |  |  |
| `customer_notes` | `text` | YES | `NULL` |  |  |
| `photos` | `longtext` | YES | `NULL` |  |  |
| `documents` | `longtext` | YES | `NULL` |  |  |
| `source` | `varchar(50)` | YES | `NULL` |  |  |
| `campaign_id` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_jobs_assigned`: `assigned_to`, `status`
- `INDEX` `idx_jobs_dispatch`: `dispatch_status`, `dispatched_at`
- `INDEX` `idx_jobs_scheduled`: `scheduled_date`, `status`
- `INDEX` `idx_jobs_user_status`: `user_id`, `status`
- `INDEX` `idx_jobs_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `jobs_history`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `job_id` | `int(11)` | YES | `NULL` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `job_type` | `varchar(100)` | NO | `NULL` | MUL |  |
| `payload` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('completed','failed')` | NO | `NULL` |  |  |
| `result` | `longtext` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `duration_ms` | `int(11)` | YES | `NULL` |  |  |
| `attempts` | `int(11)` | YES | `1` |  |  |
| `executed_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_history_type`: `job_type`, `status`, `executed_at`
- `INDEX` `idx_history_workspace`: `workspace_id`, `executed_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `jobs_queue`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `job_type` | `varchar(100)` | NO | `NULL` | MUL |  |
| `job_key` | `varchar(255)` | YES | `NULL` | UNI |  |
| `payload` | `longtext` | NO | `NULL` |  |  |
| `scheduled_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `priority` | `int(11)` | YES | `0` |  |  |
| `status` | `enum('pending','processing','completed','failed','cancelled')` | YES | `'pending'` | MUL |  |
| `locked_by` | `varchar(100)` | YES | `NULL` | MUL |  |
| `locked_at` | `timestamp` | YES | `NULL` |  |  |
| `started_at` | `timestamp` | YES | `NULL` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |
| `result` | `longtext` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `attempts` | `int(11)` | YES | `0` |  |  |
| `max_attempts` | `int(11)` | YES | `3` |  |  |
| `next_retry_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_jobs_locked`: `locked_by`, `locked_at`
- `INDEX` `idx_jobs_pending`: `status`, `scheduled_at`, `priority`
- `INDEX` `idx_jobs_type`: `job_type`, `status`
- `INDEX` `idx_jobs_workspace`: `workspace_id`, `status`, `created_at`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_job_key`: `job_key`

---
### Table: `kb_articles`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `title` | `varchar(500)` | NO | `NULL` |  |  |
| `slug` | `varchar(500)` | NO | `NULL` | MUL |  |
| `body` | `text` | NO | `NULL` |  |  |
| `body_html` | `text` | YES | `NULL` |  |  |
| `excerpt` | `text` | YES | `NULL` |  |  |
| `category_id` | `int(11)` | YES | `NULL` | MUL |  |
| `tags` | `longtext` | YES | `NULL` |  |  |
| `is_published` | `tinyint(1)` | YES | `0` | MUL |  |
| `is_internal` | `tinyint(1)` | YES | `0` |  |  |
| `meta_title` | `varchar(255)` | YES | `NULL` |  |  |
| `meta_description` | `text` | YES | `NULL` |  |  |
| `view_count` | `int(11)` | YES | `0` |  |  |
| `helpful_count` | `int(11)` | YES | `0` |  |  |
| `not_helpful_count` | `int(11)` | YES | `0` |  |  |
| `author_id` | `int(11)` | YES | `NULL` |  |  |
| `published_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_category`: `category_id`
- `INDEX` `idx_published`: `is_published`
- `INDEX` `idx_slug`: `slug`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_slug`: `workspace_id`, `slug`

---
### Table: `kb_categories`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `slug` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `icon` | `varchar(50)` | YES | `NULL` |  |  |
| `parent_id` | `int(11)` | YES | `NULL` | MUL |  |
| `sequence` | `int(11)` | YES | `0` | MUL |  |
| `is_published` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_parent`: `parent_id`
- `INDEX` `idx_sequence`: `sequence`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_slug`: `workspace_id`, `slug`

---
### Table: `knowledge_base_articles`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `category_id` | `int(11)` | YES | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `slug` | `varchar(255)` | NO | `NULL` |  |  |
| `content` | `text` | NO | `NULL` |  |  |
| `content_html` | `text` | YES | `NULL` |  |  |
| `excerpt` | `text` | YES | `NULL` |  |  |
| `status` | `enum('draft','published','archived')` | YES | `'draft'` |  |  |
| `visibility` | `enum('public','private','internal')` | YES | `'public'` |  |  |
| `meta_title` | `varchar(255)` | YES | `NULL` |  |  |
| `meta_description` | `varchar(500)` | YES | `NULL` |  |  |
| `tags` | `longtext` | YES | `NULL` |  |  |
| `related_articles` | `longtext` | YES | `NULL` |  |  |
| `view_count` | `int(11)` | YES | `0` |  |  |
| `helpful_count` | `int(11)` | YES | `0` |  |  |
| `not_helpful_count` | `int(11)` | YES | `0` |  |  |
| `author_id` | `int(11)` | YES | `NULL` |  |  |
| `published_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_kb_articles_category`: `category_id`
- `INDEX` `idx_kb_articles_workspace`: `workspace_id`, `status`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_kb_slug`: `workspace_id`, `slug`

---
### Table: `knowledge_base_categories`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `parent_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `slug` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `icon` | `varchar(50)` | YES | `NULL` |  |  |
| `color` | `varchar(7)` | YES | `'#6366F1'` |  |  |
| `visibility` | `enum('public','private','internal')` | YES | `'public'` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `display_order` | `int(11)` | YES | `0` |  |  |
| `article_count` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `parent_id` -> `knowledge_base_categories.id` (Constraint: `knowledge_base_categories_ibfk_1`)

**Indexes:**
- `INDEX` `idx_kb_categories_parent`: `parent_id`
- `INDEX` `idx_kb_categories_workspace`: `workspace_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_kb_category_slug`: `workspace_id`, `slug`

---
### Table: `landing_page_analytics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `landing_page_id` | `int(11)` | NO | `NULL` | MUL |  |
| `event_type` | `enum('view','conversion','form_submit','click')` | NO | `NULL` | MUL |  |
| `event_data` | `longtext` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `referrer` | `varchar(500)` | YES | `NULL` |  |  |
| `utm_source` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_medium` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_campaign` | `varchar(255)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Foreign Keys:**
- `landing_page_id` -> `landing_pages.id` (Constraint: `landing_page_analytics_ibfk_1`)

**Indexes:**
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_event_type`: `event_type`
- `INDEX` `idx_landing_page_id`: `landing_page_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `landing_page_submissions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `landing_page_id` | `int(11)` | NO | `NULL` | MUL |  |
| `form_data` | `longtext` | NO | `NULL` |  |  |
| `status` | `enum('new','contacted','converted','closed')` | YES | `'new'` | MUL |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `assigned_to` | `int(11)` | YES | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `landing_page_id` -> `landing_pages.id` (Constraint: `landing_page_submissions_ibfk_1`)
- `assigned_to` -> `users.id` (Constraint: `landing_page_submissions_ibfk_2`)

**Indexes:**
- `INDEX` `assigned_to`: `assigned_to`
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_landing_page_id`: `landing_page_id`
- `INDEX` `idx_status`: `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `landing_page_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `category` | `varchar(100)` | YES | `'general'` | MUL |  |
| `content` | `longtext` | NO | `NULL` |  |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `usage_count` | `int(11)` | YES | `0` |  |  |
| `status` | `enum('active','inactive')` | YES | `'active'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_category`: `category`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `landing_pages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `status` | `enum('draft','published','archived')` | YES | `'draft'` | MUL |  |
| `content` | `longtext` | NO | `NULL` |  |  |
| `seo_title` | `varchar(255)` | YES | `NULL` |  |  |
| `seo_description` | `text` | YES | `NULL` |  |  |
| `slug` | `varchar(255)` | YES | `NULL` | UNI |  |
| `custom_domain` | `varchar(255)` | YES | `NULL` |  |  |
| `template_id` | `int(11)` | YES | `NULL` |  |  |
| `views` | `int(11)` | YES | `0` |  |  |
| `conversions` | `int(11)` | YES | `0` |  |  |
| `published_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `brand_id` | `int(11)` | YES | `NULL` |  |  |
| `seo_keywords` | `varchar(500)` | YES | `NULL` |  |  |
| `og_image` | `varchar(500)` | YES | `NULL` |  |  |
| `builder_version` | `varchar(10)` | YES | `'v1'` |  |  |
| `global_styles` | `longtext` | YES | `NULL` |  |  |
| `custom_css` | `text` | YES | `NULL` |  |  |
| `custom_js` | `text` | YES | `NULL` |  |  |
| `favicon_url` | `varchar(500)` | YES | `NULL` |  |  |
| `version_history` | `longtext` | YES | `NULL` |  |  |
| `published_version` | `int(11)` | YES | `1` |  |  |
| `ab_test_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `ab_test_config` | `longtext` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_landing_pages_company`: `workspace_id`, `company_id`
- `INDEX` `idx_landing_pages_workspace`: `workspace_id`
- `INDEX` `idx_slug`: `slug`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `slug`: `slug`

---
### Table: `lead_activities`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `lead_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `activity_type` | `enum('call','email','sms','meeting','note','task','deal_change')` | NO | `NULL` | MUL |  |
| `activity_title` | `varchar(255)` | NO | `NULL` |  |  |
| `activity_description` | `text` | YES | `NULL` |  |  |
| `activity_date` | `datetime` | NO | `current_timestamp()` | MUL |  |
| `duration_minutes` | `int(11)` | YES | `NULL` |  |  |
| `outcome` | `varchar(100)` | YES | `NULL` |  |  |
| `next_action` | `text` | YES | `NULL` |  |  |
| `next_action_date` | `datetime` | YES | `NULL` |  |  |
| `campaign_id` | `int(11)` | YES | `NULL` | MUL |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_activity_date`: `activity_date`
- `INDEX` `idx_activity_type`: `activity_type`
- `INDEX` `idx_campaign_id`: `campaign_id`
- `INDEX` `idx_contact_id`: `contact_id`
- `INDEX` `idx_lead_activities_workspace`: `workspace_id`
- `INDEX` `idx_lead_id`: `lead_id`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `lead_activity_log`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `lead_request_id` | `int(11)` | NO | `NULL` |  |  |
| `lead_match_id` | `int(11)` | YES | `NULL` |  |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `activity_type` | `varchar(50)` | NO | `NULL` |  |  |
| `description` | `varchar(255)` | YES | `NULL` |  |  |
| `meta` | `longtext` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_lead_activity`: `workspace_id`, `lead_request_id`, `created_at`
- `INDEX` `idx_lead_activity_match`: `workspace_id`, `lead_match_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `lead_attributions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `lead_source_id` | `int(11)` | YES | `NULL` | MUL |  |
| `source` | `varchar(100)` | YES | `NULL` |  |  |
| `medium` | `varchar(100)` | YES | `NULL` |  |  |
| `campaign` | `varchar(255)` | YES | `NULL` |  |  |
| `term` | `varchar(255)` | YES | `NULL` |  |  |
| `content` | `varchar(255)` | YES | `NULL` |  |  |
| `referrer_url` | `varchar(500)` | YES | `NULL` |  |  |
| `landing_page` | `varchar(500)` | YES | `NULL` |  |  |
| `device_type` | `varchar(20)` | YES | `NULL` |  |  |
| `browser` | `varchar(50)` | YES | `NULL` |  |  |
| `os` | `varchar(50)` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `first_touch` | `tinyint(1)` | YES | `1` |  |  |
| `conversion_type` | `varchar(50)` | YES | `NULL` |  |  |
| `conversion_value` | `decimal(10,2)` | YES | `NULL` |  |  |
| `attributed_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `lead_source_id` -> `lead_sources.id` (Constraint: `lead_attributions_ibfk_1`)

**Indexes:**
- `INDEX` `idx_attribution_campaign`: `workspace_id`, `campaign`
- `INDEX` `idx_attribution_contact`: `contact_id`
- `INDEX` `idx_attribution_source`: `workspace_id`, `lead_source_id`
- `INDEX` `idx_attribution_workspace`: `workspace_id`, `attributed_at`
- `INDEX` `lead_source_id`: `lead_source_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `lead_dedupe_log`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `lead_request_id` | `int(11)` | NO | `NULL` |  |  |
| `original_lead_id` | `int(11)` | YES | `NULL` |  |  |
| `dedupe_key` | `varchar(255)` | NO | `NULL` |  |  |
| `dedupe_type` | `enum('phone','email','fingerprint','address')` | NO | `NULL` |  |  |
| `action` | `enum('blocked','merged','flagged')` | NO | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_dedupe_log`: `workspace_id`, `dedupe_key`, `created_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `lead_matches`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `lead_request_id` | `int(11)` | NO | `NULL` |  |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `pro_id` | `int(11)` | YES | `NULL` |  |  |
| `match_score` | `decimal(5,2)` | YES | `NULL` |  |  |
| `match_reason` | `longtext` | YES | `NULL` |  |  |
| `distance_km` | `decimal(6,2)` | YES | `NULL` |  |  |
| `lead_price` | `decimal(10,2)` | NO | `NULL` |  |  |
| `status` | `enum('offered','viewed','accepted','declined','expired','won','lost','disputed','refunded')` | YES | `'offered'` |  |  |
| `offered_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `viewed_at` | `datetime` | YES | `NULL` |  |  |
| `accepted_at` | `datetime` | YES | `NULL` |  |  |
| `declined_at` | `datetime` | YES | `NULL` |  |  |
| `declined_reason` | `varchar(255)` | YES | `NULL` |  |  |
| `won_at` | `datetime` | YES | `NULL` |  |  |
| `won_value` | `decimal(10,2)` | YES | `NULL` |  |  |
| `lost_at` | `datetime` | YES | `NULL` |  |  |
| `lost_reason` | `varchar(255)` | YES | `NULL` |  |  |
| `expires_at` | `datetime` | YES | `NULL` |  |  |
| `response_time_minutes` | `int(11)` | YES | `NULL` |  |  |
| `credit_transaction_id` | `int(11)` | YES | `NULL` |  |  |
| `refund_transaction_id` | `int(11)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_lead_matches_company`: `workspace_id`, `company_id`, `status`
- `INDEX` `idx_lead_matches_expires`: `workspace_id`, `expires_at`
- `INDEX` `idx_lead_matches_lead`: `workspace_id`, `lead_request_id`
- `INDEX` `idx_lead_matches_status`: `workspace_id`, `status`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uq_lead_matches`: `workspace_id`, `lead_request_id`, `company_id`

---
### Table: `lead_pricing_rules`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(191)` | YES | `NULL` |  |  |
| `service_id` | `int(11)` | YES | `NULL` |  |  |
| `region` | `varchar(191)` | YES | `NULL` |  |  |
| `postal_code` | `varchar(32)` | YES | `NULL` |  |  |
| `city` | `varchar(191)` | YES | `NULL` |  |  |
| `country` | `varchar(64)` | YES | `NULL` |  |  |
| `timing` | `enum('asap','within_24h','within_week','flexible','scheduled')` | YES | `NULL` |  |  |
| `budget_min` | `decimal(10,2)` | YES | `NULL` |  |  |
| `budget_max` | `decimal(10,2)` | YES | `NULL` |  |  |
| `property_type` | `enum('residential','commercial','industrial','other')` | YES | `NULL` |  |  |
| `is_exclusive` | `tinyint(1)` | YES | `NULL` |  |  |
| `base_price` | `decimal(10,2)` | NO | `NULL` |  |  |
| `surge_multiplier` | `decimal(6,2)` | YES | `1.00` |  |  |
| `exclusive_multiplier` | `decimal(6,2)` | YES | `3.00` |  |  |
| `min_price` | `decimal(10,2)` | YES | `NULL` |  |  |
| `max_price` | `decimal(10,2)` | YES | `NULL` |  |  |
| `priority` | `int(11)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `valid_from` | `datetime` | YES | `NULL` |  |  |
| `valid_until` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_pricing_rules_active`: `workspace_id`, `is_active`, `priority`
- `INDEX` `idx_pricing_rules_postal`: `workspace_id`, `postal_code`
- `INDEX` `idx_pricing_rules_service`: `workspace_id`, `service_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `lead_quality_feedback`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `lead_match_id` | `int(11)` | NO | `NULL` |  |  |
| `lead_request_id` | `int(11)` | NO | `NULL` |  |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `quality_score` | `tinyint(4)` | NO | `NULL` |  |  |
| `contact_accuracy` | `tinyint(4)` | YES | `NULL` |  |  |
| `intent_accuracy` | `tinyint(4)` | YES | `NULL` |  |  |
| `timing_accuracy` | `tinyint(4)` | YES | `NULL` |  |  |
| `feedback_text` | `text` | YES | `NULL` |  |  |
| `issues` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_feedback_lead`: `workspace_id`, `lead_request_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uq_lead_feedback`: `workspace_id`, `lead_match_id`, `company_id`

---
### Table: `lead_quotes`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `lead_match_id` | `int(11)` | NO | `NULL` |  |  |
| `lead_request_id` | `int(11)` | NO | `NULL` |  |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `quote_type` | `enum('message','quote','question','update')` | YES | `'message'` |  |  |
| `message` | `text` | YES | `NULL` |  |  |
| `price_min` | `decimal(10,2)` | YES | `NULL` |  |  |
| `price_max` | `decimal(10,2)` | YES | `NULL` |  |  |
| `price_type` | `enum('fixed','estimate','hourly','free')` | YES | `'estimate'` |  |  |
| `eta` | `varchar(100)` | YES | `NULL` |  |  |
| `availability_notes` | `varchar(255)` | YES | `NULL` |  |  |
| `attachments` | `longtext` | YES | `NULL` |  |  |
| `is_from_consumer` | `tinyint(1)` | YES | `0` |  |  |
| `read_at` | `datetime` | YES | `NULL` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_lead_quotes_lead`: `workspace_id`, `lead_request_id`
- `INDEX` `idx_lead_quotes_match`: `workspace_id`, `lead_match_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `lead_request_services`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `lead_request_id` | `int(11)` | NO | `NULL` |  |  |
| `service_id` | `int(11)` | NO | `NULL` |  |  |
| `quantity` | `int(11)` | YES | `1` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_lead_request_services`: `workspace_id`, `lead_request_id`
- `INDEX` `idx_lead_request_services_svc`: `workspace_id`, `service_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `lead_requests`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `external_id` | `varchar(64)` | YES | `NULL` |  |  |
| `source` | `enum('form','api','import','referral')` | YES | `'form'` |  |  |
| `source_url` | `varchar(500)` | YES | `NULL` |  |  |
| `source_form_id` | `int(11)` | YES | `NULL` |  |  |
| `utm_source` | `varchar(100)` | YES | `NULL` |  |  |
| `utm_medium` | `varchar(100)` | YES | `NULL` |  |  |
| `utm_campaign` | `varchar(100)` | YES | `NULL` |  |  |
| `consumer_name` | `varchar(191)` | YES | `NULL` |  |  |
| `consumer_email` | `varchar(191)` | YES | `NULL` |  |  |
| `consumer_phone` | `varchar(64)` | YES | `NULL` |  |  |
| `consumer_alt_phone` | `varchar(64)` | YES | `NULL` |  |  |
| `address_line1` | `varchar(255)` | YES | `NULL` |  |  |
| `address_line2` | `varchar(255)` | YES | `NULL` |  |  |
| `city` | `varchar(191)` | YES | `NULL` |  |  |
| `region` | `varchar(191)` | YES | `NULL` |  |  |
| `country` | `varchar(64)` | YES | `'US'` |  |  |
| `postal_code` | `varchar(32)` | YES | `NULL` |  |  |
| `latitude` | `decimal(10,7)` | YES | `NULL` |  |  |
| `longitude` | `decimal(10,7)` | YES | `NULL` |  |  |
| `budget_min` | `decimal(10,2)` | YES | `NULL` |  |  |
| `budget_max` | `decimal(10,2)` | YES | `NULL` |  |  |
| `timing` | `enum('asap','within_24h','within_week','flexible','scheduled')` | YES | `'flexible'` |  |  |
| `scheduled_date` | `date` | YES | `NULL` |  |  |
| `scheduled_time_start` | `time` | YES | `NULL` |  |  |
| `scheduled_time_end` | `time` | YES | `NULL` |  |  |
| `title` | `varchar(255)` | YES | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `property_type` | `enum('residential','commercial','industrial','other')` | YES | `NULL` |  |  |
| `property_size` | `varchar(64)` | YES | `NULL` |  |  |
| `media` | `longtext` | YES | `NULL` |  |  |
| `answers` | `longtext` | YES | `NULL` |  |  |
| `consent_contact` | `tinyint(1)` | YES | `1` |  |  |
| `consent_marketing` | `tinyint(1)` | YES | `0` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `device_fingerprint` | `varchar(64)` | YES | `NULL` |  |  |
| `status` | `enum('new','routing','routed','partial','closed','expired','spam','duplicate')` | YES | `'new'` |  |  |
| `quality_score` | `decimal(5,2)` | YES | `NULL` |  |  |
| `is_exclusive` | `tinyint(1)` | YES | `0` |  |  |
| `max_sold_count` | `int(11)` | YES | `3` |  |  |
| `current_sold_count` | `int(11)` | YES | `0` |  |  |
| `lead_price_base` | `decimal(10,2)` | YES | `NULL` |  |  |
| `lead_price_final` | `decimal(10,2)` | YES | `NULL` |  |  |
| `routed_at` | `datetime` | YES | `NULL` |  |  |
| `expires_at` | `datetime` | YES | `NULL` |  |  |
| `closed_at` | `datetime` | YES | `NULL` |  |  |
| `closed_reason` | `varchar(100)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |
| `geocoded_at` | `datetime` | YES | `NULL` |  |  |
| `geocode_source` | `varchar(50)` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_lead_requests_consumer`: `workspace_id`, `consumer_phone`
- `INDEX` `idx_lead_requests_coords`: `workspace_id`, `latitude`, `longitude`
- `INDEX` `idx_lead_requests_email`: `workspace_id`, `consumer_email`
- `INDEX` `idx_lead_requests_expires`: `workspace_id`, `expires_at`
- `INDEX` `idx_lead_requests_postal`: `workspace_id`, `postal_code`
- `INDEX` `idx_lead_requests_status`: `workspace_id`, `status`, `created_at`
- `INDEX` `idx_lead_requests_timing`: `workspace_id`, `timing`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `lead_routing_queue`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `lead_request_id` | `int(11)` | NO | `NULL` |  |  |
| `status` | `enum('pending','processing','completed','failed')` | YES | `'pending'` |  |  |
| `attempts` | `int(11)` | YES | `0` |  |  |
| `max_attempts` | `int(11)` | YES | `3` |  |  |
| `last_error` | `text` | YES | `NULL` |  |  |
| `scheduled_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `started_at` | `datetime` | YES | `NULL` |  |  |
| `completed_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_routing_queue_lead`: `workspace_id`, `lead_request_id`
- `INDEX` `idx_routing_queue_status`: `workspace_id`, `status`, `scheduled_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `lead_scores`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `score` | `int(11)` | NO | `NULL` | MUL |  |
| `factors` | `longtext` | NO | `NULL` |  |  |
| `calculated_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_lead_scores_calculated`: `calculated_at`
- `INDEX` `idx_lead_scores_contact`: `contact_id`
- `INDEX` `idx_lead_scores_score`: `score`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `lead_scoring_rules`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `conditions` | `longtext` | NO | `NULL` |  |  |
| `score_change` | `int(11)` | NO | `NULL` |  |  |
| `max_applications` | `int(11)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_scoring_workspace`: `workspace_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `lead_sources`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `source_type` | `enum('form','call','campaign','referral','import','api','unknown')` | NO | `NULL` | MUL |  |
| `source_id` | `varchar(255)` | YES | `NULL` |  |  |
| `campaign_id` | `int(11)` | YES | `NULL` | MUL |  |
| `form_id` | `int(11)` | YES | `NULL` |  |  |
| `utm_source` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_medium` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_campaign` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_term` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_content` | `varchar(255)` | YES | `NULL` |  |  |
| `referrer_url` | `varchar(500)` | YES | `NULL` |  |  |
| `landing_page` | `varchar(500)` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_lead_sources_campaign`: `campaign_id`
- `INDEX` `idx_lead_sources_contact`: `contact_id`
- `INDEX` `idx_lead_sources_created`: `created_at`
- `INDEX` `idx_lead_sources_type`: `source_type`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `lead_tag_relations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `lead_id` | `int(11)` | NO | `NULL` | MUL |  |
| `tag_id` | `int(11)` | NO | `NULL` | MUL |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_lead_id`: `lead_id`
- `INDEX` `idx_tag_id`: `tag_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_lead_tag`: `lead_id`, `tag_id`

---
### Table: `lead_tags`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `color` | `varchar(7)` | NO | `'#007bff'` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_lead_tags_workspace`: `workspace_id`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_user_tag`: `user_id`, `name`

---
### Table: `leads`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `lead_score` | `int(11)` | NO | `0` | MUL |  |
| `lead_stage` | `enum('new','contacted','qualified','proposal','negotiation','closed_won','closed_lost')` | NO | `'new'` | MUL |  |
| `lead_value` | `decimal(12,2)` | YES | `NULL` |  |  |
| `probability` | `int(11)` | YES | `0` |  |  |
| `expected_close_date` | `date` | YES | `NULL` |  |  |
| `assigned_agent_id` | `int(11)` | YES | `NULL` | MUL |  |
| `source` | `varchar(100)` | YES | `NULL` |  |  |
| `campaign_id` | `int(11)` | YES | `NULL` | MUL |  |
| `last_activity_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_assigned_agent`: `assigned_agent_id`
- `INDEX` `idx_campaign_id`: `campaign_id`
- `INDEX` `idx_contact_id`: `contact_id`
- `INDEX` `idx_leads_company`: `company_id`
- `INDEX` `idx_leads_workspace`: `workspace_id`
- `INDEX` `idx_leads_workspace_company`: `workspace_id`, `company_id`
- `INDEX` `idx_lead_score`: `lead_score`
- `INDEX` `idx_lead_stage`: `lead_stage`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `leave_balances`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `year` | `int(11)` | NO | `NULL` |  |  |
| `vacation_balance` | `decimal(10,2)` | YES | `0.00` |  |  |
| `vacation_used` | `decimal(10,2)` | YES | `0.00` |  |  |
| `vacation_accrued` | `decimal(10,2)` | YES | `0.00` |  |  |
| `sick_balance` | `decimal(10,2)` | YES | `0.00` |  |  |
| `sick_used` | `decimal(10,2)` | YES | `0.00` |  |  |
| `sick_accrued` | `decimal(10,2)` | YES | `0.00` |  |  |
| `personal_balance` | `decimal(10,2)` | YES | `0.00` |  |  |
| `personal_used` | `decimal(10,2)` | YES | `0.00` |  |  |
| `carryover_hours` | `decimal(10,2)` | YES | `0.00` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_leave_balances_workspace`: `workspace_id`, `year`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_user_year`: `user_id`, `year`

---
### Table: `leave_requests`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `leave_type` | `enum('vacation','sick','personal','bereavement','jury_duty','military','unpaid','other')` | NO | `NULL` |  |  |
| `start_date` | `date` | NO | `NULL` |  |  |
| `end_date` | `date` | NO | `NULL` |  |  |
| `is_half_day` | `tinyint(1)` | YES | `0` |  |  |
| `half_day_type` | `enum('morning','afternoon')` | YES | `NULL` |  |  |
| `total_hours` | `decimal(10,2)` | NO | `NULL` |  |  |
| `status` | `enum('pending','approved','rejected','cancelled')` | YES | `'pending'` |  |  |
| `approved_by` | `int(11)` | YES | `NULL` |  |  |
| `approved_at` | `timestamp` | YES | `NULL` |  |  |
| `rejection_reason` | `text` | YES | `NULL` |  |  |
| `reason` | `text` | YES | `NULL` |  |  |
| `manager_notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_leave_requests_user`: `user_id`, `start_date`
- `INDEX` `idx_leave_requests_workspace`: `workspace_id`, `status`, `start_date`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `lesson_attachments`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `lesson_id` | `int(11)` | NO | `NULL` | MUL |  |
| `filename` | `varchar(255)` | NO | `NULL` |  |  |
| `original_name` | `varchar(255)` | NO | `NULL` |  |  |
| `file_path` | `varchar(500)` | NO | `NULL` |  |  |
| `file_size` | `int(11)` | YES | `0` |  |  |
| `mime_type` | `varchar(100)` | YES | `NULL` |  |  |
| `download_count` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_lesson_attach_lesson`: `lesson_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `lesson_progress`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `enrollment_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `lesson_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `user_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `status` | `enum('not_started','in_progress','completed')` | YES | `'not_started'` | MUL |  |
| `progress_percentage` | `decimal(5,2)` | YES | `0.00` |  |  |
| `time_spent` | `int(11)` | YES | `0` |  |  |
| `last_position` | `int(11)` | YES | `NULL` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_enrollment`: `enrollment_id`
- `INDEX` `idx_lesson`: `lesson_id`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_progress`: `enrollment_id`, `lesson_id`

---
### Table: `linkedin_connections`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | UNI |  |
| `access_token` | `text` | YES | `NULL` |  |  |
| `refresh_token` | `text` | YES | `NULL` |  |  |
| `token_expires_at` | `timestamp` | YES | `NULL` |  |  |
| `linkedin_user_id` | `varchar(100)` | YES | `NULL` |  |  |
| `profile_url` | `varchar(500)` | YES | `NULL` |  |  |
| `status` | `enum('active','expired','revoked')` | YES | `'active'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_linkedin_user`: `user_id`

---
### Table: `linkedin_lead_forms`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `form_id` | `varchar(255)` | NO | `NULL` | UNI |  |
| `form_name` | `varchar(255)` | NO | `NULL` |  |  |
| `account_id` | `varchar(255)` | YES | `NULL` |  |  |
| `campaign_id` | `varchar(255)` | YES | `NULL` |  |  |
| `fields` | `longtext` | YES | `NULL` |  |  |
| `last_synced_at` | `datetime` | YES | `NULL` |  |  |
| `sync_status` | `varchar(50)` | YES | `'active'` |  |  |
| `total_leads` | `int(11)` | YES | `0` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `idx_linkedin_forms_form_id`: `form_id`
- `INDEX` `idx_linkedin_forms_user`: `user_id`
- `INDEX` `idx_linkedin_forms_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `linkedin_leads`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `form_id` | `int(11)` | NO | `NULL` | MUL |  |
| `lead_id` | `varchar(255)` | NO | `NULL` | UNI |  |
| `email` | `varchar(255)` | YES | `NULL` | MUL |  |
| `first_name` | `varchar(255)` | YES | `NULL` |  |  |
| `last_name` | `varchar(255)` | YES | `NULL` |  |  |
| `phone` | `varchar(50)` | YES | `NULL` |  |  |
| `company` | `varchar(255)` | YES | `NULL` |  |  |
| `job_title` | `varchar(255)` | YES | `NULL` |  |  |
| `linkedin_url` | `varchar(500)` | YES | `NULL` |  |  |
| `form_data` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('new','processed','synced_to_crm','error')` | YES | `'new'` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` |  |  |
| `submitted_at` | `datetime` | YES | `NULL` |  |  |
| `processed_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `form_id` -> `linkedin_lead_forms.id` (Constraint: `linkedin_leads_ibfk_1`)

**Indexes:**
- `INDEX` `idx_linkedin_leads_email`: `email`
- `INDEX` `idx_linkedin_leads_form`: `form_id`
- `UNIQUE` `idx_linkedin_leads_lead_id`: `lead_id`
- `INDEX` `idx_linkedin_leads_status`: `status`
- `INDEX` `idx_linkedin_leads_user`: `user_id`
- `INDEX` `idx_linkedin_leads_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `linkedin_messages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `sequence_step_log_id` | `int(11)` | YES | `NULL` |  |  |
| `message_type` | `enum('connection_request','message','inmail')` | NO | `NULL` |  |  |
| `content` | `text` | YES | `NULL` |  |  |
| `status` | `enum('pending','sent','delivered','viewed','replied','failed')` | YES | `'pending'` | MUL |  |
| `external_message_id` | `varchar(255)` | YES | `NULL` |  |  |
| `sent_at` | `timestamp` | YES | `NULL` |  |  |
| `viewed_at` | `timestamp` | YES | `NULL` |  |  |
| `replied_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_linkedin_messages_contact`: `contact_id`
- `INDEX` `idx_linkedin_messages_status`: `status`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`

---
### Table: `linkedin_profiles`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `contact_id` | `int(11)` | NO | `NULL` | UNI |  |
| `linkedin_url` | `varchar(500)` | YES | `NULL` | MUL |  |
| `linkedin_id` | `varchar(100)` | YES | `NULL` |  |  |
| `headline` | `varchar(500)` | YES | `NULL` |  |  |
| `company` | `varchar(255)` | YES | `NULL` |  |  |
| `title` | `varchar(255)` | YES | `NULL` |  |  |
| `location` | `varchar(255)` | YES | `NULL` |  |  |
| `industry` | `varchar(255)` | YES | `NULL` |  |  |
| `connections_count` | `int(11)` | YES | `NULL` |  |  |
| `profile_data` | `longtext` | YES | `NULL` |  |  |
| `last_synced_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_linkedin_profiles_url`: `linkedin_url`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_linkedin_contact`: `contact_id`

---
### Table: `linkedin_tasks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `linkedin_url` | `varchar(500)` | YES | `NULL` |  |  |
| `contact_name` | `varchar(255)` | YES | `NULL` |  |  |
| `contact_title` | `varchar(255)` | YES | `NULL` |  |  |
| `contact_company` | `varchar(255)` | YES | `NULL` |  |  |
| `task_type` | `enum('send_connection','send_message','engage_post','follow_up','other')` | YES | `'send_message'` |  |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `template_id` | `int(11)` | YES | `NULL` |  |  |
| `suggested_message` | `text` | YES | `NULL` |  |  |
| `status` | `enum('pending','in_progress','completed','skipped','failed')` | YES | `'pending'` | MUL |  |
| `completed_at` | `datetime` | YES | `NULL` |  |  |
| `completed_by` | `int(11)` | YES | `NULL` |  |  |
| `completion_notes` | `text` | YES | `NULL` |  |  |
| `priority` | `enum('low','medium','high','urgent')` | YES | `'medium'` |  |  |
| `due_date` | `date` | YES | `NULL` | MUL |  |
| `reminder_at` | `datetime` | YES | `NULL` |  |  |
| `automation_id` | `int(11)` | YES | `NULL` |  |  |
| `automation_execution_id` | `int(11)` | YES | `NULL` |  |  |
| `assigned_user_id` | `int(11)` | YES | `NULL` | MUL |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_linkedin_tasks_assigned`: `assigned_user_id`
- `INDEX` `idx_linkedin_tasks_contact`: `contact_id`
- `INDEX` `idx_linkedin_tasks_due`: `due_date`
- `INDEX` `idx_linkedin_tasks_status`: `status`
- `INDEX` `idx_linkedin_tasks_user`: `user_id`
- `INDEX` `idx_linkedin_tasks_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `linkedin_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `category` | `varchar(50)` | YES | `'general'` | MUL |  |
| `message_type` | `enum('connection_request','direct_message','inmail','follow_up')` | YES | `'direct_message'` | MUL |  |
| `subject` | `varchar(255)` | YES | `NULL` |  |  |
| `message` | `text` | NO | `NULL` |  |  |
| `variables` | `longtext` | YES | `NULL` |  |  |
| `usage_count` | `int(11)` | YES | `0` |  |  |
| `last_used_at` | `datetime` | YES | `NULL` |  |  |
| `is_favorite` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_linkedin_templates_category`: `category`
- `INDEX` `idx_linkedin_templates_type`: `message_type`
- `INDEX` `idx_linkedin_templates_user`: `user_id`
- `INDEX` `idx_linkedin_templates_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `listing_audits`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `scan_type` | `enum('full','quick','scheduled')` | YES | `'full'` |  |  |
| `status` | `enum('pending','running','completed','failed')` | YES | `'pending'` |  |  |
| `score` | `int(11)` | YES | `0` |  |  |
| `total_directories_checked` | `int(11)` | YES | `0` |  |  |
| `listings_found` | `int(11)` | YES | `0` |  |  |
| `nap_errors` | `int(11)` | YES | `0` |  |  |
| `duplicates_found` | `int(11)` | YES | `0` |  |  |
| `report_data` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_workspace_company`: `workspace_id`, `company_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `listing_duplicates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `listing_id` | `int(11)` | YES | `NULL` | MUL |  |
| `directory_id` | `int(11)` | YES | `NULL` |  |  |
| `directory_name` | `varchar(100)` | NO | `NULL` |  |  |
| `external_url` | `varchar(500)` | NO | `NULL` |  |  |
| `business_name` | `varchar(255)` | YES | `NULL` |  |  |
| `address` | `varchar(500)` | YES | `NULL` |  |  |
| `phone` | `varchar(20)` | YES | `NULL` |  |  |
| `status` | `enum('detected','suppressing','suppressed','ignored')` | YES | `'detected'` |  |  |
| `suppression_method` | `varchar(50)` | YES | `NULL` |  |  |
| `suppression_log` | `longtext` | YES | `NULL` |  |  |
| `last_checked_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `listing_id` -> `business_listings.id` (Constraint: `listing_duplicates_ibfk_1`)

**Indexes:**
- `INDEX` `idx_workspace_company`: `workspace_id`, `company_id`
- `INDEX` `listing_id`: `listing_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `listing_rank_history`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `rank_tracking_id` | `int(11)` | NO | `NULL` | MUL |  |
| `rank` | `int(11)` | YES | `NULL` |  |  |
| `checked_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Foreign Keys:**
- `rank_tracking_id` -> `listing_rank_tracking.id` (Constraint: `listing_rank_history_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `rank_tracking_id`: `rank_tracking_id`

---
### Table: `listing_rank_tracking`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` | MUL |  |
| `keyword` | `varchar(255)` | NO | `NULL` |  |  |
| `location` | `varchar(255)` | YES | `NULL` |  |  |
| `engine` | `enum('google_search','google_maps','bing_search')` | YES | `'google_maps'` |  |  |
| `rank` | `int(11)` | YES | `NULL` |  |  |
| `previous_rank` | `int(11)` | YES | `NULL` |  |  |
| `best_rank` | `int(11)` | YES | `NULL` |  |  |
| `search_volume` | `int(11)` | YES | `0` |  |  |
| `last_checked_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `company_id`: `company_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `workspace_id`: `workspace_id`

---
### Table: `listing_reviews`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(10) unsigned` | NO | `NULL` |  |  |
| `company_id` | `int(10) unsigned` | NO | `NULL` |  |  |
| `listing_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `source` | `varchar(100)` | NO | `NULL` |  |  |
| `external_review_id` | `varchar(255)` | YES | `NULL` |  |  |
| `reviewer_name` | `varchar(255)` | YES | `NULL` |  |  |
| `reviewer_avatar` | `text` | YES | `NULL` |  |  |
| `rating` | `decimal(3,2)` | NO | `NULL` |  |  |
| `review_text` | `text` | YES | `NULL` |  |  |
| `review_date` | `date` | YES | `NULL` |  |  |
| `reply_text` | `text` | YES | `NULL` |  |  |
| `replied_at` | `timestamp` | YES | `NULL` |  |  |
| `sentiment` | `varchar(50)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_external_review`: `listing_id`, `source`, `external_review_id`

---
### Table: `listing_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `business_name` | `varchar(255)` | YES | `NULL` |  |  |
| `address` | `varchar(500)` | YES | `NULL` |  |  |
| `phone` | `varchar(20)` | YES | `NULL` |  |  |
| `website` | `varchar(500)` | YES | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `short_description` | `varchar(255)` | YES | `NULL` |  |  |
| `categories` | `longtext` | YES | `NULL` |  |  |
| `keywords` | `longtext` | YES | `NULL` |  |  |
| `year_established` | `int(11)` | YES | `NULL` |  |  |
| `payment_methods` | `longtext` | YES | `NULL` |  |  |
| `languages` | `longtext` | YES | `NULL` |  |  |
| `services` | `longtext` | YES | `NULL` |  |  |
| `brands` | `longtext` | YES | `NULL` |  |  |
| `logo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `cover_photo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `gallery_images` | `longtext` | YES | `NULL` |  |  |
| `facebook_url` | `varchar(500)` | YES | `NULL` |  |  |
| `instagram_url` | `varchar(500)` | YES | `NULL` |  |  |
| `twitter_url` | `varchar(500)` | YES | `NULL` |  |  |
| `linkedin_url` | `varchar(500)` | YES | `NULL` |  |  |
| `youtube_url` | `varchar(500)` | YES | `NULL` |  |  |
| `tiktok_url` | `varchar(500)` | YES | `NULL` |  |  |
| `pinterest_url` | `varchar(500)` | YES | `NULL` |  |  |
| `yelp_url` | `varchar(500)` | YES | `NULL` |  |  |
| `google_maps_url` | `varchar(500)` | YES | `NULL` |  |  |
| `hours` | `longtext` | YES | `NULL` |  |  |
| `integrations` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_company`: `workspace_id`, `company_id`

---
### Table: `listing_sync_jobs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `listing_id` | `int(11)` | YES | `NULL` | MUL |  |
| `directory_id` | `int(11)` | YES | `NULL` |  |  |
| `job_type` | `enum('create','update','verify','claim','sync')` | YES | `'sync'` |  |  |
| `status` | `enum('pending','running','completed','failed','cancelled')` | YES | `'pending'` | MUL |  |
| `priority` | `int(11)` | YES | `0` |  |  |
| `payload` | `longtext` | YES | `NULL` |  |  |
| `result` | `longtext` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `attempts` | `int(11)` | YES | `0` |  |  |
| `max_attempts` | `int(11)` | YES | `3` |  |  |
| `scheduled_at` | `timestamp` | YES | `NULL` |  |  |
| `started_at` | `timestamp` | YES | `NULL` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `listing_id` -> `business_listings.id` (Constraint: `listing_sync_jobs_ibfk_1`)

**Indexes:**
- `INDEX` `idx_sync_jobs_scheduled`: `status`, `scheduled_at`
- `INDEX` `idx_sync_jobs_status`: `workspace_id`, `status`, `priority`
- `INDEX` `listing_id`: `listing_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `listings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `platform` | `varchar(100)` | NO | `NULL` | MUL |  |
| `external_id` | `varchar(255)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `address` | `text` | YES | `NULL` |  |  |
| `phone` | `varchar(50)` | YES | `NULL` |  |  |
| `website` | `varchar(500)` | YES | `NULL` |  |  |
| `category` | `varchar(255)` | YES | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `hours` | `longtext` | YES | `NULL` |  |  |
| `photos` | `longtext` | YES | `NULL` |  |  |
| `attributes` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('active','pending','suspended','deleted')` | YES | `'pending'` | MUL |  |
| `sync_status` | `enum('synced','pending','error')` | YES | `'pending'` |  |  |
| `last_synced_at` | `timestamp` | YES | `NULL` |  |  |
| `rating` | `decimal(3,2)` | YES | `NULL` |  |  |
| `review_count` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_listings_platform`: `platform`
- `INDEX` `idx_listings_status`: `status`
- `INDEX` `idx_listings_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `login_attempts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `identifier` | `varchar(255)` | NO | `NULL` | MUL |  |
| `identifier_type` | `enum('ip','email')` | NO | `NULL` |  |  |
| `attempt_time` | `datetime` | NO | `current_timestamp()` | MUL |  |
| `success` | `tinyint(1)` | NO | `0` |  |  |
| `user_agent` | `varchar(500)` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_attempt_time`: `attempt_time`
- `INDEX` `idx_cleanup`: `attempt_time`, `success`
- `INDEX` `idx_identifier_type`: `identifier`, `identifier_type`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `loyalty_points`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `points_balance` | `int(11)` | YES | `0` |  |  |
| `total_points_earned` | `int(11)` | YES | `0` |  |  |
| `last_transaction_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `contact_id`: `contact_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `workspace_id`: `workspace_id`

---
### Table: `loyalty_programs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `points_to_currency_ratio` | `decimal(10,4)` | YES | `1.0000` |  |  |
| `signup_bonus` | `int(11)` | YES | `0` |  |  |
| `birthday_bonus` | `int(11)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`
- `INDEX` `workspace_id`: `workspace_id`

---
### Table: `loyalty_rewards`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `points_required` | `int(11)` | NO | `NULL` |  |  |
| `reward_type` | `enum('discount_fixed','discount_percent','free_product','gift_card')` | NO | `NULL` |  |  |
| `reward_value` | `decimal(10,2)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `workspace_id`: `workspace_id`

---
### Table: `loyalty_transactions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `type` | `enum('earn','redeem','bonus','adjustment')` | NO | `NULL` |  |  |
| `points` | `int(11)` | NO | `NULL` |  |  |
| `reference_type` | `varchar(50)` | YES | `NULL` |  |  |
| `reference_id` | `varchar(50)` | YES | `NULL` |  |  |
| `description` | `varchar(255)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `contact_id`: `contact_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `workspace_id`: `workspace_id`

---
### Table: `marketplace_message_preferences`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `notify_email` | `tinyint(1)` | YES | `1` |  |  |
| `notify_sms` | `tinyint(1)` | YES | `0` |  |  |
| `notify_push` | `tinyint(1)` | YES | `1` |  |  |
| `quiet_hours_start` | `time` | YES | `NULL` |  |  |
| `quiet_hours_end` | `time` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uq_msg_prefs`: `workspace_id`, `company_id`

---
### Table: `marketplace_messages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `lead_match_id` | `int(11)` | NO | `NULL` |  |  |
| `lead_request_id` | `int(11)` | NO | `NULL` |  |  |
| `sender_type` | `enum('consumer','provider','system')` | NO | `NULL` |  |  |
| `sender_id` | `int(11)` | YES | `NULL` |  |  |
| `message` | `text` | NO | `NULL` |  |  |
| `attachments` | `longtext` | YES | `NULL` |  |  |
| `is_read` | `tinyint(1)` | YES | `0` |  |  |
| `read_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_messages_match`: `workspace_id`, `lead_match_id`
- `INDEX` `idx_messages_unread`: `workspace_id`, `lead_match_id`, `is_read`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `marketplace_reviews`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `lead_request_id` | `int(11)` | YES | `NULL` |  |  |
| `lead_match_id` | `int(11)` | YES | `NULL` |  |  |
| `reviewer_name` | `varchar(191)` | YES | `NULL` |  |  |
| `reviewer_email` | `varchar(191)` | YES | `NULL` |  |  |
| `reviewer_phone` | `varchar(64)` | YES | `NULL` |  |  |
| `rating` | `tinyint(4)` | NO | `NULL` |  |  |
| `title` | `varchar(255)` | YES | `NULL` |  |  |
| `comment` | `text` | YES | `NULL` |  |  |
| `pros` | `text` | YES | `NULL` |  |  |
| `cons` | `text` | YES | `NULL` |  |  |
| `photos` | `longtext` | YES | `NULL` |  |  |
| `is_verified` | `tinyint(1)` | YES | `0` |  |  |
| `verified_at` | `datetime` | YES | `NULL` |  |  |
| `is_featured` | `tinyint(1)` | YES | `0` |  |  |
| `is_public` | `tinyint(1)` | YES | `1` |  |  |
| `response` | `text` | YES | `NULL` |  |  |
| `response_at` | `datetime` | YES | `NULL` |  |  |
| `response_by` | `int(11)` | YES | `NULL` |  |  |
| `status` | `enum('pending','approved','rejected','flagged')` | YES | `'pending'` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_reviews_company`: `workspace_id`, `company_id`, `status`
- `INDEX` `idx_reviews_lead`: `workspace_id`, `lead_request_id`
- `INDEX` `idx_reviews_rating`: `workspace_id`, `company_id`, `rating`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `meeting_reminders`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `meeting_id` | `int(11)` | NO | `NULL` | MUL |  |
| `remind_at` | `timestamp` | NO | `current_timestamp()` | MUL | on update current_timestamp() |
| `reminder_type` | `enum('email','sms','notification')` | YES | `'notification'` |  |  |
| `sent` | `tinyint(1)` | YES | `0` | MUL |  |
| `sent_at` | `timestamp` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_meeting_reminders_remind`: `remind_at`
- `INDEX` `idx_meeting_reminders_sent`: `sent`
- `INDEX` `meeting_id`: `meeting_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `meetings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `calendar_event_id` | `varchar(255)` | YES | `NULL` |  |  |
| `calendar_provider` | `enum('google','outlook')` | YES | `NULL` |  |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `scheduled_at` | `timestamp` | NO | `current_timestamp()` | MUL | on update current_timestamp() |
| `duration_minutes` | `int(11)` | YES | `30` |  |  |
| `location` | `varchar(500)` | YES | `NULL` |  |  |
| `meeting_link` | `varchar(500)` | YES | `NULL` |  |  |
| `status` | `enum('scheduled','confirmed','cancelled','rescheduled','completed','no_show')` | YES | `'scheduled'` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_meetings_contact`: `contact_id`
- `INDEX` `idx_meetings_scheduled`: `scheduled_at`
- `INDEX` `idx_meetings_status`: `status`
- `INDEX` `idx_meetings_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `member_access`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `membership_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `status` | `enum('active','expired','cancelled','paused')` | YES | `'active'` |  |  |
| `access_granted_at` | `datetime` | NO | `NULL` |  |  |
| `access_expires_at` | `datetime` | YES | `NULL` |  |  |
| `payment_id` | `int(11)` | YES | `NULL` |  |  |
| `subscription_id` | `int(11)` | YES | `NULL` |  |  |
| `last_accessed_at` | `datetime` | YES | `NULL` |  |  |
| `completed_content_ids` | `longtext` | YES | `NULL` |  |  |
| `progress_percent` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `membership_id` -> `memberships.id` (Constraint: `member_access_ibfk_1`)

**Indexes:**
- `INDEX` `idx_member_access_contact`: `contact_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_member_access`: `membership_id`, `contact_id`

---
### Table: `membership_access`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `membership_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `user_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `contact_id` | `int(10) unsigned` | YES | `NULL` | MUL |  |
| `status` | `enum('active','cancelled','expired','suspended')` | YES | `'active'` | MUL |  |
| `started_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `expires_at` | `timestamp` | YES | `NULL` |  |  |
| `cancelled_at` | `timestamp` | YES | `NULL` |  |  |
| `payment_id` | `int(10) unsigned` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_contact`: `contact_id`
- `INDEX` `idx_membership`: `membership_id`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_access`: `membership_id`, `user_id`

---
### Table: `membership_areas`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `slug` | `varchar(255)` | NO | `NULL` | MUL |  |
| `description` | `text` | YES | `NULL` |  |  |
| `access_type` | `enum('free','paid','course_based','subscription')` | YES | `'free'` |  |  |
| `price` | `decimal(10,2)` | YES | `0.00` |  |  |
| `billing_period` | `enum('monthly','yearly','lifetime','one_time')` | YES | `NULL` |  |  |
| `status` | `enum('active','inactive')` | YES | `'active'` | MUL |  |
| `total_members` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_slug`: `slug`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_slug`: `workspace_id`, `slug`

---
### Table: `membership_content`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `membership_id` | `int(11)` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `content_type` | `enum('module','lesson','video','file','quiz')` | YES | `'lesson'` |  |  |
| `parent_id` | `int(11)` | YES | `NULL` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `content` | `longtext` | YES | `NULL` |  |  |
| `video_url` | `varchar(500)` | YES | `NULL` |  |  |
| `file_url` | `varchar(500)` | YES | `NULL` |  |  |
| `duration_minutes` | `int(11)` | YES | `NULL` |  |  |
| `drip_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `drip_days` | `int(11)` | YES | `0` |  |  |
| `is_published` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `membership_id` -> `memberships.id` (Constraint: `membership_content_ibfk_1`)

**Indexes:**
- `INDEX` `idx_membership_content`: `membership_id`, `parent_id`, `sort_order`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `memberships`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `slug` | `varchar(100)` | YES | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `access_type` | `enum('free','paid','subscription')` | YES | `'paid'` |  |  |
| `price` | `decimal(10,2)` | YES | `NULL` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `billing_interval` | `enum('one_time','monthly','yearly')` | YES | `'one_time'` |  |  |
| `trial_days` | `int(11)` | YES | `0` |  |  |
| `welcome_message` | `text` | YES | `NULL` |  |  |
| `status` | `enum('draft','active','archived')` | YES | `'draft'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_memberships_workspace`: `workspace_id`, `status`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_membership_slug`: `workspace_id`, `slug`

---
### Table: `message_queue`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `conversation_id` | `int(11)` | YES | `NULL` | MUL |  |
| `channel` | `enum('email','sms','whatsapp','facebook','instagram','gmb','webchat')` | NO | `NULL` |  |  |
| `direction` | `enum('inbound','outbound')` | NO | `NULL` |  |  |
| `from_identifier` | `varchar(255)` | NO | `NULL` |  |  |
| `to_identifier` | `varchar(255)` | NO | `NULL` |  |  |
| `content` | `text` | NO | `NULL` |  |  |
| `media_urls` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('queued','sending','sent','delivered','failed')` | YES | `'queued'` | MUL |  |
| `external_id` | `varchar(255)` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `scheduled_at` | `timestamp` | YES | `NULL` | MUL |  |
| `sent_at` | `timestamp` | YES | `NULL` |  |  |
| `delivered_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_conversation`: `conversation_id`
- `INDEX` `idx_message_queue_status`: `workspace_id`, `status`, `scheduled_at`
- `INDEX` `idx_scheduled`: `scheduled_at`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `migration_log`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `migration_name` | `varchar(255)` | NO | `NULL` | UNI |  |
| `applied_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `UNIQUE` `migration_name`: `migration_name`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `migrations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `migration` | `varchar(255)` | NO | `NULL` | UNI |  |
| `executed_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Indexes:**
- `UNIQUE` `migration`: `migration`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `mobile_devices`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | YES | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `device_type` | `enum('ios','android')` | NO | `NULL` |  |  |
| `device_token` | `varchar(255)` | NO | `NULL` | UNI |  |
| `device_name` | `varchar(255)` | YES | `NULL` |  |  |
| `os_version` | `varchar(50)` | YES | `NULL` |  |  |
| `app_version` | `varchar(50)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `last_active_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_contact`: `contact_id`
- `INDEX` `idx_mobile_devices_active`: `workspace_id`, `is_active`, `last_active_at`
- `INDEX` `idx_user`: `user_id`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_device`: `device_token`

---
### Table: `mobile_sessions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `device_id` | `int(11)` | NO | `NULL` | MUL |  |
| `session_id` | `varchar(64)` | NO | `NULL` | MUL |  |
| `started_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `ended_at` | `timestamp` | YES | `NULL` |  |  |
| `duration_seconds` | `int(11)` | YES | `NULL` |  |  |
| `screens_viewed` | `int(11)` | YES | `0` |  |  |
| `actions_performed` | `int(11)` | YES | `0` |  |  |

**Indexes:**
- `INDEX` `idx_device`: `device_id`
- `INDEX` `idx_session`: `session_id`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `module_migrations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `module_key` | `varchar(50)` | NO | `NULL` | MUL |  |
| `migration_name` | `varchar(255)` | NO | `NULL` |  |  |
| `applied_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_module_key`: `module_key`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_module_migration`: `module_key`, `migration_name`

---
### Table: `module_rollouts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `module_id` | `varchar(50)` | NO | `NULL` | MUL |  |
| `rollout_type` | `enum('user','role','team','percentage','all')` | NO | `NULL` |  |  |
| `targets` | `longtext` | YES | `NULL` |  |  |
| `percentage` | `int(11)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_module_rollouts_active`: `is_active`
- `INDEX` `idx_module_rollouts_module`: `module_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `module_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `module` | `varchar(50)` | NO | `NULL` |  |  |
| `setting_key` | `varchar(100)` | NO | `NULL` |  |  |
| `setting_value` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_module_settings_company`: `company_id`, `module`
- `INDEX` `idx_module_settings_workspace`: `workspace_id`, `module`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_module_setting`: `workspace_id`, `company_id`, `module`, `setting_key`

---
### Table: `module_user_access`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `module_id` | `varchar(50)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `has_access` | `tinyint(1)` | YES | `0` |  |  |
| `computed_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_module_user_access_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_module_user`: `module_id`, `user_id`

---
### Table: `modules`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `module_key` | `varchar(50)` | NO | `NULL` | UNI |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `icon` | `varchar(50)` | YES | `'Package'` |  |  |
| `is_core` | `tinyint(1)` | YES | `0` | MUL |  |
| `version` | `varchar(20)` | YES | `'1.0.0'` |  |  |
| `dependencies` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_is_core`: `is_core`
- `INDEX` `idx_module_key`: `module_key`
- `UNIQUE` `module_key`: `module_key`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `mt_api_keys`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `api_key` | `varchar(64)` | NO | `NULL` | UNI |  |
| `api_secret_hash` | `varchar(255)` | NO | `NULL` |  |  |
| `agency_id` | `int(11)` | YES | `NULL` | MUL |  |
| `subaccount_id` | `int(11)` | YES | `NULL` | MUL |  |
| `created_by` | `int(11)` | NO | `NULL` |  |  |
| `scopes` | `longtext` | YES | `NULL` |  |  |
| `rate_limit_per_minute` | `int(11)` | YES | `60` |  |  |
| `last_used_at` | `datetime` | YES | `NULL` |  |  |
| `request_count` | `bigint(20)` | YES | `0` |  |  |
| `status` | `enum('active','revoked')` | YES | `'active'` | MUL |  |
| `expires_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_apikey_agency`: `agency_id`
- `INDEX` `idx_apikey_status`: `status`
- `INDEX` `idx_apikey_subaccount`: `subaccount_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_api_key`: `api_key`

---
### Table: `mt_audit_log`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20)` | NO | `NULL` | PRI | auto_increment |
| `action` | `varchar(100)` | NO | `NULL` | MUL |  |
| `actor_id` | `int(11)` | YES | `NULL` | MUL |  |
| `agency_id` | `int(11)` | YES | `NULL` | MUL |  |
| `subaccount_id` | `int(11)` | YES | `NULL` | MUL |  |
| `details` | `longtext` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_audit_action`: `action`
- `INDEX` `idx_audit_actor`: `actor_id`
- `INDEX` `idx_audit_agency`: `agency_id`
- `INDEX` `idx_audit_created`: `created_at`
- `INDEX` `idx_audit_subaccount`: `subaccount_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `mt_permission_overrides`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `resource_type` | `enum('agency','subaccount','workspace')` | NO | `NULL` | MUL |  |
| `resource_id` | `int(11)` | NO | `NULL` |  |  |
| `permission_key` | `varchar(100)` | NO | `NULL` |  |  |
| `allowed` | `tinyint(1)` | NO | `1` |  |  |
| `granted_by` | `int(11)` | YES | `NULL` |  |  |
| `expires_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_override_resource`: `resource_type`, `resource_id`
- `INDEX` `idx_override_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_override`: `user_id`, `resource_type`, `resource_id`, `permission_key`

---
### Table: `mutual_action_plan_items`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `plan_id` | `int(11)` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `owner_type` | `enum('seller','buyer')` | NO | `'seller'` |  |  |
| `owner_name` | `varchar(255)` | YES | `NULL` |  |  |
| `due_date` | `date` | YES | `NULL` |  |  |
| `is_completed` | `tinyint(1)` | YES | `0` | MUL |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |
| `order_index` | `int(11)` | YES | `0` |  |  |

**Foreign Keys:**
- `plan_id` -> `mutual_action_plans.id` (Constraint: `mutual_action_plan_items_ibfk_1`)

**Indexes:**
- `INDEX` `idx_completed`: `is_completed`
- `INDEX` `idx_plan`: `plan_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `mutual_action_plans`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `lead_id` | `int(11)` | YES | `NULL` | MUL |  |
| `deal_room_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `target_close_date` | `date` | YES | `NULL` |  |  |
| `status` | `enum('draft','active','completed','cancelled')` | YES | `'draft'` | MUL |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_lead`: `lead_id`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `notification_actions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `notification_log_id` | `int(11)` | NO | `NULL` | MUL |  |
| `action_id` | `varchar(100)` | NO | `NULL` |  |  |
| `action_type` | `enum('view','complete','snooze','custom')` | NO | `NULL` |  |  |
| `response_data` | `longtext` | YES | `NULL` |  |  |
| `responded_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_notification_actions_log`: `notification_log_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `notification_configs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `provider` | `enum('slack','teams')` | NO | `NULL` | MUL |  |
| `channel_id` | `varchar(255)` | NO | `NULL` |  |  |
| `channel_name` | `varchar(255)` | YES | `NULL` |  |  |
| `webhook_url` | `text` | YES | `NULL` |  |  |
| `access_token` | `text` | YES | `NULL` |  |  |
| `triggers` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('active','inactive','error')` | YES | `'active'` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_notification_configs_provider`: `provider`
- `INDEX` `idx_notification_configs_status`: `status`
- `INDEX` `idx_notification_configs_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `notification_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `config_id` | `int(11)` | NO | `NULL` | MUL |  |
| `notification_type` | `varchar(50)` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | YES | `NULL` |  |  |
| `message` | `text` | YES | `NULL` |  |  |
| `actions` | `longtext` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('pending','sent','delivered','failed')` | YES | `'pending'` | MUL |  |
| `retry_count` | `int(11)` | YES | `0` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `sent_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_notification_logs_config`: `config_id`
- `INDEX` `idx_notification_logs_created`: `created_at`
- `INDEX` `idx_notification_logs_status`: `status`
- `INDEX` `idx_notification_logs_type`: `notification_type`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `notification_preferences`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` |  |  |
| `notification_type` | `varchar(50)` | NO | `NULL` |  |  |
| `in_app` | `tinyint(1)` | YES | `1` |  |  |
| `email` | `tinyint(1)` | YES | `1` |  |  |
| `sms` | `tinyint(1)` | YES | `0` |  |  |
| `push` | `tinyint(1)` | YES | `1` |  |  |
| `digest_mode` | `enum('instant','hourly','daily','weekly')` | YES | `'instant'` |  |  |
| `quiet_hours_start` | `time` | YES | `NULL` |  |  |
| `quiet_hours_end` | `time` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_prefs_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_user_workspace_type`: `user_id`, `workspace_id`, `notification_type`

---
### Table: `notification_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `type` | `varchar(50)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `title_template` | `varchar(255)` | NO | `NULL` |  |  |
| `body_template` | `text` | YES | `NULL` |  |  |
| `email_subject_template` | `varchar(255)` | YES | `NULL` |  |  |
| `email_body_template` | `text` | YES | `NULL` |  |  |
| `sms_template` | `varchar(500)` | YES | `NULL` |  |  |
| `default_in_app` | `tinyint(1)` | YES | `1` |  |  |
| `default_email` | `tinyint(1)` | YES | `0` |  |  |
| `default_sms` | `tinyint(1)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_templates_type`: `type`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_type`: `workspace_id`, `type`

---
### Table: `notifications`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `type` | `varchar(50)` | NO | `NULL` |  |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `body` | `text` | YES | `NULL` |  |  |
| `icon` | `varchar(50)` | YES | `NULL` |  |  |
| `entity_type` | `varchar(50)` | YES | `NULL` |  |  |
| `entity_id` | `int(11)` | YES | `NULL` |  |  |
| `action_url` | `varchar(500)` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `is_read` | `tinyint(1)` | YES | `0` | MUL |  |
| `read_at` | `timestamp` | YES | `NULL` |  |  |
| `is_archived` | `tinyint(1)` | YES | `0` |  |  |
| `email_sent` | `tinyint(1)` | YES | `0` |  |  |
| `email_sent_at` | `timestamp` | YES | `NULL` |  |  |
| `sms_sent` | `tinyint(1)` | YES | `0` |  |  |
| `sms_sent_at` | `timestamp` | YES | `NULL` |  |  |
| `push_sent` | `tinyint(1)` | YES | `0` |  |  |
| `push_sent_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_notifications_created`: `created_at`
- `INDEX` `idx_notifications_read`: `is_read`
- `INDEX` `idx_notifications_type`: `workspace_id`, `type`, `created_at`
- `INDEX` `idx_notifications_user`: `user_id`, `is_read`, `created_at`
- `INDEX` `idx_notifications_workspace`: `workspace_id`, `created_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `number_pools`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `source_type` | `enum('google_ads','google_organic','facebook','bing','direct','referral','custom')` | NO | `'custom'` | MUL |  |
| `custom_source` | `varchar(255)` | YES | `NULL` |  |  |
| `target_number` | `varchar(20)` | NO | `NULL` |  |  |
| `session_timeout_minutes` | `int(11)` | YES | `30` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `number_pools_ibfk_1`)
- `workspace_id` -> `workspaces.id` (Constraint: `number_pools_ibfk_2`)

**Indexes:**
- `INDEX` `idx_is_active`: `is_active`
- `INDEX` `idx_source_type`: `source_type`
- `INDEX` `idx_user_id`: `user_id`
- `INDEX` `idx_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `oauth_states`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `state` | `varchar(255)` | NO | `NULL` | MUL |  |
| `provider` | `varchar(50)` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_state`: `state`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `onboarding_checklists`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `workspace_id`: `workspace_id`

---
### Table: `onboarding_tasks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `checklist_id` | `int(11)` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `due_days_after_start` | `int(11)` | YES | `0` |  |  |
| `is_required` | `tinyint(1)` | YES | `1` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `checklist_id`: `checklist_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `onboarding_template_tasks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `template_id` | `int(11)` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `assigned_role` | `varchar(100)` | YES | `NULL` |  |  |
| `due_days` | `int(11)` | YES | `0` |  |  |
| `position` | `int(11)` | YES | `0` |  |  |
| `is_required` | `tinyint(1)` | YES | `1` |  |  |

**Indexes:**
- `INDEX` `idx_onboarding_task_template`: `template_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `onboarding_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `department` | `varchar(100)` | YES | `NULL` |  |  |
| `position_type` | `varchar(100)` | YES | `NULL` |  |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_onboarding_template_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `opportunities`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `1` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `contact_id` | `int(11)` | YES | `NULL` |  |  |
| `pipeline_id` | `int(11)` | NO | `NULL` | MUL |  |
| `stage_id` | `int(11)` | NO | `NULL` | MUL |  |
| `owner_user_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `value` | `decimal(15,2)` | YES | `0.00` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `status` | `enum('open','won','lost')` | YES | `'open'` |  |  |
| `expected_close_date` | `date` | YES | `NULL` |  |  |
| `actual_close_date` | `date` | YES | `NULL` |  |  |
| `lost_reason` | `varchar(500)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_opportunities_company`: `workspace_id`, `company_id`
- `INDEX` `idx_opportunities_pipeline`: `pipeline_id`
- `INDEX` `idx_opportunities_stage`: `stage_id`
- `INDEX` `idx_opportunities_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `order_items`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `order_id` | `int(11)` | NO | `NULL` | MUL |  |
| `product_id` | `int(11)` | YES | `NULL` | MUL |  |
| `product_name` | `varchar(255)` | NO | `NULL` |  |  |
| `product_type` | `varchar(50)` | YES | `NULL` |  |  |
| `quantity` | `int(11)` | NO | `NULL` |  |  |
| `unit_price` | `decimal(10,2)` | NO | `NULL` |  |  |
| `total_price` | `decimal(10,2)` | NO | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `order_id` -> `orders.id` (Constraint: `order_items_ibfk_1`)

**Indexes:**
- `INDEX` `idx_order`: `order_id`
- `INDEX` `idx_product`: `product_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `orders`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `checkout_form_id` | `int(11)` | YES | `NULL` |  |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `order_number` | `varchar(50)` | NO | `NULL` | UNI |  |
| `customer_email` | `varchar(255)` | NO | `NULL` |  |  |
| `customer_name` | `varchar(255)` | YES | `NULL` |  |  |
| `customer_phone` | `varchar(50)` | YES | `NULL` |  |  |
| `subtotal` | `decimal(10,2)` | NO | `NULL` |  |  |
| `tax_amount` | `decimal(10,2)` | YES | `0.00` |  |  |
| `shipping_amount` | `decimal(10,2)` | YES | `0.00` |  |  |
| `discount_amount` | `decimal(10,2)` | YES | `0.00` |  |  |
| `total` | `decimal(10,2)` | NO | `NULL` |  |  |
| `payment_status` | `enum('pending','paid','failed','refunded')` | YES | `'pending'` | MUL |  |
| `payment_method` | `varchar(50)` | YES | `NULL` |  |  |
| `payment_intent_id` | `varchar(255)` | YES | `NULL` |  |  |
| `shipping_address` | `longtext` | YES | `NULL` |  |  |
| `billing_address` | `longtext` | YES | `NULL` |  |  |
| `shipping_status` | `enum('pending','processing','shipped','delivered')` | YES | `'pending'` |  |  |
| `tracking_number` | `varchar(255)` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_company`: `company_id`
- `INDEX` `idx_contact`: `contact_id`
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_orders_workspace_status`: `workspace_id`, `payment_status`, `created_at`
- `INDEX` `idx_order_number`: `order_number`
- `INDEX` `idx_payment_status`: `payment_status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `order_number`: `order_number`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `outlook_calendar_tokens`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `email` | `varchar(255)` | NO | `NULL` |  |  |
| `access_token` | `text` | NO | `NULL` |  |  |
| `refresh_token` | `text` | YES | `NULL` |  |  |
| `token_type` | `varchar(50)` | YES | `'Bearer'` |  |  |
| `expires_at` | `datetime` | NO | `NULL` |  |  |
| `scope` | `text` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `last_used_at` | `datetime` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_outlook_tokens_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_outlook_token_user`: `workspace_id`, `user_id`

---
### Table: `page_components`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `category` | `varchar(50)` | NO | `NULL` | MUL |  |
| `component_data` | `longtext` | NO | `NULL` |  |  |
| `thumbnail_url` | `varchar(500)` | YES | `NULL` |  |  |
| `is_global` | `tinyint(1)` | YES | `0` |  |  |
| `usage_count` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_category`: `category`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `page_sections`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `page_id` | `int(11)` | NO | `NULL` | MUL |  |
| `section_type` | `varchar(50)` | NO | `NULL` |  |  |
| `section_data` | `longtext` | NO | `NULL` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `is_visible` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `page_id` -> `landing_pages.id` (Constraint: `page_sections_ibfk_1`)

**Indexes:**
- `INDEX` `idx_page`: `page_id`
- `INDEX` `idx_sort`: `page_id`, `sort_order`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `pay_periods`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `period_type` | `enum('weekly','bi-weekly','semi-monthly','monthly')` | NO | `NULL` |  |  |
| `period_start` | `date` | NO | `NULL` |  |  |
| `period_end` | `date` | NO | `NULL` |  |  |
| `pay_date` | `date` | NO | `NULL` |  |  |
| `status` | `enum('draft','processing','approved','paid','cancelled')` | YES | `'draft'` |  |  |
| `total_gross_pay` | `decimal(12,2)` | YES | `0.00` |  |  |
| `total_deductions` | `decimal(12,2)` | YES | `0.00` |  |  |
| `total_net_pay` | `decimal(12,2)` | YES | `0.00` |  |  |
| `total_employer_taxes` | `decimal(12,2)` | YES | `0.00` |  |  |
| `processed_by` | `int(11)` | YES | `NULL` |  |  |
| `processed_at` | `timestamp` | YES | `NULL` |  |  |
| `approved_by` | `int(11)` | YES | `NULL` |  |  |
| `approved_at` | `timestamp` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_pay_periods_status`: `workspace_id`, `status`
- `INDEX` `idx_pay_periods_workspace`: `workspace_id`, `period_start`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_period`: `workspace_id`, `period_start`, `period_end`

---
### Table: `payment_daily_summaries`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `summary_date` | `date` | NO | `NULL` | MUL |  |
| `total_volume` | `decimal(12,2)` | NO | `0.00` |  |  |
| `transaction_count` | `int(11)` | NO | `0` |  |  |
| `successful_count` | `int(11)` | NO | `0` |  |  |
| `failed_count` | `int(11)` | NO | `0` |  |  |
| `refunded_amount` | `decimal(12,2)` | NO | `0.00` |  |  |
| `avg_transaction` | `decimal(10,2)` | NO | `0.00` |  |  |
| `card_volume` | `decimal(12,2)` | NO | `0.00` |  |  |
| `cash_volume` | `decimal(12,2)` | NO | `0.00` |  |  |
| `check_volume` | `decimal(12,2)` | NO | `0.00` |  |  |
| `mobile_volume` | `decimal(12,2)` | NO | `0.00` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_pds_date`: `summary_date`
- `INDEX` `idx_pds_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_date`: `workspace_id`, `summary_date`

---
### Table: `payment_link_orders`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `payment_link_id` | `int(11)` | NO | `NULL` | MUL |  |
| `invoice_id` | `int(11)` | YES | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `customer_email` | `varchar(255)` | NO | `NULL` | MUL |  |
| `customer_name` | `varchar(255)` | YES | `NULL` |  |  |
| `amount` | `decimal(10,2)` | NO | `NULL` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `status` | `enum('pending','processing','completed','failed','refunded')` | YES | `'pending'` | MUL |  |
| `payment_intent_id` | `varchar(255)` | YES | `NULL` |  |  |
| `payment_method` | `varchar(50)` | YES | `NULL` |  |  |
| `shipping_address` | `longtext` | YES | `NULL` |  |  |
| `billing_address` | `longtext` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `paid_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `payment_link_id` -> `payment_links.id` (Constraint: `payment_link_orders_ibfk_1`)
- `invoice_id` -> `invoices.id` (Constraint: `payment_link_orders_ibfk_2`)
- `contact_id` -> `contacts.id` (Constraint: `payment_link_orders_ibfk_3`)

**Indexes:**
- `INDEX` `contact_id`: `contact_id`
- `INDEX` `idx_customer_email`: `customer_email`
- `INDEX` `idx_link`: `payment_link_id`
- `INDEX` `idx_status`: `status`
- `INDEX` `invoice_id`: `invoice_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `payment_links`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `amount` | `decimal(10,2)` | YES | `NULL` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `allow_custom_amount` | `tinyint(1)` | YES | `0` |  |  |
| `min_amount` | `decimal(10,2)` | YES | `NULL` |  |  |
| `max_amount` | `decimal(10,2)` | YES | `NULL` |  |  |
| `product_id` | `int(11)` | YES | `NULL` |  |  |
| `service_id` | `int(11)` | YES | `NULL` |  |  |
| `url_slug` | `varchar(50)` | NO | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `expires_at` | `timestamp` | YES | `NULL` |  |  |
| `max_uses` | `int(11)` | YES | `NULL` |  |  |
| `use_count` | `int(11)` | YES | `0` |  |  |
| `success_url` | `varchar(500)` | YES | `NULL` |  |  |
| `cancel_url` | `varchar(500)` | YES | `NULL` |  |  |
| `stripe_payment_link_id` | `varchar(255)` | YES | `NULL` |  |  |
| `stripe_price_id` | `varchar(255)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_payment_links_workspace`: `workspace_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_slug`: `workspace_id`, `url_slug`

---
### Table: `payment_methods`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `stripe_payment_method_id` | `varchar(255)` | NO | `NULL` | MUL |  |
| `stripe_customer_id` | `varchar(255)` | NO | `NULL` |  |  |
| `type` | `enum('card','bank_account','us_bank_account','sepa_debit')` | YES | `'card'` |  |  |
| `brand` | `varchar(20)` | YES | `NULL` |  |  |
| `last4` | `varchar(4)` | YES | `NULL` |  |  |
| `exp_month` | `int(11)` | YES | `NULL` |  |  |
| `exp_year` | `int(11)` | YES | `NULL` |  |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_payment_methods_contact`: `contact_id`
- `INDEX` `idx_payment_methods_stripe`: `stripe_payment_method_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `payment_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | UNI |  |
| `stripe_account_id` | `varchar(255)` | YES | `NULL` |  |  |
| `stripe_publishable_key` | `varchar(255)` | YES | `NULL` |  |  |
| `stripe_secret_key_encrypted` | `text` | YES | `NULL` |  |  |
| `stripe_webhook_secret_encrypted` | `text` | YES | `NULL` |  |  |
| `paypal_client_id` | `varchar(255)` | YES | `NULL` |  |  |
| `paypal_secret_encrypted` | `text` | YES | `NULL` |  |  |
| `default_currency` | `varchar(3)` | NO | `'USD'` |  |  |
| `default_tax_rate` | `decimal(5,2)` | NO | `0.00` |  |  |
| `invoice_prefix` | `varchar(10)` | NO | `'INV-'` |  |  |
| `invoice_footer` | `text` | YES | `NULL` |  |  |
| `payment_terms` | `text` | YES | `NULL` |  |  |
| `auto_send_receipts` | `tinyint(1)` | NO | `1` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `user_id`: `user_id`

---
### Table: `payment_terminals`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `terminal_name` | `varchar(255)` | NO | `NULL` |  |  |
| `terminal_id` | `varchar(100)` | NO | `NULL` | MUL |  |
| `provider` | `enum('stripe','square','clover','custom','manual')` | NO | `'stripe'` | MUL |  |
| `status` | `enum('active','inactive','maintenance')` | NO | `'active'` | MUL |  |
| `location` | `varchar(255)` | YES | `NULL` |  |  |
| `device_type` | `varchar(100)` | YES | `NULL` |  |  |
| `serial_number` | `varchar(100)` | YES | `NULL` |  |  |
| `api_key_encrypted` | `text` | YES | `NULL` |  |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `last_heartbeat_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_pterm_provider`: `provider`
- `INDEX` `idx_pterm_status`: `status`
- `INDEX` `idx_pterm_terminal_id`: `terminal_id`
- `INDEX` `idx_pterm_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_terminal`: `workspace_id`, `terminal_id`

---
### Table: `payment_transactions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `invoice_id` | `int(11)` | NO | `NULL` | MUL |  |
| `amount` | `decimal(10,2)` | NO | `NULL` |  |  |
| `payment_method` | `varchar(50)` | YES | `'manual'` |  |  |
| `payment_type` | `enum('full','partial','deposit','tip')` | YES | `'partial'` |  |  |
| `transaction_id` | `varchar(255)` | YES | `NULL` |  |  |
| `gateway` | `varchar(50)` | YES | `NULL` |  |  |
| `status` | `enum('pending','completed','failed','refunded')` | YES | `'completed'` | MUL |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |

**Foreign Keys:**
- `invoice_id` -> `invoices.id` (Constraint: `payment_transactions_ibfk_1`)

**Indexes:**
- `INDEX` `idx_company`: `company_id`
- `INDEX` `idx_invoice`: `invoice_id`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `payments`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `invoice_id` | `int(11)` | YES | `NULL` | MUL |  |
| `appointment_id` | `int(11)` | YES | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `amount` | `decimal(10,2)` | NO | `NULL` |  |  |
| `currency` | `varchar(3)` | NO | `'USD'` |  |  |
| `payment_method` | `enum('stripe','paypal','bank_transfer','cash','check','other')` | NO | `'stripe'` |  |  |
| `status` | `enum('pending','completed','failed','refunded','partially_refunded')` | NO | `'pending'` | MUL |  |
| `stripe_payment_intent_id` | `varchar(255)` | YES | `NULL` |  |  |
| `stripe_charge_id` | `varchar(255)` | YES | `NULL` |  |  |
| `paypal_order_id` | `varchar(255)` | YES | `NULL` | MUL |  |
| `paypal_capture_id` | `varchar(255)` | YES | `NULL` |  |  |
| `transaction_id` | `varchar(255)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `paid_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Indexes:**
- `INDEX` `idx_appointment_id`: `appointment_id`
- `INDEX` `idx_payments_contact`: `contact_id`
- `INDEX` `idx_payments_invoice`: `invoice_id`
- `INDEX` `idx_payments_paypal`: `paypal_order_id`
- `INDEX` `idx_payments_status`: `status`
- `INDEX` `idx_payments_user`: `user_id`
- `INDEX` `idx_payments_workspace`: `workspace_id`
- `INDEX` `idx_payments_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `paypal_accounts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | UNI |  |
| `client_id_encrypted` | `text` | YES | `NULL` |  |  |
| `client_secret_encrypted` | `text` | YES | `NULL` |  |  |
| `mode` | `enum('sandbox','live')` | YES | `'sandbox'` |  |  |
| `merchant_id` | `varchar(255)` | YES | `NULL` |  |  |
| `email` | `varchar(255)` | YES | `NULL` |  |  |
| `status` | `enum('pending','connected','error','disabled')` | YES | `'pending'` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `webhook_id` | `varchar(255)` | YES | `NULL` |  |  |
| `connected_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace`: `workspace_id`

---
### Table: `paypal_orders`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `invoice_id` | `int(11)` | YES | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` |  |  |
| `paypal_order_id` | `varchar(255)` | NO | `NULL` | UNI |  |
| `amount` | `decimal(10,2)` | NO | `NULL` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `status` | `enum('created','approved','completed','cancelled','failed')` | YES | `'created'` |  |  |
| `payer_id` | `varchar(255)` | YES | `NULL` |  |  |
| `payer_email` | `varchar(255)` | YES | `NULL` |  |  |
| `payer_name` | `varchar(255)` | YES | `NULL` |  |  |
| `capture_id` | `varchar(255)` | YES | `NULL` |  |  |
| `captured_at` | `timestamp` | YES | `NULL` |  |  |
| `approval_url` | `varchar(1000)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_paypal_orders_invoice`: `invoice_id`
- `INDEX` `idx_paypal_orders_workspace`: `workspace_id`, `status`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_paypal_order`: `paypal_order_id`

---
### Table: `paypal_webhook_events`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | YES | `NULL` |  |  |
| `event_id` | `varchar(255)` | NO | `NULL` | UNI |  |
| `event_type` | `varchar(100)` | NO | `NULL` | MUL |  |
| `resource_type` | `varchar(50)` | YES | `NULL` |  |  |
| `resource_id` | `varchar(255)` | YES | `NULL` |  |  |
| `payload` | `longtext` | NO | `NULL` |  |  |
| `status` | `enum('received','processing','processed','failed','ignored')` | YES | `'received'` | MUL |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `processed_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_paypal_events_status`: `status`, `created_at`
- `INDEX` `idx_paypal_events_type`: `event_type`, `created_at`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_event_id`: `event_id`

---
### Table: `payroll_adjustments`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `pay_period_id` | `int(11)` | YES | `NULL` | MUL |  |
| `adjustment_type` | `enum('bonus','commission','reimbursement','correction','other')` | NO | `NULL` |  |  |
| `description` | `varchar(255)` | NO | `NULL` |  |  |
| `amount` | `decimal(10,2)` | NO | `NULL` |  |  |
| `is_taxable` | `tinyint(1)` | YES | `1` |  |  |
| `status` | `enum('pending','approved','paid','cancelled')` | YES | `'pending'` |  |  |
| `approved_by` | `int(11)` | YES | `NULL` |  |  |
| `approved_at` | `timestamp` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_payroll_adjustments_period`: `pay_period_id`
- `INDEX` `idx_payroll_adjustments_status`: `workspace_id`, `status`
- `INDEX` `idx_payroll_adjustments_workspace`: `workspace_id`, `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `payroll_deductions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `deduction_name` | `varchar(255)` | NO | `NULL` |  |  |
| `deduction_type` | `enum('pre-tax','post-tax','employer-paid')` | YES | `'post-tax'` |  |  |
| `calculation_type` | `enum('fixed','percentage')` | YES | `'fixed'` |  |  |
| `fixed_amount` | `decimal(10,2)` | YES | `NULL` |  |  |
| `percentage` | `decimal(5,2)` | YES | `NULL` |  |  |
| `frequency` | `enum('per-paycheck','monthly','quarterly','annual','one-time')` | YES | `'per-paycheck'` |  |  |
| `annual_limit` | `decimal(10,2)` | YES | `NULL` |  |  |
| `ytd_amount` | `decimal(10,2)` | YES | `0.00` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `start_date` | `date` | NO | `NULL` |  |  |
| `end_date` | `date` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_payroll_deductions_active`: `workspace_id`, `is_active`
- `INDEX` `idx_payroll_deductions_workspace`: `workspace_id`, `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `payroll_history`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `payroll_record_id` | `int(11)` | NO | `NULL` | MUL |  |
| `changed_by` | `int(11)` | NO | `NULL` |  |  |
| `change_type` | `enum('created','updated','approved','paid','cancelled')` | NO | `NULL` |  |  |
| `field_name` | `varchar(100)` | YES | `NULL` |  |  |
| `old_value` | `text` | YES | `NULL` |  |  |
| `new_value` | `text` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_payroll_history_record`: `payroll_record_id`
- `INDEX` `idx_payroll_history_workspace`: `workspace_id`, `created_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `payroll_records`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `pay_period_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `regular_hours` | `decimal(10,2)` | YES | `0.00` |  |  |
| `overtime_hours` | `decimal(10,2)` | YES | `0.00` |  |  |
| `double_time_hours` | `decimal(10,2)` | YES | `0.00` |  |  |
| `pto_hours` | `decimal(10,2)` | YES | `0.00` |  |  |
| `sick_hours` | `decimal(10,2)` | YES | `0.00` |  |  |
| `holiday_hours` | `decimal(10,2)` | YES | `0.00` |  |  |
| `regular_rate` | `decimal(10,2)` | NO | `NULL` |  |  |
| `overtime_rate` | `decimal(10,2)` | YES | `NULL` |  |  |
| `double_time_rate` | `decimal(10,2)` | YES | `NULL` |  |  |
| `regular_pay` | `decimal(10,2)` | YES | `0.00` |  |  |
| `overtime_pay` | `decimal(10,2)` | YES | `0.00` |  |  |
| `double_time_pay` | `decimal(10,2)` | YES | `0.00` |  |  |
| `pto_pay` | `decimal(10,2)` | YES | `0.00` |  |  |
| `sick_pay` | `decimal(10,2)` | YES | `0.00` |  |  |
| `holiday_pay` | `decimal(10,2)` | YES | `0.00` |  |  |
| `bonus` | `decimal(10,2)` | YES | `0.00` |  |  |
| `commission` | `decimal(10,2)` | YES | `0.00` |  |  |
| `reimbursements` | `decimal(10,2)` | YES | `0.00` |  |  |
| `gross_pay` | `decimal(10,2)` | YES | `0.00` |  |  |
| `federal_tax` | `decimal(10,2)` | YES | `0.00` |  |  |
| `state_tax` | `decimal(10,2)` | YES | `0.00` |  |  |
| `social_security` | `decimal(10,2)` | YES | `0.00` |  |  |
| `medicare` | `decimal(10,2)` | YES | `0.00` |  |  |
| `health_insurance` | `decimal(10,2)` | YES | `0.00` |  |  |
| `dental_insurance` | `decimal(10,2)` | YES | `0.00` |  |  |
| `vision_insurance` | `decimal(10,2)` | YES | `0.00` |  |  |
| `retirement_401k` | `decimal(10,2)` | YES | `0.00` |  |  |
| `other_deductions` | `decimal(10,2)` | YES | `0.00` |  |  |
| `total_deductions` | `decimal(10,2)` | YES | `0.00` |  |  |
| `net_pay` | `decimal(10,2)` | YES | `0.00` |  |  |
| `employer_social_security` | `decimal(10,2)` | YES | `0.00` |  |  |
| `employer_medicare` | `decimal(10,2)` | YES | `0.00` |  |  |
| `employer_unemployment` | `decimal(10,2)` | YES | `0.00` |  |  |
| `employer_workers_comp` | `decimal(10,2)` | YES | `0.00` |  |  |
| `total_employer_taxes` | `decimal(10,2)` | YES | `0.00` |  |  |
| `payment_method` | `enum('direct_deposit','check','cash','paycard')` | YES | `'direct_deposit'` |  |  |
| `payment_status` | `enum('pending','processing','paid','failed','cancelled')` | YES | `'pending'` |  |  |
| `payment_date` | `date` | YES | `NULL` |  |  |
| `payment_reference` | `varchar(255)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_payroll_records_status`: `workspace_id`, `payment_status`
- `INDEX` `idx_payroll_records_workspace`: `workspace_id`, `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_period_user`: `pay_period_id`, `user_id`

---
### Table: `payroll_tax_brackets`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `tax_type` | `enum('federal','state')` | NO | `NULL` |  |  |
| `min_income` | `decimal(15,2)` | NO | `NULL` |  |  |
| `max_income` | `decimal(15,2)` | YES | `NULL` |  |  |
| `rate` | `decimal(5,4)` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `workspace_id`: `workspace_id`, `tax_type`

---
### Table: `payroll_tax_rates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `tax_type` | `enum('federal','state','local','social_security','medicare','unemployment')` | NO | `NULL` |  |  |
| `jurisdiction` | `varchar(100)` | YES | `NULL` |  |  |
| `employee_rate` | `decimal(6,4)` | YES | `NULL` |  |  |
| `employer_rate` | `decimal(6,4)` | YES | `NULL` |  |  |
| `wage_base_limit` | `decimal(12,2)` | YES | `NULL` |  |  |
| `effective_date` | `date` | NO | `NULL` |  |  |
| `end_date` | `date` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_payroll_tax_rates_effective`: `workspace_id`, `effective_date`
- `INDEX` `idx_payroll_tax_rates_workspace`: `workspace_id`, `tax_type`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `performance_reviews`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `reviewer_id` | `int(11)` | NO | `NULL` |  |  |
| `review_date` | `date` | NO | `NULL` |  |  |
| `period_start` | `date` | NO | `NULL` |  |  |
| `period_end` | `date` | NO | `NULL` |  |  |
| `rating` | `int(11)` | YES | `NULL` |  |  |
| `summary` | `text` | YES | `NULL` |  |  |
| `strengths` | `text` | YES | `NULL` |  |  |
| `areas_for_improvement` | `text` | YES | `NULL` |  |  |
| `goals` | `text` | YES | `NULL` |  |  |
| `status` | `enum('draft','submitted','acknowledged')` | YES | `'draft'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `workspace_id`: `workspace_id`, `user_id`

---
### Table: `permissions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `key` | `varchar(100)` | NO | `NULL` | UNI |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `category` | `varchar(100)` | NO | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_permissions_category`: `category`
- `INDEX` `idx_permissions_key`: `key`
- `UNIQUE` `key`: `key`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `phone_call_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `phone_number_id` | `int(11)` | YES | `NULL` | MUL |  |
| `call_flow_id` | `int(11)` | YES | `NULL` | MUL |  |
| `visitor_session_id` | `int(11)` | YES | `NULL` | MUL |  |
| `attribution_source` | `varchar(255)` | YES | `NULL` | MUL |  |
| `attribution_medium` | `varchar(255)` | YES | `NULL` |  |  |
| `attribution_campaign` | `varchar(255)` | YES | `NULL` |  |  |
| `attribution_keyword` | `varchar(255)` | YES | `NULL` |  |  |
| `gclid` | `varchar(255)` | YES | `NULL` |  |  |
| `call_sid` | `varchar(255)` | YES | `NULL` |  |  |
| `direction` | `enum('inbound','outbound')` | NO | `NULL` |  |  |
| `from_number` | `varchar(50)` | NO | `NULL` |  |  |
| `to_number` | `varchar(50)` | NO | `NULL` |  |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `status` | `enum('queued','ringing','in_progress','completed','busy','failed','no_answer','cancelled')` | NO | `NULL` |  |  |
| `duration_seconds` | `int(11)` | NO | `0` |  |  |
| `recording_url` | `varchar(500)` | YES | `NULL` |  |  |
| `recording_duration` | `int(11)` | YES | `NULL` |  |  |
| `answered_by` | `enum('human','machine','unknown')` | YES | `NULL` |  |  |
| `cost` | `decimal(10,4)` | YES | `NULL` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `started_at` | `datetime` | NO | `NULL` | MUL |  |
| `answered_at` | `datetime` | YES | `NULL` |  |  |
| `ended_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `tracking_campaign` | `varchar(255)` | YES | `NULL` |  |  |
| `recording_sid` | `varchar(100)` | YES | `NULL` |  |  |

**Foreign Keys:**
- `call_flow_id` -> `call_flows.id` (Constraint: `phone_call_logs_ibfk_1`)
- `visitor_session_id` -> `visitor_sessions.id` (Constraint: `phone_call_logs_ibfk_2`)

**Indexes:**
- `INDEX` `idx_attribution_source`: `attribution_source`
- `INDEX` `idx_call_flow_id`: `call_flow_id`
- `INDEX` `idx_call_logs_contact`: `contact_id`
- `INDEX` `idx_call_logs_phone`: `phone_number_id`
- `INDEX` `idx_call_logs_started`: `started_at`
- `INDEX` `idx_call_logs_user`: `user_id`
- `INDEX` `idx_visitor_session`: `visitor_session_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `phone_numbers`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `phone_number` | `varchar(20)` | NO | `NULL` | UNI |  |
| `friendly_name` | `varchar(255)` | YES | `NULL` |  |  |
| `provider` | `enum('twilio','signalwire','vonage','other')` | NO | `'twilio'` |  |  |
| `provider_sid` | `varchar(255)` | YES | `NULL` |  |  |
| `country_code` | `varchar(5)` | NO | `'US'` |  |  |
| `capabilities` | `longtext` | YES | `NULL` |  |  |
| `type` | `enum('local','toll_free','mobile')` | NO | `'local'` |  |  |
| `status` | `enum('active','suspended','released','pending')` | NO | `'active'` | MUL |  |
| `monthly_cost` | `decimal(10,2)` | YES | `NULL` |  |  |
| `assigned_to_user_id` | `int(11)` | YES | `NULL` |  |  |
| `is_primary` | `tinyint(1)` | NO | `0` |  |  |
| `voice_enabled` | `tinyint(1)` | NO | `1` |  |  |
| `sms_enabled` | `tinyint(1)` | NO | `1` |  |  |
| `purchased_at` | `datetime` | YES | `NULL` |  |  |
| `released_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `forwarding_number` | `varchar(20)` | YES | `NULL` |  |  |
| `pass_call_id` | `tinyint(1)` | YES | `0` |  |  |
| `whisper_message` | `text` | YES | `NULL` |  |  |
| `call_recording` | `tinyint(1)` | YES | `0` |  |  |
| `tracking_campaign` | `varchar(255)` | YES | `NULL` |  |  |
| `destination_type` | `varchar(20)` | YES | `'forward'` |  |  |
| `voicemail_greeting` | `text` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_phone_numbers_number`: `phone_number`
- `INDEX` `idx_phone_numbers_status`: `status`
- `INDEX` `idx_phone_numbers_user`: `user_id`
- `INDEX` `idx_phone_numbers_workspace`: `workspace_id`
- `INDEX` `idx_phone_numbers_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_phone_number`: `phone_number`

---
### Table: `phone_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | UNI |  |
| `provider` | `enum('twilio','signalwire','vonage')` | NO | `'twilio'` |  |  |
| `twilio_account_sid` | `varchar(255)` | YES | `NULL` |  |  |
| `twilio_auth_token_encrypted` | `text` | YES | `NULL` |  |  |
| `signalwire_space_url` | `varchar(255)` | YES | `NULL` |  |  |
| `signalwire_project_id` | `varchar(255)` | YES | `NULL` |  |  |
| `signalwire_api_token_encrypted` | `text` | YES | `NULL` |  |  |
| `default_caller_id` | `varchar(50)` | YES | `NULL` |  |  |
| `voicemail_enabled` | `tinyint(1)` | NO | `1` |  |  |
| `voicemail_greeting_url` | `varchar(500)` | YES | `NULL` |  |  |
| `voicemail_transcription` | `tinyint(1)` | NO | `1` |  |  |
| `call_recording_enabled` | `tinyint(1)` | NO | `0` |  |  |
| `call_recording_consent_message` | `text` | YES | `NULL` |  |  |
| `business_hours_enabled` | `tinyint(1)` | NO | `0` |  |  |
| `after_hours_action` | `enum('voicemail','forward','message')` | NO | `'voicemail'` |  |  |
| `after_hours_forward_to` | `varchar(50)` | YES | `NULL` |  |  |
| `after_hours_message` | `text` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `user_id`: `user_id`

---
### Table: `phone_sms_conversations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `phone_number_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_number` | `varchar(50)` | NO | `NULL` |  |  |
| `contact_id` | `int(11)` | YES | `NULL` |  |  |
| `last_message_at` | `datetime` | NO | `NULL` |  |  |
| `last_message_preview` | `varchar(255)` | YES | `NULL` |  |  |
| `unread_count` | `int(11)` | NO | `0` |  |  |
| `status` | `enum('active','archived')` | NO | `'active'` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_sms_conv_phone`: `phone_number_id`
- `INDEX` `idx_sms_conv_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_conversation`: `phone_number_id`, `contact_number`

---
### Table: `phone_sms_messages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `conversation_id` | `int(11)` | NO | `NULL` | MUL |  |
| `direction` | `enum('inbound','outbound')` | NO | `NULL` |  |  |
| `message_sid` | `varchar(255)` | YES | `NULL` |  |  |
| `from_number` | `varchar(50)` | NO | `NULL` |  |  |
| `to_number` | `varchar(50)` | NO | `NULL` |  |  |
| `body` | `text` | NO | `NULL` |  |  |
| `media_urls` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('queued','sent','delivered','failed','received')` | NO | `'queued'` |  |  |
| `error_code` | `varchar(50)` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `cost` | `decimal(10,4)` | YES | `NULL` |  |  |
| `sent_at` | `datetime` | YES | `NULL` |  |  |
| `delivered_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_sms_messages_conv`: `conversation_id`
- `INDEX` `idx_sms_messages_created`: `created_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `pipeline_stages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `pipeline_id` | `int(11)` | NO | `1` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `stage_order` | `int(11)` | NO | `0` | MUL |  |
| `probability` | `int(11)` | YES | `0` |  |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `color` | `varchar(7)` | YES | `'#007bff'` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `is_won` | `tinyint(1)` | YES | `0` |  |  |
| `is_lost` | `tinyint(1)` | YES | `0` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `workspace_id` | `int(11)` | YES | `1` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_pipeline_stages_workspace`: `workspace_id`
- `INDEX` `idx_stages_order`: `pipeline_id`, `sort_order`
- `INDEX` `idx_stages_pipeline`: `pipeline_id`
- `INDEX` `idx_stage_order`: `stage_order`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `pipelines`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `1` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_pipelines_company`: `workspace_id`, `company_id`
- `INDEX` `idx_pipelines_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `playbook_resources`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `playbook_id` | `int(11)` | NO | `NULL` | MUL |  |
| `section_id` | `int(11)` | YES | `NULL` |  |  |
| `resource_type` | `enum('content','template','automation','link')` | NO | `NULL` |  |  |
| `resource_id` | `int(11)` | YES | `NULL` |  |  |
| `resource_url` | `varchar(500)` | YES | `NULL` |  |  |
| `title` | `varchar(255)` | YES | `NULL` |  |  |

**Foreign Keys:**
- `playbook_id` -> `sales_playbooks.id` (Constraint: `playbook_resources_ibfk_1`)

**Indexes:**
- `INDEX` `idx_playbook`: `playbook_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `playbook_sections`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `playbook_id` | `int(11)` | NO | `NULL` | MUL |  |
| `section_type` | `enum('overview','process','discovery','objections','scripts','resources','metrics','custom')` | NO | `'custom'` |  |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `content` | `text` | YES | `NULL` |  |  |
| `order_index` | `int(11)` | YES | `0` | MUL |  |

**Foreign Keys:**
- `playbook_id` -> `sales_playbooks.id` (Constraint: `playbook_sections_ibfk_1`)

**Indexes:**
- `INDEX` `idx_order`: `order_index`
- `INDEX` `idx_playbook`: `playbook_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `playbook_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `industry_type_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `category` | `enum('lead_nurture','appointment_reminder','review_request','recall','win_back','referral','onboarding','follow_up')` | NO | `NULL` |  |  |
| `template_type` | `enum('automation','campaign','landing_page','form','email_sequence','sms_sequence')` | NO | `NULL` |  |  |
| `template_data` | `longtext` | NO | `NULL` |  |  |
| `is_featured` | `tinyint(1)` | YES | `0` |  |  |
| `usage_count` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `playbook_versions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `playbook_id` | `int(11)` | NO | `NULL` | MUL |  |
| `version` | `int(11)` | NO | `NULL` | MUL |  |
| `content` | `longtext` | NO | `NULL` |  |  |
| `change_summary` | `varchar(500)` | YES | `NULL` |  |  |
| `edited_by` | `int(11)` | NO | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `edited_by`: `edited_by`
- `INDEX` `idx_playbook_versions_playbook`: `playbook_id`
- `INDEX` `idx_playbook_versions_version`: `version`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `playbooks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `persona` | `varchar(100)` | YES | `NULL` | MUL |  |
| `templates` | `longtext` | NO | `NULL` |  |  |
| `permissions` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('active','archived')` | YES | `'active'` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_playbooks_persona`: `persona`
- `INDEX` `idx_playbooks_status`: `status`
- `INDEX` `idx_playbooks_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `pool_numbers`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `pool_id` | `int(11)` | NO | `NULL` | MUL |  |
| `phone_number_id` | `int(11)` | NO | `NULL` | MUL |  |
| `is_available` | `tinyint(1)` | YES | `1` | MUL |  |
| `last_assigned_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `pool_id` -> `number_pools.id` (Constraint: `pool_numbers_ibfk_1`)
- `phone_number_id` -> `phone_numbers.id` (Constraint: `pool_numbers_ibfk_2`)

**Indexes:**
- `INDEX` `idx_is_available`: `is_available`
- `INDEX` `idx_phone_number_id`: `phone_number_id`
- `INDEX` `idx_pool_id`: `pool_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_pool_number`: `pool_id`, `phone_number_id`

---
### Table: `portal_activity_log`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `activity_type` | `enum('login','view_invoice','pay_invoice','view_proposal','approve_proposal','view_document','send_message')` | NO | `NULL` | MUL |  |
| `entity_type` | `varchar(50)` | YES | `NULL` |  |  |
| `entity_id` | `int(11)` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_activity_type`: `activity_type`
- `INDEX` `idx_contact`: `contact_id`
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `portal_branding`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | UNI |  |
| `logo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `favicon_url` | `varchar(500)` | YES | `NULL` |  |  |
| `primary_color` | `varchar(7)` | YES | `'#3b82f6'` |  |  |
| `secondary_color` | `varchar(7)` | YES | `'#1e40af'` |  |  |
| `company_name` | `varchar(255)` | YES | `NULL` |  |  |
| `support_email` | `varchar(255)` | YES | `NULL` |  |  |
| `support_phone` | `varchar(50)` | YES | `NULL` |  |  |
| `custom_css` | `text` | YES | `NULL` |  |  |
| `custom_domain` | `varchar(255)` | YES | `NULL` |  |  |
| `show_powered_by` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `workspace_id`: `workspace_id`

---
### Table: `portal_documents`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `document_type` | `enum('contract','invoice','proposal','report','other')` | YES | `'other'` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `file_url` | `varchar(500)` | NO | `NULL` |  |  |
| `file_name` | `varchar(255)` | NO | `NULL` |  |  |
| `file_size` | `int(11)` | YES | `NULL` |  |  |
| `file_type` | `varchar(50)` | YES | `NULL` |  |  |
| `requires_signature` | `tinyint(1)` | YES | `0` |  |  |
| `signature_status` | `enum('pending','signed','declined')` | YES | `NULL` | MUL |  |
| `signed_at` | `timestamp` | YES | `NULL` |  |  |
| `signature_data` | `longtext` | YES | `NULL` |  |  |
| `is_visible_to_client` | `tinyint(1)` | YES | `1` |  |  |
| `expires_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_company`: `company_id`
- `INDEX` `idx_contact`: `contact_id`
- `INDEX` `idx_portal_docs_contact`: `contact_id`, `is_visible_to_client`
- `INDEX` `idx_signature_status`: `signature_status`
- `INDEX` `idx_type`: `document_type`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `portal_identities`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` |  |  |
| `email` | `varchar(255)` | YES | `NULL` | MUL |  |
| `phone` | `varchar(20)` | YES | `NULL` | MUL |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `email_verified` | `tinyint(1)` | YES | `0` |  |  |
| `phone_verified` | `tinyint(1)` | YES | `0` |  |  |
| `preferred_auth_method` | `enum('email','sms')` | YES | `'email'` |  |  |
| `timezone` | `varchar(50)` | YES | `NULL` |  |  |
| `locale` | `varchar(10)` | YES | `'en'` |  |  |
| `last_login_at` | `timestamp` | YES | `NULL` |  |  |
| `last_login_ip` | `varchar(45)` | YES | `NULL` |  |  |
| `login_count` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_portal_company`: `company_id`
- `INDEX` `idx_portal_email`: `email`
- `INDEX` `idx_portal_phone`: `phone`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_contact`: `workspace_id`, `contact_id`

---
### Table: `portal_login_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `portal_identity_id` | `int(11)` | YES | `NULL` | MUL |  |
| `auth_method` | `enum('magic_link','otp')` | NO | `NULL` |  |  |
| `identifier` | `varchar(255)` | NO | `NULL` |  |  |
| `success` | `tinyint(1)` | NO | `NULL` |  |  |
| `failure_reason` | `varchar(100)` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` | MUL |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_login_logs_identity`: `portal_identity_id`, `created_at`
- `INDEX` `idx_login_logs_ip`: `ip_address`, `created_at`
- `INDEX` `idx_login_logs_workspace`: `workspace_id`, `created_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `portal_magic_links`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |
| `email` | `varchar(255)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` |  |  |
| `token_hash` | `varchar(64)` | NO | `NULL` | UNI |  |
| `expires_at` | `timestamp` | NO | `current_timestamp()` | MUL | on update current_timestamp() |
| `used_at` | `timestamp` | YES | `NULL` |  |  |
| `used_ip` | `varchar(45)` | YES | `NULL` |  |  |
| `redirect_url` | `varchar(500)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_magic_email`: `email`, `expires_at`
- `INDEX` `idx_magic_expires`: `expires_at`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_token`: `token_hash`

---
### Table: `portal_messages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `thread_id` | `varchar(64)` | YES | `NULL` | MUL |  |
| `direction` | `enum('inbound','outbound')` | NO | `NULL` |  |  |
| `sender_type` | `enum('client','staff')` | NO | `NULL` |  |  |
| `sender_id` | `int(11)` | YES | `NULL` |  |  |
| `subject` | `varchar(255)` | YES | `NULL` |  |  |
| `message` | `text` | NO | `NULL` |  |  |
| `attachments` | `longtext` | YES | `NULL` |  |  |
| `is_read` | `tinyint(1)` | YES | `0` |  |  |
| `read_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_company`: `company_id`
- `INDEX` `idx_contact`: `contact_id`
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_portal_messages_thread`: `thread_id`, `created_at`
- `INDEX` `idx_thread`: `thread_id`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `portal_otps`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |
| `phone` | `varchar(20)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` |  |  |
| `code_hash` | `varchar(64)` | NO | `NULL` |  |  |
| `expires_at` | `timestamp` | NO | `current_timestamp()` | MUL | on update current_timestamp() |
| `used_at` | `timestamp` | YES | `NULL` |  |  |
| `attempts` | `int(11)` | YES | `0` |  |  |
| `max_attempts` | `int(11)` | YES | `5` |  |  |
| `locked_until` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_otp_expires`: `expires_at`
- `INDEX` `idx_otp_phone`: `phone`, `expires_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `portal_sessions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `portal_identity_id` | `int(11)` | NO | `NULL` | MUL |  |
| `token_hash` | `varchar(64)` | NO | `NULL` | UNI |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `device_type` | `varchar(20)` | YES | `NULL` |  |  |
| `expires_at` | `timestamp` | NO | `current_timestamp()` | MUL | on update current_timestamp() |
| `last_activity_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `revoked_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `portal_identity_id` -> `portal_identities.id` (Constraint: `portal_sessions_ibfk_1`)

**Indexes:**
- `INDEX` `idx_sessions_expires`: `expires_at`
- `INDEX` `idx_sessions_identity`: `portal_identity_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_token`: `token_hash`

---
### Table: `pro_preferences`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `min_budget` | `decimal(10,2)` | YES | `0.00` |  |  |
| `max_budget` | `decimal(10,2)` | YES | `NULL` |  |  |
| `max_radius_km` | `decimal(6,2)` | YES | `25.00` |  |  |
| `max_leads_per_day` | `int(11)` | YES | `10` |  |  |
| `max_leads_per_week` | `int(11)` | YES | `50` |  |  |
| `preferred_timing` | `longtext` | YES | `NULL` |  |  |
| `excluded_days` | `longtext` | YES | `NULL` |  |  |
| `notify_email` | `tinyint(1)` | YES | `1` |  |  |
| `notify_sms` | `tinyint(1)` | YES | `0` |  |  |
| `notify_push` | `tinyint(1)` | YES | `1` |  |  |
| `instant_accept` | `tinyint(1)` | YES | `0` |  |  |
| `auto_decline_below_budget` | `tinyint(1)` | YES | `0` |  |  |
| `auto_recharge_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `auto_recharge_threshold` | `decimal(10,2)` | YES | `0.00` |  |  |
| `auto_recharge_amount` | `decimal(10,2)` | YES | `0.00` |  |  |
| `pause_when_balance_zero` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uq_pro_preferences`: `workspace_id`, `company_id`

---
### Table: `products`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `price` | `decimal(10,2)` | NO | `0.00` |  |  |
| `currency` | `varchar(3)` | NO | `'USD'` |  |  |
| `type` | `enum('one_time','recurring')` | NO | `'one_time'` |  |  |
| `recurring_interval` | `enum('day','week','month','year')` | YES | `NULL` |  |  |
| `recurring_interval_count` | `int(11)` | YES | `1` |  |  |
| `stripe_price_id` | `varchar(255)` | YES | `NULL` |  |  |
| `status` | `enum('active','archived')` | NO | `'active'` | MUL |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `track_inventory` | `tinyint(1)` | YES | `0` |  |  |
| `stock_quantity` | `int(11)` | YES | `0` |  |  |
| `low_stock_threshold` | `int(11)` | YES | `5` |  |  |
| `product_type` | `enum('physical','digital','service','subscription')` | YES | `'physical'` |  |  |
| `digital_file_url` | `varchar(500)` | YES | `NULL` |  |  |
| `subscription_interval` | `enum('daily','weekly','monthly','yearly')` | YES | `NULL` |  |  |
| `subscription_interval_count` | `int(11)` | YES | `1` |  |  |
| `trial_period_days` | `int(11)` | YES | `0` |  |  |
| `weight` | `decimal(10,2)` | YES | `NULL` |  |  |
| `dimensions` | `longtext` | YES | `NULL` |  |  |
| `images` | `longtext` | YES | `NULL` |  |  |
| `variants` | `longtext` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_products_status`: `status`
- `INDEX` `idx_products_user`: `user_id`
- `INDEX` `idx_products_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `project_activity`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `project_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `action` | `varchar(100)` | NO | `NULL` |  |  |
| `entity_type` | `varchar(50)` | YES | `NULL` |  |  |
| `entity_id` | `int(11)` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` | MUL |  |

**Foreign Keys:**
- `project_id` -> `projects.id` (Constraint: `project_activity_ibfk_1`)
- `user_id` -> `users.id` (Constraint: `project_activity_ibfk_2`)

**Indexes:**
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_project_id`: `project_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`

---
### Table: `project_custom_fields`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `project_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |
| `field_name` | `varchar(100)` | NO | `NULL` |  |  |
| `field_type` | `enum('text','number','date','dropdown','checkbox','url','email')` | NO | `NULL` |  |  |
| `field_options` | `longtext` | YES | `NULL` |  |  |
| `required` | `tinyint(1)` | YES | `0` |  |  |
| `position` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_custom_fields_project`: `project_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `project_members`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `project_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `role` | `enum('owner','admin','member','viewer')` | YES | `'member'` |  |  |
| `added_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Foreign Keys:**
- `project_id` -> `projects.id` (Constraint: `project_members_ibfk_1`)
- `user_id` -> `users.id` (Constraint: `project_members_ibfk_2`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_project_user`: `project_id`, `user_id`
- `INDEX` `user_id`: `user_id`

---
### Table: `project_tasks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `project_id` | `int(11)` | NO | `NULL` | MUL |  |
| `task_id` | `int(11)` | NO | `NULL` | MUL |  |
| `position` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_project_tasks_project`: `project_id`
- `INDEX` `idx_project_tasks_task`: `task_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_project_task`: `project_id`, `task_id`

---
### Table: `projects`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `status` | `enum('planning','active','on_hold','completed','archived')` | YES | `'active'` | MUL |  |
| `priority` | `enum('low','medium','high','urgent')` | YES | `'medium'` |  |  |
| `start_date` | `date` | YES | `NULL` |  |  |
| `due_date` | `date` | YES | `NULL` | MUL |  |
| `completed_at` | `datetime` | YES | `NULL` |  |  |
| `progress_percentage` | `int(11)` | YES | `0` |  |  |
| `color` | `varchar(7)` | YES | `'#3B82F6'` |  |  |
| `tags` | `longtext` | YES | `NULL` |  |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `projects_ibfk_1`)

**Indexes:**
- `INDEX` `idx_due_date`: `due_date`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_user_id`: `user_id`
- `INDEX` `idx_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `promo_codes`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `code` | `varchar(50)` | NO | `NULL` |  |  |
| `description` | `varchar(255)` | YES | `NULL` |  |  |
| `discount_type` | `enum('percent','fixed','credits')` | NO | `NULL` |  |  |
| `discount_value` | `decimal(10,2)` | NO | `NULL` |  |  |
| `min_purchase` | `decimal(10,2)` | YES | `NULL` |  |  |
| `max_uses` | `int(11)` | YES | `NULL` |  |  |
| `max_uses_per_user` | `int(11)` | YES | `1` |  |  |
| `current_uses` | `int(11)` | YES | `0` |  |  |
| `valid_from` | `datetime` | YES | `NULL` |  |  |
| `valid_until` | `datetime` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_promo_codes_active`: `workspace_id`, `is_active`, `code`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uq_promo_codes`: `workspace_id`, `code`

---
### Table: `property_contacts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `property_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `role` | `varchar(100)` | YES | `NULL` |  |  |
| `is_primary` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `property_id` -> `client_properties.id` (Constraint: `property_contacts_ibfk_1`)
- `contact_id` -> `recipients.id` (Constraint: `property_contacts_ibfk_2`)

**Indexes:**
- `INDEX` `idx_contact`: `contact_id`
- `INDEX` `idx_property`: `property_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_property_contact`: `property_id`, `contact_id`

---
### Table: `proposal_activities`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `proposal_id` | `int(11)` | NO | `NULL` | MUL |  |
| `activity_type` | `varchar(50)` | NO | `NULL` | MUL |  |
| `description` | `text` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_proposal_activities_proposal`: `proposal_id`
- `INDEX` `idx_proposal_activities_type`: `activity_type`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `proposal_comments`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `proposal_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | YES | `NULL` | MUL |  |
| `author_name` | `varchar(255)` | YES | `NULL` |  |  |
| `author_email` | `varchar(255)` | YES | `NULL` |  |  |
| `content` | `text` | NO | `NULL` |  |  |
| `is_internal` | `tinyint(1)` | YES | `0` |  |  |
| `parent_id` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_proposal_comments_proposal`: `proposal_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`

---
### Table: `proposal_items`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `proposal_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `quantity` | `decimal(10,2)` | YES | `1.00` |  |  |
| `unit_price` | `decimal(15,2)` | YES | `0.00` |  |  |
| `discount_percent` | `decimal(5,2)` | YES | `0.00` |  |  |
| `tax_percent` | `decimal(5,2)` | YES | `0.00` |  |  |
| `total` | `decimal(15,2)` | YES | `0.00` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `category` | `varchar(100)` | YES | `NULL` |  |  |
| `is_optional` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_proposal_items_proposal`: `proposal_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `proposal_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | UNI |  |
| `company_name` | `varchar(255)` | YES | `NULL` |  |  |
| `company_logo` | `varchar(500)` | YES | `NULL` |  |  |
| `company_address` | `text` | YES | `NULL` |  |  |
| `company_phone` | `varchar(50)` | YES | `NULL` |  |  |
| `company_email` | `varchar(255)` | YES | `NULL` |  |  |
| `company_website` | `varchar(255)` | YES | `NULL` |  |  |
| `default_currency` | `varchar(10)` | YES | `'USD'` |  |  |
| `default_validity_days` | `int(11)` | YES | `30` |  |  |
| `default_payment_terms` | `text` | YES | `NULL` |  |  |
| `default_terms_conditions` | `text` | YES | `NULL` |  |  |
| `email_notifications` | `tinyint(1)` | YES | `1` |  |  |
| `require_signature` | `tinyint(1)` | YES | `1` |  |  |
| `allow_comments` | `tinyint(1)` | YES | `1` |  |  |
| `show_pricing` | `tinyint(1)` | YES | `1` |  |  |
| `branding` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `user_id`: `user_id`

---
### Table: `proposal_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `category` | `varchar(100)` | YES | `'general'` | MUL |  |
| `content` | `longtext` | NO | `NULL` |  |  |
| `cover_image` | `varchar(500)` | YES | `NULL` |  |  |
| `sections` | `longtext` | YES | `NULL` |  |  |
| `variables` | `longtext` | YES | `NULL` |  |  |
| `styling` | `longtext` | YES | `NULL` |  |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `status` | `varchar(32)` | YES | `'active'` | MUL |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_proposal_templates_category`: `category`
- `INDEX` `idx_proposal_templates_status`: `status`
- `INDEX` `idx_proposal_templates_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `proposals`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `token` | `varchar(64)` | YES | `NULL` | UNI |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `template_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `client_name` | `varchar(255)` | YES | `NULL` |  |  |
| `client_email` | `varchar(255)` | YES | `NULL` | MUL |  |
| `client_company` | `varchar(255)` | YES | `NULL` |  |  |
| `client_phone` | `varchar(50)` | YES | `NULL` |  |  |
| `client_address` | `text` | YES | `NULL` |  |  |
| `content` | `longtext` | NO | `NULL` |  |  |
| `sections` | `longtext` | YES | `NULL` |  |  |
| `cover_image` | `varchar(500)` | YES | `NULL` |  |  |
| `logo` | `varchar(500)` | YES | `NULL` |  |  |
| `pricing` | `longtext` | YES | `NULL` |  |  |
| `total_amount` | `decimal(15,2)` | YES | `0.00` |  |  |
| `currency` | `varchar(10)` | YES | `'USD'` |  |  |
| `valid_until` | `date` | YES | `NULL` |  |  |
| `status` | `varchar(32)` | YES | `'draft'` | MUL |  |
| `sent_at` | `datetime` | YES | `NULL` |  |  |
| `viewed_at` | `datetime` | YES | `NULL` |  |  |
| `accepted_at` | `datetime` | YES | `NULL` |  |  |
| `declined_at` | `datetime` | YES | `NULL` |  |  |
| `signature` | `text` | YES | `NULL` |  |  |
| `signed_by` | `varchar(255)` | YES | `NULL` |  |  |
| `signed_at` | `datetime` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `internal_notes` | `text` | YES | `NULL` |  |  |
| `custom_fields` | `longtext` | YES | `NULL` |  |  |
| `styling` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` | MUL |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_proposals_client_email`: `client_email`
- `INDEX` `idx_proposals_company`: `workspace_id`, `company_id`
- `INDEX` `idx_proposals_created`: `created_at`
- `INDEX` `idx_proposals_status`: `status`
- `INDEX` `idx_proposals_template`: `template_id`
- `INDEX` `idx_proposals_user`: `user_id`
- `INDEX` `idx_proposals_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `token`: `token`

---
### Table: `provider_badge_awards`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `badge_id` | `int(11)` | NO | `NULL` |  |  |
| `awarded_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `expires_at` | `datetime` | YES | `NULL` |  |  |
| `awarded_by` | `int(11)` | YES | `NULL` |  |  |
| `reason` | `varchar(255)` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_badge_awards_company`: `workspace_id`, `company_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uq_badge_award`: `workspace_id`, `company_id`, `badge_id`

---
### Table: `provider_badges`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `slug` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `varchar(255)` | YES | `NULL` |  |  |
| `icon` | `varchar(100)` | YES | `NULL` |  |  |
| `criteria` | `longtext` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uq_badge_slug`: `workspace_id`, `slug`

---
### Table: `provider_documents`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `document_type` | `enum('license','insurance','certification','portfolio','background_check','identity','other')` | NO | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `file_url` | `varchar(500)` | NO | `NULL` |  |  |
| `file_name` | `varchar(255)` | YES | `NULL` |  |  |
| `file_size` | `int(11)` | YES | `NULL` |  |  |
| `mime_type` | `varchar(100)` | YES | `NULL` |  |  |
| `status` | `enum('pending','approved','rejected','expired')` | YES | `'pending'` |  |  |
| `expires_at` | `date` | YES | `NULL` |  |  |
| `review_notes` | `text` | YES | `NULL` |  |  |
| `reviewed_by` | `int(11)` | YES | `NULL` |  |  |
| `reviewed_at` | `datetime` | YES | `NULL` |  |  |
| `uploaded_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_provider_docs_company`: `workspace_id`, `company_id`
- `INDEX` `idx_provider_docs_expires`: `workspace_id`, `expires_at`
- `INDEX` `idx_provider_docs_status`: `workspace_id`, `status`
- `INDEX` `idx_provider_docs_type`: `workspace_id`, `document_type`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `provider_portfolio`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `title` | `varchar(255)` | YES | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `media_url` | `varchar(500)` | NO | `NULL` |  |  |
| `media_type` | `enum('image','video')` | YES | `'image'` |  |  |
| `thumbnail_url` | `varchar(500)` | YES | `NULL` |  |  |
| `service_id` | `int(11)` | YES | `NULL` |  |  |
| `is_featured` | `tinyint(1)` | YES | `0` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_portfolio_company`: `workspace_id`, `company_id`
- `INDEX` `idx_portfolio_service`: `workspace_id`, `service_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `push_notifications`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `device_id` | `int(11)` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `body` | `text` | NO | `NULL` |  |  |
| `data` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('queued','sent','delivered','failed')` | YES | `'queued'` | MUL |  |
| `sent_at` | `timestamp` | YES | `NULL` |  |  |
| `delivered_at` | `timestamp` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `device_id` -> `mobile_devices.id` (Constraint: `push_notifications_ibfk_1`)

**Indexes:**
- `INDEX` `idx_device`: `device_id`
- `INDEX` `idx_push_notifications_status`: `workspace_id`, `status`, `created_at`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `qr_code_scans`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `qr_code_id` | `int(11)` | NO | `NULL` | MUL |  |
| `scanned_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `device_type` | `varchar(50)` | YES | `NULL` |  |  |
| `browser` | `varchar(50)` | YES | `NULL` |  |  |
| `city` | `varchar(100)` | YES | `NULL` |  |  |
| `country` | `varchar(100)` | YES | `NULL` |  |  |
| `referrer` | `varchar(255)` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_qr_code`: `qr_code_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `qr_codes`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `type` | `varchar(50)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `url` | `varchar(2048)` | YES | `NULL` |  |  |
| `short_url` | `varchar(255)` | YES | `NULL` |  |  |
| `style` | `longtext` | YES | `NULL` |  |  |
| `entity_id` | `varchar(255)` | YES | `NULL` |  |  |
| `entity_type` | `varchar(50)` | YES | `NULL` |  |  |
| `scan_count` | `int(11)` | YES | `0` |  |  |
| `image_url` | `varchar(2048)` | YES | `NULL` |  |  |
| `svg_url` | `varchar(2048)` | YES | `NULL` |  |  |
| `last_scanned_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_type`: `type`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `quickbooks_connections`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | UNI |  |
| `realm_id` | `varchar(255)` | NO | `NULL` |  |  |
| `access_token` | `text` | NO | `NULL` |  |  |
| `refresh_token` | `text` | NO | `NULL` |  |  |
| `token_expires_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `company_name` | `varchar(255)` | YES | `NULL` |  |  |
| `country` | `varchar(10)` | YES | `NULL` |  |  |
| `sync_enabled` | `tinyint(1)` | YES | `1` |  |  |
| `auto_sync_invoices` | `tinyint(1)` | YES | `1` |  |  |
| `auto_sync_payments` | `tinyint(1)` | YES | `1` |  |  |
| `auto_sync_customers` | `tinyint(1)` | YES | `1` |  |  |
| `last_sync_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `workspace_id`: `workspace_id`

---
### Table: `quickbooks_sync_mappings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `entity_type` | `enum('customer','invoice','payment','product','expense')` | NO | `NULL` | MUL |  |
| `local_id` | `int(11)` | NO | `NULL` |  |  |
| `quickbooks_id` | `varchar(255)` | NO | `NULL` | MUL |  |
| `last_synced_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `sync_status` | `enum('synced','pending','error')` | YES | `'synced'` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_entity`: `entity_type`, `local_id`
- `INDEX` `idx_qb_id`: `quickbooks_id`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_mapping`: `workspace_id`, `entity_type`, `local_id`

---
### Table: `quiz_attempt_answers`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `attempt_id` | `int(11)` | NO | `NULL` | MUL |  |
| `question_id` | `int(11)` | NO | `NULL` |  |  |
| `selected_option_id` | `int(11)` | YES | `NULL` |  |  |
| `text_answer` | `text` | YES | `NULL` |  |  |
| `is_correct` | `tinyint(1)` | YES | `NULL` |  |  |
| `points_earned` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_answer_attempt`: `attempt_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `quiz_attempts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `quiz_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `enrollment_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `user_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `score` | `decimal(5,2)` | YES | `NULL` |  |  |
| `total_points` | `int(11)` | YES | `NULL` |  |  |
| `earned_points` | `int(11)` | YES | `NULL` |  |  |
| `passed` | `tinyint(1)` | YES | `0` |  |  |
| `answers` | `longtext` | YES | `NULL` |  |  |
| `started_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `submitted_at` | `timestamp` | YES | `NULL` |  |  |
| `time_taken` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_enrollment`: `enrollment_id`
- `INDEX` `idx_quiz`: `quiz_id`
- `INDEX` `idx_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `quiz_question_options`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `question_id` | `int(11)` | NO | `NULL` | MUL |  |
| `option_text` | `text` | NO | `NULL` |  |  |
| `is_correct` | `tinyint(1)` | YES | `0` |  |  |
| `match_text` | `text` | YES | `NULL` |  |  |
| `position` | `int(11)` | YES | `0` |  |  |

**Indexes:**
- `INDEX` `idx_option_question`: `question_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `quiz_questions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `quiz_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `question_type` | `enum('multiple_choice','true_false','short_answer','essay')` | NO | `NULL` |  |  |
| `question_text` | `text` | NO | `NULL` |  |  |
| `options` | `longtext` | YES | `NULL` |  |  |
| `correct_answer` | `text` | YES | `NULL` |  |  |
| `points` | `int(11)` | YES | `1` |  |  |
| `order_index` | `int(11)` | YES | `0` | MUL |  |
| `explanation` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_order`: `order_index`
- `INDEX` `idx_quiz`: `quiz_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `quote_items`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `quote_id` | `int(11)` | NO | `NULL` | MUL |  |
| `item_type` | `enum('service','product','labor','material','other')` | YES | `'service'` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `quantity` | `decimal(10,2)` | YES | `1.00` |  |  |
| `unit_price` | `decimal(10,2)` | NO | `NULL` |  |  |
| `tax_rate` | `decimal(5,2)` | YES | `0.00` |  |  |
| `discount_percent` | `decimal(5,2)` | YES | `0.00` |  |  |
| `total` | `decimal(10,2)` | NO | `NULL` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `quote_id` -> `quotes.id` (Constraint: `quote_items_ibfk_1`)

**Indexes:**
- `INDEX` `idx_quote`: `quote_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `quotes`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` | MUL |  |
| `property_id` | `int(11)` | YES | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` |  |  |
| `quote_number` | `varchar(50)` | YES | `NULL` | UNI |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `status` | `enum('draft','sent','viewed','approved','declined','expired')` | YES | `'draft'` | MUL |  |
| `subtotal` | `decimal(10,2)` | YES | `0.00` |  |  |
| `tax_amount` | `decimal(10,2)` | YES | `0.00` |  |  |
| `discount_amount` | `decimal(10,2)` | YES | `0.00` |  |  |
| `total_amount` | `decimal(10,2)` | YES | `0.00` |  |  |
| `valid_until` | `date` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `terms` | `text` | YES | `NULL` |  |  |
| `converted_to_job_id` | `int(11)` | YES | `NULL` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `company_id` -> `companies.id` (Constraint: `quotes_ibfk_1`)
- `property_id` -> `client_properties.id` (Constraint: `quotes_ibfk_2`)

**Indexes:**
- `INDEX` `company_id`: `company_id`
- `INDEX` `idx_quote_number`: `quote_number`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace_company`: `workspace_id`, `company_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `property_id`: `property_id`
- `UNIQUE` `quote_number`: `quote_number`

---
### Table: `rank_tracking`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `keyword` | `varchar(255)` | NO | `NULL` |  |  |
| `search_engine` | `enum('google','bing','yahoo','duckduckgo')` | YES | `'google'` |  |  |
| `location` | `varchar(255)` | YES | `NULL` |  |  |
| `current_rank` | `int(11)` | YES | `NULL` |  |  |
| `previous_rank` | `int(11)` | YES | `NULL` |  |  |
| `best_rank` | `int(11)` | YES | `NULL` |  |  |
| `url_ranked` | `varchar(500)` | YES | `NULL` |  |  |
| `search_volume` | `int(11)` | YES | `NULL` |  |  |
| `difficulty` | `int(11)` | YES | `NULL` |  |  |
| `checked_at` | `timestamp` | YES | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_rank_tracking_checked`: `checked_at`
- `INDEX` `idx_rank_tracking_keyword`: `workspace_id`, `keyword`
- `INDEX` `idx_rank_tracking_workspace`: `workspace_id`, `company_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `rate_limits`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `identifier` | `varchar(255)` | NO | `NULL` | MUL |  |
| `window_start` | `datetime` | NO | `NULL` | MUL |  |
| `request_count` | `int(11)` | NO | `1` |  |  |
| `window_duration` | `int(11)` | NO | `300` |  |  |
| `max_requests` | `int(11)` | NO | `100` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_identifier`: `identifier`
- `INDEX` `idx_window_start`: `window_start`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_identifier_window`: `identifier`, `window_start`

---
### Table: `rbac_audit_log`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `action` | `varchar(100)` | NO | `NULL` | MUL |  |
| `actor_id` | `int(11)` | NO | `NULL` | MUL |  |
| `target_type` | `varchar(50)` | YES | `NULL` | MUL |  |
| `target_id` | `int(11)` | YES | `NULL` |  |  |
| `old_value` | `longtext` | YES | `NULL` |  |  |
| `new_value` | `longtext` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_rbac_audit_action`: `action`
- `INDEX` `idx_rbac_audit_actor`: `actor_id`
- `INDEX` `idx_rbac_audit_created`: `created_at`
- `INDEX` `idx_rbac_audit_target`: `target_type`, `target_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `recall_schedules`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `industry_type_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `service_id` | `int(11)` | YES | `NULL` |  |  |
| `recall_type` | `enum('time_based','mileage_based','usage_based','custom')` | YES | `'time_based'` |  |  |
| `interval_days` | `int(11)` | YES | `NULL` |  |  |
| `interval_months` | `int(11)` | YES | `NULL` |  |  |
| `custom_logic` | `longtext` | YES | `NULL` |  |  |
| `message_template_email` | `int(11)` | YES | `NULL` |  |  |
| `message_template_sms` | `int(11)` | YES | `NULL` |  |  |
| `reminder_days_before` | `longtext` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `recipient_tags`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `recipient_id` | `int(11)` | NO | `NULL` | MUL |  |
| `tag_id` | `int(11)` | NO | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_recipient_tags_recipient_id`: `recipient_id`
- `INDEX` `idx_recipient_tags_tag_id`: `tag_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_recipient_tag`: `recipient_id`, `tag_id`

---
### Table: `recipients`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `campaign_id` | `int(10) unsigned` | YES | `NULL` | MUL |  |
| `email` | `varchar(255)` | NO | `NULL` | MUL |  |
| `phone` | `varchar(20)` | YES | `NULL` | MUL |  |
| `type` | `varchar(20)` | YES | `NULL` | MUL |  |
| `first_name` | `varchar(255)` | YES | `NULL` |  |  |
| `last_name` | `varchar(255)` | YES | `NULL` |  |  |
| `address` | `text` | YES | `NULL` |  |  |
| `city` | `varchar(100)` | YES | `NULL` | MUL |  |
| `state` | `varchar(100)` | YES | `NULL` | MUL |  |
| `country` | `varchar(100)` | YES | `NULL` | MUL |  |
| `postal_code` | `varchar(20)` | YES | `NULL` |  |  |
| `website` | `varchar(255)` | YES | `NULL` |  |  |
| `linkedin` | `varchar(255)` | YES | `NULL` |  |  |
| `twitter` | `varchar(255)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `birthday` | `date` | YES | `NULL` |  |  |
| `lead_source` | `varchar(100)` | YES | `NULL` | MUL |  |
| `industry` | `varchar(100)` | YES | `NULL` | MUL |  |
| `company_size` | `varchar(50)` | YES | `NULL` |  |  |
| `annual_revenue` | `varchar(50)` | YES | `NULL` |  |  |
| `technology` | `text` | YES | `NULL` |  |  |
| `company` | `varchar(255)` | YES | `NULL` |  |  |
| `title` | `varchar(255)` | YES | `NULL` |  |  |
| `status` | `varchar(50)` | NO | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `sent_at` | `timestamp` | YES | `NULL` |  |  |
| `opened_at` | `timestamp` | YES | `NULL` |  |  |
| `clicked_at` | `timestamp` | YES | `NULL` |  |  |
| `track_token` | `varchar(64)` | YES | `NULL` | MUL |  |
| `unsubscribed_at` | `datetime` | YES | `NULL` | MUL |  |
| `unsubscribes` | `int(11)` | NO | `0` |  |  |
| `custom_fields` | `text` | YES | `NULL` | MUL |  |
| `opens` | `int(11)` | YES | `0` |  |  |
| `clicks` | `int(11)` | YES | `0` |  |  |
| `bounces` | `int(11)` | YES | `0` |  |  |
| `bounced_at` | `timestamp` | YES | `NULL` |  |  |
| `user_id` | `int(11)` | NO | `1` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `tags` | `varchar(500)` | YES | `NULL` |  |  |
| `additional_details` | `text` | YES | `NULL` |  |  |
| `company_size_selection` | `varchar(50)` | YES | `NULL` |  |  |
| `lead_status` | `enum('prospect','lead','opportunity','customer','inactive')` | YES | `'prospect'` | MUL |  |
| `lead_rating` | `enum('hot','warm','cold')` | YES | `'cold'` | MUL |  |
| `last_contacted_at` | `datetime` | YES | `NULL` | MUL |  |
| `contact_frequency` | `int(11)` | YES | `0` |  |  |
| `preferred_contact_method` | `enum('email','phone','sms','any')` | YES | `'email'` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `replied_at` | `timestamp` | YES | `NULL` |  |  |

**Foreign Keys:**
- `company_id` -> `companies.id` (Constraint: `fk_recipients_company`)

**Indexes:**
- `INDEX` `campaign_id`: `campaign_id`
- `INDEX` `idx_recipients_campaign`: `campaign_id`
- `INDEX` `idx_recipients_city`: `city`
- `INDEX` `idx_recipients_company`: `company_id`
- `INDEX` `idx_recipients_country`: `country`
- `INDEX` `idx_recipients_custom_fields`: `custom_fields`
- `INDEX` `idx_recipients_email`: `email`
- `INDEX` `idx_recipients_industry`: `industry`
- `INDEX` `idx_recipients_last_contacted`: `last_contacted_at`
- `INDEX` `idx_recipients_lead_rating`: `lead_rating`
- `INDEX` `idx_recipients_lead_source`: `lead_source`
- `INDEX` `idx_recipients_lead_status`: `lead_status`
- `INDEX` `idx_recipients_phone`: `phone`
- `INDEX` `idx_recipients_state`: `state`
- `INDEX` `idx_recipients_status`: `status`
- `INDEX` `idx_recipients_track_token`: `track_token`
- `INDEX` `idx_recipients_type`: `type`
- `INDEX` `idx_recipients_unsubscribed_at`: `unsubscribed_at`
- `INDEX` `idx_recipients_workspace`: `workspace_id`
- `INDEX` `idx_recipients_workspace_company`: `workspace_id`, `company_id`
- `INDEX` `idx_recipients_workspace_created`: `workspace_id`, `created_at`
- `INDEX` `idx_recipients_workspace_id`: `workspace_id`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `recurring_appointments`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `booking_type_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` |  |  |
| `guest_name` | `varchar(255)` | YES | `NULL` |  |  |
| `guest_email` | `varchar(255)` | YES | `NULL` |  |  |
| `recurrence_pattern` | `enum('daily','weekly','biweekly','monthly')` | NO | `NULL` |  |  |
| `recurrence_day_of_week` | `tinyint(4)` | YES | `NULL` |  |  |
| `recurrence_day_of_month` | `tinyint(4)` | YES | `NULL` |  |  |
| `preferred_time` | `time` | NO | `NULL` |  |  |
| `duration_minutes` | `int(11)` | NO | `30` |  |  |
| `timezone` | `varchar(100)` | NO | `'UTC'` |  |  |
| `start_date` | `date` | NO | `NULL` |  |  |
| `end_date` | `date` | YES | `NULL` |  |  |
| `max_occurrences` | `int(11)` | YES | `NULL` |  |  |
| `occurrences_created` | `int(11)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` | MUL |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `recurring_appointments_ibfk_1`)
- `booking_type_id` -> `booking_types.id` (Constraint: `recurring_appointments_ibfk_2`)

**Indexes:**
- `INDEX` `booking_type_id`: `booking_type_id`
- `INDEX` `idx_recurring_active`: `is_active`
- `INDEX` `idx_recurring_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `recurring_invoices`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` |  |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `frequency` | `enum('weekly','biweekly','monthly','quarterly','yearly')` | YES | `'monthly'` |  |  |
| `day_of_month` | `int(11)` | YES | `NULL` |  |  |
| `day_of_week` | `int(11)` | YES | `NULL` |  |  |
| `title` | `varchar(255)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `terms` | `text` | YES | `NULL` |  |  |
| `items` | `longtext` | NO | `NULL` |  |  |
| `subtotal` | `decimal(12,2)` | YES | `0.00` |  |  |
| `discount_type` | `enum('percentage','fixed')` | YES | `NULL` |  |  |
| `discount_value` | `decimal(10,2)` | YES | `NULL` |  |  |
| `tax_rate` | `decimal(5,2)` | YES | `NULL` |  |  |
| `total` | `decimal(12,2)` | YES | `0.00` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `auto_send` | `tinyint(1)` | YES | `1` |  |  |
| `auto_charge` | `tinyint(1)` | YES | `0` |  |  |
| `next_invoice_date` | `date` | YES | `NULL` | MUL |  |
| `last_invoice_date` | `date` | YES | `NULL` |  |  |
| `invoices_generated` | `int(11)` | YES | `0` |  |  |
| `end_date` | `date` | YES | `NULL` |  |  |
| `max_invoices` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_recurring_next`: `next_invoice_date`, `is_active`
- `INDEX` `idx_recurring_workspace`: `workspace_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `recurring_job_schedules`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` |  |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `job_type_id` | `int(11)` | YES | `NULL` |  |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `address_line1` | `varchar(255)` | YES | `NULL` |  |  |
| `address_line2` | `varchar(255)` | YES | `NULL` |  |  |
| `city` | `varchar(100)` | YES | `NULL` |  |  |
| `state` | `varchar(50)` | YES | `NULL` |  |  |
| `postal_code` | `varchar(20)` | YES | `NULL` |  |  |
| `frequency` | `enum('daily','weekly','biweekly','monthly','quarterly','yearly')` | YES | `'monthly'` |  |  |
| `day_of_week` | `int(11)` | YES | `NULL` |  |  |
| `day_of_month` | `int(11)` | YES | `NULL` |  |  |
| `preferred_time` | `time` | YES | `NULL` |  |  |
| `duration_minutes` | `int(11)` | YES | `60` |  |  |
| `assigned_to` | `int(11)` | YES | `NULL` |  |  |
| `estimated_amount` | `decimal(12,2)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `next_job_date` | `date` | YES | `NULL` | MUL |  |
| `last_job_date` | `date` | YES | `NULL` |  |  |
| `jobs_created` | `int(11)` | YES | `0` |  |  |
| `end_date` | `date` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_recurring_jobs_next`: `next_job_date`, `is_active`
- `INDEX` `idx_recurring_jobs_workspace`: `workspace_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `recurring_tasks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `project_id` | `int(11)` | YES | `NULL` |  |  |
| `template_task_id` | `int(11)` | YES | `NULL` |  |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `recurrence_type` | `enum('daily','weekly','monthly','yearly')` | NO | `NULL` |  |  |
| `recurrence_interval` | `int(11)` | YES | `1` |  |  |
| `recurrence_days` | `longtext` | YES | `NULL` |  |  |
| `next_run_at` | `datetime` | YES | `NULL` | MUL |  |
| `last_run_at` | `datetime` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_by` | `int(11)` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_recurring_next_run`: `next_run_at`
- `INDEX` `idx_recurring_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `referral_programs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `referrer_reward_type` | `enum('fixed','percentage','credit','gift')` | YES | `'fixed'` |  |  |
| `referrer_reward_amount` | `decimal(10,2)` | YES | `NULL` |  |  |
| `referee_reward_type` | `enum('fixed','percentage','credit','gift')` | YES | `'fixed'` |  |  |
| `referee_reward_amount` | `decimal(10,2)` | YES | `NULL` |  |  |
| `terms` | `text` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `referrals`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `program_id` | `int(11)` | YES | `NULL` | MUL |  |
| `referrer_contact_id` | `int(11)` | NO | `NULL` |  |  |
| `referee_contact_id` | `int(11)` | YES | `NULL` |  |  |
| `referee_name` | `varchar(255)` | YES | `NULL` |  |  |
| `referee_email` | `varchar(255)` | YES | `NULL` |  |  |
| `referee_phone` | `varchar(50)` | YES | `NULL` |  |  |
| `status` | `enum('pending','contacted','converted','rewarded','expired','invalid')` | YES | `'pending'` |  |  |
| `referrer_reward_status` | `enum('pending','approved','paid')` | YES | `'pending'` |  |  |
| `referee_reward_status` | `enum('pending','approved','paid')` | YES | `'pending'` |  |  |
| `conversion_date` | `datetime` | YES | `NULL` |  |  |
| `conversion_value` | `decimal(10,2)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_referrals_user_status`: `user_id`, `status`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `program_id`: `program_id`

---
### Table: `refunds`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `payment_id` | `int(11)` | NO | `NULL` | MUL |  |
| `stripe_refund_id` | `varchar(255)` | YES | `NULL` |  |  |
| `amount` | `decimal(10,2)` | NO | `NULL` |  |  |
| `status` | `enum('pending','succeeded','failed','cancelled')` | YES | `'pending'` |  |  |
| `reason` | `enum('duplicate','fraudulent','requested_by_customer','other')` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `processed_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `payment_id` -> `payments.id` (Constraint: `refunds_ibfk_1`)

**Indexes:**
- `INDEX` `idx_refunds_payment`: `payment_id`
- `INDEX` `idx_refunds_workspace`: `workspace_id`, `created_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `report_aggregations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `aggregation_date` | `date` | NO | `NULL` | MUL |  |
| `aggregation_type` | `enum('daily','weekly','monthly')` | NO | `'daily'` |  |  |
| `emails_sent` | `int(11)` | NO | `0` |  |  |
| `emails_delivered` | `int(11)` | NO | `0` |  |  |
| `emails_opened` | `int(11)` | NO | `0` |  |  |
| `emails_clicked` | `int(11)` | NO | `0` |  |  |
| `emails_bounced` | `int(11)` | NO | `0` |  |  |
| `emails_unsubscribed` | `int(11)` | NO | `0` |  |  |
| `emails_replied` | `int(11)` | NO | `0` |  |  |
| `sms_sent` | `int(11)` | NO | `0` |  |  |
| `sms_delivered` | `int(11)` | NO | `0` |  |  |
| `sms_failed` | `int(11)` | NO | `0` |  |  |
| `sms_replied` | `int(11)` | NO | `0` |  |  |
| `calls_made` | `int(11)` | NO | `0` |  |  |
| `calls_answered` | `int(11)` | NO | `0` |  |  |
| `calls_duration_seconds` | `int(11)` | NO | `0` |  |  |
| `calls_voicemail` | `int(11)` | NO | `0` |  |  |
| `contacts_created` | `int(11)` | NO | `0` |  |  |
| `contacts_updated` | `int(11)` | NO | `0` |  |  |
| `contacts_unsubscribed` | `int(11)` | NO | `0` |  |  |
| `revenue_total` | `decimal(15,2)` | NO | `0.00` |  |  |
| `invoices_sent` | `int(11)` | NO | `0` |  |  |
| `invoices_paid` | `int(11)` | NO | `0` |  |  |
| `payments_received` | `int(11)` | NO | `0` |  |  |
| `deals_created` | `int(11)` | NO | `0` |  |  |
| `deals_won` | `int(11)` | NO | `0` |  |  |
| `deals_lost` | `int(11)` | NO | `0` |  |  |
| `deals_value_won` | `decimal(15,2)` | NO | `0.00` |  |  |
| `appointments_booked` | `int(11)` | NO | `0` |  |  |
| `appointments_completed` | `int(11)` | NO | `0` |  |  |
| `appointments_cancelled` | `int(11)` | NO | `0` |  |  |
| `appointments_no_show` | `int(11)` | NO | `0` |  |  |
| `form_submissions` | `int(11)` | NO | `0` |  |  |
| `form_views` | `int(11)` | NO | `0` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_aggregations_date`: `aggregation_date`
- `INDEX` `idx_aggregations_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_user_date_type`: `user_id`, `aggregation_date`, `aggregation_type`

---
### Table: `report_definitions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `report_type` | `enum('email','sms','calls','pipeline','revenue','contacts','forms','appointments','custom')` | NO | `NULL` | MUL |  |
| `metrics` | `longtext` | NO | `NULL` |  |  |
| `dimensions` | `longtext` | YES | `NULL` |  |  |
| `filters` | `longtext` | YES | `NULL` |  |  |
| `sort_by` | `varchar(100)` | YES | `NULL` |  |  |
| `sort_direction` | `enum('asc','desc')` | NO | `'desc'` |  |  |
| `chart_type` | `enum('line','bar','pie','table','funnel','area','donut','metric')` | NO | `'table'` |  |  |
| `chart_config` | `longtext` | YES | `NULL` |  |  |
| `is_scheduled` | `tinyint(1)` | NO | `0` |  |  |
| `schedule_frequency` | `enum('daily','weekly','monthly')` | YES | `NULL` |  |  |
| `schedule_day` | `int(11)` | YES | `NULL` |  |  |
| `schedule_time` | `time` | YES | `NULL` |  |  |
| `schedule_recipients` | `longtext` | YES | `NULL` |  |  |
| `last_run_at` | `datetime` | YES | `NULL` |  |  |
| `next_run_at` | `datetime` | YES | `NULL` |  |  |
| `is_public` | `tinyint(1)` | NO | `0` |  |  |
| `share_token` | `varchar(64)` | YES | `NULL` | UNI |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_reports_type`: `report_type`
- `INDEX` `idx_reports_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `share_token`: `share_token`

---
### Table: `report_exports`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `report_id` | `int(11)` | YES | `NULL` | MUL |  |
| `export_type` | `enum('csv','xlsx','pdf','json')` | NO | `'csv'` |  |  |
| `file_name` | `varchar(255)` | NO | `NULL` |  |  |
| `file_url` | `varchar(500)` | YES | `NULL` |  |  |
| `file_size` | `int(11)` | YES | `NULL` |  |  |
| `status` | `enum('pending','processing','completed','failed')` | NO | `'pending'` | MUL |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `expires_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_exports_status`: `status`
- `INDEX` `idx_exports_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `report_id`: `report_id`

---
### Table: `reputation_ai_agents`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `instructions` | `text` | YES | `NULL` |  |  |
| `tone` | `longtext` | YES | `NULL` |  |  |
| `language` | `varchar(10)` | YES | `'en'` |  |  |
| `review_sources` | `longtext` | YES | `NULL` |  |  |
| `review_types` | `longtext` | YES | `NULL` |  |  |
| `footer` | `text` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `response_count` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `reputation_integrations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `platform` | `varchar(50)` | NO | `NULL` |  |  |
| `is_connected` | `tinyint(1)` | YES | `0` |  |  |
| `credentials` | `longtext` | YES | `NULL` |  |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `last_sync_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_workspace_platform`: `workspace_id`, `platform`

---
### Table: `reputation_scores`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `client_id` | `int(11)` | YES | `NULL` |  |  |
| `date` | `date` | NO | `NULL` |  |  |
| `overall_score` | `decimal(3,2)` | YES | `NULL` |  |  |
| `google_score` | `decimal(3,2)` | YES | `NULL` |  |  |
| `facebook_score` | `decimal(3,2)` | YES | `NULL` |  |  |
| `yelp_score` | `decimal(3,2)` | YES | `NULL` |  |  |
| `total_reviews` | `int(11)` | YES | `0` |  |  |
| `new_reviews` | `int(11)` | YES | `0` |  |  |
| `response_rate` | `decimal(5,2)` | YES | `NULL` |  |  |
| `avg_response_time_hours` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `reputation_scores_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_user_date`: `user_id`, `client_id`, `date`

---
### Table: `reputation_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | UNI |  |
| `ai_mode` | `varchar(20)` | YES | `'off'` |  |  |
| `drip_mode_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `review_link` | `varchar(500)` | YES | `NULL` |  |  |
| `review_balancing_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `review_platforms` | `longtext` | YES | `NULL` |  |  |
| `sms_enabled` | `tinyint(1)` | YES | `1` |  |  |
| `sms_timing` | `varchar(20)` | YES | `'immediately'` |  |  |
| `sms_repeat` | `varchar(20)` | YES | `'dont-repeat'` |  |  |
| `sms_max_retries` | `int(11)` | YES | `3` |  |  |
| `email_enabled` | `tinyint(1)` | YES | `1` |  |  |
| `email_timing` | `varchar(20)` | YES | `'immediately'` |  |  |
| `email_repeat` | `varchar(20)` | YES | `'dont-repeat'` |  |  |
| `email_max_retries` | `int(11)` | YES | `1` |  |  |
| `whatsapp_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `spam_detection_enabled` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `workspace_id`: `workspace_id`

---
### Table: `request_items`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `request_id` | `int(11)` | NO | `NULL` | MUL |  |
| `description` | `varchar(255)` | NO | `NULL` |  |  |
| `quantity` | `decimal(10,2)` | YES | `1.00` |  |  |
| `unit_price` | `decimal(10,2)` | YES | `0.00` |  |  |
| `total` | `decimal(10,2)` | YES | `0.00` |  |  |
| `item_type` | `enum('service','product','labor','material','fee')` | YES | `'service'` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `request_id` -> `requests.id` (Constraint: `request_items_ibfk_1`)

**Indexes:**
- `INDEX` `idx_request`: `request_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `request_status_history`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `request_id` | `int(11)` | NO | `NULL` | MUL |  |
| `from_status` | `varchar(50)` | YES | `NULL` |  |  |
| `to_status` | `varchar(50)` | NO | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `changed_by` | `int(11)` | NO | `NULL` | MUL |  |
| `changed_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `request_id` -> `requests.id` (Constraint: `request_status_history_ibfk_1`)
- `changed_by` -> `users.id` (Constraint: `request_status_history_ibfk_2`)

**Indexes:**
- `INDEX` `changed_by`: `changed_by`
- `INDEX` `idx_request`: `request_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `requests`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `request_number` | `varchar(50)` | NO | `NULL` | UNI |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `status` | `enum('new','reviewing','scheduled','in_progress','completed','cancelled')` | YES | `'new'` | MUL |  |
| `priority` | `enum('low','normal','high','urgent')` | YES | `'normal'` |  |  |
| `request_type` | `varchar(100)` | YES | `NULL` |  |  |
| `service_details` | `text` | YES | `NULL` |  |  |
| `service_address` | `text` | YES | `NULL` |  |  |
| `service_city` | `varchar(100)` | YES | `NULL` |  |  |
| `service_state` | `varchar(50)` | YES | `NULL` |  |  |
| `service_zip` | `varchar(20)` | YES | `NULL` |  |  |
| `requested_date` | `date` | YES | `NULL` |  |  |
| `scheduled_date` | `date` | YES | `NULL` |  |  |
| `scheduled_time_start` | `time` | YES | `NULL` |  |  |
| `scheduled_time_end` | `time` | YES | `NULL` |  |  |
| `assigned_to` | `int(11)` | YES | `NULL` | MUL |  |
| `estimated_cost` | `decimal(10,2)` | YES | `0.00` |  |  |
| `subtotal` | `decimal(10,2)` | YES | `0.00` |  |  |
| `tax_amount` | `decimal(10,2)` | YES | `0.00` |  |  |
| `total` | `decimal(10,2)` | YES | `0.00` |  |  |
| `internal_notes` | `text` | YES | `NULL` |  |  |
| `customer_notes` | `text` | YES | `NULL` |  |  |
| `images` | `longtext` | YES | `NULL` |  |  |
| `on_site_assessment` | `tinyint(1)` | YES | `0` |  |  |
| `assessment_notes` | `text` | YES | `NULL` |  |  |
| `created_by` | `int(11)` | NO | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `requests_ibfk_1`)
- `contact_id` -> `contacts.id` (Constraint: `requests_ibfk_2`)
- `assigned_to` -> `users.id` (Constraint: `requests_ibfk_3`)
- `created_by` -> `users.id` (Constraint: `requests_ibfk_4`)

**Indexes:**
- `INDEX` `created_by`: `created_by`
- `INDEX` `idx_assigned`: `assigned_to`
- `INDEX` `idx_company`: `company_id`
- `INDEX` `idx_contact`: `contact_id`
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `request_number`: `request_number`

---
### Table: `reseller_pricing`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `agency_id` | `int(11)` | NO | `NULL` | MUL |  |
| `price_type` | `enum('plan_markup','per_subaccount','per_user','addon','usage')` | NO | `NULL` | MUL |  |
| `addon_key` | `varchar(50)` | YES | `NULL` |  |  |
| `addon_name` | `varchar(100)` | YES | `NULL` |  |  |
| `base_cost_cents` | `int(11)` | YES | `0` |  |  |
| `markup_type` | `enum('fixed','percentage')` | YES | `'fixed'` |  |  |
| `markup_value` | `decimal(10,2)` | YES | `0.00` |  |  |
| `sell_price_cents` | `int(11)` | YES | `0` |  |  |
| `included_units` | `int(11)` | YES | `0` |  |  |
| `overage_price_cents` | `int(11)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_reseller_agency`: `agency_id`
- `INDEX` `idx_reseller_type`: `price_type`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `revenue_attribution`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `store_id` | `int(11)` | YES | `NULL` |  |  |
| `order_id` | `int(11)` | YES | `NULL` |  |  |
| `contact_id` | `int(11)` | YES | `NULL` |  |  |
| `attribution_type` | `enum('campaign','sequence','automation','form','landing_page')` | NO | `NULL` |  |  |
| `attribution_id` | `int(11)` | NO | `NULL` |  |  |
| `channel` | `enum('email','sms','call','form','landing_page')` | NO | `NULL` |  |  |
| `revenue` | `decimal(10,2)` | NO | `NULL` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `attributed_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `revenue_attribution_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`

---
### Table: `review_platform_configs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `platform` | `enum('google','facebook','yelp','trustpilot','custom')` | NO | `NULL` |  |  |
| `platform_name` | `varchar(100)` | YES | `NULL` |  |  |
| `is_connected` | `tinyint(1)` | YES | `0` |  |  |
| `account_id` | `varchar(255)` | YES | `NULL` |  |  |
| `location_id` | `varchar(255)` | YES | `NULL` |  |  |
| `access_token` | `text` | YES | `NULL` |  |  |
| `refresh_token` | `text` | YES | `NULL` |  |  |
| `token_expires_at` | `datetime` | YES | `NULL` |  |  |
| `review_url` | `varchar(500)` | YES | `NULL` |  |  |
| `auto_sync` | `tinyint(1)` | YES | `1` |  |  |
| `last_synced_at` | `datetime` | YES | `NULL` |  |  |
| `sync_error` | `text` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `priority` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_review_platforms_workspace`: `workspace_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_review_platform`: `workspace_id`, `platform`, `location_id`

---
### Table: `review_platform_connections`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `platform` | `enum('google','facebook','yelp','trustpilot','g2','capterra','custom')` | NO | `NULL` | MUL |  |
| `platform_name` | `varchar(255)` | NO | `NULL` |  |  |
| `access_token` | `text` | YES | `NULL` |  |  |
| `refresh_token` | `text` | YES | `NULL` |  |  |
| `token_expires_at` | `timestamp` | YES | `NULL` |  |  |
| `api_key` | `varchar(255)` | YES | `NULL` |  |  |
| `location_id` | `varchar(255)` | YES | `NULL` |  |  |
| `page_id` | `varchar(255)` | YES | `NULL` |  |  |
| `business_id` | `varchar(255)` | YES | `NULL` |  |  |
| `review_url` | `varchar(500)` | YES | `NULL` |  |  |
| `status` | `enum('active','paused','disconnected','error')` | YES | `'active'` | MUL |  |
| `last_sync_at` | `timestamp` | YES | `NULL` |  |  |
| `sync_frequency_minutes` | `int(11)` | YES | `60` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_platform`: `platform`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `review_platforms`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `client_id` | `int(11)` | YES | `NULL` |  |  |
| `platform` | `enum('google','facebook','yelp','trustpilot','g2','capterra','custom')` | NO | `NULL` |  |  |
| `platform_name` | `varchar(100)` | YES | `NULL` |  |  |
| `place_id` | `varchar(255)` | YES | `NULL` |  |  |
| `page_id` | `varchar(255)` | YES | `NULL` |  |  |
| `api_key` | `varchar(500)` | YES | `NULL` |  |  |
| `access_token` | `text` | YES | `NULL` |  |  |
| `review_url` | `varchar(500)` | YES | `NULL` |  |  |
| `status` | `enum('active','paused','disconnected')` | YES | `'active'` |  |  |
| `last_sync_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | NO | `1` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `review_platforms_ibfk_1`)

**Indexes:**
- `INDEX` `idx_review_platforms_company_id`: `company_id`
- `INDEX` `idx_review_platforms_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`

---
### Table: `review_request_campaigns`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `trigger_type` | `enum('manual','after_job','after_invoice_paid','after_appointment','scheduled')` | YES | `'manual'` |  |  |
| `trigger_delay_hours` | `int(11)` | YES | `24` |  |  |
| `send_email` | `tinyint(1)` | YES | `1` |  |  |
| `send_sms` | `tinyint(1)` | YES | `0` |  |  |
| `email_subject` | `varchar(255)` | YES | `NULL` |  |  |
| `email_body` | `text` | YES | `NULL` |  |  |
| `sms_body` | `varchar(500)` | YES | `NULL` |  |  |
| `review_page_url` | `varchar(500)` | YES | `NULL` |  |  |
| `google_review_url` | `varchar(500)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `total_sent` | `int(11)` | YES | `0` |  |  |
| `total_opened` | `int(11)` | YES | `0` |  |  |
| `total_clicked` | `int(11)` | YES | `0` |  |  |
| `total_reviews` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_campaigns_workspace`: `workspace_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `review_request_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `type` | `varchar(20)` | NO | `NULL` |  |  |
| `channel` | `varchar(20)` | NO | `NULL` |  |  |
| `subject` | `varchar(255)` | YES | `NULL` |  |  |
| `message` | `text` | NO | `NULL` |  |  |
| `variables` | `longtext` | YES | `NULL` |  |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `review_requests`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `client_id` | `int(11)` | YES | `NULL` |  |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `platform_id` | `int(11)` | YES | `NULL` | MUL |  |
| `channel` | `enum('email','sms')` | NO | `NULL` |  |  |
| `status` | `enum('pending','sent','opened','clicked','completed','failed')` | YES | `'pending'` |  |  |
| `sent_at` | `datetime` | YES | `NULL` |  |  |
| `opened_at` | `datetime` | YES | `NULL` |  |  |
| `clicked_at` | `datetime` | YES | `NULL` |  |  |
| `completed_at` | `datetime` | YES | `NULL` |  |  |
| `review_id` | `int(11)` | YES | `NULL` | MUL |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `workspace_id` | `int(11)` | NO | `1` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |
| `review_rating` | `tinyint(4)` | YES | `NULL` |  |  |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `review_requests_ibfk_1`)
- `contact_id` -> `contacts.id` (Constraint: `review_requests_ibfk_2`)
- `platform_id` -> `review_platforms.id` (Constraint: `review_requests_ibfk_3`)
- `review_id` -> `reviews.id` (Constraint: `review_requests_ibfk_4`)

**Indexes:**
- `INDEX` `contact_id`: `contact_id`
- `INDEX` `idx_review_requests_company_id`: `company_id`
- `INDEX` `idx_review_requests_workspace_id`: `workspace_id`
- `INDEX` `platform_id`: `platform_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `review_id`: `review_id`
- `INDEX` `user_id`: `user_id`

---
### Table: `review_response_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `category` | `enum('positive','neutral','negative','general')` | YES | `'general'` | MUL |  |
| `template_text` | `text` | NO | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `usage_count` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_category`: `category`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `review_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `client_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `channel` | `enum('email','sms')` | NO | `NULL` |  |  |
| `subject` | `varchar(255)` | YES | `NULL` |  |  |
| `content` | `text` | NO | `NULL` |  |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `review_templates_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`

---
### Table: `review_widgets`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `type` | `varchar(50)` | YES | `'carousel'` |  |  |
| `platforms` | `longtext` | YES | `NULL` |  |  |
| `min_rating` | `decimal(2,1)` | YES | `4.0` |  |  |
| `max_reviews` | `int(11)` | YES | `10` |  |  |
| `show_ai_summary` | `tinyint(1)` | YES | `0` |  |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `embed_code` | `text` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `reviews`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `platform_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `platform` | `varchar(50)` | YES | `NULL` | MUL |  |
| `external_id` | `varchar(255)` | YES | `NULL` |  |  |
| `reviewer_name` | `varchar(255)` | YES | `NULL` |  |  |
| `author_name` | `varchar(255)` | YES | `NULL` |  |  |
| `author_email` | `varchar(255)` | YES | `NULL` |  |  |
| `reviewer_avatar` | `varchar(500)` | YES | `NULL` |  |  |
| `rating` | `tinyint(4)` | NO | `NULL` | MUL |  |
| `title` | `varchar(500)` | YES | `NULL` |  |  |
| `review_text` | `text` | YES | `NULL` |  |  |
| `content` | `text` | YES | `NULL` |  |  |
| `response` | `text` | YES | `NULL` |  |  |
| `response_date` | `datetime` | YES | `NULL` |  |  |
| `sentiment` | `enum('positive','neutral','negative')` | YES | `'neutral'` | MUL |  |
| `replied` | `tinyint(1)` | YES | `0` | MUL |  |
| `reply_text` | `text` | YES | `NULL` |  |  |
| `reply_date` | `datetime` | YES | `NULL` |  |  |
| `is_spam` | `tinyint(1)` | YES | `0` | MUL |  |
| `source_url` | `text` | YES | `NULL` |  |  |
| `status` | `enum('new','read','responded','flagged','archived')` | YES | `'new'` |  |  |
| `review_date` | `datetime` | YES | `NULL` |  |  |
| `synced_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` | MUL |  |
| `workspace_id` | `int(11)` | NO | `1` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` | MUL |  |

**Foreign Keys:**
- `platform_id` -> `review_platforms.id` (Constraint: `reviews_ibfk_1`)
- `user_id` -> `users.id` (Constraint: `reviews_ibfk_2`)

**Indexes:**
- `INDEX` `idx_contact_id`: `contact_id`
- `INDEX` `idx_is_spam`: `is_spam`
- `INDEX` `idx_platform`: `platform`
- `INDEX` `idx_platform_rep`: `platform`
- `INDEX` `idx_replied`: `replied`
- `INDEX` `idx_reviews_company_id`: `company_id`
- `INDEX` `idx_reviews_created`: `created_at`
- `INDEX` `idx_reviews_platform`: `platform_id`
- `INDEX` `idx_reviews_rating`: `rating`
- `INDEX` `idx_reviews_workspace`: `workspace_id`, `company_id`
- `INDEX` `idx_reviews_workspace_id`: `workspace_id`
- `INDEX` `idx_sentiment`: `sentiment`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_platform_review`: `platform_id`, `external_id`
- `INDEX` `user_id`: `user_id`

---
### Table: `role_permissions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `role_id` | `int(11)` | NO | `NULL` | MUL |  |
| `permission_id` | `int(11)` | NO | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_role_permissions_permission`: `permission_id`
- `INDEX` `idx_role_permissions_role`: `role_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_role_permission`: `role_id`, `permission_id`

---
### Table: `roles`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `name` | `varchar(100)` | NO | `NULL` | UNI |  |
| `description` | `text` | YES | `NULL` |  |  |
| `is_system` | `tinyint(1)` | YES | `0` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_roles_is_system`: `is_system`
- `INDEX` `idx_roles_name`: `name`
- `UNIQUE` `name`: `name`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `sales_content`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `content_type` | `enum('document','presentation','video','case_study','one_pager','battle_card','template','other')` | NO | `'document'` | MUL |  |
| `file_path` | `varchar(500)` | YES | `NULL` |  |  |
| `file_size` | `int(11)` | YES | `NULL` |  |  |
| `mime_type` | `varchar(100)` | YES | `NULL` |  |  |
| `external_url` | `varchar(500)` | YES | `NULL` |  |  |
| `thumbnail_path` | `varchar(500)` | YES | `NULL` |  |  |
| `buyer_personas` | `longtext` | YES | `NULL` |  |  |
| `sales_stages` | `longtext` | YES | `NULL` |  |  |
| `industries` | `longtext` | YES | `NULL` |  |  |
| `products` | `longtext` | YES | `NULL` |  |  |
| `tags` | `longtext` | YES | `NULL` |  |  |
| `version` | `int(11)` | YES | `1` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` | MUL |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_active`: `is_active`
- `INDEX` `idx_created`: `created_at`
- `INDEX` `idx_type`: `content_type`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `sales_content_analytics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `content_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | YES | `NULL` | MUL |  |
| `lead_id` | `int(11)` | YES | `NULL` |  |  |
| `action` | `enum('view','download','share','embed')` | NO | `NULL` |  |  |
| `action_date` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `context` | `longtext` | YES | `NULL` |  |  |

**Foreign Keys:**
- `content_id` -> `sales_content.id` (Constraint: `sales_content_analytics_ibfk_1`)

**Indexes:**
- `INDEX` `idx_content`: `content_id`
- `INDEX` `idx_date`: `action_date`
- `INDEX` `idx_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `sales_playbooks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `category` | `varchar(100)` | YES | `NULL` | MUL |  |
| `target_persona` | `longtext` | YES | `NULL` |  |  |
| `applicable_stages` | `longtext` | YES | `NULL` |  |  |
| `is_published` | `tinyint(1)` | YES | `0` | MUL |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_category`: `category`
- `INDEX` `idx_published`: `is_published`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `sales_snippets`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `snippet_type` | `enum('email','sms','call_script','meeting_agenda','follow_up')` | NO | `'email'` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `shortcut` | `varchar(50)` | YES | `NULL` | MUL |  |
| `content` | `text` | NO | `NULL` |  |  |
| `variables` | `longtext` | YES | `NULL` |  |  |
| `category` | `varchar(100)` | YES | `NULL` | MUL |  |
| `use_count` | `int(11)` | YES | `0` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_category`: `category`
- `INDEX` `idx_shortcut`: `shortcut`
- `INDEX` `idx_type`: `snippet_type`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `sales_tasks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `client_id` | `int(11)` | YES | `NULL` |  |  |
| `assigned_to` | `int(11)` | YES | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `deal_id` | `int(11)` | YES | `NULL` |  |  |
| `project_id` | `int(11)` | YES | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `task_type` | `enum('call','email','sms','meeting','follow_up','demo','proposal','other')` | NO | `NULL` |  |  |
| `priority` | `enum('low','medium','high','urgent')` | YES | `'medium'` |  |  |
| `status` | `enum('pending','in_progress','completed','cancelled','deferred')` | YES | `'pending'` | MUL |  |
| `due_date` | `datetime` | YES | `NULL` | MUL |  |
| `due_time` | `time` | YES | `NULL` |  |  |
| `reminder_at` | `datetime` | YES | `NULL` |  |  |
| `completed_at` | `datetime` | YES | `NULL` |  |  |
| `outcome` | `text` | YES | `NULL` |  |  |
| `outcome_type` | `enum('successful','no_answer','voicemail','rescheduled','not_interested','other')` | YES | `NULL` |  |  |
| `related_entity_type` | `varchar(50)` | YES | `NULL` |  |  |
| `related_entity_id` | `int(11)` | YES | `NULL` |  |  |
| `tags` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |
| `subtasks` | `longtext` | YES | `NULL` |  |  |
| `estimated_hours` | `decimal(10,2)` | YES | `0.00` |  |  |
| `actual_hours` | `decimal(10,2)` | YES | `0.00` |  |  |
| `is_recurring` | `tinyint(1)` | YES | `0` |  |  |
| `recurring_task_id` | `int(11)` | YES | `NULL` |  |  |
| `watchers_count` | `int(11)` | YES | `0` |  |  |
| `attachments_count` | `int(11)` | YES | `0` |  |  |
| `subtasks_count` | `int(11)` | YES | `0` |  |  |
| `completed_subtasks_count` | `int(11)` | YES | `0` |  |  |

**Foreign Keys:**
- `project_id` -> `projects.id` (Constraint: `sales_tasks_ibfk_1`)

**Indexes:**
- `INDEX` `idx_assigned_to`: `assigned_to`
- `INDEX` `idx_contact_id`: `contact_id`
- `INDEX` `idx_due_date`: `due_date`
- `INDEX` `idx_project_id`: `project_id`
- `INDEX` `idx_sales_tasks_workspace`: `workspace_id`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `sales_training_programs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `program_type` | `enum('onboarding','product','skills','certification','custom')` | NO | `'custom'` | MUL |  |
| `duration_days` | `int(11)` | YES | `NULL` |  |  |
| `is_required` | `tinyint(1)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_type`: `program_type`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `saved_filters`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `module` | `varchar(100)` | NO | `NULL` | MUL |  |
| `filters` | `longtext` | NO | `NULL` |  |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `is_shared` | `tinyint(1)` | YES | `0` |  |  |
| `color` | `varchar(7)` | YES | `NULL` |  |  |
| `icon` | `varchar(50)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_saved_filters_module`: `module`
- `INDEX` `idx_saved_filters_user`: `user_id`
- `INDEX` `idx_saved_filters_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `scheduled_jobs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `job_type` | `varchar(100)` | NO | `NULL` |  |  |
| `schedule_type` | `enum('interval','daily','weekly','monthly','cron')` | YES | `'interval'` |  |  |
| `interval_minutes` | `int(11)` | YES | `NULL` |  |  |
| `run_at_time` | `time` | YES | `NULL` |  |  |
| `run_on_day` | `int(11)` | YES | `NULL` |  |  |
| `cron_expression` | `varchar(100)` | YES | `NULL` |  |  |
| `timezone` | `varchar(50)` | YES | `'UTC'` |  |  |
| `payload_template` | `longtext` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` | MUL |  |
| `last_run_at` | `timestamp` | YES | `NULL` |  |  |
| `next_run_at` | `timestamp` | YES | `NULL` |  |  |
| `last_status` | `enum('success','failed')` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_scheduled_next`: `is_active`, `next_run_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `scheduled_report_runs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `report_id` | `int(11)` | NO | `NULL` | MUL |  |
| `scheduled_for` | `datetime` | NO | `NULL` | MUL |  |
| `status` | `enum('pending','running','completed','failed')` | NO | `'pending'` | MUL |  |
| `started_at` | `datetime` | YES | `NULL` |  |  |
| `completed_at` | `datetime` | YES | `NULL` |  |  |
| `recipients_notified` | `int(11)` | NO | `0` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_scheduled_runs_report`: `report_id`
- `INDEX` `idx_scheduled_runs_scheduled`: `scheduled_for`
- `INDEX` `idx_scheduled_runs_status`: `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `scheduled_reports`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `report_type` | `varchar(100)` | NO | `NULL` |  |  |
| `frequency` | `enum('daily','weekly','monthly')` | NO | `NULL` |  |  |
| `recipients` | `longtext` | NO | `NULL` |  |  |
| `filters` | `longtext` | YES | `NULL` |  |  |
| `format` | `enum('pdf','csv','excel')` | YES | `'pdf'` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `last_sent_at` | `timestamp` | YES | `NULL` |  |  |
| `next_send_at` | `timestamp` | YES | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_next_send`: `next_send_at`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `score_changes`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `previous_score` | `int(11)` | NO | `NULL` |  |  |
| `new_score` | `int(11)` | NO | `NULL` |  |  |
| `triggering_signal` | `varchar(50)` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_score_changes_contact`: `contact_id`
- `INDEX` `idx_score_changes_created`: `created_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `secure_sessions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `session_id` | `varchar(255)` | NO | `NULL` | UNI |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `ip_address` | `varchar(45)` | NO | `NULL` |  |  |
| `user_agent` | `text` | NO | `NULL` |  |  |
| `is_active` | `tinyint(1)` | NO | `1` |  |  |
| `last_activity` | `datetime` | NO | `current_timestamp()` | MUL |  |
| `expires_at` | `datetime` | NO | `NULL` | MUL |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `secure_sessions_ibfk_1`)

**Indexes:**
- `INDEX` `idx_expires_at`: `expires_at`
- `INDEX` `idx_last_activity`: `last_activity`
- `INDEX` `idx_session_id`: `session_id`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `session_id`: `session_id`

---
### Table: `security_events`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `type` | `varchar(50)` | NO | `NULL` | MUL |  |
| `severity` | `varchar(20)` | NO | `NULL` |  |  |
| `ip_address` | `varchar(45)` | NO | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_type`: `type`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `segments`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` | MUL |  |
| `description` | `text` | YES | `NULL` |  |  |
| `color` | `varchar(7)` | YES | `'#8b5cf6'` |  |  |
| `icon` | `varchar(50)` | YES | `'filter'` |  |  |
| `filter_criteria` | `longtext` | NO | `NULL` |  |  |
| `match_type` | `enum('all','any')` | YES | `'all'` |  |  |
| `contact_count` | `int(11)` | YES | `0` |  |  |
| `last_calculated_at` | `datetime` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` | MUL |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Indexes:**
- `INDEX` `idx_segments_active`: `is_active`
- `INDEX` `idx_segments_name`: `name`
- `INDEX` `idx_segments_user`: `user_id`
- `INDEX` `idx_segments_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_user_segment_name`: `user_id`, `name`

---
### Table: `send_time_analytics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `channel` | `enum('email','sms')` | NO | `NULL` |  |  |
| `hour_of_day` | `tinyint(4)` | NO | `NULL` |  |  |
| `day_of_week` | `tinyint(4)` | NO | `NULL` |  |  |
| `opens` | `int(11)` | YES | `0` |  |  |
| `clicks` | `int(11)` | YES | `0` |  |  |
| `replies` | `int(11)` | YES | `0` |  |  |
| `total_sent` | `int(11)` | YES | `0` |  |  |
| `engagement_score` | `decimal(5,2)` | YES | `0.00` |  |  |
| `last_updated` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `send_time_analytics_ibfk_1`)
- `contact_id` -> `contacts.id` (Constraint: `send_time_analytics_ibfk_2`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_contact_time`: `contact_id`, `channel`, `hour_of_day`, `day_of_week`
- `INDEX` `user_id`: `user_id`

---
### Table: `sending_accounts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `email` | `varchar(255)` | NO | `NULL` |  |  |
| `provider` | `varchar(100)` | NO | `NULL` |  |  |
| `status` | `varchar(50)` | NO | `NULL` |  |  |
| `daily_limit` | `int(11)` | NO | `100` |  |  |
| `sent_today` | `int(11)` | NO | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `smtp_host` | `varchar(255)` | YES | `NULL` |  |  |
| `smtp_port` | `int(11)` | YES | `587` |  |  |
| `smtp_username` | `varchar(255)` | YES | `NULL` |  |  |
| `smtp_password` | `varchar(255)` | YES | `NULL` |  |  |
| `smtp_encryption` | `varchar(32)` | YES | `'tls'` |  |  |
| `access_token` | `text` | YES | `NULL` |  |  |
| `refresh_token` | `text` | YES | `NULL` |  |  |
| `token_expires_at` | `datetime` | YES | `NULL` |  |  |
| `domain` | `varchar(255)` | YES | `NULL` |  |  |
| `warmup_status` | `varchar(32)` | NO | `'idle'` |  |  |
| `warmup_daily_limit` | `int(11)` | NO | `30` |  |  |
| `warmup_next_run` | `datetime` | YES | `NULL` |  |  |
| `warmup_last_run_at` | `datetime` | YES | `NULL` |  |  |
| `warmup_paused_reason` | `text` | YES | `NULL` |  |  |
| `deliverability_score` | `int(11)` | NO | `100` |  |  |
| `spf_status` | `varchar(32)` | NO | `'unknown'` |  |  |
| `dkim_status` | `varchar(32)` | NO | `'unknown'` |  |  |
| `dmarc_status` | `varchar(32)` | NO | `'unknown'` |  |  |
| `last_dns_check_at` | `datetime` | YES | `NULL` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_sending_accounts_company`: `workspace_id`, `company_id`
- `INDEX` `idx_sending_accounts_workspace`: `workspace_id`, `created_at`
- `INDEX` `idx_sending_accounts_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`

---
### Table: `sentiment_analysis`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `channel` | `varchar(50)` | NO | `NULL` | MUL |  |
| `source_type` | `varchar(50)` | NO | `NULL` | MUL |  |
| `source_id` | `int(11)` | YES | `NULL` |  |  |
| `original_text` | `text` | NO | `NULL` |  |  |
| `sentiment` | `varchar(20)` | NO | `NULL` | MUL |  |
| `confidence_score` | `int(11)` | NO | `NULL` | MUL |  |
| `detected_keywords` | `longtext` | YES | `NULL` |  |  |
| `is_mixed_sentiment` | `tinyint(1)` | YES | `0` |  |  |
| `dominant_emotion` | `varchar(50)` | YES | `NULL` |  |  |
| `analyzed_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_sentiment_channel`: `channel`
- `INDEX` `idx_sentiment_confidence`: `confidence_score`
- `INDEX` `idx_sentiment_contact`: `contact_id`
- `INDEX` `idx_sentiment_result`: `sentiment`
- `INDEX` `idx_sentiment_source`: `source_type`, `source_id`
- `INDEX` `idx_sentiment_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `sentiment_config`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | UNI |  |
| `positive_keywords` | `longtext` | YES | `NULL` |  |  |
| `negative_keywords` | `longtext` | YES | `NULL` |  |  |
| `intent_keywords` | `longtext` | YES | `NULL` |  |  |
| `default_confidence_threshold` | `int(11)` | YES | `70` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `idx_sentiment_config_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `sentiment_config_audit`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `char(36)` | NO | `NULL` | PRI |  |
| `config_id` | `char(36)` | NO | `NULL` | MUL |  |
| `user_id` | `char(36)` | NO | `NULL` | MUL |  |
| `action` | `enum('create','update','delete','enable','disable','rollback')` | NO | `NULL` | MUL |  |
| `previous_version` | `int(10) unsigned` | YES | `NULL` |  |  |
| `new_version` | `int(10) unsigned` | YES | `NULL` |  |  |
| `diff` | `longtext` | YES | `NULL` |  |  |
| `reason` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Foreign Keys:**
- `config_id` -> `sentiment_configs.id` (Constraint: `sentiment_config_audit_ibfk_1`)

**Indexes:**
- `INDEX` `idx_action`: `action`
- `INDEX` `idx_config_id`: `config_id`
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `sentiment_configs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `char(36)` | NO | `NULL` | PRI |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `scope` | `enum('global','workspace','company','campaign','user')` | NO | `'workspace'` | MUL |  |
| `scope_id` | `char(36)` | YES | `NULL` | MUL |  |
| `mode` | `enum('keyword','ml')` | NO | `'keyword'` | MUL |  |
| `version` | `int(10) unsigned` | NO | `1` |  |  |
| `enabled` | `tinyint(1)` | NO | `1` |  |  |
| `model_config` | `longtext` | NO | `NULL` |  |  |
| `threshold_config` | `longtext` | NO | `NULL` |  |  |
| `label_mapping` | `longtext` | YES | `NULL` |  |  |
| `derived_metrics_config` | `longtext` | YES | `NULL` |  |  |
| `sampling_config` | `longtext` | YES | `NULL` |  |  |
| `feedback_config` | `longtext` | YES | `NULL` |  |  |
| `drift_detection_config` | `longtext` | YES | `NULL` |  |  |
| `parent_config_id` | `char(36)` | YES | `NULL` | MUL |  |
| `created_by` | `char(36)` | NO | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `deleted_at` | `timestamp` | YES | `NULL` | MUL |  |

**Foreign Keys:**
- `parent_config_id` -> `sentiment_configs.id` (Constraint: `sentiment_configs_ibfk_1`)

**Indexes:**
- `INDEX` `idx_created_by`: `created_by`
- `INDEX` `idx_deleted_at`: `deleted_at`
- `INDEX` `idx_mode`: `mode`
- `INDEX` `idx_scope_enabled`: `scope`, `enabled`
- `INDEX` `idx_scope_id`: `scope_id`
- `INDEX` `parent_config_id`: `parent_config_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `sentiment_feedback`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `char(36)` | NO | `NULL` | PRI |  |
| `prediction_id` | `char(36)` | NO | `NULL` | MUL |  |
| `config_id` | `char(36)` | NO | `NULL` | MUL |  |
| `user_label` | `enum('positive','neutral','negative','mixed')` | NO | `NULL` |  |  |
| `user_confidence` | `decimal(5,4)` | YES | `NULL` |  |  |
| `user_id` | `char(36)` | NO | `NULL` | MUL |  |
| `review_status` | `enum('pending','accepted','rejected')` | NO | `'pending'` | MUL |  |
| `reviewed_by` | `char(36)` | YES | `NULL` |  |  |
| `reviewed_at` | `timestamp` | YES | `NULL` |  |  |
| `included_in_training` | `tinyint(1)` | YES | `0` | MUL |  |
| `training_batch_id` | `varchar(100)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `prediction_id` -> `sentiment_predictions.id` (Constraint: `sentiment_feedback_ibfk_1`)
- `config_id` -> `sentiment_configs.id` (Constraint: `sentiment_feedback_ibfk_2`)

**Indexes:**
- `INDEX` `idx_config_id`: `config_id`
- `INDEX` `idx_included_in_training`: `included_in_training`
- `INDEX` `idx_prediction_id`: `prediction_id`
- `INDEX` `idx_review_status`: `review_status`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `sentiment_metrics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `char(36)` | NO | `NULL` | PRI |  |
| `config_id` | `char(36)` | NO | `NULL` | MUL |  |
| `date` | `date` | NO | `NULL` | MUL |  |
| `metric_name` | `varchar(100)` | NO | `NULL` | MUL |  |
| `metric_value` | `decimal(10,4)` | NO | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `config_id` -> `sentiment_configs.id` (Constraint: `sentiment_metrics_ibfk_1`)

**Indexes:**
- `INDEX` `idx_config_date`: `config_id`, `date`
- `INDEX` `idx_date`: `date`
- `INDEX` `idx_metric_name`: `metric_name`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_config_date_metric`: `config_id`, `date`, `metric_name`

---
### Table: `sentiment_predictions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `char(36)` | NO | `NULL` | PRI |  |
| `config_id` | `char(36)` | NO | `NULL` | MUL |  |
| `contact_id` | `char(36)` | YES | `NULL` | MUL |  |
| `channel` | `varchar(50)` | NO | `NULL` | MUL |  |
| `text` | `text` | NO | `NULL` |  |  |
| `label` | `enum('positive','neutral','negative','mixed')` | NO | `NULL` | MUL |  |
| `score` | `decimal(5,4)` | NO | `NULL` |  |  |
| `confidence` | `decimal(5,4)` | NO | `NULL` | MUL |  |
| `raw_response` | `longtext` | YES | `NULL` |  |  |
| `derived_metrics` | `longtext` | YES | `NULL` |  |  |
| `model_provider` | `varchar(50)` | NO | `NULL` |  |  |
| `model_version` | `varchar(100)` | YES | `NULL` |  |  |
| `processing_time_ms` | `int(10) unsigned` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Foreign Keys:**
- `config_id` -> `sentiment_configs.id` (Constraint: `sentiment_predictions_ibfk_1`)

**Indexes:**
- `INDEX` `idx_channel`: `channel`
- `INDEX` `idx_confidence`: `confidence`
- `INDEX` `idx_config_id`: `config_id`
- `INDEX` `idx_contact_id`: `contact_id`
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_label`: `label`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `sentiment_training_batches`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `char(36)` | NO | `NULL` | PRI |  |
| `config_id` | `char(36)` | NO | `NULL` | MUL |  |
| `batch_name` | `varchar(255)` | YES | `NULL` |  |  |
| `status` | `enum('pending','training','evaluating','completed','failed','cancelled')` | NO | `'pending'` | MUL |  |
| `sample_count` | `int(10) unsigned` | NO | `NULL` |  |  |
| `training_start_date` | `date` | YES | `NULL` |  |  |
| `training_end_date` | `date` | YES | `NULL` |  |  |
| `accuracy` | `decimal(5,4)` | YES | `NULL` |  |  |
| `precision_score` | `decimal(5,4)` | YES | `NULL` |  |  |
| `recall_score` | `decimal(5,4)` | YES | `NULL` |  |  |
| `f1_score` | `decimal(5,4)` | YES | `NULL` |  |  |
| `model_version` | `varchar(100)` | YES | `NULL` |  |  |
| `model_artifact_url` | `text` | YES | `NULL` |  |  |
| `deployed` | `tinyint(1)` | YES | `0` | MUL |  |
| `deployed_at` | `timestamp` | YES | `NULL` |  |  |
| `created_by` | `char(36)` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `config_id` -> `sentiment_configs.id` (Constraint: `sentiment_training_batches_ibfk_1`)

**Indexes:**
- `INDEX` `idx_config_id`: `config_id`
- `INDEX` `idx_deployed`: `deployed`
- `INDEX` `idx_status`: `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `seo_audits`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` | MUL |  |
| `page_id` | `int(11)` | YES | `NULL` | MUL |  |
| `url` | `text` | NO | `NULL` |  |  |
| `audit_type` | `varchar(50)` | YES | `'full'` | MUL |  |
| `status` | `varchar(50)` | NO | `'pending'` | MUL |  |
| `seo_score` | `int(11)` | YES | `NULL` |  |  |
| `technical_score` | `int(11)` | YES | `0` |  |  |
| `content_score` | `int(11)` | YES | `0` |  |  |
| `performance_score` | `int(11)` | YES | `NULL` |  |  |
| `accessibility_score` | `int(11)` | YES | `NULL` |  |  |
| `report_data` | `longtext` | YES | `NULL` |  |  |
| `issues_count` | `int(11)` | YES | `0` |  |  |
| `warnings_count` | `int(11)` | YES | `0` |  |  |
| `started_at` | `timestamp` | YES | `NULL` |  |  |
| `finished_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `page_id` -> `seo_pages.id` (Constraint: `seo_audits_ibfk_1`)

**Indexes:**
- `INDEX` `idx_audit_type`: `audit_type`
- `INDEX` `idx_company`: `company_id`
- `INDEX` `idx_page`: `page_id`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `seo_backlinks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(10) unsigned` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `company_id` | `int(10) unsigned` | NO | `NULL` | MUL |  |
| `source_url` | `text` | NO | `NULL` |  |  |
| `source_domain` | `varchar(255)` | NO | `NULL` | MUL |  |
| `target_url` | `text` | NO | `NULL` |  |  |
| `anchor_text` | `text` | YES | `NULL` |  |  |
| `link_type` | `varchar(50)` | YES | `'dofollow'` | MUL |  |
| `domain_authority` | `int(11)` | YES | `NULL` | MUL |  |
| `page_authority` | `int(11)` | YES | `NULL` |  |  |
| `first_seen_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `last_seen_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `status` | `varchar(50)` | YES | `'active'` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_company`: `company_id`
- `INDEX` `idx_domain_authority`: `domain_authority`
- `INDEX` `idx_link_type`: `link_type`
- `INDEX` `idx_source_domain`: `source_domain`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `seo_competitors`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `domain` | `varchar(255)` | NO | `NULL` |  |  |
| `domain_authority` | `int(11)` | YES | `NULL` |  |  |
| `organic_traffic` | `int(11)` | YES | `NULL` |  |  |
| `keywords_count` | `int(11)` | YES | `NULL` |  |  |
| `backlinks_count` | `int(11)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `last_checked_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_competitors_workspace`: `workspace_id`, `is_active`
- `INDEX` `idx_seo_competitors_company`: `workspace_id`, `company_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_domain`: `workspace_id`, `domain`

---
### Table: `seo_keyword_history`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `keyword_id` | `int(11)` | NO | `NULL` | MUL |  |
| `position` | `int(11)` | YES | `NULL` |  |  |
| `url` | `varchar(500)` | YES | `NULL` |  |  |
| `checked_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `keyword_id` -> `seo_keywords.id` (Constraint: `seo_keyword_history_ibfk_1`)

**Indexes:**
- `INDEX` `idx_keyword_history`: `keyword_id`, `checked_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `seo_keywords`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `keyword` | `varchar(255)` | NO | `NULL` |  |  |
| `search_volume` | `int(11)` | YES | `NULL` | MUL |  |
| `difficulty` | `int(11)` | YES | `NULL` |  |  |
| `current_position` | `int(11)` | YES | `NULL` |  |  |
| `previous_position` | `int(11)` | YES | `NULL` |  |  |
| `best_position` | `int(11)` | YES | `NULL` |  |  |
| `target_url` | `varchar(500)` | YES | `NULL` |  |  |
| `is_tracked` | `tinyint(1)` | YES | `1` |  |  |
| `location` | `varchar(100)` | YES | `NULL` |  |  |
| `last_checked_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `keyword_difficulty` | `int(11)` | YES | `NULL` | MUL |  |
| `cpc` | `decimal(10,2)` | YES | `NULL` |  |  |
| `competition` | `varchar(50)` | YES | `NULL` | MUL |  |
| `serp_features` | `longtext` | YES | `NULL` |  |  |
| `trend_data` | `longtext` | YES | `NULL` |  |  |
| `parent_keyword` | `varchar(500)` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_competition`: `competition`
- `INDEX` `idx_keywords_workspace`: `workspace_id`, `is_tracked`
- `INDEX` `idx_keyword_difficulty`: `keyword_difficulty`
- `INDEX` `idx_search_volume`: `search_volume`
- `INDEX` `idx_seo_keywords_company`: `workspace_id`, `company_id`, `is_tracked`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_keyword_location`: `workspace_id`, `keyword`, `location`

---
### Table: `seo_pages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `url` | `varchar(500)` | NO | `NULL` |  |  |
| `title` | `varchar(255)` | YES | `NULL` |  |  |
| `meta_description` | `text` | YES | `NULL` |  |  |
| `seo_score` | `int(11)` | YES | `NULL` |  |  |
| `page_speed_score` | `int(11)` | YES | `NULL` |  |  |
| `mobile_score` | `int(11)` | YES | `NULL` |  |  |
| `issues` | `longtext` | YES | `NULL` |  |  |
| `word_count` | `int(11)` | YES | `NULL` |  |  |
| `h1_count` | `int(11)` | YES | `NULL` |  |  |
| `image_count` | `int(11)` | YES | `NULL` |  |  |
| `images_without_alt` | `int(11)` | YES | `NULL` |  |  |
| `internal_links` | `int(11)` | YES | `NULL` |  |  |
| `external_links` | `int(11)` | YES | `NULL` |  |  |
| `last_crawled_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_pages_workspace`: `workspace_id`, `seo_score`
- `INDEX` `idx_seo_pages_company`: `workspace_id`, `company_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_url`: `workspace_id`, `url`

---
### Table: `seo_reports`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `report_type` | `varchar(50)` | YES | `'one-time'` |  |  |
| `frequency` | `varchar(50)` | YES | `NULL` |  |  |
| `email_recipients` | `longtext` | YES | `NULL` |  |  |
| `modules` | `longtext` | YES | `NULL` |  |  |
| `status` | `varchar(50)` | YES | `'draft'` |  |  |
| `last_generated_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `workspace_id`: `workspace_id`, `company_id`

---
### Table: `seo_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `setting_key` | `varchar(100)` | NO | `NULL` |  |  |
| `setting_value` | `longtext` | YES | `NULL` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `workspace_id`: `workspace_id`, `company_id`, `setting_key`

---
### Table: `sequence_executions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `sequence_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `current_step` | `int(11)` | YES | `0` |  |  |
| `status` | `enum('active','paused','completed','failed')` | YES | `'active'` | MUL |  |
| `started_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |
| `last_step_at` | `timestamp` | YES | `NULL` |  |  |
| `next_step_at` | `timestamp` | YES | `NULL` | MUL |  |

**Indexes:**
- `INDEX` `contact_id`: `contact_id`
- `INDEX` `idx_sequence_executions_contact`: `contact_id`
- `INDEX` `idx_sequence_executions_next`: `next_step_at`
- `INDEX` `idx_sequence_executions_sequence`: `sequence_id`
- `INDEX` `idx_sequence_executions_status`: `status`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_sequence_contact`: `sequence_id`, `contact_id`

---
### Table: `sequence_step_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `execution_id` | `int(11)` | NO | `NULL` | MUL |  |
| `step_index` | `int(11)` | NO | `NULL` |  |  |
| `step_type` | `enum('email','sms','linkedin_connect','linkedin_message','call')` | NO | `NULL` |  |  |
| `status` | `enum('pending','sent','delivered','opened','clicked','replied','failed')` | YES | `'pending'` | MUL |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `executed_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_step_logs_execution`: `execution_id`
- `INDEX` `idx_step_logs_status`: `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `sequence_steps`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `sequence_id` | `int(11)` | NO | `NULL` | MUL |  |
| `subject` | `varchar(500)` | NO | `NULL` |  |  |
| `content` | `text` | NO | `NULL` |  |  |
| `delay_days` | `int(11)` | NO | `0` |  |  |
| `step_order` | `int(11)` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_sequence_steps_order`: `sequence_id`, `step_order`
- `INDEX` `idx_sequence_steps_sequence_id`: `sequence_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `sequences`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `type` | `enum('email','sms','mixed')` | YES | `'email'` | MUL |  |
| `status` | `enum('draft','active','paused','archived')` | YES | `'draft'` | MUL |  |
| `trigger_type` | `varchar(100)` | YES | `NULL` |  |  |
| `trigger_conditions` | `longtext` | YES | `NULL` |  |  |
| `steps` | `longtext` | YES | `NULL` |  |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `enrolled_count` | `int(11)` | YES | `0` |  |  |
| `completed_count` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_sequences_status`: `status`
- `INDEX` `idx_sequences_type`: `type`
- `INDEX` `idx_sequences_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `service_areas`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `area_type` | `enum('radius','postal','city','region','polygon')` | YES | `'radius'` |  |  |
| `city` | `varchar(191)` | YES | `NULL` |  |  |
| `region` | `varchar(191)` | YES | `NULL` |  |  |
| `country` | `varchar(64)` | YES | `'US'` |  |  |
| `postal_code` | `varchar(32)` | YES | `NULL` |  |  |
| `latitude` | `decimal(10,7)` | YES | `NULL` |  |  |
| `longitude` | `decimal(10,7)` | YES | `NULL` |  |  |
| `radius_km` | `decimal(6,2)` | YES | `25.00` |  |  |
| `polygon_geojson` | `longtext` | YES | `NULL` |  |  |
| `is_primary` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `center_latitude` | `decimal(10,7)` | YES | `NULL` |  |  |
| `center_longitude` | `decimal(10,7)` | YES | `NULL` |  |  |
| `geocoded_at` | `datetime` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_service_areas_company`: `workspace_id`, `company_id`
- `INDEX` `idx_service_areas_coords`: `workspace_id`, `latitude`, `longitude`
- `INDEX` `idx_service_areas_postal`: `workspace_id`, `postal_code`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `service_catalog`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `parent_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(191)` | NO | `NULL` |  |  |
| `slug` | `varchar(191)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `icon` | `varchar(64)` | YES | `NULL` |  |  |
| `attributes` | `longtext` | YES | `NULL` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_service_catalog_active`: `workspace_id`, `is_active`
- `INDEX` `idx_service_catalog_parent`: `workspace_id`, `parent_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uq_service_catalog_slug`: `workspace_id`, `slug`

---
### Table: `service_categories`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `industry_type_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `icon` | `varchar(50)` | YES | `NULL` |  |  |
| `color` | `varchar(20)` | YES | `NULL` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_service_categories_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `service_pro_offerings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `service_id` | `int(11)` | NO | `NULL` |  |  |
| `min_price` | `decimal(10,2)` | YES | `NULL` |  |  |
| `max_price` | `decimal(10,2)` | YES | `NULL` |  |  |
| `price_type` | `enum('fixed','hourly','estimate','free')` | YES | `'estimate'` |  |  |
| `experience_years` | `int(11)` | YES | `NULL` |  |  |
| `certifications` | `longtext` | YES | `NULL` |  |  |
| `is_featured` | `tinyint(1)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_pro_offerings_service`: `workspace_id`, `service_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uq_pro_offerings`: `workspace_id`, `company_id`, `service_id`

---
### Table: `service_pros`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `user_id` | `int(11)` | YES | `NULL` |  |  |
| `business_name` | `varchar(191)` | YES | `NULL` |  |  |
| `contact_name` | `varchar(191)` | YES | `NULL` |  |  |
| `contact_email` | `varchar(191)` | YES | `NULL` |  |  |
| `contact_phone` | `varchar(64)` | YES | `NULL` |  |  |
| `bio` | `text` | YES | `NULL` |  |  |
| `logo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `website_url` | `varchar(500)` | YES | `NULL` |  |  |
| `years_in_business` | `int(11)` | YES | `NULL` |  |  |
| `license_number` | `varchar(100)` | YES | `NULL` |  |  |
| `insurance_verified` | `tinyint(1)` | YES | `0` |  |  |
| `background_checked` | `tinyint(1)` | YES | `0` |  |  |
| `avg_rating` | `decimal(3,2)` | YES | `0.00` |  |  |
| `total_reviews` | `int(11)` | YES | `0` |  |  |
| `total_leads_received` | `int(11)` | YES | `0` |  |  |
| `total_leads_accepted` | `int(11)` | YES | `0` |  |  |
| `total_leads_won` | `int(11)` | YES | `0` |  |  |
| `response_time_avg_minutes` | `int(11)` | YES | `NULL` |  |  |
| `status` | `enum('pending','active','paused','suspended')` | YES | `'pending'` |  |  |
| `verified_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_service_pros_rating`: `workspace_id`, `avg_rating`
- `INDEX` `idx_service_pros_status`: `workspace_id`, `status`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uq_service_pros_company`: `workspace_id`, `company_id`

---
### Table: `service_zones`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `zone_type` | `enum('polygon','radius','zip_codes')` | YES | `'polygon'` |  |  |
| `zone_data` | `longtext` | YES | `NULL` |  |  |
| `color` | `varchar(20)` | YES | `'#3b82f6'` |  |  |
| `assigned_team_id` | `int(11)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_zone_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `services`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | YES | `NULL` |  |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `category_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `duration_minutes` | `int(11)` | YES | `60` |  |  |
| `buffer_before_minutes` | `int(11)` | YES | `0` |  |  |
| `buffer_after_minutes` | `int(11)` | YES | `0` |  |  |
| `max_bookings_per_slot` | `int(11)` | YES | `1` |  |  |
| `price` | `decimal(10,2)` | YES | `NULL` |  |  |
| `price_type` | `enum('fixed','hourly','estimate','free')` | YES | `'fixed'` |  |  |
| `deposit_required` | `tinyint(1)` | YES | `0` |  |  |
| `deposit_amount` | `decimal(10,2)` | YES | `NULL` |  |  |
| `deposit_percentage` | `int(11)` | YES | `NULL` |  |  |
| `buffer_before` | `int(11)` | YES | `0` |  |  |
| `buffer_after` | `int(11)` | YES | `0` |  |  |
| `max_bookings_per_day` | `int(11)` | YES | `NULL` |  |  |
| `requires_confirmation` | `tinyint(1)` | YES | `0` |  |  |
| `allow_online_booking` | `tinyint(1)` | YES | `1` |  |  |
| `intake_form_id` | `int(11)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `category_id`: `category_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `user_id` | `int(11)` | NO | `NULL` | PRI |  |
| `data` | `text` | NO | `NULL` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Indexes:**
- `INDEX` `idx_settings_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `user_id`

---
### Table: `shift_leave_conflicts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `shift_id` | `int(11)` | NO | `NULL` | MUL |  |
| `leave_request_id` | `int(11)` | NO | `NULL` | MUL |  |
| `conflict_type` | `enum('overlap','partial','adjacent')` | YES | `'overlap'` |  |  |
| `resolution_status` | `enum('pending','shift_moved','leave_cancelled','approved_override')` | YES | `'pending'` |  |  |
| `resolved_by` | `int(11)` | YES | `NULL` |  |  |
| `resolved_at` | `datetime` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_conflict_leave`: `leave_request_id`
- `INDEX` `idx_conflict_shift`: `shift_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `shift_swap_requests`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `original_shift_id` | `int(11)` | NO | `NULL` | MUL |  |
| `target_shift_id` | `int(11)` | NO | `NULL` | MUL |  |
| `reason` | `text` | YES | `NULL` |  |  |
| `status` | `enum('pending','approved','rejected','cancelled')` | YES | `'pending'` | MUL |  |
| `responded_at` | `datetime` | YES | `NULL` |  |  |
| `responded_by` | `int(11)` | YES | `NULL` | MUL |  |
| `rejection_reason` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `shift_swap_requests_ibfk_1`)
- `original_shift_id` -> `shifts.id` (Constraint: `shift_swap_requests_ibfk_2`)
- `target_shift_id` -> `shifts.id` (Constraint: `shift_swap_requests_ibfk_3`)
- `responded_by` -> `users.id` (Constraint: `shift_swap_requests_ibfk_4`)

**Indexes:**
- `INDEX` `idx_original_shift`: `original_shift_id`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_target_shift`: `target_shift_id`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `responded_by`: `responded_by`

---
### Table: `shift_types`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `color` | `varchar(7)` | YES | `'#3B82F6'` |  |  |
| `default_start_time` | `time` | YES | `NULL` |  |  |
| `default_end_time` | `time` | YES | `NULL` |  |  |
| `default_break_minutes` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `shift_types_ibfk_1`)

**Indexes:**
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_shift_type`: `workspace_id`, `name`

---
### Table: `shifts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `shift_type_id` | `int(11)` | YES | `NULL` | MUL |  |
| `shift_date` | `date` | NO | `NULL` | MUL |  |
| `start_time` | `time` | NO | `NULL` |  |  |
| `end_time` | `time` | NO | `NULL` |  |  |
| `break_duration_minutes` | `int(11)` | YES | `0` |  |  |
| `location` | `varchar(255)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `status` | `enum('scheduled','confirmed','in_progress','completed','cancelled','no_show')` | YES | `'scheduled'` | MUL |  |
| `created_by` | `int(11)` | YES | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `shifts_ibfk_1`)
- `user_id` -> `users.id` (Constraint: `shifts_ibfk_2`)
- `shift_type_id` -> `shift_types.id` (Constraint: `shifts_ibfk_3`)
- `created_by` -> `users.id` (Constraint: `shifts_ibfk_4`)

**Indexes:**
- `INDEX` `created_by`: `created_by`
- `INDEX` `idx_date`: `shift_date`
- `INDEX` `idx_shift_type`: `shift_type_id`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_user`: `user_id`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `signal_weights`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | UNI |  |
| `email_opens` | `int(11)` | YES | `5` |  |  |
| `link_clicks` | `int(11)` | YES | `10` |  |  |
| `call_duration` | `int(11)` | YES | `15` |  |  |
| `form_submissions` | `int(11)` | YES | `20` |  |  |
| `reply_sentiment` | `int(11)` | YES | `25` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_user_weights`: `user_id`

---
### Table: `sla_policies`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `first_response_low` | `int(11)` | YES | `480` |  |  |
| `first_response_normal` | `int(11)` | YES | `240` |  |  |
| `first_response_high` | `int(11)` | YES | `60` |  |  |
| `first_response_urgent` | `int(11)` | YES | `15` |  |  |
| `resolution_low` | `int(11)` | YES | `2880` |  |  |
| `resolution_normal` | `int(11)` | YES | `1440` |  |  |
| `resolution_high` | `int(11)` | YES | `480` |  |  |
| `resolution_urgent` | `int(11)` | YES | `120` |  |  |
| `use_business_hours` | `tinyint(1)` | YES | `1` |  |  |
| `business_hours` | `longtext` | YES | `NULL` |  |  |
| `timezone` | `varchar(50)` | YES | `'America/New_York'` |  |  |
| `escalation_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `escalation_rules` | `longtext` | YES | `NULL` |  |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `priority_low_response_time` | `int(11)` | YES | `480` |  |  |
| `priority_low_resolution_time` | `int(11)` | YES | `2880` |  |  |
| `priority_medium_response_time` | `int(11)` | YES | `240` |  |  |
| `priority_medium_resolution_time` | `int(11)` | YES | `1440` |  |  |
| `priority_high_response_time` | `int(11)` | YES | `120` |  |  |
| `priority_high_resolution_time` | `int(11)` | YES | `480` |  |  |
| `priority_urgent_response_time` | `int(11)` | YES | `60` |  |  |
| `priority_urgent_resolution_time` | `int(11)` | YES | `240` |  |  |

**Indexes:**
- `INDEX` `idx_sla_policies_workspace`: `workspace_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `sms_accounts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `provider` | `varchar(50)` | YES | `'signalwire'` | MUL |  |
| `account_sid` | `varchar(255)` | YES | `NULL` |  |  |
| `auth_token` | `varchar(255)` | YES | `NULL` |  |  |
| `phone_number` | `varchar(50)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_provider`: `provider`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `sms_analytics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `message` | `text` | YES | `NULL` |  |  |
| `recipient` | `varchar(255)` | YES | `NULL` |  |  |
| `status` | `varchar(50)` | YES | `'sent'` |  |  |
| `campaign_id` | `int(11)` | YES | `NULL` | MUL |  |
| `sequence_id` | `int(11)` | YES | `NULL` | MUL |  |
| `date` | `date` | NO | `NULL` | MUL |  |
| `sent_count` | `int(11)` | YES | `0` |  |  |
| `delivered_count` | `int(11)` | YES | `0` |  |  |
| `failed_count` | `int(11)` | YES | `0` |  |  |
| `reply_count` | `int(11)` | YES | `0` |  |  |
| `opt_out_count` | `int(11)` | YES | `0` |  |  |
| `total_cost` | `decimal(10,4)` | YES | `0.0000` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `campaign_id`: `campaign_id`
- `INDEX` `idx_sms_analytics_date`: `date`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `sequence_id`: `sequence_id`
- `UNIQUE` `unique_analytics`: `user_id`, `campaign_id`, `sequence_id`, `date`

---
### Table: `sms_campaigns`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `group_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `message` | `text` | NO | `NULL` |  |  |
| `sender_id` | `varchar(50)` | YES | `NULL` |  |  |
| `status` | `varchar(50)` | NO | `'draft'` |  |  |
| `recipient_method` | `varchar(50)` | NO | `'all'` |  |  |
| `recipient_tags` | `text` | YES | `NULL` |  |  |
| `scheduled_at` | `datetime` | YES | `NULL` |  |  |
| `throttle_rate` | `int(11)` | YES | `1` |  |  |
| `throttle_unit` | `varchar(20)` | YES | `'minute'` |  |  |
| `enable_retry` | `tinyint(1)` | YES | `0` |  |  |
| `retry_attempts` | `int(11)` | YES | `3` |  |  |
| `respect_quiet_hours` | `tinyint(1)` | YES | `1` |  |  |
| `quiet_hours_start` | `time` | YES | `'22:00:00'` |  |  |
| `quiet_hours_end` | `time` | YES | `'08:00:00'` |  |  |
| `total_recipients` | `int(11)` | YES | `0` |  |  |
| `sent_count` | `int(11)` | YES | `0` |  |  |
| `delivered_count` | `int(11)` | YES | `0` |  |  |
| `failed_count` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `sequence_id` | `int(11)` | YES | `NULL` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `ab_test_id` | `int(11)` | YES | `NULL` | MUL |  |
| `follow_up_messages` | `longtext` | YES | `NULL` |  |  |

**Foreign Keys:**
- `group_id` -> `groups.id` (Constraint: `sms_campaigns_ibfk_1`)

**Indexes:**
- `INDEX` `group_id`: `group_id`
- `INDEX` `group_id_2`: `group_id`
- `INDEX` `idx_sms_campaigns_ab_test_id`: `ab_test_id`
- `INDEX` `idx_sms_campaigns_company`: `workspace_id`, `company_id`
- `INDEX` `idx_sms_campaigns_user_status`: `user_id`, `status`
- `INDEX` `idx_sms_campaigns_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `sms_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `user_id` | `int(11)` | YES | `NULL` | MUL |  |
| `to_phone` | `varchar(50)` | YES | `NULL` |  |  |
| `message` | `text` | YES | `NULL` |  |  |
| `type` | `varchar(50)` | YES | `NULL` |  |  |
| `status` | `varchar(50)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_contact_id`: `contact_id`
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `sms_messages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `campaign_id` | `int(11)` | YES | `NULL` | MUL |  |
| `sequence_id` | `int(11)` | YES | `NULL` | MUL |  |
| `sequence_step_id` | `int(11)` | YES | `NULL` | MUL |  |
| `recipient_id` | `int(11)` | NO | `NULL` | MUL |  |
| `phone_number` | `varchar(20)` | NO | `NULL` |  |  |
| `message` | `text` | NO | `NULL` |  |  |
| `sender_id` | `varchar(50)` | YES | `NULL` |  |  |
| `status` | `varchar(50)` | NO | `'pending'` | MUL |  |
| `external_id` | `varchar(255)` | YES | `NULL` |  |  |
| `delivery_status` | `varchar(50)` | YES | `NULL` |  |  |
| `delivery_timestamp` | `datetime` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `cost` | `decimal(10,4)` | YES | `0.0000` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Indexes:**
- `INDEX` `idx_sms_messages_campaign`: `campaign_id`
- `INDEX` `idx_sms_messages_recipient`: `recipient_id`
- `INDEX` `idx_sms_messages_status`: `status`
- `INDEX` `idx_sms_messages_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `sequence_id`: `sequence_id`
- `INDEX` `sequence_step_id`: `sequence_step_id`
- `INDEX` `user_id`: `user_id`

---
### Table: `sms_recipients`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `phone_number` | `varchar(20)` | NO | `NULL` | MUL |  |
| `first_name` | `varchar(255)` | YES | `NULL` |  |  |
| `last_name` | `varchar(255)` | YES | `NULL` |  |  |
| `email` | `varchar(255)` | YES | `NULL` |  |  |
| `company` | `varchar(255)` | YES | `NULL` |  |  |
| `tags` | `text` | YES | `NULL` |  |  |
| `status` | `varchar(50)` | NO | `'active'` | MUL |  |
| `opt_in_status` | `varchar(50)` | NO | `'pending'` | MUL |  |
| `opt_in_date` | `datetime` | YES | `NULL` |  |  |
| `opt_out_date` | `datetime` | YES | `NULL` |  |  |
| `last_activity` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `custom_fields` | `longtext` | YES | `NULL` |  |  |
| `group_id` | `int(11)` | YES | `NULL` | MUL |  |
| `campaign_id` | `int(11)` | YES | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Indexes:**
- `INDEX` `campaign_id`: `campaign_id`
- `INDEX` `idx_sms_recipients_campaign`: `campaign_id`
- `INDEX` `idx_sms_recipients_group_id`: `group_id`
- `INDEX` `idx_sms_recipients_opt_in`: `opt_in_status`
- `INDEX` `idx_sms_recipients_phone`: `phone_number`
- `INDEX` `idx_sms_recipients_status`: `status`
- `INDEX` `idx_sms_recipients_user_status`: `user_id`, `status`
- `INDEX` `idx_sms_recipients_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_user_phone`: `user_id`, `phone_number`

---
### Table: `sms_replies`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `campaign_id` | `int(11)` | YES | `NULL` | MUL |  |
| `recipient_id` | `int(11)` | YES | `NULL` | MUL |  |
| `phone_number` | `varchar(20)` | NO | `NULL` |  |  |
| `message` | `text` | NO | `NULL` |  |  |
| `sender_id` | `varchar(50)` | YES | `NULL` |  |  |
| `external_id` | `varchar(255)` | YES | `NULL` |  |  |
| `is_read` | `tinyint(1)` | YES | `0` |  |  |
| `is_starred` | `tinyint(1)` | YES | `0` |  |  |
| `is_archived` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Indexes:**
- `INDEX` `idx_sms_replies_campaign`: `campaign_id`
- `INDEX` `idx_sms_replies_user`: `user_id`
- `INDEX` `idx_sms_replies_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `recipient_id`: `recipient_id`

---
### Table: `sms_scheduled_messages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `campaign_id` | `int(11)` | NO | `NULL` | MUL |  |
| `sequence_id` | `int(11)` | NO | `NULL` | MUL |  |
| `step_id` | `int(11)` | NO | `NULL` | MUL |  |
| `recipient_id` | `int(11)` | NO | `NULL` | MUL |  |
| `phone_number` | `varchar(20)` | NO | `NULL` |  |  |
| `message` | `text` | NO | `NULL` |  |  |
| `scheduled_at` | `datetime` | NO | `NULL` | MUL |  |
| `sent_at` | `datetime` | YES | `NULL` | MUL |  |
| `status` | `varchar(20)` | YES | `'pending'` | MUL |  |
| `external_id` | `varchar(100)` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_sms_scheduled_messages_campaign_id`: `campaign_id`
- `INDEX` `idx_sms_scheduled_messages_scheduled_at`: `scheduled_at`
- `INDEX` `idx_sms_scheduled_messages_sent_at`: `sent_at`
- `INDEX` `idx_sms_scheduled_messages_status`: `status`
- `UNIQUE` `idx_sms_scheduled_messages_unique`: `campaign_id`, `step_id`, `recipient_id`
- `INDEX` `idx_sms_scheduled_messages_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `recipient_id`: `recipient_id`
- `INDEX` `sequence_id`: `sequence_id`
- `INDEX` `step_id`: `step_id`

---
### Table: `sms_sending_accounts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `phone_number` | `varchar(20)` | NO | `NULL` |  |  |
| `provider` | `varchar(50)` | NO | `'signalwire'` |  |  |
| `status` | `varchar(50)` | NO | `'active'` |  |  |
| `account_sid` | `varchar(255)` | YES | `NULL` |  |  |
| `auth_token` | `varchar(255)` | YES | `NULL` |  |  |
| `project_id` | `varchar(255)` | YES | `NULL` |  |  |
| `space_url` | `varchar(255)` | YES | `NULL` |  |  |
| `webhook_url` | `varchar(255)` | YES | `NULL` |  |  |
| `daily_limit` | `int(11)` | YES | `1000` |  |  |
| `sent_today` | `int(11)` | YES | `0` |  |  |
| `last_reset_date` | `date` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `sms_sequence_steps`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `sequence_id` | `int(11)` | NO | `NULL` | MUL |  |
| `message` | `text` | NO | `NULL` |  |  |
| `step_order` | `int(11)` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `delay_amount` | `int(11)` | NO | `0` |  |  |
| `delay_unit` | `varchar(20)` | NO | `'hours'` |  |  |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `sequence_id`: `sequence_id`

---
### Table: `sms_sequences`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `group_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `status` | `varchar(50)` | NO | `'active'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Foreign Keys:**
- `group_id` -> `groups.id` (Constraint: `sms_sequences_ibfk_1`)

**Indexes:**
- `INDEX` `group_id`: `group_id`
- `INDEX` `group_id_2`: `group_id`
- `INDEX` `idx_sms_sequences_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`

---
### Table: `sms_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | UNI |  |
| `data` | `longtext` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Indexes:**
- `INDEX` `idx_sms_settings_user`: `user_id`
- `INDEX` `idx_sms_settings_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_user_sms_settings`: `user_id`

---
### Table: `sms_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `group_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `message` | `text` | NO | `NULL` |  |  |
| `category` | `varchar(100)` | YES | `NULL` |  |  |
| `is_favorite` | `tinyint(1)` | YES | `0` |  |  |
| `usage_count` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |

**Foreign Keys:**
- `group_id` -> `groups.id` (Constraint: `sms_templates_ibfk_1`)

**Indexes:**
- `INDEX` `group_id`: `group_id`
- `INDEX` `group_id_2`: `group_id`
- `INDEX` `idx_sms_templates_company`: `workspace_id`, `company_id`
- `INDEX` `idx_sms_templates_workspace`: `workspace_id`
- `INDEX` `idx_sms_templates_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`

---
### Table: `snapshot_imports`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `snapshot_id` | `int(11)` | YES | `NULL` | MUL |  |
| `source_workspace_id` | `int(11)` | YES | `NULL` |  |  |
| `source_snapshot_name` | `varchar(255)` | YES | `NULL` |  |  |
| `import_type` | `enum('restore','template','merge')` | YES | `'restore'` |  |  |
| `status` | `enum('pending','in_progress','completed','failed')` | YES | `'pending'` |  |  |
| `configuration` | `longtext` | YES | `NULL` |  |  |
| `mapping` | `longtext` | YES | `NULL` |  |  |
| `items_imported` | `int(11)` | YES | `0` |  |  |
| `items_failed` | `int(11)` | YES | `0` |  |  |
| `error_log` | `longtext` | YES | `NULL` |  |  |
| `started_at` | `timestamp` | YES | `NULL` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `imported_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `snapshot_id` -> `snapshots.id` (Constraint: `snapshot_imports_ibfk_1`)

**Indexes:**
- `INDEX` `idx_snapshot_imports_workspace`: `workspace_id`, `status`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `snapshot_id`: `snapshot_id`

---
### Table: `snapshot_marketplace`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `snapshot_id` | `int(11)` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `category` | `varchar(100)` | YES | `NULL` | MUL |  |
| `tags` | `longtext` | YES | `NULL` |  |  |
| `preview_images` | `longtext` | YES | `NULL` |  |  |
| `price` | `decimal(10,2)` | YES | `0.00` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `is_free` | `tinyint(1)` | YES | `1` |  |  |
| `is_featured` | `tinyint(1)` | YES | `0` | MUL |  |
| `is_approved` | `tinyint(1)` | YES | `0` |  |  |
| `download_count` | `int(11)` | YES | `0` | MUL |  |
| `rating_sum` | `int(11)` | YES | `0` |  |  |
| `rating_count` | `int(11)` | YES | `0` |  |  |
| `author_name` | `varchar(255)` | YES | `NULL` |  |  |
| `author_workspace_id` | `int(11)` | YES | `NULL` |  |  |
| `published_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `snapshot_id` -> `snapshots.id` (Constraint: `snapshot_marketplace_ibfk_1`)

**Indexes:**
- `INDEX` `idx_marketplace_category`: `category`
- `INDEX` `idx_marketplace_downloads`: `download_count`
- `INDEX` `idx_marketplace_featured`: `is_featured`, `is_approved`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `snapshot_id`: `snapshot_id`

---
### Table: `snapshots`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `snapshot_type` | `enum('full','partial','template')` | YES | `'full'` |  |  |
| `status` | `enum('creating','ready','failed','archived')` | YES | `'creating'` |  |  |
| `snapshot_data` | `longtext` | YES | `NULL` |  |  |
| `configuration` | `longtext` | YES | `NULL` |  |  |
| `version` | `varchar(20)` | YES | `'1.0'` |  |  |
| `category` | `varchar(50)` | YES | `NULL` |  |  |
| `file_path` | `varchar(500)` | YES | `NULL` |  |  |
| `file_size_bytes` | `bigint(20)` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `is_public` | `tinyint(1)` | YES | `0` | MUL |  |
| `thumbnail_url` | `varchar(255)` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `contents` | `longtext` | YES | `NULL` |  |  |
| `is_template` | `tinyint(1)` | YES | `0` |  |  |
| `download_count` | `int(11)` | YES | `0` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_snapshots_public`: `is_public`, `is_template`
- `INDEX` `idx_snapshots_workspace`: `workspace_id`, `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `social_accounts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `platform` | `enum('facebook','instagram','twitter','linkedin','tiktok','youtube','pinterest')` | NO | `NULL` |  |  |
| `account_type` | `enum('page','profile','business','creator')` | YES | `'page'` |  |  |
| `platform_account_id` | `varchar(255)` | NO | `NULL` |  |  |
| `account_name` | `varchar(255)` | YES | `NULL` |  |  |
| `account_username` | `varchar(255)` | YES | `NULL` |  |  |
| `account_url` | `varchar(500)` | YES | `NULL` |  |  |
| `avatar_url` | `varchar(500)` | YES | `NULL` |  |  |
| `access_token_encrypted` | `text` | YES | `NULL` |  |  |
| `refresh_token_encrypted` | `text` | YES | `NULL` |  |  |
| `token_expires_at` | `timestamp` | YES | `NULL` |  |  |
| `status` | `enum('connected','expired','error','disconnected')` | YES | `'connected'` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `can_post` | `tinyint(1)` | YES | `1` |  |  |
| `can_read_insights` | `tinyint(1)` | YES | `0` |  |  |
| `can_read_messages` | `tinyint(1)` | YES | `0` |  |  |
| `followers_count` | `int(11)` | YES | `NULL` |  |  |
| `following_count` | `int(11)` | YES | `NULL` |  |  |
| `posts_count` | `int(11)` | YES | `NULL` |  |  |
| `last_sync_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_social_accounts_company`: `workspace_id`, `company_id`, `status`
- `INDEX` `idx_social_accounts_workspace`: `workspace_id`, `status`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_platform_account`: `workspace_id`, `platform`, `platform_account_id`

---
### Table: `social_best_times`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `social_account_id` | `int(11)` | NO | `NULL` | MUL |  |
| `day_of_week` | `tinyint(4)` | NO | `NULL` |  |  |
| `hour` | `tinyint(4)` | NO | `NULL` |  |  |
| `engagement_score` | `decimal(5,2)` | YES | `NULL` |  |  |
| `sample_size` | `int(11)` | YES | `0` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `social_account_id` -> `social_accounts.id` (Constraint: `social_best_times_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_account_day_hour`: `social_account_id`, `day_of_week`, `hour`

---
### Table: `social_categories`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `color` | `varchar(7)` | YES | `'#6366f1'` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `default_times` | `longtext` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_categories_workspace`: `workspace_id`, `is_active`
- `INDEX` `idx_social_categories_company`: `workspace_id`, `company_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_name`: `workspace_id`, `name`

---
### Table: `social_content_calendar`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `content_type` | `enum('post','story','reel','video','carousel','event')` | YES | `'post'` |  |  |
| `planned_date` | `date` | NO | `NULL` | MUL |  |
| `platforms` | `longtext` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `status` | `enum('idea','drafting','ready','scheduled','published')` | YES | `'idea'` |  |  |
| `assigned_to` | `int(11)` | YES | `NULL` |  |  |
| `post_id` | `int(11)` | YES | `NULL` |  |  |
| `color` | `varchar(20)` | YES | `'#3b82f6'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_calendar_date`: `planned_date`
- `INDEX` `idx_calendar_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `social_post_analytics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `post_id` | `int(11)` | NO | `NULL` | MUL |  |
| `social_account_id` | `int(11)` | NO | `NULL` |  |  |
| `platform_post_id` | `varchar(255)` | YES | `NULL` |  |  |
| `platform_post_url` | `varchar(500)` | YES | `NULL` |  |  |
| `impressions` | `int(11)` | YES | `0` |  |  |
| `reach` | `int(11)` | YES | `0` |  |  |
| `likes` | `int(11)` | YES | `0` |  |  |
| `comments` | `int(11)` | YES | `0` |  |  |
| `shares` | `int(11)` | YES | `0` |  |  |
| `saves` | `int(11)` | YES | `0` |  |  |
| `clicks` | `int(11)` | YES | `0` |  |  |
| `video_views` | `int(11)` | YES | `0` |  |  |
| `engagement_rate` | `decimal(5,2)` | YES | `NULL` |  |  |
| `last_updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `post_id` -> `social_posts.id` (Constraint: `social_post_analytics_ibfk_1`)

**Indexes:**
- `INDEX` `idx_analytics_post`: `post_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_post_account`: `post_id`, `social_account_id`

---
### Table: `social_post_metrics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `post_id` | `int(11)` | NO | `NULL` | MUL |  |
| `platform` | `varchar(50)` | NO | `NULL` |  |  |
| `likes` | `int(11)` | YES | `0` |  |  |
| `comments` | `int(11)` | YES | `0` |  |  |
| `shares` | `int(11)` | YES | `0` |  |  |
| `saves` | `int(11)` | YES | `0` |  |  |
| `reach` | `int(11)` | YES | `0` |  |  |
| `impressions` | `int(11)` | YES | `0` |  |  |
| `clicks` | `int(11)` | YES | `0` |  |  |
| `engagement_rate` | `decimal(5,2)` | YES | `0.00` |  |  |
| `last_synced_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_metrics_post`: `post_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `social_post_queue`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` |  |  |
| `post_id` | `int(11)` | NO | `NULL` |  |  |
| `account_id` | `int(11)` | NO | `NULL` |  |  |
| `platform` | `enum('facebook','instagram','linkedin','twitter','tiktok')` | NO | `NULL` |  |  |
| `scheduled_for` | `datetime` | NO | `NULL` | MUL |  |
| `status` | `enum('pending','processing','published','failed','cancelled')` | YES | `'pending'` | MUL |  |
| `attempt_count` | `int(11)` | YES | `0` |  |  |
| `last_attempt_at` | `datetime` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `published_at` | `datetime` | YES | `NULL` |  |  |
| `external_post_id` | `varchar(255)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_post_queue_scheduled`: `scheduled_for`
- `INDEX` `idx_post_queue_status`: `status`
- `INDEX` `idx_post_queue_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `social_posts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `content` | `text` | NO | `NULL` |  |  |
| `media_urls` | `longtext` | YES | `NULL` |  |  |
| `media_type` | `enum('none','image','video','carousel','link')` | YES | `'none'` |  |  |
| `link_url` | `varchar(500)` | YES | `NULL` |  |  |
| `link_title` | `varchar(255)` | YES | `NULL` |  |  |
| `link_description` | `text` | YES | `NULL` |  |  |
| `link_image` | `varchar(500)` | YES | `NULL` |  |  |
| `status` | `enum('draft','scheduled','publishing','published','failed','cancelled')` | YES | `'draft'` | MUL |  |
| `scheduled_at` | `timestamp` | YES | `NULL` |  |  |
| `published_at` | `timestamp` | YES | `NULL` |  |  |
| `target_accounts` | `longtext` | NO | `NULL` |  |  |
| `platform_settings` | `longtext` | YES | `NULL` |  |  |
| `publish_results` | `longtext` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `campaign_id` | `int(11)` | YES | `NULL` |  |  |
| `category` | `varchar(100)` | YES | `NULL` |  |  |
| `requires_approval` | `tinyint(1)` | YES | `0` |  |  |
| `approved_by` | `int(11)` | YES | `NULL` |  |  |
| `approved_at` | `timestamp` | YES | `NULL` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_social_posts_company`: `workspace_id`, `company_id`, `status`, `scheduled_at`
- `INDEX` `idx_social_posts_scheduled`: `status`, `scheduled_at`
- `INDEX` `idx_social_posts_workspace`: `workspace_id`, `status`, `scheduled_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `social_scheduled_posts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `social_account_id` | `int(11)` | YES | `NULL` |  |  |
| `content` | `text` | NO | `NULL` |  |  |
| `media_urls` | `longtext` | YES | `NULL` |  |  |
| `link_url` | `varchar(500)` | YES | `NULL` |  |  |
| `platform` | `enum('facebook','instagram','twitter','linkedin','tiktok','pinterest')` | NO | `NULL` | MUL |  |
| `post_type` | `enum('post','story','reel','carousel')` | YES | `'post'` |  |  |
| `status` | `enum('draft','scheduled','publishing','published','failed','cancelled')` | YES | `'draft'` |  |  |
| `scheduled_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `published_at` | `timestamp` | YES | `NULL` |  |  |
| `platform_post_id` | `varchar(255)` | YES | `NULL` |  |  |
| `platform_post_url` | `varchar(500)` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `likes` | `int(11)` | YES | `0` |  |  |
| `comments` | `int(11)` | YES | `0` |  |  |
| `shares` | `int(11)` | YES | `0` |  |  |
| `reach` | `int(11)` | YES | `0` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_social_scheduled_platform`: `platform`, `status`
- `INDEX` `idx_social_scheduled_workspace`: `workspace_id`, `status`, `scheduled_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `social_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `content` | `text` | NO | `NULL` |  |  |
| `media_urls` | `longtext` | YES | `NULL` |  |  |
| `platforms` | `longtext` | YES | `NULL` |  |  |
| `category_id` | `int(11)` | YES | `NULL` |  |  |
| `use_count` | `int(11)` | YES | `0` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_social_templates_company`: `workspace_id`, `company_id`
- `INDEX` `idx_templates_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `speed_to_lead_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | UNI |  |
| `is_enabled` | `tinyint(1)` | YES | `1` |  |  |
| `auto_call_new_leads` | `tinyint(1)` | YES | `0` |  |  |
| `auto_sms_new_leads` | `tinyint(1)` | YES | `1` |  |  |
| `new_lead_sms_template_id` | `int(11)` | YES | `NULL` |  |  |
| `new_lead_delay_seconds` | `int(11)` | YES | `30` |  |  |
| `missed_call_auto_sms` | `tinyint(1)` | YES | `1` |  |  |
| `missed_call_sms_template_id` | `int(11)` | YES | `NULL` |  |  |
| `missed_call_delay_seconds` | `int(11)` | YES | `60` |  |  |
| `respect_business_hours` | `tinyint(1)` | YES | `1` |  |  |
| `business_hours` | `longtext` | YES | `NULL` |  |  |
| `after_hours_sms_template_id` | `int(11)` | YES | `NULL` |  |  |
| `round_robin_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `assigned_staff_ids` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `user_id`: `user_id`

---
### Table: `staff_availability`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `staff_id` | `int(11)` | NO | `NULL` | MUL |  |
| `day_of_week` | `tinyint(4)` | NO | `NULL` |  |  |
| `start_time` | `time` | NO | `NULL` |  |  |
| `end_time` | `time` | NO | `NULL` |  |  |
| `is_available` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_staff_day`: `staff_id`, `day_of_week`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `staff_members`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | YES | `NULL` |  |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `email` | `varchar(255)` | YES | `NULL` |  |  |
| `phone` | `varchar(50)` | YES | `NULL` |  |  |
| `role` | `enum('technician','driver','stylist','groomer','agent','provider','staff')` | YES | `'staff'` |  |  |
| `title` | `varchar(100)` | YES | `NULL` |  |  |
| `photo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `bio` | `text` | YES | `NULL` |  |  |
| `skills` | `longtext` | YES | `NULL` |  |  |
| `certifications` | `longtext` | YES | `NULL` |  |  |
| `service_ids` | `longtext` | YES | `NULL` |  |  |
| `availability` | `longtext` | YES | `NULL` |  |  |
| `color` | `varchar(20)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `accepts_bookings` | `tinyint(1)` | YES | `1` |  |  |
| `booking_page_url` | `varchar(500)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `timezone` | `varchar(100)` | YES | `'UTC'` |  |  |

**Indexes:**
- `INDEX` `idx_staff_members_user`: `user_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `staff_services`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `staff_id` | `int(11)` | NO | `NULL` | MUL |  |
| `service_id` | `int(11)` | NO | `NULL` | MUL |  |
| `custom_duration_minutes` | `int(11)` | YES | `NULL` |  |  |
| `custom_price` | `decimal(10,2)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `staff_id` -> `staff_members.id` (Constraint: `staff_services_ibfk_1`)
- `service_id` -> `services.id` (Constraint: `staff_services_ibfk_2`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `service_id`: `service_id`
- `UNIQUE` `uk_staff_service`: `staff_id`, `service_id`

---
### Table: `staff_time_off`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `staff_id` | `int(11)` | NO | `NULL` | MUL |  |
| `start_date` | `date` | NO | `NULL` |  |  |
| `end_date` | `date` | NO | `NULL` |  |  |
| `reason` | `varchar(255)` | YES | `NULL` |  |  |
| `is_approved` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_staff_dates`: `staff_id`, `start_date`, `end_date`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `stripe_accounts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | UNI |  |
| `stripe_account_id` | `varchar(255)` | YES | `NULL` | MUL |  |
| `stripe_customer_id` | `varchar(255)` | YES | `NULL` |  |  |
| `status` | `enum('pending','connected','restricted','disabled')` | YES | `'pending'` |  |  |
| `charges_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `payouts_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `default_currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `statement_descriptor` | `varchar(22)` | YES | `NULL` |  |  |
| `webhook_secret` | `varchar(255)` | YES | `NULL` |  |  |
| `connected_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_stripe_account`: `stripe_account_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace`: `workspace_id`

---
### Table: `stripe_events`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `event_id` | `varchar(100)` | NO | `NULL` | UNI |  |
| `event_type` | `varchar(100)` | NO | `NULL` | MUL |  |
| `processed` | `tinyint(1)` | YES | `0` | MUL |  |
| `payload` | `longtext` | YES | `NULL` |  |  |
| `processed_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_event_processed`: `processed`
- `INDEX` `idx_event_type`: `event_type`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_event_id`: `event_id`

---
### Table: `student_notes`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `course_id` | `int(11)` | NO | `NULL` |  |  |
| `lesson_id` | `int(11)` | YES | `NULL` | MUL |  |
| `video_timestamp` | `int(11)` | YES | `NULL` |  |  |
| `note_text` | `text` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_note_lesson`: `lesson_id`
- `INDEX` `idx_note_user_course`: `user_id`, `course_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `sub_accounts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `agency_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `subdomain` | `varchar(100)` | YES | `NULL` | UNI |  |
| `custom_domain` | `varchar(255)` | YES | `NULL` |  |  |
| `owner_user_id` | `int(11)` | YES | `NULL` |  |  |
| `status` | `enum('active','suspended','cancelled','trial')` | YES | `'active'` | MUL |  |
| `plan` | `varchar(100)` | YES | `NULL` |  |  |
| `billing_email` | `varchar(255)` | YES | `NULL` |  |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `branding` | `longtext` | YES | `NULL` |  |  |
| `limits` | `longtext` | YES | `NULL` |  |  |
| `trial_ends_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_sub_accounts_agency`: `agency_id`
- `INDEX` `idx_sub_accounts_status`: `status`
- `INDEX` `idx_sub_accounts_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_subdomain`: `subdomain`

---
### Table: `subaccount_members`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `subaccount_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `role` | `enum('admin','user','readonly')` | NO | `'user'` |  |  |
| `permissions` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('invited','active','suspended')` | YES | `'invited'` |  |  |
| `invited_by` | `int(11)` | YES | `NULL` |  |  |
| `invited_at` | `datetime` | YES | `NULL` |  |  |
| `joined_at` | `datetime` | YES | `NULL` |  |  |
| `last_accessed_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `subaccount_id` -> `subaccounts.id` (Constraint: `subaccount_members_ibfk_1`)

**Indexes:**
- `INDEX` `idx_subaccount_members_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_subaccount_member`: `subaccount_id`, `user_id`

---
### Table: `subaccount_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `subaccount_id` | `int(11)` | NO | `NULL` | UNI |  |
| `features` | `longtext` | YES | `NULL` |  |  |
| `limits` | `longtext` | YES | `NULL` |  |  |
| `integrations` | `longtext` | YES | `NULL` |  |  |
| `notifications` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `subaccount_id` -> `subaccounts.id` (Constraint: `subaccount_settings_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_subaccount_settings`: `subaccount_id`

---
### Table: `subaccounts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `agency_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `slug` | `varchar(100)` | NO | `NULL` |  |  |
| `industry` | `varchar(100)` | YES | `NULL` |  |  |
| `timezone` | `varchar(50)` | YES | `'UTC'` |  |  |
| `currency` | `varchar(3)` | YES | `'USD'` |  |  |
| `logo_url` | `varchar(512)` | YES | `NULL` |  |  |
| `address` | `text` | YES | `NULL` |  |  |
| `city` | `varchar(100)` | YES | `NULL` |  |  |
| `state` | `varchar(100)` | YES | `NULL` |  |  |
| `country` | `varchar(100)` | YES | `NULL` |  |  |
| `postal_code` | `varchar(20)` | YES | `NULL` |  |  |
| `phone` | `varchar(50)` | YES | `NULL` |  |  |
| `email` | `varchar(255)` | YES | `NULL` |  |  |
| `website` | `varchar(255)` | YES | `NULL` |  |  |
| `status` | `enum('active','paused','canceled')` | YES | `'active'` | MUL |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `agency_id` -> `agencies.id` (Constraint: `subaccounts_ibfk_1`)

**Indexes:**
- `INDEX` `idx_subaccounts_agency`: `agency_id`
- `INDEX` `idx_subaccounts_status`: `status`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_subaccount_slug`: `agency_id`, `slug`

---
### Table: `subscriptions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `product_id` | `int(11)` | NO | `NULL` | MUL |  |
| `status` | `enum('active','paused','cancelled','past_due','trialing')` | NO | `'active'` | MUL |  |
| `stripe_subscription_id` | `varchar(255)` | YES | `NULL` |  |  |
| `current_period_start` | `date` | YES | `NULL` |  |  |
| `current_period_end` | `date` | YES | `NULL` |  |  |
| `cancel_at_period_end` | `tinyint(1)` | NO | `0` |  |  |
| `cancelled_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_subscriptions_contact`: `contact_id`
- `INDEX` `idx_subscriptions_status`: `status`
- `INDEX` `idx_subscriptions_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `product_id`: `product_id`

---
### Table: `system_health_snapshots`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `status` | `varchar(20)` | NO | `NULL` |  |  |
| `score` | `int(11)` | NO | `NULL` |  |  |
| `metrics` | `longtext` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `tags`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `color` | `varchar(7)` | NO | `'#3b82f6'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Indexes:**
- `INDEX` `idx_tags_user_id`: `user_id`
- `INDEX` `idx_tags_workspace`: `workspace_id`
- `INDEX` `idx_tags_workspace_id`: `workspace_id`
- `INDEX` `idx_tags_workspace_name`: `workspace_id`, `name`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_user_tag`: `user_id`, `name`

---
### Table: `task_activity`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `task_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `action` | `varchar(50)` | NO | `NULL` |  |  |
| `field_name` | `varchar(50)` | YES | `NULL` |  |  |
| `old_value` | `text` | YES | `NULL` |  |  |
| `new_value` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_task_activity_task`: `task_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `task_attachments`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `task_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `filename` | `varchar(255)` | NO | `NULL` |  |  |
| `original_name` | `varchar(255)` | NO | `NULL` |  |  |
| `file_path` | `varchar(500)` | NO | `NULL` |  |  |
| `file_size` | `int(11)` | YES | `0` |  |  |
| `mime_type` | `varchar(100)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_task_attachments_task`: `task_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `task_comments`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `task_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `content` | `text` | NO | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `task_id` -> `sales_tasks.id` (Constraint: `task_comments_ibfk_1`)
- `user_id` -> `users.id` (Constraint: `task_comments_ibfk_2`)

**Indexes:**
- `INDEX` `idx_task_created`: `task_id`, `created_at`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`

---
### Table: `task_custom_field_values`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `task_id` | `int(11)` | NO | `NULL` | MUL |  |
| `field_id` | `int(11)` | NO | `NULL` |  |  |
| `value` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_task_field`: `task_id`, `field_id`

---
### Table: `task_dependencies`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `task_id` | `int(11)` | NO | `NULL` | MUL |  |
| `depends_on_task_id` | `int(11)` | NO | `NULL` | MUL |  |
| `dependency_type` | `enum('blocks','blocked_by','related')` | YES | `'blocks'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_task_deps_depends`: `depends_on_task_id`
- `INDEX` `idx_task_deps_task`: `task_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `task_queue`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `task_type` | `varchar(100)` | NO | `NULL` | MUL |  |
| `task_data` | `longtext` | NO | `NULL` |  |  |
| `priority` | `int(11)` | NO | `0` |  |  |
| `status` | `enum('pending','processing','completed','failed')` | NO | `'pending'` | MUL |  |
| `created_at` | `datetime` | NO | `current_timestamp()` | MUL |  |
| `started_at` | `datetime` | YES | `NULL` |  |  |
| `completed_at` | `datetime` | YES | `NULL` |  |  |
| `result` | `longtext` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_status_priority`: `status`, `priority`
- `INDEX` `idx_task_type`: `task_type`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `task_sequences`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `trigger_event` | `varchar(100)` | YES | `NULL` |  |  |
| `steps` | `longtext` | NO | `NULL` |  |  |
| `status` | `enum('active','paused','archived')` | YES | `'active'` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `task_sequences_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`

---
### Table: `task_subtasks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `task_id` | `int(11)` | NO | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `completed` | `tinyint(1)` | YES | `0` |  |  |
| `assigned_to` | `int(11)` | YES | `NULL` |  |  |
| `position` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_task_subtasks_task`: `task_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `task_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `task_type` | `enum('call','email','sms','meeting','follow_up','demo','proposal','other')` | NO | `NULL` |  |  |
| `default_priority` | `enum('low','medium','high','urgent')` | YES | `'medium'` |  |  |
| `default_duration_minutes` | `int(11)` | YES | `30` |  |  |
| `checklist` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `task_time_entries`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `task_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `description` | `text` | YES | `NULL` |  |  |
| `duration_minutes` | `int(11)` | NO | `0` |  |  |
| `started_at` | `datetime` | YES | `NULL` |  |  |
| `ended_at` | `datetime` | YES | `NULL` |  |  |
| `is_billable` | `tinyint(1)` | YES | `0` |  |  |
| `hourly_rate` | `decimal(10,2)` | YES | `0.00` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_task_time_task`: `task_id`
- `INDEX` `idx_task_time_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `task_watchers`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `task_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_task_watchers_task`: `task_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_watcher`: `task_id`, `user_id`

---
### Table: `tasks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `project_id` | `int(11)` | YES | `NULL` | MUL |  |
| `assigned_to` | `int(11)` | YES | `NULL` | MUL |  |
| `created_by` | `int(11)` | NO | `NULL` |  |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `status` | `enum('todo','in_progress','review','done','cancelled')` | YES | `'todo'` | MUL |  |
| `priority` | `enum('low','medium','high','urgent')` | YES | `'medium'` |  |  |
| `due_date` | `date` | YES | `NULL` | MUL |  |
| `due_time` | `time` | YES | `NULL` |  |  |
| `start_date` | `date` | YES | `NULL` |  |  |
| `estimated_hours` | `decimal(10,2)` | YES | `NULL` |  |  |
| `actual_hours` | `decimal(10,2)` | YES | `NULL` |  |  |
| `tags` | `longtext` | YES | `NULL` |  |  |
| `attachments` | `longtext` | YES | `NULL` |  |  |
| `parent_task_id` | `int(11)` | YES | `NULL` | MUL |  |
| `position` | `int(11)` | YES | `0` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_tasks_assigned`: `assigned_to`
- `INDEX` `idx_tasks_due_date`: `due_date`
- `INDEX` `idx_tasks_parent`: `parent_task_id`
- `INDEX` `idx_tasks_project`: `project_id`
- `INDEX` `idx_tasks_status`: `status`
- `INDEX` `idx_tasks_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `tax_rates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(50)` | NO | `NULL` |  |  |
| `rate` | `decimal(5,2)` | NO | `NULL` |  |  |
| `description` | `varchar(255)` | YES | `NULL` |  |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_tax_rates_workspace`: `workspace_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `technician_status`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | UNI |  |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `current_status` | `enum('available','busy','on_break','offline','en_route')` | YES | `'offline'` |  |  |
| `current_job_id` | `int(11)` | YES | `NULL` |  |  |
| `current_lat` | `decimal(10,8)` | YES | `NULL` |  |  |
| `current_lng` | `decimal(11,8)` | YES | `NULL` |  |  |
| `last_location_update` | `datetime` | YES | `NULL` |  |  |
| `estimated_available_at` | `datetime` | YES | `NULL` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_tech_status_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_user`: `user_id`

---
### Table: `templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `group_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `subject` | `varchar(500)` | NO | `NULL` |  |  |
| `html_content` | `text` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `blocks` | `text` | YES | `NULL` |  |  |
| `global_styles` | `text` | YES | `NULL` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `brand_id` | `int(11)` | YES | `NULL` |  |  |
| `supports_variables` | `tinyint(1)` | YES | `1` |  |  |
| `preview_text` | `varchar(255)` | YES | `NULL` |  |  |

**Foreign Keys:**
- `group_id` -> `groups.id` (Constraint: `templates_ibfk_1`)

**Indexes:**
- `INDEX` `group_id`: `group_id`
- `INDEX` `group_id_2`: `group_id`
- `INDEX` `idx_templates_company`: `workspace_id`, `company_id`
- `INDEX` `idx_templates_workspace_id`: `workspace_id`
- `INDEX` `idx_templates_workspace_updated`: `workspace_id`, `updated_at`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`

---
### Table: `ticket_activities`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `ticket_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | YES | `NULL` |  |  |
| `activity_type` | `enum('created','assigned','status_changed','priority_changed','commented','closed','reopened','tagged','custom_field_changed','merged','split')` | NO | `NULL` | MUL |  |
| `description` | `text` | YES | `NULL` |  |  |
| `field_name` | `varchar(100)` | YES | `NULL` |  |  |
| `old_value` | `text` | YES | `NULL` |  |  |
| `new_value` | `text` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Foreign Keys:**
- `ticket_id` -> `tickets.id` (Constraint: `ticket_activities_ibfk_1`)

**Indexes:**
- `INDEX` `idx_created`: `created_at`
- `INDEX` `idx_ticket`: `ticket_id`
- `INDEX` `idx_type`: `activity_type`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ticket_attachments`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `ticket_id` | `int(11)` | NO | `NULL` | MUL |  |
| `message_id` | `int(11)` | YES | `NULL` | MUL |  |
| `filename` | `varchar(255)` | NO | `NULL` |  |  |
| `original_filename` | `varchar(255)` | NO | `NULL` |  |  |
| `file_path` | `varchar(500)` | NO | `NULL` |  |  |
| `file_size_bytes` | `bigint(20)` | NO | `NULL` |  |  |
| `mime_type` | `varchar(100)` | NO | `NULL` |  |  |
| `is_inline` | `tinyint(1)` | YES | `0` |  |  |
| `content_id` | `varchar(255)` | YES | `NULL` |  |  |
| `uploaded_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `ticket_id` -> `tickets.id` (Constraint: `ticket_attachments_ibfk_1`)
- `message_id` -> `ticket_messages.id` (Constraint: `ticket_attachments_ibfk_2`)

**Indexes:**
- `INDEX` `idx_ticket_attachments_message`: `message_id`
- `INDEX` `idx_ticket_attachments_ticket`: `ticket_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ticket_bulk_actions_log`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `action_type` | `enum('assign','close','tag','priority','status','team','merge','split','delete')` | NO | `NULL` |  |  |
| `ticket_ids` | `longtext` | NO | `NULL` |  |  |
| `action_data` | `longtext` | YES | `NULL` |  |  |
| `tickets_affected` | `int(11)` | YES | `0` |  |  |
| `status` | `enum('pending','processing','completed','failed')` | YES | `'pending'` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `ticket_bulk_actions_log_ibfk_1`)
- `user_id` -> `users.id` (Constraint: `ticket_bulk_actions_log_ibfk_2`)

**Indexes:**
- `INDEX` `idx_bulk_actions_created`: `created_at`
- `INDEX` `idx_bulk_actions_user`: `user_id`
- `INDEX` `idx_bulk_actions_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ticket_canned_responses`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `shortcut` | `varchar(50)` | YES | `NULL` | MUL |  |
| `subject` | `varchar(500)` | YES | `NULL` |  |  |
| `body` | `text` | NO | `NULL` |  |  |
| `body_html` | `text` | YES | `NULL` |  |  |
| `category` | `varchar(100)` | YES | `NULL` | MUL |  |
| `actions` | `longtext` | YES | `NULL` |  |  |
| `is_shared` | `tinyint(1)` | YES | `1` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_category`: `category`
- `INDEX` `idx_shortcut`: `shortcut`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ticket_categories`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `parent_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `color` | `varchar(7)` | YES | `'#6366F1'` |  |  |
| `icon` | `varchar(50)` | YES | `NULL` |  |  |
| `default_team_id` | `int(11)` | YES | `NULL` |  |  |
| `default_priority` | `enum('low','normal','high','urgent')` | YES | `'normal'` |  |  |
| `sla_policy_id` | `int(11)` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `display_order` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_ticket_categories_parent`: `parent_id`
- `INDEX` `idx_ticket_categories_workspace`: `workspace_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ticket_csat_responses`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `ticket_id` | `int(11)` | NO | `NULL` | MUL |  |
| `score` | `int(11)` | NO | `NULL` | MUL |  |
| `comment` | `text` | YES | `NULL` |  |  |
| `survey_sent_at` | `timestamp` | YES | `NULL` |  |  |
| `responded_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |

**Foreign Keys:**
- `ticket_id` -> `tickets.id` (Constraint: `ticket_csat_responses_ibfk_1`)

**Indexes:**
- `INDEX` `idx_score`: `score`
- `INDEX` `idx_ticket`: `ticket_id`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ticket_csat_survey_sends`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `ticket_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` |  |  |
| `sent_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `status` | `varchar(50)` | YES | `'sent'` |  |  |

**Foreign Keys:**
- `ticket_id` -> `tickets.id` (Constraint: `ticket_csat_survey_sends_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `ticket_id`: `ticket_id`

---
### Table: `ticket_csat_surveys`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `trigger_event` | `enum('ticket_closed','ticket_resolved','manual')` | YES | `'ticket_closed'` |  |  |
| `delay_minutes` | `int(11)` | YES | `0` |  |  |
| `email_subject` | `varchar(200)` | NO | `NULL` |  |  |
| `email_body` | `text` | NO | `NULL` |  |  |
| `survey_question` | `varchar(255)` | NO | `NULL` |  |  |
| `rating_scale` | `enum('1-5','1-10','thumbs','emoji')` | YES | `'1-5'` |  |  |
| `ask_comment` | `tinyint(1)` | YES | `1` |  |  |
| `comment_required` | `tinyint(1)` | YES | `0` |  |  |
| `send_to_email` | `varchar(255)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `ticket_csat_surveys_ibfk_1`)

**Indexes:**
- `INDEX` `idx_csat_surveys_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ticket_external_mappings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `ticket_id` | `int(11)` | NO | `NULL` | MUL |  |
| `provider` | `varchar(50)` | NO | `NULL` | MUL |  |
| `external_id` | `varchar(255)` | NO | `NULL` |  |  |
| `external_url` | `varchar(500)` | YES | `NULL` |  |  |
| `sync_status` | `enum('synced','pending','error')` | YES | `'synced'` |  |  |
| `last_synced_at` | `timestamp` | YES | `NULL` |  |  |
| `sync_error` | `text` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `ticket_id` -> `tickets.id` (Constraint: `ticket_external_mappings_ibfk_1`)

**Indexes:**
- `INDEX` `idx_provider_external`: `provider`, `external_id`
- `INDEX` `idx_ticket`: `ticket_id`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_provider_ticket`: `provider`, `ticket_id`

---
### Table: `ticket_merge_history`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `ticket_id` | `int(11)` | NO | `NULL` | MUL |  |
| `merged_ticket_id` | `int(11)` | NO | `NULL` |  |  |
| `merged_by` | `int(11)` | NO | `NULL` |  |  |
| `merged_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `ticket_id` -> `tickets.id` (Constraint: `ticket_merge_history_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `ticket_id`: `ticket_id`

---
### Table: `ticket_messages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `ticket_id` | `int(11)` | NO | `NULL` | MUL |  |
| `message_type` | `enum('reply','note','system','auto_reply')` | YES | `'reply'` |  |  |
| `content` | `text` | NO | `NULL` |  |  |
| `content_html` | `text` | YES | `NULL` |  |  |
| `sender_type` | `enum('agent','customer','system')` | YES | `'agent'` |  |  |
| `sender_id` | `int(11)` | YES | `NULL` |  |  |
| `sender_name` | `varchar(255)` | YES | `NULL` |  |  |
| `sender_email` | `varchar(255)` | YES | `NULL` |  |  |
| `is_private` | `tinyint(1)` | YES | `0` |  |  |
| `attachments` | `longtext` | YES | `NULL` |  |  |
| `email_message_id` | `varchar(255)` | YES | `NULL` |  |  |
| `email_in_reply_to` | `varchar(255)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `direction` | `enum('inbound','outbound')` | YES | `'outbound'` |  |  |
| `from_email` | `varchar(255)` | YES | `NULL` |  |  |
| `to_email` | `varchar(255)` | YES | `NULL` |  |  |
| `subject` | `varchar(500)` | YES | `NULL` |  |  |
| `body_html` | `longtext` | YES | `NULL` |  |  |
| `author_user_id` | `int(11)` | YES | `NULL` |  |  |
| `author_name` | `varchar(255)` | YES | `NULL` |  |  |
| `author_email` | `varchar(255)` | YES | `NULL` |  |  |

**Foreign Keys:**
- `ticket_id` -> `tickets.id` (Constraint: `ticket_messages_ibfk_1`)

**Indexes:**
- `INDEX` `idx_ticket_messages_ticket`: `ticket_id`, `created_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ticket_reporting_metrics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `metric_date` | `date` | NO | `NULL` |  |  |
| `metric_type` | `varchar(50)` | NO | `NULL` |  |  |
| `metric_value` | `decimal(10,2)` | NO | `NULL` |  |  |
| `metric_data` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `ticket_reporting_metrics_ibfk_1`)

**Indexes:**
- `INDEX` `idx_reporting_workspace_date`: `workspace_id`, `metric_date`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_metric`: `workspace_id`, `metric_date`, `metric_type`

---
### Table: `ticket_saved_filters`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `filter_criteria` | `longtext` | NO | `NULL` |  |  |
| `is_shared` | `tinyint(1)` | YES | `0` |  |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `ticket_saved_filters_ibfk_1`)
- `user_id` -> `users.id` (Constraint: `ticket_saved_filters_ibfk_2`)

**Indexes:**
- `INDEX` `idx_saved_filters_user`: `user_id`
- `INDEX` `idx_saved_filters_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ticket_split_history`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `ticket_id` | `int(11)` | NO | `NULL` | MUL |  |
| `new_ticket_id` | `int(11)` | NO | `NULL` | MUL |  |
| `split_by` | `int(11)` | NO | `NULL` |  |  |
| `split_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `ticket_id` -> `tickets.id` (Constraint: `ticket_split_history_ibfk_1`)
- `new_ticket_id` -> `tickets.id` (Constraint: `ticket_split_history_ibfk_2`)

**Indexes:**
- `INDEX` `new_ticket_id`: `new_ticket_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `ticket_id`: `ticket_id`

---
### Table: `ticket_stages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `stage_type` | `enum('new','in_progress','waiting','resolved','closed')` | YES | `'in_progress'` |  |  |
| `color` | `varchar(7)` | YES | `'#3b82f6'` |  |  |
| `sequence` | `int(11)` | YES | `0` | MUL |  |
| `is_closed` | `tinyint(1)` | YES | `0` |  |  |
| `fold` | `tinyint(1)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_sequence`: `sequence`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ticket_tags`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `color` | `varchar(7)` | YES | `'#6b7280'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_tag_name`: `workspace_id`, `name`

---
### Table: `ticket_team_members`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `team_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `role` | `enum('member','lead','manager')` | YES | `'member'` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `notification_settings` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `team_id` -> `ticket_teams.id` (Constraint: `ticket_team_members_ibfk_1`)

**Indexes:**
- `INDEX` `idx_ticket_team_members_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_team_member`: `team_id`, `user_id`

---
### Table: `ticket_teams`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `email` | `varchar(255)` | YES | `NULL` |  |  |
| `auto_assign` | `tinyint(1)` | YES | `0` |  |  |
| `assignment_method` | `enum('round_robin','load_balanced','manual')` | YES | `'manual'` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_ticket_teams_workspace`: `workspace_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ticket_types`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `icon` | `varchar(50)` | YES | `NULL` |  |  |
| `color` | `varchar(7)` | YES | `'#3b82f6'` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `ticket_watchers`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `ticket_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | YES | `NULL` | MUL |  |
| `email` | `varchar(255)` | YES | `NULL` |  |  |
| `watcher_type` | `enum('agent','requester','cc','email')` | YES | `'agent'` |  |  |
| `notify_on_update` | `tinyint(1)` | YES | `1` |  |  |
| `notify_on_resolution` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `ticket_id` -> `tickets.id` (Constraint: `ticket_watchers_ibfk_1`)

**Indexes:**
- `INDEX` `idx_ticket_watchers_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_ticket_watcher`: `ticket_id`, `user_id`

---
### Table: `tickets`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `ticket_number` | `varchar(20)` | NO | `NULL` |  |  |
| `subject` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `status` | `enum('new','open','pending','on_hold','resolved','closed')` | YES | `'new'` | MUL |  |
| `priority` | `enum('low','normal','high','urgent')` | YES | `'normal'` |  |  |
| `type` | `enum('question','incident','problem','feature_request','task')` | YES | `'question'` |  |  |
| `category_id` | `int(11)` | YES | `NULL` |  |  |
| `tags` | `longtext` | YES | `NULL` |  |  |
| `team_id` | `int(11)` | YES | `NULL` |  |  |
| `assigned_to` | `int(11)` | YES | `NULL` | MUL |  |
| `source` | `enum('email','web','phone','chat','api','internal')` | YES | `'web'` |  |  |
| `source_email` | `varchar(255)` | YES | `NULL` |  |  |
| `sla_policy_id` | `int(11)` | YES | `NULL` |  |  |
| `first_response_due_at` | `timestamp` | YES | `NULL` |  |  |
| `resolution_due_at` | `timestamp` | YES | `NULL` |  |  |
| `first_responded_at` | `timestamp` | YES | `NULL` |  |  |
| `resolved_at` | `timestamp` | YES | `NULL` |  |  |
| `sla_breached` | `tinyint(1)` | YES | `0` |  |  |
| `csat_rating` | `tinyint(4)` | YES | `NULL` |  |  |
| `csat_feedback` | `text` | YES | `NULL` |  |  |
| `csat_submitted_at` | `timestamp` | YES | `NULL` |  |  |
| `total_messages` | `int(11)` | YES | `0` |  |  |
| `created_by` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `closed_at` | `timestamp` | YES | `NULL` |  |  |
| `stage_id` | `int(11)` | YES | `NULL` |  |  |
| `ticket_type_id` | `int(11)` | YES | `NULL` |  |  |
| `assigned_user_id` | `int(11)` | YES | `NULL` |  |  |
| `requester_name` | `varchar(255)` | YES | `NULL` |  |  |
| `requester_email` | `varchar(255)` | YES | `NULL` |  |  |
| `requester_phone` | `varchar(50)` | YES | `NULL` |  |  |
| `source_channel` | `varchar(50)` | YES | `'manual'` |  |  |
| `source_id` | `varchar(255)` | YES | `NULL` |  |  |
| `first_response_at` | `timestamp` | YES | `NULL` |  |  |
| `sla_response_breached` | `tinyint(1)` | YES | `0` |  |  |
| `sla_resolution_breached` | `tinyint(1)` | YES | `0` |  |  |
| `csat_score` | `int(11)` | YES | `NULL` |  |  |
| `csat_comment` | `text` | YES | `NULL` |  |  |
| `custom_fields` | `longtext` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_tickets_assigned`: `assigned_to`, `status`
- `INDEX` `idx_tickets_contact`: `contact_id`
- `INDEX` `idx_tickets_created`: `created_at`
- `INDEX` `idx_tickets_priority`: `workspace_id`, `priority`, `status`
- `INDEX` `idx_tickets_status`: `status`
- `INDEX` `idx_tickets_workspace`: `workspace_id`, `status`
- `INDEX` `idx_tickets_workspace_status`: `workspace_id`, `company_id`, `status`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_ticket_number`: `workspace_id`, `ticket_number`

---
### Table: `tiktok_accounts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` |  |  |
| `company_id` | `int(11)` | NO | `NULL` | MUL |  |
| `tiktok_open_id` | `varchar(255)` | NO | `NULL` | MUL |  |
| `username` | `varchar(255)` | NO | `NULL` |  |  |
| `display_name` | `varchar(255)` | YES | `NULL` |  |  |
| `avatar_url` | `text` | YES | `NULL` |  |  |
| `access_token` | `text` | YES | `NULL` |  |  |
| `refresh_token` | `text` | YES | `NULL` |  |  |
| `token_expires_at` | `datetime` | YES | `NULL` |  |  |
| `refresh_expires_at` | `datetime` | YES | `NULL` |  |  |
| `status` | `varchar(50)` | YES | `'connected'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_company`: `company_id`
- `INDEX` `idx_tiktok_open`: `tiktok_open_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `tiktok_conversations`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `tiktok_account_id` | `int(11)` | NO | `NULL` | MUL |  |
| `conversation_id` | `varchar(255)` | NO | `NULL` |  |  |
| `contact_id` | `int(11)` | YES | `NULL` |  |  |
| `participant_open_id` | `varchar(255)` | YES | `NULL` |  |  |
| `participant_username` | `varchar(255)` | YES | `NULL` |  |  |
| `participant_avatar` | `text` | YES | `NULL` |  |  |
| `last_message_content` | `text` | YES | `NULL` |  |  |
| `last_message_at` | `datetime` | YES | `NULL` |  |  |
| `unread_count` | `int(11)` | YES | `0` |  |  |
| `status` | `varchar(50)` | YES | `'active'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `tiktok_account_id` -> `tiktok_accounts.id` (Constraint: `tiktok_conversations_ibfk_1`)

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_convo`: `tiktok_account_id`, `conversation_id`

---
### Table: `tiktok_messages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `conversation_id` | `int(11)` | NO | `NULL` | MUL |  |
| `remote_message_id` | `varchar(255)` | NO | `NULL` |  |  |
| `direction` | `enum('inbound','outbound')` | NO | `NULL` |  |  |
| `content` | `text` | YES | `NULL` |  |  |
| `message_type` | `varchar(50)` | YES | `'text'` |  |  |
| `status` | `varchar(50)` | YES | `'sent'` |  |  |
| `sent_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `conversation_id` -> `tiktok_conversations.id` (Constraint: `tiktok_messages_ibfk_1`)

**Indexes:**
- `INDEX` `idx_conversation`: `conversation_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `time_entries`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `job_id` | `int(11)` | YES | `NULL` | MUL |  |
| `project_id` | `int(11)` | YES | `NULL` |  |  |
| `task_description` | `varchar(255)` | YES | `NULL` |  |  |
| `start_time` | `datetime` | NO | `NULL` |  |  |
| `end_time` | `datetime` | YES | `NULL` |  |  |
| `duration_minutes` | `int(11)` | YES | `NULL` |  |  |
| `break_minutes` | `int(11)` | YES | `0` |  |  |
| `is_billable` | `tinyint(1)` | YES | `1` |  |  |
| `hourly_rate` | `decimal(10,2)` | YES | `NULL` |  |  |
| `total_amount` | `decimal(10,2)` | YES | `NULL` |  |  |
| `status` | `enum('running','paused','completed','approved','rejected')` | YES | `'running'` |  |  |
| `start_latitude` | `decimal(10,8)` | YES | `NULL` |  |  |
| `start_longitude` | `decimal(11,8)` | YES | `NULL` |  |  |
| `end_latitude` | `decimal(10,8)` | YES | `NULL` |  |  |
| `end_longitude` | `decimal(11,8)` | YES | `NULL` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `approved_by` | `int(11)` | YES | `NULL` |  |  |
| `approved_at` | `timestamp` | YES | `NULL` |  |  |
| `rejection_reason` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_time_entries_job`: `job_id`
- `INDEX` `idx_time_entries_status`: `workspace_id`, `status`
- `INDEX` `idx_time_entries_user`: `user_id`, `start_time`
- `INDEX` `idx_time_entries_workspace`: `workspace_id`, `user_id`, `start_time`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `time_off_requests`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `start_date` | `date` | NO | `NULL` | MUL |  |
| `end_date` | `date` | NO | `NULL` |  |  |
| `request_type` | `enum('vacation','sick','personal','unpaid')` | YES | `'vacation'` |  |  |
| `status` | `enum('pending','approved','rejected')` | YES | `'pending'` | MUL |  |
| `reason` | `text` | YES | `NULL` |  |  |
| `approved_by` | `int(11)` | YES | `NULL` | MUL |  |
| `approved_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `time_off_requests_ibfk_1`)
- `user_id` -> `users.id` (Constraint: `time_off_requests_ibfk_2`)
- `approved_by` -> `users.id` (Constraint: `time_off_requests_ibfk_3`)

**Indexes:**
- `INDEX` `approved_by`: `approved_by`
- `INDEX` `idx_dates`: `start_date`, `end_date`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_user`: `user_id`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `timesheets`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `period_start` | `date` | NO | `NULL` |  |  |
| `period_end` | `date` | NO | `NULL` |  |  |
| `total_hours` | `decimal(10,2)` | YES | `0.00` |  |  |
| `regular_hours` | `decimal(10,2)` | YES | `0.00` |  |  |
| `overtime_hours` | `decimal(10,2)` | YES | `0.00` |  |  |
| `break_hours` | `decimal(10,2)` | YES | `0.00` |  |  |
| `billable_hours` | `decimal(10,2)` | YES | `0.00` |  |  |
| `total_amount` | `decimal(12,2)` | YES | `0.00` |  |  |
| `status` | `enum('draft','submitted','approved','rejected','paid')` | YES | `'draft'` |  |  |
| `submitted_at` | `timestamp` | YES | `NULL` |  |  |
| `approved_by` | `int(11)` | YES | `NULL` |  |  |
| `approved_at` | `timestamp` | YES | `NULL` |  |  |
| `rejection_reason` | `text` | YES | `NULL` |  |  |
| `employee_notes` | `text` | YES | `NULL` |  |  |
| `manager_notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_timesheets_status`: `workspace_id`, `status`
- `INDEX` `idx_timesheets_workspace`: `workspace_id`, `period_start`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_user_period`: `user_id`, `period_start`

---
### Table: `touchpoints`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `channel` | `enum('email','sms','call','form','linkedin','website','ad','referral','other')` | NO | `NULL` | MUL |  |
| `action` | `varchar(100)` | NO | `NULL` |  |  |
| `campaign_id` | `int(11)` | YES | `NULL` | MUL |  |
| `content_id` | `varchar(255)` | YES | `NULL` |  |  |
| `content_type` | `varchar(50)` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `revenue_attributed` | `decimal(15,2)` | YES | `0.00` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_touchpoints_campaign`: `campaign_id`
- `INDEX` `idx_touchpoints_channel`: `channel`
- `INDEX` `idx_touchpoints_contact`: `contact_id`
- `INDEX` `idx_touchpoints_created`: `created_at`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `training_modules`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `program_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `content_type` | `enum('video','document','quiz','exercise','assessment')` | NO | `'document'` |  |  |
| `content_url` | `varchar(500)` | YES | `NULL` |  |  |
| `content_data` | `longtext` | YES | `NULL` |  |  |
| `order_index` | `int(11)` | YES | `0` | MUL |  |
| `duration_minutes` | `int(11)` | YES | `NULL` |  |  |
| `passing_score` | `int(11)` | YES | `NULL` |  |  |

**Foreign Keys:**
- `program_id` -> `sales_training_programs.id` (Constraint: `training_modules_ibfk_1`)

**Indexes:**
- `INDEX` `idx_order`: `order_index`
- `INDEX` `idx_program`: `program_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `training_progress`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `program_id` | `int(11)` | NO | `NULL` | MUL |  |
| `module_id` | `int(11)` | YES | `NULL` |  |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `status` | `enum('not_started','in_progress','completed','failed')` | YES | `'not_started'` | MUL |  |
| `score` | `int(11)` | YES | `NULL` |  |  |
| `started_at` | `timestamp` | YES | `NULL` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` |  |  |
| `attempts` | `int(11)` | YES | `0` |  |  |

**Foreign Keys:**
- `program_id` -> `sales_training_programs.id` (Constraint: `training_progress_ibfk_1`)

**Indexes:**
- `INDEX` `idx_program`: `program_id`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `usage_metrics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `metric_date` | `date` | NO | `NULL` | MUL |  |
| `contacts_count` | `int(11)` | YES | `0` |  |  |
| `contacts_limit` | `int(11)` | YES | `NULL` |  |  |
| `emails_sent` | `int(11)` | YES | `0` |  |  |
| `sms_sent` | `int(11)` | YES | `0` |  |  |
| `emails_limit` | `int(11)` | YES | `NULL` |  |  |
| `sms_limit` | `int(11)` | YES | `NULL` |  |  |
| `storage_used_mb` | `int(11)` | YES | `0` |  |  |
| `storage_limit_mb` | `int(11)` | YES | `NULL` |  |  |
| `api_calls` | `int(11)` | YES | `0` |  |  |
| `api_calls_limit` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_date`: `metric_date`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_metric`: `workspace_id`, `metric_date`

---
### Table: `usage_records`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20)` | NO | `NULL` | PRI | auto_increment |
| `agency_id` | `int(11)` | NO | `NULL` | MUL |  |
| `subaccount_id` | `int(11)` | YES | `NULL` |  |  |
| `period_year` | `smallint(6)` | NO | `NULL` | MUL |  |
| `period_month` | `tinyint(4)` | NO | `NULL` |  |  |
| `emails_sent` | `int(11)` | YES | `0` |  |  |
| `sms_sent` | `int(11)` | YES | `0` |  |  |
| `calls_made` | `int(11)` | YES | `0` |  |  |
| `contacts_count` | `int(11)` | YES | `0` |  |  |
| `storage_bytes` | `bigint(20)` | YES | `0` |  |  |
| `api_calls` | `int(11)` | YES | `0` |  |  |
| `last_updated` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_usage_agency`: `agency_id`
- `INDEX` `idx_usage_period`: `period_year`, `period_month`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_usage_period`: `agency_id`, `subaccount_id`, `period_year`, `period_month`

---
### Table: `user_automation_instances`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `client_id` | `int(11)` | YES | `NULL` |  |  |
| `recipe_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `customized_steps` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('draft','active','paused','completed')` | YES | `'draft'` |  |  |
| `trigger_config` | `longtext` | YES | `NULL` |  |  |
| `stats` | `longtext` | YES | `NULL` |  |  |
| `last_triggered_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |
| `automation_id` | `int(11)` | YES | `NULL` | MUL |  |
| `flow_id` | `int(11)` | YES | `NULL` | MUL |  |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `user_automation_instances_ibfk_1`)
- `recipe_id` -> `automation_recipes.id` (Constraint: `user_automation_instances_ibfk_2`)

**Indexes:**
- `INDEX` `idx_instances_automation`: `automation_id`
- `INDEX` `idx_instances_flow`: `flow_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `recipe_id`: `recipe_id`
- `INDEX` `user_id`: `user_id`

---
### Table: `user_availability`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `day_of_week` | `tinyint(4)` | NO | `NULL` |  |  |
| `start_time` | `time` | NO | `NULL` |  |  |
| `end_time` | `time` | NO | `NULL` |  |  |
| `is_available` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `user_availability_ibfk_1`)

**Indexes:**
- `INDEX` `idx_availability_day`: `user_id`, `day_of_week`
- `INDEX` `idx_availability_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `workspace_id`: `workspace_id`

---
### Table: `user_commission_plans`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `commission_plan_id` | `int(11)` | NO | `NULL` | MUL |  |
| `custom_rate` | `decimal(5,2)` | YES | `NULL` |  |  |
| `custom_tiers` | `longtext` | YES | `NULL` |  |  |
| `effective_from` | `date` | NO | `NULL` |  |  |
| `effective_to` | `date` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `commission_plan_id` -> `commission_plans.id` (Constraint: `user_commission_plans_ibfk_1`)

**Indexes:**
- `INDEX` `commission_plan_id`: `commission_plan_id`
- `INDEX` `idx_user_commission`: `user_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `user_company_access`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `company_id` | `int(11)` | NO | `NULL` | MUL |  |
| `role` | `enum('owner','admin','member','viewer')` | NO | `'member'` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_uca_company`: `company_id`
- `INDEX` `idx_uca_workspace_user`: `workspace_id`, `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_user_company`: `workspace_id`, `user_id`, `company_id`

---
### Table: `user_industry_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `industry_type_id` | `int(11)` | NO | `NULL` | MUL |  |
| `business_name` | `varchar(255)` | YES | `NULL` |  |  |
| `business_phone` | `varchar(50)` | YES | `NULL` |  |  |
| `business_email` | `varchar(255)` | YES | `NULL` |  |  |
| `business_address` | `text` | YES | `NULL` |  |  |
| `business_hours` | `longtext` | YES | `NULL` |  |  |
| `service_area` | `text` | YES | `NULL` |  |  |
| `license_number` | `varchar(100)` | YES | `NULL` |  |  |
| `insurance_info` | `text` | YES | `NULL` |  |  |
| `custom_settings` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `industry_type_id`: `industry_type_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_user_industry`: `user_id`, `industry_type_id`

---
### Table: `user_preferences`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | UNI |  |
| `preferences` | `longtext` | NO | `NULL` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_user_preferences_user_id`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_user_preferences`: `user_id`

---
### Table: `user_roles`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `user_id` | `int(11)` | NO | `NULL` | PRI |  |
| `role_id` | `int(11)` | NO | `NULL` | PRI |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `UNIQUE` `PRIMARY`: `user_id`, `role_id`
- `INDEX` `role_id`: `role_id`

---
### Table: `users`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `email` | `varchar(255)` | NO | `NULL` | UNI |  |
| `password` | `varchar(255)` | YES | `NULL` |  |  |
| `password_hash` | `varchar(255)` | NO | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `zapier_api_key` | `varchar(64)` | YES | `NULL` |  |  |
| `role_id` | `int(11)` | YES | `NULL` | MUL |  |
| `last_login` | `timestamp` | YES | `NULL` |  |  |
| `agency_id` | `int(11)` | YES | `NULL` | MUL |  |
| `user_type` | `enum('platform_admin','agency_user','subaccount_user')` | YES | `'subaccount_user'` |  |  |
| `current_subaccount_id` | `int(11)` | YES | `NULL` |  |  |

**Indexes:**
- `UNIQUE` `email`: `email`
- `INDEX` `idx_users_agency`: `agency_id`
- `INDEX` `idx_users_email`: `email`
- `INDEX` `idx_users_role`: `role_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `video_meetings_log`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `appointment_id` | `int(11)` | NO | `NULL` | MUL |  |
| `provider` | `enum('zoom','google_meet','microsoft_teams')` | NO | `NULL` | MUL |  |
| `meeting_id` | `varchar(255)` | NO | `NULL` |  |  |
| `action` | `enum('created','updated','deleted','started','ended')` | NO | `NULL` |  |  |
| `response_data` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `appointment_id` -> `appointments.id` (Constraint: `video_meetings_log_ibfk_1`)

**Indexes:**
- `INDEX` `idx_appointment`: `appointment_id`
- `INDEX` `idx_provider`: `provider`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `video_provider_connections`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `provider` | `enum('zoom','google_meet','microsoft_teams')` | NO | `NULL` | MUL |  |
| `access_token` | `text` | NO | `NULL` |  |  |
| `refresh_token` | `text` | YES | `NULL` |  |  |
| `token_expires_at` | `datetime` | YES | `NULL` |  |  |
| `provider_user_id` | `varchar(255)` | YES | `NULL` |  |  |
| `provider_email` | `varchar(255)` | YES | `NULL` |  |  |
| `provider_data` | `longtext` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_provider`: `provider`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_user_provider`: `user_id`, `provider`

---
### Table: `visitor_page_visits`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `session_id` | `int(11)` | NO | `NULL` | MUL |  |
| `page_url` | `text` | NO | `NULL` |  |  |
| `page_title` | `varchar(500)` | YES | `NULL` |  |  |
| `visited_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `time_on_page_seconds` | `int(11)` | YES | `NULL` |  |  |

**Foreign Keys:**
- `session_id` -> `visitor_sessions.id` (Constraint: `visitor_page_visits_ibfk_1`)

**Indexes:**
- `INDEX` `idx_session_id`: `session_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `visitor_sessions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `pool_id` | `int(11)` | NO | `NULL` | MUL |  |
| `visitor_id` | `varchar(64)` | NO | `NULL` | MUL |  |
| `assigned_number_id` | `int(11)` | YES | `NULL` | MUL |  |
| `utm_source` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_medium` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_campaign` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_term` | `varchar(255)` | YES | `NULL` |  |  |
| `utm_content` | `varchar(255)` | YES | `NULL` |  |  |
| `gclid` | `varchar(255)` | YES | `NULL` | MUL |  |
| `fbclid` | `varchar(255)` | YES | `NULL` |  |  |
| `msclkid` | `varchar(255)` | YES | `NULL` |  |  |
| `referrer` | `text` | YES | `NULL` |  |  |
| `landing_page` | `text` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `device_type` | `enum('desktop','mobile','tablet','unknown')` | YES | `'unknown'` |  |  |
| `first_visit_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `last_activity_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `expires_at` | `timestamp` | YES | `NULL` | MUL |  |
| `has_called` | `tinyint(1)` | YES | `0` | MUL |  |
| `call_log_id` | `int(11)` | YES | `NULL` | MUL |  |

**Foreign Keys:**
- `pool_id` -> `number_pools.id` (Constraint: `visitor_sessions_ibfk_1`)
- `assigned_number_id` -> `pool_numbers.id` (Constraint: `visitor_sessions_ibfk_2`)
- `call_log_id` -> `phone_call_logs.id` (Constraint: `visitor_sessions_ibfk_3`)

**Indexes:**
- `INDEX` `call_log_id`: `call_log_id`
- `INDEX` `idx_assigned_number`: `assigned_number_id`
- `INDEX` `idx_expires_at`: `expires_at`
- `INDEX` `idx_gclid`: `gclid`
- `INDEX` `idx_has_called`: `has_called`
- `INDEX` `idx_pool_id`: `pool_id`
- `INDEX` `idx_visitor_id`: `visitor_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `voicemails`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `phone_number_id` | `int(11)` | NO | `NULL` | MUL |  |
| `caller_number` | `varchar(50)` | NO | `NULL` |  |  |
| `caller_name` | `varchar(255)` | YES | `NULL` |  |  |
| `contact_id` | `int(11)` | YES | `NULL` |  |  |
| `duration_seconds` | `int(11)` | NO | `0` |  |  |
| `recording_url` | `varchar(500)` | NO | `NULL` |  |  |
| `transcription` | `text` | YES | `NULL` |  |  |
| `transcription_status` | `enum('pending','completed','failed','disabled')` | NO | `'pending'` |  |  |
| `status` | `enum('new','read','archived','deleted')` | NO | `'new'` | MUL |  |
| `received_at` | `datetime` | NO | `NULL` |  |  |
| `read_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_voicemails_phone`: `phone_number_id`
- `INDEX` `idx_voicemails_status`: `status`
- `INDEX` `idx_voicemails_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `warmup_messages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `run_id` | `int(11)` | NO | `NULL` | MUL |  |
| `sending_account_id` | `int(11)` | NO | `NULL` | MUL |  |
| `recipient_email` | `varchar(255)` | NO | `NULL` |  |  |
| `partner_account` | `varchar(255)` | YES | `NULL` |  |  |
| `subject` | `varchar(255)` | NO | `NULL` |  |  |
| `body` | `text` | NO | `NULL` |  |  |
| `inbox_hit` | `tinyint(1)` | NO | `1` |  |  |
| `spam_hit` | `tinyint(1)` | NO | `0` |  |  |
| `delivered_at` | `datetime` | YES | `NULL` |  |  |
| `opened_at` | `datetime` | YES | `NULL` |  |  |
| `reply_received_at` | `datetime` | YES | `NULL` |  |  |
| `error` | `text` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `idx_warmup_messages_run`: `run_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `sending_account_id`: `sending_account_id`

---
### Table: `warmup_profiles`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `sending_account_id` | `int(11)` | NO | `NULL` | UNI |  |
| `domain` | `varchar(255)` | NO | `NULL` |  |  |
| `start_volume` | `int(11)` | NO | `10` |  |  |
| `ramp_increment` | `int(11)` | NO | `5` |  |  |
| `ramp_interval_days` | `int(11)` | NO | `3` |  |  |
| `target_volume` | `int(11)` | NO | `150` |  |  |
| `maintenance_volume` | `int(11)` | NO | `20` |  |  |
| `pause_on_issue` | `tinyint(1)` | NO | `1` |  |  |
| `status` | `varchar(32)` | NO | `'active'` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_warmup_profiles_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_warmup_profile_account`: `sending_account_id`

---
### Table: `warmup_runs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `profile_id` | `int(11)` | NO | `NULL` | MUL |  |
| `sending_account_id` | `int(11)` | NO | `NULL` | MUL |  |
| `run_date` | `date` | NO | `NULL` |  |  |
| `planned_volume` | `int(11)` | NO | `0` |  |  |
| `sent_volume` | `int(11)` | NO | `0` |  |  |
| `inbox_hits` | `int(11)` | NO | `0` |  |  |
| `spam_hits` | `int(11)` | NO | `0` |  |  |
| `replies` | `int(11)` | NO | `0` |  |  |
| `status` | `varchar(32)` | NO | `'scheduled'` |  |  |
| `last_error` | `text` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_warmup_runs_profile`: `profile_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_warmup_run_account_date`: `sending_account_id`, `run_date`

---
### Table: `webchat_sessions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `widget_id` | `int(11)` | NO | `NULL` | MUL |  |
| `conversation_id` | `int(11)` | YES | `NULL` | MUL |  |
| `session_key` | `varchar(64)` | NO | `NULL` | UNI |  |
| `visitor_id` | `varchar(255)` | YES | `NULL` |  |  |
| `visitor_name` | `varchar(255)` | YES | `NULL` |  |  |
| `visitor_email` | `varchar(255)` | YES | `NULL` |  |  |
| `visitor_phone` | `varchar(50)` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `referrer` | `text` | YES | `NULL` |  |  |
| `current_page` | `text` | YES | `NULL` |  |  |
| `status` | `enum('active','ended')` | YES | `'active'` |  |  |
| `started_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `ended_at` | `timestamp` | YES | `NULL` |  |  |

**Foreign Keys:**
- `widget_id` -> `webchat_widgets.id` (Constraint: `webchat_sessions_ibfk_1`)

**Indexes:**
- `INDEX` `idx_conversation`: `conversation_id`
- `INDEX` `idx_session_key`: `session_key`
- `INDEX` `idx_widget`: `widget_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `session_key`: `session_key`

---
### Table: `webchat_widgets`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `widget_key` | `varchar(64)` | NO | `NULL` | UNI |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `theme_color` | `varchar(7)` | YES | `'#3b82f6'` |  |  |
| `position` | `enum('bottom-right','bottom-left','top-right','top-left')` | YES | `'bottom-right'` |  |  |
| `greeting_message` | `text` | YES | `NULL` |  |  |
| `offline_message` | `text` | YES | `NULL` |  |  |
| `auto_open` | `tinyint(1)` | YES | `0` |  |  |
| `auto_open_delay` | `int(11)` | YES | `5` |  |  |
| `show_agent_avatars` | `tinyint(1)` | YES | `1` |  |  |
| `enable_file_uploads` | `tinyint(1)` | YES | `1` |  |  |
| `enable_emojis` | `tinyint(1)` | YES | `1` |  |  |
| `assigned_user_id` | `int(11)` | YES | `NULL` |  |  |
| `assigned_team_id` | `int(11)` | YES | `NULL` |  |  |
| `business_hours_only` | `tinyint(1)` | YES | `0` |  |  |
| `domains_whitelist` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_widget_key`: `widget_key`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `widget_key`: `widget_key`

---
### Table: `webforms`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `fields` | `longtext` | YES | `NULL` |  |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `style` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('draft','published','archived')` | YES | `'draft'` | MUL |  |
| `folder_id` | `int(11)` | YES | `NULL` |  |  |
| `is_template` | `tinyint(1)` | YES | `0` |  |  |
| `views` | `int(11)` | YES | `0` |  |  |
| `submissions_count` | `int(11)` | YES | `0` |  |  |
| `conversion_rate` | `decimal(5,2)` | YES | `0.00` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_webforms_status`: `status`
- `INDEX` `idx_webforms_user`: `user_id`
- `INDEX` `idx_webforms_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `webforms_activity_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `action` | `varchar(100)` | NO | `NULL` |  |  |
| `resource_type` | `varchar(50)` | NO | `NULL` | MUL |  |
| `resource_id` | `int(11)` | NO | `NULL` |  |  |
| `details` | `longtext` | YES | `NULL` |  |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `webforms_activity_logs_user_fk`)

**Indexes:**
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_fb_activity_logs_workspace_id`: `workspace_id`
- `INDEX` `idx_resource`: `resource_type`, `resource_id`
- `INDEX` `idx_user_id`: `user_id`
- `INDEX` `idx_webforms_activity_logs_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `webforms_field_interactions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `form_id` | `int(11)` | NO | `NULL` | MUL |  |
| `field_id` | `int(11)` | NO | `NULL` | MUL |  |
| `session_id` | `varchar(64)` | NO | `NULL` | MUL |  |
| `interaction_type` | `varchar(50)` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Foreign Keys:**
- `form_id` -> `webforms_forms.id` (Constraint: `webforms_field_interactions_ibfk_1`)
- `field_id` -> `webforms_form_fields.id` (Constraint: `webforms_field_interactions_ibfk_2`)

**Indexes:**
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_fb_field_interactions_workspace_id`: `workspace_id`
- `INDEX` `idx_field_id`: `field_id`
- `INDEX` `idx_form_id`: `form_id`
- `INDEX` `idx_session_id`: `session_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `webforms_field_options`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `field_id` | `int(11)` | NO | `NULL` | MUL |  |
| `label` | `varchar(500)` | NO | `NULL` |  |  |
| `value` | `varchar(500)` | NO | `NULL` |  |  |
| `position` | `int(11)` | NO | `NULL` | MUL |  |
| `is_default` | `tinyint(1)` | YES | `0` |  |  |
| `conditional_logic` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Foreign Keys:**
- `field_id` -> `webforms_form_fields.id` (Constraint: `webforms_field_options_ibfk_1`)

**Indexes:**
- `INDEX` `idx_fb_field_options_workspace_id`: `workspace_id`
- `INDEX` `idx_field_id`: `field_id`
- `INDEX` `idx_position`: `position`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `webforms_field_responses`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `submission_id` | `int(11)` | NO | `NULL` | MUL |  |
| `field_id` | `int(11)` | NO | `NULL` | MUL |  |
| `field_name` | `varchar(500)` | YES | `NULL` |  |  |
| `field_type` | `varchar(50)` | YES | `NULL` |  |  |
| `response_value` | `text` | YES | `NULL` |  |  |
| `response_text` | `text` | YES | `NULL` |  |  |
| `file_name` | `varchar(500)` | YES | `NULL` |  |  |
| `file_path` | `varchar(1000)` | YES | `NULL` |  |  |
| `file_size` | `int(11)` | YES | `NULL` |  |  |
| `file_type` | `varchar(100)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Foreign Keys:**
- `submission_id` -> `webforms_form_submissions.id` (Constraint: `webforms_field_responses_ibfk_1`)
- `field_id` -> `webforms_form_fields.id` (Constraint: `webforms_field_responses_ibfk_2`)

**Indexes:**
- `INDEX` `idx_fb_field_responses_workspace_id`: `workspace_id`
- `INDEX` `idx_field_id`: `field_id`
- `INDEX` `idx_submission_id`: `submission_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `webforms_folders`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `parent_id` | `int(11)` | YES | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `description` | `text` | YES | `NULL` |  |  |
| `color` | `varchar(7)` | YES | `'#3B82F6'` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `sort_order` | `int(11)` | YES | `0` |  |  |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |

**Foreign Keys:**
- `parent_id` -> `webforms_folders.id` (Constraint: `webforms_folders_ibfk_1`)
- `user_id` -> `users.id` (Constraint: `webforms_folders_user_fk`)

**Indexes:**
- `INDEX` `idx_fb_folders_workspace_id`: `workspace_id`
- `INDEX` `idx_parent_id`: `parent_id`
- `INDEX` `idx_user_id`: `user_id`
- `INDEX` `idx_webforms_folders_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `webforms_form_analytics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `form_id` | `int(11)` | NO | `NULL` | MUL |  |
| `date` | `date` | NO | `NULL` | MUL |  |
| `views` | `int(11)` | YES | `0` |  |  |
| `starts` | `int(11)` | YES | `0` |  |  |
| `completions` | `int(11)` | YES | `0` |  |  |
| `unique_visitors` | `int(11)` | YES | `0` |  |  |
| `conversion_rate` | `decimal(5,2)` | YES | `0.00` |  |  |
| `avg_completion_time` | `int(11)` | YES | `0` |  |  |
| `device_desktop` | `int(11)` | YES | `0` |  |  |
| `device_mobile` | `int(11)` | YES | `0` |  |  |
| `device_tablet` | `int(11)` | YES | `0` |  |  |
| `top_countries` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Foreign Keys:**
- `form_id` -> `webforms_forms.id` (Constraint: `webforms_form_analytics_ibfk_1`)

**Indexes:**
- `INDEX` `idx_date`: `date`
- `INDEX` `idx_fb_form_analytics_workspace_id`: `workspace_id`
- `INDEX` `idx_form_id`: `form_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_form_date`: `form_id`, `date`

---
### Table: `webforms_form_fields`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `form_id` | `int(11)` | NO | `NULL` | MUL |  |
| `field_type` | `enum('text','textarea','email','number','phone','url','date','time','datetime','select','multiselect','radio','checkbox','file','rating','scale','matrix','yes_no','signature','html','section','page_break')` | NO | `NULL` |  |  |
| `label` | `varchar(500)` | NO | `NULL` |  |  |
| `placeholder` | `varchar(500)` | YES | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `required` | `tinyint(1)` | YES | `0` |  |  |
| `position` | `int(11)` | NO | `NULL` | MUL |  |
| `properties` | `longtext` | YES | `NULL` |  |  |
| `validation` | `longtext` | YES | `NULL` |  |  |
| `conditional_logic` | `longtext` | YES | `NULL` |  |  |
| `styling` | `longtext` | YES | `NULL` |  |  |
| `depends_on_field_id` | `int(11)` | YES | `NULL` | MUL |  |
| `depends_on_value` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Foreign Keys:**
- `form_id` -> `webforms_forms.id` (Constraint: `webforms_form_fields_ibfk_1`)
- `depends_on_field_id` -> `webforms_form_fields.id` (Constraint: `webforms_form_fields_ibfk_2`)

**Indexes:**
- `INDEX` `depends_on_field_id`: `depends_on_field_id`
- `INDEX` `idx_fb_form_fields_workspace_id`: `workspace_id`
- `INDEX` `idx_fields_form_position`: `form_id`, `position`
- `INDEX` `idx_form_id`: `form_id`
- `INDEX` `idx_position`: `position`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `webforms_form_starts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `form_id` | `int(11)` | NO | `NULL` | MUL |  |
| `session_id` | `varchar(64)` | NO | `NULL` | MUL |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Foreign Keys:**
- `form_id` -> `webforms_forms.id` (Constraint: `webforms_form_starts_ibfk_1`)

**Indexes:**
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_fb_form_starts_workspace_id`: `workspace_id`
- `INDEX` `idx_form_id`: `form_id`
- `INDEX` `idx_form_session_created`: `form_id`, `session_id`, `created_at`
- `INDEX` `idx_session_id`: `session_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `webforms_form_submissions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `form_id` | `int(11)` | NO | `NULL` | MUL |  |
| `submission_token` | `varchar(100)` | NO | `NULL` | UNI |  |
| `ip_address` | `varchar(45)` | YES | `NULL` | MUL |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `country` | `varchar(2)` | YES | `NULL` | MUL |  |
| `city` | `varchar(100)` | YES | `NULL` |  |  |
| `latitude` | `decimal(10,8)` | YES | `NULL` |  |  |
| `longitude` | `decimal(11,8)` | YES | `NULL` |  |  |
| `submission_data` | `longtext` | NO | `NULL` |  |  |
| `completion_time` | `int(11)` | YES | `NULL` |  |  |
| `spam_score` | `int(11)` | YES | `0` |  |  |
| `spam_reasons` | `longtext` | YES | `NULL` |  |  |
| `is_spam` | `tinyint(1)` | YES | `0` |  |  |
| `status` | `enum('new','read','starred','archived','deleted')` | YES | `'new'` | MUL |  |
| `tags` | `longtext` | YES | `NULL` |  |  |
| `respondent_email` | `varchar(255)` | YES | `NULL` |  |  |
| `respondent_phone` | `varchar(50)` | YES | `NULL` |  |  |
| `started_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `completed_at` | `timestamp` | YES | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Foreign Keys:**
- `form_id` -> `webforms_forms.id` (Constraint: `webforms_form_submissions_ibfk_1`)

**Indexes:**
- `INDEX` `idx_completed_at`: `completed_at`
- `INDEX` `idx_country`: `country`
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_fb_form_submissions_workspace_id`: `workspace_id`
- `INDEX` `idx_form_id`: `form_id`
- `INDEX` `idx_ip_address`: `ip_address`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_submissions_form_date`: `form_id`, `created_at`
- `INDEX` `idx_submissions_form_spam`: `form_id`, `is_spam`
- `INDEX` `idx_submission_token`: `submission_token`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `submission_token`: `submission_token`

---
### Table: `webforms_form_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `name` | `varchar(500)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `category` | `varchar(100)` | YES | `NULL` | MUL |  |
| `thumbnail_url` | `varchar(1000)` | YES | `NULL` |  |  |
| `template_data` | `longtext` | NO | `NULL` |  |  |
| `preview_data` | `longtext` | YES | `NULL` |  |  |
| `usage_count` | `int(11)` | YES | `0` |  |  |
| `rating` | `decimal(3,2)` | YES | `0.00` |  |  |
| `tags` | `longtext` | YES | `NULL` |  |  |
| `language` | `varchar(10)` | YES | `'en'` |  |  |
| `is_featured` | `tinyint(1)` | YES | `0` | MUL |  |
| `is_active` | `tinyint(1)` | YES | `1` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Indexes:**
- `INDEX` `idx_category`: `category`
- `INDEX` `idx_fb_form_templates_workspace_id`: `workspace_id`
- `INDEX` `idx_is_active`: `is_active`
- `INDEX` `idx_is_featured`: `is_featured`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `webforms_form_views`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `form_id` | `int(11)` | NO | `NULL` | MUL |  |
| `ip_address` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `referrer` | `text` | YES | `NULL` |  |  |
| `session_id` | `varchar(64)` | YES | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Foreign Keys:**
- `form_id` -> `webforms_forms.id` (Constraint: `webforms_form_views_ibfk_1`)

**Indexes:**
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_fb_form_views_workspace_id`: `workspace_id`
- `INDEX` `idx_form_id`: `form_id`
- `INDEX` `idx_form_ip_created`: `form_id`, `ip_address`, `created_at`
- `INDEX` `idx_session_id`: `session_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `webforms_forms`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `title` | `varchar(500)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `folder_id` | `int(11)` | YES | `NULL` | MUL |  |
| `status` | `enum('draft','published','archived')` | YES | `'draft'` | MUL |  |
| `type` | `enum('single_step','multi_step','popup')` | YES | `'single_step'` |  |  |
| `welcome_screen` | `longtext` | YES | `NULL` |  |  |
| `thank_you_screen` | `longtext` | YES | `NULL` |  |  |
| `theme` | `longtext` | YES | `NULL` |  |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `spam_protection` | `longtext` | YES | `NULL` |  |  |
| `publish_at` | `timestamp` | YES | `NULL` |  |  |
| `expire_at` | `timestamp` | YES | `NULL` |  |  |
| `max_submissions` | `int(11)` | YES | `NULL` |  |  |
| `version` | `int(11)` | YES | `1` |  |  |
| `parent_version_id` | `int(11)` | YES | `NULL` | MUL |  |
| `language` | `varchar(10)` | YES | `'en'` |  |  |
| `tags` | `longtext` | YES | `NULL` |  |  |
| `metadata` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |

**Foreign Keys:**
- `folder_id` -> `webforms_folders.id` (Constraint: `webforms_forms_ibfk_2`)
- `parent_version_id` -> `webforms_forms.id` (Constraint: `webforms_forms_ibfk_3`)
- `user_id` -> `users.id` (Constraint: `webforms_forms_user_fk`)

**Indexes:**
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_fb_forms_workspace_id`: `workspace_id`
- `INDEX` `idx_folder_id`: `folder_id`
- `INDEX` `idx_forms_user_status`: `user_id`, `status`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_user_id`: `user_id`
- `INDEX` `idx_webforms_forms_workspace`: `workspace_id`
- `INDEX` `parent_version_id`: `parent_version_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `webforms_spam_rules`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `rule_type` | `enum('ip_block','ip_allow','country_block','country_allow','email_domain_block','user_agent_block','rate_limit')` | NO | `NULL` | MUL |  |
| `rule_value` | `varchar(500)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` | MUL |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `webforms_spam_rules_user_fk`)

**Indexes:**
- `INDEX` `idx_fb_spam_rules_workspace_id`: `workspace_id`
- `INDEX` `idx_is_active`: `is_active`
- `INDEX` `idx_rule_type`: `rule_type`
- `INDEX` `idx_user_id`: `user_id`
- `INDEX` `idx_webforms_spam_rules_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `webforms_user_settings`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | UNI |  |
| `settings` | `longtext` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `webforms_user_settings_user_fk`)

**Indexes:**
- `INDEX` `idx_fb_user_settings_workspace_id`: `workspace_id`
- `INDEX` `idx_user_settings_user_id`: `user_id`
- `INDEX` `idx_webforms_user_settings_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_user_id`: `user_id`

---
### Table: `webforms_users`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `username` | `varchar(100)` | NO | `NULL` | UNI |  |
| `email` | `varchar(255)` | NO | `NULL` | UNI |  |
| `password_hash` | `varchar(255)` | NO | `NULL` |  |  |
| `first_name` | `varchar(100)` | YES | `NULL` |  |  |
| `last_name` | `varchar(100)` | YES | `NULL` |  |  |
| `role` | `enum('admin','user','viewer')` | YES | `'user'` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` |  |  |
| `last_login` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `email_notifications` | `tinyint(1)` | YES | `1` |  |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Indexes:**
- `UNIQUE` `email`: `email`
- `INDEX` `idx_email`: `email`
- `INDEX` `idx_fb_users_workspace_id`: `workspace_id`
- `INDEX` `idx_username`: `username`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `username`: `username`

---
### Table: `webforms_webhook_deliveries`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `webhook_id` | `int(11)` | NO | `NULL` | MUL |  |
| `event_name` | `varchar(100)` | NO | `NULL` |  |  |
| `payload` | `longtext` | NO | `NULL` |  |  |
| `response_status` | `int(11)` | YES | `NULL` |  |  |
| `response_body` | `text` | YES | `NULL` |  |  |
| `attempt_number` | `int(11)` | YES | `1` |  |  |
| `delivered_at` | `timestamp` | YES | `NULL` |  |  |
| `status` | `enum('pending','success','failed','retrying')` | YES | `'pending'` | MUL |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |

**Foreign Keys:**
- `webhook_id` -> `webforms_webhooks.id` (Constraint: `webforms_webhook_deliveries_ibfk_1`)

**Indexes:**
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_fb_webhook_deliveries_workspace_id`: `workspace_id`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_webhook_id`: `webhook_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `webforms_webhooks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `form_id` | `int(11)` | YES | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `url` | `varchar(1000)` | NO | `NULL` |  |  |
| `secret` | `varchar(255)` | YES | `NULL` |  |  |
| `events` | `longtext` | NO | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` | MUL |  |
| `retry_count` | `int(11)` | YES | `3` |  |  |
| `timeout` | `int(11)` | YES | `30` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |

**Foreign Keys:**
- `form_id` -> `webforms_forms.id` (Constraint: `webforms_webhooks_ibfk_2`)
- `user_id` -> `users.id` (Constraint: `webforms_webhooks_user_fk`)

**Indexes:**
- `INDEX` `idx_fb_webhooks_workspace_id`: `workspace_id`
- `INDEX` `idx_form_id`: `form_id`
- `INDEX` `idx_is_active`: `is_active`
- `INDEX` `idx_user_id`: `user_id`
- `INDEX` `idx_webforms_webhooks_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `webhook_deliveries`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `webhook_id` | `int(11)` | NO | `NULL` | MUL |  |
| `event_type` | `varchar(100)` | NO | `NULL` |  |  |
| `payload` | `longtext` | NO | `NULL` |  |  |
| `response_status` | `int(11)` | YES | `NULL` |  |  |
| `response_body` | `text` | YES | `NULL` |  |  |
| `response_time_ms` | `int(11)` | YES | `NULL` |  |  |
| `status` | `enum('pending','success','failed','retrying')` | NO | `'pending'` | MUL |  |
| `attempts` | `int(11)` | NO | `0` |  |  |
| `next_retry_at` | `datetime` | YES | `NULL` |  |  |
| `delivered_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` | MUL |  |

**Foreign Keys:**
- `webhook_id` -> `webhook_endpoints.id` (Constraint: `webhook_deliveries_ibfk_1`)

**Indexes:**
- `INDEX` `idx_deliveries_created`: `created_at`
- `INDEX` `idx_deliveries_status`: `status`
- `INDEX` `idx_deliveries_webhook`: `webhook_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `webhook_endpoints`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `url` | `varchar(500)` | NO | `NULL` |  |  |
| `secret` | `varchar(255)` | YES | `NULL` |  |  |
| `events` | `longtext` | NO | `NULL` |  |  |
| `headers` | `longtext` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | NO | `1` |  |  |
| `last_triggered_at` | `datetime` | YES | `NULL` |  |  |
| `success_count` | `int(11)` | NO | `0` |  |  |
| `failure_count` | `int(11)` | NO | `0` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `user_id` -> `users.id` (Constraint: `webhook_endpoints_ibfk_1`)

**Indexes:**
- `INDEX` `idx_webhooks_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `webhook_events`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `channel` | `varchar(50)` | NO | `NULL` | MUL |  |
| `provider` | `varchar(50)` | NO | `NULL` |  |  |
| `event_type` | `varchar(100)` | YES | `NULL` |  |  |
| `event_id` | `varchar(255)` | YES | `NULL` | MUL |  |
| `payload` | `longtext` | NO | `NULL` |  |  |
| `headers` | `longtext` | YES | `NULL` |  |  |
| `status` | `enum('received','processed','failed','ignored')` | YES | `'received'` | MUL |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `channel_account_id` | `int(11)` | YES | `NULL` |  |  |
| `message_id` | `int(11)` | YES | `NULL` |  |  |
| `source_ip` | `varchar(50)` | YES | `NULL` |  |  |
| `signature_valid` | `tinyint(1)` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` | MUL |  |
| `processed_at` | `datetime` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_webhook_events_channel`: `channel`
- `INDEX` `idx_webhook_events_created`: `created_at`
- `INDEX` `idx_webhook_events_event_id`: `event_id`
- `INDEX` `idx_webhook_events_status`: `status`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `webhook_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `event` | `varchar(100)` | NO | `NULL` | MUL |  |
| `payload` | `longtext` | YES | `NULL` |  |  |
| `results` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Indexes:**
- `INDEX` `idx_webhook_logs_created`: `created_at`
- `INDEX` `idx_webhook_logs_event`: `event`
- `INDEX` `idx_webhook_logs_user`: `user_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `webhooks`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `url` | `varchar(2048)` | NO | `NULL` |  |  |
| `secret` | `varchar(255)` | YES | `NULL` |  |  |
| `events` | `longtext` | YES | `NULL` |  |  |
| `headers` | `longtext` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` | MUL |  |
| `retry_count` | `int(11)` | YES | `3` |  |  |
| `timeout` | `int(11)` | YES | `30` |  |  |
| `last_triggered_at` | `timestamp` | YES | `NULL` |  |  |
| `last_status_code` | `int(11)` | YES | `NULL` |  |  |
| `last_response` | `text` | YES | `NULL` |  |  |
| `failure_count` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_webhooks_active`: `is_active`
- `INDEX` `idx_webhooks_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `webinar_registrants`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `webinar_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `attendance_status` | `enum('registered','attended','no_show')` | YES | `'registered'` |  |  |
| `joined_at` | `timestamp` | YES | `NULL` |  |  |
| `left_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Indexes:**
- `INDEX` `contact_id`: `contact_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `webinar_id`: `webinar_id`
- `INDEX` `workspace_id`: `workspace_id`

---
### Table: `webinars`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `thumbnail` | `varchar(255)` | YES | `NULL` |  |  |
| `scheduled_at` | `timestamp` | YES | `NULL` |  |  |
| `duration_minutes` | `int(11)` | YES | `60` |  |  |
| `status` | `enum('draft','scheduled','live','ended')` | YES | `'draft'` |  |  |
| `stream_key` | `varchar(100)` | YES | `NULL` |  |  |
| `stream_url` | `varchar(255)` | YES | `NULL` |  |  |
| `recording_url` | `varchar(255)` | YES | `NULL` |  |  |
| `is_evergreen` | `tinyint(1)` | YES | `0` |  |  |
| `max_registrants` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`
- `INDEX` `workspace_id`: `workspace_id`

---
### Table: `website_analytics`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | NO | `NULL` | PRI | auto_increment |
| `website_id` | `bigint(20) unsigned` | NO | `NULL` | MUL |  |
| `event_type` | `enum('view','conversion','click','form_submit','custom')` | NO | `NULL` | MUL |  |
| `event_data` | `longtext` | YES | `NULL` |  |  |
| `visitor_ip` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `referrer` | `varchar(500)` | YES | `NULL` |  |  |
| `country` | `varchar(100)` | YES | `NULL` |  |  |
| `city` | `varchar(100)` | YES | `NULL` |  |  |
| `device_type` | `varchar(50)` | YES | `NULL` |  |  |
| `browser` | `varchar(100)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Foreign Keys:**
- `website_id` -> `websites.id` (Constraint: `website_analytics_ibfk_1`)

**Indexes:**
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_event_type`: `event_type`
- `INDEX` `idx_website_id`: `website_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `website_domains`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | NO | `NULL` | PRI | auto_increment |
| `website_id` | `bigint(20) unsigned` | NO | `NULL` | MUL |  |
| `workspace_id` | `bigint(20) unsigned` | NO | `NULL` | MUL |  |
| `domain` | `varchar(255)` | NO | `NULL` | UNI |  |
| `is_verified` | `tinyint(1)` | YES | `0` |  |  |
| `verification_token` | `varchar(255)` | YES | `NULL` |  |  |
| `ssl_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `ssl_certificate` | `text` | YES | `NULL` |  |  |
| `dns_records` | `longtext` | YES | `NULL` |  |  |
| `verified_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `website_id` -> `websites.id` (Constraint: `website_domains_ibfk_1`)

**Indexes:**
- `INDEX` `idx_domain`: `domain`
- `INDEX` `idx_website_id`: `website_id`
- `INDEX` `idx_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_domain`: `domain`

---
### Table: `website_form_submissions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | NO | `NULL` | PRI | auto_increment |
| `website_id` | `bigint(20) unsigned` | NO | `NULL` | MUL |  |
| `form_id` | `varchar(100)` | NO | `NULL` | MUL |  |
| `form_data` | `longtext` | NO | `NULL` |  |  |
| `visitor_ip` | `varchar(45)` | YES | `NULL` |  |  |
| `user_agent` | `text` | YES | `NULL` |  |  |
| `referrer` | `varchar(500)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Foreign Keys:**
- `website_id` -> `websites.id` (Constraint: `website_form_submissions_ibfk_1`)

**Indexes:**
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_form_id`: `form_id`
- `INDEX` `idx_website_id`: `website_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `website_media`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | NO | `NULL` | PRI | auto_increment |
| `website_id` | `bigint(20) unsigned` | NO | `NULL` | MUL |  |
| `workspace_id` | `bigint(20) unsigned` | NO | `NULL` | MUL |  |
| `filename` | `varchar(255)` | NO | `NULL` |  |  |
| `original_filename` | `varchar(255)` | NO | `NULL` |  |  |
| `file_path` | `varchar(500)` | NO | `NULL` |  |  |
| `file_url` | `varchar(500)` | NO | `NULL` |  |  |
| `file_type` | `varchar(100)` | YES | `NULL` | MUL |  |
| `file_size` | `bigint(20) unsigned` | YES | `NULL` |  |  |
| `mime_type` | `varchar(100)` | YES | `NULL` |  |  |
| `width` | `int(10) unsigned` | YES | `NULL` |  |  |
| `height` | `int(10) unsigned` | YES | `NULL` |  |  |
| `alt_text` | `varchar(255)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `website_id` -> `websites.id` (Constraint: `website_media_ibfk_1`)

**Indexes:**
- `INDEX` `idx_file_type`: `file_type`
- `INDEX` `idx_website_id`: `website_id`
- `INDEX` `idx_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `website_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | NO | `NULL` | PRI | auto_increment |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `type` | `enum('landing-page','business','ecommerce','portfolio','blog','saas','restaurant','real-estate','education','healthcare')` | YES | `'landing-page'` | MUL |  |
| `category` | `varchar(100)` | YES | `NULL` | MUL |  |
| `thumbnail` | `varchar(500)` | YES | `NULL` |  |  |
| `preview_url` | `varchar(500)` | YES | `NULL` |  |  |
| `content` | `longtext` | NO | `NULL` |  |  |
| `is_premium` | `tinyint(1)` | YES | `0` |  |  |
| `is_active` | `tinyint(1)` | YES | `1` | MUL |  |
| `usage_count` | `int(10) unsigned` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_category`: `category`
- `INDEX` `idx_is_active`: `is_active`
- `INDEX` `idx_type`: `type`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `website_versions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | NO | `NULL` | PRI | auto_increment |
| `website_id` | `bigint(20) unsigned` | NO | `NULL` | MUL |  |
| `user_id` | `bigint(20) unsigned` | NO | `NULL` |  |  |
| `version_number` | `int(10) unsigned` | NO | `NULL` |  |  |
| `content` | `longtext` | NO | `NULL` |  |  |
| `change_description` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |

**Foreign Keys:**
- `website_id` -> `websites.id` (Constraint: `website_versions_ibfk_1`)

**Indexes:**
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_website_id`: `website_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `websites`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `bigint(20) unsigned` | NO | `NULL` | MUL |  |
| `user_id` | `bigint(20) unsigned` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `slug` | `varchar(255)` | YES | `NULL` | MUL |  |
| `type` | `enum('landing-page','business','ecommerce','portfolio','blog','saas','restaurant','real-estate','education','healthcare')` | YES | `'landing-page'` | MUL |  |
| `status` | `enum('draft','published','archived')` | YES | `'draft'` | MUL |  |
| `seo_title` | `varchar(255)` | YES | `NULL` |  |  |
| `seo_description` | `text` | YES | `NULL` |  |  |
| `seo_keywords` | `text` | YES | `NULL` |  |  |
| `og_image` | `varchar(500)` | YES | `NULL` |  |  |
| `content` | `longtext` | YES | `NULL` |  |  |
| `custom_domain` | `varchar(255)` | YES | `NULL` |  |  |
| `published_url` | `varchar(500)` | YES | `NULL` |  |  |
| `published_at` | `timestamp` | YES | `NULL` |  |  |
| `views` | `bigint(20) unsigned` | YES | `0` |  |  |
| `conversions` | `bigint(20) unsigned` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `deleted_at` | `timestamp` | YES | `NULL` |  |  |
| `sections` | `longtext` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_created_at`: `created_at`
- `INDEX` `idx_slug`: `slug`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_type`: `type`
- `INDEX` `idx_user_id`: `user_id`
- `INDEX` `idx_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `unique_workspace_slug`: `workspace_id`, `slug`

---
### Table: `whatsapp_accounts`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |
| `provider` | `enum('twilio','360dialog','whatsapp_business')` | YES | `'twilio'` |  |  |
| `phone_number` | `varchar(50)` | NO | `NULL` | MUL |  |
| `account_sid` | `varchar(255)` | YES | `NULL` |  |  |
| `auth_token` | `varchar(255)` | YES | `NULL` |  |  |
| `api_key` | `varchar(255)` | YES | `NULL` |  |  |
| `webhook_url` | `varchar(500)` | YES | `NULL` |  |  |
| `status` | `enum('active','inactive','suspended')` | YES | `'active'` |  |  |
| `is_verified` | `tinyint(1)` | YES | `0` |  |  |
| `business_profile` | `longtext` | YES | `NULL` |  |  |
| `message_templates` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_phone`: `phone_number`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `whatsapp_messages`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `account_id` | `int(11)` | NO | `NULL` | MUL |  |
| `conversation_id` | `int(11)` | YES | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `direction` | `enum('inbound','outbound')` | NO | `NULL` |  |  |
| `from_number` | `varchar(50)` | NO | `NULL` |  |  |
| `to_number` | `varchar(50)` | NO | `NULL` |  |  |
| `message_type` | `enum('text','image','video','audio','document','location','template')` | YES | `'text'` |  |  |
| `content` | `text` | YES | `NULL` |  |  |
| `media_url` | `varchar(500)` | YES | `NULL` |  |  |
| `media_type` | `varchar(50)` | YES | `NULL` |  |  |
| `external_id` | `varchar(255)` | YES | `NULL` | MUL |  |
| `status` | `enum('queued','sent','delivered','read','failed')` | YES | `'queued'` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `delivered_at` | `timestamp` | YES | `NULL` |  |  |
| `read_at` | `timestamp` | YES | `NULL` |  |  |

**Foreign Keys:**
- `account_id` -> `whatsapp_accounts.id` (Constraint: `whatsapp_messages_ibfk_1`)

**Indexes:**
- `INDEX` `idx_account`: `account_id`
- `INDEX` `idx_contact`: `contact_id`
- `INDEX` `idx_conversation`: `conversation_id`
- `INDEX` `idx_external_id`: `external_id`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `whatsapp_templates`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `channel_account_id` | `int(11)` | NO | `NULL` | MUL |  |
| `template_id` | `varchar(255)` | NO | `NULL` |  |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `language` | `varchar(10)` | NO | `'en'` |  |  |
| `category` | `varchar(50)` | YES | `NULL` |  |  |
| `status` | `varchar(50)` | YES | `'PENDING'` | MUL |  |
| `components` | `longtext` | YES | `NULL` |  |  |
| `variable_mappings` | `longtext` | YES | `NULL` |  |  |
| `preview_text` | `text` | YES | `NULL` |  |  |
| `last_synced_at` | `datetime` | YES | `NULL` |  |  |
| `created_at` | `datetime` | YES | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | YES | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `channel_account_id` -> `channel_accounts.id` (Constraint: `whatsapp_templates_ibfk_1`)

**Indexes:**
- `INDEX` `idx_wa_templates_account`: `channel_account_id`
- `INDEX` `idx_wa_templates_status`: `status`
- `UNIQUE` `idx_wa_templates_unique`: `channel_account_id`, `template_id`, `language`
- `INDEX` `idx_wa_templates_user`: `user_id`
- `INDEX` `idx_wa_templates_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `work_requests`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `company_id` | `int(11)` | NO | `NULL` | MUL |  |
| `property_id` | `int(11)` | YES | `NULL` | MUL |  |
| `contact_id` | `int(11)` | YES | `NULL` | MUL |  |
| `title` | `varchar(255)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `status` | `enum('pending','reviewing','approved','declined','converted')` | YES | `'pending'` | MUL |  |
| `priority` | `enum('low','medium','high','urgent')` | YES | `'medium'` |  |  |
| `requested_date` | `date` | YES | `NULL` |  |  |
| `requested_time` | `time` | YES | `NULL` |  |  |
| `source` | `varchar(100)` | YES | `NULL` |  |  |
| `assigned_to` | `int(11)` | YES | `NULL` |  |  |
| `converted_to_quote_id` | `int(11)` | YES | `NULL` |  |  |
| `converted_to_job_id` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `company_id` -> `companies.id` (Constraint: `work_requests_ibfk_1`)
- `property_id` -> `client_properties.id` (Constraint: `work_requests_ibfk_2`)
- `contact_id` -> `recipients.id` (Constraint: `work_requests_ibfk_3`)

**Indexes:**
- `INDEX` `company_id`: `company_id`
- `INDEX` `contact_id`: `contact_id`
- `INDEX` `idx_property`: `property_id`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace_company`: `workspace_id`, `company_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `work_schedules`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `schedule_date` | `date` | NO | `NULL` |  |  |
| `start_time` | `time` | NO | `NULL` |  |  |
| `end_time` | `time` | NO | `NULL` |  |  |
| `break_minutes` | `int(11)` | YES | `0` |  |  |
| `location_id` | `int(11)` | YES | `NULL` |  |  |
| `location_name` | `varchar(255)` | YES | `NULL` |  |  |
| `status` | `enum('scheduled','confirmed','completed','no_show','cancelled')` | YES | `'scheduled'` |  |  |
| `notes` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_schedules_user`: `user_id`, `schedule_date`
- `INDEX` `idx_schedules_workspace`: `workspace_id`, `schedule_date`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_user_date`: `user_id`, `schedule_date`

---
### Table: `workflow_connections`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workflow_id` | `int(11)` | NO | `NULL` | MUL |  |
| `source_node_id` | `int(11)` | NO | `NULL` | MUL |  |
| `target_node_id` | `int(11)` | NO | `NULL` | MUL |  |
| `condition_type` | `varchar(50)` | YES | `NULL` |  |  |
| `condition_config` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `workflow_id` -> `workflows.id` (Constraint: `workflow_connections_ibfk_1`)

**Indexes:**
- `INDEX` `idx_source`: `source_node_id`
- `INDEX` `idx_target`: `target_node_id`
- `INDEX` `idx_workflow`: `workflow_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `workflow_enrollments`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workflow_id` | `int(11)` | NO | `NULL` | MUL |  |
| `contact_id` | `int(11)` | NO | `NULL` | MUL |  |
| `current_step_id` | `int(11)` | YES | `NULL` |  |  |
| `status` | `enum('active','completed','failed','paused','exited')` | YES | `'active'` |  |  |
| `enrolled_at` | `datetime` | NO | `NULL` |  |  |
| `completed_at` | `datetime` | YES | `NULL` |  |  |
| `exited_at` | `datetime` | YES | `NULL` |  |  |
| `exit_reason` | `varchar(255)` | YES | `NULL` |  |  |
| `waiting_until` | `datetime` | YES | `NULL` | MUL |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workflow_id` -> `workflows.id` (Constraint: `workflow_enrollments_ibfk_1`)

**Indexes:**
- `INDEX` `idx_workflow_enrollments`: `workflow_id`, `status`
- `INDEX` `idx_workflow_enrollments_contact`: `contact_id`
- `INDEX` `idx_workflow_enrollments_waiting`: `waiting_until`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `workflow_execution_logs`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `enrollment_id` | `int(11)` | NO | `NULL` | MUL |  |
| `step_id` | `int(11)` | NO | `NULL` | MUL |  |
| `status` | `enum('pending','running','completed','failed','skipped')` | YES | `'pending'` |  |  |
| `started_at` | `datetime` | YES | `NULL` |  |  |
| `completed_at` | `datetime` | YES | `NULL` |  |  |
| `result` | `longtext` | YES | `NULL` |  |  |
| `error_message` | `text` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `enrollment_id` -> `workflow_enrollments.id` (Constraint: `workflow_execution_logs_ibfk_1`)

**Indexes:**
- `INDEX` `idx_workflow_logs_enrollment`: `enrollment_id`
- `INDEX` `idx_workflow_logs_step`: `step_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `workflow_nodes`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workflow_id` | `int(11)` | NO | `NULL` | MUL |  |
| `node_type` | `varchar(50)` | NO | `NULL` |  |  |
| `node_config` | `longtext` | NO | `NULL` |  |  |
| `position_x` | `int(11)` | NO | `NULL` |  |  |
| `position_y` | `int(11)` | NO | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workflow_id` -> `workflows.id` (Constraint: `workflow_nodes_ibfk_1`)

**Indexes:**
- `INDEX` `idx_workflow`: `workflow_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `workflow_steps`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workflow_id` | `int(11)` | NO | `NULL` | MUL |  |
| `step_type` | `enum('action','condition','wait','split','goal')` | NO | `NULL` |  |  |
| `action_type` | `varchar(50)` | YES | `NULL` |  |  |
| `config` | `longtext` | YES | `NULL` |  |  |
| `position_x` | `int(11)` | YES | `0` |  |  |
| `position_y` | `int(11)` | YES | `0` |  |  |
| `next_step_id` | `int(11)` | YES | `NULL` |  |  |
| `true_step_id` | `int(11)` | YES | `NULL` |  |  |
| `false_step_id` | `int(11)` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `workflow_id` -> `workflows.id` (Constraint: `workflow_steps_ibfk_1`)

**Indexes:**
- `INDEX` `idx_workflow_steps`: `workflow_id`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `workflows`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(100)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `trigger_type` | `varchar(50)` | NO | `NULL` |  |  |
| `trigger_config` | `longtext` | YES | `NULL` |  |  |
| `is_active` | `tinyint(1)` | YES | `0` |  |  |
| `run_once_per_contact` | `tinyint(1)` | YES | `0` |  |  |
| `total_enrolled` | `int(11)` | YES | `0` |  |  |
| `total_completed` | `int(11)` | YES | `0` |  |  |
| `total_failed` | `int(11)` | YES | `0` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `canvas_data` | `longtext` | YES | `NULL` |  |  |
| `node_positions` | `longtext` | YES | `NULL` |  |  |
| `zoom_level` | `decimal(3,2)` | YES | `1.00` |  |  |
| `is_template` | `tinyint(1)` | YES | `0` |  |  |
| `category` | `varchar(100)` | YES | `NULL` |  |  |
| `tags` | `longtext` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `idx_workflows_workspace`: `workspace_id`, `is_active`
- `UNIQUE` `PRIMARY`: `id`

---
### Table: `workspace_members`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `role` | `enum('owner','admin','member')` | NO | `'member'` |  |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |

**Foreign Keys:**
- `workspace_id` -> `workspaces.id` (Constraint: `workspace_members_ibfk_1`)
- `user_id` -> `users.id` (Constraint: `workspace_members_ibfk_2`)

**Indexes:**
- `INDEX` `idx_workspace_members_user`: `user_id`
- `INDEX` `idx_workspace_members_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_workspace_member`: `workspace_id`, `user_id`

---
### Table: `workspace_modules`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | MUL |  |
| `module_key` | `varchar(50)` | NO | `NULL` | MUL |  |
| `status` | `enum('installed','disabled')` | YES | `'installed'` | MUL |  |
| `installed_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `installed_by` | `int(11)` | YES | `NULL` |  |  |
| `disabled_at` | `timestamp` | YES | `NULL` |  |  |
| `disabled_by` | `int(11)` | YES | `NULL` |  |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Indexes:**
- `INDEX` `idx_module_key`: `module_key`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uk_workspace_module`: `workspace_id`, `module_key`

---
### Table: `workspace_subscriptions`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `workspace_id` | `int(11)` | NO | `NULL` | UNI |  |
| `billing_plan_id` | `int(11)` | NO | `NULL` | MUL |  |
| `status` | `enum('active','past_due','canceled','trialing')` | YES | `'active'` | MUL |  |
| `stripe_subscription_id` | `varchar(255)` | YES | `NULL` |  |  |
| `stripe_customer_id` | `varchar(255)` | YES | `NULL` |  |  |
| `current_period_start` | `date` | NO | `NULL` |  |  |
| `current_period_end` | `date` | NO | `NULL` |  |  |
| `trial_ends_at` | `date` | YES | `NULL` |  |  |
| `canceled_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` |  |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |

**Foreign Keys:**
- `billing_plan_id` -> `billing_plans.id` (Constraint: `workspace_subscriptions_ibfk_1`)

**Indexes:**
- `INDEX` `idx_plan`: `billing_plan_id`
- `INDEX` `idx_status`: `status`
- `INDEX` `idx_workspace`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `workspace_id`: `workspace_id`

---
### Table: `workspaces`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `owner_id` | `int(11)` | YES | `NULL` |  |  |
| `slug` | `varchar(100)` | NO | `NULL` | UNI |  |
| `account_type` | `enum('agency','individual')` | NO | `'individual'` | MUL |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `logo_url` | `varchar(500)` | YES | `NULL` |  |  |
| `primary_color` | `varchar(7)` | YES | `NULL` |  |  |
| `owner_user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `created_at` | `datetime` | NO | `current_timestamp()` |  |  |
| `updated_at` | `datetime` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `agency_id` | `int(11)` | YES | `NULL` | MUL |  |
| `subaccount_id` | `int(11)` | YES | `NULL` | MUL |  |
| `vendor_widget_enabled` | `tinyint(1)` | YES | `0` |  |  |
| `vendor_widget_provider` | `varchar(50)` | YES | `NULL` |  |  |
| `vendor_widget_app_id` | `varchar(255)` | YES | `NULL` |  |  |
| `vendor_widget_settings` | `longtext` | YES | `NULL` |  |  |

**Foreign Keys:**
- `owner_user_id` -> `users.id` (Constraint: `workspaces_ibfk_1`)

**Indexes:**
- `INDEX` `idx_workspaces_account_type`: `account_type`
- `INDEX` `idx_workspaces_agency`: `agency_id`
- `INDEX` `idx_workspaces_owner`: `owner_user_id`
- `INDEX` `idx_workspaces_subaccount`: `subaccount_id`
- `UNIQUE` `PRIMARY`: `id`
- `UNIQUE` `uniq_workspaces_slug`: `slug`

---
### Table: `z_legacy_forms`
**Columns:**
| Column | Type | Nullable | Default | Key | Extra |
|---|---|---|---|---|---|
| `id` | `int(11)` | NO | `NULL` | PRI | auto_increment |
| `user_id` | `int(11)` | NO | `NULL` | MUL |  |
| `name` | `varchar(255)` | NO | `NULL` |  |  |
| `title` | `varchar(500)` | NO | `NULL` |  |  |
| `description` | `text` | YES | `NULL` |  |  |
| `fields` | `longtext` | NO | `NULL` |  |  |
| `status` | `varchar(50)` | NO | `'active'` | MUL |  |
| `group_id` | `int(11)` | YES | `NULL` | MUL |  |
| `is_multi_step` | `tinyint(1)` | YES | `0` |  |  |
| `steps` | `longtext` | YES | `NULL` |  |  |
| `settings` | `longtext` | YES | `NULL` |  |  |
| `campaign_id` | `int(11)` | YES | `NULL` | MUL |  |
| `response_count` | `int(11)` | YES | `0` |  |  |
| `last_response_at` | `timestamp` | YES | `NULL` |  |  |
| `created_at` | `timestamp` | NO | `current_timestamp()` | MUL |  |
| `updated_at` | `timestamp` | NO | `current_timestamp()` |  | on update current_timestamp() |
| `folder_id` | `int(11)` | YES | `NULL` | MUL |  |
| `workspace_id` | `int(11)` | YES | `NULL` | MUL |  |
| `company_id` | `int(11)` | YES | `NULL` |  |  |

**Indexes:**
- `INDEX` `folder_id`: `folder_id`
- `INDEX` `idx_forms_campaign_id`: `campaign_id`
- `INDEX` `idx_forms_company`: `workspace_id`, `company_id`
- `INDEX` `idx_forms_created`: `created_at`
- `INDEX` `idx_forms_group_id`: `group_id`
- `INDEX` `idx_forms_status`: `status`
- `INDEX` `idx_forms_workspace_id`: `workspace_id`
- `UNIQUE` `PRIMARY`: `id`
- `INDEX` `user_id`: `user_id`

---
