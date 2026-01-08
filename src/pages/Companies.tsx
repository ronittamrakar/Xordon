import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Company, COMPANY_SIZES, COMPANY_STATUSES, INDUSTRIES } from '@/types/company';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  Globe,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Loader2,
} from 'lucide-react';

const defaultCompanyForm: Partial<Company> = {
  name: '',
  domain: '',
  industry: '',
  size: '',
  annualRevenue: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  linkedin: '',
  twitter: '',
  description: '',
  status: 'active',
};

export default function Companies() {
  console.log('Companies page rendering');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState<Partial<Company>>(defaultCompanyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch companies
  const { data, isLoading, error } = useQuery({
    queryKey: ['companies', search, statusFilter, industryFilter],
    queryFn: () => api.getCompanies({
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      industry: industryFilter !== 'all' ? industryFilter : undefined,
    }),
  });

  const companies = data?.companies || [];

  // Create company mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<Company>) => api.createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({ title: 'Company created successfully' });
      closeDialog();
    },
    onError: () => {
      toast({ title: 'Failed to create company', variant: 'destructive' });
    },
  });

  // Update company mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Company> }) => api.updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({ title: 'Company updated successfully' });
      closeDialog();
    },
    onError: () => {
      toast({ title: 'Failed to update company', variant: 'destructive' });
    },
  });

  // Delete company mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({ title: 'Company deleted successfully' });
      setDeleteConfirmId(null);
    },
    onError: () => {
      toast({ title: 'Failed to delete company', variant: 'destructive' });
    },
  });

  const openCreateDialog = () => {
    setEditingCompany(null);
    setCompanyForm(defaultCompanyForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (company: Company) => {
    setEditingCompany(company);
    setCompanyForm({
      name: company.name,
      domain: company.domain || '',
      industry: company.industry || '',
      size: company.size || '',
      annualRevenue: company.annualRevenue || '',
      phone: company.phone || '',
      email: company.email || '',
      website: company.website || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      country: company.country || '',
      postalCode: company.postalCode || '',
      linkedin: company.linkedin || '',
      twitter: company.twitter || '',
      description: company.description || '',
      status: company.status,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCompany(null);
    setCompanyForm(defaultCompanyForm);
  };

  const handleSubmit = () => {
    if (!companyForm.name?.trim()) {
      toast({ title: 'Company name is required', variant: 'destructive' });
      return;
    }

    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data: companyForm });
    } else {
      createMutation.mutate(companyForm);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = COMPANY_STATUSES.find(s => s.value === status);
    return (
      <Badge
        variant="outline"
        style={{ borderColor: statusConfig?.color, color: statusConfig?.color }}
      >
        {statusConfig?.label || status}
      </Badge>
    );
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load companies. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Actions Bar */}
        <div className="flex justify-end">
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {COMPANY_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Placeholder for 4th column or clear filters */}
              <div className="hidden lg:block"></div>
            </div>
          </CardContent>
        </Card>

        {/* Companies Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : companies.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No companies found</h3>
                <p className="text-muted-foreground mb-4">
                  {search || statusFilter !== 'all' || industryFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Get started by adding your first company'}
                </p>
                {!search && statusFilter === 'all' && industryFilter === 'all' && (
                  <Button onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Company
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Contacts</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{company.name}</span>
                          {company.domain && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {company.domain}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{company.industry || '-'}</TableCell>
                      <TableCell>
                        {COMPANY_SIZES.find(s => s.value === company.size)?.label || company.size || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {company.contactCount || 0}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(company.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(company)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {company.website && (
                              <DropdownMenuItem asChild>
                                <a href={company.website} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Visit Website
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteConfirmId(company.id)}
                            >
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
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCompany ? 'Edit Company' : 'Add Company'}
              </DialogTitle>
              <DialogDescription>
                {editingCompany
                  ? 'Update company information'
                  : 'Add a new company to your CRM'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={companyForm.name || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    placeholder="Acme Inc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={companyForm.domain || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, domain: e.target.value })}
                    placeholder="acme.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={companyForm.industry || ''}
                    onValueChange={(value) => setCompanyForm({ ...companyForm, industry: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Company Size</Label>
                  <Select
                    value={companyForm.size || ''}
                    onValueChange={(value) => setCompanyForm({ ...companyForm, size: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={companyForm.status || 'active'}
                    onValueChange={(value) => setCompanyForm({ ...companyForm, status: value as Company['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annualRevenue">Annual Revenue</Label>
                  <Input
                    id="annualRevenue"
                    value={companyForm.annualRevenue || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, annualRevenue: e.target.value })}
                    placeholder="$1M - $10M"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="border-t pt-4 mt-2">
                <h4 className="font-medium mb-3">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companyForm.email || ''}
                      onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                      placeholder="contact@acme.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={companyForm.phone || ''}
                      onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={companyForm.website || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                    placeholder="https://acme.com"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="border-t pt-4 mt-2">
                <h4 className="font-medium mb-3">Address</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={companyForm.address || ''}
                      onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={companyForm.city || ''}
                        onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                        placeholder="San Francisco"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={companyForm.state || ''}
                        onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                        placeholder="CA"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={companyForm.country || ''}
                        onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })}
                        placeholder="United States"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={companyForm.postalCode || ''}
                        onChange={(e) => setCompanyForm({ ...companyForm, postalCode: e.target.value })}
                        placeholder="94105"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Social */}
              <div className="border-t pt-4 mt-2">
                <h4 className="font-medium mb-3">Social Profiles</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={companyForm.linkedin || ''}
                      onChange={(e) => setCompanyForm({ ...companyForm, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/company/acme"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      value={companyForm.twitter || ''}
                      onChange={(e) => setCompanyForm({ ...companyForm, twitter: e.target.value })}
                      placeholder="@acme"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="border-t pt-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={companyForm.description || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                    placeholder="Brief description of the company..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingCompany ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Company</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this company? This action cannot be undone.
                Contacts associated with this company will not be deleted but will be unlinked.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
