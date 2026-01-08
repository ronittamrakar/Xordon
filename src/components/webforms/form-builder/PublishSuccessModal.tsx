import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    CheckCircle2,
    Copy,
    ExternalLink,
    QrCode,
    Facebook,
    Linkedin,
    Mail,
    Code2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PublishSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    formId: string;
    formTitle: string;
    onSetupEmail: () => void;
    onEmbed: () => void;
}

export function PublishSuccessModal({
    isOpen,
    onClose,
    formId,
    formTitle,
    onSetupEmail,
    onEmbed,
}: PublishSuccessModalProps) {
    // Construct a public URL - using window.location.origin as base
    const publicUrl = `${window.location.origin}/forms/public/${formId}`;

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(publicUrl);
        toast.success('Link copied to clipboard!');
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden bg-background">
                <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-2 flex flex-row items-center justify-between border-b-0 space-y-0">
                    <DialogTitle className="text-xl font-semibold text-foreground">
                        Share Your Form
                    </DialogTitle>
                </DialogHeader>

                <div className="p-4 sm:p-6 pt-2 space-y-6">
                    {/* Success Banner */}
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md p-3 flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm">Your Form has been published !</span>
                    </div>

                    {/* Share Link Section */}
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Share your form link to start getting submissions.
                        </p>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    readOnly
                                    value={publicUrl}
                                    className="pr-10 h-10 bg-background"
                                />
                                <a
                                    href={publicUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                            <Button
                                onClick={handleCopyUrl}
                                className="bg-[#6366F1] hover:bg-[#5558DD] text-white min-w-[80px]"
                            >
                                Copy
                            </Button>
                        </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                            <QrCode className="w-5 h-5" />
                            <span>Generate QR code</span>
                        </button>

                        <div className="flex items-center gap-3">
                            <button className="text-muted-foreground hover:text-[#1877F2] transition-colors">
                                <Facebook className="w-5 h-5" />
                            </button>
                            <button className="text-muted-foreground hover:text-foreground transition-colors">
                                {/* Fallback to Twitter if X icon doesn't exist, though typically it does now */}
                                <span className="w-5 h-5 flex items-center justify-center font-bold text-lg">𝕏</span>
                            </button>
                            <button className="text-muted-foreground hover:text-[#0A66C2] transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </button>
                            <button className="text-muted-foreground hover:text-[#EA4335] transition-colors">
                                <Mail className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* More Actions Section */}
                    <div className="space-y-3 pt-2">
                        <p className="text-sm font-medium text-foreground">
                            What you can do more:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Setup Email Notifications Card */}
                            <div
                                className="group relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background p-4 pt-12 text-center cursor-pointer transition-all hover:shadow-md"
                                onClick={onSetupEmail}
                            >
                                <div className="absolute top-0 left-0 w-full h-full opacity-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
                                <div className="relative z-10 flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-2">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    {/* Abstract UI representation */}
                                    <div className="w-32 h-16 bg-white dark:bg-card rounded-md shadow-sm border border-purple-100 dark:border-purple-900/50 p-2 flex flex-col gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity mb-2">
                                        <div className="h-1.5 w-1/3 bg-purple-200 dark:bg-purple-800 rounded-full"></div>
                                        <div className="h-1.5 w-2/3 bg-muted rounded-full"></div>
                                        <div className="h-1.5 w-1/2 bg-muted rounded-full"></div>
                                    </div>
                                </div>
                                <div className="relative z-10 bg-white dark:bg-card border-t border-border mt-4 -mx-4 -mb-4 p-3 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                    Setup Email Notifications
                                </div>
                            </div>

                            {/* Embed Form Card */}
                            <div
                                className="group relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background p-4 pt-12 text-center cursor-pointer transition-all hover:shadow-md"
                                onClick={onEmbed}
                            >
                                <div className="absolute top-0 left-0 w-full h-full opacity-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
                                <div className="relative z-10 flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-2">
                                        <Code2 className="w-6 h-6" />
                                    </div>
                                    {/* Abstract UI representation */}
                                    <div className="w-32 h-16 bg-white dark:bg-card rounded-md shadow-sm border border-orange-100 dark:border-orange-900/50 flex overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity mb-2">
                                        <div className="w-1/3 bg-orange-50 dark:bg-orange-900/20 h-full border-r border-orange-100/50"></div>
                                        <div className="w-2/3 p-2 flex flex-col gap-1.5">
                                            <div className="h-1.5 w-1/2 bg-orange-200 dark:bg-orange-800 rounded-full"></div>
                                            <div className="h-1.5 w-full bg-muted rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative z-10 bg-white dark:bg-card border-t border-border mt-4 -mx-4 -mb-4 p-3 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                    Embed your Form
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
