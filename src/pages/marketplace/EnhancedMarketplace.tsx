import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Package,
    Plus,
    Download,
    Upload,
    Star,
    TrendingUp,
    Users,
    Zap,
    Search,
    Grid3x3,
    List,
    Eye,
    Heart,
    Share2,
    CheckCircle2,
    Crown,
    ShoppingCart,
    DollarSign,
    RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { MarketplaceNav } from '@/components/marketplace/MarketplaceNav';
import { getTemplates, installTemplate, likeTemplate, uploadTemplate, MarketplaceTemplate } from '@/services/leadMarketplaceApi';

const categories = [
    { value: 'all', label: 'All Templates', icon: <Grid3x3 className="h-4 w-4" /> },
    { value: 'automation', label: 'Automations', icon: <Zap className="h-4 w-4" /> },
    { value: 'funnel', label: 'Funnels', icon: <TrendingUp className="h-4 w-4" /> },
    { value: 'form', label: 'Forms', icon: <List className="h-4 w-4" /> },
    { value: 'email', label: 'Email Campaigns', icon: <Package className="h-4 w-4" /> },
    { value: 'website', label: 'Websites', icon: <Package className="h-4 w-4" /> },
    { value: 'chatbot', label: 'Chatbots', icon: <Package className="h-4 w-4" /> },
    { value: 'workflow', label: 'Workflows', icon: <Package className="h-4 w-4" /> }
];

export default function EnhancedMarketplace() {
    const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedType, setSelectedType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedTemplate, setSelectedTemplate] = useState<MarketplaceTemplate | null>(null);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [uploadForm, setUploadForm] = useState({
        name: '',
        description: '',
        category: 'automation' as MarketplaceTemplate['category'],
        price: 0,
        tags: '',
        features: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (selectedCategory !== 'all') params.category = selectedCategory;
            if (selectedType !== 'all') params.type = selectedType;
            if (searchQuery) params.search = searchQuery;

            const res = await getTemplates(params);
            if (res.data.success) {
                setTemplates(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchData();
        }, 300); // Debounce search
        return () => clearTimeout(timeoutId);
    }, [selectedCategory, selectedType, searchQuery]);

    const handleInstall = async (template: MarketplaceTemplate) => {
        if (template.type === 'premium' && !template.isPurchased) {
            toast.info(`This template costs $${template.price}. Redirecting to checkout...`);
            // Implement purchase flow
            return;
        }

        toast.promise(installTemplate(template.id), {
            loading: `Installing "${template.name}"...`,
            success: 'Template installed successfully!',
            error: 'Failed to install template'
        });
    };

    const handleLike = async (templateId: string) => {
        try {
            const res = await likeTemplate(templateId);
            if (res.data.success) {
                setTemplates(templates.map(t =>
                    t.id === templateId ? { ...t, likes: t.likes + 1 } : t
                ));
                toast.success('Added to favorites');
            }
        } catch (error) {
            toast.error('Failed to like template');
        }
    };

    const handleUpload = async () => {
        setUploading(true);
        try {
            const res = await uploadTemplate({
                name: uploadForm.name,
                description: uploadForm.description,
                category: uploadForm.category,
                price: uploadForm.price,
                tags: uploadForm.tags.split(',').map(t => t.trim()),
                features: uploadForm.features.split(',').map(f => f.trim()),
                type: 'community' // Default to community for user uploads
            });

            if (res.data.success) {
                toast.success('Template uploaded successfully!');
                setShowUploadDialog(false);
                setUploadForm({
                    name: '',
                    description: '',
                    category: 'automation',
                    price: 0,
                    tags: '',
                    features: ''
                });
                fetchData();
            }
        } catch (error) {
            toast.error('Failed to upload template');
        } finally {
            setUploading(false);
        }
    };

    const TemplateCard = ({ template }: { template: MarketplaceTemplate }) => (
        <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer h-full flex flex-col" onClick={() => setSelectedTemplate(template)}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {template.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={
                                template.type === 'official' ? 'default' :
                                    template.type === 'premium' ? 'secondary' : 'outline'
                            } className="gap-1">
                                {template.type === 'official' && <CheckCircle2 className="h-3 w-3" />}
                                {template.type === 'premium' && <Crown className="h-3 w-3" />}
                                {template.type === 'community' && <Users className="h-3 w-3" />}
                                {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                            </Badge>
                            {template.type === 'premium' && (
                                <Badge variant="outline" className="gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    ${template.price}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleLike(template.id);
                        }}
                    >
                        <Heart className="h-4 w-4" />
                    </Button>
                </div>
                <CardDescription className="line-clamp-2">
                    {template.description}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 flex-grow">
                <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                        </Badge>
                    ))}
                    {template.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                            +{template.tags.length - 3}
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{template.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        <span>{template.downloads.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{template.likes.toLocaleString()}</span>
                    </div>
                </div>

                <Separator />

                <div className="text-xs text-muted-foreground">
                    By {template.author}
                </div>
            </CardContent>

            <CardFooter className="pt-0 gap-2 mt-auto">
                <Button
                    className="flex-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleInstall(template);
                    }}
                >
                    {template.type === 'premium' && !template.isPurchased ? (
                        <>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Purchase
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4 mr-2" />
                            Install
                        </>
                    )}
                </Button>
                <Button
                    variant="outline"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTemplate(template);
                    }}
                >
                    <Eye className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );

    return (
        <div className="container mx-auto py-6 space-y-6">
            <MarketplaceNav />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Template Marketplace</h1>
                    <p className="text-muted-foreground">
                        Browse and install pre-built templates to accelerate your workflow
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchData}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Template
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Upload Template</DialogTitle>
                                <DialogDescription>
                                    Share your template with the community
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label>Template Name</Label>
                                    <Input
                                        value={uploadForm.name}
                                        onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                                        placeholder="My Awesome Template"
                                    />
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <Textarea
                                        value={uploadForm.description}
                                        onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                                        placeholder="Describe what your template does..."
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Category</Label>
                                        <Select
                                            value={uploadForm.category}
                                            onValueChange={(v: any) => setUploadForm({ ...uploadForm, category: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.filter(c => c.value !== 'all').map(cat => (
                                                    <SelectItem key={cat.value} value={cat.value}>
                                                        <div className="flex items-center gap-2">
                                                            {cat.icon}
                                                            {cat.label}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Price ($)</Label>
                                        <Input
                                            type="number"
                                            value={uploadForm.price}
                                            onChange={(e) => setUploadForm({ ...uploadForm, price: parseFloat(e.target.value) || 0 })}
                                            placeholder="0 for free"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Tags (comma-separated)</Label>
                                    <Input
                                        value={uploadForm.tags}
                                        onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                                        placeholder="automation, email, sales"
                                    />
                                </div>
                                <div>
                                    <Label>Features (comma-separated)</Label>
                                    <Textarea
                                        value={uploadForm.features}
                                        onChange={(e) => setUploadForm({ ...uploadForm, features: e.target.value })}
                                        placeholder="Email sequences, SMS follow-ups, Lead scoring"
                                        rows={2}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleUpload} disabled={!uploadForm.name || !uploadForm.description || uploading}>
                                        {uploading ? 'Uploading...' : 'Upload Template'}
                                    </Button>
                                </DialogFooter>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{templates.length}</div>}
                        <p className="text-xs text-muted-foreground mt-1">Available to install</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Official</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-16" /> : (
                            <div className="text-2xl font-bold text-blue-600">
                                {templates.filter(t => t.type === 'official').length}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">By Xordon Team</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Premium</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-16" /> : (
                            <div className="text-2xl font-bold text-purple-600">
                                {templates.filter(t => t.type === 'premium').length}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Professional templates</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Community</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-16" /> : (
                            <div className="text-2xl font-bold text-green-600">
                                {templates.filter(t => t.type === 'community').length}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">User-contributed</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search templates..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                        <div className="flex items-center gap-2">
                                            {cat.icon}
                                            {cat.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="official">Official</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                                <SelectItem value="community">Community</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                            <Button
                                variant={viewMode === 'grid' ? 'default' : 'outline'}
                                size="icon"
                                onClick={() => setViewMode('grid')}
                            >
                                <Grid3x3 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'default' : 'outline'}
                                size="icon"
                                onClick={() => setViewMode('list')}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Templates Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-80 border rounded-lg p-6 space-y-4">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-32 w-full" />
                            <div className="flex gap-2">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <Skeleton className="h-8 w-8 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                    {templates.map(template => (
                        <TemplateCard key={template.id} template={template} />
                    ))}
                </div>
            )}

            {!loading && templates.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">No templates found matching your criteria</p>
                    </CardContent>
                </Card>
            )}

            {/* Template Preview Dialog */}
            <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {selectedTemplate && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-2xl">{selectedTemplate.name}</DialogTitle>
                                <DialogDescription>{selectedTemplate.description}</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <Badge variant={
                                        selectedTemplate.type === 'official' ? 'default' :
                                            selectedTemplate.type === 'premium' ? 'secondary' : 'outline'
                                    }>
                                        {selectedTemplate.type.charAt(0).toUpperCase() + selectedTemplate.type.slice(1)}
                                    </Badge>
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        <span className="font-semibold">{selectedTemplate.rating}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Download className="h-4 w-4" />
                                        <span>{selectedTemplate.downloads.toLocaleString()} downloads</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-2">Features</h3>
                                    <ul className="grid grid-cols-2 gap-2">
                                        {selectedTemplate.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-sm">
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-2">Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTemplate.tags.map(tag => (
                                            <Badge key={tag} variant="outline">{tag}</Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button className="flex-1" onClick={() => handleInstall(selectedTemplate)}>
                                        {selectedTemplate.type === 'premium' && !selectedTemplate.isPurchased ? (
                                            <>
                                                <ShoppingCart className="h-4 w-4 mr-2" />
                                                Purchase for ${selectedTemplate.price}
                                            </>
                                        ) : (
                                            <>
                                                <Download className="h-4 w-4 mr-2" />
                                                Install Template
                                            </>
                                        )}
                                    </Button>
                                    <Button variant="outline">
                                        <Share2 className="h-4 w-4 mr-2" />
                                        Share
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
