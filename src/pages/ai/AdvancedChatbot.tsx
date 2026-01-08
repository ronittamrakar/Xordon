import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
    Bot,
    Plus,
    Edit,
    Trash2,
    MessageSquare,
    Phone,
    Mail,
    Globe,
    Settings,
    Zap,
    Brain,
    Users,
    BarChart3,
    Play,
    Pause,
    Copy,
    Download,
    Upload,
    Sparkles,
    MessageCircle,
    Send
} from 'lucide-react';
import { toast } from 'sonner';

interface ChatbotFlow {
    id: string;
    name: string;
    description: string;
    channels: ('whatsapp' | 'sms' | 'web' | 'email')[];
    enabled: boolean;
    triggers: string[];
    responses: ChatbotResponse[];
    aiEnabled: boolean;
    fallbackMessage: string;
    stats: {
        conversations: number;
        avgResponseTime: number;
        satisfaction: number;
    };
}

interface ChatbotResponse {
    id: string;
    trigger: string;
    type: 'text' | 'quick_reply' | 'card' | 'ai_response';
    content: string;
    quickReplies?: string[];
    nextStep?: string;
    conditions?: {
        field: string;
        operator: string;
        value: string;
    }[];
}

const channelIcons = {
    whatsapp: <MessageCircle className="h-4 w-4" />,
    sms: <MessageSquare className="h-4 w-4" />,
    web: <Globe className="h-4 w-4" />,
    email: <Mail className="h-4 w-4" />
};

const channelColors = {
    whatsapp: 'bg-green-500',
    sms: 'bg-blue-500',
    web: 'bg-purple-500',
    email: 'bg-red-500'
};

export default function AdvancedChatbot() {
    const [chatbots, setChatbots] = useState<ChatbotFlow[]>([
        {
            id: '1',
            name: 'Lead Qualification Bot',
            description: 'Automatically qualify leads across all channels',
            channels: ['whatsapp', 'sms', 'web'],
            enabled: true,
            triggers: ['hello', 'hi', 'start', 'help'],
            responses: [],
            aiEnabled: true,
            fallbackMessage: "I'm sorry, I didn't understand that. Can you rephrase?",
            stats: {
                conversations: 1247,
                avgResponseTime: 0.8,
                satisfaction: 4.6
            }
        },
        {
            id: '2',
            name: 'Support Bot',
            description: 'Handle common support questions 24/7',
            channels: ['web', 'email'],
            enabled: true,
            triggers: ['support', 'help', 'issue'],
            responses: [],
            aiEnabled: true,
            fallbackMessage: "Let me connect you with a human agent.",
            stats: {
                conversations: 892,
                avgResponseTime: 1.2,
                satisfaction: 4.3
            }
        }
    ]);

    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingBot, setEditingBot] = useState<ChatbotFlow | null>(null);
    const [showFlowBuilder, setShowFlowBuilder] = useState(false);
    const [selectedBot, setSelectedBot] = useState<ChatbotFlow | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        channels: [] as ('whatsapp' | 'sms' | 'web' | 'email')[],
        triggers: '',
        aiEnabled: true,
        fallbackMessage: "I'm sorry, I didn't understand that. Can you rephrase?",
        enabled: true
    });

    const handleCreate = () => {
        const newBot: ChatbotFlow = {
            id: Date.now().toString(),
            name: formData.name,
            description: formData.description,
            channels: formData.channels,
            enabled: formData.enabled,
            triggers: formData.triggers.split(',').map(t => t.trim()),
            responses: [],
            aiEnabled: formData.aiEnabled,
            fallbackMessage: formData.fallbackMessage,
            stats: {
                conversations: 0,
                avgResponseTime: 0,
                satisfaction: 0
            }
        };

        setChatbots([...chatbots, newBot]);
        setShowCreateDialog(false);
        resetForm();
        toast.success('Chatbot created successfully');
    };

    const handleUpdate = () => {
        if (!editingBot) return;

        setChatbots(chatbots.map(bot =>
            bot.id === editingBot.id
                ? {
                    ...bot,
                    name: formData.name,
                    description: formData.description,
                    channels: formData.channels,
                    triggers: formData.triggers.split(',').map(t => t.trim()),
                    aiEnabled: formData.aiEnabled,
                    fallbackMessage: formData.fallbackMessage,
                    enabled: formData.enabled
                }
                : bot
        ));

        setEditingBot(null);
        resetForm();
        toast.success('Chatbot updated successfully');
    };

    const handleDelete = (id: string) => {
        if (!confirm('Are you sure you want to delete this chatbot?')) return;
        setChatbots(chatbots.filter(bot => bot.id !== id));
        toast.success('Chatbot deleted successfully');
    };

    const handleToggle = (id: string, enabled: boolean) => {
        setChatbots(chatbots.map(bot =>
            bot.id === id ? { ...bot, enabled } : bot
        ));
        toast.success(enabled ? 'Chatbot enabled' : 'Chatbot disabled');
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            channels: [],
            triggers: '',
            aiEnabled: true,
            fallbackMessage: "I'm sorry, I didn't understand that. Can you rephrase?",
            enabled: true
        });
    };

    const startEdit = (bot: ChatbotFlow) => {
        setFormData({
            name: bot.name,
            description: bot.description,
            channels: bot.channels,
            triggers: bot.triggers.join(', '),
            aiEnabled: bot.aiEnabled,
            fallbackMessage: bot.fallbackMessage,
            enabled: bot.enabled
        });
        setEditingBot(bot);
    };

    const toggleChannel = (channel: 'whatsapp' | 'sms' | 'web' | 'email') => {
        setFormData({
            ...formData,
            channels: formData.channels.includes(channel)
                ? formData.channels.filter(c => c !== channel)
                : [...formData.channels, channel]
        });
    };

    const ChatbotForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
        <div className="space-y-4">
            <div>
                <Label>Chatbot Name</Label>
                <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Lead Qualification Bot"
                />
            </div>

            <div>
                <Label>Description</Label>
                <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What does this chatbot do?"
                    rows={2}
                />
            </div>

            <div>
                <Label className="mb-3 block">Active Channels</Label>
                <div className="grid grid-cols-2 gap-3">
                    {(['whatsapp', 'sms', 'web', 'email'] as const).map(channel => (
                        <Button
                            key={channel}
                            type="button"
                            variant={formData.channels.includes(channel) ? 'default' : 'outline'}
                            onClick={() => toggleChannel(channel)}
                            className="justify-start"
                        >
                            <div className={`p-1 rounded mr-2 ${formData.channels.includes(channel) ? 'bg-white/20' : channelColors[channel]} text-white`}>
                                {channelIcons[channel]}
                            </div>
                            {channel.charAt(0).toUpperCase() + channel.slice(1)}
                        </Button>
                    ))}
                </div>
            </div>

            <div>
                <Label>Trigger Keywords</Label>
                <Input
                    value={formData.triggers}
                    onChange={(e) => setFormData({ ...formData, triggers: e.target.value })}
                    placeholder="hello, hi, start, help (comma-separated)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                    Keywords that will activate this chatbot
                </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-purple-500/10">
                        <Brain className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                        <p className="font-medium">AI-Powered Responses</p>
                        <p className="text-sm text-muted-foreground">Use AI to generate contextual responses</p>
                    </div>
                </div>
                <Switch
                    checked={formData.aiEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, aiEnabled: checked })}
                />
            </div>

            <div>
                <Label>Fallback Message</Label>
                <Textarea
                    value={formData.fallbackMessage}
                    onChange={(e) => setFormData({ ...formData, fallbackMessage: e.target.value })}
                    placeholder="Message when bot doesn't understand"
                    rows={2}
                />
            </div>

            <div className="flex items-center gap-2">
                <Switch
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
                <Label>Enable chatbot immediately</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setEditingBot(null); setShowCreateDialog(false); resetForm(); }}>
                    Cancel
                </Button>
                <Button onClick={onSubmit} disabled={!formData.name || formData.channels.length === 0}>
                    {submitLabel}
                </Button>
            </div>
        </div>
    );

    const FlowBuilder = ({ bot }: { bot: ChatbotFlow }) => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Conversation Flow</h3>
                    <p className="text-sm text-muted-foreground">Design your chatbot's conversation logic</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Welcome Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        placeholder="Hi! I'm here to help. How can I assist you today?"
                        rows={3}
                    />
                    <div>
                        <Label className="mb-2 block">Quick Replies</Label>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                                <Plus className="h-3 w-3 mr-1" />
                                Add Quick Reply
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        AI Training
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Knowledge Base</Label>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Select knowledge base..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">General Support</SelectItem>
                                <SelectItem value="sales">Sales FAQs</SelectItem>
                                <SelectItem value="product">Product Information</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>AI Personality</Label>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Select personality..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="friendly">Friendly</SelectItem>
                                <SelectItem value="casual">Casual</SelectItem>
                                <SelectItem value="formal">Formal</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Handoff Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded">
                        <span className="text-sm">Transfer to human after 3 failed responses</span>
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                        <span className="text-sm">Escalate urgent keywords immediately</span>
                        <Switch defaultChecked />
                    </div>
                    <div>
                        <Label>Urgent Keywords</Label>
                        <Input placeholder="urgent, emergency, complaint, refund" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">
                        Advanced Chatbot
                    </h1>
                    <p className="text-muted-foreground">Multi-channel AI-powered chatbots for WhatsApp, SMS, and Web</p>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Chatbot
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create Chatbot</DialogTitle>
                            <DialogDescription>Set up a new multi-channel chatbot</DialogDescription>
                        </DialogHeader>
                        <ChatbotForm onSubmit={handleCreate} submitLabel="Create Chatbot" />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {chatbots.reduce((sum, bot) => sum + bot.stats.conversations, 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Across all bots</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Active Bots</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {chatbots.filter(b => b.enabled).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Out of {chatbots.length} total</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(chatbots.reduce((sum, bot) => sum + bot.stats.avgResponseTime, 0) / chatbots.length).toFixed(1)}s
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Lightning fast</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {(chatbots.reduce((sum, bot) => sum + bot.stats.satisfaction, 0) / chatbots.length).toFixed(1)} ⭐
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">User rating</p>
                    </CardContent>
                </Card>
            </div>

            {/* Chatbots List */}
            <div className="space-y-4">
                {chatbots.map(bot => (
                    <Card key={bot.id}>
                        <CardContent className="py-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Switch
                                            checked={bot.enabled}
                                            onCheckedChange={(checked) => handleToggle(bot.id, checked)}
                                        />
                                        <div>
                                            <h3 className="font-semibold flex items-center gap-2">
                                                {bot.name}
                                                {bot.aiEnabled && (
                                                    <Badge variant="secondary" className="gap-1">
                                                        <Sparkles className="h-3 w-3" />
                                                        AI
                                                    </Badge>
                                                )}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">{bot.description}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mt-3">
                                        <div className="flex gap-1">
                                            {bot.channels.map(channel => (
                                                <div
                                                    key={channel}
                                                    className={`p-1.5 rounded ${channelColors[channel]} text-white`}
                                                    title={channel}
                                                >
                                                    {channelIcons[channel]}
                                                </div>
                                            ))}
                                        </div>

                                        <Separator orientation="vertical" className="h-6" />

                                        <div className="flex gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <MessageSquare className="h-4 w-4" />
                                                {bot.stats.conversations.toLocaleString()}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Zap className="h-4 w-4" />
                                                {bot.stats.avgResponseTime}s
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                {bot.stats.satisfaction}/5
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1 mt-3">
                                        {bot.triggers.slice(0, 5).map(trigger => (
                                            <Badge key={trigger} variant="outline" className="text-xs">
                                                {trigger}
                                            </Badge>
                                        ))}
                                        {bot.triggers.length > 5 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{bot.triggers.length - 5} more
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedBot(bot);
                                            setShowFlowBuilder(true);
                                        }}
                                    >
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => startEdit(bot)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        <BarChart3 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(bot.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingBot} onOpenChange={(open) => !open && setEditingBot(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Chatbot</DialogTitle>
                        <DialogDescription>Update chatbot configuration</DialogDescription>
                    </DialogHeader>
                    <ChatbotForm onSubmit={handleUpdate} submitLabel="Save Changes" />
                </DialogContent>
            </Dialog>

            {/* Flow Builder Dialog */}
            <Dialog open={showFlowBuilder} onOpenChange={setShowFlowBuilder}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            {selectedBot?.name} - Flow Builder
                        </DialogTitle>
                        <DialogDescription>
                            Configure conversation flow and AI behavior
                        </DialogDescription>
                    </DialogHeader>
                    {selectedBot && <FlowBuilder bot={selectedBot} />}
                </DialogContent>
            </Dialog>
        </div>
    );
}
