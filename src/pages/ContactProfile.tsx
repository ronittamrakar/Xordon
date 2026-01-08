import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Mail, MessageSquare, Phone, Calendar, Building, Globe, MapPin, Tag, Send, MoreVertical,
  Edit, Trash2, ArrowLeft, Clock, CheckCircle, XCircle, DollarSign, Plus, Briefcase,
  FileText, Activity, User, Linkedin, Twitter, ExternalLink, Upload, Download,
  CheckSquare, AlertCircle, TrendingUp, History, Users, Target, Zap, Link2, File,
  FolderKanban, Ticket, HeartPulse, Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import opportunitiesApi from '@/services/opportunitiesApi';
import { format, formatDistanceToNow } from 'date-fns';
import { ticketsApi, Ticket as HelpdeskTicket } from '@/services/ticketsApi';
import invoicesApi from '@/services/invoicesApi';
import { Contact } from '@/types';
import { useCallSession } from '@/contexts/CallSessionContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- Types ---

interface Message {
  id: string;
  type: 'email' | 'sms' | 'call';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  from: string;
  to: string;
  status: 'sent' | 'delivered' | 'failed' | 'bounced' | 'completed';
  createdAt: string;
  campaignId?: string;
  metadata?: Record<string, unknown>;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
  created_by?: string;
}

// --- Component ---

export default function ContactProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { requestSoftphoneCall } = useCallSession();

  // --- State ---
  const [activeTab, setActiveTab] = useState('overview');
  const [messages, setMessages] = useState<Message[]>([]);
  const [emailAccounts, setEmailAccounts] = useState<any[]>([]);
  const [smsAccounts, setSmsAccounts] = useState<any[]>([]);

  // Compose State
  const [composeType, setComposeType] = useState<'email' | 'sms'>('email');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState('');
  const [subject, setSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState<Contact | null>(null);
  const [tagsInput, setTagsInput] = useState('');

  // Task State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', due_date: '' });
  const [tasks, setTasks] = useState<Task[]>([]);

  // Note State
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);

  // --- Queries ---

  const { data: contact, isLoading: isLoadingContact, refetch: refetchContact } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => api.getContact(id!),
    enabled: !!id,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['contact-deals', id],
    queryFn: async () => {
      const res = await opportunitiesApi.list({ contact_id: Number(id) });
      return res.data;
    },
    enabled: !!id,
  });

  // Fetch projects for this contact
  const { data: contactProjects = [] } = useQuery({
    queryKey: ['contact-projects', id],
    queryFn: async () => {
      const res = await api.projects.getAll();
      return (res.items || []).filter((p: any) =>
        p.contact_id === parseInt(id || '') ||
        (p.title?.toLowerCase().includes(contact?.firstName?.toLowerCase()) && p.title?.toLowerCase().includes(contact?.lastName?.toLowerCase()))
      );
    },
    enabled: !!contact,
  });

  // Fetch tickets for this contact
  const { data: contactTickets = [] } = useQuery({
    queryKey: ['contact-tickets', contact?.email],
    queryFn: () => ticketsApi.list({ requester_email: contact?.email }),
    enabled: !!contact?.email,
  });

  // Fetch invoices for this contact
  const { data: contactInvoicesResponse } = useQuery({
    queryKey: ['contact-invoices', id],
    queryFn: () => invoicesApi.listInvoices({ contact_id: Number(id) }),
    enabled: !!id,
  });
  const contactInvoices = contactInvoicesResponse?.data || [];

  // --- Effects ---

  useEffect(() => {
    if (contact) {
      setEditedContact({ ...contact });
      setTagsInput(contact.tags?.map(tag => tag.name).join(', ') || '');
      loadMessages(contact);
      loadAccounts();
      loadTasks();
      loadNotes();
    }
  }, [contact]);

  // --- Actions ---

  const loadAccounts = async () => {
    try {
      const [emailAccs, smsAccs] = await Promise.all([
        api.getSendingAccounts(),
        api.getSMSAccounts()
      ]);

      const formattedEmailAccs = emailAccs
        .filter(acc => acc.type === 'gmail' || acc.type === 'smtp')
        .map(acc => ({
          id: acc.id,
          email: acc.email,
          provider: acc.type,
          isActive: (acc as any).is_active || true
        }));

      setEmailAccounts(formattedEmailAccs);
      if (formattedEmailAccs.length > 0) setSelectedAccount(formattedEmailAccs[0].id);

      const formattedSmsAccs = smsAccs.accounts || [];
      setSmsAccounts(formattedSmsAccs);
      if (formattedSmsAccs.length > 0) setSelectedPhoneNumber(formattedSmsAccs[0].phone_number);

    } catch (error) {
      console.error("Failed to load accounts", error);
    }
  };

  const loadMessages = async (targetContact: Contact) => {
    try {
      const [emailResponse, smsReplies, callLogs] = await Promise.all([
        api.getEmailReplies(),
        api.getSMSReplies(),
        api.getCallLogs(),
      ]);

      const emails = emailResponse?.replies || [];
      const callLogsData = callLogs?.logs || callLogs || [];
      const contactMessages: Message[] = [];

      const normalizedEmail = targetContact.email?.toLowerCase();
      const normalizedPhone = targetContact.phone?.replace(/[^\d+]/g, '');

      if (normalizedEmail) {
        emails.forEach(email => {
          const recipient = email.recipient_email || email.recipientEmail;
          const sender = email.from_email || email.senderEmail;
          if (recipient?.toLowerCase() === normalizedEmail || sender?.toLowerCase() === normalizedEmail) {
            contactMessages.push({
              id: String(email.id),
              type: 'email',
              direction: recipient?.toLowerCase() === normalizedEmail ? 'inbound' : 'outbound',
              subject: email.subject,
              content: (email.body as string) || (email.content as string) || '',
              from: sender,
              to: recipient,
              status: (email.status as any) || 'sent',
              createdAt: email.created_at || email.createdAt,
            });
          }
        });
      }

      if (normalizedPhone) {
        smsReplies.forEach(sms => {
          const smsPhone = (sms.phone_number || '').replace(/[^\d+]/g, '');
          if (smsPhone === normalizedPhone) {
            contactMessages.push({
              id: sms.id,
              type: 'sms',
              direction: (sms.direction || 'outbound') as any,
              content: sms.message,
              from: sms.direction === 'inbound' ? sms.phone_number : 'You',
              to: sms.direction === 'inbound' ? 'You' : sms.phone_number,
              status: (sms.status as any) || 'sent',
              createdAt: sms.received_at || sms.created_at,
            });
          }
        });

        callLogsData.forEach(call => {
          const callPhone = (call.phone_number || call.to || call.from || '').replace(/[^\d+]/g, '');
          if (!callPhone || callPhone !== normalizedPhone) return;
          contactMessages.push({
            id: call.id,
            type: 'call',
            direction: call.direction as any || 'outbound',
            content: `Call ${call.status || 'completed'} - ${call.duration ? `${call.duration}s` : ''}`,
            from: call.from || 'Unknown',
            to: call.to || normalizedPhone,
            status: (call.status as any) || 'completed',
            createdAt: call.created_at || call.createdAt,
          });
        });
      }

      contactMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(contactMessages);
    } catch (error) {
      console.error("Error loading messages", error);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await api.crm.getTasks();
      // Filter tasks related to this contact (if backend supports it)
      setTasks(response.tasks as Task[] || []);
    } catch (error) {
      console.error("Error loading tasks", error);
      setTasks([]);
    }
  };

  const loadNotes = () => {
    // Load notes from contact notes field
    if (contact?.notes) {
      setNotes([{
        id: '1',
        content: contact.notes,
        created_at: contact.updatedAt || contact.createdAt || new Date().toISOString()
      }]);
    }
  };

  const handleSendMessage = async () => {
    if (!contact) return;
    if (!messageContent.trim()) {
      toast({ title: 'Error', description: 'Message cannot be empty', variant: 'destructive' });
      return;
    }

    setIsSending(true);
    try {
      if (composeType === 'email') {
        if (!contact.email) throw new Error('Contact has no email');
        if (!selectedAccount) throw new Error('No sending account selected');

        await api.sendEmail({
          to_email: contact.email,
          subject: subject || 'No Subject',
          body: messageContent,
          sending_account_id: selectedAccount,
          save_to_sent: true,
        });
      } else {
        if (!contact.phone) throw new Error('Contact has no phone number');

        await api.sendIndividualSMS({
          to: contact.phone,
          content: messageContent,
          senderNumber: selectedPhoneNumber || undefined,
        });
      }

      toast({ title: 'Sent', description: 'Message sent successfully' });
      setMessageContent('');
      setSubject('');
      loadMessages(contact);
    } catch (error) {
      toast({
        title: 'Failed',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCall = () => {
    if (!contact?.phone) {
      toast({ title: 'No phone number', variant: 'destructive' });
      return;
    }
    requestSoftphoneCall({
      number: contact.phone,
      recipientName: `${contact.firstName} ${contact.lastName}`,
      source: 'dialer',
      metadata: { contactId: contact.id }
    });
  };

  const handleSaveContact = async () => {
    if (!editedContact || !id) return;
    try {
      const tagNames = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const payload: any = { ...editedContact, tags: tagNames };
      delete payload.id;
      delete payload.createdAt;
      delete payload.updatedAt;

      await api.updateContact(id, payload);
      await refetchContact();
      setIsEditing(false);
      toast({ title: 'Success', description: 'Contact updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update contact', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await api.deleteContact(id!);
      toast({ title: 'Deleted', description: 'Contact deleted' });
      navigate('/contacts');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete contact', variant: 'destructive' });
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;
    try {
      await api.crm.createTask({
        ...newTask,
        contact_id: id,
      });
      toast({ title: 'Success', description: 'Task created' });
      setNewTask({ title: '', description: '', priority: 'medium', due_date: '' });
      setIsAddingTask(false);
      loadTasks();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create task', variant: 'destructive' });
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await api.crm.updateTaskStatus(taskId, newStatus);
      loadTasks();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return;
    try {
      const updatedNotes = contact?.notes ? `${contact.notes}\n\n---\n${new Date().toISOString()}\n${newNote}` : newNote;
      await api.updateContact(id, { notes: updatedNotes });
      toast({ title: 'Success', description: 'Note added' });
      setNewNote('');
      await refetchContact();
      loadNotes();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add note', variant: 'destructive' });
    }
  };

  // --- Render ---

  if (isLoadingContact) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
        <h2 className="text-xl font-semibold">Contact not found</h2>
        <Button onClick={() => navigate('/contacts')}>Back to Contacts</Button>
      </div>
    );
  }

  const totalInteractions = messages.length;
  const openDeals = deals.filter((d: any) => d.status === 'open').length;
  const wonDeals = deals.filter((d: any) => d.status === 'won').length;
  const totalValue = deals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl animate-in fade-in duration-500">

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" className="gap-2 pl-0 hover:pl-2 transition-all" onClick={() => navigate('/contacts')}>
          <ArrowLeft className="h-4 w-4" /> Back to Contacts
        </Button>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Actions <MoreVertical className="ml-2 h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Contact Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4" /> Edit Contact</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/proposals/new?contactId=${id}`)}><FileText className="mr-2 h-4 w-4" /> Create Proposal</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsAddingTask(true)}><CheckSquare className="mr-2 h-4 w-4" /> Add Task</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/contacts', { state: { exportIds: [id] } })}><Download className="mr-2 h-4 w-4" /> Export</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => navigate('/crm/deals', { state: { create: true, contactId: contact.id } })}>
            <Plus className="h-4 w-4 mr-2" /> Create Deal
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" /> Total Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInteractions}</div>
            <p className="text-xs text-muted-foreground mt-1">Emails, SMS, Calls</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Active Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openDeals}</div>
            <p className="text-xs text-muted-foreground mt-1">{wonDeals} won</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Pipeline value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckSquare className="h-4 w-4" /> Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.filter(t => t.status !== 'completed').length}</div>
            <p className="text-xs text-muted-foreground mt-1">{tasks.filter(t => t.status === 'completed').length} completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Sidebar - Profile Info */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          <Card className="border-t-4 border-t-primary shadow-sm overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary/10 to-primary/5"></div>
            <div className="px-6 -mt-12 mb-4">
              <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground font-bold">
                  {contact.firstName?.[0]}{contact.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardContent className="px-6 pb-6 pt-0">
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-foreground">{contact.firstName} {contact.lastName}</h1>
                <p className="text-muted-foreground font-medium">{contact.title}</p>
                {contact.company && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Building className="h-3 w-3" /> {contact.company}
                  </p>
                )}
              </div>

              <div className="flex gap-2 mb-6">
                <Button size="sm" className="flex-1" onClick={() => { setActiveTab('overview'); setComposeType('email'); }}>
                  <Mail className="h-4 w-4 mr-2" /> Email
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={handleCall}>
                  <Phone className="h-4 w-4 mr-2" /> Call
                </Button>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4 text-sm">
                {contact.email && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs text-muted-foreground font-medium">Email</p>
                      <a href={`mailto:${contact.email}`} className="truncate font-medium hover:text-primary cursor-pointer block" title={contact.email}>{contact.email}</a>
                    </div>
                  </div>
                )}

                {contact.phone && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Phone</p>
                      <a href={`tel:${contact.phone}`} className="font-medium hover:text-primary cursor-pointer">{contact.phone}</a>
                    </div>
                  </div>
                )}

                {(contact.city || contact.country) && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Location</p>
                      <p className="font-medium">{[contact.city, contact.state, contact.country].filter(Boolean).join(', ')}</p>
                    </div>
                  </div>
                )}

                {contact.website && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Website</p>
                      <a href={contact.website} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline truncate block max-w-[180px] flex items-center gap-1">
                        {contact.website.replace(/^https?:\/\//, '')} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {(contact.linkedin || contact.twitter) && (
                <>
                  <Separator className="my-4" />
                  <div className="flex gap-2">
                    {contact.linkedin && (
                      <a href={contact.linkedin} target="_blank" rel="noreferrer" className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {contact.twitter && (
                      <a href={contact.twitter} target="_blank" rel="noreferrer" className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </>
              )}

              {contact.tags && contact.tags.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {contact.tags.map(tag => (
                        <Badge key={tag.id} variant="secondary" className="px-2 py-1 text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats/Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <Badge variant="outline" className="h-5 text-[12px]">{contact.leadSource || 'Direct'}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={contact.status === 'active' ? 'default' : 'secondary'} className="h-5 text-[12px] uppercase">
                  {contact.status || 'Active'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stage</span>
                <Badge variant="outline" className="h-5 text-[12px] capitalize">
                  {contact.stage || 'Lead'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Added</span>
                <span className="font-medium text-xs">{contact.createdAt ? format(new Date(contact.createdAt), 'MMM d, yyyy') : '-'}</span>
              </div>
              {contact.industry && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Industry</span>
                  <span className="font-medium text-xs">{contact.industry}</span>
                </div>
              )}
              {contact.companySize && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company Size</span>
                  <span className="font-medium text-xs">{contact.companySize}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Content - Tabs */}
        <div className="lg:col-span-8 xl:col-span-9">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 mb-6 space-x-6">
              <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-2 font-medium">
                Overview
              </TabsTrigger>
              <TabsTrigger value="deals" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-2 font-medium">
                Deals ({deals.length})
              </TabsTrigger>
              <TabsTrigger value="invoices" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-2 font-medium">
                Invoices ({contactInvoices.length})
              </TabsTrigger>
              <TabsTrigger value="health" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-2 font-medium">
                <HeartPulse className="h-4 w-4 mr-1" /> Health
              </TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-2 font-medium">
                Tasks ({tasks.filter(t => t.status !== 'completed').length})
              </TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-2 font-medium">
                Notes
              </TabsTrigger>
              <TabsTrigger value="files" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-2 font-medium">
                Files
              </TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6 mt-0">

              {/* Compose Box */}
              <Card id="compose-area">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      size="sm"
                      variant={composeType === 'email' ? 'default' : 'ghost'}
                      onClick={() => setComposeType('email')}
                      className="h-8"
                    >
                      <Mail className="h-4 w-4 mr-2" /> Email
                    </Button>
                    <Button
                      size="sm"
                      variant={composeType === 'sms' ? 'default' : 'ghost'}
                      onClick={() => setComposeType('sms')}
                      className="h-8"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" /> SMS
                    </Button>
                  </div>
                  <Separator />
                </CardHeader>
                <CardContent className="space-y-4">
                  {composeType === 'email' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">From</label>
                          <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                          >
                            <option value="" disabled>Select sender...</option>
                            {emailAccounts.map(acc => (
                              <option key={acc.id} value={acc.id}>{acc.email}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Subject</label>
                          <Input
                            className="h-9"
                            placeholder="Subject line..."
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {composeType === 'sms' && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">From Number</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                        value={selectedPhoneNumber}
                        onChange={(e) => setSelectedPhoneNumber(e.target.value)}
                      >
                        <option value="" disabled>Select number...</option>
                        {smsAccounts.map(acc => (
                          <option key={acc.id} value={acc.phone_number}>{acc.name} ({acc.phone_number})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <Textarea
                    placeholder={`Type your ${composeType} message...`}
                    className="min-h-[100px] resize-none"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                  />
                </CardContent>
                <CardFooter className="flex justify-end pt-0">
                  <Button onClick={handleSendMessage} disabled={isSending}>
                    {isSending ? 'Sending...' : <span className="flex items-center">Send <Send className="ml-2 h-4 w-4" /></span>}
                  </Button>
                </CardFooter>
              </Card>

              {/* Timeline / Activity Stream */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" /> Activity Timeline
                </h3>

                <div className="relative border-l-2 border-muted ml-3 space-y-8 pl-8 py-2">
                  {messages.length === 0 ? (
                    <div className="text-muted-foreground text-sm italic py-4">No activity yet. Start a conversation!</div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div key={msg.id || idx} className="relative group">
                        <div className={cn(
                          "absolute -left-[41px] top-0 h-6 w-6 rounded-full border-2 flex items-center justify-center bg-background",
                          msg.type === 'email' ? "border-blue-500 text-blue-500" :
                            msg.type === 'sms' ? "border-green-500 text-green-500" :
                              "border-purple-500 text-purple-500"
                        )}>
                          {msg.type === 'email' && <Mail className="h-3 w-3" />}
                          {msg.type === 'sms' && <MessageSquare className="h-3 w-3" />}
                          {msg.type === 'call' && <Phone className="h-3 w-3" />}
                        </div>

                        <Card className="mb-2">
                          <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between space-y-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="capitalize">{msg.direction}</Badge>
                              <span className="font-medium text-sm">
                                {msg.subject || (msg.type === 'call' ? 'Phone Call' : 'Message')}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(msg.createdAt), 'MMM d, h:mm a')}
                            </span>
                          </CardHeader>
                          <CardContent className="p-3 pt-2 text-sm text-foreground/80">
                            {msg.content}
                          </CardContent>
                          {msg.status && (
                            <CardFooter className="p-3 pt-0 text-xs text-muted-foreground flex justify-end">
                              <span className="flex items-center gap-1">
                                {msg.status === 'sent' && <CheckCircle className="h-3 w-3 text-green-500" />}
                                <span className="capitalize">{msg.status}</span>
                              </span>
                            </CardFooter>
                          )}
                        </Card>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </TabsContent>

            {/* DEALS TAB */}
            <TabsContent value="deals" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deals.length === 0 ? (
                  <Card className="col-span-full border-dashed">
                    <CardContent className="flex flex-col items-center justify-center h-48">
                      <Briefcase className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                      <p className="text-muted-foreground font-medium">No active deals</p>
                      <Button variant="link" onClick={() => navigate('/crm/deals', { state: { create: true, contactId: contact.id } })}>
                        Create a deal for this contact
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  deals.map((deal: any) => (
                    <Card key={deal.id} className="hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/crm/pipeline')}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex justify-between items-start">
                          <span>{deal.name}</span>
                          <Badge variant={deal.status === 'won' ? 'default' : 'outline'} className={cn(
                            deal.status === 'won' ? 'bg-green-600' : deal.status === 'lost' ? 'bg-red-600' : ''
                          )}>
                            {deal.stage_name || deal.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Expected close: {deal.expected_close_date ? format(new Date(deal.expected_close_date), 'MMM d, yyyy') : 'N/A'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-primary">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: deal.currency || 'USD' }).format(deal.value)}
                        </div>
                        {deal.notes && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{deal.notes}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}

                <Card className="flex flex-col items-center justify-center border-dashed font-medium text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer min-h-[140px]"
                  onClick={() => navigate('/crm/deals', { state: { create: true, contactId: contact.id } })}>
                  <Plus className="h-6 w-6 mb-2" />
                  <span>Add New Deal</span>
                </Card>
              </div>
            </TabsContent>

            {/* INVOICES TAB */}
            <TabsContent value="invoices" className="mt-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Invoices</h3>
                <Button onClick={() => navigate('/finance/invoices/new', { state: { contactId: contact.id } })}>
                  <Plus className="h-4 w-4 mr-2" /> Create Invoice
                </Button>
              </div>

              <div className="space-y-4">
                {contactInvoices.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center h-48">
                      <FileText className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                      <p className="text-muted-foreground font-medium">No invoices found</p>
                    </CardContent>
                  </Card>
                ) : (
                  contactInvoices.map((invoice) => (
                    <Card key={invoice.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold">{invoice.invoice_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(invoice.issue_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(invoice.total)}</p>
                            <Badge variant={
                              invoice.status === 'paid' ? 'default' :
                                invoice.status === 'overdue' ? 'destructive' :
                                  invoice.status === 'sent' ? 'secondary' : 'outline'
                            } className="uppercase text-[12px]">
                              {invoice.status}
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/finance/invoices/${invoice.id}`)}>
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* CUSTOMER HEALTH TAB */}
            <TabsContent value="health" className="mt-0 space-y-6">
              {/* Quick Actions */}
              <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/projects/new`, {
                    state: {
                      contactId: contact.id,
                      title: `${contact.firstName} ${contact.lastName} - Project`,
                      description: `Project for ${contact.company || 'client'}`
                    }
                  })}>
                    <FolderKanban className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/helpdesk/tickets/new`, {
                    state: {
                      contactId: contact.id,
                      contactName: `${contact.firstName} ${contact.lastName}`,
                      contactEmail: contact.email
                    }
                  })}>
                    <Ticket className="h-4 w-4 mr-2" />
                    Create Ticket
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/proposals/new?contactId=${contact.id}`)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Create Proposal
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/scheduling/appointments/new`, {
                    state: {
                      contactId: contact.id,
                      contactName: `${contact.firstName} ${contact.lastName}`,
                      contactEmail: contact.email,
                      contactPhone: contact.phone
                    }
                  })}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </Button>
                </CardContent>
              </Card>

              {/* Health Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <FolderKanban className="h-4 w-4" /> Active Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{contactProjects.filter((p: any) => p.status !== 'completed' && p.status !== 'closed').length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <Button variant="link" className="h-auto p-0 text-xs" onClick={() => navigate('/projects')}>
                        View all projects →
                      </Button>
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Ticket className="h-4 w-4" /> Open Tickets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{contactTickets.filter((t: HelpdeskTicket) => t.status !== 'resolved' && t.status !== 'closed').length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <Button variant="link" className="h-auto p-0 text-xs" onClick={() => navigate('/helpdesk/tickets')}>
                        View all tickets →
                      </Button>
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <HeartPulse className="h-4 w-4" /> Health Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold text-green-600">Good</div>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">Active</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Last interaction: {messages.length > 0 ? formatDistanceToNow(new Date(messages[messages.length - 1]?.createdAt), { addSuffix: true }) : 'Never'}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Customer Journey Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Customer Journey
                  </CardTitle>
                  <CardDescription>Track this contact's progression through your sales and service pipeline</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {[
                      { stage: 'Lead', icon: Target, active: contact.stage === 'lead' || !contact.stage, completed: ['opportunity', 'customer', 'client'].includes(contact.stage || '') },
                      { stage: 'Opportunity', icon: TrendingUp, active: contact.stage === 'opportunity', completed: ['customer', 'client'].includes(contact.stage || '') },
                      { stage: 'Proposal', icon: FileText, active: deals.some((d: any) => d.status === 'proposal'), completed: deals.some((d: any) => d.status === 'won') },
                      { stage: 'Customer', icon: Users, active: contact.stage === 'customer' || contact.stage === 'client', completed: false },
                    ].map((item, idx, arr) => (
                      <React.Fragment key={item.stage}>
                        <div className={cn(
                          "flex flex-col items-center gap-1 flex-shrink-0",
                          item.active ? "text-primary" : item.completed ? "text-green-600" : "text-muted-foreground"
                        )}>
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center border-2",
                            item.active ? "border-primary bg-primary/10" :
                              item.completed ? "border-green-600 bg-green-100" : "border-muted"
                          )}>
                            {item.completed ? <CheckCircle className="h-5 w-5" /> : <item.icon className="h-5 w-5" />}
                          </div>
                          <span className="text-xs font-medium">{item.stage}</span>
                        </div>
                        {idx < arr.length - 1 && (
                          <div className={cn(
                            "h-0.5 flex-1 min-w-8 mt-[-20px]",
                            item.completed ? "bg-green-600" : "bg-muted"
                          )} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Linked Resources */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FolderKanban className="h-4 w-4" />
                      Recent Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {contactProjects.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No projects linked to this contact</p>
                        <Button variant="link" size="sm" onClick={() => navigate('/projects/new', { state: { contactId: contact.id, title: `${contact.firstName} ${contact.lastName} - Project` } })}>
                          Create first project
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {contactProjects.slice(0, 3).map((project: any) => (
                          <div key={project.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                            <div>
                              <p className="text-sm font-medium">{project.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="secondary" className="px-1 h-4 text-[12px]">{project.status}</Badge>
                                <span>Updated {formatDistanceToNow(new Date(project.updated_at || project.created_at), { addSuffix: true })}</span>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}`) }}>
                                  View Project
                                </DropdownMenuItem>
                                {project.status === 'completed' && (
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    const subject = encodeURIComponent(`Review Request: ${project.title}`);
                                    const body = encodeURIComponent(`Hi ${contact.firstName},\n\nWe hope you are happy with the project ${project.title}. Could you please leave us a review?\n\nThanks!`);
                                    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
                                  }}>
                                    <Star className="h-4 w-4 mr-2" />
                                    Request Review
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Ticket className="h-4 w-4" />
                      Support Tickets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {contactTickets.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No support tickets for this contact</p>
                        <Button variant="link" size="sm" onClick={() => navigate('/helpdesk/tickets/new', { state: { contactId: contact.id, contactName: `${contact.firstName} ${contact.lastName}` } })}>
                          Create first ticket
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {contactTickets.slice(0, 3).map((ticket: HelpdeskTicket) => (
                          <div key={ticket.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/helpdesk/tickets/${ticket.id}`)}>
                            <div>
                              <p className="text-sm font-medium">#{ticket.ticket_number} - {ticket.subject}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant={ticket.priority === 'high' || ticket.priority === 'urgent' ? 'destructive' : 'outline'} className="px-1 h-4 text-[12px]">
                                  {ticket.priority}
                                </Badge>
                                <Badge variant="secondary" className="px-1 h-4 text-[12px]">{ticket.status}</Badge>
                                <span>{formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}</span>
                              </div>
                            </div>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TASKS TAB */}
            <TabsContent value="tasks" className="mt-0 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Tasks</h3>
                <Button size="sm" onClick={() => setIsAddingTask(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add Task
                </Button>
              </div>

              {isAddingTask && (
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="text-base">New Task</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input
                        placeholder="Task title..."
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Task description..."
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={newTask.due_date}
                          onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddingTask(false)}>Cancel</Button>
                    <Button onClick={handleAddTask}>Create Task</Button>
                  </CardFooter>
                </Card>
              )}

              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center h-32">
                      <CheckSquare className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                      <p className="text-muted-foreground text-sm">No tasks yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  tasks.map(task => (
                    <Card key={task.id} className={cn(
                      "transition-all",
                      task.status === 'completed' && "opacity-60"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={task.status === 'completed'}
                            onCheckedChange={() => handleToggleTask(task.id, task.status)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={cn(
                                "font-medium",
                                task.status === 'completed' && "line-through"
                              )}>{task.title}</h4>
                              <Badge variant={
                                task.priority === 'high' ? 'destructive' :
                                  task.priority === 'medium' ? 'default' : 'secondary'
                              } className="text-xs">
                                {task.priority}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {task.due_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(task.due_date), 'MMM d, yyyy')}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* NOTES TAB */}
            <TabsContent value="notes" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Add Note</CardTitle>
                  <CardDescription>Private notes about this contact.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Type your note here..."
                    className="min-h-[100px]"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                      <Plus className="h-4 w-4 mr-2" /> Add Note
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {notes.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center h-32">
                      <FileText className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                      <p className="text-muted-foreground text-sm">No notes yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  notes.map(note => (
                    <Card key={note.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {contact.additionalDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Additional Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{contact.additionalDetails}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* FILES TAB */}
            <TabsContent value="files" className="mt-0">
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <Upload className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground font-medium mb-2">No files uploaded</p>
                  <p className="text-sm text-muted-foreground mb-4">Upload contracts, proposals, or other documents</p>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" /> Upload File
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Contact Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>Update contact information and details.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] px-1">
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input value={editedContact?.firstName || ''} onChange={(e) => setEditedContact(prev => prev ? ({ ...prev, firstName: e.target.value }) : null)} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input value={editedContact?.lastName || ''} onChange={(e) => setEditedContact(prev => prev ? ({ ...prev, lastName: e.target.value }) : null)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={editedContact?.email || ''} onChange={(e) => setEditedContact(prev => prev ? ({ ...prev, email: e.target.value }) : null)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={editedContact?.phone || ''} onChange={(e) => setEditedContact(prev => prev ? ({ ...prev, phone: e.target.value }) : null)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input value={editedContact?.company || ''} onChange={(e) => setEditedContact(prev => prev ? ({ ...prev, company: e.target.value }) : null)} />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={editedContact?.title || ''} onChange={(e) => setEditedContact(prev => prev ? ({ ...prev, title: e.target.value }) : null)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input value={editedContact?.industry || ''} onChange={(e) => setEditedContact(prev => prev ? ({ ...prev, industry: e.target.value }) : null)} />
                </div>
                <div className="space-y-2">
                  <Label>Lead Source</Label>
                  <Input value={editedContact?.leadSource || ''} onChange={(e) => setEditedContact(prev => prev ? ({ ...prev, leadSource: e.target.value }) : null)} />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={editedContact?.address || ''} onChange={(e) => setEditedContact(prev => prev ? ({ ...prev, address: e.target.value }) : null)} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={editedContact?.city || ''} onChange={(e) => setEditedContact(prev => prev ? ({ ...prev, city: e.target.value }) : null)} />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={editedContact?.state || ''} onChange={(e) => setEditedContact(prev => prev ? ({ ...prev, state: e.target.value }) : null)} />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={editedContact?.country || ''} onChange={(e) => setEditedContact(prev => prev ? ({ ...prev, country: e.target.value }) : null)} />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={editedContact?.website || ''} onChange={(e) => setEditedContact(prev => prev ? ({ ...prev, website: e.target.value }) : null)} />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn</Label>
                  <Input value={editedContact?.linkedin || ''} onChange={(e) => setEditedContact(prev => prev ? ({ ...prev, linkedin: e.target.value }) : null)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="customer, vip, enterprise" />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSaveContact}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
