import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Layout,
  Building2,
  Megaphone,
  Smartphone,
  Home,
  Heart,
  ShoppingBag,
  Calendar,
  Briefcase,
  Wrench,
  Eye,
  ArrowRight,
  Star,
  Monitor,
  Zap,
  LayoutGrid,
  Rows
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';

type TemplateCategory = 'all' | 'home-services' | 'agency' | 'saas' | 'real-estate' | 'healthcare' | 'ecommerce' | 'events' | 'consulting';

interface TemplateDefinition {
  id: string;
  name: string;
  title: string;
  description: string;
  presetId: string;
  tags: string[];
  category: TemplateCategory;
  rating?: number;
  users?: string;
  isNew?: boolean;
  isPopular?: boolean;
  imageColor?: string;
}

const CATEGORIES = [
  { id: 'all' as const, label: 'All Templates', icon: Layout },
  { id: 'home-services' as const, label: 'Home Services', icon: Wrench },
  { id: 'agency' as const, label: 'Agency', icon: Megaphone },
  { id: 'saas' as const, label: 'SaaS & Tech', icon: Smartphone },
  { id: 'real-estate' as const, label: 'Real Estate', icon: Home },
  { id: 'healthcare' as const, label: 'Healthcare & Fitness', icon: Heart },
  { id: 'ecommerce' as const, label: 'E-commerce', icon: ShoppingBag },
  { id: 'events' as const, label: 'Events & Webinars', icon: Calendar },
  { id: 'consulting' as const, label: 'Consulting', icon: Briefcase },
];

const templates: TemplateDefinition[] = [
  // Home Services
  {
    id: 'template-painting',
    name: 'Painting Lead Gen',
    title: 'Painting Lead Gen',
    description: 'Landing page for local painting companies with gallery, reviews, and quote form.',
    presetId: 'painting',
    tags: ['Painting', 'Home Services'],
    category: 'home-services',
    rating: 4.8,
    users: "1.2k+",
    isPopular: true,
    imageColor: "from-amber-700 via-orange-600 to-yellow-600"
  },
  {
    id: 'template-roofing',
    name: 'Roofing & Restoration',
    title: 'Roofing & Restoration',
    description: 'Emergency repairs, replacements, and insurance-focused roofing layout.',
    presetId: 'roofing',
    tags: ['Roofing', 'Home Services'],
    category: 'home-services',
    rating: 4.9,
    users: "2.1k+",
    isNew: true,
    imageColor: "from-slate-700 via-slate-600 to-slate-500"
  },
  {
    id: 'template-cleaning',
    name: 'Cleaning Services',
    title: 'Cleaning Services',
    description: 'For residential, office, and Airbnb cleaning with packages and reviews.',
    presetId: 'cleaning',
    tags: ['Cleaning', 'Home Services'],
    category: 'home-services',
    rating: 4.7,
    users: "1.5k+",
    imageColor: "from-cyan-500 via-sky-400 to-blue-300"
  },
  {
    id: 'template-home-services',
    name: 'General Home Services',
    title: 'General Home Services',
    description: 'Flexible layout for handyman, maintenance, and mixed home services.',
    presetId: 'home-services',
    tags: ['General', 'Home Services'],
    category: 'home-services',
    rating: 4.6,
    users: "800+",
    imageColor: "from-emerald-600 via-teal-500 to-cyan-400"
  },
  {
    id: 'template-hvac',
    name: 'HVAC Services',
    title: 'HVAC Services',
    description: 'Heating, cooling, and ventilation services with emergency contact and seasonal offers.',
    presetId: 'hvac',
    tags: ['HVAC', 'Home Services'],
    category: 'home-services',
    rating: 4.8,
    users: "1.1k+",
    imageColor: "from-blue-600 via-blue-500 to-blue-400"
  },
  {
    id: 'template-plumbing',
    name: 'Plumbing Services',
    title: 'Plumbing Services',
    description: '24/7 plumbing services with emergency callout, pricing, and service areas.',
    presetId: 'plumbing',
    tags: ['Plumbing', 'Home Services'],
    category: 'home-services',
    rating: 4.9,
    users: "1.8k+",
    imageColor: "from-red-900 via-red-800 to-red-600"
  },
  {
    id: 'template-landscaping',
    name: 'Landscaping & Lawn Care',
    title: 'Landscaping & Lawn Care',
    description: 'Lawn maintenance, garden design, and outdoor living space services.',
    presetId: 'landscaping',
    tags: ['Landscaping', 'Home Services'],
    category: 'home-services',
    rating: 4.9,
    users: "2.5k+",
    isNew: true,
    imageColor: "from-green-700 via-emerald-600 to-lime-500"
  },
  // Agency Templates
  {
    id: 'template-marketing-agency',
    name: 'Marketing Agency',
    title: 'Marketing Agency',
    description: 'Full-service digital marketing agency with case studies and service packages.',
    presetId: 'marketing-agency',
    tags: ['Marketing', 'Agency'],
    category: 'agency',
    rating: 4.9,
    users: "3.2k+",
    imageColor: "from-indigo-600 via-purple-600 to-pink-600"
  },
  {
    id: 'template-web-design',
    name: 'Web Design Agency',
    title: 'Web Design Agency',
    description: 'Creative web design agency showcasing portfolio and design process.',
    presetId: 'web-design',
    tags: ['Web Design', 'Agency'],
    category: 'agency',
    rating: 4.8,
    users: "2.1k+",
    imageColor: "from-rose-500 via-pink-500 to-orange-500"
  },
  {
    id: 'template-seo-agency',
    name: 'SEO Agency',
    title: 'SEO Agency',
    description: 'Search engine optimization services with results showcase and audit offer.',
    presetId: 'seo-agency',
    tags: ['SEO', 'Agency'],
    category: 'agency',
    rating: 4.7,
    imageColor: "from-blue-600 via-cyan-500 to-teal-400"
  },
  {
    id: 'template-social-media',
    name: 'Social Media Agency',
    title: 'Social Media Agency',
    description: 'Social media management and advertising with engagement metrics.',
    presetId: 'social-media',
    tags: ['Social Media', 'Agency'],
    category: 'agency',
    rating: 4.9,
    imageColor: "from-fuchsia-600 via-pink-500 to-rose-400"
  },
  // SaaS Templates
  {
    id: 'template-saas-product',
    name: 'SaaS Product Launch',
    title: 'SaaS Product Launch',
    description: 'Modern SaaS product page with features, pricing tiers, and free trial CTA.',
    presetId: 'saas-product',
    tags: ['SaaS', 'Product'],
    category: 'saas',
    rating: 4.9,
    users: "5.5k+",
    isPopular: true,
    imageColor: "from-blue-900 via-indigo-800 to-violet-900"
  },
  {
    id: 'template-app-landing',
    name: 'Mobile App Landing',
    title: 'Mobile App Landing',
    description: 'App download page with screenshots, features, and app store links.',
    presetId: 'app-landing',
    tags: ['App', 'Mobile'],
    category: 'saas',
    rating: 4.7,
    users: "1.9k+",
    imageColor: "from-violet-600 via-fuchsia-500 to-purple-400"
  },
  {
    id: 'template-startup',
    name: 'Startup Launch',
    title: 'Startup Launch',
    description: 'Early-stage startup page with waitlist signup and investor pitch.',
    presetId: 'startup',
    tags: ['Startup', 'Launch'],
    category: 'saas',
    rating: 4.8,
    imageColor: "from-slate-900 via-slate-800 to-slate-700"
  },
  // Real Estate
  {
    id: 'template-real-estate-agent',
    name: 'Real Estate Agent',
    title: 'Real Estate Agent',
    description: 'Personal real estate agent page with listings, testimonials, and contact form.',
    presetId: 'real-estate-agent',
    tags: ['Real Estate', 'Agent'],
    category: 'real-estate',
    rating: 4.8,
    users: "1.4k+",
    imageColor: "from-stone-900 via-stone-700 to-stone-500"
  },
  {
    id: 'template-property-listing',
    name: 'Property Listing',
    title: 'Property Listing',
    description: 'Single property showcase with gallery, features, and inquiry form.',
    presetId: 'property-listing',
    tags: ['Real Estate', 'Property'],
    category: 'real-estate',
    rating: 4.7,
    imageColor: "from-orange-600 via-amber-500 to-yellow-400"
  },
  // Healthcare
  {
    id: 'template-dental-clinic',
    name: 'Dental Clinic',
    title: 'Dental Clinic',
    description: 'Dental practice page with services, team, and appointment booking.',
    presetId: 'dental-clinic',
    tags: ['Dental', 'Healthcare'],
    category: 'healthcare',
    rating: 4.9,
    users: "2.2k+",
    imageColor: "from-cyan-400 via-sky-400 to-blue-400"
  },
  {
    id: 'template-medical-practice',
    name: 'Medical Practice',
    title: 'Medical Practice',
    description: 'Doctor or clinic page with services, credentials, and patient portal.',
    presetId: 'medical-practice',
    tags: ['Medical', 'Healthcare'],
    category: 'healthcare',
    rating: 4.8,
    imageColor: "from-blue-500 via-indigo-500 to-purple-500"
  },
  {
    id: 'template-fitness-gym',
    name: 'Fitness & Gym',
    title: 'Fitness & Gym',
    description: 'Gym membership page with classes, trainers, and membership plans.',
    presetId: 'fitness-gym',
    tags: ['Fitness', 'Gym'],
    category: 'healthcare',
    rating: 4.9,
    imageColor: "from-red-600 via-orange-600 to-yellow-600"
  },
  // E-commerce
  {
    id: 'template-product-launch',
    name: 'Product Launch',
    title: 'Product Launch',
    description: 'Single product launch page with features, benefits, and buy button.',
    presetId: 'product-launch',
    tags: ['Product', 'E-commerce'],
    category: 'ecommerce',
    rating: 4.8,
    imageColor: "from-neutral-900 via-stone-800 to-neutral-800"
  },
  {
    id: 'template-flash-sale',
    name: 'Flash Sale',
    title: 'Flash Sale',
    description: 'Limited time offer page with countdown timer and urgency elements.',
    presetId: 'flash-sale',
    tags: ['Sale', 'E-commerce'],
    category: 'ecommerce',
    rating: 4.9,
    imageColor: "from-red-600 via-rose-600 to-pink-600"
  },
  // Events
  {
    id: 'template-webinar',
    name: 'Webinar Registration',
    title: 'Webinar Registration',
    description: 'Webinar signup page with speaker info, agenda, and registration form.',
    presetId: 'webinar',
    tags: ['Webinar', 'Event'],
    category: 'events',
    rating: 4.8,
    imageColor: "from-indigo-600 via-blue-600 to-cyan-600"
  },
  {
    id: 'template-conference',
    name: 'Conference Event',
    title: 'Conference Event',
    description: 'Conference landing page with speakers, schedule, and ticket purchase.',
    presetId: 'conference',
    tags: ['Conference', 'Event'],
    category: 'events',
    rating: 4.7,
    imageColor: "from-violet-600 via-purple-600 to-indigo-600"
  },
  // Consulting
  {
    id: 'template-business-consulting',
    name: 'Business Consulting',
    title: 'Business Consulting',
    description: 'Professional consulting services with expertise areas and booking.',
    presetId: 'business-consulting',
    tags: ['Consulting', 'Business'],
    category: 'consulting',
    rating: 4.9,
    imageColor: "from-slate-800 via-slate-700 to-slate-600"
  },
];

const LandingPageTemplates: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('all');

  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchesSearch =
        tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || tpl.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handlePreview = (presetId: string) => {
    navigate(`/websites/landing-pages/preview/template-${presetId}`);
  };

  const handleUseTemplate = (presetId: string) => {
    navigate(`/websites/landing-pages/builder/new?preset=${presetId}`);
    toast({
      title: 'Template selected',
      description: `Starting with "${presetId}" template.`,
    });
  };

  const handleCreateBlank = () => {
    navigate('/websites/landing-pages/builder/new');
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card px-8 py-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Landing Page Templates</h1>
            <p className="mt-2 text-muted-foreground">
              Choose from professionally designed templates optimized for high conversion.
            </p>
          </div>
          <Button
            size="lg"
            className="bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
            onClick={handleCreateBlank}
          >
            <Zap className="mr-2 h-5 w-5" />
            Create Blank Page
          </Button>
        </div>

        {/* Search */}
        <div className="flex w-full items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <Tabs value={selectedCategory} onValueChange={(val) => setSelectedCategory(val as TemplateCategory)} className="mb-8">
          <TabsList className="bg-card p-1 shadow-sm flex-wrap h-auto">
            {CATEGORIES.map(category => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <category.icon className="mr-2 h-4 w-4" />
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="group overflow-hidden border-border/50 bg-card transition-all hover:border-primary/50 hover:shadow-md">
                {/* Preview Thumbnail */}
                <div className={`relative h-48 w-full bg-gradient-to-br ${template.imageColor || 'from-gray-700 via-gray-600 to-gray-500'} p-6 flex items-center justify-center`}>
                  <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/20" />
                  <div className="relative z-10 text-center">
                    <Monitor className="h-12 w-12 text-white opacity-80 drop-shadow-md mx-auto mb-2" />
                    <span className="text-sm font-medium text-white shadow-black drop-shadow-sm">View Preview</span>
                  </div>

                  {template.isNew && (
                    <Badge className="absolute left-3 top-3 bg-blue-500 text-white hover:bg-blue-600">NEW</Badge>
                  )}
                  {template.isPopular && (
                    <Badge className="absolute right-3 top-3 bg-amber-500 text-white hover:bg-amber-600">POPULAR</Badge>
                  )}
                </div>

                <CardContent className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{template.name}</h3>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Star className="mr-1 h-3 w-3 fill-amber-400 text-amber-400" />
                      {template.rating || '4.5'}
                    </div>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {template.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {template.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs font-normal">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="flex items-center gap-3 border-t bg-muted/20 p-4">
                  <Button
                    variant="outline"
                    className="w-full flex-1"
                    onClick={() => handlePreview(template.presetId)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    className="w-full flex-1 gap-2"
                    onClick={() => handleUseTemplate(template.presetId)}
                  >
                    Use Template <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Layout className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No templates found</h3>
            <p className="text-muted-foreground">Try adjusting your search or category filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPageTemplates;
