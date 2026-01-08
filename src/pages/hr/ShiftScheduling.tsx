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
import { shiftSchedulingApi, staffApi } from '@/services';
import { Plus, Calendar, Clock, Users, RefreshCw, Loader2, CheckCircle, XCircle, ArrowLeftRight, AlertTriangle } from 'lucide-react';
import { format, parseISO, addDays, startOfWeek, endOfWeek } from 'date-fns';

import SEO from '@/components/SEO';

const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-500',
    confirmed: 'bg-green-500',
    in_progress: 'bg-purple-500',
    completed: 'bg-emerald-500',
    cancelled: 'bg-red-500',
    no_show: 'bg-gray-500',
    pending: 'bg-yellow-500',
    approved: 'bg-green-600',
    rejected: 'bg-red-600',
};

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ShiftScheduling() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('calendar');
    const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
    const [isShiftTypeDialogOpen, setIsShiftTypeDialogOpen] = useState(false);
    const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false);
    const [selectedWeek, setSelectedWeek] = useState(new Date());
    const [selectedShift, setSelectedShift] = useState<any>(null);
    const [conflicts, setConflicts] = useState<any[]>([]);
    const [showConflictsWarning, setShowConflictsWarning] = useState(false);

    const weekStart = startOfWeek(selectedWeek);
    const weekEnd = endOfWeek(selectedWeek);

    const [newShift, setNewShift] = useState({
        user_id: '',
        shift_type_id: '',
        shift_date: '',
        start_time: '09:00',
        end_time: '17:00',
        break_duration_minutes: '30',
        location: '',
        notes: '',
        status: 'scheduled',
    });

    const [newShiftType, setNewShiftType] = useState({
        name: '',
        description: '',
        color: '#3B82F6',
        default_start_time: '09:00',
        default_end_time: '17:00',
        default_break_minutes: '30',
    });

    const [newAvailability, setNewAvailability] = useState({
        user_id: '',
        day_of_week: '1',
        start_time: '09:00',
        end_time: '17:00',
        is_available: true,
    });

    // ==================== QUERIES ====================
    const { data: shiftsData, isLoading: shiftsLoading } = useQuery({
        queryKey: ['shifts', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')],
        queryFn: () => shiftSchedulingApi.getShifts({
            start_date: format(weekStart, 'yyyy-MM-dd'),
            end_date: format(weekEnd, 'yyyy-MM-dd'),
        }),
    });

    const { data: shiftTypesData } = useQuery({
        queryKey: ['shift-types'],
        queryFn: () => shiftSchedulingApi.getShiftTypes(),
    });

    const { data: swapRequestsData, isLoading: swapsLoading } = useQuery({
        queryKey: ['shift-swap-requests'],
        queryFn: () => shiftSchedulingApi.getShiftSwapRequests(),
        enabled: activeTab === 'swaps',
    });

    const { data: availabilityData, isLoading: availabilityLoading } = useQuery({
        queryKey: ['employee-availability'],
        queryFn: () => shiftSchedulingApi.getAvailability(),
        enabled: activeTab === 'availability',
    });

    const { data: staffData } = useQuery({
        queryKey: ['staff'],
        queryFn: () => staffApi.list(),
    });

    const { data: analyticsData } = useQuery({
        queryKey: ['scheduling-analytics'],
        queryFn: () => shiftSchedulingApi.getAnalytics({
            start_date: format(weekStart, 'yyyy-MM-dd'),
            end_date: format(weekEnd, 'yyyy-MM-dd'),
        }),
    });

    const { data: allConflictsData } = useQuery({
        queryKey: ['shift-conflicts'],
        queryFn: () => shiftSchedulingApi.getConflicts(),
        enabled: activeTab === 'conflicts',
    });

    // ==================== MUTATIONS ====================
    const createShiftMutation = useMutation({
        mutationFn: (data: any) => shiftSchedulingApi.createShift(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            queryClient.invalidateQueries({ queryKey: ['scheduling-analytics'] });
            toast({ title: 'Shift created successfully' });
            setIsShiftDialogOpen(false);
            setConflicts([]);
            setShowConflictsWarning(false);
            setNewShift({
                user_id: '',
                shift_type_id: '',
                shift_date: '',
                start_time: '09:00',
                end_time: '17:00',
                break_duration_minutes: '30',
                location: '',
                notes: '',
                status: 'scheduled',
            });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });

    const createShiftTypeMutation = useMutation({
        mutationFn: (data: any) => shiftSchedulingApi.createShiftType(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shift-types'] });
            toast({ title: 'Shift type created successfully' });
            setIsShiftTypeDialogOpen(false);
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });

    const setAvailabilityMutation = useMutation({
        mutationFn: (data: any) => shiftSchedulingApi.setAvailability(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-availability'] });
            toast({ title: 'Availability updated successfully' });
            setIsAvailabilityDialogOpen(false);
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });

    const respondToSwapMutation = useMutation({
        mutationFn: ({ id, action, reason }: any) => shiftSchedulingApi.respondToSwapRequest(id, { action, reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shift-swap-requests'] });
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            toast({ title: 'Swap request updated' });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });

    const shifts = shiftsData?.data || [];
    const shiftTypes = shiftTypesData?.data || [];
    const swapRequests = swapRequestsData?.data || [];
    const availability = availabilityData?.data || [];
    const staff = staffData || [];
    const analytics = analyticsData?.data || {};
    const allConflicts = allConflictsData || [];

    const handleCreateShift = async () => {
        if (showConflictsWarning) {
            createShiftMutation.mutate(newShift);
            return;
        }

        try {
            const result = await shiftSchedulingApi.validateShift(newShift);
            if (result.has_conflicts) {
                setConflicts(result.conflicts);
                setShowConflictsWarning(true);
            } else {
                createShiftMutation.mutate(newShift);
            }
        } catch (error: any) {
            createShiftMutation.mutate(newShift);
        }
    };

    // Group shifts by date
    const shiftsByDate: Record<string, any[]> = {};
    shifts.forEach((shift: any) => {
        if (!shiftsByDate[shift.shift_date]) {
            shiftsByDate[shift.shift_date] = [];
        }
        shiftsByDate[shift.shift_date].push(shift);
    });

    return (
        <>
            <SEO
                title="Shift Scheduling"
                description="Manage employee shifts, schedules, and availability"
            />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold">Shift Scheduling</h1>
                        <p className="text-muted-foreground">Manage employee schedules and shifts</p>
                    </div>
                    <div className="flex gap-2">
                        <Dialog open={isShiftTypeDialogOpen} onOpenChange={setIsShiftTypeDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Shift Type
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create Shift Type</DialogTitle>
                                    <DialogDescription>Define a new shift type template</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label>Name *</Label>
                                        <Input
                                            value={newShiftType.name}
                                            onChange={(e) => setNewShiftType({ ...newShiftType, name: e.target.value })}
                                            placeholder="e.g., Morning Shift"
                                        />
                                    </div>
                                    <div>
                                        <Label>Description</Label>
                                        <Textarea
                                            value={newShiftType.description}
                                            onChange={(e) => setNewShiftType({ ...newShiftType, description: e.target.value })}
                                            rows={2}
                                        />
                                    </div>
                                    <div>
                                        <Label>Color</Label>
                                        <Input
                                            type="color"
                                            value={newShiftType.color}
                                            onChange={(e) => setNewShiftType({ ...newShiftType, color: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Default Start Time</Label>
                                            <Input
                                                type="time"
                                                value={newShiftType.default_start_time}
                                                onChange={(e) => setNewShiftType({ ...newShiftType, default_start_time: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Default End Time</Label>
                                            <Input
                                                type="time"
                                                value={newShiftType.default_end_time}
                                                onChange={(e) => setNewShiftType({ ...newShiftType, default_end_time: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsShiftTypeDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={() => createShiftTypeMutation.mutate(newShiftType)}>
                                        {createShiftTypeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Type
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Shift
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Schedule New Shift</DialogTitle>
                                    <DialogDescription>Assign a shift to an employee</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    {showConflictsWarning && (
                                        <div className="bg-destructive/10 text-destructive p-3 rounded-md border border-destructive/20 text-sm">
                                            <div className="font-medium flex items-center gap-2 mb-2">
                                                <AlertTriangle className="h-4 w-4" />
                                                Conflicts Detected
                                            </div>
                                            <ul className="list-disc pl-5 space-y-1">
                                                {conflicts.map((c: any, i: number) => (
                                                    <li key={i}>{c.message}</li>
                                                ))}
                                            </ul>
                                            <div className="mt-2 font-medium">Click "Confirm & Create" to proceed anyway.</div>
                                        </div>
                                    )}
                                    <div>
                                        <Label>Employee *</Label>
                                        <Select value={newShift.user_id} onValueChange={(v) => setNewShift({ ...newShift, user_id: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                                            <SelectContent>
                                                {staff.map((member: any) => (
                                                    <SelectItem key={member.id} value={member.user_id?.toString() || ''}>
                                                        {member.first_name} {member.last_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Shift Type</Label>
                                        <Select value={newShift.shift_type_id} onValueChange={(v) => setNewShift({ ...newShift, shift_type_id: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select type (optional)" /></SelectTrigger>
                                            <SelectContent>
                                                {shiftTypes.map((type: any) => (
                                                    <SelectItem key={type.id} value={type.id.toString()}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded" style={{ backgroundColor: type.color }} />
                                                            {type.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Date *</Label>
                                        <Input
                                            type="date"
                                            value={newShift.shift_date}
                                            onChange={(e) => setNewShift({ ...newShift, shift_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Start Time *</Label>
                                            <Input
                                                type="time"
                                                value={newShift.start_time}
                                                onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>End Time *</Label>
                                            <Input
                                                type="time"
                                                value={newShift.end_time}
                                                onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Break Duration (minutes)</Label>
                                        <Input
                                            type="number"
                                            value={newShift.break_duration_minutes}
                                            onChange={(e) => setNewShift({ ...newShift, break_duration_minutes: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Location</Label>
                                        <Input
                                            value={newShift.location}
                                            onChange={(e) => setNewShift({ ...newShift, location: e.target.value })}
                                            placeholder="e.g., Main Office"
                                        />
                                    </div>
                                    <div>
                                        <Label>Notes</Label>
                                        <Textarea
                                            value={newShift.notes}
                                            onChange={(e) => setNewShift({ ...newShift, notes: e.target.value })}
                                            rows={2}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsShiftDialogOpen(false)}>Cancel</Button>
                                    <Button variant={showConflictsWarning ? "destructive" : "default"} onClick={handleCreateShift}>
                                        {createShiftMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {showConflictsWarning ? "Confirm & Create" : "Create Shift"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.stats?.total_hours?.toFixed(1) || 0}h</div>
                            <p className="text-xs text-muted-foreground mt-1">This week</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.stats?.total_shifts || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Employees Scheduled</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.stats?.employees_scheduled || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Active this week</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="calendar">
                            <Calendar className="h-4 w-4 mr-2" />
                            Calendar
                        </TabsTrigger>
                        <TabsTrigger value="swaps">
                            <ArrowLeftRight className="h-4 w-4 mr-2" />
                            Swap Requests
                        </TabsTrigger>
                        <TabsTrigger value="availability">
                            <Clock className="h-4 w-4 mr-2" />
                            Availability
                        </TabsTrigger>
                        <TabsTrigger value="conflicts">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Conflicts
                        </TabsTrigger>
                    </TabsList>

                    {/* Calendar Tab */}
                    <TabsContent value="calendar" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Weekly Schedule</CardTitle>
                                        <CardDescription>
                                            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}>
                                            Previous Week
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => setSelectedWeek(new Date())}>
                                            Today
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}>
                                            Next Week
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {shiftsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-7 gap-2">
                                        {Array.from({ length: 7 }).map((_, dayIndex) => {
                                            const currentDate = addDays(weekStart, dayIndex);
                                            const dateStr = format(currentDate, 'yyyy-MM-dd');
                                            const dayShifts = shiftsByDate[dateStr] || [];

                                            return (
                                                <div key={dayIndex} className="border rounded-lg p-3">
                                                    <div className="font-semibold text-sm mb-2">
                                                        {format(currentDate, 'EEE')}
                                                        <div className="text-xs text-muted-foreground">{format(currentDate, 'MMM d')}</div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {dayShifts.map((shift: any) => (
                                                            <div
                                                                key={shift.id}
                                                                className="text-xs p-2 rounded cursor-pointer hover:opacity-80"
                                                                style={{ backgroundColor: shift.shift_type_color || '#3B82F6', color: 'white' }}
                                                                onClick={() => setSelectedShift(shift)}
                                                            >
                                                                <div className="font-medium truncate">{shift.user_name}</div>
                                                                <div className="text-[12px] opacity-90">
                                                                    {shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Swap Requests Tab */}
                    <TabsContent value="swaps" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Shift Swap Requests</CardTitle>
                                <CardDescription>Manage shift exchange requests</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {swapsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : swapRequests.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <ArrowLeftRight className="mx-auto h-12 w-12 mb-2 opacity-50" />
                                        <p>No swap requests</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Requester</TableHead>
                                                <TableHead>Original Shift</TableHead>
                                                <TableHead>Target Shift</TableHead>
                                                <TableHead>Target Employee</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {swapRequests.map((request: any) => (
                                                <TableRow key={request.id}>
                                                    <TableCell className="font-medium">{request.requester_name}</TableCell>
                                                    <TableCell>
                                                        {format(parseISO(request.original_shift_date), 'MMM d')}
                                                        <div className="text-xs text-muted-foreground">
                                                            {request.original_start_time} - {request.original_end_time}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {format(parseISO(request.target_shift_date), 'MMM d')}
                                                        <div className="text-xs text-muted-foreground">
                                                            {request.target_start_time} - {request.target_end_time}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{request.target_user_name}</TableCell>
                                                    <TableCell>
                                                        <Badge className={statusColors[request.status]}>{request.status}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {request.status === 'pending' && (
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => respondToSwapMutation.mutate({ id: request.id, action: 'approve' })}
                                                                >
                                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const reason = prompt('Reason for rejection:');
                                                                        if (reason) {
                                                                            respondToSwapMutation.mutate({ id: request.id, action: 'reject', reason });
                                                                        }
                                                                    }}
                                                                >
                                                                    <XCircle className="h-4 w-4 text-red-600" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Availability Tab */}
                    <TabsContent value="availability" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Employee Availability</CardTitle>
                                        <CardDescription>Set weekly availability patterns</CardDescription>
                                    </div>
                                    <Dialog open={isAvailabilityDialogOpen} onOpenChange={setIsAvailabilityDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Set Availability
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Set Availability</DialogTitle>
                                                <DialogDescription>Define when an employee is available to work</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label>Employee</Label>
                                                    <Select value={newAvailability.user_id} onValueChange={(v) => setNewAvailability({ ...newAvailability, user_id: v })}>
                                                        <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                                                        <SelectContent>
                                                            {staff.map((member: any) => (
                                                                <SelectItem key={member.id} value={member.user_id?.toString() || ''}>
                                                                    {member.first_name} {member.last_name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label>Day of Week</Label>
                                                    <Select value={newAvailability.day_of_week} onValueChange={(v) => setNewAvailability({ ...newAvailability, day_of_week: v })}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {dayNames.map((day, index) => (
                                                                <SelectItem key={index} value={index.toString()}>{day}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label>Start Time</Label>
                                                        <Input
                                                            type="time"
                                                            value={newAvailability.start_time}
                                                            onChange={(e) => setNewAvailability({ ...newAvailability, start_time: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>End Time</Label>
                                                        <Input
                                                            type="time"
                                                            value={newAvailability.end_time}
                                                            onChange={(e) => setNewAvailability({ ...newAvailability, end_time: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsAvailabilityDialogOpen(false)}>Cancel</Button>
                                                <Button onClick={() => setAvailabilityMutation.mutate(newAvailability)}>
                                                    {setAvailabilityMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Save Availability
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {availabilityLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : availability.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Clock className="mx-auto h-12 w-12 mb-2 opacity-50" />
                                        <p>No availability set</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Employee</TableHead>
                                                <TableHead>Day</TableHead>
                                                <TableHead>Time</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {availability.map((avail: any) => (
                                                <TableRow key={avail.id}>
                                                    <TableCell className="font-medium">{avail.user_name}</TableCell>
                                                    <TableCell>{dayNames[avail.day_of_week]}</TableCell>
                                                    <TableCell>
                                                        {avail.start_time.substring(0, 5)} - {avail.end_time.substring(0, 5)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={avail.is_available ? 'default' : 'secondary'}>
                                                            {avail.is_available ? 'Available' : 'Unavailable'}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Conflicts Tab */}
                    <TabsContent value="conflicts" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Schedule Conflicts</CardTitle>
                                <CardDescription>Detected conflicts between shifts and leave requests</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {allConflicts.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <CheckCircle className="mx-auto h-12 w-12 mb-2 opacity-50 text-green-500" />
                                        <p>No conflicts detected</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Employee</TableHead>
                                                <TableHead>Details</TableHead>
                                                <TableHead>Date</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {allConflicts.map((c: any, i: number) => (
                                                <TableRow key={i}>
                                                    <TableCell><Badge variant="outline" className="text-destructive border-destructive">{c.type}</Badge></TableCell>
                                                    <TableCell>{c.user_name}</TableCell>
                                                    <TableCell>{c.message}</TableCell>
                                                    <TableCell>{c.date}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
