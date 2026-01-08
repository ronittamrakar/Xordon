import { 
    Mail, MessageSquare, Phone, Users, Briefcase, FileText, 
    Calendar, CreditCard, ShieldCheck, Search, Globe, Database
} from 'lucide-react';

export interface AiCapability {
    id: string;
    label: string;
    description: string;
    icon: any;
    module: string;
    requiresApproval: boolean;
}

export const AI_CAPABILITIES: AiCapability[] = [
    // Communication
    {
        id: 'send_email',
        label: 'Send Emails',
        description: 'Compose and send professional emails to contacts',
        icon: Mail,
        module: 'Communication',
        requiresApproval: false
    },
    {
        id: 'send_sms',
        label: 'Send SMS',
        description: 'Send text messages and auto-replies',
        icon: MessageSquare,
        module: 'Communication',
        requiresApproval: false
    },
    {
        id: 'voice_calls',
        label: 'IVR & Outbound Calls',
        description: 'Interact via phone using natural voice AI',
        icon: Phone,
        module: 'Communication',
        requiresApproval: true
    },
    
    // CRM
    {
        id: 'manage_contacts',
        label: 'CRM Management',
        description: 'Create, update and tag contacts/leads',
        icon: Users,
        module: 'CRM',
        requiresApproval: false
    },
    {
        id: 'pipeline_actions',
        label: 'Lead Pipeline',
        description: 'Move deals between stages and update values',
        icon: Briefcase,
        module: 'CRM',
        requiresApproval: true
    },
    
    // Project Management
    {
        id: 'manage_tasks',
        label: 'Task Management',
        description: 'Create and assign tasks in project boards',
        icon: Calendar,
        module: 'Projects',
        requiresApproval: false
    },
    {
        id: 'project_reporting',
        label: 'Status Updates',
        description: 'Generate progress reports for active projects',
        icon: FileText,
        module: 'Projects',
        requiresApproval: false
    },
    
    // Finance
    {
        id: 'generate_invoices',
        label: 'Invoicing',
        description: 'Generate and send invoices/estimates',
        icon: CreditCard,
        module: 'Finance',
        requiresApproval: true
    },
    
    // Sales & Content
    {
        id: 'content_generation',
        label: 'Content Strategy',
        description: 'Generate blogs, social posts and marketing copy',
        icon: FileText,
        module: 'Marketing',
        requiresApproval: false
    },
    {
        id: 'web_reputation',
        label: 'Reputation Management',
        description: 'Respond to reviews and manage public feedback',
        icon: ShieldCheck,
        module: 'Reputation',
        requiresApproval: true
    },
    
    // Technical
    {
        id: 'web_content_updates',
        label: 'Website Updates',
        description: 'Modify website content or blog posts',
        icon: Globe,
        module: 'Websites',
        requiresApproval: true
    },
    {
        id: 'data_analysis',
        label: 'Database Analysis',
        description: 'Query business data for insights and trends',
        icon: Database,
        module: 'Analytics',
        requiresApproval: false
    }
];

export const getCapabilityById = (id: string) => AI_CAPABILITIES.find(c => c.id === id);
