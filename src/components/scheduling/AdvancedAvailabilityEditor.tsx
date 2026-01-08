import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar'; // Assuming this exists or using a substitute
import { Badge } from '@/components/ui/badge'; // Assuming this exists
import { X, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // Assuming standard shadcn paths
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface WorkingHoursException {
    date: Date;
    start_time: string;
    end_time: string;
    is_unavailable: boolean;
}

export interface AdvancedAvailabilitySettings {
    recurring_pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
    blackout_dates: Date[];
    working_hours_exceptions: WorkingHoursException[];
    max_bookings_per_time_slot: number;
    minimum_notice_minutes: number;
}

interface AdvancedAvailabilityEditorProps {
    value: AdvancedAvailabilitySettings;
    onChange: (value: AdvancedAvailabilitySettings) => void;
}

export function AdvancedAvailabilityEditor({ value, onChange }: AdvancedAvailabilityEditorProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);

    const handlePatternChange = (pattern: 'daily' | 'weekly' | 'monthly' | 'custom') => {
        onChange({ ...value, recurring_pattern: pattern });
    };

    const addBlackoutDate = (date: Date | undefined) => {
        if (!date) return;
        const exists = value.blackout_dates.some(d => d.toDateString() === date.toDateString());
        if (!exists) {
            onChange({
                ...value,
                blackout_dates: [...value.blackout_dates, date]
            });
        }
    };

    const removeBlackoutDate = (dateToRemove: Date) => {
        onChange({
            ...value,
            blackout_dates: value.blackout_dates.filter(d => d.toDateString() !== dateToRemove.toDateString())
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label>Recurring Pattern</Label>
                    <Select
                        value={value.recurring_pattern}
                        onValueChange={(val: any) => handlePatternChange(val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select pattern" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly (Standard)</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">
                        Define how your availability repeats over time.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Max Bookings Per Slot</Label>
                    <Input
                        type="number"
                        min={1}
                        value={value.max_bookings_per_time_slot}
                        onChange={(e) => onChange({ ...value, max_bookings_per_time_slot: parseInt(e.target.value) || 1 })}
                    />
                    <p className="text-sm text-gray-500">
                        Allow multiple clients to book the same time slot.
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Minimum Notice (Minutes)</Label>
                <Input
                    type="number"
                    min={0}
                    value={value.minimum_notice_minutes}
                    onChange={(e) => onChange({ ...value, minimum_notice_minutes: parseInt(e.target.value) || 0 })}
                />
                <p className="text-sm text-gray-500">
                    How soon before the appointment can clients book?
                </p>
            </div>

            <div className="space-y-4 border rounded-md p-4">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Blackout Dates</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                Add Date
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                    setSelectedDate(date);
                                    addBlackoutDate(date);
                                }}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {value.blackout_dates.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No blackout dates added.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {value.blackout_dates.map((date, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                {format(date, 'PP')}
                                <X
                                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                                    onClick={() => removeBlackoutDate(date)}
                                />
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Placeholder for Working Hours Exceptions - could be a more complex UI */}
            <div className="space-y-2 border rounded-md p-4 opacity-70">
                <Label>Working Hours Exceptions</Label>
                <p className="text-sm text-gray-500">
                    Date-specific schedule overrides coming soon.
                </p>
            </div>
        </div>
    );
}
