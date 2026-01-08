// List type definition for static contact groups with folder support

export interface ContactList {
  id: string;
  userId?: string;
  workspaceId?: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  isDefault: boolean;
  contactCount: number;
  createdAt?: string;
  updatedAt?: string;
  
  // Folder structure support
  parentId?: string | null; // null means root level
  isFolder?: boolean;
  folderPath?: string; // e.g., "Marketing/Email Campaigns/Q1"
  childCount?: number; // number of child lists/folders
  
  // CRM integration
  campaignType?: 'email' | 'sms' | 'call' | null;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ListMember {
  id: string;
  contactId: string;
  listId: string;
  addedAt: string;
  addedBy: 'manual' | 'import' | 'automation' | 'segment';
}

export interface FolderTree {
  id: string;
  name: string;
  isFolder: boolean;
  children: FolderTree[];
  list?: ContactList;
}

export interface ListTransferRequest {
  contactIds: string[];
  sourceListId?: string;
  targetListId: string;
  copyMode?: boolean; // true = copy, false = move
}

export const LIST_COLORS = [
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#84cc16', // Lime
  '#f97316', // Orange
];

export const LIST_ICONS = [
  'users',
  'user-check',
  'star',
  'heart',
  'bookmark',
  'folder',
  'inbox',
  'mail',
  'phone',
  'briefcase',
  'target',
  'flag',
];