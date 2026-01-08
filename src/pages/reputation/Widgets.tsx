import React, { useState, useEffect } from 'react';
import SEO from '@/components/SEO';
import { ModuleGuard } from '@/components/ModuleGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Layout,
    Eye,
    Code,
    Trash2,
    RefreshCw,
    ExternalLink,
    Smartphone,
    Monitor,
    CheckCircle2,
    Copy,
    Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import reputationApi, { ReviewWidget } from '@/services/reputationApi';
import WidgetBuilder from '@/components/WidgetBuilder';

export default function ReputationWidgets() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [widgets, setWidgets] = useState<ReviewWidget[]>([]);
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingWidget, setEditingWidget] = useState<ReviewWidget | undefined>(undefined);

    useEffect(() => {
        loadWidgets();
    }, []);

    const loadWidgets = async () => {
        try {
            setLoading(true);
            const data = await reputationApi.getWidgets();
            setWidgets(data);
        } catch (error) {
            console.error('Failed to load widgets:', error);
            toast({
                title: 'Error',
                description: 'Failed to load review widgets',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingWidget(undefined);
        setShowBuilder(true);
    };

    const handleEdit = (widget: ReviewWidget) => {
        setEditingWidget(widget);
        setShowBuilder(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this widget?')) return;

        try {
            await reputationApi.deleteWidget(id);
            toast({
                title: 'Deleted',
                description: 'Widget removed successfully'
            });
            loadWidgets();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete widget'
            });
        }
    };

    const handleCopyCode = (id: number) => {
        const code = `<script src="https://app.xordon.com/widget.js" data-id="${id}"></script><div id="xordon-reviews-${id}"></div>`;
        navigator.clipboard.writeText(code);
        toast({
            title: 'Code Copied',
            description: 'The embed code has been copied to your clipboard'
        });
    };

    if (showBuilder) {
        return (
            <ModuleGuard moduleKey="reputation">
                <WidgetBuilder
                    widget={editingWidget}
                    onClose={() => setShowBuilder(false)}
                    onSave={() => {
                        setShowBuilder(false);
                        loadWidgets();
                    }}
                />
            </ModuleGuard>
        );
    }

    if (loading && widgets.length === 0) {
        return (
            <ModuleGuard moduleKey="reputation">
                <div className="flex items-center justify-center min-h-[400px]">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
            </ModuleGuard>
        );
    }

    return (
        <ModuleGuard moduleKey="reputation">
            <SEO title="Review Widgets" description="Display reviews on your website" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold font-heading">Review Widgets</h1>
                        <p className="text-muted-foreground">Showcase your brand reviews on any website or funnels</p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Widget
                    </Button>
                </div>

                {/* Info Box */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                        <Layout className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-primary mb-1">Boost Your Social Proof</h3>
                        <p className="text-sm text-muted-foreground max-w-2xl">
                            Embedding reviews on your landing pages and checkout forms can increase conversion rates by up to 270%.
                            Our widgets update automatically as new reviews come in.
                        </p>
                    </div>
                </div>

                {/* Widgets Grid */}
                {widgets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-2xl border border-dashed text-center">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
                            <Code className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No widgets yet</h3>
                        <p className="text-muted-foreground max-w-sm mb-8">
                            Create your first review widget to display your 5-star ratings on your website.
                        </p>
                        <Button onClick={handleCreate}>
                            <Plus className="h-4 w-4 mr-2" />
                            Build My First Widget
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {widgets.map((widget) => (
                            <Card key={widget.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
                                <CardHeader className="bg-muted/30 pb-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg mb-1">{widget.name}</CardTitle>
                                            <CardDescription className="capitalize">
                                                {widget.type} Layout
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className="bg-background">
                                            {widget.settings?.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="aspect-video bg-muted/20 rounded-lg flex items-center justify-center border border-dashed relative overflow-hidden group">
                                        {/* Preview Placeholder Graphics */}
                                        <div className="absolute inset-0 p-4 space-y-2 opacity-20 pointer-events-none">
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-2 w-2 rounded-full bg-yellow-400" />)}
                                            </div>
                                            <div className="h-2 w-3/4 bg-foreground/20 rounded" />
                                            <div className="h-2 w-1/2 bg-foreground/10 rounded" />
                                        </div>
                                        <Monitor className="h-8 w-8 text-muted-foreground/30" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="outline" size="sm" onClick={() => handleEdit(widget)}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                Preview
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between border-t p-4">
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleCopyCode(widget.id!)} title="Get Embed Code">
                                            <Code className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(widget)} title="Edit Configuration">
                                            <Layout className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(widget.id!)} title="Delete Widget">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}

                        {/* Quick Action Card */}
                        <Card
                            className="flex flex-col items-center justify-center h-full border-dashed cursor-pointer hover:bg-muted/20 transition-colors"
                            onClick={handleCreate}
                        >
                            <Plus className="h-10 w-10 text-muted-foreground mb-2" />
                            <p className="font-medium">Create Widget</p>
                        </Card>
                    </div>
                )}
            </div>
        </ModuleGuard>
    );
}
