import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, Plus, FileText as FileTextIcon, X, MessageSquare } from 'lucide-react';
import { CampaignData } from './types';
import { FollowUpMessage } from '@/lib/sms-api';

interface FollowUpsStepProps {
    campaignData: CampaignData;
    updateCampaignData: (updates: Partial<CampaignData>) => void;
}

export const FollowUpsStep = ({ campaignData, updateCampaignData }: FollowUpsStepProps) => {
    const [newFollowUp, setNewFollowUp] = useState<{
        delay_days: number;
        delay_hours: number;
        message: string;
        condition: FollowUpMessage['condition'];
    }>({ delay_days: 1, delay_hours: 0, message: '', condition: 'always' });
    const [showTemplates, setShowTemplates] = useState(false);

    const addFollowUp = () => {
        if (newFollowUp.message.trim()) {
            const followUp: FollowUpMessage = {
                id: Date.now().toString(),
                delay_days: newFollowUp.delay_days,
                delay_hours: newFollowUp.delay_hours,
                message: newFollowUp.message,
                condition: newFollowUp.condition,
            };

            updateCampaignData({
                follow_up_messages: [...(campaignData.follow_up_messages || []), followUp]
            });

            // Reset form
            setNewFollowUp({ delay_days: 1, delay_hours: 0, message: '', condition: 'always' });
        }
    };

    const removeFollowUp = (id: string) => {
        updateCampaignData({
            follow_up_messages: (campaignData.follow_up_messages || []).filter(fu => fu.id !== id)
        });
    };

    const moveFollowUp = (id: string, direction: 'up' | 'down') => {
        const messages = [...(campaignData.follow_up_messages || [])];
        const index = messages.findIndex(fu => fu.id === id);

        if (
            (direction === 'up' && index > 0) ||
            (direction === 'down' && index < messages.length - 1)
        ) {
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            [messages[index], messages[newIndex]] = [messages[newIndex], messages[index]];
            updateCampaignData({ follow_up_messages: messages });
        }
    };

    const followUpTemplates = [
        { name: 'Thank You', content: 'Thank you for your interest! Is there anything else I can help you with?' },
        { name: 'Reminder', content: 'Just checking in to see if you have any questions about our services.' },
        { name: 'Special Offer', content: 'We have a special offer just for you! Reply INTERESTED to learn more.' },
        { name: 'Feedback', content: 'We\'d love to hear your feedback. Reply with your thoughts!' },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Follow-up Messages
                </CardTitle>
                <CardDescription>
                    Add automated follow-up messages to your campaign (optional)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Existing follow-ups */}
                {campaignData.follow_up_messages && campaignData.follow_up_messages.length > 0 && (
                    <div className="space-y-3">
                        <Label>Current Follow-ups</Label>
                        {campaignData.follow_up_messages.map((followUp, index) => (
                            <div key={followUp.id} className="p-3 border rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">#{index + 1}</Badge>
                                        <Badge variant="secondary">{followUp.delay_days} days</Badge>
                                        <Badge variant="outline">{followUp.condition}</Badge>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => moveFollowUp(followUp.id, 'up')}
                                            disabled={index === 0}
                                        >
                                            ↑
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => moveFollowUp(followUp.id, 'down')}
                                            disabled={index === campaignData.follow_up_messages!.length - 1}
                                        >
                                            ↓
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFollowUp(followUp.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">{followUp.message}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add new follow-up */}
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Label>Add New Follow-up</Label>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="delay-days">Delay (days)</Label>
                            <Input
                                id="delay-days"
                                type="number"
                                min="1"
                                max="365"
                                value={newFollowUp.delay_days}
                                onChange={(e) => setNewFollowUp({ ...newFollowUp, delay_days: parseInt(e.target.value) || 1 })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="condition">Condition</Label>
                            <Select
                                value={newFollowUp.condition}
                                onValueChange={(value: 'always' | 'no_reply') =>
                                    setNewFollowUp({ ...newFollowUp, condition: value })
                                }
                            >
                                <SelectTrigger id="condition">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="always">Always send</SelectItem>
                                    <SelectItem value="no_reply">If no reply</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end">
                            <Button onClick={() => setShowTemplates(true)} variant="outline">
                                <FileTextIcon className="h-4 w-4 mr-2" />
                                Templates
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="follow-up-message">Message</Label>
                        <Textarea
                            id="follow-up-message"
                            placeholder="Enter your follow-up message..."
                            value={newFollowUp.message}
                            onChange={(e) => setNewFollowUp({ ...newFollowUp, message: e.target.value })}
                            className="min-h-[80px]"
                            maxLength={1600}
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{newFollowUp.message.length}/1600 characters</span>
                            <span>{Math.ceil(newFollowUp.message.length / 160)} SMS parts</span>
                        </div>
                    </div>

                    <Button onClick={addFollowUp} disabled={!newFollowUp.message.trim()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Follow-up
                    </Button>
                </div>

                {/* Templates dialog */}
                {showTemplates && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Follow-up Templates</h3>
                                <Button variant="ghost" onClick={() => setShowTemplates(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {followUpTemplates.map((template) => (
                                    <div key={template.name} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                        onClick={() => {
                                            setNewFollowUp({ ...newFollowUp, message: template.content });
                                            setShowTemplates(false);
                                        }}>
                                        <h4 className="font-medium">{template.name}</h4>
                                        <p className="text-sm text-muted-foreground">{template.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {(!campaignData.follow_up_messages || campaignData.follow_up_messages.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No follow-up messages added yet</p>
                        <p className="text-sm">Add follow-up messages above to create an automated sequence</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
