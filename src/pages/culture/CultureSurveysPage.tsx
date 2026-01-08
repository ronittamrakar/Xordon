import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, TrendingUp, Users, Calendar, Plus, BarChart3, CheckCircle2, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cultureApi } from '@/services/cultureApi';

const CATEGORY_SCORES = [
    { category: 'Leadership', score: 8.5 },
    { category: 'Team Culture', score: 8.8 },
    { category: 'Work-Life Balance', score: 7.9 },
    { category: 'Growth Opportunities', score: 8.2 },
    { category: 'Communication', score: 8.0 },
    { category: 'Recognition', score: 7.6 }
];

export default function CultureSurveysPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [createOpen, setCreateOpen] = useState(false);
    const [surveyTitle, setSurveyTitle] = useState('');
    const [surveyDescription, setSurveyDescription] = useState('');

    const { data: surveys = [] } = useQuery({
        queryKey: ['cultureSurveys'],
        queryFn: () => cultureApi.getSurveys()
    });

    const { data: trends = [] } = useQuery({
        queryKey: ['cultureSurveyTrends'],
        queryFn: () => cultureApi.getSurveyTrends()
    });

    const createSurveyMutation = useMutation({
        mutationFn: (data: any) => cultureApi.createSurvey(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cultureSurveys'] });
            setCreateOpen(false);
            toast({
                title: "Survey Created!",
                description: "Your culture pulse survey has been created.",
            });
            setSurveyTitle('');
            setSurveyDescription('');
        }
    });

    const handleCreateSurvey = () => {
        createSurveyMutation.mutate({
            title: surveyTitle,
            description: surveyDescription,
            status: 'active'
        });
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">Culture Pulse Surveys</h1>
                    <p className="text-muted-foreground mt-1">Measure engagement, satisfaction, and cultural alignment over time.</p>
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="font-bold shadow-lg shadow-primary/20">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Survey
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Create New Survey</DialogTitle>
                            <DialogDescription>
                                Design a pulse survey to gather feedback from your team.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Survey Title</Label>
                                <Input
                                    placeholder="e.g., Q4 2024 Engagement Survey"
                                    value={surveyTitle}
                                    onChange={(e) => setSurveyTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    placeholder="What is this survey about?"
                                    value={surveyDescription}
                                    onChange={(e) => setSurveyDescription(e.target.value)}
                                    className="resize-none h-24"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Survey Template</Label>
                                <RadioGroup defaultValue="engagement">
                                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                                        <RadioGroupItem value="engagement" id="engagement" />
                                        <Label htmlFor="engagement" className="cursor-pointer flex-1">
                                            <div className="font-medium">Engagement Survey</div>
                                            <div className="text-xs text-muted-foreground">12 questions about work satisfaction and culture</div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                                        <RadioGroupItem value="quick" id="quick" />
                                        <Label htmlFor="quick" className="cursor-pointer flex-1">
                                            <div className="font-medium">Quick Pulse</div>
                                            <div className="text-xs text-muted-foreground">5 questions for rapid feedback</div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                                        <RadioGroupItem value="custom" id="custom" />
                                        <Label htmlFor="custom" className="cursor-pointer flex-1">
                                            <div className="font-medium">Custom Survey</div>
                                            <div className="text-xs text-muted-foreground">Build your own from scratch</div>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                        <Button onClick={handleCreateSurvey} className="w-full font-bold" disabled={!surveyTitle}>
                            Create & Send Survey
                        </Button>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                        <CardDescription>Overall Engagement</CardDescription>
                        <CardTitle className="text-2xl font-bold text-green-600">8.4/10</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                            <TrendingUp className="h-4 w-4" />
                            +0.2 from last month
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardDescription>Response Rate</CardDescription>
                        <CardTitle className="text-2xl font-bold text-blue-600">71%</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Progress value={71} className="h-2" />
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                        <CardDescription>Active Surveys</CardDescription>
                        <CardTitle className="text-2xl font-bold text-purple-600">2</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">229 total responses</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-2">
                        <CardDescription>Avg. Completion Time</CardDescription>
                        <CardTitle className="text-2xl font-bold text-orange-600">3.2m</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Per survey</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="surveys" className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="surveys">Surveys</TabsTrigger>
                    <TabsTrigger value="trends">Trends</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="surveys" className="space-y-4">
                    {surveys.map((survey: any) => (
                        <Card key={survey.id} className="hover:shadow-md transition-all">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CardTitle className="text-xl">{survey.title}</CardTitle>
                                            <Badge variant={survey.status === 'active' ? 'default' : 'secondary'}>
                                                {survey.status === 'active' ? (
                                                    <><Clock className="h-3 w-3 mr-1" /> Active</>
                                                ) : (
                                                    <><CheckCircle2 className="h-3 w-3 mr-1" /> {survey.status}</>
                                                )}
                                            </Badge>
                                        </div>
                                        <CardDescription>{survey.description}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Responses</p>
                                        <p className="font-bold text-lg">{survey.response_count}/{survey.total_recipients}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Response Rate</p>
                                        <p className="font-bold text-lg">{survey.total_recipients ? Math.round((survey.response_count / survey.total_recipients) * 100) : 0}%</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Questions</p>
                                        <p className="font-bold text-lg">{survey.question_count || 12}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Deadline</p>
                                        <p className="font-bold text-lg">{survey.deadline ? new Date(survey.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Completion</span>
                                        <span className="font-medium">{survey.total_recipients ? Math.round((survey.response_count / survey.total_recipients) * 100) : 0}%</span>
                                    </div>
                                    <Progress value={survey.total_recipients ? (survey.response_count / survey.total_recipients) * 100 : 0} className="h-2" />
                                </div>
                            </CardContent>
                            <CardFooter className="gap-2">
                                <Button variant="outline" size="sm">
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    View Results
                                </Button>
                                {survey.status === 'active' && (
                                    <Button variant="outline" size="sm">
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Send Reminder
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="trends" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Engagement Trends</CardTitle>
                            <CardDescription>Track how culture metrics evolve over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trends}>
                                        <defs>
                                            <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorSatisfaction" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorAlignment" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                        <YAxis domain={[6, 10]} axisLine={false} tickLine={false} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="engagement" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorEngagement)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="satisfaction" stroke="#10b981" fillOpacity={1} fill="url(#colorSatisfaction)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="alignment" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorAlignment)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-6 mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                                    <span className="text-sm">Engagement</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="text-sm">Satisfaction</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                    <span className="text-sm">Values Alignment</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Category Breakdown</CardTitle>
                            <CardDescription>Latest survey scores by category</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={CATEGORY_SCORES} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                                        <XAxis type="number" domain={[0, 10]} axisLine={false} tickLine={false} />
                                        <YAxis type="category" dataKey="category" width={150} axisLine={false} tickLine={false} />
                                        <Tooltip />
                                        <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="insights" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Key Insights</CardTitle>
                            <CardDescription>AI-powered analysis of survey responses</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-green-500 rounded-lg">
                                        <TrendingUp className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-green-900">Strong Team Culture</h4>
                                        <p className="text-sm text-green-800 mt-1">
                                            Team culture scores increased by 0.3 points this quarter. Employees particularly appreciate the new collaboration tools and team events.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-orange-500 rounded-lg">
                                        <MessageSquare className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-orange-900">Recognition Opportunity</h4>
                                        <p className="text-sm text-orange-800 mt-1">
                                            Recognition scores are slightly below target. Consider implementing more frequent peer-to-peer recognition programs.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-500 rounded-lg">
                                        <Users className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-blue-900">High Participation</h4>
                                        <p className="text-sm text-blue-800 mt-1">
                                            71% response rate exceeds industry average of 60%. Employees are engaged and willing to provide feedback.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
