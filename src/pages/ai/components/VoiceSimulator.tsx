import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, Send, PhoneOff, Phone, User, Bot, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { aiContentApi } from '@/services/aiContentApi';

interface VoiceSimulatorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    agent: any;
}

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

export const VoiceSimulator: React.FC<VoiceSimulatorProps> = ({ open, onOpenChange, agent }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isCallActive, setIsCallActive] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open && agent) {
            setMessages([
                {
                    role: 'system',
                    content: `Connecting to ${agent.name}...`,
                    timestamp: new Date()
                }
            ]);
            setIsCallActive(true);

            // Simulate initial greeting
            setTimeout(() => {
                const greeting = agent.config?.llm?.systemPrompt
                    ? "Agent connected. How can I help you today?"
                    : "Hello! I'm ready to take your call.";

                addMessage('assistant', greeting);
            }, 1500);
        } else {
            setIsCallActive(false);
            setMessages([]);
        }
    }, [open, agent]);

    const addMessage = (role: 'user' | 'assistant' | 'system', content: string) => {
        setMessages(prev => [...prev, { role, content, timestamp: new Date() }]);
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, 100);
    };

    const handleSend = async () => {
        if (!input.trim() || !isCallActive) return;

        const userMsg = input;
        setInput('');
        addMessage('user', userMsg);
        setIsProcessing(true);

        try {
            // In a real app, this would use the real voice/agent API
            // Here we'll use the content generation API to simulate a response
            const prompt = `You are a voice agent named ${agent.name}. 
            Your role is: ${agent.config?.llm?.systemPrompt || 'Helpful assistant'}.
            User said: "${userMsg}".
            Respond briefly as if speaking on the phone.`;

            const response = await aiContentApi.generateAiContent({
                channel: 'chat',
                action: 'create',
                prompt: prompt,
                context: { type: 'simulation' }
            });

            if (response && response.output) {
                addMessage('assistant', response.output);
            } else {
                addMessage('assistant', "I'm having trouble hearing you. Could you repeat that?");
            }
        } catch (error) {
            addMessage('system', "Connection quality issues detected. Please try again.");
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEndCall = () => {
        setIsCallActive(false);
        addMessage('system', 'Call ended.');
        setTimeout(() => onOpenChange(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-4 border-b bg-muted/30">
                    <DialogTitle className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${isCallActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        {agent?.name || 'Voice Agent'}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2 text-xs">
                        {isCallActive ? 'Call in progress' : 'Disconnected'} • {agent?.type === 'voice' ? 'Voice Mode' : 'Chat Mode'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden relative bg-slate-50 dark:bg-slate-950/50">
                    <ScrollArea className="h-full p-4" ref={scrollRef}>
                        <div className="space-y-4">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex w-full ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`}
                                >
                                    {msg.role === 'system' ? (
                                        <Badge variant="outline" className="text-xs text-muted-foreground font-normal bg-background/50">
                                            {msg.content}
                                        </Badge>
                                    ) : (
                                        <div className={`flex items-start gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                            </div>
                                            <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user'
                                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                    : 'bg-white dark:bg-muted rounded-tl-none shadow-sm border'
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isProcessing && (
                                <div className="flex justify-start">
                                    <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-full">
                                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">Thinking...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <div className="p-4 border-t bg-background">
                    <div className="flex items-center gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={isCallActive ? "Type to speak..." : "Call ended"}
                            disabled={!isCallActive || isProcessing}
                            className="flex-1"
                        />
                        {isCallActive ? (
                            <Button size="icon" onClick={handleSend} disabled={!input.trim() || isProcessing}>
                                <Send className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button size="icon" variant="outline" onClick={() => {
                                setMessages([]);
                                setIsCallActive(true);
                                addMessage('system', 'Reconnecting...');
                                setTimeout(() => addMessage('assistant', 'Hello again!'), 1500);
                            }}>
                                <Phone className="h-4 w-4 text-green-600" />
                            </Button>
                        )}

                        {isCallActive && (
                            <Button size="icon" variant="destructive" onClick={handleEndCall}>
                                <PhoneOff className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <p className="text-[12px] text-center text-muted-foreground mt-2">
                        <Mic className="h-3 w-3 inline mr-1 align-text-bottom" />
                        Microphone access is simulated in this demo
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};
