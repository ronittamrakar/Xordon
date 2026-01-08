import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Globe,
    ShoppingCart,
    Briefcase,
    Layout,
    FileTextIcon,
    ArrowRight,
    Star,
    Monitor,
    Smartphone,
    Zap,
    Coffee,
    Utensils,
    Dumbbell,
    Building,
    Rocket,
    Eye,
    Search
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { WEBSITE_TEMPLATES } from '@/data/websiteTemplates';
import { WebsiteSectionRenderer } from '@/components/websites/WebsiteSectionRenderer';

const CATEGORIES = [
    { id: 'all', label: 'All Templates', icon: Layout },
    { id: 'business', label: 'Local Business', icon: Building },
    { id: 'ecommerce', label: 'Ecommerce', icon: ShoppingCart },
    { id: 'sass', label: 'SaaS & Tech', icon: Rocket },
    { id: 'landing', label: 'Landing Pages', icon: Zap },
    { id: 'blog', label: 'Blogs & News', icon: FileTextIcon },
    { id: 'portfolio', label: 'Portfolios', icon: Briefcase },
];

const TEMPLATES = [
    {
        id: 1,
        title: "Nova SaaS",
        category: "sass",
        description: "Modern SaaS dashboard and marketing site with dark mode support.",
        image: "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
        tags: ["SaaS", "Dark Mode", "Dashboard"],
        rating: 4.9,
        users: "2k+",
        isNew: true
    },
    {
        id: 2,
        title: "Artisan Coffee",
        category: "business",
        description: "Elegant layout for cafes and local coffee shops with menu integration.",
        image: "bg-gradient-to-br from-amber-700 via-orange-600 to-yellow-600",
        tags: ["Cafe", "Menu", "Booking"],
        rating: 4.8,
        users: "1.2k+"
    },
    {
        id: 3,
        title: "Vogue Store",
        category: "ecommerce",
        description: "High-conversion fashion e-commerce template with minimal aesthetic.",
        image: "bg-gradient-to-br from-stone-900 via-stone-700 to-stone-500",
        tags: ["Fashion", "Shop", "Minimal"],
        rating: 4.7,
        users: "3.5k+",
        isPopular: true
    },
    {
        id: 4,
        title: "Vitality Gym",
        category: "business",
        description: "Dynamic gym and fitness center website with class scheduling.",
        image: "bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-400",
        tags: ["Fitness", "Scheduling", "Membership"],
        rating: 4.6,
        users: "800+"
    },
    {
        id: 5,
        title: "Tech Blog",
        category: "blog",
        description: "Clean, readable layout for tech news and personal developer blogs.",
        image: "bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400",
        tags: ["Blog", "Tech", "Content"],
        rating: 4.8,
        users: "5k+"
    },
    {
        id: 6,
        title: "Launchpad",
        category: "landing",
        description: "High-impact landing page template for mobile apps and startups.",
        image: "bg-gradient-to-br from-violet-600 via-fuchsia-500 to-purple-400",
        tags: ["Startup", "App", "Waitlist"],
        rating: 4.9,
        users: "1.5k+",
        isNew: true
    },
    {
        id: 7,
        title: "Bistro Modern",
        category: "business",
        description: "Sophisticated restaurant website with reservation system.",
        image: "bg-gradient-to-br from-red-900 via-red-800 to-red-600",
        tags: ["Restaurant", "Reservations", "Gallery"],
        rating: 4.7,
        users: "900+"
    },
    {
        id: 8,
        title: "DevPortfolio",
        category: "portfolio",
        description: "Showcase your work with this sleek, interactive portfolio template.",
        image: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700",
        tags: ["Portfolio", "Developer", "CV"],
        rating: 4.9,
        users: "4k+"
    },
    {
        id: 9,
        title: "MarketPro",
        category: "ecommerce",
        description: "Feature-rich multi-vendor marketplace template.",
        image: "bg-gradient-to-br from-orange-500 via-red-500 to-pink-500",
        tags: ["Marketplace", "Multi-vendor", "Cart"],
        rating: 4.6,
        users: "1.1k+"
    },
    {
        id: 10,
        title: "Luxe Interiors",
        category: "business",
        description: "Premium painting and interior design services.",
        image: "bg-gradient-to-br from-yellow-700 via-yellow-600 to-yellow-500",
        tags: ["Interior", "Design", "Services"],
        rating: 4.8,
        users: "600+"
    },
    {
        id: 11,
        title: "Quantum SaaS",
        category: "sass",
        description: "High-tech dark mode SaaS template.",
        image: "bg-gradient-to-br from-blue-900 via-slate-800 to-slate-900",
        tags: ["Dark Mode", "SaaS", "Tech"],
        rating: 4.9,
        users: "2.5k+"
    },
    {
        id: 12,
        title: "Urban Threads",
        category: "ecommerce",
        description: "Streetwear fashion store.",
        image: "bg-gradient-to-br from-neutral-900 via-stone-800 to-neutral-800",
        tags: ["Fashion", "Streetwear", "Dark"],
        rating: 4.7,
        users: "1.8k+"
    },
    {
        id: 13,
        title: "Zen Spa",
        category: "business",
        description: "Wellness and spa retreat template.",
        image: "bg-gradient-to-br from-stone-400 via-stone-300 to-stone-200",
        tags: ["Spa", "Wellness", "Relax"],
        rating: 4.9,
        users: "400+"
    },
    {
        id: 14,
        title: "Summit Roofing",
        category: "business",
        description: "Professional roofing services.",
        image: "bg-gradient-to-br from-slate-700 via-slate-600 to-slate-500",
        tags: ["Roofing", "Construction", "Services"],
        rating: 4.8,
        users: "New",
        isNew: true
    },
    {
        id: 15,
        title: "GreenLeaf",
        category: "business",
        description: "Lawn care and landscaping.",
        image: "bg-gradient-to-br from-green-700 via-emerald-600 to-lime-500",
        tags: ["Landscaping", "Garden", "Nature"],
        rating: 4.9,
        users: "New",
        isNew: true
    },
    {
        id: 16,
        title: "Sparkle Cleaners",
        category: "business",
        description: "Home and office cleaning.",
        image: "bg-gradient-to-br from-cyan-500 via-sky-400 to-blue-300",
        tags: ["Cleaning", "Home", "Eco"],
        rating: 4.7,
        users: "New",
        isNew: true
    }
];

export default function WebsiteTemplates() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [previewTemplate, setPreviewTemplate] = useState<typeof TEMPLATES[0] | null>(null);

    const filteredTemplates = TEMPLATES.filter(template => {
        const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
        const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleUseTemplate = (template: typeof TEMPLATES[0]) => {
        // Map template category to website type
        const typeMap: Record<string, string> = {
            'sass': 'saas',
            'business': 'business',
            'ecommerce': 'ecommerce',
            'landing': 'landing-page',
            'blog': 'blog',
            'portfolio': 'portfolio',
        };
        const websiteType = typeMap[template.category] || 'landing-page';
        navigate(`/websites/builder?type=${websiteType}&template=${template.id}`);
        toast({
            title: 'Template selected',
            description: `Starting with "${template.title}" template.`,
        });
    };

    const handlePreview = (template: typeof TEMPLATES[0]) => {
        setPreviewTemplate(template);
    };

    const handleCreateBlankSite = () => {
        navigate('/websites/builder');
    };

    return (
        <div className="flex h-full flex-col bg-background">
            {/* Header */}
            <div className="border-b bg-card px-8 py-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Website Templates</h1>
                        <p className="mt-2 text-muted-foreground">
                            Kickstart your project with our collection of premium, professionally designed templates.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => navigate('/websites/landing-pages/templates')}
                            className="shadow-sm"
                        >
                            <Zap className="mr-2 h-5 w-5" />
                            Landing Page Templates
                        </Button>
                        <Button
                            size="lg"
                            className="bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                            onClick={handleCreateBlankSite}
                        >
                            <Layout className="mr-2 h-5 w-5" />
                            Create Blank Site
                        </Button>
                        <div className="relative w-64 ml-2">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search templates..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-8">
                <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
                    <TabsList className="bg-card p-1 shadow-sm">
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
                                {/* Preview Image */}
                                <div className={`relative h-48 w-full ${template.image} p-6 flex items-center justify-center`}>
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
                                        <h3 className="font-semibold text-foreground">{template.title}</h3>
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <Star className="mr-1 h-3 w-3 fill-amber-400 text-amber-400" />
                                            {template.rating}
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
                                        onClick={() => handlePreview(template)}
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        Preview
                                    </Button>
                                    <Button
                                        className="w-full flex-1 gap-2"
                                        onClick={() => handleUseTemplate(template)}
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

            {/* Template Preview Dialog */}
            <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
                <DialogContent className="max-w-6xl w-full h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-slate-50">
                    <DialogHeader className="p-4 border-b bg-white flex-shrink-0 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <DialogTitle className="text-xl">{previewTemplate?.title}</DialogTitle>
                            {previewTemplate?.isNew && (
                                <Badge className="bg-blue-500 hover:bg-blue-600">NEW</Badge>
                            )}
                            <Badge variant="outline" className="font-normal">{previewTemplate?.category}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(null)}>
                                Close
                            </Button>
                            <Button size="sm" onClick={() => {
                                if (previewTemplate) handleUseTemplate(previewTemplate);
                            }}>
                                Use Template <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto bg-white/50 relative">
                        {previewTemplate && WEBSITE_TEMPLATES[String(previewTemplate.id)] ? (
                            <div className="bg-white min-h-full shadow-lg mx-auto max-w-[1400px]">
                                {WEBSITE_TEMPLATES[String(previewTemplate.id)].sections.map((section, index) => (
                                    <WebsiteSectionRenderer key={index} section={section} />
                                ))}
                            </div>
                        ) : (
                            // Fallback for templates not yet in the data definition
                            <div className="p-8">
                                <div className={`relative h-64 w-full rounded-lg ${previewTemplate?.image} p-8 flex items-center justify-center mb-6`}>
                                    <div className="absolute inset-0 bg-black/20 rounded-lg" />
                                    <div className="relative z-10 text-center text-white">
                                        <Monitor className="h-20 w-20 mx-auto mb-4 opacity-80" />
                                        <h2 className="text-2xl font-bold mb-2">{previewTemplate?.title}</h2>
                                        <p className="opacity-80 max-w-md">{previewTemplate?.description}</p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-medium text-gray-900">Preview not available</h3>
                                    <p className="text-gray-500">This template's detailed preview is being generated.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

