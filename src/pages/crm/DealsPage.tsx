import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    LayoutGrid,
    List,
    TrendingUp,
    DollarSign,
    Target,
    ArrowUpRight,
    Filter,
    Plus
} from 'lucide-react';
import PipelinePage from './PipelinePage';
import LeadsPage from './LeadsPage';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface CRMStats {
    total_leads: number;
    new_leads: number;
    won_deals: number;
    total_value: number;
    avg_lead_score: number;
}

const DealsPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialView = (searchParams.get('view') as 'board' | 'list') || 'board';
    const [view, setView] = useState<'board' | 'list'>(initialView);
    const [stats, setStats] = useState<CRMStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Sync view state with URL
        const params = new URLSearchParams(searchParams);
        params.set('view', view);
        setSearchParams(params);
    }, [view, setSearchParams]);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const response = await api.crm.getDashboard();
                if (response && response.metrics) {
                    setStats(response.metrics);
                }
            } catch (error) {
                console.error('Failed to load deals stats:', error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 pt-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Sales Pipeline</h1>
                    <p className="text-muted-foreground">Manage deal volume, track sales velocity, and optimize conversions.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border mr-2">
                        <Button
                            variant={view === 'board' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8"
                            onClick={() => setView('board')}
                        >
                            <LayoutGrid className="h-4 w-4 mr-2" />
                            Board
                        </Button>
                        <Button
                            variant={view === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8"
                            onClick={() => setView('list')}
                        >
                            <List className="h-4 w-4 mr-2" />
                            List
                        </Button>
                    </div>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-6">
                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-blue-100 dark:border-blue-900/30">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Pipeline Value</p>
                            <h3 className="text-2xl font-bold mt-1">
                                ${Number(stats?.total_value || 0).toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                            <DollarSign className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background border-green-100 dark:border-green-900/30">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">Won Deals</p>
                            <h3 className="text-2xl font-bold mt-1">{Number(stats?.won_deals || 0)}</h3>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                            <Target className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background border-purple-100 dark:border-purple-900/30">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Avg. Lead Score</p>
                            <h3 className="text-2xl font-bold mt-1">{Math.round(Number(stats?.avg_lead_score || 0))}</h3>
                        </div>
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background border-orange-100 dark:border-orange-900/30">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Sales Velocity</p>
                            <h3 className="text-2xl font-bold mt-1">12.4 Days</h3>
                        </div>
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600 dark:text-orange-400">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Content */}
            <div className="flex-1 bg-background overflow-hidden px-6 pb-6">
                <div className="h-full border border-border/50 rounded-xl shadow-sm overflow-hidden bg-muted/5">
                    {view === 'board' ? (
                        <PipelinePage hideHeader={false} />
                    ) : (
                        <div className="p-4 h-full overflow-y-auto">
                            <LeadsPage hideHeader={false} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DealsPage;
