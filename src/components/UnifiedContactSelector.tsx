import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Upload,
  Users,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  UserPlus,
  List as ListIcon,
  PieChart
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Contact } from '@/types/contact';

interface UnifiedContactSelectorProps {
  campaignType: 'email' | 'sms' | 'call';
  selectedContacts: Contact[];
  onContactsChange: (contacts: Contact[]) => void;
  maxContacts?: number;
  showUpload?: boolean;
  className?: string;
}

export const UnifiedContactSelector: React.FC<UnifiedContactSelectorProps> = ({
  campaignType,
  selectedContacts,
  onContactsChange,
  maxContacts,
  showUpload = true,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(selectedContacts.map(c => c.id))
  );
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [uploadData, setUploadData] = useState('');
  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    tags: [] as string[]
  });

  // List and Segment states
  const [showListDialog, setShowListDialog] = useState(false);
  const [showSegmentDialog, setShowSegmentDialog] = useState(false);
  const [availableLists, setAvailableLists] = useState<any[]>([]);
  const [availableSegments, setAvailableSegments] = useState<any[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<Set<string>>(new Set());
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<Set<string>>(new Set());
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);

  const { toast } = useToast();

  // Get all contacts from main contacts database
  const { data: allContacts = [], isLoading, error, refetch } = useQuery({
    queryKey: ['contacts', 'all'],
    queryFn: async () => {
      const result = await api.getContacts(); // Get all contacts without type filter
      return result;
    }
  });

  // Get unique tags for filtering
  const availableTags = React.useMemo(() => {
    const tags = new Set<string>();
    allContacts.forEach(contact => {
      if (contact.tags) {
        contact.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [allContacts]);

  // Filter contacts based on search and tags
  const filteredContacts = React.useMemo(() => {
    return allContacts.filter((contact: Contact) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fullName = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
        const searchableText = [
          fullName,
          contact.email || '',
          contact.phone || '',
          contact.company || ''
        ].join(' ').toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      // Tag filter
      if (tagFilter !== 'all') {
        if (!contact.tags || !contact.tags.includes(tagFilter)) {
          return false;
        }
      }

      // Campaign type compatibility
      if (campaignType === 'email' && !contact.email) {
        return false;
      }
      if (campaignType === 'sms' && !contact.phone) {
        return false;
      }
      if (campaignType === 'call' && !contact.phone) {
        return false;
      }

      return true;
    });
  }, [allContacts, searchQuery, tagFilter, campaignType]);

  // Handle contact selection
  const handleContactToggle = (contact: Contact) => {
    const newSelectedIds = new Set(selectedIds);

    if (newSelectedIds.has(contact.id)) {
      newSelectedIds.delete(contact.id);
    } else {
      if (maxContacts && newSelectedIds.size >= maxContacts) {
        toast({
          title: "Maximum contacts reached",
          description: `You can select up to ${maxContacts} contacts`,
          variant: "destructive"
        });
        return;
      }
      newSelectedIds.add(contact.id);
    }

    setSelectedIds(newSelectedIds);
    updateSelectedContacts(newSelectedIds);
  };

  // Update parent component with selected contacts
  const updateSelectedContacts = (ids: Set<string>) => {
    const selected = allContacts.filter(contact => ids.has(contact.id));
    onContactsChange(selected);
  };

  // Handle CSV upload
  const handleUpload = async () => {
    try {
      const lines = uploadData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      const contacts: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const contact: any = {};

        headers.forEach((header, index) => {
          contact[header] = values[index] || '';
        });

        // Ensure required fields based on campaign type
        if (campaignType === 'email' && contact.email) {
          contacts.push(contact);
        } else if (campaignType === 'sms' && contact.phone) {
          contacts.push(contact);
        } else if (campaignType === 'call' && contact.phone) {
          contacts.push(contact);
        }
      }

      // Add contacts to main database
      for (const contact of contacts) {
        await api.createContact({
          ...contact,
          tags: [...(contact.tags || []), campaignType] // Tag with campaign type
        });
      }

      toast({
        title: "Contacts uploaded successfully",
        description: `${contacts.length} contacts have been added to your main contacts list`
      });

      setShowUploadDialog(false);
      setUploadData('');
      refetch(); // Refresh contacts list
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Please check your CSV format and try again",
        variant: "destructive"
      });
    }
  };

  // Handle manual contact creation
  const handleCreateContact = async () => {
    try {
      const contactData = {
        ...newContact,
        tags: [...newContact.tags, campaignType] // Tag with campaign type
      };

      await api.createContact(contactData);

      toast({
        title: "Contact created successfully",
        description: `${newContact.firstName} ${newContact.lastName} has been added to your contacts`
      });

      setShowCreateDialog(false);
      setNewContact({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        tags: []
      });
      refetch(); // Refresh contacts list
    } catch (error) {
      toast({
        title: "Failed to create contact",
        description: "Please check your input and try again",
        variant: "destructive"
      });
    }
  };

  // Select all visible contacts
  const handleSelectAll = () => {
    const newSelectedIds = new Set<string>();
    filteredContacts.forEach(contact => {
      if (!maxContacts || newSelectedIds.size < maxContacts) {
        newSelectedIds.add(contact.id);
      }
    });
    setSelectedIds(newSelectedIds);
    updateSelectedContacts(newSelectedIds);
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedIds(new Set());
    updateSelectedContacts(new Set());
  };

  // Load Lists
  const loadLists = async () => {
    setIsLoadingLists(true);
    try {
      const lists = await api.getLists();
      setAvailableLists(lists || []);
    } catch (error) {
      console.error('Failed to load lists:', error);
      toast({ title: 'Error', description: 'Failed to load contact lists', variant: 'destructive' });
    } finally {
      setIsLoadingLists(false);
    }
  };

  // Load Segments
  const loadSegments = async () => {
    setIsLoadingSegments(true);
    try {
      const segments = await api.getSegments();
      setAvailableSegments(segments || []);
    } catch (error) {
      console.error('Failed to load segments:', error);
      toast({ title: 'Error', description: 'Failed to load segments', variant: 'destructive' });
    } finally {
      setIsLoadingSegments(false);
    }
  };

  const handleImportLists = async () => {
    setIsLoadingLists(true);
    try {
      let importedCount = 0;
      const newContacts: Contact[] = [];
      const currentIds = new Set(selectedIds);

      for (const listId of selectedListIds) {
        // Fetch contacts for this list (pagination loop could be added here for large lists)
        const response = await api.getListContacts(listId, 1, 1000); // Limit to 1000 for now
        const listContacts = response.items || [];

        listContacts.forEach((contact: any) => {
          // Normalize contact object if necessary
          const normalized: Contact = {
            id: String(contact.id),
            name: contact.name,
            firstName: contact.firstName || contact.first_name,
            lastName: contact.lastName || contact.last_name,
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
            tags: contact.tags || [],
            status: 'active',
            type: campaignType === 'call' ? 'call' : campaignType === 'sms' ? 'sms' : 'email'
          };

          // Check compatibility
          const isCompatible = (campaignType === 'email' && normalized.email) ||
            (['sms', 'call'].includes(campaignType) && normalized.phone);

          if (isCompatible && !currentIds.has(normalized.id)) {
            currentIds.add(normalized.id);
            newContacts.push(normalized);
            importedCount++;
          }
        });
      }

      // We need to merge these new contacts with allContacts if they aren't there, 
      // but UnifiedContactSelector relies on 'allContacts' from useQuery props.
      // Logic: standard approach is to trust 'allContacts' has everything, but 
      // specific list contacts might not be loaded if 'allContacts' is paginated.
      // For now, let's assume we select them by ID if they exist in allContacts, 
      // OR push them to selectedContacts directly. 
      // Since 'updateSelectedContacts' filters from 'allContacts', we might miss them if not in 'allContacts'.
      // Better approach: combine 'allContacts' with these new ones.
      // However, we can't easily update 'allContacts' query cache here without complex react-query operations.
      // Instead, let's just emit them.

      // Update selected IDs
      setSelectedIds(currentIds);

      // We need to pass the FULL list of selected contacts back. 
      // The current updateSelectedContacts filters from allContacts. 
      // We should augment that.
      const currentlySelected = allContacts.filter(c => currentIds.has(c.id));

      // Find ones that are in newContacts but weren't in allContacts (if any)
      const missingFromMain = newContacts.filter(nc => !allContacts.find(ac => ac.id === nc.id));

      onContactsChange([...currentlySelected, ...missingFromMain]);

      setShowListDialog(false);
      setSelectedListIds(new Set());
      toast({ title: 'Import Successful', description: `${importedCount} contacts imported from selected lists.` });

    } catch (error) {
      console.error('Import failed:', error);
      toast({ title: 'Import Failed', description: 'Could not import contacts from lists.', variant: 'destructive' });
    } finally {
      setIsLoadingLists(false);
    }
  };

  const handleImportSegments = async () => {
    setIsLoadingSegments(true);
    try {
      let importedCount = 0;
      const newContacts: Contact[] = [];
      const currentIds = new Set(selectedIds);

      for (const segmentId of selectedSegmentIds) {
        const response = await api.getSegmentContacts(segmentId, 1, 1000);
        const segmentContacts = response.items || [];

        segmentContacts.forEach((contact: any) => {
          const normalized: Contact = {
            id: String(contact.id),
            name: contact.name,
            firstName: contact.firstName || contact.first_name,
            lastName: contact.lastName || contact.last_name,
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
            tags: contact.tags || [],
            status: 'active',
            type: campaignType === 'call' ? 'call' : campaignType === 'sms' ? 'sms' : 'email'
          };

          const isCompatible = (campaignType === 'email' && normalized.email) ||
            (['sms', 'call'].includes(campaignType) && normalized.phone);

          if (isCompatible && !currentIds.has(normalized.id)) {
            currentIds.add(normalized.id);
            newContacts.push(normalized);
            importedCount++;
          }
        });
      }

      setSelectedIds(currentIds);
      const currentlySelected = allContacts.filter(c => currentIds.has(c.id));
      const missingFromMain = newContacts.filter(nc => !allContacts.find(ac => ac.id === nc.id));

      onContactsChange([...currentlySelected, ...missingFromMain]);

      setShowSegmentDialog(false);
      setSelectedSegmentIds(new Set());
      toast({ title: 'Import Successful', description: `${importedCount} contacts imported from selected segments.` });
    } catch (error) {
      console.error('Import failed:', error);
      toast({ title: 'Import Failed', description: 'Could not import contacts from segments.', variant: 'destructive' });
    } finally {
      setIsLoadingSegments(false);
    }
  };

  const toggleListSelection = (listId: string) => {
    const newSet = new Set(selectedListIds);
    if (newSet.has(listId)) newSet.delete(listId);
    else newSet.add(listId);
    setSelectedListIds(newSet);
  };

  const toggleSegmentSelection = (segmentId: string) => {
    const newSet = new Set(selectedSegmentIds);
    if (newSet.has(segmentId)) newSet.delete(segmentId);
    else newSet.add(segmentId);
    setSelectedSegmentIds(newSet);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Select Contacts
          {selectedContacts.length > 0 && (
            <Badge variant="secondary">{selectedContacts.length} selected</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Choose contacts from your main contacts database. Contacts are shared across all campaign types.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {availableTags.length > 0 && (
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {availableTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSelectAll}>
            Select All Visible
          </Button>
          <Button variant="outline" onClick={handleClearSelection}>
            Clear Selection
          </Button>

          <Dialog open={showListDialog} onOpenChange={(open) => {
            setShowListDialog(open);
            if (open) loadLists();
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ListIcon className="h-4 w-4 mr-2" />
                Import List
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Import from List</DialogTitle>
                <DialogDescription>Select one or more lists to add contacts from.</DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto py-4">
                {isLoadingLists ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : availableLists.length === 0 ? (
                  <p className="text-center text-muted-foreground p-4">No lists found.</p>
                ) : (
                  <div className="space-y-2">
                    {availableLists.map(list => (
                      <div key={list.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded text-sm">
                        <Checkbox
                          id={`list-${list.id}`}
                          checked={selectedListIds.has(list.id)}
                          onCheckedChange={() => toggleListSelection(list.id)}
                        />
                        <Label htmlFor={`list-${list.id}`} className="flex-1 cursor-pointer">
                          {list.name} <span className="text-xs text-muted-foreground">({list.count || 0} contacts)</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowListDialog(false)}>Cancel</Button>
                <Button onClick={handleImportLists} disabled={selectedListIds.size === 0 || isLoadingLists}>
                  Import Selected
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showSegmentDialog} onOpenChange={(open) => {
            setShowSegmentDialog(open);
            if (open) loadSegments();
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <PieChart className="h-4 w-4 mr-2" />
                Import Segment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Import from Segment</DialogTitle>
                <DialogDescription>Select one or more segments to add contacts from.</DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto py-4">
                {isLoadingSegments ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : availableSegments.length === 0 ? (
                  <p className="text-center text-muted-foreground p-4">No segments found.</p>
                ) : (
                  <div className="space-y-2">
                    {availableSegments.map(segment => (
                      <div key={segment.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded text-sm">
                        <Checkbox
                          id={`seg-${segment.id}`}
                          checked={selectedSegmentIds.has(segment.id)}
                          onCheckedChange={() => toggleSegmentSelection(segment.id)}
                        />
                        <Label htmlFor={`seg-${segment.id}`} className="flex-1 cursor-pointer">
                          {segment.name} <span className="text-xs text-muted-foreground">({segment.contacts_count || 0} contacts)</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowSegmentDialog(false)}>Cancel</Button>
                <Button onClick={handleImportSegments} disabled={selectedSegmentIds.size === 0 || isLoadingSegments}>
                  Import Selected
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {showUpload && (
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Contacts</DialogTitle>
                  <DialogDescription>
                    Upload contacts from a CSV file. Headers should include: firstName, lastName, email, phone, company
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="csv-data">CSV Data</Label>
                    <Textarea
                      id="csv-data"
                      placeholder="firstName,lastName,email,phone,company&#10;John,Doe,john@example.com,555-1234,Acme Corp&#10;Jane,Smith,jane@example.com,555-5678,Tech Inc"
                      value={uploadData}
                      onChange={(e) => setUploadData(e.target.value)}
                      rows={8}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpload}>Upload Contacts</Button>
                    <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Contact</DialogTitle>
                <DialogDescription>
                  Add a new contact to your main contacts database
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newContact.firstName}
                      onChange={(e) => setNewContact(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newContact.lastName}
                      onChange={(e) => setNewContact(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email {campaignType === 'email' && '*'}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    required={campaignType === 'email'}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone {(['sms', 'call'].includes(campaignType)) && '*'}</Label>
                  <Input
                    id="phone"
                    value={newContact.phone}
                    onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                    required={['sms', 'call'].includes(campaignType)}
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={newContact.company}
                    onChange={(e) => setNewContact(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateContact}>Create Contact</Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Campaign Type Indicator */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center gap-2">
            {campaignType === 'email' && <Mail className="h-4 w-4 text-blue-600" />}
            {campaignType === 'sms' && <MessageSquare className="h-4 w-4 text-blue-600" />}
            {campaignType === 'call' && <Phone className="h-4 w-4 text-blue-600" />}
            <span className="text-sm font-medium text-blue-800">
              {campaignType === 'email' && 'Email Campaign - Contacts with email addresses'}
              {campaignType === 'sms' && 'SMS Campaign - Contacts with phone numbers'}
              {campaignType === 'call' && 'Call Campaign - Contacts with phone numbers'}
            </span>
          </div>
        </div>

        {/* Contacts Table */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading contacts...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">Failed to load contacts</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-2">
              Retry
            </Button>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No contacts found</p>
            <p className="text-xs text-muted-foreground">
              {campaignType === 'email' && 'Make sure contacts have email addresses'}
              {(['sms', 'call'].includes(campaignType)) && 'Make sure contacts have phone numbers'}
            </p>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.size === filteredContacts.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleSelectAll();
                        } else {
                          handleClearSelection();
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>
                    {campaignType === 'email' ? 'Email' : 'Phone'}
                  </TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => {
                  const isSelected = selectedIds.has(contact.id);
                  const fullName = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
                  const contactMethod = campaignType === 'email' ? contact.email : contact.phone;
                  const isCompatible = campaignType === 'email' ? !!contact.email : !!contact.phone;

                  return (
                    <TableRow
                      key={contact.id}
                      className={isSelected ? 'bg-blue-50' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleContactToggle(contact)}
                          disabled={!isCompatible}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {fullName || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {contactMethod || (
                          <span className="text-muted-foreground text-sm">
                            {campaignType === 'email' ? 'No email' : 'No phone'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{contact.company || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {contact.tags?.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {isCompatible ? (
                          <CheckCircle className="h-4 w-4 text-green-600 inline" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-600 inline" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Selection Summary */}
        {selectedContacts.length > 0 && (
          <div className="border rounded-md p-4 bg-green-50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-800">
                  {selectedContacts.length} contacts selected
                </h4>
                <p className="text-sm text-green-600">
                  Ready for {campaignType} campaign
                </p>
              </div>
              <Button variant="outline" onClick={handleClearSelection}>
                Clear Selection
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
