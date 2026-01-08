import React, { useState, useEffect } from 'react'; // Rebuild trigger
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActiveCompany, companyQueryKey } from '@/hooks/useActiveCompany';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { listingsApi, BusinessListing, Directory, ListingAudit, ListingDuplicate, ListingReview, ListingRankTracking, ListingRankHistory } from '@/services';
import { Plus, Globe, MapPin, Info, Loader2, ExternalLink, RefreshCw, CheckCircle, AlertCircle, Clock, Star, Search, Filter, ChevronLeft, ChevronRight, Edit, X, Upload, FileTextIcon, ListPlus, Trash2, Phone, ShieldAlert, ShieldCheck, AlertTriangle, MessageSquare, ThumbsUp, ThumbsDown, Reply, TrendingUp, TrendingDown, Minus, Zap, Check as LucideCheck, Link2, Briefcase, Settings2, Building2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ListingSettingsView } from '@/components/ListingSettings';
import { CitationAudit } from '@/components/CitationAudit';
import { GMBManagement } from '@/components/GMBManagement';
import SEO from '@/components/SEO';

interface FormField {
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea';
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  default?: any;
}

interface DirectoryFormRendererProps {
  schema: Record<string, FormField>;
  values: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const DirectoryFormRenderer: React.FC<DirectoryFormRendererProps> = ({
  schema,
  values,
  onChange,
  errors = {}
}) => {
  if (!schema || Object.keys(schema).length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        No additional fields required for this directory.
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      {Object.entries(schema).map(([key, field]) => {
        const fieldId = `field-${key}`;
        const error = errors[key];

        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={fieldId} className={field.required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>
                {typeof field.label === 'object' ? (field.label as any)?.title || JSON.stringify(field.label) : field.label}
              </Label>
            </div>

            {field.type === 'textarea' ? (
              <Textarea
                id={fieldId}
                placeholder={field.placeholder}
                value={values[key] || ''}
                onChange={(e) => onChange(key, e.target.value)}
                className={error ? "border-red-500" : ""}
              />
            ) : field.type === 'select' ? (
              <Select
                value={values[key] || ''}
                onValueChange={(value) => onChange(key, value)}
              >
                <SelectTrigger id={fieldId} className={error ? "border-red-500" : ""}>
                  <SelectValue placeholder={field.placeholder || "Select an option"} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === 'boolean' ? (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={fieldId}
                  checked={!!values[key]}
                  onCheckedChange={(checked) => onChange(key, !!checked)}
                />
                <Label htmlFor={fieldId} className="text-sm font-normal cursor-pointer">
                  {field.placeholder || field.label}
                </Label>
              </div>
            ) : (
              <Input
                id={fieldId}
                type={field.type === 'number' ? 'number' : 'text'}
                placeholder={field.placeholder}
                value={values[key] || ''}
                onChange={(e) => onChange(key, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                className={error ? "border-red-500" : ""}
              />
            )}

            {field.description && (
              <p className="text-[0.8rem] text-muted-foreground">
                {field.description}
              </p>
            )}
            {error && (
              <p className="text-[0.8rem] font-medium text-red-500">
                {error}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

const statusColors: Record<string, string> = {
  verified: 'bg-green-500',
  claimed: 'bg-blue-500',
  pending: 'bg-yellow-500',
  syncing: 'bg-blue-400',
  synced: 'bg-green-400',
  needs_update: 'bg-orange-500',
  not_listed: 'bg-gray-500',
  error: 'bg-red-500',
};

export default function ListingsEnhanced() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeCompanyId, hasCompany } = useActiveCompany();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state management
  const activeTab = searchParams.get('tab') || 'listings';

  const handleTabChange = (value: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', value);
      if (activeCompanyId) {
        newParams.set('id', activeCompanyId.toString());
      }
      return newParams;
    });
  };

  // Sync activeCompanyId to URL if not present or changed
  useEffect(() => {
    if (activeCompanyId && searchParams.get('id') !== activeCompanyId.toString()) {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('id', activeCompanyId.toString());
        return newParams;
      }, { replace: true });
    }
  }, [activeCompanyId, searchParams, setSearchParams]);
  const [isAddListingOpen, setIsAddListingOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [isBulkAdd, setIsBulkAdd] = useState(false);
  const [bulkListings, setBulkListings] = useState<any[]>([]);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<BusinessListing | null>(null);
  const [listingToDelete, setListingToDelete] = useState<number | null>(null);
  const [selectedListings, setSelectedListings] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [directoryFilter, setDirectoryFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(20);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newListing, setNewListing] = useState({
    platform: 'google_business',
    directory_id: null as number | null,
    directory_name: '',
    listing_url: '',
    business_name: '',
    address: '',
    phone: '',
    website: '',
    submission_type: 'manual' as 'manual' | 'automated' | 'not_sure',
    country: 'US',
    submission_data: {} as Record<string, any>,
  });

  const [selectedWizardDirectories, setSelectedWizardDirectories] = useState<Directory[]>([]);

  const [isAddUrlOpen, setIsAddUrlOpen] = useState(false);
  const [listingToAddUrl, setListingToAddUrl] = useState<BusinessListing | null>(null);
  const [manualInputUrl, setManualInputUrl] = useState('');


  /* Competitor Tool State */
  const [competitorSearchMode, setCompetitorSearchMode] = useState<'direct' | 'keyword'>('direct');
  const [competitorName, setCompetitorName] = useState('');
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [competitorResults, setCompetitorResults] = useState<any[]>([]);

  const [keywordSearch, setKeywordSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [foundCompetitors, setFoundCompetitors] = useState<any[]>([]);

  const checkCompetitorMutation = useMutation({
    mutationFn: (data: { name: string; url?: string }) => listingsApi.checkCompetitorCitations(data),
    onSuccess: (data) => {
      setCompetitorResults(data);
      toast({ title: 'Competitor analysis complete', description: `Found info for ${data.length} directories.` });
    },
    onError: () => {
      toast({ title: 'Failed to check competitor', variant: 'destructive' });
    },
  });

  const searchCompetitorsMutation = useMutation({
    mutationFn: listingsApi.searchCompetitorsByKeyword,
    onSuccess: (data) => {
      setFoundCompetitors(data);
      if (data.length === 0) {
        toast({ title: "No competitors found", description: "Try broader keywords or a different location." });
      } else {
        toast({
          title: "Competitors Found",
          description: `Found ${data.length} top ranking businesses. Select one to analyze.`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Search Failed",
        description: "Could not find competitors. Please try again.",
        variant: "destructive",
      });
    }
  });

  const { data: directories, isLoading: isLoadingDirectories } = useQuery({
    queryKey: ['directories', selectedCountry, selectedCategory],
    queryFn: () => listingsApi.getDirectories({ country: selectedCountry, type: selectedCategory === 'none' ? '' : selectedCategory }),
  });

  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: [...companyQueryKey('business-listings', activeCompanyId), { page: currentPage, per_page: perPage, query: searchQuery, status: statusFilter, directory: directoryFilter, submission_type: methodFilter }],
    queryFn: () => listingsApi.getListings({ page: currentPage, per_page: perPage, query: searchQuery, status: statusFilter, directory: directoryFilter, submission_type: methodFilter }),
    enabled: hasCompany,
  });

  const listings = listingsData?.data || [];
  const pagination = listingsData?.pagination;

  const { data: analytics } = useQuery({
    queryKey: companyQueryKey('listing-analytics', activeCompanyId),
    queryFn: () => listingsApi.getAnalytics(),
    enabled: hasCompany,
  });

  const { data: settings } = useQuery({
    queryKey: ['listing-settings', activeCompanyId],
    queryFn: () => listingsApi.getListingSettings(),
    enabled: hasCompany,
  });

  const { data: audits } = useQuery({
    queryKey: companyQueryKey('listing-audits', activeCompanyId),
    queryFn: () => listingsApi.getListingAudits(),
    enabled: hasCompany,
  });

  const { data: duplicates } = useQuery({
    queryKey: companyQueryKey('listing-duplicates', activeCompanyId),
    queryFn: () => listingsApi.getListingDuplicates(),
    enabled: hasCompany,
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: companyQueryKey('listing-reviews', activeCompanyId),
    queryFn: () => listingsApi.getListingReviews(),
    enabled: hasCompany,
  });

  const { data: ranks, isLoading: ranksLoading } = useQuery({
    queryKey: companyQueryKey('listing-ranks', activeCompanyId),
    queryFn: () => listingsApi.getRankTrackings(),
    enabled: hasCompany,
  });

  const latestAudit = audits?.[0];
  const isYextConnected = !!settings?.integrations?.Yext?.api_key;

  useEffect(() => {
    if (isAddListingOpen && settings) {
      setNewListing(prev => ({
        ...prev,
        business_name: settings.business_name || '',
        phone: settings.phone || '',
        address: settings.address || '',
        website: settings.website || '',
        country: settings.country || 'US',
      }));
      setWizardStep(1);
      setSelectedWizardDirectories([]);
    }
  }, [isAddListingOpen, settings]);

  const createListingMutation = useMutation({
    mutationFn: (data: typeof newListing) => {
      // Merge with settings if available
      const listingData = {
        ...data,
        business_name: data.business_name || settings?.business_name,
        address: data.address || settings?.address,
        phone: data.phone || settings?.phone,
        website: settings?.website,
      };
      return listingsApi.createListing(listingData);
    },
    onSuccess: (data) => {
      // Invalidate and close modal
      queryClient.invalidateQueries({ queryKey: companyQueryKey('business-listings', activeCompanyId) });
      setIsAddListingOpen(false);
      setSelectedWizardDirectories([]);
      setNewListing({
        platform: 'google_business',
        directory_id: null,
        directory_name: '',
        listing_url: '',
        business_name: '',
        address: '',
        phone: '',
        website: '',
        submission_type: 'manual',
        country: 'US',
        submission_data: {}
      });
      toast({ title: 'Listing added successfully' });

      // Automatically submit to the directory by triggering a sync for the new listing
      // ONLY if the submission type is automated
      if (data && typeof data.id === 'number' && newListing.submission_type === 'automated') {
        syncListingMutation.mutate(data.id);
      }

      // If manual, open the directory submission URL
      if (variables.submission_type === 'manual') {
        const dir = directories?.find(d => d.id === variables.directory_id || d.code === variables.platform);
        if (dir?.submission_url) {
          window.open(dir.submission_url, '_blank');
        }
      }
    },
    onError: () => {
      toast({ title: 'Failed to add listing', variant: 'destructive' });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (listings: any[]) => {
      console.log('Creating bulk listings:', listings);
      return listingsApi.bulkCreateListings(listings);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('business-listings', activeCompanyId) });
      setIsAddListingOpen(false);
      setWizardStep(1);
      setBulkListings([]);
      setSelectedWizardDirectories([]);
      toast({
        title: "Bulk listings added",
        description: `Successfully added ${data.count || 'multiple'} listings to your dashboard.`,
      });

      // If only one listing was added manually, open the directory URL
      if (variables.length === 1 && variables[0].submission_type === 'manual') {
        const dir = directories?.find(d => d.id === variables[0].directory_id || d.code === variables[0].platform);
        if (dir?.submission_url) {
          window.open(dir.submission_url, '_blank');
        }
      }
    },
    onError: (error: any) => {
      console.error('Bulk create error:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Unknown error';
      toast({
        title: 'Failed to add bulk listings',
        description: errorMessage,
        variant: 'destructive'
      });
    },
  });

  const updateListingMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BusinessListing> }) => listingsApi.updateListing(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('business-listings', activeCompanyId) });
      setIsEditDrawerOpen(false);
      setEditingListing(null);
      setIsAddUrlOpen(false);
      setListingToAddUrl(null);
      setManualInputUrl('');
      toast({ title: 'Listing updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update listing', variant: 'destructive' });
    },
  });

  const deleteListingMutation = useMutation({
    mutationFn: (id: number) => listingsApi.deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('business-listings', activeCompanyId) });
      toast({ title: 'Listing deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete listing', variant: 'destructive' });
    },
  });

  const syncListingMutation = useMutation({
    mutationFn: (id: number) => listingsApi.syncListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('business-listings', activeCompanyId) });
      toast({ title: 'Listing synced successfully' });
    },
  });

  const bulkSyncMutation = useMutation({
    mutationFn: (ids: number[]) => listingsApi.bulkSync(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('business-listings', activeCompanyId) });
      setSelectedListings([]);
      toast({ title: 'Bulk sync initiated' });
    },
  });

  const bulkUpdateMethodMutation = useMutation({
    mutationFn: ({ ids, method }: { ids: number[]; method: string }) =>
      listingsApi.bulkUpdateMethod(ids, method),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('business-listings', activeCompanyId) });
      setSelectedListings([]);
      toast({ title: 'Submission method updated', description: `Updated ${data.count} listings.` });
    },
    onError: () => {
      toast({ title: 'Failed to update submission method', variant: 'destructive' });
    }
  });

  const claimListingMutation = useMutation({
    mutationFn: (id: number) => listingsApi.claimListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('business-listings', activeCompanyId) });
      toast({ title: 'Claim process initiated' });
    },
  });

  const verifyListingMutation = useMutation({
    mutationFn: (id: number) => listingsApi.verifyListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('business-listings', activeCompanyId) });
      toast({ title: 'Listing verified' });
    },
  });

  const startAuditMutation = useMutation({
    mutationFn: () => listingsApi.startListingAudit(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('listing-audits', activeCompanyId) });
      toast({ title: 'Audit started', description: 'We are scanning for citations and duplicates.' });
    },
  });

  const suppressDuplicateMutation = useMutation({
    mutationFn: (id: number) => listingsApi.suppressDuplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('listing-duplicates', activeCompanyId) });
      toast({ title: 'Duplicate suppressed' });
    },
  });

  const syncReviewsMutation = useMutation({
    mutationFn: () => listingsApi.syncListingReviews(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('listing-reviews', activeCompanyId) });
      toast({ title: 'Reviews synced', description: `Found ${data.count} new reviews.` });
    },
  });

  const replyToReviewMutation = useMutation({
    mutationFn: ({ id, reply }: { id: number; reply: string }) => listingsApi.replyToListingReview(id, reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('listing-reviews', activeCompanyId) });
      toast({ title: 'Reply posted', description: 'Your reply has been scheduled for posting.' });
    },
  });

  const addRankMutation = useMutation({
    mutationFn: (data: { keyword: string; location?: string; engine?: string }) => listingsApi.addRankTracking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('listing-ranks', activeCompanyId) });
      toast({ title: 'Keyword added', description: 'We have started tracking this keyword.' });
    },
  });

  const refreshRankMutation = useMutation({
    mutationFn: (id: number) => listingsApi.refreshRankTracking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('listing-ranks', activeCompanyId) });
      toast({ title: 'Rank refresh queued' });
    },
  });

  const deleteRankMutation = useMutation({
    mutationFn: (id: number) => listingsApi.deleteRankTracking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey('listing-ranks', activeCompanyId) });
      toast({ title: 'Keyword removed' });
    },
  });

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const isTxt = file.name.endsWith('.txt');

      if (isTxt) {
        // Handle TXT: One URL per line or comma-separated
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        const parsedListings = lines.map(line => {
          if (line.includes(',')) {
            const parts = line.split(',').map(p => p.trim());
            return {
              platform: parts[0] || 'unknown',
              business_name: parts[1] || '',
              listing_url: parts[2] || '',
              address: parts[3] || '',
              phone: parts[4] || ''
            };
          }
          return {
            platform: 'unknown',
            business_name: '',
            listing_url: line.trim(),
            address: '',
            phone: ''
          };
        });
        setBulkListings(parsedListings);
      } else {
        // Handle CSV
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const parsedListings = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',').map(v => v.trim());
          const listing: any = {};
          headers.forEach((header, index) => {
            if (header === 'platform') listing.platform = values[index];
            if (header === 'business_name') listing.business_name = values[index];
            if (header === 'listing_url') listing.listing_url = values[index];
            if (header === 'address') listing.address = values[index];
            if (header === 'phone') listing.phone = values[index];
          });
          return listing;
        });
        setBulkListings(parsedListings);
      }
      setIsBulkAdd(true);
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = () => {
    // Ensure all bulk listings have submission_type and country
    const processedListings = bulkListings.map(l => ({
      ...l,
      submission_type: l.submission_type || 'manual',
      country: l.country || selectedCountry
    }));
    bulkCreateMutation.mutate(processedListings);
  };

  const addBulkRow = () => {
    setBulkListings([...bulkListings, { platform: 'google_business', business_name: '', listing_url: '', address: '', phone: '' }]);
  };

  const updateBulkRow = (index: number, field: string, value: string) => {
    const updated = [...bulkListings];
    updated[index] = { ...updated[index], [field]: value };
    setBulkListings(updated);
  };

  const removeBulkRow = (index: number) => {
    setBulkListings(bulkListings.filter((_, i) => i !== index));
  };

  const toggleSelection = (id: number) => {
    setSelectedListings(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedListings.length === listings.length) {
      setSelectedListings([]);
    } else {
      setSelectedListings(listings.map((l: BusinessListing) => l.id));
    }
  };

  const handleEditListing = (listing: BusinessListing) => {
    setEditingListing(listing);
    setIsEditDrawerOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingListing) return;
    updateListingMutation.mutate({
      id: editingListing.id,
      data: {
        business_name: editingListing.business_name,
        address: editingListing.address,
        phone: editingListing.phone,
        website: editingListing.website,
        listing_url: editingListing.listing_url,
        submission_data: editingListing.submission_data,
      },
    });
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'syncing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  // Calculate stats
  const stats = {
    total: analytics?.listings?.total || pagination?.total || listings.length,
    verified: analytics?.listings?.verified || listings.filter((l: BusinessListing) => l.status === 'verified' || l.claim_status === 'verified').length,
    claimed: analytics?.listings?.claimed || listings.filter((l: BusinessListing) => l.claim_status === 'claimed').length,
    needsUpdate: analytics?.listings?.needs_update || listings.filter((l: BusinessListing) => l.status === 'needs_update').length,
    avgAccuracy: analytics?.listings?.avg_accuracy || (listings.length > 0
      ? Math.round(listings.reduce((sum: number, l: BusinessListing) => sum + (l.accuracy_score || 0), 0) / listings.length)
      : 0),
    healthScore: latestAudit?.score || 0,
  };

  const handleExportCompetitor = () => {
    if (!competitorResults.length) return;
    const headers = ['Competitor', 'Platform', 'Domain', 'Status', 'Listing URL', 'Authority'];
    const csvContent = [
      headers.join(','),
      ...competitorResults.map(r => [
        `"${r.competitor_name}"`,
        `"${r.platform}"`,
        `"${r.domain}"`,
        `"${r.status}"`,
        `"${r.listing_url || ''}"`,
        `"${r.authority}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `competitor_citations_${competitorName.replace(/\s+/g, '_')}.csv`;
    a.click();
  };

  const handleBulkAddFromCompetitors = () => {
    const selectedResults = competitorResults.filter((_, idx) => selectedListings.includes(idx));
    const listingsToCreate = selectedResults
      .filter(result => {
        return !listings.some(l =>
          l.directory_name?.toLowerCase() === result.platform?.toLowerCase() ||
          l.listing_url?.includes(result.domain)
        );
      })
      .map(result => {
        const matchingDir = directories?.find(d =>
          d.name.toLowerCase().includes(result.platform.toLowerCase()) ||
          d.url.includes(result.domain)
        );

        return {
          platform: result.platform,
          directory_id: matchingDir?.id || null,
          directory_name: result.platform,
          listing_url: '',
          business_name: settings?.business_name || '',
          address: settings?.address || '',
          phone: settings?.phone || '',
          website: settings?.website || '',
          submission_type: 'manual' as const,
          country: selectedCountry,
          submission_data: {
            competitor_discovered: true,
            competitor_name: competitorName,
            submission_url: result.submission_url || `https://${result.domain}`
          }
        };
      });

    if (listingsToCreate.length > 0) {
      bulkCreateMutation.mutate(listingsToCreate);
      setSelectedListings([]);
    } else {
      toast({
        title: 'No new listings to create',
        description: 'All selected directories are already in your listings.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <SEO
        title="Business Listings"
        description="Manage your business presence across the web, sync your information, and monitor citation accuracy."
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Business Listings</h1>
          <p className="text-muted-foreground">
            Manage your business presence across the web and sync your information.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddListingOpen} onOpenChange={setIsAddListingOpen}>
            <Button onClick={() => { setWizardStep(1); setIsAddListingOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Listing
            </Button>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Business Listings</DialogTitle>
                <DialogDescription>Add and manage your directory presence</DialogDescription>
              </DialogHeader>

              <div className="w-full py-4 space-y-4">
                <div className="flex items-center justify-between mb-8 px-4">
                  {[
                    { id: 1, label: 'Directories', description: 'Choose Platforms' },
                    { id: 2, label: 'Configuration', description: 'Setup Data' },
                    { id: 3, label: 'Review', description: 'Finalize & Create' }
                  ].map((step, idx) => (
                    <React.Fragment key={step.id}>
                      <div className="flex flex-col items-center gap-2 relative z-10">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${wizardStep === step.id ? 'bg-primary border-primary text-primary-foreground shadow-lg scale-110' :
                          wizardStep > step.id ? 'bg-green-500 border-green-500 text-white' : 'bg-background border-muted text-muted-foreground'
                          }`}>
                          {wizardStep > step.id ? <LucideCheck className="h-5 w-5" /> : step.id}
                        </div>
                        <div className="text-center w-24">
                          <p className={`text-[12px] font-bold leading-tight ${wizardStep === step.id ? 'text-primary' : 'text-muted-foreground'}`}>{step.label}</p>
                          <p className="text-[12px] text-muted-foreground opacity-70 hidden md:block">{step.description}</p>
                        </div>
                      </div>
                      {idx < 2 && (
                        <div className={`flex-1 h-[2px] mt-5 mx-0 transition-all duration-500 ${wizardStep > idx + 1 ? 'bg-green-500' : 'bg-muted'}`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {wizardStep === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center gap-4 bg-muted/40 p-1 rounded-lg border w-fit mx-auto">
                        <Button
                          variant={!isBulkAdd ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setIsBulkAdd(false)}
                          className="rounded-md px-6 text-xs"
                        >
                          <Globe className="h-3.5 w-3.5 mr-2" />
                          Manual Selection
                        </Button>
                        <Button
                          variant={isBulkAdd ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setIsBulkAdd(true)}
                          className="rounded-md px-6 text-xs"
                        >
                          <Upload className="h-3.5 w-3.5 mr-2" />
                          Bulk Import
                        </Button>
                      </div>

                      <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        {!isBulkAdd && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[12px] uppercase tracking-wider text-muted-foreground font-bold">Country</Label>
                              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                                <SelectTrigger className="bg-background h-10">
                                  <SelectValue placeholder="Select Country" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="US">United States</SelectItem>
                                  <SelectItem value="GB">United Kingdom</SelectItem>
                                  <SelectItem value="CA">Canada</SelectItem>
                                  <SelectItem value="AU">Australia</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[12px] uppercase tracking-wider text-muted-foreground font-bold">Category / Niche</Label>
                              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="bg-background h-10">
                                  <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">All Categories</SelectItem>
                                  <SelectItem value="general">General</SelectItem>
                                  <SelectItem value="niche">Niche / Industry</SelectItem>
                                  <SelectItem value="location">Local / Maps</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}

                        {isBulkAdd ? (
                          <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300 pt-4 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="border-2 border-dashed rounded-xl p-8 text-center space-y-4 bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer relative group">
                                <input
                                  type="file"
                                  accept=".csv,.txt"
                                  onChange={handleCsvUpload}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="flex justify-center">
                                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Upload className="h-6 w-6 text-primary" />
                                  </div>
                                </div>
                                <div>
                                  <p className="font-bold text-sm">Upload CSV or TXT</p>
                                  <p className="text-xs text-muted-foreground mt-1">One URL per line or full NAP data</p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Paste URLs / List</Label>
                                <Textarea
                                  placeholder="https://www.yelp.com/biz/my-business&#10;https://www.facebook.com/my-business"
                                  className="h-[140px] font-mono text-xs bg-muted/5"
                                  onChange={(e) => {
                                    const lines = e.target.value.split(/\r?\n/).filter(line => line.trim());
                                    const parsed = lines.map(line => ({
                                      platform: 'unknown',
                                      listing_url: line.trim(),
                                      business_name: '',
                                      address: '',
                                      phone: '',
                                      submission_type: 'manual',
                                      country: selectedCountry
                                    }));
                                    setBulkListings(parsed);
                                  }}
                                />
                              </div>
                            </div>

                            {bulkListings.length > 0 && (
                              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  </div>
                                  <div>
                                    <span className="text-sm font-bold block">Ready for Import</span>
                                    <span className="text-xs text-muted-foreground">Detected {bulkListings.length} listings from input.</span>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setBulkListings([])} className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
                                  Clear List
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="border rounded-xl bg-card overflow-hidden min-h-[400px] flex flex-col shadow-sm">
                            <div className="bg-muted/30 p-4 border-b">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-bold text-sm">Select Directories</h3>
                                  <p className="text-xs text-muted-foreground">Filtered by {selectedCountry} - {selectedCategory === 'none' ? 'All' : selectedCategory}</p>
                                </div>
                                <Badge variant="outline">{selectedWizardDirectories.length} Selected</Badge>
                              </div>
                            </div>
                            <div className="relative overflow-x-auto flex-1">
                              {isLoadingDirectories ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-background/50 z-10">
                                  <Loader2 className="h-6 w-6 animate-spin" />
                                  <p className="text-xs">Loading directories...</p>
                                </div>
                              ) : (
                                <table className="w-full text-sm text-left">
                                  <thead className="bg-muted/50 text-muted-foreground font-medium border-b sticky top-0 backdrop-blur-sm z-10">
                                    <tr>
                                      <th className="px-3 py-2 w-10 pl-4">
                                        <Checkbox
                                          checked={(directories?.length || 0) > 0 && directories?.length === selectedWizardDirectories.length}
                                          onCheckedChange={(checked) => {
                                            if (checked) setSelectedWizardDirectories(directories || []);
                                            else setSelectedWizardDirectories([]);
                                          }}
                                        />
                                      </th>
                                      <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wider">Platform</th>
                                      <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wider">Type</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {directories?.map((dir) => {
                                      const isSelected = selectedWizardDirectories.some(d => d.id === dir.id);
                                      return (
                                        <tr
                                          key={dir.id}
                                          onClick={() => {
                                            if (isSelected) {
                                              setSelectedWizardDirectories(prev => prev.filter(d => d.id !== dir.id));
                                            } else {
                                              setSelectedWizardDirectories(prev => [...prev, dir]);
                                            }
                                          }}
                                          className={`hover:bg-muted/50 transition-colors cursor-pointer group ${isSelected ? 'bg-primary/5' : ''}`}
                                        >
                                          <td className="px-3 py-2 pl-4">
                                            <Checkbox checked={isSelected} />
                                          </td>
                                          <td className="px-3 py-2">
                                            <div className="flex items-center gap-3">
                                              <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center border p-1.5 shadow-sm group-hover:scale-105 transition-transform">
                                                {dir.logo_url ? (
                                                  <img src={dir.logo_url} alt="" className="h-full w-full object-contain" />
                                                ) : (
                                                  <Globe className="h-4 w-4 text-muted-foreground" />
                                                )}
                                              </div>
                                              <span className="font-bold text-[13px] group-hover:text-primary transition-colors">{dir.name}</span>
                                            </div>
                                          </td>
                                          <td className="px-3 py-2">
                                            <Badge variant="secondary" className="capitalize text-[12px] h-5 px-1.5 bg-muted group-hover:bg-background">{dir.type}</Badge>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <Label className="text-base font-semibold">Submission Method</Label>
                        <RadioGroup
                          value={newListing.submission_type}
                          onValueChange={(v: any) => setNewListing({ ...newListing, submission_type: v })}
                          className="grid grid-cols-1 gap-4"
                        >
                          <div className={`flex items-start gap-3 p-4 border rounded-lg transition-all ${!isYextConnected ? 'opacity-60 grayscale bg-muted/20 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'} ${newListing.submission_type === 'automated' && isYextConnected ? 'border-primary bg-primary/5' : ''}`}>
                            <RadioGroupItem
                              value="automated"
                              id="automated"
                              className="mt-1"
                              disabled={!isYextConnected}
                            />
                            <Label htmlFor="automated" className={`${!isYextConnected ? 'cursor-not-allowed' : 'cursor-pointer'} space-y-1 w-full`}>
                              <div className="flex items-center justify-between font-bold text-sm">
                                <div className="flex items-center gap-2">
                                  <Zap className="h-4 w-4 text-orange-500" />
                                  Automated Creation
                                </div>
                                {!isYextConnected && (
                                  <Badge variant="outline" className="text-[12px] h-4 bg-orange-50 text-orange-600 border-orange-200">Yext Required</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {!isYextConnected
                                  ? "Connect the Yext API in settings to enable automated submissions."
                                  : "Our engine will attempt to create and verify your business details via Yext API."}
                              </p>
                            </Label>
                          </div>
                          <div className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:border-primary/50 ${newListing.submission_type === 'manual' ? 'border-primary bg-primary/5' : ''}`}>
                            <RadioGroupItem value="manual" id="manual" className="mt-1" />
                            <Label htmlFor="manual" className="cursor-pointer space-y-1">
                              <div className="flex items-center gap-2 font-bold text-sm">
                                <Edit className="h-4 w-4 text-blue-500" />
                                Manual / Existing
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                Useful if you already have listings or want to do it yourself.
                              </p>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Business Details</Label>
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 text-[12px]">
                            <ShieldCheck className="h-3 w-3" /> From Profile
                          </Badge>
                        </div>

                        {/* Read-only Business Profile Display */}
                        <div className="space-y-3">
                          <div className="p-3 rounded-lg bg-muted/30 border">
                            <p className="text-[12px] text-muted-foreground uppercase font-semibold tracking-wider mb-1">Business Name</p>
                            <p className="text-sm font-medium">{settings?.business_name || <span className="text-muted-foreground italic">Not set in profile</span>}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30 border">
                            <p className="text-[12px] text-muted-foreground uppercase font-semibold tracking-wider mb-1">Phone Number</p>
                            <p className="text-sm font-medium">{settings?.phone || <span className="text-muted-foreground italic">Not set in profile</span>}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30 border">
                            <p className="text-[12px] text-muted-foreground uppercase font-semibold tracking-wider mb-1">Website</p>
                            <p className="text-sm font-medium truncate">{settings?.website || <span className="text-muted-foreground italic">Not set in profile</span>}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30 border">
                            <p className="text-[12px] text-muted-foreground uppercase font-semibold tracking-wider mb-1">Address</p>
                            <p className="text-sm font-medium leading-relaxed">{settings?.address || <span className="text-muted-foreground italic">Not set in profile</span>}</p>
                          </div>
                        </div>

                        {/* Edit Profile Link */}
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          To update business details, go to the <span className="text-primary font-medium">Business Profile</span> tab.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-6 animate-in fade-in scale-95 duration-300">
                    <div className="border rounded-xl bg-card overflow-hidden">
                      <div className="bg-muted/30 p-4 border-b flex items-center justify-between">
                        <h3 className="font-bold text-sm">Review Your Selection</h3>
                        <Badge variant="outline">{selectedWizardDirectories.length} Platforms</Badge>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <h4 className="text-[12px] uppercase font-bold text-muted-foreground tracking-widest">Business Information</h4>
                            <div className="space-y-3">
                              <div className="p-3 rounded-lg bg-muted/20 border">
                                <p className="text-[12px] text-muted-foreground uppercase font-semibold">Name</p>
                                <p className="text-sm font-bold">{settings?.business_name || 'Not provided'}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/20 border">
                                <p className="text-[12px] text-muted-foreground uppercase font-semibold">Phone</p>
                                <p className="text-sm font-bold">{settings?.phone || 'Not provided'}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/20 border">
                                <p className="text-[12px] text-muted-foreground uppercase font-semibold">Website</p>
                                <p className="text-sm font-bold truncate">{settings?.website || 'Not provided'}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/20 border">
                                <p className="text-[12px] text-muted-foreground uppercase font-semibold">Address</p>
                                <p className="text-sm font-bold leading-tight">{settings?.address || 'Not provided'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-[12px] uppercase font-bold text-muted-foreground tracking-widest">Selected Directories</h4>
                            <div className="max-h-[180px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                              {selectedWizardDirectories.map(dir => (
                                <div key={dir.id} className="flex items-center gap-2 p-2 bg-muted/10 rounded border text-xs">
                                  {dir.logo_url ? <img src={dir.logo_url} className="h-4 w-4 object-contain" /> : <Globe className="h-3 w-3" />}
                                  <span className="font-medium">{dir.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-8 pt-4 border-t">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => setIsAddListingOpen(false)}>
                      Cancel
                    </Button>
                    {wizardStep > 1 && (
                      <Button variant="outline" onClick={() => setWizardStep(wizardStep - 1)}>
                        <ChevronLeft className="h-4 w-4 mr-2" /> Back
                      </Button>
                    )}
                  </div>

                  {wizardStep === 1 && isBulkAdd ? (
                    <Button
                      onClick={handleBulkSubmit}
                      disabled={bulkListings.length === 0 || bulkCreateMutation.isPending}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {bulkCreateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Import {bulkListings.length} Listings
                    </Button>
                  ) : (
                    wizardStep === 1 ? (
                      <Button
                        onClick={() => setWizardStep(2)}
                        disabled={selectedWizardDirectories.length === 0}
                      >
                        Next: Configuration <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : wizardStep === 2 ? (
                      <Button onClick={() => setWizardStep(3)}>
                        Next: Review <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          const listingsToCreate = selectedWizardDirectories.map(dir => ({
                            platform: dir.code,
                            directory_id: dir.id,
                            directory_name: dir.name,
                            listing_url: '',
                            business_name: settings?.business_name || '',
                            address: settings?.address || '',
                            phone: settings?.phone || '',
                            website: settings?.website || '',
                            submission_type: newListing.submission_type,
                            country: selectedCountry,
                            submission_data: {}
                          }));
                          bulkCreateMutation.mutate(listingsToCreate);
                        }}
                        disabled={bulkCreateMutation.isPending || selectedWizardDirectories.length === 0}
                        className="bg-primary hover:bg-primary/90 shadow-md"
                      >
                        {bulkCreateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        <Zap className="h-4 w-4 mr-2" /> Create {selectedWizardDirectories.length} Listings
                      </Button>
                    )
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="listings" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Directory Listings
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Platform Catalog
          </TabsTrigger>
          <TabsTrigger value="competitors" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Competitors
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Citation Audit
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Business Profile
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Platform Settings
          </TabsTrigger>
          <TabsTrigger value="gmb" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Google Business
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="space-y-6 mt-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">


                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search listings..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All Statuses</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="claimed">Claimed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="needs_update">Needs Update</SelectItem>
                    <SelectItem value="not_listed">Not Listed</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={directoryFilter}
                  onValueChange={(v) => {
                    setDirectoryFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="All Directories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All Directories</SelectItem>
                    <SelectItem value="google">Google Business</SelectItem>
                    <SelectItem value="yelp">Yelp</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="bing">Bing Places</SelectItem>
                    <SelectItem value="apple">Apple Maps</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={methodFilter}
                  onValueChange={(v) => {
                    setMethodFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="All Methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All Methods</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automated">Automated</SelectItem>
                    <SelectItem value="not_sure">Not Sure</SelectItem>
                  </SelectContent>
                </Select>
                {(searchQuery || statusFilter || directoryFilter || methodFilter) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('');
                      setDirectoryFilter('');
                      setMethodFilter('');
                      setCurrentPage(1);
                    }}
                    aria-label="Clear filters"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <Card className="bg-primary/5 border-primary/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Globe className="h-64 w-64" />
            </div>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
                <div className="relative h-40 w-40 flex items-center justify-center bg-background rounded-full p-2 shadow-inner border">
                  <svg className="h-full w-full transform -rotate-90 drop-shadow-sm">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-primary/10"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={440}
                      strokeDashoffset={440 - (440 * stats.healthScore) / 100}
                      className="text-primary transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-primary tracking-tighter">{stats.healthScore}%</span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Health</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">Online Visibility Health</h3>
                    <p className="text-muted-foreground max-w-2xl text-sm mt-1">
                      Your business is currently visible and accurate on <strong>{stats.verified}</strong> out of <strong>{stats.total}</strong> top directories.
                      We've identified <strong>{stats.needsUpdate}</strong> listings that require immediate attention to maintain NAP consistency.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-background/50 p-3 rounded-lg border flex flex-col items-center justify-center lg:items-start lg:justify-start">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Total</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-xl font-bold">{stats.total}</p>
                        <Globe className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="bg-background/50 p-3 rounded-lg border flex flex-col items-center justify-center lg:items-start lg:justify-start">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Verified</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-xl font-bold text-green-600">{stats.verified}</p>
                        <ShieldCheck className="h-3 w-3 text-green-500" />
                      </div>
                    </div>
                    <div className="bg-background/50 p-3 rounded-lg border flex flex-col items-center justify-center lg:items-start lg:justify-start">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Claimed</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-xl font-bold text-blue-600">{stats.claimed}</p>
                        <ShieldAlert className="h-3 w-3 text-blue-500" />
                      </div>
                    </div>
                    <div className="bg-background/50 p-3 rounded-lg border flex flex-col items-center justify-center lg:items-start lg:justify-start">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Accuracy</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-xl font-bold">{stats.avgAccuracy}%</p>
                        <Progress value={stats.avgAccuracy} className="h-1.5 w-12" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full lg:w-auto">
                  <Button className="h-12 px-8 font-bold shadow-lg shadow-primary/20" onClick={() => startAuditMutation.mutate()} disabled={startAuditMutation.isPending}>
                    {startAuditMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2 fill-current" />
                    )}
                    Fix All Issues
                  </Button>
                  <Button variant="outline" className="h-10" onClick={() => queryClient.invalidateQueries({ queryKey: companyQueryKey('business-listings', activeCompanyId) })}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rescan All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedListings.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4 flex items-center justify-between">
                <p className="text-sm font-medium">{selectedListings.length} listings selected</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => bulkSyncMutation.mutate(selectedListings)}
                    disabled={bulkSyncMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Selected
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedListings([])}>
                    Clear Selection
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Listings Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Directory Presence</CardTitle>
                <CardDescription>
                  Your business information across major directories.
                </CardDescription>
              </div>
              {selectedListings.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedListings.length} selected
                  </span>
                  <Select onValueChange={(v) => bulkUpdateMethodMutation.mutate({ ids: selectedListings, method: v })}>
                    <SelectTrigger className="h-8 w-[160px] text-xs">
                      <SelectValue placeholder="Change Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="automated" disabled={!isYextConnected}>Automated {!isYextConnected && '(Yext Required)'}</SelectItem>
                      <SelectItem value="not_sure">Not Sure</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => bulkSyncMutation.mutate(selectedListings)}
                    disabled={bulkSyncMutation.isPending}
                  >
                    <RefreshCw className={`mr-2 h-3 w-3 ${bulkSyncMutation.isPending ? 'animate-spin' : ''}`} />
                    Sync Selected
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {listingsLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : listings.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-center">
                  <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No listings found</h3>
                  <p className="text-muted-foreground max-w-xs">
                    Start by adding your business to directories or scanning the web.
                  </p>
                  <Button className="mt-4" onClick={() => setIsAddListingOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Listing
                  </Button>
                </div>
              ) : (
                <div className="relative overflow-x-auto border rounded-md">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground font-medium">
                      <tr>
                        <th className="px-4 py-2 w-10">
                          <Checkbox
                            aria-label="Select all"
                            checked={selectedListings.length === listings.length && listings.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedListings(listings.map((l) => l.id));
                              } else {
                                setSelectedListings([]);
                              }
                            }}
                          />
                        </th>
                        <th className="px-4 py-2">Directory</th>
                        <th className="px-4 py-2">Method</th>
                        <th className="px-4 py-2">Business Info</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Sync Status</th>
                        <th className="px-4 py-2">Accuracy</th>
                        <th className="px-4 py-2">NAP Score</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {listings.map((listing) => (
                        <tr key={listing.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-2">
                            <Checkbox
                              checked={selectedListings.includes(listing.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedListings([...selectedListings, listing.id]);
                                } else {
                                  setSelectedListings(selectedListings.filter((id) => id !== listing.id));
                                }
                              }}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center overflow-hidden border">
                                {directories?.find(d => d.id === listing.directory_id)?.logo_url ? (
                                  <img src={directories.find(d => d.id === listing.directory_id)?.logo_url || ''} alt="" className="h-full w-full object-contain p-1 bg-white" />
                                ) : (
                                  <Globe className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{listing.directory_name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {listing.listing_url ? (
                                    <a
                                      href={listing.listing_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[12px] text-primary hover:underline flex items-center gap-1"
                                    >
                                      View Listing <ExternalLink className="h-2 w-2" />
                                    </a>
                                  ) : (
                                    <button
                                      className="text-[12px] text-muted-foreground italic hover:text-primary hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                                      onClick={() => {
                                        setListingToAddUrl(listing);
                                        setManualInputUrl('');
                                        setIsAddUrlOpen(true);
                                      }}
                                    >
                                      Not listed yet <Plus className="h-2 w-2 ml-1" />
                                    </button>
                                  )}
                                  {directories?.find(d => d.id === listing.directory_id)?.submission_url && (
                                    <a
                                      href={directories.find(d => d.id === listing.directory_id)?.submission_url || ''}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[12px] text-orange-600 hover:underline flex items-center gap-1"
                                    >
                                      Go to Directory <ExternalLink className="h-2 w-2" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="text-[12px] font-normal capitalize w-fit">
                                {listing.submission_type === 'manual' ? 'Manual' : (listing.submission_type?.replace('_', ' ') || 'Manual')}
                              </Badge>
                              {listing.submission_type === 'automated' && (
                                <span className="text-[12px] text-muted-foreground flex items-center gap-1">
                                  <Zap className="h-2 w-2" /> Auto-sync
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="space-y-1">
                              <p className="font-medium text-xs">{listing.business_name || 'N/A'}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate max-w-[150px]">{listing.address || 'No address'}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{listing.phone || 'No phone'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <Badge className={`${statusColors[listing.status]} text-white border-none`}>
                              {listing.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              {listing.sync_status === 'syncing' ? (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                              ) : listing.sync_status === 'synced' ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : listing.sync_status === 'error' ? (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              ) : (
                                <Clock className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="text-xs capitalize">
                                {listing.sync_status?.replace('_', ' ') || 'Not Synced'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">{listing.accuracy_score || 0}%</span>
                              <Progress value={listing.accuracy_score || 0} className="h-1.5 w-12" />
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${(listing.nap_consistency_score || 0) > 80 ? 'text-green-600' : (listing.nap_consistency_score || 0) > 50 ? 'text-orange-500' : 'text-red-500'}`}>
                                {listing.nap_consistency_score || 0}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex justify-end gap-2">
                              {listing.status === 'pending' && listing.submission_type === 'manual' && !listing.listing_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2 text-xs border-primary text-primary hover:bg-primary/10"
                                  onClick={() => {
                                    setListingToAddUrl(listing);
                                    setManualInputUrl('');
                                    setIsAddUrlOpen(true);
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add URL
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Edit"
                                onClick={() => {
                                  setEditingListing(listing);
                                  setIsEditDrawerOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Sync"
                                onClick={() => syncListingMutation.mutate(listing.id)}
                                disabled={syncListingMutation.isPending || listing.sync_status === 'syncing'}
                              >
                                <RefreshCw
                                  className={`h-4 w-4 ${syncListingMutation.isPending &&
                                    syncListingMutation.variables === listing.id
                                    ? 'animate-spin'
                                    : ''
                                    }`}
                                />
                              </Button>
                              {listing.claim_status === 'unclaimed' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-blue-600"
                                  title="Claim"
                                  onClick={() => claimListingMutation.mutate(listing.id)}
                                  disabled={claimListingMutation.isPending}
                                >
                                  <ShieldAlert className="h-4 w-4" />
                                </Button>
                              )}
                              {listing.claim_status === 'claimed' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-green-600"
                                  title="Verify"
                                  onClick={() => verifyListingMutation.mutate(listing.id)}
                                  disabled={verifyListingMutation.isPending}
                                >
                                  <ShieldCheck className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                title="Delete"
                                onClick={() => setListingToDelete(listing.id)}
                                disabled={deleteListingMutation.isPending}
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
              )}

              {/* Pagination */}
              {pagination && pagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * perPage + 1} to{' '}
                    {Math.min(currentPage * perPage, pagination.total)} of {pagination.total} listings
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === pagination.total_pages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Catalog of Supported Platforms</CardTitle>
                <CardDescription>
                  Discover where you can list your business and sync your details.
                </CardDescription>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2 bg-muted/20 p-1 px-3 rounded-lg border">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search platforms..."
                    className="w-[200px] border-none bg-transparent h-8 focus-visible:ring-0"
                    value={catalogSearchQuery}
                    onChange={(e) => setCatalogSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="w-[150px] h-9">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">🇺🇸 United States</SelectItem>
                    <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                    <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                    <SelectItem value="AU">🇦🇺 Australia</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[150px] h-9">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All Categories</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="niche">Niche / Industry</SelectItem>
                    <SelectItem value="location">Local / Maps</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto border rounded-xl">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground font-medium border-b">
                    <tr>
                      <th className="px-4 py-2">Platform</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Country</th>

                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {directories?.filter(d =>
                      !catalogSearchQuery ||
                      d.name.toLowerCase().includes(catalogSearchQuery.toLowerCase())
                    ).map((dir) => {
                      const isAdded = listings.some(l => l.directory_id === dir.id);
                      return (
                        <tr key={dir.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded bg-white flex items-center justify-center border p-1 shadow-sm">
                                {dir.logo_url ? (
                                  <img src={dir.logo_url} alt="" className="h-full w-full object-contain" />
                                ) : (
                                  <Globe className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <span className="font-bold">{dir.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <Badge variant="secondary" className="capitalize text-[12px]">{dir.type}</Badge>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              {dir.country === 'US' && <span className="text-lg">🇺🇸</span>}
                              {dir.country === 'GB' && <span className="text-lg">🇬🇧</span>}
                              {dir.country === 'CA' && <span className="text-lg">🇨🇦</span>}
                              {dir.country === 'AU' && <span className="text-lg">🇦🇺</span>}
                              <span className="text-xs font-medium">{dir.country}</span>
                            </div>
                          </td>

                          <td className="px-4 py-2 text-right">
                            <Button
                              size="sm"
                              variant={isAdded ? "outline" : "default"}
                              className="h-8 text-xs font-bold"
                              onClick={() => {
                                const targetUrl = dir.submission_url || dir.url;
                                if (targetUrl) {
                                  window.open(targetUrl, '_blank');
                                }
                              }}
                            >
                              {isAdded ? (
                                <>
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Another
                                </>
                              ) : (
                                'Add Listing'
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="competitors" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Competitor Strategy</CardTitle>
                  <CardDescription>
                    Analyze top competitors to find citation opportunities they are leveraging.
                  </CardDescription>
                </div>
                <div className="flex p-1 bg-muted rounded-lg self-start sm:self-auto">
                  <button
                    onClick={() => setCompetitorSearchMode('direct')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${competitorSearchMode === 'direct' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Direct Lookup
                  </button>
                  <button
                    onClick={() => setCompetitorSearchMode('keyword')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${competitorSearchMode === 'keyword' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Find Top Ranking
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {competitorSearchMode === 'direct' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 mb-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Direct Analysis
                    </h4>
                    <p className="text-xs text-blue-700">
                      Enter a specific competitor's information to scan for their citations across major directories.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="competitor-name">Competitor Business Name</Label>
                      <Input
                        id="competitor-name"
                        placeholder="e.g., Joe's Plumbing"
                        value={competitorName}
                        onChange={(e) => setCompetitorName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="competitor-url">Competitor Website (Optional)</Label>
                      <Input
                        id="competitor-url"
                        placeholder="https://example.com"
                        value={competitorUrl}
                        onChange={(e) => setCompetitorUrl(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => checkCompetitorMutation.mutate({ name: competitorName, url: competitorUrl || undefined })}
                    disabled={!competitorName || checkCompetitorMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    {checkCompetitorMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Scanning Competitor...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Scan Competitor Citations
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-4">
                    <h4 className="text-sm font-semibold text-indigo-900 mb-1 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Find Local Leaders
                    </h4>
                    <p className="text-xs text-indigo-700">
                      Search for a keyword to find the top-ranking businesses in your area, then analyze their citations.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Target Keyword</Label>
                      <Input
                        placeholder="e.g. Plumber, Italian Restaurant"
                        value={keywordSearch}
                        onChange={(e) => setKeywordSearch(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        placeholder="City, Zip, or 'Near Me'"
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => searchCompetitorsMutation.mutate({ keyword: keywordSearch, location: locationSearch })}
                    disabled={!keywordSearch || searchCompetitorsMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    {searchCompetitorsMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Finding Competitors...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Find Top Ranking Businesses
                      </>
                    )}
                  </Button>

                  {/* Search Results */}
                  {foundCompetitors.length > 0 && (
                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">Top Ranking Competitors Found</h4>
                        <span className="text-xs text-muted-foreground">{foundCompetitors.length} results</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {foundCompetitors.map((comp, idx) => (
                          <div key={idx} className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-base">{comp.name}</span>
                                <Badge variant="secondary" className="text-[12px] h-5 gap-1 flex items-center">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-500" />
                                  {comp.rating} ({comp.review_count})
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {comp.address}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" /> {new URL(comp.website).hostname}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="shrink-0"
                              onClick={() => {
                                setCompetitorName(comp.name);
                                setCompetitorUrl(comp.website);
                                setCompetitorSearchMode('direct');
                                // Small delay to allow tab switch animation
                                setTimeout(() => {
                                  checkCompetitorMutation.mutate({ name: comp.name, url: comp.website });
                                }, 100);
                              }}
                            >
                              Analyze Citations
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {competitorResults.length > 0 && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Competitor Citation Results</CardTitle>
                    <CardDescription>
                      Found {competitorResults.length} directories where "{competitorName}" is listed
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {selectedListings.length > 0 && (
                      <Button
                        size="sm"
                        onClick={handleBulkAddFromCompetitors}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Selected ({selectedListings.length})
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCompetitor}
                    >
                      <FileTextIcon className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-x-auto border rounded-xl">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted text-muted-foreground font-medium border-b">
                        <tr>
                          <th className="px-4 py-2 w-10">
                            <Checkbox
                              checked={selectedListings.length === competitorResults.length && competitorResults.length > 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedListings(competitorResults.map((_, idx) => idx));
                                } else {
                                  setSelectedListings([]);
                                }
                              }}
                            />
                          </th>
                          <th className="px-4 py-2">Platform</th>
                          <th className="px-4 py-2">Domain</th>
                          <th className="px-4 py-2">Status</th>
                          <th className="px-4 py-2">Authority</th>
                          <th className="px-4 py-2">Your Listing</th>
                          <th className="px-4 py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {competitorResults.map((result, idx) => {
                          const yourListing = listings.find(l =>
                            l.directory_name?.toLowerCase() === result.platform?.toLowerCase() ||
                            l.listing_url?.includes(result.domain)
                          );

                          return (
                            <tr key={idx} className="hover:bg-muted/50 transition-colors">
                              <td className="px-4 py-2">
                                <Checkbox
                                  checked={selectedListings.includes(idx)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedListings([...selectedListings, idx]);
                                    } else {
                                      setSelectedListings(selectedListings.filter(i => i !== idx));
                                    }
                                  }}
                                />
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center border">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{result.platform}</p>
                                    {result.listing_url && (
                                      <a
                                        href={result.listing_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[12px] text-primary hover:underline flex items-center gap-1"
                                      >
                                        View Competitor <ExternalLink className="h-2 w-2" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                <span className="text-xs font-mono">{result.domain}</span>
                              </td>
                              <td className="px-4 py-2">
                                <Badge
                                  variant={result.status === 'listed' ? 'default' : 'secondary'}
                                  className="capitalize"
                                >
                                  {result.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">{result.authority || 'N/A'}</span>
                                  {result.authority && (
                                    <Progress value={result.authority} className="h-1.5 w-12" />
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                {yourListing ? (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-xs text-green-600 font-medium">Listed</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-orange-500" />
                                    <span className="text-xs text-orange-600 font-medium">Not Listed</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {yourListing ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditListing(yourListing)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Button>
                                ) : (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      // Find matching directory or create a new listing
                                      const matchingDir = directories?.find(d =>
                                        d.name.toLowerCase().includes(result.platform.toLowerCase()) ||
                                        d.url.includes(result.domain)
                                      );

                                      if (matchingDir) {
                                        setNewListing({
                                          ...newListing,
                                          directory_id: matchingDir.id,
                                          platform: matchingDir.code || '',
                                          directory_name: matchingDir.name,
                                          submission_data: {}
                                        });
                                        setWizardStep(2);
                                        setIsAddListingOpen(true);
                                      } else {
                                        // Create a manual listing
                                        createListingMutation.mutate({
                                          platform: result.platform,
                                          directory_id: null,
                                          directory_name: result.platform,
                                          listing_url: '',
                                          business_name: settings?.business_name || '',
                                          address: settings?.address || '',
                                          phone: settings?.phone || '',
                                          website: settings?.website || '',
                                          submission_type: 'manual',
                                          country: selectedCountry,
                                          submission_data: {
                                            competitor_discovered: true,
                                            competitor_name: competitorName,
                                            submission_url: result.submission_url || `https://${result.domain}`
                                          }
                                        });
                                      }
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Listing
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {selectedListings.length > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-4 flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {selectedListings.length} directories selected
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          // Bulk create listings for selected competitors
                          const selectedResults = competitorResults.filter((_, idx) => selectedListings.includes(idx));
                          const listingsToCreate = selectedResults
                            .filter(result => {
                              // Only create if not already listed
                              return !listings.some(l =>
                                l.directory_name?.toLowerCase() === result.platform?.toLowerCase() ||
                                l.listing_url?.includes(result.domain)
                              );
                            })
                            .map(result => {
                              const matchingDir = directories?.find(d =>
                                d.name.toLowerCase().includes(result.platform.toLowerCase()) ||
                                d.url.includes(result.domain)
                              );

                              return {
                                platform: result.platform,
                                directory_id: matchingDir?.id || null,
                                directory_name: result.platform,
                                business_name: settings?.business_name,
                                address: settings?.address,
                                phone: settings?.phone,
                                website: settings?.website,
                                submission_type: 'manual' as const,
                                country: selectedCountry,
                                submission_data: {
                                  competitor_discovered: true,
                                  competitor_name: competitorName,
                                  submission_url: result.submission_url || `https://${result.domain}`
                                }
                              };
                            });

                          if (listingsToCreate.length > 0) {
                            bulkCreateMutation.mutate(listingsToCreate);
                            setSelectedListings([]);
                          } else {
                            toast({
                              title: 'No new listings to create',
                              description: 'All selected directories are already in your listings.',
                              variant: 'default'
                            });
                          }
                        }}
                        disabled={bulkCreateMutation.isPending}
                      >
                        {bulkCreateMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ListPlus className="h-4 w-4 mr-2" />
                        )}
                        Add {selectedListings.length} Listings
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedListings([])}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {competitorResults.length === 0 && !checkCompetitorMutation.isPending && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Scan Your Competitors</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Enter a competitor's business name to discover where they're listed online.
                      You can then quickly add your business to the same directories to improve your online presence.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center pt-4">
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Discover Citations
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Bulk Submissions
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <FileTextIcon className="h-3 w-3 mr-1" />
                      Export Reports
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <CitationAudit
            activeCompanyId={activeCompanyId}
            listings={listings}
            settings={settings}
            onNavigateToListings={() => {
              const tabsList = document.querySelector('[data-state="active"][value="audit"]');
              if (tabsList) {
                const listingsTab = document.querySelector('[value="listings"]') as HTMLButtonElement;
                listingsTab?.click();
              }
            }}
            onEditListing={handleEditListing}
          />
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <ListingSettingsView activeCompanyId={activeCompanyId} defaultTab="profile" hideTabs />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <ListingSettingsView activeCompanyId={activeCompanyId} defaultTab="settings" hideTabs />
        </TabsContent>

        <TabsContent value="gmb" className="mt-6">
          <GMBManagement activeCompanyId={activeCompanyId} />
        </TabsContent>
      </Tabs>

      {/* Edit Listing Drawer */}
      <Dialog open={isEditDrawerOpen} onOpenChange={setIsEditDrawerOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
            <DialogDescription>Update business listing information</DialogDescription>
          </DialogHeader>
          {editingListing && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Directory</Label>
                <Input value={editingListing.directory_name} disabled />
              </div>
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input
                  value={editingListing.business_name || ''}
                  onChange={(e) => setEditingListing({ ...editingListing, business_name: e.target.value })}
                  placeholder="Business Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Listing URL</Label>
                <Input
                  value={editingListing.listing_url || ''}
                  onChange={(e) => setEditingListing({ ...editingListing, listing_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={editingListing.address || ''}
                  onChange={(e) => setEditingListing({ ...editingListing, address: e.target.value })}
                  placeholder="123 Main St, City, State"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={editingListing.phone || ''}
                  onChange={(e) => setEditingListing({ ...editingListing, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={editingListing.website || ''}
                  onChange={(e) => setEditingListing({ ...editingListing, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              {editingListing.directory_id && (
                <div className="space-y-2 border-t pt-4 mt-4">
                  <h4 className="text-sm font-semibold mb-2">Directory Specific Fields</h4>
                  <DirectoryFormRenderer
                    schema={directories?.find(d => d.id === editingListing.directory_id)?.form_schema}
                    values={editingListing.submission_data || {}}
                    onChange={(field, value) => setEditingListing({
                      ...editingListing,
                      submission_data: { ...(editingListing.submission_data || {}), [field]: value }
                    })}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDrawerOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={updateListingMutation.isPending}>
              {updateListingMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add URL Dialog */}
      <Dialog open={isAddUrlOpen} onOpenChange={setIsAddUrlOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Listing URL</DialogTitle>
            <DialogDescription>
              Enter the URL for the listing you manually created on {listingToAddUrl?.directory_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="manual-url">Listing URL</Label>
              <Input
                id="manual-url"
                placeholder="https://..."
                value={manualInputUrl}
                onChange={(e) => setManualInputUrl(e.target.value)}
              />
              <p className="text-[12px] text-muted-foreground">
                Once you add the URL, we will be able to track and sync this listing.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUrlOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (listingToAddUrl) {
                  updateListingMutation.mutate({
                    id: listingToAddUrl.id,
                    data: { listing_url: manualInputUrl, status: 'claimed' }
                  });
                }
              }}
              disabled={!manualInputUrl || updateListingMutation.isPending}
            >
              {updateListingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save URL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!listingToDelete} onOpenChange={(open) => !open && setListingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the listing from your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (listingToDelete) {
                  deleteListingMutation.mutate(listingToDelete);
                  setListingToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}

