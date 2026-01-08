import React, { useState } from 'react';
import {
    Bot,
    Plus,
    Settings2,
    Search,
    Info,
    MessageSquare,
    BarChart3,
    BookOpen,
    ArrowRight,
    MoreVertical,
    Play,
    CheckCircle2,
    Filter,
    Download,
    Globe,
    MessageCircle,
    Calendar,
    Zap,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAiAgents } from '@/hooks/useAiAgents';

interface ConversationAiProps {
    onAction: (action: string) => void;
}

export const ConversationAi: React.FC<ConversationAiProps> = ({ onAction }) => {
    const [activeSubTab, setActiveSubTab] = useState<'list' | 'dashboard'>('list');
    const { data: allAgents = [], isLoading } = useAiAgents();

    // Filter for conversation/chat agents only
    const agents = allAgents.filter(agent => agent.type === 'chat' || agent.type === 'conversation');

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex bg-muted rounded-lg p-1">
                    <button
                        onClick={() => setActiveSubTab('list')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeSubTab === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Agent Roster
                    </button>
                    <button
                        onClick={() => setActiveSubTab('dashboard')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeSubTab === 'dashboard' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Intelligence Lab
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => onAction('manage-kb')}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Context Base
                    </Button>
                    <Button onClick={() => onAction('create-bot-wizard')}>
                        <Plus className="h-4 w-4 mr-2" />
                        New AI Bot
                    </Button>
                </div>
            </div>

            {activeSubTab === 'list' && (
                <div className="space-y-4">
                    {/* Filters & Search */}
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search agents..."
                                className="pl-9"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                                <Filter className="h-4 w-4 mr-2" />
                                Filters
                            </Button>
                        </div>
                    </div>

                    {/* Agents Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]"><Input type="checkbox" className="h-4 w-4" /></TableHead>
                                    <TableHead>Agent Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading agents...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : agents.length > 0 ? (
                                    agents.map((agent) => (
                                        <TableRow key={agent.id} className="cursor-pointer" onClick={() => onAction(`edit-${agent.id}`)}>
                                            <TableCell onClick={(e) => e.stopPropagation()}><Input type="checkbox" className="h-4 w-4" /></TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Bot className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{agent.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {agent.type === 'chat' ? 'Chat Bot' : 'Conversation Agent'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                                                    {agent.status === 'active' ? 'Active' : agent.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs font-normal">
                                                    {agent.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {agent.updated_at ? new Date(agent.updated_at).toLocaleDateString() : 'N/A'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => onAction(`edit-${agent.id}`)}>
                                                            <Settings2 className="h-4 w-4 mr-2" />
                                                            Configure
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onAction(`trial-${agent.id}`)}>
                                                            <Play className="h-4 w-4 mr-2" />
                                                            Simulator
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => onAction(`delete-${agent.id}`)}>
                                                            <MoreVertical className="h-4 w-4 mr-2 rotate-90" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Bot className="h-8 w-8 text-muted-foreground" />
                                                <p className="text-muted-foreground">No chat agents found. Create your first agent!</p>
                                                <Button size="sm" onClick={() => onAction('create-bot-wizard')}>
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Create Agent
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {activeSubTab === 'dashboard' && (
                <div className="grid gap-4 md:grid-cols-4">
                    <ConvStatCard label="Chat Agents" value={agents.length.toString()} icon={<Globe className="h-4 w-4" />} />
                    <ConvStatCard label="Active" value={agents.filter(a => a.status === 'active').length.toString()} icon={<MessageCircle className="h-4 w-4" />} />
                    <ConvStatCard label="Conversation Rate" value={agents.length > 0 ? "Active" : "N/A"} icon={<Calendar className="h-4 w-4" />} />
                    <ConvStatCard label="Avg Response Time" value="1.2s" icon={<Zap className="h-4 w-4" />} />
                </div>
            )}
        </div>
    );
};

const ConvStatCard = ({ label, value, icon }: any) => {
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


