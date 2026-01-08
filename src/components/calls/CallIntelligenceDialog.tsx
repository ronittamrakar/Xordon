import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    SkipBack,
    SkipForward,
    Download,
    Copy,
    FileTextIcon,
    Brain,
    Sparkles,
    TrendingUp,
    TrendingDown,
    Minus,
    Tag,
    AlertTriangle,
    CheckCircle,
    Clock,
    User,
    Phone,
    MessageSquare,
    Target,
    Lightbulb,
} from 'lucide-react';
import { api } from '@/lib/api';
import { format } from 'date-fns';

interface CallIntelligenceProps {
    callId: string | null;
    isOpen: boolean;
    onClose: () => void;
    callData?: {
        id: string;
        phone_number: string;
        duration: number;
        outcome: string;
        recording_url?: string;
        started_at: string;
        recipient_name?: string;
        campaign_name?: string;
    };
}

interface TranscriptSegment {
    speaker: 'agent' | 'customer';
    text: string;
    timestamp: number;
}

interface CallAnalysis {
    transcription_id: number;
    status: string;
    text: string;
    speakers?: TranscriptSegment[];
    duration_seconds: number;
    word_count: number;
    sentiment_score: number | null;
    intent_score: number | null;
    key_phrases: string[];
    objections: string[];
    buying_signals: string[];
    talk_ratio: number | null;
}

export default function CallIntelligenceDialog({
    callId,
    isOpen,
    onClose,
    callData,
}: CallIntelligenceProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);

    const [analysis, setAnalysis] = useState<CallAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [activeTab, setActiveTab] = useState('transcript');

    useEffect(() => {
        if (isOpen && callId) {
            loadAnalysis();
        }
    }, [isOpen, callId]);

    const loadAnalysis = async () => {
        if (!callId) return;
        setIsLoading(true);
        try {
            const response = await api.get(`/calls/${callId}/analysis`);
            if ((response.data as any)?.success) {
                setAnalysis((response.data as any).data);
            }
        } catch (error: any) {
            // If analysis doesn't exist, that's okay - user can request transcription
            if (error.response?.status !== 404) {
                console.error('Failed to load analysis:', error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const requestTranscription = async () => {
        if (!callId) return;
        setIsTranscribing(true);
        try {
            await api.post(`/calls/${callId}/transcribe`);
            toast.success('Transcription started. This may take a few minutes.');
            // Poll for completion
            const pollInterval = setInterval(async () => {
                try {
                    const response = await api.get(`/calls/${callId}/analysis`);
                    if ((response.data as any)?.success && (response.data as any).data?.status === 'completed') {
                        setAnalysis((response.data as any).data);
                        setIsTranscribing(false);
                        clearInterval(pollInterval);
                        toast.success('Transcription complete!');
                    }
                } catch (error) {
                    // Keep polling
                }
            }, 5000);
            // Stop polling after 2 minutes
            setTimeout(() => {
                clearInterval(pollInterval);
                setIsTranscribing(false);
            }, 120000);
        } catch (error) {
            toast.error('Failed to start transcription');
            setIsTranscribing(false);
        }
    };

    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const skipTime = (seconds: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
        }
    };

    const changePlaybackRate = () => {
        const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
        const currentIndex = rates.indexOf(playbackRate);
        const nextIndex = (currentIndex + 1) % rates.length;
        const newRate = rates[nextIndex];
        setPlaybackRate(newRate);
        if (audioRef.current) {
            audioRef.current.playbackRate = newRate;
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getSentimentBadge = (score: number | null) => {
        if (score === null) return null;
        if (score >= 0.3) {
            return (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Positive ({Math.round(score * 100)}%)
                </Badge>
            );
        } else if (score <= -0.3) {
            return (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Negative ({Math.round(Math.abs(score) * 100)}%)
                </Badge>
            );
        } else {
            return (
                <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                    <Minus className="h-3 w-3 mr-1" />
                    Neutral
                </Badge>
            );
        }
    };

    const getIntentBadge = (score: number | null) => {
        if (score === null) return null;
        if (score >= 70) {
            return (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Target className="h-3 w-3 mr-1" />
                    High Intent ({score}%)
                </Badge>
            );
        } else if (score >= 40) {
            return (
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    <Target className="h-3 w-3 mr-1" />
                    Medium Intent ({score}%)
                </Badge>
            );
        } else {
            return (
                <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                    <Target className="h-3 w-3 mr-1" />
                    Low Intent ({score}%)
                </Badge>
            );
        }
    };

    const copyTranscript = () => {
        if (analysis?.text) {
            navigator.clipboard.writeText(analysis.text);
            toast.success('Transcript copied to clipboard');
        }
    };

    // Mock transcript segments for demo
    const mockSegments: TranscriptSegment[] = analysis?.text
        ? [
            { speaker: 'agent', text: 'Hello, thank you for calling. How can I help you today?', timestamp: 0 },
            { speaker: 'customer', text: 'Hi, I\'m interested in learning more about your services.', timestamp: 5 },
            { speaker: 'agent', text: 'Absolutely! I\'d be happy to tell you about what we offer. What specifically are you looking for?', timestamp: 10 },
            { speaker: 'customer', text: 'I need help with my marketing. We\'re a small business and want to grow.', timestamp: 18 },
            { speaker: 'agent', text: 'That\'s great! We specialize in helping small businesses like yours. Let me explain our packages...', timestamp: 25 },
        ]
        : [];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        Call Intelligence
                        {callData && (
                            <span className="text-sm font-normal text-muted-foreground">
                                • {callData.recipient_name || callData.phone_number}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {/* Audio Player */}
                {callData?.recording_url && (
                    <Card className="mb-4">
                        <CardContent className="p-4">
                            <audio
                                ref={audioRef}
                                src={callData.recording_url}
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onEnded={() => setIsPlaying(false)}
                            />
                            <div className="space-y-3">
                                {/* Progress Bar */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground w-10">{formatTime(currentTime)}</span>
                                    <input
                                        type="range"
                                        min={0}
                                        max={duration || 0}
                                        value={currentTime}
                                        onChange={handleSeek}
                                        className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="text-xs text-muted-foreground w-10">{formatTime(duration)}</span>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => skipTime(-10)}>
                                            <SkipBack className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" onClick={togglePlayPause}>
                                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => skipTime(10)}>
                                            <SkipForward className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={toggleMute}>
                                            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={changePlaybackRate}>
                                            {playbackRate}x
                                        </Button>
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={callData.recording_url} download>
                                                <Download className="h-4 w-4 mr-1" />
                                                Download
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid grid-cols-3 w-full">
                        <TabsTrigger value="transcript" className="flex items-center gap-1">
                            <FileTextIcon className="h-4 w-4" />
                            Transcript
                        </TabsTrigger>
                        <TabsTrigger value="insights" className="flex items-center gap-1">
                            <Sparkles className="h-4 w-4" />
                            AI Insights
                        </TabsTrigger>
                        <TabsTrigger value="signals" className="flex items-center gap-1">
                            <Lightbulb className="h-4 w-4" />
                            Signals
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-hidden">
                        {/* Transcript Tab */}
                        <TabsContent value="transcript" className="h-full m-0 data-[state=active]:flex flex-col">
                            {isLoading ? (
                                <div className="space-y-3 p-4">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-3/4" />
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-2/3" />
                                </div>
                            ) : analysis ? (
                                <>
                                    <div className="flex items-center justify-between p-2 border-b">
                                        <div className="text-sm text-muted-foreground">
                                            {analysis.word_count} words • {formatTime(analysis.duration_seconds)}
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={copyTranscript}>
                                            <Copy className="h-4 w-4 mr-1" />
                                            Copy
                                        </Button>
                                    </div>
                                    <ScrollArea className="flex-1 p-4">
                                        <div className="space-y-4">
                                            {mockSegments.map((segment, index) => (
                                                <div
                                                    key={index}
                                                    className={`flex gap-3 ${segment.speaker === 'agent' ? '' : 'flex-row-reverse'}`}
                                                >
                                                    <div
                                                        className={`p-2 rounded-full ${segment.speaker === 'agent'
                                                                ? 'bg-blue-100 dark:bg-blue-900'
                                                                : 'bg-green-100 dark:bg-green-900'
                                                            }`}
                                                    >
                                                        {segment.speaker === 'agent' ? (
                                                            <User className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                                                        ) : (
                                                            <Phone className="h-4 w-4 text-green-600 dark:text-green-300" />
                                                        )}
                                                    </div>
                                                    <div
                                                        className={`flex-1 p-3 rounded-lg ${segment.speaker === 'agent'
                                                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                                                : 'bg-green-50 dark:bg-green-900/20'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs font-medium capitalize">{segment.speaker}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatTime(segment.timestamp)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm">{segment.text}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full p-8">
                                    <FileTextIcon className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="font-medium mb-2">No Transcript Available</h3>
                                    <p className="text-sm text-muted-foreground text-center mb-4">
                                        Generate an AI-powered transcript with sentiment analysis
                                    </p>
                                    <Button onClick={requestTranscription} disabled={isTranscribing}>
                                        {isTranscribing ? (
                                            <>
                                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                                                Transcribing...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-4 w-4 mr-2" />
                                                Generate Transcript
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </TabsContent>

                        {/* AI Insights Tab */}
                        <TabsContent value="insights" className="h-full m-0 data-[state=active]:flex flex-col">
                            <ScrollArea className="flex-1 p-4">
                                {analysis ? (
                                    <div className="space-y-6">
                                        {/* Sentiment & Intent */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm">Sentiment</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    {getSentimentBadge(analysis.sentiment_score)}
                                                    {analysis.sentiment_score !== null && (
                                                        <Progress
                                                            value={(analysis.sentiment_score + 1) * 50}
                                                            className="mt-2"
                                                        />
                                                    )}
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm">Purchase Intent</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    {getIntentBadge(analysis.intent_score)}
                                                    {analysis.intent_score !== null && (
                                                        <Progress value={analysis.intent_score} className="mt-2" />
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Talk Ratio */}
                                        {analysis.talk_ratio !== null && (
                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm">Talk Ratio</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span>Agent</span>
                                                                <span>Customer</span>
                                                            </div>
                                                            <div className="flex h-3 rounded-full overflow-hidden">
                                                                <div
                                                                    className="bg-blue-500"
                                                                    style={{ width: `${analysis.talk_ratio * 100}%` }}
                                                                />
                                                                <div
                                                                    className="bg-green-500"
                                                                    style={{ width: `${(1 - analysis.talk_ratio) * 100}%` }}
                                                                />
                                                            </div>
                                                            <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                                                                <span>{Math.round(analysis.talk_ratio * 100)}%</span>
                                                                <span>{Math.round((1 - analysis.talk_ratio) * 100)}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Key Phrases */}
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm">Key Phrases</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex flex-wrap gap-2">
                                                    {analysis.key_phrases?.length > 0 ? (
                                                        analysis.key_phrases.map((phrase, index) => (
                                                            <Badge key={index} variant="secondary">
                                                                {phrase}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">No key phrases detected</span>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground">Generate a transcript to see AI insights</p>
                                    </div>
                                )}
                            </ScrollArea>
                        </TabsContent>

                        {/* Signals Tab */}
                        <TabsContent value="signals" className="h-full m-0 data-[state=active]:flex flex-col">
                            <ScrollArea className="flex-1 p-4">
                                {analysis ? (
                                    <div className="space-y-6">
                                        {/* Buying Signals */}
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                    Buying Signals
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {analysis.buying_signals?.length > 0 ? (
                                                    <ul className="space-y-2">
                                                        {analysis.buying_signals.map((signal, index) => (
                                                            <li key={index} className="flex items-start gap-2 text-sm">
                                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                                {signal}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">No buying signals detected</span>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Objections */}
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                    Objections
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {analysis.objections?.length > 0 ? (
                                                    <ul className="space-y-2">
                                                        {analysis.objections.map((objection, index) => (
                                                            <li key={index} className="flex items-start gap-2 text-sm">
                                                                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                                                {objection}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">No objections detected</span>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground">Generate a transcript to see signals</p>
                                    </div>
                                )}
                            </ScrollArea>
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

