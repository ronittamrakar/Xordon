import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Users, Video, Plus, Clock, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cultureApi, CultureEvent } from '@/services';


export default function CultureEventsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [createOpen, setCreateOpen] = useState(false);
    const [eventTitle, setEventTitle] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventType, setEventType] = useState('in_person');

    const { data: events = [] } = useQuery({
        queryKey: ['cultureEvents'],
        queryFn: () => cultureApi.getEvents()
    });

    const upcomingEvents = events.filter((e: CultureEvent) => new Date(e.start_time) > new Date());
    const pastEvents = events.filter((e: CultureEvent) => new Date(e.start_time) <= new Date());

    const createEventMutation = useMutation({
        mutationFn: (data: any) => cultureApi.createEvent(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cultureEvents'] });
            setCreateOpen(false);
            toast({
                title: "Event Created!",
                description: "Your team building event has been created and invitations sent.",
            });
            setEventTitle('');
            setEventDescription('');
            setEventType('in_person');
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to create event.",
                variant: 'destructive'
            });
        }
    });

    const rsvpMutation = useMutation({
        mutationFn: ({ id, status }: { id: number, status: 'attending' | 'not_attending' }) => cultureApi.rsvpEvent(id, status),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['cultureEvents'] });
            toast({
                title: "RSVP Confirmed!",
                description: `You are ${variables.status === 'attending' ? 'attending' : 'not attending'} the event.`,
            });
        }
    });

    const handleCreateEvent = () => {
        createEventMutation.mutate({
            title: eventTitle,
            description: eventDescription,
            type: eventType,
            start_time: new Date().toISOString(), // Simplified for example, normally collect date/time inputs
            status: 'upcoming'
        });
    };

    const handleRSVP = (eventId: number, eventTitle: string) => {
        rsvpMutation.mutate({ id: eventId, status: 'attending' });
    };

    const EventCard = ({ event, isPast = false }: { event: CultureEvent, isPast?: boolean }) => (
        <Card className="hover:shadow-lg transition-all">
            <CardHeader>
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-xl">{event.title}</CardTitle>
                            <Badge variant="secondary" className="flex items-center">
                                {event.event_type === 'in_person' ? <MapPin className="h-3 w-3 mr-1" /> : <Video className="h-3 w-3 mr-1" />}
                                {event.event_type === 'in_person' ? 'In-Person' : 'Virtual'}
                            </Badge>
                        </div>
                        <CardDescription>{event.description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                    <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                        {new Date(event.start_time).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2 text-primary" />
                        {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center text-muted-foreground col-span-2">
                        <MapPin className="h-4 w-4 mr-2 text-primary" />
                        {event.location}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                        <Users className="h-4 w-4 mr-2 text-primary" />
                        {event.attendee_count} / {event.capacity || 'Unlimited'} attending
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarFallback>{event.organizer_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">Organized by <span className="font-medium text-foreground">{event.organizer_name}</span></span>
                </div>

                {!isPast && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Capacity</span>
                            <span className="font-medium">{Math.round((event.attendee_count / event.capacity) * 100)}% full</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${(event.attendee_count / event.capacity) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="gap-2">
                {isPast ? (
                    <>
                        <Button variant="outline" size="sm">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            View Recap
                        </Button>
                        <Button variant="outline" size="sm">
                            <Users className="h-4 w-4 mr-2" />
                            Attendees ({event.attendee_count})
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            className="w-full"
                            onClick={() => handleRSVP(event.id, event.title)}
                            disabled={rsvpMutation.isPending || event.is_attending}
                        >
                            {rsvpMutation.isPending ? 'Confirming...' : (event.is_attending ? 'Attending' : 'RSVP Now')}
                        </Button>
                        <Button variant="outline" size="sm">
                            <Calendar className="h-4 w-4 mr-2" />
                            Add to Calendar
                        </Button>
                    </>
                )}
            </CardFooter>
        </Card>
    );

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">Team Building Events</h1>
                    <p className="text-muted-foreground mt-1">Connect with colleagues and strengthen team bonds.</p>
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="font-bold shadow-lg shadow-primary/20">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Event
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Create Team Event</DialogTitle>
                            <DialogDescription>
                                Plan a team building activity or company event.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Event Title</Label>
                                <Input
                                    placeholder="e.g., Team Lunch & Learn"
                                    value={eventTitle}
                                    onChange={(e) => setEventTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    placeholder="What's this event about?"
                                    value={eventDescription}
                                    onChange={(e) => setEventDescription(e.target.value)}
                                    className="resize-none h-24"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Input type="date" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Time</Label>
                                    <Input type="time" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Event Type</Label>
                                <Select value={eventType} onValueChange={setEventType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="in_person">In Person</SelectItem>
                                        <SelectItem value="virtual">Virtual</SelectItem>
                                        <SelectItem value="hybrid">Hybrid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Location / Meeting Link</Label>
                                <Input placeholder="Conference Room A or Zoom link" />
                            </div>
                            <div className="space-y-2">
                                <Label>Capacity</Label>
                                <Input type="number" placeholder="Maximum attendees" />
                            </div>
                        </div>
                        <Button onClick={handleCreateEvent} className="w-full font-bold" disabled={!eventTitle}>
                            Create Event & Send Invites
                        </Button>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardDescription>Upcoming Events</CardDescription>
                        <CardTitle className="text-2xl font-bold text-blue-600">{upcomingEvents.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Next: Oct 24</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                        <CardDescription>Total RSVPs</CardDescription>
                        <CardTitle className="text-2xl font-bold text-green-600">274</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Across all events</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                        <CardDescription>Avg. Attendance</CardDescription>
                        <CardTitle className="text-2xl font-bold text-purple-600">82%</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Of RSVPs show up</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-2">
                        <CardDescription>Participation Rate</CardDescription>
                        <CardTitle className="text-2xl font-bold text-orange-600">68%</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Of employees</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="upcoming" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
                    <TabsTrigger value="past">Past Events</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="space-y-4">
                    {upcomingEvents.map((event: CultureEvent) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </TabsContent>

                <TabsContent value="past" className="space-y-4">
                    {pastEvents.map((event: CultureEvent) => (
                        <EventCard key={event.id} event={event} isPast />
                    ))}
                </TabsContent>
            </Tabs>
        </div>
    );
}
