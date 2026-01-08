import { useEffect, useState } from 'react';
import { Check, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

interface AutosaveIndicatorProps {
    status: SaveStatus;
    lastSaved?: Date;
    className?: string;
}

export function AutosaveIndicator({ status, lastSaved, className }: AutosaveIndicatorProps) {
    const [showSaved, setShowSaved] = useState(false);

    useEffect(() => {
        if (status === 'saved') {
            setShowSaved(true);
            const timer = setTimeout(() => setShowSaved(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const getStatusConfig = () => {
        switch (status) {
            case 'saving':
                return {
                    icon: Loader2,
                    text: 'Saving...',
                    className: 'text-blue-600 dark:text-blue-400',
                    iconClassName: 'animate-spin',
                };
            case 'saved':
                return {
                    icon: Check,
                    text: 'All changes saved',
                    className: 'text-green-600 dark:text-green-400',
                    iconClassName: '',
                };
            case 'error':
                return {
                    icon: CloudOff,
                    text: 'Failed to save',
                    className: 'text-red-600 dark:text-red-400',
                    iconClassName: '',
                };
            case 'offline':
                return {
                    icon: CloudOff,
                    text: 'Offline',
                    className: 'text-orange-600 dark:text-orange-400',
                    iconClassName: '',
                };
            default:
                return {
                    icon: Cloud,
                    text: '',
                    className: 'text-muted-foreground',
                    iconClassName: '',
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    const formatLastSaved = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);

        if (diffSecs < 60) {
            return 'just now';
        } else if (diffMins < 60) {
            return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleString();
        }
    };

    if (status === 'idle' && !lastSaved) {
        return null;
    }

    return (
        <div
            className={cn(
                'flex items-center gap-2 text-sm transition-all duration-200',
                config.className,
                className
            )}
            role="status"
            aria-live="polite"
        >
            <Icon className={cn('h-4 w-4', config.iconClassName)} />
            <span className="hidden sm:inline">
                {config.text}
                {status === 'saved' && lastSaved && (
                    <span className="ml-1 text-xs text-muted-foreground">
                        ({formatLastSaved(lastSaved)})
                    </span>
                )}
            </span>
        </div>
    );
}

// Hook to manage autosave status
export function useAutosave() {
    const [status, setStatus] = useState<SaveStatus>('idle');
    const [lastSaved, setLastSaved] = useState<Date>();

    const startSaving = () => setStatus('saving');

    const markSaved = () => {
        setStatus('saved');
        setLastSaved(new Date());
    };

    const markError = () => setStatus('error');

    const markOffline = () => setStatus('offline');

    const reset = () => setStatus('idle');

    return {
        status,
        lastSaved,
        startSaving,
        markSaved,
        markError,
        markOffline,
        reset,
    };
}
