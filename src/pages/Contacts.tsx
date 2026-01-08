import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
// Removed Companies import
import { PersistentResizableTable, PersistentResizableTableHeader, PersistentResizableTableRow, PersistentResizableTableHead, PersistentResizableTableBody, PersistentResizableTableCell, TableActions } from '@/components/ui/persistent-resizable-table';

import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSION_KEYS } from '@/types/rbac';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useToast } from '@/hooks/use-toast';
import { api, type Campaign } from '@/lib/api';
import type { Contact, Tag } from '@/types/contact';
import { Company, COMPANY_STATUSES, INDUSTRIES, COMPANY_SIZES } from '@/types/company';
import { cn } from '@/lib/utils';
import { useCallSession } from '@/contexts/CallSessionContext';
import {
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Mail,
  MessageSquare,
  Phone,
  Trash2,
  Pencil,
  UserPlus,
  Users,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Send,
  CheckCircle,
  Copy,
  Merge,
  AlertTriangle,
  DollarSign,
  Download,
  Upload,
  Building2,
  Globe,
  MapPin,
  ExternalLink,
  List as ListIcon,
  Loader2,
  Check,
} from 'lucide-react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import SEO from '@/components/SEO';

const MOBILE_SETTINGS_KEY = 'xordon_mobile_settings_v1';

const ALL_COLUMN_KEYS: ContactColumnKey[] = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'address',
  'city',
  'state',
  'postalCode',
  'country',
  'company',
  'title',
  'industry',
  'companySize',
  'companySizeSelection',
  'annualRevenue',
  'website',
  'linkedin',
  'twitter',
  'additionalDetails',
  'birthday',
  'leadSource',
  'notes',
  'tags',
  'campaign',
  'type',
  'proposalCount',
  'acceptedProposals',
  'totalRevenue',
  'lastContacted',
  'stage',
  'status',
  'createdAt',
  'lists',
  'actions',
];

const REQUIRED_COLUMNS: ContactColumnKey[] = ['firstName', 'email', 'phone', 'type', 'stage', 'status', 'campaign', 'actions'];

type ContactColumnKey =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'address'
  | 'city'
  | 'state'
  | 'postalCode'
  | 'country'
  | 'company'
  | 'title'
  | 'industry'
  | 'companySize'
  | 'companySizeSelection'
  | 'annualRevenue'
  | 'website'
  | 'linkedin'
  | 'twitter'
  | 'additionalDetails'
  | 'birthday'
  | 'leadSource'
  | 'notes'
  | 'tags'
  | 'campaign'
  | 'type'
  | 'proposalCount'
  | 'acceptedProposals'
  | 'totalRevenue'
  | 'lastContacted'
  | 'stage'
  | 'status'
  | 'createdAt'
  | 'lists'
  | 'actions';

interface ContactColumnDefinition {
  key: ContactColumnKey;
  label: string;
  defaultWidth: number;
  sortable?: boolean;
  render: (contact: Contact) => React.ReactNode;
}

interface ContactFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  company: string;
  title: string;
  industry: string;
  companySize: string;
  companySizeSelection: string;
  annualRevenue: string;
  website: string;
  linkedin: string;
  twitter: string;
  additionalDetails: string;
  birthday: string;
  leadSource: string;
  notes: string;
  tags: string;
  type: 'email' | 'sms' | 'call';
  campaignId: string;
}

const defaultContactForm: ContactFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  company: '',
  title: '',
  industry: '',
  companySize: '',
  companySizeSelection: '',
  annualRevenue: '',
  website: '',
  linkedin: '',
  twitter: '',
  additionalDetails: '',
  birthday: '',
  leadSource: '',
  notes: '',
  tags: '',
  type: 'email',
  campaignId: '',
};

const channelColumnPresets: Record<'all' | 'email' | 'sms' | 'call' | 'proposals', ContactColumnKey[]> = {
  all: ['firstName', 'lastName', 'email', 'phone', 'company', 'title', 'type', 'proposalCount', 'acceptedProposals', 'totalRevenue', 'lastContacted', 'stage', 'status', 'tags', 'campaign', 'lists', 'createdAt', 'actions'],
  email: ['firstName', 'lastName', 'email', 'company', 'title', 'website', 'linkedin', 'leadSource', 'stage', 'tags', 'campaign', 'lists', 'status', 'createdAt', 'actions'],
  sms: ['firstName', 'lastName', 'phone', 'city', 'state', 'type', 'stage', 'status', 'tags', 'campaign', 'lists', 'createdAt', 'actions'],
  call: ['firstName', 'lastName', 'phone', 'company', 'title', 'type', 'stage', 'status', 'tags', 'campaign', 'lists', 'createdAt', 'actions'],
  proposals: ['firstName', 'lastName', 'email', 'company', 'proposalCount', 'acceptedProposals', 'totalRevenue', 'lastContacted', 'status', 'actions'],
};

const createVisibilityMap = (preset: ContactColumnKey[]) => {
  return ALL_COLUMN_KEYS.reduce<Record<ContactColumnKey, boolean>>((acc, key) => {
    acc[key] = REQUIRED_COLUMNS.includes(key) || preset.includes(key);
    return acc;
  }, {} as Record<ContactColumnKey, boolean>);
};

const defaultColumnWidths: Record<ContactColumnKey, number> = {
  firstName: 160,
  lastName: 140,
  email: 220,
  phone: 160,
  address: 220,
  city: 140,
  state: 140,
  postalCode: 140,
  country: 140,
  company: 180,
  title: 160,
  industry: 160,
  companySize: 140,
  companySizeSelection: 180,
  annualRevenue: 150,
  website: 200,
  linkedin: 200,
  twitter: 160,
  additionalDetails: 220,
  birthday: 150,
  leadSource: 150,
  notes: 220,
  tags: 200,
  campaign: 200,
  type: 120,
  proposalCount: 130,
  acceptedProposals: 150,
  totalRevenue: 150,
  lastContacted: 160,
  stage: 140,
  status: 140,
  createdAt: 160,
  lists: 200,
  actions: 80,
};

// Company View (Contacts-based) Column Definitions
type CompanyViewColumnKey = 'company' | 'contactName' | 'title' | 'email' | 'phone' | 'leadSource' | 'status' | 'actions';

const defaultCompanyViewColumnWidths: Record<CompanyViewColumnKey, number> = {
  company: 200,
  contactName: 200,
  title: 150,
  email: 220,
  phone: 150,
  leadSource: 140,
  status: 120,
  actions: 80,
};

const ALL_COMPANY_VIEW_COLUMN_KEYS: CompanyViewColumnKey[] = [
  'company', 'contactName', 'title', 'email', 'phone', 'leadSource', 'status', 'actions'
];

const defaultCompanyForm: Partial<Company> = {
  name: '',
  domain: '',
  industry: '',
  size: '',
  annualRevenue: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  linkedin: '',
  twitter: '',
  description: '',
  status: 'active',
};


const PAGE_SIZE = 25;

const Contacts: React.FC = () => {
  console.log('Contacts Component Loaded - Cache Bust v2');
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { requestSoftphoneCall } = useCallSession();
  const queryClient = useQueryClient();

  // View Mode State
  const [viewMode, setViewMode] = useState<'people' | 'companies'>(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('view') === 'companies' || location.pathname.includes('/companies') ? 'companies' : 'people';
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (location.pathname.includes('/companies') || searchParams.get('view') === 'companies') {
      setViewMode('companies');
    } else {
      setViewMode('people');
    }
  }, [location.pathname, location.search]);

  const loadContacts = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    queryClient.invalidateQueries({ queryKey: ['tags'] });
    queryClient.invalidateQueries({ queryKey: ['campaigns-list'] });
  };

  const setContacts = (updater: any) => {
    queryClient.setQueryData(['contacts'], (old: any) => {
      if (typeof updater === 'function') {
        return updater(old || []);
      }
      return updater;
    });
    // Optional: invalidate after optimistic update to stay in sync
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  // 1. Fetch Contacts
  const {
    data: contacts = [],
    isLoading: isContactsLoading,
    refetch: refetchContacts
  } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => api.getContacts(),
  });

  // 2. Fetch Tags
  const {
    data: tags = [],
    isLoading: isTagsLoading,
    refetch: refetchTags
  } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.getTags(),
  });

  // Determine initial filter based on route
  const getInitialTypeFilter = (): 'all' | 'email' | 'sms' | 'call' => {
    const path = location.pathname;
    if (path.startsWith('/reach/inbound/email/contacts') || path.startsWith('/email/contacts')) return 'email';
    if (path.startsWith('/reach/inbound/sms/contacts') || path.startsWith('/sms/contacts')) return 'sms';
    if (path.startsWith('/reach/inbound/calls/contacts') || path.startsWith('/calls/contacts')) return 'call';
    return 'all';
  };

  const [typeFilter, setTypeFilter] = useState<'all' | 'email' | 'sms' | 'call'>(getInitialTypeFilter());

  // 3. Fetch Campaigns (Reacts to typeFilter)
  const {
    data: campaigns = [],
    isLoading: isCampaignsLoading,
    refetch: refetchCampaigns
  } = useQuery({
    queryKey: ['campaigns-list', typeFilter],
    queryFn: async () => {
      if (typeFilter === 'all') {
        const [emailCampaigns, smsCampaigns, callCampaigns] = await Promise.all([
          api.getCampaigns().catch(() => []),
          api.getSMSCampaigns().catch(() => []),
          api.getCallCampaigns().catch(() => [])
        ]);
        return [
          ...emailCampaigns.map((c: any) => ({ ...c, campaignType: 'email' })),
          ...smsCampaigns.map((c: any) => ({ ...c, campaignType: 'sms' })),
          ...callCampaigns.map((c: any) => ({ ...c, campaignType: 'call' }))
        ];
      }
      if (typeFilter === 'email') {
        const data = await api.getCampaigns();
        return data.map((c: any) => ({ ...c, campaignType: 'email' }));
      }
      if (typeFilter === 'sms') {
        const data = await api.getSMSCampaigns();
        return data.map((c: any) => ({ ...c, campaignType: 'sms' }));
      }
      if (typeFilter === 'call') {
        const data = await api.getCallCampaigns();
        return data.map((c: any) => ({ ...c, campaignType: 'call' }));
      }
      return [];
    }
  });

  // 4. Fetch Companies
  const {
    data: companiesResponse,
    isLoading: isCompaniesLoading,
    refetch: refetchCompanies
  } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.getCompanies(),
    enabled: viewMode === 'companies',
  });

  const companies = companiesResponse?.companies || [];

  // 5. Fetch Lists for "Add to List" feature
  const {
    data: listsData,
    isLoading: isListsLoading,
    refetch: refetchLists
  } = useQuery({
    queryKey: ['lists'],
    queryFn: () => api.getLists(),
  });

  const contactLists = listsData?.lists || [];

  // 6. Fetch Pipelines for Dynamic Stage Editor
  const { data: pipelinesData } = useQuery({
    queryKey: ['pipelines'],
    queryFn: () => api.get<any>('/pipelines').then((res: any) => Array.isArray(res) ? res : res.data || []),
  });

  const pipelineStages = useMemo(() => {
    if (!pipelinesData || pipelinesData.length === 0) return null;
    const defaultPipeline = pipelinesData.find((p: any) => p.is_default) || pipelinesData[0];
    return defaultPipeline.stages || [];
  }, [pipelinesData]);

  const isLoading = isContactsLoading || isTagsLoading || isCampaignsLoading || (viewMode === 'companies' && isCompaniesLoading);




  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');


  const [campaignFilter, setCampaignFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    company: '',
    industry: '',
    technology: '',
    location: '',
    leadSource: '',
  });

  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [compactLists, setCompactLists] = useState(false);
  const [oneTapActions, setOneTapActions] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MOBILE_SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { compactLists?: boolean; oneTapActions?: boolean };
      if (typeof parsed.compactLists === 'boolean') setCompactLists(parsed.compactLists);
      if (typeof parsed.oneTapActions === 'boolean') setOneTapActions(parsed.oneTapActions);
    } catch {
      // ignore
    }
  }, []);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Contact; direction: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(1);
  const [columnVisibility, setColumnVisibility] = useState<Record<ContactColumnKey, boolean>>(() =>
    createVisibilityMap(channelColumnPresets.all),
  );

  const [companyColumnVisibility, setCompanyColumnVisibility] = useState<Record<CompanyViewColumnKey, boolean>>(() => {
    return ALL_COMPANY_VIEW_COLUMN_KEYS.reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<CompanyViewColumnKey, boolean>);
  });

  const toggleCompanyColumnVisibility = (key: CompanyViewColumnKey, isVisible: boolean) => {
    setCompanyColumnVisibility(prev => ({ ...prev, [key]: isVisible }));
  };

  const activeCompanyColumns = useMemo(() => {
    return ALL_COMPANY_VIEW_COLUMN_KEYS.filter(key => companyColumnVisibility[key]).map(key => {
      return {
        key,
        label: key === 'contactName' ? 'Contact Name' : key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
        defaultWidth: defaultCompanyViewColumnWidths[key] || 100,
        sortable: key !== 'actions',
      };
    });
  }, [companyColumnVisibility]);

  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isCampaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [contactForm, setContactForm] = useState<ContactFormState>(defaultContactForm);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [campaignSelection, setCampaignSelection] = useState<string | undefined>(undefined);

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ contactId: string; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // Duplicate detection state
  const [isDuplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateCriteria, setDuplicateCriteria] = useState<'email' | 'phone' | 'both'>('email');
  const [duplicates, setDuplicates] = useState<Array<{
    type: 'email' | 'phone' | 'email_and_phone';
    value: string;
    count: number;
    contacts: Contact[];
  }>>([]);
  const [duplicateSummary, setDuplicateSummary] = useState<{
    totalGroups: number;
    totalDuplicates: number;
    removableCount: number;
  } | null>(null);
  const [isLoadingDuplicates, setIsLoadingDuplicates] = useState(false);
  const [selectedDuplicateGroup, setSelectedDuplicateGroup] = useState<number | null>(null);
  const [keepStrategy, setKeepStrategy] = useState<'oldest' | 'newest' | 'specific'>('oldest');
  const [selectedKeepIds, setSelectedKeepIds] = useState<string[]>([]);

  // Company State
  const [isCompanyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState<Partial<Company>>(defaultCompanyForm);
  const [companyDeleteConfirmId, setCompanyDeleteConfirmId] = useState<string | null>(null);

  // Pipeline / Deal Creation State
  const [isAddToPipelineOpen, setAddToPipelineOpen] = useState(false);
  const [selectedContactForPipeline, setSelectedContactForPipeline] = useState<Contact | null>(null);
  const [pipelineForm, setPipelineForm] = useState({
    title: '',
    value: '',
    stage: 'lead',
  });

  // Add to List State
  const [isAddToListDialogOpen, setAddToListDialogOpen] = useState(false);
  const [selectedContactsForList, setSelectedContactsForList] = useState<string[]>([]);
  const [targetListId, setTargetListId] = useState<string | null>(null);
  const [createNewList, setCreateNewList] = useState(false);
  const [newListNameForContacts, setNewListNameForContacts] = useState('');


  // Import/Export State
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  useEffect(() => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const viewQuery = searchParams.get('view');

    if (viewQuery === 'proposals') {
      setColumnVisibility(createVisibilityMap(channelColumnPresets.proposals));
    } else if (path.startsWith('/reach/inbound/email/contacts') || path.startsWith('/email/contacts')) {
      setTypeFilter('email');
    } else if (path.startsWith('/reach/inbound/sms/contacts') || path.startsWith('/sms/contacts')) {
      setTypeFilter('sms');
    } else if (path.startsWith('/reach/inbound/calls/contacts') || path.startsWith('/calls/contacts')) {
      setTypeFilter('call');
    } else if (path === '/contacts') {
      setTypeFilter('all');
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    setColumnVisibility(createVisibilityMap(channelColumnPresets[typeFilter] ?? channelColumnPresets.all));
  }, [typeFilter]);

  useEffect(() => {
    const handler = () => {
      refetchContacts();
      refetchCompanies();
    };

    window.addEventListener('contacts:updated', handler as EventListener);
    return () => window.removeEventListener('contacts:updated', handler as EventListener);
  }, [refetchContacts, refetchCompanies]);

  // Contact Mutations
  const deleteContactMutation = useMutation({
    mutationFn: (id: string) => api.deleteContact(id),
    onSuccess: () => {
      toast({ title: 'Contact deleted' });
      loadContacts(); // Invalidate contacts query
    },
    onError: () => {
      toast({ title: 'Failed to delete contact', variant: 'destructive' });
    },
  });

  // Company Mutations
  const createCompanyMutation = useMutation({
    mutationFn: (data: Partial<Company>) => api.createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({ title: 'Company created successfully' });
      setCompanyDialogOpen(false);
      setCompanyForm(defaultCompanyForm);
    },
    onError: () => {
      toast({ title: 'Failed to create company', variant: 'destructive' });
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Company> }) => api.updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({ title: 'Company updated successfully' });
      setCompanyDialogOpen(false);
      setEditingCompany(null);
      setCompanyForm(defaultCompanyForm);
    },
    onError: () => {
      toast({ title: 'Failed to update company', variant: 'destructive' });
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: (id: string) => api.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({ title: 'Company deleted successfully' });
      setCompanyDeleteConfirmId(null);
    },
    onError: () => {
      toast({ title: 'Failed to delete company', variant: 'destructive' });
    },
  });

  // List Mutations
  const createListMutation = useMutation({
    mutationFn: (data: any) => api.createList(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      toast({ title: 'List created successfully' });
      return response;
    },
    onError: () => {
      toast({ title: 'Failed to create list', variant: 'destructive' });
    },
  });

  const addContactsToListMutation = useMutation({
    mutationFn: ({ listId, contactIds }: { listId: string; contactIds: string[] }) =>
      api.addContactsToList(listId, contactIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({ title: 'Contacts added to list successfully' });
      setAddToListDialogOpen(false);
      setSelectedContactsForList([]);
      setTargetListId(null);
      setCreateNewList(false);
      setNewListNameForContacts('');
    },
    onError: () => {
      toast({ title: 'Failed to add contacts to list', variant: 'destructive' });
    },
  });


  const filteredData = useMemo(() => {
    if (viewMode === 'companies') {
      // Filter Logic for Companies View (using contacts data)
      return contacts.filter((contact) => {
        const matchesSearch = !searchQuery ||
          contact.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.company?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;

        // Only show contacts that HAVE a company in this view? 
        // Or just show all? User said "same contacts".
        // Let's show all, but sort by company primarily.

        return matchesSearch && matchesStatus;
      });
    }

    // Existing Contact Logic
    return contacts.filter((contact) => {
      const matchesSearch = !searchQuery ||
        contact.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || contact.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
      const matchesCampaign = campaignFilter === 'all' || contact.campaignId === campaignFilter;
      const matchesTag = tagFilter === 'all' || contact.tags?.some((tag) => tag.id === tagFilter);

      const matchesAdvanced =
        (!advancedFilters.company || contact.company?.toLowerCase().includes(advancedFilters.company.toLowerCase())) &&
        (!advancedFilters.industry || contact.industry?.toLowerCase().includes(advancedFilters.industry.toLowerCase())) &&
        (!advancedFilters.technology || contact.technology?.toLowerCase().includes(advancedFilters.technology.toLowerCase())) &&
        (!advancedFilters.location || `${contact.city} ${contact.state} ${contact.country}`.toLowerCase().includes(advancedFilters.location.toLowerCase())) &&
        (!advancedFilters.leadSource || contact.leadSource?.toLowerCase().includes(advancedFilters.leadSource.toLowerCase()));

      return matchesSearch && matchesType && matchesStatus && matchesCampaign && matchesTag && matchesAdvanced;
    });
  }, [contacts, companies, viewMode, searchQuery, typeFilter, statusFilter, campaignFilter, tagFilter, advancedFilters]);

  // Determine effective sort config
  useEffect(() => {
    if (viewMode === 'companies' && (!sortConfig || sortConfig.key !== 'company')) {
      setSortConfig({ key: 'company', direction: 'asc' });
    }
  }, [viewMode]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a: any, b: any) => {
      const valueA = a[sortConfig.key];
      const valueB = b[sortConfig.key];

      if (valueA === undefined || valueA === null) return 1;
      if (valueB === undefined || valueB === null) return -1;

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortConfig.direction === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      if (valueA < valueB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / PAGE_SIZE));
  const currentViewData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedData.slice(start, start + PAGE_SIZE);
  }, [sortedData, page]);


  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      // Allow sorting by any key even if it's not strictly keyof Contact (for future extensibility)
      if (prev && prev.key === key) {
        const direction = prev.direction === 'asc' ? 'desc' : 'asc';
        return { key: key as keyof Contact, direction };
      }
      return { key: key as keyof Contact, direction: 'asc' };
    });
  };

  // Editable cell component for inline editing
  const EditableCell: React.FC<{
    contact: Contact;
    field: keyof Contact;
    value: any;
    className?: string;
  }> = ({ contact, field, value, className }) => {
    const isEditing = editingCell?.contactId === contact.id && editingCell?.field === field;

    if (isEditing) {
      return (
        <Input
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={saveInlineEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              saveInlineEdit();
            } else if (e.key === 'Escape') {
              cancelInlineEdit();
            }
          }}
          autoFocus
          className="h-8 text-sm"
        />
      );
    }

    return (
      <div
        onClick={() => startInlineEdit(contact.id, field as string, value)}
        className={cn(
          "cursor-pointer hover:bg-muted/50 px-2 py-1 rounded min-h-[32px] flex items-center",
          className
        )}
        title="Click to edit"
      >
        {value || '—'}
      </div>
    );
  };

  // List editor with multi-select popover
  const ListEditor: React.FC<{ contact: Contact }> = ({ contact }) => {
    const isEditing = editingCell?.contactId === contact.id && editingCell?.field === 'lists';
    const [open, setOpen] = useState(false);

    // Derived state for current lists
    const currentListIds = useMemo(() => {
      return (contact.lists || []).map(l => l.id);
    }, [contact.lists]);

    const toggleList = async (listId: string) => {
      const isSelected = currentListIds.includes(listId);
      try {
        if (isSelected) {
          // Remove
          await api.removeContactsFromList(listId, [contact.id]);
          // Optimistic update
          setContacts((prev: Contact[]) => prev.map(c => {
            if (c.id === contact.id) {
              return {
                ...c,
                lists: (c.lists || []).filter(l => l.id !== listId)
              };
            }
            return c;
          }));
          toast({ title: 'Removed from list' });
        } else {
          // Add
          await api.addContactsToList(listId, [contact.id]);
          // Optimistic update - need list name and color
          const listInfo = contactLists.find((l: any) => l.id === listId);
          if (listInfo) {
            setContacts((prev: Contact[]) => prev.map(c => {
              if (c.id === contact.id) {
                return {
                  ...c,
                  lists: [...(c.lists || []), { id: listId, name: listInfo.name, color: listInfo.color || '#3b82f6' }]
                };
              }
              return c;
            }));
          }
          toast({ title: 'Added to list' });
        }
      } catch (error) {
        toast({ title: 'Failed to update list assignment', variant: 'destructive' });
      }
    };

    if (isEditing || open) {
      // We use Popover mostly, but if 'isEditing' is triggered by row click, we might want to auto-open.
      // Here we rely on the internal open state of Popover, but synchronize with editingCell if needed.
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded min-h-[32px] flex flex-wrap gap-1 items-center"
            title="Click to manage lists"
            onClick={(e) => {
              // If there are many lists, we might want to prevent row click? 
              // But here we are the cell renderer.
            }}
          >
            {(contact.lists && contact.lists.length > 0) ? (
              contact.lists.map((list) => (
                <Badge key={list.id} variant="secondary" className="text-xs" style={{ backgroundColor: list.color + '20', color: list.color }}>
                  {list.name}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[200px]" align="start">
          <Command>
            <CommandInput placeholder="Select list..." />
            <CommandList>
              <CommandEmpty>No lists found.</CommandEmpty>
              <CommandGroup>
                {contactLists.map((list: any) => {
                  const isSelected = currentListIds.includes(list.id);
                  return (
                    <CommandItem
                      key={list.id}
                      onSelect={() => toggleList(list.id)}
                    >
                      <div className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                      )}>
                        <Check className={cn("h-4 w-4")} />
                      </div>
                      <span>{list.name}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem onSelect={() => {
                  setOpen(false);
                  openAddToListDialog([contact.id]);
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create new list
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  // Stage dropdown editor (Prospect / Lead / Opportunity / Client / Inactive)
  // Connected to CRM Pipeline Stages if available
  const StageEditor: React.FC<{ contact: Contact }> = ({ contact }) => {
    const isEditing = editingCell?.contactId === contact.id && editingCell?.field === 'stage';

    const stageOptions: { value: string; label: string; color?: string }[] = useMemo(() => {
      if (pipelineStages && pipelineStages.length > 0) {
        // Use CRM stages
        return pipelineStages.map((s: any) => ({
          value: s.name.toLowerCase(), // Or s.id? Using name for loose coupling with contact.stage string
          label: s.name,
          color: s.color
        }));
      }
      // Fallback
      return [
        { value: 'prospect', label: 'Prospect' },
        { value: 'lead', label: 'Lead' },
        { value: 'opportunity', label: 'Opportunity' },
        { value: 'customer', label: 'Client' },
        { value: 'inactive', label: 'Inactive' },
      ];
    }, []);

    const updateStage = async (newStage: string) => {
      try {
        await api.updateContact(contact.id, { stage: newStage });
        setContacts((prev: Contact[]) => prev.map(c =>
          c.id === contact.id ? { ...c, stage: newStage } : c
        ));
        toast({ title: 'Stage updated' });
        cancelInlineEdit();
      } catch (error) {
        toast({ title: 'Failed to update stage', variant: 'destructive' });
      }
    };

    if (isEditing) {
      return (
        <Select value={contact.stage?.toLowerCase() || 'prospect'} onValueChange={updateStage}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {stageOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <div
        onClick={() => startInlineEdit(contact.id, 'stage', contact.stage || '')}
        className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded min-h-[32px] flex items-center"
        title="Click to change stage"
      >
        <Badge variant="outline" className="capitalize">
          {(() => {
            const current = stageOptions.find(opt => opt.value === (contact.stage?.toLowerCase() || 'prospect'));
            return current?.label || (contact.stage || 'Prospect');
          })()}
        </Badge>
      </div>
    );
  };

  // Tags editor with autocomplete
  const TagsEditor: React.FC<{ contact: Contact }> = ({ contact }) => {
    const isEditing = editingCell?.contactId === contact.id && editingCell?.field === 'tags';
    const [tagInput, setTagInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const currentTags = contact.tags || [];
    const availableTags = tags.filter(t => !currentTags.some(ct => ct.id === t.id));
    const filteredTags = availableTags.filter(t =>
      t.name.toLowerCase().includes(tagInput.toLowerCase())
    );

    const addTag = async (tag: typeof tags[0]) => {
      const updatedTags = [...currentTags, tag];
      try {
        await api.updateContact(contact.id, { tags: updatedTags });
        setContacts(prev => prev.map(c =>
          c.id === contact.id ? { ...c, tags: updatedTags } : c
        ));
        setTagInput('');
        toast({ title: 'Tag added' });
      } catch (error) {
        toast({ title: 'Failed to add tag', variant: 'destructive' });
      }
    };

    const removeTag = async (tagId: string) => {
      const updatedTags = currentTags.filter(t => t.id !== tagId);
      try {
        await api.updateContact(contact.id, { tags: updatedTags });
        setContacts(prev => prev.map(c =>
          c.id === contact.id ? { ...c, tags: updatedTags } : c
        ));
        toast({ title: 'Tag removed' });
      } catch (error) {
        toast({ title: 'Failed to remove tag', variant: 'destructive' });
      }
    };

    const createNewTag = async () => {
      if (!tagInput.trim()) return;
      const newTag = { id: tagInput.toLowerCase().replace(/\s+/g, '-'), name: tagInput, color: '#3b82f6' };
      await addTag(newTag);
    };

    if (isEditing) {
      return (
        <div className="relative" onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}>
          <Input
            value={tagInput}
            onChange={(e) => {
              setTagInput(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredTags.length > 0) {
                  addTag(filteredTags[0]);
                } else {
                  createNewTag();
                }
              } else if (e.key === 'Escape') {
                cancelInlineEdit();
              }
            }}
            placeholder="Type to add tags..."
            autoFocus
            className="h-8 text-sm"
          />
          {showSuggestions && tagInput && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-auto">
              {filteredTags.map(tag => (
                <div
                  key={tag.id}
                  onClick={() => addTag(tag)}
                  className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                >
                  {tag.name}
                </div>
              ))}
              {filteredTags.length === 0 && (
                <div
                  onClick={createNewTag}
                  className="px-3 py-2 hover:bg-muted cursor-pointer text-sm text-primary"
                >
                  Create "{tagInput}"
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        onClick={() => startInlineEdit(contact.id, 'tags', '')}
        className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded min-h-[32px]"
        title="Click to edit tags"
      >
        <div className="flex flex-wrap gap-1">
          {currentTags.length > 0 ? (
            currentTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs group/tag"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag.id);
                }}
              >
                {tag.name}
                <span className="ml-1 opacity-0 group-hover/tag:opacity-100">×</span>
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      </div>
    );
  };

  // Status dropdown editor
  const StatusEditor: React.FC<{ contact: Contact }> = ({ contact }) => {
    const isEditing = editingCell?.contactId === contact.id && editingCell?.field === 'status';
    const statuses: Contact['status'][] = ['active', 'pending', 'sent', 'opened', 'clicked', 'bounced', 'unsubscribed', 'invalid', 'opted_out'];

    const updateStatus = async (newStatus: string) => {
      try {
        const typedStatus = newStatus as Contact['status'];
        await api.updateContact(contact.id, { status: typedStatus });
        setContacts(prev => prev.map(c =>
          c.id === contact.id ? { ...c, status: typedStatus } : c
        ));
        toast({ title: 'Status updated' });
        cancelInlineEdit();
      } catch (error) {
        toast({ title: 'Failed to update status', variant: 'destructive' });
      }
    };

    if (isEditing) {
      return (
        <Select value={contact.status || 'pending'} onValueChange={updateStatus}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map(status => (
              <SelectItem key={status} value={status} className="capitalize">
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <div
        onClick={() => startInlineEdit(contact.id, 'status', contact.status)}
        className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded min-h-[32px] flex items-center"
        title="Click to change status"
      >
        <Badge variant="secondary" className="capitalize">
          {contact.status || 'unknown'}
        </Badge>
      </div>
    );
  };

  // Type/Channel dropdown editor
  const TypeEditor: React.FC<{ contact: Contact }> = ({ contact }) => {
    const isEditing = editingCell?.contactId === contact.id && editingCell?.field === 'type';
    const types: Array<'email' | 'sms' | 'call'> = ['email', 'sms', 'call'];

    const updateType = async (newType: 'email' | 'sms' | 'call') => {
      try {
        await api.updateContact(contact.id, { type: newType });
        setContacts(prev => prev.map(c =>
          c.id === contact.id ? { ...c, type: newType } : c
        ));
        toast({ title: 'Channel updated' });
        cancelInlineEdit();
      } catch (error) {
        toast({ title: 'Failed to update channel', variant: 'destructive' });
      }
    };

    if (isEditing) {
      return (
        <Select value={contact.type} onValueChange={updateType}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {types.map(type => (
              <SelectItem key={type} value={type} className="capitalize">
                <div className="flex items-center gap-2">
                  {type === 'email' && <Mail className="h-4 w-4" />}
                  {type === 'sms' && <MessageSquare className="h-4 w-4" />}
                  {type === 'call' && <Phone className="h-4 w-4" />}
                  {type}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <div
        onClick={() => startInlineEdit(contact.id, 'type', contact.type)}
        className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded min-h-[32px] flex items-center"
        title="Click to change channel"
      >
        <div className="flex items-center gap-1 capitalize">
          {contact.type === 'email' && <Mail className="h-4 w-4 text-muted-foreground" />}
          {contact.type === 'sms' && <MessageSquare className="h-4 w-4 text-muted-foreground" />}
          {contact.type === 'call' && <Phone className="h-4 w-4 text-muted-foreground" />}
          <span>{contact.type}</span>
        </div>
      </div>
    );
  };

  // Campaign dropdown editor
  const CampaignEditor: React.FC<{ contact: Contact }> = ({ contact }) => {
    const isEditing = editingCell?.contactId === contact.id && editingCell?.field === 'campaign';

    const updateCampaign = async (campaignId: string) => {
      try {
        const actualCampaignId = campaignId === '__none' ? '' : campaignId;
        await api.updateContact(contact.id, { campaignId: actualCampaignId });
        setContacts(prev => prev.map(c =>
          c.id === contact.id ? { ...c, campaignId: actualCampaignId } : c
        ));
        toast({ title: 'Campaign updated' });
        cancelInlineEdit();
      } catch (error) {
        toast({ title: 'Failed to update campaign', variant: 'destructive' });
      }
    };

    if (isEditing) {
      return (
        <Select value={contact.campaignId || '__none'} onValueChange={updateCampaign}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Select campaign" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">No Campaign</SelectItem>
            {campaigns.filter(campaign => campaign.id).map(campaign => (
              <SelectItem key={campaign.id} value={campaign.id}>
                {campaign.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    const campaignId = contact.campaignId || contact.campaign_id?.toString();
    const campaignName = contact.campaign_name || campaigns.find(c => c.id === campaignId)?.name;

    return (
      <div
        onClick={() => startInlineEdit(contact.id, 'campaign', contact.campaignId)}
        className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded min-h-[32px] flex items-center"
        title="Click to change campaign"
      >
        {campaignName || '—'}
      </div>
    );
  };

  const columns: ContactColumnDefinition[] = useMemo(() => [
    {
      key: 'firstName',
      label: 'First Name',
      defaultWidth: defaultColumnWidths.firstName,
      sortable: true,
      render: (contact) => {
        const isEditing = editingCell?.contactId === contact.id && editingCell?.field === 'firstName';

        if (isEditing) {
          return (
            <Input
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={saveInlineEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveInlineEdit();
                } else if (e.key === 'Escape') {
                  cancelInlineEdit();
                }
              }}
              autoFocus
              className="h-8 text-sm"
            />
          );
        }

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/contacts/${contact.id}`)}
              className="text-left font-medium text-primary hover:underline flex-1"
            >
              {contact.firstName || '—'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startInlineEdit(contact.id, 'firstName', contact.firstName);
              }}
              className="opacity-0 group-hover:opacity-100 hover:bg-muted p-1 rounded"
              title="Edit"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </div>
        );
      },
    },
    {
      key: 'lastName',
      label: 'Last Name',
      defaultWidth: defaultColumnWidths.lastName,
      sortable: true,
      render: (contact) => <EditableCell contact={contact} field="lastName" value={contact.lastName} />,
    },
    {
      key: 'email',
      label: 'Email',
      defaultWidth: defaultColumnWidths.email,
      sortable: true,
      render: (contact) => <EditableCell contact={contact} field="email" value={contact.email} />,
    },
    {
      key: 'phone',
      label: 'Phone',
      defaultWidth: defaultColumnWidths.phone,
      render: (contact) => <EditableCell contact={contact} field="phone" value={contact.phone} />,
    },
    {
      key: 'address',
      label: 'Address',
      defaultWidth: defaultColumnWidths.address,
      render: (contact) => <EditableCell contact={contact} field="address" value={contact.address} />,
    },
    {
      key: 'city',
      label: 'City',
      defaultWidth: defaultColumnWidths.city,
      render: (contact) => <EditableCell contact={contact} field="city" value={contact.city} />,
    },
    {
      key: 'state',
      label: 'State/Province',
      defaultWidth: defaultColumnWidths.state,
      render: (contact) => <EditableCell contact={contact} field="state" value={contact.state} />,
    },
    {
      key: 'postalCode',
      label: 'Postal Code',
      defaultWidth: defaultColumnWidths.postalCode,
      render: (contact) => <EditableCell contact={contact} field="postalCode" value={contact.postalCode} />,
    },
    {
      key: 'country',
      label: 'Country',
      defaultWidth: defaultColumnWidths.country,
      render: (contact) => <EditableCell contact={contact} field="country" value={contact.country} />,
    },
    {
      key: 'company',
      label: 'Company',
      defaultWidth: defaultColumnWidths.company,
      render: (contact) => <EditableCell contact={contact} field="company" value={contact.company} />,
    },
    {
      key: 'title',
      label: 'Title',
      defaultWidth: defaultColumnWidths.title,
      render: (contact) => <EditableCell contact={contact} field="title" value={contact.title} />,
    },
    {
      key: 'industry',
      label: 'Industry',
      defaultWidth: defaultColumnWidths.industry,
      render: (contact) => <EditableCell contact={contact} field="industry" value={contact.industry} />,
    },
    {
      key: 'companySize',
      label: 'Company Size',
      defaultWidth: defaultColumnWidths.companySize,
      render: (contact) => <EditableCell contact={contact} field="companySize" value={contact.companySize} />,
    },
    {
      key: 'companySizeSelection',
      label: 'Select Company Size',
      defaultWidth: defaultColumnWidths.companySizeSelection,
      render: (contact) => <EditableCell contact={contact} field="companySizeSelection" value={contact.companySizeSelection} />,
    },
    {
      key: 'annualRevenue',
      label: 'Annual Revenue',
      defaultWidth: defaultColumnWidths.annualRevenue,
      render: (contact) => <EditableCell contact={contact} field="annualRevenue" value={contact.annualRevenue} />,
    },
    {
      key: 'website',
      label: 'Website',
      defaultWidth: defaultColumnWidths.website,
      render: (contact) =>
        contact.website ? (
          <a href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            {contact.website}
          </a>
        ) : '—',
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      defaultWidth: defaultColumnWidths.linkedin,
      render: (contact) =>
        contact.linkedin ? (
          <a href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            {contact.linkedin}
          </a>
        ) : '—',
    },
    {
      key: 'twitter',
      label: 'Twitter',
      defaultWidth: defaultColumnWidths.twitter,
      render: (contact) => <EditableCell contact={contact} field="twitter" value={contact.twitter} />,
    },
    {
      key: 'additionalDetails',
      label: 'Additional Details',
      defaultWidth: defaultColumnWidths.additionalDetails,
      render: (contact) => <EditableCell contact={contact} field="additionalDetails" value={contact.additionalDetails} />,
    },
    {
      key: 'birthday',
      label: 'Birthday',
      defaultWidth: defaultColumnWidths.birthday,
      render: (contact) => <EditableCell contact={contact} field="birthday" value={contact.birthday ? new Date(contact.birthday).toLocaleDateString() : ''} />,
    },
    {
      key: 'leadSource',
      label: 'Lead Source',
      defaultWidth: defaultColumnWidths.leadSource,
      render: (contact) => <EditableCell contact={contact} field="leadSource" value={contact.leadSource} />,
    },
    {
      key: 'notes',
      label: 'Notes',
      defaultWidth: defaultColumnWidths.notes,
      render: (contact) => <EditableCell contact={contact} field="notes" value={contact.notes} />,
    },
    {
      key: 'tags',
      label: 'Tags',
      defaultWidth: defaultColumnWidths.tags,
      render: (contact) => <TagsEditor contact={contact} />,
    },
    {
      key: 'campaign',
      label: 'Campaign',
      defaultWidth: defaultColumnWidths.campaign,
      render: (contact) => <CampaignEditor contact={contact} />,
    },
    {
      key: 'type',
      label: 'Channel',
      defaultWidth: defaultColumnWidths.type,
      render: (contact) => <TypeEditor contact={contact} />,
    },
    {
      key: 'proposalCount',
      label: 'Proposals',
      defaultWidth: defaultColumnWidths.proposalCount,
      sortable: true,
      render: (contact) => contact.proposalCount || 0,
    },
    {
      key: 'acceptedProposals',
      label: 'Accepted',
      defaultWidth: defaultColumnWidths.acceptedProposals,
      sortable: true,
      render: (contact) => contact.acceptedProposals || 0,
    },
    {
      key: 'totalRevenue',
      label: 'Revenue',
      defaultWidth: defaultColumnWidths.totalRevenue,
      sortable: true,
      render: (contact) => contact.totalRevenue ? `$${contact.totalRevenue.toLocaleString()}` : '—',
    },
    {
      key: 'lastContacted',
      label: 'Last Contacted',
      defaultWidth: defaultColumnWidths.lastContacted,
      sortable: true,
      render: (contact) => contact.lastContacted ? new Date(contact.lastContacted).toLocaleDateString() : '—',
    },
    {
      key: 'stage',
      label: 'Stage',
      defaultWidth: defaultColumnWidths.stage,
      render: (contact) => <StageEditor contact={contact} />,
    },
    {
      key: 'status',
      label: 'Status',
      defaultWidth: defaultColumnWidths.status,
      render: (contact) => <StatusEditor contact={contact} />,
    },
    {
      key: 'createdAt',
      label: 'Created',
      defaultWidth: defaultColumnWidths.createdAt,
      sortable: true,
      render: (contact) => new Date(contact.createdAt ?? contact.updated_at ?? '').toLocaleDateString(),
    },
    {
      key: 'lists',
      label: 'Lists',
      defaultWidth: defaultColumnWidths.lists,
      render: (contact) => <ListEditor contact={contact} />,
    },
    {
      key: 'actions',
      label: '',
      defaultWidth: defaultColumnWidths.actions,
      render: (contact) => (
        <div className="flex items-center justify-end gap-1">
          {oneTapActions && Boolean(contact.phone) && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCall(contact);
                }}
                title="Call"
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSendSMS(contact);
                }}
                title="Send SMS"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" type="button">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Contact Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate(`/contacts/${contact.id}`)}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditDialog(contact)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSendEmail(contact)}>
                <Mail className="mr-2 h-4 w-4" /> Send Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSendSMS(contact)}>
                <MessageSquare className="mr-2 h-4 w-4" /> Send SMS
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCall(contact)}>
                <Phone className="mr-2 h-4 w-4" /> Call
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCampaignDialog([contact.id])}>
                Add to Campaign
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openAddToListDialog([contact.id])}>
                <ListIcon className="mr-2 h-4 w-4" /> Add to List
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openAddToPipelineDialog(contact)}>
                <DollarSign className="mr-2 h-4 w-4" /> Add to Pipeline
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(`/proposals/new?client_email=${encodeURIComponent(contact.email || '')}&client_name=${encodeURIComponent((contact.firstName || '') + ' ' + (contact.lastName || ''))}`)}>
                <Send className="mr-2 h-4 w-4" /> Create Proposal
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={() => deleteContactMutation.mutate(contact.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [navigate, editingCell, editingValue, tags, campaigns, contacts, deleteContactMutation]);

  const visibleColumns = useMemo(() => columns.filter((column) => columnVisibility[column.key]), [columns, columnVisibility]);

  const openAddDialog = () => {
    // Set the type based on current filter (route)
    const initialType = typeFilter === 'all' ? 'email' : typeFilter;
    setContactForm({ ...defaultContactForm, type: initialType });
    setAddDialogOpen(true);
  };

  const openEditDialog = (contact: Contact) => {
    setEditingContactId(contact.id);
    setContactForm({
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      phone: contact.phone || '',
      address: contact.address || '',
      city: contact.city || '',
      state: contact.state || '',
      postalCode: contact.postalCode || '',
      country: contact.country || '',
      company: contact.company || '',
      title: contact.title || '',
      industry: contact.industry || '',
      companySize: contact.companySize || '',
      companySizeSelection: contact.companySizeSelection || '',
      annualRevenue: contact.annualRevenue || '',
      website: contact.website || '',
      linkedin: contact.linkedin || '',
      twitter: contact.twitter || '',
      additionalDetails: contact.additionalDetails || '',
      birthday: contact.birthday || '',
      leadSource: contact.leadSource || '',
      notes: contact.notes || '',
      tags: contact.tags?.map((tag) => tag.name).join(', ') || '',
      type: contact.type || 'email',
      campaignId: contact.campaignId || '',
    });
    setEditDialogOpen(true);
  };

  const closeDialogs = () => {
    setAddDialogOpen(false);
    setEditDialogOpen(false);
    setEditingContactId(null);
  };

  const handleFormChange = (field: keyof ContactFormState, value: string) => {
    setContactForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = () => {
    const payload: Partial<Contact> & { tags?: Tag[] } = {
      firstName: contactForm.firstName,
      lastName: contactForm.lastName,
      email: contactForm.email,
      phone: contactForm.phone,
      address: contactForm.address,
      city: contactForm.city,
      state: contactForm.state,
      postalCode: contactForm.postalCode,
      country: contactForm.country,
      company: contactForm.company,
      title: contactForm.title,
      industry: contactForm.industry,
      companySize: contactForm.companySize,
      companySizeSelection: contactForm.companySizeSelection,
      annualRevenue: contactForm.annualRevenue,
      website: contactForm.website,
      linkedin: contactForm.linkedin,
      twitter: contactForm.twitter,
      additionalDetails: contactForm.additionalDetails,
      birthday: contactForm.birthday,
      leadSource: contactForm.leadSource,
      notes: contactForm.notes,
      type: contactForm.type,
      campaignId: contactForm.campaignId || undefined,
    };

    if (contactForm.tags) {
      payload.tags = contactForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((name) => ({ id: name, name, color: '#3b82f6' }));
    }

    return payload;
  };

  const handleCreateContact = async () => {
    try {
      await api.createContact(buildPayload());
      toast({ title: 'Contact created' });
      closeDialogs();
      loadContacts();
    } catch (error) {
      console.error('Failed to create contact', error);
      toast({ title: 'Failed to create contact', variant: 'destructive' });
    }
  };

  const handleUpdateContact = async () => {
    if (!editingContactId) return;
    try {
      await api.updateContact(editingContactId, buildPayload());
      toast({ title: 'Contact updated' });
      closeDialogs();
      loadContacts();
    } catch (error) {
      console.error('Failed to update contact', error);
      toast({ title: 'Failed to update contact', variant: 'destructive' });
    }
  };

  // Inline editing handlers
  const startInlineEdit = (contactId: string, field: string, currentValue: any) => {
    setEditingCell({ contactId, field });
    setEditingValue(currentValue?.toString() || '');
  };

  const cancelInlineEdit = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const saveInlineEdit = async () => {
    if (!editingCell) return;

    const { contactId, field } = editingCell;
    try {
      await api.updateContact(contactId, { [field]: editingValue });

      // Update local state
      setContacts(prev => prev.map(c =>
        c.id === contactId ? { ...c, [field]: editingValue } : c
      ));

      toast({ title: 'Contact updated', description: 'Changes saved successfully' });
      cancelInlineEdit();
    } catch (error) {
      console.error('Failed to update contact', error);
      toast({ title: 'Failed to update contact', variant: 'destructive' });
    }
  };



  const handleCreateCompany = () => {
    if (!companyForm.name?.trim()) {
      toast({ title: 'Company name is required', variant: 'destructive' });
      return;
    }
    createCompanyMutation.mutate(companyForm);
  };

  const handleUpdateCompany = () => {
    if (!editingCompany || !companyForm.name?.trim()) return;
    updateCompanyMutation.mutate({ id: editingCompany.id, data: companyForm });
  };

  const openEditCompanyDialog = (company: Company) => {
    setEditingCompany(company);
    setCompanyForm({
      ...defaultCompanyForm,
      ...company
    });
    setCompanyDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contact?')) return;
    deleteContactMutation.mutate(id);
  };

  const handleBulkDelete = async () => {
    if (!selectedContacts.length) return;
    if (!confirm(`Delete ${selectedContacts.length} selected contacts?`)) return;
    try {
      await Promise.all(selectedContacts.map((id) => api.deleteContact(id)));
      toast({ title: 'Contacts deleted' });
      setSelectedContacts([]);
      loadContacts();
    } catch (error) {
      console.error('Bulk delete failed', error);
      toast({ title: 'Bulk delete failed', variant: 'destructive' });
    }
  };

  const openCampaignDialog = (ids: string[]) => {
    setSelectedContacts(ids);
    setCampaignDialogOpen(true);
  };

  const openAddToPipelineDialog = (contact: Contact) => {
    setSelectedContactForPipeline(contact);
    setPipelineForm({
      title: `${contact.firstName} ${contact.lastName} Deal`,
      value: '',
      stage: 'lead',
    });
    setAddToPipelineOpen(true);
  };

  const handleAddToCampaign = async () => {
    if (!campaignSelection) {
      toast({ title: 'Select a campaign', variant: 'destructive' });
      return;
    }
    try {
      await api.bulkActionContacts({
        action: 'add_to_campaign',
        contact_ids: selectedContacts,
        campaign_id: campaignSelection,
      });
      toast({ title: 'Contacts added to campaign' });
      setCampaignDialogOpen(false);
      setCampaignSelection('');
      setSelectedContacts([]);
      loadContacts();
    } catch (error) {
      console.error('Failed to add to campaign', error);
      toast({ title: 'Failed to add contacts', variant: 'destructive' });
    }
  };



  const handleCreateDeal = async () => {
    if (!selectedContactForPipeline) return;

    try {
      // Create Opportunity
      await api.post('/opportunities', {
        contact_id: selectedContactForPipeline.id,
        name: pipelineForm.title,
        value: parseFloat(pipelineForm.value) || 0,
        currency: 'USD',
      });

      // Update Contact Stage
      await api.updateContact(selectedContactForPipeline.id, { stage: 'opportunity' });

      // Update local state
      setContacts((prev: any) => prev.map((c: any) =>
        c.id === selectedContactForPipeline.id ? { ...c, stage: 'opportunity' } : c
      ));

      toast({ title: 'Deal created', description: 'Deal created and contact moved to Opportunity stage' });
      setAddToPipelineOpen(false);
      setSelectedContactForPipeline(null);
    } catch (error) {
      console.error('Failed to create deal', error);
      toast({ title: 'Failed to create deal', variant: 'destructive' });
    }
  };

  const openAddToListDialog = (contactIds: string[]) => {
    setSelectedContactsForList(contactIds);
    setAddToListDialogOpen(true);
  };

  const handleAddToList = async () => {
    if (selectedContactsForList.length === 0) {
      toast({ title: 'No contacts selected', variant: 'destructive' });
      return;
    }

    if (createNewList) {
      if (!newListNameForContacts.trim()) {
        toast({ title: 'Please enter a list name', variant: 'destructive' });
        return;
      }

      try {
        const response = await createListMutation.mutateAsync({
          name: newListNameForContacts,
          color: '#3b82f6',
          icon: 'users',
          isFolder: false,
          campaignType: null,
        });

        const newListId = response.id;
        addContactsToListMutation.mutate({ listId: newListId, contactIds: selectedContactsForList });
      } catch (error) {
        console.error('Failed to create list:', error);
      }
    } else {
      if (!targetListId) {
        toast({ title: 'Please select a target list', variant: 'destructive' });
        return;
      }
      addContactsToListMutation.mutate({ listId: targetListId, contactIds: selectedContactsForList });
    }
  };


  const handleSendEmail = (contact: Contact) => {
    if (!contact.email) {
      toast({ title: 'Email unavailable', description: 'Add an email to this contact first.', variant: 'destructive' });
      return;
    }
    navigate('/reach/inbound/email/replies', { state: { composeTo: contact.email } });
  };

  const handleSendSMS = (contact: Contact) => {
    if (!contact.phone) {
      toast({ title: 'Phone unavailable', description: 'Add a phone number to this contact first.', variant: 'destructive' });
      return;
    }
    navigate('/reach/inbound/sms/replies', { state: { composeTo: contact.phone } });
  };

  const handleCall = (contact: Contact) => {
    if (!contact.phone) {
      toast({ title: 'Phone unavailable', description: 'Add a phone number to this contact first.', variant: 'destructive' });
      return;
    }
    // Use softphone to initiate the call
    requestSoftphoneCall({
      number: contact.phone,
      recipientName: `${contact.firstName} ${contact.lastName}`.trim() || contact.phone,
      source: 'dialer',
      metadata: { contactId: contact.id }
    });
    toast({
      title: 'Opening Softphone',
      description: 'The softphone will open with this contact\'s number ready to dial.'
    });
  };

  const handleLaunchCampaign = (
    channel: 'email' | 'sms' | 'call',
    contactIds?: string[],
    options?: { mode?: 'new' | 'list' },
  ) => {
    const mode = options?.mode ?? 'new';
    const route = channel === 'sms'
      ? mode === 'list' ? '/reach/outbound/sms/campaigns' : '/reach/outbound/sms/campaigns/new'
      : channel === 'call'
        ? mode === 'list' ? '/reach/outbound/calls/campaigns' : '/reach/outbound/calls/campaigns/new'
        : mode === 'list' ? '/reach/outbound/email/campaigns' : '/reach/outbound/email/campaigns/new';

    navigate(route, {
      state: contactIds?.length && mode === 'new'
        ? { fromContacts: true, contactIds }
        : { fromContacts: true },
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(currentViewData.map((contact) => contact.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const toggleSelectContact = (id: string, checked: boolean) => {
    setSelectedContacts((prev) =>
      checked ? [...prev, id] : prev.filter((contactId) => contactId !== id),
    );
  };

  const toggleColumnVisibility = (key: ContactColumnKey, checked: boolean) => {
    if (REQUIRED_COLUMNS.includes(key)) return;
    setColumnVisibility((prev) => ({ ...prev, [key]: checked }));
  };

  const handleBulkAddTag = async () => {
    if (!selectedContacts.length) {
      toast({ title: 'Select contacts first', variant: 'destructive' });
      return;
    }
    const tag = window.prompt('Enter tag to add');
    if (!tag) return;
    try {
      await api.bulkActionContacts({ action: 'add_tag', contact_ids: selectedContacts, tag });
      toast({ title: 'Tag added' });
      loadContacts();
    } catch (error) {
      console.error('Failed to add tag', error);
      toast({ title: 'Failed to add tag', variant: 'destructive' });
    }
  };

  const handleBulkRemoveTag = async () => {
    if (!selectedContacts.length) {
      toast({ title: 'Select contacts first', variant: 'destructive' });
      return;
    }
    const tag = window.prompt('Enter tag to remove');
    if (!tag) return;
    try {
      await api.bulkActionContacts({ action: 'remove_tag', contact_ids: selectedContacts, tag });
      toast({ title: 'Tag removed' });
      loadContacts();
    } catch (error) {
      console.error('Failed to remove tag', error);
      toast({ title: 'Failed to remove tag', variant: 'destructive' });
    }
  };

  // Duplicate detection handlers
  const handleFindDuplicates = async () => {
    setIsLoadingDuplicates(true);
    setDuplicateDialogOpen(true);
    try {
      const result = await api.findDuplicateContacts(duplicateCriteria);
      setDuplicates(result.duplicates);
      setDuplicateSummary(result.summary);
    } catch (error) {
      console.error('Failed to find duplicates', error);
      toast({ title: 'Failed to find duplicates', variant: 'destructive' });
    } finally {
      setIsLoadingDuplicates(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    if (!duplicateSummary || duplicateSummary.removableCount === 0) return;

    const confirmMsg = `This will remove ${duplicateSummary.removableCount} duplicate contacts, keeping the ${keepStrategy} one from each group. Continue?`;
    if (!confirm(confirmMsg)) return;

    try {
      const result = await api.removeDuplicateContacts({
        keepStrategy,
        keepIds: keepStrategy === 'specific' ? selectedKeepIds : undefined,
        criteria: duplicateCriteria,
      });
      toast({ title: 'Duplicates removed', description: result.message });
      setDuplicateDialogOpen(false);
      setDuplicates([]);
      setDuplicateSummary(null);
      loadContacts();
    } catch (error) {
      console.error('Failed to remove duplicates', error);
      toast({ title: 'Failed to remove duplicates', variant: 'destructive' });
    }
  };

  const handleMergeDuplicates = async (contactIds: string[], primaryId: string) => {
    if (contactIds.length < 2) return;

    try {
      const result = await api.mergeDuplicateContacts({ contactIds, primaryId });
      toast({ title: 'Contacts merged', description: result.message });
      // Refresh duplicates list
      handleFindDuplicates();
      loadContacts();
    } catch (error) {
      console.error('Failed to merge contacts', error);
      toast({ title: 'Failed to merge contacts', variant: 'destructive' });
    }
  };

  const closeDuplicateDialog = () => {
    setDuplicateDialogOpen(false);
    setDuplicates([]);
    setDuplicateSummary(null);
    setSelectedDuplicateGroup(null);
    setSelectedKeepIds([]);
  };

  const handleExport = () => {
    // DEBUG: Log undefined variables to confirm diagnosis
    console.log('DEBUG - filteredContacts:', typeof filteredContacts, filteredContacts);

    const dataToExport = selectedContacts.length > 0
      ? contacts.filter(c => selectedContacts.includes(c.id))
      : filteredContacts;

    if (!dataToExport.length) {
      toast({ title: 'No contacts to export', variant: 'destructive' });
      return;
    }

    const headers = [
      'First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Title',
      'Address', 'City', 'State', 'Postal Code', 'Country', 'Website',
      'Stage', 'Status', 'Notes'
    ];

    const keys = [
      'firstName', 'lastName', 'email', 'phone', 'company', 'title',
      'address', 'city', 'state', 'postalCode', 'country', 'website',
      'stage', 'status', 'notes'
    ];

    const csvContent = [
      headers.join(','),
      ...dataToExport.map(contact => keys.map(key => {
        const value = contact[key as keyof Contact] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(0);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

        const contactsToCreate: Partial<Contact>[] = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          // Simple CSV parsing (this is basic and might fail on complex CSVs with commas inside quotes)
          // For a robust solution, a library like PapaParse is recommended, but we are keeping it dependency-free here.
          const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.trim().replace(/^"|"$/g, ''));

          const contact: any = {};

          // Map known headers to contact fields
          headers.forEach((header, index) => {
            if (index >= values.length) return;
            const value = values[index];

            if (header.includes('first') && header.includes('name')) contact.firstName = value;
            else if (header.includes('last') && header.includes('name')) contact.lastName = value;
            else if (header === 'email') contact.email = value;
            else if (header === 'phone') contact.phone = value;
            else if (header === 'company') contact.company = value;
            else if (header === 'title') contact.title = value;
            else if (header === 'address') contact.address = value;
            else if (header === 'city') contact.city = value;
            else if (header === 'state') contact.state = value;
            else if (header.includes('zip') || header.includes('postal')) contact.postalCode = value;
            else if (header === 'country') contact.country = value;
            else if (header === 'website') contact.website = value;
            else if (header === 'notes') contact.notes = value;
            else if (header === 'judgement') contact.notes = (contact.notes ? contact.notes + '\n' : '') + 'Judgement: ' + value; // Custom mapping example
          });

          if (contact.email || contact.phone || (contact.firstName && contact.lastName)) {
            contactsToCreate.push(contact);
          }
        }

        // Process in batches
        let processed = 0;
        const total = contactsToCreate.length;

        for (const contact of contactsToCreate) {
          try {
            // We use individual create calls as we don't have a bulk create endpoint yet
            await api.createContact(contact);
          } catch (err) {
            console.error('Failed to import contact', contact, err);
          }
          processed++;
          setImportProgress(Math.round((processed / total) * 100));
        }

        toast({ title: 'Import complete', description: `Successfully imported ${processed} contacts.` });
        setImportDialogOpen(false);
        loadContacts();

      } catch (error) {
        console.error('Import failed', error);
        toast({ title: 'Import failed', description: 'Could not parse the CSV file.', variant: 'destructive' });
      } finally {
        setIsImporting(false);
        setImportProgress(0);
      }
    };
    reader.readAsText(file);
  };


  // Contact form fields rendered inline to prevent focus loss on re-render
  const contactFormFields = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" value={contactForm.firstName} onChange={(e) => handleFormChange('firstName', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" value={contactForm.lastName} onChange={(e) => handleFormChange('lastName', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={contactForm.email} onChange={(e) => handleFormChange('email', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={contactForm.phone} onChange={(e) => handleFormChange('phone', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Input id="address" value={contactForm.address} onChange={(e) => handleFormChange('address', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" value={contactForm.city} onChange={(e) => handleFormChange('city', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="state">State/Province</Label>
          <Input id="state" value={contactForm.state} onChange={(e) => handleFormChange('state', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input id="postalCode" value={contactForm.postalCode} onChange={(e) => handleFormChange('postalCode', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input id="country" value={contactForm.country} onChange={(e) => handleFormChange('country', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="company">Company</Label>
          <Input id="company" value={contactForm.company} onChange={(e) => handleFormChange('company', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={contactForm.title} onChange={(e) => handleFormChange('title', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="industry">Industry</Label>
          <Input id="industry" value={contactForm.industry} onChange={(e) => handleFormChange('industry', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="companySize">Company Size</Label>
          <Input id="companySize" value={contactForm.companySize} onChange={(e) => handleFormChange('companySize', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="companySizeSelection">Select Company Size</Label>
          <Select value={contactForm.companySizeSelection} onValueChange={(value) => handleFormChange('companySizeSelection', value)}>
            <SelectTrigger id="companySizeSelection">
              <SelectValue placeholder="Select a range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">1-10</SelectItem>
              <SelectItem value="11-50">11-50</SelectItem>
              <SelectItem value="51-200">51-200</SelectItem>
              <SelectItem value="200+">200+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="annualRevenue">Annual Revenue</Label>
          <Input id="annualRevenue" value={contactForm.annualRevenue} onChange={(e) => handleFormChange('annualRevenue', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="website">Website</Label>
          <Input id="website" value={contactForm.website} onChange={(e) => handleFormChange('website', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="linkedin">LinkedIn</Label>
          <Input id="linkedin" value={contactForm.linkedin} onChange={(e) => handleFormChange('linkedin', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="twitter">Twitter</Label>
          <Input id="twitter" value={contactForm.twitter} onChange={(e) => handleFormChange('twitter', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="birthday">Birthday</Label>
          <Input id="birthday" type="date" value={contactForm.birthday} onChange={(e) => handleFormChange('birthday', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="leadSource">Lead Source</Label>
          <Input id="leadSource" value={contactForm.leadSource} onChange={(e) => handleFormChange('leadSource', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input id="tags" value={contactForm.tags} onChange={(e) => handleFormChange('tags', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="campaignId">Campaign (optional)</Label>
          <Select
            value={contactForm.campaignId || '__none'}
            onValueChange={(value) => handleFormChange('campaignId', value === '__none' ? '' : value)}
          >
            <SelectTrigger id="campaignId">
              <SelectValue placeholder="Attach campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">No campaign</SelectItem>
              {campaigns.filter((campaign) => campaign.id).map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="contactType">Contact Type</Label>
          <Select value={contactForm.type} onValueChange={(value) => handleFormChange('type', value as 'email' | 'sms' | 'call')}>
            <SelectTrigger id="contactType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="call">Call</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} value={contactForm.notes} onChange={(e) => handleFormChange('notes', e.target.value)} />
      </div>
      <div>
        <Label htmlFor="additionalDetails">Additional Details</Label>
        <Textarea id="additionalDetails" rows={3} value={contactForm.additionalDetails} onChange={(e) => handleFormChange('additionalDetails', e.target.value)} />
      </div>
    </div>
  );

  const companyFormFields = (
    <div className="grid gap-4 py-4">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="comp-name">Company Name *</Label>
          <Input
            id="comp-name"
            value={companyForm.name || ''}
            onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
            placeholder="Acme Inc."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="comp-domain">Domain</Label>
          <Input
            id="comp-domain"
            value={companyForm.domain || ''}
            onChange={(e) => setCompanyForm({ ...companyForm, domain: e.target.value })}
            placeholder="acme.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="comp-industry">Industry</Label>
          <Select
            value={companyForm.industry || ''}
            onValueChange={(value) => setCompanyForm({ ...companyForm, industry: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="comp-size">Company Size</Label>
          <Select
            value={companyForm.size || ''}
            onValueChange={(value) => setCompanyForm({ ...companyForm, size: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZES.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="comp-status">Status</Label>
          <Select
            value={companyForm.status || 'active'}
            onValueChange={(value) => setCompanyForm({ ...companyForm, status: value as Company['status'] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="comp-revenue">Annual Revenue</Label>
          <Input
            id="comp-revenue"
            value={companyForm.annualRevenue || ''}
            onChange={(e) => setCompanyForm({ ...companyForm, annualRevenue: e.target.value })}
            placeholder="$1M - $10M"
          />
        </div>
      </div>

      {/* Contact Info */}
      <div className="border-t pt-4 mt-2">
        <h4 className="font-medium mb-3">Contact Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="comp-email">Email</Label>
            <Input
              id="comp-email"
              type="email"
              value={companyForm.email || ''}
              onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
              placeholder="contact@acme.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comp-phone">Phone</Label>
            <Input
              id="comp-phone"
              value={companyForm.phone || ''}
              onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <Label htmlFor="comp-website">Website</Label>
          <Input
            id="comp-website"
            value={companyForm.website || ''}
            onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
            placeholder="https://acme.com"
          />
        </div>
      </div>

      {/* Address */}
      <div className="border-t pt-4 mt-2">
        <h4 className="font-medium mb-3">Address</h4>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comp-address">Street Address</Label>
            <Input
              id="comp-address"
              value={companyForm.address || ''}
              onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
              placeholder="123 Main St"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="comp-city">City</Label>
              <Input
                id="comp-city"
                value={companyForm.city || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                placeholder="San Francisco"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comp-state">State/Province</Label>
              <Input
                id="comp-state"
                value={companyForm.state || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                placeholder="CA"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="comp-country">Country</Label>
              <Input
                id="comp-country"
                value={companyForm.country || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })}
                placeholder="United States"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comp-postal">Postal Code</Label>
              <Input
                id="comp-postal"
                value={companyForm.postalCode || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, postalCode: e.target.value })}
                placeholder="94105"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>

      <SEO
        title={typeFilter === 'email' ? 'Email Contacts' :
          typeFilter === 'sms' ? 'SMS Contacts' :
            typeFilter === 'call' ? 'Call Contacts' :
              'All Contacts'}
        description="Manage your contacts, filter by outreach channel, and organize your CRM data for effective outreach."
      />
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[18px] font-bold tracking-tight">
              {typeFilter === 'email' ? 'Email Contacts' :
                typeFilter === 'sms' ? 'SMS Contacts' :
                  typeFilter === 'call' ? 'Call Contacts' :
                    'Contacts'}
            </h1>
            <p className="text-muted-foreground">
              {typeFilter === 'email' ? 'Manage your email contacts and recipients.' :
                typeFilter === 'sms' ? 'Manage your SMS contacts and recipients.' :
                  typeFilter === 'call' ? 'Manage your call contacts and recipients.' :
                    'Manage prospects, leads, and clients.'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Tabs value={viewMode} onValueChange={(v) => {
              const mode = v as 'people' | 'companies';
              setViewMode(mode);
              navigate(mode === 'companies' ? '?view=companies' : '?view=people');
            }}>
              <TabsList>
                <TabsTrigger value="people">People</TabsTrigger>
                <TabsTrigger value="companies">Companies</TabsTrigger>
              </TabsList>
            </Tabs>

            <PermissionGuard permission={PERMISSION_KEYS.CONTACTS_CREATE}>
              {viewMode === 'companies' ? (
                <Button onClick={() => {
                  setEditingCompany(null);
                  setCompanyForm(defaultCompanyForm);
                  setCompanyDialogOpen(true);
                }}>
                  <Building2 className="mr-2 h-4 w-4" /> New Company
                </Button>
              ) : (
                <Button onClick={openAddDialog}>
                  <UserPlus className="mr-2 h-4 w-4" /> New Contact
                </Button>
              )}
            </PermissionGuard>
          </div>
        </div>

        {viewMode === 'companies' ? (
          <></> // No specific stats for companies yet
        ) : (
          /* Existing Contacts View Content */
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 stats-grid-spacing">

            {/* Show contextual cards based on current filter */}
            {typeFilter === 'all' && [
              { label: 'Total Contacts', value: contacts.length, icon: Users },
              { label: 'Email Contacts', value: contacts.filter((c) => c.type === 'email').length, icon: Mail, cta: { label: 'Launch Email Campaign', channel: 'email' as const, mode: 'new' as const } },
              { label: 'SMS Contacts', value: contacts.filter((c) => c.type === 'sms').length, icon: MessageSquare, cta: { label: 'Launch SMS Campaign', channel: 'sms' as const, mode: 'new' as const } },
              { label: 'Call Contacts', value: contacts.filter((c) => c.type === 'call').length, icon: Phone, cta: { label: 'Launch Call Campaign', channel: 'call' as const, mode: 'new' as const } },
            ].map((stat) => (
              <Card key={stat.label} className="border-analytics">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-[18px] font-bold">{stat.value.toLocaleString()}</p>
                  {stat.cta && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                      onClick={() => handleLaunchCampaign(stat.cta.channel, undefined, { mode: stat.cta.mode })}
                    >
                      {stat.cta.label}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Email-specific cards */}
            {typeFilter === 'email' && [
              // DEBUG: Log undefined variables to confirm diagnosis
              console.log('DEBUG - filteredContacts in email stats:', typeof filteredContacts, filteredContacts),
              { label: 'Total Email Contacts', value: filteredContacts.length, icon: Mail },
              { label: 'Active Campaigns', value: campaigns.length, icon: Send, cta: { label: 'View Campaigns', channel: 'email' as const, mode: 'list' as const } },
              { label: 'Sent Emails', value: contacts.filter((c) => c.type === 'email' && c.status === 'sent').length, icon: CheckCircle },
              { label: 'Opened', value: contacts.filter((c) => c.type === 'email' && c.status === 'opened').length, icon: Mail, cta: { label: 'Launch Email Campaign', channel: 'email' as const, mode: 'new' as const } },
            ].map((stat) => (
              <Card key={stat.label} className="border-analytics">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-[18px] font-bold">{stat.value.toLocaleString()}</p>
                  {stat.cta && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                      onClick={() => handleLaunchCampaign(stat.cta.channel, undefined, { mode: stat.cta.mode })}
                    >
                      {stat.cta.label}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* SMS-specific cards */}
            {typeFilter === 'sms' && [
              // DEBUG: Log undefined variables to confirm diagnosis
              console.log('DEBUG - filteredContacts in sms stats:', typeof filteredContacts, filteredContacts),
              { label: 'Total SMS Contacts', value: filteredContacts.length, icon: MessageSquare },
              { label: 'Active Campaigns', value: campaigns.length, icon: Send, cta: { label: 'View Campaigns', channel: 'sms' as const, mode: 'list' as const } },
              { label: 'Messages Sent', value: contacts.filter((c) => c.type === 'sms' && c.status === 'sent').length, icon: CheckCircle },
              { label: 'Opted Out', value: contacts.filter((c) => c.type === 'sms' && c.status === 'opted_out').length, icon: MessageSquare, cta: { label: 'Launch SMS Campaign', channel: 'sms' as const, mode: 'new' as const } },
            ].map((stat) => (
              <Card key={stat.label} className="border-analytics">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-[18px] font-bold">{stat.value.toLocaleString()}</p>
                  {stat.cta && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                      onClick={() => handleLaunchCampaign(stat.cta.channel, undefined, { mode: stat.cta.mode })}
                    >
                      {stat.cta.label}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="border-analytics card-spacing">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" /> Contact Filters
            </CardTitle>
            {viewMode === 'people' && (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleFindDuplicates}>
                  <Copy className="mr-2 h-4 w-4" /> Find Duplicates
                </Button>
                <Button size="sm" onClick={() => setImportDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" /> Import
                </Button>
                <Button size="sm" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
                {selectedContacts.length > 0 && (
                  <>
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedContacts.length})
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Bulk Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Launch Campaign</DropdownMenuLabel>
                        {(typeFilter === 'all' || typeFilter === 'email') && (
                          <DropdownMenuItem onClick={() => handleLaunchCampaign('email', selectedContacts)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Email Campaign
                          </DropdownMenuItem>
                        )}
                        {(typeFilter === 'all' || typeFilter === 'sms') && (
                          <DropdownMenuItem onClick={() => handleLaunchCampaign('sms', selectedContacts)}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            SMS Campaign
                          </DropdownMenuItem>
                        )}
                        {(typeFilter === 'all' || typeFilter === 'call') && (
                          <DropdownMenuItem onClick={() => handleLaunchCampaign('call', selectedContacts)}>
                            <Phone className="mr-2 h-4 w-4" />
                            Call Campaign
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openCampaignDialog(selectedContacts)}>
                          Add to Campaign
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleBulkAddTag}>
                          Add Tag
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleBulkRemoveTag}>
                          Remove Tag
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={handleBulkDelete}>
                          Delete Selected
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 flex-1 w-full">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    className="pl-9 w-full"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {viewMode === 'companies' ? (
                      COMPANY_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)
                    ) : (
                      <>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="invalid">Invalid</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <Select value={campaignFilter} onValueChange={(value) => setCampaignFilter(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Campaigns</SelectItem>
                    {campaigns.filter((campaign) => campaign.id).map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={tagFilter} onValueChange={(value) => setTagFilter(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {tags.filter((tag) => tag.id).map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Columns3 className="mr-2 h-4 w-4" /> Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="max-h-72 w-64 overflow-auto">
                    {viewMode === 'people' ? ALL_COLUMN_KEYS.map((key) => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        checked={columnVisibility[key]}
                        onCheckedChange={(checked) => toggleColumnVisibility(key, Boolean(checked))}
                        disabled={REQUIRED_COLUMNS.includes(key)}
                        className="capitalize"
                      >
                        {key}
                      </DropdownMenuCheckboxItem>
                    ))
                      :
                      ALL_COMPANY_VIEW_COLUMN_KEYS.map((key) => (
                        <DropdownMenuCheckboxItem
                          key={key}
                          checked={companyColumnVisibility[key]}
                          onCheckedChange={(checked) => toggleCompanyColumnVisibility(key, Boolean(checked))}
                          className="capitalize"
                        >
                          {key === 'contactName' ? 'Contact Name' : key}
                        </DropdownMenuCheckboxItem>
                      ))
                    }
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" onClick={() => setShowAdvancedFilters((prev) => !prev)}>
                  <Filter className="mr-2 h-4 w-4" /> {showAdvancedFilters ? 'Hide' : 'Show'} advanced filters
                </Button>
              </div>
            </div>

            {/* Only show tabs on main contacts page, not on channel-specific pages */}
            {location.pathname === '/contacts' && (
              <Tabs value={typeFilter} onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}>
                <TabsList className="grid grid-cols-4 bg-muted">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="email">Email</TabsTrigger>
                  <TabsTrigger value="sms">SMS</TabsTrigger>
                  <TabsTrigger value="call">Call</TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {showAdvancedFilters && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label>Company</Label>
                  <Input
                    value={advancedFilters.company}
                    onChange={(e) => setAdvancedFilters((prev) => ({ ...prev, company: e.target.value }))}
                    placeholder="Acme Inc"
                  />
                </div>
                <div>
                  <Label>Industry</Label>
                  <Input
                    value={advancedFilters.industry}
                    onChange={(e) => setAdvancedFilters((prev) => ({ ...prev, industry: e.target.value }))}
                    placeholder="SaaS"
                  />
                </div>
                <div>
                  <Label>Technology</Label>
                  <Input
                    value={advancedFilters.technology}
                    onChange={(e) => setAdvancedFilters((prev) => ({ ...prev, technology: e.target.value }))}
                    placeholder="Salesforce"
                  />
                </div>
                <div>
                  <Label>Lead Source</Label>
                  <Input
                    value={advancedFilters.leadSource}
                    onChange={(e) => setAdvancedFilters((prev) => ({ ...prev, leadSource: e.target.value }))}
                    placeholder="Webinar"
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={advancedFilters.location}
                    onChange={(e) => setAdvancedFilters((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="Austin, TX"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-analytics card-spacing">
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <PersistentResizableTable
                tableKey={viewMode === 'companies' ? 'companies-view-table' : 'contacts-table'}
                defaultColumnWidths={viewMode === 'companies' ? defaultCompanyViewColumnWidths : defaultColumnWidths}
              >
                <PersistentResizableTableHeader>
                  <PersistentResizableTableRow>
                    <PersistentResizableTableHead columnKey="select" initialWidth={48} resizable={false}>
                      <Checkbox
                        checked={currentViewData.length > 0 && selectedContacts.length === currentViewData.length}
                        onCheckedChange={(checked) => toggleSelectAll(Boolean(checked))}
                        aria-label="Select all"
                      />
                    </PersistentResizableTableHead>

                    {viewMode === 'companies' ? activeCompanyColumns.map((column) => (
                      <PersistentResizableTableHead
                        key={column.key}
                        columnKey={column.key}
                        initialWidth={column.defaultWidth}
                        onClick={() => column.sortable && handleSort(column.key)}
                        className={cn(column.sortable && 'cursor-pointer select-none')}
                      >
                        {column.label}
                      </PersistentResizableTableHead>
                    )) : visibleColumns.map((column) => (
                      <PersistentResizableTableHead
                        key={column.key}
                        columnKey={column.key}
                        initialWidth={column.defaultWidth}
                        onClick={() => column.sortable && handleSort(column.key as keyof Contact)}
                        className={cn(column.sortable && 'cursor-pointer select-none')}
                      >
                        {column.label}
                      </PersistentResizableTableHead>
                    ))}
                  </PersistentResizableTableRow>
                </PersistentResizableTableHeader>
                <PersistentResizableTableBody>
                  {isLoading && (
                    <PersistentResizableTableRow>
                      <PersistentResizableTableCell columnKey="loading" colSpan={(viewMode === 'companies' ? activeCompanyColumns.length : visibleColumns.length) + 1}>
                        <div className="py-10 text-center text-muted-foreground">Loading {viewMode}...</div>
                      </PersistentResizableTableCell>
                    </PersistentResizableTableRow>
                  )}
                  {!isLoading && currentViewData.length === 0 && (
                    <PersistentResizableTableRow>
                      <PersistentResizableTableCell columnKey="empty" colSpan={(viewMode === 'companies' ? activeCompanyColumns.length : visibleColumns.length) + 1}>
                        <div className="py-10 text-center text-muted-foreground">
                          No {viewMode} match your filters.
                        </div>
                      </PersistentResizableTableCell>
                    </PersistentResizableTableRow>
                  )}

                  {/* Unified Row Rendering using Contact data for BOTH views */}
                  {currentViewData.map((contact: any) => (
                    <PersistentResizableTableRow key={contact.id} data-state={selectedContacts.includes(contact.id) ? 'selected' : undefined} className="group">
                      <PersistentResizableTableCell columnKey="select">
                        <Checkbox
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={(checked) => toggleSelectContact(contact.id, Boolean(checked))}
                          aria-label="Select contact"
                        />
                      </PersistentResizableTableCell>

                      {viewMode === 'companies' ? (
                        // Companies View Columns
                        activeCompanyColumns.map((column) => (
                          <PersistentResizableTableCell key={column.key} columnKey={column.key}>
                            {column.key === 'company' && (
                              <div className="font-medium">
                                {contact.company || <span className="text-muted-foreground italic">No Company</span>}
                              </div>
                            )}
                            {column.key === 'contactName' && (
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                                  {contact.firstName?.[0]}{contact.lastName?.[0]}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{contact.firstName} {contact.lastName}</span>
                                </div>
                              </div>
                            )}
                            {column.key === 'title' && contact.title}
                            {column.key === 'email' && contact.email}
                            {column.key === 'phone' && contact.phone}
                            {column.key === 'leadSource' && contact.leadSource}
                            {column.key === 'status' && <StageEditor contact={contact} />}

                            {column.key === 'actions' && (
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => {
                                  setEditingContactId(contact.id);
                                  setContactForm(contact);
                                  setEditDialogOpen(true);
                                }}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(contact.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </PersistentResizableTableCell>
                        ))
                      ) : (
                        // People View Columns (Existing)
                        visibleColumns.map((column) => (
                          <PersistentResizableTableCell key={column.key} columnKey={column.key}>
                            {column.render(contact)}
                          </PersistentResizableTableCell>
                        ))
                      )}
                    </PersistentResizableTableRow>
                  ))}

                </PersistentResizableTableBody>
              </PersistentResizableTable>
              <TableActions onResetWidths={() => localStorage.removeItem(viewMode === 'companies' ? 'table-widths-companies-view-table' : 'table-widths-contacts-table')} />
            </div>

            <div className="flex flex-col gap-2 border-t border-muted p-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <div>
                Showing <strong>{currentViewData.length}</strong> of <strong>{sortedData.length}</strong> {viewMode}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <div>
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
            <DialogDescription>Fill in every detail to track this contact across campaigns.</DialogDescription>
          </DialogHeader>
          {contactFormFields}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs}>
              Cancel
            </Button>
            <Button onClick={handleCreateContact}>Save Contact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>Update contact info, tags, and routing settings.</DialogDescription>
          </DialogHeader>
          {contactFormFields}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs}>
              Cancel
            </Button>
            <Button onClick={handleUpdateContact}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCampaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Campaign</DialogTitle>
            <DialogDescription>Select the campaign to attach these contacts to.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={campaignSelection} onValueChange={(value) => setCampaignSelection(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.filter((campaign) => campaign.id).map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCampaignDialogOpen(false);
                  setCampaignSelection(undefined);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddToCampaign} disabled={!campaignSelection || !selectedContacts.length}>
                Add {selectedContacts.length} contact(s)
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={(open) => !isImporting && setImportDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Contacts</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import contacts. The file should have headers like 'First Name', 'Last Name', 'Email', 'Phone', etc.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!isImporting ? (
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="csv_upload">CSV File</Label>
                <Input id="csv_upload" type="file" accept=".csv" onChange={handleImport} />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm font-medium">Importing contacts... {importProgress}%</div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${importProgress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground text-center">Please do not close this window.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)} disabled={isImporting}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Detection Dialog */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Duplicate Contacts
            </DialogTitle>
            <DialogDescription>
              Find and manage duplicate contacts based on email or phone number.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Criteria Selection */}
            <div className="flex items-center gap-4">
              <Label>Find duplicates by:</Label>
              <Select
                value={duplicateCriteria}
                onValueChange={(value: 'email' | 'phone' | 'both') => setDuplicateCriteria(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email Address</SelectItem>
                  <SelectItem value="phone">Phone Number</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleFindDuplicates} disabled={isLoadingDuplicates}>
                {isLoadingDuplicates ? 'Scanning...' : 'Scan for Duplicates'}
              </Button>
            </div>

            {/* Summary */}
            {duplicateSummary && (
              <Card className="border-yellow-500/50 bg-yellow-500/10">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-semibold">Duplicate Summary</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Duplicate Groups:</span>
                      <span className="ml-2 font-medium">{duplicateSummary.totalGroups}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Duplicates:</span>
                      <span className="ml-2 font-medium">{duplicateSummary.totalDuplicates}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Can Remove:</span>
                      <span className="ml-2 font-medium text-red-600">{duplicateSummary.removableCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Duplicates List */}
            {isLoadingDuplicates ? (
              <div className="py-8 text-center text-muted-foreground">
                Scanning for duplicates...
              </div>
            ) : duplicates.length === 0 && duplicateSummary ? (
              <div className="py-8 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No duplicate contacts found!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {duplicates.map((group, index) => (
                  <Card key={index} className={cn(
                    "cursor-pointer transition-colors",
                    selectedDuplicateGroup === index && "border-primary"
                  )} onClick={() => setSelectedDuplicateGroup(selectedDuplicateGroup === index ? null : index)}>
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {group.type === 'email_and_phone' ? 'Email & Phone' : group.type}
                          </Badge>
                          <span className="font-medium">{group.value}</span>
                          <Badge variant="secondary">{group.count} contacts</Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            const ids = group.contacts.map(c => c.id);
                            handleMergeDuplicates(ids, ids[0]);
                          }}
                        >
                          <Merge className="h-4 w-4 mr-1" />
                          Merge All
                        </Button>
                      </div>
                    </CardHeader>
                    {selectedDuplicateGroup === index && (
                      <CardContent className="pt-0">
                        <div className="border rounded-md overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted">
                              <tr>
                                <th className="px-3 py-2 text-left">Name</th>
                                <th className="px-3 py-2 text-left">Email</th>
                                <th className="px-3 py-2 text-left">Phone</th>
                                <th className="px-3 py-2 text-left">Created</th>
                                <th className="px-3 py-2 text-left">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.contacts.map((contact, cIndex) => (
                                <tr key={contact.id} className={cn(
                                  "border-t",
                                  cIndex === 0 && "bg-green-500/10"
                                )}>
                                  <td className="px-3 py-2">
                                    {contact.firstName} {contact.lastName}
                                    {cIndex === 0 && (
                                      <Badge variant="outline" className="ml-2 text-xs">Oldest</Badge>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">{contact.email || '—'}</td>
                                  <td className="px-3 py-2">{contact.phone || '—'}</td>
                                  <td className="px-3 py-2">
                                    {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : '—'}
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/contacts/${contact.id}`);
                                        }}
                                      >
                                        View
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-600"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelete(contact.id);
                                          handleFindDuplicates();
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {/* Bulk Remove Options */}
            {duplicateSummary && duplicateSummary.removableCount > 0 && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Bulk Remove Duplicates</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4">
                    <Label>Keep:</Label>
                    <Select
                      value={keepStrategy}
                      onValueChange={(value: 'oldest' | 'newest') => setKeepStrategy(value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oldest">Oldest Contact</SelectItem>
                        <SelectItem value="newest">Newest Contact</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="destructive"
                      onClick={handleRemoveDuplicates}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove {duplicateSummary.removableCount} Duplicates
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDuplicateDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddToPipelineOpen} onOpenChange={setAddToPipelineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Deal</DialogTitle>
            <DialogDescription>Create a new deal for {selectedContactForPipeline?.firstName} {selectedContactForPipeline?.lastName}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="deal-title">Deal Title</Label>
              <Input
                id="deal-title"
                value={pipelineForm.title}
                onChange={(e) => setPipelineForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Website Redesign"
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="deal-value">Value ($)</Label>
              <Input
                id="deal-value"
                type="number"
                value={pipelineForm.value}
                onChange={(e) => setPipelineForm(prev => ({ ...prev, value: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddToPipelineOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDeal}>Create Deal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCompanyDialogOpen} onOpenChange={setCompanyDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCompany ? 'Edit Company' : 'Add Company'}</DialogTitle>
            <DialogDescription>
              {editingCompany ? 'Update company details.' : 'Add a new company/organization.'}
            </DialogDescription>
          </DialogHeader>
          {companyFormFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompanyDialogOpen(false)}>Cancel</Button>
            <Button onClick={editingCompany ? handleUpdateCompany : handleCreateCompany}>
              {editingCompany ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!companyDeleteConfirmId} onOpenChange={() => setCompanyDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this company? Contacts will be unlinked, not deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompanyDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => companyDeleteConfirmId && deleteCompanyMutation.mutate(companyDeleteConfirmId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to List Dialog */}
      <Dialog open={isAddToListDialogOpen} onOpenChange={setAddToListDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to List</DialogTitle>
            <DialogDescription>
              Add {selectedContactsForList.length} contact(s) to a list
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={createNewList}
                  onCheckedChange={(checked) => setCreateNewList(checked as boolean)}
                />
                <Label className="cursor-pointer">Create a new list</Label>
              </div>
            </div>

            {createNewList ? (
              <div className="space-y-2">
                <Label>New List Name</Label>
                <Input
                  placeholder="e.g., VIP Customers"
                  value={newListNameForContacts}
                  onChange={(e) => setNewListNameForContacts(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Select Existing List</Label>
                <Select
                  value={targetListId || ''}
                  onValueChange={setTargetListId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a list..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contactLists.filter(l => !l.isFolder).map(list => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddToListDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddToList}
              disabled={addContactsToListMutation.isPending || createListMutation.isPending}
            >
              {(addContactsToListMutation.isPending || createListMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Add to List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
};

export default Contacts;
