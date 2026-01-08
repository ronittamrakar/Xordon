import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Breadcrumb } from '@/components/Breadcrumb';
import { useAiAgents, useCreateAiAgent, useUpdateAiAgent, useDeleteAiAgent } from '@/hooks/useAiAgents';
import { ConversationAi } from './components/ConversationAi';
import { CreateBotWizard } from './components/CreateBotWizard';
import { AgentConfig } from './components/AgentConfig';
import { MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdvancedChatbot from './AdvancedChatbot';

const ConversationAIPage: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { data: agents = [], isLoading } = useAiAgents();
    const createMutation = useCreateAiAgent();
    const updateMutation = useUpdateAiAgent();
    const deleteMutation = useDeleteAiAgent();

    const [isBotWizardOpen, setIsBotWizardOpen] = useState(false);
    const [convAiView, setConvAiView] = useState<'list' | 'config'>('list');
    const [editingBot, setEditingBot] = useState<any | null>(null);

    // Filter for conversation/chat agents only
    const chatAgents = agents.filter((agent: any) => agent.type === 'chat' || agent.type === 'conversation');

    const handleAction = (action: string) => {
        if (action === 'create-bot-wizard') {
            setIsBotWizardOpen(true);
        } else if (action === 'manage-kb') {
            navigate('/ai/knowledge-hub');
        } else if (action.startsWith('edit-')) {
            const agentId = action.replace('edit-', '');
            const agent = chatAgents.find((a: any) => a.id === agentId);
            if (agent) {
                setEditingBot(agent);
                setConvAiView('config');
            }
        } else if (action.startsWith('delete-')) {
            const agentId = action.replace('delete-', '');
            handleDelete(agentId);
        }
    };

    const handleWizardComplete = (config: any) => {
        createMutation.mutate(
            {
                name: config.name || 'New Conversation Bot',
                type: 'conversation',
                config: config
            },
            {
                onSuccess: (data) => {
                    setIsBotWizardOpen(false);
                    setEditingBot(data);
                    setConvAiView('config');
                    toast({ title: 'Success', description: 'Bot created successfully' });
                },
                onError: () => {
                    toast({ title: 'Error', description: 'Failed to create bot', variant: 'destructive' });
                },
            }
        );
    };

    const handleSaveConfig = (data: any) => {
        if (editingBot?.id) {
            // Destructure top-level fields
            const { name, status, ...configData } = data;

            // Prepare payload for API
            const payload = {
                name,
                status,
                config: configData
            };

            updateMutation.mutate(
                { id: editingBot.id, data: payload },
                {
                    onSuccess: () => {
                        setConvAiView('list');
                        setEditingBot(null);
                        toast({ title: 'Success', description: 'Bot updated successfully' });
                    },
                    onError: () => {
                        toast({ title: 'Error', description: 'Failed to update bot', variant: 'destructive' });
                    },
                }
            );
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this conversation bot?')) return;

        deleteMutation.mutate(id, {
            onSuccess: () => {
                toast({ title: 'Success', description: 'Bot deleted successfully' });
            },
            onError: () => {
                toast({ title: 'Error', description: 'Failed to delete bot', variant: 'destructive' });
            },
        });
    };

    return (
        <>
            <Breadcrumb items={[{ label: 'AI' }, { label: 'Conversation AI' }]} />

            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">Conversation AI</h1>
                    <p className="text-muted-foreground mt-1">Manage your chat bots and automated conversations</p>
                </div>
            </div>

            <Tabs defaultValue="agents" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="agents">Agents</TabsTrigger>
                    <TabsTrigger value="chatbot">Advanced Chatbot</TabsTrigger>
                </TabsList>

                <TabsContent value="agents" className="space-y-4">
                    {convAiView === 'list' ? (
                        <ConversationAi onAction={handleAction} />
                    ) : (
                        <AgentConfig
                            agent={editingBot}
                            onSave={handleSaveConfig}
                            onCancel={() => {
                                setConvAiView('list');
                                setEditingBot(null);
                            }}
                        />
                    )}
                </TabsContent>

                <TabsContent value="chatbot">
                    <AdvancedChatbot />
                </TabsContent>
            </Tabs>

            <CreateBotWizard
                open={isBotWizardOpen}
                onOpenChange={setIsBotWizardOpen}
                onComplete={handleWizardComplete}
            />
        </>
    );
};

export default ConversationAIPage;
