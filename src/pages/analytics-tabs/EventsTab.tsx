import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { analyticsApi } from '@/services/analyticsApi';
import { format } from 'date-fns';

const EventsTab: React.FC = () => {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['analytics-events'],
    queryFn: () => analyticsApi.getEvents({ limit: 100 }),
    staleTime: 300000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted/20 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Events</CardTitle>
        <CardDescription>Analytics events tracked in your workspace</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No events tracked yet
          </div>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 20).map((event: any) => (
              <div key={event.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{event.event_type}</Badge>
                    <span className="font-medium text-sm">{event.event_name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(event.created_at), 'MMM d, HH:mm:ss')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventsTab;