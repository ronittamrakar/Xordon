import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FileTextIcon,
  Plus,
  MoreVertical,
  Send,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Download,
  Copy,
  CreditCard,
  Package,
  Link2,
  Search,
  Filter,
  Pencil,
  Trash2,
  RefreshCw,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import invoicesApi, { Invoice, Product, PaymentLink, InvoiceStats, InvoiceItem } from '@/services/invoicesApi';
import { format, parseISO } from 'date-fns';
import SEO from '@/components/SEO';
import { api } from '@/lib/api';
import { coursesApi } from '@/services/coursesApi';

interface LineItemForm {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  product_id?: number | null;
}

const Invoices: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'invoices' | 'payment-links'>('invoices');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer' | 'cash' | 'check' | 'other'>('card');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    contact_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
    terms: '',
    currency: 'USD',
  });

  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    { description: '', quantity: 1, unit_price: 0, tax_rate: 0, product_id: null }
  ]);

  const [isCreatePaymentLinkOpen, setIsCreatePaymentLinkOpen] = useState(false);
  const [newPaymentLink, setNewPaymentLink] = useState({
    name: '',
    description: '',
    amount: '',
    currency: 'USD',
    is_amount_fixed: true,
  });

  // Fetch invoices
  const { data: invoicesData, isLoading: isLoadingInvoices, refetch: refetchInvoices } = useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: () => invoicesApi.listInvoices({
      status: statusFilter === 'all' ? undefined : statusFilter,
      limit: 100,
    }),
  });

  // Fetch payment links
  const { data: paymentLinks = [], isLoading: isLoadingLinks } = useQuery({
    queryKey: ['payment-links'],
    queryFn: () => invoicesApi.listPaymentLinks(),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['invoice-stats'],
    queryFn: () => invoicesApi.getStats(),
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => invoicesApi.listProducts(),
  });

  const invoices = invoicesData?.data || [];

  // Create payment link mutation
  const createPaymentLinkMutation = useMutation({
    mutationFn: (data: any) => invoicesApi.createPaymentLink(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-links'] });
      toast.success('Payment link created successfully');
      setIsCreatePaymentLinkOpen(false);
      setNewPaymentLink({
        name: '',
        description: '',
        amount: '',
        currency: 'USD',
        is_amount_fixed: true,
      });
    },
    onError: (error) => {
      console.error('Failed to create payment link:', error);
      toast.error('Failed to create payment link');
    }
  });

  const handleCreatePaymentLink = () => {
    if (!newPaymentLink.name) {
      toast.error('Please enter a name for the payment link');
      return;
    }

    createPaymentLinkMutation.mutate({
      ...newPaymentLink,
      amount: newPaymentLink.amount ? parseFloat(newPaymentLink.amount) : null,
    });
  };

  // Load contacts
  const [selectedInvoiceForEnrollment, setSelectedInvoiceForEnrollment] = useState<Invoice | null>(null);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);

  useEffect(() => {
    loadContacts();
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const courses = await coursesApi.getCourses({ status: 'published' });
      setAvailableCourses(courses);
    } catch (error) {
      console.error('Failed to load courses', error);
    }
  };

  const handleEnrollClick = (invoice: Invoice) => {
    setSelectedInvoiceForEnrollment(invoice);
    setIsEnrollDialogOpen(true);
  };

  const confirmEnrollment = async (courseId: number) => {
    if (!selectedInvoiceForEnrollment?.contact_id) return;
    try {
      await coursesApi.enrollStudent(courseId, selectedInvoiceForEnrollment.contact_id);
      toast.success('Student enrolled successfully');
      setIsEnrollDialogOpen(false);
    } catch (error) {
      toast.error('Failed to enroll student');
    }
  };

  // Handle navigation from other pages (e.g., Proposal -> Invoice)
  const location = useLocation();
  useEffect(() => {
    if (location.state && (location.state as any).create) {
      const state = location.state as any;

      // Pre-fill contact
      if (state.contact_id || state.contactData?.id) {
        setFormData(prev => ({
          ...prev,
          contact_id: String(state.contact_id || state.contactData.id)
        }));
      }

      // Pre-fill line items
      if (state.lineItems && Array.isArray(state.lineItems)) {
        setLineItems(state.lineItems.map((item: any) => ({
          description: item.description || '',
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unit_price) || 0,
          tax_rate: Number(item.tax_rate) || 0,
          product_id: item.product_id || null
        })));
      }

      // Pre-fill notes/terms
      if (state.notes || state.terms) {
        setFormData(prev => ({
          ...prev,
          notes: state.notes || prev.notes,
          terms: state.terms || prev.terms
        }));
      }

      // Open dialog
      setIsCreateInvoiceOpen(true);

      // Clear state to prevent reopening on refresh (optional, but good practice)
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state]);

  const loadContacts = async () => {
    try {
      const response = await api.get('/contacts');
      setContacts((response.data as any)?.items || (response.data as any)?.contacts || []);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  // Update invoice status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: number; status: string }) =>
      invoicesApi.updateInvoiceStatus(data.id, data.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      toast.success('Invoice updated');
    },
  });

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async (data: { invoiceId: number; amount: number; paymentMethod: string; notes?: string }) => {
      return await invoicesApi.recordPayment(data.invoiceId, {
        amount: data.amount,
        payment_method: data.paymentMethod,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      setIsRecordPaymentOpen(false);
      setSelectedInvoice(null);
      setPaymentAmount('');
      setPaymentNotes('');
      toast.success('Payment recorded successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record payment');
    },
  });

  // Create/Update invoice mutation
  const saveInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingId) {
        await invoicesApi.updateInvoice(editingId, data);
        return { id: editingId };
      } else {
        return await invoicesApi.createInvoice(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      setIsCreateInvoiceOpen(false);
      resetForm();
      toast.success(editingId ? 'Invoice updated successfully' : 'Invoice created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save invoice');
    },
  });

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);

    const taxAmount = lineItems.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unit_price;
      return sum + (itemTotal * (item.tax_rate / 100));
    }, 0);

    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const saveInvoice = async () => {
    try {
      const { subtotal, taxAmount, total } = calculateTotals();

      const payload = {
        contact_id: parseInt(formData.contact_id),
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        notes: formData.notes,
        terms: formData.terms,
        currency: formData.currency,
        items: lineItems.filter(item => item.description).map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          product_id: item.product_id,
        })),
      };

      await saveInvoiceMutation.mutateAsync(payload);
    } catch (error) {
      console.error('Failed to save invoice:', error);
    }
  };

  const handleEdit = async (invoice: Invoice) => {
    setEditingId(invoice.id);
    setFormData({
      contact_id: String(invoice.contact_id),
      issue_date: invoice.issue_date.split('T')[0],
      due_date: invoice.due_date.split('T')[0],
      notes: invoice.notes || '',
      terms: invoice.terms || '',
      currency: invoice.currency,
    });

    // Fetch full invoice details to get line items
    try {
      const fullInvoice = await invoicesApi.getInvoice(invoice.id);
      if (fullInvoice.items && fullInvoice.items.length > 0) {
        setLineItems(fullInvoice.items.map((item: InvoiceItem) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          product_id: item.product_id,
        })));
      }
    } catch (error) {
      console.error('Failed to load invoice details:', error);
    }

    setIsCreateInvoiceOpen(true);
  };

  const handleView = async (invoice: Invoice) => {
    try {
      const fullInvoice = await invoicesApi.getInvoice(invoice.id);
      setSelectedInvoice(fullInvoice);
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error('Failed to load invoice details:', error);
      toast.error('Failed to load invoice details');
    }
  };

  const handleSend = async (invoice: Invoice) => {
    if (invoice.status === 'draft') {
      await updateStatusMutation.mutateAsync({ id: invoice.id, status: 'sent' });
    }
  };

  const handleDownloadPDF = (invoice: Invoice) => {
    try {
      import('jspdf').then(({ default: jsPDF }) => {
        import('jspdf-autotable').then(({ default: autoTable }) => {
          const doc = new jsPDF();

          // Header
          doc.setFontSize(22);
          doc.text('INVOICE', 105, 20, { align: 'center' });

          doc.setFontSize(12);
          doc.text(`Invoice #: ${invoice.invoice_number}`, 14, 35);
          doc.text(`Date: ${format(parseISO(invoice.issue_date), 'MMM d, yyyy')}`, 14, 42);
          doc.text(`Due Date: ${format(parseISO(invoice.due_date), 'MMM d, yyyy')}`, 14, 49);

          // Bill To
          doc.text('Bill To:', 14, 60);
          doc.setFont('helvetica', 'bold');
          const customerName = invoice.contact_first_name || invoice.contact_last_name
            ? `${invoice.contact_first_name || ''} ${invoice.contact_last_name || ''}`.trim()
            : invoice.contact_email || 'Customer';
          doc.text(customerName, 14, 65);
          doc.setFont('helvetica', 'normal');
          if (invoice.contact_email) doc.text(invoice.contact_email, 14, 70);

          // Table
          // @ts-ignore
          autoTable(doc, {
            startY: 80,
            head: [['Item Description', 'Qty', 'Unit Price', 'Tax %', 'Total']],
            body: (invoice.items || []).map((item) => [
              item.description,
              item.quantity,
              formatCurrency(item.unit_price, invoice.currency),
              `${item.tax_rate}%`,
              formatCurrency(item.quantity * item.unit_price, invoice.currency),
            ]),
            foot: [
              ['', '', '', 'Subtotal:', formatCurrency(invoice.subtotal || invoice.amount, invoice.currency)],
              ['', '', '', 'Tax:', formatCurrency((invoice.total || invoice.amount) - (invoice.subtotal || invoice.amount), invoice.currency)],
              ['', '', '', 'Total:', formatCurrency(invoice.total || invoice.amount, invoice.currency)],
            ],
          });

          // Footer
          const finalY = (doc as any).lastAutoTable.finalY + 10;
          doc.setFontSize(10);

          if (invoice.notes) {
            doc.text('Notes:', 14, finalY);
            doc.text(invoice.notes, 14, finalY + 5);
          }

          if (invoice.payment_link) {
            doc.text('Pay Online:', 14, finalY + (invoice.notes ? 20 : 0));
            doc.setTextColor(0, 0, 255);
            doc.textWithLink('Click here to pay', 14, finalY + (invoice.notes ? 25 : 5), { url: `${window.location.origin}/pay/${invoice.payment_link}` });
          }

          doc.save(`Invoice_${invoice.invoice_number}.pdf`);
          toast.success('Invoice PDF downloaded successfully');
        });
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleCancel = async (invoice: Invoice) => {
    if (confirm('Are you sure you want to cancel this invoice?')) {
      await updateStatusMutation.mutateAsync({ id: invoice.id, status: 'cancelled' });
    }
  };

  const resetForm = () => {
    setFormData({
      contact_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      notes: '',
      terms: '',
      currency: 'USD',
    });
    setLineItems([{ description: '', quantity: 1, unit_price: 0, tax_rate: 0, product_id: null }]);
    setEditingId(null);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, tax_rate: 0, product_id: null }]);
  };

  const updateLineItem = (index: number, field: keyof LineItemForm, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    // If product is selected, auto-fill details
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        updated[index].description = product.name;
        updated[index].unit_price = product.price;
        updated[index].tax_rate = product.tax_rate;
      }
    }

    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      viewed: 'bg-purple-100 text-purple-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-500',
      refunded: 'bg-orange-100 text-orange-800',
    };
    return <Badge className={styles[status] || 'bg-gray-100'}>{status}</Badge>;
  };

  const copyPaymentLink = (link: string) => {
    const url = `${window.location.origin}/pay/${link}`;
    navigator.clipboard.writeText(url);
    toast.success('Payment link copied!');
  };

  const filteredInvoices = invoices.filter(inv => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        inv.invoice_number?.toLowerCase().includes(search) ||
        inv.contact_first_name?.toLowerCase().includes(search) ||
        inv.contact_last_name?.toLowerCase().includes(search) ||
        inv.contact_email?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <div className="space-y-6">
      <SEO
        title="Invoices & Payments"
        description="Manage your business invoices, products, and payment links. Track collected and outstanding payments."
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices & Payments</h1>
          <p className="text-muted-foreground">Manage invoices and payment links</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchInvoices()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => navigate('/finance/products')}>
            <Package className="h-4 w-4 mr-2" />
            Manage Products
          </Button>
          <Button onClick={() => {
            resetForm();
            setIsCreateInvoiceOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.outstanding || 0)}</div>
              <div className="text-sm text-muted-foreground">Outstanding</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.collected || 0)}</div>
              <div className="text-sm text-muted-foreground">Collected</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdue_amount || 0)}</div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total || 0}</div>
              <div className="text-sm text-muted-foreground">Total Invoices</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payment-links">Payment Links</TabsTrigger>
          </TabsList>

          {activeTab === 'invoices' && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-4">
          {isLoadingInvoices ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredInvoices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileTextIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
                <p className="text-muted-foreground mb-4">Create your first invoice to get started</p>
                <Button onClick={() => setIsCreateInvoiceOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        {invoice.contact_first_name || invoice.contact_last_name
                          ? `${invoice.contact_first_name || ''} ${invoice.contact_last_name || ''}`.trim()
                          : invoice.contact_email || '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>{format(parseISO(invoice.issue_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{format(parseISO(invoice.due_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.amount_due > 0 ? (
                          <span className="text-red-600">{formatCurrency(invoice.amount_due, invoice.currency)}</span>
                        ) : (
                          <span className="text-green-600">Paid</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(invoice)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleView(invoice)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            {invoice.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleSend(invoice)}>
                                <Send className="h-4 w-4 mr-2" />
                                Send
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            {invoice.status === 'paid' && invoice.contact_id && (
                              <DropdownMenuItem onClick={() => handleEnrollClick(invoice)}>
                                <BookOpen className="h-4 w-4 mr-2" />
                                Enroll in Course
                              </DropdownMenuItem>
                            )}

                            {invoice.amount_due > 0 && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedInvoice(invoice);
                                setPaymentAmount(String(invoice.amount_due));
                                setIsRecordPaymentOpen(true);
                              }}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Record Payment
                              </DropdownMenuItem>
                            )}
                            {invoice.payment_link && (
                              <DropdownMenuItem onClick={() => copyPaymentLink(invoice.payment_link!)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Payment Link
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleCancel(invoice)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Payment Links Tab */}
        <TabsContent value="payment-links" className="mt-4">
          {isLoadingLinks ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : paymentLinks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Link2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No payment links yet</h3>
                <p className="text-muted-foreground mb-4">Create reusable payment links for quick payments</p>
                <Button onClick={() => setIsCreatePaymentLinkOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Payment Link
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Button onClick={() => setIsCreatePaymentLinkOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Payment Link
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paymentLinks.map((link) => (
                  <Card key={link.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{link.name}</CardTitle>
                        <Badge variant={link.is_active ? 'default' : 'secondary'}>
                          {link.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {link.description && (
                        <p className="text-sm text-muted-foreground mb-2">{link.description}</p>
                      )}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-semibold">
                          {link.amount ? formatCurrency(link.amount, link.currency) : 'Custom amount'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{link.usage_count} uses</span>
                        <span>{formatCurrency(link.total_collected, link.currency)} collected</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => {
                          const url = `${window.location.origin}/pay/${link.slug}`;
                          navigator.clipboard.writeText(url);
                          toast.success('Link copied!');
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Link
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Invoice Dialog */}
      <Dialog open={isCreateInvoiceOpen} onOpenChange={(open) => {
        setIsCreateInvoiceOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Modify the existing invoice' : 'Create a detailed invoice for your customer'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select value={formData.contact_id} onValueChange={(v) => setFormData({ ...formData, contact_id: v })}>
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
                <Label>Currency</Label>
                <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date *</Label>
                <Input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
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
                      <TableHead className="w-[35%]">Description</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Tax %</TableHead>
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
                            value={item.product_id ? String(item.product_id) : 'none'}
                            onValueChange={(v) => updateLineItem(index, 'product_id', v === 'none' ? null : parseInt(v))}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {products.map((p) => (
                                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                              ))}
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
                        <TableCell>
                          <Input
                            type="number"
                            step="0.1"
                            value={item.tax_rate}
                            onChange={(e) => updateLineItem(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                            className="w-[70px]"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          ${((item.quantity * item.unit_price) * (1 + item.tax_rate / 100)).toFixed(2)}
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
            <Button variant="outline" onClick={() => setIsCreateInvoiceOpen(false)}>Cancel</Button>
            <Button
              onClick={saveInvoice}
              disabled={!formData.contact_id || !formData.due_date || saveInvoiceMutation.isPending}
            >
              {editingId ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selectedInvoice?.invoice_number}</span>
              {selectedInvoice && getStatusBadge(selectedInvoice.status)}
            </DialogTitle>
            <DialogDescription>Invoice Details</DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Customer</Label>
                  <p className="font-medium">
                    {selectedInvoice.contact_first_name || selectedInvoice.contact_last_name
                      ? `${selectedInvoice.contact_first_name || ''} ${selectedInvoice.contact_last_name || ''}`.trim()
                      : 'Not specified'}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.contact_email || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Issue Date</Label>
                  <p className="font-medium">
                    {format(parseISO(selectedInvoice.issue_date), 'MMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Due Date</Label>
                  <p className="font-medium">
                    {format(parseISO(selectedInvoice.due_date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Line Items</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Tax</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.items.map((item: InvoiceItem, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                          <TableCell>{item.tax_rate}%</TableCell>
                          <TableCell>${(item.total || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax:</span>
                    <span className="font-medium">{formatCurrency(selectedInvoice.tax_amount, selectedInvoice.currency)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-lg">{formatCurrency(selectedInvoice.total, selectedInvoice.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Paid:</span>
                    <span className="font-medium text-green-600">{formatCurrency(selectedInvoice.amount_paid, selectedInvoice.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Due:</span>
                    <span className="font-medium text-red-600">{formatCurrency(selectedInvoice.amount_due, selectedInvoice.currency)}</span>
                  </div>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm">{selectedInvoice.notes}</p>
                </div>
              )}

              {selectedInvoice.terms && (
                <div>
                  <Label className="text-muted-foreground">Terms & Conditions</Label>
                  <p className="text-sm">{selectedInvoice.terms}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                {selectedInvoice.status === 'draft' && (
                  <Button onClick={() => {
                    handleSend(selectedInvoice);
                    setIsViewDialogOpen(false);
                  }}>
                    <Send className="h-4 w-4 mr-2" /> Send to Customer
                  </Button>
                )}
                {selectedInvoice.amount_due > 0 && (
                  <Button onClick={() => {
                    setIsViewDialogOpen(false);
                    setPaymentAmount(String(selectedInvoice.amount_due));
                    setIsRecordPaymentOpen(true);
                  }}>
                    <CreditCard className="h-4 w-4 mr-2" /> Record Payment
                  </Button>
                )}
                <Button variant="outline" onClick={() => handleDownloadPDF(selectedInvoice)}>
                  <Download className="h-4 w-4 mr-2" /> Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={isRecordPaymentOpen} onOpenChange={setIsRecordPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for invoice {selectedInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Invoice Total</span>
                <span className="font-medium">{selectedInvoice && formatCurrency(selectedInvoice.total, selectedInvoice.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Due</span>
                <span className="font-medium text-red-600">{selectedInvoice && formatCurrency(selectedInvoice.amount_due, selectedInvoice.currency)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment Amount *</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Optional payment notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRecordPaymentOpen(false)}>Cancel</Button>
            <Button
              onClick={() => selectedInvoice && recordPaymentMutation.mutate({
                invoiceId: selectedInvoice.id,
                amount: parseFloat(paymentAmount) || 0,
                paymentMethod: paymentMethod,
                notes: paymentNotes
              })}
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || recordPaymentMutation.isPending}
            >
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Enrollment Dialog */}
      <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll Student in Course</DialogTitle>
            <DialogDescription>
              Select a course to enroll {selectedInvoiceForEnrollment?.contact_first_name} {selectedInvoiceForEnrollment?.contact_last_name} into.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              {availableCourses.map(course => (
                <Button
                  key={course.id}
                  variant="outline"
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => confirmEnrollment(course.id)}
                >
                  <div className="text-left">
                    <div className="font-semibold">{course.title}</div>
                    <div className="text-xs text-muted-foreground">{course.level} • {course.total_lessons} lessons</div>
                  </div>
                </Button>
              ))}
              {availableCourses.length === 0 && (
                <div className="text-center text-muted-foreground py-4">No published courses available.</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default Invoices;
