import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export interface GroupEventConfig {
    max_participants: number;
    min_participants: number;
    waitlist_enabled: boolean;
    participant_confirmation: boolean;
}

interface GroupEventSettingsProps {
    value: GroupEventConfig;
    onChange: (value: GroupEventConfig) => void;
}

export function GroupEventSettings({ value, onChange }: GroupEventSettingsProps) {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label>Max Participants</Label>
                    <Input
                        type="number"
                        min={1}
                        value={value.max_participants}
                        onChange={(e) => onChange({ ...value, max_participants: parseInt(e.target.value) || 1 })}
                    />
                    <p className="text-sm text-gray-500">
                        Maximum number of people who can join this event.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Min Participants</Label>
                    <Input
                        type="number"
                        min={1}
                        value={value.min_participants}
                        onChange={(e) => onChange({ ...value, min_participants: parseInt(e.target.value) || 1 })}
                    />
                    <p className="text-sm text-gray-500">
                        Minimum required to confirm the event.
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between space-x-2 border p-4 rounded-md">
                <div className="space-y-0.5">
                    <Label className="text-base">Enable Waitlist</Label>
                    <p className="text-sm text-gray-500">
                        Allow clients to join a waitlist when full.
                    </p>
                </div>
                <Switch
                    checked={value.waitlist_enabled}
                    onCheckedChange={(checked) => onChange({ ...value, waitlist_enabled: checked })}
                />
            </div>

            <div className="flex items-center justify-between space-x-2 border p-4 rounded-md">
                <div className="space-y-0.5">
                    <Label className="text-base">Participant Confirmation</Label>
                    <p className="text-sm text-gray-500">
                        Require manual confirmation for each participant.
                    </p>
                </div>
                <Switch
                    checked={value.participant_confirmation}
                    onCheckedChange={(checked) => onChange({ ...value, participant_confirmation: checked })}
                />
            </div>
        </div>
    );
}
