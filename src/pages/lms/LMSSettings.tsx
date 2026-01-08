import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, GraduationCap, Award, BookOpen, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export default function LMSSettings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [settings, setSettings] = useState({
        // Courses
        defaultCourseVisibility: 'private',
        enableCourseReviews: true,
        requireEnrollmentApproval: false,

        // Certificates
        enableCertificates: true,
        certificateExpiryDays: 365,

        // Student Experience
        enableStudentDashboard: true,
        enableProgressTracking: true,
        allowStudentDiscussions: true,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.settings.get('lms');
                if (response.settings) {
                    setSettings(prev => ({ ...prev, ...response.settings }));
                }
            } catch (error) {
                console.error('Failed to load LMS settings:', error);
                toast({
                    title: 'Error loading settings',
                    description: 'Could not fetch LMS settings. Please try again later.',
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
            await api.settings.update('lms', settings);
            toast({
                title: 'LMS settings saved',
                description: 'Your learning management system settings have been updated.',
            });
        } catch (error) {
            console.error('Failed to save LMS settings:', error);
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
                        <GraduationCap className="h-6 w-6 text-indigo-500" />
                        Learning Management Settings
                    </h2>
                    <p className="text-muted-foreground">
                        Configure courses, certificates, and student experience.
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
                            <BookOpen className="h-5 w-5" />
                            Course Settings
                        </CardTitle>
                        <CardDescription>Default course enrollment and visibility</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Default Course Visibility</Label>
                            <Select
                                value={settings.defaultCourseVisibility}
                                onValueChange={(v) => setSettings({ ...settings, defaultCourseVisibility: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="public">Public (Anyone can view)</SelectItem>
                                    <SelectItem value="private">Private (Invite only)</SelectItem>
                                    <SelectItem value="unlisted">Unlisted (Link required)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Enable Course Reviews</Label>
                                <p className="text-sm text-muted-foreground">Allow students to rate and review courses</p>
                            </div>
                            <Switch
                                checked={settings.enableCourseReviews}
                                onCheckedChange={(v) => setSettings({ ...settings, enableCourseReviews: v })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Require Enrollment Approval</Label>
                                <p className="text-sm text-muted-foreground">Instructor must approve enrollment requests</p>
                            </div>
                            <Switch
                                checked={settings.requireEnrollmentApproval}
                                onCheckedChange={(v) => setSettings({ ...settings, requireEnrollmentApproval: v })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            Certificates
                        </CardTitle>
                        <CardDescription>Certificate generation and expiry</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Enable Certificates</Label>
                                <p className="text-sm text-muted-foreground">Issue certificates upon course completion</p>
                            </div>
                            <Switch
                                checked={settings.enableCertificates}
                                onCheckedChange={(v) => setSettings({ ...settings, enableCertificates: v })}
                            />
                        </div>
                        {settings.enableCertificates && (
                            <div className="space-y-2">
                                <Label>Certificate Expiry (Days)</Label>
                                <Input
                                    type="number"
                                    value={settings.certificateExpiryDays}
                                    onChange={(e) => setSettings({ ...settings, certificateExpiryDays: parseInt(e.target.value) || 365 })}
                                />
                                <p className="text-sm text-muted-foreground">Number of days before a certificate expires (0 for no expiry)</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Student Experience
                        </CardTitle>
                        <CardDescription>Student dashboard and interaction features</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Enable Student Dashboard</Label>
                                <p className="text-sm text-muted-foreground">Provide a dedicated dashboard for students</p>
                            </div>
                            <Switch
                                checked={settings.enableStudentDashboard}
                                onCheckedChange={(v) => setSettings({ ...settings, enableStudentDashboard: v })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Enable Progress Tracking</Label>
                                <p className="text-sm text-muted-foreground">Show progress bars for course completion</p>
                            </div>
                            <Switch
                                checked={settings.enableProgressTracking}
                                onCheckedChange={(v) => setSettings({ ...settings, enableProgressTracking: v })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Allow Student Discussions</Label>
                                <p className="text-sm text-muted-foreground">Enable discussion forums for courses</p>
                            </div>
                            <Switch
                                checked={settings.allowStudentDiscussions}
                                onCheckedChange={(v) => setSettings({ ...settings, allowStudentDiscussions: v })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
