import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Plus,
    PhoneCall,
    Search,
    MoreHorizontal,
    Play,
    Settings,
    History,
    Mic,
    Shield,
    Zap,
    Cpu,
    ArrowRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface VoiceAiProps {
    agents: any[];
    isLoading: boolean;
    onEdit?: (agent: any) => void;
    onDelete?: (id: string) => void;
    onCreateAgent?: () => void;
    onPlay?: (agent: any) => void;
    onHistory?: (agent: any) => void;
}

export const VoiceAi: React.FC<VoiceAiProps> = ({ agents, isLoading, onEdit, onDelete, onCreateAgent, onPlay, onHistory }) => {
    const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'agents'>('dashboard');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAgents = agents.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as any)} className="w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <TabsList>
                        <TabsTrigger value="dashboard" className="gap-2">
                            <Cpu className="h-4 w-4" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="agents" className="gap-2">
                            <Mic className="h-4 w-4" />
                            Vocal Roster
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                        <Button variant="outline">
                            Call Logs
                        </Button>
                        <Button onClick={onCreateAgent}>
                            <Plus className="h-4 w-4 mr-2" />
                            Deploy New Agent
                        </Button>
                    </div>
                </div>

                <TabsContent value="dashboard" className="mt-0">
                    {agents.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                                <Mic className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-2 max-w-sm">
                                <h3 className="text-xl font-semibold">No Active Vocal Agents</h3>
                                <p className="text-muted-foreground">Get started by deploying your first voice agent to handle calls automatically.</p>
                            </div>
                            <Button onClick={onCreateAgent}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Voice Agent
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard label="Voice Agents" value={agents.length.toString()} icon={<PhoneCall className="h-4 w-4" />} />
                            <StatCard label="Active" value={agents.filter(a => a.status === 'active').length.toString()} icon={<Zap className="h-4 w-4" />} />
                            <StatCard label="Avg Latency" value="84ms" icon={<Cpu className="h-4 w-4" />} />
                            <StatCard label="Uptime" value="99.9%" icon={<Shield className="h-4 w-4" />} />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="agents" className="mt-0 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search voice agents..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Badge variant="outline" className="px-3 py-1">
                            {filteredAgents.length} Active Nodes
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredAgents.map((agent) => (
                            <Card key={agent.id} className="group hover:border-primary/50 transition-colors">
                                <CardContent className="p-6 space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Mic className="h-6 w-6 text-primary" />
                                        </div>
                                        <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                                            {agent.status}
                                        </Badge>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-lg">{agent.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {agent.type} Proxy • Created {new Date(agent.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t">
                                        <div className="flex items-center gap-1">
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onPlay?.(agent)}>
                                                <Play className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onHistory?.(agent)}>
                                                <History className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit?.(agent)}>
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete?.(agent.id)}>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

const StatCard = ({ label, value, icon }: any) => (
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


