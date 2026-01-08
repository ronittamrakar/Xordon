import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { api, FollowUpAutomation } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Zap, Plus, Search, Edit, Trash2, Play, MoreHorizontal,
  Mail, MessageSquare, Phone, FileTextIcon, ArrowRight, Clock,
  Tag, Users, Bell, Webhook, Workflow, ExternalLink, Settings
} from 'lucide-react';

type AutomationOptionsExtended = {
  trigger_types: Record<string, Record<string, string>>;
  action_types: Record<string, string>;
  condition_types?: Record<string, string>;
  delay_units: Record<string, string>;
  sentiments?: Record<string, string>;
  disposition_categories?: Record<string, string>;
  dispositions?: Array<{ id: string; name: string; category: string; color: string }>;
};

const Automations: React.FC = () => {
  // Always call hooks unconditionally at the top level
  const auth = useAuth();
  const { isAuthenticated, isLoading: authLoading } = auth;
  const navigate = useNavigate();

  const [automations, setAutomations] = useState<FollowUpAutomation[]>([]);
  const [options, setOptions] = useState<AutomationOptionsExtended | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<FollowUpAutomation | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    channel: 'call' as 'email' | 'sms' | 'call' | 'form',
    trigger_type: '',
    trigger_conditions: {} as Record<string, unknown>,
    action_type: '',
    action_config: {} as Record<string, unknown>,
    delay_amount: 0,
    delay_unit: 'hours' as 'minutes' | 'hours' | 'days',
    is_active: true,
    priority: 0,
    confidence_threshold: 70, // New: minimum confidence for sentiment/intent triggers
  });

  // Condition form state
  const [conditionType, setConditionType] = useState('');
  const [conditionValue, setConditionValue] = useState('');

  useEffect(() => {
    loadAutomations();
    loadOptions();
  }, []);

  const loadAutomations = async () => {
    try {
      setLoading(true);
      const response = await api.getAutomations();
      setAutomations(response.automations || []);
    } catch (error: any) {
      console.error('Error loading automations:', error);
      // If unauthorized in dev, attempt to fetch dev token and retry once
      if (import.meta.env.DEV && error?.message && error.message.toLowerCase().includes('unauthorized')) {
        try {
          const tokenRes = await fetch((import.meta.env.VITE_API_URL || '') + '/auth/dev-token');
          if (tokenRes.ok) {
            const data = await tokenRes.json();
            if (data?.token) {
              localStorage.setItem('auth_token', data.token);
              const retry = await api.getAutomations();
              setAutomations(retry.automations || []);
              return;
            }
          }
        } catch (innerErr) {
          console.error('Dev token fetch failed:', innerErr);
        }
      }
      toast({ title: 'Error', description: 'Failed to load automations', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const opts = await api.getAutomationOptions();
      setOptions(opts as AutomationOptionsExtended);
    } catch (error) {
      console.error('Error loading options:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.trigger_type || !formData.action_type) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    try {
      const newAutomation = await api.createAutomation(formData);
      setAutomations(prev => [newAutomation, ...prev]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: 'Success', description: 'Automation created successfully' });
    } catch (error) {
      console.error('Error creating automation:', error);
      toast({ title: 'Error', description: 'Failed to create automation', variant: 'destructive' });
    }
  };

  const handleUpdate = async () => {
    if (!editingAutomation) return;
    try {
      const updated = await api.updateAutomation(editingAutomation.id, formData);
      setAutomations(prev => prev.map(a => a.id === editingAutomation.id ? updated : a));
      setEditingAutomation(null);
      resetForm();
      toast({ title: 'Success', description: 'Automation updated successfully' });
    } catch (error) {
      console.error('Error updating automation:', error);
      toast({ title: 'Error', description: 'Failed to update automation', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return;
    try {
      await api.deleteAutomation(id);
      setAutomations(prev => prev.filter(a => a.id !== id));
      toast({ title: 'Success', description: 'Automation deleted successfully' });
    } catch (error) {
      console.error('Error deleting automation:', error);
      toast({ title: 'Error', description: 'Failed to delete automation', variant: 'destructive' });
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const result = await api.toggleAutomation(id);
      setAutomations(prev => prev.map(a => a.id === id ? { ...a, is_active: result.is_active } : a));
    } catch (error) {
      console.error('Error toggling automation:', error);
      toast({ title: 'Error', description: 'Failed to toggle automation', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', description: '', channel: 'call', trigger_type: '',
      trigger_conditions: {}, action_type: '', action_config: {},
      delay_amount: 0, delay_unit: 'hours', is_active: true, priority: 0,
      confidence_threshold: 70,
    });
    setConditionType('');
    setConditionValue('');
  };

  const openEditDialog = (automation: FollowUpAutomation) => {
    setEditingAutomation(automation);
    setFormData({
      name: automation.name, description: automation.description || '',
      channel: automation.channel, trigger_type: automation.trigger_type,
      trigger_conditions: automation.trigger_conditions, action_type: automation.action_type,
      action_config: automation.action_config, delay_amount: automation.delay_amount,
      delay_unit: automation.delay_unit, is_active: automation.is_active, priority: automation.priority,
      confidence_threshold: (automation as any).confidence_threshold || 70,
    });
  };

  // Open automation in Flow Builder
  const openInFlowBuilder = (automation: FollowUpAutomation) => {
    // Navigate to Flow Builder with automation data
    navigate(`/automations/flows/new?automation=${automation.id}&channel=${automation.channel}`);
  };

  const createWithFlowBuilder = () => {
    navigate('/automations/flows/new?new_automation=true');
  };

  const addCondition = () => {
    if (!conditionType || !conditionValue) return;
    setFormData(prev => ({
      ...prev,
      trigger_conditions: { ...prev.trigger_conditions, [conditionType]: conditionValue }
    }));
    setConditionType('');
    setConditionValue('');
  };

  const removeCondition = (key: string) => {
    setFormData(prev => {
      const newConditions = { ...prev.trigger_conditions };
      delete newConditions[key];
      return { ...prev, trigger_conditions: newConditions };
    });
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'form': return <FileTextIcon className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'messenger': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'linkedin': return <Users className="h-4 w-4 text-blue-700" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'send_email': return <Mail className="h-4 w-4" />;
      case 'send_sms': return <MessageSquare className="h-4 w-4" />;
      case 'schedule_call': return <Phone className="h-4 w-4" />;
      case 'add_tag': case 'remove_tag': return <Tag className="h-4 w-4" />;
      case 'move_to_campaign': return <Users className="h-4 w-4" />;
      case 'notify_user': return <Bell className="h-4 w-4" />;
      case 'webhook': return <Webhook className="h-4 w-4" />;
      default: return <ArrowRight className="h-4 w-4" />;
    }
  };

  const getConditionLabel = (key: string, value: unknown) => {
    if (key === 'disposition_id' && options?.dispositions) {
      const disp = options.dispositions.find(d => d.id === value);
      return disp ? `Disposition: ${disp.name}` : `Disposition ID: ${value}`;
    }
    if (key === 'disposition_category') return `Category: ${value}`;
    if (key === 'sentiment') return `Sentiment: ${value}`;
    if (key === 'notes_keyword') return `Notes contain: "${value}"`;
    if (key === 'reply_keyword') return `Reply contains: "${value}"`;
    if (key === 'call_duration_min') return `Min duration: ${value}s`;
    if (key === 'call_duration_max') return `Max duration: ${value}s`;
    return `${key}: ${value}`;
  };

  const filteredAutomations = automations.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesChannel = selectedChannel === 'all' || a.channel === selectedChannel;
    return matchesSearch && matchesChannel;
  });

  const triggerTypes = options?.trigger_types[formData.channel] || {};
  const actionTypes = options?.action_types || {};

  // Check if trigger requires additional conditions
  const needsConditions = formData.trigger_type.includes('disposition') ||
    formData.trigger_type.includes('outcome') ||
    formData.trigger_type.includes('keyword') ||
    formData.trigger_type.includes('notes_contain') ||
    formData.trigger_type.includes('sentiment') ||
    formData.trigger_type.includes('intent') ||
    formData.trigger_type.includes('semantic') ||
    formData.trigger_type.includes('combined');

  // Check if trigger uses sentiment/intent analysis (needs confidence threshold)
  const needsConfidenceThreshold = formData.trigger_type.includes('sentiment') ||
    formData.trigger_type.includes('intent') ||
    formData.trigger_type.includes('semantic');

  // Only show if user is authenticated and not loading
  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading automations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight">Automations</h1>
          <p className="text-muted-foreground mt-1">
            Create automated follow-ups based on dispositions, outcomes, notes, and responses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/automations/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" onClick={createWithFlowBuilder}>
            <Workflow className="h-4 w-4 mr-2" />
            Flows
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Automation
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input placeholder="Search automations..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={selectedChannel} onValueChange={setSelectedChannel}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All channels" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="form">Form</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="messenger">Messenger</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{automations.length}</p></div>
            <Zap className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{automations.filter(a => a.is_active).length}</p></div>
            <Zap className="h-8 w-8 text-green-500" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Call-based</p>
              <p className="text-2xl font-bold">{automations.filter(a => a.channel === 'call').length}</p></div>
            <Phone className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Disposition-based</p>
              <p className="text-2xl font-bold">{automations.filter(a => a.trigger_type.includes('disposition')).length}</p></div>
            <FileTextIcon className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent></Card>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredAutomations.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16">
          <Zap className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No automations yet</h3>
          <p className="text-muted-foreground mb-4">Create follow-ups based on call dispositions, outcomes, and notes</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Create Automation</Button>
        </CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Delay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAutomations.map((automation) => (
                <TableRow key={automation.id}>
                  <TableCell>
                    <div className="font-medium">{automation.name}</div>
                    {automation.description && <div className="text-sm text-muted-foreground truncate max-w-xs">{automation.description}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      {getChannelIcon(automation.channel)}{automation.channel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{options?.trigger_types[automation.channel]?.[automation.trigger_type] || automation.trigger_type}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(automation.trigger_conditions || {}).map(([k, v]) => (
                        <Badge key={k} variant="secondary" className="text-xs">{getConditionLabel(k, v)}</Badge>
                      ))}
                      {Object.keys(automation.trigger_conditions || {}).length === 0 && <span className="text-xs text-muted-foreground">None</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getActionIcon(automation.action_type)}
                      <span className="text-sm">{options?.action_types[automation.action_type] || automation.action_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {automation.delay_amount > 0 ? (
                      <div className="flex items-center gap-1 text-sm"><Clock className="h-3 w-3" />{automation.delay_amount} {automation.delay_unit}</div>
                    ) : <span className="text-sm text-muted-foreground">Immediate</span>}
                  </TableCell>
                  <TableCell><Switch checked={automation.is_active} onCheckedChange={() => handleToggle(automation.id)} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(automation)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openInFlowBuilder(automation)}><Workflow className="h-4 w-4 mr-2" />Edit in Flows</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(automation.id)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || !!editingAutomation} onOpenChange={(open) => {
        if (!open) { setIsCreateDialogOpen(false); setEditingAutomation(null); resetForm(); }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAutomation ? 'Edit Automation' : 'Create Automation'}</DialogTitle>
            <DialogDescription>Set up follow-ups based on dispositions, outcomes, notes, and responses</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Follow up on Interested disposition" />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this automation does..." rows={2} />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Trigger</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Channel *</Label>
                  <Select value={formData.channel} onValueChange={(v) => setFormData(prev => ({ ...prev, channel: v as typeof formData.channel, trigger_type: '' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="form">Form</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="messenger">Messenger</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>When *</Label>
                  <Select value={formData.trigger_type} onValueChange={(v) => setFormData(prev => ({ ...prev, trigger_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select trigger..." /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(triggerTypes).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Confidence Threshold for Sentiment/Intent triggers */}
              {needsConfidenceThreshold && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <Label className="mb-2 block">Confidence Threshold</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Minimum confidence score (0-100) required for the sentiment/intent analysis to trigger this automation.
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.confidence_threshold}
                      onChange={(e) => setFormData(prev => ({ ...prev, confidence_threshold: parseInt(e.target.value) || 70 }))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">% confidence required</span>
                  </div>
                </div>
              )}

              {/* Conditions Section */}
              {(needsConditions || Object.keys(formData.trigger_conditions).length > 0) && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <Label className="mb-2 block">Conditions (optional filters)</Label>

                  {/* Existing conditions */}
                  {Object.keys(formData.trigger_conditions).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Object.entries(formData.trigger_conditions).map(([k, v]) => (
                        <Badge key={k} variant="secondary" className="flex items-center gap-1">
                          {getConditionLabel(k, v)}
                          <button onClick={() => removeCondition(k)} className="ml-1 hover:text-red-500">×</button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Add condition */}
                  <div className="flex gap-2">
                    <Select value={conditionType} onValueChange={setConditionType}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Condition type..." /></SelectTrigger>
                      <SelectContent>
                        {formData.channel === 'call' && options?.dispositions && (
                          <SelectItem value="disposition_id">Specific Disposition</SelectItem>
                        )}
                        <SelectItem value="disposition_category">Disposition Category</SelectItem>
                        <SelectItem value="sentiment">Sentiment</SelectItem>
                        <SelectItem value="notes_keyword">Notes Contain Keyword</SelectItem>
                        {formData.channel !== 'call' && <SelectItem value="reply_keyword">Reply Contains Keyword</SelectItem>}
                        {formData.channel === 'call' && <SelectItem value="call_duration_min">Min Call Duration (sec)</SelectItem>}
                      </SelectContent>
                    </Select>

                    {conditionType === 'disposition_id' && options?.dispositions ? (
                      <Select value={conditionValue} onValueChange={setConditionValue}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Select disposition..." /></SelectTrigger>
                        <SelectContent>
                          {options.dispositions.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : conditionType === 'disposition_category' ? (
                      <Select value={conditionValue} onValueChange={setConditionValue}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Select category..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="positive">Positive</SelectItem>
                          <SelectItem value="negative">Negative</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="callback">Callback</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : conditionType === 'sentiment' ? (
                      <Select value={conditionValue} onValueChange={setConditionValue}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Select sentiment..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="positive">Positive</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="negative">Negative</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={conditionValue} onChange={(e) => setConditionValue(e.target.value)}
                        placeholder={conditionType.includes('duration') ? 'e.g., 30' : 'Enter keyword...'} className="flex-1" />
                    )}
                    <Button onClick={addCondition} disabled={!conditionType || !conditionValue} size="sm">Add</Button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Action</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Then *</Label>
                  <Select value={formData.action_type} onValueChange={(v) => setFormData(prev => ({ ...prev, action_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select action..." /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(actionTypes).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Delay</Label>
                  <div className="flex gap-2">
                    <Input type="number" min="0" value={formData.delay_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, delay_amount: parseInt(e.target.value) || 0 }))} className="w-20" />
                    <Select value={formData.delay_unit} onValueChange={(v) => setFormData(prev => ({ ...prev, delay_unit: v as typeof formData.delay_unit }))}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Active</Label>
                  <p className="text-sm text-muted-foreground">Enable this automation</p>
                </div>
                <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); setEditingAutomation(null); resetForm(); }}>Cancel</Button>
            <Button onClick={editingAutomation ? handleUpdate : handleCreate}>
              {editingAutomation ? 'Update' : 'Create'} Automation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Automations;

