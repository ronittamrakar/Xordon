import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Info, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Alert {
    id: string;
    type: 'error' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    action?: {
        label: string;
        link: string;
    };
    timestamp: Date;
}

interface SystemAlertsProps {
    alerts: Alert[];
    className?: string;
}

const alertConfig = {
    error: {
        icon: XCircle,
        color: 'text-red-500 bg-red-500/10 border-red-500/20',
        iconColor: 'text-red-500'
    },
    warning: {
        icon: AlertTriangle,
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        iconColor: 'text-amber-500'
    },
    info: {
        icon: Info,
        color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        iconColor: 'text-blue-500'
    },
    success: {
        icon: CheckCircle,
        color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        iconColor: 'text-emerald-500'
    },
};

export const SystemAlerts: React.FC<SystemAlertsProps> = ({ alerts, className }) => {
    const navigate = useNavigate();

    const getTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const criticalAlerts = alerts.filter(a => a.type === 'error' || a.type === 'warning');

    return (
        <Card className={cn("bg-background/50 backdrop-blur-md border-none shadow-xl", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        System Alerts
                    </CardTitle>
                    <CardDescription>
                        {criticalAlerts.length > 0
                            ? `${criticalAlerts.length} item${criticalAlerts.length > 1 ? 's' : ''} need attention`
                            : 'All systems operational'
                        }
                    </CardDescription>
                </div>
                {alerts.length > 3 && (
                    <Button variant="ghost" size="sm" onClick={() => navigate('/system/health')}>
                        View All <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-3">
                {alerts.length > 0 ? alerts.slice(0, 4).map((alert) => {
                    const config = alertConfig[alert.type];
                    const Icon = config.icon;

                    return (
                        <div
                            key={alert.id}
                            className={cn(
                                "p-3 rounded-xl border transition-all",
                                config.color
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <Icon className={cn("h-4 w-4", config.iconColor)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <p className="text-sm font-bold">{alert.title}</p>
                                        <span className="text-[12px] text-muted-foreground font-medium flex-shrink-0">
                                            {getTimeAgo(alert.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                                        {alert.message}
                                    </p>
                                    {alert.action && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs px-2 -ml-2"
                                            onClick={() => navigate(alert.action!.link)}
                                        >
                                            {alert.action.label} <ArrowRight className="h-3 w-3 ml-1" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <CheckCircle className="h-10 w-10 mx-auto mb-3 text-emerald-500 opacity-20" />
                        <p className="text-sm font-medium">All Clear!</p>
                        <p className="text-xs opacity-60">No alerts at this time.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
