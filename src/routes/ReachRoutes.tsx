import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Email
const Campaigns = lazy(() => import('@/pages/Campaigns'));
const CampaignWizard = lazy(() => import('@/pages/CampaignWizard'));
const Sequences = lazy(() => import('@/pages/Sequences'));
const SequenceEditor = lazy(() => import('@/pages/SequenceEditor'));
const Templates = lazy(() => import('@/pages/reach/assets/EmailTemplates'));
const TemplateEditor = lazy(() => import('@/pages/reach/assets/EmailTemplateEditor'));
const EmailTemplateBuilder = lazy(() => import('@/pages/reach/assets/EmailTemplateBuilder'));
const EmailReplies = lazy(() => import('@/pages/EmailReplies'));
const EmailWarmup = lazy(() => import('@/pages/EmailWarmup'));
const Unsubscribers = lazy(() => import('@/pages/Unsubscribers'));

// SMS
const SMSCampaigns = lazy(() => import('@/pages/SMSCampaigns'));
const SMSCampaignWizard = lazy(() => import('@/pages/SMSCampaignWizard'));
const SMSSequences = lazy(() => import('@/pages/SMSSequences'));
const SMSSequenceEditor = lazy(() => import('@/pages/SMSSequenceEditor'));
const SMSTemplates = lazy(() => import('@/pages/reach/assets/SMSTemplates'));
const SMSTemplateEditor = lazy(() => import('@/pages/reach/assets/SMSTemplateEditor'));
const SMSReplies = lazy(() => import('@/pages/SMSReplies'));
const SMSUnsubscribers = lazy(() => import('@/pages/SMSUnsubscribers'));
const Contacts = lazy(() => import('@/pages/Contacts'));

// Calls
const CallCampaigns = lazy(() => import('@/pages/calls/CallCampaigns'));
const CallCampaignWizard = lazy(() => import('@/pages/calls/CallCampaignWizard'));
const CallCampaignDetails = lazy(() => import('@/pages/calls/CallCampaignDetails'));
const CallScripts = lazy(() => import('@/pages/calls/CallScripts'));
const CallAgents = lazy(() => import('@/pages/calls/CallAgents'));
const CallFlows = lazy(() => import('@/pages/calls/CallFlows'));
const CallFlowBuilder = lazy(() => import('@/pages/calls/CallFlowBuilder'));
const NumberPools = lazy(() => import('@/pages/calls/NumberPools'));
const CallLogs = lazy(() => import('@/pages/calls/CallLogs'));
// Dashboard & Analytics
const CallDashboard = lazy(() => import('@/pages/calls/CallDashboard'));
const CallAnalytics = lazy(() => import('@/pages/calls/CallAnalytics'));

// Analytics (New)
const EmailAnalytics = lazy(() => import('@/pages/reach/analytics/EmailAnalytics'));
const SMSAnalytics = lazy(() => import('@/pages/reach/analytics/SMSAnalytics'));


const PhoneOverview = lazy(() => import('@/pages/calls/PhoneOverview'));
const PhoneNumbersList = lazy(() => import('@/pages/calls/PhoneNumbersList'));
const PhoneProvisioning = lazy(() => import('@/pages/calls/PhoneProvisioning'));

const PhoneSms = lazy(() => import('@/pages/calls/PhoneSms'));

// Engagement
const ChannelSettings = lazy(() => import('@/pages/ChannelSettings'));

const ReachRoutes = () => {
    return (
        <Routes>
            {/* Outbound Email */}
            <Route path="/outbound/email/campaigns" element={<Campaigns />} />
            <Route path="/outbound/email/campaigns/new" element={<CampaignWizard />} />
            <Route path="/outbound/email/campaigns/:id" element={<CampaignWizard />} />
            <Route path="/outbound/email/sequences" element={<Sequences />} />
            <Route path="/outbound/email/sequences/new" element={<SequenceEditor />} />
            <Route path="/outbound/email/sequences/:id" element={<SequenceEditor />} />
            <Route path="/outbound/email/warmup" element={<EmailWarmup />} />
            {/* Redirects for moved Email Templates */}
            <Route path="/outbound/email/templates/*" element={<Navigate to="/reach/email-templates" replace />} />

            {/* Inbound Email */}
            <Route path="/inbound/email/replies" element={<EmailReplies />} />
            <Route path="/inbound/email/unsubscribers" element={<Unsubscribers />} />

            {/* Outbound SMS */}
            <Route path="/outbound/sms/campaigns" element={<SMSCampaigns />} />
            <Route path="/outbound/sms/campaigns/new" element={<SMSCampaignWizard />} />
            <Route path="/outbound/sms/campaigns/:id" element={<SMSCampaignWizard />} />
            <Route path="/outbound/sms/sequences" element={<SMSSequences />} />
            <Route path="/outbound/sms/sequences/new" element={<SMSSequenceEditor />} />
            <Route path="/outbound/sms/sequences/:id" element={<SMSSequenceEditor />} />
            {/* Redirects for moved SMS Templates */}
            <Route path="/outbound/sms/templates/*" element={<Navigate to="/reach/sms-templates" replace />} />

            {/* Inbound SMS */}
            <Route path="/inbound/sms/replies" element={<SMSReplies />} />
            <Route path="/inbound/sms/unsubscribers" element={<SMSUnsubscribers />} />

            {/* Outbound Calls */}
            <Route path="/outbound/calls/campaigns" element={<CallCampaigns />} />
            <Route path="/outbound/calls/campaigns/new" element={<CallCampaignWizard />} />
            <Route path="/outbound/calls/campaigns/edit/:id" element={<CallCampaignWizard />} />
            <Route path="/outbound/calls/campaigns/:id" element={<CallCampaignDetails />} />
            <Route path="/outbound/calls/logs" element={<Navigate to="/reach/calls/logs" replace />} />
            {/* Redirects for moved Assets */}
            <Route path="/outbound/calls/scripts" element={<Navigate to="/reach/calls/scripts" replace />} />
            <Route path="/outbound/calls/agents" element={<Navigate to="/reach/calls/agents" replace />} />

            {/* Inbound Calls - Traffic Only */}
            <Route path="/inbound/calls/logs" element={<Navigate to="/reach/calls/logs" replace />} />
            {/* Redirect old voicemail and recordings pages to Call Logs */}
            <Route path="/inbound/calls/voicemails" element={<Navigate to="/reach/calls/logs" replace />} />
            <Route path="/calls/recordings" element={<Navigate to="/reach/calls/logs" replace />} />
            <Route path="/inbound/sms/logs" element={<PhoneSms />} />
            <Route path="/inbound/calls/flows" element={<Navigate to="/reach/calls/ivr" replace />} />
            <Route path="/inbound/calls/flows/new" element={<Navigate to="/reach/calls/ivr/new" replace />} />
            <Route path="/inbound/calls/flows/:id" element={<Navigate to="/reach/calls/ivr/:id" replace />} />

            {/* Shared Calls */}
            <Route path="/calls/logs" element={<CallLogs />} />
            <Route path="/calls/logs/:id" element={<CallLogs />} />

            {/* Assets - Shared Infrastructure */}
            <Route path="/calls/numbers" element={<PhoneNumbersList />} />
            <Route path="/calls/numbers/overview" element={<PhoneOverview />} />
            <Route path="/calls/numbers/provisioning" element={<PhoneProvisioning />} />
            {/* Redirect old Flows URL to new IVR URL */}
            <Route path="/flows/*" element={<Navigate to="/reach/calls/ivr" replace />} />

            <Route path="/calls/ivr" element={<CallFlows />} />
            <Route path="/calls/ivr/new" element={<CallFlowBuilder />} />
            <Route path="/calls/ivr/:id" element={<CallFlowBuilder />} />
            <Route path="/calls/pools" element={<NumberPools />} />

            {/* Email Templates */}
            <Route path="/email-templates" element={<Templates />} />
            <Route path="/email-templates/builder/new" element={<EmailTemplateBuilder />} />
            <Route path="/email-templates/builder/:id" element={<EmailTemplateBuilder />} />
            <Route path="/email-templates/new" element={<TemplateEditor />} />
            <Route path="/email-templates/:id" element={<TemplateEditor />} />

            {/* SMS Templates */}
            <Route path="/sms-templates" element={<SMSTemplates />} />
            <Route path="/sms-templates/builder/new" element={<SMSTemplateEditor />} />
            <Route path="/sms-templates/builder/:id" element={<SMSTemplateEditor />} />
            <Route path="/sms-templates/new" element={<SMSTemplateEditor />} />
            <Route path="/sms-templates/:id" element={<SMSTemplateEditor />} />

            {/* Call Assets */}
            <Route path="/calls/scripts" element={<CallScripts />} />
            <Route path="/calls/agents" element={<CallAgents />} />

            {/* Dashboard & Analytics */}
            <Route path="/calls/overview" element={<CallDashboard />} />
            <Route path="/calls/analytics" element={<CallAnalytics />} />
            <Route path="/calls/analytics/dashboard" element={<CallAnalytics />} />
            <Route path="/calls/analytics/dashboard" element={<CallAnalytics />} />
            <Route path="/calls/analytics/advanced" element={<Navigate to="/reach/calls/analytics" replace />} />

            {/* Email & SMS Analytics */}
            <Route path="/email/analytics" element={<EmailAnalytics />} />
            <Route path="/sms/analytics" element={<SMSAnalytics />} />

            {/* Inbound Call Management */}
            <Route path="/calls/inbox" element={<Navigate to="/reach/calls/overview?tab=inbox" replace />} />
            <Route path="/calls/live" element={<Navigate to="/reach/calls/overview?tab=live" replace />} />

            {/* Channels */}
            <Route path="/channels" element={<ChannelSettings />} />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/outbound/email/campaigns" replace />} />

            {/* Legacy compatibility or just catch-all */}
            <Route path="/email/*" element={<Navigate to="/outbound/email/campaigns" replace />} />
            <Route path="/sms/*" element={<Navigate to="/outbound/sms/campaigns" replace />} />
            <Route path="/calls/*" element={<Navigate to="/outbound/calls/campaigns" replace />} />
        </Routes>
    );
};

export default ReachRoutes;
