import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  Zap,
  ArrowRight,
  Users,
  BarChart3
} from 'lucide-react';
import { api } from '@/lib/api';

interface LeadScore {
  id: number;
  contact_name: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
}

interface PipelineSummary {
  total_value: number;
  deal_count: number;
  weighted_forecast: number;
}

interface IntentSignal {
  id: number;
  contact_name: string;
  topic: string;
  strength: 'high' | 'medium' | 'low';
}

// Lead Scoring Widget for Dashboard
export function LeadScoringWidget() {
  const navigate = useNavigate();
  const [topLeads, setTopLeads] = useState<LeadScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopLeads();
  }, []);

  const loadTopLeads = async () => {
    try {
      const response = await api.get('/leads/scores', { params: { limit: 5 } });
      setTopLeads(response.data.leads || []);
    } catch (error) {
      console.error('Failed to load lead scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            Top Leads
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/crm/lead-scoring')}>
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        ) : topLeads.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No lead scores yet</div>
        ) : (
          <div className="space-y-2">
            {topLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-600">
                      {lead.contact_name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <span className="font-medium text-sm truncate max-w-[120px]">{lead.contact_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {lead.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                  {lead.trend === 'down' && <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />}
                  <Badge className={getScoreColor(lead.score)}>{lead.score}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


// Pipeline Forecast Widget for Dashboard
export function PipelineForecastWidget() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<PipelineSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPipelineSummary();
  }, []);

  const loadPipelineSummary = async () => {
    try {
      const response = await api.get('/pipeline');
      const stages = response.data.stages || [];
      const totalValue = stages.reduce((sum: number, s: any) => sum + (s.total_value || 0), 0);
      const dealCount = stages.reduce((sum: number, s: any) => sum + (s.deal_count || 0), 0);
      const weighted = stages.reduce((sum: number, s: any) => 
        sum + ((s.total_value || 0) * (s.probability || 0) / 100), 0
      );
      setSummary({ total_value: totalValue, deal_count: dealCount, weighted_forecast: weighted });
    } catch (error) {
      console.error('Failed to load pipeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Pipeline
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/crm/pipeline')}>
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        ) : !summary ? (
          <div className="text-center py-4 text-muted-foreground">No pipeline data</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Pipeline</p>
                <p className="text-lg font-bold">{formatCurrency(summary.total_value)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Deals</p>
                <p className="text-lg font-bold">{summary.deal_count}</p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">Weighted Forecast</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(summary.weighted_forecast)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Intent Signals Widget for Dashboard
export function IntentSignalsWidget() {
  const navigate = useNavigate();
  const [signals, setSignals] = useState<IntentSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntentSignals();
  }, []);

  const loadIntentSignals = async () => {
    try {
      const response = await api.get('/intent/signals', { params: { limit: 5, strength: 'high' } });
      setSignals(response.data.signals || []);
    } catch (error) {
      console.error('Failed to load intent signals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (strength: string) => {
    if (strength === 'high') return 'bg-red-100 text-red-700';
    if (strength === 'medium') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            High Intent Signals
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/contacts')}>
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        ) : signals.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No high intent signals</div>
        ) : (
          <div className="space-y-2">
            {signals.map((signal) => (
              <div key={signal.id} className="flex items-center justify-between py-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{signal.contact_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{signal.topic}</p>
                </div>
                <Badge className={getStrengthColor(signal.strength)}>
                  {signal.strength}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Conversation Intelligence Widget
export function ConversationIntelligenceWidget() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<{ analyzed: number; avgSentiment: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // This would call a real endpoint
      setStats({ analyzed: 45, avgSentiment: 72 });
    } catch (error) {
      console.error('Failed to load conversation stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Call Analysis
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/calls/campaigns')}>
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        ) : !stats ? (
          <div className="text-center py-4 text-muted-foreground">No analysis data</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{stats.analyzed}</p>
              <p className="text-xs text-muted-foreground">Calls Analyzed</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.avgSentiment}%</p>
              <p className="text-xs text-muted-foreground">Avg Sentiment</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
