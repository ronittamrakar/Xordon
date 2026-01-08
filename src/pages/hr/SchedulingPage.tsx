import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Calendar as CalendarIcon, Clock, Users, Plus,
    Filter, ChevronLeft, ChevronRight, Settings,
    CheckCircle2, AlertCircle, AlertTriangle,
    RefreshCw, MapPin, Zap, Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { hrGapApi, Shift } from '@/services/hrGapApi';
import { staffApi } from '@/services';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

const SchedulingPage = () => {
    const queryClient = useQueryClient();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // View state
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const { data: shifts, isLoading } = useQuery({
        queryKey: ['shifts', format(weekStart, 'yyyy-MM-dd')],
        queryFn: () => hrGapApi.getShifts({
            start_date: format(weekStart, 'yyyy-MM-dd'),
            end_date: format(weekEnd, 'yyyy-MM-dd')
        })
    });

    const { data: conflicts } = useQuery({
        queryKey: ['schedulingConflicts'],
        queryFn: hrGapApi.getConflicts
    });

    // Fetch staff for dropdown
    const { data: staff } = useQuery({
        queryKey: ['staffList'],
        queryFn: () => staffApi.list()
    });

    const createShiftMutation = useMutation({
        mutationFn: (data: any) => hrGapApi.createShift(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            setIsCreateOpen(false);
            toast.success('Shift created');
        }
    });

    const [newShift, setNewShift] = useState({
        user_id: '',
        shift_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_time: '17:00'
    });

    const handleCreateShift = () => {
        createShiftMutation.mutate(newShift);
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Smart Scheduling</h1>
                    <p className="text-muted-foreground">AI-powered shift optimization and roster management</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
                        <Zap className="h-4 w-4 mr-2" /> Auto-Optimize
                    </Button>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" /> New Shift
                    </Button>
                </div>
            </div>

            {/* Quick Stats & Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm opacity-90">Total Shifts (Week)</p>
                                <p className="text-2xl font-bold">{shifts?.length || 0}</p>
                            </div>
                            <CalendarIcon className="h-5 w-5 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className={conflicts?.length > 0 ? "border-red-200 bg-red-50" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-muted-foreground">Conflicts Detected</p>
                                <p className={`text-2xl font-bold ${conflicts?.length > 0 ? "text-red-600" : ""}`}>
                                    {conflicts?.length || 0}
                                </p>
                            </div>
                            <AlertCircle className={`h-5 w-5 ${conflicts?.length > 0 ? "text-red-500" : "text-muted-foreground"}`} />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-muted-foreground">Unassigned Slots</p>
                                <p className="text-2xl font-bold text-orange-600">4</p>
                            </div>
                            <Users className="h-5 w-5 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-muted-foreground">Pending Swaps</p>
                                <p className="text-2xl font-bold text-blue-600">2</p>
                            </div>
                            <RefreshCw className="h-5 w-5 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Calendar Header */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h2 className="text-xl font-bold">
                            {format(weekStart, 'MMMM d')} - {format(weekEnd, 'MMMM d, yyyy')}
                        </h2>
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" className="text-sm font-normal" onClick={() => setCurrentDate(new Date())}>
                            Today
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
                        <Button variant="outline" size="sm"><Settings className="h-4 w-4 mr-2" /> Settings</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Weekly Grid */}
                    <div className="grid grid-cols-7 border rounded-xl overflow-hidden shadow-sm bg-white">
                        {days.map((day) => (
                            <div key={day.toString()} className="border-r last:border-r-0 min-h-[500px] flex flex-col">
                                <div className={`p-4 text-center border-b ${isSameDay(day, new Date()) ? "bg-blue-50" : "bg-slate-50/50"}`}>
                                    <p className="text-xs font-bold text-muted-foreground uppercase">{format(day, 'EEE')}</p>
                                    <p className={`text-xl font-black ${isSameDay(day, new Date()) ? "text-blue-600" : ""}`}>{format(day, 'd')}</p>
                                </div>
                                <div className="p-2 space-y-2 flex-grow overflow-y-auto">
                                    {shifts?.filter(s => isSameDay(new Date(s.shift_date), day)).map((shift: Shift) => (
                                        <div
                                            key={shift.id}
                                            className="p-3 rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden"
                                            style={{ borderLeftWidth: '4px', borderLeftColor: shift.shift_type_color || '#3b82f6' }}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-xs font-bold truncate">{shift.user_name}</p>
                                                <Badge variant="outline" className="text-[12px] scale-90 px-1 h-4">{shift.status}</Badge>
                                            </div>
                                            <p className="text-[12px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}
                                            </p>
                                            {shift.shift_type_name && (
                                                <p className="text-[12px] font-semibold mt-1 opacity-70 italic">{shift.shift_type_name}</p>
                                            )}

                                            <div className="absolute right-1 bottom-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-6 w-6"><Copy className="h-3 w-3" /></Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6"><Settings className="h-3 w-3" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button
                                        variant="ghost"
                                        className="w-full text-xs py-1 h-8 opacity-0 hover:opacity-100 text-muted-foreground border-dashed border bg-slate-50/30"
                                        onClick={() => {
                                            setNewShift({ ...newShift, shift_date: format(day, 'yyyy-MM-dd') });
                                            setIsCreateOpen(true);
                                        }}
                                    >
                                        <Plus className="h-3 w-3 mr-1" /> Add
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Create Shift Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign New Shift</DialogTitle>
                        <DialogDescription>Create a work schedule for an employee</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Employee</Label>
                            <Select value={newShift.user_id} onValueChange={v => setNewShift({ ...newShift, user_id: v })}>
                                <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                                <SelectContent>
                                    {staff?.map((emp: any) => (
                                        <SelectItem key={emp.user_id || emp.id} value={String(emp.user_id || emp.id)}>
                                            {emp.first_name} {emp.last_name}
                                        </SelectItem>
                                    ))}
                                    {(!staff || staff.length === 0) && (
                                        <SelectItem value="none" disabled>No staff available</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Time</Label>
                                <Input type="time" value={newShift.start_time} onChange={e => setNewShift({ ...newShift, start_time: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>End Time</Label>
                                <Input type="time" value={newShift.end_time} onChange={e => setNewShift({ ...newShift, end_time: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateShift}>Create Shift</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SchedulingPage;
