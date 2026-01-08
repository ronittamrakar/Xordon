import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
    Bot, Zap, MessageSquare, Mic, BookOpen, Sparkles, Settings as SettingsIcon,
    Layout, ExternalLink, ArrowRight, CheckCircle2, AlertCircle, Loader2, Users
} from 'lucide-react';
import { useAiAgents } from '@/hooks/useAiAgents';
import { useKnowledgeBases } from '@/hooks/useKnowledgeBases';

const AIConsole: React.FC = () => {
    const navigate = useNavigate();
    const { data: agents = [], isLoading: agentsLoading } = useAiAgents();
    const { data: knowledgeBases = [], isLoading: kbLoading } = useKnowledgeBases();

    // Count agents by type
    const voiceAgents = agents.filter(a => a.type === 'voice').length;
    const chatAgents = agents.filter(a => a.type === 'chat' || a.type === 'conversation').length;
    const totalAgents = agents.length;

    // System status checks
    const [systemStatus, setSystemStatus] = useState({
        openai: 'checking' as 'active' | 'inactive' | 'checking',
        voiceProcessing: 'checking' as 'active' | 'inactive' | 'checking',
        knowledgeBase: 'checking' as 'active' | 'inactive' | 'checking',
        contentGeneration: 'checking' as 'active' | 'inactive' | 'checking',
    });

    useEffect(() => {
        // Simulate status checks - in production these would be actual API calls
        const timer = setTimeout(() => {
            setSystemStatus({
                openai: 'active',
                voiceProcessing: voiceAgents > 0 ? 'active' : 'inactive',
                knowledgeBase: knowledgeBases.length > 0 ? 'active' : 'inactive',
                contentGeneration: 'active',
            });
        }, 1000);
        return () => clearTimeout(timer);
    }, [voiceAgents, knowledgeBases.length]);

    const features = [
        {
            title: 'Agent Studio',
            description: 'Build and configure AI agents with workflows',
            icon: Layout,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            route: '/ai/agents'
        },
        {
            title: 'Voice AI',
            description: 'Create voice-enabled agents for phone calls and IVR',
            icon: Mic,
            color: 'text-green-600',
            bg: 'bg-green-50',
            route: '/ai/voice-ai'
        },
        {
            title: 'Conversation AI',
            description: 'Build chatbots and conversational interfaces',
            icon: MessageSquare,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            route: '/ai/conversation-ai'
        },
        {
            title: 'Knowledge Base',
            description: 'Manage documents and context for your AI agents',
            icon: BookOpen,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            route: '/ai/knowledge-hub'
        },
        {
            title: 'Content AI',
            description: 'Generate and optimize content with AI assistance',
            icon: Sparkles,
            color: 'text-pink-600',
            bg: 'bg-pink-50',
            route: '/ai/content-ai'
        },
        {
            title: 'AI Workforce',
            description: 'Transform agents into digital employees with roles and autonomy',
            icon: Users,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            route: '/ai/workforce'
        },
        {
            title: 'Templates',
            description: 'Browse and deploy pre-built agent templates',
            icon: Bot,
            color: 'text-red-600',
            bg: 'bg-red-50',
            route: '/ai/agent-templates'
        }
    ];

    return (
        <div className="space-y-4 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">AI Console</h1>
                    <p className="text-muted-foreground">Central hub for managing all AI capabilities and agents</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => navigate('/ai/agents')}>
                        <Layout className="h-4 w-4 mr-2" />
                        Agent Studio
                    </Button>
                    <Button variant="outline" onClick={() => window.open('https://docs.xordon.com', '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Documentation
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                        <Card
                            key={index}
                            className="hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => navigate(feature.route)}
                        >
                            <CardHeader className="pb-2">
                                <div className={`w-12 h-12 ${feature.bg} rounded-lg flex items-center justify-center mb-4`}>
                                    <Icon className={`h-6 w-6 ${feature.color}`} />
                                </div>
                                <CardTitle className="text-lg">{feature.title}</CardTitle>
                                <CardDescription>{feature.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Quick Access</span>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common tasks and operations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" onClick={() => navigate('/ai/agents')}>
                                <Zap className="h-4 w-4 mr-2" />
                                Create Agent
                            </Button>
                            <Button variant="outline" onClick={() => navigate('/ai/knowledge-hub')}>
                                <BookOpen className="h-4 w-4 mr-2" />
                                Manage Knowledge
                            </Button>
                            <Button variant="outline" onClick={() => navigate('/ai/agent-templates')}>
                                <Bot className="h-4 w-4 mr-2" />
                                Browse Templates
                            </Button>
                            <Button variant="outline" onClick={() => navigate('/ai/settings')}>
                                <SettingsIcon className="h-4 w-4 mr-2" />
                                AI Settings
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>System Status</CardTitle>
                        <CardDescription>AI services and integrations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <StatusRow label="OpenAI Integration" status={systemStatus.openai} />
                            <StatusRow label="Voice Processing" status={systemStatus.voiceProcessing} count={voiceAgents} />
                            <StatusRow label="Knowledge Base" status={systemStatus.knowledgeBase} count={knowledgeBases.length} />
                            <StatusRow label="Content Generation" status={systemStatus.contentGeneration} />
                            <StatusRow label="AI Workforce" status="active" />
                        </div>
                        {totalAgents > 0 && (
                            <div className="pt-4 border-t">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total Active Agents</span>
                                    <Badge variant="secondary">{totalAgents}</Badge>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// Helper component for status rows
const StatusRow = ({ label, status, count }: { label: string; status: 'active' | 'inactive' | 'checking'; count?: number }) => {
    const getStatusDisplay = () => {
        if (status === 'checking') {
            return (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking
                </span>
            );
        }
        if (status === 'active') {
            return (
                <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Active{count !== undefined && count > 0 ? ` (${count})` : ''}
                </span>
            );
        }
        return (
            <span className="text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Not configured
            </span>
        );
    };

    return (
        <div className="flex justify-between items-center">
            <span className="text-sm">{label}</span>
            {getStatusDisplay()}
        </div>
    );
};

export default AIConsole;