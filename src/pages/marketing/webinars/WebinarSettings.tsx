import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Save, Video, Mail, Bell, Settings2 } from 'lucide-react';

const WebinarSettings = () => {
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        enableAutoRecording: true,
        recordingQuality: '1080p', // '720p' | '1080p' | '4k'
        enableChat: true,
        enableQA: true,
        enablePolls: true,
        enableScreenShare: true,
        maxParticipants: 100,
        enableWaitingRoom: true,
        enableRegistration: true,
        sendReminderEmails: true,
        reminderHoursBefore: [24, 1],
        sendFollowUpEmail: true,
        followUpDelayHours: 24,
        enableReplayAccess: true,
        replayAccessDays: 30,
        defaultEmailSubject: 'You\'re invited to our webinar!',
        defaultEmailBody: 'Join us for an exciting webinar session.',
        enableAttendanceTracking: true,
        enableEngagementMetrics: true,
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await api.getSettings();
            if (data?.webinar) {
                setSettings(prev => ({ ...prev, ...data.webinar }));
            }
        } catch (error) {
            console.error('Failed to load webinar settings:', error);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.updateSettings({ webinar: settings });
            toast({
                title: 'Settings saved',
                description: 'Webinar settings have been updated successfully.',
            });
        } catch (error) {
            toast({
                title: 'Save failed',
                description: 'Could not save webinar settings.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const updateSetting = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        Recording Settings
                    </CardTitle>
                    <CardDescription>Configure webinar recording preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Auto-Recording</Label>
                            <p className="text-sm text-muted-foreground">Automatically record all webinar sessions</p>
                        </div>
                        <Switch
                            checked={settings.enableAutoRecording}
                            onCheckedChange={v => updateSetting('enableAutoRecording', v)}
                        />
                    </div>

                    {settings.enableAutoRecording && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <Label htmlFor="recordingQuality">Recording Quality</Label>
                                <Select value={settings.recordingQuality} onValueChange={v => updateSetting('recordingQuality', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="720p">720p (HD)</SelectItem>
                                        <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                                        <SelectItem value="4k">4K (Ultra HD)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Replay Access</Label>
                            <p className="text-sm text-muted-foreground">Allow attendees to watch recordings after the event</p>
                        </div>
                        <Switch
                            checked={settings.enableReplayAccess}
                            onCheckedChange={v => updateSetting('enableReplayAccess', v)}
                        />
                    </div>

                    {settings.enableReplayAccess && (
                        <div className="space-y-2 pl-4">
                            <Label htmlFor="replayAccessDays">Replay Access Duration (days)</Label>
                            <Input
                                id="replayAccessDays"
                                type="number"
                                min="1"
                                max="365"
                                value={settings.replayAccessDays}
                                onChange={e => updateSetting('replayAccessDays', parseInt(e.target.value))}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5" />
                        Session Features
                    </CardTitle>
                    <CardDescription>Enable or disable webinar features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Chat</Label>
                            <p className="text-sm text-muted-foreground">Allow participants to chat during the webinar</p>
                        </div>
                        <Switch
                            checked={settings.enableChat}
                            onCheckedChange={v => updateSetting('enableChat', v)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Q&A</Label>
                            <p className="text-sm text-muted-foreground">Allow participants to ask questions</p>
                        </div>
                        <Switch
                            checked={settings.enableQA}
                            onCheckedChange={v => updateSetting('enableQA', v)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Polls</Label>
                            <p className="text-sm text-muted-foreground">Create interactive polls during webinars</p>
                        </div>
                        <Switch
                            checked={settings.enablePolls}
                            onCheckedChange={v => updateSetting('enablePolls', v)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Screen Share</Label>
                            <p className="text-sm text-muted-foreground">Allow presenters to share their screen</p>
                        </div>
                        <Switch
                            checked={settings.enableScreenShare}
                            onCheckedChange={v => updateSetting('enableScreenShare', v)}
                        />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label htmlFor="maxParticipants">Maximum Participants</Label>
                        <Input
                            id="maxParticipants"
                            type="number"
                            min="10"
                            max="10000"
                            value={settings.maxParticipants}
                            onChange={e => updateSetting('maxParticipants', parseInt(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">Maximum number of participants allowed per webinar</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Registration & Access
                    </CardTitle>
                    <CardDescription>Configure registration and access controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Registration</Label>
                            <p className="text-sm text-muted-foreground">Require participants to register before joining</p>
                        </div>
                        <Switch
                            checked={settings.enableRegistration}
                            onCheckedChange={v => updateSetting('enableRegistration', v)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Waiting Room</Label>
                            <p className="text-sm text-muted-foreground">Hold participants in a waiting room before the webinar starts</p>
                        </div>
                        <Switch
                            checked={settings.enableWaitingRoom}
                            onCheckedChange={v => updateSetting('enableWaitingRoom', v)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Notifications
                    </CardTitle>
                    <CardDescription>Configure automated email notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Send Reminder Emails</Label>
                            <p className="text-sm text-muted-foreground">Send automated reminders before the webinar</p>
                        </div>
                        <Switch
                            checked={settings.sendReminderEmails}
                            onCheckedChange={v => updateSetting('sendReminderEmails', v)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Send Follow-Up Email</Label>
                            <p className="text-sm text-muted-foreground">Send a thank you email after the webinar</p>
                        </div>
                        <Switch
                            checked={settings.sendFollowUpEmail}
                            onCheckedChange={v => updateSetting('sendFollowUpEmail', v)}
                        />
                    </div>

                    {settings.sendFollowUpEmail && (
                        <div className="space-y-2 pl-4">
                            <Label htmlFor="followUpDelayHours">Follow-Up Delay (hours)</Label>
                            <Input
                                id="followUpDelayHours"
                                type="number"
                                min="1"
                                max="168"
                                value={settings.followUpDelayHours}
                                onChange={e => updateSetting('followUpDelayHours', parseInt(e.target.value))}
                            />
                        </div>
                    )}

                    <Separator />

                    <div className="space-y-2">
                        <Label htmlFor="defaultEmailSubject">Default Invitation Subject</Label>
                        <Input
                            id="defaultEmailSubject"
                            type="text"
                            value={settings.defaultEmailSubject}
                            onChange={e => updateSetting('defaultEmailSubject', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="defaultEmailBody">Default Invitation Message</Label>
                        <Textarea
                            id="defaultEmailBody"
                            rows={4}
                            value={settings.defaultEmailBody}
                            onChange={e => updateSetting('defaultEmailBody', e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Analytics & Tracking</CardTitle>
                    <CardDescription>Configure webinar analytics and metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Attendance Tracking</Label>
                            <p className="text-sm text-muted-foreground">Track who attended and for how long</p>
                        </div>
                        <Switch
                            checked={settings.enableAttendanceTracking}
                            onCheckedChange={v => updateSetting('enableAttendanceTracking', v)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Engagement Metrics</Label>
                            <p className="text-sm text-muted-foreground">Track chat, polls, and Q&A participation</p>
                        </div>
                        <Switch
                            checked={settings.enableEngagementMetrics}
                            onCheckedChange={v => updateSetting('enableEngagementMetrics', v)}
                        />
                    </div>
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

export default WebinarSettings;
