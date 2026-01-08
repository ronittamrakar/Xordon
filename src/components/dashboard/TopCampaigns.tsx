import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Campaign } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, ArrowRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface TopCampaignsProps {
    campaigns: Campaign[];
    className?: string;
}

export const TopCampaigns: React.FC<TopCampaignsProps> = ({ campaigns, className }) => {
    const navigate = useNavigate();

    return (
        <Card className={cn("bg-background/50 backdrop-blur-md border-none shadow-xl", className)}>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Top Performing Campaigns
                    </CardTitle>
                    <CardDescription>By engagement rate</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10" onClick={() => navigate('/reach/outbound/email/campaigns')}>
                    View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border/50">
                                <th className="pb-3 font-semibold">Campaign</th>
                                <th className="pb-3 font-semibold text-center">Sent</th>
                                <th className="pb-3 font-semibold text-center">Open Rate</th>
                                <th className="pb-3 font-semibold text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {campaigns.length > 0 ? campaigns.map((c) => (
                                <tr key={c.id} className="group hover:bg-muted/30 transition-colors">
                                    <td className="py-4">
                                        <p className="text-sm font-semibold truncate max-w-[150px]">{c.name}</p>
                                        <p className="text-[12px] text-muted-foreground">Created {new Date(c.createdAt || '').toLocaleDateString()}</p>
                                    </td>
                                    <td className="py-4 text-center text-sm font-medium">
                                        {c.sent?.toLocaleString() || 0}
                                    </td>
                                    <td className="py-4 text-center">
                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-xs font-bold">
                                            <TrendingUp className="h-3 w-3" />
                                            {((c.opens || 0) / (c.sent || 1) * 100).toFixed(1)}%
                                        </div>
                                    </td>
                                    <td className="py-4 text-right">
                                        <Badge variant={c.status === 'sending' ? 'default' : 'secondary'} className="text-[12px] px-1.5 py-0 capitalize">
                                            {c.status}
                                        </Badge>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-muted-foreground italic text-sm">
                                        No active campaigns found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};
