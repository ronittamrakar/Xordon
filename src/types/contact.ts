// Contact type definition for unified contacts
export interface Contact {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  company?: string;
  companyId?: string; // Reference to companies table
  companyData?: {
    id: string;
    name: string;
    domain?: string;
    industry?: string;
  };
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  notes?: string;
  additionalDetails?: string;
  birthday?: string;
  leadSource?: string;
  industry?: string;
  companySize?: string;
  companySizeSelection?: string;
  annualRevenue?: string;
  technology?: string;
  // High-level CRM-style stage for this contact (e.g. Lead, Prospect, Client)
  stage?: string;
  status: 'pending' | 'sent' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed' | 'active' | 'invalid' | 'opted_out';
  type: 'email' | 'sms' | 'call';
  campaignId?: string;
  campaign_id?: number;
  campaign_name?: string;
  campaign_type?: string;
  tags?: Tag[];
  lists?: ContactListRef[]; // Lists this contact belongs to
  createdAt?: string;
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  unsubscribed_at?: string;
  updated_at?: string;

  // Proposal specific stats
  proposalCount?: number;
  acceptedProposals?: number;
  totalRevenue?: number;
  lastContacted?: string;
}

// Reference to a list for display in contact
export interface ContactListRef {
  id: string;
  name: string;
  color: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at?: string;
  updated_at?: string;
}
