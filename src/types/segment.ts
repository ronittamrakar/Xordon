// Segment type definition for dynamic contact groups

export interface Segment {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  filterCriteria: SegmentFilter[];
  matchType: 'all' | 'any'; // Match all criteria or any criteria
  contactCount: number;
  lastCalculatedAt?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SegmentFilter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string | string[] | number | boolean;
}

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'in'
  | 'not_in'
  | 'before'
  | 'after'
  | 'between'
  | 'has_tag'
  | 'not_has_tag'
  | 'in_list'
  | 'not_in_list'
  | 'in_company'
  | 'not_in_company';

export const SEGMENT_FILTER_FIELDS = [
  // Contact fields
  { value: 'email', label: 'Email', type: 'string' },
  { value: 'firstName', label: 'First Name', type: 'string' },
  { value: 'lastName', label: 'Last Name', type: 'string' },
  { value: 'phone', label: 'Phone', type: 'string' },
  { value: 'company', label: 'Company Name', type: 'string' },
  { value: 'title', label: 'Job Title', type: 'string' },
  { value: 'city', label: 'City', type: 'string' },
  { value: 'state', label: 'State', type: 'string' },
  { value: 'country', label: 'Country', type: 'string' },
  { value: 'industry', label: 'Industry', type: 'select' },
  { value: 'leadSource', label: 'Lead Source', type: 'string' },
  { value: 'stage', label: 'Stage', type: 'select' },
  { value: 'status', label: 'Status', type: 'select' },
  { value: 'type', label: 'Contact Type', type: 'select' },
  
  // Date fields
  { value: 'createdAt', label: 'Created Date', type: 'date' },
  { value: 'updatedAt', label: 'Updated Date', type: 'date' },
  { value: 'sentAt', label: 'Last Email Sent', type: 'date' },
  { value: 'openedAt', label: 'Last Email Opened', type: 'date' },
  { value: 'clickedAt', label: 'Last Email Clicked', type: 'date' },
  { value: 'birthday', label: 'Birthday', type: 'date' },
  
  // Relationship fields
  { value: 'tags', label: 'Tags', type: 'tags' },
  { value: 'listId', label: 'List', type: 'list' },
  { value: 'companyId', label: 'Company', type: 'company' },
  { value: 'campaignId', label: 'Campaign', type: 'campaign' },
];

export const FILTER_OPERATORS: Record<string, { value: FilterOperator; label: string }[]> = {
  string: [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'starts_with', label: 'starts with' },
    { value: 'ends_with', label: 'ends with' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  select: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
    { value: 'in', label: 'is any of' },
    { value: 'not_in', label: 'is none of' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  date: [
    { value: 'equals', label: 'is' },
    { value: 'before', label: 'is before' },
    { value: 'after', label: 'is after' },
    { value: 'between', label: 'is between' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  number: [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'greater_than', label: 'is greater than' },
    { value: 'less_than', label: 'is less than' },
    { value: 'greater_than_or_equal', label: 'is greater than or equal' },
    { value: 'less_than_or_equal', label: 'is less than or equal' },
    { value: 'between', label: 'is between' },
  ],
  tags: [
    { value: 'has_tag', label: 'has tag' },
    { value: 'not_has_tag', label: 'does not have tag' },
  ],
  list: [
    { value: 'in_list', label: 'is in list' },
    { value: 'not_in_list', label: 'is not in list' },
  ],
  company: [
    { value: 'in_company', label: 'belongs to company' },
    { value: 'not_in_company', label: 'does not belong to company' },
  ],
  campaign: [
    { value: 'equals', label: 'is in campaign' },
    { value: 'not_equals', label: 'is not in campaign' },
  ],
};

export const SEGMENT_COLORS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
];

export const SEGMENT_ICONS = [
  'filter',
  'users',
  'star',
  'heart',
  'zap',
  'target',
  'trending-up',
  'award',
  'flag',
  'bookmark',
];
