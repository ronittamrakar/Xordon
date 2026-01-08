import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Info, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Star } from 'lucide-react';
import reputationApi, { ReviewWidget } from '@/services/reputationApi';
import { useToast } from '@/hooks/use-toast';

interface WidgetBuilderProps {
    widget?: ReviewWidget;
    onClose: () => void;
    onSave: () => void;
}

export default function WidgetBuilder({ widget, onClose, onSave }: WidgetBuilderProps) {
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState(widget?.name || 'My Review Widget');
    const [copiedCode, setCopiedCode] = useState(false);
    const [config, setConfig] = useState(widget?.design_settings || {
        reviewSource: 'all',
        widgetType: 'grid',
        maxReviews: 20,
        minRating: 'any',
        poweredBy: true,
        theme: 'light',
        font: 'Roboto',
        colors: {
            widgetPrimary: '#000000',
            widgetSecondary: '#6B7280',
            widgetBackground: '#FFFFFF',
            reviewPrimary: '#000000',
            reviewSecondary: '#6B7280',
            reviewBackground: '#FFFFFF',
            starRating: '#FFA500',
            border: '#E5E7EB',
            aiSummary: '#3B82F6',
            writeReviewButton: '#2563EB',
        },
        aiSummary: {
            enabled: false,
            type: 'short',
            position: 'top',
        },
        reviewElements: {
            displayDate: true,
            displayReviewerIcon: true,
            excludeNoDescription: false,
        },
    });

    useEffect(() => {
        if (widget) {
            setName(widget.name);
            if (widget.design_settings) {
                setConfig(widget.design_settings);
            }
        }
    }, [widget]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const widgetData = {
                name,
                type: config.widgetType,
                platforms: config.reviewSource === 'all' ? ['google', 'facebook', 'yelp'] : [config.reviewSource],
                min_rating: config.minRating === 'any' ? 0 : parseInt(config.minRating),
                max_reviews: config.maxReviews,
                show_ai_summary: config.aiSummary.enabled,
                design_settings: config,
                is_active: true
            };

            if (widget?.id) {
                await reputationApi.updateWidget(widget.id, widgetData);
                toast({ title: 'Success', description: 'Widget updated successfully' });
            } else {
                await reputationApi.createWidget(widgetData);
                toast({ title: 'Success', description: 'Widget created successfully' });
            }
            onSave();
        } catch (error) {
            console.error('Failed to save widget:', error);
            toast({
                title: 'Error',
                description: 'Failed to save widget configuration',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    };

    const embedCode = widget?.id
        ? `<script src="https://app.xordon.com/widget.js" data-id="${widget.id}"></script><div id="xordon-reviews-${widget.id}"></div>`
        : 'Save the widget first to generate embed code';

    const handleCopyCode = () => {
        if (!widget?.id) {
            toast({ title: 'Save Required', description: 'Please save the widget first' });
            return;
        }
        navigator.clipboard.writeText(embedCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    // if (!isOpen) return null; // Removed because isOpen is not passed

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="border-b px-6 py-4 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold">Widget Builder</h2>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-64"
                                placeholder="Widget Name"
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">Customize your review widget</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <RotateCcw className="w-4 h-4 mr-2 animate-spin" />}
                            Save
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden">
                    <div className="h-full grid lg:grid-cols-[1fr_450px]">
                        {/* Preview Area */}
                        <div className="border-r p-8 overflow-auto bg-muted/30">
                            <div className="max-w-3xl mx-auto">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Preview</h3>
                                    <div className="flex items-center gap-2">
                                        {/* Preview controls */}
                                    </div>
                                </div>

                                {/* Widget Preview */}
                                <Card className="shadow-lg transition-all duration-300" style={{ fontFamily: config.font }}>
                                    <CardContent className="p-6" style={{ backgroundColor: config.colors.widgetBackground }}>
                                        <div className="text-center mb-6">
                                            <h3 className="text-lg font-semibold mb-2" style={{ color: config.colors.widgetPrimary }}>What our clients say about us</h3>
                                            <div className="flex items-center justify-center gap-2 mb-1">
                                                <div className="flex">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className="h-5 w-5 fill-current"
                                                            style={{
                                                                color: config.colors.starRating,
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-2xl font-bold" style={{ color: config.colors.widgetPrimary }}>5.00</span>
                                            </div>
                                            <p className="text-sm" style={{ color: config.colors.widgetSecondary }}>Based on 124 reviews</p>
                                        </div>
                                        <Button
                                            className="w-full"
                                            style={{ backgroundColor: config.colors.writeReviewButton, color: '#fff' }}
                                        >
                                            Write a review
                                        </Button>
                                        {config.poweredBy && (
                                            <p className="text-xs text-center mt-4" style={{ color: config.colors.widgetSecondary }}>
                                                Powered by Xordon
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Settings Panel */}
                        <div className="overflow-auto">
                            <Tabs defaultValue="general" className="h-full">
                                <div className="border-b px-4 py-2">
                                    <TabsList className="w-full grid grid-cols-4">
                                        <TabsTrigger value="general">
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <rect x="3" y="3" width="7" height="7" />
                                                <rect x="14" y="3" width="7" height="7" />
                                                <rect x="14" y="14" width="7" height="7" />
                                                <rect x="3" y="14" width="7" height="7" />
                                            </svg>
                                        </TabsTrigger>
                                        <TabsTrigger value="design">
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                        </TabsTrigger>
                                        <TabsTrigger value="ai">
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                                            </svg>
                                        </TabsTrigger>
                                        <TabsTrigger value="code">
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <polyline points="16 18 22 12 16 6" />
                                                <polyline points="8 6 2 12 8 18" />
                                            </svg>
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <div className="p-6">
                                    {/* General Settings */}
                                    <TabsContent value="general" className="space-y-6 mt-0">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Review Source</Label>
                                                <Select
                                                    value={config.reviewSource}
                                                    onValueChange={(value) =>
                                                        setConfig({ ...config, reviewSource: value })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select review source" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Sources</SelectItem>
                                                        <SelectItem value="google">Google</SelectItem>
                                                        <SelectItem value="yelp">Yelp</SelectItem>
                                                        <SelectItem value="facebook">Facebook</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Widget Type</Label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {[
                                                        { value: 'list', label: 'List', icon: '☰' },
                                                        { value: 'grid', label: 'Grid', icon: '⊞' },
                                                        { value: 'masonry', label: 'Masonry', icon: '▦' },
                                                        { value: 'carousel', label: 'Carousel', icon: '⟲' },
                                                        { value: 'slider', label: 'Slider', icon: '⇄' },
                                                        { value: 'flash', label: 'Flash', icon: '⚡' },
                                                        { value: 'legacy', label: 'Legacy', icon: '⚙' },
                                                    ].map((type) => (
                                                        <Button
                                                            key={type.value}
                                                            variant={config.widgetType === type.value ? 'default' : 'outline'}
                                                            className="flex-col h-auto py-3"
                                                            onClick={() => setConfig({ ...config, widgetType: type.value })}
                                                        >
                                                            <span className="text-2xl mb-1">{type.icon}</span>
                                                            <span className="text-xs">{type.label}</span>
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Max number of Reviews</Label>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() =>
                                                            setConfig({
                                                                ...config,
                                                                maxReviews: Math.max(1, config.maxReviews - 1),
                                                            })
                                                        }
                                                    >
                                                        −
                                                    </Button>
                                                    <Input
                                                        type="number"
                                                        value={config.maxReviews}
                                                        onChange={(e) =>
                                                            setConfig({ ...config, maxReviews: parseInt(e.target.value) || 20 })
                                                        }
                                                        className="text-center"
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() =>
                                                            setConfig({ ...config, maxReviews: config.maxReviews + 1 })
                                                        }
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Label>Minimum Ratings</Label>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <Info className="h-4 w-4 text-muted-foreground" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Only show reviews with this rating or higher</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                                <Select
                                                    value={config.minRating}
                                                    onValueChange={(value) => setConfig({ ...config, minRating: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="any">
                                                            <div className="flex items-center gap-2">
                                                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                                Any Rating
                                                            </div>
                                                        </SelectItem>
                                                        {[5, 4, 3, 2, 1].map((rating) => (
                                                            <SelectItem key={rating} value={rating.toString()}>
                                                                <div className="flex items-center gap-2">
                                                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                                    {rating}+ Stars
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <Label>Powered By</Label>
                                                <Switch
                                                    checked={config.poweredBy}
                                                    onCheckedChange={(checked) =>
                                                        setConfig({ ...config, poweredBy: checked })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Design Settings */}
                                    <TabsContent value="design" className="space-y-6 mt-0">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Theme</Label>
                                                <RadioGroup
                                                    value={config.theme}
                                                    onValueChange={(value) => setConfig({ ...config, theme: value })}
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="light" id="light" />
                                                        <Label htmlFor="light">Light</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="dark" id="dark" />
                                                        <Label htmlFor="dark">Dark</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="custom" id="custom" />
                                                        <Label htmlFor="custom">Custom</Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Font</Label>
                                                <Select
                                                    value={config.font}
                                                    onValueChange={(value) => setConfig({ ...config, font: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Roboto">Roboto</SelectItem>
                                                        <SelectItem value="Inter">Inter</SelectItem>
                                                        <SelectItem value="Arial">Arial</SelectItem>
                                                        <SelectItem value="Georgia">Georgia</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <Separator />

                                            <div className="space-y-4">
                                                <h4 className="font-semibold">Color</h4>
                                                {[
                                                    { key: 'widgetPrimary', label: 'Widget Primary Color' },
                                                    { key: 'widgetSecondary', label: 'Widget Secondary Color' },
                                                    { key: 'widgetBackground', label: 'Widget Background Color' },
                                                    { key: 'reviewPrimary', label: 'Review Primary Color' },
                                                    { key: 'reviewSecondary', label: 'Review Secondary Color' },
                                                    { key: 'reviewBackground', label: 'Review Background Color' },
                                                    { key: 'starRating', label: 'Star Rating Color' },
                                                    { key: 'border', label: 'Border Color' },
                                                    { key: 'aiSummary', label: 'AI Summary' },
                                                    { key: 'writeReviewButton', label: 'Write a Review Button Color' },
                                                ].map((color) => (
                                                    <div key={color.key} className="flex items-center justify-between">
                                                        <Label className="text-sm">{color.label}</Label>
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="color"
                                                                value={config.colors[color.key as keyof typeof config.colors]}
                                                                onChange={(e) =>
                                                                    setConfig({
                                                                        ...config,
                                                                        colors: { ...config.colors, [color.key]: e.target.value },
                                                                    })
                                                                }
                                                                className="w-12 h-8 p-1 cursor-pointer"
                                                            />
                                                            <div
                                                                className="w-8 h-8 rounded border"
                                                                style={{
                                                                    backgroundColor:
                                                                        config.colors[color.key as keyof typeof config.colors],
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* AI Summary Settings */}
                                    <TabsContent value="ai" className="space-y-6 mt-0">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label>AI Summary</Label>
                                                <Switch
                                                    checked={config.aiSummary.enabled}
                                                    onCheckedChange={(checked) =>
                                                        setConfig({
                                                            ...config,
                                                            aiSummary: { ...config.aiSummary, enabled: checked },
                                                        })
                                                    }
                                                />
                                            </div>

                                            {config.aiSummary.enabled && (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label>Summary Type</Label>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {[
                                                                { value: 'short', label: 'Short' },
                                                                { value: 'detailed', label: 'Detailed' },
                                                                { value: 'action', label: 'Action Points' },
                                                            ].map((type) => (
                                                                <Button
                                                                    key={type.value}
                                                                    variant={
                                                                        config.aiSummary.type === type.value ? 'default' : 'outline'
                                                                    }
                                                                    className="flex-col h-auto py-3"
                                                                    onClick={() =>
                                                                        setConfig({
                                                                            ...config,
                                                                            aiSummary: { ...config.aiSummary, type: type.value },
                                                                        })
                                                                    }
                                                                >
                                                                    <span className="text-xs">{type.label}</span>
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Summary Position</Label>
                                                        <Select
                                                            value={config.aiSummary.position}
                                                            onValueChange={(value) =>
                                                                setConfig({
                                                                    ...config,
                                                                    aiSummary: { ...config.aiSummary, position: value },
                                                                })
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="top">Top</SelectItem>
                                                                <SelectItem value="bottom">Bottom</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </>
                                            )}

                                            <Separator />

                                            <div className="space-y-4">
                                                <h4 className="font-semibold">Review Elements</h4>
                                                <div className="space-y-3">
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            id="displayDate"
                                                            checked={config.reviewElements.displayDate}
                                                            onChange={(e) =>
                                                                setConfig({
                                                                    ...config,
                                                                    reviewElements: {
                                                                        ...config.reviewElements,
                                                                        displayDate: e.target.checked,
                                                                    },
                                                                })
                                                            }
                                                            className="rounded"
                                                        />
                                                        <Label htmlFor="displayDate">Display Date</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            id="displayReviewerIcon"
                                                            checked={config.reviewElements.displayReviewerIcon}
                                                            onChange={(e) =>
                                                                setConfig({
                                                                    ...config,
                                                                    reviewElements: {
                                                                        ...config.reviewElements,
                                                                        displayReviewerIcon: e.target.checked,
                                                                    },
                                                                })
                                                            }
                                                            className="rounded"
                                                        />
                                                        <Label htmlFor="displayReviewerIcon">Display Reviewer Icon</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            id="excludeNoDescription"
                                                            checked={config.reviewElements.excludeNoDescription}
                                                            onChange={(e) =>
                                                                setConfig({
                                                                    ...config,
                                                                    reviewElements: {
                                                                        ...config.reviewElements,
                                                                        excludeNoDescription: e.target.checked,
                                                                    },
                                                                })
                                                            }
                                                            className="rounded"
                                                        />
                                                        <Label htmlFor="excludeNoDescription">
                                                            Exclude review containing no description
                                                        </Label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Embed Code */}
                                    <TabsContent value="code" className="space-y-6 mt-0">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label>Embed Code To Website</Label>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleCopyCode}
                                                        className="gap-2"
                                                    >
                                                        {copiedCode ? (
                                                            <>
                                                                <Check className="h-4 w-4" />
                                                                Copied!
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="h-4 w-4" />
                                                                Copy Code
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                                                    {embedCode}
                                                </pre>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
