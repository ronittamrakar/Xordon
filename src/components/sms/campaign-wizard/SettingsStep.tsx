import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Settings } from 'lucide-react';
import { CampaignData } from './types';

interface SettingsStepProps {
    campaignData: CampaignData;
    updateCampaignData: (updates: Partial<CampaignData>) => void;
}

export const SettingsStep = ({ campaignData, updateCampaignData }: SettingsStepProps) => {
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const validateSettings = () => {
        const errors: Record<string, string> = {};

        if (campaignData.scheduled_at) {
            const scheduledDateTime = new Date(campaignData.scheduled_at);
            const now = new Date();

            if (scheduledDateTime <= now) {
                errors.scheduled_date = 'Scheduled time must be in the future';
            }
        }

        if (campaignData.respect_quiet_hours) {
            if (!campaignData.quiet_hours_start) {
                errors.quiet_hours_start = 'Quiet hours start time is required';
            }
            if (!campaignData.quiet_hours_end) {
                errors.quiet_hours_end = 'Quiet hours end time is required';
            }
        }

        if (campaignData.throttle_rate < 1 || campaignData.throttle_rate > 100) {
            errors.throttle_rate = 'Send rate must be between 1 and 100 messages per batch';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configure Schedule
                </CardTitle>
                <CardDescription>
                    Set up scheduling and delivery options for your campaign
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <Label>Schedule Type</Label>
                    <RadioGroup
                        value={campaignData.scheduled_at ? 'scheduled' : 'immediate'}
                        onValueChange={(value) => {
                            if (value === 'scheduled') {
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                tomorrow.setHours(9, 0, 0, 0);
                                updateCampaignData({ scheduled_at: tomorrow.toISOString() });
                            } else {
                                updateCampaignData({ scheduled_at: undefined });
                            }
                            setValidationErrors({});
                        }}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="immediate" id="immediate" />
                            <Label htmlFor="immediate" className="cursor-pointer">
                                Send immediately
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="scheduled" id="scheduled" />
                            <Label htmlFor="scheduled" className="cursor-pointer">
                                Schedule for later
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                {campaignData.scheduled_at && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="scheduled-date">Date</Label>
                            <Input
                                id="scheduled-date"
                                type="date"
                                value={campaignData.scheduled_at ? new Date(campaignData.scheduled_at).toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                    const date = e.target.value;
                                    const time = campaignData.scheduled_at ? new Date(campaignData.scheduled_at).toTimeString().slice(0, 5) : '09:00';
                                    updateCampaignData({ scheduled_at: new Date(`${date}T${time}`).toISOString() });
                                }}
                                min={new Date().toISOString().split('T')[0]}
                                className={validationErrors.scheduled_date ? 'border-destructive' : ''}
                            />
                            {validationErrors.scheduled_date && (
                                <p className="text-sm text-destructive mt-1">{validationErrors.scheduled_date}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="scheduled-time">Time</Label>
                            <Input
                                id="scheduled-time"
                                type="time"
                                value={campaignData.scheduled_at ? new Date(campaignData.scheduled_at).toTimeString().slice(0, 5) : ''}
                                onChange={(e) => {
                                    const time = e.target.value;
                                    const date = campaignData.scheduled_at ? new Date(campaignData.scheduled_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                                    updateCampaignData({ scheduled_at: new Date(`${date}T${time}`).toISOString() });
                                }}
                                className={validationErrors.scheduled_time ? 'border-destructive' : ''}
                            />
                            {validationErrors.scheduled_time && (
                                <p className="text-sm text-destructive mt-1">{validationErrors.scheduled_time}</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                        value={Intl.DateTimeFormat().resolvedOptions().timeZone}
                        disabled
                    >
                        <SelectTrigger id="timezone">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
                                {Intl.DateTimeFormat().resolvedOptions().timeZone} (Auto-detected)
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="quiet-hours"
                            checked={campaignData.respect_quiet_hours}
                            onCheckedChange={(checked) => updateCampaignData({ respect_quiet_hours: !!checked })}
                        />
                        <Label htmlFor="quiet-hours" className="cursor-pointer">
                            Enable quiet hours
                        </Label>
                    </div>

                    {campaignData.respect_quiet_hours && (
                        <div className="grid grid-cols-2 gap-4 ml-6">
                            <div className="space-y-2">
                                <Label htmlFor="quiet-start">Quiet Hours Start</Label>
                                <Input
                                    id="quiet-start"
                                    type="time"
                                    value={campaignData.quiet_hours_start}
                                    onChange={(e) => updateCampaignData({ quiet_hours_start: e.target.value })}
                                    className={validationErrors.quiet_hours_start ? 'border-destructive' : ''}
                                />
                                {validationErrors.quiet_hours_start && (
                                    <p className="text-sm text-destructive mt-1">{validationErrors.quiet_hours_start}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quiet-end">Quiet Hours End</Label>
                                <Input
                                    id="quiet-end"
                                    type="time"
                                    value={campaignData.quiet_hours_end}
                                    onChange={(e) => updateCampaignData({ quiet_hours_end: e.target.value })}
                                    className={validationErrors.quiet_hours_end ? 'border-destructive' : ''}
                                />
                                {validationErrors.quiet_hours_end && (
                                    <p className="text-sm text-destructive mt-1">{validationErrors.quiet_hours_end}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="throttle-rate">Send Rate (messages per batch)</Label>
                    <Input
                        id="throttle-rate"
                        type="number"
                        min="1"
                        max="100"
                        value={campaignData.throttle_rate}
                        onChange={(e) => updateCampaignData({ throttle_rate: parseInt(e.target.value) || 1 })}
                        className={validationErrors.throttle_rate ? 'border-destructive' : ''}
                    />
                    {validationErrors.throttle_rate && (
                        <p className="text-sm text-destructive mt-1">{validationErrors.throttle_rate}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                        Lower rates help avoid carrier restrictions. Recommended: 1-10 messages per batch
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
