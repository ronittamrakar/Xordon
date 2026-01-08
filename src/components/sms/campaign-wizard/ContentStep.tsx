import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, FileText as FileTextIcon, Code, X } from 'lucide-react';
import { CampaignData } from './types';

interface ContentStepProps {
    campaignData: CampaignData;
    updateCampaignData: (updates: Partial<CampaignData>) => void;
}

export const ContentStep = ({ campaignData, updateCampaignData }: ContentStepProps) => {
    const [showTemplateDialog, setShowTemplateDialog] = useState(false);

    const loadTemplate = (template: string) => {
        updateCampaignData({ message: template });
        setShowTemplateDialog(false);
    };

    const loadSampleVariables = () => {
        const sampleMessage = `Hi {{firstName}}, this is a sample message from {{company}}. Reply STOP to unsubscribe.`;
        updateCampaignData({ message: sampleMessage });
    };

    const smsTemplates = [
        {
            name: "Welcome Message",
            content: "Welcome {{firstName}}! Thanks for joining {{company}}. We're excited to have you on board."
        },
        {
            name: "Appointment Reminder",
            content: "Hi {{firstName}}, this is a reminder about your appointment tomorrow at {{company}}."
        },
        {
            name: "Follow-up Message",
            content: "Hi {{firstName}}, just following up from our conversation. Let me know if you have any questions about {{company}}."
        },
        {
            name: "Promotional Offer",
            content: "Hey {{firstName}}! {{company}} has a special offer just for you. Reply YES to learn more."
        }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Create SMS Message
                </CardTitle>
                <CardDescription>
                    Write your SMS message content
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-2 mb-4">
                    <Button variant="outline" size="sm" onClick={() => setShowTemplateDialog(true)}>
                        <FileTextIcon className="h-4 w-4 mr-1" />
                        Use Template
                    </Button>
                    <Button variant="outline" size="sm" onClick={loadSampleVariables}>
                        <Code className="h-4 w-4 mr-1" />
                        Load Sample Variables
                    </Button>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="message">Message Content</Label>
                    <Textarea
                        id="message"
                        placeholder="Enter your SMS message..."
                        value={campaignData.message}
                        onChange={(e) => updateCampaignData({ message: e.target.value })}
                        className="min-h-[120px]"
                        maxLength={1600}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{campaignData.message.length}/1600 characters</span>
                        <span>{Math.ceil(campaignData.message.length / 160)} SMS parts</span>
                    </div>
                </div>

                {showTemplateDialog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Choose SMS Template</h3>
                                <Button variant="ghost" size="sm" onClick={() => setShowTemplateDialog(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {smsTemplates.map((template, index) => (
                                    <div key={index} className="border rounded-lg p-4 hover:bg-muted cursor-pointer" onClick={() => loadTemplate(template.content)}>
                                        <h4 className="font-medium mb-2">{template.name}</h4>
                                        <p className="text-sm text-muted-foreground mb-2">{template.content}</p>
                                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); loadTemplate(template.content); }}>
                                            Use Template
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-muted/50 border p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-foreground">Available Variables</h4>
                    <div className="flex flex-wrap gap-2">
                        {['{{firstName}}', '{{lastName}}', '{{company}}', '{{phone}}'].map(variable => (
                            <Badge
                                key={variable}
                                variant="secondary"
                                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                onClick={() => {
                                    const textarea = document.getElementById('message') as HTMLTextAreaElement;
                                    if (textarea) {
                                        const start = textarea.selectionStart;
                                        const end = textarea.selectionEnd;
                                        const newMessage = campaignData.message.substring(0, start) + variable + campaignData.message.substring(end);
                                        updateCampaignData({ message: newMessage });
                                        textarea.focus();
                                    }
                                }}
                            >
                                {variable}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="bg-muted/50 border p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-foreground">Message Preview</h4>
                    <div className="bg-background p-3 rounded border text-foreground whitespace-pre-wrap">
                        {campaignData.message || 'Your message will appear here...'}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                        Preview shows how your message will appear to recipients
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
