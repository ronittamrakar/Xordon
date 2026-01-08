import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import { CampaignData, ExtendedSMSRecipient } from './types';
import { SMSSendingAccount } from '@/lib/sms-api';

interface ReviewStepProps {
    campaignData: CampaignData;
    sendingAccounts: SMSSendingAccount[];
    recipients: ExtendedSMSRecipient[];
    selectedRecipients: string[];
}

export const ReviewStep = ({ campaignData, sendingAccounts, recipients, selectedRecipients }: ReviewStepProps) => {
    const selectedRecipientData = recipients.filter((r: ExtendedSMSRecipient) => selectedRecipients.includes(r.id));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Review Campaign
                </CardTitle>
                <CardDescription>
                    Review your campaign settings before launching
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">Campaign Details</h4>
                            <div className="space-y-1 text-sm">
                                <div><span className="text-muted-foreground">Name:</span> {campaignData.name}</div>
                                <div><span className="text-muted-foreground">Description:</span> {campaignData.description || 'N/A'}</div>
                                <div><span className="text-muted-foreground">Message:</span> {campaignData.message}</div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">Sending Configuration</h4>
                            <div className="space-y-1 text-sm">
                                <div><span className="text-muted-foreground">Sender Number:</span> {sendingAccounts.find((acc: SMSSendingAccount) => acc.id === campaignData.sender_id)?.phone_number || campaignData.sender_id || 'N/A'}</div>
                                <div><span className="text-muted-foreground">Schedule:</span> {campaignData.scheduled_at ? 'Scheduled' : 'Immediate'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">Recipients</h4>
                            <div className="text-sm">
                                <div><span className="text-muted-foreground">Total Recipients:</span> {selectedRecipientData.length}</div>
                                <div><span className="text-muted-foreground">Follow-ups:</span> {campaignData.follow_up_messages?.length || 0}</div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">Delivery Settings</h4>
                            <div className="space-y-1 text-sm">
                                <div><span className="text-muted-foreground">Timezone:</span> {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
                                <div><span className="text-muted-foreground">Quiet Hours:</span> {campaignData.respect_quiet_hours ? 'Enabled' : 'Disabled'}</div>
                                <div><span className="text-muted-foreground">Send Rate:</span> {campaignData.throttle_rate} messages/batch</div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
