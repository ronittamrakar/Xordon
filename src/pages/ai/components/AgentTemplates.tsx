import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Star,
    Download,
    Users,
    Bot,
    Plus,
    ArrowRight,
    ShieldCheck,
    Tag,
    Briefcase,
    Target,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from '@/components/ui/separator';
import { useQueryClient } from '@tanstack/react-query';
import { useAiTemplates, useAiTemplateAction } from '@/hooks/useAiTemplates';
import { useToast } from '@/components/ui/use-toast';
import { AiAgentTemplate } from '@/lib/api';

export const AgentTemplates: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { data: templates = [], isLoading } = useAiTemplates();
    const useTemplateMutation = useAiTemplateAction();

    // Filter States
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
    const [selectedUseCase, setSelectedUseCase] = useState<string | null>(null);
    const [selectedPricing, setSelectedPricing] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSort, setSelectedSort] = useState<'popularity' | 'chronological'>('popularity');

    // UI States
    const [selectedTemplate, setSelectedTemplate] = useState<AiAgentTemplate | null>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [templateForm, setTemplateForm] = useState({
        name: '',
        description: '',
        category: 'Customer Excellence',
        type: 'chat',
        price: 'Free'
    });

    const queryClient = useQueryClient();

    // Aggregations
    const aggregations = useMemo(() => {
        const industries: Record<string, number> = {};
        const useCases: Record<string, number> = {};
        const pricing: Record<string, number> = { 'Free': 0, 'Premium': 0 };

        templates.forEach(t => {
            t.business_niches?.forEach(n => {
                industries[n] = (industries[n] || 0) + 1;
            });
            t.use_cases?.forEach(uc => {
                useCases[uc] = (useCases[uc] || 0) + 1;
            });
            if (t.price) {
                pricing[t.price] = (pricing[t.price] || 0) + 1;
            }
        });

        return {
            industries: Object.entries(industries).sort((a, b) => b[1] - a[1]),
            useCases: Object.entries(useCases).sort((a, b) => b[1] - a[1]),
            pricing: Object.entries(pricing)
        };
    }, [templates]);

    const handleCreateTemplate = () => {
        if (!templateForm.name || !templateForm.description) return;

        const newTemplate: AiAgentTemplate = {
            id: `custom-${Date.now()}`,
            name: templateForm.name,
            description: templateForm.description,
            category: templateForm.category,
            author: 'You (Custom)',
            type: templateForm.type as 'chat' | 'voice' | 'hybrid',
            business_niches: ['Custom'],
            use_cases: ['General'],
            downloads: 0,
            rating: 0,
            reviews_count: 0,
            price: templateForm.price as 'Free' | 'Premium',
            image_url: 'https://cdn-icons-png.flaticon.com/512/10609/10609053.png',
            is_official: false,
            is_verified: false,
            created_at: new Date().toISOString()
        };

        try {
            const existing = JSON.parse(localStorage.getItem('customAiTemplates') || '[]');
            localStorage.setItem('customAiTemplates', JSON.stringify([newTemplate, ...existing]));

            toast({
                title: 'Template Created',
                description: 'Your custom template has been saved locally.',
            });
            setShowCreateDialog(false);
            setTemplateForm({ name: '', description: '', category: 'Customer Excellence', type: 'chat', price: 'Free' });
            queryClient.invalidateQueries({ queryKey: ['ai-templates'] });
        } catch (e) {
            console.error(e);
            toast({
                title: 'Error',
                description: 'Failed to save template locally.',
                variant: 'destructive'
            });
        }
    };

    // Filter templates
    const filteredTemplates = templates.filter(t => {
        const matchesType = selectedType === 'all' || t.type === selectedType;
        const matchesSearch = !searchQuery ||
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesIndustry = !selectedIndustry || t.business_niches?.includes(selectedIndustry);
        const matchesUseCase = !selectedUseCase || t.use_cases?.includes(selectedUseCase);
        const matchesPricing = !selectedPricing || t.price === selectedPricing;

        return matchesType && matchesSearch && matchesIndustry && matchesUseCase && matchesPricing;
    }).sort((a, b) => {
        if (selectedSort === 'popularity') {
            return (b.downloads || 0) - (a.downloads || 0);
        } else {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        }
    });

    const handleUseTemplate = async () => {
        if (!selectedTemplate) return;

        useTemplateMutation.mutate(
            { id: selectedTemplate.id, name: `${selectedTemplate.name} (Copy)` },
            {
                onSuccess: (data) => {
                    toast({
                        title: 'Success',
                        description: `Agent created from template: ${selectedTemplate.name}`,
                    });
                    setSelectedTemplate(null);
                    navigate('/ai/agents');
                },
                onError: () => {
                    toast({
                        title: 'Error',
                        description: 'Failed to use template',
                        variant: 'destructive',
                    });
                },
            }
        );
    };

    const formatDownloads = (downloads: number) => {
        if (downloads >= 1000) {
            return `${(downloads / 1000).toFixed(1)}K`;
        }
        return downloads.toString();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 min-h-[900px]">
            {/* Sidebar Filters */}
            <div className="w-full lg:w-64 shrink-0 space-y-6">
                <Card className="h-full border-none shadow-none bg-transparent lg:bg-card lg:border lg:shadow-sm">
                    <CardHeader className="px-4 py-4 lg:px-6">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Filters</CardTitle>
                            {(selectedIndustry || selectedUseCase || selectedPricing || selectedType !== 'all') && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={() => {
                                        setSelectedType('all');
                                        setSelectedIndustry(null);
                                        setSelectedUseCase(null);
                                        setSelectedPricing(null);
                                        setSearchQuery('');
                                    }}
                                >
                                    Reset
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 lg:px-6 space-y-6">
                        {/* Agent Type */}
                        <div className="space-y-3">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agent Type</Label>
                            <RadioGroup value={selectedType} onValueChange={setSelectedType} className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="all" id="all" />
                                    <Label htmlFor="all" className="font-normal cursor-pointer text-sm">All Agents</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="voice" id="voice" />
                                    <Label htmlFor="voice" className="font-normal cursor-pointer text-sm">Voice Agents</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="chat" id="chat" />
                                    <Label htmlFor="chat" className="font-normal cursor-pointer text-sm">Chat Agents</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <Separator />

                        <Accordion type="multiple" defaultValue={['industries', 'scenarios', 'pricing']} className="w-full">
                            {/* Industries */}
                            <AccordionItem value="industries" className="border-b-0">
                                <AccordionTrigger className="py-2 text-sm hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                        <span>Industries</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-1 pt-1">
                                        {aggregations.industries.slice(0, 10).map(([name, count]) => (
                                            <button
                                                key={name}
                                                onClick={() => setSelectedIndustry(selectedIndustry === name ? null : name)}
                                                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${selectedIndustry === name
                                                        ? 'bg-primary/10 text-primary font-medium'
                                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                    }`}
                                            >
                                                <span className="truncate">{name}</span>
                                                <span className="text-xs opacity-70 bg-muted px-1.5 rounded">{count}</span>
                                            </button>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Use Cases */}
                            <AccordionItem value="scenarios" className="border-b-0">
                                <AccordionTrigger className="py-2 text-sm hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <Target className="h-4 w-4 text-muted-foreground" />
                                        <span>Use Cases</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-1 pt-1">
                                        {aggregations.useCases.slice(0, 10).map(([name, count]) => (
                                            <button
                                                key={name}
                                                onClick={() => setSelectedUseCase(selectedUseCase === name ? null : name)}
                                                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${selectedUseCase === name
                                                        ? 'bg-primary/10 text-primary font-medium'
                                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                    }`}
                                            >
                                                <span className="truncate">{name}</span>
                                                <span className="text-xs opacity-70 bg-muted px-1.5 rounded">{count}</span>
                                            </button>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Pricing */}
                            <AccordionItem value="pricing" className="border-b-0">
                                <AccordionTrigger className="py-2 text-sm hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <Tag className="h-4 w-4 text-muted-foreground" />
                                        <span>Pricing</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-1 pt-1">
                                        {aggregations.pricing.map(([name, count]) => (
                                            <button
                                                key={name}
                                                onClick={() => setSelectedPricing(selectedPricing === name ? null : name)}
                                                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${selectedPricing === name
                                                        ? 'bg-primary/10 text-primary font-medium'
                                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                    }`}
                                            >
                                                <span className="truncate">{name}</span>
                                                <span className="text-xs opacity-70 bg-muted px-1.5 rounded">{count}</span>
                                            </button>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            </div>

            {/* Main Grid Area */}
            <div className="flex-1 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => setShowCreateDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Template
                        </Button>
                        <div className="flex bg-muted rounded-lg p-1">
                            <button
                                onClick={() => setSelectedSort('popularity')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${selectedSort === 'popularity'
                                    ? 'bg-background shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Popularity
                            </button>
                            <button
                                onClick={() => setSelectedSort('chronological')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${selectedSort === 'chronological'
                                    ? 'bg-background shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Chronological
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.length === 0 ? (
                        <div className="col-span-full h-64 flex flex-col items-center justify-center text-center p-8 bg-muted/20 rounded-lg border border-dashed">
                            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No templates found</h3>
                            <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
                            <Button
                                variant="link"
                                onClick={() => {
                                    setSelectedType('all');
                                    setSelectedIndustry(null);
                                    setSelectedUseCase(null);
                                    setSelectedPricing(null);
                                    setSearchQuery('');
                                }}
                            >
                                Clear all filters
                            </Button>
                        </div>
                    ) : (
                        filteredTemplates.map((template) => (
                            <Card
                                key={template.id}
                                className="group hover:border-primary/50 transition-colors cursor-pointer overflow-hidden flex flex-col"
                                onClick={() => setSelectedTemplate(template)}
                            >
                                <div className="aspect-[16/9] bg-muted relative p-6 flex items-center justify-center">
                                    <img src={template.image_url} alt={template.name} className="w-20 h-20 object-contain drop-shadow-md" />
                                    {template.downloads > 0 && (
                                        <Badge className="absolute top-4 right-4 bg-background/90 text-foreground hover:bg-background/100">
                                            {formatDownloads(template.downloads)}
                                        </Badge>
                                    )}
                                    <Badge className="absolute bottom-4 left-4" variant="secondary">
                                        {template.category}
                                    </Badge>
                                </div>
                                <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-lg line-clamp-1">{template.name}</h4>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {template.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 mt-auto border-t">
                                        <div className="flex items-center gap-1">
                                            {template.rating > 0 ? (
                                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                            ) : <Star className="h-4 w-4 text-muted-foreground" />}
                                            <span className="text-sm font-medium">{template.rating > 0 ? template.rating : 'New'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={template.price === 'Free' ? 'secondary' : 'default'} className="font-normal">
                                                {template.price}
                                            </Badge>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Template Details Dialog */}
            <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                            {selectedTemplate?.is_official ? (
                                <Badge variant="outline">Official Template</Badge>
                            ) : (
                                <Badge variant="outline">Custom Template</Badge>
                            )}
                            {selectedTemplate?.is_verified && (
                                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                                    <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                                </Badge>
                            )}
                        </div>
                        <DialogTitle className="text-2xl">{selectedTemplate?.name}</DialogTitle>
                    </DialogHeader>

                    <div className="grid md:grid-cols-2 gap-8 py-4">
                        <div className="space-y-6">
                            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center p-8">
                                <img src={selectedTemplate?.image_url} alt="" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={handleUseTemplate}
                                    disabled={useTemplateMutation.isPending}
                                >
                                    {useTemplateMutation.isPending ? 'Creating...' : 'Use This Template'}
                                </Button>
                                <p className="text-xs text-center text-muted-foreground">Creates a new agent from this template</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">{selectedTemplate?.rating || '-'}</span>
                                    <span className="text-muted-foreground">({selectedTemplate?.reviews_count || 0} reviews)</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <Download className="h-4 w-4" />
                                    <span>{selectedTemplate ? formatDownloads(selectedTemplate.downloads) : '0'} uses</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm">Description</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {selectedTemplate?.description}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm">Use Cases</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTemplate?.use_cases?.map(uc => (
                                        <Badge key={uc} variant="secondary">
                                            {uc}
                                        </Badge>
                                    ))}
                                    {(!selectedTemplate?.use_cases || selectedTemplate.use_cases.length === 0) && (
                                        <span className="text-xs text-muted-foreground">General use</span>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block text-xs mb-1">Author</span>
                                    <span className="font-medium">{selectedTemplate?.author}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs mb-1">Category</span>
                                    <span className="font-medium">{selectedTemplate?.category}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs mb-1">Industries</span>
                                    <span className="font-medium">{selectedTemplate?.business_niches?.slice(0, 2).join(', ') || 'General'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs mb-1">Version</span>
                                    <span className="font-medium">v1.4.2</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create Template Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Custom Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Template Name</Label>
                            <Input
                                placeholder="e.g. My Sales Bot"
                                value={templateForm.name}
                                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                placeholder="Describe what this agent does..."
                                value={templateForm.description}
                                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <RadioGroup
                                    value={templateForm.type}
                                    onValueChange={(val) => setTemplateForm({ ...templateForm, type: val })}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="chat" id="create-chat" />
                                        <Label htmlFor="create-chat">Chat</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="voice" id="create-voice" />
                                        <Label htmlFor="create-voice">Voice</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Input
                                    value={templateForm.category}
                                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreateTemplate} disabled={!templateForm.name || !templateForm.description}>
                            Save Template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
