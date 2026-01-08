import React, { useState } from 'react';
import {
    Sparkles,
    Type,
    Image as ImageIcon,
    Layout,
    FileTextIcon,
    Search,
    Filter,
    Download,
    MoreVertical,
    ArrowRight,
    TrendingUp,
    Clock,
    Zap,
    DollarSign,
    PenTool,
    Share2,
    Globe,
    Plus,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

import { aiContentApi } from '@/services/aiContentApi';

export const ContentAi: React.FC = () => {
    const [activeType, setActiveType] = useState('text');
    const [filter, setFilter] = useState('All');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationResult, setGenerationResult] = useState('');
    const [prompt, setPrompt] = useState('');
    const [showTextDialog, setShowTextDialog] = useState(false);
    const [showImageDialog, setShowImageDialog] = useState(false);
    const { toast } = useToast();

    // Track content generation stats (persisted in localStorage for demo)
    const [stats, setStats] = useState(() => {
        const saved = localStorage.getItem('contentAiStats');
        return saved ? JSON.parse(saved) : { totalWords: 0, generations: 0, imagesGenerated: 0 };
    });

    const updateStats = (words: number, isImage = false) => {
        setStats((prev: any) => {
            const newStats = {
                totalWords: prev.totalWords + words,
                generations: prev.generations + 1,
                imagesGenerated: isImage ? prev.imagesGenerated + 1 : prev.imagesGenerated,
            };
            localStorage.setItem('contentAiStats', JSON.stringify(newStats));
            return newStats;
        });
    };

    const categories = ['All', 'Social Planner', 'Blog Content', 'Funnels', 'Email Copy', 'Ads', 'Product Info'];

    // Track content history
    const [history, setHistory] = useState<any[]>(() => {
        const saved = localStorage.getItem('contentAiHistory');
        return saved ? JSON.parse(saved) : [];
    });

    const addToHistory = (item: any) => {
        setHistory(prev => {
            const newHistory = [item, ...prev];
            localStorage.setItem('contentAiHistory', JSON.stringify(newHistory));
            return newHistory;
        });
    };

    const handleGenerateText = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        try {
            const response = await aiContentApi.generateAiContent({
                channel: 'email',
                action: 'create',
                prompt: prompt,
                context: {
                    type: 'content-ai',
                    category: filter === 'All' ? 'General' : filter
                }
            });

            if (response && response.output) {
                setGenerationResult(response.output);
                const wordCount = response.output.split(/\s+/).filter(Boolean).length;
                updateStats(wordCount, false);

                addToHistory({
                    id: Date.now().toString(),
                    type: 'text',
                    content: response.output,
                    prompt: prompt,
                    createdAt: Date.now(),
                    category: filter === 'All' ? 'General' : filter,
                    wordCount: wordCount
                });

                toast({
                    title: "Content Generated",
                    description: `Generated ${wordCount} words successfully.`,
                });
            } else {
                throw new Error('No output received');
            }
        } catch (error: any) {
            console.error('Generation error:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to generate content. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        try {
            const response = await aiContentApi.generateAiContent({
                channel: 'image',
                action: 'create',
                prompt: prompt,
                context: {
                    type: 'content-ai-visual',
                }
            });

            if (response && response.output) {
                setGenerationResult(response.output);
                updateStats(0, true);

                addToHistory({
                    id: Date.now().toString(),
                    type: 'image',
                    content: response.output,
                    prompt: prompt,
                    createdAt: Date.now(),
                    category: 'Visual'
                });

                toast({
                    title: "Image Generated",
                    description: "Your image has been created.",
                });
            } else {
                throw new Error('No image URL received');
            }
        } catch (error: any) {
            console.error('Image generation error:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to generate image.",
                variant: "destructive"
            });
        } finally {
            setIsGenerating(false);
        }
    }

    const textHistory = history.filter(h => h.type === 'text').filter(h => filter === 'All' || h.category === filter);
    const imageHistory = history.filter(h => h.type === 'image');

    return (
        <div className="space-y-6">
            <Tabs value={activeType} onValueChange={setActiveType} className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="text" className="gap-2">
                        <Type className="h-4 w-4" />
                        Text Engine
                    </TabsTrigger>
                    <TabsTrigger value="image" className="gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Visual Lab
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-6 mt-0">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            label="Total Words"
                            value={stats.totalWords >= 1000 ? `${(stats.totalWords / 1000).toFixed(1)}k` : stats.totalWords.toString()}
                            icon={<Zap className="h-4 w-4" />}
                        />
                        <StatCard
                            label="Total Generations"
                            value={stats.generations.toString()}
                            icon={<DollarSign className="h-4 w-4" />}
                        />
                        <StatCard
                            label="Images Created"
                            value={stats.imagesGenerated.toString()}
                            icon={<TrendingUp className="h-4 w-4" />}
                        />
                    </div>

                    {/* Sub-Filters & Content List */}
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-2">
                                {categories.map((cat) => (
                                    <Button
                                        key={cat}
                                        variant={filter === cat ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setFilter(cat)}
                                        className="rounded-full"
                                    >
                                        {cat}
                                    </Button>
                                ))}
                            </div>
                            <Button onClick={() => {
                                setPrompt('');
                                setGenerationResult('');
                                setShowTextDialog(true);
                            }}>
                                <Plus className="h-4 w-4 mr-2" />
                                New Content
                            </Button>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Content Identity</TableHead>
                                        <TableHead>Registry Date</TableHead>
                                        <TableHead>Word Count</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {textHistory.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-64 text-center align-middle">
                                                <div className="flex flex-col items-center justify-center space-y-4">
                                                    <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                                                        <PenTool className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-lg font-semibold">
                                                            {filter === 'All' ? 'Awaiting Your Input' : `No ${filter} Content Found`}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                                            {filter === 'All'
                                                                ? 'Start generating high-conversion copy using our optimized AI models.'
                                                                : `You haven't generated any ${filter.toLowerCase()} content yet.`}
                                                        </p>
                                                    </div>
                                                    <Button onClick={() => {
                                                        setPrompt('');
                                                        setGenerationResult('');
                                                        setShowTextDialog(true);
                                                    }}>
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Start Generating
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        textHistory.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <FileTextIcon className="h-4 w-4 text-primary" />
                                                        <span className="truncate max-w-[200px]" title={item.prompt}>{item.prompt || 'Untitled Content'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell>{item.wordCount} words</TableCell>
                                                <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => {
                                                        setGenerationResult(item.content);
                                                        setPrompt(item.prompt);
                                                        setShowTextDialog(true);
                                                    }}>
                                                        View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="image" className="mt-0 space-y-6">
                    <Card className="flex flex-col items-center justify-center py-12 text-center space-y-6 border-dashed">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-2 max-w-md">
                            <h3 className="text-xl font-semibold">Prompt-to-Reality Visual Engine</h3>
                            <p className="text-muted-foreground text-sm">
                                Harness high-performance neural networks to generate cinematic, ultra-realistic visuals.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <Button onClick={() => {
                                setPrompt('');
                                setGenerationResult('');
                                setShowImageDialog(true);
                            }}>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Create Image
                            </Button>
                        </div>
                    </Card>

                    {imageHistory.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Recent Visuals</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {imageHistory.map((item) => (
                                    <div key={item.id} className="group relative aspect-square rounded-lg overflow-hidden border bg-muted" onClick={() => {
                                        setGenerationResult(item.content);
                                        setPrompt(item.prompt);
                                        setShowImageDialog(true);
                                    }}>
                                        <img src={item.content} alt={item.prompt} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                            <Button variant="secondary" size="sm">View</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Text Generation Modal */}
            <Dialog open={showTextDialog} onOpenChange={setShowTextDialog}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Generate Content</DialogTitle>
                        <DialogDescription>
                            Enter your topic or prompt below to generate new content.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Prompt</Label>
                            <Textarea
                                placeholder="e.g., Write a promotional email for our new summer collection..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={4}
                            />
                        </div>
                        {generationResult && (
                            <div className="space-y-2">
                                <Label>Result</Label>
                                <div className="p-3 bg-muted rounded-md text-sm border min-h-[100px] whitespace-pre-wrap">
                                    {generationResult}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        {!generationResult ? (
                            <Button onClick={handleGenerateText} disabled={isGenerating || !prompt}>
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Generate
                                    </>
                                )}
                            </Button>
                        ) : (
                            <div className="flex gap-2 w-full justify-end">
                                <Button variant="outline" onClick={() => setShowTextDialog(false)}>Close</Button>
                                <Button onClick={() => {
                                    navigator.clipboard.writeText(generationResult);
                                    toast({ description: "Copied to clipboard" });
                                }}>Copy Result</Button>
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Image Generation Modal */}
            <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Generate Image</DialogTitle>
                        <DialogDescription>
                            Describe the image you want to create.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Prompt</Label>
                            <Textarea
                                placeholder="e.g., A futuristic office with neon lights..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={3}
                            />
                        </div>
                        {generationResult && (
                            <div className="space-y-2 flex justify-center">
                                <img src={generationResult} alt="Generated" className="rounded-md max-h-[300px] object-cover" />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        {!generationResult ? (
                            <Button onClick={handleGenerateImage} disabled={isGenerating || !prompt}>
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Create Image
                                    </>
                                )}
                            </Button>
                        ) : (
                            <div className="flex gap-2 w-full justify-end">
                                <Button variant="outline" onClick={() => setShowImageDialog(false)}>Close</Button>
                                <Button onClick={() => {
                                    // In a real app, this might download or save to library
                                    toast({ description: "Image saved to library" });
                                    setShowImageDialog(false);
                                }}>Save to Library</Button>
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const StatCard = ({ label, value, icon }: any) => {
    return (
        <Card>
            <CardContent className="p-6 flex items-center justify-between space-y-0">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
                <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                    {icon}
                </div>
            </CardContent>
        </Card>
    );
};


