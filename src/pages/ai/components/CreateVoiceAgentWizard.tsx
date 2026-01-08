import React, { useState } from 'react';
import {
    Mic,
    PhoneCall,
    PhoneForwarded,
    ArrowRight,
    Check,
    Bot,
    Languages
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreateVoiceAgentWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete: (config: any) => void;
}

export const CreateVoiceAgentWizard: React.FC<CreateVoiceAgentWizardProps> = ({ open, onOpenChange, onComplete }) => {
    const [step, setStep] = useState(1);
    const [agentType, setAgentType] = useState<string | null>(null); // inbound | outbound
    const [useCase, setUseCase] = useState<string>('customer-support');
    const [agentName, setAgentName] = useState('');
    const [startLanguage, setStartLanguage] = useState('en-US');

    const handleNext = () => {
        if (step === 1) {
            setStep(2);
        } else if (step === 2) {
            setStep(3);
        } else if (step === 3) {
            onComplete({
                type: 'voice',
                direction: agentType,
                subtype: useCase,
                name: agentName,
                language: startLanguage
            });
        }
    };

    const closeWizard = () => {
        setStep(1);
        setAgentType(null);
        setAgentName('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={closeWizard}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b">
                    <DialogTitle>
                        {step === 1 ? 'Select Agent Direction' :
                            step === 2 ? 'Choose Use Case' :
                                'Final Details'}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        {step === 1 ? 'Determine if this agent will receive calls or make them' :
                            step === 2 ? 'Does this agent have a specific job?' :
                                'Give your voice agent an identity'}
                    </p>
                </DialogHeader>

                <div className="p-8">
                    {step === 1 ? (
                        <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Inbound */}
                            <WizardCard
                                active={agentType === 'inbound'}
                                onClick={() => setAgentType('inbound')}
                                icon={<PhoneCall className="h-6 w-6 text-blue-600" />}
                                title="Inbound Receptionist"
                                desc="Handles incoming calls from customers. Perfect for support, booking, and inquiries."
                                color="bg-blue-500/10"
                                badge="Most Popular"
                                features={[
                                    "24/7 Availability",
                                    "Call Routing",
                                    "Instant Response"
                                ]}
                            />

                            {/* Outbound */}
                            <WizardCard
                                active={agentType === 'outbound'}
                                onClick={() => setAgentType('outbound')}
                                icon={<PhoneForwarded className="h-6 w-6 text-emerald-600" />}
                                title="Outbound Caller"
                                desc="Proactively calls leads or customers. Ideal for sales qualification, reminders, and surveys."
                                color="bg-emerald-500/10"
                                badge="Sales Ready"
                                features={[
                                    "List Dialing",
                                    "Appointment Reminders",
                                    "Follow-ups"
                                ]}
                            />
                        </div>
                    ) : step === 2 ? (
                        <div className="grid gap-4 md:grid-cols-3 animate-in fade-in zoom-in-95 duration-500">
                            <UseCaseCard
                                id="customer-support"
                                title="Customer Support"
                                icon={<Bot className="h-5 w-5" />}
                                active={useCase === 'customer-support'}
                                onClick={() => setUseCase('customer-support')}
                            />
                            <UseCaseCard
                                id="appointment-booking"
                                title="Appointment Booking"
                                icon={<Check className="h-5 w-5" />}
                                active={useCase === 'appointment-booking'}
                                onClick={() => setUseCase('appointment-booking')}
                            />
                            <UseCaseCard
                                id="survey"
                                title="Survey & Feedback"
                                icon={<Languages className="h-5 w-5" />}
                                active={useCase === 'survey'}
                                onClick={() => setUseCase('survey')}
                            />
                        </div>
                    ) : (
                        <div className="max-w-md mx-auto py-8 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto relative">
                                <Mic className="h-10 w-10 text-primary" />
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="agent-name">Agent Name</Label>
                                    <Input
                                        id="agent-name"
                                        autoFocus
                                        placeholder="e.g. Front Desk Alice"
                                        value={agentName}
                                        onChange={(e) => setAgentName(e.target.value)}
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Primary Language</Label>
                                    <Select value={startLanguage} onValueChange={setStartLanguage}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en-US">English (US)</SelectItem>
                                            <SelectItem value="en-GB">English (UK)</SelectItem>
                                            <SelectItem value="es-ES">Spanish</SelectItem>
                                            <SelectItem value="fr-FR">French</SelectItem>
                                            <SelectItem value="de-DE">German</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t bg-muted/50">
                    <Button variant="outline" onClick={step > 1 ? () => setStep(step - 1) : closeWizard}>
                        {step === 1 ? 'Cancel' : 'Go Back'}
                    </Button>
                    <Button
                        disabled={(!agentType && step === 1) || (step === 3 && !agentName.trim())}
                        onClick={handleNext}
                    >
                        {step === 3 ? 'Create Agent' : 'Continue'}
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const WizardCard = ({ active, onClick, icon, title, desc, color, features, badge }: any) => (
    <div
        onClick={onClick}
        className={`relative cursor-pointer group rounded-xl border-2 p-6 transition-all h-full flex flex-col ${active
            ? 'border-primary bg-primary/5 shadow-md'
            : 'border-muted hover:border-primary/40 hover:bg-muted/30'
            }`}
    >
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4 transition-transform`}>
            {icon}
        </div>
        <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6 flex-1">
            {desc}
        </p>
        <div className="space-y-2 mb-6">
            {features.map((f: string) => <FeatureItem key={f} label={f} />)}
        </div>
        <div className="pt-4 border-t mt-auto">
            <Badge variant="secondary" className={`text-[12px] uppercase tracking-wider ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {badge}
            </Badge>
        </div>
    </div>
);

const FeatureItem = ({ label }: { label: string }) => (
    <div className="flex items-center gap-2 text-sm font-medium">
        <Check className="h-3 w-3 text-primary" />
        <span className="text-muted-foreground text-xs">{label}</span>
    </div>
);

const UseCaseCard = ({ id, title, icon, active, onClick }: any) => (
    <div
        onClick={onClick}
        className={`cursor-pointer rounded-lg border p-4 flex items-center gap-3 transition-all ${active ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
            }`}>
        <div className={`p-2 rounded-md ${active ? 'bg-primary text-white' : 'bg-muted'}`}>
            {icon}
        </div>
        <span className="font-medium">{title}</span>
        {active && <Check className="h-4 w-4 text-primary ml-auto" />}
    </div>
)
