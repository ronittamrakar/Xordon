import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Plus, Trash2, Edit, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { analyticsApi } from '@/services/analyticsApi';

interface DashboardsTabProps {
    onCreate: () => void;
}

const DashboardsTab: React.FC<DashboardsTabProps> = ({ onCreate }) => {
    const { data: dashboards = [], isLoading } = useQuery({
        queryKey: ['analytics-dashboards'],
        queryFn: analyticsApi.listDashboards,
        staleTime: 300000,
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-40 bg-muted/20 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Custom Dashboards</CardTitle>
                <CardDescription>Your personalized analytics dashboards</CardDescription>
            </CardHeader>
            <CardContent>
                {dashboards.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No custom dashboards yet</p>
                        <Button onClick={onCreate} className="mt-4">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Dashboard
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dashboards.map((dashboard: any) => (
                            <Card key={dashboard.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-base">{dashboard.name}</CardTitle>
                                            {dashboard.description && (
                                                <CardDescription className="text-xs mt-1">
                                                    {dashboard.description}
                                                </CardDescription>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            {dashboard.is_shared && (
                                                <Badge variant="secondary" className="text-xs">
                                                    <Share2 className="h-3 w-3 mr-1" />
                                                    Shared
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            <Edit className="h-4 w-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button variant="ghost" size="sm">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default DashboardsTab;