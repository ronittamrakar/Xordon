// CRM types and interfaces
import type { Contact } from './contact';

export interface Lead {
  id: string;
  contactId: string;
  userId: string;
  leadScore: number;
  leadStage: LeadStage;
  leadValue?: number;
  probability: number;
  expectedCloseDate?: string;
  assignedAgentId?: string;
  source?: string;
  campaignId?: string;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
  contact?: Contact;
  assignedAgentName?: string;
  campaignName?: string;
  tags: string[];
}

export type LeadStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export interface LeadActivity {
  id: string;
  leadId: string;
  contactId: string;
  userId: string;
  activityType: ActivityType;
  activityTitle: string;
  activityDescription?: string;
  activityDate: string;
  durationMinutes?: number;
  outcome?: string;
  nextAction?: string;
  nextActionDate?: string;
  campaignId?: string;
  createdAt: string;
  userName: string;
  contactName: string;
  contactEmail: string;
}

export type ActivityType =
  | 'call'
  | 'email'
  | 'sms'
  | 'meeting'
  | 'note'
  | 'task'
  | 'deal_change';

export interface CRMTask {
  id: string;
  leadId: string;
  contactId: string;
  assignedTo: string;
  createdBy: string;
  title: string;
  description?: string;
  taskType: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  contactName: string;
  contactEmail: string;
  leadStage: LeadStage;
  createdByName: string;
  assignedToName?: string;
  contact?: Contact;
}

export type TaskType = 'call' | 'email' | 'meeting' | 'follow_up' | 'custom';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface LeadTag {
  id: string;
  userId: string;
  name: string;
  color: string;
  description?: string;
  createdAt: string;
}

export interface PipelineStage {
  id: string;
  userId: string;
  name: string;
  description?: string;
  stageOrder: number;
  probability: number;
  isDefault: boolean;
  color: string;
  createdAt: string;
}

// Simplified activity for dashboard display
export interface DashboardActivity {
  id: string;
  activityType: ActivityType;
  activityTitle: string;
  activityDate: string;
  contactName: string;
  contactEmail: string;
  leadStage: LeadStage;
}

export interface CRMDashboard {
  metrics: {
    totalLeads: number;
    newLeads: number;
    qualifiedLeads: number;
    wonDeals: number;
    lostDeals: number;
    totalValue: number;
    avgLeadScore: number;
    totalActivities: number;
    activitiesThisWeek: number;
  };
  recentActivities: DashboardActivity[];
  pipelineData: Array<{
    leadStage: LeadStage;
    count: number;
    totalValue: number;
  }>;
}

export interface LeadFilters {
  stage?: LeadStage;
  source?: string;
  scoreMin?: number;
  scoreMax?: number;
  search?: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  overdue?: boolean;
}

export interface CreateLeadData {
  contactId: string;
  leadScore?: number;
  leadStage?: LeadStage;
  leadValue?: number;
  probability?: number;
  expectedCloseDate?: string;
  assignedAgentId?: string;
  source?: string;
  campaignId?: string;
}

export interface UpdateLeadData {
  contactId?: string;
  leadScore?: number;
  leadStage?: LeadStage;
  leadValue?: number;
  probability?: number;
  expectedCloseDate?: string;
  assignedAgentId?: string;
  source?: string;
}

export interface CreateActivityData {
  activityType: ActivityType;
  activityTitle: string;
  activityDescription?: string;
  activityDate?: string;
  durationMinutes?: number;
  outcome?: string;
  nextAction?: string;
  nextActionDate?: string;
  campaignId?: string;
}

export interface CreateTaskData {
  leadId: string;
  contactId: string;
  assignedTo?: string;
  title: string;
  description?: string;
  taskType?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}

// Lead stage configuration
export const LEAD_STAGES: { value: LeadStage; label: string; color: string; probability: number }[] = [
  { value: 'new', label: 'New Lead', color: '#6c757d', probability: 10 },
  { value: 'contacted', label: 'Contacted', color: '#17a2b8', probability: 20 },
  { value: 'qualified', label: 'Qualified', color: '#28a745', probability: 40 },
  { value: 'proposal', label: 'Proposal', color: '#ffc107', probability: 60 },
  { value: 'negotiation', label: 'Negotiation', color: '#fd7e14', probability: 80 },
  { value: 'closed_won', label: 'Closed Won', color: '#28a745', probability: 100 },
  { value: 'closed_lost', label: 'Closed Lost', color: '#dc3545', probability: 0 }
];

export const ACTIVITY_TYPES: { value: ActivityType; label: string; icon: string }[] = [
  { value: 'call', label: 'Call', icon: 'Phone' },
  { value: 'email', label: 'Email', icon: 'Mail' },
  { value: 'sms', label: 'SMS', icon: 'MessageSquare' },
  { value: 'meeting', label: 'Meeting', icon: 'Calendar' },
  { value: 'note', label: 'Note', icon: 'FileTextIcon' },
  { value: 'task', label: 'Task', icon: 'CheckSquare' },
  { value: 'deal_change', label: 'Deal Change', icon: 'TrendingUp' }
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#28a745' },
  { value: 'medium', label: 'Medium', color: '#ffc107' },
  { value: 'high', label: 'High', color: '#fd7e14' },
  { value: 'urgent', label: 'Urgent', color: '#dc3545' }
];

export const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'custom', label: 'Custom' }
];
