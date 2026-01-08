import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { analyticsApi } from '@/services/analyticsApi';
import { format } from 'date-fns';

const CohortTab: React.FC = () => {
    const { data: cohortData = [], isLoading } = useQuery({
        queryKey: ['cohort-analysis'],
        queryFn: () => analyticsApi.getCohortAnalysis({
            cohort_type: 'signup',
            start_date: format(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            end_date: format(new Date(), 'yyyy-MM-dd'),
        }),
        staleTime: 300000,
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted/20 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cohort Analysis</CardTitle>
                <CardDescription>User retention by cohort</CardDescription>
            </CardHeader>
            <CardContent>
                {cohortData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No cohort data available
                    </div>
                ) : (
                    <div className="space-y-3">
                        {cohortData.slice(0, 10).map((cohort: any) => (
                            <div key={cohort.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h4 className="font-medium">
                                            {format(new Date(cohort.cohort_date), 'MMM d, yyyy')}
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                            Period {cohort.period_number} • {cohort.cohort_size} users
                                        </p>
                                    </div>
                                    <Badge>{cohort.retention_rate}% retained</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Retained</p>
                                        <p className="font-medium">{cohort.retained_count} users</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Revenue</p>
                                        <p className="font-medium">${cohort.revenue}</p>
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

export default CohortTab;