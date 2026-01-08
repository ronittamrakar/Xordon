import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Plus, Search, Layout, Rocket, Megaphone,
    Code, ClipboardList, Briefcase, Filter,
    Users, Clock, Star, ArrowRight, Loader2
} from 'lucide-react';
import SEO from '@/components/SEO';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const iconMap: Record<string, any> = {
    Code,
    Megaphone,
    Users,
    Rocket,
    Layout,
    ClipboardList,
};

const ProjectTemplates: React.FC = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isCreating, setIsCreating] = useState<string | null>(null);

    // Personalization Dialog
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [customTitle, setCustomTitle] = useState('');
    const [customColor, setCustomColor] = useState('#3b82f6');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const categories = ['All', 'Tech', 'Marketing', 'Service', 'Product', 'Content', 'Operations'];

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const response = await api.projectTemplates.getAll();
            setTemplates(response.items || []);
        } catch (error) {
            console.error('Failed to load templates:', error);
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPersonalize = (template: any) => {
        setSelectedTemplate(template);
        setCustomTitle(template.name);
        setCustomColor(template.color || '#3b82f6');
        setIsDialogOpen(true);
    };

    const handleUseTemplate = async () => {
        if (!selectedTemplate) return;
        try {
            setIsCreating(selectedTemplate.id);
            const response = await api.projectTemplates.use(parseInt(selectedTemplate.id), {
                title: customTitle,
                color: customColor
            });
            toast.success(`Project "${customTitle}" created successfully`);
            setIsDialogOpen(false);
            navigate(`/projects/${response.projectId}`);
        } catch (error) {
            console.error('Failed to create project from template:', error);
            toast.error('Failed to create project from template');
        } finally {
            setIsCreating(null);
        }
    };

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getIcon = (iconName: string) => {
        return iconMap[iconName] || Briefcase;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 bg-slate-50/30 dark:bg-slate-950/30 min-h-screen">
            <SEO title="Project Templates" description="Choose from pre-built project structures to jumpstart your work." />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Templates Library</h1>
                    <p className="text-muted-foreground text-lg">Pre-configured workflows to jumpstart your projects</p>
                </div>
                <Button size="lg" className="shadow-lg shadow-blue-500/20">
                    <Plus className="h-5 w-5 mr-2" />
                    Custom Template
                </Button>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-11"
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            {categories.map(cat => (
                                <Button
                                    key={cat}
                                    variant={selectedCategory === cat ? 'default' : 'outline'}
                                    onClick={() => setSelectedCategory(cat)}
                                    size="sm"
                                    className="whitespace-nowrap rounded-full"
                                >
                                    {cat}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map(template => {
                    const Icon = getIcon(template.icon);
                    return (
                        <Card key={template.id} className="group hover:shadow-xl transition-all duration-300 border-none ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden flex flex-col">
                            <div className="h-2" style={{ backgroundColor: template.color || '#3b82f6' }}></div>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-opacity-50 transition-colors">
                                        <Icon size={24} style={{ color: template.color || '#3b82f6' }} />
                                    </div>
                                    {template.is_popular === 1 && (
                                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none">
                                            <Star className="h-3 w-3 mr-1 fill-current" />
                                            Popular
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">{template.name}</CardTitle>
                                <CardDescription className="line-clamp-2 mt-1">{template.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <ClipboardList className="h-4 w-4" />
                                        <span>{template.tasks_count || 0} tasks</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span>{template.estimated_duration || 'N/A'}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                <Button
                                    className="w-full justify-between"
                                    variant="ghost"
                                    disabled={isCreating === String(template.id)}
                                    onClick={() => handleOpenPersonalize(template)}
                                >
                                    {isCreating === String(template.id) ? (
                                        <>
                                            Creating project...
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        </>
                                    ) : (
                                        <>
                                            Use this template
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {/* Use Template Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Personalize Project</DialogTitle>
                        <DialogDescription>
                            Customize your project name and theme before creating it.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="projectTitle">Project Name</Label>
                            <Input
                                id="projectTitle"
                                value={customTitle}
                                onChange={(e) => setCustomTitle(e.target.value)}
                                placeholder="Enter project name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="projectColor">Theme Color</Label>
                            <div className="flex gap-4 items-center">
                                <Input
                                    id="projectColor"
                                    type="color"
                                    value={customColor}
                                    onChange={(e) => setCustomColor(e.target.value)}
                                    className="w-20 h-10 p-1"
                                />
                                <span className="text-sm font-mono uppercase">{customColor}</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUseTemplate} disabled={!!isCreating}>
                            {isCreating ? 'Creating...' : 'Create Project'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {filteredTemplates.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No templates match your search</p>
                    <Button variant="link" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>
                        Clear all filters
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ProjectTemplates;
