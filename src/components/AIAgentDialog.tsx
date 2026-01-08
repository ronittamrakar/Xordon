import React, { useState } from 'react';
import { X, Info, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AIAgentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    template?: {
        id: string;
        name: string;
        instructions: string;
        tone?: string;
    };
}

const toneOptions = [
    { value: 'no-tone', label: 'No Tone', icon: '✕', color: 'destructive' },
    { value: 'professional', label: 'Professional', icon: '💼', color: 'default' },
    { value: 'funny', label: 'Funny', icon: '😄', color: 'default' },
    { value: 'empathetic', label: 'Empathetic', icon: '❤️', color: 'default' },
    { value: 'optimistic', label: 'Optimistic', icon: '🌟', color: 'default' },
    { value: 'playful', label: 'Playful', icon: '🎮', color: 'default' },
    { value: 'grateful', label: 'Grateful', icon: '🙏', color: 'default' },
    { value: 'friendly', label: 'Friendly', icon: '😊', color: 'default' },
    { value: 'concise', label: 'Concise', icon: '📝', color: 'default' },
    { value: 'inquisitive', label: 'Inquisitive', icon: '🔍', color: 'default' },
    { value: 'solution-oriented', label: 'Solution Oriented', icon: '🎯', color: 'default' },
];

export default function AIAgentDialog({ isOpen, onClose, template }: AIAgentDialogProps) {
    const [formData, setFormData] = useState({
        agentName: template?.name || '',
        agentInstructions:
            template?.instructions ||
            'Respond to the review by thanking the customer for their feedback, inviting the customer to continue the conversation privately if needed, and reaffirm your commitment to ensuring their satisfaction and a positive future experience. Keep the response in 2 lines or under.',
        tones: template?.tone ? [template.tone] : [],
        language: 'dynamic',
        languageRegion: 'en-US',
        reviewSource: 'all',
        reviewType: '2-stars-below',
        footer: 'Example: Thank you!',
    });

    const [previewLoading, setPreviewLoading] = useState(false);

    const toggleTone = (tone: string) => {
        if (formData.tones.includes(tone)) {
            setFormData({
                ...formData,
                tones: formData.tones.filter((t) => t !== tone),
            });
        } else if (formData.tones.length < 2) {
            setFormData({
                ...formData,
                tones: [...formData.tones, tone],
            });
        }
    };

    const handleGenerate = () => {
        setPreviewLoading(true);
        // Simulate API call
        setTimeout(() => {
            setPreviewLoading(false);
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-background border rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-auto">
                <form onSubmit={(e) => { e.preventDefault(); /* Handle Save logic here */ onClose(); }}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <h2 className="text-xl font-semibold">AI Agent</h2>
                        <Button type="button" variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Agent Name */}
                        <div className="space-y-2">
                            <Label htmlFor="agentName">
                                Agent Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="agentName"
                                value={formData.agentName}
                                onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                                placeholder="Enter agent name"
                            />
                        </div>

                        {/* Agent Instructions */}
                        <div className="space-y-2">
                            <Label htmlFor="agentInstructions">
                                Agent Instructions <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="agentInstructions"
                                value={formData.agentInstructions}
                                onChange={(e) => setFormData({ ...formData, agentInstructions: e.target.value })}
                                rows={6}
                                className="resize-none"
                            />
                        </div>

                        {/* Select Tone */}
                        <div className="space-y-2">
                            <Label>Select the tone of the Agent</Label>
                            <div className="flex flex-wrap gap-2">
                                {toneOptions.map((tone) => (
                                    <Badge
                                        key={tone.value}
                                        variant={formData.tones.includes(tone.value) ? 'default' : 'outline'}
                                        className="cursor-pointer hover:bg-primary/90 transition-colors"
                                        onClick={() => toggleTone(tone.value)}
                                    >
                                        <span className="mr-1">{tone.icon}</span>
                                        {tone.label}
                                    </Badge>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">You can select maximum 2 tones</p>
                        </div>

                        {/* Language Selection */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label>Select the language of the Agent</Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button type="button" variant="ghost" className="p-0 h-auto">
                                                <Info className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Choose the language for AI-generated responses</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Select
                                    value={formData.language}
                                    onValueChange={(value) => setFormData({ ...formData, language: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dynamic">Dynamic</SelectItem>
                                        <SelectItem value="english">English</SelectItem>
                                        <SelectItem value="spanish">Spanish</SelectItem>
                                        <SelectItem value="french">French</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={formData.languageRegion}
                                    onValueChange={(value) => setFormData({ ...formData, languageRegion: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en-US">English (United States)</SelectItem>
                                        <SelectItem value="en-GB">English (United Kingdom)</SelectItem>
                                        <SelectItem value="en-AU">English (Australia)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Review Source */}
                        <div className="space-y-2">
                            <Label>Review Source</Label>
                            <Select
                                value={formData.reviewSource}
                                onValueChange={(value) => setFormData({ ...formData, reviewSource: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        <div className="flex items-center gap-2">
                                            <span className="text-blue-500">G</span>
                                            <span>All</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="google">Google</SelectItem>
                                    <SelectItem value="yelp">Yelp</SelectItem>
                                    <SelectItem value="facebook">Facebook</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Review Type */}
                        <div className="space-y-2">
                            <Label>Review Type</Label>
                            <Select
                                value={formData.reviewType}
                                onValueChange={(value) => setFormData({ ...formData, reviewType: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2-stars-below">2 stars or below</SelectItem>
                                    <SelectItem value="3-stars-above">3 stars or above</SelectItem>
                                    <SelectItem value="4-stars-above">4 stars or above</SelectItem>
                                    <SelectItem value="all-reviews">All Reviews</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Footer */}
                        <div className="space-y-2">
                            <Label htmlFor="footer">Footer</Label>
                            <Input
                                id="footer"
                                value={formData.footer}
                                onChange={(e) => setFormData({ ...formData, footer: e.target.value })}
                                placeholder="Example: Thank you!"
                            />
                        </div>

                        {/* AI Agent Response Preview */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-purple-600">AI Agent Response Preview</Label>
                                <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    className="gap-2 text-purple-600"
                                    onClick={handleGenerate}
                                    disabled={previewLoading}
                                >
                                    <Sparkles className="h-4 w-4" />
                                    Generate
                                </Button>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-4 min-h-[60px] flex items-center justify-center">
                                {previewLoading ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                                        Generating preview...
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center">
                                        Click on generate to see a preview of the AI agent's response.
                                    </p>
                                )}
                            </div>
                            <p className="text-xs text-orange-600">You can generate up to 50 reviews in 24 hours.</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 p-6 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
