import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Video,
    Calendar,
    Clock,
    Users,
    Settings,
    ArrowLeft,
    Save,
    Image as ImageIcon,
    Layout,
    Globe,
    Lock,
    Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { webinarApi, Webinar } from '@/services/webinarApi';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const WebinarForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEditing = !!id;

    const [formData, setFormData] = useState<Partial<Webinar>>({
        title: '',
        description: '',
        scheduled_at: '',
        duration_minutes: 60,
        status: 'scheduled',
        max_registrants: 500,
        is_evergreen: false,
    });

    const { data: webinar, isLoading: isFetching } = useQuery({
        queryKey: ['webinar', id],
        queryFn: () => webinarApi.get(id!),
        enabled: isEditing
    });

    useEffect(() => {
        if (webinar) {
            setFormData({
                ...webinar,
                scheduled_at: webinar.scheduled_at ? format(new Date(webinar.scheduled_at), "yyyy-MM-dd'T'HH:mm") : ''
            });
        }
    }, [webinar]);

    const mutation = useMutation<any, Error, Partial<Webinar>>({
        mutationFn: (data: Partial<Webinar>) =>
            isEditing ? webinarApi.update(id!, data) : webinarApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webinars'] });
            toast.success(isEditing ? 'Webinar updated' : 'Webinar scheduled');
            navigate('/marketing/webinars');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to save webinar');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    if (isEditing && isFetching) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/marketing/webinars')} className="rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black">{isEditing ? 'Edit Webinar' : 'Schedule New Webinar'}</h1>
                    <p className="text-muted-foreground font-medium">Configure your live stream and registration settings</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-xl rounded-[32px]">
                        <CardHeader className="p-8 pb-0">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Layout className="h-5 w-5 text-primary" /> General Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-4">
                            <div className="space-y-2">
                                <Label className="font-bold">Webinar Title</Label>
                                <Input
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Enter a catchy title..."
                                    className="h-12 text-lg font-bold"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What is this webinar about?"
                                    className="min-h-[150px]"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl rounded-[32px]">
                        <CardHeader className="p-8 pb-0">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" /> Scheduling
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="font-bold">Start Time</Label>
                                    <Input
                                        type="datetime-local"
                                        value={formData.scheduled_at}
                                        onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })}
                                        className="h-11"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold">Duration (Minutes)</Label>
                                    <Input
                                        type="number"
                                        value={formData.duration_minutes}
                                        onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                                        className="h-11"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                <div className="space-y-0.5">
                                    <Label className="font-bold flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-primary" /> Evergreen Webinar
                                    </Label>
                                    <p className="text-[12px] uppercase font-black text-primary/60">Automate replays to run on a schedule</p>
                                </div>
                                <Switch
                                    checked={formData.is_evergreen}
                                    onCheckedChange={val => setFormData({ ...formData, is_evergreen: val })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-none shadow-xl rounded-[32px] bg-slate-900 text-white">
                        <CardHeader className="p-8 pb-0">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Lock className="h-4 w-4 text-primary" /> Access Controls
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-slate-300 font-bold">Max Registrants</Label>
                                <Input
                                    type="number"
                                    value={formData.max_registrants}
                                    onChange={e => setFormData({ ...formData, max_registrants: parseInt(e.target.value) })}
                                    className="bg-white/5 border-white/10 text-white font-bold h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300 font-bold">Webinar Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val) => setFormData({ ...formData, status: val as any })}
                                >
                                    <SelectTrigger className="w-full h-11 bg-white/5 border-white/10 text-white rounded-xl font-bold">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl">
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="live">Live</SelectItem>
                                        <SelectItem value="ended">Ended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
                        <div className="aspect-video bg-slate-100 flex flex-col items-center justify-center text-slate-400 border-b relative">
                            {formData.thumbnail ? (
                                <img src={formData.thumbnail} className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Thumbnail Preview</p>
                                </>
                            )}
                        </div>
                        <CardContent className="p-6">
                            <Input
                                placeholder="Thumbnail URL"
                                value={formData.thumbnail}
                                onChange={e => setFormData({ ...formData, thumbnail: e.target.value })}
                                className="h-10 text-xs"
                            />
                        </CardContent>
                    </Card>

                    <Button
                        type="submit"
                        className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 text-lg font-black"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <><Save className="h-5 w-5 mr-2" /> {isEditing ? 'Update Event' : 'Schedule Event'}</>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default WebinarForm;
