import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Edit,
  MoreHorizontal,
  Plus,
  FileTextIcon,
  DollarSign,
  Calendar,
  ClipboardList,
  Home,
  User,
  Download,
  Send,
  LogIn,
  Archive,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Client {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  status: string;
  leadSource?: string;
  clientSince?: string;
  monthlyRetainer?: number;
  billingEmail?: string;
  notes?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  contactCount: number;
  createdAt: string;
}

interface Property {
  id: string;
  companyId: string;
  propertyType: string;
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isPrimary: boolean;
  taxRate?: number;
  notes?: string;
}

interface Contact {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  title?: string;
  status?: string;
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isEditingClient, setIsEditingClient] = useState(false);
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [activeTab, setActiveTab] = useState('active-work');
  const [noteContent, setNoteContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [propertyForm, setPropertyForm] = useState({
    street1: '',
    street2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
  });

  // Fetch client details
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => api.getCompany(id!),
    enabled: !!id,
  });

  // Fetch properties
  const { data: propertiesData } = useQuery({
    queryKey: ['client-properties', id],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${id}/properties`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'X-Workspace-Id': localStorage.getItem('workspace_id') || '',
          'X-Company-Id': localStorage.getItem('active_client_id') || '',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
    enabled: !!id,
  });

  const properties = propertiesData?.properties || [];

  // Fetch contacts
  const { data: contactsData } = useQuery({
    queryKey: ['client-contacts', id],
    queryFn: () => api.getCompanyContacts(id!),
    enabled: !!id,
  });

  const contacts = contactsData?.contacts || [];

  // Fetch overview data
  const { data: overviewData } = useQuery({
    queryKey: ['client-overview', id],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${id}/overview`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'X-Workspace-Id': localStorage.getItem('workspace_id') || '',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch overview');
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch notes
  const { data: notesData } = useQuery({
    queryKey: ['client-notes', id],
    queryFn: () => api.getCompanyNotes(id!),
    enabled: !!id,
  });

  const notes = notesData?.notes || [];

  // Add property mutation
  const addPropertyMutation = useMutation({
    mutationFn: async (data: typeof propertyForm) => {
      const response = await fetch(`/api/clients/${id}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'X-Workspace-Id': localStorage.getItem('workspace_id') || '',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add property');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-properties', id] });
      setIsAddingProperty(false);
      setPropertyForm({
        street1: '',
        street2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States',
      });
      toast({ title: 'Property added', description: 'Property has been added successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add property.', variant: 'destructive' });
    },
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: (content: string) => api.addCompanyNote(id!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-notes', id] });
      setNoteContent('');
      setIsAddingNote(false);
      toast({ title: 'Note added', description: 'Note has been added successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add note.', variant: 'destructive' });
    },
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: (data: Partial<Client>) => api.updateCompany(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      setIsEditingClient(false);
      toast({ title: 'Client updated', description: 'Client has been updated successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update client.', variant: 'destructive' });
    },
  });

  // Download VCard
  const handleDownloadVCard = () => {
    window.open(`/api/clients/${id}/vcard`, '_blank');
    toast({ title: 'VCard downloaded', description: 'Contact VCard has been downloaded.' });
  };

  // Send login email
  const sendLoginMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/clients/${id}/send-login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'X-Workspace-Id': localStorage.getItem('workspace_id') || '',
        },
      });
      if (!response.ok) throw new Error('Failed to send login email');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Login email sent', description: 'Login email has been sent to the client.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to send login email.', variant: 'destructive' });
    },
  });

  // Log in as client
  const loginAsClientMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/clients/${id}/login-as`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'X-Workspace-Id': localStorage.getItem('workspace_id') || '',
        },
      });
      if (!response.ok) throw new Error('Failed to create client session');
      return response.json();
    },
    onSuccess: (data) => {
      window.open(data.portalUrl, '_blank');
      toast({ title: 'Client portal opened', description: 'You are now logged in as the client.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to log in as client.', variant: 'destructive' });
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  if (clientLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Client not found</p>
              <Button className="mt-4" onClick={() => navigate('/clients')}>
                Back to Clients
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              {client.logoUrl && <AvatarImage src={client.logoUrl} alt={client.name} />}
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {getInitials(client.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{client.name}</h1>
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  Lead
                </Badge>
              </div>
              {client.domain && (
                <p className="text-muted-foreground">{client.domain}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="default" className="bg-green-700 hover:bg-green-800">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button variant="outline" onClick={() => setIsEditingClient(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  More Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                  Create new...
                </div>
                <DropdownMenuItem>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Request
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  Quote
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Job
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  Invoice
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Collect Payment
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Task
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar Event
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsAddingProperty(true)}>
                  <Home className="h-4 w-4 mr-2" />
                  Property
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                  Client hub
                </div>
                <DropdownMenuItem>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Client
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadVCard}>
                  <Download className="h-4 w-4 mr-2" />
                  Download VCard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => sendLoginMutation.mutate()}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Login Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => loginAsClientMutation.mutate()}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Log in as Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Properties Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Properties
                  </CardTitle>
                  <Button
                    variant="link"
                    className="text-green-700"
                    onClick={() => setIsAddingProperty(true)}
                  >
                    + New Property
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {properties.length === 0 ? (
                  <div className="text-center py-8">
                    <Home className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-semibold">No properties</p>
                    <p className="text-sm text-muted-foreground">
                      No properties listed for this client yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {properties.map((property: Property) => (
                      <div
                        key={property.id}
                        className="flex items-start justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-muted rounded">
                            <Home className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {property.street1}
                              {property.isPrimary && (
                                <Badge variant="secondary" className="ml-2">
                                  Primary
                                </Badge>
                              )}
                            </p>
                            {property.street2 && (
                              <p className="text-sm text-muted-foreground">{property.street2}</p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              {[property.city, property.state, property.postalCode]
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contacts Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No contacts found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact: Contact) => (
                        <TableRow key={contact.id}>
                          <TableCell>
                            {contact.firstName} {contact.lastName}
                          </TableCell>
                          <TableCell>{contact.title || '-'}</TableCell>
                          <TableCell>{contact.phone || '-'}</TableCell>
                          <TableCell>{contact.email || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Overview Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Overview</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        New
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Request</DropdownMenuItem>
                      <DropdownMenuItem>Quote</DropdownMenuItem>
                      <DropdownMenuItem>Job</DropdownMenuItem>
                      <DropdownMenuItem>Invoice</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="active-work">Active Work</TabsTrigger>
                    <TabsTrigger value="requests">Requests</TabsTrigger>
                    <TabsTrigger value="quotes">Quotes</TabsTrigger>
                    <TabsTrigger value="jobs">Jobs</TabsTrigger>
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                  </TabsList>
                  <TabsContent value="active-work" className="space-y-4">
                    <div className="text-center py-8">
                      <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="font-semibold">No active work</p>
                      <p className="text-sm text-muted-foreground">
                        No active jobs, invoices or quotes for this client yet
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="requests" className="space-y-4">
                    <div className="text-center py-8">
                      <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="font-semibold">Client hasn't requested any work yet</p>
                      <p className="text-sm text-muted-foreground">
                        Clients can submit new requests for work online. You and your team also
                        create requests to keep track of new work that comes up.
                      </p>
                      <Button variant="link" className="mt-2 text-green-700">
                        New Request
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="quotes" className="space-y-4">
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No quotes yet</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="jobs" className="space-y-4">
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No jobs yet</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="invoices" className="space-y-4">
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No invoices yet</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Schedule Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Schedule
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        New
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Request
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Task
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Calendar className="h-4 w-4 mr-2" />
                        Calendar Event
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="font-semibold">No scheduled items</p>
                  <p className="text-sm text-muted-foreground">
                    Nothing is scheduled for this client yet
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.phone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Main</p>
                    <p className="text-sm">{client.phone}</p>
                  </div>
                )}
                {client.email && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Main</p>
                    <p className="text-sm text-green-700">{client.email}</p>
                  </div>
                )}
                {client.leadSource && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Lead Source</p>
                    <p className="text-sm">{client.leadSource}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tags</CardTitle>
                  <Button variant="link" className="text-green-700 h-auto p-0">
                    + New Tag
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">This client has no tags</p>
              </CardContent>
            </Card>

            {/* Last Client Communication */}
            <Card>
              <CardHeader>
                <CardTitle>Last client communication</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">
                  You haven't sent any client communications yet
                </p>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Billing history</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        New
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Invoice</DropdownMenuItem>
                      <DropdownMenuItem>Payment</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-semibold">No billing history</p>
                      <p className="text-xs text-muted-foreground">
                        This client hasn't been billed yet
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Current balance</span>
                  <span className="font-semibold">$0.00</span>
                </div>
              </CardContent>
            </Card>

            {/* Internal Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Internal notes</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Internal notes will only be seen by your team
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {notes.length > 0 ? (
                  <div className="space-y-3">
                    {notes.map((note: any) => (
                      <div key={note.id} className="border-l-2 border-primary pl-3">
                        <p className="text-sm">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {note.authorName} • {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
                <Textarea
                  placeholder="Note details"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={3}
                />
                <div className="space-y-2">
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer text-sm text-muted-foreground"
                    >
                      Drag your files here or{' '}
                      <span className="text-green-700">Select a File</span>
                    </label>
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {selectedFiles.length} file(s) selected
                    </div>
                  )}
                </div>
                <Button
                  className="w-full bg-green-700 hover:bg-green-800"
                  onClick={() => addNoteMutation.mutate(noteContent)}
                  disabled={!noteContent.trim() || addNoteMutation.isPending}
                >
                  {addNoteMutation.isPending ? 'Saving...' : 'Save Note'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Property Dialog */}
        <Dialog open={isAddingProperty} onOpenChange={setIsAddingProperty}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded">
                  <Home className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle>New property for {client.name}</DialogTitle>
                  <DialogDescription>Add a new property address</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="street1">Street 1</Label>
                <Input
                  id="street1"
                  value={propertyForm.street1}
                  onChange={(e) =>
                    setPropertyForm({ ...propertyForm, street1: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="street2">Street 2</Label>
                <Input
                  id="street2"
                  value={propertyForm.street2}
                  onChange={(e) =>
                    setPropertyForm({ ...propertyForm, street2: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={propertyForm.city}
                    onChange={(e) =>
                      setPropertyForm({ ...propertyForm, city: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={propertyForm.state}
                    onChange={(e) =>
                      setPropertyForm({ ...propertyForm, state: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Zip code</Label>
                  <Input
                    id="postalCode"
                    value={propertyForm.postalCode}
                    onChange={(e) =>
                      setPropertyForm({ ...propertyForm, postalCode: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <select
                  id="country"
                  className="w-full border rounded-md px-3 py-2"
                  value={propertyForm.country}
                  onChange={(e) =>
                    setPropertyForm({ ...propertyForm, country: e.target.value })
                  }
                >
                  <option value="Nepal">Nepal</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingProperty(false)}>
                Cancel
              </Button>
              <Button
                className="bg-green-700 hover:bg-green-800"
                onClick={() => addPropertyMutation.mutate(propertyForm)}
                disabled={addPropertyMutation.isPending}
              >
                {addPropertyMutation.isPending ? 'Creating...' : 'Create Property'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

