import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { recruitmentApi } from '@/services/recruitmentApi';
import { Plus, Briefcase, Users, Calendar, FileTextIcon, Loader2, TrendingUp, Eye, Edit, Trash2, UserCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';

import SEO from '@/components/SEO';

const statusColors: Record<string, string> = {
    draft: 'bg-gray-500',
    published: 'bg-green-500',
    closed: 'bg-red-500',
    'on-hold': 'bg-yellow-500',
    new: 'bg-blue-500',
    in_progress: 'bg-purple-500',
    hired: 'bg-emerald-500',
    rejected: 'bg-red-600',
};

const stageLabels: Record<string, string> = {
    applied: 'Applied',
    screening: 'Screening',
    phone_screen: 'Phone Screen',
    interview: 'Interview',
    technical: 'Technical',
    final_round: 'Final Round',
    offer: 'Offer',
    hired: 'Hired',
    rejected: 'Rejected',
};

export default function Recruitment() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('jobs');
    const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
    const [isCandidateDialogOpen, setIsCandidateDialogOpen] = useState(false);
    const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
    const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [selectedApplication, setSelectedApplication] = useState<any>(null);

    const [newJob, setNewJob] = useState({
        title: '',
        department: '',
        location: '',
        employment_type: 'full-time',
        experience_level: 'mid-level',
        salary_min: '',
        salary_max: '',
        description: '',
        requirements: '',
        responsibilities: '',
        benefits: '',
        status: 'draft',
        application_deadline: '',
    });

    const [newCandidate, setNewCandidate] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        linkedin_url: '',
        current_company: '',
        current_title: '',
        years_of_experience: '',
        skills: '',
    });

    const [newInterview, setNewInterview] = useState({
        application_id: '',
        interview_type: 'phone_screen',
        scheduled_at: '',
        duration_minutes: '60',
        location: '',
        meeting_link: '',
        notes: '',
    });

    const [isHireDialogOpen, setIsHireDialogOpen] = useState(false);
    const [selectedCandidateForHire, setSelectedCandidateForHire] = useState<any>(null);
    const [hireData, setHireData] = useState({
        email: '',
        job_title: '',
        create_onboarding: true
    });

    // ==================== QUERIES ====================
    const { data: jobsData, isLoading: jobsLoading } = useQuery({
        queryKey: ['job-openings'],
        queryFn: () => recruitmentApi.getJobOpenings(),
    });

    const { data: applicationsData, isLoading: applicationsLoading } = useQuery({
        queryKey: ['job-applications', selectedJob?.id],
        queryFn: () => recruitmentApi.getJobApplications(selectedJob?.id ? { job_id: selectedJob.id } : {}),
        enabled: activeTab === 'applications',
    });

    const { data: candidatesData, isLoading: candidatesLoading } = useQuery({
        queryKey: ['candidates'],
        queryFn: () => recruitmentApi.getCandidates(),
        enabled: activeTab === 'candidates',
    });

    const { data: interviewsData, isLoading: interviewsLoading } = useQuery({
        queryKey: ['interviews'],
        queryFn: () => recruitmentApi.getInterviews(),
        enabled: activeTab === 'interviews',
    });

    const { data: analyticsData } = useQuery({
        queryKey: ['recruitment-analytics'],
        queryFn: () => recruitmentApi.getAnalytics(),
    });

    // ==================== MUTATIONS ====================
    const createJobMutation = useMutation({
        mutationFn: (data: any) => recruitmentApi.createJobOpening(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job-openings'] });
            toast({ title: 'Job opening created successfully' });
            setIsJobDialogOpen(false);
            setNewJob({
                title: '',
                department: '',
                location: '',
                employment_type: 'full-time',
                experience_level: 'mid-level',
                salary_min: '',
                salary_max: '',
                description: '',
                requirements: '',
                responsibilities: '',
                benefits: '',
                status: 'draft',
                application_deadline: '',
            });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });

    const createCandidateMutation = useMutation({
        mutationFn: (data: any) => recruitmentApi.createCandidate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidates'] });
            toast({ title: 'Candidate added successfully' });
            setIsCandidateDialogOpen(false);
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });

    const scheduleInterviewMutation = useMutation({
        mutationFn: (data: any) => recruitmentApi.scheduleInterview(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['interviews'] });
            toast({ title: 'Interview scheduled successfully' });
            setIsInterviewDialogOpen(false);
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });

    const updateStageMutation = useMutation({
        mutationFn: ({ id, stage, status }: any) => recruitmentApi.updateApplicationStage(id, { stage, status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job-applications'] });
            toast({ title: 'Application stage updated' });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });

    const hireMutation = useMutation({
        mutationFn: (data: any) => recruitmentApi.convertToEmployee(selectedCandidateForHire.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidates'] });
            queryClient.invalidateQueries({ queryKey: ['job-applications'] });
            toast({ title: 'Candidate hired successfully', description: 'Employee account and staff record created.' });
            setIsHireDialogOpen(false);
        },
        onError: (error: any) => {
            toast({ title: 'Error hiring candidate', description: error.message, variant: 'destructive' });
        }
    });

    const jobs = jobsData?.data || [];
    const applications = applicationsData?.data || [];
    const candidates = candidatesData?.data || [];
    const interviews = interviewsData?.data || [];
    const analytics = analyticsData?.data || {};

    return (
        <>
            <SEO
                title="Recruitment & ATS"
                description="Manage job openings, applications, candidates, and interviews"
            />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold">Recruitment & ATS</h1>
                        <p className="text-muted-foreground">Manage your hiring pipeline and track candidates</p>
                    </div>
                    <div className="flex gap-2">
                        <Dialog open={isCandidateDialogOpen} onOpenChange={setIsCandidateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Users className="mr-2 h-4 w-4" />
                                    Add Candidate
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Add New Candidate</DialogTitle>
                                    <DialogDescription>Add a candidate to your talent pool</DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>First Name</Label>
                                        <Input
                                            value={newCandidate.first_name}
                                            onChange={(e) => setNewCandidate({ ...newCandidate, first_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Last Name</Label>
                                        <Input
                                            value={newCandidate.last_name}
                                            onChange={(e) => setNewCandidate({ ...newCandidate, last_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Email *</Label>
                                        <Input
                                            type="email"
                                            value={newCandidate.email}
                                            onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Phone</Label>
                                        <Input
                                            value={newCandidate.phone}
                                            onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label>LinkedIn URL</Label>
                                        <Input
                                            value={newCandidate.linkedin_url}
                                            onChange={(e) => setNewCandidate({ ...newCandidate, linkedin_url: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Current Company</Label>
                                        <Input
                                            value={newCandidate.current_company}
                                            onChange={(e) => setNewCandidate({ ...newCandidate, current_company: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Current Title</Label>
                                        <Input
                                            value={newCandidate.current_title}
                                            onChange={(e) => setNewCandidate({ ...newCandidate, current_title: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label>Skills (comma-separated)</Label>
                                        <Textarea
                                            value={newCandidate.skills}
                                            onChange={(e) => setNewCandidate({ ...newCandidate, skills: e.target.value })}
                                            rows={2}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCandidateDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={() => createCandidateMutation.mutate(newCandidate)}>
                                        {createCandidateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Add Candidate
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Job Opening
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Create Job Opening</DialogTitle>
                                    <DialogDescription>Post a new job opening</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <Label>Job Title *</Label>
                                            <Input
                                                value={newJob.title}
                                                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                                                placeholder="e.g., Senior Software Engineer"
                                            />
                                        </div>
                                        <div>
                                            <Label>Department *</Label>
                                            <Input
                                                value={newJob.department}
                                                onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                                                placeholder="e.g., Engineering"
                                            />
                                        </div>
                                        <div>
                                            <Label>Location</Label>
                                            <Input
                                                value={newJob.location}
                                                onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                                                placeholder="e.g., Remote, New York, NY"
                                            />
                                        </div>
                                        <div>
                                            <Label>Employment Type</Label>
                                            <Select value={newJob.employment_type} onValueChange={(v: any) => setNewJob({ ...newJob, employment_type: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="full-time">Full-Time</SelectItem>
                                                    <SelectItem value="part-time">Part-Time</SelectItem>
                                                    <SelectItem value="contract">Contract</SelectItem>
                                                    <SelectItem value="intern">Intern</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Experience Level</Label>
                                            <Select value={newJob.experience_level} onValueChange={(v: any) => setNewJob({ ...newJob, experience_level: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="entry-level">Entry Level</SelectItem>
                                                    <SelectItem value="mid-level">Mid Level</SelectItem>
                                                    <SelectItem value="senior">Senior</SelectItem>
                                                    <SelectItem value="lead">Lead</SelectItem>
                                                    <SelectItem value="executive">Executive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Salary Min</Label>
                                            <Input
                                                type="number"
                                                value={newJob.salary_min}
                                                onChange={(e) => setNewJob({ ...newJob, salary_min: e.target.value })}
                                                placeholder="50000"
                                            />
                                        </div>
                                        <div>
                                            <Label>Salary Max</Label>
                                            <Input
                                                type="number"
                                                value={newJob.salary_max}
                                                onChange={(e) => setNewJob({ ...newJob, salary_max: e.target.value })}
                                                placeholder="80000"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Label>Description</Label>
                                            <Textarea
                                                value={newJob.description}
                                                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                                                rows={3}
                                                placeholder="Job description..."
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Label>Requirements</Label>
                                            <Textarea
                                                value={newJob.requirements}
                                                onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                                                rows={3}
                                                placeholder="Required qualifications..."
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Label>Responsibilities</Label>
                                            <Textarea
                                                value={newJob.responsibilities}
                                                onChange={(e) => setNewJob({ ...newJob, responsibilities: e.target.value })}
                                                rows={3}
                                                placeholder="Key responsibilities..."
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsJobDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={() => createJobMutation.mutate(newJob)}>
                                        {createJobMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Job
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.stats?.active_jobs || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Open positions</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">New Applications</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.stats?.new_applications || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Upcoming Interviews</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.stats?.upcoming_interviews || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.stats?.total_candidates || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">In talent pool</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="jobs">
                            <Briefcase className="h-4 w-4 mr-2" />
                            Job Openings
                        </TabsTrigger>
                        <TabsTrigger value="applications">
                            <FileTextIcon className="h-4 w-4 mr-2" />
                            Applications
                        </TabsTrigger>
                        <TabsTrigger value="candidates">
                            <Users className="h-4 w-4 mr-2" />
                            Candidates
                        </TabsTrigger>
                        <TabsTrigger value="interviews">
                            <Calendar className="h-4 w-4 mr-2" />
                            Interviews
                        </TabsTrigger>
                    </TabsList>

                    {/* Job Openings Tab */}
                    <TabsContent value="jobs" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Job Openings</CardTitle>
                                <CardDescription>Manage your open positions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {jobsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : jobs.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Briefcase className="mx-auto h-12 w-12 mb-2 opacity-50" />
                                        <p>No job openings yet</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Title</TableHead>
                                                <TableHead>Department</TableHead>
                                                <TableHead>Location</TableHead>
                                                <TableHead>Applications</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Created</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {jobs.map((job: any) => (
                                                <TableRow key={job.id}>
                                                    <TableCell className="font-medium">{job.title}</TableCell>
                                                    <TableCell>{job.department}</TableCell>
                                                    <TableCell>{job.location || 'Not specified'}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{job.application_count || 0}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={statusColors[job.status]}>{job.status}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {format(parseISO(job.created_at), 'MMM d, yyyy')}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedJob(job);
                                                                setActiveTab('applications');
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Applications Tab */}
                    <TabsContent value="applications" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Applications</CardTitle>
                                <CardDescription>
                                    {selectedJob ? `Applications for ${selectedJob.title}` : 'All applications'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {applicationsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : applications.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <FileTextIcon className="mx-auto h-12 w-12 mb-2 opacity-50" />
                                        <p>No applications yet</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Candidate</TableHead>
                                                <TableHead>Job</TableHead>
                                                <TableHead>Stage</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Applied</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {applications.map((app: any) => (
                                                <TableRow key={app.id}>
                                                    <TableCell className="font-medium">
                                                        {app.candidate_first_name} {app.candidate_last_name}
                                                        <div className="text-xs text-muted-foreground">{app.candidate_email}</div>
                                                    </TableCell>
                                                    <TableCell>{app.job_title}</TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={app.current_stage}
                                                            onValueChange={(stage) => updateStageMutation.mutate({ id: app.id, stage, status: 'in_progress' })}
                                                        >
                                                            <SelectTrigger className="w-[150px]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Object.entries(stageLabels).map(([value, label]) => (
                                                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={statusColors[app.status]}>{app.status}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {format(parseISO(app.applied_at), 'MMM d, yyyy')}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedApplication(app);
                                                                setNewInterview({ ...newInterview, application_id: app.id.toString() });
                                                                setIsInterviewDialogOpen(true);
                                                            }}
                                                        >
                                                            <Calendar className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Candidates Tab */}
                    <TabsContent value="candidates" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Candidate Pool</CardTitle>
                                <CardDescription>All candidates in your talent database</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {candidatesLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : candidates.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Users className="mx-auto h-12 w-12 mb-2 opacity-50" />
                                        <p>No candidates yet</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Current Position</TableHead>
                                                <TableHead>Experience</TableHead>
                                                <TableHead>Applications</TableHead>
                                                <TableHead>Added</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {candidates.map((candidate: any) => (
                                                <TableRow key={candidate.id}>
                                                    <TableCell className="font-medium">
                                                        {candidate.first_name} {candidate.last_name}
                                                    </TableCell>
                                                    <TableCell>{candidate.email}</TableCell>
                                                    <TableCell>
                                                        {candidate.current_title && candidate.current_company
                                                            ? `${candidate.current_title} at ${candidate.current_company}`
                                                            : 'Not specified'}
                                                    </TableCell>
                                                    <TableCell>{candidate.years_of_experience ? `${candidate.years_of_experience} years` : 'N/A'}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{candidate.application_count || 0}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {format(parseISO(candidate.created_at), 'MMM d, yyyy')}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                                            onClick={() => {
                                                                setSelectedCandidateForHire(candidate);
                                                                setHireData({
                                                                    email: candidate.email,
                                                                    job_title: candidate.current_title || '',
                                                                    create_onboarding: true
                                                                });
                                                                setIsHireDialogOpen(true);
                                                            }}
                                                        >
                                                            <UserCheck className="h-4 w-4 mr-2" />
                                                            Hire
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Interviews Tab */}
                    <TabsContent value="interviews" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Scheduled Interviews</CardTitle>
                                <CardDescription>Upcoming and past interviews</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {interviewsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : interviews.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Calendar className="mx-auto h-12 w-12 mb-2 opacity-50" />
                                        <p>No interviews scheduled</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Candidate</TableHead>
                                                <TableHead>Job</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Scheduled</TableHead>
                                                <TableHead>Interviewer</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {interviews.map((interview: any) => (
                                                <TableRow key={interview.id}>
                                                    <TableCell className="font-medium">
                                                        {interview.candidate_first_name} {interview.candidate_last_name}
                                                    </TableCell>
                                                    <TableCell>{interview.job_title}</TableCell>
                                                    <TableCell className="capitalize">{interview.interview_type.replace('_', ' ')}</TableCell>
                                                    <TableCell>
                                                        {format(parseISO(interview.scheduled_at), 'MMM d, yyyy h:mm a')}
                                                    </TableCell>
                                                    <TableCell>{interview.interviewer_name || 'Not assigned'}</TableCell>
                                                    <TableCell>
                                                        <Badge className={statusColors[interview.status]}>{interview.status}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Interview Dialog */}
                <Dialog open={isInterviewDialogOpen} onOpenChange={setIsInterviewDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Schedule Interview</DialogTitle>
                            <DialogDescription>Set up an interview for this candidate</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Interview Type</Label>
                                <Select value={newInterview.interview_type} onValueChange={(v: any) => setNewInterview({ ...newInterview, interview_type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="phone_screen">Phone Screen</SelectItem>
                                        <SelectItem value="video">Video Interview</SelectItem>
                                        <SelectItem value="in_person">In-Person</SelectItem>
                                        <SelectItem value="technical">Technical</SelectItem>
                                        <SelectItem value="panel">Panel Interview</SelectItem>
                                        <SelectItem value="final">Final Round</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Scheduled Date & Time</Label>
                                <Input
                                    type="datetime-local"
                                    value={newInterview.scheduled_at}
                                    onChange={(e) => setNewInterview({ ...newInterview, scheduled_at: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Duration (minutes)</Label>
                                <Input
                                    type="number"
                                    value={newInterview.duration_minutes}
                                    onChange={(e) => setNewInterview({ ...newInterview, duration_minutes: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Meeting Link</Label>
                                <Input
                                    value={newInterview.meeting_link}
                                    onChange={(e) => setNewInterview({ ...newInterview, meeting_link: e.target.value })}
                                    placeholder="https://zoom.us/..."
                                />
                            </div>
                            <div>
                                <Label>Notes</Label>
                                <Textarea
                                    value={newInterview.notes}
                                    onChange={(e) => setNewInterview({ ...newInterview, notes: e.target.value })}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsInterviewDialogOpen(false)}>Cancel</Button>
                            <Button onClick={() => scheduleInterviewMutation.mutate(newInterview)}>
                                {scheduleInterviewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Schedule Interview
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Hire Dialog */}
                <Dialog open={isHireDialogOpen} onOpenChange={setIsHireDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Hire Candidate</DialogTitle>
                            <DialogDescription>Convert {selectedCandidateForHire?.first_name} {selectedCandidateForHire?.last_name} to an employee.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-sm">
                                This will create a user account and staff record for the candidate. An onboarding checklist can also be generated.
                            </div>
                            <div>
                                <Label>Work Email *</Label>
                                <Input
                                    value={hireData.email}
                                    onChange={(e) => setHireData({ ...hireData, email: e.target.value })}
                                    placeholder="employee@company.com"
                                />
                            </div>
                            <div>
                                <Label>Job Title *</Label>
                                <Input
                                    value={hireData.job_title}
                                    onChange={(e) => setHireData({ ...hireData, job_title: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="onboarding"
                                    checked={hireData.create_onboarding}
                                    onChange={(e) => setHireData({ ...hireData, create_onboarding: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="onboarding">Create onboarding checklist</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsHireDialogOpen(false)}>Cancel</Button>
                            <Button onClick={() => hireMutation.mutate(hireData)}>
                                {hireMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Hire Candidate
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

