import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileTextIcon,
  Plus,
  Trash2,
  GripVertical,
  Calendar,
  User,
  Building2,
  MapPin,
  Mail,
  Phone,
  Save,
  Send,
  Download,
  X,
  ChevronDown,
  Clock,
  DollarSign,
  Percent,
  FileUp,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import invoicesApi, { Invoice, InvoiceItem, Product } from '@/services/invoicesApi';
import { format } from 'date-fns';

interface InvoiceFormData {
  contact_id: number | null;
  invoice_number: string;
  subject: string;
  issue_date: string;
  due_date: string;
  payment_terms: string;
  billing_address: string;
  service_address: string;
  contact_email: string;
  contact_phone: string;
  salesperson: string;
  items: InvoiceItem[];
  subtotal: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  deposit_amount: number;
  client_message: string;
  contract_disclaimer: string;
  internal_notes: string;
  custom_fields: { label: string; value: string }[];
  follow_up_enabled: boolean;
  follow_up_days: number;
  follow_up_repeat_days: number;
  follow_up_max_attempts: number;
}

const InvoiceBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<InvoiceFormData>({
    contact_id: null,
    invoice_number: '',
    subject: 'For services rendered',
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    payment_terms: 'net_30',
    billing_address: '',
    service_address: '',
    contact_email: '',
    contact_phone: '',
    salesperson: '',
    items: [{ description: '', quantity: 1, unit_price: 0, tax_rate: 0 }],
    subtotal: 0,
    discount_type: 'fixed',
    discount_value: 0,
    discount_amount: 0,
    tax_rate: 0,
    tax_amount: 0,
    total: 0,
    deposit_amount: 0,
    client_message: '',
    contract_disclaimer: 'Thank you for your business. Please contact us with any questions regarding this invoice.',
    internal_notes: '',
    custom_fields: [],
    follow_up_enabled: true,
    follow_up_days: 3,
    follow_up_repeat_days: 7,
    follow_up_max_attempts: 3,
  });

  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [showTaxInput, setShowTaxInput] = useState(false);
  const [showDepositInput, setShowDepositInput] = useState(false);
  const [showCustomFieldDialog, setShowCustomFieldDialog] = useState(false);
  const [newCustomField, setNewCustomField] = useState({ label: '', value: '' });
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);

  // Fetch products for quick add
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => invoicesApi.listProducts(),
  });

  // Fetch invoice if editing
  const { data: existingInvoice } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.getInvoice(Number(id)),
    enabled: isEditMode,
  });

  // Calculate totals whenever items or discount/tax change
  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.discount_type, formData.discount_value, formData.tax_rate]);

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);

    let discountAmount = 0;
    if (formData.discount_type === 'percentage') {
      discountAmount = subtotal * (formData.discount_value / 100);
    } else {
      discountAmount = formData.discount_value;
    }

    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (formData.tax_rate / 100);
    const total = afterDiscount + taxAmount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total,
    }));
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: 0, tax_rate: 0 }],
    }));
  };

  const updateLineItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const removeLineItem = (index: number) => {
    if (formData.items.length === 1) {
      toast.error('Invoice must have at least one line item');
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const addCustomField = () => {
    if (!newCustomField.label.trim()) {
      toast.error('Field label is required');
      return;
    }
    setFormData(prev => ({
      ...prev,
      custom_fields: [...prev.custom_fields, { ...newCustomField }],
    }));
    setNewCustomField({ label: '', value: '' });
    setShowCustomFieldDialog(false);
  };

  const removeCustomField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.filter((_, i) => i !== index),
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async (status: 'draft' | 'sent') => {
      const payload = {
        contact_id: formData.contact_id,
        invoice_number: formData.invoice_number,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        items: formData.items,
        notes: formData.client_message,
        terms: formData.contract_disclaimer,
        currency: 'USD',
        discount_amount: formData.discount_amount,
      };
      
      if (isEditMode) {
        // Update logic would go here
        return { id: Number(id), invoice_number: formData.invoice_number, payment_link: '' };
      } else {
        return await invoicesApi.createInvoice(payload);
      }
    },
    onSuccess: (data, status) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success(status === 'sent' ? 'Invoice sent!' : 'Invoice saved as draft');
      navigate('/operations/payments');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save invoice');
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/operations/payments')}>
                <X className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">
                  Invoice for {formData.contact_email || 'New Customer'}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-muted-foreground">
                    Invoice #{formData.invoice_number || 'Auto-generated'}
                  </span>
                  <Badge variant="secondary">Draft</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => saveMutation.mutate('draft')}>
                <Save className="h-4 w-4 mr-2" />
                Save Invoice
              </Button>
              <Button onClick={() => saveMutation.mutate('sent')}>
                <Send className="h-4 w-4 mr-2" />
                Save and Send
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Main Form */}
          <div className="col-span-2 space-y-6">
            {/* Invoice Subject */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label>Invoice subject</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="For services rendered"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Billing & Contact Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase">Billing address</Label>
                      <Textarea
                        className="mt-2 min-h-[100px]"
                        value={formData.billing_address}
                        onChange={(e) => setFormData(prev => ({ ...prev, billing_address: e.target.value }))}
                        placeholder="Customer billing address"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase">Property/Service Address</Label>
                      <Textarea
                        className="mt-2 min-h-[100px]"
                        value={formData.service_address}
                        onChange={(e) => setFormData(prev => ({ ...prev, service_address: e.target.value }))}
                        placeholder="Service location"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase">Contact details</Label>
                      <div className="mt-2 space-y-2">
                        <Input
                          value={formData.contact_phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                          placeholder="Phone"
                        />
                        <Input
                          value={formData.contact_email}
                          onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                          placeholder="Email"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Products / Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Button variant="ghost" size="icon" className="mt-1 cursor-move">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <div className="flex-1 space-y-3">
                          <Input
                            placeholder="Product / Service name"
                            value={item.description}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          />
                          <Textarea
                            placeholder="Description (optional)"
                            className="min-h-[60px]"
                            value={(item as any).notes || ''}
                            onChange={(e) => updateLineItem(index, 'notes' as any, e.target.value)}
                          />
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <Label className="text-xs">Qty</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Unit Price</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Total</Label>
                              <div className="h-9 flex items-center font-medium">
                                {formatCurrency(item.quantity * item.unit_price)}
                              </div>
                            </div>
                            <div className="flex items-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeLineItem(index)}
                                disabled={formData.items.length === 1}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4" onClick={addLineItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line Item
                </Button>
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3 max-w-md ml-auto">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatCurrency(formData.subtotal)}</span>
                  </div>
                  
                  {showDiscountInput ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-24">Discount</span>
                      <Select
                        value={formData.discount_type}
                        onValueChange={(v: 'percentage' | 'fixed') => setFormData(prev => ({ ...prev, discount_type: v }))}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">$</SelectItem>
                          <SelectItem value="percentage">%</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        className="h-8"
                        value={formData.discount_value}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))}
                      />
                      <span className="font-medium">-{formatCurrency(formData.discount_amount)}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowDiscountInput(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="link" className="text-sm p-0 h-auto" onClick={() => setShowDiscountInput(true)}>
                      Add Discount
                    </Button>
                  )}

                  {showTaxInput ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-24">Tax</span>
                      <Input
                        type="number"
                        className="h-8"
                        placeholder="Tax %"
                        value={formData.tax_rate}
                        onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                      />
                      <span className="font-medium">{formatCurrency(formData.tax_amount)}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowTaxInput(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="link" className="text-sm p-0 h-auto" onClick={() => setShowTaxInput(true)}>
                      Add Tax
                    </Button>
                  )}

                  <Separator />
                  
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(formData.total)}</span>
                  </div>

                  {showDepositInput ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-24">Deposit</span>
                      <Input
                        type="number"
                        className="h-8"
                        value={formData.deposit_amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, deposit_amount: parseFloat(e.target.value) || 0 }))}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowDepositInput(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="link" className="text-sm p-0 h-auto" onClick={() => setShowDepositInput(true)}>
                      Add Deposit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Messages */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Client message</Label>
                  <Textarea
                    className="min-h-[80px]"
                    value={formData.client_message}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_message: e.target.value }))}
                    placeholder="Message visible to client on invoice..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contract / Disclaimer</Label>
                  <Textarea
                    className="min-h-[80px]"
                    value={formData.contract_disclaimer}
                    onChange={(e) => setFormData(prev => ({ ...prev, contract_disclaimer: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Internal notes</Label>
                  <p className="text-xs text-muted-foreground">Internal notes will only be visible to your team</p>
                  <Textarea
                    className="min-h-[80px]"
                    value={formData.internal_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, internal_notes: e.target.value }))}
                    placeholder="Notes for internal use..."
                  />
                  <Button variant="outline" size="sm">
                    <FileUp className="h-4 w-4 mr-2" />
                    Attach File
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Invoice details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Issue date</Label>
                  <Input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Payment terms</Label>
                  <Select
                    value={formData.payment_terms}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, payment_terms: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="due_on_receipt">Due on receipt</SelectItem>
                      <SelectItem value="net_7">Net 7</SelectItem>
                      <SelectItem value="net_15">Net 15</SelectItem>
                      <SelectItem value="net_30">Net 30</SelectItem>
                      <SelectItem value="net_60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Salesperson</Label>
                  <Input
                    value={formData.salesperson}
                    onChange={(e) => setFormData(prev => ({ ...prev, salesperson: e.target.value }))}
                    placeholder="Select salesperson"
                  />
                </div>

                {/* Custom Fields */}
                {formData.custom_fields.map((field, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{field.label}</Label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeCustomField(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      value={field.value}
                      onChange={(e) => {
                        const newFields = [...formData.custom_fields];
                        newFields[index].value = e.target.value;
                        setFormData(prev => ({ ...prev, custom_fields: newFields }));
                      }}
                    />
                  </div>
                ))}

                <Button
                  variant="link"
                  className="text-sm p-0 h-auto"
                  onClick={() => setShowCustomFieldDialog(true)}
                >
                  + Add Custom Field
                </Button>
              </CardContent>
            </Card>

            {/* Follow-up Automation */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Invoice follow-ups</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFollowUpDialog(true)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-blue-900">
                      {formData.follow_up_enabled ? (
                        <>
                          <p className="font-medium">If unpaid, send email after {formData.follow_up_days} days</p>
                          <p className="text-xs text-blue-700 mt-1">
                            Repeat every {formData.follow_up_repeat_days} days, up to {formData.follow_up_max_attempts} times
                          </p>
                        </>
                      ) : (
                        <p>Automatic follow-ups disabled</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Custom Field Dialog */}
      <Dialog open={showCustomFieldDialog} onOpenChange={setShowCustomFieldDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Field</DialogTitle>
            <DialogDescription>Add a custom field to this invoice</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Field Label</Label>
              <Input
                placeholder="e.g., PO Number, Work Order #"
                value={newCustomField.label}
                onChange={(e) => setNewCustomField(prev => ({ ...prev, label: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                placeholder="Field value"
                value={newCustomField.value}
                onChange={(e) => setNewCustomField(prev => ({ ...prev, value: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomFieldDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addCustomField}>Add Field</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Follow-up Settings Dialog */}
      <Dialog open={showFollowUpDialog} onOpenChange={setShowFollowUpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invoice Follow-up Settings</DialogTitle>
            <DialogDescription>Configure automatic payment reminders</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label>Enable automatic follow-ups</Label>
              <input
                type="checkbox"
                checked={formData.follow_up_enabled}
                onChange={(e) => setFormData(prev => ({ ...prev, follow_up_enabled: e.target.checked }))}
                className="h-4 w-4"
              />
            </div>
            {formData.follow_up_enabled && (
              <>
                <div className="space-y-2">
                  <Label>Send first reminder after (days)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.follow_up_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, follow_up_days: parseInt(e.target.value) || 3 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Repeat every (days)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.follow_up_repeat_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, follow_up_repeat_days: parseInt(e.target.value) || 7 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum attempts</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.follow_up_max_attempts}
                    onChange={(e) => setFormData(prev => ({ ...prev, follow_up_max_attempts: parseInt(e.target.value) || 3 }))}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowFollowUpDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceBuilder;

