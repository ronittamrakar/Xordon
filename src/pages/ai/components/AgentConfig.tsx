import React, { useState } from 'react';
import {
    X,
    Settings2,
    Workflow,
    MessageSquare,
    Calendar,
    Bot,
    Plus,
    ArrowRight,
    Info,
    Check,
    Layout,
    Globe,
    Smartphone,
    MessageCircle,
    HelpCircle,
    Clock,
    Zap,
    Save,
    Trash2,
    Lock,
    Sparkles,
    ChevronDown,
    BarChart3,
    BookOpen,
    ExternalLink,
    RotateCcw,
    Send,
    AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useKnowledgeBases } from '@/hooks/useKnowledgeBases';
import { aiContentApi } from '@/services/aiContentApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';

interface AgentConfigProps {
    agent?: any;
    onSave: (data: any) => void;
    onCancel: () => void;
}

export const AgentConfig: React.FC<AgentConfigProps> = ({ agent, onSave, onCancel }) => {
    const [activeTab, setActiveTab] = useState<'settings' | 'training' | 'goals' | 'dashboard'>('settings');
    const [name, setName] = useState(agent?.name || 'New Employee ' + Date.now().toString().slice(-4));

    // Helper to safely get config value
    const getConfig = (key: string, defaultVal: any) => {
        return agent?.config?.[key] ?? defaultVal;
    };

    const { data: knowledgeBases = [] } = useKnowledgeBases();
    const [selectedKb, setSelectedKb] = useState(getConfig('knowledgeBaseId', ''));

    const [status, setStatus] = useState(agent?.status || 'off');
    const [channels, setChannels] = useState<string[]>(getConfig('channels', ['SMS', 'WhatsApp', 'Live Chat']));
    const [businessName, setBusinessName] = useState(getConfig('businessName', ''));
    const [waitTime, setWaitTime] = useState(getConfig('waitTime', '2'));
    const [maxMessages, setMaxMessages] = useState(getConfig('maxMessages', 100));

    const [tone, setTone] = useState(getConfig('tone', 'Friendly'));
    const [personality, setPersonality] = useState(getConfig('personality', `You are a bot for [[ai.business_name]], tasked to assist customers. Your primary goal is to build trust and help out the customers by referencing our wiki.`));
    const [intent, setIntent] = useState(getConfig('intent', `Your goal is to assist the customers with their queries.`));
    const [context, setContext] = useState(getConfig('context', `Conversation Guidelines:
* Maintain a casual, purposeful, and concise tone.
* Mirror the customer's language and manner of speaking.
* Be attentive and thorough while talking to the customer.`));

    // Chat Simulator State
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<{ from: 'user' | 'bot', text: string }[]>([]);
    const [isChatting, setIsChatting] = useState(false);
    const chatEndRef = React.useRef<HTMLDivElement>(null);
    const chatInputRef = React.useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Auto-scroll to bottom of chat
    React.useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory]);

    const handleSendMessage = async () => {
        if (!chatMessage.trim()) return;
        const msg = chatMessage;
        setChatMessage('');
        setChatHistory(prev => [...prev, { from: 'user', text: msg }]);
        setIsChatting(true);

        const prompt = `
System Context: ${context}
Personality: ${personality}
Intent: ${intent}
Tone: ${tone}
User Message: ${msg}
`;

        try {
            const result = await aiContentApi.generateAiContent({
                channel: 'chat',
                action: 'simulate',
                systemPrompt: `System Context: ${context}\nPersonality: ${personality}\nIntent: ${intent}\nTone: ${tone}`,
                prompt: msg,
                model: 'gpt-4o'
            });
            setChatHistory(prev => [...prev, { from: 'bot', text: result.output }]);
        } catch (e) {
            console.error(e);
            setChatHistory(prev => [...prev, { from: 'bot', text: 'Error: Could not get response from AI.' }]);
        } finally {
            setIsChatting(false);
        }
    };

    const handleTestNow = () => {
        if (activeTab === 'dashboard') {
            setActiveTab('settings');
        }
        setTimeout(() => {
            chatInputRef.current?.focus();
        }, 100);
    };

    const handleSave = () => {
        const config = {
            name,
            status,
            channels,
            businessName,
            waitTime,
            maxMessages,
            tone,
            personality,
            intent,
            context,
            knowledgeBaseId: selectedKb
        };
        onSave(config);
    };

    const channelOptions = [
        { label: 'SMS', value: 'SMS' },
        { label: 'Instagram', value: 'Instagram' },
        { label: 'Facebook', value: 'Facebook' },
        { label: 'Chat Widget (SMS chat)', value: 'Chat Widget' },
        { label: 'Live Chat', value: 'Live Chat' },
        { label: 'WhatsApp', value: 'WhatsApp' },
    ];

    const renderSidebar = () => (
        <div className="w-full lg:w-80 shrink-0 space-y-4">
            <Card className="h-[600px] flex flex-col">
                <CardHeader className="p-4 border-b flex flex-row items-center justify-between bg-muted/50">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm font-semibold">Test Your Bot</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
                    {chatHistory.length === 0 ? (
                        <>
                            <div className="bg-amber-50 border border-amber-200 p-3 rounded-md dark:bg-amber-900/10 dark:border-amber-900/20">
                                <div className="flex gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                                        Bot trial is running in simulation mode.
                                    </p>
                                </div>
                            </div>
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center space-y-2 text-muted-foreground/50">
                                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                                        <Bot className="h-6 w-6" />
                                    </div>
                                    <p className="text-xs font-semibold uppercase tracking-wider">Chat Simulator</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-lg text-sm ${msg.from === 'user'
                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                        : 'bg-muted rounded-tl-none'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isChatting && (
                                <div className="flex justify-start">
                                    <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                                        <div className="flex gap-1 h-4 items-center">
                                            <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce delay-75"></div>
                                            <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce delay-150"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef}></div>
                        </div>
                    )}
                </CardContent>
                <div className="p-4 border-t">
                    <div className="relative">
                        <Input
                            ref={chatInputRef}
                            placeholder="Send a message"
                            className="pr-10"
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={isChatting}
                        />
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={handleSendMessage}
                            disabled={!chatMessage.trim() || isChatting}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Tabs Navigation */}
            <div className="flex items-center gap-6 border-b">
                {(['settings', 'training', 'goals', 'dashboard'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-1 py-3 text-sm font-medium transition-all relative capitalize ${activeTab === tab
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Bot {tab}
                    </button>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Main Content Area */}
                <div className="flex-1 space-y-6 w-full">
                    {activeTab === 'settings' && (
                        <div className="space-y-6 max-w-4xl">
                            {/* Bot Details */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-lg">Bot Details</CardTitle>
                                            <Badge variant="secondary" className="text-xs">Primary</Badge>
                                        </div>
                                    </div>
                                    <CardDescription>Configure your bot's communication preferences and settings</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="bot-name">Bot Name <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="bot-name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="max-w-md"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <Label>Set Bot Status</Label>
                                            <p className="text-xs text-muted-foreground">Choose the bot's operating mode</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                                            <CfgStatusOption
                                                label="Off"
                                                desc="Turn off Conversations AI"
                                                icon={<X className="h-4 w-4" />}
                                                active={status === 'off'}
                                                onClick={() => setStatus('off')}
                                            />
                                            <CfgStatusOption
                                                label="Auto Pilot"
                                                desc="Bot replies automatically based on trained data"
                                                icon={<Zap className="h-4 w-4" />}
                                                active={status === 'autopilot'}
                                                onClick={() => setStatus('autopilot')}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label>Supported Communication Channels</Label>
                                            <p className="text-xs text-muted-foreground">Select where the bot should be active</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 p-3 rounded-md border min-h-[44px]">
                                            {channels.map(channel => (
                                                <Badge key={channel} variant="secondary" className="gap-1 pr-1">
                                                    {channel}
                                                    <X
                                                        className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-destructive"
                                                        onClick={() => setChannels(channels.filter(c => c !== channel))}
                                                    />
                                                </Badge>
                                            ))}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                                                        <Plus className="h-3 w-3" />
                                                        Add Channel
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                    {channelOptions.filter(o => !channels.includes(o.value)).map(opt => (
                                                        <DropdownMenuItem key={opt.value} onClick={() => setChannels([...channels, opt.value])}>
                                                            {opt.label}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">AI Bot Trial Mode</p>
                                                <p className="text-xs text-muted-foreground">Test your bot's responses before going live</p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline">Test Now</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Advanced Settings */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Advanced Settings</CardTitle>
                                    <CardDescription>Fine-tune your Bot's Behavior</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="business-name">Business Name <span className="text-muted-foreground text-xs font-normal">(Default is location name)</span></Label>
                                        <Input
                                            id="business-name"
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            placeholder="Enter business name"
                                            className="max-w-md"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex items-center justify-end gap-3">
                                <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                                <Button onClick={handleSave}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'training' && (
                        <div className="max-w-4xl space-y-6 flex-1">
                            <Card className="bg-muted/50 border-muted p-4 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Info className="h-5 w-5 text-primary" />
                                    <p className="text-sm">
                                        Need help setting up your bot training? Check our <span className="font-medium underline cursor-pointer">step-by-step guide</span>.
                                    </p>
                                </div>
                            </Card>

                            <div className="space-y-4">
                                <Label>Select Knowledge Base</Label>
                                <div className="flex items-center gap-4">
                                    <Select value={selectedKb} onValueChange={setSelectedKb}>
                                        <SelectTrigger className="w-[300px]">
                                            <SelectValue placeholder="Select Knowledge Base" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {knowledgeBases.length > 0 ? (
                                                knowledgeBases.map((kb: any) => (
                                                    <SelectItem key={kb.id} value={kb.id}>{kb.name}</SelectItem>
                                                ))
                                            ) : (
                                                <div className="p-2 text-sm text-muted-foreground text-center">No knowledge bases found</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" className="gap-2" onClick={() => navigate('/ai/knowledge-hub')}>
                                        Create New
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Select a knowledge base to train your bot.</p>
                            </div>

                            <div className="h-[200px]" /> {/* Spacer */}

                            <div className="flex items-center justify-end gap-3 pt-6 border-t mt-auto">
                                <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                                <Button onClick={handleSave}>
                                    Save Training
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'goals' && (
                        <div className="max-w-4xl space-y-8 flex-1">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-semibold tracking-tight">Bot Goals & Personality</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    Define who your bot is and what it aims to achieve.
                                    <span className="text-primary font-medium cursor-pointer hover:underline">Documentation</span>
                                </div>
                            </div>

                            <Card className="bg-muted/30">
                                <div className="flex items-center justify-between p-4 border-b">
                                    <div className="flex items-center gap-2">
                                        <Bot className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-medium">OpenAI GPT-4 Turbo</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs font-normal gap-1 bg-background">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                        8k Context Window
                                    </Badge>
                                </div>

                                <div className="p-8 text-center space-y-4">
                                    <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center mx-auto">
                                        <Workflow className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-lg font-semibold">Flow Based Builder</h4>
                                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                            Create sophisticated conversation workflows with our visual builder. Design multi-step sequences that nurture leads effectively.
                                        </p>
                                    </div>
                                    <Button variant="outline" onClick={() => navigate('/automations/builder')}>
                                        Launch Visual Flow Builder
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </div>
                            </Card>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b pb-4">
                                    <div className="space-y-1">
                                        <h4 className="text-lg font-medium">Configuration</h4>
                                        <p className="text-sm text-muted-foreground">Define your bot's core behavior and personality</p>
                                    </div>
                                    <Badge variant="secondary">1,768 Tokens Available</Badge>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Reply Tone</Label>
                                        <Select value={tone} onValueChange={setTone}>
                                            <SelectTrigger className="w-[300px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Friendly">Friendly</SelectItem>
                                                <SelectItem value="Professional">Professional</SelectItem>
                                                <SelectItem value="Helpful">Helpful</SelectItem>
                                                <SelectItem value="Casual">Casual</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">Choose a tone that aligns with your brand identity.</p>
                                    </div>

                                    <div className="grid gap-6">
                                        <CfgItem
                                            title="Personality & Style"
                                            value={personality}
                                            onChange={setPersonality}
                                            desc="Define how your bot should respond - tone, style, and communication approach"
                                        />
                                        <CfgItem
                                            title="Main Intent"
                                            value={intent}
                                            onChange={setIntent}
                                            desc="Define the primary purpose behind every conversation"
                                        />
                                        <CfgItem
                                            title="Additional Context"
                                            value={context}
                                            onChange={setContext}
                                            desc="Provide relevant business information, services, pricing, or any particular instruction"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-6 border-t">
                                <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                                <Button onClick={handleSave}>
                                    Save Goals
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'dashboard' && (
                        <div className="max-w-6xl space-y-6 flex-1 pb-12">
                            <div className="flex flex-wrap items-center gap-4">
                                <Select defaultValue="all">
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="All Channels" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Channels</SelectItem>
                                        <SelectItem value="web">Web Chat</SelectItem>
                                        <SelectItem value="messenger">Messenger</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="flex items-center gap-2 px-3 h-10 rounded-md border text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>2025-12-01</span>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    <span>2025-12-26</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <CfgKPICard title="Unique Contacts" value="-" />
                                <CfgKPICard title="Actions Triggered" value="-" />
                                <CfgKPICard title="Appointments" value="-" />
                                <CfgKPICard title="Time Saved" help />
                            </div>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Historical Contact Growth</CardTitle>
                                        <HelpCircle className="h-4 w-4 text-muted-foreground/50" />
                                    </div>
                                </CardHeader>
                                <CardContent className="h-64 flex flex-col items-center justify-center text-muted-foreground/50 select-none">
                                    <div className="w-12 h-12 bg-muted/50 rounded-lg flex items-center justify-center mb-3">
                                        <BarChart3 className="h-6 w-6" />
                                    </div>
                                    <span className="text-sm uppercase tracking-widest">No Data Recorded</span>
                                </CardContent>
                            </Card>

                            <div className="flex items-center justify-end gap-3 pt-6 border-t mt-auto">
                                <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                                <Button onClick={handleSave}>
                                    Update Dashboard
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Chat Simulator */}
                {activeTab !== 'dashboard' && renderSidebar()}
            </div>
        </div>
    );
};

const CfgStatusOption = ({ label, desc, icon, active, onClick }: any) => (
    <div
        onClick={onClick}
        className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${active ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
            }`}
    >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {icon}
        </div>
        <div className="flex-1">
            <p className="font-medium text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${active ? 'border-primary' : 'border-muted'}`}>
            {active && <div className="w-2 h-2 rounded-full bg-primary" />}
        </div>
    </div>
);

const CfgItem = ({ title, value, onChange, desc }: any) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between">
            <Label>{title} <span className="text-destructive">*</span></Label>
            <span className="text-xs text-primary cursor-pointer hover:underline">Add Custom Value</span>
        </div>
        <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[100px] text-sm"
        />
        <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
);

const CfgKPICard = ({ title, value, help }: any) => (
    <Card>
        <CardContent className="p-6 flex flex-col justify-between h-28">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
                {help && <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50" />}
            </div>
            <div className="space-y-1">
                <div className="text-2xl font-bold opacity-80">{value || '-'}</div>
                <p className="text-[12px] text-muted-foreground">No data available.</p>
            </div>
        </CardContent>
    </Card>
);
