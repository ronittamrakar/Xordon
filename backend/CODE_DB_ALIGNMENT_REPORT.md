# Code vs Database Alignment Report
Generated on: 2026-01-04 09:09:43

## Summary
- **Tables Referenced in Code:** 893
- **Actual Tables in DB:** 747
- **MISSING TABLES (Code needs them, DB verified missing):** 401
- **Potentially Unused Tables (In DB, no explicit code ref):** 255

## 🚨 CRITICAL: Missing Tables
The following tables are referenced in the backend code but do NOT exist in the database. Features using these will FAIL.

| Missing Table | Referenced In (Example Files) |
|---|---|
| `AI` | AISettingsController.php, AISettingsService.php, AiService.php |
| `AND` | CombinedAnalyticsController.php, SMSAnalyticsController.php |
| `API` | InstagramController.php |
| `App` | SystemHealthController.php |
| `Applications` | RecruitmentController.php |
| `Auth` | ModuleController.php, WorkspaceScoped.php |
| `CLI` | TimeTrackingController.php |
| `CRM` | CRMController.php |
| `Campaign` | WorkflowsController.php |
| `Campaigns` | ClientDashboardController.php |
| `Contact` | AutomationController.php, AutomationsV2Controller.php, FollowUpAutomationsController.php, ... |
| `DB` | AiAgentsController.php, GMBController.php, PhoneNumbersController.php, ... |
| `FROM` | SystemHealthController.php |
| `Facebook` | ReviewIntegrationService.php |
| `Form` | FollowUpAutomationsController.php |
| `GROUP` | CombinedAnalyticsController.php, SMSAnalyticsController.php |
| `Google` | AdsController.php, GMBController.php, ListingsController.php, ... |
| `Hunter` | HunterService.php |
| `IMAP` | EmailSyncService.php |
| `IS` | WalletController.php |
| `Instagram` | InstagramController.php |
| `JSON` | PermissionsController.php, RBACService.php |
| `LEFT` | CombinedAnalyticsController.php, SMSAnalyticsController.php |
| `LinkedIn` | LinkedInController.php |
| `MIME` | SecureUpload.php |
| `Mask` | GMBController.php |
| `Meeting` | AppointmentsController.php, AppointmentAutomationService.php |
| `Messenger` | MessengerController.php |
| `Meta` | MetaWebhookController.php, WhatsAppController.php |
| `OpenAI` | OpenAIService.php |
| `QR` | QRCodeController.php |
| `SKIP` | JobQueueService.php |
| `SMS` | SMSSettingsController.php, CampaignLogAggregator.php, SMSSequenceProcessor.php |
| `SMTP` | EmailSyncService.php |
| `SQL` | PhoneNumbersController.php, LeadOutcomeService.php |
| `Sequence` | AutomationsV2Controller.php, FollowUpAutomationsController.php |
| `SignalWire` | ConnectionsController.php, PhoneNumbersController.php, SMSSettingsController.php, ... |
| `Slack` | NotificationService.php |
| `TenantContext` | ConversationsController.php, OpportunitiesController.php |
| `Twilio` | PhoneProvisioningService.php |
| `URL` | PhoneNumbersController.php |
| `Video` | AppointmentAutomationService.php |
| `WhatsApp` | WhatsAppController.php |
| `Xordon` | IntegrationsController.php, WebFormsController.php |
| `a` | Router.php, AutomationController.php, CRMController.php, ... |
| `access` | CompaniesController.php, CalendarSyncService.php, ModuleManager.php, ... |
| `access_token` | CalendarSyncService.php, VideoProviderService.php |
| `account` | SendingAccountsController.php |
| `action` | AutomationQueueProcessor.php |
| `actions` | AutomationsV2Controller.php |
| `addon_name` | StripeService.php |
| `admin` | RBACService.php |
| `advanced` | AppointmentsController.php, SentimentConfigController.php |
| `affiliate` | AffiliatesController.php |
| `against` | PaymentsController.php |
| `agency` | TeamController.php, MultiTenantRBACService.php |
| `agent` | AiAgentsController.php, CallAgentsController.php |
| `ai_content_generations` | AIFeaturesController.php |
| `ai_recommendations` | AIFeaturesController.php |
| `ai_sentiment_analysis` | AIFeaturesController.php |
| `all` | ContactsController.php, PhoneNumbersController.php, RecipientsController.php, ... |
| `amount_due` | InvoicesController.php |
| `an` | AIKnowledgeBaseController.php, FollowUpAutomationsController.php, IntegrationsController.php, ... |
| `analytics_events` | AdvancedAnalyticsController.php |
| `appointment` | AppointmentsController.php, AppointmentsV2Controller.php, MarketplaceBookingController.php, ... |
| `article` | KnowledgeBaseController.php |
| `asset` | EmployeeController.php |
| `attempt` | CourseQuizController.php |
| `audit` | SeoController.php |
| `auth` | PipelineController.php |
| `auto_sync_interval_minutes` | CalendarSyncController.php |
| `automation` | AutomationController.php, AutomationEngineService.php |
| `availability` | AppointmentsV2Controller.php, CalendarsController.php, StaffMembersController.php |
| `battle` | SalesEnablementController.php |
| `battle_cards` | SalesEnablementController.php |
| `billing` | PerformanceBillingController.php |
| `body` | AppointmentsController.php, WhatsAppController.php |
| `booking` | AppointmentsController.php, AppointmentsV2Controller.php, BookingController.php, ... |
| `budget` | AdsController.php |
| `business_name` | GMBController.php, ListingsController.php |
| `cache` | SecureAuth.php, OptimizedAnalyticsController.php |
| `cached` | ListsController.php |
| `calendar` | CalendarsController.php |
| `call` | CallController.php, CallFlowsController.php, CallSettingsController.php, ... |
| `calls_goal` | TasksController.php |
| `camelCase` | CRMController.php |
| `campaign` | AdsController.php, CallController.php, CampaignsController.php, ... |
| `campaign_analytics` | LeadScoringService.php |
| `canned` | CannedResponsesController.php |
| `category` | KnowledgeBaseController.php |
| `certificate` | CertificateService.php |
| `checklist` | JobsController.php |
| `checkout_forms` | CheckoutController.php |
| `claim` | ListingsController.php |
| `click` | ReviewRequestsController.php |
| `client` | AgencyController.php |
| `client_id_encrypted` | PayPalController.php |
| `cohort_analysis` | AdvancedAnalyticsController.php |
| `color` | ContactStagesController.php |
| `comment` | GMBController.php |
| `company` | CompaniesController.php |
| `compensation` | PayrollController.php |
| `completed_bookings` | AppointmentAutomationService.php |
| `connection` | CalendarSyncController.php, ConnectionsController.php, GMBController.php |
| `consumer` | MarketplaceMessagingController.php |
| `contact` | AutomationController.php, CompaniesController.php, ContactOutcomesController.php, ... |
| `contact_sentiment` | LeadScoringService.php |
| `container` | ServiceContainer.php |
| `content` | MembershipsController.php, SalesEnablementController.php |
| `context` | AutomationEngineService.php |
| `conversation` | ConversationsController.php, InstagramController.php, MessengerController.php, ... |
| `count` | AutomationQueueProcessor.php |
| `course` | CourseController.php, CourseService.php, EnrollmentService.php |
| `current_lat` | FieldServiceController.php |
| `current_status` | FieldServiceController.php |
| `custom` | CustomFieldsController.php, CustomVariablesController.php |
| `custom_dashboards` | AdvancedAnalyticsController.php |
| `daily` | CRMController.php, TasksController.php |
| `database` | SystemHealthController.php, TaskAttachmentsController.php, WebsiteMediaController.php, ... |
| `deal` | PipelineController.php, PipelineForecastingService.php |
| `default` | MarketplaceBookingController.php |
| `default_commission_rate` | AffiliatesController.php |
| `defaults` | SentimentConfigController.php |
| `disk` | TaskAttachmentsController.php |
| `disposition` | CallController.php, IntentDetector.php |
| `dispositions` | IntentDetector.php |
| `dispute` | PerformanceBillingService.php |
| `domain` | AgencyDomainsController.php |
| `each` | ContactsController.php |
| `email` | ContactsController.php, EmailRepliesController.php, TrackController.php, ... |
| `email_opens` | LeadScoringService.php |
| `emails_sent` | AgencySaaSController.php |
| `employee` | EmployeeController.php |
| `employee_profiles` | EmployeeController.php |
| `enrollment` | CertificateService.php, EnrollmentService.php |
| `entity` | CustomFieldsController.php |
| `env` | MetaWebhookController.php |
| `environment` | Config.php, CallService.php, SMSService.php |
| `error` | SavedFiltersController.php, SequenceController.php |
| `estimate` | EstimatesController.php |
| `execution` | AutomationEngineService.php |
| `execution_count` | QueryOptimizer.php |
| `existing` | MobileAPIController.php, PageBuilderController.php, PhoneNumbersController.php, ... |
| `expired` | LeadNotificationService.php |
| `export` | ReportingController.php |
| `external` | BookingPagesController.php, MarketplaceReviewsController.php, SeoController.php |
| `facebook_pages` | OmniChannelController.php |
| `failed` | FilesController.php, IntegrationsFrameworkController.php, LeadMatchesController.php |
| `failed_jobs` | SystemHealthController.php |
| `field` | CustomFieldsController.php, WorkflowExecutionService.php |
| `fieldMappings` | CallController.php |
| `fields` | FollowUpEmailsController.php |
| `file` | FilesController.php |
| `file_activities` | FilesController.php |
| `filesystem` | WebsiteMediaController.php |
| `first_response_at` | TicketsController.php |
| `folder` | FoldersController.php |
| `form` | FormSettingsController.php, FormTemplatesController.php, FormsController.php |
| `friendly` | PhoneProvisioningService.php |
| `frontend` | SegmentsController.php |
| `funnel` | FunnelsController.php |
| `funnel_analytics` | AdvancedAnalyticsController.php |
| `globals` | WorkspaceScoped.php |
| `group` | GroupsController.php |
| `has_access` | ModuleManager.php |
| `headers` | Auth.php |
| `health_alerts` | SystemHealthController.php |
| `health_test` | SystemHealthController.php |
| `http_requests_log` | SystemHealthController.php |
| `identity` | PortalAuthController.php |
| `if` | UserController.php, WebFormsController.php |
| `import` | SnapshotsController.php |
| `in` | WorkflowsController.php |
| `in_app` | NotificationsController.php |
| `information_schema` | Auth.php, DatabaseOptimizer.php, QueryOptimizer.php, ... |
| `instance` | AutomationRecipesController.php |
| `instead` | CompaniesController.php |
| `integration` | IntegrationsFrameworkController.php |
| `interview` | RecruitmentController.php |
| `invited_at` | TeamController.php |
| `invoice` | DunningController.php, FulfillmentController.php, InvoicesController.php, ... |
| `is_active` | LeadMarketplaceController.php, ListingsController.php |
| `is_available` | AppointmentsController.php |
| `is_tracked` | ListingsController.php |
| `items` | EstimatesController.php, GroupsController.php, InvoicesController.php, ... |
| `job` | JobsController.php, RecruitmentController.php, JobQueueService.php |
| `keyword` | SentimentAnalyzer.php |
| `knowledge` | AIKnowledgeBaseController.php |
| `last` | MetaWebhookController.php, PortalAuthController.php, QuickBooksController.php |
| `last_checked_at` | ListingsController.php |
| `last_crawled_at` | ListingsController.php |
| `last_sync_at` | ReviewMonitoringController.php |
| `last_tested` | IntegrationsController.php |
| `lead` | BookingPagesController.php, CRMController.php, LeadAttributionController.php, ... |
| `leave` | TimeTrackingController.php |
| `lesson` | EnrollmentController.php, CourseService.php |
| `license_number` | ProviderDocumentsController.php |
| `line` | ProposalsController.php, SMSRecipientsController.php |
| `list` | ListsController.php |
| `listing` | ListingsController.php |
| `local` | StripeController.php, EmailSender.php, SimpleMail.php |
| `localhost` | AuthController.php |
| `locally` | PhoneProvisioningService.php |
| `location` | GMBController.php |
| `location_name` | OmniChannelController.php |
| `lock_key` | ConcurrencyManager.php |
| `log` | BulkActionsController.php, NotificationService.php |
| `logs` | SystemHealthController.php |
| `main` | SocialMediaController.php |
| `match` | IntentDetector.php |
| `media` | WebsiteMediaController.php |
| `meeting` | MeetingController.php, MeetingSchedulerService.php |
| `member` | MembershipsController.php, TeamController.php |
| `membership` | MembershipsController.php |
| `memory` | LoginRateLimiter.php |
| `merged` | MergeSplitController.php |
| `message` | ConversationsController.php, LinkedInController.php, SMSSequenceProcessor.php, ... |
| `message_queue` | OmniChannelController.php |
| `method` | ListingsController.php, CampaignLogAggregator.php |
| `metric_value` | TrackController.php |
| `middleware` | SystemHealthController.php |
| `min_duration_seconds` | PerformanceBillingController.php |
| `mobile_devices` | MobileAPIController.php |
| `mobile_sessions` | MobileAPIController.php |
| `module` | ModuleManager.php |
| `multiple` | PhoneNumbersController.php |
| `name` | UserController.php, ModuleManager.php |
| `nested` | CalendarSyncController.php |
| `next` | InvoicesController.php |
| `notification` | NotificationsController.php, UserController.php, NotificationService.php |
| `notify_email` | MarketplaceMessagingController.php |
| `now` | AppointmentsController.php |
| `number` | DNIController.php, PhoneNumbersController.php, NotificationSender.php |
| `onboarding` | EmployeeController.php |
| `only` | HelpdeskSettingsController.php |
| `opens` | SendTimeController.php |
| `opportunity` | OpportunitiesController.php |
| `opt` | MetaWebhookController.php |
| `options` | CourseQuizController.php |
| `or` | ContactOutcomesController.php, LoyaltyController.php, MessengerController.php, ... |
| `order` | PayPalController.php |
| `order_items` | CheckoutController.php |
| `orders` | CheckoutController.php |
| `other` | ActivitiesController.php, NotificationsController.php |
| `our` | CallSettingsController.php |
| `outcome` | ContactOutcomesController.php |
| `own` | AutomationRecipesController.php |
| `package` | SystemHealthController.php |
| `page_components` | PageBuilderController.php |
| `page_name` | OmniChannelController.php |
| `page_sections` | PageBuilderController.php |
| `params` | PhoneProvisioningService.php |
| `parent` | CourseDiscussionsController.php, MultiTenantRBACService.php |
| `pay` | PayrollController.php |
| `payload` | MetaWebhookController.php |
| `payment` | PayPalController.php, StripeController.php |
| `performance_schema` | QueryOptimizer.php |
| `phone` | DNIController.php, SMSCampaignsController.php, PhoneProvisioningService.php |
| `pipeline` | OpportunitiesController.php |
| `platform` | AdsController.php, ReviewsV2Controller.php |
| `platform_name` | ReviewRequestsController.php |
| `playbook` | PlaybookController.php, SalesEnablementController.php |
| `playbook_resources` | SalesEnablementController.php |
| `playbook_sections` | SalesEnablementController.php |
| `portal_documents` | ClientPortalController.php |
| `portal_messages` | ClientPortalController.php |
| `positional` | SMSCampaignsController.php |
| `post` | SocialController.php |
| `preferences` | NotificationsController.php |
| `previous` | SentimentAnalyzer.php |
| `pricing` | BillingController.php, PerformanceBillingController.php |
| `primary` | ContactsController.php |
| `product` | InvoicesController.php |
| `progress` | EnrollmentController.php, MembershipsController.php |
| `project` | ProjectsController.php |
| `promo` | WalletController.php |
| `property` | ClientPropertiesController.php |
| `provider` | IntegrationsFrameworkController.php, MarketplaceBookingController.php, MarketplaceReviewsController.php, ... |
| `provider_account_id` | IntegrationsFrameworkController.php |
| `providers` | IntentDataController.php, IntentDataService.php |
| `push_notifications` | MobileAPIController.php |
| `qualification` | PerformanceBillingService.php |
| `query` | AnalyticsController.php, BookingController.php, CallController.php, ... |
| `question_text` | GMBController.php |
| `queue` | AutomationQueueProcessor.php |
| `rate` | MessengerController.php, WhatsAppController.php |
| `rating` | ReviewIntegrationService.php |
| `realm_id` | QuickBooksController.php |
| `recent` | ContactSentimentService.php |
| `recipe` | AutomationRecipesController.php, AutomationsV2Controller.php |
| `recipient` | CRMController.php, CallController.php, SMSRecipientsController.php, ... |
| `recording` | InboundCallController.php |
| `recovery` | EcommerceController.php |
| `regular_hours` | PayrollController.php |
| `reminders` | AppointmentAutomationService.php |
| `request` | SMSCampaignsController.php, SMSSequencesController.php, TimeTrackingController.php |
| `reseller` | BillingController.php |
| `response` | FormsController.php |
| `responses` | FormsController.php |
| `review` | ReputationController.php, ReviewRequestsController.php, ReviewsV2Controller.php |
| `role` | CompaniesController.php, ProjectsController.php, MultiTenantRBACService.php |
| `rollout` | ModuleController.php |
| `route` | FilesController.php |
| `row` | CustomFieldsController.php |
| `sales_content` | SalesEnablementController.php |
| `sales_content_analytics` | SalesEnablementController.php |
| `sales_playbooks` | SalesEnablementController.php |
| `sales_snippets` | SalesEnablementController.php |
| `saved` | SavedFiltersController.php |
| `schedule` | AppointmentsController.php |
| `scheduled` | MeetingSchedulerService.php |
| `scheduled_reports` | ReportingController.php |
| `scoring` | ContactStagesController.php |
| `script` | CallScriptsController.php |
| `secondary` | ContactsController.php |
| `section` | SalesEnablementController.php |
| `segment` | ContactStagesController.php, SegmentsController.php |
| `self` | EmailSyncService.php |
| `send_mode` | SendTimeController.php |
| `sender` | SimpleMail.php |
| `sender_id` | SMSCampaignsController.php |
| `sender_number` | SMSCampaignsController.php |
| `sending` | EmailSender.php, SimpleMail.php |
| `sentiment` | SentimentConfigController.php, LeadScoringService.php |
| `separate` | WebFormsController.php |
| `sequence` | SMSSequencesController.php, SequenceController.php, SequencesController.php, ... |
| `sequence_contacts` | WorkflowExecutionService.php |
| `service` | CalendarsController.php, ServicesController.php, StaffMembersController.php |
| `session` | DNIController.php, WebchatController.php |
| `setting_value` | CRMController.php, ModuleSettingsController.php, SeoController.php |
| `shift` | ShiftSchedulingController.php |
| `signal` | IntentDataService.php, LeadScoringService.php |
| `simulated` | GMBController.php |
| `slow` | QueryOptimizer.php |
| `slow_query_log` | QueryOptimizer.php |
| `slug` | KnowledgeBaseController.php, CourseService.php |
| `sms_provider_settings` | SMSSettingsController.php |
| `sms_unsubscribes` | AllDataController.php |
| `snippet` | SalesEnablementController.php |
| `source_url` | GMBController.php |
| `speaker` | ConversationIntelligenceService.php |
| `speakers` | ConversationIntelligenceService.php |
| `staff` | CalendarsController.php, SchedulingAnalyticsController.php, ServicesController.php, ... |
| `stage` | ContactStagesController.php, OpportunitiesController.php, PipelineController.php, ... |
| `start_time` | ShiftSchedulingController.php, CalendarSyncService.php |
| `status` | Auth.php, AppsController.php, IntegrationsFrameworkController.php, ... |
| `step` | FunnelsController.php |
| `steps` | FunnelsController.php, SMSSequencesController.php, SequencesController.php, ... |
| `storage` | ProviderDocumentsController.php |
| `stripe_customer_id` | StripeService.php |
| `student` | EnrollmentService.php |
| `subaccount` | TeamController.php |
| `subscription` | BillingController.php, StripeService.php |
| `succeeded` | PhoneNumbersController.php |
| `summary` | GMBController.php |
| `swap` | ShiftSchedulingController.php |
| `sync` | EcommerceController.php, ListingsController.php |
| `tag` | CustomFieldsController.php, TagsController.php |
| `task` | CRMController.php, TaskAttachmentsController.php, TaskSubtasksController.php, ... |
| `tax` | PayrollController.php |
| `technician` | FieldServiceController.php |
| `template` | AIKnowledgeBaseController.php, AiAgentsController.php, LinkedInController.php, ... |
| `tenant` | AuthController.php |
| `test` | ABTestingController.php |
| `text` | ConversationIntelligenceService.php, IntentDetector.php, SentimentAnalyzer.php |
| `the` | Cors.php, ServiceContainer.php, AutomationController.php, ... |
| `their` | WebFormsController.php |
| `this` | LoginRateLimiter.php, SentimentConfigController.php, SeoController.php |
| `ticket` | TicketsController.php |
| `ticket_csat_survey_sends` | CSATController.php |
| `ticket_merge_history` | MergeSplitController.php |
| `ticket_split_history` | MergeSplitController.php |
| `timestamps` | FulfillmentController.php |
| `to` | RecipientsController.php |
| `token` | TenantContext.php, TeamController.php, MultiTenantRBACService.php |
| `tracking` | LeadAttributionController.php |
| `traffic` | SystemHealthController.php |
| `transcription` | ConversationIntelligenceService.php |
| `typical` | BrightLocalService.php |
| `unpaid` | AffiliatesController.php |
| `unsubscribes` | AllDataController.php |
| `usage` | AgencySaaSController.php |
| `usage_metrics` | AgencySaaSController.php |
| `user` | AuthController.php, CallController.php, LeadAttributionController.php, ... |
| `username` | InstagramController.php, OmniChannelController.php |
| `validate` | SecureUpload.php |
| `value` | ConcurrencyManager.php |
| `value_text` | CustomFieldsController.php |
| `variable` | CustomVariablesController.php |
| `variant` | ABTestingController.php |
| `verification` | ListingsController.php |
| `views` | WebFormsControllerExtensions.php |
| `wallet` | WalletController.php, PerformanceBillingService.php |
| `warmup` | DeliverabilityController.php |
| `web` | LeadAttributionController.php |
| `webhook` | CallController.php, MetaWebhookController.php |
| `weights` | LeadScoringController.php |
| `with` | CompaniesController.php |
| `workflow` | AutomationsV2Controller.php, WorkflowsController.php, WorkflowExecutionService.php |
| `workspace` | AffiliatesController.php, CompaniesController.php, WebFormsController.php |
| `your` | CallController.php, SystemHealthController.php, SystemToolsController.php |

## ⚠️ Potentially Unused Tables
No explicit string reference found in `backend/src` for these tables. Note: dynamic queries might still use them.
<details><summary>Click to view list</summary>

- _fb_user_map
- ad_campaigns_schedule
- ad_campaigns_targeting
- ad_creatives
- ad_integrations
- ad_tracking_numbers
- affiliate_links
- agency_reseller_pricing
- agency_subscription_plans
- ai_analytics_insights
- ai_call_answering
- ai_chatbot_conversations
- ai_chatbot_messages
- ai_content_history
- ai_conversation_bookings
- api_keys
- appointment_feedback
- appointment_notifications
- appointment_reminder_queue
- appointment_staff
- appointment_waitlist
- attribution_events
- automation_channel_config
- booking_type_staff
- call_analytics
- call_performance_summary
- call_recordings
- calls
- canned_responses
- citation_sources
- client_communications
- client_files
- client_portal_access
- client_user_access
- commission_summaries
- competitor_citations
- competitors
- consent_logs
- consumer_financing_applications
- contact_notes
- contact_recalls
- contact_relationships
- contact_segment_members
- crm_dashboard
- crm_deal_products
- crm_forecast_snapshots
- crm_goal_history
- crm_playbook_usage
- crm_scoring_rules
- crm_sequence_enrollments
- crm_sequences
- crm_territories
- deal_stages
- directory_catalog
- dispatch_route_stops
- dispatch_routes
- dnc_lists
- email_campaigns
- esign_audit_log
- esign_documents
- esign_envelopes
- esign_signers
- estimate_line_items
- facebook_messenger_accounts
- facebook_messenger_conversations
- facebook_messenger_messages
- fb_activity_logs
- fb_field_interactions
- fb_field_options
- fb_field_responses
- fb_folders
- fb_form_analytics
- fb_form_fields
- fb_form_starts
- fb_form_submissions
- fb_form_templates
- fb_form_views
- fb_forms
- fb_spam_rules
- fb_user_settings
- fb_users
- fb_webhook_deliveries
- fb_webhooks
- flow_contacts
- flow_logs
- flow_scheduled_actions
- flow_stats
- form_analytics
- fsm_appointments
- fsm_availability_schedules
- fsm_booking_page_settings
- fsm_booking_types
- fsm_contact_recalls
- fsm_estimate_line_items
- fsm_estimates
- fsm_industry_settings
- fsm_intake_submissions
- fsm_intake_templates
- fsm_playbooks
- fsm_recall_schedules
- fsm_referral_programs
- fsm_referrals
- fsm_service_categories
- fsm_services
- fsm_staff
- gbp_accounts
- gbp_posts
- geofence_events
- geofences
- gmb_answers
- gmb_attributes
- gmb_business_hours
- gmb_categories
- gmb_products
- gmb_services
- gmb_sync_logs
- gmb_verifications
- goal_progress
- google_sheets_connections
- gps_devices
- gps_logs
- group_booking_participants
- group_bookings
- hosted_videos
- incoming_webhooks
- industry_pipeline_templates
- industry_types
- instagram_conversations
- instagram_messages
- intake_form_templates
- integration_connections
- integration_field_mappings
- integration_providers
- integration_sync_logs
- integration_webhook_logs
- integration_webhooks
- intent_providers
- inventory_locations
- inventory_logs
- inventory_movements
- inventory_stock
- inventory_warehouses
- invoice_line_items
- invoice_payments
- invoice_templates
- ivr_menu_options
- job_line_items
- job_parts
- job_tasks
- knowledge_base_articles
- knowledge_base_categories
- landing_page_analytics
- landing_page_submissions
- landing_page_templates
- lead_dedupe_log
- lead_quality_feedback
- lesson_attachments
- linkedin_connections
- listings
- membership_access
- membership_areas
- migration_log
- migrations
- module_migrations
- mt_api_keys
- mt_permission_overrides
- onboarding_template_tasks
- onboarding_templates
- payment_daily_summaries
- payment_methods
- payroll_adjustments
- payroll_deductions
- payroll_history
- payroll_tax_rates
- playbook_templates
- portal_activity_log
- portal_branding
- project_custom_fields
- project_tasks
- property_contacts
- provider_badge_awards
- provider_badges
- provider_portfolio
- qr_code_scans
- quote_items
- rank_tracking
- rate_limits
- recall_schedules
- recurring_appointments
- recurring_invoices
- recurring_job_schedules
- recurring_tasks
- referral_programs
- referrals
- report_aggregations
- reputation_integrations
- review_request_campaigns
- saved_filters
- scheduled_jobs
- scheduled_report_runs
- secure_sessions
- sentiment_config_audit
- sentiment_feedback
- sentiment_metrics
- sentiment_predictions
- sentiment_training_batches
- seo_reports
- shift_leave_conflicts
- sms_accounts
- sms_analytics
- snapshot_marketplace
- social_best_times
- social_scheduled_posts
- speed_to_lead_settings
- student_notes
- sub_accounts
- task_activity
- task_custom_field_values
- task_sequences
- task_templates
- task_time_entries
- task_watchers
- tax_rates
- ticket_attachments
- ticket_categories
- ticket_csat_responses
- ticket_external_mappings
- ticket_reporting_metrics
- ticket_tags
- ticket_watchers
- tiktok_accounts
- tiktok_conversations
- tiktok_messages
- time_off_requests
- user_commission_plans
- user_industry_settings
- user_roles
- warmup_messages
- webforms
- webforms_activity_logs
- webforms_field_interactions
- webforms_field_options
- webforms_field_responses
- webforms_form_analytics
- webforms_form_templates
- webforms_spam_rules
- webforms_users
- webforms_webhook_deliveries
- webhooks
- website_domains
- website_form_submissions
- whatsapp_accounts
- whatsapp_messages
- work_schedules
- z_legacy_forms
</details>
