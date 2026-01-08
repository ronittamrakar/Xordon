import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Kanban, List, Briefcase, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProjectSettings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        defaultView: 'kanban',
        enableTimeTracking: true,
        enableMilestones: true,
        defaultTaskPriority: 'medium',
        autoArchiveCompleted: false,
        notifyOnAssignment: true,
        notifyOnComment: true,
        allowGuestAccess: false,
    });

    const handleSave = async () => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
        toast({
            title: 'Settings saved',
            description: 'Project settings have been updated successfully.',
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Briefcase className="h-6 w-6 text-blue-500" />
                        Project Settings
                    </h2>
                    <p className="text-muted-foreground">
                        Configure default views, notifications, and access controls for projects.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : (
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
                        <CardTitle>Defaults & Interface</CardTitle>
                        <CardDescription>Set the default experience for new projects</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Default Project View</Label>
                            <Select
                                value={settings.defaultView}
                                onValueChange={(v) => setSettings({ ...settings, defaultView: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="kanban">
                                        <div className="flex items-center gap-2">
                                            <Kanban className="h-4 w-4" /> Kanban Board
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="list">
                                        <div className="flex items-center gap-2">
                                            <List className="h-4 w-4" /> List View
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Default Task Priority</Label>
                            <Select
                                value={settings.defaultTaskPriority}
                                onValueChange={(v) => setSettings({ ...settings, defaultTaskPriority: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Features</CardTitle>
                        <CardDescription>Enable or disable project management features</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Time Tracking</Label>
                                <p className="text-sm text-muted-foreground">Allow users to track time on tasks</p>
                            </div>
                            <Switch
                                checked={settings.enableTimeTracking}
                                onCheckedChange={(v) => setSettings({ ...settings, enableTimeTracking: v })}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Milestones</Label>
                                <p className="text-sm text-muted-foreground">Enable project milestones and phases</p>
                            </div>
                            <Switch
                                checked={settings.enableMilestones}
                                onCheckedChange={(v) => setSettings({ ...settings, enableMilestones: v })}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Auto-Archive Completed Projects</Label>
                                <p className="text-sm text-muted-foreground">Automatically archive projects after 30 days of inactivity</p>
                            </div>
                            <Switch
                                checked={settings.autoArchiveCompleted}
                                onCheckedChange={(v) => setSettings({ ...settings, autoArchiveCompleted: v })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notifications & Access</CardTitle>
                        <CardDescription>Manage how your team interacts with projects</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Notify on Assignment</Label>
                                <p className="text-sm text-muted-foreground">Send email when a user is assigned a task</p>
                            </div>
                            <Switch
                                checked={settings.notifyOnAssignment}
                                onCheckedChange={(v) => setSettings({ ...settings, notifyOnAssignment: v })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Notify on Comments</Label>
                                <p className="text-sm text-muted-foreground">Send email when a comment is added to followed tasks</p>
                            </div>
                            <Switch
                                checked={settings.notifyOnComment}
                                onCheckedChange={(v) => setSettings({ ...settings, notifyOnComment: v })}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Guest Access</Label>
                                <p className="text-sm text-muted-foreground">Allow inviting external guests to projects</p>
                            </div>
                            <Switch
                                checked={settings.allowGuestAccess}
                                onCheckedChange={(v) => setSettings({ ...settings, allowGuestAccess: v })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
