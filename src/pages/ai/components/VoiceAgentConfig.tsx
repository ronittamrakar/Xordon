import React, { useState } from 'react';
import {
    Mic,
    Settings,
    Phone,
    Cpu,
    Play,
    Save,
    Volume2,
    Globe,
    Activity,
    Smartphone,
    Languages,
    Key,
    User,
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

interface VoiceAgentConfigProps {
    agent?: any;
    onSave: (data: any) => void;
    onCancel: () => void;
    onPlay?: (agent: any) => void;
}

export const VoiceAgentConfig: React.FC<VoiceAgentConfigProps> = ({ agent, onSave, onCancel, onPlay }) => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'general' | 'voice' | 'transcriber' | 'llm' | 'phone'>('general');

    // State
    const [name, setName] = useState(agent?.name || '');
    const [status, setStatus] = useState(agent?.status || 'active');

    // Voice Settings
    const [voiceProvider, setVoiceProvider] = useState(agent?.config?.voice?.provider || 'elevenlabs');
    const [voiceId, setVoiceId] = useState(agent?.config?.voice?.voiceId || 'rachel');
    const [stability, setStability] = useState([agent?.config?.voice?.stability || 0.5]);
    const [similarity, setSimilarity] = useState([agent?.config?.voice?.similarity || 0.75]);

    // LLM Settings
    const [llmProvider, setLlmProvider] = useState(agent?.config?.llm?.provider || 'openai');
    const [model, setModel] = useState(agent?.config?.llm?.model || 'gpt-4o');
    const [systemPrompt, setSystemPrompt] = useState(agent?.config?.llm?.systemPrompt || 'You are a helpful assistant.');

    // Transcriber
    const [language, setLanguage] = useState(agent?.config?.transcriber?.language || 'en-US');
    const [endpointing, setEndpointing] = useState(agent?.config?.transcriber?.endpointing || 500);

    const handleSave = () => {
        onSave({
            name,
            status,
            config: {
                voice: { provider: voiceProvider, voiceId, stability: stability[0], similarity: similarity[0] },
                llm: { provider: llmProvider, model, systemPrompt },
                transcriber: { language, endpointing }
            }
        });
    };

    const handleAssignNumber = () => {
        toast({
            title: 'Phone Integration',
            description: 'Phone number purchasing is not currently connected to a provider.',
            variant: 'default'
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Tabs Navigation */}
            <div className="flex items-center gap-6 border-b overflow-x-auto">
                {[
                    { id: 'general', label: 'General', icon: <Settings className="h-4 w-4" /> },
                    { id: 'voice', label: 'Voice', icon: <Volume2 className="h-4 w-4" /> },
                    { id: 'llm', label: 'Brain (LLM)', icon: <Cpu className="h-4 w-4" /> },
                    { id: 'transcriber', label: 'Transcriber', icon: <Languages className="h-4 w-4" /> },
                    { id: 'phone', label: 'Phone Number', icon: <Smartphone className="h-4 w-4" /> },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-1 py-3 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === tab.id
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Agent Identity</CardTitle>
                                <CardDescription>Basic configurations for your voice agent.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Agent Name</Label>
                                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sales Specialist" />
                                </div>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label>Agent Status</Label>
                                        <p className="text-sm text-muted-foreground">When active, this agent handles assigned calls.</p>
                                    </div>
                                    <Switch checked={status === 'active'} onCheckedChange={(c) => setStatus(c ? 'active' : 'inactive')} />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Voice Tab */}
                    {activeTab === 'voice' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Voice Configuration</CardTitle>
                                <CardDescription>Define how your agent sounds.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Provider</Label>
                                    <Select value={voiceProvider} onValueChange={setVoiceProvider}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                                            <SelectItem value="deepgram">Deepgram Aura</SelectItem>
                                            <SelectItem value="playht">PlayHT</SelectItem>
                                            <SelectItem value="cartesia">Cartesia (Low Latency)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Voice</Label>
                                    <Select value={voiceId} onValueChange={setVoiceId}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {voiceProvider === 'elevenlabs' ? (
                                                <>
                                                    <SelectItem value="rachel">Rachel (American, Calm)</SelectItem>
                                                    <SelectItem value="drew">Drew (American, News)</SelectItem>
                                                    <SelectItem value="clyde">Clyde (American, Deep)</SelectItem>
                                                    <SelectItem value="mimi">Mimi (Australian, Child)</SelectItem>
                                                </>
                                            ) : (
                                                <SelectItem value="asteria">Asteria (English US)</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {voiceProvider === 'elevenlabs' && (
                                    <div className="space-y-6 pt-4 border-t">
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <Label>Stability ({stability[0]})</Label>
                                            </div>
                                            <Slider value={stability} onValueChange={setStability} max={1} step={0.1} />
                                            <p className="text-xs text-muted-foreground">More stable voices are more consistent but can sound monotonous.</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <Label>Similarity ({similarity[0]})</Label>
                                            </div>
                                            <Slider value={similarity} onValueChange={setSimilarity} max={1} step={0.1} />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* LLM Tab */}
                    {activeTab === 'llm' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Intelligence & Behavior</CardTitle>
                                <CardDescription>Configure the brain behind the voice.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Provider</Label>
                                        <Select value={llmProvider} onValueChange={setLlmProvider}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="openai">OpenAI</SelectItem>
                                                <SelectItem value="anthropic">Anthropic</SelectItem>
                                                <SelectItem value="groq">Groq</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Model</Label>
                                        <Select value={model} onValueChange={setModel}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                                                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>System Prompt</Label>
                                    <Textarea
                                        value={systemPrompt}
                                        onChange={e => setSystemPrompt(e.target.value)}
                                        className="min-h-[200px] font-mono text-sm"
                                        placeholder="You are a helpful assistant..."
                                    />
                                    <p className="text-xs text-muted-foreground">Define the persona, rules, and objectives here.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Transcriber Tab */}
                    {activeTab === 'transcriber' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Transcription Settings</CardTitle>
                                <CardDescription>How the agent listens to the user.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Language</Label>
                                    <Select value={language} onValueChange={setLanguage}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en-US">English (US)</SelectItem>
                                            <SelectItem value="en-GB">English (UK)</SelectItem>
                                            <SelectItem value="es">Spanish</SelectItem>
                                            <SelectItem value="fr">French</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Endpointing (ms)</Label>
                                    <Input
                                        type="number"
                                        value={endpointing}
                                        onChange={(e) => setEndpointing(parseInt(e.target.value) || 0)}
                                    />
                                    <p className="text-xs text-muted-foreground">Silence duration before the agent considers the user finished speaking.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Phone Tab */}
                    {activeTab === 'phone' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Phone Number Assignment</CardTitle>
                                <CardDescription>Connect this agent to the outside world.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
                                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                                    <Phone className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-medium">No Number Assigned</h3>
                                    <p className="text-muted-foreground max-w-sm">
                                        Purchase a number or assign an existing one to start handling calls.
                                    </p>
                                </div>
                                <Button variant="outline" onClick={handleAssignNumber}>
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Assign Number
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                </div>

                {/* Sidebar Preview */}
                <div className="space-y-6">
                    <Card className="bg-primary/5 border-primary/20 sticky top-4">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Activity className="h-4 w-4 text-primary" />
                                Live Preview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-center justify-center space-y-4 py-4">
                                <div className="relative">
                                    <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                                        <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
                                            <Mic className="h-8 w-8 text-white" />
                                        </div>
                                    </div>
                                    <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                        {status === 'active' ? 'Online' : 'Offline'}
                                    </Badge>
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold">{name || 'Unnamed Agent'}</p>
                                    <p className="text-sm text-muted-foreground capitalize">{voiceId} • {model}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Button className="w-full" disabled={!name} onClick={() => onPlay?.({
                                    ...agent,
                                    name,
                                    config: {
                                        voice: { provider: voiceProvider, voiceId, stability: stability[0], similarity: similarity[0] },
                                        llm: { provider: llmProvider, model, systemPrompt },
                                        transcriber: { language, endpointing }
                                    }
                                })}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Test Voice
                                </Button>
                                <Button variant="outline" className="w-full" onClick={handleSave}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </Button>
                                <Button variant="ghost" className="w-full text-muted-foreground" onClick={onCancel}>
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const PlusIcon = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M5 12h14" />
        <path d="M12 5v14" />
    </svg>
)
