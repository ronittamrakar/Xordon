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
import { Save, Heart, MessageCircle, Calendar, Award } from 'lucide-react';

const CultureSettings = () => {
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        enablePeerRecognition: true,
        recognitionPointsValue: 10,
        enablePulseSurveys: true,
        surveyFrequency: 'monthly', // 'weekly' | 'monthly' | 'quarterly'
        enableAnonymousFeedback: true,
        enableCultureEvents: true,
        autoApproveEvents: false,
        enableCultureChampions: true,
        championNominations: true,
        enableAICoach: true,
        enableOnboarding: true,
        onboardingDuration: 30, // days
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await api.getSettings();
            if (data?.culture) {
                setSettings(prev => ({ ...prev, ...data.culture }));
            }
        } catch (error) {
            console.error('Failed to load culture settings:', error);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.updateSettings({ culture: settings });
            toast({
                title: 'Settings saved',
                description: 'Culture settings have been updated successfully.',
            });
        } catch (error) {
            toast({
                title: 'Save failed',
                description: 'Could not save culture settings.',
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
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5" />
                        Recognition Settings
                    </CardTitle>
                    <CardDescription>Configure peer recognition and rewards</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Peer Recognition</Label>
                            <p className="text-sm text-muted-foreground">Allow employees to recognize each other</p>
                        </div>
                        <Switch
                            checked={settings.enablePeerRecognition}
                            onCheckedChange={v => updateSetting('enablePeerRecognition', v)}
                        />
                    </div>

                    {settings.enablePeerRecognition && (
                        <>
                            <Separator />
                            <div className="space-y-2 pl-4">
                                <Label htmlFor="recognitionPointsValue">Recognition Points Value</Label>
                                <Input
                                    id="recognitionPointsValue"
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={settings.recognitionPointsValue}
                                    onChange={e => updateSetting('recognitionPointsValue', parseInt(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">Points awarded for each recognition</p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Pulse Surveys
                    </CardTitle>
                    <CardDescription>Configure employee engagement surveys</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Pulse Surveys</Label>
                            <p className="text-sm text-muted-foreground">Regular employee engagement surveys</p>
                        </div>
                        <Switch
                            checked={settings.enablePulseSurveys}
                            onCheckedChange={v => updateSetting('enablePulseSurveys', v)}
                        />
                    </div>

                    {settings.enablePulseSurveys && (
                        <>
                            <Separator />
                            <div className="space-y-2 pl-4">
                                <Label htmlFor="surveyFrequency">Survey Frequency</Label>
                                <Select value={settings.surveyFrequency} onValueChange={v => updateSetting('surveyFrequency', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="quarterly">Quarterly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Anonymous Feedback</Label>
                            <p className="text-sm text-muted-foreground">Allow employees to submit anonymous feedback</p>
                        </div>
                        <Switch
                            checked={settings.enableAnonymousFeedback}
                            onCheckedChange={v => updateSetting('enableAnonymousFeedback', v)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Culture Events
                    </CardTitle>
                    <CardDescription>Configure team-building and culture events</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Culture Events</Label>
                            <p className="text-sm text-muted-foreground">Allow creation of team-building events</p>
                        </div>
                        <Switch
                            checked={settings.enableCultureEvents}
                            onCheckedChange={v => updateSetting('enableCultureEvents', v)}
                        />
                    </div>

                    {settings.enableCultureEvents && (
                        <>
                            <Separator />
                            <div className="flex items-center justify-between pl-4">
                                <div>
                                    <Label>Auto-Approve Events</Label>
                                    <p className="text-sm text-muted-foreground">Automatically approve event submissions</p>
                                </div>
                                <Switch
                                    checked={settings.autoApproveEvents}
                                    onCheckedChange={v => updateSetting('autoApproveEvents', v)}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Culture Champions
                    </CardTitle>
                    <CardDescription>Configure culture champion program</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Culture Champions</Label>
                            <p className="text-sm text-muted-foreground">Recognize and empower culture champions</p>
                        </div>
                        <Switch
                            checked={settings.enableCultureChampions}
                            onCheckedChange={v => updateSetting('enableCultureChampions', v)}
                        />
                    </div>

                    {settings.enableCultureChampions && (
                        <>
                            <Separator />
                            <div className="flex items-center justify-between pl-4">
                                <div>
                                    <Label>Allow Champion Nominations</Label>
                                    <p className="text-sm text-muted-foreground">Let employees nominate culture champions</p>
                                </div>
                                <Switch
                                    checked={settings.championNominations}
                                    onCheckedChange={v => updateSetting('championNominations', v)}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Onboarding</CardTitle>
                    <CardDescription>Configure new employee onboarding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable Onboarding Program</Label>
                            <p className="text-sm text-muted-foreground">Structured onboarding for new hires</p>
                        </div>
                        <Switch
                            checked={settings.enableOnboarding}
                            onCheckedChange={v => updateSetting('enableOnboarding', v)}
                        />
                    </div>

                    {settings.enableOnboarding && (
                        <>
                            <Separator />
                            <div className="space-y-2 pl-4">
                                <Label htmlFor="onboardingDuration">Onboarding Duration (days)</Label>
                                <Input
                                    id="onboardingDuration"
                                    type="number"
                                    min="7"
                                    max="90"
                                    value={settings.onboardingDuration}
                                    onChange={e => updateSetting('onboardingDuration', parseInt(e.target.value))}
                                />
                            </div>
                        </>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Enable AI Culture Coach</Label>
                            <p className="text-sm text-muted-foreground">AI-powered culture guidance and tips</p>
                        </div>
                        <Switch
                            checked={settings.enableAICoach}
                            onCheckedChange={v => updateSetting('enableAICoach', v)}
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

export default CultureSettings;
