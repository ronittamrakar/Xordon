import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText as FileTextIcon } from 'lucide-react';
import { CampaignData } from './types';

interface InfoStepProps {
    campaignData: CampaignData;
    updateCampaignData: (updates: Partial<CampaignData>) => void;
}

export const InfoStep = ({ campaignData, updateCampaignData }: InfoStepProps) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <FileTextIcon className="h-5 w-5" />
                Campaign Information
            </CardTitle>
            <CardDescription>
                Set up your campaign name and description
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="campaign-name">Campaign Name *</Label>
                <Input
                    id="campaign-name"
                    placeholder="Enter campaign name..."
                    value={campaignData.name}
                    onChange={(e) => updateCampaignData({ name: e.target.value })}
                    maxLength={100}
                />
                <div className="text-sm text-muted-foreground">
                    {campaignData.name.length}/100 characters
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="campaign-description">Description</Label>
                <Textarea
                    id="campaign-description"
                    placeholder="Enter campaign description (optional)..."
                    value={campaignData.description}
                    onChange={(e) => updateCampaignData({ description: e.target.value })}
                    className="min-h-[80px]"
                    maxLength={500}
                />
                <div className="text-sm text-muted-foreground">
                    {campaignData.description.length}/500 characters
                </div>
            </div>
        </CardContent>
    </Card>
);
