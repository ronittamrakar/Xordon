/**
 * Services Index
 * Export all API services for easy imports
 */

// Phase 0: Platform Foundations
export { filesApi } from './filesApi';
export type { FileItem, FileFolder, FilesListParams } from './filesApi';

export { notificationsApi } from './notificationsApi';
export type { Notification, NotificationPreference, NotificationType, NotificationsListParams } from './notificationsApi';

export { activitiesApi } from './activitiesApi';
export type { Activity, ActivityComment, ActivitiesListParams } from './activitiesApi';

export { customFieldsApi } from './customFieldsApi';
export type { CustomFieldDefinition, CustomFieldValue, Tag } from './customFieldsApi';

export { integrationsApi } from './integrationsApi';
export type { Integration, IntegrationProvider, SyncJob } from './integrationsApi';

// Core Features
export { conversationsApi } from './conversationsApi';
export { opportunitiesApi } from './opportunitiesApi';
export { automationsApi } from './automationsApi';
export { appointmentsApi } from './appointmentsApi';
export { invoicesApi } from './invoicesApi';
export { reviewsApi } from './reviewsApi';
export { snapshotsApi } from './snapshotsApi';
export { webformsApi } from './webformsApi';

// Phase 1: CRM Enhancements
export { leadAttributionApi } from './leadAttributionApi';
export type { LeadSource, LeadAttribution, AttributionAnalytics } from './leadAttributionApi';

export { staffApi } from './staffApi';
export type { StaffMember, StaffAvailability, StaffTimeOff, StaffService, AvailableSlots } from './staffApi';

export { moduleSettingsApi } from './moduleSettingsApi';
export type { ModuleSettings, AllModuleSettings } from './moduleSettingsApi';

export { contactStagesApi } from './contactStagesApi';
export type { ContactStage, LeadScoringRule, ContactSegment } from './contactStagesApi';

// Phase 2: Revenue & Operations
export { paymentsApi } from './paymentsApi';
export type { Payment, Refund, PaymentLink, Subscription, PaymentAnalytics } from './paymentsApi';

export { estimatesApi } from './estimatesApi';
export type { Estimate, EstimateItem } from './estimatesApi';

export { jobsApi } from './jobsApi';
export type { Job, JobType, JobItem, JobChecklist, JobPhoto, JobNote, JobAnalytics } from './jobsApi';

// Phase 3: Growth Suite
export { socialApi } from './socialApi';
export type { SocialAccount, SocialPost, SocialPostAnalytics, SocialCategory, SocialTemplate, HashtagGroup, SocialAnalytics } from './socialApi';

export { listingsApi } from './listingsApi';
export type { BusinessListing, Directory, SeoKeyword, SeoKeywordHistory, SeoPage, SeoCompetitor, ListingsAnalytics, ListingAudit, ListingDuplicate, ListingReview, ListingRankTracking, ListingRankHistory, ListingSettings } from './listingsApi';

export { gmbApi } from './gmbApi';
export type { GMBConnection, GMBLocation, GMBBusinessHours, GMBService, GMBProduct, GMBPhoto, GMBPost, GMBReview, GMBQuestion, GMBAnswer, GMBInsights, GMBAttribute, GMBSettings, GMBCategory, GMBVerification, GMBSyncLog, GMBDashboardStats } from './gmbApi';

export { adsApi } from './adsApi';
export type { AdAccount, AdCampaign, AdCampaignMetric, AdConversion, AdBudget, AdAnalytics } from './adsApi';

export { affiliatesApi } from './affiliatesApi';
export type { Affiliate, AffiliateReferral, AffiliatePayout, AffiliateAnalytics } from './affiliatesApi';

// Phase 4: HR Suite
export { timeTrackingApi } from './timeTrackingApi';
export type { TimeEntry, Timesheet, ClockRecord, LeaveRequest, LeaveBalance, TimeTrackingAnalytics } from './timeTrackingApi';

export { payrollApi } from './payrollApi';
export type { PayPeriod, PayrollRecord, EmployeeCompensation, PayrollAnalytics } from './payrollApi';

export { expensesApi } from './expensesApi';
export type { ExpenseCategory, Expense, ExpenseReport, CommissionPlan, Commission, ExpensesAnalytics } from './expensesApi';

export { employeesApi } from './employeesApi';
export type { EmployeeDocument, OnboardingTask, OnboardingChecklist } from './employeesApi';

export { recruitmentApi } from './recruitmentApi';
export type { JobOpening, Candidate, JobApplication, Interview } from './recruitmentApi';

export { shiftSchedulingApi } from './shiftSchedulingApi';
export type { Shift, ShiftType, ShiftSwapRequest, EmployeeAvailability } from './shiftSchedulingApi';

export { cultureApi } from './cultureApi';
export type { CoreValue, Recognition, CultureStats, CultureChampion, Survey, SurveyTrend, Event as CultureEvent } from './cultureApi';
