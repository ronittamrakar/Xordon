import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Briefcase, Users, UserPlus, Search,
    Filter, LayoutGrid, List, MoreVertical,
    Clock, CheckCircle2, XCircle, ChevronRight,
    Star, Mail, Phone, Calendar as CalendarIcon,
    ArrowRight, MapPin, DollarSign, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { hrGapApi, RecruitmentJob, Candidate } from '@/services/hrGapApi';
import { Skeleton } from '@/components/ui/skeleton';

const RecruitmentPage = () => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [activeTab, setActiveTab] = useState('jobs');
    const queryClient = useQueryClient();

    const { data: jobs, isLoading: jobsLoading } = useQuery({
        queryKey: ['recruitmentJobs'],
        queryFn: () => hrGapApi.getJobs()
    });

    // Fetch applications instead of just candidates to get more context (job, status)
    const { data: applications, isLoading: applicationsLoading } = useQuery({
        queryKey: ['recruitmentApplications'],
        queryFn: () => hrGapApi.getApplications()
    });

    const { data: candidates, isLoading: candidatesLoading } = useQuery({
        queryKey: ['candidates'],
        queryFn: () => hrGapApi.getCandidates()
    });

    const { data: analytics } = useQuery({
        queryKey: ['recruitmentAnalytics'],
        queryFn: hrGapApi.getRecruitmentAnalytics,
        enabled: activeTab === 'analytics'
    });

    // Derived Stats
    const activeJobsCount = jobs?.filter(j => j.status === 'published').length || 0;
    const totalCandidatesCount = candidates?.length || 0;

    // Calculate pending interviews from applications if status is available, otherwise mock or use 0
    const pendingInterviewsCount = applications?.filter((app: any) =>
        ['interview', 'interviewing', 'scheduled'].includes(app.status?.toLowerCase())
    ).length || 0;

    // Time to hire - fetch from analytics or default
    const timeToHire = analytics?.time_to_hire || 'N/A';

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Hiring & Training</h1>
                    <p className="text-muted-foreground">Manage job openings, candidate pipeline, and employer branding</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline"><LayoutGrid className="h-4 w-4 mr-2" /> Pipeline View</Button>
                    <Button><UserPlus className="h-4 w-4 mr-2" /> Post New Job</Button>
                </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="flex flex-wrap gap-4 items-stretch">
                <div className="flex-1 min-w-[200px] p-4 bg-white border rounded-2xl shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Briefcase className="h-6 w-6" /></div>
                    <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase">Active Jobs</p>
                        <p className="text-2xl font-black">{activeJobsCount}</p>
                    </div>
                </div>
                <div className="flex-1 min-w-[200px] p-4 bg-white border rounded-2xl shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><Users className="h-6 w-6" /></div>
                    <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase">Total Candidates</p>
                        <p className="text-2xl font-black">{totalCandidatesCount}</p>
                    </div>
                </div>
                <div className="flex-1 min-w-[200px] p-4 bg-white border rounded-2xl shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><Clock className="h-6 w-6" /></div>
                    <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase">Pending Interviews</p>
                        <p className="text-2xl font-black">{pendingInterviewsCount}</p>
                    </div>
                </div>
                <div className="flex-1 min-w-[200px] p-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl shadow-lg border-0 flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl"><Zap className="h-6 w-6" /></div>
                    <div>
                        <p className="text-xs opacity-80 font-bold uppercase">Time to Hire</p>
                        <p className="text-2xl font-black">{timeToHire}</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="jobs" className="w-full" onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4">
                    <TabsList className="bg-slate-100">
                        <TabsTrigger value="jobs">Job Openings</TabsTrigger>
                        <TabsTrigger value="candidates">Candidates</TabsTrigger>
                        <TabsTrigger value="interviews">Interviews</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    </TabsList>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search..." className="pl-9 w-64" />
                        </div>
                        <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
                    </div>
                </div>

                <TabsContent value="jobs">
                    {jobsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {jobs?.map((job) => (
                                <Card key={job.id} className="group hover:border-primary/50 transition-all shadow-sm border overflow-hidden">
                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <Badge variant={job.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                                                {job.status}
                                            </Badge>
                                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{job.title}</h3>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                {job.department} • <MapPin className="h-3 w-3" /> {job.location || 'Remote'}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground uppercase font-bold">Applications</p>
                                                <p className="font-black text-blue-600">{job.application_count}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground uppercase font-bold">New</p>
                                                <p className="font-black text-green-600">{job.new_applications}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground uppercase font-bold">In Pipeline</p>
                                                <p className="font-black">{job.application_count}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" className="w-full text-xs">Share Job</Button>
                                            <Button className="w-full text-xs" variant="secondary">View Applicants</Button>
                                        </div>
                                    </div>
                                    <div className="px-6 py-3 bg-slate-50/50 border-t flex items-center justify-between group-hover:bg-primary/5 transition-colors">
                                        <p className="text-[12px] text-muted-foreground font-bold">POSTED ON {new Date(job.created_at).toLocaleDateString()}</p>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Card>
                            ))}
                            {(!jobs || jobs.length === 0) && (
                                <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
                                    <Briefcase className="h-12 w-12 text-slate-200 mb-4" />
                                    <p className="text-lg font-medium text-slate-500">No jobs posted yet</p>
                                    <Button className="mt-4"><UserPlus className="h-4 w-4 mr-2" /> Post New Job</Button>
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="candidates">
                    <Card>
                        <CardContent className="p-0">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b text-xs uppercase font-bold text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Candidate Name</th>
                                        <th className="px-6 py-4 text-left">Contact</th>
                                        <th className="px-6 py-4 text-left">Status</th>
                                        <th className="px-6 py-4 text-left">Applied Job</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-sm">
                                    {/* Ideally we use applications here as it links candidate to job */}
                                    {applications && applications.length > 0 ? (
                                        applications.map((app: any) => (
                                            <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 uppercase">
                                                            {app.candidate?.first_name?.[0] || '?'}{app.candidate?.last_name?.[0] || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold">{app.candidate?.first_name} {app.candidate?.last_name}</p>
                                                            <p className="text-xs text-muted-foreground">{app.candidate?.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><Mail className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 capitalize">{app.status || 'New'}</Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-medium">{app.job?.title || 'Unknown Role'}</p>
                                                    <p className="text-xs text-muted-foreground">{app.job?.department || 'General'}</p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" className="text-xs">Manage Pipeline <ArrowRight className="h-3 w-3 ml-2" /></Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        // Fallback to candidates list if applications is empty but candidates exist (legacy view)
                                        candidates?.map((candidate) => (
                                            <tr key={candidate.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 uppercase">
                                                            {candidate.first_name[0]}{candidate.last_name[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold">{candidate.first_name} {candidate.last_name}</p>
                                                            <p className="text-xs text-muted-foreground">{candidate.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><Mail className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="secondary">Candidate</Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-muted-foreground italic">No active application</p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" className="text-xs">View Profile <ArrowRight className="h-3 w-3 ml-2" /></Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            {(!candidates || candidates.length === 0) && (!applications || applications.length === 0) && (
                                <div className="text-center py-20 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>Find and manage your applicants here</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="interviews">
                    {/* Filter applications for interview status */}
                    {applications && applications.filter((a: any) => ['interview', 'interviewing', 'scheduled'].includes(a.status?.toLowerCase())).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {applications.filter((a: any) => ['interview', 'interviewing', 'scheduled'].includes(a.status?.toLowerCase())).map((app: any) => (
                                <Card key={app.id}>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-base font-medium">Interview</CardTitle>
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{app.candidate?.first_name} {app.candidate?.last_name}</div>
                                        <p className="text-xs text-muted-foreground mb-4">{app.job?.title}</p>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Badge>Scheduled</Badge>
                                            <span className="text-xs text-muted-foreground">Check calendar for details</span>
                                        </div>
                                        <Button className="w-full" variant="outline">View Details</Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                                <CalendarIcon className="h-10 w-10 text-slate-300" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">No interviews scheduled</h2>
                            <p className="text-muted-foreground max-w-sm">Schedule interviews with candidates from the pipeline view or individual candidate profiles.</p>
                            <Button className="mt-6"><UserPlus className="h-4 w-4 mr-2" /> Find Candidates</Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="analytics">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Applications by Source</CardTitle></CardHeader>
                            <CardContent className="h-[250px] flex items-center justify-center border-t">
                                {analytics ? (
                                    <div className="text-center">
                                        <p className="text-3xl font-bold">{analytics.total_applications || 0}</p>
                                        <p className="text-sm text-muted-foreground">Total Applications</p>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm italic">No data available</p>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Pipeline Conversion</CardTitle></CardHeader>
                            <CardContent className="h-[250px] flex items-center justify-center border-t">
                                {analytics ? (
                                    <div className="text-center">
                                        <p className="text-3xl font-bold">{analytics.conversion_rate || '0%'}</p>
                                        <p className="text-sm text-muted-foreground">Conversion Rate</p>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm italic">No data available</p>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Job Views vs Applications</CardTitle></CardHeader>
                            <CardContent className="h-[250px] flex items-center justify-center border-t">
                                {analytics ? (
                                    <div className="text-center">
                                        <p className="text-3xl font-bold">{analytics.views || 0}</p>
                                        <p className="text-sm text-muted-foreground">Total Views</p>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm italic">No data available</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default RecruitmentPage;
