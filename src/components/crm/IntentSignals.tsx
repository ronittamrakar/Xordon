import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Target, 
  RefreshCw, 
  AlertTriangle, 
  TrendingUp, 
  Clock,
  Zap,
  ExternalLink,
  Loader2,
  Signal,
  Calendar
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

interface IntentSignal {
  id: number;
  topic: string;
  strength: 'low' | 'medium' | 'high';
  source: string;
  source_url?: string;
  detected_at: string;
  is_stale: boolean;
  match_type?: string;
  match_confidence?: number;
  metadata?: Record<string, unknown>;
}

interface IntentSignalsProps {
  contactId: number;
  onSignalClick?: (signal: IntentSignal) => void;
  showStale?: boolean;
}

/**
 * IntentSignals Component
 * Displays intent signals for a contact profile
 * Requirements: 5.2 - Display topic, strength, and detection date for each signal
 */
export const IntentSignals: React.FC<IntentSignalsProps> = ({
  contactId,
  onSignalClick,
  showStale = false
}) => {
  const [signals, setSignals] = useState<IntentSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<{ success: boolean; data: IntentSignal[] }>(
        'GET', 
        `/contacts/${contactId}/intent${showStale ? '?include_stale=1' : ''}`
      );
      if (response.success && response.data) {
        setSignals(response.data);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load intent signals';
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        setSignals([]);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, [contactId, showStale]);

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'high':
        return 'bg-green-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-300 text-gray-700';
    }
  };

  const getStrengthIcon = (strength: string) => {
    switch (strength) {
      case 'high':
        return <Zap className="h-3 w-3" />;
      case 'medium':
        return <TrendingUp className="h-3 w-3" />;
      case 'low':
        return <Signal className="h-3 w-3" />;
      default:
        return <Signal className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const activeSignals = signals.filter(s => !s.is_stale);
  const staleSignals = signals.filter(s => s.is_stale);
  const highIntentSignals = activeSignals.filter(s => s.strength === 'high');

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5" />
            Intent Signals
          </CardTitle>
          <CardDescription>
            Research activity and buying intent indicators
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSignals}>
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

        {/* High Intent Alert */}
        {highIntentSignals.length > 0 && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 font-medium">
              <Zap className="h-4 w-4" />
              {highIntentSignals.length} High Intent Signal{highIntentSignals.length > 1 ? 's' : ''} Detected
            </div>
            <p className="text-sm text-green-600 mt-1">
              This contact is actively researching relevant topics. Consider reaching out soon.
            </p>
          </div>
        )}

        {/* Active Signals */}
        {activeSignals.length > 0 ? (
          <ScrollArea className="h-[300px] pr-2">
            <div className="space-y-3">
              {activeSignals.map((signal) => (
                <IntentSignalCard 
                  key={signal.id} 
                  signal={signal} 
                  onClick={onSignalClick}
                  getStrengthColor={getStrengthColor}
                  getStrengthIcon={getStrengthIcon}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No Active Intent Signals</p>
            <p className="text-sm mt-1">
              Intent signals will appear here when this contact shows research activity.
            </p>
          </div>
        )}

        {/* Stale Signals (if showing) */}
        {showStale && staleSignals.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Stale Signals ({staleSignals.length})
            </h4>
            <div className="space-y-2 opacity-60">
              {staleSignals.map((signal) => (
                <IntentSignalCard 
                  key={signal.id} 
                  signal={signal} 
                  onClick={onSignalClick}
                  getStrengthColor={getStrengthColor}
                  getStrengthIcon={getStrengthIcon}
                  formatDate={formatDate}
                  isStale
                />
              ))}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {signals.length > 0 && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
            <span>{activeSignals.length} active signal{activeSignals.length !== 1 ? 's' : ''}</span>
            {staleSignals.length > 0 && !showStale && (
              <span>{staleSignals.length} stale signal{staleSignals.length !== 1 ? 's' : ''} hidden</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface IntentSignalCardProps {
  signal: IntentSignal;
  onClick?: (signal: IntentSignal) => void;
  getStrengthColor: (strength: string) => string;
  getStrengthIcon: (strength: string) => React.ReactNode;
  formatDate: (date: string) => string;
  isStale?: boolean;
}

const IntentSignalCard: React.FC<IntentSignalCardProps> = ({
  signal,
  onClick,
  getStrengthColor,
  getStrengthIcon,
  formatDate,
  isStale = false
}) => {
  return (
    <div 
      className={`p-3 rounded-lg border transition-colors ${
        isStale 
          ? 'bg-gray-50 border-gray-200' 
          : signal.strength === 'high'
            ? 'bg-green-50/50 border-green-200 hover:bg-green-50'
            : 'bg-white border-gray-200 hover:bg-gray-50'
      } ${onClick ? 'cursor-pointer' : ''}`}
      onClick={() => onClick?.(signal)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Topic - Required field per Requirements 5.2 */}
          <h4 className="font-medium text-sm truncate" title={signal.topic}>
            {signal.topic}
          </h4>
          
          {/* Source */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              via {signal.source}
            </span>
            {signal.source_url && (
              <a 
                href={signal.source_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          
          {/* Detection Date - Required field per Requirements 5.2 */}
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Detected {formatDate(signal.detected_at)}</span>
            {isStale && (
              <Badge variant="outline" className="ml-2 text-xs py-0">
                Stale
              </Badge>
            )}
          </div>
        </div>
        
        {/* Strength Indicator - Required field per Requirements 5.2 */}
        <Badge className={`${getStrengthColor(signal.strength)} flex items-center gap-1 shrink-0`}>
          {getStrengthIcon(signal.strength)}
          <span className="capitalize">{signal.strength}</span>
        </Badge>
      </div>
      
      {/* Match confidence (if available) */}
      {signal.match_confidence && (
        <div className="mt-2 text-xs text-muted-foreground">
          Match: {signal.match_type?.replace('_', ' ')} ({Math.round(signal.match_confidence * 100)}% confidence)
        </div>
      )}
    </div>
  );
};

export default IntentSignals;
