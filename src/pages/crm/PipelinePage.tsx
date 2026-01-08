import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Phone,
  Mail,
  MessageSquare,
  DollarSign,
  User,
  Building2,
  GripVertical,
  MoreHorizontal,
  TrendingUp,
  Calendar,
  ChevronRight,
  FileText,
  FolderKanban,
  CalendarPlus
} from 'lucide-react';
import { api } from '@/lib/api';
import { Lead, LeadStage, LEAD_STAGES, CreateLeadData } from '@/types/crm';
import type { Contact } from '@/types/contact';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCallSession } from '@/contexts/CallSessionContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface PipelineColumn {
  stage: LeadStage;
  label: string;
  color: string;
  leads: Lead[];
  totalValue: number;
}

interface PipelinePageProps {
  hideHeader?: boolean;
}

const PipelinePage: React.FC<PipelinePageProps> = ({ hideHeader = false }) => {
  const navigate = useNavigate();
  const location = useLocation(); // Add useLocation
  // ... hook calls ...

  const [initialContactId, setInitialContactId] = useState<string>('');

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
  const { requestSoftphoneCall } = useCallSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null);

  useEffect(() => {
    loadLeads();
    loadContacts();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const response = await api.crm.getLeads({ limit: 100 });
      const transformedLeads = response.leads.map((lead: any) => ({
        ...lead,
        contactId: lead.contact_id,
        leadStage: lead.lead_stage,
        leadValue: lead.lead_value ? parseFloat(lead.lead_value) : undefined,
        leadScore: lead.lead_score ? parseInt(lead.lead_score) : undefined,
        probability: lead.probability ? parseInt(lead.probability) : undefined,
        lastActivityAt: lead.last_activity_at,
        createdAt: lead.created_at,
        updatedAt: lead.updated_at,
        contact: {
          firstName: lead.first_name,
          lastName: lead.last_name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company
        }
      }));
      setLeads(transformedLeads);
    } catch (error) {
      console.error('Failed to load leads:', error);
      toast.error('Failed to load pipeline data');
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const data = await api.getContacts();
      setContacts(data);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const updateLeadStage = async (leadId: string, newStage: LeadStage) => {
    // Store previous state for rollback
    const previousLeads = [...leads];
    const leadToUpdate = leads.find(l => l.id === leadId);
    const previousStage = leadToUpdate?.leadStage;

    try {
      // Optimistic update
      setLeads(prev => prev.map(lead =>
        lead.id === leadId ? { ...lead, leadStage: newStage } : lead
      ));

      // Make API call
      await api.crm.updateLead(leadId, {
        leadStage: newStage,
        contactId: leadToUpdate?.contactId
      });
      toast.success('Lead moved successfully');
    } catch (error) {
      // Rollback on error
      console.error('Failed to update lead stage:', error);
      setLeads(previousLeads);
      const errorMessage = error instanceof Error ? error.message : 'Failed to move lead';
      toast.error(errorMessage);

      // Log for debugging
      console.error('Rollback: Lead', leadId, 'from', newStage, 'back to', previousStage);
    }
  };

  const createLead = async (data: CreateLeadData) => {
    try {
      await api.crm.createLead({
        contactId: data.contactId,
        leadScore: data.leadScore,
        leadStage: data.leadStage,
        leadValue: data.leadValue,
        probability: data.probability,
        source: data.source
      });
      toast.success('Lead created successfully');
      setIsCreateDialogOpen(false);
      loadLeads();
    } catch (error) {
      console.error('Failed to create lead:', error);
      toast.error('Failed to create lead');
    }
  };

  // Filter leads by search
  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const contactName = `${lead.contact?.firstName || ''} ${lead.contact?.lastName || ''}`.toLowerCase();
    const email = (lead.contact?.email || '').toLowerCase();
    const company = (lead.contact?.company || '').toLowerCase();
    return contactName.includes(searchLower) || email.includes(searchLower) || company.includes(searchLower);
  });

  // Organize leads into pipeline columns
  const pipelineColumns: PipelineColumn[] = LEAD_STAGES.map(stage => {
    const stageLeads = filteredLeads.filter(lead => lead.leadStage === stage.value);
    const totalValue = stageLeads.reduce((sum, lead) => sum + (lead.leadValue || 0), 0);
    return {
      stage: stage.value,
      label: stage.label,
      color: stage.color,
      leads: stageLeads,
      totalValue
    };
  });

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    setDragOverStage(null);
    if (draggedLead && draggedLead.leadStage !== stage) {
      updateLeadStage(draggedLead.id, stage);
    }
    setDraggedLead(null);
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
    setDragOverStage(null);
  };

  const openLeadDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailDialogOpen(true);
  };
  // Loading state handling
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">

      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Sales Pipeline</h1>
            <p className="text-gray-600">Drag and drop leads between stages</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>
      )}

      {/* Pipeline Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 h-full min-w-max pb-4">
          {pipelineColumns.map((column) => (
            <div
              key={column.stage}
              className={`w-72 flex-shrink-0 flex flex-col rounded-lg border ${dragOverStage === column.stage ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'
                }`}
              onDragOver={(e) => handleDragOver(e, column.stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.stage)}
            >
              {/* Column Header */}
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: column.color }}
                    />
                    <span className="font-semibold">{column.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {column.leads.length}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  ${column.totalValue.toLocaleString()}
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {column.leads.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No leads in this stage
                  </div>
                ) : (
                  column.leads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      onDragEnd={handleDragEnd}
                      onClick={() => openLeadDetail(lead)}
                      className={`bg-background rounded-lg border p-3 cursor-pointer hover:shadow-md transition-shadow ${draggedLead?.id === lead.id ? 'opacity-50' : ''
                        }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          <div>
                            <p className="font-medium text-sm">
                              {lead.contact?.firstName} {lead.contact?.lastName}
                            </p>
                            {lead.contact?.company && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {lead.contact.company}
                              </p>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/contacts/${lead.contactId}`);
                            }}>
                              <User className="h-4 w-4 mr-2" />
                              View Contact
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/reach/inbound/email/replies?email=${lead.contact?.email}`);
                            }}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            {lead.contact?.phone && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                requestSoftphoneCall({
                                  number: lead.contact!.phone!,
                                  recipientName: `${lead.contact?.firstName} ${lead.contact?.lastName}`,
                                  source: 'dialer'
                                });
                              }}>
                                <Phone className="h-4 w-4 mr-2" />
                                Call
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/proposals/new?contactId=${lead.contactId}&dealValue=${lead.leadValue || 0}&dealName=${encodeURIComponent(`${lead.contact?.firstName} ${lead.contact?.lastName} - Proposal`)}`);
                            }}>
                              <FileText className="h-4 w-4 mr-2" />
                              Create Proposal
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/projects/new`, {
                                state: {
                                  fromLead: true,
                                  leadId: lead.id,
                                  contactId: lead.contactId,
                                  title: `${lead.contact?.firstName} ${lead.contact?.lastName} - Project`,
                                  description: `Project created from pipeline lead. Deal value: $${(lead.leadValue || 0).toLocaleString()}`
                                }
                              });
                            }}>
                              <FolderKanban className="h-4 w-4 mr-2" />
                              Create Project
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/scheduling/appointments/new`, {
                                state: {
                                  contactId: lead.contactId,
                                  contactName: `${lead.contact?.firstName} ${lead.contact?.lastName}`,
                                  contactEmail: lead.contact?.email,
                                  contactPhone: lead.contact?.phone
                                }
                              });
                            }}>
                              <CalendarPlus className="h-4 w-4 mr-2" />
                              Schedule Meeting
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {lead.leadValue && (
                        <div className="flex items-center gap-1 text-sm text-green-600 mb-2">
                          <DollarSign className="h-3 w-3" />
                          <span className="font-medium">${lead.leadValue.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>Score: {lead.leadScore || 0}</span>
                        </div>
                        {lead.source && (
                          <Badge variant="outline" className="text-xs">
                            {lead.source}
                          </Badge>
                        )}
                      </div>

                      {lead.lastActivityAt && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <Calendar className="h-3 w-3" />
                          <span>Last activity: {format(new Date(lead.lastActivityAt), 'MMM d')}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Lead Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lead to Pipeline</DialogTitle>
            <DialogDescription>
              Create a new lead and add it to your sales pipeline.
            </DialogDescription>
          </DialogHeader>
          <CreateLeadForm
            contacts={contacts}
            onSubmit={createLead}
            onCancel={() => setIsCreateDialogOpen(false)}
            initialContactId={initialContactId}
          />
        </DialogContent>
      </Dialog>

      {/* Lead Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription className="sr-only">
              View and manage detailed information for this lead.
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <LeadDetailView
              lead={selectedLead}
              onClose={() => setIsDetailDialogOpen(false)}
              onStageChange={(stage) => {
                updateLeadStage(selectedLead.id, stage);
                setSelectedLead({ ...selectedLead, leadStage: stage });
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
  contacts: Contact[];
  onSubmit: (data: CreateLeadData) => void;
  onCancel: () => void;
  initialContactId?: string;
}> = ({ onSubmit, onCancel, contacts, initialContactId }) => {
  const [formData, setFormData] = useState<CreateLeadData>({
    contactId: initialContactId || '',
    leadScore: 0,
    leadStage: 'new',
    leadValue: 0,
    probability: 10,
    source: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contactId) {
      toast.error('Please select a contact');
      return;
    }
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
        <Label htmlFor="leadStage">Initial Stage</Label>
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
      </div>

      <div>
        <Label htmlFor="source">Source</Label>
        <Select value={formData.source || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email_campaign">Email Campaign</SelectItem>
            <SelectItem value="sms_campaign">SMS Campaign</SelectItem>
            <SelectItem value="call_campaign">Call Campaign</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
            <SelectItem value="social_media">Social Media</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Add Lead
        </Button>
      </DialogFooter>
    </form>
  );
};

// Lead Detail View Component
const LeadDetailView: React.FC<{
  lead: Lead;
  onClose: () => void;
  onStageChange: (stage: LeadStage) => void;
}> = ({ lead, onClose, onStageChange }) => {
  const navigate = useNavigate();
  const { requestSoftphoneCall } = useCallSession();

  const currentStageIndex = LEAD_STAGES.findIndex(s => s.value === lead.leadStage);

  return (
    <div className="space-y-10 py-6">
      {/* Contact Info Header */}
      <div className="flex items-start justify-between border-b pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold tracking-tight">
              {lead.contact?.firstName} {lead.contact?.lastName}
            </h3>
            <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-semibold">
              Score: {lead.leadScore || 0}
            </Badge>
            {lead.source && (
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                {lead.source}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {lead.contact?.company && (
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary/60" />
                {lead.contact.company}
              </span>
            )}
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary/60" />
              {lead.contact?.email}
            </span>
            {lead.contact?.phone && (
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary/60" />
                {lead.contact.phone}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-widest">Estimated Value</div>
          {lead.leadValue ? (
            <p className="text-2xl font-black text-green-600">
              ${lead.leadValue.toLocaleString()}
            </p>
          ) : (
            <p className="text-2xl font-black text-muted-foreground/20">$0</p>
          )}
        </div>
      </div>

      {/* Stage Progress */}
      <div className="bg-muted/30 p-8 rounded-2xl border shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <Label className="text-sm font-bold text-foreground uppercase tracking-wider">Pipeline Journey</Label>
            <p className="text-xs text-muted-foreground">Click a stage to move the lead</p>
          </div>
          <Badge variant="outline" className="bg-background">
            Stage {currentStageIndex + 1} of {LEAD_STAGES.length - 1}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {LEAD_STAGES.slice(0, -1).map((stage, index) => (
            <React.Fragment key={stage.value}>
              <button
                onClick={() => onStageChange(stage.value)}
                className={`flex-1 group relative flex flex-col items-center gap-2 py-4 px-3 rounded-xl transition-all border-2 ${index <= currentStageIndex
                  ? 'border-transparent shadow-md'
                  : 'bg-background border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/50'
                  }`}
                style={{
                  backgroundColor: index <= currentStageIndex ? stage.color : undefined,
                  color: index <= currentStageIndex ? 'white' : undefined,
                }}
              >
                <span className="text-xs font-black uppercase tracking-tight whitespace-nowrap">{stage.label}</span>
                {index === currentStageIndex && (
                  <div className="absolute -bottom-1.5 w-2 h-2 bg-white rounded-full shadow-sm" />
                )}
              </button>
              {index < LEAD_STAGES.length - 2 && (
                <ChevronRight className={`h-5 w-5 flex-shrink-0 ${index < currentStageIndex ? 'text-primary' : 'text-muted-foreground/20'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-4 gap-10 px-2">
        <div className="space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Source</span>
          <p className="font-semibold text-xl capitalize">{lead.source || 'Direct'}</p>
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Probability</span>
          <p className="font-semibold text-xl">{lead.probability || 0}%</p>
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Created</span>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <p className="font-semibold text-lg">{format(new Date(lead.createdAt), 'MMM d, yyyy')}</p>
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Last Activity</span>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <p className="font-semibold text-lg">
              {lead.lastActivityAt ? format(new Date(lead.lastActivityAt), 'MMM d, yyyy') : 'No activity yet'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col gap-8 pt-10 border-t">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-bold uppercase tracking-wider">Quick Actions</h4>
            <p className="text-xs text-muted-foreground">Engage with this contact immediately</p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="px-10 py-7 h-auto font-bold shadow-sm hover:bg-muted/50"
              onClick={() => navigate(`/contacts/${lead.contactId}`)}
            >
              <User className="h-5 w-5 mr-3 text-primary" />
              View Profile
            </Button>
            <Button
              variant="outline"
              className="px-10 py-7 h-auto font-bold shadow-sm hover:bg-muted/50"
              onClick={() => navigate(`/reach/inbound/email/replies?email=${lead.contact?.email}`)}
            >
              <Mail className="h-5 w-5 mr-3 text-primary" />
              Send Email
            </Button>
            {lead.contact?.phone && (
              <Button
                variant="outline"
                className="px-10 py-7 h-auto font-bold shadow-sm hover:bg-muted/50"
                onClick={() => {
                  requestSoftphoneCall({
                    number: lead.contact!.phone!,
                    recipientName: `${lead.contact?.firstName} ${lead.contact?.lastName}`,
                    source: 'dialer'
                  });
                }}
              >
                <Phone className="h-5 w-5 mr-3 text-primary" />
                Call Lead
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-8 bg-primary/[0.03] rounded-3xl border-2 border-primary/10 border-dashed">
          <div className="space-y-1">
            <h4 className="text-base font-bold uppercase tracking-wider text-primary">Conversion Actions</h4>
            <p className="text-sm text-muted-foreground max-w-xs">Accelerate the deal pipeline with these primary conversion steps</p>
          </div>
          <div className="flex gap-5">
            <Button
              onClick={() => navigate(`/proposals/new?contactId=${lead.contactId}&dealValue=${lead.leadValue || 0}&dealName=${encodeURIComponent(`${lead.contact?.firstName} ${lead.contact?.lastName} - Proposal`)}`)}
              className="bg-primary hover:bg-primary/90 px-12 py-7 h-auto font-black shadow-xl text-lg transition-transform hover:scale-[1.02]"
            >
              <FileText className="h-6 w-6 mr-3" />
              Generate Proposal
            </Button>
            <Button
              variant="secondary"
              className="px-12 py-7 h-auto font-black shadow-lg text-lg transition-transform hover:scale-[1.02]"
              onClick={() => navigate(`/projects/new`, {
                state: {
                  fromLead: true,
                  leadId: lead.id,
                  contactId: lead.contactId,
                  title: `${lead.contact?.firstName} ${lead.contact?.lastName} - Project`,
                  description: `Project created from pipeline lead. Deal value: $${(lead.leadValue || 0).toLocaleString()}`
                }
              })}
            >
              <FolderKanban className="h-6 w-6 mr-3" />
              Start Project
            </Button>
            <Button
              variant="outline"
              className="px-12 py-7 h-auto font-black bg-background shadow-md text-lg transition-transform hover:scale-[1.02]"
              onClick={() => navigate(`/scheduling/appointments/new`, {
                state: {
                  contactId: lead.contactId,
                  contactName: `${lead.contact?.firstName} ${lead.contact?.lastName}`,
                  contactEmail: lead.contact?.email,
                  contactPhone: lead.contact?.phone
                }
              })}
            >
              <CalendarPlus className="h-6 w-6 mr-3" />
              Schedule Meeting
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelinePage;
