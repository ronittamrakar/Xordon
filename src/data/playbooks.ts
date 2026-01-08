
import React from 'react';
import { PlaybookCategory, PlaybookType, IndustrySlug, INDUSTRY_COLORS } from '@/types/industry';
import {
    Zap, Mail, MessageSquare, FileTextIcon, Layout, Star,
    RefreshCw, BookOpen, Wrench, Building2, Briefcase, Stethoscope, Home, Scale, Car, Scissors
} from 'lucide-react';

export const PLAYBOOK_CATEGORIES: { value: PlaybookCategory; label: string; icon: React.ReactNode }[] = [
    { value: 'lead_nurture', label: 'Lead Nurturing', icon: React.createElement(Zap, { className: "h-4 w-4" }) },
    { value: 'appointment_reminder', label: 'Appointment Reminders', icon: React.createElement(Mail, { className: "h-4 w-4" }) },
    { value: 'review_request', label: 'Review Requests', icon: React.createElement(Star, { className: "h-4 w-4" }) },
    { value: 'recall', label: 'Recall/Follow-up', icon: React.createElement(RefreshCw, { className: "h-4 w-4" }) },
    { value: 'win_back', label: 'Win-Back', icon: React.createElement(Zap, { className: "h-4 w-4" }) },
    { value: 'referral', label: 'Referral', icon: React.createElement(MessageSquare, { className: "h-4 w-4" }) },
    { value: 'onboarding', label: 'Onboarding', icon: React.createElement(BookOpen, { className: "h-4 w-4" }) },
    { value: 'follow_up', label: 'Follow-Up', icon: React.createElement(Mail, { className: "h-4 w-4" }) },
];

export const PLAYBOOK_TYPES: { value: PlaybookType; label: string; icon: React.ReactNode }[] = [
    { value: 'automation', label: 'Automation', icon: React.createElement(Zap, { className: "h-4 w-4" }) },
    { value: 'campaign', label: 'Campaign', icon: React.createElement(Mail, { className: "h-4 w-4" }) },
    { value: 'landing_page', label: 'Landing Page', icon: React.createElement(Layout, { className: "h-4 w-4" }) },
    { value: 'form', label: 'Form', icon: React.createElement(FileTextIcon, { className: "h-4 w-4" }) },
    { value: 'email_sequence', label: 'Email Sequence', icon: React.createElement(Mail, { className: "h-4 w-4" }) },
    { value: 'sms_sequence', label: 'SMS Sequence', icon: React.createElement(MessageSquare, { className: "h-4 w-4" }) },
];

export const PLAYBOOK_INDUSTRIES: { value: IndustrySlug; label: string; icon: React.ReactNode }[] = [
    { value: 'home_services', label: 'Home Services', icon: React.createElement(Wrench, { className: "h-4 w-4" }) },
    { value: 'local_business', label: 'Local Business', icon: React.createElement(Building2, { className: "h-4 w-4" }) },
    { value: 'professional_services', label: 'Professional Services', icon: React.createElement(Briefcase, { className: "h-4 w-4" }) },
    { value: 'healthcare', label: 'Healthcare', icon: React.createElement(Stethoscope, { className: "h-4 w-4" }) },
    { value: 'real_estate', label: 'Real Estate', icon: React.createElement(Home, { className: "h-4 w-4" }) },
    { value: 'legal', label: 'Legal', icon: React.createElement(Scale, { className: "h-4 w-4" }) },
    { value: 'transportation', label: 'Transportation', icon: React.createElement(Car, { className: "h-4 w-4" }) },
    { value: 'beauty_wellness', label: 'Beauty & Wellness', icon: React.createElement(Scissors, { className: "h-4 w-4" }) },
];

// Pre-built playbook templates
export const PLAYBOOK_TEMPLATES = [
    // Home Services
    { id: 1, industry: 'home_services', name: 'New Lead Follow-Up', category: 'lead_nurture', type: 'automation', description: 'Automated sequence for new service requests', featured: true },
    { id: 2, industry: 'home_services', name: 'Estimate Follow-Up', category: 'follow_up', type: 'email_sequence', description: '3-email sequence after sending estimate', featured: true },
    { id: 3, industry: 'home_services', name: 'Job Complete Review Request', category: 'review_request', type: 'automation', description: 'Request reviews after job completion', featured: false },
    { id: 4, industry: 'home_services', name: 'Seasonal HVAC Reminder', category: 'recall', type: 'campaign', description: 'Bi-annual maintenance reminder campaign', featured: true },

    // Healthcare
    { id: 5, industry: 'healthcare', name: 'New Patient Welcome', category: 'onboarding', type: 'email_sequence', description: 'Welcome sequence for new patients', featured: true },
    { id: 6, industry: 'healthcare', name: 'Appointment Reminder', category: 'appointment_reminder', type: 'automation', description: '48hr, 24hr, and 2hr reminders', featured: true },
    { id: 7, industry: 'healthcare', name: '6-Month Recall', category: 'recall', type: 'automation', description: 'Dental cleaning recall automation', featured: true },
    { id: 8, industry: 'healthcare', name: 'Patient Reactivation', category: 'win_back', type: 'campaign', description: 'Re-engage inactive patients', featured: false },

    // Real Estate
    { id: 9, industry: 'real_estate', name: 'Buyer Lead Nurture', category: 'lead_nurture', type: 'email_sequence', description: 'Long-term nurture for buyer leads', featured: true },
    { id: 10, industry: 'real_estate', name: 'Listing Alert Automation', category: 'follow_up', type: 'automation', description: 'Auto-send new listings matching criteria', featured: true },
    { id: 11, industry: 'real_estate', name: 'Home Anniversary', category: 'recall', type: 'campaign', description: 'Annual home purchase anniversary outreach', featured: false },
    { id: 12, industry: 'real_estate', name: 'Referral Request', category: 'referral', type: 'email_sequence', description: 'Post-closing referral request sequence', featured: true },

    // Legal
    { id: 13, industry: 'legal', name: 'Consultation Follow-Up', category: 'follow_up', type: 'automation', description: 'Follow-up after free consultation', featured: true },
    { id: 14, industry: 'legal', name: 'Case Update Automation', category: 'follow_up', type: 'automation', description: 'Automated case status updates', featured: false },
    { id: 15, industry: 'legal', name: 'Client Onboarding', category: 'onboarding', type: 'email_sequence', description: 'New client welcome and document collection', featured: true },

    // Transportation
    { id: 16, industry: 'transportation', name: 'Booking Confirmation', category: 'appointment_reminder', type: 'automation', description: 'Confirm and remind about bookings', featured: true },
    { id: 17, industry: 'transportation', name: 'Service Complete Follow-Up', category: 'review_request', type: 'sms_sequence', description: 'Post-service feedback and review request', featured: true },
    { id: 18, industry: 'transportation', name: 'Fleet Maintenance Reminder', category: 'recall', type: 'automation', description: 'Vehicle maintenance scheduling', featured: false },

    // Beauty & Wellness
    { id: 19, industry: 'beauty_wellness', name: 'New Client Welcome', category: 'onboarding', type: 'email_sequence', description: 'Welcome and first visit tips', featured: true },
    { id: 20, industry: 'beauty_wellness', name: 'Appointment Reminder', category: 'appointment_reminder', type: 'sms_sequence', description: 'Text reminders with reschedule option', featured: true },
    { id: 21, industry: 'beauty_wellness', name: 'Rebooking Reminder', category: 'recall', type: 'automation', description: 'Remind clients to rebook services', featured: true },
    { id: 22, industry: 'beauty_wellness', name: 'Birthday Special', category: 'win_back', type: 'campaign', description: 'Birthday discount campaign', featured: false },
];
