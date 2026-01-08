import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MessageSquare, Plus, Zap, Phone, ChevronRight } from 'lucide-react';

interface GettingStartedProps {
    onAction?: (action: string) => void;
}

export const GettingStarted: React.FC<GettingStartedProps> = ({ onAction }) => {
    const [activeType, setActiveType] = useState<'voice' | 'conversation'>('voice');

    const voiceSteps = [
        {
            id: 'create',
            title: 'Create Your First Voice AI Agent',
            description: 'Spin up a new Voice AI agent in just a few clicks. Configure its name, greeting, and basic conversation flow to begin harnessing voice-based interactions.',
            icon: Plus,
        },
        {
            id: 'test',
            title: 'Test & Talk to Your Voice AI Agent',
            description: "Engage in a quick test call with your Voice AI agent. This helps confirm it's set up correctly, and you'll get a feel for how it handles basic conversations.",
            icon: Zap,
        },
        {
            id: 'live',
            title: 'Assign a Phone Number & Go Live',
            description: 'Link a dedicated phone number to your Voice AI agent or enable it as a backup to the phone number in case you are not around.',
            icon: Phone,
        }
    ];

    const conversationSteps = [
        {
            id: 'create-conv',
            title: 'Create Your First Chat Agent',
            description: 'Set up an AI chat agent for your website or messaging channels. Define its personality and knowledge base.',
            icon: Plus,
        },
        {
            id: 'embed',
            title: 'Embed Chat Widget',
            description: 'Copy and paste the embed code to your website to start interacting with your visitors.',
            icon: Zap,
        }
    ];

    const currentSteps = activeType === 'voice' ? voiceSteps : conversationSteps;

    return (
        <div className="flex flex-col lg:flex-row gap-8 py-6">
            {/* Sidebar Selection */}
            <div className="w-full lg:w-64 space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 px-3">Getting Started</h3>
                <Button
                    variant={activeType === 'voice' ? 'secondary' : 'ghost'}
                    onClick={() => setActiveType('voice')}
                    className="w-full justify-start gap-3 "
                >
                    <Mic className="h-4 w-4" />
                    Voice AI
                </Button>
                <Button
                    variant={activeType === 'conversation' ? 'secondary' : 'ghost'}
                    onClick={() => setActiveType('conversation')}
                    className="w-full justify-start gap-3"
                >
                    <MessageSquare className="h-4 w-4" />
                    Conversation AI
                </Button>
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-6">
                <div>
                    <h2 className="text-lg font-semibold mb-1">Hey there, here are few things you can get started with</h2>
                    <p className="text-muted-foreground text-sm">Follow these steps to set up your AI agents and start automating your business.</p>
                </div>

                <div className="space-y-4">
                    {currentSteps.map((step) => (
                        <Card
                            key={step.id}
                            className="cursor-pointer hover:border-primary/50 transition-all duration-300 group shadow-sm hover:shadow-md"
                            onClick={() => onAction?.(step.id)}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center gap-6">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                                        <step.icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-base font-semibold mb-1 group-hover:text-primary transition-colors">{step.title}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};
