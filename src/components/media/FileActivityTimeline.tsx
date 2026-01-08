import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';
import {
    Upload,
    Download,
    Share2,
    Move,
    Edit3,
    Trash2,
    RefreshCw,
    Star,
    Eye,
    Clock,
    User as UserIcon,
    History
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityItem {
    id: number;
    file_id: number;
    user_id: number;
    activity_type: 'upload' | 'download' | 'share' | 'move' | 'rename' | 'delete' | 'restore' | 'star' | 'unstar' | 'view';
    description: string;
    metadata: any;
    created_at: string;
    user_name: string;
}

interface FileActivityTimelineProps {
    fileId: string | number | null;
}

const FileActivityTimeline: React.FC<FileActivityTimelineProps> = ({ fileId }) => {
    const { data: response, isLoading, error } = useQuery({
        queryKey: ['file-activity', fileId],
        queryFn: () => api.getFileActivity(fileId!),
        enabled: !!fileId
    });

    const activities: ActivityItem[] = response?.data || [];

    const getIcon = (type: ActivityItem['activity_type']) => {
        switch (type) {
            case 'upload': return <Upload className="w-4 h-4 text-blue-400" />;
            case 'download': return <Download className="w-4 h-4 text-green-400" />;
            case 'share': return <Share2 className="w-4 h-4 text-purple-400" />;
            case 'move': return <Move className="w-4 h-4 text-orange-400" />;
            case 'rename': return <Edit3 className="w-4 h-4 text-yellow-400" />;
            case 'delete': return <Trash2 className="w-4 h-4 text-red-500" />;
            case 'restore': return <RefreshCw className="w-4 h-4 text-green-500" />;
            case 'star': return <Star className="w-4 h-4 text-yellow-500 fill-current" />;
            case 'unstar': return <Star className="w-4 h-4 text-slate-400" />;
            case 'view': return <Eye className="w-4 h-4 text-slate-400" />;
            default: return <History className="w-4 h-4 text-slate-400" />;
        }
    };

    const getBgColor = (type: ActivityItem['activity_type']) => {
        switch (type) {
            case 'upload': return 'bg-blue-500/10';
            case 'download': return 'bg-green-500/10';
            case 'share': return 'bg-purple-500/10';
            case 'move': return 'bg-orange-500/10';
            case 'rename': return 'bg-yellow-500/10';
            case 'delete': return 'bg-red-500/10';
            case 'restore': return 'bg-green-500/10';
            case 'star': return 'bg-yellow-500/10';
            default: return 'bg-slate-500/10';
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4 p-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex space-x-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-center text-red-400 text-sm">Failed to load activity</div>;
    }

    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <History className="w-12 h-12 text-slate-700 mb-4" />
                <p className="text-slate-400 font-medium">No activity recorded yet</p>
                <p className="text-slate-500 text-xs mt-1">Actions like uploads, shares and moves will appear here.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
                    <History className="w-4 h-4 text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-200">Activity History</h3>
                </div>

                <div className="space-y-6 relative">
                    {/* Continuous line */}
                    <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-800" />

                    {activities.map((activity, idx) => (
                        <div key={activity.id} className="relative flex space-x-4 pl-0">
                            <div className={`z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-slate-800 backdrop-blur-sm ${getBgColor(activity.activity_type)} shadow-lg shadow-black/20`}>
                                {getIcon(activity.activity_type)}
                            </div>

                            <div className="flex-1 pt-1">
                                <p className="text-sm text-slate-200 leading-tight">
                                    <span className="font-bold text-white pr-1">{activity.user_name}</span>
                                    <span className="text-slate-400">{activity.description}</span>
                                </p>
                                <div className="flex items-center mt-1.5 space-x-3 text-[12px] text-slate-500 uppercase tracking-wider font-semibold">
                                    <span className="flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {format(new Date(activity.created_at), 'MMM d, p')}
                                    </span>
                                    {activity.metadata?.ip_address && (
                                        <span className="bg-slate-800/50 px-1.5 py-0.5 rounded">
                                            {activity.metadata.ip_address}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ScrollArea>
    );
};

export default FileActivityTimeline;
