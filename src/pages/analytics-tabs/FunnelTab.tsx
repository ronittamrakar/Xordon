import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { analyticsApi } from '@/services/analyticsApi';
import { format } from 'date-fns';

const FunnelTab: React.FC = () => {
  const { data: funnelData = [], isLoading } = useQuery({
    queryKey: ['funnel-analytics'],
    queryFn: () => analyticsApi.getFunnelAnalytics({
      start_date: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
    }),
    staleTime: 300000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-muted/20 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funnel Analysis</CardTitle>
        <CardDescription>Conversion funnel performance</CardDescription>
      </CardHeader>
      <CardContent>
        {funnelData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No funnel data available
          </div>
        ) : (
          <div className="space-y-3">
            {funnelData.map((step: any) => (
              <div key={step.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{step.step_name}</h4>
                    <p className="text-xs text-muted-foreground">Step {step.step_order}</p>
                  </div>
                  <Badge>{step.conversion_rate}% conversion</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Visitors</p>
                    <p className="font-medium">{step.visitors}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Conversions</p>
                    <p className="font-medium">{step.conversions}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Drop-offs</p>
                    <p className="font-medium">{step.drop_off_count}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FunnelTab;