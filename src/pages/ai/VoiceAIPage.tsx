import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Breadcrumb } from '@/components/Breadcrumb';
import { useAiAgents, useCreateAiAgent, useUpdateAiAgent, useDeleteAiAgent } from '@/hooks/useAiAgents';
import { VoiceAi } from './components/VoiceAi';
import { CreateVoiceAgentWizard } from './components/CreateVoiceAgentWizard';
import { VoiceAgentConfig } from './components/VoiceAgentConfig';
import { VoiceSimulator } from './components/VoiceSimulator';
import { CallLogs } from './components/CallLogs';
import { Mic, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const VoiceAIPage: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { data: agents = [], isLoading } = useAiAgents();
    const createMutation = useCreateAiAgent();
    const updateMutation = useUpdateAiAgent();
    const deleteMutation = useDeleteAiAgent();

    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [voiceAiView, setVoiceAiView] = useState<'list' | 'config'>('list');
    const [editingAgent, setEditingAgent] = useState<any | null>(null);

    // Interaction States
    const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<any | null>(null);

    // Filter for voice agents only
    const voiceAgents = agents.filter((agent: any) => agent.type === 'voice');

    const handleCreate = () => {
        setIsWizardOpen(true);
    };

    const handleWizardComplete = (config: any) => {
        createMutation.mutate(
            {
                name: config.name || 'New Voice Agent',
                type: 'voice',
                config: config
            },
            {
                onSuccess: (data) => {
                    setIsWizardOpen(false);
                    setEditingAgent(data);
                    setVoiceAiView('config');
                    toast({ title: 'Success', description: 'Voice agent created successfully' });
                },
                onError: () => {
                    toast({ title: 'Error', description: 'Failed to create voice agent', variant: 'destructive' });
                },
            }
        );
    };

    const handleEdit = (agent: any) => {
        setEditingAgent(agent);
        setVoiceAiView('config');
    };

    const handleSaveConfig = (data: any) => {
        if (editingAgent?.id) {
            updateMutation.mutate(
                { id: editingAgent.id, data },
                {
                    onSuccess: () => {
                        setVoiceAiView('list');
                        setEditingAgent(null);
                        toast({ title: 'Success', description: 'Voice agent updated successfully' });
                    },
                    onError: () => {
                        toast({ title: 'Error', description: 'Failed to update voice agent', variant: 'destructive' });
                    },
                }
            );
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this voice agent?')) return;

        deleteMutation.mutate(id, {
            onSuccess: () => {
                toast({ title: 'Success', description: 'Voice agent deleted successfully' });
            },
            onError: () => {
                toast({ title: 'Error', description: 'Failed to delete voice agent', variant: 'destructive' });
            },
        });
    };

    return (
        <>
            <Breadcrumb items={[{ label: 'AI' }, { label: 'Voice AI' }]} />

            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">Voice AI Agents</h1>
                    <p className="text-muted-foreground mt-1">Manage your intelligent voice agents and phone automation</p>
                </div>
            </div>

            {voiceAiView === 'list' ? (
                <VoiceAi
                    agents={voiceAgents}
                    isLoading={isLoading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onCreateAgent={handleCreate}
                    onPlay={(agent) => {
                        setSelectedAgent(agent);
                        setIsSimulatorOpen(true);
                    }}
                    onHistory={(agent) => {
                        setSelectedAgent(agent);
                        setIsHistoryOpen(true);
                    }}
                />
            ) : (
                <VoiceAgentConfig
                    agent={editingAgent}
                    onSave={handleSaveConfig}
                    onCancel={() => {
                        setVoiceAiView('list');
                        setEditingAgent(null);
                    }}
                    onPlay={(agent) => {
                        setSelectedAgent(agent);
                        setIsSimulatorOpen(true);
                    }}
                />
            )}

            <CreateVoiceAgentWizard
                open={isWizardOpen}
                onOpenChange={setIsWizardOpen}
                onComplete={handleWizardComplete}
            />

            {/* Simulator Modal */}
            <VoiceSimulator
                open={isSimulatorOpen}
                onOpenChange={setIsSimulatorOpen}
                agent={selectedAgent}
            />

            {/* History Sheet */}
            <CallLogs
                open={isHistoryOpen}
                onOpenChange={setIsHistoryOpen}
                agent={selectedAgent}
            />
        </>
    );
};

export default VoiceAIPage;
