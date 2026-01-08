import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  Upload,
  Download,
  Plus,
  Filter,
  MoreVertical,
  Smartphone,
  User,
  Building,
  Tag,
  Mail,
  Phone,
  MapPin,
  Globe,
  RefreshCw,
  Trash2,
  Edit3,
  Send,
  Users,
  Settings,
  CheckCircle,
  ChevronDown,
} from 'lucide-react';

import { toast } from 'sonner';
import { api } from '../lib/api';
import { smsAPI, type SMSRecipient as ApiSMSRecipient } from '../lib/sms-api';

type SMSRecipient = ApiSMSRecipient & {
  tags?: string[];
  message_count?: number;
  last_activity?: string;
  location?: string;
  source?: string;
};

interface Group {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  campaign_count?: number;
  sequence_count?: number;
  template_count?: number;
  recipient_count?: number;
}

const SMSRecipients = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [recipients, setRecipients] = useState<SMSRecipient[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<SMSRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewRecipientModal, setShowNewRecipientModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [newRecipient, setNewRecipient] = useState({
    phone_number: '',
    first_name: '',
    last_name: '',
    company: '',
    tags: '',
    group_id: 'none'
  });

  useEffect(() => {

    loadRecipients();
    loadGroups();
    // Show new recipient modal if on the new route
    if (location.pathname === '/reach/outbound/sms/recipients/new' || location.pathname === '/sms/recipients/new') {
      setShowNewRecipientModal(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    filterRecipients();
  }, [recipients, searchQuery, statusFilter, tagFilter, selectedGroup]);

  const loadRecipients = async () => {
    try {
      setLoading(true);
      const data = await smsAPI.getSMSRecipients();
      setRecipients(data || []);
    } catch (error) {
      console.error('Error loading recipients:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load recipients';
      toast.error(`Failed to load recipients: ${errorMessage}`);
      setRecipients([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await api.getGroups();
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Failed to load groups');
    }
  };

  const filterRecipients = () => {
    let filtered = recipients;

    if (selectedGroup !== 'all') {
      filtered = filtered.filter(recipient => recipient.group_id === selectedGroup);
    }

    if (searchQuery) {
      filtered = filtered.filter(recipient =>
        recipient.phone_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipient.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipient.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipient.company?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(recipient => recipient.status === statusFilter);
    }

    if (tagFilter !== 'all') {
      filtered = filtered.filter(recipient => recipient.tags?.includes(tagFilter));
    }

    setFilteredRecipients(filtered);
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev =>
      prev.includes(id)
        ? prev.filter(recipientId => recipientId !== id)
        : [...prev, id]
    );
  };

  const selectAllRecipients = () => {
    setSelectedRecipients(filteredRecipients.map(r => r.id));
  };

  const clearAllRecipients = () => {
    setSelectedRecipients([]);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedRecipients.length === 0) {
      toast.error('Please select recipients first');
      return;
    }

    try {
      switch (action) {
        case 'export':
          await handleExport();
          break;
        case 'unsubscribe':
          // Update each recipient individually
          for (const recipientId of selectedRecipients) {
            await api.updateSMSRecipient(recipientId, { status: 'opted_out' });
          }
          toast.success(`${selectedRecipients.length} recipients unsubscribed`);
          loadRecipients();
          setSelectedRecipients([]);
          break;
        case 'delete':
          // Delete each recipient individually
          for (const recipientId of selectedRecipients) {
            await api.deleteSMSRecipient(recipientId);
          }
          toast.success(`${selectedRecipients.length} recipients deleted`);
          loadRecipients();
          setSelectedRecipients([]);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const handleIndividualAction = async (recipientId: string, action: string) => {
    try {
      switch (action) {
        case 'edit': {
          // Open edit modal instead of navigating to non-existent route
          const recipient = recipients.find(r => r.id === recipientId);
          if (recipient) {
            setNewRecipient({
              phone_number: recipient.phone_number,
              first_name: recipient.first_name,
              last_name: recipient.last_name,
              company: recipient.company || '',
              tags: recipient.tags?.join(', ') || '',
              group_id: recipient.group_id || 'none'
            });
            setShowNewRecipientModal(true);
          }
          break;
        }
        case 'send': {
          navigate(`/reach/outbound/sms/campaigns/new?recipient=${recipientId}`);
          break;
        }
        case 'unsubscribe':
          await api.updateSMSRecipient(recipientId, { opt_in_status: 'opted_out' });
          toast.success('Recipient unsubscribed');
          loadRecipients();
          break;
        case 'delete':
          await api.deleteSMSRecipient(recipientId);
          toast.success('Recipient deleted');
          loadRecipients();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error performing individual action:', error);
      toast.error('Failed to perform action');
    }
  };

  const getAllTags = () => {
    const tags = new Set<string>();
    recipients.forEach(recipient => {
      recipient.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  };

  const handleCreateRecipient = async () => {
    try {
      if (!newRecipient.phone_number) {
        toast.error('Phone number is required');
        return;
      }

      const recipientData = {
        phone_number: newRecipient.phone_number,
        first_name: newRecipient.first_name,
        last_name: newRecipient.last_name,
        company: newRecipient.company,
        tags: newRecipient.tags ? newRecipient.tags.split(',').map(tag => tag.trim()) : [],
        group_id: newRecipient.group_id === 'none' ? null : newRecipient.group_id
      };

      await smsAPI.createSMSRecipient(recipientData);
      toast.success('SMS recipient created successfully');
      setShowNewRecipientModal(false);
      setNewRecipient({
        phone_number: '',
        first_name: '',
        last_name: '',
        company: '',
        tags: '',
        group_id: 'none'
      });
      loadRecipients();
    } catch (error) {
      console.error('Error creating recipient:', error);
      toast.error('Failed to create recipient');
    }
  };

  const handleBulkMoveToGroup = async (groupId: string) => {
    if (selectedRecipients.length === 0) {
      toast.error('Please select recipients first');
      return;
    }

    try {
      // If 'none' is selected, move recipients out of any group (set group_id to null)
      const targetGroupId = groupId === 'none' ? null : groupId;
      await api.bulkMoveSMSRecipientsToGroup(selectedRecipients, targetGroupId);
      toast.success(`${selectedRecipients.length} recipients moved to group`);
      loadRecipients();
      setSelectedRecipients([]);
      setShowGroupModal(false);
    } catch (error) {
      console.error('Error moving recipients to group:', error);
      toast.error('Failed to move recipients to group');
    }
  };

  const handleCreateGroup = async () => {
    try {
      const groupName = `Group ${Date.now()}`; // Generate a default name
      await api.createGroup({ name: groupName });
      toast.success('Group created successfully');
      loadGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    }
  };

  const handleCloseModal = () => {
    setShowNewRecipientModal(false);
    setNewRecipient({
      phone_number: '',
      first_name: '',
      last_name: '',
      company: '',
      tags: '',
      group_id: 'none'
    });
    navigate('/contacts');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const result = await smsAPI.importRecipientsFromCSV(file);
        toast.success(`Successfully imported ${result.imported} recipients`);
        loadRecipients();
      } catch (error) {
        console.error('Error importing recipients:', error);
        toast.error('Failed to import recipients');
      }
    };
    input.click();
  };

  const handleExport = async () => {
    try {
      const csvContent = await smsAPI.exportRecipientsToCSV();

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sms-recipients.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Recipients exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export recipients');
    }
  };

  const handleDownloadTemplate = () => {
    try {
      const templateContent = [
        ['Phone', 'First Name', 'Last Name', 'Company', 'Tags'],
        ['+1234567890', 'John', 'Doe', 'Company Name', 'tag1,tag2'],
        ['+1987654321', 'Jane', 'Smith', 'Another Company', 'tag3']
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([templateContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sms-recipients-template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Download template error:', error);
      toast.error('Failed to download template');
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-[18px] font-bold">SMS Recipients</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your SMS contact list</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/settings#sms')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={handleCreateGroup}>
              <Users className="h-4 w-4 mr-2" />
              Create Group
            </Button>
            <Button onClick={() => navigate('/reach/outbound/sms/campaigns')}>
              <Send className="h-4 w-4 mr-2" />
              Campaigns
            </Button>
            <Button onClick={() => navigate('/reach/inbound/sms/contacts')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Recipient
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-analytics">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[18px] font-bold">{recipients.length}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Recipients</div>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-analytics">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[18px] font-bold">{recipients.filter(r => r.status === 'active').length}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Active</div>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-analytics">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[18px] font-bold">{recipients.filter(r => r.status === 'unsubscribed').length}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Unsubscribed</div>
                </div>
                <Mail className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-analytics">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[18px] font-bold">{recipients.reduce((sum, r) => sum + (r.message_count || 0), 0)}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Messages</div>
                </div>
                <Smartphone className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-analytics">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recipients List</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                <Button variant="outline" size="sm" onClick={handleImport}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <Label>Search</Label>
                  <div className="relative">
                    <Input
                      placeholder="Search recipients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                <div>
                  <Label>Group</Label>
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="All groups" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      {groups.map(group => (
                        <SelectItem key={group.id} value={group.id}>{group.name} ({group.recipient_count})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="opted_out">Opted Out</SelectItem>
                      <SelectItem value="invalid">Invalid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tags</Label>
                  <Select value={tagFilter} onValueChange={setTagFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All tags" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tags</SelectItem>
                      {getAllTags().map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {selectedRecipients.length > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">{selectedRecipients.length}</span> recipients selected
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllRecipients}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearAllRecipients}>
                      Clear All
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Bulk Actions
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleBulkAction('export')}>
                          <Download className="h-4 w-4 mr-2" />
                          Export Selected
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkAction('unsubscribe')}>
                          <Mail className="h-4 w-4 mr-2" />
                          Unsubscribe Selected
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowGroupModal(true)}>
                          <Users className="h-4 w-4 mr-2" />
                          Move to Group
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkAction('delete')}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Selected
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                <Progress value={33} className="w-full" />
                <div className="text-center text-gray-500 dark:text-gray-400">Loading recipients...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedRecipients.length === filteredRecipients.length && filteredRecipients.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) selectAllRecipients();
                            else clearAllRecipients();
                          }}
                        />
                      </TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecipients.map((recipient) => (
                      <TableRow key={recipient.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRecipients.includes(recipient.id)}
                            onCheckedChange={(checked) => toggleRecipient(recipient.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{recipient.phone_number}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{recipient.first_name} {recipient.last_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {recipient.company && (
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-gray-400" />
                              {recipient.company}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {recipient.tags?.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {recipient.message_count || 0} messages
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {recipient.last_activity ? new Date(recipient.last_activity).toLocaleDateString() : 'Never'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={recipient.status === 'active' ? 'default' : 'secondary'}>
                            {recipient.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleIndividualAction(recipient.id, 'edit')}>
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleIndividualAction(recipient.id, 'send')}>
                                <Send className="h-4 w-4 mr-2" />
                                Send SMS
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleIndividualAction(recipient.id, 'unsubscribe')}>
                                <Mail className="h-4 w-4 mr-2" />
                                Unsubscribe
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleIndividualAction(recipient.id, 'delete')}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredRecipients.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recipients found</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/reach/inbound/sms/contacts')}>
                      Add Your First Recipient
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Recipient Modal */}
      <Dialog open={showNewRecipientModal} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New SMS Recipient</DialogTitle>
            <DialogDescription>
              Enter the recipient's phone number and optional details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="+1234567890"
                value={newRecipient.phone_number}
                onChange={(e) => setNewRecipient({ ...newRecipient, phone_number: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={newRecipient.first_name}
                onChange={(e) => setNewRecipient({ ...newRecipient, first_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={newRecipient.last_name}
                onChange={(e) => setNewRecipient({ ...newRecipient, last_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Acme Corp"
                value={newRecipient.company}
                onChange={(e) => setNewRecipient({ ...newRecipient, company: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="customer, vip, prospect"
                value={newRecipient.tags}
                onChange={(e) => setNewRecipient({ ...newRecipient, tags: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="group">Group</Label>
              <Select value={newRecipient.group_id} onValueChange={(value) => setNewRecipient({ ...newRecipient, group_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a group (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Group</SelectItem>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleCreateRecipient}>
              Add Recipient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Selection Modal */}
      <Dialog open={showGroupModal} onOpenChange={setShowGroupModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move Recipients to Group</DialogTitle>
            <DialogDescription>
              Select a group to move {selectedRecipients.length} recipient(s) to.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="group-select">Group</Label>
              <Select value="none" onValueChange={(value) => {
                if (value === 'create-new') {
                  handleCreateGroup();
                } else {
                  handleBulkMoveToGroup(value);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>{group.name} ({group.recipient_count} recipients)</SelectItem>
                  ))}
                  <SelectItem value="create-new">+ Create New Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGroupModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SMSRecipients;
