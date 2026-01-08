import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    UserPlus,
    Mail,
    Smartphone,
    MessageSquare,
    AlertCircle,
    CheckCircle2,
    Clock,
    History,
    TrendingUp,
    CreditCard,
    FileTextIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
    id: string;
    type: 'contact' | 'email' | 'sms' | 'call' | 'payment' | 'form' | 'reputation' | 'system';
    title: string;
    description: string;
    timestamp: Date | string;
    status?: 'success' | 'warning' | 'error' | 'info';
}

interface ActivityFeedProps {
    activities: ActivityItem[];
    className?: string;
}

const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
        case 'contact': return UserPlus;
        case 'email': return Mail;
        case 'sms': return Smartphone;
        case 'call': return MessageSquare;
        case 'payment': return CreditCard;
        case 'form': return FileTextIcon;
        case 'reputation': return TrendingUp;
        case 'system': return AlertCircle;
        default: return History;
    }
};

const getStatusColor = (status?: ActivityItem['status']) => {
    switch (status) {
        case 'success': return 'text-emerald-500 bg-emerald-500/10';
        case 'warning': return 'text-amber-500 bg-amber-500/10';
        case 'error': return 'text-rose-500 bg-rose-500/10';
        case 'info': return 'text-primary bg-primary/10';
        default: return 'text-primary bg-primary/10';
    }
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, className }) => {
    return (
        <Card className={cn("bg-background/50 backdrop-blur-md border-none shadow-xl", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Recent Activity
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                    <Clock className="h-3 w-3" />
                    Live Update
                </div>
            </CardHeader>
            <CardContent className="pr-2">
                <div className="space-y-6 max-h-[450px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                    {activities.length > 0 ? (
                        activities.map((activity, idx) => {
                            const Icon = getIcon(activity.type);
                            return (
                                <div key={activity.id} className="relative flex gap-4 last:mb-0 mb-6 group">
                                    {/* Timeline Line */}
                                    {idx !== activities.length - 1 && (
                                        <div className="absolute left-[17px] top-10 bottom-[-24px] w-px bg-border group-hover:bg-primary/20 transition-colors" />
                                    )}

                                    <div className={cn(
                                        "relative z-10 p-2 rounded-full h-[36px] w-[36px] flex items-center justify-center border-4 border-background",
                                        getStatusColor(activity.status)
                                    )}>
                                        <Icon className="h-4 w-4" />
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold">{activity.title}</p>
                                            <time className="text-[12px] text-muted-foreground font-medium uppercase tracking-tighter">
                                                {typeof activity.timestamp === 'string'
                                                    ? activity.timestamp
                                                    : formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                                            </time>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {activity.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="p-4 bg-muted rounded-full mb-4">
                                <History className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">No recent activity</p>
                            <p className="text-xs text-muted-foreground/60">Activities will appear here as they happen</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

