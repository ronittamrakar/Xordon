import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { api } from '@/lib/api';

import {
  Plus, Search, Filter, FileTextIcon, DollarSign, Send, Eye, CheckCircle,
  XCircle, Clock, Trash2, Copy, MoreHorizontal, RefreshCw, Download, Pencil, FileCheck
} from 'lucide-react';
import { Estimate, EstimateStatus, EstimateLineItem, ESTIMATE_STATUS_CONFIG } from '@/types/industry';
import SEO from '@/components/SEO';

const STATUS_OPTIONS: { value: EstimateStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
  { value: 'converted', label: 'Converted' },
];

interface LineItemForm {
  description: string;
  quantity: number;
  unit_price: number;
  item_type: 'service' | 'part' | 'labor' | 'fee' | 'discount';
}

export default function Estimates() {
  const [estimates, setEstimates] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedEstimate, setSelectedEstimate] = useState<any | null>(null);


  const [formData, setFormData] = useState({
    contact_id: '',
    company_id: '',
    title: '',
    description: '',
    valid_until: '',
    terms: '',
    notes: '',
    tax_rate: 0,
  });


  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    { description: '', quantity: 1, unit_price: 0, item_type: 'service' }
  ]);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);

      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;

      const [estimatesRes, contactsRes, servicesRes, companiesRes] = await Promise.all([
        api.get('/operations/estimates', { params }),
        api.get('/contacts'),
        api.get('/operations/services'),
        api.get('/companies'),
      ]);

      const rawEstimates = (estimatesRes.data as any)?.items || [];
      console.log('Raw estimates from backend:', rawEstimates);
      const transformedEstimates = rawEstimates.map((est: any) => {

        const contactObj = {
          id: est.contact_id,
          firstName: est.contact_first_name || null,
          lastName: est.contact_last_name || null,
          email: est.contact_email || null,
        };
        console.log('Estimate contact data:', {
          estimate_id: est.id,
          contact_id: est.contact_id,
          contact_first_name: est.contact_first_name,
          contact_last_name: est.contact_last_name,
          contact_email: est.contact_email
        });
        return {
          ...est,
          estimateNumber: est.estimate_number,
          createdAt: est.created_at,
          validUntil: est.valid_until,
          total: parseFloat(est.total) || 0,
          subtotal: parseFloat(est.subtotal) || 0,
          taxAmount: parseFloat(est.tax_amount) || 0,
          taxRate: parseFloat(est.tax_rate) || 0,
          discountAmount: parseFloat(est.discount_amount) || 0,
          contact: contactObj,
          // Keep the raw fields as fallback
          contact_first_name: est.contact_first_name,
          contact_last_name: est.contact_last_name,
          contact_email: est.contact_email,
        };
      });

      setEstimates(transformedEstimates);
      setContacts((contactsRes.data as any)?.items || (contactsRes.data as any)?.contacts || []);
      setServices((servicesRes.data as any)?.items || []);

      // Ensure companies is always an array
      const companiesData = (companiesRes.data as any);
      const companiesList = companiesData?.items || companiesData?.companies || [];
      setCompanies(Array.isArray(companiesList) ? companiesList : []);
    } catch (error) {
      console.error('Failed to load estimates:', error);
      toast.error('Failed to load estimates');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unit_price;
      return item.item_type === 'discount' ? sum - itemTotal : sum + itemTotal;
    }, 0);
    const taxAmount = subtotal * (formData.tax_rate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const saveEstimate = async () => {
    try {
      const { subtotal, taxAmount, total } = calculateTotals();

      const payload = {
        ...formData,
        subtotal,
        tax_amount: taxAmount,
        total,
        line_items: lineItems.filter(item => item.description || item.unit_price > 0).map(item => ({
          ...item,

          total: item.quantity * item.unit_price * (item.item_type === 'discount' ? -1 : 1)
        })),
      };

      if (editingId) {
        await api.put(`/operations/estimates/${editingId}`, payload);
        toast.success('Estimate updated successfully');
      } else {
        await api.post('/operations/estimates', payload);
        toast.success('Estimate created successfully');
      }

      setIsFormOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save estimate:', error);
      toast.error(editingId ? 'Failed to update estimate' : 'Failed to create estimate');
    }
  };

  const handleEdit = (estimate: any) => {
    setEditingId(estimate.id);
    setFormData({
      contact_id: String(estimate.contact_id),
      title: estimate.title || '',
      description: estimate.description || '',
      valid_until: estimate.valid_until ? estimate.valid_until.split('T')[0] : '',
      terms: estimate.terms || '',
      notes: estimate.notes || '',
      tax_rate: parseFloat(estimate.tax_rate) || 0,
    });

    // Fetch full estimate to get line items
    api.get(`/operations/estimates/${estimate.id}`).then((res: any) => {
      const fullEst = res.data;
      if (fullEst.line_items && fullEst.line_items.length > 0) {
        setLineItems(fullEst.line_items.map((item: any) => ({
          description: item.description,
          quantity: parseFloat(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price) || 0,
          item_type: item.item_type || 'service',
        })));
      }
    });

    setIsFormOpen(true);
  };

  const updateEstimateStatus = async (estimateId: number, newStatus: EstimateStatus) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'sent') updates.sent_at = new Date().toISOString();
      if (newStatus === 'viewed') updates.viewed_at = new Date().toISOString();
      if (newStatus === 'accepted') updates.accepted_at = new Date().toISOString();

      await api.put(`/operations/estimates/${estimateId}`, updates);
      toast.success(`Estimate marked as ${newStatus}`);
      loadData();
    } catch (error) {
      console.error('Failed to update estimate:', error);
      toast.error('Failed to update estimate');
    }
  };

  const deleteEstimate = async (estimateId: number) => {
    if (!confirm('Are you sure you want to delete this estimate?')) return;

    try {
      await api.delete(`/operations/estimates/${estimateId}`);
      toast.success('Estimate deleted');
      loadData();
    } catch (error) {
      console.error('Failed to delete estimate:', error);
      toast.error('Failed to delete estimate');
    }
  };

  const convertToInvoice = async (estimateId: number) => {
    // Find the estimate to check if it's already converted
    const estimate = estimates.find(e => e.id === estimateId);
    if (estimate?.converted_to_invoice_id) {
      toast.error('This estimate has already been converted to an invoice');
      return;
    }

    if (!confirm('Convert this estimate to an invoice? This action cannot be undone.')) return;

    try {
      const response = await api.post(`/operations/estimates/${estimateId}/convert`, {});
      const data = response.data as any;
      toast.success(`Successfully converted to invoice ${data.invoice_number}`);
      loadData();
      setSelectedEstimate(null);
    } catch (error: any) {
      console.error('Failed to convert estimate:', error);
      const errorMsg = error.response?.data?.error || 'Failed to convert estimate';
      toast.error(errorMsg);
    }
  };

  const resetForm = () => {
    setFormData({
      contact_id: '',
      company_id: '',
      title: '',
      description: '',
      valid_until: '',
      terms: '',
      notes: '',
      tax_rate: 0,
    });
    setLineItems([{ description: '', quantity: 1, unit_price: 0, item_type: 'service' }]);
    setEditingId(null);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, item_type: 'service' }]);
  };

  const updateLineItem = (index: number, field: keyof LineItemForm, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const getStatusBadge = (status: EstimateStatus) => {
    const config = ESTIMATE_STATUS_CONFIG[status];
    return (
      <Badge style={{ backgroundColor: config.color + '20', color: config.color, borderColor: config.color }}>
        {config.label}
      </Badge>
    );
  };

  const filteredEstimates = estimates.filter(est => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        est.estimateNumber?.toLowerCase().includes(search) ||
        est.title?.toLowerCase().includes(search) ||
        est.contact?.firstName?.toLowerCase().includes(search) ||
        est.contact?.lastName?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const stats = {
    total: estimates.length,
    draft: estimates.filter(e => e.status === 'draft').length,
    sent: estimates.filter(e => e.status === 'sent').length,
    accepted: estimates.filter(e => e.status === 'accepted').length,
    totalValue: estimates.reduce((sum, e) => sum + (e.total || 0), 0),
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  return (

    <><SEO
      title="Estimates & Quotes"
      description="Create and manage professional estimates for your customers. Track status from draft to accepted and convert to invoices."
    />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Estimates & Quotes</h1>
            <p className="text-muted-foreground">Create and manage estimates for your customers</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              New Estimate
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileTextIcon className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-muted-foreground">Drafts</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.draft}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-muted-foreground">Sent</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.sent}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-muted-foreground">Accepted</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.accepted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-sm text-muted-foreground">Total Value</span>
              </div>
              <p className="text-2xl font-bold mt-1">${stats.totalValue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search estimates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Estimates Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estimate #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEstimates.map(estimate => (
                  <TableRow key={estimate.id}>
                    <TableCell className="font-mono text-sm">{estimate.estimateNumber}</TableCell>
                    <TableCell>
                      {estimate.contact?.firstName || estimate.contact?.lastName
                        ? `${estimate.contact?.firstName || ''} ${estimate.contact?.lastName || ''}`.trim()
                        : estimate.contact?.email || estimate.contact_email || '-'}
                    </TableCell>
                    <TableCell className="font-medium">{estimate.title || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(estimate.status)}
                        {estimate.converted_to_invoice_id && (
                          <Badge variant="outline" className="text-xs">
                            Converted
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">${estimate.total?.toLocaleString()}</TableCell>
                    <TableCell>
                      {estimate.validUntil ? new Date(estimate.validUntil).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      {estimate.createdAt ? new Date(estimate.createdAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {estimate.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateEstimateStatus(estimate.id, 'sent')}
                            title="Send Estimate"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        {estimate.status === 'sent' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateEstimateStatus(estimate.id, 'accepted')}
                            title="Mark as Accepted"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {estimate.status === 'accepted' && !estimate.converted_to_invoice_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => convertToInvoice(estimate.id)}
                            title="Convert to Invoice"
                          >
                            <FileCheck className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(estimate)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEstimate(estimate)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEstimate(estimate.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredEstimates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No estimates found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Estimate Dialog */}
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Estimate' : 'Create New Estimate'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Modify the existing estimate' : 'Create a detailed estimate for your customer'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer *</Label>
                  <Select value={formData.contact_id} onValueChange={(v) => {
                    const contact = contacts.find((c: any) => String(c.id) === v);
                    setFormData({
                      ...formData,
                      contact_id: v,
                      company_id: contact?.company_id ? String(contact.company_id) : formData.company_id
                    });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.firstName || c.first_name} {c.lastName || c.last_name} - {c.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Select value={formData.company_id} onValueChange={(v) => setFormData({ ...formData, company_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valid Until</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., HVAC Repair Estimate, Website Development Quote"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Overview of the work to be done..."
                  rows={2}
                />
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Line Items</Label>
                  <Button variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={item.description}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                              placeholder="Item description"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.item_type}
                              onValueChange={(v: any) => updateLineItem(index, 'item_type', v)}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="service">Service</SelectItem>
                                <SelectItem value="part">Part</SelectItem>
                                <SelectItem value="labor">Labor</SelectItem>
                                <SelectItem value="fee">Fee</SelectItem>
                                <SelectItem value="discount">Discount</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                              className="w-[70px]"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-[100px]"
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.item_type === 'discount' ? '-' : ''}${(item.quantity * item.unit_price).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLineItem(index)}
                              disabled={lineItems.length === 1}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Tax Rate:</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.tax_rate}
                        onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                        className="w-[70px]"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax:</span>
                    <span className="font-medium">${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-lg">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <Textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Payment terms, warranty information, etc."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes for the customer"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button onClick={saveEstimate} disabled={!formData.contact_id}>
                {editingId ? 'Update Estimate' : 'Create Estimate'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Estimate Dialog */}
        <Dialog open={!!selectedEstimate} onOpenChange={() => setSelectedEstimate(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>{selectedEstimate?.estimateNumber}</span>
                {selectedEstimate && getStatusBadge(selectedEstimate.status)}
              </DialogTitle>
              <DialogDescription>{selectedEstimate?.title}</DialogDescription>
            </DialogHeader>

            {selectedEstimate && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Customer</Label>
                    <p className="font-medium">
                      {selectedEstimate.contact?.firstName || selectedEstimate.contact?.lastName
                        ? `${selectedEstimate.contact?.firstName || ''} ${selectedEstimate.contact?.lastName || ''}`.trim()
                        : 'Not specified'}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedEstimate.contact?.email || selectedEstimate.contact_email || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Created Date</Label>
                    <p className="font-medium">
                      {selectedEstimate.createdAt ? new Date(selectedEstimate.createdAt).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Valid Until</Label>
                    <p className="font-medium">
                      {selectedEstimate.validUntil ? new Date(selectedEstimate.validUntil).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>

                {selectedEstimate.description && (
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p>{selectedEstimate.description}</p>
                  </div>
                )}

                {selectedEstimate.lineItems && selectedEstimate.lineItems.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Line Items</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedEstimate.lineItems && selectedEstimate.lineItems.length > 0 && (
                          selectedEstimate.lineItems.map((item: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell>{item.description}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>${parseFloat(item.unit_price || item.unitPrice || 0).toFixed(2)}</TableCell>
                              <TableCell>${parseFloat(item.total || 0).toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        )}
                        {selectedEstimate.line_items && selectedEstimate.line_items.length > 0 && (
                          selectedEstimate.line_items.map((item: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell>{item.description}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>${parseFloat(item.unit_price || item.unitPrice || 0).toFixed(2)}</TableCell>
                              <TableCell>${parseFloat(item.total || 0).toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="flex gap-2">
                  {selectedEstimate.status === 'draft' && (
                    <Button onClick={() => {
                      updateEstimateStatus(selectedEstimate.id, 'sent');
                      setSelectedEstimate(null);
                    }}>
                      <Send className="h-4 w-4 mr-2" /> Send to Customer
                    </Button>
                  )}
                  {selectedEstimate.status === 'sent' && (
                    <>
                      <Button onClick={() => {
                        updateEstimateStatus(selectedEstimate.id, 'accepted');
                        setSelectedEstimate(null);
                      }} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" /> Mark Accepted
                      </Button>
                      <Button variant="outline" onClick={() => {
                        updateEstimateStatus(selectedEstimate.id, 'declined');
                        setSelectedEstimate(null);
                      }}>
                        <XCircle className="h-4 w-4 mr-2" /> Mark Declined
                      </Button>
                    </>
                  )}
                  {selectedEstimate.status === 'accepted' && !selectedEstimate.converted_to_invoice_id && (
                    <Button onClick={() => convertToInvoice(selectedEstimate.id)} className="bg-blue-600 hover:bg-blue-700">
                      <FileCheck className="h-4 w-4 mr-2" /> Convert to Invoice
                    </Button>
                  )}
                  {selectedEstimate.converted_to_invoice_id && (
                    <div className="text-sm text-muted-foreground">
                      Already converted to invoice
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div></>

  );
}

