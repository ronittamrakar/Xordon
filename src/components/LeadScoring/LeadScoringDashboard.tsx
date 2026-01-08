import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, RefreshCw, Settings } from 'lucide-react';
import { api } from '@/lib/api';

interface LeadScore {
  contact_id: number;
  score: number;
  factors: Array<{
    signal: string;
    weight: number;
    value: number;
    contribution: number;
  }>;
  calculated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
}

interface LeadScoringDashboardProps {
  limit?: number;
  showSettings?: boolean;
}

export const LeadScoringDashboard: React.FC<LeadScoringDashboardProps> = ({
  limit = 20,
  showSettings = false
}) => {
  const [leads, setLeads] = useState<LeadScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopLeads = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: LeadScore[] }>(`/leads/scores?limit=${limit}`);
      if (response.data.success) {
        setLeads(response.data.data);
      }
    } catch (err) {
      setError('Failed to load lead scores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopLeads();
  }, [limit]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };


  const getSignalLabel = (signal: string) => {
    const labels: Record<string, string> = {
      email_opens: 'Email Opens',
      link_clicks: 'Link Clicks',
      call_duration: 'Call Duration',
      form_submissions: 'Form Submissions',
      reply_sentiment: 'Positive Replies'
    };
    return labels[signal] || signal;
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

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchTopLeads} className="mt-2">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top Leads by Score
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchTopLeads}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          {showSettings && (
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Configure
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leads.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No scored leads yet. Scores are calculated based on engagement activity.
            </p>
          ) : (
            leads.map((lead, index) => (
              <TooltipProvider key={lead.contact_id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground w-6">{index + 1}.</span>
                        <div>
                          <p className="font-medium">
                            {lead.first_name} {lead.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {lead.company || lead.email}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${getScoreColor(lead.score)} text-white`}>
                        {lead.score}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <div className="space-y-2">
                      <p className="font-semibold">Score Breakdown</p>
                      {lead.factors.length > 0 ? (
                        lead.factors.map((factor, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span>{getSignalLabel(factor.signal)}</span>
                            <span>+{factor.contribution.toFixed(1)}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No engagement signals yet</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadScoringDashboard;
