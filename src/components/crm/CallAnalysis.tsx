import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Phone, 
  RefreshCw, 
  AlertTriangle, 
  TrendingUp, 
  MessageSquare,
  User,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Target,
  FileTextIcon,
  Loader2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  
  return (await res.json()) as T;
}

interface SpeakerSegment {
  speaker: 'agent' | 'customer';
  start: number;
  end: number;
  text?: string;
}

interface CallAnalysisData {
  id: number;
  call_id: number;
  text: string;
  speakers: SpeakerSegment[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  failure_reason?: string;
  sentiment_score: number;
  intent_score: number;
  key_phrases: string[];
  objections: string[];
  buying_signals: string[];
  talk_ratio: number;
  duration_seconds?: number;
  word_count?: number;
  created_at: string;
}

interface CallAnalysisProps {
  callId: number;
  onAnalysisComplete?: (analysis: CallAnalysisData) => void;
}

export const CallAnalysis: React.FC<CallAnalysisProps> = ({
  callId,
  onAnalysisComplete
}) => {
  const [analysis, setAnalysis] = useState<CallAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<{ success: boolean; data: CallAnalysisData }>(
        'GET', 
        `/calls/${callId}/analysis`
      );
      if (response.success && response.data) {
        setAnalysis(response.data);
        onAnalysisComplete?.(response.data);
      }
    } catch (err: any) {
      if (err.message?.includes('404') || err.message?.includes('not found')) {
        setAnalysis(null);
      } else {
        setError(err.message || 'Failed to load analysis');
      }
    } finally {
      setLoading(false);
    }
  };

  const startTranscription = async () => {
    setTranscribing(true);
    setError(null);
    try {
      await apiRequest<{ success: boolean }>('POST', `/calls/${callId}/transcribe`);
      // Poll for completion
      let attempts = 0;
      const maxAttempts = 30;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const response = await apiRequest<{ success: boolean; data: CallAnalysisData }>(
            'GET', 
            `/calls/${callId}/analysis`
          );
          if (response.success && response.data?.status === 'completed') {
            clearInterval(pollInterval);
            setAnalysis(response.data);
            setTranscribing(false);
            onAnalysisComplete?.(response.data);
          } else if (response.data?.status === 'failed') {
            clearInterval(pollInterval);
            setError(response.data.failure_reason || 'Transcription failed');
            setTranscribing(false);
          }
        } catch {
          // Continue polling
        }
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setError('Transcription timed out');
          setTranscribing(false);
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to start transcription');
      setTranscribing(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [callId]);

  const getSentimentColor = (score: number) => {
    if (score >= 0.3) return 'text-green-600';
    if (score <= -0.3) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getSentimentLabel = (score: number) => {
    if (score >= 0.5) return 'Very Positive';
    if (score >= 0.2) return 'Positive';
    if (score >= -0.2) return 'Neutral';
    if (score >= -0.5) return 'Negative';
    return 'Very Negative';
  };

  const getIntentLabel = (score: number) => {
    if (score >= 80) return 'High Intent';
    if (score >= 60) return 'Moderate Intent';
    if (score >= 40) return 'Low Intent';
    return 'No Intent';
  };

  const getIntentColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Analysis
          </CardTitle>
          <CardDescription>
            Transcribe and analyze this call recording
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}
          <div className="text-center py-8">
            <FileTextIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No analysis available for this call yet.
            </p>
            <Button onClick={startTranscription} disabled={transcribing}>
              {transcribing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Transcribing...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Start Transcription
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Analysis
          </CardTitle>
          <CardDescription>
            AI-powered insights from call recording
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAnalysis}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
            <Button variant="link" className="ml-auto p-0 h-auto" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transcription">Transcription</TabsTrigger>
            <TabsTrigger value="signals">Signals</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Sentiment Score */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Sentiment</span>
                    {analysis.sentiment_score >= 0 ? (
                      <ThumbsUp className={`h-4 w-4 ${getSentimentColor(analysis.sentiment_score)}`} />
                    ) : (
                      <ThumbsDown className={`h-4 w-4 ${getSentimentColor(analysis.sentiment_score)}`} />
                    )}
                  </div>
                  <div className={`text-2xl font-bold ${getSentimentColor(analysis.sentiment_score)}`}>
                    {(analysis.sentiment_score * 100).toFixed(0)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getSentimentLabel(analysis.sentiment_score)}
                  </p>
                </CardContent>
              </Card>

              {/* Intent Score */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Intent</span>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{analysis.intent_score}</div>
                  <Progress 
                    value={analysis.intent_score} 
                    className={`h-2 mt-2 ${getIntentColor(analysis.intent_score)}`}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {getIntentLabel(analysis.intent_score)}
                  </p>
                </CardContent>
              </Card>

              {/* Talk Ratio */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Talk Ratio</span>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">
                    {(analysis.talk_ratio * 100).toFixed(0)}%
                  </div>
                  <div className="flex gap-1 mt-2">
                    <div 
                      className="h-2 bg-blue-500 rounded-l" 
                      style={{ width: `${analysis.talk_ratio * 100}%` }}
                    />
                    <div 
                      className="h-2 bg-gray-300 rounded-r" 
                      style={{ width: `${(1 - analysis.talk_ratio) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Agent vs Customer
                  </p>
                </CardContent>
              </Card>

              {/* Duration */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Duration</span>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">
                    {analysis.duration_seconds ? formatDuration(analysis.duration_seconds) : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analysis.word_count ? `${analysis.word_count} words` : ''}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Key Phrases */}
            {analysis.key_phrases && analysis.key_phrases.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Key Phrases
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.key_phrases.map((phrase, index) => (
                    <Badge key={index} variant="secondary">
                      {phrase}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Buying Signals Summary */}
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-green-700 flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4" />
                    Buying Signals ({analysis.buying_signals?.length || 0})
                  </h4>
                  {analysis.buying_signals && analysis.buying_signals.length > 0 ? (
                    <ul className="text-sm space-y-1">
                      {analysis.buying_signals.slice(0, 3).map((signal, index) => (
                        <li key={index} className="text-green-600">• {signal}</li>
                      ))}
                      {analysis.buying_signals.length > 3 && (
                        <li className="text-green-500 text-xs">
                          +{analysis.buying_signals.length - 3} more
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No buying signals detected</p>
                  )}
                </CardContent>
              </Card>

              {/* Objections Summary */}
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-red-700 flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Objections ({analysis.objections?.length || 0})
                  </h4>
                  {analysis.objections && analysis.objections.length > 0 ? (
                    <ul className="text-sm space-y-1">
                      {analysis.objections.slice(0, 3).map((objection, index) => (
                        <li key={index} className="text-red-600">• {objection}</li>
                      ))}
                      {analysis.objections.length > 3 && (
                        <li className="text-red-500 text-xs">
                          +{analysis.objections.length - 3} more
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No objections detected</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>


          {/* Transcription Tab */}
          <TabsContent value="transcription">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileTextIcon className="h-4 w-4" />
                  Call Transcription
                </h3>
                <ScrollArea className="h-[400px] pr-4">
                  {analysis.speakers && analysis.speakers.length > 0 ? (
                    <div className="space-y-4">
                      {analysis.speakers.map((segment, index) => (
                        <div 
                          key={index}
                          className={`p-3 rounded-lg ${
                            segment.speaker === 'agent' 
                              ? 'bg-blue-50 border-l-4 border-blue-500' 
                              : 'bg-gray-50 border-l-4 border-gray-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium ${
                              segment.speaker === 'agent' ? 'text-blue-700' : 'text-gray-700'
                            }`}>
                              {segment.speaker === 'agent' ? '🎧 Agent' : '👤 Customer'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(segment.start)} - {formatDuration(segment.end)}
                            </span>
                          </div>
                          {segment.text && (
                            <p className="text-sm">{segment.text}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : analysis.text ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{analysis.text}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No transcription text available
                    </p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Signals Tab */}
          <TabsContent value="signals">
            <div className="space-y-6">
              {/* Buying Signals */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                    <TrendingUp className="h-5 w-5" />
                    Buying Signals
                  </CardTitle>
                  <CardDescription>
                    Positive indicators suggesting purchase intent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysis.buying_signals && analysis.buying_signals.length > 0 ? (
                    <div className="space-y-3">
                      {analysis.buying_signals.map((signal, index) => (
                        <div 
                          key={index}
                          className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                        >
                          <div className="h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-green-800 capitalize">{signal}</p>
                            <p className="text-xs text-green-600 mt-1">
                              Detected buying signal - consider following up promptly
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No buying signals detected in this call</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Objections */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    Objections
                  </CardTitle>
                  <CardDescription>
                    Concerns or hesitations expressed during the call
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysis.objections && analysis.objections.length > 0 ? (
                    <div className="space-y-3">
                      {analysis.objections.map((objection, index) => (
                        <div 
                          key={index}
                          className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200"
                        >
                          <div className="h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-red-800 capitalize">{objection}</p>
                            <p className="text-xs text-red-600 mt-1">
                              Address this objection in follow-up communications
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No objections detected in this call</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Automation Triggers Info */}
              {(analysis.buying_signals?.length > 0 || analysis.objections?.length > 0) && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-800">Automation Triggers Available</h4>
                        <p className="text-sm text-blue-600 mt-1">
                          The detected signals can be used as automation triggers. 
                          Configure automations to automatically follow up based on these insights.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CallAnalysis;

