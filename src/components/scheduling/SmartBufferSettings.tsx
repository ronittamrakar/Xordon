import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface SmartSchedulingConfig {
    smart_buffer: 'dynamic' | 'fixed';
    overlap_prevention: 'strict' | 'allow_partial' | 'none';
    travel_time_between_appointments: number;
}

interface SmartBufferSettingsProps {
    value: SmartSchedulingConfig;
    onChange: (value: SmartSchedulingConfig) => void;
}

export function SmartBufferSettings({ value, onChange }: SmartBufferSettingsProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <Label className="text-base">Buffer Logic</Label>
                <RadioGroup
                    value={value.smart_buffer}
                    onValueChange={(v) => onChange({ ...value, smart_buffer: v as 'dynamic' | 'fixed' })}
                    className="flex flex-col space-y-2"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fixed" id="buffer-fixed" />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="buffer-fixed" className="font-medium cursor-pointer">Fixed Buffer</Label>
                            <p className="text-sm text-gray-500">
                                Always add a set buffer time before/after appointments.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dynamic" id="buffer-dynamic" />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="buffer-dynamic" className="font-medium cursor-pointer">Smart (Dynamic) Buffer</Label>
                            <p className="text-sm text-gray-500">
                                Specifically adjust buffers based on location or appointment type context.
                            </p>
                        </div>
                    </div>
                </RadioGroup>
            </div>

            <div className="space-y-2">
                <Label>Overlap Prevention</Label>
                <Select
                    value={value.overlap_prevention}
                    onValueChange={(v) => onChange({ ...value, overlap_prevention: v as any })}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="strict">Strict (No Overlap)</SelectItem>
                        <SelectItem value="allow_partial">Allow Partial (e.g. Buffers can overlap)</SelectItem>
                        <SelectItem value="none">Allow Overlap (Double Booking)</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                    Determines how the system handles conflicting appointments.
                </p>
            </div>

            <div className="space-y-2">
                <Label>Travel Time Estimate (minutes)</Label>
                <Input
                    type="number"
                    min={0}
                    value={value.travel_time_between_appointments}
                    onChange={(e) => onChange({ ...value, travel_time_between_appointments: parseInt(e.target.value) || 0 })}
                />
                <p className="text-sm text-gray-500">
                    Only applies for 'In Person' appointments with different locations.
                </p>
            </div>
        </div>
    );
}
