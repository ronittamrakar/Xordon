import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

import { FileTextIcon, Plus, Trash2, Image as ImageIcon, Calendar } from 'lucide-react';
import { requestsApi, CreateRequestData, RequestItem } from '@/services/requestsApi';
import { api } from '@/lib/api';

export default function RequestDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = id === 'new';
  const numericId = !isNew && id ? Number(id) : null;
  const hasValidId = numericId !== null && Number.isFinite(numericId) && numericId > 0;

  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    contact_id: '',
    title: '',
    service_details: '',
    requested_date: new Date().toISOString().split('T')[0],
    service_address: '',
    service_city: '',
    service_state: '',
    service_zip: '',
    on_site_assessment: false,
    assessment_notes: '',
    internal_notes: '',
  });

  const [lineItems, setLineItems] = useState<RequestItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0, item_type: 'service' }
  ]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      const contactsRes = await api.get('/contacts');
      setContacts(contactsRes.data?.items || contactsRes.data?.contacts || []);

      if (!isNew) {
        if (!hasValidId) {
          toast.error('Invalid request id');
          navigate('/operations/requests', { replace: true });
          return;
        }

        const request = await requestsApi.getRequest(numericId!);
        setFormData({
          contact_id: String(request.contactId || ''),
          title: request.title || '',
          service_details: request.serviceDetails || '',
          requested_date: request.requestedDate || new Date().toISOString().split('T')[0],
          service_address: request.serviceAddress || '',
          service_city: request.serviceCity || '',
          service_state: request.serviceState || '',
          service_zip: request.serviceZip || '',
          on_site_assessment: request.onSiteAssessment || false,
          assessment_notes: request.assessmentNotes || '',
          internal_notes: request.internalNotes || '',
        });

        if (request.items && request.items.length > 0) {
          setLineItems(request.items);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);
    const total = subtotal;
    return { subtotal, total };
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, total: 0, item_type: 'service' }]);
  };

  const updateLineItem = (index: number, field: keyof RequestItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unit_price') {
      updated[index].total = updated[index].quantity * updated[index].unit_price;
    }

    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!formData.contact_id || !formData.title) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      setSaving(true);
      const { subtotal, total } = calculateTotals();

      const payload: CreateRequestData = {
        contact_id: parseInt(formData.contact_id),
        title: formData.title,
        service_details: formData.service_details,
        requested_date: formData.requested_date,
        service_address: formData.service_address,
        service_city: formData.service_city,
        service_state: formData.service_state,
        service_zip: formData.service_zip,
        on_site_assessment: formData.on_site_assessment,
        assessment_notes: formData.assessment_notes,
        internal_notes: formData.internal_notes,
        subtotal,
        total,
        items: lineItems.filter(item => item.description).map(item => ({
          ...item,
          total: item.quantity * item.unit_price
        })),
      };

      if (isNew) {
        await requestsApi.createRequest(payload);
        toast.success('Request created successfully');
      } else {
        if (!hasValidId) {
          toast.error('Invalid request id');
          return;
        }
        await requestsApi.updateRequest(numericId!, payload);
        toast.success('Request updated successfully');
      }

      navigate('/operations/requests');
    } catch (error) {
      console.error('Failed to save request:', error);
      toast.error('Failed to save request');
    } finally {
      setSaving(false);
    }
  };

  const { subtotal, total } = calculateTotals();

  return (

    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileTextIcon className="h-8 w-8 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold">
              {isNew ? 'New Request' : 'Edit Request'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isNew ? 'Create a new service request' : 'Update request details'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/operations/requests')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
            {saving ? 'Saving...' : 'Save Request'}
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter request title"
            />
          </div>

          <div className="space-y-2">
            <Label>Select a client *</Label>
            <Select value={formData.contact_id} onValueChange={(v) => setFormData({ ...formData, contact_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a client" />
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
            <Label>Requested on</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={formData.requested_date}
                onChange={(e) => setFormData({ ...formData, requested_date: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Service details</Label>
            <p className="text-xs text-muted-foreground">Please provide as much information as you can</p>
            <Textarea
              value={formData.service_details}
              onChange={(e) => setFormData({ ...formData, service_details: e.target.value })}
              placeholder="Describe the service request in detail..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Share images of the work to be done</Label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload or drag and drop images</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product/Service */}
      <Card>
        <CardHeader>
          <CardTitle>Product / Service</CardTitle>
          <p className="text-sm text-muted-foreground">Keep everything on track by adding products and services.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={addLineItem} className="w-full bg-green-600 hover:bg-green-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Line Item
          </Button>

          {lineItems.length > 0 && (
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
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="labor">Labor</SelectItem>
                            <SelectItem value="material">Material</SelectItem>
                            <SelectItem value="fee">Fee</SelectItem>
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
                        Rs {item.total.toFixed(2)}
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
          )}

          <div className="flex justify-end pt-4 border-t">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">Rs {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-lg">Rs {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* On-site Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>On-site assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Visit the property to assess the job before you do the work</p>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8">
            <Textarea
              value={formData.internal_notes}
              onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
              placeholder="Leave an internal note for yourself or a team member"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>

  );
}

