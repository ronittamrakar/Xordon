import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    User, Mail, Phone, MapPin, Calendar, Briefcase,
    Clock, Shield, Award, GraduationCap, Heart,
    FileText, CheckCircle2, AlertCircle, TrendingUp,
    Settings, Edit3, Save, X, Plus, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { hrGapApi } from '@/services/hrGapApi';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const EmployeeProfilePage = () => {
    const { id = 'me' } = useParams();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['employeeProfile', id],
        queryFn: () => hrGapApi.getEmployeeProfile(id)
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['employeeStats', id],
        queryFn: () => hrGapApi.getEmployeeStats(id)
    });

    const updateMutation = useMutation({
        mutationFn: (updateData: any) => hrGapApi.updateEmployeeProfile(id, updateData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employeeProfile', id] });
            setIsEditing(false);
            toast.success('Profile updated successfully');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to update profile');
        }
    });

    const [editData, setEditData] = useState<any>(null);

    React.useEffect(() => {
        if (data?.profile) {
            setEditData({
                ...data.profile,
                skills: typeof data.profile.skills === 'string' ? JSON.parse(data.profile.skills) : (data.profile.skills || []),
                certifications: typeof data.profile.certifications === 'string' ? JSON.parse(data.profile.certifications) : (data.profile.certifications || [])
            });
        } else {
            setEditData({
                job_title: '',
                department: '',
                employment_type: 'full_time',
                work_location: '',
                hire_date: '',
                emergency_contact_name: '',
                emergency_contact_phone: '',
                emergency_contact_relation: '',
                skills: [],
                certifications: [],
                notes: ''
            });
        }
    }, [data]);

    if (isLoading) return <div className="p-8"><Skeleton className="h-[600px] w-full" /></div>;
    if (error || !data || !data.user) return <div className="p-8 text-center text-red-500">Error loading profile</div>;

    const user = data.user;
    const profile = data.profile;
    const summary = data.summary;

    const handleSave = () => {
        updateMutation.mutate(editData);
    };

    return (
        <div className="space-y-4">
            {/* Header / Basic Info */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-md">
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.name} className="h-full w-full rounded-full object-cover" />
                        ) : (
                            <User className="h-12 w-12 text-primary" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-[18px] font-bold tracking-tight">{user.name}</h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            {profile?.job_title || 'No Title Set'} • {profile?.department || 'No Department'}
                        </p>
                        <div className="flex gap-2 mt-2">
                            <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                                {user.status}
                            </Badge>
                            <Badge variant="outline" className="bg-primary/5">
                                {profile?.employment_type?.replace('_', ' ') || 'Full Time'}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>
                                <X className="h-4 w-4 mr-2" /> Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={updateMutation.isPending}>
                                <Save className="h-4 w-4 mr-2" /> Save Changes
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => setIsEditing(true)}>
                            <Edit3 className="h-4 w-4 mr-2" /> Edit Profile
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Contact & Summary */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Email</p>
                                    <p className="font-medium text-blue-600">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-50 text-green-600">
                                    <Phone className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Phone</p>
                                    <p className="font-medium">{user.phone || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                                    <MapPin className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Work Location</p>
                                    <p className="font-medium">{profile?.work_location || 'Remote / Head Office'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Work Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                                    <p className="text-xs text-orange-600 uppercase font-bold">Total Hours</p>
                                    <p className="text-xl font-bold text-orange-700">{summary?.total_hours_worked || 0}h</p>
                                </div>
                                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                                    <p className="text-xs text-indigo-600 uppercase font-bold">Annual Leave</p>
                                    <p className="text-xl font-bold text-indigo-700">{summary?.leave_balance_annual || 0}d</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-slate-500" />
                                    <span className="text-sm font-medium">Status</span>
                                </div>
                                <Badge variant="outline" className="capitalize bg-white shadow-sm">
                                    {summary?.current_status || 'Offline'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Emergency Contact</CardTitle>
                            <Heart className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            {isEditing ? (
                                <div className="space-y-3">
                                    <div>
                                        <Label>Name</Label>
                                        <Input value={editData.emergency_contact_name} onChange={e => setEditData({ ...editData, emergency_contact_name: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Phone</Label>
                                        <Input value={editData.emergency_contact_phone} onChange={e => setEditData({ ...editData, emergency_contact_phone: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Relation</Label>
                                        <Input value={editData.emergency_contact_relation} onChange={e => setEditData({ ...editData, emergency_contact_relation: e.target.value })} />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="font-bold">{profile?.emergency_contact_name || 'Not provided'}</p>
                                    <p className="text-muted-foreground">{profile?.emergency_contact_relation}</p>
                                    <p className="font-medium">{profile?.emergency_contact_phone}</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Tabs */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-6">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="schedule">Schedule</TabsTrigger>
                            <TabsTrigger value="performance">Performance</TabsTrigger>
                            <TabsTrigger value="documents">Documents</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview">
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Professional Profile</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {isEditing ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Job Title</Label>
                                                    <Input value={editData.job_title} onChange={e => setEditData({ ...editData, job_title: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Department</Label>
                                                    <Input value={editData.department} onChange={e => setEditData({ ...editData, department: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Hire Date</Label>
                                                    <Input type="date" value={editData.hire_date} onChange={e => setEditData({ ...editData, hire_date: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Employment Type</Label>
                                                    <Select value={editData.employment_type} onValueChange={v => setEditData({ ...editData, employment_type: v })}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="full_time">Full Time</SelectItem>
                                                            <SelectItem value="part_time">Part Time</SelectItem>
                                                            <SelectItem value="contract">Contract</SelectItem>
                                                            <SelectItem value="intern">Intern</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="flex items-start gap-3">
                                                    <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-semibold text-muted-foreground uppercase">Hire Date</p>
                                                        <p className="font-medium">{profile?.hire_date ? format(new Date(profile.hire_date), 'MMMM d, yyyy') : 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-semibold text-muted-foreground uppercase">Reports To</p>
                                                        <p className="font-medium">Manager Name</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Award className="h-5 w-5 text-yellow-600" />
                                                <h3 className="font-bold">Skills & Expertise</h3>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {editData?.skills?.map((skill: string, idx: number) => (
                                                    <Badge key={idx} variant="secondary" className="px-3 py-1">
                                                        {skill}
                                                        {isEditing && (
                                                            <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => {
                                                                const newSkills = [...editData.skills];
                                                                newSkills.splice(idx, 1);
                                                                setEditData({ ...editData, skills: newSkills });
                                                            }} />
                                                        )}
                                                    </Badge>
                                                ))}
                                                {isEditing && (
                                                    <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => {
                                                        const s = prompt('Add skill');
                                                        if (s) setEditData({ ...editData, skills: [...editData.skills, s] });
                                                    }}>
                                                        <Plus className="h-3 w-3 mr-1" /> Add
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="h-5 w-5 text-blue-600" />
                                                <h3 className="font-bold">Certifications</h3>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {editData?.certifications?.map((cert: string, idx: number) => (
                                                    <Badge key={idx} variant="outline" className="px-3 py-1 border-blue-200 text-blue-700">
                                                        {cert}
                                                        {isEditing && (
                                                            <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => {
                                                                const newCerts = [...editData.certifications];
                                                                newCerts.splice(idx, 1);
                                                                setEditData({ ...editData, certifications: newCerts });
                                                            }} />
                                                        )}
                                                    </Badge>
                                                ))}
                                                {isEditing && (
                                                    <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => {
                                                        const c = prompt('Add certification');
                                                        if (c) setEditData({ ...editData, certifications: [...editData.certifications, c] });
                                                    }}>
                                                        <Plus className="h-3 w-3 mr-1" /> Add
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="font-bold">About / Professional Notes</Label>
                                            {isEditing ? (
                                                <Textarea value={editData.notes} onChange={e => setEditData({ ...editData, notes: e.target.value })} className="h-32" />
                                            ) : (
                                                <div className="p-4 bg-muted/30 rounded-lg text-sm italic">
                                                    {profile?.notes || 'No notes available.'}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="schedule">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Upcoming Shifts</CardTitle>
                                    <CardDescription>Scheduled work hours for the next 14 days</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {stats?.shifts?.upcoming?.length > 0 ? stats.shifts.upcoming.map((shift: any) => (
                                            <div key={shift.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary">
                                                        <span className="text-[12px] font-bold uppercase">{format(new Date(shift.shift_date), 'EEE')}</span>
                                                        <span className="text-lg font-bold">{format(new Date(shift.shift_date), 'd')}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">{shift.shift_type_name || 'Regular Shift'}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {shift.start_time} - {shift.end_time} • {shift.location || 'Main Office'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge className="bg-green-100 text-green-800">{shift.status}</Badge>
                                                    <Button variant="ghost" size="icon"><ChevronRight className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-12 text-muted-foreground">
                                                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                                <p>No upcoming shifts scheduled.</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="performance">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Recent Reviews</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="p-4 border rounded-xl bg-slate-50">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="font-bold">Annual Review 2025</p>
                                                    <Badge className="bg-blue-600">4.5 / 5</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2">Excellent performance across all key metrics. Demonstrates strong leadership...</p>
                                                <Button variant="link" size="sm" className="px-0 h-auto mt-2">View Full Review</Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Goals & KPIs</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">Project Delivery</span>
                                                <span className="font-bold">85%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                                <div className="bg-green-500 h-full w-[85%]" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">Team Mentorship</span>
                                                <span className="font-bold">60%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                                <div className="bg-blue-500 h-full w-[60%]" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="documents">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Employee Documents</CardTitle>
                                        <CardDescription>Contracts, identification, and other HR files</CardDescription>
                                    </div>
                                    <Button><FileText className="h-4 w-4 mr-2" /> Upload</Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-orange-100 text-orange-600 font-bold">PDF</div>
                                                <div>
                                                    <p className="font-bold text-sm">Employment_Contract.pdf</p>
                                                    <p className="text-xs text-muted-foreground">Signed: Jan 12, 2024</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon"><Clock className="h-4 w-4" /></Button>
                                        </div>
                                        <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 font-bold">DOC</div>
                                                <div>
                                                    <p className="font-bold text-sm">Non_Disclosure_Agreement.docx</p>
                                                    <p className="text-xs text-muted-foreground">Signed: Jan 12, 2024</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon"><Clock className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default EmployeeProfilePage;
