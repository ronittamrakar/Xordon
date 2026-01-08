import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, RefreshCw } from 'lucide-react';
import { CampaignData } from './types';

interface LaunchStepProps {
    campaignData: CampaignData;
    selectedRecipients: string[];
    handleLaunchCampaign: () => void;
    isLoading: boolean;
}

export const LaunchStep = ({ campaignData, selectedRecipients, handleLaunchCampaign, isLoading }: LaunchStepProps) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Launch Campaign
            </CardTitle>
            <CardDescription>
                Final step - launch your SMS campaign
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-hunter-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-hunter-orange" />
                </div>
                <h3 className="text-[14px] font-semibold mb-2">Ready to Launch!</h3>
                <p className="text-muted-foreground mb-6">
                    Your SMS campaign is configured and ready to be sent to {selectedRecipients.length} recipients.
                </p>

                <div className="bg-muted p-4 rounded-lg text-left max-w-md mx-auto">
                    <h4 className="font-medium mb-2">Campaign Summary:</h4>
                    <ul className="space-y-1 text-sm">
                        <li>• {selectedRecipients.length} recipients</li>
                        <li>• {campaignData.follow_up_messages?.length || 0} follow-up messages</li>
                        <li>• {campaignData.scheduled_at ? 'Scheduled delivery' : 'Send immediately'}</li>
                        <li>• {campaignData.enable_retry ? 'Retry enabled' : 'Retry disabled'}</li>
                    </ul>
                </div>
            </div>

            <div className="flex justify-center gap-4">
                <Button onClick={handleLaunchCampaign} disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Launching...
                        </>
                    ) : (
                        <>
                            <Send className="h-4 w-4 mr-2" />
                            Launch Campaign
                        </>
                    )}
                </Button>
            </div>
        </CardContent>
    </Card>
);
