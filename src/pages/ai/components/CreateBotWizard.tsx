import React, { useState } from 'react';
import {
    Layout,
    MessageSquare,
    Workflow,
    Check,
    Calendar,
    UserCircle2,
    ArrowRight
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

interface CreateBotWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete: (config: any) => void;
}

export const CreateBotWizard: React.FC<CreateBotWizardProps> = ({ open, onOpenChange, onComplete }) => {
    const [step, setStep] = useState(1);
    const [wizardType, setWizardType] = useState<string | null>(null);
    const [guidedType, setGuidedType] = useState<string>('qa');
    const [botName, setBotName] = useState('');

    const handleNext = () => {
        if (step === 1) {
            if (wizardType === 'guided') setStep(2);
            else setStep(3); // Go to naming step
        } else if (step === 2) {
            setStep(3); // Go to naming step
        } else if (step === 3) {
            onComplete({
                type: wizardType,
                subtype: wizardType === 'guided' ? guidedType : null,
                name: botName
            });
        }
    };

    const closeWizard = () => {
        setStep(1);
        setWizardType(null);
        setBotName('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={closeWizard}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b">
                    <DialogTitle>
                        {step === 1 ? 'Choose Bot Architecture' :
                            step === 2 ? 'Select AI Template' :
                                'Last Step: Identity'}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        {step === 1 ? 'Select the engine that will power your AI representative' :
                            step === 2 ? 'Quick-start your bot with a pre-configured objective' :
                                'Give your new AI employee a professional name'}
                    </p>
                </DialogHeader>

                <div className="p-8">
                    {step === 1 ? (
                        <div className="grid gap-6 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Guided Form Setup */}
                            <WizardCard
                                active={wizardType === 'guided'}
                                onClick={() => setWizardType('guided')}
                                icon={<Layout className="h-5 w-5 text-blue-600" />}
                                title="Guided Setup"
                                desc="Ideal for straightforward lead capture and booking without complex logic."
                                color="bg-blue-500/10"
                                badge="Beginner Friendly"
                                features={[
                                    "Dynamic Forms",
                                    "Calendar Connect",
                                    "Standard Q&A"
                                ]}
                            />

                            {/* Prompt Based Bot */}
                            <WizardCard
                                active={wizardType === 'prompt'}
                                onClick={() => setWizardType('prompt')}
                                icon={<MessageSquare className="h-5 w-5 text-purple-600" />}
                                title="Prompt Native"
                                desc="Engineered for precision via custom system instructions and persona mapping."
                                color="bg-purple-500/10"
                                badge="Pro Choice"
                                features={[
                                    "Custom Directives",
                                    "Persona Tuning",
                                    "Knowledge Base"
                                ]}
                            />

                            {/* Flow Based Builder */}
                            <WizardCard
                                active={wizardType === 'flow'}
                                onClick={() => setWizardType('flow')}
                                icon={<Workflow className="h-5 w-5 text-primary" />}
                                title="Visual Flow"
                                desc="The most powerful builder using visual logic nodes and conditional branching."
                                color="bg-primary/10"
                                badge="Advanced"
                                isNew
                                features={[
                                    "Visual Logic Tree",
                                    "Conditional Splits",
                                    "Multi-turn Memory"
                                ]}
                            />
                        </div>
                    ) : step === 2 ? (
                        <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
                            {/* General Q&A */}
                            <div
                                onClick={() => setGuidedType('qa')}
                                className={`relative cursor-pointer group rounded-lg border-2 p-6 transition-all h-full flex flex-col ${guidedType === 'qa'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="space-y-1">
                                        <h4 className="text-lg font-semibold">General Q&A</h4>
                                        <p className="text-sm text-muted-foreground">Auto-answer queries using your Wiki.</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${guidedType === 'qa' ? 'border-primary bg-primary' : 'border-muted'}`}>
                                        {guidedType === 'qa' && <Check className="h-3 w-3 text-white" />}
                                    </div>
                                </div>
                                <div className="flex-1 rounded-md bg-muted/20 flex flex-col justify-end border border-dashed border-muted-foreground/20 relative overflow-hidden p-4 gap-3">
                                    <div className="h-8 w-3/4 bg-primary/20 rounded-md rounded-bl-none" />
                                    <div className="h-8 w-2/3 bg-white dark:bg-slate-800 rounded-md rounded-br-none ml-auto shadow-sm" />
                                    <div className="h-8 w-3/5 bg-primary/20 rounded-md rounded-bl-none" />
                                </div>
                            </div>

                            {/* Appointment Booking */}
                            <div
                                onClick={() => setGuidedType('booking')}
                                className={`relative cursor-pointer group rounded-lg border-2 p-6 transition-all h-full flex flex-col ${guidedType === 'booking'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="space-y-1">
                                        <h4 className="text-lg font-semibold">Booking Bot</h4>
                                        <p className="text-sm text-muted-foreground">Assistant for lead conversion & scheduling.</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${guidedType === 'booking' ? 'border-primary bg-primary' : 'border-muted'}`}>
                                        {guidedType === 'booking' && <Check className="h-3 w-3 text-white" />}
                                    </div>
                                </div>
                                <div className="flex-1 rounded-md bg-muted/20 flex items-center justify-center border border-dashed border-muted-foreground/20 relative overflow-hidden p-4">
                                    <div className="w-full grid grid-cols-3 gap-2 opacity-40">
                                        {[...Array(9)].map((_, i) => (
                                            <div key={i} className="aspect-square bg-muted/80 rounded-sm" />
                                        ))}
                                    </div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/40 rotate-12">
                                        <Calendar className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-md mx-auto py-8 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto relative">
                                <UserCircle2 className="h-10 w-10 text-primary" />
                            </div>
                            <div className="space-y-4">
                                <Label htmlFor="bot-name" className="text-center block">Internal Name</Label>
                                <Input
                                    id="bot-name"
                                    autoFocus
                                    placeholder="e.g. Sales Specialist Bot"
                                    value={botName}
                                    onChange={(e) => setBotName(e.target.value)}
                                    className="h-12 text-lg text-center"
                                />
                                <p className="text-center text-xs text-muted-foreground">
                                    You can change this later in the bot settings.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t bg-muted/50">
                    <Button variant="outline" onClick={step > 1 ? () => setStep(step - 1) : closeWizard}>
                        {step === 1 ? 'Cancel' : 'Go Back'}
                    </Button>
                    <Button
                        disabled={(!wizardType && step === 1) || (step === 3 && !botName.trim())}
                        onClick={handleNext}
                    >
                        {step === 3 ? 'Launch Bot' : 'Continue'}
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const WizardCard = ({ active, onClick, icon, title, desc, color, features, badge, isNew }: any) => (
    <div
        onClick={onClick}
        className={`relative cursor-pointer group rounded-xl border-2 p-6 transition-all h-full flex flex-col ${active
            ? 'border-primary bg-primary/5 shadow-md'
            : 'border-muted hover:border-primary/40 hover:bg-muted/30'
            }`}
    >
        {isNew && (
            <Badge className="absolute -top-3 -right-2 bg-primary text-primary-foreground border-none py-0.5 px-2 text-[12px] uppercase font-bold shadow-sm">New</Badge>
        )}
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
