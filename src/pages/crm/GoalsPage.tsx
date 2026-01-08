import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
    Trophy,
    Target,
    Phone,
    Mail,
    Calendar,
    CheckCircle2,
    TrendingUp,
    Save,
    Rocket
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface SalesGoals {
    calls_goal: number;
    calls_completed: number;
    emails_goal: number;
    emails_completed: number;
    meetings_goal: number;
    meetings_completed: number;
    tasks_goal: number;
    tasks_completed: number;
}

const CRMGoalsPage: React.FC = () => {
    const [goals, setGoals] = useState<SalesGoals | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadGoals = async () => {
        try {
            setLoading(true);
            const data = await api.crm.getDailyGoals();
            setGoals(data as any);
        } catch (error) {
            console.error('Failed to load goals:', error);
            // Fallback/Mock
            setGoals({
                calls_goal: 20,
                calls_completed: 12,
                emails_goal: 50,
                emails_completed: 35,
                meetings_goal: 5,
                meetings_completed: 2,
                tasks_goal: 10,
                tasks_completed: 8
            });
        } finally {
            setLoading(false);
        }
    };

    const saveGoals = async () => {
        if (!goals) return;
        try {
            setSaving(true);
            await api.crm.updateDailyGoals(goals as any);
            toast.success('Goals updated successfully');
        } catch (error) {
            toast.error('Failed to update goals');
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        loadGoals();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
    );

    const calculateProgress = (completed: number, goal: number) => {
        if (goal <= 0) return 0;
        return Math.min(100, Math.round((completed / goal) * 100));
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Sales Performance & Goals</h1>
                    <p className="text-muted-foreground">Track your daily outreach targets and sales execution metrics.</p>
                </div>
                <Button onClick={saveGoals} disabled={saving} className="gap-2 shadow-lg shadow-blue-500/20">
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Update Goals'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-900/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-500" />
                            Daily Targets
                        </CardTitle>
                        <CardDescription>Adjust your daily activity targets based on your sales quota.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {/* Calls Goal */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Cold Calls</p>
                                        <p className="text-sm text-muted-foreground">{goals?.calls_completed} of {goals?.calls_goal} completed</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        className="w-20 text-center"
                                        value={goals?.calls_goal}
                                        onChange={(e) => setGoals(prev => prev ? { ...prev, calls_goal: parseInt(e.target.value) || 0 } : null)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Progress value={calculateProgress(goals?.calls_completed || 0, goals?.calls_goal || 0)} className="h-2" />
                                <p className="text-xs text-right text-muted-foreground">{calculateProgress(goals?.calls_completed || 0, goals?.calls_goal || 0)}% of goal</p>
                            </div>
                        </div>

                        {/* Emails Goal */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Outreach Emails</p>
                                        <p className="text-sm text-muted-foreground">{goals?.emails_completed} of {goals?.emails_goal} completed</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        className="w-20 text-center"
                                        value={goals?.emails_goal}
                                        onChange={(e) => setGoals(prev => prev ? { ...prev, emails_goal: parseInt(e.target.value) || 0 } : null)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Progress value={calculateProgress(goals?.emails_completed || 0, goals?.emails_goal || 0)} className="h-2 bg-purple-100 dark:bg-purple-900/20" />
                                <p className="text-xs text-right text-muted-foreground text-purple-600">{calculateProgress(goals?.emails_completed || 0, goals?.emails_goal || 0)}% of goal</p>
                            </div>
                        </div>

                        {/* Meetings Goal */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Meetings Booked</p>
                                        <p className="text-sm text-muted-foreground">{goals?.meetings_completed} of {goals?.meetings_goal} goal</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        className="w-20 text-center"
                                        value={goals?.meetings_goal}
                                        onChange={(e) => setGoals(prev => prev ? { ...prev, meetings_goal: parseInt(e.target.value) || 0 } : null)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Progress value={calculateProgress(goals?.meetings_completed || 0, goals?.meetings_goal || 0)} className="h-2 bg-orange-100 dark:bg-orange-900/20" />
                                <p className="text-xs text-right text-muted-foreground text-orange-600">{calculateProgress(goals?.meetings_completed || 0, goals?.meetings_goal || 0)}% of goal</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="bg-blue-600 text-white border-0 shadow-lg shadow-blue-600/20 overflow-hidden relative">
                        <div className="absolute top-[-20px] right-[-20px] opacity-10">
                            <Trophy className="h-40 w-40" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-lg">Daily Streak</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">5 Days</div>
                            <p className="text-blue-100 text-sm mt-1">Keep it up! You're 85% closer to your weekly bonus.</p>
                            <div className="mt-6 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                                <div className="flex justify-between items-center text-xs mb-2">
                                    <span>Weekly Progress</span>
                                    <span>42/50 deals</span>
                                </div>
                                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-white w-4/5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="h-4 w-4" />
                                </div>
                                <p className="text-sm">Your call-to-meeting conversion is up <b>15%</b> this week.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                                    <Rocket className="h-4 w-4" />
                                </div>
                                <p className="text-sm">Most successful emails are sent between <b>9:00 AM - 10:30 AM</b>.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CRMGoalsPage;
