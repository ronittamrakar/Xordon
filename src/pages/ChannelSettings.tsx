import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
  MessageCircle, Facebook, Linkedin, Instagram, Plus, Settings,
  RefreshCw, Trash2, CheckCircle, XCircle, AlertCircle, ExternalLink,
  Phone, Zap, Clock, Shield, Send, FileTextIcon, Globe
} from 'lucide-react';
import omniChannelApi, { InstagramAccount, GMBLocation } from '@/services/omniChannelApi';

interface ChannelAccount {
  id: number;
  name: string;
  channel: string;
  status: 'active' | 'inactive' | 'pending' | 'error' | 'disconnected';
  status_message?: string;
  external_id?: string;
  external_name?: string;
  quality_rating?: string;
  messaging_tier?: string;
  daily_limit: number;
  sent_today: number;
  last_webhook_at?: string;
  created_at: string;
}

interface WhatsAppTemplate {
  id: number;
  template_id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  preview_text?: string;
  components?: any[];
  variable_mappings?: Record<string, string>;
}

interface LinkedInTemplate {
  id: number;
  name: string;
  description?: string;
  category: string;
  message_type: string;
  message: string;
  variables?: string[];
  usage_count: number;
  is_favorite: boolean;
}

export default function ChannelSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('whatsapp');
  const [loading, setLoading] = useState(true);

  // WhatsApp state
  const [whatsappAccounts, setWhatsappAccounts] = useState<ChannelAccount[]>([]);
  const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsAppTemplate[]>([]);
  const [showWhatsAppConnect, setShowWhatsAppConnect] = useState(false);
  const [showWhatsAppMapping, setShowWhatsAppMapping] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [templateMappings, setTemplateMappings] = useState<Record<string, string>>({});
  const [whatsappForm, setWhatsappForm] = useState({
    name: '',
    access_token: '',
    phone_number_id: '',
    waba_id: '',
  });
  const [whatsappSettings, setWhatsappSettings] = useState({
    quiet_hours_enabled: true,
    quiet_hours_start: '21:00',
    quiet_hours_end: '08:00',
    timezone: 'America/New_York',
    auto_reply_enabled: false,
    auto_reply_message: '',
    stop_keywords: ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'],
    default_template_language: 'en',
  });

  // Messenger state
  const [messengerAccounts, setMessengerAccounts] = useState<ChannelAccount[]>([]);
  const [showMessengerConnect, setShowMessengerConnect] = useState(false);
  const [messengerForm, setMessengerForm] = useState({
    name: '',
    page_access_token: '',
    page_id: '',
  });
  const [messengerSettings, setMessengerSettings] = useState({
    quiet_hours_enabled: true,
    quiet_hours_start: '21:00',
    quiet_hours_end: '08:00',
    timezone: 'America/New_York',
    auto_reply_enabled: false,
    auto_reply_message: '',
    greeting_text: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // LinkedIn state
  const [linkedinAccounts, setLinkedinAccounts] = useState<ChannelAccount[]>([]);
  const [linkedinTemplates, setLinkedinTemplates] = useState<LinkedInTemplate[]>([]);
  const [showLinkedInConnect, setShowLinkedInConnect] = useState(false);
  const [linkedinAccountForm, setLinkedinAccountForm] = useState({
    name: '',
    profile_url: '',
  });
  const [linkedinSettings, setLinkedinSettings] = useState({
    task_default_priority: 'medium',
    task_reminder_hours: 24,
    auto_create_contact: true,
    lead_sync_enabled: false,
  });
  const [showLinkedInTemplate, setShowLinkedInTemplate] = useState(false);
  const [editingLinkedInTemplate, setEditingLinkedInTemplate] = useState<LinkedInTemplate | null>(null);
  const [linkedinForm, setLinkedinForm] = useState({
    name: '',
    description: '',
    category: 'general',
    message_type: 'direct_message',
    message: '',
  });

  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Instagram state
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [showInstagramConnect, setShowInstagramConnect] = useState(false);
  const [instagramForm, setInstagramForm] = useState({
    instagram_id: '',
    username: '',
    access_token: '',
  });

  // GMB state
  const [gmbLocations, setGmbLocations] = useState<GMBLocation[]>([]);
  const [showGmbConnect, setShowGmbConnect] = useState(false);
  const [gmbForm, setGmbForm] = useState({
    location_id: '',
    location_name: '',
    access_token: '',
    refresh_token: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [waAccounts, waSettings, msgAccounts, msgSettings, liAccounts, liTemplates, liSettings, igAccounts, gmbLocs] = await Promise.all([
        api.get('/channels/whatsapp/accounts').catch(() => ({ accounts: [] })),
        api.get('/channels/whatsapp/settings').catch(() => ({ settings: null })),
        api.get('/channels/messenger/accounts').catch(() => ({ accounts: [] })),
        api.get('/channels/messenger/settings').catch(() => ({ settings: null })),
        api.get('/channels/linkedin/accounts').catch(() => ({ accounts: [] })),
        api.get('/channels/linkedin/templates').catch(() => ({ templates: [] })),
        api.get('/channels/linkedin/settings').catch(() => ({ settings: null })),
        omniChannelApi.listInstagramAccounts().catch(() => []),
        omniChannelApi.listGMBLocations().catch(() => []),
      ]);

      setWhatsappAccounts((waAccounts as any).accounts || []);
      if ((waSettings as any).settings) {
        setWhatsappSettings((waSettings as any).settings);
      }
      setMessengerAccounts((msgAccounts as any).accounts || []);
      if ((msgSettings as any).settings) {
        setMessengerSettings((msgSettings as any).settings);
      }
      setLinkedinAccounts((liAccounts as any).accounts || []);
      setLinkedinTemplates((liTemplates as any).templates || []);
      if ((liSettings as any).settings) {
        setLinkedinSettings((liSettings as any).settings);
      }
      setInstagramAccounts(igAccounts);
      setGmbLocations(gmbLocs);
    } catch (error) {
      console.error('Failed to load channel data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWhatsAppTemplates = async (accountId: number) => {
    try {
      const response = await api.get(`/channels/whatsapp/accounts/${accountId}/templates`) as any;
      setWhatsappTemplates(response.templates || []);
    } catch (error) {
      console.error('Failed to load WhatsApp templates:', error);
    }
  };

  const connectWhatsApp = async () => {
    if (!whatsappForm.access_token || !whatsappForm.phone_number_id) {
      toast({ title: 'Error', description: 'Access token and Phone Number ID are required', variant: 'destructive' });
      return;
    }

    setConnecting(true);
    try {
      await api.post('/channels/whatsapp/connect', whatsappForm);
      toast({ title: 'Success', description: 'WhatsApp account connected successfully' });
      setShowWhatsAppConnect(false);
      setWhatsappForm({ name: '', access_token: '', phone_number_id: '', waba_id: '' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to connect WhatsApp', variant: 'destructive' });
    } finally {
      setConnecting(false);
    }
  };

  const connectMessenger = async () => {
    if (!messengerForm.page_access_token || !messengerForm.page_id) {
      toast({ title: 'Error', description: 'Page access token and Page ID are required', variant: 'destructive' });
      return;
    }

    setConnecting(true);
    try {
      await api.post('/channels/messenger/connect', messengerForm);
      toast({ title: 'Success', description: 'Messenger page connected successfully' });
      setShowMessengerConnect(false);
      setMessengerForm({ name: '', page_access_token: '', page_id: '' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to connect Messenger', variant: 'destructive' });
    } finally {
      setConnecting(false);
    }
  };

  const saveMessengerSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put('/channels/messenger/settings', messengerSettings);
      toast({ title: 'Success', description: 'Messenger settings saved' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSavingSettings(false);
    }
  };

  const saveLinkedInSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put('/channels/linkedin/settings', linkedinSettings);
      toast({ title: 'Success', description: 'LinkedIn settings saved' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSavingSettings(false);
    }
  };

  const connectLinkedIn = async () => {
    if (!linkedinAccountForm.name) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
      return;
    }

    setConnecting(true);
    try {
      await api.post('/channels/linkedin/connect', linkedinAccountForm);
      toast({ title: 'Success', description: 'LinkedIn account added' });
      setShowLinkedInConnect(false);
      setLinkedinAccountForm({ name: '', profile_url: '' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to add LinkedIn account', variant: 'destructive' });
    } finally {
      setConnecting(false);
    }
  };

  const syncTemplates = async (accountId: number) => {
    setSyncing(true);
    try {
      const response = await api.post(`/channels/whatsapp/accounts/${accountId}/templates/sync`) as any;
      toast({
        title: 'Templates Synced',
        description: `Synced ${response.synced} new, updated ${response.updated} templates`
      });
      loadWhatsAppTemplates(accountId);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to sync templates', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  const saveWhatsAppMappings = async () => {
    if (!selectedTemplate) return;

    try {
      await api.put(`/channels/whatsapp/templates/${selectedTemplate.id}/mappings`, {
        mappings: templateMappings
      });
      toast({ title: 'Success', description: 'Template mappings updated' });
      setShowWhatsAppMapping(false);
      loadWhatsAppTemplates(selectedTemplate.id); // Refresh templates
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update mappings', variant: 'destructive' });
    }
  };

  const saveWhatsAppSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put('/channels/whatsapp/settings', whatsappSettings);
      toast({ title: 'Success', description: 'WhatsApp settings saved' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSavingSettings(false);
    }
  };

  const disconnectAccount = async (channel: string, accountId: number) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;

    try {
      await api.post(`/channels/${channel}/accounts/${accountId}/disconnect`);
      toast({ title: 'Disconnected', description: 'Account disconnected successfully' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to disconnect', variant: 'destructive' });
    }
  };

  const createLinkedInTemplate = async () => {
    if (!linkedinForm.name || !linkedinForm.message) {
      toast({ title: 'Error', description: 'Name and message are required', variant: 'destructive' });
      return;
    }

    try {
      if (editingLinkedInTemplate) {
        await api.put(`/channels/linkedin/templates/${editingLinkedInTemplate.id}`, linkedinForm);
        toast({ title: 'Success', description: 'LinkedIn template updated' });
      } else {
        await api.post('/channels/linkedin/templates', linkedinForm);
        toast({ title: 'Success', description: 'LinkedIn template created' });
      }
      setShowLinkedInTemplate(false);
      setEditingLinkedInTemplate(null);
      setLinkedinForm({ name: '', description: '', category: 'general', message_type: 'direct_message', message: '' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save template', variant: 'destructive' });
    }
  };

  const deleteLinkedInTemplate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await api.delete(`/channels/linkedin/templates/${id}`);
      toast({ title: 'Deleted', description: 'LinkedIn template deleted' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete template', variant: 'destructive' });
    }
  };

  const connectInstagram = async () => {
    if (!instagramForm.instagram_id || !instagramForm.username || !instagramForm.access_token) {
      toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' });
      return;
    }
    setConnecting(true);
    try {
      await omniChannelApi.connectInstagram(instagramForm);
      toast({ title: 'Success', description: 'Instagram account connected' });
      setShowInstagramConnect(false);
      setInstagramForm({ instagram_id: '', username: '', access_token: '' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to connect Instagram', variant: 'destructive' });
    } finally {
      setConnecting(false);
    }
  };

  const connectGMB = async () => {
    if (!gmbForm.location_id || !gmbForm.location_name || !gmbForm.access_token || !gmbForm.refresh_token) {
      toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' });
      return;
    }
    setConnecting(true);
    try {
      await omniChannelApi.connectGMB(gmbForm);
      toast({ title: 'Success', description: 'GMB location connected' });
      setShowGmbConnect(false);
      setGmbForm({ location_id: '', location_name: '', access_token: '', refresh_token: '' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to connect GMB', variant: 'destructive' });
    } finally {
      setConnecting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      active: { variant: 'default', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      inactive: { variant: 'secondary', icon: <XCircle className="h-3 w-3 mr-1" /> },
      pending: { variant: 'outline', icon: <Clock className="h-3 w-3 mr-1" /> },
      error: { variant: 'destructive', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
      disconnected: { variant: 'secondary', icon: <XCircle className="h-3 w-3 mr-1" /> },
    };
    const config = variants[status] || variants.inactive;
    return (
      <Badge variant={config.variant} className="flex items-center">
        {config.icon}
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Messaging Channels</h1>
        <p className="text-muted-foreground">
          Connect and manage your WhatsApp, Messenger, and LinkedIn outreach channels
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="messenger" className="flex items-center gap-2">
            <Facebook className="h-4 w-4" />
            Messenger
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="flex items-center gap-2">
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </TabsTrigger>
          <TabsTrigger value="instagram" className="flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            Instagram
          </TabsTrigger>
          <TabsTrigger value="gmb" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            GMB
          </TabsTrigger>
        </TabsList>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-green-500" />
                    WhatsApp Business
                  </CardTitle>
                  <CardDescription>
                    Connect your WhatsApp Business account via Meta Cloud API
                  </CardDescription>
                </div>
                <Dialog open={showWhatsAppConnect} onOpenChange={setShowWhatsAppConnect}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Connect Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Connect WhatsApp Business</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Account Name</Label>
                        <Input
                          placeholder="My WhatsApp Business"
                          value={whatsappForm.name}
                          onChange={(e) => setWhatsappForm({ ...whatsappForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Access Token *</Label>
                        <Input
                          type="password"
                          placeholder="Your Meta access token"
                          value={whatsappForm.access_token}
                          onChange={(e) => setWhatsappForm({ ...whatsappForm, access_token: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Get this from Meta Business Suite → WhatsApp → API Setup
                        </p>
                      </div>
                      <div>
                        <Label>Phone Number ID *</Label>
                        <Input
                          placeholder="e.g., 123456789012345"
                          value={whatsappForm.phone_number_id}
                          onChange={(e) => setWhatsappForm({ ...whatsappForm, phone_number_id: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>WhatsApp Business Account ID (WABA)</Label>
                        <Input
                          placeholder="e.g., 123456789012345"
                          value={whatsappForm.waba_id}
                          onChange={(e) => setWhatsappForm({ ...whatsappForm, waba_id: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Required for syncing message templates
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowWhatsAppConnect(false)}>Cancel</Button>
                      <Button onClick={connectWhatsApp} disabled={connecting}>
                        {connecting ? 'Connecting...' : 'Connect'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {whatsappAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No WhatsApp accounts connected</p>
                  <p className="text-sm">Connect your WhatsApp Business account to start sending messages</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {whatsappAccounts.map((account) => (
                    <div key={account.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <MessageCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{account.name}</h4>
                            <p className="text-sm text-muted-foreground">{account.external_name || account.external_id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(account.status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              loadWhatsAppTemplates(account.id);
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => syncTemplates(account.id)}
                            disabled={syncing}
                          >
                            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => disconnectAccount('whatsapp', account.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Quality:</span>
                          <span className="ml-2 font-medium">{account.quality_rating || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tier:</span>
                          <span className="ml-2 font-medium">{account.messaging_tier || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sent Today:</span>
                          <span className="ml-2 font-medium">{account.sent_today} / {account.daily_limit}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Webhook:</span>
                          <span className="ml-2 font-medium">
                            {account.last_webhook_at ? new Date(account.last_webhook_at).toLocaleString() : 'Never'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* WhatsApp Templates */}
          {whatsappTemplates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Message Templates</CardTitle>
                <CardDescription>Approved templates from your WhatsApp Business account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {whatsappTemplates.map((template) => (
                    <div key={template.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{template.name}</span>
                          <Badge variant="outline">{template.language}</Badge>
                          <Badge variant={template.status === 'APPROVED' ? 'default' : 'secondary'}>
                            {template.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{template.category}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setTemplateMappings(template.variable_mappings || {});
                              setShowWhatsAppMapping(true);
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {template.preview_text && (
                        <p className="text-sm text-muted-foreground">{template.preview_text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* WhatsApp Mapping Dialog */}
          <Dialog open={showWhatsAppMapping} onOpenChange={setShowWhatsAppMapping}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Template Variable Mappings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Map template variables (e.g., {'{{1}}'}, {'{{2}}'}) to contact fields.
                </p>
                {selectedTemplate?.preview_text?.match(/\{\{\d+\}\}/g)?.map((variable) => {
                  const key = variable.replace(/[{}]/g, '');
                  return (
                    <div key={key} className="grid grid-cols-3 items-center gap-4">
                      <Label className="text-right">{variable}</Label>
                      <Select
                        value={templateMappings[key] || ''}
                        onValueChange={(v) => setTemplateMappings({ ...templateMappings, [key]: v })}
                      >
                        <SelectTrigger className="col-span-2">
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="first_name">First Name</SelectItem>
                          <SelectItem value="last_name">Last Name</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="company">Company</SelectItem>
                          <SelectItem value="title">Job Title</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
                {(!selectedTemplate?.preview_text?.match(/\{\{\d+\}\}/g)) && (
                  <p className="text-center py-4 text-muted-foreground">No variables found in this template.</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowWhatsAppMapping(false)}>Cancel</Button>
                <Button onClick={saveWhatsAppMappings}>Save Mappings</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                WhatsApp Settings
              </CardTitle>
              <CardDescription>Configure global settings for all connected WhatsApp accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Reply</Label>
                  <p className="text-sm text-muted-foreground">Automatically respond to new messages</p>
                </div>
                <Switch
                  checked={whatsappSettings.auto_reply_enabled}
                  onCheckedChange={(checked) => setWhatsappSettings({ ...whatsappSettings, auto_reply_enabled: checked })}
                />
              </div>

              {whatsappSettings.auto_reply_enabled && (
                <div className="space-y-2">
                  <Label>Auto-Reply Message</Label>
                  <Textarea
                    placeholder="Thanks for reaching out! We'll get back to you soon."
                    value={whatsappSettings.auto_reply_message}
                    onChange={(e) => setWhatsappSettings({ ...whatsappSettings, auto_reply_message: e.target.value })}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Quiet Hours</Label>
                  <p className="text-sm text-muted-foreground">Disable auto-replies during specific times</p>
                </div>
                <Switch
                  checked={whatsappSettings.quiet_hours_enabled}
                  onCheckedChange={(checked) => setWhatsappSettings({ ...whatsappSettings, quiet_hours_enabled: checked })}
                />
              </div>

              {whatsappSettings.quiet_hours_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={whatsappSettings.quiet_hours_start}
                      onChange={(e) => setWhatsappSettings({ ...whatsappSettings, quiet_hours_start: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={whatsappSettings.quiet_hours_end}
                      onChange={(e) => setWhatsappSettings({ ...whatsappSettings, quiet_hours_end: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Stop Keywords</Label>
                <Input
                  placeholder="STOP, UNSUBSCRIBE, CANCEL"
                  value={whatsappSettings.stop_keywords.join(', ')}
                  onChange={(e) => setWhatsappSettings({ ...whatsappSettings, stop_keywords: e.target.value.split(',').map(s => s.trim()) })}
                />
                <p className="text-xs text-muted-foreground">Keywords that will trigger an automatic opt-out</p>
              </div>

              <Button onClick={saveWhatsAppSettings} disabled={savingSettings}>
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messenger Tab */}
        <TabsContent value="messenger" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Facebook className="h-5 w-5 text-blue-500" />
                    Facebook Messenger
                  </CardTitle>
                  <CardDescription>
                    Connect your Facebook Page to send Messenger messages
                  </CardDescription>
                </div>
                <Dialog open={showMessengerConnect} onOpenChange={setShowMessengerConnect}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Connect Page
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Connect Facebook Page</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Page Name</Label>
                        <Input
                          placeholder="My Business Page"
                          value={messengerForm.name}
                          onChange={(e) => setMessengerForm({ ...messengerForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Page Access Token *</Label>
                        <Input
                          type="password"
                          placeholder="Your page access token"
                          value={messengerForm.page_access_token}
                          onChange={(e) => setMessengerForm({ ...messengerForm, page_access_token: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Get this from Meta Business Suite → Your Page → Settings → Access Tokens
                        </p>
                      </div>
                      <div>
                        <Label>Page ID *</Label>
                        <Input
                          placeholder="e.g., 123456789012345"
                          value={messengerForm.page_id}
                          onChange={(e) => setMessengerForm({ ...messengerForm, page_id: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowMessengerConnect(false)}>Cancel</Button>
                      <Button onClick={connectMessenger} disabled={connecting}>
                        {connecting ? 'Connecting...' : 'Connect'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {messengerAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Facebook className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No Facebook Pages connected</p>
                  <p className="text-sm">Connect your Facebook Page to start sending Messenger messages</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messengerAccounts.map((account) => (
                    <div key={account.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Facebook className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{account.name}</h4>
                            <p className="text-sm text-muted-foreground">{account.external_name || account.external_id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(account.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => disconnectAccount('messenger', account.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Messenger Settings
              </CardTitle>
              <CardDescription>Configure global settings for all connected Messenger pages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Reply</Label>
                  <p className="text-sm text-muted-foreground">Automatically respond to new messages</p>
                </div>
                <Switch
                  checked={messengerSettings.auto_reply_enabled}
                  onCheckedChange={(checked) => setMessengerSettings({ ...messengerSettings, auto_reply_enabled: checked })}
                />
              </div>

              {messengerSettings.auto_reply_enabled && (
                <div className="space-y-2">
                  <Label>Auto-Reply Message</Label>
                  <Textarea
                    placeholder="Thanks for reaching out! We'll get back to you soon."
                    value={messengerSettings.auto_reply_message}
                    onChange={(e) => setMessengerSettings({ ...messengerSettings, auto_reply_message: e.target.value })}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Quiet Hours</Label>
                  <p className="text-sm text-muted-foreground">Disable auto-replies during specific times</p>
                </div>
                <Switch
                  checked={messengerSettings.quiet_hours_enabled}
                  onCheckedChange={(checked) => setMessengerSettings({ ...messengerSettings, quiet_hours_enabled: checked })}
                />
              </div>

              {messengerSettings.quiet_hours_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={messengerSettings.quiet_hours_start}
                      onChange={(e) => setMessengerSettings({ ...messengerSettings, quiet_hours_start: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={messengerSettings.quiet_hours_end}
                      onChange={(e) => setMessengerSettings({ ...messengerSettings, quiet_hours_end: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Greeting Text</Label>
                <Input
                  placeholder="Hi! How can we help you today?"
                  value={messengerSettings.greeting_text}
                  onChange={(e) => setMessengerSettings({ ...messengerSettings, greeting_text: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Shown to users before they start a conversation</p>
              </div>

              <Button onClick={saveMessengerSettings} disabled={savingSettings}>
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LinkedIn Tab */}
        <TabsContent value="linkedin" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Linkedin className="h-5 w-5 text-blue-700" />
                    LinkedIn Accounts
                  </CardTitle>
                  <CardDescription>
                    Manage LinkedIn profiles for outreach tracking
                  </CardDescription>
                </div>
                <Dialog open={showLinkedInConnect} onOpenChange={setShowLinkedInConnect}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Add LinkedIn Account</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Account Name *</Label>
                        <Input
                          placeholder="e.g., John Doe (Personal)"
                          value={linkedinAccountForm.name}
                          onChange={(e) => setLinkedinAccountForm({ ...linkedinAccountForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Profile URL / ID</Label>
                        <Input
                          placeholder="e.g., linkedin.com/in/johndoe"
                          value={linkedinAccountForm.profile_url}
                          onChange={(e) => setLinkedinAccountForm({ ...linkedinAccountForm, profile_url: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowLinkedInConnect(false)}>Cancel</Button>
                      <Button onClick={connectLinkedIn} disabled={connecting}>
                        {connecting ? 'Adding...' : 'Add Account'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {linkedinAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Linkedin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No LinkedIn accounts added</p>
                  <p className="text-sm">Add your LinkedIn profile to track outreach tasks</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {linkedinAccounts.map((account) => (
                    <div key={account.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Linkedin className="h-5 w-5 text-blue-700" />
                          </div>
                          <div>
                            <h4 className="font-medium">{account.name}</h4>
                            <p className="text-sm text-muted-foreground">{account.external_id || 'No URL provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(account.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => disconnectAccount('linkedin', account.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileTextIcon className="h-5 w-5 text-blue-700" />
                    Message Templates
                  </CardTitle>
                  <CardDescription>
                    Create message templates for LinkedIn outreach tasks
                  </CardDescription>
                </div>
                <Dialog open={showLinkedInTemplate} onOpenChange={(open) => {
                  setShowLinkedInTemplate(open);
                  if (!open) {
                    setEditingLinkedInTemplate(null);
                    setLinkedinForm({ name: '', description: '', category: 'general', message_type: 'direct_message', message: '' });
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingLinkedInTemplate(null);
                      setLinkedinForm({ name: '', description: '', category: 'general', message_type: 'direct_message', message: '' });
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{editingLinkedInTemplate ? 'Edit LinkedIn Template' : 'Create LinkedIn Template'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Template Name *</Label>
                        <Input
                          placeholder="e.g., Initial Outreach"
                          value={linkedinForm.name}
                          onChange={(e) => setLinkedinForm({ ...linkedinForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Input
                          placeholder="Brief description of when to use this template"
                          value={linkedinForm.description}
                          onChange={(e) => setLinkedinForm({ ...linkedinForm, description: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Category</Label>
                          <Select
                            value={linkedinForm.category}
                            onValueChange={(v) => setLinkedinForm({ ...linkedinForm, category: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="sales">Sales</SelectItem>
                              <SelectItem value="recruiting">Recruiting</SelectItem>
                              <SelectItem value="networking">Networking</SelectItem>
                              <SelectItem value="follow_up">Follow Up</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Message Type</Label>
                          <Select
                            value={linkedinForm.message_type}
                            onValueChange={(v) => setLinkedinForm({ ...linkedinForm, message_type: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="connection_request">Connection Request</SelectItem>
                              <SelectItem value="direct_message">Direct Message</SelectItem>
                              <SelectItem value="inmail">InMail</SelectItem>
                              <SelectItem value="follow_up">Follow Up</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Message *</Label>
                        <Textarea
                          placeholder="Hi {{first_name}}, I noticed you work at {{company}}..."
                          value={linkedinForm.message}
                          onChange={(e) => setLinkedinForm({ ...linkedinForm, message: e.target.value })}
                          rows={5}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Use {'{{first_name}}'}, {'{{last_name}}'}, {'{{company}}'}, {'{{title}}'} for personalization
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowLinkedInTemplate(false)}>Cancel</Button>
                      <Button onClick={createLinkedInTemplate}>
                        {editingLinkedInTemplate ? 'Update Template' : 'Create Template'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Compliant LinkedIn Outreach</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Xordon uses a compliant approach to LinkedIn outreach. Instead of automated DMs (which violate LinkedIn ToS),
                      we create tasks with suggested messages for your team to send manually. This keeps your accounts safe while
                      still streamlining your workflow.
                    </p>
                  </div>
                </div>
              </div>

              {linkedinTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Linkedin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No LinkedIn templates yet</p>
                  <p className="text-sm">Create message templates to use in your LinkedIn outreach tasks</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedinTemplates.map((template) => (
                    <div key={template.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{template.name}</span>
                          <Badge variant="outline">{template.category}</Badge>
                          <Badge variant="secondary">{template.message_type.replace('_', ' ')}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Send className="h-4 w-4" />
                          Used {template.usage_count} times
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingLinkedInTemplate(template);
                                setLinkedinForm({
                                  name: template.name,
                                  description: template.description || '',
                                  category: template.category,
                                  message_type: template.message_type,
                                  message: template.message,
                                });
                                setShowLinkedInTemplate(true);
                              }}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteLinkedInTemplate(template.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                      )}
                      <p className="text-sm bg-muted p-2 rounded">{template.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* LinkedIn Tasks Quick View */}
          <Card>
            <CardHeader>
              <CardTitle>LinkedIn Tasks</CardTitle>
              <CardDescription>Pending LinkedIn outreach tasks for your team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <p>View and manage LinkedIn tasks in the Tasks section</p>
                <Button variant="outline" className="mt-2" onClick={() => window.location.href = '/tasks'}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Go to Tasks
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                LinkedIn Settings
              </CardTitle>
              <CardDescription>Configure how LinkedIn outreach tasks are handled</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Task Priority</Label>
                  <Select
                    value={linkedinSettings.task_default_priority}
                    onValueChange={(v) => setLinkedinSettings({ ...linkedinSettings, task_default_priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reminder (Hours)</Label>
                  <Input
                    type="number"
                    value={linkedinSettings.task_reminder_hours}
                    onChange={(e) => setLinkedinSettings({ ...linkedinSettings, task_reminder_hours: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Create Contacts</Label>
                  <p className="text-sm text-muted-foreground">Create new contacts from LinkedIn leads</p>
                </div>
                <Switch
                  checked={linkedinSettings.auto_create_contact}
                  onCheckedChange={(checked) => setLinkedinSettings({ ...linkedinSettings, auto_create_contact: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Lead Sync</Label>
                  <p className="text-sm text-muted-foreground">Automatically sync leads from LinkedIn Lead Gen Forms</p>
                </div>
                <Switch
                  checked={linkedinSettings.lead_sync_enabled}
                  onCheckedChange={(checked) => setLinkedinSettings({ ...linkedinSettings, lead_sync_enabled: checked })}
                />
              </div>

              <Button onClick={saveLinkedInSettings} disabled={savingSettings}>
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Instagram Tab */}
        <TabsContent value="instagram" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Instagram className="h-5 w-5 text-pink-600" />
                    Instagram Direct Messages
                  </CardTitle>
                  <CardDescription>
                    Connect your Instagram Business accounts for DM automation
                  </CardDescription>
                </div>
                <Dialog open={showInstagramConnect} onOpenChange={setShowInstagramConnect}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Connect Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Connect Instagram Account</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Instagram ID *</Label>
                        <Input
                          placeholder="Page ID linked to Instagram"
                          value={instagramForm.instagram_id}
                          onChange={(e) => setInstagramForm({ ...instagramForm, instagram_id: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Username *</Label>
                        <Input
                          placeholder="e.g., mybusiness"
                          value={instagramForm.username}
                          onChange={(e) => setInstagramForm({ ...instagramForm, username: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Access Token *</Label>
                        <Input
                          type="password"
                          placeholder="IG token"
                          value={instagramForm.access_token}
                          onChange={(e) => setInstagramForm({ ...instagramForm, access_token: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowInstagramConnect(false)}>Cancel</Button>
                      <Button onClick={connectInstagram} disabled={connecting}>
                        {connecting ? 'Connecting...' : 'Connect'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {instagramAccounts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                  <Instagram className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No Instagram accounts connected</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {instagramAccounts.map((account) => (
                    <div key={account.id} className="p-4 border rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Instagram className="h-5 w-5 text-pink-600" />
                        <div>
                          <p className="font-semibold">@{account.username}</p>
                          <p className="text-xs text-muted-foreground">ID: {account.instagram_id}</p>
                        </div>
                      </div>
                      <Badge variant={account.is_active ? "default" : "secondary"}>
                        {account.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GMB Tab */}
        <TabsContent value="gmb" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    Google My Business
                  </CardTitle>
                  <CardDescription>
                    Connect your GMB locations to respond to reviews and messages
                  </CardDescription>
                </div>
                <Dialog open={showGmbConnect} onOpenChange={setShowGmbConnect}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Connect Location
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Connect GMB Location</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Location Name *</Label>
                        <Input
                          placeholder="My Business Name"
                          value={gmbForm.location_name}
                          onChange={(e) => setGmbForm({ ...gmbForm, location_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Location ID *</Label>
                        <Input
                          placeholder="accounts/X/locations/Y"
                          value={gmbForm.location_id}
                          onChange={(e) => setGmbForm({ ...gmbForm, location_id: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Access Token *</Label>
                        <Input
                          type="password"
                          value={gmbForm.access_token}
                          onChange={(e) => setGmbForm({ ...gmbForm, access_token: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Refresh Token *</Label>
                        <Input
                          type="password"
                          value={gmbForm.refresh_token}
                          onChange={(e) => setGmbForm({ ...gmbForm, refresh_token: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowGmbConnect(false)}>Cancel</Button>
                      <Button onClick={connectGMB} disabled={connecting}>
                        {connecting ? 'Connecting...' : 'Connect'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {gmbLocations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No GMB locations connected</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {gmbLocations.map((location) => (
                    <div key={location.id} className="p-4 border rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-semibold">{location.location_name}</p>
                          <p className="text-xs text-muted-foreground">ID: {location.location_id}</p>
                        </div>
                      </div>
                      <Badge variant={location.is_active ? "default" : "secondary"}>
                        {location.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

