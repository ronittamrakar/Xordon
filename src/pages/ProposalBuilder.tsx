import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';

import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  Settings,
  Palette,
  FileText as FileTextIcon,
  Plus,
  Trash2,
  Copy,
  DollarSign,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GripVertical,
  Image,
  Layout,
  PenTool,
  Briefcase,
} from 'lucide-react';
import { proposalApi, type Proposal, type ProposalItem, type ProposalSection, type ProposalTemplate, type ProposalSettings } from '@/lib/api';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { VisualWebsiteBuilder } from '@/components/websites/VisualWebsiteBuilder';
import { WebsiteSection, WebsiteSettings } from '@/lib/websitesApi';
import { useQuery } from '@tanstack/react-query';
import invoicesApi, { Product } from '@/services/invoicesApi';

const documentTypes = [
  { value: 'proposal', label: 'Proposal', description: 'Business proposal for services or products' },
  { value: 'agreement', label: 'Agreement', description: 'Legal agreement between parties' },
  { value: 'contract', label: 'Contract', description: 'Formal contract with terms and conditions' },
];


// Rich text editor configuration with multimedia support
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'align': [] }],
    ['link', 'image', 'video'],
    ['blockquote', 'code-block'],
    ['clean']
  ],
};

const quillFormats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'script',
  'list', 'bullet', 'indent',
  'direction', 'align',
  'link', 'image', 'video',
  'blockquote', 'code-block'
];

const currencies = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'AUD', label: 'AUD ($)' },
  { value: 'INR', label: 'INR (₹)' },
];

const defaultSections: ProposalSection[] = [
  { id: 'intro', title: 'Introduction', content: '' },
  { id: 'scope', title: 'Scope of Work', content: '' },
  { id: 'timeline', title: 'Timeline', content: '' },
  { id: 'pricing', title: 'Pricing', content: '' },
  { id: 'terms', title: 'Terms & Conditions', content: '' },
];

const ProposalBuilder: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { proposalId } = useParams();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');
  const isEditing = Boolean(proposalId && proposalId !== 'new');

  // Proposal state
  const [proposal, setProposal] = useState<Partial<Proposal>>({
    name: '',
    document_type: 'proposal',
    client_name: '',
    client_email: '',
    client_company: '',
    client_phone: '',
    client_address: '',
    content: '',
    sections: defaultSections,
    items: [],
    total_amount: 0,
    currency: 'USD',
    valid_until: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    status: 'draft',
    notes: '',
    internal_notes: '',
    styling: {
      primary_color: '#3b82f6',
      secondary_color: '#64748b',
      font_family: 'Inter, sans-serif',
    },
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [settings, setSettings] = useState<ProposalSettings | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Fetch products from Ecommerce
  const { data: products = [] } = useQuery({
    queryKey: ['ecommerce-products'],
    queryFn: () => invoicesApi.listProducts(),
  });
  const [builderMode, setBuilderMode] = useState<'classic' | 'visual'>('classic');
  const [visualSections, setVisualSections] = useState<WebsiteSection[]>([]);
  const [visualSettings, setVisualSettings] = useState<WebsiteSettings>({
    seoTitle: '',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter, sans-serif',
    accentColor: '#4f46e5'
  });

  // ============================================================================
  // PROPOSAL ↔ VISUAL BUILDER CONVERSION FUNCTIONS
  // ============================================================================
  // NOTE: We're reusing the VisualWebsiteBuilder component for proposals to provide
  // a visual drag-and-drop editing experience. However, PROPOSALS and WEBSITES are
  // completely SEPARATE entities with their own data structures and purposes:
  // - Proposals: Business documents for clients (stored in proposals table)
  // - Websites: Public-facing web pages (stored in websites table)
  // 
  // These functions convert between:
  // - Proposal format (ProposalSection[], ProposalItem[], ProposalStyling)
  // - Visual Builder format (WebsiteSection[], WebsiteSettings)
  // 
  // This is purely for the editing interface - proposals are NOT websites!
  // ============================================================================

  const convertProposalToVisual = useCallback((proposalData: Partial<Proposal>): { sections: WebsiteSection[], settings: WebsiteSettings } => {
    const sections: WebsiteSection[] = [];

    // Convert proposal main content to a visual hero section (for editing only)
    if (proposalData.content && proposalData.content.trim()) {
      sections.push({
        id: 'main-content',
        type: 'hero',
        title: proposalData.name || 'Proposal',
        content: {
          html: proposalData.content,
        },
        styles: {
          backgroundColor: proposalData.styling?.primary_color || '#3b82f6',
          color: '#ffffff',
          padding: '60px 20px',
          textAlign: 'center',
        },
        visible: true,
      });
    }

    // Convert proposal sections to visual builder sections (for editing only)
    (proposalData.sections || []).forEach((section) => {
      sections.push({
        id: section.id,
        type: 'content',
        title: section.title,
        content: {
          html: section.content,
        },
        styles: {
          padding: '40px 20px',
          backgroundColor: '#ffffff',
        },
        visible: true,
      });
    });

    // Convert proposal pricing items to a visual pricing section (for editing only)
    if (proposalData.items && proposalData.items.length > 0) {
      sections.push({
        id: 'pricing-section',
        type: 'pricing',
        title: 'Pricing',
        content: {
          items: proposalData.items,
          currency: proposalData.currency || 'USD',
          total: proposalData.total_amount || 0,
        },
        styles: {
          backgroundColor: '#f9fafb',
          padding: '40px 20px',
        },
        visible: true,
      });
    }

    // Map proposal styling to visual builder settings (for editing only)
    const settings: WebsiteSettings = {
      seoTitle: proposalData.name || '',
      backgroundColor: '#ffffff',
      fontFamily: proposalData.styling?.font_family || 'Inter, sans-serif',
      accentColor: proposalData.styling?.primary_color || '#4f46e5',
    };

    return { sections, settings };
  }, []);

  const convertVisualToProposal = useCallback((sections: WebsiteSection[], settings: WebsiteSettings, currentProposal: Partial<Proposal>): Partial<Proposal> => {
    // Extract proposal data from visual builder sections
    // This converts the visual editing format back to proposal format for storage
    let mainContent = '';
    const proposalSections: ProposalSection[] = [];
    let items: ProposalItem[] = [];

    sections.forEach((section) => {
      if (section.type === 'hero' && section.id === 'main-content') {
        // Extract proposal main content from visual hero section
        mainContent = section.content?.html || '';
      } else if (section.type === 'pricing' && section.id === 'pricing-section') {
        // Extract proposal pricing items from visual pricing section
        items = section.content?.items || [];
      } else if (section.type === 'content' || section.type === 'text' || section.type === 'hero') {
        // Convert visual builder sections back to proposal sections
        proposalSections.push({
          id: section.id,
          title: section.title || 'Untitled Section',
          content: section.content?.html || '',
        });
      }
    });

    // Return updated proposal with data extracted from visual builder
    return {
      ...currentProposal,
      content: mainContent,
      sections: proposalSections.length > 0 ? proposalSections : currentProposal.sections,
      items: items.length > 0 ? items : currentProposal.items,
      styling: {
        ...currentProposal.styling,
        primary_color: settings.accentColor || currentProposal.styling?.primary_color,
        font_family: settings.fontFamily || currentProposal.styling?.font_family,
      },
    };
  }, []);

  // Load proposal if editing or template
  useEffect(() => {
    if (isEditing && proposalId) {
      loadProposal(proposalId);
    } else if (templateId) {
      loadAndApplyTemplate(templateId);
    }
    loadTemplates();
    loadSettings();
  }, [proposalId, isEditing, templateId]);

  // Pre-fill from URL parameters (Integration with Contacts & Pipeline)
  // Pre-fill from URL parameters (Integration with Contacts & Pipeline)
  useEffect(() => {
    if (!isEditing && !proposalId) {
      const clientEmail = searchParams.get('client_email');
      const clientName = searchParams.get('client_name');
      const amount = searchParams.get('amount');
      const dealId = searchParams.get('deal_id');

      // Support for new parameters from Pipeline page
      const contactId = searchParams.get('contactId');
      const dealValue = searchParams.get('dealValue');
      const dealName = searchParams.get('dealName');

      if (clientEmail || clientName || amount || dealId || contactId || dealValue || dealName) {
        setProposal(prev => ({
          ...prev,
          client_email: clientEmail || prev.client_email,
          client_name: clientName || prev.client_name,
          total_amount: amount ? parseFloat(amount) : (dealValue ? parseFloat(dealValue) : prev.total_amount),
          name: dealName ? decodeURIComponent(dealName) : prev.name,
        }));
      }

      // If we have a contactId, fetch the contact details to populate client info
      if (contactId) {
        import('@/lib/api').then(({ api }) => {
          api.getContact(contactId).then((contact) => {
            if (contact) {
              setProposal(prev => ({
                ...prev,
                client_name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || prev.client_name,
                client_email: contact.email || prev.client_email,
                client_phone: contact.phone || prev.client_phone,
                client_company: contact.company || prev.client_company,
                client_address: [contact.address, contact.city, contact.state, contact.country].filter(Boolean).join(', ') || prev.client_address,
              }));
            }
          }).catch(console.error);
        });
      }
    }

    // Handle incoming items from Field Service or other sources
    const state = location.state as any;
    if (state?.items && Array.isArray(state.items) && !isEditing) {
      setProposal(prev => ({
        ...prev,
        items: state.items.map((item: any) => ({
          name: item.name || item.description || 'Service Item',
          description: item.description || '',
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unit_price) || 0,
          tax_percent: Number(item.tax_percent || item.tax_rate) || 0,
          discount_percent: 0
        })),
        client_name: state.client_name || prev.client_name,
        client_email: state.client_email || prev.client_email,
        client_phone: state.client_phone || prev.client_phone,
        client_address: state.client_address || prev.client_address,
      }));

      // Clear state
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
  }, [location.state, location.pathname, location.search, navigate, searchParams, isEditing, proposalId]);

  const handleCreateInvoice = () => {
    navigate('/finance/invoices', {
      state: {
        create: true,
        contactData: {
          email: proposal.client_email,
          firstName: proposal.client_name?.split(' ')[0],
          lastName: proposal.client_name?.split(' ').slice(1).join(' '),
        },
        lineItems: proposal.items?.map(item => ({
          description: item.name + (item.description ? ` - ${item.description}` : ''),
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_percent
        })),
        notes: `Invoice created from proposal: ${proposal.name}`,
        terms: 'Payment due on receipt'
      }
    });
  };

  // Calculate total when items change
  useEffect(() => {
    const total = (proposal.items || []).reduce((sum, item) => {
      const quantity = item.quantity || 1;
      const unitPrice = item.unit_price || 0;
      const discount = item.discount_percent || 0;
      const tax = item.tax_percent || 0;

      const subtotal = quantity * unitPrice;
      const discountAmount = subtotal * (discount / 100);
      const afterDiscount = subtotal - discountAmount;
      const taxAmount = afterDiscount * (tax / 100);

      return sum + afterDiscount + taxAmount;
    }, 0);

    setProposal(prev => ({ ...prev, total_amount: total }));
  }, [proposal.items]);

  const loadProposal = async (id: string) => {
    try {
      setLoading(true);
      const data = await proposalApi.getProposal(id);
      setProposal(data);

      // Load visual builder data if available
      if (data.settings?.visual_builder_data) {
        setVisualSections(data.settings.visual_builder_data.sections || []);
        setVisualSettings(data.settings.visual_builder_data.settings || {});
        if (data.settings.visual_builder_data.sections?.length > 0) {
          setBuilderMode('visual');
        }
      }
    } catch (error) {
      console.error('Failed to load proposal:', error);
      toast.error('Failed to load proposal');
      navigate('/proposals');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await proposalApi.getTemplates();
      setTemplates(response.items);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadAndApplyTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      const template = await proposalApi.getTemplate(templateId);
      if (template) {
        setProposal(prev => ({
          ...prev,
          name: template.name,
          template_id: parseInt(template.id),
          content: template.content,
          sections: template.sections || defaultSections,
          styling: template.styling || prev.styling,
        }));
        setActiveTab('content'); // Switch to content tab to show applied template
        toast.success(`Template "${template.name}" loaded - Check the Content tab`);
      }
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await proposalApi.getSettings();
      setSettings(data);
      // Apply default settings to new proposals
      if (!isEditing && data) {
        setProposal(prev => ({
          ...prev,
          currency: data.default_currency || prev.currency,
          valid_until: format(addDays(new Date(), data.default_validity_days || 30), 'yyyy-MM-dd'),
        }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleVisualBuilderSave = async (sections: WebsiteSection[], settings: WebsiteSettings) => {
    setVisualSections(sections);
    setVisualSettings(settings);

    // We need to construct the proposal data manually here to ensure we use the latest params
    if (!proposal) return;

    setSaving(true);
    try {
      // Store sections as JSON - HTML rendering will happen on the client when viewing
      const htmlContent = JSON.stringify(sections);

      const proposalData: Partial<Proposal> = {
        ...proposal, // Start with current proposal state
        content: htmlContent, // Overwrite rich text content with visual builder HTML
        settings: {
          ...(proposal.settings || {}),
          visual_builder_data: {
            sections: sections,
            settings: settings
          }
        },
      };

      await proposalApi.updateProposal(proposalId!, proposalData);
      toast.success('Visual proposal saved successfully');

      // Refresh
      loadProposal(proposalId!);
    } catch (error) {
      console.error('Failed to save visual proposal:', error);
      toast.error('Failed to save proposal');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!proposal.name) {
      toast.error('Please enter a proposal name');
      return;
    }

    try {
      setSaving(true);
      let proposalToSave = { ...proposal };

      // Add visual builder data if in visual mode
      if (builderMode === 'visual') {
        // Convert visual data back to classic format for compatibility
        const convertedProposal = convertVisualToProposal(visualSections, visualSettings, proposal);
        proposalToSave = {
          ...convertedProposal,
          settings: {
            ...(convertedProposal.settings || {}),
            visual_builder_data: {
              sections: visualSections,
              settings: visualSettings
            }
          }
        };
      } else {
        // In classic mode, also store visual representation for compatibility
        const { sections: visualSecs, settings: visualSets } = convertProposalToVisual(proposal);
        proposalToSave.settings = {
          ...(proposalToSave.settings || {}),
          visual_builder_data: {
            sections: visualSecs,
            settings: visualSets
          }
        };
      }

      if (isEditing && proposalId) {
        await proposalApi.updateProposal(proposalId, proposalToSave);
        toast.success('Proposal updated successfully');
      } else {
        const response = await proposalApi.createProposal(proposalToSave);
        toast.success('Proposal created successfully');
        navigate(`/proposals/${response.id}/edit`);
      }
    } catch (error) {
      console.error('Failed to save proposal:', error);
      toast.error('Failed to save proposal');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!proposal.client_email) {
      toast.error('Please add a client email before sending');
      return;
    }

    try {
      setSaving(true);
      // Save first
      if (isEditing && proposalId) {
        await proposalApi.updateProposal(proposalId, proposal);
        await proposalApi.sendProposal(proposalId);
        toast.success('Proposal sent successfully');
        navigate('/proposals');
      }
    } catch (error) {
      console.error('Failed to send proposal:', error);
      toast.error('Failed to send proposal');
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (template: ProposalTemplate) => {
    setProposal(prev => ({
      ...prev,
      name: template.name,
      template_id: parseInt(template.id),
      content: template.content,
      sections: template.sections || defaultSections,
      styling: template.styling || prev.styling,
      settings: {
        ...(prev.settings || {}),
        visual_builder_data: undefined, // Clear visual builder data when applying classic template
      }
    }));
    setVisualSections([]); // Clear visual sections
    setBuilderMode('classic'); // Switch to classic mode
    setTemplateDialogOpen(false);
    setActiveTab('content'); // Switch to content tab to show applied template
    toast.success(`Template "${template.name}" applied - Check the Content tab`);
  };

  const updateSection = (sectionId: string, content: string) => {
    setProposal(prev => ({
      ...prev,
      sections: (prev.sections || []).map(s =>
        s.id === sectionId ? { ...s, content } : s
      ),
    }));
  };

  const addSection = () => {
    const newSection: ProposalSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      content: '',
    };
    setProposal(prev => ({
      ...prev,
      sections: [...(prev.sections || []), newSection],
    }));
  };

  const removeSection = (sectionId: string) => {
    setProposal(prev => ({
      ...prev,
      sections: (prev.sections || []).filter(s => s.id !== sectionId),
    }));
  };

  const updateSectionTitle = (sectionId: string, title: string) => {
    setProposal(prev => ({
      ...prev,
      sections: (prev.sections || []).map(s =>
        s.id === sectionId ? { ...s, title } : s
      ),
    }));
  };

  const addItem = () => {
    const newItem: ProposalItem = {
      name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_percent: 0,
      tax_percent: 0,
      is_optional: false,
    };
    setProposal(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const updateItem = (index: number, field: keyof ProposalItem, value: unknown) => {
    setProposal(prev => ({
      ...prev,
      items: (prev.items || []).map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeItem = (index: number) => {
    setProposal(prev => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index),
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: proposal.currency || 'USD',
    }).format(amount);
  };

  const handleModeSwitch = () => {
    if (builderMode === 'classic') {
      // Switching from Classic to Visual
      const { sections, settings } = convertProposalToVisual(proposal);
      setVisualSections(sections);
      setVisualSettings(settings);
      setBuilderMode('visual');
      toast.success('Switched to Visual Editor');
    } else {
      // Switching from Visual to Classic
      const updatedProposal = convertVisualToProposal(visualSections, visualSettings, proposal);
      setProposal(updatedProposal);
      setBuilderMode('classic');
      toast.success('Switched to Classic Editor');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Proposals', href: '/proposals' },
          { label: isEditing ? 'Edit Proposal' : 'New Proposal' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/proposals')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Edit Proposal' : 'New Proposal'}
            </h1>
            {proposal.status && (
              <Badge variant="outline" className="mt-1">
                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Layout className="h-4 w-4 mr-2" />
                Use Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl block overflow-y-auto max-h-[85vh]">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl font-bold">Choose a Template</DialogTitle>
                <DialogDescription className="text-base">
                  Select a professionally designed template to start your proposal.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="group cursor-pointer hover:ring-2 hover:ring-indigo-600 hover:shadow-xl transition-all duration-300 overflow-hidden border-slate-200 flex flex-col h-full"
                    onClick={() => applyTemplate(template)}
                  >
                    <div className="h-40 bg-slate-100 relative overflow-hidden shrink-0">
                      {template.cover_image ? (
                        <img
                          src={template.cover_image}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          alt={template.name}
                        />
                      ) : (
                        <FileTextIcon className="h-10 w-10 text-indigo-300" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute top-2 right-2 flex gap-1">
                        {template.is_default && (
                          <Badge className="bg-indigo-600 text-white border-none">Default</Badge>
                        )}
                        <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-slate-700 border-none shadow-sm">{template.category}</Badge>
                      </div>
                    </div>
                    <CardHeader className="p-4 space-y-1">
                      <CardTitle className="text-base font-bold group-hover:text-indigo-600 transition-colors line-clamp-1">{template.name}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2">{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                            <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-[8px] font-bold text-indigo-400">P</div>
                          </div>
                        ))}
                      </div>
                      <div className="text-[12px] font-black uppercase tracking-widest text-slate-400">
                        {template.usage_count || 0} Uses
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button
            variant={builderMode === 'visual' ? 'default' : 'outline'}
            onClick={handleModeSwitch}
            className="hidden md:flex"
          >
            <PenTool className="h-4 w-4 mr-2" />
            {builderMode === 'classic' ? 'Visual Builder' : 'Classic Editor'}
          </Button>
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          {isEditing && (proposal.status === 'draft' || proposal.status === 'sent') && (
            <Button onClick={handleSend} disabled={saving}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          )}
          {isEditing && (proposal.status === 'accepted' || proposal.status === 'sent') && (
            <Button onClick={handleCreateInvoice} variant="secondary">
              <FileTextIcon className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          )}
          {isEditing && proposal.status === 'accepted' && (
            <Button
              onClick={() => navigate('/projects', {
                state: {
                  fromLead: true,
                  title: proposal.name,
                  description: `Project from Proposal: ${proposal.name}\nClient: ${proposal.client_name} (${proposal.client_email})`
                }
              })}
              variant="outline"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {builderMode === 'visual' ? (
        <div className="flex-1 overflow-hidden h-[calc(100vh-12rem)] border rounded-xl shadow-inner bg-slate-50/50">
          <VisualWebsiteBuilder
            initialSections={visualSections}
            initialSettings={visualSettings}
            onSave={({ sections, settings }) => handleVisualBuilderSave(sections, settings)}
          />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Proposal Details</CardTitle>
                    <CardDescription>Basic information about this proposal</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Document Name *</Label>
                      <Input
                        id="name"
                        value={proposal.name || ''}
                        onChange={(e) => setProposal(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Website Redesign Proposal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="document_type">Document Type</Label>
                      <Select
                        value={proposal.document_type || 'proposal'}
                        onValueChange={(value) => setProposal(prev => ({ ...prev, document_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          {documentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-sm text-muted-foreground">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="valid_until">Valid Until</Label>
                        <Input
                          id="valid_until"
                          type="date"
                          value={proposal.valid_until || ''}
                          onChange={(e) => setProposal(prev => ({ ...prev, valid_until: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                          value={proposal.currency || 'USD'}
                          onValueChange={(value) => setProposal(prev => ({ ...prev, currency: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Client Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="client_name">Client Name</Label>
                        <Input
                          id="client_name"
                          value={proposal.client_name || ''}
                          onChange={(e) => setProposal(prev => ({ ...prev, client_name: e.target.value }))}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client_company">Company</Label>
                        <Input
                          id="client_company"
                          value={proposal.client_company || ''}
                          onChange={(e) => setProposal(prev => ({ ...prev, client_company: e.target.value }))}
                          placeholder="Acme Inc."
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="client_email">Email</Label>
                        <Input
                          id="client_email"
                          type="email"
                          value={proposal.client_email || ''}
                          onChange={(e) => setProposal(prev => ({ ...prev, client_email: e.target.value }))}
                          placeholder="john@acme.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client_phone">Phone</Label>
                        <Input
                          id="client_phone"
                          value={proposal.client_phone || ''}
                          onChange={(e) => setProposal(prev => ({ ...prev, client_phone: e.target.value }))}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client_address">Address</Label>
                      <Textarea
                        id="client_address"
                        value={proposal.client_address || ''}
                        onChange={(e) => setProposal(prev => ({ ...prev, client_address: e.target.value }))}
                        placeholder="123 Main St, City, State 12345"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4">
                {/* Main Content Editor */}
                <Card>
                  <CardHeader>
                    <CardTitle>Main Content</CardTitle>
                    <CardDescription>Rich content for your document header and introduction</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ReactQuill
                      theme="snow"
                      value={proposal.content || ''}
                      onChange={(value) => setProposal(prev => ({ ...prev, content: value }))}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="Start typing your document content here... Add images, videos, links, and formatted text."
                      style={{ minHeight: '200px' }}
                    />
                  </CardContent>
                </Card>

                {/* Sections */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Document Sections</CardTitle>
                        <CardDescription>Add and edit sections of your document</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={addSection}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Section
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(proposal.sections || []).map((section, index) => (
                      <div key={section.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                            <Input
                              value={section.title}
                              onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                              className="font-semibold border-0 p-0 h-auto focus-visible:ring-0"
                              placeholder="Section Title"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSection(section.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                        <ReactQuill
                          theme="snow"
                          value={section.content || ''}
                          onChange={(value) => updateSection(section.id, value)}
                          placeholder={`Enter content for ${section.title}...`}
                          modules={quillModules}
                          formats={quillFormats}
                          style={{ minHeight: '150px' }}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pricing Tab */}
              <TabsContent value="pricing" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Line Items
                        </CardTitle>
                        <CardDescription>Add products or services to your proposal</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={addItem}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(proposal.items || []).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No items added yet</p>
                        <Button variant="link" onClick={addItem}>
                          Add your first item
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(proposal.items || []).map((item, index) => (
                          <div key={index} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 grid gap-3 sm:grid-cols-2">
                                <div className="space-y-2">
                                  <Label>Product / Service *</Label>
                                  <div className="flex gap-2">
                                    <Select
                                      onValueChange={(productId) => {
                                        const product = products.find(p => p.id === parseInt(productId));
                                        if (product) {
                                          updateItem(index, 'name', product.name);
                                          updateItem(index, 'description', product.description || '');
                                          updateItem(index, 'unit_price', product.price);
                                          updateItem(index, 'tax_percent', product.tax_rate);
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select from inventory..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {products.map((product) => (
                                          <SelectItem key={product.id} value={product.id.toString()}>
                                            {product.name} ({formatCurrency(product.price)})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      value={item.name}
                                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                                      placeholder="Or enter custom name"
                                      className="flex-1"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Description</Label>
                                  <Input
                                    value={item.description || ''}
                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                    placeholder="Brief description"
                                  />
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="ml-2"
                                onClick={() => removeItem(index)}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-4">
                              <div className="space-y-2">
                                <Label>Quantity</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Unit Price</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unit_price}
                                  onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Discount %</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={item.discount_percent || 0}
                                  onChange={(e) => updateItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Tax %</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.tax_percent || 0}
                                  onChange={(e) => updateItem(index, 'tax_percent', parseFloat(e.target.value) || 0)}
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={item.is_optional || false}
                                  onCheckedChange={(checked) => updateItem(index, 'is_optional', checked)}
                                />
                                <Label className="text-sm text-muted-foreground">Optional item</Label>
                              </div>
                              <div className="text-right">
                                <span className="text-sm text-muted-foreground">Line Total: </span>
                                <span className="font-semibold">
                                  {formatCurrency(
                                    (() => {
                                      const qty = item.quantity || 1;
                                      const price = item.unit_price || 0;
                                      const disc = item.discount_percent || 0;
                                      const tax = item.tax_percent || 0;
                                      const subtotal = qty * price;
                                      const afterDisc = subtotal - (subtotal * disc / 100);
                                      return afterDisc + (afterDisc * tax / 100);
                                    })()
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Styling
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-6 md:grid-cols-3">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Primary Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={proposal.styling?.primary_color || '#3b82f6'}
                              onChange={(e) => setProposal(prev => ({
                                ...prev,
                                styling: { ...prev.styling, primary_color: e.target.value }
                              }))}
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              value={proposal.styling?.primary_color || '#3b82f6'}
                              onChange={(e) => setProposal(prev => ({
                                ...prev,
                                styling: { ...prev.styling, primary_color: e.target.value }
                              }))}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Secondary Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={proposal.styling?.secondary_color || '#64748b'}
                              onChange={(e) => setProposal(prev => ({
                                ...prev,
                                styling: { ...prev.styling, secondary_color: e.target.value }
                              }))}
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              value={proposal.styling?.secondary_color || '#64748b'}
                              onChange={(e) => setProposal(prev => ({
                                ...prev,
                                styling: { ...prev.styling, secondary_color: e.target.value }
                              }))}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Font Family</Label>
                          <Select
                            value={proposal.styling?.font_family || 'Inter, sans-serif'}
                            onValueChange={(value) => setProposal(prev => ({
                              ...prev,
                              styling: { ...prev.styling, font_family: value }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter, sans-serif">Inter (Modern)</SelectItem>
                              <SelectItem value="Georgia, serif">Georgia (Classic)</SelectItem>
                              <SelectItem value="'Times New Roman', serif">Times New Roman (Formal)</SelectItem>
                              <SelectItem value="'Arial', sans-serif">Arial (Clean)</SelectItem>
                              <SelectItem value="'Courier New', monospace">Courier New (Code)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Header Style</Label>
                          <Select
                            value={proposal.styling?.header_style || 'modern'}
                            onValueChange={(value) => setProposal(prev => ({
                              ...prev,
                              styling: { ...prev.styling, header_style: value }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="modern">Modern</SelectItem>
                              <SelectItem value="classic">Classic</SelectItem>
                              <SelectItem value="minimal">Minimal</SelectItem>
                              <SelectItem value="bold">Bold</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Theme Presets</Label>
                          <div className="grid gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setProposal(prev => ({
                                ...prev,
                                styling: {
                                  ...prev.styling,
                                  primary_color: '#3b82f6',
                                  secondary_color: '#64748b',
                                  font_family: 'Inter, sans-serif',
                                  header_style: 'modern'
                                }
                              }))}
                            >
                              Business Blue
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setProposal(prev => ({
                                ...prev,
                                styling: {
                                  ...prev.styling,
                                  primary_color: '#10b981',
                                  secondary_color: '#6b7280',
                                  font_family: 'Georgia, serif',
                                  header_style: 'classic'
                                }
                              }))}
                            >
                              Classic Green
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setProposal(prev => ({
                                ...prev,
                                styling: {
                                  ...prev.styling,
                                  primary_color: '#1f2937',
                                  secondary_color: '#9ca3af',
                                  font_family: 'Times New Roman, serif',
                                  header_style: 'formal'
                                }
                              }))}
                            >
                              Formal Black
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Client Notes</Label>
                      <Textarea
                        value={proposal.notes || ''}
                        onChange={(e) => setProposal(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Notes visible to the client..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Internal Notes</Label>
                      <Textarea
                        value={proposal.internal_notes || ''}
                        onChange={(e) => setProposal(prev => ({ ...prev, internal_notes: e.target.value }))}
                        placeholder="Private notes (not visible to client)..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline">
                    {(proposal.status || 'draft').charAt(0).toUpperCase() + (proposal.status || 'draft').slice(1)}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Items</span>
                  <span>{(proposal.items || []).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Sections</span>
                  <span>{(proposal.sections || []).length}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(proposal.total_amount || 0)}</span>
                </div>
                {proposal.valid_until && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Valid Until</span>
                    <span>{format(new Date(proposal.valid_until), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {proposal.client_name && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Client</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{proposal.client_name}</span>
                  </div>
                  {proposal.client_company && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{proposal.client_company}</span>
                    </div>
                  )}
                  {proposal.client_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{proposal.client_email}</span>
                    </div>
                  )}
                  {proposal.client_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{proposal.client_phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isEditing && proposal.activities && proposal.activities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {proposal.activities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex justify-between">
                        <span className="text-muted-foreground">{activity.description}</span>
                        <span className="text-xs">
                          {format(new Date(activity.created_at), 'MMM d')}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ProposalBuilder;
