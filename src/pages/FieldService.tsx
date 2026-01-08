import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
    MapPin, Users, Truck, Calendar, Clock, Phone,
    Navigation, AlertTriangle, CheckCircle2, Circle,
    Plus, RefreshCw, Filter, Search, MoreVertical, FileText, CalendarPlus
} from 'lucide-react';
import { fieldServiceApi, DispatchJob, TechnicianStatus, gpsTracking } from '@/services/fieldServiceApi';
import { format } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const statusColors: Record<string, string> = {
    pending: 'bg-gray-500',
    dispatched: 'bg-blue-500',
    en_route: 'bg-yellow-500',
    on_site: 'bg-purple-500',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500',
};

const priorityColors: Record<string, string> = {
    low: 'bg-gray-400',
    normal: 'bg-blue-400',
    high: 'bg-orange-500',
    emergency: 'bg-red-600',
};

const techStatusColors: Record<string, string> = {
    available: 'text-green-500',
    busy: 'text-red-500',
    on_break: 'text-yellow-500',
    offline: 'text-gray-400',
    en_route: 'text-blue-500',
};

// Leaflet Icons
const TechIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const JobIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export default function FieldServicePage() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const [isTracking, setIsTracking] = useState(gpsTracking.isTracking());
    const [showNewJobDialog, setShowNewJobDialog] = useState(false);

    // State for initial job data from navigation
    const [initialJobData, setInitialJobData] = useState<{
        customer_name?: string;
        customer_phone?: string;
        notes?: string;
        service_address?: string;
    } | null>(null);

    // Journey State Pre-fill
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const contactName = params.get('contactName');
        const contactPhone = params.get('contactPhone');
        const address = params.get('address');

        const state = location.state as { createJob?: boolean; customerName?: string; customerPhone?: string; ticketTitle?: string; ticketNumber?: string; address?: string } | null;

        if (state?.createJob) {
            setInitialJobData({
                customer_name: state.customerName || '',
                customer_phone: state.customerPhone || '',
                service_address: state.address || '',
                notes: state.ticketTitle ? `Job created from Ticket #${state.ticketNumber}: ${state.ticketTitle}` : ''
            });
            setShowNewJobDialog(true);
            // Clear state
            navigate(location.pathname, { replace: true, state: null });
        } else if (contactName || address) {
            // Handle URL params fallback (legacy)
            setInitialJobData({
                customer_name: contactName || '',
                customer_phone: contactPhone || '',
                service_address: address || ''
            });
            setShowNewJobDialog(true);
        }
    }, [location.search, location.state]);

    // Queries
    const { data: jobs = [], isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
        queryKey: ['field-service-jobs', statusFilter],
        queryFn: () => fieldServiceApi.getJobs(statusFilter !== 'all' ? { status: statusFilter as DispatchJob['status'] } : {}),
    });

    const { data: technicians = [], isLoading: techsLoading } = useQuery({
        queryKey: ['field-service-technicians'],
        queryFn: fieldServiceApi.getTechnicians,
    });

    const { data: analytics } = useQuery({
        queryKey: ['field-service-analytics'],
        queryFn: fieldServiceApi.getAnalytics,
    });

    const { data: zones = [] } = useQuery({
        queryKey: ['field-service-zones'],
        queryFn: fieldServiceApi.getZones,
    });

    // Mutations
    const createJobMutation = useMutation({
        mutationFn: fieldServiceApi.createJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['field-service-jobs'] });
            setShowNewJobDialog(false);
            toast({ title: 'Success', description: 'Job created successfully' });
        },
        onError: () => {
            toast({ title: 'Error', description: 'Failed to create job', variant: 'destructive' });
        },
    });

    const dispatchJobMutation = useMutation({
        mutationFn: ({ jobId, technicianId }: { jobId: number; technicianId: number }) =>
            fieldServiceApi.dispatchJob(jobId, technicianId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['field-service-jobs'] });
            queryClient.invalidateQueries({ queryKey: ['field-service-technicians'] });
            toast({ title: 'Success', description: 'Job dispatched successfully' });
        },
    });

    const updateJobMutation = useMutation({
        mutationFn: ({ jobId, data }: { jobId: number; data: Partial<DispatchJob> }) =>
            fieldServiceApi.updateJob(jobId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['field-service-jobs'] });
            toast({ title: 'Success', description: 'Job updated successfully' });
        },
    });

    const toggleTracking = () => {
        if (isTracking) {
            gpsTracking.stop();
            setIsTracking(false);
            toast({ title: 'GPS Tracking', description: 'Location tracking stopped' });
        } else {
            gpsTracking.start((error) => {
                toast({
                    title: 'GPS Error',
                    description: error.message,
                    variant: 'destructive'
                });
            });
            setIsTracking(true);
            toast({ title: 'GPS Tracking', description: 'Location tracking started' });
        }
    };

    const handleCreateJob = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        createJobMutation.mutate({
            customer_name: formData.get('customer_name') as string,
            customer_phone: formData.get('customer_phone') as string,
            service_address: formData.get('service_address') as string,
            scheduled_start: formData.get('scheduled_start') as string,
            priority: formData.get('priority') as DispatchJob['priority'],
            notes: formData.get('notes') as string,
        });
    };

    const availableTechnicians = technicians.filter(t => t.current_status === 'available');

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Field Service</h1>
                    <p className="text-muted-foreground mt-1">
                        GPS tracking, dispatch management, and technician coordination
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={isTracking ? 'destructive' : 'outline'}
                        onClick={toggleTracking}
                    >
                        <Navigation className={`h-4 w-4 mr-2 ${isTracking ? 'animate-pulse' : ''}`} />
                        {isTracking ? 'Stop Tracking' : 'Start GPS'}
                    </Button>
                    <Dialog open={showNewJobDialog} onOpenChange={setShowNewJobDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                New Job
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <form onSubmit={handleCreateJob}>
                                <DialogHeader>
                                    <DialogTitle>Create Dispatch Job</DialogTitle>
                                    <DialogDescription>
                                        Schedule a new field service job
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="customer_name">Customer Name</Label>
                                        <Input
                                            id="customer_name"
                                            name="customer_name"
                                            defaultValue={initialJobData?.customer_name || new URLSearchParams(location.search).get('contactName') || ''}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="customer_phone">Phone</Label>
                                        <Input
                                            id="customer_phone"
                                            name="customer_phone"
                                            type="tel"
                                            defaultValue={initialJobData?.customer_phone || new URLSearchParams(location.search).get('contactPhone') || ''}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="service_address">Service Address</Label>
                                        <Textarea
                                            id="service_address"
                                            name="service_address"
                                            defaultValue={initialJobData?.service_address || new URLSearchParams(location.search).get('address') || ''}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="scheduled_start">Scheduled Time</Label>
                                        <Input id="scheduled_start" name="scheduled_start" type="datetime-local" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="priority">Priority</Label>
                                        <Select name="priority" defaultValue="normal">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="normal">Normal</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="emergency">Emergency</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="notes">Notes</Label>
                                        <Textarea id="notes" name="notes" defaultValue={initialJobData?.notes} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setShowNewJobDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={createJobMutation.isPending}>
                                        Create Job
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            {analytics && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Today's Jobs</CardTitle>
                            <Truck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.jobs.total_jobs}</div>
                            <p className="text-xs text-muted-foreground">
                                {analytics.jobs.completed_jobs} completed
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Available Techs</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{analytics.technicians.available}</div>
                            <p className="text-xs text-muted-foreground">
                                of {analytics.technicians.total_technicians} total
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">En Route</CardTitle>
                            <Navigation className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{analytics.jobs.en_route_jobs}</div>
                            <p className="text-xs text-muted-foreground">
                                {analytics.technicians.en_route} technicians
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {analytics.jobs.avg_duration_minutes
                                    ? `${Math.round(analytics.jobs.avg_duration_minutes)}m`
                                    : '-'}
                            </div>
                            <p className="text-xs text-muted-foreground">per job</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="dispatch">Dispatch Board</TabsTrigger>
                    <TabsTrigger value="technicians">Technicians</TabsTrigger>
                    <TabsTrigger value="map">Live Map</TabsTrigger>
                    <TabsTrigger value="zones">Service Zones</TabsTrigger>
                </TabsList>

                <TabsContent value="dispatch" className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search jobs..." className="pl-9" />
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="dispatched">Dispatched</SelectItem>
                                <SelectItem value="en_route">En Route</SelectItem>
                                <SelectItem value="on_site">On Site</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={() => refetchJobs()}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {jobsLoading ? (
                            <Card className="p-8 text-center text-muted-foreground">
                                Loading jobs...
                            </Card>
                        ) : jobs.length === 0 ? (
                            <Card className="p-8 text-center text-muted-foreground">
                                No dispatch jobs found
                            </Card>
                        ) : (
                            jobs.map((job) => (
                                <Card key={job.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge className={priorityColors[job.priority]}>
                                                        {job.priority}
                                                    </Badge>
                                                    <Badge className={statusColors[job.status]}>
                                                        {job.status.replace('_', ' ')}
                                                    </Badge>
                                                    {job.technician_name && (
                                                        <span className="text-sm text-muted-foreground">
                                                            → {job.technician_name}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-semibold">{job.customer_name || 'Unknown Customer'}</h3>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {job.service_address || 'No address'}
                                                    </span>
                                                    {job.customer_phone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {job.customer_phone}
                                                        </span>
                                                    )}
                                                </div>
                                                {job.scheduled_start && (
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(new Date(job.scheduled_start), 'MMM d, h:mm a')}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {job.status === 'completed' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => navigate('/finance/invoices', {
                                                            state: {
                                                                create: true,
                                                                invoiceData: {
                                                                    client_name: job.customer_name,
                                                                    client_address: job.service_address,
                                                                    items: [
                                                                        {
                                                                            description: `Field Service Job #${job.id} at ${job.service_address}`,
                                                                            quantity: 1,
                                                                            unit_price: 0
                                                                        }
                                                                    ]
                                                                }
                                                            }
                                                        })}
                                                    >
                                                        <FileText className="h-4 w-4 mr-1 text-green-600" />
                                                        Invoice
                                                    </Button>
                                                )}
                                                {job.status === 'pending' && !job.scheduled_start && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => navigate(`/scheduling/appointments/new?title=Service Job: ${job.customer_name}&description=Field Service Job ID: ${job.id}`)}
                                                        >
                                                            <CalendarPlus className="h-4 w-4 mr-1 text-blue-600" />
                                                            Schedule
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => navigate('/proposals/new', {
                                                                state: {
                                                                    client_name: job.customer_name,
                                                                    client_phone: job.customer_phone,
                                                                    client_address: job.service_address,
                                                                    items: [
                                                                        {
                                                                            name: 'Field Service Estimate',
                                                                            description: `Estimate for job #${job.id} at ${job.service_address}`,
                                                                            quantity: 1,
                                                                            unit_price: 0
                                                                        }
                                                                    ]
                                                                }
                                                            })}
                                                        >
                                                            <FileText className="h-4 w-4 mr-1 text-orange-600" />
                                                            Estimate
                                                        </Button>
                                                    </div>
                                                )}
                                                {job.status === 'pending' && availableTechnicians.length > 0 && (
                                                    <Select
                                                        onValueChange={(techId) =>
                                                            dispatchJobMutation.mutate({ jobId: job.id, technicianId: parseInt(techId) })
                                                        }
                                                    >
                                                        <SelectTrigger className="w-[180px]">
                                                            <SelectValue placeholder="Dispatch to..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availableTechnicians.map((tech) => (
                                                                <SelectItem key={tech.user_id} value={tech.user_id.toString()}>
                                                                    {tech.user_name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                                {job.status === 'dispatched' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => updateJobMutation.mutate({ jobId: job.id, data: { status: 'en_route' } })}
                                                    >
                                                        Start Route
                                                    </Button>
                                                )}
                                                {job.status === 'en_route' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => updateJobMutation.mutate({ jobId: job.id, data: { status: 'on_site' } })}
                                                    >
                                                        Arrived
                                                    </Button>
                                                )}
                                                {job.status === 'on_site' && (
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        onClick={() => updateJobMutation.mutate({ jobId: job.id, data: { status: 'completed' } })}
                                                    >
                                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                                        Complete
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="technicians" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {techsLoading ? (
                            <Card className="p-8 text-center text-muted-foreground col-span-full">
                                Loading technicians...
                            </Card>
                        ) : technicians.length === 0 ? (
                            <Card className="p-8 text-center text-muted-foreground col-span-full">
                                No technicians found
                            </Card>
                        ) : (
                            technicians.map((tech) => (
                                <Card key={tech.user_id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-3 w-3 rounded-full ${tech.current_status === 'available' ? 'bg-green-500' :
                                                tech.current_status === 'busy' ? 'bg-red-500' :
                                                    tech.current_status === 'en_route' ? 'bg-blue-500' :
                                                        'bg-gray-400'
                                                }`} />
                                            <div className="flex-1">
                                                <h3 className="font-semibold">{tech.user_name}</h3>
                                                <p className="text-sm text-muted-foreground capitalize">
                                                    {tech.current_status.replace('_', ' ')}
                                                </p>
                                            </div>
                                            {tech.current_job_customer && (
                                                <Badge variant="outline">
                                                    {tech.current_job_customer}
                                                </Badge>
                                            )}
                                        </div>
                                        {tech.last_location_update && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Last seen: {format(new Date(tech.last_location_update), 'h:mm a')}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="map" className="space-y-4">
                    <Card className="h-[600px] overflow-hidden relative border shadow-lg rounded-xl">
                        <MapContainer
                            center={[40.7128, -74.0060]}
                            zoom={13}
                            className="h-full w-full z-0"
                            scrollWheelZoom={true}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {/* Technician Markers */}
                            {technicians.filter(t => t.current_lat && t.current_lng).map(tech => (
                                <Marker
                                    key={`tech-${tech.user_id}`}
                                    position={[tech.current_lat!, tech.current_lng!]}
                                    icon={TechIcon}
                                >
                                    <Popup>
                                        <div className="p-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`h-2 w-2 rounded-full ${tech.current_status === 'available' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                                <h3 className="font-bold text-sm m-0">{tech.user_name}</h3>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-1 capitalize">{tech.current_status.replace('_', ' ')}</p>
                                            {tech.current_job_customer && (
                                                <p className="text-xs font-medium">Job: {tech.current_job_customer}</p>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}

                            {/* Job Markers */}
                            {jobs.filter(j => j.service_lat && j.service_lng).map(job => (
                                <Marker
                                    key={`job-${job.id}`}
                                    position={[job.service_lat!, job.service_lng!]}
                                    icon={JobIcon}
                                >
                                    <Popup>
                                        <div className="p-1">
                                            <h3 className="font-bold text-sm m-0 mb-1">{job.customer_name || 'Service Job'}</h3>
                                            <p className="text-xs text-muted-foreground mb-2">{job.service_address}</p>
                                            <div className="flex justify-between items-center gap-4">
                                                <Badge className={statusColors[job.status]}>{job.status}</Badge>
                                                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => {
                                                    setSelectedJob(job);
                                                    // Add any view detail logic here
                                                }}>Details</Button>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>

                        {/* Map Legend */}
                        <div className="absolute bottom-6 right-6 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border shadow-2xl space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-xs font-medium">Technicians</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="text-xs font-medium">Service Jobs</span>
                            </div>
                            <Button variant="outline" size="sm" className="w-full text-[12px] h-7 mt-2" onClick={() => refetchJobs()}>
                                <RefreshCw className="w-3 h-3 mr-1" /> Refresh Map
                            </Button>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="zones" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Service Zones</h3>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Zone
                        </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {zones.length === 0 ? (
                            <Card className="p-8 text-center text-muted-foreground col-span-full">
                                No service zones defined
                            </Card>
                        ) : (
                            zones.map((zone) => (
                                <Card key={zone.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="h-4 w-4 rounded"
                                                style={{ backgroundColor: zone.color }}
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-semibold">{zone.name}</h3>
                                                <p className="text-sm text-muted-foreground capitalize">
                                                    {zone.zone_type.replace('_', ' ')}
                                                </p>
                                            </div>
                                            <Badge variant={zone.is_active ? 'default' : 'secondary'}>
                                                {zone.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        {zone.description && (
                                            <p className="text-sm text-muted-foreground mt-2">
                                                {zone.description}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
