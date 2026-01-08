import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Calendar as CalendarIcon, Clock, Globe, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export default function CalendarSettings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [settings, setSettings] = useState({
        // Working Hours
        defaultTimeZone: 'UTC',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        dayStart: '09:00',
        dayEnd: '17:00',

        // Meeting Defaults
        defaultDuration: 30,
        bufferTime: 15,
        minimumNotice: 24,

        // Booking
        requirePhone: true,
        autoConfirm: true,
        allowRescheduling: true,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.settings.get('calendar');
                if (response.settings) {
                    setSettings(prev => ({ ...prev, ...response.settings }));
                }
            } catch (error) {
                console.error('Failed to load calendar settings:', error);
                toast({
                    title: 'Error loading settings',
                    description: 'Could not fetch calendar settings. Please try again.',
                    variant: 'destructive',
                });
            } finally {
                setInitialLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.settings.update('calendar', settings);
            toast({
                title: 'Calendar settings saved',
                description: 'Your calendar and booking preferences have been updated.',
            });
        } catch (error) {
            console.error('Failed to save calendar settings:', error);
            toast({
                title: 'Error saving settings',
                description: 'Please try again later.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <CalendarIcon className="h-6 w-6 text-orange-500" />
                        Calendar Settings
                    </h2>
                    <p className="text-muted-foreground">
                        Configure global working hours, meeting defaults, and booking preferences.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? (
                        <>Saving...</>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Working Hours
                        </CardTitle>
                        <CardDescription>Default availability for scheduling</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Default Timezone</Label>
                            <Select
                                value={settings.defaultTimeZone}
                                onValueChange={(v) => setSettings({ ...settings, defaultTimeZone: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UTC">UTC</SelectItem>
                                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Time</Label>
                                <Input
                                    type="time"
                                    value={settings.dayStart}
                                    onChange={(e) => setSettings({ ...settings, dayStart: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Time</Label>
                                <Input
                                    type="time"
                                    value={settings.dayEnd}
                                    onChange={(e) => setSettings({ ...settings, dayEnd: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Working Days</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                                    <div key={day} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={day}
                                            checked={settings.workingDays.includes(day)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSettings({ ...settings, workingDays: [...settings.workingDays, day] });
                                                } else {
                                                    setSettings({ ...settings, workingDays: settings.workingDays.filter(d => d !== day) });
                                                }
                                            }}
                                            className="rounded border-gray-300"
                                        />
                                        <label htmlFor={day} className="text-sm capitalize cursor-pointer">{day}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            Meeting Defaults
                        </CardTitle>
                        <CardDescription>Default duration and buffer times</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Default Meeting Duration (minutes)</Label>
                            <Select
                                value={settings.defaultDuration.toString()}
                                onValueChange={(v) => setSettings({ ...settings, defaultDuration: parseInt(v) })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15">15 minutes</SelectItem>
                                    <SelectItem value="30">30 minutes</SelectItem>
                                    <SelectItem value="45">45 minutes</SelectItem>
                                    <SelectItem value="60">1 hour</SelectItem>
                                    <SelectItem value="90">1.5 hours</SelectItem>
                                    <SelectItem value="120">2 hours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Buffer Time (minutes)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="5"
                                    value={settings.bufferTime}
                                    onChange={(e) => setSettings({ ...settings, bufferTime: parseInt(e.target.value) })}
                                />
                                <p className="text-xs text-muted-foreground">Time between meetings</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Minimum Notice (hours)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={settings.minimumNotice}
                                    onChange={(e) => setSettings({ ...settings, minimumNotice: parseInt(e.target.value) })}
                                />
                                <p className="text-xs text-muted-foreground">Minimum notice before booking</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarDays className="h-5 w-5" />
                            Booking Preferences
                        </CardTitle>
                        <CardDescription>Rules for accepting new bookings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Auto-Confirm Bookings</Label>
                                <p className="text-sm text-muted-foreground">Automatically accept new booking requests</p>
                            </div>
                            <Switch
                                checked={settings.autoConfirm}
                                onCheckedChange={(v) => setSettings({ ...settings, autoConfirm: v })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Require Phone Number</Label>
                                <p className="text-sm text-muted-foreground">Force users to provide a phone number</p>
                            </div>
                            <Switch
                                checked={settings.requirePhone}
                                onCheckedChange={(v) => setSettings({ ...settings, requirePhone: v })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Allow Rescheduling</Label>
                                <p className="text-sm text-muted-foreground">Allow guests to reschedule their own appointments</p>
                            </div>
                            <Switch
                                checked={settings.allowRescheduling}
                                onCheckedChange={(v) => setSettings({ ...settings, allowRescheduling: v })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
