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
import { Save, MapPin, Truck, Clock, Calendar } from 'lucide-react';

const FieldServiceSettings = () => {
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        enableAutoDispatch: false,
        dispatchMethod: 'nearest', // 'nearest' | 'balanced' | 'priority'
        maxTravelDistance: 50, // miles
        defaultJobDuration: 60, // minutes
        bufferTime: 15, // minutes between jobs
        enableRouteOptimization: true,
        workingHoursStart: '08:00',
        workingHoursEnd: '18:00',
        enableWeekendWork: false,
        requireCustomerSignature: true,
        enablePhotoCapture: true,
        enableGPSTracking: true,
        sendETANotifications: true,
        sendCompletionNotifications: true,
        allowTechnicianNotes: true,
        requirePartsInventory: false,
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await api.getSettings();
            if (data?.fieldService) {
                setSettings(prev => ({ ...prev, ...data.fieldService }));
            }
        } catch (error) {
            console.error('Failed to load field service settings:', error);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.updateSettings({ fieldService: settings });
            toast({
                title: 'Settings saved',
                description: 'Field service settings have been updated successfully.',
            });
        } catch (error) {
            toast({
                title: 'Save failed',
                description: 'Could not save field service settings.',
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
                        <Truck className="h-5 w-5" />
                        Dispatch Settings
                    </CardTitle>
                    <CardDescription>Configure how jobs are assigned to technicians</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Auto-Dispatch</Label>
                            <p className="text-sm text-muted-foreground">Automatically assign jobs to available technicians</p>
                        </div>
                        <Switch
                            checked={settings.enableAutoDispatch}
                            onCheckedChange={v => updateSetting('enableAutoDispatch', v)}
                        />
                    </div>

                    {settings.enableAutoDispatch && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <Label htmlFor="dispatchMethod">Dispatch Method</Label>
                                <Select value={settings.dispatchMethod} onValueChange={v => updateSetting('dispatchMethod', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="nearest">Nearest Technician</SelectItem>
                                        <SelectItem value="balanced">Balanced Workload</SelectItem>
                                        <SelectItem value="priority">Priority-Based</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    {settings.dispatchMethod === 'nearest' && 'Assign to the closest available technician'}
                                    {settings.dispatchMethod === 'balanced' && 'Distribute jobs evenly across all technicians'}
                                    {settings.dispatchMethod === 'priority' && 'Assign based on technician skill and priority'}
                                </p>
                            </div>
                        </>
                    )}

                    <Separator />

                    <div className="space-y-2">
                        <Label htmlFor="maxTravelDistance">Maximum Travel Distance (miles)</Label>
                        <Input
                            id="maxTravelDistance"
                            type="number"
                            min="1"
                            max="500"
                            value={settings.maxTravelDistance}
                            onChange={e => updateSetting('maxTravelDistance', parseInt(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">Maximum distance a technician can travel for a job</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Route Optimization</Label>
                            <p className="text-sm text-muted-foreground">Optimize technician routes for efficiency</p>
                        </div>
                        <Switch
                            checked={settings.enableRouteOptimization}
                            onCheckedChange={v => updateSetting('enableRouteOptimization', v)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Job Timing
                    </CardTitle>
                    <CardDescription>Configure default job durations and scheduling</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="defaultJobDuration">Default Job Duration (minutes)</Label>
                            <Input
                                id="defaultJobDuration"
                                type="number"
                                min="15"
                                max="480"
                                value={settings.defaultJobDuration}
                                onChange={e => updateSetting('defaultJobDuration', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bufferTime">Buffer Time Between Jobs (minutes)</Label>
                            <Input
                                id="bufferTime"
                                type="number"
                                min="0"
                                max="120"
                                value={settings.bufferTime}
                                onChange={e => updateSetting('bufferTime', parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Working Hours
                    </CardTitle>
                    <CardDescription>Configure service availability hours</CardDescription>
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

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Weekend Work</Label>
                            <p className="text-sm text-muted-foreground">Allow scheduling on Saturdays and Sundays</p>
                        </div>
                        <Switch
                            checked={settings.enableWeekendWork}
                            onCheckedChange={v => updateSetting('enableWeekendWork', v)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Job Completion
                    </CardTitle>
                    <CardDescription>Configure job completion requirements and features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Require Customer Signature</Label>
                            <p className="text-sm text-muted-foreground">Technicians must collect signature on completion</p>
                        </div>
                        <Switch
                            checked={settings.requireCustomerSignature}
                            onCheckedChange={v => updateSetting('requireCustomerSignature', v)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Photo Capture</Label>
                            <p className="text-sm text-muted-foreground">Allow technicians to take photos during jobs</p>
                        </div>
                        <Switch
                            checked={settings.enablePhotoCapture}
                            onCheckedChange={v => updateSetting('enablePhotoCapture', v)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable GPS Tracking</Label>
                            <p className="text-sm text-muted-foreground">Track technician location in real-time</p>
                        </div>
                        <Switch
                            checked={settings.enableGPSTracking}
                            onCheckedChange={v => updateSetting('enableGPSTracking', v)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Allow Technician Notes</Label>
                            <p className="text-sm text-muted-foreground">Technicians can add notes to job reports</p>
                        </div>
                        <Switch
                            checked={settings.allowTechnicianNotes}
                            onCheckedChange={v => updateSetting('allowTechnicianNotes', v)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Require Parts Inventory</Label>
                            <p className="text-sm text-muted-foreground">Track parts used during jobs</p>
                        </div>
                        <Switch
                            checked={settings.requirePartsInventory}
                            onCheckedChange={v => updateSetting('requirePartsInventory', v)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Customer Notifications</CardTitle>
                    <CardDescription>Configure automatic customer notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Send ETA Notifications</Label>
                            <p className="text-sm text-muted-foreground">Notify customers when technician is on the way</p>
                        </div>
                        <Switch
                            checked={settings.sendETANotifications}
                            onCheckedChange={v => updateSetting('sendETANotifications', v)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Send Completion Notifications</Label>
                            <p className="text-sm text-muted-foreground">Notify customers when job is completed</p>
                        </div>
                        <Switch
                            checked={settings.sendCompletionNotifications}
                            onCheckedChange={v => updateSetting('sendCompletionNotifications', v)}
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

export default FieldServiceSettings;
