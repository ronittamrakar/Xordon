import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Edit,
  MoreHorizontal,
  TrendingUp,
  Users,
  Target,
  DollarSign
} from 'lucide-react';
import { api } from '@/lib/api';
import { Lead, LeadFilters, LeadStage, CreateLeadData, UpdateLeadData } from '@/types/crm';
import { LEAD_STAGES } from '@/types/crm';
import type { Contact } from '@/types/contact';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCallSession } from '@/contexts/CallSessionContext';

interface LeadsPageProps {
  hideHeader?: boolean;
}

const LeadsPage: React.FC<LeadsPageProps> = ({ hideHeader = false }) => {
  const navigate = useNavigate();
  const { requestSoftphoneCall } = useCallSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LeadFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [initialContactId, setInitialContactId] = useState<string>('');
  const location = useLocation();

  useEffect(() => {
    if (location.state) {
      const state = location.state as any;
      if (state.create) {
        setIsCreateDialogOpen(true);
      }
      if (state.contactId) {
        setInitialContactId(state.contactId);
      }
    }
  }, [location.state]);

  useEffect(() => {
    loadLeads();
    loadContacts();
  }, [pagination.page, pagination.limit, filters]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const response = await api.crm.getLeads({
        page: pagination.page,
        limit: pagination.limit,
        stage: filters.stage,
        source: filters.source,
        search: filters.search
      });

      if (!response || !response.leads) {
        throw new Error('Invalid response from server');
      }

      const transformedLeads = response.leads.map((lead: any) => ({
        ...lead,
        contactId: lead.contact_id,
        leadStage: lead.lead_stage,
        leadValue: lead.lead_value ? parseFloat(lead.lead_value) : undefined,
        leadScore: lead.lead_score ? parseInt(lead.lead_score) : undefined,
        probability: lead.probability ? parseInt(lead.probability) : undefined,
        lastActivityAt: lead.last_activity_at,
        createdAt: lead.created_at,
        updatedAt: lead.updated_at
      }));

      setLeads(transformedLeads);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages
      }));
    } catch (error) {
      console.error('Failed to load leads:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load leads';
      toast.error(errorMessage);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const data = await api.getContacts();
      if (!data) {
        throw new Error('No contacts data received');
      }
      setContacts(data);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load contacts';
      toast.error(errorMessage);
      setContacts([]);
    }
  };

  const createLead = async (data: CreateLeadData) => {
    try {
      await api.crm.createLead(data as unknown as Record<string, unknown>);
      toast.success('Lead created successfully');
      setIsCreateDialogOpen(false);
      loadLeads();
    } catch (error) {
      console.error('Failed to create lead:', error);
      toast.error('Failed to create lead');
    }
  };

  const updateLead = async (leadId: string, data: UpdateLeadData) => {
    try {
      await api.crm.updateLead(leadId, data as unknown as Record<string, unknown>);
      toast.success('Lead updated successfully');
      setIsEditDialogOpen(false);
      setSelectedLead(null);
      loadLeads();
    } catch (error) {
      console.error('Failed to update lead:', error);
      toast.error('Failed to update lead');
    }
  };

  const getStageColor = (stage: LeadStage) => {
    const stageConfig = LEAD_STAGES.find(s => s.value === stage);
    return stageConfig?.color || '#6c757d';
  };

  const getStageLabel = (stage: LeadStage) => {
    const stageConfig = LEAD_STAGES.find(s => s.value === stage);
    return stageConfig?.label || stage;
  };

  const handleFilterChange = (key: keyof LeadFilters, value: any) => {
    // Treat special "all" marker as no filter
    const normalized = value === 'all' || value === '' ? undefined : value;
    setFilters(prev => ({ ...prev, [key]: normalized }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const openEditDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Deals</h1>
            <p className="text-gray-600">Manage and track your sales opportunities</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Deal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Deal</DialogTitle>
                <DialogDescription className="sr-only">
                  Fill in the details below to create a new deal in the CRM.
                </DialogDescription>
              </DialogHeader>
              <CreateLeadForm onSubmit={createLead} onCancel={() => setIsCreateDialogOpen(false)} contacts={contacts} initialContactId={initialContactId} />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search leads..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="stage">Stage</Label>
              <Select
                value={filters.stage || 'all'}
                onValueChange={(value) => handleFilterChange('stage', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  {LEAD_STAGES.map(stage => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                placeholder="Lead source..."
                value={filters.source || ''}
                onChange={(e) => handleFilterChange('source', e.target.value)}
              />
            </div>

            <div className="flex items-end space-x-2">
              <Button variant="outline" onClick={() => setFilters({})}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Leads ({pagination.total})</span>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{pagination.total} total</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No leads found</p>
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first lead
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div>
                        <button
                          onClick={() => navigate(`/contacts/${lead.contactId}`)}
                          className="text-left font-medium text-primary hover:underline"
                        >
                          {lead.contact?.firstName && lead.contact?.lastName
                            ? `${lead.contact.firstName} ${lead.contact.lastName}`
                            : lead.contact?.email || 'Unknown'}
                        </button>
                        <div className="text-sm text-gray-500">{lead.contact?.email}</div>
                        {lead.contact?.phone && (
                          <div className="text-sm text-gray-500">{lead.contact.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{lead.contact?.company || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        style={{ backgroundColor: getStageColor(lead.leadStage), color: 'white' }}
                      >
                        {getStageLabel(lead.leadStage)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{lead.leadScore}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.leadValue ? (
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span className="font-medium">${lead.leadValue.toLocaleString()}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{lead.source || '-'}</TableCell>
                    <TableCell>
                      {lead.lastActivityAt ? (
                        <div className="text-sm text-gray-500">
                          {format(new Date(lead.lastActivityAt), 'MMM d, yyyy')}
                        </div>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/reach/inbound/email/replies?contactId=${lead.contactId}&email=${lead.contact?.email}`)}
                          title="Send Email"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/reach/inbound/sms/replies?contactId=${lead.contactId}&phone=${lead.contact?.phone}`)}
                          title="Send SMS"
                          disabled={!lead.contact?.phone}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (lead.contact?.phone) {
                              requestSoftphoneCall({
                                number: lead.contact.phone,
                                recipientName: lead.contact.firstName && lead.contact.lastName
                                  ? `${lead.contact.firstName} ${lead.contact.lastName}`
                                  : lead.contact.name || 'Unknown',
                                source: 'dialer'
                              });
                            } else {
                              toast.error('No phone number available for this contact');
                            }
                          }}
                          title="Make Call"
                          disabled={!lead.contact?.phone}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(lead)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Lead Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Update lead information and status
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <EditLeadForm
              lead={selectedLead}
              contacts={contacts}
              onSubmit={(data) => updateLead(selectedLead.id, data)}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedLead(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Create Lead Form Component
const CreateLeadForm: React.FC<{
  onSubmit: (data: CreateLeadData) => void;
  onCancel: () => void;
  contacts: Contact[];
  initialContactId?: string;
}> = ({ onSubmit, onCancel, contacts, initialContactId }) => {
  const [formData, setFormData] = useState<CreateLeadData>({
    contactId: initialContactId || '',
    leadScore: 0,
    leadStage: 'new',
    leadValue: 0,
    probability: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="contactId">Contact *</Label>
        <Select value={formData.contactId} onValueChange={(value) => setFormData(prev => ({ ...prev, contactId: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select a contact" />
          </SelectTrigger>
          <SelectContent>
            {contacts.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : c.name || c.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="leadStage">Stage</Label>
        <Select value={formData.leadStage} onValueChange={(value) => setFormData(prev => ({ ...prev, leadStage: value as LeadStage }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEAD_STAGES.map(stage => (
              <SelectItem key={stage.value} value={stage.value}>
                {stage.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="leadScore">Lead Score</Label>
          <Input
            id="leadScore"
            type="number"
            min="0"
            max="100"
            value={formData.leadScore}
            onChange={(e) => setFormData(prev => ({ ...prev, leadScore: parseInt(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <Label htmlFor="leadValue">Deal Value ($)</Label>
          <Input
            id="leadValue"
            type="number"
            min="0"
            step="0.01"
            value={formData.leadValue}
            onChange={(e) => setFormData(prev => ({ ...prev, leadValue: parseFloat(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="source">Source</Label>
        <Input
          id="source"
          placeholder="e.g., Website, Referral, Cold Call"
          value={formData.source || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Create Lead
        </Button>
      </DialogFooter>
    </form>
  );
};

// Edit Lead Form Component
const EditLeadForm: React.FC<{
  lead: Lead;
  contacts: Contact[];
  onSubmit: (data: UpdateLeadData) => void;
  onCancel: () => void;
}> = ({ lead, contacts, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<UpdateLeadData>({
    leadStage: lead.leadStage,
    leadValue: lead.leadValue,
    leadScore: lead.leadScore,
    contactId: lead.contactId,
    probability: lead.probability,
    source: lead.source
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="contact">Contact</Label>
        <Select
          value={formData.contactId || ''}
          onValueChange={(value) => setFormData(prev => ({ ...prev, contactId: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a contact" />
          </SelectTrigger>
          <SelectContent>
            {contacts.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : c.name || c.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="leadStage">Stage</Label>
        <Select value={formData.leadStage} onValueChange={(value) => setFormData(prev => ({ ...prev, leadStage: value as LeadStage }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEAD_STAGES.map(stage => (
              <SelectItem key={stage.value} value={stage.value}>
                {stage.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="leadScore">Lead Score</Label>
          <Input
            id="leadScore"
            type="number"
            min="0"
            max="100"
            value={formData.leadScore || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, leadScore: parseInt(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <Label htmlFor="leadValue">Deal Value ($)</Label>
          <Input
            id="leadValue"
            type="number"
            min="0"
            step="0.01"
            value={formData.leadValue || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, leadValue: parseFloat(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="probability">Probability (%)</Label>
          <Input
            id="probability"
            type="number"
            min="0"
            max="100"
            value={formData.probability}
            onChange={(e) => setFormData(prev => ({ ...prev, probability: parseInt(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <Label htmlFor="source">Source</Label>
          <Input
            id="source"
            placeholder="Lead source"
            value={formData.source || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Update Lead
        </Button>
      </DialogFooter>
    </form>
  );
};

export default LeadsPage;
