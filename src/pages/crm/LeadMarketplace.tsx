import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, ArrowUpDown, Star, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getServices, ServiceCategory } from '@/services/leadMarketplaceApi';

interface LeadRequest {
  id: number;
  consumer_name: string;
  consumer_email: string;
  consumer_phone?: string;
  title: string;
  description: string;
  services: string[]; // This relies on the backend returning comma-separated names
  quality_score?: number;
  is_spam?: boolean;
  status: 'pending' | 'routed' | 'accepted' | 'rejected';
  created_at: string;
}

export default function LeadMarketplace() {
  const [leads, setLeads] = useState<LeadRequest[]>([]);
  const [availableServices, setAvailableServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [formData, setFormData] = useState<{
    consumer_name: string;
    consumer_email: string;
    consumer_phone: string;
    title: string;
    description: string;
    services: number[];
  }>({
    consumer_name: '',
    consumer_email: '',
    consumer_phone: '',
    title: '',
    description: '',
    services: [],
  });

  useEffect(() => {
    loadLeads();
    loadServices();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; data: LeadRequest[] }>('/lead-marketplace/leads');
      if (response.data.success) {
        setLeads(response.data.data || []);
      } else {
        setLeads([]);
      }
    } catch (error) {
      console.error('Failed to load lead requests:', error);
      toast.error('Failed to load lead requests');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const response = await getServices();
      if (response.data.success) {
        setAvailableServices(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (formData.services.length === 0) {
        toast.error('Please select at least one service');
        return;
      }

      const payload = {
        consumer_name: formData.consumer_name,
        consumer_email: formData.consumer_email,
        consumer_phone: formData.consumer_phone,
        title: formData.title,
        description: formData.description,
        source: 'form' as const,
        services: formData.services.map(id => ({ service_id: id, quantity: 1 })),
      };

      await api.post('/lead-marketplace/leads', payload);
      toast.success('Lead request created successfully');
      setIsCreateDialogOpen(false);
      setFormData({
        consumer_name: '',
        consumer_email: '',
        consumer_phone: '',
        title: '',
        description: '',
        services: [],
      });
      loadLeads();
    } catch (error: any) {
      console.error('Failed to create lead request:', error);
      toast.error(error.response?.data?.error || 'Failed to create lead request');
    }
  };

  const toggleService = (serviceId: number) => {
    setFormData(prev => {
      const services = prev.services.includes(serviceId)
        ? prev.services.filter(id => id !== serviceId)
        : [...prev.services, serviceId];
      return { ...prev, services };
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      routed: 'default',
      accepted: 'default',
      rejected: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getQualityBadge = (score?: number, isSpam?: boolean) => {
    if (isSpam) {
      return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Spam</Badge>;
    }
    if (!score) return null;

    const color = score >= 80 ? 'default' : score >= 50 ? 'secondary' : 'outline';
    return (
      <Badge variant={color} className="gap-1">
        <Star className="h-3 w-3" fill={score >= 80 ? 'currentColor' : 'none'} />
        {score}
      </Badge>
    );
  };

  const filteredLeads = leads.filter(lead =>
    lead.consumer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.consumer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Marketplace</h1>
          <p className="text-muted-foreground">
            Manage incoming lead requests and route them to providers
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Lead Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleCreateLead}>
              <DialogHeader>
                <DialogTitle>Create Lead Request</DialogTitle>
                <DialogDescription>
                  Enter the lead request details below
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="consumer_name">Consumer Name *</Label>
                  <Input
                    id="consumer_name"
                    value={formData.consumer_name}
                    onChange={(e) => setFormData({ ...formData, consumer_name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="consumer_email">Consumer Email *</Label>
                    <Input
                      id="consumer_email"
                      type="email"
                      value={formData.consumer_email}
                      onChange={(e) => setFormData({ ...formData, consumer_email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="consumer_phone">Consumer Phone</Label>
                    <Input
                      id="consumer_phone"
                      type="tel"
                      value={formData.consumer_phone}
                      onChange={(e) => setFormData({ ...formData, consumer_phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="mb-2">Services *</Label>
                  <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto space-y-2">
                    {availableServices.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        No services available. Please create services in settings.
                      </div>
                    ) : (
                      availableServices.map((service) => (
                        <div key={service.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`service-${service.id}`}
                            checked={formData.services.includes(service.id)}
                            onCheckedChange={() => toggleService(service.id)}
                          />
                          <Label
                            htmlFor={`service-${service.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {service.name}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Lead</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lead Requests</CardTitle>
              <CardDescription>View and manage incoming lead requests</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  className="pl-8 w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading leads...</div>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground mb-2">No lead requests found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try adjusting your search' : 'Create your first lead request to get started'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Consumer</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="font-medium">{lead.consumer_name}</div>
                      <div className="text-sm text-muted-foreground">{lead.consumer_email}</div>
                    </TableCell>
                    <TableCell>{lead.title}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {lead.services.slice(0, 2).map((service, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                        {lead.services.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{lead.services.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getQualityBadge(lead.quality_score, lead.is_spam)}</TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
