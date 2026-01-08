import React, { memo } from 'react';
import { Loader2 } from 'lucide-react';

// Memoized to prevent unnecessary re-renders
const LoadingSpinner = memo(() => {
    return (
        <div className="flex h-full min-h-[200px] w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
