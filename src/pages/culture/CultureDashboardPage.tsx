import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Trophy, Users, Target, Rocket, MessageSquare, Plus, Star, Medal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cultureApi } from '@/services/cultureApi';
import { staffApi } from '@/services';

export default function CultureDashboardPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [kudosOpen, setKudosOpen] = useState(false);
    const [kudosMessage, setKudosMessage] = useState('');
    const [selectedPeer, setSelectedPeer] = useState('');
    const [selectedValue, setSelectedValue] = useState('');

    const { data: values = [] } = useQuery({
        queryKey: ['cultureValues'],
        queryFn: () => cultureApi.getCoreValues(),
    });

    const { data: kudos = [] } = useQuery({
        queryKey: ['recentKudos'],
        queryFn: () => cultureApi.getRecentKudos(),
    });

    const { data: champions = [] } = useQuery({
        queryKey: ['cultureChampions'],
        queryFn: () => cultureApi.getChampions(),
    });

    const { data: stats } = useQuery({
        queryKey: ['cultureStats'],
        queryFn: () => cultureApi.getStats()
    });

    const { data: staff } = useQuery({
        queryKey: ['staffList'],
        queryFn: () => staffApi.list()
    });

    const giveKudosMutation = useMutation({
        mutationFn: (data: any) => cultureApi.giveKudos(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recentKudos'] });
            setKudosOpen(false);
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            toast({
                title: "Kudos Sent!",
                description: `You sent some appreciation to your colleague.`,
            });
            setKudosMessage('');
            setSelectedPeer('');
            setSelectedValue('');
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to send kudos. Please try again.",
                variant: "destructive"
            });
        }
    });

    const handleGiveKudos = () => {
        if (!selectedPeer || !selectedValue || !kudosMessage) return;

        giveKudosMutation.mutate({
            to_user_id: parseInt(selectedPeer),
            core_value_id: parseInt(selectedValue),
            message: kudosMessage
        });
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-[18px] font-bold tracking-tight">Company Culture</h1>
                    <p className="text-muted-foreground mt-1">Foster connections, celebrate wins, and align on our mission.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Dialog open={kudosOpen} onOpenChange={setKudosOpen}>
                        <DialogTrigger asChild>
                            <Button className="font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                                <Trophy className="mr-2 h-4 w-4" />
                                Give Kudos
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Recognize a Teammate</DialogTitle>
                                <DialogDescription>
                                    Share some love and appreciation with your colleagues.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Who are you recognizing?</label>
                                    <Select value={selectedPeer} onValueChange={setSelectedPeer}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a team member..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {staff?.map((s: any) => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    {s.first_name} {s.last_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Which value did they embody?</label>
                                    <Select value={selectedValue} onValueChange={setSelectedValue}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a core value..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {values.map((v: any) => (
                                                <SelectItem key={v.id} value={String(v.id)}>{v.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Your Message</label>
                                    <Textarea
                                        placeholder="Tell everyone what they did..."
                                        value={kudosMessage}
                                        onChange={(e) => setKudosMessage(e.target.value)}
                                        className="resize-none h-32"
                                    />
                                </div>
                            </div>
                            <Button onClick={handleGiveKudos} className="w-full font-bold" disabled={!selectedPeer || !selectedValue || !kudosMessage}>
                                Send Kudos 🎉
                            </Button>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" onClick={() => window.location.href = '/courses'}>Training</Button>
                    <Button variant="outline">Suggest Event</Button>
                    <Button variant="outline">Feedback</Button>
                </div>
            </div>

            {/* Core Values Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {values.map((val: any) => (
                    <Card key={val.id} className="hover:shadow-md transition-all border-l-4 border-l-primary/20">
                        <CardHeader className="pb-2">
                            <div className={`p-2 w-fit rounded-lg mb-2 ${val.color_class || 'bg-blue-50 text-blue-500'}`}>
                                <Heart className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg">{val.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{val.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Kudos Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                Kudos Feed
                            </CardTitle>
                            <CardDescription>See the latest recognition across the company.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {kudos.map((kudo: any) => (
                                <div key={kudo.id} className="flex gap-4 p-4 rounded-xl bg-muted/30">
                                    <Avatar className="h-10 w-10 border-2 border-background">
                                        <AvatarFallback>{kudo.from_user_name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-medium">
                                                <span className="font-bold text-primary">{kudo.from_user_name}</span> recognized <span className="font-bold text-primary">{kudo.to_user_name}</span>
                                            </p>
                                            <span className="text-xs text-muted-foreground">{kudo.created_at}</span>
                                        </div>
                                        <p className="text-sm text-foreground/90">{kudo.message}</p>
                                        <div className="flex items-center gap-2 pt-2">
                                            <Badge variant="secondary" className="text-xs font-normal">
                                                {kudo.core_value_title}
                                            </Badge>
                                            <Button variant="ghost" size="sm" className="h-6 px-2 text-muted-foreground ml-auto hover:text-red-500">
                                                <Heart className="h-3 w-3 mr-1" /> {kudo.likes_count}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter>
                            <Button variant="ghost" className="w-full text-muted-foreground">View All Kudos</Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Sidebar Stats & Leaderboard */}
                <div className="space-y-6">
                    {/* Culture Score */}
                    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Culture Pulse</CardTitle>
                            <CardDescription>Weekly Alignment Score</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between mb-2">
                                <span className="text-2xl font-bold text-primary">{stats?.culture_score || 0}/10</span>
                                <span className="text-sm text-green-600 font-bold flex items-center">
                                    <Trophy className="h-3 w-3 mr-1" /> +{stats?.score_trend || 0} this week
                                </span>
                            </div>
                            <Progress value={(stats?.culture_score || 0) * 10} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-4">
                                Based on surveys, recognition, and event participation.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Culture Champions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Medal className="h-5 w-5 text-yellow-500" />
                                This Month's Champions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {champions.map((champ: any, i: number) => (
                                <div key={champ.user_id} className="flex items-center gap-3">
                                    <div className="flex items-center justify-center font-bold text-muted-foreground w-6">
                                        #{i + 1}
                                    </div>
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{champ.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-bold truncate">{champ.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{champ.role}</p>
                                    </div>
                                    <div className="text-xs font-bold bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded-full">
                                        {champ.kudos_count} pts
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Upcoming Events */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Upcoming Events</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-3 items-start">
                                <div className="bg-muted p-2 rounded text-center min-w-[50px]">
                                    <span className="block text-xs font-bold text-muted-foreground">OCT</span>
                                    <span className="block text-lg font-bold">24</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Q4 Town Hall & Trivia</p>
                                    <p className="text-xs text-muted-foreground mt-1">4:00 PM • Main Stage</p>
                                    <Button variant="link" size="sm" className="h-auto p-0 mt-1">RSVP Now</Button>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="bg-muted p-2 rounded text-center min-w-[50px]">
                                    <span className="block text-xs font-bold text-muted-foreground">OCT</span>
                                    <span className="block text-lg font-bold">30</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Halloween Costume Contest</p>
                                    <p className="text-xs text-muted-foreground mt-1">2:00 PM • Virtual</p>
                                    <Button variant="link" size="sm" className="h-auto p-0 mt-1">RSVP Now</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
