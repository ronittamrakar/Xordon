import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Save, Calendar, Clock, Bell, Users } from 'lucide-react';

const SchedulingSettings = () => {
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        enableBooking: true,
        defaultDuration: 30, // minutes
        bufferTime: 15, // minutes between appointments
        minAdvanceBooking: 24, // hours
        maxAdvanceBooking: 60, // days
        enableWaitlist: true,
        enableReminders: true,
        reminderTimes: [24, 1], // hours before
        reminderChannels: ['email', 'sms'],
        enableConfirmation: true,
        requireConfirmation: false,
        enableCancellation: true,
        cancellationWindow: 24, // hours before
        enableRescheduling: true,
        reschedulingWindow: 24, // hours before
        workingHoursStart: '09:00',
        workingHoursEnd: '17:00',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        timezone: 'America/New_York',
        enableGroupBookings: false,
        maxGroupSize: 10,
        enableRecurring: false,
        enableVideoMeetings: true,
        videoProvider: 'zoom', // 'zoom' | 'google_meet' | 'teams'
        enableInPersonMeetings: true,
        requireLocation: false,
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await api.getSettings();
            if (data?.scheduling) {
                setSettings(prev => ({ ...prev, ...data.scheduling }));
            }
        } catch (error) {
            console.error('Failed to load scheduling settings:', error);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.updateSettings({ scheduling: settings });
            toast({
                title: 'Settings saved',
                description: 'Scheduling settings have been updated successfully.',
            });
        } catch (error) {
            toast({
                title: 'Save failed',
                description: 'Could not save scheduling settings.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const updateSetting = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const toggleWorkingDay = (day: string) => {
        const days = settings.workingDays.includes(day)
            ? settings.workingDays.filter(d => d !== day)
            : [...settings.workingDays, day];
        updateSetting('workingDays', days);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Booking Settings
                    </CardTitle>
                    <CardDescription>Configure appointment booking preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Online Booking</Label>
                            <p className="text-sm text-muted-foreground">Allow customers to book appointments online</p>
                        </div>
                        <Switch
                            checked={settings.enableBooking}
                            onCheckedChange={v => updateSetting('enableBooking', v)}
                        />
                    </div>

                    {settings.enableBooking && (
                        <>
                            <Separator />

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="defaultDuration">Default Duration (minutes)</Label>
                                    <Input
                                        id="defaultDuration"
                                        type="number"
                                        min="15"
                                        max="480"
                                        value={settings.defaultDuration}
                                        onChange={e => updateSetting('defaultDuration', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bufferTime">Buffer Time (minutes)</Label>
                                    <Input
                                        id="bufferTime"
                                        type="number"
                                        min="0"
                                        max="60"
                                        value={settings.bufferTime}
                                        onChange={e => updateSetting('bufferTime', parseInt(e.target.value))}
                                    />
                                    <p className="text-xs text-muted-foreground">Time between appointments</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="minAdvanceBooking">Minimum Advance Booking (hours)</Label>
                                    <Input
                                        id="minAdvanceBooking"
                                        type="number"
                                        min="0"
                                        max="168"
                                        value={settings.minAdvanceBooking}
                                        onChange={e => updateSetting('minAdvanceBooking', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxAdvanceBooking">Maximum Advance Booking (days)</Label>
                                    <Input
                                        id="maxAdvanceBooking"
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={settings.maxAdvanceBooking}
                                        onChange={e => updateSetting('maxAdvanceBooking', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Working Hours
                    </CardTitle>
                    <CardDescription>Set your availability schedule</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="workingHoursStart">Start Time</Label>
                            <Input
                                id="workingHoursStart"
                                type="time"
                                value={settings.workingHoursStart}
                                onChange={e => updateSetting('workingHoursStart', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="workingHoursEnd">End Time</Label>
                            <Input
                                id="workingHoursEnd"
                                type="time"
                                value={settings.workingHoursEnd}
                                onChange={e => updateSetting('workingHoursEnd', e.target.value)}
                            />
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label>Working Days</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                                <Button
                                    key={day}
                                    variant={settings.workingDays.includes(day) ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => toggleWorkingDay(day)}
                                    className="capitalize"
                                >
                                    {day.slice(0, 3)}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select value={settings.timezone} onValueChange={v => updateSetting('timezone', v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                                <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                                <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                                <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications & Reminders
                    </CardTitle>
                    <CardDescription>Configure appointment reminders and confirmations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Reminders</Label>
                            <p className="text-sm text-muted-foreground">Send automatic appointment reminders</p>
                        </div>
                        <Switch
                            checked={settings.enableReminders}
                            onCheckedChange={v => updateSetting('enableReminders', v)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Confirmation</Label>
                            <p className="text-sm text-muted-foreground">Send booking confirmation messages</p>
                        </div>
                        <Switch
                            checked={settings.enableConfirmation}
                            onCheckedChange={v => updateSetting('enableConfirmation', v)}
                        />
                    </div>

                    {settings.enableConfirmation && (
                        <>
                            <div className="flex items-center justify-between pl-4">
                                <div>
                                    <Label>Require Confirmation</Label>
                                    <p className="text-sm text-muted-foreground">Customer must confirm booking</p>
                                </div>
                                <Switch
                                    checked={settings.requireConfirmation}
                                    onCheckedChange={v => updateSetting('requireConfirmation', v)}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Cancellation & Rescheduling</CardTitle>
                    <CardDescription>Configure cancellation and rescheduling policies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Enable Cancellation</Label>
                                <p className="text-sm text-muted-foreground">Allow customers to cancel appointments</p>
                            </div>
                            <Switch
                                checked={settings.enableCancellation}
                                onCheckedChange={v => updateSetting('enableCancellation', v)}
                            />
                        </div>

                        {settings.enableCancellation && (
                            <div className="space-y-2 pl-4">
                                <Label htmlFor="cancellationWindow">Cancellation Window (hours)</Label>
                                <Input
                                    id="cancellationWindow"
                                    type="number"
                                    min="0"
                                    max="168"
                                    value={settings.cancellationWindow}
                                    onChange={e => updateSetting('cancellationWindow', parseInt(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">Minimum hours before appointment to cancel</p>
                            </div>
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Enable Rescheduling</Label>
                                <p className="text-sm text-muted-foreground">Allow customers to reschedule appointments</p>
                            </div>
                            <Switch
                                checked={settings.enableRescheduling}
                                onCheckedChange={v => updateSetting('enableRescheduling', v)}
                            />
                        </div>

                        {settings.enableRescheduling && (
                            <div className="space-y-2 pl-4">
                                <Label htmlFor="reschedulingWindow">Rescheduling Window (hours)</Label>
                                <Input
                                    id="reschedulingWindow"
                                    type="number"
                                    min="0"
                                    max="168"
                                    value={settings.reschedulingWindow}
                                    onChange={e => updateSetting('reschedulingWindow', parseInt(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">Minimum hours before appointment to reschedule</p>
                            </div>
                        )}
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Waitlist</Label>
                            <p className="text-sm text-muted-foreground">Allow customers to join waitlist for full slots</p>
                        </div>
                        <Switch
                            checked={settings.enableWaitlist}
                            onCheckedChange={v => updateSetting('enableWaitlist', v)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Advanced Features
                    </CardTitle>
                    <CardDescription>Configure advanced booking options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Enable Group Bookings</Label>
                                <p className="text-sm text-muted-foreground">Allow multiple people to book together</p>
                            </div>
                            <Switch
                                checked={settings.enableGroupBookings}
                                onCheckedChange={v => updateSetting('enableGroupBookings', v)}
                            />
                        </div>

                        {settings.enableGroupBookings && (
                            <div className="space-y-2 pl-4">
                                <Label htmlFor="maxGroupSize">Maximum Group Size</Label>
                                <Input
                                    id="maxGroupSize"
                                    type="number"
                                    min="2"
                                    max="100"
                                    value={settings.maxGroupSize}
                                    onChange={e => updateSetting('maxGroupSize', parseInt(e.target.value))}
                                />
                            </div>
                        )}
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Recurring Appointments</Label>
                            <p className="text-sm text-muted-foreground">Allow scheduling of recurring appointments</p>
                        </div>
                        <Switch
                            checked={settings.enableRecurring}
                            onCheckedChange={v => updateSetting('enableRecurring', v)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Video Meetings</Label>
                            <p className="text-sm text-muted-foreground">Support virtual appointments</p>
                        </div>
                        <Switch
                            checked={settings.enableVideoMeetings}
                            onCheckedChange={v => updateSetting('enableVideoMeetings', v)}
                        />
                    </div>

                    {settings.enableVideoMeetings && (
                        <>
                            <div className="space-y-2 pl-4">
                                <Label htmlFor="videoProvider">Video Provider</Label>
                                <Select value={settings.videoProvider} onValueChange={v => updateSetting('videoProvider', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="zoom">Zoom</SelectItem>
                                        <SelectItem value="google_meet">Google Meet</SelectItem>
                                        <SelectItem value="teams">Microsoft Teams</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable In-Person Meetings</Label>
                            <p className="text-sm text-muted-foreground">Support physical location appointments</p>
                        </div>
                        <Switch
                            checked={settings.enableInPersonMeetings}
                            onCheckedChange={v => updateSetting('enableInPersonMeetings', v)}
                        />
                    </div>

                    {settings.enableInPersonMeetings && (
                        <>
                            <div className="flex items-center justify-between pl-4">
                                <div>
                                    <Label>Require Location</Label>
                                    <p className="text-sm text-muted-foreground">Location must be specified for in-person meetings</p>
                                </div>
                                <Switch
                                    checked={settings.requireLocation}
                                    onCheckedChange={v => updateSetting('requireLocation', v)}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                        <>Saving...</>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Settings
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default SchedulingSettings;
