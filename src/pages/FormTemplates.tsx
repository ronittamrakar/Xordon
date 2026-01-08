import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  FileTextIcon,
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  Eye,
  Sparkles,
  Users,
  Mail,
  MessageSquare,
  ClipboardList,
  Star,
  Building2,
  Heart,
  ShoppingCart,
  Calendar,
  Briefcase,
  GraduationCap,
  Stethoscope,
  Home,
  Car,
  Utensils,
  Dumbbell,
  Layers,
  Grid3X3,
  LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api, FormTemplate } from '@/lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { FormRenderer } from '@/components/forms/FormRenderer';

type FormTemplateWithExtras = FormTemplate & {
  category?: string;
  niche?: string;
  usage_count?: number;
  is_system?: boolean;
  preview_image?: string;
};

// Built-in system templates for different niches
const SYSTEM_TEMPLATES: FormTemplateWithExtras[] = [
  {
    id: 'sys-contact-basic',
    name: 'Simple Contact Form',
    description: 'A clean, minimal contact form perfect for any website',
    category: 'contact',
    niche: 'general',
    is_system: true,
    usage_count: 0,
    fields: [
      { id: 'name', name: 'name', type: 'text', label: 'Full Name', required: true, placeholder: 'John Doe' },
      { id: 'email', name: 'email', type: 'email', label: 'Email Address', required: true, placeholder: 'john@example.com' },
      { id: 'message', name: 'message', type: 'textarea', label: 'Message', required: true, placeholder: 'How can we help you?' },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sys-lead-gen',
    name: 'Lead Generation Form',
    description: 'Capture leads with company info and qualification questions',
    category: 'lead',
    niche: 'marketing',
    is_system: true,
    usage_count: 0,
    fields: [
      { id: 'first_name', name: 'first_name', type: 'text', label: 'First Name', required: true },
      { id: 'last_name', name: 'last_name', type: 'text', label: 'Last Name', required: true },
      { id: 'email', name: 'email', type: 'email', label: 'Work Email', required: true },
      { id: 'company', name: 'company', type: 'text', label: 'Company Name', required: true },
      { id: 'phone', name: 'phone', type: 'tel', label: 'Phone Number', required: false },
      { id: 'budget', name: 'budget', type: 'select', label: 'Budget Range', required: false, options: ['Under $1,000', '$1,000 - $5,000', '$5,000 - $10,000', '$10,000+'] },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sys-newsletter',
    name: 'Newsletter Signup',
    description: 'Simple email capture for newsletter subscriptions',
    category: 'lead',
    niche: 'marketing',
    is_system: true,
    usage_count: 0,
    fields: [
      { id: 'email', name: 'email', type: 'email', label: 'Email Address', required: true, placeholder: 'Enter your email' },
      { id: 'name', name: 'name', type: 'text', label: 'Name (Optional)', required: false },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sys-feedback',
    name: 'Customer Feedback',
    description: 'Collect valuable feedback from your customers',
    category: 'feedback',
    niche: 'general',
    is_system: true,
    usage_count: 0,
    fields: [
      { id: 'rating', name: 'rating', type: 'rating', label: 'Overall Satisfaction', required: true, rating_max: 5 },
      { id: 'experience', name: 'experience', type: 'select', label: 'How was your experience?', required: true, options: ['Excellent', 'Good', 'Average', 'Poor'] },
      { id: 'feedback', name: 'feedback', type: 'textarea', label: 'Tell us more', required: false, placeholder: 'What did you like or dislike?' },
      { id: 'email', name: 'email', type: 'email', label: 'Email (for follow-up)', required: false },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sys-event-registration',
    name: 'Event Registration',
    description: 'Register attendees for events, webinars, or workshops',
    category: 'registration',
    niche: 'events',
    is_system: true,
    usage_count: 0,
    fields: [
      { id: 'name', name: 'name', type: 'text', label: 'Full Name', required: true },
      { id: 'email', name: 'email', type: 'email', label: 'Email', required: true },
      { id: 'company', name: 'company', type: 'text', label: 'Company/Organization', required: false },
      { id: 'dietary', name: 'dietary', type: 'select', label: 'Dietary Requirements', required: false, options: ['None', 'Vegetarian', 'Vegan', 'Gluten-free', 'Other'] },
      { id: 'questions', name: 'questions', type: 'textarea', label: 'Questions for the speaker', required: false },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sys-survey',
    name: 'Customer Survey',
    description: 'Comprehensive survey to understand customer needs',
    category: 'survey',
    niche: 'general',
    is_system: true,
    usage_count: 0,
    is_multi_step: true,
    steps: [
      { id: 'step-1', title: 'About You', order: 0, fields: ['name', 'email', 'age_range'] },
      { id: 'step-2', title: 'Your Experience', order: 1, fields: ['satisfaction', 'recommend', 'feedback'] },
    ],
    fields: [
      { id: 'name', name: 'name', type: 'text', label: 'Your Name', required: true, step: 0 },
      { id: 'email', name: 'email', type: 'email', label: 'Email', required: true, step: 0 },
      { id: 'age_range', name: 'age_range', type: 'select', label: 'Age Range', required: false, options: ['18-24', '25-34', '35-44', '45-54', '55+'], step: 0 },
      { id: 'satisfaction', name: 'satisfaction', type: 'rating', label: 'How satisfied are you?', required: true, rating_max: 5, step: 1 },
      { id: 'recommend', name: 'recommend', type: 'radio', label: 'Would you recommend us?', required: true, options: ['Definitely', 'Probably', 'Not sure', 'Probably not', 'Definitely not'], step: 1 },
      { id: 'feedback', name: 'feedback', type: 'textarea', label: 'Additional Comments', required: false, step: 1 },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sys-real-estate',
    name: 'Property Inquiry',
    description: 'Capture leads interested in real estate properties',
    category: 'lead',
    niche: 'real_estate',
    is_system: true,
    usage_count: 0,
    fields: [
      { id: 'name', name: 'name', type: 'text', label: 'Full Name', required: true },
      { id: 'email', name: 'email', type: 'email', label: 'Email', required: true },
      { id: 'phone', name: 'phone', type: 'tel', label: 'Phone Number', required: true },
      { id: 'property_type', name: 'property_type', type: 'select', label: 'Property Type', required: true, options: ['House', 'Apartment', 'Condo', 'Land', 'Commercial'] },
      { id: 'budget', name: 'budget', type: 'select', label: 'Budget Range', required: true, options: ['Under $200k', '$200k-$500k', '$500k-$1M', '$1M+'] },
      { id: 'timeline', name: 'timeline', type: 'select', label: 'When are you looking to buy?', required: false, options: ['ASAP', '1-3 months', '3-6 months', '6+ months'] },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sys-healthcare',
    name: 'Patient Intake Form',
    description: 'Collect patient information for healthcare providers',
    category: 'registration',
    niche: 'healthcare',
    is_system: true,
    usage_count: 0,
    fields: [
      { id: 'name', name: 'name', type: 'text', label: 'Patient Name', required: true },
      { id: 'dob', name: 'dob', type: 'date', label: 'Date of Birth', required: true },
      { id: 'email', name: 'email', type: 'email', label: 'Email', required: true },
      { id: 'phone', name: 'phone', type: 'tel', label: 'Phone Number', required: true },
      { id: 'reason', name: 'reason', type: 'textarea', label: 'Reason for Visit', required: true },
      { id: 'insurance', name: 'insurance', type: 'text', label: 'Insurance Provider', required: false },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sys-restaurant',
    name: 'Restaurant Reservation',
    description: 'Accept table reservations for restaurants',
    category: 'registration',
    niche: 'restaurant',
    is_system: true,
    usage_count: 0,
    fields: [
      { id: 'name', name: 'name', type: 'text', label: 'Name', required: true },
      { id: 'email', name: 'email', type: 'email', label: 'Email', required: true },
      { id: 'phone', name: 'phone', type: 'tel', label: 'Phone', required: true },
      { id: 'date', name: 'date', type: 'date', label: 'Reservation Date', required: true },
      { id: 'time', name: 'time', type: 'time', label: 'Preferred Time', required: true },
      { id: 'guests', name: 'guests', type: 'select', label: 'Number of Guests', required: true, options: ['1', '2', '3', '4', '5', '6', '7', '8+'] },
      { id: 'special', name: 'special', type: 'textarea', label: 'Special Requests', required: false },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sys-fitness',
    name: 'Gym Membership Inquiry',
    description: 'Capture leads for fitness centers and gyms',
    category: 'lead',
    niche: 'fitness',
    is_system: true,
    usage_count: 0,
    fields: [
      { id: 'name', name: 'name', type: 'text', label: 'Full Name', required: true },
      { id: 'email', name: 'email', type: 'email', label: 'Email', required: true },
      { id: 'phone', name: 'phone', type: 'tel', label: 'Phone', required: true },
      { id: 'goals', name: 'goals', type: 'checkbox', label: 'Fitness Goals', required: false, options: ['Weight Loss', 'Muscle Building', 'General Fitness', 'Sports Training', 'Flexibility'] },
      { id: 'experience', name: 'experience', type: 'select', label: 'Fitness Experience', required: false, options: ['Beginner', 'Intermediate', 'Advanced'] },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Niche categories with icons
const NICHES = [
  { id: 'all', label: 'All Templates', icon: LayoutGrid },
  { id: 'general', label: 'General', icon: FileTextIcon },
  { id: 'marketing', label: 'Marketing', icon: Mail },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'real_estate', label: 'Real Estate', icon: Home },
  { id: 'healthcare', label: 'Healthcare', icon: Stethoscope },
  { id: 'restaurant', label: 'Restaurant', icon: Utensils },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'ecommerce', label: 'E-commerce', icon: ShoppingCart },
];

const FormTemplates: React.FC = () => {
  const navigate = useNavigate();
  const [userTemplates, setUserTemplates] = useState<FormTemplateWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [nicheFilter, setNicheFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'gallery' | 'my_templates'>('gallery');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<FormTemplateWithExtras | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplateWithExtras | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Combine system templates with user templates
  const allTemplates = [...SYSTEM_TEMPLATES, ...userTemplates];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.getFormTemplates();
      setUserTemplates(response as FormTemplateWithExtras[]);
    } catch (error) {
      console.error('Error fetching form templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete || templateToDelete.is_system) return;

    try {
      await api.deleteFormTemplate(templateToDelete.id);
      setUserTemplates(userTemplates.filter(template => template.id !== templateToDelete.id));
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error) {
      console.error('Error deleting form template:', error);
    }
  };

  const handleCopyTemplate = async (template: FormTemplateWithExtras) => {
    try {
      const newTemplate = {
        name: `${template.name} (Copy)`,
        description: template.description,
        fields: template.fields,
        is_multi_step: template.is_multi_step,
        steps: template.steps,
        category: template.category
      };
      const response = await api.createFormTemplate(newTemplate);
      setUserTemplates([...userTemplates, response]);
    } catch (error) {
      console.error('Error copying form template:', error);
    }
  };

  const handleUseTemplate = (template: FormTemplateWithExtras) => {
    // Navigate to form builder with template data
    navigate('/forms/builder/new', {
      state: {
        template: {
          name: template.name,
          title: template.name,
          description: template.description,
          fields: template.fields,
          is_multi_step: template.is_multi_step,
          steps: template.steps
        }
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      contact: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      lead: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      survey: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      registration: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      feedback: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    };
    return colors[category || 'other'] || colors.other;
  };

  const getNicheIcon = (niche?: string) => {
    const icons: Record<string, React.ElementType> = {
      general: FileTextIcon,
      marketing: Mail,
      events: Calendar,
      real_estate: Home,
      healthcare: Stethoscope,
      restaurant: Utensils,
      fitness: Dumbbell,
      education: GraduationCap,
      ecommerce: ShoppingCart,
    };
    return icons[niche || 'general'] || FileTextIcon;
  };

  // Filter templates based on search and niche
  const getFilteredTemplates = (templates: FormTemplateWithExtras[]) => {
    return templates.filter((template) => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesNiche = nicheFilter === 'all' || template.niche === nicheFilter;
      return matchesSearch && matchesNiche;
    });
  };

  const filteredSystemTemplates = getFilteredTemplates(SYSTEM_TEMPLATES);
  const filteredUserTemplates = getFilteredTemplates(userTemplates);

  // Template card component
  const TemplateCard = ({ template, showActions = true }: { template: FormTemplateWithExtras; showActions?: boolean }) => {
    const NicheIcon = getNicheIcon(template.niche);

    return (
      <Card className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
        template.is_system && "border-blue-100 dark:border-blue-900/30"
      )}>
        {/* Gradient header based on category */}
        <div className={cn(
          "h-24 relative overflow-hidden",
          template.category === 'contact' && "bg-gradient-to-br from-blue-500 to-blue-600",
          template.category === 'lead' && "bg-gradient-to-br from-green-500 to-emerald-600",
          template.category === 'survey' && "bg-gradient-to-br from-purple-500 to-violet-600",
          template.category === 'registration' && "bg-gradient-to-br from-orange-500 to-amber-600",
          template.category === 'feedback' && "bg-gradient-to-br from-yellow-500 to-orange-500",
          !template.category && "bg-gradient-to-br from-gray-500 to-gray-600"
        )}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <NicheIcon className="h-5 w-5 text-white" />
            </div>
            {template.is_system && (
              <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Built-in
              </Badge>
            )}
          </div>
          {template.is_multi_step && (
            <Badge className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white border-0 text-xs">
              <Layers className="h-3 w-3 mr-1" />
              Multi-step
            </Badge>
          )}
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <CardTitle className="text-base font-semibold truncate">{template.name}</CardTitle>
              {template.description && (
                <CardDescription className="line-clamp-2 text-xs">
                  {template.description}
                </CardDescription>
              )}
            </div>
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setPreviewTemplate(template);
                    setPreviewDialogOpen(true);
                  }}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUseTemplate(template)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Use Template
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCopyTemplate(template)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Save as My Template
                  </DropdownMenuItem>
                  {!template.is_system && (
                    <>
                      <DropdownMenuItem onClick={() => navigate(`/forms/templates/edit/${template.id}`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setTemplateToDelete(template);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <ClipboardList className="h-3 w-3" />
                {template.fields.length} fields
              </span>
              {template.steps && template.steps.length > 0 && (
                <span className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {template.steps.length} steps
                </span>
              )}
            </div>
            <Badge variant="outline" className={cn("text-xs", getCategoryColor(template.category))}>
              {template.category || 'other'}
            </Badge>
          </div>

          <Button
            className="w-full"
            size="sm"
            onClick={() => handleUseTemplate(template)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Use This Template
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading form templates...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Form Templates Gallery</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Choose from beautiful pre-built templates or create your own
              </p>
            </div>
            <Button onClick={() => navigate('/forms/templates/new')} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>

          {/* Tabs for Gallery vs My Templates */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'gallery' | 'my_templates')} className="w-full">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="gallery" className="gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Template Gallery
                  <Badge variant="secondary" className="ml-1 text-xs">{SYSTEM_TEMPLATES.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="my_templates" className="gap-2">
                  <FileTextIcon className="h-4 w-4" />
                  My Templates
                  <Badge variant="secondary" className="ml-1 text-xs">{userTemplates.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:flex-none">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full lg:w-[280px]"
                  />
                </div>
              </div>
            </div>

            {/* Niche Filter Pills */}
            {activeTab === 'gallery' && (
              <div className="flex flex-wrap gap-2 pt-4">
                {NICHES.map((niche) => {
                  const Icon = niche.icon;
                  const count = niche.id === 'all'
                    ? SYSTEM_TEMPLATES.length
                    : SYSTEM_TEMPLATES.filter(t => t.niche === niche.id).length;

                  if (count === 0 && niche.id !== 'all') return null;

                  return (
                    <Button
                      key={niche.id}
                      variant={nicheFilter === niche.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNicheFilter(niche.id)}
                      className={cn(
                        "gap-2 transition-all",
                        nicheFilter === niche.id && "shadow-md"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {niche.label}
                      <Badge variant="secondary" className="ml-1 text-xs bg-white/20">
                        {count}
                      </Badge>
                    </Button>
                  );
                })}
              </div>
            )}

            {/* Gallery Tab Content */}
            <TabsContent value="gallery" className="mt-6">
              {filteredSystemTemplates.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Search className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                    <p className="text-muted-foreground mb-4 text-center">
                      Try adjusting your search or filter criteria
                    </p>
                    <Button variant="outline" onClick={() => { setSearchQuery(''); setNicheFilter('all'); }}>
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredSystemTemplates.map((template) => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* My Templates Tab Content */}
            <TabsContent value="my_templates" className="mt-6">
              {userTemplates.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <FileTextIcon className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No custom templates yet</h3>
                    <p className="text-muted-foreground mb-4 text-center max-w-md">
                      Create your own templates or save copies from the gallery to reuse them later
                    </p>
                    <div className="flex gap-3">
                      <Button onClick={() => navigate('/forms/templates/new')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Template
                      </Button>
                      <Button variant="outline" onClick={() => setActiveTab('gallery')}>
                        Browse Gallery
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : filteredUserTemplates.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Search className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                    <p className="text-muted-foreground mb-4 text-center">
                      Try adjusting your search criteria
                    </p>
                    <Button variant="outline" onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredUserTemplates.map((template) => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Template Preview Dialog */}
      <AlertDialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {previewTemplate?.is_system && (
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Built-in
                </Badge>
              )}
              {previewTemplate?.name}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {previewTemplate?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-6">
            {previewTemplate && (
              <FormRenderer
                formData={{
                  title: previewTemplate.name,
                  description: previewTemplate.description,
                  type: previewTemplate.is_multi_step ? 'multi_step' : 'single_step',
                  settings: {
                    design: {
                      theme: 'modern',
                      primaryColor: '#3B82F6',
                    },
                    behavior: {
                      showProgressBar: previewTemplate.is_multi_step,
                    },
                  },
                  fields: previewTemplate.fields.map(field => ({
                    ...field,
                    id: field.id || field.name,
                  })),
                }}
                previewMode={true}
              />
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <Button onClick={() => {
              if (previewTemplate) {
                handleCopyTemplate(previewTemplate);
                setPreviewDialogOpen(false);
              }
            }} variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Save as My Template
            </Button>
            <Button onClick={() => {
              if (previewTemplate) {
                handleUseTemplate(previewTemplate);
                setPreviewDialogOpen(false);
              }
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Use Template
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default FormTemplates;

