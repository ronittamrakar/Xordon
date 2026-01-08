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
import { Save, GraduationCap, Award, Clock } from 'lucide-react';

const CoursesSettings = () => {
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        enableCertificates: true,
        certificateTemplate: 'default',
        enableQuizzes: true,
        passingScore: 70,
        allowRetakes: true,
        maxRetakes: 3,
        enableProgressTracking: true,
        enableDiscussions: true,
        enableDownloads: true,
        videoQuality: '1080p',
        enableAutoEnroll: false,
        completionCertificate: true,
        enableDripContent: false,
        dripInterval: 7, // days
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await api.getSettings();
            if (data?.courses) {
                setSettings(prev => ({ ...prev, ...data.courses }));
            }
        } catch (error) {
            console.error('Failed to load courses settings:', error);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.updateSettings({ courses: settings });
            toast({
                title: 'Settings saved',
                description: 'Courses settings have been updated successfully.',
            });
        } catch (error) {
            toast({
                title: 'Save failed',
                description: 'Could not save courses settings.',
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
                        <GraduationCap className="h-5 w-5" />
                        Course Settings
                    </CardTitle>
                    <CardDescription>Configure course delivery and student experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Progress Tracking</Label>
                            <p className="text-sm text-muted-foreground">Track student progress through courses</p>
                        </div>
                        <Switch
                            checked={settings.enableProgressTracking}
                            onCheckedChange={v => updateSetting('enableProgressTracking', v)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Discussions</Label>
                            <p className="text-sm text-muted-foreground">Allow students to discuss course content</p>
                        </div>
                        <Switch
                            checked={settings.enableDiscussions}
                            onCheckedChange={v => updateSetting('enableDiscussions', v)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Downloads</Label>
                            <p className="text-sm text-muted-foreground">Allow students to download course materials</p>
                        </div>
                        <Switch
                            checked={settings.enableDownloads}
                            onCheckedChange={v => updateSetting('enableDownloads', v)}
                        />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label htmlFor="videoQuality">Default Video Quality</Label>
                        <Select value={settings.videoQuality} onValueChange={v => updateSetting('videoQuality', v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="480p">480p (SD)</SelectItem>
                                <SelectItem value="720p">720p (HD)</SelectItem>
                                <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                                <SelectItem value="4k">4K (Ultra HD)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Certificates & Quizzes
                    </CardTitle>
                    <CardDescription>Configure assessments and certifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Certificates</Label>
                            <p className="text-sm text-muted-foreground">Award certificates upon course completion</p>
                        </div>
                        <Switch
                            checked={settings.enableCertificates}
                            onCheckedChange={v => updateSetting('enableCertificates', v)}
                        />
                    </div>

                    {settings.enableCertificates && (
                        <>
                            <Separator />
                            <div className="space-y-2 pl-4">
                                <Label htmlFor="certificateTemplate">Certificate Template</Label>
                                <Select value={settings.certificateTemplate} onValueChange={v => updateSetting('certificateTemplate', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">Default</SelectItem>
                                        <SelectItem value="professional">Professional</SelectItem>
                                        <SelectItem value="modern">Modern</SelectItem>
                                        <SelectItem value="classic">Classic</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Quizzes</Label>
                            <p className="text-sm text-muted-foreground">Include quizzes in courses</p>
                        </div>
                        <Switch
                            checked={settings.enableQuizzes}
                            onCheckedChange={v => updateSetting('enableQuizzes', v)}
                        />
                    </div>

                    {settings.enableQuizzes && (
                        <>
                            <div className="space-y-4 pl-4">
                                <div className="space-y-2">
                                    <Label htmlFor="passingScore">Passing Score (%)</Label>
                                    <Input
                                        id="passingScore"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={settings.passingScore}
                                        onChange={e => updateSetting('passingScore', parseInt(e.target.value))}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Allow Retakes</Label>
                                        <p className="text-sm text-muted-foreground">Let students retake failed quizzes</p>
                                    </div>
                                    <Switch
                                        checked={settings.allowRetakes}
                                        onCheckedChange={v => updateSetting('allowRetakes', v)}
                                    />
                                </div>

                                {settings.allowRetakes && (
                                    <div className="space-y-2 pl-4">
                                        <Label htmlFor="maxRetakes">Maximum Retakes</Label>
                                        <Input
                                            id="maxRetakes"
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={settings.maxRetakes}
                                            onChange={e => updateSetting('maxRetakes', parseInt(e.target.value))}
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Content Delivery
                    </CardTitle>
                    <CardDescription>Configure how course content is released</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Auto-Enrollment</Label>
                            <p className="text-sm text-muted-foreground">Automatically enroll students in prerequisite courses</p>
                        </div>
                        <Switch
                            checked={settings.enableAutoEnroll}
                            onCheckedChange={v => updateSetting('enableAutoEnroll', v)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Drip Content</Label>
                            <p className="text-sm text-muted-foreground">Release course content gradually over time</p>
                        </div>
                        <Switch
                            checked={settings.enableDripContent}
                            onCheckedChange={v => updateSetting('enableDripContent', v)}
                        />
                    </div>

                    {settings.enableDripContent && (
                        <div className="space-y-2 pl-4">
                            <Label htmlFor="dripInterval">Drip Interval (days)</Label>
                            <Input
                                id="dripInterval"
                                type="number"
                                min="1"
                                max="30"
                                value={settings.dripInterval}
                                onChange={e => updateSetting('dripInterval', parseInt(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground">Number of days between content releases</p>
                        </div>
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

export default CoursesSettings;
