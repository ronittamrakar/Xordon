import React, { useState } from 'react';
import { useAiAgents, useCreateAiAgent, useUpdateAiAgent, useDeleteAiAgent } from '@/hooks/useAiAgents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  Plus, Edit, Trash2, Mic, MessageSquare, Zap, Search, Settings as SettingsIcon,
  ExternalLink, Play, History, MoreHorizontal, Bot, Filter, LayoutGrid, List as ListIcon,
  Loader2
} from 'lucide-react';
import { CreateBotWizard } from './components/CreateBotWizard';
import { CreateVoiceAgentWizard } from './components/CreateVoiceAgentWizard';
import { AgentConfig } from './components/AgentConfig';
import { VoiceAgentConfig } from './components/VoiceAgentConfig';
import { Breadcrumb } from '@/components/Breadcrumb';

type AgentForm = {
  name: string;
  type: string;
  status: string;
  configText: string;
};

const AiAgents: React.FC = () => {
  const { toast } = useToast();
  const { data: agents = [], isLoading } = useAiAgents();
  const createMutation = useCreateAiAgent();
  const updateMutation = useUpdateAiAgent();
  const deleteMutation = useDeleteAiAgent();

  // View & Filter State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'voice' | 'chat'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog & Wizard State
  const [isCreateSelectionOpen, setIsCreateSelectionOpen] = useState(false);
  const [isBotWizardOpen, setIsBotWizardOpen] = useState(false);
  const [isVoiceWizardOpen, setIsVoiceWizardOpen] = useState(false);

  // Edit State
  const [editingAgent, setEditingAgent] = useState<any | null>(null);
  const [configMode, setConfigMode] = useState<'none' | 'voice' | 'chat'>('none');
  const [form, setForm] = useState<AgentForm>({ name: '', type: 'voice', status: 'active', configText: '{}' });

  // Filter Logic
  const filteredAgents = agents.filter((agent: any) => {
    const matchesType = filterType === 'all' ||
      (filterType === 'voice' && agent.type === 'voice') ||
      (filterType === 'chat' && (agent.type === 'chat' || agent.type === 'conversation'));
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleCreateAgent = () => {
    setIsCreateSelectionOpen(true);
  };

  const startCustomAgent = (type: 'chat' | 'voice') => {
    setIsCreateSelectionOpen(false);
    if (type === 'chat') {
      setIsBotWizardOpen(true);
    } else {
      setIsVoiceWizardOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast({ title: 'Success', description: 'Agent deleted' }),
        onError: () => toast({ title: 'Error', description: 'Failed to delete agent', variant: 'destructive' })
      });
    }
  };

  const handleEdit = (agent: any) => {
    setEditingAgent(agent);
    if (agent.type === 'voice') {
      setConfigMode('voice');
    } else {
      setConfigMode('chat');
    }
  };

  const handleUpdate = (id: string, data: any) => {
    updateMutation.mutate({ id, data }, {
      onSuccess: () => {
        setConfigMode('none');
        setEditingAgent(null);
        toast({ title: 'Success', description: 'Agent updated successfully' });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to update agent', variant: 'destructive' })
    });
  };

  // If in config mode, show the specific config component full screen (or overlay)
  if (configMode === 'voice' && editingAgent) {
    return (
      <VoiceAgentConfig
        agent={editingAgent}
        onSave={(data) => handleUpdate(editingAgent.id, data)}
        onCancel={() => { setConfigMode('none'); setEditingAgent(null); }}
      />
    );
  }

  if (configMode === 'chat' && editingAgent) {
    return (
      <AgentConfig
        agent={editingAgent}
        onSave={(data) => handleUpdate(editingAgent.id, data)} // AgentConfig might send different data structure vs VoiceAgentConfig, ensure alignment
        onCancel={() => { setConfigMode('none'); setEditingAgent(null); }}
      />
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'AI' }, { label: 'Agents' }]} />
          <h1 className="text-[18px] font-bold tracking-tight mt-2">AI Agents</h1>
          <p className="text-muted-foreground">Manage your intelligent voice agents and chat bots in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.open('https://docs.xordon.com', '_blank')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Docs
          </Button>
          <Button onClick={handleCreateAgent}>
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Agents</p>
              <p className="text-2xl font-bold">{agents.length}</p>
            </div>
            <Bot className="h-8 w-8 text-muted-foreground opacity-20" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Voice</p>
              <p className="text-2xl font-bold">{agents.filter((a: any) => a.type === 'voice' && a.status === 'active').length}</p>
            </div>
            <Mic className="h-8 w-8 text-blue-500 opacity-20" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Chat</p>
              <p className="text-2xl font-bold">{agents.filter((a: any) => (a.type === 'chat' || a.type === 'conversation') && a.status === 'active').length}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-purple-500 opacity-20" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">System Status</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Operational</span>
              </div>
            </div>
            <Zap className="h-8 w-8 text-green-500 opacity-20" />
          </CardContent>
        </Card>
      </div>

      {/* Controls & Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex bg-muted rounded-md p-1 shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-all ${filterType === 'all' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >All</button>
            <button
              onClick={() => setFilterType('voice')}
              className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-all ${filterType === 'voice' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >Voice</button>
            <button
              onClick={() => setFilterType('chat')}
              className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-all ${filterType === 'chat' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >Chat</button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Agents List content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading intelligent agents...</p>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border rounded-lg border-dashed bg-muted/20">
          <Bot className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Agents Found</h3>
          <p className="text-muted-foreground max-w-sm text-center mb-6">
            {searchQuery ? 'Try adjusting your search terms or filters.' : 'Get started by deploying your first AI agent.'}
          </p>
          <Button onClick={handleCreateAgent}>
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
          {filteredAgents.map((agent: any) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              viewMode={viewMode}
              onEdit={() => handleEdit(agent)}
              onDelete={() => handleDelete(agent.id)}
            />
          ))}
        </div>
      )}

      {/* Create Selection Dialog */}
      <Dialog open={isCreateSelectionOpen} onOpenChange={setIsCreateSelectionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Deploy New Agent</DialogTitle>
            <DialogDescription>
              Select the type of AI agent you wish to create.
            </DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-4 py-4">
            <Card
              className="cursor-pointer hover:border-primary hover:bg-muted/50 transition-all"
              onClick={() => startCustomAgent('voice')}
            >
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                  <Mic className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Voice Agent</CardTitle>
                <CardDescription>Phone-capable agent for calls</CardDescription>
              </CardHeader>
            </Card>
            <Card
              className="cursor-pointer hover:border-primary hover:bg-muted/50 transition-all"
              onClick={() => startCustomAgent('chat')}
            >
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
                  <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Chat Bot</CardTitle>
                <CardDescription>Messaging agent for web & SMS</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wizards */}
      <CreateBotWizard
        open={isBotWizardOpen}
        onOpenChange={setIsBotWizardOpen}
        onComplete={(config) => {
          setIsBotWizardOpen(false);
          // Auto-open edit mode for the newly sketched agent
          setEditingAgent({
            id: 'temp-new', // In real app, wizard should probably return the created ID or created object
            name: config.name || 'New Bot',
            type: 'chat', status: 'active',
            channels: config.channels || ['Web']
          });
          setConfigMode('chat');
        }}
      />

      <CreateVoiceAgentWizard
        open={isVoiceWizardOpen}
        onOpenChange={setIsVoiceWizardOpen}
        onComplete={(config) => {
          setIsVoiceWizardOpen(false);
          // Auto-open edit
          setEditingAgent({
            id: 'temp-new-voice',
            name: config.name,
            type: 'voice',
            status: 'active',
            created_at: new Date().toISOString(),
            config: {
              voice: { provider: 'elevenlabs', voiceId: 'rachel' },
              llm: { provider: 'openai', model: 'gpt-4' }
            }
          });
          setConfigMode('voice');
        }}
      />
    </div>
  );
};

// Unified Agent Card Component
const AgentCard = ({ agent, viewMode, onEdit, onDelete }: any) => {
  const isVoice = agent.type === 'voice';

  if (viewMode === 'list') {
    return (
      <Card className="flex flex-row items-center p-4 gap-4 hover:border-primary/50 transition-colors">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isVoice ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
          {isVoice ? <Mic className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{agent.name}</h3>
            <Badge variant={agent.status === 'active' ? 'default' : 'secondary'} className="text-[12px] h-5">
              {agent.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {isVoice ? 'Voice Intelligence' : 'Conversational Chat Engine'} • ID: {String(agent.id).slice(0, 6)}

          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={onEdit}>
            <SettingsIcon className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="group hover:border-primary/50 transition-colors flex flex-col">
      <CardContent className="p-6 space-y-4 flex-1">
        <div className="flex items-start justify-between">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${isVoice ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/40'}`}>
            {isVoice ? <Mic className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
          </div>
          <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
            {agent.status}
          </Badge>
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold text-lg line-clamp-1">{agent.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {isVoice
              ? 'Autonomous voice agent for handling inbound/outbound calls.'
              : 'Interactive chat bot for customer support and lead gen.'}
          </p>
        </div>

        <div className="pt-4 mt-auto flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Play className="h-3 w-3" />
            <span>0 runs</span>
          </div>
          <div className="flex items-center gap-1">
            <History className="h-3 w-3" />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
      <div className="p-4 border-t bg-muted/20 flex items-center justify-between">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onEdit}>
            <SettingsIcon className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="h-8 text-xs hover:text-destructive" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </Card>
  );
}

export default AiAgents;

