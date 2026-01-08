import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, CreditCard, FileTextIcon, TrendingUp, Plus, Search, Filter, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

import { useToast } from '@/hooks/use-toast';
import PaymentLinksTab from './payments/PaymentLinksTab';
import FulfillmentTab from './payments/FulfillmentTab';
import LocalPaymentsTab from './payments/LocalPaymentsTab';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: string;
  status: string;
}

interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_id: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  sort_order: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  contact_id: number | null;
  total: number;
  currency: string;
  status: string;
  due_date: string;
  created_at: string;
  issue_date?: string;
  subtotal?: number;
  tax_rate?: number;
  tax_amount?: number;
  discount_amount?: number;
  notes?: string | null;
  terms?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  contact_email?: string | null;
  items?: InvoiceItem[];
}

interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  currency: string;
  status: string;
  paid_at: string;
  payment_method: string;
  transaction_id?: string | null;
  notes?: string | null;
}

interface DashboardStats {
  total_revenue: number;
  outstanding_amount: number;
  this_month_revenue: number;
  overdue_invoices: number;
}

export default function Payments() {
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'USD',
    type: 'one_time',
  });
  const [savingProduct, setSavingProduct] = useState(false);

  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    contact_id: '',
    currency: 'USD',
    tax_rate: '0',
    discount_amount: '0',
    status: 'draft',
    notes: '',
    terms: '',
    issue_date: '',
    due_date: '',
  });
  const [invoiceItems, setInvoiceItems] = useState<
    { description: string; quantity: string; unit_price: string }[]
  >([
    { description: '', quantity: '1', unit_price: '' },
  ]);
  const [savingInvoice, setSavingInvoice] = useState(false);

  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    invoice_id: '',
    contact_id: '',
    amount: '',
    currency: 'USD',
    payment_method: 'stripe',
    notes: '',
    paid_at: new Date().toISOString().slice(0, 16),
  });
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, invoicesRes, paymentsRes, statsRes] = await Promise.all([
        api.get<{ items: Product[] }>('/payments/products'),
        api.get<{ items: Invoice[] }>('/payments/invoices'),
        api.get<{ items: Payment[] }>('/payments/payments'),
        api.get<DashboardStats>('/payments/dashboard-stats'),
      ]);

      setProducts(productsRes.data.items || []);
      setInvoices(invoicesRes.data.items || []);
      setPayments(paymentsRes.data.items || []);
      setStats(statsRes.data ?? null);
    } catch (error) {
      console.error('Failed to load payments data:', error);
      const message = error instanceof Error ? error.message : 'Something went wrong while loading payments data.';
      toast({ title: 'Failed to load payments data', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const invoiceSummary = React.useMemo(() => {
    const items = invoiceItems.map((item) => ({
      quantity: parseFloat(item.quantity || '1') || 1,
      unit_price: parseFloat(item.unit_price || '0') || 0,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const taxRate = parseFloat(invoiceForm.tax_rate || '0') || 0;
    const discountAmount = parseFloat(invoiceForm.discount_amount || '0') || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount - discountAmount;

    return {
      subtotal,
      taxAmount,
      discountAmount,
      total,
      currency: invoiceForm.currency,
    };
  }, [invoiceItems, invoiceForm.tax_rate, invoiceForm.discount_amount, invoiceForm.currency]);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      viewed: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      partially_paid: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      refunded: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      partially_refunded: 'bg-purple-100 text-purple-800'
    };
    return <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const formatDate = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  };

  const getInvoiceCustomerName = (invoice: Invoice) => {
    const parts = [invoice.first_name, invoice.last_name].filter(Boolean) as string[];
    if (parts.length > 0) {
      return parts.join(' ');
    }
    if (invoice.contact_id) {
      return `Customer #${invoice.contact_id}`;
    }
    return 'Customer';
  };

  const filteredProducts = products.filter((product) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(term) ||
      (product.description || '').toLowerCase().includes(term)
    );
  });

  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all');

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = !invoiceSearchTerm.trim() ||
      invoice.invoice_number.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) ||
      getInvoiceCustomerName(invoice).toLowerCase().includes(invoiceSearchTerm.toLowerCase());

    const matchesStatus = invoiceStatusFilter === 'all' || invoice.status === invoiceStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const [paymentSearchTerm, setPaymentSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');

  const filteredPaymentsList = payments.filter((payment) => {
    const matchesSearch = !paymentSearchTerm.trim() ||
      String(payment.invoice_id).includes(paymentSearchTerm) ||
      (payment.transaction_id || '').toLowerCase().includes(paymentSearchTerm.toLowerCase());

    const matchesMethod = paymentMethodFilter === 'all' || payment.payment_method === paymentMethodFilter;

    return matchesSearch && matchesMethod;
  });

  const openNewProductDialog = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      currency: 'USD',
      type: 'one_time',
    });
    setIsProductDialogOpen(true);
  };

  const openEditProductDialog = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price ?? ''),
      currency: product.currency || 'USD',
      type: product.type || 'one_time',
    });
    setIsProductDialogOpen(true);
  };

  const openDuplicateProductDialog = (product: Product) => {
    setEditingProduct(null);
    setProductForm({
      name: `${product.name} (Copy)`,
      description: product.description || '',
      price: String(product.price ?? ''),
      currency: product.currency || 'USD',
      type: product.type || 'one_time',
    });
    setIsProductDialogOpen(true);
  };

  const handleProductsFilterClick = () => {
    toast({
      title: 'Filters coming soon',
      description: 'Advanced product filters are not implemented yet.',
    });
  };

  const handleEditInvoiceClick = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setInvoiceForm({
      contact_id: String(invoice.contact_id || ''),
      currency: invoice.currency || 'USD',
      tax_rate: String(invoice.tax_rate || '0'),
      discount_amount: String(invoice.discount_amount || '0'),
      status: invoice.status || 'draft',
      notes: invoice.notes || '',
      terms: invoice.terms || '',
      issue_date: invoice.issue_date?.slice(0, 10) || invoice.created_at?.slice(0, 10) || '',
      due_date: invoice.due_date?.slice(0, 10) || '',
    });

    if (invoice.items) {
      setInvoiceItems(invoice.items.map(item => ({
        description: item.description,
        quantity: String(item.quantity),
        unit_price: String(item.unit_price)
      })));
    } else {
      setInvoiceItems([{ description: '', quantity: '1', unit_price: '' }]);
    }

    setIsInvoiceDialogOpen(true);
  };

  const handleDeleteInvoice = async (id: number) => {
    if (!confirm('Are you sure you want to delete this invoice? Only draft invoices can be deleted.')) return;
    try {
      await api.delete(`/payments/invoices/${id}`);
      toast({ title: 'Invoice deleted' });
      await loadData();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete invoice.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/payments/products/${id}`);
      toast({ title: 'Product deleted' });
      await loadData();
    } catch (error) {
      console.error('Failed to delete product:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete product.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim()) {
      toast({ title: 'Product name is required', variant: 'destructive' });
      return;
    }

    const price = parseFloat(productForm.price || '0');
    if (Number.isNaN(price) || price < 0) {
      toast({ title: 'Invalid price', description: 'Price must be a positive number.', variant: 'destructive' });
      return;
    }

    try {
      setSavingProduct(true);
      const payload = {
        name: productForm.name.trim(),
        description: productForm.description.trim() || null,
        price,
        currency: productForm.currency,
        type: productForm.type,
      };

      if (editingProduct) {
        await api.put(`/payments/products/${editingProduct.id}`, payload);
        toast({ title: 'Product updated' });
      } else {
        await api.post('/payments/products', payload);
        toast({ title: 'Product created' });
      }

      setIsProductDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error('Failed to save product:', error);
      const message = error instanceof Error ? error.message : 'Failed to save product.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSavingProduct(false);
    }
  };

  const openNewInvoiceDialog = () => {
    setEditingInvoice(null);
    const today = new Date();
    const inThirtyDays = new Date();
    inThirtyDays.setDate(today.getDate() + 30);

    setInvoiceForm({
      contact_id: '',
      currency: 'USD',
      tax_rate: '0',
      discount_amount: '0',
      status: 'draft',
      notes: '',
      terms: '',
      issue_date: today.toISOString().slice(0, 10),
      due_date: inThirtyDays.toISOString().slice(0, 10),
    });
    setInvoiceItems([{ description: '', quantity: '1', unit_price: '' }]);
    setIsInvoiceDialogOpen(true);
  };

  const openInvoicePreview = (invoice: Invoice) => {
    setPreviewInvoice(invoice);
    setIsInvoicePreviewOpen(true);
  };

  const addInvoiceItem = () => {
    setInvoiceItems((items) => [...items, { description: '', quantity: '1', unit_price: '' }]);
  };

  const updateInvoiceItem = (index: number, field: 'description' | 'quantity' | 'unit_price', value: string) => {
    setInvoiceItems((items) =>
      items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceItems((items) => (items.length <= 1 ? items : items.filter((_, i) => i !== index)));
  };

  const handleSaveInvoice = async () => {
    const contactId = invoiceForm.contact_id.trim() ? Number(invoiceForm.contact_id.trim()) : null;
    if (invoiceForm.contact_id.trim() && (Number.isNaN(contactId) || contactId! <= 0)) {
      toast({ title: 'Invalid contact ID', description: 'Contact ID must be a positive number.', variant: 'destructive' });
      return;
    }

    const taxRate = parseFloat(invoiceForm.tax_rate || '0');
    const discountAmount = parseFloat(invoiceForm.discount_amount || '0');

    const itemsPayload = invoiceItems
      .map((item) => ({
        description: item.description.trim(),
        quantity: parseFloat(item.quantity || '1') || 1,
        unit_price: parseFloat(item.unit_price || '0') || 0,
      }))
      .filter((item) => item.description || item.unit_price > 0);

    if (itemsPayload.length === 0) {
      toast({ title: 'Add at least one line item', variant: 'destructive' });
      return;
    }

    try {
      setSavingInvoice(true);
      const payload = {
        contact_id: contactId,
        items: itemsPayload,
        tax_rate: Number.isNaN(taxRate) ? 0 : taxRate,
        discount_amount: Number.isNaN(discountAmount) ? 0 : discountAmount,
        currency: invoiceForm.currency,
        status: invoiceForm.status,
        notes: invoiceForm.notes.trim() || null,
        terms: invoiceForm.terms.trim() || null,
        issue_date: invoiceForm.issue_date || undefined,
        due_date: invoiceForm.due_date || undefined,
      };

      if (editingInvoice) {
        await api.put(`/payments/invoices/${editingInvoice.id}`, payload);
        toast({ title: 'Invoice updated' });
      } else {
        const result = await api.post('/payments/invoices', payload) as { id?: number; invoice_number?: string };
        toast({
          title: 'Invoice created',
          description: result?.invoice_number
            ? `Invoice ${result.invoice_number} has been created.`
            : 'Invoice has been created.',
        });
      }

      setIsInvoiceDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error('Failed to save invoice:', error);
      const message = error instanceof Error ? error.message : 'Failed to save invoice.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSavingInvoice(false);
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    try {
      const result = await api.post(`/payments/invoices/${invoice.id}/send`);
      const data = result as { payment_link?: string; message?: string };
      toast({
        title: data?.message || 'Invoice sent',
        description: data?.payment_link ? `Payment link: ${data.payment_link}` : undefined,
      });
      await loadData();
    } catch (error) {
      console.error('Failed to send invoice:', error);
      const message = error instanceof Error ? error.message : 'Failed to send invoice.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const openNewPaymentDialog = () => {
    setPaymentForm({
      invoice_id: '',
      contact_id: '',
      amount: '',
      currency: 'USD',
      payment_method: 'stripe',
      notes: '',
      paid_at: new Date().toISOString().slice(0, 16),
    });
    setIsPaymentDialogOpen(true);
  };

  const handleSavePayment = async () => {
    const amount = parseFloat(paymentForm.amount || '0');
    if (Number.isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid amount', description: 'Amount must be a positive number.', variant: 'destructive' });
      return;
    }

    const invoiceId = paymentForm.invoice_id.trim() ? Number(paymentForm.invoice_id.trim()) : null;
    if (paymentForm.invoice_id.trim() && (Number.isNaN(invoiceId) || invoiceId! <= 0)) {
      toast({ title: 'Invalid invoice ID', description: 'Invoice ID must be a positive number.', variant: 'destructive' });
      return;
    }

    const contactId = paymentForm.contact_id.trim() ? Number(paymentForm.contact_id.trim()) : null;
    if (paymentForm.contact_id.trim() && (Number.isNaN(contactId) || contactId! <= 0)) {
      toast({ title: 'Invalid contact ID', description: 'Contact ID must be a positive number.', variant: 'destructive' });
      return;
    }

    const paidAtValue = paymentForm.paid_at
      ? `${paymentForm.paid_at.replace('T', ' ')}:00`
      : undefined;

    try {
      setSavingPayment(true);
      const payload = {
        invoice_id: invoiceId,
        contact_id: contactId,
        amount,
        currency: paymentForm.currency,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes.trim() || null,
        paid_at: paidAtValue,
      };

      await api.post('/payments/payments', payload);
      toast({ title: 'Payment recorded' });
      setIsPaymentDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error('Failed to record payment:', error);
      const message = error instanceof Error ? error.message : 'Failed to record payment.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSavingPayment(false);
    }
  };

  const handleViewPayment = (payment: Payment) => {
    toast({
      title: `Payment #${payment.id}`,
      description: `Invoice #${payment.invoice_id} • ${payment.amount.toFixed(2)} ${payment.currency} via ${payment.payment_method}`,
    });
  };

  const handleRefundPayment = async (payment: Payment) => {
    if (!confirm(`Are you sure you want to refund payment #${payment.id} for ${payment.amount.toFixed(2)} ${payment.currency}?`)) return;

    try {
      await api.post(`/payments/payments/${payment.id}/refund`);
      toast({ title: 'Payment refunded successfully' });
      await loadData();
    } catch (error) {
      console.error('Failed to refund payment:', error);
      const message = error instanceof Error ? error.message : 'Failed to refund payment.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (

      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

    );
  }

  return (

    <>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Payments & Invoicing</h1>
          <p className="text-gray-600">Manage products, invoices, and payment processing</p>
        </div>
        <Button onClick={openNewInvoiceDialog}>
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="payment-links">Payment Links</TabsTrigger>
          <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
          <TabsTrigger value="local-payments">Local Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.total_revenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Lifetime revenue</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.outstanding_amount.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Awaiting payment</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month's Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.this_month_revenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Current month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
                  <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.overdue_invoices}</div>
                  <p className="text-xs text-muted-foreground">Past due</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.slice(0, 5).map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>${invoice.total.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.slice(0, 5).map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.paid_at).toLocaleDateString()}</TableCell>
                        <TableCell>${payment.amount.toFixed(2)}</TableCell>
                        <TableCell>{payment.payment_method}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button variant="outline" size="icon" onClick={handleProductsFilterClick}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={openNewProductDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{product.type}</TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(product.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openEditProductDialog(product)}>Edit</Button>
                          <Button variant="outline" size="sm" onClick={() => openDuplicateProductDialog(product)}>Duplicate</Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={invoiceSearchTerm}
                  onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={openNewInvoiceDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{getInvoiceCustomerName(invoice)}</TableCell>
                      <TableCell>${invoice.total.toFixed(2)}</TableCell>
                      <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openInvoicePreview(invoice)}
                          >
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditInvoiceClick(invoice)}>Edit</Button>
                          <Button variant="outline" size="sm" onClick={() => handleSendInvoice(invoice)}>Send</Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteInvoice(invoice.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={paymentSearchTerm}
                  onChange={(e) => setPaymentSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={openNewPaymentDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPaymentsList.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{new Date(payment.paid_at).toLocaleDateString()}</TableCell>
                      <TableCell>#{payment.invoice_id}</TableCell>
                      <TableCell>${payment.amount.toFixed(2)}</TableCell>
                      <TableCell>{payment.payment_method}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewPayment(payment)}>View</Button>
                          <Button variant="outline" size="sm" onClick={() => handleRefundPayment(payment)} disabled={payment.status === 'refunded'}>
                            {payment.status === 'refunded' ? 'Refunded' : 'Refund'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-links">
          <PaymentLinksTab />
        </TabsContent>

        <TabsContent value="fulfillment">
          <FulfillmentTab />
        </TabsContent>

        <TabsContent value="local-payments">
          <LocalPaymentsTab />
        </TabsContent>
      </Tabs>
      {/* Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Update product details used on invoices.'
                : 'Create a new product or service that you can add to invoices.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="Product name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-price">Price</Label>
                <Input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-currency">Currency</Label>
                <Select
                  value={productForm.currency}
                  onValueChange={(value) => setProductForm({ ...productForm, currency: value })}
                >
                  <SelectTrigger id="product-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-type">Type</Label>
                <Select
                  value={productForm.type}
                  onValueChange={(value) => setProductForm({ ...productForm, type: value })}
                >
                  <SelectTrigger id="product-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-time</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsProductDialogOpen(false)}
              disabled={savingProduct}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveProduct} disabled={savingProduct}>
              {savingProduct ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="left-0 top-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none sm:rounded-none overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto flex w-full flex-col gap-6">
            <DialogHeader>
              <DialogTitle>Create Invoice</DialogTitle>
              <DialogDescription>
                Create a new invoice for a contact with clear line items and payment terms.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-8">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer & billing</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice-contact">Contact ID</Label>
                    <Input
                      id="invoice-contact"
                      value={invoiceForm.contact_id}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, contact_id: e.target.value })}
                      placeholder="e.g. 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice-currency">Currency</Label>
                    <Select
                      value={invoiceForm.currency}
                      onValueChange={(value) => setInvoiceForm({ ...invoiceForm, currency: value })}
                    >
                      <SelectTrigger id="invoice-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice-status">Status</Label>
                    <Select
                      value={invoiceForm.status}
                      onValueChange={(value) => setInvoiceForm({ ...invoiceForm, status: value })}
                    >
                      <SelectTrigger id="invoice-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice-tax-rate">Tax rate (%)</Label>
                    <Input
                      id="invoice-tax-rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={invoiceForm.tax_rate}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, tax_rate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice-discount">Discount amount</Label>
                    <Input
                      id="invoice-discount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={invoiceForm.discount_amount}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, discount_amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice-issue-date">Issue date</Label>
                    <Input
                      id="invoice-issue-date"
                      type="date"
                      value={invoiceForm.issue_date}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, issue_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice-due-date">Due date</Label>
                    <Input
                      id="invoice-due-date"
                      type="date"
                      value={invoiceForm.due_date}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Line items</p>
                  <Button type="button" variant="outline" size="sm" onClick={addInvoiceItem}>
                    <Plus className="h-3 w-3 mr-1" /> Add line
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="hidden md:grid md:grid-cols-[2fr,0.5fr,1fr,1fr,auto] gap-2 text-xs font-medium text-muted-foreground px-1">
                    <span className="md:col-span-1">Description</span>
                    <span>Qty</span>
                    <span>Unit price</span>
                    <span className="text-right">Amount</span>
                    <span className="text-right" />
                  </div>
                  {invoiceItems.map((item, index) => {
                    const quantityNumber = parseFloat(item.quantity || '1') || 1;
                    const unitPriceNumber = parseFloat(item.unit_price || '0') || 0;
                    const lineAmount = quantityNumber * unitPriceNumber;

                    return (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-[2fr,0.5fr,1fr,1fr,auto] gap-2 items-end border border-dashed rounded-md p-3"
                      >
                        <div className="space-y-1">
                          <Label className="md:hidden">Description</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                            placeholder="Item description"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="md:hidden">Qty</Label>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="md:hidden">Unit price</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateInvoiceItem(index, 'unit_price', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1 text-right">
                          <Label className="md:hidden">Amount</Label>
                          <div className="h-9 flex items-center justify-end text-sm font-medium">
                            {lineAmount ? lineAmount.toFixed(2) : '-'}
                          </div>
                        </div>
                        {invoiceItems.length > 1 && (
                          <div className="flex justify-end pt-2 md:pt-0 md:justify-center md:self-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeInvoiceItem(index)}
                              aria-label="Remove line"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col items-end space-y-1 pt-2">
                  <div className="flex w-full max-w-sm items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>
                      {invoiceSummary.subtotal.toFixed(2)} {invoiceSummary.currency}
                    </span>
                  </div>
                  <div className="flex w-full max-w-sm items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>
                      {invoiceSummary.taxAmount.toFixed(2)} {invoiceSummary.currency}
                    </span>
                  </div>
                  <div className="flex w-full max-w-sm items-center justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span>
                      -{invoiceSummary.discountAmount.toFixed(2)} {invoiceSummary.currency}
                    </span>
                  </div>
                  <div className="mt-2 flex w-full max-w-sm items-center justify-between border-t pt-2 text-sm font-semibold">
                    <span>Total</span>
                    <span>
                      {invoiceSummary.total.toFixed(2)} {invoiceSummary.currency}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground">Notes & terms</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice-notes">Notes</Label>
                    <Textarea
                      id="invoice-notes"
                      value={invoiceForm.notes}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                      placeholder="Optional internal notes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice-terms">Terms</Label>
                    <Textarea
                      id="invoice-terms"
                      value={invoiceForm.terms}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, terms: e.target.value })}
                      placeholder="Payment terms shown on the invoice"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setIsInvoiceDialogOpen(false)}
                disabled={savingInvoice}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveInvoice} disabled={savingInvoice}>
                {savingInvoice ? 'Saving...' : 'Create Invoice'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Preview Dialog */}
      <Dialog open={isInvoicePreviewOpen} onOpenChange={setIsInvoicePreviewOpen}>
        <DialogContent className="max-w-4xl">
          {previewInvoice && (
            <div className="space-y-8 bg-white">
              <div className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                    Invoice
                  </p>
                  <p className="text-2xl font-semibold">#{previewInvoice.invoice_number}</p>
                  <p className="text-sm text-muted-foreground">
                    Issued {formatDate(previewInvoice.issue_date || previewInvoice.created_at)}
                    {' '}• Due {formatDate(previewInvoice.due_date)}
                  </p>
                </div>
                <div className="space-y-2 text-right">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Total Due</p>
                    <p className="text-2xl font-semibold">
                      {previewInvoice.total.toFixed(2)} {previewInvoice.currency}
                    </p>
                  </div>
                  <div>{getStatusBadge(previewInvoice.status)}</div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Bill to</p>
                  <p className="text-sm font-medium">{getInvoiceCustomerName(previewInvoice)}</p>
                  {previewInvoice.contact_email && (
                    <p className="text-sm text-muted-foreground">{previewInvoice.contact_email}</p>
                  )}
                </div>
                <div className="space-y-2 md:text-right">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Invoice details</p>
                  <p className="text-sm text-muted-foreground">Invoice ID: {previewInvoice.id}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Description</TableHead>
                      <TableHead className="w-20">Qty</TableHead>
                      <TableHead className="w-32">Rate</TableHead>
                      <TableHead className="w-32 text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(previewInvoice.items || []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="align-top">
                          <div className="font-medium">{item.description}</div>
                        </TableCell>
                        <TableCell className="align-top">{item.quantity}</TableCell>
                        <TableCell className="align-top">
                          {item.unit_price.toFixed(2)} {previewInvoice.currency}
                        </TableCell>
                        <TableCell className="align-top text-right">
                          {item.amount.toFixed(2)} {previewInvoice.currency}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!previewInvoice.items || previewInvoice.items.length === 0) && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-sm text-muted-foreground"
                        >
                          No line items yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="space-y-4 text-sm md:max-w-md">
                  {previewInvoice.notes && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Notes</p>
                      <p className="mt-1 whitespace-pre-line">{previewInvoice.notes}</p>
                    </div>
                  )}
                  {previewInvoice.terms && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Terms</p>
                      <p className="mt-1 whitespace-pre-line">{previewInvoice.terms}</p>
                    </div>
                  )}
                </div>
                <div className="w-full md:max-w-xs">
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>
                        {(previewInvoice.subtotal ?? previewInvoice.total).toFixed(2)}{' '}
                        {previewInvoice.currency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>
                        {(previewInvoice.tax_amount ?? 0).toFixed(2)} {previewInvoice.currency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span>
                        -{(previewInvoice.discount_amount ?? 0).toFixed(2)}{' '}
                        {previewInvoice.currency}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm font-semibold">
                      <span>Total</span>
                      <span>
                        {previewInvoice.total.toFixed(2)} {previewInvoice.currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a manual payment against an invoice so your revenue and outstanding amounts stay accurate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment-invoice">Invoice ID</Label>
                <Input
                  id="payment-invoice"
                  value={paymentForm.invoice_id}
                  onChange={(e) => setPaymentForm({ ...paymentForm, invoice_id: e.target.value })}
                  placeholder="e.g. 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-contact">Contact ID (optional)</Label>
                <Input
                  id="payment-contact"
                  value={paymentForm.contact_id}
                  onChange={(e) => setPaymentForm({ ...paymentForm, contact_id: e.target.value })}
                  placeholder="e.g. 1"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment-amount">Amount</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-currency">Currency</Label>
                <Select
                  value={paymentForm.currency}
                  onValueChange={(value) => setPaymentForm({ ...paymentForm, currency: value })}
                >
                  <SelectTrigger id="payment-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-method">Method</Label>
                <Select
                  value={paymentForm.payment_method}
                  onValueChange={(value) => setPaymentForm({ ...paymentForm, payment_method: value })}
                >
                  <SelectTrigger id="payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stripe">Stripe / Card</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-date">Paid at</Label>
              <Input
                id="payment-date"
                type="datetime-local"
                value={paymentForm.paid_at}
                onChange={(e) => setPaymentForm({ ...paymentForm, paid_at: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-notes">Notes</Label>
              <Textarea
                id="payment-notes"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Optional internal notes about this payment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
              disabled={savingPayment}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePayment} disabled={savingPayment}>
              {savingPayment ? 'Saving...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>

  );
}

